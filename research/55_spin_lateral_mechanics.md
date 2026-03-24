# 55 — Spin Lateral : Specification Complete

> Date : 24 mars 2026
> Contexte : PLAN_PHASE3, AXE A, tache A5 — "Rendre le stat Effet utile au joueur"
> Prerequis : research/04c (audit physique), research/30 (techniques petanque), Ball.js (retro existant)
> Fichiers impactes : Ball.js, AimingSystem.js, Constants.js, PetanqueEngine.js, PetanqueAI.js

---

## 1. PHYSIQUE REELLE DU SPIN LATERAL EN PETANQUE

En petanque reelle, le spin lateral s'obtient en lachant la boule sur le cote interne ou externe de la main. Le poignet imprime une rotation laterale a la boule au moment du lacher.

**Effet rentrant** (droitier : lacher cote interne, pouce vers le haut) : la boule devie vers l'interieur (vers le joueur) apres contact au sol. Utilisee pour contourner un obstacle en lancant a l'exterieur, la boule revient ensuite vers le cochonnet.

**Effet sortant** (droitier : lacher cote externe) : la boule devie vers l'exterieur (loin du joueur). Utilisee pour atteindre une zone protegee.

**Physique** : au contact du sol, la rotation laterale de la boule cree une force de friction laterale perpendiculaire a la direction de deplacement. Cette force est proportionnelle a `mu x N x sin(theta_spin)` (Cross, 2005). En pratique :
- La deviation laterale typique est de 10 a 30 cm sur 8 metres de roulement
- L'effet ne s'active qu'au contact du sol (pas pendant la phase aerienne)
- Le spin se "consomme" progressivement par friction : la rotation ralentit, la deviation diminue
- Le terrain amplifie ou attenue l'effet (sable accroche enormement, dalles glissent)

**Interaction avec le retro** : les deux spins peuvent coexister. Le retro (backspin) freine la boule longitudinalement, le lateral la devie transversalement. Un tireur expert combine les deux pour placer sa boule avec une trajectoire courbee qui s'arrete net.

**Limitations reelles** : seuls les joueurs experimentes maitrisent l'effet lateral. Les debutants jouent "nature" (sans spin). C'est pourquoi le stat "Effet" conditionne l'acces et l'intensite.

---

## 2. MODELE D'IMPLEMENTATION

### 2.1 Formule de la force laterale

A chaque frame, si le spin lateral est actif :

```
lateralForce = LATERAL_SPIN_FORCE * (effetStat / 10) * spinIntensity * terrainMultiplier
```

Ou :
- `LATERAL_SPIN_FORCE` = constante de base (voir section 3)
- `effetStat` = stat "Effet" du personnage (1-10, lu dans characters.json)
- `spinIntensity` = intensite restante du spin (1.0 au debut, decroit lineairement vers 0)
- `terrainMultiplier` = facteur du terrain courant (voir section 6)

### 2.2 Direction de la force

La force est appliquee **perpendiculairement** au vecteur vitesse de la boule :

```javascript
// Vecteur perpendiculaire a la direction de deplacement
const perpX = -vy / speed;  // composante X du vecteur perpendiculaire
const perpY =  vx / speed;  // composante Y du vecteur perpendiculaire

// Application
vx += perpX * lateralForce * spinDirection * cappedDt * 60;
vy += perpY * lateralForce * spinDirection * cappedDt * 60;
```

Ou `spinDirection` = -1 (gauche) ou +1 (droite).

Cette approche fait courber la trajectoire de maniere naturelle : la deviation est faible quand la boule va vite (force petite par rapport a l'inertie) et plus prononcee quand elle ralentit (la force laterale domine).

### 2.3 Decroissance du spin

Le spin se consomme **lineairement** sur `LATERAL_SPIN_FRAMES` frames :

```javascript
this._lateralFrames--;
this._lateralIntensity = Math.max(0, this._lateralFrames / LATERAL_SPIN_FRAMES);
```

A `_lateralFrames = 0`, le spin est eteint : `_lateralIntensity = 0`, plus aucune force laterale.

**Pourquoi lineaire et pas exponentiel ?** La decroissance lineaire est plus lisible pour le joueur : la courbe est reguliere et previsible. Une decroissance exponentielle donnerait un effet "brutal au debut, invisible ensuite" qui est frustrant a anticiper. Le modele lineaire est aussi plus simple a tester et a equilibrer.

### 2.4 Modele de phase : actif uniquement apres atterrissage

Le spin lateral ne s'applique **pas** pendant la phase de vol (tween d'animation). Il est active par `PetanqueEngine` au moment de l'atterrissage, exactement comme `activateRetro()` :

