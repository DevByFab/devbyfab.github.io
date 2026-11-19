const SCALE_STEPS: Array<{ threshold: number; suffix: string }> = [
  { threshold: 1e15, suffix: 'Qa' },
  { threshold: 1e12, suffix: 'T' },
  { threshold: 1e9, suffix: 'B' },
  { threshold: 1e6, suffix: 'M' },
  { threshold: 1e3, suffix: 'K' },
];

/** Affiche un montant : entier jusqu'à 999, puis 1.5K, 2.34M, etc. Accepte aussi une chaîne (anciennes sauvegardes). */
export function formatBigValue(value: number | string): string {
  const parsed = typeof value === 'number' ? value : Number(value);
  const raw = Number.isFinite(parsed) ? Math.trunc(parsed) : 0;
  const absolute = Math.abs(raw);
  const sign = raw < 0 ? '-' : '';

  for (const step of SCALE_STEPS) {
    if (absolute >= step.threshold) {
      const scaled = Math.floor((absolute / step.threshold) * 100) / 100;
      return sign + scaled.toLocaleString('en-US', { maximumFractionDigits: 2 }) + step.suffix;
    }
  }

  return raw.toLocaleString('en-US');
}

export function formatPercentFromBps(bps: number): string {
  return (bps / 100).toFixed(2) + '%';
}

export function formatCountdownMs(valueMs: number): string {
  const bounded = Math.max(0, Math.floor(valueMs));
  const totalSeconds = Math.ceil(bounded / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes <= 0) {
    return seconds + 's';
  }

  return String(minutes) + 'm ' + String(seconds).padStart(2, '0') + 's';
}
