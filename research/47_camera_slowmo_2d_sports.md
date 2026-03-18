# 47 — Camera & Slow-Motion dans les Jeux 2D Sport/Action

> A lire quand : on code le camera follow, le slow-mo sur les carreaux, le screen shake, ou le zoom dynamique.
> Complementaire a : research/14 (polish Phaser 3), research/22 (faisabilite), research/20 (plan 6 etapes)

---

## 1. SLOW-MOTION DANS LES JEUX 2D

### 1.1 References et implementation

| Jeu | Technique | Duree | Facteur | Ce qu'on en retient |
|-----|----------|-------|---------|-------------------|
| **Celeste** | Freeze frame sur dash | 50ms | 0.0 (arret total) | Ultra-court = impactant sans casser le flow |
| **Katana Zero** | Slow-mo permanent (ability) | Toggle | 0.1-0.3 | Le joueur controle le slow-mo = agency |
| **Hyper Light Drifter** | Hitstop sur impact | 60-80ms | 0.0 | Chaque coup "pese" grace au hitstop |
| **Nuclear Throne** | Screen shake + flash + hitstop | 30-50ms | 0.0 | Combinaison de feedback = puissance maximale |
| **Super Smash Bros** | Freeze sur KO | 100-200ms | 0.0 | Le moment cle est souligne dramatiquement |
| **Wii Sports Bowling** | Slow-mo quand la boule approche les quilles | 500ms-1s | 0.3 | Tension + anticipation du resultat |

### 1.2 Hitstop — Le secret du game feel

**Definition** : gel complet du jeu pendant quelques frames apres un impact.

| Intensite impact | Duree hitstop | Cas PM |
|-----------------|--------------|--------|
| Leger | 0-30ms (0-2 frames) | Boule qui s'arrete naturellement |
| Moyen | 30-60ms (2-4 frames) | Collision boule-boule |
| Fort | 60-100ms (4-6 frames) | Collision forte (tir) |
| Dramatique | 100-200ms (6-12 frames) | CARREAU |

### 1.3 Implementation Phaser 3 — Delta scaling

```javascript
// Approche 1 : Multiplier le delta (recommande pour PM)
class PetanqueScene extends Phaser.Scene {
  constructor() {
    super('PetanqueScene');
    this.timeScale = 1.0; // 1.0 = normal, 0.3 = slow-mo, 0.0 = freeze
  }

  update(time, delta) {
    const scaledDelta = delta * this.timeScale;
    // Passer scaledDelta a la physique
    this.ball.update(scaledDelta);
    this.cochonnet.update(scaledDelta);
  }

  // Hitstop (freeze complet)
  hitstop(durationMs) {
    this.timeScale = 0;
    this.time.delayedCall(durationMs, () => {
      this.timeScale = 1;
    });
  }

  // Slow-mo progressif (pour les carreaux)
  slowMotion(factor, durationMs, easeBack = true) {
    this.timeScale = factor;
    if (easeBack) {
      this.tweens.addCounter({
        from: factor * 100,
        to: 100,
        duration: durationMs,
        ease: 'Quad.easeIn',
        onUpdate: (tween) => {
          this.timeScale = tween.getValue() / 100;
        }
      });
    } else {
      this.time.delayedCall(durationMs, () => {
        this.timeScale = 1;
      });
    }
  }
}
```

### 1.4 Sequence "Carreau Dramatique" — Timeline complete

```
T+0ms    : Boule touche la boule adverse
T+0ms    : HITSTOP 100ms (timeScale = 0)
T+0ms    : Screen shake (intensity 0.005, 150ms)
T+0ms    : Flash blanc (50ms)
T+0ms    : SFX "carreau_clac" (son metallique)
T+100ms  : SLOW-MO commence (timeScale = 0.2)
T+100ms  : Camera zoom in (zoom 1.0 → 1.3, 400ms)
T+100ms  : Particules "eclats" (20 particules dorees)
T+100ms  : Texte "CARREAU !" apparait (scale 0→1.5→1, Elastic 400ms)
T+600ms  : SLOW-MO ease back (0.2 → 1.0, 500ms, Quad.easeIn)
T+600ms  : Camera zoom out (1.3 → 1.0, 500ms)
T+1100ms : Retour a la normale
```

**Duree totale : ~1.1 seconde.** Assez pour etre epique, pas assez pour etre ennuyeux.

### 1.5 Quand NE PAS faire de slow-mo

