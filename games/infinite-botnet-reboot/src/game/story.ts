import type { StoryPathId } from './types';

export const STORY_PATH_IDS: ReadonlyArray<StoryPathId> = ['vengeance', 'resilience', 'madness'];

/** Index de phase à partir duquel on choisit sa voie (P4) et on lance les projets (P5). */
export const STORY_CHOICE_PHASE_INDEX = 4;
export const STORY_PROJECTS_PHASE_INDEX = 5;

/** Prison : à 100 % de suspicion un compte à rebours démarre ; il avance tant que la suspicion reste haute. */
export const ARREST_TRIGGER_SUSPICION = 10_000;
export const ARREST_RUN_SUSPICION = 9_000;
export const ARREST_COUNTDOWN_MS = 180_000;

export interface StoryProjectDefinition {
  costMoney: number;
  costBots: number;
  minWarWins: number;
  /** Suspicion à ne pas dépasser (10000 = aucune contrainte). */
  maxSuspicion: number;
  durationMs: number;
  /** Chaleur ajoutée par seconde tant que le projet avance. */
  heatPerSec: number;
  /** Argent laissé au joueur quand le projet se termine (null = rien d'imposé). */
  keepMoney: number | null;
}

const NO_LIMIT = 10_000;

export const STORY_PROJECTS: Readonly<Record<StoryPathId, ReadonlyArray<StoryProjectDefinition>>> = {
  // Vengeance : de l'argent, et une suspicion basse (les avocats refusent un client trop exposé).
  vengeance: [
    { costMoney: 15_000_000, costBots: 0, minWarWins: 0, maxSuspicion: NO_LIMIT, durationMs: 240_000, heatPerSec: 0, keepMoney: null },
    { costMoney: 30_000_000, costBots: 0, minWarWins: 0, maxSuspicion: 4_000, durationMs: 240_000, heatPerSec: 0, keepMoney: null },
    { costMoney: 60_000_000, costBots: 0, minWarWins: 0, maxSuspicion: 3_000, durationMs: 300_000, heatPerSec: 0, keepMoney: null },
  ],
  // Résilience : il faut dépenser ce qu'on a gagné, et ne garder que de quoi vivre.
  resilience: [
    { costMoney: 20_000_000, costBots: 0, minWarWins: 0, maxSuspicion: NO_LIMIT, durationMs: 240_000, heatPerSec: 0, keepMoney: null },
    { costMoney: 40_000_000, costBots: 0, minWarWins: 0, maxSuspicion: NO_LIMIT, durationMs: 240_000, heatPerSec: 0, keepMoney: null },
    { costMoney: 80_000_000, costBots: 0, minWarWins: 0, maxSuspicion: NO_LIMIT, durationMs: 300_000, heatPerSec: 0, keepMoney: 5_000 },
  ],
  // Folie : des bots, de la guerre, et une chaleur qui ne redescend pas.
  madness: [
    { costMoney: 0, costBots: 25_000_000, minWarWins: 75, maxSuspicion: NO_LIMIT, durationMs: 240_000, heatPerSec: 6, keepMoney: null },
    { costMoney: 0, costBots: 50_000_000, minWarWins: 90, maxSuspicion: NO_LIMIT, durationMs: 240_000, heatPerSec: 8, keepMoney: null },
    { costMoney: 0, costBots: 80_000_000, minWarWins: 105, maxSuspicion: NO_LIMIT, durationMs: 300_000, heatPerSec: 10, keepMoney: null },
  ],
};
