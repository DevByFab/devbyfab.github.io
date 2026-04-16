import { useCallback, type Dispatch, type SetStateAction } from 'react';
import type { AudioManager } from '../hooks/useAudioManager';
import { INTRO_LORE_STORAGE_KEY, INTRO_TUTORIAL_STORAGE_KEY } from './constants';
import type { GuideRect } from './guideLayout';
import type { DashboardTab } from './navigationConfig';
import { readBooleanFlag, writeBooleanFlag } from './storage';

interface UseOnboardingActionsArgs {
  playUiCue: AudioManager['playUiCue'];
  playErrorCue: AudioManager['playErrorCue'];
  loreReadReady: boolean;
  resetLoreScene: () => void;
  setSettingsOpen: Dispatch<SetStateAction<boolean>>;
  setUnlockHintId: Dispatch<SetStateAction<string | null>>;
  setGuideRect: Dispatch<SetStateAction<GuideRect | null>>;
  setGuideActive: Dispatch<SetStateAction<boolean>>;
  setGuideMarkSeenOnClose: Dispatch<SetStateAction<boolean>>;
  setActiveTab: Dispatch<SetStateAction<DashboardTab>>;
  setIntroStep: Dispatch<SetStateAction<'lore' | null>>;
  startGuideCore: (markSeenOnClose: boolean) => void;
  closeGuideCore: (forceMarkAsSeen: boolean) => void;
  goGuidePrevCore: () => void;
  goGuideNextCore: () => void;
}

interface UseOnboardingActionsResult {
  startGuide: (markSeenOnClose: boolean) => void;
  closeGuide: (forceMarkAsSeen: boolean) => void;
  continueFromLore: () => void;
  skipIntro: () => void;
  goGuidePrev: () => void;
  goGuideNext: () => void;
  openSettings: () => void;
  closeSettings: () => void;
  replayLoreFromSettings: () => void;
  replayTutorialFromSettings: () => void;
}

export function useOnboardingActions(
  args: Readonly<UseOnboardingActionsArgs>,
): UseOnboardingActionsResult {
  const {
    playUiCue,
    playErrorCue,
    loreReadReady,
    resetLoreScene,
    setSettingsOpen,
    setUnlockHintId,
    setGuideRect,
    setGuideActive,
    setGuideMarkSeenOnClose,
    setActiveTab,
    setIntroStep,
    startGuideCore,
    closeGuideCore,
    goGuidePrevCore,
    goGuideNextCore,
  } = args;

  const startGuide = useCallback(
    (markSeenOnClose: boolean) => {
      setSettingsOpen(false);
      setUnlockHintId(null);
      startGuideCore(markSeenOnClose);
    },
    [setSettingsOpen, setUnlockHintId, startGuideCore],
  );

  const closeGuide = useCallback(
    (forceMarkAsSeen: boolean) => {
      closeGuideCore(forceMarkAsSeen);
      setGuideRect(null);
    },
    [closeGuideCore, setGuideRect],
  );

  const continueFromLore = useCallback(() => {
    if (!loreReadReady) {
      playErrorCue();
      return;
    }

    writeBooleanFlag(INTRO_LORE_STORAGE_KEY);

    if (readBooleanFlag(INTRO_TUTORIAL_STORAGE_KEY)) {
      setIntroStep(null);
      return;
    }

    startGuide(true);
  }, [loreReadReady, playErrorCue, setIntroStep, startGuide]);

  const skipIntro = useCallback(() => {
    writeBooleanFlag(INTRO_LORE_STORAGE_KEY);
    closeGuideCore(true);
    setIntroStep(null);
    setGuideMarkSeenOnClose(false);
  }, [closeGuideCore, setGuideMarkSeenOnClose, setIntroStep]);

  const goGuidePrev = useCallback(() => {
    goGuidePrevCore();
  }, [goGuidePrevCore]);

  const goGuideNext = useCallback(() => {
    goGuideNextCore();
  }, [goGuideNextCore]);

  const openSettings = useCallback(() => {
    playUiCue('settingsOpen');
    setSettingsOpen(true);
  }, [playUiCue, setSettingsOpen]);

  const closeSettings = useCallback(() => {
    playUiCue('settingsClose');
    setSettingsOpen(false);
  }, [playUiCue, setSettingsOpen]);

  const replayLoreFromSettings = useCallback(() => {
    closeSettings();
    setGuideActive(false);
    setGuideMarkSeenOnClose(false);
    setActiveTab('dashboard');
    resetLoreScene();
    setIntroStep('lore');
  }, [
    closeSettings,
    resetLoreScene,
    setActiveTab,
    setGuideActive,
    setGuideMarkSeenOnClose,
    setIntroStep,
  ]);

  const replayTutorialFromSettings = useCallback(() => {
    closeSettings();
    startGuide(false);
  }, [closeSettings, startGuide]);

  return {
    startGuide,
    closeGuide,
    continueFromLore,
    skipIntro,
    goGuidePrev,
    goGuideNext,
    openSettings,
    closeSettings,
    replayLoreFromSettings,
    replayTutorialFromSettings,
  };
}