import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, CSS, UI, ROOKIE_MAX_POINTS } from '../utils/Constants.js';
import { loadSave, setSelectedBoule, setSelectedCochonnet, formatPlaytime } from '../utils/SaveManager.js';
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
        const gfx = this.add.graphics();

        // ============================================================
        // LEFT COLUMN: Rookie Character + Stats + Progression
        // ============================================================
        const leftX = 30;
        const topY = 58;

        // Sprite
        if (this.textures.exists('rookie_static')) {
            this.add.image(leftX + 65, topY + 55, 'rookie_static').setScale(0.5).setOrigin(0.5);
        }

        // Name + archetype
        UIFactory.addText(this, leftX + 65, topY + 100, 'LE ROOKIE', '16px', CSS.OR, { originX: 0.5, heavyShadow: true });
        UIFactory.addText(this, leftX + 65, topY + 116, 'Adaptable', UI.SMALL_SIZE, CSS.OCRE, { originX: 0.5 });

        // Stats bars with gameplay description
        const barDefs = [
            { key: 'precision', label: 'PRE', color: COLORS.STAT_PRECISION, desc: (v) => v >= 8 ? 'Chirurgical' : v >= 5 ? 'Correct' : 'Imprecis' },
            { key: 'puissance', label: 'PUI', color: COLORS.STAT_PUISSANCE, desc: (v) => v >= 8 ? 'Devastateur' : v >= 5 ? 'Normal' : 'Faible portee' },
            { key: 'effet', label: 'EFF', color: COLORS.STAT_EFFET, desc: (v) => v >= 8 ? 'Maitre retro' : v >= 5 ? 'Bon spin' : 'Peu de retro' },
            { key: 'sang_froid', label: 'S-F', color: COLORS.STAT_ADAPTABILITE, desc: (v) => v >= 8 ? 'Imperturbable' : v >= 5 ? 'Stable' : 'Nerveux' }
        ];

        const barsY = topY + 135;
        const barW = 90;
        const barH = 10;

        barDefs.forEach((def, i) => {
            const by = barsY + i * 24;
            const val = stats[def.key] || 0;
            UIFactory.addText(this, leftX, by + 1, def.label, '9px', CSS.OCRE, { originX: 0 });
            UIFactory.drawStatBar(gfx, leftX + 28, by + 2, barW, barH, val, 10, def.color);
            UIFactory.addText(this, leftX + 28 + barW + 6, by + 1, `${val}`, '10px', CSS.CREME, { originX: 0 });
            UIFactory.addText(this, leftX + 28 + barW + 22, by + 1, def.desc(val), '8px', CSS.GRIS, { originX: 0 });
        });

        // === PROGRESSION toward next ability ===
        const progY = barsY + barDefs.length * 24 + 10;
        UIFactory.addText(this, leftX, progY, 'Progression:', '9px', CSS.OR, { originX: 0 });

        const thresholds = [
            { pts: 18, name: "L'Instinct", icon: '\u26A1', desc: 'Slow-mo 2s' },
            { pts: 26, name: 'Determination', icon: '\uD83D\uDCAA', desc: '-50% wobble' },
            { pts: 34, name: 'Le Naturel', icon: '\u2728', desc: 'Tir parfait' }
        ];

        // Progress bar toward next unlock
        let nextThreshold = thresholds.find(t => totalPts < t.pts);
        if (nextThreshold) {
            const prevPts = thresholds.indexOf(nextThreshold) === 0 ? 10 : thresholds[thresholds.indexOf(nextThreshold) - 1].pts;
            const progress = (totalPts - prevPts) / (nextThreshold.pts - prevPts);
            UIFactory.addText(this, leftX, progY + 14, `${nextThreshold.icon} ${nextThreshold.name}`, '9px', CSS.CREME, { originX: 0 });
            UIFactory.drawStatBar(gfx, leftX + 8, progY + 28, 120, 8, progress, 1, COLORS.OR);
            UIFactory.addText(this, leftX + 132, progY + 27, `${totalPts}/${nextThreshold.pts}`, '8px', CSS.OCRE, { originX: 0 });
        } else {
            UIFactory.addText(this, leftX, progY + 14, 'Toutes capacites debloquees !', '9px', CSS.OR, { originX: 0 });
        }

        // Unlocked abilities list
        const abY = progY + 44;
        thresholds.forEach((t, i) => {
            const unlocked = rookie.abilitiesUnlocked.includes(t.name === "L'Instinct" ? 'instinct' : t.name === 'Determination' ? 'determination' : 'naturel');
            const color = unlocked ? CSS.CREME : '#4A4A3A';
            const prefix = unlocked ? '\u2713' : '\u2717';
            UIFactory.addText(this, leftX, abY + i * 14, `${prefix} ${t.icon} ${t.name}`, '8px', color, { originX: 0 });
        });

        // === CAREER STATS ===
        const careerY = abY + thresholds.length * 14 + 10;
        const winRate = save.totalWins + save.totalLosses > 0
            ? Math.round(save.totalWins / (save.totalWins + save.totalLosses) * 100)
            : 0;

        UIFactory.addText(this, leftX, careerY, 'Carriere:', '9px', CSS.OR, { originX: 0 });
        const careerLines = [
            `${save.totalWins}V / ${save.totalLosses}D (${winRate}%)`,
            `Carreaux: ${save.totalCarreaux || 0}`,
            `Arcade: ${save.arcadeProgress}/5${save.arcadePerfect ? ' \u2605 PERFECT' : ''}`,
            `Temps: ${formatPlaytime(save.playtime || 0)}`
        ];
        careerLines.forEach((line, i) => {
            UIFactory.addText(this, leftX + 8, careerY + 14 + i * 13, line, '8px', CSS.GRIS, { originX: 0 });
        });

        // ============================================================
        // CENTER: Equipped Boule Info + Boules Inventory
        // ============================================================
        const centerX = 270;

        // Equipped boule details
        UIFactory.addText(this, centerX + 90, topY, 'BOULE EQUIPEE', UI.BODY_SIZE, CSS.OR, { originX: 0.5, heavyShadow: true });

        const boulesData = this.cache.json.get('boules');
        const equippedBoule = boulesData?.sets?.find(s => s.id === save.selectedBoule);
        if (equippedBoule) {
            // Sprite large
            const eqSprKey = `ball_${save.selectedBoule}`;
            if (this.textures.exists(eqSprKey)) {
                this.add.image(centerX + 30, topY + 38, eqSprKey).setScale(0.9).setOrigin(0.5);
            }
            UIFactory.addText(this, centerX + 60, topY + 22, equippedBoule.name, '11px', CSS.CREME, { originX: 0 });
            UIFactory.addText(this, centerX + 60, topY + 36, `${equippedBoule.stats.masse}g`, '9px', CSS.OCRE, { originX: 0 });

            // Bonus description
            const bonusText = equippedBoule.bonus
                ? equippedBoule.bonus.replace('friction_x', 'Friction x').replace('knockback_x', 'Impact x').replace('retro_x', 'Retro x').replace('restitution_x', 'Rebond x')
                : 'Aucun bonus';
            UIFactory.addText(this, centerX + 60, topY + 50, bonusText, '8px', equippedBoule.bonus ? '#87CEEB' : CSS.GRIS, { originX: 0 });
        }

        // Boules inventory grid
        UIFactory.addText(this, centerX + 90, topY + 72, 'Inventaire', UI.SMALL_SIZE, CSS.OCRE, { originX: 0.5 });

        const normBoule = (id) => id.replace(/^boule_/, '');
        const allBouleIds = ['acier'];
        const addBoule = (raw) => { const id = normBoule(raw); if (!allBouleIds.includes(id)) allBouleIds.push(id); };
        save.purchases.filter(p => p.startsWith('boule_') || p === 'acier').forEach(addBoule);
        (save.unlockedBoules || []).forEach(addBoule);

        const itemSize = 40;
        const itemCols = 4;
        const itemGap = 10;

        allBouleIds.forEach((id, i) => {
            const col = i % itemCols;
            const row = Math.floor(i / itemCols);
            const bx = centerX + col * (itemSize + itemGap) + itemSize / 2;
            const by = topY + 90 + row * (itemSize + 22);
            const isEquipped = save.selectedBoule === id;

            if (isEquipped) {
                gfx.lineStyle(2, COLORS.OR, 1);
                gfx.strokeRoundedRect(bx - itemSize / 2 - 2, by - itemSize / 2 - 2, itemSize + 4, itemSize + 18, 3);
            }

            const sprKey = `ball_${id}`;
            if (this.textures.exists(sprKey)) {
                const img = this.add.image(bx, by, sprKey).setScale(0.55).setOrigin(0.5)
                    .setInteractive({ useHandCursor: true });
                img.on('pointerdown', () => { setSelectedBoule(id); sfxUIClick(); this.scene.restart(); });
            }

            const displayName = id.replace('_retro', 'R');
            UIFactory.addText(this, bx, by + itemSize / 2 + 4,
                displayName, '7px', isEquipped ? CSS.OR : CSS.GRIS, { originX: 0.5 });
        });

        // ============================================================
        // RIGHT: Cochonnets Inventory
        // ============================================================
        const rightX = centerX + itemCols * (itemSize + itemGap) + 40;
        UIFactory.addText(this, rightX + 50, topY, 'COCHONNETS', UI.BODY_SIZE, CSS.OR, { originX: 0.5, heavyShadow: true });

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
            const cy = topY + 24 + row * (itemSize + 22);
            const isEquipped = save.selectedCochonnet === id;

            if (isEquipped) {
                gfx.lineStyle(2, COLORS.OR, 1);
                gfx.strokeRoundedRect(cx - itemSize / 2 - 2, cy - itemSize / 2 - 2, itemSize + 4, itemSize + 18, 3);
            }

            const sprKey = id === 'classique' ? 'ball_cochonnet' : `ball_cochonnet_${id}`;
            if (this.textures.exists(sprKey)) {
                const img = this.add.image(cx, cy, sprKey).setScale(0.55).setOrigin(0.5)
                    .setInteractive({ useHandCursor: true });
                img.on('pointerdown', () => { setSelectedCochonnet(id); sfxUIClick(); this.scene.restart(); });
            }

            UIFactory.addText(this, cx, cy + itemSize / 2 + 4,
                id, '7px', isEquipped ? CSS.OR : CSS.GRIS, { originX: 0.5 });
        });

        // Unlocked characters (bottom-right)
        const charsY = topY + 24 + Math.ceil(allCochIds.length / cochCols) * (itemSize + 22) + 20;
        UIFactory.addText(this, rightX, charsY, 'Personnages debloques:', '9px', CSS.OR, { originX: 0 });
        const charNames = { rookie: 'Le Rookie', la_choupe: 'La Choupe', marcel: 'Marcel', magicien: 'Le Magicien', reyes: 'Reyes', ley: 'Ley' };
        (save.unlockedCharacters || []).forEach((id, i) => {
            UIFactory.addText(this, rightX + 8, charsY + 14 + i * 12, `\u2713 ${charNames[id] || id}`, '8px', CSS.CREME, { originX: 0 });
        });
    }
}
