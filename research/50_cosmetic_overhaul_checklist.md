# 50 — Cosmetic Overhaul & Visual Polish Checklist

> A lire quand : on fait le polish final, on prepare le jeu pour le public, ou on verifie que tout est "presentable".
> Complementaire a : research/34 (UI/UX), research/47 (camera/slowmo), research/14 (polish Phaser 3)

---

## 1. ECRANS DE MENU MEMORABLES — REFERENCES

### 1.1 Ce qui fait un bon ecran titre

| Jeu | Elements | Ce qu'on en retient |
|-----|----------|-------------------|
| **Celeste** | Montagne en fond, neige, lumiere douce, musique piano | La simplicite + le mouvement subtil = elegance |
| **Hollow Knight** | Environnement vivant (pluie, lucieres), perso assis | Le perso dans la scene = le joueur est deja "dans le jeu" |
| **Stardew Valley** | Ferme, saisons, oiseaux, musique guitare | La chaleur et le confort invitent a entrer |
| **Hades** | Zagreus devant la maison, PNJ en arriere-plan | Les persos vivent meme avant que le joueur ne joue |
| **Shovel Knight** | Titre pixel art, etoiles, musique epique | Le logo = l'identite. Simple mais puissant |

### 1.2 Points communs = recette

| Element | Obligatoire | Nice-to-have |
|---------|------------|-------------|
| Background illustre (pas une couleur unie) | ✅ | — |
| Logo/titre avec ombre portee | ✅ | Animation du logo |
| Musique qui demarre immediatement | ✅ | — |
| Particules subtiles (poussiere, lucioles) | — | ✅ |
| Mouvement subtil (parallax, vent, eau) | — | ✅ |
| Personnage visible | — | ✅ (Phase 2) |

### 1.3 TitleScene PM — Specification

```
┌──────────────────────────────────────────────────┐
│                                                   │
│   ☀️ Ciel coucher de soleil (gradient chaud)       │
│   🌳 Platanes en silhouette (parallax lent)       │
│                                                   │
│          PETANQUE MASTER                          │
│         (logo pixel art, ombre #3A2E28)           │
│                                                   │
│   ✨ Lucioles flottantes (8-12 particules)         │
│                                                   │
│           ► ARCADE                                │
│             QUICK PLAY                            │
│             BOUTIQUE                              │
│             OPTIONS                               │
│                                                   │
│   [v1.0]                    [Ecus: 350]           │
│                                                   │
│   🏟️ Terrain de petanque au premier plan           │
│   (boules posees, cochonnet, banc)                │
└──────────────────────────────────────────────────┘
```

