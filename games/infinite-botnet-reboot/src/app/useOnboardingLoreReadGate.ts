import { useEffect, useState } from 'react';
import { LORE_MIN_READ_MS } from './constants';

interface UseOnboardingLoreReadGateArgs {
  introStep: 'lore' | null;
  loreSceneIndex: number;
}

interface UseOnboardingLoreReadGateResult {
  loreReadReady: boolean;
  loreReadRemainingMs: number;
}

export function useOnboardingLoreReadGate(
  args: Readonly<UseOnboardingLoreReadGateArgs>,
): UseOnboardingLoreReadGateResult {
  const [loreReadRemainingMs, setLoreReadRemainingMs] = useState(0);

  useEffect(() => {
    if (args.introStep !== 'lore') {
      const resetTimer = window.setTimeout(() => {
        setLoreReadRemainingMs(0);
      }, 0);

      return () => {
        window.clearTimeout(resetTimer);
      };
    }

    const gateEndsAt = Date.now() + LORE_MIN_READ_MS;
    const updateReadGate = () => {
      const remaining = Math.max(0, gateEndsAt - Date.now());
      setLoreReadRemainingMs(remaining);
    };

    updateReadGate();
    const timer = window.setInterval(updateReadGate, 80);

    return () => {
      window.clearInterval(timer);
    };
  }, [args.introStep, args.loreSceneIndex]);

  return {
    loreReadReady: loreReadRemainingMs <= 0,
    loreReadRemainingMs,
  };
}
