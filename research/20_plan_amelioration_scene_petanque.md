# Plan d'amelioration : Scene de Petanque
> Document ACTIONNABLE avec valeurs concretes, couleurs, tailles, code Phaser 3.
> Faisabilite verifiee dans research/22.

## DECISIONS PRISES

| Question | Reponse | Pourquoi |
|----------|---------|----------|
| Scrolling ou vue complete ? | **Vue complete** (pas de scroll) | Le terrain fait 180x420px dans un ecran 832x480 = tout visible. Scroll casserait la lisibilite |
| Zoom par defaut ? | **1.0x** (zoom 1.08x seulement pres cochonnet) | On voit tout le terrain + le decor autour |
| Spectateurs animes ? | **Non** pour l'instant | Silhouettes statiques suffisent. Animation = sprint futur |
| Orientation terrain ? | **Vertical** (cercle en bas, cochonnet en haut) | Comme en vrai. Le joueur "lance vers le haut" |

## ETAT ACTUEL vs CIBLE

### Actuellement
- Terrain = rectangle plat `fillRect(terrainX, terrainY, 180, 420)` couleur unie
- Boules = `Graphics.fillCircle()` + 1 highlight blanc
- Camera statique (sauf zoom 1.08x pres cochonnet)
- Adversaire en zone d'attente (haut-droite du terrain)
- Fond = noir (`COLORS.OMBRE`)
- Son = SFX proceduraux Web Audio (bips)

### Cible
- Terrain texture gravier avec bordures bois
- Fond ciel Provence + platanes + banc + muret
- Boules gradient radial 3D (CanvasTexture)
- Camera follow boule + slow-mo + pan
- Adversaire accroupi pres du cochonnet
- Ambiance cigales

## ETAPE 1 : FOND DE SCENE ET TERRAIN (3h)

### 1.1 Fond de scene
```
Zone hors-terrain (832x480 - terrain 180x420) :
- Ciel : gradient vertical #87CEEB (haut) → #B8D8EB (bas), fillGradientStyle()
- Sol exterieur : #8B7D5A (terre seche) en bas du terrain
```

### 1.2 Decor statique (sprites Graphics)
```
Positions en pixels absolus :
- Platane gauche : x=terrainX-80, y=60, tronc 20x80 (#8B6B4A), canopee cercle r=50 (#4A7A3A)
- Platane droite : x=terrainX+TERRAIN_WIDTH+80, y=80
- Banc : x=terrainX-60, y=300, rectangle 40x16 (#8B6B4A)
- Muret : x=terrainX+TERRAIN_WIDTH+20, y=150, rectangle 30x200 (#D4C4A0)
- Table cafe : x=terrainX+TERRAIN_WIDTH+40, y=380, rectangle 24x24 (#8B6B4A)
```

### 1.3 Terrain texture
**Technique** : CanvasTexture de 180x420, pre-rendu au create()
```javascript
const terrainTex = this.textures.createCanvas('terrain_gravier', 180, 420);
const ctx = terrainTex.getContext();
// Base ocre
ctx.fillStyle = '#C4854A';
ctx.fillRect(0, 0, 180, 420);
// 200 petits cailloux aleatoires (variation de couleur)
for (let i = 0; i < 200; i++) {
    const x = Math.random() * 180;
    const y = Math.random() * 420;
    const size = 1 + Math.random() * 2;
    const colors = ['#B07840', '#D49560', '#A87040', '#C4954A'];
    ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
    ctx.fillRect(x, y, size, size);
}
terrainTex.refresh();
this.add.image(terrainX + 90, terrainY + 210, 'terrain_gravier');
```

### 1.4 Bordures en bois
```
4 rectangles autour du terrain :
- Haut : fillRect(terrainX-4, terrainY-4, TERRAIN_WIDTH+8, 4) couleur #6B5038
- Bas : idem en bas
- Gauche/Droite : idem
- Highlight sur le bord interieur : 1px #9B7B5A
```

## ETAPE 2 : BOULES 3D (2h)

### 2.1 Generer textures au boot
4 textures CanvasTexture (une par type) de 32x32 :
```javascript
function createBallTexture(scene, key, baseColor, highlightColor, shadowColor) {
    const tex = scene.textures.createCanvas(key, 32, 32);
    const ctx = tex.getContext();
    // Gradient radial : sphere 3D
    const grad = ctx.createRadialGradient(12, 10, 2, 16, 16, 14);
    grad.addColorStop(0, highlightColor);  // reflet
    grad.addColorStop(0.4, baseColor);     // surface
    grad.addColorStop(1, shadowColor);     // ombre
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(16, 16, 14, 0, Math.PI * 2);
    ctx.fill();
    // Point speculaire
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.arc(11, 9, 3, 0, Math.PI * 2);
    ctx.fill();
    tex.refresh();
}

// Au boot :
createBallTexture(this, 'ball_acier', '#A8B5C2', '#E0E8F0', '#606870');
createBallTexture(this, 'ball_bronze', '#CD7F32', '#E8A050', '#8B5A20');
createBallTexture(this, 'ball_chrome', '#DCDCDC', '#FFFFFF', '#909090');
createBallTexture(this, 'ball_cochonnet', '#D4A574', '#F0D0A0', '#8B6B4A');
```

### 2.2 Modifier Ball.js
Remplacer `Graphics.fillCircle()` par `Sprite` :
```javascript
// Dans le constructeur :
this.sprite = scene.add.image(x, y, textureKey).setScale(this.radius / 14);
this.shadowSprite = scene.add.ellipse(x+3, y+4, this.radius*1.8, this.radius*0.8, 0x000000, 0.2);
// Dans draw() : juste mettre a jour les positions
this.sprite.setPosition(this.x, this.y);
this.shadowSprite.setPosition(this.x + 3, this.y + 4);
```

