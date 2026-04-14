/// <reference lib="webworker" />

import type {
  EngineActionCommand,
  UiToWorkerMessage,
  WorkerToUiMessage,
} from '../game/protocol';
import {
  applyEconomyTick,
  commandCashoutPortfolio,
  commandExploit,
  commandInvestTranche,
  commandScan,
  commandToggleInvestMode,
  commandToggleMonetize,
  refreshEconomyDerivedRates,
} from './domain/economy';
import {
  applyMatrixTick,
  commandMatrixArm,
  commandMatrixInject,
  commandMatrixStabilize,
  refreshMatrixDerived,
} from './domain/matrix';
import {
  applyNarrativeTick,
  commandProcessMessage,
  commandQuarantineMessage,
} from './domain/narrative';
import { resolvePhaseProgress } from './domain/phases';
import {
  applyWarTick,
  commandWarAttack,
  commandWarFortify,
  commandWarScrub,
  refreshWarDerived,
} from './domain/war';
import { createInitialEngineState, toSnapshot } from './state';

const workerScope = self as DedicatedWorkerGlobalScope;

const TICK_INTERVAL_MS = 100;
const MIN_SIM_DELTA_MS = 16;
const MAX_SIM_DELTA_MS = 2_000;

let state = createInitialEngineState(Date.now());
let loopHandle: number | null = null;
let previousWallTickMs = Date.now();

function postToUi(message: WorkerToUiMessage): void {
  workerScope.postMessage(message);
}

function emitLog(text: string, severity: 'info' | 'warn' | 'error' = 'info'): void {
  state.logSequence += 1;
  postToUi({
    type: 'LOG',
    line: {
      id: 'log-' + state.logSequence,
      atMs: state.nowMs,
      severity,
      text,
    },
  });
}

function dispatchSnapshot(kind: 'READY' | 'SNAPSHOT'): void {
  const snapshot = toSnapshot(state);
  if (kind === 'READY') {
    postToUi({ type: 'READY', snapshot });
    return;
  }

  postToUi({ type: 'SNAPSHOT', snapshot });
}

function syncDerivedState(previousPhaseId?: string): void {
  const phase = resolvePhaseProgress(state.resources.bots);
  state.phase = phase;

  refreshEconomyDerivedRates(state);
  refreshWarDerived(state);
  refreshMatrixDerived(state);

  if (previousPhaseId && previousPhaseId !== phase.id) {
    emitLog('Phase atteinte: ' + phase.label + '.', 'info');
  }
}

function runTick(): void {
  const now = Date.now();
  const wallDelta = Math.max(1, now - previousWallTickMs);
  previousWallTickMs = now;

  const scaledDelta = Math.max(
    MIN_SIM_DELTA_MS,
    Math.min(MAX_SIM_DELTA_MS, Math.floor(wallDelta * state.turbo)),
  );

  const previousBots = state.resources.bots;
  const previousMoney = state.resources.darkMoney;
  const previousHeat = state.war.heat;
  const previousPhaseId = state.phase.id;

  state.nowMs += scaledDelta;

  applyEconomyTick(state, scaledDelta);

  const warTickOutcome = applyWarTick(state, scaledDelta);
  if (warTickOutcome.detectedPurgeBots > 0n) {
    emitLog(
      'Detection mondiale: purge automatique de ' +
        warTickOutcome.detectedPurgeBots.toString() +
        ' bots.',
      'warn',
    );
  }

  const matrixTickOutcome = applyMatrixTick(state, scaledDelta);
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
  syncDerivedState(previousPhaseId);

  if (scaledDelta > 0) {
    state.telemetry.botsPerSec =
      ((state.resources.bots - previousBots) * 1000n) / BigInt(scaledDelta);
    state.telemetry.moneyPerSec =
      ((state.resources.darkMoney - previousMoney) * 1000n) / BigInt(scaledDelta);
    state.telemetry.heatPerSec = Math.round(
      ((state.war.heat - previousHeat) * 1000) / scaledDelta,
    );
  }

  dispatchSnapshot('SNAPSHOT');
}

function ensureLoopStarted(): void {
  if (loopHandle !== null) return;

  previousWallTickMs = Date.now();
  loopHandle = workerScope.setInterval(runTick, TICK_INTERVAL_MS);
}

function resetEngine(): void {
  state = createInitialEngineState(Date.now());
  syncDerivedState();
  emitLog('Session reboot initialisee.', 'info');
  dispatchSnapshot('SNAPSHOT');
}

