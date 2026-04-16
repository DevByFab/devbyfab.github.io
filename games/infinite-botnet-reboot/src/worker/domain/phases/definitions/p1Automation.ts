import type { PhaseDefinition } from '../types';

export const P1_AUTOMATION_PHASE: PhaseDefinition = {
  id: 'automation',
  label: 'P1 Recon Automation',
  requirements: {
    minBots: 180n,
    minScans: 80,
    minExploitSuccesses: 30,
  },
};
