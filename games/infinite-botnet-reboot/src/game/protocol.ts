import type { GameSnapshot, LogLine, PersistedGameState } from './types';

export type EngineActionType =
  | 'SCAN'
  | 'EXPLOIT'
  | 'TOGGLE_MONETIZE'
  | 'INVEST_TRANCHE'
  | 'CASHOUT_PORTFOLIO'
  | 'TOGGLE_INVEST_MODE'
  | 'WAR_ATTACK'
  | 'WAR_SCRUB'
  | 'WAR_FORTIFY'
  | 'MATRIX_ARM'
  | 'MATRIX_INJECT'
  | 'MATRIX_STABILIZE'
  | 'MESSAGE_PROCESS'
  | 'MESSAGE_QUARANTINE'
  | 'PURCHASE_UPGRADE';

export interface EngineActionCommand {
  type: EngineActionType;
  payload?: {
    commandText?: string;
    chainId?: string;
  };
}

export type UiToWorkerMessage =
  | { type: 'BOOT'; save: PersistedGameState | null }
  | { type: 'SET_TURBO'; turbo: number }
  | { type: 'COMMAND'; command: EngineActionCommand }
  | { type: 'RESET' }
  | { type: 'REQUEST_SAVE_EXPORT' }
  | { type: 'IMPORT_SAVE'; save: PersistedGameState };

export type WorkerToUiMessage =
  | { type: 'READY'; snapshot: GameSnapshot }
  | { type: 'SNAPSHOT'; snapshot: GameSnapshot }
  | { type: 'LOG'; line: LogLine }
  | { type: 'ERROR'; error: string }
  | { type: 'SAVE_EXPORT'; save: PersistedGameState }
  | { type: 'SAVE_IMPORT_RESULT'; ok: boolean; reason?: string };
