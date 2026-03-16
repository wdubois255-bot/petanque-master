# Guide de Creation - Petanque Master

## Tes outils (tous GRATUITS)

| Outil | Quoi | Lien |
|-------|------|------|
| **Tiled** | Creer des maps (LE game-changer) | https://thorbjorn.itch.io/tiled |
| **Piskel** | Editer des sprites (navigateur) | https://www.piskelapp.com |
| **CharaMEL** | Generer des persos Pipoya | `assets/free_packs/CharaMEL ver.0.4.0/` |
| **sfxr.me** | Creer des sons retro | https://sfxr.me |
| **BeepBox** | Composer de la musique chiptune | https://www.beepbox.co |
| **LibreSprite** | Edition avancee (fork Aseprite) | https://libresprite.github.io |

---

## 1. Creer une map dans Tiled

### Installation
1. Telecharge Tiled sur https://thorbjorn.itch.io/tiled (gratuit, pay-what-you-want a 0 EUR)
2. Installe et lance

### Ouvrir la map template
1. File > Open > `public/assets/maps/village_depart.tmj`
2. Tu verras une grille 30x30 avec de l'herbe et des chemins
3. Le tileset Pipoya est deja configure !

### Structure des layers (de bas en haut)
- **Ground** : herbe, terre, chemins, eau, dalles
- **Buildings** : murs, maisons, clotures, arbres (troncs), decorations
- **Above** : toits, feuillages d'arbres (rendus AU-DESSUS du joueur)
- **Collisions** : tiles invisibles = zones infranchissables
- **NPCs** : objets Point pour placer les PNJ
- **Exits** : objets Rectangle pour les sorties de map

### Dessiner les maps
1. Selectionne un layer (ex: Ground)
2. Clique sur un tile dans le tileset en bas
3. Peins sur la grille !
4. Utilise B (pinceau), E (gomme), F (remplir), R (rectangle)

### Placer un PNJ
1. Selectionne le layer "NPCs"
2. Clique sur l'outil "Insert Point" (icone punaise)
3. Clique sur la map pour placer le PNJ
4. Dans le panneau Properties, ajoute :
   - **Name** : nom affiche (ex: "Marcel")
   - **Class** : type (ex: "dresseur", "villager", "arena_master")
   - **Custom Properties** (clic sur + en bas) :
     - `npc_id` (string) : identifiant unique
     - `sprite_key` (string) : ex "npc_marcel", "npc_villager_1"
     - `dialogue` (string) : lignes separees par `|` (ex: "Salut !|Tu veux jouer ?")
     - `difficulty` (string) : "easy", "medium", "hard" (pour les dresseurs)
     - `terrain` (string) : "terre", "herbe", "sable" (terrain de petanque)

### Placer une sortie de map
1. Selectionne le layer "Exits"
2. Clique sur l'outil "Insert Rectangle"
3. Dessine un rectangle sur les tiles de sortie (ex: 2 tiles de large en bas)
4. Properties :
   - `target_map` (string) : nom de la map cible (ex: "route_1")
   - `spawn_x` (int) : tile X d'arrivee sur la map cible
   - `spawn_y` (int) : tile Y d'arrivee

### Exporter
1. File > Save (Ctrl+S) -- sauvegarde en .tmj directement
2. Le jeu recharge automatiquement (Vite HMR)

---

## 2. Creer un personnage avec CharaMEL

1. Ouvre `assets/free_packs/CharaMEL ver.0.4.0/CharaMEL.exe`
2. L'interface est visuelle : clique sur les parties (corps, cheveux, vetements, accessoires)
3. Change les couleurs avec les curseurs
4. Exporte en PNG (spritesheet 128x128 : 4 cols x 4 rows de 32x32)
5. Place le fichier dans `public/assets/sprites/`
6. Ajoute-le dans BootScene.js (spriteKeys array)

---

## 3. Retoucher un sprite dans Piskel

1. Ouvre https://www.piskelapp.com
2. Import > spritesheet PNG (32x32 par frame)
3. Retouche pixel par pixel (couleurs, contours, accessoires)
4. Export > PNG spritesheet
5. Remplace le fichier dans `public/assets/sprites/`

---

## 4. Creer des sons avec sfxr.me

1. Ouvre https://sfxr.me
2. Clique sur un preset : Hit (impact boule), Coin (point marque), Powerup (victoire)
3. Ajuste les curseurs, clique "Mutate" pour varier
4. Exporte en WAV
5. Place dans `public/assets/audio/sfx/`

---

## 5. Composer de la musique avec BeepBox

1. Ouvre https://www.beepbox.co
2. Clique sur les cases de la grille pour placer des notes
3. Space = play/pause
4. Ajoute des canaux (melodie, basse, drums)
5. File > Export WAV
6. Place dans `public/assets/audio/music/`

---

## Conventions de nommage

| Type | Format | Exemple |
|------|--------|---------|
| Map | `nom_map.tmj` | `village_depart.tmj` |
| Sprite PNJ | `npc_prenom.png` | `npc_marcel.png` |
| Sprite joueur | `player_nom.png` | `player_pipoya.png` |
| Tileset | `nom_tileset.png` | `basechip_combined.png` |
| SFX | `sfx_action.wav` | `sfx_boule_impact.wav` |
| Musique | `music_theme.ogg` | `music_overworld.ogg` |

---

## Tilesets disponibles

Le tileset principal `basechip_combined.png` contient **1080 tiles** :
- Rows 0 : terrains (herbe, sable, terre, dalles)
- Rows 1-5 : arbres (grands 2x2 et petits 1x1, 4 saisons)
- Rows 6-8 : fleurs, champignons, rochers, decorations nature
- Rows 9-18 : falaises, grottes, echelles, ferme
- Rows 19-23 : clotures bois, fer forge
- Rows 24-30 : murs pierre, bancs, panneaux, ponts, puits
- Rows 32-47 : facades batiments, escaliers, murs bois
- Rows 48-55 : murs briques (rouge, blanc, gris, jaune), portes
- Rows 64-69 : boutiques, vitrines, grilles fer
- Rows 70-73 : **TOITS ET MURS DE MAISONS** (6 styles : bois, tan, bleu, rouge, gris, paille)
- Rows 73-75 : fenetres, vitraux, peintures
- Rows 80-82 : coffres, enseignes de boutiques (INN, armes, etc.)
- Row 133+ : eau

**Astuce** : Dans Tiled, survole un tile pour voir son index en bas a gauche.
