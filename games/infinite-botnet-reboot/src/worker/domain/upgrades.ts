import type { UpgradeCategory, UpgradeOfferSnapshot } from '../../game/types';
import type { EngineState } from '../state';

export interface UpgradeEffects {
  autoScanBps: number;
  autoExploitBps: number;
  autoExploitUnlock: number;
  exploitChanceBps: number;
  manualExploitCooldownReductionBps: number;
  manualExploitCooldownDisable: number;
  manualScanGainFlat: number;
  moneyYieldBps: number;
  maintenanceReductionBps: number;
  warSuccessBps: number;
  heatPerSecDelta: number;
  scrubReliefBps: number;
  matrixDecayPerSecDelta: number;
  matrixArmCostReductionBps: number;
  matrixInjectCostReductionBps: number;
  matrixStabilizeGain: number;
  messageIntervalReductionBps: number;
}

interface UpgradeLevelRequirements {
  minPhaseIndex?: number;
  minScans?: number;
  minBots?: bigint;
  minMoney?: bigint;
  minWarWins?: number;
  minMessagesHandled?: number;
  minExploitSuccesses?: number;
  minSuccessfulInjections?: number;
}

interface UpgradeCost {
  bots?: bigint;
  darkMoney?: bigint;
  warIntel?: bigint;
  hz?: bigint;
  computronium?: bigint;
}

interface UpgradeLevelDefinition {
  cost: UpgradeCost;
  requirements?: UpgradeLevelRequirements;
  effects: Partial<UpgradeEffects>;
}

interface UpgradeChainDefinition {
  chainId: string;
  category: UpgradeCategory;
  discoverPhaseIndex: number;
  exclusiveGroup?: string;
  label: string;
  summary: string;
  levels: UpgradeLevelDefinition[];
}

