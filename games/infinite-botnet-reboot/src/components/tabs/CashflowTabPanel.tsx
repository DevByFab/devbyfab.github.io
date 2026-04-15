import { formatBigValue, formatPercentFromBps } from '../../game/format';
import type { GameSnapshot } from '../../game/types';

type TranslateFn = (key: string, vars?: Record<string, string | number>) => string;

interface CashflowTabPanelProps {
  snapshot: GameSnapshot;
  unlocked: boolean;
  onToggleMonetize: () => void;
  onInvestTranche: () => void;
  onCashout: () => void;
  onToggleInvestMode: () => void;
  t: TranslateFn;
}

export function CashflowTabPanel(props: Readonly<CashflowTabPanelProps>) {
  const money = BigInt(props.snapshot.resources.darkMoney);

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
            <button className="btn" disabled={money < 80n} onClick={props.onInvestTranche}>
              {props.t('reboot.panel.cashflow.investTranche')}
            </button>
            <button
              className="btn ghost"
              disabled={BigInt(props.snapshot.resources.portfolio) <= 0n}
              onClick={props.onCashout}
            >
              {props.t('reboot.panel.cashflow.cashout')}
            </button>
          </div>
          <div className="button-row compact">
            <button className="btn ghost" onClick={props.onToggleInvestMode}>
              {props.t('reboot.panel.cashflow.modeLabel')}: {props.snapshot.economy.investMode}
            </button>
          </div>
          <dl className="metrics">
            <div>
              <dt>{props.t('reboot.panel.cashflow.moneyYield')}</dt>
              <dd>{formatPercentFromBps(props.snapshot.economy.moneyYieldBps)}</dd>
            </div>
            <div>
              <dt>{props.t('reboot.panel.cashflow.maintenance')}</dt>
              <dd>{formatBigValue(props.snapshot.economy.maintenanceMoneyPerSec)}</dd>
            </div>
          </dl>
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
