import { TURBO_OPTIONS } from '../../app/constants';
import { formatBigValue } from '../../game/format';
import type { GameSnapshot } from '../../game/types';
import type { AudioSettings } from '../../hooks/useAudioManager';

type TranslateFn = (key: string, vars?: Record<string, string | number>) => string;

type AudioChannel = keyof AudioSettings;

const AUDIO_CHANNELS: ReadonlyArray<{ key: AudioChannel; labelKey: string }> = [
  { key: 'master', labelKey: 'reboot.settings.audio.master' },
  { key: 'ui', labelKey: 'reboot.settings.audio.ui' },
  { key: 'sfx', labelKey: 'reboot.settings.audio.sfx' },
  { key: 'music', labelKey: 'reboot.settings.audio.music' },
  { key: 'ambience', labelKey: 'reboot.settings.audio.ambience' },
];

interface SettingsOverlayProps {
  t: TranslateFn;
  snapshot: GameSnapshot;
  turbo: number;
  audioSettings: AudioSettings;
  saveTransferText: string;
  saveFeedbackText: string | null;
  lastAutosaveLabel: string;
  onUpdateAudio: (channel: AudioChannel, value: number) => void;
  onSetTurbo: (value: number) => void;
  onSaveTransferChange: (value: string) => void;
  onExportSave: () => void;
  onImportSave: () => void;
  onAutosaveNow: () => void;
  onReplayLore: () => void;
  onReplayTutorial: () => void;
  onClose: () => void;
}

export function SettingsOverlay(props: Readonly<SettingsOverlayProps>) {
  return (
    <aside
      className="overlay-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={props.t('reboot.settings.dialogLabel')}
    >
      <div className="overlay-card settings-card">
        <p className="eyebrow">{props.t('reboot.settings.eyebrow')}</p>
        <h2>{props.t('reboot.settings.title')}</h2>

        <div className="settings-grid">
          <article className="settings-block">
            <h3>{props.t('reboot.settings.audio.title')}</h3>
            <div className="slider-list">
              {AUDIO_CHANNELS.map((channel) => (
                <label key={channel.key} className="slider-row">
                  <span>{props.t(channel.labelKey)}</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={props.audioSettings[channel.key]}
                    onChange={(event) =>
                      props.onUpdateAudio(channel.key, Number(event.currentTarget.value))
                    }
                  />
                  <strong>{props.audioSettings[channel.key]}%</strong>
                </label>
              ))}
            </div>
          </article>

          <article className="settings-block">
            <h3>{props.t('reboot.settings.stats.title')}</h3>
            <dl className="metrics">
              <div>
                <dt>{props.t('reboot.settings.stats.scans')}</dt>
                <dd>{formatBigValue(props.snapshot.progression.scans)}</dd>
              </div>
              <div>
                <dt>{props.t('reboot.settings.stats.exploitAttempts')}</dt>
                <dd>{formatBigValue(props.snapshot.progression.exploitAttempts)}</dd>
              </div>
              <div>
                <dt>{props.t('reboot.settings.stats.exploitSuccess')}</dt>
                <dd>{formatBigValue(props.snapshot.progression.exploitSuccesses)}</dd>
              </div>
              <div>
                <dt>{props.t('reboot.settings.stats.warWins')}</dt>
                <dd>{formatBigValue(props.snapshot.progression.warWins)}</dd>
              </div>
              <div>
                <dt>{props.t('reboot.settings.stats.messagesHandled')}</dt>
                <dd>{formatBigValue(props.snapshot.progression.messagesHandled)}</dd>
              </div>
            </dl>
            <p className="queue-hint">
              {props.t('reboot.settings.stats.telemetry', {
                turbo: props.turbo,
                tick: props.snapshot.tick.toLocaleString('fr-FR'),
              })}
            </p>
            <div className="turbo-controls">
              {TURBO_OPTIONS.map((value) => (
                <button
                  key={value}
                  className={value === props.turbo ? 'btn tiny is-active' : 'btn tiny'}
                  onClick={() => props.onSetTurbo(value)}
                >
                  x{value}
                </button>
              ))}
            </div>
          </article>

          <article className="settings-block">
            <h3>{props.t('reboot.settings.replay.title')}</h3>
            <div className="button-row">
              <button className="btn" onClick={props.onReplayLore}>
                {props.t('reboot.settings.replay.lore')}
              </button>
              <button className="btn ghost" onClick={props.onReplayTutorial}>
                {props.t('reboot.settings.replay.tutorial')}
              </button>
            </div>
          </article>

          <article className="settings-block settings-save-block">
            <h3>{props.t('reboot.settings.save.title')}</h3>
            <p className="queue-hint">{props.t('reboot.settings.save.hint')}</p>
            <p className="queue-hint">{props.lastAutosaveLabel}</p>
            {props.saveFeedbackText ? (
              <p className="queue-hint">{props.saveFeedbackText}</p>
            ) : null}
            <label className="save-transfer-label">
              <span>{props.t('reboot.settings.save.transferLabel')}</span>
              <textarea
                className="save-transfer-input"
                rows={4}
                value={props.saveTransferText}
                placeholder={props.t('reboot.settings.save.transferPlaceholder')}
                onChange={(event) => props.onSaveTransferChange(event.currentTarget.value)}
              />
            </label>
            <div className="button-row">
              <button className="btn" onClick={props.onExportSave}>
                {props.t('reboot.settings.save.exportButton')}
              </button>
              <button className="btn ghost" onClick={props.onImportSave}>
                {props.t('reboot.settings.save.importButton')}
              </button>
              <button className="btn ghost tiny" onClick={props.onAutosaveNow}>
                {props.t('reboot.settings.save.autosaveNow')}
              </button>
            </div>
          </article>
        </div>

        <div className="button-row">
          <button className="btn" onClick={props.onClose}>
            {props.t('reboot.settings.close')}
          </button>
        </div>
      </div>
    </aside>
  );
}
