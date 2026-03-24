# PLAN PHASE 3 — Profondeur Technique & Polish

> **Objectif** : Passer de "proto jouable" a "vrai jeu de petanque" en ajoutant la profondeur technique manquante.
> **Prerequis** : PLAN_100 ✅ + PLAN_PHASE2 ✅ (218 tests, build OK, 5 terrains, 12 persos)
> **Estimation** : 6 axes, ~1 session Sonnet 4.6 chacun (~3-4h par axe)
> **Priorite** : par impact joueur (pas par difficulte technique)
>
> **Avancement** : AXE A ✅ (24 mars 2026, 232 tests, commit d0931f9)

---

## AXE A — TECHNIQUES DE TIR & CIBLAGE ✅ (Impact: ★★★★★)

> Le jeu n'a qu'un seul type de tir (tir au fer). En vrai petanque, il y en a 5.
> C'est le gap le plus visible pour un joueur qui connait la petanque.

### A1. Tir a la rafle (balle rase le sol avant impact)

**Fichiers** : `src/utils/Constants.js`, `src/petanque/AimingSystem.js`

- `Constants.js` : Ajouter preset LOFT_PRESETS.RAFLE :
  ```js
  RAFLE: { landingFactor: 0.20, arcHeight: -5, flyDurationMult: 0.3, rollEfficiency: 0.85, retro: false }
  ```
- `AimingSystem.js` : Dans `_buildModeSelector()` (~ligne 149-235), ajouter un 5e bouton "Rafle" dans la grille de selection mode tir. Icone : arc rasant (ligne horizontale avec legere courbe).
- `AimingSystem.js` : Dans `_onModeSelect()`, ajouter le cas `'rafle'` qui utilise le preset RAFLE.

**Tests** : `tests/Gameplay.test.js` — Ajouter :
- Rafle landing factor < demi-portee
- Rafle roll efficiency > plombee
- Rafle arc height minimal

### A2. Tir devant (atterrit 20-30px avant la cible, roule vers impact)

**Fichiers** : `src/utils/Constants.js`, `src/petanque/PetanqueEngine.js`

- `Constants.js` : Verifier que LOFT_PRESETS.TIR_DEVANT existe deja (il existe : `landingFactor: 0.85, arcHeight: -55`).
- `AimingSystem.js` : Verifier que le bouton [D] est fonctionnel et bien accessible dans l'UI mode tir. S'assurer qu'il est visible dans la grille de selection.
- **Si deja present** : valider avec un test E2E que la balle atterrit bien avant la cible.

### A3. Ciblage cochonnet joueur

**Fichiers** : `src/petanque/AimingSystem.js`, `src/petanque/PetanqueEngine.js`

- `AimingSystem.js` : Ajouter un toggle [B] (But) dans l'UI de visee (~ligne 414+) qui change la cible de "boule adverse la plus proche" a "cochonnet".
- `PetanqueEngine.js` : Dans `throwBall()` (~ligne 382-476), si `targetCochonnet === true`, orienter la trajectoire vers `this.cochonnet` au lieu de la boule adverse.
- L'IA le fait deja (`targetsCocho: true` dans certaines strategies). Juste exposer au joueur.

### A4. Reorganiser l'UI de selection de mode

**Fichier** : `src/petanque/AimingSystem.js`

- Actuellement 4 boutons (Roulette/Demi/Plombee/Tirer).
- Reorganiser en 2 rangees :
  - **Pointer** : Roulette | Demi-Portee | Plombee
  - **Tirer** : Rafle | Tir au Fer | Tir Devant
- Toggle [B] pour ciblage cochonnet (disponible en mode Tirer)
- Verifier que les keybinds (1-6 ou fleches) fonctionnent.

**Tests a ajouter** : `tests/PetanqueEngine.test.js`
- computeThrowParams avec loft RAFLE
- computeThrowParams avec targetCochonnet = true
- Validation que tous les 6 loft presets ont des parametres valides

### A5. Rendre le stat Effet utile au joueur

> Le stat "Effet" (1-10) existe pour tous les personnages mais n'a AUCUN impact cote joueur.
> Seule l'IA l'utilise pour decider la proba de retro. C'est trompeur.

**Fichier** : `src/petanque/Ball.js`

Ajouter un systeme de spin lateral post-atterrissage :
- Quand le joueur active un effet lateral (toggle [E] gauche, [E] a nouveau = droite, [E] = off) :
  - Apres atterrissage, appliquer une force laterale proportionnelle a `effetStat / 10 * spinIntensity`
  - Direction perpendiculaire a la trajectoire
  - Dure 20-30 frames puis decroit lineairement
  - Affecte AUSSI le retro existant (retro = spin arriere, lateral = spin cote)

