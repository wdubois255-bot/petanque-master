import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, CHAR_SPRITE_MAP, CHAR_STATIC_SPRITES, COLORS, TERRAIN_FRICTION } from '../utils/Constants.js';

const SHADOW = { offsetX: 2, offsetY: 2, color: '#1A1510', blur: 0, fill: true };

/**
 * DevTestScene — Developer-only scene for visual debugging.
 * Accessible via triple-click on the title logo.
 *
 * Features:
 * - Sprite gallery: all 12 characters side by side with names
 * - Terrain switcher: dropdown for instant terrain preview
 * - UI gallery: all v2 UI elements displayed
 * - Scale slider: test sprite sizes in real time (0.1 → 2.0)
 * - Console info: FPS, texture count, memory
 */
export default class DevTestScene extends Phaser.Scene {
    constructor() {
        super('DevTestScene');
    }

    init() {
        this._sprites = [];
        this._uiElements = [];
        this._currentScale = 1.0;
        this._currentTab = 0; // 0=sprites, 1=terrain, 2=ui
    }

    create() {
        this.cameras.main.setAlpha(1);
        this.cameras.main.resetFX();

        // Background
        const bg = this.add.graphics();
        bg.fillStyle(0x1A1510, 1);
        bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Title
        this.add.text(GAME_WIDTH / 2, 16, 'DEV TEST SCENE', {
            fontFamily: 'monospace', fontSize: '20px', color: '#FFD700', shadow: SHADOW
        }).setOrigin(0.5);

        // Tab buttons
        const tabs = ['SPRITES', 'TERRAINS', 'UI v2'];
        this._tabTexts = [];
        for (let i = 0; i < tabs.length; i++) {
            const tx = 120 + i * 160;
            const tabText = this.add.text(tx, 42, `[ ${tabs[i]} ]`, {
                fontFamily: 'monospace', fontSize: '14px', color: i === 0 ? '#FFD700' : '#9E9E8E',
                shadow: SHADOW
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });

            tabText.on('pointerdown', () => this._switchTab(i));
            this._tabTexts.push(tabText);
        }

        // Scale slider (bottom)
        this._scaleText = this.add.text(GAME_WIDTH - 200, GAME_HEIGHT - 20, `Scale: ${this._currentScale.toFixed(2)}`, {
            fontFamily: 'monospace', fontSize: '12px', color: '#D4A574', shadow: SHADOW
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH - 300, GAME_HEIGHT - 20, '[-]', {
            fontFamily: 'monospace', fontSize: '14px', color: '#FFD700', shadow: SHADOW
        }).setOrigin(0.5).setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this._adjustScale(-0.1));

        this.add.text(GAME_WIDTH - 100, GAME_HEIGHT - 20, '[+]', {
            fontFamily: 'monospace', fontSize: '14px', color: '#FFD700', shadow: SHADOW
        }).setOrigin(0.5).setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this._adjustScale(0.1));

        // FPS text (top-right)
        this._fpsText = this.add.text(GAME_WIDTH - 10, 10, '', {
            fontFamily: 'monospace', fontSize: '11px', color: '#6B8E4E', shadow: SHADOW
        }).setOrigin(1, 0);

