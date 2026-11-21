/**
 * Joueur automatique : joue une partie complète avec les MÊMES fonctions que le worker
 * (runSimulationStep, syncDerivedState, commandes du domaine) et mesure la durée.
 *
 * Une partie se termine quand une fin est atteinte (3 projets de la voie, ou prison).
 *
 * Usage : npm run balance:sim -- [--hours=10] [--seeds=3] [--skill=relaxed|normal|focused|all]
 *         [--path=vengeance|resilience|madness|prison|all] [--json] [--trace [--every=30]] [--step=100]
 *   --path=all (défaut) : les graines se partagent les trois voies ; --path=prison : le joueur n'utilise jamais de contre-mesure FBI.
 */
import { STORY_PATH_IDS, STORY_PROJECTS } from '../../game/story';
import type { EndingId, FrontBusinessId, PhaseId, StoryPathId } from '../../game/types';
import {
  commandCashoutPortfolio,
  commandExploit,
  commandFbiCountermeasure,
  commandInvestTranche,
  commandPurchaseFrontBusiness,
  commandScan,
  commandToggleMonetize,
  commandUpgradeFrontBusiness,
} from '../domain/economy';
import { commandMatrixArm, commandMatrixInject, commandMatrixStabilize } from '../domain/matrix';
import { commandProcessMessage, commandQuarantineMessage } from '../domain/narrative';
import { commandChoosePath, commandStartProject } from '../domain/story';
import { commandPurchaseUpgrade } from '../domain/upgrades';
import { commandWarAttack, commandWarFortify, commandWarScrub } from '../domain/war';
import { runSimulationStep } from '../engine/simulationStep';
import { syncDerivedState } from '../engine/syncDerivedState';
import { createInitialEngineState, type EngineState } from '../state';

let stepMs = 100; // durée d'un tick du vrai worker (TICK_INTERVAL_MS)
let traceEveryMs = 1_800_000; // --every=<minutes> avec --trace
const TARGET_MIN_HOURS = 3;
const TARGET_MAX_HOURS = 5;
const FINAL_PHASE: PhaseId = 'singularity-core';
const NO_LIMIT = 10_000;
const FRONT_BUSINESSES: ReadonlyArray<FrontBusinessId> = ['laundromat', 'car-dealership', 'freight-forwarder'];

interface Skill {
  name: string;
  /** délai entre deux gestes manuels (scan / exploit) */
  actionMs: number;
  /** délai entre deux "regards" sur l'interface (achats, réglages) */
  checkMs: number;
}

const SKILLS: Record<string, Skill> = {
  relaxed: { name: 'relaxed', actionMs: 2000, checkMs: 15_000 },
  normal: { name: 'normal', actionMs: 1000, checkMs: 8000 },
  focused: { name: 'focused', actionMs: 500, checkMs: 4000 },
};

interface Counters {
  upgrades: number;
  fbiInterventions: number;
  purges: number;
  matrixCollapses: number;
  messagesProcessed: number;
  messagesQuarantined: number;
  warAttacks: number;
}

interface RunResult {
  seed: number;
  skill: string;
  path: PathMode;
  ending: EndingId | null;
  projectAtMin: number[];
  completedAtMin: number | null;
  finalPhase: PhaseId;
  phaseAtMin: Partial<Record<PhaseId, number>>;
  /** exigence qui a été remplie en dernier avant de passer à la phase suivante */
  bottleneck: Partial<Record<PhaseId, string>>;
  peakHeat: number;
  peakSuspicion: number;
  counters: Counters;
  finalBots: string;
}

type PathMode = StoryPathId | 'prison';

function seededRandom(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 0x100000000;
  };
}

function isOk(result: string): boolean {
  return result === 'purchased' || result === 'success';
}

function manualActions(state: EngineState): void {
  if (state.resources.queuedTargets < 40 || state.resources.bots < 60) {
    commandScan(state);
  }
  if (state.resources.queuedTargets >= 1) {
    commandExploit(state);
  }
}

