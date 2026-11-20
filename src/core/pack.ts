import { buildPool, pickBest, sample, type Candidate } from './choose.js';
import { companionRarity, packPower, repoRarity, RARITY, type Rarity } from './rarity.js';
import { isShinySeed, mulberry32, seedOf } from './rng.js';
import { byStars, mostActive, profileSignals, repoVector, total, type GhEvent, type GhProfile, type GhRepo, type ProfileSignals } from './stats.js';
import { typeName, typeOfLanguage, type TypeName } from './types.js';

export const PACK_REPOS = 5;

export interface Attack {
  name: string;
  desc: string;
  power: number | '';
  type: string;
}

/** Datos de un Pokémon ya traducidos, listos para pintar. */
export interface MonInfo {
  id: number;
  name: string;
  genus: string;
  flavor: string;
  types: string[];
  height: number;
  weight: number;
  legendary: boolean;
  stage: string;
  art: string;
  cry?: string;
  weak?: string;
  resist?: string;
  retreat: number;
}

export interface Card extends MonInfo {
  companion: boolean;
  login: string;
  repo: string | null;
  hp: number;
  total: number;
  rarity: Rarity;
  shiny: boolean;
  attacks: Attack[];
  why: string;
}

export interface Friend {
  login: string;
  avatar_url: string;
}

export interface GithubData {
  profile: GhProfile;
  repos: GhRepo[];
  events: GhEvent[];
  following: Friend[];
  source: 'api' | 'directo' | 'simulado';
}

export interface Pack {
  login: string;
  avatar: string;
  season: string;
  source: GithubData['source'];
  /** Orden de revelado: de menor a mayor rareza, el compañero al final. */
  order: Card[];
  companion: Card;
  power: number;
  following: Friend[];
}

/** Todo lo que el sobre necesita del mundo exterior. Se inyecta para poder probarlo sin red. */
export interface PackDeps<P extends Candidate = Candidate> {
  github(login: string): Promise<GithubData>;
  typeIds(type: TypeName): Promise<number[]>;
  pokemon(id: number): Promise<P>;
  info(p: P, shiny: boolean): Promise<MonInfo>;
  move(p: P, random: () => number): Promise<Attack | null>;
  now(): number;
}

export const repoAttack = (r: GhRepo): Attack => ({
  name: r.name,
  type: typeOfLanguage(r.language),
  power: Math.min(150, Math.round(30 + 6 * Math.sqrt(r.stargazers_count || 0))),
  desc: r.description || `Repo de ${r.language || 'código'} · ${r.stargazers_count || 0}★ · ${r.forks_count || 0} forks`,
});

async function choose<P extends Candidate>(
  deps: PackDeps<P>,
  opts: { primary: TypeName; secondary: TypeName | null; vector: Parameters<typeof pickBest>[1]; statTotal: number; seed: number; used: Set<number>; n: number },
): Promise<P> {
  const random = mulberry32(opts.seed);
  const primaryIds = await deps.typeIds(opts.primary);
  const secondaryIds = opts.secondary ? await deps.typeIds(opts.secondary) : null;
  const ids = sample(buildPool(primaryIds, secondaryIds, opts.used), opts.n, random);
  const settled: (P | null)[] = await Promise.all(ids.map((id) => deps.pokemon(id).catch(() => null)));
  const candidates = settled.filter((p): p is P => p !== null);
  const best = pickBest<P>(candidates, opts.vector, opts.statTotal, opts.secondary);
  if (!best) throw new Error('La PokeAPI no respondió. Inténtalo de nuevo en un momento.');
  return best;
}

