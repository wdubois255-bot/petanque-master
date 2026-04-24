import Phaser from 'phaser';
import { COLORS, CSS, UI, FONT_PIXEL, SHOP_CARD_WIDTH, BOULE_RAYON_TO_MM } from '../utils/Constants.js';
import Layout from '../utils/Layout.js';
import { loadSave, saveSave, spendGalets, setSelectedBoule, setSelectedCochonnet } from '../utils/SaveManager.js';
import { setSoundScene, sfxUIClick, sfxUIHover } from '../utils/SoundManager.js';
import UIFactory from '../ui/UIFactory.js';
import { fadeToScene } from '../utils/SceneTransition.js';
import I18n from '../utils/I18n.js';
import { trackShopView, trackPurchase, trackItemEquipped } from '../utils/Analytics.js';

const SHADOW = UIFactory.SHADOW;

const TABS = [
    { id: 'boules', labelKey: 'shop.tab_balls', fallback: 'Boules', icon: '\u25CF' },
    { id: 'cochonnets', labelKey: 'shop.tab_jacks', fallback: 'Cochonnets', icon: '\u25C9' },
    { id: 'capacites', labelKey: 'shop.tab_abilities', fallback: 'Capacites', icon: '\u2726' }
];

// Layout: left preview panel + right grid (desktop) OR top preview + 2-col grid (portrait mobile)
// Portrait mobile : preview compact top + featured deal + tabs + grille 2 cols cartes larges
const IS_PORTRAIT = Layout.isPortrait;
const PREVIEW_W = IS_PORTRAIT ? Layout.W : 200;
// Portrait : preview 270px (240 etait trop court → prix et bonus se chevauchaient)
const PREVIEW_H_PORTRAIT = 270;
const GRID_X = IS_PORTRAIT ? 16 : (PREVIEW_W + 15);
const GRID_COLS = IS_PORTRAIT ? 2 : 4;
const CARD_GAP_X = IS_PORTRAIT ? 14 : 8;
const CARD_GAP_Y = IS_PORTRAIT ? 14 : 8;
const CARD_W = IS_PORTRAIT
    ? Math.floor((Layout.W - 2 * GRID_X - CARD_GAP_X) / 2)
    : SHOP_CARD_WIDTH;
