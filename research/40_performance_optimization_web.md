# 40 — Performance Optimization Web & Mobile

> A lire quand : on optimise le chargement, les FPS, la memoire, ou qu'on prepare le portage mobile.

---

## 1. OBJECTIFS DE PERFORMANCE

| Metrique | Cible desktop | Cible mobile | Critique |
|----------|-------------|-------------|----------|
| FPS | 60 stable | 60 stable (30 acceptable low-end) | Oui |
| First Contentful Paint | < 1.5s | < 2.5s | Oui |
| Time to Interactive | < 3s | < 5s | Oui |
| Memoire JS heap | < 100MB | < 80MB | Oui |
| Memoire GPU (textures) | < 256MB | < 128MB | Oui |
| Taille totale assets | < 30MB | < 30MB | Oui |
| Taille bundle JS | < 500KB gzip | < 500KB gzip | Non |

---

## 2. OPTIMISATION DES ASSETS

### 2.1 Sprites et textures

| Optimisation | Impact | Comment |
|-------------|--------|---------|
| **Texture atlases** | -60% draw calls | Free Texture Packer → JSON atlas Phaser |
| **Power-of-2 dimensions** | GPU-friendly | 256x256, 512x512, 1024x1024 |
| **Format PNG-8** pour pixel art | -70% taille vs PNG-32 | Palette limitee → PNG-8 automatique |
| **WebP fallback** | -30% vs PNG | Vite plugin, fallback PNG pour Safari < 14 |
| **Spritesheet par personnage** | 1 atlas = 1 draw call par perso | Toutes les frames dans 1 image |
| **Pas d'images > 2048x2048** | Compatibilite mobile | Decouper si necessaire |

### 2.2 Taille des assets actuels (estimation)

```
Sprites personnages : 5 persos × ~50KB = 250KB
Portraits          : 5 × 3 tailles = ~500KB
Tilesets terrains  : 5 × ~200KB = 1MB
UI                 : ~300KB
Audio SFX          : ~30 sons × 50KB = 1.5MB
Audio musique      : ~8 pistes × 500KB = 4MB
─────────────────────────────────────────────
Total estimé       : ~7.5MB (excellent)
```

### 2.3 Compression audio

| Format | Usage | Taille | Support |
|--------|-------|--------|---------|
| WAV | Source (dev only) | 100% | Universel |
| OGG | Musique (prod) | 10-15% du WAV | Tout sauf Safari |
| MP3 | Fallback Safari | 15-20% du WAV | Universel |
| AAC | Alternative mobile | 12-18% du WAV | iOS natif |

**Strategie** : servir OGG avec fallback MP3. Phaser gere automatiquement.

```javascript
this.load.audio('mus_title', ['assets/audio/music/title.ogg', 'assets/audio/music/title.mp3']);
```

---

## 3. OPTIMISATION DU RENDU (60 FPS)

### 3.1 Phaser 3 — Regles de performance

| Regle | Pourquoi | Comment |
|-------|----------|---------|
| **Max 2-3 layers tilemap** | Chaque layer = 1 draw call complet | Fusionner les layers decoratifs |
| **Pre-render les fonds statiques** | 0 draw call pour le decor | RenderTexture une fois au init |
| **Object pooling pour les particules** | Pas de GC spam | Phaser Emitter avec maxParticles |
| **Pas de alpha < 1.0 sur les gros sprites** | Blending = couteux | Utiliser tint plutot que alpha |
| **Visible = false au lieu de destroy** | Eviter les reallocations | Pool d'objets reutilisables |
| **Limiter les tweens simultanes** | CPU overhead | Max 10-15 tweens actifs |

### 3.2 WebGL vs Canvas

Phaser 3 utilise WebGL par defaut. **Ne pas forcer Canvas** sauf si :
- Le device ne supporte pas WebGL (tres rare en 2026)
- Un bug specifique WebGL est identifie

```javascript
// Config Phaser
const config = {
  type: Phaser.AUTO, // WebGL avec fallback Canvas
  render: {
    pixelArt: true,        // OBLIGATOIRE
    antialias: false,       // Pixel art = pas d'antialias
    roundPixels: true,      // Pas de sub-pixel
    transparent: false,     // Fond opaque = plus rapide
    powerPreference: 'high-performance' // GPU plutot que integre
  }
};
```

