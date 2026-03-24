# 58 — Keybindings Reference (QA Reference)

Complete keyboard, mouse, and touch control mapping for every scene in Petanque Master.


## 1. Global Controls

These controls appear in multiple scenes via shared patterns:

| Key | Global Action | Implementation |
|-----|---------------|----------------|
| **SPACE** | Confirm / Advance dialogue / Skip animation | Per-scene (not a single global handler) |
| **ENTER** | Confirm / Advance dialogue | Per-scene |
| **ESC** | Back / Cancel / Menu | Per-scene (often via `UIFactory.addBackButton`) |
| **Click** | Confirm / Advance dialogue | Per-scene via `pointerdown` |


## 2. Per-Scene Controls

### BootScene

No interactive controls. Auto-transitions after loading.

### TitleScene

| Key | Action | Context |
|-----|--------|---------|
| SPACE | Advance from "press start" / Confirm menu selection | All modes |
| ENTER | Same as SPACE | All modes |
| ESC | Back to previous menu level (slots -> main) | Slots, settings |
| UP / DOWN | Navigate menu items vertically | Main menu, slots, settings |
| LEFT / RIGHT | Navigate 2x2 grid layout / Adjust settings sliders | Main menu, settings |
| Triple-click logo | Open DevTestScene | Press start or main menu |

**Menu navigation grid** (main menu):
```
         [0: JOUER]
   [1: ARCADE] [2: RAPIDE]
   [3: PERSO]  [4: BOUTIQUE]
       [5: PARAMETRES]
```

### CharSelectScene

| Key | Action |
|-----|--------|
| LEFT / RIGHT / UP / DOWN | Navigate character grid |
| SPACE | Confirm selection |
| ENTER | Confirm selection |
| ESC | Back to TitleScene |

### QuickPlayScene

| Key | Action |
|-----|--------|
| 1 | Switch to tab "PERSONNAGES" |
| 2 | Switch to tab "EQUIPEMENT" |
| 3 | Switch to tab "TERRAIN" |
| 4 | Switch to tab "REGLAGES" |
| LEFT / RIGHT | Cycle within active tab (character, boule, terrain, mode) |
| UP / DOWN | Vertical navigation within tab content |
| ENTER | Launch game |
| SPACE | Launch game |
| ESC | Back to TitleScene (via UIFactory.addBackButton) |
| Click (no shift) | Select J1 character |
| Shift+Click / Right-click | Select J2 character |

### ArcadeScene

| Key | Action | Context |
|-----|--------|---------|
| SPACE | Advance narrative / Launch match | Narrative screen / Progress screen |
| ENTER | Advance narrative / Launch match | Same |
| ESC | Back to TitleScene | Progress screen |
| Click | Advance narrative / Launch match | Same |

### VSIntroScene

| Key | Action | Context |
|-----|--------|---------|
| SPACE | Advance pre-match dialogue / Skip VS animation | Dialogue / Animation |
| ENTER | Advance pre-match dialogue / Skip VS animation | Same |
| Click | Advance pre-match dialogue | Dialogue only |

No ESC handler.

### PetanqueScene (Match)

**See Section 3 for detailed match controls.**

| Key | Action |
|-----|--------|
| P | Toggle pause menu |
| ESC | Cancel current aim (AimingSystem) |
| TAB (hold) | Show ball ranking overlay |
| 1 | Select Roulette (low arc) |
| 2 | Select Demi-portee (medium arc) |
| 3 | Select Plombee (high arc) |
| T | Select Tir (shoot mode) |
| LEFT / RIGHT | Navigate shot mode selection |
| SPACE | Confirm shot mode selection |
| R | Toggle retro (backspin) |
| D | Toggle tir devant |
| F | Toggle Focus (Respire) |
| C | Toggle character ability |
| V | Toggle secondary ability (Rookie only) |
| Pointer drag | Aim and set power |
| Pointer release | Throw ball |
| SPACE / ENTER / Click | Skip game-over delay (go to ResultScene) |

**Pause menu** (PetanqueScene, when paused):
| Control | Action |
|---------|--------|
| Click "Reprendre" | Resume game |
| Click "Son: ON/OFF" | Toggle mute |
| Click "Quitter" | Exit to returnScene or TitleScene |
| P | Toggle pause (resume) |

### ResultScene

