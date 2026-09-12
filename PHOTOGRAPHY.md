# Photography

**Stock imagery is not a substitute for anything on this list.** Every photo
slot is filled from the masters in `pics/`; only the intro video (shot 6) is
still to come. *Current exports* below records how each master was cut, and
where a master ended up in a slot other than its shot-list one.

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
| 4 | Sand tray with a child's hands | 4:5 | `play-therapy.html`, "It's quieter than it looks" (at 3:2) |
| 5 | Two parents mid-conversation, candid | 3:2 | `for-parents.html`, "Reading first is fine too" |
| 6 | Intro video, 60–90 seconds, Kristina explaining why she works this way | 16:9 | Not yet placed. Needs captions **and** a transcript |

Also needed, though not a photograph: a 1200×630 crop of shot 2 for
`og:image` / `twitter:image` on every page.

## Current exports

Cut by `tools/export-photos.mjs`, which holds the crop box for each master.
Replace a master and re-run it; a master with a different frame needs its box
revisited, so run it with `--preview` first and look.

| Master | Exports | Notes |
|---|---|---|
| `pics/6.jpg` | `hero-*` | A still rather than the video, standing in for shot 1: the child from behind holding up a puppet, Kristina smiling back across the table, the sand tray between them. A full-height 4:5 crop. |
| `pics/1.jpg` | none | Shot 1, replaced as the home hero by `pics/6.jpg`. The master is 3:2, and at 4:5 it holds Kristina or the child, never both; the child's face also shows in profile. |
| `pics/2.jpg` | `portrait-*`, `og-portrait-1200.jpg` | 4:5 near full frame. The og crop runs brow to collarbone: a 1.9:1 band cannot hold the whole head. |
| `pics/3.jpg` | `play-space-*`, `og-play-space-1200.jpg` | Kristina at the table with the sand tray and shelves behind, rather than the empty wide room the shot list asks for. `og-play-space` is on `play-therapy.html`; every other page with an og:image uses `og-portrait`. |
| `pics/5.jpg` | `parents-*` | Kristina with one parent seen from behind, rather than two parents. A 3:2 band from the top of a portrait-format master. |
| `pics/4.jpg` | `sand-tray-*` | On `play-therapy.html` at 3:2, in a text-and-photo split like About's "Where we'd meet". The master is 5:4 landscape, so 3:2 keeps the whole width. |

## Resolution and export

These numbers are measured, not estimated: every slot was rendered across 23
viewport widths from 320px to 2560px and the largest box each one ever occupies
was recorded.

One result is counter-intuitive and worth knowing before you export anything.
**The photographs are at their largest at a 900px viewport, not on a desktop.**
900px is the widest the layout is still a single column, so the image spans the
full content width there; above 900px it drops into a side-by-side column and
gets *narrower*. Sizing for a 27-inch monitor would over-deliver on desktop and
still under-deliver on a tablet.

| Slot | Largest CSS box | Export at 1× | Export at 2× |
|---|---|---|---|
| Home hero, 4:5 | 821 × 1026 | 840 × 1050 | **1700 × 2125** |
| About portrait, 4:5 | 821 × 1026 | 840 × 1050 | **1700 × 2125** |
| Home "Hi, I'm Kristina", 4:5 | 420 × 525 | 440 × 550 | **900 × 1125** |
| Play space, 16:9 | 821 × 462 | 840 × 473 | **1700 × 956** |
| Two parents, 3:2 | 821 × 547 | 840 × 560 | **1700 × 1133** |
| Child page sand tray, 3:2 | 821 × 547 | 840 × 560 | **1700 × 1133** |

Two exports per shot, at 1× and 2×, wired through `srcset`. There is no 3×
export: the only devices with that pixel density are phones, and a phone is
never wider than about 430 CSS px, so its 3× demand (about 1170px) is already
covered by the 2× file.

Also needed:

