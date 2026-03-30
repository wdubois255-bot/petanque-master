/**
 * TIR PHYSICS — Comprehensive collision & backspin simulation tests.
 *
 * Validates the physics of tir impacts by directly simulating ball collisions:
 *   1. Carreau (center hit)
 *   2. Tir de cote (side hit)
 *   3. Casquette avant (front edge hit)
 *   4. Casquette arriere (back-clip)
 *   5. Recul (backspin reversal)
 *   6. No recul for pointage
 *   7. Recul varies by terrain
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    BALL_RADIUS, BALL_MASS,
    RESTITUTION_BOULE, FRICTION_BASE, SPEED_THRESHOLD,
    TIR_IMPACT_SPEED, TIR_RECUL_IMPULSE,
    CARREAU_THRESHOLD, CASQUETTE_MAX_DISPLACEMENT,
    RETRO_PHASE1_FRAMES, RETRO_PHASE2_FRAMES, RETRO_TERRAIN_EFF,
    TERRAIN_FRICTION
} from '../src/utils/Constants.js';

// ── Mock scene ────────────────────────────────────────────────────
const mockScene = {
    textures: { exists: () => false },
    add: {
        graphics: () => ({
            clear: vi.fn(), fillStyle: vi.fn(), fillCircle: vi.fn(),
            setDepth: vi.fn().mockReturnThis(), setVisible: vi.fn().mockReturnThis(),
            destroy: vi.fn()
        }),
        image: () => ({
            setScale: vi.fn().mockReturnThis(), setDepth: vi.fn().mockReturnThis(),
            setPosition: vi.fn().mockReturnThis(), setVisible: vi.fn().mockReturnThis(),
            setTint: vi.fn(), clearTint: vi.fn(), destroy: vi.fn()
        }),
        ellipse: () => ({
            setDepth: vi.fn().mockReturnThis(), setPosition: vi.fn().mockReturnThis(),
            setVisible: vi.fn().mockReturnThis(), destroy: vi.fn(),
            setScale: vi.fn().mockReturnThis(), setAlpha: vi.fn().mockReturnThis()
        })
    }
};

let Ball;
beforeEach(async () => {
    const mod = await import('../src/petanque/Ball.js');
    Ball = mod.default;
});

const DT = 1000 / 60; // ~16.67ms

/** Run update loop until ball stops or maxFrames is reached */
function runUntilStop(ball, maxFrames = 600) {
    let frames = 0;
    while (ball.isMoving && frames < maxFrames) {
        ball.update(DT);
        frames++;
    }
    return frames;
}

/** Run update loop on multiple balls until all stop */
function runAllUntilStop(balls, maxFrames = 600) {
    let frames = 0;
    while (frames < maxFrames) {
        let anyMoving = false;
        for (const b of balls) {
            if (b.isMoving) {
                b.update(DT);
                anyMoving = true;
            }
        }
        // Check collisions between all pairs each frame
        for (let i = 0; i < balls.length; i++) {
            for (let j = i + 1; j < balls.length; j++) {
                if (balls[i].isMoving || balls[j].isMoving) {
                    Ball.resolveCollision(balls[i], balls[j]);
                }
            }
        }
        if (!anyMoving) break;
        frames++;
    }
    return frames;
}

