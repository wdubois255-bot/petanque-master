# PLAN 100% — Petanque Master

> **Objectif** : Amener le jeu de 72/100 à 100/100 — prêt pour publication itch.io.
> **Audience** : Ce plan est conçu pour être exécuté par Sonnet 4.6, tâche par tâche.
> **Temps estimé total** : ~15h (5 axes)
> **Date** : 23 mars 2026
> **Référence narrative** : `docs/archive/PLAN_NARRATIVE_ARCADE.md` (bible)
> **Référence visuelle** : `docs/archive/PLAN_VISUAL_OVERHAUL.md` (roadmap PixelLab)

---

## ÉTAT ACTUEL (mis à jour 23 mars 2026 — après AXE 1)

| Composant | Statut | Note |
|-----------|--------|------|
| Moteur physique | ✅ 100% | COR 0.62, cap cochonnet, hitbox alignée |
| 12 personnages | ✅ 100% | Stats, IA, abilities, barks, sprites v2 |
| 5 terrains | ✅ 100% | Friction, zones, slopes, décors PixelLab |
| Arcade 5 rounds | ✅ 92% | Gameplay + lastMatchResult OK, **narrative absente** |
| Quick Play | ✅ 100% | 4 onglets, sélection complète |
| Boutique | ✅ 100% | 16 boules, 6 cochonnets, capacités |
| Sauvegarde V2 | ✅ 100% | Migration, progression, daily |
| Audio | ✅ 100% | 13 SFX + 2 musiques, variation pitch, sfxUIHover |
| Tests | ✅ 100% | 213 tests passants |
| Bugs P0/P1 | ✅ 100% | Tous corrigés (AXE 1 terminé) |
| Phaser 4 filters | ✅ 100% | Glow meilleure boule, shadow panneaux, flash collisions |
| Tutoriel in-game | ⚠️ 60% | InGameTutorial.js existe, **trop discret** |
| Narrative arcade | ❌ 0% | Aucun dialogue pré/post-match |
| Config cleanup | ✅ 100% | AXE 1 terminé — code propre |

### Bugs restants (vérifiés dans le code)

| Bug | Fichier | Ligne | Sévérité |
|-----|---------|-------|----------|
| **Cochonnet sort trop souvent** | `src/petanque/Ball.js` | L376-424 | **P0** |
| **Hitbox boule > sprite visuel** | `src/petanque/Ball.js` | L54-55, L381 | **P1** |
| **Arcade lastMatchResult hardcodé `won:true`** | `src/scenes/ResultScene.js` | L494 | **P1** |
| Hardcoded `-52` dans UI aiming | `src/petanque/AimingSystem.js` | L157, L481 | P2 |
| `phaser3-rex-plugins` fantôme | `vite.config.js` | L18 | P2 |

---

## AXE 1 — BUGS GAMEPLAY & NETTOYAGE ✅ TERMINÉ (23 mars 2026)

> Corriger les bugs de gameplay visibles par le joueur + nettoyer le code.
> **Impact** : Le jeu fonctionne correctement. C'est la base.

### ✅ 1.0a [P0] Cochonnet sort trop souvent du terrain

**Problème** : Le ratio de masse boule/cochonnet est 700g/16g (43.75:1). Quand une boule touche le cochonnet, l'impulsion est multipliée par `a.mass = 700`, envoyant le cochonnet à une vitesse absurde. Aucun cap de vélocité n'est appliqué après collision.

**Fichier 1** : `src/petanque/Ball.js` — méthode `resolveCollision()` (L376-424)
**Action** : Après le calcul de l'impulsion sur le cochonnet (L423-424), ajouter un cap de vélocité :
```js
// Après les lignes 423-424 (b.vx += ..., b.vy += ...)
// Cap cochonnet post-collision velocity to prevent ejection
if (isBouleVsCochonnet) {
    const lighter = a.mass < b.mass ? a : b;
    const speed = Math.sqrt(lighter.vx * lighter.vx + lighter.vy * lighter.vy);
    const maxCochonnetSpeed = MAX_THROW_SPEED * 0.6; // Ne peut pas aller plus vite que 60% d'un lancer max
    if (speed > maxCochonnetSpeed) {
        const ratio = maxCochonnetSpeed / speed;
        lighter.vx *= ratio;
        lighter.vy *= ratio;
    }
}
```

**Fichier 2** : `src/utils/Constants.js`
**Action** : Ajouter après `COCHONNET_MASS` (L326) :
```js
export const COCHONNET_MAX_COLLISION_SPEED = 7.2; // MAX_THROW_SPEED * 0.6 — cap post-collision
```
Puis utiliser cette constante au lieu de `MAX_THROW_SPEED * 0.6` dans Ball.js.

**Import** : Ajouter `COCHONNET_MAX_COLLISION_SPEED` aux imports de Ball.js.

**Pourquoi 0.6x** : En pétanque réelle, le cochonnet se déplace mais ne "vole" jamais hors du terrain. Un cap à 60% de la vitesse max de lancer donne un déplacement réaliste sans éjection.
**Temps** : 20 min

