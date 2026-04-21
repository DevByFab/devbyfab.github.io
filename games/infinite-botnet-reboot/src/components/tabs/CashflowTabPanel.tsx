import { formatBigValue, formatPercentFromBps } from '../../game/format';
import type {
  FrontBusinessId,
  FrontBusinessMode,
  GameSnapshot,
  InvestMode,
} from '../../game/types';

type TranslateFn = (key: string, vars?: Record<string, string | number>) => string;

interface CashflowTabPanelProps {
  snapshot: GameSnapshot;
  unlocked: boolean;
  onToggleMonetize: () => void;
  onToggleLaundering: () => void;
  onToggleLaunderProfile: () => void;
  onPurchaseFrontBusiness: (frontBusinessId: FrontBusinessId) => void;
  onUpgradeFrontBusiness: (frontBusinessId: FrontBusinessId) => void;
  onToggleFrontBusinessMode: (frontBusinessId: FrontBusinessId) => void;
  onTriggerFbiCountermeasure: () => void;
  onInvestTranche: () => void;
  onCashout: () => void;
  onToggleInvestMode: () => void;
  t: TranslateFn;
}

const FRONT_BUSINESS_LABEL_KEYS: Record<FrontBusinessId, string> = {
  laundromat: 'reboot.panel.cashflow.frontBusiness.laundromat',
  'car-dealership': 'reboot.panel.cashflow.frontBusiness.carDealership',
  'freight-forwarder': 'reboot.panel.cashflow.frontBusiness.freightForwarder',
};

const FRONT_BUSINESS_MODE_LABEL_KEYS: Record<FrontBusinessMode, string> = {
  discreet: 'reboot.panel.cashflow.frontBusiness.modeDiscreet',
  balanced: 'reboot.panel.cashflow.frontBusiness.modeBalanced',
  aggressive: 'reboot.panel.cashflow.frontBusiness.modeAggressive',
};

const INVEST_MODE_LABEL_KEYS: Record<InvestMode, string> = {
  stable: 'reboot.panel.cashflow.modeStable',
  aggressive: 'reboot.panel.cashflow.modeAggressive',
};

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, value));
}

