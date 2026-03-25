import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, getCharSpriteKey, CHAR_STATIC_SPRITES, CHAR_SCALE_GRID, CHAR_SCALE_GRID_LOCKED, CHAR_SCALE_PREVIEW, FONT_PIXEL, SHADOW_TEXT, COLORS, UI } from '../utils/Constants.js';
import { setSoundScene, sfxUIClick, sfxUIHover } from '../utils/SoundManager.js';
import { loadSave } from '../utils/SaveManager.js';
import UIFactory from '../ui/UIFactory.js';
import I18n from '../utils/I18n.js';

const SHADOW = SHADOW_TEXT;

export default class CharSelectScene extends Phaser.Scene {
    constructor() {
        super('CharSelectScene');
    }

    init(data) {
        this.mode = data.mode || 'arcade';
        this.arcadeRound = data.arcadeRound || null;
        this.returnData = data.returnData || {};
        this._selectedIndex = 0;
        this._confirmed = false;
        this._uiElements = [];
        this._transitioning = false;
    }

    create() {
        this.cameras.main.setAlpha(1);
        this.cameras.main.resetFX();
        UIFactory.fadeIn(this);

        setSoundScene(this);
        const chars = this.cache.json.get('characters') || {};
        const save = loadSave();

        const visibleRoster = (chars.roster || []).filter(c => !c.hidden);

        if (this.mode === 'arcade') {
            this.roster = visibleRoster.filter(c => c.isRookie);
        } else {
            this.roster = visibleRoster.filter(c =>
                c.isRookie || save.unlockedCharacters.includes(c.id)
            );
        }

        const rookieIdx = visibleRoster.findIndex(c => c.isRookie);
        if (rookieIdx > 0) {
            const rookie = visibleRoster.splice(rookieIdx, 1)[0];
            visibleRoster.unshift(rookie);
        }

        this.allRoster = visibleRoster;
        this._save = save;
        this._selectedIndex = 0;
        this._confirmed = false;

        // Background — dark with subtle diagonal stripes
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x1A1510, 0x1A1510, 0x3A2E28, 0x3A2E28, 1);
        bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Gold diagonal stripes (fighting game vibe)
        const stripes = this.add.graphics();
        stripes.fillStyle(0xFFD700, 0.02);
        for (let i = -GAME_HEIGHT; i < GAME_WIDTH + GAME_HEIGHT; i += 40) {
            stripes.fillRect(i, 0, 12, GAME_HEIGHT);
        }

        // Title
        UIFactory.addTitle(this, GAME_WIDTH / 2, 26, 'CHOIX DU PERSONNAGE', { depth: 5, fontSize: '14px' });
        UIFactory.addDivider(this, GAME_WIDTH / 2, 44, 280, { depth: 5 });

        // Character grid
        this._createCharacterGrid();

        // Preview panel (right side — wood panel)
        this._createPreviewPanel();

        // Controls hint
        UIFactory.addControlsHint(this, 'FLECHES Naviguer   ESPACE Confirmer', { depth: 5 });

