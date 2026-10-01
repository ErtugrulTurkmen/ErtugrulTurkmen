import { exif, ledger, stack, symlinks, truck, wireframe, type Figure } from './art.ts';
import type { Profile, Project, Skills, Status } from './content.ts';
import type { Stats } from './data.ts';
import { place } from './iso.ts';
import { doc, lock, measure, round, sheet, tag, text, WIDTH, wrap, type Font, type Layout } from './svg.ts';
import type { Theme } from './theme.ts';

// Everything sits on kami's panels; figures sit on drafting paper. Labels are mono caps, as on a
// drawing's title block, and the one accent (ink blue) marks numbers and moving parts.

const STATUS: Record<Status, string> = {
  live: 'LIVE ON APP STORE',
  'in-use': 'IN USE',
  developed: 'DEVELOPED',
  active: 'ACTIVE',
  'in-development': 'IN DEVELOPMENT',
};

const FIGURES: Record<Project['figure'], (t: Theme, labels: boolean) => Figure> = { truck, wireframe, ledger, exif, symlinks };

const UP = '@keyframes up{from{opacity:0;transform:translateY(6px)}}.up{animation:up .7s cubic-bezier(.16,1,.3,1) both}';

const LABEL: Font = { size: 10.5, mono: true, tracking: 1 };

/**
 * Room for a serif line. Phone drawings keep only 20px beside their text, so their lines wrap 6%
 * short of it, enough for the widest fallback faces (DejaVu Serif, Sitka); desktop panels have more.
 */
const fit = (d: boolean, w: number): number => (d ? w : w * 0.94);

/** Phone drawings render at 0.87–1.6×, so no label there is set below 11px. */
const lab = (d: boolean, size = LABEL.size): Font => ({ ...LABEL, size: d ? size : Math.max(size, 11) });

const panel = (t: Theme, w: number, h: number, x = 0): string =>
  `<rect x="${x + 0.5}" y=".5" width="${w - 1}" height="${round(h - 1)}" rx="6" fill="${t.panel}" stroke="${t.rule}"/>`;

const rule = (t: Theme, x: number, y: number, w: number): string => `<rect x="${x}" y="${round(y)}" width="${round(w)}" height="1" fill="${t.rule}"/>`;

/** A row of figures: large serif number, mono caption, hairlines between cells. */
function figures(t: Theme, x: number, y: number, w: number, cols: number, items: [string, string][], size: number, delay: number, small: Font): { svg: string; h: number } {
  const colW = w / cols;
  const labels = items.map(([, label], i) => wrap(label.toUpperCase(), colW - (i % cols ? 32 : 14), small));
  const rowH = (r: number) => size + 36 + Math.max(...labels.slice(r * cols, r * cols + cols).map((l) => l.length)) * 14;
  const out: string[] = [];
  let top = y;
  for (let r = 0; r * cols < items.length; r++) {
    const h = rowH(r);
    items.slice(r * cols, r * cols + cols).forEach(([value], col) => {
      const i = r * cols + col;
      const cx = x + col * colW + (col ? 20 : 0);
      if (col) out.push(`<rect x="${round(x + col * colW)}" y="${round(top + 14)}" width="1" height="${h - 26}" fill="${t.rule}"/>`);
      const g = [
        text(cx, top + size + 10, value, { size, weight: 500, tracking: -0.5, cls: 'n' }),
        ...labels[i].map((line, j) => text(cx, top + size + 30 + j * 14, line, { ...small, fill: t.meta })),
      ];
      out.push(`<g class="up" style="animation-delay:${delay + i * 80}ms">${g.join('')}</g>`);
    });
    top += h;
  }
  return { svg: out.join(''), h: top - y };
}

/** A small north-east arrow: the card is a link. */
const arrow = (x: number, y: number, color: string): string =>
  `<path d="M${round(x)} ${round(y)}l7-7M${round(x + 1.5)} ${round(y - 7)}h5.5v5.5" fill="none" stroke="${color}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>`;

// ─── Hero ───────────────────────────────────────────────────────────────────

