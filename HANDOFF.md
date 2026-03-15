# HANDOFF - Petanque Master
> Document de reprise pour nouvelle session Claude Code. Derniere MAJ : 15 mars 2026.

## ETAT ACTUEL DU PROJET

### Ce qui est FAIT et FONCTIONNEL

**Sprint 0 (complet):**
- Vite 8 + Phaser 3.90.0 + phaser3-rex-plugins installes
- `vite.config.js` : `assetsInlineLimit: 0`, manualChunks phaser, `base: './'`
- `index.html` : CSS pixel art, letterboxing `#3A2E28`
- `src/main.js` + `src/config.js` : resolution 832x480, Arcade Physics, pixelArt: true
- `src/utils/Constants.js` : toutes les constantes du PLAN_MVP.md
- `public/data/` : boules.json, npcs.json, progression.json
- `.github/workflows/deploy.yml` : GitHub Actions -> GitHub Pages
- Git sur GitHub : https://github.com/wdubois255-bot/petanque-master

**Sprint 1 (moteur petanque - fonctionnel):**
- `src/petanque/Ball.js` : physique custom, friction lineaire, collisions elastiques
- `src/petanque/Cochonnet.js` : herite Ball, masse 30g, petit rayon
- `src/petanque/PetanqueEngine.js` : state machine FIPJP complete, scoring correct, victoire a 13 pts
- `src/petanque/AimingSystem.js` : drag-and-release slingshot, fleche coloree, dead zone 30px
- `src/petanque/PetanqueAI.js` : 3 niveaux (EASY/MEDIUM/HARD), pointer vs tirer
- `src/ui/ScorePanel.js` : panneau score, boules restantes, numero de mene
- Indicateur BEST : halo pulsant vert/rouge
- Ecran Game Over : overlay sombre, score final, bouton Rejouer/Continuer

**Sprint 2 (monde ouvert - fonctionnel):**
- `src/world/TilesetGenerator.js` : 14 types de tiles generes en canvas 32x32
- `src/world/SpriteGenerator.js` : generation de spritesheets 32x32, 10+ palettes avec details signature
- `src/world/MapManager.js` : carte village_depart 30x30 tiles procedural
- `src/world/NPCManager.js` : gestion des PNJ par map
- `src/entities/Player.js` : mouvement grid-based, animations, input fleches + ZQSD
- `src/entities/NPC.js` : idle, line-of-sight, encounter, dialogue, battle trigger
- `src/ui/DialogBox.js` : typewriter effect
- `src/scenes/OverworldScene.js` : maps, NPC, joueur, camera, dialogue, transition combat

**Sprint 3 (contenu et progression - fonctionnel):**
- **SaveManager.js** : localStorage, 3 slots, auto-save
- **TitleScene.js** : ecran titre PETANQUE MASTER dore
- **IntroScene.js** : dialogue Papet, choix de 3 sets de boules
- **3 maps procedurales** : village_depart, route_1, village_arene_1
- **Transitions de maps** : fadeOut/fadeIn, exits bidirectionnels
- **Systeme de badges** : obtention apres victoire d'arene
- **Systeme de gates** : PNJ garde bloque passage sans badge
- **Maitre Marcel** : terrain terre, difficulte easy
- **Rival Bastien** : dialogue evolue
- **13 PNJ dans npcs.json** avec dialogues riches

**Sprint 3.5 (ameliorations gameplay - fonctionnel):**
- **Controle du loft** : choix ROULETTE / DEMI-PORTEE / PLOMBEE avant chaque lancer pointer
- **Prediction de trajectoire** : ligne pointillee pendant le drag
- **Detection carreau** : hitstop + texte "CARREAU !" + particules + camera shake
- **Indicateur de point dynamique** : halo pulsant en temps reel
- **Score projete** : "+N" affiche en temps reel dans le ScorePanel
- **Distances boule-cochonnet** : labels en metres
- **Personnalites IA** : Marcel=pointeur, Fanny=tireuse, Ricardo=stratege, Marius=complet
- **computeThrowParams()** : methode statique extraite pour prediction + IA
- **Ball.simulateTrajectory()** : simulation physique pour prediction

**Migration 32x32 (FAIT - 15 mars 2026):**
- **Resolution** : 832x480 (26x15 tiles, meme champ de vision, 4x plus de detail)
- **TILE_SIZE** : 32 (etait 16)
- **Constants.js** : toutes les valeurs pixel doublees (terrain, boules, cercle, dead zone, etc.)
- **SpriteGenerator.js** : sprites 32x32 via technique px()/rect() qui scalent x2
- **TilesetGenerator.js** : tiles 32x32 via meme technique de scaling x2
- **Player.js / NPC.js** : offsets ajustes, origin(0.5, 0.5) centre dans le tile
- **UI** : toutes les fonts x2, positions x2 (ScorePanel, DialogBox, AimingSystem)
- **Scenes** : TitleScene, IntroScene, BootScene, PetanqueScene, OverworldScene ajustes
- **PetanqueEngine.js** : fonts x2, margins x2, positions x2, particules x2
- **Skills** `/sprite` et `/tileset` : mis a jour pour generer en 64x64 -> downscale 32x32
- **Tests Playwright** : TOUS PASSENT apres migration

### Tests Playwright (TOUS PASSENT)
- `test-sprint3.mjs` : TitleScene -> IntroScene -> choix boules -> OverworldScene -> Route 1 -> sauvegarde **PASS**
- `test-game.mjs` : petanque engine (menes, scoring, IA, lancers) **0 erreurs**

