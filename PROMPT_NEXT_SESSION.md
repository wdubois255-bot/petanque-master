# Prompt — Session du 20 mars 2026

Copie-colle ce texte tel quel dans une nouvelle conversation Claude Code.

---

## Contexte

Tu reprends **Petanque Master**, jeu de petanque competitif pixel art (Phaser 3 + JS + Vite). Projet demarre le 13 mars, 159 commits en 6 jours. Le jeu est jouable et stable.

**Lis en premier :** `CLAUDE.md` puis `CAHIER_DES_CHARGES.md`

## Objectif global

Finir le jeu web → publier sur **itch.io** + soumettre a **CrazyGames/Poki** (revenue share pubs) → valider l'interet → mobile si succes.

## Etat technique (19 mars soir)

- 6 personnages, 5 terrains, arcade 5 rounds, 14 scenes, 138 tests, physique COR 0.62
- **Monnaie = "Galets"** (renomme de Ecus). Constantes `GALET_*`, fonctions `addGalets()/spendGalets()`, save `galets`. Migration auto anciennes saves.
- Touch input fonctionne (pointerdown/move/up). Scale mode FIT. Mobile browser = OK.
- Dust particles a l'atterrissage = deja implementees (EngineRenderer.spawnDust)
- Son procedural en fallback si fichiers absents (robuste)

---

## QUESTIONS A SE POSER EN DEBUT DE SESSION

Avant de coder, reflechis a ces 3 questions et propose des solutions concretes :

### Q1 — Le jeu est-il comprehensible sans explication ?

Un joueur CrazyGames ne lira pas le tutoriel. Il doit comprendre en 30 secondes. Aujourd'hui il y a **5 ecrans avant le premier lancer** (Boot → Title → CharSelect → QuickPlay → VSIntro → PetanqueScene).

**Action potentielle :** Ajouter un bouton **"Jouer"** sur TitleScene qui lance un match avec params par defaut (Rookie vs La Choupe, Village, facile). Code minimal :
```js
// Dans _onMainSelect(), ajouter un item "Jouer" en position 0
this.scene.start('PetanqueScene', {
    terrain: 'terre', difficulty: 'easy',
    playerCharId: 'rookie', opponentId: 'la_choupe',
    bouleType: 'acier', format: 'tete_a_tete',
    returnScene: 'TitleScene'
});
```
→ Discuter si c'est pertinent ou si ca casse le flow arcade.

### Q2 — Qu'est-ce qui fait revenir le joueur ?

Apres l'arcade (~15 min), plus de raison de rejouer. Ideas a faible cout :
- **Defi quotidien** : contrainte aleatoire (terrain + regle speciale), recompense Galets
- **Records par terrain** : meilleur score, plus de carreaux, victoire la plus serree
- **Mode "1 boule"** : 1 boule chacun, pas de droit a l'erreur (match en 2 min, tension max)
- **Arcade+** : meme arcade mais IA expert (rejouabilite sans contenu)

→ Choisir 1-2 de ces ideas et les implementer si le temps le permet.

### Q3 — Marcel casse l'harmonie visuelle

Marcel est le SEUL sprite qui ne colle pas (style "RPG retro", palette terne, proportions differentes). Tous les autres (Ley, Choupe, Reyes, Rookie, Magicien) sont dans le meme registre detaille buste-cadre.

→ Si PixelLab MCP est dispo, regenerer Marcel en utilisant Ley comme `style_image`. Prompt : "old cunning man, red polo shirt, white cap, smirk, confident stance, pixel art bust portrait". Meme cadrage 128x128 que Ley.

---

## PLAN D'IMPLEMENTATION (par ordre de priorite)

### BLOC 1 — Game Feel immediat (~20 min)

Ces changements sont petits mais transforment la sensation de jeu.