---

### ✅ 1.0b [P1] Hitbox boule plus large que le sprite visible

**Problème** : Le rayon de collision est 10px mais le sprite est rendu à scale `(10/28) * 0.85 ≈ 0.304`, donnant un rayon visuel de ~8.5px. Le joueur voit les boules se "toucher" alors qu'elles sont encore séparées de ~3px.

**Fichier** : `src/utils/Constants.js`
**Ligne 323** :
```js
// Avant :
export const BALL_DISPLAY_SCALE = 0.85;
// Après :
export const BALL_DISPLAY_SCALE = 1.0;  // Aligner visuel sur hitbox physique
```

**Ligne 324** :
```js
// Avant :
export const COCHONNET_DISPLAY_SCALE = 0.7;
// Après :
export const COCHONNET_DISPLAY_SCALE = 0.82; // Légèrement plus petit que boule (cohérent)
```

**Pourquoi scale 1.0** : Le rayon physique (10px) est déjà correct pour le gameplay. C'est le sprite qui est trop petit visuellement. En remettant BALL_DISPLAY_SCALE à 1.0, le sprite correspond exactement à la hitbox. Le COCHONNET_DISPLAY_SCALE reste un peu en-dessous car le cochonnet est visuellement plus petit qu'une boule.

**Test** : Lancer `npx vitest run` — les tests de physique ne sont pas affectés car ils n'utilisent pas le display scale.
**Temps** : 5 min

---

### ✅ 1.0c [P1] Bug transition Arcade : lastMatchResult hardcodé won:true

**Problème** : Dans ResultScene.js L494, quand un Rookie gagne de l'XP après un match Arcade, `lastMatchResult: { won: true }` est hardcodé. Si le joueur PERD mais gagne quand même de l'XP (ROOKIE_XP_LOSS), ArcadeScene croit qu'il a gagné → progression corrompue.

**Fichier** : `src/scenes/ResultScene.js`
**Ligne 494** :
```js
// Avant :
lastMatchResult: { won: true }
// Après :
lastMatchResult: { won: this.won }
```

**Temps** : 2 min

---

### ✅ 1.1 Supprimer phaser3-rex-plugins de vite.config.js

**Fichier** : `vite.config.js`
**Ligne** : 17-19
**Avant** :
```js
optimizeDeps: {
    include: ['phaser3-rex-plugins']
},
```
**Après** : Supprimer le bloc `optimizeDeps` entier (lignes 17-19).
**Pourquoi** : Ce plugin n'est pas installé et n'est importé nulle part. Cargo-cult.
**Temps** : 2 min

---

### ✅ 1.2 Extraire les hardcodes AimingSystem dans Constants.js

**Fichier 1** : `src/utils/Constants.js`
**Action** : Ajouter après la ligne 407 (après `DIALOG_BOX_HEIGHT`) :
```js
// AimingSystem UI positioning
export const AIMING_UI_BOTTOM_OFFSET = 52;
export const FOCUS_UI_STACK_OFFSET = 50; // 28 + 22 = espace au-dessus du mode UI
```

**Fichier 2** : `src/petanque/AimingSystem.js`
**Import** : Ajouter `AIMING_UI_BOTTOM_OFFSET, FOCUS_UI_STACK_OFFSET` aux imports de Constants.js.
**Ligne 157** : Remplacer `this.scene.scale.height - 52` par `this.scene.scale.height - AIMING_UI_BOTTOM_OFFSET`
**Ligne 481** : Remplacer `this.scene.scale.height - 52 - 28 - 22` par `this.scene.scale.height - AIMING_UI_BOTTOM_OFFSET - FOCUS_UI_STACK_OFFSET`
**Temps** : 10 min

---

### ✅ 1.3 Renommer les fichiers décor "sans titre"

**Dossier** : `public/assets/sprites/decor/`
**Action** : Renommer les 6 fichiers "sans titre" avec des noms descriptifs :
```
sans titre_0005.png → decor_tree_variant_1.png
sans titre_0006.png → decor_tree_variant_2.png
sans titre_0007.png → decor_tree_variant_3.png
sans titre_0008.png → decor_tree_variant_4.png
sans titre_0013.png → decor_bush_variant_1.png
sans titre_0016.png → decor_bush_variant_2.png
```
**Note** : Ouvrir chaque fichier pour vérifier visuellement le contenu avant de nommer. Ajuster les noms si ce ne sont pas des arbres/buissons.
**Pourquoi** : Noms illisibles, impossible de savoir ce que c'est.
**Temps** : 5 min

---

### ✅ 1.4 Nettoyer les fichiers PixelLab non utilisés dans decor/

**Dossier** : `public/assets/sprites/decor/`
**Action** : Vérifier que chaque fichier `pixellab-*` est référencé dans `TerrainRenderer.js`. Si non référencé, le déplacer dans `public/assets/sprites/decor/_unused/`.
**Fichier à vérifier** : `src/petanque/TerrainRenderer.js` — chercher tous les `this.scene.textures.exists(...)` et `this.scene.add.image(...)` pour lister les assets réellement utilisés.
**Temps** : 15 min

