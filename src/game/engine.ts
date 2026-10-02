// © 2026 Riadh MNASRI

import { ATTACKS, specialAttack, type AttackData } from "./attacks";
import { directionOf, hasQuarterCircle } from "./input";
import {
  EMPTY_INPUT,
  type Box,
  type CharacterDef,
  type Difficulty,
  type FinishKind,
  type GameMode,
  type InputFrame,
} from "./types";

export const WIDTH = 960;
export const HEIGHT = 540;
export const GROUND_Y = 470;
export const STAGE_LEFT = 46;
export const STAGE_RIGHT = 914;
export const GRAVITY = 0.85;
export const FPS = 60;
export const ROUND_SECONDS = 60;
export const ROUNDS_TO_WIN = 2;
export const MAX_HP = 100;

const PUSH_DISTANCE = 74;
const SPECIAL_COOLDOWN = 50;
const ROUND_OVER_FRAMES = 170;
const FINISH_WINDOW_FRAMES = 210;
const FINISH_FRAMES = 260;

export type ActionName =
  | "idle"
  | "walk"
  | "crouch"
  | "jump"
  | "land"
  | "attack"
  | "hit"
  | "block"
  | "frozen"
  | "knockdown"
  | "down"
  | "getup"
  | "ko"
  | "win"
  | "dizzy"
  | "gone";

export type Phase = "intro" | "fight" | "roundOver" | "finishWindow" | "finish" | "matchOver";

export type GameEvent =
  | "hit"
  | "bigHit"
  | "block"
  | "whoosh"
  | "special"
  | "ko"
  | "round"
  | "fight"
  | "thud"
  | "jump"
  | "poof"
  | "cluck"
  | "win"
  | "freeze"
  | "rocket"
  | "grow";

export type AnnounceKey = "round" | "fight" | "ko" | "time" | "draw" | "roundWin" | "finishPrompt" | "finishDone";

export interface Announce {
  key: AnnounceKey;
  at: number;
  param?: number | string;
}

export interface Fighter {
  def: CharacterDef;
  index: 0 | 1;
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  hp: number;
  hpTrail: number;
  action: ActionName;
  frame: number;
  attack: AttackData | null;
  hasHit: boolean;
  airAttacked: boolean;
  stun: number;
  onGround: boolean;
  specialCooldown: number;
  combo: number;
  bestCombo: number;
  hits: number;
  roundWins: number;
  prevInput: InputFrame;
  motion: number[];
  walkCycle: number;
}

export interface Projectile {
  owner: 0 | 1;
  x: number;
  y: number;
  vx: number;
  spin: number;
}

export type ParticleKind = "star" | "dust" | "snow" | "spark" | "smoke" | "flame" | "leaf";

export interface Particle {
  kind: ParticleKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
  rot: number;
}

export interface Popup {
  text: string;
  x: number;
  y: number;
  life: number;
  max: number;
  color: string;
  size: number;
}

export interface FinishState {
  kind: FinishKind | null;
  frame: number;
  winner: 0 | 1;
  loser: 0 | 1;
  x: number;
}

export interface MatchResult {
  winner: 0 | 1;
  wins: [number, number];
  bestCombo: [number, number];
  hits: [number, number];
}

export interface GameOptions {
  p1: CharacterDef;
  p2: CharacterDef;
  mode: GameMode;
  difficulty: Difficulty;
  /** Injectable for deterministic tests. */
  random?: () => number;
}

const CPU_DAMAGE: Record<Difficulty, number> = { easy: 0.6, normal: 0.85, hard: 1 };

const CONTROL_ACTIONS: ActionName[] = ["idle", "walk", "crouch", "land"];
const BLOCK_ACTIONS: ActionName[] = ["idle", "walk", "crouch", "block", "land"];
const INVULNERABLE: ActionName[] = ["knockdown", "down", "getup", "ko", "gone", "win", "dizzy"];