**1a. Screen shake a l'impact boule-boule** (5 min)
- Fichier : `src/petanque/PetanqueEngine.js`, dans update() apres `_spawnCollisionSparks()` (~ligne 915)
- Code : `this.scene.cameras.main.shake(60, 0.003);`
- Pour les carreaux : shake plus fort `this.scene.cameras.main.shake(120, 0.006);`
- Impact enorme sur le game feel pour 1 ligne de code

**1b. Particules poussiere a l'impact boule-boule** (10 min)
- Les dust particles existent deja pour l'atterrissage (`_spawnDust`)
- Ajouter un appel `_spawnDust(mx, my, 3)` au point de collision (meme endroit que le shake)
- Avec couleur terrain (terre=ocre, sable=beige, herbe=vert, dalles=gris)

**1c. Variation pitch SFX** (5 min)
- Dans SoundManager, quand on joue sfxBouleBoule : ajouter `rate: 0.9 + Math.random() * 0.2`
- Ca evite la repetition robotique du meme son
- Meme chose pour sfxLanding

### BLOC 2 — Capacites Rookie fonctionnelles (~45 min) — CRITIQUE

Les 3 capacites sont trackees et affichees mais **AUCUN effet gameplay**.

**Probleme central** : `_getCharacterAbility()` dans `PetanqueScene.js:316` n'a PAS d'entree pour 'rookie'.

**2a. Ajouter le Rookie dans _getCharacterAbility()** (PetanqueScene.js:316-354)

Le Rookie cumule les 3 capacites a 34 pts. Solution :
- **Determination** = passif permanent (pas dans _getCharacterAbility, gere directement dans AimingSystem)
- Retourner **L'Instinct** ou **Le Naturel** (la plus haute debloquee) comme ability active via [C]
- Si les 2 sont debloquees : [C] = L'Instinct, [V] = Le Naturel (2 boutons)

Lire `loadSave().rookie.abilitiesUnlocked` pour savoir quelles capacites sont actives.

**2b. Implementer les effets dans AimingSystem.js**

| Capacite | Type | Touche | Effet | Ou dans le code |
|----------|------|--------|-------|-----------------|
| L'Instinct | Actif, 1 charge | [C] | `scene.time.timeScale = 0.4` pendant 2s + vignette doree | `_toggleAbility()` ligne 526 |
| Determination | Passif auto | — | Apres mene perdue, `wobble *= 0.5` au prochain lancer | `_getWobbleAmplitude()` ligne 828 |
| Le Naturel | Actif, 1 charge | [C] ou [V] | `wobble *= 0.05` pour CE lancer + aura doree | `_getWobbleAmplitude()` ligne 828 |

**2c. Determination passif** : hook dans PetanqueScene
- Dans `engine.onScore` (PetanqueScene:139) : si `winner === 'opponent'`, set `aimingSystem._determinationActive = true`
- Dans `_getWobbleAmplitude()` : `if (this._determinationActive) { base *= 0.5; this._determinationActive = false; }`

### BLOC 3 — Capacites boutique + Deblocages (~20 min)

**3a. Focus+1 et Charge+1 depuis purchases** (10 min)
- Dans PetanqueScene.js:110, apres `resetFocusCharges(5)` :
```js
const save = loadSave();
const extraFocus = save.purchases.filter(p => p === 'extra_focus').length;
this.aimingSystem.resetFocusCharges(5 + extraFocus);
const extraCharge = save.purchases.filter(p => p === 'extra_charge').length;
if (ability) ability.charges += extraCharge;
```
- Verifier les IDs dans `public/data/shop.json`

**3b. Deblocages par nombre de victoires** (10 min)
- Dans ResultScene.js, apres `addWin()` :
- 5V=cochonnet bleu, 10V=boule chrome, 20V=titre "L'Artilleur", 50V=cochonnet dore + "Maitre Bouliste"
- 3 carreaux en 1 match = badge "Le Tireur" (verifier `matchStats.carreaux >= 3`)
- Afficher banner d'unlock

