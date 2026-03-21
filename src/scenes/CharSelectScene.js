import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, getCharSpriteKey, CHAR_STATIC_SPRITES, CHAR_SCALE_GRID, CHAR_SCALE_GRID_LOCKED, CHAR_SCALE_PREVIEW } from '../utils/Constants.js';
import { setSoundScene, sfxUIClick } from '../utils/SoundManager.js';
import { loadSave } from '../utils/SaveManager.js';
import UIFactory from '../ui/UIFactory.js';

const SHADOW = UIFactory.SHADOW;

/**
 * Character Selection Screen - Fighting game style
 * Displays a grid of character portraits with stats and preview
 */
export default class CharSelectScene extends Phaser.Scene {
    constructor() {
        super('CharSelectScene');
    }

    init(data) {
        // Mode: 'arcade' or 'versus' or 'quickplay'
        this.mode = data.mode || 'arcade';
        this.arcadeRound = data.arcadeRound || null;
        this.returnData = data.returnData || {};
        this._selectedIndex = 0;
        this._confirmed = false;
        this._uiElements = [];
    }

    create() {
        this.cameras.main.setAlpha(1);
        this.cameras.main.resetFX();

        setSoundScene(this);
        const chars = this.cache.json.get('characters');
        const save = loadSave();

        // Filter out hidden characters (sprites not finished)
        const visibleRoster = chars.roster.filter(c => !c.hidden);

        // Determine unlock status based on mode
        // Arcade mode: ONLY the Rookie is selectable
        // Quick Play / other: use save data for unlocks
        if (this.mode === 'arcade') {
            this.roster = visibleRoster.filter(c => c.isRookie);
        } else {
            this.roster = visibleRoster.filter(c =>
                c.isRookie || save.unlockedCharacters.includes(c.id)
            );
        }

        // Reorder so Rookie is always first
        const rookieIdx = visibleRoster.findIndex(c => c.isRookie);
        if (rookieIdx > 0) {
            const rookie = visibleRoster.splice(rookieIdx, 1)[0];
            visibleRoster.unshift(rookie);
        }

        this.allRoster = visibleRoster;
        this._save = save;
        this._selectedIndex = 0;
        this._confirmed = false;
        this._uiElements = [];

        // Background
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x1A1510, 0x1A1510, 0x3A2E28, 0x3A2E28, 1);
        bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Diagonal stripe pattern (fighting game vibe)
        const stripes = this.add.graphics();
        stripes.fillStyle(0xFFD700, 0.03);
        for (let i = -GAME_HEIGHT; i < GAME_WIDTH + GAME_HEIGHT; i += 40) {
            stripes.fillRect(i, 0, 12, GAME_HEIGHT);
            stripes.setRotation(0); // stripes are vertical, we'll use a transform
        }

        // Title
        this.add.text(GAME_WIDTH / 2, 30, 'CHOIX DU PERSONNAGE', {
            fontFamily: 'monospace', fontSize: '28px', color: '#FFD700',
            shadow: { offsetX: 3, offsetY: 3, color: '#1A1510', blur: 0, fill: true }
        }).setOrigin(0.5);

        // Character grid (2 rows x 3 cols)
        this._createCharacterGrid();

        // Right panel: character preview + stats
        this._createPreviewPanel();

