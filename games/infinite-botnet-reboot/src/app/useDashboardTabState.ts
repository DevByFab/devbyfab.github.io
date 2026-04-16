import { useEffect } from 'react';
import type { GameSnapshot } from '../game/types';
import { DASHBOARD_TABS, type DashboardTab } from './navigationConfig';

function findDashboardTab(tabId: DashboardTab) {
  return DASHBOARD_TABS.find((tab) => tab.id === tabId) ?? null;
}

export function isDashboardTabUnlocked(tabId: DashboardTab, phaseIndex: number): boolean {
  const tab = findDashboardTab(tabId);
  if (!tab) return false;
  return phaseIndex >= tab.minPhase;
}

interface DashboardTabPhaseGateParams {
  activeTab: DashboardTab;
  setActiveTab: React.Dispatch<React.SetStateAction<DashboardTab>>;
  snapshot: GameSnapshot | null;
  guideActive: boolean;
}

export function useDashboardTabPhaseGate(params: Readonly<DashboardTabPhaseGateParams>): void {
  useEffect(() => {
    if (!params.snapshot || params.guideActive) return;

    if (!isDashboardTabUnlocked(params.activeTab, params.snapshot.phase.index)) {
      params.setActiveTab('dashboard');
    }
  }, [params]);
}