        // Back button
        this.add.text(50, GAME_HEIGHT - 20, '< RETOUR', {
            fontFamily: 'monospace', fontSize: '14px', color: '#C44B3F', shadow: SHADOW
        }).setOrigin(0.5).setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.scene.start('TitleScene'));

        this.input.keyboard.on('keydown-ESC', () => this.scene.start('TitleScene'));

        // Content container
        this._contentContainer = this.add.container(0, 0);

        // Show first tab
        this._showSpritesTab();

        this.events.on('shutdown', () => {
            this.input.keyboard.removeAllListeners();
            this.tweens.killAll();
        });
    }

    update() {
        // FPS + texture info
        const fps = Math.round(this.game.loop.actualFps);
        const texCount = this.textures.getTextureKeys().length;
        this._fpsText.setText(`FPS: ${fps} | Textures: ${texCount}`);
    }

    _switchTab(index) {
        this._currentTab = index;
        for (let i = 0; i < this._tabTexts.length; i++) {
            this._tabTexts[i].setColor(i === index ? '#FFD700' : '#9E9E8E');
        }
        this._clearContent();
        if (index === 0) this._showSpritesTab();
        else if (index === 1) this._showTerrainTab();
        else if (index === 2) this._showUITab();
    }

    _clearContent() {
        this._contentContainer.removeAll(true);
        this._sprites = [];
        this._uiElements = [];
    }

    // === SPRITES TAB ===
    _showSpritesTab() {
        const charIds = Object.keys(CHAR_SPRITE_MAP);
        const startY = 80;
        const cols = 6;
        const cellW = Math.floor((GAME_WIDTH - 40) / cols);
        const cellH = 150;

        for (let i = 0; i < charIds.length; i++) {
            const charId = charIds[i];
            const spriteKey = CHAR_SPRITE_MAP[charId];
            const col = i % cols;
            const row = Math.floor(i / cols);
            const cx = 20 + col * cellW + cellW / 2;
            const cy = startY + row * cellH + 60;

            // Cell background
            const cellBg = this.add.graphics();
            cellBg.fillStyle(0x3A2E28, 0.5);
            cellBg.fillRoundedRect(cx - cellW / 2 + 4, cy - 50, cellW - 8, cellH - 10, 6);
            this._contentContainer.add(cellBg);

            if (this.textures.exists(spriteKey)) {
                const isStatic = CHAR_STATIC_SPRITES.includes(charId);
                let sprite;
                if (isStatic) {
                    sprite = this.add.image(cx, cy, spriteKey)
                        .setScale(this._currentScale).setOrigin(0.5);
                } else {
                    sprite = this.add.sprite(cx, cy, spriteKey, 0)
                        .setScale(this._currentScale).setOrigin(0.5);
                }
                this._contentContainer.add(sprite);
                this._sprites.push(sprite);
            } else {
                const missing = this.add.text(cx, cy, '?', {
                    fontFamily: 'monospace', fontSize: '32px', color: '#C44B3F', shadow: SHADOW
                }).setOrigin(0.5);
                this._contentContainer.add(missing);
            }

            // Name label
            const name = this.add.text(cx, cy + 55, charId, {
                fontFamily: 'monospace', fontSize: '9px', color: '#D4A574', shadow: SHADOW
            }).setOrigin(0.5);
            this._contentContainer.add(name);

            // Frame size info
            const sizeLabel = this.add.text(cx, cy + 67, CHAR_STATIC_SPRITES.includes(charId) ? 'static' : '128x128', {
                fontFamily: 'monospace', fontSize: '8px', color: '#7A6A5A', shadow: SHADOW
            }).setOrigin(0.5);
            this._contentContainer.add(sizeLabel);
        }
    }

    // === TERRAIN TAB ===
    _showTerrainTab() {
        const terrains = ['terre', 'herbe', 'sable', 'dalles'];
        const startY = 80;
        const cellW = 180;
        const spacing = 20;
        const totalW = terrains.length * cellW + (terrains.length - 1) * spacing;
        const startX = (GAME_WIDTH - totalW) / 2;

        for (let i = 0; i < terrains.length; i++) {
            const terrain = terrains[i];
            const cx = startX + i * (cellW + spacing) + cellW / 2;
            const cy = startY + 60;

            // Terrain swatch
            const swatch = this.add.graphics();
            const colors = { terre: 0xC4854A, herbe: 0x6B8E4E, sable: 0xE8D5B7, dalles: 0x9E9E8E };
            swatch.fillStyle(colors[terrain] || 0x3A2E28, 1);
            swatch.fillRoundedRect(cx - 70, cy - 40, 140, 80, 6);
            swatch.lineStyle(1, 0xD4A574, 0.5);
            swatch.strokeRoundedRect(cx - 70, cy - 40, 140, 80, 6);
            this._contentContainer.add(swatch);

            // Try to show terrain texture
            const texKey = `terrain_tex_${terrain}`;
            if (this.textures.exists(texKey)) {
                const tex = this.add.image(cx, cy, texKey)
                    .setDisplaySize(100, 60).setOrigin(0.5).setAlpha(0.8);
                this._contentContainer.add(tex);
            }

            // Name
            const name = this.add.text(cx, cy + 50, terrain.toUpperCase(), {
                fontFamily: 'monospace', fontSize: '14px', color: '#FFD700', shadow: SHADOW
            }).setOrigin(0.5);
            this._contentContainer.add(name);

            // Friction value
            const friction = TERRAIN_FRICTION[terrain] || 1.0;
            const frLabel = this.add.text(cx, cy + 68, `Friction: ${friction}x`, {
                fontFamily: 'monospace', fontSize: '10px', color: '#D4A574', shadow: SHADOW
            }).setOrigin(0.5);
            this._contentContainer.add(frLabel);
        }

        // Colline info
        const collineY = startY + 180;
        const collineText = this.add.text(GAME_WIDTH / 2, collineY, 'COLLINE — terrain special avec pente (slope)', {
            fontFamily: 'monospace', fontSize: '12px', color: '#9E9E8E', shadow: SHADOW
        }).setOrigin(0.5);
        this._contentContainer.add(collineText);
    }

    // === UI TAB ===
    _showUITab() {
        const uiKeys = [
            'v2_logo', 'v2_panel_simple', 'v2_panel_ornate', 'v2_panel_bolted', 'v2_panel_elegant',
            'v2_button', 'v2_button_pressed', 'v2_bar_power', 'v2_bar_decorative',
            'v2_icon_galet', 'v2_icon_star', 'v2_frame_portrait',
            'v2_dialog_bg', 'v2_trophy', 'v2_padlock', 'v2_stat_icons', 'v2_terrain_terre'
        ];

        const startY = 70;
        const cols = 5;
        const cellW = Math.floor((GAME_WIDTH - 40) / cols);
        const cellH = 110;

        for (let i = 0; i < uiKeys.length; i++) {
            const key = uiKeys[i];
            const col = i % cols;
            const row = Math.floor(i / cols);
            const cx = 20 + col * cellW + cellW / 2;
            const cy = startY + row * cellH + 50;

            if (this.textures.exists(key)) {
                const img = this.add.image(cx, cy, key).setOrigin(0.5);
                // Fit within cell
                const maxW = cellW - 16;
                const maxH = cellH - 30;
                const scaleW = maxW / img.width;
                const scaleH = maxH / img.height;
                const fitScale = Math.min(scaleW, scaleH, 1.0);
                img.setScale(fitScale);
                this._contentContainer.add(img);
                this._uiElements.push(img);
            } else {
                const missing = this.add.text(cx, cy, 'N/A', {
                    fontFamily: 'monospace', fontSize: '14px', color: '#C44B3F', shadow: SHADOW
                }).setOrigin(0.5);
                this._contentContainer.add(missing);
            }

            // Label
            const label = this.add.text(cx, cy + 42, key.replace('v2_', ''), {
                fontFamily: 'monospace', fontSize: '8px', color: '#D4A574', shadow: SHADOW
            }).setOrigin(0.5);
            this._contentContainer.add(label);
        }
    }

    // === SCALE CONTROL ===
    _adjustScale(delta) {
        this._currentScale = Phaser.Math.Clamp(this._currentScale + delta, 0.1, 2.0);
        this._scaleText.setText(`Scale: ${this._currentScale.toFixed(2)}`);

        // Apply to sprites tab if active
        if (this._currentTab === 0) {
            for (const sprite of this._sprites) {
                sprite.setScale(this._currentScale);
            }
        }
    }
}
