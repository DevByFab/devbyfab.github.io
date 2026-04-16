import type { PhaseDefinition } from '../types';

export const P4_MATRIX_BREACH_PHASE: PhaseDefinition = {
  id: 'matrix-breach',
  label: 'P4 Matrix Edge',
  requirements: {
    minBots: 18_000_000n,
    minPortfolio: 190_000n,
    minWarWins: 18,
    minMessagesProcessed: 28,
  },
};
