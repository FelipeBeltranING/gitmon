/**
 * Temporada activa. Cambiarla reparte sobres nuevos a todo el mundo:
 * el tipo sigue saliendo de tus lenguajes, pero cambia qué Pokémon de ese tipo te toca.
 * Ver docs/adr/0002-temporadas.md.
 */
export const SEASON = '1';

/** Amigos visibles antes del botón «+N más» (se piden como máximo 24). */
export const FRIENDS_VISIBLE = 8;

/** Permite previsualizar otra temporada con ?t=4 sin tocar el código. */
export function activeSeason(search = location.search): string {
  const t = new URLSearchParams(search).get('t');
  return t && /^\d{1,3}$/.test(t) ? t : SEASON;
}
