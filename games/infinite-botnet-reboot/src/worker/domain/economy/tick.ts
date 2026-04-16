import type { EngineState } from '../../state';
import { refreshEconomyDerivedRates } from './deriveRates';
import {
  bumpCounter,
  maxBigInt,
  randomIntInclusive,
  scalePerSecond,
} from './helpers';

function applyAutoScan(state: EngineState, deltaMs: number): void {
  const autoScanned = scalePerSecond(state.rates.autoScanPerSec, deltaMs);
  if (autoScanned <= 0n) {
    return;
  }

  state.resources.queuedTargets += autoScanned;
}

function tickManualExploitCooldown(state: EngineState, deltaMs: number): void {
  if (state.systems.manualExploitCooldownMs <= 0) {
    return;
  }

  state.systems.manualExploitCooldownMs = Math.max(
    0,
    state.systems.manualExploitCooldownMs - deltaMs,
  );
}

function tickManualScanCooldown(state: EngineState, deltaMs: number): void {
  if (state.systems.manualScanCooldownMs <= 0) {
    return;
  }

  state.systems.manualScanCooldownMs = Math.max(
    0,
    state.systems.manualScanCooldownMs - deltaMs,
  );
}

function applyAutoExploit(state: EngineState, deltaMs: number): void {
  let attempts = scalePerSecond(state.rates.autoExploitPerSec, deltaMs);
  if (attempts > state.resources.queuedTargets) {
    attempts = state.resources.queuedTargets;
  }

  if (attempts <= 0n) {
    return;
  }

  state.resources.queuedTargets -= attempts;
  state.milestones.exploitAttempts = bumpCounter(state.milestones.exploitAttempts, attempts);

  let successes = (attempts * BigInt(state.rates.exploitChanceBps)) / 10_000n;
  if (successes === 0n) {
    const roll = Math.floor(Math.random() * 10_000);
    if (roll < state.rates.exploitChanceBps) {
      successes = 1n;
    }
  }

  state.resources.bots += successes;
  state.milestones.exploitSuccesses = bumpCounter(state.milestones.exploitSuccesses, successes);
}

function applyMonetization(state: EngineState, deltaMs: number): void {
  if (state.phase.index < 1) {
    state.systems.monetizeActive = false;
    return;
  }

  if (!state.systems.monetizeActive) {
    return;
  }

  let converted = scalePerSecond(state.rates.monetizeBotsPerSec, deltaMs);
  const maxThroughput = maxBigInt(2n, state.resources.bots / 2n);

  if (converted > maxThroughput) {
    converted = maxThroughput;
  }

  if (converted <= 0n) {
    return;
  }

  const attrition = converted / 14n;
  if (attrition > 0n) {
    state.resources.bots = state.resources.bots > attrition ? state.resources.bots - attrition : 0n;
  }

  const gainedMoney = (converted * BigInt(state.rates.moneyYieldBps)) / 10_000n;
  state.resources.darkMoney += gainedMoney;
}

function applyPortfolioYield(state: EngineState, deltaMs: number): void {
  if (state.phase.index < 2) {
    return;
  }

  if (state.resources.portfolio <= 0n) {
    return;
  }

  const bps =
    state.systems.investMode === 'stable'
      ? state.rates.investStableBps
      : randomIntInclusive(state.rates.investAggressiveMinBps, state.rates.investAggressiveMaxBps);

  const deltaPortfolio =
    (state.resources.portfolio * BigInt(bps) * BigInt(deltaMs)) / 10_000n / 1000n;

  const nextPortfolio = state.resources.portfolio + deltaPortfolio;
  state.resources.portfolio = nextPortfolio > 0n ? nextPortfolio : 0n;
}

function applyMaintenanceDrain(state: EngineState, deltaMs: number): void {
  const maintenancePerSecond =
    (state.resources.bots / 4000n) * state.rates.maintenancePerThousandBots;
  const maintenanceDrain = scalePerSecond(maintenancePerSecond, deltaMs);

  if (maintenanceDrain <= 0n) {
    return;
  }

  if (state.resources.darkMoney >= maintenanceDrain) {
    state.resources.darkMoney -= maintenanceDrain;
    return;
  }

  const missing = maintenanceDrain - state.resources.darkMoney;
  state.resources.darkMoney = 0n;
  const purgeBots = missing * 4n;
  state.resources.bots = state.resources.bots > purgeBots ? state.resources.bots - purgeBots : 0n;
}

function applyLateResources(state: EngineState, deltaMs: number): void {
  if (state.phase.index >= 3) {
    const hzGain = scalePerSecond(maxBigInt(0n, state.resources.bots / 1_900_000n), deltaMs);
    state.resources.hz += hzGain;
  }

  if (state.phase.index >= 4) {
    const brainGain = scalePerSecond(maxBigInt(0n, state.resources.hz / 1_800_000n), deltaMs);
    state.resources.brainMatter += brainGain;
  }

  if (state.phase.index < 4) {
    return;
  }

  const forgeRate = maxBigInt(0n, state.resources.brainMatter / 2_300_000n);
  const possibleForge = scalePerSecond(forgeRate, deltaMs);
  if (possibleForge > 0n && state.resources.darkMoney > possibleForge) {
    state.resources.brainMatter -= possibleForge;
    state.resources.darkMoney -= possibleForge;
    state.resources.computronium += possibleForge;
  }
}

export function applyEconomyTick(state: EngineState, deltaMs: number): void {
  refreshEconomyDerivedRates(state);

  tickManualScanCooldown(state, deltaMs);
  tickManualExploitCooldown(state, deltaMs);
  applyAutoScan(state, deltaMs);
  applyAutoExploit(state, deltaMs);
  applyMonetization(state, deltaMs);
  applyPortfolioYield(state, deltaMs);
  applyMaintenanceDrain(state, deltaMs);
  applyLateResources(state, deltaMs);
}
