// © 2026 Riadh MNASRI

"use client";

import { useCallback, useEffect, useState } from "react";
import { CHARACTERS } from "@/game/characters";
import type { Sfx } from "@/game/sound";
import type { CharacterDef, GameMode, Lang } from "@/game/types";
import type { Dictionary } from "@/i18n/dictionary";
import { Portrait } from "./Portrait";

interface Props {
  mode: GameMode;
  lang: Lang;
  dict: Dictionary;
  sfx: Sfx;
  initial?: [CharacterDef, CharacterDef] | null;
  onDone: (p1: CharacterDef, p2: CharacterDef) => void;
  onBack: () => void;
}

function StatBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 text-sm font-bold">{label}</span>
      <div className="flex gap-1" aria-label={`${label} ${value}/5`}>
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className={`h-3 w-6 rounded-sm border-2 border-ink ${i < value ? "bg-sun" : "bg-cream"}`} />
        ))}
      </div>
    </div>
  );
}

export function SelectScreen({ mode, lang, dict, sfx, initial, onDone, onBack }: Props) {
  const [step, setStep] = useState<0 | 1>(0);
  const [p1, setP1] = useState<CharacterDef | null>(null);
  const [cursor, setCursor] = useState(() => Math.max(0, CHARACTERS.findIndex((c) => c.id === initial?.[0].id)));

  // In 1 player mode the extra "surprise" slot picks a random opponent.
  const slots = mode === "cpu" && step === 1 ? CHARACTERS.length + 1 : CHARACTERS.length;
  const focused = CHARACTERS[cursor] ?? null;

  const pick = useCallback(
    (index: number) => {
      const def = CHARACTERS[index] ?? CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
      sfx.play("confirm");
      if (step === 0) {
        setP1(def);
        setStep(1);
        setCursor((index + 1) % CHARACTERS.length);
      } else if (p1) {
        onDone(p1, def);
      }
    },
    [step, p1, onDone, sfx],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const move = (d: number) => {
        e.preventDefault();
        sfx.play("select");
        setCursor((c) => (c + d + slots) % slots);
      };
      switch (e.code) {
        case "ArrowLeft":
        case "KeyA":
          move(-1);
          break;
        case "ArrowRight":
        case "KeyD":
          move(1);
          break;
        case "Enter":
        case "Space":
        case "KeyF":
        case "KeyK":
          e.preventDefault();
          pick(cursor);
          break;
        case "Escape":
        case "Backspace":
          e.preventDefault();
          if (step === 1) {
            setStep(0);
            setP1(null);
          } else onBack();
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cursor, slots, step, pick, onBack, sfx]);

  const heading = step === 0 ? dict.chooseP1 : mode === "cpu" ? dict.chooseCpu : dict.chooseP2;
  const accent = step === 0 ? "bg-sun" : "bg-tomato text-white";

  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 py-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          className="btn-chip"
          onClick={() => {
            if (step === 1) {
              setStep(0);
              setP1(null);
            } else onBack();
          }}
        >
          ← {dict.back}
        </button>
        <h1 className={`font-display rounded-xl border-4 border-ink px-4 py-1 text-2xl shadow-chunky sm:text-3xl ${accent}`}>{heading}</h1>
        <span className="hidden text-sm opacity-70 md:block">{dict.pickHint}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <ul className="grid grid-cols-2 gap-4 xl:grid-cols-4" role="listbox" aria-label={heading}>
          {CHARACTERS.map((c, i) => {
            const isP1 = p1?.id === c.id;
            return (
              <li key={c.id} role="option" aria-selected={cursor === i}>
                <button
                  type="button"
                  onMouseEnter={() => setCursor(i)}
                  onFocus={() => setCursor(i)}
                  onClick={() => pick(i)}
                  className={`fighter-card group w-full ${cursor === i ? "is-focused" : ""}`}
                  style={{ ["--card" as string]: c.palette.main }}
                >
                  {isP1 && <span className="absolute left-2 top-2 rounded-md border-2 border-ink bg-sun px-2 text-sm font-bold">J1</span>}
                  <Portrait def={c} size={150} pose={cursor === i ? "win" : "idle"} />
                  <span className="font-display text-2xl">{c.name}</span>
                  <span className="text-sm opacity-80">{c.title[lang]}</span>
                </button>
              </li>
            );
          })}
          {slots > CHARACTERS.length && (
            <li role="option" aria-selected={cursor === CHARACTERS.length} className="col-span-full">
              <button
                type="button"
                onMouseEnter={() => setCursor(CHARACTERS.length)}
                onFocus={() => setCursor(CHARACTERS.length)}
                onClick={() => pick(CHARACTERS.length)}
                className={`fighter-card w-full ${cursor === CHARACTERS.length ? "is-focused" : ""}`}
                style={{ ["--card" as string]: "#ffd23f" }}
              >
                <span className="flex items-center gap-3 py-2 font-display text-3xl">
                  <span className="text-5xl">?</span> {dict.surprise}
                </span>
              </button>
            </li>
          )}
        </ul>

        <aside className="panel p-5" aria-live="polite">
          {focused ? (
            <>
              <div className="flex items-center gap-3">
                <span className="h-4 w-4 rounded-full border-2 border-ink" style={{ background: focused.palette.accent }} />
                <h2 className="font-display text-3xl">{focused.name}</h2>
              </div>
              <p className="mt-1 font-bold">{focused.title[lang]}</p>
              <p className="mt-3 text-sm leading-relaxed">{focused.bio[lang]}</p>
              <div className="mt-4 flex flex-col gap-2">
                <StatBar label={dict.speed} value={focused.stats.speed} />
                <StatBar label={dict.power} value={focused.stats.power} />
                <StatBar label={dict.reach} value={focused.stats.reach} />
              </div>
              <dl className="mt-5 grid gap-2 text-sm">
                <div className="rounded-lg border-2 border-ink bg-cream px-3 py-2">
                  <dt className="font-bold">⭐ {dict.special}</dt>
                  <dd>{focused.specialName[lang]}</dd>
                </div>
                <div className="rounded-lg border-2 border-ink bg-cream px-3 py-2">
                  <dt className="font-bold">🎉 {dict.finish}</dt>
                  <dd>{focused.finishName[lang]}</dd>
                </div>
              </dl>
            </>
          ) : (
            <div className="grid h-full place-items-center text-center">
              <p className="font-display text-3xl">{dict.surprise}</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
