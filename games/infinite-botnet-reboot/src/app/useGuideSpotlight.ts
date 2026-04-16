import { useEffect, type Dispatch, type SetStateAction } from 'react';
import type { GuideRect } from './guideLayout';

interface UseGuideSpotlightParams {
  guideActive: boolean;
  guideSelector: string;
  activeTab: string;
  guideStepIndex: number;
  consoleCollapsed: boolean;
  settingsOpen: boolean;
  phaseIndex: number | undefined;
  setGuideRect: Dispatch<SetStateAction<GuideRect | null>>;
}

export function useGuideSpotlight(params: Readonly<UseGuideSpotlightParams>): void {
  const {
    guideActive,
    guideSelector,
    activeTab,
    guideStepIndex,
    consoleCollapsed,
    settingsOpen,
    phaseIndex,
    setGuideRect,
  } = params;

  useEffect(() => {
    if (!guideActive) return;

    const frame = window.requestAnimationFrame(() => {
      const target = document.querySelector(guideSelector);
      if (target instanceof HTMLElement) {
        target.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [guideActive, guideSelector, activeTab, guideStepIndex]);

  useEffect(() => {
    if (!guideActive) {
      setGuideRect(null);
      return;
    }

    const computeRect = () => {
      const target = document.querySelector(guideSelector);
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
  }, [
    guideActive,
    guideSelector,
    activeTab,
    consoleCollapsed,
    settingsOpen,
    phaseIndex,
    setGuideRect,
  ]);
}
