/**
 * POST /api/contact — the message form.
 *
 * Cloudflare Pages Function. Sends through Fastmail's JMAP API, so the path a
 * parent's message takes is browser -> Cloudflare -> Fastmail and nothing else.
 * No third-party form service, and nothing is written to storage: the message
 * is relayed and forgotten.
 *
 * Required environment variables (Pages project -> Settings -> Variables):
 *   FASTMAIL_API_TOKEN   API token with mail read/write, stored as a secret
 *   CONTACT_TO           where messages land, e.g. hello@kristinadixon.ca
 *   CONTACT_FROM         the sending identity, e.g. forms@kristinadixon.ca
 *
 * CONTACT_FROM must be an address the token's account is allowed to send as,
 * and it must be on the domain, so SPF and DKIM pass. The visitor's address
 * goes in Reply-To, never in From — spoofing them would fail DMARC and the
 * message would be filed as spam, which on this site means a family that did
 * not get an answer.
 */

/* Overridable only so the send path can be exercised against a stub in tests;
   in production nothing sets it. */
const DEFAULT_SESSION_URL = 'https://api.fastmail.com/jmap/session';

const CAPABILITIES = [
  'urn:ietf:params:jmap:core',
  'urn:ietf:params:jmap:mail',
  'urn:ietf:params:jmap:submission',
];

const LIMITS = { name: 120, reply: 200, note: 4000 };

export async function onRequestPost(context) {
  const { request, env } = context;
  const origin = new URL(request.url).origin;
  const wantsJson = (request.headers.get('accept') || '').includes('application/json');

  let form;
  try {
    form = await request.formData();
  } catch (error) {
    return fail(origin, wantsJson, 'unreadable-form');
  }

  /* Honeypot. A bot that fills it gets the same thank-you a person would, so
     it has nothing to learn from the response. */
  if (field(form, 'bot-field')) {
    return succeed(origin, wantsJson);
  }

  const name = field(form, 'name').slice(0, LIMITS.name);
  const reply = field(form, 'reply').slice(0, LIMITS.reply);
  const note = field(form, 'note').slice(0, LIMITS.note);

  /* One field is required: a way to answer. The browser and site.js both
     enforce this already; this is the backstop. */
  if (!reply) {
    return wantsJson
      ? json({ ok: false, reason: 'missing-reply' }, 422)
      : seeOther(origin + '/contact.html#field-reply');
  }

  if (!env.FASTMAIL_API_TOKEN || !env.CONTACT_TO || !env.CONTACT_FROM) {
    console.error('contact: missing FASTMAIL_API_TOKEN, CONTACT_TO or CONTACT_FROM');
    return fail(origin, wantsJson, 'not-configured');
  }

  try {
    await send(env, {
      name: name,
      reply: reply,
      note: note,
      country: request.headers.get('cf-ipcountry') || '',
    });
  } catch (error) {
    console.error('contact: send failed', error && error.message);
    return fail(origin, wantsJson, 'send-failed');
  }

  return succeed(origin, wantsJson);
}

/* Anything other than a POST belongs on the page itself. */
export async function onRequest(context) {
  if (context.request.method === 'POST') return onRequestPost(context);
  return seeOther(new URL(context.request.url).origin + '/contact.html');
}

/* -------------------------------------------------------------------------
   Fastmail JMAP
   ---------------------------------------------------------------------- */

