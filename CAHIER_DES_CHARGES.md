# Cahier des Charges — PETANQUE MASTER
> Version 2.17 — 28 mars 2026 (pret publication — 570 tests, 18 suites, 372 commits)
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
- [x] Loft simplifie : demi-portee (default), plombee (unlock 1ere victoire), tir au fer
- [x] ~~Roulette, Tir devant, Rafle~~ retires (session 23 — simplification onboarding)
- [x] Retro (backspin) toggle [R]
- [x] **Spin lateral** [E] : off → ← gauche → → droite → off (stat Effet >= 3, force 0.15 * effetStat/10) — rebalance session 25
- [x] Ciblage cochonnet [B] (angle auto-oriente vers cochonnet)
- [x] **Plombee rebalancee** : 72% vol / 28% roule, rollEfficiency 1.10 (overshoot terrain) — session 25
- [x] **Impact terrain sur distance** : compensation partielle (0.6) — sable 76%, dalles 115% de terre — session 25
- [x] **Portee augmentee** : THROW_RANGE_FACTOR 0.92 (was 0.85) — session 25
- **Fichiers** : `src/petanque/Ball.js`, `src/petanque/Cochonnet.js`, `src/petanque/PetanqueEngine.js`
- **Constantes** : `src/utils/Constants.js` (FRICTION_BASE, COR_*, TERRAIN_FRICTION_*, LOFT_*, LATERAL_SPIN_*, THROW_RANGE_FACTOR*, TERRAIN_ROLL_COMPENSATION)

### 2.2 Systeme de visee
- [x] Drag-and-release (direction + puissance)
- [x] **Selecteur simplifie** : panneau plat 2-3 boutons (Demi-portee/Plombee/Tir au fer), suggestion tactique, retour ESC
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
- [x] **IA utilise la rafle** (frictionMult < 1.5, 35% chance en mode tir)
- [x] **IA utilise spin lateral** (effet >= 6, probabilite proportionnelle)
- **Fichiers** : `src/petanque/PetanqueAI.js`, `src/petanque/ai/`

### 2.4 Personnages (12 : Rookie + 11 adversaires)
| ID | Nom | Archetype | Prec | Puis | Effet | SF | Total |
|----|-----|-----------|------|------|-------|----|-------|
| rookie | Le Rookie | adaptable | 4 | 4 | 3 | 3 | 14/40 |
| la_choupe | La Choupe | tireur | 6 | 10 | 3 | 8 | 27 |
| ley | Ley | tireur | 8 | 9 | 9 | 5 | 31 |
| foyot | Foyot | milieu | 8 | 7 | 8 | 7 | 30 |
| suchaud | Suchaud | tireur | 9 | 8 | 7 | 9 | 33 |
| fazzino | Fazzino | equilibre | 9 | 6 | 8 | 9 | 32 |
| rocher | Rocher | complet | 8 | 8 | 8 | 7 | 31 |
| robineau | Robineau | tireur | 8 | 8 | 5 | 8 | 29 |
| mamie_josette | Mamie Josette | pointeur | 7 | 3 | 6 | 10 | 26 |
| sofia | Sofia | pointeur | 9 | 5 | 8 | 7 | 29 |
| papi_rene | Papi Rene | pointeur | 8 | 2 | 4 | 10 | 24 |
| rizzi | Rizzi | complet | 8 | 7 | 10 | 6 | 31 |
- Le Rookie est le seul personnage jouable en Arcade (stats evoluent, abilities debloquees a 18/24/32 pts)
- Les adversaires sont debloquables et jouables en Quick Play
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
  | 2 | Mamie Josette | Parc | Moyen |
  | 3 | Fazzino | Colline | Difficile |
  | 4 | Suchaud | Docks | Tres difficile |
  | 5 | Ley (boss) | Plage | Expert |
  - Intro/ending narrative
  - Retry sur defaite (pas de game over)
  - Deblocage personnage apres victoire
  - Gain de Galets (100/victoire + 15/carreau + bonus run)
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
| PlayerScene | `src/scenes/PlayerScene.js` | Complet (stats, collection %, progression) |
| OverworldScene | `src/scenes/OverworldScene.js` | Reserve (Phase D) |

