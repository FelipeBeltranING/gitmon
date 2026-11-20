# Gitmon — concepto v0 (19 nov 2026)

## Idea
Landing donde escribes tu usuario de GitHub y obtienes:
- **Tu compañero**: un Pokémon calculado con todo tu perfil.
- **Tu equipo de 6**: cada uno de tus 6 repos más activos se vuelve un Pokémon.
Un toggle cambia entre los dos sin volver a escanear.

## Dirección visual
"Hierba alta nocturna": la gráfica de contribuciones de GitHub ES la hierba alta. Fondo verde casi negro, verdes de contribución, amarillo para el encuentro (!). Fuentes: Pixelify Sans (títulos), Space Grotesk (texto), Silkscreen (etiquetas), JetBrains Mono (código).

Paleta: fondo #0B1210 · superficie #111C17 · borde #22362B · texto #E8F0EA · texto secundario #A9BDB1 · hierba #18271F / #1F5133 / #2E7D46 / #45A85B / #6FDB7A · encuentro #FFD23F.

## Algoritmo v0
1. **Tipo**: primario = lenguaje con más bytes (sin forks); secundario = segundo lenguaje, o Siniestro si la hora pico está entre 22:00 y 05:00.
   JS→Eléctrico · TS→Psíquico · Python→Veneno · Java→Fuego · C/C++→Lucha · Rust→Acero · Go→Agua · Swift→Volador · Kotlin→Planta · Ruby→Hada · PHP→Fantasma · GDScript→Dragón · Shell→Tierra · Lua→Hielo · HTML/CSS→Normal
2. **Stats**: stat = 10 + 150·(ln(1+x)/ln(1+máx))^2.4
   PS = repos×años (máx 600) · Ataque = commits/año (3000) · Defensa = PRs fusionados (250) · At. Esp. = estrellas (1500) · Def. Esp. = seguidores (600) · Velocidad = racha más larga (150)
3. **Etapa** por total base (60–960): <420 básico · 420–539 fase 1 · 540–689 fase final · ≥690 legendario (en simulación: 13% / 44% / 39% / 3%).
4. **Elección**: entre los Pokémon del tipo y la etapa (PokeAPI), el de mayor similitud coseno con tu vector de 6 stats.
5. **Extras**: naturaleza por hora pico (Activa/Seria/Alegre/Osada), nivel = 5 + commits/28 (máx 100), habilidad = repo con más estrellas, movimientos = 4 repos top (potencia 30 + 6·√estrellas, máx 150), variocolor = hash(id) mod 4096 = 0.

## Datos
GitHub REST (/users, /repos, /events/public), GraphQL contributionsCollection (requiere token → serverless), PokeAPI (/type, /pokemon). Caché de 24 h por usuario.
Sprites: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/{id}.png`

## Crecimiento
Tarjeta SVG 495×195 para README (oscuro/claro), sprite en base64, Cache-Control 24 h.

## Estado de la maqueta
- Los datos son simulados: un hash FNV-1a del nombre de usuario alimenta un PRNG (mulberry32), así cada usuario da siempre el mismo resultado.
- Los Pokémon salen de una tabla fija de 4 por tipo (básico, fase 1, final, legendario). En la versión real se cambia por PokeAPI + similitud coseno.
- Los recuadros punteados son el hueco del sprite oficial.
