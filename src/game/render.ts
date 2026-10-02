// © 2026 Riadh MNASRI

import { drawFighter, drawShadow, drawStar, OUTLINE, type FighterView } from "./draw-fighter";
import { GROUND_Y, HEIGHT, MAX_HP, ROUNDS_TO_WIN, WIDTH, type Game } from "./engine";
import type { FinishKind } from "./types";

export interface CanvasText {
  round: (n: number) => string;
  fight: string;
  ko: string;
  time: string;
  draw: string;
  roundWin: (name: string) => string;
  finishPrompt: string;
  finishHint: string;
  finishDone: Record<FinishKind, string>;
  combo: (n: number) => string;
  cpu: string;
}

export interface RenderOptions {
  font: string;
  text: CanvasText;
}

const CROWD_COLORS = ["#ff5a5f", "#ffd23f", "#2ec4b6", "#8fd3f4", "#ff8c42", "#6abf69", "#f4a6c6", "#c9a27e"];

export function render(ctx: CanvasRenderingContext2D, game: Game, opts: RenderOptions) {
  const t = game.tick;
  ctx.save();
  if (game.shake) {
    ctx.translate(Math.sin(t * 13.7) * game.shake, Math.cos(t * 11.3) * game.shake * 0.6);
  }
  drawStage(ctx, t, game.hype);

  for (const f of game.fighters) {
    if (f.action !== "gone") drawShadow(ctx, f.x, GROUND_Y, GROUND_Y - f.y);
  }
  const order = [...game.fighters].sort((a, b) => Number(a.action === "attack") - Number(b.action === "attack"));
  for (const f of order) drawFighter(ctx, f, t);

  for (const p of game.projectiles) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.spin);
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(-4, -4, 5, 0, Math.PI * 2);
    ctx.fillStyle = "#d6eefa";
    ctx.fill();
    ctx.restore();
  }

  if (game.finish) drawFinish(ctx, game, t);
  drawParticles(ctx, game);
  drawPopups(ctx, game, opts);
  ctx.restore();

  drawHud(ctx, game, opts);
  drawAnnouncer(ctx, game, opts);
}

// ------------------------------------------------------------------ stage

