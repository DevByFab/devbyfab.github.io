import { drawRadialGlows, drawScanlines, type RadialGlowSpec } from '../shared/canvasRuntime';
import { useLoreCanvasFrame } from '../shared/useLoreCanvasFrame';

const SCENE5_GLOWS: ReadonlyArray<RadialGlowSpec> = [
  {
    x: 0.24,
    y: 0.24,
    innerRadiusRatio: 0.08,
    outerRadiusRatio: 0.72,
    color: 'rgba(112, 238, 199, 0.24)',
  },
  {
    x: 0.78,
    y: 0.74,
    innerRadiusRatio: 0.06,
    outerRadiusRatio: 0.7,
    color: 'rgba(113, 201, 247, 0.22)',
    alpha: 0.9,
  },
];

function drawTutorialBridgeFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  timestampMs: number,
): void {
  const t = timestampMs / 1000;
  const driftX = Math.sin(t * 0.33) * width * 0.028;
  const driftY = Math.cos(t * 0.27) * height * 0.024;

  ctx.clearRect(0, 0, width, height);
  drawRadialGlows(ctx, width, height, SCENE5_GLOWS, driftX, driftY);
  drawScanlines(ctx, width, height, timestampMs, 20, 24, 'rgba(128, 228, 208, 0.045)');

  const horizonY = height * 0.58 + Math.sin(t * 1.2) * 3;
  ctx.fillStyle = 'rgba(124, 224, 217, 0.12)';
  ctx.fillRect(0, horizonY, width, 2);
}

export function Scene5TutorialBridgeCanvas() {
  const canvasRef = useLoreCanvasFrame(drawTutorialBridgeFrame);

  return <canvas ref={canvasRef} className="lore-scene-canvas lore-scene-canvas-tutorial-bridge" aria-hidden="true" />;
}
