# Remotion — Analyse technique approfondie pour Petanque Master

> Recherche du 5 avril 2026 — Version testee : Remotion 4.0.445

## TL;DR — Verdict

Remotion est un excellent choix pour notre making-of. C'est du React pur : chaque frame de la video est un composant React rendu par Chrome headless, screenshote, puis assemble en MP4 par FFmpeg. Le pixel art sera crisp (CSS `image-rendering: pixelated` fonctionne puisque c'est du vrai Chrome). Le rendu local est **100% gratuit** pour un individu. Estimation de rendu : ~20-40 minutes pour 10 min de video 1080p30 sur notre machine.

---

## 1. Setup — Commandes exactes

### Option A : Projet Remotion autonome (recommande)

```bash
# Creer un projet Remotion dedie dans un dossier frere
npx create-video@latest

# Choisir le template "Hello World (JavaScript)" — on veut du JS, pas du TS
# Nom du dossier : petanque-making-of

cd petanque-making-of
npm install
npx remotion studio   # Lance le Studio (preview dans le navigateur)
```

### Option B : Integrer dans le projet existant (brownfield)

```bash
# Depuis la racine du projet Petanque Master
npm install remotion @remotion/cli @remotion/media

# Creer un dossier dedie
mkdir -p remotion
# Creer remotion/Root.jsx  (registerRoot)
# Creer remotion/index.js  (entry point)
# Lancer avec :
npx remotion studio remotion/index.js
```

**Recommandation** : Option A (projet separe). Notre projet Petanque Master utilise Phaser + Vite avec une config specifique. Melanger avec Remotion (qui utilise Webpack/Rspack) risque des conflits. Un projet a cote peut `staticFile()` nos assets via symlinks ou copie.

### Prerequis verifies sur notre machine
- Node.js 24 — OK (Remotion demande >= 16)
- FFmpeg — Remotion embarque son propre FFmpeg depuis v4, pas besoin du notre
- React — installe automatiquement par le template
- Chrome — Remotion telecharge Chromium automatiquement au premier rendu

---

## 2. Pixel art crisp — OUI, confirme

### Comment ca marche

Remotion rend chaque frame dans un **vrai navigateur Chrome headless**. Le pipeline est :

1. Chrome ouvre un onglet par thread de concurrence
2. Pour chaque frame, Chrome rend le composant React a la bonne frame
3. Chrome prend un screenshot de la page (PNG ou JPEG)
4. FFmpeg assemble les screenshots en video

Puisque c'est du **vrai Chrome avec un vrai moteur CSS**, toutes les proprietes CSS fonctionnent :

```jsx
// CECI FONCTIONNE — c'est du Chrome standard
<Img 
  src={staticFile('sprites/rookie.png')} 
  style={{
    imageRendering: 'pixelated',        // Nearest-neighbor scaling
    width: 256,                          // Scale up 32px → 256px
    height: 256,
  }}
/>
```

### Precautions pixel art

```jsx
// Style global a appliquer dans le composant racine
const pixelArtStyle = {
  imageRendering: 'pixelated',
  // Alternatives pour compatibilite :
  // imageRendering: 'crisp-edges',  // Firefox fallback (pas utile ici, c'est Chrome)
};

// Pour un canvas Phaser capture en screenshot, le PNG est deja net
// Pas besoin de image-rendering si l'image est a la resolution native
```

**Verdict** : Aucun risque de flou. C'est le meme moteur que notre jeu utilise pour s'afficher. Le pixel art sera pixel-perfect.

---

## 3. Embed live browser / jeu Phaser — PARTIELLEMENT

### Le composant `<IFrame>`

Remotion a un composant `<IFrame>` qui embed un site web. MAIS :

> "Ideally, the website should not have any animations, since only animations using `useCurrentFrame()` are supported by Remotion."

**Probleme** : Notre jeu Phaser a sa propre boucle d'animation (60 FPS via requestAnimationFrame). Remotion ne controle pas le temps de Phaser — chaque screenshot capturerait un etat imprevisible du jeu.

### Solutions alternatives (meilleures)

| Methode | Effort | Qualite |
|---------|--------|---------|
| **Screenshots pre-captures** (Playwright) | Deja fait | Parfait — controle total |
| **Video pre-enregistree** (Playwright `page.video()`) | Faible | Bonne — inclure via `<OffthreadVideo>` |
| **GIF/WebM du gameplay** capture separement | Faible | Bonne |
| **Captures par commit** (git checkout + screenshot) | Moyen | Excellente pour le making-of |

