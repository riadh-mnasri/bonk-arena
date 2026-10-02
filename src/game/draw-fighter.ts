// © 2026 Riadh MNASRI

import type { AttackData } from "./attacks";
import type { ActionName } from "./engine";
import type { CharacterDef } from "./types";

export const OUTLINE = "#2b2118";

/** Everything needed to draw a fighter, so menus can draw them without a running game. */
export interface FighterView {
  def: CharacterDef;
  x: number;
  y: number;
  facing: 1 | -1;
  action: ActionName;
  frame: number;
  attack: AttackData | null;
  walkCycle: number;
  onGround: boolean;
}

interface P {
  x: number;
  y: number;
}

type Eyes = "open" | "focus" | "hurt" | "ko" | "happy";
type Mouth = "smile" | "open" | "grit" | "wavy";

interface Pose {
  hipY: number;
  lean: number;
  headTilt: number;
  handF: P;
  handB: P;
  footF: P;
  footB: P;
  rot: number;
  lift: number;
  eyes: Eyes;
  mouth: Mouth;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpP = (a: P, b: P, t: number): P => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) });

function extension(v: FighterView): number {
  const a = v.attack;
  if (!a) return 0;
  const f = v.frame;
  if (f <= a.startup) return (f / Math.max(1, a.startup)) * 0.7;
  if (f <= a.startup + a.active) return 1;
  return Math.max(0, 1 - (f - a.startup - a.active) / Math.max(1, a.recovery));
}

function standing(t: number): Pose {
  const b = Math.sin(t * 0.1) * 2;
  return {
    hipY: -58 + b * 0.5,
    lean: 0,
    headTilt: 0,
    handF: { x: 32, y: -104 + b },
    handB: { x: 14, y: -98 + b },
    footF: { x: 16, y: 0 },
    footB: { x: -18, y: 0 },
    rot: 0,
    lift: 0,
    eyes: "open",
    mouth: "smile",
  };
}

function crouching(): Pose {
  return {
    ...standing(0),
    hipY: -32,
    handF: { x: 30, y: -78 },
    handB: { x: 12, y: -72 },
    footF: { x: 24, y: 0 },
    footB: { x: -24, y: 0 },
    eyes: "focus",
  };
}

function airborne(): Pose {
  return {
    ...standing(0),
    hipY: -50,
    handF: { x: 26, y: -118 },
    handB: { x: -20, y: -116 },
    footF: { x: 14, y: -24 },
    footB: { x: -12, y: -18 },
  };
}

function lying(progress: number, t: number, ko: boolean): Pose {
  const rot = -Math.PI / 2 * Math.min(1, progress);
  return {
    ...standing(0),
    hipY: -58,
    handF: { x: 30, y: -120 + Math.sin(t * 0.2) * (ko ? 0 : 4) },
    handB: { x: -10, y: -126 },
    footF: { x: 16, y: -4 },
    footB: { x: -14, y: 2 },
    rot,
    lift: 30 * Math.abs(Math.sin(rot)),
    eyes: "ko",
    mouth: "wavy",
  };
}

function specialPose(v: FighterView, t: number, ext: number): Pose {
  const base = standing(t);
  const a = v.attack!;
  const winding = v.frame <= a.startup;
  switch (v.def.special) {
    case "snowball":
      return winding
        ? { ...base, lean: -8, handB: { x: -36, y: -150 }, handF: { x: 20, y: -100 }, eyes: "focus", mouth: "grit" }
        : { ...base, lean: 10 * ext, handF: lerpP({ x: 30, y: -110 }, { x: 74, y: -114 }, ext), handB: { x: -10, y: -100 }, mouth: "open" };
    case "rocket":
      return {
        ...base,
        lean: winding ? -10 : 16,
        handF: winding ? { x: -6, y: -110 } : { x: 88, y: -108 },
        handB: { x: -26, y: -96 },
        footF: { x: 24, y: 0 },
        footB: { x: -34, y: winding ? 0 : -10 },
        eyes: "focus",
        mouth: winding ? "grit" : "open",
      };
    case "pounce":
      if (v.onGround && winding) return { ...crouching(), handF: { x: 34, y: -60 }, mouth: "grit" };
      return {
        ...airborne(),
        lean: 14,
        handF: { x: 64, y: -128 },
        handB: { x: 50, y: -116 },
        footF: { x: -18, y: -30 },
        footB: { x: -34, y: -22 },
        mouth: "open",
      };
    case "vine":
      return {
        ...base,
        lean: winding ? -6 : 8,
        handF: winding ? { x: -16, y: -138 } : lerpP({ x: 30, y: -112 }, { x: 64, y: -112 }, ext),
        handB: { x: -18, y: -98 },
        eyes: "focus",
        mouth: winding ? "grit" : "open",
      };
  }
}