**Fichier** : `src/petanque/AimingSystem.js`

- Ajouter toggle [E] pour activer/cycler l'effet lateral (off → gauche → droit → off)
- Indicateur visuel : fleche laterale a cote de la boule dans l'UI de visee
- L'intensite du spin depend du stat Effet du personnage (1 = minimal, 10 = fort)

**Fichier** : `src/utils/Constants.js`

```js
LATERAL_SPIN_FORCE: 0.08,    // Force laterale de base (multipliee par effetStat/10)
LATERAL_SPIN_FRAMES: 25,     // Duree de l'effet en frames
```

**Fichier** : `src/petanque/PetanqueAI.js`

L'IA utilise deja `effet` pour le retro. Ajouter : si `effet >= 6`, probabilite d'utiliser spin lateral = `(effet - 5) / 5` (donc effet 6 = 20%, effet 10 = 100%). Direction choisie intelligemment selon la position des boules.

**Tests** : `tests/Gameplay.test.js`
- Spin lateral gauche devie la boule a gauche
- Spin lateral droit devie a droite
- Intensite proportionnelle a effetStat
- Spin = 0 quand effet desactive

---

## AXE B — FEEDBACK & RESULTATS DE TIR (Impact: ★★★★☆)

> En vrai petanque, chaque tir a un nom. "PALET !", "Casquette...", "CISEAU !!".
> Actuellement seul le carreau est detecte. Ajouter le vocabulaire = authenticite.

### B1. Detection des resultats de tir

**Fichier** : `src/petanque/PetanqueEngine.js` (~ligne 1171-1300, `_detectShotResult()`)

La methode existe deja avec 9 cas en priorite. Verifier chaque detection :

| Resultat | Detection actuelle | Correction necessaire |
|----------|-------------------|----------------------|
| **Carreau** (<24px) | ✅ Fonctionne | - |
| **Palet** | ⚠️ Mesure distance au cochonnet | Mesurer distance au point d'impact original de la cible |
| **Casquette** (effleurement) | ⚠️ A verifier | Seuil de deplacement cible < 8px apres collision |
| **Ciseau** (2+ cibles touchees) | ⚠️ A verifier | Counter de collisions dans le meme throw |
| **Biberon** (touche cochonnet en pointant) | ⚠️ A verifier | Detecter si pointeur + collision cochonnet |
| **Contre** (touche allie) | ⚠️ A verifier | Verifier team de la cible = team du tireur |
| **Trou** (rate completement) | ⚠️ A verifier | Aucune collision pendant le throw |
| **Recul** | ⚠️ Band trop etroite (0.8-5) | Detecter par direction post-impact (dot product < 0) |

Pour chaque resultat, verifier que `_detectShotResult()` renvoie le bon type. Corriger les seuils si necessaire.

### B2. Affichage texte flottant par resultat

**Fichier** : `src/petanque/EngineRenderer.js` (~ligne 211-223, `showShotLabel()`)

La methode `showShotLabel()` existe. Ajouter les couleurs/tailles par resultat :

```js
const SHOT_LABEL_STYLES = {
  carreau:   { text: 'CARREAU !',    color: '#FFD700', size: 20, duration: 2000 },
  palet:     { text: 'PALET !',      color: '#C0C0C0', size: 16, duration: 1500 },
  casquette: { text: 'Casquette...', color: '#888888', size: 14, duration: 1200 },
  ciseau:    { text: 'CISEAU !!',    color: '#FFD700', size: 20, duration: 2000 },
  biberon:   { text: 'BIBERON !',    color: '#FFD700', size: 18, duration: 1800 },
  contre:    { text: 'CONTRE !',     color: '#FF4444', size: 16, duration: 1500 },
  trou:      { text: 'Trou...',      color: '#666666', size: 14, duration: 1000 },
  recul:     { text: 'Recul',        color: '#AAAAAA', size: 14, duration: 1000 },
};
```

Ajouter dans `Constants.js` section SHOT_RESULT_STYLES.

### B3. SFX par resultat

**Fichier** : `src/utils/SoundManager.js`

Pour chaque resultat, un SFX procedural distinct :
- **Palet** : impact metallique + grattement (la boule prend la place)
- **Casquette** : petit "tac" sec + silence
- **Ciseau** : double impact rapide (tac-tac!)
- **Biberon** : son leger bois + "ohhh" crowd
- **Contre** : impact sourd + "aie" crowd
- **Trou** : impact terre mate + silence genant

