# HANDOFF - Petanque Master
> Document de reprise pour nouvelle session Claude Code. Derniere MAJ : 15 mars 2026.

## ETAT ACTUEL DU PROJET

### Ce qui est FAIT et FONCTIONNEL

**Sprint 0-3 + Sprint 3.5 : COMPLETS** (voir PLAN_MVP.md pour details)

**Migration 32x32 (15 mars 2026) : COMPLETE**
- Resolution 832x480 (26x15 tiles, 4x plus de detail)
- TILE_SIZE=32, tous les sprites/tiles/UI/positions doubles
- Tests Playwright PASS

**Game feel (15 mars 2026) : IMPLEMENTE**
- `src/utils/SoundManager.js` : 12 sons proceduraux Web Audio + cigales ambiance
- Particules : dust landing (6, couleur terrain), collision sparks (5 blancs), rolling trail
- Camera : zoom dramatique 1.08x + slow-mo 0.4x pres cochonnet
- Stats boules : boules.json (masse, rayon, friction) integre dans gameplay
- UI combinee : 1 ecran (ROULETTE | DEMI-PORTEE | PLOMBEE | TIRER)
- Squash flash sur collisions (ring blanc 6 frames)

**Sprint 4.0 - Scene petanque belle (15 mars 2026) : COMPLET**
- Fond ciel Provence gradient (#87CEEB→#B8D8EB) + sol terre seche + decor (platanes, banc, muret, table)
- Terrain CanvasTexture avec 200 cailloux aleatoires par type + bordures bois (#6B5038)
- Boules 3D : 5 textures CanvasTexture 32x32 (acier/bronze/chrome/opponent/cochonnet) gradient radial + reflet speculaire
- Ball.js utilise Sprites au lieu de Graphics, ombre ellipse decalee
- Camera cinematique : follow boule en vol (lerp 0.08), stopFollow + pan vers cochonnet, retour centre
- Slow-motion 0.4x quand boule lente pres cochonnet (delta * slowMotionFactor)
- Adversaire accroupi (scaleY 0.6) PRES DU COCHONNET, marche vers cercle pour lancer
- Reactions : saut si bon lancer (<30px), secoue tete si rate (>80px)
- Traces d'impact permanentes (RenderTexture.draw())
- Cigales procedurales (bruit module 4kHz, enveloppe 4Hz, boucle)
- SFX ameliores : 2eme harmonique boule-boule, crunch gravier landing, echo carreau

**Recherche approfondie (15 mars 2026) : 21 fichiers dans research/**
- Voir `research/README.md` pour l'index complet

### Tests Playwright (TOUS PASSENT - dans /tests/)
```bash
node tests/test-sprint3.mjs    # Sprint 3 flow complet (PASS)
node tests/test-game.mjs       # Moteur petanque (0 erreurs)
```

## PRIORITE PROCHAINE SESSION

### 1. Vrais sprites PixelLab
Les sprites canvas sont temporaires. Workflow documente dans `research/17_pixellab_spritesheet_workflow.md`.
- MCP PixelLab configure dans `.mcp.json`
- Skills `/sprite` et `/tileset` prets
- $10 credits PixelLab
- Generer 64x64, rotate, animate, downscale 2x → 32x32
- 10 personnages a generer

### 2. Contenu additionnel (Sprint 4 suite)
- Route 2 + Arene 2 (Fanny, herbe)
- Route 3 + Arene 3 (Ricardo, sable)
- SFX ElevenLabs (skill `/sfx` pret)
- Musique chiptune

### 3. Boucle d'addiction (research/23)
- Matches 3-4 min max
- Collection de boules (rarete variable)
- Carnet du bouliste (adversaires battus)
- Defeat screen encourageant + DDA subtil
- Details vivants (chat, linge, dialogues)

## COMMANDES

```bash
npm install          # Dependances
npm run dev          # Serveur dev -> http://localhost:8080
npm run build        # Build production
node tests/test-sprint3.mjs   # Test Sprint 3 (PASS)
node tests/test-game.mjs      # Test petanque (0 erreurs)
```

## FICHIERS CLES

| Fichier | Role |
|---------|------|
| `CLAUDE.md` | Conventions, stack, regles |
| `PLAN_MVP.md` | Plan complet 5 sprints |
| `LORE_PETANQUE.md` | Histoire petanque + mapping personnages (corrige) |
| `research/README.md` | Index des 21 fichiers de recherche |
| `src/utils/Constants.js` | Epicentre (832x480, tiles 32) |
| `src/utils/SoundManager.js` | Sons proceduraux + cigales |
| `src/scenes/PetanqueScene.js` | Scene combat (fond, decor, boules 3D, camera cine) |
| `src/petanque/Ball.js` | Boule avec sprites 3D + ombre |
| `src/petanque/PetanqueEngine.js` | Moteur + SFX + particules + zoom + traces |
| `.env` | Cles API (gitignored) |
| `.mcp.json` | MCP PixelLab + ElevenLabs |

## ARCHITECTURE

```
src/
  main.js / config.js      -> 832x480, Arcade, pixelArt
  scenes/                   -> Boot, Title, Intro, Overworld, Petanque
  entities/                 -> Player, NPC (32x32, origin 0.5)
  petanque/                 -> Ball, Cochonnet, Engine, AI, Aiming
  world/                    -> TilesetGen, SpriteGen, MapManager, NPCManager
  ui/                       -> DialogBox, ScorePanel
  utils/                    -> Constants, SaveManager, SoundManager
tests/                      -> 5 tests Playwright
research/                   -> 21 fichiers de recherche (voir README.md)
scripts/                    -> generate-sprite.mjs (PixelLab API)
public/data/                -> boules.json, npcs.json, progression.json
.claude/skills/             -> /sprite, /tileset, /sfx, /playtest, /build-assets
```

## PERSONNAGES (lore corrige)

| PNJ | Inspire de | Archetype |
|-----|-----------|-----------|
| Le Papet | Henri Lacroix (20 titres France, pointeur GOAT) | Mentor, pointeur |
| Marcel | Marco Foyot (showman, chaine or, 6 Marseillaise) | 1er maitre, terre |
| Bastien | Dylan Rocher (champion a 10 ans) | Rival, prodige |
| Fanny | Legende de Fanny (13-0) | 2e maitre, herbe |
| Ricardo | Philippe Suchaud (14 titres, tireur scientifique) | 3e maitre, sable |
| Grand Marius | Philippe Quintais (Le Roi, 14 titres, complet) + Fazzino | Boss final |
