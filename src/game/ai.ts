// © 2026 Riadh MNASRI

import type { Fighter, Game } from "./engine";
import { EMPTY_INPUT, type Difficulty, type InputFrame } from "./types";

interface Tuning {
  reaction: number;
  block: number;
  aggression: number;
  special: number;
  dodge: number;
}

const TUNING: Record<Difficulty, Tuning> = {
  easy: { reaction: 30, block: 0.08, aggression: 0.3, special: 0.06, dodge: 0.1 },
  normal: { reaction: 16, block: 0.35, aggression: 0.55, special: 0.14, dodge: 0.4 },
  hard: { reaction: 8, block: 0.65, aggression: 0.8, special: 0.22, dodge: 0.7 },
};

const BUSY = new Set(["hit", "block", "frozen", "knockdown", "down", "getup", "ko", "attack", "dizzy", "gone"]);

type Button = "punch" | "kick" | "special";

/** Produces an InputFrame per tick, exactly like a human player would. */
export class CpuBrain {
  private hold: InputFrame = { ...EMPTY_INPUT };
  private tap: Button | null = null;
  private wait = 0;
  private readonly t: Tuning;

  constructor(
    level: Difficulty,
    private readonly random: () => number = Math.random,
  ) {
    this.t = TUNING[level];
  }

  next(self: Fighter, opp: Fighter, game: Game): InputFrame {
    const out = { ...this.hold };
    if (this.tap) {
      out[this.tap] = true;
      this.tap = null;
    }
    if (game.phase !== "fight") {
      this.hold = { ...EMPTY_INPUT };
      return out;
    }
    if (this.wait > 0) {
      this.wait--;
      return out;
    }
    this.decide(self, opp, game);
    return out;
  }

  private decide(self: Fighter, opp: Fighter, game: Game): void {
    const r = this.random;
    this.wait = this.t.reaction + Math.floor(r() * this.t.reaction * 0.6);
    this.hold = { ...EMPTY_INPUT };
    if (BUSY.has(self.action)) {
      this.wait = 2;
      return;
    }

    const dx = opp.x - self.x;
    const dist = Math.abs(dx);
    const toward: "left" | "right" = dx > 0 ? "right" : "left";
    const away: "left" | "right" = dx > 0 ? "left" : "right";

    const threatened = opp.action === "attack" && dist < 220;
    if (threatened && r() < this.t.block) {
      this.hold[away] = true;
      this.wait = Math.max(this.wait, 18);
      return;
    }

    const incoming = game.projectiles.find(
      (p) => p.owner === opp.index && Math.sign(p.vx) === Math.sign(self.x - p.x) && Math.abs(p.x - self.x) < 260,
    );
    if (incoming && r() < this.t.dodge) {
      if (r() < 0.6) {
        this.hold.up = true;
        this.hold[toward] = true;
      } else {
        this.hold[away] = true;
        this.wait = Math.max(this.wait, 24);
      }
      return;
    }

    const kind = self.def.special;
    if (dist > 240) {
      const ranged = kind === "snowball" || kind === "rocket";
      if (ranged && r() < this.t.special * 1.6) this.tap = "special";
      else if (r() < 0.12) {
        this.hold.up = true;
        this.hold[toward] = true;
      } else this.hold[toward] = true;
      return;
    }

    if (dist > 105) {
      const roll = r();
      const midRange = kind === "vine" || kind === "pounce" || kind === "rocket";
      if (midRange && roll < this.t.special * 2) this.tap = "special";
      else if (roll < 0.3 && r() < this.t.aggression) this.tap = "kick";
      else if (roll < 0.45) {
        this.hold.up = true;
        this.hold[toward] = true;
      } else this.hold[toward] = true;
      return;
    }

    if (r() < this.t.aggression) {
      const roll = r();
      if (roll < 0.15) {
        this.hold.down = true;
        this.tap = "kick";
      } else if (roll < 0.25) {
        this.hold.down = true;
        this.tap = "punch";
      } else if (roll < 0.6) this.tap = "punch";
      else if (roll < 0.9) this.tap = "kick";
      else this.tap = "special";
      this.wait = Math.max(this.wait, 10);
    } else if (r() < 0.5) {
      this.hold[away] = true;
    }
  }
}
