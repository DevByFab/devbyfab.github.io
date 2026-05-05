import type { PhaseId } from '../../game/types';
import {
  applyEconomyTick,
  commandCashoutPortfolio,
  commandExploit,
  commandInvestTranche,
  commandScan,
  commandToggleInvestMode,
  commandToggleMonetize,
} from '../domain/economy';
import { applyMatrixTick, commandMatrixArm, commandMatrixInject, commandMatrixStabilize } from '../domain/matrix';
import { applyNarrativeTick, commandProcessMessage, commandQuarantineMessage } from '../domain/narrative';
import { applyWarTick, commandWarAttack, commandWarFortify, commandWarScrub } from '../domain/war';
import { syncCoreDerivedState } from '../engine/syncDerivedState';
import { createInitialEngineState, type EngineState } from '../state';

const STEP_MS = 1000;
const TARGET_MIN_HOURS = 12;
const TARGET_MAX_HOURS = 20;
const MAX_HOURS = 22;
const RUN_SEEDS = [101, 203, 307, 409, 503, 601, 709, 809, 907, 1009];
const MATRIX_OPERATOR_ACCURACY = 0.82;

interface OperatorStats {
  scans: number;
  exploits: number;
  monetizeToggles: number;
  invests: number;
  cashouts: number;
  investModeSwitches: number;
  attacks: number;
  scrubs: number;
  fortifies: number;
  matrixArms: number;
  matrixInjects: number;
  matrixStabilizes: number;
  messagesProcessed: number;
  messagesQuarantined: number;
}

interface RunSummary {
  seed: number;
  elapsedHours: number;
  completedAtHours: number | null;
  finalPhase: PhaseId;
  finalBots: string;
  finalMoney: string;
  peakHeat: number;
  matrixCollapses: number;
  detectionEvents: number;
  phaseReachedAtMin: Partial<Record<PhaseId, number>>;
  operator: OperatorStats;
}

function createSeededRandom(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 0x100000000;
  };
}

function syncDerivedState(state: EngineState): void {
  syncCoreDerivedState(state);
}

function recordPhaseArrival(
  phaseReachedAtMin: Partial<Record<PhaseId, number>>,
  phaseId: PhaseId,
  nowMs: number,
): void {
  if (phaseReachedAtMin[phaseId] !== undefined) return;
  const minute = Math.round((nowMs / 60000) * 10) / 10;
  phaseReachedAtMin[phaseId] = minute;
}

function createOperatorStats(): OperatorStats {
  return {
    scans: 0,
    exploits: 0,
    monetizeToggles: 0,
    invests: 0,
    cashouts: 0,
    investModeSwitches: 0,
    attacks: 0,
    scrubs: 0,
    fortifies: 0,
    matrixArms: 0,
    matrixInjects: 0,
    matrixStabilizes: 0,
    messagesProcessed: 0,
    messagesQuarantined: 0,
  };
}

function handleCoreGrowth(state: EngineState, operator: OperatorStats): void {
  if (state.resources.queuedTargets < 36n || state.resources.bots < 50n) {
    commandScan(state);
    operator.scans += 1;
  }

  if (state.resources.queuedTargets > 0n && state.resources.bots < 360n) {
    const exploitResult = commandExploit(state);
    if (exploitResult !== 'blocked') {
      operator.exploits += 1;
    }
  }
}

function handleMonetizationMode(state: EngineState, operator: OperatorStats): void {
  if (
    !state.systems.monetizeActive &&
    state.resources.bots >= 70n &&
    commandToggleMonetize(state)
  ) {
    operator.monetizeToggles += 1;
  }

  if (
    state.systems.monetizeActive &&
    state.resources.darkMoney < 30n &&
    state.resources.bots < 120n &&
    commandToggleMonetize(state)
  ) {
    operator.monetizeToggles += 1;
  }

  const shouldUseAggressive = state.war.heat < 4500 && state.resources.darkMoney > 750n;
  if (shouldUseAggressive && state.systems.investMode !== 'aggressive') {
    commandToggleInvestMode(state);
    operator.investModeSwitches += 1;
  }

  if (!shouldUseAggressive && state.systems.investMode !== 'stable') {
    commandToggleInvestMode(state);
    operator.investModeSwitches += 1;
  }
}

function handleInvestments(state: EngineState, second: number, operator: OperatorStats): void {
  if (
    state.phase.index >= 2 &&
    state.resources.darkMoney >= 200000n &&
    second % 30 === 0 &&
    commandInvestTranche(state)
  ) {
    operator.invests += 1;
  }

  if (
    state.resources.darkMoney < 120n &&
    state.resources.portfolio > 0n &&
    commandCashoutPortfolio(state)
  ) {
    operator.cashouts += 1;
  }
}

function canOperateWar(state: EngineState): boolean {
  return state.phase.index >= 3;
}

function handleWar(state: EngineState, second: number, operator: OperatorStats): void {
  if (!canOperateWar(state)) {
    return;
  }

  if (
    state.war.heat > 8800 &&
    state.resources.darkMoney >= 200000n &&
    second % 45 === 0 &&
    commandWarScrub(state)
  ) {
    operator.scrubs += 1;
  }

  const canFortify =
    state.war.heat > 7000 &&
    state.war.fortifyCooldownMs <= 0 &&
    state.resources.darkMoney >= state.war.fortifyCostMoney &&
    state.resources.warIntel >= state.war.fortifyCostIntel;
  if (canFortify && commandWarFortify(state)) {
    operator.fortifies += 1;
  }

  const canAttack =
    state.war.attackCooldownMs <= 0 &&
    state.war.heat < 7200 &&
    second % 15 === 0 &&
    state.resources.bots >= state.war.attackCostBots;
  if (canAttack) {
    commandWarAttack(state);
    operator.attacks += 1;
  }
}

