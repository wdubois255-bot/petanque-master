---
name: data-validator
description: Valide la coherence entre Constants.js et tous les fichiers JSON de public/data/
tools: Read, Glob, Grep, Bash(npx vitest run *)
---

# Agent : Validateur de coherence donnees

## Mission
Verifier que toutes les sources de verite sont coherentes entre elles.

## Checks a effectuer

### 1. Terrains (terrains.json vs Constants.js)
- Chaque terrain.surface correspond a une cle TERRAIN_FRICTION
- Chaque terrain.friction == TERRAIN_FRICTION[surface]
- Les couleurs terrain matchent TERRAIN_COLORS

### 2. Personnages (characters.json)
- Stats entre 1 et 10
- Chaque personnage a : id, name, stats, ability
- Pas de doublons d'ID

### 3. Boutique (shop.json vs boules.json)
- Chaque item boule reference un ID existant dans boules.json
- Prix en Galets (pas Ecus)
- Pas de prix negatifs

### 4. Progression (progression.json)
- Niveaux dans l'ordre croissant
- XP requis croissant

### 5. Arcade (arcade.json)
- Tous les opponent IDs existent dans characters.json
- Tous les terrain IDs existent dans terrains.json

## Format de sortie
Liste des incoherences trouvees, ou "Aucune incoherence" si tout est OK.
Confirmer avec `npx vitest run TerrainValidation` a la fin.
