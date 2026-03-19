import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, CHAR_STATIC_SPRITES } from '../utils/Constants.js';
import { loadSave, saveSave, spendGalets, getRookieStats, setSelectedBoule, setSelectedCochonnet } from '../utils/SaveManager.js';
import { setSoundScene, sfxUIClick } from '../utils/SoundManager.js';
import UIFactory from '../ui/UIFactory.js';

const SHADOW = UIFactory.SHADOW;

const TABS = [
    { id: 'boules', label: 'Boules' },
    { id: 'cochonnets', label: 'Cochonnets' },
    { id: 'capacites', label: 'Capacites' }
];

// Grid layout
const GRID_COLS = 5;
const GRID_ROWS = 3;
const CARD_W = 140;
const CARD_H = 105;
const CARD_GAP_X = 12;
const CARD_GAP_Y = 8;
const GRID_START_X = (GAME_WIDTH - (CARD_W * GRID_COLS + CARD_GAP_X * (GRID_COLS - 1))) / 2;
const GRID_START_Y = 120;

export default class ShopScene extends Phaser.Scene {
    constructor() {
        super('ShopScene');
    }

    create() {
        this.cameras.main.setAlpha(1);
        this.cameras.main.resetFX();
        setSoundScene(this);

        this.shopData = this.cache.json.get('shop');
        this.activeTab = 0;
        this.selectedIndex = 0;
        this.cardObjects = [];
        this.tabObjects = [];
        this._purchasing = false;

        this._drawBackground();
        this._drawHeader();
        this._drawTabs();
        this._drawItems();
        this._drawRetourButton();
        this._drawControlsHint();
        this._setupInput();

        this.events.on('shutdown', this._shutdown, this);
    }

    // ================================================================
    // BACKGROUND
    // ================================================================

