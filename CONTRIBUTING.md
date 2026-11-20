# Cómo contribuir

¡Gracias por querer mejorar Gitmon!

1. Abre un issue antes de un cambio grande: así acordamos el enfoque.
2. Crea una rama desde `main`: `feat/…`, `fix/…`, `docs/…` o `chore/…`.
3. Commits en español con [Conventional Commits](https://www.conventionalcommits.org/es/): `feat(core): …`, `fix(ui): …`.
4. Antes del PR:

   ```bash
   npm test
   npm run build
   ```

5. Abre el PR con la plantilla y enlaza el issue (`Closes #N`).

## Reglas del núcleo

- `src/core/` no hace peticiones de red: todo llega inyectado para poder probarlo.
- Un cambio que altere qué Pokémon le toca a alguien necesita prueba y una nota en el CHANGELOG (o un ADR si es una regla nueva).
- Los textos visibles van en español.
