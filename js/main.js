/* ============================================
   MAIN — Header, Burger, ScrollSpy, Filters & Cursor
   DevByFab Portfolio — Compact & Optimized
   ============================================ */
(function () {
  'use strict';

  /* Header Morphing */
  function initHeader() {
    var header = document.querySelector('.site-header');
    if (!header) return;
    var onScroll = function () { header.classList.toggle('scrolled', window.scrollY > 40); };
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

  /* Scroll Spy */
  function initScrollSpy() {
    var sections = document.querySelectorAll('section[id]');
    var navLinks = document.querySelectorAll('.nav-link');
    if (!sections.length || !navLinks.length) return;

    var updateActive = function () {
      var scrollPos = window.scrollY + 180, currentId = '';
      sections.forEach(function (s) { if (s.offsetTop <= scrollPos) currentId = s.id; });
      navLinks.forEach(function (l) {
        var href = l.getAttribute('href') || '';
        l.classList.toggle('active', href === '#' + currentId || href.endsWith('#' + currentId));
      });
    };
    window.addEventListener('scroll', updateActive, { passive: true });
    updateActive();
  }

  /* Smooth Scroll (Lenis Cooperative) */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        var id = this.getAttribute('href');
        if (!id || id === '#') return;
        var target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        if (window._lenis) {
          window._lenis.scrollTo(target, { offset: -80 });
        } else {
          window.scrollTo({ top: target.getBoundingClientRect().top + window.pageYOffset - 80, behavior: 'smooth' });
        }
      });
    });
  }

  /* Project Filters (Gallery Page) */
  function initProjectFilters() {
    var filterBtns = document.querySelectorAll('.filter-btn');
    var projectItems = document.querySelectorAll('.project-item');
    if (!filterBtns.length || !projectItems.length) return;

    filterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        filterBtns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        var cat = btn.getAttribute('data-filter');
        projectItems.forEach(function (card) {
          card.style.display = (cat === 'all' || card.getAttribute('data-cat') === cat) ? '' : 'none';
        });
      });
    });
  }

  /* Spotlight Cursor on Cards */
  function initSpotlightCards() {
    var cards = document.querySelectorAll('.spotlight-card');
    if (!cards.length || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    cards.forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        if (document.documentElement.getAttribute('data-perf') === 'eco') return;
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mouse-x', (e.clientX - r.left) + 'px');
        card.style.setProperty('--mouse-y', (e.clientY - r.top) + 'px');
      });
      card.addEventListener('mouseleave', function () {
        card.style.setProperty('--mouse-x', '-500px');
        card.style.setProperty('--mouse-y', '-500px');
      });
    });
  }

  /* Infinite Botnet Easter Egg Signal */
  function initBotnetSignal() {
    try {
      var raw = localStorage.getItem('infiniteBotnet.portfolioSignal.v1');
      if (!raw) return;
      var p = JSON.parse(raw);
      if (p && document.body) {
        document.body.classList.add('botnet-ending-active');
        if (p.selected && p.selected !== 'none') document.body.classList.add('botnet-ending-' + p.selected);
        if (p.triadSigil) document.body.classList.add('botnet-ending-triad');
      }
    } catch (_) {}
  }

  function init() {
    initHeader(); initBurger(); initScrollSpy(); initSmoothScroll();
    initProjectFilters(); initSpotlightCards(); initBotnetSignal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