export function createFighter(def: CharacterDef, index: 0 | 1): Fighter {
  return {
    def,
    index,
    x: index === 0 ? 300 : 660,
    y: GROUND_Y,
    vx: 0,
    vy: 0,
    facing: index === 0 ? 1 : -1,
    hp: MAX_HP,
    hpTrail: MAX_HP,
    action: "idle",
    frame: 0,
    attack: null,
    hasHit: false,
    airAttacked: false,
    stun: 0,
    onGround: true,
    specialCooldown: 0,
    combo: 0,
    bestCombo: 0,
    hits: 0,
    roundWins: 0,
    prevInput: { ...EMPTY_INPUT },
    motion: [],
    walkCycle: 0,
  };
}

export function isCrouching(f: Fighter): boolean {
  return f.action === "crouch" || (f.action === "attack" && Boolean(f.attack?.low));
}

export function hurtBox(f: Fighter): Box | null {
  if (INVULNERABLE.includes(f.action)) return null;
  if (isCrouching(f)) return { x: -32, y: -118, w: 64, h: 118 };
  return { x: -30, y: -178, w: 60, h: 178 };
}

export function worldBox(f: Pick<Fighter, "x" | "y" | "facing">, b: Box): Box {
  const x = f.facing === 1 ? f.x + b.x : f.x - b.x - b.w;
  return { x, y: f.y + b.y, w: b.w, h: b.h };
}

