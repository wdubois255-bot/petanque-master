# HANDOFF — Petanque Master (17 mars 2026) — ⚠ OBSOLETE

> **⚠ CE FICHIER EST OBSOLETE** (17 mars 2026). NE PAS UTILISER.
> Roster, stats, friction Plage, et priorites sont tous depasses.
> **Source de verite** : `CAHIER_DES_CHARGES.md` (v2.1, 18 mars 2026).
> **Ce fichier est conserve uniquement comme archive historique.**

## État du projet

Jeu de pétanque compétitif style jeu de combat (Street Fighter / Tekken) en pixel art.
Le joueur choisit un personnage avec des stats uniques et affronte des adversaires.

**Stack** : Phaser 3.90 + JavaScript ES6 + Vite 6.3+ + GitHub Pages
**Statut** : Jouable. Prochaine étape = polish + ship.

```bash
npm run dev     # Dev server (HMR)
npm run build   # Production build
npm run test    # Tests Vitest
```

---

## Ce qui est FAIT et FONCTIONNEL

### Gameplay cœur
- Moteur pétanque custom (physique réaliste, COR 0.62 acier)
- 4 techniques de lancer : roulette, demi-portée, plombée, tir au fer
- Système de visée drag-and-release avec landing marker + prédiction trajectoire
- IA 3 niveaux + personnalités (pointeur, tireur, stratège, complet)
- Score FIPJP : 13 points, mènes, équipe qui perd rejoue
- Carreau détecté naturellement via COR 0.62
- Retro/backspin mécanique fonctionnelle
- Pression sang-froid (tremblement visée à 10+)

### Modes de jeu
- **Mode Arcade** : 5 matchs + boss (René→Marcel→Fanny→Ricardo→Thierry→Marius)
- **Partie Rapide** : choix perso/boule/cochonnet/terrain/difficulté
- Écran titre cinématique avec personnages animés

### 6 personnages jouables
| Perso | Style | Stats (PRE/PUI/EFF/SF) | Sprite |
|-------|-------|------------------------|--------|
| René | Équilibré | 6/6/6/6 | rene_animated.png |
| Marcel | Pointeur précision | 9/4/6/7 | marcel_animated.png |
| Fanny | Tireur agressif | 5/9/4/6 | fanny_animated.png |
| Ricardo | Stratège calculateur | 6/5/9/6 | ricardo_animated.png |
| Thierry | Flambeur imprévisible | 7/8/7/3 | thierry_animated.png |
| Marius | Boss complet | 8/7/8/9 | marius_animated.png |

### 5 terrains uniques
| Terrain | Type | Friction | Particularité |
|---------|------|----------|---------------|
| Place du Village | terre | 1.0 | Standard |
| Plage des Calanques | sable | 3.5 | Forte friction |
| Parc Municipal | herbe | mixte | Zones variées |
| Colline aux Oliviers | terre sèche | 1.0 | Pente (boules roulent vers le bas) |
| Docks du Vieux-Port | dalles | 0.4 | Murs de rebond |

### UI/UX
- Palette provençale unifiée (ocre/terracotta/lavande/ciel)
- ScorePanel avec pulse animé sur changement de score
- **Terrain propre** : aucun indicateur permanent, juste boules + cochonnet
- **[TAB]** : toggle classement complet de toutes les boules
- Sprites personnages upscalés 2x en jeu (64px)

### Assets générés (disponibles)
- 6 spritesheets personnages 128x128 (PixelLab + retouche)
- 5 boules + 3 cochonnets avec shading sphérique 7 tons
- Terrains 100% procéduraux (TerrainRenderer.js, 1505 lignes)
- 4 textures terrain seamless 64x64 (**PAS ENCORE INTÉGRÉES**)
- 2 bordures 9-slice bois/pierre (**PAS ENCORE INTÉGRÉES**)
- 4 décors provençaux pin/olivier/banc/fontaine (**PAS ENCORE INTÉGRÉS**)
- 12 SFX + 2 musiques

### Code
- Propre : audit complet effectué, zero dead code, zero console.log
- CHAR_SPRITE_MAP centralisé dans Constants.js
- Palette CSS/hex centralisée dans Constants.js
- Build OK, zero erreur JS

---

