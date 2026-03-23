# PLAN PHASE 2 — Polish & Qualité

> **Prérequis** : PLAN_100.md terminé (5 axes exécutés).
> **Objectif** : Corriger les problèmes découverts au playtest, polir la physique et les visuels.
> **Audience** : Sonnet 4.6, tâche par tâche.
> **Date** : 23 mars 2026 (après playtest)
> **Temps estimé** : ~8h (3 axes)

---

## BUGS CORRIGÉS CE JOUR (hors plan — déjà committé)

- [x] **Game freeze fin de partie** : `PetanqueEngine.update()` continuait après GAME_OVER → ajout guard `if (state === GAME_OVER) return`
- [x] **Tutoriel invisible** : `PetanqueScene` vérifiait `tutorialInGameSeen` (flag global) au lieu de `tutorialPhasesDone.length < 3` → corrigé
- [x] **`_markComplete()` prématuré** : ne marque `tutorialInGameSeen=true` que si les 3 phases (AIM, LOFT, SCORE) sont faites

---

## AXE A — PHYSIQUE POLISH (~3h)

> Corriger les incohérences physiques découvertes à l'audit.
> **Impact** : Le jeu "sonne" juste et les tests sont fiables.

### ~~A.1 Corriger l'incohérence friction sable (3.0 vs 3.5)~~

**Problème** : `Constants.js` L298 dit `sable: 3.0` mais `tests/Gameplay.test.js` L59 utilise `3.5`.
**Fichier 1** : `src/utils/Constants.js` L298
**Fichier 2** : `tests/Gameplay.test.js` — trouver toutes les références à la friction sable
**Action** : Décider quelle valeur est correcte (3.0 ou 3.5) en lisant `research/25_cahier_des_charges_realisme.md`. Aligner Constants ET tests sur la même valeur.
**Temps** : 15 min

---

### ~~A.2 Unifier la formule Puissance (throw vs collision)~~

**Problème** : Deux formules différentes pour le même stat :
- Throw (PetanqueEngine.js) : `puissanceMult = 0.7 + (pui - 1) / 9 * 0.5` → range 0.7-1.2
- Collision (Ball.js L414) : `puissanceBoost = 0.8 + (pui - 1) / 9 * 0.45` → range 0.8-1.25

**Action** :
1. Extraire dans Constants.js :
```js
export const PUISSANCE_BASE = 0.8;
export const PUISSANCE_RANGE = 0.5; // Pui 1 → 0.8x, Pui 10 → 1.3x
export function puissanceMultiplier(puiStat) {
    return PUISSANCE_BASE + (puiStat - 1) / 9 * PUISSANCE_RANGE;
}
```
2. Utiliser `puissanceMultiplier()` dans Ball.js ET PetanqueEngine.js
3. Ajouter un test : `Pui 1 = 0.8x, Pui 5 ≈ 1.02x, Pui 10 = 1.3x`

**Temps** : 30 min

---

### ~~A.3 Ajuster le cap de vitesse cochonnet~~

**Problème** : `COCHONNET_MAX_COLLISION_SPEED = 7.2` est très conservateur. Le cochonnet bouge à peine sur un tir direct. En pétanque réelle, le cochonnet peut se déplacer significativement.

**Action** : Dans Constants.js, augmenter :
```js
// Avant :
export const COCHONNET_MAX_COLLISION_SPEED = 7.2;
// Après :
export const COCHONNET_MAX_COLLISION_SPEED = 10.0; // ~83% de MAX_THROW_SPEED
```
**Pourquoi 10.0** : Permet un déplacement réaliste sans éjection systématique. Si trop, ajuster entre 8 et 10.
**Test** : Jouer 3 parties sur chaque terrain et vérifier que le cochonnet ne sort plus systématiquement mais bouge quand même assez.
**Temps** : 10 min

---

### ~~A.4 Améliorer la protection slope infinite roll~~

**Problème** : La protection actuelle attend 300 frames (~5s) avant de forcer l'arrêt. C'est trop long.

