/* ============================================
   ANIMATIONS — GSAP ScrollTrigger + Lenis
   DevByFab Portfolio — Compact & Optimized
   ============================================ */
(function () {
  'use strict';
  if (typeof gsap === 'undefined' || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
  if (typeof ScrollTrigger !== 'undefined') gsap.registerPlugin(ScrollTrigger);

  /* Lenis Smooth Scroll */
  var lenis = null;
  if (typeof Lenis !== 'undefined') {
    lenis = new Lenis({ lerp: 0.12, smoothWheel: true, wheelMultiplier: 1.0 });
    gsap.ticker.add(function (time) { if (lenis) lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
    if (typeof ScrollTrigger !== 'undefined') lenis.on('scroll', ScrollTrigger.update);
  }

  /* Hero Entrance */
  var heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  heroTl
    .fromTo('.hero-status-pill', { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.8, delay: 0.2 })
    .fromTo('.hero-title', { opacity: 0, y: 25 }, { opacity: 1, y: 0, duration: 1 }, '-=0.6')
    .fromTo('.hero-role', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8 }, '-=0.6')
    .fromTo('.hero-desc', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8 }, '-=0.5')
    .fromTo('.hero-meta-row', { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.7 }, '-=0.5')
    .fromTo('.hero-actions', { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.7 }, '-=0.4');

  /* ScrollTrigger Animations */
  if (typeof ScrollTrigger !== 'undefined') {
    document.querySelectorAll('[data-anim="fade-up"]').forEach(function (el) {
      gsap.fromTo(el, { opacity: 0, y: 35 }, {
        opacity: 1, y: 0, duration: 0.85, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 90%', toggleActions: 'play none none reverse' }
      });
    });

    document.querySelectorAll('[data-anim="stagger"]').forEach(function (parent) {
      gsap.fromTo(parent.querySelectorAll('[data-anim-child]'), { opacity: 0, y: 30 }, {
        opacity: 1, y: 0, duration: 0.7, stagger: 0.12, ease: 'power2.out',
        scrollTrigger: { trigger: parent, start: 'top 88%', toggleActions: 'play none none reverse' }
      });
    });

    var heroContent = document.querySelector('.hero-content');
    if (heroContent) {
      gsap.to(heroContent, {
        y: -60, opacity: 0.4, ease: 'none',
        scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true }
      });
    }

    document.querySelectorAll('.section-title').forEach(function (title) {
      gsap.fromTo(title, { scale: 0.97, opacity: 0 }, {
        scale: 1, opacity: 1, duration: 0.7, ease: 'power2.out',
        scrollTrigger: { trigger: title, start: 'top 92%', toggleActions: 'play none none reverse' }
      });
    });
  }

  var pageHero = document.querySelector('.page-hero');
  if (pageHero) {
    gsap.fromTo(pageHero.children, { opacity: 0, y: 20 }, {
      opacity: 1, y: 0, duration: 0.8, stagger: 0.15, ease: 'power2.out', delay: 0.2
    });
  }

  window._lenis = lenis;
})();
