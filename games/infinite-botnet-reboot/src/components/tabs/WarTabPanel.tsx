import { formatCountdownMs, formatPercentFromBps } from '../../game/format';
import type { GameSnapshot } from '../../game/types';

type TranslateFn = (key: string, vars?: Record<string, string | number>) => string;

interface WarTabPanelProps {
  snapshot: GameSnapshot;
  unlocked: boolean;
  onAttack: () => void;
  onScrub: () => void;
  onFortify: () => void;
  t: TranslateFn;
}

export function WarTabPanel(props: Readonly<WarTabPanelProps>) {
  const bots = BigInt(props.snapshot.resources.bots);
  const money = BigInt(props.snapshot.resources.darkMoney);
  const intel = BigInt(props.snapshot.resources.warIntel);

  const attackCost = BigInt(props.snapshot.war.attackCostBots);
  const scrubCost = BigInt(props.snapshot.war.scrubCostMoney);
  const fortifyCostMoney = BigInt(props.snapshot.war.fortifyCostMoney);
  const fortifyCostIntel = BigInt(props.snapshot.war.fortifyCostIntel);

  return (
    <section className="system-grid" role="tabpanel" id="panel-war" aria-labelledby="tab-war">
      {props.unlocked ? (
        <article className="panel" data-guide="war">
          <h2>{props.t('reboot.panel.war.title')}</h2>
          <p className="panel-copy">{props.t('reboot.panel.war.copy')}</p>
          <div className="meter heat">
            <span style={{ width: `${props.snapshot.war.heat / 100}%` }}></span>
          </div>
          <div className="war-meta">
            <span>
              {props.t('reboot.panel.war.heat')} {props.snapshot.war.heat / 100}%
            </span>
            <span>
              {props.t('reboot.panel.war.success')} {formatPercentFromBps(props.snapshot.war.projectedSuccessBps)}
            </span>
          </div>
          <div className="button-row">
            <button
              className="btn"
              disabled={bots < attackCost || props.snapshot.war.attackCooldownMs > 0}
              onClick={props.onAttack}
            >
              {props.t('reboot.panel.war.attack')}
            </button>
            <button className="btn" disabled={money < scrubCost} onClick={props.onScrub}>
              {props.t('reboot.panel.war.scrub')}
            </button>
            <button
              className="btn"
              disabled={
                money < fortifyCostMoney ||
                intel < fortifyCostIntel ||
                props.snapshot.war.fortifyCooldownMs > 0
              }
              onClick={props.onFortify}
            >
              {props.t('reboot.panel.war.fortify')}
            </button>
          </div>
          <dl className="metrics">
            <div>
              <dt>{props.t('reboot.panel.war.attackCd')}</dt>
              <dd>{formatCountdownMs(props.snapshot.war.attackCooldownMs)}</dd>
            </div>
            <div>
              <dt>{props.t('reboot.panel.war.defense')}</dt>
              <dd>{formatCountdownMs(props.snapshot.war.defenseRemainingMs)}</dd>
            </div>
            <div>
              <dt>{props.t('reboot.panel.war.winLoss')}</dt>
              <dd>
                {props.snapshot.war.wins}/{props.snapshot.war.losses}
              </dd>
            </div>
          </dl>
        </article>
      ) : (
        <article className="panel locked-panel" data-guide="war">
          <h2>{props.t('reboot.panel.war.title')}</h2>
          <p className="panel-copy">{props.t('reboot.panel.war.locked')}</p>
        </article>
      )}
    </section>
  );
}