| Key | Action | Context |
|-----|--------|---------|
| SPACE | Advance post-match dialogue / Continue (after dialogue done) | Always |
| ENTER | Advance post-match dialogue / Continue (arcade) | Always |
| ESC | Return to arcade (if arcade) / TitleScene (if other) | After `_postDialogDone` |
| Click | Advance post-match dialogue / Continue/Replay/Menu buttons | Always |

**Note**: Continue/Replay button clicks are gated on `_postDialogDone` flag.

### LevelUpScene

| Key | Action |
|-----|--------|
| 1 | Add point to Precision |
| 2 | Add point to Puissance |
| 3 | Add point to Effet |
| 4 | Add point to Sang-froid |
| ENTER | Confirm distribution (when 0 points remaining) |
| ESC | Go to TitleScene (BUG: should go to returnScene) |

### ShopScene

| Key | Action |
|-----|--------|
| 1 | Switch to tab "Boules" |
| 2 | Switch to tab "Cochonnets" |
| 3 | Switch to tab "Capacites" |
| LEFT / RIGHT | Navigate items |
| UP / DOWN | Navigate items |
| ENTER | Purchase selected item |
| ESC | Back to TitleScene |

### TutorialScene

| Key | Action |
|-----|--------|
| LEFT | Previous page |
| RIGHT | Next page |
| ENTER | Finish tutorial (on last page) |
| ESC | Back to TitleScene |
| Click | Previous/Next buttons, "J'AI COMPRIS" |

### PlayerScene

| Key | Action |
|-----|--------|
| 1 | Switch to tab 1 (Stats) |
| 2 | Switch to tab 2 (Equipement) |
| 3 | Switch to tab 3 (Historique) |
| ESC | Back to TitleScene |

### IntroScene (dead code)

| Key | Action |
|-----|--------|
| SPACE | Advance dialogue / Confirm boule choice |
| ENTER | Advance dialogue / Confirm boule choice |
| LEFT / RIGHT | Cycle boule selection |
| Click | Advance dialogue |

### OverworldScene (dead code)

| Key | Action |
|-----|--------|
| Arrow keys | Move player |
| SPACE / ENTER | Interact with NPC |

### DevTestScene

| Key | Action |
|-----|--------|
| ESC | Back to TitleScene |
| Click tabs | Switch between SPRITES / TERRAINS / UI v2 |
| Click [-] / [+] | Adjust sprite scale |

### SpriteTestScene (not in config)

| Key | Action |
|-----|--------|
| SPACE | Start throw animation cycle |
| R | Restart scene |
| ESC | Back to TitleScene |


## 3. Match Controls (AimingSystem) — Detailed

### Shot Mode Selection (before aiming)

Displayed as a bottom panel with 4 options:

| Key | Label | Mode | Loft |
|-----|-------|------|------|
| 1 | Roulette | pointer | 0 (low arc, rolls far) |
| 2 | Demi-portee | pointer | 1 (medium arc) — DEFAULT |
| 3 | Plombee | pointer | 2 (high arc, stops short) |
| T | Tirer | tirer | Direct shot at opponent balls |
| LEFT / RIGHT | Cycle selection | — | — |
| SPACE | Confirm selection | — | — |

### Aiming Phase (after mode selected)

| Control | Action |
|---------|--------|
| Pointer drag down from throw circle | Set aim direction + power (distance = power) |
| Pointer release | Execute throw |
| ESC | Cancel aim (return to shot mode selection) |

### Toggle Modifiers (during aiming)

| Key | Toggle | Available When | Visual |
|-----|--------|----------------|--------|
| R | Retro (backspin) | Pointer mode (roulette has retroAllowed) + Tir mode | Bottom-right `[R] Retro` label |
| D | Tir devant | Tir mode only | Bottom-right `[D] Tir devant` label |
| F | Focus (Respire) | Any mode, charges > 0 | Top-left `F Respire` pill with charge dots |
| C | Character ability | Any mode, charges > 0 | Top-right ability pill |
| V | Secondary ability | Rookie only, charges > 0 | Below ability pill |

### Passive Controls (always active during match)

| Key | Action |
|-----|--------|
| TAB (hold) | Show ball ranking overlay (closest to cochonnet) |
| P | Open/close pause menu |

### Phase 3 Planned Controls (not yet implemented)

