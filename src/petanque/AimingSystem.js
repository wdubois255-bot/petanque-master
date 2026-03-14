import {
    DEAD_ZONE_PX, MAX_THROW_SPEED, COLORS, GAME_WIDTH, GAME_HEIGHT,
    LOFT_PRESETS, LOFT_DEMI_PORTEE, LOFT_TIR, PREDICTION_DOT_RADIUS,
    FRICTION_BASE
} from '../utils/Constants.js';
import PetanqueEngine from './PetanqueEngine.js';
import Ball from './Ball.js';

const SHADOW = { offsetX: 1, offsetY: 1, color: '#1A1510', blur: 0, fill: true };

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

        // Listen to state changes for shot mode selection
        this.engine.onStateChange = (state) => {
            this._onEngineStateChange(state);
        };
    }

    _onEngineStateChange(state) {
        if (state === 'FIRST_BALL' || state === 'PLAY_LOOP') {
            if (this.engine.currentTeam === 'player' && this.engine.remaining.player > 0) {
                const opponentBalls = this.engine.getTeamBallsAlive('opponent');
                if (opponentBalls.length > 0) {
                    this._showShotModeChoice();
                } else {
                    this.shotMode = 'pointer';
                    this._showLoftChoice();
                }
            }
        } else if (state === 'COCHONNET_THROW') {
            this.shotMode = null;
            this._clearModeUI();
            this._clearLoftUI();
        }
    }

    _showShotModeChoice() {
        this._clearModeUI();
        this._clearLoftUI();
        this.engine.aimingEnabled = false;

        const cx = this.scene.scale.width / 2;
        const baseY = this.scene.scale.height - 36;

        const bg = this.scene.add.graphics().setDepth(95);
        bg.fillStyle(0x3A2E28, 0.9);
        bg.fillRoundedRect(cx - 100, baseY - 8, 200, 30, 4);
        bg.lineStyle(1, 0xD4A574, 0.5);
        bg.strokeRoundedRect(cx - 100, baseY - 8, 200, 30, 4);
        this._modeUI.push(bg);

        const pointerBtn = this.scene.add.text(
            cx - 50, baseY + 6,
            'POINTER', {
                fontFamily: 'monospace', fontSize: '11px',
                color: '#A8B5C2', backgroundColor: '#4A3E28',
                padding: { x: 8, y: 4 }, shadow: SHADOW
            }
        ).setOrigin(0.5).setDepth(96).setInteractive({ useHandCursor: true });
        this._modeUI.push(pointerBtn);

        const tirerBtn = this.scene.add.text(
            cx + 50, baseY + 6,
            'TIRER', {
                fontFamily: 'monospace', fontSize: '11px',
                color: '#C44B3F', backgroundColor: '#4A3E28',
                padding: { x: 8, y: 4 }, shadow: SHADOW
            }
        ).setOrigin(0.5).setDepth(96).setInteractive({ useHandCursor: true });
        this._modeUI.push(tirerBtn);

        pointerBtn.on('pointerover', () => pointerBtn.setStyle({ backgroundColor: '#5A4E38' }));
        pointerBtn.on('pointerout', () => pointerBtn.setStyle({ backgroundColor: '#4A3E28' }));
        tirerBtn.on('pointerover', () => tirerBtn.setStyle({ backgroundColor: '#5A4E38' }));
        tirerBtn.on('pointerout', () => tirerBtn.setStyle({ backgroundColor: '#4A3E28' }));

        pointerBtn.on('pointerdown', (pointer) => {
            pointer.event.stopPropagation();
            this._selectShotMode('pointer');
        });
        tirerBtn.on('pointerdown', (pointer) => {
            pointer.event.stopPropagation();
            this._selectShotMode('tirer');
        });

        this._keyP = this.scene.input.keyboard.addKey('P');
        this._keyT = this.scene.input.keyboard.addKey('T');
        this._keyLeft = this.scene.input.keyboard.addKey('LEFT');
        this._keyRight = this.scene.input.keyboard.addKey('RIGHT');
        this._keySpace = this.scene.input.keyboard.addKey('SPACE');
        this._modeSelected = 0;
        this._pointerBtn = pointerBtn;
        this._tirerBtn = tirerBtn;
        this._updateModeHighlight();
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
        const baseY = this.scene.scale.height - 36;

        const bg = this.scene.add.graphics().setDepth(95);
        bg.fillStyle(0x3A2E28, 0.9);
        bg.fillRoundedRect(cx - 120, baseY - 8, 240, 30, 4);
        bg.lineStyle(1, 0xD4A574, 0.5);
        bg.strokeRoundedRect(cx - 120, baseY - 8, 240, 30, 4);
        this._loftUI.push(bg);

        this._loftBtns = [];
        const labels = LOFT_PRESETS.map(p => p.label);
        const offsets = [-75, 0, 75];

        for (let i = 0; i < 3; i++) {
            const btn = this.scene.add.text(
                cx + offsets[i], baseY + 6,
                labels[i], {
                    fontFamily: 'monospace', fontSize: '9px',
                    color: '#F5E6D0', backgroundColor: '#4A3E28',
                    padding: { x: 6, y: 3 }, shadow: SHADOW
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
            this._targetHighlights.lineStyle(1, 0xFFD700, 0.8);
            this._targetHighlights.strokeCircle(ball.x, ball.y, ball.radius + 4);
            this._targetHighlights.lineStyle(1, 0xFFD700, 0.4);
            this._targetHighlights.beginPath();
            this._targetHighlights.moveTo(ball.x - 6, ball.y);
            this._targetHighlights.lineTo(ball.x + 6, ball.y);
            this._targetHighlights.moveTo(ball.x, ball.y - 6);
            this._targetHighlights.lineTo(ball.x, ball.y + 6);
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
        const power = Math.min(dist / 60, 1);

        this.engine.aimingEnabled = false;
        this._clearTargetHighlights();
        this._executeThrow(angle, power);
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
        // Handle keyboard for mode selection
        if (this._modeUI.length > 0) {
            if (this._keyP && Phaser.Input.Keyboard.JustDown(this._keyP)) {
                this._selectShotMode('pointer');
                return;
            }
            if (this._keyT && Phaser.Input.Keyboard.JustDown(this._keyT)) {
                this._selectShotMode('tirer');
                return;
            }
            if (this._keyLeft && Phaser.Input.Keyboard.JustDown(this._keyLeft)) {
                this._modeSelected = 0;
                this._updateModeHighlight();
            }
            if (this._keyRight && Phaser.Input.Keyboard.JustDown(this._keyRight)) {
                this._modeSelected = 1;
                this._updateModeHighlight();
            }
            if (this._keySpace && Phaser.Input.Keyboard.JustDown(this._keySpace)) {
                this._selectShotMode(this._modeSelected === 0 ? 'pointer' : 'tirer');
            }
            return;
        }

        // Handle keyboard for loft selection
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
            if (this._keyUp && Phaser.Input.Keyboard.JustDown(this._keyUp)) {
                this.loftIndex = Math.max(0, this.loftIndex - 1);
                this._updateLoftHighlight();
            }
            if (this._keyDown && Phaser.Input.Keyboard.JustDown(this._keyDown)) {
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

        const power = Math.min(dist / 60, 1);
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
        const arrowLen = power * 40;
        const endX = originX + Math.cos(angle) * arrowLen;
        const endY = originY + Math.sin(angle) * arrowLen;

        const lineWidth = this.shotMode === 'tirer' ? 3 : 2;
        this.arrowGfx.lineStyle(lineWidth, color, 0.8);
        this.arrowGfx.beginPath();
        this.arrowGfx.moveTo(originX, originY);
        this.arrowGfx.lineTo(endX, endY);
        this.arrowGfx.strokePath();

        // Arrowhead
        const headLen = 5;
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

        // Trajectory prediction line
        const loft = this.shotMode === 'tirer' ? LOFT_TIR : this.loftPreset;
        const params = PetanqueEngine.computeThrowParams(
            angle, power, originX, originY, this.engine.bounds, loft, this.engine.frictionMult
        );
        const points = Ball.simulateTrajectory(
            params.targetX, params.targetY,
            params.rollVx, params.rollVy,
            this.engine.frictionMult
        );

        for (let i = 0; i < points.length; i++) {
            const alpha = 0.5 - (i / points.length) * 0.4;
            this._predictionGfx.fillStyle(0xFFFFFF, alpha);
            this._predictionGfx.fillCircle(points[i].x, points[i].y, PREDICTION_DOT_RADIUS);
        }

        // Power text with mode + loft label
        if (this._powerText) this._powerText.destroy();
        const modeLabel = this.shotMode === 'tirer' ? 'TIR' : loft.label;
        this._powerText = this.scene.add.text(
            originX, originY + 14,
            `${modeLabel} ${Math.round(power * 100)}%`,
            {
                fontFamily: 'monospace', fontSize: '10px',
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
