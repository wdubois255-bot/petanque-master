# 34 — UI/UX : Patterns Fighting Game appliqués à Petanque Master

> A lire quand : on travaille sur les menus, le HUD, la selection de personnage, les transitions entre scenes.

---

## 1. PHILOSOPHIE UI FIGHTING GAME

Les jeux de combat (Street Fighter, Tekken, Guilty Gear, Rivals of Aether) ont codifie une grammaire UI que les joueurs reconnaissent instinctivement. Petanque Master emprunte ce vocabulaire pour creer un sentiment de **competition** et de **charisme** autour d'un sport calme.

**Principe fondamental :** chaque ecran doit donner l'impression que quelque chose d'epique est sur le point de se produire.

### Ce qu'on emprunte
| Element | Jeu de reference | Application Petanque Master |
|---------|-----------------|---------------------------|
| Grille de selection avec curseur anime | Street Fighter 2 | CharSelectScene — grille 3x3 |
| VS splash screen split diagonal | Tekken 7 | VSIntroScene — portraits face a face |
| Barres de stats animees | Fire Emblem GBA | Panel stats perso selectionne |
| HUD minimaliste en match | Windjammers | ScorePanel — score + tour + boules restantes |
| Ecran resultat dramatique | Guilty Gear Strive | ResultScene — animation victoire/defaite |
| Menu titre avec ambiance | Street Fighter 6 | TitleScene — ambiance provencale |

---

## 2. ECRAN DE SELECTION DE PERSONNAGE

### 2.1 Layout reference (Street Fighter 2 / Rivals of Aether)

```
┌──────────────────────────────────────────────────┐
│  ┌────┐ ┌────┐ ┌────┐                            │
│  │ P1 │ │ P2 │ │ P3 │     ┌──────────────────┐   │
│  └────┘ └────┘ └────┘     │                  │   │
│  ┌────┐ ┌────┐ ┌────┐     │  PORTRAIT LARGE  │   │
│  │ P4 │ │ P5 │ │ ?? │     │  + STATS BARRES  │   │
│  └────┘ └────┘ └────┘     │  + CATCHPHRASE   │   │
│                            └──────────────────┘   │
│  [NOM DU PERSONNAGE]        READY? ▶             │
└──────────────────────────────────────────────────┘
```

### 2.2 Comportements attendus

| Action | Feedback visuel | Feedback audio |
|--------|----------------|----------------|
| Curseur se deplace | Glow/highlight sur le portrait | "tick" court |
| Survol d'un perso | Portrait large + stats s'animent (fill progressif) | Swoosh leger |
| Perso verrouille | Silhouette sombre + cadenas + "???" | Son sourd/bloque |
| Selection confirmee | Flash blanc + portrait zoome | "Clang" metallique |
| Deselection | Retour smooth a la grille | "Whoosh" inverse |

### 2.3 Stats — Presentation en barres

```
Precision  ████████░░  8/10
Puissance  █████░░░░░  5/10
Effet      █████░░░░░  5/10
Sang-froid ████████░░  8/10
```

- **Fill animation** : 0 → valeur en 400ms avec easing `Quad.easeOut`
- **Couleurs par stat** : Precision=#4CAF50, Puissance=#F44336, Effet=#9C27B0, Sang-froid=#2196F3
- **Comparaison J1 vs J2** (versus local) : barres superposees, 2 couleurs

### 2.4 Perso secret (boss)

- Portrait = silhouette noire avec "???" en blanc
- Au survol : texte "Terminer l'Arcade pour debloquer"
- Animation subtile : la silhouette pulse lentement (opacity 0.3 → 0.6)
- Une fois debloque : reveal avec flash dore + SFX epique

---

## 3. ECRAN VS INTRO

### 3.1 Composition (Tekken 7 / Guilty Gear)