## Ce qui RESTE À FAIRE (Phase A — Polish & Ship)

Voir **PLAN_MVP.md** pour le plan complet en 4 phases.

### PRIORITÉ 1 — Intégrer les assets terrain (3h)
Fichier principal : `src/petanque/TerrainRenderer.js`

1. Charger textures dans BootScene.js
2. `_drawSurface()` : tileSprite() au lieu de Graphics
3. `_drawBorders()` : bordures 9-slice
4. `_drawBackgroundDecor()` : décors sprites
5. Tester sur les 5 terrains

### PRIORITÉ 2 — Transitions et camera (3h)
- Fade-in/out entre scènes
- Camera follow boule en vol
- Camera pan vers cochonnet après lancer
- Slow-motion quand boule proche du cochonnet

### PRIORITÉ 3 — Particules et juice (2h)
- Poussière à l'impact
- Traînée roulement
- Confettis victoire
- Flash impact boule-boule

### PRIORITÉ 4 — Mode Versus Local (4h)
- 2 joueurs même écran
- Sélection J1 + J2 dans CharSelect
- Alternance tours humains

### PRIORITÉ 5 — Mobile & Responsive (3h)
- Scaling integer + letterboxing
- Touch controls adaptés
- Page Visibility API

### PRIORITÉ 6 — Tutoriel + Distribution (5h)
- Mini-tutoriel première partie
- Page itch.io
- SDK Poki / CrazyGames
- Build optimisé

---

## Codebase — Fichiers clés

| Fichier | Rôle | Lignes |
|---------|------|--------|
| src/petanque/PetanqueEngine.js | Moteur de jeu (cœur) | ~1250 |
| src/petanque/TerrainRenderer.js | Rendu terrain (**intégrer assets ici**) | ~1505 |
| src/petanque/Ball.js | Physique des boules | ~330 |
| src/petanque/AimingSystem.js | Système de visée | ~795 |
| src/petanque/PetanqueAI.js | IA adversaire | ~686 |
| src/scenes/PetanqueScene.js | Scène de jeu principale | ~502 |
| src/scenes/CharSelectScene.js | Sélection personnage | ~396 |
| src/scenes/QuickPlayScene.js | Configuration partie rapide | ~628 |
| src/scenes/BootScene.js | Chargement assets | ~104 |
| src/ui/ScorePanel.js | Score + ranking TAB | ~291 |
| src/utils/Constants.js | Constantes, palette, sprites | ~209 |
| src/utils/SoundManager.js | Audio SFX + musique | ~269 |

### Données (public/data/)
- characters.json — Stats des 6 personnages + config IA
- terrains.json — Config des 5 terrains + physique
- boules.json — 5 boules + 3 cochonnets + physique
- arcade.json — Progression arcade (5 matchs + boss)
- progression.json — Badges/gates (shelved, Phase D)

---

## Analyse marché (résumé)

- **Zéro concurrent** en pétanque browser compétitive
- Cibles : Poki (100M/mois), CrazyGames (30M/mois), itch.io
- Le pixel art provençal est dans la tendance 2026
- Le format "fighting game × sport" est unique et partageable
- Monétisation : rewarded ads entre matchs (jamais pendant)

---

## Scripts utiles

```bash
npm run dev                                    # Serveur dev
npm run build                                  # Build production
npm run test                                   # Tests Vitest
node scripts/regen-characters.mjs [nom]        # Régénérer sprites PixelLab
node scripts/animate-from-image.mjs <img> <nom> # Animer une image en spritesheet
node scripts/create-pixel-assets.mjs           # Régénérer boules/terrains/décors
```

## MCP Servers

- **PixelLab** : `.mcp.json` → API génération sprites IA (Node.js `https.request()`, pas curl)
- **ElevenLabs** : `.mcp.json` → SFX génération (uvx elevenlabs-mcp)

## Règles critiques

- Pixel art pixelated, jamais de lissage
- Tile size 32x32, résolution 832x480
- Physique custom, PAS de Matter.js
- Jamais de noir pur (#000) → #3A2E28
- Palette provençale : ocre, terracotta, olive, lavande, ciel, crème
- Terrain propre : pas d'indicateurs visuels permanents, [TAB] pour classement
- Toujours commiter après chaque changement significatif
