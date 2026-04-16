export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function maxBigInt(left: bigint, right: bigint): bigint {
  return left > right ? left : right;
}

export function bumpCounter(current: number, delta: bigint): number {
  if (delta <= 0n) return current;
  const boundedDelta = delta > 1_000_000n ? 1_000_000 : Number(delta);
  return current + boundedDelta;
}

export function applyBpsMultiplier(value: bigint, bonusBps: number): bigint {
  if (value <= 0n || bonusBps === 0) return value;
  const factor = BigInt(10_000 + bonusBps);
  return (value * factor) / 10_000n;
}

export function scalePerSecond(ratePerSec: bigint, deltaMs: number): bigint {
  if (deltaMs <= 0 || ratePerSec <= 0n) return 0n;
  return (ratePerSec * BigInt(deltaMs)) / 1000n;
}

export function randomIntInclusive(min: number, max: number): number {
  const span = max - min + 1;
  return min + Math.floor(Math.random() * span);
}
