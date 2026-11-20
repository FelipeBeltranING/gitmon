import { describe, expect, it } from 'vitest';
import type { Candidate } from '../src/core/choose';
import { buildPack, tradeProposal, type GithubData, type MonInfo, type PackDeps } from '../src/core/pack';
import type { GhRepo } from '../src/core/stats';
import type { TypeName } from '../src/core/types';

const NOW = Date.parse('2026-11-20T12:00:00Z');

/** Pokédex de juguete: 6 Pokémon por tipo con ids 100·tipo + n. */
const TYPES: TypeName[] = ['fire', 'poison', 'electric', 'psychic', 'normal', 'dark'];
const fakeMon = (id: number): Candidate => {
  const t = TYPES[Math.floor(id / 100) - 1] ?? 'normal';
  const size = 30 + (id % 100) * 12;
  return { id, types: [t], base: [size, size + 5, size, size - 5, size, size + 10] };
};

function deps(gh: GithubData, overrides: Partial<PackDeps> = {}): PackDeps {
  return {
    github: async () => gh,
    typeIds: async (t) => Array.from({ length: 6 }, (_, n) => (TYPES.indexOf(t) + 1) * 100 + n + 1),
    pokemon: async (id) => fakeMon(id),
    info: async (p): Promise<MonInfo> => ({
      id: p.id,
      name: `Mon${p.id}`,
      genus: 'Pokémon Prueba',
      flavor: 'Texto de prueba.',
      types: p.types,
      height: 1,
      weight: 10,
      legendary: false,
      stage: 'Básico',
      art: '',
      retreat: 1,
    }),
    move: async () => ({ name: 'Placaje', desc: '', power: 40, type: 'normal' }),
    now: () => NOW,
    ...overrides,
  };
}

const repo = (name: string, language: string, stars = 0): GhRepo => ({
  name,
  language,
  stargazers_count: stars,
  forks_count: 0,
  open_issues_count: 0,
  size: 500,
  fork: false,
  description: null,
  created_at: '2025-01-01T00:00:00Z',
  pushed_at: '2026-11-10T00:00:00Z',
});

const github = (login: string, repos: GhRepo[]): GithubData => ({
  source: 'directo',
  profile: { login, avatar_url: 'a.png', created_at: '2022-01-01T00:00:00Z', followers: 12 },
  repos,
  events: [{ type: 'PushEvent', created_at: '2026-11-19T15:00:00Z', payload: { size: 2 } }],
  following: [{ login: 'amigo', avatar_url: 'b.png' }],
});

const felipe = github('felipe', [
  repo('juego', 'Java', 20),
  repo('ml', 'Python', 2),
  repo('web', 'JavaScript'),
  repo('cli', 'TypeScript'),
  repo('notas', 'HTML'),
  repo('extra', 'JavaScript'),
]);

describe('buildPack', () => {
  it('arma 6 cartas sin repetir Pokémon y con el compañero al final', async () => {
    const pack = await buildPack('felipe', '5', deps(felipe));
    expect(pack.order).toHaveLength(6);
    expect(pack.order.at(-1)).toBe(pack.companion);
    expect(pack.companion.companion).toBe(true);
    expect(new Set(pack.order.map((c) => c.id)).size).toBe(6);
    expect(pack.following).toEqual([{ login: 'amigo', avatar_url: 'b.png' }]);
  });

  it('el compañero es de tipo Fuego (Java) y sus ataques son los repos con más estrellas', async () => {
    const pack = await buildPack('felipe', '5', deps(felipe));
    expect(pack.companion.types[0]).toBe('fire');
    expect(pack.companion.attacks.map((a) => a.name)).toEqual(['juego', 'ml']);
  });

  it('las cartas de repo van de menor a mayor rareza', async () => {
    const pack = await buildPack('felipe', '5', deps(felipe));
    const ranks = pack.order.slice(0, -1).map((c) => ['comun', 'poco', 'rara', 'holo', 'leyenda', 'vario'].indexOf(c.rarity));
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
  });

  it('es determinista y la temporada cambia el sobre pero no el poder', async () => {
    const a = await buildPack('felipe', '5', deps(felipe));
    const b = await buildPack('felipe', '5', deps(felipe));
    const c = await buildPack('felipe', '4', deps(felipe));
    expect(a.order.map((x) => x.id)).toEqual(b.order.map((x) => x.id));
    expect(c.power).toBe(a.power);
  });

  it('avisa del progreso', async () => {
    const steps: string[] = [];
    await buildPack('felipe', '5', deps(felipe), (s) => steps.push(s));
    expect(steps[0]).toMatch(/entrenador/);
    expect(steps).toContain('Imprimiendo carta 1 · tu compañero');
    expect(steps.filter((s) => s.startsWith('Imprimiendo carta'))).toHaveLength(6);
  });

  it('funciona con un entrenador sin repos', async () => {
    const pack = await buildPack('nuevo', '5', deps(github('nuevo', [])));
    expect(pack.order).toHaveLength(1);
    expect(pack.companion.types[0]).toBe('normal');
  });

  it('falla con un mensaje claro si la PokeAPI no responde', async () => {
    const broken = deps(felipe, { pokemon: async () => Promise.reject(new Error('down')) });
    await expect(buildPack('felipe', '5', broken)).rejects.toThrow(/PokeAPI/);
  });
});

describe('tradeProposal', () => {
  it('nunca ofrece al compañero si hay otras cartas', async () => {
    const mine = await buildPack('felipe', '5', deps(felipe));
    const theirs = await buildPack('otra', '5', deps(github('otra', [repo('x', 'Go', 900), repo('y', 'Rust', 40)])));
    const { give, get } = tradeProposal(mine, theirs);
    expect(give.companion).toBe(false);
    expect(get.companion).toBe(false);
  });
});
