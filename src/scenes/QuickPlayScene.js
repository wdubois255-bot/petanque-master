import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, CHAR_SPRITE_MAP, CHAR_SCALE_QUICKPLAY, FONT_PIXEL, FONT_BODY, COLORS, CSS, SHADOW_TEXT, UI } from '../utils/Constants.js';
import { setSoundScene, sfxUIClick } from '../utils/SoundManager.js';
import { loadSave } from '../utils/SaveManager.js';
import UIFactory from '../ui/UIFactory.js';

const SHADOW = SHADOW_TEXT;

const CHAR_VALUES = [
    { display: 'Le Rookie', key: 'rookie_animated', sprite: 'rookie_animated', charId: 'rookie' },
    { display: 'La Choupe', key: 'la_choupe_animated', sprite: 'la_choupe_animated', charId: 'la_choupe' },
    { display: 'Ley', key: 'ley_animated', sprite: 'ley_animated', charId: 'ley' },
    { display: 'Foyot', key: 'foyot_animated', sprite: 'foyot_animated', charId: 'foyot' },
    { display: 'Suchaud', key: 'suchaud_animated', sprite: 'suchaud_animated', charId: 'suchaud' },
    { display: 'Fazzino', key: 'fazzino_animated', sprite: 'fazzino_animated', charId: 'fazzino' },
    { display: 'Rocher', key: 'rocher_animated', sprite: 'rocher_animated', charId: 'rocher' },
    { display: 'Robineau', key: 'robineau_animated', sprite: 'robineau_animated', charId: 'robineau' },
    { display: 'Mamie Josette', key: 'mamie_josette_animated', sprite: 'mamie_josette_animated', charId: 'mamie_josette' },
    { display: 'Sofia', key: 'sofia_animated', sprite: 'sofia_animated', charId: 'sofia' },
    { display: 'Papi Rene', key: 'papi_rene_animated', sprite: 'papi_rene_animated', charId: 'papi_rene' },
    { display: 'Rizzi', key: 'rizzi_animated', sprite: 'rizzi_animated', charId: 'rizzi' }
];

const TAB_KEYS = ['personnages', 'equipement', 'terrain', 'reglages'];
const TAB_LABELS = ['PERSONNAGES', 'EQUIPEMENT', 'TERRAIN', 'REGLAGES'];

const DIFFICULTIES = [
    { display: 'Facile', key: 'easy' },
    { display: 'Moyen', key: 'medium' },
    { display: 'Difficile', key: 'hard' }
];

const FORMATS = [
    { display: '3 Boules', key: 3 },
    { display: '2 Boules', key: 2 },
    { display: '1 Boule', key: 1 }
];

const MODES = [
    { display: 'VS IA', key: 'vs_ia' },
    { display: 'Local 1v1', key: 'local' }
];

const CX = GAME_WIDTH / 2;

// Layout constants
const BANNER_H = 32;
const TAB_BAR_Y = BANNER_H + 2;
const TAB_CONTENT_Y = TAB_BAR_Y + 26;
const TAB_CONTENT_H = 310;
const BOTTOM_Y = 428;

const STAT_NAMES = ['precision', 'puissance', 'effet', 'sang_froid'];
const STAT_LABELS = ['PRC', 'PUI', 'EFF', 'SDF'];
const STAT_COLORS = [COLORS.STAT_PRECISION, COLORS.STAT_PUISSANCE, COLORS.STAT_EFFET, COLORS.STAT_ADAPTABILITE];

export default class QuickPlayScene extends Phaser.Scene {
    constructor() {
        super('QuickPlayScene');
    }

    // ================================================================
    // INIT — reset ALL state (Phaser reuses scenes)
    // ================================================================
    init() {
        this._transitioning = false;
        this._activeTab = 0;
        this._p1Index = 0;
        this._p2Index = 1;
        this._bouleIndex = 0;
        this._cochonnetIndex = 0;
        this._terrainIndex = 0;
        this._modeIndex = 0;
        this._difficultyIndex = 0;
        this._formatIndex = 0;
        this._tabObjects = [];
        this._tabBarObjects = [];
        this._bannerObjects = [];
        this._bottomObjects = [];
        this._particles = null;
        this._p1Sprite = null;
        this._p2Sprite = null;
        this._p1BreathTween = null;
        this._p2BreathTween = null;
        this._p1NameText = null;
        this._p2NameText = null;
        this._summaryLabel = null;
        this._allBoules = [];
        this._allCochonnets = [];
        this._ownedBoules = [];
        this._ownedCochonnets = [];
        this._allTerrains = [];
        this._charsData = null;
    }

    // ================================================================
    // CREATE
    // ================================================================
    create() {
        setSoundScene(this);

        // Load data
        this._charsData = this.cache.json.get('characters');
        const boulesData = this.cache.json.get('boules');
        const terrainsData = this.cache.json.get('terrains');
        this._allBoules = boulesData?.sets || [];
        this._allCochonnets = boulesData?.cochonnets || [];
        this._allTerrains = terrainsData?.stages || [];

        // Filter owned items
        const save = loadSave();
        this._ownedBoules = this._allBoules.filter(b => b.unlocked || (save.inventory?.boules && save.inventory.boules.includes(b.id)));
        this._ownedCochonnets = this._allCochonnets.filter(c => c.unlocked || (save.inventory?.cochonnets && save.inventory.cochonnets.includes(c.id)));

        // Fallback: ensure at least 1 boule and 1 cochonnet
        if (this._ownedBoules.length === 0) this._ownedBoules = [this._allBoules[0]];
        if (this._ownedCochonnets.length === 0) this._ownedCochonnets = [this._allCochonnets[0]];

        // Background
        UIFactory.createDarkBackground(this);
        this._particles = UIFactory.createDustParticles(this, 15, { minY: BANNER_H });

        // Build all layers
        this._buildBanner();
        this._buildTabBar();
        this._buildTabContent();
        this._buildBottom();

        // Navigation
        UIFactory.addBackButton(this, 'TitleScene');
        this._setupKeyboard();

        UIFactory.fadeIn(this);
    }

    // ================================================================
    // UPDATE
    // ================================================================
    update(_time, delta) {
        UIFactory.updateParticles(this._particles, delta);
    }