/** El compañero: la carta que sale de todo el perfil. */
async function companionOf<P extends Candidate>(
  gh: GithubData,
  login: string,
  season: string,
  deps: PackDeps<P>,
  used: Set<number>,
  now: number,
): Promise<{ companion: Card; signals: ProfileSignals }> {
  const signals = profileSignals(gh.profile, gh.repos, gh.events, now, mulberry32(seedOf(season, login)));
  const companionSeed = seedOf(season, login);
  const mon = await choose(deps, {
    primary: signals.primary,
    secondary: signals.secondary,
    vector: signals.vector,
    statTotal: signals.total,
    seed: companionSeed,
    used,
    n: 10,
  });
  used.add(mon.id);
  const companionShiny = isShinySeed(companionSeed);
  const companionInfo = await deps.info(mon, companionShiny);
  const secondReason = signals.night ? `pico ${signals.peakHour}:00` : signals.languages[1];
  const companion: Card = {
    ...companionInfo,
    companion: true,
    login: gh.profile.login,
    repo: null,
    hp: signals.vector[0],
    total: signals.total,
    shiny: companionShiny,
    rarity: companionRarity(signals.total, companionInfo.legendary, companionShiny),
    attacks: byStars(signals.repos).slice(0, 2).map(repoAttack),
    why: `${signals.languages[0] ?? '—'} → ${typeName(signals.primary)}${signals.secondary ? ` · ${secondReason} → ${typeName(signals.secondary)}` : ''}`,
  };
  return { companion, signals };
}

/** Solo el compañero (para la tarjeta del README y la imagen para redes): muchas menos peticiones que el sobre. */
export async function buildCompanion<P extends Candidate>(
  login: string,
  season: string,
  deps: PackDeps<P>,
): Promise<{ companion: Card; avatar: string; source: GithubData['source'] }> {
  const gh = await deps.github(login);
  const { companion } = await companionOf(gh, login, season, deps, new Set<number>(), deps.now());
  return { companion, avatar: gh.profile.avatar_url, source: gh.source };
}

export async function buildPack<P extends Candidate>(
  login: string,
  season: string,
  deps: PackDeps<P>,
  onStep: (text: string) => void = () => {},
): Promise<Pack> {
  onStep('Buscando al entrenador…');
  const gh = await deps.github(login);
  const now = deps.now();
  const used = new Set<number>();
  onStep('Imprimiendo carta 1 · tu compañero');
  const { companion, signals } = await companionOf(gh, login, season, deps, used, now);

  const cards: Card[] = [];
  const active = mostActive(signals.repos, now, PACK_REPOS);
  for (const [i, repo] of active.entries()) {
    onStep(`Imprimiendo carta ${i + 2} · ${repo.name}`);
    const vector = repoVector(repo, now);
    const statTotal = total(vector);
    const type = typeOfLanguage(repo.language);
    const seed = seedOf(season, `${login}/${repo.name}`);
    const p = await choose(deps, { primary: type, secondary: null, vector, statTotal, seed, used, n: 8 });
    used.add(p.id);
    const shiny = isShinySeed(seed);
    const [info, move] = await Promise.all([deps.info(p, shiny), deps.move(p, mulberry32(seed))]);
    cards.push({
      ...info,
      companion: false,
      login: gh.profile.login,
      repo: repo.name,
      hp: vector[0],
      total: statTotal,
      shiny,
      rarity: repoRarity(statTotal, info.legendary, shiny),
      attacks: [repoAttack(repo), ...(move ? [move] : [])],
      why: `${repo.language || 'Sin lenguaje'} → ${typeName(type)}`,
    });
  }

  cards.sort((a, b) => RARITY[a.rarity].rank - RARITY[b.rarity].rank || a.total - b.total);
  const order = [...cards, companion];
  return {
    login: gh.profile.login,
    avatar: gh.profile.avatar_url,
    season,
    source: gh.source,
    order,
    companion,
    power: packPower(order),
    following: gh.following,
  };
}

/** Propuesta de intercambio: tu carta más floja (nunca el compañero) por su mejor carta. */
export function tradeProposal(mine: Pack, theirs: Pack): { give: Card; get: Card } {
  const mineOptions = mine.order.filter((c) => !c.companion);
  const give = [...(mineOptions.length ? mineOptions : [mine.companion])].sort((a, b) => a.total - b.total)[0];
  const theirOptions = theirs.order.filter((c) => !c.companion);
  const get =
    [...theirOptions].sort((a, b) => RARITY[b.rarity].rank - RARITY[a.rarity].rank || b.total - a.total)[0] ?? theirs.companion;
  return { give, get };
}
