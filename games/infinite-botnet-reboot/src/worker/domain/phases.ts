import type { PhaseId } from '../../game/types';

export interface PhaseDefinition {
  id: PhaseId;
  label: string;
  minBots: bigint;
}

const PHASE_DEFINITIONS: PhaseDefinition[] = [
  { id: 'garage', label: 'Garage', minBots: 0n },
  { id: 'automation', label: 'Automatisation', minBots: 100n },
  { id: 'monetization', label: 'Monetisation', minBots: 10_000n },
  { id: 'botnet-war', label: 'Guerre Botnet', minBots: 1_000_000n },
  { id: 'cloud-dominion', label: 'Dominion Cloud', minBots: 50_000_000n },
  { id: 'opinion-forge', label: 'Forge Opinion', minBots: 500_000_000n },
  { id: 'grid-overmind', label: 'Grid Overmind', minBots: 2_000_000_000n },
  { id: 'neural-breach', label: 'Breach Neural', minBots: 8_000_000_000n },
  { id: 'singularity-core', label: 'Noyau Singularite', minBots: 30_000_000_000n },
  { id: 'matrix-breach', label: 'Breach Matrix', minBots: 120_000_000_000n },
];

export interface PhaseProgress {
  id: PhaseId;
  label: string;
  nextLabel: string;
  index: number;
  progressBps: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function resolvePhaseProgress(bots: bigint): PhaseProgress {
  let index = 0;

  for (let i = PHASE_DEFINITIONS.length - 1; i >= 0; i -= 1) {
    if (bots >= PHASE_DEFINITIONS[i].minBots) {
      index = i;
      break;
    }
  }

  const current = PHASE_DEFINITIONS[index];
  const next = PHASE_DEFINITIONS[index + 1] ?? null;

  if (!next) {
    return {
      id: current.id,
      label: current.label,
      nextLabel: 'MAX',
      index,
      progressBps: 10000,
    };
  }

  const interval = next.minBots - current.minBots;
  const progressed = bots - current.minBots;
  const ratio = Number((progressed * 10000n) / interval);

  return {
    id: current.id,
    label: current.label,
    nextLabel: next.label,
    index,
    progressBps: clamp(ratio, 0, 10000),
  };
}
