import Phaser from 'phaser';
import {
    DEAD_ZONE_PX,
    LOFT_PRESETS, LOFT_DEMI_PORTEE, LOFT_TIR, LOFT_TIR_DEVANT, LOFT_RAFLE,
    COCHONNET_MIN_DIST, COCHONNET_MAX_DIST,
    FOCUS_CHARGES_PER_MATCH, AIMING_UI_BOTTOM_OFFSET, FOCUS_UI_STACK_OFFSET,
    LATERAL_SPIN_MIN_EFFET,
    IS_MOBILE, TOUCH_BUTTON_SIZE, TOUCH_PADDING
} from '../utils/Constants.js';
import PetanqueEngine from './PetanqueEngine.js';
import { sfxUIClick } from '../utils/SoundManager.js';
import UIFactory from '../ui/UIFactory.js';

const SHADOW = UIFactory.SHADOW;

export default class AimingSystem {
    constructor(scene, engine, characterStats = null) {
        this.scene = scene;
        this.engine = engine;
        this.isDragging = false;
        this.startX = 0;
        this.startY = 0;
        this.currentX = 0;
        this.currentY = 0;

        // Character stats (affects aiming)
        this.charStats = characterStats || { precision: 6, puissance: 6, effet: 6, sang_froid: 6 };

        // Pressure tremble state
        this._trembleOffset = { x: 0, y: 0 };
        this._trembleTime = 0;

        // Precision wobble: landing marker oscillates based on precision stat
        this._aimTime = 0;
        this._wobbleOffset = { x: 0, y: 0 };

        // Shot mode: 'pointer' or 'tirer'
        this.shotMode = null;
        this._modeUI = [];
        this._targetHighlights = null;

        // Loft selection (only for pointer mode)
        this.loftIndex = 1; // default = demi-portee (middle)
        this.loftPreset = LOFT_DEMI_PORTEE;
        this._loftUI = [];

        // Retro (backspin) toggle
        this.retroActive = false;

        // Ciblage cochonnet [B]
        this._targetCochonnet = false;

        // Spin lateral [E] : 0 = off, -1 = gauche, +1 = droite
        this._lateralSpin = 0;

        // === FOCUS (Respire) system: reduces wobble by 80% for one throw ===
        this._focusCharges = FOCUS_CHARGES_PER_MATCH;
        this._focusActive = false;        // active this throw?
        this._focusUI = [];
        this._focusReduction = 0.20;      // multiplier when active (80% reduction = 0.20)

        // === UNIQUE ABILITIES per character ===
        this._abilityCharges = 0;
        this._abilityActive = false;
        this._abilityUI = [];
        this._abilityDef = null;          // set by setCharacterAbility()

        // Secondary ability (Rookie with both Instinct + Naturel)
        this._secondaryDef = null;
        this._secondaryCharges = 0;
        this._secondaryActive = false;
        this._keyV = null;

        // Determination passive (Rookie)
        this._determinationActive = false;

        this.arrowGfx = scene.add.graphics().setDepth(50);
        this._predictionGfx = scene.add.graphics().setDepth(49);

        // Pointer events
        scene.input.on('pointerdown', this.onPointerDown, this);
        scene.input.on('pointermove', this.onPointerMove, this);
        scene.input.on('pointerup', this.onPointerUp, this);

        // Escape to cancel
        scene.input.keyboard.on('keydown-ESC', () => {
            this.cancel();
        });

        // Listen to state changes for cleanup
        this.engine.onStateChange = (state) => {
            if (state === 'COCHONNET_THROW') {
                this.shotMode = null;
                this._clearModeUI();
                this._clearLoftUI();
                this._clearRetroUI();
                this._clearFocusUI();
                this._clearAbilityUI();
            } else if (state === 'WAITING_STOP' || state === 'SCORE_MENE' || state === 'GAME_OVER') {
                this._clearModeUI();
                this._clearLoftUI();
                this._clearRetroUI();
                this._clearFocusUI();
                this._clearAbilityUI();
            }
        };

        // Listen to turn changes for shot mode selection
        // This fires AFTER currentTeam is correctly set
        const existingTurnChange = this.engine.onTurnChange;
        this.engine.onTurnChange = (team) => {
            if (existingTurnChange) existingTurnChange(team);
            // Reset per-throw abilities
            this._focusActive = false;
            this._abilityActive = false;
            this._secondaryActive = false;
            // Determination consumed after one throw
            if (this._determinationActive) this._determinationActive = false;
            this._onTurnChange(team);
        };
    }

    // === ABILITIES API ===

    /**
     * Set up the character's unique ability for this match.
     * Called once from PetanqueScene when the match starts.
     * @param {object} def - { id, name, key, charges, description, onActivate, onThrow }
     */
    setCharacterAbility(def) {
        this._abilityDef = def;
        this._abilityCharges = def?.charges || 0;
        // Secondary ability (Rookie dual abilities)
        if (def?.secondary) {
            this._secondaryDef = def.secondary;
            this._secondaryCharges = def.secondary.charges || 0;
        }
    }

    /** Reset Focus charges (call at match start) */
    resetFocusCharges(count = 5) {
        this._focusCharges = count;
        this._focusActive = false;
    }

    _onTurnChange(team) {
        this._clearModeUI();
        this._clearLoftUI();
        // Show shot choice when it's a human player's turn (player, or opponent in local mode)
        const state = this.engine.state;
        const isHumanTurn = team === 'player' || this.scene.localMultiplayer;
        if (isHumanTurn && this.engine.remaining[team] > 0 &&
            state !== 'COCHONNET_THROW') {
            this._showShotModeChoice();
        }
    }