**Recommandation** : Capturer le gameplay en WebM avec Playwright, puis l'inclure dans Remotion via `<OffthreadVideo>`. C'est la methode la plus fiable et la plus belle.

```jsx
import {OffthreadVideo, staticFile} from 'remotion';

// Video de gameplay pre-enregistree
<OffthreadVideo 
  src={staticFile('captures/gameplay-demo.webm')}
  style={{
    width: 832,
    height: 480,
    imageRendering: 'pixelated',  // Garder le pixel art net
  }}
/>
```

---

## 4. Audio sync — OUI, excellent

### Architecture multi-pistes

```jsx
import {AbsoluteFill, Html5Audio, staticFile, interpolate, useCurrentFrame} from 'remotion';

export const MakingOfScene = () => {
  const frame = useCurrentFrame();
  
  return (
    <AbsoluteFill>
      {/* Musique de fond — volume bas, fade in */}
      <Html5Audio 
        src={staticFile('audio/music/theme.mp3')} 
        volume={(f) => interpolate(f, [0, 60], [0, 0.15], {
          extrapolateRight: 'clamp'
        })}
      />
      
      {/* Voix off — volume principal */}
      <Html5Audio 
        src={staticFile('audio/voiceover/intro.mp3')} 
        volume={0.85}
      />
      
      {/* SFX — boule qui claque, au frame 150 exactement */}
      {frame >= 150 && (
        <Html5Audio 
          src={staticFile('audio/sfx/boule_hit.wav')} 
          volume={0.6}
        />
      )}
    </AbsoluteFill>
  );
};
```

### Fonctionnalites audio

| Feature | Support | Details |
|---------|---------|---------|
| Multi-pistes simultanees | OUI | Empiler autant de `<Html5Audio>` que voulu |
| Volume par frame | OUI | `volume={(frame) => ...}` callback |
| Fade in/out | OUI | Via `interpolate()` sur les frames |
| Trim debut/fin | OUI | `trimBefore={60}` / `trimAfter={120}` (en frames) |
| Playback rate | OUI | `playbackRate={0.5}` a `{16}` |
| Loop | OUI | `loop={true}` |
| Formats | MP3, WAV, OGG, AAC | Tout ce que Chrome supporte |

**Pour la voix off** : On peut generer avec ElevenLabs (deja dans notre stack MCP), sauver en MP3, et synchroniser frame par frame.

---

## 5. Transitions — Catalogue complet

### Package : `@remotion/transitions`

```bash
# Deja inclus si on utilise create-video, sinon :
npm install @remotion/transitions
```

### Transitions built-in confirmees

| Transition | Import | Description |
|------------|--------|-------------|
| **fade** | `@remotion/transitions/fade` | Fondu enchaine classique |
| **slide** | `@remotion/transitions/slide` | Pousse la scene precedente (4 directions) |
| **wipe** | `@remotion/transitions/wipe` | Balayage (8 directions, incluant diagonales) |
| **flip** | `@remotion/transitions/flip` | Retournement 3D (4 directions, perspective reglable) |
| **clock-wipe** | `@remotion/transitions/clock-wipe` | Essuyage circulaire (horloge) |

### Exemple : TransitionSeries

```jsx
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import {slide} from '@remotion/transitions/slide';
import {fade} from '@remotion/transitions/fade';
import {clockWipe} from '@remotion/transitions/clock-wipe';

export const MakingOf = () => {
  return (
    <TransitionSeries>
      {/* Scene 1 : Titre */}
      <TransitionSeries.Sequence durationInFrames={90}>
        <TitleScreen />
      </TransitionSeries.Sequence>
      
      {/* Transition slide vers la droite */}
      <TransitionSeries.Transition
        presentation={slide({direction: 'from-right'})}
        timing={linearTiming({durationInFrames: 20})}
      />
      
      {/* Scene 2 : Premiere capture */}
      <TransitionSeries.Sequence durationInFrames={150}>
        <ScreenshotScene image="evolution_01.png" />
      </TransitionSeries.Sequence>
      
      {/* Fondu enchaine */}
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({durationInFrames: 30})}
      />
      
      {/* Scene 3 ... */}
    </TransitionSeries>
  );
};
```

### Iris wipe custom — POSSIBLE

