# 0002 · Temporadas: semilla global

- **Estado**: aceptada
- **Fecha**: 2026-11-19

## Contexto

El sobre es determinista: el mismo usuario siempre abre el mismo sobre. Bien para la identidad, pero sin forma de renovar la colección y con un resultado fijo aunque no guste.

## Decisión

Añadir una **temporada** que sala todas las semillas: `FNV-1a("T<n>:" + clave)`. La temporada 1 queda sin sal para conservar los sobres originales.

- El **tipo** sigue saliendo de los lenguajes: la temporada no cambia quién eres, solo qué Pokémon de tu tipo te toca.
- El **poder del sobre** no depende de la temporada, así que el intercambio sigue siendo justo.
- Se lanza con la **temporada 5** (`src/config.ts`), elegida tras comparar 12 temporadas con perfiles reales ([captura](../bocetos/v1/capturas/temporadas.jpg)).
- `?t=<n>` previsualiza otra temporada sin desplegar.

## Consecuencias

- Cambiar de temporada reparte sobres nuevos a todos a la vez: se anuncia con un release.
- Las pruebas fijan el comportamiento: misma temporada → mismo sobre; distinta temporada → mismo poder.