### 2.9 Audio
- [x] 14 SFX (boule_boule, boule_cochonnet, lancer_swoosh, carreau, victoire, defaite...)
- [x] 3 SFX UI : sfxUINavigate, sfxPurchase, sfxLevelUp
- [x] 2 musiques (title_theme, match_theme)
- [x] Music tension crossfade (crossfade dynamique selon pression du match)
- [x] Commentator infrastructure (systeme de commentaires audio)
- [x] Ambiance par terrain (cigales, vagues, oiseaux, vent, industriel)
- **Fichiers** : `public/assets/audio/sfx/`, `public/assets/audio/music/`

### 2.10 Sauvegarde
- [x] SaveManager v2 : schema unique (Rookie, Galets, deblocages, achats)
- [x] Migration automatique v1 → v2
- [x] SAVE_KEY et SAVE_VERSION centralises dans Constants.js
- [x] Stats persistantes (totalMatches, winsPerTerrain, bestScore, carreaux, etc.)
- **Fichier** : `src/utils/SaveManager.js`

### 2.11 Game Feel (implemente 18 mars 2026 + 24 mars 2026)
- [x] Slow-mo pres du cochonnet (< 40px, 0.3x) + vignette
- [x] Son de roulement continu (pink noise dynamique)
- [x] Pause dramatique 1.5s avant score de mene
- [x] Reactions foule audio (applaudissements, cheer, groan)
- [x] Ambiance par terrain (cigales, vagues, oiseaux, vent)
- [x] "+X pts" floating text on score (texte flottant anime a chaque gain de points)
- [x] **D1** : Murmure ambiant de foule (crowd ambiance, bruit rose bandpass 200-800Hz, swells 4-8s)
- [x] **D2** : Badge "Match X/Y" en mode Arcade (haut-gauche, depth 92)
- [x] **D3** : Teaser "prochain unlock" en fin de match (Galets + ability Rookie)
- [x] **D4** : Menu pause enrichi (400x320, controles, volume 3 boutons, Abandonner + confirmation)
- [x] **D5** : Hints terrain one-shot (colline/docks/plage/parc, overlay strip, auto-dismiss 4s)

### 2.12 Progression (implemente 18 mars 2026)
- [x] Le Rookie dans characters.json (10/40 pts, 3 abilities)
- [x] Galets : gain par victoire + carreaux + bonus run
- [x] LevelUpScene : repartition des points, _confirmed reset dans init()
- [x] ShopScene : 3 onglets (boules, cochonnets, capacites)
- [x] TutorialScene : 5 pages illustrees
- [x] Tutoriel in-game overlay (FTUE) : guide interactif premiere partie
- [x] Deblocages par progression arcade
- [x] Arcade 5 matchs (Choupe→Mamie Josette→Fazzino→Suchaud→Ley)
- [x] Collection tracker : progression % visible dans PlayerScene
- [x] Daily Challenge system (seed-based, defi quotidien unique)

---

## 3. RESTE A IMPLEMENTER

> Plans termines : `docs/PLAN_100.md` + `docs/PLAN_PHASE2.md`
> **Phase 3 terminee** : `docs/PLAN_PHASE3.md` (AXE A ✅ AXE B ✅ AXE C ✅ AXE D ✅ AXE E ✅ AXE F ✅)
> **Phase 4 Tier 1** : `docs/PLAN_PHASE4.md` (G ✅ I ✅ L ✅ N ✅ — reste H, J, K partiels)
> Voir aussi : `docs/PLAN_PHASE4.md` (completude finale, Tier 2/3 post-lancement)

