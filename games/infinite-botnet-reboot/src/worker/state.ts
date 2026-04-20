import type {
  GameSnapshot,
  InvestMode,
  LaunderingProfile,
  MessageRewardType,
  MessageTone,
  NarrativeMessage,
  PhaseSnapshot,
  PersistedGameState,
  UpgradeOfferSnapshot,
} from '../game/types';
import {
  computeFbiInterventionChancePerSecondBps,
  resolveFbiRiskState,
} from './domain/economy/riskModel';
import { resolvePhaseProgress } from './domain/phases';
import { UPGRADE_CHAINS } from './domain/upgrades/chains';

export interface EngineResources {
  bots: bigint;
  queuedTargets: bigint;
  dirtyMoney: bigint;
  darkMoney: bigint;
  portfolio: bigint;
  warIntel: bigint;
  hz: bigint;
  brainMatter: bigint;
  computronium: bigint;
}

export interface EngineRates {
  manualScanGain: bigint;
  manualScanCommandCooldownBaseMs: number;
  exploitChanceBps: number;
  manualExploitCooldownBaseMs: number;
  autoScanPerSec: bigint;
  autoExploitPerSec: bigint;
  monetizeBotsPerSec: bigint;
  launderingDirtyPerSec: bigint;
  launderingEfficiencyBps: number;
  fbiCountermeasureCostMoney: bigint;
  moneyYieldBps: number;
  investStableBps: number;
  investAggressiveMinBps: number;
  investAggressiveMaxBps: number;
  maintenancePerThousandBots: bigint;
  heatPerMonetizePerSec: number;
  heatPerAggressivePerSec: number;
  messageIntervalBaseMs: number;
}

export interface EngineSystems {
  monetizeActive: boolean;
  launderingActive: boolean;
  launderingProfile: LaunderingProfile;
  launderingLockdownMs: number;
  fbiSuspicion: number;
  fbiCountermeasureCooldownMs: number;
  investMode: InvestMode;
  manualScanCooldownMs: number;
  manualExploitCooldownMs: number;
}

export interface EngineWar {
  heat: number;
  wins: number;
  losses: number;
  streak: number;
  attackCooldownMs: number;
  fortifyCooldownMs: number;
  defenseRemainingMs: number;
  detectionAccumulatorMs: number;
  projectedSuccessBps: number;
  attackCostBots: bigint;
  scrubCostMoney: bigint;
  fortifyCostMoney: bigint;
  fortifyCostIntel: bigint;
}

export interface EngineMatrix {
  unlocked: boolean;
  stability: number;
  breachProgress: number;
  bypassRemainingMs: number;
  expectedCommand: string;
  successfulInjections: number;
  failedInjections: number;
  armCostHz: bigint;
  armCostComputronium: bigint;
  injectCostHz: bigint;
  injectCostComputronium: bigint;
  stabilizeCostMoney: bigint;
}

export interface EngineMessage extends NarrativeMessage {
  rewardType: MessageRewardType;
  tone: MessageTone;
}

export interface EngineMessages {
  pending: EngineMessage[];
  processed: number;
  sequence: number;
  nextAtMs: number;
}

export interface EngineUpgrades {
  levels: Record<string, number>;
  offers: UpgradeOfferSnapshot[];
  totalOwnedLevels: number;
  totalMaxLevels: number;
}

export interface EngineMilestones {
  scans: number;
  exploitAttempts: number;
  exploitSuccesses: number;
  investments: number;
  warAttacks: number;
  warWins: number;
  messagesHandled: number;
}

export interface EngineTelemetry {
  botsPerSec: bigint;
  moneyPerSec: bigint;
  heatPerSec: number;
}

export interface EngineState {
  version: number;
  tick: number;
  nowMs: number;
  turbo: number;
  phase: PhaseSnapshot;
  resources: EngineResources;
  rates: EngineRates;
  systems: EngineSystems;
  war: EngineWar;
  matrix: EngineMatrix;
  messages: EngineMessages;
  upgrades: EngineUpgrades;
  milestones: EngineMilestones;
  telemetry: EngineTelemetry;
  logSequence: number;
}

const MESSAGE_TONES: ReadonlyArray<MessageTone> = ['positive', 'neutral', 'negative'];
const MESSAGE_REWARD_TYPES: ReadonlyArray<MessageRewardType> = [
  'bots',
  'targets',
  'money',
  'portfolio',
  'intel',
  'heat-relief',
];
const UPGRADE_CHAIN_ID_SET = new Set(UPGRADE_CHAINS.map((chain) => chain.chainId));

