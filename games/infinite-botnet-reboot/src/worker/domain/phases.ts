import type {
  PhaseId,
  PhaseRequirementId,
  PhaseRequirementSnapshot,
} from '../../game/types';

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

const PHASE_DEFINITIONS: PhaseDefinition[] = [
  {
    id: 'garage',
    label: 'P0 Garage',
    requirements: { minBots: 0n },
  },
  {
    id: 'automation',
    label: 'P1 Recon Automation',
    requirements: {
      minBots: 180n,
      minScans: 80,
      minExploitSuccesses: 30,
    },
  },
  {
    id: 'monetization',
    label: 'P2 Cashflow Hijack',
    requirements: {
      minBots: 6_500n,
      minScans: 650,
      minMoney: 1_700n,
      minExploitSuccesses: 240,
    },
  },
  {
    id: 'botnet-war',
    label: 'P3 Botnet War',
    requirements: {
      minBots: 420_000n,
      minScans: 2_000,
      minMoney: 26_000n,
      minMessagesProcessed: 8,
    },
  },
  {
    id: 'matrix-breach',
    label: 'P4 Matrix Edge',
    requirements: {
      minBots: 18_000_000n,
      minPortfolio: 190_000n,
      minWarWins: 18,
      minMessagesProcessed: 28,
    },
  },
  {
    id: 'singularity-core',
    label: 'P5 Singularity Core',
    requirements: {
      minBots: 480_000_000n,
      minMoney: 11_000_000n,
      minWarWins: 65,
      minMessagesProcessed: 65,
    },
  },
];

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