---

### ✅ 1.5 Supprimer les références aux personnages morts

**Contexte** : `le_magicien`, `marcel`, `reyes` ont des sprites mais ne sont pas dans l'arcade ni la sélection Quick Play.
**Action** : NE PAS supprimer les sprites (ils existent physiquement) mais vérifier qu'aucun code ne les référence comme jouables. Documenter dans un commentaire de `CHAR_SPRITE_MAP` (Constants.js L333) :
```js
// Note: le_magicien, marcel, reyes ont des sprites mais ne sont pas dans le roster jouable.
// Sprites conservés pour future Phase D (narrative overworld).
```
**Temps** : 5 min

---

### ✅ 1.6 Vérifier et aligner progression.json vs arcade.json

**Fichiers** : `public/data/progression.json` et `public/data/arcade.json`
**Action** : Vérifier que les `badges`, `milestones`, et `gates` dans progression.json sont cohérents avec arcade.json. Supprimer les doublons s'il y en a. Si progression.json n'ajoute rien par rapport à arcade.json, le fusionner dans arcade.json et supprimer progression.json (en mettant à jour les imports dans `BootScene.js` et tout fichier qui charge `progression`).
**Temps** : 15 min

---

## AXE 2 — GAME FEEL & JUICE ✅ TERMINÉ (23 mars 2026)

> Rendre le jeu vivant et satisfaisant. Phaser 4 filters, SFX, feedback.
> **Impact** : Le joueur "sent" chaque action. Différence entre démo et jeu fini.

### ✅ 2.1 Glow filter sur la meilleure boule (Phaser 4)

**Fichier** : `src/petanque/EngineRenderer.js`
**Contexte** : La propriété `_bestGlowSprite` existe (L22) et `_hasWebGL` est vérifié (L25). Le code pour dessiner le cercle pulsant existe déjà.
**Action** : Dans la méthode qui met à jour l'indicateur de meilleure boule, ajouter :
```js
// Après avoir identifié la meilleure boule (bestBall)
if (this._hasWebGL && bestBall?.sprite) {
    try {
        if (typeof bestBall.sprite.enableFilters === 'function') {
            bestBall.sprite.enableFilters();
            // Or doré pour joueur, bleu ciel pour adversaire
            const glowColor = bestBall.team === 'player' ? 0xFFD700 : 0x87CEEB;
            bestBall.sprite.filters.internal.addGlow(glowColor, 4, 0, 1, false, 4, 4);
            this._bestGlowSprite = bestBall.sprite;
        }
    } catch (_) { /* Filter not supported */ }
}
```
**Cleanup** : Quand la meilleure boule change, retirer le glow de l'ancienne :
```js
if (this._bestGlowSprite && typeof this._bestGlowSprite.clearFilters === 'function') {
    try { this._bestGlowSprite.clearFilters(); } catch (_) {}
    this._bestGlowSprite = null;
}
```

**Fichier Constants.js** : Ajouter :
```js
// Phaser 4 filter colors
export const FILTER_GLOW_PLAYER = 0xFFD700;    // Or doré
export const FILTER_GLOW_OPPONENT = 0x87CEEB;   // Bleu ciel
export const FILTER_GLOW_STRENGTH = 4;
export const FILTER_GLOW_QUALITY = 4;
```
**Temps** : 30 min

---

### ✅ 2.2 Shadow filter sur les panneaux UI

**Fichiers** : `src/ui/UIFactory.js`, `src/ui/ScorePanel.js`
**Action** : Dans UIFactory, ajouter une méthode utilitaire :
```js
static addPanelShadow(gameObject) {
    try {
        if (typeof gameObject.enableFilters === 'function') {
            gameObject.enableFilters();
            gameObject.filters.internal.addShadow(0x3A2E28, 2, 0.5, 4, 4);
        }
    } catch (_) { /* Filter not supported */ }
}
```
**Usage** : Appeler `UIFactory.addPanelShadow(panel)` dans :
- `ScorePanel.js` — sur le panneau de score principal
- `QuickPlayScene.js` — sur les panneaux d'info personnage
- `ArcadeScene.js` — sur le panneau adversaire
- `ShopScene.js` — sur le panneau de preview item

**Note** : Toujours wrapper dans try/catch, `0x3A2E28` (JAMAIS noir pur).
**Temps** : 25 min

---

### ✅ 2.3 Variation de pitch sur les SFX

