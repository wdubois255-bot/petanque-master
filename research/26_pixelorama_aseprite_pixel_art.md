# Recherche : Pixelorama & Aseprite pour ameliorer les assets de Petanque Master

> Date : 2026-03-17
> Contexte : Jeu Phaser 3, pixel art 32x32, theme provencal

---

## 1. PIXELORAMA (GRATUIT)

### Presentation
- **Version actuelle** : v1.1.8 (31 decembre 2025)
- **Licence** : MIT (100% gratuit, open source)
- **Moteur** : Godot 4.6.1 / GDScript
- **Plateformes** : Windows, Linux, macOS, **Web** (dans le navigateur!)
- **Telechargement** :
  - Steam : https://store.steampowered.com/app/2779170/Pixelorama/
  - Itch.io : https://orama-interactive.itch.io/pixelorama
  - GitHub Releases : https://github.com/Orama-Interactive/Pixelorama/releases
  - Web version : https://orama-interactive.github.io/Pixelorama/ (early access)
- **Documentation** : https://pixelorama.org/

### Installation Windows
1. Aller sur https://github.com/Orama-Interactive/Pixelorama/releases
2. Telecharger `Pixelorama-Windows-64bit.zip` (ou la version Steam)
3. Dezipper, lancer `Pixelorama.exe` - pas d'installation requise
4. Alternative : version web dans le navigateur (ideal pour tester)

### Fonctionnalites cles pour Petanque Master

