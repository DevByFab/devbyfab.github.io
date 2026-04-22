export type PhaseId =
  | 'garage'
  | 'automation'
  | 'monetization'
  | 'botnet-war'
  | 'matrix-breach'
  | 'singularity-core';

export type InvestMode = 'stable' | 'aggressive';

export type LaunderingProfile = 'low-risk' | 'high-yield';

export type FbiRiskState = 'clear' | 'watch' | 'alert';

export type FrontBusinessId =
  | 'laundromat'
  | 'car-dealership'
  | 'freight-forwarder';

export type FrontBusinessMode = 'discreet' | 'balanced' | 'aggressive';

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
  resourceLocked: boolean;
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
  dirtyMoney: string;
  darkMoney: string;
  cleanMoney: string;
  portfolio: string;
  warIntel: string;
  hz: string;
  brainMatter: string;
  computronium: string;
}

export interface FrontBusinessSnapshot {
  id: FrontBusinessId;
  owned: boolean;
  level: number;
  mode: FrontBusinessMode;
  darkToCleanPerSec: string;
  cleanYieldPerSec: string;
  maintenancePerSec: string;
  riskBps: number;
  buyCostDarkMoney: string;
  upgradeCostDarkMoney: string;
}

export interface EconomySnapshot {
  monetizeActive: boolean;
  monetizeBotsPerSec: string;
  dirtyMoney: string;
  cleanMoney: string;
  launderingActive: boolean;
  launderingProfile: LaunderingProfile;
  launderingThroughputPerSec: string;
  launderingEfficiencyBps: number;
  frontBusinessDarkToCleanPerSec: string;
  frontBusinessCleanYieldPerSec: string;
  frontBusinessMaintenancePerSec: string;
  frontBusinessRiskBps: number;
  frontBusinessActionCooldownMs: number;
  frontBusinesses: FrontBusinessSnapshot[];
  launderingLockdownMs: number;
  fbiSuspicion: number;
  fbiRiskState: FbiRiskState;
  fbiInterventionChanceBps: number;
  fbiCountermeasureCost: string;
  fbiCountermeasureCooldownMs: number;
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

export interface PersistedEngineRates {
  manualScanGain: string;
  manualScanCommandCooldownBaseMs: number;
  exploitChanceBps: number;
  manualExploitCooldownBaseMs: number;
  autoScanPerSec: string;
  autoExploitPerSec: string;
  monetizeBotsPerSec: string;
  launderingDirtyPerSec: string;
  launderingEfficiencyBps: number;
  frontBusinessDarkToCleanPerSec: string;
  frontBusinessCleanYieldPerSec: string;
  frontBusinessMaintenancePerSec: string;
  frontBusinessRiskBps: number;
  frontBusinessCleanEfficiencyBps: number;
  fbiCountermeasureCostMoney: string;
  moneyYieldBps: number;
  investStableBps: number;
  investAggressiveMinBps: number;
  investAggressiveMaxBps: number;
  maintenancePerThousandBots: string;
  heatPerMonetizePerSec: number;
  heatPerAggressivePerSec: number;
  messageIntervalBaseMs: number;
}

export interface PersistedFrontBusinessState {
  owned: boolean;
  level: number;
  mode: FrontBusinessMode;
}

export type PersistedFrontBusinessMap = Record<FrontBusinessId, PersistedFrontBusinessState>;

export interface PersistedEngineSystems {
  monetizeActive: boolean;
  launderingActive: boolean;
  launderingProfile: LaunderingProfile;
  frontBusinesses: PersistedFrontBusinessMap;
  frontBusinessActionCooldownMs: number;
  launderingLockdownMs: number;
  fbiSuspicion: number;
  fbiCountermeasureCooldownMs: number;
  investMode: InvestMode;
  manualScanCooldownMs: number;
  manualExploitCooldownMs: number;
}

export type PersistedEngineWar = WarSnapshot & {
  detectionAccumulatorMs: number;
};

export type PersistedEngineMatrix = MatrixSnapshot;

export interface PersistedEngineMessages {
  pending: NarrativeMessage[];
  processed: number;
  sequence: number;
  nextAtMs: number;
}

export interface PersistedEngineUpgrades {
  levels: Record<string, number>;
  totalOwnedLevels: number;
  totalMaxLevels: number;
}

export interface PersistedEngineTelemetry {
  botsPerSec: string;
  moneyPerSec: string;
  heatPerSec: number;
}

export interface PersistedEngineState {
  version: number;
  tick: number;
  nowMs: number;
  turbo: number;
  phase?: PhaseSnapshot;
  resources: ResourceSnapshot;
  rates: PersistedEngineRates;
  systems: PersistedEngineSystems;
  war: PersistedEngineWar;
  matrix: PersistedEngineMatrix;
  messages: PersistedEngineMessages;
  upgrades: PersistedEngineUpgrades;
  milestones: ProgressionSnapshot;
  telemetry: PersistedEngineTelemetry;
  logSequence: number;
}

export interface PersistedGameState {
  schemaVersion: number;
  savedAtMs: number;
  state: PersistedEngineState;
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
