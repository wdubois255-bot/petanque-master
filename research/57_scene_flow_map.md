# 57 — Scene Flow Map (QA Reference)

Complete scene transition map for Petanque Master.
Source of truth for QA testing of scene navigation.


## 1. Scene Inventory

| # | Scene Key | File | Purpose |
|---|-----------|------|---------|
| 1 | `BootScene` | `BootScene.js` | Asset loading, spritesheet composition, portrait generation. Auto-transitions to TitleScene. |
| 2 | `TitleScene` | `TitleScene.js` | Main menu hub. Press start, main menu (6 buttons), settings, save slots. |
| 3 | `CharSelectScene` | `CharSelectScene.js` | Character selection grid (arcade/quickplay). Only Rookie selectable in arcade mode. |
| 4 | `QuickPlayScene` | `QuickPlayScene.js` | Quick play configuration (4 tabs: personnages, equipement, terrain, reglages). |
| 5 | `ArcadeScene` | `ArcadeScene.js` | Arcade mode hub. Progress track, narrative interludes, match launcher. |
| 6 | `VSIntroScene` | `VSIntroScene.js` | Pre-match VS animation + optional pre-match dialogue. |
| 7 | `PetanqueScene` | `PetanqueScene.js` | Core match scene. Terrain, physics, aiming, AI, scoring. |
| 8 | `ResultScene` | `ResultScene.js` | Post-match results. Score, stars, stats, galets, post-match dialogue, character unlock. |
| 9 | `LevelUpScene` | `LevelUpScene.js` | Rookie stat distribution (4 stats, 1-4 hotkeys). |
| 10 | `ShopScene` | `ShopScene.js` | Boutique. 3 tabs: boules, cochonnets, capacites. |
| 11 | `TutorialScene` | `TutorialScene.js` | 5-page tutorial (paginated). |
| 12 | `PlayerScene` | `PlayerScene.js` | "Mon Perso" — Rookie stats, equipped items, match history. |
| 13 | `IntroScene` | `IntroScene.js` | Story intro (Le Papet dialogue + boule choice). DEAD CODE — transitions to OverworldScene. |
| 14 | `OverworldScene` | `OverworldScene.js` | Top-down exploration (Tiled maps, NPCs). DEAD CODE — never reached in current flow. |
| 15 | `SpriteTestScene` | `SpriteTestScene.js` | Dev prototype for throw animation (not in config scene list but file exists). |
| 16 | `DevTestScene` | `DevTestScene.js` | Developer-only: sprite gallery, terrain preview, UI gallery. Triple-click logo to access. |


## 2. Transition Map

### Primary Flow (ASCII)

```
                           BootScene
                              |
                              v
                          TitleScene
                         /    |    \       \       \        \
                        /     |     \       \       \        \
                       v      v      v       v       v        v
               "JOUER"   CharSelect  QuickPlay  Player  Shop  Settings
              (PetanqueScene) |      Scene     Scene   Scene  (modal)
                   |          |        |
                   |          v        |
                   |     ArcadeScene   |
                   |          |        |
                   |          v        v
                   |     VSIntroScene <--+
                   |          |         |
                   v          v         |
                PetanqueScene <---------+
                        |
                        v
                   ResultScene
                   /         \
                  v           v
           LevelUpScene    [return directly]
                  |            |
                  v            v
           ArcadeScene    QuickPlayScene
           or returnScene or TitleScene
```

### Detailed Transition Table

