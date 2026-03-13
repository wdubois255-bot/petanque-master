# CLAUDE.md - Petanque Master

## Projet
**Petanque Master** : jeu web 2D style Pokemon avec combats de petanque.
Le joueur explore un monde ouvert top-down, rencontre des joueurs de petanque, et affronte des maitres d'arene.

## Stack technique
- **Framework** : Phaser 3.90.0 "Tsugumi" (derniere version stable, finale de la branche 3.x)
- **Langage** : JavaScript ES6+ (pas TypeScript pour rester simple)
- **Maps** : Tiled Map Editor -> export JSON
- **Physique petanque** : custom (~100 lignes, pas de Matter.js)
- **Physique exploration** : Phaser Arcade Physics
- **Audio** : Phaser built-in audio manager
- **UI/Dialogues** : phaser3-rex-plugins 1.80+ (rexUI)
- **Build** : Vite 6.3+ (bundler rapide, HMR). `assetsInlineLimit: 0` OBLIGATOIRE.
- **Hebergement** : GitHub Pages (GitHub Actions CI/CD)
- **Assets sprites** : PixelLab MCP (generation IA) + Aseprite (retouche)
- **Assets audio** : ElevenLabs MCP (SFX) + jsfxr (sons retro) + Beepbox (musique)

## MCP Servers configures
- **PixelLab** : generation sprites et tilesets pixel art (`pixellab-code/pixellab-mcp`)
- **ElevenLabs** : generation SFX et ambiance (`elevenlabs/elevenlabs-mcp`)

## Custom Skills (slash commands)
- `/sprite [nom]` : generer un sprite pixel art via PixelLab
- `/tileset [nom] [biome]` : generer un tileset via PixelLab
- `/sfx [description]` : generer un effet sonore via ElevenLabs
- `/playtest` : lancer le serveur de dev et ouvrir le navigateur
- `/build-assets` : optimiser tous les assets pour la production

## Structure du projet
```
/
  index.html
  vite.config.js
  package.json
  /src
    main.js              # Point d'entree Phaser
    config.js            # Config Phaser (resolution, physics, scenes)
    /scenes
      BootScene.js       # Chargement assets
      TitleScene.js      # Ecran titre
      OverworldScene.js  # Exploration monde ouvert
      PetanqueScene.js   # Partie de petanque
      DialogScene.js     # Overlay dialogues
      UIScene.js         # HUD overlay
    /entities
      Player.js          # Joueur (mouvement grille, animation)
      NPC.js             # PNJ (detection, dialogue, patrol)
    /petanque
      Ball.js            # Boule avec physique custom
      Cochonnet.js       # Cochonnet
      PetanqueEngine.js  # Moteur de jeu petanque (regles, tours, score)
      PetanqueAI.js      # IA adversaire (3 niveaux)
      AimingSystem.js    # Systeme de visee drag-and-release
    /world
      MapManager.js      # Chargement/transition des maps Tiled
      CollisionSystem.js # Collisions grille
      NPCManager.js      # Gestion des PNJ sur la map
    /ui
      DialogBox.js       # Boite de dialogue style Pokemon
      ScorePanel.js      # Panneau score petanque
      MiniMap.js         # Medaillon zoom petanque
    /data
      npcs.json          # Donnees des PNJ (dialogues, difficulte, position)
      progression.json   # Badges, deblocages, arenes
      boules.json        # Types de boules et leurs stats
    /utils
      SaveManager.js     # Sauvegarde localStorage
      Constants.js       # Constantes du jeu
  /assets
    /sprites             # Personnages, boules, UI elements
    /tilesets            # Tilesets pour Tiled
    /maps                # Fichiers JSON exportes de Tiled
    /audio
      /sfx               # Effets sonores
      /music             # Musiques de fond
  /public                # Fichiers statiques
```

## Conventions de code
- Noms de fichiers : PascalCase pour les classes, camelCase pour les utilitaires
- Une classe par fichier
- Pas de TypeScript, pas de JSDoc excessif
- Commentaires uniquement quand la logique n'est pas evidente
- Constantes de jeu dans Constants.js (vitesses, tailles, friction, etc.)
- Donnees de contenu dans /data en JSON (pas hardcode dans le code)

## Commandes
```bash
npm install          # Installer les dependances
npm run dev          # Lancer en mode dev (Vite HMR)
npm run build        # Build de production
npm run preview      # Preview du build
```

## Regles importantes
- **Pixel art** : toujours utiliser `image-rendering: pixelated` et `imageSmoothingEnabled = false`
- **Tile size** : 16x16 pixels partout
- **Resolution du jeu** : 416x240 (26x15 tiles visibles), scale integer x3 ou x4 selon l'ecran
- **Mouvement** : grid-based (snap au tile), animation smooth de transition ~200ms
- **Physique petanque** : custom, PAS de Matter.js. Friction lineaire constante. Multiplicateurs terrain : terre=1.0, herbe=1.8, sable=3.0, dalles=0.7. Restitution boule-boule=0.85, boule-cochonnet=0.7
- **IA petanque** : 3 niveaux (facile/moyen/difficile) definis par precision de visee et strategie
- **Sauvegarde** : localStorage, serialiser l'etat du jeu en JSON
- **Performance** : pre-render les layers statiques sur offscreen canvas, 60 FPS obligatoire
- **Assets** : licences CC0 ou CC-BY uniquement
- **Pas de backend** : tout est client-side

## Workflow de dev
1. Toujours tester dans le navigateur apres chaque changement (Vite HMR)
2. Le moteur petanque est le coeur du jeu : le prioriser et le tester isolement
3. Les maps Tiled sont dans /assets/maps en JSON
4. Quand on ajoute un PNJ, l'ajouter dans npcs.json ET dans la map Tiled (object layer)
5. Tester la physique des boules avec differentes valeurs de friction avant de figer

## Themes et ambiance
- Ambiance provencale / sud de la France, humor
- Personnages caricaturaux et attachants
- Dialogues courts, droles, avec du caractere
- Musique chiptune legere et ensoleillee
- Palette chaude : ocres, terracotta, verts olive, bleus ciel, lavande
- Jamais de noir pur (#000) : ombres en marron chaud (#3A2E28)

## Regles de petanque (FIPJP)
- 1v1 (tete-a-tete) : 3 boules/joueur
- 2v2 (doublette) : 3 boules/joueur, 6 total/equipe
- 3v3 (triplette) : 2 boules/joueur, 6 total/equipe
- L'equipe qui perd (boule plus loin) rejoue
- Score = nombre de boules gagnantes plus proches que la meilleure perdante
- Victoire a 13 points
- Cochonnet lance a 6-10m du cercle
- Boule hors terrain = morte (retiree)

## Fichiers de reference
- /PLAN_MVP.md : plan de dev complet en 5 sprints (Sprint 0-4) avec schemas de donnees
- /CAHIER_DES_CHARGES.md : cahier des charges du projet
- /research/ : 11 fichiers de recherche detailles (frameworks, physique, UX, IA pixel art, MCP, etc.)
- /src/data/boules.json : schema complet des boules, cochonnet, physique, terrains
- /.claude/skills/ : 5 custom skills (/sprite, /tileset, /sfx, /playtest, /build-assets)
