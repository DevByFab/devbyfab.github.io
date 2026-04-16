import { useEffect, useRef } from 'react';
import type { LogLine } from '../game/types';
import type { AudioManager } from '../hooks/useAudioManager';

interface UseAudioLogCuesParams {
  logs: LogLine[];
  playUiCue: AudioManager['playUiCue'];
  playEventCue: AudioManager['playEventCue'];
  playStingerCue: AudioManager['playStingerCue'];
  playErrorCue: AudioManager['playErrorCue'];
}

export function useAudioLogCues(params: Readonly<UseAudioLogCuesParams>): void {
  const lastAudioLogIdRef = useRef<string | null>(null);

  useEffect(() => {
    const line = params.logs.at(-1);
    if (!line) return;

    if (lastAudioLogIdRef.current === line.id) return;
    lastAudioLogIdRef.current = line.id;

    let hasDedicatedFailureCue = false;

    if (line.text.includes('Upgrade achetee')) {
      params.playUiCue('upgradeBuy');
      params.playStingerCue('upgradeTier2');
    }

    if (line.text.includes('Scan manuel: cible ajoutee')) {
      params.playEventCue('targetFound');
    }

    if (line.text.includes('Phase atteinte')) {
      params.playEventCue('phaseShift');
    }

    if (line.text.includes('Nouveau message intercepte')) {
      params.playEventCue('incomingMessage');
    }

    if (line.text.includes('Exploit reussi')) {
      params.playEventCue('exploitSuccess');
    }

    if (line.text.includes('Exploit rate') || line.text.includes('Exploit bloque')) {
      hasDedicatedFailureCue = true;
      params.playEventCue('exploitFail');
    }

    if ((line.severity === 'warn' || line.severity === 'error') && !hasDedicatedFailureCue) {
      params.playErrorCue();
    }
  }, [params]);
}
