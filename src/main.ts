import './styles/main.css';
import { activeSeason, editionLabel } from './config';
import { buildPack } from './core/pack';
import { fetchGithub } from './data/github';
import * as pokeapi from './data/pokeapi';
import { startApp } from './ui/app';
import { createTrade } from './ui/trade';

const season = activeSeason();

const build = (login: string, onStep?: (text: string) => void) =>
  buildPack(
    login,
    season,
    {
      github: fetchGithub,
      typeIds: pokeapi.typeIds,
      pokemon: pokeapi.pokemon,
      info: pokeapi.info,
      move: pokeapi.move,
      now: () => Date.now(),
    },
    onStep,
  );

const trade = createTrade({ build: (login) => build(login) });

startApp({
  season,
  edition: editionLabel(season),
  defaultLogin: 'FelipeBeltranING',
  build,
  onDone: (pack) => trade.show(pack),
});
