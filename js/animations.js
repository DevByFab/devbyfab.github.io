/* ============================================
   ANIMATIONS — Native IntersectionObserver
   DevByFab Portfolio — Compact & 0 Dependency
   ============================================ */
(function () {
  'use strict';

  function initReveals() {
    var revealElements = document.querySelectorAll('[data-anim="fade-up"], [data-anim="stagger"], .section-title');
    if (!revealElements.length) return;

    var isReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (isReduced || !('IntersectionObserver' in window)) {
      revealElements.forEach(function (el) { el.classList.add('is-revealed'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.05, rootMargin: '0px 0px -10px 0px' });

    revealElements.forEach(function (el) {
      observer.observe(el);
    });

    // Safety fallback: reveal any element in view shortly after load
    setTimeout(function () {
      revealElements.forEach(function (el) {
        var rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight) {
          el.classList.add('is-revealed');
        }
      });
    }, 350);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initReveals);
  } else {
    initReveals();
  }
})();
