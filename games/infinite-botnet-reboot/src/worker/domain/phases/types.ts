import type { PhaseId } from '../../../game/types';

export interface PhaseDefinition {
  id: PhaseId;
  label: string;
  requirements: PhaseRequirements;
}

export interface PhaseRequirements {
  minBots: bigint;
  minScans?: number;
  minMoney?: bigint;
  minPortfolio?: bigint;
  minWarWins?: number;
  minMessagesProcessed?: number;
  minExploitSuccesses?: number;
}
