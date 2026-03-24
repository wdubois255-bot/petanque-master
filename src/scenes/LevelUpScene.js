import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, CSS, ROOKIE_MAX_STAT, SHADOW_TEXT, STAT_BAR_WIDTH } from '../utils/Constants.js';
import { setRookieStats, addRookiePoints } from '../utils/SaveManager.js';
import { setSoundScene, sfxUIClick } from '../utils/SoundManager.js';
import UIFactory from '../ui/UIFactory.js';
import { fadeToScene } from '../utils/SceneTransition.js';

const SHADOW = UIFactory.SHADOW;

const STAT_DEFS = [
    { key: 'precision',  label: 'PRE', fullLabel: 'Precision',  color: COLORS.STAT_PRECISION,    hotkey: 'ONE',   tooltip: 'Réduit la zone de dispersion au lâcher' },
    { key: 'puissance',  label: 'PUI', fullLabel: 'Puissance',  color: COLORS.STAT_PUISSANCE,    hotkey: 'TWO',   tooltip: 'Force max du tir et portée' },
    { key: 'effet',      label: 'EFF', fullLabel: 'Effet',      color: COLORS.STAT_EFFET,        hotkey: 'THREE', tooltip: 'Contrôle du spin et des courbes' },
    { key: 'sang_froid', label: 'S-F', fullLabel: 'Sang-froid', color: COLORS.STAT_ADAPTABILITE, hotkey: 'FOUR',  tooltip: 'Stabilité de la visée sous pression' }
];

const BAR_WIDTH = STAT_BAR_WIDTH;
const BAR_HEIGHT = 16;
const ROW_HEIGHT = 52;

export default class LevelUpScene extends Phaser.Scene {
    constructor() {
        super('LevelUpScene');
    }

    init(data) {
        // Reset all flags for scene reuse (CLAUDE.md rule)
        this._confirmed = false;
        this.pointsRemaining = data.pointsToDistribute || 4;
        this.totalPointsGiven = this.pointsRemaining;
        this.baseStats = { ...data.currentStats };
        this.newStats = { ...data.currentStats };
        this.totalPoints = data.totalPoints || 10;
        this.returnScene = data.returnScene || 'ArcadeScene';
        this.returnData = data.returnData || {};
        this.newAbility = data.newAbility || null;
    }

    create() {
        setSoundScene(this);
        this._confirmed = false;
        // Ensure camera is visible (previous scene may have faded out)
        this.cameras.main.setAlpha(1);
        this.cameras.main.resetFX();

        // Background gradient
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x1A1510, 0x1A1510, 0x3A2E28, 0x3A2E28, 1);
        bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Decorative border lines (subtle provencal touch)
        const deco = this.add.graphics();
        deco.lineStyle(1, COLORS.OCRE, 0.15);
        deco.strokeRect(16, 16, GAME_WIDTH - 32, GAME_HEIGHT - 32);
        deco.lineStyle(1, COLORS.OR, 0.08);
        deco.strokeRect(20, 20, GAME_WIDTH - 40, GAME_HEIGHT - 40);

        // If new ability, show banner first then stat screen
        if (this.newAbility) {
            this._showAbilityBanner(() => this._buildStatScreen());
        } else {
            this._buildStatScreen();
        }

