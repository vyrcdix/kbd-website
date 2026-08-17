/* Exercises functions/api/contact.js end to end against a stubbed Fastmail, so
 * the JMAP request shapes are verified rather than assumed. The one thing it
 * cannot prove is that Fastmail accepts the submission — that needs a real
 * token, and the deploy checklist covers it with a live test message.
 *
 * No dependencies and no test runner; Node has everything this needs.
 *
 *   node tools/contact.test.mjs
 */
import { onRequestPost, onRequest } from '../functions/api/contact.js';

let pass = 0, failed = 0;
const ok = (name, cond, extra) => {
  if (cond) { pass++; console.log('PASS  ' + name); }
  else { failed++; console.log('FAIL  ' + name); if (extra !== undefined) console.log('      got:', JSON.stringify(extra)); }
};

const ENV = {
  FASTMAIL_API_TOKEN: 'test-token',
  CONTACT_TO: 'hello@kristinadixon.ca',
  CONTACT_FROM: 'forms@kristinadixon.ca',
  JMAP_SESSION_URL: 'https://stub.invalid/jmap/session',
};

let calls = [];
function stubFetch(opts) {
  const o = opts || {};
  globalThis.fetch = async (url, init) => {
    const body = init && init.body ? JSON.parse(init.body) : null;
    calls.push({ url: String(url), auth: init.headers.Authorization, body });
    if (String(url).endsWith('/jmap/session')) {
      return new Response(JSON.stringify({
        apiUrl: 'https://stub.invalid/jmap/api/',
        primaryAccounts: { 'urn:ietf:params:jmap:mail': 'acct1' },
      }), { status: 200 });
    }
    const names = body.methodCalls.map((c) => c[0]);
    if (names.includes('Identity/get')) {
      return new Response(JSON.stringify({ methodResponses: [
        ['Identity/get', { list: o.identities || [
          { id: 'idOther', email: 'kristina@kristinadixon.ca' },
          { id: 'idForms', email: 'forms@kristinadixon.ca' },
        ] }, 'i'],
        ['Mailbox/query', { ids: ['mbDrafts'] }, 'm'],
      ] }), { status: 200 });
    }
    return new Response(JSON.stringify({ methodResponses: [
      ['Email/set', o.failEmailSet ? { notCreated: { draft: { type: 'tooLarge' } } } : { created: { draft: { id: 'em1' } } }, 'e'],
      ['EmailSubmission/set', { created: { submission: { id: 'sub1' } } }, 's'],
    ] }), { status: 200 });
  };
}

const post = (fields, headers) => {
  const fd = new FormData();
  for (const k of Object.keys(fields)) fd.append(k, fields[k]);
  return {
    request: new Request('https://kristinadixon.ca/api/contact', { method: 'POST', body: fd, headers: headers || {} }),
    env: ENV,
  };
};

let res;

/* 1. Happy path, no JavaScript */
calls = []; stubFetch();
res = await onRequestPost(post({ name: 'Sam Rivera', reply: 'sam@example.com', note: 'My daughter is 7 and struggling.' }));
ok('valid submit redirects to /thanks.html', res.status === 303 && res.headers.get('location') === 'https://kristinadixon.ca/thanks.html', res.headers.get('location'));
ok('session fetched with bearer token', calls[0].url.endsWith('/jmap/session') && calls[0].auth === 'Bearer test-token');
ok('lookup asks for Identity and the Drafts mailbox', calls[1].body.methodCalls[0][0] === 'Identity/get' && calls[1].body.methodCalls[1][1].filter.role === 'drafts');
ok('declares the submission capability', calls[1].body.using.indexOf('urn:ietf:params:jmap:submission') > -1);