function clampNumber(value: unknown, fallback: number, min: number, max: number): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(min, Math.min(max, numeric));
}

function clampInteger(value: unknown, fallback: number, min: number, max: number): number {
  return Math.floor(clampNumber(value, fallback, min, max));
}

function parseBigIntValue(value: unknown, fallback: bigint): bigint {
  if (typeof value === 'bigint') {
    return value;
  }

  if (typeof value === 'number' && Number.isInteger(value)) {
    return BigInt(value);
  }

  if (typeof value === 'string') {
    try {
      return BigInt(value);
    } catch {
      return fallback;
    }
  }

  return fallback;
}

function parseInvestMode(value: unknown, fallback: InvestMode): InvestMode {
  if (value === 'stable' || value === 'aggressive') {
    return value;
  }

  return fallback;
}

function parseLaunderingProfile(
  value: unknown,
  fallback: LaunderingProfile,
): LaunderingProfile {
  if (value === 'low-risk' || value === 'high-yield') {
    return value;
  }

  return fallback;
}

function parseMessageTone(value: unknown, fallback: MessageTone): MessageTone {
  if (typeof value === 'string' && MESSAGE_TONES.includes(value as MessageTone)) {
    return value as MessageTone;
  }

  return fallback;
}

function parseMessageRewardType(
  value: unknown,
  fallback: MessageRewardType,
): MessageRewardType {
  if (typeof value === 'string' && MESSAGE_REWARD_TYPES.includes(value as MessageRewardType)) {
    return value as MessageRewardType;
  }

  return fallback;
}

function sanitizePendingMessage(
  value: unknown,
  fallbackId: string,
  fallbackNowMs: number,
): EngineMessage | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const raw = value as Partial<EngineMessage>;
  const source = typeof raw.source === 'string' ? raw.source : '';
  const subject = typeof raw.subject === 'string' ? raw.subject : '';
  const body = typeof raw.body === 'string' ? raw.body : '';
  if (source.length === 0 || subject.length === 0 || body.length === 0) {
    return null;
  }

  return {
    id: typeof raw.id === 'string' && raw.id.length > 0 ? raw.id : fallbackId,
    source,
    tone: parseMessageTone(raw.tone, 'neutral'),
    subject,
    body,
    rewardType: parseMessageRewardType(raw.rewardType, 'bots'),
    rewardValue:
      typeof raw.rewardValue === 'string' && raw.rewardValue.length > 0 ? raw.rewardValue : '0',
    rewardLabel: typeof raw.rewardLabel === 'string' ? raw.rewardLabel : '',
    quarantineCost:
      typeof raw.quarantineCost === 'string' && raw.quarantineCost.length > 0
        ? raw.quarantineCost
        : '0',
    createdAtMs: clampInteger(raw.createdAtMs, fallbackNowMs, 0, Number.MAX_SAFE_INTEGER),
  };
}

function sanitizePendingMessages(value: unknown, fallbackNowMs: number): EngineMessage[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const maxMessages = 120;
  const sanitized: EngineMessage[] = [];

  for (let index = 0; index < value.length; index += 1) {
    if (sanitized.length >= maxMessages) break;
    const parsed = sanitizePendingMessage(
      value[index],
      'msg-restored-' + index,
      fallbackNowMs,
    );
    if (parsed) {
      sanitized.push(parsed);
    }
  }

  return sanitized;
}

function sanitizeUpgradeLevels(value: unknown): Record<string, number> {
  if (!value || typeof value !== 'object') {
    return {};
  }

  const parsed = value as Record<string, unknown>;
  const levels: Record<string, number> = {};

  for (const [chainId, levelValue] of Object.entries(parsed)) {
    if (!UPGRADE_CHAIN_ID_SET.has(chainId)) {
      continue;
    }

    const level = clampInteger(levelValue, 0, 0, 99);
    if (level > 0) {
      levels[chainId] = level;
    }
  }

  return levels;
}

