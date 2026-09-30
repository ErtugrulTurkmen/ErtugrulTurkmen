import { exif, ledger, stack, symlinks, truck, wireframe, type Figure } from './art.ts';
import type { Profile, Project, Skills, Status } from './content.ts';
import type { Stats } from './data.ts';
import { place } from './iso.ts';
import { doc, lock, measure, round, sheet, tag, text, WIDTH, wrap, type Font, type Layout } from './svg.ts';
import { dark, light, type Theme } from './theme.ts';

// Everything sits on kami's panels; figures sit on drafting paper. Labels are mono caps, as on a
// drawing's title block, and the one accent (ink blue) marks numbers and moving parts.

const STATUS: Record<Status, string> = {
  live: 'LIVE ON APP STORE',
  'in-use': 'IN USE',
  developed: 'DEVELOPED',
  active: 'ACTIVE',
  'in-development': 'IN DEVELOPMENT',
};

const FIGURES: Record<Project['figure'], (t: Theme) => Figure> = { truck, wireframe, ledger, exif, symlinks };

const UP = '@keyframes up{from{opacity:0;transform:translateY(6px)}}.up{animation:up .7s cubic-bezier(.16,1,.3,1) both}';

const LABEL: Font = { size: 10.5, mono: true, tracking: 1 };

const panel = (t: Theme, w: number, h: number): string =>
  `<rect x=".5" y=".5" width="${w - 1}" height="${round(h - 1)}" rx="6" fill="${t.panel}" stroke="${t.rule}"/>`;

const rule = (t: Theme, x: number, y: number, w: number): string => `<rect x="${x}" y="${round(y)}" width="${round(w)}" height="1" fill="${t.rule}"/>`;

/** A row of figures: large serif number, mono caption, hairlines between cells. */
function figures(t: Theme, x: number, y: number, w: number, cols: number, items: [string, string][], size: number, delay: number): { svg: string; h: number } {
  const colW = w / cols;
  const rowH = size + 50;
  const out: string[] = [];
  items.forEach(([value, label], i) => {
    const col = i % cols;
    const top = y + Math.floor(i / cols) * rowH;
    const cx = x + col * colW + (col ? 20 : 0);
    if (col) out.push(`<rect x="${round(x + col * colW)}" y="${round(top + 14)}" width="1" height="${rowH - 26}" fill="${t.rule}"/>`);
    const g = [
      text(cx, top + size + 10, value, { size, weight: 500, tracking: -0.5, cls: 'n' }),
      ...wrap(label.toUpperCase(), colW - (col ? 32 : 14), LABEL).map((line, j) =>
        text(cx, top + size + 30 + j * 14, line, { ...LABEL, size: 9.5, fill: t.meta }),
      ),
    ];
    out.push(`<g class="up" style="animation-delay:${delay + i * 80}ms">${g.join('')}</g>`);
  });
  return { svg: out.join(''), h: Math.ceil(items.length / cols) * rowH };
}

// ─── Hero ───────────────────────────────────────────────────────────────────

