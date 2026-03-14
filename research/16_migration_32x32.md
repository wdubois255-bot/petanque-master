# Recherche : Migration 16x16 -> 32x32 tiles

## Analyse d'impact - Fichiers a modifier

### 1. Constants.js (EPICENTRE)
- `GAME_WIDTH` : 416 -> 832
- `GAME_HEIGHT` : 240 -> 480
- `TILE_SIZE` : 16 -> 32
- `TERRAIN_WIDTH` : 90 -> 180 (doubler)
- `TERRAIN_HEIGHT` : 210 -> 420 (doubler)
- `COCHONNET_MIN_DIST` : 100 -> 200
- `COCHONNET_MAX_DIST` : 170 -> 340
- `BALL_RADIUS` : 5 -> 10
- `COCHONNET_RADIUS` : 2 -> 4
- `THROW_CIRCLE_RADIUS` : 8 -> 16
- `THROW_CIRCLE_Y_OFFSET` : 10 -> 20
- `DEAD_ZONE_PX` : 15 -> 30
- `CARREAU_THRESHOLD` : 8 -> 16
- `CARREAU_DISPLACED_MIN` : 16 -> 32
- `PREDICTION_DOT_RADIUS` : 1 -> 2

### 2. config.js
- Utilise GAME_WIDTH/GAME_HEIGHT de Constants -> auto

### 3. SpriteGenerator.js (REWRITE)
- `SPRITE_W` : 16 -> 32
- `SPRITE_H` : 24 -> 32 (on passe en carre pour PixelLab)
- Toutes les positions pixel dans drawCharacter() -> x2
- MIEUX : charger des PNG PixelLab au lieu de canvas

### 4. TilesetGenerator.js (REWRITE)
- Utilise TILE_SIZE de Constants -> mais tous les dessins internes sont en dur 16px
- Tout le code de dessin doit etre adapte pour 32px
- MIEUX : charger des PNG PixelLab au lieu de canvas

### 5. Player.js
- Offset `-4` dans position : `TILE_SIZE / 2 - 4` -> ajuster
- Utilise TILE_SIZE de Constants -> auto pour les grids
- Mais offset sprite doit etre ajuste

### 6. NPC.js
- Meme offsets que Player.js

### 7. MapManager.js
- Utilise TILE_SIZE pour tilemaps -> auto
- Les maps procedurales (30x30 etc) gardent le meme nombre de tiles
- Le monde est 2x plus grand en pixels

### 8. PetanqueScene.js
- Utilise GAME_WIDTH/GAME_HEIGHT/TERRAIN_* de Constants -> auto
- Positions sprites : ajuster

### 9. AimingSystem.js
- Hardcoded positions UI (baseY, boutons loft)
- Utilise GAME_WIDTH/GAME_HEIGHT -> auto pour certains

### 10. ScorePanel.js
- `panelX = GAME_WIDTH - 72` -> ajuster
- Positions textes hardcodees

### 11. DialogBox.js
- Utilise GAME_WIDTH/GAME_HEIGHT -> auto
- Font sizes pourraient avoir besoin d'ajustement

### 12. TitleScene.js / IntroScene.js / BootScene.js
- Utilisent GAME_WIDTH/GAME_HEIGHT -> auto
- Font sizes et positions Y hardcodees -> ajuster

### 13. index.html / CSS
- Pas de changement (Phaser scale FIT gere tout)

## Strategie de migration

### Option choisie : resolution interne doublee (832x480)
- Meme champ de vision : 26x15 tiles
- Sprites 32x32 natifs -> PixelLab
- Tiles 32x32 -> PixelLab ou canvas ameliore
- Scale x2 en FIT -> 1664x960 (ou x1.5 pour ecrans plus petits)
- `pixelArt: true` + integer scaling preserved

### Approche recommandee
1. Modifier Constants.js (tout x2 sauf les ratios)
2. Adapter SpriteGenerator -> charger PNG PixelLab
3. Adapter TilesetGenerator -> charger PNG PixelLab ou x2 les dessins
4. Ajuster les offsets hardcodes dans Player, NPC
5. Ajuster les positions UI hardcodees (fonts, panels)
6. Font sizes : x2 pour garder la meme lisibilite relative
7. Tester chaque scene une par une

### Points d'attention
- Les font sizes en pixels ne doublent PAS automatiquement
- Les positions absolues (pas en tiles) doivent etre ajustees
- La physique petanque fonctionne en pixels -> tout doubler
- Les maps procedurales gardent le meme nombre de tiles mais 2x plus grands en pixels