| Situation | Pourquoi pas | Alternative |
|-----------|-------------|------------|
| Chaque collision boule-boule | Trop frequent, lasse le joueur | Hitstop court (30ms) seulement |
| Boule qui s'arrete sans rien toucher | Pas dramatique | Rien, ou leger zoom |
| Cochonnet deplace | Important mais pas "epic" | Camera pan vers le cochonnet |
| Pendant le drag de visee | Casse le rythme du joueur | Jamais de slow-mo en input |
| Score qui change | C'est de l'UI, pas du gameplay | Animation de score bounce |

---

## 2. CAMERA EFFECTS EN 2D TOP-DOWN

### 2.1 Camera lerp — Valeurs de reference

Le lerp (linear interpolation) controle la "fluidite" du suivi camera.

| Valeur lerp | Sensation | Usage |
|------------|-----------|-------|
| 0.02-0.04 | Tres smooth, paresseux | Exploration calme |
| 0.05-0.08 | Smooth avec reactivite | **RECOMMANDE pour PM** |
| 0.08-0.12 | Reactif, suit bien | Jeux d'action rapides |
| 0.15-0.25 | Quasi-instantane | Camera "rigide" |
| 1.0 | Pas de lerp | Lock 1:1 (pas de smooth) |

**Pour PM** : `lerp: 0.06` quand la boule roule, `lerp: 0.03` quand la boule ralentit (creer de la tension).

```javascript
// Camera follow dynamique base sur la vitesse
const speed = this.ball.getSpeed();
const lerp = Phaser.Math.Clamp(0.03 + speed * 0.01, 0.03, 0.1);
this.cameras.main.startFollow(this.cameraTarget, true, lerp, lerp);
```

### 2.2 Camera shake — Intensite par impact

| Impact | Intensite | Duree | Code Phaser |
|--------|----------|-------|-------------|
| Collision legere | 0.001 | 100ms | `camera.shake(100, 0.001)` |
| Collision forte | 0.003 | 150ms | `camera.shake(150, 0.003)` |
| Carreau | 0.005 | 200ms | `camera.shake(200, 0.005)` |
| "MATCH!" texte VS | 0.003 | 200ms | `camera.shake(200, 0.003)` |
| Victoire | 0.002 | 300ms | `camera.shake(300, 0.002)` |

**Regles** :
- Intensite 0.001 = 1 pixel de deplacement max (subtil)
- Intensite 0.005 = 4-5 pixels (fort)
- Intensite > 0.01 = generalement trop (nausee)
- Toujours verifier `settings.screenShake` avant (accessibilite)

### 2.3 Zoom dynamique

| Situation | Zoom | Duree | Easing |
|-----------|------|-------|--------|
| Vue d'ensemble (debut mene) | 1.0 | — | — |
| Boule en vol | 1.0 → 1.1 | 300ms | Quad.easeOut |
| Boule ralentit pres du cochonnet | 1.1 → 1.3 | 500ms | Sine.easeInOut |
| Carreau | 1.0 → 1.4 | 400ms | Back.easeOut |
| Retour vue d'ensemble | → 1.0 | 600ms | Quad.easeOut |

```javascript
// Zoom progressif base sur la distance au cochonnet
const distToCochonnet = Phaser.Math.Distance.Between(
  ball.x, ball.y, cochonnet.x, cochonnet.y
);
const zoomTarget = distToCochonnet < 100 ? 1.3 : 1.0;
this.cameras.main.zoomTo(zoomTarget, 400);
```

### 2.4 Pan cinematique

Apres chaque lancer, montrer ou la boule a atterri par rapport au cochonnet :

```javascript
// Sequence : camera suit la boule → pan vers cochonnet → retour
async cinematicPan() {
  // 1. Suivre la boule pendant le vol/roulement (automatique)
  // 2. Quand la boule s'arrete :
  this.cameras.main.stopFollow();

  // 3. Pan vers le cochonnet (montrer le resultat)
  this.cameras.main.pan(
    this.cochonnet.x, this.cochonnet.y,
    800, 'Quad.easeInOut'
  );

  await this.delay(1200);

  // 4. Afficher la distance
  this.showDistanceIndicator(ball, cochonnet);

  await this.delay(1000);

  // 5. Retour a la vue d'ensemble
  this.cameras.main.pan(
    TERRAIN_CENTER_X, TERRAIN_CENTER_Y,
    600, 'Quad.easeOut'
  );
}
```