### 3.3 Camera et viewport culling

Phaser 3 fait du culling automatique (ne rend pas les objets hors camera). Mais :
- Les objets **hors camera** consomment quand meme du CPU s'ils ont des tweens/timers
- **Desactiver les updates** des objets hors ecran :

```javascript
// Dans update()
if (!this.cameras.main.worldView.contains(this.x, this.y)) {
  return; // Skip update si hors camera
}
```

### 3.4 Garbage Collection

Le GC est l'ennemi du 60 FPS constant. **Eviter** :

| Anti-pattern | Alternative |
|-------------|------------|
| `new Phaser.Math.Vector2()` dans update | Pre-allouer et reutiliser |
| String concatenation dans update | Template literals ou pre-compute |
| Array.filter/map dans update | Boucle for classique |
| `JSON.parse` dans update | Parser une fois, cacher |
| Event listeners ajoutes/retires chaque frame | Ajouter une fois dans create |

```javascript
// MAUVAIS — cree un nouvel objet chaque frame
update() {
  const vel = new Phaser.Math.Vector2(this.vx, this.vy);
}

// BON — reutilise un objet pre-alloue
create() {
  this._vel = new Phaser.Math.Vector2();
}
update() {
  this._vel.set(this.vx, this.vy);
}
```

---

## 4. OPTIMISATION DU CHARGEMENT

### 4.1 Strategie de chargement

```
Boot (critique)     : 0-1s   → Logo, police, config
├── Preload (essentiel) : 1-3s   → Sprites perso actif, terrain actif, SFX critiques
├── Lazy (arriere-plan) : 3-10s  → Autres persos, autres terrains, musique
└── On-demand           : quand necessaire → Portraits HD, terrains non-visites
```

### 4.2 BootScene optimise

```javascript
class BootScene extends Phaser.Scene {
  preload() {
    // Phase 1 : critique (< 500KB)
    this.load.image('logo', 'assets/ui/logo.png');
    this.load.bitmapFont('pixelfont', ...);

    // Phase 2 : essentiel pour le menu
    this.load.atlas('ui', 'assets/ui/ui.png', 'assets/ui/ui.json');

    // Afficher la barre de chargement
    this.load.on('progress', (value) => {
      this.progressBar.scaleX = value;
    });
  }

  create() {
    // Lancer le preload en arriere-plan pour le reste
    this.scene.start('TitleScene');
    this.scene.launch('PreloadScene'); // Charge le reste en background
  }
}
```

### 4.3 Preload par scene

Chaque scene ne charge que ce dont elle a besoin :

| Scene | Assets charges |
|-------|---------------|
| TitleScene | Background titre, musique titre |
| CharSelectScene | Tous les portraits thumbnail (64x64) |
| VSIntroScene | Portraits VS des 2 persos selectionnes |
| PetanqueScene | Terrain selectionne, sprites 2 persos, boules, SFX gameplay |
| ResultScene | Musique victoire/defaite |
| ShopScene | Icons boutique |

### 4.4 Vite optimisations

```javascript
// vite.config.js
export default {
  build: {
    assetsInlineLimit: 0,  // OBLIGATOIRE — ne pas inliner les assets
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ['phaser'],       // Phaser dans son propre chunk
          rexui: ['phaser3-rex-plugins'] // rexUI separe
        }
      }
    },
    chunkSizeWarningLimit: 1000, // Phaser est gros, c'est normal
    minify: 'terser',            // Meilleure minification
    sourcemap: false             // Pas de sourcemap en prod
  }
};
```

---

## 5. PROFILING ET DEBUGGING

### 5.1 Outils

| Outil | Usage | Comment |
|-------|-------|---------|
| Chrome DevTools → Performance | Profiling FPS, CPU | F12 → Performance → Record |
| Chrome DevTools → Memory | Heap snapshots, leaks | F12 → Memory |
| Phaser Debug mode | FPS counter, bounds | `this.game.config.physics.arcade.debug = true` |
| Spector.js | WebGL draw calls | Extension Chrome |
| Lighthouse | Audit web complet | F12 → Lighthouse |

