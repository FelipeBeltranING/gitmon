import type { Candidate } from '../core/choose.js';
import type { Attack, MonInfo } from '../core/pack.js';
import type { TypeName } from '../core/types.js';
import { getJson } from './http.js';

const API = 'https://pokeapi.co/api/v2';
/** Solo especies del Pokédex nacional (las formas alternativas tienen ids de 10001 en adelante). */
export const NATIONAL_DEX = 1025;

interface Named {
  name: string;
  url: string;
}
interface Localized {
  language: { name: string };
}

export interface RawPokemon {
  id: number;
  name: string;
  height: number;
  weight: number;
  types: { type: Named }[];
  stats: { base_stat: number }[];
  species: Named;
  cries?: { latest?: string };
  moves: { move: Named; version_group_details: { move_learn_method: { name: string } }[] }[];
  sprites: {
    front_default: string | null;
    other: { 'official-artwork': { front_default: string | null; front_shiny: string | null } };
  };
}

interface RawSpecies {
  names: ({ name: string } & Localized)[];
  genera: ({ genus: string } & Localized)[];
  flavor_text_entries: ({ flavor_text: string } & Localized)[];
  is_legendary: boolean;
  is_mythical: boolean;
  evolves_from_species: Named | null;
}

interface RawType {
  pokemon: { pokemon: Named }[];
  damage_relations: { double_damage_from: Named[]; half_damage_from: Named[] };
}

interface RawMove {
  name: string;
  power: number | null;
  type: Named;
  names: ({ name: string } & Localized)[];
  flavor_text_entries: ({ flavor_text: string } & Localized)[];
}

/** Un candidato que además guarda la respuesta completa de la PokeAPI. */
export interface PokemonEntry extends Candidate {
  raw: RawPokemon;
}

const idFromUrl = (url: string): number => Number(url.split('/').filter(Boolean).pop());
const inSpanish = <T extends Localized>(list: T[]): T[] => list.filter((x) => x.language.name === 'es');
const clean = (text: string): string => text.replace(/[\n\f\r­]+/g, ' ').replace(/\s+/g, ' ').trim();

export async function typeIds(type: TypeName): Promise<number[]> {
  const t = await getJson<RawType>(`${API}/type/${type}`);
  return t.pokemon.map((p) => idFromUrl(p.pokemon.url)).filter((id) => id <= NATIONAL_DEX);
}

export async function pokemon(id: number): Promise<PokemonEntry> {
  const raw = await getJson<RawPokemon>(`${API}/pokemon/${id}`);
  return { id: raw.id, types: raw.types.map((t) => t.type.name), base: raw.stats.map((s) => s.base_stat), raw };
}

/** Etapa real según la cadena evolutiva de la especie. */
async function evolutionStage(sp: RawSpecies): Promise<string> {
  if (sp.is_legendary || sp.is_mythical) return 'Legendario';
  if (!sp.evolves_from_species) return 'Básico';
  try {
    const parent = await getJson<RawSpecies>(sp.evolves_from_species.url);
    return parent.evolves_from_species ? 'Fase 2' : 'Fase 1';
  } catch {
    return 'Fase 1';
  }
}

export async function info(entry: PokemonEntry, shiny: boolean): Promise<MonInfo> {
  const p = entry.raw;
  const [sp, firstType] = await Promise.all([
    getJson<RawSpecies>(p.species.url),
    getJson<RawType>(`${API}/type/${p.types[0].type.name}`),
  ]);
  const art = p.sprites.other['official-artwork'];
  return {
    id: p.id,
    name: inSpanish(sp.names)[0]?.name ?? p.name,
    genus: inSpanish(sp.genera)[0]?.genus ?? 'Pokémon',
    flavor: clean(inSpanish(sp.flavor_text_entries).at(-1)?.flavor_text ?? 'Este Pokémon aún no tiene entrada en español.'),
    types: entry.types,
    height: p.height / 10,
    weight: p.weight / 10,
    legendary: sp.is_legendary || sp.is_mythical,
    stage: await evolutionStage(sp),
    art: (shiny ? art.front_shiny : art.front_default) ?? p.sprites.front_default ?? '',
    cry: p.cries?.latest,
    weak: firstType.damage_relations.double_damage_from[0]?.name,
    resist: firstType.damage_relations.half_damage_from[0]?.name,
    retreat: Math.max(1, Math.min(4, Math.ceil(p.weight / 600))),
  };
}

/** Un movimiento real que el Pokémon aprende por nivel, con su nombre y descripción en español. */
export async function move(entry: PokemonEntry, random: () => number): Promise<Attack | null> {
  const all = entry.raw.moves;
  const byLevel = all.filter((m) => m.version_group_details.some((v) => v.move_learn_method.name === 'level-up'));
  const list = byLevel.length ? byLevel : all;
  if (!list.length) return null;
  try {
    const m = await getJson<RawMove>(list[Math.floor(random() * list.length)].move.url);
    return {
      name: inSpanish(m.names)[0]?.name ?? m.name,
      power: m.power ?? '',
      type: m.type.name,
      desc: clean(inSpanish(m.flavor_text_entries).at(-1)?.flavor_text ?? ''),
    };
  } catch {
    return null;
  }
}
