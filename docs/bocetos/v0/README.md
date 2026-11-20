# Gitmon — paquete v0

Landing que recibe un usuario de GitHub y te dice qué Pokémon eres (o te arma un equipo de 6 con tus repos).

## Qué hay aquí

| Carpeta / archivo | Para qué sirve |
|---|---|
| `gitmon-concepto-v0.md` | El concepto completo: idea, dirección visual, algoritmo con fórmulas, fuentes de datos. **Empieza por aquí.** |
| `boceto-html/` | Las 4 pantallas como HTML que abres con doble clic en el navegador. La maqueta es interactiva: escribe un usuario y dale a escanear. |
| `capturas/` | PNG de cada pantalla, para pasárselas a un chat que lea imágenes. |
| `fuente-dc/` | Código original de los artboards (formato `.dc.html` del canvas de diseño) y `canvas.json` con la disposición. |

### Pantallas
1. `1-boceto-flujo` — wireframe del flujo: entrada → escaneo → compañero / equipo → compartir.
2. `2-maqueta-landing` — landing completa en alta fidelidad (resultado de ejemplo ya cargado).
3. `3-sistema-calculo` — receta del algoritmo con fórmulas y endpoints.
4. `4-tarjeta-readme` — tarjeta SVG 495×195 para el README, tema oscuro y claro.

## Notas técnicas
- Cada HTML trae inline un mini-renderizador (`dc-lite`) que interpreta el formato del canvas: `{{variables}}`, `<sc-for>`, `<sc-if>`, eventos `onClick`/`onChange`/`onSubmit` y una clase `Component extends DCLogic` con `state`/`setState`/`renderVals()`.
- La lógica del generador de la maqueta está en el `<script type="text/x-dc">` al final de `2-maqueta-landing.html`.
- Las fuentes vienen de Google Fonts; sin internet se ven con la fuente del sistema.
- Los datos son simulados con un hash del nombre de usuario. Aún no hay llamadas reales a GitHub ni a PokeAPI.

## Siguiente paso sugerido
Función serverless (Vercel o Netlify) con un token de GitHub que devuelva el JSON del perfil con caché de 24 h, y reemplazar la tabla fija de Pokémon por PokeAPI + similitud coseno.

---
Proyecto fan sin ánimo de lucro. Pokémon y los nombres asociados son marcas de Nintendo, Creatures Inc. y GAME FREAK.
