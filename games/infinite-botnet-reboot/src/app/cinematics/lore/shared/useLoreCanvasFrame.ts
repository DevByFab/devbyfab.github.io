import { useEffect, useRef } from 'react';
import { syncCanvasResolution } from './canvasRuntime';

export type LoreCanvasDrawFrame = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  timestampMs: number,
) => void;

export function useLoreCanvasFrame(drawFrame: LoreCanvasDrawFrame) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const { width, height } = syncCanvasResolution(canvas);
      drawFrame(ctx, width, height, 0);
      return;
    }

    let rafId = 0;
    const animate = (timestampMs: number) => {
      const { width, height } = syncCanvasResolution(canvas);
      drawFrame(ctx, width, height, timestampMs);
      rafId = window.requestAnimationFrame(animate);
    };

    rafId = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, [drawFrame]);

  return canvasRef;
}
