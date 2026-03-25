import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, CSS, UI, FONT_PIXEL, SHOP_CARD_WIDTH } from '../utils/Constants.js';
import { loadSave, saveSave, spendGalets, setSelectedBoule, setSelectedCochonnet } from '../utils/SaveManager.js';
import { setSoundScene, sfxUIClick, sfxUIHover } from '../utils/SoundManager.js';
import UIFactory from '../ui/UIFactory.js';
import { fadeToScene } from '../utils/SceneTransition.js';
import I18n from '../utils/I18n.js';

const SHADOW = UIFactory.SHADOW;

const TABS = [
    { id: 'boules', labelKey: 'shop.tab_balls', fallback: 'Boules', icon: '\u25CF' },
    { id: 'cochonnets', labelKey: 'shop.tab_jacks', fallback: 'Cochonnets', icon: '\u25C9' },
    { id: 'capacites', labelKey: 'shop.tab_abilities', fallback: 'Capacites', icon: '\u2726' }
];

// Layout: left preview panel + right grid
const PREVIEW_W = 200;
const GRID_X = PREVIEW_W + 15;
const GRID_COLS = 4;
const CARD_W = SHOP_CARD_WIDTH;
const CARD_H = 82;
const CARD_GAP_X = 8;
const CARD_GAP_Y = 8;
const GRID_TOP = 80;
const TAB_Y = 50;

export default class ShopScene extends Phaser.Scene {
    constructor() {
        super('ShopScene');
    }

    init() {
        this.activeTab = 0;
        this.selectedIndex = 0;
        this._cardElements = [];
        this._previewElements = [];
        this._tabElements = [];
        this._purchasing = false;
        this._scrollOffset = 0;
    }

    create() {
        this.cameras.main.setAlpha(1);
        this.cameras.main.resetFX();
        setSoundScene(this);
        UIFactory.fadeIn(this);

        this.shopData = this.cache.json.get('shop') || {};
        this.boulesData = this.cache.json.get('boules') || {};
        this._save = loadSave();

        if (!this.shopData.categories) {
            fadeToScene(this, 'TitleScene');
            return;
        }

        this._drawBackground();
        this._drawHeader();
        this._drawTabs();
        this._drawPreview();
        this._drawItems();
        this._setupInput();

        // Back button
        UIFactory.addBackButton(this, 'TitleScene');
        const controlsHint = I18n.t('shop.controls_hint') !== 'shop.controls_hint'
            ? I18n.t('shop.controls_hint')
            : 'Fleches Naviguer     Entree Acheter     1-3 Onglets     Echap Retour';
        UIFactory.addControlsHint(this, controlsHint);

        this.events.on('shutdown', this._shutdown, this);
    }

    _shutdown() {
        this.input.keyboard.removeAllListeners();
        this.tweens.killAll();
    }

    // ================================================================
    // BACKGROUND
    // ================================================================
    _drawBackground() {
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x1A1510, 0x1A1510, 0x2A2520, 0x2A2520, 1);
        bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Subtle texture
        for (let i = 0; i < 60; i++) {
            bg.fillStyle(0xFFFFFF, Phaser.Math.FloatBetween(0.01, 0.03));
            bg.fillRect(Phaser.Math.Between(0, GAME_WIDTH), Phaser.Math.Between(0, GAME_HEIGHT), 1, 1);
        }

