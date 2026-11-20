import { typeOfLanguage, type TypeName } from './types';

/** PS, Ataque, Defensa, At. Esp., Def. Esp., Velocidad (mismo orden que la PokeAPI). */
export type StatVector = [number, number, number, number, number, number];

export const STAT_LABELS = ['PS', 'Ataque', 'Defensa', 'At. Esp.', 'Def. Esp.', 'Velocidad'] as const;

export interface GhProfile {
  login: string;
  name?: string | null;
  avatar_url: string;
  created_at: string;
  followers: number;
}

export interface GhRepo {
  name: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count?: number;
  size: number;
  fork: boolean;
  description: string | null;
  created_at: string;
  pushed_at: string;
  topics?: string[];
  homepage?: string | null;
}

export interface GhEvent {
  type: string;
  created_at: string;
  payload?: { size?: number; commits?: unknown[] };
}

const DAY = 864e5;

export const daysBetween = (a: string | number | Date, b: string | number | Date): number =>
  Math.max(0, (new Date(b).getTime() - new Date(a).getTime()) / DAY);

/** stat = 10 + 150 · (ln(1+x) / ln(1+máx))^2.4, entre 10 y 160. */
export function stat(x: number, max: number): number {
  const ratio = Math.min(1, Math.log1p(Math.max(0, x)) / Math.log1p(max));
  return Math.round(10 + 150 * Math.pow(ratio, 2.4));
}

export const total = (v: readonly number[]): number => v.reduce((a, b) => a + b, 0);

export interface ProfileSignals {
  languages: string[];
  primary: TypeName;
  secondary: TypeName | null;
  peakHour: number;
  night: boolean;
  vector: StatVector;
  total: number;
  repos: GhRepo[];
}

/** Lee el perfil completo y lo convierte en tipos y un vector de 6 stats. */
export function profileSignals(
  profile: GhProfile,
  allRepos: GhRepo[],
  events: GhEvent[],
  now: number,
  random: () => number,
): ProfileSignals {
  const own = allRepos.filter((r) => !r.fork);
  const repos = own.length ? own : allRepos;

  const weight: Record<string, number> = {};
  for (const r of repos) {
    if (!r.language) continue;
    weight[r.language] = (weight[r.language] ?? 0) + 1 + Math.sqrt(r.size || 0) / 12 + (r.stargazers_count || 0) * 0.4;
  }
  const languages = Object.entries(weight)
    .sort((a, b) => b[1] - a[1])
    .map(([lang]) => lang);
  const primary = typeOfLanguage(languages[0]);

  const hours = new Array<number>(24).fill(0);
  for (const e of events) hours[new Date(e.created_at).getHours()]++;
  const peakHour = events.length ? hours.indexOf(Math.max(...hours)) : Math.floor(random() * 24);
  const night = peakHour >= 22 || peakHour < 5;
  let secondary: TypeName | null = night ? 'dark' : languages[1] ? typeOfLanguage(languages[1]) : null;
  if (secondary === primary) secondary = null;

  const years = Math.max(1, daysBetween(profile.created_at, now) / 365.25);
  const stars = repos.reduce((s, r) => s + (r.stargazers_count || 0), 0);
  const forks = repos.reduce((s, r) => s + (r.forks_count || 0), 0);

  let pushes = 0;
  const activeDays = new Set<string>();
  for (const e of events) {
    activeDays.add(e.created_at.slice(0, 10));
    if (e.type === 'PushEvent') pushes += e.payload?.size || e.payload?.commits?.length || 1;
  }
  const times = events.map((e) => new Date(e.created_at).getTime());
  const span = times.length ? Math.max(7, (Math.max(...times) - Math.min(...times)) / DAY) : 90;
  const commitsPerYear = events.length ? Math.round((pushes * 365) / span) : Math.floor(random() * 900);

  const vector: StatVector = [
    stat(repos.length * years, 600),
    stat(commitsPerYear, 3000),
    stat(forks, 250),
    stat(stars, 1500),
    stat(profile.followers, 600),
    stat(events.length ? activeDays.size : random() * 40, 90),
  ];
  return { languages, primary, secondary, peakHour, night, vector, total: total(vector), repos };
}

/** Vector de stats de un solo repo. */
export function repoVector(r: GhRepo, now: number): StatVector {
  const care = (r.open_issues_count ?? 0) + (r.topics?.length ?? 0) * 3 + (r.description ? 5 : 0) + (r.homepage ? 10 : 0);
  return [
    stat(r.size, 100000),
    stat(daysBetween(r.created_at, r.pushed_at), 1500),
    stat(r.forks_count, 200),
    stat(r.stargazers_count, 2000),
    stat(care, 100),
    stat(Math.max(0, 365 - daysBetween(r.pushed_at, now)), 365),
  ];
}

/** Repos más activos: estrellas, forks, actividad reciente y tamaño. */
export function mostActive(repos: GhRepo[], now: number, n: number): GhRepo[] {
  const score = (r: GhRepo) =>
    (r.stargazers_count || 0) * 3 +
    (r.forks_count || 0) * 2 +
    Math.max(0, 60 - daysBetween(r.pushed_at, now)) / 4 +
    Math.sqrt(r.size || 0) / 20;
  return [...repos].sort((a, b) => score(b) - score(a)).slice(0, n);
}

export function byStars(repos: GhRepo[]): GhRepo[] {
  return [...repos].sort(
    (a, b) => b.stargazers_count - a.stargazers_count || new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime(),
  );
}
