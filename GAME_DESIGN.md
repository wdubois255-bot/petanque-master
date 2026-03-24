# GAME DESIGN - Petanque Master

> **ATTENTION** : Ce fichier est la bible de design du jeu.
> Le roster actuel compte 14 personnages : Rookie, La Choupe, Ley, Foyot, Suchaud, Fazzino, Mamie Josette, Papi Rene, Robineau, Rocher, Sofia, Rizzi, Chai (boss secret), La Loutre.
> Pour les stats et donnees reelles : **public/data/characters.json** (source de verite).
> Pour l'etat complet du projet : **CAHIER_DES_CHARGES.md** v2.3.

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

## Personnages (Roster - 12 joueurs)

### Systeme de stats

Chaque personnage a **4 stats** (echelle 1-10) :

| Stat | Effet en jeu |
|------|-------------|
| **Precision** | Taille de la zone de dispersion au lacher. 10 = quasi-parfait, 1 = tres aleatoire |
| **Puissance** | Force max du tir. Determine la portee et la capacite a deplacer d'autres boules |
| **Effet** | Capacite a mettre du spin/courbe. Plus c'est haut, plus la courbe est controllable |
| **Sang-froid** | La visee tremble moins sous pression. Quand le score est serre (10+), la visee devient instable. Le sang-froid reduit cet effet |

**Mecanique de pression :** A partir de 10-10, la visee de tous les joueurs commence a trembler legerement. L'amplitude du tremblement depend du sang-froid du personnage. Ca cree une tension naturelle en fin de partie.

**Total de stats :** Chaque perso a un total de ~24-28 points repartis differemment (pas d'equilibrage parfait, c'est voulu — certains persos sont plus durs a jouer mais plus rewarding).

### Le Roster (12 personnages)

> **Source de verite stats** : `public/data/characters.json`. Le tableau ci-dessous donne l'archetype et le style — pour les chiffres exacts, toujours consulter le JSON.

| # | ID | Nom | Archetype | Style |
|---|-----|-----------|-----|-------|
| 1 | rookie | **Le Rookie** | Adaptable | Debutant qui evolue. Stats basses mais progressent avec chaque victoire. |
| 2 | la_choupe | **La Choupe** | Tireur | Canon du boulodrome. Puissance devastatrice, pas de finesse. |
| 3 | ley | **Ley** | Tireur legendaire | Le boss final de l'Arcade. Carreaux devastateurs, calme absolu. |
| 4 | foyot | **Foyot** | Pointeur | Veteran calme et chirurgical. Gagne en placement. |
| 5 | suchaud | **Suchaud** | Tireur elite | 14 fois champion. Tirs chirurgicaux, sang-froid d'acier. |
| 6 | fazzino | **Fazzino** | Stratege | Joueur du siecle. Maitre des courbes et des effets. |
| 7 | mamie_josette | **Mamie Josette** | Pointeuse | 72 ans, calme olympien. Precision mortelle, ne vous fiez pas aux apparences. |
| 8 | papi_rene | **Papi Rene** | Milieu de terrain | Le doyen du boulodrome. Sage et regulier. |
| 9 | robineau | **Robineau** | Equilibre | Solide et fiable, bon en tout sans exces. |
| 10 | rocher | **Rocher** | Puissance brute | Force physique impressionnante, controle limite. |
| 11 | sofia | **Sofia** | Technique | Technique et creative, maitrise des effets. |
| 12 | rizzi | **Rizzi** | Wild Card | Flambeur, tout ou rien. Tres fort mais craque sous pression. |
| 13 | chai | **Chai** | Boss secret | Maitre thaïlandais venu de Bangkok. Precision et sang-froid absolus. Debloque apres l'Arcade. |
| 14 | la_loutre | **La Loutre** | Glisseur | Fluide et technique, roi des courbes. Ses boules s'insinuent partout. |

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
- Grille de portraits (roster de 12 personnages)
- Curseur anime
- Preview du perso a droite avec stats en barres
- Musique energique pendant la selection
- Persos non debloques = silhouette "???"

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

Le joueur incarne le Rookie et affronte 5 adversaires dans l'ordre suivant :

| Match | Adversaire | Terrain | Difficulte IA |
|-------|-----------|---------|---------------|
| 1 | La Choupe | Place du Village | Facile |
| 2 | Mamie Josette | Parc Municipal | Moyen |
| 3 | Fazzino | Colline aux Oliviers | Difficile |
| 4 | Suchaud | Les Docks | Tres difficile |
| 5 | Ley | Plage de la Ciotat | Expert |

> Source de verite : `public/data/arcade.json`

---

## Rookie Progression

Le Rookie est le personnage principal du mode Arcade. Contrairement aux autres personnages, ses stats evoluent avec les points accumules en jeu. A certains seuils, il debloque des capacites uniques :

| Seuil (pts) | Capacite | Type | Effet |
|-------------|----------|------|-------|
| 18 | **L'Instinct** | Active (1 charge) | Slow-mo 2s pendant la visee |
| 24 | **Determination** | Passive | Apres une mene perdue, -80% wobble au tir suivant |
| 32 | **Le Naturel** | Active (1 charge) | Lancer quasi-parfait, wobble proche de 0 |

> Source de verite : `public/data/characters.json` (champ `abilities_unlock` du Rookie)

---

## Monnaie : Galets

La monnaie du jeu s'appelle les **Galets** (PAS "Ecus", PAS "Coins").

| Source | Montant |
|--------|---------|
| Depart (nouveau joueur) | 100 Galets |
| Victoire Arcade (par match) | 100 Galets |
| Victoire QuickPlay | 40 Galets |
| Bonus carreau | 15 Galets |
| Defaite (consolation) | 15 Galets |
| Arcade complete (5 victoires) | 150 Galets bonus |
| Arcade parfaite (13-0 partout) | 300 Galets bonus |
| Defi quotidien | 75 Galets |

> Source de verite : constantes `GALET_*` dans `src/utils/Constants.js`

---

## Game Feel

Le game feel est ce qui rend chaque tir satisfaisant. Voici les effets en jeu :

- **Slow-mo pres du cochonnet** : quand la boule arrive a proximite du cochonnet, le temps ralentit brievement pour creer de la tension
- **Hitstop sur collision** : 60ms sur collision boule-boule, 100ms sur carreau — gel du jeu pour donner de l'impact
- **Camera shake** : secousse proportionnelle a la violence de l'impact
- **Barks IA** : chaque personnage a des repliques contextuelles (bon tir, mauvais tir, carreau, pression, victoire, defaite) — voir `barks` dans `characters.json`
- **Reactions foule** : sons de foule (oh, ah, applaudissements) selon la qualite du tir
- **Son de roulement** : son continu pendant que la boule roule, volume proportionnel a la vitesse

---

## Defi Quotidien (Daily Challenge)

Un defi unique par jour, identique pour tous les joueurs :

- **Seed** : basee sur la date du jour (ex. `20260323`) — meme defi pour tout le monde
- **Parametres aleatoires** : personnage impose, terrain impose, contrainte speciale (ex. "pas de tir", "puissance max 50%", "3 boules en 1 mene")
- **Recompense** : 75 Galets
- **Limite** : 1 tentative par jour (rejouable mais recompense unique)

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
| Ombre legere | `#3A2E28` | Ombres legeres, bordures, contours (JAMAIS de noir pur #000) |
| Ombre profonde | `#1A1510` | Ombres profondes, text shadow, arriere-plans sombres |

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
