import { useEffect, useRef } from 'react';
import type { EngineActionCommand } from '../game/protocol';
import type { GameSnapshot } from '../game/types';
import { hasOwnedUpgrade } from './upgrades';

const HOTKEY_MIN_INTERVAL_MS = 90;

interface UseGameplayHotkeysParams {
  snapshot: GameSnapshot | null;
  playUiCue: (cue: 'scanClick' | 'exploitClick') => void;
  sendCommand: (command: EngineActionCommand) => void;
}

export function useGameplayHotkeys(params: Readonly<UseGameplayHotkeysParams>): void {
  const lastHotkeyAtRef = useRef(0);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const currentSnapshot = params.snapshot;
      if (!currentSnapshot) {
        return;
      }

      if (event.repeat) {
        return;
      }

      const key = event.key.toLowerCase();
      if (key !== 'enter' && key !== 'x') {
        return;
      }

      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      ) {
        return;
      }

      const nowMs = performance.now();
      if (nowMs - lastHotkeyAtRef.current < HOTKEY_MIN_INTERVAL_MS) {
        return;
      }
      lastHotkeyAtRef.current = nowMs;

      if (key === 'enter') {
        event.preventDefault();
        params.playUiCue('scanClick');
        params.sendCommand({ type: 'SCAN' });
        return;
      }

      const exploitHotkeyUnlocked = hasOwnedUpgrade(
        currentSnapshot.upgrades.offers,
        'qol-operator-macros',
      );
      if (!exploitHotkeyUnlocked) {
        return;
      }

      if (
        BigInt(currentSnapshot.resources.queuedTargets) <= 0n ||
        currentSnapshot.economy.exploitCooldownMs > 0
      ) {
        return;
      }

      event.preventDefault();
      params.playUiCue('exploitClick');
      params.sendCommand({ type: 'EXPLOIT' });
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [params]);
}
