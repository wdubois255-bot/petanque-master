# Cahier des Charges — PETANQUE MASTER
> Version 2.2 — 18 mars 2026 (audit complet)
> Ce document est la **reference stricte** de tout ce qui existe et tout ce qui doit etre implemente.

---

## 1. CONCEPT

**Petanque Master** est un jeu de petanque competitif 2D en pixel art, style jeu de combat (Street Fighter / Tekken), avec :
- Des personnages a stats uniques et capacites speciales
- Un mode Arcade avec progression et deblocages
- Un systeme de monnaie et boutique
- Un personnage evoluable (Le Rookie)
- Des terrains varies avec physique differente

**Pas un monde ouvert** (reserve Phase D). Le coeur du jeu = le gameplay petanque + la boucle de progression.

---

## 2. ETAT ACTUEL — CE QUI FONCTIONNE

### 2.1 Moteur de petanque
- [x] Physique custom realiste (COR 0.62 acier, 0.50 cochonnet)
- [x] Friction lineaire constante par terrain
- [x] Collisions boule-boule avec restitution et ejection
- [x] Collisions boule-cochonnet (cochonnet deplacable)
- [x] Sub-stepping physique (anti-tunneling)
- [x] Boules mortes (hors terrain)
- [x] Rebonds murs (terrain Docks)
- [x] Zones de friction mixte (Parc : herbe + gravier)
- [x] Zones de pente (Colline : gravity_component)
- [x] Loft : roulette, demi-portee, plombee, tir
- [x] Retro (backspin) toggle
- **Fichiers** : `src/petanque/Ball.js`, `src/petanque/Cochonnet.js`, `src/petanque/PetanqueEngine.js`
- **Constantes** : `src/utils/Constants.js` (FRICTION_BASE, COR_*, TERRAIN_FRICTION_*)

### 2.2 Systeme de visee
- [x] Drag-and-release (direction + puissance)
- [x] Selection mode : pointer / tirer / loft
- [x] Focus (Respire) : 5 charges, -80% wobble
- [x] Capacites uniques par personnage
- [x] Tremblement sous pression (sang_froid stat)
- [x] Wobble de precision (precision stat, Lissajous)
- [x] Prediction de trajectoire (ligne pointillee)
- **Fichier** : `src/petanque/AimingSystem.js`

### 2.3 IA adversaire
- [x] 3 niveaux : facile (angleDev 15), moyen (8), difficile (3)
- [x] 4 personnalites : tireur, pointeur, equilibre, complet
- [x] 4 strategies IA dediees : `PointeurStrategy` (Le Magicien), `TireurStrategy` (Ley, La Choupe), `EquilibreStrategy` (Marcel), `CompletStrategy` (Reyes)
- [x] Bonus precision par archetype : tireur 0.55x en tir, pointeur 0.6x en pointage, complet 0.75x partout, **equilibre 0.80x pointage / 0.85x tir** (corrige audit 18 mars soir)
- [x] Cochonnet placement specifique par personnalite (equilibre, complet, pointeur, tireur)
- [x] Systeme de momentum (+/- precision selon confiance)
- [x] Decision strategique : pointer vs tirer selon distance et situation
- [x] Pression sous score (sang_froid interaction)
- **Fichiers** : `src/petanque/PetanqueAI.js`, `src/petanque/ai/`

### 2.4 Personnages (6 : Rookie + 5 adversaires)
| ID | Nom | Archetype | Prec | Puis | Effet | SF | Total | Capacite |
|----|-----|-----------|------|------|-------|----|-------|----------|
| rookie | Le Rookie | adaptable | 3 | 3 | 2 | 2 | 10/40 | Evolutif (3 abilities debloquees a 18/26/34 pts) |
| ley | Ley | tireur | 8 | 9 | 9 | 5 | 31 | Carreau Instinct (ejection +50%) |
| magicien | Le Magicien | pointeur | 10 | 4 | 7 | 9 | 30 | Lecture du Terrain (trajectoire 3s) |
| la_choupe | La Choupe | tireur | 6 | 10 | 3 | 8 | 27 | Coup de Canon (+30% puiss, -20% prec) |
| marcel | Marcel | equilibre | 8 | 5 | 5 | 8 | 26 | Vieux Renard (annule tremblement) |
| reyes | Reyes | complet | 7 | 7 | 7 | 8 | 29 | Le Mur (boule 2x rayon) |
- Le Rookie est le seul personnage jouable en Arcade (stats evoluent avec les victoires)
- Les 5 adversaires sont debloquables et jouables en Quick Play
- **Donnees** : `public/data/characters.json`
- **Sprites** : `public/assets/sprites/` (128x128 spritesheets + throw animations)

