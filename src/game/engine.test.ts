// © 2026 Riadh MNASRI

import { describe, expect, it } from "vitest";
import { CpuBrain } from "./ai";
import { getCharacter } from "./characters";
import { Game, GROUND_Y, MAX_HP } from "./engine";
import { directionOf, hasQuarterCircle } from "./input";
import { EMPTY_INPUT, type InputFrame } from "./types";

const idle = (): InputFrame => ({ ...EMPTY_INPUT });

function newGame(random = () => 0.5) {
  return new Game({ p1: getCharacter("blizz"), p2: getCharacter("ziggy"), mode: "versus", difficulty: "normal", random });
}

function runIntro(game: Game) {
  while (game.phase === "intro") game.step([idle(), idle()]);
}

function tap(game: Game, p1: Partial<InputFrame>, p2: Partial<InputFrame> = {}) {
  game.step([{ ...idle(), ...p1 }, { ...idle(), ...p2 }]);
}

describe("input", () => {
  it("reads directions relative to facing", () => {
    // Given a fighter facing left holding the left key
    const input = { ...idle(), left: true };
    // When the direction is computed
    // Then left means forward (6) for it, and back (4) for a fighter facing right
    expect(directionOf(input, -1)).toBe(6);
    expect(directionOf(input, 1)).toBe(4);
  });

  it("detects a lenient quarter circle forward", () => {
    // Given / When / Then
    expect(hasQuarterCircle([5, 5, 2, 3, 6])).toBe(true);
    expect(hasQuarterCircle([5, 2, 5, 6])).toBe(true);
    expect(hasQuarterCircle([5, 5, 6])).toBe(false);
    expect(hasQuarterCircle([2, 6, 5, 5, 5, 5, 5, 5, 5, 5])).toBe(false);
  });
});

describe("game flow", () => {
  it("starts with an intro then lets players fight", () => {
    // Given a new game
    const game = newGame();
    expect(game.phase).toBe("intro");
    // When the intro plays out
    runIntro(game);
    // Then the fight begins with full health
    expect(game.phase).toBe("fight");
    expect(game.fighters.map((f) => f.hp)).toEqual([MAX_HP, MAX_HP]);
  });

  it("lands a punch when fighters are close", () => {
    // Given two fighters standing next to each other
    const game = newGame();
    runIntro(game);
    game.fighters[0].x = 400;
    game.fighters[1].x = 470;
    // When player 1 punches
    tap(game, { punch: true });
    for (let i = 0; i < 20; i++) tap(game, {});
    // Then player 2 loses health and player 1 scores a hit
    expect(game.fighters[1].hp).toBeLessThan(MAX_HP);
    expect(game.fighters[0].hits).toBe(1);
  });

  it("blocks when holding away from the attacker", () => {
    // Given player 2 holding back (right, since it faces left)
    const game = newGame();
    runIntro(game);
    game.fighters[0].x = 400;
    game.fighters[1].x = 470;
    tap(game, {}, { right: true });
    // When player 1 punches
    tap(game, { punch: true }, { right: true });
    for (let i = 0; i < 20; i++) tap(game, {}, { right: true });
    // Then no damage goes through
    expect(game.fighters[1].hp).toBe(MAX_HP);
  });

  it("freezes the opponent with Blizz's snowball", () => {
    // Given fighters at mid range
    const game = newGame();
    runIntro(game);
    game.fighters[0].x = 300;
    game.fighters[1].x = 560;
    // When Blizz throws a snowball
    tap(game, { special: true });
    let frozen = false;
    for (let i = 0; i < 80 && !frozen; i++) {
      tap(game, {});
      frozen = game.fighters[1].action === "frozen";
    }
    // Then Ziggy ends up frozen
    expect(frozen).toBe(true);
  });

  it("ends a round by KO and awards the round", () => {
    // Given player 2 nearly out of health
    const game = newGame();
    runIntro(game);
    game.fighters[0].x = 400;
    game.fighters[1].x = 470;
    game.fighters[1].hp = 1;
    // When player 1 punches
    tap(game, { punch: true });
    for (let i = 0; i < 40; i++) tap(game, {});
    // Then the round is over and player 1 wins it
    expect(game.phase).toBe("roundOver");
    expect(game.fighters[0].roundWins).toBe(1);
  });

  it("goes through the funny finish and reports the match result", () => {
    // Given player 1 one round away from winning
    const game = newGame();
    runIntro(game);
    game.fighters[0].roundWins = 1;
    game.fighters[0].x = 400;
    game.fighters[1].x = 470;
    game.fighters[1].hp = 1;
    tap(game, { punch: true });
    for (let i = 0; i < 400 && game.phase !== "finishWindow"; i++) tap(game, {});
    expect(game.phase).toBe("finishWindow");
    // When the winner presses an attack during the finish window
    tap(game, { kick: true });
    for (let i = 0; i < 400 && game.phase !== "matchOver"; i++) tap(game, {});
    // Then the match ends with player 1 as the winner
    expect(game.finish?.kind).toBe("snowman");
    expect(game.result?.winner).toBe(0);
    expect(game.result?.wins).toEqual([2, 0]);
  });

  it("decides a timeout by remaining health", () => {
    // Given player 1 ahead on health
    const game = newGame();
    runIntro(game);
    game.fighters[1].hp = 40;
    // When the clock runs out
    game.timer = 1;
    tap(game, {});
    // Then player 1 takes the round
    expect(game.phase).toBe("roundOver");
    expect(game.roundWinner).toBe(0);
  });

  it("keeps fighters inside the ring and on the ground", () => {
    // Given a fighter walking back for a long time
    const game = newGame();
    runIntro(game);
    // When it keeps walking left
    for (let i = 0; i < 400; i++) tap(game, { left: true });
    // Then it stops at the ropes
    expect(game.fighters[0].x).toBeGreaterThanOrEqual(46);
    expect(game.fighters[0].y).toBe(GROUND_Y);
  });
});

describe("cpu", () => {
  it("plays a whole match to the end without help", () => {
    // Given two CPU brains on every character pair
    const ids = ["blizz", "ziggy", "momo", "picotte"] as const;
    for (const a of ids) {
      for (const b of ids) {
        let seed = 7;
        const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
        const game = new Game({ p1: getCharacter(a), p2: getCharacter(b), mode: "cpu", difficulty: "hard", random });
        const brains = [new CpuBrain("hard", random), new CpuBrain("hard", random)];
        // When they fight
        for (let i = 0; i < 60 * 60 * 8 && game.phase !== "matchOver"; i++) {
          const [f1, f2] = game.fighters;
          game.step([brains[0].next(f1, f2, game), brains[1].next(f2, f1, game)]);
        }
        // Then the match finishes with a winner
        expect(game.phase, `${a} vs ${b}`).toBe("matchOver");
        expect(game.result).not.toBeNull();
      }
    }
  });
});