### 2.5 Vignette (assombrissement des bords)

Pour les moments de tension (match point, derniere boule) :

```javascript
// Vignette via un sprite overlay
const vignette = this.add.image(400, 240, 'vignette_overlay')
  .setScrollFactor(0)
  .setDepth(9998)
  .setAlpha(0);

// Activer la vignette a match point
if (isMatchPoint) {
  this.tweens.add({
    targets: vignette,
    alpha: 0.4,
    duration: 1000,
    ease: 'Sine.easeIn'
  });
}
```

La texture `vignette_overlay` est un radial gradient noir transparent au centre, opaque aux bords (genere une fois dans un CanvasTexture).

---

## 3. LE "JUICE" DANS LES JEUX DE BOULES

### 3.1 Wii Sports Bowling — La reference

**Sequence du lancer** :
1. Le joueur lance (input)
2. Camera 3/4 arriere suit la boule
3. Quand la boule approche les quilles → slow-mo leger
4. Impact → camera switch (vue laterale)
5. Quilles tombent → screen shake proportionnel
6. Score affiché avec animation

**Ce qu'on en retient** : le **changement d'angle camera** a l'impact cree un moment cinematique. En 2D top-down on ne peut pas changer d'angle, mais on peut **zoomer** a l'impact.

### 3.2 Golf games (What the Golf, Golf Story)

**Camera follow sur la balle** :
- Pendant le vol : camera suit la balle (lerp rapide)
- Au sol : camera ralentit avec la balle (lerp decroissant)
- La balle s'arrete : camera pan vers le trou/drapeau (reaction shot)
- Score affiche : distance / par

**Adaptation PM** : identique. La boule vole → la boule roule et ralentit → pan vers le cochonnet → distance affichee.

### 3.3 Combinaison d'effets — Recette PM

**Moment ordinaire** (boule se pose tranquillement) :
```
Roll → Camera follow (lerp 0.06) → Stops → Distance text (2s) → Done
```

**Moment bon** (boule proche du cochonnet) :
```
Roll → Camera follow → Zoom in (1.2) → Stops → "BEAU TIR!" text → Zoom out → Done
```

**Moment EPIC** (carreau) :
```
Roll → Camera follow → Hitstop 100ms → Flash → Shake → Slow-mo 500ms →
Zoom in (1.4) → "CARREAU!" + particles → Slow-mo ease back → Zoom out → Done
```

---

## 4. IMPLEMENTATION PHASER 3

### 4.1 Classe CameraEffects

```javascript
// src/utils/CameraEffects.js
export class CameraEffects {
  constructor(scene) {
    this.scene = scene;
    this.cam = scene.cameras.main;
  }

  // Hitstop (freeze le jeu)
  hitstop(ms = 60) {
    if (!this.scene.settings?.screenShake) return;
    this.scene.timeScale = 0;
    this.scene.time.delayedCall(ms, () => { this.scene.timeScale = 1; });
  }

  // Slow-mo avec ease back
  slowmo(factor = 0.3, durationMs = 500) {
    this.scene.timeScale = factor;
    this.scene.tweens.addCounter({
      from: factor * 100, to: 100,
      duration: durationMs, ease: 'Quad.easeIn',
      onUpdate: (t) => { this.scene.timeScale = t.getValue() / 100; }
    });
  }

  // Shake (avec check accessibilite)
  shake(intensity = 0.003, duration = 150) {
    if (!this.scene.settings?.screenShake) return;
    this.cam.shake(duration, intensity);
  }

  // Flash (avec check accessibilite)
  flash(duration = 100, r = 255, g = 255, b = 255) {
    if (!this.scene.settings?.screenFlash) return;
    this.cam.flash(duration, r, g, b);
  }

  // Zoom smooth
  zoomTo(level, duration = 400, ease = 'Quad.easeOut') {
    this.cam.zoomTo(level, duration, ease);
  }

  // Pan vers une cible
  panTo(x, y, duration = 800, ease = 'Quad.easeInOut') {
    this.cam.stopFollow();
    this.cam.pan(x, y, duration, ease);
  }

  // Follow avec lerp dynamique
  follow(target, lerp = 0.06) {
    this.cam.startFollow(target, true, lerp, lerp);
  }

  // Sequence complete : Carreau
  carreauSequence() {
    this.hitstop(100);
    this.flash(50);
    this.shake(0.005, 200);
    this.scene.time.delayedCall(100, () => {
      this.slowmo(0.2, 600);
      this.zoomTo(1.4, 400, 'Back.easeOut');
      this.scene.time.delayedCall(700, () => {
        this.zoomTo(1.0, 500);
      });
    });
  }

  // Sequence : collision boule-boule normale
  collisionSequence(intensity = 'medium') {
    const configs = {
      light: { hitstop: 0, shake: 0.001, shakeDur: 80 },
      medium: { hitstop: 30, shake: 0.002, shakeDur: 120 },
      heavy: { hitstop: 50, shake: 0.004, shakeDur: 150 }
    };
    const c = configs[intensity] || configs.medium;
    if (c.hitstop > 0) this.hitstop(c.hitstop);
    this.shake(c.shake, c.shakeDur);
  }
}
```