### 2.5 Boules et cochonnets
- [x] 10 types de boules : acier, bronze, chrome, noire, rouge, doree, rouille, bleue, cuivre, titane
- [x] 5 boules retro (pixel art alternatif) : acier, bronze, chrome, noire, rouge
- [x] 6 cochonnets : classique, bleu, vert, rouge, jungle, multicolor
- [x] Bonus stats par boule (friction_x, retro_x, restitution_x)
- **Donnees** : `public/data/boules.json`

### 2.6 Terrains (5)
| ID | Nom | Surface | Friction | Special |
|----|-----|---------|----------|---------|
| village | Village | terre | 1.0 | Base, standard |
| plage | Plage | sable | 3.0 | Haute friction |
| parc | Parc | herbe/gravier | 1.8/1.2 | Zones mixtes |
| colline | Colline | terre | 1.0 | Pente (gravity) |
| docks | Docks | dalles | 0.7 | Rebonds murs |
- **Donnees** : `public/data/terrains.json`

### 2.7 Modes de jeu
- [x] **Arcade** : 5 rounds avec difficulte progressive
  | Round | Adversaire | Terrain | Difficulte |
  |-------|-----------|---------|------------|
  | 1 | La Choupe | Village | Facile |
  | 2 | Marcel | Parc | Moyen |
  | 3 | Le Magicien | Colline | Difficile |
  | 4 | Reyes | Docks | Tres difficile |
  | 5 | Ley (boss) | Plage | Expert |
  - Intro/ending narrative
  - Retry sur defaite (pas de game over)
  - Deblocage personnage apres victoire
  - Gain d'Ecus (50/victoire + 10/carreau + bonus run)
  - **Fichier** : `src/scenes/ArcadeScene.js`
- [x] **Quick Play** : choix libre terrain/adversaire/difficulte/format/boules
  - **Fichier** : `src/scenes/QuickPlayScene.js`
- **Donnees arcade** : `public/data/arcade.json`

### 2.8 Scenes implementees
| Scene | Fichier | Status |
|-------|---------|--------|
| BootScene | `src/scenes/BootScene.js` | Complet |
| TitleScene | `src/scenes/TitleScene.js` | Complet |
| IntroScene | `src/scenes/IntroScene.js` | Complet (intro narrative + choix boules) |
| CharSelectScene | `src/scenes/CharSelectScene.js` | Complet |
| QuickPlayScene | `src/scenes/QuickPlayScene.js` | Complet |
| ArcadeScene | `src/scenes/ArcadeScene.js` | Complet |
| VSIntroScene | `src/scenes/VSIntroScene.js` | Complet |
| PetanqueScene | `src/scenes/PetanqueScene.js` | Complet |
| ResultScene | `src/scenes/ResultScene.js` | Complet |
| LevelUpScene | `src/scenes/LevelUpScene.js` | Complet (repartition stats Rookie) |
| ShopScene | `src/scenes/ShopScene.js` | Complet (3 onglets) |
| TutorialScene | `src/scenes/TutorialScene.js` | Complet (5 pages) |
| OverworldScene | `src/scenes/OverworldScene.js` | Reserve (Phase D) |

### 2.9 Audio
- [x] 14 SFX (boule_boule, boule_cochonnet, lancer_swoosh, carreau, victoire, defaite...)
- [x] 2 musiques (title_theme, match_theme)
- [x] Ambiance par terrain (cigales, vagues, oiseaux, vent, industriel)
- **Fichiers** : `public/assets/audio/sfx/`, `public/assets/audio/music/`

