# HANDOFF - Petanque Master
> Document de reprise pour nouvelle session Claude Code. Derniere MAJ : 14 mars 2026.

## PROMPT PROCHAINE SESSION

Copie ce bloc pour demarrer la prochaine conversation :

```
Lis HANDOFF.md et LORE_PETANQUE.md. Les Sprints 0, 1, 2, 3 + polish visuel + systeme tir/point sont faits. Le jeu tourne : `npm run dev`. Tests : `node test-sprint3.mjs`, `node test-transition.mjs`, `node test-game.mjs`.

Parle en francais.

PRIORITE 1 - Vrais sprites PixelLab :
1. Utilise /sprite pour generer les sprites du joueur, du Papet, de Marcel, de Bastien, et des dresseurs
2. Utilise /tileset pour generer un tileset provencal de qualite (herbe, chemin, maisons, eau, arbres)
3. Remplace les placeholders canvas par les vrais sprites/tilesets dans le code

PRIORITE 2 - Contenu (Suite Sprint 3) :
4. Route 2 + Village Arene 2 : Maitre Fanny (terrain herbe, difficulte medium)
5. Route 3 + Village Arene 3 : Maitre Ricardo (terrain sable, difficulte hard)
6. Ajouter les PNJ, dialogues et gates correspondants

PRIORITE 3 - Audio :
7. Utilise /sfx pour generer les sons d'impact (boule-boule, boule-cochonnet, atterrissage)
8. Musique chiptune legere pour le monde ouvert et le combat

Lance `npm run dev`, fais un playtest Playwright avant et apres tes changements. Assure-toi que tout est commite et pousse sur GitHub a la fin.
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
- Indicateur BEST : halo vert (joueur gagne) ou rouge (IA gagne)
- Ecran Game Over : overlay sombre, score final, bouton Rejouer/Continuer
- Physique roulement corrigee : formule v0 = sqrt(2 * friction * distance)

**Sprint 2 (monde ouvert - fonctionnel):**
- `src/world/TilesetGenerator.js` : 14 types de tiles generes en canvas, dithering, palette enrichie
- `src/world/SpriteGenerator.js` : generation de spritesheets 16x24, 10 palettes, shading/highlights
- `src/world/MapManager.js` : carte village_depart 30x30 tiles procedural
- `src/world/NPCManager.js` : gestion des PNJ par map, collision, lookup
- `src/entities/Player.js` : mouvement grid-based, animations, input fleches + ZQSD
- `src/entities/NPC.js` : idle, line-of-sight, encounter, dialogue, battle trigger
- `src/ui/DialogBox.js` : typewriter effect, avancer Espace/Entree/clic, textes lisibles 10px + ombres
- `src/scenes/OverworldScene.js` : charge map + NPC + joueur, camera follow, dialogue, transition vers combat
- Transition exploration <-> combat petanque fonctionnelle

**Sprint 3 (contenu et progression - fonctionnel):**
- **SaveManager.js** : localStorage, 3 slots, save/load/delete, auto-save toutes les 5 min + sur changement de map + apres combat
- **TitleScene.js** : ecran titre PETANQUE MASTER dore 24px, menu avec curseur triangle, ombres portees
- **IntroScene.js** : dialogue narratif avec le Papet, choix de 3 sets de boules avec bordures dorees, stats ameliorees
- **3 maps procedurales** :
  - `village_depart` (30x30) : village natal, maisons, terrain petanque, PNJ
  - `route_1` (20x60) : route forestiere, 3 dresseurs, pont sur riviere, touriste
  - `village_arene_1` (30x30) : village de Marcel, arene terre battue, villageois, garde
- **Transitions de maps** : fadeOut/fadeIn, MapManager avec exits bidirectionnels, scene restart
- **Systeme de badges** : obtention apres victoire d'arene, notification 14px doree "BADGE OBTENU !", flash dore
- **Systeme de gates** : PNJ garde bloque passage sans badge, dialogue contextuel
- **Maitre Marcel** : premier maitre d'arene, terrain terre, difficulte easy, 6 lignes dialogue avant/apres
- **Rival Bastien "Le Fennec"** : inspire de Dylan Rocher, petit-fils du Grand Marius, arrogant, dialogue evolue
- **13 PNJ dans npcs.json** avec dialogues riches inspires legendes petanque
- **LORE_PETANQUE.md** : Quintais "Le Roi", Fazzino, Lacroix, Foyot, Rocher, Bonetto, Dream Team, La Marseillaise

**Polish visuel (fait - 13 mars 2026):**
- **Textes lisibles** : toutes les polices augmentees (7-8px -> 10-14px), ombres portees sur TOUS les textes, meilleur contraste
- **Sprites sur terrain petanque** : joueur + adversaire visibles pendant le combat, palettes dynamiques par adversaire, indicateurs de tour (fleches animees), posture accroupie (pointer) / debout (tirer)
- **Pixel art ameliore** :
  - TilesetGenerator : dithering, profondeur, palette enrichie (30+ couleurs), details (briques, vagues, ecorce, petales)
  - SpriteGenerator : shading darken/lighten, highlights, cols de chemise, mains visibles, outlines subtils
- **Terrain petanque** : ombre portee, texture noise, double bordure, label "VS adversaire"

**Systeme tir/point (fait - 13 mars 2026):**
- **Choix avant chaque lancer** : boutons POINTER / TIRER avec clavier (P/T/fleches/espace) et souris
- **Pointer** : trajectoire en cloche haute (plombee), arc -30px, roulement doux, efficacite 0.7
- **Tirer** : trajectoire rasante, arc -8px, plus rapide (x0.7 duree), impact fort (camera shake x2, flash blanc), efficacite 1.2 (possibilite de carreau)
- **IA mise a jour** : choisit tir/point selon strategie, fleche de visee coloree par mode
- **Feedback visuel** : boules adverses surbrillance doree + crosshair quand mode tirer, label TIR/POINT sur fleche de visee

### Verifie par Playwright (tests automatises - TOUS PASSENT)
- `test-sprint3.mjs` : TitleScene -> IntroScene -> choix boules -> OverworldScene -> Route 1 -> sauvegarde **PASS**
- `test-transition.mjs` : village -> route_1 -> village_arene_1 + retour bidirectionnel **PASS**
- `test-game.mjs` : petanque engine (menes, scoring, IA, lancers) **0 erreurs**
- Note : les tests utilisent `keyboard.down()/up()` (pas `press()`) pour compatibilite Phaser JustDown

## PRIORITES PROCHAINE SESSION

### 1. SPRITES PIXEL ART (PixelLab MCP)
- Utiliser `/sprite` pour generer de vrais sprites pixel art de qualite
- Remplacer les placeholders canvas par des sprites PixelLab pour joueur, PNJ, maitres
- Utiliser `/tileset` pour des tilesets plus beaux

### 2. CONTENU (Sprint 3 suite)
- Route 2 + Village Arene 2 (Fanny, herbe)
- Route 3 + Village Arene 3 (Ricardo, sable)
- Doublettes (2v2), partenaires recrutables

### 3. POLISH (Sprint 4)
- Audio (SFX via `/sfx` + musique chiptune)
- Effets visuels (particules poussiere, zoom lancer)
- Arene finale Grand Marius
- Deploy GitHub Pages

## COMMANDES

```bash
npm install          # Installer les dependances
npm run dev          # Serveur dev -> http://localhost:8080
npm run build        # Build production
npm run preview      # Preview du build
node test-sprint3.mjs    # Test Sprint 3 complet (PASS)
node test-transition.mjs # Test transitions de maps (PASS)
node test-game.mjs       # Test petanque engine (0 erreurs)
```

## FICHIERS CLES

1. `CLAUDE.md` - conventions, stack, regles
2. `PLAN_MVP.md` - plan complet 5 sprints
3. `LORE_PETANQUE.md` - histoire petanque + mapping personnages (Quintais, Fazzino, Rocher, Bonetto...)
4. `src/utils/Constants.js` - toutes les constantes
5. `src/utils/SaveManager.js` - sauvegarde localStorage 3 slots
6. `src/scenes/TitleScene.js` - ecran titre avec menu dore
7. `src/scenes/IntroScene.js` - intro + choix boules
8. `src/scenes/OverworldScene.js` - monde ouvert, transitions, gates, auto-save
9. `src/scenes/PetanqueScene.js` - combat petanque avec sprites joueur/adversaire
10. `src/petanque/PetanqueEngine.js` - moteur regles FIPJP + tir/point + state machine
11. `src/petanque/AimingSystem.js` - systeme de visee avec choix POINTER/TIRER
12. `src/world/MapManager.js` - 3 maps procedurales + exits
13. `src/entities/Player.js` - joueur avec mouvement grille
14. `src/entities/NPC.js` - PNJ avec dialogue et combat
15. `public/data/npcs.json` - 13 PNJ avec dialogues riches

## ARCHITECTURE

```
src/
  main.js              -> new Phaser.Game(config)
  config.js            -> 416x240, Arcade, [Boot, Title, Intro, Overworld, Petanque]
  scenes/
    BootScene.js       -> Preload JSON + transition TitleScene
    TitleScene.js      -> Nouvelle Partie / Continuer / Slots (textes dores 24px)
    IntroScene.js      -> Dialogue Papet + choix boules (3 sets, bordures dorees)
    OverworldScene.js  -> Monde ouvert, maps, NPC, dialogue, transitions, auto-save
    PetanqueScene.js   -> Combat petanque (sprites joueur/adversaire, 4 terrains, 3 IA)
  entities/
    Player.js          -> Mouvement grille, animation, input
    NPC.js             -> Idle, line-of-sight, encounter, dialogue, types (mentor/rival/trainer/gate)
  petanque/
    Ball.js            -> Physique custom (friction, collision)
    Cochonnet.js       -> Ball specialise (petit, leger)
    PetanqueEngine.js  -> State machine FIPJP, scoring, Game Over, tir/point
    AimingSystem.js    -> Drag slingshot, choix POINTER/TIRER, fleche coloree
    PetanqueAI.js      -> 3 niveaux, choisit tir/point selon strategie
  world/
    TilesetGenerator.js -> 14 tiles enrichis (dithering, 30+ couleurs)
    SpriteGenerator.js  -> 10 palettes, shading/highlights, outlines
    MapManager.js       -> 3 maps procedurales (village, route, arene), exits bidirectionnels
    NPCManager.js       -> Gestion PNJ par map
  ui/
    DialogBox.js       -> Typewriter, textes 10px + ombres, nom dore
    ScorePanel.js      -> Score petanque 14px, bordure doree, mene, boules restantes
  utils/
    Constants.js       -> Toutes les constantes
    SaveManager.js     -> localStorage, 3 slots, format versionne
