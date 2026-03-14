# HANDOFF - Petanque Master
> Document de reprise pour nouvelle session Claude Code. Derniere MAJ : 15 mars 2026.

## PROMPT PROCHAINE SESSION

Copie ce bloc pour demarrer la prochaine conversation :

```
Lis HANDOFF.md, PLAN_MVP.md (section Sprint 3.5 + "MIGRATION 32x32") et research/16_migration_32x32.md. Les Sprints 0-3 + Sprint 3.5 gameplay sont faits. Le jeu tourne : `npm run dev`. Tests : `node test-sprint3.mjs`, `node test-game.mjs`.

Parle en francais.

PRIORITE ABSOLUE - Migration 32x32 :
Le jeu passe de 16x16 tiles (416x240) a 32x32 tiles (832x480) pour supporter de vrais sprites PixelLab.
Le fichier research/16_migration_32x32.md contient l'analyse complete des fichiers a modifier.

ETAPES :
1. Modifier Constants.js : tout x2 (resolution, terrain, boules, cercle, etc.)
2. Adapter SpriteGenerator.js : SPRITE_W=32, SPRITE_H=32, ajuster tout le dessin (temporaire, sera remplace par PixelLab)
3. Adapter TilesetGenerator.js : tiles 32x32
4. Ajuster Player.js et NPC.js : offsets sprite
5. Ajuster UI : ScorePanel, DialogBox, AimingSystem, TitleScene, IntroScene (font sizes x2, positions)
6. Tester chaque scene (Playwright)

ENSUITE - Vrais sprites PixelLab :
7. Generer sprites 64x64 via API PixelLab (curl), downscale 2x -> 32x32 nearest-neighbor
8. Utiliser /rotate pour les 4 directions
9. Utiliser /animate-with-text pour les frames de marche
10. Assembler en spritesheets PNG, charger via Phaser loader (plus de canvas)
11. Personnages : joueur, Papet, Marcel, Bastien, Fanny, Ricardo, Marius, dresseurs, villageois

ENSUITE - Contenu et Audio :
12. Route 2 + Village Arene 2 : Maitre Fanny (terrain herbe, tireuse agressive)
13. Route 3 + Village Arene 3 : Maitre Ricardo (terrain sable, stratege)
14. SFX ElevenLabs : impacts boule-boule, boule-cochonnet, atterrissage, carreau
15. Musique chiptune : monde ouvert, combat, victoire

Cles API dans .env (PIXELLAB_API_KEY et ELEVENLABS_API_KEY). PixelLab : $10 credits.
Endpoint PixelLab : POST https://api.pixellab.ai/v1/generate-image-pixflux (base64 response).
Script utilitaire : node scripts/generate-sprite.mjs <name> <description> <direction> <width> <height>

Lance `npm run dev`, fais un playtest Playwright avant et apres tes changements. Commite et push a la fin.
```

## ETAT ACTUEL DU PROJET

### Ce qui est FAIT et FONCTIONNEL

**Sprint 0 (complet):**
- Vite 8 + Phaser 3.90.0 + phaser3-rex-plugins installes
- `vite.config.js` : `assetsInlineLimit: 0`, manualChunks phaser, `base: './'`
- `index.html` : CSS pixel art, letterboxing `#3A2E28`
- `src/main.js` + `src/config.js` : resolution 416x240, Arcade Physics, pixelArt: true
- `src/utils/Constants.js` : toutes les constantes du PLAN_MVP.md
- `public/data/` : boules.json, npcs.json, progression.json
- `.github/workflows/deploy.yml` : GitHub Actions -> GitHub Pages
- Git sur GitHub : https://github.com/wdubois255-bot/petanque-master

**Sprint 1 (moteur petanque - fonctionnel):**
- `src/petanque/Ball.js` : physique custom, friction lineaire, collisions elastiques
- `src/petanque/Cochonnet.js` : herite Ball, masse 30g, petit rayon
- `src/petanque/PetanqueEngine.js` : state machine FIPJP complete, scoring correct, victoire a 13 pts
- `src/petanque/AimingSystem.js` : drag-and-release slingshot, fleche coloree, dead zone 15px
- `src/petanque/PetanqueAI.js` : 3 niveaux (EASY/MEDIUM/HARD), pointer vs tirer
- `src/ui/ScorePanel.js` : panneau score, boules restantes, numero de mene
- Indicateur BEST : halo pulsant vert/rouge
- Ecran Game Over : overlay sombre, score final, bouton Rejouer/Continuer

**Sprint 2 (monde ouvert - fonctionnel):**
- `src/world/TilesetGenerator.js` : 14 types de tiles generes en canvas
- `src/world/SpriteGenerator.js` : generation de spritesheets 16x24, 10+ palettes avec details signature
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

**Polish sprites (fait - 15 mars 2026):**
- **SpriteGenerator reecrit** : 5 styles cheveux (default, wild, spiky, bald_top), 3 styles chapeaux (beret, casquette, bandana)
- **Accessoires signature** : chaine en or (Marcel/Marius), lunettes soleil (Ricardo), moustache, barbe
- **Sourcils + expressions** : smirk (Bastien), stern (Marcel), yeux colores
- **Mariniere** : rayures bleues sur dresseur_2
- **Palettes inspirees vrais champions** : Marcel=Foyot, Bastien=Rocher, Papet=Lacroix, Marius=Quintais+Fazzino
- **Animations combat** : personnages se deplacent vers/depuis le cercle, animation de lancer (wind-up/release/recovery)
- **onThrow callback** ajoute dans PetanqueEngine pour synchroniser animations