```
┌──────────────────────────────────────────────────┐
│          ╱                                        │
│   P1    ╱    P2                                   │
│  POSE  ╱   POSE                                  │
│        ╱                                          │
│ ──────╱──────                                     │
│ "NOM" ╱ "NOM"                                     │
│ catch ╱ catchphrase                               │
│       VS                                          │
│    [TERRAIN]                                      │
└──────────────────────────────────────────────────┘
```

### 3.2 Timeline d'animation (2.5s total)

| Temps | Evenement | Tween |
|-------|----------|-------|
| 0.0s | Background terrain fade in | Alpha 0→1, 300ms |
| 0.2s | Portrait P1 slide depuis gauche | X -300→pos, Back.easeOut 500ms |
| 0.4s | Portrait P2 slide depuis droite | X +300→pos, Back.easeOut 500ms |
| 0.8s | Noms apparaissent | Alpha 0→1, 200ms |
| 1.0s | "VS" slam au centre | Scale 3→1, Bounce 400ms |
| 1.0s | Screen shake 3px, 200ms | camera.shake(0.003, 200) |
| 1.0s | Flash blanc 100ms | camera.flash(0xFFFFFF, 100) |
| 1.4s | Catchphrases typewriter | 30ms/lettre |
| 2.2s | "MATCH!" text | Scale 0→1.2→1, Elastic 400ms |
| 2.5s | Transition vers PetanqueScene | Fade out 300ms |

### 3.3 Elements visuels

- **Split diagonal** : ligne diagonale a 15° separant les deux cotes
- **Fond** : apercu flou du terrain (blur 4px via shader ou pre-render)
- **Eclairage** : P1 = lumiere chaude gauche, P2 = lumiere froide droite
- **Particules** : etincelles le long de la diagonale

---

## 4. HUD EN MATCH (PetanqueScene)

### 4.1 Principe : minimalisme informatif

Le HUD en match doit etre **discret mais toujours lisible**. Le joueur a besoin de :
1. Le score (mene en cours + score total)
2. A qui le tour
3. Combien de boules restantes pour chaque joueur
4. La distance au cochonnet (optionnel, apres le lancer)

### 4.2 Layout HUD

```
┌──────────────────────────────────────────────────┐
│ [P1: 6]  Mene 3/5  [P2: 8]                      │
│ ●●○      TOUR: P1   ●○○                         │
│                                                   │
│                                                   │
│              [TERRAIN DE JEU]                     │
│                                                   │
│                                                   │
│         [Mode: Pointer ▼]  [Focus: 3/5]          │
│              [Puissance ▓▓▓▓▓░░░░░]              │
└──────────────────────────────────────────────────┘
```

### 4.3 Indicateurs de boules restantes

- **Boules pleines** (●) = non jouees
- **Boules vides** (○) = deja lancees
- **Disposition** : horizontale, sous le score du joueur
- **Animation** : quand une boule est jouee, l'icone passe de ● a ○ avec un fade 200ms
- **Couleur** : couleur de la boule selectionnee par le joueur

### 4.4 Indicateur de tour

- **Texte "TOUR: [Nom]"** au centre-haut
- Quand le tour change : **slide out** ancien nom, **slide in** nouveau nom (300ms)
- Background semi-transparent derriere le nom (rgba noir 0.4, rounded 8px)
- Flash subtil de la couleur du joueur

### 4.5 Jauge de puissance

- Position : bas-centre, visible seulement pendant le drag
- Style : barre horizontale avec gradient vert→jaune→rouge
- Taille : 200px large, 16px haut
- Labels : "Doux" a gauche, "PLEIN" a droite
- Animation : fill en temps reel pendant le drag

### 4.6 Score dramatique

| Evenement | Feedback UI |
|-----------|-------------|
| Point marque | Score bounce (scale 1→1.3→1, 300ms) + chiffre qui monte en +1 |
| Carreau | Flash dore + "CARREAU!" texte central 1.5s + screen shake |
| Fin de mene | Recap popup central (2s) avec points marques cette mene |
| Match point (12 pts) | Score clignote rouge/blanc, texte "MATCH POINT!" |
| Victoire | Transition vers ResultScene avec confettis |

