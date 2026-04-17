import type {
  PhaseId,
  PhaseRequirementId,
  PhaseRequirementSnapshot,
} from '../../../game/types';
import { PHASE_DEFINITIONS } from './definitions';
import type { PhaseDefinition } from './types';

const AUTOMATION_PHASE_INDEX = PHASE_DEFINITIONS.findIndex(
  (phase) => phase.id === 'automation',
);

export interface PhaseProgress {
  id: PhaseId;
  label: string;
  nextLabel: string;
  index: number;
  progressBps: number;
  requirements: PhaseRequirementSnapshot[];
}

export interface PhaseProgressInput {
  bots: bigint;
  scans: number;
  darkMoney: bigint;
  portfolio: bigint;
  warWins: number;
  messagesProcessed: number;
  exploitSuccesses: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function isRequirementMet(value: bigint | number, target: bigint | number): boolean {
  return value >= target;
}

function isPhaseUnlocked(input: PhaseProgressInput, phase: PhaseDefinition): boolean {
  const req = phase.requirements;
  if (!isRequirementMet(input.bots, req.minBots)) return false;
  if (req.minScans !== undefined && !isRequirementMet(input.scans, req.minScans)) return false;
  if (req.minMoney !== undefined && !isRequirementMet(input.darkMoney, req.minMoney)) return false;
  if (req.minPortfolio !== undefined && !isRequirementMet(input.portfolio, req.minPortfolio)) return false;
  if (req.minWarWins !== undefined && !isRequirementMet(input.warWins, req.minWarWins)) return false;
  if (
    req.minMessagesProcessed !== undefined &&
    !isRequirementMet(input.messagesProcessed, req.minMessagesProcessed)
  ) {
    return false;
  }
  if (
    req.minExploitSuccesses !== undefined &&
    !isRequirementMet(input.exploitSuccesses, req.minExploitSuccesses)
  ) {
    return false;
  }

  return true;
}

function requirementEntry(
  id: PhaseRequirementId,
  label: string,
  current: bigint | number,
  target: bigint | number,
): PhaseRequirementSnapshot {
  return {
    id,
    label,
    current: current.toString(),
    target: target.toString(),
    met: isRequirementMet(current, target),
  };
}

function buildNextRequirements(
  input: PhaseProgressInput,
  nextPhase: PhaseDefinition | null,
): PhaseRequirementSnapshot[] {
  if (!nextPhase) return [];

  const req = nextPhase.requirements;
  const list: PhaseRequirementSnapshot[] = [
    requirementEntry('bots', 'Bots', input.bots, req.minBots),
  ];

  if (req.minScans !== undefined) {
    list.push(requirementEntry('scans', 'Scans', input.scans, req.minScans));
  }

  if (req.minMoney !== undefined) {
    list.push(requirementEntry('money', 'Dark Money', input.darkMoney, req.minMoney));
  }

  if (req.minPortfolio !== undefined) {
    list.push(requirementEntry('portfolio', 'Portfolio', input.portfolio, req.minPortfolio));
  }

  if (req.minWarWins !== undefined) {
    list.push(requirementEntry('war-wins', 'War Wins', input.warWins, req.minWarWins));
  }

  if (req.minMessagesProcessed !== undefined) {
    list.push(
      requirementEntry(
        'messages-processed',
        'Messages traites',
        input.messagesProcessed,
        req.minMessagesProcessed,
      ),
    );
  }

  if (req.minExploitSuccesses !== undefined) {
    list.push(
      requirementEntry(
        'exploit-successes',
        'Exploits reussis',
        input.exploitSuccesses,
        req.minExploitSuccesses,
      ),
    );
  }

  return list;
}

export function resolvePhaseProgress(input: PhaseProgressInput): PhaseProgress {
  let index = 0;

  for (let i = PHASE_DEFINITIONS.length - 1; i >= 0; i -= 1) {
    if (isPhaseUnlocked(input, PHASE_DEFINITIONS[i])) {
      index = i;
      break;
    }
  }

  if (AUTOMATION_PHASE_INDEX > index && input.bots >= 1000n) {
    index = AUTOMATION_PHASE_INDEX;
  }

  const current = PHASE_DEFINITIONS[index];
  const next = PHASE_DEFINITIONS[index + 1] ?? null;
  const requirements = buildNextRequirements(input, next);

  if (!next) {
    return {
      id: current.id,
      label: current.label,
      nextLabel: 'MAX',
      index,
      progressBps: 10000,
      requirements,
    };
  }

  const interval = next.requirements.minBots - current.requirements.minBots;
  const progressed = input.bots - current.requirements.minBots;
  const ratio = Number((progressed * 10000n) / interval);

  return {
    id: current.id,
    label: current.label,
    nextLabel: next.label,
    index,
    progressBps: clamp(ratio, 0, 10000),
    requirements,
  };
}
