import type { PhaseDefinition } from '../types';

export const P3_BOTNET_WAR_PHASE: PhaseDefinition = {
  id: 'botnet-war',
  label: 'P3 Botnet War',
  requirements: {
    minBots: 100_000,
    minMoney: 12_000,
    minMessagesProcessed: 8,
  },
};
