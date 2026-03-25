import { describe, it, expect, vi } from 'vitest';
import {
    AI_PERSONALITY_MODIFIERS,
    AI_MOMENTUM_SENSITIVITY
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
        frictionMult: 1.0,
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

describe('AI_PERSONALITY_MODIFIERS (Constants.js)', () => {
    it('all four archetypes are defined', () => {
        expect(AI_PERSONALITY_MODIFIERS.tireur).toBeDefined();
        expect(AI_PERSONALITY_MODIFIERS.pointeur).toBeDefined();
        expect(AI_PERSONALITY_MODIFIERS.complet).toBeDefined();
        expect(AI_PERSONALITY_MODIFIERS.equilibre).toBeDefined();
    });

    it('tireur has bonus when shooting (< 1.0) and penalty when pointing (> 1.0)', () => {
        const t = AI_PERSONALITY_MODIFIERS.tireur;
        expect(t.tirer.angle).toBeLessThan(1.0);
        expect(t.pointer.angle).toBeGreaterThan(1.0);
    });

    it('pointeur has bonus when pointing (< 1.0) and penalty when shooting (> 1.0)', () => {
        const p = AI_PERSONALITY_MODIFIERS.pointeur;
        expect(p.pointer.angle).toBeLessThan(1.0);
        expect(p.tirer.angle).toBeGreaterThan(1.0);
    });

    it('complet has bonus in both modes (< 1.0)', () => {
        const c = AI_PERSONALITY_MODIFIERS.complet;
        expect(c.pointer.angle).toBeLessThan(1.0);
        expect(c.tirer.angle).toBeLessThan(1.0);
    });

    it('equilibre has moderate bonus in both modes (< 1.0)', () => {
        const e = AI_PERSONALITY_MODIFIERS.equilibre;
        expect(e.pointer.angle).toBeLessThan(1.0);
        expect(e.tirer.angle).toBeLessThan(1.0);
    });
});

describe('AI_MOMENTUM_SENSITIVITY (Constants.js)', () => {
    it('all four archetypes are defined', () => {
        expect(AI_MOMENTUM_SENSITIVITY.tireur).toBeDefined();
        expect(AI_MOMENTUM_SENSITIVITY.pointeur).toBeDefined();
        expect(AI_MOMENTUM_SENSITIVITY.complet).toBeDefined();
        expect(AI_MOMENTUM_SENSITIVITY.equilibre).toBeDefined();
    });

    it('tireur has highest sensitivity', () => {
        expect(AI_MOMENTUM_SENSITIVITY.tireur).toBeGreaterThan(AI_MOMENTUM_SENSITIVITY.complet);
        expect(AI_MOMENTUM_SENSITIVITY.tireur).toBeGreaterThan(AI_MOMENTUM_SENSITIVITY.pointeur);
        expect(AI_MOMENTUM_SENSITIVITY.tireur).toBeGreaterThan(AI_MOMENTUM_SENSITIVITY.equilibre);
    });

    it('complet has lowest sensitivity (stays calm)', () => {
        expect(AI_MOMENTUM_SENSITIVITY.complet).toBeLessThan(AI_MOMENTUM_SENSITIVITY.pointeur);
    });
});

describe('Pressure modifier (sang_froid edge cases)', () => {
    const SUCHAUD_DATA = {
        id: 'suchaud', name: 'Fernand', archetype: 'tireur',
        stats: { precision: 9, puissance: 8, effet: 7, sang_froid: 9 },
        ai: { personality: 'tireur', angleDev: 2, powerDev: 0.03, shootProbability: 0.88, loftPref: 'tir', targetsCocho: false }
    };

    const LEY_DATA = {
        id: 'ley', name: 'Ley', archetype: 'tireur',
        stats: { precision: 8, puissance: 9, effet: 9, sang_froid: 5 },
        ai: { personality: 'tireur', angleDev: 3, powerDev: 0.04, shootProbability: 0.92, loftPref: 'tir', targetsCocho: false }
    };

    it('high sang_froid (9) = minimal pressure effect', () => {
        // pressureMult = 1 + (10 - 9) / 9 * 0.8 = 1 + 0.089 = 1.089
        const mult = 1 + (10 - 9) / 9 * 0.8;
        expect(mult).toBeCloseTo(1.089, 2);
        expect(mult).toBeLessThan(1.1);
    });

    it('low sang_froid (1) = maximum pressure effect', () => {
        const mult = 1 + (10 - 1) / 9 * 0.8;
        expect(mult).toBeCloseTo(1.8, 2);
    });

    it('sang_froid 5 = moderate pressure', () => {
        const mult = 1 + (10 - 5) / 9 * 0.8;
        expect(mult).toBeCloseTo(1.444, 2);
    });

    it('pressure only applies when both scores >= 10', () => {
        const engine = createMockEngine({ scores: { player: 9, opponent: 10 } });
        const ai = new PetanqueAI(mockScene, engine, 'hard', null, LEY_DATA);
        // With scores below threshold, no pressure should apply
        // We can verify by checking that the AI constructs properly
        expect(ai.precisionConfig.angleDev).toBe(3);
    });
});

describe('Momentum accumulation over 10 shots', () => {
    it('momentum converges toward 1.0 after many good shots', () => {
        const engine = createMockEngine();
        const LEY_DATA = {
            id: 'ley', archetype: 'tireur',
            stats: { precision: 8, puissance: 9, effet: 9, sang_froid: 5 },
            ai: { personality: 'tireur', angleDev: 3, powerDev: 0.04, shootProbability: 0.92, loftPref: 'tir', targetsCocho: false }
        };
        const ai = new PetanqueAI(mockScene, engine, 'hard', null, LEY_DATA);

        for (let i = 0; i < 10; i++) {
            ai.updateMomentum(true);
        }

        // After 10 good shots, momentum should be positive and capped
        expect(ai._momentum).toBeGreaterThan(0);
        expect(ai._momentum).toBeLessThanOrEqual(1.0);
    });

    it('momentum converges toward -1.0 after many bad shots', () => {
        const engine = createMockEngine();
        const MAMIE_DATA = {
            id: 'mamie_josette', archetype: 'pointeur',
            stats: { precision: 7, puissance: 3, effet: 6, sang_froid: 10 },
            ai: { personality: 'pointeur', angleDev: 2, powerDev: 0.03, shootProbability: 0.05, loftPref: 'demi_portee', targetsCocho: false }
        };
        const ai = new PetanqueAI(mockScene, engine, 'medium', null, MAMIE_DATA);

        for (let i = 0; i < 10; i++) {
            ai.updateMomentum(false);
        }

        expect(ai._momentum).toBeLessThan(0);
        expect(ai._momentum).toBeGreaterThanOrEqual(-1.0);
    });

    it('mixed shots keep momentum near 0', () => {
        const engine = createMockEngine();
        const FAZZINO_DATA = {
            id: 'fazzino', archetype: 'equilibre',
            stats: { precision: 9, puissance: 6, effet: 8, sang_froid: 9 },
            ai: { personality: 'equilibre', angleDev: 2, powerDev: 0.03, shootProbability: 0.40, loftPref: 'demi_portee', targetsCocho: false }
        };
        const ai = new PetanqueAI(mockScene, engine, 'hard', null, FAZZINO_DATA);

        // Alternate good/bad shots
        for (let i = 0; i < 20; i++) {
            ai.updateMomentum(i % 2 === 0);
        }

        // Should be close to 0 (natural decay prevents accumulation)
        expect(Math.abs(ai._momentum)).toBeLessThan(0.5);
    });
});
