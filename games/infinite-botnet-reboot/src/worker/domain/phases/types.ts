import type { PhaseId } from '../../../game/types';

export interface PhaseDefinition {
  id: PhaseId;
  label: string;
  requirements: PhaseRequirements;
}

export interface PhaseRequirements {
  minBots: number;
  minScans?: number;
  minMoney?: number;
  minPortfolio?: number;
  minWarWins?: number;
  minMessagesProcessed?: number;
  minExploitSuccesses?: number;
}
