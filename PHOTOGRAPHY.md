# Photography

**Every image on the site is currently a striped placeholder. The site must not
launch with them, and stock imagery is not a substitute.**

## Direction

Candid and warm, real rooms and real light. Never stock-lit families on white.

Children's faces need explicit consent handling, so plan on **hands, materials,
room details and backs of heads** as the working fallback — assume no child's
face is usable and treat any that is as a bonus.

Kristina's own face is used generously. One primary portrait appears everywhere,
including Jane and the directory listings, so that a parent who finds her on
BCACC, BCPTA or Psychology Today sees the same person.

## Shot list

| # | Shot | Ratio | Used on |
|---|---|---|---|
| 1 | Kristina in the play space, candid, child mid-play | 4:5 | `index.html` hero |
| 2 | Kristina, primary portrait | 4:5 | `about.html` hero, `index.html` sky block, Jane, BCACC, BCPTA, Psychology Today, Google Business Profile |
| 3 | The play space, wide — sand tray, art materials, floor space | 16:9 | `about.html`, "Where we'd meet" |
| 4 | Sand tray with a child's hands | 4:5 | Not yet placed; hold for the play-therapy page or directories |
| 5 | Two parents mid-conversation, candid | 3:2 | `for-parents.html`, "Reading first is fine too" |
| 6 | Intro video, 60–90 seconds, Kristina explaining why she works this way | 16:9 | Not yet placed. Needs captions **and** a transcript |

Also needed, though not a photograph: a 1200×630 crop of shot 2 for
`og:image` / `twitter:image` on every page.

## Swapping a placeholder in

Each slot looks like this:

```html
<!-- PLACEHOLDER — replace with the real photograph and real alt text. -->
<div class="photo photo--4x5">
  <svg class="photo__stripes" aria-hidden="true" focusable="false">…</svg>
  <span class="photo__caption">PHOTO — candid, child mid-play in the room, 4:5</span>
</div>
```

Replace the whole inner content with a `<picture>`, keeping the wrapper and its
ratio class:

```html
<div class="photo photo--4x5">
  <picture>
    <source srcset="assets/img/play-space-hero.avif" type="image/avif">
    <source srcset="assets/img/play-space-hero.webp" type="image/webp">
    <img src="assets/img/play-space-hero.jpg" width="1000" height="1250"
         alt="A child kneeling at a low table, hands deep in a sand tray."
         loading="lazy" decoding="async">
  </picture>
</div>
```

Notes:

- `.photo > img` is already `width:100%; height:100%; object-fit:cover`, so the
  wrapper's ratio class governs the crop.
- **The hero image on each page is the exception:** drop `loading="lazy"` and add
  `<link rel="preload" as="image" href="…">` to that page's `<head>`. It is the
  LCP element, and most enquiries arrive from a phone late at night.
- Always set `width` and `height` on the `<img>` so nothing shifts as it loads.
- AVIF and WebP with a JPG fallback.

## Alt text

Real alt text on every photograph, never a filename and never "photo of
Kristina". Describe what a person who cannot see it would need: what is in the
frame and what it conveys. Decorative crayon shapes are `aria-hidden="true"` and
take no alt text — that is already handled.

## When the last placeholder is gone

Delete the placeholder scaffolding, which will then be dead code:

- the `<svg width="0" height="0">` stripe-pattern block near the top of
  `index.html`, `about.html` and `for-parents.html`,
- the `.photo__stripes` and `.photo__caption` rules in `assets/css/site.css`.