        this.events.on('shutdown', this._shutdown, this);
    }

    // ================================================================
    // ABILITY BANNER
    // ================================================================

    _showAbilityBanner(onComplete) {
        const overlay = this.add.graphics().setDepth(50);
        overlay.fillStyle(0x1A1510, 0.75);
        overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Golden flash
        this.cameras.main.flash(200, 255, 215, 0);

        const bannerY = GAME_HEIGHT / 2;

        // Banner background (v2 asset or fallback)
        if (this.textures.exists('v2_panel_ornate')) {
            this.add.nineslice(GAME_WIDTH / 2, bannerY, 'v2_panel_ornate', 0, 500, 80, 16, 16, 16, 16)
                .setOrigin(0.5).setAlpha(0.95).setDepth(51);
        } else {
            const banner = this.add.graphics().setDepth(51);
            banner.fillStyle(COLORS.OMBRE, 0.95);
            banner.fillRoundedRect(GAME_WIDTH / 2 - 250, bannerY - 40, 500, 80, 8);
            banner.lineStyle(2, COLORS.OR, 0.8);
            banner.strokeRoundedRect(GAME_WIDTH / 2 - 250, bannerY - 40, 500, 80, 8);
        }

        const label = this.add.text(GAME_WIDTH / 2, bannerY - 14, 'NOUVELLE CAPACITE !', {
            fontFamily: 'monospace', fontSize: '14px', color: CSS.OR,
            shadow: SHADOW
        }).setOrigin(0.5).setDepth(52).setAlpha(0);

        const abilityName = this.add.text(GAME_WIDTH / 2, bannerY + 12, this.newAbility, {
            fontFamily: 'monospace', fontSize: '24px', color: CSS.CREME,
            shadow: { offsetX: 3, offsetY: 3, color: '#1A1510', blur: 0, fill: true }
        }).setOrigin(0.5).setDepth(52).setAlpha(0);

        // Animate in
        this.tweens.add({ targets: label, alpha: 1, duration: 400, delay: 300 });
        this.tweens.add({
            targets: abilityName, alpha: 1, duration: 400, delay: 500,
            ease: 'Back.easeOut'
        });

        // Auto-dismiss after 2.5s
        this.time.delayedCall(2500, () => {
            this.tweens.add({
                targets: [overlay, banner, label, abilityName],
                alpha: 0, duration: 400,
                onComplete: () => {
                    overlay.destroy();
                    banner.destroy();
                    label.destroy();
                    abilityName.destroy();
                    onComplete();
                }
            });
        });
    }

    // ================================================================
    // STAT DISTRIBUTION SCREEN
    // ================================================================

    _buildStatScreen() {
        // Title
        const title = this.add.text(GAME_WIDTH / 2, 48, 'AMELIORATION', {
            fontFamily: 'monospace', fontSize: '32px', color: CSS.OR,
            shadow: { offsetX: 3, offsetY: 3, color: '#1A1510', blur: 0, fill: true }
        }).setOrigin(0.5).setScale(0);

        this.tweens.add({
            targets: title, scale: 1, duration: 400, ease: 'Back.easeOut'
        });

        // Subtitle (points remaining)
        this.subtitleText = this.add.text(GAME_WIDTH / 2, 88, this._subtitleString(), {
            fontFamily: 'monospace', fontSize: '18px', color: CSS.CREME,
            shadow: SHADOW
        }).setOrigin(0.5);

        // Total points indicator
        this.add.text(GAME_WIDTH / 2, 112, `Total : ${this.totalPoints} pts`, {
            fontFamily: 'monospace', fontSize: '12px', color: CSS.GRIS,
            shadow: SHADOW
        }).setOrigin(0.5);

        // Stat rows
        const startY = 160;
        this.statRows = [];
        this.barGraphics = this.add.graphics();

        // Tooltip (shared, repositioned on hover)
        this._tooltipGfx = this.add.graphics().setDepth(150).setAlpha(0);
        this._tooltipText = this.add.text(0, 0, '', {
            fontFamily: 'monospace', fontSize: '11px', color: '#F5E6D0',
            padding: { x: 8, y: 6 }, wordWrap: { width: 200 }
        }).setDepth(151).setAlpha(0);

        for (let i = 0; i < STAT_DEFS.length; i++) {
            const def = STAT_DEFS[i];
            const rowY = startY + i * ROW_HEIGHT;
            const row = this._createStatRow(def, rowY, i);
            this.statRows.push(row);
        }

        this._drawAllBars();

        // Confirm button
        this._createConfirmButton(startY + STAT_DEFS.length * ROW_HEIGHT + 40);

        // Controls hint
        UIFactory.addControlsHint(this, '1-4 Ajouter     Entree Confirmer     Echap Menu');

        // Keyboard bindings
        for (let i = 0; i < STAT_DEFS.length; i++) {
            const def = STAT_DEFS[i];
            this.input.keyboard.on(`keydown-${def.hotkey}`, () => this._addPoint(i));
        }
        this.input.keyboard.on('keydown-ENTER', () => this._confirm());
        this.input.keyboard.on('keydown-ESC', () => fadeToScene(this, this.returnScene || 'TitleScene', this.returnData));
    }

    _subtitleString() {
        if (this.pointsRemaining > 0) {
            return `Points disponibles : ${this.pointsRemaining}`;
        }
        return 'Tous les points distribues !';
    }

    _createStatRow(def, y, index) {
        const centerX = GAME_WIDTH / 2;
        const labelX = centerX - 200;
        const valueX = centerX - 110;
        const barX = centerX - 80;
        const btnX = centerX + 140;

        // Panel background for the row
        UIFactory.createPanel(this, labelX - 16, y - 18, 380, 40, {
            fillAlpha: 0.3, strokeAlpha: 0.15, strokeWidth: 1, radius: 6
        });

        // Stat label
        this.add.text(labelX, y, def.label, {
            fontFamily: 'monospace', fontSize: '16px', color: CSS.OCRE,
            shadow: SHADOW
        }).setOrigin(0, 0.5);

        // Full label (smaller, below abbreviation)
        this.add.text(labelX, y + 12, def.fullLabel, {
            fontFamily: 'monospace', fontSize: '9px', color: CSS.GRIS,
            shadow: SHADOW
        }).setOrigin(0, 0.5);

        // Zone hover pour tooltip
        const tipZone = this.add.zone(labelX + 40, y, 100, 36).setInteractive({ useHandCursor: false });
        tipZone.on('pointerover', () => this._showTooltip(def.tooltip, labelX + 110, y));
        tipZone.on('pointerout', () => this._hideTooltip());

        // Current value text
        const valueText = this.add.text(valueX, y, `${this.newStats[def.key]}`, {
            fontFamily: 'monospace', fontSize: '20px', color: CSS.CREME,
            shadow: SHADOW
        }).setOrigin(0.5, 0.5);

        // Bonus indicator (shows +N when points added)
        const bonusText = this.add.text(valueX + 20, y - 6, '', {
            fontFamily: 'monospace', fontSize: '11px', color: CSS.OR,
            shadow: SHADOW
        }).setOrigin(0, 0.5);

        // [+] button
        const btnGfx = this.add.graphics();
        this._drawPlusButton(btnGfx, btnX, y, true);

        const btnZone = this.add.zone(btnX, y, 36, 36)
            .setInteractive({ useHandCursor: true });

        btnZone.on('pointerdown', () => this._addPoint(index));
        btnZone.on('pointerover', () => {
            if (this._canAddPoint(index)) {
                btnGfx.clear();
                this._drawPlusButton(btnGfx, btnX, y, true, true);
            }
        });
        btnZone.on('pointerout', () => {
            btnGfx.clear();
            this._drawPlusButton(btnGfx, btnX, y, this._canAddPoint(index));
        });

        return { def, y, valueText, bonusText, btnGfx, btnZone, btnX };
    }

    _drawPlusButton(gfx, x, y, enabled, hovered = false) {
        const size = 30;
        const half = size / 2;

        if (enabled) {
            gfx.fillStyle(hovered ? 0x6B8E4E : 0x4A6B3A, 0.9);
            gfx.fillRoundedRect(x - half, y - half, size, size, 5);
            gfx.lineStyle(1, hovered ? COLORS.OR : COLORS.OLIVE, 0.7);
            gfx.strokeRoundedRect(x - half, y - half, size, size, 5);
        } else {
            gfx.fillStyle(COLORS.OMBRE, 0.5);
            gfx.fillRoundedRect(x - half, y - half, size, size, 5);
            gfx.lineStyle(1, COLORS.OMBRE, 0.3);
            gfx.strokeRoundedRect(x - half, y - half, size, size, 5);
        }

        // Plus sign
        const plusColor = enabled ? 0xFFFFFF : 0x5A4A38;
        const plusAlpha = enabled ? 0.95 : 0.4;
        gfx.fillStyle(plusColor, plusAlpha);
        gfx.fillRect(x - 6, y - 1.5, 12, 3);
        gfx.fillRect(x - 1.5, y - 6, 3, 12);
    }

    _canAddPoint(index) {
        const def = STAT_DEFS[index];
        return this.pointsRemaining > 0 && this.newStats[def.key] < ROOKIE_MAX_STAT;
    }

    _addPoint(index) {
        if (!this._canAddPoint(index)) return;

        const def = STAT_DEFS[index];
        this.newStats[def.key]++;
        this.pointsRemaining--;

        sfxUIClick();

        // Update value display
        const row = this.statRows[index];
        row.valueText.setText(`${this.newStats[def.key]}`);

        // Update bonus indicator
        const bonus = this.newStats[def.key] - this.baseStats[def.key];
        row.bonusText.setText(bonus > 0 ? `+${bonus}` : '');

        // Animate value text
        this.tweens.add({
            targets: row.valueText,
            scale: 1.3, duration: 100, yoyo: true, ease: 'Back.easeOut'
        });

        // Update subtitle
        this.subtitleText.setText(this._subtitleString());
        if (this.pointsRemaining === 0) {
            this.subtitleText.setColor(CSS.OR);
        }

        // Redraw all bars and buttons
        this._drawAllBars();
        this._updateAllButtons();
        this._updateConfirmButton();
    }

    _drawAllBars() {
        const centerX = GAME_WIDTH / 2;
        const barX = centerX - 80;

        this.barGraphics.clear();

        for (let i = 0; i < STAT_DEFS.length; i++) {
            const def = STAT_DEFS[i];
            const row = this.statRows[i];
            const y = row.y;

            // Background bar
            this.barGraphics.fillStyle(COLORS.OMBRE_DEEP, 0.8);
            this.barGraphics.fillRoundedRect(barX, y - BAR_HEIGHT / 2, BAR_WIDTH, BAR_HEIGHT, 3);

            // Base stat fill (dimmer)
            const baseRatio = Math.min(1, this.baseStats[def.key] / ROOKIE_MAX_STAT);
            if (baseRatio > 0) {
                this.barGraphics.fillStyle(def.color, 0.4);
                this.barGraphics.fillRoundedRect(barX, y - BAR_HEIGHT / 2, BAR_WIDTH * baseRatio, BAR_HEIGHT, 3);
            }

            // New stat fill (brighter, on top)
            const newRatio = Math.min(1, this.newStats[def.key] / ROOKIE_MAX_STAT);
            if (newRatio > 0) {
                this.barGraphics.fillStyle(def.color, 0.85);
                this.barGraphics.fillRoundedRect(barX, y - BAR_HEIGHT / 2, BAR_WIDTH * newRatio, BAR_HEIGHT, 3);

                // Highlight on top half
                this.barGraphics.fillStyle(0xFFFFFF, 0.15);
                this.barGraphics.fillRoundedRect(barX, y - BAR_HEIGHT / 2, BAR_WIDTH * newRatio, BAR_HEIGHT / 2, 3);
            }

            // New portion highlight (golden edge for newly added points)
            if (newRatio > baseRatio) {
                this.barGraphics.fillStyle(COLORS.OR, 0.3);
                this.barGraphics.fillRoundedRect(
                    barX + BAR_WIDTH * baseRatio, y - BAR_HEIGHT / 2,
                    BAR_WIDTH * (newRatio - baseRatio), BAR_HEIGHT, 3
                );
            }

            // Notches (one per point)
            for (let n = 1; n < ROOKIE_MAX_STAT; n++) {
                const nx = barX + (BAR_WIDTH / ROOKIE_MAX_STAT) * n;
                this.barGraphics.fillStyle(0x1A1510, 0.5);
                this.barGraphics.fillRect(nx - 0.5, y - BAR_HEIGHT / 2, 1, BAR_HEIGHT);
            }
        }
    }

    _updateAllButtons() {
        for (let i = 0; i < this.statRows.length; i++) {
            const row = this.statRows[i];
            row.btnGfx.clear();
            this._drawPlusButton(row.btnGfx, row.btnX, row.y, this._canAddPoint(i));
        }
    }

    // ================================================================
    // CONFIRM BUTTON
    // ================================================================

    _createConfirmButton(y) {
        this.confirmY = y;

        this.confirmGfx = this.add.graphics();
        this.confirmText = this.add.text(GAME_WIDTH / 2, y, 'CONFIRMER', {
            fontFamily: 'monospace', fontSize: '22px', color: CSS.CREME,
            shadow: SHADOW
        }).setOrigin(0.5);

        this.confirmZone = this.add.zone(GAME_WIDTH / 2, y, 180, 44)
            .setInteractive({ useHandCursor: true });

        this.confirmZone.on('pointerdown', () => this._confirm());
        this.confirmZone.on('pointerover', () => this._drawConfirmBtn(true));
        this.confirmZone.on('pointerout', () => this._drawConfirmBtn(false));

        this._drawConfirmBtn(false);
    }

    _drawConfirmBtn(hovered = false) {
        this.confirmGfx.clear();
        const x = GAME_WIDTH / 2;
        const y = this.confirmY;
        const w = 180;
        const h = 44;
        const enabled = this.pointsRemaining === 0;

        if (enabled) {
            const color = hovered ? 0xD45A4F : COLORS.ACCENT;
            this.confirmGfx.fillStyle(color, 0.95);
            this.confirmGfx.fillRoundedRect(x - w / 2, y - h / 2, w, h, 6);
            this.confirmGfx.lineStyle(2, COLORS.OR, 0.5);
            this.confirmGfx.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 6);
            this.confirmText.setColor(CSS.CREME);
            this.confirmText.setAlpha(1);
        } else {
            this.confirmGfx.fillStyle(COLORS.OMBRE, 0.6);
            this.confirmGfx.fillRoundedRect(x - w / 2, y - h / 2, w, h, 6);
            this.confirmGfx.lineStyle(1, COLORS.OMBRE, 0.3);
            this.confirmGfx.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 6);
            this.confirmText.setColor(CSS.GRIS);
            this.confirmText.setAlpha(0.5);
        }
    }

    _updateConfirmButton() {
        this._drawConfirmBtn(false);
    }

    // ================================================================
    // CONFIRM & TRANSITION
    // ================================================================

    _confirm() {
        if (this._confirmed) return;
        this._confirmed = true;
        sfxUIClick();

        // Save the new stats + increment total points (triggers ability unlocks at 18/26/34)
        setRookieStats(this.newStats);
        addRookiePoints(this.totalPointsGiven);

        // Flash feedback then direct transition
        this.cameras.main.flash(150, 255, 215, 0);
        this.time.delayedCall(200, () => {
            fadeToScene(this, this.returnScene, this.returnData);
        });
    }

    // ================================================================
    // TOOLTIPS
    // ================================================================

    _showTooltip(text, x, y) {
        if (!this._tooltipGfx || !this._tooltipText) return;
        this._tooltipText.setText(text);
        this._tooltipText.setPosition(x + 10, y - 14);

        const tw = this._tooltipText.width + 16;
        const th = this._tooltipText.height + 12;
        this._tooltipGfx.clear();
        this._tooltipGfx.fillStyle(0x3A2E28, 0.95);
        this._tooltipGfx.fillRoundedRect(x + 8, y - 16, tw, th, 4);
        this._tooltipGfx.lineStyle(1, 0xD4A574, 0.4);
        this._tooltipGfx.strokeRoundedRect(x + 8, y - 16, tw, th, 4);

        this._tooltipGfx.setAlpha(1);
        this._tooltipText.setAlpha(1);
    }

    _hideTooltip() {
        if (this._tooltipGfx) this._tooltipGfx.setAlpha(0);
        if (this._tooltipText) this._tooltipText.setAlpha(0);
    }

    // ================================================================
    // CLEANUP
    // ================================================================

    _shutdown() {
        this.input.keyboard.removeAllListeners();
        this.tweens.killAll();
    }
}
