import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { formatBigValue } from './game/format';
import { LORE_SCENES, LoreCinematicCanvas } from './cinematics/lore';
import {
  AUDIO_SETTINGS_STORAGE_KEY,
  LORE_BRIDGE_MS,
  LORE_TRANSITION_MS,
} from './app/constants';
import {
  GUIDE_STEPS,
  type DashboardTab,
} from './app/navigationConfig';
import { useAudioLogCues } from './app/useAudioLogCues';
import { useGameActionHandlers } from './app/useGameActionHandlers';
import { useGuideSpotlight } from './app/useGuideSpotlight';
import { useGameplayHotkeys } from './app/useGameplayHotkeys';
import { useOnboardingActions } from './app/useOnboardingActions';
import { useOnboardingKeyboardShortcuts } from './app/useOnboardingKeyboardShortcuts';
import { useOnboardingLoreReadGate } from './app/useOnboardingLoreReadGate';
import { useOnboardingState } from './app/useOnboardingState';
import { useDashboardTabPhaseGate } from './app/useDashboardTabState';
import { usePhaseUnlockHints } from './app/usePhaseUnlockHints';
import { type GuideRect } from './app/guideLayout';
import {
  clampAudio,
  readAudioSettings,
  writeAudioSettings,
} from './app/storage';
import { ResourceCard } from './components/ResourceCard';
import { GuideOverlay } from './components/overlays/GuideOverlay';
import { LoreBridgeOverlay } from './components/overlays/LoreBridgeOverlay.tsx';
import { LoreOverlay } from './components/overlays/LoreOverlay';
import { SettingsOverlay } from './components/overlays/SettingsOverlay';
import { UnlockHintOverlay } from './components/overlays/UnlockHintOverlay';
import { CashflowTabPanel } from './components/tabs/CashflowTabPanel';
import { DashboardTabPanel } from './components/tabs/DashboardTabPanel';
import { DashboardTabsNav } from './components/tabs/DashboardTabsNav';
import { MatrixTabPanel } from './components/tabs/MatrixTabPanel';
import { MessagesTabPanel } from './components/tabs/MessagesTabPanel';
import { WarTabPanel } from './components/tabs/WarTabPanel';
import { type AudioSettings, useAudioManager } from './hooks/useAudioManager';
import { useGameWorker } from './hooks/useGameWorker';
import { useRebootI18n } from './hooks/useRebootI18n';

type LoreTransitionClass =
  | ''
  | 'lore-transition-out-next'
  | 'lore-transition-in-next'
  | 'lore-transition-out-prev'
  | 'lore-transition-in-prev';

