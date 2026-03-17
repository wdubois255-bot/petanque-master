# 03 - Audit Assets & Ressources

## Inventaire complet

### Sprites personnages (/public/assets/sprites/)
| Fichier | Taille | Perso | Format | Statut |
|---------|--------|-------|--------|--------|
| marcel_animated.png | 15 KB | Marcel | 128x128 spritesheet (4x4 frames 32x32) | COMMITE |
| marcel_from_user.png | 12 KB | Marcel | Style realiste utilisateur | NON COMMITE |
| marcel_v2_animated.png | 16 KB | Marcel V2 | Mise a jour | NON COMMITE |
| rene_animated.png | 15 KB | Rene | Spritesheet standard | COMMITE |
| rene_v2_anim1.png | 15 KB | Rene V2 | Part 1 | NON COMMITE |
| rene_v2_anim2.png | 15 KB | Rene V2 | Part 2 | NON COMMITE |
| fanny_animated.png | 15 KB | Fanny | Spritesheet standard | COMMITE |
| ricardo_animated.png | 19 KB | Ricardo | Spritesheet standard | COMMITE |
| thierry_animated.png | 14 KB | Thierry | Spritesheet standard | COMMITE |
| marius_animated.png | 16 KB | Marius | Spritesheet standard | COMMITE |

**Observations sprites personnages :**
- 6 personnages avec spritesheets animes : OK
- 4 fichiers non commites (variantes Marcel V2 et Rene V2)
- Format uniforme 128x128 (4 colonnes x 4 lignes, frames 32x32)
- Upscale 2x en jeu (affichage 64x64) : OK
- Pipeline : PixelLab 64x64 -> rotation -> animation 4 frames -> downscale 2x -> 32x32

### Sprites boules (/public/assets/sprites/)
| Fichier | Taille | Type | Statut |
|---------|--------|------|--------|
| boule_acier.png | 1.6 KB | Acier (balanced) | OK |
| boule_bronze.png | 1.5 KB | Bronze (heavy) | OK |
| boule_chrome.png | 1.4 KB | Chrome (light) | OK |
| boule_noire.png | 1.5 KB | Noire (dense) | OK |
| boule_rouge.png | 1.3 KB | Rouge (grooved) | OK |

**Observations boules :** 5 types complets, coherent avec boules.json. Petits fichiers.

### Sprites cochonnet (/public/assets/sprites/)
| Fichier | Taille | Variante | Statut |
|---------|--------|----------|--------|
| cochonnet.png | 1.1 KB | Classique (or) | OK |
| cochonnet_bleu.png | 1.1 KB | Bleu competition | OK |
| cochonnet_vert.png | 1.1 KB | Vert synthetique | OK |

### Decorations terrain (/public/assets/sprites/)
| Fichier | Taille | Usage | Statut |
|---------|--------|-------|--------|
| terrain_fissure.png | 2.8 KB | Terre craquellee | OK |
| terrain_herbe_touffe.png | 1 KB | Touffe d'herbe | OK |
| terrain_planche_bord.png | 2.6 KB | Bordure bois | OK |

---

### Tilesets (/public/assets/tilesets/)
| Fichier | Taille | Usage | Source |
|---------|--------|-------|--------|
| basechip_combined.png | 253 KB | Tileset principal | Pipoya optimise |
| basechip_pipoya.png | 396 KB | Original Pipoya 32x32 | Pipoya (CC) |
| schwarnhild_combined.png | 199 KB | Environnements combines | Schwarnhild (CC) |
| environment_schwarnhild.png | 30 KB | Objets environnement | Schwarnhild |
| houses_schwarnhild.png | 78 KB | Maisons | Schwarnhild |
| market_schwarnhild.png | 48 KB | Marche | Schwarnhild |
| nature_schwarnhild.png | 38 KB | Nature | Schwarnhild |
| village_schwarnhild.png | 48 KB | Village | Schwarnhild |
| ninja_combined.png | 112 KB | Tileset RPG complet | Ninja |
| ninja_field/floor/house/nature/... | ~180 KB | Layers separees | Ninja |
| cobblestone_brown.png | 5.7 KB | Paves marrons | Custom |
| cobblestone_grey.png | 5.6 KB | Paves gris | Custom |
| dirt1.png | 5.7 KB | Terre | Custom |
| grass1.png | 6.1 KB | Herbe | Custom |
| water1.png | 5.9 KB | Eau | Custom |
| fence_marble.png | 1.9 KB | Cloture marbre | Custom |
| fence_wood.png | 1.7 KB | Cloture bois | Custom |
| flower.png | 3.3 KB | Fleurs | Custom |

**Total tilesets : 1.5 MB, 24 fichiers**
**Observations :** Excellente bibliotheque. 3 collections completes (Pipoya, Schwarnhild, Ninja).
Suffisant pour le mode aventure futur. Actuellement utilises principalement en overworld
(reserve), pas dans la scene petanque (terrains proceduaux).

