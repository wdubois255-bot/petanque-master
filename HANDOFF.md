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
- `src/utils/SoundManager.js` : 10 sons proceduraux Web Audio (boule-boule, landing, roulement, carreau, throw, victory, defeat, score, UI click)
- Particules : dust landing (6, couleur terrain), collision sparks (5 blancs), rolling trail
- Camera : zoom dramatique 1.08x quand boule ralentit pres cochonnet
- Stats boules : boules.json (masse, rayon, friction) integre dans gameplay
- UI combinee : 1 ecran (ROULETTE | DEMI-PORTEE | PLOMBEE | TIRER)
- Squash flash sur collisions (ring blanc 6 frames)

**Recherche approfondie (15 mars 2026) : 21 fichiers dans research/**
- Voir `research/README.md` pour l'index complet

### Tests Playwright (TOUS PASSENT - dans /tests/)
```bash
node tests/test-sprint3.mjs    # Sprint 3 flow complet (PASS)
node tests/test-game.mjs       # Moteur petanque (0 erreurs)
```

## PRIORITE PROCHAINE SESSION : SCENE PETANQUE BELLE

Le plan detaille est dans `research/20_plan_amelioration_scene_petanque.md`.

### Ce qu'il faut faire (6 priorites)
1. **Terrain riche** : fond ciel Provence, texture gravier, bordures bois, platanes, banc, muret
2. **Boules realistes** : gradient radial 3D, ombre portee decalee, reflet metallique, stries
3. **Camera cinematique** : follow boule en vol, slow-mo pres cochonnet, pan entre cercle et zone d'impact
4. **Joueurs realistes** : adversaire accroupi PRES DU COCHONNET (pas loin), reactions (joie/deception)
5. **Ambiance** : cigales (boucle), brise, musique chiptune fond
6. **Effets** : traces au sol permanentes, ombre coherente, feuilles

### Infos cles pour la scene (dans research/)
- `research/18_scene_petanque_visuelle.md` : disposition reelle du terrain, positions joueurs, atmosphere
- `research/19_legendes_petanque.md` : legendes corrigees (Quintais=complet, 14 titres)
- `research/13_gameplay_petanque_game_design.md` : game design, moments dramatiques, erreurs a eviter
- `research/14_phaser3_polish_techniques.md` : techniques camera/particules/tweens Phaser 3

### Point crucial : position des joueurs
En vrai, les adversaires se tiennent **pres du cochonnet** (pas dans une zone d'attente loin).
Le lanceur est seul au cercle. Tout le monde regarde depuis la zone cochonnet.
C'est ca qui rend la scene immersive.

## AUSSI EN ATTENTE

### Vrais sprites PixelLab
Les sprites canvas sont temporaires. Workflow documente dans `research/17_pixellab_spritesheet_workflow.md`.
- MCP PixelLab configure dans `.mcp.json`
- Skills `/sprite` et `/tileset` prets
- $10 credits PixelLab

### Contenu additionnel
- Route 2 + Arene 2 (Fanny, herbe)
- Route 3 + Arene 3 (Ricardo, sable)
- SFX ElevenLabs (skill `/sfx` pret)
- Musique chiptune

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
| `research/20_plan_amelioration_scene_petanque.md` | **PLAN PROCHAINE SESSION** |
| `src/utils/Constants.js` | Epicentre (832x480, tiles 32) |
| `src/utils/SoundManager.js` | Sons proceduraux Web Audio |
| `src/scenes/PetanqueScene.js` | Scene combat (a ameliorer) |
| `src/petanque/PetanqueEngine.js` | Moteur + SFX + particules + zoom |
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
