/**
 * Joueur automatique : joue une partie complète avec les MÊMES fonctions que le worker
 * (runSimulationStep, syncDerivedState, commandes du domaine) et mesure la durée.
 *
 * Usage : npm run balance:sim -- [--hours=10] [--seeds=3] [--skill=relaxed|normal|focused|all] [--json] [--trace [--every=30]] [--step=100]
 */
import type { FrontBusinessId, PhaseId } from '../../game/types';
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

function interfaceCheck(state: EngineState, counters: Counters, second: number): void {
  const { resources, systems, war, matrix, rates } = state;

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

  if (!systems.monetizeActive && resources.bots >= 70) {
    commandToggleMonetize(state);
  }

  if (state.phase.index >= 2 && systems.fbiSuspicion > 6200 && systems.fbiCountermeasureCooldownMs <= 0 &&
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

function playRun(seed: number, skill: Skill, maxHours: number, trace = false): RunResult {
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
        interfaceCheck(state, counters, Math.floor(state.nowMs / 1000));
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
          `autoScan=${state.rates.autoScanPerSec}/s autoExploit=${state.rates.autoExploitPerSec}/s suspicion=${state.systems.fbiSuspicion}`);
        const unmet = state.phase.requirements.filter((q) => !q.met).map((q) => `${q.id} ${Math.floor(q.current)}/${q.target}`).join(', ');
        console.log(`      upgrades: ${lv}
      manque : ${unmet || '-'}`);
      }

      if (state.war.heat > peakHeat) peakHeat = state.war.heat;
      if (state.systems.fbiSuspicion > peakSuspicion) peakSuspicion = state.systems.fbiSuspicion;
      if (state.phase.id === FINAL_PHASE) completedAtMin = minute;
    }

    return {
      seed, skill: skill.name, completedAtMin, finalPhase: state.phase.id, phaseAtMin, bottleneck,
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

function readArgs(): { step: number; every: number; hours: number; seeds: number; skills: Skill[]; json: boolean; trace: boolean } {
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
  };
}

function main(): void {
  const { step, every, hours, seeds, skills, json, trace } = readArgs();
  stepMs = step;
  traceEveryMs = every * 60_000;
  const seedList = Array.from({ length: seeds }, (_, i) => 101 + i * 102);
  const results: RunResult[] = [];

  for (const skill of skills) {
    for (const seed of seedList) results.push(playRun(seed, skill, hours, trace));
  }

  if (json) {
    console.log(JSON.stringify(results, null, 2));
    return;
  }

  const phases: PhaseId[] = ['garage', 'automation', 'monetization', 'botnet-war', 'matrix-breach', 'singularity-core'];
  console.log(`--- Infinite BotNet Reboot : joueur automatique (${seeds} graines, limite ${hours} h, tick ${stepMs} ms) ---`);
  console.log(`Cible : ${TARGET_MIN_HOURS} h à ${TARGET_MAX_HOURS} h pour atteindre ${FINAL_PHASE}\n`);

  for (const skill of skills) {
    const runs = results.filter((r) => r.skill === skill.name);
    const done = runs.filter((r) => r.completedAtMin !== null).map((r) => r.completedAtMin as number);
    console.log(`Niveau "${skill.name}" : terminé ${done.length}/${runs.length}, médiane ${fmtMin(median(done))}`);
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
