// © 2026 Riadh MNASRI

import type { GameEvent } from "./engine";

type Wave = OscillatorType;

/** Tiny synthesized sound kit: no audio files to load. */
export class Sfx {
  private ctx: AudioContext | null = null;
  private muted = false;

  setMuted(muted: boolean): void {
    this.muted = muted;
  }

  private audio(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      this.ctx = new Ctor();
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  /** Must be called from a user gesture once, so browsers allow sound. */
  unlock(): void {
    this.audio();
  }

  play(event: GameEvent | "select" | "confirm"): void {
    if (this.muted) return;
    const c = this.audio();
    if (!c) return;
    switch (event) {
      case "hit":
        this.noise(c, 0.09, 1200, 0.35);
        this.tone(c, 180, 80, 0.1, "square", 0.12);
        break;
      case "bigHit":
        this.noise(c, 0.16, 700, 0.5);
        this.tone(c, 130, 50, 0.18, "square", 0.18);
        break;
      case "block":
        this.tone(c, 1100, 700, 0.06, "triangle", 0.15);
        break;
      case "whoosh":
        this.noise(c, 0.07, 3000, 0.07);
        break;
      case "special":
        [523, 659, 784].forEach((f, i) => this.tone(c, f, f * 1.02, 0.07, "square", 0.07, i * 0.05));
        break;
      case "rocket":
        this.noise(c, 0.35, 500, 0.25);
        this.tone(c, 200, 900, 0.3, "sawtooth", 0.06);
        break;
      case "freeze":
        [1568, 2093, 2637].forEach((f, i) => this.tone(c, f, f, 0.08, "sine", 0.1, i * 0.04));
        break;
      case "ko":
        this.tone(c, 500, 60, 0.7, "sawtooth", 0.15);
        this.noise(c, 0.3, 400, 0.4);
        break;
      case "round":
        this.tone(c, 523, 523, 0.18, "square", 0.1);
        break;
      case "fight":
        this.tone(c, 659, 659, 0.12, "square", 0.12);
        this.tone(c, 988, 988, 0.25, "square", 0.12, 0.12);
        break;
      case "thud":
        this.tone(c, 110, 40, 0.18, "sine", 0.4);
        break;
      case "jump":
        this.tone(c, 280, 560, 0.09, "sine", 0.08);
        break;
      case "poof":
        this.noise(c, 0.4, 900, 0.35);
        break;
      case "grow":
        this.tone(c, 300, 900, 0.5, "sine", 0.12);
        break;
      case "cluck":
        this.tone(c, 900, 600, 0.06, "square", 0.08);
        this.tone(c, 1000, 650, 0.08, "square", 0.08, 0.1);
        break;
      case "win":
        [523, 659, 784, 1047].forEach((f, i) => this.tone(c, f, f, 0.14, "square", 0.08, i * 0.11));
        break;
      case "select":
        this.tone(c, 660, 660, 0.05, "square", 0.06);
        break;
      case "confirm":
        this.tone(c, 784, 1175, 0.1, "square", 0.08);
        break;
    }
  }

  private tone(c: AudioContext, from: number, to: number, dur: number, type: Wave, vol: number, delay = 0): void {
    const t0 = c.currentTime + delay;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), t0 + dur);
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  private noise(c: AudioContext, dur: number, freq: number, vol: number): void {
    const len = Math.floor(c.sampleRate * dur);
    const buffer = c.createBuffer(1, len, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource();
    src.buffer = buffer;
    const filter = c.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = freq;
    const gain = c.createGain();
    gain.gain.value = vol;
    src.connect(filter).connect(gain).connect(c.destination);
    src.start();
  }
}
