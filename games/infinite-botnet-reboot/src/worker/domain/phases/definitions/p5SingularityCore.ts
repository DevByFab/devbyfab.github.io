import type { PhaseDefinition } from '../types';

export const P5_SINGULARITY_CORE_PHASE: PhaseDefinition = {
  id: 'singularity-core',
  label: 'P5 Singularity Core',
  requirements: {
    minBots: 480_000_000,
    minMoney: 11_000_000,
    minWarWins: 65,
    minMessagesProcessed: 65,
  },
};
