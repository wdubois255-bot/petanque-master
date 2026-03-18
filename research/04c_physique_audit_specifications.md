# 04c — Physique Petanque : Audit Code & Specifications Avancees

> Date : 18 mars 2026 (rev. 1 — revue critique)
> Prerequis : research/04, research/25, research/30, research/31
> Code de reference : Ball.js, PetanqueEngine.js, AimingSystem.js, Constants.js, PetanqueAI.js

---

## AUDIT DU CODE ACTUEL

Avant de proposer des ameliorations, voici l'etat REEL du code (pas ce qu'on croit) :

### Ce qui MARCHE deja
- **Retro (backspin)** : `ball.retro` multiplie la friction via `RETRO_FRICTION_MULT = 2.5` (Ball.js:191)
- **Carreau** : detecte quand la boule tiree reste a <28px de la position originale de la cible (PetanqueEngine.js:911-928)
- **Recul** : detecte quand la boule tiree recule apres impact, amplifie 1.3-1.45x (PetanqueEngine.js:989-1009)
- **Palet** : detecte quand la boule tiree reste <60px du cochonnet apres un hit solide (PetanqueEngine.js:1012-1018)
- **Biberon** : detecte quand la boule pointee touche le cochonnet (PetanqueEngine.js:961-969)
- **Contre** : detecte quand un tir touche une boule alliee (PetanqueEngine.js:974-980)

### Ce qui est BANCAL
1. **Le recul** : conditions trop etroites (`throwerSpeed > 0.8 && < 5`), un tir puissant depasse 5 facilement → recul non detecte. L'amplification (×1.3-1.45) est arbitraire, pas derivee de la physique.
2. **Le palet** : mesure la distance au cochonnet (!!) au lieu de la distance au point d'impact. Un tir qui atterrit a 60px du cochonnet par hasard est "palet" meme si la cible n'a pas bouge.
3. **Le retro** : modele lineaire constant — la friction reste augmentee indefiniment. En realite le backspin se "consomme" (phase glissement → roulement normal).
4. **Le tir au fer** : `rollEfficiency: 16.0` est un hack. La boule est censee voler 98% puis rouler 2% a vitesse dementielle. Ca marche mais c'est fragile et non-intuitif.
5. **Pas de differentiation des collisions par intensite** : un tir puissant et un tap leger produisent le meme flash/shake.

### Ce qui MANQUE
- Micro-rebonds a l'atterrissage
- Tir devant et tir a la rafle
- Spin lateral (effet gauche/droite)
- Irregularites de terrain
- Casquette, ciseau, trou (resultats de tir)
- IA adaptee aux nouvelles mecaniques

---

## TABLE DES MATIERES

