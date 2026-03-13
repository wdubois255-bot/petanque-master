---
name: tileset
description: Generate a 16x16 pixel art tileset using PixelLab MCP for Petanque Master maps. Use when creating terrain, buildings, or environment tiles.
user-invocable: true
argument-hint: "[tileset-name] [biome: village|route|plage|parc|place]"
allowed-tools: Bash, Read, Write, Edit, Glob
---

# Generate Tileset

Generate a 16x16 pixel art tileset for **Petanque Master** maps using PixelLab MCP.

## Input

- Tileset name: first argument
- Biome/context: second argument (village, route, plage, parc, place)

## Art Style Constraints (STRICT)

- **Tile size** : 16x16 pixels, ALWAYS
- **Palette provencale** : ocres, terracotta, olive, lavande, ciel, creme
- **Ombres** : #3A2E28 — JAMAIS de noir pur
- **Style** : pixel art retro, top-down RPG, Pokemon GBA
- **Output** : PNG tileset grid (16x16 tiles arranged in rows)

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

1. Call PixelLab MCP "create tileset" tool:
   - Inner/outer tiles according to biome
   - Wang tileset or 3x3 tileset for seamless edges
   - 16x16 pixels per tile
   - Style: "pixel art, top-down, provencal, Mediterranean"

2. Save to: `assets/tilesets/$NAME_$BIOME.png`

3. Verify: tiles are exactly 16x16 aligned, no anti-aliasing artifacts

4. Report: file path, grid dimensions, tile count

## Example

```
/tileset base village
/tileset terrain route
/tileset plage plage
/tileset place place
```