function handleCommand(command: EngineActionCommand): void {
  switch (command.type) {
    case 'SCAN': {
      commandScan(state);
      emitLog('Scan manuel: cible ajoutee a la file.', 'info');
      break;
    }
    case 'EXPLOIT': {
      const result = commandExploit(state);
      if (result === 'blocked') {
        emitLog('Exploit bloque: aucune cible en file.', 'warn');
      } else if (result === 'success') {
        emitLog('Exploit reussi: bot connecte.', 'info');
      } else {
        emitLog('Exploit rate: cible durcie.', 'warn');
      }
      break;
    }
    case 'TOGGLE_MONETIZE': {
      const toggled = commandToggleMonetize(state);
      if (!toggled) {
        emitLog('Monetisation indisponible: volume bot trop faible.', 'warn');
      } else if (state.systems.monetizeActive) {
        emitLog('Monetisation activee.', 'info');
      } else {
        emitLog('Monetisation mise en pause.', 'info');
      }
      break;
    }
    case 'INVEST_TRANCHE': {
      const invested = commandInvestTranche(state);
      if (!invested) {
        emitLog('Tranche refusee: dark money insuffisant.', 'warn');
      } else {
        emitLog('Tranche investie sur le desk.', 'info');
      }
      break;
    }
    case 'CASHOUT_PORTFOLIO': {
      const cashedOut = commandCashoutPortfolio(state);
      if (!cashedOut) {
        emitLog('Aucun portefeuille a sortir.', 'warn');
      } else {
        emitLog('Portefeuille converti vers dark money (frais appliques).', 'info');
      }
      break;
    }
    case 'TOGGLE_INVEST_MODE': {
      commandToggleInvestMode(state);
      emitLog('Mode investissement -> ' + state.systems.investMode + '.', 'info');
      break;
    }
    case 'WAR_ATTACK': {
      const attackResult = commandWarAttack(state);
      if (attackResult === 'blocked') {
        emitLog('Frappe impossible: cooldown actif ou bots insuffisants.', 'warn');
      } else if (attackResult === 'win') {
        emitLog('Frappe victorieuse: intel capture.', 'info');
      } else {
        emitLog('Frappe perdue: la Heat explose.', 'warn');
      }
      break;
    }
    case 'WAR_SCRUB': {
      const scrubbed = commandWarScrub(state);
      if (!scrubbed) {
        emitLog('Scrub refuse: dark money insuffisant.', 'warn');
      } else {
        emitLog('Traces scrubbees, pression detection reduite.', 'info');
      }
      break;
    }
    case 'WAR_FORTIFY': {
      const fortified = commandWarFortify(state);
      if (!fortified) {
        emitLog('Defense pulse indisponible (cout/cooldown).', 'warn');
      } else {
        emitLog('Defense pulse deployee.', 'info');
      }
      break;
    }
    case 'MATRIX_ARM': {
      const armed = commandMatrixArm(state);
      if (!armed) {
        emitLog('Bypass non arme: verifier unlock et ressources.', 'warn');
      } else {
        emitLog('Bypass matrix arme.', 'info');
      }
      break;
    }
    case 'MATRIX_INJECT': {
      const result = commandMatrixInject(state, command.payload?.commandText);
      if (result === 'blocked') {
        emitLog('Injection bloquee: bypass ferme ou ressources insuffisantes.', 'warn');
      } else if (result === 'success') {
        emitLog('Injection acceptee par la matrice.', 'info');
      } else {
        emitLog('Injection rejetee: backlash actif.', 'warn');
      }
      break;
    }
    case 'MATRIX_STABILIZE': {
      const stabilized = commandMatrixStabilize(state);
      if (!stabilized) {
        emitLog('Stabilisation impossible: budget insuffisant.', 'warn');
      } else {
        emitLog('Matrice stabilisee temporairement.', 'info');
      }
      break;
    }
    case 'MESSAGE_PROCESS': {
      const processResult = commandProcessMessage(state);
      if (processResult === 'none') {
        emitLog('Aucun message a traiter.', 'warn');
      } else if (processResult === 'negative') {
        emitLog('Message traite: impact negatif applique.', 'warn');
      } else {
        emitLog('Message traite: avantage tactique recu.', 'info');
      }
      break;
    }
    case 'MESSAGE_QUARANTINE': {
      const quarantined = commandQuarantineMessage(state);
      if (!quarantined) {
        emitLog('Quarantaine refusee: cout non couvert.', 'warn');
      } else {
        emitLog('Message isole en quarantaine.', 'info');
      }
      break;
    }
    default:
      break;
  }

  syncDerivedState();
  dispatchSnapshot('SNAPSHOT');
}

workerScope.onmessage = (event: MessageEvent<UiToWorkerMessage>) => {
  try {
    const message = event.data;

    switch (message.type) {
      case 'BOOT': {
        syncDerivedState();
        ensureLoopStarted();
        emitLog('Worker simulation online.', 'info');
        dispatchSnapshot('READY');
        break;
      }
      case 'SET_TURBO': {
        const turbo = Number.isFinite(message.turbo) ? message.turbo : 1;
        state.turbo = Math.max(1, Math.min(40, turbo));
        emitLog('Simulation speed -> x' + state.turbo + '.', 'info');
        dispatchSnapshot('SNAPSHOT');
        break;
      }
      case 'COMMAND': {
        handleCommand(message.command);
        break;
      }
      case 'RESET': {
        resetEngine();
        break;
      }
      default:
        break;
    }
  } catch (error) {
    const text = error instanceof Error ? error.message : 'Unknown worker error';
    postToUi({ type: 'ERROR', error: text });
  }
};
