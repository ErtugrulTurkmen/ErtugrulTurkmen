import { Pen, type Art, type P3 } from './iso.ts';
import { lock, measure, round, text } from './svg.ts';
import type { Theme } from './theme.ts';

// One drawing per project, showing what it does. Linework plots once; the mechanism then loops
// slowly, since most readers reach a card long after the page has loaded.

// `label` is the smallest label size, so a caller can tell when shrinking would make it unreadable.
export type Figure = Art & { css: string; label: number };

const pct = (n: number) => `${Math.round(n * 10) / 10}%`;

// Hidden until `begin`: before its motion starts, a dot sits at (0,0).
const dot = (r: number, fill: string, begin: number, dur: number, path: string): string =>
  `<circle r="${r}" fill="${fill}" opacity="0"><set attributeName="opacity" to="1" begin="${begin}s"/>` +
  `<animateMotion dur="${dur}s" begin="${begin}s" repeatCount="indefinite" path="${path}"/></circle>`;

/** Hero: the layers every project is built in, drawn stacked, then exploded apart. */
export function stack(t: Theme, labels: boolean): Figure {
  const pen = new Pen(t, labels ? 0.8 : 0.72, 100, 30);
  const W = 120;
  const H = 8;
  const GAP = 60;
  const RISE_AT = 500; // early, or the collapsed stack reads as a jumble
  const RISE = 1000;
  const layers: [string, string][] = [
    ['PLATFORM', 'Linux · Bash · Git'],
    ['DATA', 'PostgreSQL · SQLite'],
    ['DOMAIN', 'clean architecture'],
    ['INTERFACE', 'web · desktop · mobile'],
  ];
  let css = '';
  const groups = layers.map(([name, sub], i) => {
    const z = i * GAP;
    const top = z + H;
    let g = pen.box(0, 0, z, W, W, H, { hatch: i === 0 });
    if (i === 0) g += pen.stroke(pen.d([[14, 14, top], [106, 14, top], [106, 106, top], [14, 106, top]], true), { width: 0.8, color: t.meta });
    if (i === 1) {
      g += pen.cylinder(38, 42, top, 15, 20, { rings: [7, 14] });
      g += pen.cylinder(82, 80, top, 15, 20, { accent: true, rings: [7, 14] });
    }
    if (i === 2) {
      const cells: [number, number][] = [];
      for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) cells.push([a, b]);
      cells.sort((p, q) => p[0] + p[1] - (q[0] + q[1]));
      for (const [a, b] of cells) g += pen.box(14 + a * 34, 14 + b * 34, top, 20, 20, a === 1 && b === 1 ? 20 : 12, { accent: a === 1 && b === 1 });
    }
    if (i === 3) {
      const devices: [x: number, y: number, w: number, h: number][] = [[14, 72, 36, 26], [58, 40, 50, 34], [88, 92, 14, 22]];
      for (const [x, y, w, h] of devices) {
        g += pen.box(x, y, top, w, 5, h);
        g += pen.stroke(pen.d([[x + 3, y + 5, top + 3], [x + w - 3, y + 5, top + 3], [x + w - 3, y + 5, top + h - 3], [x + 3, y + 5, top + h - 3]], true), { width: 0.8, color: t.accent });
      }
    }
    if (labels) {
      const [ax, ay] = pen.p([W, 0, top]);
      const lx = ax + 34;
      const at = RISE_AT + RISE + i * 120;
      g += `<path d="M${round(ax + 6)} ${round(ay)}H${round(lx - 8)}" stroke="${t.meta}" stroke-width=".8" class="f" style="animation-delay:${at}ms"/>`;
      g += pen.label(lx, ay + 4, `0${i + 1}`, { size: 10, mono: true, fill: t.accent }, at);
      g += pen.label(lx + 24, ay + 4, name, { size: 10.5, mono: true, tracking: 1.2, fill: t.ink }, at);
      g += pen.label(lx, ay + 22, sub, { size: 12.5, fill: t.muted }, at);
    }
    const lift = round(z * pen.scale);
    css += `.r${i}{animation:r${i} ${RISE}ms cubic-bezier(.16,1,.3,1) ${RISE_AT}ms both}@keyframes r${i}{from{transform:translateY(${lift}px)}}`;
    if (i) css += `.b${i}{animation:bob 7s ease-in-out ${RISE_AT + RISE + i * 500}ms infinite}`;
    return `<g class="r${i}"><g class="b${i}">${g}</g></g>`;
  });
  css += '@keyframes bob{50%{transform:translateY(-2.5px)}}';

  let guides = '';
  for (let i = 0; i < layers.length - 1; i++) {
    for (const [x, y] of [[0, W], [W, 0], [W, W]] as const) {
      guides += pen.d([[x, y, i * GAP + H], [x, y, (i + 1) * GAP]]);
    }
  }
  const guide = `<path d="${guides}" fill="none" stroke="${t.accent}" stroke-width=".8" stroke-dasharray="2 3" class="f" style="animation-delay:${RISE_AT + RISE}ms"/>`;

  // A request runs down the front edge, and its response back up.
  const [qx, qy] = pen.p([W, W, (layers.length - 1) * GAP + H]);
  const [bx, by] = pen.p([W, W, H]);
  const begin = `${(RISE_AT + RISE) / 1000}s`;
  const pulse =
    `<g class="smil"><circle r="3" fill="${t.accent}" opacity="0"><set attributeName="opacity" to="1" begin="${begin}"/>` +
    `<animateMotion dur="3.6s" begin="${begin}" repeatCount="indefinite" keyPoints="0;1;0" keyTimes="0;.5;1" calcMode="linear" path="M${round(qx)} ${round(qy)}L${round(bx)} ${round(by)}"/></circle></g>`;
  return { ...pen.done(groups.join('') + guide + pulse), css, label: 10 };
}

