import {
    FRICTION_BASE, SPEED_THRESHOLD, RESTITUTION_BOULE,
    RESTITUTION_COCHONNET, BALL_RADIUS, BALL_MASS,
    PREDICTION_STEPS, PREDICTION_SAMPLE_RATE,
    RETRO_FRICTION_MULT, RETRO_PHASE1_MULT, RETRO_PHASE1_FRAMES, RETRO_PHASE2_FRAMES,
    RETRO_TERRAIN_EFF, WALL_RESTITUTION
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
        this._terrain = options.terrain || null;   // terrain data (slope, zones, walls)
        this._bounds = options.bounds || null;      // terrain bounds {x, y, w, h}
        this.id = options.id || `ball_${Date.now()}_${Math.random()}`;

        this._squashTimer = 0;
        this._rollDist = 0; // accumulated rolling distance for frame cycling
        this._rollFrames = 6; // number of roll animation frames

        // Spin (retro/backspin): 0 = no effect, 1 = max backspin
        this.retro = 0;

        // 2-phase retro model
        this._retroPhase = 0;       // 0 = inactive, 1 = sliding, 2 = transition
        this._retroFrames = 0;      // frames remaining in current phase
        this._retroTerrainEff = 1.0; // terrain efficiency multiplier
        this._retroIntensity = 0;   // stored intensity for phase calculations
        this._isRecoiling = false;  // true when ball moves backward after collision

        // Determine texture key based on team/color
        this.textureKey = this._resolveTextureKey(options.textureKey);

        // Use sprite if texture exists, fallback to graphics
        if (this.textureKey && scene.textures.exists(this.textureKey)) {
            const tex = scene.textures.get(this.textureKey);
            this._rollFrames = tex.frameTotal - 1 || 1; // -1 because Phaser adds __BASE frame

            const scale = this.radius / 28; // texture is 64x64 with radius ~28px
            if (this._rollFrames <= 1) {
                this.sprite = scene.add.image(x, y, this.textureKey).setScale(scale).setDepth(10);
            } else {
                this.sprite = scene.add.sprite(x, y, this.textureKey, 0).setScale(scale).setDepth(10);
            }
            this.shadowSprite = scene.add.ellipse(x + 3, y + 4, this.radius * 1.8, this.radius * 0.8, 0x3A2E28, 0.2).setDepth(9);
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
        // Default fallbacks — can be overridden via options.textureKey
        if (this.team === 'opponent') return 'ball_chrome';
        return 'ball_acier';
    }

    draw() {
        if (this.sprite) {
            // Sprite mode: update positions + rolling frame animation
            if (this.isAlive) {
                this.sprite.setPosition(this.x, this.y).setVisible(true);
                this.shadowSprite.setPosition(this.x + 3, this.y + 4).setVisible(true);

                // Rolling animation: cycle through spritesheet frames based on distance
                if (this._rollFrames > 1) {
                    const frameIdx = Math.floor(this._rollDist / 15) % this._rollFrames;
                    this.sprite.setFrame(frameIdx);
                }

                // Dynamic shadow: stretches when ball moves fast
                if (this.isMoving) {
                    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
                    const stretch = Math.min(1.4, 1 + speed * 0.003);
                    this.shadowSprite.setScale(stretch, 0.7);
                } else {
                    this.shadowSprite.setScale(1, 1);
                }

                // Squash flash on collision
                if (this._squashTimer > 0) {
                    this._squashTimer--;
                    this.sprite.setTint(0xFFFFFF);
                    this.sprite.setScale((this.radius + 2) / 28);
                } else {
                    this.sprite.clearTint();
                    this.sprite.setScale(this.radius / 28);
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
            this.shadow.fillStyle(0x3A2E28, 0.2);
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

    activateRetro(intensity, terrainType) {
        if (intensity <= 0) return;
        this._retroIntensity = intensity;
        this._retroPhase = 1;
        this._retroFrames = Math.round(RETRO_PHASE1_FRAMES * intensity);
        this._retroTerrainEff = (RETRO_TERRAIN_EFF[terrainType] ?? 1.0);
        this._isRecoiling = false;
    }

    update(dt) {
        if (!this.isAlive || !this.isMoving) return;

        const cappedDt = Math.min(dt, 50) / 1000;
        const terrain = this._terrain;

        // --- Slope: apply gravity component ---
        // Supports both global slope (legacy) and slope_zones (realistic per-zone devers)
        let slopeApplied = false;
        if (terrain?.slope_zones?.length && this._bounds) {
            const b = this._bounds;
            for (const sz of terrain.slope_zones) {
                const zx = b.x + sz.rect.x * b.w;
                const zy = b.y + sz.rect.y * b.h;
                const zw = sz.rect.w * b.w;
                const zh = sz.rect.h * b.h;
                if (this.x >= zx && this.x <= zx + zw && this.y >= zy && this.y <= zy + zh) {
                    const force = sz.gravity_component * 60;
                    if (sz.direction === 'down') this.vy += force * cappedDt;
                    else if (sz.direction === 'up') this.vy -= force * cappedDt;
                    else if (sz.direction === 'left') this.vx -= force * cappedDt;
                    else if (sz.direction === 'right') this.vx += force * cappedDt;
                    slopeApplied = true;
                    break;
                }
            }
        }
        if (!slopeApplied && terrain?.slope) {
            const s = terrain.slope;
            const slopeForce = s.gravity_component * 60;
            if (s.direction === 'down') this.vy += slopeForce * cappedDt;
            else if (s.direction === 'up') this.vy -= slopeForce * cappedDt;
            else if (s.direction === 'left') this.vx -= slopeForce * cappedDt;
            else if (s.direction === 'right') this.vx += slopeForce * cappedDt;
        }

        // --- Dynamic friction: check if ball is in a zone (terrain Parc) ---
        let effectiveFriction = this.frictionMult;
        if (terrain?.zones?.length && this._bounds) {
            const b = this._bounds;
            for (const zone of terrain.zones) {
                const zx = b.x + zone.rect.x * b.w;
                const zy = b.y + zone.rect.y * b.h;
                const zw = zone.rect.w * b.w;
                const zh = zone.rect.h * b.h;
                if (this.x >= zx && this.x <= zx + zw && this.y >= zy && this.y <= zy + zh) {
                    effectiveFriction = zone.friction;
                    break;
                }
            }
        }

        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > SPEED_THRESHOLD) {
            // Retro (backspin) friction boost
            // Simple mode: ball.retro > 0 without activateRetro() → linear friction mult
            // Advanced mode: activateRetro() activates 2-phase model (overrides simple)
            let retroMult = 1.0;
            if (this._retroPhase === 0 && this.retro > 0) {
                // Simple retro: retroBoost = 1 + retro * RETRO_FRICTION_MULT
                retroMult = 1 + this.retro * RETRO_FRICTION_MULT;
            } else if (this._retroPhase === 1) {
                // Phase 1 — Glissement: high friction (or reduced if recoiling)
                if (this._isRecoiling) {
                    retroMult = 0.7; // spin and motion same direction = less friction
                } else {
                    retroMult = 1 + (RETRO_PHASE1_MULT - 1) * this._retroIntensity * this._retroTerrainEff;
                }
                this._retroFrames--;
                if (this._retroFrames <= 0) {
                    this._retroPhase = 2;
                    this._retroFrames = RETRO_PHASE2_FRAMES;
                }
            } else if (this._retroPhase === 2) {
                // Phase 2 — Transition: linearly decrease from phase1 level to 1.0
                const progress = 1 - (this._retroFrames / RETRO_PHASE2_FRAMES);
                const phase1Level = this._isRecoiling
                    ? 0.7
                    : 1 + (RETRO_PHASE1_MULT - 1) * this._retroIntensity * this._retroTerrainEff;
                retroMult = phase1Level + (1.0 - phase1Level) * progress;
                this._retroFrames--;
                if (this._retroFrames <= 0) {
                    this._retroPhase = 0;
                    this.retro = 0; // backspin fully consumed
                    this._isRecoiling = false;
                }
            }
            const frictionDecel = FRICTION_BASE * effectiveFriction * retroMult * 60;
            const newSpeed = Math.max(0, speed - frictionDecel * cappedDt);
            const ratio = speed > 0 ? newSpeed / speed : 0;
            this.vx *= ratio;
            this.vy *= ratio;

            // Accumulate rolling distance for frame animation
            this._rollDist += speed * cappedDt * 60;
        } else {
            // On slopes, don't stop if gravity is still pushing the ball
            let activeSlopeForce = 0;
            if (terrain?.slope_zones?.length && this._bounds) {
                const b = this._bounds;
                for (const sz of terrain.slope_zones) {
                    const zx = b.x + sz.rect.x * b.w;
                    const zy = b.y + sz.rect.y * b.h;
                    const zw = sz.rect.w * b.w;
                    const zh = sz.rect.h * b.h;
                    if (this.x >= zx && this.x <= zx + zw && this.y >= zy && this.y <= zy + zh) {
                        activeSlopeForce = sz.gravity_component * 60;
                        break;
                    }
                }
            } else if (terrain?.slope) {
                activeSlopeForce = terrain.slope.gravity_component * 60;
            }
            if (activeSlopeForce > 0) {
                const frictionForce = FRICTION_BASE * effectiveFriction * 60;
                if (activeSlopeForce > frictionForce * 0.5) return;
            }
            this.vx = 0;
            this.vy = 0;
            this.isMoving = false;
        }

        this.x += this.vx * cappedDt * 60;
        this.y += this.vy * cappedDt * 60;

        // --- Wall rebounds (terrain Docks) ---
        if (terrain?.walls && this._bounds) {
            const b = this._bounds;
            const r = this.radius;
            const wallRestitution = WALL_RESTITUTION;
            if (this.x - r < b.x) {
                this.x = b.x + r;
                this.vx = Math.abs(this.vx) * wallRestitution;
                this._squashTimer = 4;
            } else if (this.x + r > b.x + b.w) {
                this.x = b.x + b.w - r;
                this.vx = -Math.abs(this.vx) * wallRestitution;
                this._squashTimer = 4;
            }
            if (this.y - r < b.y) {
                this.y = b.y + r;
                this.vy = Math.abs(this.vy) * wallRestitution;
                this._squashTimer = 4;
            } else if (this.y + r > b.y + b.h) {
                this.y = b.y + b.h - r;
                this.vy = -Math.abs(this.vy) * wallRestitution;
                this._squashTimer = 4;
            }
        }

        this.draw();
    }

    checkOutOfBounds(bounds) {
        if (!this.isAlive) return false;
        // FIPJP rule: ball is dead when entirely outside the terrain
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
            const ratio = speed > 0 ? newSpeed / speed : 0;
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
        // Le Mur ability: larger collision radius
        const radiusA = a.radius * (a.collisionRadiusMult || 1);
        const radiusB = b.radius * (b.collisionRadiusMult || 1);
        const minDist = radiusA + radiusB;

        if (dist >= minDist || dist === 0) return false;

        const nx = dx / dist;
        const ny = dy / dist;

        const dvx = a.vx - b.vx;
        const dvy = a.vy - b.vy;
        const dvn = dvx * nx + dvy * ny;

        if (dvn <= 0) return false;

        // Restitution basee sur physique reelle (acier COR ~0.62, bois/acier ~0.50)
        // Avec COR 0.62, un tir frontal entre masses egales transfere naturellement ~81%
        // de l'energie au contact → carreau naturel sans hack
        // Boule mass ~700g, Cochonnet ~30g → difference > 200 = mixed collision
        const isBouleVsCochonnet = Math.abs(a.mass - b.mass) > (BALL_MASS * 0.3);
        let restitution = isBouleVsCochonnet ? RESTITUTION_COCHONNET : RESTITUTION_BOULE;
        // Apply boule-specific restitution bonus (e.g. Titane bounces more)
        restitution *= (a.restitutionMult || 1) * (b.restitutionMult || 1);
        restitution = Math.min(restitution, 0.95); // cap to prevent infinite energy

        const totalMass = a.mass + b.mass;
        let impulse = (1 + restitution) * dvn / totalMass;
        // Apply knockback bonus (e.g. Bronze hits harder)
        impulse *= Math.max(a.knockbackMult || 1, b.knockbackMult || 1);

        // === PUISSANCE impacts ejection distance ===
        // The thrower's puissance stat amplifies how far the target gets pushed
        // PUI 5 = 1.0x (baseline), PUI 10 = 1.25x, PUI 1 = 0.8x
        const throwerPui = a.puissanceStat || b.puissanceStat || 0;
        const puissanceBoost = throwerPui > 0 ? 0.8 + (throwerPui - 1) / 9 * 0.45 : 1.0;

        // Carreau Instinct (Ley): 50% stronger ejection on TARGET ball only
        const carreauBoostB = (a.carreauInstinct && !isBouleVsCochonnet) ? 1.5 : 1.0;
        const carreauBoostA = (b.carreauInstinct && !isBouleVsCochonnet) ? 1.5 : 1.0;

        a.vx -= impulse * b.mass * nx * carreauBoostA;
        a.vy -= impulse * b.mass * ny * carreauBoostA;
        b.vx += impulse * a.mass * nx * carreauBoostB * puissanceBoost;
        b.vy += impulse * a.mass * ny * carreauBoostB * puissanceBoost;

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
