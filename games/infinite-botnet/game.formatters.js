/* ==================================================
   Infinite BotNet Shared Formatters
   Numeric helpers extracted from game.js
   ================================================== */

(function () {
  'use strict';

  function bigIntFrom(raw) {
    try {
      return BigInt(raw || '0');
    } catch (_) {
      return 0n;
    }
  }

  function formatBig(raw) {
    var value = bigIntFrom(raw);
    var negative = value < 0n;
    if (negative) value = -value;

    var s = value.toString();
    var group = Math.floor((s.length - 1) / 3);
    var suffix = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'De'];
    var out = s;

    if (group > 0 && group < suffix.length) {
      var pivot = s.length - group * 3;
      var head = s.slice(0, pivot);
      var decimal = s.slice(pivot, pivot + 2).replace(/0+$/, '');
      out = head + (decimal ? '.' + decimal : '') + suffix[group];
    } else if (group >= suffix.length) {
      var m = s.slice(0, 3).replace(/0+$/, '');
      var mantissa = m.length > 1 ? m[0] + '.' + m.slice(1) : m;
      out = mantissa + 'e' + (s.length - 1);
    }

    return negative ? '-' + out : out;
  }

  function formatPerSecond(raw) {
    return formatBig(raw) + '/s';
  }

  function clamp01(value) {
    var numeric = Number(value);
    if (!Number.isFinite(numeric)) return 0;
    if (numeric < 0) return 0;
    if (numeric > 1) return 1;
    return numeric;
  }

  function clampRange(value, minValue, maxValue) {
    if (value < minValue) return minValue;
    if (value > maxValue) return maxValue;
    return value;
  }

  window.BotnetFormatters = {
    bigIntFrom: bigIntFrom,
    formatBig: formatBig,
    formatPerSecond: formatPerSecond,
    clamp01: clamp01,
    clampRange: clampRange
  };
})();