/** Gestes d'un joueur raisonnable sur la voie choisie. Renvoie true s'il faut garder la monétisation coupée. */
function storyActions(state: EngineState, mode: PathMode): boolean {
  const path: StoryPathId = mode === 'prison' ? 'vengeance' : mode;
  const { story, resources, systems } = state;

  if (state.phase.index >= 4 && !story.path) commandChoosePath(state, path);
  if (state.phase.index < 5 || !story.path) return false;

  const definition = STORY_PROJECTS[path][story.projectsDone];
  if (!definition) return false;

  // Les avocats refusent un client trop exposé : on coupe la monétisation et on refroidit avant de lancer, puis on tient.
  const needsCalm = path === 'vengeance' && definition.maxSuspicion < NO_LIMIT && mode !== 'prison';
  const readyToSpend = story.projectRunning || resources.money >= definition.costMoney;
  // Sans réserve pour payer les contre-mesures, couper la monétisation bloque tout : on la rallume le temps de refaire un peu d'argent.
  const hold = needsCalm && readyToSpend && resources.money >= 50_000;
  if (hold) {
    if (systems.monetizeActive) commandToggleMonetize(state);
    if (systems.fbiSuspicion > definition.maxSuspicion - 300) commandFbiCountermeasure(state);
  }

  if (!story.projectRunning) commandStartProject(state);
  return hold;
}

function interfaceCheck(state: EngineState, counters: Counters, second: number, mode: PathMode): void {
  const { resources, systems, war, matrix, rates } = state;
  const holdMonetize = storyActions(state, mode);

  // Améliorations : la liste est triée, on prend la première achetable.
  for (let guard = 0; guard < 6; guard += 1) {
    const offer = state.upgrades.offers.find((o) => o.unlocked && o.affordable && o.currentLevel < o.maxLevel);
    if (!offer) break;
    if (commandPurchaseUpgrade(state, offer.chainId) === 'purchased') {
      counters.upgrades += 1;
    } else {
      break;
    }
  }

  if (!holdMonetize && !systems.monetizeActive && resources.bots >= 70) {
    commandToggleMonetize(state);
  }

  if (mode !== 'prison' && state.phase.index >= 2 && systems.fbiSuspicion > 6200 && systems.fbiCountermeasureCooldownMs <= 0 &&
    resources.money >= rates.fbiCountermeasureCostMoney) {
    commandFbiCountermeasure(state);
  }

  if (state.phase.index >= 3) {
    for (const id of FRONT_BUSINESSES) {
      const runtime = systems.frontBusinesses[id];
      if (!runtime.owned) {
        if (isOk(commandPurchaseFrontBusiness(state, id))) break;
      } else if (isOk(commandUpgradeFrontBusiness(state, id))) {
        break;
      }
    }

    if (resources.money > 2000 && state.phase.index < 5 && second % 30 === 0) {
      commandInvestTranche(state);
    }
    if (resources.money < 150 && resources.portfolio > 0) {
      commandCashoutPortfolio(state);
    }

    if (war.heat > 6500 && resources.money >= war.scrubCostMoney) commandWarScrub(state);
    if (war.heat > 7000 && war.fortifyCooldownMs <= 0 && resources.money >= war.fortifyCostMoney &&
      resources.warIntel >= war.fortifyCostIntel) {
      commandWarFortify(state);
    }
    if (war.attackCooldownMs <= 0 && war.heat < 7200 && resources.bots >= war.attackCostBots) {
      commandWarAttack(state);
      counters.warAttacks += 1;
    }
  }

  if (state.phase.index >= 2 && state.messages.pending.length > 0) {
    const message = state.messages.pending[0];
    if (message.tone === 'negative') {
      if (commandQuarantineMessage(state)) counters.messagesQuarantined += 1;
    } else if (commandProcessMessage(state) !== 'none') {
      counters.messagesProcessed += 1;
    }
  }

  if (state.phase.index >= 4) {
    if (matrix.bypassRemainingMs <= 0 && resources.hz >= matrix.armCostHz &&
      resources.computronium >= matrix.armCostComputronium) {
      commandMatrixArm(state);
    }
    if (matrix.bypassRemainingMs > 0) {
      commandMatrixInject(state, matrix.expectedCommand);
    }
    if (matrix.breachProgress > 0 && matrix.stability < 4800) {
      commandMatrixStabilize(state);
    }
  }
}

