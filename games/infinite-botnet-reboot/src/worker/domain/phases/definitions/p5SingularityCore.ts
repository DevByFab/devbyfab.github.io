import type { PhaseDefinition } from '../types';

export const P5_SINGULARITY_CORE_PHASE: PhaseDefinition = {
  id: 'singularity-core',
  label: 'P5 Singularity Core',
  requirements: {
    minBots: 480_000_000n,
    minMoney: 11_000_000n,
    minWarWins: 65,
    minMessagesProcessed: 65,
  },
};
