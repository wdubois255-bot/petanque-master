import Phaser from 'phaser';
import { getCharSpriteKey, CHAR_STATIC_SPRITES, CHAR_SCALE_GRID, CHAR_SCALE_GRID_LOCKED, CHAR_SCALE_PREVIEW, FONT_PIXEL, SHADOW_TEXT, COLORS, UI, RARITY_COLORS } from '../utils/Constants.js';
import Layout from '../utils/Layout.js';
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
        bg.fillRect(0, 0, Layout.W, Layout.H);

        // Gold diagonal stripes (fighting game vibe)
        const stripes = this.add.graphics();
        stripes.fillStyle(0xFFD700, 0.02);
        for (let i = -Layout.H; i < Layout.W + Layout.H; i += 40) {
            stripes.fillRect(i, 0, 12, Layout.H);
        }

        // Title — portrait : plus grand pour lisibilite mobile
        const titleFs = Layout.isPortrait ? '20px' : '14px';
        const dividerY = Layout.isPortrait ? 50 : 44;
        UIFactory.addTitle(this, Layout.W / 2, Layout.isPortrait ? 28 : 26, 'CHOIX DU PERSONNAGE', { depth: 5, fontSize: titleFs });
        UIFactory.addDivider(this, Layout.W / 2, dividerY, Layout.isPortrait ? 360 : 280, { depth: 5 });

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
        // Portrait mobile : grid 3 cols × 4 rows, preview en bas.
        // Desktop : grid 5 cols × N rows, preview a droite (inchange).
        const portrait = Layout.isPortrait;
        const gridX = portrait ? 15 : 40;
        const gridY = portrait ? 70 : 64;
        const cols = portrait ? 3 : 5;
        const cellW = portrait ? Math.floor((Layout.W - 2 * gridX) / cols) : 90;
        const cellH = portrait ? 100 : 100;

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
                // Unlocked card — rarity-tinted wood background
                const rarity = RARITY_COLORS[char.rarity] || RARITY_COLORS.common;
                const rx = cx - cellW / 2 + 4;
                const ry = cy - cellH / 2 + 4;
                const rw = cellW - 8;
                const rh = cellH - 8;
                // Base wood
                cellBg.fillStyle(0x5A4030, 0.85);
                cellBg.fillRoundedRect(rx, ry, rw, rh, 6);
                // Rarity gradient tint (base color at ~30% alpha over wood)
                cellBg.fillStyle(rarity.base, 0.25);
                cellBg.fillRoundedRect(rx, ry, rw, rh, 6);
                // Top bevel (rarity glow)
                cellBg.fillStyle(rarity.glow, 0.25);
                cellBg.fillRoundedRect(rx + 2, ry + 2, rw - 4, 12, { tl: 4, tr: 4, bl: 0, br: 0 });
                // Rarity border (replaces generic wood border)
                cellBg.lineStyle(2, rarity.base, 0.9);
                cellBg.strokeRoundedRect(rx, ry, rw, rh, 6);

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
                    fontFamily: 'monospace', fontSize: portrait ? '14px' : '12px', color: '#F5E6D0', shadow: SHADOW
                }).setOrigin(0.5);

                // Rarity badge (top-right) — petit dot + premiere lettre du label
                const badgeX = cx + cellW / 2 - 12;
                const badgeY = cy - cellH / 2 + 12;
                const badgeBg = this.add.graphics();
                badgeBg.fillStyle(0x1A1510, 0.85);
                badgeBg.fillCircle(badgeX, badgeY, 6);
                badgeBg.lineStyle(1, rarity.glow, 0.9);
                badgeBg.strokeCircle(badgeX, badgeY, 6);
                badgeBg.fillStyle(rarity.glow, 1);
                badgeBg.fillCircle(badgeX, badgeY, 3);
            }

            this._cells.push({
                x: cx, y: cy, w: cellW, h: cellH,
                bg: cellBg, char, isLocked,
                rosterIndex: isInRoster ? this.roster.indexOf(char) : -1
            });
        }

        // Selection halo (rarity-tinted glow behind card, below cursor)
        this._selHalo = this.add.graphics().setDepth(9);

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
        // Portrait : panneau pleine largeur en bas sous la grille.
        // Desktop : panneau droite (inchange).
        const portrait = Layout.isPortrait;
        const pw = portrait ? (Layout.W - 20) : 200;
        const ph = portrait ? 400 : 360;
        const px = portrait ? (Layout.W / 2) : (Layout.W - 220);
        const py = portrait ? 480 : 64;
        // Expose pour les refs downstream (sprite preview, stat fill anim)
        this._previewPx = px;
        this._previewPy = py;

        // Wood panel background
        UIFactory.createWoodPanel(this, px - pw / 2, py, pw, ph, { depth: 1 });

        // Preview elements — portrait : typos plus grosses pour lisibilite
        const nameFs  = portrait ? '22px' : '16px';
        const titleFs = portrait ? '14px' : '12px';
        const catchFs = portrait ? '13px' : '11px';
        this._previewName = this.add.text(px, py + 22, '', {
            fontFamily: 'monospace', fontSize: nameFs, color: '#FFD700', shadow: SHADOW
        }).setOrigin(0.5).setDepth(2);

        this._previewTitle = this.add.text(px, py + 48, '', {
            fontFamily: 'monospace', fontSize: titleFs, color: '#D4A574', shadow: SHADOW
        }).setOrigin(0.5).setDepth(2);

        this._previewCatchphrase = this.add.text(px, py + 68, '', {
            fontFamily: 'monospace', fontSize: catchFs, color: '#3A2E28',
            shadow: { offsetX: 0, offsetY: 0, color: 'rgba(0,0,0,0)', blur: 0, fill: false },
            wordWrap: { width: portrait ? pw - 30 : 180 }, align: 'center', lineSpacing: 3
        }).setOrigin(0.5, 0).setDepth(2);

        // Stat bars
        this._statBars = {};
        const statNames = ['precision', 'puissance', 'effet', 'sang_froid'];
        const statLabels = ['PREC', 'PUIS', 'EFFT', 'S-FR'];
        const statColors = [0xD4A574, 0xC4854A, 0x9B7BB8, 0x87CEEB];
        const barStartY = py + 100;

        // Divider above stats
        UIFactory.addDivider(this, px, barStartY - 12, 160, { depth: 2, color: 0x8B6B3D });

        // Portrait : bar plus large et fonts plus grosses
        const barW = portrait ? 160 : 120;
        const barH = portrait ? 14 : 10;
        const statLabelFs = portrait ? '14px' : '12px';
        const statNumFs = portrait ? '16px' : '13px';
        for (let i = 0; i < statNames.length; i++) {
            const by = barStartY + i * 36;

            this.add.text(px - (portrait ? 105 : 85), by - 2, statLabels[i], {
                fontFamily: 'monospace', fontSize: statLabelFs, color: '#D4A574', shadow: SHADOW
            }).setOrigin(0, 0.5).setDepth(2);

            const barBg = this.add.graphics().setDepth(2);
            barBg.fillStyle(0x1A1510, 0.6);
            barBg.fillRoundedRect(px - (portrait ? 50 : 40), by - barH / 2 - 2, barW, barH, 3);
            barBg.lineStyle(1, 0x5A4A38, 0.3);
            barBg.strokeRoundedRect(px - (portrait ? 50 : 40), by - barH / 2 - 2, barW, barH, 3);

            const barFill = this.add.graphics().setDepth(2);
            const numText = this.add.text(px + (portrait ? 124 : 88), by - 2, '', {
                fontFamily: 'monospace', fontSize: statNumFs, color: '#F5E6D0', shadow: SHADOW
            }).setOrigin(0.5).setDepth(2);

            this._statBars[statNames[i]] = { fill: barFill, num: numText, color: statColors[i], y: by - 2 };
        }

        // Description
        this._previewDesc = this.add.text(px, barStartY + 150, '', {
            fontFamily: 'monospace', fontSize: portrait ? '13px' : '11px', color: '#F5E6D0',
            shadow: SHADOW, wordWrap: { width: portrait ? pw - 30 : 180 }, align: 'center', lineSpacing: 3
        }).setOrigin(0.5, 0).setDepth(10);

        this._previewSprite = null;
        this._portraitImage = null;

        // Rookie abilities section
        const abY = py + (portrait ? 286 : 304);
        this._abilitiesLabel = this.add.text(px, abY, '', {
            fontFamily: 'monospace', fontSize: portrait ? '13px' : '10px', color: '#FFD700', shadow: SHADOW
        }).setOrigin(0.5, 0).setDepth(10);

        this._abilityTexts = [];
        const abLineLeftX = portrait ? (px - pw / 2 + 20) : (px - 88);
        const abWrapWidth = portrait ? (pw - 40) : 168;
        const abFs = portrait ? '12px' : '10px';
        const abLineStep = portrait ? 26 : 22;
        for (let i = 0; i < 3; i++) {
            const lineY = abY + 16 + i * abLineStep;
            const t = this.add.text(abLineLeftX, lineY, '', {
                fontFamily: 'monospace', fontSize: abFs, color: '#D4A574',
                wordWrap: { width: abWrapWidth }, lineSpacing: 1
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

        // Update cursor + halo (rarity-tinted glow)
        const rarity = RARITY_COLORS[char.rarity] || RARITY_COLORS.common;
        this._selHalo.clear();
        this._selHalo.fillStyle(rarity.glow, 0.18);
        this._selHalo.fillRoundedRect(
            cell.x - cell.w / 2 - 4, cell.y - cell.h / 2 - 4,
            cell.w + 8, cell.h + 8, 10
        );

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

        // Truncate description to leave room for ability info
        const desc = I18n.field(char, 'description');
        this._previewDesc.setText(desc.length > 92 ? desc.substring(0, 92) + '...' : desc);

        if (char.isRookie && char.abilities_unlock?.length) {
            this._updateRookieAbilities(char);
        } else {
            this._updateCharAbility(char);
        }

        // Stat bars — use saved stats for Rookie (may have been upgraded via LevelUp)
        const rookieStats = (char.isRookie || char.id === 'rookie') ? this._save?.rookie?.stats : null;
        const statNames = ['precision', 'puissance', 'effet', 'sang_froid'];
        for (const stat of statNames) {
            const bar = this._statBars[stat];
            const value = rookieStats ? (rookieStats[stat] ?? char.stats[stat]) : char.stats[stat];
            const portraitNow = Layout.isPortrait;
            const fullBarW = portraitNow ? 160 : 120;
            const fullBarH = portraitNow ? 14 : 10;
            const targetWidth = (value / 10) * fullBarW;
            const bx = (this._previewPx ?? (Layout.W - 220)) - (portraitNow ? 50 : 40);
            const by = bar.y - fullBarH / 2 - 1;

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
                    bar.fill.fillRoundedRect(bx, by, anim.w, fullBarH, 3);
                    bar.fill.fillStyle(0xFFFFFF, 0.15);
                    bar.fill.fillRoundedRect(bx, by, anim.w, fullBarH / 2, 3);
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
            // Sprite preview : suit l'ancre px du panneau (portrait = milieu panneau bas, desktop = W-220)
            const spX = this._previewPx ?? (Layout.W - 220);
            const spBaseY = this._previewPy ?? 64;
            const spShadowY = spBaseY + 354;  // py+354 (desktop 418 quand py=64)
            const spImgY = spBaseY + 336;     // py+336 (desktop 400)
            const spSprY = spBaseY + 341;     // py+341 (desktop 405)

            this._previewShadow = this.add.graphics().setDepth(4);
            this._previewShadow.fillStyle(0x3A2E28, 0.3);
            this._previewShadow.fillEllipse(spX, spShadowY, 30, 8);

            if (isStatic) {
                this._previewSprite = this.add.image(spX, spImgY, spriteKey)
                    .setScale(CHAR_SCALE_PREVIEW).setOrigin(0.5).setDepth(3);
            } else {
                this._previewSprite = this.add.sprite(spX, spSprY, spriteKey, 0)
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

        // Animate cursor pulse + halo
        if (this._selCursor && this._cells.length > 0) {
            const availableCells = this._cells.filter(c => !c.isLocked);
            const cell = availableCells[this._selectedIndex % availableCells.length];
            const rarity = RARITY_COLORS[cell.char.rarity] || RARITY_COLORS.common;
            const t = this._selPulse.t;

            if (this._selHalo) {
                this._selHalo.clear();
                this._selHalo.fillStyle(rarity.glow, 0.12 + t * 0.12);
                this._selHalo.fillRoundedRect(
                    cell.x - cell.w / 2 - 4, cell.y - cell.h / 2 - 4,
                    cell.w + 8, cell.h + 8, 10
                );
            }

            this._selCursor.clear();
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
        this._abilitiesLabel.setText(I18n.t('charselect_extra.abilities_title'));
        char.abilities_unlock.forEach((unlock, i) => {
            if (!this._abilityTexts[i]) return;
            const isUnlocked = unlockedIds.includes(unlock.id);
            this._abilityTexts[i].setColor(isUnlocked ? '#6B8E4E' : '#D4A574');
            this._abilityTexts[i].setText(
                `${isUnlocked ? '\u2713' : '\u2022'} ${unlock.threshold}pts \u2014 ${I18n.field(unlock.ability, 'name')}\n  ${I18n.field(unlock.ability, 'description')}`
            );
        });
    }

    _updateCharAbility(char) {
        const archetypeLabels = {
            tireur: I18n.t('charselect_extra.archetypes.tireur'),
            pointeur: I18n.t('charselect_extra.archetypes.pointeur'),
            equilibre: I18n.t('charselect_extra.archetypes.equilibre'),
            complet: I18n.t('charselect_extra.archetypes.complet'),
            milieu: I18n.t('charselect_extra.archetypes.milieu'),
            adaptable: I18n.t('charselect_extra.archetypes.adaptable'),
            glisseur: I18n.t('charselect_extra.archetypes.glisseur')
        };
        const archetypeColors = {
            tireur: '#C44B3F', pointeur: '#87CEEB', equilibre: '#D4A574',
            complet: '#6B8E4E', milieu: '#D4A574', adaptable: '#FFD700', glisseur: '#9B7BB8'
        };

        // Line 0: Archetype
        const archLabel = archetypeLabels[char.archetype] || char.archetype;
        const archColor = archetypeColors[char.archetype] || '#D4A574';
        this._abilitiesLabel.setText(`\u2014 ${archLabel.toUpperCase()} \u2014`);
        this._abilitiesLabel.setColor(archColor);

        // Line 1: Ability name + charges
        if (char.ability) {
            const charges = char.ability.charges > 0 ? ` (${char.ability.charges}x)` : ' (Passif)';
            this._abilityTexts[0].setColor('#FFD700');
            this._abilityTexts[0].setText(`\u26A1 ${I18n.field(char.ability, 'name')}${charges}`);

            // Line 2: Ability description
            this._abilityTexts[1].setColor('#F5E6D0');
            this._abilityTexts[1].setText(I18n.field(char.ability, 'description'));
        } else {
            this._abilityTexts[0].setText('');
            this._abilityTexts[1].setText('');
        }
        this._abilityTexts[2].setText('');
    }

    _clearAbilitiesSection() {
        if (this._abilitiesLabel) { this._abilitiesLabel.setText(''); this._abilitiesLabel.setColor('#FFD700'); }
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
