/* ============================================
   PERFORMANCE ENGINE — Dual-Tier Turbo & Eco
   DevByFab Portfolio — Compact & Robust
   ============================================ */
(function () {
  'use strict';
  var MANUAL_KEY = 'devbyfab:perf_tier_manual';
  var currentTier = 'turbo';

  // Clear legacy auto-saved key that poisoned return visits in Chrome/Brave
  try { localStorage.removeItem('devbyfab:perf_tier'); } catch (_) {}

  function hasHardwareAcceleration() {
    try {
      var canvas = document.createElement('canvas');
      var gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) return false;
      var debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        var renderer = (gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '').toLowerCase();
        if (/swiftshader|llvmpipe|software rasterizer|software renderer|basic render/.test(renderer)) {
          return false;
        }
      }
      return true;
    } catch (_) {
      return false;
    }
  }

  function detectOptimalTier() {
    try {
      var manual = localStorage.getItem(MANUAL_KEY);
      if (manual === 'turbo' || manual === 'eco') return manual;
      if (!hasHardwareAcceleration()) return 'eco';
      if ((navigator.hardwareConcurrency || 4) <= 2) return 'eco';
    } catch (_) {}
    return 'turbo';
  }

  function applyTier(tier, isManual) {
    currentTier = tier;
    var root = document.documentElement, isTurbo = tier === 'turbo';
    root.setAttribute('data-perf', tier);
    root.classList.toggle('perf-turbo', isTurbo);
    root.classList.toggle('perf-eco', !isTurbo);

    document.querySelectorAll('[data-perf-toggle]').forEach(function (btn) {
      var icon = btn.querySelector('.perf-toggle__icon'), label = btn.querySelector('.perf-toggle__label');
      btn.setAttribute('aria-pressed', isTurbo ? 'true' : 'false');
      btn.setAttribute('title', isTurbo ? 'Mode Turbo actif' : 'Mode Éco actif');
      if (icon) icon.textContent = isTurbo ? '⚡' : '🍃';
      if (label) label.textContent = isTurbo ? 'Turbo' : ((root.getAttribute('lang') || 'fr') === 'fr' ? 'Éco' : 'Eco');
    });

    if (isManual) {
      try { localStorage.setItem(MANUAL_KEY, tier); } catch (_) {}
    }
    window.dispatchEvent(new CustomEvent('perftierchange', { detail: { tier: tier } }));
  }

  function toggleTier() {
    applyTier(currentTier === 'turbo' ? 'eco' : 'turbo', true);
  }

  currentTier = detectOptimalTier();
  applyTier(currentTier, false);

  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-perf-toggle]')) {
      e.preventDefault();
      toggleTier();
    }
  });

  window.devbyfabPerf = {
    getTier: function () { return currentTier; },
    setTier: function (t) { applyTier(t, true); },
    toggleTier: toggleTier
  };
})();