    _showShotModeChoice() {
        this._clearModeUI();
        this._clearLoftUI();
        this.engine.aimingEnabled = false;
        this.retroActive = false;
        this._targetCochonnet = false;
        this._lateralSpin = 0;

        const cx = this.scene.scale.width / 2;
        const baseY = this.scene.scale.height - AIMING_UI_BOTTOM_OFFSET;

        // Panneau 2 rangees : Pointer (haut) + Tirer (bas)
        const panelW = 520, panelH = 86;
        const bg = this.scene.add.graphics().setDepth(95);
        bg.fillStyle(0x3A2E28, 0.88);
        bg.fillRoundedRect(cx - panelW / 2, baseY - panelH / 2, panelW, panelH, 6);
        bg.lineStyle(1, 0xD4A574, 0.35);
        bg.strokeRoundedRect(cx - panelW / 2, baseY - panelH / 2, panelW, panelH, 6);
        // Separateur horizontal entre les deux rangees
        bg.lineStyle(1, 0xD4A574, 0.15);
        bg.beginPath();
        bg.moveTo(cx - panelW / 2 + 8, baseY);
        bg.lineTo(cx + panelW / 2 - 8, baseY);
        bg.strokePath();
        this._modeUI.push(bg);

        // Label rangee Pointer
        const lblPointer = this.scene.add.text(cx - panelW / 2 + 12, baseY - panelH / 2 + 10,
            'POINTER', { fontFamily: 'monospace', fontSize: '8px', color: '#87CEEB' }
        ).setDepth(97).setAlpha(0.6);
        this._modeUI.push(lblPointer);

        // Label rangee Tirer
        const lblTirer = this.scene.add.text(cx - panelW / 2 + 12, baseY + 4,
            'TIRER', { fontFamily: 'monospace', fontSize: '8px', color: '#C44B3F' }
        ).setDepth(97).setAlpha(0.6);
        this._modeUI.push(lblTirer);

        // Options 2 rangees
        // Rangee 1 : Pointer (y = baseY - 21)
        // Rangee 2 : Tirer  (y = baseY + 21)
        const rowY1 = baseY - 21;
        const rowY2 = baseY + 21;
        const allOptions = [
            // Pointer row
            { label: '1', sublabel: 'Roulette',   desc: 'Roule au sol',         mode: 'pointer', loftObj: LOFT_PRESETS[0], color: 0x87CEEB, arcH: 0.08, oy: rowY1 },
            { label: '2', sublabel: 'Demi',        desc: 'Arc moyen',            mode: 'pointer', loftObj: LOFT_PRESETS[1], color: 0x6B8E4E, arcH: 0.35, oy: rowY1 },
            { label: '3', sublabel: 'Plombee',     desc: "Arc haut, s'arrête",   mode: 'pointer', loftObj: LOFT_PRESETS[2], color: 0x9B7BB8, arcH: 0.75, oy: rowY1 },
            // Tirer row
            { label: '4', sublabel: 'Rafle',       desc: 'Rase le sol, déplace', mode: 'tirer', loftObj: LOFT_RAFLE,       color: 0xC4854A, arcH: 0.03, oy: rowY2 },
            { label: 'T', sublabel: 'Tir au Fer',  desc: 'Frappe directe',       mode: 'tirer', loftObj: LOFT_TIR,         color: 0xC44B3F, arcH: 0.55, oy: rowY2 },
            { label: 'D', sublabel: 'Tir Devant',  desc: 'Rebond avant cible',   mode: 'tirer', loftObj: LOFT_TIR_DEVANT,  color: 0xAA8866, arcH: 0.42, oy: rowY2 },
        ];
        const spacing = 150;
        const startX = cx - spacing;

        this._combinedBtns = [];
        this._combinedGfx = [];
        this._combinedSelected = 1; // default demi-portee

        for (let i = 0; i < allOptions.length; i++) {
            const opt = allOptions[i];
            const ox = startX + (i % 3) * spacing;

            // Mini arc icon
            const arcGfx = this.scene.add.graphics().setDepth(97);
            this._drawMiniArc(arcGfx, ox, opt.oy - 10, opt.arcH, opt.color, false);
            this._modeUI.push(arcGfx);
            this._combinedGfx.push(arcGfx);

            // Label
            const label = this.scene.add.text(ox, opt.oy + 10, `[${opt.label}] ${opt.sublabel}`, {
                fontFamily: 'monospace', fontSize: '10px',
                color: '#' + opt.color.toString(16).padStart(6, '0'),
                shadow: SHADOW
            }).setOrigin(0.5).setDepth(97).setAlpha(0.85);
            this._modeUI.push(label);

            // Sous-description (9px, gris neutre)
            const subDesc = this.scene.add.text(ox, opt.oy + 20, opt.desc, {
                fontFamily: 'monospace', fontSize: '9px', color: '#9E9E8E'
            }).setOrigin(0.5).setDepth(97).setAlpha(0.7);
            this._modeUI.push(subDesc);

            // Hit zone — agrandie sur mobile pour respecter 44px min (WCAG)
            const hitW = IS_MOBILE ? TOUCH_BUTTON_SIZE + TOUCH_PADDING * 2 : spacing - 8;
            const hitH = IS_MOBILE ? TOUCH_BUTTON_SIZE : 38;
            const hitZone = this.scene.add.zone(ox, opt.oy, hitW, hitH)
                .setDepth(98).setInteractive({ useHandCursor: true });
            this._modeUI.push(hitZone);
            this._combinedBtns.push({ hitZone, label, arcGfx, opt });

            const idx = i;
            hitZone.on('pointerdown', (pointer) => {
                pointer.event.stopPropagation();
                this._selectCombined(idx);
            });
            hitZone.on('pointerover', () => {
                this._combinedSelected = idx;
                this._updateCombinedHighlight();
            });
        }

        this._keyLeft = this.scene.input.keyboard.addKey('LEFT');
        this._keyRight = this.scene.input.keyboard.addKey('RIGHT');
        this._keySpace = this.scene.input.keyboard.addKey('SPACE');
        this._key1 = this.scene.input.keyboard.addKey('ONE');
        this._key2 = this.scene.input.keyboard.addKey('TWO');
        this._key3 = this.scene.input.keyboard.addKey('THREE');
        this._keyT = this.scene.input.keyboard.addKey('T');

        // Touches tirer row
        this._key4 = this.scene.input.keyboard.addKey('FOUR');
        this._key5 = null; // T couvre Fer
        this._key6 = this.scene.input.keyboard.addKey('D');

        this._allOptions = allOptions;
        this._updateCombinedHighlight();

        // === FOCUS indicator ===
        this._showFocusUI(cx, baseY - panelH / 2 - 22);

        // === UNIQUE ABILITY indicator ===
        if (this._abilityDef && this._abilityCharges > 0) {
            this._showAbilityUI(cx, baseY - panelH / 2 - 42);
        }
    }

    _drawMiniArc(gfx, cx, cy, arcHeight, color, selected) {
        gfx.clear();
        const w = 40, h = arcHeight * 20;
        const alpha = selected ? 1 : 0.5;
        const lineW = selected ? 2.5 : 1.5;

        // Draw arc curve
        gfx.lineStyle(lineW, color, alpha);
        gfx.beginPath();
        const steps = 12;
        for (let s = 0; s <= steps; s++) {
            const t = s / steps;
            const px = cx - w / 2 + t * w;
            const py = cy - Math.sin(t * Math.PI) * h;
            if (s === 0) gfx.moveTo(px, py);
            else gfx.lineTo(px, py);
        }
        gfx.strokePath();

        // Landing dot
        if (selected) {
            gfx.fillStyle(color, 0.9);
            gfx.fillCircle(cx + w / 2, cy, 2.5);
        }

        // Ground line
        gfx.lineStyle(1, color, alpha * 0.3);
        gfx.beginPath();
        gfx.moveTo(cx - w / 2, cy);
        gfx.lineTo(cx + w / 2, cy);
        gfx.strokePath();
    }

    _updateCombinedHighlight() {
        if (!this._combinedBtns) return;
        for (let i = 0; i < this._combinedBtns.length; i++) {
            const { label, arcGfx, opt } = this._combinedBtns[i];
            const selected = i === this._combinedSelected;
            label.setAlpha(selected ? 1 : 0.6);
            label.setFontSize(selected ? '11px' : '10px');
            this._drawMiniArc(arcGfx, label.x, label.y - 20, opt.arcH, opt.color, selected);
        }
    }

    _selectCombined(index) {
        sfxUIClick();
        const opt = this._allOptions[index];
        this._clearModeUI();

        if (opt.mode === 'tirer') {
            this.shotMode = 'tirer';
            this.loftPreset = opt.loftObj;
            this._highlightOpponentBalls();
            if (opt.loftObj.retroAllowed) this._showRetroToggle();
            this._showCochonnetToggle();
            this._showSpinLateralToggle();
            this.engine._showMessage(`${opt.loftObj.label} - Visez une boule adverse !`);
        } else {
            this.shotMode = 'pointer';
            this.loftPreset = opt.loftObj;
            if (this.loftPreset.retroAllowed) this._showRetroToggle();
            this._showSpinLateralToggle();
            this.engine._showMessage(`${this.loftPreset.label} - Visez pres du cochonnet !`);
        }
        this.engine.aimingEnabled = true;
    }

