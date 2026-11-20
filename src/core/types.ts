/** Los 18 tipos de Pokémon con su nombre en español y su color. */
export const TYPES = {
  normal: { es: 'Normal', color: '#A8A77A' },
  fire: { es: 'Fuego', color: '#EE8130' },
  water: { es: 'Agua', color: '#6390F0' },
  electric: { es: 'Eléctrico', color: '#F7D02C' },
  grass: { es: 'Planta', color: '#7AC74C' },
  ice: { es: 'Hielo', color: '#96D9D6' },
  fighting: { es: 'Lucha', color: '#C22E28' },
  poison: { es: 'Veneno', color: '#A33EA1' },
  ground: { es: 'Tierra', color: '#E2BF65' },
  flying: { es: 'Volador', color: '#A98FF3' },
  psychic: { es: 'Psíquico', color: '#F95587' },
  bug: { es: 'Bicho', color: '#A6B91A' },
  rock: { es: 'Roca', color: '#B6A136' },
  ghost: { es: 'Fantasma', color: '#735797' },
  dragon: { es: 'Dragón', color: '#6F35FC' },
  dark: { es: 'Siniestro', color: '#705746' },
  steel: { es: 'Acero', color: '#B7B7CE' },
  fairy: { es: 'Hada', color: '#D685AD' },
} as const;

export type TypeName = keyof typeof TYPES;

/** Cada lenguaje de GitHub se vuelve un tipo. Lo que no está aquí es Normal. */
export const LANGUAGE_TYPE: Readonly<Record<string, TypeName>> = {
  JavaScript: 'electric',
  TypeScript: 'psychic',
  Astro: 'psychic',
  Python: 'poison',
  'Jupyter Notebook': 'poison',
  Java: 'fire',
  C: 'fighting',
  'C++': 'fighting',
  Assembly: 'fighting',
  'C#': 'rock',
  Scala: 'rock',
  Rust: 'steel',
  Zig: 'steel',
  Go: 'water',
  Dockerfile: 'water',
  Swift: 'flying',
  Dart: 'flying',
  'Objective-C': 'flying',
  Kotlin: 'grass',
  Vue: 'grass',
  Svelte: 'grass',
  Ruby: 'fairy',
  Elixir: 'fairy',
  PHP: 'ghost',
  Perl: 'ghost',
  GDScript: 'dragon',
  Haskell: 'dragon',
  Shell: 'ground',
  PowerShell: 'ground',
  Batchfile: 'ground',
  Lua: 'ice',
  R: 'bug',
  MATLAB: 'bug',
  HTML: 'normal',
  CSS: 'normal',
  SCSS: 'normal',
};

export const isTypeName = (t: string | null | undefined): t is TypeName => !!t && t in TYPES;

export const typeOfLanguage = (lang: string | null | undefined): TypeName =>
  (lang && LANGUAGE_TYPE[lang]) || 'normal';

export const typeName = (t: string | null | undefined): string => (isTypeName(t) ? TYPES[t].es : (t ?? ''));

export const typeColor = (t: string | null | undefined): string => (isTypeName(t) ? TYPES[t].color : '#bbbbbb');
