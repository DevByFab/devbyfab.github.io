import { useCallback, type Dispatch, type SetStateAction } from 'react';
import type { EngineActionCommand } from '../game/protocol';
import type { AudioManager } from '../hooks/useAudioManager';

interface UseGameActionHandlersArgs {
  playUiCue: AudioManager['playUiCue'];
  sendCommand: (command: EngineActionCommand) => void;
  matrixCommand: string;
  setMatrixCommand: Dispatch<SetStateAction<string>>;
}

interface UseGameActionHandlersResult {
  sendScan: () => void;
  sendExploit: () => void;
  purchaseUpgrade: (chainId: string) => void;
  toggleMonetize: () => void;
  investTranche: () => void;
  cashoutPortfolio: () => void;
  toggleInvestMode: () => void;
  processMessage: () => void;
  quarantineMessage: () => void;
  warAttack: () => void;
  warScrub: () => void;
  warFortify: () => void;
  matrixArm: () => void;
  matrixInject: () => void;
  matrixStabilize: () => void;
}

export function useGameActionHandlers(
  args: Readonly<UseGameActionHandlersArgs>,
): UseGameActionHandlersResult {
  const { playUiCue, sendCommand, matrixCommand, setMatrixCommand } = args;

  const sendScan = useCallback(() => {
    playUiCue('scanClick');
    sendCommand({ type: 'SCAN' });
  }, [playUiCue, sendCommand]);

  const sendExploit = useCallback(() => {
    playUiCue('exploitClick');
    sendCommand({ type: 'EXPLOIT' });
  }, [playUiCue, sendCommand]);

  const purchaseUpgrade = useCallback(
    (chainId: string) => {
      playUiCue('scanClick');
      sendCommand({
        type: 'PURCHASE_UPGRADE',
        payload: { chainId },
      });
    },
    [playUiCue, sendCommand],
  );

  const toggleMonetize = useCallback(() => {
    playUiCue('scanClick');
    sendCommand({ type: 'TOGGLE_MONETIZE' });
  }, [playUiCue, sendCommand]);

  const investTranche = useCallback(() => {
    playUiCue('scanClick');
    sendCommand({ type: 'INVEST_TRANCHE' });
  }, [playUiCue, sendCommand]);

  const cashoutPortfolio = useCallback(() => {
    playUiCue('scanClick');
    sendCommand({ type: 'CASHOUT_PORTFOLIO' });
  }, [playUiCue, sendCommand]);

  const toggleInvestMode = useCallback(() => {
    playUiCue('scanClick');
    sendCommand({ type: 'TOGGLE_INVEST_MODE' });
  }, [playUiCue, sendCommand]);

  const processMessage = useCallback(() => {
    playUiCue('scanClick');
    sendCommand({ type: 'MESSAGE_PROCESS' });
  }, [playUiCue, sendCommand]);

  const quarantineMessage = useCallback(() => {
    playUiCue('scanClick');
    sendCommand({ type: 'MESSAGE_QUARANTINE' });
  }, [playUiCue, sendCommand]);

  const warAttack = useCallback(() => {
    playUiCue('scanClick');
    sendCommand({ type: 'WAR_ATTACK' });
  }, [playUiCue, sendCommand]);

  const warScrub = useCallback(() => {
    playUiCue('scanClick');
    sendCommand({ type: 'WAR_SCRUB' });
  }, [playUiCue, sendCommand]);

  const warFortify = useCallback(() => {
    playUiCue('scanClick');
    sendCommand({ type: 'WAR_FORTIFY' });
  }, [playUiCue, sendCommand]);

  const matrixArm = useCallback(() => {
    playUiCue('scanClick');
    sendCommand({ type: 'MATRIX_ARM' });
  }, [playUiCue, sendCommand]);

  const matrixInject = useCallback(() => {
    playUiCue('scanClick');
    sendCommand({ type: 'MATRIX_INJECT', payload: { commandText: matrixCommand } });
    setMatrixCommand('');
  }, [matrixCommand, playUiCue, sendCommand, setMatrixCommand]);

  const matrixStabilize = useCallback(() => {
    playUiCue('scanClick');
    sendCommand({ type: 'MATRIX_STABILIZE' });
  }, [playUiCue, sendCommand]);

  return {
    sendScan,
    sendExploit,
    purchaseUpgrade,
    toggleMonetize,
    investTranche,
    cashoutPortfolio,
    toggleInvestMode,
    processMessage,
    quarantineMessage,
    warAttack,
    warScrub,
    warFortify,
    matrixArm,
    matrixInject,
    matrixStabilize,
  };
}