    // Retro toggle: slim indicator bottom-right, toggled with [R]
    _showRetroToggle() {
        this._clearRetroUI();
        this._retroUI = [];

        const effetStat = this.charStats.effet || 6;
        const x = this.scene.scale.width - 90;
        const y = this.scene.scale.height - 32;

        const retroLabel = this.scene.add.text(x, y, '[R] Retro', {
            fontFamily: 'monospace', fontSize: '11px',
            color: '#9B7BB8', shadow: SHADOW
        }).setOrigin(0.5).setDepth(96).setAlpha(0.5)
            .setInteractive({ useHandCursor: true });
        this._retroUI.push(retroLabel);
        this._retroLabel = retroLabel;

        // Effet stat indicator (small dots)
        const dotGfx = this.scene.add.graphics().setDepth(96);
        for (let d = 0; d < 5; d++) {
            const filled = d < Math.ceil(effetStat / 2);
            dotGfx.fillStyle(filled ? 0x9B7BB8 : 0x3A2E28, filled ? 0.7 : 0.3);
            dotGfx.fillCircle(x - 20 + d * 10, y + 12, 3);
        }
        this._retroUI.push(dotGfx);

        retroLabel.on('pointerdown', (pointer) => {
            pointer.event.stopPropagation();
            this._toggleRetro();
        });

        this._keyR = this.scene.input.keyboard.addKey('R');
    }

    _toggleRetro() {
        this.retroActive = !this.retroActive;
        sfxUIClick();
        if (this._retroLabel) {
            this._retroLabel.setAlpha(this.retroActive ? 1 : 0.5);
            this._retroLabel.setColor(this.retroActive ? '#D4A574' : '#9B7BB8');
            this._retroLabel.setText(this.retroActive ? '[R] RETRO !' : '[R] Retro');
        }
    }

    _clearRetroUI() {
        if (this._retroUI) {
            this._retroUI.forEach(e => e.destroy());
            this._retroUI = [];
        }
        this._retroLabel = null;
        if (this._keyR) { this._keyR.removeAllListeners(); this._keyR = null; }
    }

    // Tir devant toggle: [D] switches between TIR and TIR DEVANT
    _showTirDevantToggle() {
        this._clearTirDevantUI();
        this._tirDevantUI = [];

        const x = this.scene.scale.width - 90;
        const y = this.scene.scale.height - 54;

        const label = this.scene.add.text(x, y, '[D] Tir devant', {
            fontFamily: 'monospace', fontSize: '10px',
            color: '#AA8866', shadow: SHADOW
        }).setOrigin(0.5).setDepth(96).setAlpha(0.5)
            .setInteractive({ useHandCursor: true });
        this._tirDevantUI.push(label);
        this._tirDevantLabel = label;

        label.on('pointerdown', (pointer) => {
            pointer.event.stopPropagation();
            this._toggleTirDevant();
        });

        this._keyD = this.scene.input.keyboard.addKey('D');
    }

    _toggleTirDevant() {
        this._tirDevant = !this._tirDevant;
        sfxUIClick();
        if (this._tirDevant) {
            this.loftPreset = LOFT_TIR_DEVANT;
            if (this._tirDevantLabel) {
                this._tirDevantLabel.setAlpha(1);
                this._tirDevantLabel.setColor('#FFD700');
                this._tirDevantLabel.setText('[D] TIR DEVANT !');
            }
            this.engine._showMessage('Tir devant : atterrit avant la cible !');
        } else {
            this.loftPreset = LOFT_TIR;
            if (this._tirDevantLabel) {
                this._tirDevantLabel.setAlpha(0.5);
                this._tirDevantLabel.setColor('#AA8866');
                this._tirDevantLabel.setText('[D] Tir devant');
            }
            this.engine._showMessage('Tir au fer : frappe directe !');
        }
    }

    _clearTirDevantUI() {
        if (this._tirDevantUI) {
            this._tirDevantUI.forEach(e => e.destroy());
            this._tirDevantUI = [];
        }
        this._tirDevantLabel = null;
        if (this._keyD) { this._keyD.removeAllListeners(); this._keyD = null; }
    }

    // === Ciblage cochonnet [B] — disponible en mode tirer ===

    _showCochonnetToggle() {
        this._clearCochonnetUI();
        this._cochonnetUI = [];

        const x = this.scene.scale.width - 90;
        const y = this.scene.scale.height - 54;

        const label = this.scene.add.text(x, y, '[B] Cochonnet', {
            fontFamily: 'monospace', fontSize: '10px',
            color: '#FFD700', shadow: SHADOW
        }).setOrigin(0.5).setDepth(96).setAlpha(0.5)
            .setInteractive({ useHandCursor: true });
        this._cochonnetUI.push(label);
        this._cochonnetLabel = label;

        label.on('pointerdown', (pointer) => {
            pointer.event.stopPropagation();
            this._toggleCochonnet();
        });

        this._keyB = this.scene.input.keyboard.addKey('B');
        this._keyB.on('down', () => this._toggleCochonnet());
    }

    _toggleCochonnet() {
        this._targetCochonnet = !this._targetCochonnet;
        sfxUIClick();
        if (this._cochonnetLabel) {
            this._cochonnetLabel.setAlpha(this._targetCochonnet ? 1 : 0.5);
            this._cochonnetLabel.setText(this._targetCochonnet ? '[B] COCHONNET !' : '[B] Cochonnet');
        }
    }

    _clearCochonnetUI() {
        if (this._cochonnetUI) {
            this._cochonnetUI.forEach(e => e.destroy());
            this._cochonnetUI = [];
        }
        this._cochonnetLabel = null;
        if (this._keyB) { this._keyB.removeAllListeners(); this._keyB = null; }
    }

    // === Spin lateral [E] : off → gauche → droite → off ===

    _showSpinLateralToggle() {
        this._clearSpinLateralUI();
        this._spinLateralUI = [];

        const effetStat = this.charStats.effet || 6;
        if (effetStat < LATERAL_SPIN_MIN_EFFET) return; // Stat insuffisante

        const x = this.scene.scale.width - 90;
        // Position : juste sous le toggle retro (retro = -32, spin = -54 si retro present, sinon -32)
        const hasRetro = this._retroLabel != null;
        const y = this.scene.scale.height - (hasRetro ? 76 : 54);

        const spinLabels = { 0: '[E] Spin', '-1': '[E] ← Gauche !', '1': '[E] → Droite !' };
        const spinColors = { 0: '#9E9E8E', '-1': '#87CEEB', '1': '#C44B3F' };

        const label = this.scene.add.text(x, y, spinLabels[0], {
            fontFamily: 'monospace', fontSize: '10px',
            color: spinColors[0], shadow: SHADOW
        }).setOrigin(0.5).setDepth(96).setAlpha(0.5)
            .setInteractive({ useHandCursor: true });
        this._spinLateralUI.push(label);
        this._spinLateralLabel = label;

        label.on('pointerdown', (pointer) => {
            pointer.event.stopPropagation();
            this._toggleSpinLateral();
        });

        this._keyE = this.scene.input.keyboard.addKey('E');
        this._keyE.on('down', () => this._toggleSpinLateral());

        this._spinLabelMap = spinLabels;
        this._spinColorMap = spinColors;
    }

    _toggleSpinLateral() {
        // Cycle : 0 → -1 → +1 → 0
        if (this._lateralSpin === 0) this._lateralSpin = -1;
        else if (this._lateralSpin === -1) this._lateralSpin = 1;
        else this._lateralSpin = 0;

        sfxUIClick();
        if (this._spinLateralLabel) {
            const key = String(this._lateralSpin);
            this._spinLateralLabel.setText(this._spinLabelMap[key]);
            this._spinLateralLabel.setColor(this._spinColorMap[key]);
            this._spinLateralLabel.setAlpha(this._lateralSpin !== 0 ? 1 : 0.5);
        }
    }

    _clearSpinLateralUI() {
        if (this._spinLateralUI) {
            this._spinLateralUI.forEach(e => e.destroy());
            this._spinLateralUI = [];
        }
        this._spinLateralLabel = null;
        if (this._keyE) { this._keyE.removeAllListeners(); this._keyE = null; }
    }

    // === FOCUS (Respire) UI & Logic ===