export function drawStage(ctx: CanvasRenderingContext2D, t: number, hype = 0) {
  const sky = ctx.createLinearGradient(0, 0, 0, 320);
  sky.addColorStop(0, "#7fd1f0");
  sky.addColorStop(1, "#fff1d0");
  ctx.fillStyle = sky;
  ctx.fillRect(-20, -20, WIDTH + 40, HEIGHT + 40);

  // sun
  ctx.save();
  ctx.translate(810, 92);
  ctx.rotate(t * 0.004);
  ctx.fillStyle = "rgba(255,210,63,0.35)";
  for (let i = 0; i < 12; i++) {
    ctx.rotate(Math.PI / 6);
    ctx.beginPath();
    ctx.moveTo(0, -56);
    ctx.lineTo(10, -84);
    ctx.lineTo(-10, -84);
    ctx.fill();
  }
  ctx.restore();
  ctx.beginPath();
  ctx.arc(810, 92, 44, 0, Math.PI * 2);
  ctx.fillStyle = "#ffd23f";
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();

  // clouds
  for (let i = 0; i < 4; i++) {
    const x = ((i * 290 + t * (0.15 + i * 0.05)) % 1160) - 120;
    const y = 70 + (i % 2) * 60;
    cloud(ctx, x, y, 0.8 + (i % 3) * 0.2);
  }

  // hills
  ctx.fillStyle = "#b5dd92";
  ctx.beginPath();
  ctx.moveTo(-20, 300);
  ctx.quadraticCurveTo(180, 190, 400, 290);
  ctx.quadraticCurveTo(620, 200, 980, 280);
  ctx.lineTo(980, 400);
  ctx.lineTo(-20, 400);
  ctx.fill();
  ctx.fillStyle = "#94cc72";
  ctx.beginPath();
  ctx.moveTo(-20, 320);
  ctx.quadraticCurveTo(300, 250, 560, 320);
  ctx.quadraticCurveTo(780, 270, 980, 310);
  ctx.lineTo(980, 400);
  ctx.lineTo(-20, 400);
  ctx.fill();

  // crowd
  for (let i = 0; i < 30; i++) {
    const x = 18 + i * 32 + (i % 2) * 8;
    const bob = Math.abs(Math.sin(t * (0.06 + hype * 0.12) + i * 1.7)) * (3 + hype * 12);
    const y = 318 - bob + (i % 3) * 6;
    const color = CROWD_COLORS[(i * 5) % CROWD_COLORS.length];
    if (hype > 0.4 && i % 3 === 0) {
      ctx.beginPath();
      ctx.moveTo(x - 8, y + 10);
      ctx.lineTo(x - 14, y - 16);
      ctx.moveTo(x + 8, y + 10);
      ctx.lineTo(x + 14, y - 16);
      ctx.lineWidth = 5;
      ctx.strokeStyle = OUTLINE;
      ctx.lineCap = "round";
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(x, y + 18, 15, Math.PI, 0);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y, 11, 0, Math.PI * 2);
    ctx.fillStyle = "#ffe3c7";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();
    ctx.fillStyle = OUTLINE;
    ctx.fillRect(x - 5, y - 2, 2.5, 3);
    ctx.fillRect(x + 3, y - 2, 2.5, 3);
  }

  // fence
  ctx.fillStyle = "#c98b4f";
  ctx.fillRect(-20, 340, WIDTH + 40, 60);
  ctx.strokeStyle = "#8a5a2b";
  ctx.lineWidth = 3;
  for (let x = 0; x < WIDTH; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 340);
    ctx.lineTo(x, 400);
    ctx.stroke();
  }
  ctx.fillStyle = "#a86f38";
  ctx.fillRect(-20, 336, WIDTH + 40, 10);

  // ring mat
  ctx.fillStyle = "#f7e3b5";
  ctx.beginPath();
  ctx.moveTo(-20, 400);
  ctx.lineTo(WIDTH + 20, 400);
  ctx.lineTo(WIDTH + 20, 492);
  ctx.lineTo(-20, 492);
  ctx.fill();
  ctx.strokeStyle = "rgba(201,139,79,0.35)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.moveTo(-20, 412 + i * 14);
    ctx.lineTo(WIDTH + 20, 412 + i * 14);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.ellipse(WIDTH / 2, 446, 120, 26, 0, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,90,95,0.18)";
  ctx.fill();

  // ropes and posts (back)
  const ropes = ["#ff5a5f", "#ffd23f", "#2ec4b6"];
  ropes.forEach((c, i) => {
    const y = 300 + i * 30;
    ctx.beginPath();
    ctx.moveTo(18, y);
    ctx.quadraticCurveTo(WIDTH / 2, y + 6, WIDTH - 18, y);
    ctx.lineWidth = 9;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();
    ctx.lineWidth = 5;
    ctx.strokeStyle = c;
    ctx.stroke();
  });
  for (const x of [8, WIDTH - 28]) {
    ctx.beginPath();
    ctx.roundRect(x, 280, 20, 132, 6);
    ctx.fillStyle = "#e9ecef";
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();
  }

  // apron
  ctx.fillStyle = "#ff5a5f";
  ctx.fillRect(-20, 492, WIDTH + 40, 60);
  ctx.fillStyle = OUTLINE;
  ctx.fillRect(-20, 488, WIDTH + 40, 6);
  for (let x = 40; x < WIDTH; x += 110) drawStar(ctx, x, 518, 10, "#ffd23f", 0);

  // bunting
  ctx.beginPath();
  ctx.moveTo(-10, 96);
  ctx.quadraticCurveTo(WIDTH / 2, 136, WIDTH + 10, 96);
  ctx.lineWidth = 2;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  for (let i = 0; i < 19; i++) {
    const u = (i + 0.5) / 19;
    const x = -10 + u * (WIDTH + 20);
    const y = (1 - u) * (1 - u) * 96 + 2 * (1 - u) * u * 136 + u * u * 96;
    const sway = Math.sin(t * 0.05 + i) * 3;
    ctx.beginPath();
    ctx.moveTo(x - 12, y);
    ctx.lineTo(x + 12, y);
    ctx.lineTo(x + sway, y + 22);
    ctx.closePath();
    ctx.fillStyle = CROWD_COLORS[i % 4];
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function cloud(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(x, y, 22 * s, 0, Math.PI * 2);
  ctx.arc(x + 26 * s, y - 10 * s, 26 * s, 0, Math.PI * 2);
  ctx.arc(x + 54 * s, y, 20 * s, 0, Math.PI * 2);
  ctx.rect(x, y, 54 * s, 20 * s);
  ctx.fill();
}

// ---------------------------------------------------------------- effects

function drawParticles(ctx: CanvasRenderingContext2D, game: Game) {
  for (const p of game.particles) {
    const a = p.life / p.max;
    ctx.globalAlpha = Math.min(1, a * 1.5);
    switch (p.kind) {
      case "star":
        drawStar(ctx, p.x, p.y, p.size * (0.6 + a * 0.4), p.color, p.rot);
        break;
      case "leaf":
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size * 1.4, p.size * 0.7, 0, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = OUTLINE;
        ctx.stroke();
        ctx.restore();
        break;
      case "smoke":
      case "dust":
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1.4 - a * 0.4), 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        break;
      case "flame":
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * a, 0, Math.PI * 2);
        ctx.fillStyle = a > 0.5 ? "#ffd23f" : p.color;
        ctx.fill();
        break;
      default:
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (0.5 + a * 0.5), 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        if (p.kind === "snow") {
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = "#8fbcd4";
          ctx.stroke();
        }
    }
  }
  ctx.globalAlpha = 1;
}

