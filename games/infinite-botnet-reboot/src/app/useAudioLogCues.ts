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

    const isExploitLog =
      line.text.includes('Exploit reussi') ||
      line.text.includes('Exploit rate') ||
      line.text.includes('Exploit bloque');

    if (line.text.includes('Upgrade achetee')) {
      params.playUiCue('upgradeBuy');
      params.playStingerCue('upgradeTier2');
    }

    if (line.text.includes('Phase atteinte')) {
      params.playEventCue('phaseShift');
    }

    if (line.text.includes('Nouveau message intercepte')) {
      params.playEventCue('incomingMessage');
    }

    if ((line.severity === 'warn' || line.severity === 'error') && !isExploitLog) {
      params.playErrorCue();
    }
  }, [params]);
}
