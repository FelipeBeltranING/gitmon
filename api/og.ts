/**
 * GET /api/og?user=<login>
 *
 * Imagen para redes (1200×630 PNG): el compañero con su carta, para que al compartir
 * /u/<login> en WhatsApp, X o Discord se vea tu Pokémon. Sin usuario, la imagen de portada.
 */
import { Resvg } from '@resvg/resvg-js';
import { fileURLToPath } from 'node:url';
import { activeSeason, editionLabel } from '../src/config.js';
import { buildCompanion, type GithubData } from '../src/core/pack.js';
import * as pokeapi from '../src/data/pokeapi.js';
import { ogDefaultSvg, ogSvg } from '../src/share/og-svg.js';
import { cacheHeader, DAY, LOGIN, loadGithub } from './_lib/github.js';
import { toDataUri } from './card.js';

const FONT_FILE = fileURLToPath(new URL('./_fonts/LilitaOne-Regular.ttf', import.meta.url));

export function renderPng(svg: string): Uint8Array {
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1200 },
    font: { fontFiles: [FONT_FILE], loadSystemFonts: false, defaultFontFamily: 'Lilita One' },
  });
  return resvg.render().asPng();
}

function png(svg: string, cacheSeconds: number): Response {
  return new Response(Buffer.from(renderPng(svg)), {
    status: 200,
    headers: { 'Content-Type': 'image/png', 'Cache-Control': cacheHeader(cacheSeconds) },
  });
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const login = url.searchParams.get('user')?.trim() ?? '';
  const season = activeSeason(url.search);
  const site = url.host;
  const edition = editionLabel(season);

  if (!LOGIN.test(login)) return png(ogDefaultSvg({ site, edition }), DAY);
  const gh = await loadGithub(login);
  if (!gh.ok) return png(ogDefaultSvg({ site, edition }), gh.status === 404 ? DAY : 300);

  try {
    const github = async (): Promise<GithubData> => ({ ...(gh.data as unknown as Omit<GithubData, 'source'>), source: 'api' });
    const { companion } = await buildCompanion(login, season, {
      github,
      typeIds: pokeapi.typeIds,
      pokemon: pokeapi.pokemon,
      info: pokeapi.info,
      move: pokeapi.move,
      now: () => Date.now(),
    });
    return png(ogSvg(companion, { art: await toDataUri(companion.art), site, edition }), DAY);
  } catch {
    return png(ogDefaultSvg({ site, edition }), 300);
  }
}
