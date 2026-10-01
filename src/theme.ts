// palette: kami (vendored design system) — parchment, ivory, warm sand, the four warm text
// levels and ink blue are taken whole from its tokens.css. kami has no dark text ramp, so the
// dark theme mirrors it onto kami's own Deep Dark / Dark Surface; values marked "derived" were
// mixed from kami colours. Every text colour is ≥ 4.5:1 on its panel.

export type Faces = { top: string; left: string; right: string };

export type Theme = {
  mode: 'dark' | 'light';
  paper: string; // drawing ground: hero and card figures
  panel: string; // card body
  rule: string; // hairlines, major grid
  grid: string; // minor grid
  ink: string; // lines and primary text
  ink2: string;
  muted: string;
  meta: string;
  accent: string; // the one chromatic colour: numbers, moving parts, links
  tag: string; // solid tag fill (kami forbids rgba tags)
  tagText: string;
  faces: Faces; // isometric solids
  accentFaces: Faces; // the part of a drawing that moves
  calendar: readonly [string, string, string, string, string]; // empty → busiest
};

export const light: Theme = {
  mode: 'light',
  paper: '#f5f4ed', // kami parchment
  panel: '#faf9f5', // kami ivory
  rule: '#e8e6dc', // kami border
  grid: '#eeede4', // derived: border 50% over parchment
  ink: '#141413', // kami near black
  ink2: '#3d3d3a', // kami dark warm
  muted: '#504e49', // kami olive
  meta: '#6b6a64', // kami stone
  accent: '#1b365d', // kami ink blue
  tag: '#e4ecf5', // kami default tag
  tagText: '#1b365d',
  faces: { top: '#faf9f5', left: '#eceae1', right: '#e0ddd1' }, // ivory; derived from warm sand
  accentFaces: { top: '#eef2f7', left: '#e4ecf5', right: '#d6e1ee' }, // kami tag brush stops
  calendar: ['#eeede4', '#d0dce9', '#91a7bb', '#2d5a8a', '#1b365d'], // kami tag 0.22, ink light 50% over parchment, ink light, ink blue
};

export const dark: Theme = {
  mode: 'dark',
  paper: '#1b1b1a', // derived: dark surface 25% over deep dark
  panel: '#141413', // kami deep dark
  rule: '#30302e', // kami dark surface
  grid: '#222220', // derived
  ink: '#f5f4ed', // kami parchment
  ink2: '#e8e6dc', // kami warm sand
  muted: '#b5b2a6', // derived, 8.6:1
  meta: '#96938a', // derived, 5.9:1
  accent: '#8fb0d8', // derived: kami ink light lifted to 8:1 for text on dark
  tag: '#18283f', // derived: ink blue 60% over deep dark
  tagText: '#c9d8ec',
  faces: { top: '#282826', left: '#1f1f1d', right: '#171716' },
  accentFaces: { top: '#223a5a', left: '#1b2f4a', right: '#15253b' }, // derived from ink blue
  calendar: ['#252523', '#26426a', '#2d5a8a', '#5b83b3', '#8fb0d8'], // level 1 lifted off the floor (1.2:1 → 1.5:1)
};

export const themes = [dark, light] as const;

// kami sets everything in serif; labels are mono, as on a drawing's title block. Cambria comes
// before Sitka (wider) and Georgia (old-style figures that make numbers bounce).
export const SERIF = `Charter, 'Bitstream Charter', 'Iowan Old Style', Cambria, 'Sitka Text', Georgia, serif`;
export const MONO = `ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace`;
