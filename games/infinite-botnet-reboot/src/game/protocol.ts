import type { GameSnapshot, LogLine } from './types';

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
  | 'MESSAGE_QUARANTINE';

export interface EngineActionCommand {
  type: EngineActionType;
  payload?: {
    commandText?: string;
  };
}

export type UiToWorkerMessage =
  | { type: 'BOOT' }
  | { type: 'SET_TURBO'; turbo: number }
  | { type: 'COMMAND'; command: EngineActionCommand }
  | { type: 'RESET' };

export type WorkerToUiMessage =
  | { type: 'READY'; snapshot: GameSnapshot }
  | { type: 'SNAPSHOT'; snapshot: GameSnapshot }
  | { type: 'LOG'; line: LogLine }
  | { type: 'ERROR'; error: string };