export function hero(t: Theme, layout: Layout, p: Profile, s: Stats, title: string): string {
  const d = layout === 'desktop';
  const W = WIDTH[layout];
  const pad = d ? 36 : 20;
  const leftW = d ? 404 : W - pad * 2;
  const L = lab(d);
  const rev = `SHEET 01 · REV ${s.fetchedAt.slice(0, 10)}`;
  const out: string[] = [];

  let y = d ? 46 : 38;
  const eyebrow = wrap(p.eyebrow.toUpperCase(), leftW, L, ' · ');
  eyebrow.forEach((line, i) => out.push(text(pad, y + i * 16, line, { ...L, fill: t.meta, cls: 'up' })));
  y += (eyebrow.length - 1) * 16;
  if (d) out.push(text(W - pad, 46, rev, { ...L, fill: t.meta, anchor: 'end', cls: 'up' }));

  y += d ? 64 : 48;
  const nameFont: Font = { size: d ? 52 : 32, weight: 500, tracking: d ? -1.2 : -0.6 };
  // 1.15 leading: the ğ of one line and the Ü of the next need the room.
  const nameLH = d ? 60 : 37;
  const nameLines = wrap(p.name, fit(d, leftW), nameFont);
  nameLines.forEach((line, i) => out.push(text(pad, y + i * nameLH, line, { ...nameFont, cls: 'up', delay: 80 })));
  y += (nameLines.length - 1) * nameLH;

  const tagFont: Font = { size: d ? 18.5 : 16 };
  const lh = d ? 27 : 23;
  y += d ? 40 : 32;
  const tagline = wrap(p.tagline, fit(d, leftW), tagFont);
  tagline.forEach((line, i) => out.push(text(pad, y + i * lh, line, { ...tagFont, fill: t.muted, cls: 'up', delay: 140 })));
  y += (tagline.length - 1) * lh + 30;

  // Focus areas as a slashed line of caps. A slash only ever sits between two items on one line.
  let fx = pad;
  const focus: string[] = [];
  p.focus.forEach((f, i) => {
    const label = f.toUpperCase();
    const w = measure(label, L);
    if (i && fx + 24 + w <= pad + leftW) {
      focus.push(text(fx + 8, y, '/', { ...L, fill: t.accent }));
      fx += 24;
    } else if (i) {
      fx = pad;
      y += 20;
    }
    focus.push(text(fx, y, label, { ...L, fill: t.ink2 }));
    fx += w;
  });
  out.push(`<g class="up" style="animation-delay:200ms">${focus.join('')}</g>`);

  const art = stack(t, d);
  let artBottom = 0;
  if (d) {
    const box = { x: 452, y: 64, w: W - pad - 452 + 10, h: 300 };
    out.push(place(art, box.x, box.y, box.w, box.h));
    artBottom = box.y + (box.h + art.h * Math.min(1, box.w / art.w, box.h / art.h)) / 2; // place() centres vertically
  } else {
    y += 16;
    const h = 180;
    out.push(place(art, pad, y, W - pad * 2, h));
    y += h;
  }

  // Now rows: label and text side by side on desktop; on phones the label sits above its text.
  y += d ? 42 : 30;
  const nowFont: Font = { size: d ? 15.5 : 15 };
  const textX = d ? pad + 96 : pad;
  p.now.forEach((item, i) => {
    const lines = wrap(item.text, d ? pad + leftW - textX : fit(d, leftW), nowFont);
    const ty = d ? y : y + 20;
    out.push(
      `<g class="up" style="animation-delay:${260 + i * 70}ms">` +
        text(pad, y, item.label.toUpperCase(), { ...lab(d, 10), fill: t.accent }) +
        lines.map((line, j) => text(textX, ty + j * 21, line, nowFont)).join('') +
        '</g>',
    );
    y = ty + (lines.length - 1) * 21 + (d ? 26 : 30);
  });

  y = Math.max(y, artBottom) + (d ? 14 : 4);
  out.push(rule(t, pad, y, W - pad * 2));
  const lang = s.languages[0];
  const row = figures(
    t, pad, y, W - pad * 2, d ? 4 : 2,
    [
      [`${s.contributionsLastYear}`, 'contributions, last 12 months'],
      [`${s.commitsAllTime}`, 'commits in my own repositories'],
      [`${s.repos.total}`, `repositories, ${s.repos.private} private`],
      [`${Math.round(lang.pct)}%`, `${lang.name}, by code volume`],
    ],
    d ? 34 : 30, 400, lab(d, 9.5),
  );
  out.push(row.svg);
  y += row.h;
  if (!d) {
    out.push(rule(t, pad, y, W - pad * 2));
    out.push(text(pad, y + 28, rev, { ...L, fill: t.meta }));
    y += 46;
  }
  const H = y + (d ? 6 : 0);
  return doc(W, H, t, title, sheet(t, 0, 0, W, H, 6) + out.join(''), '', UP + art.css);
}