function playRun(seed: number, skill: Skill, mode: PathMode, maxHours: number, trace = false): RunResult {
  const realRandom = Math.random;
  Math.random = seededRandom(seed);

  try {
    const state = createInitialEngineState(0);
    syncDerivedState(state, () => undefined);

    const counters: Counters = {
      upgrades: 0, fbiInterventions: 0, purges: 0, matrixCollapses: 0,
      messagesProcessed: 0, messagesQuarantined: 0, warAttacks: 0,
    };
    const emitLog = (message: string): void => {
      if (message.startsWith('Alerte FBI')) counters.fbiInterventions += 1;
      else if (message.startsWith('Detection mondiale')) counters.purges += 1;
      else if (message.startsWith('Effondrement Matrix')) counters.matrixCollapses += 1;
    };

    const phaseAtMin: Partial<Record<PhaseId, number>> = { garage: 0 };
    const bottleneck: Partial<Record<PhaseId, string>> = {};
    const reqMetAt: Record<string, number> = {};
    let completedAtMin: number | null = null;
    const projectAtMin: number[] = [];
    let projectsSeen = 0;
    let peakHeat = 0;
    let peakSuspicion = 0;
    let nextAction = 0;
    let nextCheck = 0;

    const limitMs = maxHours * 3_600_000;
    while (state.nowMs < limitMs && completedAtMin === null) {
      if (state.nowMs >= nextAction) {
        manualActions(state);
        nextAction = state.nowMs + skill.actionMs;
      }
      if (state.nowMs >= nextCheck) {
        interfaceCheck(state, counters, Math.floor(state.nowMs / 1000), mode);
        nextCheck = state.nowMs + skill.checkMs;
      }

      const before = state.phase.id;
      runSimulationStep(state, stepMs, emitLog);
      syncDerivedState(state, emitLog, before);

      const minute = Math.round((state.nowMs / 60_000) * 10) / 10;
      for (const req of state.phase.requirements) {
        const key = `${state.phase.id}:${req.id}`;
        if (req.met && reqMetAt[key] === undefined) reqMetAt[key] = minute;
      }

      if (state.phase.id !== before) {
        phaseAtMin[state.phase.id] = minute;
        let latest = -1;
        let latestId = '';
        for (const [key, at] of Object.entries(reqMetAt)) {
          if (key.startsWith(before + ':') && at > latest) {
            latest = at;
            latestId = key.slice(before.length + 1);
          }
        }
        bottleneck[before] = latestId;
      }

      if (trace && state.nowMs % traceEveryMs === 0) {
        const r = state.resources;
        const lv = Object.entries(state.upgrades.levels).filter(([, v]) => v > 0).map(([k, v]) => `${k}:${v}`).join(' ');
        console.log(`[${fmtMin(minute).trim()}] ${state.phase.id} bots=${r.bots} queue=${r.queuedTargets} money=${r.money} ` +
          `autoScan=${state.rates.autoScanPerSec}/s autoExploit=${state.rates.autoExploitPerSec}/s suspicion=${state.systems.fbiSuspicion} monetize=${state.systems.monetizeActive} projet=${state.story.projectsDone}${state.story.projectRunning ? '*' : ''} frontIncome=${Math.floor(state.rates.frontBusinessIncomePerSec)} frontMaint=${Math.floor(state.rates.frontBusinessMaintenancePerSec)}`);
        const unmet = state.phase.requirements.filter((q) => !q.met).map((q) => `${q.id} ${Math.floor(q.current)}/${q.target}`).join(', ');
        console.log(`      upgrades: ${lv}
      manque : ${unmet || '-'}`);
      }

      if (state.war.heat > peakHeat) peakHeat = state.war.heat;
      if (state.systems.fbiSuspicion > peakSuspicion) peakSuspicion = state.systems.fbiSuspicion;
      if (state.story.projectsDone > projectsSeen) {
        projectsSeen = state.story.projectsDone;
        projectAtMin.push(minute);
      }
      if (state.story.ending) completedAtMin = minute;
    }

    return {
      seed, skill: skill.name, path: mode, ending: state.story.ending, projectAtMin, completedAtMin, finalPhase: state.phase.id, phaseAtMin, bottleneck,
      peakHeat, peakSuspicion, counters, finalBots: state.resources.bots.toString(),
    };
  } finally {
    Math.random = realRandom;
  }
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function fmtMin(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined) return '   -   ';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${h}h${String(m).padStart(2, '0')}`.padStart(7);
}

function readArgs(): { step: number; every: number; hours: number; seeds: number; skills: Skill[]; json: boolean; trace: boolean; path: string } {
  const argv = (globalThis as unknown as { process?: { argv: string[] } }).process?.argv ?? [];
  const get = (name: string): string | undefined =>
    argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1];
  const skillArg = get('skill') ?? 'all';
  return {
    step: Number(get('step') ?? 100),
    every: Number(get('every') ?? 30),
    hours: Number(get('hours') ?? 10),
    seeds: Number(get('seeds') ?? 3),
    skills: skillArg === 'all' ? Object.values(SKILLS) : [SKILLS[skillArg] ?? SKILLS.normal],
    json: argv.includes('--json'),
    trace: argv.includes('--trace'),
    path: get('path') ?? 'all',
  };
}

function main(): void {
  const { step, every, hours, seeds, skills, json, trace, path } = readArgs();
  stepMs = step;
  traceEveryMs = every * 60_000;
  const seedList = Array.from({ length: seeds }, (_, i) => 101 + i * 102);
  const results: RunResult[] = [];

  for (const skill of skills) {
    seedList.forEach((seed, index) => {
      const mode: PathMode = path === 'all' ? STORY_PATH_IDS[index % STORY_PATH_IDS.length] : (path as PathMode);
      results.push(playRun(seed, skill, mode, hours, trace));
    });
  }

  if (json) {
    console.log(JSON.stringify(results, null, 2));
    return;
  }

  const phases: PhaseId[] = ['garage', 'automation', 'monetization', 'botnet-war', 'matrix-breach', 'singularity-core'];
  console.log(`--- Infinite BotNet Reboot : joueur automatique (${seeds} graines, limite ${hours} h, tick ${stepMs} ms) ---`);
  console.log(`Cible : ${TARGET_MIN_HOURS} h à ${TARGET_MAX_HOURS} h pour atteindre une fin (P5 = ${FINAL_PHASE})\n`);

  for (const skill of skills) {
    const runs = results.filter((r) => r.skill === skill.name);
    const done = runs.filter((r) => r.completedAtMin !== null).map((r) => r.completedAtMin as number);
    console.log(`Niveau "${skill.name}" : fin atteinte ${done.length}/${runs.length}, médiane ${fmtMin(median(done))}`);
    for (const run of runs) {
      const marks = run.projectAtMin.map((m) => fmtMin(m).trim()).join(' / ') || '-';
      console.log(`  graine ${run.seed} voie ${run.path.padEnd(10)} -> ${(run.ending ?? 'aucune fin').padEnd(10)} à ${fmtMin(run.completedAtMin).trim()}  projets : ${marks}`);
    }
    console.log('  phase atteinte à (médiane) :');
    for (const phase of phases) {
      const at = runs.map((r) => r.phaseAtMin[phase]).filter((v): v is number => v !== undefined);
      const reached = `${at.length}/${runs.length}`;
      const bn = runs.map((r) => r.bottleneck[phase]).find((v) => v) ?? '';
      console.log(`    ${phase.padEnd(17)} ${fmtMin(median(at))}  (${reached})  goulot après cette phase : ${bn || '-'}`);
    }
    const c = runs[0].counters;
    console.log(`  graine ${runs[0].seed} : ${c.upgrades} améliorations, ${c.fbiInterventions} saisies FBI, ${c.purges} purges, ` +
      `${c.warAttacks} attaques, chaleur max ${runs[0].peakHeat}, suspicion max ${runs[0].peakSuspicion}, bots finaux ${runs[0].finalBots}\n`);
  }

  const inTarget = results.filter((r) => r.completedAtMin !== null &&
    r.completedAtMin >= TARGET_MIN_HOURS * 60 && r.completedAtMin <= TARGET_MAX_HOURS * 60).length;
  console.log(`Parties dans la cible : ${inTarget}/${results.length}`);
}

main();