const send = calls[2].body.methodCalls;
const draft = send[0][1].create.draft;
ok('From is on the domain, not the visitor', draft.from[0].email === 'forms@kristinadixon.ca', draft.from);
ok('Reply-To carries the visitor address', draft.replyTo && draft.replyTo[0].email === 'sam@example.com', draft.replyTo);
ok('To is the practice inbox', draft.to[0].email === 'hello@kristinadixon.ca');
ok('draft filed in the Drafts mailbox', draft.mailboxIds.mbDrafts === true, draft.mailboxIds);
ok('subject names the sender', draft.subject === 'Website message from Sam Rivera', draft.subject);
ok('body carries name, reply and note', /Sam Rivera/.test(draft.bodyValues.body.value) && /sam@example.com/.test(draft.bodyValues.body.value) && /daughter is 7/.test(draft.bodyValues.body.value));
ok('identity matched on CONTACT_FROM, not first in list', send[1][1].create.submission.identityId === 'idForms', send[1][1].create.submission);
ok('submission back-references the draft', send[1][1].create.submission.emailId === '#draft');
ok('draft destroyed after sending', JSON.stringify(send[1][1].onSuccessDestroyEmail) === '["#submission"]');

/* 2. Phone instead of email */
calls = []; stubFetch();
res = await onRequestPost(post({ name: '', reply: '250 555 0134', note: '' }));
ok('phone-only submit still sends', res.status === 303 && res.headers.get('location').endsWith('/thanks.html'));
ok('no Reply-To when the reply field is not an email', calls[2].body.methodCalls[0][1].create.draft.replyTo === undefined);
ok('subject falls back when no name given', calls[2].body.methodCalls[0][1].create.draft.subject === 'Website message');

/* 3. Honeypot */
calls = []; stubFetch();
res = await onRequestPost(post({ 'bot-field': 'buy pills', reply: 'x@y.com' }));
ok('honeypot gets the same thank-you a person would', res.status === 303 && res.headers.get('location').endsWith('/thanks.html'));
ok('honeypot sends no mail', calls.length === 0, calls.length);

/* 4. Missing required field */
res = await onRequestPost(post({ name: 'Sam', reply: '   ' }));
ok('empty reply field goes back to the form', res.status === 303 && res.headers.get('location').indexOf('/contact.html#field-reply') > -1, res.headers.get('location'));

/* 5. JSON mode, which is what site.js uses */
calls = []; stubFetch();
res = await onRequestPost(post({ reply: 'a@b.com' }, { Accept: 'application/json' }));
ok('JSON mode returns ok true', res.status === 200 && (await res.json()).ok === true);

calls = []; stubFetch({ failEmailSet: true });
res = await onRequestPost(post({ reply: 'a@b.com' }, { Accept: 'application/json' }));
ok('JMAP rejection surfaces as ok false', res.status === 502 && (await res.json()).ok === false);

/* 6. Upstream failure without JavaScript */
calls = []; stubFetch({ failEmailSet: true });
res = await onRequestPost(post({ reply: 'a@b.com' }));
ok('send failure lands on /message-not-sent.html', res.status === 303 && res.headers.get('location').endsWith('/message-not-sent.html'));

/* 7. Misconfiguration must fail closed */
globalThis.fetch = async () => { throw new Error('should not be called'); };
res = await onRequestPost({ request: post({ reply: 'a@b.com' }).request, env: { CONTACT_TO: 'x' } });
ok('missing secrets fail closed, not silently', res.status === 303 && res.headers.get('location').endsWith('/message-not-sent.html'));

/* 8. GET */
res = await onRequest({ request: new Request('https://kristinadixon.ca/api/contact'), env: ENV });
ok('GET redirects to the contact page', res.status === 303 && res.headers.get('location').endsWith('/contact.html'));

/* 9. Oversized input is truncated rather than rejected */
calls = []; stubFetch();
await onRequestPost(post({ name: 'x'.repeat(500), reply: 'a@b.com', note: 'y'.repeat(9000) }));
const big = calls[2].body.methodCalls[0][1].create.draft;
ok('long name truncated to 120', big.subject.length === 'Website message from '.length + 120, big.subject.length);
ok('long note truncated to 4000', big.bodyValues.body.value.indexOf('y'.repeat(4000)) > -1 && big.bodyValues.body.value.indexOf('y'.repeat(4001)) === -1);

console.log('\n' + pass + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
