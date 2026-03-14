# 15 - Verification de Faisabilite : Sprint 3.5
> Recherche du 14 mars 2026. Audit du code existant pour valider chaque amelioration gameplay.

## Objectif
Verifier que chaque amelioration prevue au Sprint 3.5 est compatible avec le code actuel,
identifier les fichiers/methodes a modifier, et les risques potentiels.

---

## Verdict : TOUT EST FAISABLE sans rewrite

Chaque feature s'integre dans l'architecture existante avec des modifications ciblees.
Aucun changement de structure ou de framework n'est necessaire.

---

## 1. Controle du Loft

### Etat actuel du code
- `PetanqueEngine.throwBall()` (ligne 208-265) : 2 phases (vol tween + roulement physique)
- Valeurs hardcodees : `isTir ? arcHeight=-8 : arcHeight=-30`, `LANDING_FACTOR_POINT=0.65`, `LANDING_FACTOR_TIR=0.3`
- `_animateThrow()` (ligne 267-340) : tween Phaser, arc visuel, duration variable
- `AimingSystem.js` : systeme slingshot drag, deja a un choix POINTER/TIRER avant le drag

### Plan d'implementation
1. **Constants.js** : ajouter 4 presets loft (ROULETTE, DEMI_PORTEE, PLOMBEE, TIR)
2. **AimingSystem.js** : ajouter `this.loftMode`, UI 3 boutons apres selection POINTER, clavier 1/2/3
3. **PetanqueEngine.throwBall()** : recevoir loftPreset, remplacer hardcodes par preset values
4. **PetanqueEngine._animateThrow()** : recevoir loftPreset au lieu de `isTir` boolean
5. **PetanqueAI._throwBall()** : choisir loft selon personnalite + terrain

### Risques
- **Power mapping change** : roulette sur sable (friction 3.0 * rollEfficiency 1.4) = stop rapide. A playtester.
- **throwCochonnet()** doit etre mis a jour : passer un loft default ou null
- **IA power calculation** : `maxDist` multiplier (lignes 58 PetanqueAI) doit varier par loft

### UI : pourquoi des boutons et PAS l'axe vertical du drag
Le slingshot actuel utilise la direction 2D complete (horizontal + vertical) pour calculer l'angle.
Ajouter le loft sur l'axe vertical creerait un conflit : le joueur ne saurait pas si son drag vertical
change l'angle ou le loft. 3 boutons separses sont plus clairs et decouvrables.

---

## 2. Indicateur de Point Dynamique

### Etat actuel du code
- `_updateBestIndicator(anyMoving)` (PetanqueEngine ~ligne 550-575)
- `this._bestGfx` = `scene.add.graphics()`, depth 10
- Halo 1px stroke : vert (joueur) ou rouge (adversaire)
- **LIMITATION** : `if (anyMoving) return` = ne s'affiche que quand tout est arrete

### Plan d'implementation
1. Supprimer le `if (anyMoving) return` (1 ligne)
2. Ajouter tween pulsant `{ t: 0->1 }` (Sine.easeInOut, yoyo, repeat -1)
3. Dessiner halo pulsant : rayon + t*2, alpha 0.4 + t*0.4
4. Tracker `this._lastBestBallId`
5. Sur changement : ring expansif (Graphics, tween scale up + fade, 300ms)

### Risques
- Aucun risque technique. 6 distances euclidiennes par frame = negligeable.
- Le halo pendant le mouvement pourrait flickerer si 2 boules sont equidistantes. Mitigation : ajouter un hysteresis de 0.5px.

---

## 3. Lisibilite Strategique

### Distances boule-cochonnet
- **Fichiers** : nouveau Graphics `_distGfx` dans PetanqueEngine, depth 9
- **Pool texte** : 6 `scene.add.text()` pre-alloues (7px monospace + ombre)
- **Conversion** : `PIXELS_TO_METERS = 15 / TERRAIN_HEIGHT` = ~0.07 m/px
- **Quand** : seulement quand toutes les boules arretees (sinon trop de bruit)

### Score projete
- **Extraction** : `calculateProjectedScore()` depuis `_scoreMene()` (ligne 353-413)
  - `_scoreMene()` melange calcul + UI + state transitions
  - Extraire le calcul pur dans une methode separee, garder le reste
- **Affichage** : "+3" ou "+1" en petit (8px) a cote du score dans ScorePanel
- **Frequence** : chaque frame dans ScorePanel.update(), 18 distances = negligeable

### Avantage de boules
- `this.engine.remaining` deja tracked (decremente dans throwBall, reset dans startMene)
- Remplacer Unicode circles par Graphics filled circles avec couleur
- Ajouter "+N" quand ecart > 0

### Risques
- Le pool de 6 textes doit etre nettoye proprement en fin de mene et fin de partie
- `calculateProjectedScore()` peut retourner null si pas de boules vivantes : gerer le cas

---

## 4. Detection du Carreau

### Etat actuel des collisions
- `Ball.resolveCollision(a, b)` (Ball.js ligne 106-153) : methode statique, retourne boolean
- Appelee dans `PetanqueEngine.update()` lignes 526-532, boucle N^2
- Le retour boolean est **actuellement ignore**

