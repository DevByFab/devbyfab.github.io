import type {
  FrontBusinessId,
  FrontBusinessMode,
  FrontBusinessSnapshot,
} from '../../../game/types';
import { clamp } from './helpers';

export interface FrontBusinessRuntimeState {
  owned: boolean;
  level: number;
  mode: FrontBusinessMode;
}

export type FrontBusinessRuntimeMap = Record<FrontBusinessId, FrontBusinessRuntimeState>;

interface FrontBusinessDefinition {
  id: FrontBusinessId;
  baseBuyCost: number;
  baseIncomePerSec: number;
  baseMaintenancePerSec: number;
  baseRiskBps: number;
  maxLevel: number;
}

const FRONT_BUSINESS_DEFINITIONS: ReadonlyArray<FrontBusinessDefinition> = [
  {
    id: 'laundromat',
    baseBuyCost: 1200,
    baseIncomePerSec: 6,
    baseMaintenancePerSec: 2,
    baseRiskBps: 170,
    maxLevel: 5,
  },
  {
    id: 'car-dealership',
    baseBuyCost: 3800,
    baseIncomePerSec: 14,
    baseMaintenancePerSec: 6,
    baseRiskBps: 260,
    maxLevel: 5,
  },
  {
    id: 'freight-forwarder',
    baseBuyCost: 8600,
    baseIncomePerSec: 30,
    baseMaintenancePerSec: 13,
    baseRiskBps: 340,
    maxLevel: 4,
  },
];

const FRONT_BUSINESS_DEFINITION_MAP: Record<FrontBusinessId, FrontBusinessDefinition> =
  FRONT_BUSINESS_DEFINITIONS.reduce((accumulator, definition) => {
    accumulator[definition.id] = definition;
    return accumulator;
  }, {} as Record<FrontBusinessId, FrontBusinessDefinition>);

export const FRONT_BUSINESS_IDS: ReadonlyArray<FrontBusinessId> =
  FRONT_BUSINESS_DEFINITIONS.map((definition) => definition.id);

export interface FrontBusinessComputedMetrics {
  incomePerSec: number;
  maintenancePerSec: number;
  riskBps: number;
}

function getThroughputModeMultiplierBps(mode: FrontBusinessMode): number {
  if (mode === 'discreet') return 7600;
  if (mode === 'aggressive') return 13000;
  return 10000;
}

function getMaintenanceModeMultiplierBps(mode: FrontBusinessMode): number {
  if (mode === 'discreet') return 8800;
  if (mode === 'aggressive') return 11800;
  return 10000;
}

function getModeRiskBonusBps(mode: FrontBusinessMode): number {
  if (mode === 'discreet') return -180;
  if (mode === 'aggressive') return 320;
  return 0;
}

function applyMultiplier(value: number, multiplierBps: number): number {
  if (value <= 0 || multiplierBps <= 0) {
    return 0;
  }

  return (value * (multiplierBps)) / 10_000;
}

export function getFrontBusinessDefinition(id: FrontBusinessId): FrontBusinessDefinition {
  return FRONT_BUSINESS_DEFINITION_MAP[id];
}

export function createInitialFrontBusinesses(): FrontBusinessRuntimeMap {
  return {
    laundromat: { owned: false, level: 0, mode: 'balanced' },
    'car-dealership': { owned: false, level: 0, mode: 'balanced' },
    'freight-forwarder': { owned: false, level: 0, mode: 'balanced' },
  };
}

export function getFrontBusinessBuyCost(id: FrontBusinessId): number {
  return getFrontBusinessDefinition(id).baseBuyCost;
}

export function getFrontBusinessUpgradeCost(
  id: FrontBusinessId,
  currentLevel: number,
): number {
  const definition = getFrontBusinessDefinition(id);
  const nextLevel = currentLevel + 1;
  if (nextLevel > definition.maxLevel) {
    return 0;
  }

  const base = definition.baseBuyCost;
  const levelFactor = 10 + (nextLevel * 8);
  return (base * levelFactor) / 10;
}

export function getNextFrontBusinessMode(mode: FrontBusinessMode): FrontBusinessMode {
  if (mode === 'discreet') return 'balanced';
  if (mode === 'balanced') return 'aggressive';
  return 'discreet';
}

export function computeFrontBusinessMetrics(
  id: FrontBusinessId,
  runtime: Readonly<FrontBusinessRuntimeState>,
  phaseIndex: number,
): FrontBusinessComputedMetrics {
  if (!runtime.owned || runtime.level <= 0) {
    return {
      incomePerSec: 0,
      maintenancePerSec: 0,
      riskBps: 0,
    };
  }

  const definition = getFrontBusinessDefinition(id);
  const levelBoostBps = 10_000 + Math.max(0, runtime.level - 1) * 1700;
  const incomeWithLevel = applyMultiplier(definition.baseIncomePerSec, levelBoostBps);
  const incomePerSec = applyMultiplier(
    incomeWithLevel,
    getThroughputModeMultiplierBps(runtime.mode),
  );

  const maintenanceWithLevel = applyMultiplier(definition.baseMaintenancePerSec, levelBoostBps);
  const maintenancePerSec = applyMultiplier(
    maintenanceWithLevel,
    getMaintenanceModeMultiplierBps(runtime.mode),
  );

  const phaseRiskBonus = Math.max(0, phaseIndex - 2) * 160;
  const levelRiskBonus = Math.max(0, runtime.level - 1) * 90;
  const riskBps = clamp(
    definition.baseRiskBps + levelRiskBonus + getModeRiskBonusBps(runtime.mode) + phaseRiskBonus,
    0,
    3800,
  );

  return {
    incomePerSec,
    maintenancePerSec,
    riskBps,
  };
}

export function buildFrontBusinessSnapshots(
  businesses: Readonly<FrontBusinessRuntimeMap>,
  phaseIndex: number,
): FrontBusinessSnapshot[] {
  return FRONT_BUSINESS_IDS.map((id) => {
    const runtime = businesses[id];
    const metrics = computeFrontBusinessMetrics(id, runtime, phaseIndex);

    return {
      id,
      owned: runtime.owned,
      level: runtime.level,
      mode: runtime.mode,
      incomePerSec: metrics.incomePerSec,
      maintenancePerSec: metrics.maintenancePerSec,
      riskBps: metrics.riskBps,
      buyCost: getFrontBusinessBuyCost(id),
      upgradeCost: getFrontBusinessUpgradeCost(id, runtime.level),
    };
  });
}

export function clampFrontBusinessLevel(id: FrontBusinessId, level: number): number {
  const definition = getFrontBusinessDefinition(id);
  return clamp(Math.floor(level), 0, definition.maxLevel);
}

export function isFrontBusinessMaxed(id: FrontBusinessId, level: number): boolean {
  const definition = getFrontBusinessDefinition(id);
  return level >= definition.maxLevel;
}
