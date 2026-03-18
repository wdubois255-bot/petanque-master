# 36 — Onboarding & Tutorial Design

> A lire quand : on travaille sur l'experience premiere partie, le tutoriel, ou l'accessibilite aux nouveaux joueurs.

---

## 1. PROBLEMATIQUE

La petanque est un sport simple mais ses subtilites sont nombreuses. Le joueur doit comprendre :
1. Comment **viser** (drag-and-release)
2. Comment **doser la puissance** (longueur du drag)
3. Les **modes de tir** (pointer, tirer, loft)
4. Le **scoring** (qui est le plus pres = point)
5. Les **stats du personnage** (precision, puissance, effet, sang-froid)
6. Les **terrains** (friction, pentes, zones)

**Erreur classique des jeux de sport indie** : expliquer tout dans un mur de texte au lancement. Le joueur ne lit pas et quitte.

---

## 2. PHILOSOPHIE : "LEARN BY DOING"

### Principes (inspires de Mega Man, Mario, Celeste)

| Principe | Application |
|----------|------------|
| **Montrer, ne pas dire** | Le joueur apprend en jouant, pas en lisant |
| **Un concept a la fois** | Chaque etape enseigne UNE mechanique |
| **Feedback immediat** | L'erreur est visible et la correction intuitive |
| **Pas de punition** | Le tutoriel ne peut pas etre "perdu" |
| **Skipable** | Les joueurs experimentes peuvent passer |
| **Contextuel** | Les conseils apparaissent quand ils sont pertinents |

---

## 3. STRUCTURE DU TUTORIEL — "PREMIERE PARTIE"

### 3.1 Approche : tutoriel integre au premier match Arcade

Au lieu d'un mode "Tutoriel" separe, **le premier match de l'Arcade EST le tutoriel**. C'est invisible pour le joueur : il pense jouer un vrai match, mais le jeu le guide.

### 3.2 Deroulement etape par etape

#### Etape 1 : Le cochonnet (automatique, 0 input joueur)
```
[Le Rookie lance le cochonnet automatiquement]
Popup : "Le cochonnet est lance. C'est la cible !"
[Le cochonnet atterrit, camera zoom dessus 1s]
```
- **Ce qu'on apprend** : le cochonnet est la cible
- **Duree** : 3s

#### Etape 2 : Premier lancer (guide)
```
Popup : "Glissez pour viser, relachez pour lancer"
[Fleche animee montrant le geste de drag]
[Zone de lancer highlight en vert]
[Le joueur drag et lance]
[Camera suit la boule]
Popup : "Bravo ! Distance au cochonnet : Xcm"
```
- **Ce qu'on apprend** : le geste de base (drag-and-release)
- **Aide** : fleche animee, pas de wobble (precision max temporaire)
- **Duree** : 10-20s selon le joueur

#### Etape 3 : Dosage de puissance
```
[Adversaire joue (IA fait expres de jouer moyen)]
Popup : "L'adversaire a joue. A vous ! Glissez plus ou moins loin pour doser la puissance"
[Jauge de puissance apparait avec etiquettes "Doux" / "Moyen" / "Fort"]
[Le joueur lance]
```
- **Ce qu'on apprend** : la longueur du drag = puissance
- **Aide** : jauge visible avec labels
- **Duree** : 15s

#### Etape 4 : Le scoring (fin de mene)
```
[Toutes les boules sont jouees]
Popup : "Fin de la mene ! Vos boules les plus proches comptent"
[Animation : mesure visuelle des distances]
[Score +X pour le gagnant]
Popup : "Premiere a 13 points !"
```
- **Ce qu'on apprend** : comment les points sont comptes
- **Aide** : lignes de distance visibles
- **Duree** : 5s

#### Etape 5 : Match complet (sans aide)
```
[Le reste du match se deroule normalement]
[Aucun popup sauf si le joueur semble bloque (>10s sans action)]
```
- **Ce qu'on apprend** : la boucle complete de jeu
- **Aide** : uniquement si le joueur est inactif 10s+

### 3.3 Flag de tutoriel

