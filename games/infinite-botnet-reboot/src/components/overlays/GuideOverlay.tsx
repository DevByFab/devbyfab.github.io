import { useMemo } from 'react';
import { computeGuideCardStyle, computeGuideMaskStyles, type GuideRect } from '../../app/guideLayout';

type TranslateFn = (key: string, vars?: Record<string, string | number>) => string;

interface GuideOverlayProps {
  t: TranslateFn;
  guideRect: GuideRect | null;
  title: string;
  focus: string;
  body: string;
  currentStep: number;
  totalSteps: number;
  canGoPrev: boolean;
  isLastStep: boolean;
  onPrev: () => void;
  onSkip: () => void;
  onNext: () => void;
}

export function GuideOverlay(props: Readonly<GuideOverlayProps>) {
  const guideCardStyle = useMemo(() => computeGuideCardStyle(props.guideRect), [props.guideRect]);
  const guideMaskStyles = useMemo(() => computeGuideMaskStyles(props.guideRect), [props.guideRect]);

  return (
    <aside
      className="guide-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={props.t('reboot.guide.dialogLabel')}
    >
      {props.guideRect ? (
        guideMaskStyles.map((style, index) => (
          <div key={`guide-mask-${index}`} className="guide-mask" style={style}></div>
        ))
      ) : (
        <div className="guide-backdrop"></div>
      )}
      {props.guideRect ? (
        <div
          className="guide-highlight"
          style={{
            top: props.guideRect.top,
            left: props.guideRect.left,
            width: props.guideRect.width,
            height: props.guideRect.height,
          }}
        ></div>
      ) : null}
      <section className="guide-card" style={guideCardStyle}>
        <p className="eyebrow">{props.t('reboot.guide.badge')}</p>
        <h2>{props.title}</h2>
        <p className="guide-focus">{props.t('reboot.guide.focusLabel', { target: props.focus })}</p>
        <p className="lore-copy">{props.body}</p>
        <p className="queue-hint">
          {props.t('reboot.guide.progress', {
            current: props.currentStep,
            total: props.totalSteps,
          })}
        </p>
        <div className="guide-nav">
          <button className="btn tiny ghost" onClick={props.onPrev} disabled={!props.canGoPrev}>
            {props.t('reboot.guide.prev')}
          </button>
          <div className="guide-actions">
            <button className="btn tiny ghost" onClick={props.onSkip}>
              {props.t('reboot.guide.skip')}
            </button>
            <button className="btn tiny" onClick={props.onNext}>
              {props.isLastStep ? props.t('reboot.guide.finish') : props.t('reboot.guide.next')}
            </button>
          </div>
        </div>
      </section>
    </aside>
  );
}