### 2.10 Sauvegarde
- [x] SaveManager v2 : schema unique (Rookie, Ecus, deblocages, achats)
- [x] Migration automatique v1 → v2
- **Fichier** : `src/utils/SaveManager.js`

### 2.11 Game Feel (implemente 18 mars 2026)
- [x] Slow-mo pres du cochonnet (< 40px, 0.3x) + vignette
- [x] Son de roulement continu (pink noise dynamique)
- [x] Pause dramatique 1.5s avant score de mene
- [x] Reactions foule audio (applaudissements, cheer, groan)
- [x] Ambiance par terrain (cigales, vagues, oiseaux, vent)

### 2.12 Progression (implemente 18 mars 2026)
- [x] Le Rookie dans characters.json (10/40 pts, 3 abilities)
- [x] Ecus : gain par victoire + carreaux + bonus run
- [x] LevelUpScene : repartition des points
- [x] ShopScene : 3 onglets (boules, cochonnets, capacites)
- [x] TutorialScene : 5 pages illustrees
- [x] Deblocages par progression arcade
- [x] Arcade 5 matchs + boss (Choupe→Marcel→Magicien→Reyes→Ley)

---

## 3. RESTE A IMPLEMENTER

> Detail complet dans `SPRINT_FINAL.md`

### 3.1 Sprite Rookie
- [ ] Sprite de base via PixelLab (128x128, 4 directions, animations)
- [ ] Systeme de couches pour customisation (accessoires superposables)
- [ ] Items cosmetiques : lunettes, chaine, casquette, t-shirt champion, etc.

### 3.2 Uniformisation assets
- [ ] Regenerer les 5 boules pixel-art (acier, bronze, chrome, noire, rouge) en style 3D realiste

### 3.3 Polish restant
- [x] VSIntroScene : Tekken style (Bounce VS, MATCH!, typewriter)
- [x] CharSelectScene : verrous, Rookie en premier
- [x] TitleScene : menu Boutique + Tuto
- [ ] Portraits HD (128x128 au lieu des cercles proceduraux)
- [ ] Traces d'impact (verifier RenderTexture)

### 3.4 Tests automatises
- [x] Vitest : 138 tests unitaires (physique, collisions, IA, terrains, retro, loft) — **138/138 PASS**
- [x] Playwright e2e : 85 tests (navigation, health, performance, stress, visual regression)
  - **67/67 tests fonctionnels PASS** (game, health, performance, stress)
  - **18 tests visual regression** : baselines a regenerer apres chaque changement visuel
- [x] CI/CD : GitHub Actions `.github/workflows/qa.yml`
- **Fichiers** : `tests/`, `tests/e2e/`, `playwright.config.js`

### 3.5 Corrections audit (18 mars 2026 soir)
- [x] **Marcel IA** : bonus precision 0.80x/0.85x (etait 1.0x = aucun bonus)
- [x] **Marcel cochonnet** : placement specifique (angleDev 2.5° au lieu de 5° generique)
- [x] **CompletStrategy bug** : `value * 1.5` → `value *= 1.5` (assignation manquante)
- [x] **00_synthese** : stats Reyes corrigees (complet 8/8/7/9, pas equilibre 7/7/6/7)
- [x] **00_synthese** : seuils Rookie corriges (18/26/34, pas 20/30)
- [x] **HANDOFF.md** : marque OBSOLETE (ancien roster Rene/Fanny/Ricardo)

---

## 4. REGLES DE PETANQUE (FIPJP)

### 4.1 Format actuel
- **Tete-a-tete (1v1)** : 3 boules par joueur
- L'equipe qui perd (boule plus loin) rejoue
- Score = boules gagnantes plus proches que la meilleure perdante
- Victoire a **13 points**
- Cochonnet lance a 6-10m du cercle
- Boule hors terrain = morte (retiree)

### 4.2 Formats futurs (Phase C)
- Doublette (2v2) : 3 boules/joueur, 6 total
- Triplette (3v3) : 2 boules/joueur, 6 total

---