| From | To | Trigger | Data Passed |
|------|----|---------|-------------|
| **BootScene** | TitleScene | Auto (create complete) | None |
| **TitleScene** | PetanqueScene | "JOUER" button (index 0) | `{ terrain, difficulty, playerCharacter, opponentCharacter, returnScene: 'TitleScene', ... }` |
| **TitleScene** | CharSelectScene | "MODE ARCADE" (index 1) | `{ mode: 'arcade' }` |
| **TitleScene** | QuickPlayScene | "PARTIE RAPIDE" (index 2) | None |
| **TitleScene** | PlayerScene | "MON PERSO" (index 3) | None |
| **TitleScene** | ShopScene | "BOUTIQUE" (index 4) | None |
| **TitleScene** | ArcadeScene | FTUE redirect (first play, no tutorial done) | None |
| **TitleScene** | DevTestScene | Triple-click logo | None |
| **CharSelectScene** | ArcadeScene | Character confirmed | `{ playerCharacter, ... }` |
| **CharSelectScene** | TitleScene | ESC / Back | None |
| **ArcadeScene** | VSIntroScene | "COMBATTRE" / SPACE / ENTER | `{ playerCharacter, opponentCharacter, terrain, terrainName, roundNumber, matchData, preMatchDialogue }` |
| **ArcadeScene** | TitleScene | ESC | None |
| **ArcadeScene** | CharSelectScene | Fallback (no playerCharacter) | `{ mode: 'arcade' }` |
| **QuickPlayScene** | PetanqueScene | "JOUER" / ENTER / SPACE | `{ terrain, difficulty, format, playerCharacter, opponentCharacter, returnScene: 'QuickPlayScene', ... }` (via UIFactory.transitionTo) |
| **QuickPlayScene** | TitleScene | UIFactory.addBackButton ESC | None |
| **VSIntroScene** | PetanqueScene | Auto after VS animation + dialogue | `{ terrain, difficulty, format, opponentName, returnScene, playerCharacter, opponentCharacter, arcadeState, ... }` |
| **PetanqueScene** | ResultScene | Game over (via PetanqueEngine) | `{ won, scores, playerCharacter, opponentCharacter, terrainName, returnScene, arcadeState, galetsEarned, matchStats, postMatchDialogue, unlocksOnWin }` |
| **PetanqueScene** | TitleScene | Pause > "Quitter" | None |
| **PetanqueScene** | returnScene | Pause > "Quitter" (if returnScene set) | None |
| **ResultScene** | LevelUpScene | Arcade + Rookie + XP > 0 | `{ pointsToDistribute, currentStats, totalPoints, returnScene: 'ArcadeScene', returnData: { arcadeState... } }` |
| **ResultScene** | ArcadeScene | Arcade + (no XP or non-Rookie) | `{ playerCharacter, currentRound, wins, losses, matchResults, lastMatchResult }` |
| **ResultScene** | LevelUpScene | QuickPlay + Rookie + XP > 0 | `{ pointsToDistribute, currentStats, totalPoints, returnScene: 'QuickPlayScene', returnData: {} }` |
| **ResultScene** | returnScene or TitleScene | QuickPlay + no XP | None |
| **ResultScene** | TitleScene | "MENU" button or ESC (non-arcade) | None |
| **LevelUpScene** | returnScene | ENTER confirm (with returnData) | `returnData` (passed through from init) |
| **LevelUpScene** | TitleScene | ESC | None (BUG: should go to returnScene) |
| **ShopScene** | TitleScene | ESC / Back button | None |
| **TutorialScene** | TitleScene | "J'AI COMPRIS" / ESC / Last page ENTER | None |
| **PlayerScene** | TitleScene | ESC / Back button | None |
| **DevTestScene** | TitleScene | ESC / "RETOUR" button | None |
| **IntroScene** | OverworldScene | Dialogue complete + boule choice | `{ map, spawnX, spawnY }` (DEAD CODE) |
| **SpriteTestScene** | TitleScene | ESC | None |


### Back/ESC Paths

| Scene | ESC Action |
|-------|------------|
| TitleScene (pressstart mode) | No effect |
| TitleScene (main menu) | No effect (top-level) |
| TitleScene (slots menu) | Return to main menu |
| TitleScene (settings modal) | Close settings, return to main menu |
| CharSelectScene | Back to TitleScene |
| ArcadeScene | Back to TitleScene |
| QuickPlayScene | Back to TitleScene (via UIFactory.addBackButton) |
| VSIntroScene | No ESC handler (must wait for animation) |
| PetanqueScene | AimingSystem: cancel current aim. P key: pause menu. |
| ResultScene (arcade) | `_returnToArcade()` (same as Continue) |
| ResultScene (other) | Back to TitleScene |
| LevelUpScene | Back to TitleScene (BUG: should go to returnScene) |
| ShopScene | Back to TitleScene |
| TutorialScene | Back to TitleScene |
| PlayerScene | Back to TitleScene |
| DevTestScene | Back to TitleScene |


## 3. Data Passed Per Transition

### PetanqueScene.init(data) expects:

