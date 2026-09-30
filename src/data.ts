import { readFileSync } from 'node:fs';

// Everything src/fetch.ts writes and src/build.ts reads. Aggregates only: no repository
// names, descriptions or commit messages ever reach data/, so none can reach the README.

export type Day = { date: string; week: number; weekday: number; count: number };

export type Stats = {
  fetchedAt: string; // YYYY-MM-DD
  daysOnGitHub: number;
  contributionsLastYear: number; // includes private work, anonymised by GitHub
  activeDays: number;
  longestStreak: number;
  currentStreak: number;
  commitsAllTime: number;
  repos: { total: number; public: number; private: number };
  languages: { name: string; pct: number }[]; // by bytes across owned repos, largest first
};

const DATA = new URL('../data/', import.meta.url);

export const loadStats = (): Stats => JSON.parse(readFileSync(new URL('stats.json', DATA), 'utf8'));
export const loadCalendar = (): Day[] => JSON.parse(readFileSync(new URL('calendar.json', DATA), 'utf8'));
export const dataFile = (name: string): URL => new URL(name, DATA);
