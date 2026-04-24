# Baseline Mobile — 24/04/2026

Snapshot de l'état du jeu avant portage mobile portrait.
Phase 0 du plan (voir `memory/project_mobile_strategy.md`).

---

## 1. Infrastructure ajoutée (Phase 0)

| Fichier | Role |
|---|---|
| `src/utils/Layout.js` | Module central : détection orientation, dimensions `W/H`, ancres UI, safe insets |
| `src/utils/Constants.js` | Ajout `GAME_WIDTH_PORTRAIT=480`, `GAME_HEIGHT_PORTRAIT=960` |
| `src/config.js` | Utilise `Layout.W/H` (au lieu de GAME_WIDTH/HEIGHT hardcodés). `input.activePointers=3` pour multi-touch |
| `tests/Layout.test.js` | 9 tests unit : API, mode desktop par défaut (jsdom), ancres, helpers |

**Non-régression** : 3167/3167 tests Vitest OK (3158 existants + 9 nouveaux Layout).

---

## 2. Détection mode

`Layout.mode` est **figé au boot** (pas de bascule runtime, trop coûteux).

- `landscape` (desktop default) : 832×480 — comportement historique, **itch.io publié inchangé**
- `portrait` (mobile) : 480×960 — ratio 1:2 pour le terrain pétanque

Critères de basculement portrait :
- `navigator.userAgent` match `/Mobi|Android|iPhone|iPad|iPod/i` **OU**
- `window.innerWidth < 800` **ET** `matchMedia('(orientation: portrait)').matches` (simulateur DevTools)

---

## 3. Inventaire clavier → tactile à ajouter (pour Phase 4)

Chaque `keyboard.on(...)` / `addKey(...)` ci-dessous doit avoir un équivalent tactile
(ou être neutralisé si déjà couvert par un `pointerdown` sur un bouton UI).
**Desktop garde le clavier intégralement** — on ajoute, on ne remplace pas.

### Scènes menu (priorité haute)