    _showFocusUI(cx, y) {
        this._clearFocusUI();
        if (this._focusCharges <= 0) return;

        const active = this._focusActive;
        const bx = 16, by = y;
        const bw = 110, bh = 28;

        // Pill-shaped background
        const bg = this.scene.add.graphics().setDepth(96);
        bg.fillStyle(active ? 0x2A5A3A : 0x2A3A5A, 0.85);
        bg.fillRoundedRect(bx, by - bh / 2, bw, bh, 8);
        bg.lineStyle(1, active ? 0x4ADE80 : 0x87CEEB, 0.5);
        bg.strokeRoundedRect(bx, by - bh / 2, bw, bh, 8);
        this._focusUI.push(bg);
        this._modeUI.push(bg);

        // Label
        const label = this.scene.add.text(bx + 8, by, active ? 'F FOCUS !' : 'F Respire', {
            fontFamily: 'monospace', fontSize: '10px',
            color: active ? '#4ADE80' : '#87CEEB', shadow: SHADOW
        }).setOrigin(0, 0.5).setDepth(97);
        this._focusUI.push(label);
        this._modeUI.push(label);

        // Charge dots
        const dotsG = this.scene.add.graphics().setDepth(97);
        for (let d = 0; d < 5; d++) {
            const filled = d < this._focusCharges;
            dotsG.fillStyle(filled ? 0x87CEEB : 0x3A4A5A, filled ? 0.9 : 0.4);
            dotsG.fillCircle(bx + bw - 38 + d * 8, by, 3);
        }
        this._focusUI.push(dotsG);
        this._modeUI.push(dotsG);

        // Click zone
        const hitZone = this.scene.add.zone(bx + bw / 2, by, bw, bh)
            .setDepth(98).setInteractive({ useHandCursor: true });
        hitZone.on('pointerdown', () => this._toggleFocus());
        this._focusUI.push(hitZone);
        this._modeUI.push(hitZone);

        this._keyF = this.scene.input.keyboard.addKey('F');
        this._keyF.on('down', () => this._toggleFocus());
    }

    _toggleFocus() {
        if (this._focusCharges <= 0 && !this._focusActive) return;
        this._focusActive = !this._focusActive;
        if (this._focusActive) {
            this._focusCharges--;
            // Visual feedback: brief screen tint
            const overlay = this.scene.add.rectangle(
                this.scene.scale.width / 2, this.scene.scale.height / 2,
                this.scene.scale.width, this.scene.scale.height,
                0x88CCFF, 0.15
            ).setDepth(200);
            this.scene.tweens.add({
                targets: overlay, alpha: 0, duration: 600,
                onComplete: () => overlay.destroy()
            });
            this.engine._showMessage('Focus... Respire...', 1000);
        } else {
            this._focusCharges++; // refund
        }
        // Refresh UI
        const cx = this.scene.scale.width / 2;
        const baseY = this.scene.scale.height - AIMING_UI_BOTTOM_OFFSET - FOCUS_UI_STACK_OFFSET;
        this._clearFocusUI();
        this._showFocusUI(cx, baseY + 6);
    }

    _clearFocusUI() {
        this._focusUI.forEach(e => { if (e && e.destroy) e.destroy(); });
        this._focusUI = [];
        if (this._keyF) { this._keyF.removeAllListeners(); this._keyF = null; }
    }

    // === UNIQUE ABILITY UI & Logic ===

    _showAbilityUI(cx, y) {
        this._clearAbilityUI();
        const def = this._abilityDef;
        if (!def || this._abilityCharges <= 0) return;

        const active = this._abilityActive;
        const sw = this.scene.scale.width;
        const bw = 140, bh = 28;
        const bx = sw - bw - 16, by = y;

        // Pill-shaped background (right side of screen)
        const bg = this.scene.add.graphics().setDepth(96);
        bg.fillStyle(active ? 0x5A4A10 : 0x3A2E28, 0.85);
        bg.fillRoundedRect(bx, by - bh / 2, bw, bh, 8);
        bg.lineStyle(1, active ? 0xFFD700 : 0xD4A574, 0.5);
        bg.strokeRoundedRect(bx, by - bh / 2, bw, bh, 8);
        this._abilityUI.push(bg);
        this._modeUI.push(bg);

        // Short name with key hint
        const shortName = def.name.length > 14 ? def.name.slice(0, 13) + '.' : def.name;
        const label = this.scene.add.text(bx + 8, by, active ? `C ${shortName} !` : `C ${shortName}`, {
            fontFamily: 'monospace', fontSize: '10px',
            color: active ? '#FFD700' : '#D4A574', shadow: SHADOW
        }).setOrigin(0, 0.5).setDepth(97);
        this._abilityUI.push(label);
        this._modeUI.push(label);

        // Charge dots
        const maxCharges = def.charges || 3;
        const dotsG = this.scene.add.graphics().setDepth(97);
        for (let d = 0; d < maxCharges; d++) {
            const filled = d < this._abilityCharges;
            dotsG.fillStyle(filled ? 0xFFD700 : 0x5A4A38, filled ? 0.9 : 0.4);
            dotsG.fillCircle(bx + bw - 8 - (maxCharges - 1 - d) * 8, by, 3);
        }
        this._abilityUI.push(dotsG);
        this._modeUI.push(dotsG);

        // Click zone
        const hitZone = this.scene.add.zone(bx + bw / 2, by, bw, bh)
            .setDepth(98).setInteractive({ useHandCursor: true });
        hitZone.on('pointerdown', () => this._toggleAbility());
        this._abilityUI.push(hitZone);
        this._modeUI.push(hitZone);

        this._keyC = this.scene.input.keyboard.addKey('C');
        this._keyC.on('down', () => this._toggleAbility());

        // Secondary ability (Rookie: V key)
        if (this._secondaryDef && this._secondaryCharges > 0) {
            const sDef = this._secondaryDef;
            const sx = bx, sy = by + bh + 4;
            const sbg = this.scene.add.graphics().setDepth(96);
            sbg.fillStyle(this._secondaryActive ? 0x2A5A3A : 0x3A2E28, 0.85);
            sbg.fillRoundedRect(sx, sy - bh / 2, bw, bh, 8);
            sbg.lineStyle(1, this._secondaryActive ? 0x4ADE80 : 0xD4A574, 0.5);
            sbg.strokeRoundedRect(sx, sy - bh / 2, bw, bh, 8);
            this._abilityUI.push(sbg);
            this._modeUI.push(sbg);

            const sName = sDef.name.length > 14 ? sDef.name.slice(0, 13) + '.' : sDef.name;
            const sLabel = this.scene.add.text(sx + 8, sy, this._secondaryActive ? `V ${sName} !` : `V ${sName}`, {
                fontFamily: 'monospace', fontSize: '10px',
                color: this._secondaryActive ? '#4ADE80' : '#D4A574', shadow: SHADOW
            }).setOrigin(0, 0.5).setDepth(97);
            this._abilityUI.push(sLabel);
            this._modeUI.push(sLabel);

            // Charge dots for secondary
            const sDotsG = this.scene.add.graphics().setDepth(97);
            const sMax = sDef.charges || 1;
            for (let d = 0; d < sMax; d++) {
                const filled = d < this._secondaryCharges;
                sDotsG.fillStyle(filled ? 0x4ADE80 : 0x5A4A38, filled ? 0.9 : 0.4);
                sDotsG.fillCircle(sx + bw - 12 - d * 10, sy, 3);
            }
            this._abilityUI.push(sDotsG);
            this._modeUI.push(sDotsG);

            const sHitZone = this.scene.add.zone(sx + bw / 2, sy, bw, bh)
                .setDepth(98).setInteractive({ useHandCursor: true });
            sHitZone.on('pointerdown', () => this._toggleSecondaryAbility());
            this._abilityUI.push(sHitZone);
            this._modeUI.push(sHitZone);

            this._keyV = this.scene.input.keyboard.addKey('V');
            this._keyV.on('down', () => this._toggleSecondaryAbility());
        }
    }

