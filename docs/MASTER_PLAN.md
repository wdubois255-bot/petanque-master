# MASTER PLAN — Petanque Master

> **Ce document consolide** : CONTRE_ANALYSE.md (audit) + PLAN_CORRECTIONS.md (corrections) + tout ce qui manque.
> **C'est LE document de reference** pour savoir quoi faire, dans quel ordre, et pourquoi.
> **Mis a jour** : 20 mars 2026
> **Score actuel du jeu** : 62/100

---

## TABLE DES MATIERES

1. [Etat des lieux](#1-etat-des-lieux)
2. [Corrections critiques (sprint immediat)](#2-corrections-critiques)
3. [Gameplay & Game Feel (sprint court)](#3-gameplay--game-feel)
4. [Features majeures (sprints dedies)](#4-features-majeures)
5. [Outillage Claude Code](#5-outillage-claude-code)
6. [Roadmap par phase](#6-roadmap-par-phase)
7. [Equilibrage detaille](#7-equilibrage-detaille)
8. [Architecture ideale des fichiers](#8-architecture-ideale)

---

## 1. ETAT DES LIEUX

### Ce qui marche bien (ne pas toucher)
- Moteur petanque (Ball.js ~380 lignes, PetanqueEngine.js ~550 lignes) — COR 0.62, friction lineaire, sub-stepping, loft, retro, pente, zones, rebonds
- 6 personnages avec archetypes distincts et IA par personnalite
- 5 terrains avec proprietes physiques uniques
- Arcade 5 rounds + narratif
- SoundManager avec fallback procedural
- SaveManager v2 avec migration
- 138 tests unitaires + 85 E2E

### Ce qui ne marche pas
- Le joueur ne comprend pas quoi faire (pas de tutoriel in-game)
- Le Rookie est punitif (stats basses + 0 reward en defaite)
- Le game feel est pauvre (terrain = rectangle, pas de camera dynamique)
- L'economie est trop lente pour les casuals
- 18 contradictions entre la doc et le code
- 5 bugs techniques (ShopScene monnaie, TitleScene init, VSIntro global, etc.)

---

## 2. CORRECTIONS CRITIQUES

> **Duree totale** : ~2h
> **Regle** : commiter apres chaque bloc

### 2.1 Contradictions doc/code (30 min)

Lire PLAN_CORRECTIONS.md Bloc 1 pour le detail exact. Resume :

| # | Quoi | Ou | Correction |
|---|------|----|-----------|
| 1 | CLAUDE.md COR 0.85 | CLAUDE.md ligne 115 | Deja corrige dans le nouveau CLAUDE.md |
| 2 | boules.json physics section | public/data/boules.json | Supprimer section "physics" (valeurs mortes) |
| 3 | Docks friction 0.4 vs 0.7 | terrains.json | Changer a 0.7 |
| 4 | Sable friction 3.5 vs 3.0 | Constants.js TERRAIN_FRICTION | Changer a 3.0 |
| 5 | Rookie seuils 18/26/34 | SPRINT_FINAL.md | Corriger en 18/24/32 |
| 6 | Rookie stats 3/3/2/2 vs 4/4/3/3 | SPRINT_FINAL.md | Corriger en 4/4/3/3 (14 pts) |
| 7 | Reyes total 31 vs 32 | CAHIER_DES_CHARGES.md | Corriger en 32 (8/8/7/9) |
| 8 | "Ecus" partout | SPRINT_FINAL.md | Remplacer par "Galets" |
| 9 | Ombres 2 couleurs | GAME_DESIGN.md | Documenter les 2 niveaux |

### 2.2 Bugs de code (20 min)

| # | Bug | Fichier | Fix |
|---|-----|---------|-----|
| 1 | ShopScene affiche "E" au lieu de "G" | ShopScene.js ~247 | `${item.price} E` → `${item.price} G` |
| 2 | TitleScene pas de init() | TitleScene.js | Ajouter init() avec reset des flags |
| 3 | window.__vsIntroCount | VSIntroScene.js | Remplacer par this.registry |
| 4 | Marcel IA doc 0.80x vs code 0.65x | CAHIER_DES_CHARGES.md | Mettre a jour le doc (code est intentionnel) |
| 5 | Determination doc -50% vs code -80% | SPRINT_FINAL.md | Corriger en -80% |

### 2.3 progression.json incomplet (5 min)

Ajouter les deblocages arcade et milestones dans `public/data/progression.json` (voir PLAN_CORRECTIONS.md Bloc 2.6 pour le JSON exact).

---

## 3. GAMEPLAY & GAME FEEL

> **Duree totale** : ~3h
> **Impact joueur** : enorme

### 3.1 Compensation defaite (15 min) — CRITIQUE

**Pourquoi** : Un joueur casual qui perd et ne recoit RIEN ferme le jeu. C'est le point de retention #1.

**Quoi** :
- Ajouter `GALET_LOSS = 15` et `ROOKIE_XP_LOSS = 1` dans Constants.js
- Dans ResultScene.js, donner des galets + XP meme en defaite
- Afficher "+15 Galets" et "+1 XP" sur l'ecran de defaite

**Fichiers** : Constants.js, ResultScene.js

### 3.2 Equilibrage personnages (15 min) — IMPORTANT

**Nerf Reyes** : 8/8/7/9 (32) → 7/7/7/8 (29)
- Toujours "complet" mais ne domine plus le roster

**Buff La Choupe** : 5/10/3/6 (24) → 6/10/3/8 (27), IA angleDev 7→9
- Plus viable, reste bourrin, premier adversaire plus accessible

**Fichier** : public/data/characters.json

### 3.3 Economie (10 min) — IMPORTANT

Doubler tous les gains de Galets :
```
GALET_WIN_ARCADE = 100      (etait 50)
GALET_WIN_QUICKPLAY = 40    (etait 20)
GALET_CARREAU_BONUS = 15    (etait 10)
GALET_ARCADE_COMPLETE = 150  (etait 100)
GALET_ARCADE_PERFECT = 300   (etait 200)
GALET_STARTING = 100         (etait 50)
```
Les prix du shop restent identiques. SaveManager default galets = 100.

**Fichiers** : Constants.js, SaveManager.js

### 3.4 Mode 2 boules / 7 points (15 min) — IMPORTANT

Sweet spot entre le standard (3 boules, 13 pts, ~8 min) et l'express (1 boule, 11 pts, ~2 min).

**Quoi** : Ajouter format `'deux_boules'` dans PetanqueEngine.js et QuickPlayScene.js.
- 2 boules par joueur, victoire a 7 points, match ~4-5 min

**Fichiers** : PetanqueEngine.js (~58), QuickPlayScene.js

### 3.5 Terrains verouilles (5 min)

Docks et Plage = `"unlocked": false` dans terrains.json (coherence avec progression arcade).

---

## 4. FEATURES MAJEURES

> Chaque feature ci-dessous merite son propre plan (`/pre-feature`).
> Ne pas les faire toutes d'un coup. Une par session.

### 4.1 Tutoriel interactif dans le premier match (~4h) — CRITIQUE

**Pourquoi** : Le TutorialScene actuel est un diaporama que personne ne lit. Le joueur CrazyGames/Poki doit comprendre en 30 secondes.

**Concept** : Overlay dans le premier match Arcade (Round 1 vs La Choupe) :
- Lancer 1 (cochonnet) : "Glissez dans la direction, relachez" + fleche animee
- Lancer 2 (premiere boule) : "Placez-vous pres de la boule jaune" + zone cible
- Lancer 3 : "Bravo ! Continuez" + mode libre
- Techniques avancees (plombee, tir, retro) : introduites aux rounds 2-3, pas au debut

**Fichiers a modifier** : PetanqueScene.js (overlay), ArcadeScene.js (detection premier match), SaveManager.js (flag `tutorialInGameSeen`)

**Ce qu'il faut eviter** : Ne pas forcer le joueur a lire du texte. Que du visuel et de l'action.

**Reference** : research/36_onboarding_tutorial_design.md

### 4.2 Camera follow + zoom slow-mo (~3h) — CRITIQUE

**Pourquoi** : La decision "pas de camera" est la pire du projet. Tous les jeux de sport a succes ont des moments de camera dramatiques. Le slow-mo est deja code mais sans camera = invisible.

**ATTENTION** : Il existe un feedback memoire `feedback_no_camera_movement.md` qui interdit la camera. **Cette decision doit etre explicitement reversee par le owner du projet avant implementation.** Demander confirmation.

**Concept** :
- Camera lerp pour suivre la boule en mouvement (lerp 0.08, pas de snap brutal)
- Zoom 1.3x quand la boule approche du cochonnet (< 40px) et slow-mo actif
- Retour smooth au centre quand c'est au joueur de jouer
- PAS de replay (trop complexe pour maintenant)

**Fichiers** : PetanqueScene.js (camera setup), PetanqueEngine.js (hooks camera)

**Reference** : research/47_camera_slowmo_2d_sports.md

### 4.3 Visuel terrain (~3h) — IMPORTANT

**Pourquoi** : Les terrains sont des rectangles de couleur unie. Premiere impression visuelle mediocre.

**Concept** : Utiliser les textures deja generees (`terrain_tex_*.png`) comme tileSprite au lieu de Graphics.fillRect.

**Prerequis** : Verifier que les fichiers de texture existent dans public/assets/. Si non, les generer avec `/tileset`.

**Fichiers** : TerrainRenderer.js (_drawSurface, _drawBorders, _drawBackgroundDecor)

**Reference** : research/20_plan_amelioration_scene_petanque.md, research/22_faisabilite_ameliorations_phaser3.md

### 4.4 Audio layering carreau (~2h) — IMPORTANT

**Pourquoi** : Le "clac" metallique est LE moment du jeu. Un seul SFX ne suffit pas — il faut 3 couches.

**Concept** :
- Couche 1 : impact sec (2-4 kHz, < 50ms) — le "clac"
- Couche 2 : resonance metallique (400-800 Hz, 200ms) — le "ring"
- Couche 3 : echo/reverb court (100-200ms) — l'espace

**Methode** : Generer les 3 couches avec `/sfx`, les jouer simultanement dans sfxCarreau()

**Fichiers** : SoundManager.js, public/assets/audio/sfx/

**Reference** : research/49_sound_design_impact_sports.md

### 4.5 Feedback visuel de progression (~2h) — IMPORTANT

**Pourquoi** : Le joueur ne voit pas sa progression. Pas de barre XP, pas de compteur Galets visible, pas de notification de deblocage.

**Concept** :
- Barre XP Rookie en bas de l'ecran ArcadeScene
- Compteur Galets sur TitleScene (a cote de "Boutique")
- Badge "NOUVEAU" sur les items recemment debloques
- Toast notification quand on approche d'un palier de capacite

**Fichiers** : ArcadeScene.js, TitleScene.js, ShopScene.js, ResultScene.js

### 4.6 Capacites adversaires visibles (~1h) — NICE-TO-HAVE

**Pourquoi** : Quand Ley active "Carreau Instinct" ou Reyes active "Le Mur", le joueur ne voit pas de difference.

**Concept** : Flash visuel + texte court quand l'IA utilise une capacite :
- "Carreau Instinct !" (texte rouge + aura sur la boule de Ley)
- "Le Mur !" (texte bleu + boule grossit visuellement)
- "Coup de Canon !" (texte orange + screen shake)

**Fichier** : PetanqueScene.js (dans les hooks onThrow)

### 4.7 Resolution 16:9 pour Poki (~2h) — NICE-TO-HAVE

**Pourquoi** : 832x480 (1.73:1) n'est pas compatible avec Poki qui exige 16:9.

**Concept** : Passer a 854x480 (16:9) ou ajouter du letterboxing adaptatif.

**Risque** : Change toute l'UI. A faire apres que le jeu soit stable.

**Reference** : research/54_web_portals_technical_requirements.md

### 4.8 Sons d'ambiance manquants (~1h) — NICE-TO-HAVE

**Pourquoi** : Le SoundManager a le mapping par terrain, mais certains fichiers audio n'existent pas (sfx_vagues, sfx_oiseaux). Fallback = cigales partout ou silence.

**Methode** : Verifier quels fichiers existent dans public/assets/audio/sfx/, generer les manquants avec `/sfx`.

### 4.9 Portraits HD 128x128 (~2h) — NICE-TO-HAVE

**Pourquoi** : CharSelectScene utilise des cercles de couleur proceduraux au lieu de vrais portraits.

**Methode** : Generer un portrait par personnage avec `/sprite`, integrer dans CharSelectScene.

### 4.10 Versus Local (~4h) — PHASE 2

2 joueurs meme ecran, alternance, meme AimingSystem. Necessite :
- CharSelectScene pour 2 joueurs
- PetanqueEngine avec 2 humains
- Indication "Tour J1 / Tour J2"

### 4.11 Daily Challenge (~3h) — PHASE 2

Match quotidien avec seed date. Perso, terrain, conditions imposes. Score a battre.

### 4.12 Replay du meilleur tir (~6h) — PHASE 3

Enregistrement des positions frame par frame, rejeu en slow-mo. Complexe.

---

## 5. OUTILLAGE CLAUDE CODE

### 5.1 Skills a creer

**`/pre-feature [nom]`** : Planifier avant de coder. Lire le code, identifier les fichiers, proposer un plan, attendre validation. (Voir PLAN_CORRECTIONS.md Bloc 7.1 pour le contenu complet du SKILL.md)

**`/post-feature`** : Verifier apres implementation. Lancer tests, chercher console.log, verifier coherence, mettre a jour doc. (Voir PLAN_CORRECTIONS.md Bloc 7.2)

**`/session-end`** : Cloturer proprement. Commiter, lancer tests, mettre a jour memoire et CAHIER. (Voir PLAN_CORRECTIONS.md Bloc 7.3)

### 5.2 Mettre a jour le skill /sprite

Remplacer l'ancien roster (papet, bastien, fanny, ricardo, marius) par le roster actuel (Rookie, Ley, Le Magicien, La Choupe, Marcel, Reyes) dans `.claude/skills/sprite/SKILL.md`.

### 5.3 Hooks

Ajouter dans `.claude/settings.local.json` un hook PostToolUse qui lance les tests apres chaque edit de fichier. (Voir PLAN_CORRECTIONS.md Bloc 9 pour le JSON exact)

### 5.4 Memoire

Consolider 44 fichiers → ~20 :
- Fusionner les 5 notes de session en 1 `project_state.md`
- Supprimer `project_commercial_strategy.md` (obsolete)
- Fusionner `project_sprint_final.md` + `project_sprint_final_session_18mars.md`
- Nettoyer MEMORY.md (garder sous 100 lignes)

(Voir PLAN_CORRECTIONS.md Bloc 8 pour le detail)

---

## 6. ROADMAP PAR PHASE

### Phase IMMEDIATE (~5h) — "Le jeu marche correctement"

| # | Quoi | Duree | Impact |
|---|------|-------|--------|
| 1 | Contradictions doc/code (§2.1) | 30min | Fiabilite |
| 2 | Bugs de code (§2.2) | 20min | Fiabilite |
| 3 | Compensation defaite (§3.1) | 15min | Retention x2 |
| 4 | Equilibrage persos (§3.2) | 15min | Balance |
| 5 | Economie galets (§3.3) | 10min | Retention casual |
| 6 | Mode 2 boules (§3.4) | 15min | Duree matchs |
| 7 | Terrains verouilles (§3.5) | 5min | Coherence |
| 8 | Outillage Claude Code (§5) | 30min | Productivite future |
| 9 | CLAUDE.md refonte | Deja fait | — |
| 10 | Reorganisation fichiers (§8) | 15min | Clarte |

### Phase COURT TERME (~12h) — "Le jeu est fun"

| # | Quoi | Duree | Impact |
|---|------|-------|--------|
| 11 | Tutoriel interactif (§4.1) | 4h | Retention x3 |
| 12 | Camera follow + zoom (§4.2) | 3h | Game feel x5 |
| 13 | Visuel terrain (§4.3) | 3h | Premiere impression |
| 14 | Audio layering carreau (§4.4) | 2h | Satisfaction |

### Phase MOYEN TERME (~8h) — "Le jeu a du contenu"

| # | Quoi | Duree | Impact |
|---|------|-------|--------|
| 15 | Feedback progression (§4.5) | 2h | Motivation joueur |
| 16 | Capacites visibles (§4.6) | 1h | Lisibilite |
| 17 | Sons ambiance (§4.8) | 1h | Immersion |
| 18 | Portraits HD (§4.9) | 2h | Qualite visuelle |
| 19 | Resolution 16:9 (§4.7) | 2h | Distribution Poki |

### Phase LONG TERME (~14h) — "Le jeu est un produit"

| # | Quoi | Duree |
|---|------|-------|
| 20 | Versus Local (§4.10) | 4h |
| 21 | Daily Challenge (§4.11) | 3h |
| 22 | Mobile touch + Capacitor | 4h |
| 23 | Publication itch.io + Poki/CrazyGames | 3h |

---

## 7. EQUILIBRAGE DETAILLE

### Stats actuelles vs proposees

| Perso | Stats actuelles | Total | Stats proposees | Total | Changement |
|-------|----------------|-------|-----------------|-------|-----------|
| Rookie | 4/4/3/3 | 14 | Inchange | 14 | — |
| La Choupe | 5/10/3/6 | 24 | 6/10/3/8 | 27 | +3 pts (precision, sang-froid) |
| Marcel | 8/5/5/8 | 26 | Inchange | 26 | — |
| Le Magicien | 10/4/7/9 | 30 | Inchange | 30 | — |
| Ley | 8/9/9/5 | 31 | Inchange | 31 | — |
| Reyes | 8/8/7/9 | 32 | 7/7/7/8 | 29 | -3 pts (plus equilibre) |

### Economie

| Source | Avant | Apres |
|--------|-------|-------|
| Victoire Arcade | 50 G | 100 G |
| Victoire Quick Play | 20 G | 40 G |
| Defaite | 0 G | 15 G |
| Carreau bonus | 10 G | 15 G |
| Run Arcade complete | 100 G | 150 G |
| Run parfaite | 200 G | 300 G |
| Starter | 50 G | 100 G |
| XP Rookie defaite | 0 | +1 pt |

### Temps pour acheter (estimation)

| Joueur | Galets/heure | Premiere boule (150G) | Boule Titane (800G) |
|--------|-------------|----------------------|---------------------|
| Casual (1 win/3 matchs) | ~40 G/h | ~4h | ~20h |
| Moyen (1 win/2 matchs) | ~80 G/h | ~2h | ~10h |
| Hardcore (80% win) | ~160 G/h | ~1h | ~5h |

---

## 8. ARCHITECTURE IDEALE DES FICHIERS

### Racine du projet (apres reorganisation)

```
/
  CLAUDE.md                 # Regles et conventions (court, actionnable)
  GAME_DESIGN.md            # Bible game design (concept, personnages, terrains)
  CAHIER_DES_CHARGES.md     # Etat du projet (fait / a faire)
  STORY.md                  # Histoire (reserve Phase D)

  /docs
    MASTER_PLAN.md           # CE FICHIER — plan d'action complet
    /archive                 # Documents historiques
      HANDOFF.md             # Ancien handoff (obsolete)
      PLAN_MVP.md            # Ancien plan 5 sprints (historique)
      SPRINT_FINAL.md        # Plan sprint final 18 mars (partiellement obsolete)
      INFRA_RESEARCH.md      # Recherche infra (Phase E)
      LORE_PETANQUE.md       # Lore petanque (reference)
      CONTRE_ANALYSE.md      # Audit 20 mars (justification du MASTER_PLAN)
      PLAN_CORRECTIONS.md    # Plan corrections initial (absorbe dans MASTER_PLAN)
      PROMPT_NEXT_SESSION.md # Ancien prompt
    /plans                   # Plans specifiques par feature (generes par /pre-feature)

  /research                  # 56 fichiers de recherche (reference a la demande)
  /src                       # Code source
  /public                    # Donnees JSON + assets
  /tests                     # Tests unitaires + E2E
  /scripts                   # Utilitaires
  /assets                    # Assets bruts (sprites, tilesets)
  /archives                  # Anciens assets
```

### Ce qui est DEPLACE (pas supprime)

| Fichier | De | Vers | Raison |
|---------|----|----|--------|
| HANDOFF.md | racine | docs/archive/ | Obsolete (ancien roster) |
| PLAN_MVP.md | racine | docs/archive/ | Historique (plan initial) |
| SPRINT_FINAL.md | racine | docs/archive/ | Partiellement obsolete, absorbe dans MASTER_PLAN |
| INFRA_RESEARCH.md | racine | docs/archive/ | Phase E, pas pertinent maintenant |
| LORE_PETANQUE.md | racine | docs/archive/ | Reference optionnelle |
| CONTRE_ANALYSE.md | racine | docs/archive/ | Justification du MASTER_PLAN |
| PLAN_CORRECTIONS.md | racine | docs/archive/ | Absorbe dans MASTER_PLAN |
| PROMPT_NEXT_SESSION.md | racine | docs/archive/ | Plus necessaire avec le nouveau workflow |

### Ce qui RESTE a la racine

- `CLAUDE.md` — lu automatiquement par Claude Code
- `GAME_DESIGN.md` — bible design, reference active
- `CAHIER_DES_CHARGES.md` — etat du projet, reference active
- `STORY.md` — reserve Phase D mais important pour la coherence narrative

### Resultat

**Avant** : 12 fichiers .md a la racine (confusion)
**Apres** : 4 fichiers .md a la racine (clarte) + tout le reste organise dans docs/

---

## COMMENT UTILISER CE DOCUMENT

### En debut de session
1. Lire CLAUDE.md (regles)
2. Lire ce MASTER_PLAN.md (quoi faire)
3. Regarder la roadmap §6 pour savoir ou on en est
4. Commencer par le prochain item non fait

### Avant de coder une feature
1. Trouver la feature dans §4
2. Lire sa description, ses fichiers, ses references
3. Utiliser `/pre-feature` pour planifier
4. Implementer
5. Utiliser `/post-feature` pour verifier

### En fin de session
1. Utiliser `/session-end`
2. Cocher les items termines dans ce document
3. Mettre a jour CAHIER_DES_CHARGES.md

### Quand quelque chose ne marche pas
1. Chercher dans §2 (corrections critiques) si c'est un bug connu
2. Chercher dans §7 (equilibrage) si c'est un probleme de balance
3. Si c'est nouveau, l'ajouter a CAHIER_DES_CHARGES.md section "Reste a implementer"
