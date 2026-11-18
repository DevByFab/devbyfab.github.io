/* ============================================
   i18n — Multilingual System with Modern Dropdown
   Auto-detects FR & PT in priority, EN fallback.
   ============================================ */

(function () {
  'use strict';

  var STORAGE_KEY = 'devbyfab:lang';
  var SUPPORTED = ['FR', 'PT', 'EN'];
  var currentLang = 'FR';
  var translationsCache = {};
  var booted = false;

  /* --- Detect initial language --- */
  function detectLang() {
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved && SUPPORTED.indexOf(saved.toUpperCase()) !== -1) {
        return saved.toUpperCase();
      }
    } catch (_) {}

    var nav = (navigator.language || navigator.userLanguage || '').toLowerCase();
    if (nav.startsWith('pt')) return 'PT';
    if (nav.startsWith('fr')) return 'FR';
    return 'EN';
  }

  function langToFile(lang) {
    var map = { FR: 'fr', PT: 'pt', EN: 'en' };
    return map[lang] || 'fr';
  }

  /* --- Load translations --- */
  async function loadTranslations(lang) {
    var file = langToFile(lang);
    if (translationsCache[file]) {
      return translationsCache[file];
    }

    var basePathMeta = document.querySelector('meta[name="i18n-base"]');
    var base = basePathMeta ? basePathMeta.content : 'i18n';
    var url = base + '/' + file + '.json';

    var resp = await fetch(url);
    if (!resp.ok) {
      throw new Error('i18n: Could not load ' + url);
    }
    var data = await resp.json();
    translationsCache[file] = data;
    return data;
  }

  /* --- Apply to DOM --- */
  function applyTranslations(data) {
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (data[key] !== undefined) {
        el.textContent = data[key];
      }
    });

    document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-html');
      if (data[key] !== undefined) {
        el.innerHTML = data[key];
      }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-placeholder');
      if (data[key] !== undefined) {
        el.placeholder = data[key];
      }
    });

    document.querySelectorAll('[data-i18n-alt]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-alt');
      if (data[key] !== undefined) el.setAttribute('alt', data[key]);
    });

    document.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-aria');
      if (data[key] !== undefined) el.setAttribute('aria-label', data[key]);
    });

    // Titre et description de la page (uniquement si la page le demande)
    if (document.documentElement.hasAttribute('data-i18n-meta')) {
      if (data['meta.title']) document.title = data['meta.title'];
      var desc = document.querySelector('meta[name="description"]');
      if (desc && data['meta.description']) desc.setAttribute('content', data['meta.description']);
      var ogT = document.querySelector('meta[property="og:title"]');
      if (ogT && data['meta.title']) ogT.setAttribute('content', data['meta.title']);
      var ogD = document.querySelector('meta[property="og:description"]');
      if (ogD && data['meta.description']) ogD.setAttribute('content', data['meta.description']);
    }

    document.querySelectorAll('[data-i18n-title]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-title');
      if (data[key] !== undefined) {
        el.setAttribute('title', data[key]);
      }
    });

    var langMap = { FR: 'fr', PT: 'pt', EN: 'en' };
    document.documentElement.lang = langMap[currentLang] || 'fr';

    // Update dropdown UI
    updateDropdownUI();

    window.dispatchEvent(new CustomEvent('langchange', { detail: { lang: currentLang, data: data } }));
  }

  function updateDropdownUI() {
    var currentLabel = document.getElementById('lang-current-label');
    if (currentLabel) {
      currentLabel.textContent = currentLang;
    }

    document.querySelectorAll('[data-lang-val]').forEach(function (item) {
      var val = item.getAttribute('data-lang-val').toUpperCase();
      var isActive = val === currentLang;
      item.classList.toggle('active', isActive);
      item.setAttribute('aria-checked', isActive ? 'true' : 'false');
    });
  }

  /* --- Switch Language --- */
  async function setLang(lang, persist) {
    if (SUPPORTED.indexOf(lang.toUpperCase()) === -1) return;
    currentLang = lang.toUpperCase();

    if (persist) {
      try {
        localStorage.setItem(STORAGE_KEY, currentLang);
      } catch (_) {}
    }

    // Le HTML contient déjà cette langue : rien à charger, pas de flash.
    var inline = document.documentElement.getAttribute('data-i18n-inline');
    if (!booted && inline && inline.toUpperCase() === currentLang) {
      document.documentElement.lang = inline.toLowerCase();
      updateDropdownUI();
      return;
    }

    try {
      var translations = await loadTranslations(currentLang);
      applyTranslations(translations);
    } catch (err) {
      console.error('i18n translation error:', err);
    }
  }

  /* --- Setup Smooth Dropdown Interactions --- */
  function initDropdown() {
    var dropdown = document.getElementById('lang-dropdown');
    var trigger = document.getElementById('lang-dropdown-trigger');
    if (!dropdown || !trigger) return;

    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      var isOpen = dropdown.classList.toggle('open');
      trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    dropdown.querySelectorAll('[data-lang-val]').forEach(function (item) {
      item.addEventListener('click', function (e) {
        e.stopPropagation();
        var targetLang = item.getAttribute('data-lang-val');
        if (targetLang) {
          setLang(targetLang, true);
        }
        dropdown.classList.remove('open');
        trigger.setAttribute('aria-expanded', 'false');
      });
    });

    // Close on outside click
    document.addEventListener('click', function (e) {
      if (!dropdown.contains(e.target)) {
        dropdown.classList.remove('open');
        trigger.setAttribute('aria-expanded', 'false');
      }
    });

    // Close on Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && dropdown.classList.contains('open')) {
        dropdown.classList.remove('open');
        trigger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  function init() {
    var detected = detectLang();
    setLang(detected, false);
    booted = true;
    initDropdown();
  }

  window.devbyfabI18n = {
    setLang: setLang,
    getLang: function () { return currentLang; },
    detectLang: detectLang
  };

  window.i18n = window.devbyfabI18n;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
