import type { EngineState } from '../../state';
import { computeUpgradeEffects } from '../upgrades';
import { applyBpsMultiplier, clamp, maxBigInt } from './helpers';

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
