# 04 - Audit Technique

## Architecture

### Diagramme de dependances
```
main.js
  └── config.js
        ├── BootScene.js        (charge tous les assets)
        ├── TitleScene.js       (menu principal)
        ├── CharSelectScene.js  → characters.json
        ├── QuickPlayScene.js   → characters.json, boules.json, terrains.json
        ├── ArcadeScene.js      → arcade.json
        ├── VSIntroScene.js
        ├── PetanqueScene.js ──→ PetanqueEngine.js
        │     ├── TerrainRenderer.js → terrains.json
        │     ├── AimingSystem.js
        │     ├── ScorePanel.js
        │     └── SoundManager.js
        │           PetanqueEngine.js
        │             ├── Ball.js (physique)
        │             ├── Cochonnet.js (extends Ball)
        │             ├── PetanqueAI.js → characters.json
        │             └── Constants.js
        ├── ResultScene.js
        ├── IntroScene.js       → boules.json
        └── OverworldScene.js   (reserve)
              ├── MapManager.js
              ├── Player.js
              ├── NPC.js
              └── NPCManager.js → npcs.json
```

### Forces architecturales
1. **Separation donnees/logique** : JSON externe pour tout le contenu
2. **Scene-based flow** : Phaser scene manager gere la navigation
3. **Moteur isolable** : PetanqueEngine peut tourner sans Phaser (testable)
4. **Rendu procedural** : TerrainRenderer, SpriteGenerator = pas de dependance asset externe
5. **Event-driven** : Callbacks (onStateChange, onScore, onTurnChange) = decouplage

### Faiblesses architecturales
1. **Pas de service locator/DI** : les scenes importent directement les utilitaires
2. **Pas d'EventBus global** : chaque composant gere ses propres events
3. **Pas de state manager** : l'etat du jeu est passe en scene.data (fragile)
4. **Singletons implicites** : SoundManager = module-level (pas de cleanup)

---

## Performance

### Points chauds identifies

#### 1. Creation de textures canvas a chaque match
**Ou :** TerrainRenderer.js, SpriteGenerator.js
**Probleme :** A chaque debut de match, le terrain est re-dessine sur un canvas off-screen,
puis converti en texture Phaser. Pareil pour les sprites generes procedualement.
**Impact :** Lag potentiel au lancement du match (~100-200ms)
**Fix :** Cache les textures par cle (terrain_type + seed). Ne recreer que si la cle change.

#### 2. Collision detection O(n²)
**Ou :** PetanqueEngine.js appelle Ball.resolveCollision() pour chaque paire
**Probleme :** Avec 6 boules + 1 cochonnet = 21 paires testees a chaque frame
**Impact :** Negligeable pour 7 objets, mais pas scalable pour doublette/triplette (13 objets = 78 paires)
**Fix :** Pas necessaire tant qu'on reste en 1v1 avec 7 objets max. Pour 2v2/3v3 : spatial hash ou quadtree.

#### 3. Tweens orphelins
**Ou :** ArcadeScene.js (confettis), TitleScene.js (nuages, particules)
**Probleme :** Les tweens avec longue duree ne sont pas explicitement kill() au changement de scene.
**Impact :** Fuite memoire potentielle si navigation rapide entre scenes.
**Fix :** Phaser gere normalement le cleanup des tweens au scene shutdown, mais verifier les graphics associes.

#### 4. Web Audio Context
**Ou :** SoundManager.js
**Probleme :** AudioContext cree une fois, jamais close(). Ressource systeme conservee.
**Impact :** Mineur en pratique (un seul contexte), mais pas propre.
**Fix :** Ajouter close() dans un cleanup global, ou documenter le design intention.

#### 5. Animation sprites dans update()
**Ou :** TitleScene.js (nuages, particules), PetanqueScene.js
**Probleme :** Logique de wrapping/mouvement calculee chaque frame en update()
**Impact :** Negligeable (<1ms par frame), mais pourrait etre fait en tweens/timeline.
**Fix :** Faible priorite. Les tweens Phaser sont equivalents en CPU.

### Bilan performance
| Critere | Statut | Risque |
|---------|--------|--------|
| 60 FPS en match | OK | Aucun |
| 60 FPS en menu | OK | Aucun |
| Temps de chargement | OK (~1s) | Faible |
| Memoire | ATTENTION | Tweens orphelins possibles |
| CPU idle | OK | Cycles cigales mineurs |
| Taille bundle | OK (~1.7MB) | Bien sous le seuil 5MB |

---

## Tests

### Infrastructure de test
| Outil | Version | Usage |
|-------|---------|-------|
| Vitest | 4.1.0 | Tests unitaires (Ball, Engine, AI) |
| Playwright | 1.58.2 | Tests E2E (flow complet, screenshots) |

### Couverture actuelle
| Module | Tests unitaires | Tests E2E | Couverture estimee |
|--------|-----------------|-----------|-------------------|
| Ball.js | OUI (Ball.test.js) | Partiel | ~70% |
| PetanqueEngine.js | OUI (PetanqueEngine.test.js) | Partiel | ~60% |
| PetanqueAI.js | OUI (PetanqueAI.test.js) | Non | ~40% |
| AimingSystem.js | Non | Partiel | ~20% |
| ScorePanel.js | Non | Partiel | ~10% |
| Scenes (flow) | Non | OUI (5+ tests) | ~50% |
| SaveManager.js | Non | Non | 0% |
| SoundManager.js | Non | Non | 0% |

