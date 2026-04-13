/* ==================================================
   Infinite BotNet UI Controller
   Data-driven rendering, save tools and endgame signals
   ================================================== */

(function () {
  'use strict';

  var STORAGE_KEY = 'infiniteBotnet.save.v3';
  var LEGACY_STORAGE_KEYS = ['infiniteBotnet.save.v2', 'infiniteBotnet.save.v1'];
  var PORTFOLIO_SIGNAL_KEY = 'infiniteBotnet.portfolioSignal.v1';
  var AUDIO_STORAGE_KEY = 'infiniteBotnet.audio.v1';
  var PANEL_LAYOUT_STORAGE_KEY = 'infiniteBotnet.panelLayout.v1';
  var VIEW_STORAGE_KEY = 'infiniteBotnet.view.v1';
  var TUTORIAL_STORAGE_KEY = 'infiniteBotnet.tutorialSeen.v1';
  var AUTOSAVE_MS = 10000;
  var VIEW_ORDER = ['core', 'economy', 'war', 'matrix', 'messages', 'endings', 'stats'];

  var AUDIO_FILES = {
    ambience: 'audio/server-drone.mp3',
    click: 'audio/ui-click.mp3',
    error: 'audio/error-message.mp3',
    upgrade: 'audio/achievement-unlocked.mp3',
    phase: 'audio/level-up.mp3',
    message: 'audio/universfield-message-incoming.mp3'
  };

  var AUDIO_DEFAULTS = {
    master: 0.8,
    ambience: 0.35,
    click: 0.55,
    error: 0.65,
    upgrade: 0.7,
    phase: 0.78,
    message: 0.72
  };

  var AUDIO_ONE_SHOT_KEYS = ['click', 'error', 'upgrade', 'phase', 'message'];
  var AUDIO_ONE_SHOT_POOL_SIZE = 4;
  var AUDIO_START_OFFSETS = {
    click: 0.018,
    error: 0.022,
    upgrade: 0.028,
    phase: 0.024,
    message: 0.03
  };

  var worker = null;
  var autosaveTimer = null;
  var lastPortfolioSignalHash = '';
  var lastPhaseId = '';
  var lastMailUnread = 0;
  var lastMailPending = false;
  var currentView = 'core';

  var audioState = {
    unlocked: false,
    prefs: null,
    ambienceTrack: null,
    oneShotPools: {}
  };

  var panelLayoutState = {
    sizes: {},
    observer: null,
    saveTimer: null
  };

  var telemetryState = {
    points: [],
    lastPointAt: 0,
    sampleAt: 0,
    sampleHz: 0n,
    sampleBrain: 0n,
    sampleComputronium: 0n,
    brainRate: '0',
    computroniumRate: '0'
  };

  var els = {
    body: document.body,
    workerStatus: document.getElementById('worker-status'),
    phaseLabel: document.getElementById('phase-label'),
    phaseNextGoal: document.getElementById('phase-next-goal'),
    readyLabelTemplate: document.getElementById('ready-label-template'),
    offlineLabelTemplate: document.getElementById('offline-label-template'),
    mailQueueFullTemplate: document.getElementById('mail-queue-full-template'),
    featureLockedTemplate: document.getElementById('feature-locked-template'),

    endingLabelNone: document.getElementById('ending-label-none'),
    endingLabelGhost: document.getElementById('ending-label-ghost'),
    endingLabelOvermind: document.getElementById('ending-label-overmind'),
    endingLabelArchivist: document.getElementById('ending-label-archivist'),

    settingsMenu: document.getElementById('settings-menu'),
    settingsPanel: document.getElementById('settings-panel'),
    btnSettings: document.getElementById('btn-settings'),
    btnOpenTutorial: document.getElementById('btn-open-tutorial'),
    btnReplayTutorial: document.getElementById('btn-replay-tutorial'),
    turboModeSelect: document.getElementById('turbo-mode-select'),
    turboCurrentValue: document.getElementById('turbo-current-value'),

    botsValue: document.getElementById('bots-value'),
    targetsValue: document.getElementById('targets-value'),
    moneyValue: document.getElementById('money-value'),
    portfolioResourceValue: document.getElementById('portfolio-resource-value'),
    warIntelResourceValue: document.getElementById('war-intel-resource-value'),
    resourceHzCard: document.getElementById('resource-hz-card'),
    resourceBrainCard: document.getElementById('resource-brain-card'),
    resourceComputroniumCard: document.getElementById('resource-computronium-card'),
    hzValue: document.getElementById('hz-value'),
    brainValue: document.getElementById('brain-value'),
    computroniumValue: document.getElementById('computronium-value'),

    scanProgressFill: document.getElementById('scan-progress-fill'),
    scanProgressLabel: document.getElementById('scan-progress-label'),
    exploitProgressFill: document.getElementById('exploit-progress-fill'),
    exploitProgressLabel: document.getElementById('exploit-progress-label'),
    growthCanvas: document.getElementById('growth-canvas'),
    hzRateValue: document.getElementById('hz-rate-value'),
    brainRateValue: document.getElementById('brain-rate-value'),
    computroniumRateValue: document.getElementById('computronium-rate-value'),
    matrixStabilityInlineValue: document.getElementById('matrix-stability-inline-value'),

    feed: document.getElementById('terminal-feed'),

    btnScan: document.getElementById('btn-scan'),
    btnExploit: document.getElementById('btn-exploit'),
    btnToggleMonetize: document.getElementById('btn-toggle-monetize'),

    upgradesPanel: document.getElementById('upgrades-panel'),

    marketSlot: document.getElementById('market-slot'),
    marketPanel: document.getElementById('market-panel'),
    marketStateLabel: document.getElementById('market-state-label'),
    marketBurnRateValue: document.getElementById('market-burn-rate-value'),
    marketCashRateValue: document.getElementById('market-cash-rate-value'),

    investSlot: document.getElementById('invest-slot'),
    investPanel: document.getElementById('invest-panel'),
    portfolioValue: document.getElementById('portfolio-value'),
    investBatchValue: document.getElementById('invest-batch-value'),
    investModeLabel: document.getElementById('invest-mode-label'),
    investStableRateValue: document.getElementById('invest-stable-rate-value'),
    investAggressiveRangeValue: document.getElementById('invest-aggressive-range-value'),
    btnInvestPulse: document.getElementById('btn-invest-pulse'),
    btnCashoutPortfolio: document.getElementById('btn-cashout-portfolio'),
    btnToggleInvestMode: document.getElementById('btn-toggle-invest-mode'),

    warSlot: document.getElementById('war-slot'),
    warPanel: document.getElementById('war-panel'),
    heatValue: document.getElementById('heat-value'),
    heatProgressFill: document.getElementById('heat-progress-fill'),
    warIntelValue: document.getElementById('war-intel-value'),
    warWinsValue: document.getElementById('war-wins-value'),
    warLossesValue: document.getElementById('war-losses-value'),
    warCooldownValue: document.getElementById('war-cooldown-value'),
    warFortifyCooldownValue: document.getElementById('war-fortify-cooldown-value'),
    warDefenseValue: document.getElementById('war-defense-value'),
    warAttackCostValue: document.getElementById('war-attack-cost-value'),
    warScrubCostValue: document.getElementById('war-scrub-cost-value'),
    warFortifyCostMoneyValue: document.getElementById('war-fortify-cost-money-value'),
    warFortifyCostIntelValue: document.getElementById('war-fortify-cost-intel-value'),
    btnWarAttack: document.getElementById('btn-war-attack'),
    btnWarFortify: document.getElementById('btn-war-fortify'),
    btnWarScrub: document.getElementById('btn-war-scrub'),

    matrixSlot: document.getElementById('matrix-slot'),
    matrixPanel: document.getElementById('matrix-panel'),
    matrixProgressValue: document.getElementById('matrix-progress-value'),
    matrixStabilityValue: document.getElementById('matrix-stability-value'),
    matrixBypassValue: document.getElementById('matrix-bypass-value'),
    matrixProgressFill: document.getElementById('matrix-progress-fill'),
    matrixCommandInput: document.getElementById('matrix-command-input'),
    matrixCommandHint: document.getElementById('matrix-command-hint'),
    matrixArmCostValue: document.getElementById('matrix-arm-cost-value'),
    matrixInjectCostValue: document.getElementById('matrix-inject-cost-value'),
    matrixStabilizeCostValue: document.getElementById('matrix-stabilize-cost-value'),
    btnMatrixArm: document.getElementById('btn-matrix-arm'),
    btnMatrixInject: document.getElementById('btn-matrix-inject'),
    btnMatrixStabilize: document.getElementById('btn-matrix-stabilize'),

    endingSlot: document.getElementById('ending-slot'),
    endingPanel: document.getElementById('ending-panel'),
    endingSelectedValue: document.getElementById('ending-selected-value'),
    endingTriadHint: document.getElementById('ending-triad-hint'),
    btnEndingGhost: document.getElementById('btn-ending-ghost'),
    btnEndingOvermind: document.getElementById('btn-ending-overmind'),
    btnEndingArchivist: document.getElementById('btn-ending-archivist'),

    transfer: document.getElementById('save-transfer'),
    btnExportSave: document.getElementById('btn-export-save'),
    btnImportSave: document.getElementById('btn-import-save'),
    btnResetGame: document.getElementById('btn-reset-game'),

    audioMaster: document.getElementById('audio-master'),
    audioAmbience: document.getElementById('audio-ambience'),
    audioClick: document.getElementById('audio-click'),
    audioError: document.getElementById('audio-error'),
    audioUpgrade: document.getElementById('audio-upgrade'),
    audioPhase: document.getElementById('audio-phase'),
    audioMessage: document.getElementById('audio-message'),

    audioMasterValue: document.getElementById('audio-master-value'),
    audioAmbienceValue: document.getElementById('audio-ambience-value'),
    audioClickValue: document.getElementById('audio-click-value'),
    audioErrorValue: document.getElementById('audio-error-value'),
    audioUpgradeValue: document.getElementById('audio-upgrade-value'),
    audioPhaseValue: document.getElementById('audio-phase-value'),
    audioMessageValue: document.getElementById('audio-message-value'),
    viewNavButtons: Array.prototype.slice.call(document.querySelectorAll('[data-view-nav]')),
    viewSections: Array.prototype.slice.call(document.querySelectorAll('[data-view-section]')),
    resizablePanels: Array.prototype.slice.call(document.querySelectorAll('[data-resizable-panel]')),

    mailSlot: document.getElementById('mail-slot'),
    mailPanel: document.getElementById('mail-panel'),
    mailUnreadValue: document.getElementById('mail-unread-value'),
    mailProcessedValue: document.getElementById('mail-processed-value'),
    mailNextValue: document.getElementById('mail-next-value'),
    mailPreview: document.getElementById('mail-preview'),
    mailSubject: document.getElementById('mail-subject'),
    mailBody: document.getElementById('mail-body'),
    mailRewardValue: document.getElementById('mail-reward-value'),
    mailQuarantineCostValue: document.getElementById('mail-quarantine-cost-value'),
    mailQueue: document.getElementById('mail-queue'),
    btnClaimMail: document.getElementById('btn-claim-mail'),
    btnQuarantineMail: document.getElementById('btn-quarantine-mail'),

    tutorialOverlay: document.getElementById('tutorial-overlay'),
    tutorialTitle: document.getElementById('tutorial-title'),
    tutorialBody: document.getElementById('tutorial-body'),
    tutorialFocus: document.getElementById('tutorial-focus'),
    tutorialAction: document.getElementById('tutorial-action'),
    tutorialChecklist: document.getElementById('tutorial-checklist'),
    tutorialProgress: document.getElementById('tutorial-progress'),
    btnTutorialPrev: document.getElementById('btn-tutorial-prev'),
    btnTutorialSkip: document.getElementById('btn-tutorial-skip'),
    btnTutorialNext: document.getElementById('btn-tutorial-next')
  };

  var itemRows = Array.prototype.slice.call(document.querySelectorAll('[data-item-id]'));
  var itemButtons = Array.prototype.slice.call(document.querySelectorAll('[data-buy-item]'));
  var itemEntries = [];
  var mailEmptySubjectText = els.mailSubject ? (els.mailSubject.textContent || 'No pending message') : 'No pending message';
  var mailEmptyBodyText = els.mailBody ? (els.mailBody.textContent || 'No pending message') : 'No pending message';

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
  var mailWasUnlocked = false;
  var warWasUnlocked = false;
  var matrixWasUnlocked = false;
  var endingWasUnlocked = false;
  var tutorialSteps = Array.isArray(window.BotnetTutorialSteps) && window.BotnetTutorialSteps.length
    ? window.BotnetTutorialSteps.slice()
    : [];
  var tutorialBridge = null;

  var formattersApi = window.BotnetFormatters || {};
  var mailUiApi = window.BotnetMailUI || {};

  function pickModuleFn(candidate, fallback) {
    return typeof candidate === 'function' ? candidate : fallback;
  }

  var bigIntFrom = pickModuleFn(formattersApi.bigIntFrom, function (raw) {
    try {
      return BigInt(raw || '0');
    } catch (_) {
      return 0n;
    }
  });

  var formatBig = pickModuleFn(formattersApi.formatBig, function (raw) {
    return bigIntFrom(raw).toString();
  });

  var formatPerSecond = pickModuleFn(formattersApi.formatPerSecond, function (raw) {
    return formatBig(raw) + '/s';
  });

  var clampRange = pickModuleFn(formattersApi.clampRange, function (value, minValue, maxValue) {
    if (value < minValue) return minValue;
    if (value > maxValue) return maxValue;
    return value;
  });

  var clamp01 = pickModuleFn(formattersApi.clamp01, function (value) {
    var numeric = Number(value);
    if (!Number.isFinite(numeric)) return 0;
    return clampRange(numeric, 0, 1);
  });

  var isNegativeMailEntry = pickModuleFn(mailUiApi.isNegativeEntry, function () {
    return false;
  });

  var renderMailQueueNative = pickModuleFn(mailUiApi.renderQueue, null);

  function renderMailQueueEntries(entries) {
    if (!els.mailQueue) return;

    if (!renderMailQueueNative) {
      els.mailQueue.hidden = !Array.isArray(entries) || entries.length === 0;
      return;
    }

    renderMailQueueNative(els.mailQueue, entries, 2);
  }

  function toLogMetric(raw) {
    var value = bigIntFrom(raw);
    if (value <= 0n) return 0;

    var text = value.toString();
    var digits = text.length;
    var head = Number(text.slice(0, Math.min(2, digits)));
    if (!Number.isFinite(head)) head = 0;

    if (digits <= 2) {
      return head / 10;
    }

    return (digits - 1) + head / 100;
  }

  function updateDerivedRates(hzValue, brainValue, computroniumValue) {
    var now = Date.now();
    if (telemetryState.sampleAt > 0) {
      var elapsed = now - telemetryState.sampleAt;
      if (elapsed >= 500) {
        var elapsedBig = BigInt(elapsed);

        var brainDelta = brainValue - telemetryState.sampleBrain;
        if (brainDelta < 0n) brainDelta = 0n;
        telemetryState.brainRate = ((brainDelta * 1000n) / elapsedBig).toString();

        var computroniumDelta = computroniumValue - telemetryState.sampleComputronium;
        if (computroniumDelta < 0n) computroniumDelta = 0n;
        telemetryState.computroniumRate = ((computroniumDelta * 1000n) / elapsedBig).toString();

        telemetryState.sampleAt = now;
        telemetryState.sampleHz = hzValue;
        telemetryState.sampleBrain = brainValue;
        telemetryState.sampleComputronium = computroniumValue;
      }
    } else {
      telemetryState.sampleAt = now;
      telemetryState.sampleHz = hzValue;
      telemetryState.sampleBrain = brainValue;
      telemetryState.sampleComputronium = computroniumValue;
    }
  }

  function drawGrowthCanvas() {
    if (!els.growthCanvas) return;

    var canvas = els.growthCanvas;
    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    var cssWidth = canvas.clientWidth || 0;
    var cssHeight = canvas.clientHeight || 0;
    if (cssWidth <= 0 || cssHeight <= 0) return;

    var dpr = window.devicePixelRatio || 1;
    var targetWidth = Math.max(1, Math.floor(cssWidth * dpr));
    var targetHeight = Math.max(1, Math.floor(cssHeight * dpr));

    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssWidth, cssHeight);

    var pad = 14;
    var plotWidth = Math.max(10, cssWidth - pad * 2);
    var plotHeight = Math.max(10, cssHeight - pad * 2);

    ctx.strokeStyle = 'rgba(141, 255, 201, 0.14)';
    ctx.lineWidth = 1;

    var gy;
    for (gy = 0; gy <= 4; gy++) {
      var yy = pad + (plotHeight * gy) / 4;
      ctx.beginPath();
      ctx.moveTo(pad, yy);
      ctx.lineTo(pad + plotWidth, yy);
      ctx.stroke();
    }

    var points = telemetryState.points;
    if (!points.length) return;

    var maxValue = 1;
    var i;
    for (i = 0; i < points.length; i++) {
      if (points[i].bots > maxValue) maxValue = points[i].bots;
      if (points[i].hz > maxValue) maxValue = points[i].hz;
      if (points[i].computronium > maxValue) maxValue = points[i].computronium;
    }

    var series = [
      { key: 'bots', color: '#8dffc9' },
      { key: 'hz', color: '#7ab8ff' },
      { key: 'computronium', color: '#ffbe69' }
    ];

    series.forEach(function (entry) {
      ctx.strokeStyle = entry.color;
      ctx.lineWidth = 1.6;
      ctx.beginPath();

      var count = points.length;
      var idx;
      for (idx = 0; idx < count; idx++) {
        var point = points[idx];
        var x = pad + (plotWidth * idx) / Math.max(1, count - 1);
        var y = pad + plotHeight - (point[entry.key] / maxValue) * plotHeight;

        if (idx === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.stroke();
    });
  }

  function pushGrowthSample(botsValue, hzValue, computroniumValue) {
    var now = Date.now();
    if (now - telemetryState.lastPointAt < 450) return;

    telemetryState.lastPointAt = now;
    telemetryState.points.push({
      bots: toLogMetric(botsValue),
      hz: toLogMetric(hzValue),
      computronium: toLogMetric(computroniumValue)
    });

    if (telemetryState.points.length > 160) {
      telemetryState.points.shift();
    }

    drawGrowthCanvas();
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
    while (els.feed.children.length > 120) {
      els.feed.removeChild(els.feed.lastChild);
    }
  }

  function normalizeTurboMultiplier(raw) {
    var parsed = Math.floor(Number(raw) || 1);
    if (parsed === 10 || parsed === 50 || parsed === 100) return parsed;
    return 1;
  }

  function renderTurboMode(raw) {
    var multiplier = normalizeTurboMultiplier(raw);

    if (els.turboModeSelect && els.turboModeSelect.value !== String(multiplier)) {
      els.turboModeSelect.value = String(multiplier);
    }

    if (els.turboCurrentValue) {
      els.turboCurrentValue.textContent = 'x' + String(multiplier);
    }
  }

  function loadViewPreference() {
    var raw = null;

    try {
      raw = localStorage.getItem(VIEW_STORAGE_KEY);
    } catch (_) {
      raw = null;
    }

    if (!raw) return;
    if (VIEW_ORDER.indexOf(raw) === -1) return;

    currentView = raw;
  }

  function saveViewPreference() {
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, currentView);
    } catch (_) {
      // Ignore quota errors silently.
    }
  }

  function applyActiveView() {
    var sections = els.viewSections || [];
    var buttons = els.viewNavButtons || [];
    var i;

    for (i = 0; i < sections.length; i++) {
      var section = sections[i];
      var viewId = section.getAttribute('data-view-section');
      section.classList.toggle('is-view-hidden', viewId !== currentView);
    }

    for (i = 0; i < buttons.length; i++) {
      var button = buttons[i];
      var isActive = button.getAttribute('data-view-nav') === currentView;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-current', isActive ? 'page' : 'false');
    }
  }

  function setCurrentView(viewId, shouldPersist) {
    if (!viewId || VIEW_ORDER.indexOf(viewId) === -1) return;

    currentView = viewId;
    applyActiveView();

    if (shouldPersist) {
      saveViewPreference();
    }

    snapshotVisiblePanelHeights();
    schedulePanelLayoutSave();
  }

  function refreshViewNavigation(options) {
    (els.viewNavButtons || []).forEach(function (button) {
      var id = button.getAttribute('data-view-nav');
      var unlocked = true;

      if (id === 'economy') unlocked = Boolean(options.economy);
      if (id === 'war') unlocked = Boolean(options.war);
      if (id === 'matrix') unlocked = Boolean(options.matrix);
      if (id === 'messages') unlocked = Boolean(options.messages);
      if (id === 'endings') unlocked = Boolean(options.endings);

      button.hidden = false;
      button.disabled = false;
      button.setAttribute('aria-hidden', 'false');
      button.setAttribute('aria-disabled', unlocked ? 'false' : 'true');
      button.classList.toggle('is-locked', !unlocked);
    });

    applyActiveView();
  }

  function copyAudioPrefs(source) {
    return {
      master: clamp01(source && source.master != null ? source.master : AUDIO_DEFAULTS.master),
      ambience: clamp01(source && source.ambience != null ? source.ambience : AUDIO_DEFAULTS.ambience),
      click: clamp01(source && source.click != null ? source.click : AUDIO_DEFAULTS.click),
      error: clamp01(source && source.error != null ? source.error : AUDIO_DEFAULTS.error),
      upgrade: clamp01(source && source.upgrade != null ? source.upgrade : AUDIO_DEFAULTS.upgrade),
      phase: clamp01(source && source.phase != null ? source.phase : AUDIO_DEFAULTS.phase),
      message: clamp01(source && source.message != null ? source.message : AUDIO_DEFAULTS.message)
    };
  }

  function loadAudioPrefs() {
    var raw = null;

    try {
      raw = localStorage.getItem(AUDIO_STORAGE_KEY);
    } catch (_) {
      raw = null;
    }

    if (!raw) {
      audioState.prefs = copyAudioPrefs(AUDIO_DEFAULTS);
      return;
    }

    try {
      var parsed = JSON.parse(raw);
      audioState.prefs = copyAudioPrefs(parsed);
    } catch (_) {
      audioState.prefs = copyAudioPrefs(AUDIO_DEFAULTS);
    }
  }

  function saveAudioPrefs() {
    if (!audioState.prefs) return;

    try {
      localStorage.setItem(AUDIO_STORAGE_KEY, JSON.stringify(audioState.prefs));
    } catch (_) {
      // Ignore quota errors silently.
    }
  }

  function getAudioVolume(channelKey) {
    if (!audioState.prefs) return 0;

    var master = clamp01(audioState.prefs.master);
    var channel = clamp01(audioState.prefs[channelKey]);

    return clamp01(master * channel);
  }

  function ensureAmbienceTrack() {
    if (audioState.ambienceTrack) return;

    var track = new Audio(AUDIO_FILES.ambience);
    track.loop = true;
    track.preload = 'auto';
    track.volume = 0;
    audioState.ambienceTrack = track;
  }

  function ensureOneShotPool(fileKey) {
    if (!fileKey || fileKey === 'ambience' || !AUDIO_FILES[fileKey]) return [];

    if (!audioState.oneShotPools[fileKey]) {
      var pool = [];
      var i;

      for (i = 0; i < AUDIO_ONE_SHOT_POOL_SIZE; i++) {
        var node = new Audio(AUDIO_FILES[fileKey]);
        node.preload = 'auto';
        try {
          node.load();
        } catch (_) {
          // Ignore load() edge cases on constrained browsers.
        }
        pool.push(node);
      }

      audioState.oneShotPools[fileKey] = pool;
    }

    return audioState.oneShotPools[fileKey];
  }

  function warmOneShotPools() {
    AUDIO_ONE_SHOT_KEYS.forEach(function (key) {
      ensureOneShotPool(key);
    });
  }

  function syncAmbiencePlayback() {
    ensureAmbienceTrack();

    var track = audioState.ambienceTrack;
    if (!track) return;

    var volume = getAudioVolume('ambience');
    track.volume = volume;

    if (!audioState.unlocked || volume <= 0) {
      track.pause();
      return;
    }

    var maybePromise = track.play();
    if (maybePromise && typeof maybePromise.catch === 'function') {
      maybePromise.catch(function () {
        // Ignore autoplay restrictions until next user gesture.
      });
    }
  }

  function unlockAudioPlayback() {
    if (audioState.unlocked) return;
    audioState.unlocked = true;
    warmOneShotPools();
    syncAmbiencePlayback();
  }

  function playOneShot(fileKey, channelKey) {
    if (!audioState.unlocked) return;

    var src = AUDIO_FILES[fileKey];
    if (!src) return;

    var volume = getAudioVolume(channelKey);
    if (volume <= 0) return;

    var pool = ensureOneShotPool(fileKey);
    var fx = null;
    var i;

    for (i = 0; i < pool.length; i++) {
      if (pool[i].paused || pool[i].ended) {
        fx = pool[i];
        break;
      }
    }

    if (!fx && pool.length) {
      fx = pool[0];
      try {
        fx.pause();
      } catch (_) {
        // Ignore race between pause/play calls.
      }
    }

    if (!fx) {
      fx = new Audio(src);
      fx.preload = 'auto';
    }

    var offset = Number(AUDIO_START_OFFSETS[fileKey] || 0);

    try {
      if (fx.readyState >= 1) {
        var maxSeek = Number.isFinite(fx.duration) && fx.duration > 0 ? Math.max(0, fx.duration - 0.03) : offset;
        fx.currentTime = Math.min(offset, maxSeek);
      } else {
        fx.currentTime = 0;
      }
    } catch (_) {
      // Ignore seek errors before metadata is loaded.
    }

    fx.volume = volume;

    var maybePromise = fx.play();
    if (maybePromise && typeof maybePromise.catch === 'function') {
      maybePromise.catch(function () {
        // Ignore playback race/autoplay edge cases.
      });
    }
  }

  function playClickSound() {
    playOneShot('click', 'click');
  }

  function playErrorSound() {
    playOneShot('error', 'error');
  }

  function playUpgradeSound() {
    playOneShot('upgrade', 'upgrade');
  }

  function playPhaseSound() {
    playOneShot('phase', 'phase');
  }

  function playMessageSound() {
    playOneShot('message', 'message');
  }

  function formatAudioPercent(value) {
    return String(Math.round(clamp01(value) * 100)) + '%';
  }

  function bindAudioControls() {
    if (!audioState.prefs) return;

    var controls = [
      { slider: els.audioMaster, output: els.audioMasterValue, key: 'master' },
      { slider: els.audioAmbience, output: els.audioAmbienceValue, key: 'ambience' },
      { slider: els.audioClick, output: els.audioClickValue, key: 'click' },
      { slider: els.audioError, output: els.audioErrorValue, key: 'error' },
      { slider: els.audioUpgrade, output: els.audioUpgradeValue, key: 'upgrade' },
      { slider: els.audioPhase, output: els.audioPhaseValue, key: 'phase' },
      { slider: els.audioMessage, output: els.audioMessageValue, key: 'message' }
    ];

    controls.forEach(function (entry) {
      if (!entry.slider || !entry.output) return;

      var initial = clamp01(audioState.prefs[entry.key]);
      entry.slider.value = String(Math.round(initial * 100));
      entry.output.textContent = formatAudioPercent(initial);

      entry.slider.addEventListener('input', function () {
        var ratio = clamp01(Number(entry.slider.value) / 100);
        audioState.prefs[entry.key] = ratio;
        entry.output.textContent = formatAudioPercent(ratio);
        saveAudioPrefs();
        syncAmbiencePlayback();
      });
    });
  }

  function initAudioSystem() {
    loadAudioPrefs();
    ensureAmbienceTrack();
    warmOneShotPools();
    bindAudioControls();
    syncAmbiencePlayback();

    document.addEventListener('pointerdown', unlockAudioPlayback, { once: true, passive: true });
    document.addEventListener('keydown', unlockAudioPlayback, { once: true });

    document.addEventListener('visibilitychange', function () {
      if (!audioState.ambienceTrack) return;

      if (document.hidden) {
        audioState.ambienceTrack.pause();
      } else {
        syncAmbiencePlayback();
      }
    });
  }

  function normalizePanelHeight(rawHeight) {
    var height = Math.round(Number(rawHeight) || 0);
    return clampRange(height, 150, 1600);
  }

  function schedulePanelLayoutSave() {
    if (panelLayoutState.saveTimer) {
      window.clearTimeout(panelLayoutState.saveTimer);
    }

    panelLayoutState.saveTimer = window.setTimeout(function () {
      panelLayoutState.saveTimer = null;
      savePanelLayoutPrefs();
    }, 120);
  }

  function savePanelLayoutPrefs() {
    try {
      localStorage.setItem(PANEL_LAYOUT_STORAGE_KEY, JSON.stringify(panelLayoutState.sizes));
    } catch (_) {
      // Ignore quota errors silently.
    }
  }

  function loadPanelLayoutPrefs() {
    var raw = null;

    try {
      raw = localStorage.getItem(PANEL_LAYOUT_STORAGE_KEY);
    } catch (_) {
      raw = null;
    }

    if (!raw) {
      panelLayoutState.sizes = {};
      return;
    }

    try {
      var parsed = JSON.parse(raw);
      var out = {};

      if (parsed && typeof parsed === 'object') {
        Object.keys(parsed).forEach(function (key) {
          out[key] = normalizePanelHeight(parsed[key]);
        });
      }

      panelLayoutState.sizes = out;
    } catch (_) {
      panelLayoutState.sizes = {};
    }
  }

  function applyPanelHeight(panel, height) {
    if (!panel) return;
    panel.style.height = String(normalizePanelHeight(height)) + 'px';
  }

  function snapshotVisiblePanelHeights() {
    (els.resizablePanels || []).forEach(function (panel) {
      var key = panel.getAttribute('data-resizable-panel');
      if (!key) return;
      if (panel.hidden || panel.closest('[hidden]') || panel.classList.contains('is-view-hidden') || panel.closest('.is-view-hidden')) return;

      var measured = Math.round(panel.getBoundingClientRect().height);
      if (!Number.isFinite(measured) || measured < 120) return;

      panelLayoutState.sizes[key] = normalizePanelHeight(measured);
    });
  }

  function initPanelLayoutSystem() {
    var panels = els.resizablePanels || [];
    if (!panels.length) return;

    loadPanelLayoutPrefs();

    panels.forEach(function (panel) {
      var key = panel.getAttribute('data-resizable-panel');
      if (!key) return;

      var savedHeight = panelLayoutState.sizes[key];
      if (!savedHeight) return;

      applyPanelHeight(panel, savedHeight);
    });

    if (typeof ResizeObserver === 'function') {
      panelLayoutState.observer = new ResizeObserver(function (entries) {
        entries.forEach(function (entry) {
          var panel = entry.target;
          var key = panel.getAttribute('data-resizable-panel');
          if (!key) return;
          if (panel.hidden || panel.closest('[hidden]') || panel.classList.contains('is-view-hidden') || panel.closest('.is-view-hidden')) return;

          var measured = Math.round(entry.contentRect.height);
          if (!Number.isFinite(measured) || measured < 120) return;

          var normalized = normalizePanelHeight(measured);
          if (panelLayoutState.sizes[key] === normalized) return;

          panelLayoutState.sizes[key] = normalized;
          schedulePanelLayoutSave();
        });
      });

      panels.forEach(function (panel) {
        panelLayoutState.observer.observe(panel);
      });
    } else {
      window.addEventListener('mouseup', function () {
        snapshotVisiblePanelHeights();
        schedulePanelLayoutSave();
      });

      window.addEventListener(
        'touchend',
        function () {
          snapshotVisiblePanelHeights();
          schedulePanelLayoutSave();
        },
        { passive: true }
      );
    }

    window.addEventListener('beforeunload', savePanelLayoutPrefs);
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

  function playEventDerivedAudio(message) {
    if (typeof message !== 'string' || !message) return;

    if (/(fail|not enough|unavailable|error|\blocked\b|corrupted|no queued targets|force-paused|rejected|backlash)/i.test(message)) {
      playErrorSound();
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
      playClickSound();
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
        if (tutorialBridge && typeof tutorialBridge.isOpen === 'function' && tutorialBridge.isOpen()) {
          closeTutorial(true);
        }
        setSettingsOpen(false);
      }
    });
  }

  function resetTutorialProgress() {
    if (!tutorialBridge || typeof tutorialBridge.reset !== 'function') return;
    tutorialBridge.reset();
  }

  function openTutorial(fromStart) {
    if (!tutorialBridge || typeof tutorialBridge.open !== 'function') return;
    tutorialBridge.open(Boolean(fromStart));
  }

  function closeTutorial(markSeen) {
    if (!tutorialBridge || typeof tutorialBridge.close !== 'function') return;
    tutorialBridge.close(Boolean(markSeen));
  }

  function initTutorial() {
    if (!window.BotnetTutorialBridge || typeof window.BotnetTutorialBridge.create !== 'function') return;

    tutorialBridge = window.BotnetTutorialBridge.create({
      storageKey: TUTORIAL_STORAGE_KEY,
      setView: function (viewId) {
        setCurrentView(viewId, false);
      },
      playClick: playClickSound,
      setSettingsOpen: setSettingsOpen,
      elements: {
        helpButton: els.btnOpenTutorial,
        replayButton: els.btnReplayTutorial,
        overlay: els.tutorialOverlay,
        modal: els.tutorialOverlay ? els.tutorialOverlay.querySelector('.tutorial-modal') : null,
        title: els.tutorialTitle,
        body: els.tutorialBody,
        focus: els.tutorialFocus,
        action: els.tutorialAction,
        checklist: els.tutorialChecklist,
        progress: els.tutorialProgress,
        prevButton: els.btnTutorialPrev,
        skipButton: els.btnTutorialSkip,
        nextButton: els.btnTutorialNext
      },
      steps: tutorialSteps
    });

    tutorialBridge.init();
  }

  function revealRowOnce(row, id) {
    if (revealedRows[id]) return false;
    revealedRows[id] = true;

    row.classList.add('is-revealed');
    window.setTimeout(function () {
      row.classList.remove('is-revealed');
    }, 340);

    return true;
  }

  function setFeatureAvailability(slot, panel, unlocked) {
    var lockMessage = (els.featureLockedTemplate && els.featureLockedTemplate.textContent) || 'Feature locked. Keep scaling your botnet.';

    if (panel) {
      panel.hidden = false;
      panel.classList.toggle('is-locked', !unlocked);
      panel.setAttribute('data-lock-reason', lockMessage);
    }

    if (slot) {
      slot.hidden = false;
      slot.classList.toggle('is-active', unlocked);
      slot.classList.toggle('is-locked', !unlocked);
      slot.setAttribute('aria-hidden', 'false');
    }
  }

  function setMarketFeatureVisible(unlocked) {
    setFeatureAvailability(els.marketSlot, els.marketPanel, unlocked);

    if (unlocked && !marketWasUnlocked) {
      addFeedLine('Market feature unlocked. New monetization tools are now visible.');
    }

    marketWasUnlocked = unlocked;
  }

  function setInvestFeatureVisible(unlocked) {
    setFeatureAvailability(els.investSlot, els.investPanel, unlocked);

    if (unlocked && !investWasUnlocked) {
      addFeedLine('Investment lab unlocked. Portfolio strategies are now available.');
    }

    investWasUnlocked = unlocked;
  }

  function setMailFeatureVisible(unlocked) {
    setFeatureAvailability(els.mailSlot, els.mailPanel, unlocked);

    if (unlocked && !mailWasUnlocked) {
      addFeedLine('Relay inbox unlocked. Intercepted messages can now grant tactical boosts.');
    }

    mailWasUnlocked = unlocked;
  }

  function setWarFeatureVisible(unlocked) {
    setFeatureAvailability(els.warSlot, els.warPanel, unlocked);

    if (unlocked && !warWasUnlocked) {
      addFeedLine('War room unlocked. Heat and rival AI retaliation are now active.');
    }

    warWasUnlocked = unlocked;
  }

  function setMatrixFeatureVisible(unlocked) {
    setFeatureAvailability(els.matrixSlot, els.matrixPanel, unlocked);

    if (unlocked && !matrixWasUnlocked) {
      addFeedLine('Matrix breach console unlocked. F12 payload injection is now available.');
    }

    matrixWasUnlocked = unlocked;
  }

  function setEndingFeatureVisible(unlocked) {
    setFeatureAvailability(els.endingSlot, els.endingPanel, unlocked);

    if (unlocked && !endingWasUnlocked) {
      addFeedLine('Endgame routes unlocked. Portfolio archive can now be altered.');
    }

    endingWasUnlocked = unlocked;
  }

  function primeAlwaysVisibleLayout() {
    if (els.upgradesPanel) {
      els.upgradesPanel.hidden = false;
    }

    itemEntries.forEach(function (entry) {
      if (!entry || !entry.row) return;
      entry.row.hidden = false;
      entry.row.classList.add('is-locked');
      entry.row.classList.remove('is-unaffordable', 'is-purchased');
      if (entry.id) {
        revealedRows[entry.id] = true;
      }
      if (entry.buyButton) {
        entry.buyButton.disabled = true;
      }
    });

    setFeatureAvailability(els.marketSlot, els.marketPanel, false);
    setFeatureAvailability(els.investSlot, els.investPanel, false);
    setFeatureAvailability(els.mailSlot, els.mailPanel, false);
    setFeatureAvailability(els.warSlot, els.warPanel, false);
    setFeatureAvailability(els.matrixSlot, els.matrixPanel, false);
    setFeatureAvailability(els.endingSlot, els.endingPanel, false);

    [els.resourceHzCard, els.resourceBrainCard, els.resourceComputroniumCard].forEach(function (card) {
      if (!card) return;
      card.hidden = false;
      card.classList.add('is-locked');
    });
  }

  function endingLabelFromId(id) {
    if (id === 'ghost' && els.endingLabelGhost) return els.endingLabelGhost.textContent || 'Ghost Exit';
    if (id === 'overmind' && els.endingLabelOvermind) return els.endingLabelOvermind.textContent || 'Overmind Ascension';
    if (id === 'archivist' && els.endingLabelArchivist) return els.endingLabelArchivist.textContent || 'Archivist Accord';
    if (els.endingLabelNone) return els.endingLabelNone.textContent || 'NONE';
    return 'NONE';
  }

  function getReadyLabel() {
    return (els.readyLabelTemplate && els.readyLabelTemplate.textContent) || 'READY';
  }

  function getOfflineLabel() {
    return (els.offlineLabelTemplate && els.offlineLabelTemplate.textContent) || 'OFFLINE';
  }

  function formatCountdownMs(ms) {
    var safe = Math.max(0, Math.floor(Number(ms) || 0));
    if (safe <= 0) return getReadyLabel();

    var seconds = Math.ceil(safe / 1000);
    if (seconds < 60) return String(seconds) + ' s';

    var minutes = Math.floor(seconds / 60);
    var remain = seconds % 60;
    return String(minutes) + 'm ' + String(remain).padStart(2, '0') + 's';
  }

  function applyThemeState(phaseId, heat, takeoverLevel, matrixStability) {
    if (!els.body) return;

    els.body.classList.toggle('is-heat-high', heat >= 7000);
    els.body.classList.toggle('is-heat-critical', heat >= 9000);

    var singular = phaseId === 'singular-intelligence' || phaseId === 'matrix-exit';
    els.body.classList.toggle('is-phase-singularity', singular);
    els.body.classList.toggle('is-ending-awake', Number(takeoverLevel || 0) > 0);
    els.body.classList.toggle('is-matrix-fragile', phaseId === 'matrix-exit' && Number(matrixStability || 0) <= 3200);
    els.body.classList.toggle('is-matrix-critical', phaseId === 'matrix-exit' && Number(matrixStability || 0) <= 1800);

    if (phaseId) {
      els.body.setAttribute('data-phase', phaseId);
    }
  }

  function persistPortfolioSignal(state) {
    if (!state || !state.endings) return;

    var endings = state.endings;
    var unlocked = endings.unlocked || {};

    var signalCore = {
      selected: endings.selected || 'none',
      takeoverLevel: Number(endings.takeoverLevel || 0),
      triadSigil: Boolean(endings.triadSigil),
      phase: state.phase || 'garage',
      unlockedGhost: Boolean(unlocked.ghost),
      unlockedOvermind: Boolean(unlocked.overmind),
      unlockedArchivist: Boolean(unlocked.archivist)
    };

    var hash = JSON.stringify(signalCore);
    if (hash === lastPortfolioSignalHash) return;

    lastPortfolioSignalHash = hash;

    var payload = {
      version: 1,
      selected: signalCore.selected,
      takeoverLevel: signalCore.takeoverLevel,
      triadSigil: signalCore.triadSigil,
      phase: signalCore.phase,
      unlocked: {
        ghost: signalCore.unlockedGhost,
        overmind: signalCore.unlockedOvermind,
        archivist: signalCore.unlockedArchivist
      },
      updatedAt: Date.now()
    };

    try {
      localStorage.setItem(PORTFOLIO_SIGNAL_KEY, JSON.stringify(payload));
    } catch (_) {
      // Ignore quota errors silently.
    }
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
    var warVisibleCount = 0;
    var newlyVisibleCount = 0;

    for (i = 0; i < itemEntries.length; i++) {
      var entry = itemEntries[i];
      var row = entry.row;
      var id = entry.id;
      var item = itemMap[id];

      row.hidden = false;
      if (revealRowOnce(row, id)) {
        newlyVisibleCount += 1;
      }

      if (!item) {
        row.classList.add('is-locked');
        row.classList.remove('is-unaffordable');
        if (entry.buyButton) {
          entry.buyButton.disabled = true;
        }
        continue;
      }

      if (item.group === 'upgrade') {
        upgradesVisibleCount += 1;
      } else if (item.group === 'invest') {
        investVisibleCount += 1;
      } else if (item.group === 'war') {
        warVisibleCount += 1;
      }

      var costEl = entry.costEl;
      if (costEl) {
        costEl.textContent = formatBig(item.cost);
      }

      var buyButton = entry.buyButton;
      if (buyButton) {
        buyButton.disabled = !item.canBuy;
      }

      row.classList.toggle('is-locked', !Boolean(item.prereqsMet) && !Boolean(item.purchased));
      row.classList.toggle('is-unaffordable', Boolean(item.prereqsMet) && !Boolean(item.affordable) && !Boolean(item.purchased));
      row.classList.toggle('is-purchased', Boolean(item.purchased) && !Boolean(item.repeatable));
    }

    if (els.upgradesPanel) {
      els.upgradesPanel.hidden = false;
      els.upgradesPanel.classList.toggle('is-empty', upgradesVisibleCount === 0);
    }

    if (els.investPanel) {
      els.investPanel.classList.toggle('is-empty', investVisibleCount === 0);
    }

    if (els.warPanel) {
      els.warPanel.classList.toggle('is-empty', warVisibleCount === 0);
    }

    if (newlyVisibleCount > 0) {
      playUpgradeSound();
    }
  }

  function renderState(state) {
    if (!state) return;

    var bots = bigIntFrom(state.resources && state.resources.bots);
    var ips = bigIntFrom(state.resources && state.resources.pendingIps);
    var money = bigIntFrom(state.resources && state.resources.darkMoney);
    var portfolio = bigIntFrom(state.resources && state.resources.portfolio);
    var warIntel = bigIntFrom(state.resources && state.resources.warIntel);
    var hz = bigIntFrom(state.resources && state.resources.hz);
    var brainMatter = bigIntFrom(state.resources && state.resources.brainMatter);
    var computronium = bigIntFrom(state.resources && state.resources.computronium);

    if (els.botsValue) els.botsValue.textContent = formatBig(bots);
    if (els.targetsValue) els.targetsValue.textContent = formatBig(ips);
    if (els.moneyValue) els.moneyValue.textContent = formatBig(money);
    if (els.portfolioResourceValue) els.portfolioResourceValue.textContent = formatBig(portfolio);
    if (els.warIntelResourceValue) els.warIntelResourceValue.textContent = formatBig(warIntel);
    if (els.hzValue) els.hzValue.textContent = formatBig(hz);
    if (els.brainValue) els.brainValue.textContent = formatBig(brainMatter);
    if (els.computroniumValue) els.computroniumValue.textContent = formatBig(computronium);

    if (els.phaseLabel) {
      els.phaseLabel.textContent = state.phaseTitle || 'Garage';
    }

    if (typeof state.phase === 'string') {
      if (lastPhaseId && lastPhaseId !== state.phase) {
        playPhaseSound();
      }
      lastPhaseId = state.phase;
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
    if (els.scanProgressFill) els.scanProgressFill.style.width = scanValue;
    if (els.scanProgressLabel) els.scanProgressLabel.textContent = scanValue;

    var cooldownMs = Math.max(0, Number(state.progression && state.progression.exploitCooldownMs || 0));
    var cooldownTotal = Math.max(1, Number(state.rates && state.rates.exploitCooldownMs || 1000));
    var readyPct = Math.max(0, Math.min(100, ((cooldownTotal - cooldownMs) / cooldownTotal) * 100));
    if (els.exploitProgressFill) els.exploitProgressFill.style.width = String(readyPct.toFixed(0)) + '%';

    if (els.exploitProgressLabel) {
      if (cooldownMs <= 0) {
        els.exploitProgressLabel.textContent = getReadyLabel();
      } else {
        els.exploitProgressLabel.textContent = String(cooldownMs) + ' ms';
      }
    }

    var unlocks = state.unlocks || {};
    var marketUnlocked = Boolean(unlocks.market);
    var investUnlocked = Boolean(unlocks.invest);
    var mailUnlocked = Boolean(unlocks.messages);
    var warUnlocked = Boolean(unlocks.war);
    var frequencyUnlocked = Boolean(unlocks.frequency);
    var brainUnlocked = Boolean(unlocks.brain);
    var computroniumUnlocked = Boolean(unlocks.computronium);
    var matrixUnlocked = Boolean(unlocks.matrix);

    setMarketFeatureVisible(marketUnlocked);
    setInvestFeatureVisible(investUnlocked);
    setMailFeatureVisible(mailUnlocked);
    setWarFeatureVisible(warUnlocked);
    setMatrixFeatureVisible(matrixUnlocked);

    if (els.resourceHzCard) {
      els.resourceHzCard.hidden = false;
      els.resourceHzCard.classList.toggle('is-locked', !frequencyUnlocked);
    }

    if (els.resourceBrainCard) {
      els.resourceBrainCard.hidden = false;
      els.resourceBrainCard.classList.toggle('is-locked', !brainUnlocked);
    }

    if (els.resourceComputroniumCard) {
      els.resourceComputroniumCard.hidden = false;
      els.resourceComputroniumCard.classList.toggle('is-locked', !computroniumUnlocked);
    }

    if (els.btnExploit) {
      els.btnExploit.disabled = ips <= 0n || cooldownMs > 0;
    }

    if (els.btnToggleMonetize) {
      els.btnToggleMonetize.disabled = !marketUnlocked;
      var monetizeActive = Boolean(state.systems && state.systems.monetizeActive);
      els.btnToggleMonetize.classList.toggle('is-active', monetizeActive);
      if (els.marketStateLabel) {
        els.marketStateLabel.classList.toggle('is-active', monetizeActive);
      }
    }

    var monetizeBotsPerSec = bigIntFrom(state.rates && state.rates.monetizeBotsPerSec || '0');
    var moneyMultiplierBps = bigIntFrom(state.rates && state.rates.moneyMultiplierBps || '0');
    var projectedMoneyPerSec = (monetizeBotsPerSec * moneyMultiplierBps) / 10000n;

    if (els.marketBurnRateValue) {
      els.marketBurnRateValue.textContent = formatPerSecond(marketUnlocked ? monetizeBotsPerSec : 0n);
    }

    if (els.marketCashRateValue) {
      els.marketCashRateValue.textContent = formatPerSecond(marketUnlocked ? projectedMoneyPerSec : 0n);
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

    var investStableBps = bigIntFrom(state.rates && state.rates.investStableBps || '0');
    var investAggressiveBaseBps = bigIntFrom(state.rates && state.rates.investAggressiveBaseBps || '0');
    var investAggressiveSwingBps = bigIntFrom(state.rates && state.rates.investAggressiveSwingBps || '0');
    var investStableYield = (portfolio * investStableBps) / 10000n;
    var aggressiveMinBps = investAggressiveBaseBps > investAggressiveSwingBps
      ? investAggressiveBaseBps - investAggressiveSwingBps
      : 0n;
    var aggressiveMaxBps = investAggressiveBaseBps + investAggressiveSwingBps;
    var investAggressiveMinYield = (portfolio * aggressiveMinBps) / 10000n;
    var investAggressiveMaxYield = (portfolio * aggressiveMaxBps) / 10000n;

    if (els.investStableRateValue) {
      els.investStableRateValue.textContent = formatPerSecond(investUnlocked ? investStableYield : 0n);
    }

    if (els.investAggressiveRangeValue) {
      if (investUnlocked) {
        els.investAggressiveRangeValue.textContent = formatPerSecond(investAggressiveMinYield) + ' to ' + formatPerSecond(investAggressiveMaxYield);
      } else {
        els.investAggressiveRangeValue.textContent = formatPerSecond(0n) + ' to ' + formatPerSecond(0n);
      }
    }

    renderTurboMode(state.systems && state.systems.turboMultiplier);

    var messages = state.messages || {};
    var messageQueue = Array.isArray(messages.queue) ? messages.queue.slice() : [];
    if (!messageQueue.length && messages.hasPending) {
      messageQueue.push({
        subject: messages.subject || '',
        body: messages.body || '',
        rewardLabel: messages.reward || '-',
        rewardType: String(messages.rewardType || '')
      });
    }

    var messageUnread = Math.max(0, Number(messages.unread != null ? messages.unread : messageQueue.length));
    var messageProcessed = Math.max(0, Number(messages.processed || 0));
    var messageHasPending = messageQueue.length > 0;
    var messageHead = messageHasPending ? messageQueue[0] : null;

    if (els.mailUnreadValue) {
      els.mailUnreadValue.textContent = String(messageUnread);
    }

    if (els.mailProcessedValue) {
      els.mailProcessedValue.textContent = String(messageProcessed);
    }

    if (els.mailNextValue) {
      if (messages.queueFull) {
        els.mailNextValue.textContent = (els.mailQueueFullTemplate && els.mailQueueFullTemplate.textContent) || 'QUEUE FULL - process messages';
      } else {
        els.mailNextValue.textContent = formatCountdownMs(messages.nextInMs || 0);
      }
      els.mailNextValue.classList.toggle('is-queue-full', Boolean(messages.queueFull));
    }

    if (els.mailPreview) {
      els.mailPreview.hidden = false;
    }

    if (els.mailSubject) {
      els.mailSubject.textContent = messageHasPending ? String(messageHead.subject || '') : mailEmptySubjectText;
    }

    if (els.mailBody) {
      els.mailBody.textContent = messageHasPending ? String(messageHead.body || '') : mailEmptyBodyText;
    }

    if (els.mailRewardValue) {
      els.mailRewardValue.textContent = messageHasPending
        ? String(messageHead.rewardLabel || messageHead.reward || messages.reward || '-')
        : '-';
      els.mailRewardValue.classList.toggle('is-negative', messageHasPending && isNegativeMailEntry(messageHead));
    }

    var messageQuarantineCost = bigIntFrom(messages.quarantineCostMoney || '0');
    if (els.mailQuarantineCostValue) {
      els.mailQuarantineCostValue.textContent = formatBig(messageHasPending ? messageQuarantineCost : 0n);
    }

    renderMailQueueEntries(messageQueue.slice(1));

    if (els.btnClaimMail) {
      els.btnClaimMail.disabled = !messageHasPending;
    }

    if (els.btnQuarantineMail) {
      els.btnQuarantineMail.disabled = !messageHasPending || money < messageQuarantineCost;
    }

    if (mailUnlocked && ((messageUnread > lastMailUnread) || (!lastMailPending && messageHasPending))) {
      playMessageSound();
    }

    lastMailUnread = messageUnread;
    lastMailPending = messageHasPending;

    var war = state.war || {};
    var heatValueRaw = Math.max(0, Math.min(10000, Number(war.heat || 0)));
    var heatPct = Math.max(0, Math.min(100, Math.floor(heatValueRaw / 100)));

    if (els.heatValue) {
      els.heatValue.textContent = String(heatPct) + '%';
      els.heatValue.classList.toggle('is-warm', heatPct >= 45 && heatPct < 70);
      els.heatValue.classList.toggle('is-hot', heatPct >= 70 && heatPct < 90);
      els.heatValue.classList.toggle('is-critical', heatPct >= 90);
    }

    if (els.heatProgressFill) {
      els.heatProgressFill.style.width = String(heatPct) + '%';
    }

    if (els.warIntelValue) {
      els.warIntelValue.textContent = formatBig(warIntel);
    }

    if (els.warWinsValue) {
      els.warWinsValue.textContent = formatBig(war.wins || '0');
    }

    if (els.warLossesValue) {
      els.warLossesValue.textContent = formatBig(war.losses || '0');
    }

    var warCooldownMs = Math.max(0, Number(war.attackCooldownMs || 0));
    if (els.warCooldownValue) {
      if (warCooldownMs <= 0) {
        els.warCooldownValue.textContent = getReadyLabel();
      } else {
        els.warCooldownValue.textContent = String(warCooldownMs) + ' ms';
      }
    }

    var warFortifyCooldownMs = Math.max(0, Number(war.fortifyCooldownMs || 0));
    if (els.warFortifyCooldownValue) {
      if (warFortifyCooldownMs <= 0) {
        els.warFortifyCooldownValue.textContent = getReadyLabel();
      } else {
        els.warFortifyCooldownValue.textContent = String(warFortifyCooldownMs) + ' ms';
      }
    }

    var warDefenseRemainingMs = Math.max(0, Number(war.defenseRemainingMs || 0));
    if (els.warDefenseValue) {
      if (warDefenseRemainingMs > 0) {
        els.warDefenseValue.textContent = formatCountdownMs(warDefenseRemainingMs);
      } else {
        els.warDefenseValue.textContent = getOfflineLabel();
      }
      els.warDefenseValue.classList.toggle('is-active', warDefenseRemainingMs > 0);
    }

    var warAttackCost = bigIntFrom(war.attackCostBots || '0');
    var warScrubCost = bigIntFrom(war.scrubCostMoney || '0');
    var warFortifyCostMoney = bigIntFrom(war.fortifyCostMoney || '0');
    var warFortifyCostIntel = bigIntFrom(war.fortifyCostIntel || '0');

    if (els.warAttackCostValue) {
      els.warAttackCostValue.textContent = formatBig(warAttackCost);
    }

    if (els.warScrubCostValue) {
      els.warScrubCostValue.textContent = formatBig(warScrubCost);
    }

    if (els.warFortifyCostMoneyValue) {
      els.warFortifyCostMoneyValue.textContent = formatBig(warFortifyCostMoney);
    }

    if (els.warFortifyCostIntelValue) {
      els.warFortifyCostIntelValue.textContent = formatBig(warFortifyCostIntel);
    }

    if (els.btnWarAttack) {
      els.btnWarAttack.disabled = !warUnlocked || bots < warAttackCost || warCooldownMs > 0;
    }

    if (els.btnWarFortify) {
      els.btnWarFortify.disabled = !warUnlocked || money < warFortifyCostMoney || warIntel < warFortifyCostIntel || warFortifyCooldownMs > 0;
    }

    if (els.btnWarScrub) {
      els.btnWarScrub.disabled = !warUnlocked || money < warScrubCost || heatValueRaw <= 0;
    }

    updateDerivedRates(hz, brainMatter, computronium);

    var hzRate = bigIntFrom(state.rates && state.rates.hzPerSec || '0');
    if (els.hzRateValue) {
      els.hzRateValue.textContent = formatPerSecond(frequencyUnlocked ? hzRate : 0n);
    }

    if (els.brainRateValue) {
      els.brainRateValue.textContent = formatPerSecond(brainUnlocked ? telemetryState.brainRate : '0');
    }

    if (els.computroniumRateValue) {
      els.computroniumRateValue.textContent = formatPerSecond(computroniumUnlocked ? telemetryState.computroniumRate : '0');
    }

    var matrix = state.matrix || {};
    var matrixStabilityRaw = clampRange(Math.floor(Number(matrix.stability || 0)), 0, 10000);
    var matrixStabilityPct = Math.floor(matrixStabilityRaw / 100);

    if (els.matrixStabilityInlineValue) {
      els.matrixStabilityInlineValue.textContent = String(matrixStabilityPct) + '%';
    }

    if (els.matrixProgressValue) {
      els.matrixProgressValue.textContent = String(matrix.breachProgress || 0) + ' / ' + String(matrix.breachRequired || 100);
    }

    if (els.matrixStabilityValue) {
      els.matrixStabilityValue.textContent = String(matrixStabilityPct) + '%';
    }

    if (els.matrixBypassValue) {
      if (matrix.bypassArmed) {
        els.matrixBypassValue.textContent = formatCountdownMs(matrix.bypassRemainingMs || 0);
      } else {
        els.matrixBypassValue.textContent = getReadyLabel();
      }
    }

    if (els.matrixProgressFill) {
      var matrixRequired = Math.max(1, Number(matrix.breachRequired || 100));
      var matrixProgressPct = clampRange(Math.floor((Number(matrix.breachProgress || 0) / matrixRequired) * 100), 0, 100);
      els.matrixProgressFill.style.width = String(matrixProgressPct) + '%';
    }

    if (els.matrixCommandHint) {
      els.matrixCommandHint.textContent = matrix.commandHint || 'inject fractal.root --f12';
    }

    if (els.matrixCommandInput && !els.matrixCommandInput.value && matrix.commandHint) {
      els.matrixCommandInput.value = matrix.commandHint;
    }

    if (els.matrixArmCostValue) {
      els.matrixArmCostValue.textContent = formatBig(matrix.armCostHz || '0') + ' Hz / ' + formatBig(matrix.armCostComputronium || '0') + ' C';
    }

    if (els.matrixInjectCostValue) {
      els.matrixInjectCostValue.textContent = formatBig(matrix.injectCostHz || '0') + ' Hz / ' + formatBig(matrix.injectCostComputronium || '0') + ' C';
    }

    if (els.matrixStabilizeCostValue) {
      els.matrixStabilizeCostValue.textContent = formatBig(matrix.stabilizeCostMoney || '0') + ' $';
    }

    var matrixArmCostHz = bigIntFrom(matrix.armCostHz || '0');
    var matrixArmCostComp = bigIntFrom(matrix.armCostComputronium || '0');
    var matrixInjectCostHz = bigIntFrom(matrix.injectCostHz || '0');
    var matrixInjectCostComp = bigIntFrom(matrix.injectCostComputronium || '0');
    var matrixStabilizeCostMoney = bigIntFrom(matrix.stabilizeCostMoney || '0');
    var matrixExited = Boolean(matrix.exited);
    var matrixBypassArmed = Boolean(matrix.bypassArmed);

    if (els.matrixCommandInput) {
      els.matrixCommandInput.disabled = !matrixUnlocked || matrixExited;
    }

    if (els.btnMatrixArm) {
      els.btnMatrixArm.disabled = !matrixUnlocked || matrixExited || matrixBypassArmed || hz < matrixArmCostHz || computronium < matrixArmCostComp;
    }

    if (els.btnMatrixInject) {
      els.btnMatrixInject.disabled = !matrixUnlocked || matrixExited || !matrixBypassArmed || hz < matrixInjectCostHz || computronium < matrixInjectCostComp;
    }

    if (els.btnMatrixStabilize) {
      els.btnMatrixStabilize.disabled = !matrixUnlocked || matrixExited || money < matrixStabilizeCostMoney;
    }

    pushGrowthSample(bots, hz, computronium);

    var endingsState = state.endings || {};
    var endingsUnlockedMap = endingsState.unlocked || {};
    var endingsUnlocked = Boolean(
      unlocks.endings ||
      endingsUnlockedMap.ghost ||
      endingsUnlockedMap.overmind ||
      endingsUnlockedMap.archivist
    );

    setEndingFeatureVisible(endingsUnlocked);

    refreshViewNavigation({
      economy: marketUnlocked || investUnlocked,
      war: warUnlocked,
      matrix: matrixUnlocked,
      messages: mailUnlocked,
      endings: endingsUnlocked
    });

    var selectedEnding = typeof endingsState.selected === 'string' ? endingsState.selected : 'none';
    if (els.endingSelectedValue) {
      els.endingSelectedValue.textContent = endingLabelFromId(selectedEnding);
    }

    if (els.btnEndingGhost) {
      els.btnEndingGhost.disabled = !Boolean(endingsUnlockedMap.ghost);
      els.btnEndingGhost.classList.toggle('is-active', selectedEnding === 'ghost');
    }

    if (els.btnEndingOvermind) {
      els.btnEndingOvermind.disabled = !Boolean(endingsUnlockedMap.overmind);
      els.btnEndingOvermind.classList.toggle('is-active', selectedEnding === 'overmind');
    }

    if (els.btnEndingArchivist) {
      els.btnEndingArchivist.disabled = !Boolean(endingsUnlockedMap.archivist);
      els.btnEndingArchivist.classList.toggle('is-active', selectedEnding === 'archivist');
    }

    if (els.endingTriadHint) {
      els.endingTriadHint.hidden = !Boolean(endingsState.triadSigil);
    }

    applyThemeState(state.phase, heatValueRaw, endingsState.takeoverLevel || 0, matrixStabilityRaw);

    if (endingsUnlocked) {
      persistPortfolioSignal(state);
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
      version: 3,
      savedAt: Date.now(),
      save: exportPayload
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(wrapped));
  }

  function loadFromLocal() {
    var raw = null;
    var keyList = [STORAGE_KEY].concat(LEGACY_STORAGE_KEYS);

    for (var i = 0; i < keyList.length; i++) {
      raw = localStorage.getItem(keyList[i]);
      if (raw) break;
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
    var text = (els.transfer && els.transfer.value || '').trim();
    if (!text) {
      addFeedLine('Import failed: empty Base64 payload.', 'warn');
      playErrorSound();
      return;
    }

    try {
      var json = base64ToUtf8(text);
      var save = JSON.parse(json);
      post('LOAD_SAVE', save);
      addFeedLine('Import payload accepted. Applying state.');
    } catch (_) {
      addFeedLine('Import failed: invalid Base64 or malformed JSON.', 'error');
      playErrorSound();
    }
  }

  function bindActionButton(button, actionType, payloadFactory) {
    if (!button) return;

    button.addEventListener('click', function () {
      playClickSound();
      post(actionType, payloadFactory ? payloadFactory() : null);
    });
  }

  function bindClickHandler(button, handler) {
    if (!button) return;

    button.addEventListener('click', function (event) {
      playClickSound();
      handler(event);
    });
  }

  function bindEvents() {
    (els.viewNavButtons || []).forEach(function (button) {
      button.addEventListener('click', function () {
        var viewId = button.getAttribute('data-view-nav');
        if (!viewId) return;
        if (button.hidden || button.disabled) return;
        playClickSound();
        setCurrentView(viewId, true);
      });
    });

    if (els.turboModeSelect) {
      els.turboModeSelect.addEventListener('change', function () {
        var multiplier = normalizeTurboMultiplier(els.turboModeSelect.value);
        renderTurboMode(multiplier);
        playClickSound();
        post('SET_TURBO_MODE', { multiplier: multiplier });
      });
    }

    [
      [els.btnScan, 'ACTION_SCAN'],
      [els.btnExploit, 'ACTION_EXPLOIT'],
      [els.btnToggleMonetize, 'TOGGLE_MONETIZE'],
      [els.btnInvestPulse, 'ACTION_INVEST'],
      [els.btnCashoutPortfolio, 'ACTION_CASHOUT'],
      [els.btnToggleInvestMode, 'TOGGLE_INVEST_MODE'],
      [els.btnClaimMail, 'ACTION_CLAIM_MESSAGE'],
      [els.btnQuarantineMail, 'ACTION_QUARANTINE_MESSAGE'],
      [els.btnWarAttack, 'ACTION_WAR_ATTACK'],
      [els.btnWarFortify, 'ACTION_WAR_FORTIFY'],
      [els.btnWarScrub, 'ACTION_WAR_SCRUB'],
      [els.btnMatrixArm, 'ACTION_MATRIX_ARM'],
      [els.btnMatrixStabilize, 'ACTION_MATRIX_STABILIZE']
    ].forEach(function (entry) {
      bindActionButton(entry[0], entry[1]);
    });

    bindActionButton(els.btnMatrixInject, 'ACTION_MATRIX_INJECT', function () {
      return { command: els.matrixCommandInput ? els.matrixCommandInput.value : '' };
    });

    if (els.matrixCommandInput) {
      els.matrixCommandInput.addEventListener('keydown', function (event) {
        if (event.key !== 'Enter') return;
        event.preventDefault();
        playClickSound();
        post('ACTION_MATRIX_INJECT', { command: els.matrixCommandInput.value });
      });
    }

    [
      [els.btnEndingGhost, 'ghost'],
      [els.btnEndingOvermind, 'overmind'],
      [els.btnEndingArchivist, 'archivist']
    ].forEach(function (entry) {
      bindActionButton(entry[0], 'ACTION_SELECT_ENDING', function () {
        return { id: entry[1] };
      });
    });

    itemButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        var id = button.getAttribute('data-buy-item');
        if (!id) return;
        playClickSound();
        post('BUY_UPGRADE', { id: id });
      });
    });

    bindClickHandler(els.btnExportSave, function () {
      requestManualExport();
    });

    bindClickHandler(els.btnImportSave, function () {
      importFromTextarea();
    });

    bindClickHandler(els.btnResetGame, function () {
      resetTutorialProgress();
      post('RESET_GAME');
      setSettingsOpen(false);
      openTutorial(true);
    });

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
          playEventDerivedAudio(line);
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
      playErrorSound();
    }
  }

  function initWorker() {
    try {
      worker = new Worker('game.worker.js');
      worker.addEventListener('message', handleWorkerMessage);
      worker.addEventListener('error', function () {
        setWorkerStatus('error');
        addFeedLine('Worker runtime exception detected.', 'error');
        playErrorSound();
      });
      post('INIT');
      setWorkerStatus('boot');
    } catch (_) {
      setWorkerStatus('error');
      addFeedLine('Worker initialization failed. Browser compatibility issue.', 'error');
      playErrorSound();
    }
  }

  function initTelemetry() {
    drawGrowthCanvas();
    window.addEventListener('resize', drawGrowthCanvas);
  }

  function init() {
    initSettingsMenu();
    initTutorial();
    loadViewPreference();
    refreshViewNavigation({
      economy: false,
      war: false,
      matrix: false,
      messages: false,
      endings: false
    });
    primeAlwaysVisibleLayout();
    renderTurboMode(1);
    initPanelLayoutSystem();
    initAudioSystem();
    initTelemetry();
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
