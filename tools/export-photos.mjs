/* Photograph export.
 *
 * Crops each master in pics/ to its slot's ratio and writes AVIF, WebP and
 * JPEG at the widths PHOTOGRAPHY.md specifies, into assets/img/. sharp drops
 * all metadata — EXIF, XMP, GPS — by default; only an sRGB profile is embedded.
 *
 * Requires sharp. There is no package.json here on purpose — the site itself
 * has no build step and no dependencies.
 *
 *   npm install --no-save sharp         # in the repo root; node_modules/ is ignored
 *   node tools/export-photos.mjs [siteDir]
 *   node tools/export-photos.mjs [siteDir] --preview   # 600px crops in pics/preview/
 *
 * Crop boxes are in master pixels, so a master replaced with a different frame
 * needs its box revisited. Run --preview first and look at the crops.
 */
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const SITE = path.resolve(args.find((a) => !a.startsWith('--')) ?? process.cwd());
const PREVIEW = args.includes('--preview');
const MASTERS = path.join(SITE, 'pics');

/* box is [left, top, width, height] in the master. */
const JOBS = [
  /* index.html hero: the child from behind with a puppet, Kristina smiling back.
     Photo 1 was here first, but at 4:5 it holds Kristina or the child, never both.
     This is the preloaded LCP image, so it runs a little leaner than the rest. */
  { name: 'hero', src: '6.jpg', box: [2550, 0, 2702, 3378], widths: [840, 1700],
    quality: { avif: 46 } },

  /* about.html hero at 840/1700; index.html "Hi, I'm Kristina" at 440/900.
     Hair and knit texture make this the heaviest frame, so it runs a little
     lower to stay inside the budget. */
  { name: 'portrait', src: '2.jpg', box: [6, 0, 3989, 4986], widths: [440, 840, 900, 1700],
    quality: { avif: 40, webp: 62 } },

  /* about.html, "Where we'd meet". */
  { name: 'play-space', src: '3.jpg', box: [0, 1, 6000, 3375], widths: [840, 1700] },

  /* for-parents.html, "Reading first is fine too". A 3:2 band from the top of
     a portrait-format master. */
  { name: 'parents', src: '5.jpg', box: [0, 300, 2626, 1750], widths: [840, 1700] },

  /* play-therapy.html, "It's quieter than it looks". */
  { name: 'sand-tray', src: '4.jpg', box: [0, 300, 5002, 3335], widths: [840, 1700] },

  /* og:image. Brow to collarbone: a 1.9:1 band cannot hold the whole head, and
     losing the crown reads better than losing the chin. */
  { name: 'og-portrait', src: '2.jpg', box: [0, 1000, 4000, 2100], widths: [1200], jpegOnly: true },
  { name: 'og-play-space', src: '3.jpg', box: [0, 114, 6000, 3150], widths: [1200], jpegOnly: true },

  /* Directory listings: Jane, BCACC, BCPTA, Psychology Today, Google Business
     Profile. Not used on the site. Head and shoulders at the master's full
     width; a higher JPEG quality, since every directory recompresses it. */
  { name: 'directory-portrait', src: '2.jpg', box: [0, 0, 4000, 4000], widths: [1000],
    jpegOnly: true, quality: { jpeg: 90 } },
];

/* Tuned against the per-image budget in PHOTOGRAPHY.md. */
const QUALITY = { avif: 52, webp: 72, jpeg: 78 };

const outDir = PREVIEW ? path.join(MASTERS, 'preview') : path.join(SITE, 'assets/img');
fs.mkdirSync(outDir, { recursive: true });

const kb = (file) => `${(fs.statSync(file).size / 1024).toFixed(0).padStart(4)} KB`;

for (const job of JOBS) {
  const [left, top, width, height] = job.box;
  const crop = () => sharp(path.join(MASTERS, job.src)).rotate().extract({ left, top, width, height });

  if (PREVIEW) {
    const file = path.join(outDir, `${job.name}.jpg`);
    await crop().resize({ width: 600 }).jpeg({ quality: 80 }).toFile(file);
    console.log(path.relative(SITE, file));
    continue;
  }

  for (const w of job.widths) {
    const h = Math.round(w * height / width);
    const sized = () => crop().resize({ width: w, height: h, fit: 'fill' }).withIccProfile('srgb');
    const q = { ...QUALITY, ...job.quality };
    const stem = path.join(outDir, `${job.name}-${w}`);
    const outputs = [[`${stem}.jpg`, sized().jpeg({ quality: q.jpeg, mozjpeg: true })]];
    if (!job.jpegOnly) {
      outputs.push([`${stem}.avif`, sized().avif({ quality: q.avif, effort: 6 })]);
      outputs.push([`${stem}.webp`, sized().webp({ quality: q.webp, effort: 6, smartSubsample: true })]);
    }
    for (const [file, pipeline] of outputs) {
      await pipeline.toFile(file);
      console.log(`${path.basename(file).padEnd(26)} ${`${w}x${h}`.padEnd(10)} ${kb(file)}`);
    }
  }
}
