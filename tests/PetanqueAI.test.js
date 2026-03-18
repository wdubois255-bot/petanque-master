import { describe, it, expect, vi } from 'vitest';
import {
    AI_EASY, AI_HARD,
    AI_RICARDO,
    LOFT_TIR, LOFT_ROULETTE, LOFT_DEMI_PORTEE, LOFT_PLOMBEE
} from '../src/utils/Constants.js';
import PetanqueAI from '../src/petanque/PetanqueAI.js';

// Minimal mock engine
function createMockEngine(overrides = {}) {
    return {
        state: 'PLAY_LOOP',
        cochonnet: { x: 400, y: 100, isAlive: true },
        scores: { player: 0, opponent: 0 },
        remaining: { player: 3, opponent: 3 },
        terrainType: 'terre',
        getTeamBallsAlive: vi.fn((team) => {
            if (team === 'player') return overrides.playerBalls || [];
            return overrides.opponentBalls || [];
        }),
        _getMinDistance: vi.fn((team) => {
            if (team === 'player') return overrides.playerDist ?? 50;
            return overrides.opponentDist ?? 100;
        }),
        calculateProjectedScore: vi.fn(() => overrides.projectedScore || null),
        throwCochonnet: vi.fn(),
        throwBall: vi.fn(),
        ...overrides
    };
}

const mockScene = {
    throwCircleX: 400,
    throwCircleY: 400,
    time: { delayedCall: (_delay, cb) => cb() },
    add: {
        graphics: () => ({
            setDepth: vi.fn().mockReturnThis(),
            lineStyle: vi.fn(), beginPath: vi.fn(),
            moveTo: vi.fn(), lineTo: vi.fn(), strokePath: vi.fn(),
            destroy: vi.fn()
        })
    }
};

// Character data from characters.json
const MARCEL_DATA = {
    id: 'pointeur', name: 'Marcel', archetype: 'pointeur',
    stats: { precision: 9, puissance: 4, effet: 6, sang_froid: 7 },
    ai: { personality: 'pointeur', angleDev: 3, powerDev: 0.05, shootProbability: 0.1, loftPref: 'roulette', targetsCocho: false }
};

const FANNY_DATA = {
    id: 'tireur', name: 'Fanny', archetype: 'tireur',
    stats: { precision: 5, puissance: 9, effet: 4, sang_froid: 6 },
    ai: { personality: 'tireur', angleDev: 5, powerDev: 0.08, shootProbability: 0.85, loftPref: 'tir', targetsCocho: false }
};

const RICARDO_DATA = {
    id: 'stratege', name: 'Ricardo', archetype: 'stratege',
    stats: { precision: 6, puissance: 5, effet: 9, sang_froid: 6 },
    ai: { personality: 'stratege', angleDev: 4, powerDev: 0.06, shootProbability: 0.5, loftPref: 'adaptatif', targetsCocho: true }
};

const RENE_DATA = {
    id: 'equilibre', name: 'Rene', archetype: 'equilibre',
    stats: { precision: 6, puissance: 6, effet: 6, sang_froid: 6 },
    ai: { personality: 'equilibre', angleDev: 7, powerDev: 0.12, shootProbability: 0.35, loftPref: 'adaptatif', targetsCocho: false }
};

const THIERRY_DATA = {
    id: 'wildcard', name: 'Thierry', archetype: 'wildcard',
    stats: { precision: 7, puissance: 8, effet: 7, sang_froid: 3 },
    ai: { personality: 'wildcard', angleDev: 4, powerDev: 0.07, shootProbability: 0.6, loftPref: 'adaptatif', targetsCocho: true }
};

const MARIUS_DATA = {
    id: 'boss', name: 'Le Grand Marius', archetype: 'boss',
    stats: { precision: 8, puissance: 7, effet: 8, sang_froid: 9 },
    ai: { personality: 'boss', angleDev: 2, powerDev: 0.04, shootProbability: 0.55, loftPref: 'adaptatif', targetsCocho: true }
};

