# Recherche Agent 3 : Outils, MCP, Bibliotheques, Assets

## 1. MCP Servers pour Game Dev

### Image/Sprite generation
- **@anthropic/mcp-server-replicate** : Replicate API, acces a Stable Diffusion, SDXL, pixel-art-xl
- **mcp-server-dalle** : Community, wraps DALL-E API
- **mcp-server-stability** : Stability AI (SD3)

### Filesystem/Assets
- **@anthropic/mcp-server-filesystem** : read/write fichiers
- **@anthropic/mcp-server-github** : gestion repos

### Audio
- Pas de MCP dedie son en mai 2025
- Utiliser Replicate MCP avec modeles audio (MusicGen, AudioCraft)

### Recommandation
Le plus pratique = **Replicate MCP server** (pixel art, spritesheets, audio via differents modeles).

## 2. Bibliotheques JavaScript/TypeScript

### Audio
- **howler.js** : gold standard audio web. Sprites, spatial audio, Web Audio + fallback HTML5. `npm install howler`
- **Tone.js** : synthese audio avancee, bon pour sons proceduraux
- **pizzicato.js** : Web Audio API simplifie avec effets

### Animation/Tweening
- **GSAP** : leader industrie animation. Gratuit la plupart des usages. `npm install gsap`
- **tween.js (@tweenjs/tween.js)** : leger, se marie bien avec Phaser
- **anime.js** : leger, API clean
- **popmotion** : fonctionnel, alimente Framer Motion

### Tilemaps
- Phaser built-in Tiled support (.tmj/.json)
- **rot.js** : toolkit roguelike avec generation maps (BSP, cellular automata), FOV, pathfinding, RNG

### Particules
- **proton.js** : moteur particules complet Canvas/WebGL
- **tsparticles** : systeme configurable
- **Phaser 3 built-in particles** : `this.add.particles()` - suffisant pour nos besoins

### UI pour jeux (menus/dialogues)
- **rexUI (phaser3-rex-plugins)** : HAUTEMENT RECOMMANDE. Suite massive pour Phaser 3: dialog boxes, text input, scroll panels, sliders, boutons, grids, toast. `npm install phaser3-rex-plugins`
- **phaser3-nineslice** : nine-slice scaling pour UI panels
- **dat.GUI / lil-gui** : debug UI pour tweaker parametres en dev

## 3. Outils Python (Pipeline Build)

### Sprite Sheets
- **Pillow (PIL)** : manipulation images. Combiner sprites, resize, palette swap. `pip install Pillow`
- **TexturePacker CLI** : commercial (free tier). Optimise packing, output Phaser JSON Atlas
- **free-tex-packer-core** : open source (Node.js), output Phaser JSON Atlas
- **rectpack** : bin-packing Python pour sprite sheets custom. `pip install rectpack`

### Generation maps
- **noise (pynoise)** : Perlin/Simplex noise pour terrain. `pip install noise`
- **opensimplex** : OpenSimplex pur Python. `pip install opensimplex`
- **Pillow + numpy** : generer tilemap data en 2D arrays, export JSON
- **pytmx** : lire/ecrire fichiers Tiled .tmx. `pip install pytmx`

### Autres
- **pydub** : manipulation audio (trim, combine, convert). `pip install pydub`
- **cairosvg** : SVG vers PNG. `pip install cairosvg`

## 4. Generateurs/Outils Assets Gratuits

### Editeurs Pixel Art (gratuits)
- **Piskel** : en ligne, animation support. piskelapp.com
- **Libresprite** : fork gratuit Aseprite. Complet: animation, layers, onion skinning.
- **Pixelorama** : open source, fait en Godot. Animation, layers, tilemaps.
- **Lospec Pixel Editor** : en ligne. lospec.com/pixel-editor
- **GrafX2** : classique, open source
- **GIMP** : generaliste mais configurable pour pixel art

