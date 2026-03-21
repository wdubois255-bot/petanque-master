# Making Of - Petanque Master
## Timeline de developpement pour video

> **181 commits en 8 jours** (13-21 mars 2026)
> **~22 000 lignes de code** | **15 scenes** | **6 personnages jouables** | **5 terrains**
> Stack : Phaser 3 + Vite + JavaScript ES6 | Physique custom (pas de Matter.js)

---

## ACTE 1 : Les Fondations (Jour 1-2 — 13-14 mars)
**15 commits | "De zero a un jeu jouable"**

### Chapitre 1 : Le Premier Lancer
- **Commit 1** : Setup Vite + Phaser, moteur petanque complet des le Sprint 0+1
- Le coeur du jeu (Ball.js, ~380 lignes de physique custom) est ecrit en premier
- Choix delibere : PAS de Matter.js — physique maison pour le controle total
- Fix de la physique de roulement : `v0 = sqrt(2 * friction * distance)`
- Premier test Playwright automatise

### Chapitre 2 : Un Monde a Explorer
- Sprint 2 : monde ouvert avec village, joueur, PNJs, dialogues, combats
- Sprint 3 : sauvegarde, ecran titre, intro, 3 maps, badges, personnage Marcel

**Moment cle pour la video** : Montrer le tout premier lancer de boule fonctionnel → emotion "ca marche !"

---

## ACTE 2 : Le Game Feel (Jour 3-4 — 15-16 mars)
**47 commits | "Rendre le jeu beau et satisfaisant"**

### Chapitre 3 : Migration 32x32
- Audit complet puis migration 16x16 → 32x32 (resolution 832x480)
- Recherche workflow PixelLab pour spritesheets
- Tous les sprites et tiles doubles

### Chapitre 4 : Le "Juice"
- SFX proceduraux, particules, zoom, stats boules
- Fond de Provence, terrain gravier, bordures bois, decor
- Boules 3D avec gradient radial (CanvasTexture)
- Camera cinematique follow/pan (plus tard retiree — decision importante)
- Cigales procedurales !
- Traces d'impact permanentes

### Chapitre 5 : La Physique Realiste
- Recherche biomecanique du vrai lancer de petanque
- COR (Coefficient de Restitution) acier = 0.62 base sur donnees reelles
- 4 techniques de lancer : portee, plombee, tir, tir devant
- Test physique : 7/7 checks PASS
- Le carreau devient possible naturellement (sans hack !)

**Moment cle** : Avant/apres du terrain (placeholder gris → Provence) + premier carreau reussi

---

## ACTE 3 : Les Personnages (Jour 5 — 17 mars)
**56 commits ! Record du projet | "Donner vie au jeu"**

### Chapitre 6 : Le Pivot Versus/Arcade
- Abandon du format RPG pur → format versus/arcade (comme Pokemon Stadium)
- Selection de personnage J1/J2
- Ecran VS intro cinematique
- Mode Arcade 5 rounds

### Chapitre 7 : L'Art IA
- Pipeline : PixelLab → Piskel/Aseprite → integration Phaser
- Sprites chibi 32x32 animes (4 directions × 4 frames)
- Personnages : Rookie, La Choupe, Marcel, Bastien, Rene, Reyes
- Chaque perso a ses stats, abilities, et "barks" (repliques)
- Boules custom retouchees a la main dans Piskel
- Upscale 64→128px avec Scale4x + Lanczos + contours sombres

### Chapitre 8 : L'IA Adversaire
- IA par archetype (pointeur, tireur, strategique)
- Reyes : CompletStrategy avec prise de decision strategique
- Le marker de visee oscille selon la precision du perso

**Moment cle** : Montrer le pipeline de creation d'un personnage de A a Z (prompt PixelLab → retouche → integration → gameplay)

---

## ACTE 4 : Le Polish (Jour 6-7 — 18-19 mars)
**49 commits | "Les details qui font tout"**

