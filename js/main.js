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

  /* ========== BOTNET ENDING SIGNAL (PORTFOLIO EASTER EGG) ========== */
  function initBotnetArchiveSignal() {
    var signalKey = 'infiniteBotnet.portfolioSignal.v1';
    var raw = localStorage.getItem(signalKey);
    if (!raw) return;

    var payload;
    try {
      payload = JSON.parse(raw);
    } catch (_) {
      return;
    }

    if (!payload || typeof payload !== 'object') return;

    var selected = typeof payload.selected === 'string' ? payload.selected : 'none';
    var triad = Boolean(payload.triadSigil);
    if (selected === 'none' && !triad) return;

    var body = document.body;
    if (!body) return;

    body.classList.add('botnet-ending-active');
    if (selected && selected !== 'none') {
      body.classList.add('botnet-ending-' + selected);
    }
    if (triad) {
      body.classList.add('botnet-ending-triad');
    }

    var lang = ((document.documentElement.getAttribute('lang') || navigator.language || 'en') + '').toLowerCase();
    var locale = 'en';
    if (lang.indexOf('fr') === 0) locale = 'fr';
    if (lang.indexOf('pt') === 0) locale = 'pt';

    var messages = {
      en: {
        ghost: 'Archive signal: Ghost Exit route imprinted. The portfolio remains partially cloaked.',
        overmind: 'Archive signal: Overmind route active. System aesthetics are being rewritten.',
        archivist: 'Archive signal: Archivist route active. Continuity protocol stabilizing the archive.',
        triad: 'Archive signal: Triad Sigil confirmed. All endings synced in one unstable timeline.'
      },
      fr: {
        ghost: 'Signal archive: route Sortie Fantome imprimee. Le portfolio reste partiellement masque.',
        overmind: 'Signal archive: route Overmind active. L esthetique du systeme est en reecriture.',
        archivist: 'Signal archive: route Archiviste active. Le protocole de continuite stabilise l archive.',
        triad: 'Signal archive: Sigil Triade confirme. Toutes les fins coexistent dans une timeline instable.'
      },
      pt: {
        ghost: 'Sinal de arquivo: rota Saida Fantasma gravada. O portfolio permanece parcialmente oculto.',
        overmind: 'Sinal de arquivo: rota Overmind ativa. A estetica do sistema esta a ser reescrita.',
        archivist: 'Sinal de arquivo: rota Archivista ativa. O protocolo de continuidade estabiliza o arquivo.',
        triad: 'Sinal de arquivo: Sigilo Triade confirmado. Todos os finais coexistem numa timeline instavel.'
      }
    };

    var dict = messages[locale] || messages.en;
    var message = triad ? dict.triad : (dict[selected] || dict.ghost);

    var existing = document.getElementById('botnet-archive-banner');
    if (existing) {
      existing.remove();
    }

    var banner = document.createElement('div');
    banner.id = 'botnet-archive-banner';
    banner.className = 'botnet-archive-banner';
    banner.textContent = message;

    var heroContent = document.querySelector('#hero .hero-content');
    if (heroContent) {
      heroContent.appendChild(banner);
    } else {
      document.body.insertBefore(banner, document.body.firstChild);
    }

    if (triad) {
      var tapCount = 0;
      banner.addEventListener('click', function () {
        tapCount += 1;
        if (tapCount < 5) return;
        tapCount = 0;
        body.classList.add('botnet-archive-glitch');
        setTimeout(function () {
          body.classList.remove('botnet-archive-glitch');
        }, 8000);
      });
    }
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
    initBotnetArchiveSignal();
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