**Couches (arriere en avant)** :
1. Ciel gradient (orange #FFB74D → violet #7E57C2 → bleu nuit #1A237E)
2. Montagnes/collines en silhouette (1-2px de mouvement parallax)
3. Platanes/oliviers (parallax plus rapide)
4. Terrain de petanque au sol (statique)
5. Boules et cochonnet poses (statique)
6. Logo + menu (UI layer, pas de scroll)
7. Particules (lucieres dorées)

---

## 2. CHARACTER SELECT — REFERENCES FIGHTING GAMES

### 2.1 Street Fighter II — La reference absolue

**Ce qui est iconique** :
- Grille de portraits (lineup)
- Curseur anime qui bounce
- Portrait qui apparait a droite au survol
- Flash blanc a la selection
- SFX distinct pour chaque action (move, select, deselect)
- Fond sombre avec spotlight sur le perso selectionne

### 2.2 Skullgirls — Portraits expressifs

| Element | Detail |
|---------|--------|
| Portraits | Dessins expressifs, pas des captures de sprite |
| Au survol | Le portrait "reagit" (clignement, mouvement) |
| Stats | Barres sous le portrait avec icones |
| Son | Chaque perso dit une phrase courte au survol |

### 2.3 Ce qu'on peut reproduire en pixel art 832x480

```
┌──── CHOISISSEZ VOTRE CHAMPION ───────────────────┐
│                                                    │
│  ┌──┐ ┌──┐ ┌──┐        ┌──────────────────┐      │
│  │R │ │L │ │Ch│        │                  │      │
│  │  │ │  │ │  │        │  [PORTRAIT 128]  │      │
│  └──┘ └──┘ └──┘        │                  │      │
│  ┌──┐ ┌──┐ ┌──┐        │  "Le Rookie"     │      │
│  │Ma│ │Mg│ │??│        │  L'Apprenti      │      │
│  │  │ │  │ │  │        │                  │      │
│  └──┘ └──┘ └──┘        │  PRE ████░░ 3   │      │
│                          │  PUI ███░░░ 3   │      │
│  ► Curseur anime         │  EFF ██░░░░ 2   │      │
│                          │  S-F ██░░░░ 2   │      │
│                          │                  │      │
│                          │ "J'apprends vite"│      │
│                          └──────────────────┘      │
│                                                    │
│                    [CONFIRMER]                      │
└────────────────────────────────────────────────────┘
```

**Elements pixel art** :
- Thumbnails 48x48 ou 64x64 (sprite agrandi + cadre dore)
- Portrait selectionne 128x128 pixel art detaille
- Barres de stats pixel art (1px = 1 unite de stat)
- Cadre de selection dore avec glow
- Perso verrouille = silhouette noire + cadenas pixel

### 2.4 Animations CharSelect

| Element | Animation | Timing |
|---------|----------|--------|
| Curseur | Pulse scale 1.0↔1.1 | 600ms loop |
| Portrait thumbnail | Idle breathing (2 frames) | 1s loop |
| Portrait large (au survol) | Slide in depuis la droite | 300ms, Back.easeOut |
| Barres de stats | Fill progressif 0→valeur | 400ms, Quad.easeOut |
| Catchphrase | Typewriter (lettre par lettre) | 30ms/lettre |
| Selection confirmee | Flash blanc + zoom portrait | 200ms flash, 300ms zoom |
| Perso verrouille (survol) | Shake leger + son "bloque" | 200ms |

---

## 3. TRANSITIONS ET ANIMATIONS

### 3.1 Types de transitions pixel art

| Type | Description | Duree | Usage |
|------|-----------|-------|-------|
| **Fade noir** | Opacity 1→0→1 via noir | 400-600ms | Standard, entre la plupart des scenes |
| **Wipe horizontal** | Un rideau qui balaie | 600-800ms | Menu → Select |
| **Flash blanc** | Eclair puis scene suivante | 200-300ms | Select → VS |
| **Pixel dissolve** | Les pixels disparaissent aleatoirement | 600ms | Stylise, pour les transitions speciales |
| **Iris** | Cercle qui se ferme/ouvre | 500ms | Retro (Mario, Zelda) |
| **Slide** | La scene glisse, l'autre arrive | 400ms | Menu → Boutique |

### 3.2 Implementation Phaser 3

```javascript
// Fade standard
fadeTransition(scene, nextScene, duration = 400) {
  scene.cameras.main.fadeOut(duration, 0, 0, 0);
  scene.cameras.main.once('camerafadeoutcomplete', () => {
    scene.scene.start(nextScene);
  });
}

// Pixel dissolve (custom)
pixelDissolve(scene, nextScene) {
  const rt = scene.add.renderTexture(0, 0, 832, 480).setDepth(9999);
  const pixels = [];
  for (let x = 0; x < 832; x += 4) {
    for (let y = 0; y < 480; y += 4) {
      pixels.push({ x, y, delay: Math.random() * 600 });
    }
  }
  pixels.sort((a, b) => a.delay - b.delay);

  let i = 0;
  scene.time.addEvent({
    delay: 2, // ~500 FPS de dissolution
    repeat: pixels.length - 1,
    callback: () => {
      rt.fill(0x000000, 1, pixels[i].x, pixels[i].y, 4, 4);
      i++;
      if (i >= pixels.length) scene.scene.start(nextScene);
    }
  });
}

// Iris (cercle qui se ferme)
irisTransition(scene, nextScene, centerX, centerY) {
  const mask = scene.add.circle(centerX, centerY, 600, 0x000000, 0)
    .setDepth(9999);
  scene.tweens.add({
    targets: mask,
    radius: 0,
    duration: 500,
    ease: 'Quad.easeIn',
    onComplete: () => scene.scene.start(nextScene)
  });
}
```

### 3.3 Feedback sonore par transition

| Transition | Son |
|-----------|-----|
| Fade noir | Whoosh descendant leger |
| Flash blanc | Impact sec + reverb |
| Wipe | Swoosh horizontal |
| Selection confirmee | "Clang" metallique |
| Retour menu | Son doux descendant |

---

## 4. PARTICULES QUI CHANGENT TOUT

### 4.1 Catalogue de particules PM

| Particule | Scene | Quantite | Mouvement | Couleur |
|-----------|-------|----------|-----------|---------|
| **Lucioles** | TitleScene | 8-12 | Sinusoidal lent | Jaune dore #FFD700, alpha 0.3-0.7 |
| **Poussiere impact** | PetanqueScene | 5-10 par impact | Explosion radiale | Brun #8D6E63, taille 2-4px |
| **Confettis** | ResultScene (victoire) | 30-50 | Chute avec oscillation | Multi-couleur, 3-5px |
| **Eclats** | PetanqueScene (carreau) | 15-20 | Explosion + gravite | Dore #FFD700 + blanc |
| **Trail** | PetanqueScene (boule rapide) | 1 par frame | Suit la boule | Couleur boule, alpha decroissant |
| **Etincelles** | VSIntroScene | 10-15 | Le long de la diagonale VS | Blanc + jaune |
| **Feuilles** | Terrain Parc | 3-5 | Derive laterale + chute | Vert #6B7F3B |
| **Sable** | Terrain Plage | 3-5 au vent | Derive laterale | Beige #D7CCC8 |

### 4.2 Performance — Limites

| Plateforme | Max particules safe (60 FPS) | Max absolu |
|-----------|----------------------------|-----------|
| Desktop | 100 | 200 |
| Mobile mid-range | 30 | 50 |
| Mobile low-end | 15 | 25 |

**Regle** : adapter le `maxParticles` selon la plateforme detectee.

### 4.3 Implementation Phaser 3

```javascript
// Lucioles (TitleScene)
const fireflies = this.add.particles(0, 0, 'particle_glow', {
  x: { min: 50, max: 782 },
  y: { min: 100, max: 400 },
  scale: { start: 0.3, end: 0.1 },
  alpha: { start: 0.7, end: 0.2 },
  lifespan: 4000,
  frequency: 500,
  maxParticles: 12,
  tint: 0xFFD700,
  blendMode: 'ADD',
  // Mouvement sinusoidal
  speedX: { min: -10, max: 10 },
  speedY: { min: -5, max: 5 }
});

// Poussiere d'impact (quand la boule atterrit)
function dustImpact(scene, x, y, terrain) {
  const color = terrain === 'plage' ? 0xD7CCC8 : 0x8D6E63;
  const emitter = scene.add.particles(x, y, 'particle_dust', {
    speed: { min: 20, max: 60 },
    angle: { min: 200, max: 340 },
    scale: { start: 0.5, end: 0 },
    alpha: { start: 0.8, end: 0 },
    lifespan: 400,
    quantity: 8,
    tint: color,
    gravityY: 50,
    maxParticles: 8
  });
  // Auto-destroy apres emission
  scene.time.delayedCall(500, () => emitter.destroy());
}

// Confettis (victoire)
function confetti(scene) {
  const colors = [0xFF5252, 0x448AFF, 0xFFD740, 0x69F0AE, 0xE040FB];
  const emitter = scene.add.particles(416, -20, 'particle_confetti', {
    x: { min: 0, max: 832 },
    speed: { min: 50, max: 150 },
    angle: { min: 80, max: 100 },
    rotate: { min: 0, max: 360 },
    scale: { min: 0.3, max: 0.6 },
    alpha: { start: 1, end: 0.3 },
    lifespan: 3000,
    frequency: 50,
    maxParticles: 40,
    tint: { random: colors },
    gravityY: 30
  });
  scene.time.delayedCall(3000, () => emitter.stop());
}
```

---

## 5. CHECKLIST "PRET POUR LE PUBLIC"

### 5.1 MUST-HAVE (lancement impossible sans)

| # | Element | Scene | Status |
|---|---------|-------|--------|
| 1 | Ecran titre avec background, logo, musique | TitleScene | □ |
| 2 | Selection perso avec portraits, stats animees, SFX | CharSelectScene | □ |
| 3 | VS screen avec animation, flash, noms | VSIntroScene | □ |
| 4 | In-game : camera follow sur la boule | PetanqueScene | □ |
| 5 | In-game : poussiere d'impact au sol | PetanqueScene | □ |
| 6 | In-game : son d'impact satisfaisant (layere) | PetanqueScene | □ |
| 7 | In-game : score avec feedback visuel (bounce) | PetanqueScene | □ |
| 8 | Resultats : confettis victoire, stats, animation | ResultScene | □ |
| 9 | Transitions smooth entre TOUTES les scenes | Global | □ |
| 10 | Audio sur chaque interaction (clic, survol, validation) | Global | □ |
| 11 | Loading graceful (barre de progression, pas d'ecran noir) | BootScene | □ |
| 12 | Aucun texte coupe ou mal aligne | Global | □ |
| 13 | 60 FPS stable sur desktop | Global | □ |
| 14 | Audio unlock au premier input (mobile) | Global | □ |
| 15 | Pixel art : pas de flou, pas d'anti-alias | Global | □ |

### 5.2 NICE-TO-HAVE (ameliore la perception qualite)

| # | Element | Scene | Impact percu |
|---|---------|-------|-------------|
| 16 | Particules lucioles ecran titre | TitleScene | Fort |
| 17 | Parallax background titre (2-3 couches) | TitleScene | Fort |
| 18 | Slow-mo sur les carreaux | PetanqueScene | Tres fort |
| 19 | Zoom dynamique pres du cochonnet | PetanqueScene | Fort |
| 20 | Traces d'impact permanentes (RenderTexture) | PetanqueScene | Moyen |
| 21 | Idle breathing animation (2 frames) | Persos | Fort |
| 22 | Micro-animations de personnalite | Persos | Moyen |
| 23 | Vignette en match point | PetanqueScene | Moyen |
| 24 | Pixel dissolve transition | Global | Faible |
| 25 | Ecran de chargement avec tips | BootScene | Moyen |

### 5.3 POST-LANCEMENT (Phase 2+)

| # | Element | Phase |
|---|---------|-------|
| 26 | Evolution visuelle du Rookie (3 tenues) | Phase 2 |
| 27 | Boutique avec marchand PNJ | Phase 2 |
| 28 | Replays partageables | Phase 2 |
| 29 | Screenshot de resultat stylise (partage) | Phase 2 |
| 30 | Classement en ligne | Phase 3 |

---

## 6. ESTIMATION EFFORT POLISH

| Tache | Effort | Priorite | Impact |
|-------|--------|----------|--------|
| Background TitleScene (illustration + parallax) | 6h | P1 | Tres fort |
| Logo pixel art "PETANQUE MASTER" | 2h | P1 | Fort |
| Camera follow boule (lerp dynamique) | 2h | P1 | Fort |
| Slow-mo + hitstop carreau | 3h | P1 | Tres fort |
| Poussiere d'impact | 1h | P1 | Fort |
| Confettis victoire (upgrade) | 1h | P2 | Moyen |
| Transitions smooth (toutes scenes) | 3h | P1 | Fort |
| Feedback sonore navigation | 2h | P1 | Fort |
| Idle breathing (2 frames, 5 persos) | 3h | P2 | Fort |
| Portraits 128x128 (5 persos) | 8h | P1 | Tres fort |
| Stats animees CharSelect | 2h | P1 | Fort |
| Zoom dynamique cochonnet | 2h | P2 | Fort |
| Lucioles TitleScene | 1h | P2 | Moyen |
| **Total** | **~36h** | — | — |

**Strategie** : faire les P1 d'abord (~20h), puis les P2 si le temps le permet (~16h).

---

## 7. ANTI-PATTERNS VISUELS

| Anti-pattern | Consequence | Solution |
|-------------|------------|---------|
| Ecran noir entre les scenes | Le jeu semble casse | Toujours un fade/transition |
| Texte sans fond sur terrain charge | Illisible | Panneau semi-transparent derriere |
| Sprites floues (anti-alias) | Perd le look pixel art | `pixelArt: true`, `roundPixels: true` |
| Logo en police web generique | Pas memorisable | Logo pixel art dessine a la main |
| Menu sans musique | Ambiance morte | Musique des le titre |
| Transitions trop longues | Frustrant apres 5 matchs | Skipable au tap/clic apres 1er visionnage |
| Trop de particules | Distrait du gameplay | Max 30 particules in-game |
| Screen shake trop fort | Nausee | Intensite max 0.005, desactivable |
| Couleurs criardes | Fatigue visuelle | Palette provencale douce |
| Animations UI sans easing | Mouvement robotique | Toujours Back/Quad/Sine easing |
