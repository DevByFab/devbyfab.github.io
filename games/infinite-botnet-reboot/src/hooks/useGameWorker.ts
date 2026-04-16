import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  EngineActionCommand,
  UiToWorkerMessage,
  WorkerToUiMessage,
} from '../game/protocol';
import type { GameSnapshot, LogLine } from '../game/types';

const MAX_LOG_LINES = 160;
const WORKER_BOOT_TIMEOUT_MS = 8000;

function formatRuntimeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string' && error.trim().length > 0) return error;
  return 'Unknown worker error';
}

export interface GameWorkerController {
  snapshot: GameSnapshot | null;
  logs: LogLine[];
  ready: boolean;
  error: string | null;
  turbo: number;
  sendCommand: (command: EngineActionCommand) => void;
  setTurbo: (turbo: number) => void;
  resetSession: () => void;
}

export function useGameWorker(): GameWorkerController {
  const workerRef = useRef<Worker | null>(null);

  const [snapshot, setSnapshot] = useState<GameSnapshot | null>(null);
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [turbo, setTurboState] = useState(1);

  useEffect(() => {
    let disposed = false;
    let workerBooted = false;
    let bootTimer: ReturnType<typeof window.setTimeout> | null = null;

    const clearBootTimer = () => {
      if (bootTimer === null) return;
      window.clearTimeout(bootTimer);
      bootTimer = null;
    };

    let worker: Worker;
    try {
      worker = new Worker(new URL('../worker/engine.worker.ts', import.meta.url), {
        type: 'module',
      });
    } catch (creationError) {
      window.setTimeout(() => {
        setError(
          `Worker bootstrap failed. Start with Vite (npm run dev or npm run preview). ${formatRuntimeError(creationError)}`,
        );
      }, 0);
      return;
    }

    workerRef.current = worker;
    bootTimer = window.setTimeout(() => {
      if (disposed || workerBooted) return;
      setReady(false);
      setError('Worker boot timeout. Start with Vite (npm run dev or npm run preview).');
    }, WORKER_BOOT_TIMEOUT_MS);

    worker.onmessage = (event: MessageEvent<WorkerToUiMessage>) => {
      const message = event.data;

      if (message.type === 'READY') {
        workerBooted = true;
        clearBootTimer();
        setError(null);
        setSnapshot(message.snapshot);
        setReady(true);
        return;
      }

      if (message.type === 'SNAPSHOT') {
        setSnapshot(message.snapshot);
        return;
      }

      if (message.type === 'LOG') {
        setLogs((current) => {
          const next = [...current, message.line];
          if (next.length <= MAX_LOG_LINES) return next;
          return next.slice(next.length - MAX_LOG_LINES);
        });
        return;
      }

      if (message.type === 'ERROR') {
        setReady(false);
        setError(message.error);
        return;
      }
    };

    worker.onerror = (event: ErrorEvent) => {
      clearBootTimer();
      setReady(false);
      setError(`Worker runtime error: ${event.message || 'unknown error'}`);
    };

    worker.onmessageerror = () => {
      clearBootTimer();
      setReady(false);
      setError('Worker message channel error. Please reload the page.');
    };

    const bootMessage: UiToWorkerMessage = { type: 'BOOT' };
    try {
      worker.postMessage(bootMessage);
    } catch (postError) {
      clearBootTimer();
      window.setTimeout(() => {
        setReady(false);
        setError(`Worker BOOT dispatch failed: ${formatRuntimeError(postError)}`);
      }, 0);
    }

    return () => {
      disposed = true;
      clearBootTimer();
      worker.terminate();
      if (workerRef.current === worker) {
        workerRef.current = null;
      }
    };
  }, []);

  const sendCommand = useCallback((command: EngineActionCommand) => {
    const worker = workerRef.current;
    if (!worker) return;

    const message: UiToWorkerMessage = { type: 'COMMAND', command };
    worker.postMessage(message);
  }, []);

  const setTurbo = useCallback((nextTurbo: number) => {
    const worker = workerRef.current;
    if (!worker) return;

    const normalized = Math.max(1, Math.min(40, Math.floor(nextTurbo)));
    setTurboState(normalized);

    const message: UiToWorkerMessage = { type: 'SET_TURBO', turbo: normalized };
    worker.postMessage(message);
  }, []);

  const resetSession = useCallback(() => {
    const worker = workerRef.current;
    if (!worker) return;

    const message: UiToWorkerMessage = { type: 'RESET' };
    worker.postMessage(message);
  }, []);

  return {
    snapshot,
    logs,
    ready,
    error,
    turbo,
    sendCommand,
    setTurbo,
    resetSession,
  };
}
