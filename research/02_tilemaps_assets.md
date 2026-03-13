# Recherche Agent 2 : Tilemaps, Assets et Architecture Maps

## 1. Tiled Map Editor - Integration Web

### Workflow
1. Creer tileset image (PNG avec toutes les tuiles en grille)
2. Importer dans Tiled, peindre la map layer par layer
3. Exporter en JSON
4. Charger dans Phaser: `this.load.tilemapTiledJSON('map', 'map.json')`

### Structure JSON Tiled
```json
{
  "width": 40, "height": 30,
  "tilewidth": 16, "tileheight": 16,
  "layers": [
    { "name": "ground", "type": "tilelayer", "data": [1, 1, 2, 3, ...] },
    { "name": "buildings", "type": "tilelayer", "data": [0, 0, 12, 13, ...] },
    { "name": "collisions", "type": "tilelayer", "data": [0, 0, 1, 1, ...] },
    { "name": "npcs", "type": "objectgroup", "objects": [
      { "name": "Marcel", "x": 128, "y": 256, "properties": {...} }
    ]}
  ],
  "tilesets": [{ "firstgid": 1, "image": "tileset.png", ... }]
}
```

### Settings recommandes pour Tiled
- Tile size: 16x16 pixels
- Orientation: Orthogonal
- Render order: Right-Down
- Export: JSON

### Phaser integration
- `this.load.tilemapTiledJSON()` charge nativement
- Supporte: layers multiples, object layers, tiles animees
- `createLayer()`, `setCollisionByProperty()`, `createFromObjects()`

## 2. Tilesets gratuits

### Top recommandations
1. **Ninja Adventure** (itch.io, CC0) - Massive, complet: tilesets, persos, items, UI, musique. 16x16. Public domain.
2. **Serene Village par LimeZu** (itch.io) - Moderne, top-down RPG, proche Pokemon. 16x16. Free version dispo.
3. **Overworld tileset par Shade** (OpenGameArt) - Style Pokemon: herbe, chemins, eau, arbres, maisons. CC-BY/CC0.
4. **RPG Nature Tileset par Stealthix** (OpenGameArt) - Nature 16x16. Bon pour les routes.
5. **Modern Interiors/Exteriors par LimeZu** (itch.io) - Haute qualite, free starter packs.

### Sites de reference
- OpenGameArt.org : "RPG tileset 16x16" - centaines d'options
- itch.io : "free RPG tileset pixel art"
- kenney.nl : CC0 haute qualite

### Licences
- CC0 (public domain) et CC-BY (credit requis) = safe
- Eviter CC-NC si monetisation envisagee

### Note theme provencal
Il faudra customiser: toits terracotta, platanes, terrains petanque, terrasses cafe. Partir d'un tileset de base et ajouter des tuiles custom.

## 3. Sprite Sheets - Format Standard

### Layout walk cycle 4 directions
```
Row 0: Walk DOWN  - frame1, frame2, frame3, frame4
Row 1: Walk LEFT  - frame1, frame2, frame3, frame4
Row 2: Walk RIGHT - frame1, frame2, frame3, frame4
Row 3: Walk UP    - frame1, frame2, frame3, frame4
```

### Conventions
- 3 ou 4 frames par direction (Pokemon GBA = 3: stand, step-left, step-right)
- 4 frames donne une animation plus smooth
- Idle = frame 0 de chaque row
- Vitesse animation: ~150-200ms par frame
- Taille sprite: 16x16 ou 16x24 (plus grand que 1 tile pour les personnages)
- Sprite sheet complet: 64x64 (4x4 a 16x16) ou 64x96 (4x4 a 16x24)

## 4. Taille des maps

### Tailles recommandees par zone
| Type de zone | Taille (tiles) | Taille (px a 16px) |
|-------------|---------------|-------------------|
| Village/Ville | 30x30 a 50x50 | 480x480 a 800x800 |
| Route (chemin) | 20x60 a 30x80 | 320x960 a 480x1280 |
| Interieur arene | 20x20 a 30x30 | 320x320 a 480x480 |
| Zone speciale | 40x40 a 60x60 | 640x640 a 960x960 |

### Approche A: Une grande map (simple)
- 200x200 a 300x300 tiles, zones dans le meme fichier
- Transitions seamless, pas de loading
- Performance OK (on ne render que le viewport ~20x15 tiles)

