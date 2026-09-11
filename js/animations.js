/* ============================================
   ANIMATIONS — GSAP ScrollTrigger + Lenis
   DevByFab Portfolio — Premium & Eco-Aware
   ============================================ */
(function () {
  'use strict';

  var lenis = null;

  function isTurbo() {
    return document.documentElement.getAttribute('data-perf') !== 'eco';
  }

  function initHero() {
    if (typeof gsap === 'undefined' || !isTurbo()) return;
    var heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    heroTl
      .fromTo('.hero-status-pill', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.8, delay: 0.15 })
      .fromTo('.hero-title', { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.95 }, '-=0.6')
      .fromTo('.hero-role', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8 }, '-=0.65')
      .fromTo('.hero-desc', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8 }, '-=0.55')
      .fromTo('.hero-meta-row', { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.7 }, '-=0.5')
      .fromTo('.hero-actions', { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.7 }, '-=0.45');
  }

  function initScrollAnimations() {
    if (typeof gsap === 'undefined') return;

    if (!isTurbo()) {
      document.querySelectorAll('[data-anim="fade-up"], [data-anim="stagger"] [data-anim-child], .section-title').forEach(function (el) {
        gsap.set(el, { clearProps: 'all', opacity: 1, y: 0, scale: 1 });
      });
      return;
    }

    if (typeof ScrollTrigger !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);

      /* Lenis Smooth Inertia Scroll */
      if (typeof Lenis !== 'undefined' && !lenis) {
        lenis = new Lenis({
          lerp: 0.1,
          smoothWheel: true,
          wheelMultiplier: 1.0,
          touchMultiplier: 1.5
        });
        gsap.ticker.add(function (time) {
          if (lenis) lenis.raf(time * 1000);
        });
        gsap.ticker.lagSmoothing(0);
        lenis.on('scroll', ScrollTrigger.update);
        window._lenis = lenis;
      }

      /* ScrollTrigger: fade-up */
      document.querySelectorAll('[data-anim="fade-up"]').forEach(function (el) {
        gsap.fromTo(el, { opacity: 0, y: 35 }, {
          opacity: 1, y: 0, duration: 0.85, ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' }
        });
      });

      /* ScrollTrigger: stagger grids */
      document.querySelectorAll('[data-anim="stagger"]').forEach(function (parent) {
        var children = parent.querySelectorAll('[data-anim-child]');
        if (!children.length) return;
        gsap.fromTo(children, { opacity: 0, y: 30 }, {
          opacity: 1, y: 0, duration: 0.75, stagger: 0.12, ease: 'power2.out',
          scrollTrigger: { trigger: parent, start: 'top 86%', toggleActions: 'play none none none' }
        });
      });

      /* ScrollTrigger: hero parallax scrub */
      var heroContent = document.querySelector('.hero-content');
      if (heroContent) {
        gsap.to(heroContent, {
          y: -60, opacity: 0.35, ease: 'none',
          scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true }
        });
      }

      /* ScrollTrigger: section titles */
      document.querySelectorAll('.section-title').forEach(function (title) {
        gsap.fromTo(title, { scale: 0.96, opacity: 0 }, {
          scale: 1, opacity: 1, duration: 0.75, ease: 'power2.out',
          scrollTrigger: { trigger: title, start: 'top 90%', toggleActions: 'play none none none' }
        });
      });

      /* Page Hero (subpages) */
      var pageHero = document.querySelector('.page-hero');
      if (pageHero && pageHero.children.length) {
        gsap.fromTo(pageHero.children, { opacity: 0, y: 22 }, {
          opacity: 1, y: 0, duration: 0.8, stagger: 0.14, ease: 'power2.out', delay: 0.15
        });
      }
    }
  }

  function destroyAnimations() {
    if (lenis) {
      lenis.destroy();
      lenis = null;
      window._lenis = null;
    }
    if (typeof ScrollTrigger !== 'undefined') {
      ScrollTrigger.getAll().forEach(function (t) { t.kill(); });
    }
    if (typeof gsap !== 'undefined') {
      document.querySelectorAll('[data-anim="fade-up"], [data-anim="stagger"] [data-anim-child], .section-title, .hero-content').forEach(function (el) {
        gsap.set(el, { clearProps: 'all', opacity: 1, y: 0, scale: 1 });
      });
    }
  }

  function init() {
    if (isTurbo()) {
      initHero();
      initScrollAnimations();
    } else {
      destroyAnimations();
    }
  }

  window.addEventListener('perftierchange', function (e) {
    if (e.detail && e.detail.tier === 'eco') {
      destroyAnimations();
    } else {
      init();
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
