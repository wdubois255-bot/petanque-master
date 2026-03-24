# PLAN PHASE 5 — ARCADE VIVANTE

> **Vision** : Transformer le mode Arcade d'une sequence de 5 matchs en une
> experience narrative, visuelle et strategique memorable. Exploiter au maximum
> les systemes existants (momentum, barks, commentateur, shop, star rating,
> milestones) sans en creer de nouveaux.
>
> **Prerequis** : PLAN_PHASE4 en cours, 296 tests OK, build ~424KB + Phaser.
> **Organisation** : 7 axes thematiques (A-G), 21 taches atomiques, 4 vagues.
> **Executants** : Agents Sonnet 4.6 autonomes — chaque tache = 1 prompt.

---

## SCHEMA DE DEPENDANCES

```
VAGUE 1 — Fondations data (tout en parallele)
  [A1] Constants    [A2] arcade.json    [A3] i18n FR+EN    [A4] characters.json barks
       |                  |                   |                    |
       v                  v                   v                    v
VAGUE 2 — Features core (parallele par axe)
  [B1] Momentum    [B2] Pression    [C1] Map base    [D1] Defis    [E1] Micro-narr    [G1] Ambiance
  visible          visible          progression      de mene       + barks score      progressive
       |                |                |               |              |
       v                v                v               v              v
                                    [D3] Soupape defaite (dep C1)
                                         |
                                         v
VAGUE 3 — Features avancees (dependent de V2)
  [B3] Tells IA    [C2] Etoiles     [D2] Defis       [E2] Comment.  [F1] Milestones
  (dep B1)         map (dep C1)     match (dep D1)   enrichi        UI (dep C1)
                        |                                                |
                        v                                                v
VAGUE 4 — Integration finale (dependent de V3)
  [F2] Shop express     [F3] Zone doree      [C3] Map polish
  (dep C2, F1)          (dep D1)             (dep C2)
```

**Legende groupes thematiques :**
- **A** = Donnees & constantes (fondation)
- **B** = Feedback visuel IA (momentum, pression, tells)
- **C** = Carte de progression (map visuelle)
- **D** = Systeme de defis (mene + match + soupape defaite)
- **E** = Barks, narration, commentateur
- **F** = Economie arcade (milestones, shop, zone doree)
- **G** = Ambiance progressive (son/crowd) — deplacee en Vague 2

---

# VAGUE 1 — FONDATIONS DATA

> Toutes les taches V1 sont independantes et parallelisables.
> Elles ajoutent des donnees/constantes consommees par les vagues suivantes.

---

## Tache A1 — Constantes visuelles Phase 5

- **Objectif :** Centraliser dans Constants.js toutes les valeurs visuelles/timing des nouvelles features.
- **Dependances :** Aucune
- **Effort :** S (< 30 min)

### Fichiers a lire
- `src/utils/Constants.js` (structure existante, palette COLORS, UI.*)

### Fichiers a modifier
- `src/utils/Constants.js`

### Specification

Ajouter les blocs suivants **a la fin du fichier, avant le dernier export** (ou apres le dernier bloc de constantes, le fichier n'a pas d'export default) :

```js
// === PHASE 5 — Arcade Vivante ===

// Momentum indicator (visible on AI sprite)
export const MOMENTUM_INDICATOR_FIRE_COLOR = 0xFF6644;   // halo rouge-orange
export const MOMENTUM_INDICATOR_TILT_COLOR = 0x6688CC;   // halo bleu froid
export const MOMENTUM_INDICATOR_THRESHOLD = 0.3;          // |momentum| > 0.3 = visible
export const MOMENTUM_INDICATOR_ALPHA = 0.4;
export const MOMENTUM_INDICATOR_RADIUS = 24;              // px autour du sprite

// Pressure indicator (10-10+)
export const PRESSURE_INDICATOR_COLOR = 0xC44B3F;        // accent rouge
export const PRESSURE_WOBBLE_AMPLITUDE = 3;               // px de tremblement icone
export const PRESSURE_WOBBLE_SPEED = 200;                 // ms par cycle

// AI Tell (flash bref avant tir IA)
export const AI_TELL_DURATION = 400;                      // ms de l'indicateur
export const AI_TELL_POINTER_COLOR = 0x87CEEB;           // ciel = va pointer
export const AI_TELL_SHOOTER_COLOR = 0xC44B3F;           // accent = va tirer
export const AI_TELL_ALPHA = 0.6;

// Map progression (ArcadeScene)
export const MAP_NODE_RADIUS = 14;                        // px rayon noeud
export const MAP_NODE_SPACING_X = 140;                    // px entre noeuds
export const MAP_PATH_COLOR = 0xD4A574;                   // ocre
export const MAP_PATH_DASH = 6;                           // px longueur tiret
export const MAP_NODE_PULSE_DURATION = 800;               // ms
export const MAP_STAR_SIZE = 12;                          // px taille etoile (lisible a 832x480)
export const MAP_ZONE_TOP = 60;                           // px debut map
export const MAP_ZONE_BOTTOM = 240;                       // px fin map
export const MAP_PREVIEW_Y = 270;                         // px debut panel preview

// Defi de mene
export const CHALLENGE_BANNER_DURATION = 2500;            // ms affichage
export const CHALLENGE_REWARD_GALETS = 10;                // galets par defi reussi
export const CHALLENGE_PROBABILITY = 0.6;                 // 60% chance qu'un defi apparaisse

// Zone doree
export const GOLDEN_ZONE_RADIUS = 18;                    // px
export const GOLDEN_ZONE_COLOR = 0xFFD700;
export const GOLDEN_ZONE_ALPHA = 0.25;
export const GOLDEN_ZONE_REWARD = 5;                      // galets bonus

// Shop express
export const SHOP_EXPRESS_ITEMS = 2;                      // nb items proposes
export const SHOP_EXPRESS_DISCOUNT = 0.2;                 // 20% reduction

// Crowd intensity per arcade round (1-5)
export const CROWD_INTENSITY_BY_ROUND = [0.03, 0.04, 0.05, 0.07, 0.10];

// Shop express budget gate
export const SHOP_EXPRESS_MIN_GALETS = 40;                // ne pas afficher si budget < ce seuil

// Defeat safety valve
export const DEFEAT_CONSOLATION_GALETS = 15;              // galets de consolation apres defaite
export const DEFEAT_RETRY_ENABLED = true;                 // autoriser le retry du meme match

// Commentator sequencing
export const COMMENTATOR_COOLDOWN = 3000;                 // ms minimum entre deux messages textuels
```

### Tests
- Fichier : `tests/unit/constants.test.js`
- Ajouter un test qui verifie que toutes les nouvelles constantes sont exportees et ont le bon type (number).

```js
import { MOMENTUM_INDICATOR_FIRE_COLOR, MOMENTUM_INDICATOR_THRESHOLD,
  MAP_NODE_RADIUS, CHALLENGE_REWARD_GALETS, GOLDEN_ZONE_RADIUS,
  CROWD_INTENSITY_BY_ROUND } from '../../src/utils/Constants.js';

describe('Phase 5 constants', () => {
  test('momentum constants are numbers', () => {
    expect(typeof MOMENTUM_INDICATOR_FIRE_COLOR).toBe('number');
    expect(MOMENTUM_INDICATOR_THRESHOLD).toBeGreaterThan(0);
  });
  test('map constants are numbers', () => {
    expect(typeof MAP_NODE_RADIUS).toBe('number');
  });
  test('challenge constants are valid', () => {
    expect(CHALLENGE_REWARD_GALETS).toBeGreaterThan(0);
  });
  test('golden zone constants are valid', () => {
    expect(GOLDEN_ZONE_RADIUS).toBeGreaterThan(0);
  });
  test('crowd intensity has 5 entries', () => {
    expect(CROWD_INTENSITY_BY_ROUND).toHaveLength(5);
  });
  test('shop express budget gate is positive', () => {
    expect(SHOP_EXPRESS_MIN_GALETS).toBeGreaterThan(0);
  });
  test('defeat consolation galets is positive', () => {
    expect(DEFEAT_CONSOLATION_GALETS).toBeGreaterThan(0);
  });
  test('commentator cooldown is positive', () => {
    expect(COMMENTATOR_COOLDOWN).toBeGreaterThan(0);
  });
});
```

### Valide quand
- `npx vitest run` passe (296 existants + nouveaux)
- Toutes les constantes sont importables
- Aucune constante existante n'est modifiee

---

## Tache A2 — Enrichissement arcade.json (narratives + defis + time_of_day)

- **Objectif :** Ajouter micro-narratives inter-matchs, moment de la journee, et definitions de defis de match dans arcade.json.
- **Dependances :** Aucune
- **Effort :** M (30-60 min)

### Fichiers a lire
- `public/data/arcade.json` (structure existante : matches[], milestones[], intro/mid/ending_narrative)

### Fichiers a modifier
- `public/data/arcade.json`

### Specification

**1. Ajouter `time_of_day` a chaque match :**

```json
{ "round": 1, "opponent": "la_choupe", "terrain": "village", "time_of_day": "matin", ... }
{ "round": 2, ... "time_of_day": "fin_matinee", ... }
{ "round": 3, ... "time_of_day": "midi", ... }
{ "round": 4, ... "time_of_day": "apres_midi", ... }
{ "round": 5, ... "time_of_day": "coucher_soleil", ... }
```

**2. Ajouter `post_narrative` apres les rounds 1 et 2 (dans chaque objet match) :**

Round 1 :
```json
"post_narrative": [
  "La Choupe te tape dans le dos.",
  "'Pas mal gamin !' Le cafe du village t'offre un pastis."
],
"post_narrative_en": [
  "La Choupe slaps you on the back.",
  "'Not bad, kid!' The village cafe offers you a pastis."
]
```

Round 2 :
```json
"post_narrative": [
  "Mamie Josette t'offre un biscuit.",
  "'Ton grand-pere cachait ses boules dans la meme boite.'",
  "Les voisins commencent a se rassembler."
],
"post_narrative_en": [
  "Mamie Josette offers you a cookie.",
  "'Your grandfather hid his boules in the same box.'",
  "The neighbors start gathering."
]
```

**3. Ajouter un bloc `match_challenges` a la racine :**

```json
"match_challenges": [
  {
    "id": "carreau_match",
    "name": "Carreau !",
    "name_en": "Carreau!",
    "description": "Reussis au moins un carreau dans ce match",
    "description_en": "Score at least one carreau in this match",
    "condition": "carreaux >= 1",
    "reward": 25
  },
  {
    "id": "no_tir",
    "name": "Tout en finesse",
    "name_en": "All finesse",
    "description": "Gagne sans utiliser de tir",
    "description_en": "Win without using any shooting",
    "condition": "shots === 0 && won",
    "reward": 30
  },
  {
    "id": "domination",
    "name": "Domination",
    "name_en": "Domination",
    "description": "Gagne 13-5 ou mieux",
    "description_en": "Win 13-5 or better",
    "condition": "won && opponentScore <= 5",
    "reward": 20
  },
  {
    "id": "comeback_king",
    "name": "Roi du comeback",
    "name_en": "Comeback king",
    "description": "Gagne apres avoir ete mene de 5+ points",
    "description_en": "Win after being behind by 5+ points",
    "condition": "won && maxDeficit >= 5",
    "reward": 35
  },
  {
    "id": "fanny_master",
    "name": "Fanny !",
    "name_en": "Fanny!",
    "description": "Inflige un 13-0",
    "description_en": "Win 13-0",
    "condition": "won && opponentScore === 0",
    "reward": 50
  }
]
```

