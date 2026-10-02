// © 2026 Riadh MNASRI

import { HEIGHT, WIDTH } from "@/game/engine";

/** Keeps the backing store sharp on any screen size, and maps the logical 960x540 arena onto it. */
export function fitCanvas(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
  const h = Math.round((w * HEIGHT) / WIDTH);
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  const s = w / WIDTH;
  ctx.setTransform(s, 0, 0, s, 0, 0);
}

export function displayFont(): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue("--font-lilita").trim();
  return v || "system-ui, sans-serif";
}

export const STEP_MS = 1000 / 60;
