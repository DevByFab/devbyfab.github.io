import type {
  GameSnapshot,
  InvestMode,
  MessageRewardType,
  MessageTone,
  NarrativeMessage,
  PhaseSnapshot,
} from '../game/types';
import { resolvePhaseProgress } from './domain/phases';

export interface EngineResources {
  bots: bigint;
  queuedTargets: bigint;
  darkMoney: bigint;
  portfolio: bigint;
  warIntel: bigint;
  hz: bigint;
  brainMatter: bigint;
  computronium: bigint;
}

export interface EngineRates {
  manualScanGain: bigint;
  exploitChanceBps: number;
  autoScanPerSec: bigint;
  autoExploitPerSec: bigint;
  monetizeBotsPerSec: bigint;
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
  investMode: InvestMode;
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
  telemetry: EngineTelemetry;
  logSequence: number;
}

export function createInitialEngineState(nowMs: number): EngineState {
  const phase = resolvePhaseProgress(0n);

  return {
    version: 1,
    tick: 0,
    nowMs,
    turbo: 1,
    phase,
    resources: {
      bots: 0n,
      queuedTargets: 0n,
      darkMoney: 0n,
      portfolio: 0n,
      warIntel: 0n,
      hz: 0n,
      brainMatter: 0n,
      computronium: 0n,
    },
    rates: {
      manualScanGain: 1n,
      exploitChanceBps: 6200,
      autoScanPerSec: 0n,
      autoExploitPerSec: 0n,
      monetizeBotsPerSec: 2n,
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
      investMode: 'stable',
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
    telemetry: {
      botsPerSec: 0n,
      moneyPerSec: 0n,
      heatPerSec: 0,
    },
    logSequence: 0,
  };
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
      moneyYieldBps: state.rates.moneyYieldBps,
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
    telemetry: {
      botsPerSec: state.telemetry.botsPerSec.toString(),
      moneyPerSec: state.telemetry.moneyPerSec.toString(),
      heatPerSec: state.telemetry.heatPerSec,
    },
  };
}
