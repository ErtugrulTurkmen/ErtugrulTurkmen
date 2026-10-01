// Local preview: renders README.md through GitHub's own Markdown API (same sanitiser as the
// profile page), then resolves every <picture> to one variant so each page shows exactly one
// theme and layout. Writes preview/{desktop,mobile}-{dark,light}.html, plus preview/live.html,
// which keeps the <picture> elements and sizes its column the way GitHub's profile page does,
// for checking the breakpoints by resizing the window, and preview/check.html, the layout check.
//
// The pages point at preview/motion/, copies of assets/ without the reduced-motion rule, so the
// animation is visible even on a machine with "Reduce motion" switched on. The real assets keep it.

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { ASSETS as REMOTE } from './readme.ts';
import { REDUCED_MOTION } from './svg.ts';

const ROOT = new URL('../', import.meta.url);
const OUT = new URL('preview/', ROOT);
const MOTION = new URL('motion/', OUT);
const ASSETS = new URL('assets/', ROOT);
const CSS = 'https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.9.0';

mkdirSync(MOTION, { recursive: true });
for (const f of readdirSync(ASSETS)) {
  if (f.endsWith('.svg')) writeFileSync(new URL(f, MOTION), readFileSync(new URL(f, ASSETS), 'utf8').replace(REDUCED_MOTION, ''));
}

// gfm mode with the repository as context: what the live profile uses (its paragraphs carry
// dir="auto", and images are not wrapped in links). The API's default "markdown" mode wraps each
// image in a link, pulling it out of any <picture> inside an <a>, which the live page never does.
const render = (file: string) =>
  execFileSync('gh', ['api', 'markdown', '-f', 'mode=gfm', '-f', 'context=ErtugrulTurkmen/ErtugrulTurkmen', '-F', `text=@${file}`], { cwd: ROOT, encoding: 'utf8' });

function resolve(html: string, mode: 'dark' | 'light', mobile: boolean): string {
  return html
    .replaceAll(`src="${REMOTE}`, 'src="assets/')
    .replaceAll(`srcset="${REMOTE}`, 'srcset="assets/')
    // Both theme links are resolved to this page's theme; the CSS below hides the other link anyway.
    .replace(/<picture>[\s\S]*?<img([^>]*?)src="assets\/([^"]+)-(?:dark|light)\.svg"([^>]*)>[\s\S]*?<\/picture>/g, (_, pre, name, post) => {
      const phone = `${name}-mobile-${mode}.svg`;
      const file = mobile && existsSync(new URL(phone, ASSETS)) ? phone : `${name}-${mode}.svg`;
      return `<img${pre}src="assets/${file}"${post}>`;
    })
    .replaceAll('src="assets/', 'src="motion/');
}

const pages: [string, string][] = [
  ['README.md', ''],
  ...readdirSync(new URL('projects/', ROOT)).filter((f) => f.endsWith('.md')).map((f): [string, string] => [`projects/${f}`, `case-${f.replace('.md', '')}-`]),
];