## 5. STACK TECHNIQUE

| Composant | Technologie | Version |
|-----------|-------------|---------|
| Framework jeu | Phaser 3 "Tsugumi" | 3.90.0 |
| Langage | JavaScript ES6+ | — |
| Build | Vite | 6.3+ |
| UI/Dialogues | phaser3-rex-plugins | 1.80+ |
| Maps | Tiled Map Editor | JSON export |
| Sprites IA | PixelLab MCP (pixflux) | — |
| SFX IA | ElevenLabs MCP | — |
| Tests | Playwright | — |
| Hebergement | GitHub Pages (CI/CD) | — |

### 5.1 Conventions
- `image-rendering: pixelated` + `imageSmoothingEnabled = false`
- Tile size : 32x32 partout
- Resolution : 832x480 (26x15 tiles), scale x2
- Sprites persos : generes 64x64, downscale 2x nearest-neighbor
- Ombres : #1A1510 (jamais #000)
- Palette provencale : ocres, terracotta, olive, lavande, bleu ciel
- `assetsInlineLimit: 0` dans Vite (OBLIGATOIRE)

---

## 6. ARCHITECTURE FICHIERS

```
/
  CLAUDE.md              # Instructions projet (conventions, stack, structure)
  GAME_DESIGN.md         # Bible game design (personnages, terrains, flow)
  CAHIER_DES_CHARGES.md  # CE FICHIER — reference stricte
  SPRINT_FINAL.md        # Plan d'implementation detaille du sprint final
  STORY.md               # Histoire "L'Heritier de la Ciotat" (reserve Phase D)
  /src
    main.js, config.js
    /scenes/             # 12 scenes actives (+ OverworldScene reserve Phase D)
    /petanque/           # Ball, Cochonnet, PetanqueEngine, PetanqueAI, AimingSystem
    /ui/                 # DialogBox, ScorePanel, MiniMap, CharSelectUI, UIFactory
    /utils/              # SaveManager, Constants, SoundManager, PortraitGenerator
    /data/               # (vide, donnees dans public/data/)
  /public
    /data/               # characters.json, terrains.json, arcade.json, boules.json, progression.json, shop.json, npcs.json
    /assets/             # sprites/, portraits/, audio/sfx/, audio/music/
  /research/             # 33 fichiers de recherche actifs (voir research/README.md)
  /scripts/              # 9 scripts utilitaires (generate, upscale, prepare)
  /tests/                # Vitest (unit) + Playwright (e2e)
```

---

## 7. REFERENCES CROISEES

| Je cherche... | Je vais dans... |
|---------------|-----------------|
| Game design complet | `GAME_DESIGN.md` |
| Plan d'implementation | `SPRINT_FINAL.md` |
| Conventions code/stack | `CLAUDE.md` |
| Ce cahier des charges | `CAHIER_DES_CHARGES.md` (ce fichier) |
| Physique boules | `research/04_petanque_physics.md` + `src/utils/Constants.js` |
| Regles FIPJP | `research/09_petanque_rules_formal.md` |
| Techniques de lancer | `research/25_techniques_lancer_reference.md` |
| IA et game feel | `research/13_gameplay_petanque_game_design.md` |
| Polish Phaser 3 | `research/14_phaser3_polish_techniques.md` |
| Faisabilite ameliorations | `research/22_faisabilite_ameliorations_phaser3.md` |
| Plan visuel scene | `research/20_plan_amelioration_scene_petanque.md` |
| Lore et legendes | `research/19_legendes_petanque.md` |
| Story mode | `STORY.md` + `research/25_story_game_design.md` |
| Distribution | `research/29_plan_lancement_complet.md` |
| Commercial | `research/32_strategie_commerciale_complete.md` |
| Sprites workflow | Memoire `feedback_sprite_workflow.md` |
| PixelLab API | Memoire `reference_pixellab_api.md` |
| Synthese projet | `research/00_synthese_etat_projet.md` |
| Donnees personnages | `public/data/characters.json` |
| Donnees terrains | `public/data/terrains.json` |
| Donnees boules | `public/data/boules.json` |