// ─── Project cards ──────────────────────────────────────────────────────────

/** Name (with an arrow, since every card links), kind, summary and numbered highlights. */
function cardText(t: Theme, pr: Project, x: number, y0: number, w: number, big: boolean, d: boolean): { svg: string; y: number } {
  const out: string[] = [];
  let y = y0;
  const nameFont: Font = { size: big ? 26 : 21, weight: 500, tracking: -0.3 };
  out.push(text(x, y, pr.name, nameFont));
  const nameEnd = x + measure(pr.name, nameFont) + 10;
  out.push(arrow(nameEnd, y - 4, t.accent));
  // On phones the status tag moves here from the figure's corner, where the caption needs the room:
  // beside the name when both fit, else on a line of its own under it.
  if (!d) {
    const status = tag(t, 0, 0, STATUS[pr.status], 'end', 11);
    const beside = nameEnd + 17 + status.w <= x + w;
    out.push(tag(t, beside ? x + w : x + status.w, beside ? y - 15 : y + 10, STATUS[pr.status], 'end', 11).svg);
    if (!beside) y += 30;
  }
  y += big ? 22 : 20;
  const kindFont = lab(d, 10);
  const kind = wrap(pr.kind.toUpperCase(), w, kindFont, ' · ');
  kind.forEach((line, i) => out.push(text(x, y + i * 16, line, { ...kindFont, fill: t.meta })));
  y += (kind.length - 1) * 16 + (big ? 34 : 30);
  const sFont: Font = { size: big ? 16 : 15 };
  for (const line of wrap(pr.summary, fit(d, w), sFont)) {
    out.push(text(x, y, line, { ...sFont, fill: t.ink2 }));
    y += big ? 24 : 22;
  }
  y += 10;
  const hFont: Font = { size: 14 };
  pr.highlights.forEach((h, i) => {
    const lines = wrap(h, fit(d, w - 28), hFont);
    out.push(text(x, y, `0${i + 1}`, { ...lab(d, 10), fill: t.accent }));
    lines.forEach((line, j) => out.push(text(x + 28, y + j * 20, line, { ...hFont, fill: t.muted })));
    y += lines.length * 20 + 3;
  });
  return { svg: out.join(''), y };
}

const VISIBILITY = { private: 'PRIVATE SOURCE', 'soon-public': 'OPEN SOURCE SOON', public: 'OPEN SOURCE' } as const;
const STACK_FONT: Font = { size: 11.5, mono: true };

/** Footer height: one line when stack and visibility fit side by side, else two. */
const footerH = (pr: Project, w: number, d: boolean): number =>
  measure(pr.stack.join(' · '), STACK_FONT) + 32 + measure(VISIBILITY[pr.visibility], lab(d, 9.5)) <= w ? 42 : 62;