for (const [file, prefix] of pages) {
  const html = render(file);
  for (const mode of ['dark', 'light'] as const) {
  for (const mobile of [false, true]) {
    const page = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Profile preview · ${mobile ? 'mobile' : 'desktop'} · ${mode}</title>
<link rel="stylesheet" href="${CSS}/github-markdown-${mode}.min.css">
<style>/* detect-ignore: reproduces GitHub's own light canvas */html,body{margin:0;background:${mode === 'dark' ? '#0d1117' : '#ffffff'}}${mobile ? 'body{width:360px}.box{margin:16px!important}' : ''}
.box{max-width:846px;margin:24px auto;border:1px solid ${mode === 'dark' ? '#3d444d' : '#d1d9e0'};border-radius:6px;padding:24px}
@media (max-width:600px){.box{margin:16px}}
.markdown-body [href$="#gh-${mode === 'dark' ? 'light' : 'dark'}-mode-only"]{display:none}</style></head>
<body><div class="box"><article class="markdown-body">${resolve(html, mode, mobile)}</article></div></body></html>`;
    writeFileSync(new URL(`${prefix}${mobile ? 'mobile' : 'desktop'}-${mode}.html`, OUT), page);
  }
  }
}
// GitHub's README column on a profile page (measured 2026-10-01): viewport − 82px below 768px,
// − 370px up to 1011px, − 434px from 1012px, at most 846px. Themes follow the OS, as for a
// logged-out visitor, through the same href rule GitHub ships.
const live = render('README.md').replaceAll(`src="${REMOTE}`, 'src="motion/').replaceAll(`srcset="${REMOTE}`, 'srcset="motion/');
writeFileSync(
  new URL('live.html', OUT),
  `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Profile preview · live widths</title>
<link rel="stylesheet" href="${CSS}/github-markdown.min.css">
<style>/* detect-ignore: reproduces GitHub's own canvas */html,body{margin:0;background:#ffffff}@media (prefers-color-scheme:dark){html,body{background:#0d1117}}
.markdown-body{box-sizing:content-box;width:calc(100vw - 82px);margin:24px auto;padding:0}
@media (min-width:768px){.markdown-body{width:calc(100vw - 370px)}}
@media (min-width:1012px){.markdown-body{width:min(calc(100vw - 434px),846px)}}
@media (prefers-color-scheme:dark){.markdown-body [href$="#gh-light-mode-only"]{display:none}}
@media (prefers-color-scheme:light){.markdown-body [href$="#gh-dark-mode-only"]{display:none}}</style></head>
<body><article class="markdown-body">${live}</article></body></html>`,
);
// The layout check: renders every asset inline and lists text that leaves its drawing or collides
// with other text, at rest. Open preview/check.html and run check(), or check("'PT Serif Caption'")
// to stand in for the wider fallback faces (Sitka, Noto Serif, DejaVu Serif).
const assets = readdirSync(ASSETS).filter((f) => f.endsWith('.svg'));
writeFileSync(
  new URL('check.html', OUT),
  `<!doctype html><meta charset="utf-8"><title>Layout check</title><div id="root"></div>
<script>
const FILES = ${JSON.stringify(assets)};
async function check(font) {
  const root = document.getElementById('root');
  const report = [];
  for (const f of FILES) {
    const parsed = new DOMParser().parseFromString(await (await fetch('../assets/' + f)).text(), 'image/svg+xml');
    const svg = document.importNode(parsed.documentElement, true);
    root.replaceChildren(svg);
    if (font) { const st = document.createElementNS('http://www.w3.org/2000/svg', 'style'); st.textContent = 'text:not(.m){font-family:' + font + '!important}'; svg.append(st); }
    // Measuring forces layout synchronously; no frame wait, which would stall in a hidden tab.
    for (const a of document.getAnimations()) { a.pause(); a.currentTime = 60000; }
    const W = +svg.getAttribute('width'), H = +svg.getAttribute('height'), base = svg.getBoundingClientRect();
    const shown = (t) => { for (let e = t; e && e !== svg; e = e.parentElement) { const c = getComputedStyle(e); if (c.display === 'none' || +c.opacity === 0) return false; } return true; };
    const boxes = [...svg.querySelectorAll('text')].filter(shown).map((t) => { const r = t.getBoundingClientRect(); return { s: t.textContent, x: t.getAttribute('x'), y: +t.getAttribute('y'), size: +t.getAttribute('font-size'), x0: r.left - base.left, x1: r.right - base.left, y0: r.top - base.top, y1: r.bottom - base.top }; });
    const issues = [];
    for (const b of boxes) if (b.x0 < 0.5 || b.x1 > W - 0.5 || b.y0 < 0 || b.y1 > H + 1) issues.push('OUT ' + JSON.stringify(b.s));
    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i], b = boxes[j];
      // Lines of one paragraph: their boxes span the font's whole ascent and descent, which overlap at
      // normal leading without the glyphs touching.
      if (a.x === b.x && a.size === b.size && Math.abs(a.y - b.y) >= a.size * 1.1) continue;
      if (Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0) > 1.5 && Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0) > 3.5) issues.push('HIT ' + JSON.stringify(a.s) + ' x ' + JSON.stringify(b.s));
    }
    if (issues.length) report.push(f + ': ' + issues.join('; '));
  }
  root.replaceChildren();
  return report.length ? report.join('\\n') : 'clean: ' + FILES.length + ' files';
}
</script>`,
);
console.log('wrote preview/*.html, live.html, check.html and motion/');
