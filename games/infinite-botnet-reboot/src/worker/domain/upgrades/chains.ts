import type { UpgradeChainDefinition } from './types';

export const UPGRADE_CHAINS: UpgradeChainDefinition[] = [
  {
    chainId: 'econ-exploit-seed',
    category: 'economy',
    discoverPhaseIndex: 0,
    label: 'Exploit Seed',
    summary: 'Micro-boost de precision exploit pour fluidifier les toutes premieres actions.',
    levels: [
      {
        cost: { bots: 10 },
        requirements: { minScans: 2 },
        effects: { exploitChanceBps: 25 },
      },
    ],
  },
  {
    chainId: 'econ-cooldown-primer',
    category: 'economy',
    discoverPhaseIndex: 0,
    label: 'Cooldown Primer',
    summary: 'Legere optimisation du cycle exploit pour accelerer le tout debut de P0.',
    levels: [
      {
        cost: { bots: 25 },
        requirements: { minExploitSuccesses: 3 },
        effects: { manualExploitCooldownReductionBps: 500 },
      },
    ],
  },
  {
    chainId: 'econ-scan-burst',
    category: 'economy',
    discoverPhaseIndex: 0,
    label: 'Scan Burst',
    summary: 'Augmente le volume de cibles ajoutees a chaque scan manuel.',
    levels: [
      {
        cost: { bots: 45 },
        requirements: { minScans: 6 },
        effects: { manualScanGainFlat: 1 },
      },
      {
        cost: { money: 60 },
        requirements: { minPhaseIndex: 1, minScans: 18, minExploitSuccesses: 6 },
        effects: { manualScanGainFlat: 1 },
      },
      {
        cost: { money: 400 },
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
        cost: { money: 40 },
        requirements: { minPhaseIndex: 1, minScans: 12, minExploitSuccesses: 5 },
        effects: { autoScanBps: 220 },
      },
      {
        cost: { money: 120 },
        requirements: { minScans: 42, minExploitSuccesses: 18 },
        effects: { autoScanBps: 280 },
      },
      {
        cost: { money: 900 },
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
        cost: { money: 50 },
        requirements: { minPhaseIndex: 1, minScans: 24 },
        effects: { autoScanBps: 180 },
      },
      {
        cost: { money: 180 },
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
        cost: { money: 80 },
        requirements: { minScans: 18, minExploitSuccesses: 8 },
        effects: { manualExploitCooldownReductionBps: 5000 },
      },
      {
        cost: { money: 250 },
        requirements: { minScans: 65, minExploitSuccesses: 35 },
        effects: { manualExploitCooldownReductionBps: 7500 },
      },
      {
        cost: { money: 2_600 },
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
        cost: { money: 70 },
        requirements: { minPhaseIndex: 1, minExploitSuccesses: 10 },
        effects: { exploitChanceBps: 80 },
      },
      {
        cost: { money: 260 },
        requirements: { minScans: 55, minExploitSuccesses: 28 },
        effects: { exploitChanceBps: 120 },
      },
      {
        cost: { money: 3_200 },
        requirements: { minPhaseIndex: 1, minScans: 360, minExploitSuccesses: 220 },
        effects: { exploitChanceBps: 170 },
      },
      {
        cost: { money: 38_000 },
        requirements: { minPhaseIndex: 2, minExploitSuccesses: 700 },
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
        cost: { money: 120 },
        requirements: { minPhaseIndex: 1, minScans: 80, minExploitSuccesses: 45 },
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
        cost: { money: 600 },
        requirements: { minBots: 160, minScans: 75, minExploitSuccesses: 30 },
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
        cost: { money: 600 },
        requirements: { minBots: 160, minScans: 75, minExploitSuccesses: 30 },
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
    discoverPhaseIndex: 0,
    label: 'Exploit Daemon',
    summary: 'Accelere les exploits passifs pour les longues sessions.',
    levels: [
      {
        cost: { bots: 100 },
        requirements: { minScans: 60, minExploitSuccesses: 120 },
        effects: { autoExploitUnlock: 1, autoExploitBps: 420 },
      },
      {
        cost: { money: 22_000 },
        requirements: { minPhaseIndex: 2, minExploitSuccesses: 700 },
        effects: { autoExploitBps: 640, exploitChanceBps: 80 },
      },
      {
        cost: { money: 120_000 },
        requirements: { minPhaseIndex: 3, minExploitSuccesses: 2_600 },
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
        cost: { money: 14_000 },
        requirements: { minPhaseIndex: 2, minMoney: 8_000 },
        effects: { moneyYieldBps: 180, maintenanceReductionBps: 350 },
      },
      {
        cost: { money: 160_000 },
        requirements: { minPhaseIndex: 3, minMoney: 120_000 },
        effects: { moneyYieldBps: 240, maintenanceReductionBps: 550 },
      },
      {
        cost: { money: 1_300_000 },
        requirements: { minPhaseIndex: 4, minMoney: 900_000 },
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
        cost: { money: 200_000 },
        requirements: { minPhaseIndex: 3, minExploitSuccesses: 2_000 },
        effects: {
          autoScanBps: 900,
          autoExploitBps: 600,
          moneyYieldBps: 180,
        },
      },
      {
        cost: { money: 2_000_000 },
        requirements: { minPhaseIndex: 4, minExploitSuccesses: 5_000 },
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