### Approche B: Maps separees par zone - RECOMMANDE
- Chaque zone = son propre JSON
- Plus facile a editer individuellement dans Tiled
- Aligne avec l'approche Pokemon (chaque route/ville = map separee)
- Transition: fade ou slide entre zones
- 40x40 a 60x60 tiles par zone

### Performance
- 300 tiles visibles = trivial pour Canvas (<1ms par frame)
- Tileset PNG < 100KB
- Chaque map JSON = 5-50KB
- Total assets maps + tilesets < 1MB
- Optim: pre-render layers statiques sur offscreen canvas

## 5. Systeme de collisions

### Methode recommandee: Layer collision invisible
1. Layer "collisions" dans Tiled avec 2 tuiles: vide (0=walkable) et solide (1=bloque)
2. Peindre sur les murs, eau, arbres, batiments
3. Layer JAMAIS renderee, data only
4. En code: `if (collisionLayer[y * mapWidth + x] !== 0) { blocked = true; }`

### Stacking des layers (setup Tiled)
1. `ground` - herbe, terre, eau (render en premier)
2. `ground_detail` - fleurs, flaques, bords de chemin
3. `buildings` - murs, toits, objets
4. `above_player` - canopees d'arbres, surplombs (render APRES le sprite joueur)
5. `collisions` - data invisible
6. `events` - object layer pour PNJ, transitions zones, triggers

### Layer above_player
Important: cree la profondeur en rendant les cimes d'arbres ou arcades PAR-DESSUS le joueur.

## 6. PNJ et Detection

### Detection line-of-sight (style dresseurs Pokemon)
```javascript
function checkLineOfSight(npc, player, collisionData, mapWidth) {
    let dx = 0, dy = 0;
    if (npc.facing === 'down') dy = 1;
    else if (npc.facing === 'up') dy = -1;
    else if (npc.facing === 'left') dx = -1;
    else if (npc.facing === 'right') dx = 1;
    for (let i = 1; i <= npc.viewDistance; i++) {
        let checkX = npc.tileX + dx * i;
        let checkY = npc.tileY + dy * i;
        if (collisionData[checkY * mapWidth + checkX] !== 0) break;
        if (checkX === player.tileX && checkY === player.tileY) return true;
    }
    return false;
}
```
- Chaque PNJ a `facingDirection` + `viewDistance` (3-5 tiles)
- Detection = raycast dans la direction regardee
- Si mur entre PNJ et joueur: pas de detection

### NPC marche vers joueur
- Pas besoin d'A* : detection en ligne droite, donc marche en ligne droite
- Move tile par tile dans la facing direction jusqu'a adjacent au joueur

### NPC idle/patrol
- Timer 2-5s (random), pick direction random
- Si next tile walkable: move. Sinon: rester ou choisir autre direction.
- Certains PNJ stationnaires (juste changent de direction)

### Donnees PNJ dans Tiled (object layer)
```json
{
  "name": "Marcel", "type": "trainer",
  "x": 128, "y": 256,
  "properties": {
    "facing": "down", "viewDistance": 4,
    "defeated": false,
    "dialogue_before": "Je vais te montrer!",
    "dialogue_after": "Bien joue...",
    "difficulty": "easy"
  }
}
```

## 7. Projets open-source de reference

1. **pokered (github.com/pret/pokered)** - Desassemblage Pokemon Red/Blue, reference pour maps/NPC/events
2. **RPG JS (rpgjs.dev)** - Framework open-source pour RPG style Pokemon en web, Tiled natif
3. **Kaetram (github.com/Kaetram/Kaetram-Open)** - MMO HTML5 top-down, reference architecture
4. **PhaserQuest** - Zelda/Pokemon avec Phaser, bonne ref Tiled + Phaser

### Pattern d'architecture commun
```
Game
  |-- SceneManager
  |     |-- TitleScene / OverworldScene / BattleScene / DialogScene
  |-- MapManager (load/render Tiled JSON)
  |     |-- TileRenderer / CollisionChecker / ZoneTransitions
  |-- EntityManager
  |     |-- Player / NPCs[]
  |-- InputManager / Camera / SaveManager
```