**4. Ajouter un bloc `mene_challenges` a la racine :**

```json
"mene_challenges": [
  { "id": "mc_carreau", "text": "Defi : Fais un carreau !", "text_en": "Challenge: Score a carreau!", "stat": "carreaux", "target": 1, "reward": 10 },
  { "id": "mc_3pts", "text": "Defi : Marque 3+ points !", "text_en": "Challenge: Score 3+ points!", "stat": "meneScore", "target": 3, "reward": 10 },
  { "id": "mc_roulette", "text": "Defi : Gagne en roulette uniquement", "text_en": "Challenge: Win using only roulette", "stat": "onlyRoulette", "target": 1, "reward": 15 },
  { "id": "mc_biberon", "text": "Defi : Fais un biberon !", "text_en": "Challenge: Score a biberon!", "stat": "biberons", "target": 1, "reward": 15 }
]
```

### Tests
- Fichier : `tests/unit/arcade-data.test.js`
- Charger arcade.json, verifier :
  - Chaque match a `time_of_day` (string non vide)
  - Rounds 1 et 2 ont `post_narrative` (array, length > 0) et `post_narrative_en`
  - `match_challenges` est un array de 5 objets avec id, condition, reward
  - `mene_challenges` est un array de 4 objets avec id, stat, target, reward
  - Tous les milestones existants sont preserves

