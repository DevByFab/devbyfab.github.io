export interface DebugPhaseAccessOption {
	phaseIndex: number;
	labelKey: string;
	enabled: boolean;
}

export const DEBUG_PHASE_ACCESS_MAX_INDEX = 5;

export const DEBUG_PHASE_ACCESS_OPTIONS: ReadonlyArray<DebugPhaseAccessOption> = [
	{ phaseIndex: 0, labelKey: 'reboot.settings.debugPhase.option.p0', enabled: true },
	{ phaseIndex: 1, labelKey: 'reboot.settings.debugPhase.option.p1', enabled: true },
	{ phaseIndex: 2, labelKey: 'reboot.settings.debugPhase.option.p2', enabled: true },
	{ phaseIndex: 3, labelKey: 'reboot.settings.debugPhase.option.p3', enabled: true },
	{ phaseIndex: 4, labelKey: 'reboot.settings.debugPhase.option.p4', enabled: true },
	{ phaseIndex: 5, labelKey: 'reboot.settings.debugPhase.option.p5', enabled: true },
];

export const INTRO_LORE_STORAGE_KEY = 'ibr_intro_lore_v1';
export const INTRO_TUTORIAL_STORAGE_KEY = 'ibr_intro_tutorial_v1';
export const PHASE_TUTORIALS_STORAGE_KEY = 'ibr_phase_tutorials_v1';
export const UNLOCK_HINT_STORAGE_KEY = 'ibr_unlock_hints_v1';
export const AUDIO_SETTINGS_STORAGE_KEY = 'ibr_audio_settings_v1';
export const GAME_SAVE_STORAGE_KEY = 'ibr_game_save_v1';
export const GAME_SAVE_SCHEMA_VERSION = 2;
export const GAME_AUTOSAVE_INTERVAL_MS = 10_000;
/** Le moteur tourne à 10 Hz mais n'envoie l'état à l'interface que 4 fois par seconde. */
export const GAME_SNAPSHOT_INTERVAL_MS = 250;

export const LORE_MIN_READ_MS = 0;
export const LORE_TRANSITION_MS = 340;
export const LORE_BRIDGE_MS = 900;
