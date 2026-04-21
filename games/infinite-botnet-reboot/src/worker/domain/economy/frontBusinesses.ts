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
  baseBuyCostDarkMoney: bigint;
  baseDarkToCleanPerSec: bigint;
  baseMaintenancePerSec: bigint;
  baseRiskBps: number;
  baseCleanEfficiencyBps: number;
  maxLevel: number;
}

const FRONT_BUSINESS_DEFINITIONS: ReadonlyArray<FrontBusinessDefinition> = [
  {
    id: 'laundromat',
    baseBuyCostDarkMoney: 1200n,
    baseDarkToCleanPerSec: 8n,
    baseMaintenancePerSec: 2n,
    baseRiskBps: 170,
    baseCleanEfficiencyBps: 9000,
    maxLevel: 5,
  },
  {
    id: 'car-dealership',
    baseBuyCostDarkMoney: 3800n,
    baseDarkToCleanPerSec: 16n,
    baseMaintenancePerSec: 6n,
    baseRiskBps: 260,
    baseCleanEfficiencyBps: 8650,
    maxLevel: 5,
  },
  {
    id: 'freight-forwarder',
    baseBuyCostDarkMoney: 8600n,
    baseDarkToCleanPerSec: 34n,
    baseMaintenancePerSec: 13n,
    baseRiskBps: 340,
    baseCleanEfficiencyBps: 8400,
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
  darkToCleanPerSec: bigint;
  cleanYieldPerSec: bigint;
  maintenancePerSec: bigint;
  cleanEfficiencyBps: number;
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

function getModeCleanYieldBps(mode: FrontBusinessMode): number {
  if (mode === 'discreet') return 10400;
  if (mode === 'aggressive') return 9250;
  return 10000;
}

function applyMultiplier(value: bigint, multiplierBps: number): bigint {
  if (value <= 0n || multiplierBps <= 0) {
    return 0n;
  }

  return (value * BigInt(multiplierBps)) / 10_000n;
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

export function getFrontBusinessBuyCostDarkMoney(id: FrontBusinessId): bigint {
  return getFrontBusinessDefinition(id).baseBuyCostDarkMoney;
}

export function getFrontBusinessUpgradeCostDarkMoney(
  id: FrontBusinessId,
  currentLevel: number,
): bigint {
  const definition = getFrontBusinessDefinition(id);
  const nextLevel = currentLevel + 1;
  if (nextLevel > definition.maxLevel) {
    return 0n;
  }

  const base = definition.baseBuyCostDarkMoney;
  const levelFactor = 10n + BigInt(nextLevel * 8);
  return (base * levelFactor) / 10n;
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
      darkToCleanPerSec: 0n,
      cleanYieldPerSec: 0n,
      maintenancePerSec: 0n,
      cleanEfficiencyBps: 0,
      riskBps: 0,
    };
  }

  const definition = getFrontBusinessDefinition(id);
  const levelBoostBps = 10_000 + Math.max(0, runtime.level - 1) * 1700;
  const throughputWithLevel = applyMultiplier(definition.baseDarkToCleanPerSec, levelBoostBps);
  const darkToCleanPerSec = applyMultiplier(
    throughputWithLevel,
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

  const cleanEfficiencyBps = clamp(
    definition.baseCleanEfficiencyBps +
      Math.max(0, runtime.level - 1) * 90 +
      (getModeCleanYieldBps(runtime.mode) - 10_000),
    7200,
    9850,
  );

  const cleanYieldPerSec = applyMultiplier(darkToCleanPerSec, cleanEfficiencyBps);

  return {
    darkToCleanPerSec,
    cleanYieldPerSec,
    maintenancePerSec,
    cleanEfficiencyBps,
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
      darkToCleanPerSec: metrics.darkToCleanPerSec.toString(),
      cleanYieldPerSec: metrics.cleanYieldPerSec.toString(),
      maintenancePerSec: metrics.maintenancePerSec.toString(),
      riskBps: metrics.riskBps,
      buyCostDarkMoney: getFrontBusinessBuyCostDarkMoney(id).toString(),
      upgradeCostDarkMoney: getFrontBusinessUpgradeCostDarkMoney(id, runtime.level).toString(),
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
