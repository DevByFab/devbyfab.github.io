import type { PhaseId } from '../game/types';
import {
  applyEconomyTick,
  commandCashoutPortfolio,
  commandExploit,
  commandInvestTranche,
  commandScan,
  commandToggleInvestMode,
  commandToggleMonetize,
  refreshEconomyDerivedRates,
} from '../worker/domain/economy';
import { applyMatrixTick, commandMatrixArm, commandMatrixInject, commandMatrixStabilize, refreshMatrixDerived } from '../worker/domain/matrix';
import { applyNarrativeTick, commandProcessMessage, commandQuarantineMessage } from '../worker/domain/narrative';
import { resolvePhaseProgress } from '../worker/domain/phases';
import { applyWarTick, commandWarAttack, commandWarFortify, commandWarScrub, refreshWarDerived } from '../worker/domain/war';
import { createInitialEngineState, type EngineState } from '../worker/state';

const STEP_MS = 1000;
const TARGET_MIN_HOURS = 12;
const TARGET_MAX_HOURS = 20;
const MAX_HOURS = 22;
const RUN_SEEDS = [101, 203, 307, 409, 503, 601, 709, 809, 907, 1009];
const MATRIX_OPERATOR_ACCURACY = 0.82;

const PHASE_ORDER: PhaseId[] = [
  'garage',
  'automation',
  'monetization',
  'botnet-war',
  'matrix-breach',
  'singularity-core',
];

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
  state.phase = resolvePhaseProgress({
    bots: state.resources.bots,
    scans: state.milestones.scans,
    darkMoney: state.resources.darkMoney,
    portfolio: state.resources.portfolio,
    warWins: state.war.wins,
    messagesProcessed: state.messages.processed,
    exploitSuccesses: state.milestones.exploitSuccesses,
  });
  refreshEconomyDerivedRates(state);
  refreshWarDerived(state);
  refreshMatrixDerived(state);
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
  if (!state.systems.monetizeActive && state.resources.bots >= 70n) {
    if (commandToggleMonetize(state)) {
      operator.monetizeToggles += 1;
    }
  }

  if (state.systems.monetizeActive && state.resources.darkMoney < 30n && state.resources.bots < 120n) {
    if (commandToggleMonetize(state)) {
      operator.monetizeToggles += 1;
    }
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
  if (state.phase.index >= 2 && state.resources.darkMoney >= 200000n && second % 30 === 0) {
    if (commandInvestTranche(state)) {
      operator.invests += 1;
    }
  }

  if (state.resources.darkMoney < 120n && state.resources.portfolio > 0n) {
    if (commandCashoutPortfolio(state)) {
      operator.cashouts += 1;
    }
  }
}

function canOperateWar(state: EngineState): boolean {
  return state.phase.index >= 3;
}

function handleWar(state: EngineState, second: number, operator: OperatorStats): void {
  if (!canOperateWar(state)) {
    return;
  }

  if (state.war.heat > 8800 && state.resources.darkMoney >= 200000n && second % 45 === 0) {
    if (commandWarScrub(state)) {
      operator.scrubs += 1;
    }
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
    const attackResult = commandWarAttack(state);
    if (attackResult !== 'blocked') {
      operator.attacks += 1;
    }
  }
}

function handleMatrix(state: EngineState, second: number, operator: OperatorStats): void {
  if (!state.matrix.unlocked) {
    return;
  }

  if (state.matrix.stability < 3600 && state.resources.darkMoney >= state.matrix.stabilizeCostMoney) {
    if (commandMatrixStabilize(state)) {
      operator.matrixStabilizes += 1;
    }
  }

  const canArmBypass =
    state.matrix.bypassRemainingMs <= 0 &&
    state.resources.hz >= state.matrix.armCostHz &&
    state.resources.computronium >= state.matrix.armCostComputronium;
  if (canArmBypass && commandMatrixArm(state)) {
    operator.matrixArms += 1;
  }

  if (state.matrix.bypassRemainingMs > 0 && second % 6 === 0) {
    const guessIsCorrect = Math.random() <= MATRIX_OPERATOR_ACCURACY;
    const commandGuess = guessIsCorrect ? state.matrix.expectedCommand : 'inject ghost.thread --cold';
    const injectResult = commandMatrixInject(state, commandGuess);
    if (injectResult !== 'blocked') {
      operator.matrixInjects += 1;
    }
  }
}

function handleMessages(state: EngineState, operator: OperatorStats): void {
  let messageActions = 0;
  while (state.messages.pending.length > 0 && messageActions < 2) {
    const head = state.messages.pending[0];
    if (!head) {
      break;
    }

    const shouldQuarantine =
      head.tone === 'negative' &&
      state.phase.index >= 4 &&
      state.resources.darkMoney >= BigInt(head.quarantineCost);

    if (shouldQuarantine) {
      const quarantined = commandQuarantineMessage(state);
      if (quarantined) {
        operator.messagesQuarantined += 1;
      }
    } else {
      const processResult = commandProcessMessage(state);
      if (processResult !== 'none') {
        operator.messagesProcessed += 1;
      }
    }

    messageActions += 1;
  }
}

