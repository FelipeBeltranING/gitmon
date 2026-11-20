import type { Pack } from '../core/pack';
import { RARITY, type Rarity } from '../core/rarity';
import { TYPES, typeColor } from '../core/types';
import { bindTilt, captionHTML, cardHTML, playCry } from './card';
import { $, $$, esc, fmt, prefersReducedMotion, wait } from './dom';

type State = 'idle' | 'loading' | 'ready' | 'opening' | 'reveal' | 'done';

export interface AppOptions {
  season: string;
  /** Nombre visible de la edición, p. ej. «Primera edición». */
  edition: string;
  defaultLogin: string;
  build(login: string, onStep: (text: string) => void): Promise<Pack>;
  onDone?(pack: Pack): void;
}

const SOURCE_NOTE: Record<Pack['source'], string> = {
  api: 'Datos reales de GitHub (caché de 24 h)',
  directo: 'Datos reales de la API pública de GitHub',
  simulado: '⚠ GitHub limitó las consultas: perfil simulado',
};

export function startApp(opts: AppOptions): void {
  const stage = $('#stage');
  const panel = $('#panel');
  const hero = $('.hero');
  let state: State = 'idle';
  let pack: Pack | null = null;
  let index = 0;
  let flipped = false;
  let auto: number | null = null;

  $('#season-tag').textContent = opts.edition;
  setZigzag();

  // ---------- panel izquierdo ----------
  function panelIdle(login = opts.defaultLogin): void {
    panel.innerHTML = `<span class="k">${esc(opts.edition)} · Open Source</span>
      <h1>Tu código viene en <span>sobre</span>.</h1>
      <p class="lead">Escribe tu usuario de GitHub y abre tu sobre de 6 cartas: tu compañero, calculado con todo tu perfil, y un Pokémon por cada uno de tus 5 repos más activos.</p>
      <form class="form" id="scan"><span>github.com/</span><input id="user" value="${esc(login)}" spellcheck="false" autocomplete="off" aria-label="Usuario de GitHub" required><button id="go">Abrir mi sobre</button></form>
      <p class="hint">Solo datos públicos · sin iniciar sesión · el mismo usuario siempre trae el mismo sobre</p>`;
    $<HTMLFormElement>('#scan').addEventListener('submit', (e) => {
      e.preventDefault();
      void load($<HTMLInputElement>('#user').value);
    });
  }

  function panelReveal(p: Pack): void {
    panel.innerHTML = `<span class="k">Sobre de @${esc(p.login)}</span><h1>¡A ver qué <span>te salió</span>!</h1>
      <p class="lead" id="rlead">Toca la carta para voltearla. La más rara va al final.</p>
      <div class="progress"><div class="dots" aria-hidden="true">${p.order.map(() => '<i></i>').join('')}</div><button class="btn w" id="all">Voltear todas ›</button></div>`;
    $('#all').addEventListener('click', (e) => {
      e.stopPropagation();
      flipAll();
    });
  }

  function panelDone(p: Pack): void {
    const count: Partial<Record<Rarity, number>> = {};
    for (const c of p.order) count[c.rarity] = (count[c.rarity] ?? 0) + 1;
    const types = new Set(p.order.flatMap((c) => c.types));
    const tally = (Object.keys(RARITY) as Rarity[])
      .filter((k) => count[k])
      .reverse()
      .map((k) => `<div><small>${RARITY[k].name}</small>${RARITY[k].symbol} × ${count[k]}</div>`)
      .join('');
    panel.innerHTML = `<span class="k">Sobre de @${esc(p.login)}</span><h1>Tu compañero es <span>${esc(p.companion.name)}</span>.</h1>
      <p class="lead">${esc(p.companion.why)}. Mueve el cursor sobre la carta para ver el brillo.</p>
      <div class="tally">${tally}<div><small>Tipos</small>${types.size}/18</div><div><small>Poder del sobre</small>${fmt(p.power)}</div></div>
      <div class="acts"><button class="btn" id="tr">⇄ Intercambiar con un amigo</button><button class="btn w" id="share">Copiar enlace</button><button class="btn w" id="other">Otro entrenador</button></div>`;
    $('#tr').addEventListener('click', () => {
      const trade = $('#intercambio');
      trade.hidden = false;
      trade.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
      opts.onDone?.(p);
    });
    $('#share').addEventListener('click', (e) => {
      const url = `${location.origin}/u/${encodeURIComponent(p.login)}`;
      void navigator.clipboard?.writeText(url);
      (e.currentTarget as HTMLElement).textContent = '¡Enlace copiado!';
    });
    $('#other').addEventListener('click', () => {
      state = 'idle';
      stage.innerHTML = packHTML('???', opts.edition);
      stage.classList.remove('glow');
      panelIdle('');
      $<HTMLInputElement>('#user').focus();
    });
  }

  // ---------- sobre ----------
  async function load(raw: string): Promise<void> {
    const login = raw.trim().replace(/^@/, '');
    if (!login || state === 'loading') return;
    state = 'loading';
    stopAuto();
    stage.classList.remove('glow');
    stage.innerHTML = packHTML(login, opts.edition);
    $('#pack').classList.add('loading');
    $<HTMLButtonElement>('#go').disabled = true;
    hero.style.setProperty('--tc', '#7B4FC9');
    $('#coleccion').hidden = true;
    $('#intercambio').hidden = true;
    history.replaceState(null, '', `/u/${encodeURIComponent(login)}${location.search}`);
    const step = (t: string) => {
      const el = stage.querySelector('#stp');
      if (el) el.textContent = t;
    };
    try {
      pack = await opts.build(login, step);
    } catch (e) {
      state = 'idle';
      panelIdle(login);
      stage.innerHTML = packHTML(login, opts.edition);
      step(`😵 ${(e as Error).message}`);
      return;
    }
    $('#srcnote').textContent = `${SOURCE_NOTE[pack.source]} · Pokémon, arte, movimientos y textos de PokeAPI`;
    state = 'ready';
    const el = $('#pack');
    el.classList.remove('loading');
    el.classList.add('ready');
    step('¡Listo! Toca el sobre para rasgarlo');
    $<HTMLButtonElement>('#go').disabled = false;

    // La pila queda escondida detrás del sobre; la primera en revelarse queda arriba.
    const stack = document.createElement('div');
    stack.className = 'stack inside';
    stack.id = 'stack';
    [...pack.order].reverse().forEach((c, j) => {
      const k = pack!.order.length - 1 - j;
      const slot = document.createElement('div');
      slot.className = 'slot';
      slot.style.transform = `rotate(${(k % 2 ? 1 : -1) * k * 0.8}deg) translateY(${-k * 2}px)`;
      slot.innerHTML = cardHTML(c);
      stack.appendChild(slot);
    });
    stage.appendChild(stack);
  }

  async function openPack(): Promise<void> {
    if (!pack) return;
    state = 'opening';
    const el = $('#pack');
    const stack = $('#stack');
    el.classList.remove('ready');
    el.classList.add('torn');
    $('#stp').textContent = '';
    const fast = prefersReducedMotion();
    await wait(fast ? 0 : 550);
    stack.classList.replace('inside', 'rise');
    await wait(fast ? 0 : 950);
    el.classList.add('gone');
    stack.classList.remove('rise');
    await wait(fast ? 0 : 700);
    el.remove();
    state = 'reveal';
    index = 0;
    flipped = false;
    panelReveal(pack);
    $('#binder').innerHTML = pack.order.map(() => '<div class="cell"><div class="slot empty"></div></div>').join('');
    $('#count').textContent = `0/${pack.order.length}`;
    $('#coleccion').hidden = false;
  }

  function toast(text: string): void {
    stage.querySelector('.toast')?.remove();
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = text;
    stage.appendChild(t);
  }

  function stepReveal(): void {
    if (!pack) return;
    const stack = stage.querySelector<HTMLElement>('#stack');
    const top = stack?.lastElementChild as HTMLElement | null;
    if (!top) return;
    const card = pack.order[index];

    if (!flipped) {
      top.querySelector('.card')?.classList.add('up');
      flipped = true;
      bindTilt(top);
      toast(card.companion ? '¡TU COMPAÑERO!' : `${RARITY[card.rarity].symbol} ${RARITY[card.rarity].name.toUpperCase()}`);
      stage.classList.toggle('glow', RARITY[card.rarity].rank >= 3);
      if (card.companion || RARITY[card.rarity].rank >= 3) playCry(card);
      if (card.companion) hero.style.setProperty('--tc', typeColor(card.types[0]));
      const lead = panel.querySelector('#rlead');
      if (lead) lead.textContent = card.companion ? `Tu perfil completo: ${card.why}.` : `Del repo ${card.repo}: ${card.why}.`;
      return;
    }

    const cell = $('#binder').children[index] as HTMLElement;
    cell.innerHTML = `<div class="slot filled">${cardHTML(card, true)}</div>${captionHTML(card)}`;
    bindTilt(cell.firstElementChild as HTMLElement);
    index++;
    $('#count').textContent = `${index}/${pack.order.length}`;
    $$('.dots i', panel).forEach((d, i) => d.classList.toggle('on', i < index));
    stage.querySelector('.toast')?.remove();
    stage.classList.remove('glow');
    flipped = false;
    if (index >= pack.order.length) {
      top.remove();
      finish();
      return;
    }
    top.classList.add('fly');
    setTimeout(() => top.remove(), 450);
  }

  function flipAll(): void {
    if (auto !== null) return;
    auto = window.setInterval(() => {
      if (state !== 'reveal') return stopAuto();
      stepReveal();
    }, 650);
  }
  function stopAuto(): void {
    if (auto !== null) clearInterval(auto);
    auto = null;
  }

  function finish(): void {
    if (!pack) return;
    state = 'done';
    stopAuto();
    stage.innerHTML = `<div class="rays"></div><div class="slot" id="hero-card">${cardHTML(pack.companion, true)}</div>`;
    stage.classList.add('glow');
    bindTilt($('#hero-card'));
    panelDone(pack);
  }

  const activate = () => {
    if (state === 'ready') void openPack();
    else if (state === 'reveal' && auto === null) stepReveal();
    else if (state === 'idle') panel.querySelector<HTMLInputElement>('#user')?.focus();
  };
  stage.addEventListener('click', activate);
  stage.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      activate();
    }
  });

  // ---------- arranque ----------
  const fromPath = decodeURIComponent(location.pathname.match(/^\/u\/([^/]+)/)?.[1] ?? '');
  const fromQuery = new URLSearchParams(location.search).get('u') ?? '';
  const initial = fromPath || fromQuery;
  panelIdle(initial || opts.defaultLogin);
  stage.innerHTML = packHTML(initial || '???', opts.edition);
  if (initial) void load(initial);
}

