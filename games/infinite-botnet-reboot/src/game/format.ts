const SCALE_STEPS: Array<{ threshold: bigint; divisor: bigint; suffix: string }> = [
  { threshold: 1_000_000_000_000_000n, divisor: 1_000_000_000_000_000n, suffix: 'Qa' },
  { threshold: 1_000_000_000_000n, divisor: 1_000_000_000_000n, suffix: 'T' },
  { threshold: 1_000_000_000n, divisor: 1_000_000_000n, suffix: 'B' },
  { threshold: 1_000_000n, divisor: 1_000_000n, suffix: 'M' },
  { threshold: 1_000n, divisor: 1_000n, suffix: 'K' },
];

function parseBigInt(value: string | bigint | number): bigint {
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number') return BigInt(Math.trunc(value));
  if (value.trim() === '') return 0n;
  return BigInt(value);
}

export function formatBigValue(value: string | bigint | number): string {
  const raw = parseBigInt(value);
  const isNegative = raw < 0n;
  const absolute = isNegative ? -raw : raw;

  for (const step of SCALE_STEPS) {
    if (absolute >= step.threshold) {
      const scaled = Number((absolute * 100n) / step.divisor) / 100;
      const sign = isNegative ? '-' : '';
      return sign + scaled.toLocaleString('fr-FR', { maximumFractionDigits: 2 }) + step.suffix;
    }
  }

  return raw.toLocaleString('fr-FR');
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