```javascript
// PetanqueEngine.js — dans _onBallLanded() ou equivalent
if (throwMeta.lateralSpin !== 0) {
    ball.activateLateralSpin(
        throwMeta.lateralSpin,         // -1 ou +1
        throwMeta.effetStat,           // 1-10
        this._currentTerrain.type      // 'terre', 'herbe', etc.
    );
}
```

**Pendant le vol**, le spin n'a pas d'effet visible. C'est coherent avec la physique reelle (le spin ne devie la boule qu'au contact du sol) et evite des interactions complexes avec le tween d'animation aerienne.

### 2.5 Interaction avec le retro existant

Les deux systemes sont **independants et cumulables** :

| Systeme | Effet sur la vitesse | Axe |
|---------|---------------------|-----|
| Retro (backspin) | Augmente la friction → freine la boule | Longitudinal (dans la direction du deplacement) |
| Lateral spin | Ajoute une force perpendiculaire → devie la boule | Transversal (perpendiculaire au deplacement) |

Ils n'interferent pas entre eux dans le code :
1. Le retro modifie `retroMult` qui affecte la deceleration par friction (deja implemente)
2. Le lateral ajoute une force perpendiculaire apres la friction (nouveau code)
3. L'ordre dans `Ball.update()` est : friction (avec retro) → lateral spin → position update

**Cas combine typique** : un joueur lance en plombee avec retro + lateral gauche. La boule atterrit, freine fort (retro phase 1), et courbe vers la gauche. Resultat : une trajectoire en courbe qui s'arrete rapidement, ideale pour contourner un obstacle et se coller au cochonnet.

### 2.6 Ordre d'execution dans Ball.update()

Position dans la boucle de mise a jour (ordre critique) :

```
1. Slope (gravity component)          — existant
2. Dynamic friction zones              — existant
3. Speed calculation                   — existant
4. Retro (backspin) friction modifier  — existant (phase 1/2)
5. Friction deceleration               — existant
6. ** LATERAL SPIN ** (force perp.)    — NOUVEAU
7. Position update (x += vx * dt * 60) — existant
8. Wall rebounds                        — existant
9. Draw                                 — existant
```

Le lateral spin est place APRES la friction pour que la force laterale ne soit pas immediatement annulee par la deceleration. Si on le placait avant, la friction reduirait la composante laterale ajoutee. L'ordre ci-dessus permet a la deviation de s'accumuler frame par frame de maniere visible.

---

## 3. CONSTANTES A AJOUTER

Toutes les valeurs vont dans `src/utils/Constants.js` (source unique, regle CLAUDE.md).

```javascript
// --- Spin lateral (effet gauche/droite) ---
// Force = LATERAL_SPIN_FORCE * (effetStat / 10) * spinIntensity * terrainMult
export const LATERAL_SPIN_FORCE = 0.045;
export const LATERAL_SPIN_FRAMES = 25;
export const LATERAL_SPIN_MIN_SPEED = 0.5;
export const LATERAL_SPIN_MIN_EFFET = 4;

export const LATERAL_SPIN_TERRAIN_MULT = {
    terre:  1.0,
    herbe:  1.3,
    sable:  1.8,
    dalles: 0.3
};
```

### Justification des valeurs

**LATERAL_SPIN_FORCE = 0.045**

Le document 04c proposait 0.06, mais nos tests mentaux suggerent que c'est trop fort. Avec `effetStat = 10` et `terrainMult = 1.0` :
- Force max par frame = 0.045 * (10/10) * 1.0 = 0.045
- Sur 25 frames avec decroissance lineaire : deviation totale = 0.045 * sum(25/25, 24/25, ..., 1/25) * dt * 60
- Approximation : 0.045 * 13 * (1/60) * 60 = ~0.585 px/frame en moyenne sur le terrain
- Deviation totale estimee : ~14.6 px pour effet 10 sur terre

Cela donne des deviations par stat :

| Stat Effet | Deviation sur terre (px) | Deviation reelle equivalente (cm) |
|-----------|--------------------------|-----------------------------------|
| 4 (min)   | ~5.8 px                  | ~10 cm                            |
| 6         | ~8.8 px                  | ~16 cm                            |
| 8         | ~11.7 px                 | ~21 cm                            |
| 10 (max)  | ~14.6 px                 | ~26 cm                            |