/** TruckLister: numbered products assigned to the truck's four doors, on a loop. */
export function truck(t: Theme, labels: boolean): Figure {
  const pen = new Pen(t, 0.9, 100, 26);
  let out = pen.box(-2, 10, 8, 244, 44, 6);
  out += pen.box(0, 0, 14, 190, 64, 72);
  const doors: [number, number][] = [[10, 46], [56, 92], [102, 138], [148, 184]];
  for (const [a, b] of doors) {
    out += pen.stroke(pen.d([[a, 64, 22], [b, 64, 22], [b, 64, 78], [a, 64, 78]], true), { width: 1 });
    out += pen.stroke(pen.d([[(a + b) / 2, 64, 22], [(a + b) / 2, 64, 78]]), { width: 0.7, color: t.meta });
  }
  out += pen.box(194, 6, 14, 46, 52, 50);
  out += pen.stroke(pen.d([[202, 58, 40], [224, 58, 40], [224, 58, 58], [202, 58, 58]], true), { width: 0.9, color: t.accent });
  out += pen.stroke(pen.d([[240, 12, 40], [240, 52, 40], [240, 52, 58], [240, 12, 58]], true), { width: 0.9, color: t.accent });
  for (const [x, y] of [[30, 64], [62, 64], [160, 64], [222, 58]] as const) {
    const rim = pen.d(pen.circle([x, y + 0.5, 10], 10, 'xz'), true);
    out += pen.fill(rim, t.faces.right) + pen.stroke(rim) + pen.stroke(pen.d(pen.circle([x, y + 0.6, 10], 3.5, 'xz'), true), { width: 0.8 });
  }
  out += pen.box(-86, 104, 0, 128, 40, 5, { hatch: true });
  const linesDrawn = pen.delay + 600;

  const CYCLE = 10;
  const START = Math.max(1800, linesDrawn);
  let css = '';
  // A door label's fade-in and highlight share one element, so both delays live in its class rule:
  // an inline animation-delay would override the pair.
  const doorLabels = labels
    ? doors.map(([a, b], i) => {
        const [x, y] = pen.p([(a + b) / 2, 64, 90]);
        pen.include(x - 8, y - 10);
        pen.include(x + 8, y + 2);
        return text(x, y, `D${i + 1}`, { size: 10.5, mono: true, anchor: 'middle', fill: t.meta, cls: `dl${i}` });
      })
    : [];
  const loads: [product: string, door: number][] = [['07', 2], ['12', 0], ['03', 3], ['21', 1]];
  // Boxes park in front of their door's opening, clear of its frame and the wheels.
  const boxes = loads.map(([n, door], k) => {
    const sx = -80 + k * 30;
    const [a, b] = doors[door];
    const [x0, y0] = pen.p([sx, 114, 5]);
    const [x1, y1] = pen.p([(a + b) / 2 - 9, 66, 34]);
    const dx = round(x1 - x0);
    const dy = round(y1 - y0);
    let g = pen.box(sx, 114, 5, 18, 18, 18, { accent: true });
    const [lx, ly] = pen.p([sx + 9, 114 + 9, 23]);
    if (labels) g += pen.label(lx, ly + 3.5, n, { size: 9.5, mono: true, anchor: 'middle', fill: t.accent }, linesDrawn);
    const s = 12 + k * 15;
    const e = s + 11;
    css +=
      `.bx${k}{animation:bx${k} ${CYCLE}s cubic-bezier(.6,0,.3,1) ${START}ms infinite both}` +
      `@keyframes bx${k}{0%,${pct(s)}{transform:translate(0,0);opacity:1}${pct(e)},86%{transform:translate(${dx}px,${dy}px);opacity:1}` +
      `93%{transform:translate(${dx}px,${dy}px);opacity:0}94%{transform:translate(0,0);opacity:0}100%{transform:translate(0,0);opacity:1}}` +
      `.dl${door}{animation:f .7s ease-out ${linesDrawn}ms both,dl${door} ${CYCLE}s ${START}ms infinite}` +
      `@keyframes dl${door}{0%,${pct(e)}{fill:${t.meta}}${pct(e + 1)},86%{fill:${t.accent}}93%,100%{fill:${t.meta}}}`;
    return `<g class="bx${k}">${g}</g>`;
  });
  const [qx, qy] = pen.p([-22, 144, 0]);
  const dock = labels ? pen.label(qx - 10, qy + 24, 'DOCK QUEUE', { size: 9.5, mono: true, tracking: 1, fill: t.meta, anchor: 'end' }, linesDrawn) : '';
  return { ...pen.done(out + doorLabels.join('') + boxes.join('') + dock), css, label: 9.5 };
}