function packHTML(login: string, edition: string): string {
  const dots = Object.values(TYPES)
    .map((t) => `<i style="--c:${t.color}"></i>`)
    .join('');
  return `<div class="rays"></div><div class="pack" id="pack"><div class="ptop"></div><div class="pmain">
    <div class="plogo">GITMON</div><div class="psub">${esc(edition.toUpperCase())} · OPEN SOURCE</div>
    <div class="pball"><i class="pb"></i></div><div class="ptypes">${dots}</div>
    <div class="pfoot"><span>6 CARTAS</span><span class="pu">@${esc(login)}</span></div><div class="pcrimp"></div></div></div>
    <div class="stage-step" id="stp" role="status"></div>`;
}

/** Bordes dentados del sobre. */
function setZigzag(teeth = 24): void {
  const top: string[] = [];
  const bottom: string[] = [];
  for (let i = 0; i <= teeth; i++) {
    const x = (i / teeth) * 100;
    top.push(`${x}% ${i % 2 ? 0 : 9}%`);
    bottom.push(`${100 - x}% ${i % 2 ? 100 : 97}%`);
  }
  const root = document.documentElement.style;
  root.setProperty('--zz-top', `polygon(${top.join(',')},100% 100%,0 100%)`);
  root.setProperty('--zz-bot', `polygon(0 0,100% 0,${bottom.join(',')})`);
}
