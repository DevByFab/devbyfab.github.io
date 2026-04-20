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

const GUIDE_STEP_TOP_ACTIONS: GuideStepDefinition = {
  id: 'top-actions',
  tab: 'dashboard',
  selector: '[data-guide="top-actions"]',
  focusKey: 'reboot.guide.focus.topActions',
  titleKey: 'reboot.guide.step.topActions.title',
  bodyKey: 'reboot.guide.step.topActions.body',
};

const GUIDE_STEP_RESOURCES: GuideStepDefinition = {
  id: 'resources',
  tab: 'dashboard',
  selector: '[data-guide="resource-grid"]',
  focusKey: 'reboot.guide.focus.resourceGrid',
  titleKey: 'reboot.guide.step.resourceGrid.title',
  bodyKey: 'reboot.guide.step.resourceGrid.body',
};

const GUIDE_STEP_TABS: GuideStepDefinition = {
  id: 'tabs',
  tab: 'dashboard',
  selector: '[data-guide="view-nav"]',
  focusKey: 'reboot.guide.focus.tabs',
  titleKey: 'reboot.guide.step.tabs.title',
  bodyKey: 'reboot.guide.step.tabs.body',
};

const GUIDE_STEP_CORE_OPS: GuideStepDefinition = {
  id: 'core-ops',
  tab: 'dashboard',
  selector: '[data-guide="core-ops"]',
  focusKey: 'reboot.guide.focus.coreOps',
  titleKey: 'reboot.guide.step.coreOps.title',
  bodyKey: 'reboot.guide.step.coreOps.body',
};

const GUIDE_STEP_UPGRADES: GuideStepDefinition = {
  id: 'upgrades',
  tab: 'dashboard',
  selector: '[data-guide="upgrades"]',
  focusKey: 'reboot.guide.focus.upgrades',
  titleKey: 'reboot.guide.step.upgrades.title',
  bodyKey: 'reboot.guide.step.upgrades.body',
};

const GUIDE_STEP_CONSOLE: GuideStepDefinition = {
  id: 'console',
  tab: 'dashboard',
  selector: '[data-guide="console"]',
  focusKey: 'reboot.guide.focus.console',
  titleKey: 'reboot.guide.step.console.title',
  bodyKey: 'reboot.guide.step.console.body',
};

const GUIDE_STEP_CASHFLOW: GuideStepDefinition = {
  id: 'cashflow',
  tab: 'cashflow',
  selector: '[data-guide="cashflow"]',
  focusKey: 'reboot.guide.focus.cashflow',
  titleKey: 'reboot.guide.step.cashflow.title',
  bodyKey: 'reboot.guide.step.cashflow.body',
};

const GUIDE_STEP_MESSAGES: GuideStepDefinition = {
  id: 'messages',
  tab: 'messages',
  selector: '[data-guide="messages"]',
  focusKey: 'reboot.guide.focus.messages',
  titleKey: 'reboot.guide.step.messages.title',
  bodyKey: 'reboot.guide.step.messages.body',
};

const GUIDE_STEPS_P1: ReadonlyArray<GuideStepDefinition> = [
  GUIDE_STEP_TOP_ACTIONS,
  GUIDE_STEP_RESOURCES,
  GUIDE_STEP_TABS,
  GUIDE_STEP_CORE_OPS,
  GUIDE_STEP_UPGRADES,
  GUIDE_STEP_CONSOLE,
];

const GUIDE_STEPS_P2: ReadonlyArray<GuideStepDefinition> = [
  GUIDE_STEP_CASHFLOW,
  GUIDE_STEP_MESSAGES,
  GUIDE_STEP_TABS,
];

export function getGuideStepsForPhase(phaseIndex: number): ReadonlyArray<GuideStepDefinition> {
  if (phaseIndex >= 2) {
    return GUIDE_STEPS_P2;
  }

  return GUIDE_STEPS_P1;
}
