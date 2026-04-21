import { useCallback, type Dispatch, type SetStateAction } from 'react';
import type { EngineActionCommand } from '../game/protocol';
import type { FrontBusinessId } from '../game/types';
import type { AudioManager } from '../hooks/useAudioManager';

type UiCue = Parameters<AudioManager['playUiCue']>[0];

function useSimpleCommandHandler(
  playUiCue: AudioManager['playUiCue'],
  sendCommand: (command: EngineActionCommand) => void,
  type: EngineActionCommand['type'],
  cue: UiCue = 'scanClick',
): () => void {
  return useCallback(() => {
    playUiCue(cue);
    sendCommand({ type });
  }, [cue, playUiCue, sendCommand, type]);
}

function useUpgradeCommandHandler(
  playUiCue: AudioManager['playUiCue'],
  sendCommand: (command: EngineActionCommand) => void,
): (chainId: string) => void {
  return useCallback(
    (chainId: string) => {
      playUiCue('scanClick');
      sendCommand({ type: 'PURCHASE_UPGRADE', payload: { chainId } });
    },
    [playUiCue, sendCommand],
  );
}

function useFrontBusinessCommandHandler(
  playUiCue: AudioManager['playUiCue'],
  sendCommand: (command: EngineActionCommand) => void,
  type:
    | 'PURCHASE_FRONT_BUSINESS'
    | 'UPGRADE_FRONT_BUSINESS'
    | 'TOGGLE_FRONT_BUSINESS_MODE',
): (frontBusinessId: FrontBusinessId) => void {
  return useCallback(
    (frontBusinessId: FrontBusinessId) => {
      playUiCue('scanClick');
      sendCommand({ type, payload: { frontBusinessId } });
    },
    [playUiCue, sendCommand, type],
  );
}

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
  toggleLaundering: () => void;
  toggleLaunderProfile: () => void;
  purchaseFrontBusiness: (frontBusinessId: FrontBusinessId) => void;
  upgradeFrontBusiness: (frontBusinessId: FrontBusinessId) => void;
  toggleFrontBusinessMode: (frontBusinessId: FrontBusinessId) => void;
  triggerFbiCountermeasure: () => void;
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

  const sendScan = useSimpleCommandHandler(playUiCue, sendCommand, 'SCAN');
  const sendExploit = useSimpleCommandHandler(playUiCue, sendCommand, 'EXPLOIT', 'exploitClick');
  const purchaseUpgrade = useUpgradeCommandHandler(playUiCue, sendCommand);
  const toggleMonetize = useSimpleCommandHandler(playUiCue, sendCommand, 'TOGGLE_MONETIZE');
  const toggleLaundering = useSimpleCommandHandler(playUiCue, sendCommand, 'TOGGLE_LAUNDERING');
  const toggleLaunderProfile = useSimpleCommandHandler(playUiCue, sendCommand, 'TOGGLE_LAUNDER_PROFILE');
  const purchaseFrontBusiness = useFrontBusinessCommandHandler(
    playUiCue,
    sendCommand,
    'PURCHASE_FRONT_BUSINESS',
  );
  const upgradeFrontBusiness = useFrontBusinessCommandHandler(
    playUiCue,
    sendCommand,
    'UPGRADE_FRONT_BUSINESS',
  );
  const toggleFrontBusinessMode = useFrontBusinessCommandHandler(
    playUiCue,
    sendCommand,
    'TOGGLE_FRONT_BUSINESS_MODE',
  );
  const triggerFbiCountermeasure = useSimpleCommandHandler(
    playUiCue,
    sendCommand,
    'FBI_COUNTERMEASURE',
  );
  const investTranche = useSimpleCommandHandler(playUiCue, sendCommand, 'INVEST_TRANCHE');
  const cashoutPortfolio = useSimpleCommandHandler(playUiCue, sendCommand, 'CASHOUT_PORTFOLIO');
  const toggleInvestMode = useSimpleCommandHandler(playUiCue, sendCommand, 'TOGGLE_INVEST_MODE');
  const processMessage = useSimpleCommandHandler(playUiCue, sendCommand, 'MESSAGE_PROCESS');
  const quarantineMessage = useSimpleCommandHandler(playUiCue, sendCommand, 'MESSAGE_QUARANTINE');
  const warAttack = useSimpleCommandHandler(playUiCue, sendCommand, 'WAR_ATTACK');
  const warScrub = useSimpleCommandHandler(playUiCue, sendCommand, 'WAR_SCRUB');
  const warFortify = useSimpleCommandHandler(playUiCue, sendCommand, 'WAR_FORTIFY');
  const matrixArm = useSimpleCommandHandler(playUiCue, sendCommand, 'MATRIX_ARM');

  const matrixInject = useCallback(() => {
    playUiCue('scanClick');
    sendCommand({ type: 'MATRIX_INJECT', payload: { commandText: matrixCommand } });
    setMatrixCommand('');
  }, [matrixCommand, playUiCue, sendCommand, setMatrixCommand]);

  const matrixStabilize = useSimpleCommandHandler(playUiCue, sendCommand, 'MATRIX_STABILIZE');

  return {
    sendScan,
    sendExploit,
    purchaseUpgrade,
    toggleMonetize,
    toggleLaundering,
    toggleLaunderProfile,
    purchaseFrontBusiness,
    upgradeFrontBusiness,
    toggleFrontBusinessMode,
    triggerFbiCountermeasure,
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