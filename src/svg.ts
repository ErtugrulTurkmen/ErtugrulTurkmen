import { MONO, SERIF, type Theme } from './theme.ts';

export type Layout = 'desktop' | 'mobile';

/**
 * Widths the assets are drawn at. GitHub's README column is 846px from a 1280px viewport up, and
 * 278–520px where the phone drawings are shown (src/readme.ts PHONE), so 320 renders near 1:1.
 */
export const WIDTH: Record<Layout, number> = { desktop: 846, mobile: 320 };

export const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const round = (n: number): number => Math.round(n * 10) / 10;

export type Font = { size: number; weight?: 400 | 500; tracking?: number; mono?: boolean };

// Helvetica advance widths (Adobe core-font AFM, per 1000 em) for ASCII 32–126, used as a
// proxy for the serif stack (Charter, Georgia run ~7% wider). Layouts keep slack on the right.
const HELVETICA = [
  278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278,
  556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556, 1015,
  667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611,
  278, 278, 278, 469, 556, 333,
  556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500,
  334, 260, 334, 584,
];
const BASE: Record<string, string> = { ğ: 'g', Ğ: 'G', ü: 'u', Ü: 'U', ş: 's', Ş: 'S', ı: 'i', İ: 'I', ç: 'c', Ç: 'C', ö: 'o', Ö: 'O' };
const EXTRA: Record<string, number> = { '·': 278, '—': 1000, '–': 556, '’': 222, '→': 1000, '↗': 1000 };

function advance(ch: string): number {
  const c = (BASE[ch] ?? ch).charCodeAt(0);
  return c >= 32 && c <= 126 ? HELVETICA[c - 32] : (EXTRA[ch] ?? 600);
}

/** Rendered width in px. */
export function measure(s: string, f: Font): number {
  const chars = [...s];
  const tracking = (f.tracking ?? 0) * chars.length;
  if (f.mono) return chars.length * f.size * 0.6 + tracking;
  return (chars.reduce((sum, ch) => sum + advance(ch), 0) / 1000) * f.size * 1.07 + tracking;
}

/**
 * Wraps at `sep` (words by default) into as few lines as fit `maxWidth`, then chooses, among the
 * breaks giving that many lines, the raggedness a typesetter would: lines before the last as full
 * as possible, and a last line of at least 40% so it is never a lone orphan. Two capitalised words
 * in a row are a name ("Claude Code", "App Store") and never break apart.
 */
export function wrap(s: string, maxWidth: number, f: Font, sep = ' '): string[] {
  const words: string[] = [];
  for (const w of s.split(sep)) {
    const prev = words.at(-1);
    if (sep === ' ' && prev && !prev.includes(sep) && /^[A-Z]/.test(prev) && /[A-Za-z]$/.test(prev) && /^[A-Z]/.test(w)) words[words.length - 1] = prev + sep + w;
    else words.push(w);
  }
  const width = (i: number, j: number) => measure(words.slice(i, j).join(sep), f);
  // Greedy fill gives the fewest lines.
  let count = 0;
  for (let i = 0; i < words.length; count++) {
    let j = i + 1;
    while (j < words.length && width(i, j + 1) <= maxWidth) j++;
    i = j;
  }
  if (count < 2) return [words.join(sep)];
  // best[k][j]: least cost of setting the first j words in k lines, where a line costs its squared
  // shortfall from the full width, and the last line only costs if it is shorter than 40%.
  const n = words.length;
  const best = Array.from({ length: count + 1 }, () => new Array<number>(n + 1).fill(Infinity));
  const from = Array.from({ length: count + 1 }, () => new Array<number>(n + 1).fill(0));
  best[0][0] = 0;
  for (let k = 1; k <= count; k++) {
    for (let j = 1; j <= n; j++) {
      for (let i = k - 1; i < j; i++) {
        const w = width(i, j);
        if (w > maxWidth && j - i > 1) continue;
        const last = k === count && j === n;
        const cost = best[k - 1][i] + (last ? (w < maxWidth * 0.4 ? (maxWidth * 0.4 - w) ** 2 * 4 : 0) : (maxWidth - w) ** 2);
        if (cost < best[k][j]) {
          best[k][j] = cost;
          from[k][j] = i;
        }
      }
    }
  }
  const lines: string[] = [];
  for (let k = count, j = n; k > 0; k--) {
    const i = from[k][j];
    lines.unshift(words.slice(i, j).join(sep));
    j = i;
  }
  return lines;
}

