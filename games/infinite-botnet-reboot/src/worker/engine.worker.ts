/// <reference lib="webworker" />

import type {
  UiToWorkerMessage,
  WorkerToUiMessage,
} from '../game/protocol';
import { dispatchCommand } from './engine/commandDispatcher';
import { runSimulationStep } from './engine/simulationStep';
import { syncDerivedState } from './engine/syncDerivedState';
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

workerScope.onmessage = (event: MessageEvent<UiToWorkerMessage>) => {
  try {
    const message = event.data;

    switch (message.type) {
      case 'BOOT': {
        syncDerivedState(state, emitLog);
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
      default:
        break;
    }
  } catch (error) {
    const text = error instanceof Error ? error.message : 'Unknown worker error';
    postToUi({ type: 'ERROR', error: text });
  }
};
