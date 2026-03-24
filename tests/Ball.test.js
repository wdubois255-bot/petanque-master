import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    FRICTION_BASE, SPEED_THRESHOLD, RESTITUTION_BOULE,
    RESTITUTION_COCHONNET, BALL_RADIUS, BALL_MASS,
    COCHONNET_MASS, MAX_THROW_SPEED
} from '../src/utils/Constants.js';

// We test Ball physics logic without rendering (mock scene)
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
            setVisible: vi.fn().mockReturnThis(), destroy: vi.fn()
        })
    }
};

let Ball;

beforeEach(async () => {
    const mod = await import('../src/petanque/Ball.js');
    Ball = mod.default;
});

describe('Ball - Physics', () => {
    it('should initialize with correct defaults', () => {
        const ball = new Ball(mockScene, 100, 200);
        expect(ball.x).toBe(100);
        expect(ball.y).toBe(200);
        expect(ball.vx).toBe(0);
        expect(ball.vy).toBe(0);
        expect(ball.isAlive).toBe(true);
        expect(ball.isMoving).toBe(false);
        expect(ball.radius).toBe(BALL_RADIUS);
        expect(ball.mass).toBe(BALL_MASS);
    });

    it('should launch with given velocity', () => {
        const ball = new Ball(mockScene, 100, 200);
        ball.launch(5, -3);
        expect(ball.vx).toBe(5);
        expect(ball.vy).toBe(-3);
        expect(ball.isMoving).toBe(true);
    });

    it('should decelerate due to friction', () => {
        const ball = new Ball(mockScene, 100, 200);
        ball.launch(5, 0);
        const initialSpeed = 5;

        // Simulate one frame at 16ms
        ball.update(16);

        const newSpeed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
        expect(newSpeed).toBeLessThan(initialSpeed);
        expect(newSpeed).toBeGreaterThan(0);
    });

    it('should stop when speed drops below threshold', () => {
        const ball = new Ball(mockScene, 100, 200);
        ball.launch(0.2, 0); // Very slow

        ball.update(16);

        expect(ball.isMoving).toBe(false);
        expect(ball.vx).toBe(0);
        expect(ball.vy).toBe(0);
    });

    it('should cap dt to 50ms to prevent tunneling', () => {
        const ball = new Ball(mockScene, 100, 200);
        ball.launch(5, 0);

        // Even with huge dt, capped to 50ms
        ball.update(500);
        const afterBigDt = ball.x;

        const ball2 = new Ball(mockScene, 100, 200);
        ball2.launch(5, 0);
        ball2.update(50);

        expect(afterBigDt).toBeCloseTo(ball2.x, 1);
    });

    it('should move in the correct direction', () => {
        const ball = new Ball(mockScene, 100, 200);
        ball.launch(0, -5); // Moving up

        ball.update(16);

        expect(ball.y).toBeLessThan(200);
        expect(ball.x).toBeCloseTo(100, 0);
    });

    it('should eventually stop after many frames', () => {
        const ball = new Ball(mockScene, 100, 200);
        ball.launch(3, -4);

        for (let i = 0; i < 500; i++) {
            ball.update(16);
            if (!ball.isMoving) break;
        }

        expect(ball.isMoving).toBe(false);
    });
});

describe('Ball - Friction multiplier', () => {
    it('should stop faster on high-friction terrain (sable)', () => {
        const ballNormal = new Ball(mockScene, 100, 200, { frictionMult: 1.0 });
        const ballSand = new Ball(mockScene, 100, 200, { frictionMult: 3.5 });
        ballNormal.launch(5, 0);
        ballSand.launch(5, 0);

        for (let i = 0; i < 100; i++) {
            ballNormal.update(16);
            ballSand.update(16);
        }

        // Sand ball should have traveled less
        expect(ballSand.x).toBeLessThan(ballNormal.x);
    });

    it('should roll further on dalles (low friction)', () => {
        const ballNormal = new Ball(mockScene, 100, 200, { frictionMult: 1.0 });
        const ballDalles = new Ball(mockScene, 100, 200, { frictionMult: 0.4 });
        ballNormal.launch(5, 0);
        ballDalles.launch(5, 0);

        for (let i = 0; i < 200; i++) {
            ballNormal.update(16);
            ballDalles.update(16);
        }

        expect(ballDalles.x).toBeGreaterThan(ballNormal.x);
    });
});

