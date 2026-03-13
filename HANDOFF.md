# HANDOFF - Petanque Master
> Document de reprise pour nouvelle session Claude Code. Derniere MAJ : 13 mars 2026.

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
- Indicateur BEST : halo vert (joueur gagne) ou rouge (IA gagne)
- Ecran Game Over : overlay sombre, score final, bouton Rejouer/Continuer
- Physique roulement corrigee : formule v0 = sqrt(2 * friction * distance)

**Sprint 2 (monde ouvert - fonctionnel):**
- `src/world/TilesetGenerator.js` : 14 types de tiles generes en canvas (herbe, chemin, murs, eau, maisons, arbres, fleurs, clotures, terrain petanque)
- `src/world/SpriteGenerator.js` : generation de spritesheets 16x24 pour personnages (6 palettes: joueur, maitre, marcel, villageois, dresseur)
- `src/world/MapManager.js` : carte village_depart 30x30 tiles procedural (maisons, chemins croises, terrain petanque cloture, arbres, eau, fleurs)
- `src/world/NPCManager.js` : gestion des PNJ par map, collision, lookup
- `src/entities/Player.js` : mouvement grid-based avec tween 200ms, animations 4 directions x 4 frames, input fleches + ZQSD, collision map + NPC
- `src/entities/NPC.js` : idle (changement direction), line-of-sight (trainers), encounter ("!" + marche vers joueur), dialogue, battle trigger
- `src/ui/DialogBox.js` : typewriter effect, avancer Espace/Entree/clic, skip rapide, fleche clignotante
- `src/scenes/OverworldScene.js` : charge map + NPC + joueur, camera follow, dialogue, transition vers combat
- Transition exploration <-> combat petanque : flash + fadeOut, sleep/wake OverworldScene, retour avec resultat
- 5 PNJ dans village_depart : Le Vieux Maitre (mentor), Monique (villageoise), Fernand (villageois), Thierry (dresseur, declenche combat)
- `src/scenes/BootScene.js` : ecran titre avec texte clignotant, charge JSON data

### Verifie par Playwright (tests automatises)
- 0 erreurs JS
- OverworldScene se charge et s'affiche correctement
- Joueur se deplace sur la carte
- PNJ visibles et bien places
- Tilemap procedural s'affiche (herbe, chemins, terrain, arbres, maisons)
- Camera suit le joueur
- Tests dans `test-game.mjs` (petanque) et `test-overworld.mjs` (monde ouvert)

## CE QU'IL RESTE A FAIRE

### Tuning
1. **Dialogue non teste en auto** - le Playwright ne positionne pas le joueur assez pres du maitre. Tester manuellement.
2. **Transition combat** - non testee automatiquement. Tester manuellement en allant devant Thierry.
3. **Pas de son** - a ajouter Sprint 4.

### Sprint 3 (contenu et progression) - PAS COMMENCE
Voir PLAN_MVP.md pour le detail complet. Resume :
- Sauvegarde localStorage (SaveManager.js)
- Ecran titre complet (Nouvelle Partie / Continuer)
- Intro + choix des boules
- 6 maps supplementaires (routes + villages arenes)
- Systeme badges + gates
- Doublettes (2v2)
- 10+ dresseurs avec dialogues uniques

### Sprint 4 (polish) - PAS COMMENCE
- Assets definitifs PixelLab MCP
- Effets visuels (particules, camera, zoom)
- Audio complet (SFX + musique)
- Arene finale Grand Marius
- Responsive mobile
- Deploy GitHub Pages

## COMMANDES

```bash
npm install          # Installer les dependances
npm run dev          # Serveur dev -> http://localhost:8080
npm run build        # Build production
npm run preview      # Preview du build
node test-game.mjs   # Test Playwright petanque
node test-overworld.mjs  # Test Playwright monde ouvert
```

## FICHIERS CLES

1. `CLAUDE.md` - conventions, stack, regles
2. `PLAN_MVP.md` - plan complet 5 sprints
3. `src/utils/Constants.js` - toutes les constantes
4. `src/petanque/PetanqueEngine.js` - state machine petanque
5. `src/scenes/OverworldScene.js` - scene monde ouvert
6. `src/world/MapManager.js` - carte village + collisions
7. `src/entities/Player.js` - joueur avec mouvement grille
8. `src/entities/NPC.js` - PNJ avec dialogue et combat
9. `public/data/npcs.json` - donnees PNJ

## ARCHITECTURE

```
src/
  main.js              -> new Phaser.Game(config)
  config.js            -> 416x240, Arcade, [Boot, Overworld, Petanque]
  scenes/
    BootScene.js       -> Ecran titre + preload JSON
    OverworldScene.js  -> Monde ouvert, camera, NPC, dialogue, combat
    PetanqueScene.js   -> Terrain vertical, Engine/Aiming/AI/Score
  entities/
    Player.js          -> Mouvement grille, animation, input
    NPC.js             -> Idle, line-of-sight, encounter, dialogue
  petanque/
    Ball.js            -> Physique custom (friction, collision)
    Cochonnet.js       -> Ball specialise (petit, leger)
    PetanqueEngine.js  -> State machine FIPJP, scoring, Game Over
    AimingSystem.js    -> Drag slingshot, fleche, power
    PetanqueAI.js      -> 3 niveaux, pointer vs tirer
  world/
    TilesetGenerator.js -> 14 tiles generes en canvas
    SpriteGenerator.js  -> Spritesheets personnages generes en canvas
    MapManager.js       -> Carte procedurale village_depart 30x30
    NPCManager.js       -> Gestion PNJ par map
  ui/
    DialogBox.js       -> Typewriter, avancer, skip
    ScorePanel.js      -> Score petanque
  utils/
    Constants.js       -> Toutes les constantes
public/
  data/
    boules.json        -> 3 sets + cochonnet + physics + 4 terrains
    npcs.json          -> PNJ (maitre, villageois, dresseurs)
    progression.json   -> 4 badges, gates, partenaires
```
