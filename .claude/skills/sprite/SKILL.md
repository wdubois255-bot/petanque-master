---
name: sprite
description: Generate a pixel art game sprite using PixelLab MCP for Petanque Master. Use when creating characters, NPCs, UI elements, or game objects.
user-invocable: true
argument-hint: "[character-name]"
allowed-tools: Bash, Read, Write, Edit, Glob
---

# Generate Pixel Art Sprite

Generate a pixel art sprite for **Petanque Master** using the PixelLab MCP server.

## Input

- Character/object name: `$ARGUMENTS`

## Sizes (STRICT - post migration 32x32)

- **Characters** : generes en 64x64 via PixelLab, puis downscale 2x nearest-neighbor -> 32x32
- **Objects/UI** : generes en 64x64 via PixelLab, downscale -> 32x32
- **Spritesheet** : 128x128 (4 frames x 4 directions, chaque frame 32x32)

## Art Style Constraints (STRICT)

These are mandatory for visual consistency:

- **Palette provencale** : ocres (#D4A574), terracotta (#C4854A), olive (#6B8E4E), lavande (#9B7BB8), ciel (#87CEEB), creme (#F5E6D0)
- **Ombres chaudes** : #3A2E28 — JAMAIS de noir pur (#000000)
- **Style** : pixel art retro, caricatural mais attachant, ambiance sud de la France
- **Personnages** : 32x32 pixels (1 tile), style Pokemon GBA ameliore
- **Objets** : 32x32 pixels
- **Transparence** : fond transparent PNG

## Workflow PixelLab

1. **generate-image-pixflux** : generer 64x64 face sud
   - `image_size: {width: 64, height: 64}`
   - `no_background: true`
   - `view: "top-down"`
   - `direction: "south"`
   - `style: "pixel art, top-down RPG, Pokemon GBA style, provencal theme, warm colors"`

2. **/rotate** : generer les 3 autres directions (est, ouest, nord)
   - `from_direction: "south"` -> `to_direction: "east"/"west"/"north"`

3. **/animate-with-text** : generer 4 frames de marche par direction
   - `action: "walking"`
   - `n_frames: 4`

4. **Downscale** : `sharp` nearest-neighbor 2x (64->32)
   - `node -e "const sharp = require('sharp'); ..."`

5. **Assembler** spritesheet 128x128 (4 cols x 4 rows)

6. Save to: `assets/sprites/$ARGUMENTS.png`

## Spritesheet Layout

- Row 0: Walk DOWN (4 frames, 32x32 each)
- Row 1: Walk LEFT (4 frames)
- Row 2: Walk RIGHT (4 frames)
- Row 3: Walk UP (4 frames)

## Character Reference

Key characters for this game:
- **joueur** : polo bleu, pantalon khaki, cheveux bruns
- **papet** : beret bleu, moustache grise, chemise mauve, cheveux clairsemes
- **marcel** : casquette, cheveux blancs en bataille, polo rouge, CHAINE EN OR
- **bastien** : cheveux blonds spiky, yeux bleus, tenue sombre, smirk arrogant
- **fanny** : cheveux auburn, tenue verte, chapeau
- **ricardo** : lunettes de soleil, peau bronzee, chemise lin blanc
- **marius** : barbe blanche, chaine en or, cheveux en bataille, tenue royale sombre
- **villageois** : provencaux varies
- **dresseur** : casquette rouge, chemise jaune

## Example

```
/sprite marcel
/sprite joueur
/sprite boule-acier
/sprite cochonnet
```