    // ================================================================
    // VS BANNER (top 0-88)
    // ================================================================
    _buildBanner() {
        this._destroyList(this._bannerObjects);
        this._bannerObjects = [];

        // Title left-aligned
        this._bannerObjects.push(
            this.add.text(16, 14, 'PARTIE RAPIDE', {
                fontFamily: FONT_PIXEL, fontSize: '14px',
                color: CSS.OR,
                shadow: { offsetX: 2, offsetY: 2, color: '#1A1510', blur: 0, fill: true }
            }).setOrigin(0, 0.5).setDepth(UI.DEPTH_UI)
        );

        // VS summary right-aligned: "J1 name  VS  J2 name"
        const p1Char = CHAR_VALUES[this._p1Index];
        const p2Char = CHAR_VALUES[this._p2Index];

        this._p1NameText = this.add.text(GAME_WIDTH - 220, 14, p1Char.display, {
            fontFamily: 'monospace', fontSize: '10px',
            color: '#5B9BD5', shadow: SHADOW
        }).setOrigin(1, 0.5).setDepth(UI.DEPTH_UI);
        this._bannerObjects.push(this._p1NameText);

        this._bannerObjects.push(
            this.add.text(GAME_WIDTH - 200, 14, 'VS', {
                fontFamily: FONT_PIXEL, fontSize: '10px',
                color: CSS.ACCENT, shadow: SHADOW
            }).setOrigin(0.5, 0.5).setDepth(UI.DEPTH_UI)
        );

        this._p2NameText = this.add.text(GAME_WIDTH - 180, 14, p2Char.display, {
            fontFamily: 'monospace', fontSize: '10px',
            color: '#C44B3F', shadow: SHADOW
        }).setOrigin(0, 0.5).setDepth(UI.DEPTH_UI);
        this._bannerObjects.push(this._p2NameText);
    }

    // Future: _createBannerSprite will be used for greeting animations per character

    _updateBannerSprite(side) {
        const isP1 = side === 'p1';
        const idx = isP1 ? this._p1Index : this._p2Index;
        const char = CHAR_VALUES[idx];

        // Just update name text in banner
        if (isP1 && this._p1NameText) this._p1NameText.setText(char.display);
        if (!isP1 && this._p2NameText) this._p2NameText.setText(char.display);
    }

    // ================================================================
    // TAB BAR
    // ================================================================
    _buildTabBar() {
        this._destroyList(this._tabBarObjects);
        this._tabBarObjects = [];

        const tabW = 170;
        const totalW = tabW * TAB_LABELS.length;
        const startX = (GAME_WIDTH - totalW) / 2;

        for (let i = 0; i < TAB_LABELS.length; i++) {
            const x = startX + i * tabW + tabW / 2;
            const isActive = i === this._activeTab;

            // Tab background panel
            const tabBg = this.add.graphics().setDepth(UI.DEPTH_PANEL);
            tabBg.fillStyle(isActive ? 0x6B4F2D : 0x3A2E28, isActive ? 0.95 : 0.7);
            tabBg.fillRoundedRect(x - tabW / 2 + 2, TAB_BAR_Y - 12, tabW - 4, 26,
                { tl: 6, tr: 6, bl: 0, br: 0 });
            if (isActive) {
                tabBg.lineStyle(2, COLORS.OR, 0.6);
                tabBg.strokeRoundedRect(x - tabW / 2 + 2, TAB_BAR_Y - 12, tabW - 4, 26,
                    { tl: 6, tr: 6, bl: 0, br: 0 });
            }
            this._tabBarObjects.push(tabBg);

            // Number hint (1-4)
            const numHint = UIFactory.addText(this, x - tabW / 2 + 14, TAB_BAR_Y,
                `${i + 1}`, '8px', isActive ? CSS.OR : CSS.OMBRE, {
                    pixel: true, depth: UI.DEPTH_PANEL + 1, alpha: 0.5
                });
            this._tabBarObjects.push(numHint);

            const label = UIFactory.addText(this, x + 4, TAB_BAR_Y,
                TAB_LABELS[i], '9px',
                isActive ? CSS.OR : CSS.GRIS,
                { pixel: true, depth: UI.DEPTH_PANEL + 1 }
            );
            label.setInteractive({ useHandCursor: true });
            const tabIndex = i;
            label.on('pointerdown', () => {
                sfxUIClick();
                this._switchTab(tabIndex);
            });
            label.on('pointerover', () => { if (tabIndex !== this._activeTab) label.setColor(CSS.CREME); });
            label.on('pointerout', () => { if (tabIndex !== this._activeTab) label.setColor(CSS.GRIS); });
            this._tabBarObjects.push(label);
        }
    }

    _switchTab(index) {
        if (index === this._activeTab) return;
        this._activeTab = index;
        this._buildTabBar();
        this._buildTabContent();
    }

    // ================================================================
    // TAB CONTENT
    // ================================================================
    _buildTabContent() {
        this._destroyList(this._tabObjects);
        this._tabObjects = [];

        // Content panel background
        const panelBg = UIFactory.createWoodPanel(this, 16, TAB_CONTENT_Y, GAME_WIDTH - 32, TAB_CONTENT_H, {
            depth: UI.DEPTH_PANEL - 1
        });
        this._tabObjects.push(panelBg);

        switch (TAB_KEYS[this._activeTab]) {
            case 'personnages': this._buildTabPersonnages(); break;
            case 'equipement': this._buildTabEquipement(); break;
            case 'terrain': this._buildTabTerrain(); break;
            case 'reglages': this._buildTabReglages(); break;
        }
    }

