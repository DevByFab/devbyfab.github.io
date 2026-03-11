/* ============================================
   ANIMATIONS — GSAP ScrollTrigger + Lenis
   Smooth scroll, bidirectional scroll animations
   ============================================ */

(function () {
  'use strict';

  // Wait for GSAP and Lenis to be available
  if (typeof gsap === 'undefined' || typeof Lenis === 'undefined') return;

  gsap.registerPlugin(ScrollTrigger);

  /* ========== LENIS SMOOTH SCROLL ========== */
  var lenis = new Lenis({
    lerp: 0.12,
    smoothWheel: true,
    wheelMultiplier: 1.0
  });

  // Connect Lenis to GSAP ticker
  gsap.ticker.add(function (time) {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  // Tell ScrollTrigger to use Lenis
  lenis.on('scroll', ScrollTrigger.update);

  /* ========== HERO ENTRANCE ========== */
  var heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });

  heroTl
    .to('.hero-title', {
      opacity: 1,
      y: 0,
      duration: 1.2,
      delay: 0.3
    })
    .to('.hero-subtitle', {
      opacity: 1,
      y: 0,
      duration: 0.9
    }, '-=0.7')
    .to('.hero-tagline', {
      opacity: 1,
      y: 0,
      duration: 0.9
    }, '-=0.6')
    .to('.scroll-cta', {
      opacity: 1,
      y: 0,
      duration: 0.8
    }, '-=0.5');

  /* ========== SCROLL-TRIGGERED ANIMATIONS ========== */

  // Utility: animate elements with [data-anim="fade-up"]
  var fadeUpEls = document.querySelectorAll('[data-anim="fade-up"]');
  fadeUpEls.forEach(function (el) {
    // For elements near the bottom (contact section, etc.), use toggleActions
    // instead of scrub so the animation completes even if scroll range is short
    var isNearBottom = el.closest('.section--contact') !== null;
    gsap.fromTo(el,
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: isNearBottom ? 0.8 : 1,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 92%',
          toggleActions: 'play none none reverse'
        }
      }
    );
  });

  // Stagger children: [data-anim="stagger"] > [data-anim-child]
  var staggerParents = document.querySelectorAll('[data-anim="stagger"]');
  staggerParents.forEach(function (parent) {
    var children = parent.querySelectorAll('[data-anim-child]');
    gsap.fromTo(children,
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 0.7,
        stagger: 0.12,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: parent,
          start: 'top 90%',
          toggleActions: 'play none none reverse'
        }
      }
    );
  });

  // Hero parallax on scroll (move hero content up faster)
  var heroContent = document.querySelector('.hero-content');
  if (heroContent) {
    gsap.to(heroContent, {
      y: -80,
      opacity: 0.3,
      ease: 'none',
      scrollTrigger: {
        trigger: '#hero',
        start: 'top top',
        end: 'bottom top',
        scrub: true
      }
    });
  }

  // Section titles: slight scale animation
  var sectionTitles = document.querySelectorAll('.section-title');
  sectionTitles.forEach(function (title) {
    gsap.fromTo(title,
      { scale: 0.96, opacity: 0 },
      {
        scale: 1,
        opacity: 1,
        duration: 0.7,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: title,
          start: 'top 90%',
          toggleActions: 'play none none reverse'
        }
      }
    );
  });

  /* ========== PROJECT DETAIL PAGE ANIMATIONS ========== */
  // Animate page-hero on detail pages
  var pageHero = document.querySelector('.page-hero');
  if (pageHero) {
    gsap.fromTo(pageHero.children,
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: 'power2.out',
        delay: 0.2
      }
    );
  }

  /* ========== EXPOSE LENIS ========== */
  window._lenis = lenis;

})();
