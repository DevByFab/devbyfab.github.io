import type { EngineMessage, EngineState } from '../../state';
import { clamp, maxBigInt } from '../economy/helpers';
import { computeUpgradeEffects } from '../upgrades';
import { computeRewardValue, describeReward } from './rewards';
import {
  allowedRewardTypesForPhase,
  pickBucket,
  pickTemplateForPhase,
} from './templates';

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