const UPGRADE_CHAINS: UpgradeChainDefinition[] = [
  {
    chainId: 'econ-scan-burst',
    category: 'economy',
    discoverPhaseIndex: 0,
    label: 'Scan Burst',
    summary: 'Augmente le volume de cibles ajoutees a chaque scan manuel.',
    levels: [
      {
        cost: { bots: 45n },
        requirements: { minScans: 6 },
        effects: { manualScanGainFlat: 1 },
      },
      {
        cost: { bots: 160n },
        requirements: { minScans: 18, minExploitSuccesses: 6 },
        effects: { manualScanGainFlat: 1 },
      },
      {
        cost: { bots: 1_200n, darkMoney: 240n },
        requirements: { minPhaseIndex: 1, minScans: 120, minExploitSuccesses: 70 },
        effects: { manualScanGainFlat: 1 },
      },
    ],
  },
  {
    chainId: 'econ-probe-cache',
    category: 'economy',
    discoverPhaseIndex: 0,
    label: 'Probe Cache',
    summary: 'Augmente la cadence de scan passif pour alimenter la file de cibles.',
    levels: [
      {
        cost: { bots: 90n },
        requirements: { minScans: 12, minExploitSuccesses: 5 },
        effects: { autoScanBps: 220 },
      },
      {
        cost: { bots: 360n, darkMoney: 70n },
        requirements: { minScans: 42, minExploitSuccesses: 18 },
        effects: { autoScanBps: 280 },
      },
      {
        cost: { bots: 2_600n, darkMoney: 540n },
        requirements: { minPhaseIndex: 1, minScans: 220, minExploitSuccesses: 120 },
        effects: { autoScanBps: 420 },
      },
    ],
  },
  {
    chainId: 'econ-target-pipeline',
    category: 'economy',
    discoverPhaseIndex: 0,
    label: 'Target Pipeline',
    summary: 'Fluidifie la file de cibles et stabilise les tentatives exploit.',
    levels: [
      {
        cost: { bots: 120n },
        requirements: { minScans: 24 },
        effects: { autoScanBps: 180 },
      },
      {
        cost: { bots: 460n, darkMoney: 110n },
        requirements: { minScans: 75, minExploitSuccesses: 35 },
        effects: { autoScanBps: 240, exploitChanceBps: 70 },
      },
    ],
  },
  {
    chainId: 'econ-cooldown-rig',
    category: 'economy',
    discoverPhaseIndex: 0,
    label: 'Cooldown Rig',
    summary: 'Tier cooldown: 2000ms -> 1000ms -> 500ms -> 0ms.',
    levels: [
      {
        cost: { bots: 140n, darkMoney: 30n },
        requirements: { minScans: 18, minExploitSuccesses: 8 },
        effects: { manualExploitCooldownReductionBps: 5000 },
      },
      {
        cost: { bots: 520n, darkMoney: 120n },
        requirements: { minScans: 65, minExploitSuccesses: 35 },
        effects: { manualExploitCooldownReductionBps: 7500 },
      },
      {
        cost: { bots: 8_800n, darkMoney: 2_600n },
        requirements: { minPhaseIndex: 1, minScans: 320, minExploitSuccesses: 210 },
        effects: { manualExploitCooldownDisable: 1 },
      },
    ],
  },
  {
    chainId: 'econ-exploit-protocol',
    category: 'economy',
    discoverPhaseIndex: 0,
    label: 'Exploit Protocol',
    summary: 'Renforce la precision exploit et stabilise la progression early game.',
    levels: [
      {
        cost: { bots: 170n },
        requirements: { minExploitSuccesses: 10 },
        effects: { exploitChanceBps: 80 },
      },
      {
        cost: { bots: 700n, darkMoney: 160n },
        requirements: { minScans: 55, minExploitSuccesses: 28 },
        effects: { exploitChanceBps: 120 },
      },
      {
        cost: { bots: 11_500n, darkMoney: 3_200n },
        requirements: { minPhaseIndex: 1, minScans: 360, minExploitSuccesses: 220 },
        effects: { exploitChanceBps: 170 },
      },
      {
        cost: { bots: 145_000n, darkMoney: 38_000n },
        requirements: { minPhaseIndex: 2, minScans: 900, minExploitSuccesses: 700 },
        effects: { exploitChanceBps: 240 },
      },
    ],
  },
  {
    chainId: 'qol-operator-macros',
    category: 'lore',
    discoverPhaseIndex: 0,
    label: 'Operator Macros',
    summary: 'Debloque la hotkey Exploit et raffine les commandes du noyeau.',
    levels: [
      {
        cost: { bots: 280n },
        requirements: { minScans: 80, minExploitSuccesses: 45 },
        effects: {},
      },
    ],
  },
  {
    chainId: 'p0-doctrine-ghostline',
    category: 'lore',
    discoverPhaseIndex: 0,
    exclusiveGroup: 'phase0-doctrine',
    label: 'Doctrine Ghostline',
    summary: 'Branche active: precision exploit et cadence manuelle agressive.',
    levels: [
      {
        cost: { bots: 920n, darkMoney: 220n },
        requirements: { minBots: 160n, minScans: 75, minExploitSuccesses: 30 },
        effects: {
          exploitChanceBps: 240,
          manualExploitCooldownReductionBps: 1200,
        },
      },
    ],
  },
  {
    chainId: 'p0-doctrine-swarmline',
    category: 'lore',
    discoverPhaseIndex: 0,
    exclusiveGroup: 'phase0-doctrine',
    label: 'Doctrine Swarmline',
    summary: 'Branche passive: reseau dense, scans continus et auto-exploit precoce.',
    levels: [
      {
        cost: { bots: 920n, darkMoney: 220n },
        requirements: { minBots: 160n, minScans: 75, minExploitSuccesses: 30 },
        effects: {
          autoScanBps: 220,
          autoExploitUnlock: 1,
          autoExploitBps: 220,
        },
      },
    ],
  },
  {
    chainId: 'econ-exploit-daemon',
    category: 'economy',
    discoverPhaseIndex: 1,
    label: 'Exploit Daemon',
    summary: 'Accelere les exploits passifs pour les longues sessions.',
    levels: [
      {
        cost: { bots: 6_500n, darkMoney: 1_900n },
        requirements: { minPhaseIndex: 1, minScans: 340, minExploitSuccesses: 240 },
        effects: { autoExploitUnlock: 1, autoExploitBps: 420 },
      },
      {
        cost: { bots: 76_000n, darkMoney: 22_000n },
        requirements: { minPhaseIndex: 2, minScans: 900, minExploitSuccesses: 700 },
        effects: { autoExploitBps: 640, exploitChanceBps: 80 },
      },
      {
        cost: { bots: 920_000n, darkMoney: 250_000n },
        requirements: { minPhaseIndex: 3, minScans: 2_600, minExploitSuccesses: 2_600 },
        effects: { autoExploitBps: 900, exploitChanceBps: 130 },
      },
    ],
  },
  {
    chainId: 'econ-black-ledger',
    category: 'economy',
    discoverPhaseIndex: 2,
    label: 'Black Ledger',
    summary: 'Renforce le rendement financier global et la stabilite de maintenance.',
    levels: [
      {
        cost: { darkMoney: 14_000n },
        requirements: { minPhaseIndex: 2, minMoney: 8_000n },
        effects: { moneyYieldBps: 180, maintenanceReductionBps: 350 },
      },
      {
        cost: { darkMoney: 160_000n },
        requirements: { minPhaseIndex: 3, minMoney: 120_000n },
        effects: { moneyYieldBps: 240, maintenanceReductionBps: 550 },
      },
      {
        cost: { darkMoney: 1_300_000n },
        requirements: { minPhaseIndex: 4, minMoney: 900_000n },
        effects: { moneyYieldBps: 320, maintenanceReductionBps: 800 },
      },
    ],
  },
  {
    chainId: 'econ-backbone-overclock',
    category: 'economy',
    discoverPhaseIndex: 3,
    label: 'Backbone Overclock',
    summary: 'Palier endgame global pour lisser la progression vers les dernieres phases.',
    levels: [
      {
        cost: { bots: 2_800_000n, darkMoney: 650_000n },
        requirements: { minPhaseIndex: 3, minScans: 3_500, minExploitSuccesses: 2_000 },
        effects: {
          autoScanBps: 900,
          autoExploitBps: 600,
          moneyYieldBps: 180,
        },
      },
      {
        cost: { bots: 24_000_000n, darkMoney: 4_200_000n },
        requirements: { minPhaseIndex: 4, minScans: 6_500, minExploitSuccesses: 5_000 },
        effects: {
          autoScanBps: 1200,
          autoExploitBps: 850,
          moneyYieldBps: 220,
          maintenanceReductionBps: 600,
        },
      },
    ],
  },
];