export function overlaps(a: Box, b: Box): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export class Game {
  readonly fighters: [Fighter, Fighter];
  projectiles: Projectile[] = [];
  particles: Particle[] = [];
  popups: Popup[] = [];
  events: GameEvent[] = [];
  phase: Phase = "intro";
  phaseFrame = 0;
  round = 1;
  timer = ROUND_SECONDS * FPS;
  hitstop = 0;
  shake = 0;
  hype = 0;
  tick = 0;
  announce: Announce | null = null;
  roundWinner: 0 | 1 | null = null;
  finish: FinishState | null = null;
  result: MatchResult | null = null;
  private cpuFinishAt = -1;
  private readonly random: () => number;

  constructor(readonly opts: GameOptions) {
    this.random = opts.random ?? Math.random;
    this.fighters = [createFighter(opts.p1, 0), createFighter(opts.p2, 1)];
  }

  get cpuIndex(): 0 | 1 | null {
    return this.opts.mode === "cpu" ? 1 : null;
  }

  step(inputs: [InputFrame, InputFrame]): void {
    this.tick++;
    this.updateEffects();
    if (this.hitstop > 0) {
      this.hitstop--;
      return;
    }
    this.phaseFrame++;
    this.updatePhase(inputs);

    const live = this.phase === "fight";
    const [a, b] = this.fighters;
    this.updateFighter(a, b, live ? inputs[0] : EMPTY_INPUT, inputs[0]);
    this.updateFighter(b, a, live ? inputs[1] : EMPTY_INPUT, inputs[1]);
    this.resolvePush();
    this.updateProjectiles();

    for (const f of this.fighters) {
      f.hpTrail = f.hpTrail > f.hp ? Math.max(f.hp, f.hpTrail - 0.7) : f.hp;
    }

    if (this.phase === "fight") {
      if (a.hp <= 0 || b.hp <= 0) this.endRound("ko");
      else if (--this.timer <= 0) this.endRound("time");
    }
  }

  // ---------------------------------------------------------------- phases

  private updatePhase(inputs: [InputFrame, InputFrame]): void {
    switch (this.phase) {
      case "intro":
        if (this.phaseFrame === 1) {
          this.say("round", this.round);
          this.events.push("round");
        } else if (this.phaseFrame === 60) {
          this.say("fight");
          this.events.push("fight");
        } else if (this.phaseFrame >= 95) {
          this.setPhase("fight");
        }
        break;
      case "roundOver": {
        const w = this.roundWinner;
        if (this.phaseFrame === 70) {
          if (w === null) this.say("draw");
          else this.say("roundWin", w);
        }
        if (w !== null && this.phaseFrame > 70) {
          const f = this.fighters[w];
          if (CONTROL_ACTIONS.includes(f.action) && f.onGround) this.setAction(f, "win");
        }
        if (this.phaseFrame >= ROUND_OVER_FRAMES) {
          const champ = this.fighters.find((f) => f.roundWins >= ROUNDS_TO_WIN);
          if (champ) this.startFinishWindow(champ.index);
          else this.nextRound();
        }
        break;
      }
      case "finishWindow": {
        const w = this.roundWinner!;
        const winner = this.fighters[w];
        const input = inputs[w];
        const pressed =
          (input.punch && !winner.prevInput.punch) ||
          (input.kick && !winner.prevInput.kick) ||
          (input.special && !winner.prevInput.special);
        const isCpu = this.cpuIndex === w;
        if ((!isCpu && pressed) || (isCpu && this.phaseFrame === this.cpuFinishAt)) {
          this.startFinish(winner.def.finish);
        } else if (this.phaseFrame >= FINISH_WINDOW_FRAMES) {
          this.startFinish(null);
        }
        break;
      }
      case "finish":
        this.updateFinish();
        break;
      default:
        break;
    }
  }

  private setPhase(phase: Phase): void {
    this.phase = phase;
    this.phaseFrame = 0;
  }

  private say(key: AnnounceKey, param?: number | string): void {
    this.announce = { key, at: this.tick, param };
  }

  private endRound(reason: "ko" | "time"): void {
    const [a, b] = this.fighters;
    let winner: 0 | 1 | null;
    if (reason === "ko") winner = a.hp <= 0 && b.hp <= 0 ? null : a.hp <= 0 ? 1 : 0;
    else winner = a.hp === b.hp ? null : a.hp > b.hp ? 0 : 1;
    this.roundWinner = winner;
    if (winner !== null) this.fighters[winner].roundWins++;
    this.projectiles = [];
    this.setPhase("roundOver");
    this.say(reason === "ko" ? "ko" : "time");
    this.events.push(reason === "ko" ? "ko" : "round");
    this.hype = 1;
  }

  private nextRound(): void {
    this.round++;
    this.timer = ROUND_SECONDS * FPS;
    this.projectiles = [];
    this.roundWinner = null;
    for (const f of this.fighters) {
      const fresh = createFighter(f.def, f.index);
      Object.assign(f, {
        ...fresh,
        roundWins: f.roundWins,
        bestCombo: f.bestCombo,
        hits: f.hits,
        prevInput: f.prevInput,
      });
    }
    this.setPhase("intro");
  }

  private startFinishWindow(winnerIndex: 0 | 1): void {
    const loser = this.fighters[1 - winnerIndex];
    const winner = this.fighters[winnerIndex];
    Object.assign(loser, { action: "dizzy", frame: 0, y: GROUND_Y, vx: 0, vy: 0, onGround: true, hp: 0, attack: null });
    Object.assign(winner, { action: "idle", frame: 0, attack: null, vx: 0 });
    if (Math.abs(loser.x - winner.x) < 130) {
      const dir = loser.x >= winner.x ? 1 : -1;
      loser.x = clamp(winner.x + dir * 130, STAGE_LEFT, STAGE_RIGHT);
      if (Math.abs(loser.x - winner.x) < 130) winner.x = clamp(loser.x - dir * 130, STAGE_LEFT, STAGE_RIGHT);
    }
    winner.facing = loser.x >= winner.x ? 1 : -1;
    loser.facing = winner.x >= loser.x ? 1 : -1;
    this.cpuFinishAt = this.cpuIndex === winnerIndex && this.random() < 0.85 ? 50 + Math.floor(this.random() * 60) : -1;
    this.setPhase("finishWindow");
    this.say("finishPrompt");
  }

  private startFinish(kind: FinishKind | null): void {
    const w = this.roundWinner!;
    const l = (1 - w) as 0 | 1;
    const loser = this.fighters[l];
    this.finish = { kind, frame: 0, winner: w, loser: l, x: loser.x };
    this.setPhase("finish");
    if (kind) {
      this.setAction(this.fighters[w], "win");
      this.setAction(loser, "gone");
      this.events.push(kind === "orbit" ? "rocket" : "poof");
      const color = kind === "snowman" ? "#ffffff" : kind === "flowerpot" ? "#7cc26a" : "#f4efe6";
      this.burst(loser.x, GROUND_Y - 90, kind === "snowman" ? "snow" : kind === "flowerpot" ? "leaf" : "smoke", 26, color);
    } else {
      Object.assign(loser, { action: "ko", frame: 0, vy: -5, onGround: false });
      this.setAction(this.fighters[w], "win");
    }
  }

  private updateFinish(): void {
    const fin = this.finish!;
    fin.frame++;
    if (fin.kind && fin.frame === 45) this.say("finishDone", fin.kind);
    if (fin.kind === "chicken" && fin.frame > 30 && fin.frame % 38 === 0) this.events.push("cluck");
    if (fin.kind === "flowerpot" && fin.frame === 40) this.events.push("grow");
    if (fin.kind === "orbit" && fin.frame < 50 && fin.frame % 2 === 0) {
      const y = GROUND_Y - 90 - fin.frame * fin.frame * 0.35;
      this.burst(fin.x, y + 60, "flame", 2, "#ffb703");
    }
    if (fin.kind === "snowman" && fin.frame < 40 && fin.frame % 4 === 0) {
      this.burst(fin.x, GROUND_Y - 120, "snow", 3, "#ffffff");
    }
    if (fin.frame === 30) this.events.push("win");
    if (fin.frame >= FINISH_FRAMES) {
      const [a, b] = this.fighters;
      this.result = {
        winner: fin.winner,
        wins: [a.roundWins, b.roundWins],
        bestCombo: [a.bestCombo, b.bestCombo],
        hits: [a.hits, b.hits],
      };
      this.setPhase("matchOver");
    }
  }

  // -------------------------------------------------------------- fighters

  private setAction(f: Fighter, action: ActionName): void {
    f.action = action;
    f.frame = 0;
    if (action !== "attack") f.attack = null;
  }

  private faceOpponent(f: Fighter, opp: Fighter): void {
    if (opp.x > f.x + 2) f.facing = 1;
    else if (opp.x < f.x - 2) f.facing = -1;
  }

  private updateFighter(f: Fighter, opp: Fighter, inp: InputFrame, rawInput: InputFrame): void {
    const pressed = (k: keyof InputFrame) => inp[k] && !f.prevInput[k];
    f.motion.push(directionOf(inp, f.facing));
    if (f.motion.length > 24) f.motion.shift();
    if (f.specialCooldown > 0) f.specialCooldown--;
    f.frame++;

    const live = this.phase === "fight";

    switch (f.action) {
      case "idle":
      case "walk":
      case "crouch":
      case "land": {
        if (f.action === "land" && f.frame < 5) break;
        if (!live) {
          if (f.action !== "idle") this.setAction(f, "idle");
          if (this.phase === "intro" || this.phase === "finishWindow") this.faceOpponent(f, opp);
          break;
        }
        this.faceOpponent(f, opp);
        const fwd = f.facing === 1 ? inp.right : inp.left;
        const back = f.facing === 1 ? inp.left : inp.right;
        const wantsSpecial = pressed("special") || (pressed("punch") && hasQuarterCircle(f.motion));
        if (wantsSpecial && this.canSpecial(f)) {
          this.startSpecial(f);
        } else if (pressed("punch")) {
          this.startAttack(f, inp.down ? ATTACKS.lowPunch : ATTACKS.punch);
        } else if (pressed("kick")) {
          this.startAttack(f, inp.down ? ATTACKS.lowKick : ATTACKS.kick);
        } else if (inp.up) {
          this.setAction(f, "jump");
          f.vy = -f.def.jumpPower;
          f.vx = fwd ? 4.2 * f.facing : back ? -4.2 * f.facing : 0;
          f.onGround = false;
          f.airAttacked = false;
          this.events.push("jump");
        } else if (inp.down) {
          if (f.action !== "crouch") this.setAction(f, "crouch");
        } else if (fwd || back) {
          if (f.action !== "walk") this.setAction(f, "walk");
          f.vx = fwd ? f.def.walkSpeed * f.facing : -f.def.walkSpeed * 0.75 * f.facing;
          f.walkCycle += Math.abs(f.vx);
        } else if (f.action !== "idle") {
          this.setAction(f, "idle");
        }
        break;
      }
      case "jump":
        if (live && !f.airAttacked) {
          if (pressed("punch")) this.startAttack(f, ATTACKS.airPunch);
          else if (pressed("kick")) this.startAttack(f, ATTACKS.airKick);
        }
        break;
      case "attack":
        this.updateAttack(f, opp, inp);
        break;
      case "hit":
      case "block":
      case "frozen":
        if (--f.stun <= 0) this.setAction(f, f.onGround ? "idle" : "jump");
        break;
      case "down":
        if (--f.stun <= 0) this.setAction(f, "getup");
        break;
      case "getup":
        if (f.frame >= 18) this.setAction(f, "idle");
        break;
      default:
        break;
    }

    // physics
    if (!f.onGround) f.vy += GRAVITY;
    f.x += f.vx;
    f.y += f.vy;
    if (f.y >= GROUND_Y) {
      f.y = GROUND_Y;
      f.vy = 0;
      if (!f.onGround) {
        f.onGround = true;
        this.onLand(f);
      }
    }
    const rocketing = f.action === "attack" && f.def.special === "rocket" && f.attack?.id === "special";
    if (f.onGround && f.action !== "walk" && !rocketing) f.vx *= 0.86;
    if (Math.abs(f.vx) < 0.05) f.vx = 0;
    f.x = clamp(f.x, STAGE_LEFT, STAGE_RIGHT);
    f.prevInput = rawInput;
  }

  private onLand(f: Fighter): void {
    f.airAttacked = false;
    switch (f.action) {
      case "jump":
      case "attack":
        this.setAction(f, "land");
        f.vx = 0;
        this.burst(f.x, GROUND_Y, "dust", 5, "#d9c3a0");
        break;
      case "knockdown":
        this.setAction(f, "down");
        f.stun = 34;
        f.vx *= 0.4;
        this.burst(f.x, GROUND_Y, "dust", 10, "#d9c3a0");
        this.events.push("thud");
        this.shake = Math.max(this.shake, 5);
        break;
      case "ko":
        f.vx *= 0.4;
        this.burst(f.x, GROUND_Y, "dust", 14, "#d9c3a0");
        this.events.push("thud");
        this.shake = Math.max(this.shake, 8);
        break;
      case "hit":
      case "frozen":
        break;
      default:
        break;
    }
  }

  private canSpecial(f: Fighter): boolean {
    if (f.specialCooldown > 0) return false;
    if (f.def.special === "snowball" && this.projectiles.some((p) => p.owner === f.index)) return false;
    return true;
  }

  private startAttack(f: Fighter, data: AttackData): void {
    this.setAction(f, "attack");
    f.attack = data;
    f.hasHit = false;
    if (data.air) f.airAttacked = true;
    else f.vx = 0;
    this.events.push("whoosh");
  }

  private startSpecial(f: Fighter): void {
    const data = specialAttack(f.def.special);
    this.startAttack(f, data);
    f.specialCooldown = SPECIAL_COOLDOWN + data.startup + data.active + data.recovery;
    f.airAttacked = false;
    this.events.push("special");
  }

  private updateAttack(f: Fighter, opp: Fighter, inp: InputFrame): void {
    const a = f.attack!;
    const activeStart = a.startup + 1;
    const activeEnd = a.startup + a.active;
    const isActive = f.frame >= activeStart && f.frame <= activeEnd;

    if (a.id === "special") {
      switch (f.def.special) {
        case "snowball":
          if (f.frame === activeStart) {
            this.projectiles.push({ owner: f.index, x: f.x + f.facing * 62, y: f.y - 118, vx: 7.5 * f.facing, spin: 0 });
            this.events.push("whoosh");
          }
          break;
        case "rocket":
          if (f.frame === activeStart) this.events.push("rocket");
          if (isActive && !f.hasHit) {
            f.vx = 11 * f.facing;
            this.spawn("flame", f.x - f.facing * 40, f.y - 100 + (this.random() - 0.5) * 20, -f.facing * 2, -0.5, 14, 10, "#ffb703");
          } else if (f.frame > activeEnd || f.hasHit) {
            f.vx *= 0.7;
          }
          break;
        case "pounce":
          if (f.frame === activeStart) {
            f.vy = -13.5;
            f.vx = 7 * f.facing;
            f.onGround = false;
            this.events.push("jump");
          }
          break;
        case "vine":
          if (f.frame === activeStart) this.events.push("whoosh");
          break;
      }
    }

    if (isActive && a.box && !f.hasHit) this.tryHit(f, opp, a);

    if (f.frame >= activeEnd + a.recovery) {
      if (!f.onGround) {
        this.setAction(f, "jump");
        f.airAttacked = true;
      } else {
        this.setAction(f, inp.down && this.phase === "fight" ? "crouch" : "idle");
      }
    }
  }

  private tryHit(f: Fighter, opp: Fighter, a: AttackData): void {
    const hb = hurtBox(opp);
    if (!hb || !a.box) return;
    const ab = worldBox(f, a.box);
    const hw = worldBox(opp, hb);
    if (!overlaps(ab, hw)) return;
    f.hasHit = true;
    const cx = (Math.max(ab.x, hw.x) + Math.min(ab.x + ab.w, hw.x + hw.w)) / 2;
    const cy = (Math.max(ab.y, hw.y) + Math.min(ab.y + ab.h, hw.y + hw.h)) / 2;
    this.applyHit(f, opp, a, f.x, cx, cy);
  }

  canBlock(def: Fighter, sourceX: number): boolean {
    if (!def.onGround || !BLOCK_ACTIONS.includes(def.action)) return false;
    const input = def.prevInput;
    return sourceX > def.x ? input.left : input.right;
  }

  private applyHit(att: Fighter, def: Fighter, a: AttackData, sourceX: number, cx: number, cy: number): void {
    const away = def.x >= sourceX ? 1 : -1;

    if (this.canBlock(def, sourceX)) {
      this.setAction(def, "block");
      def.stun = a.blockstun;
      def.vx = away * Math.abs(a.knockback) * 0.7;
      if (def.x <= STAGE_LEFT + 1 || def.x >= STAGE_RIGHT - 1) att.vx = -away * Math.abs(a.knockback) * 0.6;
      this.hitstop = 3;
      this.burst(cx, cy, "spark", 6, "#bde0fe");
      this.events.push("block");
      return;
    }

    const wasStunned = def.action === "hit" || def.action === "frozen";
    const scale = this.cpuIndex === att.index ? CPU_DAMAGE[this.opts.difficulty] : 1;
    const dmg = Math.max(1, Math.round(a.damage * att.def.power * scale));
    def.hp = Math.max(0, def.hp - dmg);

    att.combo = wasStunned ? att.combo + 1 : 1;
    att.bestCombo = Math.max(att.bestCombo, att.combo);
    att.hits++;

    const word = a.fx[Math.floor(this.random() * a.fx.length)];
    this.popup(word, cx, cy - 20, "#ffd23f", a.damage >= 8 ? 40 : 32);
    if (att.combo >= 2) this.popup(`combo:${att.combo}`, att.index === 0 ? 150 : WIDTH - 150, 120, "#ffffff", 30);

    if (def.hp <= 0) {
      this.setAction(def, "ko");
      def.vy = -9;
      def.vx = away * 5;
      def.onGround = false;
      this.hitstop = 22;
      this.shake = 14;
      this.burst(cx, cy, "star", 18, "#ffd23f");
    } else if (a.knockdown || !def.onGround) {
      this.setAction(def, "knockdown");
      def.vy = -7.5;
      def.vx = away * 4.5;
      def.onGround = false;
      this.hitstop = 6;
      this.shake = 7;
      this.burst(cx, cy, "star", 10, "#ffd23f");
    } else if (a.freeze) {
      this.setAction(def, "frozen");
      def.stun = a.freeze;
      def.vx = away * 2;
      this.hitstop = 5;
      this.burst(cx, cy, "snow", 14, "#ffffff");
      this.events.push("freeze");
    } else {
      this.setAction(def, "hit");
      def.stun = a.hitstun;
      def.vx = a.knockback >= 0 ? away * a.knockback : -away * Math.min(9, Math.abs(def.x - att.x) / 14);
      if (a.knockback >= 0 && (def.x <= STAGE_LEFT + 1 || def.x >= STAGE_RIGHT - 1)) att.vx = -away * a.knockback * 0.6;
      this.hitstop = 5;
      this.shake = Math.max(this.shake, a.damage >= 8 ? 5 : 3);
      this.burst(cx, cy, "star", 7, "#ffd23f");
    }
    this.hype = Math.min(1, this.hype + 0.25);
    this.events.push(a.damage >= 8 || def.hp <= 0 ? "bigHit" : "hit");
  }

  private resolvePush(): void {
    const [a, b] = this.fighters;
    const ghost: ActionName[] = ["knockdown", "down", "ko", "gone"];
    if (ghost.includes(a.action) || ghost.includes(b.action)) return;
    if (Math.abs(a.y - b.y) > 130) return;
    const dx = b.x - a.x;
    if (Math.abs(dx) >= PUSH_DISTANCE) return;
    const dir = dx === 0 ? a.facing : Math.sign(dx);
    const push = (PUSH_DISTANCE - Math.abs(dx)) / 2;
    a.x = clamp(a.x - dir * push, STAGE_LEFT, STAGE_RIGHT);
    b.x = clamp(b.x + dir * push, STAGE_LEFT, STAGE_RIGHT);
    if (Math.abs(b.x - a.x) < PUSH_DISTANCE - 0.5) {
      if (a.x <= STAGE_LEFT || a.x >= STAGE_RIGHT) b.x = clamp(a.x + dir * PUSH_DISTANCE, STAGE_LEFT, STAGE_RIGHT);
      else a.x = clamp(b.x - dir * PUSH_DISTANCE, STAGE_LEFT, STAGE_RIGHT);
    }
  }

  private updateProjectiles(): void {
    const keep: Projectile[] = [];
    for (const p of this.projectiles) {
      p.x += p.vx;
      p.spin += 0.3;
      if (this.tick % 3 === 0) this.spawn("snow", p.x - Math.sign(p.vx) * 14, p.y, -p.vx * 0.1, 0.4, 18, 4, "#ffffff");
      const target = this.fighters[1 - p.owner];
      const hb = hurtBox(target);
      const box = { x: p.x - 16, y: p.y - 16, w: 32, h: 32 };
      if (hb && overlaps(box, worldBox(target, hb))) {
        const owner = this.fighters[p.owner];
        this.applyHit(owner, target, specialAttack(owner.def.special), p.x - p.vx * 10, p.x, p.y);
        continue;
      }
      if (p.x < -40 || p.x > WIDTH + 40) continue;
      keep.push(p);
    }
    this.projectiles = keep;
  }

  // --------------------------------------------------------------- effects

  private updateEffects(): void {
    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.rot += 0.1;
      p.life--;
      switch (p.kind) {
        case "star":
        case "spark":
          p.vy += 0.3;
          break;
        case "snow":
        case "leaf":
          p.vy += 0.12;
          p.vx *= 0.97;
          break;
        case "dust":
          p.vx *= 0.9;
          p.vy *= 0.9;
          break;
        case "smoke":
        case "flame":
          p.vy -= 0.04;
          p.vx *= 0.95;
          break;
      }
    }
    this.particles = this.particles.filter((p) => p.life > 0);
    for (const p of this.popups) {
      p.y -= 0.7;
      p.life--;
    }
    this.popups = this.popups.filter((p) => p.life > 0);
    this.shake = this.shake > 0.3 ? this.shake * 0.86 : 0;
    this.hype *= 0.985;
  }

  private spawn(kind: ParticleKind, x: number, y: number, vx: number, vy: number, life: number, size: number, color: string): void {
    if (this.particles.length > 400) return;
    this.particles.push({ kind, x, y, vx, vy, life, max: life, size, color, rot: this.random() * Math.PI });
  }

  burst(x: number, y: number, kind: ParticleKind, n: number, color: string): void {
    for (let i = 0; i < n; i++) {
      const ang = this.random() * Math.PI * 2;
      const speed = kind === "dust" ? 1 + this.random() * 2 : 2 + this.random() * 5;
      const vy = kind === "dust" ? -Math.abs(Math.sin(ang) * speed) * 0.6 : Math.sin(ang) * speed - 1.5;
      const size = kind === "smoke" ? 14 + this.random() * 14 : kind === "star" ? 7 + this.random() * 6 : 4 + this.random() * 5;
      this.spawn(kind, x, y, Math.cos(ang) * speed, vy, 26 + Math.floor(this.random() * 20), size, color);
    }
  }

  private popup(text: string, x: number, y: number, color: string, size: number): void {
    if (text.startsWith("combo:")) this.popups = this.popups.filter((p) => !p.text.startsWith("combo:"));
    this.popups.push({ text, x, y, life: 48, max: 48, color, size });
  }
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}
