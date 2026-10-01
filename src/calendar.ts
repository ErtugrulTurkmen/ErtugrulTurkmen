import type { Day } from './data.ts';
import { doc, round, sheet, text, WIDTH, type Layout } from './svg.ts';
import type { Theme } from './theme.ts';

// Bars are scaled by each day's rank among active days, not its count, so a few hundred
// contributions a year still read as a skyline.

const GAP = 0.08; // share of a tile left empty on each side

function shade(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16);
  return '#' + [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.round(v * k).toString(16).padStart(2, '0')).join('');
}

const CSS = '.g{transform-box:fill-box;transform-origin:50% 100%;animation:g 1s cubic-bezier(.16,1,.3,1) both}@keyframes g{from{transform:scaleY(0)}}';

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

export function calendar3d(t: Theme, layout: Layout, days: Day[], fig: number, title: string): string {
  const d = layout === 'desktop';
  const W = WIDTH[layout];
  const weeks = Math.max(...days.map((x) => x.week)) + 1;
  const A = d ? 12.6 : (W - 40) / (weeks + 7);
  const B = A / 2; // 2:1 isometric
  const k = A / 12.6;
  const MIN_H = 6 * k;
  const MAX_H = 58 * k;
  const project = (w: number, dd: number): [number, number] => [(w - dd) * A, (w + dd) * B];
  const small = { size: d ? 9 : 11, mono: true, tracking: 1, fill: t.meta } as const;

  const counts = [...new Set(days.filter((x) => x.count > 0).map((x) => x.count))].sort((a, b) => a - b);
  const rank = (count: number) => (counts.length > 1 ? counts.indexOf(count) / (counts.length - 1) : 1);

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const points = (ps: [number, number][]) => {
    for (const [x, y] of ps) {
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
    return ps.map(([x, y]) => `${round(x)},${round(y)}`).join(' ');
  };

  const heightOf = (count: number) => (count > 0 ? MIN_H + rank(count) * (MAX_H - MIN_H) : 0);
  const tiles = days.map((day) => {
    const q = day.count > 0 ? rank(day.count) : 0;
    const h = heightOf(day.count);
    const top = t.calendar[day.count > 0 ? 1 + Math.min(3, Math.floor(q * 4)) : 0];
    const up = ([x, y]: [number, number]): [number, number] => [x, y - h];
    const n = project(day.week + GAP, day.weekday + GAP); // far corner
    const e = project(day.week + 1 - GAP, day.weekday + GAP);
    const s = project(day.week + 1 - GAP, day.weekday + 1 - GAP); // near corner
    const w = project(day.week + GAP, day.weekday + 1 - GAP);
    // Every day keeps its floor tile, so a growing bar never leaves a hole.
    let svg = `<polygon points="${points([n, e, s, w])}" fill="${t.calendar[0]}"/>`;
    if (h > 0) {
      const edge = `stroke="${t.ink}" stroke-opacity=".28" stroke-width="${d ? 0.6 : 0.4}" stroke-linejoin="round"`;
      svg +=
        `<g class="g" style="animation-delay:${400 + day.week * 22}ms">` +
        `<polygon points="${points([up(w), up(s), s, w])}" fill="${shade(top, 0.7)}" ${edge}/>` +
        `<polygon points="${points([up(s), up(e), e, s])}" fill="${shade(top, 0.52)}" ${edge}/>` +
        `<polygon points="${points([up(n), up(e), up(s), up(w)])}" fill="${top}" ${edge}/></g>`;
    }
    return { depth: day.week + day.weekday, week: day.week, svg };
  });
  // Painter's order: far tiles first, so nearer bars overlap them.
  tiles.sort((a, b) => a.depth - b.depth || a.week - b.week);

  // A month is labelled at its first week; a partial first month gives way to the next.
  const firsts: { week: number; month: number }[] = [];
  for (const day of days) {
    const month = Number(day.date.slice(5, 7)) - 1;
    const last = firsts.at(-1);
    if (last?.month === month) continue;
    if (last && day.week - last.week < 3) firsts.pop();
    firsts.push({ week: day.week, month });
  }
  const ticks = firsts
    .filter((_, i) => d || i % 2 === 0)
    .map(({ week, month }) => {
      const [x, y] = project(week + 0.5, 7.2);
      points([[x - small.size * 1.6, y + small.size + 7]]);
      return text(x - 2, y + small.size + 5, MONTHS[month], { ...small, anchor: 'end' });
    });

  const peak = days.reduce((a, b) => (b.count > a.count ? b : a));
  const [px, py] = project(peak.week + 0.5, peak.weekday + 0.5);
  const dot = (cx: number, cy: number) => `<circle cx="${round(cx)}" cy="${round(cy)}" r="${d ? 2.6 : 2.2}" fill="${t.accent}" stroke="${t.paper}" stroke-width="1" class="f" style="animation-delay:${400 + weeks * 22 + 600}ms"/>`;
  const marker = peak.count > 0 ? dot(px, py - heightOf(peak.count)) : '';
  const peakText = `PEAK ${peak.count} · ${Number(peak.date.slice(8))} ${MONTHS[Number(peak.date.slice(5, 7)) - 1]}`;

  const artW = maxX - minX;
  const artH = maxY - minY;
  const head = d ? 48 : 64;
  const H = Math.ceil(artH + head + 48);
  const dx = (W - artW) / 2 - minX;
  const dy = head - minY;
  const swatches = t.calendar.map((c, i) => `<rect x="${W - (d ? 104 : 116) + i * 13}" y="${H - 29}" width="10" height="10" rx="2" fill="${c}"/>`).join('');
  const heading = d
    ? text(16, 26, `FIG. ${fig} — CONTRIBUTIONS, LAST 12 MONTHS`, { ...small, size: 9.5 }) +
      text(W - 16, 26, 'PRIVATE WORK INCLUDED', { ...small, size: 9.5, anchor: 'end' })
    : text(16, 28, `FIG. ${fig} — CONTRIBUTIONS, 12 MONTHS`, small) + text(16, 46, 'PRIVATE WORK INCLUDED', small);
  const body =
    sheet(t, 0, 0, W, H, 6) +
    heading +
    `<g transform="translate(${round(dx)} ${round(dy)})">${tiles.map((x) => x.svg).join('')}${ticks.join('')}${marker}</g>` +
    (peak.count > 0 ? dot(20, H - 24) + text(30, H - 20, peakText, { ...small, cls: 'f', delay: 400 + weeks * 22 + 600 }) : '') +
    text(W - (d ? 110 : 122), H - 20, 'LESS', { ...small, anchor: 'end' }) +
    swatches +
    text(W - (d ? 36 : 48), H - 20, 'MORE', small);
  return doc(W, H, t, title, body, '', CSS);
}
