import type { UpgradeChainDefinition } from './types';

export const UPGRADE_CHAINS: UpgradeChainDefinition[] = [
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