---

## 5. ECRAN DE RESULTATS

### 5.1 Layout (Guilty Gear / Tekken end-of-round)

```
┌──────────────────────────────────────────────────┐
│                  VICTOIRE !                       │
│          [Portrait gagnant - animation]           │
│                                                   │
│   Score final : 13 - 8                           │
│                                                   │
│   ★ Meilleur tir : 4cm du cochonnet             │
│   ★ Carreaux : 2                                 │
│   ★ Distance moyenne : 12cm                      │
│   ★ Menes jouees : 4                             │
│                                                   │
│   [+50 Ecus]  [+2 XP Rookie]                    │
│                                                   │
│   [CONTINUER]        [REJOUER]                   │
└──────────────────────────────────────────────────┘
```

### 5.2 Statistiques de match (inspirees des jeux de sport)

| Stat | Description | Condition d'affichage |
|------|------------|----------------------|
| Meilleur tir | Distance min au cochonnet | Toujours |
| Carreaux realises | Nombre de carreaux | Si > 0 |
| Distance moyenne | Moyenne de toutes les boules | Toujours |
| Menes jouees | Nombre de menes | Toujours |
| Taux de precision | % de boules finissant < 50cm | Phase 2 |
| Plus long point | Mene avec le plus de points | Phase 2 |

### 5.3 Animations de resultat

- **Victoire** : portrait gagnant bounce + confettis + "VICTOIRE!" en gold
- **Defaite** : portrait perdant en gris/flou + "DEFAITE" en rouge sombre
- **Stats** : apparaissent une par une avec un "pop" (stagger 200ms)
- **Ecus** : compteur anime 0 → montant (400ms)
- **XP** : barre de progression qui se remplit

---

## 6. MENU PRINCIPAL (TitleScene)

### 6.1 Structure

```
┌──────────────────────────────────────────────────┐
│                                                   │
│           PETANQUE MASTER                         │
│         (logo pixel art + ombre)                  │
│                                                   │
│           ► ARCADE                                │
│             QUICK PLAY                            │
│             BOUTIQUE                              │
│             OPTIONS                               │
│                                                   │
│   [v1.0]                    [Ecus: 350 🪙]       │
└──────────────────────────────────────────────────┘
```

### 6.2 Patterns d'interaction menu

| Pattern | Implementation |
|---------|---------------|
| Curseur fleche anime | Fleche "►" qui pulse (scale 1↔1.1, 600ms loop) |
| Survol = highlight | Texte selectionne en jaune #FFD700, autres en blanc |
| Selection = feedback | Flash + son "confirm", transition 300ms |
| Navigation clavier | Fleches haut/bas, Enter pour confirmer |
| Navigation souris | Hover = survol, Click = selection |
| Navigation tactile | Tap = selection directe |

### 6.3 Fond anime

- **Background** : illustration pixel art d'un terrain au coucher de soleil
- **Parallax** : 2-3 couches (ciel / arbres / terrain) defilant lentement
- **Particules** : lucioles/cigales flottantes (8-12 particules, mouvement sinusoidal)
- **Lumiere** : teinte chaude doree, ombre longues vers la droite

---

## 7. TRANSITIONS ENTRE SCENES

### 7.1 Types de transitions

| Transition | De → Vers | Effet |
|-----------|----------|-------|
| Menu → Select | TitleScene → CharSelectScene | Wipe horizontal (800ms) |
| Select → VS | CharSelectScene → VSIntroScene | Flash blanc (200ms) |
| VS → Match | VSIntroScene → PetanqueScene | Fade noir (400ms) |
| Match → Result | PetanqueScene → ResultScene | Slow zoom + fade (600ms) |
| Result → LevelUp | ResultScene → LevelUpScene | Slide up (400ms) |
| Result → Menu | ResultScene → TitleScene | Fade noir (500ms) |
| Menu → Boutique | TitleScene → ShopScene | Slide droite (400ms) |