export function createInitialEngineState(nowMs: number): EngineState {
  const phase = resolvePhaseProgress({
    bots: 0n,
    scans: 0,
    darkMoney: 0n,
    portfolio: 0n,
    warWins: 0,
    messagesProcessed: 0,
    exploitSuccesses: 0,
  });

  return {
    version: 1,
    tick: 0,
    nowMs,
    turbo: 1,
    phase,
    resources: {
      bots: 0n,
      queuedTargets: 0n,
      dirtyMoney: 0n,
      darkMoney: 0n,
      portfolio: 0n,
      warIntel: 0n,
      hz: 0n,
      brainMatter: 0n,
      computronium: 0n,
    },
    rates: {
      manualScanGain: 1n,
      manualScanCommandCooldownBaseMs: 140,
      exploitChanceBps: 6200,
      manualExploitCooldownBaseMs: 2000,
      autoScanPerSec: 0n,
      autoExploitPerSec: 0n,
      monetizeBotsPerSec: 2n,
      launderingDirtyPerSec: 3n,
      launderingEfficiencyBps: 8200,
      fbiCountermeasureCostMoney: 260n,
      moneyYieldBps: 6200,
      investStableBps: 8,
      investAggressiveMinBps: -22,
      investAggressiveMaxBps: 30,
      maintenancePerThousandBots: 2n,
      heatPerMonetizePerSec: 6,
      heatPerAggressivePerSec: 3,
      messageIntervalBaseMs: 85_000,
    },
    systems: {
      monetizeActive: false,
      launderingActive: true,
      launderingProfile: 'low-risk',
      launderingLockdownMs: 0,
      fbiSuspicion: 0,
      fbiCountermeasureCooldownMs: 0,
      investMode: 'stable',
      manualScanCooldownMs: 0,
      manualExploitCooldownMs: 0,
    },
    war: {
      heat: 0,
      wins: 0,
      losses: 0,
      streak: 0,
      attackCooldownMs: 0,
      fortifyCooldownMs: 0,
      defenseRemainingMs: 0,
      detectionAccumulatorMs: 0,
      projectedSuccessBps: 4500,
      attackCostBots: 120n,
      scrubCostMoney: 180n,
      fortifyCostMoney: 500n,
      fortifyCostIntel: 3n,
    },
    matrix: {
      unlocked: false,
      stability: 10000,
      breachProgress: 0,
      bypassRemainingMs: 0,
      expectedCommand: 'inject fractal.root --f12',
      successfulInjections: 0,
      failedInjections: 0,
      armCostHz: 1200n,
      armCostComputronium: 8n,
      injectCostHz: 1800n,
      injectCostComputronium: 6n,
      stabilizeCostMoney: 2400n,
    },
    messages: {
      pending: [],
      processed: 0,
      sequence: 0,
      nextAtMs: nowMs + 25_000,
    },
    upgrades: {
      levels: {},
      offers: [],
      totalOwnedLevels: 0,
      totalMaxLevels: 0,
    },
    milestones: {
      scans: 0,
      exploitAttempts: 0,
      exploitSuccesses: 0,
      investments: 0,
      warAttacks: 0,
      warWins: 0,
      messagesHandled: 0,
    },
    telemetry: {
      botsPerSec: 0n,
      moneyPerSec: 0n,
      heatPerSec: 0,
    },
    logSequence: 0,
  };
}

