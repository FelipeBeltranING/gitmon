import { describe, expect, it } from 'vitest';
import type { Card } from '../src/core/pack';
import { cardSvg, errorSvg, tint, wrap, xml } from '../src/share/card-svg';

const card: Card = {
  id: 607,
  name: 'Litwick',
  genus: 'Pokémon Vela',
  flavor: 'Cuanto más joven sea la energía vital que ha absorbido, mayor tamaño tendrá la llama de la cabeza.',
  types: ['ghost', 'fire'],
  height: 0.3,
  weight: 3.1,
  legendary: false,
  stage: 'Básico',
  art: 'https://example.com/607.png',
  retreat: 1,
  weak: 'ghost',
  resist: 'normal',
  companion: true,
  login: 'octo<cat>',
  repo: null,
  hp: 29,
  total: 300,
  rarity: 'holo',
  shiny: false,
  attacks: [
    { name: 'gitfarm', desc: 'Turn your GitHub contribution graph into a farm', power: 45, type: 'electric' },
    { name: 'metamorfosis', desc: 'App web y móvil', power: 38, type: 'fire' },
  ],
  why: '',
};

describe('carta SVG', () => {
  it('escapa el texto para XML', () => {
    expect(xml(`<a & "b">`)).toBe('&lt;a &amp; &quot;b&quot;&gt;');
  });

  it('wrap corta por palabras y marca lo que sobra', () => {
    expect(wrap('uno dos tres cuatro', 8, 5)).toEqual(['uno dos', 'tres', 'cuatro']);
    const cut = wrap('uno dos tres cuatro cinco', 8, 2);
    expect(cut).toHaveLength(2);
    expect(cut[1].endsWith('…')).toBe(true);
  });

  it('tint aclara hacia el blanco', () => {
    expect(tint('#000000', 0)).toBe('#ffffff');
    expect(tint('#336699', 1)).toBe('#336699');
  });

  it('pinta nombre, PS, ataques y el arte incrustado', () => {
    const svg = cardSvg(card, { art: 'data:image/png;base64,AAAA', site: 'gitmon.test' });
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).toContain('Litwick');
    expect(svg).toContain('>29</text>');
    expect(svg).toContain('gitfarm');
    expect(svg).toContain('href="data:image/png;base64,AAAA"');
    expect(svg).toContain('COMPAÑERO');
    expect(svg).toContain('octo&lt;cat&gt;');
    expect(svg).not.toContain('octo<cat>');
  });

  it('solo las cartas holo llevan brillo animado', () => {
    expect(cardSvg(card, { art: null, site: 's' })).toContain('animateTransform');
    expect(cardSvg({ ...card, rarity: 'comun' }, { art: null, site: 's' })).not.toContain('animateTransform');
  });

  it('la carta de error lleva el mensaje', () => {
    expect(errorSvg('No encontramos a @x', 's')).toContain('No encontramos a @x');
  });
});