function App() {
  const { t } = useRebootI18n();
  const { snapshot, logs, ready, error, turbo, sendCommand, setTurbo, resetSession } = useGameWorker();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [consoleCollapsed, setConsoleCollapsed] = useState(false);
  const [matrixCommand, setMatrixCommand] = useState('');
  const [audioSettings, setAudioSettings] = useState<AudioSettings>(() =>
    readAudioSettings(AUDIO_SETTINGS_STORAGE_KEY),
  );
  const [activeTab, setActiveTab] = useState<DashboardTab>('dashboard');
  const [guideRect, setGuideRect] = useState<GuideRect | null>(null);
  const [loreSceneIndex, setLoreSceneIndex] = useState(0);
  const [loreTransitionClass, setLoreTransitionClass] = useState<LoreTransitionClass>('');
  const [loreBridgeActive, setLoreBridgeActive] = useState(false);
  const loreDiscoveryStingerPlayedRef = useRef(false);
  const loreTransitionOutTimerRef = useRef<number | null>(null);
  const loreTransitionInTimerRef = useRef<number | null>(null);
  const loreBridgeTimerRef = useRef<number | null>(null);

  const clearLoreTransitionTimers = useCallback(() => {
    if (loreTransitionOutTimerRef.current !== null) {
      window.clearTimeout(loreTransitionOutTimerRef.current);
      loreTransitionOutTimerRef.current = null;
    }

    if (loreTransitionInTimerRef.current !== null) {
      window.clearTimeout(loreTransitionInTimerRef.current);
      loreTransitionInTimerRef.current = null;
    }
  }, []);

  const clearLoreBridgeTimer = useCallback(() => {
    if (loreBridgeTimerRef.current === null) return;
    window.clearTimeout(loreBridgeTimerRef.current);
    loreBridgeTimerRef.current = null;
  }, []);

  const resetLoreScene = useCallback(() => {
    clearLoreTransitionTimers();
    clearLoreBridgeTimer();
    setLoreTransitionClass('');
    setLoreBridgeActive(false);
    setLoreSceneIndex(0);
  }, [clearLoreBridgeTimer, clearLoreTransitionTimers]);

  const {
    introStep,
    setIntroStep,
    guideActive,
    setGuideActive,
    guideStepIndex,
    setGuideMarkSeenOnClose,
    startGuideCore,
    closeGuideCore,
    goGuidePrevCore,
    goGuideNextCore,
  } = useOnboardingState({
    snapshot,
    setActiveTab,
    resetLoreScene,
  });

  useDashboardTabPhaseGate({
    activeTab,
    setActiveTab,
    snapshot,
    guideActive,
  });

  const { playUiCue, playEventCue, playStingerCue, playErrorCue } = useAudioManager(audioSettings);
  const { setUnlockHintId, currentUnlockHint } = usePhaseUnlockHints({
    snapshot,
    playEventCue,
    playStingerCue,
  });

  const latestLogs = useMemo(() => logs.slice(Math.max(0, logs.length - 18)).reverse(), [logs]);
  const currentGuideStep = GUIDE_STEPS[Math.min(guideStepIndex, GUIDE_STEPS.length - 1)];
  const { loreReadReady, loreReadRemainingMs } = useOnboardingLoreReadGate({
    introStep,
    loreSceneIndex,
  });
  const loreReadSecondsLabel = Math.max(0, loreReadRemainingMs / 1000).toLocaleString('fr-FR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  const loreReadinessLabel = loreReadReady
    ? t('reboot.overlay.lore.readReady')
    : t('reboot.overlay.lore.readDelay', {
        seconds: loreReadSecondsLabel,
      });

  useGuideSpotlight({
    guideActive,
    guideSelector: currentGuideStep.selector,
    activeTab,
    guideStepIndex,
    consoleCollapsed,
    settingsOpen,
    phaseIndex: snapshot?.phase.index,
    setGuideRect,
  });

  const loreSceneCount = LORE_SCENES.length;
  const boundedLoreSceneIndex = Math.max(0, Math.min(loreSceneIndex, loreSceneCount - 1));
  const currentLoreScene = LORE_SCENES[boundedLoreSceneIndex] ?? LORE_SCENES[0];
  const loreIsLastScene = boundedLoreSceneIndex >= loreSceneCount - 1;
  const loreTransitionBusy = introStep === 'lore' && (loreTransitionClass.length > 0 || loreBridgeActive);
  const loreCanGoPrev = boundedLoreSceneIndex > 0 && !loreTransitionBusy;
  const loreCanGoNext = loreReadReady && !loreTransitionBusy;
  const loreSceneBody = t(currentLoreScene.i18nKey);
  const loreToneClass = currentLoreScene.toneClass;
  const loreProgressLabel = t('reboot.overlay.lore.progress', {
    current: boundedLoreSceneIndex + 1,
    total: loreSceneCount,
  });

  const runLoreSceneTransition = useCallback(
    (direction: 'next' | 'prev', updateSceneIndex: () => void) => {
      clearLoreTransitionTimers();

      const outClass: LoreTransitionClass =
        direction === 'next' ? 'lore-transition-out-next' : 'lore-transition-out-prev';
      const inClass: LoreTransitionClass =
        direction === 'next' ? 'lore-transition-in-next' : 'lore-transition-in-prev';

      setLoreTransitionClass(outClass);

      loreTransitionOutTimerRef.current = window.setTimeout(() => {
        loreTransitionOutTimerRef.current = null;
        updateSceneIndex();
        setLoreTransitionClass(inClass);

        loreTransitionInTimerRef.current = window.setTimeout(() => {
          loreTransitionInTimerRef.current = null;
          setLoreTransitionClass('');
        }, LORE_TRANSITION_MS);
      }, LORE_TRANSITION_MS);
    },
    [clearLoreTransitionTimers],
  );

  const goLorePrev = useCallback(() => {
    if (loreTransitionBusy) return;
    if (boundedLoreSceneIndex <= 0) return;

    runLoreSceneTransition('prev', () => {
      setLoreSceneIndex((current) => Math.max(0, current - 1));
    });
  }, [boundedLoreSceneIndex, loreTransitionBusy, runLoreSceneTransition]);

  useEffect(() => {
    writeAudioSettings(AUDIO_SETTINGS_STORAGE_KEY, audioSettings);
  }, [audioSettings]);

  useAudioLogCues({
    logs,
    playUiCue,
    playEventCue,
    playStingerCue,
    playErrorCue,
  });

  useGameplayHotkeys({
    snapshot,
    playUiCue,
    sendCommand,
  });

  const gameActions = useGameActionHandlers({
    playUiCue,
    sendCommand,
    matrixCommand,
    setMatrixCommand,
  });

  const onboardingActions = useOnboardingActions({
    playUiCue,
    playErrorCue,
    loreReadReady,
    resetLoreScene,
    setSettingsOpen,
    setUnlockHintId,
    setGuideRect,
    setGuideActive,
    setGuideMarkSeenOnClose,
    setActiveTab,
    setIntroStep,
    startGuideCore,
    closeGuideCore,
    goGuidePrevCore,
    goGuideNextCore,
  });

  const goLoreNext = useCallback(() => {
    if (loreTransitionBusy) {
      return;
    }

    if (!loreReadReady) {
      playErrorCue();
      return;
    }

    if (!loreIsLastScene) {
      runLoreSceneTransition('next', () => {
        setLoreSceneIndex((current) => Math.min(loreSceneCount - 1, current + 1));
      });
      return;
    }

    clearLoreBridgeTimer();
    setLoreBridgeActive(true);
    loreBridgeTimerRef.current = window.setTimeout(() => {
      loreBridgeTimerRef.current = null;
      setLoreBridgeActive(false);
      onboardingActions.continueFromLore();
    }, LORE_BRIDGE_MS);
  }, [
    clearLoreBridgeTimer,
    loreIsLastScene,
    loreReadReady,
    loreSceneCount,
    loreTransitionBusy,
    onboardingActions,
    playErrorCue,
    runLoreSceneTransition,
  ]);

  useOnboardingKeyboardShortcuts({
    introStep,
    guideActive,
    settingsOpen: settingsOpen || (introStep === 'lore' && loreBridgeActive),
    onLorePrev: goLorePrev,
    onLoreNext: goLoreNext,
    onSkipIntro: onboardingActions.skipIntro,
    onGuidePrev: onboardingActions.goGuidePrev,
    onGuideNext: onboardingActions.goGuideNext,
    onCloseGuide: onboardingActions.closeGuide,
  });

  useEffect(() => {
    if (introStep !== 'lore') {
      loreDiscoveryStingerPlayedRef.current = false;
    }
  }, [introStep]);

  useEffect(() => {
    if (introStep === 'lore') return;

    clearLoreTransitionTimers();
    clearLoreBridgeTimer();
  }, [clearLoreBridgeTimer, clearLoreTransitionTimers, introStep]);

  useEffect(() => {
    return () => {
      clearLoreTransitionTimers();
      clearLoreBridgeTimer();
    };
  }, [clearLoreBridgeTimer, clearLoreTransitionTimers]);

  useEffect(() => {
    if (introStep !== 'lore') return;
    if (currentLoreScene.id !== 'botnet-discovery') return;
    if (loreDiscoveryStingerPlayedRef.current) return;

    loreDiscoveryStingerPlayedRef.current = true;
    playStingerCue('loreBotnetDiscovery');
  }, [currentLoreScene.id, introStep, playStingerCue]);

  const updateAudioChannel = (channel: keyof AudioSettings, value: number) => {
    const clamped = clampAudio(value);
    setAudioSettings((current) => ({
      ...current,
      [channel]: clamped,
    }));
  };

  const handleSelectTab = (tab: DashboardTab) => {
    playUiCue('scanClick');
    setActiveTab(tab);
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

  const economyUnlocked = snapshot.phase.index >= 1;
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
              onboardingActions.startGuide(false);
            }}
            data-guide="top-tutorial"
          >
            {t('reboot.header.tutorialButton')}
          </button>
          <button className="btn tiny ghost" onClick={onboardingActions.openSettings} data-guide="settings-open">
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

      <DashboardTabsNav
        phaseIndex={snapshot.phase.index}
        activeTab={activeTab}
        guideActive={guideActive}
        onSelectTab={handleSelectTab}
        t={t}
      />

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
            onSendScan={gameActions.sendScan}
            onSendExploit={gameActions.sendExploit}
            onPurchaseUpgrade={gameActions.purchaseUpgrade}
            t={t}
          />
        ) : null}

        {activeTab === 'cashflow' ? (
          <CashflowTabPanel
            snapshot={snapshot}
            unlocked={economyUnlocked}
            onToggleMonetize={gameActions.toggleMonetize}
            onInvestTranche={gameActions.investTranche}
            onCashout={gameActions.cashoutPortfolio}
            onToggleInvestMode={gameActions.toggleInvestMode}
            t={t}
          />
        ) : null}

        {activeTab === 'messages' ? (
          <MessagesTabPanel
            snapshot={snapshot}
            unlocked={messagesUnlocked}
            onProcessMessage={gameActions.processMessage}
            onQuarantineMessage={gameActions.quarantineMessage}
            t={t}
          />
        ) : null}

        {activeTab === 'war' ? (
          <WarTabPanel
            snapshot={snapshot}
            unlocked={warUnlocked}
            onAttack={gameActions.warAttack}
            onScrub={gameActions.warScrub}
            onFortify={gameActions.warFortify}
            t={t}
          />
        ) : null}

        {activeTab === 'matrix' ? (
          <MatrixTabPanel
            snapshot={snapshot}
            unlocked={matrixUnlocked}
            matrixCommand={matrixCommand}
            onMatrixCommandChange={setMatrixCommand}
            onArm={gameActions.matrixArm}
            onInject={gameActions.matrixInject}
            onStabilize={gameActions.matrixStabilize}
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
          onReplayLore={onboardingActions.replayLoreFromSettings}
          onReplayTutorial={onboardingActions.replayTutorialFromSettings}
          onClose={onboardingActions.closeSettings}
        />
      ) : null}

      {introStep === 'lore' && !loreBridgeActive ? (
        <LoreOverlay
          t={t}
          toneClass={loreToneClass}
          transitionClass={loreTransitionClass}
          visualLayer={
            currentLoreScene.hasCanvasLayer ? (
              <LoreCinematicCanvas sceneId={currentLoreScene.id} active={true} />
            ) : null
          }
          sceneBody={loreSceneBody}
          progressLabel={loreProgressLabel}
          readReady={loreReadReady}
          readinessLabel={loreReadinessLabel}
          canGoPrev={loreCanGoPrev}
          canGoNext={loreCanGoNext}
          isLastScene={loreIsLastScene}
          onPrev={goLorePrev}
          onNext={goLoreNext}
          onSkip={onboardingActions.skipIntro}
        />
      ) : null}

      {introStep === 'lore' && loreBridgeActive ? <LoreBridgeOverlay t={t} /> : null}

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
          onPrev={onboardingActions.goGuidePrev}
          onSkip={() => onboardingActions.closeGuide(true)}
          onNext={onboardingActions.goGuideNext}
        />
      ) : null}
    </main>
  );
}

export default App;
