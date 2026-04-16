import { formatBigValue, formatCountdownMs } from '../../../game/format';
import type { GameSnapshot } from '../../../game/types';
import { hasOwnedUpgrade } from '../../../app/upgrades';

type TranslateFn = (key: string, vars?: Record<string, string | number>) => string;

interface CoreOpsPanelProps {
  snapshot: GameSnapshot;
  onSendScan: () => void;
  onSendExploit: () => void;
  t: TranslateFn;
}

export function CoreOpsPanel(props: Readonly<CoreOpsPanelProps>) {
  const queuedTargets = BigInt(props.snapshot.resources.queuedTargets);
  const exploitLocked = props.snapshot.economy.exploitCooldownMs > 0;
  const exploitCooldownBaseMs = Math.max(0, props.snapshot.economy.exploitCooldownBaseMs);
  const exploitCooldownFillPercent =
    exploitCooldownBaseMs <= 0
      ? 100
      : Math.max(
          0,
          Math.min(
            100,
            ((exploitCooldownBaseMs - props.snapshot.economy.exploitCooldownMs) * 100) /
              exploitCooldownBaseMs,
          ),
        );
  const exploitCooldownLabel = exploitLocked
    ? formatCountdownMs(props.snapshot.economy.exploitCooldownMs)
    : props.t('reboot.panel.coreOps.exploitReady');

  const exploitHotkeyUnlocked = hasOwnedUpgrade(
    props.snapshot.upgrades.offers,
    'qol-operator-macros',
  );

  return (
    <article className="panel" data-guide="core-ops">
      <h2>{props.t('reboot.panel.coreOps.title')}</h2>
      <p className="panel-copy">{props.t('reboot.panel.coreOps.copy')}</p>
      <div className="button-row">
        <button className="btn" onClick={props.onSendScan}>
          {props.t('reboot.panel.coreOps.scanButton')}
        </button>
        <button className="btn" disabled={queuedTargets <= 0n || exploitLocked} onClick={props.onSendExploit}>
          {props.t('reboot.panel.coreOps.exploitButton')}
        </button>
      </div>
      <p className="queue-hint">{props.t('reboot.panel.coreOps.enterHint')}</p>
      <p className="queue-hint">
        {exploitHotkeyUnlocked
          ? props.t('reboot.panel.coreOps.exploitHotkeyReadyHint')
          : props.t('reboot.panel.coreOps.exploitHotkeyLockedHint')}
      </p>
      <div className={exploitLocked ? 'meter exploit-cooldown-meter' : 'meter exploit-cooldown-meter is-ready'}>
        <span style={{ width: `${exploitCooldownFillPercent}%` }}></span>
      </div>
      <p className="cooldown-hint">
        {props.t('reboot.panel.coreOps.exploitCooldown')}: <strong>{exploitCooldownLabel}</strong>
      </p>
      <dl className="metrics">
        <div>
          <dt>{props.t('reboot.panel.coreOps.exploitCooldown')}</dt>
          <dd>{formatCountdownMs(props.snapshot.economy.exploitCooldownMs)}</dd>
        </div>
        <div>
          <dt>{props.t('reboot.panel.coreOps.exploitBaseCooldown')}</dt>
          <dd>{formatCountdownMs(props.snapshot.economy.exploitCooldownBaseMs)}</dd>
        </div>
        <div>
          <dt>{props.t('reboot.panel.coreOps.botsPerSec')}</dt>
          <dd>{formatBigValue(props.snapshot.telemetry.botsPerSec)}</dd>
        </div>
        <div>
          <dt>{props.t('reboot.panel.coreOps.moneyPerSec')}</dt>
          <dd>{formatBigValue(props.snapshot.telemetry.moneyPerSec)}</dd>
        </div>
      </dl>
    </article>
  );
}