### 7.2 Implementation Phaser 3

```javascript
// Wipe horizontal
this.cameras.main.setMask(/* wipe mask */);

// Fade standard
this.cameras.main.fadeOut(400, 0, 0, 0);
this.cameras.main.once('camerafadeoutcomplete', () => {
    this.scene.start('NextScene');
});

// Flash
this.cameras.main.flash(200, 255, 255, 255);
```

### 7.3 Regles de transition

- **Jamais de cut sec** (sauf erreur/debug)
- **Toujours un feedback sonore** sur chaque transition
- **Duree totale** entre 2 scenes interactives : < 3 secondes
- **Loading** : si > 500ms de chargement, afficher un spinner pixel art

---

## 8. TYPOGRAPHIE ET LISIBILITE

### 8.1 Hierarchie typographique

| Niveau | Usage | Police | Taille | Couleur |
|--------|-------|--------|--------|---------|
| H1 | Titres ecrans | Press Start 2P | 24px | #FFD700 (or) |
| H2 | Sous-titres | Press Start 2P | 16px | #F5E6CC (creme) |
| Body | Texte courant | Press Start 2P | 12px | #FFFFFF |
| Small | Info secondaire | Press Start 2P | 10px | #AAAAAA |
| Score | Chiffres grands | Press Start 2P | 32px | #FFFFFF |
| Accent | Catchphrases | Press Start 2P italic | 10px | #CC7722 (ocre) |

### 8.2 Regles de lisibilite pixel art

- **Fond sombre derriere le texte** : toujours un background semi-transparent ou un outline
- **Outline du texte** : stroke 2px en #1A1510 (pas de noir pur)
- **Contraste minimum** : ratio 4.5:1 (WCAG AA)
- **Pas de texte < 10px** : illisible en pixel art
- **Pas de texte sur fond charge** : ajouter un panneau opaque derriere

### 8.3 Bitmap fonts vs Web fonts

| Approche | Avantage | Inconvenient |
|----------|----------|-------------|
| Press Start 2P (web font) | Facile, Google Fonts | Rendu flou a certaines tailles |
| Bitmap font custom | Pixel-perfect, rapide | Effort de creation |
| Phaser BitmapText | Meilleure perf que Text | Necessite atlas font |

**Recommandation** : Press Start 2P pour le MVP, migration vers BitmapText custom en Phase 2 pour les performances.

---

## 9. PALETTE UI COHERENTE

### 9.1 Tokens de couleur UI

| Token | Hex | Usage |
|-------|-----|-------|
| `ui-bg-primary` | `#1A1510` | Fond des panneaux principaux |
| `ui-bg-secondary` | `#2A231C` | Fond des sous-panneaux |
| `ui-bg-overlay` | `rgba(26,21,16,0.85)` | Overlay semi-transparent |
| `ui-text-primary` | `#F5E6CC` | Texte principal (creme chaud) |
| `ui-text-highlight` | `#FFD700` | Texte important (or) |
| `ui-text-disabled` | `#666666` | Texte inactif |
| `ui-border` | `#CC7722` | Bordures actives (ocre) |
| `ui-border-accent` | `#FFD700` | Bordures dorees (boutons principaux) |
| `ui-success` | `#4CAF50` | Confirmation, victoire |
| `ui-danger` | `#E2725B` | Erreur, defaite (terracotta) |
| `ui-info` | `#87CEEB` | Information (bleu ciel) |

### 9.2 Boutons

```
┌─────────────────┐
│   CONFIRMER     │  ← bordure doree 2px, fond #2A231C
└─────────────────┘     hover : fond #3A332C, scale 1.05
                        press : fond #1A1510, scale 0.95
                        disabled : bordure #666, texte #666
```

---

## 10. RESPONSIVE ET MULTI-RESOLUTION

