import type { StatVector } from './stats';

/** Lo mínimo que necesitamos de un Pokémon para compararlo. */
export interface Candidate {
  id: number;
  types: string[];
  base: number[];
}

/** Total base al que debería acercarse el Pokémon: 60–960 de stats → 200–720 de total base. */
export const targetBaseTotal = (statTotal: number): number => 200 + ((statTotal - 60) / 900) * 520;

export function cosine(a: readonly number[], b: readonly number[]): number {
  const dot = a.reduce((s, x, i) => s + x * (b[i] ?? 0), 0);
  const norm = Math.hypot(...a) * Math.hypot(...b);
  return norm ? dot / norm : 0;
}

/**
 * Puntaje de un candidato: se parece en forma (coseno), se castiga si es mucho más
 * fuerte o débil que tu etapa, y suma un bono si comparte tu segundo tipo.
 */
export function scoreCandidate(c: Candidate, vector: StatVector, statTotal: number, secondary: string | null): number {
  const bst = c.base.reduce((a, b) => a + b, 0);
  const bonus = secondary && c.types.includes(secondary) ? 0.12 : 0;
  return cosine(c.base, vector) - Math.abs(bst - targetBaseTotal(statTotal)) / 380 + bonus;
}

export function pickBest<T extends Candidate>(
  candidates: T[],
  vector: StatVector,
  statTotal: number,
  secondary: string | null,
): T | undefined {
  let best: T | undefined;
  let bestScore = -Infinity;
  for (const c of candidates) {
    const s = scoreCandidate(c, vector, statTotal, secondary);
    if (s > bestScore) {
      bestScore = s;
      best = c;
    }
  }
  return best;
}

/**
 * Bolsa de ids para sortear: los del tipo principal sin repetir los ya usados.
 * Si hay al menos 2 con los dos tipos, pesan el triple.
 */
export function buildPool(primaryIds: number[], secondaryIds: number[] | null, used: ReadonlySet<number>): number[] {
  let pool = primaryIds.filter((id) => !used.has(id));
  if (!pool.length) pool = [...primaryIds];
  if (secondaryIds) {
    const second = new Set(secondaryIds);
    const both = pool.filter((id) => second.has(id));
    if (both.length >= 2) pool = [...both, ...both, ...pool];
  }
  return pool;
}

/** Sortea hasta `n` ids distintos de la bolsa con el generador dado. */
export function sample(pool: number[], n: number, random: () => number): number[] {
  const picked = new Set<number>();
  const distinct = new Set(pool).size;
  let guard = 0;
  while (picked.size < Math.min(n, distinct) && guard++ < 400) picked.add(pool[Math.floor(random() * pool.length)]);
  return [...picked];
}