```javascript
// Dans SaveManager
{
  tutorialCompleted: false,
  tutorialStep: 0 // 0-4
}
```
- Le tutoriel ne se joue qu'une fois (flag `tutorialCompleted`)
- Si le joueur quitte en plein tutoriel, il reprend a la derniere etape

---

## 4. TOOLTIPS CONTEXTUELS (POST-TUTORIEL)

### 4.1 Systeme de hints

Apres le tutoriel, des tooltips contextuels apparaissent quand le joueur rencontre une nouvelle mechanique pour la premiere fois.

| Declencheur | Tooltip | Flag |
|-------------|---------|------|
| Premier match sur Plage | "Le sable ralentit les boules. Tirez plus fort !" | `hint_sand_shown` |
| Premier match sur Parc | "Attention aux zones ! Herbe = lent, gravier = rapide" | `hint_mixed_shown` |
| Premier match sur Colline | "Terrain en pente ! Compensez en visant plus haut" | `hint_slope_shown` |
| Premier match sur Docks | "Les boules rebondissent sur les murs ici !" | `hint_walls_shown` |
| Premier acces Focus | "Appuyez sur [F] pour activer le Focus : visee stabilisee" | `hint_focus_shown` |
| Premier loft | "Changez le mode de lancer : Roulette / Demi-portee / Plombee / Tir" | `hint_loft_shown` |
| Score 10-10 | "Match serre ! La pression fait trembler la visee..." | `hint_pressure_shown` |
| Premier carreau | "CARREAU ! Votre boule a pris la place exacte de l'adversaire !" | `hint_carreau_shown` |

### 4.2 Presentation visuelle

```
┌─────────────────────────────────────┐
│ 💡 Le sable ralentit les boules.   │
│    Tirez plus fort !                │
│                          [OK] [X]   │
└─────────────────────────────────────┘
```

- **Position** : centre-bas de l'ecran
- **Style** : panneau semi-transparent, texte creme, icone ampoule
- **Duree** : reste jusqu'a ce que le joueur clique OK ou X
- **Timing** : apparait pendant une pause naturelle (debut de mene, avant un lancer)
- **Maximum** : 1 tooltip par match (pas d'avalanche)

---

## 5. ECRAN D'AIDE ACCESSIBLE

### 5.1 Menu "Comment jouer" (accessible depuis Options)

```
┌──────── COMMENT JOUER ──────────────────────┐
│                                              │
│ 🎯 VISER                                    │
│ Glissez votre doigt/souris pour viser.       │
│ Plus vous glissez loin, plus c'est puissant. │
│ [Animation demonstrative loop]               │
│                                              │
│ 🎳 MODES DE TIR                             │
│ ► Roulette : la boule roule au sol           │
│ ► Demi-portee : mi-air mi-sol               │
│ ► Plombee : haut dans les airs, tombe        │
│ ► Tir : direct, pour frapper l'adversaire    │
│ [Animation des trajectoires]                 │
│                                              │
│ 📊 SCORING                                  │
│ La boule la plus proche du cochonnet gagne.  │
│ Chaque boule gagnante = 1 point.             │
│ Premier a 13 points remporte le match !      │
│                                              │
│ 🎮 FOCUS (F)                                │
│ Stabilise votre visee. 5 charges par match.  │
│                                              │
│ [Retour]                                     │
└──────────────────────────────────────────────┘
```

### 5.2 Animations demonstratives

Chaque section de l'aide inclut une **mini-animation loop** (3-5s) montrant le geste ou la mechanique en action. Pas besoin de texte quand l'animation est claire.

---

## 6. DIFFICULTE PROGRESSIVE (COURBE D'APPRENTISSAGE)

### 6.1 Courbe Arcade

| Match | Adversaire | Ce que le joueur apprend | Aide |
|-------|-----------|--------------------------|------|
| 1 | La Choupe (Village) | Bases : viser, doser, scorer | Tutoriel integre |
| 2 | Marcel (Parc) | Zones de friction mixte | Tooltip terrain |
| 3 | Le Magicien (Colline) | Pentes + adversaire intelligent | Aucune aide |

### 6.2 Ajustement dynamique (optionnel, Phase 2)

Si le joueur perd 3 fois de suite le meme match :
1. **1ere defaite** : "Vous pouvez retenter !" (existant)
2. **2eme defaite** : "Conseil : essayez de pointer plutot que tirer"
3. **3eme defaite** : Proposition de baisser la difficulte IA d'un cran

Ce n'est PAS du rubber-banding (l'IA ne triche pas). C'est un **ajustement de difficulte explicite** propose au joueur.