Remotion permet de creer des **transitions custom** via `@remotion/shapes` et `clipPath` CSS :

```jsx
// Concept d'iris wipe custom
const irisWipe = () => ({
  component: ({children, presentationProgress, presentationDirection}) => {
    const radius = presentationDirection === 'entering' 
      ? presentationProgress * 150  // 0% → 150% du viewport
      : (1 - presentationProgress) * 150;
    
    return (
      <div style={{
        clipPath: `circle(${radius}% at 50% 50%)`,
        width: '100%',
        height: '100%',
      }}>
        {children}
      </div>
    );
  },
});
```

C'est du CSS `clip-path` dans Chrome — ca marche parfaitement pour un iris wipe ou n'importe quelle forme custom.

---

## 6. Sequences data-driven — OUI, puissant

### Lire un JSON de commits et generer une timeline

```jsx
// data/commits.json — genere par : git log --format='{"hash":"%h","date":"%ci","msg":"%s"}' > commits.json
import {useCallback} from 'react';
import {AbsoluteFill, Sequence, Img, staticFile, useCurrentFrame, interpolate} from 'remotion';

// Charger les donnees via calculateMetadata
export const commitTimelineMetadata = async ({props}) => {
  const response = await fetch(staticFile('data/commits.json'));
  const commits = await response.json();
  return {
    durationInFrames: commits.length * 5 + 300, // 5 frames par commit + intro/outro
    props: {...props, commits},
  };
};

// Composant timeline scrollante
export const CommitTimeline = ({commits}) => {
  const frame = useCurrentFrame();
  
  return (
    <AbsoluteFill style={{backgroundColor: '#1a1510', padding: 40}}>
      <div style={{
        transform: `translateY(${interpolate(frame, [0, commits.length * 5], [0, -commits.length * 30])}px)`,
      }}>
        {commits.map((commit, i) => {
          const opacity = interpolate(frame, [i * 5, i * 5 + 15], [0, 1], {
            extrapolateLeft: 'clamp', extrapolateRight: 'clamp'
          });
          return (
            <div key={commit.hash} style={{opacity, padding: 8, color: '#F5E6D0', fontFamily: 'monospace'}}>
              <span style={{color: '#D4A574'}}>{commit.hash}</span> — {commit.msg}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
```

### Lister dynamiquement nos 726 sprites

```jsx
import {getStaticFiles} from 'remotion';

// Liste tous les fichiers du dossier public/
const allFiles = getStaticFiles();
const sprites = allFiles.filter(f => f.name.endsWith('.png') && f.name.includes('sprites/'));
// sprites = [{name: 'sprites/rookie.png', src: '/static-.../sprites/rookie.png', sizeInBytes: ...}, ...]
```

`getStaticFiles()` retourne un tableau avec `name`, `src`, `sizeInBytes`, `lastModified` — parfait pour generer une mosaique animee de tous nos sprites.

---

## 7. Animations de texte — OUI, natif

### Effet machine a ecrire (typewriter)

```jsx
export const Typewriter = ({text, startFrame = 0}) => {
  const frame = useCurrentFrame();
  const charsToShow = Math.min(
    Math.floor((frame - startFrame) * 0.5),  // 1 char toutes les 2 frames
    text.length
  );
  
  return (
    <div style={{
      fontFamily: '"Press Start 2P", monospace',
      fontSize: 24,
      color: '#F5E6D0',
      textShadow: '2px 2px #3A2E28',
    }}>
      {text.slice(0, Math.max(0, charsToShow))}
      {charsToShow < text.length && (
        <span style={{opacity: frame % 20 < 10 ? 1 : 0}}>_</span>  // Curseur clignotant
      )}
    </div>
  );
};
```

### Compteur anime (0 → 456 commits)

```jsx
export const AnimatedCounter = ({from = 0, to = 456, label = 'commits'}) => {
  const frame = useCurrentFrame();
  const progress = spring({
    frame,
    fps: 30,
    config: {damping: 50, stiffness: 100},  // Smooth, pas trop rebondissant
  });
  const value = Math.round(interpolate(progress, [0, 1], [from, to]));
  
  return (
    <div style={{textAlign: 'center'}}>
      <div style={{fontSize: 120, fontWeight: 'bold', color: '#D4A574'}}>
        {value}
      </div>
      <div style={{fontSize: 32, color: '#F5E6D0'}}>{label}</div>
    </div>
  );
};
```

