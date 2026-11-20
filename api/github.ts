/**
 * GET /api/github?user=<login>
 *
 * Junta en una sola respuesta lo que Gitmon necesita de un perfil: datos públicos,
 * repos, eventos recientes y a quién sigue. Usa GITHUB_TOKEN si existe y deja la
 * respuesta 24 h en la caché de Vercel para no gastar el límite de GitHub.
 */

const GH = 'https://api.github.com';
const LOGIN = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;
const DAY = 60 * 60 * 24;

type Json = Record<string, unknown>;

const pick = <T extends Json>(o: T, keys: readonly string[]): Json => Object.fromEntries(keys.filter((k) => k in o).map((k) => [k, o[k]]));

function json(body: unknown, status: number, cacheSeconds = 0): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': cacheSeconds ? `public, s-maxage=${cacheSeconds}, stale-while-revalidate=3600` : 'no-store',
    },
  });
}

async function gh(path: string): Promise<Response> {
  const headers: Record<string, string> = { Accept: 'application/vnd.github+json', 'User-Agent': 'gitmon' };
  const token = process.env.GITHUB_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(`${GH}${path}`, { headers });
}

export async function GET(request: Request): Promise<Response> {
  const login = new URL(request.url).searchParams.get('user')?.trim() ?? '';
  if (!LOGIN.test(login)) return json({ error: 'Usuario de GitHub no válido.' }, 400);

  const [profileRes, reposRes, eventsRes, followingRes] = await Promise.all([
    gh(`/users/${login}`),
    gh(`/users/${login}/repos?per_page=100&sort=pushed`),
    gh(`/users/${login}/events/public?per_page=100`),
    gh(`/users/${login}/following?per_page=24`),
  ]);

  if (profileRes.status === 404) return json({ error: 'Entrenador no encontrado.' }, 404, DAY);
  if (!profileRes.ok || !reposRes.ok) return json({ error: 'GitHub no respondió o nos limitó.' }, 503);

  const profile = (await profileRes.json()) as Json;
  const repos = (await reposRes.json()) as Json[];
  const events = eventsRes.ok ? ((await eventsRes.json()) as Json[]) : [];
  const following = followingRes.ok ? ((await followingRes.json()) as Json[]) : [];

  return json(
    {
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
    200,
    DAY,
  );
}
