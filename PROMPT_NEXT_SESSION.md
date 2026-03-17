# Prompt pour la prochaine session Claude

Copie-colle ce texte tel quel dans une nouvelle conversation Claude Code :

---

## Contexte

Tu reprends le projet **Petanque Master**, un jeu de petanque competitif en pixel art fait avec Phaser 3 + JavaScript + Vite.

**Lis ces fichiers dans cet ordre AVANT de faire quoi que ce soit :**
1. `CLAUDE.md` — Bible technique (conventions, stack, structure, regles)
2. `HANDOFF.md` — Etat complet du projet, ce qui est fait, ce qui reste
3. `GAME_DESIGN.md` — Bible game design (concept, persos, terrains, flow)

## Etat actuel (17 mars 2026)

Le jeu est **jouable** avec :
- 6 personnages (Rene, Marcel, Fanny, Ricardo, Thierry, Marius) avec stats uniques
- 5 terrains (Village, Plage, Parc, Colline, Docks) avec physique differente
- Mode Arcade (5 matchs + boss) et Partie Rapide
- Moteur physique realiste (COR 0.62, friction terrain, pentes, murs rebond)
- 4 techniques de lancer (roulette, demi-portee, plombee, tir au fer)
- IA avec personnalites (pointeur, tireur, stratege, complet)
- UI propre avec palette provencale (ocre/terracotta/lavande/ciel)
- Terrain de jeu PROPRE : aucun indicateur visuel permanent, [TAB] pour voir le classement des boules
- Sprites personnages upscales 2x en jeu
- Code audite et nettoye, zero dead code

## Nouveaux assets generes (pas encore integres dans le jeu)

Ces fichiers PNG existent dans `public/assets/sprites/` mais ne sont **pas encore utilises** par le code :

- `terrain_tex_terre.png`, `terrain_tex_herbe.png`, `terrain_tex_sable.png`, `terrain_tex_dalles.png` — Textures terrain seamless 64x64
- `border_wood_9slice.png`, `border_stone_9slice.png` — Bordures 9-slice 48x48
- `decor_pin.png`, `decor_olivier.png`, `decor_banc.png`, `decor_fontaine.png` — Decors provencaux

## Ce que tu dois faire (par ordre de priorite)

### PRIORITE 1 — Integrer les nouveaux assets dans le rendu terrain
1. Charger les textures terrain dans `src/scenes/BootScene.js`
2. Modifier `src/petanque/TerrainRenderer.js` methode `_drawSurface()` pour utiliser `this.add.tileSprite()` avec les textures au lieu de Graphics procedural
3. Integrer les bordures 9-slice dans `_drawBorders()`
4. Placer les decors sprites (pin, olivier, banc, fontaine) dans `_drawBackgroundDecor()`
5. Tester visuellement que tout est propre et lisible

### PRIORITE 2 — Ameliorer les sprites personnages
- Les sprites actuels sont generes par PixelLab (IA) — ils manquent de bounce et arm swing
- Ajouter 1px de bounce vertical aux frames 1 et 3 du walk cycle
- Possibilite de regenerer via `node scripts/regen-characters.mjs [nom]`
- Guide technique complet dans `research/26_pixelorama_aseprite_pixel_art.md`

### PRIORITE 3 — Features manquantes
- Mode Versus local (2 joueurs clavier split)
- Systeme de progression/deblocages (SaveManager.js + progression.json)
- Portraits HD 128x128 pour l'ecran de selection

### PRIORITE 4 — Polish
- Transitions fade-in/out entre scenes
- Camera follow sur la boule pendant le vol
- Particules poussiere a l'impact
- Mini-tutoriel premiere partie

## Regles CRITIQUES

- **Terrain propre** : JAMAIS d'indicateurs visuels permanents sur le terrain. Les boules et le cochonnet seulement. [TAB] pour le classement.
- **Pixel art** : `image-rendering: pixelated`, `imageSmoothingEnabled = false`. Jamais de noir pur (#000), toujours #3A2E28.
- **Palette** : Ocre #D4A574, Terracotta #C4854A, Lavande #9B7BB8, Olive #6B8E4E, Ciel #87CEEB, Creme #F5E6D0
- **Physique** : Custom, PAS de Matter.js. COR boule-boule 0.62, cochonnet 0.50.
- **Tile size** : 32x32 partout. Resolution 832x480.
- **Toujours commiter** apres chaque changement significatif. HANDOFF.md a jour.
- **Tester** dans le navigateur (`npm run dev`) apres chaque changement.

## Scripts utiles

```bash
npm run dev                                         # Serveur dev
node scripts/regen-characters.mjs [marcel|thierry|ricardo]  # Regenerer sprites PixelLab
node scripts/animate-from-image.mjs <image> <nom> 64       # Animer une image en spritesheet
node scripts/create-pixel-assets.mjs                        # Regenerer boules/textures/decors
```

## Fichiers cles

| Fichier | Quoi |
|---------|------|
| `src/petanque/PetanqueEngine.js` | Moteur coeur (1150 lignes) |
| `src/petanque/TerrainRenderer.js` | Rendu terrain (1410 lignes) — **C'EST ICI QU'IL FAUT INTEGRER LES ASSETS** |
| `src/petanque/Ball.js` | Physique boules |
| `src/petanque/AimingSystem.js` | Systeme de visee |
| `src/scenes/PetanqueScene.js` | Scene de jeu principale |
| `src/ui/ScorePanel.js` | Score + ranking TAB toggle |
| `src/utils/Constants.js` | Palette, constantes, CHAR_SPRITE_MAP |

## PixelLab API

- Config dans `.mcp.json` (Bearer token)
- L'API ne repond pas via `curl` sur Windows mais fonctionne via `https.request()` Node.js
- Endpoints : `/v1/generate-image-pixflux`, `/v1/rotate`, `/v1/animate-with-text`
- Voir `memory/reference_pixellab_api.md` pour la doc complete

---

Commence par lire CLAUDE.md, HANDOFF.md et GAME_DESIGN.md, puis attaque la Priorite 1.
