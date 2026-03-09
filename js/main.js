/* ============================================
   MAIN — Burger Menu, Carousel 3D, Footer Reveal
   ============================================ */

(function () {
  'use strict';

  /* ========== BURGER MENU ========== */
  function initBurger() {
    var burger = document.querySelector('.burger-menu');
    var navUl = document.querySelector('.nav-center ul');
    if (!burger || !navUl) return;

    burger.addEventListener('click', function () {
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

  /* ========== CAROUSEL 3D (services page) ========== */
  function initCarousel() {
    var cards = document.querySelectorAll('.carousel-card');
    if (!cards.length) return;

    var total = cards.length;
    var current = 0;

    function updateCarousel() {
      cards.forEach(function (card, i) {
        card.classList.remove('active', 'left', 'right');
        if (i === current) {
          card.classList.add('active');
        } else if (i === (current - 1 + total) % total) {
          card.classList.add('left');
        } else if (i === (current + 1) % total) {
          card.classList.add('right');
        }
      });
    }

    function next() {
      current = (current + 1) % total;
      updateCarousel();
    }
    function prev() {
      current = (current - 1 + total) % total;
      updateCarousel();
    }

    // Desktop arrows
    var arrowL = document.querySelector('.carousel-arrow-left');
    var arrowR = document.querySelector('.carousel-arrow-right');
    if (arrowL) arrowL.addEventListener('click', prev);
    if (arrowR) arrowR.addEventListener('click', next);

    // Mobile arrows
    var mobileL = document.getElementById('carousel-arrow-mobile-left');
    var mobileR = document.getElementById('carousel-arrow-mobile-right');
    if (mobileL) mobileL.addEventListener('click', prev);
    if (mobileR) mobileR.addEventListener('click', next);

    // Swipe support
    var track = document.querySelector('.carousel-track');
    if (track) {
      var startX = 0;
      track.addEventListener('touchstart', function (e) {
        startX = e.changedTouches[0].clientX;
      }, { passive: true });
      track.addEventListener('touchend', function (e) {
        var diff = e.changedTouches[0].clientX - startX;
        if (Math.abs(diff) > 40) {
          diff > 0 ? prev() : next();
        }
      }, { passive: true });
    }

    // Keyboard arrows
    document.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    });

    updateCarousel();
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
    checkFooter();
  }

  /* ========== INIT ========== */
  function init() {
    initBurger();
    initCarousel();
    initFooter();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
