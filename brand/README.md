# Kristina Dixon Counselling — logo assets

The logo is lock-up **4d, "Together, one filled"**: two overlapping hand-drawn
rings — the left filled in sky, the right an outlined charcoal ring — beside a
two-line stacked wordmark. The two rings are the child and the parent, and the
geometry is the **Together** feeling shape from the identity's illustration
set, so the logo and the illustration are the same drawing.

## Files

| File | Use |
|---|---|
| `lockup.svg` | Master horizontal lock-up, full colour, for light grounds |
| `lockup-reversed.svg` | Lock-up reversed on charcoal (outline and wordmark warm white) |
| `lockup-one-colour.svg` | One-colour version for stamps, stickers, single-colour print — everything is `currentColor`; edit the `color` style on the root element to re-ink |
| `mark-charcoal.svg` / `mark-sky.svg` / `mark-warm-white.svg` | Single-ring fallback mark alone |
| `favicon-16.png` / `favicon-32.png` / `favicon-512.png` / `apple-touch-icon-180.png` | Favicon set from the single-ring mark, charcoal on warm white |
| `avatar.svg` / `avatar-512.png` | Square avatar of the two-ring mark, charcoal on warm white, for Jane and the directories |

The wordmark in the lock-up files is Apfel Grotezk Regular converted to
outlines (26px against a 76px mark, `line-height 1.16`,
`letter-spacing -.019em`), so the files need no font installed and are
print-ready. The face is OFL-licensed; the licence ships in
`../assets/fonts/ApfelGrotezk-OFL.txt`.

## Geometry

One authored crayon path, used twice, in a `0 0 152 100` viewBox; the right
ring is the same path translated 52 units right (about 41% overlap). Aspect
ratio 1.52:1 — width is always `round(height × 1.52)`.

The wobble is **authored, not generated**. The path must be byte-identical in
every instance: never apply a turbulence or displacement filter, never
regenerate the shake, and inline the path per instance rather than sharing it
through `<defs>`/`<use>` (which broke export pipelines in review).

## Rules

- Filled ring always **left**, always sky `#8FB0C4`. Outlined ring always
  **right**, always charcoal `#33302B` (warm white `#FBF7F0` reversed on
  charcoal).
- Stroke weight rises as the render size falls: 5 at 76px, 6 at 40px, 7.5 at
  26px. These are the only sizes; do not interpolate new ones.
- Below 20px the overlap muddies: use the **single-ring fallback** alone
  (mark-*.svg) — never beside the two-ring mark, and never as a shrunken
  overlap.
- Clear space on all sides equals the height of the mark. Minimum lock-up
  width 180px before falling back to the single-ring mark alone.
- Wordmark is always two stacked lines, sentence case, weight 400. Never
  all-caps, never a heavier weight.
- One colour: filled ring solid in the ink, outlined ring in the same ink —
  the fill-versus-outline contrast carries the mark. Greyscale must keep the
  two rings reading as two distinct forms.