// Portrait : cartes plus grandes (132px) pour fonts lisibles + zone tap confortable
const CARD_H = IS_PORTRAIT ? 132 : 82;
// Featured deal banner (portrait only) — insert band entre preview et tabs
const FEATURED_DEAL_H = IS_PORTRAIT ? 76 : 0;
const FEATURED_DEAL_Y = IS_PORTRAIT ? (PREVIEW_H_PORTRAIT + 50) : 0;
// Portrait : tabs 52px (plus confortable)
const TAB_H = IS_PORTRAIT ? 52 : 22;
const GRID_TOP = IS_PORTRAIT ? (PREVIEW_H_PORTRAIT + 60 + FEATURED_DEAL_H + TAB_H + 12) : 80;
const TAB_Y = IS_PORTRAIT ? (PREVIEW_H_PORTRAIT + 60 + FEATURED_DEAL_H + 6) : 50;

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
        this._transitioning = false; // reset for scene reuse (Phaser reuses instances)
    }

    create() {
        this.cameras.main.setAlpha(1);
        this.cameras.main.resetFX();
        setSoundScene(this);
        UIFactory.fadeIn(this);
        trackShopView();

        this.shopData = this.cache.json.get('shop') || {};
        this.boulesData = this.cache.json.get('boules') || {};
        this._save = loadSave();

        if (!this.shopData.categories) {
            fadeToScene(this, 'TitleScene');
            return;
        }

        this._drawBackground();
        this._drawHeader();
        this._drawFeaturedDeal();
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
        bg.fillRect(0, 0, Layout.W, Layout.H);

        // Subtle texture
        for (let i = 0; i < 60; i++) {
            bg.fillStyle(0xFFFFFF, Phaser.Math.FloatBetween(0.01, 0.03));
            bg.fillRect(Phaser.Math.Between(0, Layout.W), Phaser.Math.Between(0, Layout.H), 1, 1);
        }

        // Preview panel background
        const lpg = this.add.graphics().setDepth(0);
        lpg.fillStyle(0x2A2018, 0.5);
        if (IS_PORTRAIT) {
            // Bandeau haut (w=Layout.W, h=PREVIEW_H_PORTRAIT)
            lpg.fillRect(0, 40, Layout.W, PREVIEW_H_PORTRAIT);
            lpg.lineStyle(1, 0xD4A574, 0.2);
            lpg.lineBetween(10, 40 + PREVIEW_H_PORTRAIT, Layout.W - 10, 40 + PREVIEW_H_PORTRAIT);
        } else {
            lpg.fillRect(0, 40, PREVIEW_W, Layout.H - 80);
            lpg.lineStyle(1, 0xD4A574, 0.2);
            lpg.lineBetween(PREVIEW_W, 50, PREVIEW_W, Layout.H - 50);
        }
        UIFactory.addPanelShadow(lpg);
    }

    // ================================================================
    // HEADER
    // ================================================================
    _drawHeader() {
        this.add.text(IS_PORTRAIT ? 20 : 16, IS_PORTRAIT ? 22 : 18, I18n.t('shop_extra.title'), {
            fontFamily: FONT_PIXEL, fontSize: IS_PORTRAIT ? '22px' : '16px',
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
        const tabW = (Layout.W - GRID_X - 10) / TABS.length;

        TABS.forEach((tab, i) => {
            const tx = GRID_X + i * tabW + tabW / 2;
            const isActive = i === this.activeTab;

            const tbg = this.add.graphics().setDepth(5);
            if (IS_PORTRAIT) {
                // Portrait : fond tab plus visible (actif et inactif) pour clarifier zone tap
                tbg.fillStyle(isActive ? 0x4A3A28 : 0x2A2218, isActive ? 0.95 : 0.65);
                tbg.fillRoundedRect(tx - tabW / 2 + 2, TAB_Y, tabW - 4, TAB_H, 8);
                if (isActive) {
                    tbg.lineStyle(2, 0xFFD700, 0.85);
                    tbg.strokeRoundedRect(tx - tabW / 2 + 2, TAB_Y, tabW - 4, TAB_H, 8);
                    // Soulignement or bas
                    tbg.fillStyle(0xFFD700, 0.9);
                    tbg.fillRect(tx - 25, TAB_Y + TAB_H - 3, 50, 2);
                } else {
                    tbg.lineStyle(1, 0xD4A574, 0.25);
                    tbg.strokeRoundedRect(tx - tabW / 2 + 2, TAB_Y, tabW - 4, TAB_H, 8);
                }
            } else if (isActive) {
                tbg.fillStyle(0x3A2E28, 0.8);
                tbg.fillRoundedRect(tx - tabW / 2 + 2, TAB_Y - 2, tabW - 4, 22, { tl: 6, tr: 6, bl: 0, br: 0 });
                tbg.fillStyle(0xFFD700, 0.8);
                tbg.fillRect(tx - 25, TAB_Y + 18, 50, 2);
            }

            const tabLabel = I18n.t(tab.labelKey) !== tab.labelKey ? I18n.t(tab.labelKey) : tab.fallback;
            const txtY = IS_PORTRAIT ? (TAB_Y + TAB_H / 2) : (TAB_Y + 8);
            const txt = this.add.text(tx, txtY, `${tab.icon} ${tabLabel}`, {
                fontFamily: FONT_PIXEL, fontSize: IS_PORTRAIT ? '10px' : '8px',
                color: isActive ? CSS.OR : CSS.GRIS, shadow: SHADOW
            }).setOrigin(0.5).setDepth(6);

            const zone = this.add.zone(tx, txtY, tabW - 4, TAB_H)
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

    // ================================================================
    // FEATURED DEAL (portrait only) — banner deal du jour avec countdown
    // ================================================================
    _drawFeaturedDeal() {
        if (!IS_PORTRAIT || FEATURED_DEAL_H === 0) return;
        if (!this.shopData?.categories) return;

        // Pool de candidats : boules > prix 0 (= achetables)
        const boules = (this.shopData.categories.find(c => c.id === 'boules')?.items || [])
            .filter(it => it.price > 0);
        if (boules.length === 0) return;

        // Seed deterministe base sur date du jour — meme item toute la journee
        const today = new Date().toDateString();
        let hash = 0;
        for (let i = 0; i < today.length; i++) hash = ((hash << 5) - hash + today.charCodeAt(i)) | 0;
        const dealIndex = Math.abs(hash) % boules.length;
        const deal = boules[dealIndex];
        const discountPct = 30;
        const finalPrice = Math.max(1, Math.floor(deal.price * (100 - discountPct) / 100));

        const bx = 10;
        const by = FEATURED_DEAL_Y;
        const bw = Layout.W - 20;
        const bh = FEATURED_DEAL_H - 6;

        // Background gradient or -> terracotta
        const bg = this.add.graphics().setDepth(4);
        bg.fillGradientStyle(0xFFD700, 0xC4854A, 0xFFD700, 0xC4854A, 0.85);
        bg.fillRoundedRect(bx, by, bw, bh, 8);
        bg.lineStyle(2, 0xFFD700, 0.95);
        bg.strokeRoundedRect(bx, by, bw, bh, 8);

        // Pastille "DEAL" top-left
        const tagG = this.add.graphics().setDepth(5);
        tagG.fillStyle(0xC44B3F, 1);
        tagG.fillRoundedRect(bx + 6, by + 6, 44, 16, 4);
        this.add.text(bx + 28, by + 14, 'DEAL', {
            fontFamily: FONT_PIXEL, fontSize: '8px', color: '#FFFFFF', shadow: SHADOW
        }).setOrigin(0.5).setDepth(6);

        // Nom deal + discount — stroke marron pour lisibilite sur gradient or
        const dealName = I18n.field(deal, 'name') || deal.name || deal.id;
        this.add.text(bx + 60, by + 12, `${dealName}`, {
            fontFamily: FONT_PIXEL, fontSize: '11px', color: '#FFFFFF',
            stroke: '#3A1810', strokeThickness: 3
        }).setDepth(6);

        this.add.text(bx + 60, by + 32, `-${discountPct}% : ${finalPrice}G`, {
            fontFamily: FONT_PIXEL, fontSize: '10px', color: '#FFE8A0',
            stroke: '#5A1A1A', strokeThickness: 3
        }).setDepth(6);

        // Countdown text bottom-right
        this._featuredCountdown = this.add.text(bx + bw - 8, by + bh - 8, '', {
            fontFamily: FONT_PIXEL, fontSize: '10px', color: '#FFFFFF',
            stroke: '#3A1810', strokeThickness: 3
        }).setOrigin(1, 1).setDepth(6);

        const updateCountdown = () => {
            const now = new Date();
            const tomorrow = new Date(now);
            tomorrow.setHours(24, 0, 0, 0);
            const ms = tomorrow - now;
            const hh = String(Math.floor(ms / 3600000)).padStart(2, '0');
            const mm = String(Math.floor((ms % 3600000) / 60000)).padStart(2, '0');
            const ss = String(Math.floor((ms % 60000) / 1000)).padStart(2, '0');
            if (this._featuredCountdown && this._featuredCountdown.active) {
                this._featuredCountdown.setText(`⏱ ${hh}:${mm}:${ss}`);
            }
        };
        updateCountdown();
        this.time.addEvent({ delay: 1000, loop: true, callback: updateCountdown });

        // Zone tap -> selectionne l'item dans la grille
        const zone = this.add.zone(bx + bw / 2, by + bh / 2, bw, bh)
            .setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(7);
        zone.on('pointerdown', () => {
            sfxUIClick();
            // Passe sur l'onglet boules
            if (this.activeTab !== 0) this._switchTab(0);
            const cat = this.shopData.categories.find(c => c.id === 'boules');
            const idx = cat?.items.findIndex(it => it.id === deal.id) ?? -1;
            if (idx >= 0) {
                this.selectedIndex = idx;
                this._clearCards();
                this._drawItems();
                this._refreshPreview();
            }
        });
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

        // Y offsets — portrait : panel 270px (y=40..310). action repoussé à 255 pour éviter
        // le chevauchement entre bonus (statsY+16≈196) et prix (action−32≈223).
        const YS = IS_PORTRAIT
            ? { sprite: 88, name: 128, desc: 148, stats: 180, bonus: 198, action: 255 }
            : { sprite: 115, name: 155, desc: 175, stats: 210, bonus: 228, action: 310 };

        // Item sprite (large)
        const spriteY = YS.sprite;
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

        // Item name — portrait font 14px, desktop 10px
        const shortName = I18n.field(item, 'name').replace('Boule ', '').replace('Cochonnet ', '').replace('Ball ', '').replace('Jack ', '');
        this._previewElements.push(
            this.add.text(cx, YS.name, shortName, {
                fontFamily: FONT_PIXEL, fontSize: IS_PORTRAIT ? '14px' : '10px',
                color: CSS.CREME, shadow: SHADOW
            }).setOrigin(0.5).setDepth(5)
        );

        // Full description (wrapped)
        this._previewElements.push(
            this.add.text(cx, YS.desc, I18n.field(item, 'description'), {
                fontFamily: 'monospace', fontSize: IS_PORTRAIT ? '11px' : '8px',
                color: CSS.GRIS, shadow: SHADOW,
                wordWrap: { width: PREVIEW_W - 40 }, align: 'center'
            }).setOrigin(0.5, 0).setDepth(5)
        );

        // Lock gate indicator
        if (locked && !owned) {
            const lockY = IS_PORTRAIT ? 175 : 200;
            const lockBg = this.add.graphics().setDepth(5);
            lockBg.fillStyle(0x5A1A1A, 0.6);
            lockBg.fillRoundedRect(cx - 80, lockY - 8, 160, 20, 4);
            this._previewElements.push(lockBg);

            this._previewElements.push(
                this.add.text(cx, lockY + 2, `\u{1F512} ${I18n.t('shop_extra.wins_required', { n: item.minWins })}`, {
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
            // Portrait + locked: skip stats to avoid overlap with lock indicator + price area
            if (bouleData && !(IS_PORTRAIT && locked && !owned)) {
                // Portrait : stats serrees sous le bloc desc/lock
                const statsY = IS_PORTRAIT
                    ? ((locked && !owned) ? YS.stats + 20 : YS.stats)
                    : ((locked && !owned) ? 240 : 210);

                // Mass + diameter (FIPJP: 650-800g, 70.5-80mm)
                const diam = BOULE_RAYON_TO_MM[bouleData.stats.rayon] ?? (bouleData.stats.rayon * 7);
                this._previewElements.push(
                    this.add.text(cx, statsY, `${bouleData.stats.masse}g · ${diam}mm`, {
                        fontFamily: FONT_PIXEL, fontSize: IS_PORTRAIT ? '13px' : '11px',
                        color: CSS.OCRE, shadow: SHADOW
                    }).setOrigin(0.5).setDepth(5)
                );

                // Bonus effect (player-friendly)
                if (bouleData.bonus) {
                    const bonusTxt = I18n.field(bouleData, 'effect') || bouleData.bonus;
                    this._previewElements.push(
                        this.add.text(cx, statsY + (IS_PORTRAIT ? 16 : 18), bonusTxt, {
                            fontFamily: FONT_PIXEL, fontSize: IS_PORTRAIT ? '11px' : '10px',
                            color: '#87CEEB', shadow: SHADOW,
                            wordWrap: { width: PREVIEW_W - 40 }, align: 'center'
                        }).setOrigin(0.5).setDepth(5)
                    );
                }
            }
        }

        // ===== PRICE / STATUS =====
        const actionY = YS.action;
        // Dimensions des boutons d'action — portrait : plus grands tap targets
        const BTN = IS_PORTRAIT
            ? { w: 220, h: 44, ex: 110, eh: 36, priceFs: '14px', btnFs: '13px' }
            : { w: 110, h: 28, ex: 55,  eh: 22, priceFs: '11px', btnFs: '10px' };

        if (owned) {
            // Owned badge
            const badgeBg = this.add.graphics().setDepth(5);
            badgeBg.fillStyle(0x2A4A1A, 0.8);
            badgeBg.fillRoundedRect(cx - BTN.w / 2, actionY - BTN.h / 2, BTN.w, BTN.h, 8);
            badgeBg.lineStyle(1, 0x44CC44, 0.5);
            badgeBg.strokeRoundedRect(cx - BTN.w / 2, actionY - BTN.h / 2, BTN.w, BTN.h, 8);
            this._previewElements.push(badgeBg);

            this._previewElements.push(
                this.add.text(cx, actionY, I18n.t('shop_extra.owned'), {
                    fontFamily: FONT_PIXEL, fontSize: BTN.btnFs,
                    color: '#44CC44', shadow: SHADOW
                }).setOrigin(0.5).setDepth(6)
            );

            // Equip button if it's a boule or cochonnet
            if (item.type === 'boule' || item.type === 'cochonnet') {
                const equipped = item.type === 'boule'
                    ? save.selectedBoule === item.id.replace(/^boule_/, '')
                    : save.selectedCochonnet === item.id.replace(/^cochonnet_/, '');

                const equipY = actionY + BTN.h / 2 + BTN.eh / 2 + 8;
                if (!equipped) {
                    const equipBg = this.add.graphics().setDepth(5);
                    equipBg.fillStyle(0x3A4A5A, 0.8);
                    equipBg.fillRoundedRect(cx - BTN.ex, equipY - BTN.eh / 2, BTN.ex * 2, BTN.eh, 8);
                    equipBg.lineStyle(1, 0x87CEEB, 0.5);
                    equipBg.strokeRoundedRect(cx - BTN.ex, equipY - BTN.eh / 2, BTN.ex * 2, BTN.eh, 8);
                    this._previewElements.push(equipBg);

                    const equipTxt = this.add.text(cx, equipY, I18n.t('shop_extra.equip'), {
                        fontFamily: FONT_PIXEL, fontSize: BTN.btnFs,
                        color: '#87CEEB', shadow: SHADOW
                    }).setOrigin(0.5).setDepth(6);
                    this._previewElements.push(equipTxt);

                    const equipZone = this.add.zone(cx, equipY, BTN.ex * 2, BTN.eh)
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
                        this.add.text(cx, equipY, I18n.t('shop_extra.equipped'), {
                            fontFamily: 'monospace', fontSize: BTN.btnFs,
                            color: CSS.OCRE, shadow: SHADOW
                        }).setOrigin(0.5).setDepth(5)
                    );
                }
            }
        } else if (locked) {
            // Price + locked pill
            this._previewElements.push(
                this.add.text(cx, actionY - BTN.h / 2 - 10, I18n.t('shop_extra.price_galets', { price: item.price }), {
                    fontFamily: FONT_PIXEL, fontSize: BTN.priceFs,
                    color: CSS.GRIS, shadow: SHADOW
                }).setOrigin(0.5).setDepth(5)
            );

            const lockBtnBg = this.add.graphics().setDepth(5);
            lockBtnBg.fillStyle(0x3A2E28, 0.6);
            lockBtnBg.fillRoundedRect(cx - BTN.w / 2, actionY - BTN.h / 2 + 14, BTN.w, BTN.h, 8);
            lockBtnBg.lineStyle(1, 0x5A4A3A, 0.4);
            lockBtnBg.strokeRoundedRect(cx - BTN.w / 2, actionY - BTN.h / 2 + 14, BTN.w, BTN.h, 8);
            this._previewElements.push(lockBtnBg);

            this._previewElements.push(
                this.add.text(cx, actionY + 14, I18n.t('shop_extra.locked'), {
                    fontFamily: FONT_PIXEL, fontSize: BTN.btnFs,
                    color: '#5A4A3A', shadow: SHADOW
                }).setOrigin(0.5).setDepth(6)
            );
        } else {
            // Price
            const priceColor = canAfford ? CSS.OR : '#C44B3F';
            this._previewElements.push(
                this.add.text(cx, actionY - BTN.h / 2 - 10, I18n.t('shop_extra.price_galets', { price: item.price }), {
                    fontFamily: FONT_PIXEL, fontSize: BTN.priceFs,
                    color: priceColor, shadow: SHADOW
                }).setOrigin(0.5).setDepth(5)
            );

            // Buy button — gros CTA pleine largeur en portrait
            if (canAfford) {
                const buyY = actionY + 14;
                const buyBg = this.add.graphics().setDepth(5);
                buyBg.fillStyle(0x2A5A2A, 0.95);
                buyBg.fillRoundedRect(cx - BTN.w / 2, buyY - BTN.h / 2, BTN.w, BTN.h, 10);
                buyBg.lineStyle(2, 0x44CC44, 0.8);
                buyBg.strokeRoundedRect(cx - BTN.w / 2, buyY - BTN.h / 2, BTN.w, BTN.h, 10);
                this._previewElements.push(buyBg);

                const buyTxt = this.add.text(cx, buyY, I18n.t('shop_extra.buy'), {
                    fontFamily: FONT_PIXEL, fontSize: BTN.btnFs,
                    color: '#FFFFFF', shadow: SHADOW
                }).setOrigin(0.5).setDepth(6);
                this._previewElements.push(buyTxt);

                const buyZone = this.add.zone(cx, buyY, BTN.w, BTN.h)
                    .setOrigin(0.5).setInteractive({ useHandCursor: true });
                buyZone.on('pointerdown', () => this._purchaseItem(item));
                buyZone.on('pointerover', () => buyTxt.setColor('#CCFFCC'));
                buyZone.on('pointerout', () => buyTxt.setColor('#FFFFFF'));
                this._previewElements.push(buyZone);
            } else {
                this._previewElements.push(
                    this.add.text(cx, actionY + 14, I18n.t('shop_extra.insufficient'), {
                        fontFamily: 'monospace', fontSize: IS_PORTRAIT ? '12px' : '7px',
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
        const maxRows = IS_PORTRAIT ? 3 : 4;
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
            const scrollBarX = Layout.W - 14;
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
        const radius = IS_PORTRAIT ? 12 : 5;
        g.fillRoundedRect(x, y, CARD_W, CARD_H, radius);

        // Border
        if (isSelected) {
            g.lineStyle(IS_PORTRAIT ? 3 : 2, 0xFFD700, 0.9);
        } else if (owned) {
            g.lineStyle(1, 0x44CC44, 0.4);
        } else {
            g.lineStyle(1, 0xD4A574, 0.2);
        }
        g.strokeRoundedRect(x, y, CARD_W, CARD_H, radius);
        elements.push(g);

        // Icon — portrait: centered top (vertical card) / desktop: left (horizontal card)
        const iconX = IS_PORTRAIT ? cx : (x + 28);
        const iconY = IS_PORTRAIT ? (y + 34) : (cy - 8);
        if (item.icon && this.textures.exists(item.icon)) {
            const tex = this.textures.get(item.icon);
            const isSheet = tex.frameTotal > 2;
            const iconScale = IS_PORTRAIT ? (isSheet ? 0.9 : 1.4) : (isSheet ? 0.5 : 0.75);
            const icon = isSheet
                ? this.add.sprite(iconX, iconY, item.icon, 0).setScale(iconScale).setDepth(6)
                : this.add.image(iconX, iconY, item.icon).setScale(iconScale).setDepth(6);
            icon.setOrigin(0.5);
            if (locked) icon.setAlpha(0.35);
            elements.push(icon);
        } else {
            const ph = this.add.graphics().setDepth(6);
            ph.fillStyle(item.type === 'ability' ? 0x9B7BB8 : 0xD4A574, 0.6);
            ph.fillCircle(iconX, iconY, IS_PORTRAIT ? 18 : 12);
            elements.push(ph);
        }

        // Card text positions : portrait vertical flow / desktop horizontal
        const nameX = IS_PORTRAIT ? cx : (x + 56);
        const nameY = IS_PORTRAIT ? (y + 72) : (cy - 26);
        const descY = IS_PORTRAIT ? (y + 92) : (cy - 8);
        const priceY = IS_PORTRAIT ? (y + 112) : (cy + 8);
        const textOrigin = IS_PORTRAIT ? 0.5 : 0;
        const nameFs = IS_PORTRAIT ? '12px' : '9px';
        const descFs = IS_PORTRAIT ? '9px' : '7px';
        const priceFs = IS_PORTRAIT ? '11px' : '8px';

        // Name
        const shortName = item.name.replace('Boule ', '').replace('Cochonnet ', '');
        elements.push(
            this.add.text(nameX, nameY, shortName, {
                fontFamily: 'monospace', fontSize: nameFs,
                color: isSelected ? CSS.OR : CSS.CREME, shadow: SHADOW
            }).setOrigin(textOrigin, 0.5).setDepth(6)
        );

        // Description (1 line, plus longue en portrait car plus large)
        const descMax = IS_PORTRAIT ? 22 : 26;
        const desc = item.description.length > descMax ? item.description.substring(0, descMax - 2) + '..' : item.description;
        elements.push(
            this.add.text(nameX, descY, desc, {
                fontFamily: 'monospace', fontSize: descFs,
                color: CSS.GRIS, shadow: SHADOW
            }).setOrigin(textOrigin, 0.5).setDepth(6)
        );

        // Price / owned badge
        if (owned) {
            elements.push(
                this.add.text(nameX, priceY, I18n.t('shop_extra.owned'), {
                    fontFamily: 'monospace', fontSize: priceFs,
                    color: '#44CC44', shadow: SHADOW
                }).setOrigin(textOrigin, 0.5).setDepth(6)
            );
        } else if (locked) {
            const lockedLabel = IS_PORTRAIT ? `\u{1F512} ${item.minWins} vict.` : `\u{1F512} ${item.minWins} victoires`;
            elements.push(
                this.add.text(nameX, priceY, lockedLabel, {
                    fontFamily: 'monospace', fontSize: priceFs,
                    color: '#5A4A3A', shadow: SHADOW
                }).setOrigin(textOrigin, 0.5).setDepth(6)
            );
        } else {
            const canAfford = save.galets >= item.price;
            elements.push(
                this.add.text(nameX, priceY, `${item.price} G`, {
                    fontFamily: 'monospace', fontSize: priceFs,
                    color: canAfford ? CSS.OR : '#C44B3F', shadow: SHADOW
                }).setOrigin(textOrigin, 0.5).setDepth(6)
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
                g.fillRoundedRect(x, y, CARD_W, CARD_H, radius);
                g.lineStyle(1, 0xD4A574, 0.5);
                g.strokeRoundedRect(x, y, CARD_W, CARD_H, radius);
                sfxUIHover();
            }
        });
        zone.on('pointerout', () => {
            if (this.selectedIndex !== index) {
                g.clear();
                g.fillStyle(owned ? 0x2A3A22 : 0x2A2218, 0.8);
                g.fillRoundedRect(x, y, CARD_W, CARD_H, radius);
                g.lineStyle(1, owned ? 0x44CC44 : 0xD4A574, owned ? 0.4 : 0.2);
                g.strokeRoundedRect(x, y, CARD_W, CARD_H, radius);
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
        const CX = Layout.W / 2;
        const CY = Layout.H / 2;
        const pw = 320, ph = 130;
        const px = CX - pw / 2, py = CY - ph / 2;

        // Overlay sombre
        const overlay = this.add.graphics().setDepth(200);
        overlay.fillStyle(0x1A1510, 0.7);
        overlay.fillRect(0, 0, Layout.W, Layout.H);

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
            trackPurchase({ itemId: item.id, itemType: item.type, priceGalets: item.price });
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
        // ESC is handled by UIFactory.addBackButton — do not bind it twice here
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
            const maxRows = IS_PORTRAIT ? 3 : 4;
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
            const maxRows = IS_PORTRAIT ? 3 : 4;
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
            trackItemEquipped({ itemId: item.id, itemType: item.type });
            if (item.type === 'boule') setSelectedBoule(item.id.replace(/^boule_/, ''));
            else setSelectedCochonnet(item.id.replace(/^cochonnet_/, ''));
            this._save = loadSave();
            this._refreshPreview();
        }
    }
}
