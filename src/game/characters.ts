// © 2026 Riadh MNASRI

import type { CharacterDef, CharacterId } from "./types";

export const CHARACTERS: CharacterDef[] = [
  {
    id: "blizz",
    name: "Blizz",
    title: { fr: "Le yéti farceur", en: "The prankster yeti" },
    bio: {
      fr: "Il ne vit que pour les batailles de boules de neige. Ses grosses moufles font BONK.",
      en: "He lives for snowball fights. His big mittens go BONK.",
    },
    specialName: { fr: "Boule de neige gelante", en: "Freezing snowball" },
    finishName: { fr: "Bonhomme de neige", en: "Snowman" },
    palette: { main: "#eef6fb", dark: "#2b5d7c", accent: "#e63946", belly: "#bfe3f2" },
    walkSpeed: 3.3,
    jumpPower: 15.5,
    power: 1.12,
    special: "snowball",
    finish: "snowman",
    stats: { speed: 2, power: 5, reach: 3 },
  },
  {
    id: "ziggy",
    name: "Ziggy",
    title: { fr: "Le robot à réaction", en: "The rocket robot" },
    bio: {
      fr: "Assemblé dans un garage avec des pièces de grille-pain. Son poing décolle comme une fusée.",
      en: "Built in a garage from toaster parts. His fist blasts off like a rocket.",
    },
    specialName: { fr: "Poing-fusée", en: "Rocket fist" },
    finishName: { fr: "Mise en orbite", en: "Orbit launch" },
    palette: { main: "#f4b942", dark: "#5a4632", accent: "#2ec4b6", belly: "#ffe08a" },
    walkSpeed: 3.8,
    jumpPower: 15.5,
    power: 1.0,
    special: "rocket",
    finish: "orbit",
    stats: { speed: 3, power: 4, reach: 3 },
  },
  {
    id: "momo",
    name: "Momo",
    title: { fr: "Le chat catcheur", en: "The wrestling cat" },
    bio: {
      fr: "Champion du quartier de catch masqué. Rapide, sauteur, et toujours retombé sur ses pattes.",
      en: "Masked wrestling champ of the block. Quick, bouncy, and always lands on his feet.",
    },
    specialName: { fr: "Bond du matou", en: "Tomcat pounce" },
    finishName: { fr: "Poulet surprise", en: "Surprise chicken" },
    palette: { main: "#ff8c42", dark: "#7a3a12", accent: "#d62839", belly: "#ffe3c7" },
    walkSpeed: 4.6,
    jumpPower: 17,
    power: 0.92,
    special: "pounce",
    finish: "chicken",
    stats: { speed: 5, power: 2, reach: 2 },
  },
  {
    id: "picotte",
    name: "Picotte",
    title: { fr: "La plante qui fouette", en: "The whipping cactus" },
    bio: {
      fr: "Elle a poussé dans un pot de fleurs au bord d'une fenêtre. Sa liane attrape tout ce qui passe.",
      en: "She sprouted in a flowerpot on a windowsill. Her vine grabs anything that walks by.",
    },
    specialName: { fr: "Coup de liane", en: "Vine whip" },
    finishName: { fr: "Rempotage", en: "Repotting" },
    palette: { main: "#6abf69", dark: "#2d6a2e", accent: "#ff6fa8", belly: "#c8e6a0" },
    walkSpeed: 3.6,
    jumpPower: 15,
    power: 1.0,
    special: "vine",
    finish: "flowerpot",
    stats: { speed: 3, power: 3, reach: 5 },
  },
];

export function getCharacter(id: CharacterId): CharacterDef {
  const def = CHARACTERS.find((c) => c.id === id);
  if (!def) throw new Error(`Unknown character ${id}`);
  return def;
}
