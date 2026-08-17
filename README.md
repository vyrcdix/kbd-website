# kristinadixon.ca

Static site for Kristina Dixon Counselling — play therapy for children in
Penticton and the South Okanagan.

Built from `design-doc/design_handoff_kristina_dixon_website/`. Hand-written
HTML and CSS: **no framework, no build step, no `npm install`.** Open any
`.html` file in a browser and it works.

## Run it

Nothing to install. Either open `index.html` directly, or serve the folder so
that root-relative paths behave exactly as they will in production:

```sh
python -m http.server 8080     # or: npx serve .
```

## Structure

```
index.html               Home
play-therapy.html        For your child
for-parents.html         For you
about.html               About Kristina
fees.html                Fees & funding
contact.html             Contact — the message form
for-counsellors.html     Supervision sub-brand ("Supervision" in the nav)
thanks.html              Form success page
404.html                 Not found
assets/css/site.css      The whole stylesheet
assets/js/site.js        Form validation. Loaded only by contact.html
assets/js/analytics.js   GA4 config and conversion events
assets/fonts/*.woff2     Self-hosted: Apfel Grotezk 400, Instrument Sans 400/500
assets/img/              Photography goes here — see PHOTOGRAPHY.md
tools/check-shapes.mjs   Feeling-shape placement check
tools/check-contrast.mjs WCAG contrast check on rendered text
netlify.toml             Publish config, headers, redirects
```

There is deliberately no templating. The header and footer are repeated in each
page; a change to either is a find-and-replace across the seven site pages.
That is the cost of having no build step, and it was the explicit instruction.

## The design rules the CSS enforces

From `design-handback-type-and-colour.md`. These are not preferences:

- **No gradients.** Sections separate by a hard colour change, a 1px rule, or
  space. Nothing else.
- **No box-shadows**, anywhere.
- **`border-radius: 999px` on buttons only.** Everything else is square.
- **All text is charcoal** (`#33302B`), or warm white on charcoal. Yellow, sky
  and coral are block and shape colours; they never carry text.
- **Hierarchy is size and space, never weight.** The display face ships in
  weight 400 only — no heavier file exists to reach for.
- **Coral is never the lead accent** on the warm-white ground, and never a CTA.
- **One CTA wording site-wide: "Send me a message."** It is now the only
  button on the site: the Jane booking links were removed, which took the
  "Book a free 15-minute call" secondary control with them. Secondary actions
  are plain links.

## Feeling shapes

Six shapes, built from five authored crayon paths (see the handoff's
*Shape paths*). The paths are inlined per instance rather than shared through
`<defs>` and `<use>`, which broke export pipelines during design review. The
wobble is authored, never generated at runtime, and never an SVG turbulence
filter — it must be identical in every instance and it must print.

A shape crops off the edge of its section and **never sits behind text or over
an interactive control**. That was a real defect caught in review, so it is
checked mechanically:

```sh
npm install puppeteer-core        # in a scratch folder; the site has no deps
node tools/check-shapes.mjs .
node tools/check-contrast.mjs .
```

Both render every page across thirteen viewport widths and exit non-zero on a
failure. Run them after changing any section's copy, width, or shape placement.

## Type

Display is **Apfel Grotezk Regular** (Collletttivo), the handoff's first
choice, self-hosted under the SIL OFL 1.1 — the licence sits beside the file in
`assets/fonts/`. Only weight 400 ships. The family also has Fett, Satt and
Brukt; none is in the repo, so nothing can reach for a heavier cut and
reintroduce the weight-jump hierarchy the handback ruled out. The family name
is behind `--font-display`, referenced nowhere else.

Body is **Instrument Sans** 400/500 plus a 400 italic, latin and latin-ext
subsets.

## Analytics

GA4, measurement ID `G-G0EFPKYL7X`. The gtag config lives in
`assets/js/analytics.js` rather than an inline `<script>`, which is what lets
the CSP in `netlify.toml` stay strict — there is no `'unsafe-inline'` anywhere.

Three conversions, per the brief: `generate_lead` (fired by `thanks.html` via
`data-ga-event`), `phone_tap`, and `email_tap`. One delegated click listener
handles the last two, so a page that gains a phone number needs no rewiring.

## Contact form

Netlify Forms. `contact.html` posts to `/thanks.html`; the honeypot is
`bot-field`. No third-party modal, no serverless function, no API key. One
field is required — a way to reply — and the error is rendered as text beside
the field by `assets/js/site.js`. With JavaScript off the browser's own
required-field handling takes over and the form still submits.

## Before this goes live

Every photograph is still a striped placeholder, and the phone number, email,
address and fees are the design document's placeholders that need Kristina's
confirmation. See `PHOTOGRAPHY.md` for the shot list and the swap procedure.
