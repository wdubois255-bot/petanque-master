import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, CSS, UI } from '../utils/Constants.js';
import { loadSave, setSelectedBoule, setSelectedCochonnet } from '../utils/SaveManager.js';
import { setSoundScene, sfxUIClick } from '../utils/SoundManager.js';
import UIFactory from '../ui/UIFactory.js';

const SHADOW = UIFactory.SHADOW;

export default class PlayerScene extends Phaser.Scene {
    constructor() {
        super('PlayerScene');
    }

    create() {
        this.cameras.main.setAlpha(1);
        this.cameras.main.resetFX();
        setSoundScene(this);

        // Background
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x1A1510, 0x1A1510, 0x2A2A28, 0x2A2A28, 1);
        bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Title
        UIFactory.addTitle(this, GAME_WIDTH / 2, UI.HEADER_Y, 'MON PERSONNAGE');

        // Ecus display
        this._ecusDisplay = UIFactory.createEcusDisplay(this, UI.ECUS_X, UI.ECUS_Y);

        // Back button
        UIFactory.addBackButton(this, 'TitleScene');

        // Controls hint
        UIFactory.addControlsHint(this, 'Clic  Equiper     Echap  Retour');

        // Draw content
        this._drawContent();

        this.events.on('shutdown', this._shutdown, this);
    }

    _shutdown() {
        this.input.keyboard.removeAllListeners();
        this.tweens.killAll();
    }

    _drawContent() {
        const save = loadSave();
        const rookie = save.rookie;
        const stats = rookie.stats;
        const totalPts = rookie.totalPoints;

        // === LEFT: Rookie Character ===
        const leftX = 40;
        const topY = 65;

        // Sprite
        if (this.textures.exists('rookie_static')) {
            this.add.image(leftX + 70, topY + 65, 'rookie_static')
                .setScale(0.6).setOrigin(0.5);
        }

        // Name + points
        UIFactory.addText(this, leftX + 70, topY + 115, 'LE ROOKIE', UI.MENU_SIZE, CSS.OR, { originX: 0.5, heavyShadow: true });
        UIFactory.addText(this, leftX + 70, topY + 138, `${totalPts}/40 pts`, UI.BODY_SIZE, CSS.OCRE, { originX: 0.5 });

        // Stats bars
        const barDefs = [
            { key: 'precision', label: 'Precision', color: COLORS.STAT_PRECISION },
            { key: 'puissance', label: 'Puissance', color: COLORS.STAT_PUISSANCE },
            { key: 'effet', label: 'Effet', color: COLORS.STAT_EFFET },
            { key: 'sang_froid', label: 'Sang-froid', color: COLORS.STAT_ADAPTABILITE }
        ];

        const barsGfx = this.add.graphics();
        const barsX = leftX;
        const barsY = topY + 160;
        const barW = 110;
        const barH = 12;

        barDefs.forEach((def, i) => {
            const by = barsY + i * 30;
            UIFactory.addText(this, barsX, by, def.label, UI.SMALL_SIZE, CSS.OCRE, { originX: 0 });
            UIFactory.drawStatBar(barsGfx, barsX + 72, by + 2, barW, barH, stats[def.key] || 0, 10, def.color);
            UIFactory.addText(this, barsX + 72 + barW + 10, by, `${stats[def.key] || 0}`, UI.BODY_SIZE, CSS.CREME, { originX: 0 });
        });

        // Capacites
        const abY = barsY + barDefs.length * 30 + 10;
        UIFactory.addText(this, barsX, abY, 'Capacites:', UI.SMALL_SIZE, CSS.OR, { originX: 0 });

        const abilNames = { instinct: "L'Instinct (Slow-mo)", determination: 'Determination (-50% wobble)', naturel: 'Le Naturel (Tir parfait)' };
        if (rookie.abilitiesUnlocked.length > 0) {
            rookie.abilitiesUnlocked.forEach((id, i) => {
                UIFactory.addText(this, barsX + 8, abY + 16 + i * 16, `- ${abilNames[id] || id}`, UI.SMALL_SIZE, CSS.CREME, { originX: 0 });
            });
        } else {
            UIFactory.addText(this, barsX + 8, abY + 16, 'Aucune (18 pts pour debloquer)', UI.SMALL_SIZE, CSS.GRIS, { originX: 0 });
        }

        // Record
        UIFactory.addText(this, barsX, GAME_HEIGHT - 50,
            `Victoires: ${save.totalWins}   Defaites: ${save.totalLosses}   Arcade: ${save.arcadeProgress}/5`,
            UI.SMALL_SIZE, CSS.GRIS, { originX: 0 });

        // === CENTER: Boules Inventory ===
        const centerX = 280;
        UIFactory.addText(this, centerX + 100, topY, 'BOULES', UI.BODY_SIZE, CSS.OR, { originX: 0.5, heavyShadow: true });

        const normBoule = (id) => id.replace(/^boule_/, '');
        const allBouleIds = ['acier'];
        const addBoule = (raw) => { const id = normBoule(raw); if (!allBouleIds.includes(id)) allBouleIds.push(id); };
        save.purchases.filter(p => p.startsWith('boule_') || p === 'acier').forEach(addBoule);
        (save.unlockedBoules || []).forEach(addBoule);

        const itemSize = 48;
        const itemCols = 4;
        const itemGap = 14;
        const inventoryGfx = this.add.graphics();

        allBouleIds.forEach((id, i) => {
            const col = i % itemCols;
            const row = Math.floor(i / itemCols);
            const bx = centerX + col * (itemSize + itemGap) + itemSize / 2;
            const by = topY + 24 + row * (itemSize + 28);
            const isEquipped = save.selectedBoule === id;

            // Highlight
            if (isEquipped) {
                inventoryGfx.lineStyle(2, COLORS.OR, 1);
                inventoryGfx.strokeRoundedRect(bx - itemSize / 2 - 3, by - itemSize / 2 - 3, itemSize + 6, itemSize + 22, 4);
                inventoryGfx.fillStyle(COLORS.OR, 0.1);
                inventoryGfx.fillRoundedRect(bx - itemSize / 2 - 3, by - itemSize / 2 - 3, itemSize + 6, itemSize + 22, 4);
            }

            // Sprite
            const sprKey = `ball_${id}`;
            if (this.textures.exists(sprKey)) {
                const img = this.add.image(bx, by, sprKey).setScale(0.7).setOrigin(0.5)
                    .setInteractive({ useHandCursor: true });
                img.on('pointerdown', () => {
                    setSelectedBoule(id);
                    sfxUIClick();
                    this.scene.restart(); // refresh display
                });
            }

            // Label
            const displayName = id.replace('_retro', ' R').replace('_', ' ');
            UIFactory.addText(this, bx, by + itemSize / 2 + 6,
                isEquipped ? `[${displayName}]` : displayName,
                '8px', isEquipped ? CSS.OR : CSS.GRIS, { originX: 0.5 });
        });

        // === RIGHT: Cochonnets Inventory ===
        const rightX = centerX + itemCols * (itemSize + itemGap) + 50;
        UIFactory.addText(this, rightX + 60, topY, 'COCHONNETS', UI.BODY_SIZE, CSS.OR, { originX: 0.5, heavyShadow: true });

        const normCoch = (id) => id.replace(/^cochonnet_/, '');
        const allCochIds = ['classique'];
        const addCoch = (raw) => { const id = normCoch(raw); if (!allCochIds.includes(id)) allCochIds.push(id); };
        save.purchases.filter(p => p.startsWith('cochonnet_')).forEach(addCoch);
        (save.unlockedCochonnets || []).forEach(addCoch);

        const cochCols = 3;
        allCochIds.forEach((id, i) => {
            const col = i % cochCols;
            const row = Math.floor(i / cochCols);
            const cx = rightX + col * (itemSize + itemGap) + itemSize / 2;
            const cy = topY + 24 + row * (itemSize + 28);
            const isEquipped = save.selectedCochonnet === id;

            if (isEquipped) {
                inventoryGfx.lineStyle(2, COLORS.OR, 1);
                inventoryGfx.strokeRoundedRect(cx - itemSize / 2 - 3, cy - itemSize / 2 - 3, itemSize + 6, itemSize + 22, 4);
                inventoryGfx.fillStyle(COLORS.OR, 0.1);
                inventoryGfx.fillRoundedRect(cx - itemSize / 2 - 3, cy - itemSize / 2 - 3, itemSize + 6, itemSize + 22, 4);
            }

            const sprKey = id === 'classique' ? 'ball_cochonnet' : `ball_cochonnet_${id}`;
            if (this.textures.exists(sprKey)) {
                const img = this.add.image(cx, cy, sprKey).setScale(0.7).setOrigin(0.5)
                    .setInteractive({ useHandCursor: true });
                img.on('pointerdown', () => {
                    setSelectedCochonnet(id);
                    sfxUIClick();
                    this.scene.restart();
                });
            }

            UIFactory.addText(this, cx, cy + itemSize / 2 + 6,
                isEquipped ? `[${id}]` : id,
                '8px', isEquipped ? CSS.OR : CSS.GRIS, { originX: 0.5 });
        });
    }
}