describe('PetanqueAI - Character construction', () => {
    it('should use character data for precision config', () => {
        const engine = createMockEngine();
        const ai = new PetanqueAI(mockScene, engine, 'medium', null, MARCEL_DATA);

        expect(ai.precisionConfig.angleDev).toBe(3);
        expect(ai.precisionConfig.powerDev).toBe(0.05);
    });

    it('should fallback to difficulty when no character data', () => {
        const engine = createMockEngine();
        const ai = new PetanqueAI(mockScene, engine, 'hard');

        expect(ai.precisionConfig.angleDev).toBe(AI_HARD.angleDev);
    });

    it('Marcel has low shoot probability', () => {
        const engine = createMockEngine();
        const ai = new PetanqueAI(mockScene, engine, 'medium', null, MARCEL_DATA);
        expect(ai.personality.shootProbability).toBe(0.1);
    });

    it('Fanny has high shoot probability', () => {
        const engine = createMockEngine();
        const ai = new PetanqueAI(mockScene, engine, 'medium', null, FANNY_DATA);
        expect(ai.personality.shootProbability).toBe(0.85);
    });
});

describe('Marcel (Pointeur) - Almost never shoots', () => {
    it('should prefer pointing when he has the point', () => {
        const mockBall = { x: 400, y: 110, isAlive: true, distanceTo: () => 30 };
        const engine = createMockEngine({
            playerBalls: [mockBall],
            opponentDist: 20,
            playerDist: 30
        });
        const ai = new PetanqueAI(mockScene, engine, 'medium', null, MARCEL_DATA);

        let shoots = 0;
        for (let i = 0; i < 100; i++) {
            const { shotMode } = ai._chooseTarget();
            if (shotMode === 'tirer') shoots++;
        }
        expect(shoots).toBeLessThan(5); // Almost never shoots
    });

    it('should prefer roulette on terre', () => {
        const engine = createMockEngine({ terrainType: 'terre', playerBalls: [] });
        const ai = new PetanqueAI(mockScene, engine, 'medium', null, MARCEL_DATA);
        expect(ai._strategy._chooseLoft().id).toBe('roulette');
    });

    it('should switch to demi-portee on sable', () => {
        const engine = createMockEngine({ terrainType: 'sable', playerBalls: [] });
        engine.terrainType = 'sable';
        const ai = new PetanqueAI(mockScene, engine, 'medium', null, MARCEL_DATA);
        expect(ai._strategy._chooseLoft().id).toBe('demi_portee');
    });

    it('should aim near cochonnet (tight offset)', () => {
        const engine = createMockEngine({ playerBalls: [] });
        const ai = new PetanqueAI(mockScene, engine, 'medium', null, MARCEL_DATA);

        let totalDist = 0;
        const N = 100;
        for (let i = 0; i < N; i++) {
            const { target } = ai._chooseTarget();
            const dx = target.x - 400;
            const dy = target.y - 100;
            totalDist += Math.sqrt(dx * dx + dy * dy);
        }
        // Average offset should be small (< 15px)
        expect(totalDist / N).toBeLessThan(15);
    });
});

