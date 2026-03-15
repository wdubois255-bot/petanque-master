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

        // Graphics
        this.gfx = scene.add.graphics();
        this.shadow = scene.add.graphics();
        this.draw();
    }

    draw() {
        // Shadow
        this.shadow.clear();
        if (this.isAlive) {
            this.shadow.fillStyle(0x000000, 0.2);
            this.shadow.fillCircle(this.x + 2, this.y + 2, this.radius);
        }

        // Ball with optional squash flash
        this.gfx.clear();
        if (this.isAlive) {
            const isSquashed = this._squashTimer > 0;
            if (isSquashed) this._squashTimer--;

            const r = this.radius;
            this.gfx.fillStyle(this.color, 1);
            this.gfx.fillCircle(this.x, this.y, r);

            // Squash flash: bright ring + slight size boost
            if (isSquashed) {
                this.gfx.fillStyle(0xFFFFFF, 0.4);
                this.gfx.fillCircle(this.x, this.y, r + 2);
                this.gfx.fillStyle(this.color, 1);
                this.gfx.fillCircle(this.x, this.y, r);
            }

            // Highlight
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

        // Cap dt to prevent physics explosion
        const cappedDt = Math.min(dt, 50) / 1000;

        // Apply friction (linear constant)
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > SPEED_THRESHOLD) {
            const frictionDecel = FRICTION_BASE * this.frictionMult * 60; // per second
            const newSpeed = Math.max(0, speed - frictionDecel * cappedDt);
            const ratio = newSpeed / speed;
            this.vx *= ratio;
            this.vy *= ratio;
        } else {
            this.vx = 0;
            this.vy = 0;
            this.isMoving = false;
        }

        // Move
        this.x += this.vx * cappedDt * 60;
        this.y += this.vy * cappedDt * 60;

        this.draw();
    }

    checkOutOfBounds(bounds) {
        if (!this.isAlive) return false;
        // FIPJP: ball entirely outside = dead
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
        this.gfx.clear();
        this.shadow.clear();
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

        // Normal vector
        const nx = dx / dist;
        const ny = dy / dist;

        // Relative velocity
        const dvx = a.vx - b.vx;
        const dvy = a.vy - b.vy;
        const dvn = dvx * nx + dvy * ny;

        // Don't resolve if separating
        if (dvn <= 0) return false;

        // Choose restitution based on masses (boule-cochonnet vs boule-boule)
        const isBouleVsCochonnet = Math.abs(a.mass - b.mass) > 200;
        const restitution = isBouleVsCochonnet ? RESTITUTION_COCHONNET : RESTITUTION_BOULE;

        // Impulse (elastic collision with restitution)
        const totalMass = a.mass + b.mass;
        const impulse = (1 + restitution) * dvn / totalMass;

        a.vx -= impulse * b.mass * nx;
        a.vy -= impulse * b.mass * ny;
        b.vx += impulse * a.mass * nx;
        b.vy += impulse * a.mass * ny;

        // Separate overlap
        const overlap = minDist - dist;
        const sepX = (overlap / 2 + 0.5) * nx;
        const sepY = (overlap / 2 + 0.5) * ny;
        a.x -= sepX;
        a.y -= sepY;
        b.x += sepX;
        b.y += sepY;

        // Mark both as moving
        a.isMoving = true;
        b.isMoving = true;

        // Squash & stretch visual effect
        if (a.scene && a.gfx) {
            a._squashTimer = 6;
        }
        if (b.scene && b.gfx) {
            b._squashTimer = 6;
        }

        return true;
    }

    destroy() {
        this.gfx.destroy();
        this.shadow.destroy();
    }
}