        // Preview panel background
        const lpg = this.add.graphics().setDepth(0);
        lpg.fillStyle(0x2A2018, 0.5);
        lpg.fillRect(0, 40, PREVIEW_W, GAME_HEIGHT - 80);
        lpg.lineStyle(1, 0xD4A574, 0.2);
        lpg.lineBetween(PREVIEW_W, 50, PREVIEW_W, GAME_HEIGHT - 50);
        UIFactory.addPanelShadow(lpg);
    }

    // ================================================================
    // HEADER
    // ================================================================
    _drawHeader() {
        this.add.text(16, 18, 'BOUTIQUE', {
            fontFamily: FONT_PIXEL, fontSize: '16px',
            color: CSS.OR, shadow: { offsetX: 2, offsetY: 2, color: '#1A1510', blur: 0, fill: true }
        }).setDepth(5);

        // Galets display
        this._galetsDisplay = UIFactory.createGaletsDisplay(this, UI.GALETS_X, UI.GALETS_Y);
    }

    // ================================================================
    // TAB BAR
    // ================================================================
    _drawTabs() {
        this._clearTabs();
        const tabW = (GAME_WIDTH - GRID_X - 10) / TABS.length;

        TABS.forEach((tab, i) => {
            const tx = GRID_X + i * tabW + tabW / 2;
            const isActive = i === this.activeTab;

            const tbg = this.add.graphics().setDepth(5);
            if (isActive) {
                tbg.fillStyle(0x3A2E28, 0.8);
                tbg.fillRoundedRect(tx - tabW / 2 + 2, TAB_Y - 2, tabW - 4, 22, { tl: 6, tr: 6, bl: 0, br: 0 });
                tbg.fillStyle(0xFFD700, 0.8);
                tbg.fillRect(tx - 25, TAB_Y + 18, 50, 2);
            }

            const tabLabel = I18n.t(tab.labelKey) !== tab.labelKey ? I18n.t(tab.labelKey) : tab.fallback;
            const txt = this.add.text(tx, TAB_Y + 8, `${tab.icon} ${tabLabel}`, {
                fontFamily: FONT_PIXEL, fontSize: '8px',
                color: isActive ? CSS.OR : CSS.GRIS, shadow: SHADOW
            }).setOrigin(0.5).setDepth(6);

            const zone = this.add.zone(tx, TAB_Y + 8, tabW - 4, 22)
                .setOrigin(0.5).setInteractive({ useHandCursor: true });
            zone.on('pointerdown', () => { sfxUIClick(); this._switchTab(i); });
            zone.on('pointerover', () => { if (i !== this.activeTab) { txt.setColor(CSS.OCRE); sfxUIHover(); } });
            zone.on('pointerout', () => { if (i !== this.activeTab) txt.setColor(CSS.GRIS); });

            this._tabElements.push(tbg, txt, zone);
        });
    }

    _clearTabs() {
        this._tabElements.forEach(el => el.destroy());
        this._tabElements = [];
    }

    _switchTab(index) {
        if (index === this.activeTab) return;
        this.activeTab = index;
        this.selectedIndex = 0;
        this._scrollOffset = 0;
        this._clearTabs();
        this._drawTabs();
        this._clearCards();
        this._drawItems();
        this._refreshPreview();
    }

    // ================================================================
    // PREVIEW PANEL (left side — shows selected item detail)
    // ================================================================
    _drawPreview() {
        this._refreshPreview();
    }

    _refreshPreview() {
        this._previewElements.forEach(el => { try { el.destroy(); } catch (_) {} });
        this._previewElements = [];

        const category = this.shopData.categories.find(c => c.id === TABS[this.activeTab].id);
        if (!category) return;
        const item = category.items[this.selectedIndex];
        if (!item) return;

        const save = this._save;
        const owned = save.purchases.includes(item.id);
        const canAfford = save.galets >= item.price;
        const totalWins = save.stats?.totalWins || 0;
        const locked = item.minWins && totalWins < item.minWins;
        const cx = PREVIEW_W / 2;

        // Item sprite (large)
        const spriteY = 115;
        if (item.icon && this.textures.exists(item.icon)) {
            const tex = this.textures.get(item.icon);
            const isSheet = tex.frameTotal > 2;
            const spr = isSheet
                ? this.add.sprite(cx, spriteY, item.icon, 0).setScale(1.4).setDepth(5)
                : this.add.image(cx, spriteY, item.icon).setScale(2.2).setDepth(5);
            spr.setOrigin(0.5);
            this._previewElements.push(spr);

            // Glow ring behind
            if (owned) {
                const ring = this.add.graphics().setDepth(4);
                ring.lineStyle(2, 0xFFD700, 0.4);
                ring.strokeCircle(cx, spriteY, 32);
                this._previewElements.push(ring);
            }
        } else {
            // Ability placeholder
            const pg = this.add.graphics().setDepth(5);
            pg.fillStyle(0x9B7BB8, 0.6);
            pg.fillCircle(cx, spriteY, 24);
            pg.lineStyle(2, 0x9B7BB8, 0.8);
            pg.strokeCircle(cx, spriteY, 24);
            this._previewElements.push(pg);

            this._previewElements.push(
                this.add.text(cx, spriteY, '\u2726', {
                    fontSize: '24px', color: '#D4A0FF'
                }).setOrigin(0.5).setDepth(6)
            );
        }

        // Item name
        const shortName = item.name.replace('Boule ', '').replace('Cochonnet ', '');
        this._previewElements.push(
            this.add.text(cx, 155, shortName, {
                fontFamily: FONT_PIXEL, fontSize: '10px',
                color: CSS.CREME, shadow: SHADOW
            }).setOrigin(0.5).setDepth(5)
        );

        // Full description (wrapped)
        this._previewElements.push(
            this.add.text(cx, 175, item.description, {
                fontFamily: 'monospace', fontSize: '8px',
                color: CSS.GRIS, shadow: SHADOW,
                wordWrap: { width: PREVIEW_W - 30 }, align: 'center'
            }).setOrigin(0.5, 0).setDepth(5)
        );

        // Lock gate indicator
        if (locked && !owned) {
            const lockY = 200;
            const lockBg = this.add.graphics().setDepth(5);
            lockBg.fillStyle(0x5A1A1A, 0.6);
            lockBg.fillRoundedRect(cx - 80, lockY - 8, 160, 20, 4);
            this._previewElements.push(lockBg);

            this._previewElements.push(
                this.add.text(cx, lockY + 2, `\u{1F512} ${item.minWins} victoires requises`, {
                    fontFamily: 'monospace', fontSize: '8px',
                    color: '#C44B3F', shadow: SHADOW
                }).setOrigin(0.5).setDepth(6)
            );

            this._previewElements.push(
                this.add.text(cx, lockY + 18, `(${totalWins}/${item.minWins})`, {
                    fontFamily: 'monospace', fontSize: '7px',
                    color: CSS.GRIS, shadow: SHADOW
                }).setOrigin(0.5).setDepth(6)
            );
        }

        // Boule stats from boules.json
        if (item.type === 'boule') {
            const bouleId = item.id.replace(/^boule_/, '');
            const bouleData = this.boulesData?.sets?.find(s => s.id === bouleId);
            if (bouleData) {
                const statsY = 210;

                // Mass
                this._previewElements.push(
                    this.add.text(cx, statsY, `${bouleData.stats.masse}g`, {
                        fontFamily: 'monospace', fontSize: '9px',
                        color: CSS.OCRE, shadow: SHADOW
                    }).setOrigin(0.5).setDepth(5)
                );

                // Bonus
                if (bouleData.bonus) {
                    const bonusTxt = bouleData.bonus
                        .replace('friction_x', 'Friction x')
                        .replace('knockback_x', 'Impact x')
                        .replace('retro_x', 'Retro x')
                        .replace('restitution_x', 'Rebond x');
                    this._previewElements.push(
                        this.add.text(cx, statsY + 14, bonusTxt, {
                            fontFamily: 'monospace', fontSize: '8px',
                            color: '#87CEEB', shadow: SHADOW
                        }).setOrigin(0.5).setDepth(5)
                    );
                }

                // Mini stat bars (precision, puissance)
                const barY = statsY + 32;
                const barW = 100;
                const bars = [
                    { label: 'PRE', val: bouleData.stats.precision, max: 5, color: COLORS.STAT_PRECISION },
                    { label: 'PUI', val: bouleData.stats.puissance, max: 5, color: COLORS.STAT_PUISSANCE }
                ];

                const barGfx = this.add.graphics().setDepth(5);
                this._previewElements.push(barGfx);

                bars.forEach((b, i) => {
                    const by = barY + i * 18;
                    this._previewElements.push(
                        this.add.text(cx - barW / 2 - 2, by + 1, b.label, {
                            fontFamily: 'monospace', fontSize: '7px',
                            color: CSS.OCRE, shadow: SHADOW
                        }).setOrigin(1, 0.5).setDepth(5)
                    );
                    barGfx.fillStyle(0x1A1510, 0.6);
                    barGfx.fillRoundedRect(cx - barW / 2, by - 3, barW, 7, 2);
                    barGfx.fillStyle(b.color, 0.8);
                    barGfx.fillRoundedRect(cx - barW / 2, by - 3, barW * (b.val / b.max), 7, 2);
                });
            }
        }

        // ===== PRICE / STATUS =====
        const actionY = 310;

        if (owned) {
            // Owned badge
            const badgeBg = this.add.graphics().setDepth(5);
            badgeBg.fillStyle(0x2A4A1A, 0.8);
            badgeBg.fillRoundedRect(cx - 55, actionY - 10, 110, 24, 6);
            badgeBg.lineStyle(1, 0x44CC44, 0.5);
            badgeBg.strokeRoundedRect(cx - 55, actionY - 10, 110, 24, 6);
            this._previewElements.push(badgeBg);

            this._previewElements.push(
                this.add.text(cx, actionY + 2, '\u2713 POSSEDE', {
                    fontFamily: FONT_PIXEL, fontSize: '9px',
                    color: '#44CC44', shadow: SHADOW
                }).setOrigin(0.5).setDepth(6)
            );

            // Equip button if it's a boule or cochonnet
            if (item.type === 'boule' || item.type === 'cochonnet') {
                const equipped = item.type === 'boule'
                    ? save.selectedBoule === item.id.replace(/^boule_/, '')
                    : save.selectedCochonnet === item.id.replace(/^cochonnet_/, '');

                if (!equipped) {
                    const equipBg = this.add.graphics().setDepth(5);
                    equipBg.fillStyle(0x3A4A5A, 0.8);
                    equipBg.fillRoundedRect(cx - 45, actionY + 20, 90, 22, 6);
                    equipBg.lineStyle(1, 0x87CEEB, 0.5);
                    equipBg.strokeRoundedRect(cx - 45, actionY + 20, 90, 22, 6);
                    this._previewElements.push(equipBg);

                    const equipTxt = this.add.text(cx, actionY + 31, 'EQUIPER', {
                        fontFamily: FONT_PIXEL, fontSize: '8px',
                        color: '#87CEEB', shadow: SHADOW
                    }).setOrigin(0.5).setDepth(6);
                    this._previewElements.push(equipTxt);

                    const equipZone = this.add.zone(cx, actionY + 31, 90, 22)
                        .setOrigin(0.5).setInteractive({ useHandCursor: true });
                    equipZone.on('pointerdown', () => {
                        sfxUIClick();
                        if (item.type === 'boule') setSelectedBoule(item.id.replace(/^boule_/, ''));
                        else setSelectedCochonnet(item.id.replace(/^cochonnet_/, ''));
                        this._save = loadSave();
                        this._refreshPreview();
                    });
                    this._previewElements.push(equipZone);
                } else {
                    this._previewElements.push(
                        this.add.text(cx, actionY + 30, 'Equipee \u2713', {
                            fontFamily: 'monospace', fontSize: '8px',
                            color: CSS.OCRE, shadow: SHADOW
                        }).setOrigin(0.5).setDepth(5)
                    );
                }
            }
        } else if (locked) {
            // Locked by progression
            this._previewElements.push(
                this.add.text(cx, actionY - 5, `${item.price} Galets`, {
                    fontFamily: FONT_PIXEL, fontSize: '11px',
                    color: CSS.GRIS, shadow: SHADOW
                }).setOrigin(0.5).setDepth(5)
            );

            const lockBtnBg = this.add.graphics().setDepth(5);
            lockBtnBg.fillStyle(0x3A2E28, 0.6);
            lockBtnBg.fillRoundedRect(cx - 55, actionY + 12, 110, 28, 6);
            lockBtnBg.lineStyle(1, 0x5A4A3A, 0.4);
            lockBtnBg.strokeRoundedRect(cx - 55, actionY + 12, 110, 28, 6);
            this._previewElements.push(lockBtnBg);

            this._previewElements.push(
                this.add.text(cx, actionY + 26, 'VERROUILLE', {
                    fontFamily: FONT_PIXEL, fontSize: '9px',
                    color: '#5A4A3A', shadow: SHADOW
                }).setOrigin(0.5).setDepth(6)
            );
        } else {
            // Price
            const priceColor = canAfford ? CSS.OR : '#C44B3F';
            this._previewElements.push(
                this.add.text(cx, actionY - 5, `${item.price} Galets`, {
                    fontFamily: FONT_PIXEL, fontSize: '11px',
                    color: priceColor, shadow: SHADOW
                }).setOrigin(0.5).setDepth(5)
            );

            // Buy button
            if (canAfford) {
                const buyBg = this.add.graphics().setDepth(5);
                buyBg.fillStyle(0x2A5A2A, 0.9);
                buyBg.fillRoundedRect(cx - 55, actionY + 12, 110, 28, 6);
                buyBg.lineStyle(1, 0x44CC44, 0.6);
                buyBg.strokeRoundedRect(cx - 55, actionY + 12, 110, 28, 6);
                this._previewElements.push(buyBg);

                const buyTxt = this.add.text(cx, actionY + 26, 'ACHETER', {
                    fontFamily: FONT_PIXEL, fontSize: '10px',
                    color: '#44CC44', shadow: SHADOW
                }).setOrigin(0.5).setDepth(6);
                this._previewElements.push(buyTxt);

                const buyZone = this.add.zone(cx, actionY + 26, 110, 28)
                    .setOrigin(0.5).setInteractive({ useHandCursor: true });
                buyZone.on('pointerdown', () => this._purchaseItem(item));
                buyZone.on('pointerover', () => buyTxt.setColor('#66FF66'));
                buyZone.on('pointerout', () => buyTxt.setColor('#44CC44'));
                this._previewElements.push(buyZone);
            } else {
                this._previewElements.push(
                    this.add.text(cx, actionY + 18, 'Galets insuffisants', {
                        fontFamily: 'monospace', fontSize: '7px',
                        color: '#C44B3F', shadow: SHADOW
                    }).setOrigin(0.5).setDepth(5)
                );
            }
        }
    }

    // ================================================================
    // ITEM GRID (right side — compact cards, scrollable)
    // ================================================================
    _drawItems() {
        this._clearCards();

        const category = this.shopData.categories.find(c => c.id === TABS[this.activeTab].id);
        if (!category) return;

        const items = category.items;
        const save = this._save;
        const maxRows = 4;
        const visibleCount = GRID_COLS * maxRows;

        for (let i = 0; i < items.length; i++) {
            const vi = i - this._scrollOffset * GRID_COLS;
            if (vi < 0 || vi >= visibleCount) continue;

            const col = vi % GRID_COLS;
            const row = Math.floor(vi / GRID_COLS);
            const cx = GRID_X + col * (CARD_W + CARD_GAP_X) + CARD_W / 2;
            const cy = GRID_TOP + row * (CARD_H + CARD_GAP_Y) + CARD_H / 2;

            this._createCard(items[i], i, cx, cy, save);
        }

        // Scroll indicator
        const totalRows = Math.ceil(items.length / GRID_COLS);
        if (totalRows > maxRows) {
            const indG = this.add.graphics().setDepth(5);
            const scrollBarX = GAME_WIDTH - 14;
            const scrollBarH = maxRows * (CARD_H + CARD_GAP_Y) - CARD_GAP_Y;
            const thumbH = Math.max(20, scrollBarH * (maxRows / totalRows));
            const thumbY = GRID_TOP + (scrollBarH - thumbH) * (this._scrollOffset / (totalRows - maxRows));

            indG.fillStyle(0x3A2E28, 0.5);
            indG.fillRoundedRect(scrollBarX, GRID_TOP, 6, scrollBarH, 3);
            indG.fillStyle(0xD4A574, 0.6);
            indG.fillRoundedRect(scrollBarX, thumbY, 6, thumbH, 3);
            this._cardElements.push(indG);
        }
    }

    _createCard(item, index, cx, cy, save) {
        const owned = save.purchases.includes(item.id);
        const totalWins = save.stats?.totalWins || 0;
        const locked = item.minWins && totalWins < item.minWins && !owned;
        const isSelected = index === this.selectedIndex;
        const elements = [];

        // Card background
        const g = this.add.graphics().setDepth(5);
        const x = cx - CARD_W / 2;
        const y = cy - CARD_H / 2;

        // Background color based on state
        if (isSelected) {
            g.fillStyle(locked ? 0x3A2E28 : 0x4A3A28, 0.95);
        } else if (owned) {
            g.fillStyle(0x2A3A22, 0.8);
        } else if (locked) {
            g.fillStyle(0x1A1510, 0.6);
        } else {
            g.fillStyle(0x2A2218, 0.8);
        }
        g.fillRoundedRect(x, y, CARD_W, CARD_H, 5);

        // Border
        if (isSelected) {
            g.lineStyle(2, 0xFFD700, 0.9);
        } else if (owned) {
            g.lineStyle(1, 0x44CC44, 0.4);
        } else {
            g.lineStyle(1, 0xD4A574, 0.2);
        }
        g.strokeRoundedRect(x, y, CARD_W, CARD_H, 5);
        elements.push(g);

        // Icon (compact, left-aligned in card)
        const iconX = x + 28;
        const iconY = cy - 8;
        if (item.icon && this.textures.exists(item.icon)) {
            const tex = this.textures.get(item.icon);
            const isSheet = tex.frameTotal > 2;
            const icon = isSheet
                ? this.add.sprite(iconX, iconY, item.icon, 0).setScale(0.5).setDepth(6)
                : this.add.image(iconX, iconY, item.icon).setScale(0.75).setDepth(6);
            icon.setOrigin(0.5);
            if (locked) icon.setAlpha(0.35);
            elements.push(icon);
        } else {
            const ph = this.add.graphics().setDepth(6);
            ph.fillStyle(item.type === 'ability' ? 0x9B7BB8 : 0xD4A574, 0.6);
            ph.fillCircle(iconX, iconY, 12);
            elements.push(ph);
        }

        // Name (right of icon)
        const shortName = item.name.replace('Boule ', '').replace('Cochonnet ', '');
        elements.push(
            this.add.text(x + 56, cy - 16, shortName, {
                fontFamily: 'monospace', fontSize: '9px',
                color: isSelected ? CSS.OR : CSS.CREME, shadow: SHADOW
            }).setDepth(6)
        );

        // Description (1 line)
        const desc = item.description.length > 26 ? item.description.substring(0, 24) + '..' : item.description;
        elements.push(
            this.add.text(x + 56, cy - 2, desc, {
                fontFamily: 'monospace', fontSize: '7px',
                color: CSS.GRIS, shadow: SHADOW
            }).setDepth(6)
        );

        // Price / owned badge (bottom of card)
        if (owned) {
            elements.push(
                this.add.text(x + 56, cy + 14, '\u2713 Possede', {
                    fontFamily: 'monospace', fontSize: '8px',
                    color: '#44CC44', shadow: SHADOW
                }).setDepth(6)
            );
        } else if (locked) {
            elements.push(
                this.add.text(x + 56, cy + 14, `\u{1F512} ${item.minWins} victoires`, {
                    fontFamily: 'monospace', fontSize: '8px',
                    color: '#5A4A3A', shadow: SHADOW
                }).setDepth(6)
            );
        } else {
            const canAfford = save.galets >= item.price;
            elements.push(
                this.add.text(x + 56, cy + 14, `${item.price} G`, {
                    fontFamily: 'monospace', fontSize: '9px',
                    color: canAfford ? CSS.OR : '#C44B3F', shadow: SHADOW
                }).setDepth(6)
            );
        }

        // Hit zone
        const zone = this.add.zone(cx, cy, CARD_W, CARD_H)
            .setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(7);
        zone.on('pointerdown', () => {
            if (this.selectedIndex !== index) {
                sfxUIClick();
                this.selectedIndex = index;
                this._clearCards();
                this._drawItems();
                this._refreshPreview();
            }
        });
        zone.on('pointerover', () => {
            if (this.selectedIndex !== index) {
                // Subtle hover highlight
                g.clear();
                g.fillStyle(0x3A3028, 0.9);
                g.fillRoundedRect(x, y, CARD_W, CARD_H, 5);
                g.lineStyle(1, 0xD4A574, 0.5);
                g.strokeRoundedRect(x, y, CARD_W, CARD_H, 5);
                sfxUIHover();
            }
        });
        zone.on('pointerout', () => {
            if (this.selectedIndex !== index) {
                g.clear();
                g.fillStyle(owned ? 0x2A3A22 : 0x2A2218, 0.8);
                g.fillRoundedRect(x, y, CARD_W, CARD_H, 5);
                g.lineStyle(1, owned ? 0x44CC44 : 0xD4A574, owned ? 0.4 : 0.2);
                g.strokeRoundedRect(x, y, CARD_W, CARD_H, 5);
            }
        });
        elements.push(zone);

        this._cardElements.push(...elements);
    }

    _clearCards() {
        this._cardElements.forEach(el => { try { el.destroy(); } catch (_) {} });
        this._cardElements = [];
    }

    // ================================================================
    // PURCHASE
    // ================================================================
    _purchaseItem(item) {
        if (this._purchasing) return;
        this._purchasing = true;
        sfxUIClick();

        // Confirmation overlay
        this._showPurchaseConfirm(item);
    }

    _showPurchaseConfirm(item) {
        const CX = GAME_WIDTH / 2;
        const CY = GAME_HEIGHT / 2;
        const pw = 320, ph = 130;
        const px = CX - pw / 2, py = CY - ph / 2;

        // Overlay sombre
        const overlay = this.add.graphics().setDepth(200);
        overlay.fillStyle(0x1A1510, 0.7);
        overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Panel
        const panel = this.add.graphics().setDepth(201);
        panel.fillStyle(0x3A2E28, 0.98);
        panel.fillRoundedRect(px, py, pw, ph, 10);
        panel.lineStyle(2, 0xD4A574, 0.85);
        panel.strokeRoundedRect(px, py, pw, ph, 10);

        const itemName = item.name || item.id;
        const qTxt = this.add.text(CX, py + 30, `Acheter ${itemName}\npour ${item.price} Galets ?`, {
            fontFamily: 'monospace', fontSize: '12px', color: '#F5E6D0',
            align: 'center', lineSpacing: 4
        }).setOrigin(0.5).setDepth(202);

        const bw = 100, bh = 30;
        const btnY = py + 90;

        // Bouton OUI (vert)
        const ouiGfx = this.add.graphics().setDepth(201);
        ouiGfx.fillStyle(0x2A5A2A, 0.9);
        ouiGfx.fillRoundedRect(CX - bw - 10, btnY - bh / 2, bw, bh, 6);
        ouiGfx.lineStyle(1, 0x44CC44, 0.7);
        ouiGfx.strokeRoundedRect(CX - bw - 10, btnY - bh / 2, bw, bh, 6);

        const ouiTxt = this.add.text(CX - bw / 2 - 10, btnY, 'OUI', {
            fontFamily: 'monospace', fontSize: '13px', color: '#44CC44'
        }).setOrigin(0.5).setDepth(202).setInteractive({ useHandCursor: true });

        // Bouton NON (rouge)
        const nonGfx = this.add.graphics().setDepth(201);
        nonGfx.fillStyle(0x5A1A1A, 0.9);
        nonGfx.fillRoundedRect(CX + 10, btnY - bh / 2, bw, bh, 6);
        nonGfx.lineStyle(1, 0xCC4444, 0.7);
        nonGfx.strokeRoundedRect(CX + 10, btnY - bh / 2, bw, bh, 6);

        const nonTxt = this.add.text(CX + bw / 2 + 10, btnY, 'NON', {
            fontFamily: 'monospace', fontSize: '13px', color: '#CC4444'
        }).setOrigin(0.5).setDepth(202).setInteractive({ useHandCursor: true });

        const cleanup = () => {
            overlay.destroy(); panel.destroy(); qTxt.destroy();
            ouiGfx.destroy(); ouiTxt.destroy();
            nonGfx.destroy(); nonTxt.destroy();
        };

        ouiTxt.on('pointerover', () => { ouiTxt.setColor('#66FF66'); sfxUIHover(); });
        ouiTxt.on('pointerout', () => ouiTxt.setColor('#44CC44'));
        ouiTxt.on('pointerup', () => {
            sfxUIClick();
            cleanup();
            this._executePurchase(item);
        });

        nonTxt.on('pointerover', () => { nonTxt.setColor('#FF6666'); sfxUIHover(); });
        nonTxt.on('pointerout', () => nonTxt.setColor('#CC4444'));
        nonTxt.on('pointerup', () => {
            sfxUIClick();
            cleanup();
            this._purchasing = false;
        });
    }

    _executePurchase(item) {
        const success = spendGalets(item.price);
        if (!success) { this._purchasing = false; return; }

        const save = loadSave();
        if (!save.purchases.includes(item.id)) {
            save.purchases.push(item.id);
        }

        if (item.type === 'boule') {
            const shortId = item.id.replace(/^boule_/, '');
            if (!save.unlockedBoules.includes(shortId)) save.unlockedBoules.push(shortId);
        } else if (item.type === 'cochonnet') {
            const shortId = item.id.replace(/^cochonnet_/, '');
            if (!save.unlockedCochonnets.includes(shortId)) save.unlockedCochonnets.push(shortId);
        }

        saveSave(save);
        this._save = save;

        // Visual feedback
        this.cameras.main.flash(150, 255, 215, 0, false);
        UIFactory.showFloatingText(this, PREVIEW_W / 2, 280, 'Debloque !', '#FFD700', {
            fontSize: '16px', rise: 40, duration: 1200
        });

        // Refresh after delay
        this.time.delayedCall(300, () => {
            this._galetsDisplay.refresh();
            this._clearCards();
            this._drawItems();
            this._refreshPreview();
            this._purchasing = false;
        });
    }

    // ================================================================
    // INPUT
    // ================================================================
    _setupInput() {
        this.input.keyboard.on('keydown-ESC', () => { sfxUIClick(); fadeToScene(this, 'TitleScene'); });
        this.input.keyboard.on('keydown-ONE', () => { sfxUIClick(); this._switchTab(0); });
        this.input.keyboard.on('keydown-TWO', () => { sfxUIClick(); this._switchTab(1); });
        this.input.keyboard.on('keydown-THREE', () => { sfxUIClick(); this._switchTab(2); });

        this.input.keyboard.on('keydown-RIGHT', () => this._moveSelection(1, 0));
        this.input.keyboard.on('keydown-LEFT', () => this._moveSelection(-1, 0));
        this.input.keyboard.on('keydown-DOWN', () => this._moveSelection(0, 1));
        this.input.keyboard.on('keydown-UP', () => this._moveSelection(0, -1));
        this.input.keyboard.on('keydown-ENTER', () => this._buyOrEquip());
        this.input.keyboard.on('keydown-SPACE', () => this._buyOrEquip());

        // Mouse wheel scroll
        this.input.on('wheel', (_pointer, _gos, _dx, dy) => {
            const category = this.shopData.categories.find(c => c.id === TABS[this.activeTab].id);
            if (!category) return;
            const totalRows = Math.ceil(category.items.length / GRID_COLS);
            const maxRows = 4;
            if (totalRows <= maxRows) return;

            if (dy > 0 && this._scrollOffset < totalRows - maxRows) {
                this._scrollOffset++;
                this._clearCards();
                this._drawItems();
            } else if (dy < 0 && this._scrollOffset > 0) {
                this._scrollOffset--;
                this._clearCards();
                this._drawItems();
            }
        });
    }

    _moveSelection(dx, dy) {
        const category = this.shopData.categories.find(c => c.id === TABS[this.activeTab].id);
        if (!category) return;
        const count = category.items.length;
        if (count === 0) return;

        const col = this.selectedIndex % GRID_COLS;
        const row = Math.floor(this.selectedIndex / GRID_COLS);
        let newCol = Math.max(0, Math.min(GRID_COLS - 1, col + dx));
        let newRow = Math.max(0, Math.min(Math.ceil(count / GRID_COLS) - 1, row + dy));
        const newIndex = Math.min(newRow * GRID_COLS + newCol, count - 1);

        if (newIndex !== this.selectedIndex) {
            sfxUIClick();
            this.selectedIndex = newIndex;

            // Auto-scroll if needed
            const maxRows = 4;
            const visRow = Math.floor(newIndex / GRID_COLS) - this._scrollOffset;
            if (visRow >= maxRows) {
                this._scrollOffset = Math.floor(newIndex / GRID_COLS) - maxRows + 1;
            } else if (visRow < 0) {
                this._scrollOffset = Math.floor(newIndex / GRID_COLS);
            }

            this._clearCards();
            this._drawItems();
            this._refreshPreview();
        }
    }

    _buyOrEquip() {
        const category = this.shopData.categories.find(c => c.id === TABS[this.activeTab].id);
        if (!category) return;
        const item = category.items[this.selectedIndex];
        if (!item) return;

        const save = this._save;
        const owned = save.purchases.includes(item.id);
        const totalWins = save.stats?.totalWins || 0;
        const locked = item.minWins && totalWins < item.minWins && !owned;

        if (!owned && !locked && save.galets >= item.price) {
            this._purchaseItem(item);
        } else if (owned && (item.type === 'boule' || item.type === 'cochonnet')) {
            sfxUIClick();
            if (item.type === 'boule') setSelectedBoule(item.id.replace(/^boule_/, ''));
            else setSelectedCochonnet(item.id.replace(/^cochonnet_/, ''));
            this._save = loadSave();
            this._refreshPreview();
        }
    }
}