| Scène | Touches | Action | Équivalent tactile actuel ? | À faire Phase 4 |
|---|---|---|---|---|
| [TitleScene](../../src/scenes/TitleScene.js#L50-L53) | ↑↓, ENTER, SPACE, ESC | Navigation menu | Partiel (boutons existent) | Vérifier `setInteractive` sur chaque `_menuButtons[i]` |
| [CharSelectScene](../../src/scenes/CharSelectScene.js#L84-L86) | ↑↓←→, SPACE, ENTER | Navigation grille + confirm | Boutons perso cliquables ✅ | RAS, audit visuel |
| [QuickPlayScene](../../src/scenes/QuickPlayScene.js#L1112-L1124) | 1-4 (onglets), ←→↑↓, ENTER, SPACE, ESC | Onglets + sélection + launch | Boutons onglets ? À vérifier | Ajouter bouton "Lancer" visible, tactile |
| [ShopScene](../../src/scenes/ShopScene.js#L728-L737) | 1-3 (onglets), ←→↑↓, ENTER, SPACE | Onglets + achat | Onglets tactiles (confirmé session 13) | Confirmer bouton acheter tactile |
| [LevelUpScene](../../src/scenes/LevelUpScene.js#L185-L188) | hotkey par stat, ENTER, ESC | +/- stats + confirm | À vérifier | Ajouter boutons +/- explicites tactiles |
| [PlayerScene](../../src/scenes/PlayerScene.js#L52-L54) | 1-3 onglets | Navigation onglets | À vérifier | Onglets tactiles |
| [TutorialScene](../../src/scenes/TutorialScene.js#L86-L87) | ↑↓, ENTER | Nav pages | Flèches UI présentes ? | Swipe ou flèches tactiles |
| [CreditsScene](../../src/scenes/CreditsScene.js#L86-L87) | ESC, SPACE | Retour | Bouton retour ? | Ajouter bouton retour tactile |
| [VSIntroScene](../../src/scenes/VSIntroScene.js#L192-L193) ×2 | SPACE, ENTER | Skip intro | Tap anywhere à ajouter | `scene.input.on('pointerdown', skip)` |
| [ArcadeScene](../../src/scenes/ArcadeScene.js#L291-L1161) ×10 | SPACE, ENTER, ESC | Dialogues + transitions | DialogBox tactile ✅ partiel | Bouton "Continuer" dans chaque transition |

### Match (priorité haute — cœur du jeu)

| Fichier | Touches | Action | Équivalent tactile | À faire Phase 3 |
|---|---|---|---|---|
| [AimingSystem.js:96](../../src/petanque/AimingSystem.js#L96) | ESC | Cancel mode select | Bouton croix ? | Ajouter bouton cancel tactile |
| [AimingSystem.js:267-272](../../src/petanque/AimingSystem.js#L267) | 1,2,3 | Sélection mode (Demi/Plombée/Tir fer) | Boutons modes tactiles ✅ | Confirmer taille 56px+ |
| [AimingSystem.js:270-271](../../src/petanque/AimingSystem.js#L270) | ←→ | Navigation entre modes | Via tap direct ✅ | OK |
| [AimingSystem.js:272](../../src/petanque/AimingSystem.js#L272) | SPACE | Confirmer mode | Via tap ✅ | OK |
| [AimingSystem.js:457](../../src/petanque/AimingSystem.js#L457) | E | Spin lateral (off/←/→) | ❌ AUCUN | **Ajouter toggle HUD mobile (Phase 3)** |
| [AimingSystem.js:594](../../src/petanque/AimingSystem.js#L594) | F | Focus (Respire) | ❌ AUCUN | **Ajouter bouton HUD mobile (Phase 3)** |
| [AimingSystem.js:678](../../src/petanque/AimingSystem.js#L678) | C | Ability primaire | ❌ AUCUN | **Ajouter bouton HUD mobile (Phase 3)** |
| [AimingSystem.js:718](../../src/petanque/AimingSystem.js#L718) | V | Ability secondaire | ❌ AUCUN | **Ajouter bouton HUD mobile (Phase 3)** |
| [PetanqueScene.js:1772](../../src/scenes/PetanqueScene.js#L1772) | PAUSE_KEY | Menu pause | Bouton pause ? | Vérifier bouton pause tactile |
| [ScorePanel.js:158](../../src/ui/ScorePanel.js#L158) | TAB | Toggle vue score (?) | ❌ à confirmer | Bouton dédié si utilité |
| [ResultScene.js:549-768](../../src/scenes/ResultScene.js#L549) ×5 | SPACE, ENTER, ESC | Continuer/retour | Boutons présents ✅ | Confirmer tactiles |

### Sous-composants (partagés)

| Fichier | Touches | Action | Statut |
|---|---|---|---|
| [DialogBox.js:98-99](../../src/ui/DialogBox.js#L98) | SPACE, ENTER | Advance dialogue | Pointer existe ✅ ([DialogBox.js:100](../../src/ui/DialogBox.js#L100)) |
| [UIFactory.js:706](../../src/ui/UIFactory.js#L706) | ESC | Modal close | Bouton croix UI ✅ (à vérifier) |
| [Player.js:20-27](../../src/entities/Player.js#L20) | ZQSD + ←→↑↓, SPACE | Déplacement + action | ❌ Overworld réservé Phase D, low prio |

### Hors périmètre (dev/test)

| Fichier | Raison |
|---|---|
| [DevTestScene.js:84](../../src/scenes/DevTestScene.js#L84) | Scène dev, exclue en prod |
| [SpriteTestScene.js:85-87](../../src/scenes/SpriteTestScene.js#L85) | Scène test PixelLab, dev uniquement |

---

## 4. Totaux

- **Occurrences clavier dans `src/`** : 104 (scènes + ui + petanque + entities)
- **Scènes actives** : 15
- **Scènes avec action critique SANS équivalent tactile** : **1** (AimingSystem abilities : E, F, C, V)
- **Scènes où le tactile existe mais reste à auditer** : 9

**Conclusion Phase 4** : le gap réel est **concentré sur les 4 touches d'abilities du match** (E/F/C/V).
Le reste est de l'audit de parité (boutons existent probablement, mais à confirmer visuellement).

---

## 5. Performance & visuel (état ACTUEL, pré-portage)

> TODO : à compléter lors de la Phase 1 par l'agent qui génère les baselines Playwright.
> Commandes à lancer depuis `playwright.config.js` après ajout des projects mobile.

### Métriques cibles à mesurer
- FPS médian PetanqueScene pendant vol de boule (Pixel 5 CPU throttle 4x)
- Taille bundle Vite build (`npm run build` → mesure dist/)
- Temps de chargement Boot→Title sur 3G lent (Lighthouse)
- Memory usage après 3 matchs consécutifs

### Captures à générer
- Title, CharSelect, QuickPlay, PetanqueScene in-match, Shop, Result
- Sur Pixel 5 (393×851) et iPhone SE (375×667)
- État ACTUEL = portrait affiche l'overlay "Tournez votre écran" → capture = l'overlay lui-même

---

## 6. Risques identifiés à surveiller en Phase 1-2

- **R1** : Terrain déjà portrait-shaped (`TERRAIN_WIDTH=180`, `TERRAIN_HEIGHT=420`) — **bonne nouvelle**, pas de rotation nécessaire. Le switch portrait = juste repositionner la box terrain dans 480×960.
- **R2** : `IS_MOBILE` constant dans Constants.js est indépendant de `Layout.isMobile`. Déduplication à faire en Phase 1 : remplacer les usages `IS_MOBILE` par `Layout.isMobile`.
- **R3** : Baselines visual regression Playwright (18 fichiers) : toutes à régénérer pour le mode portrait. Prévoir 1 session dédiée après Phase 2.
- **R4** : itch.io iframe sandbox peut bloquer `orientation.lock()`, `vibrate()`, `fullscreen`. Test obligatoire sur l'URL publiée avant Phase 7.

---

## 7. Validation Phase 0 — critères d'acceptation

- [x] `src/utils/Layout.js` créé avec API complète
- [x] `GAME_WIDTH_PORTRAIT=480`, `GAME_HEIGHT_PORTRAIT=960` dans Constants.js
- [x] `src/config.js` utilise Layout dynamiquement + `input.activePointers=3`
- [x] `tests/Layout.test.js` : 9/9 tests OK
- [x] Vitest suite complète : 3167/3167 OK (aucune régression desktop)
- [x] Baseline documentée (ce fichier)
- [ ] Captures Playwright — différé, à faire par l'agent Phase 1 qui aura besoin des devices mobiles setup
