// Renders every asset and the README from src/content.ts and data/. No network access.

import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { calendar3d } from './calendar.ts';
import { profile, projects, skills } from './content.ts';
import { loadCalendar, loadStats } from './data.ts';
import { aboutPanel, button, caseHeader, cardHeight, featureCard, hero, projectCard, sectionHeader, skillsPanel, titleBlock } from './panels.ts';
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

const sections: [string, string, string | undefined][] = [
  ['about', 'About', undefined],
  ['work', 'Selected work', `${projects.length} PROJECTS · ${projects.filter((p) => p.status === 'live').length} LIVE`],
  ['skills', 'Skills', `${skills.groups.length} GROUPS · LEARNING ${skills.learning.join(', ').toUpperCase()}`],
  ['activity', 'Activity', `${stats.contributionsLastYear} CONTRIBUTIONS · 12 MONTHS`],
  ['contact', 'Contact', 'LINKEDIN · EMAIL'],
];

for (const t of themes) {
  for (const layout of ['desktop', 'mobile'] as const) {
    write(name('hero', layout, t.mode), hero(t, layout, profile, stats, heroAlt(profile)));
    write(name('skills', layout, t.mode), skillsPanel(t, layout, skills, skillsAlt(skills)));
    write(name('about', layout, t.mode), aboutPanel(t, layout, profile, aboutAlt(profile)));
    write(name('titleblock', layout, t.mode), titleBlock(t, layout, profile, stats, projects.length + 1, titleAlt(profile)));
    sections.forEach(([slug, title, meta], i) => write(name(`h-${slug}`, layout, t.mode), sectionHeader(t, layout, i + 1, title, meta)));
    projects.forEach((pr, i) => write(name(`case-${pr.slug}`, layout, t.mode), caseHeader(t, layout, pr, i + 1, `${pr.name} case study`)));
  }
  write(name(`card-${feature.slug}`, 'desktop', t.mode), featureCard(t, feature, 1, cardAlt(feature)));
  write(name(`card-${feature.slug}`, 'mobile', t.mode), projectCard(t, feature, 1, cardHeight(t, feature), cardAlt(feature)));
  const h = Math.max(...rest.map((pr) => cardHeight(t, pr)));
  rest.forEach((pr, i) => write(name(`card-${pr.slug}`, 'desktop', t.mode), projectCard(t, pr, i + 2, h, cardAlt(pr))));
  write(name('calendar', 'desktop', t.mode), calendar3d(t, days, `${stats.contributionsLastYear} contributions in the last 12 months`));
}

write(`btn-${feature.slug}.svg`, button('primary', 'VIEW ON THE APP STORE', `${feature.name} on the App Store`));
write('btn-case.svg', button('secondary', 'READ THE CASE STUDY', `${feature.name} case study`));
write('btn-linkedin.svg', button('secondary', 'LINKEDIN', 'LinkedIn'));
write('btn-email.svg', button('secondary', profile.email.toUpperCase(), `Email ${profile.email}`));

writeFileSync(new URL('README.md', ROOT), readme(profile, projects, skills));

const PROJECTS = new URL('projects/', ROOT);
mkdirSync(PROJECTS, { recursive: true });
projects.forEach((pr, i) => {
  const c = cases[pr.slug];
  if (!c) throw new Error(`no case study for ${pr.slug} in src/cases.ts`);
  writeFileSync(new URL(`${pr.slug}.md`, PROJECTS), caseStudy(pr, i + 1, c));
});
console.log(`wrote ${count} SVGs and README.md`);
