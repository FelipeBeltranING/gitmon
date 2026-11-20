/**
 * GET /api/github?user=<login>
 *
 * Junta en una sola respuesta lo que Gitmon necesita de un perfil: datos públicos,
 * repos, eventos recientes y a quién sigue. Usa GITHUB_TOKEN si existe y deja la
 * respuesta 24 h en la caché de Vercel para no gastar el límite de GitHub.
 */
import { cacheHeader, DAY, loadGithub } from './_lib/github.js';

function json(body: unknown, status: number, cacheSeconds = 0): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': cacheHeader(cacheSeconds) },
  });
}

export async function GET(request: Request): Promise<Response> {
  const login = new URL(request.url).searchParams.get('user')?.trim() ?? '';
  const result = await loadGithub(login);
  if (!result.ok) return json({ error: result.error }, result.status, result.status === 404 ? DAY : 0);
  return json(result.data, 200, DAY);
}
