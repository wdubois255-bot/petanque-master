# GAME DESIGN - Petanque Master

## Concept

**Petanque Master** : jeu de petanque competitif en 1v1, style jeu de combat (Street Fighter / Tekken).
Chaque joueur choisit un personnage avec des stats uniques, un jeu de boules, et s'affronte sur des terrains varies.

**Pilliers du jeu :**
1. Un gameplay petanque solide et satisfaisant (FAIT)
2. Des personnages charismatiques avec des stats qui impactent le jeu
3. Des terrains avec des proprietes physiques uniques
4. Un mode arcade solo + versus local + versus en ligne

---

## Modes de jeu

### Mode Arcade (solo)
- 5 combats enchaines contre l'IA, difficulte croissante
- Terrain et adversaire imposes a chaque etape
- Deblocage du **boss secret** en finissant l'arcade
- Pas de game over : on peut retenter un match perdu
- Ecran de resultats entre chaque match (score, stats du match)

### Mode Versus (local)
- 1v1 meme ecran, chacun son tour
- Choix libre : perso, boules, terrain
- Formats : tete-a-tete (3 boules), doublette (2v2), triplette (3v3)

### Mode Versus En Ligne
- **Tour par tour asynchrone** (comme un jeu d'echecs en ligne)
- Systeme de "room code" : tu partages un code a ton pote
- Chaque joueur joue son coup, l'autre recoit le resultat et joue le sien
- Tech : Firebase Realtime Database ou API REST simple
- Phase 2 du developpement

### Quick Play
- Partie rapide avec configuration libre (existe deja)
- Choix boules, terrain, difficulte, adversaire, format

---

## Personnages (Roster v1 - 5 + 1 secret)

### Systeme de stats

Chaque personnage a **4 stats** (echelle 1-10) :

| Stat | Effet en jeu |
|------|-------------|
| **Precision** | Taille de la zone de dispersion au lacher. 10 = quasi-parfait, 1 = tres aleatoire |
| **Puissance** | Force max du tir. Determine la portee et la capacite a deplacer d'autres boules |
| **Effet** | Capacite a mettre du spin/courbe. Plus c'est haut, plus la courbe est controllable |
| **Sang-froid** | La visee tremble moins sous pression. Quand le score est serre (10+), la visee devient instable. Le sang-froid reduit cet effet |

**Mecanique de pression :** A partir de 10-10, la visee de tous les joueurs commence a trembler legerement. L'amplitude du tremblement depend du sang-froid du personnage. Ca cree une tension naturelle en fin de partie.

**Total de stats :** Chaque perso a un total de ~24-26 points repartis differemment (pas d'equilibrage parfait, c'est voulu — certains persos sont plus durs a jouer mais plus rewarding).

### Les 5 personnages + boss

| # | Nom | Archetype | PRE | PUI | EFF | S-F | Style |
|---|-----|-----------|-----|-----|-----|-----|-------|
| 1 | TBD | **Le Pointeur** | 9 | 4 | 6 | 7 | Veteran calme, chirurgical. Gagne en placement. |
| 2 | TBD | **Le Tireur** | 5 | 9 | 4 | 6 | Brute sympathique. Tire et casse tout. |
| 3 | TBD | **L'Equilibre** | 6 | 6 | 6 | 6 | Rookie, joueur du dimanche. Facile a prendre en main. |
| 4 | TBD | **Le Stratege** | 6 | 5 | 9 | 6 | Intellectuel, calcule tout. Maitre des courbes et effets. |
| 5 | TBD | **Le Wild Card** | 7 | 8 | 7 | 3 | Flambeur, tout ou rien. Tres fort mais craque sous pression. |
| 6 | TBD | **Le Boss Secret** | 8 | 7 | 8 | 9 | Debloquable en finissant l'arcade. Le maitre absolu. |

**Noms et personnalites** : a developper un par un, bases sur la realite, style provencal/sud de la France.

**Visuels** (voir section "Direction Artistique" pour le detail complet) :
- Sprite in-game 32x32 pixel art (4 directions, idle + throw + celebrate + lose)
- Portrait thumbnail 64x64 (grille de selection)
- Portrait featured 256x256+ (panneau preview quand selectionne)
- Pose VS dramatique (ecran VS split)
- Animation de victoire et de defaite (3-4 frames)
- Intro avant le match (pose + catchphrase)
- Pipeline : PixelLab (draft) → Aseprite (polish) → Free Texture Packer (atlas)

### Stats des boules (Phase 2)

En plus des stats du perso, les boules auront leurs propres stats qui se combinent :
- **Poids** : affecte la portee et l'inertie
- **Durete** : affecte les rebonds (restitution)
- **Grip** : affecte l'adherence au terrain (friction)
- **Diametre** : affecte la precision (plus gros = plus facile a placer, mais plus facile a toucher)

---

## Terrains (5 stages)

Chaque terrain a un **look unique** et des **proprietes physiques** qui changent le gameplay.

### Stage 1 : Place du Village
- **Visuel** : Place provencale classique, platanes, fontaine, bancs en fer forge
- **Sol** : Terre battue uniforme
- **Friction** : 1.0 (standard)
- **Particularite** : Aucune. Le terrain d'apprentissage, pur skill.
- **Ambiance** : Cigales, cloches au loin

### Stage 2 : Plage de la Ciotat
- **Visuel** : Bord de mer, sable, parasols, bateaux au loin
- **Sol** : Sable
- **Friction** : 3.0 (les boules s'arretent vite)
- **Particularite** : Oblige a tirer fort. Avantage aux Tireurs.
- **Ambiance** : Vagues, mouettes

### Stage 3 : Parc Municipal
- **Visuel** : Pelouse, bancs, canards, aire de jeux au fond
- **Sol** : Mixte — herbe (friction 1.8) + allees de gravier (friction 1.2)
- **Particularite** : **Zones mixtes.** Les allees de gravier traversent le terrain. Savoir les utiliser = avantage strategique.
- **Ambiance** : Oiseaux, enfants au loin

### Stage 4 : Colline aux Oliviers
- **Visuel** : Colline provencale, oliviers, murets en pierre seche, vue panoramique
- **Sol** : Terre battue
- **Friction** : 1.0
- **Particularite** : **Pente !** Le terrain a un devers. Les boules roulent vers le bas. Il faut compenser en visant plus haut. Game-changer total.
- **Ambiance** : Vent dans les oliviers, grillons

### Stage 5 : Les Docks
- **Visuel** : Port industriel, beton, containers, grues, eclairage artificiel
- **Sol** : Dalles beton
- **Friction** : 0.7 (tres glissant)
- **Particularite** : **Rebonds sur les murs.** Des bordures metalliques delimitent le terrain. Les boules rebondissent dessus. Ca glisse, ca rebondit, c'est le chaos.
- **Ambiance** : Ambiance nocturne, lampadaires, sons industriels au loin

---

## Flow du jeu

```
TITRE
  |
  v
MENU PRINCIPAL
  |--- Arcade ---------> Select Perso -> Match 1/5 -> Resultat -> ... -> Match 5/5 -> Fin + Deblocage boss
  |--- Versus Local ---> Select Perso (J1) -> Select Perso (J2) -> Select Boules -> Select Terrain -> Match -> Resultat
  |--- Versus En Ligne -> Room Code -> Select Perso -> Select Boules -> Select Terrain -> Match async -> Resultat
  |--- Quick Play -----> Config rapide -> Match -> Resultat
  |--- Collection -----> Persos / Boules / Terrains debloques (Phase 2)
```

### Ecran de selection de personnage
- Grille de portraits (2x3 pour 5+1 persos)
- Curseur anime
- Preview du perso a droite avec stats en barres
- Musique energique pendant la selection
- Perso secret = silhouette "???" tant que non debloque

### Intro match
- Ecran split "VS" avec les deux portraits face a face
- Noms + catchphrases
- Animation dynamique (~2s)

### Ecran de resultat
- Score final
- Stats du match (meilleur tir, nombre de carreaux, distance moyenne)
- Animation victoire du gagnant / defaite du perdant

---

## Ordre Arcade (progression)

| Match | Adversaire | Terrain | Difficulte IA |
|-------|-----------|---------|---------------|
| 1 | L'Equilibre | Place du Village | Facile |
| 2 | Le Pointeur | Plage | Facile+ |
| 3 | Le Tireur | Parc Municipal | Moyen |
| 4 | Le Stratege | Colline aux Oliviers | Moyen+ |
| 5 | Le Wild Card | Les Docks | Difficile |
| BOSS | Le Boss Secret | ??? (terrain special) | Expert |

---

## Priorites de developpement

### Phase 1 — Core (actuel)
1. Ecran de selection de personnage
2. Systeme de stats (precision, puissance, effet, sang-froid)
3. 5 terrains avec proprietes physiques (pentes, zones mixtes, rebonds murs)
4. Mode Arcade complet (5 matchs + boss)
5. Ecran VS + intro match + ecran resultat
6. 5 personnages avec sprites + portraits (PixelLab)

### Phase 2 — Enrichissement
7. Stats des boules (poids, durete, grip, diametre)
8. Mode Versus local (2 joueurs meme ecran)
9. Collection / deblocages
10. Formats 2v2 (doublette) et 3v3 (triplette)

### Phase 3 — Online
11. Versus en ligne tour par tour asynchrone
12. Systeme de room code
13. Classement / stats en ligne

---

## Direction Artistique

### Philosophie : Modele "Fire Emblem GBA"

Pixel art pour le gameplay + portraits haute-resolution pour la presentation fighting game.
Le contraste est intentionnel et coherent : le joueur joue en pixel, mais les moments cles (selection perso, VS screen, resultats) sont visuellement impactants.

### Specifications par contexte

| Contexte | Style | Resolution | Notes |
|----------|-------|-----------|-------|
| Sprites in-game | Pixel art | 32x32 | 4 directions, idle + throw + celebrate + lose |
| Portraits thumbnail (grille select) | Pixel art detaille | 64x64 a 96x96 | Doit etre lisible dans la grille 2x3 |
| Portrait featured (perso selectionne) | Pixel art haute-res ou illustration HD | 256x256 a 512x512 | Affiche quand le curseur est sur le perso |
| Ecran VS splash | Illustration dramatique | Grande taille | Poses dynamiques, split diagonal |
| UI (score, menus, boutons) | Pixel art clean | 1x-2x tile size | Coherent avec le gameplay |
| Terrains | Pixel art / tilesets | 32x32 tiles | Generes via PixelLab + retouche Aseprite |

### Pipeline de production par personnage

1. **Concept art** : PixelLab/Midjourney → explorer 10-20 directions visuelles
2. **Design fige** : choisir silhouette, couleurs dominantes (2-3), detail memorable
3. **Sprite 32x32** : PixelLab draft → Aseprite polish → 4 directions + idle
4. **Portrait select** : pixel art 128x128 dans Aseprite (option principale)
5. **Pose VS screen** : version dramatique du portrait, plus grande, pose de combat/defi
6. **Animations** : victoire (3-4 frames), defaite (3-4 frames), lancer de boule

### Character Design — Regles

Chaque personnage doit avoir :
- **Silhouette unique** : reconnaissable meme en ombre (theorie Dan Fornace / Rivals of Aether)
- **2-3 couleurs dominantes** : pas de chevauchement entre les persos du roster
- **Un detail memorable** : chapeau, echarpe, lunettes, pipe, canne, tatouage, etc.
- **Idle pose = personnalite** : un veteran se tient droit bras croises, un nerveux gigote
- **Pose de lancer distincte** : c'est LE geste du jeu, chaque perso le fait differemment

### Palette Provencale (identite visuelle)

| Couleur | Hex | Usage |
|---------|-----|-------|
| Ocre | `#CC7722` | Murs pierre, terre battue |
| Terracotta | `#E2725B` | Toits, poterie, accents chauds |
| Lavande | `#9B72AA` | Accent, fleurs, contraste froid |
| Olive | `#6B7F3B` | Vegetation, volets |
| Bleu ciel | `#87CEEB` | Ciel, eau |
| Creme chaud | `#F5E6CC` | Facades, highlights |
| Tournesol | `#FFDA03` | Accent vif, energie |
| Bleu mediterraneen | `#1E90FF` | Volets, mer, accent bold |
| Ombre chaude | `#3A2E28` | Ombres (JAMAIS de noir pur #000) |

### Outils de production

| Outil | Usage |
|-------|-------|
| **PixelLab** (MCP configure) | Drafts sprites, rotation directionnelle, iterations rapides |
| **Aseprite** | Retouche, animation frame-by-frame, polish final |
| **Scenario AI** | Portraits HD consistants (entrainer un modele sur le style du jeu) |
| **Free Texture Packer** | Packing texture atlases (gratuit, export Phaser 3 JSON) |
| **Midjourney** | Concept art, mood boards (PAS pour sprites) |

**Regle d'or** : l'IA est un accelerateur interne. Toujours retoucher manuellement les assets finaux. Ne jamais communiquer sur l'usage IA.

### Ecran VS — Techniques d'impact

- Split diagonal avec les deux portraits face a face
- Portraits qui slide in depuis les cotes (tween Back.easeOut)
- "VS" qui slam au centre (scale 3→1, Bounce) + screen shake + flash blanc
- Noms en typo bold + catchphrases
- SFX dramatique (clash metallique)
- Duree totale : 2-3 secondes

### Jeux de reference

| Jeu | Ce qu'on en retient |
|-----|-------------------|
| **Fire Emblem GBA** | Pixel gameplay + portraits detailles = gold standard |
| **Rivals of Aether** | Pixel art fighting game, 1 artiste, silhouettes fortes |
| **Street Fighter 2** | Character select iconique, VS screen mythique |
| **Windjammers** | Sport + format fighting game (6 persos, arcade mode) |
| **Pocket Bravery** | Indie fighting game pixel art magnifique |
| **Octopath Traveler** | HD-2D (pixel + effets modernes) |
| **Journey / Firewatch** | Palettes chaudes de reference |

### Organisation des assets

```
/assets
  /sprites/[perso]/        # 1 atlas par personnage (idle, throw, celebrate, lose)
  /portraits/[perso]/      # Images individuelles (pas en atlas)
    thumbnail_64.png       # Pour la grille de selection
    featured_256.png       # Pour le panneau de preview
    vs_pose.png            # Pour l'ecran VS
  /tilesets/               # 1 atlas par terrain
  /ui/                     # 1 atlas UI partage (boutons, frames, icones)
```

---

## Ce qui est conserve du projet actuel
- **Moteur de petanque** : physique custom, IA 3 niveaux, systeme de visee — TOUT est garde
- **QuickPlayScene** : mode partie rapide — garde tel quel
- **Assets visuels** : sprites Pipoya, tilesets, SFX — reutilises
- **Style provencal** : ambiance, palette, humour — c'est l'ADN du jeu
- **STORY.md** : l'histoire "L'Heritier de la Ciotat" reste en reserve pour un futur mode aventure

## Ce qui change
- **Plus de monde ouvert** (OverworldScene) comme priorite — c'est reporte
- **Focus sur le format versus** : selection perso, matchs, arcade
- **Personnages = gameplay** : chaque perso a des stats qui impactent reellement le jeu
- **Terrains = stages** : chaque terrain est un challenge different