function poseFor(v: FighterView, t: number): Pose {
  switch (v.action) {
    case "idle":
      return standing(t);
    case "walk": {
      const ph = v.walkCycle * 0.09;
      const s = Math.sin(ph);
      const c = Math.cos(ph);
      const p = standing(t);
      return {
        ...p,
        hipY: -58 - Math.abs(c) * 2,
        footF: { x: 16 + s * 14, y: -Math.max(0, c) * 9 },
        footB: { x: -18 - s * 14, y: -Math.max(0, -c) * 9 },
        handF: { x: 32 - s * 4, y: p.handF.y },
        handB: { x: 14 + s * 4, y: p.handB.y },
      };
    }
    case "crouch":
      return crouching();
    case "jump":
      return airborne();
    case "land":
      return { ...standing(t), hipY: -48, footF: { x: 22, y: 0 }, footB: { x: -24, y: 0 } };
    case "attack": {
      const a = v.attack!;
      const e = extension(v);
      if (a.id === "special") return specialPose(v, t, e);
      if (a.id === "punch") {
        const p = standing(t);
        return { ...p, lean: e * 8, handF: lerpP(p.handF, { x: 82, y: -114 }, e), handB: { x: 6, y: -100 }, eyes: "focus", mouth: "grit" };
      }
      if (a.id === "kick") {
        const p = standing(t);
        return {
          ...p,
          lean: -e * 10,
          hipY: -58 - e * 4,
          footF: lerpP(p.footF, { x: 96, y: -80 }, e),
          footB: { x: -14, y: 0 },
          handF: { x: 20, y: -116 },
          handB: { x: -22, y: -106 },
          eyes: "focus",
          mouth: "grit",
        };
      }
      if (a.id === "lowPunch") {
        const p = crouching();
        return { ...p, handF: lerpP(p.handF, { x: 74, y: -60 }, e), mouth: "grit" };
      }
      if (a.id === "lowKick") {
        const p = crouching();
        return { ...p, hipY: -26, lean: -6, footF: lerpP(p.footF, { x: 100, y: -8 }, e), handF: { x: 14, y: -62 }, handB: { x: -30, y: -50 }, mouth: "grit" };
      }
      if (a.id === "airPunch") {
        const p = airborne();
        return { ...p, handF: lerpP(p.handF, { x: 70, y: -98 }, e), lean: 8 * e, eyes: "focus", mouth: "grit" };
      }
      const p = airborne();
      return { ...p, footF: lerpP(p.footF, { x: 76, y: -42 }, e), footB: { x: -10, y: -30 }, lean: -6 * e, eyes: "focus", mouth: "grit" };
    }
    case "hit":
    case "frozen":
      return {
        ...standing(0),
        lean: -12,
        headTilt: -0.28,
        handF: { x: 8, y: -132 },
        handB: { x: -32, y: -122 },
        footF: { x: 20, y: 0 },
        footB: { x: -22, y: 0 },
        eyes: "hurt",
        mouth: "open",
      };
    case "block":
      return { ...standing(0), lean: -5, handF: { x: 38, y: -124 }, handB: { x: 36, y: -102 }, eyes: "focus", mouth: "grit" };
    case "knockdown":
      return { ...lying(v.frame / 22, t, false), eyes: "hurt", mouth: "open", lift: 0 };
    case "down":
      return lying(1, t, false);
    case "getup":
      return { ...lying(1 - v.frame / 18, t, false), eyes: "focus", mouth: "grit" };
    case "ko":
      return lying(v.onGround ? 1 : Math.min(1, v.frame / 20), t, true);
    case "win": {
      const bounce = Math.abs(Math.sin(t * 0.13));
      return {
        ...standing(t),
        handF: { x: 52, y: -172 + bounce * 6 },
        handB: { x: -40, y: -168 + bounce * 6 },
        lift: bounce * 14,
        eyes: "happy",
        mouth: "open",
      };
    }
    case "dizzy":
      return {
        ...standing(0),
        lean: Math.sin(t * 0.08) * 12,
        headTilt: Math.sin(t * 0.08) * 0.22,
        handF: { x: 20 + Math.sin(t * 0.08) * 10, y: -86 },
        handB: { x: -6, y: -84 },
        eyes: "ko",
        mouth: "wavy",
      };
    case "gone":
      return standing(t);
  }
}

