import { DEAD_ZONE_PX, MAX_THROW_SPEED, COLORS } from '../utils/Constants.js';

export default class AimingSystem {
    constructor(scene, engine) {
        this.scene = scene;
        this.engine = engine;
        this.isDragging = false;
        this.startX = 0;
        this.startY = 0;
        this.currentX = 0;
        this.currentY = 0;

        this.arrowGfx = scene.add.graphics().setDepth(50);

        // Pointer events
        scene.input.on('pointerdown', this.onPointerDown, this);
        scene.input.on('pointermove', this.onPointerMove, this);
        scene.input.on('pointerup', this.onPointerUp, this);

        // Escape to cancel
        scene.input.keyboard.on('keydown-ESC', () => {
            this.cancel();
        });
    }

    onPointerDown(pointer) {
        if (!this.engine.aimingEnabled) return;

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
        if (this._powerText) { this._powerText.destroy(); this._powerText = null; }

        const dx = this.startX - this.currentX;
        const dy = this.startY - this.currentY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < DEAD_ZONE_PX) return;

        // Slingshot: direction is opposite of drag
        const angle = Math.atan2(dy, dx);
        const power = Math.min(dist / 60, 1);

        this.engine.aimingEnabled = false;
        this._executeThrow(angle, power);
    }

    _executeThrow(angle, power) {
        const state = this.engine.state;

        if (state === 'COCHONNET_THROW') {
            this.engine.throwCochonnet(angle, power);
        } else {
            this.engine.throwBall(angle, power, 'player');
        }
    }

    cancel() {
        this.isDragging = false;
        this.arrowGfx.clear();
        if (this._powerText) { this._powerText.destroy(); this._powerText = null; }
    }

    update() {
        this.arrowGfx.clear();
        if (!this.isDragging || !this.engine.aimingEnabled) {
            if (this._powerText) { this._powerText.destroy(); this._powerText = null; }
            return;
        }

        const dx = this.startX - this.currentX;
        const dy = this.startY - this.currentY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < DEAD_ZONE_PX) return;

        const power = Math.min(dist / 60, 1);

        // Arrow color: green < 33%, yellow < 66%, red > 66%
        let color;
        if (power < 0.33) color = 0x44CC44;
        else if (power < 0.66) color = 0xCCCC44;
        else color = 0xCC4444;

        // Draw arrow from throw circle in slingshot direction
        const originX = this.scene.throwCircleX;
        const originY = this.scene.throwCircleY;
        const arrowLen = power * 40;
        const angle = Math.atan2(dy, dx);
        const endX = originX + Math.cos(angle) * arrowLen;
        const endY = originY + Math.sin(angle) * arrowLen;

        this.arrowGfx.lineStyle(2, color, 0.8);
        this.arrowGfx.beginPath();
        this.arrowGfx.moveTo(originX, originY);
        this.arrowGfx.lineTo(endX, endY);
        this.arrowGfx.strokePath();

        // Arrowhead
        const headLen = 4;
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

        // Power text
        if (this._powerText) this._powerText.destroy();
        this._powerText = this.scene.add.text(
            originX, originY + 12,
            `${Math.round(power * 100)}%`,
            { fontFamily: 'monospace', fontSize: '6px', color: '#F5E6D0' }
        ).setOrigin(0.5).setDepth(51);
    }

    destroy() {
        this.scene.input.off('pointerdown', this.onPointerDown, this);
        this.scene.input.off('pointermove', this.onPointerMove, this);
        this.scene.input.off('pointerup', this.onPointerUp, this);
        this.arrowGfx.destroy();
        if (this._powerText) this._powerText.destroy();
    }
}
