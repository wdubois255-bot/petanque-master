# CLAUDE.md - Petanque Master

Tu dois toujours challenger mes idées, questionner, essayer d'aller plus loin afin d'aider et d'avancer le projet.

## Sources de verite (NE JAMAIS DUPLIQUER ces valeurs ailleurs)

| Quoi | Fichier | Regle |
|------|---------|-------|
| Valeurs numeriques (physique, IA, gameplay) | `src/utils/Constants.js` | UNIQUE source. Si un autre fichier contredit, Constants.js gagne. |
| Personnages (stats, abilities, barks) | `public/data/characters.json` | Toujours lire avant de modifier un perso. |
| Terrains (friction, zones, pentes) | `public/data/terrains.json` | Toujours verifier la coherence avec Constants.js TERRAIN_FRICTION. |
| Boutique (prix, items) | `public/data/shop.json` | Monnaie = "Galets" (pas "Ecus"). |
| Sauvegarde (schema, defaults) | `src/utils/SaveManager.js` | Tout passe par SaveManager. Jamais de localStorage direct. |
| Game design (concept, flow) | `GAME_DESIGN.md` | Bible du design, ne pas contredire. |
| Etat du projet | `CAHIER_DES_CHARGES.md` | Ce qui est fait, ce qui reste. |
| Plan d'action | `docs/PLAN_100.md` | Plan unique : 5 axes, 32 taches pour 100/100. |

## Interdictions absolues

- PAS de Matter.js — physique custom dans Ball.js
- PAS de noir pur #000 — ombres #3A2E28 (leger) ou #1A1510 (profond)
- PAS de TypeScript
- PAS de valeurs hardcodees — tout dans Constants.js ou les JSON de public/data/
- PAS de `localStorage` direct — utiliser SaveManager.js
- PAS de `window.__variable` — utiliser `this.registry` Phaser
- PAS de `console.log` en production — supprimer avant commit
- Phaser reutilise les scenes : TOUJOURS definir `init()` avec reset de tous les flags

## Regles techniques

- Pixel art : `image-rendering: pixelated` + `imageSmoothingEnabled = false`
- Tiles : 32x32 partout
- Sprites persos : spritesheets 128x128 (4x4 frames de 32x32), generes 64x64 par PixelLab
- Resolution : 832x480, scale integer x2
- Vite : `assetsInlineLimit: 0` OBLIGATOIRE
- 60 FPS obligatoire
- Avant de modifier une constante physique, lire `research/04_petanque_physics.md`

## Stack

- Phaser 4.0.0-rc.6, JavaScript ES6+, Vite 6.3+
- Physique petanque custom (~380 lignes Ball.js, PAS de Matter.js)
- MCP : PixelLab (sprites/tilesets) + ElevenLabs (audio)
- Tests : Vitest (unit) + Playwright (E2E)
- Hebergement : GitHub Pages (CI/CD)

## Commandes

```bash
npm install       # Dependances
npm run dev       # Dev server (Vite HMR)
npm run build     # Build production
npm run preview   # Preview build
npx vitest run    # Tests unitaires
```

## Skills (slash commands)

| Skill | Usage |
|-------|-------|
| `/sprite [nom]` | Generer un sprite pixel art via PixelLab |
| `/tileset [nom] [biome]` | Generer un tileset via PixelLab |
| `/sfx [description]` | Generer un effet sonore via ElevenLabs |
| `/playtest` | Lancer le serveur de dev et ouvrir le navigateur |
| `/build-assets` | Optimiser tous les assets pour la production |
| `/pre-feature [nom]` | Planifier une feature avant de coder |
| `/post-feature` | Verifier apres implementation (tests, coherence, doc) |
| `/session-end` | Terminer proprement (commit, etat, priorites) |

## Structure du projet

```
/
  CLAUDE.md                # CE FICHIER — regles et conventions
  GAME_DESIGN.md           # Bible game design
  CAHIER_DES_CHARGES.md    # Etat complet du projet
  STORY.md                 # Histoire (reserve Phase D)
  /docs
    PLAN_100.md            # Plan unique : 5 axes pour 100/100
    /archive               # Documents historiques et plans termines
  /src
    main.js, config.js
    /scenes/               # 16 scenes (Boot, Title, CharSelect, QuickPlay, Arcade,
                           #   VSIntro, Petanque, Result, LevelUp, Shop, Tutorial,
                           #   Player, Intro, Overworld, SpriteTest, DevTest)
    /petanque/             # Ball, Cochonnet, PetanqueEngine, PetanqueAI,
                           #   AimingSystem, EngineRenderer, TerrainRenderer, ai/
    /ui/                   # ScorePanel, DialogBox, UIFactory
    /utils/                # Constants, SaveManager, SoundManager, PortraitGenerator
    /world/                # MapManager, NPCManager, SpriteGenerator
    /entities/             # Player, NPC
  /public
    /data/                 # characters.json, terrains.json, boules.json,
                           #   arcade.json, shop.json, progression.json
    /assets/               # sprites/, portraits/, audio/sfx/, audio/music/
  /research/               # 56 fichiers (index: research/00_synthese_etat_projet.md)
  /tests/                  # Vitest (unit) + Playwright (e2e)
  /scripts/                # Utilitaires generation assets
```

## Ambiance et style

- Provencale / sud de la France, humour
- Palette : ocres (#D4A574), terracotta (#C4854A), olive (#6B8E4E), lavande (#9B7BB8), ciel (#87CEEB), creme (#F5E6D0)
- Personnages caricaturaux et attachants, dialogues courts et droles
- Jamais de noir pur — ombres en marron chaud

## Regles petanque FIPJP

- 1v1 : 3 boules/joueur. L'equipe la plus loin rejoue.
- Score = boules plus proches que la meilleure adverse. Victoire a 13 pts.
- Cochonnet 6-10m du cercle. Boule hors terrain = morte.

## Workflow de dev

1. **Avant de coder** : lire le code existant, utiliser `/pre-feature` pour planifier
2. **Pendant** : tester dans le navigateur apres chaque changement (HMR)
3. **Apres** : utiliser `/post-feature` pour verifier (tests, coherence, doc)
4. **Fin de session** : utiliser `/session-end` pour cloturer proprement
5. Le moteur petanque est le coeur — le prioriser et le tester isolement
6. GAME_DESIGN.md est la bible — tout contenu doit s'y conformer
7. Chaque terrain doit etre jouable et teste independamment
