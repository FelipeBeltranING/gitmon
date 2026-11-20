import { FRIENDS_VISIBLE } from '../config.js';
import { tradeProposal, type Friend, type Pack } from '../core/pack.js';
import { RARITY } from '../core/rarity.js';
import { bindTilt, captionHTML, cardHTML } from './card.js';
import { $, $$, esc, fmt } from './dom.js';

export interface TradeOptions {
  build(login: string): Promise<Pack>;
}

export function createTrade(opts: TradeOptions): { show(pack: Pack): void } {
  let mine: Pack | null = null;
  const box = $('#friends');
  const form = $<HTMLFormElement>('#tform');
  const input = $<HTMLInputElement>('#friend');
  const out = $('#tres');

  function drawFriends(list: Friend[], all = false): void {
    if (!list.length) {
      box.innerHTML = '<span>Escribe el usuario de un amigo:</span>';
      return;
    }
    const shown = all ? list : list.slice(0, FRIENDS_VISIBLE);
    const more = !all && list.length > FRIENDS_VISIBLE ? `<button type="button" class="more-f">+${list.length - FRIENDS_VISIBLE} más</button>` : '';
    box.innerHTML =
      '<span>Tus amigos en GitHub:</span>' +
      shown
        .map((u) => `<button type="button" data-u="${esc(u.login)}"><img src="${esc(u.avatar_url)}&s=60" alt="" loading="lazy">@${esc(u.login)}</button>`)
        .join('') +
      more;
    $$<HTMLButtonElement>('button[data-u]', box).forEach((b) =>
      b.addEventListener('click', () => {
        input.value = b.dataset.u ?? '';
        form.requestSubmit();
      }),
    );
    box.querySelector('.more-f')?.addEventListener('click', () => drawFriends(list, true));
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const login = input.value.trim().replace(/^@/, '');
    if (!login || !mine) return;
    if (login.toLowerCase() === mine.login.toLowerCase()) {
      out.innerHTML = '<p class="deal">Intercambiar contigo mismo no cuenta. ¡Prueba con un amigo!</p>';
      return;
    }
    out.innerHTML = `<p class="deal">Abriendo el sobre de @${esc(login)}…</p>`;
    let theirs: Pack;
    try {
      theirs = await opts.build(login);
    } catch (err) {
      out.innerHTML = `<p class="deal">😵 ${esc((err as Error).message)}</p>`;
      return;
    }
    const win = mine.power >= theirs.power;
    const { give, get } = tradeProposal(mine, theirs);
    out.innerHTML = `<div class="vs">
        <div class="side ${win ? 'win' : ''}"><img src="${esc(mine.avatar)}" alt=""><div><b>@${esc(mine.login)}</b><small>Poder del sobre ${fmt(mine.power)}</small></div></div>
        <div class="mid">VS</div>
        <div class="side ${win ? '' : 'win'}"><img src="${esc(theirs.avatar)}" alt=""><div><b>@${esc(theirs.login)}</b><small>Poder del sobre ${fmt(theirs.power)}</small></div></div>
      </div>
      <p class="deal">${win ? '¡Tu sobre gana!' : `El sobre de @${esc(theirs.login)} gana esta vez.`} Propuesta de intercambio: tu ${esc(give.name)} (${RARITY[give.rarity].name.toLowerCase()}) por su ${esc(get.name)} (${RARITY[get.rarity].name.toLowerCase()}). ▼</p>
      <div class="binder" id="fb">${theirs.order.map((c) => `<div class="cell"><div class="slot">${cardHTML(c)}</div>${captionHTML(c)}</div>`).join('')}</div>`;
    $$('#fb .slot', out).forEach((slot, i) => {
      bindTilt(slot);
      setTimeout(() => slot.querySelector('.card')?.classList.add('up'), 250 + i * 220);
    });
  });

  return {
    show(pack: Pack) {
      if (mine?.login === pack.login) return;
      mine = pack;
      out.innerHTML = '';
      drawFriends(pack.following);
      setTimeout(() => input.focus({ preventScroll: true }), 600);
    },
  };
}
