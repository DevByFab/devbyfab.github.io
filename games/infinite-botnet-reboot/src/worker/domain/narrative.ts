import { FR_NARRATIVE_CATALOG, type FrNarrativeTemplate, type NarrativeBucket } from '../../content/fr/narrativeCatalog';
import type { EngineMessage, EngineState } from '../state';
import { computeUpgradeEffects } from './upgrades';

export type MessageProcessResult = 'none' | 'positive' | 'negative';

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function maxBigInt(left: bigint, right: bigint): bigint {
  return left > right ? left : right;
}

function allowedRewardTypesForPhase(phaseIndex: number): ReadonlySet<FrNarrativeTemplate['rewardType']> {
  if (phaseIndex < 2) {
    return new Set<FrNarrativeTemplate['rewardType']>();
  }

  if (phaseIndex === 2) {
    return new Set<FrNarrativeTemplate['rewardType']>(['bots', 'targets']);
  }

  if (phaseIndex === 3) {
    return new Set<FrNarrativeTemplate['rewardType']>(['bots', 'targets', 'money', 'portfolio']);
  }

  if (phaseIndex === 4) {
    return new Set<FrNarrativeTemplate['rewardType']>([
      'bots',
      'targets',
      'money',
      'portfolio',
      'intel',
    ]);
  }

  return new Set<FrNarrativeTemplate['rewardType']>([
    'bots',
    'targets',
    'money',
    'portfolio',
    'intel',
    'heat-relief',
  ]);
}

function pickTemplateForPhase(
  bucket: NarrativeBucket,
  rewardTypes: ReadonlySet<FrNarrativeTemplate['rewardType']>,
): FrNarrativeTemplate {
  const bucketCandidates = FR_NARRATIVE_CATALOG[bucket].filter((candidate) =>
    rewardTypes.has(candidate.rewardType),
  );

  if (bucketCandidates.length > 0) {
    const index = Math.floor(Math.random() * bucketCandidates.length);
    return bucketCandidates[index];
  }

  const globalCandidates = Object.values(FR_NARRATIVE_CATALOG)
    .flat()
    .filter((candidate) => rewardTypes.has(candidate.rewardType));
  const fallbackIndex = Math.floor(Math.random() * globalCandidates.length);
  return globalCandidates[fallbackIndex];
}

function pickBucket(state: EngineState): NarrativeBucket {
  if (state.matrix.unlocked && state.matrix.stability <= 3200) return 'matrix';
  if (state.war.heat >= 7600) return 'warning';
  if (state.war.streak >= 2 || state.war.wins > state.war.losses) return 'war';
  return 'economy';
}

function computeRewardValue(state: EngineState, template: FrNarrativeTemplate): bigint {
  switch (template.rewardType) {
    case 'bots':
      return maxBigInt(30n, state.resources.bots / 45n + 18n);
    case 'targets':
      return maxBigInt(12n, state.resources.queuedTargets / 4n + 10n);
    case 'money':
      return maxBigInt(70n, state.resources.darkMoney / 38n + 35n);
    case 'portfolio':
      return maxBigInt(50n, state.resources.portfolio / 28n + 25n);
    case 'intel':
      return BigInt(4 + Math.floor(state.phase.index / 2));
    case 'heat-relief':
      return BigInt(240 + state.phase.index * 30);
    default:
      return 0n;
  }
}

function describeReward(
  rewardType: FrNarrativeTemplate['rewardType'],
  value: bigint,
  tone: FrNarrativeTemplate['tone'],
): string {
  const signedPrefix = tone === 'negative' ? '-' : '+';

  if (rewardType === 'heat-relief') {
    const heatDirection = tone === 'negative' ? '+' : '-';
    return heatDirection + value.toString() + ' Heat';
  }

  switch (rewardType) {
    case 'bots':
      return signedPrefix + value.toString() + ' Bots';
    case 'targets':
      return signedPrefix + value.toString() + ' Targets';
    case 'money':
      return signedPrefix + value.toString() + ' $';
    case 'portfolio':
      return signedPrefix + value.toString() + ' Portfolio';
    case 'intel':
      return signedPrefix + value.toString() + ' Intel';
    default:
      return signedPrefix + value.toString();
  }
}

