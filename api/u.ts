/**
 * GET /u/<login>  (rewrite → /api/u?user=<login>)
 *
 * Sirve la misma página de siempre, pero con metadatos Open Graph de ese entrenador,
 * para que los enlaces compartidos muestren su compañero. Los bots no ejecutan JS.
 */
import { cacheHeader, LOGIN } from './_lib/github.js';

const esc = (s: string): string => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string);

export function shareTags(origin: string, login: string): string {
  const user = encodeURIComponent(login);
  const title = `El sobre de @${login} · Gitmon`;
  const description = `Mira qué Pokémon se esconde en los commits de @${login} y abre tu propio sobre de 6 cartas.`;
  return [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    '<meta property="og:type" content="website" />',
    `<meta property="og:url" content="${origin}/u/${user}" />`,
    `<meta property="og:image" content="${origin}/api/og?user=${user}" />`,
    '<meta property="og:image:width" content="1200" />',
    '<meta property="og:image:height" content="630" />',
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:image" content="${origin}/api/og?user=${user}" />`,
  ].join('\n    ');
}

/** Cambia título y metadatos de la portada por los del entrenador. */
export function injectTags(html: string, tags: string): string {
  return html
    .replace(/<title>[\s\S]*?<\/title>\s*/i, '')
    .replace(/<meta\s+(?:name="(?:description|twitter:[^"]+)"|property="og:[^"]+")[^>]*>\s*/gi, '')
    .replace(/<head>/i, `<head>\n    ${tags}`);
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const login = url.searchParams.get('user')?.trim() ?? '';
  const origin = url.origin;

  let html: string | null = null;
  try {
    const res = await fetch(`${origin}/`, { signal: AbortSignal.timeout(3000) });
    if (res.ok && res.headers.get('content-type')?.includes('text/html')) html = await res.text();
  } catch {
    html = null;
  }

  if (!html) {
    // Respaldo: metadatos + redirección a la portada con ?u=, que abre el mismo sobre.
    const target = LOGIN.test(login) ? `/?u=${encodeURIComponent(login)}` : '/';
    html = `<!doctype html><html lang="es"><head><meta charset="utf-8" />${LOGIN.test(login) ? shareTags(origin, login) : ''}<meta http-equiv="refresh" content="0;url=${target}" /></head><body><a href="${target}">Abrir Gitmon</a></body></html>`;
    return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
  }

  const body = LOGIN.test(login) ? injectTags(html, shareTags(origin, login)) : html;
  return new Response(body, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': cacheHeader(3600) } });
}
