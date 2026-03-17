# HANDOFF — Petanque Master (17 mars 2026)

## Etat du projet

Jeu de petanque competitif style jeu de combat (Street Fighter / Tekken) en pixel art.
Le joueur choisit un personnage avec des stats uniques et affronte des adversaires.

**Stack** : Phaser 3.90 + JavaScript ES6 + Vite 8 + GitHub Pages

**Commandes** :
```bash
npm run dev     # Dev server (HMR)
npm run build   # Production build
```

---

## Ce qui est FAIT et FONCTIONNEL

### Gameplay coeur
- Moteur petanque custom (physique realiste, COR 0.62 acier)
- 4 techniques de lancer : roulette, demi-portee, plombee, tir au fer
- Systeme de visee drag-and-release avec landing marker
- IA 3 niveaux + personnalites (pointeur, tireur, stratege, complet)
- Score FIPJP : 13 points, menes, equipe qui perd rejoue
- Cochonnet roule 20-30% apres atterrissage (physique correcte)
- Carreau detecte naturellement via COR 0.62

### Modes de jeu
- **Mode Arcade** : 5 matchs + boss (Rene→Marcel→Fanny→Ricardo→Thierry→Marius)
- **Partie Rapide** : choix perso/boule/cochonnet/terrain/difficulte
- Ecran titre cinematique avec personnages animes

### 6 personnages jouables
| Perso | ID | Style | Sprite |
|-------|----|-------|--------|
| Rene | equilibre | Equilibre (6/6/6/6) | rene_animated.png |
| Marcel | pointeur | Pointeur precision | marcel_animated.png |
| Fanny | tireur | Tireur agressif | fanny_animated.png |
| Ricardo | stratege | Stratege calculateur | ricardo_animated.png |
| Thierry | wildcard | Flambeur imprevisible | thierry_animated.png |
| Marius | boss | Boss complet | marius_animated.png |

### 5 terrains uniques
| Terrain | Type | Particularite |
|---------|------|---------------|
| Place du Village | terre | Standard, friction 1.0 |
| Plage des Calanques | sable | Forte friction 3.5, coquilles |
| Parc Municipal | herbe | Zones friction variees |
| Colline aux Oliviers | terre seche | Pente (boules roulent vers le bas) |
| Docks du Vieux-Port | dalles | Murs de rebond, friction 0.4 |

### UI/UX
- Palette provencale unifiee (ocre/terracotta/lavande/ciel)
- ScorePanel avec pulse anime sur changement de score
- **Terrain propre** : aucun indicateur permanent, juste boules + cochonnet
- **[TAB]** : toggle classement complet de toutes les boules (1er-6eme)
- Sprites personnages upscales 2x en jeu (64px)
- Positions joueurs separees (lanceur au cercle, spectateur sur le cote)

### Assets
- 6 spritesheets personnages 128x128 (PixelLab + retouche)
- 5 boules + 3 cochonnets avec shading spherique 7 tons
- Terrains 100% proceduraux (TerrainRenderer.js, 1410 lignes)
- 4 textures terrain seamless 64x64
- 2 bordures 9-slice (bois, pierre)
- 4 decors provencaux (pin, olivier, banc, fontaine)
- 12 SFX + 2 musiques

### Code
- **Propre** : audit complet effectue, zero dead code, zero console.log
- CHAR_SPRITE_MAP centralise dans Constants.js
- Palette CSS/hex centralisee dans Constants.js
- Build OK, zero erreur JS (hors tilemaps overworld non crees)

---

## Ce qui RESTE A FAIRE (prochaine session)

### PRIORITE 1 — Integrer les nouveaux assets dans le jeu
Les sprites sont generes mais pas encore utilises par le code :

1. **Textures terrain** : Integrer `terrain_tex_terre/herbe/sable/dalles.png` dans TerrainRenderer.js
   - Charger dans BootScene.js comme tiles
   - Utiliser `this.add.tileSprite()` au lieu de Graphics pour la surface
   - Fichier : `src/petanque/TerrainRenderer.js` methode `_drawSurface()`

2. **Bordures 9-slice** : Integrer `border_wood/stone_9slice.png`
   - Remplacer le rendu Graphics par des sprites tiles
   - Fichier : `src/petanque/TerrainRenderer.js` methode `_drawBorders()`