    // ----------------------------------------------------------------
    // TAB: PERSONNAGES
    // ----------------------------------------------------------------
    _buildTabPersonnages() {
        const roster = this._charsData?.roster || [];
        const topY = TAB_CONTENT_Y + 8;

        // === ROSTER GRID (fighting game style) ===
        // 2 rows of 6 = 12 characters, each as a clickable card
        const gridCols = 6;
        const cellW = 80;
        const cellH = 82;
        const cellGap = 4;
        const gridW = gridCols * (cellW + cellGap) - cellGap;
        const gridX = CX - gridW / 2;

        // J1 preview sprite (left of grid, vertically centered) — animated greeting
        const leftSpace = gridX - 24;
        const sideX = 12 + leftSpace / 2;
        const sideY = topY + 14 + cellH; // middle of the 2 rows
        const p1Char = CHAR_VALUES[this._p1Index];
        const p1GreetKey = `${p1Char.charId}_greeting`;
        const p1AnimKey = `${p1Char.charId}_greet`;
        if (this.textures.exists(p1GreetKey) && this.anims.exists(p1AnimKey)) {
            const spr = this.add.sprite(sideX, sideY - 10, p1GreetKey, 0)
                .setScale(1.0).setDepth(UI.DEPTH_PANEL + 4);
            spr.play(p1AnimKey);
            this._tabObjects.push(spr);
        } else if (this.textures.exists(p1Char.sprite)) {
            this._tabObjects.push(
                this.add.sprite(sideX, sideY - 10, p1Char.sprite, 0)
                    .setScale(1.0).setDepth(UI.DEPTH_PANEL + 4)
            );
        }
        this._tabObjects.push(this.add.text(sideX, sideY + 28, 'J1', {
            fontFamily: FONT_PIXEL, fontSize: '7px', color: '#5B9BD5', shadow: SHADOW
        }).setOrigin(0.5).setDepth(UI.DEPTH_PANEL + 4));

        // J2 preview sprite (right of grid) — animated greeting
        const rightSpace = GAME_WIDTH - 24 - gridX - gridW;
        const rightX = gridX + gridW + 12 + rightSpace / 2;
        const p2Char = CHAR_VALUES[this._p2Index];
        const p2GreetKey = `${p2Char.charId}_greeting`;
        const p2AnimKey = `${p2Char.charId}_greet`;
        if (this.textures.exists(p2GreetKey) && this.anims.exists(p2AnimKey)) {
            const spr = this.add.sprite(rightX, sideY - 10, p2GreetKey, 0)
                .setScale(1.0).setDepth(UI.DEPTH_PANEL + 4).setFlipX(true);
            spr.play(p2AnimKey);
            this._tabObjects.push(spr);
        } else if (this.textures.exists(p2Char.sprite)) {
            this._tabObjects.push(
                this.add.sprite(rightX, sideY - 10, p2Char.sprite, 0)
                    .setScale(1.0).setDepth(UI.DEPTH_PANEL + 4).setFlipX(true)
            );
        }
        this._tabObjects.push(this.add.text(rightX, sideY + 28, 'J2', {
            fontFamily: FONT_PIXEL, fontSize: '7px', color: '#C44B3F', shadow: SHADOW
        }).setOrigin(0.5).setDepth(UI.DEPTH_PANEL + 4));

        for (let i = 0; i < CHAR_VALUES.length; i++) {
            const col = i % gridCols;
            const row = Math.floor(i / gridCols);
            const cx = gridX + col * (cellW + cellGap) + cellW / 2;
            const cy = topY + 14 + row * (cellH + cellGap) + cellH / 2;
            const char = CHAR_VALUES[i];
            const isP1 = i === this._p1Index;
            const isP2 = i === this._p2Index;

            // Cell background
            const cellGfx = this.add.graphics().setDepth(UI.DEPTH_PANEL + 2);
            cellGfx.fillStyle(isP1 ? 0x2A3A5A : isP2 ? 0x5A2A2A : 0x2A2218, 0.8);
            cellGfx.fillRoundedRect(cx - cellW / 2, cy - cellH / 2, cellW, cellH, 4);
            if (isP1) {
                cellGfx.lineStyle(2, 0x5B9BD5, 0.9);
                cellGfx.strokeRoundedRect(cx - cellW / 2, cy - cellH / 2, cellW, cellH, 4);
            } else if (isP2) {
                cellGfx.lineStyle(2, 0xC44B3F, 0.9);
                cellGfx.strokeRoundedRect(cx - cellW / 2, cy - cellH / 2, cellW, cellH, 4);
            } else {
                cellGfx.lineStyle(1, 0xD4A574, 0.2);
                cellGfx.strokeRoundedRect(cx - cellW / 2, cy - cellH / 2, cellW, cellH, 4);
            }
            this._tabObjects.push(cellGfx);

            // Character sprite — greeting frame 0 (static) if available, else canvas frame 0
            const greetKeyGrid = `${char.charId}_greeting`;
            if (this.textures.exists(greetKeyGrid)) {
                const spr = this.add.sprite(cx, cy - 6, greetKeyGrid, 0)
                    .setScale(0.7).setDepth(UI.DEPTH_PANEL + 3);
                this._tabObjects.push(spr);
            } else if (this.textures.exists(char.sprite)) {
                const spr = this.add.sprite(cx, cy - 6, char.sprite, 0)
                    .setScale(0.7).setDepth(UI.DEPTH_PANEL + 3);
                this._tabObjects.push(spr);
            }

            // Name
            const shortName = char.display.length > 10 ? char.display.substring(0, 9) + '.' : char.display;
            this._tabObjects.push(this.add.text(cx, cy + cellH / 2 - 12, shortName, {
                fontFamily: 'monospace', fontSize: '7px',
                color: isP1 ? '#5B9BD5' : isP2 ? '#C44B3F' : CSS.GRIS,
                shadow: SHADOW
            }).setOrigin(0.5).setDepth(UI.DEPTH_PANEL + 3));

            // P1/P2 badge
            if (isP1) {
                this._tabObjects.push(this.add.text(cx - cellW / 2 + 3, cy - cellH / 2 + 2, 'J1', {
                    fontFamily: FONT_PIXEL, fontSize: '6px', color: '#5B9BD5', shadow: SHADOW
                }).setOrigin(0, 0).setDepth(UI.DEPTH_PANEL + 4));
            }
            if (isP2) {
                this._tabObjects.push(this.add.text(cx + cellW / 2 - 3, cy - cellH / 2 + 2, 'J2', {
                    fontFamily: FONT_PIXEL, fontSize: '6px', color: '#C44B3F', shadow: SHADOW
                }).setOrigin(1, 0).setDepth(UI.DEPTH_PANEL + 4));
            }

            // Interactive hit zone
            const zone = this.add.zone(cx, cy, cellW, cellH)
                .setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(UI.DEPTH_PANEL + 5);
            zone.on('pointerdown', () => {
                sfxUIClick();
                // Left click = J1, right click or shift+click = J2
                if (this.input.activePointer.event?.shiftKey || this.input.activePointer.rightButtonDown()) {
                    this._p2Index = i;
                    this._updateBannerSprite('p2');
                } else {
                    this._p1Index = i;
                    this._updateBannerSprite('p1');
                }
                this._buildTabContent();
                this._updateSummary();
            });
            zone.on('pointerover', () => {
                if (!isP1 && !isP2) {
                    cellGfx.clear();
                    cellGfx.fillStyle(0x3A3228, 0.9);
                    cellGfx.fillRoundedRect(cx - cellW / 2, cy - cellH / 2, cellW, cellH, 4);
                    cellGfx.lineStyle(1, 0xD4A574, 0.5);
                    cellGfx.strokeRoundedRect(cx - cellW / 2, cy - cellH / 2, cellW, cellH, 4);
                }
            });
            zone.on('pointerout', () => {
                if (!isP1 && !isP2) {
                    cellGfx.clear();
                    cellGfx.fillStyle(0x2A2218, 0.8);
                    cellGfx.fillRoundedRect(cx - cellW / 2, cy - cellH / 2, cellW, cellH, 4);
                    cellGfx.lineStyle(1, 0xD4A574, 0.2);
                    cellGfx.strokeRoundedRect(cx - cellW / 2, cy - cellH / 2, cellW, cellH, 4);
                }
            });
            this._tabObjects.push(zone);
        }

        // === SELECTED CHARACTERS DETAIL (below grid) ===
        const detailY = topY + 14 + 2 * (cellH + cellGap) + 8;
        const halfW = (GAME_WIDTH - 80) / 2;

        // Horizontal divider above details
        const topDiv = this.add.graphics().setDepth(UI.DEPTH_PANEL + 1);
        topDiv.lineStyle(1, COLORS.OR, 0.15);
        topDiv.lineBetween(40, detailY - 4, GAME_WIDTH - 40, detailY - 4);
        this._tabObjects.push(topDiv);

        // Vertical divider between P1 and P2
        const midDiv = this.add.graphics().setDepth(UI.DEPTH_PANEL + 1);
        midDiv.lineStyle(1, COLORS.OR, 0.15);
        midDiv.lineBetween(CX, detailY, CX, detailY + 90);
        this._tabObjects.push(midDiv);

        // P1 detail
        this._buildCharDetail(40, detailY + 2, halfW, this._p1Index, 'J1', '#5B9BD5');
        // P2 detail
        this._buildCharDetail(40 + halfW + 8, detailY + 2, halfW, this._p2Index, 'J2', '#C44B3F');

        // Hint at bottom
        this._tabObjects.push(this.add.text(CX, detailY + 95,
            'Clic = J1  |  Shift+Clic = J2', {
                fontFamily: 'monospace', fontSize: '7px',
                color: CSS.GRIS, shadow: SHADOW, alpha: 0.5
            }).setOrigin(0.5).setDepth(UI.DEPTH_PANEL + 2));
    }

