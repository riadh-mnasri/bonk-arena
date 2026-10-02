// © 2026 Riadh MNASRI

"use client";

import { useEffect } from "react";
import type { MatchResult } from "@/game/engine";
import type { CharacterDef, GameMode } from "@/game/types";
import type { Dictionary } from "@/i18n/dictionary";
import { Portrait } from "./Portrait";

interface Props {
  result: MatchResult;
  fighters: [CharacterDef, CharacterDef];
  mode: GameMode;
  dict: Dictionary;
  onRematch: () => void;
  onChange: () => void;
  onMenu: () => void;
}

export function ResultScreen({ result, fighters, mode, dict, onRematch, onChange, onMenu }: Props) {
  const winner = fighters[result.winner];
  const label = (i: 0 | 1) => (mode === "cpu" && i === 1 ? dict.canvas.cpu : dict.player(i + 1));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Enter") onRematch();
      if (e.code === "Escape") onMenu();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onRematch, onMenu]);

  const rows: [string, [number, number]][] = [
    [dict.roundsWon, result.wins],
    [dict.bestCombo, result.bestCombo],
    [dict.hits, result.hits],
  ];

  return (
    <div className="mx-auto grid w-full max-w-[960px] gap-6 px-4 py-8 md:grid-cols-[auto_1fr] md:items-center">
      <div className="confetti-ring mx-auto grid place-items-center">
        <Portrait def={winner} pose="win" size={240} />
      </div>
      <div>
        <p className="font-bold uppercase tracking-widest opacity-70">{label(result.winner)}</p>
        <h1 className="font-display text-5xl leading-tight sm:text-6xl">{dict.winner(winner.name)}</h1>

        <table className="panel mt-6 w-full overflow-hidden text-left">
          <thead>
            <tr className="border-b-4 border-ink bg-sun">
              <th className="px-4 py-2" />
              {fighters.map((f, i) => (
                <th key={i} className="px-4 py-2 font-display text-xl">
                  {f.name} <span className="text-sm font-body opacity-70">({label(i as 0 | 1)})</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(([name, values]) => (
              <tr key={name} className="border-b-2 border-ink/20 last:border-0">
                <th className="px-4 py-2 text-sm font-bold">{name}</th>
                <td className="px-4 py-2 font-display text-2xl">{values[0]}</td>
                <td className="px-4 py-2 font-display text-2xl">{values[1]}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" className="btn btn-sun" autoFocus onClick={onRematch}>
            🔁 {dict.rematch}
          </button>
          <button type="button" className="btn btn-teal" onClick={onChange}>
            {dict.changeFighters}
          </button>
          <button type="button" className="btn btn-cream" onClick={onMenu}>
            {dict.menu}
          </button>
        </div>
      </div>
    </div>
  );
}
