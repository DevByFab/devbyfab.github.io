/// <reference lib="webworker" />

import { GAME_SAVE_SCHEMA_VERSION } from '../app/constants';
import type {
  UiToWorkerMessage,
  WorkerToUiMessage,
} from '../game/protocol';
import type { PersistedGameState } from '../game/types';
import { dispatchCommand } from './engine/commandDispatcher';
import { runSimulationStep } from './engine/simulationStep';
import { syncDerivedState } from './engine/syncDerivedState';
import {
  createInitialEngineState,
  fromPersistedState,
  toPersistedState,
  toSnapshot,
} from './state';

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

function runTick(): void {
  const now = Date.now();
  const wallDelta = Math.max(1, now - previousWallTickMs);
  previousWallTickMs = now;

  const scaledDelta = Math.max(
    MIN_SIM_DELTA_MS,
    Math.min(MAX_SIM_DELTA_MS, Math.floor(wallDelta * state.turbo)),
  );

  const baseline = runSimulationStep(state, scaledDelta, emitLog);
  syncDerivedState(state, emitLog, baseline.previousPhaseId);

  if (scaledDelta > 0) {
    state.telemetry.botsPerSec =
      ((state.resources.bots - baseline.previousBots) * 1000n) / BigInt(scaledDelta);
    state.telemetry.moneyPerSec =
      ((state.resources.darkMoney - baseline.previousMoney) * 1000n) / BigInt(scaledDelta);
    state.telemetry.heatPerSec = Math.round(
      ((state.war.heat - baseline.previousHeat) * 1000) / scaledDelta,
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
  syncDerivedState(state, emitLog);
  emitLog('Session reboot initialisee.', 'info');
  dispatchSnapshot('SNAPSHOT');
}

function restoreFromSave(save: PersistedGameState): { ok: true } | { ok: false; reason: string } {
  if (save.schemaVersion !== GAME_SAVE_SCHEMA_VERSION) {
    return { ok: false, reason: 'Version de sauvegarde incompatible.' };
  }

  try {
    state = fromPersistedState(save, Date.now());
    syncDerivedState(state, emitLog);
    return { ok: true };
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Sauvegarde invalide.';
    return { ok: false, reason };
  }
}

function exportSavePayload(): PersistedGameState {
  return toPersistedState(state, GAME_SAVE_SCHEMA_VERSION, Date.now());
}

workerScope.onmessage = (event: MessageEvent<UiToWorkerMessage>) => {
  try {
    const message = event.data;

    switch (message.type) {
      case 'BOOT': {
        if (message.save) {
          const restoreResult = restoreFromSave(message.save);
          if (restoreResult.ok) {
            emitLog('Session restauree depuis la sauvegarde locale.', 'info');
          } else {
            state = createInitialEngineState(Date.now());
            syncDerivedState(state, emitLog);
            emitLog('Sauvegarde ignoree: ' + restoreResult.reason, 'warn');
          }
        } else {
          syncDerivedState(state, emitLog);
        }
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
        dispatchCommand(state, message.command, emitLog);
        syncDerivedState(state, emitLog);
        dispatchSnapshot('SNAPSHOT');
        break;
      }
      case 'RESET': {
        resetEngine();
        break;
      }
      case 'REQUEST_SAVE_EXPORT': {
        postToUi({
          type: 'SAVE_EXPORT',
          save: exportSavePayload(),
        });
        break;
      }
      case 'IMPORT_SAVE': {
        const restoreResult = restoreFromSave(message.save);
        if (!restoreResult.ok) {
          emitLog('Import refuse: ' + restoreResult.reason, 'warn');
          postToUi({
            type: 'SAVE_IMPORT_RESULT',
            ok: false,
            reason: restoreResult.reason,
          });
          break;
        }

        emitLog('Import applique: progression restauree.', 'info');
        dispatchSnapshot('SNAPSHOT');
        postToUi({
          type: 'SAVE_IMPORT_RESULT',
          ok: true,
        });
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
