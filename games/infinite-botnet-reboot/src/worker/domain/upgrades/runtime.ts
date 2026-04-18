import type { UpgradeOfferSnapshot } from '../../../game/types';
import type { EngineState } from '../../state';
import { UPGRADE_CHAINS, UPGRADE_TOTAL_LEVELS } from './chains';
import type {
  UpgradeChainDefinition,
  UpgradeCost,
  UpgradeEffects,
  UpgradeLevelRequirements,
  UpgradePurchaseResult,
} from './types';

const EMPTY_EFFECTS: UpgradeEffects = {
  autoScanBps: 0,
  autoExploitBps: 0,
  autoExploitUnlock: 0,
  exploitChanceBps: 0,
  manualExploitCooldownReductionBps: 0,
  manualExploitCooldownDisable: 0,
  manualScanGainFlat: 0,
  moneyYieldBps: 0,
  maintenanceReductionBps: 0,
  warSuccessBps: 0,
  heatPerSecDelta: 0,
  scrubReliefBps: 0,
  matrixDecayPerSecDelta: 0,
  matrixArmCostReductionBps: 0,
  matrixInjectCostReductionBps: 0,
  matrixStabilizeGain: 0,
  messageIntervalReductionBps: 0,
};

function costValue(value: bigint | undefined): bigint {
  return value ?? 0n;
}

function getCurrentLevel(state: EngineState, chainId: string): number {
  return state.upgrades.levels[chainId] ?? 0;
}

function getExclusiveConflictChain(
  state: EngineState,
  chain: UpgradeChainDefinition,
): UpgradeChainDefinition | null {
  if (!chain.exclusiveGroup) {
    return null;
  }

  for (const candidate of UPGRADE_CHAINS) {
    if (candidate.chainId === chain.chainId) continue;
    if (candidate.exclusiveGroup !== chain.exclusiveGroup) continue;
    if (getCurrentLevel(state, candidate.chainId) > 0) {
      return candidate;
    }
  }

  return null;
}

function isChainDiscovered(
  state: EngineState,
  chain: UpgradeChainDefinition,
  currentLevel: number,
): boolean {
  if (currentLevel > 0) {
    return true;
  }

  return state.phase.index >= chain.discoverPhaseIndex;
}

function checkRequirements(
  state: EngineState,
  requirements: UpgradeLevelRequirements | undefined,
): string | null {
  if (!requirements) return null;

  const emergencyProgressionByBots = state.resources.bots >= 1000n && state.phase.index <= 1;

  if (
    requirements.minPhaseIndex !== undefined &&
    state.phase.index < requirements.minPhaseIndex
  ) {
    return 'Phase insuffisante';
  }

  if (
    !emergencyProgressionByBots &&
    requirements.minScans !== undefined &&
    state.milestones.scans < requirements.minScans
  ) {
    return 'Scans insuffisants';
  }

  if (requirements.minBots !== undefined && state.resources.bots < requirements.minBots) {
    return 'Bots insuffisants';
  }

  if (requirements.minMoney !== undefined && state.resources.darkMoney < requirements.minMoney) {
    return 'Dark money insuffisant';
  }

  if (requirements.minWarWins !== undefined && state.war.wins < requirements.minWarWins) {
    return 'War wins insuffisants';
  }

  if (
    requirements.minMessagesHandled !== undefined &&
    state.milestones.messagesHandled < requirements.minMessagesHandled
  ) {
    return 'Messages traites insuffisants';
  }

  if (
    !emergencyProgressionByBots &&
    requirements.minExploitSuccesses !== undefined &&
    state.milestones.exploitSuccesses < requirements.minExploitSuccesses
  ) {
    return 'Exploits reussis insuffisants';
  }

  if (
    requirements.minSuccessfulInjections !== undefined &&
    state.matrix.successfulInjections < requirements.minSuccessfulInjections
  ) {
    return 'Injections matrix insuffisantes';
  }

  return null;
}

function canAfford(state: EngineState, cost: UpgradeCost): boolean {
  if (state.resources.bots < costValue(cost.bots)) return false;
  if (state.resources.darkMoney < costValue(cost.darkMoney)) return false;
  if (state.resources.warIntel < costValue(cost.warIntel)) return false;
  if (state.resources.hz < costValue(cost.hz)) return false;
  if (state.resources.computronium < costValue(cost.computronium)) return false;

  return true;
}

function hasLockedCostResource(state: EngineState, cost: UpgradeCost): boolean {
  if (costValue(cost.darkMoney) > 0n && state.phase.index < 2) {
    return true;
  }

  if (costValue(cost.warIntel) > 0n && state.phase.index < 3) {
    return true;
  }

  if (costValue(cost.hz) > 0n && state.phase.index < 4) {
    return true;
  }

  if (costValue(cost.computronium) > 0n && state.phase.index < 4) {
    return true;
  }

  return false;
}

function spendCost(state: EngineState, cost: UpgradeCost): void {
  state.resources.bots -= costValue(cost.bots);
  state.resources.darkMoney -= costValue(cost.darkMoney);
  state.resources.warIntel -= costValue(cost.warIntel);
  state.resources.hz -= costValue(cost.hz);
  state.resources.computronium -= costValue(cost.computronium);
}

function addEffects(target: UpgradeEffects, partial: Partial<UpgradeEffects>): void {
  for (const key of Object.keys(partial) as Array<keyof UpgradeEffects>) {
    target[key] += partial[key] ?? 0;
  }
}