export function toPersistedState(
  state: EngineState,
  schemaVersion: number,
  savedAtMs: number,
): PersistedGameState {
  return {
    schemaVersion,
    savedAtMs,
    state: {
      version: state.version,
      tick: state.tick,
      nowMs: state.nowMs,
      turbo: state.turbo,
      resources: {
        bots: state.resources.bots.toString(),
        queuedTargets: state.resources.queuedTargets.toString(),
        dirtyMoney: state.resources.dirtyMoney.toString(),
        darkMoney: state.resources.darkMoney.toString(),
        portfolio: state.resources.portfolio.toString(),
        warIntel: state.resources.warIntel.toString(),
        hz: state.resources.hz.toString(),
        brainMatter: state.resources.brainMatter.toString(),
        computronium: state.resources.computronium.toString(),
      },
      rates: {
        manualScanGain: state.rates.manualScanGain.toString(),
        manualScanCommandCooldownBaseMs: state.rates.manualScanCommandCooldownBaseMs,
        exploitChanceBps: state.rates.exploitChanceBps,
        manualExploitCooldownBaseMs: state.rates.manualExploitCooldownBaseMs,
        autoScanPerSec: state.rates.autoScanPerSec.toString(),
        autoExploitPerSec: state.rates.autoExploitPerSec.toString(),
        monetizeBotsPerSec: state.rates.monetizeBotsPerSec.toString(),
        launderingDirtyPerSec: state.rates.launderingDirtyPerSec.toString(),
        launderingEfficiencyBps: state.rates.launderingEfficiencyBps,
        fbiCountermeasureCostMoney: state.rates.fbiCountermeasureCostMoney.toString(),
        moneyYieldBps: state.rates.moneyYieldBps,
        investStableBps: state.rates.investStableBps,
        investAggressiveMinBps: state.rates.investAggressiveMinBps,
        investAggressiveMaxBps: state.rates.investAggressiveMaxBps,
        maintenancePerThousandBots: state.rates.maintenancePerThousandBots.toString(),
        heatPerMonetizePerSec: state.rates.heatPerMonetizePerSec,
        heatPerAggressivePerSec: state.rates.heatPerAggressivePerSec,
        messageIntervalBaseMs: state.rates.messageIntervalBaseMs,
      },
      systems: {
        monetizeActive: state.systems.monetizeActive,
        launderingActive: state.systems.launderingActive,
        launderingProfile: state.systems.launderingProfile,
        launderingLockdownMs: state.systems.launderingLockdownMs,
        fbiSuspicion: state.systems.fbiSuspicion,
        fbiCountermeasureCooldownMs: state.systems.fbiCountermeasureCooldownMs,
        investMode: state.systems.investMode,
        manualScanCooldownMs: state.systems.manualScanCooldownMs,
        manualExploitCooldownMs: state.systems.manualExploitCooldownMs,
      },
      war: {
        heat: state.war.heat,
        wins: state.war.wins,
        losses: state.war.losses,
        streak: state.war.streak,
        attackCooldownMs: state.war.attackCooldownMs,
        fortifyCooldownMs: state.war.fortifyCooldownMs,
        defenseRemainingMs: state.war.defenseRemainingMs,
        detectionAccumulatorMs: state.war.detectionAccumulatorMs,
        projectedSuccessBps: state.war.projectedSuccessBps,
        attackCostBots: state.war.attackCostBots.toString(),
        scrubCostMoney: state.war.scrubCostMoney.toString(),
        fortifyCostMoney: state.war.fortifyCostMoney.toString(),
        fortifyCostIntel: state.war.fortifyCostIntel.toString(),
      },
      matrix: {
        unlocked: state.matrix.unlocked,
        stability: state.matrix.stability,
        breachProgress: state.matrix.breachProgress,
        bypassRemainingMs: state.matrix.bypassRemainingMs,
        expectedCommand: state.matrix.expectedCommand,
        successfulInjections: state.matrix.successfulInjections,
        failedInjections: state.matrix.failedInjections,
        armCostHz: state.matrix.armCostHz.toString(),
        armCostComputronium: state.matrix.armCostComputronium.toString(),
        injectCostHz: state.matrix.injectCostHz.toString(),
        injectCostComputronium: state.matrix.injectCostComputronium.toString(),
        stabilizeCostMoney: state.matrix.stabilizeCostMoney.toString(),
      },
      messages: {
        pending: state.messages.pending.map((message) => ({ ...message })),
        processed: state.messages.processed,
        sequence: state.messages.sequence,
        nextAtMs: state.messages.nextAtMs,
      },
      upgrades: {
        levels: { ...state.upgrades.levels },
        totalOwnedLevels: state.upgrades.totalOwnedLevels,
        totalMaxLevels: state.upgrades.totalMaxLevels,
      },
      milestones: {
        scans: state.milestones.scans,
        exploitAttempts: state.milestones.exploitAttempts,
        exploitSuccesses: state.milestones.exploitSuccesses,
        investments: state.milestones.investments,
        warAttacks: state.milestones.warAttacks,
        warWins: state.milestones.warWins,
        messagesHandled: state.milestones.messagesHandled,
      },
      telemetry: {
        botsPerSec: state.telemetry.botsPerSec.toString(),
        moneyPerSec: state.telemetry.moneyPerSec.toString(),
        heatPerSec: state.telemetry.heatPerSec,
      },
      logSequence: state.logSequence,
    },
  };
}

