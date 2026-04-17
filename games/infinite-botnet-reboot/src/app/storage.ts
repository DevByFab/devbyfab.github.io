import { DEFAULT_AUDIO_SETTINGS, type AudioSettings } from '../hooks/useAudioManager';

export function clampAudio(value: unknown): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(100, Math.round(numeric)));
}

export function readBooleanFlag(key: string): boolean {
  try {
    return window.localStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}

export function writeBooleanFlag(key: string): void {
  try {
    window.localStorage.setItem(key, '1');
  } catch {
    // Ignore storage errors in restrictive browser contexts.
  }
}

export function readUnlockHints(storageKey: string): string[] {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === 'string');
  } catch {
    return [];
  }
}

export function writeUnlockHints(storageKey: string, hints: string[]): void {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(hints));
  } catch {
    // Ignore storage errors in restrictive browser contexts.
  }
}

export function readAudioSettings(storageKey: string): AudioSettings {
  const readChannel = (value: unknown, fallback: number): number => {
    if (value === undefined || value === null) return fallback;
    return clampAudio(value);
  };

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return DEFAULT_AUDIO_SETTINGS;

    const parsedValue = JSON.parse(raw) as unknown;
    const parsed =
      parsedValue && typeof parsedValue === 'object'
        ? (parsedValue as Partial<AudioSettings>)
        : ({} as Partial<AudioSettings>);

    return {
      master: readChannel(parsed.master, DEFAULT_AUDIO_SETTINGS.master),
      ui: readChannel(parsed.ui, DEFAULT_AUDIO_SETTINGS.ui),
      sfx: readChannel(parsed.sfx, DEFAULT_AUDIO_SETTINGS.sfx),
      music: readChannel(parsed.music, DEFAULT_AUDIO_SETTINGS.music),
      ambience: readChannel(parsed.ambience, DEFAULT_AUDIO_SETTINGS.ambience),
    };
  } catch {
    return DEFAULT_AUDIO_SETTINGS;
  }
}

export function writeAudioSettings(storageKey: string, value: AudioSettings): void {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(value));
  } catch {
    // Ignore storage errors in restrictive browser contexts.
  }
}
