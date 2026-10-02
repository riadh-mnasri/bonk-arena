// © 2026 Riadh MNASRI

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { MatchResult } from "@/game/engine";
import { Sfx } from "@/game/sound";
import type { CharacterDef, Difficulty, GameMode, Lang } from "@/game/types";
import { DICTIONARIES } from "@/i18n/dictionary";
import { useSetting } from "@/lib/storage";
import { ControlsScreen } from "./ControlsScreen";
import { FightScreen } from "./FightScreen";
import { ResultScreen } from "./ResultScreen";
import { SelectScreen } from "./SelectScreen";
import { TitleScreen } from "./TitleScreen";

type Screen = "title" | "controls" | "select" | "fight" | "result";

export function BonkArena() {
  const [lang, changeLang] = useSetting<Lang>("lang", "fr", () => (navigator.language.startsWith("fr") ? "fr" : "en"));
  const [muted, setMuted] = useSetting("muted", false);
  const [difficulty, changeDifficulty] = useSetting<Difficulty>("difficulty", "easy");
  const [screen, setScreen] = useState<Screen>("title");
  const [mode, setMode] = useState<GameMode>("cpu");
  const [fighters, setFighters] = useState<[CharacterDef, CharacterDef] | null>(null);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [round, setRound] = useState(0);
  const [sfx] = useState(() => new Sfx());
  const dict = DICTIONARIES[lang];

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = lang === "fr" ? "Bonk Arena, le jeu de bagarre rigolo" : "Bonk Arena, the silly brawler";
  }, [lang]);

  useEffect(() => {
    sfx.setMuted(muted);
  }, [muted, sfx]);

  const toggleSound = useCallback(() => setMuted(!muted), [muted, setMuted]);

  const go = (s: Screen) => {
    sfx.unlock();
    setScreen(s);
    window.scrollTo({ top: 0 });
  };

  const onMatchEnd = useCallback((r: MatchResult) => {
    window.setTimeout(() => {
      setResult(r);
      setScreen("result");
    }, 400);
  }, []);

  const screenEl = useMemo(() => {
    switch (screen) {
      case "title":
        return (
          <TitleScreen
            dict={dict}
            difficulty={difficulty}
            onDifficulty={changeDifficulty}
            onPlay={(m) => {
              setMode(m);
              go("select");
            }}
            onControls={() => go("controls")}
          />
        );
      case "controls":
        return <ControlsScreen lang={lang} dict={dict} onBack={() => go("title")} />;
      case "select":
        return (
          <SelectScreen
            mode={mode}
            lang={lang}
            dict={dict}
            sfx={sfx}
            initial={fighters}
            onBack={() => go("title")}
            onDone={(a, b) => {
              setFighters([a, b]);
              setRound((n) => n + 1);
              go("fight");
            }}
          />
        );
      case "fight":
        return fighters ? (
          <FightScreen
            key={round}
            p1={fighters[0]}
            p2={fighters[1]}
            mode={mode}
            difficulty={difficulty}
            dict={dict}
            sfx={sfx}
            muted={muted}
            onToggleSound={toggleSound}
            onMatchEnd={onMatchEnd}
            onQuit={() => go("title")}
          />
        ) : null;
      case "result":
        return result && fighters ? (
          <ResultScreen
            result={result}
            fighters={fighters}
            mode={mode}
            dict={dict}
            onRematch={() => {
              setRound((n) => n + 1);
              go("fight");
            }}
            onChange={() => go("select")}
            onMenu={() => go("title")}
          />
        ) : null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, dict, lang, mode, fighters, result, round, difficulty, muted]);

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between gap-3 px-4 pt-4">
        <button type="button" onClick={() => go("title")} className="font-display text-2xl tracking-wide" aria-label="Bonk Arena">
          BONK<span className="text-tomato">!</span>
        </button>
        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded-lg border-[3px] border-ink" role="group" aria-label="Langue / Language">
            {(["fr", "en"] as Lang[]).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => changeLang(l)}
                aria-pressed={lang === l}
                className={`px-3 py-1 text-sm font-extrabold uppercase ${lang === l ? "bg-ink text-cream" : "bg-white"}`}
              >
                {l}
              </button>
            ))}
          </div>
          <button type="button" className="btn-chip" onClick={toggleSound} aria-pressed={!muted} aria-label={dict.sound}>
            {muted ? "🔇" : "🔊"}
          </button>
        </div>
      </header>

      <main className="flex-1">{screenEl}</main>

      <footer className="px-4 pb-5 pt-8 text-center text-sm opacity-70">© {new Date().getFullYear()} Riadh MNASRI</footer>
    </div>
  );
}
