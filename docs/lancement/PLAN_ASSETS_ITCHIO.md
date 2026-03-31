# Plan de creation des assets itch.io — Petanque Master

> **Date** : 31 mars 2026
> **Objectif** : Produire tous les assets marketing de qualite professionnelle
> **Executant** : Claude (Sonnet 4.6) + humain pour validation

---

## SYNTHESE DE LA RECHERCHE

### Ce qui fait la difference entre amateur et pro

| Amateur | Professionnel |
|---------|---------------|
| Upscale bilineaire (flou) | Nearest Neighbor (pixels nets) |
| Screenshot d'un ecran de tuto | Moment d'action choreographie (boule en vol, impact slow-mo) |
| Cover = fond uni + sprites colles | Cover = scene de jeu composee avec logo, profondeur, ambiance |
| GIF = gameplay robotique | GIF = une action satisfaisante en boucle (3-5s) |
| 1-2 screenshots identiques | 5+ screenshots montrant la variete (terrains, persos, shop) |

### Ce qu'on sait de la conversion itch.io

- **GIF anime > image statique** pour la couverture (badge "GIF" visible dans les listings)
- **36% view-to-play** est un bon taux pour un jeu HTML5 gratuit
- **Au-dessus du fold** : cover/GIF + titre + sous-titre + bouton "Run Game" — la plupart des visiteurs ne scrollent PAS
- **Premiere impression en 3 secondes** : chaque screenshot doit communiquer UNE chose
- **5 screenshots** est le nombre optimal (moins = manque de contenu, plus = dilution)

### Outils disponibles et confirmes

| Outil | Installe ? | Usage |
|-------|-----------|-------|
| **Playwright 1.58** + Chromium 145 | OUI | Captures automatiques en mode headed (GPU reel) |
| **Sharp 0.34.5** | OUI | Post-traitement : upscale NN, composition, bordures |
| **ffmpeg 8.0** | OUI | Conversion video → GIF pixel-perfect |
| **Press Start 2P** | OUI (`public/assets/fonts/`) | Police pixel art pour overlays |
| **ScreenToGif** | A installer (gratuit) | Capture manuelle de GIF (backup) |
| **Gifski** | A installer (optionnel) | Encodeur GIF haute qualite |

---

## PLAN D'EXECUTION (7 etapes)

### ETAPE 1 — Bypass du tutoriel (prerequis)

Le tutoriel bloque les screenshots de gameplay. Il faut le desactiver AVANT toute capture.

**Script a executer dans la console du navigateur OU via page.evaluate() :**
```javascript
const save = JSON.parse(localStorage.getItem('petanque_master_save') || '{}');
save.tutorialSeen = true;
save.tutorialInGameSeen = true;
save.tutorialComplete = true;
save.tutorialPhasesDone = [0, 1, 2, 3, 4, 5];
save.galets = 250; // Pour que la boutique ait du contenu
if (!save.stats) save.stats = {};
save.stats.totalMatchesPlayed = 10;
localStorage.setItem('petanque_master_save', JSON.stringify(save));
location.reload();
```

### ETAPE 2 — Captures des 5 screenshots (Playwright headed, GPU reel)

**Methode** : Playwright en mode `headless: false` (GPU reel, rendu identique au navigateur du joueur). Pas de SwiftShader. Canvas screenshot a 2x (1664x960).

**Navigation** : utiliser `page.evaluate()` pour injecter directement les scenes via l'API Phaser (`game.scene.start()`), avec les bonnes donnees.

| # | Scene | Donnees a injecter | Moment de capture | Question repondue |
|---|-------|--------------------|-------------------|-------------------|
| 1 | **TitleScene** | Aucune (boot naturel) | Apres animation d'entree (2s) | "C'est beau ?" |
| 2 | **PetanqueScene** Village | `terrain:'terre'`, opponent: Papi Rene | Apres le cochonnet pose, AVANT le 1er lancer (terrain visible, UI propre) | "C'est fun ?" |
| 3 | **PetanqueScene** Plage | `terrain:'sable'`, opponent: Mamie Josette | Meme moment, terrain different | "C'est varie ?" |
| 4 | **VSIntroScene** | Rookie vs Papi Rene, `difficulty:'hard'` | Au pic de l'animation VS (1.5-2s apres start) | "Il y a de la personnalite ?" |
| 5 | **ShopScene** | `galets: 250` dans le save | Scene completement chargee (1.5s) | "Il y a de la profondeur ?" |

**Points critiques pour la qualite :**
- `headless: false` — GPU reel, pas SwiftShader
- `deviceScaleFactor: 2` — sortie 1664x960 (2x integer scale, pixels nets)
- `page.locator('canvas').screenshot()` — capture le canvas uniquement, pas le chrome navigateur
- Attendre que les animations d'entree soient finies avant de capturer
- Le tutoriel est bypasse via localStorage APRES le goto (pas avant)

### ETAPE 3 — Capture video pour le GIF (Playwright headed)

**Scenario** : Lancer un match Rookie vs Papi Rene sur Village, laisser le jeu jouer 15-20s, capturer le premier lancer (humain ou IA).

**Methode** : `recordVideo` dans le context Playwright, viewport 832x480 @1x.

**Alternative (meilleure qualite)** : Lancer `npm run dev`, jouer manuellement, capturer avec ScreenToGif. Le timing humain est toujours plus dramatique qu'un script.

### ETAPE 4 — Conversion video → GIF (ffmpeg)

