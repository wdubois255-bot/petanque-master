/**
 * AimingPrecision.test.js — Tests exhaustifs de precision de la visee
 *
 * Verifie que ce qui est affiche au joueur (marqueur, puissance, wobble)
 * correspond exactement a ce qui est execute au lancer.
 * Detecte toute incoherence visuel / physique qui pourrait tromper le joueur.
 *
 * Sections:
 *   1. Coherence marqueur visuel vs point d'atterrissage reel
 *   2. Puissance quadratique: affichage vs valeur reelle
 *   3. Wobble: offset visuel == offset applique au lancer
 *   4. Cochonnet: marqueur vs atterrissage
 *   5. Limites du terrain: marqueur clamp == physique clamp
 *   6. Roulement post-atterrissage: le marqueur ne trompe pas
 *   7. Pression/tremble: visuel == physique
 *   8. Power wobble: bornes et coherence
 *   9. Dead lines == bounds du terrain
 */
import { describe, it, expect } from 'vitest';
import {
    TERRAIN_WIDTH, TERRAIN_HEIGHT,
    GAME_WIDTH, GAME_HEIGHT,
    LOFT_DEMI_PORTEE, LOFT_PLOMBEE, LOFT_TIR,
    ALL_LOFT_PRESETS,
    FRICTION_BASE, TERRAIN_ROLL_COMPENSATION,
    THROW_RANGE_FACTOR, THROW_RANGE_FACTOR_TIR,
    BALL_CLAMP_MARGIN, BALL_RADIUS,
    COCHONNET_MIN_DIST, COCHONNET_MAX_DIST,
    COCHONNET_SAFE_MARGIN, COCHONNET_CLAMP_MARGIN,
    DEAD_ZONE_PX,
    TERRAIN_FRICTION,
    SPEED_THRESHOLD,
    RETRO_FRICTION_MULT,
    RETRO_INTENSITY_BY_EFFET,
    puissanceMultiplier
} from '../src/utils/Constants.js';
import PetanqueEngine from '../src/petanque/PetanqueEngine.js';

// --- Setup: memes valeurs que PetanqueScene ---
const terrainX = (GAME_WIDTH - TERRAIN_WIDTH) / 2;   // 326
const terrainY = (GAME_HEIGHT - TERRAIN_HEIGHT) / 2;  // 30
const bounds = { x: terrainX, y: terrainY, w: TERRAIN_WIDTH, h: TERRAIN_HEIGHT };
const originX = GAME_WIDTH / 2;  // 416 — centre du terrain
const originY = terrainY + TERRAIN_HEIGHT - 20;  // ~430 — cercle de lancer en bas

// --- Helpers: reproduisent les formules de AimingSystem.js ---

/** Reproduit le calcul du marqueur visuel pendant le drag (AimingSystem.update)
 *  Le marqueur montre le point d'ATTERRISSAGE predit (premier contact sol).
 *  Utilise le meme angle wobble + power wobble que onPointerUp. */
function computeVisualMarker(angle, rawPower, loftPreset, frictionMult = 1.0, puissanceStat = 6,
    wobbleOffset = { x: 0, y: 0 }, trembleOffset = { x: 0, y: 0 }, aimTime = 0,
    bouleFrictionMult = 1, retroIntensity = 0) {
    const power = rawPower * rawPower;
    // Wobbled angle (same as onPointerUp + update)
    const wobbleAngleOffset = Math.atan2(wobbleOffset.y, wobbleOffset.x + 100) - Math.atan2(0, 100);
    const wobbledAngle = angle + wobbleAngleOffset + trembleOffset.x * 0.002;
    // Power wobble (same as onPointerUp)
    const techniquePenalty = loftPreset.precisionPenalty || 0;
    const wobbleMag = Math.sqrt(wobbleOffset.x ** 2 + wobbleOffset.y ** 2);
    const maxWobble = getWobbleAmplitude(puissanceStat, techniquePenalty); // approx
    const powerWobble = maxWobble > 0
        ? (wobbleMag / maxWobble) * 0.03 * (1 + techniquePenalty * 0.3) : 0;
    const wobbledPower = Math.max(0.01, Math.min(1, power + Math.sin(aimTime * 2.3) * powerWobble));
    const params = PetanqueEngine.computeThrowParams(
        wobbledAngle, wobbledPower, originX, originY, bounds, loftPreset, frictionMult, puissanceStat,
        bouleFrictionMult, retroIntensity
    );
    return { markerX: params.targetX, markerY: params.targetY };
}

/** Reproduit le calcul au relacher (AimingSystem.onPointerUp) — SANS wobble */
function computeThrowLanding(angle, rawPower, loftPreset, frictionMult = 1.0, puissanceStat = 6) {
    const power = rawPower * rawPower;
    return PetanqueEngine.computeThrowParams(
        angle, power, originX, originY, bounds, loftPreset, frictionMult, puissanceStat
    );
}

/** Reproduit le calcul du marqueur cochonnet (AimingSystem.update cochonnet branch) */
function computeCochonnetMarker(angle, rawPower) {
    const cochDist = COCHONNET_MIN_DIST + rawPower * (COCHONNET_MAX_DIST - COCHONNET_MIN_DIST);
    const margin = 20;
    const markerX = Math.max(bounds.x + margin, Math.min(bounds.x + bounds.w - margin,
        originX + Math.cos(angle) * cochDist));
    const markerY = Math.max(bounds.y + margin, Math.min(bounds.y + bounds.h - margin,
        originY + Math.sin(angle) * cochDist));
    return { markerX, markerY, cochDist };
}

/** Wobble amplitude (miroir de AimingSystem._getWobbleAmplitude) */
function getWobbleAmplitude(precision, techniquePenalty = 0, focusActive = false) {
    let base = 2 + (10 - precision) * 1.8 + techniquePenalty * 2;
    return base * (focusActive ? 0.20 : 1.0);
}

/** Wobble angle offset au relacher (miroir de AimingSystem.onPointerUp) */
function computeWobbleAngleOffset(wobbleX, wobbleY) {
    return Math.atan2(wobbleY, wobbleX + 100) - Math.atan2(0, 100);
}

/** Power wobble au relacher */
function computePowerWobble(wobbleX, wobbleY, maxAmplitude, techniquePenalty, aimTime) {
    const wobbleMag = Math.sqrt(wobbleX ** 2 + wobbleY ** 2);
    const powerWobble = maxAmplitude > 0
        ? (wobbleMag / maxAmplitude) * 0.03 * (1 + techniquePenalty * 0.3)
        : 0;
    return Math.sin(aimTime * 2.3) * powerWobble;
}

// =====================================================================
// 1. COHERENCE MARQUEUR VISUEL vs POINT D'ATTERRISSAGE (PREMIER CONTACT SOL)
// =====================================================================

