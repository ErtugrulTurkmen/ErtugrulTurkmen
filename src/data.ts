import { readFileSync } from 'node:fs';

// What fetch.ts writes and build.ts reads: aggregates only. No repository name, description or
// commit message ever reaches data/, so none can reach the README.

export type Day = { date: string; week: number; weekday: number; count: number };

export type Stats = {
  fetchedAt: string; // YYYY-MM-DD
  contributionsLastYear: number; // includes private work, anonymised by GitHub
  commitsAllTime: number;
  repos: { total: number; public: number; private: number };
  languages: { name: string; pct: number }[]; // by bytes across owned repos, largest first
};

const DATA = new URL('../data/', import.meta.url);

export const loadStats = (): Stats => JSON.parse(readFileSync(new URL('stats.json', DATA), 'utf8'));
export const loadCalendar = (): Day[] => JSON.parse(readFileSync(new URL('calendar.json', DATA), 'utf8'));
export const dataFile = (name: string): URL => new URL(name, DATA);