export function fromPersistedState(payload: PersistedGameState, fallbackNowMs: number): EngineState {
  const fallback = createInitialEngineState(fallbackNowMs);
  const persistedState = payload.state;
  const restoredNowMs = clampInteger(
    persistedState.nowMs,
    fallback.nowMs,
    0,
    Number.MAX_SAFE_INTEGER,
  );

  const restoredState: EngineState = {
    ...fallback,
    version: clampInteger(persistedState.version, fallback.version, 1, 10_000),
    tick: clampInteger(persistedState.tick, fallback.tick, 0, Number.MAX_SAFE_INTEGER),
    nowMs: restoredNowMs,
    turbo: clampInteger(persistedState.turbo, fallback.turbo, 1, 40),
    phase: fallback.phase,
    resources: {
      bots: parseBigIntValue(persistedState.resources.bots, fallback.resources.bots),
      queuedTargets: parseBigIntValue(
        persistedState.resources.queuedTargets,
        fallback.resources.queuedTargets,
      ),
      dirtyMoney: parseBigIntValue(persistedState.resources.dirtyMoney, fallback.resources.dirtyMoney),
      darkMoney: parseBigIntValue(persistedState.resources.darkMoney, fallback.resources.darkMoney),
      portfolio: parseBigIntValue(persistedState.resources.portfolio, fallback.resources.portfolio),
      warIntel: parseBigIntValue(persistedState.resources.warIntel, fallback.resources.warIntel),
      hz: parseBigIntValue(persistedState.resources.hz, fallback.resources.hz),
      brainMatter: parseBigIntValue(
        persistedState.resources.brainMatter,
        fallback.resources.brainMatter,
      ),
      computronium: parseBigIntValue(
        persistedState.resources.computronium,
        fallback.resources.computronium,
      ),
    },
    rates: {
      manualScanGain: parseBigIntValue(persistedState.rates.manualScanGain, fallback.rates.manualScanGain),
      manualScanCommandCooldownBaseMs: clampInteger(
        persistedState.rates.manualScanCommandCooldownBaseMs,
        fallback.rates.manualScanCommandCooldownBaseMs,
        0,
        20_000,
      ),
      exploitChanceBps: clampInteger(
        persistedState.rates.exploitChanceBps,
        fallback.rates.exploitChanceBps,
        0,
        10_000,
      ),
      manualExploitCooldownBaseMs: clampInteger(
        persistedState.rates.manualExploitCooldownBaseMs,
        fallback.rates.manualExploitCooldownBaseMs,
        0,
        120_000,
      ),
      autoScanPerSec: parseBigIntValue(persistedState.rates.autoScanPerSec, fallback.rates.autoScanPerSec),
      autoExploitPerSec: parseBigIntValue(
        persistedState.rates.autoExploitPerSec,
        fallback.rates.autoExploitPerSec,
      ),
      monetizeBotsPerSec: parseBigIntValue(
        persistedState.rates.monetizeBotsPerSec,
        fallback.rates.monetizeBotsPerSec,
      ),
      launderingDirtyPerSec: parseBigIntValue(
        persistedState.rates.launderingDirtyPerSec,
        fallback.rates.launderingDirtyPerSec,
      ),
      launderingEfficiencyBps: clampInteger(
        persistedState.rates.launderingEfficiencyBps,
        fallback.rates.launderingEfficiencyBps,
        1000,
        10_000,
      ),
      fbiCountermeasureCostMoney: parseBigIntValue(
        persistedState.rates.fbiCountermeasureCostMoney,
        fallback.rates.fbiCountermeasureCostMoney,
      ),
      moneyYieldBps: clampInteger(
        persistedState.rates.moneyYieldBps,
        fallback.rates.moneyYieldBps,
        0,
        10_000,
      ),
      investStableBps: clampInteger(
        persistedState.rates.investStableBps,
        fallback.rates.investStableBps,
        -1000,
        10_000,
      ),
      investAggressiveMinBps: clampInteger(
        persistedState.rates.investAggressiveMinBps,
        fallback.rates.investAggressiveMinBps,
        -10_000,
        10_000,
      ),
      investAggressiveMaxBps: clampInteger(
        persistedState.rates.investAggressiveMaxBps,
        fallback.rates.investAggressiveMaxBps,
        -10_000,
        10_000,
      ),
      maintenancePerThousandBots: parseBigIntValue(
        persistedState.rates.maintenancePerThousandBots,
        fallback.rates.maintenancePerThousandBots,
      ),
      heatPerMonetizePerSec: clampInteger(
        persistedState.rates.heatPerMonetizePerSec,
        fallback.rates.heatPerMonetizePerSec,
        -100,
        1_000,
      ),
      heatPerAggressivePerSec: clampInteger(
        persistedState.rates.heatPerAggressivePerSec,
        fallback.rates.heatPerAggressivePerSec,
        -100,
        1_000,
      ),
      messageIntervalBaseMs: clampInteger(
        persistedState.rates.messageIntervalBaseMs,
        fallback.rates.messageIntervalBaseMs,
        1_000,
        300_000,
      ),
    },
    systems: {
      monetizeActive: Boolean(persistedState.systems.monetizeActive),
      launderingActive: Boolean(persistedState.systems.launderingActive),
      launderingProfile: parseLaunderingProfile(
        persistedState.systems.launderingProfile,
        fallback.systems.launderingProfile,
      ),
      launderingLockdownMs: clampInteger(
        persistedState.systems.launderingLockdownMs,
        fallback.systems.launderingLockdownMs,
        0,
        240_000,
      ),
      fbiSuspicion: clampInteger(
        persistedState.systems.fbiSuspicion,
        fallback.systems.fbiSuspicion,
        0,
        10_000,
      ),
      fbiCountermeasureCooldownMs: clampInteger(
        persistedState.systems.fbiCountermeasureCooldownMs,
        fallback.systems.fbiCountermeasureCooldownMs,
        0,
        120_000,
      ),
      investMode: parseInvestMode(persistedState.systems.investMode, fallback.systems.investMode),
      manualScanCooldownMs: clampInteger(
        persistedState.systems.manualScanCooldownMs,
        fallback.systems.manualScanCooldownMs,
        0,
        120_000,
      ),
      manualExploitCooldownMs: clampInteger(
        persistedState.systems.manualExploitCooldownMs,
        fallback.systems.manualExploitCooldownMs,
        0,
        120_000,
      ),
    },
    war: {
      heat: clampInteger(persistedState.war.heat, fallback.war.heat, 0, 10_000),
      wins: clampInteger(persistedState.war.wins, fallback.war.wins, 0, Number.MAX_SAFE_INTEGER),
      losses: clampInteger(
        persistedState.war.losses,
        fallback.war.losses,
        0,
        Number.MAX_SAFE_INTEGER,
      ),
      streak: clampInteger(
        persistedState.war.streak,
        fallback.war.streak,
        0,
        Number.MAX_SAFE_INTEGER,
      ),
      attackCooldownMs: clampInteger(
        persistedState.war.attackCooldownMs,
        fallback.war.attackCooldownMs,
        0,
        240_000,
      ),
      fortifyCooldownMs: clampInteger(
        persistedState.war.fortifyCooldownMs,
        fallback.war.fortifyCooldownMs,
        0,
        240_000,
      ),
      defenseRemainingMs: clampInteger(
        persistedState.war.defenseRemainingMs,
        fallback.war.defenseRemainingMs,
        0,
        240_000,
      ),
      detectionAccumulatorMs: clampInteger(
        persistedState.war.detectionAccumulatorMs,
        fallback.war.detectionAccumulatorMs,
        0,
        60_000,
      ),
      projectedSuccessBps: clampInteger(
        persistedState.war.projectedSuccessBps,
        fallback.war.projectedSuccessBps,
        0,
        10_000,
      ),
      attackCostBots: parseBigIntValue(persistedState.war.attackCostBots, fallback.war.attackCostBots),
      scrubCostMoney: parseBigIntValue(persistedState.war.scrubCostMoney, fallback.war.scrubCostMoney),
      fortifyCostMoney: parseBigIntValue(
        persistedState.war.fortifyCostMoney,
        fallback.war.fortifyCostMoney,
      ),
      fortifyCostIntel: parseBigIntValue(
        persistedState.war.fortifyCostIntel,
        fallback.war.fortifyCostIntel,
      ),
    },
    matrix: {
      unlocked: Boolean(persistedState.matrix.unlocked),
      stability: clampInteger(
        persistedState.matrix.stability,
        fallback.matrix.stability,
        0,
        10_000,
      ),
      breachProgress: clampInteger(
        persistedState.matrix.breachProgress,
        fallback.matrix.breachProgress,
        0,
        100,
      ),
      bypassRemainingMs: clampInteger(
        persistedState.matrix.bypassRemainingMs,
        fallback.matrix.bypassRemainingMs,
        0,
        240_000,
      ),
      expectedCommand:
        typeof persistedState.matrix.expectedCommand === 'string' &&
        persistedState.matrix.expectedCommand.length > 0
          ? persistedState.matrix.expectedCommand
          : fallback.matrix.expectedCommand,
      successfulInjections: clampInteger(
        persistedState.matrix.successfulInjections,
        fallback.matrix.successfulInjections,
        0,
        Number.MAX_SAFE_INTEGER,
      ),
      failedInjections: clampInteger(
        persistedState.matrix.failedInjections,
        fallback.matrix.failedInjections,
        0,
        Number.MAX_SAFE_INTEGER,
      ),
      armCostHz: parseBigIntValue(persistedState.matrix.armCostHz, fallback.matrix.armCostHz),
      armCostComputronium: parseBigIntValue(
        persistedState.matrix.armCostComputronium,
        fallback.matrix.armCostComputronium,
      ),
      injectCostHz: parseBigIntValue(
        persistedState.matrix.injectCostHz,
        fallback.matrix.injectCostHz,
      ),
      injectCostComputronium: parseBigIntValue(
        persistedState.matrix.injectCostComputronium,
        fallback.matrix.injectCostComputronium,
      ),
      stabilizeCostMoney: parseBigIntValue(
        persistedState.matrix.stabilizeCostMoney,
        fallback.matrix.stabilizeCostMoney,
      ),
    },
    messages: {
      pending: sanitizePendingMessages(persistedState.messages.pending, restoredNowMs),
      processed: clampInteger(
        persistedState.messages.processed,
        fallback.messages.processed,
        0,
        Number.MAX_SAFE_INTEGER,
      ),
      sequence: clampInteger(
        persistedState.messages.sequence,
        fallback.messages.sequence,
        0,
        Number.MAX_SAFE_INTEGER,
      ),
      nextAtMs: clampInteger(
        persistedState.messages.nextAtMs,
        restoredNowMs + 25_000,
        0,
        Number.MAX_SAFE_INTEGER,
      ),
    },
    upgrades: {
      levels: sanitizeUpgradeLevels(persistedState.upgrades.levels),
      offers: [],
      totalOwnedLevels: clampInteger(
        persistedState.upgrades.totalOwnedLevels,
        fallback.upgrades.totalOwnedLevels,
        0,
        Number.MAX_SAFE_INTEGER,
      ),
      totalMaxLevels: clampInteger(
        persistedState.upgrades.totalMaxLevels,
        fallback.upgrades.totalMaxLevels,
        0,
        Number.MAX_SAFE_INTEGER,
      ),
    },
    milestones: {
      scans: clampInteger(
        persistedState.milestones.scans,
        fallback.milestones.scans,
        0,
        Number.MAX_SAFE_INTEGER,
      ),
      exploitAttempts: clampInteger(
        persistedState.milestones.exploitAttempts,
        fallback.milestones.exploitAttempts,
        0,
        Number.MAX_SAFE_INTEGER,
      ),
      exploitSuccesses: clampInteger(
        persistedState.milestones.exploitSuccesses,
        fallback.milestones.exploitSuccesses,
        0,
        Number.MAX_SAFE_INTEGER,
      ),
      investments: clampInteger(
        persistedState.milestones.investments,
        fallback.milestones.investments,
        0,
        Number.MAX_SAFE_INTEGER,
      ),
      warAttacks: clampInteger(
        persistedState.milestones.warAttacks,
        fallback.milestones.warAttacks,
        0,
        Number.MAX_SAFE_INTEGER,
      ),
      warWins: clampInteger(
        persistedState.milestones.warWins,
        fallback.milestones.warWins,
        0,
        Number.MAX_SAFE_INTEGER,
      ),
      messagesHandled: clampInteger(
        persistedState.milestones.messagesHandled,
        fallback.milestones.messagesHandled,
        0,
        Number.MAX_SAFE_INTEGER,
      ),
    },
    telemetry: {
      botsPerSec: parseBigIntValue(persistedState.telemetry.botsPerSec, fallback.telemetry.botsPerSec),
      moneyPerSec: parseBigIntValue(
        persistedState.telemetry.moneyPerSec,
        fallback.telemetry.moneyPerSec,
      ),
      heatPerSec: clampNumber(
        persistedState.telemetry.heatPerSec,
        fallback.telemetry.heatPerSec,
        -10_000,
        10_000,
      ),
    },
    logSequence: clampInteger(
      persistedState.logSequence,
      fallback.logSequence,
      0,
      Number.MAX_SAFE_INTEGER,
    ),
  };

  if (restoredState.messages.sequence < restoredState.messages.pending.length) {
    restoredState.messages.sequence = restoredState.messages.pending.length;
  }

  return restoredState;
}

