// © 2026 Riadh MNASRI

"use client";

import { useEffect } from "react";
import { CHARACTERS } from "@/game/characters";
import { P1_KEYS, P2_KEYS, type KeyMap } from "@/game/input";
import type { Lang } from "@/game/types";
import type { Dictionary } from "@/i18n/dictionary";
import { useKeyLabel } from "@/lib/keys";

interface Props {
  lang: Lang;
  dict: Dictionary;
  onBack: () => void;
}

function Keys({ codes, label }: { codes: string[]; label: (c: string) => string }) {
  return (
    <span className="flex gap-1">
      {codes.map((c) => (
        <kbd key={c} className="keycap">
          {label(c)}
        </kbd>
      ))}
    </span>
  );
}

export function ControlsScreen({ lang, dict, onBack }: Props) {
  const label = useKeyLabel(lang);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Escape" || e.code === "Backspace") onBack();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onBack]);

  const rows = (m: KeyMap): [string, string[]][] => [
    [dict.move, [...m.left, ...m.right]],
    [dict.jump, m.up],
    [dict.crouch, m.down],
    [dict.punch, m.punch],
    [dict.kick, m.kick],
    [dict.specialMove, m.special],
  ];

  return (
    <div className="mx-auto w-full max-w-[1000px] px-4 py-6">
      <div className="mb-6 flex items-center gap-4">
        <button type="button" className="btn-chip" onClick={onBack}>
          ← {dict.back}
        </button>
        <h1 className="font-display text-4xl">{dict.controls}</h1>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {[P1_KEYS, P2_KEYS].map((m, i) => (
          <section key={i} className="panel p-5">
            <h2 className={`font-display mb-3 inline-block rounded-lg border-2 border-ink px-3 text-2xl ${i === 0 ? "bg-sun" : "bg-tomato text-white"}`}>
              {dict.player(i + 1)}
            </h2>
            <table className="w-full">
              <tbody>
                {rows(m).map(([name, codes]) => (
                  <tr key={name} className="border-b-2 border-ink/10 last:border-0">
                    <th className="py-2 pr-3 text-left text-sm font-bold">{name}</th>
                    <td className="py-2">
                      <Keys codes={codes} label={label} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-3">
        <section className="panel p-5">
          <h2 className="font-display text-2xl">🛡️ {dict.guard}</h2>
          <p className="mt-2 text-sm">{dict.guardHelp}</p>
          <p className="mt-2 text-sm">{dict.lowHelp}</p>
        </section>
        <section className="panel p-5">
          <h2 className="font-display text-2xl">⭐ {dict.specialMove}</h2>
          <p className="mt-2 text-sm">{dict.specialHelp}</p>
          <ul className="mt-2 text-sm">
            {CHARACTERS.map((c) => (
              <li key={c.id}>
                <strong>{c.name}</strong> : {c.specialName[lang]}
              </li>
            ))}
          </ul>
        </section>
        <section className="panel p-5">
          <h2 className="font-display text-2xl">🎮 {dict.gamepad}</h2>
          <p className="mt-2 text-sm">{dict.gamepadHelp}</p>
          <p className="mt-2 text-sm">{dict.soloHelp}</p>
          <p className="mt-2 text-sm">{dict.touchHelp}</p>
        </section>
      </div>
      <p className="panel mt-5 bg-sun p-4 text-center font-bold">🎉 {dict.finishHelp}</p>
    </div>
  );
}