function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(c + (amt < 0 ? c * amt : (255 - c) * amt))));
  const r = f((n >> 16) & 255);
  const g = f((n >> 8) & 255);
  const b = f(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

function limb(ctx: CanvasRenderingContext2D, a: P, b: P, color: string, width: number, natural: number, joint: "knee" | "elbow") {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const slack = Math.sqrt(Math.max(0, natural * natural - len * len)) * 0.5;
  let nx = -dy / len;
  let ny = dx / len;
  if (joint === "knee" ? nx < 0 : ny < 0) {
    nx = -nx;
    ny = -ny;
  }
  const cx = (a.x + b.x) / 2 + nx * slack;
  const cy = (a.y + b.y) / 2 + ny * slack;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.quadraticCurveTo(cx, cy, b.x, b.y);
  ctx.lineCap = "round";
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = width + 7;
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function circle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string, stroke = true) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.lineWidth = 4;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();
  }
}

function ellipse(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, fill: string, stroke = true) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.lineWidth = 4;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill: string, stroke = true) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.lineWidth = 4;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();
  }
}

function glove(ctx: CanvasRenderingContext2D, p: P, color: string, big = false) {
  const r = big ? 15 : 11;
  circle(ctx, p.x, p.y, r, color);
  circle(ctx, p.x - r * 0.35, p.y - r * 0.35, r * 0.28, "rgba(255,255,255,0.55)", false);
}

function foot(ctx: CanvasRenderingContext2D, p: P, color: string) {
  ellipse(ctx, p.x + 5, p.y - 6, 15, 8, color);
}

