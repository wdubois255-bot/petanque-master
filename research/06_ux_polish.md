# Recherche Agent 6 : UX, Polish et Performance

## 1. Pixel Art Best Practices

### Resolution et taille de tiles
- **32x32** = sweet spot pour personnages expressifs (style Pokemon GBA/DS)
- **16x16** = bon pour tiles sol, decorations, petits objets (cochonnet)
- **Canvas de base recommande** : 384x216 (16:9), scale integer x2/x3/x4
  - 384x216 x4 = 1536x864 (proche 1080p)
  - Donne un feel GBA/DS authentique

### Palette couleurs theme Provencal (16-32 couleurs)
- **Ocres/terracotta** : #D4A574, #C4854A, #8B5E3C (terre, argile)
- **Lavande** : #9B7BB8, #7B6B9E, #C8A8E0 (champs lavande)
- **Verts olive** : #6B8E4E, #4A6B3A, #8FAE6E (oliviers, maquis)
- **Bleus ciel** : #87CEEB, #6BB5D6, #4A90B8 (ciel provencal)
- **Blancs/cremes** : #F5E6D0, #E8D5B7, #FFF8E7 (murs pierre, batiments)
- **Ombres chaudes** : #3A2E28, #5C4033 (JAMAIS noir pur #000)
- **Rouges accent** : #C44B3F, #E86B5A (tuiles toit, fleurs)
- **Principe** : ombres vers violet/bleu pour complementer palette chaude

### Scaling pixel art sans flou
**CSS :**
```css
canvas {
  image-rendering: pixelated;
  image-rendering: crisp-edges; /* Firefox */
}
```
**Canvas API :**
```javascript
ctx.imageSmoothingEnabled = false;
```
**Regles critiques :**
- Canvas resolution interne petite (384x216), CSS size grande
- TOUJOURS scale facteur entier (x2, x3, x4) - jamais fractionnaire
- Attention devicePixelRatio non-entier (zoom navigateur 110%)

### Framerate animations sprites
- **Walk cycles** : 4-6 frames a 8-12 FPS (~80-120ms par frame)
- **Idle** : 2-4 frames a 4-6 FPS (~150-250ms par frame)
- **Lancer** : 4-8 frames a 12-15 FPS (responsive, snappy)
- **Boule roulement** : 60 FPS (interpolation position, pas sprite frames)
- **Effets impact** : 3-5 frames a 15-20 FPS (burst rapide)
- Game loop 60 FPS + timer separe pour avancer les animations sprite

## 2. Game Feel / "Juice"

### Screen shake a l'impact
- Impact leger (boule atterrit) : 2-3px shake, 150ms
- Impact fort (carreau) : 4-6px shake, 250ms
- `Math.random() * intensity - intensity/2` par axe, decay 0.85-0.9 par frame
- Optionnel : freeze-frame 30-50ms sur gros impacts

### Particules
- **Poussiere atterrissage** : 6-10 particules ocre/marron, cone vers le haut, shrink+fade 300-500ms
- **Trainee roulement** : 1-2 particules poussiere toutes les 2-3 frames derriere la boule
- **Sparkle point parfait** : 8-12 particules jaune/blanc, radiales, twinkle opacity
- **Flash impact** : 1 frame cercle blanc au point de collision, expand+fade 3-4 frames
- **Object pooling obligatoire** : pre-allouer 50-100 particules, recycler

### Sons pour la petanque
- **Clac metallique** : court, sharp, haute frequence, decay rapide (jsfxr preset "Hit/Hurt")
- **Boule sur gravier** : crunch granulaire, low thud + high freq noise
- **Roulement** : rumble continu, pitch shift avec vitesse
- **Reactions public** : "Ooh!" sur tir proche, applaudissements sur point parfait
- **Ambiance** : CIGALES (essentiel Provence!), brise, cloches, oiseaux
- **UI** : click doux selection, whoosh transitions

### Camera effects
- **Zoom au lancer** : ease 1.0x -> 1.05x sur 300ms au release, retour 1.0x sur 500ms
- **Camera suit boule** : lerp `camera.x += (target.x - camera.x) * 0.08`
- **Zoom mesure** : zoom smooth vers cochonnet sur 500ms en fin de manche
- **Transitions scenes** : fade noir 300ms, hold 100ms, fade in 300ms

