import type { EngineState } from '../state';
import { clamp, maxBigInt } from './economy/helpers';
import { computeUpgradeEffects } from './upgrades';

export interface MatrixTickOutcome {
  collapsed: boolean;
  collapsePurgedBots: bigint;
}

export type MatrixInjectResult = 'blocked' | 'success' | 'failure';

const MATRIX_TOKENS = ['fractal.root', 'lattice.echo', 'ghost.thread', 'dyson.seed'];
const MATRIX_FLAGS = ['--f12', '--ghost', '--route', '--cold'];

function applyCostReduction(value: bigint, reductionBps: number, floor: bigint): bigint {
  if (value <= floor || reductionBps <= 0) return value;
  const clampedReduction = clamp(reductionBps, 0, 8500);
  const next = (value * BigInt(10_000 - clampedReduction)) / 10_000n;
  return maxBigInt(floor, next);
}

function makeExpectedCommand(): string {
  const token = MATRIX_TOKENS[Math.floor(Math.random() * MATRIX_TOKENS.length)];
  const flag = MATRIX_FLAGS[Math.floor(Math.random() * MATRIX_FLAGS.length)];
  return 'inject ' + token + ' ' + flag;
}

function unlockIfNeeded(state: EngineState): void {
  if (state.matrix.unlocked) return;

  if (state.phase.id === 'matrix-breach') {
    state.matrix.unlocked = true;
  }
}

export function refreshMatrixDerived(state: EngineState): void {
  unlockIfNeeded(state);

  if (!state.matrix.unlocked) {
    return;
  }

  const effects = computeUpgradeEffects(state);

  const deficit = BigInt(Math.max(0, 10_000 - state.matrix.stability));

  state.matrix.armCostHz = 1200n + BigInt(state.phase.index * 220);
  state.matrix.armCostComputronium = 8n;
  state.matrix.injectCostHz = 1800n + BigInt(state.phase.index * 180);
  state.matrix.injectCostComputronium = 6n;
  state.matrix.stabilizeCostMoney = maxBigInt(2200n, 2200n + deficit * 2n);

  state.matrix.armCostHz = applyCostReduction(
    state.matrix.armCostHz,
    effects.matrixArmCostReductionBps,
    400n,
  );
  state.matrix.injectCostHz = applyCostReduction(
    state.matrix.injectCostHz,
    effects.matrixInjectCostReductionBps,
    600n,
  );
}

export function applyMatrixTick(state: EngineState, deltaMs: number): MatrixTickOutcome {
  refreshMatrixDerived(state);

  if (!state.matrix.unlocked) {
    return { collapsed: false, collapsePurgedBots: 0n };
  }

  state.matrix.bypassRemainingMs = Math.max(0, state.matrix.bypassRemainingMs - deltaMs);

  const effects = computeUpgradeEffects(state);
  const decayPerSec =
    2 +
    Math.floor(state.war.heat / 900) +
    (state.systems.monetizeActive ? 1 : 0) +
    effects.matrixDecayPerSecDelta;
  const adjustedDecayPerSec = Math.max(0, decayPerSec);
  const decay = Math.floor((adjustedDecayPerSec * deltaMs) / 1000);
  state.matrix.stability = clamp(state.matrix.stability - decay, 0, 10000);

  if (state.matrix.stability > 0) {
    return { collapsed: false, collapsePurgedBots: 0n };
  }

  const purge = maxBigInt(2_000n, state.resources.bots / 16n);
  state.resources.bots = state.resources.bots > purge ? state.resources.bots - purge : 0n;
  state.matrix.stability = 2800;
  state.matrix.breachProgress = Math.max(0, state.matrix.breachProgress - 18);
  state.war.heat = clamp(state.war.heat + 550, 0, 10000);

  return { collapsed: true, collapsePurgedBots: purge };
}

export function commandMatrixArm(state: EngineState): boolean {
  refreshMatrixDerived(state);

  if (!state.matrix.unlocked || state.matrix.bypassRemainingMs > 0) {
    return false;
  }

  if (state.resources.hz < state.matrix.armCostHz) {
    return false;
  }

  if (state.resources.computronium < state.matrix.armCostComputronium) {
    return false;
  }

  state.resources.hz -= state.matrix.armCostHz;
  state.resources.computronium -= state.matrix.armCostComputronium;
  state.matrix.bypassRemainingMs = 32_000;
  state.matrix.expectedCommand = makeExpectedCommand();
  return true;
}

export function commandMatrixInject(
  state: EngineState,
  commandText: string | undefined,
): MatrixInjectResult {
  refreshMatrixDerived(state);

  if (!state.matrix.unlocked || state.matrix.bypassRemainingMs <= 0) {
    return 'blocked';
  }

  if (state.resources.hz < state.matrix.injectCostHz) {
    return 'blocked';
  }

  if (state.resources.computronium < state.matrix.injectCostComputronium) {
    return 'blocked';
  }

  state.resources.hz -= state.matrix.injectCostHz;
  state.resources.computronium -= state.matrix.injectCostComputronium;

  const normalized = String(commandText || '').trim();
  if (normalized === state.matrix.expectedCommand) {
    const gain = 4 + Math.floor(Math.random() * 3);
    const stabilityHit = 70 + Math.floor(Math.random() * 70);

    state.matrix.breachProgress = clamp(state.matrix.breachProgress + gain, 0, 100);
    state.matrix.stability = clamp(state.matrix.stability - stabilityHit, 0, 10000);
    state.matrix.successfulInjections += 1;
    state.matrix.expectedCommand = makeExpectedCommand();
    state.war.heat = clamp(state.war.heat + 70, 0, 10000);

    if (state.matrix.breachProgress >= 100) {
      state.resources.warIntel += 50n;
      state.resources.darkMoney += 12_000n;
      state.resources.computronium += 15n;
    }

    return 'success';
  }

  state.matrix.failedInjections += 1;
  state.matrix.breachProgress = clamp(state.matrix.breachProgress - 6, 0, 100);
  state.matrix.stability = clamp(state.matrix.stability - 380, 0, 10000);
  state.war.heat = clamp(state.war.heat + 150, 0, 10000);
  return 'failure';
}

export function commandMatrixStabilize(state: EngineState): boolean {
  refreshMatrixDerived(state);
  const effects = computeUpgradeEffects(state);

  if (!state.matrix.unlocked || state.resources.darkMoney < state.matrix.stabilizeCostMoney) {
    return false;
  }

  state.resources.darkMoney -= state.matrix.stabilizeCostMoney;
  state.matrix.stability = clamp(
    state.matrix.stability + 980 + effects.matrixStabilizeGain,
    0,
    10000,
  );
  state.war.heat = clamp(state.war.heat - 220, 0, 10000);

  refreshMatrixDerived(state);
  return true;
}
