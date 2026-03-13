# HANDOFF - Petanque Master
> Document de reprise pour nouvelle session Claude Code. Dernière MAJ : 13 mars 2026.

## ÉTAT ACTUEL DU PROJET

### Ce qui est FAIT et FONCTIONNEL ✅

**Sprint 0 (complet):**
- Vite 8 + Phaser 3.90.0 + phaser3-rex-plugins installés
- `vite.config.js` : `assetsInlineLimit: 0`, manualChunks phaser (fonction), `base: './'`
- `index.html` : CSS pixel art, letterboxing `#3A2E28`
- `src/main.js` + `src/config.js` : résolution 416x240, Arcade Physics, pixelArt: true
- `src/utils/Constants.js` : toutes les constantes du PLAN_MVP.md
- `public/data/` : boules.json, npcs.json, progression.json (schémas complets du plan)
- `.github/workflows/deploy.yml` : GitHub Actions → GitHub Pages
- `.gitignore`, git init, 2 commits sur branche master
- Git config : user=WDB, email=wdubois255@gmail.com

**Sprint 1 (moteur pétanque - fonctionnel, nécessite tuning):**
- `src/petanque/Ball.js` : physique custom, friction linéaire, collisions élastiques cercle-cercle, out of bounds = mort FIPJP
- `src/petanque/Cochonnet.js` : hérite Ball, masse 30g, petit rayon
- `src/petanque/PetanqueEngine.js` : state machine FIPJP complète (COCHONNET_THROW → FIRST_BALL → SECOND_TEAM_FIRST → PLAY_LOOP → WAITING_STOP → SCORE_MENE → MENE_DEAD → GAME_OVER), scoring correct, victoire à 13 pts
- `src/petanque/AimingSystem.js` : drag-and-release slingshot, flèche colorée (vert/jaune/rouge), dead zone 15px, annulation Escape
- `src/petanque/PetanqueAI.js` : 3 niveaux (EASY/MEDIUM/HARD), décision pointer vs tirer
- `src/ui/ScorePanel.js` : panneau score, boules restantes, numéro de mène
- `src/scenes/BootScene.js` : écran titre "Cliquer pour jouer" (unlock audio)
- `src/scenes/PetanqueScene.js` : terrain vertical 90x210px, cercle de lancer, assemble tout
- Indicateur BEST : halo vert (joueur gagne) ou rouge (IA gagne) sur la boule la plus proche

### Vérifié par Playwright (tests automatisés) ✅
- 0 erreurs JS
- Cochonnet lancé correctement (atterrit au milieu du terrain)
- Boules joueur et IA visibles, dans le terrain
- Scoring fonctionne (ex: "L'adversaire gagne 3 points !")
- Transition entre mènes (terrain nettoyé, nouvelle mène)
- Score panel mis à jour en temps réel
- State machine alterne joueur/IA correctement
- Playwright + test script dans `test-game.mjs` et `screenshots/`

## CE QU'IL RESTE À FAIRE / AMÉLIORER

### Tuning prioritaire (avant Sprint 2)
1. **Les boules du joueur tombent trop court** — le Playwright drag est limité, mais un humain peut faire mieux. À tester manuellement avec `npm run dev`.
2. **L'IA semble mieux viser que le joueur** (0-6 dans le test auto) — vérifier que la puissance du joueur est bien calibrée.
3. **Pas encore de message de victoire/défaite persistant** — le GAME_OVER affiche un texte mais pas d'écran dédié ni de bouton "Rejouer".
4. **Pas de son** — à ajouter plus tard (Sprint 4).

### Sprint 2 (monde ouvert) - PAS COMMENCÉ
Voir PLAN_MVP.md pour le détail complet. Résumé :
- Assets via PixelLab MCP (`/sprite`, `/tileset`)
- Map Tiled village départ (30x30 tiles)
- OverworldScene avec tilemap, camera follow, collision layers
- Classe Player (mouvement grid-based, animations)
- Classe NPC (détection, dialogue, patrol)
- DialogBox (typewriter, 9-slice panel)
- Transition exploration → combat pétanque

### Sprint 3 et 4 - PAS COMMENCÉS
Voir PLAN_MVP.md.

## COMMANDES

```bash
npm run dev          # Serveur dev → http://localhost:8080
npm run build        # Build production (vérifié, fonctionne)
npm run preview      # Preview du build
node test-game.mjs   # Test Playwright automatisé (screenshots/)
```

## FICHIERS CLÉS À LIRE EN PREMIER

1. `CLAUDE.md` — conventions, stack, règles
2. `PLAN_MVP.md` — plan complet 5 sprints avec schémas de données
3. `src/utils/Constants.js` — toutes les constantes de jeu
4. `src/petanque/PetanqueEngine.js` — le cœur du moteur (state machine)
5. `public/data/boules.json` — physique, terrains, sets de boules

## ARCHITECTURE ACTUELLE

```
src/
  main.js              → new Phaser.Game(config)
  config.js            → 416x240, Arcade, pixelArt, [BootScene, PetanqueScene]
  scenes/
    BootScene.js       → "Cliquer pour jouer" + charge boules.json
    PetanqueScene.js   → Terrain vertical, instancie Engine/Aiming/AI/Score
  petanque/
    Ball.js            → Physique custom (friction, collision élastique, bounds)
    Cochonnet.js       → Ball spécialisé (petit, léger)
    PetanqueEngine.js  → State machine FIPJP, scoring, mène morte
    AimingSystem.js    → Drag slingshot, flèche, power calc
    PetanqueAI.js      → 3 niveaux, pointer vs tirer
  ui/
    ScorePanel.js      → Score, boules restantes, mène
  utils/
    Constants.js       → Toutes les constantes
public/
  data/
    boules.json        → 3 sets + cochonnet + physics + 4 terrains
    npcs.json          → PNJ (3 maîtres, 3 dresseurs route 1)
    progression.json   → 4 badges, gates, partenaires
```

## PROMPT SUGGÉRÉ POUR NOUVELLE SESSION

```
Lis HANDOFF.md, CLAUDE.md et PLAN_MVP.md. Le Sprint 0 et Sprint 1 sont faits
(moteur pétanque jouable, testé par Playwright).

Lance `npm run dev` et fais un playtest avec Playwright (node test-game.mjs).
Corrige les problèmes que tu vois, puis enchaîne le Sprint 2 (monde ouvert).
```
