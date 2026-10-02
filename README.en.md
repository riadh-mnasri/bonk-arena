# Bonk Arena

[🇫🇷 Français](README.md) | 🇬🇧 English

A cartoon 2D fighting game for kids, playable in the browser. Four silly fighters face off in a park wrestling ring. Nobody gets hurt: hits go "BONK!" and the loser ends up turned into a chicken, a snowman or a flowerpot.

## Features

- **4 original fighters**, each with their own style and special move:
  - **Blizz**, the prankster yeti: a freezing snowball
  - **Ziggy**, the rocket robot: a rocket fist that dashes across the ring
  - **Momo**, the wrestling cat: a tomcat pounce that knocks down
  - **Picotte**, the whipping cactus: a long-reach vine that pulls the opponent in
- **Fighting game mechanics**: punches and kicks, crouching and jumping attacks, sweep, guard by walking back, combos, "down, forward + Punch" motion for the special move
- **Best of 3 rounds**, 60 second timer, and a **funny finish** to trigger at the end of the match
- **1 player against the computer** (Easy, Normal, Tough) or **2 players** on the same keyboard
- **Gamepads** (Gamepad API) and **touch buttons** on tablets
- Key labels follow the actual keyboard layout (AZERTY or QWERTY)
- Sounds synthesized on the fly (no audio files), can be muted
- UI in **French and English**, settings kept in the browser
- Computer versus computer demo running on the title screen

## Controls

| Action | Player 1 | Player 2 |
|---|---|---|
| Walk forward / back | A / D | ← / → |
| Jump | W | ↑ |
| Crouch | S | ↓ |
| Punch | F | K |
| Kick | G | L |
| Special | H | ; |
| Pause | Esc or P | |

Letters are for a QWERTY keyboard (on AZERTY: Z Q S D and M). In 1 player mode, both key sets work.

## Stack

- [Next.js](https://nextjs.org) 16 (App Router), React 19, TypeScript
- Tailwind CSS 4
- Canvas 2D rendering, Web Audio sounds
- Vitest for engine tests

## Architecture

```
src/
├── game/          React-free engine
│   ├── engine.ts        fixed-step loop (60 Hz), physics, hits, rounds, finish
│   ├── attacks.ts       move data (startup, active frames, recovery)
│   ├── characters.ts    the 4 fighters
│   ├── ai.ts            computer opponent (produces inputs like a player)
│   ├── input.ts         keyboard, gamepad, special motion detection
│   ├── draw-fighter.ts  pose-based vector drawing of the characters
│   ├── render.ts        ring, HUD, effects, finish animations
│   └── sound.ts         synthesized sounds
├── components/    React screens (title, select, fight, results, controls)
├── i18n/          FR / EN strings
└── lib/           persisted settings, canvas helpers, key labels
```

## Local development

```bash
npm install
npm run dev      # http://localhost:3620
```

No environment variables needed.

## Tests

```bash
npm test         # engine tests (Vitest)
npm run typecheck
npm run lint
```

Tests cover inputs, hits, guarding, freezing, round end (KO and timeout), the finish and full computer versus computer matches for every fighter pair.

## Deployment

Deploys as is on [Vercel](https://vercel.com): no database, no environment variables.

---

© 2026 Riadh MNASRI
