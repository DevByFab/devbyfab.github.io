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
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return DEFAULT_AUDIO_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<AudioSettings>;

    return {
      master: clampAudio(parsed.master),
      ui: clampAudio(parsed.ui),
      sfx: clampAudio(parsed.sfx),
      music: clampAudio(parsed.music),
      ambience: clampAudio(parsed.ambience),
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
