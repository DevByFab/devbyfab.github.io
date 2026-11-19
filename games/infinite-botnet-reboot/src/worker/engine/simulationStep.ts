import { applyEconomyTick } from '../domain/economy';
import { applyMatrixTick } from '../domain/matrix';
import { applyNarrativeTick } from '../domain/narrative';
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

  state.tick += 1;

  return baseline;
}
