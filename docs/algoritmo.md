# Algoritmo del sobre (v0.2)

Todo vive en `src/core/` y no toca la red: los datos llegan inyectados, así que cada paso tiene pruebas.

## 1. Señales del perfil (`stats.ts`)

Se ignoran los forks si hay repos propios.

| Stat | Señal | Máximo |
|---|---|---|
| PS | repos × años de cuenta | 600 |
| Ataque | commits/año estimados con los eventos públicos recientes | 3000 |
| Defensa | forks recibidos | 250 |
| At. Esp. | estrellas | 1500 |
| Def. Esp. | seguidores | 600 |
| Velocidad | días activos en los eventos recientes | 90 |

```
stat = 10 + 150 · (ln(1 + x) / ln(1 + máx))^2.4      → de 10 a 160
```

**Tipo principal**: el lenguaje con más peso (`1 + √tamaño/12 + 0,4·estrellas` por repo).
**Segundo tipo**: el del segundo lenguaje, salvo que seas búho nocturno → Siniestro.

**Búho nocturno**: la hora pico se calcula contando **días distintos** con actividad en cada hora, no eventos; y hace falta actividad entre las 22:00 y las 05:00 en al menos **3 días distintos**. Ver [ADR 0003](adr/0003-ritmo-por-dias.md).

## 2. Elección del Pokémon (`choose.ts`)

1. Bolsa: ids del Pokédex nacional (≤ 1025) de tu tipo principal, sin los ya usados en el sobre. Si hay al menos 2 con tus dos tipos, cuentan el triple.
2. Sorteo de 10 candidatos (8 para cartas de repo) con `mulberry32(semilla)`.
3. Puntaje de cada candidato:

```
puntaje = coseno(stats base, tus stats) − |total base − objetivo| / 380 + 0,12 si comparte tu segundo tipo
objetivo = 200 + (tu total − 60) / 900 · 520
```

Gana el de mayor puntaje.

## 3. Semillas y temporadas (`rng.ts`)

```
semilla(clave) = FNV-1a(clave)                 en la temporada 1
semilla(clave) = FNV-1a("T<temporada>:" + clave) en las demás
```

La semilla activa es `5` y se presenta como **Primera edición**. La clave del compañero es el usuario; la de cada repo, `usuario/repo`. Variocolor si `semilla mod 4096 = 0`.

## 4. Cartas (`pack.ts`, `rarity.ts`)

- **Compañero**: perfil completo; ataques = tus 2 repos con más estrellas. Rareza mínima: holo.
- **Repos**: los 5 más activos (`3·estrellas + 2·forks + actividad de los últimos 60 días + √tamaño/20`). Cada uno tiene su propio vector:

| Stat | Señal del repo | Máximo |
|---|---|---|
| PS | tamaño (KB) | 100 000 |
| Ataque | días entre creación y último push | 1500 |
| Defensa | forks | 200 |
| At. Esp. | estrellas | 2000 |
| Def. Esp. | cuidado: issues, topics, descripción, web | 100 |
| Velocidad | qué tan reciente fue el último push | 365 |

- **Rareza de repo** por total: < 280 común · < 380 poco común · < 520 rara · < 690 holo · ≥ 690 o legendario → legendaria.
- **Ataques**: el repo (daño `30 + 6·√estrellas`, máx. 150) y un movimiento real que el Pokémon aprende por nivel.
- **Etapa**: la real, según la cadena evolutiva de la especie.
- **Poder del sobre**: suma de totales + 60 por cada punto de rareza. No depende de la temporada.

## Límites conocidos

- Los commits y la racha salen de los últimos 100 eventos públicos. La versión con GraphQL (#19) usará las contribuciones reales.
- Se comparan 10 candidatos, no todo el tipo. Un índice precalculado de stats base (#18) permitiría compararlos todos.