/** Stack and source visibility under a hairline: side by side, or stacked when the card is narrow. */
function footer(t: Theme, pr: Project, x: number, right: number, H: number, d: boolean): string {
  const small = lab(d, 9.5);
  const label = VISIBILITY[pr.visibility];
  const two = footerH(pr, right - x, d) > 42;
  const y = H - 19;
  const locked = pr.visibility === 'private';
  // One line: visibility right-aligned. Two lines: visibility under the stack, from the left.
  const lockX = two ? x : right - measure(label, small) - 16;
  return (
    rule(t, x, H - (two ? 62 : 42), right - x) +
    text(x, two ? y - 21 : y, pr.stack.join(' · '), { ...STACK_FONT, fill: t.meta }) +
    (locked ? lock(round(lockX), y - 10, t.meta) : '') +
    (two ? text(x + (locked ? 16 : 0), y, label, { ...small, fill: t.meta }) : text(right, y, label, { ...small, fill: t.meta, anchor: 'end' }))
  );
}

/** The figure box: drafting paper, caption, status tag, and the drawing. `css` animates the drawing. */
function figureBox(t: Theme, pr: Project, n: number, x: number, y: number, w: number, h: number, d: boolean): { svg: string; css: string } {
  const art = figureFor(t, pr, w - 20, h - 42, 1, d);
  return {
    svg:
      sheet(t, x, y, w, h) +
      text(x + 12, y + 20, `FIG. ${n} — ${pr.caption.toUpperCase()}`, { ...lab(d, 9), fill: t.meta }) +
      (d ? tag(t, x + w - 10, y + 8, STATUS[pr.status], 'end').svg : '') +
      place(art, x + 10, y + 34, w - 20, h - 42),
    css: art.css,
  };
}

/**
 * A project's drawing for a box of w × h. Its labels are dropped when the smallest would render
 * below 7.5px (phone drawings show at 0.87× on a 278px column), where they read as noise rather
 * than text; the mechanism carries the meaning.
 */
function figureFor(t: Theme, pr: Project, w: number, h: number, grow: number, d: boolean): Figure {
  const art = FIGURES[pr.figure](t, true);
  const k = Math.min(grow, w / art.w, h / art.h);
  return art.label * k * (d ? 1 : 0.87) >= 7.5 ? art : FIGURES[pr.figure](t, false);
}

/** Half-width card on desktop, where two sit side by side with a 22px gutter split between them. */
export const HALF = 412;
const GUTTER = 11;
const FIG_H = 240;

type CardOptions = { layout: Layout; side?: 'left' | 'right'; H?: number; padBottom?: number };

const cardWidth = (layout: Layout) => (layout === 'desktop' ? HALF : WIDTH.mobile);

/** Height a card needs, so a row of cards can share the tallest. */
export function cardHeight(t: Theme, pr: Project, layout: Layout): number {
  const W = cardWidth(layout);
  const d = layout === 'desktop';
  return cardText(t, pr, 24, FIG_H + 50, W - 48, false, d).y + 16 + footerH(pr, W - 48, d);
}

export function projectCard(t: Theme, pr: Project, n: number, title: string, o: CardOptions): string {
  const d = o.layout === 'desktop';
  const W = cardWidth(o.layout);
  const H = o.H ?? cardHeight(t, pr, o.layout);
  // Desktop pairs: the gutter is transparent space inside each image, so two cards fill the 846px
  // column exactly. Stacked cards get their gap as transparent space below the first one.
  const x0 = o.side === 'right' ? GUTTER : 0;
  const fullW = W + (d && o.side ? GUTTER : 0);
  const fig = figureBox(t, pr, n, x0 + 10, 10, W - 20, FIG_H, d);
  const body = fig.svg + cardText(t, pr, x0 + 24, FIG_H + 50, W - 48, false, d).svg + footer(t, pr, x0 + 24, x0 + W - 24, H, d);
  return doc(fullW, H + (o.padBottom ?? 0), t, title, panel(t, W, H, x0) + body, '', fig.css);
}

