import Phaser from 'phaser';
import {
    DEAD_ZONE_PX,
    LOFT_PRESETS, LOFT_DEMI_PORTEE, LOFT_TIR,
    COCHONNET_MIN_DIST, COCHONNET_MAX_DIST
} from '../utils/Constants.js';
import PetanqueEngine from './PetanqueEngine.js';
import { sfxUIClick } from '../utils/SoundManager.js';

const SHADOW = { offsetX: 2, offsetY: 2, color: '#1A1510', blur: 0, fill: true };

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
            } else if (state === 'WAITING_STOP' || state === 'SCORE_MENE' || state === 'GAME_OVER') {
                this._clearModeUI();
                this._clearLoftUI();
                this._clearRetroUI();
            }
        };

        // Listen to turn changes for shot mode selection
        // This fires AFTER currentTeam is correctly set
        const existingTurnChange = this.engine.onTurnChange;
        this.engine.onTurnChange = (team) => {
            if (existingTurnChange) existingTurnChange(team);
            this._onTurnChange(team);
        };
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
            this.loftPreset = LOFT_TIR;
            this._highlightOpponentBalls();
            this._showRetroToggle();
            this.engine._showMessage('Visez une boule adverse !');
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

        // Apply precision dispersion: lower precision = more random deviation
        // Precision 10 = 0 deg deviation, Precision 1 = ~6 deg deviation
        // Technique penalty: plombee +2 deg, tir +1 deg (harder techniques)
        const loft = this.shotMode === 'tirer' ? LOFT_TIR : this.loftPreset;
        const techniquePenalty = loft?.precisionPenalty || 0;
        const precisionDev = (10 - this.charStats.precision) * 0.7 + techniquePenalty;
        angle += (Math.random() - 0.5) * 2 * precisionDev * Math.PI / 180;
        const powerDev = (10 - this.charStats.precision) * 0.01 + techniquePenalty * 0.005;
        power = Phaser.Math.Clamp(power + (Math.random() - 0.5) * 2 * powerDev, 0.01, 1);

        // Apply pressure tremble offset to angle
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
            this.engine.throwBall(angle, power, team, this.shotMode || 'pointer', this.loftPreset, retroIntensity);
        }
        this.retroActive = false;
    }

    cancel() {
        this.isDragging = false;
        this.arrowGfx.clear();
        this._predictionGfx.clear();
        if (this._powerText) { this._powerText.destroy(); this._powerText = null; }
    }

    // --- PRESSURE TREMBLE ---
    // When both scores >= 10, the aiming arrow trembles.
    // Sang-froid stat reduces the effect (10 = almost no tremble, 1 = max tremble)
    _updatePressureTremble() {
        const scores = this.engine.scores;
        const threshold = 10;
        if (scores.player >= threshold && scores.opponent >= threshold) {
            // Both at 10+ : pressure is ON
            const baseAmplitude = 8; // max tremble in pixels
            const frequency = 3.5;
            // Sang-froid reduces amplitude: sf=10 -> 30% of base, sf=1 -> 100% of base
            const sangFroidReduction = 1 - (this.charStats.sang_froid - 1) / 9 * 0.7;
            const amplitude = baseAmplitude * sangFroidReduction;

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
            const keyUp = this.scene.input.keyboard.addKey('UP');
            const keyDown = this.scene.input.keyboard.addKey('DOWN');
            if (Phaser.Input.Keyboard.JustDown(keyUp)) {
                this.loftIndex = Math.max(0, this.loftIndex - 1);
                this._updateLoftHighlight();
            }
            if (Phaser.Input.Keyboard.JustDown(keyDown)) {
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

        // Update pressure tremble
        this._updatePressureTremble();

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

        // Draw arrow (with pressure tremble applied to endpoint)
        const originX = this.scene.throwCircleX;
        const originY = this.scene.throwCircleY;
        const arrowLen = power * 80;
        const endX = originX + Math.cos(angle) * arrowLen + this._trembleOffset.x;
        const endY = originY + Math.sin(angle) * arrowLen + this._trembleOffset.y;

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

        // Show landing marker (cross) — no trajectory, the rest is skill
        this._predictionGfx.lineStyle(1.5, color, 0.5);
        this._predictionGfx.strokeCircle(markerX, markerY, 6);
        this._predictionGfx.beginPath();
        this._predictionGfx.moveTo(markerX - 4, markerY);
        this._predictionGfx.lineTo(markerX + 4, markerY);
        this._predictionGfx.moveTo(markerX, markerY - 4);
        this._predictionGfx.lineTo(markerX, markerY + 4);
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
