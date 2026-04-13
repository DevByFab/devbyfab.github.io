/* ==================================================
   Infinite BotNet Tutorial Controller
   Guided spotlight tutorial extracted from game.js
   ================================================== */

(function () {
  'use strict';

  function clamp(value, minValue, maxValue) {
    if (value < minValue) return minValue;
    if (value > maxValue) return maxValue;
    return value;
  }

  function getTemplateText(templateId, fallback) {
    if (!templateId) return fallback;

    var node = document.getElementById(templateId);
    if (node && node.textContent) return node.textContent;

    return fallback;
  }

  function getTemplateList(templateId) {
    var raw = getTemplateText(templateId, '');
    if (!raw) return [];

    return raw
      .split('|')
      .map(function (part) {
        return String(part || '').trim();
      })
      .filter(function (part) {
        return part.length > 0;
      });
  }

  function createTutorialManager(options) {
    options = options || {};

    var storageKey = String(options.storageKey || 'infiniteBotnet.tutorialSeen.v1');
    var setView = typeof options.setView === 'function' ? options.setView : function () {};
    var playClick = typeof options.playClick === 'function' ? options.playClick : function () {};
    var setSettingsOpen = typeof options.setSettingsOpen === 'function' ? options.setSettingsOpen : function () {};

    var elements = options.elements || {};
    var templates = options.templates || {};
    var steps = Array.isArray(options.steps) ? options.steps.slice() : [];

    var state = {
      seen: false,
      open: false,
      step: 0,
      highlightedTarget: null
    };

    var controlsBound = false;
    var viewportBound = false;
    var frameId = 0;
    var settleTimer = null;

    function loadSeen() {
      try {
        return localStorage.getItem(storageKey) === '1';
      } catch (_) {
        return false;
      }
    }

    function saveSeen(seen) {
      try {
        if (seen) {
          localStorage.setItem(storageKey, '1');
        } else {
          localStorage.removeItem(storageKey);
        }
      } catch (_) {
        // Ignore storage failures silently.
      }
    }

    function getCurrentStep() {
      if (!steps.length) return null;

      state.step = clamp(state.step, 0, steps.length - 1);
      return steps[state.step];
    }

    function clearHighlightedTarget() {
      if (state.highlightedTarget) {
        state.highlightedTarget.classList.remove('is-tutorial-focus');
        state.highlightedTarget = null;
      }
    }

    function setSpotlight(target) {
      if (!elements.overlay) return;

      if (!target) {
        elements.overlay.style.setProperty('--spot-left', 'calc(50vw - 120px)');
        elements.overlay.style.setProperty('--spot-top', 'calc(50vh - 76px)');
        elements.overlay.style.setProperty('--spot-width', '240px');
        elements.overlay.style.setProperty('--spot-height', '152px');
        return;
      }

      var rect = target.getBoundingClientRect();
      var pad = 12;

      var left = clamp(Math.round(rect.left - pad), 6, Math.max(6, window.innerWidth - 24));
      var top = clamp(Math.round(rect.top - pad), 6, Math.max(6, window.innerHeight - 24));
      var width = clamp(Math.round(rect.width + pad * 2), 86, Math.max(86, window.innerWidth - left - 6));
      var height = clamp(Math.round(rect.height + pad * 2), 60, Math.max(60, window.innerHeight - top - 6));

      elements.overlay.style.setProperty('--spot-left', String(left) + 'px');
      elements.overlay.style.setProperty('--spot-top', String(top) + 'px');
      elements.overlay.style.setProperty('--spot-width', String(width) + 'px');
      elements.overlay.style.setProperty('--spot-height', String(height) + 'px');
    }

    function setCardPosition(target) {
      if (!elements.overlay || !elements.modal) return;

      if (!target) {
        var centeredLeft = Math.max(12, Math.round((window.innerWidth - elements.modal.offsetWidth) / 2));
        var centeredTop = Math.max(12, Math.round((window.innerHeight - elements.modal.offsetHeight) / 2));
        elements.overlay.style.setProperty('--card-left', String(centeredLeft) + 'px');
        elements.overlay.style.setProperty('--card-top', String(centeredTop) + 'px');
        return;
      }

      var rect = target.getBoundingClientRect();
      var modalRect = elements.modal.getBoundingClientRect();
      var gap = 14;
      var viewportPad = 12;

      var left = Math.round(rect.left + rect.width / 2 - modalRect.width / 2);
      left = clamp(left, viewportPad, Math.max(viewportPad, window.innerWidth - modalRect.width - viewportPad));

      var belowTop = Math.round(rect.bottom + gap);
      var aboveTop = Math.round(rect.top - modalRect.height - gap);
      var top = belowTop;

      if (belowTop + modalRect.height > window.innerHeight - viewportPad) {
        top = aboveTop;
      }

      if (top < viewportPad) {
        top = viewportPad;
      }

      if (top + modalRect.height > window.innerHeight - viewportPad) {
        top = Math.max(viewportPad, window.innerHeight - modalRect.height - viewportPad);
      }

      elements.overlay.style.setProperty('--card-left', String(left) + 'px');
      elements.overlay.style.setProperty('--card-top', String(top) + 'px');
    }

    function focusCurrentStepTarget() {
      if (!state.open) return;

      var step = getCurrentStep();
      var target = step && step.targetSelector ? document.querySelector(step.targetSelector) : null;

      clearHighlightedTarget();

      if (target) {
        target.classList.add('is-tutorial-focus');
        state.highlightedTarget = target;

        if (typeof target.scrollIntoView === 'function') {
          try {
            target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
          } catch (_) {
            target.scrollIntoView();
          }
        }
      }

      setSpotlight(target);
      setCardPosition(target);
    }

    function scheduleFocusRefresh() {
      if (!state.open) return;

      if (frameId) {
        window.cancelAnimationFrame(frameId);
        frameId = 0;
      }

      if (settleTimer) {
        window.clearTimeout(settleTimer);
        settleTimer = null;
      }

      frameId = window.requestAnimationFrame(function () {
        frameId = 0;
        focusCurrentStepTarget();
      });

      settleTimer = window.setTimeout(function () {
        settleTimer = null;
        focusCurrentStepTarget();
      }, 260);
    }

    function render() {
      if (!elements.overlay || !elements.modal || !elements.title || !elements.body || !elements.progress || !elements.nextButton) {
        return;
      }

      var step = getCurrentStep();
      if (!step) {
        close(true);
        return;
      }

      if (step.viewId) {
        setView(step.viewId);
      }

      elements.title.textContent = getTemplateText(step.titleId, 'Tutorial');
      elements.body.textContent = getTemplateText(step.bodyId, '');
      elements.progress.textContent = String(state.step + 1) + ' / ' + String(steps.length);

      if (elements.focus) {
        elements.focus.textContent = getTemplateText(step.focusId, getTemplateText(step.titleId, 'Focus'));
      }

      if (elements.action) {
        elements.action.textContent = getTemplateText(step.actionId, getTemplateText(step.bodyId, ''));
      }

      if (elements.checklist) {
        while (elements.checklist.firstChild) {
          elements.checklist.removeChild(elements.checklist.firstChild);
        }

        var checklistItems = getTemplateList(step.checklistId);
        elements.checklist.hidden = checklistItems.length === 0;

        checklistItems.forEach(function (line) {
          var item = document.createElement('li');
          item.textContent = line;
          elements.checklist.appendChild(item);
        });
      }

      if (elements.prevButton) {
        elements.prevButton.disabled = state.step <= 0;
      }

      if (state.step >= steps.length - 1) {
        elements.nextButton.textContent = getTemplateText(templates.finish, 'Finish');
      } else {
        elements.nextButton.textContent = getTemplateText(templates.next, 'Next');
      }

      scheduleFocusRefresh();
    }

    function open(fromStart) {
      if (!elements.overlay || !elements.modal) return;

      if (fromStart) {
        state.step = 0;
      }

      state.open = true;
      elements.overlay.hidden = false;
      if (document.body) {
        document.body.classList.add('is-tutorial-open');
      }
      render();
    }

    function close(markSeen) {
      if (!elements.overlay) return;

      state.open = false;
      elements.overlay.hidden = true;
      clearHighlightedTarget();
      if (document.body) {
        document.body.classList.remove('is-tutorial-open');
      }

      if (markSeen) {
        state.seen = true;
        saveSeen(true);
      }
    }

    function nextStep() {
      if (state.step >= steps.length - 1) {
        close(true);
        return;
      }

      state.step += 1;
      render();
    }

    function previousStep() {
      if (state.step <= 0) {
        state.step = 0;
        render();
        return;
      }

      state.step -= 1;
      render();
    }

    function reset() {
      state.seen = false;
      state.step = 0;
      saveSeen(false);
      close(false);
    }

    function isOpen() {
      return state.open;
    }

    function bindControls() {
      if (controlsBound) return;
      controlsBound = true;

      if (elements.helpButton) {
        elements.helpButton.addEventListener('click', function () {
          playClick();
          setSettingsOpen(false);
          open(true);
        });
      }

      if (elements.replayButton) {
        elements.replayButton.addEventListener('click', function () {
          playClick();
          setSettingsOpen(false);
          open(true);
        });
      }

      if (elements.prevButton) {
        elements.prevButton.addEventListener('click', function () {
          playClick();
          previousStep();
        });
      }

      if (elements.skipButton) {
        elements.skipButton.addEventListener('click', function () {
          playClick();
          close(true);
        });
      }

      if (elements.nextButton) {
        elements.nextButton.addEventListener('click', function () {
          playClick();
          if (state.step >= steps.length - 1) {
            close(true);
            return;
          }
          nextStep();
        });
      }

      if (elements.overlay) {
        elements.overlay.addEventListener('click', function (event) {
          if (event.target === elements.overlay) {
            close(true);
          }
        });
      }

      document.addEventListener('keydown', function (event) {
        if (!state.open) return;

        if (event.key === 'Escape') {
          close(true);
          return;
        }

        if (event.key === 'ArrowLeft') {
          event.preventDefault();
          previousStep();
          return;
        }

        if (event.key === 'ArrowRight' || event.key === 'Enter') {
          event.preventDefault();
          nextStep();
        }
      });
    }

    function bindViewportListeners() {
      if (viewportBound) return;
      viewportBound = true;

      var onViewportMove = function () {
        if (!state.open) return;
        scheduleFocusRefresh();
      };

      window.addEventListener('resize', onViewportMove);
      window.addEventListener('scroll', onViewportMove, true);
    }

    function init() {
      state.seen = loadSeen();
      bindControls();
      bindViewportListeners();

      if (!state.seen) {
        window.setTimeout(function () {
          if (!state.seen) {
            open(true);
          }
        }, 220);
      }
    }

    return {
      init: init,
      open: open,
      close: close,
      reset: reset,
      isOpen: isOpen
    };
  }

  window.BotnetTutorial = {
    create: createTutorialManager
  };
})();
