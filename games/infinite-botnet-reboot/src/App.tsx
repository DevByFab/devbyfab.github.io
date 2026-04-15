import { useEffect, useMemo, useRef, useState } from 'react';
import { formatBigValue } from './game/format';
import {
  AUDIO_SETTINGS_STORAGE_KEY,
  INTRO_LORE_STORAGE_KEY,
  INTRO_TUTORIAL_STORAGE_KEY,
  LORE_BRIDGE_MS,
  LORE_MIN_READ_MS,
  LORE_TRANSITION_MS,
  UNLOCK_HINT_STORAGE_KEY,
} from './app/constants';
import { type GuideRect } from './app/guideLayout';
import {
  clampAudio,
  readAudioSettings,
  readBooleanFlag,
  readUnlockHints,
  writeAudioSettings,
  writeBooleanFlag,
  writeUnlockHints,
} from './app/storage';
import { hasOwnedUpgrade } from './app/upgrades';
import { ResourceCard } from './components/ResourceCard';
import { GuideOverlay } from './components/overlays/GuideOverlay';
import { LoreBridgeOverlay } from './components/overlays/LoreBridgeOverlay';
import { LoreOverlay } from './components/overlays/LoreOverlay';
import { SettingsOverlay } from './components/overlays/SettingsOverlay';
import { UnlockHintOverlay } from './components/overlays/UnlockHintOverlay';
import { CashflowTabPanel } from './components/tabs/CashflowTabPanel';
import { DashboardTabPanel } from './components/tabs/DashboardTabPanel';
import { MatrixTabPanel } from './components/tabs/MatrixTabPanel';
import { MessagesTabPanel } from './components/tabs/MessagesTabPanel';
import { WarTabPanel } from './components/tabs/WarTabPanel';
import { type AudioSettings, useAudioManager } from './hooks/useAudioManager';
import { useGameWorker } from './hooks/useGameWorker';
import { useRebootI18n } from './hooks/useRebootI18n';

type AudioChannel = keyof AudioSettings;
type DashboardTab = 'dashboard' | 'cashflow' | 'messages' | 'war' | 'matrix';
type IntroStep = 'lore' | 'bridge' | null;
type LoreTransitionDirection = 'next' | 'prev';
type LoreTransitionPhase = 'idle' | 'out' | 'in';

interface DashboardTabDefinition {
  id: DashboardTab;
  labelKey: string;
  minPhase: number;
}

const DASHBOARD_TABS: ReadonlyArray<DashboardTabDefinition> = [
  { id: 'dashboard', labelKey: 'reboot.tabs.dashboard', minPhase: 0 },
  { id: 'cashflow', labelKey: 'reboot.tabs.cashflow', minPhase: 2 },
  { id: 'messages', labelKey: 'reboot.tabs.messages', minPhase: 2 },
  { id: 'war', labelKey: 'reboot.tabs.war', minPhase: 3 },
  { id: 'matrix', labelKey: 'reboot.tabs.matrix', minPhase: 4 },
];

interface UnlockHintDefinition {
  id: string;
  phase: number;
  titleKey: string;
  descriptionKey: string;
}

