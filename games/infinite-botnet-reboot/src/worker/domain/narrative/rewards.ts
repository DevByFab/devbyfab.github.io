import type { FrNarrativeTemplate } from '../../../content/fr/narrativeCatalog';
import type { EngineMessage, EngineState } from '../../state';

function maxBigInt(left: bigint, right: bigint): bigint {
  return left > right ? left : right;
}

export function computeRewardValue(state: EngineState, template: FrNarrativeTemplate): bigint {
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

export function describeReward(
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

export function applyPositiveReward(state: EngineState, message: EngineMessage): void {
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

export function applyNegativeReward(state: EngineState, message: EngineMessage): void {
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