describe('Ball - Collision', () => {
    it('should resolve head-on collision between two boules', () => {
        const a = new Ball(mockScene, 100, 200, { mass: BALL_MASS });
        const b = new Ball(mockScene, 100 + BALL_RADIUS * 2 - 2, 200, { mass: BALL_MASS });
        a.launch(3, 0);

        const collided = Ball.resolveCollision(a, b);

        expect(collided).toBe(true);
        expect(b.isMoving).toBe(true);
        expect(b.vx).toBeGreaterThan(0); // b pushed forward
        expect(a.vx).toBeLessThan(3); // a slowed down
    });

    it('should use correct COR for boule-boule (0.62)', () => {
        const a = new Ball(mockScene, 100, 200, { mass: BALL_MASS });
        const b = new Ball(mockScene, 100 + BALL_RADIUS * 2 - 1, 200, { mass: BALL_MASS });
        a.launch(5, 0);

        Ball.resolveCollision(a, b);

        // With equal masses and COR 0.62:
        // v_a_after = (1 - e) / 2 * v = 0.19 * v
        // v_b_after = (1 + e) / 2 * v = 0.81 * v
        // So b should get ~81% of the original speed
        const speedRatioB = b.vx / 5;
        expect(speedRatioB).toBeCloseTo(0.81, 1);
    });

    it('should transfer more energy to lighter cochonnet', () => {
        const boule = new Ball(mockScene, 100, 200, { mass: BALL_MASS, radius: BALL_RADIUS });
        // Place cochonnet so they overlap (radius 10 + 8 = 18, place at dist 16)
        const cochonnet = new Ball(mockScene, 100 + 16, 200, {
            mass: COCHONNET_MASS, radius: 8
        });
        boule.launch(5, 0);

        Ball.resolveCollision(boule, cochonnet);

        // Cochonnet (30g) hit by boule (700g) should fly much faster
        expect(cochonnet.vx).toBeGreaterThan(boule.vx);
    });

    it('should not collide when balls are far apart', () => {
        const a = new Ball(mockScene, 100, 200);
        const b = new Ball(mockScene, 200, 200);

        const collided = Ball.resolveCollision(a, b);
        expect(collided).toBe(false);
    });

    it('should not collide when balls are moving apart', () => {
        const a = new Ball(mockScene, 100, 200);
        const b = new Ball(mockScene, 100 + BALL_RADIUS * 2 - 1, 200);
        a.launch(-3, 0); // Moving away

        const collided = Ball.resolveCollision(a, b);
        expect(collided).toBe(false);
    });

    it('should separate overlapping balls', () => {
        const a = new Ball(mockScene, 100, 200, { mass: BALL_MASS });
        const b = new Ball(mockScene, 105, 200, { mass: BALL_MASS }); // Heavy overlap
        a.launch(2, 0);

        Ball.resolveCollision(a, b);

        const dist = Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
        expect(dist).toBeGreaterThanOrEqual(a.radius + b.radius - 1);
    });
});

describe('Ball - Bounds', () => {
    it('should detect out of bounds', () => {
        const bounds = { x: 50, y: 50, w: 200, h: 400 };
        const ball = new Ball(mockScene, 10, 100);

        expect(ball.checkOutOfBounds(bounds)).toBe(true);
    });

    it('should not flag ball inside bounds', () => {
        const bounds = { x: 50, y: 50, w: 200, h: 400 };
        const ball = new Ball(mockScene, 150, 250);

        expect(ball.checkOutOfBounds(bounds)).toBe(false);
    });

    it('should not check dead balls', () => {
        const bounds = { x: 50, y: 50, w: 200, h: 400 };
        const ball = new Ball(mockScene, 10, 100);
        ball.kill();

        expect(ball.checkOutOfBounds(bounds)).toBe(false);
    });
});

describe('Ball - distanceTo', () => {
    it('should calculate euclidean distance', () => {
        const a = new Ball(mockScene, 0, 0);
        const b = new Ball(mockScene, 3, 4);

        expect(a.distanceTo(b)).toBeCloseTo(5, 5);
    });

    it('should return 0 for same position', () => {
        const a = new Ball(mockScene, 100, 200);
        const b = new Ball(mockScene, 100, 200);

        expect(a.distanceTo(b)).toBe(0);
    });
});

describe('Ball - simulateTrajectory', () => {
    it('should return decreasing-speed trajectory points', () => {
        const points = Ball.simulateTrajectory(100, 200, 5, 0, 1.0, 120);

        expect(points.length).toBeGreaterThan(0);
        // Points should progress forward
        for (let i = 1; i < points.length; i++) {
            expect(points[i].x).toBeGreaterThan(points[i - 1].x);
        }
    });

    it('should produce shorter trajectory on high friction', () => {
        const pointsNormal = Ball.simulateTrajectory(100, 200, 5, 0, 1.0);
        const pointsSand = Ball.simulateTrajectory(100, 200, 5, 0, 3.5);

        const lastNormal = pointsNormal[pointsNormal.length - 1];
        const lastSand = pointsSand[pointsSand.length - 1];

        expect(lastSand.x).toBeLessThan(lastNormal.x);
    });
});

