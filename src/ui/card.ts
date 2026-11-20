import type { Card } from '../core/pack';
import { RARITY } from '../core/rarity';
import { typeColor, typeName } from '../core/types';
import { esc, fmt, pad } from './dom';

const energy = (power: number | ''): string => '<i></i>'.repeat(Math.max(1, Math.min(4, Math.ceil((Number(power) || 20) / 40))));

/** HTML de una carta. Escala sola con su contenedor (.slot usa container queries). */
export function cardHTML(c: Card, faceUp = false): string {
  const r = RARITY[c.rarity];
  const attacks = c.attacks.length
    ? c.attacks
        .map(
          (a) => `<div class="atk" style="--c:${typeColor(a.type)}">
            <div class="en" aria-hidden="true">${energy(a.power)}</div>
            <div><b>${esc(a.name)}</b><small>${esc(a.desc)}</small></div>
            <span class="dmg">${a.power}</span></div>`,
        )
        .join('')
    : '<div class="atk"><div></div><div><b>Placaje</b><small>Aún no hay repos públicos.</small></div><span class="dmg">10</span></div>';

  return `<div class="card r-${c.rarity}${faceUp ? ' up' : ''}" style="--tc:${typeColor(c.types[0])}">
  <div class="face" role="img" aria-label="${esc(`${c.name}, ${r.name}${c.repo ? `, del repo ${c.repo}` : ', tu compañero'}`)}"><div class="tilt"><div class="inner">
    <div class="ctop"><span class="stg">${esc(c.stage.toUpperCase())}</span><span class="cname">${esc(c.name)}</span><span class="chp">PS <b>${c.hp}</b></span>${c.types
      .map((t) => `<i class="tdot" style="--c:${typeColor(t)}" title="${esc(typeName(t))}">${esc(typeName(t)[0])}</i>`)
      .join('')}</div>
    <div class="art"><div class="holo"></div>${c.companion ? '<span class="ribbon">COMPAÑERO</span>' : ''}<img src="${esc(c.art)}" alt="" loading="lazy" decoding="async"></div>
    <div class="strip">${esc(c.genus)} · Nº ${pad(c.id)} · Alt. ${fmt(c.height)} m · Peso ${fmt(c.weight)} kg</div>
    <div class="atks">${attacks}</div>
    <div class="wrr">
      <div>debilidad<span class="v"><i style="--c:${typeColor(c.weak)}"></i>×2</span></div>
      <div>resistencia<span class="v"><i style="--c:${typeColor(c.resist)}"></i>−30</span></div>
      <div>retirada<span class="v">${'<i></i>'.repeat(c.retreat)}</span></div>
    </div>
    <div class="cflv">${esc(c.flavor)}</div>
    <div class="cfoot"><span>Ilus. @${esc(c.login)}${c.repo ? ` · ${esc(c.repo)}` : ''}</span><span>${pad(c.id)}/1025 <b class="sym">${r.symbol}</b></span></div>
    <div class="shine"></div><div class="glare"></div><div class="spark"></div>
  </div></div></div>
  <div class="back" aria-hidden="true"><i class="pb"></i><b>GITMON</b></div>
</div>`;
}

export function captionHTML(c: Card): string {
  const r = RARITY[c.rarity];
  const tone = c.rarity === 'holo' || c.rarity === 'vario' ? 'holo-b' : c.rarity === 'leyenda' ? 'ley-b' : '';
  return `<div class="cap"><span class="rb ${tone}">${r.symbol} ${r.name}</span><span>${c.companion ? 'Tu perfil' : esc(c.repo)}</span></div>`;
}

/** Inclinación 3D y brillo que siguen al puntero. */
export function bindTilt(slot: HTMLElement): void {
  slot.addEventListener('pointermove', (e) => {
    const card = slot.querySelector<HTMLElement>('.card.up');
    if (!card) return;
    const rect = slot.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const tilt = card.querySelector<HTMLElement>('.tilt');
    const inner = card.querySelector<HTMLElement>('.inner');
    if (tilt) tilt.style.transform = `rotateY(${(x - 0.5) * 20}deg) rotateX(${(0.5 - y) * 20}deg)`;
    for (const [k, v] of [
      ['--hx', x],
      ['--hy', y],
      ['--gx', x],
      ['--gy', y],
    ] as const)
      inner?.style.setProperty(k, `${v * 100}%`);
  });
  slot.addEventListener('pointerleave', () => {
    const tilt = slot.querySelector<HTMLElement>('.tilt');
    if (tilt) tilt.style.transform = '';
  });
}

export function playCry(c: Card): void {
  if (!c.cry) return;
  try {
    const audio = new Audio(c.cry);
    audio.volume = 0.3;
    void audio.play().catch(() => {});
  } catch {
    /* sin audio, sin drama */
  }
}
