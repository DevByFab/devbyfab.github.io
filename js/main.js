/* ============================================
   MAIN — En-tête, menu burger, scroll spy, chapitres, progression
   DevByFab Portfolio — Compact & Optimized
   ============================================ */
(function () {
  'use strict';

  /* Header Morphing with Hysteresis */
  function initHeader() {
    var header = document.querySelector('.site-header');
    if (!header) return;
    var isScrolled = false;
    var onScroll = function () {
      var y = window.scrollY;
      if (!isScrolled && y > 50) {
        isScrolled = true;
        header.classList.add('scrolled');
      } else if (isScrolled && y < 20) {
        isScrolled = false;
        header.classList.remove('scrolled');
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* Burger Menu */
  function initBurger() {
    var burger = document.querySelector('.burger-menu');
    var navLinks = document.querySelector('.nav-links');
    if (!burger || !navLinks) return;

    var toggle = function (open) {
      burger.classList.toggle('open', open);
      navLinks.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    };

    burger.addEventListener('click', function (e) { e.stopPropagation(); toggle(!burger.classList.contains('open')); });
    navLinks.querySelectorAll('a').forEach(function (l) { l.addEventListener('click', function () { toggle(false); }); });
    document.addEventListener('click', function (e) {
      if (!burger.contains(e.target) && !navLinks.contains(e.target)) toggle(false);
    });
  }

  /* Scroll Spy (IntersectionObserver : aucune lecture de layout au scroll) */
  function initScrollSpy() {
    var sections = document.querySelectorAll('section[id]');
    var navLinks = document.querySelectorAll('.nav-link');
    if (!sections.length || !navLinks.length || !('IntersectionObserver' in window)) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = entry.target.id;
        navLinks.forEach(function (l) {
          var href = l.getAttribute('href') || '';
          l.classList.toggle('active', href === '#' + id || href.endsWith('#' + id));
        });
      });
    }, { rootMargin: '-40% 0px -55% 0px' });

    sections.forEach(function (s) { io.observe(s); });
  }

  /* Les ancres utilisent le scroll natif (CSS scroll-behavior + scroll-margin-top). */

  /* Chapitres : l'étape qui croise le milieu de l'écran pilote la scène (data-step + .on sur les calques) */
  function initChapters() {
    var chapters = document.querySelectorAll('[data-chapter]');
    if (!chapters.length) return;
    // Sur mobile la scène occupe le haut de l'écran : on change d'étape plus bas, là où le texte est visible
    var narrow = window.matchMedia('(max-width: 900px)');

    chapters.forEach(function (chapter) {
      var steps = chapter.querySelectorAll('.step');
      var layers = chapter.querySelectorAll('.layer');

      function show(n) {
        chapter.setAttribute('data-step', n);
        steps.forEach(function (s) { s.classList.toggle('is-current', s.getAttribute('data-step-n') === n); });
        layers.forEach(function (l) {
          l.classList.toggle('on', (' ' + l.getAttribute('data-l') + ' ').indexOf(' ' + n + ' ') !== -1);
        });
      }

      show('1');
      if (!('IntersectionObserver' in window)) return;

      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) show(e.target.getAttribute('data-step-n')); });
      }, { rootMargin: narrow.matches ? '-45% 0px -48% 0px' : '-50% 0px -42% 0px' });

      steps.forEach(function (s) { io.observe(s); });
    });
  }

  /* Barre de progression : la page se « remplit » au scroll */
  function initProgress() {
    var fill = document.getElementById('level-fill');
    if (!fill) return;
    var ticking = false;
    function update() {
      ticking = false;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      fill.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, window.scrollY / max) : 0) + ')';
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  function init() {
    initHeader(); initBurger(); initScrollSpy();
    initChapters(); initProgress();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