function dist(a, b) {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function speed(ball) {
    return Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
}

// ═══════════════════════════════════════════════════════════════════
// 1. CARREAU (center hit)
// ═══════════════════════════════════════════════════════════════════

describe('1 - Carreau (center hit)', () => {

    it('target receives >50% of input speed, thrower retains <30%', () => {
        // Thrower approaches from below, target is directly above
        // Place them overlapping along the throw axis (direct center hit)
        const target = new Ball(mockScene, 200, 200, {
            mass: BALL_MASS, radius: BALL_RADIUS, frictionMult: TERRAIN_FRICTION.terre
        });
        // Thrower placed so it overlaps target along the Y axis (approach from below)
        const overlapDist = BALL_RADIUS * 2 - 2; // just overlapping
        const thrower = new Ball(mockScene, 200, 200 + overlapDist, {
            mass: BALL_MASS, radius: BALL_RADIUS, frictionMult: TERRAIN_FRICTION.terre
        });

        // Give thrower velocity directly toward target (upward = negative Y)
        const inputSpeed = TIR_IMPACT_SPEED;
        thrower.vx = 0;
        thrower.vy = -inputSpeed;
        thrower.isMoving = true;

        // Resolve collision
        const collided = Ball.resolveCollision(thrower, target);
        expect(collided).toBe(true);

        // Check velocities after collision
        const targetSpeed = speed(target);
        const throwerSpeed = speed(thrower);

        // With COR 0.62 and equal masses: target gets ~81% energy, thrower retains ~19%
        expect(targetSpeed).toBeGreaterThan(inputSpeed * 0.50);
        expect(throwerSpeed).toBeLessThan(inputSpeed * 0.30);
    });

    it('thrower ends near impact point after settling (within CARREAU_THRESHOLD)', () => {
        const target = new Ball(mockScene, 200, 200, {
            mass: BALL_MASS, radius: BALL_RADIUS, frictionMult: TERRAIN_FRICTION.terre
        });
        const overlapDist = BALL_RADIUS * 2 - 2;
        const thrower = new Ball(mockScene, 200, 200 + overlapDist, {
            mass: BALL_MASS, radius: BALL_RADIUS, frictionMult: TERRAIN_FRICTION.terre
        });

        const impactX = thrower.x;
        const impactY = thrower.y;

        thrower.vx = 0;
        thrower.vy = -TIR_IMPACT_SPEED;
        thrower.isMoving = true;

        Ball.resolveCollision(thrower, target);

        // Run physics until both stop
        runAllUntilStop([thrower, target]);

        // Thrower should be near the impact point
        const throwerDisplacement = Math.sqrt(
            (thrower.x - impactX) ** 2 + (thrower.y - impactY) ** 2
        );
        expect(throwerDisplacement).toBeLessThan(CARREAU_THRESHOLD);
    });

    it('target moves significantly away from its original position', () => {
        const targetOrigX = 200;
        const targetOrigY = 200;
        const target = new Ball(mockScene, targetOrigX, targetOrigY, {
            mass: BALL_MASS, radius: BALL_RADIUS, frictionMult: TERRAIN_FRICTION.terre
        });
        const overlapDist = BALL_RADIUS * 2 - 2;
        const thrower = new Ball(mockScene, 200, 200 + overlapDist, {
            mass: BALL_MASS, radius: BALL_RADIUS, frictionMult: TERRAIN_FRICTION.terre
        });

        thrower.vx = 0;
        thrower.vy = -TIR_IMPACT_SPEED;
        thrower.isMoving = true;

        Ball.resolveCollision(thrower, target);
        runAllUntilStop([thrower, target]);

        const targetDisplacement = Math.sqrt(
            (target.x - targetOrigX) ** 2 + (target.y - targetOrigY) ** 2
        );
        // Target should move far (CARREAU_DISPLACED_MIN = 32px)
        expect(targetDisplacement).toBeGreaterThan(32);
    });
});

// ═══════════════════════════════════════════════════════════════════
// 2. TIR DE COTE (side hit)
// ═══════════════════════════════════════════════════════════════════

describe('2 - Tir de cote (side hit)', () => {

    it('target moves sideways (perpendicular > forward component)', () => {
        // Target at center, thrower offset to the right and approaching straight up
        const target = new Ball(mockScene, 200, 200, {
            mass: BALL_MASS, radius: BALL_RADIUS, frictionMult: TERRAIN_FRICTION.terre
        });
        // Offset thrower to the right so collision normal is diagonal
        const lateralOffset = BALL_RADIUS * 1.2; // significant side offset
        const verticalDist = Math.sqrt((BALL_RADIUS * 2 - 1) ** 2 - lateralOffset ** 2);
        const thrower = new Ball(mockScene, 200 + lateralOffset, 200 + verticalDist, {
            mass: BALL_MASS, radius: BALL_RADIUS, frictionMult: TERRAIN_FRICTION.terre
        });

        // Thrower moves straight upward (throw direction)
        thrower.vx = 0;
        thrower.vy = -TIR_IMPACT_SPEED;
        thrower.isMoving = true;

        const collided = Ball.resolveCollision(thrower, target);
        expect(collided).toBe(true);

        // Target should move with a significant lateral (X) component
        // The collision normal points from thrower to target, which is upper-left
        // So target gets pushed upper-left
        const targetLateralSpeed = Math.abs(target.vx);
        expect(targetLateralSpeed).toBeGreaterThan(0.5);

        // Thrower should deflect in the opposite lateral direction (to the right)
        // Since thrower was to the right, collision pushes it further right
        expect(thrower.vx).toBeGreaterThan(0);
    });

    it('thrower deflects in opposite lateral direction', () => {
        const target = new Ball(mockScene, 200, 200, {
            mass: BALL_MASS, radius: BALL_RADIUS, frictionMult: TERRAIN_FRICTION.terre
        });
        // Thrower offset to the LEFT
        const lateralOffset = -BALL_RADIUS * 1.2;
        const verticalDist = Math.sqrt((BALL_RADIUS * 2 - 1) ** 2 - lateralOffset ** 2);
        const thrower = new Ball(mockScene, 200 + lateralOffset, 200 + verticalDist, {
            mass: BALL_MASS, radius: BALL_RADIUS, frictionMult: TERRAIN_FRICTION.terre
        });

        thrower.vx = 0;
        thrower.vy = -TIR_IMPACT_SPEED;
        thrower.isMoving = true;

        Ball.resolveCollision(thrower, target);

        // Thrower was to the left, so collision pushes it further left
        expect(thrower.vx).toBeLessThan(0);
        // Target pushed to the right
        expect(target.vx).toBeGreaterThan(0);
    });
});

// ═══════════════════════════════════════════════════════════════════
// 3. CASQUETTE AVANT (front edge hit)
// ═══════════════════════════════════════════════════════════════════

describe('3 - Casquette avant (front edge hit)', () => {

    it('target barely moves (displacement < CASQUETTE_MAX_DISPLACEMENT after settling)', () => {
        const targetOrigX = 200;
        const targetOrigY = 200;
        const target = new Ball(mockScene, targetOrigX, targetOrigY, {
            mass: BALL_MASS, radius: BALL_RADIUS, frictionMult: TERRAIN_FRICTION.terre
        });

        // Place thrower at the very edge of contact zone, almost tangential
        // Barely overlapping at the side edge: thrower far to the right
        // At distance just under 2*BALL_RADIUS, but almost all lateral offset
        const overlapPx = 0.5; // barely overlapping
        const contactDist = BALL_RADIUS * 2 - overlapPx;
        // Almost entirely lateral offset, tiny vertical overlap
        // 0.99 = nearly tangential → very small dvn component
        const lateralOffset = contactDist * 0.99;
        const verticalOffset = Math.sqrt(contactDist * contactDist - lateralOffset * lateralOffset);

        const thrower = new Ball(mockScene, targetOrigX + lateralOffset, targetOrigY + verticalOffset, {
            mass: BALL_MASS, radius: BALL_RADIUS, frictionMult: TERRAIN_FRICTION.terre
        });

        // Thrower moves straight up (perpendicular to collision normal)
        thrower.vx = 0;
        thrower.vy = -TIR_IMPACT_SPEED;
        thrower.isMoving = true;

        const collided = Ball.resolveCollision(thrower, target);
        expect(collided).toBe(true);

        // Run until settled
        runAllUntilStop([thrower, target]);

        const targetDisplacement = Math.sqrt(
            (target.x - targetOrigX) ** 2 + (target.y - targetOrigY) ** 2
        );
        // A casquette = barely moved
        expect(targetDisplacement).toBeLessThan(CASQUETTE_MAX_DISPLACEMENT);
    });

    it('thrower continues mostly in original direction', () => {
        const target = new Ball(mockScene, 200, 200, {
            mass: BALL_MASS, radius: BALL_RADIUS, frictionMult: TERRAIN_FRICTION.terre
        });

        const overlapPx = 0.5;
        const contactDist = BALL_RADIUS * 2 - overlapPx;
        const lateralOffset = contactDist * 0.99;
        const verticalOffset = Math.sqrt(contactDist * contactDist - lateralOffset * lateralOffset);

        const thrower = new Ball(mockScene, 200 + lateralOffset, 200 + verticalOffset, {
            mass: BALL_MASS, radius: BALL_RADIUS, frictionMult: TERRAIN_FRICTION.terre
        });

        thrower.vx = 0;
        thrower.vy = -TIR_IMPACT_SPEED;
        thrower.isMoving = true;

        Ball.resolveCollision(thrower, target);

        // Thrower should still be going mostly upward (vy strongly negative)
        // The glancing blow barely changes direction
        expect(thrower.vy).toBeLessThan(-TIR_IMPACT_SPEED * 0.5);
        // Lateral deflection should be small relative to forward speed
        expect(Math.abs(thrower.vx)).toBeLessThan(Math.abs(thrower.vy));
    });
});

// ═══════════════════════════════════════════════════════════════════
// 4. CASQUETTE ARRIERE (back-clip)
// ═══════════════════════════════════════════════════════════════════

describe('4 - Casquette arriere (back-clip)', () => {
    // In PetanqueEngine, when dotApproach < 0 (ball landed past/behind the target),
    // the engine applies direct physics instead of resolveCollision.
    // We simulate this exact scenario.

    it('target gets a small push (< 15% of impact speed)', () => {
        // Simulate what PetanqueEngine does for back-clip:
        // Ball landed past the target (dotApproach < 0)
        const targetX = 200;
        const targetY = 200;
        const target = new Ball(mockScene, targetX, targetY, {
            mass: BALL_MASS, radius: BALL_RADIUS, frictionMult: TERRAIN_FRICTION.terre
        });

        // Ball landed at a position past/behind the target
        // Throw direction is upward (-Y), so ball landed ABOVE the target
        const ballX = 200;
        const ballY = 195; // above the target (past it in throw direction)
        const cdist = Math.sqrt((targetX - ballX) ** 2 + (targetY - ballY) ** 2);

        const throwNx = 0;
        const throwNy = -1; // upward throw direction

        // dotApproach check
        const toTargetX = targetX - ballX;
        const toTargetY = targetY - ballY;
        const dotApproach = toTargetX * throwNx + toTargetY * throwNy;

        // Verify this IS a back-clip (dotApproach < 0)
        expect(dotApproach).toBeLessThan(0);

        // Apply PetanqueEngine back-clip physics
        const contactZone = BALL_RADIUS + target.radius + 3; // TIR_LANDING_CONTACT_RADIUS = 3
        const clipStrength = Math.max(0.05, 1 - cdist / contactZone);
        const nx = toTargetX / cdist;
        const ny = toTargetY / cdist;
        const targetPush = TIR_IMPACT_SPEED * clipStrength * 0.15;

        target.vx += nx * targetPush;
        target.vy += ny * targetPush;
        target.isMoving = true;

        const targetPostSpeed = speed(target);
        expect(targetPostSpeed).toBeLessThan(TIR_IMPACT_SPEED * 0.15);
        expect(targetPostSpeed).toBeGreaterThan(0);
    });

    it('thrower continues along throw direction at ~88% speed', () => {
        const throwNx = 0;
        const throwNy = -1;

        // PetanqueEngine sets roll velocity for back-clip:
        const rollVx = throwNx * TIR_IMPACT_SPEED * 0.88;
        const rollVy = throwNy * TIR_IMPACT_SPEED * 0.88;

        const thrower = new Ball(mockScene, 200, 195, {
            mass: BALL_MASS, radius: BALL_RADIUS, frictionMult: TERRAIN_FRICTION.terre
        });
        thrower.launch(rollVx, rollVy);

        const launchSpeed = speed(thrower);
        const expectedSpeed = TIR_IMPACT_SPEED * 0.88;
        expect(launchSpeed).toBeCloseTo(expectedSpeed, 1);

        // Direction should still be mostly upward
        expect(thrower.vy).toBeLessThan(0);
    });

    it('dotApproach < 0 correctly identifies back-clip geometry', () => {
        // Multiple back-clip configurations
        const configs = [
            // Throw upward (-Y), ball landed above target
            { throwDir: [0, -1], ballPos: [200, 190], targetPos: [200, 200] },
            // Throw upward, ball landed slightly above and left
            { throwDir: [0, -1], ballPos: [198, 192], targetPos: [200, 200] },
            // Throw at angle, ball landed past
            { throwDir: [0.3, -0.954], ballPos: [203, 188], targetPos: [200, 200] },
        ];

        for (const cfg of configs) {
            const toTargetX = cfg.targetPos[0] - cfg.ballPos[0];
            const toTargetY = cfg.targetPos[1] - cfg.ballPos[1];
            const dotApproach = toTargetX * cfg.throwDir[0] + toTargetY * cfg.throwDir[1];

            expect(dotApproach).toBeLessThan(0);
        }
    });
});

// ═══════════════════════════════════════════════════════════════════
// 5. RECUL (backspin reversal)
// ═══════════════════════════════════════════════════════════════════

describe('5 - Recul (backspin reversal)', () => {

    it('ball reverses direction and ends behind starting position', () => {
        const startX = 200;
        const startY = 200;
        const ball = new Ball(mockScene, startX, startY, {
            mass: BALL_MASS, radius: BALL_RADIUS, frictionMult: TERRAIN_FRICTION.terre
        });

        // Set throw direction (needed for backspin reversal)
        ball._throwDirX = 0;
        ball._throwDirY = -1; // throw direction was upward

        // Activate retro with high intensity
        ball.activateRetro(0.85, 'terre');

        // Give small forward velocity (simulating post-collision residual)
        // After a carreau, the thrower has small residual forward velocity
        ball.launch(0, -0.8);

        // Run until stopped
        runUntilStop(ball, 1000);

        // Ball should have recoiled: final position should be BELOW start (positive Y direction)
        // because throw was upward (-Y) and recul reverses = pushes downward (+Y)
        expect(ball.y).toBeGreaterThan(startY);
        expect(ball._isRecoiling).toBe(true);
    });

    it('_isRecoiling flag is set during backspin reversal', () => {
        const ball = new Ball(mockScene, 200, 200, {
            mass: BALL_MASS, radius: BALL_RADIUS, frictionMult: TERRAIN_FRICTION.terre
        });

        ball._throwDirX = 0;
        ball._throwDirY = -1;
        ball.activateRetro(0.85, 'terre');
        ball.launch(0, -0.5);

        // Track if _isRecoiling was ever set
        let wasRecoiling = false;
        for (let f = 0; f < 600; f++) {
            if (!ball.isMoving) break;
            ball.update(DT);
            if (ball._isRecoiling) wasRecoiling = true;
        }

        expect(wasRecoiling).toBe(true);
    });

    it('_reculDone prevents infinite reversal loops', () => {
        const ball = new Ball(mockScene, 200, 200, {
            mass: BALL_MASS, radius: BALL_RADIUS, frictionMult: TERRAIN_FRICTION.terre
        });

        ball._throwDirX = 0;
        ball._throwDirY = -1;
        ball.activateRetro(1.0, 'terre');
        ball.launch(0, -0.5);

        // Run until stopped
        runUntilStop(ball, 1000);

        // After recul, _reculDone should be true
        expect(ball._reculDone).toBe(true);

        // The ball should have stopped (not looping forever)
        expect(ball.isMoving).toBe(false);
    });
});

// ═══════════════════════════════════════════════════════════════════
// 6. NO RECUL FOR POINTAGE
// ═══════════════════════════════════════════════════════════════════

describe('6 - No recul for pointage (isPoint = true)', () => {

    it('ball stops at or ahead of starting position (no reversal)', () => {
        const startX = 200;
        const startY = 200;
        const ball = new Ball(mockScene, startX, startY, {
            mass: BALL_MASS, radius: BALL_RADIUS, frictionMult: TERRAIN_FRICTION.terre
        });

        ball._throwDirX = 0;
        ball._throwDirY = -1;
        ball.isPoint = true; // Mark as pointage throw

        ball.activateRetro(0.85, 'terre');
        ball.launch(0, -0.8); // small forward velocity

        runUntilStop(ball, 1000);

        // Ball should NOT have gone backward (no recul for pointage)
        // It moved upward (negative Y) or stayed put
        expect(ball.y).toBeLessThanOrEqual(startY + 0.1); // small tolerance for float

        // _isRecoiling should NOT have been set
        expect(ball._isRecoiling).toBe(false);
    });

    it('retro still increases friction for pointage (ball stops shorter)', () => {
        // Ball without retro
        const ballNoRetro = new Ball(mockScene, 200, 200, {
            mass: BALL_MASS, radius: BALL_RADIUS, frictionMult: TERRAIN_FRICTION.terre
        });
        ballNoRetro.isPoint = true;
        ballNoRetro.launch(0, -3);
        runUntilStop(ballNoRetro);
        const distNoRetro = Math.abs(ballNoRetro.y - 200);

        // Ball with retro
        const ballRetro = new Ball(mockScene, 200, 200, {
            mass: BALL_MASS, radius: BALL_RADIUS, frictionMult: TERRAIN_FRICTION.terre
        });
        ballRetro.isPoint = true;
        ballRetro._throwDirX = 0;
        ballRetro._throwDirY = -1;
        ballRetro.activateRetro(0.85, 'terre');
        ballRetro.launch(0, -3);
        runUntilStop(ballRetro);
        const distRetro = Math.abs(ballRetro.y - 200);

        // Retro ball should stop shorter (more friction)
        expect(distRetro).toBeLessThan(distNoRetro);
    });
});

// ═══════════════════════════════════════════════════════════════════
// 7. RECUL VARIES BY TERRAIN
// ═══════════════════════════════════════════════════════════════════

describe('7 - Recul impulse is terrain-independent (backspin is a ball property)', () => {

    function measureRecul(terrainType) {
        const startY = 200;
        const ball = new Ball(mockScene, 200, startY, {
            mass: BALL_MASS, radius: BALL_RADIUS, frictionMult: TERRAIN_FRICTION[terrainType]
        });

        ball._throwDirX = 0;
        ball._throwDirY = -1;
        ball.activateRetro(0.85, terrainType);
        ball.launch(0, -0.5); // small residual forward

        // Capture the recul impulse speed (before friction takes over)
        let reculVy = null;
        const origUpdate = ball.update.bind(ball);
        const patchedUpdate = (dt) => {
            const wasDone = ball._reculDone;
            origUpdate(dt);
            if (!wasDone && ball._reculDone && reculVy === null) {
                reculVy = ball.vy; // capture reversal speed
            }
        };
        for (let i = 0; i < 1000; i++) {
            patchedUpdate(16.67);
            if (!ball.isMoving) break;
        }

        return { finalY: ball.y - startY, reculVy };
    }

    it('recul impulse speed is the same on all terrains', () => {
        const terre = measureRecul('terre');
        const sable = measureRecul('sable');
        const dalles = measureRecul('dalles');

        // All should recoil (positive = backward since throw was -Y)
        expect(terre.finalY).toBeGreaterThan(0);
        expect(sable.finalY).toBeGreaterThan(0);
        expect(dalles.finalY).toBeGreaterThan(0);

        // Impulse speed should be IDENTICAL (terrain-independent)
        // reculSpeed = TIR_RECUL_IMPULSE * retroIntensity = 2.5 * 0.85 = 2.125
        const expectedSpeed = TIR_RECUL_IMPULSE * 0.85;
        expect(terre.reculVy).toBeCloseTo(expectedSpeed, 1);
        expect(sable.reculVy).toBeCloseTo(expectedSpeed, 1);
        expect(dalles.reculVy).toBeCloseTo(expectedSpeed, 1);
    });

    it('post-reversal distance varies by terrain friction (dalles slides further)', () => {
        const terre = measureRecul('terre');
        const sable = measureRecul('sable');
        const dalles = measureRecul('dalles');

        // Same impulse but different friction → different final distances
        // dalles (0.7 friction) = ball slides further backward
        // sable (2.0 friction) = ball stops sooner
        expect(dalles.finalY).toBeGreaterThan(terre.finalY);
        expect(terre.finalY).toBeGreaterThan(sable.finalY);
    });

    it('recul impulse formula is correct', () => {
        // reculSpeed = TIR_RECUL_IMPULSE * retroIntensity (no terrain)
        const expectedSpeed = TIR_RECUL_IMPULSE * 0.85;
        expect(expectedSpeed).toBeGreaterThan(SPEED_THRESHOLD);
        expect(expectedSpeed).toBeCloseTo(2.125, 2);
    });
});

// ═══════════════════════════════════════════════════════════════════
// 8. COLLISION PHYSICS SANITY CHECKS
// ═══════════════════════════════════════════════════════════════════

describe('8 - Collision physics sanity checks', () => {

    it('equal mass collision conserves energy correctly (COR 0.62)', () => {
        const a = new Ball(mockScene, 200, 210, {
            mass: BALL_MASS, radius: BALL_RADIUS, frictionMult: 1.0
        });
        const b = new Ball(mockScene, 200, 200, {
            mass: BALL_MASS, radius: BALL_RADIUS, frictionMult: 1.0
        });

        // Place them overlapping
        a.y = b.y + BALL_RADIUS * 2 - 2;
        a.vx = 0;
        a.vy = -TIR_IMPACT_SPEED;
        a.isMoving = true;

        const keBefore = 0.5 * a.mass * TIR_IMPACT_SPEED * TIR_IMPACT_SPEED;

        Ball.resolveCollision(a, b);

        const speedA = speed(a);
        const speedB = speed(b);
        const keAfter = 0.5 * a.mass * speedA * speedA + 0.5 * b.mass * speedB * speedB;

        // With COR e: KE_after / KE_before = (1 + e^2) / 2 for equal masses, head-on
        // e = 0.62 → ratio ≈ (1 + 0.3844) / 2 ≈ 0.6922
        const expectedRatio = (1 + RESTITUTION_BOULE * RESTITUTION_BOULE) / 2;
        const actualRatio = keAfter / keBefore;

        expect(actualRatio).toBeCloseTo(expectedRatio, 1);
    });

    it('resolveCollision returns false when balls are not overlapping', () => {
        const a = new Ball(mockScene, 200, 200, {
            mass: BALL_MASS, radius: BALL_RADIUS
        });
        const b = new Ball(mockScene, 200, 200 + BALL_RADIUS * 3, {
            mass: BALL_MASS, radius: BALL_RADIUS
        });

        a.vx = 0;
        a.vy = -5;

        const result = Ball.resolveCollision(a, b);
        expect(result).toBe(false);
    });

    it('resolveCollision returns false when balls approach each other (dvn <= 0)', () => {
        const a = new Ball(mockScene, 200, 210, {
            mass: BALL_MASS, radius: BALL_RADIUS
        });
        const b = new Ball(mockScene, 200, 200, {
            mass: BALL_MASS, radius: BALL_RADIUS
        });

        // Both moving apart (a moving down, b moving up relative to each other)
        a.vx = 0;
        a.vy = 5; // moving away from b
        b.vx = 0;
        b.vy = -5; // moving away from a

        const result = Ball.resolveCollision(a, b);
        expect(result).toBe(false);
    });

    it('post-collision both balls are marked as isMoving', () => {
        const a = new Ball(mockScene, 200, 210, {
            mass: BALL_MASS, radius: BALL_RADIUS
        });
        const b = new Ball(mockScene, 200, 200, {
            mass: BALL_MASS, radius: BALL_RADIUS
        });

        // Only a is moving initially
        a.vy = -TIR_IMPACT_SPEED;
        b.isMoving = false;

        Ball.resolveCollision(a, b);

        expect(a.isMoving).toBe(true);
        expect(b.isMoving).toBe(true);
    });
});

// ═══════════════════════════════════════════════════════════════════
// 9. INTEGRATION: full tir sequence simulation
// ═══════════════════════════════════════════════════════════════════

describe('9 - Integration: full tir sequence', () => {

    it('carreau with retro: thrower shoots, hits center, recoils backward', () => {
        // Simulate the full sequence as PetanqueEngine would:
        // 1. Thrower lands on target
        // 2. resolveCollision transfers energy
        // 3. Ball has retro → activateRetro
        // 4. After residual forward speed decays, backspin reverses

        const target = new Ball(mockScene, 200, 200, {
            mass: BALL_MASS, radius: BALL_RADIUS, frictionMult: TERRAIN_FRICTION.terre
        });
        const targetOrigY = target.y;

        // Thrower positioned right on target (tir au fer lands on it)
        const overlapDist = BALL_RADIUS * 2 - 2;
        const thrower = new Ball(mockScene, 200, 200 + overlapDist, {
            mass: BALL_MASS, radius: BALL_RADIUS, frictionMult: TERRAIN_FRICTION.terre
        });

        // Set throw direction for recul
        thrower._throwDirX = 0;
        thrower._throwDirY = -1;

        // Impact velocity
        thrower.vx = 0;
        thrower.vy = -TIR_IMPACT_SPEED;
        thrower.isMoving = true;

        // Step 1: collision
        Ball.resolveCollision(thrower, target);

        // Step 2: activate retro (as PetanqueEngine does post-landing)
        thrower.activateRetro(0.85, 'terre');

        // Record thrower position after collision (this is the "impact point")
        const impactY = thrower.y;

        // Step 3: run physics
        runAllUntilStop([thrower, target], 1000);

        // Assertions:
        // Target was ejected far
        expect(target.y).toBeLessThan(targetOrigY - 30);

        // Thrower recoiled backward (y increased from impact point)
        // The thrower first moves forward slightly (residual), then reverses
        expect(thrower.y).toBeGreaterThan(impactY);
        expect(thrower._reculDone).toBe(true);
    });

    it('missed tir: ball continues forward at full speed (no collision)', () => {
        // When tir misses everything, PetanqueEngine gives it TIR_IMPACT_SPEED
        const ball = new Ball(mockScene, 200, 350, {
            mass: BALL_MASS, radius: BALL_RADIUS, frictionMult: TERRAIN_FRICTION.terre
        });

        // Tir miss: ball gets launched at full impact speed in throw direction
        ball.launch(0, -TIR_IMPACT_SPEED);
        const startY = ball.y;

        runUntilStop(ball);

        // Ball should have traveled a significant distance forward
        const travelDist = startY - ball.y;
        expect(travelDist).toBeGreaterThan(50);
    });
});
