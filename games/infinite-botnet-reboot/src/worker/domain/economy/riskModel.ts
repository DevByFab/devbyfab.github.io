import type { FbiRiskState, InvestMode } from '../../../game/types';
import { clamp } from './helpers';

export const FBI_SUSPICION_WATCH_THRESHOLD = 4400;
export const FBI_SUSPICION_ALERT_THRESHOLD = 7800;

// Un gros tas d'argent attire l'attention : +1 de pression par 32 000 en poche, plafonné.
const MONEY_PRESSURE_DIVISOR = 32_000;
const MONEY_PRESSURE_MAX = 28;
const AGGRESSIVE_INVEST_PRESSURE = 12;

// La monétisation active est l'activité criminelle : la suspicion monte tant qu'elle tourne.
const SUSPICION_GAIN_ACTIVE = 9;
const SUSPICION_DECAY_IDLE = 10;

const INTERVENTION_MIN_CHANCE_BPS = 90;
const INTERVENTION_MAX_CHANCE_BPS = 3600;
const INTERVENTION_SUSPICION_BASELINE = 7500;
const INTERVENTION_SUSPICION_STEP = 10;
const INTERVENTION_BASE_BONUS = 50;

interface SuspicionDeltaInput {
  phaseIndex: number;
  money: number;
  monetizeActive: boolean;
  investMode: InvestMode;
  frontBusinessRiskPressurePerSec: number;
}

interface InterventionChanceInput {
  phaseIndex: number;
  suspicion: number;
}

function computeMoneyPressure(money: number): number {
  const pressure = money > 0 ? money / MONEY_PRESSURE_DIVISOR : 0;
  return clamp(pressure, 0, MONEY_PRESSURE_MAX);
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

  if (input.monetizeActive) {
    const investPressure = input.investMode === 'aggressive' ? AGGRESSIVE_INVEST_PRESSURE : 0;
    return (
      SUSPICION_GAIN_ACTIVE +
      computeMoneyPressure(input.money) +
      investPressure +
      input.frontBusinessRiskPressurePerSec
    );
  }

  return -SUSPICION_DECAY_IDLE + input.frontBusinessRiskPressurePerSec;
}

export function computeFbiInterventionChancePerSecondBps(
  input: Readonly<InterventionChanceInput>,
): number {
  if (input.phaseIndex < 2 || input.suspicion < FBI_SUSPICION_ALERT_THRESHOLD) {
    return 0;
  }

  const baseChance =
    INTERVENTION_MIN_CHANCE_BPS +
    Math.floor((input.suspicion - INTERVENTION_SUSPICION_BASELINE) / INTERVENTION_SUSPICION_STEP) +
    INTERVENTION_BASE_BONUS;

  return clamp(baseChance, INTERVENTION_MIN_CHANCE_BPS, INTERVENTION_MAX_CHANCE_BPS);
}
