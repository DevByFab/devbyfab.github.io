import type { PhaseDefinition } from '../types';

export const P4_MATRIX_BREACH_PHASE: PhaseDefinition = {
  id: 'matrix-breach',
  label: 'P4 Matrix Edge',
  requirements: {
    minBots: 5_000_000,
    minPortfolio: 190_000,
    minWarWins: 18,
    minMessagesProcessed: 28,
  },
};
