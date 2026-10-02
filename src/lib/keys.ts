// © 2026 Riadh MNASRI

"use client";

import { useEffect, useState } from "react";
import type { Lang } from "@/game/types";

const ARROWS: Record<string, string> = {
  ArrowLeft: "←",
  ArrowRight: "→",
  ArrowUp: "↑",
  ArrowDown: "↓",
};

const AZERTY: Record<string, string> = { KeyW: "Z", KeyA: "Q", KeyQ: "A", KeyZ: "W", Semicolon: "M", Space: "Espace" };
const QWERTY: Record<string, string> = { Semicolon: ";", Space: "Space" };

interface KeyboardWithLayout {
  getLayoutMap?: () => Promise<Map<string, string>>;
}

/** Labels physical key codes with what is printed on the user's keyboard. */
export function useKeyLabel(lang: Lang): (code: string) => string {
  const [layout, setLayout] = useState<Map<string, string> | null>(null);

  useEffect(() => {
    const kb = (navigator as Navigator & { keyboard?: KeyboardWithLayout }).keyboard;
    kb?.getLayoutMap?.()
      .then(setLayout)
      .catch(() => setLayout(null));
  }, []);

  return (code: string) => {
    if (ARROWS[code]) return ARROWS[code];
    if (code === "Space") return lang === "fr" ? "Espace" : "Space";
    const fromLayout = layout?.get(code);
    if (fromLayout) return fromLayout.toUpperCase();
    const fallback = lang === "fr" ? AZERTY : QWERTY;
    if (fallback[code]) return fallback[code];
    return code.replace(/^Key/, "");
  };
}