### Tests Playwright (TOUS PASSENT)
- `test-sprint3.mjs` : TitleScene -> IntroScene -> choix boules -> OverworldScene -> Route 1 -> sauvegarde **PASS**
- `test-game.mjs` : petanque engine (menes, scoring, IA, lancers) **0 erreurs**

## DECISION : PASSAGE 32x32

### Pourquoi
Les sprites 16x24 sont trop petits pour etre expressifs. PixelLab genere minimum 32x32.
La resolution 832x480 garde le meme champ de vision (26x15 tiles) avec 4x plus de detail.

### Plan de migration (voir research/16_migration_32x32.md)
1. **Constants.js** : doubler toutes les valeurs pixel (resolution, terrain, boules)
2. **SpriteGenerator.js** : passer en 32x32, ajuster tous les dessins
3. **TilesetGenerator.js** : passer en 32x32
4. **Player.js / NPC.js** : ajuster offsets
5. **UI** (ScorePanel, DialogBox, AimingSystem, TitleScene, IntroScene) : font sizes x2, positions
6. **Sprites PixelLab** : generer via API, assembler en spritesheets PNG

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

Workflow par personnage :
1. generate-image-pixflux 64x64 face sud
2. /rotate -> est, ouest, nord
3. /animate-with-text "walking" -> 4 frames par direction
4. sharp downscale 2x nearest-neighbor -> 32x32
5. Assembler spritesheet 128x128 (4 frames x 4 directions)

### Cles API
- `.env` : PIXELLAB_API_KEY + ELEVENLABS_API_KEY (dans .gitignore)
- PixelLab balance : $10.00
- ElevenLabs : compte creator actif

## COMMANDES

```bash
npm install          # Installer les dependances
npm run dev          # Serveur dev -> http://localhost:8080
npm run build        # Build production
node test-sprint3.mjs    # Test Sprint 3 (PASS)
node test-game.mjs       # Test petanque engine (0 erreurs)
node scripts/generate-sprite.mjs <name> <desc> <dir> <w> <h>  # Generer sprite PixelLab
```

## FICHIERS CLES

1. `CLAUDE.md` - conventions, stack, regles
2. `PLAN_MVP.md` - plan complet (Sprints 0-4 + 3.5 + migration 32x32)
3. `LORE_PETANQUE.md` - histoire petanque + mapping personnages
4. `research/16_migration_32x32.md` - analyse complete migration
5. `src/utils/Constants.js` - EPICENTRE de la migration (tout doubler)
6. `src/world/SpriteGenerator.js` - sprites 16x24 avec palettes detaillees (a migrer en 32x32)
7. `src/world/TilesetGenerator.js` - tiles 16x16 (a migrer en 32x32)
8. `src/scenes/PetanqueScene.js` - combat avec animations de lancer
9. `src/petanque/PetanqueEngine.js` - moteur regles + carreau + loft + onThrow
10. `scripts/generate-sprite.mjs` - script generation sprites PixelLab
11. `.env` - cles API (gitignored)

## ARCHITECTURE

```
src/
  main.js              -> new Phaser.Game(config)
  config.js            -> 416x240 (-> 832x480), Arcade, scenes
  scenes/
    BootScene.js       -> Preload JSON
    TitleScene.js      -> Menu dore
    IntroScene.js      -> Dialogue Papet + choix boules
    OverworldScene.js  -> Monde ouvert, maps, NPC, dialogue, transitions, auto-save
    PetanqueScene.js   -> Combat petanque avec sprites animees, 4 terrains, carreau
  entities/
    Player.js          -> Mouvement grille, animation
    NPC.js             -> Idle, line-of-sight, encounter, dialogue
  petanque/
    Ball.js            -> Physique custom + simulateTrajectory()
    Cochonnet.js       -> Ball specialise
    PetanqueEngine.js  -> State machine FIPJP, scoring, carreau, loft, onThrow
    AimingSystem.js    -> Drag slingshot, POINTER/TIRER, loft, prediction trajectoire
    PetanqueAI.js      -> 3 niveaux + personnalites (pointeur/tireur/stratege/complet)
  world/
    TilesetGenerator.js -> 14 tiles (A MIGRER 32x32)
    SpriteGenerator.js  -> 10+ palettes detaillees (A MIGRER 32x32)
    MapManager.js       -> 3 maps procedurales + exits
    NPCManager.js       -> Gestion PNJ par map
  ui/
    DialogBox.js       -> Typewriter
    ScorePanel.js      -> Score + score projete + distances + boules graphiques
  utils/
    Constants.js       -> EPICENTRE MIGRATION (tout doubler)
    SaveManager.js     -> localStorage, 3 slots
```

## PERSONNAGES ET LORE

| Personnage | Inspire de | Look distinctif (sprite) |
|-----------|-----------|--------------------------|
| Joueur | - | Polo bleu, pantalon khaki, cheveux bruns |
| Le Papet | Lacroix (GOAT pointeur) | Beret bleu rond, moustache grise, cheveux clairsemes |
| Marcel | Foyot (showman) | Cheveux blancs en bataille, casquette, CHAINE EN OR, polo rouge |
| Bastien | Rocher (prodige) | Cheveux blonds spiky, yeux bleus, smirk arrogant, tenue sombre |
| Fanny | Legende de Fanny | Cheveux auburn, tenue verte, chapeau |
| Ricardo | Suchaud (international) | Lunettes de soleil, peau bronzee, chemise lin blanc |
| Grand Marius | Quintais + Fazzino | Barbe blanche, chaine en or, cheveux en bataille, tenue royale sombre |
