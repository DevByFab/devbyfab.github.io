import type { ReactNode } from 'react';

type TranslateFn = (key: string, vars?: Record<string, string | number>) => string;

interface LoreOverlayProps {
  t: TranslateFn;
  toneClass: string;
  transitionClass: string;
  visualLayer?: ReactNode;
  sceneBody: string;
  progressLabel: string;
  readReady: boolean;
  readinessLabel: string;
  canGoPrev: boolean;
  canGoNext: boolean;
  isLastScene: boolean;
  onPrev: () => void;
  onNext: () => void;
  onSkip: () => void;
}

export function LoreOverlay(props: Readonly<LoreOverlayProps>) {
  return (
    <aside
      className={`overlay-backdrop lore-overlay ${props.toneClass}`}
      role="dialog"
      aria-modal="true"
      aria-label={props.t('reboot.overlay.lore.dialogLabel')}
    >
      <div className={`overlay-card lore-cinematic-card ${props.toneClass} ${props.transitionClass}`}>
        <div className="lore-cinematic-layer lore-layer-grid" aria-hidden="true"></div>
        <div className="lore-cinematic-layer lore-layer-glow" aria-hidden="true"></div>
        <div className="lore-cinematic-layer lore-layer-vignette" aria-hidden="true"></div>
        {props.visualLayer}
        <p className="eyebrow">{props.t('reboot.overlay.lore.eyebrow')}</p>
        <h2>{props.t('reboot.overlay.lore.title')}</h2>
        <p className="lore-progress">{props.progressLabel}</p>
        <p className={props.readReady ? 'lore-read-gate is-ready' : 'lore-read-gate'}>
          {props.readinessLabel}
        </p>
        <p className="lore-copy lore-scene-copy">{props.sceneBody}</p>
        <p className="lore-keyboard-hint">{props.t('reboot.overlay.lore.keyboardHint')}</p>
        <div className="button-row">
          <button className="btn ghost" onClick={props.onPrev} disabled={!props.canGoPrev}>
            {props.t('reboot.overlay.lore.previous')}
          </button>
          <button className="btn" onClick={props.onNext} disabled={!props.canGoNext}>
            {props.isLastScene
              ? props.t('reboot.overlay.lore.continue')
              : props.t('reboot.overlay.lore.next')}
          </button>
          <button className="btn ghost" onClick={props.onSkip}>
            {props.t('reboot.overlay.lore.skip')}
          </button>
        </div>
      </div>
    </aside>
  );
}