export const UPGRADE_TOTAL_LEVELS = UPGRADE_CHAINS.reduce(
  (total, chain) => total + chain.levels.length,
  0,
);

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

export type UpgradePurchaseResult =
  | 'missing'
  | 'maxed'
  | 'locked'
  | 'insufficient'
  | 'purchased';

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

  if (
    requirements.minPhaseIndex !== undefined &&
    state.phase.index < requirements.minPhaseIndex
  ) {
    return 'Phase insuffisante';
  }

  if (requirements.minScans !== undefined && state.milestones.scans < requirements.minScans) {
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
  const unlocked = requirementBlock === null && !exclusiveBlocked;
  const affordable = unlocked && canAfford(state, cost);

  let statusText = 'Pret a acheter';
  if (exclusiveBlocked) {
    statusText =
      'Doctrine verrouillee (choix actif: ' + (exclusiveConflictChain?.label ?? 'autre') + ')';
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
    statusText,
    costBots: costValue(cost.bots).toString(),
    costMoney: costValue(cost.darkMoney).toString(),
    costIntel: costValue(cost.warIntel).toString(),
    costHz: costValue(cost.hz).toString(),
    costComputronium: costValue(cost.computronium).toString(),
  };
}

export function refreshUpgradeOffers(state: EngineState): void {
  const offers = UPGRADE_CHAINS.map((chain) =>
    toOffer(state, chain, getCurrentLevel(state, chain.chainId)),
  ).filter((offer): offer is UpgradeOfferSnapshot => offer !== null);

  offers.sort((left, right) => {
    if (left.category !== right.category) {
      return left.category.localeCompare(right.category);
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
