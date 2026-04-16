import type { EngineState } from '../../state';
import { maxBigInt } from './helpers';

export type ExploitResult = 'blocked' | 'cooldown' | 'success' | 'fail';

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
