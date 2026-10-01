// Everything the profile says. Edit here, then run `npm run build`.

export type Status = 'live' | 'in-use' | 'developed' | 'active' | 'in-development';

export type Project = {
  slug: string;
  name: string;
  status: Status;
  /** Of the source code, not the product. */
  visibility: 'public' | 'private' | 'soon-public';
  kind: string;
  summary: string;
  highlights: string[];
  stack: string[];
  href: string;
  figure: 'truck' | 'wireframe' | 'ledger' | 'exif' | 'symlinks';
  caption: string;
  metrics?: [value: string, label: string][];
};

type NowItem = { label: string; text: string };

const now: NowItem[] = [
  { label: 'Shipped', text: 'TruckLister on the App Store' },
  { label: 'Building', text: 'repo-zero, one rule set for every agent' },
  { label: 'Learning', text: 'Rust' },
];

const principles: [title: string, text: string][] = [
  ['Security and privacy by default', "Hardened Electron shells, inputs validated at every boundary, credentials encrypted at rest, and offline-first apps that collect nothing they don't need."],
  ['Shipped, not just started', 'TruckLister went from first commit to App Store approval in 14 days, with CI rejecting anything under 100% test coverage.'],
  ['How I work', 'Layered architecture with enforced boundaries, tests and CI as the gate, exactly pinned dependencies, and every decision written down. AI coding agents work under repo-zero, the rule set I maintain myself.'],
];

export const profile = {
  name: 'Ertuğrul Efe Türkmen',
  eyebrow: 'Computer Engineering · Istinye University · 4th year',
  tagline: 'Building secure, high-performance software that lasts, across web, desktop and mobile.',
  focus: ['Security', 'Privacy', 'Linux', 'Performance', 'Sustainability'],
  now,
  linkedin: 'https://www.linkedin.com/in/ertu%C4%9Frul-efe-t%C3%BCrkmen-7676282b8',
  email: 'ertugrulturkmen@proton.me',
  about: {
    lede: "I'm Ertuğrul Efe Türkmen, a 4th-year Computer Engineering student at Istinye University.",
    paragraphs: [
      'I build software for mobile, desktop and the web, mostly in TypeScript. One of my apps is live on the App Store, and a Windows accounting app I wrote is in use at two companies.',
      "I care about what happens after launch: software that is secure by default, keeps people's data on their own device, stays fast on modest hardware, and is still easy to change years later.",
      'I lean toward Linux and open-source tools, and I am learning Rust.',
    ],
    principles,
  },
};

export type Profile = typeof profile;

export const projects: Project[] = [
  {
    slug: 'trucklister',
    figure: 'truck',
    caption: 'Door assignment',
    name: 'TruckLister',
    status: 'live',
    visibility: 'private',
    kind: 'iOS app · App Store',
    summary: 'Offline iPhone app that records which truck door each numbered product goes through, then exports the load plan to Excel.',
    highlights: [
      'CI blocks any layer below 100% test coverage',
      'Own XLSX writer instead of the npm package with a known CVE',
      'Zero network calls, privacy label "Data Not Collected"',
    ],
    stack: ['React Native', 'TypeScript', 'iOS'],
    href: 'https://apps.apple.com/tr/app/truck-lister/id6816670787',
    metrics: [
      ['14 days', 'first commit to App Store approval'],
      ['100%', 'test coverage required in every layer'],
      ['0', 'network calls, fully offline'],
      ['v1.0.0', 'iOS 18+, released 2026-09-29'],
    ],
  },
  {
    slug: 'temirtech',
    figure: 'wireframe',
    caption: '3D hero, performance budget',
    name: 'TemirTech',
    status: 'developed',
    visibility: 'private',
    kind: 'Learning project · TR / EN',
    summary: 'A bilingual website I built to learn WebGL 3D and CI/CD, with performance budgets that fail the build.',
    highlights: [
      'Build fails if Lighthouse budgets regress',
      'Hardened contact form: validation, rate limit, CAPTCHA',
      'Security headers, error reports with PII off',
    ],
    stack: ['Next.js', 'Three.js', 'Playwright'],
    href: 'projects/temirtech.md',
  },
  {
    slug: 'cariyonetim',
    figure: 'ledger',
    caption: 'Ledger and encrypted store',
    name: 'CariYonetim',
    status: 'in-use',
    visibility: 'private',
    kind: 'Windows desktop · used by 2 companies',
    summary: 'Accounting and current-account management in Turkish and Greek, in use at two companies.',
    highlights: [
      'Encrypted DB credentials, device allow-list',
      'IPC inputs checked with Zod, parameterized SQL',
      'Login lockout, obfuscated release builds',
    ],
    stack: ['Electron', 'React', 'PostgreSQL'],
    href: 'projects/cariyonetim.md',
  },
  {
    slug: 'exifcleaner',
    figure: 'exif',
    caption: 'Goal: metadata off, on device',
    name: 'ExifCleaner',
    status: 'in-development',
    visibility: 'soon-public',
    kind: 'Desktop privacy tool',
    summary: 'A desktop tool, in development, that will strip EXIF and other metadata from photos on your own machine.',
    highlights: [
      'Designed so nothing leaves the device',
      'Context isolation and a CSP from day one',
      'Will be open source',
    ],
    stack: ['Electron', 'ExifTool', 'Tailwind'],
    href: 'projects/exifcleaner.md',
  },
  {
    slug: 'repo-zero',
    figure: 'symlinks',
    caption: 'One source, every agent',
    name: 'repo-zero',
    status: 'active',
    visibility: 'private',
    kind: 'Rules and skills for AI coding agents',
    summary: 'One source of truth for every coding agent I use, symlinked into Claude Code, Codex, Cursor, Cline and Antigravity.',
    highlights: [
      '14 skills, 9 rules, 43 decision records',
      '217-assertion self-test, zero dependencies',
      'CI on Linux and macOS, Node 22 and 24',
    ],
    stack: ['Node.js', 'Shell', 'GitHub Actions'],
    href: 'projects/repo-zero.md',
  },
];

export const skills = {
  learning: ['Rust'],
  groups: [
    { title: 'Languages', items: ['TypeScript', 'JavaScript', 'C++', 'SQL', 'Bash', 'HTML', 'CSS'] },
    { title: 'Frontend & mobile', items: ['React', 'React Native', 'Next.js', 'Tailwind CSS', 'TanStack Query', 'Zustand', 'Three.js'] },
    { title: 'Desktop & backend', items: ['Electron', 'Node.js', 'REST APIs', 'Zod'] },
    { title: 'Data', items: ['PostgreSQL', 'SQLite', 'MySQL', 'MS SQL Server'] },
    { title: 'Testing & CI', items: ['Jest', 'Vitest', 'Playwright', 'GitHub Actions'] },
    { title: 'Tools & platforms', items: ['Git', 'Linux', 'Claude Code'] },
  ],
  practices: {
    title: 'Security & privacy practices',
    items: ['Electron hardening', 'Input validation', 'Parameterized SQL', 'CSP & security headers', 'Secret hygiene', 'Privacy by design', 'Offline-first'],
  },
};

export type Skills = typeof skills;