/** `hidden`: starts transparent as an attribute, for text that CSS reveals and a CSS-less renderer must not show. */
type TextOptions = Font & { fill?: string; anchor?: 'middle' | 'end'; cls?: string; delay?: number; hidden?: boolean };

export function text(x: number, y: number, s: string, o: TextOptions): string {
  const cls = [o.mono && 'm', o.cls].filter(Boolean).join(' ');
  const attrs = [
    `x="${round(x)}"`,
    `y="${round(y)}"`,
    `font-size="${o.size}"`,
    o.fill && `fill="${o.fill}"`,
    o.weight === 500 && 'font-weight="500"',
    o.tracking && `letter-spacing="${o.tracking}"`,
    o.anchor && `text-anchor="${o.anchor}"`,
    cls && `class="${cls}"`,
    o.delay !== undefined && `style="animation-delay:${Math.round(o.delay)}ms"`,
    o.hidden && 'opacity="0"',
  ].filter(Boolean);
  return `<text ${attrs.join(' ')}>${esc(s)}</text>`;
}

/** Drafting paper: 12px minor grid, 60px major grid. */
export const paperDefs = (t: Theme): string =>
  `<pattern id="minor" width="12" height="12" patternUnits="userSpaceOnUse"><path d="M12 0H0V12" fill="none" stroke="${t.grid}" stroke-width=".6"/></pattern>` +
  `<pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse"><rect width="60" height="60" fill="url(#minor)"/><path d="M60 0H0V60" fill="none" stroke="${t.rule}" stroke-width=".7"/></pattern>` +
  `<pattern id="hatch" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0V4" stroke="${t.rule}" stroke-width=".8"/></pattern>`;

/** A sheet of drafting paper with a hairline edge. */
export const sheet = (t: Theme, x: number, y: number, w: number, h: number, r = 4): string =>
  `<rect x="${x + 0.5}" y="${y + 0.5}" width="${round(w - 1)}" height="${round(h - 1)}" rx="${r}" fill="${t.paper}"/>` +
  `<rect x="${x + 0.5}" y="${y + 0.5}" width="${round(w - 1)}" height="${round(h - 1)}" rx="${r}" fill="url(#grid)" stroke="${t.rule}"/>`;

/** kami tag: solid fill, mono caps. */
export function tag(t: Theme, x: number, y: number, label: string, anchor: 'start' | 'end' = 'start', size = 10.5): { svg: string; w: number } {
  const font: Font = { size, tracking: 1, mono: true };
  const w = measure(label, font) + 16;
  const left = anchor === 'end' ? x - w : x;
  return {
    svg: `<rect x="${round(left)}" y="${y}" width="${round(w)}" height="20" rx="3" fill="${t.tag}"/>` + text(left + 8, y + 14, label, { ...font, fill: t.tagText }),
    w,
  };
}

export const lock = (x: number, y: number, color: string): string =>
  `<rect x="${x}" y="${y + 5}" width="9" height="7" rx="1.5" fill="none" stroke="${color}" stroke-width="1.2"/>` +
  `<path d="M${x + 2.2} ${y + 5}V${y + 3.2}a2.3 2.3 0 0 1 4.6 0V${y + 5}" fill="none" stroke="${color}" stroke-width="1.2"/>`;

/** Stills for readers who asked their system for less motion. src/preview.ts strips it to show motion. */
export const REDUCED_MOTION = '@media (prefers-reduced-motion:reduce){*{animation:none!important}.smil{display:none}.still{display:inline}}';

// Drawings appear the way a pen plotter would draw them, then settle. Animations run *from* a
// hidden state, so a renderer that ignores them still shows the finished drawing.
const MOTION =
  '.d{stroke-dasharray:1;animation:d 1.3s cubic-bezier(.45,0,.25,1) both}@keyframes d{from{stroke-dashoffset:1}}' +
  '.f{animation:f .7s ease-out both}@keyframes f{from{opacity:0}}' +
  '.still{display:none}' +
  REDUCED_MOTION;

/** A complete SVG document. The title doubles as the accessible name. */
export function doc(w: number, h: number, t: Theme, title: string, body: string, defs = '', css = ''): string {
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${round(h)}" viewBox="0 0 ${w} ${round(h)}" role="img" aria-label="${esc(title)}">`,
    `<title>${esc(title)}</title>`,
    `<defs>${paperDefs(t)}${defs}</defs>`,
    `<style>text{font-family:${SERIF}}.m{font-family:${MONO}}.n{font-variant-numeric:tabular-nums}${MOTION}${css}</style>`,
    `<g fill="${t.ink}">${body}</g>`,
    '</svg>',
    '',
  ].join('\n');
}
