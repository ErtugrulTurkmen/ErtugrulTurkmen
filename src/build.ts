// Renders every drawing and the Markdown from src/content.ts and data/, without network access.

import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { calendar3d } from './calendar.ts';
import { profile, projects, skills } from './content.ts';
import { loadCalendar, loadStats } from './data.ts';
import { aboutPanel, button, caseHeader, cardHeight, hero, projectCard, sectionHeader, skillsPanel, titleBlock, wideCard } from './panels.ts';
import { aboutAlt, cardAlt, caseStudy, heroAlt, readme, skillsAlt, titleAlt } from './readme.ts';
import { cases } from './cases.ts';
import type { Layout } from './svg.ts';
import { themes } from './theme.ts';

const ROOT = new URL('../', import.meta.url);
const ASSETS = new URL('assets/', ROOT);

const stats = loadStats();
const days = loadCalendar();

mkdirSync(ASSETS, { recursive: true });
for (const f of readdirSync(ASSETS)) if (f.endsWith('.svg')) rmSync(new URL(f, ASSETS));

let count = 0;
const write = (file: string, svg: string) => {
  writeFileSync(new URL(file, ASSETS), svg);
  count++;
};
const name = (base: string, layout: Layout, mode: string) => `${base}${layout === 'mobile' ? '-mobile' : ''}-${mode}.svg`;

const [feature, ...rest] = projects;

// Only Work carries a note: the others would repeat what their section already says.
const inProduction = projects.filter((p) => p.status === 'live' || p.status === 'in-use').length;
const sections: [slug: string, title: string, note: string | undefined][] = [
  ['about', 'About', undefined],
  ['work', 'Selected work', `${projects.length} PROJECTS · ${inProduction} IN PRODUCTION`],
  ['skills', 'Skills', undefined],
  ['activity', 'Activity', undefined],
  ['contact', 'Contact', undefined],
];

// Where a pair of cards stacks inside one paragraph, the first carries the gap below it: about
// 16px once scaled, plus the 5.5px line gap, matching the 22px between paragraphs.
const STACK_GAP = { wide: 20, mobile: 18 };
const CALENDAR_FIG = projects.length + 1;

for (const t of themes) {
  for (const layout of ['desktop', 'mobile'] as const) {
    write(name('hero', layout, t.mode), hero(t, layout, profile, stats, heroAlt(profile)));
    write(name('skills', layout, t.mode), skillsPanel(t, layout, skills, skillsAlt(skills)));
    write(name('about', layout, t.mode), aboutPanel(t, layout, profile, aboutAlt(profile)));
    write(name('titleblock', layout, t.mode), titleBlock(t, layout, profile, stats, projects.length + 1, titleAlt(profile)));
    sections.forEach(([slug, title, meta], i) => write(name(`h-${slug}`, layout, t.mode), sectionHeader(t, layout, i + 1, title, meta)));
    projects.forEach((pr, i) => write(name(`case-${pr.slug}`, layout, t.mode), caseHeader(t, layout, pr, i + 1, `${pr.name} case study`)));
  }
  write(name(`card-${feature.slug}`, 'desktop', t.mode), wideCard(t, feature, 1, cardAlt(feature)));
  write(name(`card-${feature.slug}`, 'mobile', t.mode), projectCard(t, feature, 1, cardAlt(feature), { layout: 'mobile' }));
  const h = Math.max(...rest.map((pr) => cardHeight(t, pr, 'desktop')));
  rest.forEach((pr, i) => {
    const first = i % 2 === 0;
    write(name(`card-${pr.slug}`, 'desktop', t.mode), projectCard(t, pr, i + 2, cardAlt(pr), { layout: 'desktop', side: first ? 'left' : 'right', H: h }));
    write(`card-${pr.slug}-wide-${t.mode}.svg`, wideCard(t, pr, i + 2, cardAlt(pr), first ? STACK_GAP.wide : 0));
    write(name(`card-${pr.slug}`, 'mobile', t.mode), projectCard(t, pr, i + 2, cardAlt(pr), { layout: 'mobile', padBottom: first ? STACK_GAP.mobile : 0 }));
  });
  for (const layout of ['desktop', 'mobile'] as const) {
    write(name('calendar', layout, t.mode), calendar3d(t, layout, days, CALENDAR_FIG, `${stats.contributionsLastYear} contributions in the last 12 months`));
  }
  write(`btn-${feature.slug}-${t.mode}.svg`, button(t, 'primary', 'VIEW ON THE APP STORE', `${feature.name} on the App Store`));
  write(`btn-case-${t.mode}.svg`, button(t, 'secondary', 'READ THE CASE STUDY', `${feature.name} case study`));
  write(`btn-linkedin-${t.mode}.svg`, button(t, 'secondary', 'LINKEDIN', 'LinkedIn'));
  write(`btn-email-${t.mode}.svg`, button(t, 'secondary', profile.email.toUpperCase(), `Email ${profile.email}`));
}

writeFileSync(new URL('README.md', ROOT), readme(profile, projects, skills));

const PROJECTS = new URL('projects/', ROOT);
mkdirSync(PROJECTS, { recursive: true });
projects.forEach((pr, i) => {
  const c = cases[pr.slug];
  if (!c) throw new Error(`no case study for ${pr.slug} in src/cases.ts`);
  writeFileSync(new URL(`${pr.slug}.md`, PROJECTS), caseStudy(pr, i + 1, c));
});
console.log(`wrote ${count} SVGs and README.md`);