En comparaison, le terrain fait 180 px de large. Une deviation de 15 px = ~8% de la largeur du terrain. C'est visible et significatif sans etre excessif.

**LATERAL_SPIN_FRAMES = 25**

~417 ms a 60 fps. Le retro utilise RETRO_PHASE1_FRAMES = 30 + RETRO_PHASE2_FRAMES = 18 = 48 frames total. Le lateral est plus court car :
- Le spin lateral se consomme plus vite que le backspin (moins d'inertie dans l'axe lateral)
- 25 frames = assez long pour que la courbe soit visible, assez court pour que la boule ne derive pas indefiniment
- Correspond au temps de roulement typique d'une demi-portee (la boule roule ~0.5s apres atterrissage)

**LATERAL_SPIN_MIN_SPEED = 0.5**

En dessous de 0.5 px/frame, la boule est presque arretee. Appliquer un spin lateral a ce stade causerait un comportement bizarre (la boule "tourne sur elle-meme" au lieu de courber). Coherent avec SPEED_THRESHOLD = 0.3 (on arrete le spin un peu avant l'arret complet).

**LATERAL_SPIN_MIN_EFFET = 4**

Le stat Effet va de 2 (Papi Rene) a 10 (Rizzi). Mettre le seuil a 4 signifie que seuls les personnages avec un minimum de technique d'effet peuvent l'utiliser :
- **Bloques** (effet < 4) : Rookie (3), La Choupe (3)
- **Debloques** (effet >= 4) : Papi Rene (4), Robineau (5), Mamie Josette (6), Suchaud (7), Foyot (8), Fazzino (8), Rocher (8), Sofia (8), Ley (9), Rizzi (10)

Le Rookie et La Choupe jouent "nature" (pas de spin lateral) — coherent avec leurs descriptions (debutant / bourrin). Le seuil a 4 laisse 10/12 personnages y acceder, dont le Rookie s'il monte son stat Effet a 4+.

**LATERAL_SPIN_TERRAIN_MULT**

| Terrain | Mult | Justification |
|---------|------|---------------|
| terre   | 1.0  | Baseline. Surface standard de petanque. |
| herbe   | 1.3  | L'herbe accroche la boule → spin lateral amplifie de 30%. |
| sable   | 1.8  | Le sable mord dans la boule → effet tres prononce (quasi 2x). Coherent avec RETRO_TERRAIN_EFF.sable = 2.0. |
| dalles  | 0.3  | Surface lisse, la boule glisse → tres peu d'effet lateral. Coherent avec RETRO_TERRAIN_EFF.dalles = 0.6 (le lateral est encore plus reduit car il n'y a pas d'accroche). |

Ces multiplicateurs sont alignes avec les RETRO_TERRAIN_EFF existants dans Constants.js, avec le meme ratio relatif entre terrains (sable > herbe > terre > dalles).

---

## 4. SPECIFICATION UI

### 4.1 Toggle [E] : cycle gauche / droite / off

Le comportement est un cycle a 3 etats :

```
[E] presse 1x → Effet Gauche actif (spinDirection = -1)
[E] presse 2x → Effet Droite actif (spinDirection = +1)
[E] presse 3x → Effet OFF (spinDirection = 0)
```

**Condition d'affichage** : le toggle [E] n'apparait que si :
1. Le stat Effet du personnage actif >= LATERAL_SPIN_MIN_EFFET (4)
2. Le loft preset selectionne a `retroAllowed: true` (demi-portee, plombee, tir, tir devant)
3. Ce n'est PAS une roulette (la boule roule au sol des le debut, pas d'atterrissage = pas de spin lateral significatif)

**Pourquoi [E] ?** La touche [R] est deja prise par le retro toggle. [E] est a cote de [R] sur un clavier QWERTY, formant un binome naturel : [R] Retro, [E] Effet. [Q] serait aussi possible mais reserve pour un eventuel ciblage (PLAN_PHASE3.A3 utilise [B] pour cibler le cochonnet).

### 4.2 Indicateur visuel pendant la visee

