import { drawScanlines } from '../shared/canvasRuntime';
import {
  drawAttentionMarks,
  drawDoor,
  drawStickFigure,
  drawStoryboardPanel,
  drawSuitcase,
} from '../shared/storyboardPrimitives';
import { useLoreCanvasFrame } from '../shared/useLoreCanvasFrame';

function drawScene1Background(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  t: number,
): void {
  const backdrop = ctx.createLinearGradient(0, 0, 0, height);
  backdrop.addColorStop(0, 'rgba(11, 28, 36, 0.8)');
  backdrop.addColorStop(1, 'rgba(6, 15, 21, 0.9)');
  ctx.fillStyle = backdrop;
  ctx.fillRect(0, 0, width, height);

  const haze = ctx.createRadialGradient(
    width * (0.22 + Math.sin(t * 0.28) * 0.04),
    height * 0.3,
    width * 0.06,
    width * 0.22,
    height * 0.3,
    width * 0.62,
  );
  haze.addColorStop(0, 'rgba(116, 208, 220, 0.22)');
  haze.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = haze;
  ctx.fillRect(0, 0, width, height);
}

function drawScene1LeftPanel(
  ctx: CanvasRenderingContext2D,
  panelX: number,
  panelY: number,
  panelWidth: number,
  panelHeight: number,
  t: number,
): void {
  const floorY = panelY + panelHeight * 0.82;
  const figureScale = Math.max(1.15, panelWidth * 0.0052);
  const bob = Math.sin(t * 2.1) * panelHeight * 0.008;
  const doorOpen = 0.34 + Math.sin(t * 1.4) * 0.1;
  const departureOffset = Math.sin(t * 1.7) * panelWidth * 0.012;

  ctx.fillStyle = 'rgba(102, 140, 151, 0.18)';
  ctx.fillRect(panelX + panelWidth * 0.08, floorY, panelWidth * 0.84, panelHeight * 0.012);

  drawDoor(ctx, {
    x: panelX + panelWidth * 0.72,
    y: panelY + panelHeight * 0.2,
    width: panelWidth * 0.2,
    height: panelHeight * 0.58,
    openRatio: doorOpen,
    strokeColor: 'rgba(236, 224, 194, 0.78)',
    fillColor: 'rgba(34, 51, 56, 0.44)',
    hinge: 'right',
  });

  drawStickFigure(ctx, {
    x: panelX + panelWidth * 0.34,
    y: floorY + bob,
    scale: figureScale,
    facing: 'right',
    strokeColor: 'rgba(236, 241, 246, 0.92)',
    torsoLean: 0.14,
    leftArmAngle: -0.3,
    rightArmAngle: 1.25,
    leftLegAngle: -0.34,
    rightLegAngle: 0.3,
  });

  drawAttentionMarks(ctx, {
    x: panelX + panelWidth * 0.37,
    y: panelY + panelHeight * 0.31 + bob,
    radius: panelWidth * 0.048,
    color: 'rgba(255, 178, 124, 0.92)',
    intensity: 1.2,
  });

  drawStickFigure(ctx, {
    x: panelX + panelWidth * 0.61 + departureOffset,
    y: floorY,
    scale: figureScale * 0.98,
    facing: 'right',
    strokeColor: 'rgba(215, 226, 234, 0.82)',
    torsoLean: 0.06,
    leftArmAngle: -0.4,
    rightArmAngle: 0.7,
    leftLegAngle: -0.52,
    rightLegAngle: 0.56,
  });

  drawStickFigure(ctx, {
    x: panelX + panelWidth * 0.68 + departureOffset,
    y: floorY + panelHeight * 0.01,
    scale: figureScale * 0.74,
    facing: 'right',
    strokeColor: 'rgba(198, 214, 224, 0.8)',
    torsoLean: 0.08,
    leftArmAngle: -0.26,
    rightArmAngle: 0.48,
    leftLegAngle: -0.48,
    rightLegAngle: 0.44,
  });
}

