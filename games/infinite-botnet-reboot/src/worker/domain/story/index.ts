import {
  ARREST_COUNTDOWN_MS,
  ARREST_RUN_SUSPICION,
  ARREST_TRIGGER_SUSPICION,
  STORY_CHOICE_PHASE_INDEX,
  STORY_PATH_IDS,
  STORY_PROJECTS,
  STORY_PROJECTS_PHASE_INDEX,
  type StoryProjectDefinition,
} from '../../../game/story';
import type {
  EndingId,
  StoryMissing,
  StoryPathId,
  StoryProjectSnapshot,
  StorySnapshot,
} from '../../../game/types';
import type { EngineState, EngineStory } from '../../state';

export type ChoosePathResult = 'chosen' | 'locked' | 'already-chosen' | 'invalid' | 'ended';
export type StartProjectResult = 'started' | 'no-path' | 'locked' | 'running' | 'missing' | 'finished' | 'ended';

export interface StoryTickOutcome {
  arrestStarted: boolean;
  projectCompleted: number | null;
  ending: EndingId | null;
}

const PROJECT_COUNT = 3;

export function createInitialStory(): EngineStory {
  return {
    path: null,
    projectsDone: 0,
    projectRunning: false,
    projectProgressMs: 0,
    arrestActive: false,
    arrestRemainingMs: 0,
    ending: null,
  };
}

function parseStoryPath(value: unknown): StoryPathId | null {
  return STORY_PATH_IDS.find((id) => id === value) ?? null;
}

function parseEnding(value: unknown): EndingId | null {
  return value === 'prison' ? 'prison' : parseStoryPath(value);
}

function parseNumber(value: unknown, min: number, max: number): number {
  const parsed = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  return Math.min(max, Math.max(min, parsed));
}

/** Relit la partie « histoire » d'une sauvegarde ; une sauvegarde sans ce bloc repart d'un état vide. */
export function sanitizeStory(value: unknown): EngineStory {
  const initial = createInitialStory();
  if (!value || typeof value !== 'object') return initial;
  const raw = value as Record<string, unknown>;
  const path = parseStoryPath(raw.path);
  const projectsDone = Math.floor(parseNumber(raw.projectsDone, 0, PROJECT_COUNT));

  return {
    path,
    projectsDone: path ? projectsDone : 0,
    projectRunning: path !== null && projectsDone < PROJECT_COUNT && raw.projectRunning === true,
    projectProgressMs: parseNumber(raw.projectProgressMs, 0, 3_600_000),
    arrestActive: raw.arrestActive === true,
    arrestRemainingMs: parseNumber(raw.arrestRemainingMs, 0, ARREST_COUNTDOWN_MS),
    ending: parseEnding(raw.ending),
  };
}

function currentDefinition(state: EngineState): StoryProjectDefinition | null {
  const { path, projectsDone } = state.story;
  if (!path || projectsDone >= PROJECT_COUNT) return null;
  return STORY_PROJECTS[path][projectsDone] ?? null;
}

function missingFor(state: EngineState, definition: StoryProjectDefinition): StoryMissing[] {
  const missing: StoryMissing[] = [];
  if (state.resources.money < definition.costMoney) missing.push('money');
  if (state.resources.bots < definition.costBots) missing.push('bots');
  if (state.war.wins < definition.minWarWins) missing.push('war-wins');
  if (state.systems.fbiSuspicion > definition.maxSuspicion) missing.push('suspicion');
  return missing;
}

export function commandChoosePath(state: EngineState, pathId: unknown): ChoosePathResult {
  if (state.story.ending) return 'ended';
  const path = parseStoryPath(pathId);
  if (!path) return 'invalid';
  if (state.story.path) return 'already-chosen';
  if (state.phase.index < STORY_CHOICE_PHASE_INDEX) return 'locked';

  state.story.path = path;
  return 'chosen';
}

