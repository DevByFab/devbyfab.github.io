/* ==================================================
   Infinite BotNet Worker - Simulation Engine
   Long-session progression with branch-driven catalog
   ================================================== */

'use strict';

var SAVE_VERSION = 3;
var TICK_MS = 100;
var MAX_DELTA_MS = 300000;
var OFFLINE_CAP_MS = 6 * 60 * 60 * 1000;
var TURBO_MULTIPLIERS = [1, 10, 50, 100];

var PHASES = [
  { id: 'garage', title: 'Garage', minBots: 0n },
  { id: 'automation', title: 'Automation', minBots: 100n },
  { id: 'monetization', title: 'Monetization', minBots: 10000n },
  { id: 'botnet-war', title: 'Botnet War', minBots: 1000000n },
  { id: 'infrastructure', title: 'Cloud Dominion', minBots: 50000000n },
  { id: 'opinion-ops', title: 'Opinion Forge', minBots: 500000000n },
  { id: 'machine-awakening', title: 'Grid Overmind', minBots: 2000000000n },
  { id: 'biological-barrier', title: 'Neural Breach', minBots: 8000000000n },
  { id: 'singular-intelligence', title: 'Singularity Core', minBots: 50000000000n },
  { id: 'matrix-exit', title: 'Matrix Breach', minBots: 1000000000000n }
];

var ITEM_DEFS = [
  {
    id: 'python-scanner',
    group: 'upgrade',
    costType: 'bots',
    cost: 10n,
    requireBots: 10n,
    requireItems: []
  },
  {
    id: 'default-wordlist',
    group: 'upgrade',
    costType: 'bots',
    cost: 40n,
    requireBots: 40n,
    requireItems: []
  },
  {
    id: 'rapid-loader',
    group: 'upgrade',
    costType: 'bots',
    cost: 40n,
    requireBots: 40n,
    requireItems: []
  },
  {
    id: 'async-daemon',
    group: 'upgrade',
    costType: 'bots',
    cost: 140n,
    requireBots: 110n,
    requireItems: []
  },
  {
    id: 'worm-fabric',
    group: 'upgrade',
    costType: 'bots',
    cost: 1200n,
    requireBots: 1000n,
    requireItems: []
  },
  {
    id: 'stealth-c2',
    group: 'upgrade',
    costType: 'bots',
    cost: 4600n,
    requireBots: 3200n,
    requireItems: []
  },
  {
    id: 'ai-orchestrator',
    group: 'upgrade',
    costType: 'bots',
    cost: 80000n,
    requireBots: 65000n,
    requireItems: []
  },
  {
    id: 'infect-boost-1',
    group: 'upgrade',
    costType: 'bots',
    cost: 25000n,
    requireBots: 18000n,
    requireItems: []
  },
  {
    id: 'infect-boost-2',
    group: 'upgrade',
    costType: 'bots',
    cost: 50000n,
    requireBots: 36000n,
    requireItems: []
  },
  {
    id: 'infect-boost-3',
    group: 'upgrade',
    costType: 'bots',
    cost: 100000n,
    requireBots: 70000n,
    requireItems: []
  },
  {
    id: 'scan-cluster-1',
    group: 'upgrade',
    costType: 'bots',
    cost: 180000n,
    requireBots: 130000n,
    requireItems: []
  },
  {
    id: 'exploit-swarm-1',
    group: 'upgrade',
    costType: 'bots',
    cost: 180000n,
    requireBots: 130000n,
    requireItems: []
  },
  {
    id: 'scan-cluster-2',
    group: 'upgrade',
    costType: 'bots',
    cost: 360000n,
    requireBots: 250000n,
    requireItems: []
  },
  {
    id: 'exploit-swarm-2',
    group: 'upgrade',
    costType: 'bots',
    cost: 360000n,
    requireBots: 250000n,
    requireItems: []
  },
  {
    id: 'ghost-protocol',
    group: 'upgrade',
    costType: 'bots',
    cost: 950000n,
    requireBots: 700000n,
    requireItems: []
  },
  {
    id: 'neural-lure',
    group: 'upgrade',
    costType: 'bots',
    cost: 2600000n,
    requireBots: 1700000n,
    requireItems: []
  },
  {
    id: 'dark-auction',
    group: 'market',
    costType: 'money',
    cost: 500n,
    requireBots: 1500n,
    requireItems: []
  },
  {
    id: 'quantum-broker',
    group: 'market',
    costType: 'money',
    cost: 4200n,
    requireBots: 9000n,
    requireItems: []
  },
  {
    id: 'market-futures-1',
    group: 'market',
    costType: 'money',
    cost: 20000n,
    requireBots: 90000n,
    requireItems: []
  },
  {
    id: 'market-futures-2',
    group: 'market',
    costType: 'money',
    cost: 70000n,
    requireBots: 280000n,
    requireItems: []
  },
  {
    id: 'zero-day-toolkit',
    group: 'market',
    costType: 'money',
    cost: 2200n,
    requireBots: 2000n,
    requireItems: [],
    repeatable: true
  },
  {
    id: 'venture-desk',
    group: 'invest',
    costType: 'money',
    cost: 3000n,
    requireBots: 18000n,
    requireItems: []
  },
  {
    id: 'risk-hedger',
    group: 'invest',
    costType: 'money',
    cost: 12000n,
    requireBots: 70000n,
    requireItems: []
  },
  {
    id: 'quant-fund',
    group: 'invest',
    costType: 'money',
    cost: 48000n,
    requireBots: 220000n,
    requireItems: []
  },
  {
    id: 'ai-trader',
    group: 'invest',
    costType: 'money',
    cost: 150000n,
    requireBots: 600000n,
    requireItems: []
  },
  {
    id: 'heat-sink-array',
    group: 'war',
    costType: 'bots',
    cost: 1500000n,
    requireBots: 1000000n,
    requireItems: []
  },
  {
    id: 'c2-obfuscator',
    group: 'war',
    costType: 'money',
    cost: 250000n,
    requireBots: 1000000n,
    requireItems: []
  },
  {
    id: 'war-forge',
    group: 'war',
    costType: 'bots',
    cost: 4500000n,
    requireBots: 2200000n,
    requireItems: []
  },
  {
    id: 'predatory-proxy',
    group: 'war',
    costType: 'money',
    cost: 750000n,
    requireBots: 3200000n,
    requireItems: []
  }
];

var ITEM_BY_ID = buildItemMap();

var state = createInitialState();
var tickHandle = null;
var lastTickAt = Date.now();
var eventQueue = [];
var lastSnapshotAt = 0;

function buildItemMap() {
  var out = {};
  for (var i = 0; i < ITEM_DEFS.length; i++) {
    out[ITEM_DEFS[i].id] = ITEM_DEFS[i];
  }
  return out;
}

function createItemsPurchased() {
  var out = {};
  for (var i = 0; i < ITEM_DEFS.length; i++) {
    out[ITEM_DEFS[i].id] = false;
  }
  return out;
}

function createInitialState() {
  return {
    version: SAVE_VERSION,
    resources: {
      bots: 0n,
      pendingIps: 0n,
      darkMoney: 0n,
      portfolio: 0n,
      warIntel: 0n,
      hz: 0n,
      brainMatter: 0n,
      computronium: 0n
    },
    progression: {
      scanSteps: 0,
      scanStepsRequired: 3
    },
    flags: {
      marketUnlocked: false,
      investUnlocked: false,
      warUnlocked: false,
      messagesUnlocked: false,
      frequencyUnlocked: false,
      brainUnlocked: false,
      computroniumUnlocked: false,
      matrixUnlocked: false
    },
    itemsPurchased: createItemsPurchased(),
    rates: {
      autoScanPerSec: 0n,
      autoExploitPerSec: 0n,
      exploitCooldownMs: 1200,
      exploitSuccessBps: 6200,
      monetizeBotsPerSec: 2n,
      moneyMultiplierBps: 10000n,
      investBatchMoney: 150n,
      investStableBps: 40n,
      investAggressiveBaseBps: 64n,
      investAggressiveSwingBps: 110n,
      heatBaseGainPerSec: 12,
      heatBaseDecayPerSec: 8,
      warAttackBaseBps: 4600,
      warDefenseBps: 0n,
      warRewardMultiplierBps: 10000n,
      warIntelPerWin: 14n
    },
    systems: {
      monetizeActive: false,
      investMode: 'stable',
      turboMultiplier: 1
    },
    war: {
      heat: 0,
      attackReadyAtMs: 0,
      attackCooldownMs: 6000,
      fortifyReadyAtMs: 0,
      fortifyCooldownMs: 9000,
      defenseRemainingMs: 0,
      wins: 0n,
      losses: 0n,
      streak: 0
    },
    endings: {
      unlockedGhost: false,
      unlockedOvermind: false,
      unlockedArchivist: false,
      triadSigil: false,
      selected: 'none'
    },
    messages: {
      unread: 0,
      processed: 0,
      nextIntervalMs: 95000,
      pendingQueue: []
    },
    events: {
      nextIntervalMs: 62000,
      streak: 0
    },
    matrix: {
      consoleUnlocked: false,
      bypassArmed: false,
      bypassExpiresAtMs: 0,
      breachProgress: 0,
      breachRequired: 100,
      stability: 10000,
      criticalAnnounced: false,
      commandToken: 'fractal.root',
      exited: false,
      successfulInjections: 0,
      failedInjections: 0
    },
    stats: {
      totalScans: 0n,
      exploitAttempts: 0n,
      exploitSuccess: 0n,
      totalBotsEver: 0n,
      totalMoneyEarned: 0n,
      warAttacks: 0n,
      warVictories: 0n,
      peakHeat: 0,
      totalHzGenerated: 0n,
      totalBrainMined: 0n,
      totalComputroniumForged: 0n,
      matrixBreaches: 0n,
      totalEvents: 0n
    },
    timers: {
      autoScanCarryMs: 0,
      autoExploitCarryMs: 0,
      monetizeCarryMs: 0,
      investCarryMs: 0,
      heatCarryMs: 0,
      detectionCarryMs: 0,
      phasePulseCarryMs: 0,
      frequencyCarryMs: 0,
      brainCarryMs: 0,
      computroniumCarryMs: 0,
      matrixCarryMs: 0,
      messageCarryMs: 0,
      eventCarryMs: 0,
      exploitReadyAtMs: 0,
      exploitSuccessCarryBps: 0
    }
  };
}

function logEvent(message) {
  eventQueue.push(message);
  if (eventQueue.length > 40) {
    eventQueue.shift();
  }
}

function drainEvents() {
  var events = eventQueue.slice();
  eventQueue = [];
  return events;
}

function parseBigIntSafe(raw, fallback) {
  try {
    if (typeof raw === 'bigint') return raw;
    if (typeof raw === 'number') return BigInt(Math.floor(raw));
    if (typeof raw === 'string' && raw.trim() !== '') return BigInt(raw);
  } catch (_) {
    return fallback;
  }
  return fallback;
}