    _toggleAbility() {
        const def = this._abilityDef;
        if (!def) return;
        if (this._abilityCharges <= 0 && !this._abilityActive) return;

        this._abilityActive = !this._abilityActive;
        if (this._abilityActive) {
            this._abilityCharges--;
            // Visual flash
            const overlay = this.scene.add.rectangle(
                this.scene.scale.width / 2, this.scene.scale.height / 2,
                this.scene.scale.width, this.scene.scale.height,
                0xFFD700, 0.12
            ).setDepth(200);
            this.scene.tweens.add({
                targets: overlay, alpha: 0, duration: 500,
                onComplete: () => overlay.destroy()
            });
            this.engine._showMessage(`${def.name} active !`, 1000);

            // L'Instinct: slow-motion effect
            if (def.id === 'instinct') {
                this._activateInstinct();
            }
        } else {
            this._abilityCharges++;
        }
        // Refresh UI
        const cx = this.scene.scale.width / 2;
        const baseY = this.scene.scale.height - 52 - 28 - 42;
        this._clearAbilityUI();
        this._showAbilityUI(cx, baseY + 6);
    }

    _toggleSecondaryAbility() {
        const def = this._secondaryDef;
        if (!def) return;
        if (this._secondaryCharges <= 0 && !this._secondaryActive) return;

        this._secondaryActive = !this._secondaryActive;
        if (this._secondaryActive) {
            this._secondaryCharges--;
            const overlay = this.scene.add.rectangle(
                this.scene.scale.width / 2, this.scene.scale.height / 2,
                this.scene.scale.width, this.scene.scale.height,
                0x4ADE80, 0.12
            ).setDepth(200);
            this.scene.tweens.add({
                targets: overlay, alpha: 0, duration: 500,
                onComplete: () => overlay.destroy()
            });
            this.engine._showMessage(`${def.name} active !`, 1000);
        } else {
            this._secondaryCharges++;
        }
        const cx = this.scene.scale.width / 2;
        const baseY = this.scene.scale.height - 52 - 28 - 42;
        this._clearAbilityUI();
        this._showAbilityUI(cx, baseY + 6);
    }

    _activateInstinct() {
        // Slow-motion: reduce time scale to 0.4 for 2 seconds
        this.scene.time.timeScale = 0.4;
        this.scene.tweens.timeScale = 0.4;

        // Golden vignette overlay
        const vignette = this.scene.add.rectangle(
            this.scene.scale.width / 2, this.scene.scale.height / 2,
            this.scene.scale.width, this.scene.scale.height,
            0xFFD700, 0.08
        ).setDepth(199);

        // Restore after 2 real seconds (= 2000 / 0.4 = 5000 game ms)
        this.scene.time.delayedCall(2000 / 0.4, () => {
            this.scene.time.timeScale = 1;
            this.scene.tweens.timeScale = 1;
            this.scene.tweens.add({
                targets: vignette, alpha: 0, duration: 300,
                onComplete: () => vignette.destroy()
            });
        });
    }

    _clearAbilityUI() {
        this._abilityUI.forEach(e => { if (e && e.destroy) e.destroy(); });
        this._abilityUI = [];
        if (this._keyC) { this._keyC.removeAllListeners(); this._keyC = null; }
        if (this._keyV) { this._keyV.removeAllListeners(); this._keyV = null; }
    }

    /** Get the wobble multiplier for this throw (Focus reduces by 80%) */
    _getFocusMultiplier() {
        return this._focusActive ? this._focusReduction : 1.0;
    }

    /** Check if a specific ability effect is active for this throw */
    isAbilityActive(effectId) {
        if (this._abilityActive && this._abilityDef?.id === effectId) return true;
        if (this._secondaryActive && this._secondaryDef?.id === effectId) return true;
        return false;
    }

    _updateModeHighlight() {
        if (!this._pointerBtn || !this._tirerBtn) return;
        if (this._modeSelected === 0) {
            this._pointerBtn.setStyle({ backgroundColor: '#6B5A40', color: '#FFD700' });
            this._tirerBtn.setStyle({ backgroundColor: '#4A3E28', color: '#C44B3F' });
        } else {
            this._pointerBtn.setStyle({ backgroundColor: '#4A3E28', color: '#A8B5C2' });
            this._tirerBtn.setStyle({ backgroundColor: '#6B5A40', color: '#FFD700' });
        }
    }

    _selectShotMode(mode) {
        this.shotMode = mode;
        this._clearModeUI();

        if (mode === 'tirer') {
            this.loftPreset = LOFT_TIR;
            this._highlightOpponentBalls();
            this.engine._showMessage('Visez une boule adverse !');
            this.engine.aimingEnabled = true;
        } else {
            this._showLoftChoice();
        }
    }

    // --- LOFT SELECTION ---

    _showLoftChoice() {
        this._clearLoftUI();
        this.engine.aimingEnabled = false;

        const cx = this.scene.scale.width / 2;
        const baseY = this.scene.scale.height - 72;

        const bg = this.scene.add.graphics().setDepth(95);
        bg.fillStyle(0x3A2E28, 0.9);
        bg.fillRoundedRect(cx - 240, baseY - 16, 480, 60, 8);
        bg.lineStyle(2, 0xD4A574, 0.5);
        bg.strokeRoundedRect(cx - 240, baseY - 16, 480, 60, 8);
        this._loftUI.push(bg);

        this._loftBtns = [];
        const labels = LOFT_PRESETS.map(p => p.label);
        const offsets = [-150, 0, 150];

        for (let i = 0; i < 3; i++) {
            const btn = this.scene.add.text(
                cx + offsets[i], baseY + 12,
                labels[i], {
                    fontFamily: 'monospace', fontSize: '18px',
                    color: '#F5E6D0', backgroundColor: '#4A3E28',
                    padding: { x: 12, y: 6 }, shadow: SHADOW
                }
            ).setOrigin(0.5).setDepth(96).setInteractive({ useHandCursor: true });
            this._loftUI.push(btn);
            this._loftBtns.push(btn);

            const idx = i;
            btn.on('pointerdown', (pointer) => {
                pointer.event.stopPropagation();
                this._selectLoft(idx);
            });
        }

        // Keyboard: 1/2/3 or UP/DOWN
        this._key1 = this.scene.input.keyboard.addKey('ONE');
        this._key2 = this.scene.input.keyboard.addKey('TWO');
        this._key3 = this.scene.input.keyboard.addKey('THREE');
        this._keyUp = this.scene.input.keyboard.addKey('UP');
        this._keyDown = this.scene.input.keyboard.addKey('DOWN');

        this._updateLoftHighlight();
    }

    _updateLoftHighlight() {
        if (!this._loftBtns) return;
        for (let i = 0; i < this._loftBtns.length; i++) {
            if (i === this.loftIndex) {
                this._loftBtns[i].setStyle({ backgroundColor: '#6B5A40', color: '#FFD700' });
            } else {
                this._loftBtns[i].setStyle({ backgroundColor: '#4A3E28', color: '#F5E6D0' });
            }
        }
    }

    _selectLoft(index) {
        this.loftIndex = index;
        this.loftPreset = LOFT_PRESETS[index];
        this._clearLoftUI();
        this.engine._showMessage(`${this.loftPreset.label} - Visez pres du cochonnet !`);
        this.engine.aimingEnabled = true;
    }

    _clearLoftUI() {
        this._loftUI.forEach(e => e.destroy());
        this._loftUI = [];
        this._loftBtns = null;
        // Clean up loft keyboard listeners
        if (this._keyUp) { this._keyUp.destroy(); this._keyUp = null; }
        if (this._keyDown) { this._keyDown.destroy(); this._keyDown = null; }
    }