        // Controls hint
        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 16, '\u2190\u2191\u2192\u2193 Naviguer     Espace Confirmer', {
            fontFamily: 'monospace', fontSize: '12px', color: '#9E9E8E', shadow: SHADOW
        }).setOrigin(0.5);

        // Back button (bottom-left, binds ESC)
        UIFactory.addBackButton(this, 'TitleScene');

        // Input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceKey = this.input.keyboard.addKey('SPACE');
        this.enterKey = this.input.keyboard.addKey('ENTER');

        this._updateSelection();

        this.events.on('shutdown', this._shutdown, this);
    }

    _shutdown() {
        this.input.keyboard.removeAllListeners();
        this.tweens.killAll();
    }

    _isUnlocked(charId) {
        // In arcade mode, only the Rookie is unlocked
        if (this.mode === 'arcade') {
            return charId === 'rookie';
        }
        // Use save data for unlock status
        return this._save && this._save.unlockedCharacters.includes(charId);
    }

    _createCharacterGrid() {
        const gridX = 40;
        const gridY = 75;
        const cellW = 90;
        const cellH = 100;
        const cols = 5;

        this._cells = [];
        this._gridCols = cols;

        for (let i = 0; i < this.allRoster.length; i++) {
            const char = this.allRoster[i];
            const col = i % cols;
            const row = Math.floor(i / cols);
            const cx = gridX + col * cellW + cellW / 2;
            const cy = gridY + row * cellH + cellH / 2;

            // A character is locked if it's NOT the Rookie AND not in save's unlockedCharacters
            // In arcade mode, everything except Rookie is locked
            const isLocked = !char.isRookie && !this._isUnlocked(char.id);
            const isInRoster = this.roster.includes(char);

            // Cell background
            const cellBg = this.add.graphics();
            cellBg.fillStyle(isLocked ? 0x2A2420 : 0x3A2E28, 0.8);
            cellBg.fillRoundedRect(cx - cellW / 2 + 4, cy - cellH / 2 + 4, cellW - 8, cellH - 8, 8);

            if (isLocked) {
                // Locked: show darkened silhouette with padlock
                const spriteKey = this._getCharSpriteKey(char);
                const charIsStatic = CHAR_STATIC_SPRITES.includes(char.id);
                if (this.textures.exists(spriteKey)) {
                    if (charIsStatic) {
                        this.add.image(cx, cy - 12, spriteKey)
                            .setScale(CHAR_SCALE_GRID_LOCKED).setOrigin(0.5).setTint(0x333333).setAlpha(0.5);
                    } else {
                        this.add.sprite(cx, cy - 12, spriteKey, 0)
                            .setScale(CHAR_SCALE_GRID).setOrigin(0.5).setTint(0x333333).setAlpha(0.5);
                    }
                } else {
                    this.add.text(cx, cy - 18, '?', {
                        fontFamily: 'monospace', fontSize: '36px', color: '#2A2420', shadow: SHADOW
                    }).setOrigin(0.5);
                }
                // Padlock icon over the slot (v2 asset)
                if (this.textures.exists('v2_padlock')) {
                    this.add.image(cx, cy + 8, 'v2_padlock')
                        .setScale(0.5).setOrigin(0.5).setAlpha(0.7);
                } else {
                    this.add.text(cx, cy + 8, '\uD83D\uDD12', {
                        fontSize: '18px'
                    }).setOrigin(0.5).setAlpha(0.7);
                }
                // Show ??? instead of name
                this.add.text(cx, cy + 30, '???', {
                    fontFamily: 'monospace', fontSize: '12px', color: '#5A4A38', shadow: SHADOW
                }).setOrigin(0.5);
            } else {
                // Character portrait: colored circle with sprite if available
                const palette = char.palette || { primary: '#D4A574' };
                const primaryColor = parseInt(palette.primary.replace('#', ''), 16);

                // Try to use existing sprite, fallback to colored circle
                const spriteKey = this._getCharSpriteKey(char);
                const charIsStatic2 = CHAR_STATIC_SPRITES.includes(char.id);
                if (this.textures.exists(spriteKey)) {
                    if (charIsStatic2) {
                        this.add.image(cx, cy - 12, spriteKey)
                            .setScale(CHAR_SCALE_GRID_LOCKED).setOrigin(0.5);
                    } else {
                        this.add.sprite(cx, cy - 12, spriteKey, 0)
                            .setScale(CHAR_SCALE_GRID).setOrigin(0.5);
                    }
                } else {
                    const portrait = this.add.graphics();
                    portrait.fillStyle(primaryColor, 1);
                    portrait.fillCircle(cx, cy - 12, 28);
                    portrait.fillStyle(0xFFFFFF, 0.3);
                    portrait.fillCircle(cx - 8, cy - 20, 10);

                    this.add.text(cx, cy - 12, char.name[0], {
                        fontFamily: 'monospace', fontSize: '24px', color: '#FFFFFF', shadow: SHADOW
                    }).setOrigin(0.5);
                }

                // Name
                this.add.text(cx, cy + 30, char.name, {
                    fontFamily: 'monospace', fontSize: '12px', color: '#F5E6D0', shadow: SHADOW
                }).setOrigin(0.5);
            }

            this._cells.push({
                x: cx, y: cy, w: cellW, h: cellH,
                bg: cellBg, char, isLocked,
                rosterIndex: isInRoster ? this.roster.indexOf(char) : -1
            });
        }

        // Selection cursor (animated border)
        this._selCursor = this.add.graphics().setDepth(10);
        this._selPulse = { t: 0 };
        this.tweens.add({
            targets: this._selPulse, t: 1,
            duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
        });
    }

    _getCharSpriteKey(char) {
        return getCharSpriteKey(char);
    }

    _createPreviewPanel() {
        // Right side panel
        const px = GAME_WIDTH - 220;
        const py = 80;
        const pw = 200;
        const ph = 340;

        // Panel background (v2 asset or fallback)
        if (this.textures.exists('v2_panel_ornate')) {
            this._previewBg = this.add.image(px, py + ph / 2, 'v2_panel_ornate')
                .setDisplaySize(pw, ph).setAlpha(0.92);
        } else {
            this._previewBg = this.add.graphics();
            this._previewBg.fillStyle(0x3A2E28, 0.9);
            this._previewBg.fillRoundedRect(px - pw / 2, py, pw, ph, 10);
            this._previewBg.lineStyle(2, 0xD4A574, 0.5);
            this._previewBg.strokeRoundedRect(px - pw / 2, py, pw, ph, 10);
        }

        // Preview elements (will be updated on selection change)
        this._previewName = this.add.text(px, py + 20, '', {
            fontFamily: 'monospace', fontSize: '20px', color: '#FFD700', shadow: SHADOW
        }).setOrigin(0.5);

        this._previewTitle = this.add.text(px, py + 42, '', {
            fontFamily: 'monospace', fontSize: '11px', color: '#D4A574', shadow: SHADOW
        }).setOrigin(0.5);

        this._previewCatchphrase = this.add.text(px, py + 65, '', {
            fontFamily: 'monospace', fontSize: '10px', color: '#9E9E8E',
            shadow: SHADOW, wordWrap: { width: 180 }, align: 'center'
        }).setOrigin(0.5, 0);

        // Stat bars with inline descriptions
        this._statBars = {};
        const statNames = ['precision', 'puissance', 'effet', 'sang_froid'];
        const statLabels = ['PREC', 'PUIS', 'EFFT', 'S-FR'];
        const statHints = [
            'Zone de dispersion du lancer',
            'Portee et force d\'impact',
            'Controle des courbes',
            'Stabilite sous pression (10-10+)'
        ];
        const statColors = [0xD4A574, 0xC4854A, 0x9B7BB8, 0x87CEEB]; // ocre, terracotta, lavande, ciel
        const barStartY = py + 110;

        for (let i = 0; i < statNames.length; i++) {
            const by = barStartY + i * 38;

            this.add.text(px - 85, by - 4, statLabels[i], {
                fontFamily: 'monospace', fontSize: '12px', color: '#D4A574', shadow: SHADOW
            }).setOrigin(0, 0.5);

            // Hint text below label
            this.add.text(px - 85, by + 10, statHints[i], {
                fontFamily: 'monospace', fontSize: '8px', color: '#7A6A5A', shadow: SHADOW
            }).setOrigin(0, 0.5);

            const barBg = this.add.graphics();
            barBg.fillStyle(0x1A1510, 0.8);
            barBg.fillRoundedRect(px - 40, by - 10, 120, 12, 3);

            const barFill = this.add.graphics();
            const numText = this.add.text(px + 88, by - 4, '', {
                fontFamily: 'monospace', fontSize: '12px', color: '#F5E6D0', shadow: SHADOW
            }).setOrigin(0.5);

            this._statBars[statNames[i]] = { fill: barFill, num: numText, color: statColors[i], y: by - 4 };
        }

        // Description (after stat bars, before sprite zone)
        this._previewDesc = this.add.text(px, barStartY + 158, '', {
            fontFamily: 'monospace', fontSize: '9px', color: '#F5E6D0',
            shadow: SHADOW, wordWrap: { width: 180 }, align: 'center', lineSpacing: 1
        }).setOrigin(0.5, 0).setDepth(10);

        // Large sprite preview
        this._previewSprite = null;

        // Portrait image
        this._portraitImage = null;
    }

    _updateSelection() {
        // Find the actual roster character at the selected grid index
        // Skip locked characters
        const availableCells = this._cells.filter(c => !c.isLocked);
        if (availableCells.length === 0) return;

        const cell = availableCells[this._selectedIndex % availableCells.length];
        const char = cell.char;

        // Update cursor
        this._selCursor.clear();
        const t = this._selPulse.t;
        const alpha = 0.6 + t * 0.4;
        const lineW = 2 + t;
        this._selCursor.lineStyle(lineW, 0xFFD700, alpha);
        this._selCursor.strokeRoundedRect(
            cell.x - cell.w / 2 + 2, cell.y - cell.h / 2 + 2,
            cell.w - 4, cell.h - 4, 8
        );

        // Update preview panel
        this._previewName.setText(char.name);
        this._previewTitle.setText(char.title);
        this._previewCatchphrase.setText(`"${char.catchphrase}"`);
        this._previewDesc.setText(char.description);

        // Update stat bars with animated fill
        const statNames = ['precision', 'puissance', 'effet', 'sang_froid'];
        for (const stat of statNames) {
            const bar = this._statBars[stat];
            const value = char.stats[stat];
            const targetWidth = (value / 10) * 120;
            const bx = GAME_WIDTH - 220 - 40;
            const by = bar.y - 6;

            // Animate bar fill from 0 to target
            bar.fill.clear();
            const anim = { w: 0 };
            this.tweens.add({
                targets: anim,
                w: targetWidth,
                duration: 300,
                ease: 'Quad.easeOut',
                onUpdate: () => {
                    bar.fill.clear();
                    bar.fill.fillStyle(bar.color, 0.8);
                    bar.fill.fillRoundedRect(bx, by, anim.w, 12, 3);
                    // Highlight on top half
                    bar.fill.fillStyle(0xFFFFFF, 0.15);
                    bar.fill.fillRoundedRect(bx, by, anim.w, 6, 3);
                }
            });
            bar.num.setText(value.toString());
        }

        // Update preview sprite (animated character, no portrait overlay)
        if (this._portraitImage) {
            this._portraitImage.destroy();
            this._portraitImage = null;
        }
        if (this._previewSprite) {
            this._previewSprite.destroy();
            this._previewSprite = null;
        }
        if (this._previewShadow) {
            this._previewShadow.destroy();
            this._previewShadow = null;
        }

        const spriteKey = this._getCharSpriteKey(char);
        const isStatic = CHAR_STATIC_SPRITES.includes(char.id);
        if (this.textures.exists(spriteKey)) {
            this._previewShadow = this.add.graphics().setDepth(4);
            this._previewShadow.fillStyle(0x3A2E28, 0.3);
            this._previewShadow.fillEllipse(GAME_WIDTH - 220, 418, 30, 8);

            if (isStatic) {
                this._previewSprite = this.add.image(GAME_WIDTH - 220, 400, spriteKey)
                    .setScale(CHAR_SCALE_PREVIEW).setOrigin(0.5).setDepth(3);
            } else {
                this._previewSprite = this.add.sprite(GAME_WIDTH - 220, 405, spriteKey, 0)
                    .setScale(CHAR_SCALE_PREVIEW).setOrigin(0.5).setDepth(3);

                // Walk animation (frames 0-3 = south walk)
                const animKey = `preview_walk_${char.id}`;
                if (!this.anims.exists(animKey)) {
                    this.anims.create({
                        key: animKey,
                        frames: this.anims.generateFrameNumbers(spriteKey, { start: 0, end: 3 }),
                        frameRate: 6, repeat: -1
                    });
                }
                this._previewSprite.play(animKey);
            }

            // Gentle idle bounce
            this.tweens.add({
                targets: this._previewSprite,
                y: this._previewSprite.y - 4, duration: 800, yoyo: true, repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
    }

    update() {
        if (this._confirmed) return;

        const left = Phaser.Input.Keyboard.JustDown(this.cursors.left);
        const right = Phaser.Input.Keyboard.JustDown(this.cursors.right);
        const up = Phaser.Input.Keyboard.JustDown(this.cursors.up);
        const down = Phaser.Input.Keyboard.JustDown(this.cursors.down);
        const confirm = Phaser.Input.Keyboard.JustDown(this.spaceKey) || Phaser.Input.Keyboard.JustDown(this.enterKey);

        const availableCount = this._cells.filter(c => !c.isLocked).length;

        let changed = false;
        if (right) { this._selectedIndex = (this._selectedIndex + 1) % availableCount; changed = true; }
        if (left) { this._selectedIndex = (this._selectedIndex - 1 + availableCount) % availableCount; changed = true; }
        if (down) {
            this._selectedIndex = Math.min(this._selectedIndex + this._gridCols, availableCount - 1);
            changed = true;
        }
        if (up) {
            this._selectedIndex = Math.max(this._selectedIndex - this._gridCols, 0);
            changed = true;
        }

        if (changed) {
            sfxUIClick();
            this._updateSelection();
        }

        if (confirm) {
            this._confirmSelection();
        }

        // Animate cursor pulse
        if (this._selCursor && this._cells.length > 0) {
            const availableCells = this._cells.filter(c => !c.isLocked);
            const cell = availableCells[this._selectedIndex % availableCells.length];
            this._selCursor.clear();
            const t = this._selPulse.t;
            const alpha = 0.6 + t * 0.4;
            this._selCursor.lineStyle(2 + t, 0xFFD700, alpha);
            this._selCursor.strokeRoundedRect(
                cell.x - cell.w / 2 + 2, cell.y - cell.h / 2 + 2,
                cell.w - 4, cell.h - 4, 8
            );
        }
    }

    _confirmSelection() {
        sfxUIClick();
        this._confirmed = true;
        const availableCells = this._cells.filter(c => !c.isLocked);
        const cell = availableCells[this._selectedIndex % availableCells.length];
        const selectedChar = cell.char;

        // Flash effect
        this.cameras.main.flash(200, 255, 215, 0);

        // Brief delay then proceed
        this.time.delayedCall(400, () => {
            if (this.mode === 'arcade') {
                // Go to VS Intro then match
                this.scene.start('ArcadeScene', {
                    playerCharacter: selectedChar,
                    ...(this.returnData)
                });
            } else if (this.mode === 'versus') {
                // For versus: pass to next scene
                this.scene.start('VSIntroScene', {
                    playerCharacter: selectedChar,
                    ...(this.returnData)
                });
            } else {
                // Quick play: go directly to match
                this.scene.start('PetanqueScene', {
                    playerCharacter: selectedChar,
                    ...(this.returnData)
                });
            }
        });
    }
}