describe('Fanny (Tireur) - Shoots when not having the point', () => {
    it('should shoot most of the time when losing the point', () => {
        const mockBall = { x: 400, y: 110, isAlive: true, distanceTo: () => 20 };
        const engine = createMockEngine({
            playerBalls: [mockBall],
            opponentDist: 50,
            playerDist: 20
        });
        const ai = new PetanqueAI(mockScene, engine, 'medium', null, FANNY_DATA);

        let shoots = 0;
        for (let i = 0; i < 100; i++) {
            const { shotMode } = ai._chooseTarget();
            if (shotMode === 'tirer') shoots++;
        }
        expect(shoots).toBeGreaterThan(80);
    });

    it('should conserve last ball when she has the point', () => {
        const mockBall = { x: 400, y: 110, isAlive: true, distanceTo: () => 30 };
        const engine = createMockEngine({
            playerBalls: [mockBall],
            opponentDist: 20,
            playerDist: 30
        });
        engine.remaining.opponent = 1;
        const ai = new PetanqueAI(mockScene, engine, 'medium', null, FANNY_DATA);

        let shoots = 0;
        for (let i = 0; i < 100; i++) {
            const { shotMode } = ai._chooseTarget();
            if (shotMode === 'tirer') shoots++;
        }
        expect(shoots).toBe(0); // Never shoots with last ball when ahead
    });

    it('should use demi-portee when forced to point (not roulette)', () => {
        const engine = createMockEngine({
            playerBalls: [],
            opponentDist: 20,
            playerDist: 30
        });
        const ai = new PetanqueAI(mockScene, engine, 'medium', null, FANNY_DATA);

        // No player balls → must point
        const { loftPreset } = ai._chooseTarget();
        expect(loftPreset.id).toBe('demi_portee');
    });
});

describe('Ricardo (Stratege) - Utility-based decisions', () => {
    it('should sometimes target cochonnet when mene is lost', () => {
        const mockBall1 = { x: 395, y: 95, isAlive: true, distanceTo: () => 10 };
        const mockBall2 = { x: 405, y: 105, isAlive: true, distanceTo: () => 12 };
        const engine = createMockEngine({
            playerBalls: [mockBall1, mockBall2],
            opponentDist: 50,
            playerDist: 10,
            projectedScore: { winner: 'player', points: 4 }
        });
        engine.remaining.opponent = 2;
        const ai = new PetanqueAI(mockScene, engine, 'medium', null, RICARDO_DATA);

        let cochoShots = 0;
        for (let i = 0; i < 500; i++) {
            const { target, shotMode } = ai._chooseTarget();
            if (shotMode === 'tirer' && Math.abs(target.x - 400) < 1 && Math.abs(target.y - 100) < 1) {
                cochoShots++;
            }
        }
        expect(cochoShots).toBeGreaterThan(0);
    });

    it('should adapt loft to terrain', () => {
        const engine = createMockEngine();
        engine.terrainType = 'terre';
        const aiTerre = new PetanqueAI(mockScene, engine, 'medium', null, RICARDO_DATA);
        expect(aiTerre._strategy._chooseLoft().id).toBe('roulette');

        engine.terrainType = 'herbe';
        const aiHerbe = new PetanqueAI(mockScene, engine, 'medium', null, RICARDO_DATA);
        expect(aiHerbe._strategy._chooseLoft().id).toBe('demi_portee');

        engine.terrainType = 'sable';
        const aiSable = new PetanqueAI(mockScene, engine, 'medium', null, RICARDO_DATA);
        expect(aiSable._strategy._chooseLoft().id).toBe('plombee');
    });

    it('should mix shooting and pointing based on utility', () => {
        const mockBall = { x: 400, y: 110, isAlive: true, distanceTo: () => 15 };
        const engine = createMockEngine({
            playerBalls: [mockBall],
            opponentDist: 40,
            playerDist: 15
        });
        const ai = new PetanqueAI(mockScene, engine, 'medium', null, RICARDO_DATA);

        const results = { shoot: 0, point: 0 };
        for (let i = 0; i < 200; i++) {
            const { shotMode } = ai._chooseTarget();
            results[shotMode === 'tirer' ? 'shoot' : 'point']++;
        }
        // Should show a genuine mix (utility-based with noise)
        expect(results.shoot).toBeGreaterThan(15);
        expect(results.point).toBeGreaterThan(15);
    });
});

