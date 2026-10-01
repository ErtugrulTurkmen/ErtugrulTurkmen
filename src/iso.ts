import { measure, round, text, type Font } from './svg.ts';
import type { Theme } from './theme.ts';

// Isometric line art. x runs down-right, y down-left, z up. Every stroke is numbered in the order
// it is drawn, so the plotter animation follows the pen; fills fade in once their outline exists.

export type P3 = readonly [number, number, number];

const COS = Math.cos(Math.PI / 6);

/** A fill or label fades in this long after its outline starts, once most of the 1.3s stroke is down. */
const FILL_AFTER = 800;

export type Art = { svg: string; w: number; h: number };

export class Pen {
  t: Theme;
  s: number;
  delay: number;
  step: number;
  minX = Infinity;
  minY = Infinity;
  maxX = -Infinity;
  maxY = -Infinity;

  constructor(t: Theme, scale: number, start = 100, step = 40) {
    this.t = t;
    this.s = scale;
    this.delay = start;
    this.step = step;
  }

  /** Screen position of a 3D point; grows the bounding box. */
  p([x, y, z]: P3): [number, number] {
    const sx = (x - y) * COS * this.s;
    const sy = ((x + y) * 0.5 - z) * this.s;
    this.include(sx, sy);
    return [sx, sy];
  }

  include(x: number, y: number): void {
    this.minX = Math.min(this.minX, x);
    this.maxX = Math.max(this.maxX, x);
    this.minY = Math.min(this.minY, y);
    this.maxY = Math.max(this.maxY, y);
  }

  d(points: P3[], close = false): string {
    return points.map((q, i) => { const [x, y] = this.p(q); return `${i ? 'L' : 'M'}${round(x)} ${round(y)}`; }).join('') + (close ? 'Z' : '');
  }

  next(): number {
    const d = this.delay;
    this.delay += this.step;
    return d;
  }

  /** A plotted stroke. Dashed strokes fade instead, since the dash animation needs the dash array. */
  stroke(d: string, o: { width?: number; color?: string; dash?: string } = {}): string {
    const color = o.color ?? this.t.ink;
    const w = o.width ?? 1.1;
    if (o.dash) return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-dasharray="${o.dash}" class="f" style="animation-delay:${this.next()}ms"/>`;
    return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round" pathLength="1" class="d" style="animation-delay:${this.next()}ms"/>`;
  }

  fill(d: string, color: string, delay = this.delay + FILL_AFTER): string {
    return `<path d="${d}" fill="${color}" class="f" style="animation-delay:${Math.round(delay)}ms"/>`;
  }

  /** A solid block: three shaded faces and its visible edges. */
  box(x: number, y: number, z: number, w: number, dd: number, h: number, o: { accent?: boolean; hatch?: boolean } = {}): string {
    const f = o.accent ? this.t.accentFaces : this.t.faces;
    const top: P3[] = [[x, y, z + h], [x + w, y, z + h], [x + w, y + dd, z + h], [x, y + dd, z + h]];
    const right: P3[] = [[x + w, y, z], [x + w, y + dd, z], [x + w, y + dd, z + h], [x + w, y, z + h]];
    const left: P3[] = [[x, y + dd, z], [x + w, y + dd, z], [x + w, y + dd, z + h], [x, y + dd, z + h]];
    const at = this.delay + FILL_AFTER;
    let out = this.fill(this.d(left, true), f.left, at) + this.fill(this.d(right, true), f.right, at) + this.fill(this.d(top, true), f.top, at);
    if (o.hatch) out += this.fill(this.d(right, true), 'url(#hatch)', at);
    const outline =
      this.d([[x, y, z + h], [x + w, y, z + h], [x + w, y, z], [x + w, y + dd, z], [x, y + dd, z], [x, y + dd, z + h]], true) +
      this.d([[x + w, y + dd, z], [x + w, y + dd, z + h]]) +
      this.d([[x, y + dd, z + h], [x + w, y + dd, z + h], [x + w, y, z + h]]);
    return out + this.stroke(outline, { color: o.accent ? this.t.accent : this.t.ink });
  }