export function hero(t: Theme, layout: Layout, p: Profile, s: Stats, title: string): string {
  const d = layout === 'desktop';
  const W = WIDTH[layout];
  const pad = d ? 36 : 24;
  const leftW = d ? 404 : W - pad * 2;
  const rev = `SHEET 01 · REV ${s.fetchedAt.slice(0, 10)}`;
  const out: string[] = [];

  let y = d ? 46 : 40;
  const eyebrow = wrap(p.eyebrow.toUpperCase(), leftW, LABEL, ' · ');
  eyebrow.forEach((line, i) => out.push(text(pad, y + i * 16, line, { ...LABEL, fill: t.meta, cls: 'up' })));
  y += (eyebrow.length - 1) * 16;
  if (d) out.push(text(W - pad, 46, rev, { ...LABEL, fill: t.meta, anchor: 'end', cls: 'up' }));

  y += d ? 64 : 52;
  out.push(text(pad, y, p.name, { size: d ? 52 : 38, weight: 500, tracking: d ? -1.2 : -0.8, cls: 'up', delay: 80 }));

  const tagFont: Font = { size: d ? 18.5 : 16.5 };
  const lh = d ? 27 : 24;
  y += d ? 40 : 34;
  const tagline = wrap(p.tagline, leftW, tagFont);
  tagline.forEach((line, i) => out.push(text(pad, y + i * lh, line, { ...tagFont, fill: t.muted, cls: 'up', delay: 140 })));
  y += (tagline.length - 1) * lh + 30;

  // Focus areas as a slashed line of caps, wrapping between items.
  let fx = pad;
  const focus: string[] = [];
  p.focus.forEach((f, i) => {
    const label = f.toUpperCase();
    const w = measure(label, LABEL);
    if (fx > pad && fx + w > pad + leftW) {
      fx = pad;
      y += 20;
    }
    focus.push(text(fx, y, label, { ...LABEL, fill: t.ink2 }));
    fx += w;
    if (i < p.focus.length - 1) {
      focus.push(text(fx + 8, y, '/', { ...LABEL, fill: t.accent }));
      fx += 24;
    }
  });
  out.push(`<g class="up" style="animation-delay:200ms">${focus.join('')}</g>`);

  const art = stack(t, d);
  let artBottom = 0;
  if (d) {
    const box = { x: 452, y: 64, w: W - pad - 452 + 10, h: 300 };
    out.push(place(art, box.x, box.y, box.w, box.h));
    artBottom = box.y + (box.h + art.h * Math.min(1, box.w / art.w, box.h / art.h)) / 2; // place() centres vertically
  } else {
    y += 18;
    const h = 200;
    out.push(place(art, pad, y, W - pad * 2, h));
    y += h;
  }

  y += d ? 42 : 28;
  p.now.forEach((item, i) => {
    out.push(
      `<g class="up" style="animation-delay:${260 + i * 70}ms">` +
        text(pad, y, item.label.toUpperCase(), { ...LABEL, size: 10, fill: t.accent }) +
        text(pad + (d ? 96 : 88), y, item.text, { size: d ? 15.5 : 15 }) +
        '</g>',
    );
    y += 26;
  });

  y = Math.max(y, artBottom) + 14;
  out.push(rule(t, pad, y, W - pad * 2));
  const lang = s.languages[0];
  const row = figures(
    t, pad, y, W - pad * 2, d ? 4 : 2,
    [
      [`${s.contributionsLastYear}`, 'contributions, last 12 months'],
      [`${s.commitsAllTime}`, 'commits, all-time'],
      [`${s.repos.total}`, `repositories, ${s.repos.private} private`],
      [`${Math.round(lang.pct)}%`, `${lang.name}, by code volume`],
    ],
    d ? 34 : 30, 400,
  );
  out.push(row.svg);
  y += row.h;
  if (!d) {
    out.push(rule(t, pad, y, W - pad * 2));
    out.push(text(pad, y + 28, rev, { ...LABEL, fill: t.meta }));
    y += 46;
  }
  const H = y + (d ? 6 : 0);
  return doc(W, H, t, title, sheet(t, 0, 0, W, H, 6) + out.join(''), '', UP + art.css);
}

// ─── Project cards ──────────────────────────────────────────────────────────

/** Name, kind, summary and numbered highlights. Returns the y it ended at. */
function cardText(t: Theme, pr: Project, x: number, y0: number, w: number, big: boolean): { svg: string; y: number } {
  const out: string[] = [];
  let y = y0;
  out.push(text(x, y, pr.name, { size: big ? 26 : 21, weight: 500, tracking: -0.3 }));
  y += big ? 22 : 20;
  out.push(text(x, y, pr.kind.toUpperCase(), { ...LABEL, size: 10, fill: t.meta }));
  y += big ? 34 : 30;
  const sFont: Font = { size: big ? 16 : 15 };
  for (const line of wrap(pr.summary, w, sFont)) {
    out.push(text(x, y, line, { ...sFont, fill: t.ink2 }));
    y += big ? 24 : 22;
  }
  y += 10;
  const hFont: Font = { size: 14 };
  pr.highlights.forEach((h, i) => {
    const lines = wrap(h, w - 28, hFont);
    out.push(text(x, y, `0${i + 1}`, { ...LABEL, size: 10, fill: t.accent }));
    lines.forEach((line, j) => out.push(text(x + 28, y + j * 20, line, { ...hFont, fill: t.muted })));
    y += lines.length * 20 + 3;
  });
  return { svg: out.join(''), y };
}

/** Stack on the left, source visibility on the right, under a hairline. */
function footer(t: Theme, pr: Project, x: number, right: number, H: number): string {
  const y = H - 19;
  const label = { private: 'PRIVATE SOURCE', 'soon-public': 'OPEN SOURCE SOON', public: 'OPEN SOURCE' }[pr.visibility];
  const lw = measure(label, { ...LABEL, size: 9.5 });
  return (
    rule(t, x, H - 42, right - x) +
    text(x, y, pr.stack.join(' · '), { size: 11.5, mono: true, fill: t.meta }) +
    (pr.visibility === 'private' ? lock(round(right - lw - 16), y - 10, t.meta) : '') +
    text(right, y, label, { ...LABEL, size: 9.5, fill: t.meta, anchor: 'end' })
  );
}

