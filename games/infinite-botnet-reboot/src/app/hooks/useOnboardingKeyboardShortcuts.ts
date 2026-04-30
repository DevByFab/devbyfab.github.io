import { useEffect } from 'react';

interface UseOnboardingKeyboardShortcutsArgs {
  introStep: 'lore' | null;
  guideActive: boolean;
  settingsOpen: boolean;
  onLorePrev: () => void;
  onLoreNext: () => void;
  onSkipIntro: () => void;
  onGuidePrev: () => void;
  onGuideNext: () => void;
  onCloseGuide: (forceMarkAsSeen: boolean) => void;
}

function isEditableTarget(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null;
  if (!element) {
    return false;
  }

  return (
    element.tagName === 'INPUT' ||
    element.tagName === 'TEXTAREA' ||
    element.isContentEditable
  );
}

export function useOnboardingKeyboardShortcuts(
  args: Readonly<UseOnboardingKeyboardShortcutsArgs>,
): void {
  const {
    introStep,
    guideActive,
    settingsOpen,
    onLorePrev,
    onLoreNext,
    onSkipIntro,
    onGuidePrev,
    onGuideNext,
    onCloseGuide,
  } = args;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (settingsOpen || isEditableTarget(event.target)) {
        return;
      }

      const key = event.key;

      if (introStep === 'lore') {
        if (key === 'Enter' || key === ' ' || key === 'Spacebar' || key === 'ArrowRight') {
          event.preventDefault();
          onLoreNext();
          return;
        }

        if (key === 'ArrowLeft' || key === 'Backspace') {
          event.preventDefault();
          onLorePrev();
          return;
        }

        if (key === 'Escape') {
          event.preventDefault();
          onSkipIntro();
        }

        return;
      }

      if (!guideActive) {
        return;
      }

      if (key === 'ArrowLeft' || key === 'Backspace') {
        event.preventDefault();
        onGuidePrev();
        return;
      }

      if (key === 'ArrowRight' || key === 'Enter' || key === ' ' || key === 'Spacebar') {
        event.preventDefault();
        onGuideNext();
        return;
      }

      if (key === 'Escape') {
        event.preventDefault();
        onCloseGuide(true);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [
    guideActive,
    introStep,
    onCloseGuide,
    onLoreNext,
    onLorePrev,
    onGuideNext,
    onGuidePrev,
    onSkipIntro,
    settingsOpen,
  ]);
}