### BLOC 4 — Polish visuel (~15 min)

**4a. Confetti provencal** dans ResultScene (victoires) et ArcadeScene (completion)
```js
const PROVENCAL = [0xFFD700, 0xC2703E, 0x9B7BB8, 0x6B8E4E, 0x87CEEB];
```

**4b. Skip VSIntroScene** apres 1ere vue (flag session, variable globale)

### BLOC 5 — Rejouabilite (si temps reste, ~30 min)

Choisir UNE de ces options et l'implementer :

**Option A — Mode "1 Boule"** (recommande, le plus simple)
- Dans QuickPlayScene : ajouter un toggle "Mode 1 Boule"
- PetanqueEngine : si `format === 'une_boule'`, chaque joueur a 1 seule boule par mene
- Victoire a 7 pts au lieu de 13 (match rapide)
- Impact : tension extreme, chaque lancer compte, matchs de 3 min

**Option B — Records par terrain**
- SaveManager : ajouter `records: { village: { bestScore: 13-0, carreaux: 5 }, ... }`
- PlayerScene : afficher les records
- ResultScene : comparer et mettre a jour

**Option C — Arcade+** (IA expert)
- ArcadeScene : si arcade deja completee, proposer "Arcade+" avec `difficulty: 'expert'`
- Pas de nouveau contenu, juste plus dur

### BLOC 6 — Preparation publication (si tout le reste est fait)

- [ ] `npm run build` → verifier que GitHub Pages deploy
- [ ] 4 screenshots : TitleScene, VSIntroScene (le plus vendeur), PetanqueScene en action, ShopScene
- [ ] Texte itch.io : 2-3 phrases accrocheuses, tags (petanque, pixel-art, sports, fighting-game, casual, french)
- [ ] Page itch.io : gratuit, web-only, embed HTML5

---

## PATTERNS CRITIQUES

1. **Phaser reutilise les instances de scene** → TOUJOURS reset les flags dans init()
2. **removeAllListeners()** dans chaque _shutdown()
3. **cameras.main.resetFX()** dans chaque create()
4. **scene.start() DIRECT** pour transitions critiques
5. **Monnaie = Galets** : GALET_*, addGalets/spendGalets, save.galets, icone ocre "G"
6. **Marcel a refaire** (sprite incoherent avec les autres) si PixelLab dispo

## Fichiers cles

| Fichier | Role |
|---------|------|
| `src/petanque/PetanqueEngine.js` | Moteur (1248 lignes), collision ~ligne 915, slowmo ~ligne 856 |
| `src/petanque/AimingSystem.js` | Visee, wobble ~ligne 828, abilities ~ligne 526 |
| `src/scenes/PetanqueScene.js` | Scene match, _getCharacterAbility() ligne 316 |
| `src/scenes/TitleScene.js` | Menu 5 items, _onMainSelect() ligne 826 |
| `src/scenes/ResultScene.js` | Resultats, galets, deblocages |
| `src/scenes/ArcadeScene.js` | Arcade 5 rounds |
| `src/utils/Constants.js` | GALET_*, SLOWMO_*, CHAR_SPRITE_MAP |
| `src/utils/SaveManager.js` | addGalets(), addWin(), rookieStats |
| `src/utils/SoundManager.js` | SFX, musique, ambiance, rolling sound |
| `src/ui/UIFactory.js` | createGaletsDisplay(), composants UI |

## Commandes

```bash
npm run dev          # Serveur dev (Vite HMR)
npm test             # 138 tests unitaires
npm run build        # Build production
```

---

Commence par lire CLAUDE.md, puis pose-toi les 3 questions (Q1, Q2, Q3) avant d'attaquer le code. Propose des reponses. Ensuite, attaque Bloc 1 (game feel, 20 min) puis Bloc 2 (capacites Rookie). Teste dans le navigateur apres chaque bloc.