export function toSnapshot(state: EngineState): GameSnapshot {
  const maintenancePerSecond =
    (state.resources.bots / 1000n) * state.rates.maintenancePerThousandBots;

  return {
    version: state.version,
    tick: state.tick,
    timestampMs: state.nowMs,
    phase: state.phase,
    resources: {
      bots: state.resources.bots.toString(),
      queuedTargets: state.resources.queuedTargets.toString(),
      dirtyMoney: state.resources.dirtyMoney.toString(),
      darkMoney: state.resources.darkMoney.toString(),
      portfolio: state.resources.portfolio.toString(),
      warIntel: state.resources.warIntel.toString(),
      hz: state.resources.hz.toString(),
      brainMatter: state.resources.brainMatter.toString(),
      computronium: state.resources.computronium.toString(),
    },
    economy: {
      monetizeActive: state.systems.monetizeActive,
      monetizeBotsPerSec: state.rates.monetizeBotsPerSec.toString(),
      dirtyMoney: state.resources.dirtyMoney.toString(),
      launderingActive: state.systems.launderingActive,
      launderingProfile: state.systems.launderingProfile,
      launderingThroughputPerSec: state.rates.launderingDirtyPerSec.toString(),
      launderingEfficiencyBps: state.rates.launderingEfficiencyBps,
      launderingLockdownMs: state.systems.launderingLockdownMs,
      fbiSuspicion: state.systems.fbiSuspicion,
      fbiRiskState: resolveFbiRiskState(state.systems.fbiSuspicion),
      fbiInterventionChanceBps: computeFbiInterventionChancePerSecondBps({
        phaseIndex: state.phase.index,
        suspicion: state.systems.fbiSuspicion,
        launderingProfile: state.systems.launderingProfile,
      }),
      fbiCountermeasureCost: state.rates.fbiCountermeasureCostMoney.toString(),
      fbiCountermeasureCooldownMs: state.systems.fbiCountermeasureCooldownMs,
      moneyYieldBps: state.rates.moneyYieldBps,
      exploitCooldownMs: state.systems.manualExploitCooldownMs,
      exploitCooldownBaseMs: state.rates.manualExploitCooldownBaseMs,
      investMode: state.systems.investMode,
      stableInvestBps: state.rates.investStableBps,
      aggressiveInvestMinBps: state.rates.investAggressiveMinBps,
      aggressiveInvestMaxBps: state.rates.investAggressiveMaxBps,
      maintenanceMoneyPerSec: maintenancePerSecond.toString(),
    },
    war: {
      heat: state.war.heat,
      wins: state.war.wins,
      losses: state.war.losses,
      streak: state.war.streak,
      attackCooldownMs: state.war.attackCooldownMs,
      fortifyCooldownMs: state.war.fortifyCooldownMs,
      defenseRemainingMs: state.war.defenseRemainingMs,
      attackCostBots: state.war.attackCostBots.toString(),
      scrubCostMoney: state.war.scrubCostMoney.toString(),
      fortifyCostMoney: state.war.fortifyCostMoney.toString(),
      fortifyCostIntel: state.war.fortifyCostIntel.toString(),
      projectedSuccessBps: state.war.projectedSuccessBps,
    },
    matrix: {
      unlocked: state.matrix.unlocked,
      stability: state.matrix.stability,
      breachProgress: state.matrix.breachProgress,
      bypassRemainingMs: state.matrix.bypassRemainingMs,
      expectedCommand: state.matrix.expectedCommand,
      successfulInjections: state.matrix.successfulInjections,
      failedInjections: state.matrix.failedInjections,
      armCostHz: state.matrix.armCostHz.toString(),
      armCostComputronium: state.matrix.armCostComputronium.toString(),
      injectCostHz: state.matrix.injectCostHz.toString(),
      injectCostComputronium: state.matrix.injectCostComputronium.toString(),
      stabilizeCostMoney: state.matrix.stabilizeCostMoney.toString(),
    },
    messages: {
      unread: state.messages.pending.length,
      processed: state.messages.processed,
      pending: state.messages.pending,
      nextInMs: Math.max(0, state.messages.nextAtMs - state.nowMs),
    },
    upgrades: {
      totalOwnedLevels: state.upgrades.totalOwnedLevels,
      totalMaxLevels: state.upgrades.totalMaxLevels,
      offers: state.upgrades.offers,
    },
    progression: {
      scans: state.milestones.scans,
      exploitAttempts: state.milestones.exploitAttempts,
      exploitSuccesses: state.milestones.exploitSuccesses,
      investments: state.milestones.investments,
      warAttacks: state.milestones.warAttacks,
      warWins: state.milestones.warWins,
      messagesHandled: state.milestones.messagesHandled,
    },
    telemetry: {
      botsPerSec: state.telemetry.botsPerSec.toString(),
      moneyPerSec: state.telemetry.moneyPerSec.toString(),
      heatPerSec: state.telemetry.heatPerSec,
    },
  };
}