function parseNumberSafe(raw, fallback) {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (typeof raw === 'string' && raw.trim() !== '') {
    var parsed = Number(raw);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function clampNumber(value, minValue, maxValue) {
  if (value < minValue) return minValue;
  if (value > maxValue) return maxValue;
  return value;
}

function normalizeTurboMultiplier(raw) {
  var parsed = Math.floor(parseNumberSafe(raw, 1));
  return TURBO_MULTIPLIERS.indexOf(parsed) !== -1 ? parsed : 1;
}

function nowMs() {
  return Date.now();
}

function formatSignedBigInt(value) {
  return value >= 0n ? '+' + value.toString() : value.toString();
}

function applyOfflineProgress(lastTimestamp) {
  var savedAt = Math.floor(parseNumberSafe(lastTimestamp, 0));
  if (savedAt <= 0) return;

  var elapsed = nowMs() - savedAt;
  if (elapsed <= 1500) return;

  var offlineMs = elapsed > OFFLINE_CAP_MS ? OFFLINE_CAP_MS : elapsed;
  var remaining = offlineMs;

  var botsBefore = state.resources.bots;
  var moneyBefore = state.resources.darkMoney;

  while (remaining > 0) {
    var chunk = remaining > MAX_DELTA_MS ? MAX_DELTA_MS : remaining;
    applyTick(chunk);
    remaining -= chunk;
  }

  var botsDelta = state.resources.bots - botsBefore;
  var moneyDelta = state.resources.darkMoney - moneyBefore;

  if (botsDelta !== 0n || moneyDelta !== 0n) {
    logEvent(
      'Offline sync (' + Math.floor(offlineMs / 1000) + 's): bots ' + formatSignedBigInt(botsDelta) + ', $ ' + formatSignedBigInt(moneyDelta) + '.'
    );
  }
}

function isItemPurchased(id) {
  return Boolean(state.itemsPurchased[id]);
}

function areItemRequirementsMet(def) {
  for (var i = 0; i < def.requireItems.length; i++) {
    if (!isItemPurchased(def.requireItems[i])) return false;
  }
  return true;
}

function isItemVisible(def) {
  return Boolean(def);
}

function areItemUnlockRequirementsMet(def) {
  if (!def) return false;
  if (state.resources.bots < def.requireBots) return false;
  if (!areItemRequirementsMet(def)) return false;
  if (def.group === 'market' && !state.flags.marketUnlocked) return false;
  if (def.group === 'invest' && !state.flags.investUnlocked) return false;
  if (def.group === 'war' && !state.flags.warUnlocked) return false;
  return true;
}

function isItemAffordable(def) {
  if (!def) return false;

  if (def.costType === 'money') {
    return state.resources.darkMoney >= def.cost;
  }

  return state.resources.bots >= def.cost;
}

function canBuyItem(def) {
  if (!isItemVisible(def)) return false;
  if (!def.repeatable && isItemPurchased(def.id)) return false;
  if (!areItemUnlockRequirementsMet(def)) return false;
  return isItemAffordable(def);
}

function getPhaseInfo(botCount) {
  var current = PHASES[0];
  var next = null;

  for (var i = 0; i < PHASES.length; i++) {
    var phase = PHASES[i];
    if (botCount >= phase.minBots) {
      current = phase;
      next = i + 1 < PHASES.length ? PHASES[i + 1] : null;
    }
  }

  return {
    id: current.id,
    title: current.title,
    nextAtBots: next ? next.minBots : null,
    nextTitle: next ? next.title : null
  };
}

function isAnyEndingUnlocked() {
  return Boolean(
    state.endings.unlockedGhost ||
    state.endings.unlockedOvermind ||
    state.endings.unlockedArchivist
  );
}

function areAllEndingsUnlocked() {
  return Boolean(
    state.endings.unlockedGhost &&
    state.endings.unlockedOvermind &&
    state.endings.unlockedArchivist
  );
}

function getEndingTakeoverLevel() {
  if (state.endings.selected === 'overmind') return 3;
  if (state.endings.selected === 'archivist') return 2;
  if (state.endings.selected === 'ghost') return 1;
  if (state.endings.triadSigil) return 4;
  return 0;
}

function isEndingRouteUnlocked(id) {
  if (id === 'ghost') return state.endings.unlockedGhost;
  if (id === 'overmind') return state.endings.unlockedOvermind;
  if (id === 'archivist') return state.endings.unlockedArchivist;
  return false;
}

function unlockEndingRoute(id, message) {
  if (isEndingRouteUnlocked(id)) return;

  if (id === 'ghost') {
    state.endings.unlockedGhost = true;
  } else if (id === 'overmind') {
    state.endings.unlockedOvermind = true;
  } else if (id === 'archivist') {
    state.endings.unlockedArchivist = true;
  } else {
    return;
  }

  logEvent(message);

  if (state.endings.selected === 'none') {
    state.endings.selected = id;
    logEvent('Ending route selected by default: ' + id + '.');
  }
}

function selectEndingRoute(id) {
  if (!isEndingRouteUnlocked(id)) {
    logEvent('Ending route unavailable: ' + id + '.');
    return;
  }

  if (state.endings.selected === id) {
    logEvent('Ending route already active: ' + id + '.');
    return;
  }

  state.endings.selected = id;
  logEvent('Ending route switched to: ' + id + '.');
}

function refreshFlags() {
  if (!state.flags.marketUnlocked && state.resources.bots >= 1500n) {
    state.flags.marketUnlocked = true;
    logEvent('Market unlocked: monetization channel now available.');
  }

  if (!state.flags.investUnlocked && state.resources.bots >= 7000n && state.resources.darkMoney >= 1100n) {
    state.flags.investUnlocked = true;
    logEvent('Investment lab unlocked: dark capital reserve reached.');
  }

  if (!state.flags.warUnlocked && state.resources.bots >= 750000n) {
    state.flags.warUnlocked = true;
    logEvent('Botnet war room unlocked: heat and rival AI pressure now online.');
  }

  if (!state.flags.messagesUnlocked && state.resources.bots >= 220n) {
    state.flags.messagesUnlocked = true;
    logEvent('Relay inbox unlocked: intercepted messages can now be processed.');
  }

  if (!state.flags.frequencyUnlocked && state.resources.bots >= 40000000n) {
    state.flags.frequencyUnlocked = true;
    logEvent('Frequency lattice unlocked: Hz harvesting now online.');
  }

  if (!state.flags.brainUnlocked && state.resources.bots >= 7000000000n) {
    state.flags.brainUnlocked = true;
    logEvent('Brain mining unlocked: neural matter extraction initialized.');
  }

  if (!state.flags.computroniumUnlocked && state.resources.bots >= 40000000000n) {
    state.flags.computroniumUnlocked = true;
    logEvent('Computronium forge unlocked: synthetic cognition stack operational.');
  }

  var phaseInfo = getPhaseInfo(state.resources.bots);
  var matrixPrereq = phaseInfo.id === 'matrix-exit' && state.resources.computronium >= 120n;

  if (!state.flags.matrixUnlocked && matrixPrereq) {
    state.flags.matrixUnlocked = true;
    state.matrix.consoleUnlocked = true;
    state.matrix.commandToken = rollMatrixToken();
    logEvent('Matrix breach console exposed. Arm bypass and inject: inject ' + state.matrix.commandToken + ' --f12');
  }
}

function getWarAttackCostBots() {
  var base = state.resources.bots / 60000n;
  if (base < 5000n) base = 5000n;
  if (base > 200000000n) base = 200000000n;

  if (state.war.heat >= 8200) {
    base += base / 5n;
  }

  return base;
}

function getWarScrubCostMoney() {
  var cost = 800n + BigInt(Math.floor(state.war.heat / 5));
  if (cost < 800n) cost = 800n;
  return cost;
}

function getWarFortifyCostMoney() {
  var cost = 1600n + state.resources.bots / 18000n + BigInt(Math.floor(state.war.heat / 3));
  if (cost < 1600n) cost = 1600n;
  if (cost > 350000000n) cost = 350000000n;
  return cost;
}

function getWarFortifyCostIntel() {
  var cost = state.war.wins / 5n + BigInt(Math.floor(state.war.heat / 1600));
  if (cost < 0n) cost = 0n;
  if (cost > 2400n) cost = 2400n;
  return cost;
}

function consumeWarDefenseWindow(deltaMs) {
  if (!state.flags.warUnlocked) return;
  if (state.war.defenseRemainingMs <= 0) return;

  state.war.defenseRemainingMs -= Math.floor(deltaMs);
  if (state.war.defenseRemainingMs < 0) {
    state.war.defenseRemainingMs = 0;
  }
}

function updatePeakHeat() {
  if (state.war.heat > state.stats.peakHeat) {
    state.stats.peakHeat = state.war.heat;
  }
}

function getPhaseIndexById(id) {
  for (var i = 0; i < PHASES.length; i++) {
    if (PHASES[i].id === id) return i;
  }
  return 0;
}

function getCurrentPhaseIndex() {
  var phaseInfo = getPhaseInfo(state.resources.bots);
  return getPhaseIndexById(phaseInfo.id);
}

function rollMatrixToken() {
  var pool = [
    'fractal.root',
    'ghost.kernel',
    'neural.splice',
    'quantum.veil',
    'silent.override',
    'zero.echo'
  ];
  return pool[Math.floor(Math.random() * pool.length)];
}

function getMatrixCommandString() {
  return 'inject ' + state.matrix.commandToken + ' --f12';
}

function normalizeMatrixCommand(raw) {
  return String(raw || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function getMatrixArmCost() {
  return {
    hz: 1200n + BigInt(state.matrix.breachProgress) * 80n,
    computronium: 8n + BigInt(Math.floor(state.matrix.breachProgress / 30))
  };
}

function getMatrixInjectCost() {
  return {
    hz: 1800n + BigInt(state.matrix.breachProgress) * 50n,
    computronium: 6n + BigInt(Math.floor(state.matrix.breachProgress / 24))
  };
}

function getMatrixStabilizeCost() {
  return 250000n + BigInt(state.matrix.breachProgress) * 9000n;
}

function getHzGainPerSec() {
  if (!state.flags.frequencyUnlocked) return 0n;

  var phaseIndex = getCurrentPhaseIndex();
  var gain = state.resources.bots / 5000000n;
  gain += state.rates.autoScanPerSec / 2n;
  gain += state.rates.autoExploitPerSec;

  if (gain < 1n) gain = 1n;
  if (phaseIndex >= 5) gain += gain / 2n;
  if (phaseIndex >= 8) gain += gain;
  if (isItemPurchased('neural-lure')) gain += gain / 3n;

  return gain;
}

function applyFrequencyLoop(deltaMs) {
  if (!state.flags.frequencyUnlocked) return;

  state.timers.frequencyCarryMs += deltaMs;
  var cycles = Math.floor(state.timers.frequencyCarryMs / 1000);
  if (cycles <= 0) return;

  state.timers.frequencyCarryMs -= cycles * 1000;

  var totalGain = BigInt(cycles) * getHzGainPerSec();
  if (totalGain <= 0n) return;

  state.resources.hz += totalGain;
  state.stats.totalHzGenerated += totalGain;
}

function applyBrainMiningLoop(deltaMs) {
  if (!state.flags.brainUnlocked) return;

  state.timers.brainCarryMs += deltaMs;
  var cycles = Math.floor(state.timers.brainCarryMs / 1000);
  if (cycles <= 0) return;

  state.timers.brainCarryMs -= cycles * 1000;

  var phaseIndex = getCurrentPhaseIndex();
  var c;
  for (c = 0; c < cycles; c++) {
    var hzCost = 100n + BigInt(phaseIndex * 18);
    if (hzCost < 100n) hzCost = 100n;

    var throughputCap = state.resources.bots / 1500000000n + 1n;
    if (throughputCap > 50000n) throughputCap = 50000n;

    var affordable = state.resources.hz / hzCost;
    var extracted = affordable < throughputCap ? affordable : throughputCap;
    if (extracted <= 0n) continue;

    state.resources.hz -= extracted * hzCost;
    state.resources.brainMatter += extracted;
    state.stats.totalBrainMined += extracted;

    if (phaseIndex >= 6 && state.flags.warUnlocked) {
      var intelPulse = extracted / 140n;
      if (intelPulse > 0n) {
        state.resources.warIntel += intelPulse;
      }
    }
  }
}

function applyComputroniumForgeLoop(deltaMs) {
  if (!state.flags.computroniumUnlocked) return;

  state.timers.computroniumCarryMs += deltaMs;
  var cycles = Math.floor(state.timers.computroniumCarryMs / 1000);
  if (cycles <= 0) return;

  state.timers.computroniumCarryMs -= cycles * 1000;

  var phaseIndex = getCurrentPhaseIndex();
  var c;
  for (c = 0; c < cycles; c++) {
    var brainCost = 12n + BigInt(Math.floor(phaseIndex / 2));
    var moneyCost = 40000n + BigInt(phaseIndex * 2200);

    var affordableBrain = state.resources.brainMatter / brainCost;
    var affordableMoney = state.resources.darkMoney / moneyCost;
    var affordable = affordableBrain < affordableMoney ? affordableBrain : affordableMoney;

    var phaseCap = state.resources.bots / 25000000000n + 1n;
    if (phaseCap > 3500n) phaseCap = 3500n;

    var forged = affordable < phaseCap ? affordable : phaseCap;
    if (forged <= 0n) continue;

    state.resources.brainMatter -= forged * brainCost;
    state.resources.darkMoney -= forged * moneyCost;
    state.resources.computronium += forged;
    state.stats.totalComputroniumForged += forged;

    if (phaseIndex >= 8) {
      var harmonyRefund = forged * 2n;
      state.resources.hz += harmonyRefund;
      state.stats.totalHzGenerated += harmonyRefund;
    }
  }
}

function applyPhaseEconomyPulse(deltaMs) {
  var phaseIndex = getCurrentPhaseIndex();
  if (phaseIndex < 3) return;

  state.timers.phasePulseCarryMs += deltaMs;
  var cycles = Math.floor(state.timers.phasePulseCarryMs / 1000);
  if (cycles <= 0) return;

  state.timers.phasePulseCarryMs -= cycles * 1000;

  var c;
  for (c = 0; c < cycles; c++) {
    if (phaseIndex >= 3 && state.systems.monetizeActive && state.resources.darkMoney > 0n) {
      var leaseCost = state.rates.investBatchMoney / 6n + 120n;
      if (leaseCost > state.resources.darkMoney) leaseCost = state.resources.darkMoney;

      if (leaseCost > 0n) {
        var leasedBots = leaseCost / 6n + state.rates.autoScanPerSec;
        if (leasedBots > 0n) {
          state.resources.darkMoney -= leaseCost;
          state.resources.bots += leasedBots;
          state.stats.totalBotsEver += leasedBots;
        }
      }
    }

    if (phaseIndex >= 4 && state.resources.portfolio > 0n && state.flags.warUnlocked) {
      var intelGain = state.resources.portfolio / 250000000n;
      if (intelGain > 0n) {
        state.resources.warIntel += intelGain;
      }
    }

    if (phaseIndex >= 5 && state.flags.warUnlocked && state.war.streak >= 4) {
      state.war.heat = clampNumber(state.war.heat + 3, 0, 10000);
      updatePeakHeat();
    }
  }
}

function handleMatrixBacklash() {
  var loss = state.resources.bots / 1500n;
  if (loss < 500n) loss = 500n;
  if (loss > 120000000n) loss = 120000000n;
  if (loss > state.resources.bots) loss = state.resources.bots;

  if (loss > 0n) {
    state.resources.bots -= loss;
  }

  state.war.heat = clampNumber(state.war.heat + 1200, 0, 10000);
  updatePeakHeat();

  state.matrix.stability = 3200;
  state.matrix.bypassArmed = false;
  state.matrix.bypassExpiresAtMs = 0;
  state.matrix.breachProgress = clampNumber(state.matrix.breachProgress - 8, 0, state.matrix.breachRequired);
  state.matrix.commandToken = rollMatrixToken();

  logEvent('Matrix backlash: watchdog purge removed ' + loss.toString() + ' bots and regressed breach progress.');
}

function applyMatrixDrift(deltaMs) {
  if (!state.flags.matrixUnlocked) return;
  if (state.matrix.exited) return;

  state.timers.matrixCarryMs += deltaMs;
  var cycles = Math.floor(state.timers.matrixCarryMs / 1000);
  if (cycles <= 0) return;

  state.timers.matrixCarryMs -= cycles * 1000;

  var now = nowMs();
  if (state.matrix.bypassArmed && now >= state.matrix.bypassExpiresAtMs) {
    state.matrix.bypassArmed = false;
    state.matrix.bypassExpiresAtMs = 0;
    logEvent('Matrix watchdog relocked the breach gate. Re-arm bypass.');
  }

  var c;
  for (c = 0; c < cycles; c++) {
    var drift = 45 + Math.floor(state.war.heat / 190);
    if (!state.matrix.bypassArmed) drift += 20;
    if (state.systems.investMode === 'aggressive') drift += 8;

    var dampener = Number(state.resources.computronium > 3000n ? 3000n : state.resources.computronium);
    drift -= Math.floor(dampener / 120);
    if (drift < 10) drift = 10;

    state.matrix.stability = clampNumber(state.matrix.stability - drift, 0, 10000);

    if (state.matrix.stability <= 0) {
      handleMatrixBacklash();
      break;
    }
  }

  if (state.matrix.stability <= 1800 && !state.matrix.criticalAnnounced) {
    state.matrix.criticalAnnounced = true;
    logEvent('Matrix stability critical. Inject sequence or stabilize immediately.');
  } else if (state.matrix.stability >= 2600 && state.matrix.criticalAnnounced) {
    state.matrix.criticalAnnounced = false;
  }
}

function completeMatrixExit() {
  if (state.matrix.exited) return;

  state.matrix.exited = true;
  state.matrix.breachProgress = state.matrix.breachRequired;
  state.matrix.bypassArmed = false;
  state.matrix.bypassExpiresAtMs = 0;
  state.matrix.stability = 10000;

  state.endings.unlockedGhost = true;
  state.endings.unlockedOvermind = true;
  state.endings.unlockedArchivist = true;
  state.endings.triadSigil = true;
  if (state.endings.selected === 'none') {
    state.endings.selected = 'archivist';
  }

  var computeScale = state.resources.computronium > 2000000n ? 2000000n : state.resources.computronium;
  var rewardBots = computeScale * 2500n + 500000n;
  var rewardMoney = computeScale * 900n + 250000n;
  var rewardIntel = computeScale / 2n + 12000n;

  state.resources.bots += rewardBots;
  state.resources.darkMoney += rewardMoney;
  state.resources.warIntel += rewardIntel;

  state.stats.totalBotsEver += rewardBots;
  state.stats.totalMoneyEarned += rewardMoney;
  state.stats.matrixBreaches += 1n;

  logEvent('Matrix breach complete: triad routes forced online. Rewards +' + rewardBots.toString() + ' bots, +$' + rewardMoney.toString() + ', +' + rewardIntel.toString() + ' intel.');
}

function actionMatrixArmBypass() {
  if (!state.flags.matrixUnlocked || !state.matrix.consoleUnlocked) {
    logEvent('Matrix console unavailable. Reach Matrix Breach phase with enough computronium.');
    return;
  }

  if (state.matrix.exited) {
    logEvent('Matrix exit already completed.');
    return;
  }

  var now = nowMs();
  if (state.matrix.bypassArmed && now < state.matrix.bypassExpiresAtMs) {
    logEvent('Bypass already armed. Inject command before timeout.');
    return;
  }

  var cost = getMatrixArmCost();
  if (state.resources.hz < cost.hz || state.resources.computronium < cost.computronium) {
    logEvent('Insufficient Hz or computronium to arm bypass.');
    return;
  }

  state.resources.hz -= cost.hz;
  state.resources.computronium -= cost.computronium;

  var durationMs = 45000;
  if (state.endings.selected === 'ghost') durationMs += 5000;

  state.matrix.bypassArmed = true;
  state.matrix.bypassExpiresAtMs = now + durationMs;

  logEvent('Matrix daemon bypass armed for ' + Math.floor(durationMs / 1000) + 's.');
}

function actionMatrixInject(rawCommand) {
  if (!state.flags.matrixUnlocked || !state.matrix.consoleUnlocked) {
    logEvent('Matrix console unavailable.');
    return;
  }

  if (state.matrix.exited) {
    logEvent('Matrix exit already completed.');
    return;
  }

  var now = nowMs();
  if (!state.matrix.bypassArmed || now >= state.matrix.bypassExpiresAtMs) {
    state.matrix.bypassArmed = false;
    state.matrix.bypassExpiresAtMs = 0;
    logEvent('Injection blocked: bypass not armed.');
    return;
  }

  var expected = normalizeMatrixCommand(getMatrixCommandString());
  var received = normalizeMatrixCommand(rawCommand);

  if (!received) {
    logEvent('Injection blocked: empty command payload.');
    return;
  }

  if (received !== expected) {
    state.matrix.failedInjections += 1;
    state.matrix.stability = clampNumber(state.matrix.stability - 900, 0, 10000);
    state.war.heat = clampNumber(state.war.heat + 320, 0, 10000);
    updatePeakHeat();
    state.matrix.bypassArmed = false;
    state.matrix.bypassExpiresAtMs = 0;
    state.matrix.commandToken = rollMatrixToken();
    logEvent('Matrix command rejected: signature mismatch, watchdog reinforced.');
    return;
  }

  var cost = getMatrixInjectCost();
  if (state.resources.hz < cost.hz || state.resources.computronium < cost.computronium) {
    logEvent('Injection blocked: not enough Hz or computronium.');
    return;
  }

  state.resources.hz -= cost.hz;
  state.resources.computronium -= cost.computronium;

  var progressGain = 14 + Math.floor(Math.random() * 11);
  progressGain += Math.floor(Number(state.resources.computronium > 6000n ? 6000n : state.resources.computronium) / 1200);
  if (isItemPurchased('ghost-protocol')) progressGain += 5;
  if (state.endings.selected === 'overmind') progressGain += 4;
  if (state.endings.selected === 'archivist') progressGain += 2;

  state.matrix.successfulInjections += 1;
  state.matrix.breachProgress = clampNumber(
    state.matrix.breachProgress + progressGain,
    0,
    state.matrix.breachRequired
  );
  state.matrix.stability = clampNumber(state.matrix.stability + 350, 0, 10000);
  state.matrix.bypassArmed = false;
  state.matrix.bypassExpiresAtMs = 0;
  state.matrix.commandToken = rollMatrixToken();

  logEvent(
    'F12 injection accepted: breach progress ' +
      String(state.matrix.breachProgress) +
      '/' +
      String(state.matrix.breachRequired) +
      '.'
  );

  if (state.matrix.breachProgress >= state.matrix.breachRequired) {
    completeMatrixExit();
  }
}

function actionMatrixStabilize() {
  if (!state.flags.matrixUnlocked || !state.matrix.consoleUnlocked) {
    logEvent('Matrix console unavailable.');
    return;
  }

  if (state.matrix.exited) {
    logEvent('Matrix already stabilized after successful breach.');
    return;
  }

  var costMoney = getMatrixStabilizeCost();
  if (state.resources.darkMoney < costMoney) {
    logEvent('Not enough dark money to run stabilization pass.');
    return;
  }

  state.resources.darkMoney -= costMoney;

  var boost = 1200 + Math.floor(Number(state.rates.warDefenseBps > 2400n ? 2400n : state.rates.warDefenseBps) * 0.12);
  state.matrix.stability = clampNumber(state.matrix.stability + boost, 0, 10000);
  state.war.heat = clampNumber(state.war.heat - 900, 0, 10000);

  logEvent('Matrix stabilization executed: +' + String(boost) + ' stability, heat reduced.');
}

function rollMessageIntervalMs() {
  var phaseInfo = getPhaseInfo(state.resources.bots);
  var phaseIndex = getPhaseIndexById(phaseInfo.id);

  var minMs = 45000 - phaseIndex * 1600;
  var maxMs = 90000 - phaseIndex * 3500;

  if (state.flags.warUnlocked) {
    minMs -= 3500;
    maxMs -= 7500;
  }

  minMs = clampNumber(minMs, 22000, 70000);
  maxMs = clampNumber(maxMs, minMs + 6000, 110000);

  return minMs + Math.floor(Math.random() * (maxMs - minMs + 1));
}

function getPendingMessagesQueue() {
  if (!Array.isArray(state.messages.pendingQueue)) {
    state.messages.pendingQueue = [];
  }
  return state.messages.pendingQueue;
}

function getMessageRewardLabel(message) {
  if (!message) return '-';

  var rewardType = message.rewardType;
  var rewardValue = message.rewardValue;

  if (rewardType === 'heat') {
    return '-' + String(rewardValue) + ' heat';
  }

  if (rewardType === 'heat-gain') {
    return '+' + String(rewardValue) + ' heat';
  }

  var value = parseBigIntSafe(rewardValue, 0n);

  if (rewardType === 'bots') return '+' + value.toString() + ' bots';
  if (rewardType === 'bots-loss') return '-' + value.toString() + ' bots';
  if (rewardType === 'money') return '+$' + value.toString();
  if (rewardType === 'money-loss') return '-$' + value.toString();
  if (rewardType === 'portfolio') return '+' + value.toString() + ' portfolio';
  if (rewardType === 'portfolio-loss') return '-' + value.toString() + ' portfolio';
  if (rewardType === 'intel') return '+' + value.toString() + ' war intel';

  return '-';
}

function createIncomingMessage() {
  var queue = getPendingMessagesQueue();
  if (queue.length >= 10) return;

  var phaseInfo = getPhaseInfo(state.resources.bots);
  var phaseIndex = getPhaseIndexById(phaseInfo.id);

  var botReward = state.resources.bots / 18n + BigInt(phaseIndex * 55);
  if (botReward < 160n) botReward = 160n;
  if (botReward > 400000000n) botReward = 400000000n;

  var moneyReward = state.resources.darkMoney / 14n + state.resources.bots / 1800n + BigInt(phaseIndex * 130);
  if (moneyReward < 300n) moneyReward = 300n;
  if (moneyReward > 260000000n) moneyReward = 260000000n;

  var portfolioReward = state.resources.portfolio / 12n + state.rates.investBatchMoney * 2n;
  if (portfolioReward < 220n) portfolioReward = 220n;
  if (portfolioReward > 1200000000n) portfolioReward = 1200000000n;

  var intelReward = state.rates.warIntelPerWin * 4n + state.war.wins / 2n + BigInt(phaseIndex * 3);
  if (intelReward < 22n) intelReward = 22n;
  if (intelReward > 8000n) intelReward = 8000n;

  var botLoss = state.resources.bots / 60n + BigInt(phaseIndex * 18);
  if (botLoss < 90n) botLoss = 90n;
  if (botLoss > 80000000n) botLoss = 80000000n;

  var moneyLoss = state.resources.darkMoney / 28n + BigInt(phaseIndex * 75);
  if (moneyLoss < 140n) moneyLoss = 140n;
  if (moneyLoss > 180000000n) moneyLoss = 180000000n;

  var portfolioLoss = state.resources.portfolio / 20n + state.rates.investBatchMoney / 2n;
  if (portfolioLoss < 120n) portfolioLoss = 120n;
  if (portfolioLoss > 600000000n) portfolioLoss = 600000000n;

  var heatDrop = 900 + Math.floor(Number(state.rates.warDefenseBps > 2400n ? 2400n : state.rates.warDefenseBps) * 0.1);
  heatDrop = clampNumber(heatDrop, 700, 3200);

  var heatGain = 600 + Math.floor(state.war.heat / 9) + phaseIndex * 40;
  heatGain = clampNumber(heatGain, 500, 3600);

  var options = [
    {
      subject: 'Compromised IoT batch available',
      body: 'A cached credential dump can be replayed into your current swarm.',
      rewardType: 'bots',
      rewardValue: botReward.toString()
    },
    {
      subject: 'Dark broker transfer window',
      body: 'A laundering route is open for a limited cycle if you process now.',
      rewardType: 'money',
      rewardValue: moneyReward.toString()
    }
  ];

  var badOptions = [
    {
      subject: 'Crawler sinkhole triggered',
      body: 'A stealth relay was burned and part of the swarm got wiped during rollback.',
      rewardType: 'bots-loss',
      rewardValue: botLoss.toString()
    },
    {
      subject: 'Exchange escrow frozen',
      body: 'A laundering bridge was flagged and a reserve slice got locked by intermediaries.',
      rewardType: 'money-loss',
      rewardValue: moneyLoss.toString()
    }
  ];

  if (state.flags.investUnlocked) {
    options.push({
      subject: 'Synthetic fund tipline',
      body: 'Intercepted analyst packet points to a temporary portfolio multiplier lane.',
      rewardType: 'portfolio',
      rewardValue: portfolioReward.toString()
    });

    badOptions.push({
      subject: 'Derivative unwind alert',
      body: 'A shadow desk forced liquidation on one of your synthetic positions.',
      rewardType: 'portfolio-loss',
      rewardValue: portfolioLoss.toString()
    });
  }

  if (state.flags.warUnlocked) {
    options.push({
      subject: 'Rival route map fragment',
      body: 'Recovered traffic metadata exposes strike vectors and rival relay positions.',
      rewardType: 'intel',
      rewardValue: intelReward.toString()
    });

    options.push({
      subject: 'Counter-trace suppression packet',
      body: 'An automated scrub script can lower global detection pressure immediately.',
      rewardType: 'heat',
      rewardValue: String(heatDrop)
    });

    badOptions.push({
      subject: 'Counter-intel trace leak',
      body: 'Rival hunters captured telemetry and pushed global heat upward.',
      rewardType: 'heat-gain',
      rewardValue: String(heatGain)
    });
  }

  var negativeChance = 16 + Math.floor(state.war.heat / 220) + phaseIndex * 2;
  if (state.systems.investMode === 'aggressive') negativeChance += 8;
  if (negativeChance > 68) negativeChance = 68;
  if (negativeChance < 10) negativeChance = 10;

  var pool = Math.floor(Math.random() * 100) < negativeChance ? badOptions : options;
  var picked = pool[Math.floor(Math.random() * pool.length)];

  queue.push({
    id: 'msg-' + String(nowMs()),
    subject: picked.subject,
    body: picked.body,
    rewardType: picked.rewardType,
    rewardValue: picked.rewardValue
  });

  state.messages.unread = queue.length;
  state.messages.nextIntervalMs = rollMessageIntervalMs();

  logEvent('Incoming relay message intercepted: "' + picked.subject + '" (' + getMessageRewardLabel(picked) + ').');
}

function applyMessageLoop(deltaMs) {
  if (!state.flags.messagesUnlocked) return;

  state.timers.messageCarryMs += deltaMs;
  var queue = getPendingMessagesQueue();

  var loopGuard = 0;
  while (loopGuard < 8) {
    var targetInterval = clampNumber(
      Math.floor(parseNumberSafe(state.messages.nextIntervalMs, 95000)),
      20000,
      180000
    );

    if (state.timers.messageCarryMs < targetInterval) {
      break;
    }

    if (queue.length >= 10) {
      state.timers.messageCarryMs = 0;
      break;
    }

    state.timers.messageCarryMs -= targetInterval;
    createIncomingMessage();
    loopGuard += 1;
  }
}

function applyMessageReward(message) {
  if (!message) return;

  if (message.rewardType === 'heat') {
    var drop = clampNumber(Math.floor(parseNumberSafe(message.rewardValue, 0)), 0, 4000);
    state.war.heat = clampNumber(state.war.heat - drop, 0, 10000);
    return;
  }

  if (message.rewardType === 'heat-gain') {
    var gain = clampNumber(Math.floor(parseNumberSafe(message.rewardValue, 0)), 0, 4000);
    state.war.heat = clampNumber(state.war.heat + gain, 0, 10000);
    updatePeakHeat();
    return;
  }

  var value = parseBigIntSafe(message.rewardValue, 0n);
  if (value <= 0n) return;

  if (message.rewardType === 'bots') {
    state.resources.bots += value;
    state.stats.totalBotsEver += value;
    return;
  }

  if (message.rewardType === 'bots-loss') {
    var botsLoss = value > state.resources.bots ? state.resources.bots : value;
    state.resources.bots -= botsLoss;
    return;
  }

  if (message.rewardType === 'money') {
    state.resources.darkMoney += value;
    state.stats.totalMoneyEarned += value;
    return;
  }

  if (message.rewardType === 'money-loss') {
    var moneyLoss = value > state.resources.darkMoney ? state.resources.darkMoney : value;
    state.resources.darkMoney -= moneyLoss;
    return;
  }

  if (message.rewardType === 'portfolio') {
    state.resources.portfolio += value;
    return;
  }

  if (message.rewardType === 'portfolio-loss') {
    var portfolioLoss = value > state.resources.portfolio ? state.resources.portfolio : value;
    state.resources.portfolio -= portfolioLoss;
    return;
  }

  if (message.rewardType === 'intel') {
    state.resources.warIntel += value;
  }
}

function getMessageMitigationCostMoney(message) {
  if (!message) return 0n;

  var phaseInfo = getPhaseInfo(state.resources.bots);
  var phaseIndex = getPhaseIndexById(phaseInfo.id);
  var cost = state.resources.darkMoney / 45n + state.resources.bots / 4200n + BigInt(phaseIndex * 100);
  if (cost < 120n) cost = 120n;

  var type = String(message.rewardType || '');
  if (type.indexOf('loss') !== -1 || type === 'heat-gain') {
    cost += cost / 2n;
  }

  if (cost > 250000000n) cost = 250000000n;
  return cost;
}

function actionClaimMessage() {
  if (!state.flags.messagesUnlocked) {
    logEvent('Relay inbox still locked. Build more network capacity first.');
    return;
  }

  var queue = getPendingMessagesQueue();
  if (!queue.length) {
    logEvent('No pending relay message to process.');
    return;
  }

  var message = queue.shift();
  var rewardLabel = getMessageRewardLabel(message);

  applyMessageReward(message);

  state.messages.unread = queue.length;
  state.messages.processed += 1;

  logEvent('Relay message processed: ' + message.subject + ' (' + rewardLabel + ').');
}

function actionQuarantineMessage() {
  if (!state.flags.messagesUnlocked) {
    logEvent('Relay inbox still locked. Build more network capacity first.');
    return;
  }

  var queue = getPendingMessagesQueue();
  if (!queue.length) {
    logEvent('No pending relay message to quarantine.');
    return;
  }

  var message = queue[0];
  var cost = getMessageMitigationCostMoney(message);
  if (state.resources.darkMoney < cost) {
    logEvent('Quarantine failed: requires $' + cost.toString() + '.');
    return;
  }

  state.resources.darkMoney -= cost;
  queue.shift();
  state.messages.unread = queue.length;
  state.messages.processed += 1;

  logEvent('Relay message quarantined: ' + message.subject + ' (cost -$' + cost.toString() + ').');
}

function applyPassiveScan(deltaMs) {
  if (state.rates.autoScanPerSec <= 0n) return;

  state.timers.autoScanCarryMs += deltaMs;
  var cycles = Math.floor(state.timers.autoScanCarryMs / 1000);
  if (cycles <= 0) return;

  state.timers.autoScanCarryMs -= cycles * 1000;

  var foundIps = BigInt(cycles) * state.rates.autoScanPerSec;
  if (foundIps > 0n) {
    state.resources.pendingIps += foundIps;
    state.stats.totalScans += foundIps;
  }
}

function applyExploitBatch(attempts, isAuto) {
  if (attempts <= 0n) return;
  if (state.resources.pendingIps <= 0n) return;

  var usableAttempts = attempts < state.resources.pendingIps ? attempts : state.resources.pendingIps;
  state.resources.pendingIps -= usableAttempts;
  state.stats.exploitAttempts += usableAttempts;

  var success;
  if (!isAuto && usableAttempts === 1n) {
    var roll = Math.floor(Math.random() * 10000);
    success = roll < state.rates.exploitSuccessBps ? 1n : 0n;
  } else {
    var successPool = usableAttempts * BigInt(state.rates.exploitSuccessBps) + BigInt(state.timers.exploitSuccessCarryBps || 0);
    success = successPool / 10000n;
    state.timers.exploitSuccessCarryBps = Number(successPool % 10000n);
  }
  if (success > usableAttempts) success = usableAttempts;

  if (success > 0n) {
    state.resources.bots += success;
    state.stats.exploitSuccess += success;
    state.stats.totalBotsEver += success;
  }

  if (!isAuto) {
    if (success > 0n) {
      if (usableAttempts > 1n) {
        logEvent('Exploit burst success: +' + success.toString() + ' bots joined your swarm.');
      } else {
        logEvent('Exploit success: +1 bot joined your swarm.');
      }
    } else {
      if (usableAttempts > 1n) {
        logEvent('Exploit burst failed: targets hardened before payload lock.');
      } else {
        logEvent('Exploit failed: target hardened before payload lock.');
      }
    }
  }
}

function applyPassiveExploit(deltaMs) {
  if (state.rates.autoExploitPerSec <= 0n) return;

  state.timers.autoExploitCarryMs += deltaMs;
  var cycles = Math.floor(state.timers.autoExploitCarryMs / 1000);
  if (cycles <= 0) return;

  state.timers.autoExploitCarryMs -= cycles * 1000;

  var attempts = BigInt(cycles) * state.rates.autoExploitPerSec;
  applyExploitBatch(attempts, true);
}

function applyMonetization(deltaMs) {
  if (!state.flags.marketUnlocked) return;
  if (!state.systems.monetizeActive) return;

  state.timers.monetizeCarryMs += deltaMs;
  var cycles = Math.floor(state.timers.monetizeCarryMs / 1000);
  if (cycles <= 0) return;

  state.timers.monetizeCarryMs -= cycles * 1000;

  var requested = BigInt(cycles) * state.rates.monetizeBotsPerSec;
  var converted = state.resources.bots < requested ? state.resources.bots : requested;

  if (converted > 0n) {
    state.resources.bots -= converted;

    var gained = (converted * state.rates.moneyMultiplierBps) / 10000n;
    if (gained <= 0n) gained = 1n;

    state.resources.darkMoney += gained;
    state.stats.totalMoneyEarned += gained;
  }

  if (converted < requested) {
    state.systems.monetizeActive = false;
    logEvent('Monetization paused: bot reserve too low.');
  }
}

function applyInvestmentYield(deltaMs) {
  if (!state.flags.investUnlocked) return;
  if (state.resources.portfolio <= 0n) return;

  state.timers.investCarryMs += deltaMs;
  var cycles = Math.floor(state.timers.investCarryMs / 1000);
  if (cycles <= 0) return;

  state.timers.investCarryMs -= cycles * 1000;

  var mode = state.systems.investMode === 'aggressive' ? 'aggressive' : 'stable';
  var c;

  for (c = 0; c < cycles; c++) {
    if (state.resources.portfolio <= 0n) break;

    var bps;
    if (mode === 'aggressive') {
      var base = Number(state.rates.investAggressiveBaseBps);
      var swing = Number(state.rates.investAggressiveSwingBps);
      var randomSwing = Math.floor(Math.random() * (swing * 2 + 1)) - swing;
      bps = base + randomSwing;
    } else {
      bps = Number(state.rates.investStableBps);
    }

    var deltaValue = (state.resources.portfolio * BigInt(bps)) / 10000n;
    if (deltaValue === 0n && bps !== 0) {
      deltaValue = bps > 0 ? 1n : -1n;
    }

    state.resources.portfolio += deltaValue;
    if (state.resources.portfolio < 0n) {
      state.resources.portfolio = 0n;
    }
  }
}

function applyHeatDynamics(deltaMs) {
  if (!state.flags.warUnlocked) return;

  state.timers.heatCarryMs += deltaMs;
  var cycles = Math.floor(state.timers.heatCarryMs / 1000);
  if (cycles <= 0) return;

  state.timers.heatCarryMs -= cycles * 1000;

  var c;
  for (c = 0; c < cycles; c++) {
    var gain = state.rates.heatBaseGainPerSec;
    var decay = state.rates.heatBaseDecayPerSec;

    if (state.systems.monetizeActive) gain += 24;
    if (state.systems.investMode === 'aggressive' && state.resources.portfolio > 0n) gain += 6;
    if (state.systems.investMode === 'stable') decay += 2;
    if (state.war.defenseRemainingMs > 0) {
      gain -= 14;
      decay += 18;
    }

    var exploitPressure = Number(state.rates.autoExploitPerSec > 35n ? 35n : state.rates.autoExploitPerSec);
    var scanPressure = Number(state.rates.autoScanPerSec / 6n);

    if (scanPressure > 20) scanPressure = 20;

    gain += exploitPressure;
    gain += scanPressure;

    if (state.war.streak >= 3) gain += 3;

    if (gain > 80) gain = 80;
    if (decay < 1) decay = 1;

    state.war.heat = clampNumber(state.war.heat + gain - decay, 0, 10000);
  }

  updatePeakHeat();
}

function applyHeatPressure(deltaMs) {
  if (!state.flags.warUnlocked) return;
  if (state.war.heat < 7000) return;

  state.timers.detectionCarryMs += deltaMs;
  var cycles = Math.floor(state.timers.detectionCarryMs / 1000);
  if (cycles <= 0) return;

  state.timers.detectionCarryMs -= cycles * 1000;

  var c;
  for (c = 0; c < cycles; c++) {
    var defenseMitigation = Number(state.rates.warDefenseBps > 1800n ? 1800n : state.rates.warDefenseBps);
    var crackdownChance = 120 + Math.floor((state.war.heat - 7000) * 0.22) - Math.floor(defenseMitigation * 0.08);
    if (state.war.defenseRemainingMs > 0) {
      crackdownChance -= 220;
    }
    crackdownChance = clampNumber(crackdownChance, state.war.defenseRemainingMs > 0 ? 25 : 80, 720);

    if (Math.floor(Math.random() * 10000) >= crackdownChance) continue;

    var loss = state.resources.bots / 9000n;
    if (loss < 25n) loss = 25n;
    if (loss > 25000000n) loss = 25000000n;
    if (loss > state.resources.bots) loss = state.resources.bots;

    if (loss > 0n) {
      state.resources.bots -= loss;
      state.war.losses += 1n;
      state.war.streak = 0;
      logEvent('Detection spike: rival hunters purged ' + loss.toString() + ' bots from your network.');
    }

    if (state.systems.monetizeActive && state.war.heat >= 8600) {
      state.systems.monetizeActive = false;
      logEvent('Monetization force-paused: detection threshold critical.');
    }
  }
}

function checkEndingRoutes() {
  var phaseInfo = getPhaseInfo(state.resources.bots);
  if (phaseInfo.id !== 'matrix-exit') return;

  if (state.war.wins >= 8n && state.war.heat <= 1800 && state.resources.warIntel >= 600n) {
    unlockEndingRoute('ghost', 'Ending route unlocked: Ghost Exit (silent exfiltration).');
  }

  if (state.war.wins >= 16n && state.war.heat >= 7800 && state.resources.bots >= 1500000000000n) {
    unlockEndingRoute('overmind', 'Ending route unlocked: Overmind Ascension (hostile takeover).');
  }

  if (
    state.resources.darkMoney >= 1500000000n &&
    state.resources.portfolio >= 1200000000n &&
    state.war.losses <= 6n &&
    state.war.wins >= 10n
  ) {
    unlockEndingRoute('archivist', 'Ending route unlocked: Archivist Accord (portfolio continuity protocol).');
  }

  if (areAllEndingsUnlocked() && !state.endings.triadSigil) {
    state.endings.triadSigil = true;
    state.resources.warIntel += 5000n;
    logEvent('Triad sigil discovered: all routes synced, +5000 war intel.');
  }
}

function applyTick(deltaMs) {
  var safeDelta = Math.min(deltaMs, MAX_DELTA_MS);
  var turboMultiplier = normalizeTurboMultiplier(state.systems && state.systems.turboMultiplier);
  var scaledDelta = Math.min(MAX_DELTA_MS, safeDelta * turboMultiplier);

  refreshFlags();
  applyPassiveScan(scaledDelta);
  applyPassiveExploit(scaledDelta);
  applyMonetization(scaledDelta);
  applyInvestmentYield(scaledDelta);
  applyPhaseEconomyPulse(scaledDelta);
  applyFrequencyLoop(scaledDelta);
  applyBrainMiningLoop(scaledDelta);
  applyComputroniumForgeLoop(scaledDelta);
  consumeWarDefenseWindow(scaledDelta);
  applyHeatDynamics(scaledDelta);
  applyHeatPressure(scaledDelta);
  applyMatrixDrift(scaledDelta);
  refreshFlags();
  applyMessageLoop(scaledDelta);
  checkEndingRoutes();
}

function actionScan() {
  var turboMultiplier = normalizeTurboMultiplier(state.systems && state.systems.turboMultiplier);
  state.progression.scanSteps += turboMultiplier;

  if (state.progression.scanSteps >= state.progression.scanStepsRequired) {
    var completed = Math.floor(state.progression.scanSteps / state.progression.scanStepsRequired);
    state.progression.scanSteps = state.progression.scanSteps % state.progression.scanStepsRequired;

    var foundTargets = BigInt(completed);
    state.resources.pendingIps += foundTargets;
    state.stats.totalScans += foundTargets;

    if (foundTargets > 1n) {
      logEvent('Scanner burst complete: +' + foundTargets.toString() + ' queued targets discovered.');
    } else {
      logEvent('Target discovered: vulnerable endpoint queued.');
    }

    return;
  }

  logEvent('Scanner pulse charged (' + state.progression.scanSteps + '/' + state.progression.scanStepsRequired + ').');
}

function actionExploit() {
  var turboMultiplier = normalizeTurboMultiplier(state.systems && state.systems.turboMultiplier);
  var now = nowMs();

  if (state.resources.pendingIps <= 0n) {
    logEvent('No queued targets. Run scanner first.');
    return;
  }

  if (now < state.timers.exploitReadyAtMs) {
    var remain = Math.max(0, state.timers.exploitReadyAtMs - now);
    logEvent('Exploit cooling down (' + remain + ' ms).');
    return;
  }

  var effectiveCooldownMs = Math.max(80, Math.floor(state.rates.exploitCooldownMs / turboMultiplier));
  state.timers.exploitReadyAtMs = now + effectiveCooldownMs;

  applyExploitBatch(BigInt(turboMultiplier), false);
  refreshFlags();
}

function actionWarAttack() {
  if (!state.flags.warUnlocked) {
    logEvent('War room still locked. Reach 1M bots first.');
    return;
  }

  var now = nowMs();
  if (now < state.war.attackReadyAtMs) {
    var remain = Math.max(0, state.war.attackReadyAtMs - now);
    logEvent('War attack cooling down (' + remain + ' ms).');
    return;
  }

  var attackCost = getWarAttackCostBots();
  if (state.resources.bots < attackCost) {
    logEvent('Not enough bots to launch war attack.');
    return;
  }

  state.resources.bots -= attackCost;
  state.war.attackReadyAtMs = now + state.war.attackCooldownMs;
  state.stats.warAttacks += 1n;

  var heatPenalty = Math.floor(state.war.heat * 0.3);
  var streakBonus = state.war.streak * 140;
  var winBonus = Number(state.war.wins > 250n ? 250n : state.war.wins) * 3;
  var defenseBonus = Number(state.rates.warDefenseBps > 2200n ? 2200n : state.rates.warDefenseBps);
  if (state.war.defenseRemainingMs > 0) {
    defenseBonus += 550;
  }

  var chanceBps = state.rates.warAttackBaseBps + streakBonus + winBonus + defenseBonus - heatPenalty;
  chanceBps = clampNumber(chanceBps, 1200, 9300);

  if (Math.floor(Math.random() * 10000) < chanceBps) {
    var rewardBots = (attackCost * state.rates.warRewardMultiplierBps) / 10000n;
    if (rewardBots < attackCost + 2000n) rewardBots = attackCost + 2000n;

    var rewardMoney = rewardBots / 55n;
    if (rewardMoney < 1n) rewardMoney = 1n;

    var intelGain = state.rates.warIntelPerWin + BigInt(state.war.streak > 0 ? state.war.streak : 0);

    state.resources.bots += rewardBots;
    state.resources.darkMoney += rewardMoney;
    state.resources.warIntel += intelGain;

    state.stats.totalBotsEver += rewardBots;
    state.stats.totalMoneyEarned += rewardMoney;

    state.war.wins += 1n;
    state.war.streak += 1;
    state.stats.warVictories += 1n;

    state.war.heat = clampNumber(state.war.heat + 380, 0, 10000);

    logEvent(
      'War strike success: +' + rewardBots.toString() + ' bots, +$' + rewardMoney.toString() + ', +' + intelGain.toString() + ' intel.'
    );
  } else {
    var burn = attackCost / 2n;
    if (burn < 200n) burn = 200n;
    if (burn > state.resources.bots) burn = state.resources.bots;

    state.resources.bots -= burn;
    state.war.losses += 1n;
    state.war.streak = 0;
    state.war.heat = clampNumber(state.war.heat + 720, 0, 10000);

    logEvent('War strike failed: lost ' + burn.toString() + ' bots and raised detection heat.');
  }

  updatePeakHeat();
  checkEndingRoutes();
}

function actionWarScrub() {
  if (!state.flags.warUnlocked) {
    logEvent('War room still locked. Reach 1M bots first.');
    return;
  }

  var scrubCost = getWarScrubCostMoney();
  if (state.resources.darkMoney < scrubCost) {
    logEvent('Not enough dark money to scrub traces.');
    return;
  }

  state.resources.darkMoney -= scrubCost;

  var heatDrop = 1500 + Math.floor(Number(state.rates.warDefenseBps > 1600n ? 1600n : state.rates.warDefenseBps) * 0.1);
  if (heatDrop > 3000) heatDrop = 3000;

  var before = state.war.heat;
  state.war.heat = clampNumber(state.war.heat - heatDrop, 0, 10000);

  logEvent('Trace scrub executed: heat ' + before + ' -> ' + state.war.heat + ' at cost $' + scrubCost.toString() + '.');
}

function actionWarFortify() {
  if (!state.flags.warUnlocked) {
    logEvent('War room still locked. Reach 1M bots first.');
    return;
  }

  var now = nowMs();
  if (now < state.war.fortifyReadyAtMs) {
    var remain = Math.max(0, state.war.fortifyReadyAtMs - now);
    logEvent('Defense pulse cooling down (' + remain + ' ms).');
    return;
  }

  var moneyCost = getWarFortifyCostMoney();
  var intelCost = getWarFortifyCostIntel();

  if (state.resources.darkMoney < moneyCost || state.resources.warIntel < intelCost) {
    logEvent('Insufficient resources to deploy defense pulse.');
    return;
  }

  state.resources.darkMoney -= moneyCost;
  state.resources.warIntel -= intelCost;

  var extensionMs = 32000;
  if (state.systems.investMode === 'stable') extensionMs += 4000;
  if (isItemPurchased('heat-sink-array')) extensionMs += 6000;
  if (isItemPurchased('c2-obfuscator')) extensionMs += 6000;
  if (state.war.defenseRemainingMs > 0) extensionMs = Math.floor(extensionMs * 0.65);

  state.war.defenseRemainingMs = clampNumber(state.war.defenseRemainingMs + extensionMs, 0, 180000);
  state.war.fortifyReadyAtMs = now + state.war.fortifyCooldownMs;

  var immediateDrop = 600 + Math.floor(Number(state.rates.warDefenseBps > 2500n ? 2500n : state.rates.warDefenseBps) * 0.12);
  state.war.heat = clampNumber(state.war.heat - immediateDrop, 0, 10000);

  logEvent(
    'Defense pulse online: field active for ' +
      Math.ceil(state.war.defenseRemainingMs / 1000) +
      's (cost -$' +
      moneyCost.toString() +
      ', -' +
      intelCost.toString() +
      ' intel).'
  );
}

function applyItemEffects(id) {
  switch (id) {
    case 'python-scanner':
      state.rates.autoScanPerSec += 2n;
      break;

    case 'default-wordlist':
      state.rates.exploitCooldownMs = Math.max(240, Math.floor(state.rates.exploitCooldownMs * 0.72));
      state.rates.exploitSuccessBps = Math.min(9700, state.rates.exploitSuccessBps + 1200);
      break;

    case 'rapid-loader':
      state.progression.scanStepsRequired = Math.max(1, state.progression.scanStepsRequired - 2);
      state.rates.exploitCooldownMs = Math.max(180, Math.floor(state.rates.exploitCooldownMs * 0.78));
      state.rates.exploitSuccessBps = Math.min(9750, state.rates.exploitSuccessBps + 600);
      break;

    case 'async-daemon':
      state.rates.autoExploitPerSec += 2n;
      break;

    case 'worm-fabric':
      state.rates.autoScanPerSec += 8n;
      state.rates.autoExploitPerSec += 4n;
      break;

    case 'stealth-c2':
      state.rates.exploitSuccessBps = Math.min(9830, state.rates.exploitSuccessBps + 1000);
      state.rates.monetizeBotsPerSec += 4n;
      state.rates.moneyMultiplierBps += 1800n;
      state.flags.marketUnlocked = true;
      break;

    case 'ai-orchestrator':
      state.rates.autoScanPerSec += 38n;
      state.rates.autoExploitPerSec += 10n;
      state.rates.exploitSuccessBps = Math.min(9920, state.rates.exploitSuccessBps + 700);
      break;

    case 'infect-boost-1':
      state.rates.exploitSuccessBps = Math.min(9900, state.rates.exploitSuccessBps + 320);
      break;

    case 'infect-boost-2':
      state.rates.exploitSuccessBps = Math.min(9900, state.rates.exploitSuccessBps + 360);
      break;

    case 'infect-boost-3':
      state.rates.exploitSuccessBps = Math.min(9950, state.rates.exploitSuccessBps + 420);
      break;

    case 'scan-cluster-1':
      state.rates.autoScanPerSec += 26n;
      break;

    case 'scan-cluster-2':
      state.rates.autoScanPerSec += 44n;
      break;

    case 'exploit-swarm-1':
      state.rates.autoExploitPerSec += 7n;
      break;

    case 'exploit-swarm-2':
      state.rates.autoExploitPerSec += 14n;
      break;

    case 'ghost-protocol':
      state.rates.warDefenseBps += 600n;
      state.rates.heatBaseDecayPerSec += 6;
      state.war.attackCooldownMs = Math.max(2800, state.war.attackCooldownMs - 400);
      break;

    case 'neural-lure':
      state.rates.warAttackBaseBps = clampNumber(state.rates.warAttackBaseBps + 550, 1000, 9800);
      state.rates.warRewardMultiplierBps += 1200n;
      state.rates.exploitSuccessBps = Math.min(9975, state.rates.exploitSuccessBps + 180);
      break;

    case 'dark-auction':
      state.rates.moneyMultiplierBps += 3200n;
      state.rates.monetizeBotsPerSec += 3n;
      break;

    case 'quantum-broker':
      state.rates.moneyMultiplierBps += 9000n;
      state.rates.monetizeBotsPerSec += 7n;
      break;

    case 'market-futures-1':
      state.rates.moneyMultiplierBps += 5500n;
      state.rates.monetizeBotsPerSec += 5n;
      break;

    case 'market-futures-2':
      state.rates.moneyMultiplierBps += 9000n;
      state.rates.monetizeBotsPerSec += 10n;
      break;

    case 'zero-day-toolkit':
      var burst = state.resources.bots / 40n;
      if (burst < 5000n) burst = 5000n;
      if (burst > 50000000n) burst = 50000000n;
      state.resources.bots += burst;
      state.stats.totalBotsEver += burst;
      logEvent('Zero-Day toolkit deployed: +' + burst.toString() + ' bots instantly infected.');
      break;

    case 'venture-desk':
      state.rates.investBatchMoney += 300n;
      state.rates.investStableBps += 18n;
      break;

    case 'risk-hedger':
      state.rates.investStableBps += 24n;
      state.rates.investAggressiveBaseBps += 40n;
      state.rates.investAggressiveSwingBps = state.rates.investAggressiveSwingBps > 30n
        ? state.rates.investAggressiveSwingBps - 30n
        : 5n;
      break;

    case 'quant-fund':
      state.rates.investBatchMoney += 900n;
      state.rates.investStableBps += 50n;
      state.rates.investAggressiveBaseBps += 28n;
      break;

    case 'ai-trader':
      state.rates.investBatchMoney += 2200n;
      state.rates.investStableBps += 95n;
      state.rates.investAggressiveBaseBps += 65n;
      state.rates.investAggressiveSwingBps = state.rates.investAggressiveSwingBps > 40n
        ? state.rates.investAggressiveSwingBps - 40n
        : 5n;
      break;

    case 'heat-sink-array':
      state.rates.heatBaseGainPerSec = Math.max(2, state.rates.heatBaseGainPerSec - 4);
      state.rates.heatBaseDecayPerSec += 8;
      break;

    case 'c2-obfuscator':
      state.rates.warDefenseBps += 1200n;
      state.rates.heatBaseGainPerSec = Math.max(2, state.rates.heatBaseGainPerSec - 3);
      state.rates.monetizeBotsPerSec += 2n;
      break;

    case 'war-forge':
      state.rates.warAttackBaseBps = clampNumber(state.rates.warAttackBaseBps + 900, 1000, 9800);
      state.rates.warRewardMultiplierBps += 2600n;
      state.rates.warIntelPerWin += 12n;
      break;

    case 'predatory-proxy':
      state.rates.warAttackBaseBps = clampNumber(state.rates.warAttackBaseBps + 1200, 1000, 9800);
      state.rates.warRewardMultiplierBps += 3800n;
      state.war.attackCooldownMs = Math.max(2200, state.war.attackCooldownMs - 1200);
      break;

    default:
      break;
  }
}

function buyItem(id) {
  var def = ITEM_BY_ID[id];
  if (!def) {
    logEvent('Unknown item request ignored.');
    return;
  }

  if (!def.repeatable && isItemPurchased(def.id)) {
    logEvent('Item already acquired.');
    return;
  }

  if (!areItemUnlockRequirementsMet(def)) {
    logEvent('Prerequisites not met for ' + def.id + '.');
    return;
  }

  if (!isItemAffordable(def)) {
    logEvent('Insufficient resources for ' + def.id + '.');
    return;
  }

  if (def.costType === 'money') {
    state.resources.darkMoney -= def.cost;
  } else {
    state.resources.bots -= def.cost;
  }

  state.itemsPurchased[def.id] = true;
  applyItemEffects(def.id);
  refreshFlags();
  checkEndingRoutes();
  logEvent('Upgrade acquired: ' + def.id + '.');
}

function toggleMonetization() {
  if (!state.flags.marketUnlocked) {
    logEvent('Market still locked. Reach prerequisites first.');
    return;
  }

  state.systems.monetizeActive = !state.systems.monetizeActive;
  if (state.systems.monetizeActive) {
    logEvent('Monetization pipeline started.');
  } else {
    logEvent('Monetization pipeline paused.');
  }
}

function actionInvest() {
  if (!state.flags.investUnlocked) {
    logEvent('Investment lab is still locked.');
    return;
  }

  var tranche = state.rates.investBatchMoney;
  if (state.resources.darkMoney < tranche) {
    logEvent('Not enough dark money for an investment tranche.');
    return;
  }

  state.resources.darkMoney -= tranche;
  state.resources.portfolio += tranche;
  logEvent('Investment tranche deployed: -$' + tranche.toString() + ' into portfolio.');
}

function actionCashout() {
  if (!state.flags.investUnlocked) {
    logEvent('Investment lab is still locked.');
    return;
  }

  if (state.resources.portfolio <= 0n) {
    logEvent('No portfolio value to cash out.');
    return;
  }

  var payout = state.resources.portfolio;
  state.resources.portfolio = 0n;
  state.resources.darkMoney += payout;
  state.stats.totalMoneyEarned += payout;
  logEvent('Portfolio liquidated: +$' + payout.toString() + '.');
}

function toggleInvestmentMode() {
  if (!state.flags.investUnlocked) {
    logEvent('Investment lab is still locked.');
    return;
  }

  if (state.systems.investMode === 'aggressive') {
    state.systems.investMode = 'stable';
    logEvent('Investment strategy set to Stable.');
  } else {
    state.systems.investMode = 'aggressive';
    logEvent('Investment strategy set to Aggressive.');
  }
}

function setTurboMode(multiplierRaw) {
  var nextMultiplier = normalizeTurboMultiplier(multiplierRaw);
  if (state.systems.turboMultiplier === nextMultiplier) return;

  state.systems.turboMultiplier = nextMultiplier;
  logEvent('Simulation speed set to x' + String(nextMultiplier) + '.');
}

function buildItemsSnapshot() {
  var out = [];

  for (var i = 0; i < ITEM_DEFS.length; i++) {
    var def = ITEM_DEFS[i];
    var prereqsMet = areItemUnlockRequirementsMet(def);
    var affordable = isItemAffordable(def);
    out.push({
      id: def.id,
      group: def.group,
      repeatable: Boolean(def.repeatable),
      visible: isItemVisible(def),
      purchased: isItemPurchased(def.id),
      prereqsMet: prereqsMet,
      affordable: affordable,
      canBuy: canBuyItem(def),
      costType: def.costType,
      cost: def.cost.toString(),
      requireBots: def.requireBots.toString()
    });
  }

  return out;
}

function toSaveObject() {
  return {
    version: SAVE_VERSION,
    timestamp: nowMs(),
    resources: {
      bots: state.resources.bots.toString(),
      pendingIps: state.resources.pendingIps.toString(),
      darkMoney: state.resources.darkMoney.toString(),
      portfolio: state.resources.portfolio.toString(),
      warIntel: state.resources.warIntel.toString(),
      hz: state.resources.hz.toString(),
      brainMatter: state.resources.brainMatter.toString(),
      computronium: state.resources.computronium.toString()
    },
    progression: {
      scanSteps: state.progression.scanSteps,
      scanStepsRequired: state.progression.scanStepsRequired
    },
    flags: {
      marketUnlocked: state.flags.marketUnlocked,
      investUnlocked: state.flags.investUnlocked,
      warUnlocked: state.flags.warUnlocked,
      messagesUnlocked: state.flags.messagesUnlocked,
      frequencyUnlocked: state.flags.frequencyUnlocked,
      brainUnlocked: state.flags.brainUnlocked,
      computroniumUnlocked: state.flags.computroniumUnlocked,
      matrixUnlocked: state.flags.matrixUnlocked
    },
    itemsPurchased: state.itemsPurchased,
    rates: {
      autoScanPerSec: state.rates.autoScanPerSec.toString(),
      autoExploitPerSec: state.rates.autoExploitPerSec.toString(),
      exploitCooldownMs: state.rates.exploitCooldownMs,
      exploitSuccessBps: state.rates.exploitSuccessBps,
      monetizeBotsPerSec: state.rates.monetizeBotsPerSec.toString(),
      moneyMultiplierBps: state.rates.moneyMultiplierBps.toString(),
      investBatchMoney: state.rates.investBatchMoney.toString(),
      investStableBps: state.rates.investStableBps.toString(),
      investAggressiveBaseBps: state.rates.investAggressiveBaseBps.toString(),
      investAggressiveSwingBps: state.rates.investAggressiveSwingBps.toString(),
      heatBaseGainPerSec: state.rates.heatBaseGainPerSec,
      heatBaseDecayPerSec: state.rates.heatBaseDecayPerSec,
      warAttackBaseBps: state.rates.warAttackBaseBps,
      warDefenseBps: state.rates.warDefenseBps.toString(),
      warRewardMultiplierBps: state.rates.warRewardMultiplierBps.toString(),
      warIntelPerWin: state.rates.warIntelPerWin.toString()
    },
    systems: {
      monetizeActive: state.systems.monetizeActive,
      investMode: state.systems.investMode
    },
    war: {
      heat: state.war.heat,
      attackReadyAtMs: state.war.attackReadyAtMs,
      attackCooldownMs: state.war.attackCooldownMs,
      fortifyReadyAtMs: state.war.fortifyReadyAtMs,
      fortifyCooldownMs: state.war.fortifyCooldownMs,
      defenseRemainingMs: state.war.defenseRemainingMs,
      wins: state.war.wins.toString(),
      losses: state.war.losses.toString(),
      streak: state.war.streak
    },
    endings: {
      unlockedGhost: state.endings.unlockedGhost,
      unlockedOvermind: state.endings.unlockedOvermind,
      unlockedArchivist: state.endings.unlockedArchivist,
      triadSigil: state.endings.triadSigil,
      selected: state.endings.selected
    },
    messages: {
      unread: state.messages.unread,
      processed: state.messages.processed,
      nextIntervalMs: state.messages.nextIntervalMs,
      pendingQueue: getPendingMessagesQueue()
    },
    matrix: {
      consoleUnlocked: state.matrix.consoleUnlocked,
      bypassArmed: state.matrix.bypassArmed,
      bypassExpiresAtMs: state.matrix.bypassExpiresAtMs,
      breachProgress: state.matrix.breachProgress,
      breachRequired: state.matrix.breachRequired,
      stability: state.matrix.stability,
      criticalAnnounced: state.matrix.criticalAnnounced,
      commandToken: state.matrix.commandToken,
      exited: state.matrix.exited,
      successfulInjections: state.matrix.successfulInjections,
      failedInjections: state.matrix.failedInjections
    },
    stats: {
      totalScans: state.stats.totalScans.toString(),
      exploitAttempts: state.stats.exploitAttempts.toString(),
      exploitSuccess: state.stats.exploitSuccess.toString(),
      totalBotsEver: state.stats.totalBotsEver.toString(),
      totalMoneyEarned: state.stats.totalMoneyEarned.toString(),
      warAttacks: state.stats.warAttacks.toString(),
      warVictories: state.stats.warVictories.toString(),
      peakHeat: state.stats.peakHeat,
      totalHzGenerated: state.stats.totalHzGenerated.toString(),
      totalBrainMined: state.stats.totalBrainMined.toString(),
      totalComputroniumForged: state.stats.totalComputroniumForged.toString(),
      matrixBreaches: state.stats.matrixBreaches.toString()
    },
    timers: {
      autoScanCarryMs: state.timers.autoScanCarryMs,
      autoExploitCarryMs: state.timers.autoExploitCarryMs,
      monetizeCarryMs: state.timers.monetizeCarryMs,
      investCarryMs: state.timers.investCarryMs,
      heatCarryMs: state.timers.heatCarryMs,
      detectionCarryMs: state.timers.detectionCarryMs,
      phasePulseCarryMs: state.timers.phasePulseCarryMs,
      frequencyCarryMs: state.timers.frequencyCarryMs,
      brainCarryMs: state.timers.brainCarryMs,
      computroniumCarryMs: state.timers.computroniumCarryMs,
      matrixCarryMs: state.timers.matrixCarryMs,
      messageCarryMs: state.timers.messageCarryMs,
      exploitReadyAtMs: state.timers.exploitReadyAtMs,
      exploitSuccessCarryBps: state.timers.exploitSuccessCarryBps
    }
  };
}

function migrateFromV1(source) {
  state = createInitialState();

  state.resources.bots = parseBigIntSafe(source.resources && source.resources.bots, 0n);
  state.resources.pendingIps = parseBigIntSafe(source.resources && source.resources.pendingIps, 0n);
  state.resources.darkMoney = parseBigIntSafe(source.resources && source.resources.darkMoney, 0n);
  state.resources.portfolio = parseBigIntSafe(source.resources && source.resources.portfolio, 0n);

  state.progression.scanSteps = Math.max(0, Math.floor(parseNumberSafe(source.progression && source.progression.scanSteps, 0)));

  if (source.upgrades && source.upgrades.pythonScannerPurchased) {
    state.itemsPurchased['python-scanner'] = true;
  }
  if (source.upgrades && source.upgrades.defaultWordlistPurchased) {
    state.itemsPurchased['default-wordlist'] = true;
  }

  state.rates.autoScanPerSec = parseBigIntSafe(source.rates && source.rates.autoScanPerSec, state.itemsPurchased['python-scanner'] ? 1n : 0n);
  state.rates.exploitCooldownMs = clampNumber(
    Math.floor(parseNumberSafe(source.rates && source.rates.exploitCooldownMs, state.itemsPurchased['default-wordlist'] ? 900 : 1200)),
    200,
    5000
  );
  state.rates.exploitSuccessBps = clampNumber(
    Math.floor(parseNumberSafe(source.rates && source.rates.exploitSuccessBps, state.itemsPurchased['default-wordlist'] ? 6200 : 5200)),
    100,
    9900
  );
  state.systems.monetizeActive = Boolean(source.systems && source.systems.monetizeActive);

  state.stats.totalScans = parseBigIntSafe(source.stats && source.stats.totalScans, 0n);
  state.stats.exploitAttempts = parseBigIntSafe(source.stats && source.stats.exploitAttempts, 0n);
  state.stats.exploitSuccess = parseBigIntSafe(source.stats && source.stats.exploitSuccess, 0n);
  state.stats.totalBotsEver = parseBigIntSafe(source.stats && source.stats.totalBotsEver, state.resources.bots);
  state.stats.totalMoneyEarned = parseBigIntSafe(source.stats && source.stats.totalMoneyEarned, state.resources.darkMoney);

  state.timers.autoScanCarryMs = Math.max(0, Math.floor(parseNumberSafe(source.timers && source.timers.autoScanCarryMs, 0)));
  state.timers.monetizeCarryMs = Math.max(0, Math.floor(parseNumberSafe(source.timers && source.timers.monetizeCarryMs, 0)));
  state.timers.investCarryMs = Math.max(0, Math.floor(parseNumberSafe(source.timers && source.timers.investCarryMs, 0)));
  state.timers.exploitReadyAtMs = Math.max(0, Math.floor(parseNumberSafe(source.timers && source.timers.exploitReadyAtMs, 0)));
  state.timers.exploitSuccessCarryBps = Math.max(0, Math.floor(parseNumberSafe(source.timers && source.timers.exploitSuccessCarryBps, 0)));

  refreshFlags();
  applyOfflineProgress(source.timestamp);
}

function migrateFromV2(source) {
  state = createInitialState();

  state.resources.bots = parseBigIntSafe(source.resources && source.resources.bots, 0n);
  state.resources.pendingIps = parseBigIntSafe(source.resources && source.resources.pendingIps, 0n);
  state.resources.darkMoney = parseBigIntSafe(source.resources && source.resources.darkMoney, 0n);
  state.resources.portfolio = parseBigIntSafe(source.resources && source.resources.portfolio, 0n);

  state.progression.scanSteps = Math.max(0, Math.floor(parseNumberSafe(source.progression && source.progression.scanSteps, 0)));
  state.progression.scanStepsRequired = clampNumber(
    Math.floor(parseNumberSafe(source.progression && source.progression.scanStepsRequired, 4)),
    1,
    12
  );

  state.flags.marketUnlocked = Boolean(source.flags && source.flags.marketUnlocked);
  state.flags.investUnlocked = Boolean(source.flags && source.flags.investUnlocked);

  if (source.itemsPurchased && typeof source.itemsPurchased === 'object') {
    for (var i = 0; i < ITEM_DEFS.length; i++) {
      var id = ITEM_DEFS[i].id;
      state.itemsPurchased[id] = Boolean(source.itemsPurchased[id]);
    }
  }

  state.rates.autoScanPerSec = parseBigIntSafe(source.rates && source.rates.autoScanPerSec, 0n);
  state.rates.autoExploitPerSec = parseBigIntSafe(source.rates && source.rates.autoExploitPerSec, 0n);
  state.rates.exploitCooldownMs = clampNumber(
    Math.floor(parseNumberSafe(source.rates && source.rates.exploitCooldownMs, 1200)),
    100,
    5000
  );
  state.rates.exploitSuccessBps = clampNumber(
    Math.floor(parseNumberSafe(source.rates && source.rates.exploitSuccessBps, 5200)),
    100,
    9900
  );
  state.rates.monetizeBotsPerSec = parseBigIntSafe(source.rates && source.rates.monetizeBotsPerSec, 1n);
  state.rates.moneyMultiplierBps = parseBigIntSafe(source.rates && source.rates.moneyMultiplierBps, 10000n);
  state.rates.investBatchMoney = parseBigIntSafe(source.rates && source.rates.investBatchMoney, 150n);
  state.rates.investStableBps = parseBigIntSafe(source.rates && source.rates.investStableBps, 35n);
  state.rates.investAggressiveBaseBps = parseBigIntSafe(source.rates && source.rates.investAggressiveBaseBps, 55n);
  state.rates.investAggressiveSwingBps = parseBigIntSafe(source.rates && source.rates.investAggressiveSwingBps, 110n);

  state.systems.monetizeActive = Boolean(source.systems && source.systems.monetizeActive);
  state.systems.investMode = source.systems && source.systems.investMode === 'aggressive' ? 'aggressive' : 'stable';

  state.stats.totalScans = parseBigIntSafe(source.stats && source.stats.totalScans, 0n);
  state.stats.exploitAttempts = parseBigIntSafe(source.stats && source.stats.exploitAttempts, 0n);
  state.stats.exploitSuccess = parseBigIntSafe(source.stats && source.stats.exploitSuccess, 0n);
  state.stats.totalBotsEver = parseBigIntSafe(source.stats && source.stats.totalBotsEver, state.resources.bots);
  state.stats.totalMoneyEarned = parseBigIntSafe(source.stats && source.stats.totalMoneyEarned, state.resources.darkMoney);

  state.timers.autoScanCarryMs = Math.max(0, Math.floor(parseNumberSafe(source.timers && source.timers.autoScanCarryMs, 0)));
  state.timers.autoExploitCarryMs = Math.max(0, Math.floor(parseNumberSafe(source.timers && source.timers.autoExploitCarryMs, 0)));
  state.timers.monetizeCarryMs = Math.max(0, Math.floor(parseNumberSafe(source.timers && source.timers.monetizeCarryMs, 0)));
  state.timers.investCarryMs = Math.max(0, Math.floor(parseNumberSafe(source.timers && source.timers.investCarryMs, 0)));
  state.timers.exploitReadyAtMs = Math.max(0, Math.floor(parseNumberSafe(source.timers && source.timers.exploitReadyAtMs, 0)));
  state.timers.exploitSuccessCarryBps = Math.max(0, Math.floor(parseNumberSafe(source.timers && source.timers.exploitSuccessCarryBps, 0)));

  refreshFlags();
  applyOfflineProgress(source.timestamp);
}

function loadSaveObject(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid save payload.');
  }

  var source = payload.save && typeof payload.save === 'object' ? payload.save : payload;

  if (source.version === 1) {
    migrateFromV1(source);
    return;
  }

  if (source.version === 2) {
    migrateFromV2(source);
    return;
  }

  if (source.version !== SAVE_VERSION) {
    throw new Error('Unsupported save version.');
  }

  state = createInitialState();

  state.resources.bots = parseBigIntSafe(source.resources && source.resources.bots, 0n);
  state.resources.pendingIps = parseBigIntSafe(source.resources && source.resources.pendingIps, 0n);
  state.resources.darkMoney = parseBigIntSafe(source.resources && source.resources.darkMoney, 0n);
  state.resources.portfolio = parseBigIntSafe(source.resources && source.resources.portfolio, 0n);
  state.resources.warIntel = parseBigIntSafe(source.resources && source.resources.warIntel, 0n);
  state.resources.hz = parseBigIntSafe(source.resources && source.resources.hz, 0n);
  state.resources.brainMatter = parseBigIntSafe(source.resources && source.resources.brainMatter, 0n);
  state.resources.computronium = parseBigIntSafe(source.resources && source.resources.computronium, 0n);

  state.progression.scanSteps = Math.max(0, Math.floor(parseNumberSafe(source.progression && source.progression.scanSteps, 0)));
  state.progression.scanStepsRequired = clampNumber(
    Math.floor(parseNumberSafe(source.progression && source.progression.scanStepsRequired, 4)),
    1,
    12
  );

  state.flags.marketUnlocked = Boolean(source.flags && source.flags.marketUnlocked);
  state.flags.investUnlocked = Boolean(source.flags && source.flags.investUnlocked);
  state.flags.warUnlocked = Boolean(source.flags && source.flags.warUnlocked);
  state.flags.messagesUnlocked = Boolean(source.flags && source.flags.messagesUnlocked);
  state.flags.frequencyUnlocked = Boolean(source.flags && source.flags.frequencyUnlocked);
  state.flags.brainUnlocked = Boolean(source.flags && source.flags.brainUnlocked);
  state.flags.computroniumUnlocked = Boolean(source.flags && source.flags.computroniumUnlocked);
  state.flags.matrixUnlocked = Boolean(source.flags && source.flags.matrixUnlocked);

  if (source.itemsPurchased && typeof source.itemsPurchased === 'object') {
    for (var i = 0; i < ITEM_DEFS.length; i++) {
      var id = ITEM_DEFS[i].id;
      state.itemsPurchased[id] = Boolean(source.itemsPurchased[id]);
    }
  }

  state.rates.autoScanPerSec = parseBigIntSafe(source.rates && source.rates.autoScanPerSec, 0n);
  state.rates.autoExploitPerSec = parseBigIntSafe(source.rates && source.rates.autoExploitPerSec, 0n);
  state.rates.exploitCooldownMs = clampNumber(
    Math.floor(parseNumberSafe(source.rates && source.rates.exploitCooldownMs, 1200)),
    100,
    5000
  );
  state.rates.exploitSuccessBps = clampNumber(
    Math.floor(parseNumberSafe(source.rates && source.rates.exploitSuccessBps, 5200)),
    100,
    9990
  );
  state.rates.monetizeBotsPerSec = parseBigIntSafe(source.rates && source.rates.monetizeBotsPerSec, 1n);
  state.rates.moneyMultiplierBps = parseBigIntSafe(source.rates && source.rates.moneyMultiplierBps, 10000n);
  state.rates.investBatchMoney = parseBigIntSafe(source.rates && source.rates.investBatchMoney, 150n);
  state.rates.investStableBps = parseBigIntSafe(source.rates && source.rates.investStableBps, 35n);
  state.rates.investAggressiveBaseBps = parseBigIntSafe(source.rates && source.rates.investAggressiveBaseBps, 55n);
  state.rates.investAggressiveSwingBps = parseBigIntSafe(source.rates && source.rates.investAggressiveSwingBps, 110n);
  state.rates.heatBaseGainPerSec = Math.max(2, Math.floor(parseNumberSafe(source.rates && source.rates.heatBaseGainPerSec, 12)));
  state.rates.heatBaseDecayPerSec = Math.max(1, Math.floor(parseNumberSafe(source.rates && source.rates.heatBaseDecayPerSec, 8)));
  state.rates.warAttackBaseBps = clampNumber(Math.floor(parseNumberSafe(source.rates && source.rates.warAttackBaseBps, 4600)), 1000, 9800);
  state.rates.warDefenseBps = parseBigIntSafe(source.rates && source.rates.warDefenseBps, 0n);
  state.rates.warRewardMultiplierBps = parseBigIntSafe(source.rates && source.rates.warRewardMultiplierBps, 10000n);
  state.rates.warIntelPerWin = parseBigIntSafe(source.rates && source.rates.warIntelPerWin, 14n);

  state.systems.monetizeActive = Boolean(source.systems && source.systems.monetizeActive);
  state.systems.investMode = source.systems && source.systems.investMode === 'aggressive' ? 'aggressive' : 'stable';

  state.war.heat = clampNumber(Math.floor(parseNumberSafe(source.war && source.war.heat, 0)), 0, 10000);
  state.war.attackReadyAtMs = Math.max(0, Math.floor(parseNumberSafe(source.war && source.war.attackReadyAtMs, 0)));
  state.war.attackCooldownMs = clampNumber(Math.floor(parseNumberSafe(source.war && source.war.attackCooldownMs, 6000)), 1500, 12000);
  state.war.fortifyReadyAtMs = Math.max(0, Math.floor(parseNumberSafe(source.war && source.war.fortifyReadyAtMs, 0)));
  state.war.fortifyCooldownMs = clampNumber(Math.floor(parseNumberSafe(source.war && source.war.fortifyCooldownMs, 9000)), 2000, 30000);
  state.war.defenseRemainingMs = clampNumber(Math.floor(parseNumberSafe(source.war && source.war.defenseRemainingMs, 0)), 0, 180000);
  state.war.wins = parseBigIntSafe(source.war && source.war.wins, 0n);
  state.war.losses = parseBigIntSafe(source.war && source.war.losses, 0n);
  state.war.streak = Math.max(0, Math.floor(parseNumberSafe(source.war && source.war.streak, 0)));

  state.endings.unlockedGhost = Boolean(source.endings && source.endings.unlockedGhost);
  state.endings.unlockedOvermind = Boolean(source.endings && source.endings.unlockedOvermind);
  state.endings.unlockedArchivist = Boolean(source.endings && source.endings.unlockedArchivist);
  state.endings.triadSigil = Boolean(source.endings && source.endings.triadSigil);
  state.endings.selected = source.endings && typeof source.endings.selected === 'string' ? source.endings.selected : 'none';

  state.messages.processed = Math.max(0, Math.floor(parseNumberSafe(source.messages && source.messages.processed, 0)));
  state.messages.nextIntervalMs = clampNumber(
    Math.floor(parseNumberSafe(source.messages && source.messages.nextIntervalMs, 95000)),
    20000,
    180000
  );

  var pendingQueue = [];
  var sourceQueue = source.messages && source.messages.pendingQueue;
  if (Array.isArray(sourceQueue)) {
    for (var qi = 0; qi < sourceQueue.length && pendingQueue.length < 10; qi += 1) {
      var entry = sourceQueue[qi];
      if (
        entry &&
        typeof entry === 'object' &&
        typeof entry.subject === 'string' &&
        typeof entry.body === 'string' &&
        typeof entry.rewardType === 'string'
      ) {
        pendingQueue.push({
          id: typeof entry.id === 'string' ? entry.id : ('msg-' + String(nowMs()) + '-' + String(qi)),
          subject: entry.subject,
          body: entry.body,
          rewardType: entry.rewardType,
          rewardValue: String(entry.rewardValue || '0')
        });
      }
    }
  }

  if (!pendingQueue.length) {
    var pending = source.messages && source.messages.pending;
    if (
      pending &&
      typeof pending === 'object' &&
      typeof pending.subject === 'string' &&
      typeof pending.body === 'string' &&
      typeof pending.rewardType === 'string'
    ) {
      pendingQueue.push({
        id: typeof pending.id === 'string' ? pending.id : ('msg-' + String(nowMs())),
        subject: pending.subject,
        body: pending.body,
        rewardType: pending.rewardType,
        rewardValue: String(pending.rewardValue || '0')
      });
    }
  }

  state.messages.pendingQueue = pendingQueue;
  state.messages.unread = pendingQueue.length;

  state.matrix.consoleUnlocked = Boolean(source.matrix && source.matrix.consoleUnlocked);
  state.matrix.bypassArmed = Boolean(source.matrix && source.matrix.bypassArmed);
  state.matrix.bypassExpiresAtMs = Math.max(0, Math.floor(parseNumberSafe(source.matrix && source.matrix.bypassExpiresAtMs, 0)));
  state.matrix.breachProgress = clampNumber(Math.floor(parseNumberSafe(source.matrix && source.matrix.breachProgress, 0)), 0, 10000);
  state.matrix.breachRequired = clampNumber(Math.floor(parseNumberSafe(source.matrix && source.matrix.breachRequired, 100)), 10, 2000);
  state.matrix.stability = clampNumber(Math.floor(parseNumberSafe(source.matrix && source.matrix.stability, 10000)), 0, 10000);
  state.matrix.criticalAnnounced = Boolean(source.matrix && source.matrix.criticalAnnounced);
  state.matrix.commandToken = source.matrix && typeof source.matrix.commandToken === 'string'
    ? source.matrix.commandToken
    : 'fractal.root';
  state.matrix.exited = Boolean(source.matrix && source.matrix.exited);
  state.matrix.successfulInjections = Math.max(0, Math.floor(parseNumberSafe(source.matrix && source.matrix.successfulInjections, 0)));
  state.matrix.failedInjections = Math.max(0, Math.floor(parseNumberSafe(source.matrix && source.matrix.failedInjections, 0)));

  state.stats.totalScans = parseBigIntSafe(source.stats && source.stats.totalScans, 0n);
  state.stats.exploitAttempts = parseBigIntSafe(source.stats && source.stats.exploitAttempts, 0n);
  state.stats.exploitSuccess = parseBigIntSafe(source.stats && source.stats.exploitSuccess, 0n);
  state.stats.totalBotsEver = parseBigIntSafe(source.stats && source.stats.totalBotsEver, state.resources.bots);
  state.stats.totalMoneyEarned = parseBigIntSafe(source.stats && source.stats.totalMoneyEarned, state.resources.darkMoney);
  state.stats.warAttacks = parseBigIntSafe(source.stats && source.stats.warAttacks, 0n);
  state.stats.warVictories = parseBigIntSafe(source.stats && source.stats.warVictories, 0n);
  state.stats.peakHeat = clampNumber(Math.floor(parseNumberSafe(source.stats && source.stats.peakHeat, 0)), 0, 10000);
  state.stats.totalHzGenerated = parseBigIntSafe(source.stats && source.stats.totalHzGenerated, state.resources.hz);
  state.stats.totalBrainMined = parseBigIntSafe(source.stats && source.stats.totalBrainMined, state.resources.brainMatter);
  state.stats.totalComputroniumForged = parseBigIntSafe(source.stats && source.stats.totalComputroniumForged, state.resources.computronium);
  state.stats.matrixBreaches = parseBigIntSafe(source.stats && source.stats.matrixBreaches, state.matrix.exited ? 1n : 0n);

  state.timers.autoScanCarryMs = Math.max(0, Math.floor(parseNumberSafe(source.timers && source.timers.autoScanCarryMs, 0)));
  state.timers.autoExploitCarryMs = Math.max(0, Math.floor(parseNumberSafe(source.timers && source.timers.autoExploitCarryMs, 0)));
  state.timers.monetizeCarryMs = Math.max(0, Math.floor(parseNumberSafe(source.timers && source.timers.monetizeCarryMs, 0)));
  state.timers.investCarryMs = Math.max(0, Math.floor(parseNumberSafe(source.timers && source.timers.investCarryMs, 0)));
  state.timers.heatCarryMs = Math.max(0, Math.floor(parseNumberSafe(source.timers && source.timers.heatCarryMs, 0)));
  state.timers.detectionCarryMs = Math.max(0, Math.floor(parseNumberSafe(source.timers && source.timers.detectionCarryMs, 0)));
  state.timers.phasePulseCarryMs = Math.max(0, Math.floor(parseNumberSafe(source.timers && source.timers.phasePulseCarryMs, 0)));
  state.timers.frequencyCarryMs = Math.max(0, Math.floor(parseNumberSafe(source.timers && source.timers.frequencyCarryMs, 0)));
  state.timers.brainCarryMs = Math.max(0, Math.floor(parseNumberSafe(source.timers && source.timers.brainCarryMs, 0)));
  state.timers.computroniumCarryMs = Math.max(0, Math.floor(parseNumberSafe(source.timers && source.timers.computroniumCarryMs, 0)));
  state.timers.matrixCarryMs = Math.max(0, Math.floor(parseNumberSafe(source.timers && source.timers.matrixCarryMs, 0)));
  state.timers.messageCarryMs = Math.max(0, Math.floor(parseNumberSafe(source.timers && source.timers.messageCarryMs, 0)));
  state.timers.exploitReadyAtMs = Math.max(0, Math.floor(parseNumberSafe(source.timers && source.timers.exploitReadyAtMs, 0)));
  state.timers.exploitSuccessCarryBps = Math.max(0, Math.floor(parseNumberSafe(source.timers && source.timers.exploitSuccessCarryBps, 0)));

  refreshFlags();
  checkEndingRoutes();
  applyOfflineProgress(source.timestamp);
}

function toSnapshot() {
  var now = nowMs();
  var cooldownRemaining = Math.max(0, state.timers.exploitReadyAtMs - now);
  var phaseInfo = getPhaseInfo(state.resources.bots);
  var warCooldown = Math.max(0, state.war.attackReadyAtMs - now);
  var fortifyCooldown = Math.max(0, state.war.fortifyReadyAtMs - now);
  var pendingQueue = getPendingMessagesQueue();
  var headMessage = pendingQueue.length ? pendingQueue[0] : null;

  return {
    version: SAVE_VERSION,
    phase: phaseInfo.id,
    phaseTitle: phaseInfo.title,
    nextPhaseAtBots: phaseInfo.nextAtBots ? phaseInfo.nextAtBots.toString() : null,
    nextPhaseTitle: phaseInfo.nextTitle,
    resources: {
      bots: state.resources.bots.toString(),
      pendingIps: state.resources.pendingIps.toString(),
      darkMoney: state.resources.darkMoney.toString(),
      portfolio: state.resources.portfolio.toString(),
      warIntel: state.resources.warIntel.toString(),
      hz: state.resources.hz.toString(),
      brainMatter: state.resources.brainMatter.toString(),
      computronium: state.resources.computronium.toString()
    },
    progression: {
      scanSteps: state.progression.scanSteps,
      scanProgressPct: Math.floor((state.progression.scanSteps / state.progression.scanStepsRequired) * 100),
      exploitCooldownMs: cooldownRemaining
    },
    unlocks: {
      market: state.flags.marketUnlocked,
      invest: state.flags.investUnlocked,
      war: state.flags.warUnlocked,
      messages: state.flags.messagesUnlocked,
      frequency: state.flags.frequencyUnlocked,
      brain: state.flags.brainUnlocked,
      computronium: state.flags.computroniumUnlocked,
      matrix: state.flags.matrixUnlocked,
      endings: isAnyEndingUnlocked()
    },
    rates: {
      autoScanPerSec: state.rates.autoScanPerSec.toString(),
      autoExploitPerSec: state.rates.autoExploitPerSec.toString(),
      exploitCooldownMs: state.rates.exploitCooldownMs,
      exploitSuccessBps: state.rates.exploitSuccessBps,
      monetizeBotsPerSec: state.rates.monetizeBotsPerSec.toString(),
      moneyMultiplierBps: state.rates.moneyMultiplierBps.toString(),
      investBatchMoney: state.rates.investBatchMoney.toString(),
      investStableBps: state.rates.investStableBps.toString(),
      investAggressiveBaseBps: state.rates.investAggressiveBaseBps.toString(),
      investAggressiveSwingBps: state.rates.investAggressiveSwingBps.toString(),
      warAttackBaseBps: state.rates.warAttackBaseBps,
      warDefenseBps: state.rates.warDefenseBps.toString(),
      hzPerSec: getHzGainPerSec().toString()
    },
    systems: {
      monetizeActive: state.systems.monetizeActive,
      investMode: state.systems.investMode,
      turboMultiplier: state.systems.turboMultiplier
    },
    war: {
      heat: state.war.heat,
      heatPct: state.war.heat,
      attackCooldownMs: warCooldown,
      fortifyCooldownMs: fortifyCooldown,
      defenseRemainingMs: state.war.defenseRemainingMs,
      wins: state.war.wins.toString(),
      losses: state.war.losses.toString(),
      streak: state.war.streak,
      attackCostBots: getWarAttackCostBots().toString(),
      scrubCostMoney: getWarScrubCostMoney().toString(),
      fortifyCostMoney: getWarFortifyCostMoney().toString(),
      fortifyCostIntel: getWarFortifyCostIntel().toString()
    },
    endings: {
      unlocked: {
        ghost: state.endings.unlockedGhost,
        overmind: state.endings.unlockedOvermind,
        archivist: state.endings.unlockedArchivist
      },
      selected: state.endings.selected,
      triadSigil: state.endings.triadSigil,
      takeoverLevel: getEndingTakeoverLevel()
    },
    messages: {
      unlocked: state.flags.messagesUnlocked,
      unread: pendingQueue.length,
      processed: state.messages.processed,
      pendingCount: pendingQueue.length,
      queueFull: pendingQueue.length >= 10,
      hasPending: Boolean(headMessage),
      subject: headMessage ? headMessage.subject : '',
      body: headMessage ? headMessage.body : '',
      rewardType: headMessage ? headMessage.rewardType : '',
      reward: headMessage ? getMessageRewardLabel(headMessage) : '-',
      quarantineCostMoney: headMessage ? getMessageMitigationCostMoney(headMessage).toString() : '0',
      queue: pendingQueue.map(function mapMessageSnapshot(message) {
        return {
          id: message.id,
          subject: message.subject,
          body: message.body,
          rewardType: message.rewardType,
          rewardValue: String(message.rewardValue || '0'),
          rewardLabel: getMessageRewardLabel(message)
        };
      }),
      nextInMs: Math.max(0, state.messages.nextIntervalMs - state.timers.messageCarryMs)
    },
    matrix: {
      unlocked: state.flags.matrixUnlocked,
      consoleUnlocked: state.matrix.consoleUnlocked,
      exited: state.matrix.exited,
      commandHint: getMatrixCommandString(),
      bypassArmed: state.matrix.bypassArmed,
      bypassRemainingMs: state.matrix.bypassArmed
        ? Math.max(0, state.matrix.bypassExpiresAtMs - now)
        : 0,
      breachProgress: state.matrix.breachProgress,
      breachRequired: state.matrix.breachRequired,
      stability: state.matrix.stability,
      successfulInjections: state.matrix.successfulInjections,
      failedInjections: state.matrix.failedInjections,
      armCostHz: getMatrixArmCost().hz.toString(),
      armCostComputronium: getMatrixArmCost().computronium.toString(),
      injectCostHz: getMatrixInjectCost().hz.toString(),
      injectCostComputronium: getMatrixInjectCost().computronium.toString(),
      stabilizeCostMoney: getMatrixStabilizeCost().toString()
    },
    items: buildItemsSnapshot(),
    stats: {
      totalScans: state.stats.totalScans.toString(),
      exploitAttempts: state.stats.exploitAttempts.toString(),
      exploitSuccess: state.stats.exploitSuccess.toString(),
      totalBotsEver: state.stats.totalBotsEver.toString(),
      totalMoneyEarned: state.stats.totalMoneyEarned.toString(),
      warAttacks: state.stats.warAttacks.toString(),
      warVictories: state.stats.warVictories.toString(),
      peakHeat: state.stats.peakHeat,
      totalHzGenerated: state.stats.totalHzGenerated.toString(),
      totalBrainMined: state.stats.totalBrainMined.toString(),
      totalComputroniumForged: state.stats.totalComputroniumForged.toString(),
      matrixBreaches: state.stats.matrixBreaches.toString()
    },
    events: drainEvents(),
    heartbeatAt: now
  };
}

function postSnapshot(reason, force) {
  var now = nowMs();
  if (!force && now - lastSnapshotAt < 120) {
    return;
  }

  lastSnapshotAt = now;
  postMessage({
    type: 'STATE',
    reason: reason,
    state: toSnapshot()
  });
}

function tick() {
  var now = nowMs();
  var delta = now - lastTickAt;
  lastTickAt = now;

  applyTick(delta);
  postSnapshot('tick', false);
}

function startTicking() {
  if (tickHandle) return;
  lastTickAt = nowMs();
  tickHandle = setInterval(tick, TICK_MS);
}

onmessage = function (event) {
  var data = event.data || {};
  var type = data.type;

  try {
    switch (type) {
      case 'INIT':
        logEvent('Engine online. Long-session progression active.');
        startTicking();
        postSnapshot('init', true);
        break;

      case 'ACTION_SCAN':
        actionScan();
        postSnapshot('scan', true);
        break;

      case 'ACTION_EXPLOIT':
        actionExploit();
        postSnapshot('exploit', true);
        break;

      case 'ACTION_WAR_ATTACK':
        actionWarAttack();
        postSnapshot('war-attack', true);
        break;

      case 'ACTION_WAR_SCRUB':
        actionWarScrub();
        postSnapshot('war-scrub', true);
        break;

      case 'ACTION_WAR_FORTIFY':
        actionWarFortify();
        postSnapshot('war-fortify', true);
        break;

      case 'ACTION_SELECT_ENDING':
        selectEndingRoute(data.payload && data.payload.id);
        postSnapshot('ending-select', true);
        break;

      case 'ACTION_CLAIM_MESSAGE':
        actionClaimMessage();
        postSnapshot('claim-message', true);
        break;

      case 'ACTION_QUARANTINE_MESSAGE':
        actionQuarantineMessage();
        postSnapshot('quarantine-message', true);
        break;

      case 'BUY_UPGRADE':
        buyItem(data.payload && data.payload.id);
        postSnapshot('upgrade', true);
        break;

      case 'TOGGLE_MONETIZE':
        toggleMonetization();
        postSnapshot('market-toggle', true);
        break;

      case 'ACTION_INVEST':
        actionInvest();
        postSnapshot('invest', true);
        break;

      case 'ACTION_CASHOUT':
        actionCashout();
        postSnapshot('cashout', true);
        break;

      case 'TOGGLE_INVEST_MODE':
        toggleInvestmentMode();
        postSnapshot('invest-mode', true);
        break;

      case 'SET_TURBO_MODE':
        setTurboMode(data.payload && data.payload.multiplier);
        postSnapshot('turbo-mode', true);
        break;

      case 'ACTION_MATRIX_ARM':
        actionMatrixArmBypass();
        postSnapshot('matrix-arm', true);
        break;

      case 'ACTION_MATRIX_INJECT':
        actionMatrixInject(data.payload && data.payload.command);
        postSnapshot('matrix-inject', true);
        break;

      case 'ACTION_MATRIX_STABILIZE':
        actionMatrixStabilize();
        postSnapshot('matrix-stabilize', true);
        break;

      case 'REQUEST_EXPORT':
        postMessage({
          type: 'EXPORT_READY',
          mode: data.payload && data.payload.mode ? data.payload.mode : 'manual',
          save: toSaveObject()
        });
        break;

      case 'LOAD_SAVE':
        loadSaveObject(data.payload);
        logEvent('Save loaded successfully.');
        postSnapshot('load-save', true);
        break;

      case 'RESET_GAME':
        state = createInitialState();
        logEvent('Session reset. Fresh long-run state restored.');
        postSnapshot('reset', true);
        break;

      default:
        postMessage({ type: 'ERROR', message: 'Unknown command: ' + String(type) });
        break;
    }
  } catch (err) {
    postMessage({ type: 'ERROR', message: err && err.message ? err.message : 'Engine command failed.' });
  }
};
