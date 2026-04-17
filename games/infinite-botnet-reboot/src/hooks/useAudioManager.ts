import { useEffect, useRef, useState } from 'react';

export interface AudioSettings {
  master: number;
  ui: number;
  sfx: number;
  music: number;
  ambience: number;
}

export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  master: 76,
  ui: 74,
  sfx: 84,
  music: 52,
  ambience: 48,
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

interface OneShotPool {
  players: HTMLAudioElement[];
  cursor: number;
}

const BUILTIN_AUDIO_URLS: Record<string, string> = {
  'achievement-unlocked.mp3': new URL('../../audio/achievement-unlocked.mp3', import.meta.url).toString(),
  'error-message.mp3': new URL('../../audio/error-message.mp3', import.meta.url).toString(),
  'level-up.mp3': new URL('../../audio/level-up.mp3', import.meta.url).toString(),
  'server-drone.mp3': new URL('../../audio/server-drone.mp3', import.meta.url).toString(),
  'ui-click.mp3': new URL('../../audio/ui-click.mp3', import.meta.url).toString(),
  'universfield-message-incoming.mp3': new URL(
    '../../audio/universfield-message-incoming.mp3',
    import.meta.url,
  ).toString(),
};

const BUILTIN_AUDIO_MANIFEST: AudioManifest = {
  ui: {
    scanClick: 'ui-click.mp3',
    exploitClick: 'ui-click.mp3',
    upgradeBuy: 'achievement-unlocked.mp3',
    settingsOpen: 'ui-click.mp3',
    settingsClose: 'ui-click.mp3',
    error: 'error-message.mp3',
  },
  events: {
    targetFound: 'ui-click.mp3',
    exploitSuccess: 'ui-click.mp3',
    exploitFail: 'error-message.mp3',
    marketUnlock: 'achievement-unlocked.mp3',
    phaseShift: 'level-up.mp3',
    incomingMessage: 'universfield-message-incoming.mp3',
  },
  ambience: {
    main: 'server-drone.mp3',
  },
  stingers: {
    upgradeTier2: 'achievement-unlocked.mp3',
    upgradeTier3: 'level-up.mp3',
    marketTier2: 'level-up.mp3',
    loreBotnetDiscovery: 'level-up.mp3',
  },
};

const ONE_SHOT_POOL_SIZE = 4;
const ONE_SHOT_MIN_INTERVAL_MS = 45;

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

function createAudioBasePath(basePath: string): string {
  if (basePath.length === 0) return '/audio/';
  const normalized = basePath.endsWith('/') ? basePath : `${basePath}/`;
  return `${normalized}audio/`;
}

function resolveAudioUrl(audioBasePath: string, fileName: string): string {
  const bundledAssetUrl = BUILTIN_AUDIO_URLS[fileName];
  if (bundledAssetUrl) return bundledAssetUrl;

  if (/^https?:\/\//i.test(fileName) || fileName.startsWith('/')) {
    return fileName;
  }

  return `${audioBasePath}${fileName}`;
}

function resolveManifestCandidates(audioBasePath: string): string[] {
  return [
    `${audioBasePath}manifest.json`,
    `${audioBasePath}manifest.example.json`,
    new URL('../../audio/manifest.example.json', import.meta.url).toString(),
  ];
}

function warnAudioIssue(cache: Set<string>, code: string, details?: unknown): void {
  if (cache.has(code)) return;
  cache.add(code);

  if (details === undefined) {
    console.warn(`[audio] ${code}`);
    return;
  }

  console.warn(`[audio] ${code}`, details);
}

function createOneShotPool(url: string): OneShotPool {
  const players: HTMLAudioElement[] = [];

  for (let index = 0; index < ONE_SHOT_POOL_SIZE; index += 1) {
    const player = new Audio(url);
    player.preload = 'auto';
    player.load();
    players.push(player);
  }

  return {
    players,
    cursor: 0,
  };
}