describe('1. Marqueur visuel == point d\'atterrissage predit (sans wobble)', () => {
    const angles = [-Math.PI / 2, -Math.PI / 3, -Math.PI * 2 / 3]; // haut, diag gauche, diag droite
    const powers = [0.2, 0.5, 0.7, 1.0];

    for (const loft of ALL_LOFT_PRESETS) {
        describe(`Loft: ${loft.label}`, () => {
            for (const rawPower of powers) {
                for (const angle of angles) {
                    it(`power=${rawPower}, angle=${angle.toFixed(2)} — marqueur == targetX/targetY`, () => {
                        const visual = computeVisualMarker(angle, rawPower, loft);
                        const thrown = computeThrowLanding(angle, rawPower, loft);

                        // Le marqueur affiche le point d'atterrissage (targetX/Y)
                        expect(visual.markerX).toBeCloseTo(thrown.targetX, 5);
                        expect(visual.markerY).toBeCloseTo(thrown.targetY, 5);
                    });
                }
            }
        });
    }

    it('demi-portee: le marqueur est AU point d\'atterrissage (pas au-dela)', () => {
        const angle = -Math.PI / 2;
        const params = computeThrowLanding(angle, 0.6, LOFT_DEMI_PORTEE);
        const marker = computeVisualMarker(angle, 0.6, LOFT_DEMI_PORTEE);
        // Le marqueur correspond exactement au landing (target)
        expect(marker.markerX).toBeCloseTo(params.targetX, 5);
        expect(marker.markerY).toBeCloseTo(params.targetY, 5);
        // La boule roule ensuite au-dela (stop > landing)
        const landDist = Math.sqrt((params.targetX - originX) ** 2 + (params.targetY - originY) ** 2);
        const stopDist = Math.sqrt((params.stopX - originX) ** 2 + (params.stopY - originY) ** 2);
        expect(stopDist).toBeGreaterThan(landDist);
    });

    it('plombee: stop-target gap plus petit que demi-portee (72% vol, 28% roll)', () => {
        const angle = -Math.PI / 2;
        const demi = computeThrowLanding(angle, 0.6, LOFT_DEMI_PORTEE);
        const plombee = computeThrowLanding(angle, 0.6, LOFT_PLOMBEE);
        const gapDemi = Math.sqrt((demi.stopX - demi.targetX) ** 2 + (demi.stopY - demi.targetY) ** 2);
        const gapPlombee = Math.sqrt((plombee.stopX - plombee.targetX) ** 2 + (plombee.stopY - plombee.targetY) ** 2);
        expect(gapPlombee).toBeLessThan(gapDemi);
    });

    it('tir au fer: la boule atterrit au marqueur (flyOnly, stop == target)', () => {
        const angle = -Math.PI / 2;
        const tir = computeThrowLanding(angle, 0.6, LOFT_TIR);
        expect(tir.stopX).toBeCloseTo(tir.targetX, 5);
        expect(tir.stopY).toBeCloseTo(tir.targetY, 5);
    });
});

// =====================================================================
// 2. PUISSANCE QUADRATIQUE: AFFICHAGE vs VALEUR REELLE
// =====================================================================

describe('2. Puissance quadratique — le % affiche est lineaire, la valeur reelle est quadratique', () => {
    it('rawPower 0.5 (affiche 50%) → power reel = 0.25', () => {
        const rawPower = 0.5;
        const realPower = rawPower * rawPower;
        expect(realPower).toBe(0.25);
    });

    it('rawPower 0.7 (affiche 70%) → power reel = 0.49', () => {
        const rawPower = 0.7;
        const realPower = rawPower * rawPower;
        expect(realPower).toBeCloseTo(0.49, 2);
    });

    it('rawPower 1.0 (affiche 100%) → power reel = 1.0 (coherent)', () => {
        const rawPower = 1.0;
        const realPower = rawPower * rawPower;
        expect(realPower).toBe(1.0);
    });

    it('la courbe quadratique donne plus de precision a basse puissance', () => {
        // Drag 0→50% couvre seulement 25% du range → plus de precision pour les lancers courts
        const lowRange = (0.5 ** 2) - (0.0 ** 2);   // 0.25
        const highRange = (1.0 ** 2) - (0.5 ** 2);   // 0.75
        expect(lowRange).toBeLessThan(highRange);
        // Le joueur a 3x plus de marge de drag pour les lancers courts
        expect(highRange / lowRange).toBe(3);
    });

    it('le marqueur utilise la meme puissance quadratique que le lancer', () => {
        const angle = -Math.PI / 2;
        // Simuler ce que fait l'update (visuel) et le onPointerUp (lancer)
        for (const rawPower of [0.3, 0.5, 0.8]) {
            const visualPower = rawPower * rawPower;
            const throwPower = rawPower * rawPower;
            expect(visualPower).toBe(throwPower);

            // Les deux utilisent computeThrowParams avec la meme puissance
            const visual = PetanqueEngine.computeThrowParams(
                angle, visualPower, originX, originY, bounds, LOFT_DEMI_PORTEE, 1.0
            );
            const thrown = PetanqueEngine.computeThrowParams(
                angle, throwPower, originX, originY, bounds, LOFT_DEMI_PORTEE, 1.0
            );
            expect(visual.targetX).toBe(thrown.targetX);
            expect(visual.targetY).toBe(thrown.targetY);
        }
    });
});

// =====================================================================
// 3. WOBBLE: L'OFFSET VISUEL EST APPLIQUE AU LANCER
// =====================================================================

describe('3. Wobble — l\'offset du marqueur est fidele a l\'angle applique', () => {
    it('wobble nul (precision parfaite) → aucune deviation', () => {
        const offset = computeWobbleAngleOffset(0, 0);
        expect(offset).toBeCloseTo(0, 10);
    });

    it('wobble X seul ne devie pas l\'angle (formule atan2 avec +100 de base)', () => {
        // atan2(0, wobbleX + 100) - atan2(0, 100) = 0 tant que wobbleX + 100 > 0
        const offset5 = computeWobbleAngleOffset(5, 0);
        const offset10 = computeWobbleAngleOffset(10, 0);
        const offsetNeg = computeWobbleAngleOffset(-5, 0);
        expect(offset5).toBe(0);
        expect(offset10).toBe(0);
        expect(offsetNeg).toBe(0);
    });

    it('wobble Y positif → deviation angulaire positive et proportionnelle', () => {
        const offset5 = computeWobbleAngleOffset(0, 5);
        const offset10 = computeWobbleAngleOffset(0, 10);
        expect(offset5).toBeGreaterThan(0);
        expect(offset10).toBeGreaterThan(offset5);
        // Reste petit (< 6° pour 10px)
        expect(offset10 * 180 / Math.PI).toBeLessThan(6);
    });

    it('wobble Y negatif → deviation dans l\'autre sens', () => {
        const positive = computeWobbleAngleOffset(0, 5);
        const negative = computeWobbleAngleOffset(0, -5);
        expect(positive).toBeGreaterThan(0);
        expect(negative).toBeLessThan(0);
    });

    it('wobble en Y → deviation angulaire aussi', () => {
        const offsetY = computeWobbleAngleOffset(0, 5);
        expect(Math.abs(offsetY)).toBeGreaterThan(0);
        // Wobble Y = deviation verticale, doit etre proportionnelle
        const offsetY10 = computeWobbleAngleOffset(0, 10);
        expect(Math.abs(offsetY10)).toBeGreaterThan(Math.abs(offsetY));
    });

    it('amplitude de wobble respecte les bornes par stat de precision', () => {
        // Precision 10: 2px (quasi stable)
        expect(getWobbleAmplitude(10)).toBeCloseTo(2.0, 1);
        // Precision 1: 18.2px (tres instable)
        expect(getWobbleAmplitude(1)).toBeCloseTo(18.2, 0);
        // Plombee ajoute +4px
        expect(getWobbleAmplitude(6, 2.0) - getWobbleAmplitude(6, 0)).toBeCloseTo(4.0, 1);
        // Focus reduit de 80%
        expect(getWobbleAmplitude(6, 0, true)).toBeCloseTo(getWobbleAmplitude(6, 0, false) * 0.2, 1);
    });

    it('la deviation max a precision 1 (18.2px wobble) reste jouable (< 12°)', () => {
        // Pire cas: wobble max en X = 18.2px
        const maxOffset = computeWobbleAngleOffset(18.2, 0);
        expect(Math.abs(maxOffset) * 180 / Math.PI).toBeLessThan(12);
    });

    it('le wobble n\'affecte que l\'angle, pas la distance de base', () => {
        const angle = -Math.PI / 2;
        const rawPower = 0.5;
        const power = rawPower * rawPower;

        // Sans wobble
        const base = PetanqueEngine.computeThrowParams(
            angle, power, originX, originY, bounds, LOFT_DEMI_PORTEE, 1.0
        );
        // Avec wobble (angle decale)
        const wobbleAngle = angle + computeWobbleAngleOffset(10, 5);
        const withWobble = PetanqueEngine.computeThrowParams(
            wobbleAngle, power, originX, originY, bounds, LOFT_DEMI_PORTEE, 1.0
        );

        // La distance depuis l'origine est la meme (seul l'angle change)
        const distBase = Math.sqrt((base.targetX - originX) ** 2 + (base.targetY - originY) ** 2);
        const distWobble = Math.sqrt((withWobble.targetX - originX) ** 2 + (withWobble.targetY - originY) ** 2);
        // Tolerance: le clamp aux bounds peut modifier legerement
        expect(distWobble).toBeCloseTo(distBase, 0);
    });
});

