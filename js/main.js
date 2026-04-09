/* ============================================
   MAIN — Header Morphing, Burger Menu, Scroll Spy
   DevByFab — Dark Modern Portfolio v2
   ============================================ */

(function () {
  'use strict';

  /* ========== HEADER MORPHING ========== */
  function initHeader() {
    var header = document.querySelector('.site-header');
    if (!header) return;

    var scrollThreshold = 60;

    function checkScroll() {
      if (window.scrollY > scrollThreshold) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }

    window.addEventListener('scroll', checkScroll, { passive: true });
    checkScroll();
  }

  /* ========== BURGER MENU ========== */
  function initBurger() {
    var burger = document.querySelector('.burger-menu');
    var navLinks = document.querySelector('.nav-links');
    if (!burger || !navLinks) return;

    burger.addEventListener('click', function (e) {
      e.stopPropagation();
      burger.classList.toggle('open');
      navLinks.classList.toggle('open');
    });

    // Close on link click
    navLinks.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        burger.classList.remove('open');
        navLinks.classList.remove('open');
      });
    });

    // Close on outside click
    document.addEventListener('click', function (e) {
      if (!burger.contains(e.target) && !navLinks.contains(e.target)) {
        burger.classList.remove('open');
        navLinks.classList.remove('open');
      }
    });
  }

  /* ========== SCROLL SPY ========== */
  function initScrollSpy() {
    var sections = document.querySelectorAll('section[id]');
    var navLinks = document.querySelectorAll('.nav-link');
    if (!sections.length || !navLinks.length) return;

    function updateActive() {
      var scrollPos = window.scrollY + 150;

      var currentId = '';
      sections.forEach(function (section) {
        if (section.offsetTop <= scrollPos) {
          currentId = section.id;
        }
      });

      navLinks.forEach(function (link) {
        link.classList.remove('active');
        if (link.getAttribute('href') === '#' + currentId) {
          link.classList.add('active');
        }
      });
    }

    window.addEventListener('scroll', updateActive, { passive: true });
    updateActive();
  }

  /* ========== SMOOTH SCROLL (for anchor links, fallback if no Lenis) ========== */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        var targetId = this.getAttribute('href');
        if (targetId === '#') return;
        var target = document.querySelector(targetId);
        if (!target) return;

        e.preventDefault();

        // Use Lenis if available
        if (window._lenis) {
          window._lenis.scrollTo(target, { offset: -60 });
        } else {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  }

  /* ========== PROJECT BACK BUTTON ========== */
  function initProjectBackButton() {
    var backButtons = document.querySelectorAll('[data-project-back]');
    if (!backButtons.length) return;

    function update() {
      var doc = document.documentElement;
      var scrollTop = window.scrollY || doc.scrollTop || 0;
      var maxScroll = Math.max(doc.scrollHeight - window.innerHeight, 0);
      var expanded = maxScroll > 0 && scrollTop >= (maxScroll - 140);

      backButtons.forEach(function (button) {
        button.classList.toggle('is-expanded', expanded);
      });
    }

    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    window.addEventListener('load', update);
    update();
  }

  /* ========== INIT ========== */
  function init() {
    initHeader();
    initBurger();
    initScrollSpy();
    initSmoothScroll();
    initProjectBackButton();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
