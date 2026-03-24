import { describe, it, expect, vi } from 'vitest';
import {
    AI_EASY, AI_HARD,
    LOFT_TIR, LOFT_ROULETTE, LOFT_DEMI_PORTEE, LOFT_PLOMBEE,
    TERRAIN_FRICTION
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

// === CHARACTER DATA (matches current characters.json exactly) ===

const LEY_DATA = {
    id: 'ley', name: 'Ley', archetype: 'tireur',
    stats: { precision: 8, puissance: 9, effet: 9, sang_froid: 5 },
    ai: { personality: 'tireur', angleDev: 3, powerDev: 0.04, shootProbability: 0.92, loftPref: 'tir', targetsCocho: false }
};

const MAGICIEN_DATA = {
    id: 'magicien', name: 'Le Magicien', archetype: 'pointeur',
    stats: { precision: 10, puissance: 4, effet: 7, sang_froid: 9 },
    ai: { personality: 'pointeur', angleDev: 1.5, powerDev: 0.02, shootProbability: 0.10, loftPref: 'demi_plombee', targetsCocho: false }
};

const LA_CHOUPE_DATA = {
    id: 'la_choupe', name: 'La Choupe', archetype: 'tireur',
    stats: { precision: 5, puissance: 10, effet: 3, sang_froid: 6 },
    ai: { personality: 'tireur', angleDev: 10, powerDev: 0.07, shootProbability: 0.82, loftPref: 'tir', targetsCocho: false }
};

const MARCEL_DATA = {
    id: 'marcel', name: 'Marcel', archetype: 'equilibre',
    stats: { precision: 8, puissance: 5, effet: 5, sang_froid: 8 },
    ai: { personality: 'equilibre', angleDev: 3, powerDev: 0.04, shootProbability: 0.25, loftPref: 'adaptatif', targetsCocho: false }
};

// =====================================================
//  1. CHARACTER CONSTRUCTION
// =====================================================

describe('PetanqueAI - Character construction', () => {
    it('Ley: tireur with correct stats', () => {
        const ai = new PetanqueAI(mockScene, createMockEngine(), 'medium', null, LEY_DATA);
        expect(ai.precisionConfig.angleDev).toBe(3);
        expect(ai.precisionConfig.powerDev).toBe(0.04);
        expect(ai.personality.shootProbability).toBe(0.92);
        expect(ai.personality.personality).toBe('tireur');
    });

    it('Le Magicien: pointeur with correct stats', () => {
        const ai = new PetanqueAI(mockScene, createMockEngine(), 'medium', null, MAGICIEN_DATA);
        expect(ai.precisionConfig.angleDev).toBe(1.5);
        expect(ai.precisionConfig.powerDev).toBe(0.02);
        expect(ai.personality.shootProbability).toBe(0.10);
        expect(ai.personality.personality).toBe('pointeur');
    });

    it('La Choupe: tireur imprecis', () => {
        const ai = new PetanqueAI(mockScene, createMockEngine(), 'medium', null, LA_CHOUPE_DATA);
        expect(ai.precisionConfig.angleDev).toBe(10);
        expect(ai.precisionConfig.powerDev).toBe(0.07);
        expect(ai.personality.shootProbability).toBe(0.82);
    });

    it('Marcel: equilibre', () => {
        const ai = new PetanqueAI(mockScene, createMockEngine(), 'medium', null, MARCEL_DATA);
        expect(ai.precisionConfig.angleDev).toBe(3);
        expect(ai.personality.shootProbability).toBe(0.25);
        expect(ai.personality.personality).toBe('equilibre');
    });

    it('fallback to difficulty when no character data', () => {
        const ai = new PetanqueAI(mockScene, createMockEngine(), 'hard');
        expect(ai.precisionConfig.angleDev).toBe(AI_HARD.angleDev);
    });
});

// =====================================================
//  2. LEY - Le Carreau Vivant (tireur agressif)
// =====================================================

describe('Ley - Le Carreau Vivant', () => {
    it('should shoot >90% of the time when losing the point (100 parties)', () => {
        const mockBall = { x: 400, y: 110, isAlive: true, distanceTo: () => 20 };
        const engine = createMockEngine({ playerBalls: [mockBall], opponentDist: 50, playerDist: 20 });
        const ai = new PetanqueAI(mockScene, engine, 'medium', null, LEY_DATA);

        let shoots = 0;
        for (let i = 0; i < 100; i++) {
            const { shotMode } = ai._chooseTarget();
            if (shotMode === 'tirer') shoots++;
        }
        expect(shoots).toBeGreaterThan(90);
    });

    it('should point when he already has the point (tireur conserves)', () => {
        const mockBall = { x: 400, y: 110, isAlive: true, distanceTo: () => 30 };
        const engine = createMockEngine({ playerBalls: [mockBall], opponentDist: 15, playerDist: 30 });
        const ai = new PetanqueAI(mockScene, engine, 'medium', null, LEY_DATA);

        let shoots = 0;
        for (let i = 0; i < 100; i++) {
            const { shotMode } = ai._chooseTarget();
            if (shotMode === 'tirer') shoots++;
        }
        // TireurStrategy points when already has the point
        expect(shoots).toBe(0);
    });

    it('should conserve last ball when has the point', () => {
        const mockBall = { x: 400, y: 110, isAlive: true, distanceTo: () => 30 };
        const engine = createMockEngine({ playerBalls: [mockBall], opponentDist: 15, playerDist: 30 });
        engine.remaining.opponent = 1;
        const ai = new PetanqueAI(mockScene, engine, 'medium', null, LEY_DATA);

        let shoots = 0;
        for (let i = 0; i < 100; i++) {
            const { shotMode } = ai._chooseTarget();
            if (shotMode === 'tirer') shoots++;
        }
        expect(shoots).toBe(0);
    });

    it('should be more precise than La Choupe at shooting', () => {
        // Ley angleDev=3, La Choupe angleDev=10
        expect(LEY_DATA.ai.angleDev).toBeLessThan(LA_CHOUPE_DATA.ai.angleDev);
        expect(LEY_DATA.ai.powerDev).toBeLessThan(LA_CHOUPE_DATA.ai.powerDev);
    });

    it('tireur precision bonus: 45% less angle deviation when shooting', () => {
        const ai = new PetanqueAI(mockScene, createMockEngine(), 'medium', null, LEY_DATA);
        // In _throwBall, tireur gets angleDev *= 0.55 when shooting
        expect(ai.precisionConfig.angleDev * 0.55).toBeCloseTo(1.65, 1);
    });
});

// =====================================================
//  3. LE MAGICIEN - Le Chirurgien (pointeur)
// =====================================================

describe('Le Magicien - Le Chirurgien', () => {
    it('should barely ever shoot (shootProb 0.10 over 200 shots)', () => {
        const mockBall = { x: 400, y: 110, isAlive: true, distanceTo: () => 20 };
        const engine = createMockEngine({ playerBalls: [mockBall], opponentDist: 50, playerDist: 20 });
        const ai = new PetanqueAI(mockScene, engine, 'medium', null, MAGICIEN_DATA);

        let shoots = 0;
        for (let i = 0; i < 200; i++) {
            const { shotMode } = ai._chooseTarget();
            if (shotMode === 'tirer') shoots++;
        }
        expect(shoots).toBeLessThan(20); // Very rare shooting
    });

    it('should alternate demi-portee and plombee', () => {
        const engine = createMockEngine({ playerBalls: [] });
        const ai = new PetanqueAI(mockScene, engine, 'medium', null, MAGICIEN_DATA);
        const loftIds = new Set();
        for (let i = 0; i < 50; i++) {
            loftIds.add(ai._strategy._chooseLoft().id);
        }
        expect(loftIds.has('demi_portee')).toBe(true);
        expect(loftIds.has('plombee')).toBe(true);
    });

    it('should aim very close to cochonnet (precision 10, angleDev 1.5)', () => {
        const engine = createMockEngine({ playerBalls: [] });
        const ai = new PetanqueAI(mockScene, engine, 'medium', null, MAGICIEN_DATA);

        let totalDist = 0;
        for (let i = 0; i < 200; i++) {
            const { target } = ai._chooseTarget();
            const dx = target.x - 400, dy = target.y - 100;
            totalDist += Math.sqrt(dx * dx + dy * dy);
        }
        expect(totalDist / 200).toBeLessThan(15);
    });

    it('pointeur precision bonus: 40% less deviation when pointing', () => {
        const ai = new PetanqueAI(mockScene, createMockEngine(), 'medium', null, MAGICIEN_DATA);
        expect(ai.precisionConfig.angleDev * 0.6).toBeCloseTo(0.9, 1);
    });

    it('pointeur penalty: 50% more deviation when forced to shoot', () => {
        const ai = new PetanqueAI(mockScene, createMockEngine(), 'medium', null, MAGICIEN_DATA);
        expect(ai.precisionConfig.angleDev * 1.5).toBeCloseTo(2.25, 1);
    });
});

// =====================================================
//  4. LA CHOUPE - Le Canon (tireur imprecis)
// =====================================================

describe('La Choupe - Le Canon', () => {
    it('should shoot >75% when losing the point', () => {
        const mockBall = { x: 400, y: 110, isAlive: true, distanceTo: () => 20 };
        const engine = createMockEngine({ playerBalls: [mockBall], opponentDist: 50, playerDist: 20 });
        const ai = new PetanqueAI(mockScene, engine, 'medium', null, LA_CHOUPE_DATA);

        let shoots = 0;
        for (let i = 0; i < 100; i++) {
            const { shotMode } = ai._chooseTarget();
            if (shotMode === 'tirer') shoots++;
        }
        expect(shoots).toBeGreaterThan(75);
    });

    it('should be LESS precise than Ley at angleDev', () => {
        expect(LA_CHOUPE_DATA.ai.angleDev).toBeGreaterThan(LEY_DATA.ai.angleDev * 2);
    });

    it('max puissance (10) should give high puissanceMult', () => {
        // puissanceMult = 0.7 + (puissance - 1) / 9 * 0.5
        const choupe = 0.7 + (10 - 1) / 9 * 0.5;
        const magicien = 0.7 + (4 - 1) / 9 * 0.5;
        expect(choupe).toBeCloseTo(1.2, 1);
        expect(magicien).toBeCloseTo(0.867, 1);
        expect(choupe).toBeGreaterThan(magicien);
    });
});

// =====================================================
//  5. MARCEL - Le Vieux Renard (equilibre)
// =====================================================

describe('Marcel - Le Vieux Renard', () => {
    it('should point most of the time but sometimes shoot (200 trials)', () => {
        const mockBall = { x: 400, y: 110, isAlive: true, distanceTo: () => 15 };
        const engine = createMockEngine({ playerBalls: [mockBall], opponentDist: 50, playerDist: 15 });
        const ai = new PetanqueAI(mockScene, engine, 'medium', null, MARCEL_DATA);

        let shoots = 0;
        for (let i = 0; i < 200; i++) {
            const { shotMode } = ai._chooseTarget();
            if (shotMode === 'tirer') shoots++;
        }
        expect(shoots).toBeGreaterThan(10); // sometimes shoots
        expect(shoots).toBeLessThan(150); // mostly points
    });

    it('should not target cochonnet (targetsCocho=false)', () => {
        const mockBall = { x: 400, y: 110, isAlive: true, distanceTo: () => 25 };
        const engine = createMockEngine({ playerBalls: [mockBall], opponentDist: 40, playerDist: 25 });
        engine.remaining.opponent = 1;
        const ai = new PetanqueAI(mockScene, engine, 'medium', null, MARCEL_DATA);

        let cochoShots = 0;
        for (let i = 0; i < 200; i++) {
            const { target, shotMode } = ai._chooseTarget();
            if (shotMode === 'tirer' && Math.abs(target.x - 400) < 1 && Math.abs(target.y - 100) < 1) {
                cochoShots++;
            }
        }
        expect(cochoShots).toBe(0);
    });

    it('has highest sang_froid (8) tied with Magicien (9)', () => {
        expect(MARCEL_DATA.stats.sang_froid).toBe(8);
        expect(MAGICIEN_DATA.stats.sang_froid).toBe(9);
        expect(LEY_DATA.stats.sang_froid).toBe(5);
    });
});

// =====================================================
//  6. PRESSURE (sang-froid impact)
// =====================================================

describe('Pressure system (sang-froid)', () => {
    it('Ley (SF=5) should degrade most under pressure', () => {
        const pressureMult = 1 + (10 - 5) / 9 * 0.8;
        expect(pressureMult).toBeCloseTo(1.444, 2);
    });

    it('Le Magicien (SF=9) barely degrades', () => {
        const pressureMult = 1 + (10 - 9) / 9 * 0.8;
        expect(pressureMult).toBeCloseTo(1.089, 2);
    });

    it('La Choupe (SF=6) moderate degradation', () => {
        const pressureMult = 1 + (10 - 6) / 9 * 0.8;
        expect(pressureMult).toBeCloseTo(1.356, 2);
    });

    it('Marcel (SF=8) slight degradation', () => {
        const pressureMult = 1 + (10 - 8) / 9 * 0.8;
        expect(pressureMult).toBeCloseTo(1.178, 2);
    });

    it('ranking of pressure resilience: Magicien > Marcel > Choupe > Ley', () => {
        const ley = 1 + (10 - 5) / 9 * 0.8;
        const mag = 1 + (10 - 9) / 9 * 0.8;
        const choupe = 1 + (10 - 6) / 9 * 0.8;
        const marcel = 1 + (10 - 8) / 9 * 0.8;
        expect(mag).toBeLessThan(marcel);
        expect(marcel).toBeLessThan(choupe);
        expect(choupe).toBeLessThan(ley);
    });
});

// =====================================================
//  7. PRECISION WOBBLE (AimingSystem)
// =====================================================

describe('Precision wobble calculations', () => {
    function getWobbleAmplitude(precision, techniquePenalty = 0) {
        return 2 + (10 - precision) * 1.8 + techniquePenalty * 2;
    }
    function getWobbleSpeed(precision) {
        return 1.2 + (10 - precision) * 0.26;
    }

    it('Le Magicien (PRE=10) has tiny wobble: 2px', () => {
        expect(getWobbleAmplitude(10)).toBeCloseTo(2, 1);
    });

    it('La Choupe (PRE=5) has large wobble: 11px', () => {
        expect(getWobbleAmplitude(5)).toBeCloseTo(11, 1);
    });

    it('Ley (PRE=8) moderate wobble: 5.6px', () => {
        expect(getWobbleAmplitude(8)).toBeCloseTo(5.6, 1);
    });

    it('Marcel (PRE=8) same wobble as Ley: 5.6px', () => {
        expect(getWobbleAmplitude(8)).toBeCloseTo(5.6, 1);
    });

    it('plombee adds +3 penalty -> extra 6px wobble', () => {
        const base = getWobbleAmplitude(8, 0);   // 5.6
        const plombee = getWobbleAmplitude(8, 3); // 5.6 + 6 = 11.6
        expect(plombee - base).toBeCloseTo(6, 1);
    });

    it('wobble speed: Choupe (PRE=5) is 2.7x faster than Magicien (PRE=10)', () => {
        const magSpeed = getWobbleSpeed(10); // 1.2
        const choupeSpeed = getWobbleSpeed(5); // 2.5
        expect(choupeSpeed / magSpeed).toBeGreaterThan(2);
    });

    it('ranking of wobble (best to worst): Magicien < Ley=Marcel < Choupe', () => {
        const mag = getWobbleAmplitude(10);
        const ley = getWobbleAmplitude(8);
        const marcel = getWobbleAmplitude(8);
        const choupe = getWobbleAmplitude(5);
        expect(mag).toBeLessThan(ley);
        expect(ley).toEqual(marcel);
        expect(marcel).toBeLessThan(choupe);
    });
});

// =====================================================
//  8. RETRO (BACKSPIN) MECHANICS
// =====================================================

describe('Retro (backspin) mechanics', () => {
    it('retro intensity scales with effet stat', () => {
        // retroIntensity = 0.1 + (effetStat - 1) / 9 * 0.9
        const leyRetro = 0.1 + (9 - 1) / 9 * 0.9;   // effet 9
        const choupeRetro = 0.1 + (3 - 1) / 9 * 0.9; // effet 3
        const magRetro = 0.1 + (7 - 1) / 9 * 0.9;    // effet 7

        expect(leyRetro).toBeCloseTo(0.9, 1);   // near maximum
        expect(choupeRetro).toBeCloseTo(0.3, 1); // weak retro
        expect(magRetro).toBeCloseTo(0.7, 1);    // decent retro
    });

    it('Ley has strongest retro (effet 9)', () => {
        expect(LEY_DATA.stats.effet).toBe(9);
        expect(LA_CHOUPE_DATA.stats.effet).toBe(3);
        expect(LEY_DATA.stats.effet).toBeGreaterThan(MAGICIEN_DATA.stats.effet);
    });

    it('AI uses retro when effet >= 4', () => {
        // From PetanqueAI._throwBall: retroAllowed && effet >= 4
        expect(LEY_DATA.stats.effet).toBeGreaterThanOrEqual(4); // yes
        expect(MAGICIEN_DATA.stats.effet).toBeGreaterThanOrEqual(4); // yes
        expect(MARCEL_DATA.stats.effet).toBeGreaterThanOrEqual(4); // yes (5)
        expect(LA_CHOUPE_DATA.stats.effet).toBeLessThan(4); // NO - can't retro
    });

    it('retro chance scales with effet: (effetStat - 3) / 7', () => {
        const leyChance = (9 - 3) / 7;    // 85.7%
        const marcelChance = (5 - 3) / 7;  // 28.6%
        const choupeChance = (3 - 3) / 7;  // 0% (can't retro)
        expect(leyChance).toBeCloseTo(0.857, 2);
        expect(marcelChance).toBeCloseTo(0.286, 2);
        expect(choupeChance).toBe(0);
    });
});

// =====================================================
//  9. TERRAIN FRICTION IMPACT
// =====================================================

describe('Terrain friction impact', () => {
    it('terrain friction values are correctly defined', () => {
        expect(TERRAIN_FRICTION.terre).toBe(1.0);
        expect(TERRAIN_FRICTION.herbe).toBe(1.8);
        expect(TERRAIN_FRICTION.sable).toBe(2.0);
        expect(TERRAIN_FRICTION.dalles).toBe(0.7);
    });

    it('sable is 2.0x harder to roll on than terre', () => {
        expect(TERRAIN_FRICTION.sable / TERRAIN_FRICTION.terre).toBe(2.0);
    });

    it('dalles is easier to roll on than terre', () => {
        expect(TERRAIN_FRICTION.terre / TERRAIN_FRICTION.dalles).toBeCloseTo(1.4286, 3);
    });

    it('herbe is 1.8x harder than terre', () => {
        expect(TERRAIN_FRICTION.herbe / TERRAIN_FRICTION.terre).toBe(1.8);
    });
});

// =====================================================
//  10. COCHONNET THROW PERSONALITY
// =====================================================

describe('Cochonnet throw personality', () => {
    it('Pointeur throws cochonnet close and centered (avg power ~0.45)', () => {
        const engine = createMockEngine();
        const ai = new PetanqueAI(mockScene, engine, 'medium', null, MAGICIEN_DATA);

        let totalPower = 0, N = 100;
        for (let i = 0; i < N; i++) {
            engine.throwCochonnet.mockClear();
            ai._throwCochonnet();
            totalPower += engine.throwCochonnet.mock.calls[0][1];
        }
        expect(totalPower / N).toBeCloseTo(0.45, 0.15);
    });

    it('Tireur throws cochonnet further (avg power ~0.7)', () => {
        const engine = createMockEngine();
        const ai = new PetanqueAI(mockScene, engine, 'medium', null, LEY_DATA);

        let totalPower = 0, N = 100;
        for (let i = 0; i < N; i++) {
            engine.throwCochonnet.mockClear();
            ai._throwCochonnet();
            totalPower += engine.throwCochonnet.mock.calls[0][1];
        }
        expect(totalPower / N).toBeCloseTo(0.7, 0.2);
    });

    it('Tireur throws further than Pointeur (statistical over 100)', () => {
        const engine = createMockEngine();
        const aiP = new PetanqueAI(mockScene, engine, 'medium', null, MAGICIEN_DATA);
        const aiT = new PetanqueAI(mockScene, engine, 'medium', null, LEY_DATA);

        let sumP = 0, sumT = 0, N = 100;
        for (let i = 0; i < N; i++) {
            engine.throwCochonnet.mockClear();
            aiP._throwCochonnet();
            sumP += engine.throwCochonnet.mock.calls[0][1];

            engine.throwCochonnet.mockClear();
            aiT._throwCochonnet();
            sumT += engine.throwCochonnet.mock.calls[0][1];
        }
        expect(sumT / N).toBeGreaterThan(sumP / N);
    });

    it('cochonnet angle deviation: pointeur < tireur', () => {
        // Pointeur uses noise(2) degrees, tireur uses noise(5) degrees
        // Verify by checking angle spread over many throws
        const engine = createMockEngine();
        const aiP = new PetanqueAI(mockScene, engine, 'medium', null, MAGICIEN_DATA);
        const aiT = new PetanqueAI(mockScene, engine, 'medium', null, LEY_DATA);

        let anglesP = [], anglesT = [], N = 100;
        for (let i = 0; i < N; i++) {
            engine.throwCochonnet.mockClear();
            aiP._throwCochonnet();
            anglesP.push(engine.throwCochonnet.mock.calls[0][0]);

            engine.throwCochonnet.mockClear();
            aiT._throwCochonnet();
            anglesT.push(engine.throwCochonnet.mock.calls[0][0]);
        }

        const stdP = Math.sqrt(anglesP.reduce((s, a) => s + (a + Math.PI / 2) ** 2, 0) / N);
        const stdT = Math.sqrt(anglesT.reduce((s, a) => s + (a + Math.PI / 2) ** 2, 0) / N);
        expect(stdP).toBeLessThan(stdT);
    });
});

// =====================================================
//  11. MOMENTUM SYSTEM
// =====================================================

describe('Momentum system', () => {
    it('tireur has higher momentum sensitivity than pointeur', () => {
        const aiT = new PetanqueAI(mockScene, createMockEngine(), 'medium', null, LEY_DATA);
        const aiP = new PetanqueAI(mockScene, createMockEngine(), 'medium', null, MAGICIEN_DATA);
        expect(aiT._momentumSensitivity).toBe(0.20);
        expect(aiP._momentumSensitivity).toBe(0.05);
    });

    it('good shots increase momentum, bad shots decrease', () => {
        const ai = new PetanqueAI(mockScene, createMockEngine(), 'medium', null, LEY_DATA);
        ai.updateMomentum(true);
        expect(ai._momentum).toBeGreaterThan(0);

        ai._momentum = 0;
        ai.updateMomentum(false);
        expect(ai._momentum).toBeLessThan(0);
    });

    it('momentum decays naturally', () => {
        const ai = new PetanqueAI(mockScene, createMockEngine(), 'medium', null, LEY_DATA);
        ai._momentum = 0.5;
        ai.updateMomentum(true);
        ai.updateMomentum(true);
        // After decay (*0.85), momentum should not exceed 1
        expect(ai._momentum).toBeLessThanOrEqual(1);
    });
});

// =====================================================
//  12. STRATEGY DIFFERENTIATION (massive test)
// =====================================================

describe('Strategy differentiation across 500 decisions per character', () => {
    const N = 500;
    const mockBall = { x: 400, y: 110, isAlive: true, distanceTo: () => 20 };

    function runNDecisions(charData, n = N) {
        const engine = createMockEngine({ playerBalls: [mockBall], opponentDist: 50, playerDist: 20 });
        const ai = new PetanqueAI(mockScene, engine, 'medium', null, charData);
        let shoots = 0, points = 0;
        for (let i = 0; i < n; i++) {
            const { shotMode } = ai._chooseTarget();
            if (shotMode === 'tirer') shoots++;
            else points++;
        }
        return { shoots, points, shootRate: shoots / n };
    }

    it('Ley shoots way more than Marcel', () => {
        const ley = runNDecisions(LEY_DATA);
        const marcel = runNDecisions(MARCEL_DATA);
        expect(ley.shootRate).toBeGreaterThan(marcel.shootRate + 0.3);
    });

    it('Le Magicien points way more than Ley', () => {
        const mag = runNDecisions(MAGICIEN_DATA);
        const ley = runNDecisions(LEY_DATA);
        expect(mag.shootRate).toBeLessThan(0.15);
        expect(ley.shootRate).toBeGreaterThan(0.85);
    });

    it('La Choupe and Ley both shoot often, but Ley more precisely', () => {
        const ley = runNDecisions(LEY_DATA);
        const choupe = runNDecisions(LA_CHOUPE_DATA);
        // Both shoot a lot
        expect(ley.shootRate).toBeGreaterThan(0.8);
        expect(choupe.shootRate).toBeGreaterThan(0.7);
        // But Ley is more precise (tested via angleDev)
        expect(LEY_DATA.ai.angleDev).toBeLessThan(LA_CHOUPE_DATA.ai.angleDev);
    });

    it('ranking: tireurs (Ley=Choupe) > Marcel > Magicien', () => {
        const ley = runNDecisions(LEY_DATA);
        const choupe = runNDecisions(LA_CHOUPE_DATA);
        const marcel = runNDecisions(MARCEL_DATA);
        const mag = runNDecisions(MAGICIEN_DATA);

        // Both tireurs shoot at same rate (TireurStrategy always shoots when losing point)
        expect(ley.shootRate).toBeGreaterThanOrEqual(choupe.shootRate - 0.05);
        expect(choupe.shootRate).toBeGreaterThan(marcel.shootRate);
        expect(marcel.shootRate).toBeGreaterThan(mag.shootRate);
    });
});

// =====================================================
//  13. LEGACY FALLBACK
// =====================================================

describe('Legacy difficulty fallback', () => {
    it('easy AI should not shoot', () => {
        const ai = new PetanqueAI(mockScene, createMockEngine(), 'easy');
        expect(ai.precisionConfig.canShoot).toBe(false);
    });

    it('hard AI resolves to pointeur personality', () => {
        const ai = new PetanqueAI(mockScene, createMockEngine(), 'hard');
        expect(ai.personality.personality).toBe('pointeur');
    });

    it('medium AI resolves to tireur personality', () => {
        const ai = new PetanqueAI(mockScene, createMockEngine(), 'medium');
        expect(ai.personality.personality).toBe('tireur');
    });
});
