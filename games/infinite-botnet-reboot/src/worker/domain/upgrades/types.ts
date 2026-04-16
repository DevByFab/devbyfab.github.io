import type { UpgradeCategory } from '../../../game/types';

export interface UpgradeEffects {
  autoScanBps: number;
  autoExploitBps: number;
  autoExploitUnlock: number;
  exploitChanceBps: number;
  manualExploitCooldownReductionBps: number;
  manualExploitCooldownDisable: number;
  manualScanGainFlat: number;
  moneyYieldBps: number;
  maintenanceReductionBps: number;
  warSuccessBps: number;
  heatPerSecDelta: number;
  scrubReliefBps: number;
  matrixDecayPerSecDelta: number;
  matrixArmCostReductionBps: number;
  matrixInjectCostReductionBps: number;
  matrixStabilizeGain: number;
  messageIntervalReductionBps: number;
}

export interface UpgradeLevelRequirements {
  minPhaseIndex?: number;
  minScans?: number;
  minBots?: bigint;
  minMoney?: bigint;
  minWarWins?: number;
  minMessagesHandled?: number;
  minExploitSuccesses?: number;
  minSuccessfulInjections?: number;
}

export interface UpgradeCost {
  bots?: bigint;
  darkMoney?: bigint;
  warIntel?: bigint;
  hz?: bigint;
  computronium?: bigint;
}

export interface UpgradeLevelDefinition {
  cost: UpgradeCost;
  requirements?: UpgradeLevelRequirements;
  effects: Partial<UpgradeEffects>;
}

export interface UpgradeChainDefinition {
  chainId: string;
  category: UpgradeCategory;
  discoverPhaseIndex: number;
  exclusiveGroup?: string;
  label: string;
  summary: string;
  levels: UpgradeLevelDefinition[];
}

export type UpgradePurchaseResult =
  | 'missing'
  | 'maxed'
  | 'locked'
  | 'insufficient'
  | 'purchased';