---

### Portraits (/public/assets/portraits/)
**VIDE - 0 fichiers**

**Impact :** Les references dans le code pointent vers des portraits qui n'existent pas.
CharSelectScene et QuickPlayScene affichent les sprites animes au lieu de portraits haute-res.
Le modele Fire Emblem GBA (sprite 32x32 + portrait HD) n'est que partiellement realise.

**Action requise :** Generer 6 portraits (un par personnage) en 128x128 ou 256x256 via PixelLab.

---

### Maps Tiled (/public/assets/maps/)
**VIDE - 0 fichiers**

**Impact :** OverworldScene ne peut pas charger de maps reelles.
Le code (MapManager.js) attend des JSON Tiled mais aucun n'est deploye.
BootScene gere gracieusement l'absence (silent fail).

**Action requise :** Non prioritaire (mode overworld = reserve).
Quand mode aventure sera prioritaire : creer 5-7 maps dans Tiled, exporter en JSON.

---

### Audio

#### Musique (/public/assets/audio/music/)
**VIDE - 0 fichiers**

#### SFX (/public/assets/audio/sfx/)
**VIDE - 0 fichiers**

**Impact critique :** Le jeu n'a AUCUN fichier audio reel.
SoundManager.js genere tout en procedural via Web Audio API :
- sfxBouleBoule() : clac metallique avec harmoniques
- sfxBouleCochonnet() : impact aigu
- sfxLanding() : thud selon terrain
- sfxRoll() : grondement bas
- sfxCarreau() : chimes ascendants + echo
- sfxThrow() : swoosh
- sfxVictory() / sfxDefeat() : sequences melodiques
- startCigales() / stopCigales() : cigales ambiantes en boucle

**Evaluation audio procedural :**
- Fonctionnel et creatif
- Manque de chaleur et de realisme
- Pas de musique de fond (meme pas procedurale)
- Pas de voix/reactions vocales
- Volume non controlable

**Action requise :**
1. Musique chiptune pour les matchs (Beepbox ou /sfx)
2. SFX realistes pour les impacts (ElevenLabs MCP)
3. Ambiance cigales reelle (ElevenLabs ou sample CC0)
4. Reactions vocales ("Oh!", "Bien joue!") (ElevenLabs TTS)

---

### Donnees JSON (/public/data/)

| Fichier | Enregistrements | Complet? | Qualite |
|---------|-----------------|----------|---------|
| characters.json | 6 personnages | OUI | EXCELLENT - stats, archetype, catchphrase, description |
| boules.json | 5 boules + 3 cochonnets + physique | OUI | EXCELLENT - schema complet avec constantes |
| terrains.json | 5 terrains | OUI | EXCELLENT - friction, zones, pentes, ambiance |
| arcade.json | 6 rounds (5+boss) | OUI | TRES BON - progression, terrains, difficulte |
| npcs.json | 15+ PNJ | OUI | BON - dialogues complets (reserve mode aventure) |
| progression.json | 4 badges + gates | OUI | MOYEN - scaffold, pas integre en jeu |

**Forces donnees :**
- Architecture data-driven exemplaire
- Toutes les mecaniques parametre par JSON (pas hardcode)
- Facile a modifier/equilibrer sans toucher au code

**Faiblesses donnees :**
- progression.json et npcs.json = scaffold pour mode aventure non utilise en mode arcade
- Pas de donnees pour : achievements, statistiques, leaderboard
- characters.json manque les references aux portraits (pas de champ portrait_path)

---

## Bilan assets

### Ce qui est complet
| Categorie | Fichiers | Taille | Qualite |
|-----------|----------|--------|---------|
| Sprites personnages | 10 (6 uniques + 4 variantes) | 140 KB | BON |
| Sprites boules | 5 | 7.3 KB | BON |
| Sprites cochonnet | 3 | 3.3 KB | BON |
| Decorations terrain | 3 | 6.4 KB | BON |
| Tilesets | 24 | 1.5 MB | EXCELLENT |
| Donnees JSON | 6 | ~20 KB | EXCELLENT |

### Ce qui manque
| Categorie | Impact | Priorite |
|-----------|--------|----------|
| **Portraits HD** | UI incomplete, pas de "wow" selection perso | HAUTE |
| **Musique** | Pas d'atmosphere, experience plate | HAUTE |
| **SFX reels** | Audio procedural correct mais pas immersif | MOYENNE |
| **Maps Tiled** | Bloque le mode aventure | BASSE (reserve) |
| **Icones UI** | Pas d'icones pour boules/terrains dans les menus | BASSE |
| **Sprite reactions** | Personnages sans expression de joie/deception | MOYENNE |

### Taille totale actuelle : ~1.7 MB (objectif : <5 MB, max 10 MB)
**Marge disponible : 3.3 MB** pour ajouter portraits + audio + maps.
