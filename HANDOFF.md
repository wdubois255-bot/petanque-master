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
- `src/world/TilesetGenerator.js` : 14 types de tiles generes en canvas
- `src/world/SpriteGenerator.js` : generation de spritesheets 16x24, 10 palettes de personnages
- `src/world/MapManager.js` : carte village_depart 30x30 tiles procedural
- `src/world/NPCManager.js` : gestion des PNJ par map, collision, lookup
- `src/entities/Player.js` : mouvement grid-based, animations, input fleches + ZQSD
- `src/entities/NPC.js` : idle, line-of-sight, encounter, dialogue, battle trigger
- `src/ui/DialogBox.js` : typewriter effect, avancer Espace/Entree/clic
- `src/scenes/OverworldScene.js` : charge map + NPC + joueur, camera follow, dialogue, transition vers combat
- Transition exploration <-> combat petanque fonctionnelle

**Sprint 3 (contenu et progression - fonctionnel):**
- **SaveManager.js** : localStorage, 3 slots, save/load/delete, auto-save toutes les 5 min + sur changement de map + apres combat
- **TitleScene.js** : ecran titre PETANQUE MASTER, menu Nouvelle Partie / Continuer, selection de slot, boules decoratives
- **IntroScene.js** : dialogue narratif avec le Papet (14 lignes, origines de la petanque, lore), choix de 3 sets de boules (Acier/Bronze/Chrome) avec cards visuelles et barres de stats
- **3 maps procedurales** :
  - `village_depart` (30x30) : village natal, maisons, terrain petanque, PNJ
  - `route_1` (20x60) : route forestiere, 3 dresseurs, pont sur riviere, touriste
  - `village_arene_1` (30x30) : village de Marcel, arene terre battue, villageois, garde
- **Transitions de maps** : fadeOut/fadeIn, MapManager avec exits bidirectionnels, scene restart
- **Systeme de badges** : obtention apres victoire d'arene, notification visuelle "BADGE OBTENU !", flash dore
- **Systeme de gates** : PNJ garde bloque passage sans badge, dialogue contextuel
- **Maitre Marcel** : premier maitre d'arene, terrain terre, difficulte easy, 6 lignes dialogue avant/apres
- **Rival Bastien "Le Fennec"** : petit-fils du Grand Marius, arrogant, dialogue qui evolue avec la progression
- **13 PNJ dans npcs.json** :
  - Village : Papet (mentor), Bastien (rival), Maman, Monique, Fernand, Thierry (dresseur)
  - Route 1 : Jean-Pierre, Mireille, Rene (dresseurs), Bernard (touriste)
  - Village Arene 1 : Josette, Tonton Robert (villageois), Garde Raymond (gate), Marcel (arene)
- **Histoire/Lore enrichi** : references parodiques aux legendes de la petanque (Fazzino, Quintais, Foyot, Lacroix, La Marseillaise), origines "pes tanquats", culture provencale
- **LORE_PETANQUE.md** : document de reference complet sur l'histoire reelle de la petanque et le mapping vers les personnages du jeu

### Verifie par Playwright (tests automatises)
- `test-sprint3.mjs` : TitleScene → IntroScene → choix boules → OverworldScene → 0 erreurs, sauvegarde OK
- `test-transition.mjs` : village_depart → Route 1 transition OK, PNJ route 1 visibles
- `test-game.mjs` : petanque engine fonctionnel (menes, scoring, IA)
- `test-overworld.mjs` : monde ouvert basique (legacy, pre-Sprint 3)

## CE QU'IL RESTE A FAIRE