### 3.0 Phase 3 — Profondeur technique (PLAN_PHASE3.md)
- [x] **AXE A** : Rafle, tir devant expose, ciblage cochonnet [B], spin lateral [E], IA mise a jour
- [x] **AXE B** : Feedback & resultats de tir (palet, ciseau, casquette, blesser, vocabulaire petanque)
- [x] **AXE C** : Cleanup code — IntroScene dead code, leaks keyboard, SaveManager migration, flyOnly TIR, constantes extraites
- [x] **AXE D** : Tests complementaires — slopes, walls, match flow, AimingSystem, SceneReuse, edge cases (+30 tests, 273/273)
- [x] **AXE E** : Audio enrichi (ambiances terrain procedurale, crowd reactions, Commentator.js 55 phrases)
- [x] **AXE F** : Mobile (touch areas 56px, portrait lock, PortalSDK wrapper, pooling Graphics)

### 3.1 Sprite Rookie (post-lancement)
- [ ] Systeme de couches pour customisation (accessoires superposables)
- [ ] Items cosmetiques : lunettes, chaine, casquette, t-shirt champion, etc.
- Note : sprite de base Rookie existe deja (V2, 4 directions)

### 3.2 Uniformisation assets (post-lancement)
- [x] Boules v3 — 16 couleurs pixel art avec 6-frame roll animation (384x64)
- [ ] Portraits HD 128x128 (actuellement portraits proceduraux via PortraitGenerator.js)

### 3.3 Polish restant
- [x] VSIntroScene : Tekken style (Bounce VS, MATCH!, typewriter)
- [x] CharSelectScene : verrous, Rookie en premier
- [x] TitleScene : menu Boutique + Tuto
- [x] Transitions fade entre scenes (fadeToScene, 44+ usages)
- [x] Score bounce + confettis victoire (ScorePanel._pulseText + ResultScene._spawnConfetti)
- [x] Loading bar BootScene (barre gradient + tips + pourcentage)
- [ ] Charges d'abilities visibles en match (HUD)
- [ ] Traces d'impact (verifier RenderTexture)

### 3.4 Tests automatises
- [x] Vitest : 570 tests unitaires, 18 suites — **570/570 PASS**
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

### 3.6 Balance et corrections (session 8)
- [x] **Balance Suchaud** : 1 charge Tir Chirurgical (etait illimite), angleDev 3 (precision reduite)
- [x] **Bug addGalets** : protection contre valeurs negatives
- [x] **Bug knockbackMult** : correction multiplication (etait appliquee en double)
- [x] **Bug _rollFrames** : correction edge case (frames de roulement)
- [x] **Bug window.__PHASER_GAME__** : supprime (interdit par convention, utiliser this.registry)
- [x] **Bug BootScene shutdown** : cleanup propre des ressources au shutdown

### 2.13 Localisation FR/EN (session 11 — 24 mars 2026)
- [x] **I18n.js** : singleton 68 lignes, `t()` / `ta()` / `detect()` / `setLocale()`, fallback FR
- [x] **fr.json** : 16 tips boot, menus titre, tuto 4 phases, ingame panel, terrain hints, loft, shop, levelup, result
- [x] **en.json** : même structure EN (Jack/End/Iron Shot/Lob/Rolling, Galets/Carreau conservés)
- [x] **main.js** : top-level `await I18n.load()` avant Phaser (I18n prête dès le preload)
- [x] **BootScene** : titre, loading text, tips via `I18n.ta()`
- [x] **TitleScene** : 6 boutons menu, subtitle, press_start, controls, saves, slots, settings + toggle `[FR|en]`
- [x] **InGameTutorial** : 4 phases + terrain hints via `I18n.t('terrain_hints.{id}')`
- [x] **EngineRenderer** : aim hint
- [x] **ScorePanel** : SCORE / VOUS / ADV. / MENE {n} / tab hint
- [x] **Sprint F — I18n.field() + fieldArray()** : résolution localisée des champs JSON (locale → fallback FR)
- [x] **Sprint F — données _en** : characters.json (12 persos × name/title/description/catchphrase/barks_en), terrains, shop, arcade, commentator
- [x] **Sprint F — câblage scenes** : I18n.field() branché dans CharSelect, VSIntro, Petanque (barks), Result, Arcade, ScorePanel, Commentator
- [x] **Clé dupliquée** : ingame.aim_hint supprimée, unifié sur tutorial.aim
- **Fichiers** : `src/utils/I18n.js`, `public/data/lang/fr.json`, `public/data/lang/en.json`

