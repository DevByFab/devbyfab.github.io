export type DashboardTab = 'dashboard' | 'cashflow' | 'messages' | 'war' | 'matrix';

export interface DashboardTabDefinition {
  id: DashboardTab;
  labelKey: string;
  minPhase: number;
}

export const DASHBOARD_TABS: ReadonlyArray<DashboardTabDefinition> = [
  { id: 'dashboard', labelKey: 'reboot.tabs.dashboard', minPhase: 0 },
  { id: 'cashflow', labelKey: 'reboot.tabs.cashflow', minPhase: 2 },
  { id: 'messages', labelKey: 'reboot.tabs.messages', minPhase: 2 },
  { id: 'war', labelKey: 'reboot.tabs.war', minPhase: 3 },
  { id: 'matrix', labelKey: 'reboot.tabs.matrix', minPhase: 4 },
];

export interface UnlockHintDefinition {
  id: string;
  phase: number;
  titleKey: string;
  descriptionKey: string;
}

export const UNLOCK_HINTS: ReadonlyArray<UnlockHintDefinition> = [
  {
    id: 'phase-p2-cashflow',
    phase: 2,
    titleKey: 'reboot.unlock.phaseP2.title',
    descriptionKey: 'reboot.unlock.phaseP2.description',
  },
  {
    id: 'phase-p3-war',
    phase: 3,
    titleKey: 'reboot.unlock.phaseP3.title',
    descriptionKey: 'reboot.unlock.phaseP3.description',
  },
  {
    id: 'phase-p4-matrix',
    phase: 4,
    titleKey: 'reboot.unlock.phaseP4.title',
    descriptionKey: 'reboot.unlock.phaseP4.description',
  },
  {
    id: 'phase-p5-singularity',
    phase: 5,
    titleKey: 'reboot.unlock.phaseP5.title',
    descriptionKey: 'reboot.unlock.phaseP5.description',
  },
];

export interface GuideStepDefinition {
  id: string;
  tab: DashboardTab;
  selector: string;
  focusKey: string;
  titleKey: string;
  bodyKey: string;
}

export const GUIDE_STEPS: ReadonlyArray<GuideStepDefinition> = [
  {
    id: 'top-actions',
    tab: 'dashboard',
    selector: '[data-guide="top-actions"]',
    focusKey: 'reboot.guide.focus.topActions',
    titleKey: 'reboot.guide.step.topActions.title',
    bodyKey: 'reboot.guide.step.topActions.body',
  },
  {
    id: 'resources',
    tab: 'dashboard',
    selector: '[data-guide="resource-grid"]',
    focusKey: 'reboot.guide.focus.resourceGrid',
    titleKey: 'reboot.guide.step.resourceGrid.title',
    bodyKey: 'reboot.guide.step.resourceGrid.body',
  },
  {
    id: 'tabs',
    tab: 'dashboard',
    selector: '[data-guide="view-nav"]',
    focusKey: 'reboot.guide.focus.tabs',
    titleKey: 'reboot.guide.step.tabs.title',
    bodyKey: 'reboot.guide.step.tabs.body',
  },
  {
    id: 'core-ops',
    tab: 'dashboard',
    selector: '[data-guide="core-ops"]',
    focusKey: 'reboot.guide.focus.coreOps',
    titleKey: 'reboot.guide.step.coreOps.title',
    bodyKey: 'reboot.guide.step.coreOps.body',
  },
  {
    id: 'upgrades',
    tab: 'dashboard',
    selector: '[data-guide="upgrades"]',
    focusKey: 'reboot.guide.focus.upgrades',
    titleKey: 'reboot.guide.step.upgrades.title',
    bodyKey: 'reboot.guide.step.upgrades.body',
  },
  {
    id: 'console',
    tab: 'dashboard',
    selector: '[data-guide="console"]',
    focusKey: 'reboot.guide.focus.console',
    titleKey: 'reboot.guide.step.console.title',
    bodyKey: 'reboot.guide.step.console.body',
  },
];