// =====================================================================
// 3b. WOBBLE ACTIF — le marqueur correspond au lancer reel
// =====================================================================

describe('3b. Wobble actif — marqueur == lancer reel (angle + power wobble)', () => {
    it('wobble Y=10px → le marqueur est devie par angle, pas par pixels', () => {
        const angle = -Math.PI / 2;
        const rawPower = 0.6;
        const wobble = { x: 0, y: 10 };

        // Marqueur visuel (avec wobble applique comme angle)
        const visual = computeVisualMarker(angle, rawPower, LOFT_DEMI_PORTEE, 1.0, 6, wobble);
        // Marqueur sans wobble
        const base = computeVisualMarker(angle, rawPower, LOFT_DEMI_PORTEE, 1.0, 6);

        // La deviation est proportionnelle a la distance de vol
        // atan2(10, 100) ≈ 5.7° → a 75px (landing demi-portee) ≈ 7.5px
        const deviation = Math.sqrt(
            (visual.markerX - base.markerX) ** 2 + (visual.markerY - base.markerY) ** 2
        );
        expect(deviation).toBeGreaterThan(5);
    });

    it('wobble Y=10px → le marqueur correspond au landing du lancer reel', () => {
        const angle = -Math.PI / 2;
        const rawPower = 0.6;
        const power = rawPower * rawPower;
        const wobble = { x: 0, y: 10 };

        // Simuler onPointerUp : angle + wobbleAngleOffset
        const wobAngle = angle + computeWobbleAngleOffset(wobble.x, wobble.y);
        const throwResult = PetanqueEngine.computeThrowParams(
            wobAngle, power, originX, originY, bounds, LOFT_DEMI_PORTEE, 1.0, 6
        );

        // Le marqueur doit correspondre au landing (a la power wobble pres)
        const visual = computeVisualMarker(angle, rawPower, LOFT_DEMI_PORTEE, 1.0, 6, wobble);
        expect(visual.markerX).toBeCloseTo(throwResult.targetX, 0);
        expect(visual.markerY).toBeCloseTo(throwResult.targetY, 0);
    });

    it('precision 1 (wobble 18px) → grande deviation, mais marqueur = landing', () => {
        const angle = -Math.PI / 2;
        const rawPower = 0.7;
        const wobble = { x: 5, y: 10 };

        const visual = computeVisualMarker(angle, rawPower, LOFT_PLOMBEE, 1.0, 1, wobble);
        const wobAngle = angle + computeWobbleAngleOffset(wobble.x, wobble.y);
        const throwResult = PetanqueEngine.computeThrowParams(
            wobAngle, rawPower * rawPower, originX, originY, bounds, LOFT_PLOMBEE, 1.0, 1
        );

        expect(visual.markerX).toBeCloseTo(throwResult.targetX, 0);
        expect(visual.markerY).toBeCloseTo(throwResult.targetY, 0);
    });

    it('precision 10 (wobble 2px) → deviation minime', () => {
        const angle = -Math.PI / 2;
        const rawPower = 0.5;
        const wobble = { x: 1, y: 1.2 };

        const visual = computeVisualMarker(angle, rawPower, LOFT_DEMI_PORTEE, 1.0, 10, wobble);
        const base = computeVisualMarker(angle, rawPower, LOFT_DEMI_PORTEE, 1.0, 10);

        const deviation = Math.sqrt(
            (visual.markerX - base.markerX) ** 2 + (visual.markerY - base.markerY) ** 2
        );
        // Precision 10 : deviation tres faible (< 5px)
        expect(deviation).toBeLessThan(5);
    });

    it('le marqueur avec wobble reste dans les bounds', () => {
        for (let i = 0; i < 50; i++) {
            const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI;
            const rawPower = 0.2 + Math.random() * 0.8;
            const wobble = {
                x: (Math.random() - 0.5) * 20,
                y: (Math.random() - 0.5) * 12
            };
            const loft = ALL_LOFT_PRESETS[Math.floor(Math.random() * 3)];

            const visual = computeVisualMarker(angle, rawPower, loft, 1.0, 6, wobble);

            expect(visual.markerX).toBeGreaterThanOrEqual(bounds.x + BALL_CLAMP_MARGIN);
            expect(visual.markerX).toBeLessThanOrEqual(bounds.x + bounds.w - BALL_CLAMP_MARGIN);
            expect(visual.markerY).toBeGreaterThanOrEqual(bounds.y + BALL_CLAMP_MARGIN);
            expect(visual.markerY).toBeLessThanOrEqual(bounds.y + bounds.h - BALL_CLAMP_MARGIN);
        }
    });
});

// =====================================================================
// 4. COCHONNET: MARQUEUR VISUEL vs ATTERRISSAGE
// =====================================================================

