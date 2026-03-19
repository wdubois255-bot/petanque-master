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

## Etat actuel (19 mars 2026 soir)

Le jeu est **jouable et stable** avec :

### Personnages
- 6 personnages : **Rookie** (evolutif, stats sauvegardees) + **La Choupe** (tireur) + **Ley** (tireur) + **Le Magicien** (pointeur) + **Marcel** (equilibre) + **Reyes** (complet)
- Rookie sprite statique (128px) integre dans toutes les scenes (pas de spritesheet animee)
- Pattern `CHAR_STATIC_SPRITES` dans Constants.js pour gerer les sprites non-animes
- Progression Rookie : XP par victoire, stats distribuables, capacites debloquables (18/26/34 pts)
- Anti-farm XP : en Arcade, XP seulement pour les NOUVEAUX rounds

### Scenes (14 fonctionnelles)
| Scene | Role | Statut |
|-------|------|--------|
| TitleScene | Menu principal (5 items) | OK — Ecus affiches, Parametres en modal |
| CharSelectScene | Selection perso (grille 3x2) | OK — BackButton, preview sans chevauchement |
| QuickPlayScene | Config partie rapide | OK — Rookie en J1, 6 cochonnets, BackButton |
| ArcadeScene | Progression arcade (5 rounds) | OK — Enchainement sans bugs |
| VSIntroScene | Splash VS avant match | OK — Flags reset dans init() |
| PetanqueScene | Match de petanque | OK — resetFX, static sprites geres |
| ResultScene | Resultats match | OK — Flow Arcade ET QuickPlay separes |
| LevelUpScene | Distribution points Rookie | OK — addRookiePoints() appele, retour dynamique |
| PlayerScene | Mon Personnage (stats, inventaire) | OK — Stats, progression, carriere, boule equipee |
| ShopScene | Boutique (3 onglets) | OK — Boules+retro fusionne, grille 5x3 |
| TutorialScene | Tutoriel 5 pages | OK |
| BootScene | Chargement assets | OK |
| IntroScene | Intro narrative | OK |
| OverworldScene | Exploration (reserve) | Reserve Phase D |

### Moteur de jeu
- Physique custom realiste (COR 0.62, friction terrain, pentes, murs, retro/backspin)
- 5 techniques de lancer (roulette, demi-portee, plombee, tir au fer, tir devant)
- IA avec 4 strategies (PointeurStrategy, TireurStrategy, EquilibreStrategy, CompletStrategy)
- 15 boules dans boules.json (10 standard + 5 retro avec stats)
- 6 cochonnets (classique, bleu, vert, rouge, jungle, multicolor)
- 5 terrains (Village, Plage, Parc, Colline, Docks)

### UI/UX
- UIFactory enrichi : createEcusDisplay, createTabBar, addBackButton, createModalOverlay
- Constantes UI standardisees (UI.TITLE_SIZE, UI.MENU_SIZE, etc.)
- BackButton + ESC uniforme dans toutes les scenes
- removeAllListeners() dans tous les _shutdown()
- cameras.main.resetFX() dans tous les create()
- ScorePanel avec animation MATCH POINT (score >= 12)

### Donnees
- SaveManager v2 : selectedBoule, selectedCochonnet, rookieStats, totalCarreaux, arcadeProgress
- SoundManager : volume global/musique/SFX persistant en localStorage
- 138 tests unitaires (Vitest)
- Prix boutique : boules 150-800E, retro 500-600E, cochonnets 50-400E

## PATTERNS CRITIQUES (ne jamais oublier)

1. **Phaser reutilise les instances de scene** → TOUJOURS reset les flags dans init()
2. **removeAllListeners()** dans chaque _shutdown() (pas removeKey)
3. **cameras.main.resetFX()** dans chaque create()
4. **Ne JAMAIS modifier textures globales** sans verifier frameTotal > 2
5. **scene.start() DIRECT** pour les transitions critiques (pas camerafadeoutcomplete)
6. **IDs boules normalises** : "bronze" dans unlockedBoules, "boule_bronze" dans purchases

## Ce qui reste a faire

### Priorite 1 — Game Feel & Polish
- [ ] Animations entree de scene (stagger entrance pour les menus)
- [ ] Confetti ResultScene en palette provencale
- [ ] SFX feedback sur chaque interaction (hover, clic, achat)
- [ ] Skip VSIntroScene apres premiere visualisation
- [ ] Animations achat boutique (particules, counter decrement)

### Priorite 2 — Contenu
- [ ] Spritesheets animees pour TOUS les personnages (idle 4 directions)
- [ ] Sprite animee du Rookie (actuellement statique)
- [ ] Portraits HD 128x128 pour le panel de selection
- [ ] Terrains avec textures Tiled (actuellement procedurale)
- [ ] Musiques par terrain (actuellement fallback music_match)

### Priorite 3 — Gameplay
- [ ] Capacites Rookie fonctionnelles (L'Instinct, Determination, Le Naturel)
- [ ] Capacites uniques des adversaires actives en match
- [ ] Tooltips contextuels premier match sur chaque terrain
- [ ] Mode Versus en ligne (reserve)

## Fichiers cles

| Fichier | Quoi |
|---------|------|
| `src/petanque/PetanqueEngine.js` | Moteur coeur (1250 lignes) |
| `src/petanque/Ball.js` | Physique boules + rendu sprites |
| `src/petanque/AimingSystem.js` | Systeme de visee (wobble, focus, retro) |
| `src/petanque/PetanqueAI.js` | IA adversaire |
| `src/petanque/ai/` | 4 strategies IA (par archetype) |
| `src/scenes/PetanqueScene.js` | Scene de jeu principale |
| `src/scenes/PlayerScene.js` | Mon Personnage (stats, inventaire) |
| `src/scenes/ShopScene.js` | Boutique (3 onglets + merge retro) |
| `src/scenes/TitleScene.js` | Menu principal (5 items + modal parametres) |
| `src/ui/UIFactory.js` | Composants UI reutilisables |
| `src/ui/ScorePanel.js` | Panneau score en match |
| `src/utils/Constants.js` | Constantes, CHAR_SPRITE_MAP, UI tokens |
| `src/utils/SaveManager.js` | Sauvegarde localStorage |
| `src/utils/SoundManager.js` | Audio avec volume persistant |
| `public/data/characters.json` | Source de verite personnages |
| `public/data/boules.json` | Boules + cochonnets (stats, textures) |
| `public/data/shop.json` | Items achetables + prix |
| `public/data/arcade.json` | Progression arcade |

## Commandes

```bash
npm run dev          # Serveur dev (Vite HMR)
npm test             # 138 tests unitaires (Vitest)
npx playwright test  # Tests e2e
npm run build        # Build production
```

## Research disponible (50+ fichiers)

Voir `research/00_synthese_etat_projet.md` pour l'index complet.
Docs cles pour la suite :
- `research/34_ui_ux_fighting_game_patterns.md` — Patterns UI jeux de combat
- `research/35_audio_design_complet.md` — Design audio complet
- `research/36_onboarding_tutorial_design.md` — Onboarding joueur
- `research/46_shop_ui_patterns_indie.md` — Patterns boutique indie
- `research/47_camera_slowmo_2d_sports.md` — Camera et slow-mo
- `research/49_sound_design_impact_sports.md` — Sons d'impact
- `research/50_cosmetic_overhaul_checklist.md` — Checklist cosmetique

---

Commence par lire CLAUDE.md et CAHIER_DES_CHARGES.md, puis lance `npm run dev` pour verifier que tout fonctionne.