    // --- TARGET HIGHLIGHTS ---

    _highlightOpponentBalls() {
        this._clearTargetHighlights();
        this._targetHighlights = this.scene.add.graphics().setDepth(15);

        const opponentBalls = this.engine.getTeamBallsAlive('opponent');
        for (const ball of opponentBalls) {
            this._targetHighlights.lineStyle(2, 0xFFD700, 0.8);
            this._targetHighlights.strokeCircle(ball.x, ball.y, ball.radius + 8);
            this._targetHighlights.lineStyle(2, 0xFFD700, 0.4);
            this._targetHighlights.beginPath();
            this._targetHighlights.moveTo(ball.x - 12, ball.y);
            this._targetHighlights.lineTo(ball.x + 12, ball.y);
            this._targetHighlights.moveTo(ball.x, ball.y - 12);
            this._targetHighlights.lineTo(ball.x, ball.y + 12);
            this._targetHighlights.strokePath();
        }
    }

    _clearTargetHighlights() {
        if (this._targetHighlights) {
            this._targetHighlights.destroy();
            this._targetHighlights = null;
        }
    }

    _clearModeUI() {
        this._modeUI.forEach(e => e.destroy());
        this._modeUI = [];
        this._combinedBtns = null;
        this._pointerBtn = null;
        this._tirerBtn = null;
        // Clean up keyboard listeners to prevent memory leak
        if (this._keyLeft) { this._keyLeft.destroy(); this._keyLeft = null; }
        if (this._keyRight) { this._keyRight.destroy(); this._keyRight = null; }
        if (this._keySpace) { this._keySpace.destroy(); this._keySpace = null; }
        if (this._key1) { this._key1.destroy(); this._key1 = null; }
        if (this._key2) { this._key2.destroy(); this._key2 = null; }
        if (this._key3) { this._key3.destroy(); this._key3 = null; }
        if (this._keyT) { this._keyT.destroy(); this._keyT = null; }
        if (this._key4) { this._key4.destroy(); this._key4 = null; }
        if (this._key6) { this._key6.destroy(); this._key6 = null; }
        // Also clean Focus/Ability/Cochonnet/Spin/Retro/TirDevant UI
        this._clearFocusUI();
        this._clearAbilityUI();
        this._clearCochonnetUI();
        this._clearSpinLateralUI();
        this._clearRetroUI();
        this._clearTirDevantUI();
    }

    // --- POINTER EVENTS ---

    onPointerDown(pointer) {
        if (!this.engine.aimingEnabled) return;
        if (this._modeUI.length > 0 || this._loftUI.length > 0) return;

        if (IS_MOBILE) {
            // Sur mobile : attendre 5px de mouvement avant de confirmer le drag
            // Evite les faux triggers dus aux micro-dérives du doigt au toucher
            this._dragPendingX = pointer.x;
            this._dragPendingY = pointer.y;
            this._dragPending = true;
        } else {
            this.isDragging = true;
            this.startX = pointer.x;
            this.startY = pointer.y;
            this.currentX = pointer.x;
            this.currentY = pointer.y;
        }
    }

    onPointerMove(pointer) {
        if (IS_MOBILE && this._dragPending) {
            const ddx = pointer.x - this._dragPendingX;
            const ddy = pointer.y - this._dragPendingY;
            if (Math.sqrt(ddx * ddx + ddy * ddy) >= 5) {
                // Seuil atteint : confirmer le drag depuis le point d'origine
                this.isDragging = true;
                this.startX = this._dragPendingX;
                this.startY = this._dragPendingY;
                this.currentX = pointer.x;
                this.currentY = pointer.y;
                this._dragPending = false;
            }
        }
        if (!this.isDragging) return;
        this.currentX = pointer.x;
        this.currentY = pointer.y;
    }

    onPointerUp() {
        this._dragPending = false;
        if (!this.isDragging) return;
        this.isDragging = false;
        this.arrowGfx.clear();
        this._predictionGfx.clear();
        if (this._powerText) { this._powerText.destroy(); this._powerText = null; }

        const dx = this.startX - this.currentX;
        const dy = this.startY - this.currentY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < DEAD_ZONE_PX) return;

        let angle = Math.atan2(dy, dx);
        // Quadratic power curve: more control at low power, realistic feel
        const rawPower = Math.min(dist / 150, 1);
        let power = rawPower * rawPower;

        // Precision wobble: the marker was oscillating during aim — use its current offset
        // This replaces invisible random dispersion with visible, skill-based timing
        const wobbleAngleOffset = Math.atan2(this._wobbleOffset.y, this._wobbleOffset.x + 100) -
            Math.atan2(0, 100);
        angle += wobbleAngleOffset;

        // Small power wobble proportional to precision
        const loft = this.shotMode === 'tirer' ? LOFT_TIR : this.loftPreset;
        const techniquePenalty = loft?.precisionPenalty || 0;
        const wobbleMag = Math.sqrt(this._wobbleOffset.x ** 2 + this._wobbleOffset.y ** 2);
        const maxWobble = this._getWobbleAmplitude();
        const powerWobble = maxWobble > 0 ? (wobbleMag / maxWobble) * 0.03 * (1 + techniquePenalty * 0.3) : 0;
        power = Phaser.Math.Clamp(power + (Math.sin(this._aimTime * 2.3) * powerWobble), 0.01, 1);

        // Apply pressure tremble offset to angle (additive on top of wobble)
        angle += this._trembleOffset.x * 0.002;

