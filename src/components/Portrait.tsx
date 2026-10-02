// © 2026 Riadh MNASRI

"use client";

import { useEffect, useRef } from "react";
import { drawFighter, drawShadow } from "@/game/draw-fighter";
import type { ActionName } from "@/game/engine";
import type { CharacterDef } from "@/game/types";

interface Props {
  def: CharacterDef;
  pose?: ActionName;
  facing?: 1 | -1;
  size?: number;
  className?: string;
}

/** Live animated drawing of one fighter, reused by menus. */
export function Portrait({ def, pose = "idle", facing = 1, size = 160, className }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * 1.15 * dpr;
    let raf = 0;
    let t = Math.floor(Math.random() * 200);
    const scale = (size * dpr) / 230;
    const loop = () => {
      t++;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      drawShadow(ctx, 115, 248, 0);
      drawFighter(
        ctx,
        { def, x: 115, y: 248, facing, action: pose, frame: t, attack: null, walkCycle: t * 3, onGround: true },
        t,
      );
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, [def, pose, facing, size]);

  return <canvas ref={ref} className={className} style={{ width: size, height: size * 1.15 }} aria-hidden="true" />;
}
