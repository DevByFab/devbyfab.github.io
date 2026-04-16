import { useCallback, useEffect, useState } from 'react';
import {
  INTRO_LORE_STORAGE_KEY,
  INTRO_TUTORIAL_STORAGE_KEY,
} from './constants';
import { GUIDE_STEPS, type DashboardTab } from './navigationConfig';
import { readBooleanFlag, writeBooleanFlag } from './storage';
import type { GameSnapshot } from '../game/types';

interface UseOnboardingStateParams {
  snapshot: GameSnapshot | null;
  setActiveTab: React.Dispatch<React.SetStateAction<DashboardTab>>;
  resetLoreScene: () => void;
}

export interface OnboardingState {
  introStep: 'lore' | null;
  setIntroStep: React.Dispatch<React.SetStateAction<'lore' | null>>;
  guideActive: boolean;
  setGuideActive: React.Dispatch<React.SetStateAction<boolean>>;
  guideStepIndex: number;
  setGuideStepIndex: React.Dispatch<React.SetStateAction<number>>;
  setGuideMarkSeenOnClose: React.Dispatch<React.SetStateAction<boolean>>;
  startGuideCore: (markSeenOnClose: boolean) => void;
  closeGuideCore: (forceMarkAsSeen: boolean) => void;
  goGuidePrevCore: () => void;
  goGuideNextCore: () => void;
}

export function useOnboardingState(params: Readonly<UseOnboardingStateParams>): OnboardingState {
  const { snapshot, setActiveTab, resetLoreScene } = params;
  const [introStep, setIntroStep] = useState<'lore' | null>(null);
  const [introBootstrapped, setIntroBootstrapped] = useState(false);
  const [guideActive, setGuideActive] = useState(false);
  const [guideStepIndex, setGuideStepIndex] = useState(0);
  const [guideMarkSeenOnClose, setGuideMarkSeenOnClose] = useState(false);

  useEffect(() => {
    if (!snapshot || introBootstrapped) return;

    const loreSeen = readBooleanFlag(INTRO_LORE_STORAGE_KEY);
    const tutorialSeen = readBooleanFlag(INTRO_TUTORIAL_STORAGE_KEY);

    const bootstrap = window.setTimeout(() => {
      if (!loreSeen) {
        resetLoreScene();
        setIntroStep('lore');
      } else if (!tutorialSeen) {
        setActiveTab(GUIDE_STEPS[0].tab);
        setGuideStepIndex(0);
        setGuideMarkSeenOnClose(true);
        setGuideActive(true);
      }

      setIntroBootstrapped(true);
    }, 0);

    return () => {
      window.clearTimeout(bootstrap);
    };
  }, [introBootstrapped, resetLoreScene, setActiveTab, snapshot]);

  const activateGuideStep = useCallback(
    (index: number) => {
      const bounded = Math.max(0, Math.min(GUIDE_STEPS.length - 1, index));
      const step = GUIDE_STEPS[bounded];
      setActiveTab(step.tab);
      setGuideStepIndex(bounded);
    },
    [setActiveTab],
  );

  const startGuideCore = useCallback(
    (markSeenOnClose: boolean) => {
      setIntroStep(null);
      activateGuideStep(0);
      setGuideMarkSeenOnClose(markSeenOnClose);
      setGuideActive(true);
    },
    [activateGuideStep],
  );

  const closeGuideCore = useCallback(
    (forceMarkAsSeen: boolean) => {
      if (forceMarkAsSeen || guideMarkSeenOnClose) {
        writeBooleanFlag(INTRO_TUTORIAL_STORAGE_KEY);
      }

      setGuideActive(false);
      setGuideStepIndex(0);
      setGuideMarkSeenOnClose(false);
      setActiveTab('dashboard');
    },
    [guideMarkSeenOnClose, setActiveTab],
  );

  const goGuidePrevCore = useCallback(() => {
    activateGuideStep(guideStepIndex - 1);
  }, [activateGuideStep, guideStepIndex]);

  const goGuideNextCore = useCallback(() => {
    if (guideStepIndex >= GUIDE_STEPS.length - 1) {
      closeGuideCore(true);
      return;
    }

    activateGuideStep(guideStepIndex + 1);
  }, [activateGuideStep, closeGuideCore, guideStepIndex]);

  return {
    introStep,
    setIntroStep,
    guideActive,
    setGuideActive,
    guideStepIndex,
    setGuideStepIndex,
    setGuideMarkSeenOnClose,
    startGuideCore,
    closeGuideCore,
    goGuidePrevCore,
    goGuideNextCore,
  };
}