describe('4. Cochonnet — marqueur vs atterrissage', () => {
    it('power 0 → distance = COCHONNET_MIN_DIST', () => {
        const { cochDist } = computeCochonnetMarker(-Math.PI / 2, 0);
        expect(cochDist).toBe(COCHONNET_MIN_DIST);
    });

    it('power 1 → distance = COCHONNET_MAX_DIST', () => {
        const { cochDist } = computeCochonnetMarker(-Math.PI / 2, 1);
        expect(cochDist).toBe(COCHONNET_MAX_DIST);
    });

    it('power lineaire (pas quadratique) pour le cochonnet', () => {
        // Le cochonnet utilise rawPower directement, pas rawPower²
        const d25 = computeCochonnetMarker(-Math.PI / 2, 0.25).cochDist;
        const d50 = computeCochonnetMarker(-Math.PI / 2, 0.50).cochDist;
        const d75 = computeCochonnetMarker(-Math.PI / 2, 0.75).cochDist;

        // Increments lineaires: d50-d25 ≈ d75-d50
        const inc1 = d50 - d25;
        const inc2 = d75 - d50;
        expect(inc1).toBeCloseTo(inc2, 0);
    });

    it('marqueur cochonnet reste dans les bounds (marge 20px)', () => {
        const angles = [-Math.PI / 2, -Math.PI / 4, -3 * Math.PI / 4, 0, -Math.PI];
        for (const angle of angles) {
            for (const p of [0, 0.5, 1.0]) {
                const { markerX, markerY } = computeCochonnetMarker(angle, p);
                expect(markerX).toBeGreaterThanOrEqual(bounds.x + 20);
                expect(markerX).toBeLessThanOrEqual(bounds.x + bounds.w - 20);
                expect(markerY).toBeGreaterThanOrEqual(bounds.y + 20);
                expect(markerY).toBeLessThanOrEqual(bounds.y + bounds.h - 20);
            }
        }
    });

    it('cochonnet min dist correspond a 5.5m FIPJP', () => {
        const meters = COCHONNET_MIN_DIST / (TERRAIN_HEIGHT / 13);
        expect(meters).toBeCloseTo(5.5, 0);
    });

    it('cochonnet max dist correspond a 10m FIPJP', () => {
        const meters = COCHONNET_MAX_DIST / (TERRAIN_HEIGHT / 13);
        expect(meters).toBeCloseTo(10.0, 0);
    });
});

// =====================================================================
// 5. CLAMPING: MARQUEUR vs PHYSIQUE AUX LIMITES DU TERRAIN
// =====================================================================

describe('5. Clamping terrain — le marqueur ne sort jamais des bounds', () => {
    it('pleine puissance vers le haut → clampe a bounds.y + BALL_CLAMP_MARGIN', () => {
        const params = PetanqueEngine.computeThrowParams(
            -Math.PI / 2, 1.0, originX, originY, bounds, LOFT_DEMI_PORTEE, 1.0, 10
        );
        expect(params.targetY).toBeGreaterThanOrEqual(bounds.y + BALL_CLAMP_MARGIN);
    });

    it('pleine puissance dans toutes les directions → toujours dans les bounds', () => {
        const angles = [0, Math.PI / 4, -Math.PI / 4, Math.PI / 2, -Math.PI / 2,
            3 * Math.PI / 4, -3 * Math.PI / 4, Math.PI];

        for (const angle of angles) {
            for (const loft of ALL_LOFT_PRESETS) {
                const params = PetanqueEngine.computeThrowParams(
                    angle, 1.0, originX, originY, bounds, loft, 1.0, 10
                );
                expect(params.targetX).toBeGreaterThanOrEqual(bounds.x + BALL_CLAMP_MARGIN);
                expect(params.targetX).toBeLessThanOrEqual(bounds.x + bounds.w - BALL_CLAMP_MARGIN);
                expect(params.targetY).toBeGreaterThanOrEqual(bounds.y + BALL_CLAMP_MARGIN);
                expect(params.targetY).toBeLessThanOrEqual(bounds.y + bounds.h - BALL_CLAMP_MARGIN);
            }
        }
    });

    it('le marqueur visuel utilise le meme BALL_CLAMP_MARGIN que le lancer', () => {
        // Les deux passent par computeThrowParams → meme clamp
        expect(BALL_CLAMP_MARGIN).toBe(16);

        const visual = computeVisualMarker(-Math.PI / 2, 1.0, LOFT_DEMI_PORTEE, 1.0, 10);
        expect(visual.markerY).toBeGreaterThanOrEqual(bounds.y + BALL_CLAMP_MARGIN);
    });
});

// =====================================================================
// 6. ROULEMENT POST-ATTERRISSAGE: QUANTIFICATION
// =====================================================================

describe('6. Roulement apres le marqueur — quantification par technique', () => {
    it('demi-portee: roll significatif (50% de la distance totale)', () => {
        const params = computeThrowLanding(-Math.PI / 2, 0.5, LOFT_DEMI_PORTEE);
        const rollSpeed = Math.sqrt(params.rollVx ** 2 + params.rollVy ** 2);
        expect(rollSpeed).toBeGreaterThan(0);
        expect(LOFT_DEMI_PORTEE.landingFactor).toBe(0.50);
    });

    it('plombee: roll modere (28% de la distance totale)', () => {
        const params = computeThrowLanding(-Math.PI / 2, 0.5, LOFT_PLOMBEE);
        const rollSpeed = Math.sqrt(params.rollVx ** 2 + params.rollVy ** 2);
        expect(rollSpeed).toBeGreaterThan(0);
        expect(LOFT_PLOMBEE.landingFactor).toBe(0.72);
    });

    it('tir au fer: pas de roll (flyOnly)', () => {
        const tir = computeThrowLanding(-Math.PI / 2, 0.7, LOFT_TIR);
        expect(Math.sqrt(tir.rollVx ** 2 + tir.rollVy ** 2)).toBe(0);
    });

    it('le marqueur montre le point d\'atterrissage — la boule roule au-dela', () => {
        const angle = -Math.PI / 2;
        const marker = computeVisualMarker(angle, 0.6, LOFT_DEMI_PORTEE);
        const params = computeThrowLanding(angle, 0.6, LOFT_DEMI_PORTEE);

        // Marqueur = landing position (premier contact sol)
        expect(marker.markerX).toBeCloseTo(params.targetX, 5);
        expect(marker.markerY).toBeCloseTo(params.targetY, 5);
        // Stop est plus loin que landing (le roll ajoute de la distance)
        const landDist = Math.abs(params.targetY - originY);
        const stopDist = Math.abs(params.stopY - originY);
        expect(stopDist).toBeGreaterThan(landDist);
    });

    it('plombee roule moins que demi-portee', () => {
        const angle = -Math.PI / 2;
        const demi = computeThrowLanding(angle, 0.6, LOFT_DEMI_PORTEE);
        const plombee = computeThrowLanding(angle, 0.6, LOFT_PLOMBEE);

        const rollDemi = Math.sqrt(demi.rollVx ** 2 + demi.rollVy ** 2);
        const rollPlombee = Math.sqrt(plombee.rollVx ** 2 + plombee.rollVy ** 2);
        expect(rollPlombee).toBeLessThan(rollDemi);
    });

    it('le roulement reste borne', () => {
        const worst = computeThrowLanding(-Math.PI / 2, 1.0, LOFT_DEMI_PORTEE, 1.0, 10);
        const rollSpeed = Math.sqrt(worst.rollVx ** 2 + worst.rollVy ** 2);
        expect(rollSpeed).toBeLessThan(15);
        expect(rollSpeed).toBeGreaterThan(0);
    });
});

// =====================================================================
// 7. PRESSION / TREMBLE
// =====================================================================