#### Animation
- Timeline composee de **layers et frames**
- **Onion skinning** (peau d'oignon) : voir les frames precedentes/suivantes en transparence
- **Frame tags** : organiser les animations (idle, walk_south, walk_north, lancer, celebrer)
- **Dessin en temps reel pendant la lecture** de l'animation
- **Synchronisation audio** (utile pour caler le "clac" de la boule sur l'animation)
- Import depuis **Aseprite, Photoshop, Krita**

#### Palette Management
- Palettes pre-faites incluses
- **Import de palettes** externes (.pal, .gpl, .ase, .hex, .txt)
- **Mode couleurs indexees** (indexed color mode) - ideal pour controler la palette
- Creation de palettes custom directement dans l'outil

#### Export Spritesheet
- **Export PNG** : frames individuelles ou spritesheet (grille)
- **Export spritesheet** : configuration lignes/colonnes
- **Export GIF anime** / animated PNG / video
- **CLI (ligne de commande)** : automatisation des exports bulk
- PAS d'export JSON natif type Aseprite/TexturePacker (limitation)

#### Tilemap
- **Tilemap layers** : rectangulaire, isometrique, hexagonal
- Ideal pour creer/editer des tilesets directement
- Tiling mode pour verifier la repetition seamless

#### Effets et outils avances
- Layer effects non-destructifs : outlines, gradient maps, drop shadows
- Clipping masks et group blending
- Support layers 3D
- Algorithmes pixel-perfect : cleanEdge, OmniScale, rotxel
- **RotSprite-like rotation** (rotation sans perte de qualite pixel art)
- Extensions/plugins communautaires

#### Metadata
- Custom user data sur layers, frames, cels
- Utile pour annoter les hitboxes, points d'ancrage

### Limitations par rapport a Aseprite
| Feature | Pixelorama | Aseprite |
|---------|-----------|----------|
| Export JSON atlas | NON (PNG only) | OUI (.json Phaser-compatible) |
| Pixel Perfect Stroke | Algorithmes similaires | Reference du genre |
| RotSprite rotation | Oui (rotxel) | Oui (RotSprite natif) |
| Shading mode | Basique | Ink shading avance |
| Tiled mode (pattern) | Tilemap layers | 3x3 grid repeat |
| CLI automation | Oui | Oui |
| Communaute/tutos | Petite mais active | Enorme, dominant |
| Stabilite | Bonne | Excellente |
| Prix | GRATUIT | ~20$ (ou compile gratuit) |
| Cel linking | Non confirme | Oui |
| Version web | Oui (early access) | Non |

### Tutoriels pour debutants
- **Chaine YouTube officielle** : chercher "Orama Interactive Pixelorama" sur YouTube
- **Documentation officielle** : https://pixelorama.org/ (Introduction, Tools, Animation, Export)
- **Pedro Medeiros (saint11)** : tutorials compacts 512x512 sur les techniques pixel art generales
  - Site : https://saint11.art
  - Walk Cycle, Shading, Vegetation, Tiles... (fonctionne avec n'importe quel outil)

---

## 2. ASEPRITE (PAYANT ~20$, ou compile gratuit)

### Pourquoi c'est la reference
- **Export JSON atlas** natif compatible Phaser 3 directement
- Format JSON "Array" ou "Hash" : les deux lisibles par `this.load.atlas()`
- Pixel Perfect Stroke garanti
- RotSprite pour rotations propres
- Ink shading mode unique
- Communaute massive, milliers de tutos
- Compile gratuitement depuis les sources GitHub

### Export Spritesheet pour Phaser 3
```
File > Export Sprite Sheet
- Layout: Horizontal Strip ou Grid (By Rows / By Columns)
- Sheet Type: "Packed" ou "By Rows"
- Output: "JSON Array" + PNG
- Le JSON genere est directement compatible avec Phaser 3 :
  this.load.atlas('key', 'sheet.png', 'sheet.json')
```

### Compilation gratuite depuis les sources
```bash
git clone https://github.com/aseprite/aseprite.git
# Suivre les instructions de build dans INSTALL.md
# Necessite CMake, Ninja, Skia
```

---

## 3. TECHNIQUES D'AMELIORATION PAR TYPE D'ASSET

### 3.1 BOULES DE PETANQUE

#### Etat actuel
- Images statiques 32x32 (boule_acier.png, boule_bronze.png, etc.)
- Chargees comme `this.load.image()` (pas de spritesheet)
- Ball.js gere un `_rollFrames = 6` et un `_rollDist` mais en pratique les boules sont des images fixes
- Ombre elliptique separee

#### Shading spherique convaincant (technique pixel art)

**Methode "3 zones + highlight" :**
1. **Base color** : couleur principale de la boule (60% de la surface)
2. **Shadow** : hue-shifted vers le froid/violet pour les ombres (25%)
3. **Midtone** : entre base et shadow (10%)
4. **Highlight** : point blanc ou tres clair, legerement decentre vers le haut-gauche (5%)
5. **Reflected light** : fine ligne plus claire en bas (lumiere reflechie du sol)

**Palette par materiau (4-5 couleurs chacun) :**

```
ACIER (standard):
  Highlight:  #E8EDF2
  Light:      #A8B5C2
  Base:       #7A8A99
  Shadow:     #4D5B6B
  Dark:       #2E3840

BRONZE:
  Highlight:  #F2D9A0
  Light:      #C9A054
  Base:       #A07830
  Shadow:     #6B4F20
  Dark:       #3D2E15

CHROME (brillant):
  Highlight:  #FFFFFF
  Light:      #D4DAE0
  Base:       #9EAAB5
  Shadow:     #5C6E7A
  Dark:       #2A3540

NOIRE (mat):
  Highlight:  #787878
  Light:      #505050
  Base:       #383838
  Shadow:     #252525
  Dark:       #151515

ROUGE (peinte):
  Highlight:  #FF8A8A
  Light:      #E04040
  Base:       #B82020
  Shadow:     #801515
  Dark:       #4A0A0A
```

**Dithering metallique :**
- Utiliser du **ordered dithering** (damier 2x2) entre highlight et light pour simuler le reflet diffus
- Sur une boule 32x32, 2-3 pixels de dithering entre zones suffisent
- Le chrome utilise plus de dithering que le mat

**Astuce Pixelorama** : utiliser l'outil Shading (S) avec la palette metallique pour peindre les zones de lumiere/ombre directement

#### Animation de roulement (rotation sprite)

**Methode spritesheet 6-8 frames :**
1. Dessiner la boule vue de face avec les rainures/motifs
2. Creer 6 frames en deplacant les details de 1-2px vers le bas a chaque frame
3. Les highlights restent fixes (source de lumiere fixe), seuls les details de surface bougent
4. Frame 1: motif en haut -> Frame 6: motif en bas -> boucle

**Dans Pixelorama :**
1. Creer un nouveau projet 192x32 (6 frames de 32x32 en horizontal) ou utiliser le timeline
2. Dessiner la frame 1 complete
3. Dupliquer la frame, deplacer les details de surface de ~5px vers le bas
4. Repeter 6 fois
5. Export en spritesheet horizontal strip
6. Dans Phaser : `this.load.spritesheet('ball_acier', 'ball_acier_roll.png', { frameWidth: 32, frameHeight: 32 })`

**Taille recommandee** : rester en 32x32 par frame, c'est parfait pour votre echelle. Le Ball.js actuel scale deja avec `this.radius / 14`.

#### Integration Phaser 3

Le code Ball.js est DEJA pret pour les spritesheets :
```javascript
// Ball.js ligne 32-40 - detecte automatiquement le nombre de frames
if (this.textureKey && scene.textures.exists(this.textureKey)) {
    this.sprite = scene.add.sprite(x, y, this.textureKey, 0);
    this._rollFrames = tex.frameTotal - 1;
}
```

Il faut juste :
1. Remplacer `this.load.image('ball_acier', ...)` par `this.load.spritesheet('ball_acier', ..., { frameWidth: 32, frameHeight: 32 })` dans BootScene.js
2. Creer les spritesheets PNG avec 6 frames horizontales

---

### 3.2 SPRITES JOUEURS

#### Etat actuel
- Spritesheets 128x128 (4 colonnes x 4 lignes de 32x32)
- 4 directions (S, W, E, N) x 4 frames par direction
- Generes par PixelLab (chibi style)
- Charge via `this.load.spritesheet(key, path, { frameWidth: 32, frameHeight: 32 })`

#### Ameliorer les walk cycles

**Bounce (rebond vertical) :**
- A 32x32, le bounce est subtil : frames 1 et 3 = position normale, frame 2 = personnage 1px plus haut
- Cree l'illusion de poids et de vie
- Dans Pixelorama : selectionner le contenu de la frame, deplacer de 1px vers le haut

**Arm swing (balancement des bras) :**
- Frame 1 : bras droit devant (1px), bras gauche derriere
- Frame 2 : bras au repos
- Frame 3 : bras gauche devant, bras droit derriere
- Frame 4 : bras au repos
- A 32x32, c'est litteralement 1 pixel qui bouge

**Sub-pixel animation :**
- Technique avancee : au lieu de deplacer un element de 1px, changer sa couleur/luminosite
- Exemple : un oeil qui "bouge" de 0.5px en changeant quel pixel est le plus sombre
- Tres efficace pour les idle animations a petite echelle

#### Onion skinning dans Pixelorama
1. Activer via le menu Animation ou le bouton dans la timeline
2. Choisir le nombre de frames precedentes/suivantes a afficher
3. Regler l'opacite (30-50% recommande)
4. Permet de verifier que chaque frame est coherente avec la precedente
5. ESSENTIEL pour les walk cycles : chaque frame doit "couler" naturellement

#### Animations supplementaires a creer

**Animation de lancer (3-5 frames) :**
1. Preparation : personnage se penche en arriere, bras leve
2. Mouvement : rotation du corps vers l'avant
3. Release : bras en extension, boule lachee
4. Follow-through : bras continue sa trajectoire
5. Retour : position neutre

**Animation idle (2-4 frames, lente) :**
1. Respiration subtile : corps monte de 1px
2. Retour position normale
3. Optionnel : leger mouvement de tete ou clignement

**Animation celebrer (4-6 frames) :**
1. Bras qui se levent
2. Petit saut (1-2px vers le haut)
3. Retour au sol
4. Position fiere, poings en l'air

**Workflow dans Pixelorama :**
1. Ouvrir la spritesheet existante comme reference (Import > From Spritesheet)
2. Creer un nouveau document 32x32 avec le bon nombre de frames
3. Activer onion skinning
4. Dessiner frame par frame
5. Export en spritesheet horizontal
6. Integrer dans BootScene.js avec un nouveau spritesheet key

---

### 3.3 DECORS TERRAIN

#### Textures de sol

**Terre battue (le terrain de petanque classique) :**
```
Palette terre battue :
  Clair:    #E8C9A0  (zones eclairees, seches)
  Base:     #C9A070  (couleur dominante)
  Moyen:    #A88050  (variation)
  Sombre:   #8A6040  (creux, humide)
  Tres sombre: #6B4830  (fissures profondes)
```
- Texture : bruit irregulier, petits cailloux (pixels isoles plus clairs ou sombres)
- Variation : chaque tile 32x32 doit avoir de legeres differences pour eviter la repetition visible
- Faire 3-4 variantes de la meme tile et les alterner

**Herbe :**
```
Palette herbe provencale :
  Highlight: #A8D060  (brins au soleil)
  Clair:     #78A838  (herbe vive)
  Base:      #5C8828  (couleur dominante)
  Sombre:    #3E6818  (ombre)
  Tres sombre: #2A4810  (base des touffes)
```
- Petites touffes : 3-5 pixels en V inverse, espaces irregulierement
- Melanger avec des pixels de terre pour l'herbe clairsemee
- Variantes : herbe seche (plus jaune) pour l'ete provencal

**Sable :**
```
Palette sable :
  Highlight: #F5E8C8
  Clair:     #E8D4A0
  Base:      #D4BC88
  Sombre:    #BBA070
  Grain:     #C9AB78
```
- Texture tres douce, presque uniforme avec quelques grains

**Dalles / Pierre :**
```
Palette dalles :
  Highlight: #D8D0C0
  Clair:     #C0B8A8
  Base:      #A8A090
  Joint:     #787068
  Sombre:    #605848
```
- Lignes de joints en grille (1px sombre)
- Legeres variations de teinte par dalle
- Quelques pixels de mousse/lichen (vert tres desature)

#### Technique de tiling seamless dans Pixelorama
1. Creer un document 32x32
2. Activer le **Tiling Mode** (Edit > Preferences > Canvas ou directement dans View)
3. Pixelorama affiche la tile repetee en 3x3 autour
4. Dessiner au centre en verifiant que les bords matchent
5. Astuce : commencer par le centre, puis travailler vers les bords
6. Verifier en zoomant/dezoomant que le pattern n'est pas trop visible

#### Touffes d'herbe, cailloux, traces
- Ce sont des **decoration sprites** (pas des tiles) places par-dessus le sol
- Taille : 8x8 a 16x16 pixels max
- Dessiner sur fond transparent
- En placer aleatoirement sur le terrain dans PetanqueScene.js
- Votre code charge deja `terrain_herbe_touffe`, `terrain_fissure`, `terrain_planche_bord`

---

### 3.4 BORDURES DE TERRAIN ET AUTOTILING

#### Bordures de terrain de petanque
- **Planches** : rectangles horizontaux, texture bois (3-4 couleurs : clair, base, sombre, noeud)
- **Lignes blanches** : 1-2px de large, couleur #E8E0D0 (pas blanc pur)
- **Metal** : pour terrains urbains, gris metallique avec reflet

#### Autotiling / 9-slice
**Principe du 9-slice :**
```
[coin-HG] [bord-H] [coin-HD]
[bord-G]  [centre] [bord-D]
[coin-BG] [bord-B] [coin-BD]
```
- 9 tiles de 32x32 = un set de bordure complet
- Le centre est la texture de sol
- Les bords ont la texture de sol + la bordure
- Les coins combinent 2 bordures

**Dans Pixelorama :**
1. Creer un document 96x96 (3x3 tiles de 32x32)
2. Dessiner le 9-slice complet
3. Verifier la coherence aux jonctions
4. Exporter, decouper en 9 images, ou utiliser comme tileset

**Alternative : tileset full autotile (47 tiles)**
- Plus complexe mais gere tous les cas (coins internes, T-junctions)
- Recommande pour plus tard, le 9-slice suffit pour le MVP

---

### 3.5 ELEMENTS DE DECOR PROVENCAUX

#### Arbres
**Pin parasol (pin pignon) - typique Provence :**
- Tronc mince et haut (2-3px de large, brun #8B5E3C)
- Canopee en forme de parasol/champignon en haut
- Palette verte desaturee : #5C7B40, #4A6530, #384E22
- Taille recommandee : 32x64 ou 64x64 (2 tiles de haut)
- Ombre au sol : ellipse sombre au pied

**Olivier - l'arbre provencal par excellence :**
- Tronc tordu, noueux (3-4px de large, gris-brun #7A6B5A)
- Feuillage irregulier, pas symetrique
- Vert olive/argente : #8A9B68, #6B7B50, #A0AB80
- Taille : 48x48 ou 64x48

**Platane :**
- Grand, tronc ecorce tachetee (pixels clairs et sombres)
- Feuillage dense et large
- Votre `arbre_platane.png` existe deja - a retoucher

**Technique arbres dans Pixelorama :**
1. Dessiner le tronc d'abord (structure)
2. Ajouter le feuillage sur un layer separe
3. Utiliser des clusters de 3-5 pixels pour le feuillage (jamais des pixels isoles)
4. Ajouter 2-3 niveaux de vert pour la profondeur
5. Highlight en haut, ombre en bas

**Tutoriels recommandes :**
- "Modular Tree Technique" par Slynyrd (Lospec) - 154 likes
- "Tree Tutorial" par Artem Brullov (Lospec)
- "Vegetation Part 1 & 2" par Pedro Medeiros (saint11)

#### Maisons provencales
- Murs : ocre/terracotta #D4A060 avec variations #C89050, #E0B070
- Toits : tuiles arrondies, rouge-brun #B85030, #983820
- Volets : bleu lavande #6888B0 ou vert olive #608050
- Portes : bois sombre #6B5040
- Taille : 64x64 ou 96x64 (2-3 tiles de large, 2 de haut)
- Votre `maison_provencale.png` existe - a retoucher

#### Mobilier urbain
**Banc :** 32x16, lattes de bois + pieds metal
**Fontaine :** 32x48, pierre claire avec eau bleue animee (2-3 frames)
**Lampadaire :** 8x48 (fin et haut), fer forge noir-brun + lumiere jaune

---

## 4. PIPELINE CONCRET : Pixelorama -> Phaser 3

### Workflow recommande

```
1. CREER dans Pixelorama
   - Nouveau document 32x32 (ou taille appropriee)
   - Importer la palette Endesga-32 ou palette custom
   - Dessiner frame par frame avec onion skinning

2. EXPORTER depuis Pixelorama
   - Spritesheets : File > Export > Spritesheet
     - Type : "Horizontal strip" pour les animations simples
     - Ou : "Grid" (colonnes x lignes) pour les personnages (4 cols x 4 rows)
   - Images simples : File > Export > PNG
   - Nommage : [type]_[nom]_[variante].png
     Ex: ball_acier_roll.png, char_rene_throw.png

3. PLACER dans le projet
   /assets
     /sprites
       ball_acier_roll.png      (spritesheet 192x32, 6 frames)
       ball_bronze_roll.png
       char_rene_throw.png      (spritesheet 160x32, 5 frames)
       terrain_herbe_v1.png     (tile 32x32)
       terrain_herbe_v2.png     (variante)
       terrain_terre_v1.png
       decor_pin_parasol.png    (64x64)
       decor_olivier.png        (48x48)
       border_planche_9slice.png (96x96 tileset)

4. CHARGER dans BootScene.js
   // Spritesheet animation
   this.load.spritesheet('ball_acier', 'assets/sprites/ball_acier_roll.png', {
       frameWidth: 32, frameHeight: 32
   });

   // Image statique
   this.load.image('decor_pin', 'assets/sprites/decor_pin_parasol.png');

   // Tileset
   this.load.image('terrain_tiles', 'assets/tilesets/terrain_tiles.png');
```

### Pas d'export JSON ? Pas de probleme.

Pixelorama n'exporte pas de JSON atlas comme Aseprite. Mais pour Phaser 3, ce n'est **pas un probleme** car :

1. **`this.load.spritesheet()`** ne necessite QUE le PNG + frameWidth/frameHeight
   - Phaser decoupe automatiquement en grille reguliere
   - Parfait pour les animations de boules, personnages, etc.

2. **`this.load.atlas()`** (avec JSON) n'est necessaire que pour les spritesheets avec des frames de tailles differentes ou du packing optimise. Dans votre cas, tout est en 32x32, donc `spritesheet` suffit.

3. Si vous voulez un JSON atlas plus tard, utilisez **TexturePacker** (free tier) ou **Free Texture Packer** (gratuit) pour combiner les PNG de Pixelorama en atlas + JSON.

### Automatisation possible

**Script Node.js avec sharp :**
```bash
# Redimensionner, combiner, optimiser les PNG automatiquement
npm install sharp
```
```javascript
// scripts/build-sprites.mjs
import sharp from 'sharp';
// Combiner des frames individuelles en spritesheet
// Optimiser les PNG (compression sans perte)
// Generer les variantes de couleur (palette swap)
```

**CLI Pixelorama :**
Pixelorama supporte l'automatisation en ligne de commande pour le bulk export. Utile si vous avez beaucoup de fichiers .pxo a exporter.

---

## 5. COMPARAISON : PIXEL ART MANUEL vs IA (PixelLab)

### PixelLab (IA)
**Avantages :**
- Rapide : un sprite en 30 secondes
- Bon pour le prototypage et l'exploration de styles
- Coherence de style quand on specifie bien le prompt
- Genere des spritesheets animees directement

**Inconvenients :**
- Manque de precision pixel-perfect (artefacts, pixels parasites)
- Difficile de controler exactement la palette
- Pas de controle fin sur chaque pixel
- Les animations generees manquent souvent de "poids" et de naturalisme
- Cout API

### Pixel art manuel (Pixelorama/Aseprite)
**Avantages :**
- Controle total, pixel-perfect
- Palette maitrisee a 100%
- Animations plus naturelles et satisfaisantes
- Gratuit (Pixelorama)
- Competence qui se developpe avec le temps
- Style unique et personnel

**Inconvenients :**
- Lent au debut (courbe d'apprentissage)
- Necessite de la patience et de la pratique

### Workflow hybride recommande (MEILLEUR DES DEUX MONDES)
```
1. PixelLab genere un brouillon / base
2. Importer dans Pixelorama
3. Nettoyer : supprimer les pixels parasites
4. Ajuster la palette : remapper sur votre palette provencale
5. Ajouter les details manuellement
6. Animer frame par frame manuellement
7. Exporter le resultat final
```

C'est exactement la strategie documentee dans votre `reference_art_strategy.md`.

### Jeux indie de reference utilisant ces techniques
- **Stardew Valley** : pixel art 16x16->32x32, palette chaude, personnages expressifs
- **Celeste** : animations fluides avec sub-pixel, effets de particules pixel art
- **Eastward** : pixel art haut de gamme, eclairage, vegetation luxuriante
- **Moonlighter** : palette limitee, animations propres, decors detailles
- **Wargroove** : style Fire Emblem GBA, portraits HD + sprites pixel art (comme votre strategie!)

---

## 6. PALETTES RECOMMANDEES

### Endesga 32 (RECOMMANDEE pour Petanque Master)
- **32 couleurs** universelles, excellente couverture chromatique
- Tons chauds dominants : parfait pour la Provence
- Telechargement : https://lospec.com/palette-list/endesga-32
- Formats disponibles : PNG, PAL, ASE, TXT, GPL, HEX
- 190 000+ telechargements, reference de l'industrie indie

**Couleurs cles pour le jeu :**
- Terracotta/terre : #be4a2f, #d77643, #b86f50
- Sable/peau : #ead4aa, #e4a672, #e8b796
- Vert olive : #3e8948, #265c42
- Bleu ciel : #0099db, #2ce8f5
- Bois sombre : #733e39, #3e2731
- Acier : #c0cbdc, #8b9bb4, #5a6988

### Resurrect 32
- 32 couleurs, bonne alternative plus "fantasy"
- Telechargement : https://lospec.com/palette-list/resurrect-32
- Plus de violets et roses, moins terracotta

### Palette custom Petanque Master (a creer dans Pixelorama)
Basee sur les couleurs du CLAUDE.md (ocres, terracotta, verts olive, bleus ciel, lavande) :
```
#F5E6D0  Sable clair / fond
#E8C9A0  Terre claire
#C9A070  Terre battue
#A88050  Terre foncee
#6B4830  Ombre terre
#3A2E28  Ombre max (pas de noir pur!)
#D77643  Terracotta
#BE4A2F  Tuiles rouges
#78A838  Herbe vive
#5C8828  Herbe base
#3E6818  Herbe sombre
#8A9B68  Olive clair
#6888B0  Bleu lavande
#0099DB  Bleu ciel
#A8B5C2  Acier
#7A8A99  Metal sombre
#C9A054  Bronze
#FFFFFF  Highlight
```

---

## 7. TUTORIELS RECOMMANDES (par priorite)

### Techniques generales (commencer ici)
1. **"Pixel Art Tutorial" par Derek Yu** (Lospec) - Fondamentaux complets : sprites, shading, dithering
2. **"Shading and Hue Shifting" par Royal Den Studios** (Lospec) - Shading spherique avec exemples
3. **Pedro Medeiros "Shading"** - Tips compact format 512x512

### Animation
4. **Pedro Medeiros "Walk Cycle"** - Walk cycle fondamentaux
5. **Pedro Medeiros "Character Idle"** - Animation idle pour sprites de jeu

### Environnement
6. **Pedro Medeiros "Making Tiles"** - Tiles seamless fondamentaux
7. **Pedro Medeiros "Vegetation Part 1 & 2"** - Arbres et feuillage
8. **"Modular Tree Technique" par Slynyrd** - Technique modulaire pour arbres varies
9. **Pedro Medeiros "User Interface 9-Slice"** - Technique 9-slice pour bordures
10. **"Rock Texture" par Luke Sadface** - Textures de pierre detaillees

### Avance
11. **Endesga "Pixelart Quicktip Highlights"** - Highlights selon le materiau
12. **Endesga "Pixelart Quicktip Bevels"** - Biseaux et aretes vives
13. **"PixelArt Brickwork" par TexMexxx** - Textures de briques/murs

Tous disponibles sur : https://lospec.com/pixel-art-tutorials

---

## 8. PLAN D'ACTION CONCRET

### Phase 1 : Setup (30 min)
- [ ] Telecharger Pixelorama v1.1.8 depuis GitHub Releases
- [ ] Importer la palette Endesga-32 (ou creer la palette custom Petanque Master)
- [ ] Se familiariser avec l'interface : outils, timeline, layers, onion skinning

### Phase 2 : Boules (2-3h)
- [ ] Ouvrir boule_acier.png existante comme reference
- [ ] Creer ball_acier_roll.png : 6 frames de rotation en spritesheet horizontal (192x32)
- [ ] Appliquer le shading spherique 5 couleurs
- [ ] Ajouter dithering metallique sur le highlight
- [ ] Repeter pour bronze, chrome, noire, rouge
- [ ] Mettre a jour BootScene.js : image -> spritesheet
- [ ] Creer cochonnet_roll.png (plus petit, bois)

### Phase 3 : Personnages - retouche (3-4h par personnage)
- [ ] Importer les spritesheets PixelLab existantes
- [ ] Nettoyer pixel par pixel (supprimer artefacts IA)
- [ ] Ajouter le bounce de 1px aux walk cycles
- [ ] Verifier la coherence de palette entre tous les personnages
- [ ] Optionnel : ajouter animation idle (2 frames) et throw (4 frames)

### Phase 4 : Terrain (4-6h)
- [ ] Creer 3-4 variantes tiles terre battue 32x32
- [ ] Creer 3-4 variantes tiles herbe 32x32
- [ ] Creer les tiles sable et dalles
- [ ] Creer le 9-slice bordure planches (96x96)
- [ ] Creer les decorations : touffes, cailloux, fissures (8x8 a 16x16)
- [ ] Tester le tiling en jeu

### Phase 5 : Decors (4-6h)
- [ ] Retoucher arbre_platane.png existant
- [ ] Creer pin_parasol.png et olivier.png
- [ ] Retoucher maison_provencale.png
- [ ] Creer banc, fontaine, lampadaire
- [ ] Integrer dans les scenes

**Temps total estime : 15-20h reparties sur plusieurs sessions**

---

## RESUME

**Pour un debutant motive, Pixelorama est le meilleur choix** :
- Gratuit, pas de barriere d'entree
- Toutes les features necessaires pour Petanque Master
- La seule limitation (pas de JSON atlas) n'est pas un probleme avec Phaser 3 spritesheet
- Version web pour essayer sans installer
- Si plus tard tu veux passer a Aseprite pour le JSON export ou le shading mode, la transition est facile car les concepts sont les memes
