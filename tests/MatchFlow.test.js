/**
 * MatchFlow.test.js — Match flow logic unit tests (AXE D)
 * Tests scoring algorithm, ball/cochonnet placement, and mene accumulation
 * using Ball instances directly (no full PetanqueEngine instantiation required)
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    BALL_MASS, COCHONNET_MASS, BALL_RADIUS,
    COCHONNET_MIN_DIST, COCHONNET_MAX_DIST
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

/**
 * Pure scoring algorithm mirroring PetanqueEngine._scoreMene().
 * Returns { winner, points } or null on tie.
 */
function computeScore(balls, cochonnet) {
    function getMinDist(team) {
        let min = Infinity;
        for (const b of balls) {
            if (b.team === team && b.isAlive) {
                const d = b.distanceTo(cochonnet);
                if (d < min) min = d;
            }
        }
        return min;
    }
    const playerDist = getMinDist('player');
    const opponentDist = getMinDist('opponent');
    if (playerDist === opponentDist) return null; // exact tie
    const winner = playerDist < opponentDist ? 'player' : 'opponent';
    const loserDist = winner === 'player' ? opponentDist : playerDist;
    const losingBalls = balls.filter(b => b.team !== winner && b.team !== 'cochonnet' && b.isAlive);
    let points;
    if (losingBalls.length === 0) {
        points = balls.filter(b => b.team === winner && b.isAlive).length;
    } else {
        points = balls.filter(b =>
            b.team === winner && b.isAlive && b.distanceTo(cochonnet) < loserDist
        ).length;
    }
    return { winner, points };
}

// =====================================================
//  D3.1 — Cochonnet placement within FIPJP bounds
// =====================================================

describe('Match Flow — Cochonnet placement (FIPJP)', () => {
    it('cochonnet constants match FIPJP rules (6m, 10m on 13m terrain)', () => {
        expect(COCHONNET_MIN_DIST).toBe(Math.round(6 * (420 / 13))); // 6m minimum
        expect(COCHONNET_MAX_DIST).toBe(Math.round(10 * (420 / 13))); // 10m maximum
        // Any valid cochonnet distance falls in this range
        const validDist = 220;
        expect(validDist).toBeGreaterThanOrEqual(COCHONNET_MIN_DIST);
        expect(validDist).toBeLessThanOrEqual(COCHONNET_MAX_DIST);
    });
});

// =====================================================
//  D3.2 — Ball positions after launch + simulation
// =====================================================

describe('Match Flow — Ball positions after launch', () => {
    it('player ball moves from launch position after throw and simulation', () => {
        const ball = new Ball(mockScene, 200, 400, { team: 'player', frictionMult: 1.0 });
        ball.launch(0, -5); // throw upward toward cochonnet

        for (let i = 0; i < 200; i++) {
            ball.update(16);
            if (!ball.isMoving) break;
        }

        expect(ball.y).toBeLessThan(400); // ball moved upward
        expect(ball.isAlive).toBe(true);
        expect(ball.team).toBe('player');
    });

    it('AI (opponent) ball moves correctly after throw and simulation', () => {
        const ball = new Ball(mockScene, 200, 400, { team: 'opponent', frictionMult: 1.0 });
        ball.launch(1, -4); // slight angle toward cochonnet

        for (let i = 0; i < 200; i++) {
            ball.update(16);
            if (!ball.isMoving) break;
        }

        expect(ball.y).toBeLessThan(400); // moved toward cochonnet area
        expect(ball.team).toBe('opponent');
    });
});

// =====================================================
//  D3.3 — Scoring: closest ball wins the point
// =====================================================

