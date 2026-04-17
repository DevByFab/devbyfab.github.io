import { drawRadialGlows, drawScanlines, type RadialGlowSpec } from '../shared/canvasRuntime';
import { useLoreCanvasFrame } from '../shared/useLoreCanvasFrame';

const SCENE4_GLOWS: ReadonlyArray<RadialGlowSpec> = [
  {
    x: 0.26,
    y: 0.26,
    innerRadiusRatio: 0.08,
    outerRadiusRatio: 0.76,
    color: 'rgba(255, 152, 86, 0.30)',
  },
  {
    x: 0.82,
    y: 0.68,
    innerRadiusRatio: 0.05,
    outerRadiusRatio: 0.66,
    color: 'rgba(255, 214, 120, 0.26)',
    alpha: 0.96,
  },
];

function drawBotnetDiscoveryFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  timestampMs: number,
): void {
  const t = timestampMs / 1000;
  const driftX = Math.sin(t * 0.92) * width * 0.032;
  const driftY = Math.cos(t * 0.71) * height * 0.028;

  ctx.clearRect(0, 0, width, height);

  const flicker = 0.86 + Math.sin(t * 18.4) * 0.07 + Math.sin(t * 43.2) * 0.03;
  ctx.globalAlpha = flicker;
  drawRadialGlows(ctx, width, height, SCENE4_GLOWS, driftX, driftY);
  ctx.globalAlpha = 1;

  drawScanlines(ctx, width, height, timestampMs, 8, 70, 'rgba(255, 195, 112, 0.06)');

  ctx.strokeStyle = 'rgba(255, 174, 86, 0.08)';
  ctx.lineWidth = 1;
  for (let x = 10; x < width; x += 34) {
    ctx.beginPath();
    ctx.moveTo(x + Math.sin(t + x * 0.003) * 2, 0);
    ctx.lineTo(x - Math.cos(t * 1.5 + x * 0.004) * 2, height);
    ctx.stroke();
  }
}

export function Scene4BotnetDiscoveryCanvas() {
  const canvasRef = useLoreCanvasFrame(drawBotnetDiscoveryFrame);

  return <canvas ref={canvasRef} className="lore-scene-canvas lore-scene-canvas-botnet-discovery" aria-hidden="true" />;
}