**Fichier** : `src/utils/SoundManager.js`
**Action** : Trouver toutes les fonctions `sfx*()` (sfxBouleBoule, sfxLanding, sfxThrow, etc.) et ajouter une variation de pitch aléatoire :
```js
// Avant :
scene.sound.play('boule_clac', { volume: masterVol * sfxVol });
// Après :
scene.sound.play('boule_clac', {
    volume: masterVol * sfxVol,
    rate: 0.9 + Math.random() * 0.2  // pitch ±10%
});
```
**Appliquer à** : `sfxBouleBoule`, `sfxBouleCochonnet`, `sfxLanding`, `sfxThrow`, `sfxCarreau`
**NE PAS appliquer à** : `sfxVictory`, `sfxDefeat`, `sfxScore`, `sfxUIClick` (ces sons doivent rester constants).
**Temps** : 15 min

---

### ✅ 2.4 Poussière aux collisions boule-boule

**Fichier** : `src/petanque/PetanqueEngine.js`
**Action** : Trouver la méthode de collision boule-boule (chercher `resolveCollision` ou `_handleCollision`). Après la résolution de collision, ajouter :
```js
// Dust at collision point
if (this.renderer) {
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    this.renderer.spawnDust(mx, my, 3, this.terrainType);
}
```
**Note** : `spawnDust` existe déjà dans EngineRenderer.js L84. On réutilise avec count=3 (léger).
**Temps** : 10 min

---

### ✅ 2.5 Renforcer le screen shake sur carreau

**Fichier** : `src/petanque/PetanqueEngine.js`
**Action** : Trouver la détection de carreau (chercher `CARREAU_THRESHOLD` ou `isCarreau`). Après détection, augmenter l'intensité du shake :
```js
// Carreau shake (plus fort que le shake normal)
this.scene.cameras.main.shake(250, 0.012); // vs 150ms / 0.004 normal
```
**Fichier Constants.js** : Ajouter :
```js
export const CARREAU_SHAKE_DURATION = 250;
export const CARREAU_SHAKE_INTENSITY = 0.012;
```
**Temps** : 10 min

---

### ✅ 2.6 Hitstop étendu sur impacts forts

**Fichier** : `src/utils/Constants.js`
**Action** : Les constantes existent déjà (L158-159) :
```js
export const HITSTOP_BOULE_MS = 60;
export const HITSTOP_CARREAU_MS = 100;
```
**Modifier** :
```js
export const HITSTOP_BOULE_MS = 80;      // 60 → 80 (plus perceptible)
export const HITSTOP_CARREAU_MS = 150;    // 100 → 150 (moment dramatique)
```
**Temps** : 2 min

---

### ✅ 2.7 Barks plus fréquentes et visibles

**Fichier** : `src/utils/Constants.js`
**Ligne 165** : Changer `BARK_PROBABILITY` de `0.4` à `0.55` :
```js
export const BARK_PROBABILITY = 0.55; // 40% → 55%
```

**Fichier** : `src/petanque/EngineRenderer.js`
**Action** : Trouver la méthode `showBark(...)`. Ajouter un fond semi-transparent derrière le texte pour améliorer la lisibilité :
```js
// Ajouter un petit background derrière le bark
const bg = this.scene.add.graphics().setDepth(61);
bg.fillStyle(0x3A2E28, 0.7);
bg.fillRoundedRect(barkText.x - barkText.width/2 - 6, barkText.y - 8, barkText.width + 12, 20, 4);
```
**Temps** : 15 min

---

### ✅ 2.8 SFX pour interactions UI (menus)

**Fichier** : `src/utils/SoundManager.js`
**Action** : Vérifier que `sfxUIClick` existe et est appelé. Ajouter une variante `sfxUIHover` :
```js
export function sfxUIHover(scene) {
    _playSfx(scene, 'ui_click', 0.3, 1.3); // même son mais plus aigu et doux
}
```

**Fichiers scènes** : Dans chaque scène qui a des boutons interactifs, ajouter un son au survol/clic :
- `TitleScene.js` : sur les boutons du menu principal
- `QuickPlayScene.js` : sur les onglets et sélections
- `ShopScene.js` : sur les items et onglets
- `CharSelectScene.js` : sur les cellules personnage

**Pattern** :
```js
button.on('pointerover', () => sfxUIHover(this));
button.on('pointerdown', () => sfxUIClick(this));
```
**Temps** : 30 min

---

## AXE 3 — TUTORIEL IN-GAME & FTUE (~3h)

> Guider le nouveau joueur sans bloquer. Overlay dans PetanqueScene.
> **Impact** : Sans FTUE, 80% des joueurs quittent en 30 secondes.

### 3.1 Refondre InGameTutorial pour 3 étapes guidées

**Fichier** : `src/ui/InGameTutorial.js` (588 lignes existantes)
**Action** : Refactorer pour 3 phases claires au lieu de hints contextuels :

**Phase 1 — VISER** (déclenchée au tout premier lancer du joueur, jamais après) :
```
Overlay semi-transparent sur le terrain.
Flèche animée pointant vers la zone de lancer.
Texte : "Glissez vers le bas pour viser, relâchez pour lancer !"
Sous-texte : "Plus vous tirez loin, plus la boule ira vite."
Se ferme automatiquement quand le joueur commence à glisser.
```

