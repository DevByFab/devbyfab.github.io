import type { CSSProperties } from 'react';

export interface GuideRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function computeGuideCardStyle(rect: GuideRect | null): CSSProperties {
  if (typeof window === 'undefined' || rect === null) {
    return {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: 'min(380px, calc(100vw - 24px))',
    };
  }

  const cardWidth = Math.min(380, window.innerWidth - 24);
  const estimatedHeight = 232;
  const horizontalMargin = 12;
  const verticalMargin = 12;

  let left = rect.left;
  if (left + cardWidth > window.innerWidth - horizontalMargin) {
    left = window.innerWidth - cardWidth - horizontalMargin;
  }
  if (left < horizontalMargin) {
    left = horizontalMargin;
  }

  let top = rect.top + rect.height + 12;
  if (top + estimatedHeight > window.innerHeight - verticalMargin) {
    top = rect.top - estimatedHeight - 12;
  }
  if (top < verticalMargin) {
    top = verticalMargin;
  }

  return {
    top,
    left,
    width: cardWidth,
  };
}

export function computeGuideMaskStyles(rect: GuideRect | null): CSSProperties[] {
  if (typeof window === 'undefined' || rect === null) {
    return [];
  }

  const top = Math.max(0, rect.top);
  const left = Math.max(0, rect.left);
  const right = Math.min(window.innerWidth, rect.left + rect.width);
  const bottom = Math.min(window.innerHeight, rect.top + rect.height);
  const focusHeight = Math.max(0, bottom - top);

  return [
    {
      top: 0,
      left: 0,
      width: window.innerWidth,
      height: top,
    },
    {
      top: bottom,
      left: 0,
      width: window.innerWidth,
      height: Math.max(0, window.innerHeight - bottom),
    },
    {
      top,
      left: 0,
      width: left,
      height: focusHeight,
    },
    {
      top,
      left: right,
      width: Math.max(0, window.innerWidth - right),
      height: focusHeight,
    },
  ];
}