### Tests E2E (Playwright)
| Test | Focus |
|------|-------|
| test-e2e-playtest.mjs | Flow complet Title -> Petanque |
| test-sprint3.mjs | IntroScene, boule select, OverworldScene |
| test-sprint35.mjs | Loft, carreau, prediction |
| test-sprint4-gameplay.mjs | Sprint 4 gameplay validation |
| test-quickplay.mjs | Quick Play mode |
| test-techniques.mjs | Throw techniques |
| test-visual-playthrough.mjs | Visual regression |
| test-char-sprites.mjs | Sprite rendering |
| test-cochonnet.mjs | Cochonnet physics |
| test-collision.mjs | Collision resolution |
| test-tir-carreau.mjs | Carreau detection debug |
| full-test.mjs | Suite complete (NON COMMITE) |
| terrain-test.mjs | Terrain friction (NON COMMITE) |

### Lacunes de test
1. **Pas de CI/CD test** : les tests ne tournent pas en GitHub Actions
2. **Pas de test automatique du scoring** : mene complete simulee
3. **Pas de test d'equilibrage** : 1000 matchs IA vs IA pour verifier la balance
4. **Pas de test de performance** : pas de mesure FPS automatique
5. **SaveManager** : aucun test (risque de regression silencieuse)
6. **SoundManager** : aucun test (risque de crash audio non detecte)

---

## Securite & Build

### Configuration Vite
```js
assetsInlineLimit: 0    // CRITIQUE - empeche l'inlining des assets Phaser
base: './'              // Relatif pour GitHub Pages
build: {
  rollupOptions: {
    output: {
      manualChunks: { phaser: ['phaser'] }  // Chunk separee pour Phaser (~3MB)
    }
  }
}
```

### Securite
| Element | Statut | Notes |
|---------|--------|-------|
| CSP headers | OK | Definis dans index.html |
| .env dans .gitignore | OK | Cles API non commites |
| Pas de backend | OK | Tout client-side, pas de surface d'attaque serveur |
| localStorage | ATTENTION | Pas de validation input. XSS pourrait injecter en localStorage |
| Dependances | OK | Seulement Phaser + rex-plugins + Vite |

### Dependances (package.json)
| Package | Version | Usage | Risque |
|---------|---------|-------|--------|
| phaser | 3.90.0 | Framework jeu | Stable, fin de branche 3.x |
| phaser3-rex-plugins | 1.80.19 | UI avancee | Maintenu, compatible 3.x |
| vite | 8.0.0 | Bundler | Derniere version |
| vitest | 4.1.0 | Tests unitaires | Derniere version |
| @playwright/test | 1.58.2 | Tests E2E | Derniere version |

**Verdict dependances :** Stack legere, a jour, pas de vulnerabilite connue.
Attention : Phaser 4 est annonce mais pas encore stable. Rex-plugins n'a pas confirme
le support Phaser 4. Rester sur Phaser 3.90.0 est le bon choix.

---

## Dette technique

### Haute priorite
| Issue | Fichier(s) | Effort | Impact |
|-------|------------|--------|--------|
| Duplication `_getCharSpriteKey()` | 4+ scenes | 30min | Maintenance |
| Duplication style boutons UI | Toutes scenes | 1h | Maintenance |
| Pas de cache textures canvas | TerrainRenderer, SpriteGenerator | 2h | Performance |
| Pas de controle volume audio | SoundManager.js | 1h | UX |

### Moyenne priorite
| Issue | Fichier(s) | Effort | Impact |
|-------|------------|--------|--------|
| Pas de guards FSM | PetanqueEngine.js | 2h | Robustesse |
| Listeners clavier recrees | AimingSystem.js | 1h | Proprete |
| Cleanup Web Audio | SoundManager.js | 30min | Proprete |
| Tests CI/CD | .github/workflows | 2h | Qualite |

### Basse priorite
| Issue | Fichier(s) | Effort | Impact |
|-------|------------|--------|--------|
| Grille hardcodee 3 cols | CharSelectScene.js | 30min | Extensibilite |
| Validation P1 != P2 | QuickPlayScene.js | 15min | Edge case |
| _drawBallDots() trop dense | ScorePanel.js | 30min | Lisibilite code |
| _squashTimer duplique | Ball.js | 30min | Proprete |

---

## Compatibilite navigateurs

| Navigateur | Support | Notes |
|-----------|---------|-------|
| Chrome 90+ | OK | Cible principale, Web Audio OK |
| Firefox 90+ | OK | Web Audio OK |
| Safari 15+ | ATTENTION | Web Audio peut necessiter user gesture |
| Edge 90+ | OK | Chromium-based |
| Mobile Chrome | PARTIEL | Touch input non optimise pour drag-and-release |
| Mobile Safari | PARTIEL | Touch + Web Audio restrictions |

**Risque majeur :** Le jeu est concu pour desktop (mouse drag). L'experience mobile
n'est pas explicitement supportee. Le drag-and-release touch pourrait fonctionner
grace au mapping Phaser, mais pas teste.
