// Pulls the numbers the README shows and writes them to data/.
// Needs GITHUB_TOKEN: a read-only token of the profile owner, so private repositories
// count toward the totals. Repository names are used in memory only and never written.
//
// Actions logs of a public repository are public, so nothing this script prints may carry a
// repository name or a response body: only LoggedError messages, written here, reach the log.

import { mkdirSync, writeFileSync } from 'node:fs';
import { dataFile, type Day, type Stats } from './data.ts';

const LOGIN = 'ErtugrulTurkmen';

/** An error whose message was written here and is safe to print. */
class LoggedError extends Error {}

const redact = (url: string) => new URL(url).pathname.replace(/\/repos\/[^/]+\/[^/]+/, '/repos/…');

const token = process.env.GITHUB_TOKEN;
if (!token) throw new LoggedError('GITHUB_TOKEN is not set (in Actions: the PROFILE_TOKEN repository secret)');

const headers = {
  authorization: `Bearer ${token}`,
  accept: 'application/vnd.github+json',
  'user-agent': `${LOGIN}-profile`,
};

// Never res.json(): when a body fails to parse, V8 quotes part of it in the error.
async function body<T>(res: Response): Promise<T> {
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new LoggedError(`${redact(res.url)}: ${res.status}, response is not JSON`);
  }
}

async function get(url: string, { allowEmptyRepo = false } = {}): Promise<Response> {
  const res = await fetch(url, { headers });
  if (!res.ok && !(allowEmptyRepo && res.status === 409)) throw new LoggedError(`GET ${redact(url)}: ${res.status}`);
  return res;
}

const linkTo = (res: Response, rel: string) => res.headers.get('link')?.match(new RegExp(`<([^>]+)>; rel="${rel}"`))?.[1];

/** Every page of a list endpoint, following rel="next". */
async function all<T>(url: string): Promise<T[]> {
  const items: T[] = [];
  for (let next: string | undefined = url; next; ) {
    const res = await get(next);
    items.push(...(await body<T[]>(res)));
    next = linkTo(res, 'next');
  }
  return items;
}

async function graphql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const res = await fetch('https://api.github.com/graphql', { method: 'POST', headers, body: JSON.stringify({ query, variables }) });
  if (!res.ok) throw new LoggedError(`GraphQL: ${res.status}`);
  const out = await body<{ data?: T; errors?: { message: string }[] }>(res);
  if (out.errors || !out.data) throw new LoggedError(`GraphQL: ${out.errors?.map((e) => e.message).join('; ') ?? 'no data'}`);
  return out.data;
}

// Counted per repository rather than through commit search, which is not documented to see
// private repositories with a fine-grained token. With one commit per page, the "last" page
// number in the Link header is the count.
async function commitCount(repo: string): Promise<number> {
  const res = await get(`https://api.github.com/repos/${repo}/commits?author=${LOGIN}&per_page=1`, { allowEmptyRepo: true });
  if (res.status === 409) return 0; // empty repository
  const last = linkTo(res, 'last');
  return last ? Number(new URL(last).searchParams.get('page')) : (await body<unknown[]>(res)).length;
}

async function main() {
  // With "Private contributions" on, the calendar includes private work for any viewer.
  const { user } = await graphql<{
    user: {
      contributionsCollection: {
        contributionCalendar: {
          totalContributions: number;
          weeks: { contributionDays: { date: string; weekday: number; contributionCount: number }[] }[];
        };
      };
    };
  }>(
    `query($login: String!) { user(login: $login) { contributionsCollection { contributionCalendar {
       totalContributions weeks { contributionDays { date weekday contributionCount } } } } } }`,
    { login: LOGIN },
  );

  const cal = user.contributionsCollection.contributionCalendar;
  const days: Day[] = cal.weeks.flatMap((w, week) =>
    w.contributionDays.map((d) => ({ date: d.date, week, weekday: d.weekday, count: d.contributionCount })),
  );

  type Repo = { full_name: string; private: boolean; fork: boolean };
  const repos = (await all<Repo>('https://api.github.com/user/repos?affiliation=owner&per_page=100')).filter((r) => !r.fork);

  // An empty answer is a failed fetch, not an empty profile: stop before it is drawn over the last good one.
  if (days.length === 0 || repos.length === 0) throw new LoggedError(`empty data: ${days.length} days, ${repos.length} repositories`);

  const bytes = new Map<string, number>();
  for (const r of repos) {
    const langs = await body<Record<string, number>>(await get(`https://api.github.com/repos/${r.full_name}/languages`));
    for (const [lang, n] of Object.entries(langs)) bytes.set(lang, (bytes.get(lang) ?? 0) + n);
  }
  const totalBytes = [...bytes.values()].reduce((a, b) => a + b, 0);

  let commitsAllTime = 0;
  for (const r of repos) commitsAllTime += await commitCount(r.full_name);

  const stats: Stats = {
    fetchedAt: new Date().toISOString().slice(0, 10), // the date alone, so a run that finds nothing new changes nothing
    contributionsLastYear: cal.totalContributions,
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
}

await main().catch((e: unknown) => {
  // Anything not written here (a network or runtime error) is reduced to its name and code.
  const detail = e instanceof LoggedError ? e.message : `${(e as Error)?.name ?? 'Error'} ${(e as { cause?: { code?: string } })?.cause?.code ?? ''}`.trim();
  console.error(`fetch failed: ${detail}`);
  process.exitCode = 1;
});
