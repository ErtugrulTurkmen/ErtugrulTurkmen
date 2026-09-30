// Local preview: renders README.md through GitHub's own Markdown API (same sanitiser as the
// profile page), then resolves every <picture> to one variant so each page shows exactly one
// theme and layout. Writes preview/{desktop,mobile}-{dark,light}.html.
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

const render = (file: string) => execFileSync('gh', ['api', 'markdown', '-F', `text=@${file}`], { cwd: ROOT, encoding: 'utf8' });

function resolve(html: string, mode: 'dark' | 'light', mobile: boolean): string {
  return html
    .replaceAll(`src="${REMOTE}`, 'src="assets/')
    .replaceAll(`srcset="${REMOTE}`, 'srcset="assets/')
    .replace(/<picture>[\s\S]*?<img([^>]*?)src="assets\/([^"]+)-dark\.svg"([^>]*)>[\s\S]*?<\/picture>/g, (_, pre, name, post) => {
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
console.log('wrote preview/*.html and preview/motion/');
