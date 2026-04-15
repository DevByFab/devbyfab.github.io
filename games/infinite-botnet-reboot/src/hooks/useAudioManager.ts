import { useEffect, useRef, useState } from 'react';

export interface AudioSettings {
  master: number;
  ui: number;
  sfx: number;
  music: number;
  ambience: number;
}

export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  master: 80,
  ui: 70,
  sfx: 78,
  music: 58,
  ambience: 62,
};

type UiCue =
  | 'scanClick'
  | 'exploitClick'
  | 'upgradeBuy'
  | 'settingsOpen'
  | 'settingsClose'
  | 'error';

type EventCue =
  | 'targetFound'
  | 'exploitSuccess'
  | 'exploitFail'
  | 'marketUnlock'
  | 'phaseShift'
  | 'incomingMessage';

type StingerCue =
  | 'upgradeTier2'
  | 'upgradeTier3'
  | 'marketTier2'
  | 'loreBotnetDiscovery';

interface AudioManifest {
  ui: Record<string, string>;
  events: Record<string, string>;
  ambience: Record<string, string>;
  stingers: Record<string, string>;
}

export interface AudioManager {
  playUiCue: (cue: UiCue) => void;
  playEventCue: (cue: EventCue) => void;
  playStingerCue: (cue: StingerCue) => void;
  playErrorCue: () => void;
}

function clampVolumePercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 100) return 100;
  return Math.round(value);
}

function makeVolume(settings: AudioSettings, channel: keyof AudioSettings): number {
  const master = clampVolumePercent(settings.master) / 100;
  const channelVolume = clampVolumePercent(settings[channel]) / 100;
  const volume = master * channelVolume;
  if (volume < 0) return 0;
  if (volume > 1) return 1;
  return volume;
}

export function useAudioManager(settings: AudioSettings): AudioManager {
  const [manifestReady, setManifestReady] = useState(false);
  const settingsRef = useRef(settings);
  const manifestRef = useRef<AudioManifest | null>(null);
  const oneShotCacheRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const ambienceRef = useRef<HTMLAudioElement | null>(null);
  const unlockedRef = useRef(false);
  const baseUrlRef = useRef(new URL('../../audio/', import.meta.url).toString());

  useEffect(() => {
    settingsRef.current = settings;

    const ambience = ambienceRef.current;
    if (!ambience) return;

    ambience.volume = makeVolume(settings, 'ambience');
  }, [settings]);

  useEffect(() => {
    let cancelled = false;

    const loadManifest = async () => {
      try {
        const manifestUrl = new URL('../../audio/manifest.example.json', import.meta.url).toString();
        const response = await fetch(manifestUrl);
        if (!response.ok) return;

        const data = (await response.json()) as AudioManifest;
        if (cancelled) return;
        manifestRef.current = data;
        setManifestReady(true);
      } catch {
        // Silent fallback: audio is optional and must never break gameplay.
      }
    };

    loadManifest();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!manifestReady || !unlockedRef.current) return;
    if (ambienceRef.current !== null) return;

    const manifest = manifestRef.current;
    const ambienceFile = manifest?.ambience.main;
    if (!ambienceFile) return;

    const ambienceUrl = baseUrlRef.current + ambienceFile;
    const ambience = new Audio(ambienceUrl);
    ambience.loop = true;
    ambience.preload = 'auto';
    ambience.volume = makeVolume(settingsRef.current, 'ambience');
    ambienceRef.current = ambience;
    ambience.play().catch(() => {
      // Browser can still block; next interaction can retry implicitly via future commands.
    });
  }, [manifestReady]);

  useEffect(() => {
    const unlockAudio = () => {
      if (unlockedRef.current) return;
      unlockedRef.current = true;
      const manifest = manifestRef.current;
      const ambienceFile = manifest?.ambience.main;
      if (!ambienceFile) return;

      const ambienceUrl = baseUrlRef.current + ambienceFile;
      const ambience = new Audio(ambienceUrl);
      ambience.loop = true;
      ambience.preload = 'auto';
      ambience.volume = makeVolume(settingsRef.current, 'ambience');
      ambienceRef.current = ambience;
      ambience.play().catch(() => {
        // Browser can still block; next interaction can retry implicitly via future commands.
      });
    };

    window.addEventListener('pointerdown', unlockAudio, { once: true });
    window.addEventListener('keydown', unlockAudio, { once: true });

    return () => {
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
  }, []);

  useEffect(() => {
    return () => {
      const ambience = ambienceRef.current;
      if (ambience) {
        ambience.pause();
        ambienceRef.current = null;
      }

      oneShotCacheRef.current.clear();
    };
  }, []);

  const playOneShot = (
    bucket: keyof AudioManifest,
    cue: string,
    channel: keyof AudioSettings,
  ) => {
    if (!unlockedRef.current) return;

    const manifest = manifestRef.current;
    if (!manifest) return;

    const fileName = manifest[bucket]?.[cue];
    if (!fileName) return;

    const url = baseUrlRef.current + fileName;

    let cached = oneShotCacheRef.current.get(url);
    if (!cached) {
      cached = new Audio(url);
      cached.preload = 'auto';
      oneShotCacheRef.current.set(url, cached);
    }

    const instance = cached.cloneNode(true) as HTMLAudioElement;
    instance.volume = makeVolume(settingsRef.current, channel);
    instance.play().catch(() => {
      // Ignore runtime play failures to avoid breaking command flow.
    });
  };

  const playUiCue = (cue: UiCue) => {
    playOneShot('ui', cue, 'ui');
  };

  const playEventCue = (cue: EventCue) => {
    playOneShot('events', cue, 'sfx');
  };

  const playStingerCue = (cue: StingerCue) => {
    playOneShot('stingers', cue, 'sfx');
  };

  const playErrorCue = () => {
    playOneShot('ui', 'error', 'ui');
  };

  return {
    playUiCue,
    playEventCue,
    playStingerCue,
    playErrorCue,
  };
}