    _buildCharDetail(x, y, w, charIndex, label, color) {
        const roster = this._charsData?.roster || [];
        const char = CHAR_VALUES[charIndex];
        const charData = roster.find(c => c.id === char.charId);
        if (!charData) return;

        // Label + name
        this._tabObjects.push(this.add.text(x, y, `${label}: ${char.display}`, {
            fontFamily: FONT_PIXEL, fontSize: '8px', color, shadow: SHADOW
        }).setOrigin(0, 0).setDepth(UI.DEPTH_PANEL + 3));

        // Catchphrase
        if (charData.catchphrase) {
            this._tabObjects.push(this.add.text(x, y + 14, `"${charData.catchphrase}"`, {
                fontFamily: 'monospace', fontSize: '8px', color: CSS.OCRE, shadow: SHADOW
            }).setOrigin(0, 0).setDepth(UI.DEPTH_PANEL + 3));
        }

        // Stat bars (compact horizontal)
        if (charData.stats) {
            const gfx = this.add.graphics().setDepth(UI.DEPTH_PANEL + 3);
            const barW = Math.min(w - 80, 140);
            const barX = x + 32;
            const barStartY = y + 30;

            for (let i = 0; i < STAT_NAMES.length; i++) {
                const val = charData.stats[STAT_NAMES[i]] || 0;
                const sy = barStartY + i * 16;

                this._tabObjects.push(this.add.text(barX - 4, sy + 3, STAT_LABELS[i], {
                    fontFamily: 'monospace', fontSize: '7px', color: CSS.GRIS, shadow: SHADOW
                }).setOrigin(1, 0.5).setDepth(UI.DEPTH_PANEL + 3));

                UIFactory.drawStatBar(gfx, barX, sy, barW, 6, val, 10, STAT_COLORS[i]);

                this._tabObjects.push(this.add.text(barX + barW + 6, sy + 3, `${val}`, {
                    fontFamily: 'monospace', fontSize: '7px', color: CSS.CREME, shadow: SHADOW
                }).setOrigin(0, 0.5).setDepth(UI.DEPTH_PANEL + 3));
            }
            this._tabObjects.push(gfx);
        }
    }

    // ----------------------------------------------------------------
    // TAB: EQUIPEMENT
    // ----------------------------------------------------------------
    _buildTabEquipement() {
        const colW = (GAME_WIDTH - 64) / 2;
        const leftX = 32;
        const rightX = 32 + colW + 8;
        const topY = TAB_CONTENT_Y + 12;

        // Column headers
        this._tabObjects.push(UIFactory.addText(this, leftX + colW / 2, topY, 'BOULES', '10px', CSS.OR, {
            pixel: true, depth: UI.DEPTH_PANEL + 2
        }));
        this._tabObjects.push(UIFactory.addText(this, rightX + colW / 2, topY, 'COCHONNET', '10px', CSS.OR, {
            pixel: true, depth: UI.DEPTH_PANEL + 2
        }));

        // Divider
        const midDiv = this.add.graphics().setDepth(UI.DEPTH_PANEL + 1);
        midDiv.lineStyle(1, COLORS.OR, 0.25);
        midDiv.lineBetween(CX, topY + 16, CX, topY + TAB_CONTENT_H - 40);
        this._tabObjects.push(midDiv);

        // Boule display
        this._buildBouleColumn(leftX, topY + 18, colW - 8);

        // Cochonnet display
        this._buildCochonnetColumn(rightX, topY + 18, colW - 8);
    }

