import { formatUpgradeCosts } from '../../../app/upgrades';
import type { GameSnapshot } from '../../../game/types';

type TranslateFn = (key: string, vars?: Record<string, string | number>) => string;

interface UpgradesPanelProps {
  snapshot: GameSnapshot;
  onPurchaseUpgrade: (chainId: string) => void;
  t: TranslateFn;
}

export function UpgradesPanel(props: Readonly<UpgradesPanelProps>) {
  const availableUpgradeOffers = props.snapshot.upgrades.offers.filter(
    (offer) => offer.currentLevel < offer.maxLevel && offer.unlocked && !offer.resourceLocked,
  );
  const lockedUpgradeOffers = props.snapshot.upgrades.offers.filter(
    (offer) => offer.currentLevel < offer.maxLevel && !offer.unlocked && !offer.resourceLocked,
  );
  const acquiredUpgradeOffers = props.snapshot.upgrades.offers.filter(
    (offer) => offer.currentLevel > 0,
  );

  return (
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
  );
}