### 4.2 Performance — Impact sur mobile

| Effet | Cout CPU | Cout GPU | Safe 60 FPS mobile ? |
|-------|---------|---------|---------------------|
| Hitstop | ~0 (freeze = pas de calcul) | ~0 | ✅ Oui |
| Slow-mo | ~0 (delta reduit = moins de calcul) | ~0 | ✅ Oui |
| Camera shake | Negligeable | Negligeable | ✅ Oui |
| Camera zoom | Negligeable | Leger (rescale du viewport) | ✅ Oui |
| Camera flash | 1 draw call overlay | 1 quad plein ecran | ✅ Oui |
| Camera pan | Negligeable | Negligeable | ✅ Oui |
| Particules (20) | Faible | Faible (sprites simples) | ✅ Oui |
| Particules (50+) | Moyen | Moyen | ⚠️ Reduire sur low-end |

**Verdict** : tous les effets camera/slow-mo sont **gratuits en performance**. Seules les particules posent un risque sur mobile low-end (limiter a 20 max).

### 4.3 Interaction slow-mo avec les systemes

| Systeme | Affecte par timeScale ? | Comportement |
|---------|------------------------|-------------|
| Physique (Ball.js) | Oui — delta * timeScale | La boule ralentit |
| Particules | Oui si liées au delta | Les particules ralentissent |
| Tweens | Non par defaut | Ajouter `timeScale` manuellement |
| Sons | Non | Les sons jouent a vitesse normale |
| Timers (delayedCall) | Non | Les timers ignorent le timeScale |
| Input | Non | Le joueur peut toujours interagir |

**Attention** : les tweens Phaser ne respectent PAS automatiquement le timeScale custom. Il faut soit :
- Utiliser `this.tweens.timeScale` (global)
- Ou ne pas avoir de tweens actifs pendant le slow-mo (plus simple)

---

## 5. DIAGRAMME — "MOMENT DRAMATIQUE" COMPLET

```
                LANCER
                  │
                  ▼
        ┌─────────────────┐
        │ Camera follow   │  lerp 0.06
        │ (suit la boule) │
        └────────┬────────┘
                 │
          La boule ralentit
                 │
                 ▼
    ┌───────────────────────────┐
    │ Distance < 50px cochonnet│
    │ → Zoom in (1.0 → 1.2)   │  400ms
    │ → Lerp ralentit (0.03)  │
    └────────────┬──────────────┘
                 │
        ┌────────┴────────┐
        │                 │
    COLLISION         PAS DE COLLISION
        │                 │
        ▼                 ▼
 ┌─────────────┐   ┌──────────────┐
 │ C'est un    │   │ Boule        │
 │ carreau ?   │   │ s'arrete     │
 ├─OUI─────────┤   │ → Distance   │
 │ Hitstop     │   │   affichee   │
 │ Flash+Shake │   │ → Zoom out   │
 │ Slow-mo     │   └──────────────┘
 │ "CARREAU!"  │
 │ Particules  │
 │ Zoom 1.4    │
 │ Ease back   │
 ├─NON─────────┤
 │ Shake leger │
 │ Son impact  │
 │ Hitstop 30ms│
 └─────────────┘
        │
        ▼
 ┌─────────────────┐
 │ Pan cochonnet   │  800ms
 │ Montrer result  │
 │ Distance text   │
 └────────┬────────┘
          │
          ▼
 ┌─────────────────┐
 │ Retour overview  │  600ms
 │ Zoom 1.0        │
 │ Tour suivant    │
 └─────────────────┘
```