```js
{
    terrain: string,            // terrain id ('village', 'parc', etc.) or surface ('terre', 'herbe')
    difficulty: string,         // 'easy' | 'medium' | 'hard'
    format: string,             // 'tete_a_tete' (always for now)
    opponentName: string,
    returnScene: string|null,   // scene to return to after match
    personality: object|null,   // AI personality from characters.json
    playerCharacter: object,    // full character object with stats
    opponentCharacter: object,
    playerCharId: string,
    opponentId: string,
    arcadeState: object|null,   // { playerCharacter, currentRound, wins, losses, matchResults }
    arcadeRound: number|null,
    localMultiplayer: boolean,
    bouleType: string,          // 'acier', 'bronze', etc.
    cochonnetType: string,      // 'classique', 'bleu', etc.
    postMatchWin: array|null,   // dialogue on win
    postMatchLose: array|null,  // dialogue on loss
    unlocksOnWin: string|null   // character id to unlock
}
```

### ResultScene.init(data) expects:

```js
{
    won: boolean,
    scores: { player: number, opponent: number },
    playerCharacter: object,
    opponentCharacter: object,
    terrainName: string,
    returnScene: string,        // 'ArcadeScene' | 'QuickPlayScene' | 'TitleScene'
    arcadeState: object|null,   // full arcade state for continuation
    matchStats: object,         // menes, carreaux, biberons, etc.
    galetsEarned: number,
    postMatchDialogue: array|null,
    unlocksOnWin: string|null
}
```

### LevelUpScene.init(data) expects:

```js
{
    pointsToDistribute: number,  // typically ROOKIE_XP_ARCADE or ROOKIE_XP_QUICKPLAY
    currentStats: object,        // { precision, puissance, effet, sang_froid }
    totalPoints: number,         // cumulative points (triggers abilities at 18/26/34)
    returnScene: string,         // 'ArcadeScene' | 'QuickPlayScene'
    returnData: object,          // passed through to scene.start(returnScene, returnData)
    newAbility: string|null      // ability name to show banner
}
```

### VSIntroScene.init(data) expects:

```js
{
    playerCharacter: object,
    opponentCharacter: object,
    terrain: string,
    terrainName: string,
    roundNumber: number|null,
    introText: string,
    matchData: object,           // { difficulty, format, bouleType, cochonnetType, returnScene, arcadeState, ... }
    preMatchDialogue: array|null
}
```

### ArcadeScene.init(data) expects:

```js
{
    playerCharacter: object|null,  // null on first entry (forces Rookie)
    currentRound: number,          // 1-5
    wins: number,
    losses: number,
    matchResults: array,           // [{ round, won }, ...]
    lastMatchResult: object|null   // { won: boolean }
}
```


## 4. Known Bugs

### BUG-01: QuickPlayScene missing `_shutdown()` method
- **Severity**: Medium (memory leak)
- **Detail**: QuickPlayScene has no `_shutdown()` method and never calls `this.events.on('shutdown', ...)`. Keyboard listeners registered via `_setupKeyboard()` are never cleaned up. On scene reuse, listeners accumulate.
- **Listeners at risk**: `keydown-ONE` through `keydown-FOUR`, `keydown-LEFT/RIGHT/UP/DOWN`, `keydown-ENTER`, `keydown-SPACE`.
- **Fix**: Add `_shutdown()` with `this.input.keyboard.removeAllListeners()` and `this.tweens.killAll()`. Register in `create()` with `this.events.on('shutdown', this._shutdown, this)`.

### BUG-02: QuickPlayScene ESC handler via UIFactory only
- **Severity**: Low
- **Detail**: QuickPlayScene relies on `UIFactory.addBackButton(this, 'TitleScene')` for ESC handling. This works but the ESC listener is registered by UIFactory and never explicitly cleaned up by the scene. Combined with BUG-01 (no _shutdown), this can cause stale ESC handlers.
- **Note**: UIFactory binds ESC via `scene.input.keyboard.on('keydown-ESC', ...)`, which would be cleaned by a proper _shutdown.

### BUG-03: LevelUpScene ESC goes to TitleScene instead of returnScene
- **Severity**: Medium (breaks flow)
- **Detail**: Line 179: `this.input.keyboard.on('keydown-ESC', () => this.scene.start('TitleScene'))`. This ignores `this.returnScene` (which could be 'ArcadeScene' or 'QuickPlayScene'). Player in mid-arcade who presses ESC loses their progress context.
- **Fix**: Replace with `this.scene.start(this.returnScene, this.returnData)` or at minimum `this.scene.start(this.returnScene || 'TitleScene')`.

