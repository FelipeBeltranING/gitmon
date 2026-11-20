import type { Card } from '../core/pack.js';
import { RARITY } from '../core/rarity.js';
import { typeColor, typeName } from '../core/types.js';

/** Tamaño de la carta: proporción 63×88 de una carta real. */
export const CARD_W = 320;
export const CARD_H = 446;

const FONT = "'Trebuchet MS','Segoe UI',Verdana,'DejaVu Sans',sans-serif";

export const xml = (s: unknown): string =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c] as string);

/** Corta un texto en líneas de hasta `width` caracteres; la última lleva «…» si sobra texto. */
export function wrap(text: string, width: number, maxLines: number): string[] {
  const words = text.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (next.length <= width) line = next;
    else {
      if (line) lines.push(line);
      line = w.length > width ? `${w.slice(0, width - 1)}…` : w;
    }
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = `${kept[maxLines - 1].slice(0, width - 1).replace(/[\s.,;:]+$/, '')}…`;
    return kept;
  }
  return lines;
}

const clip = (s: string, n: number): string => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

/** Mezcla un color con blanco: amount = cuánto queda del color (0–1). */
export function tint(hex: string, amount: number): string {
  const n = parseInt(hex.replace('#', '').padEnd(6, '0').slice(0, 6), 16);
  const ch = (shift: number) => Math.round(255 - (255 - ((n >> shift) & 255)) * amount);
  return `#${[16, 8, 0].map((s) => ch(s).toString(16).padStart(2, '0')).join('')}`;
}

const pad = (n: number): string => String(n).padStart(4, '0');
const num = (n: number): string => n.toLocaleString('es-CO', { maximumFractionDigits: 1 });

export interface SvgOptions {
  /** Arte del Pokémon como data URI (las imágenes externas no cargan dentro de un SVG en un README). */
  art: string | null;
  site: string;
}