function drawScene1RightPanel(
  ctx: CanvasRenderingContext2D,
  panelX: number,
  panelY: number,
  panelWidth: number,
  panelHeight: number,
  t: number,
): void {
  const floorY = panelY + panelHeight * 0.82;
  const figureScale = Math.max(1.15, panelWidth * 0.0052);
  const walkOffset = Math.sin(t * 1.6) * panelWidth * 0.018;
  const slump = Math.sin(t * 1.2 + 0.6) * panelHeight * 0.006;

  ctx.fillStyle = 'rgba(111, 149, 160, 0.18)';
  ctx.fillRect(panelX + panelWidth * 0.08, floorY, panelWidth * 0.84, panelHeight * 0.012);

  drawStickFigure(ctx, {
    x: panelX + panelWidth * 0.24,
    y: floorY + slump,
    scale: figureScale,
    facing: 'right',
    strokeColor: 'rgba(198, 217, 229, 0.88)',
    torsoLean: -0.2,
    leftArmAngle: -0.62,
    rightArmAngle: 0.38,
    leftLegAngle: -0.3,
    rightLegAngle: 0.28,
  });

  drawAttentionMarks(ctx, {
    x: panelX + panelWidth * 0.25,
    y: panelY + panelHeight * 0.34 + slump,
    radius: panelWidth * 0.042,
    color: 'rgba(130, 192, 216, 0.9)',
    intensity: 0.92,
  });

  drawStickFigure(ctx, {
    x: panelX + panelWidth * 0.66 + walkOffset,
    y: floorY,
    scale: figureScale,
    facing: 'right',
    strokeColor: 'rgba(224, 236, 244, 0.9)',
    torsoLean: 0.18,
    leftArmAngle: -0.32,
    rightArmAngle: 0.86,
    leftLegAngle: -0.54,
    rightLegAngle: 0.58,
  });

  drawSuitcase(ctx, {
    x: panelX + panelWidth * 0.73 + walkOffset,
    y: floorY - panelHeight * 0.09,
    width: panelWidth * 0.1,
    height: panelHeight * 0.11,
    bodyColor: 'rgba(74, 95, 108, 0.5)',
  });

  drawStickFigure(ctx, {
    x: panelX + panelWidth * 0.79 + walkOffset,
    y: floorY + panelHeight * 0.01,
    scale: figureScale * 0.72,
    facing: 'right',
    strokeColor: 'rgba(202, 219, 230, 0.84)',
    torsoLean: 0.1,
    leftArmAngle: -0.24,
    rightArmAngle: 0.48,
    leftLegAngle: -0.44,
    rightLegAngle: 0.5,
  });
}

function drawFallStartFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  timestampMs: number,
): void {
  const t = timestampMs / 1000;
  const gutter = width * 0.06;
  const panelGap = width * 0.035;
  const panelWidth = (width - gutter * 2 - panelGap) * 0.5;
  const panelHeight = height * 0.62;
  const panelY = height * 0.2;
  const leftPanelX = gutter;
  const rightPanelX = gutter + panelWidth + panelGap;

  ctx.clearRect(0, 0, width, height);
  drawScene1Background(ctx, width, height, t);

  drawStoryboardPanel(
    ctx,
    leftPanelX,
    panelY,
    panelWidth,
    panelHeight,
    'rgba(170, 217, 228, 0.72)',
    'rgba(16, 34, 42, 0.56)',
  );
  drawStoryboardPanel(
    ctx,
    rightPanelX,
    panelY,
    panelWidth,
    panelHeight,
    'rgba(198, 224, 233, 0.72)',
    'rgba(18, 36, 45, 0.56)',
  );

  drawScene1LeftPanel(ctx, leftPanelX, panelY, panelWidth, panelHeight, t);
  drawScene1RightPanel(ctx, rightPanelX, panelY, panelWidth, panelHeight, t);

  ctx.strokeStyle = 'rgba(170, 218, 231, 0.28)';
  ctx.lineWidth = Math.max(1.2, width * 0.002);
  ctx.beginPath();
  ctx.moveTo(leftPanelX + panelWidth + panelGap * 0.5, panelY + panelHeight * 0.05);
  ctx.lineTo(leftPanelX + panelWidth + panelGap * 0.5, panelY + panelHeight * 0.95);
  ctx.stroke();

  drawScanlines(ctx, width, height, timestampMs, 13, 30, 'rgba(140, 204, 215, 0.04)');

  const vignette = ctx.createRadialGradient(width * 0.5, height * 0.5, height * 0.06, width * 0.5, height * 0.5, height);
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vignette.addColorStop(1, 'rgba(2, 6, 9, 0.32)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
}

export function Scene1FallStartCanvas() {
  const canvasRef = useLoreCanvasFrame(drawFallStartFrame);

  return <canvas ref={canvasRef} className="lore-scene-canvas lore-scene-canvas-fall-start" aria-hidden="true" />;
}
