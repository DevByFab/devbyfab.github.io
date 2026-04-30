import { drawScanlines } from '../shared/canvasRuntime';
import {
  drawAttentionMarks,
  drawClock,
  drawEnvelope,
  drawFridge,
  drawStickFigure,
} from '../shared/storyboardPrimitives';
import {
  beginDualStoryboardFrame,
  createStoryboardPanelMetrics,
  drawDualStoryboardPanels,
} from '../shared/storyboardLayout';
import { useLoreCanvasFrame } from '../shared/useLoreCanvasFrame';

type Scene2PanelKind = 'left' | 'right';

const ENVELOPE_LANES: ReadonlyArray<{ readonly x: number; readonly phase: number; readonly rotation: number }> = [
  { x: 0.2, phase: 0.1, rotation: -0.22 },
  { x: 0.38, phase: 0.32, rotation: -0.1 },
  { x: 0.56, phase: 0.58, rotation: 0.08 },
  { x: 0.74, phase: 0.82, rotation: 0.22 },
];

function drawScene2Background(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  t: number,
): void {
  const base = ctx.createLinearGradient(0, 0, 0, height);
  base.addColorStop(0, 'rgba(12, 30, 37, 0.82)');
  base.addColorStop(1, 'rgba(8, 17, 22, 0.92)');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, width, height);

  const warningGlow = ctx.createRadialGradient(
    width * 0.78,
    height * (0.68 + Math.sin(t * 0.54) * 0.04),
    width * 0.03,
    width * 0.78,
    height * 0.68,
    width * 0.46,
  );
  warningGlow.addColorStop(0, 'rgba(255, 186, 108, 0.22)');
  warningGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = warningGlow;
  ctx.fillRect(0, 0, width, height);
}

function drawScene2Panel(
  ctx: CanvasRenderingContext2D,
  panelX: number,
  panelY: number,
  panelWidth: number,
  panelHeight: number,
  t: number,
  kind: Scene2PanelKind,
): void {
  const { floorY, figureScale } = createStoryboardPanelMetrics(
    panelY,
    panelHeight,
    panelWidth,
    1.12,
    0.0051,
  );
  if (kind === 'left') {
    const shake = Math.sin(t * 4.8) * panelWidth * 0.004;

    ctx.fillStyle = 'rgba(115, 152, 162, 0.16)';
    ctx.fillRect(panelX + panelWidth * 0.08, floorY, panelWidth * 0.84, panelHeight * 0.012);

    ctx.fillStyle = 'rgba(53, 76, 88, 0.45)';
    ctx.fillRect(panelX + panelWidth * 0.15, floorY - panelHeight * 0.14, panelWidth * 0.42, panelHeight * 0.05);

    for (const lane of ENVELOPE_LANES) {
      const drop = ((t * 0.72 + lane.phase) % 1) * panelHeight * 0.62;
      drawEnvelope(ctx, {
        x: panelX + panelWidth * lane.x,
        y: panelY + panelHeight * 0.18 + drop,
        width: panelWidth * 0.12,
        height: panelHeight * 0.085,
        rotation: lane.rotation + Math.sin(t * 2 + lane.phase * 12) * 0.04,
        rejected: true,
        fillColor: 'rgba(40, 57, 66, 0.58)',
        strokeColor: 'rgba(223, 235, 242, 0.82)',
      });
    }

    drawStickFigure(ctx, {
      x: panelX + panelWidth * 0.36 + shake,
      y: floorY,
      scale: figureScale,
      facing: 'left',
      strokeColor: 'rgba(221, 236, 244, 0.9)',
      torsoLean: 0.2,
      leftArmAngle: -1.1,
      rightArmAngle: 0.2,
      leftLegAngle: -0.34,
      rightLegAngle: 0.28,
    });

    drawAttentionMarks(ctx, {
      x: panelX + panelWidth * 0.37 + shake,
      y: panelY + panelHeight * 0.31,
      radius: panelWidth * 0.042,
      color: 'rgba(255, 142, 124, 0.92)',
      intensity: 1.3,
    });

    drawClock(ctx, {
      x: panelX + panelWidth * 0.83,
      y: panelY + panelHeight * 0.23,
      radius: panelWidth * 0.09,
      minuteAngle: (t * 3.6) % (Math.PI * 2),
      hourAngle: (t * 0.55) % (Math.PI * 2),
      strokeColor: 'rgba(232, 243, 247, 0.82)',
    });
    return;
  }

  const openRatio = 0.3 + Math.sin(t * 1.3) * 0.08;
  const hungerPulse = 0.85 + Math.sin(t * 2.6) * 0.2;

  ctx.fillStyle = 'rgba(120, 158, 168, 0.16)';
  ctx.fillRect(panelX + panelWidth * 0.08, floorY, panelWidth * 0.84, panelHeight * 0.012);

  drawFridge(ctx, {
    x: panelX + panelWidth * 0.52,
    y: panelY + panelHeight * 0.21,
    width: panelWidth * 0.3,
    height: panelHeight * 0.56,
    doorOpenRatio: openRatio,
  });

  ctx.fillStyle = 'rgba(218, 235, 246, 0.2)';
  ctx.fillRect(panelX + panelWidth * 0.58, panelY + panelHeight * 0.35, panelWidth * 0.18, panelHeight * 0.012);
  ctx.fillRect(panelX + panelWidth * 0.58, panelY + panelHeight * 0.57, panelWidth * 0.06, panelHeight * 0.014);

  drawStickFigure(ctx, {
    x: panelX + panelWidth * 0.34,
    y: floorY,
    scale: figureScale,
    facing: 'right',
    strokeColor: 'rgba(214, 229, 239, 0.9)',
    torsoLean: -0.24,
    leftArmAngle: -0.56,
    rightArmAngle: 0.24,
    leftLegAngle: -0.26,
    rightLegAngle: 0.22,
  });

  drawAttentionMarks(ctx, {
    x: panelX + panelWidth * 0.35,
    y: panelY + panelHeight * 0.55,
    radius: panelWidth * 0.035 * hungerPulse,
    color: 'rgba(255, 188, 124, 0.92)',
    intensity: 1.25,
  });

  ctx.fillStyle = 'rgba(255, 186, 122, 0.8)';
  ctx.font = `${Math.max(10, panelWidth * 0.055)}px monospace`;
  ctx.textAlign = 'center';
  ctx.fillText('TIMER', panelX + panelWidth * 0.26, panelY + panelHeight * 0.22);
}

function drawFallPressureFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  timestampMs: number,
): void {
  const { t, layout } = beginDualStoryboardFrame(
    ctx,
    width,
    height,
    timestampMs,
    drawScene2Background,
  );
  const { panelWidth, panelHeight, panelY, leftPanelX, rightPanelX } = layout;

  drawDualStoryboardPanels(
    ctx,
    layout,
    {
      borderColor: 'rgba(167, 212, 226, 0.7)',
      fillColor: 'rgba(18, 35, 44, 0.54)',
    },
    {
      borderColor: 'rgba(220, 200, 160, 0.72)',
      fillColor: 'rgba(22, 36, 42, 0.56)',
    },
  );

  drawScene2Panel(ctx, leftPanelX, panelY, panelWidth, panelHeight, t, 'left');
  drawScene2Panel(ctx, rightPanelX, panelY, panelWidth, panelHeight, t, 'right');

  drawScanlines(ctx, width, height, timestampMs, 12, 44, 'rgba(255, 202, 128, 0.04)');

  const pressureBand = ctx.createLinearGradient(0, height * 0.12, 0, height * 0.9);
  pressureBand.addColorStop(0, 'rgba(255, 168, 96, 0)');
  pressureBand.addColorStop(0.45, 'rgba(255, 168, 96, 0.16)');
  pressureBand.addColorStop(1, 'rgba(255, 168, 96, 0)');
  ctx.globalAlpha = 0.52 + Math.sin(t * 1.8) * 0.18;
  ctx.fillStyle = pressureBand;
  ctx.fillRect(0, 0, width, height);
  ctx.globalAlpha = 1;
}

export function Scene2FallPressureCanvas() {
  const canvasRef = useLoreCanvasFrame(drawFallPressureFrame);

  return <canvas ref={canvasRef} className="lore-scene-canvas lore-scene-canvas-fall-pressure" aria-hidden="true" />;
}
