// The kami palette. Values marked "derived" are mixed from kami colours, since kami has no dark
// theme. Every text colour is at least 4.5:1 on its panel.

export type Theme = {
  mode: 'dark' | 'light';
  paper: string;
  panel: string;
  rule: string;
  grid: string;
  ink: string;
  ink2: string;
  muted: string;
  meta: string;
  accent: string;
  tag: string;
  tagText: string;
  faces: Faces;
  accentFaces: Faces;
  calendar: readonly [string, string, string, string, string]; // empty to busiest
};

type Faces = { top: string; left: string; right: string };

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
  accent: '#8fb0d8', // derived: kami ink light lifted to 8:1
  tag: '#18283f', // derived: ink blue 60% over deep dark
  tagText: '#c9d8ec',
  faces: { top: '#282826', left: '#1f1f1d', right: '#171716' },
  accentFaces: { top: '#223a5a', left: '#1b2f4a', right: '#15253b' }, // derived from ink blue
  calendar: ['#252523', '#26426a', '#2d5a8a', '#5b83b3', '#8fb0d8'], // derived from ink blue; level 1 is 1.5:1 on the floor
};

export const themes = [dark, light] as const;

// Cambria before Sitka, which runs wider, and Georgia, whose old-style figures make numbers bounce.
export const SERIF = `Charter, 'Bitstream Charter', 'Iowan Old Style', Cambria, 'Sitka Text', Georgia, serif`;
export const MONO = `ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace`;
