import type { EngineState } from '../../state';
import { refreshEconomyDerivedRates } from './deriveRates';
import {
  bumpCounter,
  clamp,
  maxBigInt,
  randomIntInclusive,
  scalePerSecond,
} from './helpers';
import {
  computeFbiInterventionChancePerSecondBps,
  computeFbiSuspicionDeltaPerSec,
} from './riskModel';

export interface EconomyTickOutcome {
  fbiIntervention: boolean;
  seizedDirtyMoney: number;
  seizedDarkMoney: number;
}

function minBigInt(left: number, right: number): number {
  return left < right ? left : right;
}

function applyAutoScan(state: EngineState, deltaMs: number): void {
  const autoScanned = scalePerSecond(state.rates.autoScanPerSec, deltaMs);
  if (autoScanned <= 0) {
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
  attempts = minBigInt(attempts, state.resources.queuedTargets);

  if (attempts <= 0) {
    return;
  }

  state.resources.queuedTargets -= attempts;
  state.milestones.exploitAttempts = bumpCounter(state.milestones.exploitAttempts, attempts);

  const successes = (attempts * state.rates.exploitChanceBps) / 10_000;
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
  const maxThroughput = maxBigInt(2, state.resources.bots / 2);
  converted = minBigInt(converted, maxThroughput);

  if (converted <= 0) {
    return;
  }

  const attrition = converted / 14;
  if (attrition > 0) {
    state.resources.bots = state.resources.bots > attrition ? state.resources.bots - attrition : 0;
  }

  const gainedFunds = (converted * (state.rates.moneyYieldBps)) / 10_000;

  if (state.phase.index >= 2) {
    state.resources.dirtyMoney += gainedFunds;
    return;
  }

  state.resources.darkMoney += gainedFunds;
}

function tickLaunderingLockdown(state: EngineState, deltaMs: number): void {
  if (state.systems.launderingLockdownMs <= 0) {
    return;
  }

  state.systems.launderingLockdownMs = Math.max(0, state.systems.launderingLockdownMs - deltaMs);
}

function tickFbiCountermeasureCooldown(state: EngineState, deltaMs: number): void {
  if (state.systems.fbiCountermeasureCooldownMs <= 0) {
    return;
  }

  state.systems.fbiCountermeasureCooldownMs = Math.max(
    0,
    state.systems.fbiCountermeasureCooldownMs - deltaMs,
  );
}

function tickFrontBusinessActionCooldown(state: EngineState, deltaMs: number): void {
  if (state.systems.frontBusinessActionCooldownMs <= 0) {
    return;
  }

  state.systems.frontBusinessActionCooldownMs = Math.max(
    0,
    state.systems.frontBusinessActionCooldownMs - deltaMs,
  );
}

function applyLaundering(state: EngineState, deltaMs: number): void {
  if (state.phase.index < 2) {
    if (state.resources.dirtyMoney > 0) {
      state.resources.darkMoney += state.resources.dirtyMoney;
      state.resources.dirtyMoney = 0;
    }
    return;
  }

  if (!state.systems.launderingActive) {
    return;
  }

  if (state.systems.launderingLockdownMs > 0) {
    return;
  }

  let processed = scalePerSecond(state.rates.launderingDirtyPerSec, deltaMs);
  processed = minBigInt(processed, state.resources.dirtyMoney);

  if (processed <= 0) {
    return;
  }

  const gainedMoney = (processed * (state.rates.launderingEfficiencyBps)) / 10_000;
  state.resources.dirtyMoney -= processed;
  state.resources.darkMoney += gainedMoney;
}

function applyFrontBusinessOperations(state: EngineState, deltaMs: number): void {
  if (state.phase.index < 3) {
    return;
  }

  let converted = scalePerSecond(state.rates.frontBusinessDarkToCleanPerSec, deltaMs);
  converted = minBigInt(converted, state.resources.darkMoney);

  if (converted <= 0) {
    return;
  }

  state.resources.darkMoney -= converted;

  const gainedCleanMoney =
    (converted * (state.rates.frontBusinessCleanEfficiencyBps)) / 10_000;
  state.resources.cleanMoney += gainedCleanMoney;
}

function applyFrontBusinessMaintenance(state: EngineState, deltaMs: number): void {
  if (state.phase.index < 3) {
    return;
  }

  const maintenanceDrain = scalePerSecond(state.rates.frontBusinessMaintenancePerSec, deltaMs);
  if (maintenanceDrain <= 0) {
    return;
  }

  if (state.resources.darkMoney >= maintenanceDrain) {
    state.resources.darkMoney -= maintenanceDrain;
    return;
  }

  const remainingDrain = maintenanceDrain - state.resources.darkMoney;
  state.resources.darkMoney = 0;

  const cleanFallbackDrain = remainingDrain / 2;
  if (cleanFallbackDrain > 0) {
    state.resources.cleanMoney =
      state.resources.cleanMoney > cleanFallbackDrain
        ? state.resources.cleanMoney - cleanFallbackDrain
        : 0;
  }
}

function applyFbiPressureAndEvents(
  state: EngineState,
  deltaMs: number,
): EconomyTickOutcome {
  const outcome: EconomyTickOutcome = {
    fbiIntervention: false,
    seizedDirtyMoney: 0,
    seizedDarkMoney: 0,
  };

  if (state.phase.index < 2) {
    state.systems.fbiSuspicion = 0;
    return outcome;
  }

  const suspicionDeltaPerSec = computeFbiSuspicionDeltaPerSec({
    phaseIndex: state.phase.index,
    dirtyMoney: state.resources.dirtyMoney,
    launderingActive: state.systems.launderingActive,
    launderingLockdownMs: state.systems.launderingLockdownMs,
    launderingProfile: state.systems.launderingProfile,
    investMode: state.systems.investMode,
    frontBusinessRiskPressurePerSec: Math.floor(state.rates.frontBusinessRiskBps / 100),
  });

  state.systems.fbiSuspicion += Math.floor((suspicionDeltaPerSec * deltaMs) / 1000);

  state.systems.fbiSuspicion = clamp(state.systems.fbiSuspicion, 0, 10_000);

  const chancePerSecondBps = computeFbiInterventionChancePerSecondBps({
    phaseIndex: state.phase.index,
    suspicion: state.systems.fbiSuspicion,
    launderingProfile: state.systems.launderingProfile,
  });

  if (chancePerSecondBps <= 0) {
    return outcome;
  }

  const interventionChanceBps = Math.floor((chancePerSecondBps * deltaMs) / 1000);
  const roll = Math.floor(Math.random() * 10_000);

  if (roll >= interventionChanceBps) {
    return outcome;
  }

  const seizureBps = state.systems.launderingProfile === 'high-yield' ? 1600 : 1000;
  const moneySeizureBps = Math.max(500, seizureBps - 300);

  const seizedDirtyMoney = (state.resources.dirtyMoney * (seizureBps)) / 10_000;
  const seizedDarkMoney = (state.resources.darkMoney * (moneySeizureBps)) / 10_000;

  state.resources.dirtyMoney =
    state.resources.dirtyMoney > seizedDirtyMoney
      ? state.resources.dirtyMoney - seizedDirtyMoney
      : 0;
  state.resources.darkMoney =
    state.resources.darkMoney > seizedDarkMoney
      ? state.resources.darkMoney - seizedDarkMoney
      : 0;

  state.systems.fbiSuspicion = Math.max(1900, state.systems.fbiSuspicion - 2800);
  state.systems.launderingLockdownMs =
    state.systems.launderingProfile === 'high-yield' ? 16_000 : 10_000;

  outcome.fbiIntervention = true;
  outcome.seizedDirtyMoney = seizedDirtyMoney;
  outcome.seizedDarkMoney = seizedDarkMoney;
  return outcome;
}

function applyPortfolioYield(state: EngineState, deltaMs: number): void {
  if (state.phase.index < 3) {
    return;
  }

  if (state.resources.portfolio <= 0) {
    return;
  }

  const bps =
    state.systems.investMode === 'stable'
      ? state.rates.investStableBps
      : randomIntInclusive(state.rates.investAggressiveMinBps, state.rates.investAggressiveMaxBps);

  const deltaPortfolio =
    (state.resources.portfolio * (bps) * (deltaMs)) / 10_000 / 1000;

  const nextPortfolio = state.resources.portfolio + deltaPortfolio;
  state.resources.portfolio = nextPortfolio > 0 ? nextPortfolio : 0;
}

function applyMaintenanceDrain(state: EngineState, deltaMs: number): void {
  const maintenancePerSecond =
    Math.floor(state.resources.bots / 4000) * state.rates.maintenancePerThousandBots;
  const maintenanceDrain = scalePerSecond(maintenancePerSecond, deltaMs);

  if (maintenanceDrain <= 0) {
    return;
  }

  if (state.resources.darkMoney >= maintenanceDrain) {
    state.resources.darkMoney -= maintenanceDrain;
    return;
  }

  const missing = maintenanceDrain - state.resources.darkMoney;
  state.resources.darkMoney = 0;
  const purgeBots = missing * 4;
  state.resources.bots = state.resources.bots > purgeBots ? state.resources.bots - purgeBots : 0;
}

function applyLateResources(state: EngineState, deltaMs: number): void {
  if (state.phase.index >= 3) {
    const hzGain = scalePerSecond(Math.floor(state.resources.bots / 1_900_000), deltaMs);
    state.resources.hz += hzGain;
  }

  if (state.phase.index >= 4) {
    const brainGain = scalePerSecond(Math.floor(state.resources.hz / 1_800_000), deltaMs);
    state.resources.brainMatter += brainGain;
  }

  if (state.phase.index < 4) {
    return;
  }

  const forgeRate = Math.floor(state.resources.brainMatter / 2_300_000);
  const possibleForge = scalePerSecond(forgeRate, deltaMs);
  if (possibleForge > 0 && state.resources.darkMoney > possibleForge) {
    state.resources.brainMatter -= possibleForge;
    state.resources.darkMoney -= possibleForge;
    state.resources.computronium += possibleForge;
  }
}

export function applyEconomyTick(state: EngineState, deltaMs: number): EconomyTickOutcome {
  refreshEconomyDerivedRates(state);

  tickManualScanCooldown(state, deltaMs);
  tickManualExploitCooldown(state, deltaMs);
  tickLaunderingLockdown(state, deltaMs);
  tickFbiCountermeasureCooldown(state, deltaMs);
  tickFrontBusinessActionCooldown(state, deltaMs);
  applyAutoScan(state, deltaMs);
  applyAutoExploit(state, deltaMs);
  applyMonetization(state, deltaMs);
  applyLaundering(state, deltaMs);
  applyFrontBusinessOperations(state, deltaMs);
  const economyOutcome = applyFbiPressureAndEvents(state, deltaMs);
  applyPortfolioYield(state, deltaMs);
  applyMaintenanceDrain(state, deltaMs);
  applyFrontBusinessMaintenance(state, deltaMs);
  applyLateResources(state, deltaMs);

  return economyOutcome;
}