### Valide quand
- Le JSON est valide (pas d'erreur de parsing)
- Les tests passent
- Le jeu demarre normalement (`npm run dev`)

---

## Tache A3 — Textes i18n Phase 5 (FR + EN)

- **Objectif :** Ajouter toutes les cles i18n necessaires aux features Phase 5 dans les fichiers FR et EN.
- **Dependances :** Aucune
- **Effort :** S (< 30 min)

### Fichiers a lire
- `public/data/lang/fr.json` (structure existante)
- `public/data/lang/en.json`

### Fichiers a modifier
- `public/data/lang/fr.json`
- `public/data/lang/en.json`

### Specification

Ajouter un bloc `"arcade"` a la racine de chaque fichier JSON (au meme niveau que "boot", "title", "shop", etc.) :

**FR (`fr.json`) :**
```json
"arcade": {
  "title": "MODE ARCADE",
  "subtitle": "Le Tournoi de La Ciotat",
  "next_fight": "PROCHAIN COMBAT",
  "fight_btn": "COMBATTRE !",
  "round": "Match {n}/{total}",
  "difficulty": "Difficulte : {level}",
  "terrain_label": "Terrain : {name}",
  "stars_total": "{n}/15 etoiles",
  "stars_bonus": "15/15 : +{galets} Galets !",
  "complete": "ARCADE TERMINEE !",
  "perfect": "PARCOURS PARFAIT !",
  "wins_label": "Victoires : {wins}/{total}",
  "champion": "Le Terrain des Quatre est a toi !",
  "continue": "CONTINUER",
  "retry": "REESSAYER",
  "menu": "MENU PRINCIPAL",
  "controls": "Espace Combattre     Echap Menu",
  "time_matin": "Matin",
  "time_fin_matinee": "Fin de matinee",
  "time_midi": "Midi",
  "time_apres_midi": "Apres-midi",
  "time_coucher_soleil": "Coucher de soleil",
  "challenge_title": "DEFI !",
  "challenge_complete": "Defi reussi ! +{galets} Galets",
  "challenge_failed": "Defi echoue...",
  "mene_challenge": "Defi de mene",
  "match_challenge": "Defi du match",
  "milestone_unlocked": "Objectif atteint !",
  "momentum_fire": "EN FEU !",
  "momentum_tilt": "Deconcentre",
  "pressure_warning": "Pression !",
  "shop_express_title": "BOUTIQUE RAPIDE",
  "shop_express_subtitle": "Avant le prochain match...",
  "golden_zone_bonus": "+{galets} Galets (zone doree !)",
  "defeat_title": "DEFAITE",
  "defeat_earned": "Galets gagnes : {galets}",
  "defeat_retry": "REJOUER CE MATCH",
  "defeat_continue": "CONTINUER",
  "defeat_consolation": "+{galets} Galets de consolation"
}
```

**EN (`en.json`) :**
```json
"arcade": {
  "title": "ARCADE MODE",
  "subtitle": "The Tournament of La Ciotat",
  "next_fight": "NEXT FIGHT",
  "fight_btn": "FIGHT!",
  "round": "Match {n}/{total}",
  "difficulty": "Difficulty: {level}",
  "terrain_label": "Terrain: {name}",
  "stars_total": "{n}/15 stars",
  "stars_bonus": "15/15: +{galets} Pebbles!",
  "complete": "ARCADE COMPLETE!",
  "perfect": "PERFECT RUN!",
  "wins_label": "Victories: {wins}/{total}",
  "champion": "The Four Courts are yours!",
  "continue": "CONTINUE",
  "retry": "RETRY",
  "menu": "MAIN MENU",
  "controls": "Space Fight     Esc Menu",
  "time_matin": "Morning",
  "time_fin_matinee": "Late morning",
  "time_midi": "Noon",
  "time_apres_midi": "Afternoon",
  "time_coucher_soleil": "Sunset",
  "challenge_title": "CHALLENGE!",
  "challenge_complete": "Challenge complete! +{galets} Pebbles",
  "challenge_failed": "Challenge failed...",
  "mene_challenge": "Round challenge",
  "match_challenge": "Match challenge",
  "milestone_unlocked": "Milestone reached!",
  "momentum_fire": "ON FIRE!",
  "momentum_tilt": "Off balance",
  "pressure_warning": "Pressure!",
  "shop_express_title": "QUICK SHOP",
  "shop_express_subtitle": "Before the next match...",
  "golden_zone_bonus": "+{galets} Pebbles (golden zone!)",
  "defeat_title": "DEFEAT",
  "defeat_earned": "Pebbles earned: {galets}",
  "defeat_retry": "RETRY THIS MATCH",
  "defeat_continue": "CONTINUE",
  "defeat_consolation": "+{galets} consolation Pebbles"
}
```

### Tests
- Fichier : `tests/unit/i18n-phase5.test.js`
- Charger les deux JSON, verifier que toutes les cles `arcade.*` existent dans les deux langues.

### Valide quand
- Les deux JSON sont valides
- `I18n.t('arcade.title')` retourne "MODE ARCADE" en FR
- Toutes les cles FR ont un equivalent EN

---

## Tache A4 — Barks contextuels dans characters.json

- **Objectif :** Ajouter des barks conditionnes au score dans characters.json pour les 5 adversaires arcade + le Rookie.
- **Dependances :** Aucune
- **Effort :** M (30-60 min)

### Fichiers a lire
- `public/data/characters.json` (structure barks existante par personnage)

### Fichiers a modifier
- `public/data/characters.json`

### Specification

Pour chaque personnage du roster arcade (rookie, la_choupe, mamie_josette, fazzino, suchaud, ley), **ajouter** les cles suivantes dans l'objet `barks` ET `barks_en` :

```json
"pressure_tied": ["phrase quand 10-10+..."],
"fanny_imminent_winning": ["phrase quand on mene 12-0..."],
"fanny_imminent_losing": ["phrase quand on est mene 0-12..."],
"comeback_self": ["phrase quand on remonte de 5+ points..."],
"opponent_comeback": ["phrase quand l'adversaire remonte..."],
"dominant_lead": ["phrase quand on mene 8-0 ou plus..."]
```

**Exemples par personnage (FR) :**

**Rookie :**
```json
"pressure_tied": ["Allez, calme... C'est le moment.", "Focus total. Respire."],
"fanny_imminent_winning": ["13-0 ? C'est possible la ?!", "FANNY ! J'y crois pas !"],
"fanny_imminent_losing": ["... Je refuse de finir a zero.", "Non non non, pas ca."],
"comeback_self": ["Je reviens ! J'abandonne jamais !", "Regarde ca !"],
"opponent_comeback": ["Non ! Pas maintenant !", "Il remonte..."],
"dominant_lead": ["Ca rentre tout seul !", "J'suis pas si mauvais finalement !"]
```

**La Choupe :**
```json
"pressure_tied": ["C'est maintenant que ca se joue, gamin !", "ALLEZ ! On lache rien !"],
"fanny_imminent_winning": ["HAHA ! 13-0 ! LA FANNY !", "A genoux devant La Choupe !"],
"fanny_imminent_losing": ["... Ca va aller.", "La prochaine, je me reveille."],
"comeback_self": ["La Choupe est de retour !", "J'etais juste en echauffement !"],
"opponent_comeback": ["He, he, calme-toi la !", "T'emballe pas gamin !"],
"dominant_lead": ["Tu vois ca ? C'est ca, la puissance !", "Ecrase !"]
```

**Mamie Josette :**
```json
"pressure_tied": ["Oh la la... Ca me rappelle la finale de 73.", "Du calme, du calme..."],
"fanny_imminent_winning": ["Oh mon petit... Pas de honte. C'est la petanque.", "13-0... comme le bon vieux temps."],
"fanny_imminent_losing": ["Hmm... je crois que j'ai oublie mes lunettes.", "Ah la jeunesse..."],
"comeback_self": ["L'experience, mon petit. L'experience.", "Je me suis souvenue comment on fait."],
"opponent_comeback": ["Tiens tiens... tu te reveilles.", "Attention, il revient."],
"dominant_lead": ["Les biscuits portent chance.", "Comme sur des roulettes."]
```

**Fazzino :**
```json
"pressure_tied": ["Probabilite de victoire : 50%. Interessant.", "Les variables convergent."],
"fanny_imminent_winning": ["13-0. Statistiquement improbable, mais les faits sont la.", "Erreur systematique de ton cote."],
"fanny_imminent_losing": ["Revoir les hypotheses de base.", "Anomalie statistique."],
"comeback_self": ["Correction des parametres effectuee.", "L'algorithme s'adapte."],
"opponent_comeback": ["Deviation inattendue.", "Hmm. Bruit dans les donnees."],
"dominant_lead": ["Les chiffres ne mentent pas.", "Tout est sous controle."]
```

**Suchaud :**
```json
"pressure_tied": ["...", "Concentre-toi."],
"fanny_imminent_winning": ["...", "Pas de pitie."],
"fanny_imminent_losing": ["...", "..."],
"comeback_self": ["Je me reveille.", "La."],
"opponent_comeback": ["Hmm.", "..."],
"dominant_lead": ["Normal.", "Continue."]
```

**Ley :**
```json
"pressure_tied": ["C'est dans ces moments-la qu'on voit les vrais.", "Ton grand-pere aurait adore ca."],
"fanny_imminent_winning": ["Pas de quartier. C'est le tournoi.", "Auguste m'a appris ca."],
"fanny_imminent_losing": ["...Impressionnant, gamin.", "Tu m'as eu. Pour l'instant."],
"comeback_self": ["Ley ne meurt jamais.", "Le tireur se reveille."],
"opponent_comeback": ["Tu as du sang Bertolini, ca c'est sur.", "Pas mal, pas mal..."],
"dominant_lead": ["Tu rappelles ton grand-pere quand il etait jeune.", "Le Carreau d'Or te tend les bras."]
```

**Ajouter les equivalents EN dans `barks_en`** pour chaque personnage (traductions naturelles, pas litterales).

### Tests
- Fichier : `tests/unit/characters-barks.test.js`
- Pour chaque perso arcade : verifier que les 6 nouvelles cles bark existent dans `barks` et `barks_en`
- Verifier que chaque bark est un array non-vide

### Valide quand
- Le JSON est valide
- Les tests passent
- Chaque personnage arcade a les 6 nouvelles categories de barks

---

# VAGUE 2 — FEATURES CORE

> Depend de la Vague 1 (constantes + donnees).
> Toutes les taches V2 sont parallelisables entre elles.

---

## Tache B1 — Momentum IA visible

- **Objectif :** Afficher un feedback visuel (halo + texte) sur le sprite adversaire quand son momentum est significatif.
- **Dependances :** A1 (constantes)
- **Effort :** M (30-60 min)

### Fichiers a lire
- `src/petanque/PetanqueAI.js` (propriete `_momentum`, methode `updateMomentum()`)
- `src/scenes/PetanqueScene.js` (sprite adversaire `this.opponentSprite`, hooks existants)
- `src/utils/Constants.js` (MOMENTUM_INDICATOR_*)

### Fichiers a modifier
- `src/scenes/PetanqueScene.js`

### Specification

**1. Dans `create()`, apres la creation du sprite adversaire (`this.opponentSprite`), initialiser :**
```js
this._momentumGlow = null;  // graphics object pour le halo
this._momentumLabel = null; // texte "EN FEU !" / "Deconcentre"
```

**2. Ajouter une methode `_updateMomentumIndicator()` :**

```js
_updateMomentumIndicator() {
    if (!this.ai || !this.opponentSprite) return;
    const m = this.ai._momentum;
    const threshold = MOMENTUM_INDICATOR_THRESHOLD; // 0.3

    // Nettoyer si sous le seuil
    if (Math.abs(m) < threshold) {
        if (this._momentumGlow) { this._momentumGlow.destroy(); this._momentumGlow = null; }
        if (this._momentumLabel) { this._momentumLabel.destroy(); this._momentumLabel = null; }
        return;
    }

    const isFire = m > 0;
    const color = isFire ? MOMENTUM_INDICATOR_FIRE_COLOR : MOMENTUM_INDICATOR_TILT_COLOR;
    const intensity = Math.min(1, (Math.abs(m) - threshold) / (1 - threshold));

    // Halo autour du sprite
    if (!this._momentumGlow) {
        this._momentumGlow = this.add.graphics().setDepth(45);
    }
    this._momentumGlow.clear();
    this._momentumGlow.fillStyle(color, MOMENTUM_INDICATOR_ALPHA * intensity);
    this._momentumGlow.fillCircle(
        this.opponentSprite.x, this.opponentSprite.y,
        MOMENTUM_INDICATOR_RADIUS + intensity * 8
    );

    // Label texte
    const labelText = isFire
        ? I18n.t('arcade.momentum_fire')
        : I18n.t('arcade.momentum_tilt');
    if (!this._momentumLabel) {
        this._momentumLabel = this.add.text(0, 0, '', {
            fontFamily: 'monospace', fontSize: '8px',
            color: isFire ? '#FF6644' : '#6688CC',
            shadow: { offsetX: 1, offsetY: 1, color: '#1A1510', blur: 0, fill: true }
        }).setOrigin(0.5).setDepth(46);
    }
    this._momentumLabel.setText(labelText);
    this._momentumLabel.setColor(isFire ? '#FF6644' : '#6688CC');
    this._momentumLabel.setPosition(this.opponentSprite.x, this.opponentSprite.y - 28);

    // Si "on fire", tremblement leger du sprite
    if (isFire && intensity > 0.5 && !this._momentumShakeTween) {
        this._momentumShakeTween = this.tweens.add({
            targets: this.opponentSprite,
            x: this.opponentSprite.x + 1, duration: 80,
            yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
        });
    }
    if ((!isFire || intensity <= 0.5) && this._momentumShakeTween) {
        this._momentumShakeTween.destroy();
        this._momentumShakeTween = null;
    }
}
```

**3. Appeler `_updateMomentumIndicator()` dans le hook `engine.onScore` existant** (apres l'appel au commentateur, ligne ~211).

**4. Aussi appeler dans `_animateReaction()` (apres chaque lancer resolu).**

**5. THROTTLE : Ne redessiner le halo que si le momentum a change.** Stocker `this._lastMomentumValue = null` dans `init()`. Dans `_updateMomentumIndicator()`, comparer `m` a `this._lastMomentumValue` (arrondi a 0.1). Si identique, ne rien redessiner. Sinon, mettre a jour `_lastMomentumValue` et redessiner. Cela evite de recreer un `fillCircle` a chaque frame si `_animateReaction()` est appele en boucle rapide.

**6. Dans `_shutdown()`, detruire `_momentumGlow`, `_momentumLabel`, `_momentumShakeTween`.**

### Tests
- Fichier : `tests/unit/momentum-indicator.test.js`
- Mock PetanqueScene minimal, tester que `_updateMomentumIndicator()` :
  - Ne cree rien si `|momentum| < 0.3`
  - Cree un glow + label si `momentum > 0.3`
  - Change de couleur fire vs tilt
  - Detruit proprement quand momentum redescend

### Valide quand
- En jeu, l'adversaire montre un halo orange quand il enchaine les bons coups
- Le halo disparait quand le momentum retombe
- Aucun leak memoire (destroy dans shutdown)
- 60 FPS maintenu

---

## Tache B2 — Indicateur de pression (10-10+)

- **Objectif :** Afficher un badge "PRESSION !" avec effet de tremblement quand les deux scores sont >= 10.
- **Dependances :** A1 (constantes), A3 (i18n)
- **Effort :** S (< 30 min)

### Fichiers a lire
- `src/scenes/PetanqueScene.js` (hook `engine.onScore`, `events.on('match-tension')`)
- `src/utils/Constants.js` (PRESSURE_*)

### Fichiers a modifier
- `src/scenes/PetanqueScene.js`

### Specification

**1. Dans `create()`, init :**
```js
this._pressureActive = false;
this._pressureBadge = null;
this._pressureText = null;
```

**2. Ajouter methode `_showPressureIndicator()` :**
```js
_showPressureIndicator() {
    if (this._pressureActive) return;
    this._pressureActive = true;

    // Badge en haut-centre
    const cx = GAME_WIDTH / 2;
    const y = 18;

    this._pressureBadge = this.add.graphics().setDepth(92);
    this._pressureBadge.fillStyle(PRESSURE_INDICATOR_COLOR, 0.85);
    this._pressureBadge.fillRoundedRect(cx - 50, y - 8, 100, 18, 4);

    this._pressureText = this.add.text(cx, y + 1, I18n.t('arcade.pressure_warning'), {
        fontFamily: 'monospace', fontSize: '10px', color: '#FFD700',
        shadow: { offsetX: 1, offsetY: 1, color: '#1A1510', blur: 0, fill: true }
    }).setOrigin(0.5).setDepth(93);

    // Tremblement permanent
    this.tweens.add({
        targets: [this._pressureBadge, this._pressureText],
        x: '+=' + PRESSURE_WOBBLE_AMPLITUDE,
        duration: PRESSURE_WOBBLE_SPEED,
        yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });

    // Flash bref pour attirer l'attention
    this.cameras.main.flash(100, 196, 75, 63); // #C44B3F
}
```

**3. Appeler dans le hook `engine.onScore` existant :**
Apres la ligne qui verifie `minScore >= 10` (vers ligne 224), ajouter :
```js
if (scores.player >= 10 && scores.opponent >= 10) {
    this._showPressureIndicator();
}
```

**4. Cleanup dans `_shutdown()`.**

### Tests
- Fichier : `tests/unit/pressure-indicator.test.js`
- Tester que `_showPressureIndicator()` cree les elements une seule fois (idempotent)
- Tester que `_pressureActive` empeche la double creation

### Valide quand
- A 10-10 ou plus, le badge "Pression !" apparait en haut de l'ecran avec un tremblement
- Le badge ne se cree qu'une fois par match
- Aucun crash si le match n'atteint jamais 10-10

---

## Tache C1 — Carte de progression visuelle (base)

- **Objectif :** Remplacer `_showProgressScreen()` dans ArcadeScene par une map provencale avec 5 noeuds connectes.
- **Dependances :** A1 (constantes), A2 (time_of_day), A3 (i18n)
- **Effort :** L (90-120 min)

### Fichiers a lire
- `src/scenes/ArcadeScene.js` (methode `_showProgressScreen()` complete, `_buildProgressScreen()`)
- `src/utils/Constants.js` (MAP_*, COLORS, GAME_WIDTH, GAME_HEIGHT)
- `public/data/arcade.json` (matches, time_of_day)
- `src/ui/UIFactory.js` (methodes statiques)

### Fichiers a modifier
- `src/scenes/ArcadeScene.js`

### Specification

**Remplacer entierement `_showProgressScreen()`** par une nouvelle implementation. Conserver `_buildProgressScreen()` qui appelle `_showProgressScreen()`.

**Layout (832x480) :**
```
[0, 60]  ─── MAP ZONE (60-240px) ───
  Fond : gradient vertical #87CEEB (haut) → #F5E6D0 (bas), opacite 1.0
  Titre : "MODE ARCADE" en haut-gauche (x:16, y:20), 16px monospace, #FFD700
  Sous-titre : "Le Tournoi de La Ciotat" (x:16, y:40), 11px, #D4A574
  Moment : I18n.t('arcade.time_' + time_of_day) (x:GAME_WIDTH-16, y:20), align right, 11px, #9E9E8E

  5 noeuds disposes en arc :
    Positions Y variables pour simuler un chemin cote/colline :
    Noeud 1 : (130, 130)  — Village en bas a gauche
    Noeud 2 : (270, 100)  — Parc en haut
    Noeud 3 : (416, 90)   — Colline au sommet (milieu)
    Noeud 4 : (560, 110)  — Docks en descente
    Noeud 5 : (700, 140)  — Plage en bas a droite

  Chemin pointille ocre (#D4A574) entre chaque noeud :
    Lignes de 6px tiret, 4px espace, epaisseur 2px, alpha 0.6

  Noeud (cercle de MAP_NODE_RADIUS=14px) :
    - GAGNE (result.won) : fond #44CC44, bordure #FFD700 1px, checkmark blanc centre
    - COURANT (currentRound) : fond #FFD700, pulse alpha 0.5↔1.0 (800ms)
    - FUTUR : fond #5A4A38 alpha 0.5, bordure #5A4A38
    - DEFAITE PRECEDENTE : fond #5A4A38, bordure #C44B3F 1px

  Sous chaque noeud : nom du terrain (10px, #D4A574)
  Sous le noeud courant : nom adversaire (10px, #F5E6D0) en plus

  Decorations statiques :
    - 3 petits oliviers (ronds verts 4px) places aleatoirement entre les noeuds
    - Vagues bleues (#87CEEB, alpha 0.3) en bas a gauche (3 lignes ondulees)

[270, 480] ─── PREVIEW ZONE ───
  Panel : fond #3A2E28 alpha 0.85, bords arrondis 10px, largeur 560px, centre
  Si v2_panel_bolted existe : utiliser nineslice, sinon graphics

  Contenu identique a l'actuel :
    - "PROCHAIN COMBAT" (18px, #FFD700)
    - Sprite adversaire a gauche (CHAR_SCALE_ARCADE)
    - Nom (22px), titre (12px), catchphrase (10px italic)
    - Barres de stats (4 stats, barres 80px)
    - Terrain + difficulte

  Bouton COMBATTRE : identique a l'actuel (rectangle #C44B3F, texte 22px pulse)
  Controles : identique
```

**Methode `_drawMapNode(x, y, index, state)` :**
- `state` = 'won' | 'current' | 'future' | 'lost'
- Dessine le cercle + decoration selon l'etat
- Retourne l'objet graphics pour reference

**Methode `_drawMapPath(nodes)` :**
- Dessine des lignes pointillees entre les positions des noeuds
- Utiliser une boucle avec `moveTo/lineTo` par segments de 6px

**Methode `_drawMapDecorations()` :**
- Oliviers, vagues — purement decoratif

### Tests
- Fichier : `tests/unit/arcade-map.test.js`
- Tester que `_showProgressScreen()` ne crash pas avec differents `currentRound` (1 a 5)
- Tester que les positions des noeuds sont dans les limites de l'ecran (0-832, 0-480)

### Valide quand
- La map s'affiche correctement avec le fond bleu-creme
- Les noeuds gagnes sont verts, le courant pulse en or, les futurs sont gris
- Le panel preview en bas fonctionne comme avant
- Le bouton COMBATTRE lance le match
- ESC retourne au menu
- Visuellement agreable a 832x480

---

## Tache D1 — Systeme de defis de mene (core)

- **Objectif :** Afficher un defi optionnel au debut de certaines menes, tracker sa completion, donner des Galets bonus.
- **Dependances :** A1 (constantes), A2 (mene_challenges), A3 (i18n)
- **Effort :** L (90-120 min)

### Fichiers a lire
- `src/petanque/PetanqueEngine.js` (`startMene()`, `_scoreRound()`, `matchStats`, `onScore`)
- `src/scenes/PetanqueScene.js` (hooks onScore, _animateReaction)
- `src/petanque/Commentator.js` (methode `say()`)
- `public/data/arcade.json` (mene_challenges)

### Fichiers a modifier
- `src/scenes/PetanqueScene.js`
- `src/petanque/PetanqueEngine.js` (ajout minimal : un callback `onMeneStart`)

### Specification

**1. Dans PetanqueEngine.js, ajouter un callback `onMeneStart` :**

Dans le constructeur (a cote de `this.onScore = null`) :
```js
this.onMeneStart = null;
```

Dans `startMene()`, juste apres `this.mene++` (ou au debut de la methode) :
```js
if (this.onMeneStart) this.onMeneStart(this.mene);
```

**2. Dans PetanqueScene.js, ajouter le systeme de defis :**

**Init dans `create()` :**
```js
// Defi de mene (arcade only)
this._currentChallenge = null;
this._challengeCompleted = false;
this._challengeBanner = null;
this._challengeData = null;
if (this.arcadeState) {
    const arcadeData = this.cache.json.get('arcade');
    this._challengePool = arcadeData?.mene_challenges || [];
}
```

**Hook `onMeneStart` :**
```js
this.engine.onMeneStart = (meneNumber) => {
    if (!this.arcadeState || !this._challengePool?.length) return;
    // Pas de defi en mene 1 (laisser le joueur s'installer)
    if (meneNumber <= 1) return;
    // Probabilite CHALLENGE_PROBABILITY (0.6)
    if (Math.random() > CHALLENGE_PROBABILITY) return;

    // Choisir un defi aleatoire
    const challenge = this._challengePool[
        Math.floor(Math.random() * this._challengePool.length)
    ];
    this._currentChallenge = challenge;
    this._challengeCompleted = false;

    // Afficher le banner
    this._showChallengeBanner(I18n.field(challenge, 'text'));
};
```

**Methode `_showChallengeBanner(text)` :**
```js
_showChallengeBanner(text) {
    // Nettoyer le precedent
    if (this._challengeBanner) { this._challengeBanner.destroy(); this._challengeBanner = null; }

    const cx = GAME_WIDTH / 2;
    const y = 55;

    const container = this.add.container(cx, y).setDepth(95).setAlpha(0);

    const bg = this.add.graphics();
    bg.fillStyle(0x3A2E28, 0.9);
    bg.fillRoundedRect(-160, -14, 320, 28, 6);
    bg.lineStyle(1, 0xFFD700, 0.5);
    bg.strokeRoundedRect(-160, -14, 320, 28, 6);
    container.add(bg);

    const label = this.add.text(0, 0, text, {
        fontFamily: 'monospace', fontSize: '11px', color: '#FFD700',
        shadow: { offsetX: 1, offsetY: 1, color: '#1A1510', blur: 0, fill: true }
    }).setOrigin(0.5);
    container.add(label);

    this._challengeBanner = container;

    // Fade in, hold, fade out
    this.tweens.add({
        targets: container, alpha: 1, duration: 300, ease: 'Sine.easeOut',
        onComplete: () => {
            this.time.delayedCall(CHALLENGE_BANNER_DURATION, () => {
                if (container.active) {
                    this.tweens.add({
                        targets: container, alpha: 0, duration: 400,
                        onComplete: () => { if (container.active) container.destroy(); }
                    });
                }
            });
        }
    });

    // Commentateur annonce le defi
    if (this._commentator) this._commentator.say('defi', true);
}
```

**3. Verification du defi dans le hook `onScore` :**

Dans le hook onScore existant, apres le calcul des scores :
```js
// Verifier le defi de mene
if (this._currentChallenge && !this._challengeCompleted) {
    const c = this._currentChallenge;
    const ms = this.engine.matchStats;
    let completed = false;
    if (c.stat === 'carreaux' && (ms.carreaux || 0) >= c.target) completed = true;
    if (c.stat === 'meneScore' && points >= c.target && winner === 'player') completed = true;
    if (c.stat === 'biberons' && (ms.biberons || 0) >= c.target) completed = true;
    // onlyRoulette : tracker dans PetanqueEngine.matchStats
    // Ajouter dans PetanqueEngine._throwBall() : if (shotType !== 'roulette') matchStats._usedNonRoulette = true;
    if (c.stat === 'onlyRoulette' && winner === 'player' && !ms._usedNonRoulette) completed = true;

    if (completed) {
        this._challengeCompleted = true;
        addGalets(c.reward || CHALLENGE_REWARD_GALETS);
        this._showChallengeResult(true, c.reward || CHALLENGE_REWARD_GALETS);
    }
}
```

**Methode `_showChallengeResult(success, galets)` :**
Affiche un petit texte "+10 Galets (Defi!)" ou "Defi echoue" pendant 2s a cote du score, meme style que le "+N" existant.

**4. Reset `_currentChallenge` au debut de chaque mene** (dans le hook onMeneStart).

**5. Cleanup dans `_shutdown()`.**

### Tests
- Fichier : `tests/unit/mene-challenge.test.js`
- Tester la logique de verification : si `carreaux >= 1`, le defi `mc_carreau` est complete
- Tester que le defi ne s'active pas en mene 1
- Tester l'idempotence (un defi ne se complete qu'une fois)

### Valide quand
- En arcade, un banner "Defi : Fais un carreau !" apparait ~60% du temps a partir de la mene 2
- Si le joueur reussit, "+10 Galets" s'affiche
- Les Galets sont ajoutes a la save
- Pas de defi en QuickPlay (seulement arcade)

---

## Tache E1 — Micro-narratives + barks reactifs au score

- **Objectif :** Afficher les micro-narratives post-match (apres R1, R2) et activer les barks conditionnes au score dans PetanqueScene.
- **Dependances :** A2 (post_narrative), A3 (i18n), A4 (barks contextuels)
- **Effort :** M (30-60 min)

### Fichiers a lire
- `src/scenes/ArcadeScene.js` (`_showNarrative()`, `create()` flow)
- `src/scenes/PetanqueScene.js` (`_triggerScoreBark()`, `_showBark()`)
- `public/data/arcade.json` (post_narrative)
- `public/data/characters.json` (nouveaux barks)

### Fichiers a modifier
- `src/scenes/ArcadeScene.js`
- `src/scenes/PetanqueScene.js`

### Specification

**Partie 1 — Micro-narratives (ArcadeScene.js) :**

Dans `create()`, apres le bloc `if (this.lastMatchResult)` qui traite les resultats (vers ligne 81-99), ajouter **avant** `_buildProgressScreen()` :

```js
// Show post-narrative for rounds that have one (rounds 1 and 2)
const completedRound = this.currentRound - 1;
if (this.lastMatchResult?.won) {
    const prevMatch = this.arcadeData.matches[completedRound - 1];
    const postNarr = prevMatch?.post_narrative;
    if (postNarr && postNarr.length > 0) {
        const lines = I18n.fieldArray(prevMatch, 'post_narrative') || postNarr;
        this._showNarrative(lines, () => {
            this._buildProgressScreen();
        });
        return;
    }
}
```

**Attention** : La `_showNarrative()` existe deja et fonctionne parfaitement. On reutilise.

**Partie 2 — Barks reactifs au score (PetanqueScene.js) :**

**Remplacer `_triggerScoreBark()`** par une version enrichie :

```js
_triggerScoreBark(scores, winner, points) {
    if (Math.random() > 0.6) return; // 60% chance (was 50%)
    const loser = winner === 'player' ? 'opponent' : 'player';
    const diff = scores[winner] - scores[loser];
    const maxScore = Math.max(scores.player, scores.opponent);
    const minScore = Math.min(scores.player, scores.opponent);

    // Pression (10-10+)
    if (scores.player >= 10 && scores.opponent >= 10) {
        this._showBark(winner, 'pressure_tied');
        return;
    }

    // Fanny imminente (12-0)
    if (maxScore >= 12 && minScore === 0) {
        const leadTeam = scores.player > scores.opponent ? 'player' : 'opponent';
        this._showBark(leadTeam, 'fanny_imminent_winning');
        this.time.delayedCall(1200, () => {
            const losingTeam = leadTeam === 'player' ? 'opponent' : 'player';
            this._showBark(losingTeam, 'fanny_imminent_losing');
        });
        return;
    }

    // Domination (8-0+)
    if (diff >= 8 && minScore <= 2) {
        this._showBark(winner, 'dominant_lead');
        return;
    }

    // Comeback (remonte de 5+)
    if (winner === 'player' && scores.player > scores.opponent && diff >= 5) {
        this._showBark('player', 'comeback_self');
        return;
    }
    if (winner === 'opponent' && scores.opponent > scores.player && diff >= 5) {
        this._showBark('opponent', 'comeback_self');
        this.time.delayedCall(1000, () => this._showBark('player', 'opponent_comeback'));
        return;
    }

    // Fallback : barks existants (match_point, taking_lead, losing_badly)
    if (scores.player >= 11 || scores.opponent >= 11) {
        this._showBark(winner === 'player' ? 'player' : 'opponent', 'match_point');
    } else if (diff >= 6) {
        this._showBark(winner, 'taking_lead');
    } else if (scores[loser] - scores[winner] >= 6) {
        this._showBark(loser, 'losing_badly');
    }
}
```

### Tests
- Fichier : `tests/unit/barks-reactive.test.js`
- Tester la logique de selection de bark :
  - 10-10 → `pressure_tied`
  - 12-0 → `fanny_imminent_winning` + `fanny_imminent_losing`
  - 8-0 → `dominant_lead`
  - Comeback → `comeback_self`

### Valide quand
- Apres R1 (victoire), une micro-narrative s'affiche avant la map
- Apres R2 (victoire), idem
- En match, les barks reagissent au score (pression, fanny, comeback...)
- Les barks existants (good_shot, carreau) continuent de fonctionner

---

## Tache D3 — Soupape de defaite (retry + consolation)

- **Objectif :** Apres une defaite en arcade, afficher un ecran de consolation avec Galets gagnes pendant le match, et proposer de rejouer le meme match.
- **Dependances :** C1 (map base — pour le retour a la map), A1 (constantes), A3 (i18n)
- **Effort :** M (30-60 min)

### Fichiers a lire
- `src/scenes/ArcadeScene.js` (flow `create()`, traitement de `lastMatchResult`)
- `src/scenes/ResultScene.js` (donnees passees a ArcadeScene apres defaite)
- `src/utils/SaveManager.js` (addGalets, loadSave)
- `src/utils/Constants.js` (DEFEAT_*)

### Fichiers a modifier
- `src/scenes/ArcadeScene.js`

### Specification

**1. Dans `create()`, apres le traitement de `lastMatchResult`, si le joueur a perdu :**

```js
// Soupape de defaite : ecran consolation + retry
if (this.lastMatchResult && !this.lastMatchResult.won) {
    this._showDefeatScreen(this.lastMatchResult);
    return; // Ne pas montrer la map tout de suite
}
```

**2. Methode `_showDefeatScreen(result)` :**

```js
_showDefeatScreen(result) {
    const cx = GAME_WIDTH / 2;

    // Fond sombre
    const bg = this.add.graphics().setDepth(50);
    bg.fillStyle(0x1A1510, 0.9);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Titre
    this.add.text(cx, 80, I18n.t('arcade.defeat_title'), {
        fontFamily: 'monospace', fontSize: '28px', color: '#C44B3F',
        shadow: { offsetX: 2, offsetY: 2, color: '#1A1510', blur: 0, fill: true }
    }).setOrigin(0.5).setDepth(51);

    // Galets gagnes pendant ce match (defis mene + golden zone)
    const matchGalets = result.galetsEarned || 0;
    if (matchGalets > 0) {
        this.add.text(cx, 130, I18n.t('arcade.defeat_earned', { galets: matchGalets }), {
            fontFamily: 'monospace', fontSize: '14px', color: '#FFD700'
        }).setOrigin(0.5).setDepth(51);
    }

    // Consolation galets
    if (DEFEAT_CONSOLATION_GALETS > 0) {
        addGalets(DEFEAT_CONSOLATION_GALETS);
        this.add.text(cx, 165, I18n.t('arcade.defeat_consolation', { galets: DEFEAT_CONSOLATION_GALETS }), {
            fontFamily: 'monospace', fontSize: '12px', color: '#D4A574'
        }).setOrigin(0.5).setDepth(51);
    }

    // Nom adversaire qui a gagne
    const oppMatch = this.arcadeData.matches[this.currentRound - 2]; // round perdu = currentRound - 1
    if (oppMatch) {
        const oppChar = this._getCharById(oppMatch.opponent);
        if (oppChar) {
            this.add.text(cx, 210, I18n.field(oppChar, 'name'), {
                fontFamily: 'monospace', fontSize: '16px', color: '#F5E6D0'
            }).setOrigin(0.5).setDepth(51);
        }
    }

    // Bouton REJOUER (retry le meme match)
    if (DEFEAT_RETRY_ENABLED) {
        const retryBtn = this.add.text(cx, 280, I18n.t('arcade.defeat_retry'), {
            fontFamily: 'monospace', fontSize: '18px', color: '#F5E6D0',
            backgroundColor: '#C44B3F', padding: { x: 16, y: 8 }
        }).setOrigin(0.5).setDepth(52).setInteractive({ useHandCursor: true });

        retryBtn.on('pointerdown', () => {
            // Relancer le meme round (currentRound a deja ete decremente ou pas)
            // On remet le round perdu comme prochain match
            this.currentRound = this.currentRound; // reste le meme
            this.losses = Math.max(0, this.losses - 1); // annuler la defaite comptee
            // Retirer le result de defaite des matchResults
            const lostIdx = this.matchResults.findIndex(r => r.round === this.currentRound - 1 && !r.won);
            if (lostIdx >= 0) this.matchResults.splice(lostIdx, 1);
            // Cleanup et montrer la map
            this.children.list.filter(c => c.depth >= 50 && c.depth <= 52).forEach(c => c.destroy());
            this._buildProgressScreen();
        });
    }

    // Bouton CONTINUER (accepter la defaite, avancer)
    const continueBtn = this.add.text(cx, 340, I18n.t('arcade.defeat_continue'), {
        fontFamily: 'monospace', fontSize: '14px', color: '#9E9E8E',
        backgroundColor: '#3A2E28', padding: { x: 14, y: 6 }
    }).setOrigin(0.5).setDepth(52).setInteractive({ useHandCursor: true });

    continueBtn.on('pointerdown', () => {
        this.children.list.filter(c => c.depth >= 50 && c.depth <= 52).forEach(c => c.destroy());
        this._buildProgressScreen();
    });

    // Keyboard
    this.input.keyboard.on('keydown-SPACE', () => retryBtn?.emit('pointerdown'));
    this.input.keyboard.on('keydown-ESC', () => continueBtn.emit('pointerdown'));
}
```

**3. Pour tracker les `galetsEarned` pendant un match :**

Dans PetanqueScene.js, ajouter `this._matchGaletsEarned = 0` dans `init()`.
A chaque appel de `addGalets()` pendant le match (defis mene, golden zone), incrementer aussi `this._matchGaletsEarned += amount`.
Passer `galetsEarned: this._matchGaletsEarned` dans le `resultData` envoye a ArcadeScene.

### Tests
- Fichier : `tests/unit/defeat-screen.test.js`
- Tester que `DEFEAT_CONSOLATION_GALETS` est bien ajoute apres une defaite
- Tester que le retry remet le bon round
- Tester que le continue avance normalement

### Valide quand
- Apres une defaite en arcade, un ecran "DEFAITE" s'affiche (pas juste un noeud rouge sur la map)
- Les Galets gagnes pendant le match sont affiches
- +15 Galets de consolation sont donnes
- Le bouton REJOUER relance le meme match
- Le bouton CONTINUER montre la map et avance au match suivant
- En QuickPlay, rien ne change

---

# VAGUE 3 — FEATURES AVANCEES

> Depend de la Vague 2.

---

## Tache B3 — Tells IA avant tir

- **Objectif :** Afficher un flash colore bref (400ms) sur le sprite adversaire juste avant qu'il lance, indiquant s'il va pointer ou tirer.
- **Dependances :** B1 (momentum visible — car les deux touchent au sprite adversaire, eviter conflits)
- **Effort :** S (< 30 min)

### Fichiers a lire
- `src/petanque/PetanqueAI.js` (`_throwBall()`, `_showAimingArrow()`)
- `src/scenes/PetanqueScene.js` (sprite adversaire)
- `src/utils/Constants.js` (AI_TELL_*)

### Fichiers a modifier
- `src/petanque/PetanqueAI.js`

### Specification

Dans `_showAimingArrow()`, **avant** le callback du lancer (le `this.scene.time.delayedCall(400, ...)`), ajouter un flash sur le sprite adversaire :

```js
// Tell visuel : flash couleur selon pointer/tirer
const opSprite = this.scene.opponentSprite;
if (opSprite) {
    const isTir = color === 0xFF6644; // arrowColor rouge = tir
    const tellColor = isTir ? AI_TELL_SHOOTER_COLOR : AI_TELL_POINTER_COLOR;
    const tellGfx = this.scene.add.graphics().setDepth(46);
    tellGfx.fillStyle(tellColor, AI_TELL_ALPHA);
    tellGfx.fillCircle(opSprite.x, opSprite.y, 18);

    this.scene.tweens.add({
        targets: tellGfx, alpha: 0, duration: AI_TELL_DURATION,
        ease: 'Sine.easeOut',
        onComplete: () => tellGfx.destroy()
    });
}
```

### Tests
- Fichier : `tests/unit/ai-tell.test.js`
- Tester que le tell se detruit apres AI_TELL_DURATION
- Tester la couleur ciel (pointer) vs accent (tirer)

### Valide quand
- Avant chaque lancer IA, un flash bleu (pointer) ou rouge (tirer) apparait 400ms
- Le flash n'interfere pas avec le halo momentum
- Pas de leak (le graphics est detruit)

---

## Tache C2 — Etoiles sur la map

- **Objectif :** Afficher les star ratings gagnes sous chaque noeud de la map arcade. Afficher le total X/15.
- **Dependances :** C1 (map base)
- **Effort :** S (< 30 min)

### Fichiers a lire
- `src/scenes/ArcadeScene.js` (la nouvelle `_showProgressScreen()` de C1)
- `src/scenes/ResultScene.js` (`_saveStarRating()` → save.starRatings[oppId])
- `src/utils/SaveManager.js` (`loadSave()`)

### Fichiers a modifier
- `src/scenes/ArcadeScene.js`

### Specification

**1. Dans `_showProgressScreen()`, apres avoir dessine chaque noeud gagne, ajouter les etoiles :**

```js
// Stars sous le noeud gagne
const save = loadSave();
const oppId = match.opponent;
const stars = save.starRatings?.[oppId] || 0;
if (stars > 0) {
    const starY = nodeY + MAP_NODE_RADIUS + 14;
    for (let s = 0; s < 3; s++) {
        const sx = nodeX - 12 + s * 12;
        const filled = s < stars;
        this.add.text(sx, starY, '\u2605', {
            fontFamily: 'monospace', fontSize: `${MAP_STAR_SIZE}px`,
            color: filled ? '#FFD700' : '#5A4A38'
        }).setOrigin(0.5);
    }
}
```

**2. Afficher le total en haut a droite :**

```js
// Total etoiles
const totalStars = Object.values(save.starRatings || {}).reduce((sum, v) => sum + v, 0);
this.add.text(GAME_WIDTH - 16, 45, I18n.t('arcade.stars_total', { n: totalStars }), {
    fontFamily: 'monospace', fontSize: '11px', color: '#FFD700',
    shadow: { offsetX: 1, offsetY: 1, color: '#1A1510', blur: 0, fill: true }
}).setOrigin(1, 0.5);

// Bonus 15/15
if (totalStars >= 15) {
    this.add.text(GAME_WIDTH - 16, 58, I18n.t('arcade.stars_bonus', { galets: 100 }), {
        fontFamily: 'monospace', fontSize: '9px', color: '#44CC44'
    }).setOrigin(1, 0.5);
}
```

### Tests
- Fichier : `tests/unit/arcade-stars.test.js`
- Mocker `loadSave()` avec des starRatings partiels, verifier le total

### Valide quand
- Chaque noeud gagne affiche ses etoiles (1-3, or pour remplies, gris pour vides)
- Le total "X/15 etoiles" s'affiche en haut a droite
- Si 15/15, un message bonus vert apparait

---

## Tache D2 — Defis de match (objectifs optionnels)

- **Objectif :** Au lancement d'un match arcade, attribuer un defi de match ("Gagne sans tir", "Fais un carreau") visible dans le HUD. Verifier a la fin du match.
- **Dependances :** D1 (systeme de defis de mene — partage les memes patterns UI)
- **Effort :** M (30-60 min)

### Fichiers a lire
- `public/data/arcade.json` (match_challenges)
- `src/scenes/PetanqueScene.js` (init data, engine hooks)
- `src/scenes/ResultScene.js` (matchStats disponibles a la fin)
- `src/utils/SaveManager.js` (addGalets)

### Fichiers a modifier
- `src/scenes/PetanqueScene.js`
- `src/scenes/ResultScene.js`

### Specification

**1. PetanqueScene — Afficher le defi en debut de match :**

Dans `create()`, apres l'arcade badge (vers ligne 335) :
```js
// Match challenge (arcade only)
this._matchChallenge = null;
if (this.arcadeState) {
    const arcadeData = this.cache.json.get('arcade');
    const challenges = arcadeData?.match_challenges || [];
    if (challenges.length > 0) {
        this._matchChallenge = challenges[Math.floor(Math.random() * challenges.length)];
        // Petit badge en bas du badge arcade
        const cText = I18n.field(this._matchChallenge, 'name');
        this.time.delayedCall(3000, () => {
            const badge = this.add.text(4, 56, `Defi: ${cText}`, {
                fontFamily: 'monospace', fontSize: '8px', color: '#FFD700',
                backgroundColor: '#3A2E28', padding: { x: 4, y: 2 }
            }).setDepth(92).setAlpha(0);
            this.tweens.add({ targets: badge, alpha: 0.8, duration: 500 });
            this.time.delayedCall(5000, () => {
                this.tweens.add({ targets: badge, alpha: 0, duration: 500 });
            });
        });
    }
}
```

**2. PetanqueScene — Passer le defi aux donnees de ResultScene :**

Dans la methode qui transite vers ResultScene (chercher `this.scene.start('ResultScene'`), ajouter au `resultData` :
```js
matchChallenge: this._matchChallenge || null
```

**3. Ajouter `maxDeficit` au matchStats :**

Dans le hook `onScore`, tracker le deficit max du joueur :
```js
if (!this.engine.matchStats._maxDeficit) this.engine.matchStats._maxDeficit = 0;
const deficit = scores.opponent - scores.player;
if (deficit > this.engine.matchStats._maxDeficit) {
    this.engine.matchStats._maxDeficit = deficit;
}
```

**4. ResultScene — Verifier et afficher le resultat du defi :**

Dans `create()`, apres l'affichage des stats (vers ligne 173), si `this.matchChallenge` existe :

Ajouter `this.matchChallenge = data.matchChallenge || null;` dans `init()`.

```js
if (this.matchChallenge && this.won) {
    const c = this.matchChallenge;
    const ms = this.matchStats;
    let completed = false;

    // Evaluer la condition
    if (c.condition === 'carreaux >= 1' && (ms.carreaux || 0) >= 1) completed = true;
    if (c.condition === 'shots === 0 && won' && (ms.shots || 0) === 0) completed = true;
    if (c.condition === 'won && opponentScore <= 5' && this.scores.opponent <= 5) completed = true;
    if (c.condition === 'won && maxDeficit >= 5' && (ms._maxDeficit || 0) >= 5) completed = true;
    if (c.condition === 'won && opponentScore === 0' && this.scores.opponent === 0) completed = true;

    if (completed) {
        addGalets(c.reward);
        const challengeText = this.add.text(GAME_WIDTH / 2, panelY + panelH + 70,
            I18n.t('arcade.challenge_complete', { galets: c.reward }), {
                fontFamily: 'monospace', fontSize: '14px', color: '#FFD700', shadow: SHADOW
            }).setOrigin(0.5).setAlpha(0);
        this.tweens.add({ targets: challengeText, alpha: 1, duration: 500, delay: 1500 });
    }
}
```

### Tests
- Fichier : `tests/unit/match-challenge.test.js`
- Tester les 5 conditions d'evaluation
- Tester que les Galets sont ajoutes si complete

### Valide quand
- Un defi de match s'affiche brievement en debut de match arcade
- A la victoire, si le defi est rempli, "+25 Galets (Defi reussi !)" apparait
- Les Galets sont bien sauvegardes

---

## Tache E2 — Commentateur enrichi (terrain + adversaire)

- **Objectif :** Ajouter des categories de commentaires specifiques au terrain et a l'adversaire dans le commentateur.
- **Dependances :** E1 (barks reactifs — eviter conflits sur les hooks)
- **Effort :** M (30-60 min)

### Fichiers a lire
- `src/petanque/Commentator.js` (methode `say()`, `loadPhrases()`)
- `src/scenes/PetanqueScene.js` (hooks onShotResult, onScore)
- `public/data/commentator.json` (structure existante)

### Fichiers a modifier
- `public/data/commentator.json`
- `src/scenes/PetanqueScene.js`

### Specification

**1. Ajouter des categories dans commentator.json :**

```json
"defi": ["Un defi est lance !", "Objectif bonus en vue !", "Defi accepte ?"],
"defi_en": ["A challenge appears!", "Bonus objective ahead!", "Challenge accepted?"],

"terrain_sable": ["Le sable est lourd ici...", "Attention, ca freine !"],
"terrain_sable_en": ["Heavy sand here...", "Watch out, it slows down!"],
"terrain_dalles": ["Les dalles, ca glisse !", "Terrain rapide, attention !"],
"terrain_dalles_en": ["Slippery tiles!", "Fast surface, watch out!"],
"terrain_herbe": ["L'herbe est traître.", "Terrain mixte, adaptez-vous."],
"terrain_herbe_en": ["Tricky grass.", "Mixed terrain, adapt!"],

"adversaire_tireur": ["Attention, c'est un tireur !", "Il va viser vos boules !"],
"adversaire_tireur_en": ["Watch out, he's a shooter!", "He'll target your boules!"],
"adversaire_pointeur": ["Un pointeur de precision...", "Il va se coller au cochonnet."],
"adversaire_pointeur_en": ["A precision pointer...", "He'll stick close to the jack."],

"mene_debut_2": ["La partie s'installe...", "Les choses serieuses commencent."],
"mene_debut_2_en": ["The game settles in...", "Things get serious."],
"mene_debut_5": ["Cinquieme mene ! On entre dans le vif.", "Ca chauffe !"],
"mene_debut_5_en": ["Fifth round! Getting intense.", "Heating up!"]
```

**2. Dans PetanqueScene `create()`, initialiser le sequenceur de commentaires puis ajouter des triggers :**

**IMPORTANT — Sequenceur de commentaires :**
Pour eviter la superposition de feedbacks textuels (banner defi + commentateur + barks), ajouter un flag de cooldown :
```js
// Commentator cooldown (eviter superposition)
this._commentatorBusy = false;
this._safeCommentatorSay = (category) => {
    if (this._commentatorBusy || !this._commentator) return;
    this._commentatorBusy = true;
    this._commentator.say(category);
    this.time.delayedCall(COMMENTATOR_COOLDOWN, () => { this._commentatorBusy = false; });
};
```

Utiliser `this._safeCommentatorSay()` au lieu de `this._commentator.say()` pour les commentaires non-critiques (terrain, adversaire, mene). Les barks de score (E1) restent en appel direct car ils sont deja gates par le random 60%.

```js
// Commentaire terrain (une seule fois, apres 2s)
this.time.delayedCall(2000, () => {
    const surface = this.terrainFullData?.surface || this.terrainType;
    if (surface === 'sable') this._safeCommentatorSay('terrain_sable');
    else if (surface === 'dalles') this._safeCommentatorSay('terrain_dalles');
    else if (surface === 'herbe') this._safeCommentatorSay('terrain_herbe');
});

// Commentaire adversaire (une seule fois, apres 6s)
this.time.delayedCall(6000, () => {
    const arch = this.opponentCharacter?.archetype;
    if (arch === 'tireur') this._safeCommentatorSay('adversaire_tireur');
    else if (arch === 'pointeur') this._safeCommentatorSay('adversaire_pointeur');
});
```

**3. Hook onMeneStart pour commentaires de mene :**

Dans le hook `engine.onMeneStart` (deja ajoute par D1) :
```js
if (this.engine.mene === 2) this._safeCommentatorSay?.('mene_debut_2');
if (this.engine.mene === 5) this._safeCommentatorSay?.('mene_debut_5');
```

### Tests
- Fichier : `tests/unit/commentator-enriched.test.js`
- Charger commentator.json, verifier que les nouvelles categories existent
- Tester que chaque categorie a des phrases FR + EN

### Valide quand
- En debut de match sur sable, le commentateur dit "Le sable est lourd ici..."
- Face a un tireur, le commentateur previent le joueur
- Commentaires de mene 2 et 5 fonctionnent
- Aucun doublon avec les commentaires existants

---

## Tache F1 — Milestones UI (overlay dans ArcadeScene)

- **Objectif :** Afficher les milestones dejaques/debloques dans l'ecran de progression arcade et declencher les rewards.
- **Dependances :** C1 (map base — besoin de savoir ou positionner l'UI)
- **Effort :** M (30-60 min)

### Fichiers a lire
- `public/data/arcade.json` (milestones[])
- `src/utils/SaveManager.js` (`isMilestoneUnlocked()`, `unlockMilestone()`, `addGalets()`)
- `src/scenes/ArcadeScene.js` (nouvelle map de C1)

### Fichiers a modifier
- `src/scenes/ArcadeScene.js`

### Specification

**1. Dans `create()`, apres `_processRoundUnlocks()`, verifier les milestones :**

```js
_checkMilestones() {
    const save = loadSave();
    const milestones = this.arcadeData.milestones || [];

    for (const m of milestones) {
        if (isMilestoneUnlocked(m.id)) continue;

        let unlocked = false;
        if (m.condition === 'arcadeWins >= 1' && this.wins >= 1) unlocked = true;
        if (m.condition === 'arcadeWins >= 3' && this.wins >= 3) unlocked = true;
        if (m.condition === 'arcade_complete' && this.wins >= 5) unlocked = true;
        if (m.condition === 'arcade_perfect' && this.wins >= 5 && this.losses === 0) unlocked = true;
        if (m.condition === 'carreaux >= 1' && (save.cumulativeStats?.carreaux || 0) >= 1) unlocked = true;
        if (m.condition === 'match_fanny') {
            const lastResult = this.matchResults[this.matchResults.length - 1];
            if (lastResult?.won && lastResult?.opponentScore === 0) unlocked = true;
        }

        if (unlocked) {
            const isNew = unlockMilestone(m.id);
            if (isNew) {
                addGalets(m.reward);
                this._showMilestonePopup(m);
            }
        }
    }
}
```

**2. Methode `_showMilestonePopup(milestone)` :**

```js
_showMilestonePopup(milestone) {
    const cx = GAME_WIDTH / 2;
    const y = GAME_HEIGHT / 2;

    const overlay = this.add.graphics().setDepth(100);
    overlay.fillStyle(0x1A1510, 0.6);
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const panel = this.add.graphics().setDepth(101);
    panel.fillStyle(0x3A2E28, 0.95);
    panel.fillRoundedRect(cx - 180, y - 50, 360, 100, 10);
    panel.lineStyle(2, 0xFFD700, 0.6);
    panel.strokeRoundedRect(cx - 180, y - 50, 360, 100, 10);

    const titleText = this.add.text(cx, y - 25, I18n.t('arcade.milestone_unlocked'), {
        fontFamily: 'monospace', fontSize: '14px', color: '#FFD700',
        shadow: { offsetX: 2, offsetY: 2, color: '#1A1510', blur: 0, fill: true }
    }).setOrigin(0.5).setDepth(102);

    const nameText = this.add.text(cx, y + 5, I18n.field(milestone, 'text'), {
        fontFamily: 'monospace', fontSize: '18px', color: '#F5E6D0',
        shadow: { offsetX: 2, offsetY: 2, color: '#1A1510', blur: 0, fill: true }
    }).setOrigin(0.5).setDepth(102);

    const rewardText = this.add.text(cx, y + 30, `+${milestone.reward} Galets`, {
        fontFamily: 'monospace', fontSize: '14px', color: '#FFD700'
    }).setOrigin(0.5).setDepth(102);

    // Auto-dismiss apres 3s
    this.time.delayedCall(3000, () => {
        this.tweens.add({
            targets: [overlay, panel, titleText, nameText, rewardText],
            alpha: 0, duration: 500,
            onComplete: () => {
                overlay.destroy(); panel.destroy();
                titleText.destroy(); nameText.destroy(); rewardText.destroy();
            }
        });
    });
}
```

**3. Appeler `_checkMilestones()` dans `create()` apres le traitement de `lastMatchResult`.**

### Tests
- Fichier : `tests/unit/milestones-ui.test.js`
- Mocker SaveManager, tester que les conditions de milestone sont correctes
- Tester que `unlockMilestone` n'est appele qu'une fois par milestone

### Valide quand
- Apres la premiere victoire arcade, le popup "Premiere victoire ! +50 Galets" apparait
- Apres 3 victoires, "Mi-parcours ! +75 Galets"
- Les milestones ne se declenchent qu'une seule fois

---

# VAGUE 4 — INTEGRATION FINALE

> Depend de la Vague 3.

---

## Tache F2 — Shop express entre matchs

- **Objectif :** Apres une victoire arcade, proposer un overlay "boutique rapide" avec 2 items a prix reduit avant le prochain match.
- **Dependances :** C2 (etoiles map), F1 (milestones — car les deux modifient ArcadeScene)
- **Effort :** M (60-90 min)

### Fichiers a lire
- `src/scenes/ArcadeScene.js` (flow apres victoire)
- `src/scenes/ShopScene.js` (structure des items, categories)
- `public/data/shop.json` (items, prix)
- `src/utils/SaveManager.js` (spendGalets, loadSave)
- `src/utils/Constants.js` (SHOP_EXPRESS_*)

### Fichiers a modifier
- `src/scenes/ArcadeScene.js`

### Specification

**1. Dans `_buildProgressScreen()`, si le joueur vient de gagner, montrer le shop express AVANT la map :**

```js
_buildProgressScreen() {
    // Shop express apres victoire (sauf dernier round, et seulement si budget suffisant)
    const save = loadSave();
    if (this.lastMatchResult?.won && this.currentRound <= 5
        && save.galets >= SHOP_EXPRESS_MIN_GALETS) {
        this._showShopExpress(() => {
            this._showProgressScreen();
        });
        return;
    }
    this._showProgressScreen();
}
```

**2. Methode `_showShopExpress(onComplete)` :**

```js
_showShopExpress(onComplete) {
    const shopData = this.cache.json.get('shop');
    if (!shopData?.categories) { onComplete(); return; }

    const save = loadSave();
    const purchases = save.purchases || [];

    // Trouver 2 items non-achetes, abordables
    const allItems = shopData.categories.flatMap(c => c.items)
        .filter(i => i.price > 0 && !purchases.includes(i.id));
    if (allItems.length === 0) { onComplete(); return; }

    // Trier par prix, prendre les 2 plus proches du budget
    allItems.sort((a, b) => a.price - b.price);
    const affordable = allItems.filter(i => {
        const discounted = Math.floor(i.price * (1 - SHOP_EXPRESS_DISCOUNT));
        return discounted <= save.galets;
    });
    const items = (affordable.length > 0 ? affordable : allItems).slice(0, SHOP_EXPRESS_ITEMS);

    // Overlay
    const bg = this.add.graphics().setDepth(50);
    bg.fillStyle(0x1A1510, 0.85);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const cx = GAME_WIDTH / 2;

    this.add.text(cx, 80, I18n.t('arcade.shop_express_title'), {
        fontFamily: 'monospace', fontSize: '24px', color: '#FFD700',
        shadow: { offsetX: 2, offsetY: 2, color: '#1A1510', blur: 0, fill: true }
    }).setOrigin(0.5).setDepth(51);

    this.add.text(cx, 110, I18n.t('arcade.shop_express_subtitle'), {
        fontFamily: 'monospace', fontSize: '12px', color: '#D4A574'
    }).setOrigin(0.5).setDepth(51);

    // Galets display
    this.add.text(cx, 135, `${save.galets} Galets`, {
        fontFamily: 'monospace', fontSize: '14px', color: '#FFD700'
    }).setOrigin(0.5).setDepth(51);

    // Items (2 cartes cote a cote)
    const cardW = 200;
    const cardH = 120;
    const gap = 30;
    const startX = cx - (items.length * cardW + (items.length - 1) * gap) / 2;

    items.forEach((item, idx) => {
        const ix = startX + idx * (cardW + gap) + cardW / 2;
        const iy = 220;
        const discounted = Math.floor(item.price * (1 - SHOP_EXPRESS_DISCOUNT));
        const canBuy = save.galets >= discounted;

        const card = this.add.graphics().setDepth(51);
        card.fillStyle(0x3A2E28, 0.9);
        card.fillRoundedRect(ix - cardW / 2, iy - cardH / 2, cardW, cardH, 8);
        card.lineStyle(1, canBuy ? 0xFFD700 : 0x5A4A38, 0.5);
        card.strokeRoundedRect(ix - cardW / 2, iy - cardH / 2, cardW, cardH, 8);

        this.add.text(ix, iy - 35, I18n.field(item, 'name') || item.name, {
            fontFamily: 'monospace', fontSize: '12px', color: '#F5E6D0'
        }).setOrigin(0.5).setDepth(52);

        // Prix barre + prix reduit
        this.add.text(ix - 20, iy, `${item.price}`, {
            fontFamily: 'monospace', fontSize: '11px', color: '#9E9E8E',
            // Simulated strikethrough
        }).setOrigin(0.5).setDepth(52);
        this.add.text(ix + 20, iy, `${discounted}`, {
            fontFamily: 'monospace', fontSize: '14px', color: '#FFD700'
        }).setOrigin(0.5).setDepth(52);

        // Bouton acheter
        if (canBuy) {
            const buyBtn = this.add.text(ix, iy + 35, '[ ACHETER ]', {
                fontFamily: 'monospace', fontSize: '12px', color: '#F5E6D0',
                backgroundColor: '#6B8E4E', padding: { x: 8, y: 4 }
            }).setOrigin(0.5).setDepth(52).setInteractive({ useHandCursor: true });

            buyBtn.on('pointerdown', () => {
                spendGalets(discounted);
                const sv = loadSave();
                if (!sv.purchases) sv.purchases = [];
                sv.purchases.push(item.id);
                saveSave(sv);
                buyBtn.setText('ACHETE !').setColor('#44CC44').removeInteractive();
            });
        }
    });

    // Bouton passer
    const skipBtn = this.add.text(cx, 340, '[ PASSER ]', {
        fontFamily: 'monospace', fontSize: '16px', color: '#9E9E8E',
        backgroundColor: '#3A2E28', padding: { x: 14, y: 6 }
    }).setOrigin(0.5).setDepth(52).setInteractive({ useHandCursor: true });

    // Stocker les elements du shop pour cleanup propre
    const shopElements = [bg];
    // (ajouter chaque element cree ci-dessus a shopElements lors de leur creation)

    const _closeShop = () => {
        this.tweens.add({
            targets: bg, alpha: 0, duration: 300,
            onComplete: () => {
                shopElements.forEach(el => { if (el?.active) el.destroy(); });
                onComplete();
            }
        });
    };

    skipBtn.on('pointerdown', _closeShop);

    this.input.keyboard.on('keydown-SPACE', () => skipBtn.emit('pointerdown'));
    this.input.keyboard.on('keydown-ESC', () => skipBtn.emit('pointerdown'));
}
```

### Tests
- Fichier : `tests/unit/shop-express.test.js`
- Tester que le discount est bien calcule (floor(price * 0.8))
- Tester que le skip fonctionne (callback onComplete appele)

### Valide quand
- Apres une victoire arcade, un overlay "Boutique rapide" s'affiche avec 2 items
- Les prix sont reduits de 20%
- Le joueur peut acheter ou passer
- Apres achat/passe, la map de progression s'affiche normalement

---

## Tache F3 — Zone doree sur le terrain

- **Objectif :** Afficher un cercle dore aleatoire sur le terrain pendant certaines menes. Si la boule du joueur s'arrete dedans, bonus Galets.
- **Dependances :** D1 (defis de mene — utilise le meme hook onMeneStart)
- **Effort :** M (30-60 min)

### Fichiers a lire
- `src/petanque/PetanqueEngine.js` (`onMeneStart`, `_scoreRound()`, positions terrain)
- `src/scenes/PetanqueScene.js`
- `src/utils/Constants.js` (GOLDEN_ZONE_*, TERRAIN_WIDTH, TERRAIN_HEIGHT)

### Fichiers a modifier
- `src/scenes/PetanqueScene.js`

### Specification

**1. Init dans `create()` :**
```js
this._goldenZone = null;      // { x, y, gfx }
this._goldenZoneActive = false;
```

**2. Dans le hook `onMeneStart`, apres le defi de mene :**
```js
// Zone doree (30% de chance, a partir de la mene 2, arcade only)
if (this.arcadeState && meneNumber >= 2 && Math.random() < 0.3) {
    this._spawnGoldenZone();
}
```

**3. Methode `_spawnGoldenZone()` :**
```js
_spawnGoldenZone() {
    this._clearGoldenZone();

    // Position aleatoire dans la moitie haute du terrain (pres du cochonnet)
    const tx = this.terrainX;
    const ty = this.terrainY;
    const margin = 30;
    const x = Phaser.Math.Between(tx + margin, tx + TERRAIN_WIDTH - margin);
    const y = Phaser.Math.Between(ty + margin, ty + TERRAIN_HEIGHT / 2);

    const gfx = this.add.graphics().setDepth(5); // sous les boules
    gfx.fillStyle(GOLDEN_ZONE_COLOR, GOLDEN_ZONE_ALPHA);
    gfx.fillCircle(x, y, GOLDEN_ZONE_RADIUS);
    gfx.lineStyle(1, GOLDEN_ZONE_COLOR, 0.5);
    gfx.strokeCircle(x, y, GOLDEN_ZONE_RADIUS);

    // Pulse subtil
    this.tweens.add({
        targets: gfx, alpha: GOLDEN_ZONE_ALPHA * 0.5,
        duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });

    this._goldenZone = { x, y, gfx };
    this._goldenZoneActive = true;
}
```

**4. Verification dans le hook `onScore` (quand la mene se termine) :**
```js
// Golden zone check
if (this._goldenZoneActive && this._goldenZone) {
    const gz = this._goldenZone;
    const playerBalls = this.engine.getTeamBallsAlive('player');
    for (const ball of playerBalls) {
        const dx = ball.x - gz.x;
        const dy = ball.y - gz.y;
        if (Math.sqrt(dx * dx + dy * dy) <= GOLDEN_ZONE_RADIUS) {
            addGalets(GOLDEN_ZONE_REWARD);
            // Flash dore
            this._showShotLabel({ x: gz.x, y: gz.y },
                I18n.t('arcade.golden_zone_bonus', { galets: GOLDEN_ZONE_REWARD }),
                '#FFD700', 14);
            break;
        }
    }
    this._clearGoldenZone();
}
```

**5. `_clearGoldenZone()` et cleanup dans `_shutdown()`.**

### Tests
- Fichier : `tests/unit/golden-zone.test.js`
- Tester la detection : boule a distance < GOLDEN_ZONE_RADIUS du centre → bonus
- Tester la detection : boule hors zone → pas de bonus

### Valide quand
- ~30% des menes (a partir de la 2e) en arcade ont un cercle dore sur le terrain
- Si une boule du joueur est dans le cercle a la fin de la mene, "+5 Galets" apparait
- Le cercle disparait a chaque fin de mene

---

## Tache G1 — Ambiance progressive (crowd escalade par round)

- **Objectif :** Augmenter le volume de la foule et la probabilite des reactions selon le round arcade (1→5).
- **Dependances :** A1 (CROWD_INTENSITY_BY_ROUND) — placee en Vague 2 car independante des autres features V2
- **Effort :** S (< 30 min)

### Fichiers a lire
- `src/utils/SoundManager.js` (`startCrowdAmbiance()`, gain 0.04 actuel)
- `src/scenes/PetanqueScene.js` (`startCrowdAmbiance()`, `_animateReaction()`)
- `src/utils/Constants.js` (CROWD_INTENSITY_BY_ROUND, CROWD_PROBABILITY)

### Fichiers a modifier
- `src/utils/SoundManager.js`
- `src/scenes/PetanqueScene.js`

### Specification

**1. SoundManager — Ajouter un parametre `intensity` a `startCrowdAmbiance()` :**

Modifier la signature :
```js
export function startCrowdAmbiance(intensity = 0.04) {
```

Et remplacer le `0.04` hardcode dans le gainNode par `_effectiveVol(intensity)`.

**2. PetanqueScene — Passer l'intensite selon le round arcade :**

Dans `create()`, remplacer `startCrowdAmbiance();` par :
```js
const crowdIntensity = this.arcadeRound
    ? (CROWD_INTENSITY_BY_ROUND[this.arcadeRound - 1] || 0.04)
    : 0.04;
startCrowdAmbiance(crowdIntensity);
```

**3. PetanqueScene — Augmenter la probabilite de reaction crowd selon le round :**

Dans `_animateReaction()`, remplacer `if (Math.random() < 0.6)` par :
```js
const crowdProb = this.arcadeRound
    ? Math.min(0.9, 0.5 + this.arcadeRound * 0.08)
    : CROWD_PROBABILITY;
if (Math.random() < crowdProb) {
```

### Tests
- Fichier : `tests/unit/crowd-progressive.test.js`
- Tester que `CROWD_INTENSITY_BY_ROUND[0]` = 0.03 et `[4]` = 0.10
- Tester que la probabilite crowd au round 5 = min(0.9, 0.5 + 5*0.08) = 0.9

### Valide quand
- Au round 1, la foule est discrete (0.03)
- Au round 5, la foule est bruyante (0.10) et reagit 90% du temps
- En QuickPlay, le comportement est inchange (0.04, 60%)

---

## Tache C3 — Map polish (decorations + hover)

- **Objectif :** Ajouter les elements decoratifs (oliviers, vagues) et l'interaction hover sur les noeuds gagnes.
- **Dependances :** C2 (etoiles map)
- **Effort :** S (< 30 min)

### Fichiers a lire
- `src/scenes/ArcadeScene.js` (la map de C1 + etoiles de C2)

### Fichiers a modifier
- `src/scenes/ArcadeScene.js`

### Specification

**1. Methode `_drawMapDecorations()` appelee a la fin de `_showProgressScreen()` :**

```js
_drawMapDecorations() {
    const deco = this.add.graphics().setDepth(1);

    // Oliviers (cercles verts de tailles variees)
    const olives = [
        { x: 200, y: 125, s: 5 }, { x: 340, y: 80, s: 4 },
        { x: 480, y: 95, s: 6 }, { x: 620, y: 120, s: 4 },
    ];
    for (const o of olives) {
        deco.fillStyle(0x6B8E4E, 0.4);
        deco.fillCircle(o.x, o.y, o.s);
        deco.fillStyle(0x4A6B3A, 0.3);
        deco.fillCircle(o.x - 1, o.y + 1, o.s * 0.7);
    }

    // Vagues (cote gauche, sous la map)
    deco.lineStyle(1, 0x87CEEB, 0.25);
    for (let w = 0; w < 3; w++) {
        deco.beginPath();
        const baseY = 160 + w * 12;
        for (let x = 20; x < 110; x += 4) {
            const y = baseY + Math.sin(x * 0.08 + w) * 4;
            if (x === 20) deco.moveTo(x, y);
            else deco.lineTo(x, y);
        }
        deco.strokePath();
    }
}
```

**2. Hover sur noeuds gagnes — afficher score + etoiles :**

Dans la boucle de creation des noeuds (dans `_showProgressScreen()`), pour chaque noeud gagne, ajouter une zone interactive :

```js
if (result && result.won) {
    const zone = this.add.zone(nodeX, nodeY, 30, 30).setInteractive();
    zone.on('pointerover', () => {
        // Tooltip avec score
        if (this._mapTooltip) this._mapTooltip.destroy();
        this._mapTooltip = this.add.text(nodeX, nodeY - 30,
            `Score: ${result.score || '?'}`, {
                fontFamily: 'monospace', fontSize: '9px', color: '#F5E6D0',
                backgroundColor: '#3A2E28', padding: { x: 4, y: 2 }
            }).setOrigin(0.5).setDepth(60);
    });
    zone.on('pointerout', () => {
        if (this._mapTooltip) { this._mapTooltip.destroy(); this._mapTooltip = null; }
    });
}
```

**Note** : Il faudra enrichir `matchResults` pour stocker le score (actuellement juste `{ round, won }`). Ajouter `score` dans le `matchResults.push()` de `create()` :
```js
this.matchResults.push({ round: completedRound, won: true, score: this.lastMatchResult.score || null });
```
Et passer le score depuis ResultScene → ArcadeScene via `arcadeState.lastMatchResult.score`.

### Tests
- Test visuel (pas de test automatise pour le hover)

### Valide quand
- Les oliviers et vagues sont visibles sur la map
- Hover sur un noeud gagne montre un tooltip avec le score
- Le tooltip disparait quand on quitte le noeud

---

# RECAPITULATIF

| Tache | Groupe | Vague | Effort | Dependances | Fichiers modifies |
|-------|--------|-------|--------|-------------|-------------------|
| A1 | Data | 1 | S | - | Constants.js |
| A2 | Data | 1 | M | - | arcade.json |
| A3 | Data | 1 | S | - | fr.json, en.json |
| A4 | Data | 1 | M | - | characters.json |
| B1 | Feedback | 2 | M | A1 | PetanqueScene.js |
| B2 | Feedback | 2 | S | A1, A3 | PetanqueScene.js |
| C1 | Map | 2 | L | A1, A2, A3 | ArcadeScene.js |
| D1 | Defis | 2 | L | A1, A2, A3 | PetanqueScene.js, PetanqueEngine.js |
| D3 | Defis | 2 | M | C1, A1, A3 | ArcadeScene.js, PetanqueScene.js |
| E1 | Narration | 2 | M | A2, A3, A4 | ArcadeScene.js, PetanqueScene.js |
| G1 | Ambiance | 2 | S | A1 | SoundManager.js, PetanqueScene.js |
| B3 | Feedback | 3 | S | B1 | PetanqueAI.js |
| C2 | Map | 3 | S | C1 | ArcadeScene.js |
| D2 | Defis | 3 | M | D1 | PetanqueScene.js, ResultScene.js |
| E2 | Comment. | 3 | M | E1 | commentator.json, PetanqueScene.js |
| F1 | Economie | 3 | M | C1 | ArcadeScene.js |
| F2 | Economie | 4 | M | C2, F1 | ArcadeScene.js |
| F3 | Economie | 4 | M | D1 | PetanqueScene.js |
| C3 | Map | 4 | S | C2 | ArcadeScene.js |

**Totaux :** 19 taches — 6S + 9M + 2L
- Vague 1 : 4 taches paralleles (2S + 2M)
- Vague 2 : 7 taches paralleles (2S + 3M + 2L) — inclut G1 (deplacee) et D3 (nouvelle)
- Vague 3 : 5 taches paralleles (2S + 3M)
- Vague 4 : 3 taches paralleles (1S + 2M)

**Estimation** : ~4 vagues × temps de la plus longue tache = ~4 sessions de travail.

**Changements vs plan initial :**
- **+D3** : Soupape de defaite (retry match + consolation Galets) — Vague 2
- **G1 deplacee** : Vague 4 → Vague 2 (aucune dependance V3)
- **A1 enrichie** : constantes SHOP_EXPRESS_MIN_GALETS, DEFEAT_*, COMMENTATOR_COOLDOWN
- **A3 enrichie** : cles i18n defeat_*
- **B1 enrichie** : throttle momentum (eviter redraw inutile)
- **D1 enrichie** : tracking onlyRoulette dans matchStats
- **E2 enrichie** : sequenceur commentateur (_safeCommentatorSay + cooldown)
- **F1 fixee** : condition match_fanny implementee
- **F2 fixee** : gate budget SHOP_EXPRESS_MIN_GALETS + cleanup par references
- **MAP_STAR_SIZE** : 8 → 12px (lisibilite)

---

# REGLES POUR LES AGENTS

1. **LIRE CLAUDE.md** avant toute modification
2. **Pas de TypeScript** — JavaScript ES6 pur
3. **Pas de #000000** — utiliser #3A2E28 (ombre) ou #1A1510 (ombre profonde)
4. **Pas de valeurs hardcodees** — tout dans Constants.js ou les JSON data
5. **Pas de console.log** — supprimer avant de finir
6. **Phaser reutilise les scenes** — toujours reset les flags dans `init()`
7. **60 FPS obligatoire** — pas de boucle lourde, pas de recreate inutile
8. **Mobile** — boutons interactifs 56px minimum
9. **Tests** — ecrire les tests AVANT de considerer la tache terminee
10. **Build** — verifier `npm run build` sans erreur apres modification
