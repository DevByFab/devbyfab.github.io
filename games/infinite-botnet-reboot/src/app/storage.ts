import { DEFAULT_AUDIO_SETTINGS, type AudioSettings } from '../hooks/useAudioManager';
import type { PersistedGameState } from '../game/types';

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

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function isPersistedGameState(value: unknown): value is PersistedGameState {
  if (!isObjectRecord(value)) return false;

  const schemaVersion = value.schemaVersion;
  const savedAtMs = value.savedAtMs;
  const state = value.state;

  if (typeof schemaVersion !== 'number' || !Number.isInteger(schemaVersion) || schemaVersion <= 0) {
    return false;
  }
  if (typeof savedAtMs !== 'number' || !Number.isFinite(savedAtMs) || savedAtMs <= 0) {
    return false;
  }
  if (!isObjectRecord(state)) return false;

  return (
    Number.isInteger(state.version) &&
    Number.isInteger(state.tick) &&
    Number.isFinite(state.nowMs) &&
    Number.isFinite(state.turbo) &&
    isObjectRecord(state.resources) &&
    isObjectRecord(state.rates) &&
    isObjectRecord(state.systems) &&
    isObjectRecord(state.war) &&
    isObjectRecord(state.matrix) &&
    isObjectRecord(state.messages) &&
    isObjectRecord(state.upgrades) &&
    isObjectRecord(state.milestones) &&
    isObjectRecord(state.telemetry)
  );
}

export function readPersistedGameState(
  storageKey: string,
  expectedSchemaVersion: number,
): PersistedGameState | null {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as unknown;
    if (!isPersistedGameState(parsed)) {
      return null;
    }

    if (parsed.schemaVersion !== expectedSchemaVersion) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function writePersistedGameState(storageKey: string, payload: PersistedGameState): boolean {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

export function clearPersistedGameState(storageKey: string): void {
  try {
    window.localStorage.removeItem(storageKey);
  } catch {
    // Ignore storage errors in restrictive browser contexts.
  }
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index] ?? 0);
  }

  return window.btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

export function encodePersistedGameStateBase64(payload: PersistedGameState): string | null {
  try {
    const json = JSON.stringify(payload);
    const bytes = new TextEncoder().encode(json);
    return bytesToBase64(bytes);
  } catch {
    return null;
  }
}

export function decodePersistedGameStateBase64(
  payloadBase64: string,
  expectedSchemaVersion: number,
): PersistedGameState | null {
  try {
    const trimmed = payloadBase64.trim();
    if (!trimmed) return null;

    const bytes = base64ToBytes(trimmed);
    const json = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(json) as unknown;
    if (!isPersistedGameState(parsed)) {
      return null;
    }

    if (parsed.schemaVersion !== expectedSchemaVersion) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}