/** La carta del compañero como SVG autocontenido, con brillo holo animado. */
export function cardSvg(c: Card, opts: SvgOptions): string {
  const tc = typeColor(c.types[0]);
  const r = RARITY[c.rarity];
  const stageW = c.stage.length * 5.4 + 12;
  const dots = c.types.map((t, i) => {
    const cx = 292 - (c.types.length - 1 - i) * 19;
    return `<circle cx="${cx}" cy="31" r="8" fill="${typeColor(t)}" stroke="#1D1D2B" stroke-width="1.6"/><text x="${cx}" y="34.5" font-size="9" font-weight="900" fill="#fff" text-anchor="middle">${xml(typeName(t)[0])}</text>`;
  });
  const psX = 292 - (c.types.length - 1) * 19 - 14;

  const attacks = c.attacks.slice(0, 2).map((a, i) => {
    const top = 250 + i * 48;
    const energies = Math.max(1, Math.min(4, Math.ceil((Number(a.power) || 20) / 40)));
    const circles = Array.from({ length: energies }, (_, k) => `<circle cx="${30 + k * 13}" cy="${top + 16}" r="5.5" fill="${typeColor(a.type)}" stroke="#1D1D2B" stroke-width="1.2"/>`).join('');
    const desc = wrap(a.desc, 50, 2)
      .map((l, k) => `<text x="88" y="${top + 27 + k * 9}" font-size="7.5" fill="#3b3b4f">${xml(l)}</text>`)
      .join('');
    return `${circles}<text x="88" y="${top + 15}" font-size="12.5" font-weight="900">${xml(clip(a.name, 24))}</text>${desc}
      <text x="298" y="${top + 22}" font-size="21" font-weight="900" text-anchor="end">${xml(a.power)}</text>
      ${i < Math.min(2, c.attacks.length) - 1 ? `<line x1="22" x2="298" y1="${top + 45}" y2="${top + 45}" stroke="#1D1D2B" stroke-opacity=".18"/>` : ''}`;
  });

  const flavor = wrap(c.flavor, 70, 3)
    .map((l, k) => `<text x="27" y="${395 + k * 9}" font-size="7.5" font-style="italic" font-weight="700">${xml(l)}</text>`)
    .join('');
  const retreat = Array.from({ length: c.retreat }, (_, k) => `<circle cx="${250 - (c.retreat - 1) * 6 + k * 12}" cy="374" r="5" fill="#eee" stroke="#1D1D2B" stroke-width="1.2"/>`).join('');
  const holo = c.rarity === 'holo' || c.rarity === 'leyenda' || c.rarity === 'vario';
  const frame = c.rarity === 'vario' ? ['#FAFAFF', '#AEB4C8', '#FFFFFF', '#939BB4'] : ['#FFE680', '#E9B800', '#FFF0A8', '#D7A700'];

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${CARD_W}" height="${CARD_H}" viewBox="0 0 ${CARD_W} ${CARD_H}" font-family="${FONT}" fill="#1D1D2B" role="img" aria-labelledby="t">
  <title id="t">${xml(`El compañero de @${c.login} en Gitmon es ${c.name} (${r.name})`)}</title>
  <defs>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${frame[0]}"/><stop offset=".4" stop-color="${frame[1]}"/><stop offset=".6" stop-color="${frame[2]}"/><stop offset="1" stop-color="${frame[3]}"/></linearGradient>
    <linearGradient id="bg" x1="0" y1="0" x2=".25" y2="1"><stop offset="0" stop-color="${tint(tc, 0.35)}"/><stop offset=".6" stop-color="${tint(tc, 0.75)}"/><stop offset="1" stop-color="${tint(tc, 0.45)}"/></linearGradient>
    <radialGradient id="art" cx=".5" cy=".7" r=".8"><stop offset="0" stop-color="#fff"/><stop offset=".6" stop-color="${tint(tc, 0.6)}"/><stop offset="1" stop-color="${tc}"/></radialGradient>
    <linearGradient id="strip" x1="0" x2="1"><stop offset="0" stop-color="#C9A93A"/><stop offset=".5" stop-color="#F6E7A6"/><stop offset="1" stop-color="#C9A93A"/></linearGradient>
    <linearGradient id="shine" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".35" stop-color="#ff7ad9" stop-opacity=".35"/><stop offset=".5" stop-color="#fff" stop-opacity=".7"/><stop offset=".65" stop-color="#7af0ff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <pattern id="stripes" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="12" fill="#fff" fill-opacity=".18"/></pattern>
    <clipPath id="artclip"><rect x="20" y="44" width="280" height="176"/></clipPath>
  </defs>
  <rect width="${CARD_W}" height="${CARD_H}" rx="18" fill="url(#gold)"/>
  <rect x="10" y="10" width="300" height="426" rx="10" fill="url(#bg)"/>

  <rect x="18" y="24" width="${stageW}" height="13" rx="3" fill="#ddd" stroke="#1D1D2B" stroke-width="1.2"/>
  <text x="${18 + stageW / 2}" y="33.5" font-size="7.5" font-weight="900" text-anchor="middle">${xml(c.stage.toUpperCase())}</text>
  <text x="${24 + stageW}" y="37" font-size="19" font-weight="900">${xml(clip(c.name, 14))}</text>
  <text x="${psX}" y="37" font-size="18" font-weight="900" text-anchor="end"><tspan font-size="8">PS </tspan>${c.hp}</text>
  ${dots.join('')}

  <g clip-path="url(#artclip)">
    <rect x="20" y="44" width="280" height="176" fill="url(#art)"/>
    <rect x="20" y="44" width="280" height="176" fill="url(#stripes)"/>
    ${opts.art ? `<image x="20" y="44" width="280" height="176" preserveAspectRatio="xMidYMid meet" href="${opts.art}" xlink:href="${opts.art}"/>` : `<circle cx="160" cy="132" r="40" fill="#fff" stroke="#1D1D2B" stroke-width="5"/>`}
    ${holo ? `<rect x="-140" y="44" width="140" height="176" fill="url(#shine)" transform="skewX(-15)"><animateTransform attributeName="transform" type="translate" from="0 0" to="560 0" dur="3.8s" repeatCount="indefinite" additive="sum"/></rect>` : ''}
  </g>
  <rect x="20" y="44" width="280" height="176" fill="none" stroke="#C9A93A" stroke-width="4"/>
  ${c.companion ? `<g transform="rotate(-4 50 58)"><rect x="16" y="50" width="78" height="14" fill="#E3350D" stroke="#1D1D2B" stroke-width="1.2"/><text x="55" y="60.5" font-size="8" font-weight="900" fill="#fff" text-anchor="middle" letter-spacing=".8">COMPAÑERO</text></g>` : ''}

  <rect x="28" y="226" width="264" height="14" fill="url(#strip)" stroke="#8A7020" stroke-width="1"/>
  <text x="160" y="236" font-size="7.5" font-weight="800" font-style="italic" text-anchor="middle">${xml(clip(`${c.genus} · Nº ${pad(c.id)} · Alt. ${num(c.height)} m · Peso ${num(c.weight)} kg`, 66))}</text>

  ${attacks.join('')}

  <line x1="22" x2="298" y1="348" y2="348" stroke="#1D1D2B" stroke-opacity=".3" stroke-width="1.5"/>
  <g font-size="7" font-weight="900" text-anchor="middle"><text x="70" y="361">debilidad</text><text x="160" y="361">resistencia</text><text x="250" y="361">retirada</text></g>
  <circle cx="64" cy="374" r="5.5" fill="${typeColor(c.weak)}" stroke="#1D1D2B" stroke-width="1.2"/><text x="72" y="377.5" font-size="9" font-weight="900">×2</text>
  <circle cx="152" cy="374" r="5.5" fill="${typeColor(c.resist)}" stroke="#1D1D2B" stroke-width="1.2"/><text x="160" y="377.5" font-size="9" font-weight="900">−30</text>
  ${retreat}

  <rect x="20" y="385" width="280" height="32" fill="#fff" fill-opacity=".55" stroke="#C9A93A"/>
  ${flavor}
  <text x="20" y="429" font-size="7" font-weight="900" fill-opacity=".75">${xml(clip(`Ilus. @${c.login} · ${opts.site}`, 60))}</text>
  <text x="300" y="429" font-size="7" font-weight="900" text-anchor="end">${pad(c.id)}/1025 ${r.symbol}</text>
</svg>`;
}

/** Carta de error, para que el README no muestre una imagen rota. */
export function errorSvg(message: string, site: string): string {
  const lines = wrap(message, 34, 3)
    .map((l, i) => `<text x="160" y="${292 + i * 18}" font-size="14" font-weight="800" fill="#F6D35B" text-anchor="middle">${xml(l)}</text>`)
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_W}" height="${CARD_H}" viewBox="0 0 ${CARD_W} ${CARD_H}" font-family="${FONT}" role="img" aria-label="${xml(message)}">
  <defs><radialGradient id="b"><stop offset="0" stop-color="#3A6FD8"/><stop offset="1" stop-color="#1B3E8A"/></radialGradient></defs>
  <rect width="${CARD_W}" height="${CARD_H}" rx="18" fill="#F6D35B"/>
  <rect x="12" y="12" width="296" height="422" rx="10" fill="url(#b)"/>
  <circle cx="160" cy="180" r="62" fill="#fff" stroke="#1D1D2B" stroke-width="7"/>
  <path d="M98 180a62 62 0 0 1 124 0z" fill="#EE1515" stroke="#1D1D2B" stroke-width="7"/>
  <circle cx="160" cy="180" r="18" fill="#fff" stroke="#1D1D2B" stroke-width="7"/>
  ${lines}
  <text x="160" y="410" font-size="10" font-weight="900" fill="#fff" fill-opacity=".7" text-anchor="middle">${xml(site)}</text>
</svg>`;
}