### BUG-04: ResultScene Continue button gated on `_postDialogDone`
- **Severity**: Low (edge case)
- **Detail**: The "CONTINUER" / "REJOUER" button checks `if (this._postDialogDone)` before acting. The `_postDialogDone` flag is set by `afterEverything()` which runs after post-match dialogue and character unlock. If dialogue or unlock fails/errors silently, the button stays permanently disabled.
- **Mitigation**: A safety timeout (3s for unlock dismissal) and keyboard handlers are added separately, but the button click handler has no timeout fallback.
- **Impact**: If `postMatchDialogue` array is provided but contains invalid data (e.g., missing `.text` property), the typewriter could error, leaving `_postDialogDone = false` forever for click. Keyboard handlers (SPACE/ENTER) are added in `_addInputHandlers` which also waits for `_postDialogDone` in arcade mode but not in quickplay mode.

### BUG-05: IntroScene transitions to non-existent OverworldScene flow
- **Severity**: None (dead code, never reached)
- **Detail**: IntroScene (line 225) calls `this.scene.start('OverworldScene', ...)`. OverworldScene exists in config but is never reached from any live flow. IntroScene itself is never started by any other scene in the current build.
- **Note**: Both scenes are vestiges of Phase D ("L'Heritier de la Ciotat" story mode). Keep for future use but do not test.

### BUG-06: VSIntroScene has no ESC handler
- **Severity**: Low
- **Detail**: During the VS animation and pre-match dialogue, there is no way to go back. SPACE/ENTER skip the animation forward but ESC does nothing. Player must wait for the animation to complete or skip it with SPACE.
- **Mitigation**: VS animation auto-skips after 2nd view per session (vsIntroCount > 2).


## 5. init() Reset Checklist

Per CLAUDE.md rule: "Phaser reutilise les scenes : TOUJOURS definir init() avec reset de tous les flags."

| Scene | Flags Reset in init() | Missing Resets |
|-------|----------------------|----------------|
| BootScene | `_loadComplete` | OK |
| TitleScene | `_menuButtons, _selectedIndex, _mode, _inputEnabled, _menuContainer, _pressStartTween, _transitioning` | OK |
| CharSelectScene | `mode, arcadeRound, returnData, _selectedIndex, _confirmed, _uiElements, _transitioning` | OK |
| QuickPlayScene | `_transitioning, _activeTab, _p1Index, _p2Index, _bouleIndex, _cochonnetIndex, _terrainIndex, _modeIndex, _difficultyIndex, _formatIndex, _tabObjects, _tabBarObjects, _bannerObjects, _bottomObjects, _particles, _p1Sprite, _p2Sprite, _p1BreathTween, _p2BreathTween, _p1NameText, _p2NameText, _summaryLabel, _allBoules, _allCochonnets, _ownedBoules, _ownedCochonnets, _allTerrains, _charsData` | OK (comprehensive) |
| ArcadeScene | `playerCharacter, currentRound, wins, losses, matchResults, lastMatchResult` | `_launched, _endingShown` reset in create() not init() (acceptable but inconsistent) |
| VSIntroScene | `_started, _canSkip, _typewriterTimer, _dialogIndex, _dialogAdvanceFn` + all data params | OK |
| PetanqueScene | All data params + `_gamePaused, _pauseContainer` | OK |
| ResultScene | All data params + `_returning, _postDialogDone` | OK |
| LevelUpScene | `_confirmed, pointsRemaining, ...baseStats, newStats, totalPoints, returnScene, returnData, newAbility` | OK |
| ShopScene | `activeTab, selectedIndex, _cardElements, _previewElements, _tabElements, _purchasing, _scrollOffset` | OK |
| TutorialScene | `_page, _inputEnabled, _transitioning` | OK |
| PlayerScene | `_activeTab, _contentElements, _hoverTooltip` | OK |
| IntroScene | `_phase, _dialogueIndex, _selectedBoule, _uiElements` | OK |
| OverworldScene | `spawnMap, spawnX, spawnY` | `_assetsGenerated` set in constructor, not reset in init() (intentional: avoid re-generating assets) |
| SpriteTestScene | `_cycling, continuousChar, keyframeChar, phaseLabel` | OK |
| DevTestScene | `_sprites, _uiElements, _currentScale, _currentTab` | OK |


## 6. Scene Registration Order (config.js)

```
BootScene, TitleScene, CharSelectScene, QuickPlayScene, ArcadeScene,
VSIntroScene, ResultScene, IntroScene, OverworldScene, PetanqueScene,
LevelUpScene, ShopScene, TutorialScene, PlayerScene, DevTestScene
```

Note: SpriteTestScene exists as a file but is NOT registered in config.js.
