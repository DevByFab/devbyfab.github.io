import type { FrNarrativeTemplate } from '../../../content/fr/narrativeCatalog';
import type { EngineMessage, EngineState } from '../../state';

function maxBigInt(left: number, right: number): number {
  return left > right ? left : right;
}

export function computeRewardValue(state: EngineState, template: FrNarrativeTemplate): number {
  switch (template.rewardType) {
    case 'bots':
      return maxBigInt(30, state.resources.bots / 45 + 18);
    case 'targets':
      return maxBigInt(12, state.resources.queuedTargets / 4 + 10);
    case 'money':
      return maxBigInt(70, state.resources.money / 38 + 35);
    case 'portfolio':
      return maxBigInt(50, state.resources.portfolio / 28 + 25);
    case 'intel':
      return (4 + Math.floor(state.phase.index / 2));
    case 'heat-relief':
      return (240 + state.phase.index * 30);
    default:
      return 0;
  }
}

export function describeReward(
  rewardType: FrNarrativeTemplate['rewardType'],
  value: number,
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

export function applyPositiveReward(state: EngineState, message: EngineMessage): void {
  const value = (message.rewardValue);

  switch (message.rewardType) {
    case 'bots':
      state.resources.bots += value;
      break;
    case 'targets':
      state.resources.queuedTargets += value;
      break;
    case 'money':
      state.resources.money += value;
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

export function applyNegativeReward(state: EngineState, message: EngineMessage): void {
  const value = (message.rewardValue);

  switch (message.rewardType) {
    case 'bots':
      state.resources.bots = state.resources.bots > value ? state.resources.bots - value : 0;
      break;
    case 'targets':
      state.resources.queuedTargets =
        state.resources.queuedTargets > value ? state.resources.queuedTargets - value : 0;
      break;
    case 'money':
      state.resources.money =
        state.resources.money > value ? state.resources.money - value : 0;
      break;
    case 'portfolio':
      state.resources.portfolio =
        state.resources.portfolio > value ? state.resources.portfolio - value : 0;
      break;
    case 'intel':
      state.resources.warIntel =
        state.resources.warIntel > value ? state.resources.warIntel - value : 0;
      break;
    case 'heat-relief':
      state.war.heat = Math.min(10_000, state.war.heat + Number(value));
      break;
    default:
      break;
  }
}