async function send(env, message) {
  const token = env.FASTMAIL_API_TOKEN;
  const sessionUrl = env.JMAP_SESSION_URL || DEFAULT_SESSION_URL;

  const session = await call(sessionUrl, token);
  const accountId =
    session.primaryAccounts && session.primaryAccounts['urn:ietf:params:jmap:mail'];
  if (!accountId) throw new Error('no mail account on this token');

  const apiUrl = new URL(session.apiUrl, sessionUrl).toString();

  /* Two round trips rather than one. The identity and the Drafts mailbox have
     to be resolved to real ids before the submission can reference them, and
     splitting it keeps failures legible in the logs. */
  const lookup = await call(apiUrl, token, [
    ['Identity/get', { accountId: accountId, ids: null }, 'i'],
    ['Mailbox/query', { accountId: accountId, filter: { role: 'drafts' } }, 'm'],
  ]);

  const identities = response(lookup, 'i').list || [];
  const identity =
    identities.find(function (id) {
      return (id.email || '').toLowerCase() === env.CONTACT_FROM.toLowerCase();
    }) || identities[0];
  if (!identity) throw new Error('no sending identity for ' + env.CONTACT_FROM);

  const draftsId = (response(lookup, 'm').ids || [])[0];
  if (!draftsId) throw new Error('no drafts mailbox');

  const email = {
    mailboxIds: {},
    keywords: { $draft: true },
    from: [{ name: 'Website message', email: env.CONTACT_FROM }],
    to: [{ email: env.CONTACT_TO }],
    subject: subject(message.name),
    bodyValues: { body: { value: body(message), charset: 'utf-8' } },
    textBody: [{ partId: 'body', type: 'text/plain' }],
  };
  email.mailboxIds[draftsId] = true;

  /* Reply-To carries the visitor's address so hitting reply just works, while
     From stays on the domain so the message authenticates. */
  if (looksLikeEmail(message.reply)) {
    email.replyTo = [{ name: message.name || null, email: message.reply }];
  }

  const sent = await call(apiUrl, token, [
    ['Email/set', { accountId: accountId, create: { draft: email } }, 'e'],
    [
      'EmailSubmission/set',
      {
        accountId: accountId,
        create: { submission: { emailId: '#draft', identityId: identity.id } },
        /* Send it, then bin the draft so Drafts does not slowly fill up. */
        onSuccessDestroyEmail: ['#submission'],
      },
      's',
    ],
  ]);

  const created = response(sent, 'e');
  if (!created.created || !created.created.draft) {
    throw new Error('Email/set rejected: ' + JSON.stringify(created.notCreated || {}));
  }

  const submitted = response(sent, 's');
  if (!submitted.created || !submitted.created.submission) {
    throw new Error(
      'EmailSubmission/set rejected: ' + JSON.stringify(submitted.notCreated || {})
    );
  }
}

async function call(url, token, methodCalls) {
  const init = {
    headers: {
      Authorization: 'Bearer ' + token,
      Accept: 'application/json',
    },
  };

  if (methodCalls) {
    init.method = 'POST';
    init.headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify({ using: CAPABILITIES, methodCalls: methodCalls });
  }

  const res = await fetch(url, init);
  if (!res.ok) {
    throw new Error('JMAP ' + url + ' returned ' + res.status);
  }
  return res.json();
}

/* Pull one method response out of a JMAP batch by its call id. */
function response(payload, callId) {
  const calls = (payload && payload.methodResponses) || [];
  for (let i = 0; i < calls.length; i++) {
    if (calls[i][2] === callId) {
      if (calls[i][0] === 'error') {
        throw new Error('JMAP error on "' + callId + '": ' + JSON.stringify(calls[i][1]));
      }
      return calls[i][1];
    }
  }
  throw new Error('no JMAP response for "' + callId + '"');
}

/* -------------------------------------------------------------------------
   Message shape
   ---------------------------------------------------------------------- */

function subject(name) {
  return name ? 'Website message from ' + name : 'Website message';
}

function body(message) {
  const lines = [
    'Name:  ' + (message.name || '(not given)'),
    'Reply: ' + message.reply,
  ];
  if (message.country) lines.push('From:  ' + message.country);
  lines.push('');
  lines.push(message.note || '(no message)');
  lines.push('');
  lines.push('---');
  lines.push('Sent from the message form on kristinadixon.ca.');
  return lines.join('\n');
}

function field(form, key) {
  const value = form.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function looksLikeEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/* -------------------------------------------------------------------------
   Responses. Without JavaScript these are redirects to real pages; with it,
   site.js asks for JSON so a failure can be shown without losing what the
   person typed.
   ---------------------------------------------------------------------- */

function succeed(origin, wantsJson) {
  return wantsJson ? json({ ok: true }) : seeOther(origin + '/thanks.html');
}

function fail(origin, wantsJson, reason) {
  return wantsJson
    ? json({ ok: false, reason: reason }, 502)
    : seeOther(origin + '/message-not-sent.html');
}

function seeOther(location) {
  return new Response(null, { status: 303, headers: { Location: location } });
}

function json(payload, status) {
  return new Response(JSON.stringify(payload), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