function eyes(ctx: CanvasRenderingContext2D, kind: Eyes, lid: string, t: number) {
  const spots: P[] = [
    { x: 4, y: -4 },
    { x: 21, y: -4 },
  ];
  ctx.lineCap = "round";
  for (const e of spots) {
    switch (kind) {
      case "open":
      case "focus": {
        const blink = kind === "open" && Math.floor(t) % 190 < 6;
        if (blink) {
          ctx.beginPath();
          ctx.moveTo(e.x - 6, e.y);
          ctx.lineTo(e.x + 6, e.y);
          ctx.lineWidth = 3.5;
          ctx.strokeStyle = OUTLINE;
          ctx.stroke();
          break;
        }
        circle(ctx, e.x, e.y, 7.5, "#ffffff", false);
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = OUTLINE;
        ctx.stroke();
        circle(ctx, e.x + 2.5, e.y + 0.5, 3.8, OUTLINE, false);
        circle(ctx, e.x + 3.5, e.y - 1, 1.2, "#ffffff", false);
        if (kind === "focus") {
          ctx.beginPath();
          ctx.moveTo(e.x - 8, e.y - 7);
          ctx.lineTo(e.x + 8, e.y - 3);
          ctx.lineTo(e.x + 8, e.y - 10);
          ctx.lineTo(e.x - 8, e.y - 10);
          ctx.closePath();
          ctx.fillStyle = lid;
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(e.x - 8, e.y - 7);
          ctx.lineTo(e.x + 8, e.y - 3);
          ctx.lineWidth = 3;
          ctx.strokeStyle = OUTLINE;
          ctx.stroke();
        }
        break;
      }
      case "hurt":
        ctx.beginPath();
        ctx.moveTo(e.x - 5, e.y - 5);
        ctx.lineTo(e.x + 4, e.y);
        ctx.lineTo(e.x - 5, e.y + 5);
        ctx.lineWidth = 3.5;
        ctx.strokeStyle = OUTLINE;
        ctx.stroke();
        break;
      case "ko":
        ctx.beginPath();
        for (let i = 0; i < 18; i++) {
          const a = i * 0.7 + t * 0.15;
          const r = i * 0.42;
          const x = e.x + Math.cos(a) * r;
          const y = e.y + Math.sin(a) * r;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = OUTLINE;
        ctx.stroke();
        break;
      case "happy":
        ctx.beginPath();
        ctx.arc(e.x, e.y + 2, 6, Math.PI * 1.1, Math.PI * 1.9);
        ctx.lineWidth = 3.5;
        ctx.strokeStyle = OUTLINE;
        ctx.stroke();
        break;
    }
  }
}

function mouth(ctx: CanvasRenderingContext2D, kind: Mouth, x: number, y: number) {
  ctx.lineCap = "round";
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 3;
  ctx.beginPath();
  switch (kind) {
    case "smile":
      ctx.arc(x, y - 4, 7, Math.PI * 0.2, Math.PI * 0.8);
      ctx.stroke();
      break;
    case "open":
      ctx.ellipse(x, y, 6, 7, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#7a1f2b";
      ctx.fill();
      ctx.stroke();
      break;
    case "grit":
      ctx.roundRect(x - 8, y - 4, 16, 8, 3);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - 8, y);
      ctx.lineTo(x + 8, y);
      ctx.lineWidth = 1.5;
      ctx.stroke();
      break;
    case "wavy":
      ctx.moveTo(x - 8, y);
      ctx.quadraticCurveTo(x - 4, y - 5, x, y);
      ctx.quadraticCurveTo(x + 4, y + 5, x + 8, y);
      ctx.stroke();
      break;
  }
}

function head(ctx: CanvasRenderingContext2D, def: CharacterDef, pose: Pose, t: number) {
  const pal = def.palette;
  switch (def.id) {
    case "blizz": {
      for (const [hx, hy] of [
        [-16, -24],
        [8, -28],
      ]) {
        ctx.beginPath();
        ctx.moveTo(hx, hy);
        ctx.lineTo(hx - 4, hy - 20);
        ctx.lineTo(hx + 12, hy - 4);
        ctx.closePath();
        ctx.fillStyle = "#fff4d6";
        ctx.fill();
        ctx.lineWidth = 3.5;
        ctx.strokeStyle = OUTLINE;
        ctx.stroke();
      }
      circle(ctx, -14, -26, 11, pal.main);
      circle(ctx, 2, -32, 11, pal.main);
      circle(ctx, 0, 0, 33, pal.main);
      circle(ctx, -14, -26, 9, pal.main, false);
      circle(ctx, 2, -30, 9, pal.main, false);
      ellipse(ctx, 13, 3, 21, 18, pal.belly, false);
      eyes(ctx, pose.eyes, pal.belly, t);
      mouth(ctx, pose.mouth, 14, 15);
      break;
    }
    case "ziggy": {
      ctx.beginPath();
      ctx.moveTo(-2, -28);
      ctx.lineTo(4, -50);
      ctx.lineWidth = 4;
      ctx.strokeStyle = OUTLINE;
      ctx.stroke();
      circle(ctx, 4, -52, 6, Math.floor(t / 20) % 2 ? "#ff5a5f" : "#ffd23f");
      roundRect(ctx, -32, -30, 64, 58, 14, pal.main);
      circle(ctx, -32, 0, 6, pal.dark);
      roundRect(ctx, -6, -16, 38, 22, 9, "#1d2b36");
      ctx.fillStyle = pal.accent;
      ctx.strokeStyle = pal.accent;
      ctx.lineWidth = 3;
      for (const ex of [4, 20]) {
        ctx.beginPath();
        if (pose.eyes === "hurt" || pose.eyes === "ko") {
          ctx.moveTo(ex - 4, -9);
          ctx.lineTo(ex + 4, -1);
          ctx.moveTo(ex + 4, -9);
          ctx.lineTo(ex - 4, -1);
          ctx.stroke();
        } else if (pose.eyes === "happy") {
          ctx.arc(ex, -2, 4.5, Math.PI * 1.1, Math.PI * 1.9);
          ctx.stroke();
        } else {
          ctx.roundRect(ex - 4, pose.eyes === "focus" ? -7 : -10, 8, pose.eyes === "focus" ? 5 : 9, 2);
          ctx.fill();
        }
      }
      ctx.fillStyle = OUTLINE;
      for (let i = 0; i < 4; i++) ctx.fillRect(4 + i * 6, 14, 3, 6);
      break;
    }
    case "momo": {
      for (const [a, b, c] of [
        [
          [-26, -14],
          [-28, -50],
          [-4, -28],
        ],
        [
          [4, -30],
          [22, -52],
          [28, -12],
        ],
      ]) {
        ctx.beginPath();
        ctx.moveTo(a[0], a[1]);
        ctx.lineTo(b[0], b[1]);
        ctx.lineTo(c[0], c[1]);
        ctx.closePath();
        ctx.fillStyle = pal.main;
        ctx.fill();
        ctx.lineWidth = 4;
        ctx.strokeStyle = OUTLINE;
        ctx.stroke();
      }
      circle(ctx, 0, 0, 31, pal.main);
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, 29, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = pal.accent;
      ctx.fillRect(-12, -32, 50, 34);
      ctx.fillStyle = "#ffd23f";
      ctx.beginPath();
      for (let i = 0; i <= 6; i++) ctx.lineTo(-12 + i * 8, i % 2 ? -26 : -32);
      ctx.lineTo(38, -36);
      ctx.lineTo(-12, -36);
      ctx.fill();
      ctx.restore();
      ellipse(ctx, 15, 12, 14, 9, pal.belly, false);
      ctx.beginPath();
      ctx.moveTo(22, 5);
      ctx.lineTo(28, 5);
      ctx.lineTo(25, 9);
      ctx.closePath();
      ctx.fillStyle = "#ff7aa2";
      ctx.fill();
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.5;
      for (const dy of [10, 15]) {
        ctx.beginPath();
        ctx.moveTo(30, dy);
        ctx.lineTo(42, dy - 3 + (dy - 10));
        ctx.stroke();
      }
      eyes(ctx, pose.eyes, pal.accent, t);
      mouth(ctx, pose.mouth === "smile" ? "smile" : pose.mouth, 16, 18);
      break;
    }
    case "picotte": {
      circle(ctx, 0, 0, 31, pal.main);
      ctx.strokeStyle = pal.dark;
      ctx.lineWidth = 2.5;
      for (const [sx, sy] of [
        [-18, -12],
        [-8, -22],
        [-22, 6],
        [-12, 16],
        [6, -26],
      ]) {
        ctx.beginPath();
        ctx.moveTo(sx - 3, sy - 3);
        ctx.lineTo(sx + 3, sy + 3);
        ctx.moveTo(sx + 3, sy - 3);
        ctx.lineTo(sx - 3, sy + 3);
        ctx.stroke();
      }
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 + Math.sin(t * 0.05) * 0.1;
        circle(ctx, -2 + Math.cos(a) * 10, -36 + Math.sin(a) * 10, 9, pal.accent);
      }
      circle(ctx, -2, -36, 6, "#ffd23f");
      circle(ctx, 28, 8, 5, "rgba(255,111,168,0.45)", false);
      circle(ctx, 2, 8, 5, "rgba(255,111,168,0.45)", false);
      eyes(ctx, pose.eyes, pal.main, t);
      mouth(ctx, pose.mouth, 14, 15);
      break;
    }
  }
}