export function computeUpgradeEffects(state: EngineState): UpgradeEffects {
  const effects: UpgradeEffects = { ...EMPTY_EFFECTS };

  for (const chain of UPGRADE_CHAINS) {
    const ownedLevel = getCurrentLevel(state, chain.chainId);
    for (let i = 0; i < ownedLevel; i += 1) {
      const levelDef = chain.levels[i];
      if (!levelDef) continue;
      addEffects(effects, levelDef.effects);
    }
  }

  return effects;
}

function toOffer(
  state: EngineState,
  chain: UpgradeChainDefinition,
  currentLevel: number,
): UpgradeOfferSnapshot | null {
  if (!isChainDiscovered(state, chain, currentLevel)) {
    return null;
  }

  const maxLevel = chain.levels.length;

  if (currentLevel >= maxLevel) {
    return {
      chainId: chain.chainId,
      category: chain.category,
      label: chain.label,
      summary: chain.summary,
      currentLevel,
      nextLevel: maxLevel,
      maxLevel,
      unlocked: false,
      affordable: false,
      resourceLocked: false,
      statusText: 'Niveau max atteint',
      costBots: '0',
      costMoney: '0',
      costIntel: '0',
      costHz: '0',
      costComputronium: '0',
    };
  }

  const nextLevel = currentLevel + 1;
  const nextDef = chain.levels[currentLevel];
  const cost = nextDef.cost;
  const exclusiveConflictChain = getExclusiveConflictChain(state, chain);
  const exclusiveBlocked = currentLevel === 0 && exclusiveConflictChain !== null;
  const requirementBlock = checkRequirements(state, nextDef.requirements);
  const resourceLocked = hasLockedCostResource(state, cost);
  const unlocked = requirementBlock === null && !exclusiveBlocked && !resourceLocked;
  const affordable = unlocked && canAfford(state, cost);

  let statusText = 'Pret a acheter';
  if (exclusiveBlocked) {
    statusText =
      'Doctrine verrouillee (choix actif: ' + (exclusiveConflictChain?.label ?? 'autre') + ')';
  } else if (resourceLocked) {
    statusText = 'Ressource non debloquee';
  } else if (!unlocked) {
    statusText = requirementBlock ?? 'Verrouille';
  } else if (!affordable) {
    statusText = 'Ressources insuffisantes';
  }

  return {
    chainId: chain.chainId,
    category: chain.category,
    label: chain.label,
    summary: chain.summary,
    currentLevel,
    nextLevel,
    maxLevel,
    unlocked,
    affordable,
    resourceLocked,
    statusText,
    costBots: costValue(cost.bots).toString(),
    costMoney: costValue(cost.darkMoney).toString(),
    costIntel: costValue(cost.warIntel).toString(),
    costHz: costValue(cost.hz).toString(),
    costComputronium: costValue(cost.computronium).toString(),
  };
}

function totalOfferCost(offer: UpgradeOfferSnapshot): bigint {
  return (
    BigInt(offer.costBots) +
    BigInt(offer.costMoney) +
    BigInt(offer.costIntel) +
    BigInt(offer.costHz) +
    BigInt(offer.costComputronium)
  );
}

function offerSortPriority(offer: UpgradeOfferSnapshot): number {
  if (offer.currentLevel >= offer.maxLevel) return 3;
  if (offer.unlocked && offer.affordable) return 0;
  if (offer.unlocked) return 1;
  return 2;
}

export function refreshUpgradeOffers(state: EngineState): void {
  const offers = UPGRADE_CHAINS.map((chain) =>
    toOffer(state, chain, getCurrentLevel(state, chain.chainId)),
  ).filter((offer): offer is UpgradeOfferSnapshot => offer !== null);

  offers.sort((left, right) => {
    const leftPriority = offerSortPriority(left);
    const rightPriority = offerSortPriority(right);

    if (leftPriority !== rightPriority) {
      return leftPriority - rightPriority;
    }

    if (leftPriority <= 1) {
      const leftCost = totalOfferCost(left);
      const rightCost = totalOfferCost(right);
      if (leftCost !== rightCost) {
        return leftCost < rightCost ? -1 : 1;
      }
    }

    if (left.category !== right.category) {
      return left.category.localeCompare(right.category);
    }

    if (left.nextLevel !== right.nextLevel) {
      return left.nextLevel - right.nextLevel;
    }

    return left.label.localeCompare(right.label);
  });

  state.upgrades.offers = offers;
  state.upgrades.totalOwnedLevels = Object.values(state.upgrades.levels).reduce(
    (total, level) => total + level,
    0,
  );
  state.upgrades.totalMaxLevels = UPGRADE_TOTAL_LEVELS;
}

export function commandPurchaseUpgrade(
  state: EngineState,
  chainId: string | undefined,
): UpgradePurchaseResult {
  if (!chainId) return 'missing';

  const chain = UPGRADE_CHAINS.find((candidate) => candidate.chainId === chainId);
  if (!chain) return 'missing';

  const currentLevel = getCurrentLevel(state, chain.chainId);
  if (currentLevel >= chain.levels.length) return 'maxed';

  if (currentLevel === 0 && getExclusiveConflictChain(state, chain) !== null) {
    return 'locked';
  }

  const levelDef = chain.levels[currentLevel];
  if (hasLockedCostResource(state, levelDef.cost)) {
    return 'locked';
  }

  if (checkRequirements(state, levelDef.requirements) !== null) {
    return 'locked';
  }

  if (!canAfford(state, levelDef.cost)) {
    return 'insufficient';
  }

  spendCost(state, levelDef.cost);
  state.upgrades.levels[chain.chainId] = currentLevel + 1;
  refreshUpgradeOffers(state);
  return 'purchased';
}
