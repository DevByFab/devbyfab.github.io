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
  seizedMoney: number;
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

  state.resources.money += gainedFunds;
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

function applyBusinessIncome(state: EngineState, deltaMs: number): void {
  if (state.phase.index < 3) {
    return;
  }

  const income = scalePerSecond(state.rates.frontBusinessIncomePerSec, deltaMs);
  if (income > 0) {
    state.resources.money += income;
  }
}

function applyFrontBusinessMaintenance(state: EngineState, deltaMs: number): void {
  if (state.phase.index < 3) {
    return;
  }

  const maintenanceDrain = scalePerSecond(state.rates.frontBusinessMaintenancePerSec, deltaMs);
  if (maintenanceDrain <= 0) {
    return;
  }

  state.resources.money = Math.max(0, state.resources.money - maintenanceDrain);
}

const FBI_SEIZURE_BPS = 1000;

function applyFbiPressureAndEvents(
  state: EngineState,
  deltaMs: number,
): EconomyTickOutcome {
  const outcome: EconomyTickOutcome = {
    fbiIntervention: false,
    seizedMoney: 0,
  };

  if (state.phase.index < 2) {
    state.systems.fbiSuspicion = 0;
    return outcome;
  }

  const suspicionDeltaPerSec = computeFbiSuspicionDeltaPerSec({
    phaseIndex: state.phase.index,
    money: state.resources.money,
    monetizeActive: state.systems.monetizeActive,
    investMode: state.systems.investMode,
    frontBusinessRiskPressurePerSec: Math.floor(state.rates.frontBusinessRiskBps / 100),
  });

  state.systems.fbiSuspicion += Math.floor((suspicionDeltaPerSec * deltaMs) / 1000);

  state.systems.fbiSuspicion = clamp(state.systems.fbiSuspicion, 0, 10_000);

  const chancePerSecondBps = computeFbiInterventionChancePerSecondBps({
    phaseIndex: state.phase.index,
    suspicion: state.systems.fbiSuspicion,
  });

  if (chancePerSecondBps <= 0) {
    return outcome;
  }

  const interventionChanceBps = Math.floor((chancePerSecondBps * deltaMs) / 1000);
  const roll = Math.floor(Math.random() * 10_000);

  if (roll >= interventionChanceBps) {
    return outcome;
  }

  const seizedMoney = (state.resources.money * FBI_SEIZURE_BPS) / 10_000;
  state.resources.money = Math.max(0, state.resources.money - seizedMoney);
  state.systems.fbiSuspicion = Math.max(1900, state.systems.fbiSuspicion - 2800);

  outcome.fbiIntervention = true;
  outcome.seizedMoney = seizedMoney;
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

  if (state.resources.money >= maintenanceDrain) {
    state.resources.money -= maintenanceDrain;
    return;
  }

  const missing = maintenanceDrain - state.resources.money;
  state.resources.money = 0;
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
  if (possibleForge > 0 && state.resources.money > possibleForge) {
    state.resources.brainMatter -= possibleForge;
    state.resources.money -= possibleForge;
    state.resources.computronium += possibleForge;
  }
}

export function applyEconomyTick(state: EngineState, deltaMs: number): EconomyTickOutcome {
  refreshEconomyDerivedRates(state);

  tickManualScanCooldown(state, deltaMs);
  tickManualExploitCooldown(state, deltaMs);
  tickFbiCountermeasureCooldown(state, deltaMs);
  tickFrontBusinessActionCooldown(state, deltaMs);
  applyAutoScan(state, deltaMs);
  applyAutoExploit(state, deltaMs);
  applyMonetization(state, deltaMs);
  applyBusinessIncome(state, deltaMs);
  const economyOutcome = applyFbiPressureAndEvents(state, deltaMs);
  applyPortfolioYield(state, deltaMs);
  applyMaintenanceDrain(state, deltaMs);
  applyFrontBusinessMaintenance(state, deltaMs);
  applyLateResources(state, deltaMs);

  return economyOutcome;
}
