# Prompt pour la prochaine session Claude

Copie-colle ce texte tel quel dans une nouvelle conversation Claude Code :

---

## Contexte

Tu reprends le projet **Petanque Master**, un jeu de pétanque compétitif en pixel art fait avec Phaser 3 + JavaScript + Vite.

**Lis ces fichiers dans cet ordre AVANT de faire quoi que ce soit :**
1. `CLAUDE.md` — Bible technique (conventions, stack, structure, règles)
2. `HANDOFF.md` — État complet du projet, ce qui est fait, ce qui reste
3. `PLAN_MVP.md` — Plan en 4 phases orienté lancement (v3, mis à jour 17 mars 2026)
4. `GAME_DESIGN.md` — Bible game design (concept, persos, terrains, flow)

## État actuel (17 mars 2026)

Le jeu est **jouable** avec :
- 6 personnages (René, Marcel, Fanny, Ricardo, Thierry, Marius) avec stats uniques
- 5 terrains (Village, Plage, Parc, Colline, Docks) avec physique différente
- Mode Arcade (5 matchs + boss) et Partie Rapide
- Moteur physique réaliste (COR 0.62, friction terrain, pentes, murs rebond)
- 4 techniques de lancer (roulette, demi-portée, plombée, tir au fer)
- IA avec personnalités (pointeur, tireur, stratège, complet)
- UI propre avec palette provençale (ocre/terracotta/lavande/ciel)
- Terrain de jeu PROPRE : aucun indicateur visuel permanent, [TAB] pour classement
- 12 SFX + 2 musiques
- Code audité et nettoyé, zero dead code

## Analyse marché (recherche mars 2026)

- **Zéro concurrent** en pétanque browser compétitive
- Cibles distribution : Poki (100M joueurs/mois), CrazyGames (30M), itch.io, Newgrounds
- Pixel art provençal dans la tendance 2026
- Format "fighting game × sport" unique et partageable

## Assets générés mais PAS ENCORE intégrés

Dans `public/assets/sprites/` :
- `terrain_tex_terre.png`, `terrain_tex_herbe.png`, `terrain_tex_sable.png`, `terrain_tex_dalles.png` — Textures terrain seamless 64x64
- `border_wood_9slice.png`, `border_stone_9slice.png` — Bordures 9-slice 48x48
- `decor_pin.png`, `decor_olivier.png`, `decor_banc.png`, `decor_fontaine.png` — Décors provençaux

## Ce que tu dois faire — Phase A : Polish & Ship

### A.1 — Intégrer les assets terrain (PRIORITÉ 1)
1. Charger les textures terrain dans `src/scenes/BootScene.js`
2. Modifier `src/petanque/TerrainRenderer.js` méthode `_drawSurface()` : `tileSprite()` au lieu de Graphics
3. Intégrer bordures 9-slice dans `_drawBorders()`
4. Placer décors sprites dans `_drawBackgroundDecor()`
5. Tester visuellement sur les 5 terrains

### A.2 — Transitions et camera
- Fade-in/out entre toutes les scènes
- Camera follow boule en vol (dummy sprite + startFollow lerp 0.08)
- Camera pan vers cochonnet après chaque lancer
- Slow-motion (0.3x) quand boule < 40px du cochonnet

### A.3 — Particules et juice
- Poussière à l'impact, traînée roulement, confettis victoire
- Flash impact boule-boule, screen shake calibré

### A.4 — Mode Versus Local
- 2 joueurs même écran, alternance tours humains

### A.5 — Mobile & Responsive
- Scaling integer + letterboxing, touch controls

### A.6 — Tutoriel première partie
- Overlay step-by-step pendant la première mène

### A.7 — Distribution
- Page itch.io, SDK Poki/CrazyGames, build optimisé

## Règles CRITIQUES

- **Terrain propre** : JAMAIS d'indicateurs visuels permanents. Boules et cochonnet seulement. [TAB] pour le classement.
- **Pixel art** : `image-rendering: pixelated`, `imageSmoothingEnabled = false`. Jamais de noir pur (#000), toujours #3A2E28.
- **Palette** : Ocre #D4A574, Terracotta #C4854A, Lavande #9B7BB8, Olive #6B8E4E, Ciel #87CEEB, Crème #F5E6D0
- **Physique** : Custom, PAS de Matter.js. COR boule-boule 0.62, cochonnet 0.50.
- **Tile size** : 32x32 partout. Résolution 832x480.
- **Toujours commiter** après chaque changement significatif. HANDOFF.md à jour.
- **Tester** dans le navigateur (`npm run dev`) après chaque changement.

## Fichiers clés

| Fichier | Quoi |
|---------|------|
| `src/petanque/PetanqueEngine.js` | Moteur cœur (1250 lignes) |
| `src/petanque/TerrainRenderer.js` | Rendu terrain (1505 lignes) — **INTÉGRER ASSETS ICI** |
| `src/petanque/Ball.js` | Physique boules (330 lignes) |
| `src/petanque/AimingSystem.js` | Système de visée (795 lignes) |
| `src/petanque/PetanqueAI.js` | IA adversaire (686 lignes) |
| `src/scenes/PetanqueScene.js` | Scène de jeu principale |
| `src/ui/ScorePanel.js` | Score + ranking TAB toggle |
| `src/utils/Constants.js` | Palette, constantes, CHAR_SPRITE_MAP |

## Scripts utiles

```bash
npm run dev                                    # Serveur dev
node scripts/regen-characters.mjs [nom]        # Régénérer sprites PixelLab
node scripts/animate-from-image.mjs <img> <nom> # Animer une image
node scripts/create-pixel-assets.mjs           # Régénérer boules/textures/décors
```

---

Commence par lire CLAUDE.md, HANDOFF.md, PLAN_MVP.md et GAME_DESIGN.md, puis attaque A.1.