  /** An upright cylinder; horizontal circles project to axis-aligned ellipses. */
  cylinder(cx: number, cy: number, z: number, r: number, h: number, o: { accent?: boolean; rings?: number[] } = {}): string {
    const f = o.accent ? this.t.accentFaces : this.t.faces;
    const [tx, ty] = this.p([cx, cy, z + h]);
    const [bx, by] = this.p([cx, cy, z]);
    const rx = round(r * Math.SQRT2 * COS * this.s);
    const ry = round(r * Math.SQRT2 * 0.5 * this.s);
    this.include(tx - rx, ty - ry);
    this.include(bx + rx, by + ry);
    const side = `M${round(tx - rx)} ${round(ty)}L${round(bx - rx)} ${round(by)}A${rx} ${ry} 0 0 0 ${round(bx + rx)} ${round(by)}L${round(tx + rx)} ${round(ty)}Z`;
    const cap = `M${round(tx - rx)} ${round(ty)}a${rx} ${ry} 0 1 0 ${round(2 * rx)} 0a${rx} ${ry} 0 1 0 ${round(-2 * rx)} 0`;
    const at = this.delay + FILL_AFTER;
    let out = this.fill(side, f.left, at) + this.fill(cap, f.top, at);
    let lines = `M${round(tx - rx)} ${round(ty)}L${round(bx - rx)} ${round(by)}A${rx} ${ry} 0 0 0 ${round(bx + rx)} ${round(by)}L${round(tx + rx)} ${round(ty)}` + cap;
    for (const rz of o.rings ?? []) {
      const [rxx, ryy] = this.p([cx, cy, z + rz]);
      lines += `M${round(rxx - rx)} ${round(ryy)}A${rx} ${ry} 0 0 0 ${round(rxx + rx)} ${round(ryy)}`;
    }
    out += this.stroke(lines, { color: o.accent ? this.t.accent : this.t.ink });
    return out;
  }

  /** Points of a circle lying in an axis plane, for wheels and suns. */
  circle(c: P3, r: number, plane: 'xy' | 'xz' | 'yz', n = 28): P3[] {
    return Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2;
      const u = Math.cos(a) * r;
      const v = Math.sin(a) * r;
      if (plane === 'xy') return [c[0] + u, c[1] + v, c[2]] as const;
      if (plane === 'xz') return [c[0] + u, c[1], c[2] + v] as const;
      return [c[0], c[1] + u, c[2] + v] as const;
    });
  }

  /** Upright text; the box counts toward the drawing's bounds. */
  label(x: number, y: number, s: string, o: Font & { fill?: string; anchor?: 'middle' | 'end' }, delay?: number): string {
    const w = measure(s, o);
    const left = o.anchor === 'end' ? x - w : o.anchor === 'middle' ? x - w / 2 : x;
    this.include(left, y - o.size);
    this.include(left + w, y + 3);
    return text(x, y, s, { ...o, cls: 'f', delay: delay ?? this.delay + FILL_AFTER });
  }

  /** Wraps the drawing so its bounding box starts at (pad, pad). */
  done(body: string, pad = 8): Art {
    return {
      svg: `<g transform="translate(${round(pad - this.minX)} ${round(pad - this.minY)})">${body}</g>`,
      w: Math.ceil(this.maxX - this.minX + pad * 2),
      h: Math.ceil(this.maxY - this.minY + pad * 2),
    };
  }
}

/** Places a drawing centred in a box: shrunk to fit, or enlarged up to `grow`×. */
export function place(art: Art, x: number, y: number, w: number, h: number, grow = 1): string {
  const k = Math.min(grow, w / art.w, h / art.h);
  const dx = x + (w - art.w * k) / 2;
  const dy = y + (h - art.h * k) / 2;
  return `<g transform="translate(${round(dx)} ${round(dy)})${k !== 1 ? ` scale(${round(k * 1000) / 1000})` : ''}">${art.svg}</g>`;
}
