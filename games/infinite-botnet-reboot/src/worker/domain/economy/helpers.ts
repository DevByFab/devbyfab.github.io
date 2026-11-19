export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function maxBigInt(left: number, right: number): number {
  return left > right ? left : right;
}

export function bumpCounter(current: number, delta: number): number {
  if (delta <= 0) return current;
  const boundedDelta = delta > 1_000_000 ? 1_000_000 : Number(delta);
  return current + boundedDelta;
}

export function applyBpsMultiplier(value: number, bonusBps: number): number {
  if (value <= 0 || bonusBps === 0) return value;
  const factor = (10_000 + bonusBps);
  return (value * factor) / 10_000;
}

export function scalePerSecond(ratePerSec: number, deltaMs: number): number {
  if (deltaMs <= 0 || ratePerSec <= 0) return 0;
  return (ratePerSec * (deltaMs)) / 1000;
}

export function randomIntInclusive(min: number, max: number): number {
  const span = max - min + 1;
  return min + Math.floor(Math.random() * span);
}