function torso(ctx: CanvasRenderingContext2D, def: CharacterDef, pose: Pose, t: number) {
  const pal = def.palette;
  const cx = pose.lean * 0.5;
  const cy = pose.hipY - 26;
  switch (def.id) {
    case "ziggy":
      roundRect(ctx, cx - 28, cy - 34, 56, 64, 16, pal.main);
      roundRect(ctx, cx - 6, cy - 16, 26, 22, 6, pal.belly);
      ["#ff5a5f", "#2ec4b6", "#ffd23f"].forEach((c, i) => circle(ctx, cx + 1 + i * 7, cy - 5, 2.6, Math.floor(t / 15 + i) % 3 ? c : "#ffffff", false));
      break;
    case "momo":
      ellipse(ctx, cx, cy, 29, 34, pal.main);
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(cx, cy, 27, 32, 0, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = pal.accent;
      ctx.fillRect(cx - 30, cy - 4, 60, 40);
      ctx.fillStyle = "#ffd23f";
      ctx.fillRect(cx - 30, cy + 8, 60, 7);
      ctx.restore();
      ctx.beginPath();
      ctx.ellipse(cx, cy, 29, 34, 0, 0, Math.PI * 2);
      ctx.lineWidth = 4;
      ctx.strokeStyle = OUTLINE;
      ctx.stroke();
      break;
    default:
      ellipse(ctx, cx, cy, 30, 35, pal.main);
      ellipse(ctx, cx + 8, cy + 4, 17, 22, pal.belly, false);
      if (def.id === "picotte") {
        ctx.strokeStyle = pal.dark;
        ctx.lineWidth = 2.5;
        for (const [sx, sy] of [
          [-16, -14],
          [-20, 8],
          [-6, 22],
        ]) {
          ctx.beginPath();
          ctx.moveTo(cx + sx - 3, cy + sy);
          ctx.lineTo(cx + sx + 3, cy + sy);
          ctx.stroke();
        }
      }
  }
  if (def.id === "blizz") {
    const ny = pose.hipY - 56;
    const flap = Math.sin(t * 0.18) * 6;
    ctx.beginPath();
    ctx.moveTo(cx - 8, ny + 4);
    ctx.quadraticCurveTo(cx - 30, ny + 4 + flap, cx - 46, ny + 16 + flap);
    ctx.lineWidth = 16;
    ctx.strokeStyle = OUTLINE;
    ctx.lineCap = "round";
    ctx.stroke();
    ctx.lineWidth = 10;
    ctx.strokeStyle = pal.accent;
    ctx.stroke();
    roundRect(ctx, cx - 26, ny - 2, 54, 14, 7, pal.accent);
  }
}

function tail(ctx: CanvasRenderingContext2D, def: CharacterDef, pose: Pose, t: number) {
  const sway = Math.sin(t * 0.12) * 8;
  ctx.beginPath();
  ctx.moveTo(-20, pose.hipY - 10);
  ctx.bezierCurveTo(-50, pose.hipY - 10, -50 + sway, pose.hipY - 60, -34 + sway, pose.hipY - 70);
  ctx.lineCap = "round";
  ctx.lineWidth = 15;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  ctx.lineWidth = 8;
  ctx.strokeStyle = def.palette.main;
  ctx.stroke();
}

function vine(ctx: CanvasRenderingContext2D, v: FighterView, pose: Pose) {
  const a = v.attack;
  if (!a || a.id !== "special" || v.def.special !== "vine") return;
  const start = a.startup + 1;
  const f = v.frame;
  if (f < start || f > start + a.active + 10) return;
  const reach = f <= start + a.active ? Math.min(1, (f - start + 2) / 4) : Math.max(0, 1 - (f - start - a.active) / 10);
  const tipX = pose.handF.x + 190 * reach;
  const y = pose.handF.y;
  ctx.beginPath();
  ctx.moveTo(pose.handF.x, y);
  ctx.bezierCurveTo(pose.handF.x + 50, y - 22, tipX - 60, y + 22, tipX, y);
  ctx.lineCap = "round";
  ctx.lineWidth = 11;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  ctx.lineWidth = 6;
  ctx.strokeStyle = "#4caf50";
  ctx.stroke();
  for (let i = 1; i <= 3; i++) {
    const lx = pose.handF.x + (tipX - pose.handF.x) * (i / 4);
    ellipse(ctx, lx, y - 9 + (i % 2) * 16, 7, 4, "#7cc26a");
  }
  circle(ctx, tipX, y, 8, v.def.palette.accent);
}

function heldSnowball(ctx: CanvasRenderingContext2D, v: FighterView, pose: Pose) {
  const a = v.attack;
  if (!a || a.id !== "special" || v.def.special !== "snowball" || v.frame > a.startup) return;
  circle(ctx, pose.handB.x, pose.handB.y - 14, 13, "#ffffff");
}

export function drawStarsAround(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, n = 3) {
  for (let i = 0; i < n; i++) {
    const a = t * 0.08 + (i / n) * Math.PI * 2;
    drawStar(ctx, x + Math.cos(a) * 32, y + Math.sin(a) * 9, 8, "#ffd23f");
  }
}

export function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, rot = 0) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 ? r * 0.45 : r;
    const a = rot - Math.PI / 2 + (i * Math.PI) / 5;
    ctx.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
}

