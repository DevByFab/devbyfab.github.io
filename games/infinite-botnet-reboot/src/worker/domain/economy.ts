import type { EngineState } from '../state';
import { computeUpgradeEffects } from './upgrades';

export type ExploitResult = 'blocked' | 'cooldown' | 'success' | 'fail';

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function maxBigInt(left: bigint, right: bigint): bigint {
  return left > right ? left : right;
}

function bumpCounter(current: number, delta: bigint): number {
  if (delta <= 0n) return current;
  const boundedDelta = delta > 1_000_000n ? 1_000_000 : Number(delta);
  return current + boundedDelta;
}

function applyBpsMultiplier(value: bigint, bonusBps: number): bigint {
  if (value <= 0n || bonusBps === 0) return value;
  const factor = BigInt(10_000 + bonusBps);
  return (value * factor) / 10_000n;
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
  if (state.phase.index < 2) {
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

export function refreshEconomyDerivedRates(state: EngineState): void {
  const bots = state.resources.bots;
  const phaseFactor = BigInt(state.phase.index + 1);
  const effects = computeUpgradeEffects(state);
  const hasOperatorMacros = (state.upgrades.levels['qol-operator-macros'] ?? 0) > 0;

  state.rates.manualScanGain = BigInt(1 + clamp(effects.manualScanGainFlat, 0, 6));
  state.rates.autoScanPerSec = bots < 110n ? 0n : bots / 118n + phaseFactor / 2n;
  state.rates.autoExploitPerSec = 0n;
  state.rates.monetizeBotsPerSec = maxBigInt(2n, bots / 1200n + BigInt(state.phase.index));

  if (state.rates.autoScanPerSec > 48_000_000n) state.rates.autoScanPerSec = 48_000_000n;
  const monetizeCap = 950_000n * BigInt((state.phase.index + 1) * (state.phase.index + 1));
  if (state.rates.monetizeBotsPerSec > monetizeCap) state.rates.monetizeBotsPerSec = monetizeCap;

  state.rates.autoScanPerSec = applyBpsMultiplier(state.rates.autoScanPerSec, effects.autoScanBps);

  if (effects.autoExploitUnlock > 0) {
    const autoExploitBase = bots < 400n ? 0n : bots / 240n + phaseFactor / 4n;
    state.rates.autoExploitPerSec = applyBpsMultiplier(autoExploitBase, effects.autoExploitBps);
    if (state.rates.autoExploitPerSec > 42_000_000n) state.rates.autoExploitPerSec = 42_000_000n;
  }

  const queuedTargetsForScanCooldown = Number(
    state.resources.queuedTargets > 220n ? 220n : state.resources.queuedTargets,
  );
  const dynamicScanCooldownMs = 90 + Math.floor((queuedTargetsForScanCooldown / 220) * 210);
  state.rates.manualScanCommandCooldownBaseMs = clamp(
    dynamicScanCooldownMs - (hasOperatorMacros ? 35 : 0),
    60,
    320,
  );

  const cooldownRawBaseMs = 2000;
  const cooldownReductionBps = clamp(effects.manualExploitCooldownReductionBps, 0, 9500);
  let cooldownMs = Math.floor((cooldownRawBaseMs * (10_000 - cooldownReductionBps)) / 10_000);
  if (effects.manualExploitCooldownDisable > 0) {
    cooldownMs = 0;
  }
  state.rates.manualExploitCooldownBaseMs = cooldownMs;

  const investPenalty = state.systems.investMode === 'aggressive' ? 140 : 0;
  const exploitBase = 6200 + state.phase.index * 95 - investPenalty;
  state.rates.exploitChanceBps = clamp(
    exploitBase + effects.exploitChanceBps,
    4700,
    9800,
  );

  const moneyYieldBase = 5800 + state.phase.index * 120;
  state.rates.moneyYieldBps = clamp(moneyYieldBase + effects.moneyYieldBps, 5200, 8600);

  const maintenanceReductionBps = clamp(effects.maintenanceReductionBps, 0, 8500);
  const maintenanceRate = (2n * BigInt(10_000 - maintenanceReductionBps)) / 10_000n;
  state.rates.maintenancePerThousandBots = maxBigInt(1n, maintenanceRate);
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

export function commandScan(state: EngineState): boolean {
  if (state.systems.manualScanCooldownMs > 0) {
    return false;
  }

  state.resources.queuedTargets += state.rates.manualScanGain;
  state.milestones.scans += 1;
  state.systems.manualScanCooldownMs =
    state.rates.manualScanCommandCooldownBaseMs > 0
      ? state.rates.manualScanCommandCooldownBaseMs
      : 0;
  return true;
}

export function commandExploit(state: EngineState): ExploitResult {
  if (state.systems.manualExploitCooldownMs > 0) {
    return 'cooldown';
  }

  if (state.resources.queuedTargets <= 0n) {
    return 'blocked';
  }

  state.resources.queuedTargets -= 1n;
  state.milestones.exploitAttempts += 1;
  state.systems.manualExploitCooldownMs =
    state.rates.manualExploitCooldownBaseMs > 0 ? state.rates.manualExploitCooldownBaseMs : 0;
  const roll = Math.floor(Math.random() * 10_000);

  if (roll < state.rates.exploitChanceBps) {
    state.resources.bots += 1n;
    state.milestones.exploitSuccesses += 1;
    return 'success';
  }

  return 'fail';
}

export function commandToggleMonetize(state: EngineState): boolean {
  if (state.phase.index < 2) {
    return false;
  }

  if (!state.systems.monetizeActive && state.resources.bots < 50n) {
    return false;
  }

  state.systems.monetizeActive = !state.systems.monetizeActive;
  return true;
}

export function commandInvestTranche(state: EngineState): boolean {
  if (state.phase.index < 2) {
    return false;
  }

  const available = state.resources.darkMoney;
  const tranche = maxBigInt(40n, available / 8n);

  if (tranche < 80n || available < tranche) {
    return false;
  }

  state.resources.darkMoney -= tranche;
  state.resources.portfolio += tranche;
  state.milestones.investments += 1;
  return true;
}

export function commandCashoutPortfolio(state: EngineState): boolean {
  if (state.phase.index < 2) {
    return false;
  }

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
