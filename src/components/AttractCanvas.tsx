// © 2026 Riadh MNASRI

"use client";

import { useEffect, useRef } from "react";
import { CpuBrain } from "@/game/ai";
import { CHARACTERS } from "@/game/characters";
import { Game } from "@/game/engine";
import { render, type CanvasText } from "@/game/render";
import { displayFont, fitCanvas, STEP_MS } from "@/lib/canvas";

function newDemo() {
  const pool = [...CHARACTERS].sort(() => Math.random() - 0.5);
  const game = new Game({ p1: pool[0], p2: pool[1], mode: "versus", difficulty: "hard" });
  return { game, brains: [new CpuBrain("normal"), new CpuBrain("normal")] as const };
}

/** Silent CPU versus CPU match running behind the title, like an arcade attract mode. */
export function AttractCanvas({ text, label }: { text: CanvasText; label: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const textRef = useRef(text);
  useEffect(() => {
    textRef.current = text;
  }, [text]);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let demo = newDemo();
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    let font = displayFont();
    void document.fonts?.ready.then(() => (font = displayFont()));

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      acc += Math.min(100, now - last);
      last = now;
      while (acc >= STEP_MS) {
        acc -= STEP_MS;
        if (reduced) continue;
        const [a, b] = demo.game.fighters;
        demo.game.step([demo.brains[0].next(a, b, demo.game), demo.brains[1].next(b, a, demo.game)]);
        demo.game.events.length = 0;
        if (demo.game.phase === "matchOver") demo = newDemo();
      }
      fitCanvas(canvas, ctx);
      render(ctx, demo.game, { font, text: textRef.current });
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return <canvas ref={ref} className="block w-full aspect-video" role="img" aria-label={label} />;
}
