import type { PhaseDefinition } from '../types';

export const P2_MONETIZATION_PHASE: PhaseDefinition = {
  id: 'monetization',
  label: 'P2 Cashflow Hijack',
  requirements: {
    minBots: 6_500n,
    minScans: 650,
    minMoney: 1_700n,
    minExploitSuccesses: 240,
  },
};
