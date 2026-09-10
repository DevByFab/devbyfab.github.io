/* ============================================
   PERFORMANCE ENGINE — Dual-Tier Turbo & Eco
   DevByFab Portfolio — Compact & Optimized
   ============================================ */
(function () {
  'use strict';
  var KEY = 'devbyfab:perf_tier', currentTier = 'turbo';

  function detectOptimalTier() {
    try {
      var s = localStorage.getItem(KEY);
      if (s === 'turbo' || s === 'eco') return s;
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 'eco';
      if ((navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4) return 'eco';
    } catch (_) {}
    return 'turbo';
  }

  function applyTier(tier) {
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

    try { localStorage.setItem(KEY, tier); } catch (_) {}
    window.dispatchEvent(new CustomEvent('perftierchange', { detail: { tier: tier } }));
  }

  function toggleTier() { applyTier(currentTier === 'turbo' ? 'eco' : 'turbo'); }

  currentTier = detectOptimalTier();
  applyTier(currentTier);

  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-perf-toggle]')) { e.preventDefault(); toggleTier(); }
  });

  window.devbyfabPerf = { getTier: function () { return currentTier; }, setTier: applyTier, toggleTier: toggleTier };
})();