export function commandStartProject(state: EngineState): StartProjectResult {
  const story = state.story;
  if (story.ending) return 'ended';
  if (!story.path) return 'no-path';
  if (state.phase.index < STORY_PROJECTS_PHASE_INDEX) return 'locked';
  if (story.projectRunning) return 'running';

  const definition = currentDefinition(state);
  if (!definition) return 'finished';
  if (missingFor(state, definition).length > 0) return 'missing';

  state.resources.money -= definition.costMoney;
  state.resources.bots -= definition.costBots;
  story.projectRunning = true;
  story.projectProgressMs = 0;
  return 'started';
}

function finishStory(state: EngineState, ending: EndingId, outcome: StoryTickOutcome): void {
  state.story.ending = ending;
  state.systems.monetizeActive = false;
  outcome.ending = ending;
}

export function applyStoryTick(state: EngineState, deltaMs: number): StoryTickOutcome {
  const outcome: StoryTickOutcome = { arrestStarted: false, projectCompleted: null, ending: null };
  const story = state.story;
  if (story.ending) return outcome;

  // Prison : possible dès P2, quelle que soit la voie.
  if (state.phase.index >= 2) {
    const suspicion = state.systems.fbiSuspicion;
    if (!story.arrestActive && suspicion >= ARREST_TRIGGER_SUSPICION) {
      story.arrestActive = true;
      story.arrestRemainingMs = ARREST_COUNTDOWN_MS;
      outcome.arrestStarted = true;
    }

    if (story.arrestActive && suspicion >= ARREST_RUN_SUSPICION) {
      story.arrestRemainingMs = Math.max(0, story.arrestRemainingMs - deltaMs);
      if (story.arrestRemainingMs <= 0) {
        finishStory(state, 'prison', outcome);
        return outcome;
      }
    }
  }

  const definition = currentDefinition(state);
  if (!story.projectRunning || !definition) return outcome;
  if (state.systems.fbiSuspicion > definition.maxSuspicion) return outcome;

  story.projectProgressMs += deltaMs;
  if (definition.heatPerSec > 0) {
    state.war.heat = Math.min(10_000, state.war.heat + (definition.heatPerSec * deltaMs) / 1000);
  }

  if (story.projectProgressMs < definition.durationMs) return outcome;

  outcome.projectCompleted = story.projectsDone;
  story.projectsDone += 1;
  story.projectRunning = false;
  story.projectProgressMs = 0;
  if (definition.keepMoney !== null) {
    state.resources.money = Math.min(state.resources.money, definition.keepMoney);
  }

  if (story.projectsDone >= PROJECT_COUNT && story.path) {
    finishStory(state, story.path, outcome);
  }

  return outcome;
}

function buildProjects(state: EngineState): StoryProjectSnapshot[] {
  const { path, projectsDone, projectRunning, projectProgressMs } = state.story;
  if (!path) return [];

  return STORY_PROJECTS[path].map((definition, index) => {
    const isCurrent = index === projectsDone;
    const status = index < projectsDone
      ? 'done'
      : isCurrent && projectRunning
        ? 'running'
        : isCurrent && state.phase.index >= STORY_PROJECTS_PHASE_INDEX
          ? 'ready'
          : 'locked';
    const stalled = status === 'running' && state.systems.fbiSuspicion > definition.maxSuspicion;

    return {
      index,
      status,
      costMoney: definition.costMoney,
      costBots: definition.costBots,
      minWarWins: definition.minWarWins,
      maxSuspicion: definition.maxSuspicion,
      durationMs: definition.durationMs,
      progressBps: status === 'done' ? 10_000 : status === 'running'
        ? Math.floor((projectProgressMs / definition.durationMs) * 10_000)
        : 0,
      missing: status === 'ready' ? missingFor(state, definition) : [],
      stalled,
    };
  });
}

export function buildStorySnapshot(state: EngineState): StorySnapshot {
  const story = state.story;

  return {
    path: story.path,
    projectsDone: story.projectsDone,
    choiceOpen: state.phase.index >= STORY_CHOICE_PHASE_INDEX && story.path === null && story.ending === null,
    projectsOpen: state.phase.index >= STORY_PROJECTS_PHASE_INDEX,
    projects: buildProjects(state),
    arrestActive: story.arrestActive,
    arrestRemainingMs: story.arrestRemainingMs,
    ending: story.ending,
  };
}