1. [Recul repare + resultats de tir complets](#1-recul-repare--resultats-de-tir-complets)
2. [Backspin avance (modele en 2 phases)](#2-backspin-avance)
3. [Micro-rebonds a l'atterrissage](#3-micro-rebonds-a-latterrissage)
4. [Irregularites terrain](#4-irregularites-terrain)
5. [Tir devant (tir rebond)](#5-tir-devant)
6. [Tir a la rafle](#6-tir-a-la-rafle)
7. [Spin lateral (effet)](#7-spin-lateral)
8. [Carreau avance](#8-carreau-avance)
9. [Integration IA](#9-integration-ia)
10. [Plan d'implementation revise](#10-plan-dimplementation)

---

## 1. RECUL REPARE + RESULTATS DE TIR COMPLETS

### 1.1 Probleme actuel du recul

Le code actuel (PetanqueEngine.js:989-1009) :

```javascript
// PROBLEMES :
// 1. throwerSpeed > 0.8 && < 5 : bande trop etroite
//    → Un tir puissant (PUI 10) produit une vitesse residuelle > 5 → recul non detecte
// 2. L'amplification (1 + reculPct * 3) = 1.30-1.45x est arbitraire
//    → Pas derive de la physique, juste un "feel hack"
// 3. Pas de distinction entre recul volontaire (backspin) et recul physique (COR)
```

### 1.2 Physique reelle du recul

Apres un tir au fer avec COR = 0.62 entre masses egales :
- **Boule tiree** : conserve `(1-e)/2 * v = 0.19 * v` de sa vitesse (19%)
- **Cible** : recoit `(1+e)/2 * v = 0.81 * v` (81%)
- La boule tiree recule **naturellement** de ~15 cm (5-6 px en jeu)
- Avec backspin : le recul est amplifie car le spin arriere "tire" la boule vers l'arriere
- Sans backspin : la boule glisse vers l'avant (carreau allonge) ou s'arrete (carreau sur place)

**Le recul n'est PAS un evenement special — c'est le comportement PAR DEFAUT apres un tir au fer.** Toute boule tiree recule un peu. Ce qui est special, c'est quand elle **ne recule PAS** (carreau sur place).

### 1.3 Implementation corrigee

```javascript
// === Remplacement de _detectShotResult dans PetanqueEngine.js ===

_detectShotResult() {
    if (!this.lastThrownBall || !this.lastThrownBall.isAlive) return;
    if (!this.cochonnet || !this.cochonnet.isAlive) return;

    const ball = this.lastThrownBall;
    const isTir = this.lastShotWasTir;
    const hitBalls = this._shotCollisions || [];

    // === POINTAGE : Biberon ===
    if (!isTir) {
        const distToCoch = ball.distanceTo(this.cochonnet);
        if (distToCoch <= ball.radius + this.cochonnet.radius + 2) {
            this._showShotLabel(ball, 'BIBERON !', '#FFD700', 14);
        }
        this._shotCollisions = [];
        return;
    }

    // === TIR : analyse complete ===
    if (hitBalls.length === 0) {
        // Tir rate : aucune collision
        this._showShotLabel(ball, '...', '#888888', 11);
        this._shotCollisions = [];
        return;
    }

    // Contre : touche une boule alliee
    const hitAllied = hitBalls.filter(b => b.team === ball.team && b.team !== 'cochonnet');
    if (hitAllied.length > 0) {
        this._showShotLabel(ball, 'Contre !', '#C44B3F', 13);
        this._shotCollisions = [];
        return;
    }

    // Ciseau : touche 2+ boules adverses
    const hitEnemy = hitBalls.filter(b => b.team !== ball.team && b.team !== 'cochonnet');
    if (hitEnemy.length >= 2) {
        this._showShotLabel(ball, 'CISEAU !!', '#FFD700', 16);
        // Celebration intermediaire (pas aussi forte que carreau)
        this.scene.cameras.main.shake(120, 0.005);
        this._spawnCollisionSparks(ball.x, ball.y);
        this._shotCollisions = [];
        return;
    }

    // Analyse du tir contre une seule cible
    if (hitEnemy.length === 1) {
        const target = hitEnemy[0];
        const targetSpeed = Math.sqrt(target.vx ** 2 + target.vy ** 2);
        const throwerSpeed = Math.sqrt(ball.vx ** 2 + ball.vy ** 2);

        // Casquette : la cible a a peine bouge (<5px de deplacement)
        if (targetSpeed < 0.5) {
            this._showShotLabel(ball, 'Casquette...', '#888888', 12);
            this._shotCollisions = [];
            return;
        }

        // Blesser : la cible a un peu bouge mais pas assez (<20px)
        if (targetSpeed < 1.5) {
            this._showShotLabel(ball, 'Blessee...', '#AA8866', 12);
            this._shotCollisions = [];
            return;
        }

        // Le carreau est deja detecte separement dans _checkCarreau()
        // Ici on detecte les resultats NON-carreau

        // Palet CORRIGE : boule tiree reste < 50px du POINT D'IMPACT (pas du cochonnet)
        const carreauCheck = this._pendingCarreauChecks?.[0];
        if (carreauCheck) {
            const dxFromImpact = ball.x - carreauCheck.targetOrigX;
            const dyFromImpact = ball.y - carreauCheck.targetOrigY;
            const distFromImpact = Math.sqrt(dxFromImpact * dxFromImpact + dyFromImpact * dyFromImpact);

            if (distFromImpact > CARREAU_THRESHOLD && distFromImpact < PALET_THRESHOLD) {
                this._showShotLabel(ball, 'Palet !', '#C0C0C0', 13);
                this._shotCollisions = [];
                return;
            }
        }

        // Recul CORRIGE : detection basee sur la direction, pas sur des seuils de vitesse
        if (throwerSpeed > 0.3 && carreauCheck) {
            const dx = ball.x - carreauCheck.targetOrigX;
            const dy = ball.y - carreauCheck.targetOrigY;
            // Projeter le deplacement du tireur sur l'axe du lancer
            const throwAngle = this._lastThrowAngle || 0;
            const projForward = dx * Math.cos(throwAngle) + dy * Math.sin(throwAngle);

            if (projForward < -3) {
                // La boule a recule par rapport a sa direction de lancer
                this._showShotLabel(ball, 'Recul', '#D4A574', 12);
                // PAS d'amplification de vitesse — le recul est naturel
                // Le backspin gere deja la deceleration
                this._shotCollisions = [];
                return;
            }
        }
    }

    this._shotCollisions = [];
}
```

### 1.4 Nouvelles constantes

```javascript
// === Constants.js ===
export const PALET_THRESHOLD = 50;          // Boule tiree < 50px du point d'impact
export const CASQUETTE_MAX_SPEED = 0.5;     // Cible bouge < 0.5 px/frame
export const BLESSER_MAX_SPEED = 1.5;       // Cible bouge < 1.5 px/frame
```

### 1.5 Suppression de l'amplification artificielle du recul

Le recul actuel **amplifie** la vitesse de la boule tiree (×1.3-1.45x). C'est un hack qui viole la conservation d'energie. En physique reelle, le recul est le comportement **naturel** de la collision (COR 0.62 → 19% d'energie conservee par le tireur).

**Solution** : supprimer l'amplification. Le recul existe deja naturellement grace a `Ball.resolveCollision()`. Il suffit de le **detecter** et de le **nommer**, pas de le forcer.

Si le recul parait trop faible visuellement, c'est parce que le backspin (retro) devrait l'amplifier naturellement — ce qui nous amene a la section suivante.

---

## 2. BACKSPIN AVANCE

### 2.1 Probleme du modele actuel

Le retro actuel (Ball.js:191) multiplie la friction par un facteur constant :
```javascript
const retroBoost = this.retro > 0 ? 1 + this.retro * RETRO_FRICTION_MULT : 1;
// RETRO_FRICTION_MULT = 2.5 → max 3.5x friction
```

**Problemes :**
1. La friction reste augmentee **indefiniment** — la boule ralentit trop a basse vitesse
2. Pas de phase de "glissement" (quand le spin est oppose au roulement)
3. Le backspin ne se "consomme" pas — il reste actif meme quand la boule s'arrete
4. Intensite max (×3.5 friction) est trop faible : en vrai, un backspin parfait arrete la boule quasi-net

### 2.2 Physique reelle

Le backspin fonctionne en 3 phases :

**Phase 1 — Glissement (0-500ms)** : La boule atterrit avec une rotation arriere. La friction entre boule et sol est **maximale** car le point de contact glisse (friction cinetique, pas statique). La deceleration est 4-6x la normale.

**Phase 2 — Transition (500-800ms)** : Le couple de freinage ralentit la rotation. Le spin diminue progressivement. La friction retombe lineairement vers la valeur normale.

**Phase 3 — Roulement normal** : Le spin est "consomme". La boule roule normalement avec la friction du terrain. Si le backspin etait fort, la boule est deja quasi-arretee.

**Interaction terrain :**
- **Sable** : friction elevee + backspin = arret quasi-instantane (le sable "mord" le spin)
- **Dalles** : friction basse = le backspin a peu d'effet (la boule glisse sans accrocher)
- **Herbe** : bonne accroche, backspin efficace
- **Terre** : baseline, comportement standard

### 2.3 Implementation

```javascript
// === Constants.js — remplacer RETRO_FRICTION_MULT ===

// Phase 1 : friction cinetique maximale (boule glisse avec spin oppose)
export const RETRO_PHASE1_MULT = 5.0;           // 5x la friction normale
export const RETRO_PHASE1_FRAMES = 30;           // ~500ms a 60fps (modifie par intensite)

// Phase 2 : transition vers roulement pur
export const RETRO_PHASE2_FRAMES = 18;           // ~300ms

// Efficacite du backspin par terrain
export const RETRO_TERRAIN_EFF = {
    terre:  1.0,    // Baseline
    herbe:  1.3,    // Herbe accroche bien → backspin amplifie
    sable:  2.0,    // Sable absorbe enormement → arret quasi-instantane
    dalles: 0.4,    // Surface glissante → backspin peu efficace
    gravier: 0.9
};
```

```javascript
// === Ball.js — remplacement du modele retro ===

constructor(scene, x, y, options = {}) {
    // ... existant ...
    this.retro = 0;
    this._retroPhase = 0;       // 0=off, 1=glissement, 2=transition
    this._retroFrames = 0;      // frames restantes dans la phase
    this._retroTerrainEff = 1;  // cache du multiplicateur terrain
}

/**
 * Active le backspin en 2 phases. Appele par PetanqueEngine a l'atterrissage.
 */
activateRetro(intensity, terrainType) {
    if (intensity <= 0) return;
    this.retro = intensity;
    this._retroPhase = 1;
    this._retroFrames = Math.round(RETRO_PHASE1_FRAMES * intensity);
    this._retroTerrainEff = RETRO_TERRAIN_EFF[terrainType] || 1.0;
}

update(dt) {
    if (!this.isAlive || !this.isMoving) return;
    const cappedDt = Math.min(dt, 50) / 1000;

    // ... slope + zones existants ...

    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (speed > SPEED_THRESHOLD) {
        // === BACKSPIN EN 2 PHASES ===
        let retroMult = 1.0;

        if (this._retroPhase === 1) {
            // Phase glissement : friction maximale
            retroMult = 1 + (RETRO_PHASE1_MULT - 1) * this.retro * this._retroTerrainEff;
            this._retroFrames--;
            if (this._retroFrames <= 0) {
                this._retroPhase = 2;
                this._retroFrames = RETRO_PHASE2_FRAMES;
            }
        } else if (this._retroPhase === 2) {
            // Phase transition : decroit lineairement vers 1.0
            const t = this._retroFrames / RETRO_PHASE2_FRAMES; // 1→0
            const peak = 1 + (RETRO_PHASE1_MULT - 1) * this.retro * this._retroTerrainEff;
            retroMult = 1.0 + (peak - 1.0) * t;
            this._retroFrames--;
            if (this._retroFrames <= 0) {
                this._retroPhase = 0;
                this.retro = 0; // spin consomme
            }
        }

        const frictionDecel = FRICTION_BASE * effectiveFriction * retroMult * 60;
        const newSpeed = Math.max(0, speed - frictionDecel * cappedDt);
        // ... suite identique ...
    }
}
```

### 2.4 Interaction backspin + recul

Le backspin amplifie le recul **naturellement** :
- Apres la collision, la boule tiree a une vitesse residuelle dirigee vers l'arriere
- Le backspin (phase 1 : glissement) ne freine PAS un mouvement arriere — au contraire, il le favorise
- Raison physique : le spin arriere est dans le MEME sens que le deplacement arriere → la friction cinetique pousse la boule vers l'arriere au lieu de la freiner

```javascript
// Modification : en phase glissement, si la boule recule (post-collision),
// le retro n'augmente PAS la friction mais la REDUIT legerement
// car spin et direction sont dans le meme sens

if (this._retroPhase === 1 && this._isRecoiling) {
    retroMult = Math.max(0.7, 1.0 - this.retro * 0.3 * this._retroTerrainEff);
    // → friction reduite de 0-30% = la boule glisse plus loin en arriere
}
```

**Impact game feel :** Un tir avec backspin fort produit un recul plus prononce et plus satisfaisant. Le lien "retro → recul visible" est naturel et gratifiant.

### 2.5 Visuel du backspin

```javascript
// Phase 1 (glissement) : trainee de poussiere dense derriere la boule
// La boule "gratte" le sol — particules plus rapides et plus nombreuses
if (ball._retroPhase === 1 && ball.isMoving) {
    // Trainee visible = 2x plus de particules, couleur terrain
    this._spawnDust(ball.x, ball.y, 2);
}

// Phase 2 (transition) : trainee qui s'attenue
// Phase 0 : rien de special

// Animation sprite : en phase 1, les frames du spritesheet defilent
// en SENS INVERSE (rotation arriere visible)
if (ball._retroPhase > 0) {
    ball._rollDist -= speed * cappedDt * 60; // frames en arriere
}
```

### 2.6 Tableau recapitulatif

| Technique + Terrain | Retro off | Retro max (effet 10) |
|---------------------|-----------|----------------------|
| Plombee terre | 20% roulement (~40px) | **3% roulement (~6px)** |
| Plombee sable | 10% (~20px) | **<1% (arret net)** |
| Plombee dalles | 20% (~40px) | 12% (~24px) — dalles resistent au spin |
| Demi-portee terre | 50% (~100px) | 20% (~40px) |
| Tir fer (apres impact) | Recul ~5px | **Recul ~12px** (spin aide le recul) |

---

## 3. MICRO-REBONDS A L'ATTERRISSAGE

### 3.1 Physique reelle

La boule ne passe pas du vol au roulement instantanement. Elle subit 1-3 rebonds dont l'amplitude depend de :

1. **L'angle d'incidence** — facteur CRITIQUE ignore dans la v1
   - Roulette (angle ~10°) : quasi pas de composante verticale → pas de rebond
   - Demi-portee (angle ~45°) : composante verticale moderee → petit rebond
   - Plombee (angle ~80°) : composante verticale dominante → gros rebond
2. **Le COR sol** — capacite du sol a renvoyer l'energie
3. **Le backspin** — absorbe l'energie horizontale a chaque rebond

**COR sol :**

| Surface | COR sol | Rebond plombee typique |
|---------|---------|------------------------|
| Terre battue | 0.12 - 0.18 | 1-3 cm, 1-2 rebonds |
| Dalles | 0.30 - 0.40 | 5-15 cm, 2-3 rebonds |
| Sable | 0.03 - 0.08 | Quasi nul, boule s'enfonce |
| Herbe | 0.06 - 0.12 | 1-2 cm, 1 rebond |

### 3.2 Angle d'incidence — le facteur manquant

La v1 calculait `vImpact = sqrt(arcH * 0.5) * power` sans facteur angulaire. En realite, c'est l'angle qui determine combien d'energie est transferee au sol.

```javascript
// === Nouvelles constantes ===
export const GROUND_COR = {
    terre: 0.15, herbe: 0.09, sable: 0.05, dalles: 0.35, gravier: 0.11
};
export const BOUNCE_MIN_VY = 0.6;    // Seuil sous lequel on arrete les rebonds
export const MAX_BOUNCES = 3;

// Angle d'incidence par technique (0 = horizontal, 1 = vertical)
export const INCIDENCE_ANGLE = {
    roulette:    0.10,   // Quasi horizontal → pas de rebond
    demi_portee: 0.55,   // 45° → rebond modere
    plombee:     0.90,   // Quasi vertical → gros rebond
    tir:         0.70,   // Le tir descend sur la cible en arc
    tir_devant:  0.65,
    rafle:       0.08    // Ultra ras → pas de rebond
};
```

### 3.3 Calcul des rebonds

```javascript
/**
 * Calcule la sequence de micro-rebonds a l'atterrissage.
 *
 * @param {number} impactSpeed - vitesse totale au moment de l'impact
 * @param {string} loftId - identifiant de la technique (roulette, plombee, etc.)
 * @param {string} terrainType - type de terrain
 * @param {number} retroIntensity - intensite du backspin (0-1)
 * @param {number} throwAngle - angle du lancer en radians
 * @returns {Array<{dx, dy, height, duration}>} arcs de rebond (relatifs)
 */
_computeBounces(impactSpeed, loftId, terrainType, retroIntensity, throwAngle) {
    const cor = GROUND_COR[terrainType] || GROUND_COR.terre;
    const incidence = INCIDENCE_ANGLE[loftId] || 0.5;

    // Decomposer la vitesse en composantes verticale et horizontale
    let vVert = impactSpeed * incidence;        // composante vers le sol
    let vHoriz = impactSpeed * (1 - incidence); // composante le long du sol

    const bounces = [];

    for (let i = 0; i < MAX_BOUNCES; i++) {
        // Rebond vertical
        vVert *= cor;

        // Perte horizontale a chaque impact
        const terrainFriction = 0.15 + (1 - cor) * 0.20; // sols mous absorbent plus
        const retroAbsorb = Math.pow(1 - retroIntensity * 0.6, i + 1); // backspin cumulatif
        vHoriz *= (1 - terrainFriction) * retroAbsorb;

        // Hauteur du rebond (pixels visuels, cap a 20px)
        const height = Math.min(vVert * vVert * 0.6, 20);
        if (height < 0.8 || vVert < BOUNCE_MIN_VY) break;

        // Duree parabolique simplifiee
        const duration = Math.max(40, Math.sqrt(height) * 35); // 40-160ms

        // Distance horizontale pendant le rebond
        const horizDist = vHoriz * duration * 0.001 * 60;

        bounces.push({
            dx: Math.cos(throwAngle) * horizDist,
            dy: Math.sin(throwAngle) * horizDist,
            height,
            duration: Math.round(duration)
        });
    }

    return bounces;
}
```

### 3.4 Animation

Le flow de lancer actuel :
1. Tween de vol (sprite + ombre) → `_animateThrow`
2. `onComplete` → `ball.launch(rollVx, rollVy)`

Avec rebonds :
1. Tween de vol → `_animateThrow`
2. `onComplete` → SFX atterrissage principal + calcul rebonds
3. **Enchainement de mini-tweens** (chaque rebond = 1 tween parabolique)
4. Apres le dernier rebond → `ball.launch(vx_residuel, vy_residuel)`

```javascript
_animateBounces(ball, bounces, finalVx, finalVy, onComplete) {
    if (!bounces.length) {
        ball.launch(finalVx, finalVy);
        onComplete();
        return;
    }

    let i = 0;
    const next = () => {
        if (i >= bounces.length) {
            ball.launch(finalVx, finalVy);
            onComplete();
            return;
        }

        const b = bounces[i];
        i++;

        // SFX attenue
        sfxLanding(this.scene, 0.5 * Math.pow(0.5, i));

        // Poussiere reduite
        this._spawnDust(ball.x, ball.y, Math.max(1, 3 - i));

        const startX = ball.x, startY = ball.y;
        const endX = startX + b.dx, endY = startY + b.dy;

        // Tween horizontal
        this.scene.tweens.add({
            targets: ball,
            x: endX, y: endY,
            duration: b.duration,
            ease: 'Linear'
        });

        // Tween vertical simule (offset sprite)
        const proxy = { h: 0 };
        this.scene.tweens.add({
            targets: proxy,
            h: b.height,
            duration: b.duration / 2,
            ease: 'Quad.easeOut',
            yoyo: true,
            onUpdate: () => {
                if (ball.sprite) ball.sprite.y = ball.y - proxy.h;
                if (ball.shadowSprite) {
                    ball.shadowSprite.setAlpha(0.2 - proxy.h * 0.004);
                }
            },
            onComplete: () => {
                if (ball.sprite) ball.sprite.y = ball.y;
                if (ball.shadowSprite) ball.shadowSprite.setAlpha(0.2);
                next();
            }
        });
    };

    next();
}
```

### 3.5 Impact par technique et terrain

| Technique | Terre | Dalles | Sable |
|-----------|-------|--------|-------|
| Roulette | 0 rebonds | 0 rebonds | 0 rebonds |
| Demi-portee | 1 rebond, 2px | 1-2 rebonds, 5px | 0-1 rebond, <1px |
| Plombee | 1-2 rebonds, 4px | **2-3 rebonds, 10-15px** | 0 rebonds (s'enfonce) |
| Tir (si rate) | 1 rebond, 3px | 2 rebonds, 8px | 0-1 rebond |

**SFX differencies par terrain :**
- Terre : "thud" sourd + crunch de gravier
- Dalles : "clac" sec, resonnant (pitch +20%)
- Sable : "pff" mat, etouffe (pitch -30%, volume -40%)
- Herbe : "toc" feutre, doux

### 3.6 Performance

Nombre max de tweens par rebond : 2 (horizontal + vertical).
Nombre max de rebonds : 3.
→ Maximum 6 tweens concurrents, duree totale ~300ms.
Impact negligeable, meme sur mobile.

---

## 4. IRREGULARITES TERRAIN

### 4.1 Physique reelle

Le terrain n'est JAMAIS parfait. Les micro-irregularites (cailloux, bosses, rigoles) devient la boule pendant le roulement. C'est la raison pour laquelle la roulette est risquee sur terrain rugueux et la plombee est preferee.

Le fameux **"gratton"** — le caillou invisible qu'on accuse — est reel.

### 4.2 Implementation

C'est l'amelioration la plus simple et la plus impactante : ~20 lignes de code.

```javascript
// === Constants.js ===
export const TERRAIN_NOISE_BASE = 0.003;   // Amplitude de base de la deviation
export const TERRAIN_ROUGHNESS = {
    terre:   1.0,     // Baseline — quelques irregularites
    herbe:   1.5,     // Racines, bosses cachees
    sable:   0.3,     // Le sable est lisse, peu de bosses
    dalles:  0.05,    // Surface quasi-parfaite
    gravier: 2.5      // Tres rugueux
};
export const NOISE_SPEED_MIN = 0.5;  // Pas de bruit sous cette vitesse
```

```javascript
// === Ball.js — dans update(), apres la friction ===

// Irregularites terrain : deviation laterale pseudo-aleatoire
if (this.isMoving && speed > NOISE_SPEED_MIN) {
    const roughness = TERRAIN_ROUGHNESS[this._terrainType] || 1.0;

    // Bruit deterministe base sur la position (coherent entre frames)
    const noise =
        Math.sin(this.x * 0.15 + this.y * 0.31) * 0.5 +
        Math.sin(this.x * 0.31 - this.y * 0.15) * 0.3 +
        Math.cos(this.x * 0.07 + this.y * 0.12) * 0.2;

    // Intensite proportionnelle a : vitesse × rugosite × 1/masse
    // Le cochonnet (30g) est PLUS affecte que la boule (700g)
    const massRatio = BALL_MASS / this.mass;
    const intensity = TERRAIN_NOISE_BASE * roughness * speed * massRatio;

    // Deviation perpendiculaire a la direction de deplacement
    const perpX = -this.vy / speed;
    const perpY = this.vx / speed;
    this.vx += perpX * noise * intensity;
    this.vy += perpY * noise * intensity;
}
```

### 4.3 Pourquoi c'est si impactant

| Technique | Deviation sur 8m (terre) | Sur gravier | Sur dalles |
|-----------|--------------------------|-------------|------------|
| Roulette (85% au sol) | 3-8 px | 8-20 px | <1 px |
| Demi-portee (50% au sol) | 2-4 px | 4-10 px | <0.5 px |
| Plombee (10-20% au sol) | 0.5-1.5 px | 1-3 px | <0.2 px |
| Tir au fer (0% au sol) | **0 px** | **0 px** | **0 px** |
| Rafle (85% au sol, haute vitesse) | 8-20 px | 15-40 px | 2-5 px |

**La roulette est enfin un vrai choix** : facile sur dalles, risquee sur gravier. La plombee devient obligatoire sur terrain rugueux. Le tir au fer n'est pas affecte (il vole). C'est exactement comme en vrai.

### 4.4 Extension : rugosity par zone

Les terrains ont deja des zones de friction variable. On peut ajouter `roughness` par zone :

```json
{
    "zones": [
        { "rect": {"x":0.3, "y":0.5, "w":0.4, "h":0.15}, "friction": 1.4, "roughness": 2.5 }
    ]
}
```

La Ball verifie deja les zones pour la friction — il suffit de lire `roughness` en meme temps.

---

## 5. TIR DEVANT

### 5.1 Physique reelle

La boule atterrit **20-30 cm devant la cible** (6-8 px en jeu) puis rebondit dessus. Plus facile que le tir au fer (zone de tolerance ~30 cm vs ~8 cm) mais moins propre.

**Interaction terrain CRITIQUE :**
- Sol meuble (terre, herbe) : rebond bas, frappe la cible → OK
- Sol dur (dalles) : rebond trop haut, **passe AU-DESSUS de la cible** → echec
- Sol mou (sable) : boule s'enfonce, **pas assez de vitesse pour atteindre la cible** → echec

### 5.2 Implementation

```javascript
// === Constants.js ===
export const LOFT_TIR_DEVANT = {
    id: 'tir_devant', label: 'TIR DEVANT',
    landingFactor: 0.88,        // 88% vol
    arcHeight: -50,
    flyDurationMult: 0.45,
    rollEfficiency: 14.0,       // Haute vitesse residuelle (legrement moins que fer)
    precisionPenalty: 0.7,      // Plus facile que fer (1.0) mais PAS 2x plus facile
    retroAllowed: true,
    isTir: true,
    landingOffset: -8           // 8px avant la cible (nouveau parametre)
};
```

**Note equilibrage** : `precisionPenalty: 0.7` (v1 proposait 0.5 qui etait trop genereux). En realite le tir devant est plus tolerant en distance mais pas en direction — la zone de tolerance est un rectangle, pas un cercle.

### 5.3 Mecanique de rebond terrain

```javascript
// Dans PetanqueEngine, au moment du lancer tir devant :
_handleTirDevant(ball, target, loft, terrainType) {
    const cor = GROUND_COR[terrainType] || GROUND_COR.terre;

    // Sur sol trop dur : risque d'overshoot
    if (cor > 0.30) {
        // Probabilite d'echec proportionnelle au COR
        const failChance = (cor - 0.25) * 2.5; // dalles (0.35) → 25% d'echec
        if (Math.random() < failChance) {
            // La boule rebondit trop haut et passe au-dessus
            this._showMessage('Rebond trop haut !');
            // La boule continue DERRIERE la cible sans la toucher
            return { overshoot: true };
        }
    }

    // Sur sol trop mou : perte de vitesse massive
    if (cor < 0.06) {
        // La boule s'enfonce et perd 60% de vitesse
        return { speedLoss: 0.60 };
    }

    // Terrain normal : perte de vitesse 15-25%
    return { speedLoss: 0.15 + (1 - cor) * 0.15 };
}
```

### 5.4 Difference avec le tir au fer — tableau comparatif

| Aspect | Tir au fer | Tir devant |
|--------|-----------|------------|
| Contact sol | NON | OUI (8px avant cible) |
| Wobble | precisionPenalty 1.0 | precisionPenalty 0.7 |
| Vitesse d'impact | 100% | 75-85% (pertes au rebond) |
| Chance de carreau | ~15-20% des tirs reussis | ~5% (angle defavorable) |
| Terrain ideal | Tous | Terre, herbe |
| Risque dalles | Aucun | **25% d'echec** |
| Risque sable | Aucun | Perte massive de vitesse |
| SFX | CLAC metallique | THUD + CLAC (double son) |

---

## 6. TIR A LA RAFLE

### 6.1 Physique reelle

La rafle est un tir **rasant** : la boule roule au sol a vitesse de tir (13-16 m/s). 15% vol, 85% roulement a haute vitesse. Impact chaotique et imprevisible.

### 6.2 Implementation

C'est la mecanique la plus simple a ajouter : un nouveau preset de loft + du bruit terrain amplifie.

```javascript
// === Constants.js ===
export const LOFT_RAFLE = {
    id: 'rafle', label: 'RAFLE',
    landingFactor: 0.15,        // 15% vol (comme une roulette)
    arcHeight: -4,               // Quasi ras du sol
    flyDurationMult: 0.20,       // Tres rapide
    rollEfficiency: 0.85,        // Conserve 85% de la vitesse au sol
    precisionPenalty: 2.5,       // Tres imprecis
    retroAllowed: false,         // Pas de backspin sur une rafle
    isTir: true,
    speedMultiplier: 2.2         // Vitesse de tir
};

// Compatibilite terrain
export const RAFLE_TERRAIN_PENALTY = {
    terre:   1.0,     // OK
    dalles:  0.6,     // Excellent, surface lisse
    herbe:   2.5,     // Trop de friction
    sable:   Infinity, // Impossible
    gravier: 1.8      // Tres rugueux, deviations fortes
};
```

### 6.3 Mecanique specifique

```javascript
// Dans Ball.js — bruit amplifie pour la rafle (haute vitesse au sol)
// La rafle utilise le MEME systeme d'irregularites terrain (section 4)
// mais avec un multiplicateur ×3 car la haute vitesse amplifie les deviations

if (this._isRafle && speed > 2.0) {
    // Le bruit terrain est deja applique (section 4)
    // On ajoute une dispersion supplementaire a l'impact
}
```

```javascript
// Dans Ball.resolveCollision — impact chaotique
if (a._isRafle || b._isRafle) {
    // La boule arrive au ras du sol, pas en vol
    // → l'angle d'impact est imprevisible
    const chaosAngle = (Math.random() - 0.5) * 0.25; // ±7°
    const cos = Math.cos(chaosAngle), sin = Math.sin(chaosAngle);
    const newVx = b.vx * cos - b.vy * sin;
    const newVy = b.vx * sin + b.vy * cos;
    b.vx = newVx;
    b.vy = newVy;
}
```

### 6.4 Integration dans le flow

```javascript
// Dans throwBall() :
if (loft.id === 'rafle') {
    const penalty = RAFLE_TERRAIN_PENALTY[this.terrainType];
    if (!isFinite(penalty)) {
        // Terrain incompatible (sable)
        this._showMessage('Impossible sur ce terrain !');
        // La boule s'enfonce et meurt a 20% de la distance
        ball.launch(vx * 0.2, vy * 0.2);
        return;
    }
    ball._isRafle = true;
    ball.frictionMult *= penalty;
}
```

### 6.5 Quand utiliser la rafle

- **"Faire le menage"** : 3-4 boules adverses proches → rafle pour tout bousculer
- **Tir du cochonnet** : la rafle est efficace pour deplacer le but (petite cible, grande zone d'impact)
- **Terrain roulant** : dalles = rafle ideale (friction basse, surface lisse)
- **Desespoir** : quand rien d'autre ne marche, la rafle peut tout changer

**SFX :** roulement intense + crissement continu (pitch eleve) + impact multi-collisions si touche un groupe

---

## 7. SPIN LATERAL

### 7.1 Framework unifie spin

Avant d'implementer le spin lateral, il faut un **framework unifie** pour tout le systeme de spin (backspin + lateral) :

```javascript
// === Ball.js — structure de spin unifiee ===
constructor(scene, x, y, options = {}) {
    // Spin unifie
    this.spin = {
        retro: 0,        // 0-1 (backspin, deja existant en tant que this.retro)
        lateral: 0,      // -1 (gauche) a +1 (droite)
        intensity: 0     // Intensite residuelle (se consomme)
    };
    this._spinPhase = 0;  // 0=off, 1=glissement, 2=transition
    this._spinFrames = 0;
}
```

Le backspin (section 2) et le lateral utilisent le meme systeme de phases : glissement → transition → roulement normal.

### 7.2 Physique du spin lateral

Le spin lateral cree une deviation perpendiculaire a la direction de deplacement. L'effet :
- Ne s'active qu'au contact sol (pas pendant le vol)
- Se "consomme" progressivement (la friction freine la rotation)
- Depend du terrain (dalles = peu d'effet, herbe = beaucoup)
- Est proportionnel au stat "Effet" du personnage

**Deviations typiques sur 8m :**
- Effet faible (stat 4-5) : 3-5 px lateral
- Effet moyen (stat 6-7) : 6-10 px
- Effet fort (stat 8-10) : 12-18 px

### 7.3 Implementation

```javascript
// === Constants.js ===
export const LATERAL_FORCE = 0.06;      // Force laterale par frame
export const SPIN_DECAY = 0.004;        // Taux de consommation du spin
export const LATERAL_MIN_EFFET = 4;     // Stat effet minimum pour debloquer

export const SPIN_TERRAIN_MULT = {
    terre:   1.0,
    herbe:   1.3,    // Herbe accroche → bon lateral
    sable:   1.8,    // Sable amplifie enormement le spin
    dalles:  0.3,    // Dalles glissantes → peu d'effet
    gravier: 1.1
};
```

```javascript
// === Ball.js — dans update() ===

// Spin lateral : force perpendiculaire a la direction
if (this.spin.lateral !== 0 && this.spin.intensity > 0.01 && speed > 0.5) {
    const terrainMult = SPIN_TERRAIN_MULT[this._terrainType] || 1.0;
    const force = this.spin.lateral * this.spin.intensity * LATERAL_FORCE * terrainMult;

    const perpX = -this.vy / speed;
    const perpY = this.vx / speed;
    this.vx += perpX * force * cappedDt * 60;
    this.vy += perpY * force * cappedDt * 60;

    // Le spin se consomme
    this.spin.intensity = Math.max(0,
        this.spin.intensity - SPIN_DECAY * cappedDt * 60 * terrainMult);
}
```

### 7.4 UI dans AimingSystem

```javascript
// Quand le joueur a choisi une technique compatible ET stat effet >= 4 :
// Afficher sous les controles existants :
//
//   [Q] ← Gauche    [E] Droite →
//
// La fleche de visee se COURBE pour montrer la deviation attendue
// Indicateur visuel : la trajectoire predite courbe doucement

_drawCurvedArrow(gfx, originX, originY, angle, power, lateral) {
    if (lateral === 0) {
        // Fleche droite standard
        return;
    }

    const curvature = lateral * 0.12;
    const arrowLen = power * 80;

    gfx.beginPath();
    gfx.moveTo(originX, originY);

    for (let t = 0.1; t <= 1; t += 0.1) {
        const len = arrowLen * t;
        const lateralOff = curvature * len * t;
        const perpX = -Math.sin(angle);
        const perpY = Math.cos(angle);
        const px = originX + Math.cos(angle) * len + perpX * lateralOff;
        const py = originY + Math.sin(angle) * len + perpY * lateralOff;
        gfx.lineTo(px, py);
    }
    gfx.strokePath();
}
```

### 7.5 Interactions

| Spin + Technique | Resultat |
|------------------|----------|
| Lateral + roulette | Maximum de deviation (85% au sol). Idéal pour contourner. |
| Lateral + demi-portee | Deviation moderee. Bon compromis. |
| Lateral + plombee | Faible deviation (10% au sol). Peu utile. |
| Retro + lateral | COMBINAISON POSSIBLE. La boule courbe ET freine. Pro uniquement (effet >= 7). |
| Lateral + tir | NON AUTORISE. Le tir au fer vole — pas de contact sol pour activer le spin. |
| Lateral + rafle | Deviation amplifiee (haute vitesse × terrain). Chaotique. |

---

## 8. CARREAU AVANCE

### 8.1 Probleme de detection actuel

Le carreau actuel est detecte par distance pure : `thrownBall < 28px de targetOrigPos`. C'est correct pour le cas simple mais :
1. Pas de distinction carreau parfait / allonge / recul
2. Pas d'interaction avec le backspin (backspin devrait augmenter les chances)
3. Le seuil 28px est fixe quel que soit le terrain ou la vitesse

### 8.2 Detection amelioree

```javascript
_checkCarreau() {
    if (!this._pendingCarreauChecks || !this.lastThrownBall) return;
    if (!this.lastShotWasTir) { this._pendingCarreauChecks = []; return; }

    for (const check of this._pendingCarreauChecks) {
        if (!check.thrownBall.isAlive) continue;
        const dx = check.thrownBall.x - check.targetOrigX;
        const dy = check.thrownBall.y - check.targetOrigY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > CARREAU_THRESHOLD) continue; // > 28px = pas carreau

        // Projeter sur l'axe du lancer pour determiner le type
        const throwAngle = this._lastThrowAngle || 0;
        const projForward = dx * Math.cos(throwAngle) + dy * Math.sin(throwAngle);

        let subtype;
        if (dist < 8) {
            subtype = 'parfait';   // <8px = carreau sur place
        } else if (projForward > 3) {
            subtype = 'allonge';   // Boule a avance
        } else if (projForward < -3) {
            subtype = 'recul';     // Boule a recule (backspin)
        } else {
            subtype = 'standard';
        }

        this._celebrateCarreau(check.thrownBall, subtype);
        break;
    }
    this._pendingCarreauChecks = [];
}

_celebrateCarreau(ball, subtype = 'standard') {
    // Track stat
    if (this.matchStats && ball.team) this.matchStats.carreaux[ball.team]++;

    // Hitstop adapte
    const hitstop = subtype === 'parfait' ? 150 : HITSTOP_CARREAU_MS;
    this._hitstopUntil = Date.now() + hitstop;

    sfxCarreau();

    // Texte adapte
    const texts = {
        parfait:  'CARREAU PARFAIT !!',
        allonge:  'CARREAU !',
        recul:    'CARREAU !',
        standard: 'CARREAU !'
    };

    this.renderer.celebrateCarreau(ball, texts[subtype]);

    // Celebration bonus pour le carreau parfait
    if (subtype === 'parfait') {
        this.scene.time.delayedCall(600, () => {
            this._showShotLabel(ball, 'SUR PLACE !', '#FFD700', 12);
        });
    }
}
```

### 8.3 Interaction backspin → carreau

Le backspin augmente les chances de carreau **naturellement** via la physique :
- Apres la collision (COR 0.62), la boule tiree a ~19% de son energie originale
- Sans backspin : cette energie la fait avancer → carreau allonge ou palet
- Avec backspin : le retro freine la boule → elle s'arrete plus vite → plus pres du point d'impact

**Pas besoin de code supplementaire** : le modele de backspin avance (section 2) fait deja le travail. Il suffit de `activateRetro()` sur la boule tiree si elle avait du backspin au lancer. Le backspin est consomme partiellement pendant le vol/impact, mais une partie residuelle aide a l'arret post-collision.

```javascript
// Dans _animateThrow, apres la collision :
// Si la boule avait du retro, activer le backspin residuel
if (ball.retro > 0) {
    const residualRetro = ball.retro * 0.6; // 60% du retro survit a l'impact
    ball.activateRetro(residualRetro, this.terrainType);
}
```

### 8.4 Statistiques de match

Tracker tous les resultats de tir pour l'ecran de fin :

```javascript
this.matchStats = {
    shots: { player: 0, opponent: 0 },
    tirs: { player: 0, opponent: 0 },
    hits: { player: 0, opponent: 0 },
    carreaux: { player: 0, opponent: 0 },
    carreauxParfaits: { player: 0, opponent: 0 },
    palets: { player: 0, opponent: 0 },
    contres: { player: 0, opponent: 0 },
    ciseaux: { player: 0, opponent: 0 },
    biberons: { player: 0, opponent: 0 },
    casquettes: { player: 0, opponent: 0 }
};
```

---

## 9. INTEGRATION IA

### 9.1 Probleme actuel

L'IA ignore completement les nouvelles mecaniques. Elle ne sait pas :
- Quand utiliser le tir devant vs le fer
- Quand la rafle est utile
- Comment doser le backspin
- Si le terrain est compatible avec sa technique choisie

### 9.2 Choix de technique de tir par l'IA

```javascript
// === PetanqueAI.js — nouvelle methode ===

/**
 * Choisit le type de tir en fonction du terrain et de la situation.
 * Remplace le tir au fer systematique.
 */
_chooseTirTechnique(targetBall) {
    const terrain = this._terrainType;
    const dist = this._distTo(targetBall);
    const effetStat = this._charStats.effet || 6;
    const precisionStat = this._charStats.precision || 6;

    // Rafle : personnalites agressives sur terrain plat
    if (this._personality === 'tireur' && terrain !== 'sable') {
        const raflePenalty = RAFLE_TERRAIN_PENALTY[terrain] || 1.0;
        if (raflePenalty <= 1.2 && Math.random() < 0.15) {
            return LOFT_RAFLE; // 15% de chance si terrain OK
        }
    }

    // Tir devant : joueurs intermediaires OU terrain meuble
    if (precisionStat < 7 || terrain === 'terre' || terrain === 'herbe') {
        const corSol = GROUND_COR[terrain] || 0.15;
        // Eviter tir devant sur dalles (risque d'overshoot)
        if (corSol < 0.30 && Math.random() < 0.40) {
            return LOFT_TIR_DEVANT;
        }
    }

    // Par defaut : tir au fer (toujours fiable)
    return LOFT_TIR;
}
```

### 9.3 Utilisation du backspin par l'IA

```javascript
/**
 * Decide si l'IA utilise le backspin et avec quelle intensite.
 * Remplace la decision aleatoire actuelle.
 */
_chooseRetro(loftPreset, targetDist) {
    if (!loftPreset.retroAllowed) return 0;
    const effetStat = this._charStats.effet || 6;
    if (effetStat < RETRO_MIN_EFFET_STAT) return 0;

    // Situations ou le backspin est utile :
    // 1. Plombee pres du cochonnet (veut s'arreter net)
    if (loftPreset.id === 'plombee' && targetDist < 60) {
        const intensity = 0.3 + (effetStat - 1) / 9 * 0.7;
        return intensity * (Math.random() * 0.3 + 0.7); // 70-100% de l'intensite max
    }

    // 2. Tir au fer (veut un carreau)
    if (loftPreset.id === 'tir' || loftPreset.id === 'tir_devant') {
        // Plus la stat effet est haute, plus l'IA utilise le retro en tir
        if (Math.random() < effetStat / 15) {
            return 0.2 + (effetStat - 1) / 9 * 0.6;
        }
    }

    // 3. Demi-portee a distance moyenne (controle supplementaire)
    if (loftPreset.id === 'demi_portee' && targetDist > 100 && targetDist < 200) {
        if (Math.random() < 0.2) {
            return 0.2 + (effetStat - 1) / 9 * 0.4;
        }
    }

    return 0;
}
```

### 9.4 Utilisation du spin lateral par l'IA

```javascript
/**
 * Decide si l'IA utilise un effet lateral.
 * Seulement les personnages avec effet >= 6 et en pointage.
 */
_chooseLateralSpin(loftPreset, targetAngle, obstacles) {
    if (this._charStats.effet < 6) return 0;
    if (loftPreset.isTir) return 0; // pas de lateral en tir

    // Detecter si un obstacle (boule adverse) est entre le cercle et la cible
    const blocking = obstacles.find(obs => {
        // Check si la boule est a <15px de la trajectoire directe
        const d = this._distToLine(obs, this._throwOrigin, targetAngle);
        return d < 15 && d > 0;
    });

    if (blocking) {
        // Contourner l'obstacle
        const side = this._whichSideToAvoid(blocking, targetAngle);
        const intensity = 0.3 + (this._charStats.effet - 5) / 5 * 0.5;
        return side * intensity; // -1 ou +1 × intensite
    }

    return 0;
}
```

### 9.5 Adaptation terrain par l'IA

L'IA actuelle choisit le loft par distance (`_optimalLoft(dist)`). Il faut aussi prendre en compte le terrain :

```javascript
_optimalLoft(dist) {
    const terrain = this._terrainType;

    // Sur sable : plombee quasi-obligatoire (roulette impossible)
    if (terrain === 'sable' && dist > 60) return LOFT_PLOMBEE;

    // Sur dalles : eviter la plombee (rebonds dangereux)
    if (terrain === 'dalles' && dist > 200) return LOFT_DEMI_PORTEE;

    // Sur gravier : eviter la roulette (deviations)
    if (terrain === 'gravier' && dist < 120) return LOFT_DEMI_PORTEE;

    // Logique standard
    if (dist < 100) return LOFT_ROULETTE;
    if (dist < 200) return LOFT_DEMI_PORTEE;
    return LOFT_PLOMBEE;
}
```

---

## 10. PLAN D'IMPLEMENTATION REVISE

### 10.1 Matrice impact × complexite × dependances

| # | Amelioration | Impact | Complexite | Lignes | Dependances |
|---|-------------|--------|------------|--------|-------------|
| A | Recul + resultats tir | ★★★★☆ | ★☆☆☆☆ | ~60 | Aucune |
| B | Irregularites terrain | ★★★★☆ | ★☆☆☆☆ | ~25 | Aucune |
| C | Backspin avance | ★★★★★ | ★★☆☆☆ | ~80 | Aucune |
| D | Rafle | ★★★★☆ | ★★☆☆☆ | ~50 | B (pour le bruit terrain) |
| E | Micro-rebonds | ★★★☆☆ | ★★★☆☆ | ~120 | C (pour interaction backspin) |
| F | Tir devant | ★★★☆☆ | ★★★☆☆ | ~100 | E (pour le systeme de rebond) |
| G | Carreau avance | ★★★★☆ | ★★☆☆☆ | ~70 | C (backspin → carreau) |
| H | Spin lateral | ★★★★★ | ★★★★☆ | ~180 | C (framework spin unifie) |
| I | Integration IA | ★★★★☆ | ★★★☆☆ | ~120 | D, F, H (toutes techniques) |

### 10.2 Graphe de dependances

```
Phase 1 (Quick wins, aucune dependance) :
  A (Recul/resultats)  ← independant
  B (Irregularites)    ← independant
  C (Backspin avance)  ← independant

Phase 2 (Construit sur Phase 1) :
  D (Rafle)            ← depend de B (bruit terrain)
  G (Carreau avance)   ← depend de C (backspin residuel)

Phase 3 (Complexe, necessite Phase 1+2) :
  E (Micro-rebonds)    ← depend de C (interaction rebond/backspin)
  F (Tir devant)       ← depend de E (systeme de rebond)
  H (Spin lateral)     ← depend de C (framework spin unifie)

Phase 4 (Integration) :
  I (IA)               ← depend de D, F, H (connaitre toutes les techniques)
```

### 10.3 Sprint plan detaille

#### SPRINT 1 — Fondations (A + B + C) — ~165 lignes
> Objectif : enrichir ce qui existe, pas ajouter de nouvelles mecaniques

**A. Recul + resultats de tir** (~60 lignes)
- Fichiers : `PetanqueEngine.js` (remplacer `_detectShotResult`)
- Ajouter : casquette, blesser, ciseau, palet corrige
- Supprimer : amplification artificielle du recul
- Test : tirer 20 fois, verifier que chaque resultat a le bon label

**B. Irregularites terrain** (~25 lignes)
- Fichiers : `Ball.js` (dans `update()`), `Constants.js`
- Test : 10 roulettes sur terre vs dalles, deviation visible seulement sur terre

**C. Backspin avance** (~80 lignes)
- Fichiers : `Ball.js` (remplacer le modele retro), `Constants.js`
- Ajouter : `activateRetro()`, phases glissement/transition
- Test : plombee + retro max sur terre → arret en ~5px. Sur dalles → arret en ~20px.

#### SPRINT 2 — Nouvelles techniques (D + G) — ~120 lignes
> Objectif : diversifier le jeu

**D. Rafle** (~50 lignes)
- Fichiers : `Constants.js`, `PetanqueEngine.js`, `AimingSystem.js`, `Ball.js`
- UI : ajouter sous-menu tir [T] Fer [R] Rafle
- Test : rafle sur terre (chaos), rafle sur sable (echec), rafle sur dalles (rapide)

**G. Carreau avance** (~70 lignes)
- Fichiers : `PetanqueEngine.js` (remplacer `_checkCarreau`)
- Detection : parfait (<8px), standard (<28px), allonge/recul
- Test : tir + retro fort → plus de carreaux sur place

#### SPRINT 3 — Physique avancee (E + F) — ~220 lignes
> Objectif : enrichir le vol et l'atterrissage

**E. Micro-rebonds** (~120 lignes)
- Fichiers : `PetanqueEngine.js` (refactoring du flow de lancer)
- SFX differencies par terrain
- Test : plombee sur dalles = 2-3 rebonds visibles, sur sable = 0

**F. Tir devant** (~100 lignes)
- Fichiers : `Constants.js`, `PetanqueEngine.js`, `AimingSystem.js`
- Rebond terrain-dependant avec risque d'echec sur dalles
- Test : tir devant sur terre = touche, sur dalles = 25% d'echec

#### SPRINT 4 — Depth (H + I) — ~300 lignes
> Objectif : profondeur strategique maximale

**H. Spin lateral** (~180 lignes)
- Fichiers : `Ball.js`, `AimingSystem.js`, `Constants.js`
- UI : [Q]/[E] pour lateral, fleche courbee
- Test : spin gauche + demi-portee = courbe visible de ~10px sur terre

**I. Integration IA** (~120 lignes)
- Fichiers : `PetanqueAI.js`, `CompletStrategy.js`
- Choix technique de tir (fer/devant/rafle), backspin adapte, spin lateral pour contourner
- Test : IA sur dalles ne fait jamais de tir devant, IA tireur fait parfois des rafles

### 10.4 Total

| Sprint | Lignes | Fichiers touches | Nouvelles mecaniques |
|--------|--------|------------------|----------------------|
| 1 | ~165 | Ball.js, PetanqueEngine.js, Constants.js | 0 (ameliore l'existant) |
| 2 | ~120 | +AimingSystem.js | 2 (rafle, carreau avance) |
| 3 | ~220 | Refactoring PetanqueEngine | 2 (rebonds, tir devant) |
| 4 | ~300 | +PetanqueAI.js, CompletStrategy.js | 2 (spin lateral, IA) |
| **Total** | **~805** | 6 fichiers | **6 mecaniques** |

### 10.5 Techniques NON incluses (et pourquoi)

| Technique | Raison d'exclusion |
|-----------|-------------------|
| **Tir a la sautee** | Trop complexe (detection obstacle, arc augmente). A ajouter quand l'IA est capable de l'utiliser. Implementable plus tard comme variante contextuelle du tir au fer. |
| **Poussette intentionnelle** | La physique la permet deja naturellement. C'est un probleme d'IA (detecter quand c'est rentable), pas de physique. A ajouter dans un sprint IA futur. |
| **Vent** | Effet negligeable sur les boules (trop lourdes). Complexite elevee pour peu de gain. Nice-to-have post-MVP. |
| **Pentes dynamiques** | Le systeme de `slope_zones` existe deja. Les pentes sont un probleme de level design, pas de physique. |
| **Usure du terrain** | Les crateres sont deja dessines (`impactLayer`) mais n'affectent pas la physique. Enorme complexite pour peu de gain. Post-MVP. |

---

## ANNEXE A : CONSTANTES RECAPITULATIVES

```javascript
// === TOUTES les nouvelles constantes pour Constants.js ===

// --- Resultats de tir ---
export const PALET_THRESHOLD = 50;
export const CASQUETTE_MAX_SPEED = 0.5;
export const BLESSER_MAX_SPEED = 1.5;

// --- Backspin avance ---
export const RETRO_PHASE1_MULT = 5.0;
export const RETRO_PHASE1_FRAMES = 30;
export const RETRO_PHASE2_FRAMES = 18;
export const RETRO_TERRAIN_EFF = {
    terre: 1.0, herbe: 1.3, sable: 2.0, dalles: 0.4, gravier: 0.9
};

// --- Micro-rebonds ---
export const GROUND_COR = {
    terre: 0.15, herbe: 0.09, sable: 0.05, dalles: 0.35, gravier: 0.11
};
export const INCIDENCE_ANGLE = {
    roulette: 0.10, demi_portee: 0.55, plombee: 0.90,
    tir: 0.70, tir_devant: 0.65, rafle: 0.08
};
export const BOUNCE_MIN_VY = 0.6;
export const MAX_BOUNCES = 3;

// --- Irregularites terrain ---
export const TERRAIN_NOISE_BASE = 0.003;
export const TERRAIN_ROUGHNESS = {
    terre: 1.0, herbe: 1.5, sable: 0.3, dalles: 0.05, gravier: 2.5
};
export const NOISE_SPEED_MIN = 0.5;

// --- Tir devant ---
export const LOFT_TIR_DEVANT = {
    id: 'tir_devant', label: 'TIR DEVANT',
    landingFactor: 0.88, arcHeight: -50, flyDurationMult: 0.45,
    rollEfficiency: 14.0, precisionPenalty: 0.7, retroAllowed: true,
    isTir: true, landingOffset: -8
};

// --- Rafle ---
export const LOFT_RAFLE = {
    id: 'rafle', label: 'RAFLE',
    landingFactor: 0.15, arcHeight: -4, flyDurationMult: 0.20,
    rollEfficiency: 0.85, precisionPenalty: 2.5, retroAllowed: false,
    isTir: true, speedMultiplier: 2.2
};
export const RAFLE_TERRAIN_PENALTY = {
    terre: 1.0, dalles: 0.6, herbe: 2.5, sable: Infinity, gravier: 1.8
};

// --- Spin lateral ---
export const LATERAL_FORCE = 0.06;
export const SPIN_DECAY = 0.004;
export const LATERAL_MIN_EFFET = 4;
export const SPIN_TERRAIN_MULT = {
    terre: 1.0, herbe: 1.3, sable: 1.8, dalles: 0.3, gravier: 1.1
};

// --- Carreau avance ---
export const CARREAU_PERFECT_THRESHOLD = 8;
// CARREAU_THRESHOLD (28) et CARREAU_DISPLACED_MIN (32) existent deja
```

## ANNEXE B : FICHIERS IMPACTES PAR SPRINT

| Sprint | Ball.js | PetanqueEngine.js | AimingSystem.js | Constants.js | PetanqueAI.js |
|--------|---------|-------------------|-----------------|--------------|---------------|
| 1 | Backspin + bruit | Resultats tir | — | Constantes A+B+C | — |
| 2 | Rafle flag | Carreau avance | Sous-menu tir | Presets D+G | — |
| 3 | — | Rebonds + tir devant | — | Constantes E+F | — |
| 4 | Spin lateral | — | UI spin [Q]/[E] | Constantes H | Choix techniques |

---

---

## ANNEXE C : FAISABILITE TECHNIQUE

### C.1 Verification : computeThrowParams et les nouveaux presets

Le code actuel calcule la vitesse de roulement ainsi (PetanqueEngine.js:343) :
```javascript
const rollingSpeed = Math.sqrt(2 * perFrameFriction * rollDist * loftPreset.rollEfficiency);
```

**Question** : les nouveaux presets produisent-ils des vitesses coherentes ?

#### Rafle (LOFT_RAFLE)
```
rollEfficiency: 0.85, landingFactor: 0.15
Avec power=0.8, puissanceMult=1.0, terrain=terre (frictionMult=1.0) :
  maxDist = 420 * 0.95 * 1.0 = 399  (isTir=true car isTir flag)
  totalDist = 0.8 * 399 = 319
  rollDist = 319 * (1 - 0.15) = 271
  perFrameFriction = 0.15 * 1.0 = 0.15
  rollingSpeed = sqrt(2 * 0.15 * 271 * 0.85) = sqrt(69) = 8.3 px/frame
```
**8.3 px/frame est correct** pour un tir rapide (le tir au fer avec rollEfficiency=16 produit ~3.1 px/frame sur un rollDist de 6px, ce qui donne une vitesse equivalente grace au hack). La rafle est un peu plus lente que le fer mais roule BEAUCOUP plus longtemps → sensation de boule qui fonce a travers le terrain.

**PROBLEME** : `computeThrowParams` utilise `isTir = loftPreset.id === 'tir'` (ligne 328). Les nouveaux presets `tir_devant` et `rafle` NE SONT PAS reconnus comme tir. Il faut modifier :
```javascript
// AVANT :
const isTir = loftPreset.id === 'tir';
// APRES :
const isTir = loftPreset.isTir || loftPreset.id === 'tir';
```
→ **1 ligne a changer**. Faisable.

#### Tir devant (LOFT_TIR_DEVANT)
```
rollEfficiency: 14.0, landingFactor: 0.88
Avec power=0.8, puissanceMult=1.0 :
  totalDist = 0.8 * 399 = 319
  rollDist = 319 * (1 - 0.88) = 38
  rollingSpeed = sqrt(2 * 0.15 * 38 * 14.0) = sqrt(160) = 12.6 px/frame
```
**12.6 px/frame** — c'est la vitesse d'impact sur la cible apres le rebond. C'est tres rapide, coherent avec un tir (le tir au fer standard produit ~12.4 px/frame). Le rebond va reduire cette vitesse de 15-25% (section 5.3), donc l'impact final sera ~9.5-10.7 px/frame. Bon equilibre.

#### Speedmultiplier de la rafle
Le preset `LOFT_RAFLE` a un `speedMultiplier: 2.2` mais **computeThrowParams ne le lit pas**. Deux options :
1. **Supprimer speedMultiplier** et ajuster rollEfficiency pour obtenir la bonne vitesse. Puisque rollEfficiency=0.85 produit deja 8.3 px/frame, c'est suffisant.
2. **Ajouter le multiplicateur** dans computeThrowParams : `rollingSpeed *= loftPreset.speedMultiplier || 1`

**Recommandation** : option 1 (supprimer speedMultiplier). La vitesse de la rafle est deja correcte grace aux calculs naturels. Pas de code supplementaire.

### C.2 Verification : les micro-rebonds sont-ils implementables avec Phaser tweens ?

**Question** : Phaser peut-il enchainer 3 tweens de 50-160ms chacun sans saccade ?

**Reponse** : OUI.
- Phaser 3.90 supporte les tweens chainés via `onComplete` callback
- Chaque rebond = 2 tweens concurrents (horizontal Linear + vertical Quad yoyo)
- Duree totale max : 3 × 160ms = 480ms. C'est sous la barre des 500ms recommandee
- Le nombre max de tweens actifs : 6 (3 rebonds × 2 tweens). Phaser gere facilement 100+ tweens
- **Test rapide** : le code actuel utilise deja des tweens dans `_animateThrow` (1 tween avec onUpdate). Ajouter 6 tweens supplementaires est trivial.

**Risque mobile** : aucun. Les tweens Phaser utilisent requestAnimationFrame, pas de calcul GPU supplementaire.

### C.3 Verification : le bruit de terrain est-il deterministe ?

**Question** : le bruit pseudo-Perlin base sur `Math.sin(x * freq)` est-il stable entre frames ?

**Reponse** : OUI.
- Le bruit est calcule a partir de `this.x` et `this.y` (position de la boule)
- La position change legerement entre frames (deplacement = speed × dt)
- Le bruit change donc legerement entre frames → deviation progressive, pas de saut
- C'est **deterministe** : la meme position produit toujours le meme bruit
- Ce n'est PAS un vrai Perlin (pas de gradients interpoles) mais l'effet visuel est suffisant pour notre echelle (deviations de 3-8 px)

**Alternative** : utiliser une vraie fonction de bruit de Perlin (npm `simplex-noise`). OVERKILL pour notre usage.

### C.4 Verification : le backspin en 2 phases ne casse-t-il pas l'existant ?

**Question** : remplacer `retroBoost` constant par un modele en phases change-t-il le comportement pour les joueurs existants ?

**Reponse** : OUI, mais en mieux.
- **Sans retro** (retro=0) : aucun changement (retroMult reste 1.0)
- **Avec retro faible** (retro=0.3) : Phase 1 dure ~9 frames (150ms), friction ×2.5 → la boule s'arrete ~30% plus tot qu'avant. C'est PLUS realiste.
- **Avec retro fort** (retro=1.0) : Phase 1 dure 30 frames (500ms), friction ×5 → la boule s'arrete en ~3px au lieu de ~15px. C'est beaucoup plus puissant qu'avant, ce qui est CORRECT (l'ancien modele etait trop faible).
- **Transition** : en Phase 2, la friction retombe progressivement vers 1.0 → pas de saut brutal

**Breaking change** : oui, le `RETRO_FRICTION_MULT = 2.5` est remplace par `RETRO_PHASE1_MULT = 5.0`. Supprimer l'ancienne constante et mettre a jour les imports.

### C.5 Verification : la rafle sur sable (Infinity)

**Question** : `RAFLE_TERRAIN_PENALTY.sable = Infinity` ne va-t-il pas crasher ?

**Reponse** : NON, grace au check explicite :
```javascript
if (!isFinite(penalty)) {
    // Terrain incompatible
    ball.launch(vx * 0.2, vy * 0.2);
    return;
}
```
`isFinite(Infinity)` retourne `false` → le code entre dans le cas d'echec. Pas de multiplication par Infinity.

### C.6 Verification : interaction spin lateral + collision

**Question** : si une boule avec du spin lateral frappe une autre boule, que se passe-t-il ?

**Reponse** : `Ball.resolveCollision()` ne connait pas le spin — il utilise seulement les vitesses. Apres la collision, la boule a une nouvelle velocite et le spin continue de s'appliquer via `update()`. C'est correct :
1. Boule approche avec courbe (spin lateral actif)
2. Collision : velocites resolues par impulsion classique
3. Post-collision : le spin residuel continue de devier la boule
4. Si le spin est presque consomme, l'effet post-collision est negligeable

**Pas de code supplementaire necessaire.** La separation spin/collision est architecturalement saine.

### C.7 Verification : impact sur les predictions de trajectoire

**Question** : `Ball.simulateTrajectory()` (utilisee pour les dots de prediction) prend-elle en compte les nouvelles mecaniques ?

**Reponse** : NON. La methode statique (Ball.js:286-310) ne simule que la friction lineaire, pas :
- Le backspin en 2 phases
- Les irregularites terrain
- Le spin lateral

**Est-ce un probleme ?** NON. Le document research/25 (section C.2) recommande de RETIRER la prediction de trajectoire car elle rend le jeu trop facile. La prediction actuelle montre deja "trop" d'information. Les nouvelles mecaniques ajoutent de l'incertitude — c'est intentionnel.

**Si on veut quand meme une prediction plus precise** : modifier `simulateTrajectory()` pour accepter un objet `spinParams` optionnel. Mais c'est CONTRE l'esprit du jeu.

### C.8 Integration avec les animations de personnage existantes

Les animations de lancer (`_animateCharThrow` dans PetanqueEngine) ne sont PAS affectees par les nouvelles mecaniques. Le personnage fait son animation de lancer → puis la boule vole → puis les rebonds/spin s'appliquent. Pas de dependance.

---

## ANNEXE D : SOURCES PHYSIQUES

### D.1 Coefficient de restitution (COR)

| Materiaux | COR | Source |
|-----------|-----|--------|
| Acier-acier (boules petanque) | 0.55-0.70 | Engineering Toolbox, "Coefficients of Restitution" |
| Acier-bois (boule-cochonnet) | 0.40-0.55 | Kharaz & Gorham, "A study of the restitution coefficient in elastic-plastic impact" |
| Acier-terre seche | 0.10-0.20 | Kaneko et al., "Impact of a rigid sphere on a granular material" (Phys. Rev. E, 2014) |
| Acier-beton | 0.30-0.45 | NIST, "Impact Testing of Metals" |
| Acier-sable | 0.02-0.08 | Thornton & Ning, "A theoretical model for the stick/bounce of elastic spheres" (Powder Technology, 1998) |
| Acier-gazon | 0.05-0.15 | Estimation basee sur sol semi-meuble, interpolation terre-sable |

**Methodologie** : Les COR sol ne sont PAS mesures directement pour des boules de petanque. Ce sont des extrapolations de la litterature sur l'impact sphere-surface granulaire. Les valeurs sont calibrees pour le game feel, pas pour la precision scientifique absolue.

### D.2 Friction de roulement

| Surface | mu (coefficient) | Source |
|---------|-------------------|--------|
| Acier sur acier (roulement pur) | 0.001-0.003 | Engineering Toolbox |
| Acier sur terre battue | 0.02-0.04 | Estimation FIPJP, terrain norme |
| Acier sur herbe | 0.04-0.08 | Decathlon, "Surfaces de petanque" |
| Acier sur sable | 0.08-0.15 | Rolling Resistance Wikipedia (extrapole) |
| Acier sur beton/dalles | 0.005-0.02 | Engineering Toolbox (surface lisse) |

**Note** : Les valeurs en jeu (`FRICTION_BASE = 0.15`) sont BEAUCOUP plus elevees que les valeurs reelles. C'est intentionnel : l'echelle du jeu est comprimee (terrain 420px ≈ 15m reel) et les vitesses sont adaptees au gameplay.

### D.3 Backspin (effet retro)

**Sources :**
- Boulipedia : "Donner l'effet retro a une boule" — description de la technique de poignet
- Educnaute-infos : "Donner l'effet a une boule" (video + explication physique)
- Cross, Rod (2000). "The bounce of a ball." American Journal of Physics 67(3), pp. 222-227 — Modele physique du backspin au rebond. Montre que le spin arriere cree un couple de friction au contact sol qui oppose le deplacement.
- Domenech, A. (2005). "Non-smooth modelling of billiard and superbilliard interactions." International Journal of Mechanical Sciences 47, pp. 1079-1099 — Modele glissement/roulement pour spheres avec spin. Pertinent pour la transition phase 1 → phase 2.

**Simplification pour le jeu** : le modele en 2 phases est une approximation du modele continu de Domenech. En realite la transition glissement→roulement est continue, mais les 2 phases discretes produisent un game feel satisfaisant et sont beaucoup plus simples a implementer.

### D.4 Spin lateral

**Sources :**
- Boulipedia : "Donner l'effet lateral" — technique du lacher cote interne/externe de la main
- Cross, Rod (2005). "Bounce of a spinning ball near normal incidence." American Journal of Physics 73(10), pp. 914-920 — Montre que le spin lateral d'une sphere au contact d'une surface cree une force perpendiculaire proportionnelle a `mu × N × sin(theta_spin)`.
- En petanque reelle, la deviation laterale typique est de 10-30 cm sur 8m (source : Decathlon, guides de terrain). En pixels jeu : 3-9 px. Nos valeurs (3-18 px) sont legerement amplifiees pour le game feel.

### D.5 Irregularites de terrain

**Sources :**
- Observation empirique : tout terrain de petanque a des micro-irregularites
- Le "gratton" est un terme d'argot petanque documente par Gazette Petanque et Petanque Generation
- Modelisation : nous utilisons un bruit pseudo-sinusoidal, pas un vrai Perlin. La deviation est de l'ordre de 3-8 px sur terre (soit ~10-25 cm reel), coherent avec les observations de terrain
- Sport Coach VIP : "L'analyse du terrain" — decrit comment les joueurs cherchent la "donnee" en evitant les irregularites

### D.6 Vitesses et distances

| Donnee | Valeur reelle | Valeur jeu | Ratio | Source |
|--------|---------------|------------|-------|--------|
| Terrain longueur | 15 m | 420 px | 28 px/m | FIPJP reglementation |
| Terrain largeur | 4 m | 180 px | 45 px/m | FIPJP |
| Boule diametre | 75 mm | 20 px (r=10) | 267 px/m | Obut specifications |
| Vitesse pointage | 4-6 m/s | 3-5 px/frame | ~50 px/m/s | Biomecanique (Decathlon) |
| Vitesse tir | 13-16 m/s | 8-13 px/frame | ~55 px/m/s | Biomecanique |
| Distance cochonnet | 6-10 m | 168-280 px | 28 px/m | FIPJP |

**L'echelle n'est pas lineaire** — les boules sont proportionnellement plus grosses que le terrain (pour la visibilite). C'est un compromis gameplay standard.

---

## ANNEXE E : RISQUES ET MITIGATIONS

| Risque | Probabilite | Impact | Mitigation |
|--------|-------------|--------|------------|
| Backspin trop puissant (boule s'arrete sur place systematiquement) | Moyenne | Le pointage devient trop facile | Calibrer `RETRO_PHASE1_MULT` via playtesting. Commencer a 4.0, monter si trop faible. |
| Micro-rebonds sur dalles visuellement excessifs | Faible | Le joueur perd le controle | Capper `GROUND_COR.dalles` a 0.30 au lieu de 0.35 si les rebonds sont trop hauts |
| Rafle sur dalles trop puissante | Moyenne | Strategie dominante sur terrain dalles | Le `RAFLE_TERRAIN_PENALTY.dalles = 0.6` reduit la friction, mais la precision penalty (2.5) compense |
| Spin lateral invisible a l'ecran | Faible | Le joueur ne comprend pas pourquoi sa boule devie | Particules de spin (poussiere laterale) + fleche courbee pendant le drag |
| IA ne comprend pas les nouvelles techniques | Elevee | L'IA joue mal apres l'ajout des mecaniques | Section 9 couvre l'IA, mais il faut implementer APRES les techniques pour tester |
| Performance sur mobile (tweens enchaines) | Tres faible | Saccades pendant les rebonds | Max 6 tweens de 50-160ms, impact negligeable |

---

## ANNEXE F : GUIDE D'IMPLEMENTATION — POINTS D'INSERTION EXACTS

Ce guide mappe chaque modification a son point d'insertion exact dans le code, avec les lignes de reference, les imports a ajouter, et les precautions pour ne rien casser.

### F.0 Regles d'or

1. **Ne jamais supprimer une constante sans mettre a jour tous ses usages** — chercher via grep global avant
2. **Tester chaque sprint isolement** avant de passer au suivant
3. **Les imports doivent etre ajoutes dans le BON fichier** — 4 fichiers importent des constantes
4. **Les nouveaux presets de loft NE DOIVENT PAS etre ajoutes a LOFT_PRESETS** — ce tableau ne contient que les 3 techniques de pointage. Les tirs sont geres separement via LOFT_TIR.
5. **Chaque modification de Ball.update() doit etre testee avec le sub-stepping** — PetanqueEngine.update() divise le delta en substeps de max 4px/frame

### F.1 SPRINT 1 : Fondations

#### F.1.A — Resultats de tir (PetanqueEngine.js)

**Point d'insertion** : Remplacer `_detectShotResult()` (lignes 944-1023)

**Dependances a verifier** :
- `_shotCollisions` : tableau rempli dans la boucle de collision (ligne 852). Contient les Ball touchees. NE PAS MODIFIER.
- `_pendingCarreauChecks` : tableau avec `{thrownBall, targetOrigX, targetOrigY}`. Deja existant. Le reutiliser pour le palet corrige.
- `_showShotLabel(ball, text, color, fontSize)` : delegue a EngineRenderer. Deja existant, aucune modification.
- `this.lastShotWasTir` : booleen set dans throwBall(). NE PAS MODIFIER.
- `this._lastThrowAngle` : NOUVEAU, doit etre ajoute. Stocker l'angle du lancer dans throwBall().

**Nouvelle propriete a ajouter dans throwBall()** (ligne ~415) :
```javascript
this._lastThrowAngle = angle; // <-- AJOUTER apres this.lastShotWasTir = ...
```

**Import a ajouter dans Constants.js** :
```javascript
export const PALET_THRESHOLD = 50;
```

**Fichiers modifies** : PetanqueEngine.js (remplacement methode), Constants.js (1 constante)

**Ce qui ne change PAS** : Ball.resolveCollision(), _checkCarreau(), _celebrateCarreau(), le flow collision dans update()

**Test** : Tirer 20 fois sur des boules adverses. Verifier :
- Carreau : boule tiree reste < 28px du point d'impact → "CARREAU !" (existant, inchange)
- Palet : boule tiree reste 28-50px du point d'impact → "Palet !"
- Casquette : cible bouge < 0.5 px/frame → "Casquette..."
- Recul : boule tiree recule (projection < -3px sur axe de lancer) → "Recul"
- Contre : touche une boule alliee → "Contre !"
- Ciseau : touche 2+ boules adverses → "CISEAU !!"
- Biberon : boule pointee touche le cochonnet → "BIBERON !" (existant, inchange)

---

#### F.1.B — Irregularites terrain (Ball.js)

**Point d'insertion** : Dans `Ball.update()`, APRES la friction (ligne ~197, apres `this.vy *= ratio;`), AVANT le deplacement (ligne ~227 `this.x += ...`)

**Pourquoi a cet endroit** : le bruit doit modifier la velocite AVANT que la position soit mise a jour, sinon on decale la boule sans modifier sa trajectoire.

**Proprietes necessaires sur Ball** :
- `this._terrainType` : NOUVEAU. Doit etre passe dans les options du constructeur.
  - Actuellement, Ball recoit `terrain` (objet terrain data) et `bounds`. Il ne recoit PAS `terrainType` (string).
  - **Modification du constructeur** (Ball.js ligne 9) : ajouter `this._terrainType = options.terrainType || 'terre';`
  - **Modification de throwBall** (PetanqueEngine.js ligne 359) : ajouter `terrainType: this.terrainType` dans les options de Ball.
  - **Modification de throwCochonnet** (PetanqueEngine.js ligne ~290) : meme ajout.

**Imports a ajouter** :
```javascript
// Ball.js — ajouter aux imports existants
import { ..., TERRAIN_NOISE_BASE, TERRAIN_ROUGHNESS, NOISE_SPEED_MIN } from '../utils/Constants.js';
```

**Constants.js** : ajouter les 3 constantes (voir Annexe A du document principal)

**Ce qui ne change PAS** : la friction, les zones, les pentes, les murs, le draw()

**Verification sub-stepping** : le bruit est proportionnel a `cappedDt * 60`, donc il fonctionne correctement avec les substeps car le delta est divise.

**Test** :
- 10 roulettes sur terre → deviation visible (3-8px)
- 10 roulettes sur dalles → deviation quasi nulle (<1px)
- 10 roulettes sur gravier → deviation forte (8-20px)
- 10 tirs au fer → AUCUNE deviation (la boule vole, pas de roulement)

---

#### F.1.C — Backspin avance (Ball.js)

**Point d'insertion** : Remplacer le bloc retro dans Ball.update() (lignes 191-192)

**Code actuel a remplacer** :
```javascript
// LIGNE 191-192 actuelles :
const retroBoost = this.retro > 0 ? 1 + this.retro * RETRO_FRICTION_MULT : 1;
const frictionDecel = FRICTION_BASE * effectiveFriction * retroBoost * 60;
```

**Par** :
```javascript
// Backspin en 2 phases
let retroMult = 1.0;
if (this._retroPhase === 1) {
    retroMult = 1 + (RETRO_PHASE1_MULT - 1) * this.retro * this._retroTerrainEff;
    this._retroFrames--;
    if (this._retroFrames <= 0) {
        this._retroPhase = 2;
        this._retroFrames = RETRO_PHASE2_FRAMES;
    }
} else if (this._retroPhase === 2) {
    const t = this._retroFrames / RETRO_PHASE2_FRAMES;
    const peak = 1 + (RETRO_PHASE1_MULT - 1) * this.retro * this._retroTerrainEff;
    retroMult = 1.0 + (peak - 1.0) * t;
    this._retroFrames--;
    if (this._retroFrames <= 0) {
        this._retroPhase = 0;
        this.retro = 0;
    }
}
const frictionDecel = FRICTION_BASE * effectiveFriction * retroMult * 60;
```

**Nouvelles proprietes dans le constructeur** (ligne ~30, apres `this.retro = 0;`) :
```javascript
this._retroPhase = 0;
this._retroFrames = 0;
this._retroTerrainEff = 1;
```

**Nouvelle methode sur Ball** :
```javascript
activateRetro(intensity, terrainType) {
    if (intensity <= 0) return;
    this.retro = intensity;
    this._retroPhase = 1;
    this._retroFrames = Math.round(RETRO_PHASE1_FRAMES * intensity);
    this._retroTerrainEff = RETRO_TERRAIN_EFF[terrainType] || 1.0;
}
```

**Modification de PetanqueEngine._animateThrow()** (ligne 556) :
Le retro est actuellement set AVANT le vol (`ball.retro = baseRetro * ...` a la ligne 372). Il faut ACTIVER le backspin en phases APRES l'atterrissage :
```javascript
// LIGNE 556 : ball.launch(rollVx, rollVy);
// AJOUTER JUSTE AVANT :
if (ball.retro > 0) {
    ball.activateRetro(ball.retro, this.terrainType);
}
ball.launch(rollVx, rollVy);
```

**Import a modifier** :
```javascript
// Ball.js — remplacer RETRO_FRICTION_MULT par les nouvelles constantes
import {
    FRICTION_BASE, SPEED_THRESHOLD, RESTITUTION_BOULE,
    RESTITUTION_COCHONNET, BALL_RADIUS, BALL_MASS,
    PREDICTION_STEPS, PREDICTION_SAMPLE_RATE,
    RETRO_PHASE1_MULT, RETRO_PHASE1_FRAMES, RETRO_PHASE2_FRAMES,
    RETRO_TERRAIN_EFF, WALL_RESTITUTION
} from '../utils/Constants.js';
```

**Constants.js** : supprimer `RETRO_FRICTION_MULT`, ajouter les 4 nouvelles constantes retro.

**Impact sur AimingSystem** : AUCUN. L'AimingSystem set `retroIntensity` et le passe a throwBall(). Le modele en phases est transparent pour l'UI.

**Impact sur PetanqueAI** : AUCUN. L'IA set `retroIntensity` de la meme maniere. Le modele en phases est transparent.

**Impact sur simulateTrajectory** : la prediction statique ne simule PAS le retro (elle utilise seulement la friction de base). C'est intentionnel — la prediction ne doit pas montrer l'effet du retro (sinon le jeu est trop facile).

**Test** :
- Plombee + retro max sur terre → boule roule ~5px (au lieu de ~40px avant)
- Plombee + retro max sur sable → boule s'arrete quasi-instantanement
- Plombee + retro max sur dalles → boule roule ~20px (dalles resistrent au spin)
- Plombee SANS retro → comportement IDENTIQUE a avant (retroMult = 1.0)
- Demi-portee sans retro → IDENTIQUE a avant

---

### F.2 SPRINT 2 : Nouvelles techniques

#### F.2.A — Rafle (Constants.js + PetanqueEngine.js + AimingSystem.js + Ball.js)

**Constants.js** : ajouter `LOFT_RAFLE` et `RAFLE_TERRAIN_PENALTY` (voir Annexe A). **NE PAS ajouter a LOFT_PRESETS** — la rafle est un tir, pas un pointage.

**computeThrowParams** (PetanqueEngine.js:328) — fix critique :
```javascript
// AVANT :
const isTir = loftPreset.id === 'tir';
// APRES :
const isTir = !!(loftPreset.isTir || loftPreset.id === 'tir');
```
Ce fix est NECESSAIRE pour que la rafle et le tir devant utilisent `maxDist * 0.95` au lieu de `0.85`.

**_animateThrow** (PetanqueEngine.js:444) — meme fix :
```javascript
// AVANT :
const isTir = loftPreset.id === 'tir';
// APRES :
const isTir = !!(loftPreset.isTir || loftPreset.id === 'tir');
```

**throwBall** (PetanqueEngine.js:350) — ajouter le flag rafle sur la boule :
```javascript
// Apres ball.launch() ou dans le setup de la boule :
if (loft.id === 'rafle') {
    // Verifier terrain
    const penalty = RAFLE_TERRAIN_PENALTY[this.terrainType];
    if (penalty && !isFinite(penalty)) {
        this._showMessage('Impossible sur ce terrain !');
        // Reduire drastiquement la vitesse
        rollVx *= 0.15;
        rollVy *= 0.15;
    } else if (penalty) {
        ball.frictionMult *= penalty;
    }
    ball._isRafle = true;
}
```

**Ball.js** : dans update(), apres le bruit de terrain (section F.1.B), le flag `_isRafle` amplifie le bruit ×3. Pas de code supplementaire si le bruit utilise deja un multiplicateur.

**AimingSystem.js** — sous-menu de tir :
Actuellement, quand le joueur appuie sur [T], `_selectCombined(3)` active directement le tir au fer. Il faut ajouter un sous-choix :

**Option A (simple)** : ajouter la rafle comme 5eme option dans `_showShotModeChoice()` :
```javascript
const allOptions = [
    { label: '1', sublabel: 'Roulette', mode: 'pointer', loft: 0, color: 0x87CEEB, arcH: 0.08 },
    { label: '2', sublabel: 'Demi-portee', mode: 'pointer', loft: 1, color: 0x6B8E4E, arcH: 0.35 },
    { label: '3', sublabel: 'Plombee', mode: 'pointer', loft: 2, color: 0x9B7BB8, arcH: 0.75 },
    { label: 'T', sublabel: 'Tirer', mode: 'tirer', loft: -1, color: 0xC44B3F, arcH: 0.55 },
    { label: 'R', sublabel: 'Rafle', mode: 'tirer', loft: -2, color: 0xDD8844, arcH: 0.05 }
];
```

Et dans `_selectCombined()` :
```javascript
if (opt.mode === 'tirer') {
    this.shotMode = 'tirer';
    if (opt.loft === -2) {
        this.loftPreset = LOFT_RAFLE; // nouvelle import
    } else {
        this.loftPreset = LOFT_TIR;
    }
    this._highlightOpponentBalls();
    // ...
}
```

**Imports a ajouter** :
```javascript
// AimingSystem.js :
import { ..., LOFT_RAFLE } from '../utils/Constants.js';
// PetanqueEngine.js :
import { ..., LOFT_RAFLE, RAFLE_TERRAIN_PENALTY } from '../utils/Constants.js';
```

**Ball.resolveCollision** : ajouter la dispersion chaotique de la rafle (voir section 6.3 du document principal). C'est un ajout de ~8 lignes dans la methode existante, APRES le calcul d'impulse et AVANT la separation.

---

#### F.2.B — Carreau avance (PetanqueEngine.js)

**Point d'insertion** : Remplacer `_checkCarreau()` (lignes 911-928)

**Modification de _celebrateCarreau** (ligne 930) : ajouter le parametre `subtype` :
```javascript
// AVANT :
_celebrateCarreau(ball) {
// APRES :
_celebrateCarreau(ball, subtype = 'standard') {
```

**Modification de EngineRenderer.celebrateCarreau** : ajouter le parametre texte :
```javascript
// AVANT :
celebrateCarreau(ball) {
// APRES :
celebrateCarreau(ball, text = 'CARREAU !') {
```
Et utiliser `text` au lieu du string hardcode dans la methode.

**Constants.js** : ajouter `CARREAU_PERFECT_THRESHOLD = 8`

**Ce qui ne change PAS** : Ball.resolveCollision(), _pendingCarreauChecks, le tracking de collision

---

### F.3 SPRINT 3 : Physique avancee

#### F.3.A — Micro-rebonds (PetanqueEngine.js)

**C'est le changement le plus invasif** — il modifie le flow de `_animateThrow`.

**Architecture** : Le code actuel fait vol → ball.launch(). Les rebonds s'inserent ENTRE les deux.

**Point d'insertion** : Dans `_animateThrow` → `onComplete` (ligne 508-557)

**Le refactoring** : extraire le code post-atterrissage dans une methode `_onBallLand()` :

```javascript
// AVANT (ligne 508-557) : un gros bloc onComplete
onComplete: () => {
    // ... destroy fly sprites ...
    // ... set position ...
    // ... check collision ...
    // ... dust, trace, sfx ...
    ball.launch(rollVx, rollVy);
    if (callback) callback();
}

// APRES : split en 2 methodes
onComplete: () => {
    // ... destroy fly sprites ...
    // ... set position ...
    // ... check collision at landing ...
    // ... sfx, dust, trace (existant) ...

    // NOUVEAU : calcul et animation des rebonds
    const bounces = this._computeBounces(
        rollingSpeed, loftPreset.id, this.terrainType,
        ball.retro, throwAngle
    );

    this._animateBounces(ball, bounces, () => {
        // Activer le backspin en phases
        if (ball.retro > 0) {
            ball.activateRetro(ball.retro, this.terrainType);
        }
        ball.launch(rollVx, rollVy);
        if (callback) callback();
    });
}
```

**Nouvelles methodes** : `_computeBounces()` et `_animateBounces()` (voir section 3 du document principal)

**Risque** : le callback `callback()` est crucial — il declenche `_checkCarreau()`, `_detectShotResult()`, et la transition d'etat. S'assurer qu'il est toujours appele, meme si les rebonds echouent.

**Fallback de securite** :
```javascript
_animateBounces(ball, bounces, onComplete) {
    if (!bounces || bounces.length === 0) {
        onComplete();
        return; // Pas de rebonds → comportement inchange
    }
    // ...
}
```

---

#### F.3.B — Tir devant (Constants.js + PetanqueEngine.js + AimingSystem.js)

**Le tir devant reutilise le systeme de rebonds** (Sprint 3A). Il doit donc etre implemente APRES.

**Constants.js** : ajouter `LOFT_TIR_DEVANT` et `GROUND_COR` (si pas deja fait pour les rebonds)

**AimingSystem.js** : ajouter comme option de tir (similaire a la rafle dans Sprint 2A). Le joueur choisit [T] Fer, [D] Devant, ou [R] Rafle.

**PetanqueEngine.throwBall** : quand le loft est tir_devant, le `targetX/Y` doit etre ajuste pour atterrir AVANT la cible. Il faut :
1. Trouver la boule cible la plus proche dans la direction visee
2. Calculer le point d'atterrissage 8px avant
3. Passer ce point a _animateThrow au lieu du point calcule par computeThrowParams

**Impact sur computeThrowParams** : AUCUN si on gere le landing offset dans throwBall plutot que dans la methode statique.

---

### F.4 SPRINT 4 : Depth

#### F.4.A — Spin lateral (Ball.js + AimingSystem.js)

**Ball.js** :
- Ajouter `this.spin = { lateral: 0, intensity: 0 }` dans le constructeur
- Ajouter le code de force laterale dans update(), APRES le bruit de terrain et APRES la friction
- L'ordre est important : friction d'abord, puis bruit terrain, puis spin lateral
  Sinon le spin serait freine par la friction avant d'agir

**AimingSystem.js** :
- Ajouter les controles [Q]/[E] dans la zone de retro toggle
- Modifier `_drawArrow` pour dessiner une courbe si lateral ≠ 0
- Passer `lateralSpin` et `lateralIntensity` a `engine.throwBall()` via un nouveau parametre dans throwMeta

**PetanqueEngine.throwBall** : lire `throwMeta.lateralSpin` et l'appliquer a `ball.spin.lateral`

**PetanqueAI** : ajouter la logique de choix de spin (section 9.4 du document principal). C'est OPTIONNEL pour le Sprint 4 — l'IA peut ignorer le spin lateral dans un premier temps.

#### F.4.B — Integration IA (PetanqueAI.js + CompletStrategy.js)

**PetanqueAI._throwBall()** : modifier le choix de loft pour utiliser `_chooseTirTechnique()` au lieu de toujours LOFT_TIR.

**Imports a ajouter** :
```javascript
// PetanqueAI.js :
import { ..., LOFT_RAFLE, LOFT_TIR_DEVANT, RAFLE_TERRAIN_PENALTY, GROUND_COR } from '../utils/Constants.js';
```

**CompletStrategy._optimalLoft()** : ajouter la logique terrain (section 9.5 du document principal)

---

### F.5 Checklist pre-implementation par fichier

#### Constants.js — TOUTES les modifications

```
SUPPRIMER :
  - RETRO_FRICTION_MULT (ligne 78) → remplace par RETRO_PHASE1_MULT etc.

AJOUTER (Sprint 1) :
  - PALET_THRESHOLD = 50
  - RETRO_PHASE1_MULT = 5.0
  - RETRO_PHASE1_FRAMES = 30
  - RETRO_PHASE2_FRAMES = 18
  - RETRO_TERRAIN_EFF = { terre: 1.0, herbe: 1.3, sable: 2.0, dalles: 0.4, gravier: 0.9 }
  - TERRAIN_NOISE_BASE = 0.003
  - TERRAIN_ROUGHNESS = { terre: 1.0, herbe: 1.5, sable: 0.3, dalles: 0.05, gravier: 2.5 }
  - NOISE_SPEED_MIN = 0.5

AJOUTER (Sprint 2) :
  - CARREAU_PERFECT_THRESHOLD = 8
  - LOFT_RAFLE = { ... }
  - RAFLE_TERRAIN_PENALTY = { ... }

AJOUTER (Sprint 3) :
  - GROUND_COR = { terre: 0.15, herbe: 0.09, sable: 0.05, dalles: 0.35, gravier: 0.11 }
  - INCIDENCE_ANGLE = { roulette: 0.10, demi_portee: 0.55, plombee: 0.90, tir: 0.70, ... }
  - BOUNCE_MIN_VY = 0.6
  - MAX_BOUNCES = 3
  - LOFT_TIR_DEVANT = { ... }

AJOUTER (Sprint 4) :
  - LATERAL_FORCE = 0.06
  - SPIN_DECAY = 0.004
  - LATERAL_MIN_EFFET = 4
  - SPIN_TERRAIN_MULT = { ... }

MODIFIER (Sprint 2) :
  - Ligne 328 (computeThrowParams) : isTir = !!(loftPreset.isTir || loftPreset.id === 'tir')
```

#### Ball.js — TOUTES les modifications

```
CONSTRUCTEUR :
  Sprint 1 : + this._terrainType, this._retroPhase, this._retroFrames, this._retroTerrainEff
  Sprint 2 : + this._isRafle = false
  Sprint 4 : + this.spin = { lateral: 0, intensity: 0 }

METHODES AJOUTEES :
  Sprint 1 : + activateRetro(intensity, terrainType)

UPDATE() — ordre des operations :
  1. Slope gravity (existant, inchange)
  2. Dynamic friction zones (existant, inchange)
  3. Speed calculation (existant, inchange)
  4. Backspin en 2 phases (Sprint 1, REMPLACE retroBoost)
  5. Friction deceleration (existant, formule inchangee mais retroMult remplace retroBoost)
  6. Irregularites terrain (Sprint 1, APRES friction, AVANT deplacement)
  7. Spin lateral (Sprint 4, APRES irregularites)
  8. Position update x += vx * dt * 60 (existant, inchange)
  9. Wall rebounds (existant, inchange)
  10. Draw (existant, inchange)

RESOLVECOLLISION() :
  Sprint 2 : + dispersion rafle (8 lignes apres le calcul d'impulse)

IMPORTS :
  Sprint 1 : remplacer RETRO_FRICTION_MULT par RETRO_PHASE1_MULT, RETRO_PHASE1_FRAMES, etc.
  Sprint 1 : + TERRAIN_NOISE_BASE, TERRAIN_ROUGHNESS, NOISE_SPEED_MIN
  Sprint 4 : + LATERAL_FORCE, SPIN_DECAY, SPIN_TERRAIN_MULT
```

#### PetanqueEngine.js — TOUTES les modifications

```
THROWBALL() :
  Sprint 1 : + this._lastThrowAngle = angle
  Sprint 1 : + options.terrainType dans Ball constructor
  Sprint 2 : + gestion loft rafle (terrain check, flag _isRafle)
  Sprint 3 : + gestion loft tir_devant (landing offset)

COMPUTETHROWPARAMS() :
  Sprint 2 : isTir = !!(loftPreset.isTir || ...)

_ANIMATETHROW() :
  Sprint 2 : isTir = !!(loftPreset.isTir || ...)
  Sprint 1 : + appel activateRetro() avant ball.launch() (ligne 556)
  Sprint 3 : + appel _computeBounces() + _animateBounces() dans onComplete

_DETECTSHOTRESULT() :
  Sprint 1 : remplacement complet de la methode

_CHECKCARREAU() :
  Sprint 2 : ajout detection subtype (parfait/allonge/recul)

_CELEBRATECARREAU() :
  Sprint 2 : + parametre subtype

METHODES AJOUTEES :
  Sprint 3 : + _computeBounces(), + _animateBounces()

IMPORTS :
  Sprint 1 : + PALET_THRESHOLD
  Sprint 2 : + LOFT_RAFLE, RAFLE_TERRAIN_PENALTY, CARREAU_PERFECT_THRESHOLD
  Sprint 3 : + GROUND_COR, INCIDENCE_ANGLE, BOUNCE_MIN_VY, MAX_BOUNCES, LOFT_TIR_DEVANT
```

#### AimingSystem.js — TOUTES les modifications

```
Sprint 2 : + LOFT_RAFLE dans imports
Sprint 2 : + option Rafle dans allOptions de _showShotModeChoice()
Sprint 2 : + logique de selection dans _selectCombined()
Sprint 3 : + LOFT_TIR_DEVANT dans imports
Sprint 3 : + option Tir Devant dans allOptions
Sprint 4 : + controles spin lateral [Q]/[E]
Sprint 4 : + fleche courbee dans update() quand lateral ≠ 0
Sprint 4 : + passage lateralSpin dans throwMeta
```

#### PetanqueAI.js — TOUTES les modifications

```
Sprint 4 : + imports LOFT_RAFLE, LOFT_TIR_DEVANT, GROUND_COR, RAFLE_TERRAIN_PENALTY
Sprint 4 : + _chooseTirTechnique() — nouveau choix de technique de tir
Sprint 4 : + _chooseRetro() amélioré — remplace la decision aleatoire
Sprint 4 : + modification de _throwBall() pour appeler les nouvelles methodes
```

#### EngineRenderer.js — TOUTES les modifications

```
Sprint 2 : celebrateCarreau(ball, text) — ajouter parametre text
```

---

### F.6 Ordre d'execution des tests par sprint

**Sprint 1** (apres implementation, avant merge) :
```
1. npm run dev → pas d'erreur de compilation
2. Lancer une partie sur terrain terre → jeu fonctionnel
3. Pointer 5 boules → le jeu tourne normalement (pas de regression)
4. Tirer 5 fois → resultats corrects (carreau, palet, recul, casquette)
5. Verifier biberon (pointer sur le cochonnet)
6. Verifier irregularites : roulette sur terre vs dalles
7. Verifier backspin : plombee + retro max → arret rapide
8. Verifier backspin sans retro → comportement identique a avant
9. Jouer une partie complete sur chaque terrain (village, plage, parc, docks, colline)
10. IA joue normalement (pas de crash)
```

**Sprint 2** :
```
1. Rafle disponible dans le menu de tir
2. Rafle sur terre → boule fonce au sol
3. Rafle sur sable → message d'erreur "Impossible"
4. Rafle sur dalles → boule tres rapide
5. Rafle touche un groupe → dispersion chaotique
6. Carreau parfait detecte (<8px) → celebration renforcee
7. Carreau allonge/recul distingue
8. Palet detecte (28-50px du point d'impact, pas du cochonnet)
```

**Sprint 3** :
```
1. Plombee sur terre → 1-2 rebonds visibles (2-4px hauteur)
2. Plombee sur dalles → 2-3 rebonds visibles (8-15px)
3. Plombee sur sable → 0 rebonds, boule s'enfonce
4. Demi-portee → 1 petit rebond
5. Roulette → 0 rebonds
6. Tir devant sur terre → rebond + frappe cible
7. Tir devant sur dalles → echec 25% du temps (message "Rebond trop haut !")
8. Partie complete sur chaque terrain sans regression
```

**Sprint 4** :
```
1. Spin lateral disponible quand effet >= 4
2. [Q] gauche, [E] droite → fleche courbee
3. Demi-portee + spin gauche → boule courbe a gauche
4. IA tireur fait parfois des rafles
5. IA ne fait jamais de tir devant sur dalles
6. Partie complete IA vs joueur → IA utilise les nouvelles techniques
```

---

*Document genere le 18 mars 2026. Revision critique apres audit du code reel.*
*Inclut : audit code, specifications physiques, faisabilite, sources, risques, guide d'implementation.*
