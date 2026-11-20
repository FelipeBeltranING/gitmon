/** Hash FNV-1a de 32 bits (sin distinguir mayúsculas): el mismo texto da siempre el mismo número. */
export function fnv1a(text: string): number {
  let h = 2166136261;
  for (const ch of text.toLowerCase()) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Generador pseudoaleatorio mulberry32: determinista a partir de una semilla. */
export function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Semilla de una clave dentro de una temporada.
 * La temporada 1 usa la clave sin sal para conservar los sobres originales.
 */
export function seedOf(season: string, key: string): number {
  return fnv1a(season === '1' ? key : `T${season}:${key}`);
}

/** 1 de cada 4096 semillas es variocolor. */
export const isShinySeed = (seed: number): boolean => seed % 4096 === 0;
