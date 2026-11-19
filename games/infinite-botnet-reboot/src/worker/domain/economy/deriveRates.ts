import type { EngineState } from '../../state';
import { computeUpgradeEffects } from '../upgrades';
import {
  FRONT_BUSINESS_IDS,
  computeFrontBusinessMetrics,
} from './frontBusinesses';
import { applyBpsMultiplier, clamp, maxBigInt } from './helpers';

export function refreshEconomyDerivedRates(state: EngineState): void {
  const { bots } = state.resources;
  const phaseFactor = (state.phase.index + 1);
  const effects = computeUpgradeEffects(state);
  const hasOperatorMacros = (state.upgrades.levels['qol-operator-macros'] ?? 0) > 0;

  state.rates.manualScanGain = (1 + clamp(effects.manualScanGainFlat, 0, 6));
  state.rates.autoScanPerSec = bots < 110 ? 0 : bots / 118 + phaseFactor / 2;
  state.rates.autoExploitPerSec = 0;
  state.rates.monetizeBotsPerSec = maxBigInt(2, bots / 1200 + (state.phase.index));

  if (state.rates.autoScanPerSec > 48_000_000) state.rates.autoScanPerSec = 48_000_000;
  const monetizeCap = 950_000 * ((state.phase.index + 1) * (state.phase.index + 1));
  if (state.rates.monetizeBotsPerSec > monetizeCap) state.rates.monetizeBotsPerSec = monetizeCap;

  state.rates.autoScanPerSec = applyBpsMultiplier(state.rates.autoScanPerSec, effects.autoScanBps);

  if (effects.autoExploitUnlock > 0) {
    const autoExploitBase = bots < 400 ? 0 : bots / 240 + phaseFactor / 4;
    state.rates.autoExploitPerSec = applyBpsMultiplier(autoExploitBase, effects.autoExploitBps);
    if (state.rates.autoExploitPerSec > 42_000_000) state.rates.autoExploitPerSec = 42_000_000;
  }

  const queuedTargetsForScanCooldown = Number(
    state.resources.queuedTargets > 220 ? 220 : state.resources.queuedTargets,
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

  let totalFrontIncomePerSec = 0;
  let totalFrontMaintenancePerSec = 0;
  let totalFrontRiskBps = 0;

  for (const frontBusinessId of FRONT_BUSINESS_IDS) {
    const runtime = state.systems.frontBusinesses[frontBusinessId];
    const metrics = computeFrontBusinessMetrics(frontBusinessId, runtime, state.phase.index);

    totalFrontIncomePerSec += metrics.incomePerSec;
    totalFrontMaintenancePerSec += metrics.maintenancePerSec;
    totalFrontRiskBps += metrics.riskBps;
  }

  state.rates.frontBusinessIncomePerSec = totalFrontIncomePerSec;
  state.rates.frontBusinessMaintenancePerSec = totalFrontMaintenancePerSec;
  state.rates.frontBusinessRiskBps = clamp(totalFrontRiskBps, 0, 5400);

  const baseCountermeasureCost =
    180 + (Math.floor(clamp(state.systems.fbiSuspicion, 0, 10_000) / 55));
  const exposureCost = maxBigInt(0, state.resources.money / 2400);
  state.rates.fbiCountermeasureCostMoney = maxBigInt(
    180,
    baseCountermeasureCost + exposureCost,
  );

  const moneyYieldBase = 5500 + state.phase.index * 120;
  state.rates.moneyYieldBps = clamp(moneyYieldBase + effects.moneyYieldBps, 5000, 8400);

  const maintenanceReductionBps = clamp(effects.maintenanceReductionBps, 0, 8500);
  const maintenanceRate = (2 * (10_000 - maintenanceReductionBps)) / 10_000;
  state.rates.maintenancePerThousandBots = maxBigInt(1, maintenanceRate);
}
