import { useEffect, useRef, useState } from 'react';
import type { GameSnapshot } from '../game/types';
import { PHASE_TUTORIALS_STORAGE_KEY } from './constants';
import {
  readSeenPhaseTutorialIndexes,
  writeSeenPhaseTutorialIndexes,
} from './storage';

interface UsePhaseTutorialAutoStartArgs {
  snapshot: GameSnapshot | null;
  introStep: 'lore' | null;
  guideActive: boolean;
  startGuide: (markSeenOnClose: boolean, phaseIndex: number) => void;
}

function isSupportedPhaseTutorial(phaseIndex: number): boolean {
  return phaseIndex >= 1 && phaseIndex <= 2;
}

export function usePhaseTutorialAutoStart(
  args: Readonly<UsePhaseTutorialAutoStartArgs>,
): void {
  const { snapshot, introStep, guideActive, startGuide } = args;
  const lastPhaseIndexRef = useRef<number | null>(null);
  const [seenPhaseTutorials, setSeenPhaseTutorials] = useState<number[]>(() =>
    readSeenPhaseTutorialIndexes(PHASE_TUTORIALS_STORAGE_KEY),
  );

  useEffect(() => {
    if (!snapshot) {
      return;
    }

    const currentPhaseIndex = snapshot.phase.index;
    const lastPhaseIndex = lastPhaseIndexRef.current;
    if (lastPhaseIndex === null) {
      lastPhaseIndexRef.current = currentPhaseIndex;
      return;
    }

    if (currentPhaseIndex <= lastPhaseIndex) {
      return;
    }

    lastPhaseIndexRef.current = currentPhaseIndex;

    if (!isSupportedPhaseTutorial(currentPhaseIndex)) {
      return;
    }

    if (introStep !== null || guideActive) {
      return;
    }

    if (seenPhaseTutorials.includes(currentPhaseIndex)) {
      return;
    }

    const nextSeen = [...seenPhaseTutorials, currentPhaseIndex];

    const timer = window.setTimeout(() => {
      setSeenPhaseTutorials(nextSeen);
      writeSeenPhaseTutorialIndexes(PHASE_TUTORIALS_STORAGE_KEY, nextSeen);
      startGuide(true, currentPhaseIndex);
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [guideActive, introStep, seenPhaseTutorials, snapshot, startGuide]);
}
