import {
    FRICTION_BASE, SPEED_THRESHOLD, RESTITUTION_BOULE,
    RESTITUTION_COCHONNET, BALL_RADIUS, BALL_MASS,
    PREDICTION_STEPS, PREDICTION_SAMPLE_RATE
} from '../utils/Constants.js';

export default class Ball {
    constructor(scene, x, y, options = {}) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.radius = options.radius || BALL_RADIUS;
        this.mass = options.mass || BALL_MASS;
        this.color = options.color || 0xA8B5C2;
        this.team = options.team || 'player';
        this.isAlive = true;
        this.isMoving = false;
        this.frictionMult = options.frictionMult || 1.0;
        this.id = options.id || `ball_${Date.now()}_${Math.random()}`;

        this._squashTimer = 0;

        // Determine texture key based on team/color
        this.textureKey = this._resolveTextureKey(options.textureKey);

        // Use sprite if texture exists, fallback to graphics
        if (this.textureKey && scene.textures.exists(this.textureKey)) {
            const scale = this.radius / 14; // texture is 32x32 with radius 14
            this.sprite = scene.add.image(x, y, this.textureKey).setScale(scale).setDepth(10);
            this.shadowSprite = scene.add.ellipse(x + 3, y + 4, this.radius * 1.8, this.radius * 0.8, 0x000000, 0.2).setDepth(9);
            this.gfx = null;
            this.shadow = null;
        } else {
            // Fallback: old Graphics rendering
            this.sprite = null;
            this.shadowSprite = null;
            this.gfx = scene.add.graphics();
            this.shadow = scene.add.graphics();
            this.draw();
        }
    }

    _resolveTextureKey(explicit) {
        if (explicit) return explicit;
        if (this.team === 'cochonnet') return 'ball_cochonnet';
        if (this.team === 'opponent') return 'ball_opponent';
        // Player: map color to texture
        const colorMap = {
            0xA8B5C2: 'ball_acier',
            0xCD7F32: 'ball_bronze',
            0xDCDCDC: 'ball_chrome'
        };
        return colorMap[this.color] || 'ball_acier';
    }

    draw() {
        if (this.sprite) {
            // Sprite mode: update positions
            if (this.isAlive) {
                this.sprite.setPosition(this.x, this.y).setVisible(true);
                this.shadowSprite.setPosition(this.x + 3, this.y + 4).setVisible(true);

                // Squash flash
                if (this._squashTimer > 0) {
                    this._squashTimer--;
                    this.sprite.setTint(0xFFFFFF);
                    this.sprite.setScale((this.radius + 2) / 14);
                } else {
                    this.sprite.clearTint();
                    this.sprite.setScale(this.radius / 14);
                }
            } else {
                this.sprite.setVisible(false);
                this.shadowSprite.setVisible(false);
            }
            return;
        }

        // Graphics fallback
        this.shadow.clear();
        if (this.isAlive) {
            this.shadow.fillStyle(0x000000, 0.2);
            this.shadow.fillCircle(this.x + 2, this.y + 2, this.radius);
        }

        this.gfx.clear();
        if (this.isAlive) {
            const isSquashed = this._squashTimer > 0;
            if (isSquashed) this._squashTimer--;

            const r = this.radius;
            this.gfx.fillStyle(this.color, 1);
            this.gfx.fillCircle(this.x, this.y, r);

            if (isSquashed) {
                this.gfx.fillStyle(0xFFFFFF, 0.4);
                this.gfx.fillCircle(this.x, this.y, r + 2);
                this.gfx.fillStyle(this.color, 1);
                this.gfx.fillCircle(this.x, this.y, r);
            }

            this.gfx.fillStyle(0xFFFFFF, 0.3);
            this.gfx.fillCircle(this.x - r * 0.3, this.y - r * 0.3, r * 0.3);
        }
    }

    launch(vx, vy) {
        this.vx = vx;
        this.vy = vy;
        this.isMoving = true;
    }

    update(dt) {
        if (!this.isAlive || !this.isMoving) return;

        const cappedDt = Math.min(dt, 50) / 1000;

        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > SPEED_THRESHOLD) {
            const frictionDecel = FRICTION_BASE * this.frictionMult * 60;
            const newSpeed = Math.max(0, speed - frictionDecel * cappedDt);
            const ratio = newSpeed / speed;
            this.vx *= ratio;
            this.vy *= ratio;
        } else {
            this.vx = 0;
            this.vy = 0;
            this.isMoving = false;
        }

        this.x += this.vx * cappedDt * 60;
        this.y += this.vy * cappedDt * 60;

        this.draw();
    }

    checkOutOfBounds(bounds) {
        if (!this.isAlive) return false;
        return (
            this.x + this.radius < bounds.x ||
            this.x - this.radius > bounds.x + bounds.w ||
            this.y + this.radius < bounds.y ||
            this.y - this.radius > bounds.y + bounds.h
        );
    }

    kill() {
        this.isAlive = false;
        this.isMoving = false;
        this.vx = 0;
        this.vy = 0;
        if (this.gfx) this.gfx.clear();
        if (this.shadow) this.shadow.clear();
        if (this.sprite) this.sprite.setVisible(false);
        if (this.shadowSprite) this.shadowSprite.setVisible(false);
    }

    distanceTo(other) {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    static simulateTrajectory(startX, startY, vx, vy, frictionMult, steps = PREDICTION_STEPS) {
        const points = [];
        let x = startX, y = startY;
        let cvx = vx, cvy = vy;
        const dt = 1 / 60;

        for (let i = 0; i < steps; i++) {
            const speed = Math.sqrt(cvx * cvx + cvy * cvy);
            if (speed <= SPEED_THRESHOLD) break;

            const frictionDecel = FRICTION_BASE * frictionMult * 60;
            const newSpeed = Math.max(0, speed - frictionDecel * dt);
            const ratio = newSpeed / speed;
            cvx *= ratio;
            cvy *= ratio;

            x += cvx * dt * 60;
            y += cvy * dt * 60;

            if (i % PREDICTION_SAMPLE_RATE === 0) {
                points.push({ x, y });
            }
        }
        return points;
    }

    static resolveCollision(a, b) {
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = a.radius + b.radius;

        if (dist >= minDist || dist === 0) return false;

        const nx = dx / dist;
        const ny = dy / dist;

        const dvx = a.vx - b.vx;
        const dvy = a.vy - b.vy;
        const dvn = dvx * nx + dvy * ny;

        if (dvn <= 0) return false;

        const isBouleVsCochonnet = Math.abs(a.mass - b.mass) > 200;
        const restitution = isBouleVsCochonnet ? RESTITUTION_COCHONNET : RESTITUTION_BOULE;

        const totalMass = a.mass + b.mass;
        const impulse = (1 + restitution) * dvn / totalMass;

        a.vx -= impulse * b.mass * nx;
        a.vy -= impulse * b.mass * ny;
        b.vx += impulse * a.mass * nx;
        b.vy += impulse * a.mass * ny;

        const overlap = minDist - dist;
        const sepX = (overlap / 2 + 0.5) * nx;
        const sepY = (overlap / 2 + 0.5) * ny;
        a.x -= sepX;
        a.y -= sepY;
        b.x += sepX;
        b.y += sepY;

        a.isMoving = true;
        b.isMoving = true;

        a._squashTimer = 6;
        b._squashTimer = 6;

        return true;
    }

    destroy() {
        if (this.gfx) this.gfx.destroy();
        if (this.shadow) this.shadow.destroy();
        if (this.sprite) this.sprite.destroy();
        if (this.shadowSprite) this.shadowSprite.destroy();
    }
}