public/
  data/
    boules.json        -> 3 sets + cochonnet + physics + 4 terrains
    npcs.json          -> 13 PNJ avec dialogues enrichis
    progression.json   -> 4 badges, gates, partenaires
```

## FLOW DU JEU

```
BootScene (preload JSON)
  -> TitleScene (Nouvelle Partie / Continuer)
    -> IntroScene (dialogue Papet + choix boules) [si nouvelle partie]
    -> OverworldScene (village_depart, spawn 14,20) [si continuer]
      -> village_depart (Papet, Bastien rival, Thierry dresseur, villageois)
        -> Route 1 (Jean-Pierre, Mireille, Rene, Bernard)
          -> village_arene_1 (Marcel, Josette, Robert, Garde)
            -> Combat Marcel (PetanqueScene, terre, easy)
              -> Choix POINTER/TIRER avant chaque lancer
            -> Badge Terre obtenu !
            -> [Route 2... Sprint 3 suite]
```

## PERSONNAGES ET LORE

| Personnage | Inspire de | Role |
|-----------|-----------|------|
| Le Vieux Papet | Henri Lacroix (GOAT pointeur) | Mentor, ancien champion |
| Bastien "Le Fennec" | Dylan Rocher (jeune prodige) | Rival, petit-fils de Marius |
| Marcel | Marco Foyot (showman veterran) | 1er maitre d'arene, terre battue |
| Fanny | Legende de Fanny | 2eme maitre, herbe (a faire) |
| Ricardo | Philippe Suchaud | 3eme maitre, sable (a faire) |
| Grand Marius | Quintais "Le Roi" + Fazzino "L'Ogre" | Boss final, 20+ ans de domination |

Voir `LORE_PETANQUE.md` pour le detail complet (Dream Team, Bonetto, La Marseillaise, etc.).