**Position** : en dessous du toggle retro existant (stack vertical a droite de l'ecran).

**Apparence (3 etats)** :

```
OFF :     [E] Effet         — texte gris (#9E9E8E), pas d'icone
GAUCHE :  [E] ← Gauche      — texte lavande (#9B7BB8), fleche gauche
DROITE :  [E] Droite →      — texte lavande (#9B7BB8), fleche droite
```

- La couleur lavande (#9B7BB8) est la couleur de STAT_EFFET dans la palette (COLORS.LAVANDE)
- Le label utilise FONT_PIXEL a UI.HINT_SIZE ('10px'), meme style que le retro toggle

### 4.3 Fleche de visee courbee

Quand le spin lateral est actif, la fleche de prediction de trajectoire (les dots) se courbe pour indiquer visuellement la deviation attendue :

```javascript
// Dans AimingSystem._drawPrediction() ou _updateArrow()
// Chaque dot de prediction est decale lateralement selon la courbe
const curveAmount = this.lateralSpin * 0.10 * (this._effetStat / 10);
// Le decalage augmente quadratiquement avec la distance
for (let i = 0; i < dots.length; i++) {
    const t = i / dots.length;  // 0..1
    const lateralOffset = curveAmount * t * t * 80;
    // Appliquer le decalage perpendiculairement a la direction de la fleche
}
```

La courbe est approximative (elle ne simule pas la physique exacte) — c'est volontaire. Le joueur doit sentir la direction de la courbe sans avoir une prediction parfaite. L'incertitude fait partie du skill.

### 4.4 Indicateur de puissance d'effet

Optionnel (Phase 2 polish) : afficher sous le toggle [E] une jauge de 1 a 5 points representant l'intensite de l'effet du personnage :

```
Effet 4  :  ● ○ ○ ○ ○
Effet 6  :  ● ● ● ○ ○
Effet 8  :  ● ● ● ● ○
Effet 10 :  ● ● ● ● ●
```

Mapping : `points = Math.ceil((effetStat - 3) / 1.4)` (4→1, 6→3, 8→4, 10→5).

---

## 5. UTILISATION PAR L'IA

### 5.1 Conditions d'utilisation

L'IA utilise le spin lateral uniquement si toutes les conditions sont remplies :

```javascript
const canUseLateral = (
    charStats.effet >= LATERAL_SPIN_MIN_EFFET &&  // stat suffisant
    !loftPreset.isTir &&                           // pas en mode tir (tir au fer, tir devant)
    loftPreset.retroAllowed                        // pas en roulette
);
```

**Pourquoi pas en tir ?** Le spin lateral en tir deplace le point d'impact. Comme la precision du tir est deja le facteur critique, ajouter une deviation laterale volontaire est contre-productif. En realite, les tireurs jouent quasi-exclusivement "nature".

### 5.2 Logique de decision

```javascript
_chooseLateralSpin(loftPreset, targetAngle, cochonnetPos, obstacles) {
    if (!canUseLateral) return 0;

    const effetStat = this._charStats.effet;

    // Probabilite d'utiliser un effet lateral = (effet - 3) * 10%
    // Effet 4 = 10%, Effet 7 = 40%, Effet 10 = 70%
    const spinProbability = (effetStat - 3) * 0.10;
    if (Math.random() > spinProbability) return 0;

    // Direction : l'IA choisit le cote qui rapproche la trajectoire courbee du cochonnet
    // Calcul simplifie : si le cochonnet est a gauche de la ligne droite → spin gauche
    const straightEndX = targetX + Math.cos(targetAngle) * distance;
    const crossProduct = (cochonnetPos.x - straightEndX);
    const direction = crossProduct > 0 ? 1 : -1;

    // Intensite : toujours max pour l'IA (elle joue optimalement)
    return direction;
}
```

### 5.3 Archetypes et spin lateral

| Archetype | Comportement spin lateral |
|-----------|---------------------------|
| **pointeur** | Utilise souvent (contourner des boules, viser des angles impossibles en ligne droite) |
| **tireur** | N'utilise jamais (tir = pas de lateral, pointage rare et sans finesse) |
| **equilibre** | Utilise parfois (adaptatif selon la situation) |
| **complet** | Utilise intelligemment (combine retro + lateral pour des placements chirurgicaux) |

### 5.4 Personnages specifiques

Rizzi (effet 10) a l'ability "Eleganza" qui double l'effet de courbe. Quand Rizzi active Eleganza :
- `effetStat` effectif = min(10, 10 * 2) = 10 (cappe a 10 pour la formule)
- MAIS `LATERAL_SPIN_FORCE` est doublee → deviation ~29 px au lieu de ~14.6 px
- C'est la seule maniere d'obtenir une courbe aussi prononcee

Sofia (effet 8, pointeuse) combine son ability "Strategie" (voir la trajectoire 3s) avec le spin lateral : elle voit exactement ou la courbe va mener. Synergie forte.

---

## 6. MODIFICATEURS PAR TERRAIN

### 6.1 Tableau complet

| Terrain | LATERAL_SPIN_TERRAIN_MULT | RETRO_TERRAIN_EFF (ref) | Rationale |
|---------|--------------------------|------------------------|-----------|
| terre   | 1.0                      | 1.0                    | Baseline. Surface gravillonnee standard. |
| herbe   | 1.3                      | 1.3                    | L'herbe humide et dense accroche la boule. Le spin lateral est amplifie car la friction laterale est plus forte. |
| sable   | 1.8                      | 2.0                    | Le sable s'enfonce sous la boule, creant une resistance maximale. Le spin lateral est tres prononce. Attention : le sable freine aussi plus vite (TERRAIN_FRICTION.sable = 3.0), donc la boule s'arrete avant d'avoir parcouru toute la courbe. |
| dalles  | 0.3                      | 0.6                    | Surface lisse et dure. La boule glisse sans accrocher. Le spin lateral a tres peu d'effet. Sur dalles, il vaut mieux ne pas utiliser d'effet et jouer nature. |

### 6.2 Interaction friction x spin

Le terrain affecte le spin lateral de deux manieres simultanees :
1. **LATERAL_SPIN_TERRAIN_MULT** : amplifie/reduit la force laterale par frame
2. **TERRAIN_FRICTION** : accelere/reduit l'arret de la boule (= le spin a plus ou moins de temps pour agir)

Resultats combines :

| Terrain | Force laterale | Temps de roulement | Deviation effective |
|---------|---------------|-------------------|---------------------|
| terre   | Normale       | Normal            | ~15 px (effet 10)   |
| herbe   | +30%          | -44% (friction 1.8x) | ~11 px (force x temps) |
| sable   | +80%          | -67% (friction 3.0x) | ~9 px (force elevee mais arret rapide) |
| dalles  | -70%          | +43% (friction 0.7x) | ~6 px (force faible mais roule longtemps) |

**Observation** : le sable a le multiplicateur le plus haut mais la friction la plus forte. La deviation effective est modeste car la boule s'arrete vite. Le terre est le meilleur terrain pour exploiter le spin lateral. L'herbe est un bon compromis. Les dalles sont defavorables.

### 6.3 Zones a friction variable (terrain Parc)

Si la boule traverse une zone de friction differente (exemple : patch d'herbe sur terrain terre dans le Parc), la `LATERAL_SPIN_TERRAIN_MULT` change en temps reel. Le code doit utiliser le type de terrain **de la zone actuelle**, pas le type global :

```javascript
// Dans Ball.update(), AVANT le calcul du spin lateral
let lateralTerrainMult = LATERAL_SPIN_TERRAIN_MULT[this._terrainType] || 1.0;
if (terrain?.zones?.length && this._bounds) {
    // Meme logique que la friction dynamique existante (lignes 204-216 de Ball.js)
    // Utiliser le type de la zone si la boule est dedans
}
```

---

## 7. CAS LIMITES (EDGE CASES)

### 7.1 Spin lateral + collision murale (terrain Docks)

**Situation** : la boule courbe vers un mur lateral (terrain Docks avec `walls: true`).

**Comportement** : le wall rebound existant (Ball.js lignes 296-318) inverse la composante de vitesse perpendiculaire au mur. Le spin lateral continue de s'appliquer apres le rebond.

**Resultat** : apres le rebond, le spin pousse toujours dans la meme direction absolue. Si la boule rebondit sur un mur gauche alors qu'elle avait un spin gauche, elle va maintenant aller vers la droite (rebond) avec le spin qui la pousse encore vers la gauche (ralentissement de la composante laterale). C'est physiquement coherent : le spin ne change pas de direction au rebond (seule la vitesse lineaire est inversee).

**Pas de code supplementaire necessaire** : la separation spin/collision est architecturalement saine (validee dans 04c, annexe C.6). Le spin agit sur la vitesse via `update()`, la collision agit separement via `resolveCollision()`.

### 7.2 Spin lateral + collision boule

**Situation** : la boule courbee frappe une autre boule.

**Comportement** : `Ball.resolveCollision()` ne connait pas le spin — il utilise uniquement les vitesses instantanees (vx, vy). Apres la collision, les vitesses sont recalculees par conservation d'impulsion. Le spin residuel continue de s'appliquer via `update()`.

**Resultat** : si le spin est presque epuise au moment de la collision, l'effet post-collision est negligeable. Si le spin est encore fort (collision precoce), la boule continue de courber apres le rebond. C'est correctement gere sans modification.

### 7.3 Spin lateral + pente (slope zones)

**Situation** : la boule courbe sur une zone de pente (terrain avec slope_zones).

**Comportement** : la pente ajoute une force gravitationnelle dans une direction fixe (up, down, left, right). Le spin lateral ajoute une force perpendiculaire a la vitesse. Les deux forces se combinent vectoriellement.

**Resultat** : la trajectoire est un melange de courbe (spin) et de derive (pente). Si la pente est dans la meme direction que le spin, la deviation est amplifiee. Si elle est opposee, elles se compensent partiellement.

**Pas de code supplementaire necessaire** : les deux forces s'ajoutent lineairement dans `update()`. L'ordre (pente d'abord, spin apres) est correct.

### 7.4 Spin lateral + retro simultane

**Situation** : le joueur active retro ET spin lateral (les deux sont permis simultanement).

**Comportement** :
- Le retro augmente la friction (la boule ralentit plus vite)
- Le spin lateral applique une force laterale qui depend de la vitesse (perpendiculaire a vx/vy)
- Comme la boule ralentit plus vite avec retro, le spin a moins de temps pour agir

**Resultat** : la courbe est plus serree mais plus courte. La boule fait un virage brusque puis s'arrete rapidement. C'est la combinaison "expert" : placement tres precis en courbe serree.

Deviation estimee avec retro actif (effet 10, terre) : ~8 px au lieu de ~15 px. La boule parcourt ~60% de la distance avant de s'arreter.

### 7.5 Spin lateral + vitesse tres faible

**Situation** : la boule ralentit sous LATERAL_SPIN_MIN_SPEED (0.5) pendant que le spin est encore actif.

**Comportement** : le spin est desactive quand `speed < LATERAL_SPIN_MIN_SPEED`. La boule continue de ralentir normalement par friction.

**Pourquoi ?** En dessous de 0.5 px/frame, la direction de la vitesse n'est plus fiable (erreurs d'arrondi). La force perpendiculaire pourrait faire "tourner" la boule sur elle-meme au lieu de la courber. Le seuil coupe le spin proprement.

### 7.6 Spin lateral en roulette

**Situation** : le joueur tente d'activer le spin lateral avec le loft Roulette.

**Comportement** : le toggle [E] n'apparait pas. Le spin lateral n'est pas disponible en roulette.

**Pourquoi ?** La roulette ne comporte presque pas de phase aerienne (`landingFactor: 0.15`). La boule roule au sol des le debut. En realite, le spin lateral necessite un atterrissage (le contact sol initie la friction laterale). Une boule qui roule depuis le debut a deja consomme son spin. De plus, la roulette a `retroAllowed: false`, ce qui sert de gate pour bloquer aussi le lateral.

### 7.7 Boule morte (hors terrain) pendant le spin

**Situation** : la boule sort du terrain pendant que le spin courbe la trajectoire.

**Comportement** : `checkOutOfBounds()` detecte la sortie. La boule est marquee morte (`kill()`). Le spin est irrelevant car `update()` ne s'execute plus sur une boule morte (`if (!this.isAlive || !this.isMoving) return`).

---

## 8. SPECIFICATIONS DE TESTS

Six cas de test specifiques pour Vitest, dans `tests/Ball.test.js` ou un nouveau fichier `tests/LateralSpin.test.js`.

### Test 1 : Deviation laterale basique (effet 10, terre, spin droite)

```javascript
test('lateral spin deviates ball to the right on terre', () => {
    const ball = new Ball(mockScene, 100, 400, {
        frictionMult: TERRAIN_FRICTION.terre,
        terrain: { type: 'terre' }
    });
    ball.launch(0, -5);  // Lancer vers le haut (direction Y negatif)
    ball.activateLateralSpin(+1, 10, 'terre');  // spin droite, effet 10

    const startX = ball.x;
    for (let i = 0; i < 60; i++) ball.update(16.67);  // 1 seconde

    // La boule doit avoir devie vers la droite (X augmente)
    expect(ball.x).toBeGreaterThan(startX + 8);   // au moins 8px de deviation
    expect(ball.x).toBeLessThan(startX + 25);     // pas plus de 25px
});
```

**Valeurs attendues** : deviation de 10-20 px vers la droite apres 1 seconde sur terre avec effet 10.

### Test 2 : Pas de spin lateral si effet < 4

```javascript
test('lateral spin has no effect when effetStat < LATERAL_SPIN_MIN_EFFET', () => {
    const ball = new Ball(mockScene, 100, 400, {
        frictionMult: TERRAIN_FRICTION.terre,
        terrain: { type: 'terre' }
    });
    ball.launch(0, -5);
    ball.activateLateralSpin(+1, 3, 'terre');  // effet 3 = sous le seuil

    const startX = ball.x;
    for (let i = 0; i < 60; i++) ball.update(16.67);

    // Aucune deviation laterale
    expect(Math.abs(ball.x - startX)).toBeLessThan(1);
});
```

**Valeurs attendues** : deviation < 1px (quasi-nulle, seulement du bruit d'arrondi).

### Test 3 : Le terrain sable amplifie, les dalles reduisent

```javascript
test('sand amplifies lateral spin, dalles reduce it', () => {
    const launchBall = (terrainType, frictionMult) => {
        const ball = new Ball(mockScene, 100, 400, {
            frictionMult,
            terrain: { type: terrainType }
        });
        ball.launch(0, -5);
        ball.activateLateralSpin(+1, 8, terrainType);
        const startX = ball.x;
        for (let i = 0; i < 40; i++) ball.update(16.67);
        return ball.x - startX;
    };

    const deviationTerre  = launchBall('terre', TERRAIN_FRICTION.terre);
    const deviationSable  = launchBall('sable', TERRAIN_FRICTION.sable);
    const deviationDalles = launchBall('dalles', TERRAIN_FRICTION.dalles);

    // Sable a un mult plus haut (1.8) mais friction plus forte (3.0)
    // En 40 frames, le sable devrait quand meme devier plus PAR FRAME
    // mais la boule s'arrete plus vite donc la deviation totale est ambigue
    // On verifie juste l'ordre relatif de la force par frame
    expect(deviationSable).toBeGreaterThan(0);  // spin fonctionne sur sable
    expect(deviationDalles).toBeLessThan(deviationTerre);  // dalles < terre
    expect(deviationDalles).toBeGreaterThan(0);  // mais pas zero
});
```

### Test 4 : Le spin se consomme apres LATERAL_SPIN_FRAMES

```javascript
test('lateral spin intensity reaches zero after LATERAL_SPIN_FRAMES', () => {
    const ball = new Ball(mockScene, 100, 400, {
        frictionMult: TERRAIN_FRICTION.terre,
        terrain: { type: 'terre' }
    });
    ball.launch(0, -8);  // vitesse elevee pour ne pas s'arreter
    ball.activateLateralSpin(+1, 10, 'terre');

    // Avancer exactement LATERAL_SPIN_FRAMES frames
    for (let i = 0; i < LATERAL_SPIN_FRAMES; i++) ball.update(16.67);

    // Le spin doit etre eteint
    expect(ball._lateralIntensity).toBeLessThanOrEqual(0);
    expect(ball._lateralFrames).toBeLessThanOrEqual(0);
});
```

### Test 5 : Spin lateral + retro simultane

```javascript
test('lateral spin and retro can be active simultaneously', () => {
    const ball = new Ball(mockScene, 100, 400, {
        frictionMult: TERRAIN_FRICTION.terre,
        terrain: { type: 'terre' }
    });
    ball.launch(0, -5);
    ball.activateRetro(0.8, 'terre');             // retro fort
    ball.activateLateralSpin(+1, 8, 'terre');     // spin droite

    const startX = ball.x;
    const startY = ball.y;
    for (let i = 0; i < 30; i++) ball.update(16.67);

    // La boule doit avoir devie a droite (spin lateral)
    expect(ball.x).toBeGreaterThan(startX + 3);

    // La boule doit avoir parcouru MOINS de distance Y que sans retro
    // (le retro freine, donc elle s'arrete plus tot)
    const ballNoRetro = new Ball(mockScene, 100, 400, {
        frictionMult: TERRAIN_FRICTION.terre,
        terrain: { type: 'terre' }
    });
    ballNoRetro.launch(0, -5);
    ballNoRetro.activateLateralSpin(+1, 8, 'terre');
    for (let i = 0; i < 30; i++) ballNoRetro.update(16.67);

    // Ball with retro traveled less distance (higher Y = closer to start)
    expect(ball.y).toBeGreaterThan(ballNoRetro.y);
});
```

### Test 6 : Spin gauche devie dans la direction opposee au spin droite

```javascript
test('left spin deviates opposite to right spin', () => {
    const launchWithSpin = (direction) => {
        const ball = new Ball(mockScene, 100, 400, {
            frictionMult: TERRAIN_FRICTION.terre,
            terrain: { type: 'terre' }
        });
        ball.launch(0, -5);
        ball.activateLateralSpin(direction, 8, 'terre');
        for (let i = 0; i < 40; i++) ball.update(16.67);
        return ball.x;
    };

    const xRight = launchWithSpin(+1);
    const xLeft  = launchWithSpin(-1);

    // Spin droite → x augmente, spin gauche → x diminue
    expect(xRight).toBeGreaterThan(100);  // devie a droite
    expect(xLeft).toBeLessThan(100);       // devie a gauche

    // Les deviations doivent etre symetriques (meme amplitude, direction opposee)
    const devRight = xRight - 100;
    const devLeft  = 100 - xLeft;
    expect(Math.abs(devRight - devLeft)).toBeLessThan(1);  // symetrie a 1px pres
});
```

---

## ANNEXE A : CODE COMPLET Ball.js (MODIFICATIONS)

### A.1 Nouvelles proprietes dans le constructeur

```javascript
// Spin lateral
this._lateralSpin = 0;          // -1 (gauche), 0 (off), +1 (droite)
this._lateralIntensity = 0;     // 1.0 → 0.0 (decroit lineairement)
this._lateralFrames = 0;        // frames restantes
this._lateralEffet = 0;         // effetStat / 10 (cache)
this._lateralTerrainMult = 1.0; // cache du multiplicateur terrain
```

### A.2 Methode activateLateralSpin()

```javascript
activateLateralSpin(direction, effetStat, terrainType) {
    if (effetStat < LATERAL_SPIN_MIN_EFFET) return;
    this._lateralSpin = direction;  // -1 ou +1
    this._lateralIntensity = 1.0;
    this._lateralFrames = LATERAL_SPIN_FRAMES;
    this._lateralEffet = effetStat / 10;
    this._lateralTerrainMult = LATERAL_SPIN_TERRAIN_MULT[terrainType] ?? 1.0;
}
```

### A.3 Code dans update() (apres friction, avant position update)

```javascript
// --- Spin lateral : force perpendiculaire a la direction ---
if (this._lateralSpin !== 0 && this._lateralIntensity > 0 && speed > LATERAL_SPIN_MIN_SPEED) {
    const force = LATERAL_SPIN_FORCE * this._lateralEffet * this._lateralIntensity * this._lateralTerrainMult;
    const perpX = -this.vy / speed;
    const perpY = this.vx / speed;
    this.vx += perpX * force * this._lateralSpin * cappedDt * 60;
    this.vy += perpY * force * this._lateralSpin * cappedDt * 60;

    // Decroissance lineaire
    this._lateralFrames--;
    this._lateralIntensity = Math.max(0, this._lateralFrames / LATERAL_SPIN_FRAMES);
    if (this._lateralFrames <= 0) {
        this._lateralSpin = 0;
        this._lateralIntensity = 0;
    }
}
```

---

## ANNEXE B : RESUME DES STATS EFFET PAR PERSONNAGE

| Personnage | Effet | Spin lateral | Notes |
|-----------|-------|-------------|-------|
| Rookie | 3 (base) | NON (< 4) | Debloque si monte Effet a 4+ |
| La Choupe | 3 | NON (< 4) | Bourrin, joue nature |
| Papi Rene | 4 | OUI (minimal) | Deviation ~6 px sur terre |
| Robineau | 5 | OUI (faible) | Tireur, utilisera rarement |
| Mamie Josette | 6 | OUI (moyen) | Pointeuse, bon usage |
| Suchaud | 7 | OUI (bon) | Tireur precision, usage rare |
| Foyot | 8 | OUI (fort) | Showman, usage frequent |
| Fazzino | 8 | OUI (fort) | Stratege, usage calcule |
| Rocher | 8 | OUI (fort) | Prodige, usage adaptatif |
| Sofia | 8 | OUI (fort) | Pointeuse, synergie avec Strategie |
| Ley | 9 | OUI (tres fort) | Tireur, usage en pointage |
| Rizzi | 10 | OUI (max) | Roi du spin, ability Eleganza x2 |

---

## ANNEXE C : REFERENCES

- Cross, Rod (2005). "Bounce of a spinning ball near normal incidence." American Journal of Physics 73(10), pp. 914-920.
- research/30_techniques_petanque_exhaustif.md, sections 3.2 et 3.3 (Effet Lateral Rentrant/Sortant)
- research/04c_physique_audit_specifications.md, section 7 (Spin Lateral), section 9.4 (IA), annexe C.6 (collision interaction)
- PLAN_PHASE3.md, AXE A, tache A5
