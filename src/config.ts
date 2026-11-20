/**
 * Semilla interna de la edición activa. Cambiarla reparte sobres nuevos a todo el mundo:
 * el tipo sigue saliendo de tus lenguajes, pero cambia qué Pokémon de ese tipo te toca.
 * La «5» salió de comparar 12 semillas con perfiles reales; al público se presenta como
 * la primera edición. Ver docs/adr/0002-temporadas.md.
 */
export const SEASON = '5';

/** Nombre público de la edición activa. */
export const EDITION = 'Primera edición';

/** Amigos visibles antes del botón «+N más» (se piden como máximo 24). */
export const FRIENDS_VISIBLE = 8;

/** Permite probar otra semilla con ?t=4 sin tocar el código. */
export function activeSeason(search = location.search): string {
  const t = new URLSearchParams(search).get('t');
  return t && /^\d{1,3}$/.test(t) ? t : SEASON;
}

/** Nombre visible: la edición oficial o una prueba de semilla. */
export const editionLabel = (season: string): string => (season === SEASON ? EDITION : `Prueba · semilla ${season}`);