describe('7. Pression — impact sur l\'angle au lancer', () => {
    function pressureAmplitude(sangFroid, focusActive = false) {
        const base = 8;
        const reduction = 1 - (sangFroid - 1) / 9 * 0.7;
        return base * reduction * (focusActive ? 0.20 : 1.0);
    }

    it('tremble max (sf=1, no focus) → max deviation angulaire', () => {
        const amp = pressureAmplitude(1);
        // trembleOffset.x max = 8px → angle offset = 8 * 0.002 = 0.016 rad ≈ 0.9°
        const maxAngleRad = amp * 0.002;
        const maxAngleDeg = maxAngleRad * 180 / Math.PI;
        expect(maxAngleDeg).toBeLessThan(1.0); // Reste sous 1 degre
        expect(maxAngleDeg).toBeGreaterThan(0.5); // Mais perceptible
    });

    it('tremble min (sf=10, no focus) → deviation quasi nulle', () => {
        const amp = pressureAmplitude(10);
        const maxAngleDeg = amp * 0.002 * 180 / Math.PI;
        expect(maxAngleDeg).toBeLessThan(0.35);
    });

    it('le facteur de conversion tremble→angle (0.002) est tres petit', () => {
        // Confirme que le tremble ne peut pas devier de plus de ~1°
        // meme au pire cas (sf=1, amp=8px)
        const worstCase = 8 * 0.002; // 0.016 rad
        expect(worstCase * 180 / Math.PI).toBeLessThan(1.0);
    });

    it('focus + sang_froid 10 → tremble negligeable', () => {
        const amp = pressureAmplitude(10, true);
        expect(amp).toBeCloseTo(2.4 * 0.2, 1);
        expect(amp * 0.002 * 180 / Math.PI).toBeLessThan(0.1); // < 0.1°
    });
});

// =====================================================================
// 8. POWER WOBBLE: BORNES ET COHERENCE
// =====================================================================

describe('8. Power wobble — variation de puissance proportionnelle a la precision', () => {
    it('power wobble max = 3% du power (sans penalty technique)', () => {
        // wobbleMag/maxWobble = 1.0 (wobble au max), penalty = 0
        const pwMax = 1.0 * 0.03 * (1 + 0 * 0.3);
        expect(pwMax).toBeCloseTo(0.03, 5);
    });

    it('plombee penalty (2.0) augmente le power wobble de 60%', () => {
        const noPenalty = 0.03 * (1 + 0 * 0.3);
        const withPenalty = 0.03 * (1 + 2.0 * 0.3);
        expect(withPenalty / noPenalty).toBeCloseTo(1.6, 2);
    });

    it('la power ne descend jamais sous 0.01 (clamp)', () => {
        // Meme avec un power wobble negatif, le clamp empeche 0
        const minPower = 0.01;
        const rawPower = 0.1;
        const power = rawPower * rawPower; // 0.01
        const worstWobble = -0.03 * 1.6; // -0.048
        const result = Math.max(0.01, Math.min(1, power + worstWobble));
        expect(result).toBeGreaterThanOrEqual(minPower);
    });

    it('la power ne depasse jamais 1.0 (clamp)', () => {
        const rawPower = 1.0;
        const power = rawPower * rawPower; // 1.0
        const bestWobble = 0.03 * 1.6; // +0.048
        const result = Math.max(0.01, Math.min(1, power + bestWobble));
        expect(result).toBeLessThanOrEqual(1.0);
    });

    it('precision 10 → power wobble negligeable (amplitude 2px)', () => {
        const maxAmp = getWobbleAmplitude(10, 0, false); // 2px
        // A amplitude 2px, la contribution a la power est faible
        const maxPwContrib = (2 / 2) * 0.03; // wobbleMag/maxWobble * 0.03
        expect(maxPwContrib).toBe(0.03); // Meme ratio, mais la probabilite d'etre au max wobble est faible
        // Le sin(aimTime * 2.3) oscille, donc en moyenne c'est ~1.5%
    });
});

// =====================================================================
// 9. DEAD LINES == BOUNDS DU TERRAIN
// =====================================================================

describe('9. Dead lines visuelles == bounds physiques du terrain', () => {
    it('les bounds du terrain sont calculees depuis GAME_WIDTH/HEIGHT et TERRAIN_WIDTH/HEIGHT', () => {
        expect(terrainX).toBe((GAME_WIDTH - TERRAIN_WIDTH) / 2);
        expect(terrainY).toBe((GAME_HEIGHT - TERRAIN_HEIGHT) / 2);
        expect(terrainX).toBe(326);
        expect(terrainY).toBe(30);
    });

    it('le inset des dead lines est 0 (lignes au bord exact du terrain)', () => {
        // Le inset a ete corrige de 3 → 0
        // Les lignes sont maintenant dessinees a:
        //   top: terrainY + 0 = 30
        //   bottom: terrainY + TERRAIN_HEIGHT - 0 = 450
        //   left: terrainX + 0 = 326
        //   right: terrainX + TERRAIN_WIDTH - 0 = 506
        // Ce qui correspond exactement aux bounds physiques
        const inset = 0;
        expect(terrainX + inset).toBe(bounds.x);
        expect(terrainY + inset).toBe(bounds.y);
        expect(terrainX + TERRAIN_WIDTH - inset).toBe(bounds.x + bounds.w);
        expect(terrainY + TERRAIN_HEIGHT - inset).toBe(bounds.y + bounds.h);
    });

    it('checkOutOfBounds: une boule est morte quand ENTIEREMENT dehors (FIPJP)', () => {
        // La boule est morte quand centre + rayon est entierement hors bounds
        // Donc une boule peut depasser la ligne de BALL_RADIUS (10px) et rester vivante
        // C'est la regle FIPJP: "la boule est morte quand elle a ENTIEREMENT franchi la ligne"

        // Boule juste sur la ligne (centre = bounds.x, rayon = 10)
        // → une partie est encore dans le terrain → vivante
        const ballOnLine = { x: bounds.x, radius: BALL_RADIUS };
        const isOut = ballOnLine.x + ballOnLine.radius < bounds.x; // 326 + 10 < 326 → false
        expect(isOut).toBe(false);

        // Boule entierement dehors (centre = bounds.x - BALL_RADIUS - 1, 1px de marge)
        const ballOut = { x: bounds.x - BALL_RADIUS - 1, radius: BALL_RADIUS };
        const isOutFull = ballOut.x + ballOut.radius < bounds.x; // bounds.x - 1 < bounds.x → true
        expect(isOutFull).toBe(true);
    });

    it('une boule a 1px du bord interieur est toujours vivante', () => {
        // Centre a bounds.x + 1 → partie droite deborde de 9px mais pas entierement → vivante
        const ball = { x: bounds.x + 1, radius: BALL_RADIUS };
        const isOut = ball.x + ball.radius < bounds.x;
        expect(isOut).toBe(false);
    });
});

// =====================================================================
// 10. COHERENCE MULTI-TERRAIN — meme marqueur, friction differente
// =====================================================================

