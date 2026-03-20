# PLAN DE CORRECTIONS COMPLET — Petanque Master

> **Contexte** : Ce document est un plan d'execution pour une session Claude Code avec contexte propre.
> **Objectif** : Corriger tous les problemes identifies dans CONTRE_ANALYSE.md + optimiser l'outillage Claude Code.
> **Regle** : Commiter apres chaque bloc. Tester apres chaque modification de code. Ne pas enchainer 2 blocs sans commit.
> **Ordre** : Suivre les blocs dans l'ordre numerote. Ne pas sauter de bloc.

---

## BLOC 0 — LECTURE PREALABLE OBLIGATOIRE (ne rien modifier)

Avant de toucher quoi que ce soit, lis dans cet ordre :
1. `CLAUDE.md` (conventions)
2. `CONTRE_ANALYSE.md` (audit complet — c'est lui qui justifie tout ce plan)
3. `src/utils/Constants.js` (source de verite numerique)
4. `public/data/characters.json` (source de verite personnages)
5. `public/data/terrains.json` (source de verite terrains)
6. `src/utils/SaveManager.js` (source de verite sauvegarde)

**Ne modifie AUCUN fichier pendant ce bloc.** Comprends d'abord.

---

## BLOC 1 — RESOUDRE LES CONTRADICTIONS DOC/CODE

> Priorite : **CRITIQUE**
> Temps estime : 30 min
> Fichiers a modifier : CLAUDE.md, SPRINT_FINAL.md, CAHIER_DES_CHARGES.md, GAME_DESIGN.md, public/data/boules.json

### Regle : Constants.js et characters.json sont les SOURCES DE VERITE

Toute valeur numerique dans un autre fichier qui les contredit doit etre corrigee pour matcher le code. Le code qui tourne est la realite. Les docs doivent suivre.

### 1.1 — Corriger CLAUDE.md ligne 115

**Fichier** : `CLAUDE.md`
**Probleme** : La ligne dit `Restitution boule-boule=0.85, boule-cochonnet=0.7` mais Constants.js utilise `RESTITUTION_BOULE = 0.62` et `RESTITUTION_COCHONNET = 0.50`.
**Action** : Remplacer la phrase par :
```
- **Physique petanque** : custom, PAS de Matter.js. Friction lineaire constante.
  Constants.js est la SOURCE DE VERITE pour toutes les valeurs numeriques.
  Ne jamais dupliquer de valeurs physiques dans d'autres fichiers.
```

### 1.2 — Corriger CLAUDE.md ligne 112

**Probleme** : Dit `Sprites persos : 32x32 (generes par PixelLab 64x64, downscale 2x nearest-neighbor)` mais CAHIER dit `128x128 spritesheets`.
**Action** : Remplacer par :
```
- **Sprites persos** : spritesheets 128x128 (4 frames x 4 directions de 32x32).
  Generes 64x64 par PixelLab, downscale 2x nearest-neighbor.
```

### 1.3 — Corriger boules.json section "physics"

**Fichier** : `public/data/boules.json`
**Probleme** : La section `"physics"` (lignes 290-298) contient `"restitution_boule_boule": 0.85` et `"restitution_boule_cochonnet": 0.7`. Constants.js utilise 0.62 et 0.50. Cette section est **morte** — le code n'utilise QUE Constants.js.
**Action** : Supprimer entierement la section `"physics"` de boules.json OU la mettre a jour pour matcher Constants.js avec un commentaire "reference only — Constants.js is source of truth".

La solution la plus propre est de la supprimer et ajouter un commentaire en haut :
```json
{
  "_comment": "Physique des boules: voir src/utils/Constants.js (source de verite)",
  "sets": [ ... ]
}
```

### 1.4 — Corriger les frictions terrain

**Probleme** : 3 sources avec des valeurs differentes.

| Terrain | GAME_DESIGN.md | terrains.json | Constants.js TERRAIN_FRICTION |
|---------|---------------|---------------|-------------------------------|
| sable   | 3.0           | 3.0           | 3.5                           |
| dalles  | 0.7           | 0.4           | 0.7                           |

**Decision a prendre** : terrains.json est charge par le code dans PetanqueScene.js et utilise directement. Constants.js TERRAIN_FRICTION est utilise comme fallback. Il y a deux chemins de code.

**Action** :
1. Dans `terrains.json` : changer la friction des docks a `0.7` (matcher GAME_DESIGN qui dit "dalles beton = 0.7")
2. Dans `Constants.js` : changer `TERRAIN_FRICTION.sable` de `3.5` a `3.0` (matcher GAME_DESIGN et terrains.json)
3. Dans `GAME_DESIGN.md` : tout est deja correct, ne rien changer

### 1.5 — Corriger les seuils du Rookie

**Probleme** : SPRINT_FINAL dit 18/26/34 mais characters.json et SaveManager.js utilisent 18/24/32.
**Decision** : Le code (characters.json + SaveManager.js) a raison — c'est ce qui tourne.
**Action** : Dans `SPRINT_FINAL.md`, corriger la section 1.4 :
- Remplacer `{ "threshold": 26` par `{ "threshold": 24`
- Remplacer `{ "threshold": 34` par `{ "threshold": 32`
- Dans la phrase "les capacites coexistent (le Rookie a 34 pts..." remplacer par "32 pts"

### 1.6 — Corriger les stats de depart du Rookie

**Probleme** : SPRINT_FINAL §1.1 dit `precision 3, puissance 3, effet 2, sang_froid 2` (10 pts). characters.json et SaveManager.js utilisent `4/4/3/3` (14 pts).
**Action** : Dans `SPRINT_FINAL.md` section 1.1, corriger :
- `Stats de depart : 14/40 points → precision 4, puissance 4, effet 3, sang_froid 3`
- Section 1.5 exemple JSON : mettre a jour les stats

### 1.7 — Corriger Reyes dans CAHIER

**Fichier** : `CAHIER_DES_CHARGES.md`
**Probleme** : Le tableau §2.4 dit Reyes = `8/8/7/8` (total 31) mais characters.json dit `8/8/7/9` (total 32).
**Action** : Corriger le tableau : SF = 9, Total = 32

### 1.8 — Corriger le nom de la monnaie dans SPRINT_FINAL

**Probleme** : SPRINT_FINAL utilise "Ecus" partout, le code utilise "Galets".
**Action** : Faire un rechercher-remplacer dans SPRINT_FINAL.md : `Ecus` → `Galets`, `ECU_` → `GALET_`, `ecus` → `galets`

### 1.9 — Corriger la couleur des ombres dans GAME_DESIGN

**Probleme** : GAME_DESIGN.md ligne 254 dit `#3A2E28` pour les ombres, CAHIER §5.1 dit `#1A1510`.
**Realite du code** : Constants.js utilise les DEUX — `OMBRE: 0x3A2E28` et `OMBRE_DEEP: 0x1A1510`. Ce sont deux niveaux d'ombre.
**Action** : Dans GAME_DESIGN.md, clarifier :
```
| Ombre chaude | `#3A2E28` | Ombres legeres, contours (JAMAIS de noir pur #000) |
| Ombre profonde | `#1A1510` | Ombres texte, text shadow (JAMAIS de noir pur #000) |
```

**Commit** : `fix: resoudre 9 contradictions doc/code (CONTRE_ANALYSE bloc 1)`

---

## BLOC 2 — CORRIGER LES BUGS DE CODE

> Priorite : **CRITIQUE**
> Temps estime : 20 min
> Fichiers a modifier : ShopScene.js, TitleScene.js, VSIntroScene.js, SaveManager.js

### 2.1 — Bug monnaie ShopScene : "E" → "G"

**Fichier** : `src/scenes/ShopScene.js`
**Ligne** : ~247 (chercher `${item.price} E`)
**Action** : Remplacer `${item.price} E` par `${item.price} G`

### 2.2 — TitleScene : ajouter init() pour reset

**Fichier** : `src/scenes/TitleScene.js`
**Probleme** : Pas de methode `init()`. Phaser reutilise les instances de scene — les flags de `create()` (lignes 20-24) ne sont executes que si la scene est recree, pas relancee.
**Action** : Ajouter avant `create()` :
```javascript
init() {
    this._menuItems = [];
    this._selectedIndex = 0;
    this._mode = 'pressstart';
    this._inputEnabled = false;
    this._menuContainer = null;
}
```
Et retirer les lignes 20-24 de `create()` qui font la meme chose (pour eviter la duplication).

### 2.3 — VSIntroScene : remplacer window.__vsIntroCount

**Fichier** : `src/scenes/VSIntroScene.js`
**Probleme** : Utilise `window.__vsIntroCount` (variable globale qui ne se reset jamais).
**Action** : Remplacer par `this.registry` de Phaser :
```javascript
// AU LIEU DE :
if (!window.__vsIntroCount) window.__vsIntroCount = 0;
window.__vsIntroCount++;
if (window.__vsIntroCount > 2) { ... }

// UTILISER :
const count = this.registry.get('vsIntroCount') || 0;
this.registry.set('vsIntroCount', count + 1);
if (count >= 2) { ... }
```
Le registry Phaser est scope a l'instance de jeu et reset au rechargement de page.

### 2.4 — SaveManager : corriger Marcel IA precision dans CAHIER

**Fichier** : `CAHIER_DES_CHARGES.md`
**Probleme** : §2.3 dit Marcel `equilibre 0.80x pointage / 0.85x tir` mais PetanqueAI.js ligne 184-185 utilise `0.65x / 0.85x`.
**Action** : Le code est intentionnel (Marcel plus fort que documente). Mettre a jour le CAHIER :
```
- [x] Bonus precision par archetype : tireur 0.55x en tir, pointeur 0.6x en pointage,
  complet 0.75x partout, **equilibre 0.65x pointage / 0.85x tir**
```

### 2.5 — Determination wobble : aligner doc et code

**Probleme** : SPRINT_FINAL dit "-50% wobble", characters.json dit "-80% wobble".
**Le code** (AimingSystem.js) : `this._focusReduction = 0.20` ce qui = 80% de reduction.
**Action** : Corriger SPRINT_FINAL section 1.4 : remplacer `-50% wobble` par `-80% wobble`

### 2.6 — progression.json : ajouter les deblocages manquants

**Fichier** : `public/data/progression.json`
**Probleme** : Ne contient que 3 badges et rien d'autre. Le systeme de deblocage est hardcode dans ArcadeScene.js et ResultScene.js.
**Action** : Enrichir progression.json avec les deblocages reels :
```json
{
  "arcade_unlocks": [
    { "round": 1, "unlocks": [{ "type": "character", "id": "la_choupe" }] },
    { "round": 2, "unlocks": [{ "type": "character", "id": "marcel" }] },
    { "round": 3, "unlocks": [{ "type": "character", "id": "magicien" }, { "type": "terrain", "id": "docks" }] },
    { "round": 4, "unlocks": [{ "type": "character", "id": "reyes" }] },
    { "round": 5, "unlocks": [{ "type": "character", "id": "ley" }, { "type": "terrain", "id": "plage" }] }
  ],
  "milestone_unlocks": [
    { "condition": "totalWins", "value": 5, "unlocks": [{ "type": "cochonnet", "id": "bleu" }] },
    { "condition": "totalWins", "value": 10, "unlocks": [{ "type": "boule", "id": "chrome" }] },
    { "condition": "totalWins", "value": 50, "unlocks": [{ "type": "cochonnet", "id": "doree" }] }
  ],
  "badges": [
    { "id": "badge_choupe", "name": "Badge Village", "master": "la_choupe", "icon": "badge_terre", "order": 1 },
    { "id": "badge_marcel", "name": "Badge Parc", "master": "marcel", "icon": "badge_herbe", "order": 2 },
    { "id": "badge_magicien", "name": "Badge Colline", "master": "magicien", "icon": "badge_maitre", "order": 3 }
  ],
  "victory_score": 13
}
```
NOTE : Ne pas encore modifier ArcadeScene.js pour lire ce JSON — c'est un refactor separable. Le but ici est que les donnees existent au bon endroit.

**Commit** : `fix: bugs code (ShopScene monnaie, TitleScene init, VSIntro global, docs alignment)`

---

## BLOC 3 — GAMEPLAY : COMPENSATION EN DEFAITE

> Priorite : **CRITIQUE**
> Temps estime : 15 min
> Fichiers a modifier : Constants.js, ResultScene.js

### 3.1 — Ajouter les constantes

**Fichier** : `src/utils/Constants.js`
**Action** : Ajouter apres les constantes GALET existantes :
```javascript
// Compensation defaite (le joueur ne repart jamais bredouille)
export const GALET_LOSS = 10;
export const ROOKIE_XP_LOSS = 1;
```

### 3.2 — Modifier ResultScene pour donner des rewards en defaite

**Fichier** : `src/scenes/ResultScene.js`
**Action** : Dans la methode `create()`, trouver la section qui calcule les galets gagnes (chercher `galetsEarned` ou `addGalets`).

Actuellement, les galets ne sont donnes qu'en victoire. Modifier la logique pour :
```javascript
// Apres la section de calcul des galets de victoire, ajouter :
if (!this.won) {
    // Compensation defaite : le joueur ne repart jamais bredouille
    const lossGalets = GALET_LOSS;
    addGalets(lossGalets);
    this.galetsEarned = lossGalets;
}
```

Il faut aussi ajouter l'import de `GALET_LOSS` et `ROOKIE_XP_LOSS` depuis Constants.js.

Pour le XP Rookie en defaite : dans la section qui gere `addRookiePoints`, ajouter un cas pour la defaite :
```javascript
// Si defaite et que le joueur joue le Rookie, donner 1 pt XP
if (!this.won && this.playerCharacter?.isRookie) {
    addRookiePoints(ROOKIE_XP_LOSS);
    // Afficher "+1 XP" sur l'ecran resultat
}
```

### 3.3 — Afficher les galets gagnes meme en defaite

Dans ResultScene, s'assurer que l'affichage `"+X Galets"` apparait aussi en defaite (probablement le meme code, juste avec un montant plus petit).

**Commit** : `feat: compensation defaite (10 galets + 1 XP rookie par defaite)`

---

## BLOC 4 — GAMEPLAY : EQUILIBRAGE PERSONNAGES

> Priorite : **IMPORTANT**
> Temps estime : 15 min
> Fichiers a modifier : public/data/characters.json

### 4.1 — Nerf Reyes (32 pts → 29 pts)

**Probleme** : Reyes a 32 pts total (8/8/7/9), le plus haut du roster. Il est strictement meilleur que tout le monde.
**Action** dans characters.json :
```json
"stats": {
    "precision": 7,
    "puissance": 7,
    "effet": 7,
    "sang_froid": 8
}
```
Total = 29. Toujours "complet" mais plus domine pas.

Son IA `angleDev` et `powerDev` restent inchanges (2.5 / 0.03) — il reste un adversaire redoutable mais ses stats brutes sont plus equilibrees.

### 4.2 — Buff La Choupe (24 pts → 27 pts)

**Probleme** : La Choupe a 24 pts (5/10/3/6), 7 de moins que Ley (31). Il est le perso le plus faible ET le premier adversaire en Arcade = premiere impression negative.
**Action** dans characters.json :
```json
"stats": {
    "precision": 6,
    "puissance": 10,
    "effet": 3,
    "sang_froid": 8
}
```
Total = 27. Il reste un bourrin (puissance 10) mais il vise un peu mieux et craque moins sous pression. Son IA `angleDev` passe de 7 a 9 (il reste l'adversaire le plus facile) :
```json
"ai": {
    "angleDev": 9,
    ...
}
```

### 4.3 — Mettre a jour CAHIER_DES_CHARGES.md

Mettre a jour le tableau §2.4 pour refleter les nouvelles stats.

**Commit** : `balance: nerf Reyes (32→29 pts), buff La Choupe (24→27 pts)`

---

## BLOC 5 — ECONOMIE : AJUSTER LES PRIX

> Priorite : **IMPORTANT**
> Temps estime : 10 min
> Fichiers a modifier : public/data/shop.json, Constants.js

### 5.1 — Doubler les gains de Galets

**Fichier** : `src/utils/Constants.js`
**Action** : Modifier les constantes existantes :
```javascript
export const GALET_WIN_ARCADE = 100;     // etait 50
export const GALET_WIN_QUICKPLAY = 40;   // etait 20
export const GALET_CARREAU_BONUS = 15;   // etait 10
export const GALET_ARCADE_COMPLETE = 150; // etait 100
export const GALET_ARCADE_PERFECT = 300;  // etait 200
export const GALET_STARTING = 100;        // etait 50
export const GALET_LOSS = 15;             // defaite (ajoute au bloc 3)
```

### 5.2 — NE PAS modifier les prix du shop

Les prix restent inchanges — c'est les gains qui doublent. Resultat :
- Premiere boule achetable apres 2-3 victoires au lieu de 5-7
- Casual : ~3-4h pour Titane au lieu de ~45h
- Le jeu reste genereux sans etre gratuit

### 5.3 — Mettre a jour le SaveManager default galets

**Fichier** : `src/utils/SaveManager.js`
**Action** : Dans `defaultSaveData()`, changer `galets: 50` en `galets: 100` pour matcher `GALET_STARTING`.

Note : les joueurs existants gardent leur solde actuel (le spread `{ ...defaultSaveData(), ...data }` preserve les valeurs existantes).

**Commit** : `balance: doubler gains galets, starter 100G, defaite 15G`

---

## BLOC 6 — REFONTE CLAUDE.md

> Priorite : **IMPORTANT**
> Temps estime : 20 min
> Fichier a modifier : CLAUDE.md

### Objectif

Transformer CLAUDE.md de "description du projet" (lu passivement) en "regles de decision" (suivies activement). Garder uniquement ce qui impacte les decisions de Claude Code a chaque conversation.

### Nouveau contenu

Reecrire CLAUDE.md avec cette structure. Le contenu complet :

```markdown
# CLAUDE.md - Petanque Master

Tu dois toujours challenger, questionner, essayer d'aller plus loin afin d'aider et d'avancer le projet.

## Regles critiques (toujours suivre)

### Sources de verite
- **Valeurs numeriques (physique, IA, gameplay)** : `src/utils/Constants.js` — UNIQUE source de verite. Ne jamais dupliquer dans d'autres fichiers.
- **Personnages (stats, abilities, barks)** : `public/data/characters.json`
- **Terrains (friction, zones, pentes)** : `public/data/terrains.json`
- **Boutique (prix, items)** : `public/data/shop.json`
- **Sauvegarde (schema, defaults)** : `src/utils/SaveManager.js`
- **Game design (concept, flow, ambiance)** : `GAME_DESIGN.md`
- **Etat du projet (ce qui est fait, ce qui reste)** : `CAHIER_DES_CHARGES.md`

### Interdictions absolues
- PAS de Matter.js (physique custom dans Ball.js)
- PAS de camera follow/pan en PetanqueScene (decision explicite)
- PAS de noir pur #000 (ombres #3A2E28 ou #1A1510)
- PAS de TypeScript
- PAS de valeurs hardcodees — tout dans Constants.js ou les JSON de data
- PAS de localStorage direct — utiliser SaveManager.js
- Phaser reutilise les scenes : TOUJOURS definir init() avec reset de tous les flags

### Regles techniques
- Pixel art : `image-rendering: pixelated` + `imageSmoothingEnabled = false`
- Tiles : 32x32 partout
- Sprites persos : spritesheets 128x128 (4x4 frames de 32x32), generes 64x64 par PixelLab
- Resolution : 832x480, scale integer x2
- Vite : `assetsInlineLimit: 0` OBLIGATOIRE
- 60 FPS obligatoire

## Stack
- Phaser 3.90.0, JavaScript ES6+, Vite 6.3+, custom physics
- MCP : PixelLab (sprites) + ElevenLabs (audio)
- Skills : `/sprite`, `/tileset`, `/sfx`, `/playtest`, `/build-assets`

## Commandes
npm install | npm run dev | npm run build | npm run preview

## Structure (reference rapide)
src/scenes/ — 12 scenes (Boot, Title, CharSelect, QuickPlay, Arcade, VSIntro, Petanque, Result, LevelUp, Shop, Tutorial, Player)
src/petanque/ — Ball, Cochonnet, PetanqueEngine, PetanqueAI, AimingSystem, EngineRenderer, TerrainRenderer, ai/
src/utils/ — Constants, SaveManager, SoundManager, UIFactory, PortraitGenerator
src/ui/ — ScorePanel, MiniMap, DialogBox, CharSelectUI
public/data/ — characters.json, terrains.json, boules.json, arcade.json, shop.json, progression.json

## Ambiance
Provencale, sud de la France, humour. Palette : ocres, terracotta, olive, lavande, ciel, creme.
Personnages caricaturaux. Dialogues courts et droles. Pas de noir pur.

## Regles petanque FIPJP
1v1 : 3 boules/joueur. L'equipe la plus loin rejoue. Score = boules plus proches que la meilleure adverse. Victoire a 13 pts.

## Fichiers de reference (lire a la demande, pas systematiquement)
- GAME_DESIGN.md — bible du game design
- CAHIER_DES_CHARGES.md — etat complet du projet
- SPRINT_FINAL.md — plan d'implementation
- research/ — 54 fichiers de recherche (voir research/00_synthese_etat_projet.md pour l'index)
```

**Commit** : `refactor: CLAUDE.md reecrit en regles de decision (80 lignes vs 156)`

---

## BLOC 7 — CREER LES SKILLS MANQUANTS

> Priorite : **IMPORTANT**
> Temps estime : 25 min
> Fichiers a creer : 3 nouveaux skills dans .claude/skills/

### 7.1 — Skill `/pre-feature`

**Creer** : `.claude/skills/pre-feature/SKILL.md`

```markdown
---
name: pre-feature
description: Planifier une feature avant de coder. Lit le code existant, identifie les fichiers impactes, propose un plan.
user-invocable: true
argument-hint: "[description de la feature]"
allowed-tools: Read, Glob, Grep, Agent
---

# Pre-Feature : Planification avant implementation

## Etapes obligatoires AVANT de coder

1. **Comprendre la demande** : reformuler en 1 phrase ce que la feature doit faire
2. **Lire le code existant** : identifier tous les fichiers qui seront modifies
3. **Lire les tests existants** : identifier les tests qui couvrent ces fichiers
4. **Identifier les constantes** : quelles nouvelles constantes dans Constants.js ?
5. **Identifier les donnees** : quels JSON dans public/data/ seront impactes ?
6. **Verifier les contradictions** : la feature est-elle coherente avec GAME_DESIGN.md et CAHIER_DES_CHARGES.md ?
7. **Proposer un plan** : liste ordonnee des modifications, fichier par fichier

## Format de sortie

```
## Plan : [nom de la feature]

### Fichiers a modifier (dans l'ordre)
1. `fichier.js` — [ce qui change]
2. ...

### Nouvelles constantes (Constants.js)
- NOM_CONSTANTE = valeur (justification)

### Donnees JSON impactees
- fichier.json : [ce qui change]

### Tests a ecrire/modifier
- test_fichier.test.js : [ce qui est teste]

### Risques identifies
- [risque] → [mitigation]
```

Ne pas commencer a coder. Presenter le plan et attendre validation.
```

### 7.2 — Skill `/post-feature`

**Creer** : `.claude/skills/post-feature/SKILL.md`

```markdown
---
name: post-feature
description: Verifier une feature apres implementation. Lance les tests, verifie la coherence, met a jour la doc.
user-invocable: true
allowed-tools: Bash, Read, Write, Edit, Glob, Grep
---

# Post-Feature : Verification apres implementation

## Checklist obligatoire

### 1. Tests
```bash
npx vitest run --reporter=verbose 2>&1 | tail -20
```
Si des tests echouent, les corriger AVANT de continuer.

### 2. Coherence des donnees
Verifier que :
- Aucune valeur dans Constants.js ne contredit characters.json ou terrains.json
- Aucun nouveau localStorage direct (tout passe par SaveManager)
- Pas de `window.` global ajoute

### 3. Recherche de debug oublie
```bash
grep -rn "console.log" src/ --include="*.js" | grep -v node_modules
```
Supprimer tout console.log trouve.

### 4. Mise a jour documentation
- Si une feature est terminee : cocher dans `CAHIER_DES_CHARGES.md`
- Si des valeurs numeriques ont change : verifier que Constants.js est a jour
- Si un personnage a ete modifie : verifier characters.json

### 5. Commit
Commiter avec un message clair :
- `feat:` pour nouvelle feature
- `fix:` pour correction de bug
- `balance:` pour equilibrage
- `refactor:` pour reorganisation sans changement fonctionnel
```

### 7.3 — Skill `/session-end`

**Creer** : `.claude/skills/session-end/SKILL.md`

```markdown
---
name: session-end
description: Terminer proprement une session de travail. Commit, met a jour l'etat du projet, liste les priorites suivantes.
user-invocable: true
allowed-tools: Bash, Read, Write, Edit, Glob, Grep
---

# Session End : Cloture propre

## Etapes

### 1. Verifier l'etat git
```bash
git status
git diff --stat
```

### 2. Commiter tout travail en cours
S'il reste des modifications non commitees, creer un commit avec un message descriptif.

### 3. Lancer les tests
```bash
npx vitest run --reporter=dot 2>&1 | tail -5
```

### 4. Mettre a jour la memoire projet
Lire le fichier memoire `project_state.md` (dans le dossier memoire Claude Code).
Le mettre a jour avec :
- Ce qui a ete fait dans cette session
- Ce qui reste a faire (3 priorites max)
- Bugs connus non corriges
- Decisions prises pendant la session

### 5. Mettre a jour CAHIER_DES_CHARGES.md
Cocher les items termines, ajouter les nouveaux items decouverts.

### 6. Rapport de fin
Afficher un resume :
```
## Fin de session
- Commits : [nombre]
- Tests : [pass/fail]
- Prochaines priorites :
  1. ...
  2. ...
  3. ...
```
```

**Commit** : `feat: 3 nouveaux skills Claude Code (pre-feature, post-feature, session-end)`

---

## BLOC 8 — CONSOLIDER LA MEMOIRE CLAUDE CODE

> Priorite : **IMPORTANT**
> Temps estime : 20 min
> Dossier : `C:\Users\wdubo\.claude\projects\c--Users-wdubo-OneDrive-Bureau-Projets-Projet-jeux-web-petanque-Pok-mon\memory\`

### 8.1 — Fusionner les fichiers session en 1 seul fichier d'etat

Les fichiers suivants sont des notes de session qui se repetent :
- `project_session_19mars.md`
- `project_session_19mars_soir.md`
- `project_session_20mars.md`
- `project_sprint_final_session_18mars.md`
- `project_audit_18mars_soir.md`

**Action** : Creer un fichier unique `project_state.md` qui contient UNIQUEMENT l'etat actuel (pas l'historique) :

```markdown
---
name: Etat actuel du projet
description: Etat technique et fonctionnel de Petanque Master. Mis a jour a chaque fin de session.
type: project
---

## Etat au [date de la session]

### Ce qui fonctionne
- Moteur petanque complet (physique, IA, scoring FIPJP)
- 6 personnages (Rookie + 5 adversaires) avec stats, capacites, barks
- 5 terrains (Village, Plage, Parc, Colline, Docks)
- Modes : Arcade 5 rounds, Quick Play, Mode 1 Boule
- 12 scenes completes
- Audio : 14 SFX + 2 musiques + ambiance terrain
- Sauvegarde : SaveManager v2 avec migration
- Progression : Rookie evoluable, Galets, boutique, deblocages
- Tests : 138 unitaires + 85 E2E Playwright

### Bugs connus
- [lister les bugs actuels]

### Prochaines priorites
1. [priorite 1]
2. [priorite 2]
3. [priorite 3]

### Decisions recentes
- [decision et pourquoi]
```

Puis **supprimer** les 5 fichiers de session individuels.

### 8.2 — Supprimer le fichier obsolete

**Supprimer** : `project_commercial_strategy.md` (marque "REMPLACE par project_business_strategy.md" dans MEMORY.md mais jamais supprime)

### 8.3 — Fusionner les fichiers sprint

Les fichiers suivants se chevauchent :
- `project_sprint_final.md`
- `project_petanque_master.md`

**Action** : Fusionner les informations uniques dans `project_state.md` puis supprimer les deux.

### 8.4 — Mettre a jour MEMORY.md

Reecrire MEMORY.md pour refleter la nouvelle structure. L'index doit rester SOUS 200 lignes (apres 200, Claude Code tronque).

Structure cible :
```markdown
# Memory Index - Petanque Master

## Etat projet (fichier vivant — toujours lire en premier)
- [project_state.md](project_state.md) - Etat technique et fonctionnel actuel

## Strategie
- [project_business_strategy.md](project_business_strategy.md) - Objectif revenu, plan distribution
- [project_story_direction.md](project_story_direction.md) - "L'Heritier de la Ciotat" (Phase D)

## Decisions techniques
- [project_currency_galets.md](project_currency_galets.md) - Monnaie = Galets
- [project_rookie_customizable.md](project_rookie_customizable.md) - Rookie par couches
- [project_rookie_sprite_v2.md](project_rookie_sprite_v2.md) - Sprite Rookie derive Ley
- [project_art_strategy.md](project_art_strategy.md) - Pipeline pixel art IA
- [project_technical_capabilities.md](project_technical_capabilities.md) - Quick wins, limites code

## Navigation
- [reference_documentation_map.md](reference_documentation_map.md) - Ou trouver quoi

## References techniques
- [reference_qa_testing_stack.md](reference_qa_testing_stack.md) - Vitest + Playwright
- [reference_pixellab_api.md](reference_pixellab_api.md) - API PixelLab complete
- [reference_gameplay_research.md](reference_gameplay_research.md) - Game design petanque
- [reference_web_portals.md](reference_web_portals.md) - CrazyGames/Poki/itch.io

## Feedback (regles de travail)
- [feedback_style.md](feedback_style.md) - Robuste, joli, actionnable, rapide
- [feedback_always_commit.md](feedback_always_commit.md) - Toujours commiter
- [feedback_visual_quality.md](feedback_visual_quality.md) - Priorite visuelle
- [feedback_no_camera_movement.md](feedback_no_camera_movement.md) - Pas de camera follow
- [feedback_phaser_scene_reuse.md](feedback_phaser_scene_reuse.md) - Reset flags dans init()
- [feedback_testing_process.md](feedback_testing_process.md) - Feature → test → commit
- [feedback_sprite_workflow.md](feedback_sprite_workflow.md) - Pixflux, pas style_image

## User
- [user_pixel_art_interest.md](user_pixel_art_interest.md) - Sprites dans Pixelorama/PixelLab
```

Les fichiers reference non listes ici (`reference_art_techniques.md`, `reference_art_tools_2026.md`, `reference_free_assets.md`, `reference_sprite_tools.md`, `reference_market_distribution.md`, `reference_tools_assets.md`) sont gardes sur disque mais retires de l'index MEMORY.md — ils seront lus a la demande si besoin.

**Commit** : `chore: consolider memoire Claude Code (44 fichiers → ~20, index <100 lignes)`

---

## BLOC 9 — CONFIGURER LES HOOKS CLAUDE CODE

> Priorite : **IMPORTANT**
> Temps estime : 5 min
> Fichier a modifier : .claude/settings.local.json

### Action

Remplacer le contenu de `.claude/settings.local.json` par :

```json
{
  "permissions": {
    "allow": [
      "Read",
      "Write",
      "Edit",
      "Glob",
      "Grep",
      "WebFetch",
      "WebSearch",
      "TodoWrite",
      "NotebookEdit",
      "Agent",
      "Bash(*)",
      "Skill(*)",
      "mcp__*"
    ],
    "deny": [
      "Bash(git push --force*)",
      "Bash(git reset --hard*)",
      "Bash(rm -rf /)*",
      "Bash(git branch -D main*)",
      "Bash(git branch -D master*)"
    ],
    "additionalDirectories": [
      "C:\\Users\\wdubo\\OneDrive\\Bureau\\Projets\\Projet jeux web petanque Pokémon\\assets"
    ]
  },
  "hooks": {
    "PostToolUse": [
      {
        "command": "if echo \"$CC_TOOL_NAME\" | grep -qE 'Edit|Write'; then cd \"$CC_WORK_DIR\" && npx vitest run --reporter=dot 2>&1 | tail -3; fi",
        "description": "Auto-run tests after file edits",
        "timeout": 30000
      }
    ]
  }
}
```

Cela lance automatiquement les tests unitaires apres chaque modification de fichier. Si un test echoue, Claude Code le verra immediatement dans le retour du hook.

**Commit** : `chore: ajouter hook PostToolUse (tests auto apres chaque edit)`

---

## BLOC 10 — METTRE A JOUR LE SKILL /sprite (roster obsolete)

> Priorite : **IMPORTANT**
> Temps estime : 5 min
> Fichier a modifier : .claude/skills/sprite/SKILL.md

### Probleme

Le skill `/sprite` contient une section "Character Reference" avec l'ancien roster (joueur, papet, bastien, fanny, ricardo, marius). Le roster actuel est Rookie, Ley, Le Magicien, La Choupe, Marcel, Reyes.

### Action

Remplacer la section "Character Reference" par :

```markdown
## Character Reference (roster actuel)

Key characters for this game (voir public/data/characters.json pour les details) :
- **rookie** : jeune joueur, casquette, polo bleu, look decontracte, palette bleue (#5B9BD5)
- **ley** : cheveux longs, echarpe, tenue sombre, look agressif, palette bleue (#4A6FA5)
- **le_magicien** : lunettes, tenue marron, air studieux, palette marron (#8B4513)
- **la_choupe** : carrure large, chemise rouge, look bourrin sympathique, palette marron/rouge (#8B4513/#C44B3F)
- **marcel** : chapeau/beret, cheveux blancs, polo gris, air malin, palette grise (#A8B5C2)
- **reyes** : grand, corpulent, headband, sourire, palette beige/or (#F0E8D8/#D4A020)
```

**Commit** : `fix: mettre a jour roster dans skill /sprite`

---

## BLOC 11 — AJOUTER LE MODE 2 BOULES / 7 POINTS

> Priorite : **NICE-TO-HAVE**
> Temps estime : 15 min
> Fichiers a modifier : src/petanque/PetanqueEngine.js, src/scenes/QuickPlayScene.js

### 11.1 — Ajouter le format dans PetanqueEngine

**Fichier** : `src/petanque/PetanqueEngine.js`
**Ligne** : ~58 (section ballsPerPlayer)

Le code actuel :
```javascript
this.ballsPerPlayer = this.format === 'une_boule' ? 1 : (this.format === 'triplette' ? 2 : 3);
this.victoryScore = this.format === 'une_boule' ? 11 : VICTORY_SCORE;
```

**Modifier** en :
```javascript
this.ballsPerPlayer = this.format === 'une_boule' ? 1
    : this.format === 'deux_boules' ? 2
    : this.format === 'triplette' ? 2
    : 3;
this.victoryScore = this.format === 'une_boule' ? 11
    : this.format === 'deux_boules' ? 7
    : VICTORY_SCORE;
```

### 11.2 — Ajouter l'option dans QuickPlayScene

**Fichier** : `src/scenes/QuickPlayScene.js`

Trouver la liste des formats disponibles (chercher `une_boule` ou `tete_a_tete`) et ajouter `'deux_boules'` avec le label `'2 Boules (7 pts)'`.

### 11.3 — Documenter

Ajouter dans CAHIER_DES_CHARGES.md section 2.7 :
```
- [x] **2 Boules** : 2 boules/joueur, victoire a 7 points, matchs ~4-5 minutes
```

**Commit** : `feat: mode 2 boules / 7 points (sweet spot entre standard et express)`

---

## BLOC 12 — TERRAINS.JSON : CORRIGER LES VERROUS

> Priorite : **NICE-TO-HAVE**
> Temps estime : 5 min
> Fichier a modifier : public/data/terrains.json

### Probleme

Tous les terrains ont `"unlocked": true` dans terrains.json, mais SPRINT_FINAL §3.4 dit que Docks et Plage sont verouilles au depart.

### Action

Dans `terrains.json` :
- Terrain `plage` : changer `"unlocked": true` en `"unlocked": false`
- Terrain `docks` : changer `"unlocked": true` en `"unlocked": false`

NOTE : Verifier que QuickPlayScene et CharSelectScene lisent bien ce flag pour filtrer les terrains. Si le code ignore ce flag, il faudra aussi modifier les scenes — mais le changement de donnees est le premier pas.

**Commit** : `fix: terrains Docks et Plage verouilles par defaut (coherence avec progression arcade)`

---

## RESUME DE TOUS LES COMMITS

| Bloc | Commit message | Type |
|------|---------------|------|
| 1 | `fix: resoudre 9 contradictions doc/code (CONTRE_ANALYSE bloc 1)` | doc |
| 2 | `fix: bugs code (ShopScene monnaie, TitleScene init, VSIntro global, docs alignment)` | code |
| 3 | `feat: compensation defaite (10 galets + 1 XP rookie par defaite)` | gameplay |
| 4 | `balance: nerf Reyes (32→29 pts), buff La Choupe (24→27 pts)` | gameplay |
| 5 | `balance: doubler gains galets, starter 100G, defaite 15G` | gameplay |
| 6 | `refactor: CLAUDE.md reecrit en regles de decision (80 lignes vs 156)` | doc |
| 7 | `feat: 3 nouveaux skills Claude Code (pre-feature, post-feature, session-end)` | tooling |
| 8 | `chore: consolider memoire Claude Code (44 fichiers → ~20, index <100 lignes)` | tooling |
| 9 | `chore: ajouter hook PostToolUse (tests auto apres chaque edit)` | tooling |
| 10 | `fix: mettre a jour roster dans skill /sprite` | tooling |
| 11 | `feat: mode 2 boules / 7 points` | gameplay |
| 12 | `fix: terrains Docks et Plage verouilles par defaut` | data |

---

## CE QUE CE PLAN NE COUVRE PAS (futurs plans separes)

Ces items sont identifies dans CONTRE_ANALYSE.md mais necessitent des plans dedies :

1. **Tutoriel interactif dans le premier match** — c'est un gros morceau (~4h) qui merite son propre plan avec mockup du flow, textes, et integration dans ArcadeScene round 1
2. **Camera follow + zoom** — decision a reverter d'abord avec le owner du projet, puis implementation
3. **Visuel terrain** (tilesprites au lieu de rectangles) — necessite des assets, pipeline /tileset, et refactoring TerrainRenderer
4. **Audio layering pour le carreau** — necessite /sfx et modification SoundManager
5. **Adaptation resolution 16:9 pour Poki** — change potentiellement toute l'UI, a planifier

Chacun de ces items devrait etre planifie avec `/pre-feature` avant implementation.
