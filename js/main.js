/* ============================================
   MAIN — Burger Menu & Footer Reveal
   ============================================ */

(function () {
  'use strict';

  /* ========== BURGER MENU ========== */
  function initBurger() {
    var burger = document.querySelector('.burger-menu');
    var navUl = document.querySelector('.nav-center ul');
    if (!burger || !navUl) return;

    burger.addEventListener('click', function (e) {
      e.stopPropagation();
      burger.classList.toggle('open');
      navUl.classList.toggle('open');
    });

    // Close on link click
    navUl.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        burger.classList.remove('open');
        navUl.classList.remove('open');
      });
    });

    // Close on outside click
    document.addEventListener('click', function (e) {
      if (!burger.contains(e.target) && !navUl.contains(e.target)) {
        burger.classList.remove('open');
        navUl.classList.remove('open');
      }
    });
  }

  /* ========== FOOTER REVEAL ON SCROLL ========== */
  function initFooter() {
    var footer = document.querySelector('footer');
    if (!footer) return;

    function checkFooter() {
      var rect = footer.getBoundingClientRect();
      if (rect.top < window.innerHeight + 50) {
        footer.classList.add('footer-visible');
      }
    }

    window.addEventListener('scroll', checkFooter, { passive: true });
    window.addEventListener('resize', checkFooter, { passive: true });
    checkFooter();
  }

  /* ========== INIT ========== */
  function init() {
    initBurger();
    initFooter();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