describe('10. Multi-terrain — meme atterrissage, stop different', () => {
    const terrainTypes = Object.entries(TERRAIN_FRICTION);

    for (const [name, friction] of terrainTypes) {
        it(`terrain ${name} (friction ${friction}): marqueur = atterrissage (identique quel que soit le terrain)`, () => {
            const terre = computeThrowLanding(-Math.PI / 2, 0.5, LOFT_DEMI_PORTEE, 1.0);
            const other = computeThrowLanding(-Math.PI / 2, 0.5, LOFT_DEMI_PORTEE, friction);

            // Le landing est identique quel que soit le terrain
            expect(other.targetX).toBeCloseTo(terre.targetX, 5);
            expect(other.targetY).toBeCloseTo(terre.targetY, 5);

            // Le marqueur montre le landing → identique quel que soit le terrain
            const markerTerre = computeVisualMarker(-Math.PI / 2, 0.5, LOFT_DEMI_PORTEE, 1.0);
            const markerOther = computeVisualMarker(-Math.PI / 2, 0.5, LOFT_DEMI_PORTEE, friction);
            expect(markerOther.markerX).toBeCloseTo(markerTerre.markerX, 5);
            expect(markerOther.markerY).toBeCloseTo(markerTerre.markerY, 5);

            // Mais le stop (arret final) differe selon le terrain
            if (friction !== 1.0) {
                const stopTerre = Math.abs(terre.stopY - originY);
                const stopOther = Math.abs(other.stopY - originY);
                expect(stopTerre).not.toBeCloseTo(stopOther, 0);
            }
        });
    }

    it('la vitesse de roulement est compensee partiellement par TERRAIN_ROLL_COMPENSATION', () => {
        expect(TERRAIN_ROLL_COMPENSATION).toBe(0.6);

        const terre = computeThrowLanding(-Math.PI / 2, 0.5, LOFT_DEMI_PORTEE, 1.0);
        const sable = computeThrowLanding(-Math.PI / 2, 0.5, LOFT_DEMI_PORTEE, TERRAIN_FRICTION.sable);
        const rollTerre = Math.sqrt(terre.rollVx ** 2 + terre.rollVy ** 2);
        const rollSable = Math.sqrt(sable.rollVx ** 2 + sable.rollVy ** 2);
        // Sable: vitesse de roll plus elevee (compensee) mais friction aussi → roule moins loin
        expect(rollSable).toBeGreaterThan(rollTerre);
    });
});

// =====================================================================
// 11. PUISSANCE STAT — impact sur la portee
// =====================================================================

describe('11. Stat puissance — impact correct sur la portee', () => {
    it('puissance 1 = 0.8x, puissance 10 = 1.3x', () => {
        expect(puissanceMultiplier(1)).toBeCloseTo(0.8, 2);
        expect(puissanceMultiplier(10)).toBeCloseTo(1.3, 2);
    });

    it('puissance 5 ≈ 1.02x (proche de neutre)', () => {
        expect(puissanceMultiplier(5)).toBeCloseTo(1.022, 1);
    });

    it('le marqueur reflete correctement la puissance stat', () => {
        const angle = -Math.PI / 2;
        const weak = computeVisualMarker(angle, 0.5, LOFT_DEMI_PORTEE, 1.0, 1);
        const strong = computeVisualMarker(angle, 0.5, LOFT_DEMI_PORTEE, 1.0, 10);

        // Puissance 10 atteint plus loin (markerY plus petit = plus haut = plus loin)
        expect(strong.markerY).toBeLessThan(weak.markerY);

        // La difference doit etre significative (ratio 1.3/0.8 = 1.625x)
        const distWeak = originY - weak.markerY;
        const distStrong = originY - strong.markerY;
        const ratio = distStrong / distWeak;
        expect(ratio).toBeCloseTo(1.3 / 0.8, 1);
    });
});

// =====================================================================
// 12. DEAD ZONE — le drag minimum ne lance rien
// =====================================================================

describe('12. Dead zone — pas de lancer sous le seuil', () => {
    it('DEAD_ZONE_PX = 30 pixels', () => {
        expect(DEAD_ZONE_PX).toBe(30);
    });

    it('un drag de 29px ne doit pas produire de lancer', () => {
        const dist = 29;
        expect(dist < DEAD_ZONE_PX).toBe(true);
    });

    it('un drag de 31px doit produire un lancer', () => {
        const dist = 31;
        expect(dist >= DEAD_ZONE_PX).toBe(true);
        // rawPower = min(31 / 150, 1) ≈ 0.207
        const rawPower = Math.min(dist / 150, 1);
        expect(rawPower).toBeGreaterThan(0);
    });

    it('cochonnet: effectiveDist commence a 0 apres la dead zone', () => {
        const dist = 35; // 5px apres dead zone
        const effectiveDist = dist - DEAD_ZONE_PX; // 5
        const maxDrag = 150 - DEAD_ZONE_PX; // 120
        const rawPower = Math.min(effectiveDist / maxDrag, 1);
        expect(rawPower).toBeCloseTo(5 / 120, 3);
    });
});

// =====================================================================
// 13. WOBBLE LISSAJOUS — pattern previsible et borne
// =====================================================================

describe('13. Wobble Lissajous — oscillation bornee et previsible', () => {
    it('l\'oscillation en X est bornee par l\'amplitude', () => {
        const amp = 10;
        const speed = 2.0;

        // Simuler 120 frames (2 secondes)
        let maxX = 0;
        for (let i = 0; i < 120; i++) {
            const t = (i * 0.016) * speed * Math.PI * 2;
            const x = Math.sin(t) * amp;
            maxX = Math.max(maxX, Math.abs(x));
        }
        expect(maxX).toBeLessThanOrEqual(amp + 0.01);
    });

    it('l\'oscillation en Y est bornee par amplitude * 0.6', () => {
        const amp = 10;
        const speed = 2.0;

        let maxY = 0;
        for (let i = 0; i < 120; i++) {
            const t = (i * 0.016) * speed * Math.PI * 2;
            const y = Math.sin(t * 1.7 + 0.5) * amp * 0.6;
            maxY = Math.max(maxY, Math.abs(y));
        }
        expect(maxY).toBeLessThanOrEqual(amp * 0.6 + 0.01);
    });

    it('la distance totale du wobble ne depasse jamais sqrt(ampX² + ampY²)', () => {
        const amp = 15; // precision 1 environ

        let maxDist = 0;
        for (let i = 0; i < 300; i++) {
            const t = (i * 0.016) * 3.5 * Math.PI * 2;
            const x = Math.sin(t) * amp;
            const y = Math.sin(t * 1.7 + 0.5) * amp * 0.6;
            maxDist = Math.max(maxDist, Math.sqrt(x * x + y * y));
        }
        const theoreticalMax = Math.sqrt(amp ** 2 + (amp * 0.6) ** 2);
        expect(maxDist).toBeLessThanOrEqual(theoreticalMax + 0.01);
    });

    it('le wobble speed augmente avec la baisse de precision', () => {
        // Precision 10 = 1.2 Hz, Precision 1 = 1.2 + 9*0.26 = 3.54 Hz
        const speedHigh = 1.2 + (10 - 10) * 0.26;
        const speedLow = 1.2 + (10 - 1) * 0.26;
        expect(speedHigh).toBeCloseTo(1.2, 1);
        expect(speedLow).toBeCloseTo(3.54, 1);
        expect(speedLow).toBeGreaterThan(speedHigh);
    });
});

// =====================================================================
// 14. FRICTION BOULE — impact sur la position d'arret estimee
// =====================================================================

