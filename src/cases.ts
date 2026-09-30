// Case-study text, one per project, keyed by Project.slug. Every claim comes from the project's
// own repository (research_notes/…/projects_and_skills_inventory.md); nothing names a client,
// a private host or a file path. Edit here, then `npm run build`.

export type CaseStudy = {
  problem: string;
  built: string[];
  security: string[];
  engineering: string[];
  status: string;
  links?: [label: string, href: string][];
};

export const cases: Record<string, CaseStudy> = {
  trucklister: {
    problem:
      "A loading crew records which of a truck's four doors each numbered product goes through: 1 to about 600 items per truck, no barcodes, numbers called out on a noisy floor by people working standing and often one-handed. The app replaces the paper list they kept by hand.",
    built: [
      'Door-tab entry where a number goes in under a second, with haptic confirmation and the latest entries kept on screen',
      'Duplicate and out-of-range detection at entry time, answered from an in-memory index with no database query on the hot path',
      'A missing-number audit, confirmed edits, soft delete with a Recently Deleted list, and exact session restore after a kill or reboot',
      'Excel export, and a full backup and restore that merges by ID and never overwrites existing data',
    ],
    security: [
      'No network permission and no network calls; no analytics and no crash reporting. App Store privacy label: Data Not Collected',
      'Every entry is a transactional SQLite write (WAL, synchronous FULL), so a truck of manual work cannot be lost',
      'Its own XLSX writer instead of the npm package, whose installable version carries CVE-2023-30533',
      'Exactly pinned dependencies, 15 at runtime; CI actions pinned to commit SHAs with read-only permissions',
    ],
    engineering: [
      'Layered architecture (app, features, state, data, domain, lib, ui) enforced by lint import rules; the domain layer is pure TypeScript',
      'CI fails below 100% branch, function, line and statement coverage in every layer; tests run against a real in-memory SQLite',
      'A 90-line Objective-C++ TurboModule replaced an 800-line third-party document picker',
      'Native iOS components throughout, with VoiceOver, Dynamic Type and Reduce Motion support',
      'First commit to App Store approval in 14 days, approved on first review, with 275 numbered design decisions on record',
    ],
    status: 'Live on the App Store since 2026-09-29: v1.0.0, iOS 18 and later, Turkey and Greece. The source is private; the support and privacy pages are public.',
    links: [
      ['App Store', 'https://apps.apple.com/tr/app/truck-lister/id6816670787'],
      ['Support and privacy policy', 'https://ertugrulturkmen.github.io/truck-lister-destek/'],
    ],
  },
  temirtech: {
    problem: 'A project I built to learn two things in practice: 3D on the web with WebGL (Three.js), and a CI/CD pipeline that tests every change and fails the build when performance or accessibility slips. A Turkish and English website was the vehicle for both.',
    built: [
      'A Next.js App Router site with a Three.js (React Three Fiber) hero that cross-fades in from a poster image',
      'Service, legal and contact pages in both languages, with hreflang, structured data and generated social images',
    ],
    security: [
      'Contact requests pass a honeypot, a Zod schema shared by client and server, a rate limit of 5 per 10 minutes per IP, CAPTCHA verification and sanitisation before any email is sent; the form fails safe when a key is missing',
      'HSTS with preload, nosniff, a strict referrer policy, Permissions-Policy and COOP headers; security.txt (RFC 9116) published',
      'Error reporting only in production, stored in the EU, with personal data off and no session replay',
      'Configuration validated with Zod, so a bad environment fails the build instead of the site',
    ],
    engineering: [
      'Lighthouse CI budgets fail the build: performance at least 0.95, LCP at most 1.5 s, TBT at most 200 ms, CLS at most 0.02, accessibility 1.0',
      'The 3D scene pauses off-screen and in background tabs, with adaptive resolution and a quality ladder',
      'Playwright end-to-end, axe accessibility (WCAG AA) and visual-regression tests in CI',
      'Renovate keeps pinned dependencies current, with vulnerability alerts',
    ],
    status: 'Developed. The source is private.',
  },
  cariyonetim: {
    problem: 'Two companies needed to track customer current accounts, invoices, payment instructions and balances, in Turkish and Greek, from Windows desktops sharing one PostgreSQL server.',
    built: [
      'Customer accounts, invoices, payment instructions and balances in several currencies, with PDF and Excel export',
      'A Windows installer with its own update channel, released up to v0.0.13',
    ],
    security: [
      'Electron context isolation, a sandboxed renderer, no Node integration and a strict Content Security Policy',
      "Database credentials encrypted with the operating system's keychain; the app refuses to decrypt when the keychain is unavailable",
      'A device allow-list: the machine is checked against bcrypt-hashed identifiers before the app starts',
      'Login lockout after repeated failures, and an authentication guard on the backend handlers',
      'Zod validation of every call from the interface and of every database result; parameterized SQL with escaped search patterns',
      'Obfuscated main-process code in release builds',
    ],
    engineering: [
      'Virtualised, paged customer lists with debounced search',
      'Excel generation moved off the main thread into a worker, and pooled database connections',
    ],
    status: 'In use at two companies. The source is private.',
  },
  exifcleaner: {
    problem: 'Photos carry location, camera and time metadata that people rarely mean to share.',
    built: [
      'A desktop tool you drop photos onto and get clean copies back, with EXIF and other metadata removed on your own machine',
      'Planned: processing in a background worker, a tray mode and remembered settings',
    ],
    security: [
      'An Electron shell with context isolation, no Node integration and a Content Security Policy from the first commit',
      'Nothing is uploaded anywhere, and the code will be open so anyone can check that',
    ],
    engineering: ['A small main process with a clear split between the interface, the IPC controller and the metadata service'],
    status: 'Early development: the secure shell and the drag-and-drop interface. It will be open source.',
  },
  'repo-zero': {
    problem:
      'Every coding agent I use (Claude Code, Codex, Cursor, Cline and Antigravity) needs the same working agreements, and copying them into each project makes them drift apart.',
    built: [
      'One repository of rules, skills and templates, symlinked into each agent, so improving it once improves every project',
      '14 skills, among them kickoff, challenge, design, secure, perf, ship, code review and verify, and 9 path-scoped rules for TypeScript, React, React Native, databases and CI',
      '43 architecture decision records, and a README in English and Turkish',
    ],
    security: [
      'A security skill that routes review by trust boundary, prompt injection into model calls included, with its own scanner',
      'Zero dependencies: Node scripts import only from node:, and the shell scripts stay compatible with bash 3.2',
    ],
    engineering: [
      'Two deterministic checkers, a UI anti-pattern detector and a security scanner, tested against clean, dirty and evasion fixtures',
      'A 217-assertion self-verification suite; CI on Linux (Node 22 and 24) and macOS, plus CodeQL',
    ],
    status: 'Active and in daily use. The source is private for now, under the MIT licence.',
  },
};