| Asset | Size | Notes |
|---|---|---|
| `og:image` | 1200 × 630 | Crop of the primary portrait. One per page, or one shared. |
| Directory portrait | 1000 × 1000 | Square crop for Jane, BCACC, BCPTA, Psychology Today, Google Business Profile. Same portrait everywhere — that consistency is the point. |
| Intro video | 1920 × 1080 | MP4 (H.264) plus WebM. Captions and a transcript are required. |
| Video poster | 1700 × 956 | A still from the video, same treatment as the photographs. |

### Masters

Keep the full-resolution originals, **minimum 3000px on the long edge**, and
retain the RAW files. The feeling shapes and this photography are both meant to
carry over to print — wall vinyl for the play room, stickers, the cover of an
intake pack, a future sign — and none of that can be cut from a 1700px web
export.

The masters live in `pics/`, which is git-ignored and so never deployed:
Cloudflare Pages serves the repo root, and a committed master would be
published at full resolution with its EXIF. That also means git is not backing
them up, so keep a copy somewhere else.

### File formats and budget

AVIF and WebP with a JPEG fallback, sRGB, embedded colour profile. Rough
targets, per image:

| Format | 2× export | 1× export |
|---|---|---|
| AVIF | ≤ 90 KB | ≤ 30 KB |
| WebP | ≤ 160 KB | ≤ 55 KB |
| JPEG | quality ~78 | quality ~78 |

The home hero is preloaded and is the LCP element on the page most people land
on, so keep that one leanest of all. Most enquiries arrive from a phone late at
night, often on a rural connection.

### Strip the metadata

**Remove EXIF from every file before it ships, GPS coordinates especially.**
The office address is deliberately not published — `contact.html` says it is
sent with the first booking — and a geotagged photograph of the play room
publishes it anyway. This applies to the room and sand-tray shots in
particular. `tools/export-photos.mjs` strips everything except the sRGB colour
profile; anything exported another way, spot-check with `exiftool`.

## Markup

Each slot is a ratio wrapper around a `<picture>`:

```html
<div class="photo photo--4x5">
  <picture>
    <source type="image/avif"
            srcset="assets/img/hero-840.avif 840w, assets/img/hero-1700.avif 1700w"
            sizes="(min-width: 901px) 45vw, 92vw">
    <source type="image/webp"
            srcset="assets/img/hero-840.webp 840w, assets/img/hero-1700.webp 1700w"
            sizes="(min-width: 901px) 45vw, 92vw">
    <img src="assets/img/hero-840.jpg" width="1700" height="2125"
         alt="A child kneeling at a low table, hands deep in a sand tray."
         loading="lazy" decoding="async">
  </picture>
</div>
```

The `sizes` value rounds up slightly rather than trying to model the grid
exactly — over-fetching a little is cheaper than a soft image. For the narrower
"Hi, I'm Kristina" slot use `sizes="(min-width: 901px) 420px, 92vw"` with the
900w and 440w exports.

Notes:

- The `<picture>` fills the wrapper and `.photo img` is `width:100%;
  height:100%; object-fit:cover`, so the wrapper's ratio class governs the crop.
- **The hero image on each page is the exception:** drop `loading="lazy"`, add
  `fetchpriority="high"`, and preload the AVIF in that page's `<head>` with the
  same `srcset` and `sizes`:
  `<link rel="preload" as="image" type="image/avif" imagesrcset="…" imagesizes="…" fetchpriority="high">`.
  A plain `href` preload of the JPEG would be a second download on top of the
  AVIF the `<picture>` picks. It is the LCP element, and most enquiries arrive
  from a phone late at night.
- Always set `width` and `height` on the `<img>` so nothing shifts as it loads.
- AVIF and WebP with a JPG fallback.

## Alt text

Real alt text on every photograph, never a filename and never "photo of
Kristina". Describe what a person who cannot see it would need: what is in the
frame and what it conveys. Decorative crayon shapes are `aria-hidden="true"` and
take no alt text — that is already handled.