### Editeurs Tilemaps
- **Tiled** : le standard. Gratuit, open source. mapeditor.org
- **LDtk** : moderne, par le createur de Dead Cells. Gratuit, export JSON, integration Phaser. ldtk.io
- **Tilesetter** : auto-tiling (version gratuite)

### Generateurs sons
- **jsfxr** : browser, parfait pour sons retro. sfxr.me
- **ChipTone** : en ligne, plus d'options que jsfxr. sfbgames.itch.io/chiptone
- **Bfxr** : desktop, version etendue de sfxr
- **LabChirp** : generateur gratuit

### Generateurs musique
- **Beepbox** : compositeur chiptune en ligne. beepbox.co
- **Bosca Ceoil** : par Terry Cavanagh. Facile, gratuit.
- **FamiStudio** : editeur musique NES, export WAV/MP3. Gratuit.
- **LMMS** : DAW complet gratuit (comme FL Studio)
- **Abundant Music** : generateur procedural

### IA pour sprites
- **PixelLab** : generation pixel art IA
- **Stable Diffusion + pixel-art LoRAs** : modele `nerijs/pixel-art-xl` sur Replicate ou ComfyUI local
- **Midjourney / DALL-E 3** : avec prompt "16-bit pixel art style, top-down RPG sprite sheet"
- **Scenario.gg** : IA specialisee game art, consistance visuelle

## 5. Packages npm specifiques

### Pathfinding
- **pathfinding** : A*, Dijkstra, BFS, bi-directional. Grid-based. `npm install pathfinding`
- **easystarjs** : A* async, concu pour jeux. `npm install easystarjs`
- **javascript-astar** : A* pur, leger
- Rex plugins inclut aussi pathfinding pour board games

### State Machines
- **xstate** : statecharts complets. Excellent pour game states, AI, UI flow. `npm install xstate`
- **javascript-state-machine** : FSM simple. `npm install javascript-state-machine`
- **stately.ai** : editeur visuel qui exporte XState

### Dialogue
- **bondage.js** : parser format Yarn Spinner. Branches, variables, conditions. `npm install bondage.js`
- **yarn-bound** : runtime Yarn Spinner mis a jour. `npm install yarn-bound`
- **inkjs** : port JS de Ink (Inkle, createurs de 80 Days). `npm install inkjs`

## 6. Ressources Assets Gratuits en Ligne

### Sites generaux
- **OpenGameArt.org** : enorme, sprites/tilesets/musique/sons. CC0/CC-BY.
- **itch.io Game Assets** : massive collection free/paid. Filtrer par free.
- **Kenney.nl** : CC0 haute qualite (2D, 3D, UI, audio)
- **Game-icons.net** : 4000+ icones jeu en SVG gratuit

### Style Pokemon/RPG
- **itch.io "pokemon tileset"** : Monster Tamer Tileset (original pour eviter copyright)
- **itch.io free top-down tileset** : filtrer tag top-down + tileset
- **OpenGameArt "RPG tileset"** : LPC (Liberated Pixel Cup) assets 32x32 CC-BY/CC-BY-SA
- **RPG Maker tilesets** : certains gratuits, verifier licences

### Son & Musique
- **Freesound.org** : base collaborative CC sons
- **Incompetech (Kevin MacLeod)** : musique royalty-free CC-BY
- **Mixkit** : sons et musique gratuits

## 7. Stack recommandee finale

1. **Core** : Phaser 3 + phaser3-rex-plugins (UI, board, dialogues)
2. **Audio** : howler.js ou Phaser built-in
3. **Pathfinding** : easystarjs
4. **State** : xstate pour complexe, ou Phaser SceneManager pour simple
5. **Dialogue** : yarn-bound ou inkjs
6. **Maps** : Tiled ou LDtk, export JSON
7. **Pixel art** : Piskel (online) ou Libresprite (desktop)
8. **Sons** : jsfxr / ChipTone
9. **Musique** : Beepbox
10. **Build pipeline** : Python Pillow + rectpack pour sprite sheets
11. **Assets base** : Kenney.nl pour placeholders, itch.io pour tilesets Pokemon-style
