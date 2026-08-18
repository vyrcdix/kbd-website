# Kristina Dixon Counselling — logo assets

The logo is lock-up **4d, "Together, one filled"**: two overlapping hand-drawn
rings — the left filled in sky and stroked in the same sky so its crayon edge
stays visible, the right an outlined charcoal ring — beside a two-line stacked
wordmark whose second line, the descriptor, is coral. The two rings are the child and the parent, and the
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
outlines (26px against a 76px mark, absolute `line-height 28px`,
`letter-spacing -.019em`, weight 400 only), so the files need no font
installed and are print-ready. The leading is absolute because the two-line
block must never exceed the height of the rings: 56px against the 76px mark
here, 36px against 46px in the site header, 29px against 29px in the footer.
The face is OFL-licensed; the licence ships in
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
- The filled ring carries a stroke in **its own fill colour**, so it reads as
  one form with a drawn edge rather than an outlined shape. Without it the flat
  fill reads as a soft blob beside the very shaky outlined ring and the two stop
  looking like siblings. Sky stroke 1.4 at 76px, 1.7 at 46px, 2.1 at 29px.
- Outlined-ring stroke weight rises as the render size falls: 5 at 76px, 6 at
  46px, 7.5 at 29px. These are the only sizes; do not interpolate new ones.
- The descriptor line is **coral**, and the value flips with the ground because
  no single one clears AA on both: `#A85742` on warm white (4.8:1) and
  `#E39684` on charcoal (5.6:1). Swapped, both fail — about 2:1 and 2.4:1.
  Yellow `#F2C879` is not a third option; it is unusable as type on warm white
  at any size. The name itself stays charcoal on light, warm white on dark.
  The supervision sub-brand carries no coral at all.
- Below 20px the overlap muddies: use the **single-ring fallback** alone
  (mark-*.svg) — never beside the two-ring mark, and never as a shrunken
  overlap.
- Clear space on all sides equals the height of the mark. Minimum lock-up
  width 180px before falling back to the single-ring mark alone.
- Wordmark is always two stacked lines, sentence case, weight 400. Never
  all-caps, never a heavier weight.
- One colour: filled ring solid in the ink and stroked in the same ink,
  outlined ring in that ink too, and the descriptor in it as well — there is no
  second colour to flip, so one-colour output carries no coral. The
  fill-versus-outline contrast carries the mark. Greyscale must keep the two
  rings reading as two distinct forms, and the descriptor reading as
  subordinate to the name.