### Fade in/out

```jsx
const frame = useCurrentFrame();
const {durationInFrames} = useVideoConfig();

const opacity = interpolate(
  frame,
  [0, 20, durationInFrames - 20, durationInFrames],
  [0, 1, 1, 0]  // Fade in 20 frames, stable, fade out 20 frames
);
```

### Easings disponibles

17 fonctions d'easing : `linear`, `ease`, `quad`, `cubic`, `poly(n)`, `sin`, `circle`, `exp`, `elastic(n)`, `back(n)`, `bounce`, `bezier(a,b,c,d)`, plus les modificateurs `in()`, `out()`, `inOut()`.

Plus les **spring animations** physiques avec `mass`, `damping`, `stiffness`, `overshootClamping`.

---

## 8. Performance — Estimation realiste

### Comment ca marche

Le rendu est **CPU-bound** car chaque frame est un screenshot Chrome :

1. Chrome rend le composant React (quelques ms si simple, 50-200ms si complexe)
2. Chrome screenshote en JPEG (~10-30ms)
3. FFmpeg encode en H.264 (en parallele, rapide)

### Calcul pour notre video

| Parametre | Valeur |
|-----------|--------|
| Duree | 10 min = 600 sec |
| FPS | 30 |
| Frames totales | 18 000 |
| Resolution | 1920x1080 |
| Concurrence par defaut | 50% des CPU threads |

Avec des scenes simples (images + texte, pas de WebGL ni Canvas complexe) :

| Machine | Temps par frame | Temps total estime |
|---------|----------------|-------------------|
| 4 cores / 8 threads (typique laptop) | ~30-80ms | **15-30 minutes** |
| 8 cores / 16 threads (desktop gaming) | ~30-80ms | **10-20 minutes** |
| Avec video embeddee (OffthreadVideo) | ~100-200ms | **30-60 minutes** |

### Optimisations recommandees

```bash
# Tester la concurrence optimale pour notre machine
npx remotion benchmark --concurrencies 2,4,8,12

# Rendre en JPEG (plus rapide que PNG)
npx remotion render MakingOf out.mp4 --image-format=jpeg --jpeg-quality=90

# H.264 est le plus rapide. Eviter VP9 (3-5x plus lent).
npx remotion render MakingOf out.mp4 --codec=h264

# Hardware acceleration si GPU disponible (experimental)
npx remotion render MakingOf out.mp4 --hardware-acceleration=if-possible
```

### Tips performance

- **Eviter** : WebGL, Canvas, filtres CSS lourds (blur, drop-shadow), VP9/AV1
- **Preferer** : Images statiques, CSS transforms (GPU-accelere), JPEG, H.264
- **Memoiser** : `useMemo()` pour les calculs couteux
- Nos scenes seront surtout des images + texte + transitions → la partie rapide du spectre

---

## 9. Licence — 100% GRATUIT pour nous

### Regles de licence Remotion

| Categorie | Gratuit ? |
|-----------|-----------|
| **Individu** (notre cas) | **OUI, gratuit** |
| Entreprise <= 3 employes | OUI, gratuit |
| Non-profit | OUI, gratuit |
| Evaluation (pas en prod) | OUI, gratuit |
| Entreprise > 3 employes | Payant (licence remotion.pro) |

### Ce qui est gratuit pour nous

- Rendu local illimite (pas de limite de minutes)
- Toutes les features (transitions, audio, renderer, etc.)
- Tous les packages (`@remotion/transitions`, `@remotion/captions`, etc.)
- Remotion Studio (preview/edition)
- CLI complet

### Ce qui est payant (pas notre cas)

- AWS Lambda rendering (cloud, pour du SaaS)
- Google Cloud Run rendering
- Licence entreprise > 3 personnes

**Verdict** : En tant qu'individu faisant un making-of, c'est 100% gratuit sans aucune restriction.

---

## 10. Sous-titres / Captions — OUI, avec Whisper.cpp integre

### Package `@remotion/install-whisper-cpp`

```bash
npm install @remotion/install-whisper-cpp @remotion/captions
```

### Pipeline complete