| Key | Action | Status |
|-----|--------|--------|
| E | Lateral spin toggle | PLANNED |
| B | Cochonnet targeting | PLANNED |


## 4. Conflict Analysis

### Key Conflicts by Context

| Key | Scenes Using It | Conflict? |
|-----|-----------------|-----------|
| **1** | QuickPlayScene (tab), LevelUpScene (stat), ShopScene (tab), PetanqueScene (roulette) | NO — different scenes |
| **2** | QuickPlayScene (tab), LevelUpScene (stat), ShopScene (tab), PetanqueScene (demi-portee) | NO |
| **3** | QuickPlayScene (tab), LevelUpScene (stat), ShopScene (tab), PetanqueScene (plombee) | NO |
| **4** | QuickPlayScene (tab), LevelUpScene (stat) | NO |
| **SPACE** | Nearly all scenes (confirm/advance) | NO — contextual per scene |
| **ENTER** | Nearly all scenes (confirm/advance) | NO — contextual per scene |
| **ESC** | PetanqueScene: cancel aim. Other scenes: back/menu. | INTENTIONAL — ESC is "cancel" in match, "back" elsewhere. P key handles pause. |
| **R** | PetanqueScene (retro toggle), SpriteTestScene (restart) | NO — different scenes |
| **T** | PetanqueScene (tir mode) | Unique to match |
| **TAB** | PetanqueScene (ranking overlay) | May conflict with browser tab switching — `addKey('TAB')` should prevent default |

### Within PetanqueScene

| Key | Shot Selection Phase | Aiming Phase | Paused |
|-----|---------------------|--------------|--------|
| 1/2/3 | Select mode | — | — |
| T | Select tir | — | — |
| R | — | Toggle retro | — |
| D | — | Toggle tir devant | — |
| F | Toggle focus | Toggle focus | — |
| C | Toggle ability | Toggle ability | — |
| V | Toggle secondary | Toggle secondary | — |
| ESC | — | Cancel aim | — |
| P | Toggle pause | Toggle pause | Toggle pause |
| TAB | — | Show ranking | — |
| SPACE | Confirm mode | — | — |

**No conflicts within PetanqueScene.** Keys are context-sensitive to the current phase.


## 5. Mobile / Touch Fallback

### Current Touch Support

| Control | Touch Equivalent | Status |
|---------|-----------------|--------|
| Pointer drag (aim) | Touch drag | WORKS (Phaser pointer events) |
| Pointer click (buttons) | Tap | WORKS |
| SPACE/ENTER (confirm) | Tap on button | WORKS (all confirmable elements have `setInteractive`) |
| ESC (back) | UIFactory back button (tap) | WORKS |
| P (pause) | Pause button (top-left corner, tap) | WORKS |
| TAB (ranking) | None | MISSING — no touch equivalent |
| 1/2/3/T (shot mode) | Tap on shot mode options | WORKS (hit zones) |
| R (retro) | Tap on `[R] Retro` label | WORKS |
| D (tir devant) | Tap on `[D] Tir devant` label | WORKS |
| F (focus) | Tap on focus pill | WORKS |
| C (ability) | Tap on ability pill | WORKS |
| V (secondary) | Tap on secondary pill | WORKS |
| Arrow keys (menu nav) | None (tap buttons directly) | PARTIAL — menus are clickable but no swipe nav |
| 1-4 (tab switch) | Tap tab labels | WORKS |

### Missing Touch Controls

| Feature | Priority | Proposed Solution |
|---------|----------|-------------------|
| TAB ranking overlay | HIGH | Add a small "classement" button near score panel, or long-press on score to toggle |
| Arrow key navigation in menus | LOW | All menus have clickable elements; touch-only users can tap directly |
| Keyboard shortcuts hint | MEDIUM | Hide keyboard hint text on touch devices; show touch icons instead |

### Touch-Specific Considerations

- `Phaser.Scale.FIT` with `CENTER_BOTH` handles responsive scaling
- All interactive elements use `setInteractive({ useHandCursor: true })` which works for touch
- Drag-to-aim works with touch via Phaser's unified pointer system
- No pinch-to-zoom (camera is fixed at 1x, brief zoom-pulse for slow-mo only)
- No gesture recognition needed (single-finger drag is sufficient for aiming)