**Fichier** : `src/petanque/Ball.js` — trouver `_lowSpeedFrames` et le seuil de 300.
**Action** : Réduire de 300 à 120 frames (~2s). Ajouter un commentaire explicatif :
```js
// Safety: force stop after ~2s of low-speed slope roll (was 5s, too sluggish)
if (this._lowSpeedFrames > 120) {
    this.vx = 0;
    this.vy = 0;
    this.isMoving = false;
}
```
**Temps** : 10 min

---

### ~~A.5 Ajouter les tests physique manquants~~

**Fichier** : `tests/Gameplay.test.js`
**Action** : Ajouter ces tests :
```js
describe('Puissance stat extremes', () => {
    test('Pui 1 throws shorter than Pui 10', () => { ... });
    test('Pui 10 collision ejects further than Pui 1', () => { ... });
});

describe('Cochonnet collision cap', () => {
    test('cochonnet speed capped after hard hit', () => { ... });
    test('cochonnet still moves on normal hit', () => { ... });
});

describe('Slope timeout', () => {
    test('ball stops within 120 frames on slope', () => { ... });
});
```
**Temps** : 45 min

---

### ~~A.6 Nettoyer les assets fantômes et le code mort~~

**Fichier** : `src/scenes/BootScene.js`
**Action** : Supprimer le chargement de ces assets inutilisés :
- `terrain_herbe_touffe` (jamais utilisé dans TerrainRenderer)
- `terrain_fissure` (jamais utilisé)
- `terrain_planche_bord` (jamais utilisé)
- `basechip_combined` (jamais utilisé)

**Fichier** : `src/petanque/TerrainRenderer.js`
**Action** : Supprimer les entrées `pin_v1` et `pin_v2` de DECOR_FRAMES (les sprites ne sont pas chargés dans BootScene).

**Temps** : 15 min

---

## AXE B — TERRAINS VISUELS & ÉDITEUR HTML (~3h)

> Créer un outil pour peaufiner chaque terrain à la main.
> **Impact** : Cohérence visuelle, chaque terrain a sa personnalité.

### ~~B.1 Créer l'éditeur HTML de terrains~~

**Fichier** : `public/terrain_editor.html` (nouveau fichier)
**Action** : Créer une page HTML standalone qui :
1. Affiche chaque terrain avec tous ses décors sprite
2. Permet de drag-and-drop chaque sprite pour ajuster sa position
3. Permet de modifier scale, alpha, flipX, depth de chaque sprite
4. Exporte la configuration en JSON (copier-coller dans TerrainRenderer.js)
5. Charge les mêmes sprites que le jeu (depuis public/assets/sprites/)

**Structure** :
```html
<!DOCTYPE html>
<html>
<head><title>Petanque Master — Terrain Editor</title></head>
<body>
    <select id="terrain">
        <option value="village">Village</option>
        <option value="plage">Plage</option>
        <option value="parc">Parc</option>
        <option value="colline">Colline</option>
        <option value="docks">Docks</option>
    </select>
    <canvas id="preview" width="832" height="480"></canvas>
    <div id="controls">
        <!-- Pour chaque sprite : sliders position X/Y, scale, alpha, depth -->
    </div>
    <button id="export">Exporter JSON</button>
    <pre id="output"></pre>
</body>
</html>
```

**Fonctionnalités clés** :
- Canvas 832x480 (même résolution que le jeu)
- Fond du terrain dessiné (couleur de base)
- Sprites chargés depuis les fichiers PixelLab
- Clic sur un sprite = le sélectionner
- Drag = déplacer
- Panneau latéral avec sliders pour scale/alpha/depth/flip
- Bouton "Exporter" → génère le JS pour TERRAIN_DECOR dans la console

**Temps** : 1h30

---

### ~~B.2 Enrichir les décors Plage~~

**Problème** : La plage n'a que 2 arbres et 1 pierres (3 sprites). Les autres terrains en ont 7-9.
**Fichier** : `src/petanque/TerrainRenderer.js` — section TERRAIN_DECOR.plage
**Action** : Ajouter des sprites existants :
- 1x sac de boules (grid_sac)
- 2x herbe/touffe (grid_herbe, alpha basse pour sable)
- 1x banc (grid_banc_td)
- 1x table (grid_table)

Utiliser des positions qui ne gênent pas le terrain de jeu (gauche/droite du terrain).