## PROCHAINES ETAPES

### 1. Vrais sprites PixelLab (PRIORITE)
Les sprites canvas 32x32 sont temporaires. Remplacer par de vrais sprites PixelLab :
1. `generate-image-pixflux` 64x64 face sud
2. `/rotate` -> est, ouest, nord
3. `/animate-with-text` "walking" -> 4 frames par direction
4. `sharp` downscale 2x nearest-neighbor -> 32x32
5. Assembler spritesheet 128x128 (4 frames x 4 directions)
6. Charger via Phaser loader (plus de canvas)

**Personnages a generer :** joueur, Papet, Marcel, Bastien, Fanny, Ricardo, Marius, dresseurs, villageois

### 2. Contenu et Audio
- Route 2 + Village Arene 2 : Maitre Fanny (terrain herbe, tireuse agressive)
- Route 3 + Village Arene 3 : Maitre Ricardo (terrain sable, stratege)
- SFX ElevenLabs : impacts boule-boule, boule-cochonnet, atterrissage, carreau
- Musique chiptune : monde ouvert, combat, victoire

### API PixelLab - Workflow sprites
```
POST https://api.pixellab.ai/v1/generate-image-pixflux
Headers: Authorization: Bearer <PIXELLAB_API_KEY>
Body: { description, image_size: {width, height}, no_background, view, direction, outline, shading, detail }
Response: { image: { base64: "data:..." }, usage: { usd: N } }

POST https://api.pixellab.ai/v1/rotate
Body: { image_size, from_image, from_direction, to_direction, from_view, to_view }

POST https://api.pixellab.ai/v1/animate-with-text
Body: { image_size, description, action, reference_image, n_frames, direction }
```

### Cles API
- `.env` : PIXELLAB_API_KEY + ELEVENLABS_API_KEY (dans .gitignore)
- PixelLab balance : $10.00
- ElevenLabs : compte creator actif
- MCP PixelLab configure dans `.mcp.json`

## COMMANDES

```bash
npm install          # Installer les dependances
npm run dev          # Serveur dev -> http://localhost:8080
npm run build        # Build production
node tests/test-sprint3.mjs    # Test Sprint 3 (PASS)
node tests/test-game.mjs       # Test petanque engine (0 erreurs)
node scripts/generate-sprite.mjs <name> <desc> <dir> <w> <h>  # Generer sprite PixelLab
```

## FICHIERS CLES

1. `CLAUDE.md` - conventions, stack, regles
2. `PLAN_MVP.md` - plan complet (Sprints 0-4 + 3.5 + migration 32x32)
3. `LORE_PETANQUE.md` - histoire petanque + mapping personnages
4. `research/16_migration_32x32.md` - analyse complete migration
5. `src/utils/Constants.js` - EPICENTRE (832x480, tiles 32, tout double)
6. `src/world/SpriteGenerator.js` - sprites 32x32 canvas (temporaire, sera PixelLab)
7. `src/world/TilesetGenerator.js` - tiles 32x32 canvas (temporaire)
8. `src/scenes/PetanqueScene.js` - combat avec animations de lancer
9. `src/petanque/PetanqueEngine.js` - moteur regles + carreau + loft + onThrow
10. `scripts/generate-sprite.mjs` - script generation sprites PixelLab
11. `.env` - cles API (gitignored)
12. `.mcp.json` - MCP servers (PixelLab + ElevenLabs)
13. `.claude/skills/` - 5 custom skills (/sprite, /tileset, /sfx, /playtest, /build-assets)

## ARCHITECTURE

```
src/
  main.js              -> new Phaser.Game(config)
  config.js            -> 832x480, Arcade, scenes
  scenes/
    BootScene.js       -> Preload JSON
    TitleScene.js      -> Menu dore (fonts 48/24/20px)
    IntroScene.js      -> Dialogue Papet + choix boules (cards 230x210)
    OverworldScene.js  -> Monde ouvert, maps, NPC, dialogue, transitions, auto-save
    PetanqueScene.js   -> Combat petanque avec sprites animees, 4 terrains, carreau
  entities/
    Player.js          -> Mouvement grille 32x32, animation, origin(0.5,0.5)
    NPC.js             -> Idle, line-of-sight, encounter, dialogue, origin(0.5,0.5)
  petanque/
    Ball.js            -> Physique custom + simulateTrajectory(), radius 10px
    Cochonnet.js       -> Ball specialise, radius 4px
    PetanqueEngine.js  -> State machine FIPJP, scoring, carreau, loft, onThrow
    AimingSystem.js    -> Drag slingshot, POINTER/TIRER, loft, prediction trajectoire
    PetanqueAI.js      -> 3 niveaux + personnalites (pointeur/tireur/stratege/complet)
  world/
    TilesetGenerator.js -> 14 tiles 32x32 (scaled x2 from 16x16 design)
    SpriteGenerator.js  -> 10+ palettes, sprites 32x32 (scaled x2)
    MapManager.js       -> 3 maps procedurales + exits
    NPCManager.js       -> Gestion PNJ par map
  ui/
    DialogBox.js       -> Typewriter, font 20px, box 116px
    ScorePanel.js      -> Score + score projete + distances + boules graphiques
  utils/
    Constants.js       -> TOUTES LES VALEURS DOUBLEES (migration complete)
    SaveManager.js     -> localStorage, 3 slots
```
