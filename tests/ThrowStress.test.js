/**
 * Throw Stress Test — Simule 3 loft presets × 10 puissances × 5 terrains
 * Verifie que la boule roule toujours un minimum apres atterrissage.
 * Bug cible: "boule qui s'arrete net" sur certains terrains/puissances.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    LOFT_DEMI_PORTEE, LOFT_PLOMBEE, LOFT_TIR,
    FRICTION_BASE, SPEED_THRESHOLD, TERRAIN_HEIGHT,
    THROW_RANGE_FACTOR, THROW_RANGE_FACTOR_TIR,
    TERRAIN_ROLL_COMPENSATION, TERRAIN_FRICTION,
    BALL_RADIUS, BALL_MASS, MIN_IMPACT_SPEED,
    ALL_LOFT_PRESETS
} from '../src/utils/Constants.js';
import { puissanceMultiplier } from '../src/utils/Constants.js';

// Mock scene pour Ball
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

// Reproduit PetanqueEngine.computeThrowParams
function computeThrowParams(power, loftPreset, frictionMult, puissanceStat = 6) {
    const isTir = loftPreset.id === 'tir';
    const puissanceMult = puissanceMultiplier(puissanceStat);
    const maxDist = TERRAIN_HEIGHT * (isTir ? THROW_RANGE_FACTOR_TIR : THROW_RANGE_FACTOR) * puissanceMult;
    const totalDist = power * maxDist;
    const landDist = totalDist * loftPreset.landingFactor;
    const rollDist = totalDist * (1 - loftPreset.landingFactor);

    const compensatedFriction = FRICTION_BASE * Math.pow(frictionMult, TERRAIN_ROLL_COMPENSATION);
    const rollingSpeed = loftPreset.flyOnly
        ? 0
        : Math.sqrt(2 * compensatedFriction * rollDist * loftPreset.rollEfficiency);

    const angle = -Math.PI / 2; // lancer vers le haut (typique)
    const rollVx = Math.cos(angle) * rollingSpeed;
    const rollVy = Math.sin(angle) * rollingSpeed;

    return { totalDist, landDist, rollDist, rollingSpeed, rollVx, rollVy };
}

// Simule Ball.update en boucle jusqu'a l'arret, retourne la distance parcourue
function simulateRoll(ball, maxFrames = 600) {
    const startX = ball.x;
    const startY = ball.y;
    let frames = 0;
    const dt = 1000 / 60; // 16.67ms = 60fps normal

    while (ball.isMoving && frames < maxFrames) {
        ball.update(dt);
        frames++;
    }

    const dx = ball.x - startX;
    const dy = ball.y - startY;
    return { distance: Math.sqrt(dx * dx + dy * dy), frames };
}

// Simule avec un dt spike (lag frame) au premier update
function simulateRollWithDtSpike(ball, maxFrames = 600) {
    const startX = ball.x;
    const startY = ball.y;
    let frames = 0;

    // Premier frame: dt spike a 50ms (le cap dans Ball.update)
    ball.update(50);
    frames++;

    const dt = 1000 / 60;
    while (ball.isMoving && frames < maxFrames) {
        ball.update(dt);
        frames++;
    }

    const dx = ball.x - startX;
    const dy = ball.y - startY;
    return { distance: Math.sqrt(dx * dx + dy * dy), frames };
}

const TERRAINS = [
    { id: 'village', surface: 'terre', friction: TERRAIN_FRICTION.terre },
    { id: 'plage', surface: 'sable', friction: TERRAIN_FRICTION.sable },
    { id: 'parc', surface: 'herbe', friction: TERRAIN_FRICTION.herbe },
    { id: 'colline', surface: 'terre', friction: TERRAIN_FRICTION.terre },
    { id: 'docks', surface: 'dalles', friction: TERRAIN_FRICTION.dalles },
];

// 10 niveaux de puissance de 0.1 (tres faible) a 1.0 (max)
const POWER_LEVELS = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];

const POINTER_PRESETS = [LOFT_DEMI_PORTEE, LOFT_PLOMBEE];

// ===================================================================
//  1. POINTER THROWS: la boule DOIT rouler un minimum
// ===================================================================
describe('Throw stress — pointer presets (demi-portee, plombee)', () => {
    for (const preset of POINTER_PRESETS) {
        describe(`${preset.label}`, () => {
            for (const terrain of TERRAINS) {
                describe(`terrain ${terrain.id} (${terrain.surface}, friction ${terrain.friction})`, () => {
                    for (const power of POWER_LEVELS) {
                        it(`power ${power.toFixed(1)} — boule roule > 5px`, () => {
                            const params = computeThrowParams(power, preset, terrain.friction);

                            // La vitesse de roulement doit etre > SPEED_THRESHOLD
                            // sinon Ball.update() arrete immediatement la boule
                            expect(params.rollingSpeed).toBeGreaterThan(
                                SPEED_THRESHOLD,
                                `rollingSpeed=${params.rollingSpeed.toFixed(3)} <= SPEED_THRESHOLD=${SPEED_THRESHOLD} — boule s'arrete net!`
                            );

                            // Simuler le roulement reel
                            const ball = new Ball(mockScene, 200, 400, {
                                frictionMult: terrain.friction
                            });
                            ball.launch(params.rollVx, params.rollVy);
                            const result = simulateRoll(ball);

                            expect(result.distance).toBeGreaterThan(
                                5,
                                `distance=${result.distance.toFixed(1)}px en ${result.frames} frames — arret quasi-immediat!`
                            );
                        });
                    }
                });
            }
        });
    }
});

// ===================================================================
//  2. POINTER THROWS avec dt spike: meme a 50ms, la boule doit rouler
// ===================================================================
describe('Throw stress — dt spike resistance', () => {
    for (const preset of POINTER_PRESETS) {
        describe(`${preset.label} avec dt spike (50ms premier frame)`, () => {
            for (const terrain of TERRAINS) {
                for (const power of [0.1, 0.2, 0.3]) { // seulement basses puissances (les plus a risque)
                    it(`${terrain.id} power ${power.toFixed(1)} — survit au dt spike`, () => {
                        const params = computeThrowParams(power, preset, terrain.friction);

                        const ball = new Ball(mockScene, 200, 400, {
                            frictionMult: terrain.friction
                        });
                        ball.launch(params.rollVx, params.rollVy);
                        const result = simulateRollWithDtSpike(ball);

                        expect(result.distance).toBeGreaterThan(
                            3,
                            `dt spike: distance=${result.distance.toFixed(1)}px — boule s'arrete net au premier frame!`
                        );
                    });
                }
            }
        });
    }
});

// ===================================================================
//  3. TIR AU FER: boule DOIT avoir une velocite residuelle (miss safety)
// ===================================================================
describe('Throw stress — tir au fer (miss safety)', () => {
    for (const terrain of TERRAINS) {
        for (const power of POWER_LEVELS) {
            it(`${terrain.id} power ${power.toFixed(1)} — flyOnly miss donne MIN_IMPACT_SPEED * 0.5`, () => {
                const params = computeThrowParams(power, LOFT_TIR, terrain.friction);

                // flyOnly: rollingSpeed doit etre 0 (gere par le miss safety dans _animateThrow)
                expect(params.rollingSpeed).toBe(0);

                // Simuler le miss safety: MIN_IMPACT_SPEED (full, was 0.5× — trop faible sur sable/herbe)
                const missSpeed = MIN_IMPACT_SPEED;
                const angle = -Math.PI / 2;
                const missVx = Math.cos(angle) * missSpeed;
                const missVy = Math.sin(angle) * missSpeed;

                expect(missSpeed).toBeGreaterThan(
                    SPEED_THRESHOLD,
                    `missSpeed=${missSpeed} <= SPEED_THRESHOLD=${SPEED_THRESHOLD} — tir manque s'arrete net!`
                );

                const ball = new Ball(mockScene, 200, 400, {
                    frictionMult: terrain.friction
                });
                ball.launch(missVx, missVy);
                const result = simulateRoll(ball);

                expect(result.distance).toBeGreaterThan(
                    2,
                    `tir miss: distance=${result.distance.toFixed(1)}px — arret quasi-immediat!`
                );
            });
        }
    }
});

// ===================================================================
//  4. PARC ZONES: friction change entre herbe (1.8) et gravier (1.2)
//     Verifier qu'une boule qui passe d'une zone a l'autre ne s'arrete pas
// ===================================================================
describe('Throw stress — parc zone transition', () => {
    // Les zones gravier du parc: rect {x:0.3, y:0, w:0.15, h:1} et {x:0.6, y:0, w:0.15, h:1}
    const parcZones = [
        { type: 'gravier', friction: 1.2, rect: { x: 0.3, y: 0.0, w: 0.15, h: 1.0 } },
        { type: 'gravier', friction: 1.2, rect: { x: 0.6, y: 0.0, w: 0.15, h: 1.0 } },
    ];
    const parcBounds = { x: 326, y: 30, w: 180, h: 420 }; // approximation typique

    for (const preset of POINTER_PRESETS) {
        for (const power of [0.3, 0.5, 0.7]) {
            it(`${preset.label} power ${power} — traverse zone gravier sans arret`, () => {
                const params = computeThrowParams(power, preset, TERRAIN_FRICTION.herbe);

                // Boule demarre dans l'herbe (haute friction)
                const startX = parcBounds.x + parcBounds.w * 0.5; // milieu du terrain
                const startY = parcBounds.y + parcBounds.h * 0.9; // bas du terrain
                const ball = new Ball(mockScene, startX, startY, {
                    frictionMult: TERRAIN_FRICTION.herbe,
                    terrain: { zones: parcZones },
                    bounds: parcBounds
                });
                ball.launch(params.rollVx, params.rollVy);
                const result = simulateRoll(ball);

                expect(result.distance).toBeGreaterThan(5);
            });
        }
    }
});

// ===================================================================
//  5. COMPARAISON: meme puissance, friction basse vs haute
//     dalles (0.7) doit TOUJOURS rouler plus loin que sable (2.0)
// ===================================================================
describe('Throw stress — coherence friction entre terrains', () => {
    for (const preset of POINTER_PRESETS) {
        for (const power of [0.3, 0.5, 0.8]) {
            it(`${preset.label} power ${power} — dalles roule plus loin que sable`, () => {
                const paramsDalles = computeThrowParams(power, preset, TERRAIN_FRICTION.dalles);
                const paramsSable = computeThrowParams(power, preset, TERRAIN_FRICTION.sable);

                const ballDalles = new Ball(mockScene, 200, 400, { frictionMult: TERRAIN_FRICTION.dalles });
                ballDalles.launch(paramsDalles.rollVx, paramsDalles.rollVy);
                const resultDalles = simulateRoll(ballDalles);

                const ballSable = new Ball(mockScene, 200, 400, { frictionMult: TERRAIN_FRICTION.sable });
                ballSable.launch(paramsSable.rollVx, paramsSable.rollVy);
                const resultSable = simulateRoll(ballSable);

                expect(resultDalles.distance).toBeGreaterThan(
                    resultSable.distance,
                    `dalles=${resultDalles.distance.toFixed(1)}px vs sable=${resultSable.distance.toFixed(1)}px — dalles devrait rouler plus!`
                );
            });
        }
    }
});