Ajouter methodes `sfxPalet()`, `sfxCasquette()`, etc. avec fallback procedural.

### B4. Barks contextuels par resultat

**Fichier** : `public/data/characters.json`

Ajouter dans `barks` de chaque personnage :
```json
"carreau_victim": ["Aie ! Un carreau !"],
"palet_success": ["Et je prends la place !"],
"contre_self": ["Non ! Ma propre boule !"],
"fanny_win": ["13-0 ! La fanny !"],
"fanny_lose": ["La honte..."]
```

**Tests** : `tests/TerrainValidation.test.js` — Verifier que chaque personnage a les nouveaux barks.

---

## AXE C — NETTOYAGE & ROBUSTESSE (Impact: ★★★☆☆)

> Pas visible pour le joueur, mais critique pour la stabilite et la maintenabilite.

### C1. Supprimer IntroScene (dead code)

**Fichiers** :
- Supprimer `src/scenes/IntroScene.js` entierement
- `src/config.js` : Retirer IntroScene de la liste des scenes
- `src/scenes/TitleScene.js` : Retirer toute reference a IntroScene

### C2. Fix TitleScene setTimeout

**Fichier** : `src/scenes/TitleScene.js` (~ligne 208)

Remplacer :
```js
setTimeout(() => { ... }, 600);
```
Par :
```js
this.time.delayedCall(600, () => { ... });
```

### C3. Fix AimingSystem keyboard listener leak

**Fichier** : `src/petanque/AimingSystem.js`

Dans `_onTurnChange()` : avant d'ajouter de nouveaux listeners, appeler `_removeAllKeyListeners()`.
Creer `_removeAllKeyListeners()` qui off() chaque key (F, R, D, C, V, 1-6).

### C3b. Fix QuickPlayScene missing _shutdown() + ESC

**Fichier** : `src/scenes/QuickPlayScene.js`

- Ajouter methode `_shutdown()` qui fait `this.input.keyboard.removeAllListeners()`
- Enregistrer dans create() : `this.events.once('shutdown', this._shutdown, this)`
- Ajouter handler ESC : `this.input.keyboard.on('keydown-ESC', () => this.scene.start('TitleScene'))`

### C3c. Fix LevelUpScene ESC → returnScene

**Fichier** : `src/scenes/LevelUpScene.js` (~ligne 179)

Remplacer :
```js
this.scene.start('TitleScene')
```
Par :
```js
this.scene.start(this.returnScene || 'TitleScene', this.returnData)
```

### C3d. Fix ResultScene _postDialogDone safety

**Fichier** : `src/scenes/ResultScene.js`

Ajouter un timeout de securite : si `_postDialogDone` n'est pas true apres 10s, le forcer a true.
```js
this.time.delayedCall(10000, () => { if (!this._postDialogDone) this._postDialogDone = true; });
```
Cela garantit que le joueur n'est jamais bloque.

### C4. Consolider SaveManager duplication

**Fichier** : `src/utils/SaveManager.js`

- Supprimer les champs root `totalWins`, `totalLosses`, `totalCarreaux` du schema par defaut
- Migrer : si `data.totalWins` existe au root, copier vers `data.stats.totalWins` puis supprimer
- Grep tout le codebase pour `save.totalWins` (sans `.stats.`) et corriger

### C5. Remplacer rollEfficiency 16.0 par flag flyOnly

**Fichier** : `src/utils/Constants.js` (LOFT_PRESETS.TIR)

Le rollEfficiency 16.0 est un hack opaque. Le remplacer par un flag explicite :
```js
TIR: { landingFactor: 0.95, arcHeight: -100, flyDurationMult: 1.2, rollEfficiency: 0.3, flyOnly: true, retro: true }
```

**Fichier** : `src/petanque/Ball.js`

Dans `launch()` ou `update()`, si `flyOnly === true` : la balle ne roule presque pas apres atterrissage (rollEfficiency ~0.3). Supprimer le magic number 16.0.

**Fichier** : `src/petanque/PetanqueEngine.js`

Dans `computeThrowParams()`, si `loft.flyOnly`, utiliser une rollEfficiency faible au lieu de 16.0.

**Tests** : Mettre a jour `tests/Gameplay.test.js` — le test "tir highest rolling efficiency" doit verifier flyOnly flag, pas rollEfficiency 16.0.

