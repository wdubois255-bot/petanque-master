# 14 - Phaser 3 : Techniques de Polish Professionnel
> Recherche du 14 mars 2026. Synthese de ~15 sources sur le polish technique Phaser 3.

## Objectif
Identifier les techniques Phaser 3 concretes pour rendre Petanque Master professionnel.

---

## 1. Camera & Screen Effects

### Screen Shake
```js
this.cameras.main.shake(duration, intensity);
// Petanque : duration=50-100ms, intensity=0.005-0.02
// Proportionnel a la force d'impact
```
Librairies optionnelles : PhaserFX (one-line effects), phaser3-juice-plugin (wobble, pulse, bounce).

### Camera Flash
```js
this.cameras.main.flash(100, 255, 255, 255); // flash blanc 100ms
```
Usage : carreau, score de points, badge obtenu.

### Camera Zoom
```js
this.cameras.main.zoomTo(1.1, 300); // zoom 10% en 300ms
// Puis retour : this.cameras.main.zoomTo(1.0, 500);
```
Usage : boule gagnante en fin de mene, zone d'atterrissage.

### Hitstop (Freeze Frame)
Pause la physique pour 2-4 frames (30-60ms) sur un impact fort.
```js
// Dans PetanqueEngine.update() :
if (this._hitstopUntil && Date.now() < this._hitstopUntil) return;
// Declenchement : this._hitstopUntil = Date.now() + 80;
```
Usage : carreau (100ms), tir reussi (50ms).

## 2. Particules

### Dust Puff a l'atterrissage
```js
// Phaser 3.60+ particle emitter
const emitter = scene.add.particles(x, y, 'dust', {
    speed: { min: 10, max: 30 },
    angle: { min: 0, max: 360 },
    scale: { start: 0.5, end: 0 },
    alpha: { start: 0.6, end: 0 },
    lifespan: 400,
    quantity: 8,
    emitting: false
});
emitter.explode();
```

### Particules par terrain
| Terrain | Couleur | Quantite | Speed | Lifespan |
|---------|---------|----------|-------|----------|
| Terre | 0xD4A574 (ocre) | 8 | 20 | 400ms |
| Herbe | 0x6B8E4E (olive) | 6 | 15 | 300ms |
| Sable | 0xF5E6D0 (creme) | 10 | 25 | 500ms |
| Dalles | 0xBBBBBB (gris) | 4 | 30 | 200ms |

### Alternative sans texture (Graphics)
Si pas de texture de particule disponible :
```js
for (let i = 0; i < 8; i++) {
    const angle = Math.random() * Math.PI * 2;
    const g = scene.add.graphics().setDepth(55);
    g.fillStyle(0xD4A574, 0.7);
    g.fillCircle(0, 0, 2);
    g.setPosition(x, y);
    scene.tweens.add({
        targets: g,
        x: x + Math.cos(angle) * 15,
        y: y + Math.sin(angle) * 15,
        alpha: 0, duration: 400,
        onComplete: () => g.destroy()
    });
}
```

### Trainee de roulement
```js
// startFollow pendant que la boule roule
emitter.startFollow(ballGraphics);
// Arreter quand speed < threshold
emitter.stopFollow();
```

### Editeur de particules
Phaser 3 Particle Editor (koreezgames/phaser3-particle-editor) : tune visuellement et exporte JSON.

## 3. Tweens et Easing

### Meilleures fonctions d'easing pour la petanque
| Easing | Usage |
|--------|-------|
| `Bounce.easeOut` | UI qui apparait (score, badges) |
| `Back.easeOut` | Elements qui overshooting (fleche visee, dialogues) |
| `Sine.easeInOut` | Camera pans entre les tours |
| `Cubic.easeOut` | Deceleration visuelle (ombre boule) |
| `Elastic.easeOut` | Texte celebration (sparingly) |

### Squash & Stretch sur impact
```js
scene.tweens.add({
    targets: ballSprite,
    scaleX: 1.3, scaleY: 0.7,
    duration: 50, yoyo: true, ease: 'Quad.easeOut'
});
```

### Reference interactive
Phaser Tween Ease Params Graph : visualisation de toutes les courbes.

## 4. Ligne de Prediction de Trajectoire

### Implementation pour physique custom (sans Box2D)
La physique custom a friction lineaire constante = trajectoire 100% predictible.

