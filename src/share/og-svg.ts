import type { Card } from '../core/pack.js';
import { TYPES, typeColor, typeName } from '../core/types.js';
import { CARD_H, CARD_W, cardSvg, tint, xml } from './card-svg.js';

/** Imagen para redes: 1200×630 (Open Graph / Twitter). */
export const OG_W = 1200;
export const OG_H = 630;
const FONT = "'Lilita One'";
const INK = '#1D1D2B';

/** Oscurece un color hacia la tinta: amount = cuánto queda del color (0–1). */
export function shade(hex: string, amount: number): string {
  const n = parseInt(hex.replace('#', '').slice(0, 6), 16);
  const ink = [0x1d, 0x1d, 0x2b];
  return `#${[16, 8, 0]
    .map((s, i) => Math.round(ink[i] + (((n >> s) & 255) - ink[i]) * amount).toString(16).padStart(2, '0'))
    .join('')}`;
}

/** Rayos como en la portada, alrededor de (cx, cy). */
function rays(cx: number, cy: number, n = 18, r = 1400): string {
  const step = (Math.PI * 2) / n;
  return Array.from({ length: n }, (_, i) => {
    const a = i * step;
    const b = a + step * 0.35;
    return `M${cx} ${cy}L${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)}L${(cx + r * Math.cos(b)).toFixed(1)} ${(cy + r * Math.sin(b)).toFixed(1)}Z`;
  }).join('');
}

/** Texto con contorno grueso, como el título de la portada. */
const outlined = (x: number, y: number, size: number, fill: string, text: string, stroke = 8): string =>
  `<text x="${x}" y="${y + size * 0.12}" font-size="${size}" fill="${INK}" stroke="${INK}" stroke-width="${stroke}" stroke-linejoin="round">${xml(text)}</text>` +
  `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" stroke="${INK}" stroke-width="${stroke}" stroke-linejoin="round" paint-order="stroke">${xml(text)}</text>`;

/** Mete la carta como <svg> anidado (sin animación: el PNG es estático). */
function nestedCard(c: Card, art: string | null, site: string, x: number, y: number, w: number): string {
  const inner = cardSvg(c, { art, site })
    .replace(/<svg [^>]*>/, '')
    .replace(/<\/svg>\s*$/, '')
    .replace(/<animateTransform[^>]*\/>/g, '');
  const h = (w * CARD_H) / CARD_W;
  return `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="0 0 ${CARD_W} ${CARD_H}" font-family="${FONT}" fill="${INK}">${inner}</svg>`;
}

export function ogSvg(c: Card, opts: { art: string | null; site: string; edition: string }): string {
  const tc = typeColor(c.types[0]);
  const nameSize = Math.min(104, Math.floor(620 / Math.max(5, c.name.length * 0.56)));
  let chipX = 70;
  const chips = c.types
    .map((t) => {
      const label = typeName(t);
      const w = label.length * 17 + 44;
      const x = chipX;
      chipX += w + 14;
      return `<g transform="translate(${x} 440)"><rect width="${w}" height="50" rx="25" fill="${typeColor(t)}" stroke="${INK}" stroke-width="5"/><circle cx="26" cy="25" r="10" fill="#fff" stroke="${INK}" stroke-width="3"/><text x="44" y="35" font-size="28" fill="#fff" stroke="${INK}" stroke-width="4" paint-order="stroke">${xml(label)}</text></g>`;
    })
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${OG_W}" height="${OG_H}" viewBox="0 0 ${OG_W} ${OG_H}" font-family="${FONT}">
  <defs>
    <radialGradient id="ogbg" cx=".7" cy=".45" r=".9"><stop offset="0" stop-color="${tint(tc, 0.8)}"/><stop offset=".75" stop-color="${shade(tc, 0.65)}"/></radialGradient>
    <filter id="sh" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="18" stdDeviation="16" flood-color="#000" flood-opacity=".4"/></filter>
  </defs>
  <rect width="${OG_W}" height="${OG_H}" fill="url(#ogbg)"/>
  <path d="${rays(880, 300)}" fill="#fff" fill-opacity=".08"/>

  <g transform="translate(70 60)">
    <circle cx="26" cy="26" r="24" fill="#fff" stroke="${INK}" stroke-width="5"/><path d="M2 26a24 24 0 0 1 48 0z" fill="#EE1515" stroke="${INK}" stroke-width="5"/><circle cx="26" cy="26" r="8" fill="#fff" stroke="${INK}" stroke-width="4"/>
    <text x="66" y="42" font-size="44" fill="${INK}">Gitmon</text>
    <rect x="232" y="8" width="${opts.edition.length * 12 + 30}" height="36" rx="18" fill="#FFCB05" stroke="${INK}" stroke-width="4"/>
    <text x="${247}" y="34" font-size="20" fill="${INK}">${xml(opts.edition)}</text>
  </g>

  ${outlined(70, 205, 40, '#fff', 'El compañero de', 6)}
  ${outlined(70, 262, Math.min(52, Math.floor(600 / Math.max(6, (c.login.length + 1) * 0.55))), '#fff', `@${c.login}`, 7)}
  ${outlined(70, 385, nameSize, '#FFCB05', `${c.name}.`, 10)}
  ${chips}
  ${outlined(70, 570, 30, '#fff', `Abre tu sobre en ${opts.site}`, 6)}

  <g transform="rotate(4 900 315)" filter="url(#sh)">${nestedCard(c, opts.art, opts.site, 715, 30, 410)}</g>
</svg>`;
}

/** Imagen genérica (portada o usuario inválido). */
export function ogDefaultSvg(opts: { site: string; edition: string }): string {
  const dots = Object.values(TYPES)
    .map((t, i) => `<circle cx="${640 + (i % 9) * 34}" cy="${440 + Math.floor(i / 9) * 34}" r="12" fill="${t.color}" stroke="${INK}" stroke-width="3"/>`)
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${OG_W}" height="${OG_H}" viewBox="0 0 ${OG_W} ${OG_H}" font-family="${FONT}">
  <defs><radialGradient id="ogbg" cx=".7" cy=".45" r=".9"><stop offset="0" stop-color="#B99AF0"/><stop offset=".75" stop-color="#4A2E7A"/></radialGradient></defs>
  <rect width="${OG_W}" height="${OG_H}" fill="url(#ogbg)"/>
  <path d="${rays(880, 300)}" fill="#fff" fill-opacity=".08"/>
  ${outlined(70, 150, 40, '#fff', `Gitmon · ${opts.edition}`, 6)}
  ${outlined(70, 280, 96, '#fff', 'Tu código viene', 10)}
  ${outlined(70, 400, 96, '#FFCB05', 'en sobre.', 10)}
  ${outlined(70, 540, 32, '#fff', opts.site, 6)}
  <g transform="translate(880 230)"><circle r="130" fill="#fff" stroke="${INK}" stroke-width="14"/><path d="M-130 0a130 130 0 0 1 260 0z" fill="#EE1515" stroke="${INK}" stroke-width="14"/><circle r="40" fill="#fff" stroke="${INK}" stroke-width="12"/></g>
  ${dots}
</svg>`;
}