### C6. Nettoyer boules.json dead code

**Fichier** : `public/data/boules.json` (~ligne 188-189)

Supprimer l'objet `cochonnet` orphelin qui duplique la definition cochonnets.

### C7. Fix EngineRenderer object pooling (sparks/dust)

**Fichier** : `src/petanque/EngineRenderer.js`

Creer un pool simple pour Graphics objects :
```js
_getPooledGraphics() {
  if (this._pool.length > 0) return this._pool.pop();
  return this.scene.add.graphics();
}
_returnToPool(g) {
  g.clear();
  g.setVisible(false);
  this._pool.push(g);
}
```
Utiliser dans `showDust()`, `showCollisionSparks()`, `showRollTrail()`.

### C8. Extraire hardcoded values des scenes

**Fichiers** : `src/utils/Constants.js` + scenes concernees

| Valeur | Source | Constante |
|--------|--------|-----------|
| typewriterSpeed 28-30ms | ArcadeScene, VSIntroScene | TYPEWRITER_SPEED (existe deja dans Constants ?) |
| Couleurs difficulte | VSIntroScene:233-328 | DIFFICULTY_COLORS map |
| BAR_WIDTH 200px | LevelUpScene:16 | STAT_BAR_WIDTH |
| CARD_W 138px | ShopScene:19 | SHOP_CARD_WIDTH |

**Tests** : `tests/SceneReuse.test.js`
- Remplacer les checks regex par des tests fonctionnels qui importent les scenes et verifient que init() reset les flags cles.

---

## AXE D — TESTS CRITIQUES (Impact: ★★★☆☆)

> 218 tests passent mais des pans entiers du gameplay ne sont pas testes.

### D1. Tests slopes (Colline)

**Fichier** : `tests/Gameplay.test.js`

Ajouter suite "Slope Physics" :
- Balle sur pente descend plus vite (gravity_component > 0)
- Balle sur pente monte plus lentement
- Balle s'arrete sur pente grace au timeout 120 frames
- 3 slope_zones de Colline avec gravity_component 0.04, 0.05, 0.06
- Balle traverse une zone slope puis zone plate : vitesse change

### D2. Tests wall bounces (Docks)

**Fichier** : `tests/Gameplay.test.js`