    _buildBouleColumn(x, y, w) {
        const centerX = x + w / 2;
        const boule = this._ownedBoules[this._bouleIndex] || this._allBoules[0];
        if (!boule) return;

        // Ball sprite (large)
        const texKey = boule.textureKey || ('ball_' + boule.id);
        if (this.textures.exists(texKey)) {
            const spr = this.add.sprite(centerX, y + 50, texKey)
                .setScale(1.2)
                .setDepth(UI.DEPTH_PANEL + 3);
            this._tabObjects.push(spr);
        } else {
            // Color circle fallback
            const gfx = this.add.graphics().setDepth(UI.DEPTH_PANEL + 3);
            const c = parseInt((boule.color || '#A8B5C2').replace('#', ''), 16);
            gfx.fillStyle(c, 1);
            gfx.fillCircle(centerX, y + 50, 24);
            gfx.lineStyle(2, 0xFFFFFF, 0.3);
            gfx.strokeCircle(centerX, y + 50, 24);
            // Highlight
            gfx.fillStyle(0xFFFFFF, 0.25);
            gfx.fillCircle(centerX - 6, y + 42, 8);
            this._tabObjects.push(gfx);
        }

        // Name
        this._tabObjects.push(UIFactory.addText(this, centerX, y + 90, boule.name, '11px', CSS.OR, {
            pixel: true, depth: UI.DEPTH_PANEL + 3
        }));

        // Description
        this._tabObjects.push(UIFactory.addText(this, centerX, y + 108, boule.description || '', '9px', CSS.CREME, {
            depth: UI.DEPTH_PANEL + 3, wrapWidth: w - 20, align: 'center'
        }));

        // Stat bars for boule
        const gfx = this.add.graphics().setDepth(UI.DEPTH_PANEL + 3);
        const barW = Math.min(w - 40, 130);
        const barX = centerX - barW / 2 - 18;
        const barStartY = y + 140;

        const bouleStats = [
            { label: 'PRC', val: boule.stats?.precision || 3, color: COLORS.STAT_PRECISION },
            { label: 'PUI', val: boule.stats?.puissance || 3, color: COLORS.STAT_PUISSANCE }
        ];

        for (let i = 0; i < bouleStats.length; i++) {
            const sy = barStartY + i * 20;
            this._tabObjects.push(UIFactory.addText(this, barX, sy + 4,
                bouleStats[i].label, '8px', CSS.GRIS, {
                    pixel: true, depth: UI.DEPTH_PANEL + 3, originX: 0
                }));
            UIFactory.drawStatBar(gfx, barX + 36, sy, barW, 8, bouleStats[i].val, 5, bouleStats[i].color);
        }
        this._tabObjects.push(gfx);

        // Bonus text
        if (boule.bonus) {
            this._tabObjects.push(UIFactory.addText(this, centerX, barStartY + 48,
                'Bonus: ' + boule.bonus, '8px', CSS.LAVANDE, {
                    depth: UI.DEPTH_PANEL + 3
                }));
        }

        // Lore
        if (boule.lore) {
            this._tabObjects.push(UIFactory.addText(this, centerX, barStartY + 66,
                boule.lore, '8px', CSS.OCRE, {
                    depth: UI.DEPTH_PANEL + 3, wrapWidth: w - 16, align: 'center',
                    alpha: 0.7
                }));
        }

        // Counter
        this._tabObjects.push(UIFactory.addText(this, centerX, y + 248,
            (this._bouleIndex + 1) + ' / ' + this._ownedBoules.length, '8px', CSS.GRIS, {
                pixel: true, depth: UI.DEPTH_PANEL + 3
            }));

        // Arrows
        this._tabObjects.push(this._createArrowButton(x + 8, y + 50, '<', () => {
            this._bouleIndex = (this._bouleIndex - 1 + this._ownedBoules.length) % this._ownedBoules.length;
            this._buildTabContent();
            this._updateSummary();
        }));
        this._tabObjects.push(this._createArrowButton(x + w - 8, y + 50, '>', () => {
            this._bouleIndex = (this._bouleIndex + 1) % this._ownedBoules.length;
            this._buildTabContent();
            this._updateSummary();
        }));
    }

    _buildCochonnetColumn(x, y, w) {
        const centerX = x + w / 2;
        const coch = this._ownedCochonnets[this._cochonnetIndex] || this._allCochonnets[0];
        if (!coch) return;

        // Cochonnet sprite
        const texKey = coch.textureKey || 'ball_cochonnet';
        if (this.textures.exists(texKey)) {
            const spr = this.add.sprite(centerX, y + 60, texKey)
                .setScale(1.8)
                .setDepth(UI.DEPTH_PANEL + 3);
            this._tabObjects.push(spr);
        } else {
            const gfx = this.add.graphics().setDepth(UI.DEPTH_PANEL + 3);
            const c = parseInt((coch.color || '#FFD700').replace('#', ''), 16);
            gfx.fillStyle(c, 1);
            gfx.fillCircle(centerX, y + 60, 18);
            gfx.fillStyle(0xFFFFFF, 0.3);
            gfx.fillCircle(centerX - 4, y + 54, 6);
            this._tabObjects.push(gfx);
        }

        // Name
        this._tabObjects.push(UIFactory.addText(this, centerX, y + 100, coch.name, '11px', CSS.OR, {
            pixel: true, depth: UI.DEPTH_PANEL + 3
        }));

        // Description
        this._tabObjects.push(UIFactory.addText(this, centerX, y + 120, coch.description || '', '9px', CSS.CREME, {
            depth: UI.DEPTH_PANEL + 3, wrapWidth: w - 20, align: 'center'
        }));

        // Counter
        this._tabObjects.push(UIFactory.addText(this, centerX, y + 170,
            (this._cochonnetIndex + 1) + ' / ' + this._ownedCochonnets.length, '8px', CSS.GRIS, {
                pixel: true, depth: UI.DEPTH_PANEL + 3
            }));

        // Arrows
        this._tabObjects.push(this._createArrowButton(x + 8, y + 60, '<', () => {
            this._cochonnetIndex = (this._cochonnetIndex - 1 + this._ownedCochonnets.length) % this._ownedCochonnets.length;
            this._buildTabContent();
            this._updateSummary();
        }));
        this._tabObjects.push(this._createArrowButton(x + w - 8, y + 60, '>', () => {
            this._cochonnetIndex = (this._cochonnetIndex + 1) % this._ownedCochonnets.length;
            this._buildTabContent();
            this._updateSummary();
        }));
    }