### 5.2 Metriques a monitorer

```javascript
// FPS counter simple (dev mode)
class FPSCounter {
  constructor(scene) {
    this.text = scene.add.text(10, 10, '', { fontSize: '12px', color: '#00ff00' })
      .setScrollFactor(0).setDepth(9999);
  }
  update() {
    this.text.setText(`FPS: ${Math.round(this.scene.game.loop.actualFps)}`);
  }
}
```

### 5.3 Alertes de performance

| Seuil | Action |
|-------|--------|
| FPS < 50 pendant 3s | Logger dans la console + telemetrie |
| Heap > 150MB | Forcer un nettoyage (destroy les textures non-utilisees) |
| Draw calls > 100 | Verifier qu'on utilise des atlases |
| Texture > 2048px | Warning en dev, erreur en mobile |

---

## 6. MOBILE — OPTIMISATIONS SPECIFIQUES

### 6.1 Reduction de qualite adaptative

```javascript
// Detecter et adapter
const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
const isLowEnd = navigator.hardwareConcurrency <= 4;

const QUALITY = {
  high: { particles: 50, shadows: true, cameraLerp: 0.08 },
  medium: { particles: 25, shadows: true, cameraLerp: 0.06 },
  low: { particles: 10, shadows: false, cameraLerp: 0.04 }
};

const quality = isLowEnd ? QUALITY.low : (isMobile ? QUALITY.medium : QUALITY.high);
```

### 6.2 Batterie

- **Reduire le framerate en arriere-plan** : `requestAnimationFrame` est auto-pause quand l'onglet est cache
- **Pas de timers inutiles** en pause
- **Desactiver les particules** en menu (sauf title screen)

### 6.3 Memoire GPU mobile

| Limite | Action |
|--------|--------|
| Textures > 128MB | Decharger les terrains non-actifs |
| Atlas > 2048x2048 | Decouper en sous-atlas |
| Textures non-POT | Forcer les dimensions POT (power of 2) |

---

## 7. CDN ET CACHE

### 7.1 Cache strategy (GitHub Pages / Cloudflare)

```
Assets statiques (images, audio)  : Cache 1 an (immutable, hash dans le nom)
HTML/JS bundles                   : Cache 1h (versionne par Vite)
Service Worker                    : Cache-first pour offline
```

### 7.2 Service Worker (PWA)

```javascript
// sw.js — Strategie cache-first pour les assets
self.addEventListener('fetch', (event) => {
  if (event.request.url.match(/\.(png|jpg|ogg|mp3|json)$/)) {
    event.respondWith(
      caches.match(event.request).then(cached =>
        cached || fetch(event.request).then(response => {
          const clone = response.clone();
          caches.open('assets-v1').then(cache => cache.put(event.request, clone));
          return response;
        })
      )
    );
  }
});
```

---

## 8. CHECKLIST PERFORMANCE

### Avant chaque release

- [ ] FPS stable a 60 sur desktop (Chrome, Firefox, Safari)
- [ ] FPS >= 30 sur mobile milieu de gamme (test reel)
- [ ] Temps de chargement < 3s (desktop), < 5s (mobile)
- [ ] Taille totale < 30MB
- [ ] Bundle JS < 500KB gzip
- [ ] Pas de memory leak (heap stable apres 10 matchs)
- [ ] Pas de janks visibles (frame drops)
- [ ] Atlas utilises pour tous les sprites
- [ ] Audio en OGG + MP3 fallback
- [ ] `assetsInlineLimit: 0` dans vite.config.js
- [ ] `pixelArt: true` dans la config Phaser
- [ ] Pas d'objets crees dans update()

### Tests a effectuer

- [ ] Profiler 5 min de gameplay continu (Chrome Performance)
- [ ] Heap snapshot avant/apres un match (verifier pas de leak)
- [ ] Compter les draw calls (Spector.js, cible < 50)
- [ ] Tester sur un smartphone Android 3 ans d'age
- [ ] Lighthouse score > 80 (Performance)
