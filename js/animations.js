/* ============================================
   REVEAL — apparition au scroll (IntersectionObserver)
   Zéro dépendance. Le CSS gère l'animation (css/base.css).
   ============================================ */
(function () {
  'use strict';

  var root = document.documentElement;

  function showAll() {
    root.classList.add('reveal-all');
  }

  function init() {
    root.classList.add('reveal-ready');
    if (!('IntersectionObserver' in window) ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      showAll();
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });

    document.querySelectorAll('[data-anim="fade-up"]').forEach(function (el) {
      io.observe(el);
    });

    document.querySelectorAll('[data-anim="stagger"]').forEach(function (parent) {
      parent.querySelectorAll('[data-anim-child]').forEach(function (child, i) {
        child.style.transitionDelay = Math.min(i, 5) * 90 + 'ms';
        io.observe(child);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
