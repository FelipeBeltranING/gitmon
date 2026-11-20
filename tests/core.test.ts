import { describe, expect, it } from 'vitest';
import { buildPool, cosine, pickBest, sample, scoreCandidate, targetBaseTotal } from '../src/core/choose';
import { companionRarity, packPower, repoRarity } from '../src/core/rarity';
import { fnv1a, isShinySeed, mulberry32, seedOf } from '../src/core/rng';
import { mostActive, profileSignals, repoVector, stat, type GhRepo } from '../src/core/stats';
import { typeColor, typeName, typeOfLanguage } from '../src/core/types';

const NOW = Date.parse('2026-11-20T12:00:00Z');

const repo = (over: Partial<GhRepo> = {}): GhRepo => ({
  name: 'repo',
  language: 'TypeScript',
  stargazers_count: 0,
  forks_count: 0,
  open_issues_count: 0,
  size: 100,
  fork: false,
  description: null,
  created_at: '2025-01-01T00:00:00Z',
  pushed_at: '2026-11-01T00:00:00Z',
  ...over,
});

describe('rng', () => {
  it('fnv1a es estable y no distingue mayúsculas', () => {
    expect(fnv1a('FelipeBeltranING')).toBe(fnv1a('felipebeltraning'));
    expect(fnv1a('a')).not.toBe(fnv1a('b'));
  });

  it('mulberry32 repite la misma secuencia con la misma semilla', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const seqA = [a(), a(), a()];
    expect(seqA).toEqual([b(), b(), b()]);
    for (const x of seqA) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
  });

  it('la temporada 1 no lleva sal y las demás sí', () => {
    expect(seedOf('1', 'ash')).toBe(fnv1a('ash'));
    expect(seedOf('5', 'ash')).toBe(fnv1a('T5:ash'));
    expect(seedOf('5', 'ash')).not.toBe(seedOf('4', 'ash'));
  });

  it('variocolor es 1 de cada 4096', () => {
    expect(isShinySeed(4096 * 3)).toBe(true);
    expect(isShinySeed(4097)).toBe(false);
  });
});

describe('stats', () => {
  it('stat va de 10 a 160 y crece con x', () => {
    expect(stat(0, 100)).toBe(10);
    expect(stat(100, 100)).toBe(160);
    expect(stat(10_000, 100)).toBe(160);
    expect(stat(50, 100)).toBeGreaterThan(stat(5, 100));
  });

  it('lenguaje principal → tipo principal; madrugada → Siniestro', () => {
    const profile = { login: 'x', avatar_url: '', created_at: '2020-01-01T00:00:00Z', followers: 10 };
    const repos = [repo({ language: 'Java', size: 9000 }), repo({ language: 'Python' })];
    const nightEvent = { type: 'PushEvent', created_at: new Date(2026, 10, 1, 2, 30).toISOString(), payload: { size: 3 } };
    const s = profileSignals(profile, repos, [nightEvent], NOW, mulberry32(1));
    expect(s.languages[0]).toBe('Java');
    expect(s.primary).toBe('fire');
    expect(s.secondary).toBe('dark');
    expect(s.vector).toHaveLength(6);
    expect(s.total).toBe(s.vector.reduce((a, b) => a + b, 0));
  });


  it('ignora forks si hay repos propios', () => {
    const profile = { login: 'x', avatar_url: '', created_at: '2020-01-01T00:00:00Z', followers: 0 };
    const s = profileSignals(profile, [repo({ language: 'Go' }), repo({ language: 'Rust', fork: true, size: 99999 })], [], NOW, mulberry32(1));
    expect(s.primary).toBe('water');
    expect(s.repos).toHaveLength(1);
  });

  it('repoVector premia estrellas y actividad reciente', () => {
    const quiet = repoVector(repo({ pushed_at: '2024-01-01T00:00:00Z' }), NOW);
    const famous = repoVector(repo({ stargazers_count: 2000 }), NOW);
    expect(famous[3]).toBe(160);
    expect(quiet[5]).toBe(10);
  });

  it('mostActive ordena por estrellas, forks y actividad', () => {
    const list = mostActive([repo({ name: 'a' }), repo({ name: 'b', stargazers_count: 50 }), repo({ name: 'c', forks_count: 10 })], NOW, 2);
    expect(list.map((r) => r.name)).toEqual(['b', 'c']);
  });
});

describe('tipos', () => {
  it('traduce lenguajes y nombres', () => {
    expect(typeOfLanguage('JavaScript')).toBe('electric');
    expect(typeOfLanguage('Brainfuck')).toBe('normal');
    expect(typeOfLanguage(null)).toBe('normal');
    expect(typeName('ghost')).toBe('Fantasma');
    expect(typeColor('nope')).toBe('#bbbbbb');
  });
});

describe('elección', () => {
  it('coseno de vectores iguales es 1', () => {
    expect(cosine([1, 2, 3], [2, 4, 6])).toBeCloseTo(1);
  });

  it('el objetivo va de 200 a 720', () => {
    expect(targetBaseTotal(60)).toBe(200);
    expect(targetBaseTotal(960)).toBe(720);
  });

  it('prefiere el candidato de tamaño parecido y con el segundo tipo', () => {
    const vector = [30, 30, 30, 30, 30, 30] as [number, number, number, number, number, number];
    const small = { id: 1, types: ['fire'], base: [50, 50, 50, 50, 50, 50] };
    const huge = { id: 2, types: ['fire'], base: [120, 120, 120, 120, 120, 120] };
    expect(pickBest([small, huge], vector, 180, null)?.id).toBe(1);
    const dual = { id: 3, types: ['fire', 'poison'], base: [52, 52, 52, 52, 52, 52] };
    expect(scoreCandidate(dual, vector, 180, 'poison')).toBeGreaterThan(scoreCandidate(small, vector, 180, 'poison'));
  });

  it('la bolsa no repite Pokémon ya usados y pesa doble tipo', () => {
    const pool = buildPool([1, 2, 3, 4], [3, 4, 9], new Set([1]));
    expect(pool).not.toContain(1);
    expect(pool.filter((id) => id === 3)).toHaveLength(3);
  });

  it('si todo está usado, vuelve a la bolsa completa', () => {
    expect(buildPool([1, 2], null, new Set([1, 2]))).toEqual([1, 2]);
  });

  it('sample devuelve ids distintos y deterministas', () => {
    const a = sample([1, 2, 3, 4, 5, 6], 4, mulberry32(7));
    expect(new Set(a).size).toBe(4);
    expect(a).toEqual(sample([1, 2, 3, 4, 5, 6], 4, mulberry32(7)));
  });
});

describe('rareza', () => {
  it('umbrales de las cartas de repo', () => {
    expect(repoRarity(200, false, false)).toBe('comun');
    expect(repoRarity(300, false, false)).toBe('poco');
    expect(repoRarity(400, false, false)).toBe('rara');
    expect(repoRarity(600, false, false)).toBe('holo');
    expect(repoRarity(100, true, false)).toBe('leyenda');
    expect(repoRarity(100, true, true)).toBe('vario');
  });

  it('el compañero es al menos holo', () => {
    expect(companionRarity(80, false, false)).toBe('holo');
  });

  it('poder del sobre = stats + bono por rareza', () => {
    expect(packPower([{ total: 100, rarity: 'comun' }, { total: 100, rarity: 'holo' }])).toBe(380);
  });
});