function outlinedText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, fill: string, font: string, stroke = OUTLINE) {
  ctx.font = `${size}px ${font}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.lineWidth = Math.max(4, size * 0.18);
  ctx.strokeStyle = stroke;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = fill;
  ctx.fillText(text, x, y);
}

function drawPopups(ctx: CanvasRenderingContext2D, game: Game, opts: RenderOptions) {
  for (const p of game.popups) {
    const age = p.max - p.life;
    const pop = age < 6 ? 0.6 + (age / 6) * 0.6 : age < 10 ? 1.2 - ((age - 6) / 4) * 0.2 : 1;
    ctx.globalAlpha = Math.min(1, p.life / 12);
    const text = p.text.startsWith("combo:") ? opts.text.combo(Number(p.text.slice(6))) : p.text;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.text.startsWith("combo:") ? 0 : Math.sin(p.x) * 0.15);
    outlinedText(ctx, text, 0, 0, p.size * pop, p.color, opts.font);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

// ------------------------------------------------------------------- HUD

function drawHud(ctx: CanvasRenderingContext2D, game: Game, opts: RenderOptions) {
  const barW = 370;
  const barH = 26;
  const top = 22;
  game.fighters.forEach((f, i) => {
    const left = i === 0 ? 24 : WIDTH - 24 - barW;
    ctx.beginPath();
    ctx.roundRect(left - 3, top - 3, barW + 6, barH + 6, 10);
    ctx.fillStyle = OUTLINE;
    ctx.fill();
    ctx.fillStyle = "#4a3a30";
    ctx.beginPath();
    ctx.roundRect(left, top, barW, barH, 7);
    ctx.fill();
    const trailW = (barW * f.hpTrail) / MAX_HP;
    const hpW = (barW * f.hp) / MAX_HP;
    const color = f.hp > 50 ? "#52c46b" : f.hp > 25 ? "#ffd23f" : "#ff5a5f";
    ctx.fillStyle = "#ff9f9f";
    ctx.beginPath();
    ctx.roundRect(i === 0 ? left : left + barW - trailW, top, trailW, barH, 7);
    ctx.fill();
    if (hpW > 0) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(i === 0 ? left : left + barW - hpW, top, hpW, barH, 7);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.fillRect(i === 0 ? left + 6 : left + barW - hpW + 6, top + 4, Math.max(0, hpW - 12), 5);
    }

    ctx.font = `24px ${opts.font}`;
    ctx.textBaseline = "middle";
    ctx.textAlign = i === 0 ? "left" : "right";
    ctx.lineWidth = 5;
    ctx.lineJoin = "round";
    ctx.strokeStyle = OUTLINE;
    const label = game.cpuIndex === i ? `${f.def.name} (${opts.text.cpu})` : f.def.name;
    const nx = i === 0 ? left + 2 : left + barW - 2;
    ctx.strokeText(label, nx, top + barH + 22);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(label, nx, top + barH + 22);

    for (let w = 0; w < ROUNDS_TO_WIN; w++) {
      const sx = i === 0 ? left + barW - 14 - w * 30 : left + 14 + w * 30;
      drawStar(ctx, sx, top + barH + 22, 11, w < f.roundWins ? "#ffd23f" : "rgba(255,255,255,0.35)");
    }
  });

  const secs = Math.ceil(game.timer / 60);
  ctx.beginPath();
  ctx.roundRect(WIDTH / 2 - 34, 12, 68, 52, 14);
  ctx.fillStyle = OUTLINE;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#ffd23f";
  ctx.stroke();
  ctx.font = `34px ${opts.font}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = secs <= 10 && game.phase === "fight" && game.tick % 30 < 15 ? "#ff5a5f" : "#ffd23f";
  ctx.fillText(String(secs), WIDTH / 2, 40);
}

