// © 2026 Riadh MNASRI

export type Lang = "fr" | "en";
export type Localized = Record<Lang, string>;

export type CharacterId = "blizz" | "ziggy" | "momo" | "picotte";
export type SpecialKind = "snowball" | "rocket" | "pounce" | "vine";
export type FinishKind = "snowman" | "orbit" | "chicken" | "flowerpot";

export type Difficulty = "easy" | "normal" | "hard";
export type GameMode = "cpu" | "versus";

export interface Palette {
  main: string;
  dark: string;
  accent: string;
  belly: string;
}

export interface CharacterDef {
  id: CharacterId;
  name: string;
  title: Localized;
  bio: Localized;
  specialName: Localized;
  finishName: Localized;
  palette: Palette;
  walkSpeed: number;
  jumpPower: number;
  power: number;
  special: SpecialKind;
  finish: FinishKind;
  stats: { speed: number; power: number; reach: number };
}

export interface InputFrame {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  punch: boolean;
  kick: boolean;
  special: boolean;
}

export const EMPTY_INPUT: InputFrame = {
  left: false,
  right: false,
  up: false,
  down: false,
  punch: false,
  kick: false,
  special: false,
};

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}