/** Full width: text left, a large figure right, and the metrics (if any) along the bottom. */
export function wideCard(t: Theme, pr: Project, n: number, title: string, padBottom = 0): string {
  const W = WIDTH.desktop;
  const split = 404;
  const left = cardText(t, pr, 28, 58, split - 56, true, true);
  const figH = Math.max(left.y + 4, 300);
  const metrics = pr.metrics?.length ? figures(t, 28, figH + 22, W - 56, 4, pr.metrics, 26, 300, { ...LABEL, size: 9.5 }) : null;
  const H = figH + (metrics ? 22 + metrics.h + 44 : 64);
  const fig = figureBox(t, pr, n, split, 10, W - split - 10, figH, true);
  const body = fig.svg + left.svg + (metrics ? rule(t, 28, figH + 22, W - 56) + metrics.svg : '') + footer(t, pr, 28, W - 28, H, true);
  return doc(W, H + padBottom, t, title, panel(t, W, H) + body, '', UP + fig.css);
}

// ─── Skills ─────────────────────────────────────────────────────────────────

export function skillsPanel(t: Theme, layout: Layout, skills: Skills, title: string): string {
  const d = layout === 'desktop';
  const W = WIDTH[layout];
  const pad = d ? 28 : 20;
  const L = lab(d);
  const out: string[] = [];

  out.push(text(pad, 38, 'CURRENTLY LEARNING', { ...L, fill: t.meta }));
  let lx = pad + measure('CURRENTLY LEARNING', L) + 12;
  for (const item of skills.learning) {
    const g = tag(t, lx, 24, item.toUpperCase(), 'start', L.size);
    out.push(g.svg);
    lx += g.w + 8;
  }
  out.push(rule(t, pad, 60, W - pad * 2));

  const cols = d ? 3 : 2;
  const gap = d ? 28 : 16;
  const colW = (W - pad * 2 - gap * (cols - 1)) / cols;
  const item: Font = { size: d ? 15 : 14 };
  let rowY = 60;
  for (let i = 0; i < skills.groups.length; i += cols) {
    const groups = skills.groups.slice(i, i + cols);
    const heads = groups.map((g) => wrap(g.title.toUpperCase(), colW - 26, L));
    const headH = Math.max(...heads.map((h) => h.length)) * 15;
    let rowH = 0;
    groups.forEach((g, j) => {
      const x = pad + j * (colW + gap);
      out.push(text(x, rowY + 34, `0${i + j + 1}`, { ...lab(d, 10), fill: t.accent }));
      heads[j].forEach((line, k) => out.push(text(x + 26, rowY + 34 + k * 15, line, { ...L, fill: t.ink2 })));
      g.items.forEach((name, k) => out.push(text(x, rowY + 47 + headH + k * 23, name, item)));
      rowH = Math.max(rowH, 35 + headH + g.items.length * 23);
    });
    rowY += rowH + 6;
  }

  out.push(rule(t, pad, rowY + 8, W - pad * 2));
  out.push(text(pad, rowY + 38, skills.practices.title.toUpperCase(), { ...L, fill: t.ink2 }));
  const pFont: Font = { size: d ? 15 : 14 };
  const lines = wrap(skills.practices.items.join(' · '), fit(d, W - pad * 2), pFont, ' · ');
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
  const L = lab(d);
  const titleEnd = 34 + measure(title, { size });
  const metaW = meta ? measure(meta, L) : 0;
  const body =
    text(1, H - 22, num, { ...lab(d, 11), fill: t.accent }) +
    text(34, H - 20, title, { size, weight: 500, tracking: -0.3 }) +
    (meta && titleEnd + metaW + 24 < W ? text(W - 3, H - 22, meta, { ...L, fill: t.meta, anchor: 'end' }) : '') +
    rule(t, 0, H - 6, W) +
    `<rect x="0" y="${H - 7}" width="22" height="3" fill="${t.accent}"/>`;
  return doc(W, H, t, title, body, '', '');
}