        this.engine.aimingEnabled = false;
        this._clearTargetHighlights();
        this._clearRetroUI();
        // Cochonnet uses linear power for full range control (6-10m)
        // Boules use quadratic for precision at low power
        const isCochonnet = this.engine.state === 'COCHONNET_THROW';
        this._executeThrow(angle, isCochonnet ? rawPower : power);
    }

    _executeThrow(angle, power) {
        const state = this.engine.state;

        if (state === 'COCHONNET_THROW') {
            this.engine.throwCochonnet(angle, power);
        } else {
            // In local multiplayer, use the current team (could be 'opponent')
            const team = this.engine.currentTeam || 'player';
            // Retro intensity scales with effet stat (effet 1 = 10%, effet 10 = 100%)
            const effetStat = this.charStats.effet || 6;
            const retroIntensity = this.retroActive ? (0.1 + (effetStat - 1) / 9 * 0.9) : 0;

            let finalPower = power;

            // === Apply unique ability effects ===
            if (this.isAbilityActive('coup_de_canon')) {
                // La Choupe: +30% power
                finalPower = Math.min(finalPower * 1.3, 1.0);
            }

            // Pass ability flags to engine for collision-time effects
            const throwMeta = {
                carreauInstinct: this.isAbilityActive('carreau_instinct'),
                leMur: this.isAbilityActive('le_mur'),
                lectureTerrainActive: this.isAbilityActive('lecture_terrain'),
                targetCochonnet: this._targetCochonnet,
                lateralSpin: this._lateralSpin,
                effetStat: this.charStats.effet || 6,
            };

            this.engine.throwBall(angle, finalPower, team, this.shotMode || 'pointer', this.loftPreset, retroIntensity, throwMeta);
        }

        // Reset per-throw flags
        this._focusActive = false;
        this._abilityActive = false;
        this.retroActive = false;
        this._targetCochonnet = false;
        this._lateralSpin = 0;
    }

    cancel() {
        this.isDragging = false;
        this.arrowGfx.clear();
        this._predictionGfx.clear();
        if (this._powerText) { this._powerText.destroy(); this._powerText = null; }
    }

    // --- PRECISION WOBBLE ---
    // Landing marker oscillates in a Lissajous pattern based on precision stat
    // Low precision = big amplitude + fast movement. High precision = tiny + slow.
    _getWobbleAmplitude() {
        const precision = this.charStats.precision || 6;
        const loft = this.shotMode === 'tirer' ? LOFT_TIR : this.loftPreset;
        const techniquePenalty = loft?.precisionPenalty || 0;
        // Precision 10 = 2px wobble, Precision 1 = 18px wobble
        // Technique penalty adds more (plombee +3 = extra 6px)
        let base = 2 + (10 - precision) * 1.8 + techniquePenalty * 2;
        // Coup de Canon: +20% wobble (precision penalty)
        if (this.isAbilityActive('coup_de_canon')) base *= 1.2;
        // Le Naturel: nearly zero wobble for this throw
        if (this.isAbilityActive('naturel') || this._secondaryActive && this._secondaryDef?.id === 'naturel') {
            base *= 0.05;
        }
        // Determination passive: 80% wobble reduction after losing a mene
        if (this._determinationActive) {
            base *= 0.2;
        }
        return base * this._getFocusMultiplier();
    }

    _getWobbleSpeed() {
        const precision = this.charStats.precision || 6;
        // Precision 10 = slow (1.2 Hz), Precision 1 = fast (3.5 Hz)
        const base = 1.2 + (10 - precision) * 0.26;
        return base * this._getFocusMultiplier();
    }

    _updateWobble() {
        if (!this.isDragging) {
            this._aimTime = 0;
            this._wobbleOffset = { x: 0, y: 0 };
            return;
        }
        this._aimTime += 0.016; // ~60fps

        const amp = this._getWobbleAmplitude();
        const speed = this._getWobbleSpeed();
        const t = this._aimTime * speed * Math.PI * 2;

        // Lissajous figure-8 pattern (more natural than a circle)
        this._wobbleOffset.x = Math.sin(t) * amp;
        this._wobbleOffset.y = Math.sin(t * 1.7 + 0.5) * amp * 0.6;

        // Pressure tremble adds on top
        this._wobbleOffset.x += this._trembleOffset.x;
        this._wobbleOffset.y += this._trembleOffset.y;
    }

    // --- PRESSURE TREMBLE ---
    // When both scores >= 10, the aiming arrow trembles.
    // Sang-froid stat reduces the effect (10 = almost no tremble, 1 = max tremble)
    _updatePressureTremble() {
        // Vieux Renard (Marcel): completely cancels pressure tremble
        if (this.isAbilityActive('vieux_renard')) {
            this._trembleOffset.x = 0;
            this._trembleOffset.y = 0;
            return;
        }

        const scores = this.engine.scores;
        const threshold = 10;
        if (scores.player >= threshold && scores.opponent >= threshold) {
            // Both at 10+ : pressure is ON
            const baseAmplitude = 8; // max tremble in pixels
            const frequency = 3.5;
            // Sang-froid reduces amplitude: sf=10 -> 30% of base, sf=1 -> 100% of base
            const sangFroidReduction = 1 - (this.charStats.sang_froid - 1) / 9 * 0.7;
            const amplitude = baseAmplitude * sangFroidReduction * this._getFocusMultiplier();

            this._trembleTime += 0.016; // ~60fps
            this._trembleOffset.x = Math.sin(this._trembleTime * frequency * Math.PI * 2) * amplitude;
            this._trembleOffset.y = Math.cos(this._trembleTime * frequency * Math.PI * 2 * 0.7) * amplitude * 0.5;
        } else {
            this._trembleOffset.x = 0;
            this._trembleOffset.y = 0;
            this._trembleTime = 0;
        }
    }

    // --- UPDATE LOOP ---

    update() {
        // Safety: hide shot buttons if it's not a human player's turn
        const isHumanTurn = this.engine.currentTeam === 'player' || this.scene.localMultiplayer;
        if (!isHumanTurn && this._combinedBtns) {
            this._clearModeUI();
            this._clearLoftUI();
        }

        // Handle keyboard for combined mode+loft selection (grille 2x3)
        if (this._modeUI.length > 0 && this._combinedBtns) {
            if (this._keyLeft && Phaser.Input.Keyboard.JustDown(this._keyLeft)) {
                // Navigation dans la rangee courante
                const row = this._combinedSelected < 3 ? 0 : 1;
                const col = this._combinedSelected % 3;
                const newCol = Math.max(0, col - 1);
                this._combinedSelected = row * 3 + newCol;
                this._updateCombinedHighlight();
            }
            if (this._keyRight && Phaser.Input.Keyboard.JustDown(this._keyRight)) {
                const row = this._combinedSelected < 3 ? 0 : 1;
                const col = this._combinedSelected % 3;
                const newCol = Math.min(2, col + 1);
                this._combinedSelected = row * 3 + newCol;
                this._updateCombinedHighlight();
            }
            if (this._keySpace && Phaser.Input.Keyboard.JustDown(this._keySpace)) {
                this._selectCombined(this._combinedSelected);
            }
            // Pointer row shortcuts
            if (this._key1 && Phaser.Input.Keyboard.JustDown(this._key1)) {
                this._selectCombined(0); return;
            }
            if (this._key2 && Phaser.Input.Keyboard.JustDown(this._key2)) {
                this._selectCombined(1); return;
            }
            if (this._key3 && Phaser.Input.Keyboard.JustDown(this._key3)) {
                this._selectCombined(2); return;
            }
            // Tirer row shortcuts
            if (this._key4 && Phaser.Input.Keyboard.JustDown(this._key4)) {
                this._selectCombined(3); return; // Rafle
            }
            if (this._keyT && Phaser.Input.Keyboard.JustDown(this._keyT)) {
                this._selectCombined(4); return; // Tir au Fer
            }
            if (this._key6 && Phaser.Input.Keyboard.JustDown(this._key6)) {
                this._selectCombined(5); return; // Tir Devant
            }
            return;
        }

        // Handle keyboard for loft selection (when no opponent balls)
        if (this._loftUI.length > 0) {
            if (this._key1 && Phaser.Input.Keyboard.JustDown(this._key1)) {
                this._selectLoft(0); return;
            }
            if (this._key2 && Phaser.Input.Keyboard.JustDown(this._key2)) {
                this._selectLoft(1); return;
            }
            if (this._key3 && Phaser.Input.Keyboard.JustDown(this._key3)) {
                this._selectLoft(2); return;
            }
            if (!this._keyUp) this._keyUp = this.scene.input.keyboard.addKey('UP');
            if (!this._keyDown) this._keyDown = this.scene.input.keyboard.addKey('DOWN');
            if (Phaser.Input.Keyboard.JustDown(this._keyUp)) {
                this.loftIndex = Math.max(0, this.loftIndex - 1);
                this._updateLoftHighlight();
            }
            if (Phaser.Input.Keyboard.JustDown(this._keyDown)) {
                this.loftIndex = Math.min(2, this.loftIndex + 1);
                this._updateLoftHighlight();
            }
            if (this._keySpace && Phaser.Input.Keyboard.JustDown(this._keySpace)) {
                this._selectLoft(this.loftIndex);
            }
            return;
        }

        // Handle retro toggle [R] during aiming phase
        if (this._keyR && Phaser.Input.Keyboard.JustDown(this._keyR)) {
            this._toggleRetro();
        }

        // Update pressure tremble + precision wobble
        this._updatePressureTremble();
        this._updateWobble();

        // Draw aiming arrow + prediction
        this.arrowGfx.clear();
        this._predictionGfx.clear();

        if (!this.isDragging || !this.engine.aimingEnabled) {
            if (this._powerText) { this._powerText.destroy(); this._powerText = null; }
            return;
        }

        const dx = this.startX - this.currentX;
        const dy = this.startY - this.currentY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < DEAD_ZONE_PX) return;

        // Quadratic power curve (same as onPointerUp)
        const rawPower = Math.min(dist / 150, 1);
        const power = rawPower * rawPower;
        const angle = Math.atan2(dy, dx);

        // Arrow color based on mode
        let color;
        if (this.shotMode === 'tirer') {
            color = power < 0.5 ? 0xDD8844 : 0xCC4444;
        } else {
            if (power < 0.33) color = 0x44CC44;
            else if (power < 0.66) color = 0xCCCC44;
            else color = 0xCC4444;
        }

        // Draw arrow (with wobble applied to endpoint — arrow moves with marker)
        const originX = this.scene.throwCircleX;
        const originY = this.scene.throwCircleY;
        const arrowLen = power * 80;
        const endX = originX + Math.cos(angle) * arrowLen + this._wobbleOffset.x * 0.5;
        const endY = originY + Math.sin(angle) * arrowLen + this._wobbleOffset.y * 0.5;

        const lineWidth = this.shotMode === 'tirer' ? 5 : 3;
        this.arrowGfx.lineStyle(lineWidth, color, 0.8);
        this.arrowGfx.beginPath();
        this.arrowGfx.moveTo(originX, originY);
        this.arrowGfx.lineTo(endX, endY);
        this.arrowGfx.strokePath();

        // Arrowhead
        const headLen = 10;
        const headAngle = 0.5;
        this.arrowGfx.beginPath();
        this.arrowGfx.moveTo(endX, endY);
        this.arrowGfx.lineTo(
            endX - Math.cos(angle - headAngle) * headLen,
            endY - Math.sin(angle - headAngle) * headLen
        );
        this.arrowGfx.moveTo(endX, endY);
        this.arrowGfx.lineTo(
            endX - Math.cos(angle + headAngle) * headLen,
            endY - Math.sin(angle + headAngle) * headLen
        );
        this.arrowGfx.strokePath();

        // Landing point marker
        const isCochonnetThrow = this.engine.state === 'COCHONNET_THROW';
        let markerX, markerY;

        if (isCochonnetThrow) {
            // Cochonnet: linear power, simple distance calc
            const cochDist = COCHONNET_MIN_DIST + rawPower * (COCHONNET_MAX_DIST - COCHONNET_MIN_DIST);
            const margin = 20;
            const bx = this.engine.bounds.x, by = this.engine.bounds.y;
            const bw = this.engine.bounds.w, bh = this.engine.bounds.h;
            markerX = Math.max(bx + margin, Math.min(bx + bw - margin, originX + Math.cos(angle) * cochDist));
            markerY = Math.max(by + margin, Math.min(by + bh - margin, originY + Math.sin(angle) * cochDist));
        } else {
            const loft = this.shotMode === 'tirer' ? LOFT_TIR : this.loftPreset;
            const puissance = this.charStats.puissance || 6;
            const params = PetanqueEngine.computeThrowParams(
                angle, power, originX, originY, this.engine.bounds, loft, this.engine.frictionMult, puissance
            );
            markerX = params.targetX;
            markerY = params.targetY;
        }

        // Apply precision wobble to landing marker
        const wobX = markerX + this._wobbleOffset.x;
        const wobY = markerY + this._wobbleOffset.y;

        // Show wobble range circle (ghosted, shows precision zone)
        const wobAmp = this._getWobbleAmplitude();
        if (wobAmp > 3) {
            this._predictionGfx.lineStyle(0.8, color, 0.15);
            this._predictionGfx.strokeCircle(markerX, markerY, wobAmp);
        }

        // Show landing marker (cross) — oscillates with precision wobble
        // Sur mobile : cercle +20% pour meilleure lisibilite (5 → 6)
        const markerRadius = IS_MOBILE ? 6 : 5;
        this._predictionGfx.lineStyle(1.5, color, 0.6);
        this._predictionGfx.strokeCircle(wobX, wobY, markerRadius);
        this._predictionGfx.beginPath();
        this._predictionGfx.moveTo(wobX - 4, wobY);
        this._predictionGfx.lineTo(wobX + 4, wobY);
        this._predictionGfx.moveTo(wobX, wobY - 4);
        this._predictionGfx.lineTo(wobX, wobY + 4);
        this._predictionGfx.strokePath();

        // Retro indicator on arrow: small arc near tip
        if (this.retroActive) {
            const retroColor = 0x9B7BB8;
            this.arrowGfx.lineStyle(1.5, retroColor, 0.7);
            const rr = 5;
            for (let a = 0; a < Math.PI * 1.5; a += 0.3) {
                const rx = endX + Math.cos(a + angle) * rr * (1 + a * 0.15);
                const ry = endY + Math.sin(a + angle) * rr * (1 + a * 0.15);
                if (a === 0) this.arrowGfx.moveTo(rx, ry);
                else this.arrowGfx.lineTo(rx, ry);
            }
            this.arrowGfx.strokePath();
        }

        // Power text — show raw % (what the player feels) not the quadratic value
        if (this._powerText) this._powerText.destroy();
        if (this._powerBarImg) this._powerBarImg.destroy();
        if (this._powerBarFill) this._powerBarFill.destroy();
        const modeLabel = isCochonnetThrow ? 'COCHONNET'
            : this.shotMode === 'tirer' ? 'TIR'
            : this.loftPreset?.label || 'DEMI-PORTEE';
        const retroSuffix = this.retroActive ? ' +R' : '';

        // v2_bar_power visual gauge behind text
        const barW = 120;
        const barH = 14;
        const barX = originX;
        const barY = originY + 46;
        if (this.scene.textures.exists('v2_bar_power')) {
            this._powerBarImg = this.scene.add.image(barX, barY, 'v2_bar_power')
                .setDisplaySize(140, 40).setOrigin(0.5).setDepth(50).setAlpha(0.85);
            // Fill overlay (colored rectangle clipped to bar width)
            this._powerBarFill = this.scene.add.graphics().setDepth(50);
            const fillColor = this.retroActive ? 0x9B7BB8
                : this.shotMode === 'tirer' ? 0xFF8844 : 0xD4A574;
            const fillW = rawPower * (barW - 4);
            this._powerBarFill.fillStyle(fillColor, 0.8);
            this._powerBarFill.fillRoundedRect(barX - barW / 2 + 2, barY - barH / 2 + 1, fillW, barH - 2, 2);
            this._powerBarFill.fillStyle(0xFFFFFF, 0.15);
            this._powerBarFill.fillRoundedRect(barX - barW / 2 + 2, barY - barH / 2 + 1, fillW, (barH - 2) / 2, 2);
        } else {
            this._powerBarImg = null;
            this._powerBarFill = null;
        }

        this._powerText = this.scene.add.text(
            originX, originY + 28,
            `${modeLabel} ${Math.round(rawPower * 100)}%${retroSuffix}`,
            {
                fontFamily: 'monospace', fontSize: '20px',
                color: this.retroActive ? '#9B7BB8'
                    : this.shotMode === 'tirer' ? '#FF8844' : '#F5E6D0',
                shadow: SHADOW
            }
        ).setOrigin(0.5).setDepth(51);
    }

    destroy() {
        this.scene.input.off('pointerdown', this.onPointerDown, this);
        this.scene.input.off('pointermove', this.onPointerMove, this);
        this.scene.input.off('pointerup', this.onPointerUp, this);
        this.arrowGfx.destroy();
        this._predictionGfx.destroy();
        this._clearModeUI();
        this._clearLoftUI();
        this._clearTargetHighlights();
        this._clearRetroUI();
        if (this._powerText) this._powerText.destroy();
        if (this._powerBarImg) this._powerBarImg.destroy();
        if (this._powerBarFill) this._powerBarFill.destroy();
    }
}
