---
name: tileset
description: Generate a 32x32 pixel art tileset using PixelLab MCP for Petanque Master maps. Use when creating terrain, buildings, or environment tiles.
user-invocable: true
argument-hint: "[tileset-name] [biome: village|route|plage|parc|place]"
allowed-tools: Bash, Read, Write, Edit, Glob
---

# Generate Tileset

Generate a 32x32 pixel art tileset for **Petanque Master** maps using PixelLab MCP.

## Input

- Tileset name: first argument
- Biome/context: second argument (village, route, plage, parc, place)

## Art Style Constraints (STRICT)

- **Tile size** : 32x32 pixels (migre depuis 16x16)
- **Generation** : 64x64 via PixelLab, downscale 2x nearest-neighbor -> 32x32
- **Palette provencale** : ocres, terracotta, olive, lavande, ciel, creme
- **Ombres** : #3A2E28 — JAMAIS de noir pur
- **Style** : pixel art retro, top-down RPG, Pokemon GBA ameliore
- **Output** : PNG tileset grid (32x32 tiles arranged in rows)

## Biome Guidelines

### village
- Murs pierre creme/beige, toits terracotta orange-rouge
- Portes bois marron, fenetres bleues volets
- Sol : paves gris chaud, chemin terre battue
- Vegetation : platanes, oliviers, lavande, pots de fleurs

### route
- Chemin terre battue (ocre)
- Herbe verte olive, fleurs sauvages
- Arbres (chenes, pins parasol), buissons
- Barrieres bois, panneaux direction
- Eau (riviere, mare) bleu provencal

### plage
- Sable creme/dore
- Eau turquoise/bleu clair
- Rochers gris chaud
- Parasols colores, chaises longues
- Palmiers, tamaris

### parc
- Herbe entretenue (vert vif)
- Bancs, fontaine, lampadaires
- Haies taillees, parterres fleuris
- Chemin gravier fin

### place
- Dalles de pierre (gris chaud, motifs)
- Fontaine centrale
- Platanes, terrasses cafe
- Auvents colores (rouge, bleu, jaune)

## Steps

1. Call PixelLab MCP to generate each tile at 64x64:
   - `image_size: {width: 64, height: 64}`
   - Style: "pixel art, top-down, provencal, Mediterranean"

2. Downscale 2x nearest-neighbor -> 32x32

3. Assemble into tileset grid

4. Save to: `assets/tilesets/$NAME_$BIOME.png`

5. Verify: tiles are exactly 32x32 aligned, no anti-aliasing artifacts

6. Report: file path, grid dimensions, tile count

## Example

```
/tileset base village
/tileset terrain route
/tileset plage plage
/tileset place place
```