    // ----------------------------------------------------------------
    // TAB: TERRAIN
    // ----------------------------------------------------------------
    _buildTabTerrain() {
        const terrain = this._allTerrains[this._terrainIndex];
        if (!terrain) return;

        const topY = TAB_CONTENT_Y + 12;
        const previewW = 420;
        const previewH = 220;
        const previewX = CX - previewW / 2;
        const previewY = topY + 8;

        // Terrain preview background
        const previewGfx = this.add.graphics().setDepth(UI.DEPTH_PANEL + 2);
        const bgColor = parseInt((terrain.colors?.bg || '#C4854A').replace('#', ''), 16);

        // Outer frame
        previewGfx.lineStyle(3, COLORS.OR, 0.5);
        previewGfx.strokeRoundedRect(previewX - 2, previewY - 2, previewW + 4, previewH + 4, 6);

        // Fill with terrain color
        previewGfx.fillStyle(bgColor, 1);
        previewGfx.fillRoundedRect(previewX, previewY, previewW, previewH, 4);

        // Gravel texture simulation
        const gravels = terrain.colors?.gravel || [];
        if (gravels.length > 0) {
            for (let i = 0; i < 200; i++) {
                const gx = previewX + Math.random() * previewW;
                const gy = previewY + Math.random() * previewH;
                const gc = parseInt(gravels[Math.floor(Math.random() * gravels.length)].replace('#', ''), 16);
                previewGfx.fillStyle(gc, 0.4 + Math.random() * 0.3);
                previewGfx.fillCircle(gx, gy, 1 + Math.random() * 2);
            }
        }

        // Terrain texture overlay if available
        const surfaceTexMap = {
            terre: 'terrain_tex_terre',
            herbe: 'terrain_tex_herbe',
            sable: 'terrain_tex_sable',
            dalles: 'terrain_tex_dalles'
        };
        const texKey = surfaceTexMap[terrain.surface];
        if (texKey && this.textures.exists(texKey)) {
            const tileSpr = this.add.tileSprite(previewX + previewW / 2, previewY + previewH / 2,
                previewW, previewH, texKey)
                .setDepth(UI.DEPTH_PANEL + 3)
                .setAlpha(0.6);
            this._tabObjects.push(tileSpr);
        }

        // Zone indicators (for parc)
        if (terrain.zones && terrain.zones.length > 0) {
            for (const zone of terrain.zones) {
                const zx = previewX + zone.rect.x * previewW;
                const zy = previewY + zone.rect.y * previewH;
                const zw = zone.rect.w * previewW;
                const zh = zone.rect.h * previewH;
                const zoneColor = parseInt((zone.color || '#B8A888').replace('#', ''), 16);
                previewGfx.fillStyle(zoneColor, 0.4);
                previewGfx.fillRect(zx, zy, zw, zh);
            }
        }

        // Slope indicators (for colline)
        if (terrain.slope_zones && terrain.slope_zones.length > 0) {
            for (const sz of terrain.slope_zones) {
                const sx = previewX + sz.rect.x * previewW;
                const sy = previewY + sz.rect.y * previewH;
                const sw = sz.rect.w * previewW;
                const sh = sz.rect.h * previewH;
                previewGfx.lineStyle(1, COLORS.OR, 0.3);
                previewGfx.strokeRect(sx, sy, sw, sh);
                // Arrow showing slope direction
                const arrow = sz.direction === 'down' ? 'v' : '>';
                this._tabObjects.push(UIFactory.addText(this, sx + sw / 2, sy + sh / 2,
                    arrow, '10px', CSS.OR, { depth: UI.DEPTH_PANEL + 4, alpha: 0.5 }));
            }
        }

        // Wall indicators (for docks)
        if (terrain.walls) {
            previewGfx.lineStyle(4, 0x7A7A70, 0.8);
            previewGfx.strokeRect(previewX + 4, previewY + 4, previewW - 8, previewH - 8);

            this._tabObjects.push(UIFactory.addText(this, previewX + previewW / 2, previewY + previewH - 14,
                'MURS - Les boules rebondissent !', '8px', CSS.GRIS, {
                    depth: UI.DEPTH_PANEL + 4, alpha: 0.7
                }));
        }

        this._tabObjects.push(previewGfx);

        // LOCKED badge
        if (!terrain.unlocked) {
            const lockGfx = this.add.graphics().setDepth(UI.DEPTH_PANEL + 5);
            lockGfx.fillStyle(0x1A1510, 0.6);
            lockGfx.fillRoundedRect(previewX, previewY, previewW, previewH, 4);
            this._tabObjects.push(lockGfx);

            this._tabObjects.push(UIFactory.addText(this, CX, previewY + previewH / 2 - 10,
                'VERROUILLE', '14px', CSS.ACCENT, {
                    pixel: true, heavyShadow: true, depth: UI.DEPTH_PANEL + 6
                }));
            this._tabObjects.push(UIFactory.addText(this, CX, previewY + previewH / 2 + 14,
                'Terminez l\'Arcade pour debloquer', '9px', CSS.GRIS, {
                    depth: UI.DEPTH_PANEL + 6
                }));
        }

        // Info below preview
        const infoY = previewY + previewH + 10;

        // Terrain name
        this._tabObjects.push(UIFactory.addText(this, CX, infoY, terrain.name, '12px', CSS.OR, {
            pixel: true, heavyShadow: true, depth: UI.DEPTH_PANEL + 3
        }));

        // Description
        this._tabObjects.push(UIFactory.addText(this, CX, infoY + 18, terrain.description || '', '9px', CSS.CREME, {
            depth: UI.DEPTH_PANEL + 3, wrapWidth: 600, align: 'center'
        }));

        // Terrain stat bars
        const statsGfx = this.add.graphics().setDepth(UI.DEPTH_PANEL + 3);
        const barW = 120;
        const statsY = infoY + 40;

        // Adherence (derived from friction)
        const adherence = Math.min(5, Math.round(terrain.friction * 1.67));
        UIFactory.drawStatBar(statsGfx, CX - barW - 60, statsY, barW, 8, adherence, 5, COLORS.STAT_ADAPTABILITE);
        this._tabObjects.push(UIFactory.addText(this, CX - barW - 96, statsY + 4,
            'ADH', '8px', CSS.GRIS, { pixel: true, depth: UI.DEPTH_PANEL + 3, originX: 0 }));

        // Complexity
        let complexity = 1;
        if (terrain.zones && terrain.zones.length > 0) complexity += terrain.zones.length;
        if (terrain.slope_zones && terrain.slope_zones.length > 0) complexity += 2;
        if (terrain.walls) complexity += 2;
        complexity = Math.min(5, complexity);
        UIFactory.drawStatBar(statsGfx, CX + 60, statsY, barW, 8, complexity, 5, COLORS.STAT_EFFET);
        this._tabObjects.push(UIFactory.addText(this, CX + 24, statsY + 4,
            'CMP', '8px', CSS.GRIS, { pixel: true, depth: UI.DEPTH_PANEL + 3, originX: 0 }));

        this._tabObjects.push(statsGfx);

        // Counter
        this._tabObjects.push(UIFactory.addText(this, CX, statsY + 22,
            (this._terrainIndex + 1) + ' / ' + this._allTerrains.length, '8px', CSS.GRIS, {
                pixel: true, depth: UI.DEPTH_PANEL + 3
            }));

        // Navigation arrows
        this._tabObjects.push(this._createArrowButton(previewX - 24, previewY + previewH / 2, '<', () => {
            this._terrainIndex = (this._terrainIndex - 1 + this._allTerrains.length) % this._allTerrains.length;
            this._buildTabContent();
            this._updateSummary();
        }));
        this._tabObjects.push(this._createArrowButton(previewX + previewW + 24, previewY + previewH / 2, '>', () => {
            this._terrainIndex = (this._terrainIndex + 1) % this._allTerrains.length;
            this._buildTabContent();
            this._updateSummary();
        }));
    }

