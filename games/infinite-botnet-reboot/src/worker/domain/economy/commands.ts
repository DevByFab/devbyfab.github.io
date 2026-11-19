import type { FrontBusinessId } from '../../../game/types';
import type { EngineState } from '../../state';
import { refreshEconomyDerivedRates } from './deriveRates';
import {
  type FrontBusinessRuntimeState,
  getFrontBusinessBuyCost,
  getFrontBusinessUpgradeCost,
  getNextFrontBusinessMode,
  isFrontBusinessMaxed,
} from './frontBusinesses';
import { maxBigInt } from './helpers';

export type ExploitResult = 'blocked' | 'cooldown' | 'success' | 'fail';
export type FrontBusinessCommandResult =
  | 'phase-locked'
  | 'missing'
  | 'cooldown'
  | 'locked'
  | 'insufficient'
  | 'maxed'
  | 'success';

const FRONT_BUSINESS_ACTION_COOLDOWN_MS = 6500;

interface FrontBusinessCommandContext {
  frontBusinessId: FrontBusinessId;
  runtime: FrontBusinessRuntimeState;
}

function resolveFrontBusinessCommandContext(
  state: EngineState,
  frontBusinessId: FrontBusinessId | undefined,
): FrontBusinessCommandContext | FrontBusinessCommandResult {
  if (state.phase.index < 3) {
    return 'phase-locked';
  }

  if (!frontBusinessId) {
    return 'missing';
  }

  if (state.systems.frontBusinessActionCooldownMs > 0) {
    return 'cooldown';
  }

  return {
    frontBusinessId,
    runtime: state.systems.frontBusinesses[frontBusinessId],
  };
}

function resolveOwnedFrontBusinessCommandContext(
  state: EngineState,
  frontBusinessId: FrontBusinessId | undefined,
): FrontBusinessCommandContext | FrontBusinessCommandResult {
  const context = resolveFrontBusinessCommandContext(state, frontBusinessId);
  if (typeof context === 'string') {
    return context;
  }

  if (!context.runtime.owned) {
    return 'locked';
  }

  return context;
}

function finalizeFrontBusinessCommand(state: EngineState): void {
  state.systems.frontBusinessActionCooldownMs = FRONT_BUSINESS_ACTION_COOLDOWN_MS;
  refreshEconomyDerivedRates(state);
}

const FBI_COUNTERMEASURE_RELIEF = 1400;

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

  if (state.resources.queuedTargets < 1) {
    return 'blocked';
  }

  state.resources.queuedTargets -= 1;
  state.milestones.exploitAttempts += 1;
  state.systems.manualExploitCooldownMs =
    state.rates.manualExploitCooldownBaseMs > 0 ? state.rates.manualExploitCooldownBaseMs : 0;
  const roll = Math.floor(Math.random() * 10_000);

  if (roll < state.rates.exploitChanceBps) {
    state.resources.bots += 1;
    state.milestones.exploitSuccesses += 1;
    return 'success';
  }

  return 'fail';
}

export function commandToggleMonetize(state: EngineState): boolean {
  if (state.phase.index < 1) {
    return false;
  }

  if (!state.systems.monetizeActive && state.resources.bots < 50) {
    return false;
  }

  state.systems.monetizeActive = !state.systems.monetizeActive;
  return true;
}

export function commandPurchaseFrontBusiness(
  state: EngineState,
  frontBusinessId: FrontBusinessId | undefined,
): FrontBusinessCommandResult {
  const context = resolveFrontBusinessCommandContext(state, frontBusinessId);
  if (typeof context === 'string') {
    return context;
  }

  if (context.runtime.owned) {
    return 'locked';
  }

  const cost = getFrontBusinessBuyCost(context.frontBusinessId);
  if (state.resources.money < cost) {
    return 'insufficient';
  }

  state.resources.money -= cost;
  state.systems.frontBusinesses[context.frontBusinessId] = {
    owned: true,
    level: 1,
    mode: 'balanced',
  };
  finalizeFrontBusinessCommand(state);
  return 'success';
}

export function commandUpgradeFrontBusiness(
  state: EngineState,
  frontBusinessId: FrontBusinessId | undefined,
): FrontBusinessCommandResult {
  const context = resolveOwnedFrontBusinessCommandContext(state, frontBusinessId);
  if (typeof context === 'string') {
    return context;
  }

  if (isFrontBusinessMaxed(context.frontBusinessId, context.runtime.level)) {
    return 'maxed';
  }

  const upgradeCost = getFrontBusinessUpgradeCost(
    context.frontBusinessId,
    context.runtime.level,
  );
  if (upgradeCost <= 0 || state.resources.money < upgradeCost) {
    return 'insufficient';
  }

  state.resources.money -= upgradeCost;
  context.runtime.level += 1;
  finalizeFrontBusinessCommand(state);
  return 'success';
}

export function commandToggleFrontBusinessMode(
  state: EngineState,
  frontBusinessId: FrontBusinessId | undefined,
): FrontBusinessCommandResult {
  const context = resolveOwnedFrontBusinessCommandContext(state, frontBusinessId);
  if (typeof context === 'string') {
    return context;
  }

  context.runtime.mode = getNextFrontBusinessMode(context.runtime.mode);
  finalizeFrontBusinessCommand(state);
  return 'success';
}

export function commandFbiCountermeasure(state: EngineState): boolean {
  if (state.phase.index < 2) {
    return false;
  }

  if (state.systems.fbiCountermeasureCooldownMs > 0) {
    return false;
  }

  refreshEconomyDerivedRates(state);
  const cost = state.rates.fbiCountermeasureCostMoney;
  if (state.resources.money < cost) {
    return false;
  }

  state.resources.money -= cost;

  state.systems.fbiSuspicion = Math.max(0, state.systems.fbiSuspicion - FBI_COUNTERMEASURE_RELIEF);

  state.systems.fbiCountermeasureCooldownMs = 18_000;
  return true;
}

export function commandInvestTranche(state: EngineState): boolean {
  if (state.phase.index < 3) {
    return false;
  }

  const available = state.resources.money;
  const tranche = maxBigInt(40, available / 8);

  if (tranche < 80 || available < tranche) {
    return false;
  }

  state.resources.money -= tranche;
  state.resources.portfolio += tranche;
  state.milestones.investments += 1;
  return true;
}

export function commandCashoutPortfolio(state: EngineState): boolean {
  if (state.phase.index < 3) {
    return false;
  }

  if (state.resources.portfolio <= 0) {
    return false;
  }

  const payout = (state.resources.portfolio * 94) / 100;
  state.resources.money += payout;
  state.resources.portfolio = 0;
  return true;
}

export function commandToggleInvestMode(state: EngineState): void {
  if (state.phase.index < 3) {
    return;
  }
  state.systems.investMode =
    state.systems.investMode === 'stable' ? 'aggressive' : 'stable';
}
