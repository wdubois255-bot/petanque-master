import {
    DEAD_ZONE_PX, MAX_THROW_SPEED, COLORS, GAME_WIDTH, GAME_HEIGHT,
    LOFT_PRESETS, LOFT_DEMI_PORTEE, LOFT_TIR, PREDICTION_DOT_RADIUS,
    FRICTION_BASE, COCHONNET_MIN_DIST, COCHONNET_MAX_DIST
} from '../utils/Constants.js';
import PetanqueEngine from './PetanqueEngine.js';
import Ball from './Ball.js';
import { sfxUIClick } from '../utils/SoundManager.js';

const SHADOW = { offsetX: 2, offsetY: 2, color: '#1A1510', blur: 0, fill: true };

export default class AimingSystem {
    constructor(scene, engine) {
        this.scene = scene;
        this.engine = engine;
        this.isDragging = false;
        this.startX = 0;
        this.startY = 0;
        this.currentX = 0;
        this.currentY = 0;

        // Shot mode: 'pointer' or 'tirer'
        this.shotMode = null;
        this._modeUI = [];
        this._targetHighlights = null;

        // Loft selection (only for pointer mode)
        this.loftIndex = 1; // default = demi-portee (middle)
        this.loftPreset = LOFT_DEMI_PORTEE;
        this._loftUI = [];

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
            } else if (state === 'WAITING_STOP' || state === 'SCORE_MENE' || state === 'GAME_OVER') {
                this._clearModeUI();
                this._clearLoftUI();
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
        // Show shot choice only when it's player's turn to throw a BALL (not cochonnet)
        const state = this.engine.state;
        if (team === 'player' && this.engine.remaining.player > 0 &&
            state !== 'COCHONNET_THROW') {
            this._showShotModeChoice();
        }
    }

    _showShotModeChoice() {
        this._clearModeUI();
        this._clearLoftUI();
        this.engine.aimingEnabled = false;

        // Combined UI: POINTER (with loft sub-options) + TIRER in one panel
        const cx = this.scene.scale.width / 2;
        const baseY = this.scene.scale.height - 80;

        const bg = this.scene.add.graphics().setDepth(95);
        bg.fillStyle(0x3A2E28, 0.92);
        bg.fillRoundedRect(cx - 300, baseY - 20, 600, 80, 8);
        bg.lineStyle(2, 0xD4A574, 0.5);
        bg.strokeRoundedRect(cx - 300, baseY - 20, 600, 80, 8);
        this._modeUI.push(bg);

        // Label
        const label = this.scene.add.text(cx, baseY - 6, 'Choisissez votre lancer', {
            fontFamily: 'monospace', fontSize: '14px', color: '#D4A574', shadow: SHADOW
        }).setOrigin(0.5).setDepth(96);
        this._modeUI.push(label);

        // 4 buttons in one row: ROULETTE | DEMI-PORTEE | PLOMBEE | TIRER
        const allOptions = [
            { label: 'ROULETTE', mode: 'pointer', loft: 0, color: '#A8B5C2' },
            { label: 'DEMI-PORTEE', mode: 'pointer', loft: 1, color: '#A8B5C2' },
            { label: 'PLOMBEE', mode: 'pointer', loft: 2, color: '#A8B5C2' },
            { label: 'TIRER', mode: 'tirer', loft: -1, color: '#C44B3F' }
        ];
        const offsets = [-210, -70, 70, 210];

        this._combinedBtns = [];
        this._combinedSelected = 1; // default demi-portee

        for (let i = 0; i < 4; i++) {
            const opt = allOptions[i];
            const btn = this.scene.add.text(
                cx + offsets[i], baseY + 30,
                opt.label, {
                    fontFamily: 'monospace', fontSize: '16px',
                    color: opt.color, backgroundColor: '#4A3E28',
                    padding: { x: 10, y: 6 }, shadow: SHADOW
                }
            ).setOrigin(0.5).setDepth(96).setInteractive({ useHandCursor: true });
            this._modeUI.push(btn);
            this._combinedBtns.push(btn);

            const idx = i;
            btn.on('pointerdown', (pointer) => {
                pointer.event.stopPropagation();
                this._selectCombined(idx);
            });
            btn.on('pointerover', () => {
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

    _updateCombinedHighlight() {
        if (!this._combinedBtns) return;
        for (let i = 0; i < this._combinedBtns.length; i++) {
            if (i === this._combinedSelected) {
                this._combinedBtns[i].setStyle({ backgroundColor: '#6B5A40', color: '#FFD700' });
            } else {
                const opt = this._allOptions[i];
                this._combinedBtns[i].setStyle({ backgroundColor: '#4A3E28', color: opt.color });
            }
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
            this.engine._showMessage('Visez une boule adverse !');
        } else {
            this.shotMode = 'pointer';
            this.loftIndex = opt.loft;
            this.loftPreset = LOFT_PRESETS[opt.loft];
            this.engine._showMessage(`${this.loftPreset.label} - Visez pres du cochonnet !`);
        }
        this.engine.aimingEnabled = true;
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

        const angle = Math.atan2(dy, dx);
        // Quadratic power curve: more control at low power, realistic feel
        const rawPower = Math.min(dist / 150, 1);
        const power = rawPower * rawPower;

        this.engine.aimingEnabled = false;
        this._clearTargetHighlights();
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
            this.engine.throwBall(angle, power, 'player', this.shotMode || 'pointer', this.loftPreset);
        }
    }

    cancel() {
        this.isDragging = false;
        this.arrowGfx.clear();
        this._predictionGfx.clear();
        if (this._powerText) { this._powerText.destroy(); this._powerText = null; }
    }

    // --- UPDATE LOOP ---

    update() {
        // Safety: hide shot buttons if it's not the player's turn
        if (this.engine.currentTeam !== 'player' && this._combinedBtns) {
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

        // Draw arrow
        const originX = this.scene.throwCircleX;
        const originY = this.scene.throwCircleY;
        const arrowLen = power * 80;
        const endX = originX + Math.cos(angle) * arrowLen;
        const endY = originY + Math.sin(angle) * arrowLen;

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
            markerX = Phaser.Math.Clamp(
                originX + Math.cos(angle) * cochDist,
                this.engine.bounds.x + margin, this.engine.bounds.x + this.engine.bounds.w - margin
            );
            markerY = Phaser.Math.Clamp(
                originY + Math.sin(angle) * cochDist,
                this.engine.bounds.y + margin, this.engine.bounds.y + this.engine.bounds.h - margin
            );
        } else {
            const loft = this.shotMode === 'tirer' ? LOFT_TIR : this.loftPreset;
            const params = PetanqueEngine.computeThrowParams(
                angle, power, originX, originY, this.engine.bounds, loft, this.engine.frictionMult
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

        // Power text — show raw % (what the player feels) not the quadratic value
        if (this._powerText) this._powerText.destroy();
        const modeLabel = isCochonnetThrow ? 'COCHONNET'
            : this.shotMode === 'tirer' ? 'TIR'
            : this.loftPreset?.label || 'DEMI-PORTEE';
        this._powerText = this.scene.add.text(
            originX, originY + 28,
            `${modeLabel} ${Math.round(rawPower * 100)}%`,
            {
                fontFamily: 'monospace', fontSize: '20px',
                color: this.shotMode === 'tirer' ? '#FF8844' : '#F5E6D0',
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
        if (this._powerText) this._powerText.destroy();
    }
}