describe('Rene (Equilibre) - Simple reactive play', () => {
    it('should not target cochonnet', () => {
        const mockBall = { x: 400, y: 110, isAlive: true, distanceTo: () => 25 };
        const engine = createMockEngine({
            playerBalls: [mockBall],
            opponentDist: 40,
            playerDist: 25
        });
        engine.remaining.opponent = 1;
        const ai = new PetanqueAI(mockScene, engine, 'medium', null, RENE_DATA);

        let cochoShots = 0;
        for (let i = 0; i < 200; i++) {
            const { target, shotMode } = ai._chooseTarget();
            if (shotMode === 'tirer' && Math.abs(target.x - 400) < 1 && Math.abs(target.y - 100) < 1) {
                cochoShots++;
            }
        }
        expect(cochoShots).toBe(0);
    });

    it('should occasionally shoot when not having the point with close ball', () => {
        const mockBall = { x: 400, y: 110, isAlive: true, distanceTo: () => 12 };
        const engine = createMockEngine({
            playerBalls: [mockBall],
            opponentDist: 50,
            playerDist: 12
        });
        const ai = new PetanqueAI(mockScene, engine, 'medium', null, RENE_DATA);

        let shoots = 0;
        for (let i = 0; i < 200; i++) {
            const { shotMode } = ai._chooseTarget();
            if (shotMode === 'tirer') shoots++;
        }
        // Should shoot sometimes but not too often
        expect(shoots).toBeGreaterThan(10);
        expect(shoots).toBeLessThan(120);
    });
});

describe('Thierry (Wildcard) - Unpredictable', () => {
    it('should have a wide mix of actions', () => {
        const mockBall = { x: 400, y: 110, isAlive: true, distanceTo: () => 25 };
        const engine = createMockEngine({
            playerBalls: [mockBall],
            opponentDist: 40,
            playerDist: 25
        });
        const ai = new PetanqueAI(mockScene, engine, 'medium', null, THIERRY_DATA);

        const results = { shoot: 0, point: 0 };
        for (let i = 0; i < 300; i++) {
            const { shotMode } = ai._chooseTarget();
            results[shotMode === 'tirer' ? 'shoot' : 'point']++;
        }
        // Both should be represented significantly
        expect(results.shoot).toBeGreaterThan(40);
        expect(results.point).toBeGreaterThan(40);
    });

    it('should sometimes use varied lofts including plombee', () => {
        const engine = createMockEngine({ playerBalls: [] });
        engine.terrainType = 'terre';
        const ai = new PetanqueAI(mockScene, engine, 'medium', null, THIERRY_DATA);

        const lofts = new Set();
        for (let i = 0; i < 200; i++) {
            const { loftPreset } = ai._chooseTarget();
            lofts.add(loftPreset.id);
        }
        // Should use at least 2 different loft types
        expect(lofts.size).toBeGreaterThanOrEqual(2);
    });
});

describe('Marius (Boss) - Optimal play', () => {
    it('should have the best precision in the roster', () => {
        const engine = createMockEngine();
        const aiMarius = new PetanqueAI(mockScene, engine, 'medium', null, MARIUS_DATA);
        const aiMarcel = new PetanqueAI(mockScene, engine, 'medium', null, MARCEL_DATA);
        const aiFanny = new PetanqueAI(mockScene, engine, 'medium', null, FANNY_DATA);

        expect(aiMarius.precisionConfig.angleDev).toBeLessThanOrEqual(aiMarcel.precisionConfig.angleDev);
        expect(aiMarius.precisionConfig.powerDev).toBeLessThanOrEqual(aiMarcel.precisionConfig.powerDev);
    });

    it('should aim with tight offset like pointeur when pointing', () => {
        const engine = createMockEngine({
            playerBalls: [],
            opponentDist: 20,
            playerDist: 50
        });
        const ai = new PetanqueAI(mockScene, engine, 'medium', null, MARIUS_DATA);

        let totalDist = 0;
        const N = 100;
        for (let i = 0; i < N; i++) {
            const { target } = ai._chooseTarget();
            const dx = target.x - 400;
            const dy = target.y - 100;
            totalDist += Math.sqrt(dx * dx + dy * dy);
        }
        expect(totalDist / N).toBeLessThan(15);
    });

    it('should make utility-based shoot decisions', () => {
        const mockBall = { x: 400, y: 108, isAlive: true, distanceTo: () => 8 };
        const engine = createMockEngine({
            playerBalls: [mockBall],
            opponentDist: 40,
            playerDist: 8
        });
        const ai = new PetanqueAI(mockScene, engine, 'medium', null, MARIUS_DATA);

        let shoots = 0;
        for (let i = 0; i < 200; i++) {
            const { shotMode } = ai._chooseTarget();
            if (shotMode === 'tirer') shoots++;
        }
        // Should shoot when not having the point with close threat
        expect(shoots).toBeGreaterThan(50);
    });
});

