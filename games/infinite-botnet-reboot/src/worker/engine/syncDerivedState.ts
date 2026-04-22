import { refreshEconomyDerivedRates } from '../domain/economy';
import { refreshMatrixDerived } from '../domain/matrix';
import { resolvePhaseProgress } from '../domain/phases';
import { refreshWarDerived } from '../domain/war';
import { refreshUpgradeOffers } from '../domain/upgrades';
import type { EngineState } from '../state';
import type { EmitLog } from './types';

export function syncCoreDerivedState(state: EngineState): void {
  state.phase = resolvePhaseProgress(
    {
      bots: state.resources.bots,
      scans: state.milestones.scans,
      darkMoney: state.resources.darkMoney,
      portfolio: state.resources.portfolio,
      warWins: state.war.wins,
      messagesProcessed: state.messages.processed,
      exploitSuccesses: state.milestones.exploitSuccesses,
    },
    {
      minUnlockedPhaseIndex: state.phase.index,
    },
  );

  refreshEconomyDerivedRates(state);
  refreshWarDerived(state);
  refreshMatrixDerived(state);
}

export function syncDerivedState(
  state: EngineState,
  emitLog: EmitLog,
  previousPhaseId?: string,
): void {
  syncCoreDerivedState(state);
  const { phase } = state;
  refreshUpgradeOffers(state);

  if (previousPhaseId && previousPhaseId !== phase.id) {
    emitLog('Phase atteinte: ' + phase.label + '.', 'info');
  }
}
