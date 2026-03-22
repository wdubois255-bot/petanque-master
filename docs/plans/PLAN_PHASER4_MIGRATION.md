# Plan de Migration Phaser 3.90 → Phaser 4

> **Date** : 22 mars 2026
> **Statut Phaser 4** : RC6 (v4.0.0-rc.6, 23 déc 2025) — considéré production-ready, stable pas encore taggé
> **Risque global** : ⭐ FAIBLE — le projet n'utilise aucune API supprimée dans v4

---

## TL;DR — Pourquoi c'est faisable

| Critère | Notre projet | Impact |
|---------|-------------|--------|
| APIs supprimées (Mesh, Structs.Set, Geom.Point, PostFX, BitmapMask) | **Aucune utilisée** | ✅ Zéro |
| Custom shaders / PostFXPipeline | **Aucun** | ✅ Zéro |
| phaser3-rex-plugins | Dans package.json mais **jamais importé** dans src/ | ✅ Supprimer |
| Physique custom (Ball.js) | Indépendante de Phaser | ✅ Zéro |
| Scene lifecycle (init/preload/create/update) | **Identique en v4** | ✅ Zéro |
| Input (keyboard/pointer) | **Identique en v4** | ✅ Zéro |
| Tweens | **Identique en v4** | ✅ Zéro |
| Audio | **Identique en v4** | ✅ Zéro |
| `roundPixels` default change (true→false) | On le set déjà à `true` dans config.js | ✅ Déjà géré |
| `pixelArt: true` | Déjà dans config.js | ✅ Déjà géré |

---

## Ce qui change dans Phaser 4 (sources officielles)

### Renderer — Remplacement complet
- Nouveau renderer WebGL interne ("Beam") — plus rapide, -16 MB RAM/VRAM
- Architecture "render nodes" avec buffers dédiés par batch
- **Impact sur nous** : transparent, aucun code renderer custom

### Système FX → Filters
- `PostFXPipeline`, `preFX`, `postFX`, `BitmapMask` → supprimés
- Remplacés par système **Filters** (`gameObject.filters.enable()` + `.external.addGlow()`, etc.)
- **Impact sur nous** : on n'utilise aucun FX → zéro changement

### Game Objects supprimés
- `Mesh` → supprimé sans remplacement
- **Impact sur nous** : jamais utilisé → zéro

### Structs natifs
- `Phaser.Structs.Set` → `Set` natif JS
- `Phaser.Structs.Map` → `Map` natif JS
- `Phaser.Geom.Point` → `Vector2`
- **Impact sur nous** : jamais utilisés → zéro

### Camera restructurée (depuis Beta 7)
- `Camera#matrix` combine maintenant rotation + zoom + scroll (exclut position)
- Nouvelles propriétés : `matrixExternal`, `matrixCombined`
- **Impact sur nous** : on utilise uniquement `setAlpha()`, `resetFX()`, `flash()`, `startFollow()`, `setBounds()` → API stable, zéro changement

### Config `roundPixels`
- Default passe de `true` à `false` dans v4
- **Impact sur nous** : on déclare déjà `roundPixels: true` explicitement → aucun

### Nouveautés exploitables
| Feature | Intérêt pour nous |
|---------|------------------|
| **Blocky filter** (pixel art natif) | Renforcer le rendu pixelisé |
| **GPU TilemapLayer** | Si on implémente l'Overworld avec Tiled |
| **SpriteGPULayer** | Pas utile (peu de sprites simultanés) |
| **Texture wrap modes** | Potentiel pour terrains tiling |
| **-16 MB RAM** | Mobile = mieux |
| **Image Based Lighting** (en dev) | Ambiance terrain de nuit ? |