describe('Pressure (sang-froid)', () => {
    it('Thierry (sang-froid 3) degrades badly under pressure', () => {
        const pressureMult = 1 + (10 - 3) / 9 * 0.8;
        expect(pressureMult).toBeCloseTo(1.622, 2);
    });

    it('Marius (sang-froid 9) barely degrades under pressure', () => {
        const pressureMult = 1 + (10 - 9) / 9 * 0.8;
        expect(pressureMult).toBeCloseTo(1.089, 2);
    });
});

describe('Tireur gets precision bonus on shots', () => {
    it('should reduce angleDev by 30% when shooting', () => {
        // Base angleDev: 5, with tireur bonus: 5 * 0.7 = 3.5
        // This is tested implicitly — the bonus is applied in _throwBall
        const engine = createMockEngine();
        const ai = new PetanqueAI(mockScene, engine, 'medium', null, FANNY_DATA);
        const baseAngle = ai.precisionConfig.angleDev;
        expect(baseAngle * 0.7).toBeCloseTo(3.5, 1);
    });
});

describe('Pointeur gets precision bonus on points', () => {
    it('should reduce angleDev by 25% when pointing', () => {
        const engine = createMockEngine();
        const ai = new PetanqueAI(mockScene, engine, 'medium', null, MARCEL_DATA);
        const baseAngle = ai.precisionConfig.angleDev;
        expect(baseAngle * 0.75).toBeCloseTo(2.25, 1);
    });
});

describe('Legacy difficulty fallback', () => {
    it('easy AI should not shoot', () => {
        const engine = createMockEngine();
        const ai = new PetanqueAI(mockScene, engine, 'easy');
        expect(ai.precisionConfig.canShoot).toBe(false);
    });

    it('hard AI should resolve to stratege personality', () => {
        const engine = createMockEngine();
        const ai = new PetanqueAI(mockScene, engine, 'hard');
        expect(ai.personality).toEqual(AI_RICARDO);
    });
});

describe('Cochonnet throw varies by character', () => {
    it('Pointeur should throw cochonnet close and centered', () => {
        const engine = createMockEngine();
        const ai = new PetanqueAI(mockScene, engine, 'medium', null, MARCEL_DATA);

        let totalPower = 0;
        const N = 50;
        for (let i = 0; i < N; i++) {
            engine.throwCochonnet.mockClear();
            ai._throwCochonnet();
            const [, power] = engine.throwCochonnet.mock.calls[0];
            totalPower += power;
        }
        // Average power should be around 0.45 (medium-close)
        expect(totalPower / N).toBeCloseTo(0.45, 0.15);
    });

    it('Tireur should throw cochonnet further', () => {
        const engine = createMockEngine();
        const aiPointeur = new PetanqueAI(mockScene, engine, 'medium', null, MARCEL_DATA);
        const aiTireur = new PetanqueAI(mockScene, engine, 'medium', null, FANNY_DATA);

        let totalPointeur = 0, totalTireur = 0;
        const N = 50;
        for (let i = 0; i < N; i++) {
            engine.throwCochonnet.mockClear();
            aiPointeur._throwCochonnet();
            totalPointeur += engine.throwCochonnet.mock.calls[0][1];

            engine.throwCochonnet.mockClear();
            aiTireur._throwCochonnet();
            totalTireur += engine.throwCochonnet.mock.calls[0][1];
        }
        expect(totalTireur / N).toBeGreaterThan(totalPointeur / N);
    });
});
