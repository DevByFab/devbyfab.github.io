import { DASHBOARD_TABS, type DashboardTab } from '../../app/navigationConfig';
import { isDashboardTabUnlocked } from '../../app/useDashboardTabState';

type TranslateFn = (key: string, vars?: Record<string, string | number>) => string;

interface DashboardTabsNavProps {
  phaseIndex: number;
  activeTab: DashboardTab;
  guideActive: boolean;
  onSelectTab: (tab: DashboardTab) => void;
  t: TranslateFn;
}

export function DashboardTabsNav(props: Readonly<DashboardTabsNavProps>) {
  return (
    <nav className="view-nav" role="tablist" aria-label={props.t('reboot.tabs.navLabel')} data-guide="view-nav">
      {DASHBOARD_TABS.map((tab) => {
        const unlocked = isDashboardTabUnlocked(tab.id, props.phaseIndex);
        const isActive = props.activeTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`tab-${tab.id}`}
            aria-controls={`panel-${tab.id}`}
            aria-selected={isActive}
            className={
              unlocked
                ? isActive
                  ? 'view-nav-btn is-active'
                  : 'view-nav-btn'
                : isActive
                  ? 'view-nav-btn is-active is-locked'
                  : 'view-nav-btn is-locked'
            }
            disabled={!unlocked && !props.guideActive}
            onClick={() => {
              if (!unlocked) return;
              props.onSelectTab(tab.id);
            }}
          >
            <span>{props.t(tab.labelKey)}</span>
            {!unlocked ? (
              <small>{props.t('reboot.tabs.lockedUntil', { phase: `P${tab.minPhase}` })}</small>
            ) : null}
          </button>
        );
      })}
    </nav>
  );
}