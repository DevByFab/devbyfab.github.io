/* ==================================================
   Infinite BotNet Tutorial Bridge
   Bridge between game controller and tutorial manager
   ================================================== */

(function () {
  'use strict';

  function createTutorialBridge(options) {
    options = options || {};

    var controller = null;
    var storageKey = String(options.storageKey || 'infiniteBotnet.tutorialSeen.v1');
    var steps = Array.isArray(options.steps) ? options.steps.slice() : [];
    var elements = options.elements || {};
    var setView = typeof options.setView === 'function' ? options.setView : function () {};
    var playClick = typeof options.playClick === 'function' ? options.playClick : function () {};
    var setSettingsOpen = typeof options.setSettingsOpen === 'function' ? options.setSettingsOpen : function () {};

    function ensureController() {
      if (controller) return controller;
      if (!window.BotnetTutorial || typeof window.BotnetTutorial.create !== 'function') return null;

      controller = window.BotnetTutorial.create({
        storageKey: storageKey,
        setView: setView,
        playClick: playClick,
        setSettingsOpen: setSettingsOpen,
        elements: elements,
        templates: {
          next: 'tutorial-next-label-template',
          finish: 'tutorial-finish-label-template'
        },
        steps: steps
      });

      return controller;
    }

    function init() {
      var active = ensureController();
      if (!active || typeof active.init !== 'function') return;
      active.init();
    }

    function open(fromStart) {
      var active = ensureController();
      if (!active || typeof active.open !== 'function') return;
      active.open(Boolean(fromStart));
    }

    function close(markSeen) {
      var active = ensureController();
      if (!active || typeof active.close !== 'function') return;
      active.close(Boolean(markSeen));
    }

    function reset() {
      var active = ensureController();
      if (!active || typeof active.reset !== 'function') return;
      active.reset();
    }

    function isOpen() {
      var active = ensureController();
      if (!active || typeof active.isOpen !== 'function') return false;
      return active.isOpen();
    }

    return {
      init: init,
      open: open,
      close: close,
      reset: reset,
      isOpen: isOpen
    };
  }

  window.BotnetTutorialBridge = {
    create: createTutorialBridge
  };
})();