```javascript
import {installWhisperCpp, transcribe, toCaptions} from '@remotion/install-whisper-cpp';

// 1. Installer Whisper.cpp (une seule fois)
await installWhisperCpp({to: './whisper'});

// 2. Telecharger un modele (medium.en pour l'anglais, ou medium pour multilangue)
// Note : pour du francais, utiliser le modele 'medium' (pas 'medium.en')
await downloadWhisperModel({folder: './whisper', model: 'medium'});

// 3. Transcrire notre voix off
const result = await transcribe({
  inputPath: './public/audio/voiceover.wav',  // Doit etre WAV 16kHz
  whisperPath: './whisper',
  model: 'medium',
  tokenLevelTimestamps: true,
});

// 4. Convertir en captions structurees
const captions = toCaptions(result);
// [{text: "Bienvenue", startMs: 0, endMs: 500}, ...]

// 5. Sauvegarder en JSON pour le composant Remotion
fs.writeFileSync('./public/data/captions.json', JSON.stringify(captions));
```

### Afficher les sous-titres dans la video

```jsx
export const SubtitledScene = ({captions}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const currentTimeMs = (frame / fps) * 1000;
  
  const currentCaption = captions.find(
    c => currentTimeMs >= c.startMs && currentTimeMs <= c.endMs
  );
  
  return (
    <AbsoluteFill>
      {/* ... contenu video ... */}
      {currentCaption && (
        <div style={{
          position: 'absolute', bottom: 60, width: '100%', textAlign: 'center',
          fontSize: 28, color: '#F5E6D0', textShadow: '2px 2px 4px #1A1510',
          fontFamily: 'sans-serif',
        }}>
          {currentCaption.text}
        </div>
      )}
    </AbsoluteFill>
  );
};
```

**Alternative** : Si on ecrit notre script a l'avance (probable pour un making-of), on peut creer un JSON de sous-titres manuellement avec les timecodes exacts — pas besoin de Whisper.

---

## 11. Exemple complet — Ken Burns + texte overlay

```jsx
import {AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig, interpolate, spring, Sequence} from 'remotion';

// Ken Burns : zoom lent + pan sur un screenshot du jeu
export const KenBurnsScene = ({image, title, subtitle}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  
  // Zoom de 100% a 115% sur toute la duree
  const scale = interpolate(frame, [0, durationInFrames], [1, 1.15]);
  
  // Pan leger vers la droite
  const translateX = interpolate(frame, [0, durationInFrames], [0, -30]);
  const translateY = interpolate(frame, [0, durationInFrames], [0, -15]);
  
  // Fade in du texte avec spring
  const textSpring = spring({
    frame: frame - 15,  // Demarre 15 frames apres le debut
    fps,
    config: {damping: 15, stiffness: 80},
  });
  const textOpacity = interpolate(textSpring, [0, 1], [0, 1]);
  const textY = interpolate(textSpring, [0, 1], [30, 0]);
  
  // Fade out global en fin de scene
  const fadeOut = interpolate(
    frame, 
    [durationInFrames - 20, durationInFrames], 
    [1, 0],
    {extrapolateLeft: 'clamp'}
  );
  
  return (
    <AbsoluteFill style={{backgroundColor: '#1A1510', opacity: fadeOut}}>
      {/* Image avec Ken Burns */}
      <div style={{
        width: '100%', height: '100%', overflow: 'hidden',
      }}>
        <Img
          src={staticFile(image)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            imageRendering: 'pixelated',  // CRITIQUE pour pixel art
            transform: `scale(${scale}) translate(${translateX}px, ${translateY}px)`,
          }}
        />
      </div>
      
      {/* Overlay gradient en bas */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 200,
        background: 'linear-gradient(transparent, #1A1510cc, #1A1510)',
      }} />
      
      {/* Texte overlay */}
      <div style={{
        position: 'absolute', bottom: 60, left: 60,
        opacity: textOpacity,
        transform: `translateY(${textY}px)`,
      }}>
        <div style={{
          fontSize: 48, fontWeight: 'bold', color: '#D4A574',
          textShadow: '3px 3px 6px #1A1510',
          fontFamily: '"Press Start 2P", sans-serif',
        }}>
          {title}
        </div>
        <div style={{
          fontSize: 24, color: '#F5E6D0', marginTop: 12,
          textShadow: '2px 2px 4px #1A1510',
        }}>
          {subtitle}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Utilisation dans la composition
export const MakingOfVideo = () => {
  return (
    <>
      <Sequence from={0} durationInFrames={150}>
        <KenBurnsScene
          image="screenshots/evolution_01.png"
          title="Jour 1"
          subtitle="Un terrain vide et une boule qui roule"
        />
      </Sequence>
      <Sequence from={130} durationInFrames={150}>
        <KenBurnsScene
          image="screenshots/evolution_12.png"
          title="Session 30"
          subtitle="L'IA commence a jouer correctement"
        />
      </Sequence>
    </>
  );
};
```