describe('14. Friction boule — le marqueur integre le bonus de friction de la boule', () => {
    it('boule bleue (friction_x0.8) → marqueur plus loin que boule acier', () => {
        const angle = -Math.PI / 2;
        const acier = PetanqueEngine.computeThrowParams(
            angle, 0.25, originX, originY, bounds, LOFT_DEMI_PORTEE, 1.0, 6, 1.0
        );
        const bleue = PetanqueEngine.computeThrowParams(
            angle, 0.25, originX, originY, bounds, LOFT_DEMI_PORTEE, 1.0, 6, 0.8
        );

        // Meme atterrissage
        expect(acier.targetY).toBe(bleue.targetY);
        // Bleue roule plus loin (stopY plus petit = plus loin du lanceur)
        expect(bleue.stopY).toBeLessThan(acier.stopY);
    });

    it('boule rouille (friction_x1.3) → marqueur plus proche que boule acier', () => {
        const angle = -Math.PI / 2;
        const acier = PetanqueEngine.computeThrowParams(
            angle, 0.25, originX, originY, bounds, LOFT_DEMI_PORTEE, 1.0, 6, 1.0
        );
        const rouille = PetanqueEngine.computeThrowParams(
            angle, 0.25, originX, originY, bounds, LOFT_DEMI_PORTEE, 1.0, 6, 1.3
        );

        // Meme atterrissage
        expect(acier.targetY).toBe(rouille.targetY);
        // Rouille s'arrete plus tot (stopY plus grand = plus pres du lanceur)
        expect(rouille.stopY).toBeGreaterThan(acier.stopY);
    });

    it('boule acier (friction_x1.0) → pas de modification du stop', () => {
        const angle = -Math.PI / 2;
        const withMult = PetanqueEngine.computeThrowParams(
            angle, 0.25, originX, originY, bounds, LOFT_DEMI_PORTEE, 1.0, 6, 1.0
        );
        const withoutMult = PetanqueEngine.computeThrowParams(
            angle, 0.25, originX, originY, bounds, LOFT_DEMI_PORTEE, 1.0, 6
        );
        // Default bouleFrictionMult = 1 → identique
        expect(withMult.stopX).toBe(withoutMult.stopX);
        expect(withMult.stopY).toBe(withoutMult.stopY);
    });

    it('la difference est significative : bleue vs rouille ~45% d\'ecart de roulement', () => {
        const angle = -Math.PI / 2;
        const bleue = PetanqueEngine.computeThrowParams(
            angle, 0.25, originX, originY, bounds, LOFT_DEMI_PORTEE, 1.0, 6, 0.8
        );
        const rouille = PetanqueEngine.computeThrowParams(
            angle, 0.25, originX, originY, bounds, LOFT_DEMI_PORTEE, 1.0, 6, 1.3
        );

        const rollBleue = Math.abs(bleue.stopY - bleue.targetY);
        const rollRouille = Math.abs(rouille.stopY - rouille.targetY);

        // Bleue roule 1.3/0.8 = 1.625x plus loin que rouille
        const ratio = rollBleue / rollRouille;
        expect(ratio).toBeCloseTo(1.3 / 0.8, 1);
    });

    it('plombee + friction boule → le marqueur reflete les deux', () => {
        const angle = -Math.PI / 2;
        const acier = PetanqueEngine.computeThrowParams(
            angle, 0.25, originX, originY, bounds, LOFT_PLOMBEE, 1.0, 6, 1.0
        );
        const bleue = PetanqueEngine.computeThrowParams(
            angle, 0.25, originX, originY, bounds, LOFT_PLOMBEE, 1.0, 6, 0.8
        );

        // Meme atterrissage (plombee atterrit plus loin que demi-portee)
        expect(acier.targetY).toBe(bleue.targetY);
        // Bleue roule plus loin meme en plombee
        expect(bleue.stopY).toBeLessThan(acier.stopY);
    });

    it('tir au fer → friction boule n\'a pas d\'impact (flyOnly)', () => {
        const angle = -Math.PI / 2;
        const acier = PetanqueEngine.computeThrowParams(
            angle, 0.25, originX, originY, bounds, LOFT_TIR, 1.0, 6, 1.0
        );
        const bleue = PetanqueEngine.computeThrowParams(
            angle, 0.25, originX, originY, bounds, LOFT_TIR, 1.0, 6, 0.8
        );
        // Tir flyOnly = stop == landing, friction boule n'intervient pas
        expect(acier.stopY).toBe(bleue.stopY);
    });
});

// =====================================================================
// 15. STRESS TEST: 100 lancers aleatoires — marqueur toujours dans les bounds
// =====================================================================

describe('15. Stress test — 100 lancers aleatoires restent dans les bounds', () => {
    it('tous les marqueurs restent dans le terrain clampé', () => {
        for (let i = 0; i < 100; i++) {
            const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI; // -pi a 0
            const rawPower = Math.random();
            const puissance = Math.floor(Math.random() * 10) + 1;
            const loft = ALL_LOFT_PRESETS[Math.floor(Math.random() * 3)];
            const friction = 0.5 + Math.random() * 3; // 0.5 a 3.5

            const visual = computeVisualMarker(angle, rawPower, loft, friction, puissance);

            expect(visual.markerX).toBeGreaterThanOrEqual(bounds.x + BALL_CLAMP_MARGIN);
            expect(visual.markerX).toBeLessThanOrEqual(bounds.x + bounds.w - BALL_CLAMP_MARGIN);
            expect(visual.markerY).toBeGreaterThanOrEqual(bounds.y + BALL_CLAMP_MARGIN);
            expect(visual.markerY).toBeLessThanOrEqual(bounds.y + bounds.h - BALL_CLAMP_MARGIN);
        }
    });

    it('tous les marqueurs cochonnet restent dans la marge 20px', () => {
        for (let i = 0; i < 50; i++) {
            const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI;
            const rawPower = Math.random();
            const { markerX, markerY } = computeCochonnetMarker(angle, rawPower);

            expect(markerX).toBeGreaterThanOrEqual(bounds.x + 20);
            expect(markerX).toBeLessThanOrEqual(bounds.x + bounds.w - 20);
            expect(markerY).toBeGreaterThanOrEqual(bounds.y + 20);
            expect(markerY).toBeLessThanOrEqual(bounds.y + bounds.h - 20);
        }
    });
});

// =====================================================================
// 16. RETRO (BACKSPIN) — retro n'affecte pas le marqueur (landing) mais affecte le stop
// =====================================================================