function runOperator(state: EngineState, second: number, operator: OperatorStats): void {
  handleCoreGrowth(state, operator);
  handleMonetizationMode(state, operator);
  handleInvestments(state, second, operator);
  handleWar(state, second, operator);
  handleMatrix(state, second, operator);
  handleMessages(state, operator);
}

function runSimulation(seed: number): RunSummary {
  const state = createInitialEngineState(0);
  const operator = createOperatorStats();
  const phaseReachedAtMin: Partial<Record<PhaseId, number>> = {};

  let peakHeat = 0;
  let matrixCollapses = 0;
  let detectionEvents = 0;
  let completedAtHours: number | null = null;

  const maxSteps = Math.floor((MAX_HOURS * 3600000) / STEP_MS);
  const seededRandom = createSeededRandom(seed);
  const originalRandom = Math.random;

  Math.random = seededRandom;

  try {
    syncDerivedState(state);

    for (let step = 0; step < maxSteps; step += 1) {
      const second = step * (STEP_MS / 1000);

      syncDerivedState(state);
      recordPhaseArrival(phaseReachedAtMin, state.phase.id, state.nowMs);

      runOperator(state, second, operator);

      state.nowMs += STEP_MS;
      applyEconomyTick(state, STEP_MS);

      const warOutcome = applyWarTick(state, STEP_MS);
      if (warOutcome.detectedPurgeBots > 0n) {
        detectionEvents += 1;
      }

      const matrixOutcome = applyMatrixTick(state, STEP_MS);
      if (matrixOutcome.collapsed) {
        matrixCollapses += 1;
      }

      applyNarrativeTick(state);
      state.tick += 1;

      syncDerivedState(state);
      recordPhaseArrival(phaseReachedAtMin, state.phase.id, state.nowMs);

      if (state.war.heat > peakHeat) {
        peakHeat = state.war.heat;
      }

      if (state.phase.id === 'singularity-core' && state.matrix.breachProgress >= 100) {
        completedAtHours = state.nowMs / 3600000;
        break;
      }
    }
  } finally {
    Math.random = originalRandom;
  }

  return {
    seed,
    elapsedHours: state.nowMs / 3600000,
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

function average(values: number[]): number {
  if (values.length === 0) return 0;
  const total = values.reduce((sum, value) => sum + value, 0);
  return total / values.length;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const midpoint = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[midpoint - 1] + sorted[midpoint]) / 2;
  }

  return sorted[midpoint];
}

function toFixed(value: number, digits = 2): string {
  return value.toFixed(digits);
}

function runHarness(): void {
  console.log('=== Infinite BotNet Reboot: Balance Harness ===');
  console.log('runs=' + RUN_SEEDS.length + ' step=' + STEP_MS + 'ms maxHours=' + MAX_HOURS);

  const summaries = RUN_SEEDS.map((seed) => runSimulation(seed));

  for (const summary of summaries) {
    const completionLabel =
      summary.completedAtHours === null ? 'NO' : toFixed(summary.completedAtHours) + 'h';

    console.log(
      '[seed ' +
        summary.seed +
        '] complete=' +
        completionLabel +
        ' finalPhase=' +
        summary.finalPhase +
        ' bots=' +
        summary.finalBots +
        ' money=' +
        summary.finalMoney +
        ' peakHeat=' +
        summary.peakHeat +
        ' collapses=' +
        summary.matrixCollapses +
        ' detections=' +
        summary.detectionEvents,
    );
  }

  const completionHours = summaries
    .map((summary) => summary.completedAtHours)
    .filter((value): value is number => value !== null);

  const avgCompletion = average(completionHours);
  const medianCompletion = median(completionHours);
  const inTarget = completionHours.filter(
    (hours) => hours >= TARGET_MIN_HOURS && hours <= TARGET_MAX_HOURS,
  ).length;

  console.log('---');
  console.log('completedRuns=' + completionHours.length + '/' + summaries.length);
  if (completionHours.length > 0) {
    console.log('avgCompletionHours=' + toFixed(avgCompletion));
    console.log('medianCompletionHours=' + toFixed(medianCompletion));
    console.log('targetBandHits=' + inTarget + '/' + completionHours.length);
  } else {
    console.log('avgCompletionHours=NA');
    console.log('medianCompletionHours=NA');
    console.log('targetBandHits=0/0');
  }

  const averagePeakHeat = average(summaries.map((summary) => summary.peakHeat));
  const averageCollapses = average(summaries.map((summary) => summary.matrixCollapses));
  const averageDetections = average(summaries.map((summary) => summary.detectionEvents));

  console.log('avgPeakHeat=' + toFixed(averagePeakHeat, 0));
  console.log('avgMatrixCollapses=' + toFixed(averageCollapses, 2));
  console.log('avgDetectionEvents=' + toFixed(averageDetections, 2));

  console.log('--- phase arrival (minutes) ---');
  for (const phaseId of PHASE_ORDER) {
    const values = summaries
      .map((summary) => summary.phaseReachedAtMin[phaseId])
      .filter((value): value is number => value !== undefined);

    if (values.length === 0) {
      console.log(phaseId + '=unreached');
      continue;
    }

    console.log(phaseId + '=avg ' + toFixed(average(values), 1) + 'm / med ' + toFixed(median(values), 1) + 'm');
  }
}

runHarness();