### 2.3 Ombre en vol (parallaxe)
Pendant `_animateThrow()`, l'ombre change de taille selon la hauteur :
```javascript
// Dans onUpdate du tween :
const height = Math.abs(arc); // hauteur actuelle
const shadowScale = 0.3 + (1 - height/maxArc) * 0.7; // petit quand haut, normal au sol
shadowSprite.setScale(shadowScale);
shadowSprite.setPosition(cx + 3, cy + 4 + height * 0.3); // decale quand haut
```

## ETAPE 3 : CAMERA CINEMATIQUE (2h)

### 3.1 Follow boule en vol
```javascript
// Dans PetanqueScene.create() :
this.cameraTarget = this.add.rectangle(0, 0, 1, 1).setVisible(false);

// Dans PetanqueEngine._animateThrow(), onUpdate :
if (this.scene.cameraTarget) {
    this.scene.cameraTarget.setPosition(cx, cy + arc);
    this.scene.cameras.main.startFollow(this.scene.cameraTarget, true, 0.08, 0.08);
}

// Dans onComplete :
this.scene.cameras.main.stopFollow();
```

### 3.2 Pan vers cochonnet apres atterrissage
```javascript
// Apres le lancer, quand la boule commence a rouler :
this.scene.cameras.main.pan(
    this.cochonnet.x, this.cochonnet.y,
    800, 'Sine.easeInOut', false,
    (cam, progress) => {
        if (progress === 1) {
            // Retour au centre du terrain apres 1s
            this.scene.time.delayedCall(1000, () => {
                this.scene.cameras.main.pan(
                    GAME_WIDTH/2, GAME_HEIGHT/2,
                    600, 'Sine.easeInOut'
                );
            });
        }
    }
);
```

### 3.3 Slow-motion
```javascript
// Dans PetanqueScene :
this.slowMotionFactor = 1.0;

// Dans update() :
const delta = rawDelta * this.slowMotionFactor;
this.engine.update(delta);
this.tweens.timeScale = this.slowMotionFactor;

// Dans PetanqueEngine._updateDramaticZoom() :
// Quand boule < 40px cochonnet et speed < 2 :
this.scene.slowMotionFactor = 0.4;
// Quand plus la condition :
this.scene.slowMotionFactor = 1.0;
```

## ETAPE 4 : JOUEURS REALISTES (2h)

### 4.1 Positionnement
```
Positions (en pixels) :
- Lanceur au cercle : throwCircleX, throwCircleY + 16
- Adversaire PRES DU COCHONNET : cochonnet.x + 30, cochonnet.y + 10
  (accroupi = scaleY 0.6, regarde vers le terrain)
- Quand adversaire doit lancer : tween marche vers cercle (500ms)
- Quand joueur doit lancer : adversaire retourne pres cochonnet (400ms)
```

### 4.2 Reactions
```
Apres chaque lancer :
- Si boule proche cochonnet (< 30px) et c'est la sienne :
  → petit saut (y -= 8 puis retour, 200ms, Bounce.easeOut)
- Si boule loin ou rate :
  → secoue la tete (rotation -5° puis +5° puis 0, 300ms)
- Sur carreau :
  → bras en l'air (scaleY 1.2, 400ms) + texte "!"
```

## ETAPE 5 : TRACES PERMANENTES AU SOL (1h)

```javascript
// Dans PetanqueScene.create() :
this.impactLayer = this.add.renderTexture(
    this.terrainX, this.terrainY,
    TERRAIN_WIDTH, TERRAIN_HEIGHT
).setDepth(2).setAlpha(0.5);

// Dans PetanqueEngine, apres chaque atterrissage :
const crater = this.scene.add.graphics();
crater.fillStyle(0x000000, 0.15);
crater.fillCircle(0, 0, ball.radius + 2);
this.scene.impactLayer.draw(crater, ball.x - terrainX, ball.y - terrainY);
crater.destroy();
```

## ETAPE 6 : AMBIANCE SONORE (1h)

### 6.1 Cigales (procedural)
```javascript
// Generer un buffer de bruit filtre (2 secondes, boucle)
const ctx = this.sound.context;
const duration = 2;
const sampleRate = ctx.sampleRate;
const buffer = ctx.createBuffer(1, sampleRate * duration, sampleRate);
const data = buffer.getChannelData(0);
for (let i = 0; i < data.length; i++) {
    // Bruit module par une sinusoide rapide (chirp de cigale)
    const t = i / sampleRate;
    const chirp = Math.sin(t * 4000 * Math.PI) * 0.5; // freq haute
    const envelope = Math.sin(t * 8 * Math.PI); // modulation 4Hz
    data[i] = chirp * Math.max(0, envelope) * 0.03; // tres bas volume
}
const source = ctx.createBufferSource();
source.buffer = buffer;
source.loop = true;
const gain = ctx.createGain();
gain.gain.value = 0.15;
source.connect(gain).connect(ctx.destination);
source.start();
```

### 6.2 Ameliorer les SFX existants
Le SoundManager actuel utilise des bips basiques. Enrichir :
- `sfxBouleBoule` : ajouter un 2eme harmonique + reverb court
- `sfxLanding` : ajouter crunch gravier (bruit filtre passe-bande 800-2000Hz)
- `sfxCarreau` : ajouter reverb + echo (delay 100ms, gain 0.3)
