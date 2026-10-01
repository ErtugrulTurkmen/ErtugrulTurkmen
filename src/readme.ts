import type { CaseStudy } from './cases.ts';
import type { Profile, Project, Skills, Status } from './content.ts';
import { esc } from './svg.ts';

// Alt text carries everything each SVG says. Two ways an image gets onto the page:
// - pic():    one <a> per theme, hidden by GitHub's CSS rule `.readme [href$="#gh-light-mode-only"]
//             {display:none}` and its dark twin, so the theme follows the viewer's GitHub setting.
//             Width variants are a <picture> inside with width-only media queries. prefers-color-scheme
//             is never combined with a width: for viewers with an explicit theme, GitHub's
//             <themed-picture> rewrites such a query to always or never match, which drops the width
//             with it and served phone drawings to desktops (checked 2026-09-30).
// - button(): a <picture> with a prefers-color-scheme source alone, which <themed-picture> handles
//             correctly; a #gh- fragment is unsafe on a mailto: link.

const STATUS_TEXT: Record<Status, string> = {
  live: 'live',
  'in-use': 'in use',
  developed: 'developed',
  active: 'active',
  'in-development': 'in development',
};

/**
 * Generated drawings live on the `output` branch, written there by the workflow as github-actions[bot].
 * Keeping them off main keeps main's history, and the repository's contributor list, to the owner alone.
 */
export const ASSETS = 'https://raw.githubusercontent.com/ErtugrulTurkmen/ErtugrulTurkmen/output/assets/';

/**
 * Where the phone drawings are shown: wherever GitHub's README column is 520px or narrower. It is
 * the viewport minus 82px below 768px, and minus 370px from 768px to 1011px, where the profile
 * sidebar moves beside it (measured 2026-10-01). From 1280px up the column is 846px.
 */
const PHONE = '(max-width: 600px), (min-width: 768px) and (max-width: 890px)';
/** Below a full 846px column, two half-width cards no longer fit side by side. */
// Phone drawings keep their 320px where the column is wider (up to 520px): images only shrink to
// fit, never grow, so every image paragraph is centred to keep that narrower strip in the middle.
const NOT_FULL = '(max-width: 1279px)';

const src = (name: string, mode: 'dark' | 'light', variant = '') => `${ASSETS}${name}${variant}-${mode}.svg`;

/**
 * `mobile`: the asset has a phone variant. `wide`: a card with a full-width variant for columns
 * too narrow for the 2×2 grid. `href`: where a click goes; none by default.
 */
export function pic(name: string, alt: string, { mobile = false, wide = false, href = '' } = {}): string {
  return (['dark', 'light'] as const)
    .map((mode) => {
      const img = `<img alt="${esc(alt)}" src="${src(name, mode)}">`;
      const sources = [mobile && [PHONE, '-mobile'], wide && [NOT_FULL, '-wide']]
        .filter((x): x is [string, string] => Boolean(x))
        .map(([media, variant]) => `<source media="${media}" srcset="${src(name, mode, variant)}">`)
        .join('');
      return `<a href="${esc(href)}#gh-${mode}-mode-only">${sources ? `<picture>${sources}${img}</picture>` : img}</a>`;
    })
    .join('');
}

const button = (href: string, name: string, alt: string): string =>
  `<a href="${esc(href)}"><picture><source media="(prefers-color-scheme: light)" srcset="${src(name, 'light')}"><img alt="${esc(alt)}" src="${src(name, 'dark')}"></picture></a>`;

// README.md on main changes only when its owner rebuilds it, while the drawings refresh every
// 6 hours, so alt text carries no live numbers that would go stale between the two.
export const heroAlt = (p: Profile): string =>
  `${p.name}. ${p.eyebrow}. ${p.tagline} Focus: ${p.focus.join(', ')}. ` +
  `${p.now.map((n) => `${n.label}: ${n.text}`).join('. ')}. ` +
  'With contributions over the last 12 months, commits in my own repositories, repository count and main language, private work included.';

export const cardAlt = (pr: Project): string =>
  `${pr.name} (${STATUS_TEXT[pr.status]}, ${pr.visibility.replace('-', ' ')} source): ${pr.kind}. ${pr.summary} ` +
  `${pr.highlights.join('. ')}. Stack: ${pr.stack.join(', ')}.`;

