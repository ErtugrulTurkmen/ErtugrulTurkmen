// Pulls the numbers the README shows and writes them to data/.
// Needs GITHUB_TOKEN: a read-only token of the profile owner, so private repositories
// count toward the totals. Repository names are used in memory only and never written.

import { mkdirSync, writeFileSync } from 'node:fs';
import { dataFile, type Day, type Stats } from './data.ts';

const LOGIN = 'ErtugrulTurkmen';
const token = process.env.GITHUB_TOKEN;
if (!token) throw new Error('GITHUB_TOKEN is not set (in Actions: the PROFILE_TOKEN repository secret)');

const headers = {
  authorization: `Bearer ${token}`,
  accept: 'application/vnd.github+json',
  'user-agent': `${LOGIN}-profile`,
};

// Actions logs of a public repository are public, so no error message may carry a repository name.
const redact = (path: string) => path.replace(/\/repos\/[^/]+\/[^/]+/, '/repos/…');

async function rest<T>(path: string): Promise<T> {
  const res = await fetch(`https://api.github.com${path}`, { headers });
  if (!res.ok) throw new Error(`GET ${redact(path)}: ${res.status}`);
  return res.json() as Promise<T>;
}

async function graphql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  });
  const body = (await res.json()) as { data?: T; errors?: { message: string }[]; message?: string };
  if (!res.ok || body.errors || !body.data) throw new Error(`GraphQL: ${res.status} ${body.message ?? JSON.stringify(body.errors)}`);
  return body.data;
}

// With "Private contributions" on, the calendar includes private work for any viewer.
const { user } = await graphql<{
  user: {
    createdAt: string;
    contributionsCollection: {
      contributionCalendar: {
        totalContributions: number;
        weeks: { contributionDays: { date: string; weekday: number; contributionCount: number }[] }[];
      };
    };
  };
}>(
  `query($login: String!) { user(login: $login) { createdAt contributionsCollection { contributionCalendar {
     totalContributions weeks { contributionDays { date weekday contributionCount } } } } } }`,
  { login: LOGIN },
);

const cal = user.contributionsCollection.contributionCalendar;
const days: Day[] = cal.weeks.flatMap((w, week) =>
  w.contributionDays.map((d) => ({ date: d.date, week, weekday: d.weekday, count: d.contributionCount })),
);

let longestStreak = 0;
let run = 0;
for (const d of days) {
  run = d.count > 0 ? run + 1 : 0;
  longestStreak = Math.max(longestStreak, run);
}
// Today may simply not have happened yet, so a streak ending yesterday still counts.
let currentStreak = 0;
for (let i = days.length - 1; i >= 0; i--) {
  if (days[i].count > 0) currentStreak++;
  else if (i < days.length - 1) break;
}

type Repo = { full_name: string; private: boolean; fork: boolean };
const repos = (await rest<Repo[]>('/user/repos?affiliation=owner&per_page=100')).filter((r) => !r.fork);

const bytes = new Map<string, number>();
for (const r of repos) {
  const langs = await rest<Record<string, number>>(`/repos/${r.full_name}/languages`);
  for (const [lang, n] of Object.entries(langs)) bytes.set(lang, (bytes.get(lang) ?? 0) + n);
}
const totalBytes = [...bytes.values()].reduce((a, b) => a + b, 0);

// Counted per repository rather than through commit search, which is not documented to see
// private repositories with a fine-grained token. With one commit per page, the "last" page
// number in the Link header is the count.
async function commitCount(repo: string): Promise<number> {
  const res = await fetch(`https://api.github.com/repos/${repo}/commits?author=${LOGIN}&per_page=1`, { headers });
  if (res.status === 409) return 0; // empty repository
  if (!res.ok) throw new Error(`GET commits of a repository: ${res.status}`);
  const last = res.headers.get('link')?.match(/[?&]page=(\d+)>; rel="last"/);
  return last ? Number(last[1]) : ((await res.json()) as unknown[]).length;
}
let commitsAllTime = 0;
for (const r of repos) commitsAllTime += await commitCount(r.full_name);

const now = new Date();
const stats: Stats = {
  fetchedAt: now.toISOString().slice(0, 10), // the date alone, so a run that finds nothing new changes nothing
  daysOnGitHub: Math.floor((now.getTime() - Date.parse(user.createdAt)) / 86_400_000),
  contributionsLastYear: cal.totalContributions,
  activeDays: days.filter((d) => d.count > 0).length,
  longestStreak,
  currentStreak,
  commitsAllTime,
  repos: {
    total: repos.length,
    public: repos.filter((r) => !r.private).length,
    private: repos.filter((r) => r.private).length,
  },
  languages: [...bytes]
    .sort((a, b) => b[1] - a[1])
    .map(([name, n]) => ({ name, pct: Math.round((n / totalBytes) * 1000) / 10 })),
};

mkdirSync(dataFile(''), { recursive: true });
writeFileSync(dataFile('stats.json'), JSON.stringify(stats, null, 2) + '\n');
writeFileSync(dataFile('calendar.json'), JSON.stringify(days) + '\n');
console.log(`stats: ${stats.contributionsLastYear} contributions, ${stats.commitsAllTime} commits, ${stats.repos.total} repos`);
