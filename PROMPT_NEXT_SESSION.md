# Prompt pour la prochaine session Claude

Copie-colle ce texte tel quel dans une nouvelle conversation Claude Code :

---

## Contexte

Tu reprends le projet **Petanque Master**, un jeu de petanque competitif en pixel art fait avec Phaser 3 + JavaScript + Vite.

**Lis ces fichiers dans cet ordre AVANT de faire quoi que ce soit :**
1. `CLAUDE.md` — Bible technique (conventions, stack, structure, regles)
2. `CAHIER_DES_CHARGES.md` — **Reference stricte** : etat complet, ce qui fonctionne, ce qui reste
3. `SPRINT_FINAL.md` — Plan d'implementation detaille
4. `research/00_synthese_etat_projet.md` — Synthese + guide des 50+ fichiers research

## Etat actuel (18 mars 2026)

Le jeu est **jouable** avec :
- 6 personnages : **Rookie** (evolutif, 10/40pts) + **Ley** (tireur) + **Le Magicien** (pointeur) + **La Choupe** (tireur) + **Marcel** (equilibre) + **Reyes** (complet)
- 5 terrains (Village, Plage, Parc, Colline, Docks) avec physique differente
- Mode Arcade 5 matchs (Choupe→Marcel→Magicien→Reyes→Ley boss)
- Quick Play libre
- 12 scenes fonctionnelles (dont LevelUp, Shop, Tutorial)
- Moteur physique realiste (COR 0.62, friction terrain, pentes, murs, retro/backspin)
- 5 techniques de lancer (roulette, demi-portee, plombee, tir au fer, tir devant)
- IA avec 4 strategies (PointeurStrategy, TireurStrategy, EquilibreStrategy, CompletStrategy)
- Systeme de progression : Ecus, deblocages, boutique
- 138 tests unitaires + 85 tests e2e Playwright
- SaveManager v2 avec migration
- 14 SFX + 2 musiques + ambiances terrain

## Ce qui reste (voir SPRINT_FINAL.md)

- [ ] Sprite Rookie via PixelLab (customisable par couches)
- [ ] Portraits HD 128x128
- [ ] Uniformisation boules (3D realiste)

## Fichiers cles

| Fichier | Quoi |
|---------|------|
| `src/petanque/PetanqueEngine.js` | Moteur coeur |
| `src/petanque/Ball.js` | Physique boules |
| `src/petanque/AimingSystem.js` | Systeme de visee |
| `src/petanque/PetanqueAI.js` | IA adversaire |
| `src/petanque/ai/` | 4 strategies IA (par archetype) |
| `src/scenes/PetanqueScene.js` | Scene de jeu principale |
| `src/utils/Constants.js` | Constantes, CHAR_SPRITE_MAP |
| `public/data/characters.json` | Source de verite personnages |
| `public/data/arcade.json` | Progression arcade |

## Commandes

```bash
npm run dev          # Serveur dev (Vite HMR)
npm test             # 138 tests unitaires (Vitest)
npx playwright test  # 85 tests e2e
```

---

Commence par lire CLAUDE.md et CAHIER_DES_CHARGES.md.
