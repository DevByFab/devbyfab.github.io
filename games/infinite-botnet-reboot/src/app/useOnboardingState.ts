import { useCallback, useEffect, useState } from 'react';
import {
  INTRO_LORE_STORAGE_KEY,
  INTRO_TUTORIAL_STORAGE_KEY,
} from './constants';
import {
  getGuideStepsForPhase,
  type DashboardTab,
  type GuideStepDefinition,
} from './navigationConfig';
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
  guideSteps: ReadonlyArray<GuideStepDefinition>;
  guideStepIndex: number;
  setGuideStepIndex: React.Dispatch<React.SetStateAction<number>>;
  setGuideMarkSeenOnClose: React.Dispatch<React.SetStateAction<boolean>>;
  startGuideCore: (markSeenOnClose: boolean, phaseIndex: number) => void;
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
  const [guideSteps, setGuideSteps] = useState<ReadonlyArray<GuideStepDefinition>>(() =>
    getGuideStepsForPhase(0),
  );
  const [guideMarkSeenOnClose, setGuideMarkSeenOnClose] = useState(false);

  const resolveGuideSteps = useCallback((phaseIndex: number): ReadonlyArray<GuideStepDefinition> => {
    const steps = getGuideStepsForPhase(phaseIndex);
    setGuideSteps(steps);
    return steps;
  }, []);

  useEffect(() => {
    if (!snapshot || introBootstrapped) return;

    const loreSeen = readBooleanFlag(INTRO_LORE_STORAGE_KEY);
    const tutorialSeen = readBooleanFlag(INTRO_TUTORIAL_STORAGE_KEY);

    const bootstrap = window.setTimeout(() => {
      if (!loreSeen) {
        resetLoreScene();
        setIntroStep('lore');
      } else if (!tutorialSeen) {
        const initialGuideSteps = resolveGuideSteps(snapshot.phase.index);
        setActiveTab(initialGuideSteps[0].tab);
        setGuideStepIndex(0);
        setGuideMarkSeenOnClose(true);
        setGuideActive(true);
      }

      setIntroBootstrapped(true);
    }, 0);

    return () => {
      window.clearTimeout(bootstrap);
    };
  }, [introBootstrapped, resetLoreScene, resolveGuideSteps, setActiveTab, snapshot]);

  const activateGuideStep = useCallback(
    (index: number, stepsOverride?: ReadonlyArray<GuideStepDefinition>) => {
      const steps = stepsOverride ?? guideSteps;
      const bounded = Math.max(0, Math.min(steps.length - 1, index));
      const step = steps[bounded];
      setActiveTab(step.tab);
      setGuideStepIndex(bounded);
    },
    [guideSteps, setActiveTab],
  );

  const startGuideCore = useCallback(
    (markSeenOnClose: boolean, phaseIndex: number) => {
      setIntroStep(null);
      const steps = resolveGuideSteps(phaseIndex);
      activateGuideStep(0, steps);
      setGuideMarkSeenOnClose(markSeenOnClose);
      setGuideActive(true);
    },
    [activateGuideStep, resolveGuideSteps],
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
    if (guideStepIndex >= guideSteps.length - 1) {
      closeGuideCore(true);
      return;
    }

    activateGuideStep(guideStepIndex + 1);
  }, [activateGuideStep, closeGuideCore, guideStepIndex, guideSteps.length]);

  return {
    introStep,
    setIntroStep,
    guideActive,
    setGuideActive,
    guideSteps,
    guideStepIndex,
    setGuideStepIndex,
    setGuideMarkSeenOnClose,
    startGuideCore,
    closeGuideCore,
    goGuidePrevCore,
    goGuideNextCore,
  };
}
