import { useCallback, useEffect, useRef, useState } from 'react';
import {
  GAME_AUTOSAVE_INTERVAL_MS,
  GAME_SAVE_SCHEMA_VERSION,
  GAME_SAVE_STORAGE_KEY,
} from '../app/constants';
import {
  clearPersistedGameState,
  decodePersistedGameStateBase64,
  encodePersistedGameStateBase64,
  readPersistedGameState,
  writePersistedGameState,
} from '../app/storage';
import type {
  EngineActionCommand,
  UiToWorkerMessage,
  WorkerToUiMessage,
} from '../game/protocol';
import type { GameSnapshot, LogLine, PersistedGameState } from '../game/types';

const MAX_LOG_LINES = 160;
const WORKER_BOOT_TIMEOUT_MS = 8000;
const SAVE_REQUEST_TIMEOUT_MS = 3000;

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
  lastAutosaveAtMs: number | null;
  sendCommand: (command: EngineActionCommand) => void;
  setTurbo: (turbo: number) => void;
  resetSession: () => void;
  clearLocalSave: () => void;
  triggerAutosave: () => Promise<boolean>;
  exportSaveAsBase64: () => Promise<string | null>;
  importSaveFromBase64: (payloadBase64: string) => Promise<{ ok: boolean; reason?: string }>;
}

interface PendingSaveExportRequest {
  resolve: (save: PersistedGameState) => void;
  reject: (error: Error) => void;
  timeoutId: ReturnType<typeof window.setTimeout>;
}

interface PendingSaveImportRequest {
  resolve: (result: { ok: boolean; reason?: string }) => void;
  reject: (error: Error) => void;
  timeoutId: ReturnType<typeof window.setTimeout>;
}