export function drawShadow(ctx: CanvasRenderingContext2D, x: number, groundY: number, height: number) {
  const s = Math.max(0.4, 1 - height / 300);
  ctx.beginPath();
  ctx.ellipse(x, groundY + 3, 44 * s, 9 * s, 0, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(43,33,24,0.2)";
  ctx.fill();
}

export function drawFighter(ctx: CanvasRenderingContext2D, v: FighterView, t: number) {
  if (v.action === "gone") return;
  const pose = poseFor(v, t);
  const pal = v.def.palette;
  const back = shade(pal.main, -0.18);
  const big = v.attack?.id === "special" && v.def.special === "rocket" && v.frame > v.attack.startup;

  ctx.save();
  ctx.translate(v.x, v.y - pose.lift);
  ctx.scale(v.facing, 1);
  if (pose.rot) ctx.rotate(pose.rot);

  const shoulderF = { x: pose.lean + 12, y: pose.hipY - 46 };
  const shoulderB = { x: pose.lean - 10, y: pose.hipY - 48 };
  const hipF = { x: 9, y: pose.hipY };
  const hipB = { x: -9, y: pose.hipY };
  const legColor = v.def.id === "ziggy" ? pal.dark : back;

  limb(ctx, hipB, pose.footB, legColor, 12, 64, "knee");
  foot(ctx, pose.footB, shade(pal.dark, -0.2));
  if (v.def.id === "momo") tail(ctx, v.def, pose, t);
  limb(ctx, shoulderB, pose.handB, back, 11, 62, "elbow");
  glove(ctx, pose.handB, shade(pal.accent, -0.2));
  heldSnowball(ctx, v, pose);

  torso(ctx, v.def, pose, t);
  limb(ctx, hipF, pose.footF, v.def.id === "ziggy" ? pal.dark : pal.main, 12, 64, "knee");
  foot(ctx, pose.footF, pal.dark);

  ctx.save();
  ctx.translate(pose.lean + 6, pose.hipY - 82);
  ctx.rotate(pose.headTilt);
  head(ctx, v.def, pose, t);
  ctx.restore();

  vine(ctx, v, pose);
  limb(ctx, shoulderF, pose.handF, pal.main, 11, 62, "elbow");
  glove(ctx, pose.handF, pal.accent, big);
  if (big) {
    ctx.beginPath();
    ctx.arc(pose.handF.x, pose.handF.y, 24, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,183,3,0.35)";
    ctx.fill();
  }

  if (v.action === "frozen") {
    ctx.beginPath();
    ctx.roundRect(-46, -190, 92, 194, 14);
    ctx.fillStyle = "rgba(189,224,254,0.55)";
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-30, -170);
    ctx.lineTo(-14, -150);
    ctx.moveTo(-30, -140);
    ctx.lineTo(-20, -128);
    ctx.lineWidth = 5;
    ctx.stroke();
  }
  ctx.restore();

  if (v.action === "dizzy" || (v.action === "ko" && v.onGround)) {
    const headY = v.action === "dizzy" ? v.y - 175 : v.y - 52;
    const headX = v.action === "dizzy" ? v.x + v.facing * 6 : v.x - v.facing * 140;
    drawStarsAround(ctx, headX, headY, t);
  }
}
