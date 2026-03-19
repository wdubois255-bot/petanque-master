import Phaser from 'phaser';
import {
    DEAD_ZONE_PX,
    LOFT_PRESETS, LOFT_DEMI_PORTEE, LOFT_TIR, LOFT_TIR_DEVANT,
    COCHONNET_MIN_DIST, COCHONNET_MAX_DIST
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

        // === FOCUS (Respire) system: reduces wobble by 80% for one throw ===
        this._focusCharges = 5;           // charges per match
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

        const cx = this.scene.scale.width / 2;
        const baseY = this.scene.scale.height - 52;

        // Slim background panel
        const panelW = 520, panelH = 56;
        const bg = this.scene.add.graphics().setDepth(95);
        bg.fillStyle(0x3A2E28, 0.88);
        bg.fillRoundedRect(cx - panelW / 2, baseY - panelH / 2, panelW, panelH, 6);
        bg.lineStyle(1, 0xD4A574, 0.35);
        bg.strokeRoundedRect(cx - panelW / 2, baseY - panelH / 2, panelW, panelH, 6);
        this._modeUI.push(bg);

        // Options with mini arc data (arcPts for visual curve)
        const allOptions = [
            { label: '1', sublabel: 'Roulette', mode: 'pointer', loft: 0, color: 0x87CEEB, arcH: 0.08 },
            { label: '2', sublabel: 'Demi-portee', mode: 'pointer', loft: 1, color: 0x6B8E4E, arcH: 0.35 },
            { label: '3', sublabel: 'Plombee', mode: 'pointer', loft: 2, color: 0x9B7BB8, arcH: 0.75 },
            { label: 'T', sublabel: 'Tirer', mode: 'tirer', loft: -1, color: 0xC44B3F, arcH: 0.55 }
        ];
        const spacing = 120;
        const startX = cx - (allOptions.length - 1) * spacing / 2;

        this._combinedBtns = [];
        this._combinedGfx = [];
        this._combinedSelected = 1; // default demi-portee

        for (let i = 0; i < allOptions.length; i++) {
            const opt = allOptions[i];
            const ox = startX + i * spacing;

            // Mini trajectory arc icon
            const arcGfx = this.scene.add.graphics().setDepth(97);
            this._drawMiniArc(arcGfx, ox, baseY - 10, opt.arcH, opt.color, false);
            this._modeUI.push(arcGfx);
            this._combinedGfx.push(arcGfx);

            // Key hint + label
            const label = this.scene.add.text(ox, baseY + 12, `[${opt.label}] ${opt.sublabel}`, {
                fontFamily: 'monospace', fontSize: '11px',
                color: '#' + opt.color.toString(16).padStart(6, '0'),
                shadow: SHADOW
            }).setOrigin(0.5).setDepth(97).setAlpha(0.85);
            this._modeUI.push(label);

            // Invisible hit area
            const hitZone = this.scene.add.zone(ox, baseY, spacing - 8, panelH)
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

        this._allOptions = allOptions;
        this._updateCombinedHighlight();

        // === FOCUS indicator (top of panel) ===
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
            label.setFontSize(selected ? '12px' : '11px');
            this._drawMiniArc(arcGfx, label.x, label.y - 22, opt.arcH, opt.color, selected);
        }
    }

    _selectCombined(index) {
        sfxUIClick();
        const opt = this._allOptions[index];
        this._clearModeUI();

        if (opt.mode === 'tirer') {
            this.shotMode = 'tirer';
            this._tirDevant = false;
            this.loftPreset = LOFT_TIR;
            this._highlightOpponentBalls();
            this._showRetroToggle();
            this._showTirDevantToggle();
            this.engine._showMessage('Visez une boule adverse ! [D] Tir Devant');
        } else {
            this.shotMode = 'pointer';
            this.loftIndex = opt.loft;
            this.loftPreset = LOFT_PRESETS[opt.loft];
            if (this.loftPreset.retroAllowed) this._showRetroToggle();
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
        this._keyR = null;
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
        this._keyD = null;
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
        const baseY = this.scene.scale.height - 52 - 28 - 22;
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
        // Also clean Focus/Ability UI (they're in _modeUI but keys need explicit cleanup)
        this._clearFocusUI();
        this._clearAbilityUI();
    }

    // --- POINTER EVENTS ---

    onPointerDown(pointer) {
        if (!this.engine.aimingEnabled) return;
        if (this._modeUI.length > 0 || this._loftUI.length > 0) return;

        this.isDragging = true;
        this.startX = pointer.x;
        this.startY = pointer.y;
        this.currentX = pointer.x;
        this.currentY = pointer.y;
    }

    onPointerMove(pointer) {
        if (!this.isDragging) return;
        this.currentX = pointer.x;
        this.currentY = pointer.y;
    }

    onPointerUp() {
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
            };

            this.engine.throwBall(angle, finalPower, team, this.shotMode || 'pointer', this.loftPreset, retroIntensity, throwMeta);
        }

        // Reset per-throw flags
        this._focusActive = false;
        this._abilityActive = false;
        this.retroActive = false;
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

        // Handle keyboard for combined mode+loft selection
        if (this._modeUI.length > 0 && this._combinedBtns) {
            if (this._keyLeft && Phaser.Input.Keyboard.JustDown(this._keyLeft)) {
                this._combinedSelected = Math.max(0, this._combinedSelected - 1);
                this._updateCombinedHighlight();
            }
            if (this._keyRight && Phaser.Input.Keyboard.JustDown(this._keyRight)) {
                this._combinedSelected = Math.min(3, this._combinedSelected + 1);
                this._updateCombinedHighlight();
            }
            if (this._keySpace && Phaser.Input.Keyboard.JustDown(this._keySpace)) {
                this._selectCombined(this._combinedSelected);
            }
            if (this._key1 && Phaser.Input.Keyboard.JustDown(this._key1)) {
                this._selectCombined(0); return;
            }
            if (this._key2 && Phaser.Input.Keyboard.JustDown(this._key2)) {
                this._selectCombined(1); return;
            }
            if (this._key3 && Phaser.Input.Keyboard.JustDown(this._key3)) {
                this._selectCombined(2); return;
            }
            if (this._keyT && Phaser.Input.Keyboard.JustDown(this._keyT)) {
                this._selectCombined(3); return;
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

        // Handle tir devant toggle [D] during tir mode
        if (this._keyD && Phaser.Input.Keyboard.JustDown(this._keyD) && this.shotMode === 'tirer') {
            this._toggleTirDevant();
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
        this._predictionGfx.lineStyle(1.5, color, 0.6);
        this._predictionGfx.strokeCircle(wobX, wobY, 5);
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
        const modeLabel = isCochonnetThrow ? 'COCHONNET'
            : this.shotMode === 'tirer' ? 'TIR'
            : this.loftPreset?.label || 'DEMI-PORTEE';
        const retroSuffix = this.retroActive ? ' +R' : '';
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
    }
}