/** TemirTech: a browser window whose hero is a slowly turning wireframe solid. */
export function wireframe(t: Theme, labels: boolean): Figure {
  const W = 290;
  const H = 168;
  const phi = (1 + Math.sqrt(5)) / 2;
  const v: P3[] = [];
  for (const a of [-1, 1]) for (const b of [-phi, phi]) v.push([0, a, b], [a, b, 0], [b, 0, a]);
  const edges: [number, number][] = [];
  for (let i = 0; i < v.length; i++)
    for (let j = i + 1; j < v.length; j++) if (Math.abs(Math.hypot(v[i][0] - v[j][0], v[i][1] - v[j][1], v[i][2] - v[j][2]) - 2) < 1e-6) edges.push([i, j]);
  const cx = W / 2;
  const cy = 98;
  const R = 26;
  const tilt = 0.38;
  const frame = (yaw: number) =>
    edges
      .map((e) =>
        e
          .map((k, n) => {
            const [x, y, z] = v[k];
            const x1 = x * Math.cos(yaw) + z * Math.sin(yaw);
            const z1 = -x * Math.sin(yaw) + z * Math.cos(yaw);
            const y1 = y * Math.cos(tilt) - z1 * Math.sin(tilt);
            return `${n ? 'L' : 'M'}${round(cx + x1 * R)} ${round(cy - y1 * R)}`;
          })
          .join(''),
      )
      .join('');
  const N = 40;
  // Offset by three frames, so frame 0, also the still, is a three-quarter view.
  const frames = Array.from({ length: N + 1 }, (_, i) => frame(((i + 3) / N) * Math.PI * 2));
  const win =
    `M6.5 .5H${W - 6.5}a6 6 0 0 1 6 6V${H - 6.5}a6 6 0 0 1-6 6H6.5a6 6 0 0 1-6-6V6.5a6 6 0 0 1 6-6Z` + `M.5 24H${W - 0.5}`;
  const svg =
    `<path d="${win}" fill="${t.faces.top}" class="f" style="animation-delay:400ms"/>` +
    `<path d="${win}" fill="none" stroke="${t.ink}" stroke-width="1.1" pathLength="1" class="d" style="animation-delay:100ms"/>` +
    [14, 27, 40].map((x) => `<circle cx="${x}" cy="12" r="3.5" fill="none" stroke="${t.meta}" class="f" style="animation-delay:700ms"/>`).join('') +
    (labels ? text(W - 12, 16, 'TR / EN', { size: 9.5, mono: true, tracking: 1, fill: t.meta, anchor: 'end', cls: 'f', delay: 800 }) : '') +
    `<ellipse cx="${cx}" cy="${cy + 56}" rx="30" ry="4" fill="${t.rule}" class="f" style="animation-delay:900ms"/>` +
    `<g class="smil"><path d="${frames[0]}" fill="none" stroke="${t.accent}" stroke-width="1.1" stroke-linejoin="round" class="f" style="animation-delay:900ms">` +
    `<animate attributeName="d" dur="24s" repeatCount="indefinite" values="${frames.join(';')}"/></path></g>` +
    // display as an attribute, so a renderer without CSS shows only the SMIL path.
    `<path class="still" display="none" d="${frames[0]}" fill="none" stroke="${t.accent}" stroke-width="1.1"/>` +
    (labels ? text(16, H - 14, 'PERF BUDGET · CI', { size: 9, mono: true, tracking: 1, fill: t.meta, cls: 'f', delay: 1000 }) : '');
  return { svg, w: W + 1, h: H + 1, css: '', label: 9 };
}

