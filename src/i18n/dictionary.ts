// © 2026 Riadh MNASRI

import type { CanvasText } from "@/game/render";
import type { Lang } from "@/game/types";

export interface Dictionary {
  tagline: string;
  onePlayer: string;
  onePlayerHint: string;
  twoPlayers: string;
  twoPlayersHint: string;
  controls: string;
  back: string;
  difficulty: string;
  easy: string;
  normal: string;
  hard: string;
  chooseP1: string;
  chooseP2: string;
  chooseCpu: string;
  surprise: string;
  speed: string;
  power: string;
  reach: string;
  special: string;
  finish: string;
  ready: string;
  pickHint: string;
  pause: string;
  resume: string;
  restart: string;
  quit: string;
  winner: (name: string) => string;
  roundsWon: string;
  bestCombo: string;
  hits: string;
  rematch: string;
  changeFighters: string;
  menu: string;
  sound: string;
  fullscreen: string;
  player: (n: number) => string;
  move: string;
  jump: string;
  crouch: string;
  guard: string;
  guardHelp: string;
  punch: string;
  kick: string;
  specialMove: string;
  specialHelp: string;
  lowHelp: string;
  gamepad: string;
  gamepadHelp: string;
  touchHelp: string;
  finishHelp: string;
  soloHelp: string;
  arenaLabel: string;
  canvas: CanvasText;
}

const fr: Dictionary = {
  tagline: "Le jeu de bagarre rigolo, sans bobo",
  onePlayer: "1 joueur",
  onePlayerHint: "Contre l'ordinateur",
  twoPlayers: "2 joueurs",
  twoPlayersHint: "Même clavier ou manettes",
  controls: "Commandes",
  back: "Retour",
  difficulty: "Difficulté de l'ordinateur",
  easy: "Facile",
  normal: "Normal",
  hard: "Costaud",
  chooseP1: "Joueur 1, choisis ton combattant",
  chooseP2: "Joueur 2, choisis ton combattant",
  chooseCpu: "Choisis ton adversaire",
  surprise: "Surprise !",
  speed: "Vitesse",
  power: "Force",
  reach: "Portée",
  special: "Coup spécial",
  finish: "Finish rigolo",
  ready: "C'est parti !",
  pickHint: "Clique sur un combattant, ou flèches + Entrée",
  pause: "Pause",
  resume: "Reprendre",
  restart: "Recommencer",
  quit: "Quitter",
  winner: (name) => `${name} gagne !`,
  roundsWon: "Manches gagnées",
  bestCombo: "Meilleur combo",
  hits: "Coups réussis",
  rematch: "Revanche",
  changeFighters: "Changer de combattants",
  menu: "Menu",
  sound: "Son",
  fullscreen: "Plein écran",
  player: (n) => `Joueur ${n}`,
  move: "Avancer / reculer",
  jump: "Sauter",
  crouch: "S'accroupir",
  guard: "Se protéger",
  guardHelp: "Recule pendant que l'autre attaque : tu bloques le coup.",
  punch: "Coup de poing",
  kick: "Coup de pied",
  specialMove: "Coup spécial",
  specialHelp: "Touche Spécial, ou la manœuvre des pros : bas, avant + Poing.",
  lowHelp: "Accroupi + Pied : balayette qui fait tomber l'adversaire.",
  gamepad: "Manette",
  gamepadHelp: "Croix ou stick pour bouger, A Poing, B Pied, Y Spécial. La 1re manette branchée est le joueur 1.",
  touchHelp: "Sur tablette, des boutons apparaissent sous l'arène en mode 1 joueur.",
  finishHelp: "Quand tu gagnes le match, appuie sur une attaque pendant le « Finish rigolo » pour transformer ton adversaire !",
  soloHelp: "En mode 1 joueur, les deux jeux de touches marchent.",
  arenaLabel: "Arène de combat",
  canvas: {
    round: (n) => `MANCHE ${n}`,
    fight: "BAGARRE !",
    ko: "BONK-OUT !",
    time: "TEMPS !",
    draw: "ÉGALITÉ !",
    roundWin: (name) => `${name} gagne la manche`,
    finishPrompt: "FINISH RIGOLO !",
    finishHint: "Appuie sur une attaque !",
    finishDone: {
      snowman: "Pouf, en bonhomme de neige !",
      orbit: "Direction la Lune !",
      chicken: "Pouf, en poulet !",
      flowerpot: "Hop, dans le pot !",
    },
    combo: (n) => `${n} COUPS !`,
    cpu: "ordi",
  },
};

const en: Dictionary = {
  tagline: "The silly brawler where nobody gets hurt",
  onePlayer: "1 player",
  onePlayerHint: "Against the computer",
  twoPlayers: "2 players",
  twoPlayersHint: "Same keyboard or gamepads",
  controls: "Controls",
  back: "Back",
  difficulty: "Computer difficulty",
  easy: "Easy",
  normal: "Normal",
  hard: "Tough",
  chooseP1: "Player 1, pick your fighter",
  chooseP2: "Player 2, pick your fighter",
  chooseCpu: "Pick your opponent",
  surprise: "Surprise!",
  speed: "Speed",
  power: "Power",
  reach: "Reach",
  special: "Special move",
  finish: "Funny finish",
  ready: "Let's go!",
  pickHint: "Click a fighter, or arrows + Enter",
  pause: "Paused",
  resume: "Resume",
  restart: "Restart",
  quit: "Quit",
  winner: (name) => `${name} wins!`,
  roundsWon: "Rounds won",
  bestCombo: "Best combo",
  hits: "Hits landed",
  rematch: "Rematch",
  changeFighters: "Change fighters",
  menu: "Menu",
  sound: "Sound",
  fullscreen: "Fullscreen",
  player: (n) => `Player ${n}`,
  move: "Walk forward / back",
  jump: "Jump",
  crouch: "Crouch",
  guard: "Guard",
  guardHelp: "Walk back while the other one attacks: you block the hit.",
  punch: "Punch",
  kick: "Kick",
  specialMove: "Special move",
  specialHelp: "Special key, or the pro move: down, forward + Punch.",
  lowHelp: "Crouch + Kick: a sweep that trips your opponent.",
  gamepad: "Gamepad",
  gamepadHelp: "D-pad or stick to move, A Punch, B Kick, Y Special. The first gamepad plugged in is player 1.",
  touchHelp: "On a tablet, buttons show up under the arena in 1 player mode.",
  finishHelp: "When you win the match, press an attack during the \"Funny finish\" to transform your opponent!",
  soloHelp: "In 1 player mode, both key sets work.",
  arenaLabel: "Fighting arena",
  canvas: {
    round: (n) => `ROUND ${n}`,
    fight: "FIGHT!",
    ko: "BONK-OUT!",
    time: "TIME!",
    draw: "DRAW!",
    roundWin: (name) => `${name} wins the round`,
    finishPrompt: "FUNNY FINISH!",
    finishHint: "Press an attack!",
    finishDone: {
      snowman: "Poof, a snowman!",
      orbit: "Off to the Moon!",
      chicken: "Poof, a chicken!",
      flowerpot: "Hop, into the pot!",
    },
    combo: (n) => `${n} HITS!`,
    cpu: "CPU",
  },
};

export const DICTIONARIES: Record<Lang, Dictionary> = { fr, en };
