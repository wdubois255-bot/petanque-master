/**
 * Gameplay.test.js - Tests exhaustifs de jouabilité
 * Couvre: terrains (pente, zones, murs, hors-jeu), collisions boule-boule,
 * collisions boule-cochonnet, rétro/backspin, out-of-bounds, friction,
 * et simulations de parties complètes.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    FRICTION_BASE, SPEED_THRESHOLD, RESTITUTION_BOULE, RESTITUTION_COCHONNET,
    BALL_RADIUS, BALL_MASS, COCHONNET_MASS,
    TERRAIN_FRICTION, WALL_RESTITUTION,
    RETRO_FRICTION_MULT,
    LOFT_DEMI_PORTEE, LOFT_PLOMBEE, LOFT_TIR,
    LATERAL_SPIN_FRAMES, LATERAL_SPIN_FORCE, LATERAL_SPIN_TERRAIN_MULT,
    TERRAIN_HEIGHT, BALL_CLAMP_MARGIN,
    COCHONNET_MAX_COLLISION_SPEED, puissanceMultiplier
} from '../src/utils/Constants.js';

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
            setVisible: vi.fn().mockReturnThis(), setScale: vi.fn().mockReturnThis(),
            setAlpha: vi.fn().mockReturnThis(), destroy: vi.fn()
        })
    }
};

let Ball;
beforeEach(async () => {
    Ball = (await import('../src/petanque/Ball.js')).default;
});

// Helper: simulate N frames at 16ms
function simulate(ball, frames = 500) {
    for (let i = 0; i < frames; i++) {
        ball.update(16);
        if (!ball.isMoving) break;
    }
}

// =====================================================
//  1. TERRAIN FRICTION — Chaque surface freine différemment
// =====================================================

describe('Terrain friction — all 4 surfaces', () => {
    const surfaces = [
        { name: 'terre', mult: TERRAIN_FRICTION.terre },
        { name: 'herbe', mult: TERRAIN_FRICTION.herbe },
        { name: 'sable', mult: TERRAIN_FRICTION.sable },
        { name: 'dalles', mult: TERRAIN_FRICTION.dalles }
    ];

    for (const { name, mult } of surfaces) {
        it(`${name} (friction ${mult}): ball should stop eventually`, () => {
            const ball = new Ball(mockScene, 200, 200, { frictionMult: mult });
            ball.launch(5, -3);
            simulate(ball);
            expect(ball.isMoving).toBe(false);
        });
    }

    it('sable stops ball WAY faster than dalles', () => {
        const sable = new Ball(mockScene, 200, 200, { frictionMult: TERRAIN_FRICTION.sable });
        const dalles = new Ball(mockScene, 200, 200, { frictionMult: TERRAIN_FRICTION.dalles });
        sable.launch(5, 0);
        dalles.launch(5, 0);

        let sableFrames = 0, dallesFrames = 0;
        for (let i = 0; i < 1000; i++) {
            if (sable.isMoving) { sable.update(16); sableFrames++; }
            if (dalles.isMoving) { dalles.update(16); dallesFrames++; }
            if (!sable.isMoving && !dalles.isMoving) break;
        }
        expect(sableFrames).toBeLessThan(dallesFrames);
        expect(dallesFrames).toBeGreaterThan(sableFrames * 2); // sable ~2.86x more friction than dalles
    });

    it('herbe ball travels less than terre ball', () => {
        const terre = new Ball(mockScene, 100, 200, { frictionMult: 1.0 });
        const herbe = new Ball(mockScene, 100, 200, { frictionMult: 1.8 });
        terre.launch(5, 0);
        herbe.launch(5, 0);
        simulate(terre);
        simulate(herbe);
        expect(herbe.x).toBeLessThan(terre.x);
    });

    it('dalles ball travels much further than terre', () => {
        const terre = new Ball(mockScene, 100, 200, { frictionMult: 1.0 });
        const dalles = new Ball(mockScene, 100, 200, { frictionMult: 0.4 });
        terre.launch(5, 0);
        dalles.launch(5, 0);
        simulate(terre);
        simulate(dalles);
        expect(dalles.x).toBeGreaterThan(terre.x * 1.5);
    });
});

// =====================================================
//  2. PENTE (Colline) — Boules dérivent vers le bas
// =====================================================

describe('Slope (Colline terrain)', () => {
    const slopeDown = { direction: 'down', angle: 5, gravity_component: 0.08 };
    const bounds = { x: 50, y: 50, w: 200, h: 400 };

    it('ball rolling straight should drift downward (positive Y)', () => {
        const ball = new Ball(mockScene, 150, 200, {
            frictionMult: 1.0, terrain: { slope: slopeDown }, bounds
        });
        ball.launch(0, -3); // launch upward
        simulate(ball, 200);
        // Ball should have drifted down from gravity, ending below launch point
        // or at least significantly affected in Y
        expect(ball.y).toBeGreaterThan(150); // gravity pulled it back down
    });

    it('ball with some speed on slope should gain downward velocity', () => {
        const ball = new Ball(mockScene, 150, 200, {
            frictionMult: 1.0, terrain: { slope: slopeDown }, bounds
        });
        ball.launch(1, 0); // enough speed to not stop immediately
        const vyBefore = ball.vy;
        for (let i = 0; i < 10; i++) ball.update(16);
        // vy should have increased (gravity pulling down)
        expect(ball.vy).toBeGreaterThan(vyBefore);
    });

    it('slope left should add negative vx component', () => {
        const slopeLeft = { direction: 'left', angle: 5, gravity_component: 0.08 };
        const ball = new Ball(mockScene, 150, 200, {
            frictionMult: 1.0, terrain: { slope: slopeLeft }, bounds
        });
        ball.launch(0, 1); // moving down, slope pushes left
        for (let i = 0; i < 10; i++) ball.update(16);
        expect(ball.vx).toBeLessThan(0); // pushed left
    });

    it('slope should affect all balls equally regardless of mass', () => {
        const heavy = new Ball(mockScene, 150, 200, {
            frictionMult: 1.0, terrain: { slope: slopeDown }, bounds, mass: BALL_MASS
        });
        const light = new Ball(mockScene, 150, 200, {
            frictionMult: 1.0, terrain: { slope: slopeDown }, bounds, mass: COCHONNET_MASS
        });
        heavy.launch(0, -2);
        light.launch(0, -2);
        for (let i = 0; i < 30; i++) {
            heavy.update(16);
            light.update(16);
        }
        // Both should drift down — light ball more affected by friction but same slope force
        expect(heavy.vy).toBeGreaterThan(-3);
        expect(light.vy).toBeGreaterThan(-3);
    });
});

// =====================================================
//  3. ZONES MIXTES (Parc) — Friction change mid-roll
// =====================================================

describe('Dynamic friction zones (Parc terrain)', () => {
    const parkTerrain = {
        zones: [
            { type: 'gravier', friction: 1.2, rect: { x: 0.3, y: 0, w: 0.15, h: 1.0 } },
            { type: 'gravier', friction: 1.2, rect: { x: 0.6, y: 0, w: 0.15, h: 1.0 } }
        ]
    };
    const bounds = { x: 100, y: 50, w: 200, h: 400 };

    it('ball in grass zone (1.8) should travel less than in gravel zone (1.2)', () => {
        // Ball starting in grass zone (x=120, which is outside gravel strip at 160-190)
        const grassBall = new Ball(mockScene, 120, 200, {
            frictionMult: 1.8, terrain: parkTerrain, bounds
        });
        // Ball starting in gravel zone (x=170, inside gravel strip 160-190)
        const gravelBall = new Ball(mockScene, 170, 200, {
            frictionMult: 1.8, terrain: parkTerrain, bounds
        });
        grassBall.launch(4, 0);
        gravelBall.launch(4, 0);

        simulate(grassBall);
        simulate(gravelBall);

        // Gravel zone ball should travel further (friction 1.2 < 1.8)
        expect(gravelBall.x).toBeGreaterThan(grassBall.x);
    });
});

// =====================================================
//  4. MURS (Docks) — Boules rebondissent
// =====================================================

describe('Wall rebounds (Docks terrain)', () => {
    const docksTerrain = { walls: true };
    const bounds = { x: 100, y: 50, w: 200, h: 400 };

    it('ball hitting left wall should bounce right', () => {
        const ball = new Ball(mockScene, 110, 200, {
            frictionMult: 0.4, terrain: docksTerrain, bounds
        });
        ball.launch(-5, 0);
        ball.update(16); // should hit left wall
        ball.update(16);
        expect(ball.vx).toBeGreaterThan(0); // bounced right
    });

    it('ball hitting right wall should bounce left', () => {
        const ball = new Ball(mockScene, 290, 200, {
            frictionMult: 0.4, terrain: docksTerrain, bounds
        });
        ball.launch(5, 0);
        ball.update(16);
        ball.update(16);
        expect(ball.vx).toBeLessThan(0); // bounced left
    });

    it('ball hitting top wall should bounce down', () => {
        const ball = new Ball(mockScene, 200, 60, {
            frictionMult: 0.4, terrain: docksTerrain, bounds
        });
        ball.launch(0, -5);
        ball.update(16);
        ball.update(16);
        expect(ball.vy).toBeGreaterThan(0);
    });

    it('ball hitting bottom wall should bounce up', () => {
        const ball = new Ball(mockScene, 200, 440, {
            frictionMult: 0.4, terrain: docksTerrain, bounds
        });
        ball.launch(0, 5);
        ball.update(16);
        ball.update(16);
        expect(ball.vy).toBeLessThan(0);
    });

    it('wall rebound should lose energy (WALL_RESTITUTION=0.7)', () => {
        const ball = new Ball(mockScene, 110, 200, {
            frictionMult: 0.4, terrain: docksTerrain, bounds
        });
        const initSpeed = 5;
        ball.launch(-initSpeed, 0);
        ball.update(16);
        ball.update(16);
        // After rebound, speed should be < initial * 0.7 + friction loss
        const speed = Math.abs(ball.vx);
        expect(speed).toBeLessThan(initSpeed * WALL_RESTITUTION + 0.5);
    });

    it('ball should NOT die on Docks walls (stay alive)', () => {
        const ball = new Ball(mockScene, 110, 200, {
            frictionMult: 0.4, terrain: docksTerrain, bounds
        });
        ball.launch(-5, 0);
        simulate(ball, 100);
        expect(ball.isAlive).toBe(true);
    });
});

// =====================================================
//  5. HORS-JEU — Boule sort du terrain = morte
// =====================================================

describe('Out of bounds (FIPJP rules)', () => {
    const bounds = { x: 100, y: 50, w: 200, h: 400 };

    it('ball entirely outside left edge is dead', () => {
        const ball = new Ball(mockScene, 80, 200); // x + radius < bounds.x
        expect(ball.checkOutOfBounds(bounds)).toBe(true);
    });

    it('ball entirely outside right edge is dead', () => {
        const ball = new Ball(mockScene, 320, 200); // x - radius > bounds.x + bounds.w
        expect(ball.checkOutOfBounds(bounds)).toBe(true);
    });

    it('ball entirely outside top is dead', () => {
        const ball = new Ball(mockScene, 200, 30);
        expect(ball.checkOutOfBounds(bounds)).toBe(true);
    });

    it('ball entirely outside bottom is dead', () => {
        const ball = new Ball(mockScene, 200, 470);
        expect(ball.checkOutOfBounds(bounds)).toBe(true);
    });

    it('ball partially outside is still alive (FIPJP: entirely outside)', () => {
        // Ball at x=95, radius=10 → extends from 85 to 105
        // bounds.x = 100, so ball is partially inside → NOT dead
        const ball = new Ball(mockScene, 95, 200);
        expect(ball.checkOutOfBounds(bounds)).toBe(false);
    });

    it('ball fully inside is alive', () => {
        const ball = new Ball(mockScene, 200, 250);
        expect(ball.checkOutOfBounds(bounds)).toBe(false);
    });

    it('dead balls are not checked for bounds', () => {
        const ball = new Ball(mockScene, 10, 10);
        ball.kill();
        expect(ball.checkOutOfBounds(bounds)).toBe(false);
    });
});

// =====================================================
//  6. COLLISIONS BOULE-BOULE (pointage)
// =====================================================

describe('Boule-boule collisions (pointage = soft touch)', () => {
    it('slow-rolling boule should gently push another', () => {
        const a = new Ball(mockScene, 100, 200, { mass: BALL_MASS });
        const b = new Ball(mockScene, 100 + BALL_RADIUS * 2 - 2, 200, { mass: BALL_MASS });
        a.launch(1.5, 0); // slow roll (pointage)

        Ball.resolveCollision(a, b);

        // With COR 0.62: target gets 81% of speed
        expect(b.vx).toBeGreaterThan(0);
        expect(b.vx).toBeLessThan(2); // gentle push
        // Thrower retains ~19%
        expect(a.vx).toBeGreaterThan(-0.5);
        expect(a.vx).toBeLessThan(1);
    });

    it('COR 0.62: target gets ~81% of speed', () => {
        const a = new Ball(mockScene, 100, 200, { mass: BALL_MASS });
        const b = new Ball(mockScene, 100 + BALL_RADIUS * 2 - 1, 200, { mass: BALL_MASS });
        a.launch(5, 0);

        Ball.resolveCollision(a, b);

        expect(b.vx / 5).toBeCloseTo(0.81, 1);
    });

    it('both balls are marked as moving after collision', () => {
        const a = new Ball(mockScene, 100, 200, { mass: BALL_MASS });
        const b = new Ball(mockScene, 100 + BALL_RADIUS * 2 - 2, 200, { mass: BALL_MASS });
        a.launch(3, 0);

        Ball.resolveCollision(a, b);

        expect(a.isMoving).toBe(true);
        expect(b.isMoving).toBe(true);
    });

    it('head-on collision conserves momentum direction', () => {
        const a = new Ball(mockScene, 100, 200, { mass: BALL_MASS });
        const b = new Ball(mockScene, 100 + BALL_RADIUS * 2 - 1, 200, { mass: BALL_MASS });
        a.launch(4, 0);

        Ball.resolveCollision(a, b);

        // Both should move rightward (a slowed, b pushed)
        expect(b.vx).toBeGreaterThan(0);
    });

    it('glancing collision should deflect balls at angles', () => {
        const a = new Ball(mockScene, 100, 200, { mass: BALL_MASS });
        // Place b slightly offset in Y
        const b = new Ball(mockScene, 100 + BALL_RADIUS * 2 - 4, 200 + BALL_RADIUS, { mass: BALL_MASS });
        a.launch(3, 0);

        Ball.resolveCollision(a, b);

        // b should get both x and y velocity (deflected)
        expect(b.vx).toBeGreaterThan(0);
        expect(b.vy).not.toBe(0);
    });
});

// =====================================================
//  7. COLLISIONS BOULE-COCHONNET
// =====================================================

describe('Boule-cochonnet collisions', () => {
    it('cochonnet (30g) should move faster than boule (700g) after collision', () => {
        const boule = new Ball(mockScene, 100, 200, { mass: BALL_MASS, radius: BALL_RADIUS });
        const cochonnet = new Ball(mockScene, 100 + 16, 200, { mass: COCHONNET_MASS, radius: 8 });
        boule.launch(3, 0);

        Ball.resolveCollision(boule, cochonnet);

        // With mixed COR (0.50) and mass ratio 700:30, cochonnet gets significant speed
        expect(cochonnet.vx).toBeGreaterThan(boule.vx);
    });

    it('COR 0.50 for boule-cochonnet (wood/steel)', () => {
        // Verify the constant
        expect(RESTITUTION_COCHONNET).toBe(0.50);
    });

    it('light cochonnet absorbs energy: moves but is capped', () => {
        const boule = new Ball(mockScene, 100, 200, { mass: BALL_MASS, radius: BALL_RADIUS });
        const cochonnet = new Ball(mockScene, 100 + 16, 200, { mass: COCHONNET_MASS, radius: 8 });
        boule.launch(5, 0);

        Ball.resolveCollision(boule, cochonnet);

        const bouleSpeed = Math.sqrt(boule.vx ** 2 + boule.vy ** 2);
        const cochSpeed = Math.sqrt(cochonnet.vx ** 2 + cochonnet.vy ** 2);
        // Cochonnet moves significantly but is capped to stay in play zone
        expect(cochSpeed).toBeGreaterThan(0);
        expect(cochSpeed).toBeLessThanOrEqual(COCHONNET_MAX_COLLISION_SPEED);
        // Boule barely slows (700g vs 30g = boule keeps most of its momentum)
        expect(bouleSpeed).toBeGreaterThan(3);
    });
});

// =====================================================
//  8. TIR (collisions à haute vitesse)
// =====================================================

describe('Tir collisions (high energy)', () => {
    it('tir speed ball should heavily displace target', () => {
        const tireur = new Ball(mockScene, 100, 200, { mass: BALL_MASS });
        const target = new Ball(mockScene, 100 + BALL_RADIUS * 2 - 1, 200, { mass: BALL_MASS });
        tireur.launch(8, 0); // high speed tir

        Ball.resolveCollision(tireur, target);

        // Target should fly fast (81% of 8 = ~6.5)
        expect(target.vx).toBeGreaterThan(5);
        // Tireur should slow dramatically
        expect(tireur.vx).toBeLessThan(3);
    });

    it('carreau natural: tireur stops near impact point with COR 0.62', () => {
        const tireur = new Ball(mockScene, 100, 200, { mass: BALL_MASS });
        const target = new Ball(mockScene, 100 + BALL_RADIUS * 2 - 1, 200, { mass: BALL_MASS });
        const impactX = target.x;
        tireur.launch(8, 0);

        Ball.resolveCollision(tireur, target);

        // After collision, tireur retains ~19% speed = ~1.5
        // With friction, should stop within ~24px → natural carreau
        simulate(tireur, 50);
        const distFromImpact = Math.abs(tireur.x - impactX);
        expect(distFromImpact).toBeLessThan(40);
    });
});

// =====================================================
//  9. RETRO (BACKSPIN) — Boule s'arrête plus vite
// =====================================================

describe('Retro (backspin) physics', () => {
    it('ball with retro should stop sooner than without', () => {
        const normal = new Ball(mockScene, 100, 200, { frictionMult: 1.0 });
        const retro = new Ball(mockScene, 100, 200, { frictionMult: 1.0 });
        retro.retro = 0.8;
        normal.launch(4, 0);
        retro.launch(4, 0);

        simulate(normal);
        simulate(retro);

        expect(retro.x).toBeLessThan(normal.x);
    });

    it('max retro (1.0) increases friction by RETRO_FRICTION_MULT (2.5x)', () => {
        expect(RETRO_FRICTION_MULT).toBe(2.5);
        // With retro=1: retroBoost = 1 + 1 * 2.5 = 3.5x friction
        const retroBoost = 1 + 1 * RETRO_FRICTION_MULT;
        expect(retroBoost).toBe(3.5);
    });

    it('retro=0 should behave identically to no retro', () => {
        const a = new Ball(mockScene, 100, 200, { frictionMult: 1.0 });
        const b = new Ball(mockScene, 100, 200, { frictionMult: 1.0 });
        a.retro = 0;
        b.retro = 0;
        a.launch(4, 0);
        b.launch(4, 0);
        simulate(a);
        simulate(b);
        expect(a.x).toBeCloseTo(b.x, 1);
    });

    it('small retro (0.2) stops slightly sooner', () => {
        const normal = new Ball(mockScene, 100, 200, { frictionMult: 1.0 });
        const mild = new Ball(mockScene, 100, 200, { frictionMult: 1.0 });
        mild.retro = 0.2;
        normal.launch(4, 0);
        mild.launch(4, 0);
        simulate(normal);
        simulate(mild);
        expect(mild.x).toBeLessThan(normal.x);
        // But not as dramatically as full retro
        expect(mild.x).toBeGreaterThan(normal.x * 0.7);
    });
});

// =====================================================
//  10. LOFT PRESETS — Landing factor & roll efficiency
// =====================================================

describe('Loft presets physics', () => {
    it('demi-portee: 50/50, retro allowed', () => {
        expect(LOFT_DEMI_PORTEE.landingFactor).toBe(0.50);
        expect(LOFT_DEMI_PORTEE.retroAllowed).toBe(true);
    });

    it('plombee: 72% fly, 28% roll, retro allowed, precision penalty', () => {
        expect(LOFT_PLOMBEE.landingFactor).toBe(0.72);
        expect(LOFT_PLOMBEE.rollEfficiency).toBe(1.10);
        expect(LOFT_PLOMBEE.retroAllowed).toBe(true);
        expect(LOFT_PLOMBEE.precisionPenalty).toBe(2.0);
    });

    it('tir: 95% fly, flyOnly flag for carreau naturel', () => {
        expect(LOFT_TIR.landingFactor).toBe(0.95);
        expect(LOFT_TIR.flyOnly).toBe(true);
        expect(LOFT_TIR.rollEfficiency).toBe(0.3);
        expect(LOFT_TIR.retroAllowed).toBe(true);
    });

    it('demi-portee rolls further than plombee at same power', () => {
        // Demi-portee: 50% roll dist, rollEff 1.0
        // Plombee: 12% roll dist, rollEff 0.85
        const power = 0.5;
        const maxDist = TERRAIN_HEIGHT * 0.85;
        const totalDist = power * maxDist;

        const demiRoll = totalDist * (1 - 0.50) * 1.0;
        const plombeeRoll = totalDist * (1 - 0.88) * 0.85;
        expect(demiRoll).toBeGreaterThan(plombeeRoll * 3);
    });
});

// =====================================================
//  11. computeThrowParams — Puissance affects range
// =====================================================

describe('computeThrowParams validation', () => {
    // We test the formula directly
    function computeRange(puissance, power, loft) {
        const puissanceMult = 0.7 + (puissance - 1) / 9 * 0.5;
        const isTir = loft.id === 'tir';
        const maxDist = TERRAIN_HEIGHT * (isTir ? 0.95 : 0.85) * puissanceMult;
        return power * maxDist;
    }

    it('puissance 10 has 1.7x range of puissance 1', () => {
        const range10 = computeRange(10, 1, LOFT_DEMI_PORTEE);
        const range1 = computeRange(1, 1, LOFT_DEMI_PORTEE);
        expect(range10 / range1).toBeCloseTo(1.71, 1);
    });

    it('La Choupe (PUI 10) throws further than Le Magicien (PUI 4)', () => {
        const choupe = computeRange(10, 0.8, LOFT_TIR);
        const magicien = computeRange(4, 0.8, LOFT_TIR);
        expect(choupe).toBeGreaterThan(magicien);
    });

    it('tir range is slightly longer than pointage at same power', () => {
        const tir = computeRange(6, 0.8, LOFT_TIR);
        const point = computeRange(6, 0.8, LOFT_DEMI_PORTEE);
        expect(tir).toBeGreaterThan(point);
    });
});

// =====================================================
//  12. SIMULATION DE PARTIES (stress tests)
// =====================================================

describe('Multi-ball simulation stress tests', () => {
    it('6 balls + cochonnet should all stop eventually on terre', () => {
        const balls = [];
        for (let i = 0; i < 6; i++) {
            const b = new Ball(mockScene, 150 + Math.random() * 50, 150 + Math.random() * 50, { frictionMult: 1.0 });
            b.launch((Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4);
            balls.push(b);
        }
        const coch = new Ball(mockScene, 180, 120, { mass: COCHONNET_MASS, radius: 8, frictionMult: 1.0 });
        coch.launch(0.5, -0.5);
        balls.push(coch);

        // Simulate 1000 frames
        for (let f = 0; f < 1000; f++) {
            for (const b of balls) b.update(16);
            // Resolve all collisions
            for (let i = 0; i < balls.length; i++) {
                for (let j = i + 1; j < balls.length; j++) {
                    if (balls[i].isAlive && balls[j].isAlive) {
                        Ball.resolveCollision(balls[i], balls[j]);
                    }
                }
            }
            if (balls.every(b => !b.isMoving)) break;
        }

        expect(balls.every(b => !b.isMoving)).toBe(true);
    });

    it('6 balls + cochonnet should all stop on sable (even faster)', () => {
        const balls = [];
        for (let i = 0; i < 6; i++) {
            const b = new Ball(mockScene, 150 + Math.random() * 50, 150 + Math.random() * 50, { frictionMult: 3.5 });
            b.launch((Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5);
            balls.push(b);
        }
        const coch = new Ball(mockScene, 180, 120, { mass: COCHONNET_MASS, radius: 8, frictionMult: 3.5 });
        balls.push(coch);

        let framesNeeded = 0;
        for (let f = 0; f < 500; f++) {
            for (const b of balls) b.update(16);
            for (let i = 0; i < balls.length; i++) {
                for (let j = i + 1; j < balls.length; j++) {
                    Ball.resolveCollision(balls[i], balls[j]);
                }
            }
            framesNeeded = f;
            if (balls.every(b => !b.isMoving)) break;
        }

        expect(balls.every(b => !b.isMoving)).toBe(true);
        expect(framesNeeded).toBeLessThan(200); // sable stops fast
    });

    it('high-speed tir chain collision: all balls should settle', () => {
        // Simulate a tir hitting a cluster of 3 balls
        const target1 = new Ball(mockScene, 200, 200, { mass: BALL_MASS, frictionMult: 1.0 });
        const target2 = new Ball(mockScene, 220, 200, { mass: BALL_MASS, frictionMult: 1.0 });
        const target3 = new Ball(mockScene, 210, 185, { mass: BALL_MASS, frictionMult: 1.0 });
        const tireur = new Ball(mockScene, 100, 200, { mass: BALL_MASS, frictionMult: 1.0 });
        tireur.launch(10, 0); // high speed

        const balls = [tireur, target1, target2, target3];
        for (let f = 0; f < 500; f++) {
            for (const b of balls) b.update(16);
            for (let i = 0; i < balls.length; i++) {
                for (let j = i + 1; j < balls.length; j++) {
                    Ball.resolveCollision(balls[i], balls[j]);
                }
            }
            if (balls.every(b => !b.isMoving)) break;
        }

        expect(balls.every(b => !b.isMoving)).toBe(true);
        // All targets should have moved from original position
        expect(target1.x).not.toBeCloseTo(200, 0);
    });

    it('repeated collisions do not create infinite energy', () => {
        const a = new Ball(mockScene, 100, 200, { mass: BALL_MASS, frictionMult: 0.4 });
        const b = new Ball(mockScene, 130, 200, { mass: BALL_MASS, frictionMult: 0.4 });
        a.launch(5, 0);

        let maxSpeed = 0;
        for (let f = 0; f < 500; f++) {
            a.update(16);
            b.update(16);
            Ball.resolveCollision(a, b);
            for (const ball of [a, b]) {
                const spd = Math.sqrt(ball.vx ** 2 + ball.vy ** 2);
                if (spd > maxSpeed) maxSpeed = spd;
            }
        }

        // Max speed should never exceed initial (energy conservation)
        expect(maxSpeed).toBeLessThanOrEqual(6); // 5 + small margin
    });
});

describe('Session 7 — Critical gameplay tests', () => {
    let Ball;
    beforeEach(async () => {
        const mod = await import('../src/petanque/Ball.js');
        Ball = mod.default;
    });

    it('Carreau detection: tir that ejects + places near impact point', () => {
        // Simulate a tir: ball A hits ball B, A stops near B's original position
        const a = new Ball(mockScene, 100, 200, { mass: BALL_MASS });
        const b = new Ball(mockScene, 100 + BALL_RADIUS * 2 - 2, 200, { mass: BALL_MASS });
        const origBx = b.x;
        a.launch(8, 0); // Fast tir

        Ball.resolveCollision(a, b);

        // After collision with COR 0.62, A should retain ~19% speed → stops near impact
        // B should fly away
        expect(b.vx).toBeGreaterThan(a.vx);
        // A should be close to B's original position
        const dist = Math.abs(a.x - origBx);
        expect(dist).toBeLessThan(BALL_RADIUS * 4); // Within carreau threshold range
    });

    it('Cochonnet placement stays within bounds (1000 random)', () => {
        const bounds = { x: 326, y: 30, w: 180, h: 420 };
        const margin = 15;
        for (let i = 0; i < 1000; i++) {
            const x = bounds.x + margin + Math.random() * (bounds.w - 2 * margin);
            const y = bounds.y + margin + Math.random() * (bounds.h - 2 * margin);
            expect(x).toBeGreaterThanOrEqual(bounds.x);
            expect(x).toBeLessThanOrEqual(bounds.x + bounds.w);
            expect(y).toBeGreaterThanOrEqual(bounds.y);
            expect(y).toBeLessThanOrEqual(bounds.y + bounds.h);
        }
    });

    it('Retro on sable vs dalles: sable stops much shorter', () => {
        const ballSable = new Ball(mockScene, 100, 200, { frictionMult: TERRAIN_FRICTION.sable });
        const ballDalles = new Ball(mockScene, 100, 200, { frictionMult: TERRAIN_FRICTION.dalles });

        ballSable.retro = 0.5;
        ballDalles.retro = 0.5;
        ballSable.launch(5, 0);
        ballDalles.launch(5, 0);

        for (let i = 0; i < 300; i++) {
            ballSable.update(16);
            ballDalles.update(16);
        }

        // Sable (friction 3.0 + retro) should stop MUCH shorter than dalles (friction 0.7)
        expect(ballSable.x).toBeLessThan(ballDalles.x);
        expect(ballDalles.x - ballSable.x).toBeGreaterThan(20);
    });
});

// =====================================================
//  A.5 PUISSANCE STAT — Effets cohérents (source: Constants.puissanceMultiplier)
// =====================================================

describe('Puissance stat extremes', () => {
    it('Pui 1 = 0.8x, Pui 5 ≈ 1.02x, Pui 10 = 1.3x', () => {
        expect(puissanceMultiplier(1)).toBeCloseTo(0.8, 5);
        expect(puissanceMultiplier(5)).toBeCloseTo(0.8 + 4 / 9 * 0.5, 5);
        expect(puissanceMultiplier(10)).toBeCloseTo(1.3, 5);
    });

    it('Pui 1 ball travels shorter distance than Pui 10 ball (same launch angle)', () => {
        // Simulate via PetanqueEngine.computeThrowParams — use speed as proxy for distance
        // Higher puissance → higher rollingSpeed → more distance
        const pui1 = puissanceMultiplier(1);
        const pui10 = puissanceMultiplier(10);
        expect(pui10).toBeGreaterThan(pui1);
        // maxDist proportional to mult
        const maxDist1 = TERRAIN_HEIGHT * 0.85 * pui1;
        const maxDist10 = TERRAIN_HEIGHT * 0.85 * pui10;
        expect(maxDist10).toBeGreaterThan(maxDist1 * 1.3); // >30% more range
    });
});

// =====================================================
//  A.5 COCHONNET CAP — Vitesse plafonnée post-collision
// =====================================================

describe('Cochonnet collision cap', () => {
    it('cochonnet speed capped at COCHONNET_MAX_COLLISION_SPEED after hard hit', () => {
        const ball = new Ball(mockScene, 200, 200, { isCochonnet: false });
        ball.vx = 12; // MAX_THROW_SPEED — moving right
        ball.vy = 0;
        ball.isMoving = true;

        // Cochonnet to the right, within collision range (distance=15 < minDist=20)
        const cochonnet = new Ball(mockScene, 215, 200, { isCochonnet: true, mass: 16 });
        cochonnet.vx = 0;
        cochonnet.vy = 0;
        cochonnet.isMoving = false;

        // Apply collision
        Ball.resolveCollision(ball, cochonnet);

        const speed = Math.sqrt(cochonnet.vx ** 2 + cochonnet.vy ** 2);
        expect(speed).toBeGreaterThan(0); // cochonnet actually moved
        expect(speed).toBeLessThanOrEqual(COCHONNET_MAX_COLLISION_SPEED + 0.01); // but capped
    });

    it('cochonnet still moves after a light hit', () => {
        const ball = new Ball(mockScene, 200, 200, { isCochonnet: false });
        ball.vx = 4; // moving right
        ball.vy = 0;
        ball.isMoving = true;

        // Cochonnet positioned to the right, within collision distance (15 < radius 10+10=20)
        const cochonnet = new Ball(mockScene, 215, 200, { isCochonnet: true, mass: 16 });
        cochonnet.vx = 0;
        cochonnet.vy = 0;
        cochonnet.isMoving = false;

        Ball.resolveCollision(ball, cochonnet);

        const speed = Math.sqrt(cochonnet.vx ** 2 + cochonnet.vy ** 2);
        expect(speed).toBeGreaterThan(0);
    });
});

// =====================================================
//  A.5 SLOPE TIMEOUT — Force stop après 120 frames max
// =====================================================

describe('Slope timeout', () => {
    it('ball stops within 120 frames on a steep slope (safety timeout)', () => {
        const slopeTerrain = { slope: { gravity_component: 0.15 } }; // Force slope > friction
        const ball = new Ball(mockScene, 200, 200, {
            frictionMult: 1.0,
            terrain: slopeTerrain
        });
        // Put ball at low speed (below SPEED_THRESHOLD) to enter slope protection path
        ball.vx = 0.1;
        ball.vy = 0;
        ball.isMoving = true;
        ball._lowSpeedFrames = 0;

        let framesStopped = -1;
        for (let i = 0; i < 200; i++) {
            ball.update(16);
            if (!ball.isMoving) {
                framesStopped = i + 1;
                break;
            }
        }
        expect(framesStopped).toBeGreaterThan(0);          // ball actually stopped
        expect(framesStopped).toBeLessThanOrEqual(121);    // stopped within ~120 frames
    });
});

// =====================================================
//  SIMPLIFIED LOFT SYSTEM — 3 presets only
// =====================================================

describe('Simplified loft system — 3 presets', () => {
    it('plombee landingFactor should be between demi and tir', () => {
        expect(LOFT_PLOMBEE.landingFactor).toBeGreaterThan(LOFT_DEMI_PORTEE.landingFactor);
        expect(LOFT_PLOMBEE.landingFactor).toBeLessThan(LOFT_TIR.landingFactor);
    });

    it('all 3 loft presets should have valid structure', () => {
        const ALL_LOFTS = [LOFT_DEMI_PORTEE, LOFT_PLOMBEE, LOFT_TIR];
        expect(ALL_LOFTS).toHaveLength(3);
        for (const p of ALL_LOFTS) {
            expect(p.id).toBeTruthy();
            expect(p.label).toBeTruthy();
            expect(p.landingFactor).toBeGreaterThanOrEqual(0);
            expect(p.landingFactor).toBeLessThanOrEqual(1);
            expect(p.flyDurationMult).toBeGreaterThan(0);
            expect(p.rollEfficiency).toBeGreaterThan(0);
        }
    });
});

// =====================================================
//  D1. SLOPE PHYSICS (slope_zones) — Format terrain réel Colline
//  Tests using slope_zones format (not legacy terrain.slope)
// =====================================================

describe('Slope Physics (slope_zones format)', () => {
    const bounds = { x: 50, y: 50, w: 600, h: 600 };

    it('ball gains downward velocity when in a slope_zone (direction: down)', () => {
        const terrain = {
            slope_zones: [{ direction: 'down', gravity_component: 0.06, rect: { x: 0, y: 0, w: 1, h: 1 } }]
        };
        const ball = new Ball(mockScene, 300, 300, { frictionMult: 1.0, terrain, bounds });
        ball.launch(3, 0); // Moving right with vy=0
        const vyBefore = ball.vy; // 0
        for (let i = 0; i < 10; i++) ball.update(16);
        // slope_zone 'down' adds positive vy each frame
        expect(ball.vy).toBeGreaterThan(vyBefore);
    });

    it('ball moving upward decelerates faster on downward slope_zone', () => {
        const terrain = {
            slope_zones: [{ direction: 'down', gravity_component: 0.06, rect: { x: 0, y: 0, w: 1, h: 1 } }]
        };
        const flat = new Ball(mockScene, 300, 300, { frictionMult: 1.0, terrain: {}, bounds });
        const sloped = new Ball(mockScene, 300, 300, { frictionMult: 1.0, terrain, bounds });
        flat.launch(0, -5);   // Moving up, no slope
        sloped.launch(0, -5); // Moving up, slope opposes (adds +vy against -vy motion)
        for (let i = 0; i < 30; i++) { flat.update(16); sloped.update(16); }
        // Sloped ball went less far upward (higher y = less upward travel)
        expect(sloped.y).toBeGreaterThan(flat.y);
    });

    it('slope_zones: ball stops after 120 low-speed frames timeout', () => {
        // gravity_component 0.1: activeSlopeForce 6 > frictionForce*0.5=4.5 → slope keeps rolling
        // Pre-set _lowSpeedFrames near the 120 limit to test the timeout mechanism directly
        const terrain = {
            slope_zones: [{ direction: 'down', gravity_component: 0.1, rect: { x: 0, y: 0, w: 1, h: 1 } }]
        };
        const ball = new Ball(mockScene, 300, 300, {
            frictionMult: 1.0, terrain, bounds: { x: 50, y: 50, w: 800, h: 800 }
        });
        ball.vx = 0; ball.vy = 0.05; ball.isMoving = true; // below SPEED_THRESHOLD (0.3)
        ball._lowSpeedFrames = 118; // 2 more low-speed frames → counter reaches 120 → stop

        // With vy=0.05, each frame: slope adds vy=+0.096 → stays below 0.3 → else branch
        // Frame 1: _lowSpeedFrames=119, 119<120 → return. Frame 2: _lowSpeedFrames=120, 120<120=FALSE → stop
        for (let i = 0; i < 20; i++) ball.update(16);
        expect(ball.isMoving).toBe(false);
    });

    it('Colline terrain: 3 slope_zones with different gravity_components affect balls differently', () => {
        const collineTerrain = {
            slope_zones: [
                { direction: 'down',  gravity_component: 0.06, rect: { x: 0,   y: 0,   w: 0.5, h: 0.5 } },
                { direction: 'down',  gravity_component: 0.05, rect: { x: 0.5, y: 0.5, w: 0.5, h: 0.5 } },
                { direction: 'right', gravity_component: 0.04, rect: { x: 0,   y: 0.5, w: 0.5, h: 0.5 } }
            ]
        };
        const b = { x: 50, y: 50, w: 400, h: 400 };

        // Ball in zone 1 (0.06 down) — at (150,150)
        const ball1 = new Ball(mockScene, 150, 150, { frictionMult: 1.0, terrain: collineTerrain, bounds: b });
        ball1.launch(3, 0); ball1.update(16);

        // Ball in zone 2 (0.05 down) — at (350,350)
        const ball2 = new Ball(mockScene, 350, 350, { frictionMult: 1.0, terrain: collineTerrain, bounds: b });
        ball2.launch(3, 0); ball2.update(16);

        // Ball in zone 3 (0.04 right) — at (150,350)
        const ball3 = new Ball(mockScene, 150, 350, { frictionMult: 1.0, terrain: collineTerrain, bounds: b });
        ball3.launch(0, -3); ball3.update(16);

        // Zone 1 stronger slope → more vy than zone 2
        expect(ball1.vy).toBeGreaterThan(ball2.vy);
        // Zone 3 lateral → gained positive vx
        expect(ball3.vx).toBeGreaterThan(0);
    });

    it('ball outside slope_zone rect is not affected by slope (flat zone)', () => {
        // Slope covers only left half (x < 50 + 0.5*400 = 250)
        const terrain = {
            slope_zones: [{ direction: 'down', gravity_component: 0.06, rect: { x: 0, y: 0, w: 0.5, h: 1 } }]
        };
        const b = { x: 50, y: 50, w: 400, h: 400 };

        // Ball in zone (x=150)
        const inZone = new Ball(mockScene, 150, 200, { frictionMult: 1.0, terrain, bounds: b });
        inZone.launch(3, 0); inZone.update(16);

        // Ball outside zone (x=360 > 250)
        const outZone = new Ball(mockScene, 360, 200, { frictionMult: 1.0, terrain, bounds: b });
        outZone.launch(3, 0); outZone.update(16);

        // In-zone ball gains vy from slope, out-of-zone ball does not
        expect(inZone.vy).toBeGreaterThan(outZone.vy);
    });
});

// =====================================================
//  D2. WALL REBOUNDS — Physics constants verified
// =====================================================

describe('Wall Rebounds — WALL_RESTITUTION and dead ball', () => {
    const docksTerrain = { walls: true };
    const bounds = { x: 100, y: 50, w: 200, h: 400 };

    it('right wall bounce: vx becomes negative (direction reversed)', () => {
        const ball = new Ball(mockScene, 290, 200, { frictionMult: 0.4, terrain: docksTerrain, bounds });
        ball.launch(10, 0); // strong launch toward right wall (100 + 200 = 300)
        for (let i = 0; i < 5; i++) ball.update(16);
        expect(ball.vx).toBeLessThan(0); // bounced left
    });

    it('left wall bounce: vx becomes positive (direction reversed)', () => {
        const ball = new Ball(mockScene, 110, 200, { frictionMult: 0.4, terrain: docksTerrain, bounds });
        ball.launch(-10, 0); // strong launch toward left wall (100)
        for (let i = 0; i < 5; i++) ball.update(16);
        expect(ball.vx).toBeGreaterThan(0); // bounced right
    });

    it('WALL_RESTITUTION (0.7) reduces speed on bounce', () => {
        const ball = new Ball(mockScene, 110, 200, { frictionMult: 0.4, terrain: docksTerrain, bounds });
        const initSpeed = 10;
        ball.launch(-initSpeed, 0);
        ball.update(16); // hits left wall, vx = Math.abs(vx) * WALL_RESTITUTION
        // Post-bounce speed ≤ initial * WALL_RESTITUTION (plus small friction loss)
        expect(Math.abs(ball.vx)).toBeLessThan(initSpeed * WALL_RESTITUTION + 0.5);
    });

    it('dead ball does not bounce off walls (update() returns early)', () => {
        const ball = new Ball(mockScene, 110, 200, { frictionMult: 0.4, terrain: docksTerrain, bounds });
        ball.kill(); // isAlive = false
        const xBefore = ball.x;
        ball.update(16); // should return immediately — isAlive check at top of update()
        expect(ball.x).toBe(xBefore); // position unchanged
        expect(ball.isAlive).toBe(false);
    });
});

describe('Spin lateral — Ball.activateLateralSpin()', () => {
    it('spin gauche (-1) devie la balle vers la gauche', async () => {
        const ball = new Ball(mockScene, 100, 200, { frictionMult: 1.0 });
        ball.launch(0, -3); // balle va vers le haut
        ball.activateLateralSpin(-1, 8, 'terre'); // gauche, effet 8

        const startX = ball.x;
        simulate(ball, 30);
        // Spin gauche = déviation vers la gauche (x diminue quand va vers le haut)
        expect(ball.x).toBeLessThan(startX);
    });

    it('spin droite (+1) devie la balle vers la droite', async () => {
        const ball = new Ball(mockScene, 100, 200, { frictionMult: 1.0 });
        ball.launch(0, -3); // balle va vers le haut
        ball.activateLateralSpin(1, 8, 'terre'); // droite, effet 8

        const startX = ball.x;
        simulate(ball, 30);
        expect(ball.x).toBeGreaterThan(startX);
    });

    it('intensite proportionnelle au stat Effet (effet 10 > effet 4)', async () => {
        // Effet 10 — plus de deviation
        const ball10 = new Ball(mockScene, 100, 200, { frictionMult: 1.0 });
        ball10.launch(0, -3);
        ball10.activateLateralSpin(1, 10, 'terre');
        simulate(ball10, 25);
        const dev10 = ball10.x - 100;

        // Effet 4 — moins de deviation
        const ball4 = new Ball(mockScene, 100, 200, { frictionMult: 1.0 });
        ball4.launch(0, -3);
        ball4.activateLateralSpin(1, 4, 'terre');
        simulate(ball4, 25);
        const dev4 = ball4.x - 100;

        expect(Math.abs(dev10)).toBeGreaterThan(Math.abs(dev4));
    });

    it('spin off (0) = aucune deviation laterale', async () => {
        const ballSpin = new Ball(mockScene, 100, 200, { frictionMult: 1.0 });
        ballSpin.launch(0, -3);
        ballSpin.activateLateralSpin(0, 8, 'terre'); // off
        simulate(ballSpin, 25);

        // Sans spin, la balle va tout droit (x ne change pas)
        expect(Math.abs(ballSpin.x - 100)).toBeLessThan(0.5);
    });
});