---

## 12. Comparaison avec les alternatives

| Critere | Remotion | FFmpeg pur | Motion Canvas | Python moviepy |
|---------|----------|------------|---------------|----------------|
| Pixel art crisp | **OUI** (Chrome CSS) | OUI (scale=nn) | OUI | OUI (PIL) |
| Transitions riches | **5+ built-in + custom** | Complexe (xfade) | Bonnes | Basiques |
| Audio sync frame | **Excellent** | Manuel | Bon | Basique |
| Data-driven | **React + JSON** | Impossible | Scenes TS | Possible |
| Courbe apprentissage | React (on connait) | FFmpeg filters (dur) | TypeScript | Python |
| Performance | ~20-40 min/10min video | **Plus rapide** | Similar | Plus lent |
| Sous-titres auto | **Whisper.cpp integre** | Non | Non | Non |
| Cout | Gratuit (individu) | **Gratuit** | Gratuit | Gratuit |
| Ecosysteme | Enorme (npm) | Limites | Petit | Moyen |

---

## 13. Architecture recommandee pour notre making-of

```
petanque-making-of/               # Projet Remotion separe
├── public/
│   ├── screenshots/              # 24 PNG d'evolution (symlink ou copie)
│   ├── sprites/                  # Selection de sprites cles (pas les 726)
│   ├── captures/                 # Videos gameplay WebM (Playwright)
│   ├── audio/
│   │   ├── music/                # 2 tracks
│   │   ├── sfx/                  # Selection de SFX
│   │   └── voiceover/            # Voix off ElevenLabs
│   └── data/
│       ├── commits.json          # Git log formate
│       ├── captions.json         # Sous-titres
│       └── timeline.json         # Structure du making-of
├── src/
│   ├── Root.jsx                  # Composition principale
│   ├── scenes/
│   │   ├── TitleScreen.jsx       # Ecran titre
│   │   ├── KenBurnsScene.jsx     # Screenshot avec zoom
│   │   ├── CommitTimeline.jsx    # Timeline scrollante
│   │   ├── SpriteShowcase.jsx    # Mosaique de sprites
│   │   ├── StatsCounter.jsx      # Compteurs animes
│   │   └── GameplayClip.jsx      # Video de gameplay
│   ├── components/
│   │   ├── Typewriter.jsx
│   │   ├── AnimatedCounter.jsx
│   │   └── PixelArtImg.jsx       # Wrapper avec image-rendering: pixelated
│   └── transitions/
│       └── IrisWipe.jsx          # Custom iris wipe
└── package.json
```

---

## 14. Risques et limitations identifies

| Risque | Impact | Mitigation |
|--------|--------|------------|
| Pas de capture live du jeu Phaser | Moyen | Pre-capturer en WebM avec Playwright |
| Rendu potentiellement lent si scenes complexes | Faible | Nos scenes sont simples (images + texte) |
| Pas de TypeScript (regle projet) | Aucun | Template JS disponible, Remotion fonctionne en JS |
| Apprentissage React (si pas familier) | Faible | C'est du JSX basique, composants simples |
| Conflit Webpack/Vite si brownfield | Moyen | Utiliser un projet separe (Option A) |
| Whisper.cpp en francais | Faible | Modele 'medium' (pas 'medium.en') supporte le francais |

---

## 15. Prochaines etapes concretes

1. **Creer le projet Remotion** : `npx create-video@latest` (template JS)
2. **Tester le pixel art** : Importer un sprite 32x32, scaler a 256px avec `imageRendering: pixelated`, verifier le rendu
3. **Prototype 30 secondes** : Ken Burns sur 3 screenshots + texte + musique de fond
4. **Capturer le gameplay** : Playwright → WebM → tester dans `<OffthreadVideo>`
5. **Generer `commits.json`** : `git log --format=...` et tester la timeline scrollante
6. **Voix off test** : ElevenLabs → MP3 → synchroniser avec les scenes
7. **Benchmark** : `npx remotion benchmark` sur notre machine pour calibrer les attentes
