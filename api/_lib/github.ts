/**
 * Lectura de GitHub desde las funciones: usa GITHUB_TOKEN si existe y recorta
 * las respuestas a lo que Gitmon necesita. Los archivos con «_» no son rutas en Vercel.
 */

const GH = 'https://api.github.com';
export const LOGIN = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

type Json = Record<string, unknown>;

const pick = (o: Json, keys: readonly string[]): Json => Object.fromEntries(keys.filter((k) => k in o).map((k) => [k, o[k]]));

async function gh(path: string): Promise<Response> {
  const headers: Record<string, string> = { Accept: 'application/vnd.github+json', 'User-Agent': 'gitmon' };
  const token = process.env.GITHUB_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(`${GH}${path}`, { headers });
}

export type GithubResult =
  | { ok: true; data: { profile: Json; repos: Json[]; events: Json[]; following: Json[] } }
  | { ok: false; status: 400 | 404 | 503; error: string };

export async function loadGithub(login: string): Promise<GithubResult> {
  if (!LOGIN.test(login)) return { ok: false, status: 400, error: 'Usuario de GitHub no válido.' };

  const [profileRes, reposRes, eventsRes, followingRes] = await Promise.all([
    gh(`/users/${login}`),
    gh(`/users/${login}/repos?per_page=100&sort=pushed`),
    gh(`/users/${login}/events/public?per_page=100`),
    gh(`/users/${login}/following?per_page=24`),
  ]);

  if (profileRes.status === 404) return { ok: false, status: 404, error: 'Entrenador no encontrado.' };
  if (!profileRes.ok || !reposRes.ok) return { ok: false, status: 503, error: 'GitHub no respondió o nos limitó.' };

  const profile = (await profileRes.json()) as Json;
  const repos = (await reposRes.json()) as Json[];
  const events = eventsRes.ok ? ((await eventsRes.json()) as Json[]) : [];
  const following = followingRes.ok ? ((await followingRes.json()) as Json[]) : [];

  return {
    ok: true,
    data: {
      profile: pick(profile, ['login', 'name', 'avatar_url', 'created_at', 'followers']),
      repos: repos.map((r) =>
        pick(r, ['name', 'language', 'stargazers_count', 'forks_count', 'open_issues_count', 'size', 'fork', 'description', 'created_at', 'pushed_at', 'topics', 'homepage']),
      ),
      events: events.map((e) => {
        const payload = (e.payload ?? {}) as Json;
        const size = typeof payload.size === 'number' ? payload.size : Array.isArray(payload.commits) ? payload.commits.length : undefined;
        return { type: e.type, created_at: e.created_at, payload: { size } };
      }),
      following: following.map((f) => pick(f, ['login', 'avatar_url'])),
    },
  };
}

export const DAY = 60 * 60 * 24;

export function cacheHeader(seconds: number): string {
  return seconds ? `public, s-maxage=${seconds}, stale-while-revalidate=3600` : 'no-store';
}