/** CariYonetim: the ledger filling in on screen, beside its encrypted database. Unlabelled. */
export function ledger(t: Theme, _labels: boolean): Figure {
  const pen = new Pen(t, 1.15, 100, 28);
  let out = pen.box(43, -8, 0, 44, 26, 6);
  out += pen.box(59, 2, 6, 12, 4, 18);
  out += pen.box(0, 0, 22, 130, 8, 58);
  out += pen.stroke(pen.d([[5, 8, 27], [125, 8, 27], [125, 8, 75], [5, 8, 75]], true), { width: 0.9 });
  out += pen.fill(pen.d([[5, 8, 68], [125, 8, 68], [125, 8, 75], [5, 8, 75]], true), t.tag);
  const CYCLE = 8;
  let css = '';
  for (let r = 0; r < 6; r++) {
    const z = 62 - r * 6;
    const cells: [number, number][] = [[10, 46], [54, 90], [98, 120]];
    const d = cells.map(([a, b]) => pen.d([[a, 8, z], [b, 8, z]])).join('');
    const at = 6 + r * 10;
    out += `<path d="${d}" stroke="${r % 3 === 2 ? t.accent : t.meta}" stroke-width="1.6" stroke-linecap="round" class="rw${r}"/>`;
    css += `.rw${r}{animation:rw${r} ${CYCLE}s 1.4s infinite both}@keyframes rw${r}{0%,${pct(at)}{opacity:0}${pct(at + 3)},88%{opacity:1}96%,100%{opacity:0}}`;
  }
  const from: P3 = [75, 30, 0];
  const to: P3 = [164, 44, 0];
  out += pen.stroke(pen.d([from, to]), { width: 0.9, color: t.accent, dash: '2 3' });
  out += pen.cylinder(178, 44, 0, 18, 44, { accent: true, rings: [15, 30] });
  const [lx, ly] = pen.p([178, 44, 58]);
  pen.include(lx - 6, ly - 14);
  out += `<g class="f" style="animation-delay:1400ms">${lock(round(lx - 4.5), round(ly - 14), t.accent)}</g>`;
  const [ax, ay] = pen.p(from);
  const [bx, by] = pen.p(to);
  out += `<g class="smil">${dot(2.4, t.accent, 1.6, 2.6, `M${round(ax)} ${round(ay)}L${round(bx)} ${round(by)}`)}</g>`;
  return { ...pen.done(out), css, label: Infinity };
}