function makeMessage(state: EngineState): EngineMessage {
  const bucket = pickBucket(state);
  const allowedRewardTypes = allowedRewardTypesForPhase(state.phase.index);
  const template = pickTemplateForPhase(bucket, allowedRewardTypes);
  const rewardValue = computeRewardValue(state, template);
  const quarantineCost = maxBigInt(60n, state.resources.darkMoney / 90n + 40n);

  state.messages.sequence += 1;

  return {
    id: 'msg-' + state.messages.sequence,
    source: template.source,
    tone: template.tone,
    subject: template.subject,
    body: template.body,
    rewardType: template.rewardType,
    rewardValue: rewardValue.toString(),
    rewardLabel: describeReward(template.rewardType, rewardValue, template.tone),
    quarantineCost: quarantineCost.toString(),
    createdAtMs: state.nowMs,
  };
}

function computeNextIntervalMs(state: EngineState): number {
  const effects = computeUpgradeEffects(state);
  const phaseFactor = state.phase.index * 3200;
  const heatFactor = state.war.heat >= 7000 ? 9000 : Math.floor(state.war.heat / 4);
  const reducedBase = Math.floor(
    (state.rates.messageIntervalBaseMs * (10_000 - effects.messageIntervalReductionBps)) / 10_000,
  );
  const base = Math.max(18_000, reducedBase);
  return clamp(base - phaseFactor - heatFactor, 22_000, 90_000);
}

export function applyNarrativeTick(state: EngineState): boolean {
  if (state.phase.index < 2) {
    state.messages.pending = [];
    state.messages.nextAtMs = state.nowMs + 24_000;
    return false;
  }

  if (state.nowMs < state.messages.nextAtMs) {
    return false;
  }

  if (state.messages.pending.length >= 9) {
    state.messages.nextAtMs = state.nowMs + 12_000;
    return false;
  }

  state.messages.pending.push(makeMessage(state));
  state.messages.nextAtMs = state.nowMs + computeNextIntervalMs(state);
  return true;
}

function applyPositiveReward(state: EngineState, message: EngineMessage): void {
  const value = BigInt(message.rewardValue);

  switch (message.rewardType) {
    case 'bots':
      state.resources.bots += value;
      break;
    case 'targets':
      state.resources.queuedTargets += value;
      break;
    case 'money':
      state.resources.darkMoney += value;
      break;
    case 'portfolio':
      state.resources.portfolio += value;
      break;
    case 'intel':
      state.resources.warIntel += value;
      break;
    case 'heat-relief':
      state.war.heat = Math.max(0, state.war.heat - Number(value));
      break;
    default:
      break;
  }
}

function applyNegativeReward(state: EngineState, message: EngineMessage): void {
  const value = BigInt(message.rewardValue);

  switch (message.rewardType) {
    case 'bots':
      state.resources.bots = state.resources.bots > value ? state.resources.bots - value : 0n;
      break;
    case 'targets':
      state.resources.queuedTargets =
        state.resources.queuedTargets > value ? state.resources.queuedTargets - value : 0n;
      break;
    case 'money':
      state.resources.darkMoney =
        state.resources.darkMoney > value ? state.resources.darkMoney - value : 0n;
      break;
    case 'portfolio':
      state.resources.portfolio =
        state.resources.portfolio > value ? state.resources.portfolio - value : 0n;
      break;
    case 'intel':
      state.resources.warIntel =
        state.resources.warIntel > value ? state.resources.warIntel - value : 0n;
      break;
    case 'heat-relief':
      state.war.heat = Math.min(10_000, state.war.heat + Number(value));
      break;
    default:
      break;
  }
}

export function commandProcessMessage(state: EngineState): MessageProcessResult {
  const message = state.messages.pending.shift();
  if (!message) {
    return 'none';
  }

  state.messages.processed += 1;
  state.milestones.messagesHandled += 1;

  if (message.tone === 'negative') {
    applyNegativeReward(state, message);
    return 'negative';
  }

  applyPositiveReward(state, message);
  return 'positive';
}

export function commandQuarantineMessage(state: EngineState): boolean {
  const message = state.messages.pending[0];
  if (!message) {
    return false;
  }

  const quarantineCost = BigInt(message.quarantineCost);
  if (state.resources.darkMoney < quarantineCost) {
    return false;
  }

  state.resources.darkMoney -= quarantineCost;
  state.messages.pending.shift();
  state.messages.processed += 1;
  state.milestones.messagesHandled += 1;
  return true;
}
