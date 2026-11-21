import { applyEconomyTick } from '../domain/economy';
import { applyMatrixTick } from '../domain/matrix';
import { applyNarrativeTick } from '../domain/narrative';
import { applyStoryTick } from '../domain/story';
import { applyWarTick } from '../domain/war';
import type { EngineState } from '../state';
import type { EmitLog } from './types';

export interface SimulationStepBaseline {
  previousBots: number;
  previousMoney: number;
  previousHeat: number;
  previousPhaseId: string;
}

export function runSimulationStep(
  state: EngineState,
  scaledDeltaMs: number,
  emitLog: EmitLog,
): SimulationStepBaseline {
  const baseline: SimulationStepBaseline = {
    previousBots: state.resources.bots,
    previousMoney: state.resources.money,
    previousHeat: state.war.heat,
    previousPhaseId: state.phase.id,
  };

  // Une fin a été atteinte : la partie est figée.
  if (state.story.ending) {
    return baseline;
  }

  state.nowMs += scaledDeltaMs;

  const economyTickOutcome = applyEconomyTick(state, scaledDeltaMs);
  if (economyTickOutcome.fbiIntervention) {
    emitLog(
      'Alerte FBI: saisie de ' + Math.floor(economyTickOutcome.seizedMoney) + ' en argent.',
      'warn',
    );
  }

  const warTickOutcome = applyWarTick(state, scaledDeltaMs);
  if (warTickOutcome.detectedPurgeBots > 0) {
    emitLog(
      'Detection mondiale: purge automatique de ' +
        warTickOutcome.detectedPurgeBots.toString() +
        ' bots.',
      'warn',
    );
  }

  const matrixTickOutcome = applyMatrixTick(state, scaledDeltaMs);
  if (matrixTickOutcome.collapsed) {
    emitLog(
      'Effondrement Matrix: ' + matrixTickOutcome.collapsePurgedBots.toString() + ' bots perdus.',
      'warn',
    );
  }

  const messageGenerated = applyNarrativeTick(state);
  if (messageGenerated) {
    emitLog('Nouveau message intercepte dans la relay inbox.', 'info');
  }

  const storyOutcome = applyStoryTick(state, scaledDeltaMs);
  if (storyOutcome.arrestStarted) {
    emitLog('Mandat lancé : la police te colle au dos. Fais baisser la suspicion avant la fin du compte à rebours.', 'error');
  }
  if (storyOutcome.projectCompleted !== null) {
    emitLog('Projet ' + (storyOutcome.projectCompleted + 1) + '/3 terminé.', 'info');
  }
  if (storyOutcome.ending) {
    emitLog('Fin atteinte : ' + storyOutcome.ending + '.', 'info');
  }

  state.tick += 1;

  return baseline;
}
