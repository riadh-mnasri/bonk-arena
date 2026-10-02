// © 2026 Riadh MNASRI

"use client";

import type { Difficulty, GameMode } from "@/game/types";
import type { Dictionary } from "@/i18n/dictionary";
import { AttractCanvas } from "./AttractCanvas";

interface Props {
  dict: Dictionary;
  difficulty: Difficulty;
  onDifficulty: (d: Difficulty) => void;
  onPlay: (mode: GameMode) => void;
  onControls: () => void;
}

const LOGO = ["B", "O", "N", "K"];

export function TitleScreen({ dict, difficulty, onDifficulty, onPlay, onControls }: Props) {
  const levels: Difficulty[] = ["easy", "normal", "hard"];
  return (
    <div className="mx-auto grid w-full max-w-[1200px] items-center gap-8 px-4 py-8 lg:grid-cols-[380px_1fr] lg:py-14">
      <div className="order-2 lg:order-1">
        <h1 className="logo" aria-label="Bonk Arena">
          <span className="flex" aria-hidden="true">
            {LOGO.map((l, i) => (
              <span key={i} className="logo-letter" style={{ ["--i" as string]: i }}>
                {l}
              </span>
            ))}
          </span>
          <span className="logo-sub" aria-hidden="true">
            ARENA
          </span>
        </h1>
        <p className="mt-4 text-lg font-bold">{dict.tagline}</p>

        <nav className="mt-8 flex flex-col gap-3" aria-label="Menu">
          <button type="button" className="btn btn-sun btn-menu" onClick={() => onPlay("cpu")}>
            <span>{dict.onePlayer}</span>
            <small>{dict.onePlayerHint}</small>
          </button>
          <fieldset className="-mt-1 ml-3 flex flex-wrap items-center gap-2 border-l-4 border-ink pl-3">
            <legend className="sr-only">{dict.difficulty}</legend>
            {levels.map((l) => (
              <label key={l} className={`level-chip ${difficulty === l ? "is-on" : ""}`}>
                <input type="radio" name="difficulty" value={l} checked={difficulty === l} onChange={() => onDifficulty(l)} className="sr-only" />
                {dict[l]}
              </label>
            ))}
          </fieldset>
          <button type="button" className="btn btn-tomato btn-menu" onClick={() => onPlay("versus")}>
            <span>{dict.twoPlayers}</span>
            <small>{dict.twoPlayersHint}</small>
          </button>
          <button type="button" className="btn btn-cream btn-menu" onClick={onControls}>
            <span>{dict.controls}</span>
          </button>
        </nav>
      </div>

      <div className="order-1 lg:order-2">
        <div className="tv">
          <div className="arena-frame">
            <AttractCanvas text={dict.canvas} label={dict.arenaLabel} />
          </div>
          <div className="tv-base" aria-hidden="true">
            <span />
            <span />
          </div>
        </div>
      </div>
    </div>
  );
}
