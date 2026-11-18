/* ============================================
   PERF TIER — sans sondage WebGL
   "eco" = animations coupées (mouvement réduit demandé ou CPU faible).
   ============================================ */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var lowCpu = (navigator.hardwareConcurrency || 4) <= 2;
  var tier = reduced || lowCpu ? 'eco' : 'turbo';

  root.classList.add('js');
  // Filet de sécurité : si animations.js n'a pas démarré après 4 s, tout s'affiche.
  setTimeout(function () {
    if (!root.classList.contains('reveal-ready')) root.classList.add('reveal-all');
  }, 4000);

  root.setAttribute('data-perf', tier);
  root.classList.add(tier === 'eco' ? 'perf-eco' : 'perf-turbo');

  try { localStorage.removeItem('devbyfab:perf_tier_manual'); } catch (_) {}
})();