/** The figure box: drafting paper, caption, status tag, and the drawing. `css` animates the drawing. */
function figureBox(t: Theme, pr: Project, n: number, x: number, y: number, w: number, h: number): { svg: string; css: string } {
  const art = FIGURES[pr.figure](t);
  return {
    svg:
      sheet(t, x, y, w, h) +
      text(x + 12, y + 20, `FIG. ${n} — ${pr.caption.toUpperCase()}`, { ...LABEL, size: 9, fill: t.meta }) +
      tag(t, x + w - 10, y + 8, STATUS[pr.status], 'end').svg +
      place(art, x + 10, y + 34, w - 20, h - 42),
    css: art.css,
  };
}

export const CARD_WIDTH = 415;
const FIG_H = 190;

/** Height a card needs, so a row of cards can share the tallest. */
export const cardHeight = (t: Theme, pr: Project): number => cardText(t, pr, 24, FIG_H + 50, CARD_WIDTH - 48, false).y + 58;

export function projectCard(t: Theme, pr: Project, n: number, H: number, title: string): string {
  const W = CARD_WIDTH;
  const fig = figureBox(t, pr, n, 10, 10, W - 20, FIG_H);
  const body = fig.svg + cardText(t, pr, 24, FIG_H + 50, W - 48, false).svg + footer(t, pr, 24, W - 24, H);
  return doc(W, H, t, title, panel(t, W, H) + body, '', fig.css);
}

/** The flagship project, full width: text left, a large figure right, figures along the bottom. */
export function featureCard(t: Theme, pr: Project, n: number, title: string): string {
  const W = WIDTH.desktop;
  const split = 404;
  const left = cardText(t, pr, 28, 58, split - 56, true);
  const figH = Math.max(left.y + 4, 300);
  const row = figures(t, 28, figH + 22, W - 56, 4, pr.metrics ?? [], 26, 300);
  const H = figH + 22 + row.h + 44;
  const fig = figureBox(t, pr, n, split, 10, W - split - 10, figH);
  const body =
    fig.svg +
    left.svg +
    rule(t, 28, figH + 22, W - 56) +
    row.svg +
    footer(t, pr, 28, W - 28, H);
  return doc(W, H, t, title, panel(t, W, H) + body, '', UP + fig.css);
}

// ─── Skills ─────────────────────────────────────────────────────────────────

export function skillsPanel(t: Theme, layout: Layout, skills: Skills, title: string): string {
  const d = layout === 'desktop';
  const W = WIDTH[layout];
  const pad = d ? 28 : 22;
  const out: string[] = [];

  out.push(text(pad, 38, 'CURRENTLY LEARNING', { ...LABEL, fill: t.meta }));
  let lx = pad + measure('CURRENTLY LEARNING', LABEL) + 12;
  for (const item of skills.learning) {
    const g = tag(t, lx, 24, item.toUpperCase());
    out.push(g.svg);
    lx += g.w + 8;
  }
  out.push(rule(t, pad, 60, W - pad * 2));

  const cols = d ? 3 : 2;
  const gap = d ? 28 : 18;
  const colW = (W - pad * 2 - gap * (cols - 1)) / cols;
  const item: Font = { size: d ? 15 : 14 };
  let rowY = 60;
  for (let i = 0; i < skills.groups.length; i += cols) {
    let rowH = 0;
    skills.groups.slice(i, i + cols).forEach((g, j) => {
      const x = pad + j * (colW + gap);
      out.push(text(x, rowY + 34, `0${i + j + 1}`, { ...LABEL, size: 10, fill: t.accent }));
      out.push(text(x + 26, rowY + 34, g.title.toUpperCase(), { ...LABEL, fill: t.ink2 }));
      g.items.forEach((name, k) => out.push(text(x, rowY + 62 + k * 23, name, item)));
      rowH = Math.max(rowH, 50 + g.items.length * 23);
    });
    rowY += rowH + 6;
  }

  out.push(rule(t, pad, rowY + 8, W - pad * 2));
  out.push(text(pad, rowY + 38, skills.practices.title.toUpperCase(), { ...LABEL, fill: t.ink2 }));
  const pFont: Font = { size: d ? 15 : 14 };
  const lines = wrap(skills.practices.items.join(' · '), W - pad * 2, pFont, ' · ');
  lines.forEach((line, i) => out.push(text(pad, rowY + 64 + i * 23, line, { ...pFont, fill: t.muted })));
  const H = rowY + 64 + (lines.length - 1) * 23 + 28;
  return doc(W, H, t, title, panel(t, W, H) + out.join(''));
}

