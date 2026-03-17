# 01 - Audit Code Source

## Structure globale

```
src/
  main.js              (6 lignes)   - Bootstrap Phaser
  config.js            (38 lignes)  - Config Phaser, scene registration
  scenes/              (11 fichiers, ~3500 lignes)
  petanque/            (8 fichiers, ~2500 lignes)  <- COEUR
  entities/            (2 fichiers, ~300 lignes)
  ui/                  (2 fichiers, ~350 lignes)
  world/               (4 fichiers, ~600 lignes)
  utils/               (3 fichiers, ~450 lignes)
```

---

## Fichier par fichier

### /src/utils/ (Fondations)

| Fichier | Lignes | Qualite | Verdict |
|---------|--------|---------|---------|
| Constants.js | 161 | EXCELLENT | Source de verite unique, physique realiste, palettes provencales |
| SaveManager.js | 79 | BON | 3 slots, versionne, fallback gracieux |
| SoundManager.js | 213 | BON | Audio procedural creatif (cigales, clac, carreau) |

**Issues Constants.js** : Aucune. Fichier exemplaire.
**Issues SaveManager.js** : `formatPlaytime()` basique (pas de secondes). Pas de compression.
**Issues SoundManager.js** : Contexte Web Audio jamais detruit. Pas de controle de volume. Source cigales jamais nettoyee en destruction.

---

### /src/scenes/ (Flow du jeu)

| Fichier | Lignes | Qualite | Statut |
|---------|--------|---------|--------|
| BootScene.js | 74 | BON | Chargement complet mais pas de gestion d'erreur visible |
| TitleScene.js | 827 | EXCELLENT | Paysage procedural, menus, animations, le plus beau fichier |
| CharSelectScene.js | 405 | TRES BON | Grille 3x2, stats visuelles, animations, verrouillage persos |
| QuickPlayScene.js | 627 | TRES BON | 7 options configurables, previews detailles |
| ArcadeScene.js | 382 | TRES BON | Progression 5 matchs + boss, track visuel, confettis |
| VSIntroScene.js | 204 | EXCELLENT | Cinematique "X vs Y", animation sequencee, camera shake |
| PetanqueScene.js | ~600 | BON | Coeur du gameplay, rendu terrain, personnages |
| ResultScene.js | 181 | TRES BON | Victoire/defaite, stats, boutons contextuels |
| IntroScene.js | ~150 | BON | Dialogue Papet + selection de boules |
| OverworldScene.js | ~100 | MOYEN | Incomplet, reserve pour futur mode aventure |
| SpriteTestScene.js | - | N/A | Utilitaire dev |

**Points forts scenes :**
- TitleScene est un showcase technique (layers proceduaux, particules, nuages)
- Flow arcade parfaitement chaine : CharSelect -> VSIntro -> Petanque -> Result -> next round
- Chaque scene a son identite visuelle

**Problemes scenes :**
- **PetanqueScene** : `_ensureSprites()` recree les sprites a chaque match (pas de cache)
- **ArcadeScene** : confettis spawnes avec tweens longue duree (fuite potentielle si skip rapide)
- **QuickPlayScene** : panels info ~100 lignes chacun, devrait etre une classe separee
- **CharSelectScene** : grille 3 colonnes hardcodee, pas parametrable
- **QuickPlayScene** : pas de validation P1 != P2 en mode local
- **BootScene** : erreurs de chargement silencieuses (console.log seulement)

---

### /src/petanque/ (Moteur de jeu - LE COEUR)

| Fichier | Lignes | Qualite | Role |
|---------|--------|---------|------|
| PetanqueEngine.js | ~400 | EXCELLENT | FSM (8 etats), regles FIPJP, scoring, tours |
| Ball.js | 324 | EXCELLENT | Physique boule (friction, rebounds, collisions elastiques) |
| Cochonnet.js | 18 | BON | Extends Ball, masse 30g, rayon 8px |
| AimingSystem.js | ~350 | TRES BON | Drag-and-release, 4 modes loft, prediction |
| PetanqueAI.js | ~300 | EXCELLENT | 3 niveaux, 5 archetypes, analyse situation, pression |
| TerrainRenderer.js | ~200 | EXCELLENT | 5 terrains proceduraux (ciel, sol, bordures, decorations) |
| CharacterTextures.js | - | BON | Gestion textures personnages |
| ModularCharacter.js | - | BON | Instanciation personnages |

