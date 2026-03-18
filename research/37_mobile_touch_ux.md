# 37 — Mobile Touch UX

> A lire quand : on adapte le jeu pour mobile (Capacitor), qu'on travaille sur les controles tactiles, ou le responsive.

---

## 1. CONTEXTE

Petanque Master est un jeu web (desktop-first) qui sera deploye sur mobile via **Capacitor**. Le gameplay drag-and-release est naturellement adapte au tactile, mais de nombreux ajustements UX sont necessaires.

### Contraintes mobiles

| Contrainte | Impact |
|-----------|--------|
| Ecran petit (5-7") | UI doit etre plus grosse, texte lisible |
| Doigt = imprecis (~44px zone) | Boutons et cibles tactiles plus grands |
| Pas de hover | Impossible de "survoler" — actions directes |
| Pas de clavier | Navigation 100% tactile |
| Orientation variable | Supporter paysage (principal) et portrait (menu) |
| Performance variable | Smartphones low-end = budget frame serre |
| Batterie | Limiter les effets GPU intensifs |

---

## 2. CONTROLES DE VISEE TACTILE

### 2.1 Drag-and-release (existant, a optimiser)

Le geste principal est **deja tactile-friendly** :
1. Le joueur touche l'ecran
2. Glisse pour orienter et doser la puissance
3. Relache pour lancer

**Ameliorations necessaires** :

| Aspect | Desktop actuel | Mobile adapte |
|--------|---------------|---------------|
| Zone de drag | Depuis la boule | Depuis n'importe ou sur le terrain |
| Sensibilite | 1:1 pixel | Ajustable (0.5x, 1x, 1.5x) dans les options |
| Feedback | Curseur de souris | Vibration (haptic) au toucher + lacher |
| Annulation | Clic droit / Echap | Glisser en dehors de la zone + relacher |
| Zoom | Scroll wheel | Pinch to zoom (desactivable) |

### 2.2 Zone morte (dead zone)

Pour eviter les lancers accidentels :
- **Dead zone** : le drag doit depasser 20px avant d'etre considere comme un lancer
- **Feedback** : la fleche de direction n'apparait qu'apres la dead zone
- **Annulation** : si le drag revient dans la dead zone, le lancer est annule

### 2.3 Sensibilite adaptative

```javascript
// Facteur de sensibilite (configurable dans Options)
const TOUCH_SENSITIVITY = {
  low: 0.5,   // drag 2x plus long pour la meme puissance
  medium: 1.0, // 1:1
  high: 1.5    // drag plus court, plus reactif
};

// Application
const dragDistance = pointer.getDistance() * sensitivity;
const power = Math.min(dragDistance / MAX_DRAG, 1.0);
```

---

## 3. UI TACTILE — REGLES D'OR

### 3.1 Tailles minimales (WCAG + Apple HIG + Material Design)

| Element | Taille minimum | Espacement minimum |
|---------|---------------|-------------------|
| Bouton principal | 48x48px | 8px entre boutons |
| Bouton secondaire | 44x44px | 8px |
| Texte interactif | 44px de hauteur de zone tap | 8px |
| Icone cliquable | 44x44px | 12px |
| Slider / jauge | 48px de hauteur | — |

### 3.2 Layout mobile vs desktop

```
DESKTOP (832x480)                    MOBILE (paysage)
┌──────────────────────┐             ┌──────────────────────┐
│[Score] [Mene] [Score]│             │[S]   [Mene]   [S]   │
│                      │             │                      │
│                      │             │                      │
│   TERRAIN DE JEU     │             │   TERRAIN DE JEU     │
│                      │             │                      │
│                      │             │                      │
│[Mode][Focus][Puiss]  │             │[M][F]        [Puiss] │
└──────────────────────┘             │      [Boutons bas]   │
                                     └──────────────────────┘
```

### 3.3 Boutons specifiques mobile

| Bouton | Position | Usage |
|--------|----------|-------|
| Mode de tir | Bas-gauche, 48x48 | Cycle entre roulette/demi/plombee/tir |
| Focus | A cote de Mode | Activer le focus |
| Pause | Haut-droite, discret | Menu pause |
| Retro (backspin) | Bas-centre | Toggle retro |

### 3.4 Gestes reconnus

| Geste | Action |
|-------|--------|
| Tap simple | Selection / confirmation |
| Tap long (500ms) | Info contextuelle (stats perso, info boule) |
| Drag | Visee + puissance |
| Swipe rapide (dans un menu) | Navigation entre pages |
| Pinch | Zoom terrain (optionnel) |
| Double tap | Reset zoom (si zoom actif) |

---

## 4. ORIENTATION ET SAFE AREAS

### 4.1 Orientation supportee

| Ecran | Orientation | Justification |
|-------|------------|---------------|
| TitleScene | Paysage | Coherence avec le gameplay |
| CharSelectScene | Paysage | Grille de selection |
| PetanqueScene | Paysage | Terrain horizontal |
| ShopScene | Paysage | Coherence |
| Options | Paysage | Coherence |

**Lock orientation** en paysage via Capacitor :
```javascript
// capacitor.config.ts
{
  plugins: {
    ScreenOrientation: {
      orientation: 'landscape'
    }
  }
}
```

### 4.2 Safe areas (notch, barre de navigation)

Les telephones modernes ont des **notchs**, **barres de statut** et **barres de navigation** qui empiètent sur l'ecran.

```
┌─notch──────────────────notch─┐
│ ┌──────────────────────────┐ │
│ │                          │ │
│ │     SAFE AREA            │ │
│ │     (contenu jeu ici)    │ │
│ │                          │ │
│ └──────────────────────────┘ │
└──home bar────────────────────┘
```

**Implementation** :
```javascript
// Lire les safe areas CSS
const safeTop = parseInt(getComputedStyle(document.documentElement)
  .getPropertyValue('--sat') || '0');
const safeBottom = parseInt(getComputedStyle(document.documentElement)
  .getPropertyValue('--sab') || '0');

// Decaler le canvas ou les elements UI
```

```css
/* Dans index.html */
:root {
  --sat: env(safe-area-inset-top);
  --sar: env(safe-area-inset-right);
  --sab: env(safe-area-inset-bottom);
  --sal: env(safe-area-inset-left);
}

body {
  padding: env(safe-area-inset-top) env(safe-area-inset-right)
           env(safe-area-inset-bottom) env(safe-area-inset-left);
}
```

---

## 5. PERFORMANCE MOBILE

### 5.1 Budget performance

| Metrique | Cible | Critique |
|----------|-------|----------|
| FPS | 60 stable | < 30 = inacceptable |
| Memoire textures | < 128MB | Smartphones low-end |
| Temps de chargement | < 3s | Au-dela, le joueur quitte |
| Taille de l'app | < 50MB | Pour les stores |

### 5.2 Optimisations specifiques mobile

| Optimisation | Impact | Effort |
|-------------|--------|--------|
| Sprites en atlas (texture packer) | -30% draw calls | Moyen |
| Desactiver les ombres complexes sur low-end | +15 FPS | Faible |
| Reduire les particules (max 20 au lieu de 50) | +5 FPS | Faible |
| Pre-render des backgrounds statiques | -20% GPU | Moyen |
| Lazy loading des assets non-critiques | -1s chargement | Faible |
| Compresser les textures (WebP fallback) | -40% taille | Moyen |

### 5.3 Detection de performance

```javascript
// Detecter les appareils low-end
const isLowEnd = () => {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl');
  if (!gl) return true;
  const renderer = gl.getParameter(gl.RENDERER);
  // Les GPU Mali-400/Adreno 3xx sont low-end
  return /Mali-4|Adreno 3|PowerVR SGX/.test(renderer);
};

// Adapter la qualite
if (isLowEnd()) {
  PARTICLE_MAX = 15;
  SHADOW_ENABLED = false;
  CAMERA_SHAKE_ENABLED = false;
}
```

---

## 6. HAPTIC FEEDBACK (Capacitor)

### 6.1 Vibrations tactiles

Les vibrations remplacent une partie du feedback visuel sur mobile :

| Evenement | Type de vibration | Duree | Plugin |
|-----------|------------------|-------|--------|
| Lancer de boule | Impact medium | 50ms | Haptics |
| Collision boule-boule | Impact heavy | 100ms | Haptics |
| Carreau | Impact heavy + pause + impact | 100+50+100ms | Haptics |
| Selection menu | Impact light | 20ms | Haptics |
| Confirmation | Notification success | 200ms | Haptics |
| Erreur | Notification error | 300ms | Haptics |

### 6.2 Implementation Capacitor

```javascript
import { Haptics, ImpactStyle } from '@capacitor/haptics';

// Impact au lancer
await Haptics.impact({ style: ImpactStyle.Medium });

// Carreau !
await Haptics.impact({ style: ImpactStyle.Heavy });
await new Promise(r => setTimeout(r, 50));
await Haptics.impact({ style: ImpactStyle.Heavy });

// Selection menu
await Haptics.impact({ style: ImpactStyle.Light });
```

---

## 7. GESTION HORS-LIGNE ET INTERRUPTIONS

### 7.1 Interruptions mobiles

| Interruption | Comportement attendu |
|-------------|---------------------|
| Appel entrant | Pause automatique, reprendre au retour |
| Notification push | Ignorer pendant le match |
| App en arriere-plan | Pause automatique, sauvegarder l'etat |
| Batterie faible | Sauvegarder plus frequemment |
| Perte de focus | `document.hidden` → pause |

### 7.2 Implementation

```javascript
// Pause automatique sur perte de focus
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Pause le jeu
    this.scene.pause();
    this.sound.pauseAll();
    // Sauvegarder l'etat en cours
    SaveManager.quickSave(this.gameState);
  } else {
    // Reprendre
    this.scene.resume();
    this.sound.resumeAll();
  }
});
```

### 7.3 Mode hors-ligne

Le jeu doit etre **100% jouable hors-ligne** (pas de backend pour le MVP) :
- Toutes les donnees sont locales (localStorage)
- Les assets sont caches (Capacitor / Service Worker)
- Le mode en ligne (Phase 3) sera la seule feature necessitant une connexion

---

## 8. SPLASH SCREEN ET CHARGEMENT MOBILE

### 8.1 Splash screen (Capacitor natif)

```javascript
// capacitor.config.ts
{
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1A1510',
      showSpinner: false,
      // Logo du jeu en image native
      androidSplashResourceName: 'splash',
      iosSplashResourceName: 'splash'
    }
  }
}
```

### 8.2 Loading screen in-game

```
┌──────────────────────────────────┐
│                                  │
│        PETANQUE MASTER           │
│        [Logo pixel art]          │
│                                  │
│    ▓▓▓▓▓▓▓▓▓▓▓░░░░░ 73%        │
│    Chargement des terrains...    │
│                                  │
└──────────────────────────────────┘
```

- Barre de progression reelle (pas fake)
- Fond sombre #1A1510
- Tips de jeu aleatoires pendant le chargement (si > 2s)

---

## 9. ACCESSIBILITE TACTILE

### 9.1 Options de controle

| Option | Defaut | Description |
|--------|--------|------------|
| Sensibilite drag | Medium | Low / Medium / High |
| Vibrations | ON | ON / OFF |
| Zone de drag | Libre | Depuis la boule / Libre (n'importe ou) |
| Confirmation lancer | OFF | Si ON : double tap pour confirmer le lancer |
| Taille boutons | Normal | Normal / Grand (x1.5) |

### 9.2 Gestes alternatifs

Pour les joueurs avec des difficultes motrices :
- **Mode "Tap to aim"** : tap pour choisir la direction, slider pour la puissance, tap pour lancer
- **Mode "Auto-puissance"** : seule la direction est controlee, la puissance est calculee automatiquement

---

## 10. CHECKLIST DE PORTAGE MOBILE

### Avant le deploiement

- [ ] Tous les boutons font >= 44x44px de zone tap
- [ ] Le texte est lisible a 5" (tester sur vrai telephone)
- [ ] Pas de hover-only interactions
- [ ] Safe areas respectees (notch, barre nav)
- [ ] Orientation lockee en paysage
- [ ] Audio unlock au premier touch
- [ ] Pause sur `document.hidden`
- [ ] Performance 60 FPS sur smartphone milieu de gamme (2023+)
- [ ] Chargement < 3s
- [ ] Taille app < 50MB
- [ ] Haptic feedback fonctionnel
- [ ] Pas de scroll / zoom accidentel du navigateur
- [ ] Pas de selection de texte accidentelle
- [ ] Touch events (pas mouse events) pour le gameplay

### CSS anti-interference

```css
/* Empecher les comportements navigateur mobile */
canvas {
  touch-action: none;        /* Pas de scroll/zoom */
  -webkit-user-select: none; /* Pas de selection */
  user-select: none;
  -webkit-touch-callout: none; /* Pas de menu contextuel iOS */
}

/* Viewport correct */
meta[name="viewport"] {
  content: "width=device-width, initial-scale=1.0,
            maximum-scale=1.0, user-scalable=no,
            viewport-fit=cover"
}
```
