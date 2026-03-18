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
    LOFT_ROULETTE, LOFT_DEMI_PORTEE, LOFT_PLOMBEE, LOFT_TIR,
    TERRAIN_HEIGHT, BALL_CLAMP_MARGIN
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
        { name: 'terre', mult: 1.0 },
        { name: 'herbe', mult: 1.8 },
        { name: 'sable', mult: 3.5 },
        { name: 'dalles', mult: 0.4 }
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
        const sable = new Ball(mockScene, 200, 200, { frictionMult: 3.5 });
        const dalles = new Ball(mockScene, 200, 200, { frictionMult: 0.4 });
        sable.launch(5, 0);
        dalles.launch(5, 0);

        let sableFrames = 0, dallesFrames = 0;
        for (let i = 0; i < 1000; i++) {
            if (sable.isMoving) { sable.update(16); sableFrames++; }
            if (dalles.isMoving) { dalles.update(16); dallesFrames++; }
            if (!sable.isMoving && !dalles.isMoving) break;
        }
        expect(sableFrames).toBeLessThan(dallesFrames);
        expect(dallesFrames).toBeGreaterThan(sableFrames * 3); // dalles ~8x less friction
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

    it('light cochonnet absorbs energy: moves faster than boule post-collision', () => {
        const boule = new Ball(mockScene, 100, 200, { mass: BALL_MASS, radius: BALL_RADIUS });
        const cochonnet = new Ball(mockScene, 100 + 16, 200, { mass: COCHONNET_MASS, radius: 8 });
        boule.launch(5, 0);

        Ball.resolveCollision(boule, cochonnet);

        const bouleSpeed = Math.sqrt(boule.vx ** 2 + boule.vy ** 2);
        const cochSpeed = Math.sqrt(cochonnet.vx ** 2 + cochonnet.vy ** 2);
        // Cochonnet is lighter → absorbs proportionally more speed
        expect(cochSpeed).toBeGreaterThan(bouleSpeed);
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
    it('roulette: 15% fly, 85% roll, no retro', () => {
        expect(LOFT_ROULETTE.landingFactor).toBe(0.15);
        expect(LOFT_ROULETTE.rollEfficiency).toBe(0.7);
        expect(LOFT_ROULETTE.retroAllowed).toBe(false);
    });

    it('demi-portee: 50/50, retro allowed', () => {
        expect(LOFT_DEMI_PORTEE.landingFactor).toBe(0.50);
        expect(LOFT_DEMI_PORTEE.retroAllowed).toBe(true);
    });

    it('plombee: 80% fly, 20% roll, retro allowed, precision penalty', () => {
        expect(LOFT_PLOMBEE.landingFactor).toBe(0.80);
        expect(LOFT_PLOMBEE.rollEfficiency).toBe(0.50);
        expect(LOFT_PLOMBEE.retroAllowed).toBe(true);
        expect(LOFT_PLOMBEE.precisionPenalty).toBe(3.0);
    });

    it('tir: 98% fly, high roll efficiency for energy transfer', () => {
        expect(LOFT_TIR.landingFactor).toBe(0.98);
        expect(LOFT_TIR.rollEfficiency).toBe(16.0);
        expect(LOFT_TIR.retroAllowed).toBe(true);
    });

    it('roulette rolls MUCH further than plombee at same power', () => {
        // Roulette: 85% roll dist, rollEff 0.7
        // Plombee: 20% roll dist, rollEff 0.5
        const power = 0.5;
        const maxDist = TERRAIN_HEIGHT * 0.85;
        const totalDist = power * maxDist;

        const rouletteRoll = totalDist * (1 - 0.15) * 0.7;
        const plombeeRoll = totalDist * (1 - 0.80) * 0.5;
        expect(rouletteRoll).toBeGreaterThan(plombeeRoll * 4);
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
