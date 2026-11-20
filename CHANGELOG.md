# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/); versiones con [SemVer](https://semver.org/lang/es/).

## [0.3.0] · 2026-11-20 · Compartir

### Añadido
- `/api/card?user=<login>`: tu compañero como carta SVG para el README, con arte incrustado, brillo holo animado y caché de 24 h (#15).
- Botón «Tarjeta para tu README» que copia el Markdown.
- `/api/og?user=<login>`: imagen para redes en PNG 1200×630 con tu compañero y su carta (#16).
- `/u/<login>` sirve título e imagen de ese entrenador para las vistas previas de WhatsApp, X o Discord.

### Cambiado
- Imports con extensión `.js` para que las funciones de Vercel usen el mismo núcleo que la app.
- `buildCompanion` calcula solo el compañero, con muchas menos peticiones.

## [0.2.1] · 2026-11-20 · Pulido del lanzamiento

### Cambiado
- La interfaz dice «Primera edición» en vez de «Temporada 5». La semilla interna no cambia: nadie pierde su sobre (#40).
- `?t=<n>` se presenta como «Prueba · semilla n».

### Añadido
- URL de producción en el README y `og:url` (#41).

### Mantenimiento
- `actions/checkout` y `actions/setup-node` a la v7 (dependabot).

## [0.2.0] · 2026-11-20 · Sobre jugable

### Añadido
- Sobre de 6 cartas: compañero en holo + un Pokémon por cada uno de tus 5 repos más activos.
- Carta coleccionable con brillo holográfico, rarezas (común → variocolor), etapa evolutiva real y movimiento real en español.
- Apertura animada: rasgar el sobre, voltear una a una o todas, grito del Pokémon en las cartas raras.
- Colección con resumen: rarezas, tipos cubiertos y poder del sobre.
- Intercambio: amigos de GitHub con un clic (8 visibles, «+N más» hasta 24), duelo de poder y propuesta de cambio.
- Temporadas con semilla global; se lanza con la temporada 5.
- Función `/api/github` con token opcional y caché de 24 h; respaldo directo a la API pública y perfil simulado si GitHub limita.
- Enlaces compartibles `/u/<usuario>`.
- Pruebas del núcleo con Vitest y CI en GitHub Actions.

### Cambiado
- La hora pico cuenta días distintos y «búho nocturno» exige 3 noches distintas (ADR 0003).

## [0.1.0] · 2026-11-19 · Concepto

### Añadido
- Concepto v0: idea, algoritmo y fuentes de datos.
- Bocetos v0 (hierba alta nocturna) y v1 (Pokédex, Combate, Carta holo, híbrido y sobre).
- ADR 0001: dirección visual de carta coleccionable.

[0.3.0]: https://github.com/FelipeBeltranING/gitmon/compare/v0.2.1...v0.3.0
[0.2.1]: https://github.com/FelipeBeltranING/gitmon/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/FelipeBeltranING/gitmon/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/FelipeBeltranING/gitmon/releases/tag/v0.1.0