### Sources
- [Phaser v4 RC6](https://phaser.io/news/2025/12/phaser-v4-release-candidate-6-is-out)
- [Phaser v4 Beta 1 announcement](https://phaser.io/news/2024/11/phaser-v387-and-v400-released)
- [Phaser v4 RC4 discussion](https://github.com/phaserjs/phaser/discussions/7148)
- [Migration shaders guide](https://phaser.io/news/2025/11/migrating-phaser-3-shaders-to-phaser-4)
- [Phaser v4 Beta 7](https://phaser.io/news/2025/03/phaser-v4-beta-7-released)
- [Phaser GitHub releases](https://github.com/phaserjs/phaser/releases)

---

## Inventaire complet des APIs Phaser utilisées

### ✅ APIs stables (identiques en v4)
```
Phaser.Scene (extends) — init, preload, create, update
this.scene.start(key, data)
this.add.text(), .image(), .sprite(), .graphics(), .container(), .group()
this.add.renderTexture()
this.tweens.add(), .killAll()
this.input.keyboard.createCursorKeys(), .addKey()
this.input.on('pointerdown/move/up')
this.cameras.main.setAlpha(), .flash(), .startFollow(), .setBounds(), .resetFX()
this.load.json(), .image(), .spritesheet(), .tilemapTiledJSON(), .audio()
this.load.on('progress/complete/loaderror')
this.sound.play(), this.cache.audio.exists()
this.textures.createCanvas(), .addSpriteSheet()
this.registry.get(), .set()
this.events.on('shutdown/wake')
this.scale.width, .height
Phaser.AUTO, Phaser.Scale.FIT, Phaser.Scale.CENTER_BOTH
sprite.setScale(), .setOrigin(), .setDepth(), .setAlpha(), .setFrame(), .setVisible(), .setFlip()
graphics.fillStyle(), .fillRect(), .fillCircle(), .lineStyle(), .strokeRect(), .lineTo()
```

### ⚠️ APIs à vérifier (risque faible)
```
this.textures.createCanvas(key, w, h)  — composition spritesheets dans BootScene
this.textures.addSpriteSheet(key, source, config) — spritesheets dynamiques
this.add.renderTexture(x, y, w, h)  — traces d'impact dans PetanqueScene
this.cameras.main.resetFX()  — possible renommage si FX system change
```

### ❌ APIs supprimées dans v4 — AUCUNE UTILISÉE
```
Phaser.Structs.Set  → pas utilisé
Phaser.Structs.Map  → pas utilisé
Phaser.Geom.Point   → pas utilisé
PostFXPipeline      → pas utilisé
preFX / postFX      → pas utilisé
BitmapMask          → pas utilisé
Mesh                → pas utilisé
```

---

## Plan de migration en 5 étapes

### Étape 1 — Préparation (branche, backup, nettoyage)
**Durée estimée** : 10 min
**Risque** : aucun

```bash
# 1. Créer une branche dédiée
git checkout -b feat/phaser4-migration

# 2. Supprimer rex-plugins (jamais utilisé)
npm uninstall phaser3-rex-plugins

# 3. Vérifier qu'aucun import rex n'existe (déjà vérifié — aucun)
grep -r "rex" src/
```

**Checklist** :
- [ ] Branche `feat/phaser4-migration` créée
- [ ] `phaser3-rex-plugins` supprimé de package.json
- [ ] Build propre (`npm run build`) sur Phaser 3 avant migration
- [ ] Tests passent (`npx vitest run`) sur Phaser 3 avant migration
- [ ] Commit "chore: remove unused rex-plugins, prepare for Phaser 4"

---

### Étape 2 — Upgrade Phaser
**Durée estimée** : 5 min
**Risque** : faible

```bash
# Installer Phaser 4 RC6
npm install phaser@beta

# Vérifier la version installée
npm ls phaser
# Attendu : phaser@4.0.0-rc.6
```

**Checklist** :
- [ ] `phaser@4.0.0-rc.6` installé
- [ ] `package.json` montre `"phaser": "^4.0.0-rc.6"`
- [ ] `npm run build` compile sans erreur

---

### Étape 3 — Corrections ciblées (si nécessaire)
**Durée estimée** : 15-45 min selon les erreurs
**Risque** : moyen

#### 3a. Vérifier `config.js`
Le config actuel devrait fonctionner tel quel. Vérifier que :
- `pixelArt: true` ✅ (déjà présent)
- `roundPixels: true` ✅ (déjà présent)
- `type: Phaser.AUTO` ✅ (compatible)
- `physics.arcade` ✅ (compatible)

#### 3b. Vérifier `BootScene.js` — Composition de textures
C'est le point le plus sensible. BootScene crée des spritesheets dynamiquement via :
```js
this.textures.createCanvas(key, width, height)
this.textures.addSpriteSheet(key, source, { frameWidth, frameHeight })
```
**Action** : tester manuellement. Si l'API a changé, adapter les appels.

#### 3c. Vérifier `PetanqueScene.js` — RenderTexture
```js
this.add.renderTexture(x, y, w, h)
```
Utilisé pour les traces d'impact. Vérifier que l'API n'a pas changé.

#### 3d. Vérifier `cameras.main.resetFX()`
Utilisé dans plusieurs scènes pour nettoyer les effets caméra. Possible renommage si le système FX est supprimé. Chercher l'équivalent v4 si ça casse.

#### 3e. Vérifier les imports
```js
// Si des imports changent de chemin :
import Phaser from 'phaser';
// Devrait rester identique dans v4
```

**Checklist** :
- [ ] `npm run build` passe
- [ ] `npm run dev` → le jeu se lance
- [ ] BootScene charge tous les assets sans erreur console
- [ ] TitleScene s'affiche correctement
- [ ] Une partie de pétanque complète fonctionne
- [ ] Textes lisibles, sprites corrects, couleurs OK
- [ ] Audio fonctionne
- [ ] Commit "feat: migrate to Phaser 4 RC6"

---

### Étape 4 — Tests complets
**Durée estimée** : 15-30 min
**Risque** : faible

```bash
# Tests unitaires
npx vitest run

# Tests E2E
npx playwright test

# Test visuel manuel — parcourir toutes les scènes :
npm run dev
```

**Scènes à tester manuellement** :
| Scène | Quoi vérifier |
|-------|---------------|
| Boot → Title | Logo, textes, animation, transition |
| CharSelect | Grille persos, preview, sélection |
| QuickPlay | Menus, options, terrains |
| VSIntro | Animation split-screen, typewriter |
| Petanque | Visée, lancer, physique, score, IA, terrain |
| Result | Stars, animations, rewards |
| Shop | UI, prix, achats |
| Tutorial | Textes, étapes |
| Arcade | Progression 5 rounds |

**Checklist** :
- [ ] 138 tests unitaires passent
- [ ] 85 tests E2E passent
- [ ] Playtest manuel complet — aucune régression visuelle
- [ ] Performance 60 FPS maintenue
- [ ] Aucune erreur console
- [ ] Commit "test: verify Phaser 4 migration — all tests pass"

---

### Étape 5 — Nettoyage et merge
**Durée estimée** : 10 min

```bash
# Mettre à jour CLAUDE.md
# Phaser 3.90.0 "Tsugumi" → Phaser 4.0.0-rc.6

# Mettre à jour CAHIER_DES_CHARGES.md si pertinent

# Merge dans master
git checkout master
git merge feat/phaser4-migration
```

**Checklist** :
- [ ] CLAUDE.md mis à jour (version Phaser)
- [ ] CAHIER_DES_CHARGES.md mis à jour
- [ ] package.json propre
- [ ] Branche mergée

---

## Matrice de risques

| Composant | Fichiers | Risque | Raison |
|-----------|----------|--------|--------|
| Scene lifecycle | Toutes les scènes | 🟢 Nul | API identique |
| Input (keyboard/pointer) | AimingSystem, scènes | 🟢 Nul | API identique |
| Tweens | Scènes UI | 🟢 Nul | API identique |
| Audio / SoundManager | SoundManager.js | 🟢 Nul | API identique |
| Physique custom | Ball.js, PetanqueEngine.js | 🟢 Nul | Indépendant de Phaser |
| Text rendering | UIFactory, toutes scènes | 🟢 Nul | GameObjects.Text stable |
| Graphics API | EngineRenderer, TerrainRenderer, UI | 🟢 Nul | API stable |
| Sprite/Image | Toutes scènes | 🟢 Nul | API stable |
| Texture composition | BootScene.js | 🟡 Faible | `createCanvas` + `addSpriteSheet` à vérifier |
| RenderTexture | PetanqueScene.js | 🟡 Faible | API potentiellement ajustée |
| Camera resetFX | Plusieurs scènes | 🟡 Faible | Renommage possible |
| Scale manager | config.js | 🟢 Nul | Config déjà explicite |
| Registry/Events | OverworldScene, VSIntroScene | 🟢 Nul | API stable |

---

## Gains attendus après migration

1. **Performance** : nouveau renderer (-16 MB RAM, meilleur batching WebGL)
2. **Mobile** : jusqu'à 16x plus rapide pour les scènes avec filtres
3. **Blocky filter** : pixel art natif sans hacks CSS
4. **GPU TilemapLayer** : prêt pour l'Overworld (Phase D)
5. **Futures features** : Image Based Lighting (ambiance nuit), texture wrap modes
6. **Maintenance** : sur la branche active de Phaser (v3 = maintenance mode)
7. **Phaser Editor v5** : compatible uniquement avec v4

---

## Stratégie : quand migrer ?

### Option A — Maintenant (recommandé ✅)
- RC6 est considéré production-ready par l'équipe Phaser
- Notre projet n'utilise aucune API supprimée
- Rex-plugins non utilisé → pas de blocage
- Mieux vaut migrer maintenant (peu de code) que plus tard (plus de code)
- On profite du nouveau renderer pour tout le dev futur

### Option B — Attendre la stable 4.0.0
- Plus conservateur
- Risque de devoir migrer plus tard avec plus de code
- La stable pourrait arriver dans les semaines qui viennent (pas de RC7 prévu)

### Verdict
**Migrer maintenant.** Le risque est minimal, le projet est dans un état propre, et on bénéficie immédiatement du nouveau renderer. Si un problème survient, on peut revenir sur la branche master en 30 secondes.

---

## Commandes récap (copier-coller)

```bash
# Étape 1 — Préparation
git checkout -b feat/phaser4-migration
npm uninstall phaser3-rex-plugins
npm run build && npx vitest run

# Étape 2 — Upgrade
npm install phaser@beta
npm run build

# Étape 3 — Dev + fix
npm run dev
# Tester dans le navigateur, fixer ce qui casse

# Étape 4 — Tests
npx vitest run
npx playwright test

# Étape 5 — Merge
git checkout master
git merge feat/phaser4-migration
```