### 10.1 Resolution de base : 832x480

- **Scale mode** : `Phaser.Scale.FIT` (garde le ratio)
- **Entier** : privilegier le scale x2 (1664x960) ou x3 (2496x1440)
- **Pixel perfect** : `roundPixels: true` dans la config Phaser
- **Anti-alias OFF** : `pixelArt: true` dans la config

### 10.2 Safe zone UI

- **Marges** : 16px de chaque cote (1 tile de marge)
- **Zone safe** : 800x448 pour le contenu interactif
- **Ancrage** : elements UI ancres aux coins (top-left score P1, top-right score P2)

### 10.3 Adaptation mobile

- **Boutons** : minimum 44x44px de zone tactile (WCAG)
- **Texte** : minimum 12px (lisible sur mobile)
- **Espacement** : minimum 8px entre elements cliquables
- voir `research/37_mobile_touch_ux.md` pour le detail

---

## 11. ANIMATIONS UI — LE "JUICE"

### 11.1 Principes

- **Toute action a un feedback** (visuel + audio)
- **Easing naturel** : jamais de mouvement lineaire sur les elements UI
- **Overshoot** : les elements arrivent avec un leger rebond (Back.easeOut)
- **Stagger** : les listes apparaissent element par element (100-200ms d'ecart)

### 11.2 Catalogue de tweens UI

| Animation | Easing | Duree | Usage |
|-----------|--------|-------|-------|
| Apparition | Back.easeOut | 400ms | Panneaux, portraits |
| Disparition | Quad.easeIn | 200ms | Fermeture de panneau |
| Highlight | Sine.easeInOut (loop) | 800ms | Curseur de selection |
| Bounce score | Bounce.easeOut | 300ms | Score qui change |
| Slide menu | Cubic.easeOut | 300ms | Items de menu |
| Shake erreur | Custom (sin decay) | 200ms | Action invalide |
| Scale bouton | Quad.easeOut | 150ms | Hover bouton |
| Fill barre | Quad.easeOut | 400ms | Barres de stats |

### 11.3 Regles de timing

- **< 100ms** : feedback instantane (bouton press)
- **100-300ms** : transition micro (hover, selection)
- **300-600ms** : transition macro (changement de panneau)
- **600-1500ms** : transition cinematique (VS screen)
- **> 1500ms** : sequence scripte (intro, resultat)

---

## 12. REFERENCES ET BENCHMARKS

### 12.1 Jeux a etudier

| Jeu | Plateforme | Ce qu'on en retient |
|-----|-----------|-------------------|
| **Street Fighter 6** | Multi | Menu principal moderne, World Tour progression |
| **Guilty Gear Strive** | Multi | UI maximaliste, feedback enorme, typographie bold |
| **Rivals of Aether** | PC | Indie pixel art fighting game, UI clean |
| **Windjammers 2** | Multi | Sport arcade, HUD minimaliste, score dramatique |
| **Pocket Bravery** | PC | Indie pixel art fighter, excellent character select |
| **Fire Emblem GBA** | GBA | Pixel gameplay + portraits detailles |
| **Stardew Valley** | Multi | Menus pixel art propres, boutique reference |
| **Celeste** | Multi | Menu minimaliste, options accessibilite exemplaires |

### 12.2 Anti-patterns a eviter

| Anti-pattern | Pourquoi | Alternative |
|-------------|----------|-------------|
| Menu avec trop d'options | Paralyse le choix | Max 4-5 items visibles |
| Texte sans fond | Illisible sur terrain charge | Toujours un panneau derriere |
| Transition trop longue | Frustrant apres 5 matchs | Skip avec un tap apres 1er visionnage |
| HUD qui couvre le jeu | Cache l'action | Elements ancres aux bords, petits |
| Police trop petite | Illisible mobile | Min 10px, tester sur telephone |
| Animations non skippables | Exasperant en rejeu | Tap/click pour skip apres 1er visionnage |
