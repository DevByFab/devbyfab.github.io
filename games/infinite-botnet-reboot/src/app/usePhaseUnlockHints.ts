import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import type { GameSnapshot } from '../game/types';
import type { AudioManager } from '../hooks/useAudioManager';
import { UNLOCK_HINT_STORAGE_KEY } from './constants';
import { UNLOCK_HINTS, type UnlockHintDefinition } from './navigationConfig';
import { readUnlockHints, writeUnlockHints } from './storage';

interface UsePhaseUnlockHintsArgs {
  snapshot: GameSnapshot | null;
  playEventCue: AudioManager['playEventCue'];
  playStingerCue: AudioManager['playStingerCue'];
}

interface UsePhaseUnlockHintsResult {
  unlockHintId: string | null;
  setUnlockHintId: Dispatch<SetStateAction<string | null>>;
  currentUnlockHint: UnlockHintDefinition | null;
}

export function usePhaseUnlockHints(
  args: Readonly<UsePhaseUnlockHintsArgs>,
): UsePhaseUnlockHintsResult {
  const { snapshot, playEventCue, playStingerCue } = args;
  const lastPhaseIndexRef = useRef<number | null>(null);
  const [seenUnlockHints, setSeenUnlockHints] = useState<string[]>(() =>
    readUnlockHints(UNLOCK_HINT_STORAGE_KEY),
  );
  const [unlockHintId, setUnlockHintId] = useState<string | null>(null);

  useEffect(() => {
    if (!snapshot) {
      return;
    }

    const lastPhaseIndex = lastPhaseIndexRef.current;
    if (lastPhaseIndex === null) {
      lastPhaseIndexRef.current = snapshot.phase.index;
      return;
    }

    if (snapshot.phase.index <= lastPhaseIndex) {
      return;
    }

    if (lastPhaseIndex < 2 && snapshot.phase.index >= 2) {
      playEventCue('marketUnlock');
      playStingerCue('marketTier2');
    }

    lastPhaseIndexRef.current = snapshot.phase.index;

    const nextUnlockHint = UNLOCK_HINTS.find(
      (candidate) =>
        candidate.phase === snapshot.phase.index && !seenUnlockHints.includes(candidate.id),
    );

    if (!nextUnlockHint) {
      return;
    }

    const nextSeenUnlockHints = [...seenUnlockHints, nextUnlockHint.id];
    const updateHintStateTimer = window.setTimeout(() => {
      setSeenUnlockHints(nextSeenUnlockHints);
      writeUnlockHints(UNLOCK_HINT_STORAGE_KEY, nextSeenUnlockHints);
      setUnlockHintId(nextUnlockHint.id);
    }, 0);

    return () => {
      window.clearTimeout(updateHintStateTimer);
    };
  }, [playEventCue, playStingerCue, seenUnlockHints, snapshot]);

  const currentUnlockHint = useMemo(() => {
    if (unlockHintId === null) {
      return null;
    }

    return UNLOCK_HINTS.find((hint) => hint.id === unlockHintId) ?? null;
  }, [unlockHintId]);

  return {
    unlockHintId,
    setUnlockHintId,
    currentUnlockHint,
  };
}