    // ----------------------------------------------------------------
    // TAB: REGLAGES
    // ----------------------------------------------------------------
    _buildTabReglages() {
        const topY = TAB_CONTENT_Y + 30;
        const rowH = 56;
        const labelX = CX - 180;
        const valX = CX + 40;

        // MODE
        this._buildSettingRow(labelX, topY, valX, 'MODE', MODES, this._modeIndex, (idx) => {
            this._modeIndex = idx;
            this._buildTabContent();
            this._updateSummary();
        });

        // DIFFICULTY (only visible in VS IA mode)
        if (MODES[this._modeIndex].key === 'vs_ia') {
            this._buildSettingRow(labelX, topY + rowH, valX, 'DIFFICULTE', DIFFICULTIES, this._difficultyIndex, (idx) => {
                this._difficultyIndex = idx;
                this._buildTabContent();
                this._updateSummary();
            });
        }

        // FORMAT
        const formatY = MODES[this._modeIndex].key === 'vs_ia' ? topY + rowH * 2 : topY + rowH;
        this._buildSettingRow(labelX, formatY, valX, 'FORMAT', FORMATS, this._formatIndex, (idx) => {
            this._formatIndex = idx;
            this._buildTabContent();
            this._updateSummary();
        });

        // Description text for current difficulty
        if (MODES[this._modeIndex].key === 'vs_ia') {
            const diffDescriptions = {
                easy: 'L\'IA est genereuse. Ideal pour decouvrir.',
                medium: 'L\'IA joue correctement. Un bon defi.',
                hard: 'L\'IA est impitoyable. Bonne chance.'
            };
            const desc = diffDescriptions[DIFFICULTIES[this._difficultyIndex].key] || '';
            this._tabObjects.push(UIFactory.addText(this, CX, formatY + rowH + 10, desc, '9px', CSS.OCRE, {
                depth: UI.DEPTH_PANEL + 3, alpha: 0.8
            }));
        }
    }

    _buildSettingRow(labelX, y, valX, label, options, currentIndex, onChange) {
        // Label
        this._tabObjects.push(UIFactory.addText(this, labelX, y, label, '10px', CSS.GRIS, {
            pixel: true, depth: UI.DEPTH_PANEL + 3, originX: 0
        }));

        // Current value (highlighted)
        const val = options[currentIndex];
        this._tabObjects.push(UIFactory.addText(this, valX, y, val.display, '12px', CSS.OR, {
            pixel: true, depth: UI.DEPTH_PANEL + 3
        }));

        // Arrows
        this._tabObjects.push(this._createArrowButton(valX - 80, y, '<', () => {
            const newIdx = (currentIndex - 1 + options.length) % options.length;
            onChange(newIdx);
        }));
        this._tabObjects.push(this._createArrowButton(valX + 80, y, '>', () => {
            const newIdx = (currentIndex + 1) % options.length;
            onChange(newIdx);
        }));
    }

