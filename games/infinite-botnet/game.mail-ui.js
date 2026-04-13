/* ==================================================
   Infinite BotNet Mail UI Helpers
   Mail rendering helpers extracted from game.js
   ================================================== */

(function () {
  'use strict';

  function isNegativeEntry(entry) {
    if (!entry) return false;

    var rewardType = String(entry.rewardType || '').toLowerCase();
    if (rewardType === 'heat-gain' || rewardType.indexOf('loss') !== -1) {
      return true;
    }

    var rewardLabel = String(entry.rewardLabel || entry.reward || '').trim();
    return rewardLabel.indexOf('-') === 0;
  }

  function renderQueue(targetNode, entries, startIndex) {
    if (!targetNode) return;

    while (targetNode.firstChild) {
      targetNode.removeChild(targetNode.firstChild);
    }

    var list = Array.isArray(entries) ? entries : [];
    targetNode.hidden = list.length === 0;
    if (!list.length) return;

    var baseIndex = Math.max(1, Number(startIndex) || 1);

    list.forEach(function (entry, index) {
      var item = document.createElement('li');
      item.className = 'mail-queue__item';

      var negative = isNegativeEntry(entry);
      if (negative) item.classList.add('is-negative');

      var head = document.createElement('div');
      head.className = 'mail-queue__head';

      var subject = document.createElement('p');
      subject.className = 'mail-queue__subject';
      subject.textContent = '#' + String(baseIndex + index) + ' ' + String(entry.subject || 'Intercepted relay packet');

      var reward = document.createElement('span');
      reward.className = 'mail-queue__reward';
      if (negative) reward.classList.add('is-negative');
      reward.textContent = String(entry.rewardLabel || entry.reward || '-');

      head.appendChild(subject);
      head.appendChild(reward);

      var body = document.createElement('p');
      body.className = 'mail-queue__body';
      body.textContent = String(entry.body || '');

      item.appendChild(head);
      item.appendChild(body);
      targetNode.appendChild(item);
    });
  }

  window.BotnetMailUI = {
    isNegativeEntry: isNegativeEntry,
    renderQueue: renderQueue
  };
})();