function handleMatrix(state: EngineState, second: number, operator: OperatorStats, roll: () => number): void {
  if (state.phase.index < 4) {
    return;
  }

  if (
    state.matrix.bypassRemainingMs <= 0 &&
    state.resources.hz >= state.matrix.armCostHz &&
    state.resources.computronium >= state.matrix.armCostComputronium &&
    commandMatrixArm(state)
  ) {
    operator.matrixArms += 1;
  }

  if (state.matrix.bypassRemainingMs > 0) {
    const shouldInject = roll() <= MATRIX_OPERATOR_ACCURACY;
    if (shouldInject) {
      const injectResult = commandMatrixInject(state, state.matrix.expectedCommand);
      if (injectResult !== 'blocked') {
        operator.matrixInjects += 1;
      }
    } else if (second % 4 === 0 && commandMatrixStabilize(state)) {
      operator.matrixStabilizes += 1;
    }
  }

  if (
    state.matrix.breachProgress > 0 &&
    state.matrix.stability < 4800 &&
    second % 6 === 0 &&
    commandMatrixStabilize(state)
  ) {
    operator.matrixStabilizes += 1;
  }
}

function handleMessages(state: EngineState, second: number, operator: OperatorStats): void {
  if (state.phase.index < 2) {
    return;
  }

  if (state.messages.pending.length === 0) {
    return;
  }

  if (second % 12 !== 0) {
    return;
  }

  const message = state.messages.pending[0];
  if (!message) return;

  if (message.tone === 'negative') {
    if (commandQuarantineMessage(state)) {
      operator.messagesQuarantined += 1;
    }
  } else {
    const result = commandProcessMessage(state);
    if (result !== 'none') {
      operator.messagesProcessed += 1;
    }
  }
}

function formatHour(value: number): number {
  return Math.round(value * 100) / 100;
}

function runSimulation(seed: number): RunSummary {
  const random = createSeededRandom(seed);
  const state = createInitialEngineState(0);
  const operator = createOperatorStats();
  const phaseReachedAtMin: Partial<Record<PhaseId, number>> = {};
  let elapsedMs = 0;
  let completedAtHours: number | null = null;
  let peakHeat = 0;
  let matrixCollapses = 0;
  let detectionEvents = 0;

  while (elapsedMs < MAX_HOURS * 3600 * 1000) {
    state.nowMs = elapsedMs;
    const second = Math.floor(state.nowMs / STEP_MS);

    handleCoreGrowth(state, operator);
    handleMonetizationMode(state, operator);
    handleInvestments(state, second, operator);
    handleWar(state, second, operator);
    handleMatrix(state, second, operator, random);
    handleMessages(state, second, operator);

    applyEconomyTick(state, STEP_MS);
    const warOutcome = applyWarTick(state, STEP_MS);
    const matrixOutcome = applyMatrixTick(state, STEP_MS);
    applyNarrativeTick(state);
    syncDerivedState(state);
    state.tick += 1;

    if (state.war.heat > peakHeat) {
      peakHeat = state.war.heat;
    }

    if (matrixOutcome.collapsed) {
      matrixCollapses += 1;
    }

    if (warOutcome.detectedPurgeBots > 0n) {
      detectionEvents += 1;
    }

    const phaseId = state.phase.id;
    recordPhaseArrival(phaseReachedAtMin, phaseId, state.nowMs);

    if (phaseId === 'singularity-core') {
      completedAtHours = completedAtHours ?? formatHour(state.nowMs / 3600000);
    }

    elapsedMs += STEP_MS;
  }

  return {
    seed,
    elapsedHours: formatHour(elapsedMs / 3600000),
    completedAtHours,
    finalPhase: state.phase.id,
    finalBots: state.resources.bots.toString(),
    finalMoney: state.resources.darkMoney.toString(),
    peakHeat,
    matrixCollapses,
    detectionEvents,
    phaseReachedAtMin,
    operator,
  };
}

function computeMedian(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

function displaySummary(runs: RunSummary[]): void {
  const completedRuns = runs.filter((run) => run.completedAtHours !== null);
  const completedHours = completedRuns.map((run) => run.completedAtHours ?? 0);
  const median = completedRuns.length > 0 ? computeMedian(completedHours) : 0;
  const average = completedRuns.length > 0
    ? completedHours.reduce((sum, value) => sum + value, 0) / completedHours.length
    : 0;
  const inTarget = completedRuns.filter(
    (run) => (run.completedAtHours ?? 0) >= TARGET_MIN_HOURS && (run.completedAtHours ?? 0) <= TARGET_MAX_HOURS,
  ).length;

  console.log('--- Infinite BotNet Reboot - Balance Harness ---');
  console.log('Seeds:', RUN_SEEDS.join(', '));
  console.log('Completed:', `${completedRuns.length}/${runs.length}`);
  console.log('Median completion:', formatHour(median), 'hours');
  console.log('Average completion:', formatHour(average), 'hours');
  console.log('Target band:', `${TARGET_MIN_HOURS}-${TARGET_MAX_HOURS}h`);
  console.log('Runs in target band:', `${inTarget}/${runs.length}`);

  runs.forEach((run) => {
    console.log(
      `Seed ${run.seed}: ` +
        `phase=${run.finalPhase}, ` +
        `complete=${run.completedAtHours ?? 'n/a'}h, ` +
        `bots=${run.finalBots}, ` +
        `money=${run.finalMoney}, ` +
        `peakHeat=${run.peakHeat}, ` +
        `matrixCollapses=${run.matrixCollapses}, ` +
        `detectionEvents=${run.detectionEvents}`,
    );
  });
}

const summaries = RUN_SEEDS.map((seed) => runSimulation(seed));
displaySummary(summaries);