export function CashflowTabPanel(props: Readonly<CashflowTabPanelProps>) {
  const money = BigInt(props.snapshot.resources.darkMoney);
  const dirtyMoney = BigInt(props.snapshot.economy.dirtyMoney);
  const cleanMoney = BigInt(props.snapshot.economy.cleanMoney);
  const portfolio = BigInt(props.snapshot.resources.portfolio);
  const fbiCountermeasureCost = BigInt(props.snapshot.economy.fbiCountermeasureCost);
  const frontBusinessCooldownMs = props.snapshot.economy.frontBusinessActionCooldownMs;
  const frontBusinessCooldownSeconds = Math.ceil(frontBusinessCooldownMs / 1000);
  const frontBusinessActionLocked = frontBusinessCooldownMs > 0;
  const { frontBusinesses } = props.snapshot.economy;
  const hasOwnedFrontBusiness = frontBusinesses.some((frontBusiness) => frontBusiness.owned);
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
  const investModeLabel = props.t(INVEST_MODE_LABEL_KEYS[props.snapshot.economy.investMode]);
  const fbiSuspicionMeter = clampPercent(props.snapshot.economy.fbiSuspicion / 100);
  const fbiRiskLabelKey =
    props.snapshot.economy.fbiRiskState === 'alert'
      ? 'reboot.panel.cashflow.fbiRiskAlert'
      : props.snapshot.economy.fbiRiskState === 'watch'
        ? 'reboot.panel.cashflow.fbiRiskWatch'
        : 'reboot.panel.cashflow.fbiRiskClear';
  const fbiRiskBadgeClass =
    props.snapshot.economy.fbiRiskState === 'alert'
      ? 'cashflow-badge is-danger'
      : props.snapshot.economy.fbiRiskState === 'watch'
        ? 'cashflow-badge is-warn'
        : 'cashflow-badge is-positive';
  const pipelineBadgeClass =
    props.snapshot.economy.monetizeActive || props.snapshot.economy.launderingActive
      ? 'cashflow-badge is-positive'
      : 'cashflow-badge is-muted';
  const investModeBadgeClass =
    props.snapshot.economy.investMode === 'aggressive'
      ? 'cashflow-badge is-warn'
      : 'cashflow-badge is-positive';

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

  const contextualHints = new Set<string>();
  contextualHints.add(props.t(advisoryKey));

  if (launderingLocked) {
    contextualHints.add(
      props.t('reboot.panel.cashflow.lockdownHint', { seconds: launderingLockdownSeconds }),
    );
  }

  if (!investmentsUnlocked) {
    contextualHints.add(props.t('reboot.panel.cashflow.fbiCountermeasurePhaseHint'));
  }

  if (fbiCountermeasureLocked) {
    contextualHints.add(
      props.t('reboot.panel.cashflow.fbiCountermeasureCooldown', {
        seconds: fbiCountermeasureCooldownSeconds,
      }),
    );
  }

  if (investmentsUnlocked && !fbiCountermeasureLocked && !hasCountermeasureBudget) {
    contextualHints.add(
      props.t('reboot.panel.cashflow.fbiCountermeasureInsufficient', {
        missing: formatBigValue(missingCountermeasureBudget),
      }),
    );
  }

  if (frontBusinessActionLocked) {
    contextualHints.add(
      props.t('reboot.panel.cashflow.frontBusinessCooldown', {
        seconds: frontBusinessCooldownSeconds,
      }),
    );
  }

  if (dirtyMoney <= 0n) {
    contextualHints.add(props.t('reboot.panel.cashflow.pipelineHint'));
  }

  const hints = Array.from(contextualHints);

  return (
    <section className="system-grid" role="tabpanel" id="panel-cashflow" aria-labelledby="tab-cashflow">
      {props.unlocked ? (
        <article className="panel cashflow-panel" data-guide="cashflow">
          <h2>{props.t('reboot.panel.cashflow.title')}</h2>
          <p className="panel-copy">{props.t('reboot.panel.cashflow.copyUnlocked')}</p>

          <div className="cashflow-pipeline">
            <article className="cashflow-kpi-card">
              <p className="resource-label">{props.t('reboot.panel.cashflow.dirtyMoney')}</p>
              <p className="resource-value">{formatBigValue(dirtyMoney)}</p>
              <p className="queue-hint">
                {props.t('reboot.panel.cashflow.pipelineRateMonetize')}: {formatBigValue(props.snapshot.economy.monetizeBotsPerSec)}/s
              </p>
            </article>
            <article className="cashflow-kpi-card">
              <p className="resource-label">{props.t('reboot.panel.cashflow.darkMoney')}</p>
              <p className="resource-value">{formatBigValue(money)}</p>
              <p className="queue-hint">
                {props.t('reboot.panel.cashflow.pipelineRateLaunder')}: {formatBigValue(props.snapshot.economy.launderingThroughputPerSec)}/s
              </p>
            </article>
            <article className="cashflow-kpi-card">
              <p className="resource-label">{props.t('reboot.panel.cashflow.cleanMoney')}</p>
              <p className="resource-value">{formatBigValue(cleanMoney)}</p>
              <p className="queue-hint">
                {props.t('reboot.panel.cashflow.pipelineRateCleanYield')}: {formatBigValue(props.snapshot.economy.frontBusinessCleanYieldPerSec)}/s
              </p>
            </article>
          </div>

          <section className="cashflow-section">
            <div className="cashflow-section-head">
              <h3>{props.t('reboot.panel.cashflow.riskTitle')}</h3>
              <span className={fbiRiskBadgeClass}>{props.t(fbiRiskLabelKey)}</span>
            </div>
            <div className="cashflow-risk-inline">
              <p className="queue-hint">
                {props.t('reboot.panel.cashflow.fbiSuspicion')}: <strong>{fbiSuspicionPercent}%</strong>
              </p>
              <p className="queue-hint">
                {props.t('reboot.panel.cashflow.fbiStrikeChance')}: <strong>{fbiInterventionChance}</strong>
              </p>
            </div>
            <div className="meter heat cashflow-risk-meter">
              <span style={{ width: `${fbiSuspicionMeter}%` }}></span>
            </div>
            <div className="war-meta">
              <span>
                {props.t('reboot.panel.cashflow.frontBusiness.risk')}: {formatPercentFromBps(props.snapshot.economy.frontBusinessRiskBps)}
              </span>
              <span>
                {props.t('reboot.panel.cashflow.fbiCountermeasureCostShort')}: {formatBigValue(props.snapshot.economy.fbiCountermeasureCost)}
              </span>
            </div>
          </section>

          <section className="cashflow-section">
            <h3>{props.t('reboot.panel.cashflow.controlsTitle')}</h3>
            <div className="cashflow-actions-grid">
              <article className="cashflow-action-card">
                <div className="cashflow-section-head">
                  <h4>{props.t('reboot.panel.cashflow.pipelineControlsTitle')}</h4>
                  <span className={pipelineBadgeClass}>
                    {props.t('reboot.panel.cashflow.statusMonetize')}{' '}
                    {props.snapshot.economy.monetizeActive
                      ? props.t('reboot.panel.cashflow.statusActive')
                      : props.t('reboot.panel.cashflow.statusPaused')}
                    {' · '}
                    {props.t('reboot.panel.cashflow.statusLaundering')}{' '}
                    {props.snapshot.economy.launderingActive
                      ? props.t('reboot.panel.cashflow.statusActive')
                      : props.t('reboot.panel.cashflow.statusPaused')}
                  </span>
                </div>
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
              </article>

              <article className="cashflow-action-card">
                <div className="cashflow-section-head">
                  <h4>{props.t('reboot.panel.cashflow.capitalControlsTitle')}</h4>
                  <span className={investModeBadgeClass}>
                    {props.t('reboot.panel.cashflow.modeLabel')}: {investModeLabel}
                  </span>
                </div>
                <div className="button-row">
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
                    disabled={!investmentsUnlocked || portfolio <= 0n}
                    onClick={props.onCashout}
                  >
                    {props.t('reboot.panel.cashflow.cashout')}
                  </button>
                  <button
                    className="btn ghost"
                    disabled={!investmentsUnlocked}
                    onClick={props.onToggleInvestMode}
                  >
                    {props.t('reboot.panel.cashflow.modeSwitch')} ({investModeLabel})
                  </button>
                </div>
                <p className="queue-hint">
                  {props.t('reboot.panel.cashflow.fbiCountermeasureHint', {
                    cost: formatBigValue(props.snapshot.economy.fbiCountermeasureCost),
                  })}
                </p>
              </article>
            </div>
          </section>

          <section className="cashflow-section">
            <h3>{props.t('reboot.panel.cashflow.frontBusiness.title')}</h3>
            <p className="queue-hint">{props.t('reboot.panel.cashflow.frontBusiness.copy')}</p>
            <div className="cashflow-front-grid">
              {frontBusinesses.map((frontBusiness) => {
            const buyCost = BigInt(frontBusiness.buyCostDarkMoney);
            const upgradeCost = BigInt(frontBusiness.upgradeCostDarkMoney);
            const frontBusinessRiskMeter = clampPercent(frontBusiness.riskBps / 100);
            const upgradeDisabled =
              !frontBusiness.owned ||
              frontBusinessActionLocked ||
              upgradeCost <= 0n ||
              money < upgradeCost;
            const buyDisabled = frontBusiness.owned || frontBusinessActionLocked || money < buyCost;

            return (
              <article
                key={frontBusiness.id}
                className={frontBusiness.owned ? 'cashflow-front-card is-owned' : 'cashflow-front-card'}
              >
                <div className="cashflow-front-head">
                  <h4>{props.t(FRONT_BUSINESS_LABEL_KEYS[frontBusiness.id])}</h4>
                  <span className={frontBusiness.owned ? 'cashflow-badge is-positive' : 'cashflow-badge is-muted'}>
                    {frontBusiness.owned
                      ? props.t('reboot.panel.cashflow.frontBusiness.owned', {
                          level: frontBusiness.level,
                        })
                      : props.t('reboot.panel.cashflow.frontBusiness.notOwned')}
                  </span>
                </div>
                <dl className="metrics cashflow-front-metrics">
                  <div>
                    <dt>{props.t('reboot.panel.cashflow.frontBusiness.darkToClean')}</dt>
                    <dd>{formatBigValue(frontBusiness.darkToCleanPerSec)}/s</dd>
                  </div>
                  <div>
                    <dt>{props.t('reboot.panel.cashflow.frontBusiness.cleanYield')}</dt>
                    <dd>{formatBigValue(frontBusiness.cleanYieldPerSec)}/s</dd>
                  </div>
                  <div>
                    <dt>{props.t('reboot.panel.cashflow.frontBusiness.maintenance')}</dt>
                    <dd>{formatBigValue(frontBusiness.maintenancePerSec)}/s</dd>
                  </div>
                </dl>
                <div className="meter heat cashflow-risk-meter">
                  <span style={{ width: `${frontBusinessRiskMeter}%` }}></span>
                </div>
                <div className="war-meta">
                  <span>
                    {props.t('reboot.panel.cashflow.frontBusiness.mode')}: {props.t(FRONT_BUSINESS_MODE_LABEL_KEYS[frontBusiness.mode])}
                  </span>
                  <span>
                    {props.t('reboot.panel.cashflow.frontBusiness.risk')}: {formatPercentFromBps(frontBusiness.riskBps)}
                  </span>
                </div>
                <div className="button-row compact">
                  <button
                    className="btn"
                    disabled={!investmentsUnlocked || buyDisabled}
                    onClick={() => props.onPurchaseFrontBusiness(frontBusiness.id)}
                  >
                    {props.t('reboot.panel.cashflow.frontBusiness.buy', {
                      cost: formatBigValue(frontBusiness.buyCostDarkMoney),
                    })}
                  </button>
                  <button
                    className="btn ghost"
                    disabled={!investmentsUnlocked || upgradeDisabled}
                    onClick={() => props.onUpgradeFrontBusiness(frontBusiness.id)}
                  >
                    {props.t('reboot.panel.cashflow.frontBusiness.upgrade', {
                      cost:
                        upgradeCost > 0n
                          ? formatBigValue(frontBusiness.upgradeCostDarkMoney)
                          : props.t('reboot.panel.cashflow.frontBusiness.maxed'),
                    })}
                  </button>
                  <button
                    className="btn ghost"
                    disabled={!investmentsUnlocked || !frontBusiness.owned || frontBusinessActionLocked}
                    onClick={() => props.onToggleFrontBusinessMode(frontBusiness.id)}
                  >
                    {props.t('reboot.panel.cashflow.frontBusiness.mode')}: {props.t(FRONT_BUSINESS_MODE_LABEL_KEYS[frontBusiness.mode])}
                  </button>
                </div>
              </article>
            );
              })}
            </div>
          {!hasOwnedFrontBusiness ? (
            <p className="queue-hint">{props.t('reboot.panel.cashflow.frontBusiness.emptyOwned')}</p>
          ) : null}
          </section>

          <section className="cashflow-section">
            <h3>{props.t('reboot.panel.cashflow.overviewTitle')}</h3>
            <dl className="metrics cashflow-metrics-grid">
            <div>
              <dt>{props.t('reboot.panel.cashflow.launderRate')}</dt>
              <dd>{formatBigValue(props.snapshot.economy.launderingThroughputPerSec)}/s</dd>
            </div>
            <div>
              <dt>{props.t('reboot.panel.cashflow.launderEfficiency')}</dt>
              <dd>{formatPercentFromBps(props.snapshot.economy.launderingEfficiencyBps)}</dd>
            </div>
            <div>
              <dt>{props.t('reboot.panel.cashflow.frontBusiness.darkToClean')}</dt>
              <dd>{formatBigValue(props.snapshot.economy.frontBusinessDarkToCleanPerSec)}/s</dd>
            </div>
            <div>
              <dt>{props.t('reboot.panel.cashflow.frontBusiness.cleanYield')}</dt>
              <dd>{formatBigValue(props.snapshot.economy.frontBusinessCleanYieldPerSec)}/s</dd>
            </div>
            <div>
              <dt>{props.t('reboot.panel.cashflow.frontBusiness.maintenance')}</dt>
              <dd>{formatBigValue(props.snapshot.economy.frontBusinessMaintenancePerSec)}/s</dd>
            </div>
            <div>
              <dt>{props.t('reboot.panel.cashflow.moneyYield')}</dt>
              <dd>{formatPercentFromBps(props.snapshot.economy.moneyYieldBps)}</dd>
            </div>
            <div>
              <dt>{props.t('reboot.panel.cashflow.maintenance')}</dt>
              <dd>{formatBigValue(props.snapshot.economy.maintenanceMoneyPerSec)}/s</dd>
            </div>
            <div>
              <dt>{props.t('reboot.panel.cashflow.portfolio')}</dt>
              <dd>{formatBigValue(portfolio)}</dd>
            </div>
          </dl>
          </section>

          <section className="cashflow-section">
            <h3>{props.t('reboot.panel.cashflow.hintsTitle')}</h3>
            <ul className="cashflow-hints">
              {hints.map((hint) => (
                <li key={hint}>{hint}</li>
              ))}
            </ul>
          </section>
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
