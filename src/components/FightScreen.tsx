// © 2026 Riadh MNASRI

"use client";

import { useEffect, useRef, useState } from "react";
import { CpuBrain } from "@/game/ai";
import { Game, type MatchResult } from "@/game/engine";
import { GAME_CODES, mergeInputs, P1_KEYS, P2_KEYS, readGamepad, readKeys, SOLO_KEYS } from "@/game/input";
import { render } from "@/game/render";
import type { Sfx } from "@/game/sound";
import { EMPTY_INPUT, type CharacterDef, type Difficulty, type GameMode, type InputFrame } from "@/game/types";
import type { Dictionary } from "@/i18n/dictionary";
import { displayFont, fitCanvas, STEP_MS } from "@/lib/canvas";
import { TouchControls } from "./TouchControls";

interface Props {
  p1: CharacterDef;
  p2: CharacterDef;
  mode: GameMode;
  difficulty: Difficulty;
  dict: Dictionary;
  sfx: Sfx;
  muted: boolean;
  onToggleSound: () => void;
  onMatchEnd: (result: MatchResult) => void;
  onQuit: () => void;
}

export function FightScreen({ p1, p2, mode, difficulty, dict, sfx, muted, onToggleSound, onMatchEnd, onQuit }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const touchRef = useRef<InputFrame>({ ...EMPTY_INPUT });
  const pausedRef = useRef(false);
  const dictRef = useRef(dict);
  const endRef = useRef(onMatchEnd);
  const [paused, setPaused] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [touch] = useState(() => typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches);

  useEffect(() => {
    dictRef.current = dict;
    endRef.current = onMatchEnd;
  }, [dict, onMatchEnd]);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const game = new Game({ p1, p2, mode, difficulty });
    const brain = mode === "cpu" ? new CpuBrain(difficulty) : null;
    if (process.env.NODE_ENV !== "production") (window as unknown as { __bonk?: Game }).__bonk = game;
    const keys = new Set<string>();
    let font = displayFont();
    void document.fonts?.ready.then(() => (font = displayFont()));
    let reported = false;
    let raf = 0;
    let last = performance.now();
    let acc = 0;

    const onDown = (e: KeyboardEvent) => {
      if (e.code === "Escape" || e.code === "KeyP") {
        e.preventDefault();
        setPaused((p) => !p);
        return;
      }
      if (GAME_CODES.has(e.code)) e.preventDefault();
      keys.add(e.code);
    };
    const onUp = (e: KeyboardEvent) => keys.delete(e.code);
    const onBlur = () => {
      keys.clear();
      if (game.phase !== "matchOver") setPaused(true);
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    window.addEventListener("blur", onBlur);

    const readInputs = (): [InputFrame, InputFrame] => {
      const pads = (navigator.getGamepads?.() ?? []).filter((p): p is Gamepad => Boolean(p));
      const [a, b] = game.fighters;
      if (brain) {
        const human = mergeInputs(readKeys(keys, SOLO_KEYS), readGamepad(pads[0]), touchRef.current);
        return [human, brain.next(b, a, game)];
      }
      return [mergeInputs(readKeys(keys, P1_KEYS), readGamepad(pads[0])), mergeInputs(readKeys(keys, P2_KEYS), readGamepad(pads[1]))];
    };

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      acc += Math.min(100, now - last);
      last = now;
      while (acc >= STEP_MS) {
        acc -= STEP_MS;
        if (pausedRef.current) continue;
        game.step(readInputs());
        for (const ev of game.events) sfx.play(ev);
        game.events.length = 0;
      }
      fitCanvas(canvas, ctx);
      render(ctx, game, { font, text: dictRef.current.canvas });
      if (game.phase === "matchOver" && game.result && !reported) {
        reported = true;
        endRef.current(game.result);
      }
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [p1, p2, mode, difficulty, sfx, attempt]);

  const toggleFullscreen = () => {
    const el = frameRef.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen?.().catch(() => undefined);
  };

  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 py-4">
      <div className="mb-3 flex items-center justify-end gap-2">
        <button type="button" className="btn-chip" onClick={() => setPaused(true)} aria-label={dict.pause}>
          ❚❚ <span className="hidden sm:inline">{dict.pause}</span>
        </button>
        <button type="button" className="btn-chip" onClick={onToggleSound} aria-pressed={!muted}>
          {muted ? "🔇" : "🔊"} <span className="hidden sm:inline">{dict.sound}</span>
        </button>
        <button type="button" className="btn-chip" onClick={toggleFullscreen}>
          ⛶ <span className="hidden sm:inline">{dict.fullscreen}</span>
        </button>
      </div>

      <div ref={frameRef} className="arena-frame relative">
        <canvas ref={canvasRef} className="block w-full aspect-video" role="img" aria-label={dict.arenaLabel} />
        {paused && (
          <div className="absolute inset-0 grid place-items-center bg-ink/60 backdrop-blur-[2px]">
            <div className="panel flex w-64 flex-col gap-3 p-6 text-center">
              <h2 className="font-display text-4xl">{dict.pause}</h2>
              <button type="button" className="btn btn-sun" autoFocus onClick={() => setPaused(false)}>
                {dict.resume}
              </button>
              <button
                type="button"
                className="btn btn-teal"
                onClick={() => {
                  setAttempt((n) => n + 1);
                  setPaused(false);
                }}
              >
                {dict.restart}
              </button>
              <button type="button" className="btn btn-cream" onClick={onQuit}>
                {dict.quit}
              </button>
            </div>
          </div>
        )}
      </div>

      {touch && mode === "cpu" && <TouchControls
          dict={dict}
          onChange={(key, down) => {
            touchRef.current[key] = down;
          }}
        />}
    </div>
  );
}
