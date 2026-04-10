/* ==================================================
   Infinite BotNet Worker - Simulation Engine
   Long-session progression with prerequisite-based catalog
   ================================================== */

'use strict';

var SAVE_VERSION = 2;
var TICK_MS = 100;
var MAX_DELTA_MS = 300000;
var OFFLINE_CAP_MS = 6 * 60 * 60 * 1000;

var PHASES = [
  { id: 'garage', title: 'Garage', minBots: 0n },
  { id: 'automation', title: 'Automation', minBots: 100n },
  { id: 'monetization', title: 'Monetization', minBots: 10000n },
  { id: 'botnet-war', title: 'Botnet War', minBots: 1000000n },
  { id: 'infrastructure', title: 'Infrastructure', minBots: 50000000n },
  { id: 'opinion-ops', title: 'Opinion Ops', minBots: 500000000n },
  { id: 'machine-awakening', title: 'Machine Awakening', minBots: 2000000000n },
  { id: 'biological-barrier', title: 'Biological Barrier', minBots: 8000000000n },
  { id: 'singular-intelligence', title: 'Singular Intelligence', minBots: 50000000000n },
  { id: 'matrix-exit', title: 'Matrix Exit', minBots: 1000000000000n }
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
    requireItems: ['python-scanner']
  },
  {
    id: 'rapid-loader',
    group: 'upgrade',
    costType: 'bots',
    cost: 90n,
    requireBots: 90n,
    requireItems: ['default-wordlist']
  },
  {
    id: 'async-daemon',
    group: 'upgrade',
    costType: 'bots',
    cost: 180n,
    requireBots: 180n,
    requireItems: ['rapid-loader']
  },
  {
    id: 'worm-fabric',
    group: 'upgrade',
    costType: 'bots',
    cost: 1200n,
    requireBots: 1200n,
    requireItems: ['async-daemon']
  },
  {
    id: 'stealth-c2',
    group: 'upgrade',
    costType: 'bots',
    cost: 10000n,
    requireBots: 10000n,
    requireItems: ['worm-fabric']
  },
  {
    id: 'ai-orchestrator',
    group: 'upgrade',
    costType: 'bots',
    cost: 80000n,
    requireBots: 80000n,
    requireItems: ['stealth-c2']
  },
  {
    id: 'infect-boost-1',
    group: 'upgrade',
    costType: 'bots',
    cost: 25000n,
    requireBots: 25000n,
    requireItems: ['stealth-c2']
  },
  {
    id: 'infect-boost-2',
    group: 'upgrade',
    costType: 'bots',
    cost: 50000n,
    requireBots: 50000n,
    requireItems: ['infect-boost-1']
  },
  {
    id: 'infect-boost-3',
    group: 'upgrade',
    costType: 'bots',
    cost: 100000n,
    requireBots: 100000n,
    requireItems: ['infect-boost-2']
  },
  {
    id: 'scan-cluster-1',
    group: 'upgrade',
    costType: 'bots',
    cost: 180000n,
    requireBots: 180000n,
    requireItems: ['ai-orchestrator']
  },
  {
    id: 'scan-cluster-2',
    group: 'upgrade',
    costType: 'bots',
    cost: 360000n,
    requireBots: 360000n,
    requireItems: ['scan-cluster-1']
  },
  {
    id: 'exploit-swarm-1',
    group: 'upgrade',
    costType: 'bots',
    cost: 220000n,
    requireBots: 220000n,
    requireItems: ['ai-orchestrator']
  },
  {
    id: 'exploit-swarm-2',
    group: 'upgrade',
    costType: 'bots',
    cost: 480000n,
    requireBots: 480000n,
    requireItems: ['exploit-swarm-1']
  },
  {
    id: 'dark-auction',
    group: 'market',
    costType: 'money',
    cost: 500n,
    requireBots: 15000n,
    requireItems: ['stealth-c2']
  },
  {
    id: 'quantum-broker',
    group: 'market',
    costType: 'money',
    cost: 5000n,
    requireBots: 120000n,
    requireItems: ['dark-auction']
  },
  {
    id: 'market-futures-1',
    group: 'market',
    costType: 'money',
    cost: 20000n,
    requireBots: 300000n,
    requireItems: ['quantum-broker']
  },
  {
    id: 'market-futures-2',
    group: 'market',
    costType: 'money',
    cost: 70000n,
    requireBots: 700000n,
    requireItems: ['market-futures-1']
  },
  {
    id: 'zero-day-toolkit',
    group: 'market',
    costType: 'money',
    cost: 2500n,
    requireBots: 50000n,
    requireItems: ['stealth-c2']
  },
  {
    id: 'venture-desk',
    group: 'invest',
    costType: 'money',
    cost: 3000n,
    requireBots: 25000n,
    requireItems: ['dark-auction']
  },
  {
    id: 'risk-hedger',
    group: 'invest',
    costType: 'money',
    cost: 12000n,
    requireBots: 90000n,
    requireItems: ['venture-desk']
  },
  {
    id: 'quant-fund',
    group: 'invest',
    costType: 'money',
    cost: 48000n,
    requireBots: 300000n,
    requireItems: ['risk-hedger']
  },
  {
    id: 'ai-trader',
    group: 'invest',
    costType: 'money',
    cost: 150000n,
    requireBots: 800000n,
    requireItems: ['quant-fund']
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
      portfolio: 0n
    },
    progression: {
      scanSteps: 0,
      scanStepsRequired: 5
    },
    flags: {
      marketUnlocked: false,
      investUnlocked: false
    },
    itemsPurchased: createItemsPurchased(),
    rates: {
      autoScanPerSec: 0n,
      autoExploitPerSec: 0n,
      exploitCooldownMs: 1200,
      exploitSuccessBps: 5200,
      monetizeBotsPerSec: 1n,
      moneyMultiplierBps: 10000n,
      investBatchMoney: 150n,
      investStableBps: 35n,
      investAggressiveBaseBps: 55n,
      investAggressiveSwingBps: 110n
    },
    systems: {
      monetizeActive: false,
      investMode: 'stable'
    },
    stats: {
      totalScans: 0n,
      exploitAttempts: 0n,
      exploitSuccess: 0n,
      totalBotsEver: 0n,
      totalMoneyEarned: 0n
    },
    timers: {
      autoScanCarryMs: 0,
      autoExploitCarryMs: 0,
      monetizeCarryMs: 0,
      investCarryMs: 0,
      exploitReadyAtMs: 0,
      exploitSuccessCarryBps: 0
    }
  };
}

