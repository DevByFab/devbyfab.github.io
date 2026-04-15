import { formatBigValue, formatCountdownMs } from '../../game/format';
import type { GameSnapshot, LogLine } from '../../game/types';
import { formatUpgradeCosts, hasOwnedUpgrade } from '../../app/upgrades';

type TranslateFn = (key: string, vars?: Record<string, string | number>) => string;

interface DashboardTabPanelProps {
  snapshot: GameSnapshot;
  latestLogs: LogLine[];
  consoleCollapsed: boolean;
  onToggleConsole: () => void;
  onSendScan: () => void;
  onSendExploit: () => void;
  onPurchaseUpgrade: (chainId: string) => void;
  t: TranslateFn;
}

export function DashboardTabPanel(props: Readonly<DashboardTabPanelProps>) {
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

  const availableUpgradeOffers = props.snapshot.upgrades.offers.filter(
    (offer) => offer.currentLevel < offer.maxLevel && offer.unlocked,
  );
  const lockedUpgradeOffers = props.snapshot.upgrades.offers.filter(
    (offer) => offer.currentLevel < offer.maxLevel && !offer.unlocked,
  );
  const acquiredUpgradeOffers = props.snapshot.upgrades.offers.filter(
    (offer) => offer.currentLevel > 0,
  );

  const exploitHotkeyUnlocked = hasOwnedUpgrade(
    props.snapshot.upgrades.offers,
    'qol-operator-macros',
  );

  return (
    <section className="dashboard-grid" role="tabpanel" id="panel-dashboard" aria-labelledby="tab-dashboard">
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

      <article className="panel upgrades-panel" data-guide="upgrades">
        <h2>{props.t('reboot.panel.upgrades.title')}</h2>
        <p className="panel-copy">{props.t('reboot.panel.upgrades.copy')}</p>
        <div className="stack-scroll">
          {availableUpgradeOffers.length === 0 ? (
            <p className="empty-text">{props.t('reboot.panel.upgrades.emptyAvailable')}</p>
          ) : (
            <div className="upgrade-list single-column">
              {availableUpgradeOffers.map((offer) => (
                <article key={offer.chainId} className="upgrade-card">
                  <div className="upgrade-head">
                    <strong>{offer.label}</strong>
                    <span>
                      Lv {offer.currentLevel}/{offer.maxLevel}
                    </span>
                  </div>
                  <p>{offer.summary}</p>
                  <div className="upgrade-costs">
                    {formatUpgradeCosts(offer, props.t).map((costEntry) => (
                      <span key={costEntry}>{costEntry}</span>
                    ))}
                  </div>
                  <button
                    className="btn"
                    disabled={!offer.affordable}
                    onClick={() => props.onPurchaseUpgrade(offer.chainId)}
                  >
                    {props.t('reboot.panel.upgrades.buyLevel', { level: offer.nextLevel })}
                  </button>
                </article>
              ))}
            </div>
          )}
        </div>
        {acquiredUpgradeOffers.length > 0 ? (
          <div>
            <p className="queue-hint">{props.t('reboot.panel.upgrades.acquired')}</p>
            <ul className="acquired-list">
              {acquiredUpgradeOffers.map((offer) => (
                <li key={'acquired-' + offer.chainId}>
                  {offer.label} · Lv {offer.currentLevel}/{offer.maxLevel}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {lockedUpgradeOffers.length > 0 ? (
          <p className="queue-hint">
            {props.t('reboot.panel.upgrades.researchQueue', { count: lockedUpgradeOffers.length })}
          </p>
        ) : null}
      </article>

      <article
        className={
          props.consoleCollapsed
            ? 'panel console-panel panel-span-full is-collapsed'
            : 'panel console-panel panel-span-full'
        }
        data-guide="console"
      >
        <div className="panel-head">
          <h2>{props.t('reboot.panel.console.title')}</h2>
          <div className="button-row compact">
            <button className="btn tiny ghost" onClick={props.onToggleConsole}>
              {props.consoleCollapsed
                ? props.t('reboot.panel.console.open')
                : props.t('reboot.panel.console.reduce')}
            </button>
          </div>
        </div>

        {!props.consoleCollapsed ? (
          <>
            <p className="panel-copy">
              {props.t('reboot.panel.console.heatDelta')}: {props.snapshot.telemetry.heatPerSec}/s
            </p>
            <ul className="terminal-feed">
              {props.latestLogs.length === 0 ? (
                <li className="empty-text">{props.t('reboot.panel.console.empty')}</li>
              ) : null}
              {props.latestLogs.map((line) => (
                <li key={line.id} className={`log-line ${line.severity}`}>
                  <span>{new Date(line.atMs).toLocaleTimeString('fr-FR')}</span>
                  <p>{line.text}</p>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </article>
    </section>
  );
}
