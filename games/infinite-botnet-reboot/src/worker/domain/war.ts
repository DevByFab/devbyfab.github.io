import type { EngineState } from '../state';
import { computeUpgradeEffects } from './upgrades';

export type WarAttackResult = 'blocked' | 'win' | 'loss';

export interface WarTickOutcome {
  detectedPurgeBots: bigint;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function maxBigInt(left: bigint, right: bigint): bigint {
  return left > right ? left : right;
}

function coolDown(valueMs: number, deltaMs: number): number {
  return Math.max(0, valueMs - deltaMs);
}

function computeHeatPerSecond(
  state: EngineState,
  phasePressure: number,
  heatPerSecDelta: number,
): number {
  const cappedBotsForHeat =
    state.resources.bots > 9_000_000_000_000_000n
      ? 9_000_000_000_000_000n
      : state.resources.bots;
  const botMagnitude = Math.log10(Number(cappedBotsForHeat + 1n));
  const automationHeat = clamp(Math.floor(botMagnitude) - 6, 0, 6);
  const monetizeHeat = state.systems.monetizeActive ? 1 : 0;
  const investHeat =
    state.systems.investMode === 'aggressive' ? Math.max(1, Math.floor((phasePressure + 3) / 5)) : 0;
  const baselineHeat = 0;
  const passiveCooling = phasePressure <= 2 ? 1 : 0;
  const defenseCooling = state.war.defenseRemainingMs > 0 ? 3 : 0;

  return (
    baselineHeat +
    automationHeat +
    monetizeHeat +
    investHeat -
    defenseCooling -
    passiveCooling +
    heatPerSecDelta
  );
}

function applyDetectionPulse(state: EngineState, phasePressure: number): bigint {
  const triggerChance = clamp(
    4 + Math.floor((state.war.heat - 9300) / 30) + phasePressure * 2,
    4,
    68,
  );
  const rolled = Math.floor(Math.random() * 100);
  if (rolled >= triggerChance) {
    return 0n;
  }

  const purgeDivisor = BigInt(Math.max(40, 190 - phasePressure * 18));
  const purgeFloor = BigInt(80 + phasePressure * 30);
  const purge = maxBigInt(purgeFloor, state.resources.bots / purgeDivisor);

  state.resources.bots = state.resources.bots > purge ? state.resources.bots - purge : 0n;

  const moneyPenalty = state.resources.darkMoney / 280n;
  state.resources.darkMoney =
    state.resources.darkMoney > moneyPenalty ? state.resources.darkMoney - moneyPenalty : 0n;

  state.war.heat = clamp(state.war.heat - 260, 0, 10000);
  return purge;
}

function applyDetectionTick(state: EngineState, phasePressure: number, deltaMs: number): bigint {
  if (phasePressure < 4 || state.war.heat < 9300) {
    state.war.detectionAccumulatorMs = 0;
    return 0n;
  }

  state.war.detectionAccumulatorMs += deltaMs;

  let purgedBots = 0n;
  while (state.war.detectionAccumulatorMs >= 1000) {
    state.war.detectionAccumulatorMs -= 1000;
    purgedBots += applyDetectionPulse(state, phasePressure);
  }

  return purgedBots;
}

export function refreshWarDerived(state: EngineState): void {
  const effects = computeUpgradeEffects(state);
  const bots = state.resources.bots;
  const heat = state.war.heat;

  state.war.attackCostBots = maxBigInt(120n, bots / 220n + 120n);
  state.war.scrubCostMoney = maxBigInt(140n, BigInt(180 + Math.floor(heat * 3.4)));
  state.war.fortifyCostMoney = maxBigInt(420n, BigInt(420 + Math.floor(heat * 5.2)));
  state.war.fortifyCostIntel = maxBigInt(3n, BigInt(3 + Math.floor(state.war.wins / 11)));

  const defenseBoost = state.war.defenseRemainingMs > 0 ? 450 : 0;
  const streakBoost = Math.min(1400, state.war.streak * 150);
  const heatPenalty = Math.floor(heat * 0.33);

  state.war.projectedSuccessBps = clamp(
    4600 + defenseBoost + streakBoost - heatPenalty + effects.warSuccessBps,
    900,
    9500,
  );
}

export function applyWarTick(state: EngineState, deltaMs: number): WarTickOutcome {
  state.war.attackCooldownMs = coolDown(state.war.attackCooldownMs, deltaMs);
  state.war.fortifyCooldownMs = coolDown(state.war.fortifyCooldownMs, deltaMs);
  state.war.defenseRemainingMs = coolDown(state.war.defenseRemainingMs, deltaMs);

  const phasePressure = state.phase.index;
  const effects = computeUpgradeEffects(state);
  const heatPerSec = computeHeatPerSecond(state, phasePressure, effects.heatPerSecDelta);
  const heatDelta = Math.floor((heatPerSec * deltaMs) / 1000);
  state.war.heat = clamp(state.war.heat + heatDelta, 0, 10000);

  const purgedBots = applyDetectionTick(state, phasePressure, deltaMs);

  refreshWarDerived(state);
  return { detectedPurgeBots: purgedBots };
}

export function commandWarAttack(state: EngineState): WarAttackResult {
  if (state.phase.index < 3) {
    return 'blocked';
  }

  refreshWarDerived(state);

  if (state.war.attackCooldownMs > 0 || state.resources.bots < state.war.attackCostBots) {
    return 'blocked';
  }

  state.resources.bots -= state.war.attackCostBots;
  state.milestones.warAttacks += 1;

  const roll = Math.floor(Math.random() * 10_000);
  if (roll < state.war.projectedSuccessBps) {
    const rewardBps = Math.min(9600, 8600 + state.war.streak * 90);
    const rewardBots = (state.war.attackCostBots * BigInt(rewardBps)) / 10_000n;
    const rewardMoney = maxBigInt(25n, state.war.attackCostBots / 18n);
    const rewardIntel = 6n + BigInt(Math.floor((state.war.streak + 1) / 2));

    state.resources.bots += rewardBots;
    state.resources.darkMoney += rewardMoney;
    state.resources.warIntel += rewardIntel;

    state.war.wins += 1;
    state.milestones.warWins += 1;
    state.war.streak += 1;
    state.war.heat = clamp(state.war.heat + 220, 0, 10000);
    state.war.attackCooldownMs = state.war.defenseRemainingMs > 0 ? 12_000 : 14_000;

    refreshWarDerived(state);
    return 'win';
  }

  state.war.losses += 1;
  state.war.streak = 0;
  state.war.heat = clamp(state.war.heat + 430, 0, 10000);
  state.war.attackCooldownMs = 18_000;

  refreshWarDerived(state);
  return 'loss';
}

export function commandWarScrub(state: EngineState): boolean {
  if (state.phase.index < 3) {
    return false;
  }

  refreshWarDerived(state);
  const effects = computeUpgradeEffects(state);

  if (state.resources.darkMoney < state.war.scrubCostMoney) {
    return false;
  }

  state.resources.darkMoney -= state.war.scrubCostMoney;
  const baseRelief = 900 + Math.floor(state.war.heat / 9);
  const relief = Math.floor((baseRelief * (10_000 + effects.scrubReliefBps)) / 10_000);
  state.war.heat = clamp(state.war.heat - relief, 0, 10000);

  refreshWarDerived(state);
  return true;
}

export function commandWarFortify(state: EngineState): boolean {
  if (state.phase.index < 3) {
    return false;
  }

  refreshWarDerived(state);

  if (state.war.fortifyCooldownMs > 0) {
    return false;
  }

  if (state.resources.darkMoney < state.war.fortifyCostMoney) {
    return false;
  }

  if (state.resources.warIntel < state.war.fortifyCostIntel) {
    return false;
  }

  state.resources.darkMoney -= state.war.fortifyCostMoney;
  state.resources.warIntel -= state.war.fortifyCostIntel;
  state.war.defenseRemainingMs = 30_000;
  state.war.fortifyCooldownMs = 75_000;
  state.war.heat = clamp(state.war.heat - 220, 0, 10000);

  refreshWarDerived(state);
  return true;
}
