import { drawRadialGlows, drawScanlines, type RadialGlowSpec } from '../shared/canvasRuntime';
import { useLoreCanvasFrame } from '../shared/useLoreCanvasFrame';

const SCENE3_GLOWS: ReadonlyArray<RadialGlowSpec> = [
  {
    x: 0.18,
    y: 0.2,
    innerRadiusRatio: 0.07,
    outerRadiusRatio: 0.66,
    color: 'rgba(255, 124, 124, 0.27)',
  },
  {
    x: 0.8,
    y: 0.72,
    innerRadiusRatio: 0.06,
    outerRadiusRatio: 0.68,
    color: 'rgba(255, 172, 110, 0.22)',
    alpha: 0.9,
  },
];

function drawEvictionHitFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  timestampMs: number,
): void {
  const t = timestampMs / 1000;
  const driftX = Math.sin(t * 0.75) * width * 0.03;
  const driftY = Math.cos(t * 0.61) * height * 0.025;

  ctx.clearRect(0, 0, width, height);
  drawRadialGlows(ctx, width, height, SCENE3_GLOWS, driftX, driftY);
  drawScanlines(ctx, width, height, timestampMs, 10, 56, 'rgba(255, 144, 144, 0.06)');

  const sweepX = ((t * 0.28) % 1) * width;
  ctx.fillStyle = 'rgba(255, 108, 108, 0.08)';
  ctx.fillRect(sweepX - 18, 0, 36, height);

  const pulse = 0.25 + Math.sin(t * 5.4) * 0.2;
  ctx.fillStyle = `rgba(255, 124, 124, ${Math.max(0.05, pulse).toFixed(3)})`;
  for (let y = 6; y < height; y += 28) {
    ctx.fillRect(0, y, width, 1);
  }
}

export function Scene3EvictionHitCanvas() {
  const canvasRef = useLoreCanvasFrame(drawEvictionHitFrame);

  return <canvas ref={canvasRef} className="lore-scene-canvas lore-scene-canvas-eviction-hit" aria-hidden="true" />;
}
