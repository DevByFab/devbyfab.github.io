import type { PhaseDefinition } from '../types';

export const P3_BOTNET_WAR_PHASE: PhaseDefinition = {
  id: 'botnet-war',
  label: 'P3 Botnet War',
  requirements: {
    minBots: 420_000n,
    minScans: 2_000,
    minMoney: 26_000n,
    minMessagesProcessed: 8,
  },
};
