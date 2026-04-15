export type PhaseId =
  | 'garage'
  | 'automation'
  | 'monetization'
  | 'botnet-war'
  | 'matrix-breach'
  | 'singularity-core';

export type InvestMode = 'stable' | 'aggressive';

export type MessageTone = 'positive' | 'neutral' | 'negative';

export type MessageRewardType =
  | 'bots'
  | 'targets'
  | 'money'
  | 'portfolio'
  | 'intel'
  | 'heat-relief';

export type PhaseRequirementId =
  | 'bots'
  | 'scans'
  | 'money'
  | 'portfolio'
  | 'war-wins'
  | 'messages-processed'
  | 'exploit-successes';

export interface PhaseRequirementSnapshot {
  id: PhaseRequirementId;
  label: string;
  current: string;
  target: string;
  met: boolean;
}

export interface PhaseSnapshot {
  id: PhaseId;
  label: string;
  nextLabel: string;
  progressBps: number;
  index: number;
  requirements: PhaseRequirementSnapshot[];
}

export type UpgradeCategory = 'economy' | 'war' | 'matrix' | 'lore';

export interface UpgradeOfferSnapshot {
  chainId: string;
  category: UpgradeCategory;
  label: string;
  summary: string;
  currentLevel: number;
  nextLevel: number;
  maxLevel: number;
  unlocked: boolean;
  affordable: boolean;
  statusText: string;
  costBots: string;
  costMoney: string;
  costIntel: string;
  costHz: string;
  costComputronium: string;
}

export interface UpgradesSnapshot {
  totalOwnedLevels: number;
  totalMaxLevels: number;
  offers: UpgradeOfferSnapshot[];
}

export interface ProgressionSnapshot {
  scans: number;
  exploitAttempts: number;
  exploitSuccesses: number;
  investments: number;
  warAttacks: number;
  warWins: number;
  messagesHandled: number;
}

export interface ResourceSnapshot {
  bots: string;
  queuedTargets: string;
  darkMoney: string;
  portfolio: string;
  warIntel: string;
  hz: string;
  brainMatter: string;
  computronium: string;
}

export interface EconomySnapshot {
  monetizeActive: boolean;
  monetizeBotsPerSec: string;
  moneyYieldBps: number;
  exploitCooldownMs: number;
  exploitCooldownBaseMs: number;
  investMode: InvestMode;
  stableInvestBps: number;
  aggressiveInvestMinBps: number;
  aggressiveInvestMaxBps: number;
  maintenanceMoneyPerSec: string;
}

export interface WarSnapshot {
  heat: number;
  wins: number;
  losses: number;
  streak: number;
  attackCooldownMs: number;
  fortifyCooldownMs: number;
  defenseRemainingMs: number;
  attackCostBots: string;
  scrubCostMoney: string;
  fortifyCostMoney: string;
  fortifyCostIntel: string;
  projectedSuccessBps: number;
}

export interface MatrixSnapshot {
  unlocked: boolean;
  stability: number;
  breachProgress: number;
  bypassRemainingMs: number;
  expectedCommand: string;
  successfulInjections: number;
  failedInjections: number;
  armCostHz: string;
  armCostComputronium: string;
  injectCostHz: string;
  injectCostComputronium: string;
  stabilizeCostMoney: string;
}

export interface NarrativeMessage {
  id: string;
  source: string;
  tone: MessageTone;
  subject: string;
  body: string;
  rewardType: MessageRewardType;
  rewardValue: string;
  rewardLabel: string;
  quarantineCost: string;
  createdAtMs: number;
}

export interface MessageSnapshot {
  unread: number;
  processed: number;
  pending: NarrativeMessage[];
  nextInMs: number;
}

export interface TelemetrySnapshot {
  botsPerSec: string;
  moneyPerSec: string;
  heatPerSec: number;
}

export interface GameSnapshot {
  version: number;
  tick: number;
  timestampMs: number;
  phase: PhaseSnapshot;
  resources: ResourceSnapshot;
  economy: EconomySnapshot;
  war: WarSnapshot;
  matrix: MatrixSnapshot;
  messages: MessageSnapshot;
  upgrades: UpgradesSnapshot;
  progression: ProgressionSnapshot;
  telemetry: TelemetrySnapshot;
}

export interface LogLine {
  id: string;
  atMs: number;
  severity: 'info' | 'warn' | 'error';
  text: string;
}
