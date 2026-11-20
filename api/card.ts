/**
 * GET /api/card?user=<login>
 *
 * La carta del compañero como SVG para pegar en el README:
 *   [![Mi Gitmon](https://<sitio>/api/card?user=octocat)](https://<sitio>/u/octocat)
 *
 * El arte va incrustado en base64 (dentro de un <img> los SVG no cargan recursos externos)
 * y la respuesta queda 24 h en la caché de Vercel.
 */
import { activeSeason } from '../src/config.js';
import { buildCompanion, type GithubData } from '../src/core/pack.js';
import * as pokeapi from '../src/data/pokeapi.js';
import { cardSvg, errorSvg } from '../src/share/card-svg.js';
import { cacheHeader, DAY, loadGithub } from './_lib/github.js';

function svg(body: string, status: number, cacheSeconds: number): Response {
  return new Response(body, {
    status,
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': cacheHeader(cacheSeconds),
      'Content-Security-Policy': "default-src 'none'; img-src data:; style-src 'unsafe-inline'",
    },
  });
}

/** Descarga una imagen y la devuelve como data URI. */
export async function toDataUri(url: string): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const type = res.headers.get('content-type') ?? 'image/png';
    const b64 = Buffer.from(await res.arrayBuffer()).toString('base64');
    return `data:${type};base64,${b64}`;
  } catch {
    return null;
  }
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const login = url.searchParams.get('user')?.trim() ?? '';
  const site = url.host;

  const gh = await loadGithub(login);
  if (!gh.ok) {
    const message = gh.status === 404 ? `No encontramos a @${login} en GitHub` : gh.status === 400 ? 'Usuario de GitHub no válido' : 'GitHub no respondió. Vuelve en un rato.';
    return svg(errorSvg(message, site), gh.status, gh.status === 404 ? DAY : 300);
  }

  try {
    const github = async (): Promise<GithubData> => ({ ...(gh.data as unknown as Omit<GithubData, 'source'>), source: 'api' });
    const { companion } = await buildCompanion(login, activeSeason(url.search), {
      github,
      typeIds: pokeapi.typeIds,
      pokemon: pokeapi.pokemon,
      info: pokeapi.info,
      move: pokeapi.move,
      now: () => Date.now(),
    });
    return svg(cardSvg(companion, { art: await toDataUri(companion.art), site }), 200, DAY);
  } catch {
    return svg(errorSvg('La PokeAPI no respondió. Vuelve en un rato.', site), 503, 0);
  }
}