export function useAudioManager(settings: AudioSettings): AudioManager {
  const [manifestReady, setManifestReady] = useState(false);
  const settingsRef = useRef(settings);
  const manifestRef = useRef<AudioManifest | null>(null);
  const oneShotPoolRef = useRef<Map<string, OneShotPool>>(new Map());
  const lastCuePlayAtMsRef = useRef<Map<string, number>>(new Map());
  const ambienceRef = useRef<HTMLAudioElement | null>(null);
  const unlockedRef = useRef(false);
  const diagnosticsRef = useRef<Set<string>>(new Set());
  const audioBasePathRef = useRef(createAudioBasePath(import.meta.env.BASE_URL));

  useEffect(() => {
    settingsRef.current = settings;

    const ambience = ambienceRef.current;
    if (!ambience) return;

    ambience.volume = makeVolume(settings, 'ambience');
  }, [settings]);

  useEffect(() => {
    let cancelled = false;

    const loadManifest = async () => {
      const candidates = resolveManifestCandidates(audioBasePathRef.current);

      for (const manifestUrl of candidates) {
        try {
          const response = await fetch(manifestUrl);
          if (!response.ok) {
            warnAudioIssue(diagnosticsRef.current, `manifest-http-${response.status}-${manifestUrl}`);
            continue;
          }

          const data = (await response.json()) as AudioManifest;
          if (cancelled) return;
          manifestRef.current = data;
          setManifestReady(true);
          return;
        } catch (error) {
          warnAudioIssue(diagnosticsRef.current, `manifest-fetch-${manifestUrl}`, error);
        }
      }

      if (cancelled) return;
      manifestRef.current = BUILTIN_AUDIO_MANIFEST;
      setManifestReady(true);
      warnAudioIssue(diagnosticsRef.current, 'manifest-fallback-built-in');
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

    const ambienceUrl = resolveAudioUrl(audioBasePathRef.current, ambienceFile);
    const ambience = new Audio(ambienceUrl);
    ambience.loop = true;
    ambience.preload = 'auto';
    ambience.volume = makeVolume(settingsRef.current, 'ambience');
    ambienceRef.current = ambience;
    ambience.play().catch((error) => {
      warnAudioIssue(diagnosticsRef.current, 'ambience-autoplay-blocked', error);
    });
  }, [manifestReady]);

  useEffect(() => {
    const unlockAudio = () => {
      if (unlockedRef.current) return;
      unlockedRef.current = true;

      const existingAmbience = ambienceRef.current;
      if (existingAmbience) {
        existingAmbience.play().catch((error) => {
          warnAudioIssue(diagnosticsRef.current, 'ambience-resume-failed', error);
        });
        return;
      }

      const manifest = manifestRef.current;
      const ambienceFile = manifest?.ambience.main;
      if (!ambienceFile) return;

      const ambienceUrl = resolveAudioUrl(audioBasePathRef.current, ambienceFile);
      const ambience = new Audio(ambienceUrl);
      ambience.loop = true;
      ambience.preload = 'auto';
      ambience.volume = makeVolume(settingsRef.current, 'ambience');
      ambienceRef.current = ambience;
      ambience.play().catch((error) => {
        warnAudioIssue(diagnosticsRef.current, 'ambience-unlock-play-failed', error);
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
    if (!manifestReady) return;

    const manifest = manifestRef.current;
    if (!manifest) return;

    const poolCache = oneShotPoolRef.current;
    const resolvedUrls = new Set<string>();

    (['ui', 'events', 'stingers'] as const).forEach((bucket) => {
      Object.values(manifest[bucket]).forEach((fileName) => {
        const resolved = resolveAudioUrl(audioBasePathRef.current, fileName);
        resolvedUrls.add(resolved);
      });
    });

    resolvedUrls.forEach((url) => {
      if (poolCache.has(url)) return;
      poolCache.set(url, createOneShotPool(url));
    });
  }, [manifestReady]);

  useEffect(() => {
    const oneShotPoolCache = oneShotPoolRef.current;
    const cuePlayAtCache = lastCuePlayAtMsRef.current;

    return () => {
      const ambience = ambienceRef.current;
      if (ambience) {
        ambience.pause();
        ambienceRef.current = null;
      }

      oneShotPoolCache.clear();
      cuePlayAtCache.clear();
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

    const url = resolveAudioUrl(audioBasePathRef.current, fileName);
    const volume = makeVolume(settingsRef.current, channel);
    if (volume <= 0) return;

    const cueId = `${bucket}:${cue}`;
    const nowMs = performance.now();
    const previousPlayAtMs = lastCuePlayAtMsRef.current.get(cueId) ?? -Infinity;
    if (nowMs - previousPlayAtMs < ONE_SHOT_MIN_INTERVAL_MS) {
      return;
    }
    lastCuePlayAtMsRef.current.set(cueId, nowMs);

    let pool = oneShotPoolRef.current.get(url);
    if (!pool) {
      pool = createOneShotPool(url);
      oneShotPoolRef.current.set(url, pool);
    }

    const player = pool.players[pool.cursor];
    pool.cursor = (pool.cursor + 1) % pool.players.length;

    player.volume = volume;

    try {
      player.currentTime = 0;
    } catch {
      // Some browsers can throw if metadata isn't ready yet.
    }

    player.play().catch((error) => {
      warnAudioIssue(diagnosticsRef.current, `oneshot-play-failed-${bucket}-${cue}`, error);
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
