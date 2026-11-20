export type Rarity = 'comun' | 'poco' | 'rara' | 'holo' | 'leyenda' | 'vario';

export const RARITY: Readonly<Record<Rarity, { symbol: string; name: string; rank: number }>> = {
  comun: { symbol: '●', name: 'Común', rank: 0 },
  poco: { symbol: '◆', name: 'Poco común', rank: 1 },
  rara: { symbol: '★', name: 'Rara', rank: 2 },
  holo: { symbol: '★', name: 'Holo rara', rank: 3 },
  leyenda: { symbol: '✦', name: 'Legendaria', rank: 4 },
  vario: { symbol: '✧', name: 'Variocolor', rank: 5 },
};

/** Rareza de una carta de repo según el total de sus stats. */
export function repoRarity(statTotal: number, legendary: boolean, shiny: boolean): Rarity {
  if (shiny) return 'vario';
  if (legendary || statTotal >= 690) return 'leyenda';
  if (statTotal >= 520) return 'holo';
  if (statTotal >= 380) return 'rara';
  if (statTotal >= 280) return 'poco';
  return 'comun';
}

/** El compañero siempre es, como mínimo, holo rara. */
export function companionRarity(statTotal: number, legendary: boolean, shiny: boolean): Rarity {
  if (shiny) return 'vario';
  if (legendary || statTotal >= 690) return 'leyenda';
  return 'holo';
}

/** Poder del sobre: suma de stats más un bono por rareza. Solo depende de GitHub, no de la temporada. */
export function packPower(cards: ReadonlyArray<{ total: number; rarity: Rarity }>): number {
  return cards.reduce((sum, c) => sum + c.total + RARITY[c.rarity].rank * 60, 0);
}