function logEvent(message) {
  eventQueue.push(message);
  if (eventQueue.length > 30) {
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
  if (isItemPurchased(def.id)) return false;
  if (state.resources.bots < def.requireBots) return false;
  if (!areItemRequirementsMet(def)) return false;
  if (def.group === 'market' && !state.flags.marketUnlocked) return false;
  if (def.group === 'invest' && !state.flags.investUnlocked) return false;
  return true;
}

function canBuyItem(def) {
  if (!isItemVisible(def)) return false;

  if (def.costType === 'money') {
    return state.resources.darkMoney >= def.cost;
  }
  return state.resources.bots >= def.cost;
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

function refreshFlags() {
  if (!state.flags.marketUnlocked && state.resources.bots >= 10000n) {
    state.flags.marketUnlocked = true;
    logEvent('Market unlocked: monetization channel now available.');
  }

  if (!state.flags.investUnlocked && state.resources.bots >= 25000n && isItemPurchased('dark-auction')) {
    state.flags.investUnlocked = true;
    logEvent('Investment lab unlocked: portfolio strategies are now available.');
  }
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
      logEvent('Exploit success: +1 bot joined your swarm.');
    } else {
      logEvent('Exploit failed: target hardened before payload lock.');
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

function applyTick(deltaMs) {
  var safeDelta = Math.min(deltaMs, MAX_DELTA_MS);

  applyPassiveScan(safeDelta);
  applyPassiveExploit(safeDelta);
  applyMonetization(safeDelta);
  applyInvestmentYield(safeDelta);
  refreshFlags();
}

function actionScan() {
  state.progression.scanSteps += 1;

  if (state.progression.scanSteps >= state.progression.scanStepsRequired) {
    state.progression.scanSteps = 0;
    state.resources.pendingIps += 1n;
    state.stats.totalScans += 1n;
    logEvent('Target discovered: vulnerable endpoint queued.');
    return;
  }

  logEvent('Scanner pulse charged (' + state.progression.scanSteps + '/' + state.progression.scanStepsRequired + ').');
}

function actionExploit() {
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

  state.timers.exploitReadyAtMs = now + state.rates.exploitCooldownMs;
  applyExploitBatch(1n, false);
  refreshFlags();
}

function applyItemEffects(id) {
  switch (id) {
    case 'python-scanner':
      state.rates.autoScanPerSec += 1n;
      break;

    case 'default-wordlist':
      state.rates.exploitCooldownMs = Math.max(250, Math.floor(state.rates.exploitCooldownMs * 0.75));
      state.rates.exploitSuccessBps = Math.min(9500, state.rates.exploitSuccessBps + 900);
      break;

    case 'rapid-loader':
      state.progression.scanStepsRequired = Math.max(2, state.progression.scanStepsRequired - 2);
      state.rates.exploitCooldownMs = Math.max(200, Math.floor(state.rates.exploitCooldownMs * 0.8));
      state.rates.exploitSuccessBps = Math.min(9700, state.rates.exploitSuccessBps + 500);
      break;

    case 'async-daemon':
      state.rates.autoExploitPerSec += 1n;
      break;

    case 'worm-fabric':
      state.rates.autoScanPerSec += 4n;
      state.rates.autoExploitPerSec += 2n;
      break;

    case 'stealth-c2':
      state.rates.exploitSuccessBps = Math.min(9700, state.rates.exploitSuccessBps + 700);
      state.rates.monetizeBotsPerSec += 2n;
      state.flags.marketUnlocked = true;
      break;

    case 'ai-orchestrator':
      state.rates.autoScanPerSec += 25n;
      state.rates.autoExploitPerSec += 6n;
      state.rates.exploitSuccessBps = Math.min(9900, state.rates.exploitSuccessBps + 600);
      break;

    case 'infect-boost-1':
      state.rates.exploitSuccessBps = Math.min(9900, state.rates.exploitSuccessBps + 350);
      break;

    case 'infect-boost-2':
      state.rates.exploitSuccessBps = Math.min(9900, state.rates.exploitSuccessBps + 350);
      break;

    case 'infect-boost-3':
      state.rates.exploitSuccessBps = Math.min(9900, state.rates.exploitSuccessBps + 400);
      break;

    case 'scan-cluster-1':
      state.rates.autoScanPerSec += 12n;
      break;

    case 'scan-cluster-2':
      state.rates.autoScanPerSec += 18n;
      break;

    case 'exploit-swarm-1':
      state.rates.autoExploitPerSec += 4n;
      break;

    case 'exploit-swarm-2':
      state.rates.autoExploitPerSec += 7n;
      break;

    case 'dark-auction':
      state.rates.moneyMultiplierBps += 2500n;
      state.rates.monetizeBotsPerSec += 2n;
      break;

    case 'quantum-broker':
      state.rates.moneyMultiplierBps += 10000n;
      state.rates.monetizeBotsPerSec += 6n;
      break;

    case 'market-futures-1':
      state.rates.moneyMultiplierBps += 4000n;
      state.rates.monetizeBotsPerSec += 4n;
      break;

    case 'market-futures-2':
      state.rates.moneyMultiplierBps += 7000n;
      state.rates.monetizeBotsPerSec += 8n;
      break;

    case 'zero-day-toolkit':
      state.resources.bots += 5000n;
      state.stats.totalBotsEver += 5000n;
      logEvent('Zero-Day toolkit deployed: +5000 bots instantly infected.');
      break;

    case 'venture-desk':
      state.rates.investBatchMoney += 250n;
      state.rates.investStableBps += 15n;
      break;

    case 'risk-hedger':
      state.rates.investStableBps += 20n;
      state.rates.investAggressiveBaseBps += 35n;
      state.rates.investAggressiveSwingBps = state.rates.investAggressiveSwingBps > 30n
        ? state.rates.investAggressiveSwingBps - 25n
        : 5n;
      break;

    case 'quant-fund':
      state.rates.investBatchMoney += 700n;
      state.rates.investStableBps += 45n;
      state.rates.investAggressiveBaseBps += 20n;
      break;

    case 'ai-trader':
      state.rates.investBatchMoney += 1800n;
      state.rates.investStableBps += 80n;
      state.rates.investAggressiveBaseBps += 50n;
      state.rates.investAggressiveSwingBps = state.rates.investAggressiveSwingBps > 40n
        ? state.rates.investAggressiveSwingBps - 35n
        : 5n;
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

  if (isItemPurchased(def.id)) {
    logEvent('Item already acquired.');
    return;
  }

  if (!isItemVisible(def)) {
    logEvent('Prerequisites not met for ' + def.id + '.');
    return;
  }

  if (!canBuyItem(def)) {
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

function buildItemsSnapshot() {
  var out = [];

  for (var i = 0; i < ITEM_DEFS.length; i++) {
    var def = ITEM_DEFS[i];
    out.push({
      id: def.id,
      group: def.group,
      visible: isItemVisible(def),
      purchased: isItemPurchased(def.id),
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
      portfolio: state.resources.portfolio.toString()
    },
    progression: {
      scanSteps: state.progression.scanSteps,
      scanStepsRequired: state.progression.scanStepsRequired
    },
    flags: {
      marketUnlocked: state.flags.marketUnlocked,
      investUnlocked: state.flags.investUnlocked
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
      investAggressiveSwingBps: state.rates.investAggressiveSwingBps.toString()
    },
    systems: {
      monetizeActive: state.systems.monetizeActive,
      investMode: state.systems.investMode
    },
    stats: {
      totalScans: state.stats.totalScans.toString(),
      exploitAttempts: state.stats.exploitAttempts.toString(),
      exploitSuccess: state.stats.exploitSuccess.toString(),
      totalBotsEver: state.stats.totalBotsEver.toString(),
      totalMoneyEarned: state.stats.totalMoneyEarned.toString()
    },
    timers: {
      autoScanCarryMs: state.timers.autoScanCarryMs,
      autoExploitCarryMs: state.timers.autoExploitCarryMs,
      monetizeCarryMs: state.timers.monetizeCarryMs,
      investCarryMs: state.timers.investCarryMs,
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

function loadSaveObject(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid save payload.');
  }

  var source = payload.save && typeof payload.save === 'object' ? payload.save : payload;

  if (source.version === 1) {
    migrateFromV1(source);
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

  state.progression.scanSteps = Math.max(0, Math.floor(parseNumberSafe(source.progression && source.progression.scanSteps, 0)));
  state.progression.scanStepsRequired = clampNumber(
    Math.floor(parseNumberSafe(source.progression && source.progression.scanStepsRequired, 5)),
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

function toSnapshot() {
  var now = nowMs();
  var cooldownRemaining = Math.max(0, state.timers.exploitReadyAtMs - now);
  var phaseInfo = getPhaseInfo(state.resources.bots);

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
      portfolio: state.resources.portfolio.toString()
    },
    progression: {
      scanSteps: state.progression.scanSteps,
      scanProgressPct: Math.floor((state.progression.scanSteps / state.progression.scanStepsRequired) * 100),
      exploitCooldownMs: cooldownRemaining
    },
    unlocks: {
      market: state.flags.marketUnlocked,
      invest: state.flags.investUnlocked
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
      investAggressiveSwingBps: state.rates.investAggressiveSwingBps.toString()
    },
    systems: {
      monetizeActive: state.systems.monetizeActive,
      investMode: state.systems.investMode
    },
    items: buildItemsSnapshot(),
    stats: {
      totalScans: state.stats.totalScans.toString(),
      exploitAttempts: state.stats.exploitAttempts.toString(),
      exploitSuccess: state.stats.exploitSuccess.toString(),
      totalBotsEver: state.stats.totalBotsEver.toString(),
      totalMoneyEarned: state.stats.totalMoneyEarned.toString()
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