        // Back button
        UIFactory.addBackButton(this, 'TitleScene', { depth: 5 });

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
        if (this.mode === 'arcade') return charId === 'rookie';
        return this._save && this._save.unlockedCharacters.includes(charId);
    }

    _createCharacterGrid() {
        const gridX = 40;
        const gridY = 64;
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

            const isLocked = !char.isRookie && !this._isUnlocked(char.id);
            const isInRoster = this.roster.includes(char);

            // Card-style cell background
            const cellBg = this.add.graphics();

            if (isLocked) {
                // Locked card — dark, muted
                cellBg.fillStyle(0x1A1510, 0.8);
                cellBg.fillRoundedRect(cx - cellW / 2 + 4, cy - cellH / 2 + 4, cellW - 8, cellH - 8, 6);
                cellBg.lineStyle(1, 0x3A2E28, 0.5);
                cellBg.strokeRoundedRect(cx - cellW / 2 + 4, cy - cellH / 2 + 4, cellW - 8, cellH - 8, 6);

                const spriteKey = this._getCharSpriteKey(char);
                const charIsStatic = CHAR_STATIC_SPRITES.includes(char.id);
                if (this.textures.exists(spriteKey)) {
                    if (charIsStatic) {
                        this.add.image(cx, cy - 12, spriteKey)
                            .setScale(CHAR_SCALE_GRID_LOCKED).setOrigin(0.5).setTint(0x333333).setAlpha(0.4);
                    } else {
                        this.add.sprite(cx, cy - 12, spriteKey, 0)
                            .setScale(CHAR_SCALE_GRID).setOrigin(0.5).setTint(0x333333).setAlpha(0.4);
                    }
                } else {
                    this.add.text(cx, cy - 18, '?', {
                        fontFamily: 'monospace', fontSize: '24px', color: '#2A2420', shadow: SHADOW
                    }).setOrigin(0.5);
                }

                if (this.textures.exists('v2_padlock')) {
                    this.add.sprite(cx, cy + 8, 'v2_padlock', 0)
                        .setScale(1.5).setOrigin(0.5).setAlpha(0.7);
                } else {
                    this.add.text(cx, cy + 8, '\uD83D\uDD12', { fontSize: '18px' }).setOrigin(0.5).setAlpha(0.7);
                }

                this.add.text(cx, cy + 32, '???', {
                    fontFamily: 'monospace', fontSize: '12px', color: '#5A4A38', shadow: SHADOW
                }).setOrigin(0.5);
            } else {
                // Unlocked card — wood background with character
                cellBg.fillStyle(0x5A4030, 0.85);
                cellBg.fillRoundedRect(cx - cellW / 2 + 4, cy - cellH / 2 + 4, cellW - 8, cellH - 8, 6);
                // Top bevel
                cellBg.fillStyle(0x8B6B3D, 0.15);
                cellBg.fillRoundedRect(cx - cellW / 2 + 6, cy - cellH / 2 + 6, cellW - 12, 12, { tl: 4, tr: 4, bl: 0, br: 0 });
                cellBg.lineStyle(1, 0x8B6B3D, 0.4);
                cellBg.strokeRoundedRect(cx - cellW / 2 + 4, cy - cellH / 2 + 4, cellW - 8, cellH - 8, 6);

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
                    const palette = char.palette || { primary: '#D4A574' };
                    const primaryColor = parseInt(palette.primary.replace('#', ''), 16);
                    const portrait = this.add.graphics();
                    portrait.fillStyle(primaryColor, 1);
                    portrait.fillCircle(cx, cy - 12, 28);
                    this.add.text(cx, cy - 12, char.name[0], {
                        fontFamily: 'monospace', fontSize: '18px', color: '#FFFFFF', shadow: SHADOW
                    }).setOrigin(0.5);
                }

                // Name on card
                this.add.text(cx, cy + 32, char.name, {
                    fontFamily: 'monospace', fontSize: '12px', color: '#F5E6D0', shadow: SHADOW
                }).setOrigin(0.5);
            }

            this._cells.push({
                x: cx, y: cy, w: cellW, h: cellH,
                bg: cellBg, char, isLocked,
                rosterIndex: isInRoster ? this.roster.indexOf(char) : -1
            });
        }

        // Selection cursor (animated golden border)
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
        const px = GAME_WIDTH - 220;
        const py = 64;
        const pw = 200;
        const ph = 360;

        // Wood panel background
        UIFactory.createWoodPanel(this, px - pw / 2, py, pw, ph, { depth: 1 });

        // Preview elements
        this._previewName = this.add.text(px, py + 20, '', {
            fontFamily: 'monospace', fontSize: '16px', color: '#FFD700', shadow: SHADOW
        }).setOrigin(0.5).setDepth(2);

        this._previewTitle = this.add.text(px, py + 38, '', {
            fontFamily: 'monospace', fontSize: '12px', color: '#D4A574', shadow: SHADOW
        }).setOrigin(0.5).setDepth(2);

        this._previewCatchphrase = this.add.text(px, py + 55, '', {
            fontFamily: 'monospace', fontSize: '11px', color: '#3A2E28',
            shadow: { offsetX: 0, offsetY: 0, color: 'rgba(0,0,0,0)', blur: 0, fill: false },
            wordWrap: { width: 180 }, align: 'center', lineSpacing: 3
        }).setOrigin(0.5, 0).setDepth(2);

        // Stat bars
        this._statBars = {};
        const statNames = ['precision', 'puissance', 'effet', 'sang_froid'];
        const statLabels = ['PREC', 'PUIS', 'EFFT', 'S-FR'];
        const statColors = [0xD4A574, 0xC4854A, 0x9B7BB8, 0x87CEEB];
        const barStartY = py + 100;

        // Divider above stats
        UIFactory.addDivider(this, px, barStartY - 12, 160, { depth: 2, color: 0x8B6B3D });

        for (let i = 0; i < statNames.length; i++) {
            const by = barStartY + i * 36;

            this.add.text(px - 85, by - 2, statLabels[i], {
                fontFamily: 'monospace', fontSize: '12px', color: '#D4A574', shadow: SHADOW
            }).setOrigin(0, 0.5).setDepth(2);

            const barBg = this.add.graphics().setDepth(2);
            barBg.fillStyle(0x1A1510, 0.6);
            barBg.fillRoundedRect(px - 40, by - 8, 120, 10, 3);
            barBg.lineStyle(1, 0x5A4A38, 0.3);
            barBg.strokeRoundedRect(px - 40, by - 8, 120, 10, 3);

            const barFill = this.add.graphics().setDepth(2);
            const numText = this.add.text(px + 88, by - 2, '', {
                fontFamily: 'monospace', fontSize: '13px', color: '#F5E6D0', shadow: SHADOW
            }).setOrigin(0.5).setDepth(2);

            this._statBars[statNames[i]] = { fill: barFill, num: numText, color: statColors[i], y: by - 2 };
        }

        // Description
        this._previewDesc = this.add.text(px, barStartY + 150, '', {
            fontFamily: 'monospace', fontSize: '11px', color: '#F5E6D0',
            shadow: SHADOW, wordWrap: { width: 180 }, align: 'center', lineSpacing: 3
        }).setOrigin(0.5, 0).setDepth(10);

        this._previewSprite = null;
        this._portraitImage = null;

        // Rookie abilities section (sprite area, y≈368-424)
        const abY = py + 304; // 368
        this._abilitiesLabel = this.add.text(px, abY, '', {
            fontFamily: 'monospace', fontSize: '10px', color: '#FFD700', shadow: SHADOW
        }).setOrigin(0.5, 0).setDepth(10);

        this._abilityTexts = [];
        for (let i = 0; i < 3; i++) {
            const lineY = abY + 14 + i * 22;
            const t = this.add.text(px - 88, lineY, '', {
                fontFamily: 'monospace', fontSize: '10px', color: '#D4A574',
                wordWrap: { width: 168 }, lineSpacing: 1
            }).setOrigin(0, 0).setDepth(10);
            this._abilityTexts.push(t);
        }
    }

    _updateSelection() {
        const availableCells = this._cells.filter(c => !c.isLocked);
        if (availableCells.length === 0) return;

        const cell = availableCells[this._selectedIndex % availableCells.length];

        // Selection bounce: scale the selected card container briefly
        if (cell.container && cell !== this._lastSelectedCell) {
            this._lastSelectedCell = cell;
            // Reset all cards to base scale
            availableCells.forEach(c => {
                if (c.container) { this.tweens.killTweensOf(c.container); c.container.setScale(1); }
            });
            cell.container.setScale(1);
            this.tweens.add({
                targets: cell.container,
                scaleX: 1.08, scaleY: 1.08, duration: 120, yoyo: true, ease: 'Quad.easeOut'
            });
        }
        const char = cell.char;

        // Update cursor
        this._selCursor.clear();
        const t = this._selPulse.t;
        const alpha = 0.6 + t * 0.4;
        const lineW = 2 + t;
        this._selCursor.lineStyle(lineW, 0xFFD700, alpha);
        this._selCursor.strokeRoundedRect(
            cell.x - cell.w / 2 + 2, cell.y - cell.h / 2 + 2,
            cell.w - 4, cell.h - 4, 6
        );

        // Update preview (localized)
        this._previewName.setText(I18n.field(char, 'name'));
        this._previewTitle.setText(I18n.field(char, 'title'));
        this._previewCatchphrase.setText(`"${I18n.field(char, 'catchphrase')}"`);

        if (char.isRookie && char.abilities_unlock?.length) {
            // Truncate description to leave room for abilities
            const desc = I18n.field(char, 'description');
            this._previewDesc.setText(desc.length > 92 ? desc.substring(0, 92) + '...' : desc);
            this._updateRookieAbilities(char);
        } else {
            this._previewDesc.setText(I18n.field(char, 'description'));
            this._clearAbilitiesSection();
        }

        // Stat bars
        const statNames = ['precision', 'puissance', 'effet', 'sang_froid'];
        for (const stat of statNames) {
            const bar = this._statBars[stat];
            const value = char.stats[stat];
            const targetWidth = (value / 10) * 120;
            const bx = GAME_WIDTH - 220 - 40;
            const by = bar.y - 6;

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
                    bar.fill.fillRoundedRect(bx, by, anim.w, 10, 3);
                    bar.fill.fillStyle(0xFFFFFF, 0.15);
                    bar.fill.fillRoundedRect(bx, by, anim.w, 5, 3);
                }
            });
            bar.num.setText(value.toString());
        }

        // Preview sprite (skip for Rookie — abilities section uses that space)
        if (this._portraitImage) { this._portraitImage.destroy(); this._portraitImage = null; }
        if (this._previewSprite) { this._previewSprite.destroy(); this._previewSprite = null; }
        if (this._previewShadow) { this._previewShadow.destroy(); this._previewShadow = null; }

        if (char.isRookie && char.abilities_unlock?.length) return;

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

            // Idle bounce
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
            sfxUIHover();
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
                cell.w - 4, cell.h - 4, 6
            );
        }
    }

    _updateRookieAbilities(char) {
        const unlockedIds = this._save?.rookie?.abilitiesUnlocked || [];
        this._abilitiesLabel.setText('— CAPACITÉS —');
        char.abilities_unlock.forEach((unlock, i) => {
            if (!this._abilityTexts[i]) return;
            const isUnlocked = unlockedIds.includes(unlock.id);
            this._abilityTexts[i].setColor(isUnlocked ? '#6B8E4E' : '#D4A574');
            this._abilityTexts[i].setText(
                `${isUnlocked ? '✓' : '•'} ${unlock.threshold}pts — ${unlock.ability.name}\n  ${unlock.ability.description}`
            );
        });
    }

    _clearAbilitiesSection() {
        if (this._abilitiesLabel) this._abilitiesLabel.setText('');
        if (this._abilityTexts) this._abilityTexts.forEach(t => t.setText(''));
    }

    _confirmSelection() {
        sfxUIClick();
        this._confirmed = true;
        const availableCells = this._cells.filter(c => !c.isLocked);
        const cell = availableCells[this._selectedIndex % availableCells.length];
        const selectedChar = cell.char;

        this.cameras.main.flash(200, 255, 215, 0);

        this.time.delayedCall(400, () => {
            if (this.mode === 'arcade') {
                UIFactory.transitionTo(this, 'ArcadeScene', {
                    playerCharacter: selectedChar,
                    ...(this.returnData)
                });
            } else if (this.mode === 'versus') {
                UIFactory.transitionTo(this, 'VSIntroScene', {
                    playerCharacter: selectedChar,
                    ...(this.returnData)
                });
            } else {
                UIFactory.transitionTo(this, 'PetanqueScene', {
                    playerCharacter: selectedChar,
                    ...(this.returnData)
                });
            }
        });
    }
}
