/* ============================================
   i18n — Auto-detection & Translation System
   Détecte la langue du navigateur :
     fr* → FR | pt* → PT | * → EN
   Charge le JSON correspondant depuis /i18n/
   Applique via data-i18n / data-i18n-html
   ============================================ */

(function () {
  'use strict';

  const SUPPORTED = ['FR', 'EN', 'PT'];
  const STORAGE_KEY = 'devbyfab-lang';
  let currentLang = null;
  let translations = {};

  /* --- Detect language --- */
  function detectLang() {
    // 1. Stored preference
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED.includes(stored)) return stored;

    // 2. Browser language
    const nav = (navigator.language || navigator.userLanguage || '').toLowerCase();
    if (nav.startsWith('fr')) return 'FR';
    if (nav.startsWith('pt')) return 'PT';
    return 'EN';
  }

  /* --- Load JSON --- */
  function langToFile(lang) {
    const map = { FR: 'fr', EN: 'en', PT: 'pt' };
    return map[lang] || 'en';
  }

  async function loadTranslations(lang) {
    const file = langToFile(lang);
    const basePath = document.querySelector('meta[name="i18n-base"]');
    const base = basePath ? basePath.content : 'i18n';
    const resp = await fetch(base + '/' + file + '.json');
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

  /* --- Render dynamic lists (services cards, about skills, etc.) --- */
  function renderDynamicContent(data) {
    // --- Service cards (carousel) ---
    var cardsData = data['services.cards'];
    if (cardsData && Array.isArray(cardsData)) {
      document.querySelectorAll('.carousel-card').forEach(function (card, i) {
        if (!cardsData[i]) return;
        var titleEl = card.querySelector('.service-title');
        var h2El = card.querySelector('h2');
        var pEl = card.querySelector('p');
        var btnEl = card.querySelector('.btn');
        if (titleEl) titleEl.textContent = cardsData[i].title;
        if (h2El) h2El.textContent = cardsData[i].h2;
        if (pEl) pEl.textContent = cardsData[i].desc;
        if (btnEl) btnEl.textContent = cardsData[i].btn;
      });
    }

    // --- Contact list items ---
    var ul1 = data['contact.ul1'];
    if (ul1 && Array.isArray(ul1)) {
      var ulEl = document.querySelector('.custom-bot-desc ul');
      if (ulEl) {
        ulEl.innerHTML = '';
        ul1.forEach(function (txt) {
          var li = document.createElement('li');
          li.textContent = txt;
          ulEl.appendChild(li);
        });
      }
    }

    var ol1 = data['contact.ol1'];
    if (ol1 && Array.isArray(ol1)) {
      var olEl = document.querySelector('.custom-bot-desc ol');
      if (olEl) {
        olEl.innerHTML = '';
        ol1.forEach(function (txt) {
          var li = document.createElement('li');
          li.innerHTML = txt;
          olEl.appendChild(li);
        });
      }
    }

    // --- About page skills list ---
    var skillsList = data['about.skillsList'];
    if (skillsList && Array.isArray(skillsList)) {
      var skillsEl = document.querySelector('.skills-list');
      if (skillsEl) {
        var iconClasses = ['python', 'html', 'css', 'js', 'sqlite', 'mysql'];
        skillsEl.innerHTML = '';
        skillsList.forEach(function (skill, i) {
          var li = document.createElement('li');
          var span = document.createElement('span');
          span.className = 'icon-skill ' + (iconClasses[i] || '');
          li.appendChild(span);
          li.appendChild(document.createTextNode(skill));
          skillsEl.appendChild(li);
        });
      }
    }

    // --- About style list ---
    var styleList = data['about.styleList'];
    if (styleList && Array.isArray(styleList)) {
      var styleBlock = document.querySelectorAll('.about-block.about-left')[1];
      if (styleBlock) {
        var ul = styleBlock.querySelector('ul');
        if (ul) {
          ul.innerHTML = '';
          styleList.forEach(function (item) {
            var li = document.createElement('li');
            li.textContent = item;
            ul.appendChild(li);
          });
        }
      }
    }

    // --- About goals list ---
    var goalsList = data['about.goalsList'];
    if (goalsList && Array.isArray(goalsList)) {
      var goalsBlocks = document.querySelectorAll('.about-block.about-right');
      var goalsBlock = goalsBlocks.length > 1 ? goalsBlocks[1] : null;
      if (goalsBlock) {
        var ul = goalsBlock.querySelector('ul:not(.skills-list)');
        if (ul) {
          ul.innerHTML = '';
          goalsList.forEach(function (item) {
            var li = document.createElement('li');
            li.textContent = item;
            ul.appendChild(li);
          });
        }
      }
    }
  }

  /* --- Init --- */
  async function setLang(lang) {
    currentLang = lang;
    localStorage.setItem(STORAGE_KEY, lang);
    try {
      translations = await loadTranslations(lang);
      applyTranslations(translations);
      renderDynamicContent(translations);
    } catch (e) {
      console.error('i18n error:', e);
    }

    // Sync select
    var sel = document.getElementById('lang-select');
    if (sel) sel.value = lang;
  }

  function init() {
    var lang = detectLang();

    // Bind language selector
    var sel = document.getElementById('lang-select');
    if (sel) {
      sel.value = lang;
      sel.addEventListener('change', function () {
        setLang(this.value);
      });
    }

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