### Sprint 3 - A finir (optionnel)
1. **Doublettes (2v2)** - format prevu pour Fanny et Ricardo, pas encore implemente
2. **Partenaires recrutables** - Bob le Touriste, Mamie Rose, Le Petit Lucas
3. **Route 2 + Village Arene 2 (Fanny)** - maps non creees
4. **Route 3 + Village Arene 3 (Ricardo)** - maps non creees

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
node test-sprint3.mjs    # Test Sprint 3 complet (titre → intro → overworld)
node test-transition.mjs # Test transitions de maps
node test-game.mjs       # Test petanque engine
node test-overworld.mjs  # Test monde ouvert (legacy)
```

## FICHIERS CLES

1. `CLAUDE.md` - conventions, stack, regles
2. `PLAN_MVP.md` - plan complet 5 sprints
3. `LORE_PETANQUE.md` - histoire petanque + mapping personnages
4. `src/utils/Constants.js` - toutes les constantes
5. `src/utils/SaveManager.js` - sauvegarde localStorage 3 slots
6. `src/scenes/TitleScene.js` - ecran titre avec menu
7. `src/scenes/IntroScene.js` - intro + choix boules
8. `src/scenes/OverworldScene.js` - monde ouvert, transitions, gates, auto-save
9. `src/scenes/PetanqueScene.js` - combat petanque
10. `src/world/MapManager.js` - 3 maps procedurales + exits
11. `src/entities/Player.js` - joueur avec mouvement grille
12. `src/entities/NPC.js` - PNJ avec dialogue et combat
13. `public/data/npcs.json` - 13 PNJ avec dialogues riches

## ARCHITECTURE

```
src/
  main.js              -> new Phaser.Game(config)
  config.js            -> 416x240, Arcade, [Boot, Title, Intro, Overworld, Petanque]
  scenes/
    BootScene.js       -> Preload JSON + transition TitleScene
    TitleScene.js      -> Nouvelle Partie / Continuer / Slots
    IntroScene.js      -> Dialogue Papet + choix boules (3 sets)
    OverworldScene.js  -> Monde ouvert, maps, NPC, dialogue, transitions, auto-save
    PetanqueScene.js   -> Combat petanque (4 terrains, 3 IA)
  entities/
    Player.js          -> Mouvement grille, animation, input
    NPC.js             -> Idle, line-of-sight, encounter, dialogue, types (mentor/rival/trainer/gate)
  petanque/
    Ball.js            -> Physique custom (friction, collision)
    Cochonnet.js       -> Ball specialise (petit, leger)
    PetanqueEngine.js  -> State machine FIPJP, scoring, Game Over
    AimingSystem.js    -> Drag slingshot, fleche, power
    PetanqueAI.js      -> 3 niveaux, pointer vs tirer
  world/
    TilesetGenerator.js -> 14 tiles generes en canvas
    SpriteGenerator.js  -> 10 palettes, spritesheets generes en canvas
    MapManager.js       -> 3 maps procedurales (village, route, arene), exits bidirectionnels
    NPCManager.js       -> Gestion PNJ par map
  ui/
    DialogBox.js       -> Typewriter, avancer, skip
    ScorePanel.js      -> Score petanque
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
  → TitleScene (Nouvelle Partie / Continuer)
    → IntroScene (dialogue Papet + choix boules) [si nouvelle partie]
    → OverworldScene (village_depart, spawn 14,20) [si continuer]
      → village_depart (Papet, Bastien rival, Thierry dresseur, villageois)
        → Route 1 (Jean-Pierre, Mireille, Rene, Bernard)
          → village_arene_1 (Marcel, Josette, Robert, Garde)
            → Combat Marcel (PetanqueScene, terre, easy)
            → Badge Terre obtenu !
            → [Route 2... Sprint 3 suite ou Sprint 4]
```

## PERSONNAGES ET LORE

| Personnage | Inspire de | Role |
|-----------|-----------|------|
| Le Vieux Papet | Henri Lacroix | Mentor, ancien champion |
| Bastien "Le Fennec" | Rival shonen | Petit-fils de Marius, arrogant |
| Marcel | Marco Foyot | 1er maitre d'arene, terre battue |
| Fanny | Legende de Fanny | 2eme maitre, herbe (Sprint 4) |
| Ricardo | Suchaud | 3eme maitre, sable (Sprint 4) |
| Grand Marius | Fazzino "L'Ogre" | Boss final (Sprint 4) |

Voir `LORE_PETANQUE.md` pour le detail complet.
