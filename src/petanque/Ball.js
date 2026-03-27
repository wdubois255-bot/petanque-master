import {
    FRICTION_BASE, SPEED_THRESHOLD, RESTITUTION_BOULE,
    RESTITUTION_COCHONNET, BALL_RADIUS, BALL_MASS,
    PREDICTION_STEPS, PREDICTION_SAMPLE_RATE,
    RETRO_FRICTION_MULT, RETRO_PHASE1_MULT, RETRO_PHASE1_FRAMES, RETRO_PHASE2_FRAMES,
    RETRO_TERRAIN_EFF, WALL_RESTITUTION, POINT_COLLISION_DAMPING,
    BALL_TEXTURE_RADIUS, BALL_SHADOW_OFFSET_X, BALL_SHADOW_OFFSET_Y,
    BALL_SHADOW_RATIO_W, BALL_SHADOW_RATIO_H, BALL_ROLL_FRAME_STEP,
    BALL_SHADOW_STRETCH_MAX, BALL_SHADOW_STRETCH_SPEED, BALL_SQUASH_RADIUS_BOOST,
    BALL_DISPLAY_SCALE, COCHONNET_DISPLAY_SCALE, COCHONNET_MAX_COLLISION_SPEED,
    puissanceMultiplier,
    LATERAL_SPIN_FORCE, LATERAL_SPIN_FRAMES, LATERAL_SPIN_MIN_SPEED, LATERAL_SPIN_TERRAIN_MULT
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

        // Spin lateral (gauche/droite) — actif apres atterrissage
        this._lateralSpin = 0;        // -1 = gauche, 0 = off, +1 = droite
        this._lateralFrames = 0;      // frames restantes
        this._lateralIntensity = 0;   // intensite courante (1.0 → 0.0 lineaire)
        this._lateralTerrainMult = 1.0;
        this._effetStat = 6;          // stat Effet du personnage (affecte la force)

        // Determine texture key based on team/color
        this.textureKey = this._resolveTextureKey(options.textureKey);

        // Use sprite if texture exists, fallback to graphics
        if (this.textureKey && scene.textures.exists(this.textureKey)) {
            const tex = scene.textures.get(this.textureKey);
            this._rollFrames = Math.max(1, tex.frameTotal - 1); // -1 because Phaser adds __BASE frame

            const isCochonnet = this.mass < 100; // cochonnet is ~16g, boules are 700g
            this._displayMult = isCochonnet ? COCHONNET_DISPLAY_SCALE : BALL_DISPLAY_SCALE;
            const scale = (this.radius / BALL_TEXTURE_RADIUS) * this._displayMult;
            if (this._rollFrames <= 1) {
                this.sprite = scene.add.image(x, y, this.textureKey).setScale(scale).setDepth(10);
            } else {
                this.sprite = scene.add.sprite(x, y, this.textureKey, 0).setScale(scale).setDepth(10);
            }
            const shadowScale = this._displayMult;
            this.shadowSprite = scene.add.ellipse(x + BALL_SHADOW_OFFSET_X, y + BALL_SHADOW_OFFSET_Y, this.radius * BALL_SHADOW_RATIO_W * shadowScale, this.radius * BALL_SHADOW_RATIO_H * shadowScale, 0x3A2E28, 0.2).setDepth(9);
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
        if (this.team === 'opponent') return 'ball_noire';
        return 'ball_acier';
    }

    draw() {
        if (this.sprite) {
            // Sprite mode: update positions + rolling frame animation
            if (this.isAlive) {
                this.sprite.setPosition(this.x, this.y).setVisible(true);
                this.shadowSprite.setPosition(this.x + BALL_SHADOW_OFFSET_X, this.y + BALL_SHADOW_OFFSET_Y).setVisible(true);

                // Rolling animation: cycle through spritesheet frames based on distance
                if (this._rollFrames > 1) {
                    const frameIdx = Math.floor(this._rollDist / BALL_ROLL_FRAME_STEP) % this._rollFrames;
                    this.sprite.setFrame(frameIdx);
                }

                // Dynamic shadow: stretches when ball moves fast
                if (this.isMoving) {
                    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
                    const stretch = Math.min(BALL_SHADOW_STRETCH_MAX, 1 + speed * BALL_SHADOW_STRETCH_SPEED);
                    this.shadowSprite.setScale(stretch, 0.7);
                } else {
                    this.shadowSprite.setScale(1, 1);
                }

                // Squash flash on collision
                if (this._squashTimer > 0) {
                    this._squashTimer--;
                    this.sprite.setTint(0xFFFFFF);
                    this.sprite.setScale(((this.radius + BALL_SQUASH_RADIUS_BOOST) / BALL_TEXTURE_RADIUS) * this._displayMult);
                } else {
                    this.sprite.clearTint();
                    this.sprite.setScale((this.radius / BALL_TEXTURE_RADIUS) * this._displayMult);
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
        this._lowSpeedFrames = 0; // reset slope roll counter
    }

    activateRetro(intensity, terrainType) {
        if (intensity <= 0) return;
        this._retroIntensity = intensity;
        this._retroPhase = 1;
        this._retroFrames = Math.round(RETRO_PHASE1_FRAMES * intensity);
        this._retroTerrainEff = (RETRO_TERRAIN_EFF[terrainType] ?? 1.0);
        this._isRecoiling = false;
    }

    /**
     * Activer le spin lateral apres atterrissage.
     * @param {number} spinDir  -1 = gauche, +1 = droite
     * @param {number} effetStat  stat Effet du personnage (1-10)
     * @param {string} terrainType  'terre' | 'herbe' | 'sable' | 'dalles'
     */
    activateLateralSpin(spinDir, effetStat, terrainType) {
        if (spinDir === 0) return;
        this._lateralSpin = spinDir;
        this._effetStat = effetStat;
        this._lateralFrames = LATERAL_SPIN_FRAMES;
        this._lateralIntensity = 1.0;
        this._lateralTerrainMult = LATERAL_SPIN_TERRAIN_MULT[terrainType] ?? 1.0;
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

            // --- Spin lateral (post-friction pour que la deviation s'accumule) ---
            if (this._lateralSpin !== 0 && this._lateralFrames > 0 && speed > LATERAL_SPIN_MIN_SPEED) {
                // Decroissance lineaire de l'intensite
                this._lateralFrames--;
                this._lateralIntensity = this._lateralFrames / LATERAL_SPIN_FRAMES;
                // Force perpendiculaire au vecteur vitesse courant
                const curSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
                if (curSpeed > 0) {
                    const perpX = -this.vy / curSpeed;
                    const perpY =  this.vx / curSpeed;
                    const force = LATERAL_SPIN_FORCE * (this._effetStat / 10)
                        * this._lateralIntensity * this._lateralTerrainMult;
                    this.vx += perpX * force * this._lateralSpin * cappedDt * 60;
                    this.vy += perpY * force * this._lateralSpin * cappedDt * 60;
                }
                if (this._lateralFrames <= 0) {
                    this._lateralSpin = 0;
                    this._lateralIntensity = 0;
                }
            }
        } else {
            // On slopes, don't stop if gravity is still pushing the ball
            // BUT cap at ~2 seconds (120 frames) to prevent infinite roll
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
                this._lowSpeedFrames = (this._lowSpeedFrames || 0) + 1;
                const frictionForce = FRICTION_BASE * effectiveFriction * 60;
                // Safety: force stop after ~2s of low-speed slope roll (was 5s, too sluggish)
                if (activeSlopeForce > frictionForce * 0.5 && this._lowSpeedFrames < 120) return;
            }
            this.vx = 0;
            this.vy = 0;
            this.isMoving = false;
            this._lowSpeedFrames = 0;
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
        impulse *= (a.knockbackMult || 1) * (b.knockbackMult || 1);

        // Pointed balls collide softly — a gentle roll shouldn't blast targets away
        // Only the actively moving ball matters (higher speed = the thrower)
        const aSpeed = a.vx * a.vx + a.vy * a.vy;
        const bSpeed = b.vx * b.vx + b.vy * b.vy;
        const mover = aSpeed > bSpeed ? a : b;
        if (mover.isPoint) {
            impulse *= POINT_COLLISION_DAMPING;
        }

        // === PUISSANCE impacts ejection distance ===
        // The mover's (thrower's) puissance stat amplifies how far the TARGET gets pushed
        // Pui 1 = 0.8x, Pui 5 ≈ 1.02x, Pui 10 = 1.3x (source: Constants.puissanceMultiplier)
        const moverPui = mover.puissanceStat || 0;
        const puissanceBoost = moverPui > 0 ? puissanceMultiplier(moverPui) : 1.0;

        // Carreau Instinct (Ley): 50% stronger ejection on TARGET ball only
        const carreauBoostB = (a.carreauInstinct && !isBouleVsCochonnet) ? 1.5 : 1.0;
        const carreauBoostA = (b.carreauInstinct && !isBouleVsCochonnet) ? 1.5 : 1.0;

        // puissanceBoost amplifies the TARGET (non-mover), not the thrower's recoil
        const puiA = (mover === b) ? puissanceBoost : 1.0;
        const puiB = (mover === a) ? puissanceBoost : 1.0;

        a.vx -= impulse * b.mass * nx * carreauBoostA * puiA;
        a.vy -= impulse * b.mass * ny * carreauBoostA * puiA;
        b.vx += impulse * a.mass * nx * carreauBoostB * puiB;
        b.vy += impulse * a.mass * ny * carreauBoostB * puiB;

        // Cap cochonnet post-collision velocity to prevent ejection from terrain
        if (isBouleVsCochonnet) {
            const lighter = a.mass < b.mass ? a : b;
            const speed = Math.sqrt(lighter.vx * lighter.vx + lighter.vy * lighter.vy);
            if (speed > COCHONNET_MAX_COLLISION_SPEED) {
                const ratio = COCHONNET_MAX_COLLISION_SPEED / speed;
                lighter.vx *= ratio;
                lighter.vy *= ratio;
            }
        }

        const overlap = minDist - dist;
        const sepX = (overlap / 2 + 0.5) * nx;
        const sepY = (overlap / 2 + 0.5) * ny;
        a.x -= sepX;
        a.y -= sepY;
        b.x += sepX;
        b.y += sepY;

        a.isMoving = true;
        b.isMoving = true;

        // Squash proportional to impact force (gentle=3f, normal=6f, hard=8f)
        const squashFrames = Math.max(3, Math.min(8, Math.round(dvn * 1.2)));
        a._squashTimer = squashFrames;
        b._squashTimer = squashFrames;

        return true;
    }

    destroy() {
        if (this.gfx) this.gfx.destroy();
        if (this.shadow) this.shadow.destroy();
        if (this.sprite) this.sprite.destroy();
        if (this.shadowSprite) this.shadowSprite.destroy();
    }
}