**Commande pixel-perfect pour pixel art :**
```bash
ffmpeg -y -ss [DEBUT] -t 5 -i video.webm \
  -vf "fps=15,scale=832:480:flags=neighbor,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=none" \
  -loop 0 header.gif
```

**Cle** : `flags=neighbor` (pas de flou) + `dither=none` (couleurs pixel art nettes, pas de bruit).

**Cible** : < 3 MB, 3-5 secondes, 15 FPS. Le premier frame doit etre lisible seul (itch.io l'affiche en statique).

**Si > 3 MB** : reduire `max_colors` a 96, ou couper a 3s.

### ETAPE 5 — Cover art 630x500 (2 options)

#### Option A — Capture VSIntro comme base (RECOMMANDEE)

La scene VSIntroScene a deja une composition pro :
- Split diagonal bleu/rouge avec separateur or
- Deux personnages face a face
- Texte "VS" geant en or
- Ambiance dramatique

**Workflow :**
1. Playwright headed : forcer VSIntroScene avec Rookie vs Papi Rene
2. Capturer au pic de l'animation (1.5s)
3. Sharp : recadrer a 630x500, ajouter overlay titre "PETANQUE MASTER" en haut, "Free Browser Game" en bas
4. Verifier lisibilite a 315x250

#### Option B — Composition depuis TitleScene

1. Capturer TitleScene (le logo lauriers + coucher de soleil est deja magnifique)
2. Sharp : recadrer, ajouter un personnage en overlay, sous-titre
3. Plus simple mais moins d'impact "action"

#### Post-traitement Sharp (pour les deux options) :
```javascript
sharp(capture)
  .resize(630, 500, { fit: 'cover', kernel: sharp.kernel.nearest })
  .composite([
    { input: titleOverlay, top: 20, left: 0 },      // Logo titre
    { input: subtitleOverlay, top: 440, left: 0 },   // "Free Browser Game"
  ])
  .png()
  .toFile('cover-art-630x500.png');
```

### ETAPE 6 — Textes marketing (Claude genere directement)

| Texte | Contenu | Ou le mettre |
|-------|---------|-------------|
| **Devlog #1** | "Why I made a petanque game" — hook historique + 3 GIFs + pitch + CTA | itch.io devlog |
| **Post r/WebGames** | Titre accrocheur + lien direct | Reddit jour J |
| **Post r/indiegames** | GIF + "I made a petanque game in pixel art" | Reddit jour J |
| **Post r/petanque** | Texte personnel + FIPJP + lien | Reddit jour J |
| **Post r/PixelArt** | Screenshot terrain + PAS de lien | Reddit J-1 |
| **Thread Twitter/X** | 5 tweets : GIF + physique + personnages + terrains + lien | Twitter jour J |

### ETAPE 7 — Build final + ZIP

```bash
npm run build
cd dist && zip -r ../petanque-master-v1.0.0.zip . && cd ..
ls -lh petanque-master-v1.0.0.zip  # Cible : ~11 MB
```

---

## CHECKLIST DE QUALITE (valider avant upload)

- [ ] **Cover art** lisible a 315x250 (titre + personnage identifiables)
- [ ] **GIF** : premier frame lisible seul, boucle satisfaisante, < 3 MB
- [ ] **Screenshots** : 5 images distinctes, pas de tuto visible, pas de dialogue qui cache le terrain
- [ ] **Aucun #000** visible (ni dans le code, ni dans les assets)
- [ ] **Pas de mention du commentateur** (supprime du projet)
- [ ] **12 personnages** (pas 14) dans la description
- [ ] **3 lancers** (pas 6 techniques) dans la description
- [ ] **FR 100% + EN 100%** (pas 95%)
- [ ] **Build OK** : `npx vitest run` → 3011+ tests, `npm run build` → 0 erreurs

---

## SORTIE ATTENDUE

```
docs/lancement/assets/
  screenshots/
    01-title-ambiance.png        (1664x960, ~100 KB)
    02-gameplay-village.png      (1664x960, ~120 KB)
    03-gameplay-plage.png        (1664x960, ~120 KB)
    04-vsintro-personnages.png   (1664x960, ~100 KB)
    05-shop-profondeur.png       (1664x960, ~110 KB)
  cover-art-630x500.png          (630x500, ~50 KB)
  cover-art-thumb-315x250.png    (315x250, ~15 KB)
  gif carreau/
    header.gif                   (832x480, <3 MB)
  social/
    twitter-header-1500x500.png  (1500x500, optionnel)
```

---

## CE QUE CLAUDE FAIT vs CE QUE L'HUMAIN FAIT

| Tache | Qui | Pourquoi |
|-------|-----|----------|
| Script Playwright headed + screenshots | Claude | Automatisable, reproductible |
| Cover art (capture VSIntro + overlay Sharp) | Claude | Composition automatique |
| GIF (video → ffmpeg) | Claude (v1) + Humain (v2 si besoin) | Le script fait une v1 correcte, le manuel est mieux pour le timing |
| Textes marketing | Claude | Redaction directe |
| Build + ZIP | Claude | Commande |
| Creer la page itch.io | Humain | Pas d'API |
| Upload assets + description | Humain | Manuel dans le navigateur |
| Poster Reddit/Twitter | Humain | Manuel |

---

*Plan cree le 31 mars 2026. Basé sur la recherche de : itch.io docs, CrazyGames requirements, indie game marketing best practices 2026, outils pixel art.*
