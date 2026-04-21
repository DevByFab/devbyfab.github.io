import type { EngineState } from '../../state';
import { computeUpgradeEffects } from '../upgrades';
import {
  FRONT_BUSINESS_IDS,
  computeFrontBusinessMetrics,
} from './frontBusinesses';
import { applyBpsMultiplier, clamp, maxBigInt } from './helpers';

export function refreshEconomyDerivedRates(state: EngineState): void {
  const { bots } = state.resources;
  const phaseFactor = BigInt(state.phase.index + 1);
  const effects = computeUpgradeEffects(state);
  const hasOperatorMacros = (state.upgrades.levels['qol-operator-macros'] ?? 0) > 0;

  state.rates.manualScanGain = BigInt(1 + clamp(effects.manualScanGainFlat, 0, 6));
  state.rates.autoScanPerSec = bots < 110n ? 0n : bots / 118n + phaseFactor / 2n;
  state.rates.autoExploitPerSec = 0n;
  state.rates.monetizeBotsPerSec = maxBigInt(2n, bots / 1200n + BigInt(state.phase.index));

  const launderingBase = maxBigInt(3n, bots / 1750n + phaseFactor / 2n);
  const launderingThroughputBoostBps =
    state.systems.launderingProfile === 'high-yield' ? 1800 : 0;
  state.rates.launderingDirtyPerSec = applyBpsMultiplier(
    launderingBase,
    launderingThroughputBoostBps,
  );

  if (state.rates.autoScanPerSec > 48_000_000n) state.rates.autoScanPerSec = 48_000_000n;
  const monetizeCap = 950_000n * BigInt((state.phase.index + 1) * (state.phase.index + 1));
  if (state.rates.monetizeBotsPerSec > monetizeCap) state.rates.monetizeBotsPerSec = monetizeCap;

  const launderingCap = 780_000n * BigInt((state.phase.index + 1) * (state.phase.index + 1));
  state.rates.launderingDirtyPerSec =
    state.rates.launderingDirtyPerSec > launderingCap
      ? launderingCap
      : state.rates.launderingDirtyPerSec;

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

  const suspicionPenaltyBps =
    state.systems.fbiSuspicion >= 7800 ? 950 : state.systems.fbiSuspicion >= 4400 ? 420 : 0;
  const launderingBaseEfficiency =
    state.systems.launderingProfile === 'high-yield' ? 8850 : 7850;
  state.rates.launderingEfficiencyBps = clamp(
    launderingBaseEfficiency - suspicionPenaltyBps,
    6000,
    9300,
  );

  let totalFrontDarkToCleanPerSec = 0n;
  let totalFrontCleanYieldPerSec = 0n;
  let totalFrontMaintenancePerSec = 0n;
  let totalFrontRiskBps = 0;
  let weightedFrontCleanEfficiency = 0n;

  for (const frontBusinessId of FRONT_BUSINESS_IDS) {
    const runtime = state.systems.frontBusinesses[frontBusinessId];
    const metrics = computeFrontBusinessMetrics(frontBusinessId, runtime, state.phase.index);

    totalFrontDarkToCleanPerSec += metrics.darkToCleanPerSec;
    totalFrontCleanYieldPerSec += metrics.cleanYieldPerSec;
    totalFrontMaintenancePerSec += metrics.maintenancePerSec;
    totalFrontRiskBps += metrics.riskBps;
    weightedFrontCleanEfficiency +=
      metrics.darkToCleanPerSec * BigInt(metrics.cleanEfficiencyBps);
  }

  state.rates.frontBusinessDarkToCleanPerSec = totalFrontDarkToCleanPerSec;
  state.rates.frontBusinessCleanYieldPerSec = totalFrontCleanYieldPerSec;
  state.rates.frontBusinessMaintenancePerSec = totalFrontMaintenancePerSec;
  state.rates.frontBusinessRiskBps = clamp(totalFrontRiskBps, 0, 5400);

  if (totalFrontDarkToCleanPerSec > 0n) {
    state.rates.frontBusinessCleanEfficiencyBps = clamp(
      Number(weightedFrontCleanEfficiency / totalFrontDarkToCleanPerSec),
      7000,
      9900,
    );
  } else {
    state.rates.frontBusinessCleanEfficiencyBps = 0;
  }

  const baseCountermeasureCost =
    180n + BigInt(Math.floor(clamp(state.systems.fbiSuspicion, 0, 10_000) / 55));
  const profileCost = state.systems.launderingProfile === 'high-yield' ? 150n : 0n;
  const dirtyExposureCost = maxBigInt(0n, state.resources.dirtyMoney / 2400n);
  state.rates.fbiCountermeasureCostMoney = maxBigInt(
    180n,
    baseCountermeasureCost + profileCost + dirtyExposureCost,
  );

  const moneyYieldBase = 5500 + state.phase.index * 120;
  state.rates.moneyYieldBps = clamp(moneyYieldBase + effects.moneyYieldBps, 5000, 8400);

  const maintenanceReductionBps = clamp(effects.maintenanceReductionBps, 0, 8500);
  const maintenanceRate = (2n * BigInt(10_000 - maintenanceReductionBps)) / 10_000n;
  state.rates.maintenancePerThousandBots = maxBigInt(1n, maintenanceRate);
}