**Phase 2 — LOFT** (déclenchée après le 2e lancer si le joueur n'a jamais changé de loft) :
```
Mini-overlay en bas de l'écran (ne couvre pas le terrain).
Texte : "Choisissez votre trajectoire : Roulette (précis) ou Plombée (haut)."
Flèche vers le sélecteur de loft.
Se ferme quand le joueur sélectionne un loft.
```

**Phase 3 — SCORE** (déclenchée à la fin de la première mène) :
```
Overlay avec explication du scoring.
Texte : "Chaque boule plus proche que la meilleure adverse = 1 point !"
Texte : "Premier à 13 points gagne la partie."
Bouton "Compris !" pour fermer.
```

**Persistence** : Utiliser `SaveManager` pour stocker `save.tutorialPhasesDone = [1, 2, 3]`. Ne jamais remontrer une phase déjà vue.

**Fichier SaveManager.js** : Ajouter au schéma de save par défaut :
```js
tutorialPhasesDone: []
```

**Fichier Constants.js** : Ajouter :
```js
// Tutorial in-game
export const TUTORIAL_PHASE_AIM = 1;
export const TUTORIAL_PHASE_LOFT = 2;
export const TUTORIAL_PHASE_SCORE = 3;
```

**Temps** : 1h30

---

### 3.2 Quick Start depuis le titre

**Fichier** : `src/scenes/TitleScene.js`
**Action** : Ajouter un bouton "JOUER" proéminent qui lance une partie rapide avec des paramètres par défaut :
```js
// Sous le titre, avant les options du menu
const quickStartBtn = this.add.text(cx, 260, '▶  JOUER', {
    fontFamily: 'monospace', fontSize: '18px', color: '#F5E6D0',
    backgroundColor: '#C4854A', padding: { x: 20, y: 10 }
}).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(50);

quickStartBtn.on('pointerdown', () => {
    this.scene.start('PetanqueScene', {
        terrain: 'village',
        difficulty: 'easy',
        format: 'tete_a_tete',
        opponentId: 'papi_rene',
        playerCharId: 'rookie',
        returnScene: 'TitleScene'
    });
});
```
**Note** : Le Quick Start utilise le terrain Village (le plus simple) contre Papi René (le plus facile). Idéal pour les nouveaux joueurs.
**Temps** : 20 min

---

### 3.3 Premier lancement : forcer Arcade

**Fichier** : `src/scenes/TitleScene.js`
**Action** : Si `save.arcadeProgress.currentRound === 0` ET `save.tutorialPhasesDone.length === 0` (jamais joué), rediriger automatiquement vers ArcadeScene au lieu d'afficher le menu :
```js
const save = loadSave();
if (save.arcadeProgress.currentRound === 0 && (!save.tutorialPhasesDone || save.tutorialPhasesDone.length === 0)) {
    // Premier lancement : lancer l'arcade directement
    this.time.delayedCall(500, () => {
        this.scene.start('ArcadeScene');
    });
    return;
}
```
**Note** : Ceci ne se déclenche qu'UNE SEULE FOIS (first time user experience).
**Temps** : 15 min

---

### 3.4 Hint contextuel : "Appuyez TAB pour le classement"

**Fichier** : `src/petanque/PetanqueEngine.js`
**Action** : Après la première mène, si le joueur n'a jamais appuyé TAB, afficher via `renderer.showMessage()` :
```js
// Après score_mene, vérifier si hint TAB déjà montré
if (!this._tabHintShown) {
    this._tabHintShown = true;
    this.renderer.showMessage('TAB = voir le classement', false);
}
```
**Fichier PetanqueScene.js** : Reset `_tabHintShown = false` dans `init()`.
**Temps** : 10 min

---

## AXE 4 — NARRATIVE ARCADE (~4h)

> Donner de la chair au mode Arcade. Dialogues, personnalité, progression.
> **Référence** : `docs/plans/PLAN_NARRATIVE_ARCADE.md` (bible narrative complète).
> **Impact** : Le joueur joue pour l'histoire, pas juste pour le gameplay.

### 4.1 Dialogues pré-match dans VSIntroScene

**Fichier** : `src/scenes/VSIntroScene.js` (319 lignes)
**Action** : Ajouter un système de dialogue narratif AVANT le "VS" :
- Lire `arcade.json` pour récupérer le `narrativeIntro` du round en cours
- Afficher 1-2 répliques de l'adversaire (bark style) avant la transition

**Données à ajouter dans `public/data/arcade.json`** pour chaque round :
```json
{
  "rounds": [
    {
      "id": 1,
      "opponent": "la_choupe",
      "preMatchDialogue": [
        { "speaker": "narrator", "text": "Place du village. Le soleil tape." },
        { "speaker": "la_choupe", "text": "Alors p'tit, tu veux jouer ? Montre-moi c'que t'as dans les tripes !" },
        { "speaker": "rookie", "text": "Je suis prêt." }
      ],
      "postMatchWin": [
        { "speaker": "la_choupe", "text": "Pas mal... T'as du cran, gamin." }
      ],
      "postMatchLose": [
        { "speaker": "la_choupe", "text": "Hé hé, reviens quand t'auras grandi !" }
      ]
    },
    {
      "id": 2,
      "opponent": "mamie_josette",
      "preMatchDialogue": [
        { "speaker": "narrator", "text": "Le parc municipal. Les cigales chantent." },
        { "speaker": "mamie_josette", "text": "Mon petit... Approche, que je te montre comment on faisait dans le temps." },
        { "speaker": "rookie", "text": "Je ne vous sous-estime pas, Mamie." }
      ],
      "postMatchWin": [
        { "speaker": "mamie_josette", "text": "Ah, jeunesse... Tu as de beaux jours devant toi." }
      ],
      "postMatchLose": [
        { "speaker": "mamie_josette", "text": "Patience, mon petit. Rome ne s'est pas faite en un jour." }
      ]
    },
    {
      "id": 3,
      "opponent": "fazzino",
      "preMatchDialogue": [
        { "speaker": "narrator", "text": "La colline aux oliviers. Le vent souffle." },
        { "speaker": "fazzino", "text": "J'ai analysé ton style. Probabilité de victoire : 23.7% pour toi." },
        { "speaker": "rookie", "text": "Les chiffres ne disent pas tout." }
      ],
      "postMatchWin": [
        { "speaker": "fazzino", "text": "Erreur de calcul... Impressionnant." }
      ],
      "postMatchLose": [
        { "speaker": "fazzino", "text": "Les mathématiques ne mentent jamais." }
      ]
    },
    {
      "id": 4,
      "opponent": "suchaud",
      "preMatchDialogue": [
        { "speaker": "narrator", "text": "Les Docks. Béton et métal." },
        { "speaker": "suchaud", "text": "..." },
        { "speaker": "suchaud", "text": "Joue. On verra." },
        { "speaker": "rookie", "text": "(Il est intimidant...)" }
      ],
      "postMatchWin": [
        { "speaker": "suchaud", "text": "...Bien joué." }
      ],
      "postMatchLose": [
        { "speaker": "suchaud", "text": "Trop tendre." }
      ]
    },
    {
      "id": 5,
      "opponent": "ley",
      "preMatchDialogue": [
        { "speaker": "narrator", "text": "La plage de La Ciotat. Le soleil se couche. La finale." },
        { "speaker": "ley", "text": "Donc c'est toi qui a battu tout le monde... Montre-moi pourquoi." },
        { "speaker": "rookie", "text": "Pour mon grand-père. Pour le Carreau d'Or." }
      ],
      "postMatchWin": [
        { "speaker": "ley", "text": "Le petit-fils d'Auguste... Tu portes bien son nom." },
        { "speaker": "narrator", "text": "Tu es le Champion du Carreau d'Or !" }
      ],
      "postMatchLose": [
        { "speaker": "ley", "text": "Pas encore prêt. Reviens plus fort." }
      ]
    }
  ]
}
```

**Fichier VSIntroScene.js** — Modifications :
1. Dans `init(data)`, récupérer `data.preMatchDialogue` (tableau de répliques)
2. Dans `create()`, avant l'animation VS :
   - Si `preMatchDialogue` existe et n'est pas vide, afficher les dialogues en séquence
   - Utiliser `DialogBox` (existe dans `src/ui/DialogBox.js`) pour chaque réplique
   - Quand tous les dialogues sont finis, lancer l'animation VS classique
3. Si pas de dialogue (Quick Play), comportement actuel inchangé

**Fichier ArcadeScene.js** — Modifications :
1. Lire `arcade.json` pour le round courant
2. Passer `preMatchDialogue` dans les data de `scene.start('VSIntroScene', { ..., preMatchDialogue })`

**Temps** : 1h30

---

### 4.2 Dialogues post-match dans ResultScene

**Fichier** : `src/scenes/ResultScene.js` (528 lignes)
**Action** : Avant l'affichage des récompenses, afficher le dialogue post-match :
1. Dans `init(data)`, récupérer `data.postMatchDialogue`
2. Dans `create()`, si `postMatchDialogue` existe :
   - Afficher le dialogue via DialogBox AVANT les stats/récompenses
   - Quand dialogue terminé, révéler les stats (tween alpha 0→1)
3. Si pas de dialogue, comportement actuel inchangé

**Fichier PetanqueScene.js** : Quand la partie finit et qu'on passe à ResultScene, ajouter dans les data :
```js
const roundData = this.arcadeRound ? arcadeJson.rounds[this.arcadeRound - 1] : null;
const isWin = /* joueur a gagné */;
const postMatchDialogue = roundData
    ? (isWin ? roundData.postMatchWin : roundData.postMatchLose)
    : null;

this.scene.start('ResultScene', {
    ...,
    postMatchDialogue
});
```

**Temps** : 45 min

---

### 4.3 Intro narrative Arcade

**Fichier** : `src/scenes/ArcadeScene.js` (565 lignes)
**Action** : Au premier lancement de l'Arcade (`arcadeState.currentRound === 0` ou 1), afficher une intro narrative :
```
[Fondu au noir]
"Un coffret poussiéreux... Les boules de ton grand-père Auguste."
"On dit qu'il était le meilleur joueur de La Ciotat."
"Le tournoi du Carreau d'Or commence demain."
"C'est le moment de prouver que tu es digne de son héritage."
[Fondu vers ArcadeScene]
```

**Implémentation** :
1. Vérifier `save.arcadeProgress.introSeen` (ajouter ce flag dans SaveManager defaults)
2. Si pas encore vu, afficher les textes un par un avec effet typewriter (réutiliser la logique de DialogBox)
3. Marquer `introSeen = true` dans le save
4. Puis afficher l'écran arcade normal

**Fichier SaveManager.js** : Ajouter dans les defaults :
```js
arcadeProgress: {
    currentRound: 0,
    wins: 0,
    losses: 0,
    introSeen: false  // ← AJOUTER
}
```

**Temps** : 45 min

---

### 4.4 Célébration de déblocage personnage

**Fichier** : `src/scenes/ResultScene.js`
**Action** : Quand un adversaire est battu en Arcade et devient jouable, afficher une notification spéciale :
```
[Animation dorée, SFX victoire]
"NOUVEAU PERSONNAGE !"
"[Nom] a rejoint votre roster !"
[Portrait du personnage + stats miniatures]
```

**Implémentation** :
1. Dans ResultScene, après les dialogues post-match, vérifier si `opponentId` vient d'être ajouté à `save.unlockedCharacters`
2. Si oui, afficher l'overlay de déblocage pendant 3 secondes
3. Utiliser la SFX de score (`sfxScore`) + animation tween (scale 0→1 avec rebond)

**Temps** : 30 min

---

### 4.5 Notification de milestones

**Fichier** : `src/scenes/ResultScene.js`
**Action** : Après chaque match, vérifier les milestones de `arcade.json` :
```json
"milestones": [
    { "id": "first_win", "condition": "wins >= 1", "reward": 50, "text": "Première victoire !" },
    { "id": "first_carreau", "condition": "carreaux >= 1", "reward": 25, "text": "Premier carreau !" },
    { "id": "arcade_half", "condition": "wins >= 3", "reward": 75, "text": "Mi-parcours !" },
    { "id": "champion", "condition": "arcade_complete", "reward": 200, "text": "Champion du Carreau d'Or !" },
    { "id": "perfect_run", "condition": "wins >= 5 && losses === 0", "reward": 300, "text": "Sans faute !" },
    { "id": "fanny", "condition": "13-0 win", "reward": 100, "text": "FANNY !" }
]
```

**Implémentation** :
1. Stocker `save.milestonesUnlocked = []` dans SaveManager defaults
2. Après chaque match, vérifier chaque milestone non débloqué
3. Si condition remplie, afficher une notification toast (petit popup en haut de l'écran, 3s) :
   ```
   ★ MILESTONE : "Premier carreau !" — +25 Galets
   ```
4. Ajouter les galets via `addGalets(reward)`
5. Sauvegarder le milestone comme débloqué

**Fichier SaveManager.js** : Ajouter dans defaults :
```js
milestonesUnlocked: []
```

**Temps** : 45 min

---

## AXE 5 — PUBLICATION & POLISH (~2h)

> Préparer le jeu pour itch.io. Build, performance, derniers détails.
> **Impact** : Le jeu fonctionne partout, charge vite, fait pro.

### 5.1 Optimiser le build Vite

**Fichier** : `vite.config.js`
**Action** : Après le nettoyage de l'axe 1, vérifier que la config est optimale :
```js
import { defineConfig } from 'vite';

export default defineConfig({
    base: './',
    build: {
        assetsInlineLimit: 0,
        target: 'es2020',
        minify: 'terser',
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules/phaser')) {
                        return 'phaser';
                    }
                }
            }
        }
    },
    server: {
        port: 8080
    }
});
```
**Ajouts** : `target: 'es2020'` (compatibility navigateurs modernes), `minify: 'terser'` (meilleure compression).
**Temps** : 5 min

---

### 5.2 Meta tags et page HTML

**Fichier** : `index.html`
**Action** : Vérifier/ajouter les meta tags essentiels pour le web :
```html
<meta name="description" content="Petanque Master - Jeu de pétanque pixel art. 12 personnages, 5 terrains, mode Arcade !">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<meta name="theme-color" content="#3A2E28">
<meta name="apple-mobile-web-app-capable" content="yes">
<link rel="icon" type="image/png" href="./assets/sprites/favicon.png">
```
**Note** : Si `favicon.png` n'existe pas, créer un favicon 32x32 à partir du logo du jeu (crop + resize).
**Temps** : 10 min

---

### 5.3 Écran de chargement informatif

**Fichier** : `src/scenes/BootScene.js`
**Action** : L'écran de chargement existe déjà avec des tips. Vérifier que :
1. La barre de progression est visible et animée
2. Les tips sont pertinents (pas de TODO ou placeholder)
3. Le logo du jeu apparaît pendant le chargement
4. Le passage à TitleScene est fluide (pas de flash blanc)
**Temps** : 15 min

---

### 5.4 Pause menu en jeu

**Fichier** : `src/scenes/PetanqueScene.js`
**Action** : Ajouter un bouton pause / touche Échap qui ouvre un menu :
```
[Overlay sombre]
PAUSE
───────────
▶  Reprendre
🔊  Son: ON/OFF
🚪  Quitter (retour menu)
```

**Implémentation** :
1. Écouter la touche ESC (si pas déjà utilisée par AimingSystem pour annuler)
2. Mettre `this.scene.pause('PetanqueScene')` ou `timeScale = 0`
3. Afficher un overlay UI par-dessus
4. "Reprendre" : retirer l'overlay, reprendre
5. "Quitter" : confirmation, puis `scene.start(returnScene)`
6. "Son" : toggle via SoundManager

**Note** : Vérifier que ESC n'est pas déjà utilisé par AimingSystem pour annuler un tir. Si oui, utiliser la touche P à la place, et ajouter un petit bouton ⏸ cliquable en haut à droite.

**Fichier Constants.js** : Ajouter :
```js
export const PAUSE_KEY = 'P';
```

**Temps** : 45 min

---

### 5.5 Validation performance finale

**Action manuelle** (pas de code) :
1. `npm run build` — vérifier que le build passe sans erreur
2. `npm run preview` — tester le build en local
3. Vérifier 60 FPS sur les 5 terrains
4. Vérifier que le jeu charge en < 5 secondes
5. Tester un cycle complet : Title → Arcade → 1 match → Result → retour
6. `npx vitest run` — tous les tests passent

**Temps** : 20 min

---

### 5.6 Préparation itch.io

**Action manuelle** :
1. `npm run build` → le dossier `dist/` contient le jeu complet
2. Zipper le contenu de `dist/` (pas le dossier lui-même)
3. Sur itch.io :
   - Titre : "Petanque Master"
   - Type : HTML5
   - Dimensions : 832x480 (ou "auto")
   - Fullscreen : activer
   - Mobile friendly : oui (touch input)
   - Tags : petanque, pixel-art, sports, french, arcade, strategy
   - Description : Texte promotionnel (à rédiger)

**Temps** : 15 min (hors création compte/page)

---

## RÉSUMÉ PAR AXE

| Axe | Tâches | Temps | Impact |
|-----|--------|-------|--------|
| 1. Bugs gameplay & nettoyage | 9 tâches | ~3h | **Fondation solide** (cochonnet, hitbox, transition) |
| 2. Game Feel & Juice | 8 tâches | ~3h | **Le jeu "sent" bien** |
| 3. Tutoriel & FTUE | 4 tâches | ~3h | **Accessibilité nouveaux joueurs** |
| 4. Narrative Arcade | 5 tâches | ~4h | **Le joueur joue pour l'histoire** |
| 5. Publication & Polish | 6 tâches | ~2h | Prêt pour distribution |
| **TOTAL** | **32 tâches** | **~15h** | **100/100** |

## ORDRE D'EXÉCUTION RECOMMANDÉ

```
1. AXE 1 (Nettoyage)     — Assainir la base
2. AXE 2 (Game Feel)     — Rendre le jeu satisfaisant
3. AXE 4 (Narrative)     — Donner du sens à l'Arcade
4. AXE 3 (FTUE)          — Guider les nouveaux
5. AXE 5 (Publication)   — Finaliser et distribuer
```

> **Note** : L'axe 2 et 4 peuvent être parallélisés (fichiers différents).
> L'axe 3 dépend partiellement de l'axe 4 (le FTUE redirige vers l'Arcade narrative).

---

## PLANS ARCHIVÉS (référence uniquement)

| Plan | Nouveau statut | Raison |
|------|----------------|--------|
| `docs/archive/PLAN_PHASER4_MIGRATION.md` | ✅ Terminé | Migration faite session 9b |
| `docs/archive/PLAN_SESSION_CLEANUP_V2.md` | ✅ Absorbé | Items intégrés dans ce plan |
| `docs/archive/PLAN_CORRECTIONS.md` | ✅ Absorbé | Bugs corrigés, items dans MASTER_PLAN |
| `docs/archive/SPRINT_FINAL.md` | ✅ Obsolète | Remplacé par ce plan |
| `docs/archive/HANDOFF.md` | ✅ Historique | Ancien roster |
| `docs/archive/PLAN_MVP.md` | ✅ Historique | Sprint plan initial |

## PLANS CONSERVÉS (documents vivants)

| Plan | Statut | Usage |
|------|--------|-------|
| `docs/plans/PLAN_NARRATIVE_ARCADE.md` | Bible narrative | Référence pour Axe 4 |
| `docs/plans/PLAN_VISUAL_OVERHAUL.md` | Roadmap PixelLab | Référence pour assets futurs |
