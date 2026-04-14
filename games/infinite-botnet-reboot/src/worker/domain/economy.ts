import type { EngineState } from '../state';

export type ExploitResult = 'blocked' | 'success' | 'fail';

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function maxBigInt(left: bigint, right: bigint): bigint {
  return left > right ? left : right;
}

function scalePerSecond(ratePerSec: bigint, deltaMs: number): bigint {
  if (deltaMs <= 0 || ratePerSec <= 0n) return 0n;
  return (ratePerSec * BigInt(deltaMs)) / 1000n;
}

function randomIntInclusive(min: number, max: number): number {
  const span = max - min + 1;
  return min + Math.floor(Math.random() * span);
}

function applyAutoScan(state: EngineState, deltaMs: number): void {
  const autoScanned = scalePerSecond(state.rates.autoScanPerSec, deltaMs);
  if (autoScanned <= 0n) {
    return;
  }

  state.resources.queuedTargets += autoScanned;
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

  let successes = (attempts * BigInt(state.rates.exploitChanceBps)) / 10_000n;
  if (successes === 0n) {
    const roll = Math.floor(Math.random() * 10_000);
    if (roll < state.rates.exploitChanceBps) {
      successes = 1n;
    }
  }

  state.resources.bots += successes;
}

function applyMonetization(state: EngineState, deltaMs: number): void {
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
  if (state.phase.index >= 4) {
    const hzGain = scalePerSecond(maxBigInt(0n, state.resources.bots / 2_800_000n), deltaMs);
    state.resources.hz += hzGain;
  }

  if (state.phase.index >= 7) {
    const brainGain = scalePerSecond(maxBigInt(0n, state.resources.hz / 4_400_000n), deltaMs);
    state.resources.brainMatter += brainGain;
  }

  if (state.phase.index < 8) {
    return;
  }

  const forgeRate = maxBigInt(0n, state.resources.brainMatter / 7_200_000n);
  const possibleForge = scalePerSecond(forgeRate, deltaMs);
  if (possibleForge > 0n && state.resources.darkMoney > possibleForge) {
    state.resources.brainMatter -= possibleForge;
    state.resources.darkMoney -= possibleForge;
    state.resources.computronium += possibleForge;
  }
}

export function refreshEconomyDerivedRates(state: EngineState): void {
  const bots = state.resources.bots;
  const phaseFactor = BigInt(state.phase.index + 1);

  state.rates.autoScanPerSec = bots < 30n ? 0n : bots / 42n + phaseFactor;
  state.rates.autoExploitPerSec = bots < 70n ? 0n : bots / 60n + phaseFactor / 2n;
  state.rates.monetizeBotsPerSec = maxBigInt(2n, bots / 1200n + BigInt(state.phase.index));

  if (state.rates.autoScanPerSec > 48_000_000n) state.rates.autoScanPerSec = 48_000_000n;
  if (state.rates.autoExploitPerSec > 42_000_000n) state.rates.autoExploitPerSec = 42_000_000n;
  const monetizeCap = 950_000n * BigInt((state.phase.index + 1) * (state.phase.index + 1));
  if (state.rates.monetizeBotsPerSec > monetizeCap) state.rates.monetizeBotsPerSec = monetizeCap;

  const investPenalty = state.systems.investMode === 'aggressive' ? 140 : 0;
  state.rates.exploitChanceBps = clamp(6200 + state.phase.index * 95 - investPenalty, 4700, 9600);
  state.rates.moneyYieldBps = clamp(5800 + state.phase.index * 120, 5200, 7800);
}

export function applyEconomyTick(state: EngineState, deltaMs: number): void {
  refreshEconomyDerivedRates(state);

  applyAutoScan(state, deltaMs);
  applyAutoExploit(state, deltaMs);
  applyMonetization(state, deltaMs);
  applyPortfolioYield(state, deltaMs);
  applyMaintenanceDrain(state, deltaMs);
  applyLateResources(state, deltaMs);
}

export function commandScan(state: EngineState): boolean {
  state.resources.queuedTargets += state.rates.manualScanGain;
  return true;
}

export function commandExploit(state: EngineState): ExploitResult {
  if (state.resources.queuedTargets <= 0n) {
    return 'blocked';
  }

  state.resources.queuedTargets -= 1n;
  const roll = Math.floor(Math.random() * 10_000);

  if (roll < state.rates.exploitChanceBps) {
    state.resources.bots += 1n;
    return 'success';
  }

  return 'fail';
}

export function commandToggleMonetize(state: EngineState): boolean {
  if (!state.systems.monetizeActive && state.resources.bots < 50n) {
    return false;
  }

  state.systems.monetizeActive = !state.systems.monetizeActive;
  return true;
}

export function commandInvestTranche(state: EngineState): boolean {
  const available = state.resources.darkMoney;
  const tranche = maxBigInt(40n, available / 8n);

  if (tranche < 80n || available < tranche) {
    return false;
  }

  state.resources.darkMoney -= tranche;
  state.resources.portfolio += tranche;
  return true;
}

export function commandCashoutPortfolio(state: EngineState): boolean {
  if (state.resources.portfolio <= 0n) {
    return false;
  }

  const payout = (state.resources.portfolio * 94n) / 100n;
  state.resources.darkMoney += payout;
  state.resources.portfolio = 0n;
  return true;
}

export function commandToggleInvestMode(state: EngineState): void {
  state.systems.investMode =
    state.systems.investMode === 'stable' ? 'aggressive' : 'stable';
}
