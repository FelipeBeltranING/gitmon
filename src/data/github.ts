import type { Friend, GithubData } from '../core/pack';
import { fnv1a, mulberry32 } from '../core/rng';
import type { GhEvent, GhProfile, GhRepo } from '../core/stats';
import { LANGUAGE_TYPE } from '../core/types';
import { HttpError, getJson } from './http';

export class TrainerNotFound extends Error {
  constructor(readonly login: string) {
    super(`No encontramos a “${login}” en GitHub.`);
  }
}

/** Mismas reglas que GitHub para nombres de usuario. */
export const isValidLogin = (login: string): boolean => /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i.test(login);

const GH = 'https://api.github.com';
const headers = { Accept: 'application/vnd.github+json' };

/** 1) Función serverless con token y caché. 2) API pública desde el navegador. 3) Perfil simulado si GitHub nos limita. */
export async function fetchGithub(login: string): Promise<GithubData> {
  if (!isValidLogin(login)) throw new TrainerNotFound(login);
  try {
    const data = await getJson<Omit<GithubData, 'source'>>(`/api/github?user=${encodeURIComponent(login)}`);
    if (data?.profile?.login) return { ...data, source: 'api' };
  } catch (e) {
    if (e instanceof HttpError && e.status === 404) throw new TrainerNotFound(login);
  }
  try {
    const [profile, repos, events, following] = await Promise.all([
      getJson<GhProfile>(`${GH}/users/${login}`, { headers }),
      getJson<GhRepo[]>(`${GH}/users/${login}/repos?per_page=100&sort=pushed`, { headers }),
      getJson<GhEvent[]>(`${GH}/users/${login}/events/public?per_page=100`, { headers }).catch(() => []),
      getJson<Friend[]>(`${GH}/users/${login}/following?per_page=24`, { headers }).catch(() => []),
    ]);
    return { profile, repos, events, following, source: 'directo' };
  } catch (e) {
    if (e instanceof HttpError && e.status === 404) throw new TrainerNotFound(login);
    return simulated(login);
  }
}

const SAMPLE_NAMES = ['api-rest', 'portfolio', 'bot-discord', 'pixel-art', 'dotfiles', 'landing', 'chat-sockets', 'todo-app'];

/** Perfil inventado pero estable (sale del hash del usuario) para cuando GitHub no responde. */
export function simulated(login: string, now = Date.now()): GithubData {
  const r = mulberry32(fnv1a(login));
  const languages = Object.keys(LANGUAGE_TYPE);
  const repos: GhRepo[] = Array.from({ length: 6 + Math.floor(r() * 20) }, (_, i) => ({
    name: SAMPLE_NAMES[i % SAMPLE_NAMES.length] + (i > 7 ? `-${i}` : ''),
    language: languages[Math.floor(r() * r() * languages.length)],
    stargazers_count: Math.floor(r() * r() * r() * 300),
    forks_count: Math.floor(r() * r() * 30),
    open_issues_count: Math.floor(r() * 8),
    size: Math.floor(r() * 20000),
    fork: false,
    description: null,
    created_at: new Date(now - r() * 9e10).toISOString(),
    pushed_at: new Date(now - r() * 3e10).toISOString(),
  }));
  return {
    source: 'simulado',
    events: [],
    following: [],
    repos,
    profile: {
      login,
      name: login,
      avatar_url: `https://github.com/${login}.png`,
      created_at: new Date(now - (1 + r() * 8) * 3.15e10).toISOString(),
      followers: Math.floor(r() * r() * 400),
    },
  };
}