3. **Decors sprites** : Integrer `decor_pin/olivier/banc/fontaine.png`
   - Charger dans BootScene.js
   - Placer dans `_drawBackgroundDecor()` en remplacement de certains Graphics
   - Fichier : `src/petanque/TerrainRenderer.js`

### PRIORITE 2 — Ameliorer les sprites personnages
Les sprites PixelLab sont corrects mais peuvent etre ameliores :

1. **Bounce animation** : Ajouter 1px de bounce vertical dans le walk cycle
   - Modifier frame 1 et 3 de chaque direction (y -= 1px)
   - Outil : Pixelorama (gratuit) ou Aseprite (16.79EUR)
   - Tuto : research/26_pixelorama_aseprite_pixel_art.md

2. **Nouvelles animations** : idle breathing, lancer de boule, celebration
   - Necessite d'etendre les spritesheets de 4x4 a 4x8 (32 frames)
   - Modifier BootScene.js frameWidth/frameHeight

3. **Coherence de style** : Les 6 persos ont des styles legerement differents
   - Utiliser PixelLab bitforge avec style_image de reference
   - Script : `scripts/regen-characters.mjs` et `scripts/animate-from-image.mjs`

### PRIORITE 3 — Features manquantes
1. **Mode Versus local** (2 joueurs clavier split)
2. **Progression/deblocages** (SaveManager + progression.json)
3. **Personnage verrouille** (6eme slot dans CharSelect)
4. **Portraits HD** pour CharSelect (128x128 via PixelLab pixflux)

### PRIORITE 4 — Polish
1. **Transitions scenes** : fade-in/out entre les scenes
2. **Tutoriel** : mini-tutoriel lors de la premiere partie
3. **Camera follow** : camera suit la boule pendant le vol
4. **Effets particules** : poussiere a l'impact, confettis victoire

---

## Fichiers cles a lire

| Fichier | Role | Lignes |
|---------|------|--------|
| CLAUDE.md | Bible technique du projet | ~150 |
| GAME_DESIGN.md | Bible game design | ~400 |
| src/petanque/PetanqueEngine.js | Moteur de jeu (coeur) | ~1150 |
| src/petanque/Ball.js | Physique des boules | ~270 |
| src/petanque/AimingSystem.js | Systeme de visee | ~600 |
| src/petanque/PetanqueAI.js | IA adversaire | ~200 |
| src/petanque/TerrainRenderer.js | Rendu terrain procedural | ~1410 |
| src/scenes/PetanqueScene.js | Scene de jeu principale | ~500 |
| src/scenes/CharSelectScene.js | Selection personnage | ~370 |
| src/scenes/QuickPlayScene.js | Configuration partie rapide | ~600 |
| src/ui/ScorePanel.js | Panneau score + ranking TAB | ~280 |
| src/utils/Constants.js | Toutes les constantes | ~200 |
| src/data/characters.json | Stats des 6 personnages | - |
| src/data/terrains.json | Config des 5 terrains | - |
| src/data/boules.json | Config des boules | - |

## Scripts utiles

```bash
node scripts/regen-characters.mjs [nom]       # Regenerer sprites via PixelLab API
node scripts/animate-from-image.mjs <img> <nom> # Animer une image en spritesheet
node scripts/create-pixel-assets.mjs            # Regenerer boules/terrains/decors
```

## MCP Servers

- **PixelLab** : `.mcp.json` → API generation sprites IA (endpoint REST, pas MCP direct)
  - Fonctionne via Node.js `https.request()` (curl timeout sur Windows)
  - Cle API dans `.mcp.json` : Bearer token

- **ElevenLabs** : `.mcp.json` → SFX generation (uvx elevenlabs-mcp)

## Research disponible

| Fichier | Sujet |
|---------|-------|
| research/26_pixelorama_aseprite_pixel_art.md | Guide complet outils pixel art + techniques |
| research/PUBLISHING_GUIDE.md | Publication stores (PWA, Capacitor, Electron) |
| research/28_infrastructure_scalabilite.md | Infrastructure scaling |

## Regles importantes (CLAUDE.md)

- Pixel art pixelated, jamais de lissage
- Tile size 32x32, sprites persos 32x32
- Resolution 832x480, scale 2x
- Physique custom, PAS de Matter.js
- Jamais de noir pur (#000) → #3A2E28
- Palette provencale : ocres, terracotta, olive, lavande, ciel, creme
- Terrain propre en jeu : pas d'indicateurs visuels permanents, [TAB] pour le classement