const UNLOCK_HINTS: ReadonlyArray<UnlockHintDefinition> = [
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

interface GuideStepDefinition {
  id: string;
  tab: DashboardTab;
  selector: string;
  focusKey: string;
  titleKey: string;
  bodyKey: string;
}

interface LoreSceneDefinition {
  id: string;
  bodyKey: string;
  toneClass: string;
  stingerCue?: 'loreBotnetDiscovery';
}

const GUIDE_STEPS: ReadonlyArray<GuideStepDefinition> = [
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

const LORE_SCENES: ReadonlyArray<LoreSceneDefinition> = [
  {
    id: 'fall-start',
    bodyKey: 'reboot.overlay.lore.scene1',
    toneClass: 'lore-scene-fall-start',
  },
  {
    id: 'fall-pressure',
    bodyKey: 'reboot.overlay.lore.scene2',
    toneClass: 'lore-scene-fall-pressure',
  },
  {
    id: 'eviction-hit',
    bodyKey: 'reboot.overlay.lore.scene3',
    toneClass: 'lore-scene-eviction-hit',
  },
  {
    id: 'botnet-discovery',
    bodyKey: 'reboot.overlay.lore.scene4',
    toneClass: 'lore-scene-botnet-discovery',
    stingerCue: 'loreBotnetDiscovery',
  },
  {
    id: 'tutorial-bridge',
    bodyKey: 'reboot.overlay.lore.scene5',
    toneClass: 'lore-scene-tutorial-bridge',
  },
];

function App() {
  const { t } = useRebootI18n();
  const { snapshot, logs, ready, error, turbo, sendCommand, setTurbo, resetSession } = useGameWorker();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [consoleCollapsed, setConsoleCollapsed] = useState(false);
  const [matrixCommand, setMatrixCommand] = useState('');
  const [introStep, setIntroStep] = useState<IntroStep>(null);
  const [loreSceneIndex, setLoreSceneIndex] = useState(0);
  const [loreTransitionDirection, setLoreTransitionDirection] =
    useState<LoreTransitionDirection>('next');
  const [loreTransitionPhase, setLoreTransitionPhase] = useState<LoreTransitionPhase>('idle');
  const [loreReadReady, setLoreReadReady] = useState(false);
  const [loreReadRemainingMs, setLoreReadRemainingMs] = useState(0);
  const [introBootstrapped, setIntroBootstrapped] = useState(false);
  const [lastPhaseIndex, setLastPhaseIndex] = useState<number | null>(null);
  const [seenUnlockHints, setSeenUnlockHints] = useState<string[]>(() =>
    readUnlockHints(UNLOCK_HINT_STORAGE_KEY),
  );
  const [unlockHintId, setUnlockHintId] = useState<string | null>(null);
  const [audioSettings, setAudioSettings] = useState<AudioSettings>(() =>
    readAudioSettings(AUDIO_SETTINGS_STORAGE_KEY),
  );
  const [activeTab, setActiveTab] = useState<DashboardTab>('dashboard');
  const [guideActive, setGuideActive] = useState(false);
  const [guideStepIndex, setGuideStepIndex] = useState(0);
  const [guideMarkSeenOnClose, setGuideMarkSeenOnClose] = useState(false);
  const [guideRect, setGuideRect] = useState<GuideRect | null>(null);

  const snapshotRef = useRef(snapshot);
  const lastAudioLogIdRef = useRef<string | null>(null);
  const loreTransitionTimerRef = useRef<number | null>(null);
  const loreTransitionSettleTimerRef = useRef<number | null>(null);
  const loreReadGateTimerRef = useRef<number | null>(null);
  const loreBridgeTimerRef = useRef<number | null>(null);

  const { playUiCue, playEventCue, playStingerCue, playErrorCue } = useAudioManager(audioSettings);

  const latestLogs = useMemo(() => logs.slice(Math.max(0, logs.length - 18)).reverse(), [logs]);
  const currentGuideStep = GUIDE_STEPS[Math.min(guideStepIndex, GUIDE_STEPS.length - 1)];
  const currentUnlockHint =
    unlockHintId === null ? null : UNLOCK_HINTS.find((hint) => hint.id === unlockHintId) ?? null;
  const currentLoreScene = LORE_SCENES[Math.min(loreSceneIndex, LORE_SCENES.length - 1)];
  const loreTransitionClass =
    loreTransitionPhase === 'out'
      ? loreTransitionDirection === 'next'
        ? 'lore-transition-out-next'
        : 'lore-transition-out-prev'
      : loreTransitionPhase === 'in'
        ? loreTransitionDirection === 'next'
          ? 'lore-transition-in-next'
          : 'lore-transition-in-prev'
        : 'lore-transition-idle';
  const loreReadSecondsLabel = Math.max(0, loreReadRemainingMs / 1000).toLocaleString('fr-FR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  const loreReadinessLabel = loreReadReady
    ? t('reboot.overlay.lore.readReady')
    : t('reboot.overlay.lore.readDelay', {
        seconds: loreReadSecondsLabel,
      });
  const loreProgressLabel = t('reboot.overlay.lore.progress', {
    current: loreSceneIndex + 1,
    total: LORE_SCENES.length,
  });

  useEffect(() => {
    return () => {
      if (loreTransitionTimerRef.current !== null) {
        window.clearTimeout(loreTransitionTimerRef.current);
        loreTransitionTimerRef.current = null;
      }
      if (loreTransitionSettleTimerRef.current !== null) {
        window.clearTimeout(loreTransitionSettleTimerRef.current);
        loreTransitionSettleTimerRef.current = null;
      }
      if (loreReadGateTimerRef.current !== null) {
        window.clearInterval(loreReadGateTimerRef.current);
        loreReadGateTimerRef.current = null;
      }
      if (loreBridgeTimerRef.current !== null) {
        window.clearTimeout(loreBridgeTimerRef.current);
        loreBridgeTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    writeAudioSettings(AUDIO_SETTINGS_STORAGE_KEY, audioSettings);
  }, [audioSettings]);

  useEffect(() => {
    snapshotRef.current = snapshot;
  }, [snapshot]);

  useEffect(() => {
    const line = logs.at(-1);
    if (!line) return;

    if (lastAudioLogIdRef.current === line.id) return;
    lastAudioLogIdRef.current = line.id;

    let hasDedicatedFailureCue = false;

    if (line.text.includes('Upgrade achetee')) {
      playUiCue('upgradeBuy');
      playStingerCue('upgradeTier2');
    }

    if (line.text.includes('Scan manuel: cible ajoutee')) {
      playEventCue('targetFound');
    }

    if (line.text.includes('Phase atteinte')) {
      playEventCue('phaseShift');
    }

    if (line.text.includes('Nouveau message intercepte')) {
      playEventCue('incomingMessage');
    }

    if (line.text.includes('Exploit reussi')) {
      playEventCue('exploitSuccess');
    }

    if (line.text.includes('Exploit rate') || line.text.includes('Exploit bloque')) {
      hasDedicatedFailureCue = true;
      playEventCue('exploitFail');
    }

    if ((line.severity === 'warn' || line.severity === 'error') && !hasDedicatedFailureCue) {
      playErrorCue();
    }
  }, [logs, playErrorCue, playEventCue, playStingerCue, playUiCue]);

  useEffect(() => {
    if (!snapshot || introBootstrapped) return;

    const loreSeen = readBooleanFlag(INTRO_LORE_STORAGE_KEY);
    const tutorialSeen = readBooleanFlag(INTRO_TUTORIAL_STORAGE_KEY);

    if (!loreSeen) {
      setIntroStep('lore');
      setLoreSceneIndex(0);
      setLoreTransitionDirection('next');
      setLoreTransitionPhase('idle');
    } else if (!tutorialSeen) {
      setActiveTab(GUIDE_STEPS[0].tab);
      setGuideStepIndex(0);
      setGuideMarkSeenOnClose(true);
      setGuideActive(true);
    }

    setLastPhaseIndex(snapshot.phase.index);
    setIntroBootstrapped(true);
  }, [snapshot, introBootstrapped]);

  useEffect(() => {
    if (loreReadGateTimerRef.current !== null) {
      window.clearInterval(loreReadGateTimerRef.current);
      loreReadGateTimerRef.current = null;
    }

    if (introStep !== 'lore') {
      setLoreReadReady(false);
      setLoreReadRemainingMs(0);
      return;
    }

    if (loreTransitionPhase !== 'idle') {
      setLoreReadReady(false);
      setLoreReadRemainingMs(LORE_MIN_READ_MS);
      return;
    }

    const gateEndsAt = Date.now() + LORE_MIN_READ_MS;

    const updateReadGate = () => {
      const remaining = Math.max(0, gateEndsAt - Date.now());
      setLoreReadRemainingMs(remaining);

      if (remaining <= 0) {
        setLoreReadReady(true);
        if (loreReadGateTimerRef.current !== null) {
          window.clearInterval(loreReadGateTimerRef.current);
          loreReadGateTimerRef.current = null;
        }
      }
    };

    setLoreReadReady(false);
    updateReadGate();
    loreReadGateTimerRef.current = window.setInterval(updateReadGate, 80);

    return () => {
      if (loreReadGateTimerRef.current !== null) {
        window.clearInterval(loreReadGateTimerRef.current);
        loreReadGateTimerRef.current = null;
      }
    };
  }, [introStep, loreSceneIndex, loreTransitionPhase]);

  useEffect(() => {
    if (!snapshot || lastPhaseIndex === null) {
      return;
    }

    if (snapshot.phase.index <= lastPhaseIndex) {
      return;
    }

    if (lastPhaseIndex < 2 && snapshot.phase.index >= 2) {
      playEventCue('marketUnlock');
      playStingerCue('marketTier2');
    }

    setLastPhaseIndex(snapshot.phase.index);

    const nextUnlockHint = UNLOCK_HINTS.find(
      (candidate) =>
        candidate.phase === snapshot.phase.index && !seenUnlockHints.includes(candidate.id),
    );

    if (!nextUnlockHint) {
      return;
    }

    const nextSeenUnlockHints = [...seenUnlockHints, nextUnlockHint.id];
    setSeenUnlockHints(nextSeenUnlockHints);
    writeUnlockHints(UNLOCK_HINT_STORAGE_KEY, nextSeenUnlockHints);
    setUnlockHintId(nextUnlockHint.id);
  }, [lastPhaseIndex, playEventCue, playStingerCue, seenUnlockHints, snapshot]);

  useEffect(() => {
    if (!snapshot || guideActive) return;

    const currentTab = DASHBOARD_TABS.find((tab) => tab.id === activeTab);
    if (!currentTab) {
      setActiveTab('dashboard');
      return;
    }

    if (snapshot.phase.index < currentTab.minPhase) {
      setActiveTab('dashboard');
    }
  }, [activeTab, guideActive, snapshot]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (introStep !== null || settingsOpen || guideActive || unlockHintId !== null) {
        return;
      }

      const currentSnapshot = snapshotRef.current;
      if (!currentSnapshot) {
        return;
      }

      const key = event.key.toLowerCase();
      if (key !== 'enter' && key !== 'x') {
        return;
      }

      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      ) {
        return;
      }

      if (key === 'enter') {
        event.preventDefault();
        playUiCue('scanClick');
        sendCommand({ type: 'SCAN' });
        return;
      }

      const exploitHotkeyUnlocked = hasOwnedUpgrade(
        currentSnapshot.upgrades.offers,
        'qol-operator-macros',
      );
      if (!exploitHotkeyUnlocked) {
        return;
      }

      if (
        BigInt(currentSnapshot.resources.queuedTargets) <= 0n ||
        currentSnapshot.economy.exploitCooldownMs > 0
      ) {
        return;
      }

      event.preventDefault();
      playUiCue('exploitClick');
      sendCommand({ type: 'EXPLOIT' });
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [guideActive, introStep, playUiCue, sendCommand, settingsOpen, unlockHintId]);

  useEffect(() => {
    if (!guideActive) return;

    const frame = window.requestAnimationFrame(() => {
      const target = document.querySelector(currentGuideStep.selector);
      if (target instanceof HTMLElement) {
        target.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [activeTab, currentGuideStep.selector, guideActive, guideStepIndex]);

  useEffect(() => {
    if (!guideActive) {
      setGuideRect(null);
      return;
    }

    const computeRect = () => {
      const target = document.querySelector(currentGuideStep.selector);
      if (!(target instanceof HTMLElement)) {
        setGuideRect(null);
        return;
      }

      const rect = target.getBoundingClientRect();
      const padding = 8;
      setGuideRect({
        top: Math.max(8, rect.top - padding),
        left: Math.max(8, rect.left - padding),
        width: Math.min(window.innerWidth - 16, rect.width + padding * 2),
        height: Math.min(window.innerHeight - 16, rect.height + padding * 2),
      });
    };

    computeRect();
    window.addEventListener('resize', computeRect);

    return () => {
      window.removeEventListener('resize', computeRect);
    };
  }, [activeTab, consoleCollapsed, currentGuideStep.selector, guideActive, settingsOpen, snapshot?.phase.index]);

  const updateAudioChannel = (channel: AudioChannel, value: number) => {
    const clamped = clampAudio(value);
    setAudioSettings((current) => ({
      ...current,
      [channel]: clamped,
    }));
  };

  const activateGuideStep = (index: number) => {
    const bounded = Math.max(0, Math.min(GUIDE_STEPS.length - 1, index));
    const step = GUIDE_STEPS[bounded];
    setActiveTab(step.tab);
    setGuideStepIndex(bounded);
  };

  const startGuide = (markSeenOnClose: boolean) => {
    setIntroStep(null);
    setSettingsOpen(false);
    setUnlockHintId(null);
    activateGuideStep(0);
    setGuideMarkSeenOnClose(markSeenOnClose);
    setGuideActive(true);
  };

  const closeGuide = (forceMarkAsSeen: boolean) => {
    if (forceMarkAsSeen || guideMarkSeenOnClose) {
      writeBooleanFlag(INTRO_TUTORIAL_STORAGE_KEY);
    }

    setGuideActive(false);
    setGuideStepIndex(0);
    setGuideMarkSeenOnClose(false);
    setGuideRect(null);
    setActiveTab('dashboard');
  };

  const clearLoreTransitionTimers = () => {
    if (loreTransitionTimerRef.current !== null) {
      window.clearTimeout(loreTransitionTimerRef.current);
      loreTransitionTimerRef.current = null;
    }

    if (loreTransitionSettleTimerRef.current !== null) {
      window.clearTimeout(loreTransitionSettleTimerRef.current);
      loreTransitionSettleTimerRef.current = null;
    }
  };

  const clearLoreBridgeTimer = () => {
    if (loreBridgeTimerRef.current !== null) {
      window.clearTimeout(loreBridgeTimerRef.current);
      loreBridgeTimerRef.current = null;
    }
  };

  const transitionLoreScene = (targetIndex: number, direction: LoreTransitionDirection) => {
    if (loreTransitionPhase !== 'idle') {
      return;
    }

    if (targetIndex < 0 || targetIndex >= LORE_SCENES.length) {
      return;
    }

    clearLoreTransitionTimers();
    setLoreTransitionDirection(direction);
    setLoreTransitionPhase('out');

    loreTransitionTimerRef.current = window.setTimeout(() => {
      loreTransitionTimerRef.current = null;

      const targetScene = LORE_SCENES[targetIndex];
      setLoreSceneIndex(targetIndex);

      if (targetScene.stingerCue) {
        playStingerCue(targetScene.stingerCue);
      }

      setLoreTransitionPhase('in');
      loreTransitionSettleTimerRef.current = window.setTimeout(() => {
        loreTransitionSettleTimerRef.current = null;
        setLoreTransitionPhase('idle');
      }, LORE_TRANSITION_MS);
    }, LORE_TRANSITION_MS);
  };

  const continueFromLore = () => {
    clearLoreTransitionTimers();
    clearLoreBridgeTimer();
    writeBooleanFlag(INTRO_LORE_STORAGE_KEY);
    setLoreSceneIndex(0);
    setLoreTransitionDirection('next');
    setLoreTransitionPhase('idle');

    if (readBooleanFlag(INTRO_TUTORIAL_STORAGE_KEY)) {
      setIntroStep(null);
      return;
    }

    setIntroStep('bridge');
    loreBridgeTimerRef.current = window.setTimeout(() => {
      loreBridgeTimerRef.current = null;
      startGuide(true);
    }, LORE_BRIDGE_MS);
  };

  const skipIntro = () => {
    clearLoreTransitionTimers();
    clearLoreBridgeTimer();
    writeBooleanFlag(INTRO_LORE_STORAGE_KEY);
    writeBooleanFlag(INTRO_TUTORIAL_STORAGE_KEY);
    setLoreSceneIndex(0);
    setLoreTransitionDirection('next');
    setLoreTransitionPhase('idle');
    setLoreReadReady(false);
    setLoreReadRemainingMs(0);
    setIntroStep(null);
    setGuideActive(false);
    setGuideMarkSeenOnClose(false);
    setActiveTab('dashboard');
  };

  const goLorePrev = () => {
    if (loreSceneIndex <= 0 || loreTransitionPhase !== 'idle') {
      return;
    }

    playUiCue('scanClick');
    transitionLoreScene(loreSceneIndex - 1, 'prev');
  };

  const goLoreNext = () => {
    if (loreTransitionPhase !== 'idle') {
      return;
    }

    if (!loreReadReady) {
      playErrorCue();
      return;
    }

    if (loreSceneIndex >= LORE_SCENES.length - 1) {
      playUiCue('scanClick');
      continueFromLore();
      return;
    }

    playUiCue('scanClick');
    transitionLoreScene(loreSceneIndex + 1, 'next');
  };

  useEffect(() => {
    if (introStep !== 'lore') {
      return;
    }

    const onLoreKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      ) {
        return;
      }

      if (event.key === 'ArrowRight' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        goLoreNext();
        return;
      }

      if (event.key === 'ArrowLeft' || event.key === 'Backspace') {
        event.preventDefault();
        goLorePrev();
        return;
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        skipIntro();
      }
    };

    window.addEventListener('keydown', onLoreKeyDown);
    return () => {
      window.removeEventListener('keydown', onLoreKeyDown);
    };
  }, [goLoreNext, goLorePrev, introStep, skipIntro]);

  const goGuidePrev = () => {
    activateGuideStep(guideStepIndex - 1);
  };

  const goGuideNext = () => {
    if (guideStepIndex >= GUIDE_STEPS.length - 1) {
      closeGuide(true);
      return;
    }

    activateGuideStep(guideStepIndex + 1);
  };

  const openSettings = () => {
    playUiCue('settingsOpen');
    setSettingsOpen(true);
  };

  const closeSettings = () => {
    playUiCue('settingsClose');
    setSettingsOpen(false);
  };

  const replayLoreFromSettings = () => {
    closeSettings();
    clearLoreBridgeTimer();
    clearLoreTransitionTimers();
    setGuideActive(false);
    setGuideMarkSeenOnClose(false);
    setActiveTab('dashboard');
    setLoreSceneIndex(0);
    setLoreTransitionDirection('next');
    setLoreTransitionPhase('idle');
    setLoreReadReady(false);
    setLoreReadRemainingMs(LORE_MIN_READ_MS);
    setIntroStep('lore');
  };

  const replayTutorialFromSettings = () => {
    closeSettings();
    startGuide(false);
  };

  if (!snapshot) {
    return (
      <main className="loading-shell">
        <h1>{t('reboot.app.title')}</h1>
        {error ? (
          <>
            <p className="error-banner">
              {t('reboot.loading.errorPrefix')}: {error}
            </p>
            <p className="loading-help">{t('reboot.loading.help')}</p>
            <button
              className="btn"
              onClick={() => {
                playUiCue('scanClick');
                window.location.reload();
              }}
            >
              {t('reboot.loading.reload')}
            </button>
          </>
        ) : (
          <p>{t('reboot.loading.initializing')}</p>
        )}
      </main>
    );
  }

  const economyUnlocked = snapshot.phase.index >= 2;
  const messagesUnlocked = snapshot.phase.index >= 2;
  const warUnlocked = snapshot.phase.index >= 3;
  const matrixUnlocked = snapshot.phase.index >= 4;

  const phaseGateBlocked = snapshot.phase.requirements.some((requirement) => !requirement.met);

  return (
    <main className="app-shell compact-shell">
      <div className="app-atmosphere" aria-hidden="true"></div>

      <header className="top-bar compact-top-bar">
        <div>
          <p className="eyebrow">{t('reboot.header.eyebrow')}</p>
          <h1>{t('reboot.app.title')}</h1>
          <p className="phase-line">
            {t('reboot.header.phaseLine', {
              phase: snapshot.phase.label,
              next: snapshot.phase.nextLabel,
              owned: snapshot.upgrades.totalOwnedLevels,
              total: snapshot.upgrades.totalMaxLevels,
            })}
          </p>
        </div>
        <div className="top-actions" data-guide="top-actions">
          <button
            className="btn tiny ghost"
            onClick={() => {
              playUiCue('scanClick');
              startGuide(false);
            }}
            data-guide="top-tutorial"
          >
            {t('reboot.header.tutorialButton')}
          </button>
          <button className="btn tiny ghost" onClick={openSettings} data-guide="settings-open">
            {t('reboot.header.settingsButton')}
          </button>
          <p className={ready ? 'status-chip is-online' : 'status-chip'}>
            {ready ? t('reboot.header.workerOnline') : t('reboot.header.workerBooting')}
          </p>
          <button
            className="btn ghost tiny"
            onClick={() => {
              playUiCue('scanClick');
              resetSession();
            }}
          >
            {t('reboot.header.resetButton')}
          </button>
        </div>
      </header>

      {error ? <p className="error-banner">{t('reboot.header.workerErrorPrefix')}: {error}</p> : null}

      <section className="phase-progress panel-lite" aria-hidden="true">
        <div className="phase-progress-head">
          <span>{t('reboot.hiddenPhase.title')}</span>
          <strong>{(snapshot.phase.progressBps / 100).toFixed(2)}%</strong>
        </div>
        <div className="meter">
          <span style={{ width: `${snapshot.phase.progressBps / 100}%` }}></span>
        </div>
        {snapshot.phase.requirements.length > 0 ? (
          <div className="phase-requirements">
            {snapshot.phase.requirements.map((requirement) => (
              <p
                key={requirement.id}
                className={requirement.met ? 'phase-req is-met' : 'phase-req is-pending'}
              >
                <span>{requirement.label}</span>
                <strong>
                  {formatBigValue(requirement.current)} / {formatBigValue(requirement.target)}
                </strong>
              </p>
            ))}
          </div>
        ) : null}
        {snapshot.phase.requirements.length > 0 ? (
          <p className="phase-gate-note">
            {phaseGateBlocked ? t('reboot.hiddenPhase.blocked') : t('reboot.hiddenPhase.ready')}
          </p>
        ) : null}
      </section>

      <section className="resource-grid compact-grid" data-guide="resource-grid">
        <ResourceCard label={t('reboot.resources.bots')} value={snapshot.resources.bots} />
        <ResourceCard label={t('reboot.resources.targets')} value={snapshot.resources.queuedTargets} />
        <ResourceCard label={t('reboot.resources.darkMoney')} value={snapshot.resources.darkMoney} />
        {economyUnlocked ? (
          <ResourceCard label={t('reboot.resources.portfolio')} value={snapshot.resources.portfolio} />
        ) : null}
        {warUnlocked ? (
          <ResourceCard label={t('reboot.resources.warIntel')} value={snapshot.resources.warIntel} />
        ) : null}
        {matrixUnlocked ? <ResourceCard label={t('reboot.resources.hz')} value={snapshot.resources.hz} /> : null}
        {matrixUnlocked ? (
          <ResourceCard label={t('reboot.resources.brainMatter')} value={snapshot.resources.brainMatter} />
        ) : null}
        {matrixUnlocked ? (
          <ResourceCard label={t('reboot.resources.computronium')} value={snapshot.resources.computronium} />
        ) : null}
      </section>

      <nav
        className="view-nav"
        role="tablist"
        aria-label={t('reboot.tabs.navLabel')}
        data-guide="view-nav"
      >
        {DASHBOARD_TABS.map((tab) => {
          const unlocked = snapshot.phase.index >= tab.minPhase;
          const isActive = activeTab === tab.id;

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
              disabled={!unlocked && !guideActive}
              onClick={() => {
                if (!unlocked) return;
                playUiCue('scanClick');
                setActiveTab(tab.id);
              }}
            >
              <span>{t(tab.labelKey)}</span>
              {!unlocked ? (
                <small>{t('reboot.tabs.lockedUntil', { phase: `P${tab.minPhase}` })}</small>
              ) : null}
            </button>
          );
        })}
      </nav>

      <section className="tab-stage">
        {activeTab === 'dashboard' ? (
          <DashboardTabPanel
            snapshot={snapshot}
            latestLogs={latestLogs}
            consoleCollapsed={consoleCollapsed}
            onToggleConsole={() => {
              playUiCue('scanClick');
              setConsoleCollapsed((current) => !current);
            }}
            onSendScan={() => {
              playUiCue('scanClick');
              sendCommand({ type: 'SCAN' });
            }}
            onSendExploit={() => {
              playUiCue('exploitClick');
              sendCommand({ type: 'EXPLOIT' });
            }}
            onPurchaseUpgrade={(chainId) => {
              playUiCue('scanClick');
              sendCommand({
                type: 'PURCHASE_UPGRADE',
                payload: { chainId },
              });
            }}
            t={t}
          />
        ) : null}

        {activeTab === 'cashflow' ? (
          <CashflowTabPanel
            snapshot={snapshot}
            unlocked={economyUnlocked}
            onToggleMonetize={() => {
              playUiCue('scanClick');
              sendCommand({ type: 'TOGGLE_MONETIZE' });
            }}
            onInvestTranche={() => {
              playUiCue('scanClick');
              sendCommand({ type: 'INVEST_TRANCHE' });
            }}
            onCashout={() => {
              playUiCue('scanClick');
              sendCommand({ type: 'CASHOUT_PORTFOLIO' });
            }}
            onToggleInvestMode={() => {
              playUiCue('scanClick');
              sendCommand({ type: 'TOGGLE_INVEST_MODE' });
            }}
            t={t}
          />
        ) : null}

        {activeTab === 'messages' ? (
          <MessagesTabPanel
            snapshot={snapshot}
            unlocked={messagesUnlocked}
            onProcessMessage={() => {
              playUiCue('scanClick');
              sendCommand({ type: 'MESSAGE_PROCESS' });
            }}
            onQuarantineMessage={() => {
              playUiCue('scanClick');
              sendCommand({ type: 'MESSAGE_QUARANTINE' });
            }}
            t={t}
          />
        ) : null}

        {activeTab === 'war' ? (
          <WarTabPanel
            snapshot={snapshot}
            unlocked={warUnlocked}
            onAttack={() => {
              playUiCue('scanClick');
              sendCommand({ type: 'WAR_ATTACK' });
            }}
            onScrub={() => {
              playUiCue('scanClick');
              sendCommand({ type: 'WAR_SCRUB' });
            }}
            onFortify={() => {
              playUiCue('scanClick');
              sendCommand({ type: 'WAR_FORTIFY' });
            }}
            t={t}
          />
        ) : null}

        {activeTab === 'matrix' ? (
          <MatrixTabPanel
            snapshot={snapshot}
            unlocked={matrixUnlocked}
            matrixCommand={matrixCommand}
            onMatrixCommandChange={setMatrixCommand}
            onArm={() => {
              playUiCue('scanClick');
              sendCommand({ type: 'MATRIX_ARM' });
            }}
            onInject={() => {
              playUiCue('scanClick');
              sendCommand({ type: 'MATRIX_INJECT', payload: { commandText: matrixCommand } });
              setMatrixCommand('');
            }}
            onStabilize={() => {
              playUiCue('scanClick');
              sendCommand({ type: 'MATRIX_STABILIZE' });
            }}
            t={t}
          />
        ) : null}
      </section>

      {settingsOpen ? (
        <SettingsOverlay
          t={t}
          snapshot={snapshot}
          turbo={turbo}
          audioSettings={audioSettings}
          onUpdateAudio={updateAudioChannel}
          onSetTurbo={(value) => {
            playUiCue('scanClick');
            setTurbo(value);
          }}
          onReplayLore={replayLoreFromSettings}
          onReplayTutorial={replayTutorialFromSettings}
          onClose={closeSettings}
        />
      ) : null}

      {introStep === 'lore' ? (
        <LoreOverlay
          t={t}
          toneClass={currentLoreScene.toneClass}
          transitionClass={loreTransitionClass}
          sceneBody={t(currentLoreScene.bodyKey)}
          progressLabel={loreProgressLabel}
          readReady={loreReadReady}
          readinessLabel={loreReadinessLabel}
          canGoPrev={loreSceneIndex > 0 && loreTransitionPhase === 'idle'}
          canGoNext={loreTransitionPhase === 'idle' && loreReadReady}
          isLastScene={loreSceneIndex >= LORE_SCENES.length - 1}
          onPrev={goLorePrev}
          onNext={goLoreNext}
          onSkip={skipIntro}
        />
      ) : null}

      {introStep === 'bridge' ? <LoreBridgeOverlay t={t} /> : null}

      {currentUnlockHint && introStep === null && !guideActive ? (
        <UnlockHintOverlay
          t={t}
          title={t(currentUnlockHint.titleKey)}
          description={t(currentUnlockHint.descriptionKey)}
          onContinue={() => setUnlockHintId(null)}
        />
      ) : null}

      {guideActive ? (
        <GuideOverlay
          t={t}
          guideRect={guideRect}
          title={t(currentGuideStep.titleKey)}
          focus={t(currentGuideStep.focusKey)}
          body={t(currentGuideStep.bodyKey)}
          currentStep={guideStepIndex + 1}
          totalSteps={GUIDE_STEPS.length}
          canGoPrev={guideStepIndex > 0}
          isLastStep={guideStepIndex >= GUIDE_STEPS.length - 1}
          onPrev={goGuidePrev}
          onSkip={() => closeGuide(true)}
          onNext={goGuideNext}
        />
      ) : null}
    </main>
  );
}

export default App;
