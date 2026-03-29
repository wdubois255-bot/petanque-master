/**
 * ENGINE COMBAT TESTS — Phase 1 QA-1
 * Physique des boules, cochonnet, collisions, rebonds.
 * Zéro tolérance : 0 boule stoppée, cochonnet < 20% sorties, COR respecté.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    FRICTION_BASE, SPEED_THRESHOLD, RESTITUTION_BOULE, RESTITUTION_COCHONNET,
    BALL_RADIUS, BALL_MASS, COCHONNET_RADIUS, COCHONNET_MASS,
    COCHONNET_MAX_SPEED_TIR, COCHONNET_MAX_SPEED_POINT,
    TERRAIN_FRICTION, TERRAIN_HEIGHT,
    THROW_RANGE_FACTOR, THROW_RANGE_FACTOR_TIR, TERRAIN_ROLL_COMPENSATION,
    LOFT_DEMI_PORTEE, LOFT_PLOMBEE, LOFT_TIR,
    TIR_IMPACT_SPEED, MIN_IMPACT_SPEED,
    MAX_THROW_SPEED, WALL_RESTITUTION,
    puissanceMultiplier
} from '../src/utils/Constants.js';

// ── Mock scene (headless, no Phaser) ──────────────────────────────
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

// ── Helpers ───────────────────────────────────────────────────────
const DT = 1000 / 60; // 16.67ms

function computeRollSpeed(power, loftPreset, frictionMult, puiStat = 6) {
    const isTir = loftPreset.id === 'tir';
    const puiMult = puissanceMultiplier(puiStat);
    const maxDist = TERRAIN_HEIGHT * (isTir ? THROW_RANGE_FACTOR_TIR : THROW_RANGE_FACTOR) * puiMult;
    const totalDist = power * maxDist;
    const rollDist = totalDist * (1 - loftPreset.landingFactor);
    const compensated = FRICTION_BASE * Math.pow(frictionMult, TERRAIN_ROLL_COMPENSATION);
    if (loftPreset.flyOnly) return 0;
    return Math.sqrt(2 * compensated * rollDist * loftPreset.rollEfficiency);
}

function launchBallForPreset(power, loftPreset, frictionMult, puiStat = 6) {
    const speed = computeRollSpeed(power, loftPreset, frictionMult, puiStat);
    const isTir = loftPreset.id === 'tir';
    // Tir au fer: miss safety gives TIR_IMPACT_SPEED
    const finalSpeed = isTir ? TIR_IMPACT_SPEED : speed;
    const ball = new Ball(mockScene, 200, 400, { frictionMult });
    ball.launch(0, -finalSpeed); // throw upward (typical)
    return ball;
}

function simulateUntilStop(ball, maxFrames = 800) {
    const frames = [];
    const startX = ball.x, startY = ball.y;
    for (let i = 0; i < maxFrames && ball.isMoving; i++) {
        const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
        frames.push({ x: ball.x, y: ball.y, speed, frame: i });
        ball.update(DT);
    }
    const dx = ball.x - startX, dy = ball.y - startY;
    return { frames, distance: Math.sqrt(dx * dx + dy * dy), finalX: ball.x, finalY: ball.y };
}

const TERRAINS = Object.entries(TERRAIN_FRICTION).map(([k, v]) => ({ id: k, friction: v }));
const POINTER_PRESETS = [LOFT_DEMI_PORTEE, LOFT_PLOMBEE];
const ALL_PRESETS = [LOFT_DEMI_PORTEE, LOFT_PLOMBEE, LOFT_TIR];

// ═══════════════════════════════════════════════════════════════════
// 1A. TRAJECTOIRE COMPLÈTE SANS INTERRUPTION
// ═══════════════════════════════════════════════════════════════════

describe('1A — Trajectoire complète sans interruption', () => {

    for (const preset of ALL_PRESETS) {
        it(`${preset.label} : la boule ne s'arrête jamais brutalement (décélération progressive)`, () => {
            for (let power = 0.3; power <= 1.0; power += 0.1) {
                const ball = launchBallForPreset(power, preset, TERRAIN_FRICTION.terre);
                const { frames } = simulateUntilStop(ball);

                // Vérifie qu'il n'y a jamais de chute de vitesse > 80% en une frame
                for (let i = 1; i < frames.length; i++) {
                    if (frames[i].speed > SPEED_THRESHOLD && frames[i - 1].speed > SPEED_THRESHOLD) {
                        const dropRatio = frames[i].speed / frames[i - 1].speed;
                        expect(dropRatio).toBeGreaterThan(0.2,
                            `${preset.label} power=${power.toFixed(1)} frame=${i}: chute brutale ${frames[i-1].speed.toFixed(2)} → ${frames[i].speed.toFixed(2)}`
                        );
                    }
                }
            }
        });
    }

    it('seuil d\'arrêt SPEED_THRESHOLD est suffisamment bas pour éviter un stop visuel abrupt', () => {
        // À 0.3 px/frame, la boule parcourt ~5px/sec — quasi-invisible
        expect(SPEED_THRESHOLD).toBeLessThanOrEqual(0.5);
        expect(SPEED_THRESHOLD).toBeGreaterThan(0);
    });

    for (const preset of POINTER_PRESETS) {
        for (const terrain of TERRAINS) {
            it(`${preset.label} sur ${terrain.id} : boule roule > 5px à power 0.3`, () => {
                const ball = launchBallForPreset(0.3, preset, terrain.friction);
                const { distance } = simulateUntilStop(ball);
                expect(distance).toBeGreaterThan(5,
                    `${preset.label} ${terrain.id}: distance=${distance.toFixed(1)}px — arrêt quasi-immédiat`
                );
            });
        }
    }

    it('500 lancers aléatoires : 0 cas de boule stoppée prématurément', () => {
        let stoppedEarly = 0;
        const failures = [];

        for (let i = 0; i < 500; i++) {
            const power = 0.3 + Math.random() * 0.7;
            const preset = ALL_PRESETS[Math.floor(Math.random() * ALL_PRESETS.length)];
            const terrain = TERRAINS[Math.floor(Math.random() * TERRAINS.length)];

            const ball = launchBallForPreset(power, preset, terrain.friction);
            const { distance, frames } = simulateUntilStop(ball);

            // Minimum 3 frames of rolling (flight is separate)
            if (frames.length < 3) {
                stoppedEarly++;
                failures.push(`${preset.label} p=${power.toFixed(2)} ${terrain.id}: ${frames.length} frames, ${distance.toFixed(1)}px`);
            }
        }

        expect(stoppedEarly).toBe(0,
            `${stoppedEarly}/500 lancers stoppés prématurément:\n${failures.slice(0, 5).join('\n')}`
        );
    });
});

// ═══════════════════════════════════════════════════════════════════
// 1B. COCHONNET — POIDS ET SORTIES
// ═══════════════════════════════════════════════════════════════════

describe('1B — Cochonnet poids et sorties', () => {

    it('cochonnet a une masse réaliste (10-50g)', () => {
        expect(COCHONNET_MASS).toBeGreaterThanOrEqual(10);
        expect(COCHONNET_MASS).toBeLessThanOrEqual(50);
    });

    it('cochonnet COR cohérent avec son poids (< COR boule-boule)', () => {
        expect(RESTITUTION_COCHONNET).toBeLessThanOrEqual(RESTITUTION_BOULE);
        expect(RESTITUTION_COCHONNET).toBeGreaterThan(0.3);
    });

    it('cochonnet speed cap tir est raisonnable (pas trop haut)', () => {
        expect(COCHONNET_MAX_SPEED_TIR).toBeLessThanOrEqual(12);
        expect(COCHONNET_MAX_SPEED_TIR).toBeGreaterThan(3);
    });

    it('cochonnet speed cap point est inférieur au cap tir', () => {
        expect(COCHONNET_MAX_SPEED_POINT).toBeLessThan(COCHONNET_MAX_SPEED_TIR);
    });

    it('200 tirs au fer sur cochonnet : < 20% de sorties terrain', () => {
        const bounds = { x: 100, y: 50, w: 180, h: 420 };
        let exits = 0;

        for (let i = 0; i < 200; i++) {
            // Cochonnet au centre du terrain (loin des bords)
            const cochonnet = new Ball(mockScene, bounds.x + bounds.w / 2, bounds.y + bounds.h * 0.5, {
                mass: COCHONNET_MASS, radius: COCHONNET_RADIUS, frictionMult: TERRAIN_FRICTION.terre
            });
            // Boule tirée arrive d'en bas, overlap avec le cochonnet
            const boule = new Ball(mockScene,
                cochonnet.x + (Math.random() - 0.5) * 4,
                cochonnet.y + BALL_RADIUS + COCHONNET_RADIUS - 2,
                { mass: BALL_MASS, radius: BALL_RADIUS }
            );
            // Tir au fer = TIR_IMPACT_SPEED dirigé vers le haut
            boule.launch(
                (Math.random() - 0.5) * 1.0,
                -TIR_IMPACT_SPEED
            );

            Ball.resolveCollision(boule, cochonnet);

            // Cap cochonnet speed (reproduit PetanqueEngine behavior)
            const cSpeed = Math.sqrt(cochonnet.vx ** 2 + cochonnet.vy ** 2);
            if (cSpeed > COCHONNET_MAX_SPEED_TIR) {
                const ratio = COCHONNET_MAX_SPEED_TIR / cSpeed;
                cochonnet.vx *= ratio;
                cochonnet.vy *= ratio;
            }

            // Simulate until stop
            cochonnet.isMoving = true;
            for (let f = 0; f < 600 && cochonnet.isMoving; f++) {
                cochonnet.update(DT);
            }

            if (cochonnet.checkOutOfBounds(bounds)) exits++;
        }

        const exitRate = exits / 200;
        expect(exitRate).toBeLessThan(0.20,
            `Cochonnet sort ${(exitRate * 100).toFixed(1)}% des tirs (cible < 20%)`
        );
    });

    it('cochonnet reste en jeu après collision demi-portée (pointage doux)', () => {
        const bounds = { x: 100, y: 50, w: 180, h: 420 };
        let exits = 0;

        for (let i = 0; i < 100; i++) {
            const cochonnet = new Ball(mockScene, bounds.x + bounds.w / 2, bounds.y + bounds.h * 0.4, {
                mass: COCHONNET_MASS, radius: COCHONNET_RADIUS
            });
            const boule = new Ball(mockScene,
                cochonnet.x, cochonnet.y + BALL_RADIUS + COCHONNET_RADIUS - 2,
                { mass: BALL_MASS, radius: BALL_RADIUS }
            );
            boule.isPoint = true; // pointage → COCHONNET_POINT_DAMPING
            const rollSpeed = computeRollSpeed(0.5 + Math.random() * 0.3, LOFT_DEMI_PORTEE, TERRAIN_FRICTION.terre);
            boule.launch(0, -rollSpeed);

            Ball.resolveCollision(boule, cochonnet);

            // Cap cochonnet speed for point
            const cSpeed = Math.sqrt(cochonnet.vx ** 2 + cochonnet.vy ** 2);
            if (cSpeed > COCHONNET_MAX_SPEED_POINT) {
                const ratio = COCHONNET_MAX_SPEED_POINT / cSpeed;
                cochonnet.vx *= ratio;
                cochonnet.vy *= ratio;
            }

            cochonnet.isMoving = true;
            cochonnet.frictionMult = TERRAIN_FRICTION.terre;
            for (let f = 0; f < 600 && cochonnet.isMoving; f++) {
                cochonnet.update(DT);
            }

            if (cochonnet.checkOutOfBounds(bounds)) exits++;
        }

        expect(exits / 100).toBeLessThan(0.05,
            `Cochonnet sort ${exits}% après pointage (devrait être quasi-0)`
        );
    });
});

// ═══════════════════════════════════════════════════════════════════
// 1C. COLLISIONS
// ═══════════════════════════════════════════════════════════════════

describe('1C — Collisions', () => {

    it('deux boules se percutent : les deux se déplacent', () => {
        const a = new Ball(mockScene, 100, 200, { mass: BALL_MASS });
        const b = new Ball(mockScene, 100 + BALL_RADIUS * 2 - 2, 200, { mass: BALL_MASS });
        a.launch(5, 0);

        Ball.resolveCollision(a, b);

        expect(b.isMoving).toBe(true);
        expect(b.vx).toBeGreaterThan(0);
        // a should recoil (COR 0.62 → a gets ~19%)
        expect(Math.abs(a.vx)).toBeGreaterThan(0);
    });

    it('une boule ne traverse jamais une autre (séparation post-collision)', () => {
        for (let i = 0; i < 100; i++) {
            const a = new Ball(mockScene, 100, 200, { mass: BALL_MASS });
            const overlap = Math.random() * BALL_RADIUS; // random overlap
            const b = new Ball(mockScene, 100 + BALL_RADIUS * 2 - overlap, 200, { mass: BALL_MASS });
            a.launch(3 + Math.random() * 9, (Math.random() - 0.5) * 2);

            Ball.resolveCollision(a, b);

            const dist = Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
            expect(dist).toBeGreaterThanOrEqual(BALL_RADIUS * 2 - 2,
                `Traversée ! dist=${dist.toFixed(1)} < minDist=${BALL_RADIUS * 2}`
            );
        }
    });

    it('carreau au tir au fer : cible déplacée de manière satisfaisante', () => {
        const target = new Ball(mockScene, 200, 200, { mass: BALL_MASS });
        const targetOrigX = target.x;
        const targetOrigY = target.y;
        const shooter = new Ball(mockScene, 200, 200 + BALL_RADIUS * 2 - 2, { mass: BALL_MASS });
        shooter.launch(0, -TIR_IMPACT_SPEED);

        Ball.resolveCollision(shooter, target);

        // Simulate target rolling
        target.isMoving = true;
        target.frictionMult = TERRAIN_FRICTION.terre;
        for (let f = 0; f < 300 && target.isMoving; f++) {
            target.update(DT);
        }

        const displacement = Math.sqrt(
            (target.x - targetOrigX) ** 2 + (target.y - targetOrigY) ** 2
        );
        // Carreau should move target at least 30px
        expect(displacement).toBeGreaterThan(30,
            `Cible déplacée de seulement ${displacement.toFixed(1)}px — pas satisfaisant`
        );
    });

    it('conservation d\'énergie : pas d\'énergie créée (boule-boule)', () => {
        for (let trial = 0; trial < 50; trial++) {
            const a = new Ball(mockScene, 100, 200, { mass: BALL_MASS });
            const b = new Ball(mockScene, 100 + BALL_RADIUS * 2 - 1, 200, { mass: BALL_MASS });
            const v0 = 3 + Math.random() * 9;
            a.launch(v0, 0);

            const keBefore = 0.5 * a.mass * v0 * v0;

            Ball.resolveCollision(a, b);

            const speedA = Math.sqrt(a.vx ** 2 + a.vy ** 2);
            const speedB = Math.sqrt(b.vx ** 2 + b.vy ** 2);
            const keAfter = 0.5 * a.mass * speedA * speedA + 0.5 * b.mass * speedB * speedB;

            // COR < 1 → keAfter < keBefore (energy lost, never gained)
            expect(keAfter).toBeLessThanOrEqual(keBefore * 1.01,
                `Énergie créée ! KE avant=${keBefore.toFixed(0)} après=${keAfter.toFixed(0)}`
            );
        }
    });

    it('conservation d\'énergie : pas d\'énergie créée (boule-cochonnet)', () => {
        for (let trial = 0; trial < 50; trial++) {
            const boule = new Ball(mockScene, 100, 200, { mass: BALL_MASS, radius: BALL_RADIUS });
            const cochonnet = new Ball(mockScene, 100 + BALL_RADIUS + COCHONNET_RADIUS - 1, 200, {
                mass: COCHONNET_MASS, radius: COCHONNET_RADIUS
            });
            const v0 = 2 + Math.random() * 10;
            boule.launch(v0, 0);

            const keBefore = 0.5 * boule.mass * v0 * v0;

            Ball.resolveCollision(boule, cochonnet);

            const speedB = Math.sqrt(boule.vx ** 2 + boule.vy ** 2);
            const speedC = Math.sqrt(cochonnet.vx ** 2 + cochonnet.vy ** 2);
            const keAfter = 0.5 * boule.mass * speedB * speedB + 0.5 * cochonnet.mass * speedC * speedC;

            // Note: cochonnet speed cap can reduce energy further, but never create it
            expect(keAfter).toBeLessThanOrEqual(keBefore * 1.01,
                `Énergie créée ! KE avant=${keBefore.toFixed(0)} après=${keAfter.toFixed(0)}`
            );
        }
    });
});

// ═══════════════════════════════════════════════════════════════════
// 1D. REBONDS ET SURFACE
// ═══════════════════════════════════════════════════════════════════

describe('1D — Rebonds et surface', () => {

    it('COR acier 0.62 est bien appliqué (boule-boule)', () => {
        const a = new Ball(mockScene, 100, 200, { mass: BALL_MASS });
        const b = new Ball(mockScene, 100 + BALL_RADIUS * 2 - 1, 200, { mass: BALL_MASS });
        a.launch(6, 0);

        Ball.resolveCollision(a, b);

        // Masses égales + COR 0.62 → b reçoit (1+e)/2 * v = 0.81v
        const ratio = b.vx / 6;
        expect(ratio).toBeCloseTo(0.81, 1);
    });

    it('boule perd de l\'énergie à chaque collision (pas de rebond infini)', () => {
        // Simuler plusieurs collisions consécutives
        let speed = 8;
        for (let i = 0; i < 5; i++) {
            const a = new Ball(mockScene, 100, 200, { mass: BALL_MASS });
            const b = new Ball(mockScene, 100 + BALL_RADIUS * 2 - 1, 200, { mass: BALL_MASS });
            a.launch(speed, 0);

            Ball.resolveCollision(a, b);

            const newSpeed = Math.sqrt(b.vx ** 2 + b.vy ** 2);
            expect(newSpeed).toBeLessThan(speed);
            speed = newSpeed;
        }
        // After 5 collisions with COR 0.62: speed *= 0.81 each time
        // 8 * 0.81^5 ≈ 2.79. Speed decays but doesn't vanish instantly.
        expect(speed).toBeLessThan(4);
    });

    it('terrain influence la distance de roulement (sable < terre < dalles)', () => {
        const speeds = {};
        for (const terrain of TERRAINS) {
            const ball = new Ball(mockScene, 200, 400, { frictionMult: terrain.friction });
            ball.launch(0, -4);
            const { distance } = simulateUntilStop(ball);
            speeds[terrain.id] = distance;
        }

        // Sable absorbe plus que terre
        expect(speeds.sable).toBeLessThan(speeds.terre);
        // Terre absorbe plus que dalles
        expect(speeds.terre).toBeLessThan(speeds.dalles);
    });

    it('murs (terrain Docks) rebondissent avec WALL_RESTITUTION', () => {
        const bounds = { x: 100, y: 50, w: 180, h: 420 };
        const ball = new Ball(mockScene, bounds.x + 5, 250, {
            frictionMult: TERRAIN_FRICTION.dalles,
            terrain: { walls: true },
            bounds
        });
        ball.launch(-5, 0); // vers le mur gauche

        ball.update(DT);

        // Après rebond, vx devrait être positif (rebond)
        expect(ball.vx).toBeGreaterThan(0);
        // Vitesse réduite par WALL_RESTITUTION
        expect(ball.vx).toBeLessThan(5 * WALL_RESTITUTION + 0.5);
    });
});