export function aboutPanel(t: Theme, layout: Layout, p: Profile, title: string): string {
  const d = layout === 'desktop';
  const W = WIDTH[layout];
  const pad = d ? 32 : 20;
  const out: string[] = [text(pad, 44, 'ABSTRACT', { ...lab(d), fill: t.meta })];
  // The lede introduces him across the full width; on desktop the bio and the principles then
  // share two columns under a hairline.
  const ledeFont: Font = { size: d ? 22 : 18, weight: 500 };
  let y = d ? 84 : 76;
  for (const line of wrap(p.about.lede, fit(d, W - pad * 2), ledeFont)) {
    out.push(text(pad, y, line, { ...ledeFont, tracking: -0.3 }));
    y += d ? 30 : 26;
  }
  const top = y + (d ? 4 : 2);
  out.push(rule(t, pad, top, W - pad * 2));
  y = top + (d ? 34 : 30);

  const leftW = d ? 300 : W - pad * 2;
  const iFont: Font = { size: 15 };
  p.about.paragraphs.forEach((para, i) => {
    if (i) y += 10;
    for (const line of wrap(para, fit(d, leftW), iFont)) {
      out.push(text(pad, y, line, { ...iFont, fill: t.muted }));
      y += 23;
    }
  });

  const rx = d ? 392 : pad;
  const rw = d ? W - pad - rx : W - pad * 2;
  let ry = d ? top + 34 : y + 28;
  if (!d) out.push(rule(t, pad, y + 2, rw));
  const bFont: Font = { size: 15 };
  const hFont: Font = { size: 17, weight: 500 };
  p.about.principles.forEach(([head, body], i) => {
    if (i) ry += 20;
    out.push(text(rx, ry, `0${i + 1}`, { ...lab(d, 10), fill: t.accent }));
    for (const line of wrap(head, fit(d, rw - 28), hFont)) {
      out.push(text(rx + 28, ry + 1, line, hFont));
      ry += 23;
    }
    ry += 3;
    for (const line of wrap(body, fit(d, rw - 28), bFont)) {
      out.push(text(rx + 28, ry, line, { ...bFont, fill: t.muted }));
      ry += 22;
    }
  });
  const H = Math.max(y, ry) + (d ? 22 : 18);
  const columnRule = d ? `<rect x="364" y="${round(top + 14)}" width="1" height="${round(H - top - 36)}" fill="${t.rule}"/>` : '';
  return doc(W, H, t, title, panel(t, W, H) + columnRule + out.join(''));
}

/** Label/value cells in rows, values wrapped to their column. Shared by the title block and case headers. */
function cells(t: Theme, d: boolean, W: number, items: [string, string][], widths: number[], cols: number, top: number, closingRule: boolean): { svg: string; y: number } {
  const vFont: Font = { size: 15 };
  // Lists break at their separators first; a piece too long for the cell then breaks between words.
  const values = items.map(([, value], i) => wrap(value, fit(d, widths[i] * W - 30), vFont, ' · ').flatMap((line) => wrap(line, fit(d, widths[i] * W - 30), vFont)));
  const out: string[] = [];
  let y = top;
  for (let r = 0; r < items.length; r += cols) {
    const rowH = 56 + (Math.max(...values.slice(r, r + cols).map((v) => v.length)) - 1) * 19;
    let x = 0;
    items.slice(r, r + cols).forEach(([label], j) => {
      const i = r + j;
      if (j) out.push(`<rect x="${round(x)}" y="${y}" width="1" height="${rowH}" fill="${t.rule}"/>`);
      out.push(text(x + 16, y + 21, label, { ...lab(d, 9), fill: t.meta }));
      values[i].forEach((line, k) => out.push(text(x + 16, y + 42 + k * 19, line, { ...vFont, cls: 'n' })));
      x += widths[i] * W;
    });
    y += rowH;
    if (closingRule || r + cols < items.length) out.push(rule(t, 0, y, W));
  }
  return { svg: out.join(''), y };
}