// ─── Section headers, About, title block ────────────────────────────────────

/** Replaces GitHub's sans-serif h2: number with kami's short ink-blue rule, serif title, mono note. */
export function sectionHeader(t: Theme, layout: Layout, n: number, title: string, meta?: string): string {
  const d = layout === 'desktop';
  const W = WIDTH[layout];
  const H = d ? 60 : 54;
  const num = String(n).padStart(2, '0');
  const size = d ? 28 : 24;
  const titleEnd = 34 + measure(title, { size });
  const metaW = meta ? measure(meta, LABEL) : 0;
  const body =
    text(1, H - 22, num, { ...LABEL, size: 11, fill: t.accent }) +
    text(34, H - 20, title, { size, weight: 500, tracking: -0.3 }) +
    (meta && titleEnd + metaW + 24 < W ? text(W - 3, H - 22, meta, { ...LABEL, fill: t.meta, anchor: 'end' }) : '') +
    rule(t, 0, H - 6, W) +
    `<rect x="0" y="${H - 7}" width="22" height="3" fill="${t.accent}"/>`;
  return doc(W, H, t, title, body, '', '');
}

export function aboutPanel(t: Theme, layout: Layout, p: Profile, title: string): string {
  const d = layout === 'desktop';
  const W = WIDTH[layout];
  const pad = d ? 32 : 24;
  const out: string[] = [text(pad, 44, 'ABSTRACT', { ...LABEL, fill: t.meta })];
  const leftW = d ? 300 : W - pad * 2;
  const qFont: Font = { size: d ? 26 : 23, weight: 500 };
  let y = d ? 88 : 82;
  for (const line of wrap(p.about.quote, leftW, qFont)) {
    out.push(text(pad, y, line, { ...qFont, tracking: -0.4 }));
    y += d ? 34 : 30;
  }
  y += 8;
  const iFont: Font = { size: 15 };
  for (const line of wrap(p.about.intro, leftW, iFont)) {
    out.push(text(pad, y, line, { ...iFont, fill: t.muted }));
    y += 23;
  }

  const rx = d ? 392 : pad;
  const rw = d ? W - pad - rx : W - pad * 2;
  let ry = d ? 44 : y + 28;
  if (!d) out.push(rule(t, pad, y + 2, rw));
  const bFont: Font = { size: 15 };
  p.about.principles.forEach(([head, body], i) => {
    if (i) ry += 20;
    out.push(text(rx, ry, `0${i + 1}`, { ...LABEL, size: 10, fill: t.accent }));
    out.push(text(rx + 28, ry + 1, head, { size: 17, weight: 500 }));
    ry += 26;
    for (const line of wrap(body, rw - 28, bFont)) {
      out.push(text(rx + 28, ry, line, { ...bFont, fill: t.muted }));
      ry += 22;
    }
  });
  const H = Math.max(y, ry) + (d ? 22 : 18);
  const columnRule = d ? `<rect x="364" y="30" width="1" height="${round(H - 60)}" fill="${t.rule}"/>` : '';
  return doc(W, H, t, title, panel(t, W, H) + columnRule + out.join(''));
}

