export type PhaseId =
  | 'garage'
  | 'automation'
  | 'monetization'
  | 'botnet-war'
  | 'cloud-dominion'
  | 'opinion-forge'
  | 'grid-overmind'
  | 'neural-breach'
  | 'singularity-core'
  | 'matrix-breach';

export type InvestMode = 'stable' | 'aggressive';

export type MessageTone = 'positive' | 'neutral' | 'negative';

export type MessageRewardType =
  | 'bots'
  | 'money'
  | 'portfolio'
  | 'intel'
  | 'heat-relief';

export interface PhaseSnapshot {
  id: PhaseId;
  label: string;
  nextLabel: string;
  progressBps: number;
  index: number;
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
  telemetry: TelemetrySnapshot;
}

export interface LogLine {
  id: string;
  atMs: number;
  severity: 'info' | 'warn' | 'error';
  text: string;
}