**Temps** : 20 min

---

### ~~B.3 Enrichir les décors Docks~~

**Problème** : Les Docks n'ont qu'1 sprite (sac). L'ambiance industrielle est entièrement procédurale.
**Fichier** : `src/petanque/TerrainRenderer.js` — section TERRAIN_DECOR.docks
**Action** : Ajouter :
- 2x stones (grid_stones, pour débris industriels)
- 1x table (grid_table, table de score)

**Temps** : 15 min

---

### ~~B.4 Ajouter des ombres sous les grands sprites~~

**Fichier** : `src/petanque/TerrainRenderer.js` — méthode `_placeDecorSprites()`
**Action** : Pour chaque sprite avec scale > 1.5, ajouter une ombre elliptique en dessous :
```js
if (scale > 1.5) {
    const shadow = this.scene.add.ellipse(
        finalX, finalY + spriteHeight * 0.4,
        spriteWidth * 0.6, 8,
        0x3A2E28, 0.15
    ).setDepth(decorDepth - 0.01);
}
```
**Note** : `0x3A2E28` (pas noir pur). Alpha très basse (0.15) pour subtilité.
**Temps** : 20 min

---

## AXE C — COHÉRENCE & DOCUMENTATION (~2h)

> Ranger, documenter, s'assurer que tout est aligné.
> **Impact** : Le projet est compréhensible et maintenable.

### ~~C.1 Archiver les fichiers research obsolètes~~

**Dossier** : `research/`
**Action** : Déplacer dans `research/archive/` :
- `07_cross_analysis.md` (décision historique, résolution 416x240 vs actuel 832x480)
- `02_tilemaps_assets.md` (référence 16x16, projet utilise 32x32)
- `05_pokemon_architecture.md` (patterns généraux, supersédé par CLAUDE.md)

**Temps** : 5 min

---

### ~~C.2 Mettre à jour research/00_synthese_etat_projet.md~~

**Action** : Mettre à jour la synthèse avec l'état actuel :
- Score 100/100 (PLAN_100 terminé)
- Bugs trouvés au playtest : game freeze + tutoriel (corrigés)
- Prochaine phase : polish physique + visuels
- Pointer vers PLAN_PHASE2.md

**Temps** : 15 min

---

### ~~C.3 Vérifier la cohérence physique audit vs code~~

**Fichier** : `research/04c_physique_audit_specifications.md`
**Action** : Relire cet audit et vérifier chaque point dans le code actuel :
- Recul detection (Ball.js) → est-ce toujours trop narrow ?
- Palet measurement → mesure-t-il la bonne distance ?
- Tir au fer rollEfficiency 16.0 → est-ce toujours fragile ?
- Documenter ce qui a été corrigé vs ce qui reste

**Temps** : 30 min

---

### C.4 Test end-to-end complet

**Action manuelle** :
1. Lancer `npm run dev`
2. Jouer un cycle Arcade complet (5 matchs)
3. Vérifier :
   - Tutorial s'affiche (Phase 1, 2, 3)
   - Transitions fluides entre chaque match
   - Dialogues pré/post-match apparaissent
   - Milestones se déclenchent
   - Déblocage personnage fonctionne
   - LevelUp distribue les points
   - Pause menu fonctionne (touche P)
   - Score correct à 13 points
4. Jouer une partie QuickPlay sur chaque terrain
5. Vérifier 60 FPS constant

**Temps** : 30 min

---

## RÉSUMÉ

| Axe | Tâches | Temps | Impact |
|-----|--------|-------|--------|
| A. Physique Polish | 6 tâches | ~3h | Cohérence, tests, gameplay feel |
| B. Terrains & Éditeur | 4 tâches | ~3h | Visuels, outil de peaufinage |
| C. Cohérence & Docs | 4 tâches | ~2h | Qualité, maintenabilité |
| **TOTAL** | **14 tâches** | **~8h** | **Jeu poli et cohérent** |

## ORDRE D'EXÉCUTION

```
1. AXE A (Physique)   — Corriger les fondations
2. AXE B (Visuels)    — Polir l'apparence
3. AXE C (Cohérence)  — Documenter et valider
```
