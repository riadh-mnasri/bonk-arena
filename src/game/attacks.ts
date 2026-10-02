// © 2026 Riadh MNASRI

import type { Box, SpecialKind } from "./types";

export type AttackId = "punch" | "kick" | "lowPunch" | "lowKick" | "airPunch" | "airKick" | "special";

export interface AttackData {
  id: AttackId;
  startup: number;
  active: number;
  recovery: number;
  damage: number;
  /** Hitbox relative to the feet, for a fighter facing right. Null for projectile specials. */
  box: Box | null;
  hitstun: number;
  blockstun: number;
  /** Positive pushes the defender away, negative pulls it closer. */
  knockback: number;
  knockdown?: boolean;
  freeze?: number;
  low?: boolean;
  air?: boolean;
  fx: string[];
}

export const ATTACKS: Record<Exclude<AttackId, "special">, AttackData> = {
  punch: {
    id: "punch",
    startup: 4,
    active: 3,
    recovery: 9,
    damage: 5,
    box: { x: 18, y: -128, w: 66, h: 30 },
    hitstun: 15,
    blockstun: 9,
    knockback: 3.2,
    fx: ["POW!", "PAF!"],
  },
  kick: {
    id: "kick",
    startup: 7,
    active: 4,
    recovery: 15,
    damage: 8,
    box: { x: 16, y: -96, w: 86, h: 34 },
    hitstun: 18,
    blockstun: 11,
    knockback: 6,
    fx: ["BONK!", "BAM!"],
  },
  lowPunch: {
    id: "lowPunch",
    startup: 4,
    active: 3,
    recovery: 8,
    damage: 4,
    box: { x: 18, y: -76, w: 60, h: 28 },
    hitstun: 13,
    blockstun: 8,
    knockback: 2.5,
    low: true,
    fx: ["TOC!"],
  },
  lowKick: {
    id: "lowKick",
    startup: 8,
    active: 4,
    recovery: 18,
    damage: 7,
    box: { x: 10, y: -30, w: 96, h: 28 },
    hitstun: 0,
    blockstun: 12,
    knockback: 3,
    knockdown: true,
    low: true,
    fx: ["BOING!"],
  },
  airPunch: {
    id: "airPunch",
    startup: 4,
    active: 7,
    recovery: 6,
    damage: 6,
    box: { x: 12, y: -124, w: 60, h: 40 },
    hitstun: 16,
    blockstun: 10,
    knockback: 3,
    air: true,
    fx: ["PIF!"],
  },
  airKick: {
    id: "airKick",
    startup: 5,
    active: 9,
    recovery: 6,
    damage: 8,
    box: { x: 8, y: -80, w: 76, h: 40 },
    hitstun: 18,
    blockstun: 11,
    knockback: 5,
    air: true,
    fx: ["VLAN!"],
  },
};

export function specialAttack(kind: SpecialKind): AttackData {
  switch (kind) {
    case "snowball":
      return {
        id: "special",
        startup: 14,
        active: 1,
        recovery: 22,
        damage: 9,
        box: null,
        hitstun: 0,
        blockstun: 12,
        knockback: 4,
        freeze: 46,
        fx: ["BRRR!", "PLOUF!"],
      };
    case "rocket":
      return {
        id: "special",
        startup: 9,
        active: 16,
        recovery: 16,
        damage: 11,
        box: { x: 10, y: -140, w: 72, h: 64 },
        hitstun: 0,
        blockstun: 14,
        knockback: 7,
        knockdown: true,
        fx: ["ZOOM!", "KABOOM!"],
      };
    case "pounce":
      return {
        id: "special",
        startup: 7,
        active: 40,
        recovery: 10,
        damage: 11,
        box: { x: -6, y: -160, w: 74, h: 120 },
        hitstun: 0,
        blockstun: 14,
        knockback: 6,
        knockdown: true,
        air: true,
        fx: ["MIAOU!", "WHAM!"],
      };
    case "vine":
      return {
        id: "special",
        startup: 13,
        active: 5,
        recovery: 22,
        damage: 8,
        box: { x: 36, y: -128, w: 196, h: 36 },
        hitstun: 26,
        blockstun: 12,
        knockback: -7,
        fx: ["FLAC!", "ZIP!"],
      };
  }
}
