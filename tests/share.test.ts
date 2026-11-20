import { describe, expect, it } from 'vitest';
import { injectTags, shareTags } from '../api/u';
import type { Card } from '../src/core/pack';
import { ogDefaultSvg, ogSvg, shade } from '../src/share/og-svg';

const card = {
  id: 607,
  name: 'Litwick',
  genus: 'Pokémon Vela',
  flavor: 'Texto.',
  types: ['ghost', 'fire'],
  height: 0.3,
  weight: 3.1,
  legendary: false,
  stage: 'Básico',
  art: '',
  retreat: 1,
  companion: true,
  login: 'FelipeBeltranING',
  repo: null,
  hp: 29,
  total: 300,
  rarity: 'holo',
  shiny: false,
  attacks: [],
  why: '',
} satisfies Card;

describe('imagen para redes', () => {
  it('shade oscurece hacia la tinta', () => {
    expect(shade('#ffffff', 1)).toBe('#ffffff');
    expect(shade('#ffffff', 0)).toBe('#1d1d2b');
  });

  it('lleva usuario, nombre, tipos y la carta anidada sin animación', () => {
    const svg = ogSvg(card, { art: null, site: 'gitmon.test', edition: 'Primera edición' });
    expect(svg).toContain('width="1200" height="630"');
    expect(svg).toContain('@FelipeBeltranING');
    expect(svg).toContain('Litwick.');
    expect(svg).toContain('Fantasma');
    expect(svg).toContain('Primera edición');
    expect(svg).not.toContain('animateTransform');
  });

  it('la portada genérica tiene el lema', () => {
    expect(ogDefaultSvg({ site: 's', edition: 'Primera edición' })).toContain('en sobre.');
  });
});

describe('metadatos de /u/<usuario>', () => {
  const base = `<!doctype html><html><head>
    <meta charset="utf-8" />
    <title>Gitmon · Tu código viene en sobre</title>
    <meta name="description" content="portada" />
    <meta property="og:title" content="portada" />
    <meta property="og:image" content="https://x/api/og" />
  </head><body></body></html>`;

  it('cambia título e imagen por los del entrenador', () => {
    const html = injectTags(base, shareTags('https://gitmon.test', 'octocat'));
    expect(html).toContain('<title>El sobre de @octocat · Gitmon</title>');
    expect(html).toContain('content="https://gitmon.test/api/og?user=octocat"');
    expect(html).toContain('summary_large_image');
    expect(html).not.toContain('content="portada"');
    expect(html.match(/<title>/g)).toHaveLength(1);
    expect(html).toContain('<meta charset="utf-8" />');
  });
});