Ajouter suite "Wall Rebounds" :
- Balle touche mur droit, rebondit (vx inverse)
- Balle touche mur gauche, rebondit
- WALL_RESTITUTION applique correctement (perte d'energie)
- Balle morte (dead) ne rebondit pas

### D3. Tests match flow integration

**Fichier** : Nouveau `tests/MatchFlow.test.js`

Simuler un mini-match :
1. Placer cochonnet
2. Joueur lance boule (pres du cochonnet)
3. Adversaire lance boule (plus loin)
4. Scoring : joueur = 1 point
5. Mene suivante : roles inverses
6. Verification que le score accumule

### D4. Tests AimingSystem

**Fichier** : Nouveau `tests/AimingSystem.test.js`

- Wobble amplitude proportionnelle a precision stat
- Wobble = 0 quand Focus actif
- Pression wobble a 10-10 (sang_froid affect amplitude)
- Angle clamp dans les bornes du terrain

### D5. Tests SceneReuse fonctionnels

**Fichier** : `tests/SceneReuse.test.js`

Remplacer les regex par imports reels :
```js
import { PetanqueScene } from '../src/scenes/PetanqueScene.js';
// Verifier que init() reset _gamePaused, _pauseContainer, engine, etc.
```

### D6. Tests collision edge cases

**Fichier** : `tests/Ball.test.js`

- Triple collision (3 boules proches)
- Collision avec boule morte (ignoree)
- Collision a vitesse maximale (MAX_THROW_SPEED)
- Collision pres du bord (ball + wall en meme frame)

---

## AXE E — AUDIO ENRICHI (Impact: ★★★☆☆)

> 14 SFX seulement. Pas de son par resultat. Le commentateur est une coquille vide.

### E1. SFX par resultat de tir

Voir B3 ci-dessus. 6 nouveaux SFX proceduraux dans SoundManager.js.

### E2. Ambiance terrain differentie

**Fichier** : `src/utils/SoundManager.js`

Ajouter des ambiances de fond par terrain :
- **Village** : cigales + vent leger
- **Plage** : vagues + mouettes
- **Parc** : oiseaux + enfants au loin
- **Colline** : vent + cloches de chevre
- **Docks** : grincements metal + eau clapotis

Implementation : boucle Web Audio avec gain fade-in/fade-out a l'entree/sortie de PetanqueScene.

### E3. Commentateur basique

**Fichier** : `src/petanque/EngineRenderer.js` ou nouveau `src/audio/Commentator.js`

Phrases texte affichees (pas audio) en haut de l'ecran, style "commentaire TV" :
- "Premier lancer de la mene !"
- "C'est serre !" (2 boules < 5cm)
- "Magnifique carreau !"
- "La pression monte a 10-10 !"

Banque de 30-50 phrases dans `public/data/commentator.json`. Affichage via texte temporaire (3s).

### E4. Crowd reactions enrichies

**Fichier** : `src/utils/SoundManager.js`

Actuellement crowd basique. Ajouter variations :
- `sfxCrowdGasp()` : sur casquette (presque)
- `sfxCrowdBoo()` : sur contre (erreur)
- `sfxCrowdCheer()` : sur carreau/ciseau
- `sfxCrowdOoh()` : sur biberon

---

## AXE F — MOBILE & PUBLICATION (Impact: ★★★★☆)

> Le jeu vise CrazyGames/Poki. Ces portails = 60%+ trafic mobile.

### F1. Touch areas agrandies

**Fichier** : `src/petanque/AimingSystem.js`

Les boutons de mode (Roulette/Demi/etc.) sont 40x40. Sur mobile = trop petit.
- Agrandir zones interactives a 56x56 minimum
- Ajouter padding invisible 8px autour de chaque bouton
- Tester a 375px de large (iPhone SE)

### F2. Responsive UI scaling

**Fichier** : `src/config.js`

- Verifier que le scale mode Phaser gere bien les petits ecrans (832x480 sur 375x667 portrait)
- Ajouter detection portrait/paysage : forcer paysage avec message rotatif si portrait
- Constants.js : ajouter `IS_MOBILE = /Mobi|Android/i.test(navigator.userAgent)`

### F3. Drag-release mobile optimize

**Fichier** : `src/petanque/AimingSystem.js`

- Ajouter `touch-action: none` sur le canvas (eviter scroll navigateur)
- Verifier que `onPointerDown/Move/Up` fonctionnent en touch
- Ajouter visual feedback : cercle de puissance agrandi sur mobile
- Threshold de mouvement minimal (5px) pour eviter les false triggers

### F4. Meta portails

**Fichier** : `index.html`, `vite.config.js`

- CrazyGames SDK : ajouter `<script>` conditionnel + wrapper events (gameplayStart/Stop, happyTime)
- Poki SDK : meme principe, wrapper pour loading/commercial breaks
- itch.io : deja OK (zip dist/)

### F5. Performance 60 FPS garanti

**Fichier** : `src/petanque/EngineRenderer.js`

- Implementer le pooling objets (voir C6)
- Limiter les particules dust a 3 max simultanees
- Lazy-load les glow filters (WebGL check d'abord)
- Tester sur appareil bas de gamme (throttle CPU 4x dans DevTools)

---

## ORDRE D'EXECUTION RECOMMANDE

```
AXE A (Techniques de tir)     ← Transforme le gameplay, impact maximal
  ↓
AXE B (Feedback & resultats)  ← Rend les tirs significatifs
  ↓
AXE C (Nettoyage)             ← Stabilise avant d'ajouter plus
  ↓
AXE D (Tests)                 ← Couvre les nouveaux ajouts
  ↓
AXE E (Audio)                 ← Enrichit l'immersion
  ↓
AXE F (Mobile & publication)  ← Ouvre le marche
```

Chaque axe est independant et executable en 1 session Sonnet 4.6 (~3-4h).
Les axes A et B peuvent etre fusionnes si la session est longue.

---

## METRIQUES DE SUCCES

| Metrique | Avant Phase 3 | Apres Phase 3 |
|----------|--------------|---------------|
| Types de tir | 1 (fer) | 3 (fer + rafle + devant) + ciblage cochonnet |
| Resultats detectes | 1 (carreau) | 8 (carreau, palet, casquette, ciseau, biberon, contre, trou, recul) |
| Tests | 218 | ~300+ |
| SFX | 14 | ~26 |
| Dead code | 3 fichiers/champs | 0 |
| Mobile-ready | Non | Oui (portrait lock, touch areas, SDK portails) |

---

*Plan cree le 24 mars 2026 par Claude Opus 4.6 apres audit complet du codebase.*
*Prerequis : PLAN_100 ✅ + PLAN_PHASE2 ✅*