function drawAnnouncer(ctx: CanvasRenderingContext2D, game: Game, opts: RenderOptions) {
  const a = game.announce;
  const font = opts.font;
  if (game.phase === "finishWindow") {
    const pulse = 1 + Math.sin(game.tick * 0.2) * 0.05;
    outlinedText(ctx, opts.text.finishPrompt, WIDTH / 2, 190, 64 * pulse, "#ff8c42", font);
    if (game.tick % 50 < 34) outlinedText(ctx, opts.text.finishHint, WIDTH / 2, 248, 28, "#ffffff", font);
    return;
  }
  if (!a) return;
  const age = game.tick - a.at;
  const duration = a.key === "finishDone" ? 180 : a.key === "roundWin" ? 100 : 70;
  if (age > duration) return;
  const pop = age < 8 ? 0.4 + (age / 8) * 0.8 : age < 14 ? 1.2 - ((age - 8) / 6) * 0.2 : 1;
  ctx.globalAlpha = Math.min(1, (duration - age) / 12);
  let text = "";
  let color = "#ffd23f";
  let size = 72;
  switch (a.key) {
    case "round":
      text = opts.text.round(Number(a.param));
      color = "#ffffff";
      break;
    case "fight":
      text = opts.text.fight;
      color = "#ff5a5f";
      size = 92;
      break;
    case "ko":
      text = opts.text.ko;
      size = 96;
      break;
    case "time":
      text = opts.text.time;
      break;
    case "draw":
      text = opts.text.draw;
      color = "#ffffff";
      break;
    case "roundWin":
      text = opts.text.roundWin(game.fighters[Number(a.param)].def.name);
      color = "#ffffff";
      size = 48;
      break;
    case "finishDone":
      text = opts.text.finishDone[a.param as FinishKind];
      color = "#ff8c42";
      size = 56;
      break;
    default:
      return;
  }
  ctx.save();
  ctx.translate(WIDTH / 2, 200);
  ctx.scale(pop, pop);
  outlinedText(ctx, text, 0, 0, size, color, font);
  ctx.restore();
  ctx.globalAlpha = 1;
}

