import { formatBigValue, formatPercentFromBps } from '../../game/format';
import type { GameSnapshot } from '../../game/types';

type TranslateFn = (key: string, vars?: Record<string, string | number>) => string;

interface CashflowTabPanelProps {
  snapshot: GameSnapshot;
  unlocked: boolean;
  onToggleMonetize: () => void;
  onToggleLaundering: () => void;
  onToggleLaunderProfile: () => void;
  onTriggerFbiCountermeasure: () => void;
  onInvestTranche: () => void;
  onCashout: () => void;
  onToggleInvestMode: () => void;
  t: TranslateFn;
}

export function CashflowTabPanel(props: Readonly<CashflowTabPanelProps>) {
  const money = BigInt(props.snapshot.resources.darkMoney);
  const dirtyMoney = BigInt(props.snapshot.economy.dirtyMoney);
  const portfolio = BigInt(props.snapshot.resources.portfolio);
  const fbiCountermeasureCost = BigInt(props.snapshot.economy.fbiCountermeasureCost);
  const investmentsUnlocked = props.snapshot.phase.index >= 2;
  const launderingLocked = props.snapshot.economy.launderingLockdownMs > 0;
  const fbiCountermeasureLocked = props.snapshot.economy.fbiCountermeasureCooldownMs > 0;
  const hasCountermeasureBudget = money >= fbiCountermeasureCost;
  const missingCountermeasureBudget =
    hasCountermeasureBudget ? 0n : fbiCountermeasureCost - money;
  const fbiInterventionChance = formatPercentFromBps(props.snapshot.economy.fbiInterventionChanceBps);
  const fbiSuspicionPercent = (props.snapshot.economy.fbiSuspicion / 100).toLocaleString('fr-FR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  const launderingLockdownSeconds = Math.ceil(props.snapshot.economy.launderingLockdownMs / 1000);
  const fbiCountermeasureCooldownSeconds = Math.ceil(
    props.snapshot.economy.fbiCountermeasureCooldownMs / 1000,
  );
  const launderingProfileLabelKey =
    props.snapshot.economy.launderingProfile === 'high-yield'
      ? 'reboot.panel.cashflow.profileHighYield'
      : 'reboot.panel.cashflow.profileLowRisk';
  const fbiRiskLabelKey =
    props.snapshot.economy.fbiRiskState === 'alert'
      ? 'reboot.panel.cashflow.fbiRiskAlert'
      : props.snapshot.economy.fbiRiskState === 'watch'
        ? 'reboot.panel.cashflow.fbiRiskWatch'
        : 'reboot.panel.cashflow.fbiRiskClear';

  let advisoryKey = 'reboot.panel.cashflow.adviceDefault';

  if (!investmentsUnlocked) {
    advisoryKey = 'reboot.panel.cashflow.advicePhaseLocked';
  } else if (launderingLocked) {
    advisoryKey = 'reboot.panel.cashflow.adviceLockdown';
  } else if (props.snapshot.economy.fbiRiskState === 'alert') {
    if (!fbiCountermeasureLocked && hasCountermeasureBudget) {
      advisoryKey = 'reboot.panel.cashflow.adviceTriggerCover';
    } else if (props.snapshot.economy.launderingProfile === 'high-yield') {
      advisoryKey = 'reboot.panel.cashflow.adviceSwitchLowRisk';
    } else if (props.snapshot.economy.investMode === 'aggressive') {
      advisoryKey = 'reboot.panel.cashflow.adviceStabilizeMode';
    } else {
      advisoryKey = 'reboot.panel.cashflow.adviceAlertHold';
    }
  } else if (props.snapshot.economy.fbiRiskState === 'watch') {
    if (props.snapshot.economy.launderingProfile === 'high-yield') {
      advisoryKey = 'reboot.panel.cashflow.adviceSwitchLowRisk';
    } else if (props.snapshot.economy.investMode === 'aggressive') {
      advisoryKey = 'reboot.panel.cashflow.adviceStabilizeMode';
    } else {
      advisoryKey = 'reboot.panel.cashflow.adviceWatchBalance';
    }
  } else if (dirtyMoney <= 0n) {
    advisoryKey = 'reboot.panel.cashflow.adviceFeedPipeline';
  } else if (
    props.snapshot.economy.launderingProfile === 'low-risk' &&
    props.snapshot.economy.fbiInterventionChanceBps <= 250
  ) {
    advisoryKey = 'reboot.panel.cashflow.advicePushWindow';
  }

  return (
    <section className="system-grid" role="tabpanel" id="panel-cashflow" aria-labelledby="tab-cashflow">
      {props.unlocked ? (
        <article className="panel" data-guide="cashflow">
          <h2>{props.t('reboot.panel.cashflow.title')}</h2>
          <p className="panel-copy">{props.t('reboot.panel.cashflow.copyUnlocked')}</p>
          <div className="button-row">
            <button className="btn" onClick={props.onToggleMonetize}>
              {props.snapshot.economy.monetizeActive
                ? props.t('reboot.panel.cashflow.pauseMonetize')
                : props.t('reboot.panel.cashflow.startMonetize')}
            </button>
            <button
              className={props.snapshot.economy.launderingActive ? 'btn' : 'btn ghost'}
              disabled={!investmentsUnlocked || launderingLocked}
              onClick={props.onToggleLaundering}
            >
              {props.snapshot.economy.launderingActive
                ? props.t('reboot.panel.cashflow.pauseLaundering')
                : props.t('reboot.panel.cashflow.startLaundering')}
            </button>
            <button
              className="btn ghost"
              disabled={!investmentsUnlocked}
              onClick={props.onToggleLaunderProfile}
            >
              {props.t('reboot.panel.cashflow.profileLabel')}: {props.t(launderingProfileLabelKey)}
            </button>
          </div>
          <div className="button-row compact">
            <button
              className="btn ghost"
              disabled={!investmentsUnlocked || fbiCountermeasureLocked || !hasCountermeasureBudget}
              onClick={props.onTriggerFbiCountermeasure}
            >
              {props.t('reboot.panel.cashflow.fbiCountermeasure')}
            </button>
            <button
              className="btn"
              disabled={!investmentsUnlocked || money < 80n}
              onClick={props.onInvestTranche}
            >
              {props.t('reboot.panel.cashflow.investTranche')}
            </button>
            <button
              className="btn ghost"
              disabled={!investmentsUnlocked || BigInt(props.snapshot.resources.portfolio) <= 0n}
              onClick={props.onCashout}
            >
              {props.t('reboot.panel.cashflow.cashout')}
            </button>
            <button className="btn ghost" disabled={!investmentsUnlocked} onClick={props.onToggleInvestMode}>
              {props.t('reboot.panel.cashflow.modeLabel')}: {props.snapshot.economy.investMode}
            </button>
          </div>
          {launderingLocked ? (
            <p className="queue-hint">
              {props.t('reboot.panel.cashflow.lockdownHint', { seconds: launderingLockdownSeconds })}
            </p>
          ) : null}
          <p className="queue-hint">
            {props.t('reboot.panel.cashflow.fbiCountermeasureHint', {
              cost: formatBigValue(props.snapshot.economy.fbiCountermeasureCost),
            })}
          </p>
          {!investmentsUnlocked ? (
            <p className="queue-hint">{props.t('reboot.panel.cashflow.fbiCountermeasurePhaseHint')}</p>
          ) : null}
          {fbiCountermeasureLocked ? (
            <p className="queue-hint">
              {props.t('reboot.panel.cashflow.fbiCountermeasureCooldown', {
                seconds: fbiCountermeasureCooldownSeconds,
              })}
            </p>
          ) : null}
          {investmentsUnlocked && !fbiCountermeasureLocked && !hasCountermeasureBudget ? (
            <p className="queue-hint">
              {props.t('reboot.panel.cashflow.fbiCountermeasureInsufficient', {
                missing: formatBigValue(missingCountermeasureBudget),
              })}
            </p>
          ) : null}
          <p className="queue-hint">{props.t(advisoryKey)}</p>
          <dl className="metrics">
            <div>
              <dt>{props.t('reboot.panel.cashflow.dirtyMoney')}</dt>
              <dd>{formatBigValue(props.snapshot.economy.dirtyMoney)}</dd>
            </div>
            <div>
              <dt>{props.t('reboot.panel.cashflow.launderRate')}</dt>
              <dd>{formatBigValue(props.snapshot.economy.launderingThroughputPerSec)}/s</dd>
            </div>
            <div>
              <dt>{props.t('reboot.panel.cashflow.launderEfficiency')}</dt>
              <dd>{formatPercentFromBps(props.snapshot.economy.launderingEfficiencyBps)}</dd>
            </div>
            <div>
              <dt>{props.t('reboot.panel.cashflow.fbiSuspicion')}</dt>
              <dd>{fbiSuspicionPercent}%</dd>
            </div>
            <div>
              <dt>{props.t('reboot.panel.cashflow.fbiRisk')}</dt>
              <dd>{props.t(fbiRiskLabelKey)}</dd>
            </div>
            <div>
              <dt>{props.t('reboot.panel.cashflow.fbiStrikeChance')}</dt>
              <dd>{fbiInterventionChance}</dd>
            </div>
            <div>
              <dt>{props.t('reboot.panel.cashflow.moneyYield')}</dt>
              <dd>{formatPercentFromBps(props.snapshot.economy.moneyYieldBps)}</dd>
            </div>
            <div>
              <dt>{props.t('reboot.panel.cashflow.maintenance')}</dt>
              <dd>{formatBigValue(props.snapshot.economy.maintenanceMoneyPerSec)}</dd>
            </div>
            <div>
              <dt>{props.t('reboot.panel.cashflow.portfolio')}</dt>
              <dd>{formatBigValue(portfolio)}</dd>
            </div>
            <div>
              <dt>{props.t('reboot.panel.cashflow.darkMoney')}</dt>
              <dd>{formatBigValue(money)}</dd>
            </div>
          </dl>
          {dirtyMoney <= 0n ? <p className="queue-hint">{props.t('reboot.panel.cashflow.pipelineHint')}</p> : null}
        </article>
      ) : (
        <article className="panel locked-panel" data-guide="cashflow">
          <h2>{props.t('reboot.panel.cashflow.title')}</h2>
          <p className="panel-copy">{props.t('reboot.panel.cashflow.locked')}</p>
        </article>
      )}
    </section>
  );
}