```js
// Methode statique Ball.simulateTrajectory()
static simulateTrajectory(startX, startY, vx, vy, frictionMult, steps = 120) {
    const points = [];
    let x = startX, y = startY, cvx = vx, cvy = vy;
    const dt = 1/60;
    for (let i = 0; i < steps; i++) {
        const speed = Math.sqrt(cvx*cvx + cvy*cvy);
        if (speed <= SPEED_THRESHOLD) break;
        const decel = FRICTION_BASE * frictionMult * 60;
        const newSpeed = Math.max(0, speed - decel * dt);
        cvx *= newSpeed / speed;
        cvy *= newSpeed / speed;
        x += cvx * dt * 60;
        y += cvy * dt * 60;
        if (i % 3 === 0) points.push({ x, y });
    }
    return points;
}
```

### Rendu : Graphics avec points en alpha decroissant
```js
const gfx = scene.add.graphics().setDepth(49);
gfx.clear();
for (let i = 0; i < points.length; i++) {
    const alpha = 0.5 - (i / points.length) * 0.4;
    gfx.fillStyle(0xFFFFFF, alpha);
    gfx.fillCircle(points[i].x, points[i].y, 1);
}
```

### Point cle
Utiliser exactement le meme timestep et friction que la vraie physique pour eviter les divergences prediction/realite.
Ne PAS predire les collisions avec les autres boules (standard dans les jeux de boules/pool).

## 5. Pixel Art : ce qui separe amateur de pro

### Regles fondamentales
- **Pas de sous-pixel** : `Math.round()` sur toutes les positions, OU `roundPixels: true` dans config Phaser
- **Palette coherente** : ne jamais introduire de couleur hors palette provencale
- **Animations idle** : meme 2 frames de "respiration" sur les PNJ rend le monde vivant
- **Motion secondaire** : cheveux, echarpes, poussiere qui suit le mouvement principal avec un delai
- **Ombres coherentes** : chaque entite a une ombre elliptique, meme direction de lumiere
- **Transitions smooth** : fade ou wipe entre scenes, jamais de cut brutal
- **Animation environnement** : eau animee, herbe qui bouge (2-4 frames en loop)

## 6. Tilemap Performance

### Pratiques critiques
- **Minimiser les layers** : chaque layer = un draw call. Combiner les layers decoratives
- **Layers statiques** pour tout ce qui ne change pas (sol, batiments, deco) = batch render
- **Chunk loading** pour les grands mondes : charger/decharger par zone via des transitions (portes, chemins)
- **Cull padding** : Phaser 3 cull les tiles hors ecran par defaut. Verifier `cullPadding`
- **RenderTexture** pour les decos complexes : render une fois vers une texture, afficher cette texture

### Notre cas
Maps 30x30 = 900 tiles. Meme avec 4 layers = 3600 tiles. Zero probleme de performance. Le chunking n'est pas necessaire.

## 7. Systeme de Sauvegarde

### Bonnes pratiques
- **Un seul key localStorage** : `petanque-master-save-{slot}` avec JSON blob complet
- **Champ `saveVersion`** : quand le format change, ecrire une migration
- **Fallback par defaut** : `JSON.parse(localStorage.getItem(key)) || DEFAULT_STATE`
- **Sauvegarder sur evenements** : fin de combat, badge, transition de map (pas chaque frame)
- **Limite 5MB** : notre save < 100KB, zero risque
- **Tolerance au tampering** : valider et clamper les valeurs au chargement
- **Fallback cookies** : phaser-super-storage pour navigations privees (optionnel)

## 8. Checklist de Lancement Pro

| Element | Statut | Priorite |
|---------|--------|----------|
| Loading screen avec progress bar | A faire | Haute |
| Gestion erreur WebGL/assets | A faire | Haute |
| Scaling responsive (integer x3/x4) | Partiel | Haute |
| Audio context unlock ("Click to start") | A faire | Haute |
| Anti pinch-zoom mobile | A faire | Moyenne |
| 60 FPS sur hardware moyen | A verifier | Haute |
| Favicon + Open Graph meta | A faire | Basse |
| Afficher les controles au 1er lancement | A faire | Moyenne |
| Degradation gracieuse si asset manquant | A faire | Moyenne |
| Cross-browser (Chrome, Firefox, Safari, Edge) | A tester | Haute |

**Sources** : PhaserFX, phaser3-juice-plugin, Phaser docs, Rex Notes, VFX Apprentice, Dynetis Games, GameAnalytics.
