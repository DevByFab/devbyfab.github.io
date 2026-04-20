import type { FbiRiskState, InvestMode, LaunderingProfile } from '../../../game/types';
import { clamp } from './helpers';

export const FBI_SUSPICION_WATCH_THRESHOLD = 4400;
export const FBI_SUSPICION_ALERT_THRESHOLD = 7800;

const DIRTY_PRESSURE_DIVISOR = 32_000n;
const DIRTY_PRESSURE_MAX = 28;
const AGGRESSIVE_INVEST_PRESSURE = 12;

const SUSPICION_GAIN_LOW_RISK = 9;
const SUSPICION_GAIN_HIGH_YIELD = 24;
const SUSPICION_DECAY_IDLE = 10;

const INTERVENTION_MIN_CHANCE_BPS = 90;
const INTERVENTION_MAX_CHANCE_BPS = 3600;
const INTERVENTION_SUSPICION_BASELINE = 7500;
const INTERVENTION_SUSPICION_STEP = 10;
const INTERVENTION_PROFILE_LOW_RISK_BONUS = 50;
const INTERVENTION_PROFILE_HIGH_YIELD_BONUS = 220;

interface SuspicionDeltaInput {
  phaseIndex: number;
  dirtyMoney: bigint;
  launderingActive: boolean;
  launderingLockdownMs: number;
  launderingProfile: LaunderingProfile;
  investMode: InvestMode;
}

interface InterventionChanceInput {
  phaseIndex: number;
  suspicion: number;
  launderingProfile: LaunderingProfile;
}

function computeDirtyPressure(dirtyMoney: bigint): number {
  const dirtyPressure = Number(dirtyMoney > 0n ? dirtyMoney / DIRTY_PRESSURE_DIVISOR : 0n);
  return clamp(dirtyPressure, 0, DIRTY_PRESSURE_MAX);
}

export function resolveFbiRiskState(suspicion: number): FbiRiskState {
  if (suspicion >= FBI_SUSPICION_ALERT_THRESHOLD) {
    return 'alert';
  }

  if (suspicion >= FBI_SUSPICION_WATCH_THRESHOLD) {
    return 'watch';
  }

  return 'clear';
}

export function computeFbiSuspicionDeltaPerSec(input: Readonly<SuspicionDeltaInput>): number {
  if (input.phaseIndex < 2) {
    return 0;
  }

  if (input.launderingActive && input.launderingLockdownMs <= 0) {
    const baseGain = input.launderingProfile === 'high-yield' ? SUSPICION_GAIN_HIGH_YIELD : SUSPICION_GAIN_LOW_RISK;
    const dirtyPressure = computeDirtyPressure(input.dirtyMoney);
    const investPressure = input.investMode === 'aggressive' ? AGGRESSIVE_INVEST_PRESSURE : 0;
    return baseGain + dirtyPressure + investPressure;
  }

  return -SUSPICION_DECAY_IDLE;
}

export function computeFbiInterventionChancePerSecondBps(
  input: Readonly<InterventionChanceInput>,
): number {
  if (input.phaseIndex < 2 || input.suspicion < FBI_SUSPICION_ALERT_THRESHOLD) {
    return 0;
  }

  const profilePressure =
    input.launderingProfile === 'high-yield'
      ? INTERVENTION_PROFILE_HIGH_YIELD_BONUS
      : INTERVENTION_PROFILE_LOW_RISK_BONUS;

  const baseChance =
    INTERVENTION_MIN_CHANCE_BPS +
    Math.floor((input.suspicion - INTERVENTION_SUSPICION_BASELINE) / INTERVENTION_SUSPICION_STEP) +
    profilePressure;

  return clamp(
    baseChance,
    INTERVENTION_MIN_CHANCE_BPS,
    INTERVENTION_MAX_CHANCE_BPS,
  );
}