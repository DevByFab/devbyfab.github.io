/* ============================================
   i18n — Auto-detection & Translation System
   Detects browser language:
     fr* → FR | pt* → PT | * → EN (default)
   Loads the corresponding JSON from /i18n/
   Applies via data-i18n / data-i18n-html
   No visible language selector — fully automatic.
   ============================================ */

(function () {
  'use strict';

  var SUPPORTED = ['FR', 'EN', 'PT'];
  var currentLang = null;

  /* --- Detect language from browser --- */
  function detectLang() {
    var nav = (navigator.language || navigator.userLanguage || '').toLowerCase();
    if (nav.startsWith('fr')) return 'FR';
    if (nav.startsWith('pt')) return 'PT';
    return 'EN';
  }

  /* --- Load JSON --- */
  function langToFile(lang) {
    var map = { FR: 'fr', EN: 'en', PT: 'pt' };
    return map[lang] || 'en';
  }

  async function loadTranslations(lang) {
    var file = langToFile(lang);
    var basePath = document.querySelector('meta[name="i18n-base"]');
    var base = basePath ? basePath.content : 'i18n';
    var resp = await fetch(base + '/' + file + '.json');
    if (!resp.ok) throw new Error('i18n: could not load ' + file + '.json');
    return resp.json();
  }

  /* --- Apply translations to DOM --- */
  function applyTranslations(data) {
    // data-i18n="key" → textContent
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (data[key] !== undefined) el.textContent = data[key];
    });

    // data-i18n-html="key" → innerHTML (for legal, etc.)
    document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-html');
      if (data[key] !== undefined) el.innerHTML = data[key];
    });

    // data-i18n-placeholder="key"
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-placeholder');
      if (data[key] !== undefined) el.placeholder = data[key];
    });

    // Update <html lang>
    var langMap = { FR: 'fr', EN: 'en', PT: 'pt' };
    document.documentElement.lang = langMap[currentLang] || 'en';
  }

  /* --- Init --- */
  async function setLang(lang) {
    currentLang = lang;
    try {
      var translations = await loadTranslations(lang);
      applyTranslations(translations);
    } catch (e) {
      console.error('i18n error:', e);
    }
  }

  function init() {
    var lang = detectLang();
    setLang(lang);
  }

  // Expose for external use
  window.i18n = { setLang: setLang, detectLang: detectLang };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
