# Recherche : Faisabilite des ameliorations scene petanque en Phaser 3

> Verification que CHAQUE amelioration planifiee est concretement faisable.
> Toutes verifiees contre Phaser 3.90.0 "Tsugumi".

## Resume : TOUT EST FAISABLE

| # | Feature | Faisable | Technique Phaser 3 | Risque |
|---|---------|----------|-----------|--------|
| 1 | Fond riche (ciel, arbres, banc) | OUI | Tilemap layers + Sprites | Max 3 layers |
| 2 | Boules gradient radial 3D | OUI | CanvasTexture + `createRadialGradient` | Appeler `refresh()` pour WebGL |
| 3 | Camera follow boule en vol | OUI | Sprite invisible + `startFollow(lerp)` | Tuner le lerp |
| 4 | Slow-motion | OUI | Delta scaling manuel + tweens.timeScale | Physique custom = scaling manuel |
| 5 | Son ambiance cigales | OUI | Phaser audio loop OU `this.sound.context` | AudioContext suspendu avant geste |
| 6 | Traces permanentes au sol | OUI | RenderTexture.draw() | Pas Graphics accumulation |
| 7 | Camera pan entre 2 points | OUI | `camera.pan(x, y, duration, ease)` | Faire stopFollow() avant |

## Detail par feature

### 1. Fond riche (ciel, platanes, banc, muret)

**API** : `Tilemap` + `TilemapLayer` pour le sol, `Sprite` pour les decorations.

**Technique** :
- Layer 0 : fond ciel (simple rectangle gradient ou image)
- Layer 1 : terrain de petanque (gravier texture)
- Layer 2 : decorations (platanes, banc, muret = sprites statiques)
- A 832x480 (petit viewport), performance excellente meme avec 100+ sprites statiques

**Gotcha** : Max 2-3 layers tilemap. Au-dela, FPS chute sur mobiles. Pour les decorations statiques, preferer les "bake" dans le tileset.

### 2. Boules avec gradient radial 3D

**Le probleme** : `Graphics.fillGradientStyle()` ne fait que des gradients lineaires 4 coins, et produit des artefacts sur les cercles. PAS de gradient radial natif dans Phaser Graphics.

**La solution** : `CanvasTexture` :
```javascript
// Creer la texture une seule fois au boot
const canvas = this.textures.createCanvas('ball_silver', 64, 64);
const ctx = canvas.getContext();
const grad = ctx.createRadialGradient(24, 20, 2, 32, 32, 30);
grad.addColorStop(0, '#FFFFFF');   // highlight
grad.addColorStop(0.3, '#E0E0E0'); // surface
grad.addColorStop(1, '#808080');    // ombre
ctx.fillStyle = grad;
ctx.beginPath();
ctx.arc(32, 32, 30, 0, Math.PI * 2);
ctx.fill();
canvas.refresh(); // OBLIGATOIRE pour WebGL
```
- Creer une texture par type de boule (acier, bronze, chrome, cochonnet)
- Utiliser comme sprite : `this.add.sprite(x, y, 'ball_silver')`
- Zero cout par frame (texture pre-rendue)

**Gotcha** : Appeler `canvas.refresh()` apres le dessin sinon invisible en WebGL.

### 3. Camera follow boule en vol

**Le probleme** : `startFollow()` demande un Game Object, pas des coordonnees brutes.

**La solution** : Sprite invisible "dummy" :
```javascript
this.cameraTarget = this.add.sprite(0, 0).setVisible(false);
// Dans update :
this.cameraTarget.setPosition(ball.x, ball.y);
this.cameras.main.startFollow(this.cameraTarget, true, 0.08, 0.08);
// Quand la boule s'arrete :
this.cameras.main.stopFollow();
```
- Le lerp 0.08 donne un suivi cinematique (pas trop rigide)
- `setVisible(false)` = pas de rendu mais position mise a jour

### 4. Slow-motion

**APIs disponibles** :
- `this.tweens.timeScale = 0.3` : ralentit tous les tweens
- `this.time.timeScale = 0.3` : ralentit les Timer Events
- `this.anims.globalTimeScale = 0.3` : ralentit les animations

**CRITIQUE** : Notre physique est custom (pas Arcade). Le `delta` dans `update()` reste ~16ms quel que soit le timeScale. Il faut **manuellement** multiplier le delta :
```javascript
update(time, delta) {
    const scaledDelta = delta * this.slowMotionFactor; // 0.3 pour slow-mo
    this.engine.update(scaledDelta);
}
```

**Implementation recommandee** :
- Variable `this.slowMotionFactor = 1.0` (normal) ou `0.3` (slow-mo)
- Appliquer simultanement a tweens.timeScale, anims.globalTimeScale, et delta custom
- Activer quand boule < 40px du cochonnet et speed < 2
- Desactiver quand boule s'arrete ou s'eloigne

### 5. Son ambiance cigales

**Approche A (recommandee)** : Generer un .ogg/mp3 de 3-5 secondes de cigales, puis :
```javascript
this.sound.add('cigales', { loop: true, volume: 0.15 }).play();
```

**Approche B (procedural)** : Acceder au AudioContext de Phaser :
```javascript
const ctx = this.sound.context; // retourne l'AudioContext natif
// Creer oscillators, noise buffers, etc.
```

**Gotcha** : AudioContext suspendu jusqu'au premier geste utilisateur. Phaser gere le resume automatiquement, mais les sons proceduraux crees avant le premier clic ne joueront pas.

### 6. Traces permanentes au sol (crateres d'impact)

**Ne PAS faire** : accumuler des `Graphics.fillCircle()` sans clear. Phaser re-execute TOUT le buffer chaque frame. Apres 50 impacts = lag.

**Faire** : `RenderTexture` de la taille du terrain :
```javascript
this.impactLayer = this.add.renderTexture(terrainX, terrainY, TERRAIN_WIDTH, TERRAIN_HEIGHT).setDepth(2);

// A chaque impact :
const crater = this.add.graphics();
crater.fillStyle(0x000000, 0.15);
crater.fillCircle(0, 0, ball.radius + 2);
this.impactLayer.draw(crater, impactX - terrainX, impactY - terrainY);
crater.destroy();
```
- Le RenderTexture garde les pixels definitivement
- Le cout ne croit PAS avec le nombre d'impacts
- Compatible WebGL

### 7. Camera pan entre deux points

**API native** : `camera.pan(x, y, duration, ease, force, callback)`

```javascript
// Montrer le cochonnet apres un lancer
this.cameras.main.stopFollow();
this.cameras.main.pan(cochonnet.x, cochonnet.y, 1000, 'Sine.easeInOut', false, (cam, progress) => {
    if (progress === 1) {
        // Pan termine, retour au joueur
        this.cameras.main.pan(player.x, player.y, 800, 'Sine.easeInOut');
    }
});
```

**Gotcha** : Si `startFollow()` est actif pendant un pan, le follow ecrase le pan immediatement. Toujours `stopFollow()` avant de lancer un pan.

## Conclusion

**Les 7 features sont confirmees faisables** avec Phaser 3.90.0 et notre stack.

**Les 2 points d'attention** :
1. Gradient radial = CanvasTexture (pas Graphics)
2. Slow-motion = delta scaling manuel (pas juste timeScale)

Le reste est standard Phaser : camera follow, pan, RenderTexture, audio loop.

Sources :
- Phaser 3 API Docs (Camera, RenderTexture, CanvasTexture)
- Phaser GitHub issues #839 (layers perf), #4383 (CanvasTexture WebGL)
- Phaser forum (time scale discussion)
