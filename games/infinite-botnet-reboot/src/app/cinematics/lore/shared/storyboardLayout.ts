import { drawStoryboardPanel } from './storyboardPrimitives';

export interface DualStoryboardLayout {
  panelWidth: number;
  panelHeight: number;
  panelY: number;
  leftPanelX: number;
  rightPanelX: number;
}

interface StoryboardPanelPalette {
  borderColor: string;
  fillColor: string;
}

export interface StoryboardPanelMetrics {
  floorY: number;
  figureScale: number;
}

type StoryboardBackgroundRenderer = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  t: number,
) => void;

export function createDualStoryboardLayout(width: number, height: number): DualStoryboardLayout {
  const gutter = width * 0.06;
  const panelGap = width * 0.035;
  const panelWidth = (width - gutter * 2 - panelGap) * 0.5;
  const panelHeight = height * 0.62;
  const panelY = height * 0.2;
  const leftPanelX = gutter;
  const rightPanelX = gutter + panelWidth + panelGap;

  return {
    panelWidth,
    panelHeight,
    panelY,
    leftPanelX,
    rightPanelX,
  };
}

export function beginDualStoryboardFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  timestampMs: number,
  drawBackground: StoryboardBackgroundRenderer,
): {
  t: number;
  layout: DualStoryboardLayout;
} {
  const t = timestampMs / 1000;
  const layout = createDualStoryboardLayout(width, height);

  ctx.clearRect(0, 0, width, height);
  drawBackground(ctx, width, height, t);

  return { t, layout };
}

export function createStoryboardPanelMetrics(
  panelY: number,
  panelHeight: number,
  panelWidth: number,
  minScale: number,
  scaleFactor: number,
): StoryboardPanelMetrics {
  return {
    floorY: panelY + panelHeight * 0.82,
    figureScale: Math.max(minScale, panelWidth * scaleFactor),
  };
}

export function drawDualStoryboardPanels(
  ctx: CanvasRenderingContext2D,
  layout: Readonly<DualStoryboardLayout>,
  leftPanel: Readonly<StoryboardPanelPalette>,
  rightPanel: Readonly<StoryboardPanelPalette>,
): void {
  drawStoryboardPanel(
    ctx,
    layout.leftPanelX,
    layout.panelY,
    layout.panelWidth,
    layout.panelHeight,
    leftPanel.borderColor,
    leftPanel.fillColor,
  );
  drawStoryboardPanel(
    ctx,
    layout.rightPanelX,
    layout.panelY,
    layout.panelWidth,
    layout.panelHeight,
    rightPanel.borderColor,
    rightPanel.fillColor,
  );
}
