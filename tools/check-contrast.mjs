/* Contrast check.
 *
 * "Every piece of text has been contrast-checked against what sits behind it"
 * is on the handoff's acceptance list, and the audience — stressed parents on
 * phones, and older caregivers — makes it matter more than usual. This measures
 * what the browser actually paints: the text colour composited over whatever
 * ancestor supplies the background, including alpha.
 *
 *   npm install puppeteer-core          # anywhere, e.g. a scratch directory
 *   node tools/check-contrast.mjs [siteDir]
 */
import puppeteer from 'puppeteer-core';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const SITE = path.resolve(process.argv[2] ?? process.cwd());
const CHROME = process.env.CHROME_PATH
  ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const PAGES = [
  'index.html', 'about.html', 'play-therapy.html', 'for-parents.html',
  'fees.html', 'contact.html', 'for-counsellors.html', 'thanks.html', '404.html',
];

const WIDTHS = [1280, 390];

const audit = () => {
  const parse = (value) => {
    const n = value.match(/[\d.]+/g)?.map(Number) ?? [0, 0, 0, 0];
    return { r: n[0], g: n[1], b: n[2], a: n.length > 3 ? n[3] : 1 };
  };

  const over = (fg, bg) => ({
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a),
    a: 1,
  });

  const luminance = ({ r, g, b }) => {
    const c = [r, g, b].map((v) => {
      const s = v / 255;
      return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };

  const ratio = (a, b) => {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  };

  /* Walk up until something actually paints, compositing translucent layers
     on the way back down. */
  const backdrop = (el) => {
    const stack = [];
    for (let n = el; n; n = n.parentElement) {
      const c = parse(getComputedStyle(n).backgroundColor);
      if (c.a === 0) continue;
      stack.push(c);
      if (c.a === 1) break;
    }
    return stack.reduceRight((acc, c) => over(c, acc), { r: 255, g: 255, b: 255, a: 1 });
  };

  const findings = [];
  for (const el of document.querySelectorAll('body *')) {
    const hasOwnText = [...el.childNodes]
      .some((n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim());
    if (!hasOwnText) continue;

    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') continue;
    if (el.closest('[aria-hidden="true"]')) continue;
    /* The skip link is off-screen until focused; it is checked in its focused
       state by keyboard, not here. */
    if (el.closest('.skip-link') || el.closest('.honeypot')) continue;

    const size = parseFloat(cs.fontSize);
    const weight = Number(cs.fontWeight) || 400;
    const isLarge = size >= 24 || (size >= 18.66 && weight >= 700);
    const required = isLarge ? 3 : 4.5;

    const bg = backdrop(el);
    const fg = over(parse(cs.color), bg);
    const measured = ratio(fg, bg);

    if (measured + 0.005 < required) {
      findings.push({
        text: el.textContent.trim().slice(0, 46),
        selector: el.tagName.toLowerCase() + (el.className ? '.' + String(el.className).split(' ').join('.') : ''),
        size: Math.round(size * 10) / 10,
        measured: Math.round(measured * 100) / 100,
        required,
      });
    }
  }
  return findings;
};

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--force-color-profile=srgb'],
});

let failures = 0;

for (const file of PAGES) {
  const page = await browser.newPage();
  await page.goto(pathToFileURL(path.join(SITE, file)).href, { waitUntil: 'load' });

  for (const width of WIDTHS) {
    await page.setViewport({ width, height: 900 });
    /* Open every disclosure and menu so their contents are measured too. */
    await page.evaluate(() => {
      for (const d of document.querySelectorAll('details')) d.open = true;
    });
    await page.evaluate(() => new Promise((r) => setTimeout(r, 400)));

    for (const f of await page.evaluate(audit)) {
      failures++;
      console.log(
        `FAIL  ${file} @${width}px  ${f.measured}:1 (needs ${f.required}:1)  ` +
        `${f.size}px  ${f.selector}  "${f.text}"`
      );
    }
  }
  await page.close();
}

await browser.close();

console.log(
  failures === 0
    ? `\nOK — every rendered text node passes WCAG AA against what sits behind it, across ${PAGES.length} pages.`
    : `\n${failures} contrast failure(s).`
);
process.exit(failures === 0 ? 0 : 1);
