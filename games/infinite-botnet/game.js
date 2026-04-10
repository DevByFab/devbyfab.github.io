/* ==================================================
   Infinite BotNet UI Controller
   Data-driven prerequisite rendering + save tools
   ================================================== */

(function () {
  'use strict';

  var STORAGE_KEY = 'infiniteBotnet.save.v2';
  var LEGACY_STORAGE_KEY = 'infiniteBotnet.save.v1';
  var AUTOSAVE_MS = 10000;

  var worker = null;
  var autosaveTimer = null;

  var els = {
    workerStatus: document.getElementById('worker-status'),
    phaseLabel: document.getElementById('phase-label'),
    phaseNextGoal: document.getElementById('phase-next-goal'),
    readyLabelTemplate: document.getElementById('ready-label-template'),

    settingsMenu: document.getElementById('settings-menu'),
    settingsPanel: document.getElementById('settings-panel'),
    btnSettings: document.getElementById('btn-settings'),

    botsValue: document.getElementById('bots-value'),
    targetsValue: document.getElementById('targets-value'),
    moneyValue: document.getElementById('money-value'),
    portfolioResourceValue: document.getElementById('portfolio-resource-value'),

    scanProgressFill: document.getElementById('scan-progress-fill'),
    scanProgressLabel: document.getElementById('scan-progress-label'),
    exploitProgressFill: document.getElementById('exploit-progress-fill'),
    exploitProgressLabel: document.getElementById('exploit-progress-label'),

    feed: document.getElementById('terminal-feed'),

    btnScan: document.getElementById('btn-scan'),
    btnExploit: document.getElementById('btn-exploit'),
    btnToggleMonetize: document.getElementById('btn-toggle-monetize'),

    upgradesPanel: document.getElementById('upgrades-panel'),
    marketSlot: document.getElementById('market-slot'),
    marketPanel: document.getElementById('market-panel'),
    marketStateLabel: document.getElementById('market-state-label'),
    investSlot: document.getElementById('invest-slot'),
    investPanel: document.getElementById('invest-panel'),
    portfolioValue: document.getElementById('portfolio-value'),
    investBatchValue: document.getElementById('invest-batch-value'),
    investModeLabel: document.getElementById('invest-mode-label'),
    btnInvestPulse: document.getElementById('btn-invest-pulse'),
    btnCashoutPortfolio: document.getElementById('btn-cashout-portfolio'),
    btnToggleInvestMode: document.getElementById('btn-toggle-invest-mode'),

    transfer: document.getElementById('save-transfer'),
    btnExportSave: document.getElementById('btn-export-save'),
    btnImportSave: document.getElementById('btn-import-save'),
    btnResetGame: document.getElementById('btn-reset-game')
  };

  var itemRows = Array.prototype.slice.call(document.querySelectorAll('[data-item-id]'));
  var itemButtons = Array.prototype.slice.call(document.querySelectorAll('[data-buy-item]'));
  var itemEntries = [];

  itemRows.forEach(function (row) {
    itemEntries.push({
      id: row.getAttribute('data-item-id'),
      row: row,
      costEl: row.querySelector('[data-item-cost]'),
      buyButton: row.querySelector('[data-buy-item]')
    });
  });

  var revealedRows = {};
  var marketWasUnlocked = false;
  var investWasUnlocked = false;

  function bigIntFrom(raw) {
    try {
      return BigInt(raw || '0');
    } catch (_) {
      return 0n;
    }
  }

  function formatBig(raw) {
    var value = bigIntFrom(raw);
    var negative = value < 0n;
    if (negative) value = -value;

    var s = value.toString();
    var group = Math.floor((s.length - 1) / 3);
    var suffix = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'De'];
    var out = s;

    if (group > 0 && group < suffix.length) {
      var pivot = s.length - group * 3;
      var head = s.slice(0, pivot);
      var decimal = s.slice(pivot, pivot + 2).replace(/0+$/, '');
      out = head + (decimal ? '.' + decimal : '') + suffix[group];
    } else if (group >= suffix.length) {
      var m = s.slice(0, 3).replace(/0+$/, '');
      var mantissa = m.length > 1 ? m[0] + '.' + m.slice(1) : m;
      out = mantissa + 'e' + (s.length - 1);
    }

    return negative ? '-' + out : out;
  }

  function post(type, payload) {
    if (!worker) return;
    worker.postMessage({ type: type, payload: payload || null });
  }

  function addFeedLine(message, level) {
    if (!els.feed) return;

    var li = document.createElement('li');
    if (level) li.classList.add(level);

    var timestamp = document.createElement('time');
    var now = new Date();
    var hh = String(now.getHours()).padStart(2, '0');
    var mm = String(now.getMinutes()).padStart(2, '0');
    var ss = String(now.getSeconds()).padStart(2, '0');
    timestamp.textContent = '[' + hh + ':' + mm + ':' + ss + ']';

    li.appendChild(timestamp);
    li.appendChild(document.createTextNode(' ' + message));

    els.feed.prepend(li);
    while (els.feed.children.length > 100) {
      els.feed.removeChild(els.feed.lastChild);
    }
  }

  function setWorkerStatus(kind) {
    if (!els.workerStatus) return;

    els.workerStatus.classList.remove('is-online', 'is-error');
    if (kind === 'online') {
      els.workerStatus.classList.add('is-online');
      return;
    }
    if (kind === 'error') {
      els.workerStatus.classList.add('is-error');
    }
  }

  function setSettingsOpen(open) {
    if (!els.settingsMenu || !els.settingsPanel || !els.btnSettings) return;

    els.settingsMenu.classList.toggle('is-open', open);
    els.settingsPanel.hidden = !open;
    els.btnSettings.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  function initSettingsMenu() {
    if (!els.settingsMenu || !els.settingsPanel || !els.btnSettings) return;

    setSettingsOpen(false);

    els.btnSettings.addEventListener('click', function (event) {
      event.stopPropagation();
      var currentlyOpen = els.settingsMenu.classList.contains('is-open');
      setSettingsOpen(!currentlyOpen);
    });

    document.addEventListener('click', function (event) {
      if (!els.settingsMenu.classList.contains('is-open')) return;
      if (!els.settingsMenu.contains(event.target)) {
        setSettingsOpen(false);
      }
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        setSettingsOpen(false);
      }
    });
  }

  function revealRowOnce(row, id) {
    if (revealedRows[id]) return;
    revealedRows[id] = true;

    row.classList.add('is-revealed');
    window.setTimeout(function () {
      row.classList.remove('is-revealed');
    }, 340);
  }

  function setMarketFeatureVisible(unlocked) {
    if (els.marketPanel) {
      els.marketPanel.hidden = !unlocked;
    }

    if (els.marketSlot) {
      els.marketSlot.hidden = !unlocked;
      els.marketSlot.classList.toggle('is-active', unlocked);
      els.marketSlot.setAttribute('aria-hidden', unlocked ? 'false' : 'true');
    }

    if (unlocked && !marketWasUnlocked) {
      addFeedLine('Market feature unlocked. New monetization tools are now visible.');
    }

    marketWasUnlocked = unlocked;
  }

  function setInvestFeatureVisible(unlocked) {
    if (els.investPanel) {
      els.investPanel.hidden = !unlocked;
    }

    if (els.investSlot) {
      els.investSlot.hidden = !unlocked;
      els.investSlot.classList.toggle('is-active', unlocked);
      els.investSlot.setAttribute('aria-hidden', unlocked ? 'false' : 'true');
    }

    if (unlocked && !investWasUnlocked) {
      addFeedLine('Investment lab unlocked. Portfolio strategies are now available.');
    }

    investWasUnlocked = unlocked;
  }

  function renderCatalog(state) {
    var items = Array.isArray(state.items) ? state.items : [];
    var itemMap = {};
    var i;

    for (i = 0; i < items.length; i++) {
      itemMap[items[i].id] = items[i];
    }

    var upgradesVisibleCount = 0;
    var investVisibleCount = 0;

    for (i = 0; i < itemEntries.length; i++) {
      var entry = itemEntries[i];
      var row = entry.row;
      var id = entry.id;
      var item = itemMap[id];

      if (!item || !item.visible) {
        row.hidden = true;
        continue;
      }

      row.hidden = false;
      revealRowOnce(row, id);

      if (item.group === 'upgrade') {
        upgradesVisibleCount += 1;
      } else if (item.group === 'invest') {
        investVisibleCount += 1;
      }

      var costEl = entry.costEl;
      if (costEl) {
        costEl.textContent = formatBig(item.cost);
      }

      var buyButton = entry.buyButton;
      if (buyButton) {
        buyButton.disabled = !item.canBuy;
      }
    }

    if (els.upgradesPanel) {
      els.upgradesPanel.hidden = upgradesVisibleCount === 0;
      els.upgradesPanel.classList.toggle('is-empty', upgradesVisibleCount === 0);
    }

    if (els.investPanel) {
      els.investPanel.classList.toggle('is-empty', investVisibleCount === 0);
    }
  }

  function renderState(state) {
    if (!state) return;

    var bots = bigIntFrom(state.resources && state.resources.bots);
    var ips = bigIntFrom(state.resources && state.resources.pendingIps);
    var money = bigIntFrom(state.resources && state.resources.darkMoney);
    var portfolio = bigIntFrom(state.resources && state.resources.portfolio);

    els.botsValue.textContent = formatBig(bots);
    els.targetsValue.textContent = formatBig(ips);
    els.moneyValue.textContent = formatBig(money);
    if (els.portfolioResourceValue) {
      els.portfolioResourceValue.textContent = formatBig(portfolio);
    }

    if (els.phaseLabel) {
      els.phaseLabel.textContent = state.phaseTitle || 'Garage';
    }

    if (els.phaseNextGoal) {
      if (state.nextPhaseAtBots) {
        els.phaseNextGoal.textContent = formatBig(state.nextPhaseAtBots) + ' bots';
      } else {
        els.phaseNextGoal.textContent = '∞';
      }
    }

    var scanPct = Math.max(0, Math.min(100, Number(state.progression && state.progression.scanProgressPct || 0)));
    var scanValue = String(scanPct) + '%';
    els.scanProgressFill.style.width = scanValue;
    els.scanProgressLabel.textContent = scanValue;

    var cooldownMs = Math.max(0, Number(state.progression && state.progression.exploitCooldownMs || 0));
    var cooldownTotal = Math.max(1, Number(state.rates && state.rates.exploitCooldownMs || 1000));
    var readyPct = Math.max(0, Math.min(100, ((cooldownTotal - cooldownMs) / cooldownTotal) * 100));
    els.exploitProgressFill.style.width = String(readyPct.toFixed(0)) + '%';

    if (cooldownMs <= 0) {
      els.exploitProgressLabel.textContent = (els.readyLabelTemplate && els.readyLabelTemplate.textContent) || 'READY';
    } else {
      els.exploitProgressLabel.textContent = String(cooldownMs) + ' ms';
    }

    var marketUnlocked = Boolean(state.unlocks && state.unlocks.market);
    setMarketFeatureVisible(marketUnlocked);

    var investUnlocked = Boolean(state.unlocks && state.unlocks.invest);
    setInvestFeatureVisible(investUnlocked);

    els.btnExploit.disabled = ips <= 0n || cooldownMs > 0;
    if (els.btnToggleMonetize) {
      els.btnToggleMonetize.disabled = !marketUnlocked;
      var monetizeActive = Boolean(state.systems && state.systems.monetizeActive);
      els.btnToggleMonetize.classList.toggle('is-active', monetizeActive);
      if (els.marketStateLabel) {
        els.marketStateLabel.classList.toggle('is-active', monetizeActive);
      }
    }

    if (els.portfolioValue) {
      els.portfolioValue.textContent = formatBig(portfolio);
    }

    if (els.investBatchValue) {
      els.investBatchValue.textContent = formatBig(state.rates && state.rates.investBatchMoney || '0');
    }

    if (els.btnInvestPulse) {
      var batchCost = bigIntFrom(state.rates && state.rates.investBatchMoney);
      els.btnInvestPulse.disabled = !investUnlocked || money < batchCost;
    }

    if (els.btnCashoutPortfolio) {
      els.btnCashoutPortfolio.disabled = !investUnlocked || portfolio <= 0n;
    }

    if (els.btnToggleInvestMode) {
      var aggressiveMode = Boolean(state.systems && state.systems.investMode === 'aggressive');
      els.btnToggleInvestMode.disabled = !investUnlocked;
      els.btnToggleInvestMode.classList.toggle('is-aggressive', aggressiveMode);
      if (els.investModeLabel) {
        els.investModeLabel.classList.toggle('is-aggressive', aggressiveMode);
      }
    }

    renderCatalog(state);
  }

  function utf8ToBase64(text) {
    var bytes = new TextEncoder().encode(text);
    var binary = '';
    var chunkSize = 0x8000;
    for (var i = 0; i < bytes.length; i += chunkSize) {
      var chunk = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode.apply(null, chunk);
    }
    return btoa(binary);
  }

  function base64ToUtf8(base64) {
    var binary = atob(base64);
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  }

  function saveToLocal(exportPayload) {
    var wrapped = {
      version: 2,
      savedAt: Date.now(),
      save: exportPayload
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(wrapped));
  }

  function loadFromLocal() {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    }
    if (!raw) return;

    try {
      var parsed = JSON.parse(raw);
      post('LOAD_SAVE', parsed);
      addFeedLine('Local autosave detected. Loading state.');
    } catch (_) {
      addFeedLine('Local autosave is corrupted. Starting fresh session.', 'warn');
    }
  }

  function startAutosave() {
    if (autosaveTimer) clearInterval(autosaveTimer);
    autosaveTimer = setInterval(function () {
      post('REQUEST_EXPORT', { mode: 'autosave' });
    }, AUTOSAVE_MS);
  }

  function requestManualExport() {
    post('REQUEST_EXPORT', { mode: 'manual' });
  }

  function importFromTextarea() {
    var text = (els.transfer.value || '').trim();
    if (!text) {
      addFeedLine('Import failed: empty Base64 payload.', 'warn');
      return;
    }

    try {
      var json = base64ToUtf8(text);
      var save = JSON.parse(json);
      post('LOAD_SAVE', save);
      addFeedLine('Import payload accepted. Applying state.');
    } catch (_) {
      addFeedLine('Import failed: invalid Base64 or malformed JSON.', 'error');
    }
  }

  function bindEvents() {
    if (els.btnScan) {
      els.btnScan.addEventListener('click', function () {
        post('ACTION_SCAN');
      });
    }

    if (els.btnExploit) {
      els.btnExploit.addEventListener('click', function () {
        post('ACTION_EXPLOIT');
      });
    }

    if (els.btnToggleMonetize) {
      els.btnToggleMonetize.addEventListener('click', function () {
        post('TOGGLE_MONETIZE');
      });
    }

    if (els.btnInvestPulse) {
      els.btnInvestPulse.addEventListener('click', function () {
        post('ACTION_INVEST');
      });
    }

    if (els.btnCashoutPortfolio) {
      els.btnCashoutPortfolio.addEventListener('click', function () {
        post('ACTION_CASHOUT');
      });
    }

    if (els.btnToggleInvestMode) {
      els.btnToggleInvestMode.addEventListener('click', function () {
        post('TOGGLE_INVEST_MODE');
      });
    }

    itemButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        var id = button.getAttribute('data-buy-item');
        if (!id) return;
        post('BUY_UPGRADE', { id: id });
      });
    });

    if (els.btnExportSave) {
      els.btnExportSave.addEventListener('click', requestManualExport);
    }

    if (els.btnImportSave) {
      els.btnImportSave.addEventListener('click', importFromTextarea);
    }

    if (els.btnResetGame) {
      els.btnResetGame.addEventListener('click', function () {
        post('RESET_GAME');
      });
    }

    window.addEventListener('beforeunload', function () {
      post('REQUEST_EXPORT', { mode: 'autosave' });
    });
  }

  function handleWorkerMessage(event) {
    var data = event.data || {};

    if (data.type === 'STATE') {
      setWorkerStatus('online');
      renderState(data.state);

      if (data.state && Array.isArray(data.state.events)) {
        data.state.events.forEach(function (line) {
          addFeedLine(line);
        });
      }
      return;
    }

    if (data.type === 'EXPORT_READY') {
      if (!data.save) return;

      if (data.mode === 'autosave') {
        saveToLocal(data.save);
        return;
      }

      try {
        var encoded = utf8ToBase64(JSON.stringify(data.save));
        if (els.transfer) {
          els.transfer.value = encoded;
        }
        addFeedLine('Export generated in Base64 format.');
      } catch (_) {
        addFeedLine('Export failed: unable to encode save payload.', 'error');
      }
      return;
    }

    if (data.type === 'ERROR') {
      setWorkerStatus('error');
      addFeedLine('Worker error: ' + (data.message || 'unknown'), 'error');
    }
  }

  function initWorker() {
    try {
      worker = new Worker('game.worker.js');
      worker.addEventListener('message', handleWorkerMessage);
      worker.addEventListener('error', function () {
        setWorkerStatus('error');
        addFeedLine('Worker runtime exception detected.', 'error');
      });
      post('INIT');
      setWorkerStatus('boot');
    } catch (_) {
      setWorkerStatus('error');
      addFeedLine('Worker initialization failed. Browser compatibility issue.', 'error');
    }
  }

  function init() {
    initSettingsMenu();
    bindEvents();
    initWorker();
    loadFromLocal();
    startAutosave();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
