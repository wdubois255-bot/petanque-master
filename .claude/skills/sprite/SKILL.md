---
name: sprite
description: Generate a pixel art game sprite using PixelLab MCP for Petanque Master. Use when creating characters, NPCs, UI elements, or game objects.
user-invocable: true
argument-hint: "[character-name] [optional: size 16x24|32x32]"
allowed-tools: Bash, Read, Write, Edit, Glob
---

# Generate Pixel Art Sprite

Generate a pixel art sprite for **Petanque Master** using the PixelLab MCP server.

## Input

- Character/object name: `$ARGUMENTS`
- Default size: 16x24 for characters, 16x16 for objects/tiles

## Art Style Constraints (STRICT)

These are mandatory for visual consistency:

- **Palette provencale** : ocres (#D4A574), terracotta (#C4854A), olive (#6B8E4E), lavande (#9B7BB8), ciel (#87CEEB), creme (#F5E6D0)
- **Ombres chaudes** : #3A2E28 — JAMAIS de noir pur (#000000)
- **Style** : pixel art retro, caricatural mais attachant, ambiance sud de la France
- **Personnages** : 16x24 pixels (1 tile large, 1.5 tiles haut), style Pokemon GBA
- **Objets** : 16x16 pixels
- **Transparence** : fond transparent PNG

## Steps

1. Call PixelLab MCP to generate the sprite with:
   - Size appropriate to the subject (16x24 characters, 16x16 objects)
   - Style: "pixel art, top-down RPG, Pokemon GBA style, provencal theme, warm colors"
   - Subject: the character/object name from arguments
   - If character: generate 4 directions (down, left, right, up) x 4 frames walk cycle
   - If object: generate single frame

2. Save output to: `assets/sprites/$ARGUMENTS.png`

3. If spritesheet (4 directions): ensure layout is:
   - Row 0: Walk DOWN (4 frames)
   - Row 1: Walk LEFT (4 frames)
   - Row 2: Walk RIGHT (4 frames)
   - Row 3: Walk UP (4 frames)

4. Report: file path, dimensions, what was generated

## Character Reference

Key characters for this game:
- **joueur** : young player, casual clothes, beret
- **marcel** : old man, casquette, mustache, pastis in hand
- **fanny** : fierce woman, sunhat, determined look
- **ricardo** : handsome guy, sunglasses, beach style
- **marius** : legend, white beard, gold boules, imposing
- **villageois** : generic provencal villagers (varied)
- **dresseur** : petanque players on routes (beret or casquette)

## Example

```
/sprite marcel
/sprite joueur 16x24
/sprite boule-acier 16x16
/sprite cochonnet 16x16
```