### Easing functions (easings.net)
- **easeOutQuad** `(1-(1-t)^2)` : deceleration boule, arret naturel
- **easeOutBounce** : boule rebondissant a l'atterrissage
- **easeInOutCubic** : mouvement camera, slide UI
- **easeOutBack** (overshoot+settle) : scores apparaissant, UI pop-in
- **easeOutElastic** : animations celebration, compteurs score
- **linear** : mouvement vitesse constante (boule en l'air)

## 3. UI/UX Web Games

### Menus
- **HTML/CSS pour menus, Canvas pour gameplay** (meilleur accessibilite, responsive, texte)
- CSS transitions pour polish (fade in, slide in)
- Hierarchie peu profonde : Title -> Play / Options / Credits (2 clics max pour jouer)
- Cibles cliquables minimum 44x44px (mobile)
- Police pixel art : "Press Start 2P" (Google Fonts) ou "Silkscreen"

### Responsive design
```javascript
// Plus grand scale entier qui rentre dans le viewport
scale = Math.floor(Math.min(innerWidth / baseWidth, innerHeight / baseHeight));
```
- Canvas CSS `width: 100vw; height: 100vh` ou ratio fixe + letterboxing
- Centrer avec flexbox, background sombre pour barres
- `window.resize` + orientation change
- Forcer paysage si possible (Screen Orientation API)

### Controles tactiles
- Drag to aim = ideal pour tactile (slingshot)
- `touchstart/touchmove/touchend` avec `preventDefault()` (bloquer scroll/zoom)
- Fleche/ligne visuelle pour direction + puissance
- Haptic feedback `navigator.vibrate(50)` sur impact (Android)
- Elements interactifs min 48x48 CSS px

### Controles desktop
- **Souris** : clic+drag pour viser/lancer, molette pour zoom
- **Clavier** : fleches pour ajuster visee, Espace pour lancer, Escape pour menu
- Hints de controle au premier lancement, fade out apres quelques secondes
- Supporter les deux schemas simultanement

### Loading screen
- Progress bar ou element pixel art anime (boule qui tourne)
- Preload tous les assets (images + audio) avec `Promise.all()`
- Tips de jeu ou controles pendant le chargement
- Duree min affichage ~500ms (eviter flash)

### Tab focus/blur (Page Visibility API)
```javascript
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    pauseGame();
    muteAudio();
  } else {
    showPauseMenu();
  }
});
```
- `requestAnimationFrame` pause automatiquement quand tab cachee
- Gerer audio et etat explicitement

## 4. Audio Web Games

### Howler.js vs Web Audio API
| Aspect | Web Audio API | Howler.js |
|--------|-------------|-----------|
| Taille | 0 KB | ~10 KB gzip |
| Facilite | Bas niveau, verbeux | Simple, haut niveau |
| Spatial | Complet | Basique |
| Effets/filtres | Nodes built-in | Limite |
| Compat browser | Bon | Excellent (fallbacks) |

**Recommandation : Howler.js** pour simplicite. Gere autoplay policies, audio sprites, volume, cross-browser automatiquement.

### Autoplay policies navigateur
```javascript
const audioCtx = new AudioContext();
document.addEventListener('click', () => {
  if (audioCtx.state === 'suspended') audioCtx.resume();
}, { once: true });
```
Howler.js gere ca automatiquement.
**Best practice** : ecran "Cliquer pour jouer" = titre + unlock audio.

### Strategie sons
- `AudioBuffer` (decode en memoire) pour SFX courts = meilleur timing
- `HTMLMediaElement` (`<audio>`) pour musique de fond = streaming, moins de memoire

## 5. Performance Canvas

### Offscreen Canvas pour tilemap
```javascript
const tilemapBuffer = new OffscreenCanvas(mapWidth, mapHeight);
const bufferCtx = tilemapBuffer.getContext('2d');
// Dessiner tous les tiles une seule fois...

function render() {
  ctx.drawImage(tilemapBuffer, -cameraX, -cameraY);
  // Puis dessiner objets dynamiques par-dessus
}
```
OffscreenCanvas supporte par tous les navigateurs modernes (depuis mars 2023).

### Object pooling particules
```javascript
class ParticlePool {
  constructor(size) {
    this.pool = Array.from({ length: size }, () => ({
      active: false, x: 0, y: 0, vx: 0, vy: 0, life: 0
    }));
  }
  spawn(x, y, vx, vy) {
    const p = this.pool.find(p => !p.active);
    if (!p) return;
    Object.assign(p, { active: true, x, y, vx, vy, life: 1.0 });
  }
  update(dt) {
    for (const p of this.pool) {
      if (!p.active) continue;
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.life -= dt * 2;
      if (p.life <= 0) p.active = false;
    }
  }
}
```

### requestAnimationFrame
```javascript
let lastTime = 0;
function gameLoop(timestamp) {
  const deltaTime = Math.min((timestamp - lastTime) / 1000, 0.05); // Cap 50ms
  lastTime = timestamp;
  update(deltaTime);
  render();
  requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);
```
- TOUJOURS utiliser `timestamp` pour mouvement frame-rate independent
- Cap deltaTime pour eviter sauts enormes au retour de tab
- JAMAIS `setInterval` pour game loop

### Tips 60 FPS
- Minimiser draw calls, batch sprites par spritesheet
- Zero allocations par frame (pas de new Object/Array/String dans le loop)
- Grouper draws par rendering state (meme alpha, meme composite)
- `will-change: transform` sur le canvas CSS pour GPU
- Profiler avec Chrome DevTools Performance tab, target < 16ms/frame
- Pour petanque : performance pas un souci (peu d'objets), risque = burst particules -> pooling

## 6. Ressources cles
- **Lospec.com** : palettes pixel art curees
- **saint11.org** : tutos pixel art Pedro Medeiros (animation, style)
- **easings.net** : reference visuelle easing functions
- **MDN Game Development** : techniques, rendering, audio
- **Freesound.org** : chercher "petanque", "boules", "metal clank", "cicadas", "Provence"