**Forces du moteur :**
- FSM 8 etats couvre tous les cas (cochonnet mort, mene morte, game over)
- Physique realiste : COR 0.62, friction lineaire, pentes, zones terrain
- IA avec personnalite : Marcel pointe, Fanny tire, Ricardo s'adapte
- Prediction trajectoire : `Ball.simulateTrajectory()` (120 pas, 1 sur 3 affiche)
- Detection carreau : deplacement >24px = carreau, animation speciale

**Problemes moteur :**
- `Ball.resolveCollision()` depend de l'appelant pour tester toutes les paires (pas de broadphase)
- `_squashTimer` duplique en graphics et en sprite (unifier)
- `PetanqueAI._analyzeSituation()` retourne un objet large (pourrait etre une classe)
- Pas de validation/guards sur les transitions de la FSM
- Listeners clavier dans AimingSystem crees/detruits plusieurs fois inutilement

---

### /src/ui/

| Fichier | Lignes | Qualite | Role |
|---------|--------|---------|------|
| ScorePanel.js | 271 | TRES BON | HUD score, menes, boules restantes, projection |
| DialogBox.js | ~100 | BON | Dialogues style Pokemon (typewriter) |

**Issues :**
- `_drawBallDots()` dense, pourrait etre decompose
- Labels de distance en position absolue (pas centres sur les boules)
- DialogBox utilise rexUI mais pas pleinement exploite

---

### /src/entities/ & /src/world/ (Reserve - Basse priorite)

| Fichier | Lignes | Qualite | Statut |
|---------|--------|---------|--------|
| Player.js | ~150 | BON | Mouvement grille, 4 directions, animation |
| NPC.js | ~150 | BON | Dialogue, patrol, detection |
| MapManager.js | ~150 | BON | Chargement maps Tiled, transitions |
| NPCManager.js | ~100 | BON | Spawn PNJ depuis Tiled |
| SpriteGenerator.js | ~200 | TRES BON | Generation procedurale personnages 32x32 |
| TilesetGenerator.js | ~150 | BON | Generation procedurale tilesets |

**Verdict :** Code fonctionnel mais incomplet. Reserve pour le mode aventure futur.
Pas de priorite d'amelioration pour le MVP versus/arcade actuel.

---

## Metriques de duplication de code

### Patterns dupliques identifies :
1. **`_getCharSpriteKey()`** : defini dans 4+ fichiers (PetanqueScene, CharSelectScene, QuickPlayScene, ArcadeScene)
   - **Fix** : centraliser dans un utilitaire ou Character.js
2. **Style boutons UI** : memes parametres (couleur, bordure, ombre, hover) repetes dans chaque scene
   - **Fix** : classe `ButtonFactory` ou constantes dans Constants.js
3. **Chargement sprite personnage** : meme logique de spritesheet (32x32, 4 frames) dupliquee
   - **Fix** : centraliser dans CharacterTextures.js (deja commence)

---

## Qualite globale du code

| Critere | Note /10 | Commentaire |
|---------|----------|-------------|
| Lisibilite | 8 | Code clair, noms explicites, structure logique |
| Modularite | 7 | Bonne separation, quelques duplications |
| Robustesse | 6 | Peu de gestion d'erreur, pas de guards FSM |
| Performance | 6 | Pas de cache textures, pas d'object pooling |
| Testabilite | 7 | Engine testable isolement, scenes plus difficiles |
| Documentation | 5 | Peu de JSDoc, mais code auto-documente |
| Dette technique | 7 | Faible pour un projet de cette taille |
| **MOYENNE** | **6.6** | **Solide, quelques points a consolider** |