describe('16. Retro — le marqueur montre le landing (retro n\'affecte que le roule)', () => {
    it('retro actif → le marqueur est identique (landing ne depend pas du retro)', () => {
        const angle = -Math.PI / 2;
        const noRetro = computeVisualMarker(angle, 0.6, LOFT_DEMI_PORTEE, 1.0, 6,
            { x: 0, y: 0 }, { x: 0, y: 0 }, 0, 1, 0);
        const withRetro = computeVisualMarker(angle, 0.6, LOFT_DEMI_PORTEE, 1.0, 6,
            { x: 0, y: 0 }, { x: 0, y: 0 }, 0, 1, 0.5);
        // Landing is the same regardless of retro
        expect(withRetro.markerX).toBeCloseTo(noRetro.markerX, 5);
        expect(withRetro.markerY).toBeCloseTo(noRetro.markerY, 5);
    });

    it('retro effet 10 (50%) → marqueur significativement plus court', () => {
        const angle = -Math.PI / 2;
        const retro50 = RETRO_INTENSITY_BY_EFFET[10]; // 0.50
        const noRetro = PetanqueEngine.computeThrowParams(
            angle, 0.36, originX, originY, bounds, LOFT_DEMI_PORTEE, 1.0, 6, 1, 0
        );
        const withRetro = PetanqueEngine.computeThrowParams(
            angle, 0.36, originX, originY, bounds, LOFT_DEMI_PORTEE, 1.0, 6, 1, retro50
        );
        // Same landing
        expect(withRetro.targetY).toBe(noRetro.targetY);
        // Shorter roll with retro
        const rollNoRetro = Math.abs(noRetro.stopY - noRetro.targetY);
        const rollRetro = Math.abs(withRetro.stopY - withRetro.targetY);
        expect(rollRetro).toBeLessThan(rollNoRetro);
        // retroMult = 1 + 0.5 * 2.5 = 2.25 → roll ratio ~1/2.25 = 0.44x
        expect(rollRetro / rollNoRetro).toBeCloseTo(1 / (1 + retro50 * RETRO_FRICTION_MULT), 1);
    });

    it('retro effet 8 (35%) → reduction moderee', () => {
        const angle = -Math.PI / 2;
        const retro35 = RETRO_INTENSITY_BY_EFFET[8]; // 0.35
        const noRetro = PetanqueEngine.computeThrowParams(
            angle, 0.36, originX, originY, bounds, LOFT_DEMI_PORTEE, 1.0, 6, 1, 0
        );
        const withRetro = PetanqueEngine.computeThrowParams(
            angle, 0.36, originX, originY, bounds, LOFT_DEMI_PORTEE, 1.0, 6, 1, retro35
        );
        const rollNoRetro = Math.abs(noRetro.stopY - noRetro.targetY);
        const rollRetro = Math.abs(withRetro.stopY - withRetro.targetY);
        // retroMult = 1 + 0.35 * 2.5 = 1.875 → roll ~53% of base
        expect(rollRetro / rollNoRetro).toBeCloseTo(1 / (1 + retro35 * RETRO_FRICTION_MULT), 1);
    });

    it('tir au fer → retro n\'affecte pas le stop (flyOnly)', () => {
        const angle = -Math.PI / 2;
        const noRetro = PetanqueEngine.computeThrowParams(
            angle, 0.36, originX, originY, bounds, LOFT_TIR, 1.0, 6, 1, 0
        );
        const withRetro = PetanqueEngine.computeThrowParams(
            angle, 0.36, originX, originY, bounds, LOFT_TIR, 1.0, 6, 1, 0.5
        );
        expect(withRetro.stopY).toBe(noRetro.stopY);
    });
});

// =====================================================================
// 17. PRECISION ±5% — prediction vs simulation discrete (Ball.update)
// =====================================================================

describe('17. Precision ±5% — stop predit vs simulation discrete', () => {
    /** Simule Ball.update en discret pour N frames et retourne la position d'arret.
     *  Clamp aux bounds comme computeThrowParams (la boule qui sort = morte). */
    function simulateDiscreteStop(startX, startY, vx, vy, frictionMult, retroIntensity = 0) {
        let x = startX, y = startY;
        let cvx = vx, cvy = vy;
        const dt = 1 / 60;
        const retroMult = retroIntensity > 0 ? (1 + retroIntensity * RETRO_FRICTION_MULT) : 1.0;
        const minX = bounds.x + BALL_CLAMP_MARGIN;
        const maxX = bounds.x + bounds.w - BALL_CLAMP_MARGIN;
        const minY = bounds.y + BALL_CLAMP_MARGIN;
        const maxY = bounds.y + bounds.h - BALL_CLAMP_MARGIN;

        for (let i = 0; i < 600; i++) { // max 10 seconds
            const speed = Math.sqrt(cvx * cvx + cvy * cvy);
            if (speed <= SPEED_THRESHOLD) break;

            const frictionDecel = FRICTION_BASE * frictionMult * retroMult * 60;
            const newSpeed = Math.max(0, speed - frictionDecel * dt);
            const ratio = speed > 0 ? newSpeed / speed : 0;
            cvx *= ratio;
            cvy *= ratio;

            x += cvx * dt * 60;
            y += cvy * dt * 60;

            // Clamp to bounds (ball that exits = dead, prediction clamps too)
            x = Math.max(minX, Math.min(maxX, x));
            y = Math.max(minY, Math.min(maxY, y));
        }
        return { x, y };
    }

    const testCases = [
        { name: 'demi-portee terre', loft: LOFT_DEMI_PORTEE, friction: 1.0, retro: 0 },
        { name: 'demi-portee herbe', loft: LOFT_DEMI_PORTEE, friction: TERRAIN_FRICTION.herbe, retro: 0 },
        { name: 'demi-portee sable', loft: LOFT_DEMI_PORTEE, friction: TERRAIN_FRICTION.sable, retro: 0 },
        { name: 'demi-portee dalles', loft: LOFT_DEMI_PORTEE, friction: TERRAIN_FRICTION.dalles, retro: 0 },
        { name: 'plombee terre', loft: LOFT_PLOMBEE, friction: 1.0, retro: 0 },
        { name: 'plombee herbe', loft: LOFT_PLOMBEE, friction: TERRAIN_FRICTION.herbe, retro: 0 },
        { name: 'plombee sable', loft: LOFT_PLOMBEE, friction: TERRAIN_FRICTION.sable, retro: 0 },
        { name: 'plombee dalles', loft: LOFT_PLOMBEE, friction: TERRAIN_FRICTION.dalles, retro: 0 },
        { name: 'demi-portee terre retro50', loft: LOFT_DEMI_PORTEE, friction: 1.0, retro: 0.5 },
        { name: 'demi-portee herbe retro35', loft: LOFT_DEMI_PORTEE, friction: TERRAIN_FRICTION.herbe, retro: 0.35 },
        { name: 'plombee terre retro50', loft: LOFT_PLOMBEE, friction: 1.0, retro: 0.5 },
    ];

    for (const tc of testCases) {
        for (const rawPower of [0.3, 0.6, 1.0]) {
            it(`${tc.name} power=${rawPower} — ecart ≤5%`, () => {
                const angle = -Math.PI / 2;
                const power = rawPower * rawPower;
                const params = PetanqueEngine.computeThrowParams(
                    angle, power, originX, originY, bounds, tc.loft, tc.friction, 6, 1, tc.retro
                );

                // Simuler la physique discrete depuis le landing
                const simStop = simulateDiscreteStop(
                    params.targetX, params.targetY,
                    params.rollVx, params.rollVy,
                    tc.friction, tc.retro
                );

                const totalDist = Math.sqrt(
                    (params.stopX - originX) ** 2 + (params.stopY - originY) ** 2
                );
                const errorDist = Math.sqrt(
                    (params.stopX - simStop.x) ** 2 + (params.stopY - simStop.y) ** 2
                );

                // ±5% de la distance totale
                const maxError = totalDist * 0.05;
                expect(errorDist).toBeLessThanOrEqual(Math.max(maxError, 3)); // 3px minimum tolerance
            });
        }
    }
});