// ---------------------------------------------------------------- finishes

function drawFinish(ctx: CanvasRenderingContext2D, game: Game, t: number) {
  const fin = game.finish!;
  const loser = game.fighters[fin.loser];
  const x = fin.x;
  const f = fin.frame;
  const easeBack = (u: number) => {
    const c = 1.7;
    return 1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2);
  };

  switch (fin.kind) {
    case "snowman": {
      if (f < 10) return;
      const s = easeBack(Math.min(1, (f - 10) / 26));
      ctx.save();
      ctx.translate(x, GROUND_Y);
      ctx.scale(s, s);
      drawShadow(ctx, 0, 0, 0);
      const ball = (y: number, r: number) => {
        ctx.beginPath();
        ctx.arc(0, y, r, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
        ctx.lineWidth = 4;
        ctx.strokeStyle = OUTLINE;
        ctx.stroke();
      };
      ctx.lineWidth = 5;
      ctx.strokeStyle = "#7a4a22";
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-28, -112);
      ctx.lineTo(-62, -140 + Math.sin(t * 0.2) * 4);
      ctx.moveTo(28, -112);
      ctx.lineTo(62, -138);
      ctx.stroke();
      ball(-42, 42);
      ball(-112, 32);
      ball(-164, 24);
      ctx.beginPath();
      ctx.roundRect(-30, -142, 60, 10, 5);
      ctx.fillStyle = loser.def.palette.main;
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = OUTLINE;
      for (const [ex, ey] of [
        [-8, -170],
        [8, -170],
        [0, -118],
        [0, -100],
        [0, -62],
      ]) {
        ctx.beginPath();
        ctx.arc(ex, ey, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.beginPath();
      ctx.moveTo(0, -162);
      ctx.lineTo(loser.facing * 26, -158);
      ctx.lineTo(0, -154);
      ctx.closePath();
      ctx.fillStyle = "#ff8c42";
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = OUTLINE;
      ctx.stroke();
      ctx.restore();
      break;
    }
    case "orbit": {
      const y = GROUND_Y - f * f * 0.35;
      if (y > -200) {
        ctx.save();
        ctx.translate(x, y - 90);
        ctx.rotate(f * 0.35);
        ctx.translate(-x, -(y - 90));
        const view: FighterView = { ...loser, y, action: "hit", attack: null, onGround: false };
        drawFighter(ctx, view, t);
        ctx.restore();
      }
      if (f > 70) {
        const k = Math.min(1, (f - 70) / 12);
        const tw = 1 + Math.sin(t * 0.4) * 0.25;
        drawStar(ctx, Math.max(60, Math.min(WIDTH - 60, x)), 110, 18 * k * tw, "#ffffff", t * 0.05);
      }
      break;
    }
    case "chicken": {
      if (f < 12) return;
      const cx = Math.max(80, Math.min(WIDTH - 80, x + Math.sin((f - 12) * 0.045) * 150));
      const dir = Math.cos((f - 12) * 0.045) >= 0 ? 1 : -1;
      drawShadow(ctx, cx, GROUND_Y, 0);
      drawChicken(ctx, cx, GROUND_Y - Math.abs(Math.sin(f * 0.4)) * 6, dir, f);
      break;
    }
    case "flowerpot": {
      if (f < 26) {
        const s = 1 - f / 26;
        ctx.save();
        ctx.translate(x, GROUND_Y);
        ctx.scale(s, s);
        ctx.translate(-x, -GROUND_Y);
        drawFighter(ctx, { ...loser, action: "hit", attack: null }, t);
        ctx.restore();
      }
      if (f < 18) return;
      const s = easeBack(Math.min(1, (f - 18) / 20));
      ctx.save();
      ctx.translate(x, GROUND_Y);
      ctx.scale(s, s);
      drawShadow(ctx, 0, 0, 0);
      const grow = Math.min(1, Math.max(0, (f - 40) / 40));
      if (grow > 0) {
        ctx.beginPath();
        ctx.moveTo(0, -70);
        ctx.quadraticCurveTo(12, -70 - 50 * grow, 0, -70 - 100 * grow);
        ctx.lineWidth = 9;
        ctx.strokeStyle = OUTLINE;
        ctx.stroke();
        ctx.lineWidth = 5;
        ctx.strokeStyle = "#4caf50";
        ctx.stroke();
        const top = -70 - 100 * grow;
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2 + t * 0.02;
          ctx.beginPath();
          ctx.arc(Math.cos(a) * 14 * grow, top + Math.sin(a) * 14 * grow, 11 * grow, 0, Math.PI * 2);
          ctx.fillStyle = loser.def.palette.main === "#eef6fb" ? "#bfe3f2" : loser.def.palette.main;
          ctx.fill();
          ctx.lineWidth = 3;
          ctx.strokeStyle = OUTLINE;
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(0, top, 9 * grow, 0, Math.PI * 2);
        ctx.fillStyle = "#ffd23f";
        ctx.fill();
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(-46, -76);
      ctx.lineTo(46, -76);
      ctx.lineTo(34, 0);
      ctx.lineTo(-34, 0);
      ctx.closePath();
      ctx.fillStyle = "#d9734e";
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = OUTLINE;
      ctx.stroke();
      ctx.beginPath();
      ctx.roundRect(-52, -86, 104, 18, 6);
      ctx.fillStyle = "#e88a62";
      ctx.fill();
      ctx.stroke();
      const look = Math.sin(t * 0.06) * 4;
      for (const ex of [-12, 12]) {
        ctx.beginPath();
        ctx.arc(ex, -44, 8, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(ex + look, -43, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = OUTLINE;
        ctx.fill();
      }
      ctx.beginPath();
      ctx.moveTo(-8, -24);
      ctx.quadraticCurveTo(-4, -28, 0, -24);
      ctx.quadraticCurveTo(4, -20, 8, -24);
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();
      break;
    }
    default:
      break;
  }
}

function drawChicken(ctx: CanvasRenderingContext2D, x: number, y: number, dir: number, f: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir * 1.35, 1.35);
  const step = Math.sin(f * 0.5) * 8;
  ctx.lineCap = "round";
  ctx.strokeStyle = "#e09f1f";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-6, -22);
  ctx.lineTo(-6 + step, 0);
  ctx.moveTo(6, -22);
  ctx.lineTo(6 - step, 0);
  ctx.stroke();
  const shape = (draw: () => void, fill: string) => {
    ctx.beginPath();
    draw();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();
  };
  shape(() => {
    ctx.moveTo(-26, -42);
    ctx.lineTo(-40, -66);
    ctx.lineTo(-30, -48);
    ctx.lineTo(-42, -54);
    ctx.lineTo(-24, -34);
  }, "#ffffff");
  shape(() => ctx.ellipse(0, -40, 28, 22, 0, 0, Math.PI * 2), "#ffffff");
  shape(() => ctx.ellipse(-4, -40, 12, 8, -0.3, 0, Math.PI * 2), "#f1ece3");
  shape(() => {
    ctx.arc(18, -62, 6, 0, Math.PI * 2);
  }, "#ff5a5f");
  shape(() => ctx.arc(20, -54, 12, 0, Math.PI * 2), "#ffffff");
  shape(() => {
    ctx.moveTo(30, -56);
    ctx.lineTo(42, -52);
    ctx.lineTo(30, -48);
    ctx.closePath();
  }, "#ffb703");
  shape(() => ctx.ellipse(30, -44, 3, 5, 0, 0, Math.PI * 2), "#ff5a5f");
  ctx.beginPath();
  ctx.arc(23, -57, 2.6, 0, Math.PI * 2);
  ctx.fillStyle = OUTLINE;
  ctx.fill();
  ctx.restore();
}
