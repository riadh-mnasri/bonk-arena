# Bonk Arena

🇫🇷 Français | [🇬🇧 English](README.en.md)

Jeu de combat 2D cartoon pour enfants, jouable dans le navigateur. Quatre combattants rigolos s'affrontent sur un ring de parc. Personne ne se fait mal : les coups font « BONK ! » et le perdant finit transformé en poulet, en bonhomme de neige ou en pot de fleurs.

## Fonctionnalités

- **4 combattants originaux**, chacun avec son style et son coup spécial :
  - **Blizz**, le yéti farceur : boule de neige qui gèle l'adversaire
  - **Ziggy**, le robot à réaction : poing-fusée qui traverse le ring
  - **Momo**, le chat catcheur : bond du matou qui fait tomber
  - **Picotte**, la plante qui fouette : liane longue portée qui attire l'adversaire
- **Mécaniques de jeu de combat** : coups de poing et de pied, attaques accroupies et sautées, balayette, garde en reculant, combos, manœuvre « bas, avant + Poing » pour le coup spécial
- **Matchs en 2 manches gagnantes**, chrono de 60 secondes, et un **finish rigolo** à déclencher en fin de match
- **1 joueur contre l'ordinateur** (Facile, Normal, Costaud) ou **2 joueurs** sur le même clavier
- **Manettes** (API Gamepad) et **boutons tactiles** sur tablette
- Touches affichées selon le clavier réel (AZERTY ou QWERTY)
- Sons synthétisés en direct (aucun fichier audio), coupables
- Interface en **français et en anglais**, réglages gardés dans le navigateur
- Mode démo ordinateur contre ordinateur sur l'écran titre

## Commandes

| Action | Joueur 1 | Joueur 2 |
|---|---|---|
| Avancer / reculer | Q / D | ← / → |
| Sauter | Z | ↑ |
| S'accroupir | S | ↓ |
| Poing | F | K |
| Pied | G | L |
| Spécial | H | M |
| Pause | Échap ou P | |

Les lettres correspondent à un clavier AZERTY (sur QWERTY : W A S D et `;`). En mode 1 joueur, les deux jeux de touches marchent.

## Stack

- [Next.js](https://nextjs.org) 16 (App Router), React 19, TypeScript
- Tailwind CSS 4
- Canvas 2D pour le rendu, Web Audio pour les sons
- Vitest pour les tests du moteur

## Architecture

```
src/
├── game/          moteur indépendant de React
│   ├── engine.ts        boucle à pas fixe (60 Hz), physique, coups, manches, finish
│   ├── attacks.ts       données des coups (démarrage, frames actives, récupération)
│   ├── characters.ts    les 4 combattants
│   ├── ai.ts            adversaire ordinateur (produit des entrées comme un joueur)
│   ├── input.ts         clavier, manette, détection de la manœuvre spéciale
│   ├── draw-fighter.ts  dessin vectoriel des personnages par poses
│   ├── render.ts        ring, interface, effets, animations de finish
│   └── sound.ts         sons synthétisés
├── components/    écrans React (titre, sélection, combat, résultats, commandes)
├── i18n/          textes FR / EN
└── lib/           réglages persistés, canvas, libellés de touches
```

## Développement local

```bash
npm install
npm run dev      # http://localhost:3620
```

Aucune variable d'environnement n'est nécessaire.

## Tests

```bash
npm test         # tests du moteur (Vitest)
npm run typecheck
npm run lint
```

Les tests couvrent les entrées, les coups, la garde, le gel, la fin de manche (KO et temps écoulé), le finish et des matchs complets ordinateur contre ordinateur pour chaque paire de combattants.

## Déploiement

Déployable tel quel sur [Vercel](https://vercel.com) : aucune base de données ni variable d'environnement.

---

© 2026 Riadh MNASRI