    _drawBackground() {
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x1A1510, 0x1A1510, 0x2A2A28, 0x2A2A28, 1);
        bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }

    // ================================================================
    // HEADER: Title + Galets balance
    // ================================================================

    _drawHeader() {
        // Title left-aligned
        UIFactory.addText(this, 30, 28, 'BOUTIQUE', '28px', '#FFD700', {
            originX: 0, originY: 0.5, heavyShadow: true
        });

        // Galets balance top-right
        this._drawGaletsDisplay();
    }

    _drawGaletsDisplay() {
        if (this.galetsGroup) {
            this.galetsGroup.forEach(o => o.destroy());
        }
        this.galetsGroup = [];

        const save = loadSave();
        const galets = save.galets;

        // Coin icon (small stone circle)
        const coinGfx = this.add.graphics();
        coinGfx.fillStyle(0xC4854A, 1);
        coinGfx.fillCircle(GAME_WIDTH - 110, 28, 8);
        coinGfx.lineStyle(1.5, 0x8B6914, 1);
        coinGfx.strokeCircle(GAME_WIDTH - 110, 28, 8);
        // "G" on coin
        const coinLetter = this.add.text(GAME_WIDTH - 110, 28, 'G', {
            fontFamily: 'monospace', fontSize: '10px', color: '#3A2E28',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const galetsText = UIFactory.addText(this, GAME_WIDTH - 88, 28, `${galets}`, '20px', '#FFD700', {
            originX: 0, originY: 0.5, heavyShadow: true
        });

        this.galetsGroup = [coinGfx, coinLetter, galetsText];
    }

    // ================================================================
    // TAB BAR
    // ================================================================

    _drawTabs() {
        this._clearTabs();

        const tabY = 68;
        const tabWidth = 140;
        const totalW = tabWidth * TABS.length;
        const startX = (GAME_WIDTH - totalW) / 2;

        for (let i = 0; i < TABS.length; i++) {
            const x = startX + i * tabWidth + tabWidth / 2;
            const isActive = i === this.activeTab;

            const label = UIFactory.addText(this, x, tabY, TABS[i].label, '16px',
                isActive ? '#FFD700' : '#9E9E8E', { originX: 0.5, originY: 0.5 }
            );
            label.setInteractive({ useHandCursor: true });
            label.on('pointerdown', () => {
                sfxUIClick();
                this._switchTab(i);
            });

            // Underline for active tab
            let underline = null;
            if (isActive) {
                underline = this.add.graphics();
                underline.lineStyle(3, 0xFFD700, 0.9);
                underline.lineBetween(x - 40, tabY + 14, x + 40, tabY + 14);
            }

            this.tabObjects.push({ label, underline });
        }
    }

    _clearTabs() {
        for (const t of this.tabObjects) {
            t.label.destroy();
            if (t.underline) t.underline.destroy();
        }
        this.tabObjects = [];
    }

    _switchTab(index) {
        this.activeTab = index;
        this.selectedIndex = 0;
        this._clearTabs();
        this._drawTabs();
        this._drawItems();
    }

    // ================================================================
    // ITEM CARDS
    // ================================================================

    _drawItems() {
        this._clearCards();

        const tabId = TABS[this.activeTab].id;
        const category = this.shopData.categories.find(c => c.id === tabId);
        if (!category) return;

        let items = [...category.items];
        const save = loadSave();

        for (let i = 0; i < items.length; i++) {
            const col = i % GRID_COLS;
            const row = Math.floor(i / GRID_COLS);
            if (row >= GRID_ROWS) break; // max 6 items per page

            const cx = GRID_START_X + col * (CARD_W + CARD_GAP_X) + CARD_W / 2;
            const cy = GRID_START_Y + row * (CARD_H + CARD_GAP_Y) + CARD_H / 2;

            this._createCard(items[i], i, cx, cy, save);
        }
    }

    _createCard(item, index, cx, cy, save) {
        const owned = save.purchases.includes(item.id);
        const canAfford = save.galets >= item.price;
        const isSelected = index === this.selectedIndex;
        const objects = [];

        // Card background
        const cardGfx = this.add.graphics();
        const cardX = cx - CARD_W / 2;
        const cardY = cy - CARD_H / 2;

        cardGfx.fillStyle(isSelected ? 0x4A3A28 : 0x2A2218, 0.9);
        cardGfx.fillRoundedRect(cardX, cardY, CARD_W, CARD_H, 6);

        if (owned) {
            cardGfx.lineStyle(2, 0xFFD700, 0.7);
        } else if (isSelected) {
            cardGfx.lineStyle(2, 0xD4A574, 0.8);
        } else {
            cardGfx.lineStyle(1, 0xD4A574, 0.3);
        }
        cardGfx.strokeRoundedRect(cardX, cardY, CARD_W, CARD_H, 6);
        objects.push(cardGfx);

        // Item icon
        const iconY = cardY + 24;
        if (item.icon && this.textures.exists(item.icon)) {
            const icon = this.add.image(cx, iconY, item.icon).setScale(0.9);
            objects.push(icon);
        } else {
            const placeholder = this.add.graphics();
            const placeholderColor = this._getPlaceholderColor(item.type);
            placeholder.fillStyle(placeholderColor, 0.8);
            placeholder.fillRoundedRect(cx - 10, iconY - 10, 20, 20, 4);
            objects.push(placeholder);
        }

        // Item name (compact)
        const shortName = item.name.replace('Boule ', '').replace('Cochonnet ', '');
        const nameText = UIFactory.addText(this, cx, cardY + 48, shortName, '11px', '#F5E6D0', {
            originX: 0.5, originY: 0.5
        });
        objects.push(nameText);

        // Description (1 line max, truncated)
        const desc = item.description.length > 22 ? item.description.substring(0, 20) + '..' : item.description;
        const descText = UIFactory.addText(this, cx, cardY + 63, desc, '8px', '#9E9E8E', {
            originX: 0.5, originY: 0.5
        });
        objects.push(descText);

        // Price or POSSEDE badge (clear spacing)
        if (owned) {
            const badge = UIFactory.addText(this, cx, cardY + CARD_H - 16, '\u2713 POSSEDE', '10px', '#FFD700', {
                originX: 0.5, originY: 0.5
            });
            objects.push(badge);
        } else {
            const priceColor = canAfford ? '#FFD700' : '#C44B3F';
            const priceText = UIFactory.addText(this, cx, cardY + CARD_H - 22, `${item.price} E`, '11px', priceColor, {
                originX: 0.5, originY: 0.5
            });
            objects.push(priceText);

            if (canAfford) {
                const buyBtn = this.add.text(cx, cardY + CARD_H - 8, 'ACHETER', {
                    fontFamily: 'monospace', fontSize: '9px', color: '#FFFFFF',
                    backgroundColor: '#44CC44', padding: { x: 4, y: 2 },
                    shadow: SHADOW
                }).setOrigin(0.5).setInteractive({ useHandCursor: true });
                buyBtn.on('pointerdown', () => this._purchaseItem(item, index));
                objects.push(buyBtn);
            }
        }

        // Make card interactive for selection
        const hitZone = this.add.zone(cx, cy, CARD_W, CARD_H).setInteractive({ useHandCursor: true });
        hitZone.on('pointerdown', () => {
            if (this.selectedIndex !== index) {
                sfxUIClick();
                this.selectedIndex = index;
                this._drawItems();
            } else if (!owned && canAfford) {
                this._purchaseItem(item, index);
            }
        });
        objects.push(hitZone);

        this.cardObjects.push(objects);
    }

    _clearCards() {
        for (const card of this.cardObjects) {
            for (const obj of card) {
                obj.destroy();
            }
        }
        this.cardObjects = [];
    }

    _getPlaceholderColor(type) {
        switch (type) {
            case 'boule': return 0xCD7F32;
            case 'cochonnet': return 0xFFD700;
            case 'ability': return 0x9B7BB8;
            default: return 0xD4A574;
        }
    }

    // ================================================================
    // PURCHASE
    // ================================================================

    _purchaseItem(item, index) {
        if (this._purchasing) return;
        this._purchasing = true;

        sfxUIClick();

        const success = spendGalets(item.price);
        if (!success) {
            this._purchasing = false;
            return;
        }

        // Add to purchases
        const save = loadSave();
        if (!save.purchases.includes(item.id)) {
            save.purchases.push(item.id);
        }

        // Also unlock in the appropriate category (normalize IDs)
        if (item.type === 'boule') {
            const shortId = item.id.replace(/^boule_/, '');
            if (!save.unlockedBoules.includes(shortId)) {
                save.unlockedBoules.push(shortId);
            }
        } else if (item.type === 'cochonnet') {
            const shortId = item.id.replace(/^cochonnet_/, '');
            if (!save.unlockedCochonnets.includes(shortId)) {
                save.unlockedCochonnets.push(shortId);
            }
        }

        saveSave(save);

        // Animate "Debloque !" feedback
        const category = this.shopData.categories.find(c => c.id === TABS[this.activeTab].id);
        const col = index % GRID_COLS;
        const row = Math.floor(index / GRID_COLS);
        const cx = GRID_START_X + col * (CARD_W + CARD_GAP_X) + CARD_W / 2;
        const cy = GRID_START_Y + row * (CARD_H + CARD_GAP_Y) + CARD_H / 2;

        // Flash effect
        this.cameras.main.flash(150, 255, 215, 0, false);

        // Floating text
        UIFactory.showFloatingText(this, cx, cy - 20, 'Debloque !', '#FFD700', {
            fontSize: '18px', rise: 50, duration: 1500
        });

        // Refresh display after short delay
        this.time.delayedCall(300, () => {
            this._drawGaletsDisplay();
            this._drawItems();
            this._purchasing = false;
        });
    }

    // ================================================================
    // RETOUR BUTTON
    // ================================================================
    // EQUIPMENT PANEL (Rookie stats + equipped items)
    // ================================================================

    _drawEquipmentPanel() {
        const save = loadSave();
        const rookie = save.rookie;
        const stats = rookie.stats;
        const totalPts = rookie.totalPoints;
        const objects = [];
        const gfx = this.add.graphics();
        objects.push(gfx);

        // === LEFT COLUMN: Rookie Stats ===
        const leftX = 50;
        const topY = GRID_START_Y - 5;

        // Sprite + name
        if (this.textures.exists('rookie_static')) {
            const spr = this.add.image(leftX + 55, topY + 50, 'rookie_static').setScale(0.45).setOrigin(0.5);
            objects.push(spr);
        }
        objects.push(UIFactory.addText(this, leftX + 55, topY + 95, 'LE ROOKIE', '14px', '#FFD700', { originX: 0.5 }));
        objects.push(UIFactory.addText(this, leftX + 55, topY + 112, `${totalPts}/40 pts`, '10px', '#D4A574', { originX: 0.5 }));

        // Stats bars
        const barDefs = [
            { key: 'precision', label: 'PRE', color: 0x87CEEB },
            { key: 'puissance', label: 'PUI', color: 0xC4854A },
            { key: 'effet', label: 'EFF', color: 0x9B7BB8 },
            { key: 'sang_froid', label: 'S-F', color: 0x6B8E4E }
        ];
        barDefs.forEach((def, i) => {
            const by = topY + 132 + i * 22;
            objects.push(UIFactory.addText(this, leftX, by, def.label, '10px', '#D4A574', { originX: 0 }));
            const val = stats[def.key] || 0;
            gfx.fillStyle(0x1A1510, 0.7);
            gfx.fillRoundedRect(leftX + 30, by + 2, 70, 8, 3);
            if (val > 0) { gfx.fillStyle(def.color, 0.85); gfx.fillRoundedRect(leftX + 30, by + 2, 70 * val / 10, 8, 3); }
            objects.push(UIFactory.addText(this, leftX + 106, by, `${val}`, '10px', '#F5E6D0', { originX: 0 }));
        });

        // Capacites
        const abY = topY + 132 + barDefs.length * 22 + 8;
        const abilNames = { instinct: "L'Instinct", determination: 'Determination', naturel: 'Le Naturel' };
        objects.push(UIFactory.addText(this, leftX, abY, 'Capacites:', '10px', '#FFD700', { originX: 0 }));
        if (rookie.abilitiesUnlocked.length > 0) {
            rookie.abilitiesUnlocked.forEach((id, i) => {
                objects.push(UIFactory.addText(this, leftX + 8, abY + 14 + i * 14, `- ${abilNames[id] || id}`, '9px', '#F5E6D0', { originX: 0 }));
            });
        } else {
            objects.push(UIFactory.addText(this, leftX + 8, abY + 14, 'Aucune (18pts)', '9px', '#9E9E8E', { originX: 0 }));
        }

        // Record
        objects.push(UIFactory.addText(this, leftX, abY + 50, `V:${save.totalWins} D:${save.totalLosses} Arcade:${save.arcadeProgress}/5`, '9px', '#9E9E8E', { originX: 0 }));

        // === CENTER COLUMN: Boules Inventory ===
        const centerX = 230;
        objects.push(UIFactory.addText(this, centerX + 90, topY, 'BOULES', '14px', '#FFD700', { originX: 0.5 }));

        // Normalize boule ID: "boule_bronze" → "bronze", "acier" stays "acier"
        const normBoule = (id) => id.replace(/^boule_/, '');

        // All owned boules: start with acier (always owned) + purchased + unlocked
        const allBouleIds = ['acier'];
        const addBoule = (raw) => {
            const id = normBoule(raw);
            if (!allBouleIds.includes(id)) allBouleIds.push(id);
        };
        save.purchases.filter(p => p.startsWith('boule_') || p === 'acier').forEach(addBoule);
        (save.unlockedBoules || []).forEach(addBoule);

        const bouleSize = 36;
        const bouleCols = 4;
        allBouleIds.forEach((id, i) => {
            const col = i % bouleCols;
            const row = Math.floor(i / bouleCols);
            const bx = centerX + col * (bouleSize + 12) + bouleSize / 2;
            const by = topY + 22 + row * (bouleSize + 24);
            const isEquipped = save.selectedBoule === id;

            // Selection highlight
            if (isEquipped) {
                gfx.lineStyle(2, 0xFFD700, 1);
                gfx.strokeRoundedRect(bx - bouleSize / 2 - 4, by - bouleSize / 2 - 4, bouleSize + 8, bouleSize + 20, 4);
            }

            // Sprite
            const sprKey = `ball_${id}`;
            if (this.textures.exists(sprKey)) {
                const img = this.add.image(bx, by, sprKey).setScale(0.8).setOrigin(0.5)
                    .setInteractive({ useHandCursor: true });
                img.on('pointerdown', () => {
                    setSelectedBoule(id);
                    sfxUIClick();
                    this._drawItems(); // refresh
                    this._drawGaletsDisplay();
                });
                objects.push(img);
            }

            // Label
            const lbl = UIFactory.addText(this, bx, by + bouleSize / 2 + 4, isEquipped ? `[${id}]` : id, '8px',
                isEquipped ? '#FFD700' : '#9E9E8E', { originX: 0.5 });
            objects.push(lbl);
        });

        // === RIGHT COLUMN: Cochonnets Inventory ===
        const rightX = centerX + bouleCols * (bouleSize + 12) + 40;
        objects.push(UIFactory.addText(this, rightX + 60, topY, 'COCHONNETS', '14px', '#FFD700', { originX: 0.5 }));

        const normCoch = (id) => id.replace(/^cochonnet_/, '');
        const allCochIds = ['classique'];
        const addCoch = (raw) => {
            const id = normCoch(raw);
            if (!allCochIds.includes(id)) allCochIds.push(id);
        };
        save.purchases.filter(p => p.startsWith('cochonnet_')).forEach(addCoch);
        (save.unlockedCochonnets || []).forEach(addCoch);

        const cochCols = 3;
        allCochIds.forEach((id, i) => {
            const col = i % cochCols;
            const row = Math.floor(i / cochCols);
            const cx = rightX + col * (bouleSize + 12) + bouleSize / 2;
            const cy = topY + 22 + row * (bouleSize + 24);
            const isEquipped = save.selectedCochonnet === id;

            if (isEquipped) {
                gfx.lineStyle(2, 0xFFD700, 1);
                gfx.strokeRoundedRect(cx - bouleSize / 2 - 4, cy - bouleSize / 2 - 4, bouleSize + 8, bouleSize + 20, 4);
            }

            const sprKey = id === 'classique' ? 'ball_cochonnet' : `ball_cochonnet_${id}`;
            if (this.textures.exists(sprKey)) {
                const img = this.add.image(cx, cy, sprKey).setScale(1.0).setOrigin(0.5)
                    .setInteractive({ useHandCursor: true });
                img.on('pointerdown', () => {
                    setSelectedCochonnet(id);
                    sfxUIClick();
                    this._drawItems();
                    this._drawGaletsDisplay();
                });
                objects.push(img);
            }

            const lbl = UIFactory.addText(this, cx, cy + bouleSize / 2 + 4, isEquipped ? `[${id}]` : id, '8px',
                isEquipped ? '#FFD700' : '#9E9E8E', { originX: 0.5 });
            objects.push(lbl);
        });

        this.cardObjects.push(objects);
    }

    // ================================================================

    _drawRetourButton() {
        UIFactory.createButton(this, GAME_WIDTH / 2, GAME_HEIGHT - 40, '[ RETOUR ]', {
            fontSize: '18px', textColor: '#F5E6D0', bgColor: '#3A2E28',
            padding: { x: 20, y: 8 },
            onDown: () => {
                sfxUIClick();
                this.scene.start('TitleScene');
            }
        });
    }

    // ================================================================
    // CONTROLS HINT
    // ================================================================

    _drawControlsHint() {
        UIFactory.addControlsHint(this, '1-3 Onglets     Fleches Naviguer     Entree Acheter     Echap Retour');
    }

    // ================================================================
    // INPUT
    // ================================================================

    _setupInput() {
        this.input.keyboard.on('keydown-ESC', () => {
            sfxUIClick();
            this.scene.start('TitleScene');
        });

        // Tab switching with number keys
        this.input.keyboard.on('keydown-ONE', () => this._switchTab(0));
        this.input.keyboard.on('keydown-TWO', () => this._switchTab(1));
        this.input.keyboard.on('keydown-THREE', () => this._switchTab(2));

        // Arrow navigation
        this.input.keyboard.on('keydown-RIGHT', () => this._moveSelection(1, 0));
        this.input.keyboard.on('keydown-LEFT', () => this._moveSelection(-1, 0));
        this.input.keyboard.on('keydown-DOWN', () => this._moveSelection(0, 1));
        this.input.keyboard.on('keydown-UP', () => this._moveSelection(0, -1));

        // Enter to buy
        this.input.keyboard.on('keydown-ENTER', () => this._buySelected());
    }

    _moveSelection(dx, dy) {
        const category = this.shopData.categories.find(c => c.id === TABS[this.activeTab].id);
        if (!category) return;

        const count = Math.min(category.items.length, GRID_COLS * GRID_ROWS);
        if (count === 0) return;

        const col = this.selectedIndex % GRID_COLS;
        const row = Math.floor(this.selectedIndex / GRID_COLS);

        let newCol = col + dx;
        let newRow = row + dy;

        // Clamp
        newCol = Math.max(0, Math.min(GRID_COLS - 1, newCol));
        newRow = Math.max(0, Math.min(GRID_ROWS - 1, newRow));

        const newIndex = newRow * GRID_COLS + newCol;
        if (newIndex < count && newIndex !== this.selectedIndex) {
            sfxUIClick();
            this.selectedIndex = newIndex;
            this._drawItems();
        }
    }

    _buySelected() {
        const category = this.shopData.categories.find(c => c.id === TABS[this.activeTab].id);
        if (!category) return;

        const item = category.items[this.selectedIndex];
        if (!item) return;

        const save = loadSave();
        const owned = save.purchases.includes(item.id);
        const canAfford = save.galets >= item.price;

        if (!owned && canAfford) {
            this._purchaseItem(item, this.selectedIndex);
        }
    }

    // ================================================================
    // CLEANUP
    // ================================================================

    _shutdown() {
        this.input.keyboard.removeAllListeners();
        this.tweens.killAll();
    }
}
