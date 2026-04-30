export interface CanvasResolution {
  width: number;
  height: number;
}

export interface RadialGlowSpec {
  x: number;
  y: number;
  innerRadiusRatio: number;
  outerRadiusRatio: number;
  color: string;
  alpha?: number;
}

export function syncCanvasResolution(canvas: HTMLCanvasElement): CanvasResolution {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const width = Math.max(1, Math.floor(rect.width * dpr));
  const height = Math.max(1, Math.floor(rect.height * dpr));

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  return { width, height };
}

export function drawRadialGlows(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  glows: ReadonlyArray<RadialGlowSpec>,
  driftX: number,
  driftY: number,
): void {
  ctx.globalCompositeOperation = 'screen';

  for (const glow of glows) {
    const cx = width * glow.x + driftX;
    const cy = height * glow.y + driftY;
    const gradient = ctx.createRadialGradient(
      cx,
      cy,
      width * glow.innerRadiusRatio,
      cx,
      cy,
      width * glow.outerRadiusRatio,
    );
    gradient.addColorStop(0, glow.color);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.globalAlpha = glow.alpha ?? 1;
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}

export function drawScanlines(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  timestampMs: number,
  lineStep: number,
  speed: number,
  color: string,
): void {
  const offset = ((timestampMs / 1000) * speed) % lineStep;
  ctx.fillStyle = color;
  for (let y = -offset; y < height; y += lineStep) {
    ctx.fillRect(0, y, width, 1);
  }
}