export function useGameWorker(): GameWorkerController {
  const workerRef = useRef<Worker | null>(null);
  const pendingSaveExportRef = useRef<PendingSaveExportRequest | null>(null);
  const pendingSaveImportRef = useRef<PendingSaveImportRequest | null>(null);
  const autosaveInFlightRef = useRef(false);

  const [snapshot, setSnapshot] = useState<GameSnapshot | null>(null);
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [turbo, setTurboState] = useState(1);
  const [lastAutosaveAtMs, setLastAutosaveAtMs] = useState<number | null>(() => {
    const existingSave = readPersistedGameState(
      GAME_SAVE_STORAGE_KEY,
      GAME_SAVE_SCHEMA_VERSION,
    );
    return existingSave?.savedAtMs ?? null;
  });

  const rejectPendingSaveRequests = useCallback((reason: string) => {
    if (pendingSaveExportRef.current) {
      const pending = pendingSaveExportRef.current;
      pendingSaveExportRef.current = null;
      window.clearTimeout(pending.timeoutId);
      pending.reject(new Error(reason));
    }

    if (pendingSaveImportRef.current) {
      const pending = pendingSaveImportRef.current;
      pendingSaveImportRef.current = null;
      window.clearTimeout(pending.timeoutId);
      pending.reject(new Error(reason));
    }
  }, []);

  const requestSaveExport = useCallback(async (): Promise<PersistedGameState | null> => {
    const worker = workerRef.current;
    if (!worker) {
      return null;
    }

    if (pendingSaveExportRef.current) {
      return null;
    }

    return await new Promise<PersistedGameState | null>((resolve, reject) => {
      const timeoutId = window.setTimeout(() => {
        if (!pendingSaveExportRef.current) return;
        const pending = pendingSaveExportRef.current;
        pendingSaveExportRef.current = null;
        pending.reject(new Error('Timeout export de sauvegarde.'));
      }, SAVE_REQUEST_TIMEOUT_MS);

      pendingSaveExportRef.current = {
        resolve: (save) => {
          resolve(save);
        },
        reject,
        timeoutId,
      };

      try {
        const message: UiToWorkerMessage = { type: 'REQUEST_SAVE_EXPORT' };
        worker.postMessage(message);
      } catch (postError) {
        const pending = pendingSaveExportRef.current;
        pendingSaveExportRef.current = null;
        if (pending) {
          window.clearTimeout(pending.timeoutId);
        }
        reject(new Error(formatRuntimeError(postError)));
      }
    });
  }, []);

  const triggerAutosave = useCallback(async (): Promise<boolean> => {
    if (autosaveInFlightRef.current) {
      return false;
    }

    autosaveInFlightRef.current = true;

    try {
      const exportedSave = await requestSaveExport();
      if (!exportedSave) {
        return false;
      }

      const writeOk = writePersistedGameState(GAME_SAVE_STORAGE_KEY, exportedSave);
      if (writeOk) {
        setLastAutosaveAtMs(exportedSave.savedAtMs);
      }

      return writeOk;
    } catch {
      return false;
    } finally {
      autosaveInFlightRef.current = false;
    }
  }, [requestSaveExport]);

  const importPersistedSave = useCallback(
    async (save: PersistedGameState): Promise<{ ok: boolean; reason?: string }> => {
      const worker = workerRef.current;
      if (!worker) {
        return { ok: false, reason: 'Worker indisponible.' };
      }

      if (pendingSaveImportRef.current) {
        return { ok: false, reason: 'Un import est deja en cours.' };
      }

      try {
        const result = await new Promise<{ ok: boolean; reason?: string }>((resolve, reject) => {
          const timeoutId = window.setTimeout(() => {
            if (!pendingSaveImportRef.current) return;
            const pending = pendingSaveImportRef.current;
            pendingSaveImportRef.current = null;
            pending.reject(new Error('Timeout import de sauvegarde.'));
          }, SAVE_REQUEST_TIMEOUT_MS);

          pendingSaveImportRef.current = {
            resolve,
            reject,
            timeoutId,
          };

          try {
            const message: UiToWorkerMessage = { type: 'IMPORT_SAVE', save };
            worker.postMessage(message);
          } catch (postError) {
            const pending = pendingSaveImportRef.current;
            pendingSaveImportRef.current = null;
            if (pending) {
              window.clearTimeout(pending.timeoutId);
            }
            reject(new Error(formatRuntimeError(postError)));
          }
        });

        if (result.ok) {
          await triggerAutosave();
        }

        return result;
      } catch (error) {
        return { ok: false, reason: formatRuntimeError(error) };
      }
    },
    [triggerAutosave],
  );

  const importSaveFromBase64 = useCallback(
    async (payloadBase64: string): Promise<{ ok: boolean; reason?: string }> => {
      const parsedSave = decodePersistedGameStateBase64(
        payloadBase64,
        GAME_SAVE_SCHEMA_VERSION,
      );

      if (!parsedSave) {
        return { ok: false, reason: 'Payload Base64 invalide ou incompatible.' };
      }

      return importPersistedSave(parsedSave);
    },
    [importPersistedSave],
  );

  const exportSaveAsBase64 = useCallback(async (): Promise<string | null> => {
    try {
      const save = await requestSaveExport();
      if (!save) {
        return null;
      }

      return encodePersistedGameStateBase64(save);
    } catch {
      return null;
    }
  }, [requestSaveExport]);

  const clearLocalSave = useCallback(() => {
    clearPersistedGameState(GAME_SAVE_STORAGE_KEY);
    setLastAutosaveAtMs(null);
  }, []);

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

      if (message.type === 'SAVE_EXPORT') {
        if (!pendingSaveExportRef.current) {
          return;
        }

        const pending = pendingSaveExportRef.current;
        pendingSaveExportRef.current = null;
        window.clearTimeout(pending.timeoutId);
        pending.resolve(message.save);
        return;
      }

      if (message.type === 'SAVE_IMPORT_RESULT') {
        if (!pendingSaveImportRef.current) {
          return;
        }

        const pending = pendingSaveImportRef.current;
        pendingSaveImportRef.current = null;
        window.clearTimeout(pending.timeoutId);
        pending.resolve({ ok: message.ok, reason: message.reason });
        return;
      }

      if (message.type === 'ERROR') {
        setReady(false);
        setError(message.error);
        return;
      }
    };

    worker.onerror = (event: ErrorEvent) => {
      rejectPendingSaveRequests('Worker runtime error.');
      clearBootTimer();
      setReady(false);
      setError(`Worker runtime error: ${event.message || 'unknown error'}`);
    };

    worker.onmessageerror = () => {
      rejectPendingSaveRequests('Worker message channel error.');
      clearBootTimer();
      setReady(false);
      setError('Worker message channel error. Please reload the page.');
    };

    const localSave = readPersistedGameState(
      GAME_SAVE_STORAGE_KEY,
      GAME_SAVE_SCHEMA_VERSION,
    );
    if (localSave) {
      setLastAutosaveAtMs(localSave.savedAtMs);
    }

    const bootMessage: UiToWorkerMessage = { type: 'BOOT', save: localSave };
    try {
      worker.postMessage(bootMessage);
    } catch (postError) {
      clearBootTimer();
      rejectPendingSaveRequests('Worker BOOT dispatch failed.');
      window.setTimeout(() => {
        setReady(false);
        setError(`Worker BOOT dispatch failed: ${formatRuntimeError(postError)}`);
      }, 0);
    }

    return () => {
      disposed = true;
      clearBootTimer();
      rejectPendingSaveRequests('Worker terminated.');
      worker.terminate();
      if (workerRef.current === worker) {
        workerRef.current = null;
      }
    };
  }, [rejectPendingSaveRequests]);

  useEffect(() => {
    if (!ready) {
      return;
    }

    void triggerAutosave();

    const autosaveTimer = window.setInterval(() => {
      void triggerAutosave();
    }, GAME_AUTOSAVE_INTERVAL_MS);

    return () => {
      window.clearInterval(autosaveTimer);
    };
  }, [ready, triggerAutosave]);

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
    lastAutosaveAtMs,
    sendCommand,
    setTurbo,
    resetSession,
    clearLocalSave,
    triggerAutosave,
    exportSaveAsBase64,
    importSaveFromBase64,
  };
}