/** The drawing's title block, closing the page. Its revision date moves with every sync. */
export function titleBlock(t: Theme, layout: Layout, p: Profile, s: Stats, sheets: number, title: string): string {
  const d = layout === 'desktop';
  const W = WIDTH[layout];
  const cells: [string, string][] = [
    ['DRAWN BY', p.name],
    ['CHECKED BY', 'GitHub Actions, every 6 h'],
    ['REVISION', s.fetchedAt.slice(0, 10)],
    ['SHEET', `01 OF ${String(sheets).padStart(2, '0')}`],
  ];
  const note = 'Numbers and drawings are regenerated from live GitHub data. Private work is counted, never named.';
  const widths = d ? [0.34, 0.3, 0.19, 0.17] : [0.5, 0.5, 0.5, 0.5];
  const cols = d ? 4 : 2;
  const rowH = 56;
  const out: string[] = [];
  let x = 0;
  cells.forEach(([label, value], i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    if (col === 0) x = 0;
    const w = widths[i] * W;
    const y = row * rowH;
    if (col) out.push(`<rect x="${round(x)}" y="${y}" width="1" height="${rowH}" fill="${t.rule}"/>`);
    out.push(text(x + 16, y + 21, label, { ...LABEL, size: 9, fill: t.meta }));
    out.push(text(x + 16, y + 42, value, { size: 15, cls: 'n' }));
    x += w;
  });
  const rows = Math.ceil(cells.length / cols);
  for (let r = 1; r <= rows; r++) out.push(rule(t, 0, r * rowH, W));
  const nFont: Font = { size: 14 };
  const lines = wrap(note, W - 32 - measure('NOTE  ', LABEL), nFont);
  const ny = rows * rowH;
  out.push(text(16, ny + 26, 'NOTE', { ...LABEL, size: 9, fill: t.meta }));
  lines.forEach((line, i) => out.push(text(16 + 52, ny + 26 + i * 20, line, { ...nFont, fill: t.muted })));
  const H = ny + 26 + (lines.length - 1) * 20 + 20;
  return doc(W, H, t, title, panel(t, W, H) + out.join(''));
}

/** Case-study page header: the project's drawing at full size above a title block. */
export function caseHeader(t: Theme, layout: Layout, pr: Project, n: number, title: string): string {
  const d = layout === 'desktop';
  const W = WIDTH[layout];
  const figH = d ? 300 : 210;
  const art = FIGURES[pr.figure](t);
  const cells: [string, string][] = [
    ['PROJECT', pr.name],
    ['KIND', pr.kind],
    ['SOURCE', { private: 'Private', 'soon-public': 'Open source soon', public: 'Open source' }[pr.visibility]],
    ['STACK', pr.stack.join(' · ')],
  ];
  const widths = d ? [0.2, 0.34, 0.18, 0.28] : [0.5, 0.5, 0.5, 0.5];
  const cols = d ? 4 : 2;
  const top = 44 + figH + 18;
  const vFont: Font = { size: 14 };
  const values = cells.map(([, value], i) => wrap(value, widths[i] * W - 28, vFont, value.includes(' · ') ? ' · ' : ' ').slice(0, 2));
  const out: string[] = [
    text(16, 26, `SHEET 0${n + 1} — ${pr.name.toUpperCase()}`, { ...LABEL, size: 9.5, fill: t.meta }),
    tag(t, W - 12, 12, STATUS[pr.status], 'end').svg,
    place(art, 20, 44, W - 40, figH, d ? 1.7 : 1.2),
    rule(t, 0, top, W),
  ];
  let y = top;
  for (let r = 0; r < cells.length; r += cols) {
    const rowLines = Math.max(...values.slice(r, r + cols).map((v) => v.length));
    const rowH = 42 + (rowLines - 1) * 18 + 14;
    let x = 0;
    cells.slice(r, r + cols).forEach(([label], j) => {
      const i = r + j;
      if (j) out.push(`<rect x="${round(x)}" y="${y}" width="1" height="${rowH}" fill="${t.rule}"/>`);
      out.push(text(x + 16, y + 21, label, { ...LABEL, size: 9, fill: t.meta }));
      values[i].forEach((line, k) => out.push(text(x + 16, y + 42 + k * 18, line, vFont)));
      x += widths[i] * W;
    });
    y += rowH;
    if (r + cols < cells.length) out.push(rule(t, 0, y, W));
  }
  const H = y;
  return doc(W, H, t, title, sheet(t, 0, 0, W, H, 6) + out.join(''), '', art.css);
}

// ─── Buttons ────────────────────────────────────────────────────────────────

// One image per button that reads on both themes: kami's ink-blue call to action with ivory
// text, and its warm-sand secondary with near-black text.
export function button(kind: 'primary' | 'secondary', label: string, title: string): string {
  const H = 40;
  const font: Font = { size: 11.5, mono: true, tracking: 1.2 };
  const W = Math.round(20 + measure(label, font) + 14 + 10 + 20);
  const fill = kind === 'primary' ? light.accent : light.rule;
  const color = kind === 'primary' ? light.panel : light.ink;
  const body =
    `<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="5" fill="${fill}" stroke="${kind === 'primary' ? light.accent : light.faces.right}"/>` +
    text(20, 24.5, label, { ...font, fill: color }) +
    `<path d="M${W - 30} ${H / 2 + 4}l8-8M${W - 28} ${H / 2 - 4}h6v6" fill="none" stroke="${color}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>`;
  return doc(W, H, dark, title, body);
}