export const skillsAlt = (s: Skills): string =>
  `Currently learning: ${s.learning.join(', ')}. ` +
  [...s.groups, s.practices].map((g) => `${g.title}: ${g.items.join(', ')}`).join('. ') + '.';

export const aboutAlt = (p: Profile): string =>
  `${p.about.quote} ${p.about.intro} ` + p.about.principles.map(([head, body]) => `${head}: ${body}`).join(' ');

export const titleAlt = (p: Profile): string =>
  `Drawn by ${p.name}. Checked by GitHub Actions every 6 hours, with the date of the last revision. ` +
  'Numbers and drawings are regenerated from live GitHub data; private work is counted, never named.';

// Images that share a paragraph share one line: GitHub's renderers disagree on whether a newline
// inside a paragraph is a space or a <br>.
export function readme(p: Profile, projects: Project[], skills: Skills): string {
  const [feature, ...rest] = projects;
  const rows: string[] = [];
  for (let i = 0; i < rest.length; i += 2) {
    // No whitespace between the pair: its gutter is drawn inside the two images.
    rows.push(rest.slice(i, i + 2).map((pr) => pic(`card-${pr.slug}`, cardAlt(pr), { mobile: true, wide: true, href: pr.href })).join(''));
  }
  return `<!-- Generated by src/build.ts from src/content.ts and data/. Edit those, then run: npm run build -->

<p align="center">${pic('hero', heroAlt(p), { mobile: true })}</p>

<p align="center">${pic('h-about', 'About', { mobile: true })}</p>

<p align="center">${pic('about', aboutAlt(p), { mobile: true })}</p>

<p align="center">${pic('h-work', 'Selected work', { mobile: true })}</p>

<p align="center">${pic(`card-${feature.slug}`, cardAlt(feature), { mobile: true, href: `projects/${feature.slug}.md` })}</p>

${button(feature.href, `btn-${feature.slug}`, `${feature.name} on the App Store`)} ${button(`projects/${feature.slug}.md`, 'btn-case', `${feature.name} case study`)}

${rows.map((row) => `<p align="center">${row}</p>`).join('\n\n')}

<p align="center">${pic('h-skills', 'Skills', { mobile: true })}</p>

<p align="center">${pic('skills', skillsAlt(skills), { mobile: true })}</p>

<p align="center">${pic('h-activity', 'Activity', { mobile: true })}</p>

<p align="center">${pic('calendar', '3D contribution calendar of the last 12 months, private work included, with the busiest day marked.', { mobile: true })}</p>

<p align="center">${pic('h-contact', 'Contact', { mobile: true })}</p>

${button(p.linkedin, 'btn-linkedin', 'LinkedIn')} ${button(`mailto:${p.email}`, 'btn-email', `Email ${p.email}`)}

<p align="center">${pic('titleblock', titleAlt(p), { mobile: true })}</p>
`;
}

const list = (items: string[]) => items.map((i) => `- ${i}`).join('\n');

const SOURCE_NOTE: Record<Project['visibility'], string> = {
  private: 'the source is described, never shown.',
  'soon-public': 'the source will be public.',
  public: 'the source is public.',
};

/** A project's case-study page, projects/<slug>.md. */
export function caseStudy(pr: Project, n: number, c: CaseStudy): string {
  const links = c.links?.map(([label, href]) => `[${label}](${href})`).join(' · ');
  return `<!-- Generated by src/build.ts from src/cases.ts. Edit that, then run: npm run build -->

<p align="center">${pic(`case-${pr.slug}`, `${pr.name}: ${pr.caption}. ${pr.kind}. Stack: ${pr.stack.join(', ')}.`, { mobile: true })}</p>

> ${pr.summary}

## Problem

${c.problem}

## What I built

${list(c.built)}

## Security and privacy

${list(c.security)}

## Engineering

${list(c.engineering)}

## Status

${c.status}${links ? `\n\n${links}` : ''}

---

<sub>Sheet ${String(n + 1).padStart(2, '0')} of the drawing set on [my profile](https://github.com/ErtugrulTurkmen) · ${SOURCE_NOTE[pr.visibility]}</sub>
`;
}