### Chapitre 9 : UI/UX Overhaul
- Palette provencale : ocres, terracotta, olive, lavande
- UIFactory enrichi, menus, modals, navigation uniforme
- ScorePanel ameliore, indicateurs discrets
- Confettis de victoire provencaux
- Iris wipe (transition cinematique)
- Hit stop (micro-pause a l'impact)

### Chapitre 10 : Audio
- 14 SFX via ElevenLabs MCP
- 2 musiques (menu + terrain)
- SFX proceduraux pour les menus

### Chapitre 11 : Boutique et Progression
- Monnaie : les "Galets"
- 10 boules jouables, 8 cochonnets
- Boutique 3 onglets
- Deblocages par victoires
- Ecran "Mon Personnage" avec stats et inventaire

**Moment cle** : Montrer l'ecran boutique + l'effet satisfaisant d'acheter une nouvelle boule

---

## ACTE 5 : La Solidite (Jour 7-8 — 19-20 mars)
**14 commits | "Rendre le jeu incassable"**

### Chapitre 12 : Tests et Robustesse
- 138 tests unitaires (Vitest)
- 85 tests E2E (Playwright) — le jeu se teste tout seul !
- Audit complet : removeAllListeners() dans toutes les scenes
- Fix du bug "boule invisible" (TDZ error)
- Scenes Phaser : toujours init() avec reset de flags

### Chapitre 13 : Equilibrage
- Plombee plus dure (realiste)
- Recalibrage complet des niveaux IA
- Detection des coups speciaux (carreau, biberon, etc.)

**Moment cle** : Montrer les tests Playwright qui jouent automatiquement → "le jeu se teste lui-meme"

---

## ACTE 6 : La Refonte Visuelle v2 (Jour 8 — 21 mars)
**8 commits | "Le saut qualitatif"**

### Chapitre 14 : Nouvelle Generation
- 12 personnages generes via PixelLab (objectif 26 total)
- UI complete bois + or
- Plan en 7 phases pour la refonte totale
- Objectif : passer de "prototype jouable" a "jeu commercialisable"

**Moment cle** : Split screen avant/apres des sprites v1 vs v2

---

## Chiffres Cles (pour la video)

| Metrique | Valeur |
|----------|--------|
| Duree totale | 8 jours |
| Commits | 181 |
| Lignes de code | ~22 000 |
| Scenes de jeu | 15 |
| Personnages jouables | 6 |
| Terrains | 5 |
| Boules | 10 |
| Cochonnets | 8 |
| Tests unitaires | 138 |
| Tests E2E | 85 |
| SFX | 14 |
| Musiques | 2 |
| Moteur physique | Custom (380 lignes, pas de lib) |
| IA | 3 archetypes + strategie avancee |
| Outils IA | PixelLab (sprites), ElevenLabs (audio), Claude (code) |
| Jour le plus productif | 17 mars — 56 commits |

## Commits par Jour

```
13 mars ████████████████ 14
14 mars █                 1
15 mars ███████████████████████████████ 27
16 mars ██████████████████████ 20
17 mars ████████████████████████████████████████████████████████████████ 56
18 mars █████████████████████████████ 25
19 mars ████████████████████████████ 24
20 mars ██████ 6
21 mars ████████ 8
```

## Themes Narratifs pour la Video

1. **"Un jeu de petanque serieux"** — Physique basee sur de vraies donnees biomecaniques
2. **"L'IA comme co-createur"** — Claude pour le code, PixelLab pour l'art, ElevenLabs pour l'audio
3. **"Le pivot"** — De RPG monde ouvert a arcade versus (et pourquoi)
4. **"Les details obsessionnels"** — COR 0.62, cigales procedurales, confettis provencaux
5. **"Tester comme un pro"** — 223 tests automatises en 8 jours
6. **"Camera fixe"** — La decision de retirer la camera follow (et pourquoi c'est mieux)

## Captures a Faire / Moments Visuels

- [ ] Premier commit : ecran vide → premier lancer
- [ ] Evolution du terrain : gris → Provence complete
- [ ] Pipeline personnage : prompt PixelLab → sprite → in-game
- [ ] Split screen sprites v1 vs v2
- [ ] Tests Playwright en action (le jeu joue tout seul)
- [ ] Evolution de l'UI : brut → polish provencal
- [ ] Le carreau parfait (physique realiste)
- [ ] Ecran de stats/progression final
- [ ] Timelapse du git log (outil type gource)

## Outils Suggeres pour la Video

- **Gource** : visualisation animee de l'historique git (tres cinematique)
- **OBS** : capture d'ecran du jeu en action
- **Gameplay recording** : captures a differentes etapes du dev
- **git diff** : montrer les changements de code en accelere