describe('Ball - knockbackMult multiplication', () => {
    it('should multiply knockbackMult of both balls', () => {
        const a = new Ball(mockScene, 100, 200, { mass: BALL_MASS });
        const b = new Ball(mockScene, 100 + BALL_RADIUS * 2 - 2, 200, { mass: BALL_MASS });
        a.knockbackMult = 1.3;
        b.knockbackMult = 1.2;
        a.launch(5, 0);

        Ball.resolveCollision(a, b);

        // With multiplied knockback (1.3 * 1.2 = 1.56), b should move faster
        // than with just max(1.3, 1.2) = 1.3
        const bSpeed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
        // Compare to a collision without knockback bonus
        const a2 = new Ball(mockScene, 100, 200, { mass: BALL_MASS });
        const b2 = new Ball(mockScene, 100 + BALL_RADIUS * 2 - 2, 200, { mass: BALL_MASS });
        a2.launch(5, 0);
        Ball.resolveCollision(a2, b2);
        const b2Speed = Math.sqrt(b2.vx * b2.vx + b2.vy * b2.vy);

        // knockbackMult 1.56x should make b significantly faster
        expect(bSpeed / b2Speed).toBeCloseTo(1.56, 1);
    });
});

describe('Ball - _rollFrames edge case', () => {
    it('should have _rollFrames >= 1 even with frameTotal 0 or 1', () => {
        // With no texture, _rollFrames defaults to 6
        const ball = new Ball(mockScene, 100, 200);
        expect(ball._rollFrames).toBeGreaterThanOrEqual(1);
    });
});

describe('Ball - kill', () => {
    it('should stop all motion and mark as dead', () => {
        const ball = new Ball(mockScene, 100, 200);
        ball.launch(5, -3);
        ball.kill();

        expect(ball.isAlive).toBe(false);
        expect(ball.isMoving).toBe(false);
        expect(ball.vx).toBe(0);
        expect(ball.vy).toBe(0);
    });
});

// ─── AXE D — Collision edge cases ────────────────────────────────────────────

describe('Ball - Collision edge cases (AXE D)', () => {
    it('triple collision: A hits B, B hits C (chain resolveCollision)', () => {
        const a = new Ball(mockScene, 100, 200, { mass: BALL_MASS });
        const b = new Ball(mockScene, 100 + BALL_RADIUS * 2 - 2, 200, { mass: BALL_MASS });
        const c = new Ball(mockScene, 100 + BALL_RADIUS * 4 - 4, 200, { mass: BALL_MASS });
        a.launch(8, 0);

        Ball.resolveCollision(a, b); // A → B: B is now moving
        Ball.resolveCollision(b, c); // B → C: C is now moving

        expect(c.isMoving).toBe(true);
        expect(c.vx).toBeGreaterThan(0); // C received momentum via chain
    });

    it('dead ball does not move during update() (isAlive check at top of update)', () => {
        const ball = new Ball(mockScene, 100, 200);
        ball.launch(5, 0);
        ball.kill(); // isAlive = false, isMoving = false
        const xBefore = ball.x;

        ball.update(16); // should return early — guard: if (!isAlive || !isMoving) return

        expect(ball.x).toBe(xBefore); // position unchanged
        expect(ball.isAlive).toBe(false);
    });

    it('collision at MAX_THROW_SPEED produces no NaN velocities', () => {
        const a = new Ball(mockScene, 100, 200, { mass: BALL_MASS });
        const b = new Ball(mockScene, 100 + BALL_RADIUS * 2 - 1, 200, { mass: BALL_MASS });
        a.launch(MAX_THROW_SPEED, 0); // extreme speed (12 px/frame)

        Ball.resolveCollision(a, b);

        expect(Number.isFinite(a.vx)).toBe(true);
        expect(Number.isFinite(a.vy)).toBe(true);
        expect(Number.isFinite(b.vx)).toBe(true);
        expect(Number.isFinite(b.vy)).toBe(true);
    });

    it('collision near terrain edge: velocities remain physically valid', () => {
        // Ball A just inside bounds, B next to it — simulates edge-of-terrain collision
        const a = new Ball(mockScene, 52, 200, { mass: BALL_MASS }); // near left edge
        const b = new Ball(mockScene, 52 + BALL_RADIUS * 2 - 1, 200, { mass: BALL_MASS });
        a.launch(6, 0);

        Ball.resolveCollision(a, b);

        expect(b.vx).toBeGreaterThan(0);
        // Post-collision speed should not exceed plausible physical maximum
        expect(Math.abs(b.vx)).toBeLessThan(MAX_THROW_SPEED * 2);
        expect(Math.abs(b.vy)).toBeLessThan(MAX_THROW_SPEED * 2);
    });
});