    // ================================================================
    // BOTTOM: JOUER BUTTON + SUMMARY
    // ================================================================
    _buildBottom() {
        this._destroyList(this._bottomObjects);
        this._bottomObjects = [];

        // Summary text
        const summaryText = this._getSummaryText();
        this._summaryLabel = this.add.text(CX, BOTTOM_Y - 4, summaryText, {
            fontFamily: 'monospace', fontSize: '8px',
            color: CSS.OCRE, shadow: SHADOW, alpha: 0.7
        }).setOrigin(0.5).setDepth(UI.DEPTH_UI);
        this._bottomObjects.push(this._summaryLabel);

        // JOUER button
        const btnW = 220;
        const btnH = 36;
        const btn = UIFactory.createWoodButton(this, CX, BOTTOM_Y + 22, btnW, btnH, 'JOUER !', {
            fontSize: '16px',
            selectedTextColor: CSS.OR,
            depth: UI.DEPTH_UI,
            onDown: () => this._launchGame()
        });
        this._bottomObjects.push(btn.container);

        // Pulse animation on JOUER button
        this.tweens.add({
            targets: btn.container,
            scaleX: 1.02, scaleY: 1.02,
            duration: 800, yoyo: true, repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Controls hint
        this._bottomObjects.push(UIFactory.addControlsHint(this,
            '[1-4] Onglets  [Fleches] Naviguer  [Entree] Jouer  [Echap] Retour',
            { depth: UI.DEPTH_UI }
        ));
    }

    _getSummaryText() {
        const p1 = CHAR_VALUES[this._p1Index].display;
        const p2 = CHAR_VALUES[this._p2Index].display;
        const terrain = this._allTerrains[this._terrainIndex]?.name || 'Village';
        const mode = MODES[this._modeIndex].key === 'local' ? 'Local' : DIFFICULTIES[this._difficultyIndex].display;
        const format = FORMATS[this._formatIndex].display;
        return p1 + ' vs ' + p2 + ' | ' + terrain + ' | ' + mode + ' | ' + format;
    }

    _updateSummary() {
        if (this._summaryLabel) {
            this._summaryLabel.setText(this._getSummaryText());
        }
    }

    // ================================================================
    // ARROW BUTTON HELPER
    // ================================================================
    _createArrowButton(x, y, label, onClick) {
        const arrowBg = this.add.graphics().setDepth(UI.DEPTH_PANEL + 4);
        arrowBg.fillStyle(0x3A2E28, 0.8);
        arrowBg.fillRoundedRect(x - 14, y - 14, 28, 28, 6);
        arrowBg.lineStyle(1, COLORS.OR, 0.3);
        arrowBg.strokeRoundedRect(x - 14, y - 14, 28, 28, 6);

        const arrow = this.add.text(x, y, label, {
            fontFamily: FONT_PIXEL,
            fontSize: '14px',
            color: CSS.CREME,
            shadow: SHADOW
        }).setOrigin(0.5).setDepth(UI.DEPTH_PANEL + 5).setInteractive({ useHandCursor: true });

        arrow.on('pointerover', () => {
            arrow.setColor(CSS.OR);
            arrowBg.clear();
            arrowBg.fillStyle(0x5A4A38, 0.9);
            arrowBg.fillRoundedRect(x - 14, y - 14, 28, 28, 6);
            arrowBg.lineStyle(1, COLORS.OR, 0.6);
            arrowBg.strokeRoundedRect(x - 14, y - 14, 28, 28, 6);
        });
        arrow.on('pointerout', () => {
            arrow.setColor(CSS.CREME);
            arrowBg.clear();
            arrowBg.fillStyle(0x3A2E28, 0.8);
            arrowBg.fillRoundedRect(x - 14, y - 14, 28, 28, 6);
            arrowBg.lineStyle(1, COLORS.OR, 0.3);
            arrowBg.strokeRoundedRect(x - 14, y - 14, 28, 28, 6);
        });
        arrow.on('pointerdown', () => {
            sfxUIClick();
            onClick();
        });

        const group = this.add.container(0, 0, [arrowBg, arrow]).setDepth(UI.DEPTH_PANEL + 5);
        return group;
    }

    // ================================================================
    // KEYBOARD NAVIGATION
    // ================================================================
    _setupKeyboard() {
        this.input.keyboard.on('keydown-ONE', () => { sfxUIClick(); this._switchTab(0); });
        this.input.keyboard.on('keydown-TWO', () => { sfxUIClick(); this._switchTab(1); });
        this.input.keyboard.on('keydown-THREE', () => { sfxUIClick(); this._switchTab(2); });
        this.input.keyboard.on('keydown-FOUR', () => { sfxUIClick(); this._switchTab(3); });

        this.input.keyboard.on('keydown-LEFT', () => this._handleArrowKey(-1));
        this.input.keyboard.on('keydown-RIGHT', () => this._handleArrowKey(1));
        this.input.keyboard.on('keydown-UP', () => this._handleVerticalKey(-1));
        this.input.keyboard.on('keydown-DOWN', () => this._handleVerticalKey(1));

        this.input.keyboard.on('keydown-ENTER', () => this._launchGame());
        this.input.keyboard.on('keydown-SPACE', () => this._launchGame());
    }

    _handleArrowKey(dir) {
        sfxUIClick();
        switch (TAB_KEYS[this._activeTab]) {
            case 'personnages':
                // Left/Right = cycle J1
                this._p1Index = (this._p1Index + dir + CHAR_VALUES.length) % CHAR_VALUES.length;
                this._updateBannerSprite('p1');
                this._buildTabContent();
                this._updateSummary();
                break;
            case 'equipement':
                this._bouleIndex = (this._bouleIndex + dir + this._ownedBoules.length) % this._ownedBoules.length;
                this._buildTabContent();
                this._updateSummary();
                break;
            case 'terrain':
                this._terrainIndex = (this._terrainIndex + dir + this._allTerrains.length) % this._allTerrains.length;
                this._buildTabContent();
                this._updateSummary();
                break;
            case 'reglages':
                this._modeIndex = (this._modeIndex + dir + MODES.length) % MODES.length;
                this._buildTabContent();
                this._updateSummary();
                break;
        }
    }

    _handleVerticalKey(dir) {
        sfxUIClick();
        switch (TAB_KEYS[this._activeTab]) {
            case 'personnages':
                this._p2Index = (this._p2Index + dir + CHAR_VALUES.length) % CHAR_VALUES.length;
                this._updateBannerSprite('p2');
                this._buildTabContent();
                this._updateSummary();
                break;
            case 'equipement':
                this._cochonnetIndex = (this._cochonnetIndex + dir + this._ownedCochonnets.length) % this._ownedCochonnets.length;
                this._buildTabContent();
                this._updateSummary();
                break;
            case 'reglages':
                if (MODES[this._modeIndex].key === 'vs_ia') {
                    this._difficultyIndex = (this._difficultyIndex + dir + DIFFICULTIES.length) % DIFFICULTIES.length;
                    this._buildTabContent();
                    this._updateSummary();
                }
                break;
        }
    }

    // ================================================================
    // COMPUTED STATE (for launch)
    // ================================================================
    get _mode() {
        return MODES[this._modeIndex].key;
    }

    get _difficulty() {
        return DIFFICULTIES[this._difficultyIndex].key;
    }

    get _format() {
        return FORMATS[this._formatIndex].key;
    }

    get _p1CharId() {
        return CHAR_VALUES[this._p1Index].charId;
    }

    get _p2CharId() {
        return CHAR_VALUES[this._p2Index].charId;
    }

    get _p1Name() {
        return CHAR_VALUES[this._p1Index].display;
    }

    get _p2Name() {
        return CHAR_VALUES[this._p2Index].display;
    }

    get _terrainKey() {
        return this._allTerrains[this._terrainIndex]?.id || 'village';
    }

    get _bouleKey() {
        const boule = this._ownedBoules[this._bouleIndex];
        return boule?.id || 'acier';
    }

    get _cochonnetKey() {
        const coch = this._ownedCochonnets[this._cochonnetIndex];
        return coch?.id || 'classique';
    }

    // ================================================================
    // LAUNCH GAME (preserved exactly)
    // ================================================================
    _launchGame() {
        const isLocal = this._mode === 'local';
        const charsData = this.cache.json.get('characters');
        let p1Char = charsData?.roster?.find(c => c.id === this._p1CharId) || null;
        const p2Char = charsData?.roster?.find(c => c.id === this._p2CharId) || null;

        if (p1Char && (p1Char.isRookie || p1Char.id === 'rookie')) {
            const save = loadSave();
            if (save.rookie) p1Char = { ...p1Char, stats: { ...save.rookie.stats } };
        }

        UIFactory.transitionTo(this, 'PetanqueScene', {
            terrain: this._terrainKey,
            difficulty: isLocal ? 'medium' : this._difficulty,
            format: this._format,
            opponentName: this._p2Name,
            opponentId: 'quickplay_' + this._p2CharId,
            returnScene: 'QuickPlayScene',
            personality: p2Char?.ai?.personality || null,
            playerCharacter: p1Char,
            opponentCharacter: p2Char,
            localMultiplayer: isLocal,
            quickPlay: true,
            bouleType: this._bouleKey,
            cochonnetType: this._cochonnetKey
        });
    }

    // ================================================================
    // UTILITY
    // ================================================================
    _destroyList(list) {
        if (!list) return;
        for (const obj of list) {
            if (obj && obj.destroy) obj.destroy();
        }
        list.length = 0;
    }
}