/** ExifCleaner: a photo's metadata tags struck out and dropped, leaving a clean file. */
export function exif(t: Theme, labels: boolean): Figure {
  const pen = new Pen(t, 1, 100, 26);
  let out = pen.box(0, 0, 0, 120, 86, 3);
  out += pen.stroke(pen.d([[6, 6, 3], [114, 6, 3], [114, 80, 3], [6, 80, 3]], true), { width: 0.8, color: t.meta });
  out += pen.stroke(pen.d([[10, 74, 3], [38, 44, 3], [54, 60, 3], [76, 30, 3], [110, 74, 3]]), { width: 1 });
  out += pen.stroke(pen.d(pen.circle([90, 20, 3], 7, 'xy'), true), { width: 1, color: t.accent });
  const fields = ['GPS 48.8584, 2.2945', 'CAMERA ILCE-7M4', 'TAKEN 2026-07-01 14:32', 'SERIAL 3F2A91C0'];
  const [rx] = pen.p([120, 0, 3]);
  const font = { size: 10, mono: true, tracking: 0.5 } as const;
  const tagX = rx + 36;
  const CYCLE = 8;
  let css = '';
  let tagsW = 0;
  let tagsTop = Infinity;
  let tagsBottom = -Infinity;
  const tags = fields.map((f, i) => {
    const [ex, ey] = pen.p([120, 10 + i * 22, 3]);
    const ty = ey - 30 + i * 14;
    const w = measure(f, font) + 14;
    pen.include(tagX + w, ty + 8);
    tagsW = Math.max(tagsW, w);
    tagsTop = Math.min(tagsTop, ty - 10);
    tagsBottom = Math.max(tagsBottom, ty + 10);
    const s = 20 + i * 7;
    css +=
      `.tg${i}{animation:tg${i} ${CYCLE}s cubic-bezier(.5,0,.75,0) 1.6s infinite both}` +
      `@keyframes tg${i}{0%,${pct(s + 6)}{transform:translateY(0);opacity:1}${pct(s + 16)},90%{transform:translateY(12px);opacity:0}100%{transform:translateY(0);opacity:1}}` +
      `.st${i}{animation:st${i} ${CYCLE}s 1.6s infinite both}` +
      `@keyframes st${i}{0%,${pct(s)}{stroke-dashoffset:1}${pct(s + 5)},89%{stroke-dashoffset:0}90%,100%{stroke-dashoffset:1}}`;
    return (
      `<g class="tg${i}"><path d="M${round(ex + 3)} ${round(ey)}L${round(tagX - 4)} ${round(ty)}" stroke="${t.meta}" stroke-width=".8" fill="none"/>` +
      `<rect x="${round(tagX)}" y="${round(ty - 10)}" width="${round(w)}" height="20" rx="3" fill="${t.panel}" stroke="${t.rule}"/>` +
      (labels ? text(tagX + 7, ty + 4, f, { ...font, fill: t.ink2 }) : '') +
      `<path d="M${round(tagX + 5)} ${round(ty)}H${round(tagX + w - 5)}" stroke="${t.accent}" stroke-width="1.3" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1" class="st${i}"/></g>`
    );
  });
  // Shown where the tags were, once they have dropped. Hidden by attribute too, so a renderer
  // without CSS never shows it beside the tags it contradicts.
  const clean = labels
    ? text(tagX + tagsW / 2, (tagsTop + tagsBottom) / 2 + 4, '0 FIELDS · CLEAN', { size: 10, mono: true, tracking: 1, fill: t.accent, anchor: 'middle', cls: 'cl', hidden: true })
    : '';
  css += `.cl{opacity:0;animation:cl ${CYCLE}s 1.6s infinite}@keyframes cl{0%,62%{opacity:0}66%,88%{opacity:1}92%,100%{opacity:0}}`;
  return { ...pen.done(`<g class="f" style="animation-delay:900ms">${tags.join('')}</g>` + out + clean), css, label: 10 };
}

/** repo-zero: one rule set, symlinked into each coding agent. */
export function symlinks(t: Theme, labels: boolean): Figure {
  const pen = new Pen(t, 0.95, 100, 30);
  const C = 80;
  const agents: [string, number, number][] = [['CLAUDE CODE', -14, -14], ['CODEX', 174, -14], ['CURSOR', -14, 174], ['CLINE', 174, 174]];
  const plate = ([name, x, y]: [string, number, number]) => {
    let g = pen.box(x - 24, y - 24, 0, 48, 48, 6);
    g += pen.stroke(pen.d([[x - 14, y - 14, 6], [x + 14, y - 14, 6], [x + 14, y + 14, 6], [x - 14, y + 14, 6]], true), { width: 0.8, color: t.meta });
    const [lx, ly] = pen.p([x + 24, y + 24, 0]);
    // Large, because this wide drawing is always shown shrunk.
    if (labels) g += pen.label(lx, ly + 18, name, { size: 12, mono: true, tracking: 1, fill: t.ink2, anchor: 'middle' });
    return g;
  };
  // The links fade in after the plates are drawn, yet come first in the document to pass underneath.
  const [back, right, left, front] = agents;
  const solids = plate(back) + plate(right) + plate(left) + pen.box(C - 20, C - 20, 0, 40, 40, 40, { accent: true });
  const last = plate(front);
  const begin = (pen.delay + 1300) / 1000;
  let links = '';
  let dots = '';
  agents.forEach(([, x, y], i) => {
    const [ax, ay] = pen.p([C, C, 0]);
    const [bx, by] = pen.p([x, y, 0]);
    links += pen.stroke(`M${round(ax)} ${round(ay)}L${round(bx)} ${round(by)}`, { width: 0.9, color: t.accent, dash: '3 3' });
    dots += dot(2.6, t.accent, begin + i * 0.6, 2.4, `M${round(ax)} ${round(ay)}L${round(bx)} ${round(by)}`);
  });
  return { ...pen.done(links + solids + last + `<g class="smil">${dots}</g>`), css: '', label: 12 };
}
