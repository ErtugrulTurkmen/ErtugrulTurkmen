import type { Day } from './data.ts';
import { doc, round, sheet, text, WIDTH } from './svg.ts';
import type { Theme } from './theme.ts';

// Isometric contribution calendar, calendar only, on drafting paper. Bar height follows each
// day's rank among active days rather than the raw count, so ~300 contributions a year still
// read as a skyline. Bars rise once, week by week, when the image loads.

const A = 12.6; // half tile width on screen
const B = A / 2; // 2:1 isometric
const MIN_H = 6;
const MAX_H = 58;
const GAP = 0.08; // fraction of a tile left empty on each side

const project = (w: number, d: number): [number, number] => [(w - d) * A, (w + d) * B];

function shade(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16);
  return '#' + [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.round(v * k).toString(16).padStart(2, '0')).join('');
}

const CSS = '.g{transform-box:fill-box;transform-origin:50% 100%;animation:g 1s cubic-bezier(.16,1,.3,1) both}@keyframes g{from{transform:scaleY(0)}}';

export function calendar3d(t: Theme, days: Day[], title: string): string {
  const counts = [...new Set(days.filter((d) => d.count > 0).map((d) => d.count))].sort((a, b) => a - b);
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

  const tiles = days.map((d) => {
    const q = d.count > 0 ? rank(d.count) : 0;
    const h = d.count > 0 ? MIN_H + q * (MAX_H - MIN_H) : 0;
    const top = t.calendar[d.count > 0 ? 1 + Math.min(3, Math.floor(q * 4)) : 0];
    const up = ([x, y]: [number, number]): [number, number] => [x, y - h];
    const n = project(d.week + GAP, d.weekday + GAP); // far corner
    const e = project(d.week + 1 - GAP, d.weekday + GAP);
    const s = project(d.week + 1 - GAP, d.weekday + 1 - GAP); // near corner
    const w = project(d.week + GAP, d.weekday + 1 - GAP);
    let svg = `<polygon points="${points([up(n), up(e), up(s), up(w)])}" fill="${top}"/>`;
    if (h > 0) {
      const edge = `stroke="${t.ink}" stroke-opacity=".28" stroke-width=".6" stroke-linejoin="round"`;
      svg =
        `<g class="g" style="animation-delay:${400 + d.week * 22}ms">` +
        `<polygon points="${points([up(w), up(s), s, w])}" fill="${shade(top, 0.7)}" ${edge}/>` +
        `<polygon points="${points([up(s), up(e), e, s])}" fill="${shade(top, 0.52)}" ${edge}/>` +
        `<polygon points="${points([up(n), up(e), up(s), up(w)])}" fill="${top}" ${edge}/></g>`;
    }
    return { depth: d.week + d.weekday, week: d.week, svg };
  });
  // Painter's order: far tiles first, so nearer bars overlap them.
  tiles.sort((a, b) => a.depth - b.depth || a.week - b.week);

  // Month ticks along the near-left edge, at the first week each month appears. A partial first
  // month gives way to the next one rather than colliding with it.
  const firsts: { week: number; month: number }[] = [];
  for (const d of days) {
    const month = Number(d.date.slice(5, 7)) - 1;
    const last = firsts.at(-1);
    if (last?.month === month) continue;
    if (last && d.week - last.week < 3) firsts.pop();
    firsts.push({ week: d.week, month });
  }
  const ticks = firsts.map(({ week, month }) => {
    const [x, y] = project(week + 0.5, 7.2);
    points([[x - 14, y + 16]]);
    return text(x - 2, y + 14, MONTHS[month], { size: 9, mono: true, tracking: 1, fill: t.meta, anchor: 'end' });
  });

  const W = WIDTH.desktop;
  const artW = maxX - minX;
  const artH = maxY - minY;
  const H = Math.ceil(artH + 96);
  const dx = (W - artW) / 2 - minX;
  const dy = 48 - minY;
  const small = { size: 9, mono: true, tracking: 1, fill: t.meta } as const;
  const swatches = t.calendar.map((c, i) => `<rect x="${W - 104 + i * 13}" y="${H - 29}" width="10" height="10" rx="2" fill="${c}"/>`).join('');
  const body =
    sheet(t, 0, 0, W, H, 6) +
    text(16, 26, 'FIG. 6 — CONTRIBUTIONS, LAST 12 MONTHS', { ...small, size: 9.5 }) +
    text(W - 16, 26, 'PRIVATE WORK INCLUDED', { ...small, size: 9.5, anchor: 'end' }) +
    `<g transform="translate(${round(dx)} ${round(dy)})">${tiles.map((x) => x.svg).join('')}${ticks.join('')}</g>` +
    text(W - 110, H - 20, 'LESS', { ...small, anchor: 'end' }) +
    swatches +
    text(W - 36, H - 20, 'MORE', small);
  return doc(W, H, t, title, body, '', CSS);
}

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