/** The drawing's title block, closing the page. Its revision date moves with every sync. */
export function titleBlock(t: Theme, layout: Layout, p: Profile, s: Stats, sheets: number, title: string): string {
  const d = layout === 'desktop';
  const W = WIDTH[layout];
  const items: [string, string][] = [
    ['DRAWN BY', p.name],
    ['CHECKED BY', 'GitHub Actions, every 6 h'],
    ['REVISION', s.fetchedAt.slice(0, 10)],
    ['SHEET', `01 OF ${String(sheets).padStart(2, '0')}`],
  ];
  const note = 'Numbers and drawings are regenerated from live GitHub data. Private work is counted, never named.';
  const grid = cells(t, d, W, items, d ? [0.34, 0.3, 0.19, 0.17] : [0.5, 0.5, 0.5, 0.5], d ? 4 : 2, 0, true);
  const nFont: Font = { size: 14 };
  const lines = wrap(note, fit(d, W - 84), nFont);
  const out = [grid.svg, text(16, grid.y + 26, 'NOTE', { ...lab(d, 9), fill: t.meta })];
  lines.forEach((line, i) => out.push(text(68, grid.y + 26 + i * 20, line, { ...nFont, fill: t.muted })));
  const H = grid.y + 26 + (lines.length - 1) * 20 + 20;
  return doc(W, H, t, title, panel(t, W, H) + out.join(''));
}

/** Case-study page header: the project's drawing at full size above a title block. */
export function caseHeader(t: Theme, layout: Layout, pr: Project, n: number, title: string): string {
  const d = layout === 'desktop';
  const W = WIDTH[layout];
  const figH = d ? 300 : 210;
  const grow = d ? 1.7 : 1.2;
  const art = figureFor(t, pr, W - 40, figH, grow, d);
  const items: [string, string][] = [
    ['PROJECT', pr.name],
    ['KIND', pr.kind],
    ['SOURCE', { private: 'Private', 'soon-public': 'Open source soon', public: 'Open source' }[pr.visibility]],
    ['STACK', pr.stack.join(' · ')],
  ];
  const top = 44 + figH + 18;
  const grid = cells(t, d, W, items, d ? [0.2, 0.34, 0.18, 0.28] : [0.5, 0.5, 0.5, 0.5], d ? 4 : 2, top, false);
  // The sheet label drops the project name when it would run into the status tag.
  const status = tag(t, W - 12, 12, STATUS[pr.status], 'end', d ? 10.5 : 11);
  const sheetNo = `SHEET ${String(n + 1).padStart(2, '0')}`;
  const full = `${sheetNo} — ${pr.name.toUpperCase()}`;
  const body = [
    text(16, 26, 16 + measure(full, lab(d, 9.5)) + 12 <= W - 12 - status.w ? full : sheetNo, { ...lab(d, 9.5), fill: t.meta }),
    status.svg,
    place(art, 20, 44, W - 40, figH, grow),
    rule(t, 0, top, W),
    grid.svg,
  ];
  const H = grid.y;
  return doc(W, H, t, title, sheet(t, 0, 0, W, H, 6) + body.join(''), '', art.css);
}

// ─── Buttons ────────────────────────────────────────────────────────────────

// kami's ink-blue call to action and its warm-sand secondary, in each theme. 48px tall, so the
// target clears the 44pt and 48dp touch minimums at the 1:1 size buttons keep on phones.
export function button(t: Theme, kind: 'primary' | 'secondary', label: string, title: string): string {
  const H = 48;
  const font: Font = { size: 11.5, mono: true, tracking: 1.2 };
  const W = Math.round(22 + measure(label, font) + 14 + 10 + 22);
  const fill = kind === 'primary' ? t.accent : t.rule;
  const edge = kind === 'primary' ? t.accent : t.mode === 'dark' ? '#45443f' : t.faces.right; // derived: dark surface lifted to show an edge on GitHub's canvas
  const color = kind === 'primary' ? t.panel : t.ink;
  const body =
    `<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="6" fill="${fill}" stroke="${edge}"/>` +
    text(22, H / 2 + 4.5, label, { ...font, fill: color }) +
    `<path d="M${W - 32} ${H / 2 + 4}l8-8M${W - 30} ${H / 2 - 4}h6v6" fill="none" stroke="${color}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>`;
  return doc(W, H, t, title, body);
}
