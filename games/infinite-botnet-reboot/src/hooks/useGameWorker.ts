import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  EngineActionCommand,
  UiToWorkerMessage,
  WorkerToUiMessage,
} from '../game/protocol';
import type { GameSnapshot, LogLine } from '../game/types';

const MAX_LOG_LINES = 160;

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
    const worker = new Worker(new URL('../worker/engine.worker.ts', import.meta.url), {
      type: 'module',
    });

    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent<WorkerToUiMessage>) => {
      const message = event.data;

      if (message.type === 'READY') {
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
        setError(message.error);
        return;
      }
    };

    const bootMessage: UiToWorkerMessage = { type: 'BOOT' };
    worker.postMessage(bootMessage);

    return () => {
      worker.terminate();
      workerRef.current = null;
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
