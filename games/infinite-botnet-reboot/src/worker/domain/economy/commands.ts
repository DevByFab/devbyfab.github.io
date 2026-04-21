import type { FrontBusinessId } from '../../../game/types';
import type { EngineState } from '../../state';
import { refreshEconomyDerivedRates } from './deriveRates';
import {
  type FrontBusinessRuntimeState,
  getFrontBusinessBuyCostDarkMoney,
  getFrontBusinessUpgradeCostDarkMoney,
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
  if (state.phase.index < 2) {
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
  if (state.phase.index < 1) {
    return false;
  }

  if (!state.systems.monetizeActive && state.resources.bots < 50n) {
    return false;
  }

  state.systems.monetizeActive = !state.systems.monetizeActive;
  return true;
}

export function commandToggleLaundering(state: EngineState): boolean {
  if (state.phase.index < 2) {
    return false;
  }

  if (!state.systems.launderingActive && state.systems.launderingLockdownMs > 0) {
    return false;
  }

  state.systems.launderingActive = !state.systems.launderingActive;
  return true;
}

export function commandToggleLaunderProfile(state: EngineState): boolean {
  if (state.phase.index < 2) {
    return false;
  }

  state.systems.launderingProfile =
    state.systems.launderingProfile === 'low-risk' ? 'high-yield' : 'low-risk';
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

  const cost = getFrontBusinessBuyCostDarkMoney(context.frontBusinessId);
  if (state.resources.darkMoney < cost) {
    return 'insufficient';
  }

  state.resources.darkMoney -= cost;
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

  const upgradeCost = getFrontBusinessUpgradeCostDarkMoney(
    context.frontBusinessId,
    context.runtime.level,
  );
  if (upgradeCost <= 0n || state.resources.darkMoney < upgradeCost) {
    return 'insufficient';
  }

  state.resources.darkMoney -= upgradeCost;
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
  if (state.resources.darkMoney < cost) {
    return false;
  }

  state.resources.darkMoney -= cost;

  const suspicionRelief = state.systems.launderingProfile === 'high-yield' ? 1800 : 1400;
  state.systems.fbiSuspicion = Math.max(0, state.systems.fbiSuspicion - suspicionRelief);

  if (state.systems.launderingLockdownMs > 0) {
    state.systems.launderingLockdownMs = Math.max(0, state.systems.launderingLockdownMs - 5000);
  }

  const evidenceBurn = state.resources.dirtyMoney / 10n;
  if (evidenceBurn > 0n) {
    state.resources.dirtyMoney -= evidenceBurn;
  }

  state.systems.fbiCountermeasureCooldownMs = 18_000;
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