### Plan d'implementation
1. Ajouter `this.lastThrownBall` dans throwBall()
2. Ajouter `this._pendingCarreauChecks = []`
3. Dans la boucle collision : si un des 2 est `lastThrownBall` ET collision, enregistrer la position originale de la cible
4. Dans `_afterStopCallback` : appeler `_checkCarreau()` AVANT les transitions
5. Seuil : `CARREAU_THRESHOLD = 8px`, cible deplacee > 16px
6. Celebration : hitstop, texte, particules, shake

### Risques
- **Collisions en chaine** : boule A frappe B qui frappe C. Seule la collision directe A-B doit compter
  - Mitigation : ne recorder que quand `lastThrownBall` est un des deux participants
- **Timing hitstop** : le hitstop doit se faire AVANT le reste de _afterStopCallback
  - Mettre un delai (scene.time.delayedCall) pour laisser la celebration jouer
- **Boule sort du terrain apres carreau** : verifier carreau AVANT le bounds check

---

## 5. Personnalites IA

### Etat actuel de PetanqueAI.js (119 lignes)
- `_chooseTarget()` : 25 lignes, if/else simple
  - Check `config.canShoot`, threshold de distance, c'est tout
- `_throwBall()` : calcule angle ideal + noise, appelle engine.throwBall()
- `_noise(magnitude)` : uniform random [-mag, +mag]
- A acces a : engine.balls, engine.cochonnet, engine.remaining, engine.scores

### Extensibilite
Le code est extensible SANS rewrite :
- `_chooseTarget()` passe de 25 a ~60-80 lignes avec les nouvelles branches de decision
- Ajouter un champ `personality` au config
- Ajouter `_chooseLoft(terrain)` (~20 lignes)
- Le reste de la classe ne change pas

### Nouvelles branches de decision dans _chooseTarget()
```
1. A-t-on le point ? -> comparer _getMinDistance des 2 equipes
2. Personnalite :
   - pointeur : pointer sauf desperation (20% si perd 2+ boules scoring)
   - tireur : tirer si pas le point (85% chance), pointer si derniere boule + a le point
   - stratege : evaluer avantage boules, cibler cochonnet si perd, optimal sinon
   - complet : toutes les branches, decision optimale
3. Pression score : si perd 5+ points -> plus agressif quelle que soit la personnalite
4. Variance : 15% chance de faire l'inverse de la tendance (anti-predictabilite)
```

### Tir au cochonnet (Ricardo)
- L'engine supporte DEJA les collisions boule-cochonnet et le deplacement
- Si cochonnet sort -> MENE_DEAD (gere)
- L'IA doit juste viser le cochonnet au lieu d'une boule adverse = changer la cible dans _chooseTarget

### Anti-predictabilite
- Marcel : 20% desperation shoot si perd de 2+ boules scoring
- Fanny : pointe si derniere boule + a le point (conservation)
- 15% variance globale par personnalite
- Comportement dynamique lie au score (aggressif si perd)

### Mapping npcs.json -> IA
Ajouter `"personality": "pointeur"` dans chaque NPC maitre/dresseur.
Dans PetanqueScene, passer le champ au constructeur PetanqueAI qui merge avec les constantes de precision.

---

## 6. Ligne de Prediction

### Extraction necessaire
- `computeThrowParams()` : extraire de throwBall() (lignes 229-251) comme methode statique
  - Input : angle, power, position, bounds, loftPreset, frictionMult
  - Output : { targetX, targetY, rollVx, rollVy }
  - throwBall() appelle cette methode en interne (refactor)
  - AimingSystem appelle la meme methode pendant le drag

### Simulation trajectoire
- `Ball.simulateTrajectory()` : methode statique, meme integration Euler que Ball.update()
- ~120 iterations de maths basiques, sample tous les 3 frames = ~40 points
- Performance : microseconds. Appeler chaque frame pendant le drag = OK

### Rendu
- `this._predictionGfx = scene.add.graphics().setDepth(49)`
- `.clear()` + 40 `fillCircle(x, y, 1)` avec alpha decroissant
- Nettoyer dans cancel() et onPointerUp()

### Risques
- Le refactor de computeThrowParams() est un prerequis pour le loft aussi
  - Faire la prediction EN PREMIER, puis le loft reutilise la meme extraction
- Ne pas predire les collisions (standard, comme dans les jeux de billard/bocce)

---

## Resume des fichiers impactes

| Fichier | Modifications |
|---------|---------------|
| `Constants.js` | +4 presets loft, +CARREAU_THRESHOLD, +PIXELS_TO_METERS, +PREDICTION_*, +AI_MARCEL/FANNY/RICARDO/MARIUS |
| `PetanqueEngine.js` | Extraire computeThrowParams(), modifier throwBall() pour loft, _updateBestIndicator temps reel, calculateProjectedScore(), carreau tracking + detection + celebration |
| `AimingSystem.js` | Loft selector UI (boutons), prediction Graphics, appel computeThrowParams + simulateTrajectory |
| `Ball.js` | +simulateTrajectory() statique |
| `PetanqueAI.js` | Recrire _chooseTarget() (~60-80 lignes), ajouter _chooseLoft(), personality config |
| `ScorePanel.js` | Score projete (+N), avantage boules Graphics, flash animation |
| `npcs.json` | +champ personality pour chaque maitre/dresseur |

**Aucun nouveau fichier necessaire.** Tout s'integre dans l'existant.
