// © 2026 Riadh MNASRI

import { EMPTY_INPUT, type InputFrame } from "./types";

export type KeyMap = Record<keyof InputFrame, string[]>;

// Physical key codes: KeyW/KeyA show up as Z/Q on an AZERTY keyboard.
export const P1_KEYS: KeyMap = {
  left: ["KeyA"],
  right: ["KeyD"],
  up: ["KeyW"],
  down: ["KeyS"],
  punch: ["KeyF"],
  kick: ["KeyG"],
  special: ["KeyH"],
};

export const P2_KEYS: KeyMap = {
  left: ["ArrowLeft"],
  right: ["ArrowRight"],
  up: ["ArrowUp"],
  down: ["ArrowDown"],
  punch: ["KeyK"],
  kick: ["KeyL"],
  special: ["Semicolon"],
};

export const SOLO_KEYS: KeyMap = {
  left: [...P1_KEYS.left, ...P2_KEYS.left],
  right: [...P1_KEYS.right, ...P2_KEYS.right],
  up: [...P1_KEYS.up, ...P2_KEYS.up, "Space"],
  down: [...P1_KEYS.down, ...P2_KEYS.down],
  punch: [...P1_KEYS.punch, ...P2_KEYS.punch],
  kick: [...P1_KEYS.kick, ...P2_KEYS.kick],
  special: [...P1_KEYS.special, ...P2_KEYS.special],
};

export const GAME_CODES = new Set(Object.values(SOLO_KEYS).flat());

export function readKeys(pressed: ReadonlySet<string>, map: KeyMap): InputFrame {
  const out = { ...EMPTY_INPUT };
  for (const key of Object.keys(map) as (keyof InputFrame)[]) {
    out[key] = map[key].some((code) => pressed.has(code));
  }
  return out;
}

export function readGamepad(pad: Gamepad | null | undefined): InputFrame {
  if (!pad) return { ...EMPTY_INPUT };
  const btn = (i: number) => Boolean(pad.buttons[i]?.pressed);
  const ax = pad.axes[0] ?? 0;
  const ay = pad.axes[1] ?? 0;
  return {
    left: ax < -0.5 || btn(14),
    right: ax > 0.5 || btn(15),
    up: ay < -0.6 || btn(12),
    down: ay > 0.6 || btn(13),
    punch: btn(0) || btn(2),
    kick: btn(1),
    special: btn(3) || btn(5) || btn(7),
  };
}

export function mergeInputs(...frames: InputFrame[]): InputFrame {
  const out = { ...EMPTY_INPUT };
  for (const f of frames) {
    for (const key of Object.keys(out) as (keyof InputFrame)[]) {
      out[key] = out[key] || f[key];
    }
  }
  return out;
}

/** Numpad notation relative to facing: 2 = down, 3 = down-forward, 6 = forward... */
export function directionOf(input: InputFrame, facing: 1 | -1): number {
  const fwd = facing === 1 ? input.right : input.left;
  const back = facing === 1 ? input.left : input.right;
  const h = fwd && !back ? 1 : back && !fwd ? -1 : 0;
  const v = input.up && !input.down ? 1 : input.down && !input.up ? -1 : 0;
  return 5 + h + v * 3;
}

/** Lenient quarter circle forward: down, then forward within the window. */
export function hasQuarterCircle(buffer: readonly number[], window = 18): boolean {
  const recent = buffer.slice(-window);
  const lastForward = Math.max(recent.lastIndexOf(6), recent.lastIndexOf(9));
  if (lastForward < recent.length - 8 || lastForward < 0) return false;
  for (let i = lastForward - 1; i >= 0; i--) {
    if (recent[i] === 2 || recent[i] === 1) return true;
  }
  return false;
}
