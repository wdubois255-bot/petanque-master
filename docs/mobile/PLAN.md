# Plan portage mobile — Petanque Master

> Document de référence pour agents Sonnet. Chaque phase est autonome.
> Décisions cadre : voir `memory/project_mobile_strategy.md`
> État actuel : voir `docs/mobile/BASELINE.md`

## Décisions cadre (figées)

| Clé | Décision |
|---|---|
| D1 | Dual orientation : desktop paysage 832×480 (inchangé), mobile portrait 480×960 |
| D2 | Résolution mobile 480×960 (ratio 1:2, met en valeur longueur terrain pétanque) |
| D3 | Drag-and-release down→up (déjà implémenté dans AimingSystem, aucun changement ergonomie) |
| D4 | Sprites throw_up : **non nécessaires** — sprites throw existants sont déjà de dos vue 3/4, OK en portrait |
| — | Tout mobile en portrait (pas d'alternance scène). Zéro rotation forcée |
| — | Web-only (pas Capacitor/TWA). Itch.io + CrazyGames + Poki = wrappers web |
| — | PWA : manifest OUI, service worker NON |

## Architecture

Module central : **`src/utils/Layout.js`** (déjà créé Phase 0).
Expose `Layout.mode`, `Layout.W`, `Layout.H`, `Layout.isMobile`, `Layout.isPortrait`,
`Layout.isLandscape`, `Layout.safe`, `Layout.anchor(name)`, `Layout.relX/relY`.

**Règle absolue** : toute nouvelle position UI dépendant de l'orientation DOIT passer par
Layout (ancres ou helpers). Ne JAMAIS lire `GAME_WIDTH`/`GAME_HEIGHT` directement dans
une scène pour un positionnement UI — ces constantes restent le "desktop default".

## Phases

### Phase 0 — Infrastructure ✅ TERMINÉE (24/04/2026)

Livré : Layout.js, constantes portrait, config dynamique, tests Layout, BASELINE.md.
3167/3167 tests Vitest OK (aucune régression desktop).

### Phase 1 — PetanqueScene portrait (le cœur)

**Objectif** : le match se joue en portrait 480×960 sur mobile, identique en paysage sur desktop.

**Fichiers** :
- `src/petanque/TerrainRenderer.js` : coordonnées décors (banc, arbres, crown) via `Layout.anchor()`
- `src/scenes/PetanqueScene.js` : `throwCircle`, watch positions joueur/adversaire en portrait
- `src/petanque/EngineRenderer.js` : prédiction trajectoire adaptée, dust particles OK
- `src/utils/Constants.js` : `TERRAIN_WIDTH_PORTRAIT`, `TERRAIN_HEIGHT_PORTRAIT`, `THROW_CIRCLE_Y_OFFSET_PORTRAIT`
- `src/ui/ScorePanel.js` : bandeau horizontal fin en haut écran (portrait)
- `src/petanque/AimingSystem.js` : selector modes en bas de l'écran (portrait), juste la position

**Physique** : AUCUN changement. Ball.js, PetanqueEngine.js, Cochonnet.js restent coordonnées internes.

**Critères d'acceptation** :
- DevTools Pixel 5 portrait : match complet jouable, 6 boules, scoring, retour Result
- Tests Vitest physique : 100% OK (actuellement 570 tests)
- FPS > 55 sur Pixel 5 CPU throttle 4x
- Desktop paysage : **pixel-identique** à l'ancien rendu (non-régression)

**Bonne nouvelle découverte Phase 0** : `TERRAIN_WIDTH=180, TERRAIN_HEIGHT=420` sont déjà portrait-shaped. Le terrain n'est pas à pivoter, juste à repositionner dans 480×960.

### Phase 2 — Scènes menu portrait

**Objectif** : toutes les autres scènes adaptées au portrait, desktop paysage intact.

**Parallélisable avec Phase 1** (fichiers disjoints).

**Fichiers (1 scène par commit idéalement)** :
- `src/scenes/TitleScene.js` — logo haut, menu vertical
- `src/scenes/CharSelectScene.js` — grille 3×4 → 2×6
- `src/scenes/QuickPlayScene.js` — onglets horizontaux → verticaux
- `src/scenes/ArcadeScene.js` — 5 matchs scroll vertical
- `src/scenes/VSIntroScene.js` — portraits empilés
- `src/scenes/LevelUpScene.js` — stats empilées
- `src/scenes/ShopScene.js` — 3 onglets fin top + liste verticale
- `src/scenes/TutorialScene.js` — pages full screen
- `src/scenes/PlayerScene.js` — panels verticaux
- `src/scenes/ResultScene.js` — score + confettis centrés
- `src/scenes/CreditsScene.js` — défilement vertical
- `src/scenes/IntroScene.js` — texte narratif centré
- `src/scenes/BootScene.js` — loading bar centre

**Méthode par scène** :
1. Lire, identifier coord hardcodées
2. Remplacer par `Layout.anchor(...)` ou calcul sur `Layout.W/H`
3. Tester desktop (screenshot avant/après pixel-perfect)
4. Tester mobile portrait (Playwright DevTools)

**Critères d'acceptation par scène** :
- Desktop : rendu pixel-identique à la baseline
- Portrait mobile : aucun texte tronqué, aucun bouton hors écran, navigation complète
- Parcours test : Title → Arcade → Match → Result → Shop sans bug

### Phase 3 — AimingSystem HUD abilities mobile

**Objectif** : les 4 touches d'abilities (E, F, C, V) ont des boutons tactiles visibles en mobile.

**Dépend de** : Phase 1.

**Fichiers** :
- `src/petanque/AimingSystem.js` :
  - Bouton Focus (F) : 56×56 HUD droite portrait, compteur charges visible
  - Bouton Ability primaire (C) : 56×56 sous Focus
  - Bouton Ability secondaire (V) : 56×56 sous Ability primaire
  - Toggle retro (R) : petit bouton
  - Toggle spin lateral (E) : 3 états visuels (off/←/→)
  - Bouton ciblage cochonnet (B) : contextuel
  - Visibles **uniquement si `Layout.isMobile`**. Desktop garde le clavier.
- `src/ui/UIFactory.js` : nouveau helper `addAbilityButton(scene, x, y, icon, charges, onTap)`
- `public/data/lang/fr.json` + `en.json` : clés mobile pour hints

**Critères d'acceptation** :
- Match jouable 100% tactile sur mobile, zéro touche clavier nécessaire
- Feedback visuel au tap (flash 100ms + sfx)
- Compteurs charges corrects
- Desktop : apparence inchangée, clavier fonctionne

### Phase 4 — Input tactile scènes menu + Audio iOS

**Parallélisable avec Phase 3**.

**Fichiers input** :
- Audit et corrections scène par scène selon tableau BASELINE.md section 3
- Focus : OverworldScene (tap-to-move, low prio Phase D)

**Fichiers audio** :
- `src/utils/SoundManager.js` : `initAudioOnFirstGesture()` avec listener `{once:true}` global, `visibilitychange` pour pause/resume
- `src/main.js` : hook `initAudioOnFirstGesture()` avant `new Phaser.Game(config)`

**Critères d'acceptation** :
- iOS Safari emulation : son sort au premier tap Title
- Background onglet → son coupé, foreground → son reprend
- Toutes les scènes jouables 100% tactile

### Phase 5 — Safe areas + polish visuel

**Dépend de** : Phases 1-4.

**Fichiers** :
- `index.html` : `#game-container` padding `env(safe-area-inset-*)` fallback 0
- `src/utils/Layout.js` : `Layout.safe` lit via `getComputedStyle`
- Les panels bas d'écran reçoivent offset `safe.bottom`
- Remplacer hover par pointerdown flash dans UIFactory

**Critères d'acceptation** :
- iPhone 14 Pro Playwright : aucune UI derrière notch ou home indicator
- Tous boutons tactiles ont feedback visuel
- Zéro régression desktop

### Phase 6 — Tests mobile CI + perf

**Dépend de** : Phases 1-5.

**Fichiers** :
- `playwright.config.js` : projects `iPhone SE`, `iPhone 14`, `Pixel 5`
- `tests/e2e/mobile-smoke.spec.js` : parcours nominal Boot→Result, FPS>50, 0 erreur console
- `tests/e2e/mobile-input.spec.js` : toutes abilities via boutons HUD + drag-and-release
- `tests/e2e/mobile-visual.spec.js` : baselines visual regression portrait
- `.github/workflows/qa.yml` : job `mobile-e2e` avec `--grep @mobile`

**Optimisations si FPS < 55** :
- Cache `arrowGfx` dans AimingSystem (actuellement redraw chaque frame)
- Réduire `DUST_MAX_SIMULTANEOUS_MOBILE` de 4 à 2

**Critères d'acceptation** :
- CI GitHub Actions mobile-e2e vert sur 3 devices
- Lighthouse mobile perf > 85

### Phase 7 — Manifest PWA

**Dépend de** : Phase 5.

**Fichiers** :
- `public/manifest.webmanifest` : name, short_name, start_url, `display: "fullscreen"`, `orientation: "portrait"`, icons 192+512+maskable
- `public/assets/icons/` : générer icon-192, icon-512, apple-touch-180 depuis logo
- `index.html` : `<link rel="manifest">` + `<link rel="apple-touch-icon">`

**Critères d'acceptation** :
- Lighthouse PWA "Installable" ✅
- "Ajouter à l'écran d'accueil" fonctionne Chrome Android

## Diagramme de dépendances

```
Phase 0 (infra) ✅
   ├── Phase 1 (PetanqueScene portrait) ──┐
   ├── Phase 2 (scènes menu portrait) ────┤
                                           ├── Phase 3 (aiming HUD mobile) ──┐
                                           ├── Phase 4 (input + audio) ──────┤
                                                                              ├── Phase 5 (safe areas)
                                                                              └── Phase 6 (tests CI)
                                                                                      │
                                                                                      └── Phase 7 (PWA manifest)
```

## Garde-fous transverses (valables pour TOUTE phase)

1. **Non-régression desktop** : desktop paysage 832×480 doit rester pixel-identique. Protège l'itch.io publié.
2. **CLAUDE.md** :
   - Pas de `localStorage` direct → passer par SaveManager
   - Pas de `window.__*` → utiliser `this.registry` Phaser
   - Pas de valeurs hardcodées → Constants.js / JSON
   - Pas de `console.log` en production
   - Phaser scene reuse : `init()` obligatoire, reset tous les flags
3. **Tests** : `npx vitest run` doit passer à chaque commit
4. **Commits atomiques** : 1 scène = 1 commit idéalement, messages conventionnels (feat/fix/chore)
5. **Feedback utilisateur** : feature → test → commit (voir `memory/feedback_testing_process.md`)

## Risques résiduels

- **R1 Phaser 4 RC** : `scale.startFullscreen`, `input.activePointers`, multi-touch — compatibilité 4.0.0-rc.6 à valider en cas de problème
- **R2 iframe itch.io** : `orientation.lock`, `vibrate`, `fullscreen` peuvent être sandboxés. Tester sur URL publiée, pas que localhost.
- **R3 Visual regression** : Phase 1-2 génèrent beaucoup de nouvelles baselines portrait. Prévoir 1 session juste pour curer les snapshots.
- **R4 Opponent watch position** : en portrait, l'adversaire doit être latéralement visible sans chevaucher le terrain. Zone de vigilance Phase 1.
