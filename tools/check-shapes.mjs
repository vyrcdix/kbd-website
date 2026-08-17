/* Feeling-shape placement check.
 *
 * The handoff calls out one defect caught in review: a shape floating behind
 * text or over an interactive control. A shape must crop off the edge of its
 * section and touch nothing. This renders every page at a spread of widths and
 * fails if any shape's visible box intersects a line of text or a control.
 *
 * Requires a local Chrome and puppeteer-core. There is no package.json here on
 * purpose — the site itself has no build step and no dependencies.
 *
 *   npm install puppeteer-core          # anywhere, e.g. a scratch directory
 *   node tools/check-shapes.mjs [siteDir]
 *
 * Set CHROME_PATH if Chrome is not in the default Windows location.
 */
import puppeteer from 'puppeteer-core';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const SITE = path.resolve(process.argv[2] ?? process.cwd());
const CHROME = process.env.CHROME_PATH
  ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const PAGES = [
  'index.html', 'about.html', 'play-therapy.html', 'for-parents.html',
  'fees.html', 'contact.html', 'for-counsellors.html', 'thanks.html',
  'message-not-sent.html', '404.html',
];

const WIDTHS = [1600, 1440, 1280, 1180, 1080, 980, 900, 860, 760, 600, 414, 390, 360];

/* Sub-pixel rounding shouldn't fail a build. Anything a reader would notice
   as a shape touching a word is far larger than this. */
const TOLERANCE = 1.5;

const collect = () => {
  const rectsOf = (el) => {
    /* Measure the actual line boxes of the element's own text, not the block
       it sits in — a short last line should not read as a collision. */
    const out = [];
    for (const node of el.childNodes) {
      if (node.nodeType !== Node.TEXT_NODE) continue;
      if (!node.textContent.trim()) continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      out.push(...range.getClientRects());
    }
    return out;
  };

  const clipRect = (el) => {
    /* A shape is clipped by the nearest ancestor that hides its overflow, so
       only that intersection is actually painted. */
    let rect = el.getBoundingClientRect();
    for (let p = el.parentElement; p; p = p.parentElement) {
      const cs = getComputedStyle(p);
      if (cs.overflowX === 'visible' && cs.overflowY === 'visible') continue;
      const box = p.getBoundingClientRect();
      rect = {
        left: Math.max(rect.left, box.left),
        top: Math.max(rect.top, box.top),
        right: Math.min(rect.right, box.right),
        bottom: Math.min(rect.bottom, box.bottom),
      };
    }
    return rect;
  };

  const shapes = [...document.querySelectorAll('.shape')].map((el) => ({
    name: el.className.baseVal ?? el.getAttribute('class'),
    rect: clipRect(el),
  }));

  const INTERACTIVE = 'a, button, input, textarea, select, summary';
  const targets = [];
  for (const el of document.querySelectorAll('body *')) {
    if (el.closest('.shape')) continue;
    if (el.closest('[aria-hidden="true"]')) continue;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;

    for (const r of rectsOf(el)) {
      targets.push({ kind: 'text', tag: el.tagName.toLowerCase(), rect: r });
    }
    if (el.matches(INTERACTIVE) && el.offsetParent !== null) {
      targets.push({ kind: 'control', tag: el.tagName.toLowerCase(), rect: el.getBoundingClientRect() });
    }
    /* A shape must not drift across a photograph either. */
    if (el.matches('.photo')) {
      targets.push({ kind: 'photo', tag: el.tagName.toLowerCase(), rect: el.getBoundingClientRect() });
    }
  }

  return { shapes, targets };
};

const overlap = (a, b) => {
  const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
  const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
  return { w, h, hit: w > TOLERANCE && h > TOLERANCE };
};

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--allow-file-access-from-files', '--force-color-profile=srgb'],
});

let failures = 0;
let checked = 0;

for (const file of PAGES) {
  const page = await browser.newPage();
  await page.goto(pathToFileURL(path.join(SITE, file)).href, { waitUntil: 'load' });

  for (const width of WIDTHS) {
    await page.setViewport({ width, height: 900 });
    /* Let the clamp()s and the grid settle before measuring. */
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));

    const { shapes, targets } = await page.evaluate(collect);
    checked += shapes.length;

    for (const shape of shapes) {
      if (shape.rect.right <= shape.rect.left || shape.rect.bottom <= shape.rect.top) continue;
      for (const target of targets) {
        const { w, h, hit } = overlap(shape.rect, target.rect);
        if (!hit) continue;
        failures++;
        console.log(
          `FAIL  ${file} @${width}px  ${shape.name}  overlaps ${target.kind} <${target.tag}>  ` +
          `by ${w.toFixed(1)}x${h.toFixed(1)}px`
        );
      }
    }
  }
  await page.close();
}

await browser.close();

console.log(
  failures === 0
    ? `\nOK — ${checked} shape placements across ${PAGES.length} pages and ${WIDTHS.length} widths, nothing behind text or over a control.`
    : `\n${failures} overlapping placement(s).`
);
process.exit(failures === 0 ? 0 : 1);
