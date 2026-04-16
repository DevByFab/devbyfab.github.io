import type { EngineState } from '../../state';
import { applyNegativeReward, applyPositiveReward } from './rewards';

export type MessageProcessResult = 'none' | 'positive' | 'negative';

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