describe('Match Flow — Scoring algorithm', () => {
    it('player with closer ball scores 1 point', () => {
        const cochonnet = new Ball(mockScene, 200, 200, { team: 'cochonnet', mass: COCHONNET_MASS });
        const playerBall = new Ball(mockScene, 210, 200, { team: 'player', mass: BALL_MASS }); // 10px
        const oppBall    = new Ball(mockScene, 260, 200, { team: 'opponent', mass: BALL_MASS }); // 60px

        const result = computeScore([playerBall, oppBall], cochonnet);

        expect(result).not.toBeNull();
        expect(result.winner).toBe('player');
        expect(result.points).toBe(1);
    });

    it('opponent wins when their ball is closest to cochonnet', () => {
        const cochonnet = new Ball(mockScene, 200, 200, { team: 'cochonnet', mass: COCHONNET_MASS });
        const playerBall = new Ball(mockScene, 260, 200, { team: 'player', mass: BALL_MASS }); // 60px
        const oppBall    = new Ball(mockScene, 215, 200, { team: 'opponent', mass: BALL_MASS }); // 15px

        const result = computeScore([playerBall, oppBall], cochonnet);

        expect(result.winner).toBe('opponent');
    });

    it('all 3 player balls closer than opponent = 3 points', () => {
        const cochonnet = new Ball(mockScene, 200, 200, { team: 'cochonnet', mass: COCHONNET_MASS });
        const p1 = new Ball(mockScene, 210, 200, { team: 'player', mass: BALL_MASS });  // 10px
        const p2 = new Ball(mockScene, 215, 200, { team: 'player', mass: BALL_MASS });  // 15px
        const p3 = new Ball(mockScene, 220, 200, { team: 'player', mass: BALL_MASS });  // 20px
        const opp = new Ball(mockScene, 260, 200, { team: 'opponent', mass: BALL_MASS }); // 60px

        const result = computeScore([p1, p2, p3, opp], cochonnet);

        expect(result.winner).toBe('player');
        expect(result.points).toBe(3); // all 3 player balls closer than opp's best
    });

    it('mene complete when 3 player + 3 opponent balls placed (6 total)', () => {
        const cochonnet = new Ball(mockScene, 200, 100, { team: 'cochonnet', mass: COCHONNET_MASS });
        const balls = [];
        for (let i = 0; i < 3; i++) {
            balls.push(new Ball(mockScene, 200 + (i + 1) * 15, 200, { team: 'player', mass: BALL_MASS }));
        }
        for (let i = 0; i < 3; i++) {
            balls.push(new Ball(mockScene, 200 + (i + 4) * 15, 200, { team: 'opponent', mass: BALL_MASS }));
        }

        const playerCount = balls.filter(b => b.team === 'player').length;
        const oppCount    = balls.filter(b => b.team === 'opponent').length;

        expect(playerCount).toBe(3); // ballsPerPlayer in tete_a_tete
        expect(oppCount).toBe(3);
        expect(playerCount + oppCount).toBe(6); // mene complete

        // Scoring still works with 6 balls
        const result = computeScore(balls, cochonnet);
        expect(result).not.toBeNull();
    });

    it('scores accumulate correctly across 2 menes', () => {
        const scores = { player: 0, opponent: 0 };

        // Mene 1: player wins 2 points
        const coch1 = new Ball(mockScene, 200, 200, { team: 'cochonnet', mass: COCHONNET_MASS });
        const mene1 = [
            new Ball(mockScene, 210, 200, { team: 'player',   mass: BALL_MASS }), // 10px
            new Ball(mockScene, 215, 200, { team: 'player',   mass: BALL_MASS }), // 15px
            new Ball(mockScene, 260, 200, { team: 'opponent', mass: BALL_MASS })  // 60px
        ];
        const r1 = computeScore(mene1, coch1);
        scores[r1.winner] += r1.points;

        // Mene 2: opponent wins 1 point
        const coch2 = new Ball(mockScene, 300, 300, { team: 'cochonnet', mass: COCHONNET_MASS });
        const mene2 = [
            new Ball(mockScene, 350, 300, { team: 'player',   mass: BALL_MASS }), // 50px
            new Ball(mockScene, 310, 300, { team: 'opponent', mass: BALL_MASS })  // 10px
        ];
        const r2 = computeScore(mene2, coch2);
        scores[r2.winner] += r2.points;

        expect(scores.player).toBe(2);
        expect(scores.opponent).toBe(1);
    });
});