---

## 7. ONBOARDING PREMIERE OUVERTURE

### 7.1 Flow premiere session

```
1. Ecran titre (3s minimum pour absorber l'ambiance)
2. "Bienvenue dans Petanque Master !"
3. Menu : [Arcade] est highlight/pulse, les autres sont secondaires
4. → Arcade → Le Rookie est auto-selectionne (seul perso dispo)
5. → Premier match = tutoriel integre (voir section 3)
6. → Apres victoire : LevelUp + Ecus gagnes
7. → Retour menu : Quick Play est maintenant highlight aussi
```

### 7.2 Ce qu'on NE fait PAS

| Anti-pattern | Pourquoi c'est mauvais | Notre approche |
|-------------|----------------------|----------------|
| Mur de texte | Le joueur ne lit pas | Apprendre en jouant |
| Tutoriel obligatoire long | Frustrant pour les habitues | Integre au 1er match, court |
| Expliquer les stats d'entree | Surcharge cognitive | Les stats sont visibles mais pas expliquees |
| Forcer a lire les regles | Trop scolaire | Les regles se comprennent en jouant |
| Pop-up a chaque action | Exasperant | 1 tooltip par match max |

---

## 8. INDICATEURS VISUELS PERMANENTS

### 8.1 Guides visuels in-game (toujours presents)

| Indicateur | Ce qu'il montre | Style |
|-----------|----------------|-------|
| Fleche de direction | Ou la boule va partir | Ligne blanche semi-transparente |
| Cercle de lancer | Zone de depart | Cercle blanc pointille |
| Icone joueur actif | A qui le tour | Portrait miniature + glow |
| Boules restantes | ●●○ sous le score | Icones boule pleine/vide |
| Distance au cochonnet | Cm apres le lancer | Texte flottant 2s |

### 8.2 Guides visuels optionnels (desactivables)

| Indicateur | Defaut | Pourquoi optionnel |
|-----------|--------|-------------------|
| Prediction trajectoire | ON | Retire du challenge (voir research/25 C1) |
| Zone d'atterrissage | ON | Aide les debutants |
| Jauge de puissance chiffree | OFF | Pour les joueurs avances |

---

## 9. IMPLEMENTATION TECHNIQUE

### 9.1 Fichiers concernes

| Fichier | Modification |
|---------|-------------|
| `src/scenes/PetanqueScene.js` | Logique tutoriel integre au premier match |
| `src/utils/SaveManager.js` | Flags `tutorialCompleted`, `tutorialStep`, `hints{}` |
| `src/ui/TutorialOverlay.js` | Nouveau : composant popup tutoriel |
| `src/ui/TooltipSystem.js` | Nouveau : systeme de hints contextuels |
| `src/scenes/TitleScene.js` | Highlight "Arcade" au premier lancement |

### 9.2 Estimation effort

| Composant | Effort | Priorite |
|-----------|--------|----------|
| Tutoriel integre (etapes 1-5) | 4-6h | P1 |
| Tooltips contextuels | 2-3h | P1 |
| Ecran "Comment jouer" | 2h | P2 |
| Animations demonstratives | 3-4h | P2 |
| Ajustement dynamique difficulte | 2h | P3 |

---

## 10. METRIQUES DE SUCCES

Comment savoir si l'onboarding fonctionne :

| Metrique | Cible | Comment mesurer |
|----------|-------|----------------|
| Completion 1er match | > 80% des joueurs | Flag `tutorialCompleted` |
| Temps avant 1er lancer | < 30s | Timer dans le tutoriel |
| Nombre de lancers rates (1er match) | Normal = 0-2 | Compteur |
| Retour apres 1er match | > 60% lancent un 2eme match | Analytics (voir research/41) |
| Utilisation du Focus | > 50% l'essaient dans les 3 premiers matchs | Flag `focus_used` |