### 2.14 Audit Phase 4A + corrections (session 12 — 24 mars 2026)
- [x] **Audit complet** : 30+ points vérifiés, 68 actions joueur inventoriées
- [x] **C6 — Confirmation achat** : modal OUI/NON dans ShopScene avant spendGalets()
- [x] **Match Chai retiré** : round 6 arcade retiré (personnage pas dans roster — gardé pour futur Tournoi International)
- [x] **Tests ajustés** : arcade validation flexible (3+ matches, expert dans difficultyOrder)
- **Fichiers** : `src/scenes/ShopScene.js`, `public/data/arcade.json`, `tests/TerrainValidation.test.js`

### 2.15 Fix Playtest Bugs — Robustesse & Conformite (session 13 — 24 mars 2026)
- [x] **I18n.js CLAUDE.md compliance** : supprime console.warn, remplace localStorage direct par SaveManager (lang persiste)
- [x] **SaveManager lang** : champ `lang: 'fr'` dans defaultSaveData (retro-compat via spread)
- [x] **Defensive JSON** : guards `|| {}` sur cache.json.get() dans ArcadeScene, CharSelectScene, ShopScene, QuickPlayScene
- [x] **ArcadeScene robustesse** : early return si arcadeData.matches absent, `?.` sur _getCharById/_getTerrainById
- [x] **ShopScene i18n tabs** : import I18n, tabs localises via I18n.t(shop.tab_*), controls hint i18n
- [x] **TitleScene fade FTUE** : premiere visite utilise fadeToScene au lieu de scene.start
- [x] **fr.json/en.json** : +4 cles shop (tab_balls, tab_jacks, tab_abilities, controls_hint)
- [x] **Tests** : I18n.test.js (12 tests), SaveManager lang (3 tests), TerrainValidation i18n keys (3 tests) — total 296/296
- **Fichiers** : `src/utils/I18n.js`, `src/utils/SaveManager.js`, 5 scenes, 2 lang JSON, 3 fichiers test

---

### 3.7 Polish UX (session 8 — 24 mars 2026)
- [x] **VSIntroScene** : catchphrase joueur + adversaire (italic, #D4A574, fade-in 200ms)
- [x] **InGameTutorial** : Phase 1.5 regle du tour ("l'equipe la plus loin rejoue", 4s, TUTORIAL_PHASE_TURN_RULE=4)
- [x] **InGameTutorial** : LOFT timer 5s → 8s + bouton OK dismiss immediat
- [x] **BootScene** : +8 tips lore/gameplay (La Ciotat, Fanny, terrains, strategie pointeur)
- [x] **EngineRenderer** : hint visee unifie avec InGameTutorial ("Glissez vers le bas pour viser...")
- [x] **AimingSystem** : sous-descriptions 9px #9E9E8E sous chaque mode (Roulette, Demi, Plombee, Rafle, Tir Fer, Tir Devant)
- [x] **PetanqueScene** : VS label fade-out alpha 0 apres 5s (Sine.easeIn 1000ms)
- [x] **LevelUpScene** : tooltips hover sur chaque stat (Precision/Puissance/Effet/Sang-froid, depth 150)
- [x] **CharSelectScene** : section CAPACITES Rookie avec seuils, noms, descriptions + checkmarks vert si debloquees
- [x] **Regle projet** : pas de noms de joueurs reels — remplace par generique (droits image)

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
| Framework jeu | Phaser 4 | 4.0.0-rc.6 |
| Langage | JavaScript ES6+ | — |
| Build | Vite | 6.3+ |
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
    /scenes/             # 13 scenes actives (+ OverworldScene reserve Phase D)
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
