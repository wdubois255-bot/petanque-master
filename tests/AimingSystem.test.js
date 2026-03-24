/**
 * AimingSystem.test.js — Wobble & pressure logic unit tests (AXE D)
 *
 * AimingSystem is tightly coupled to Phaser rendering (scene.add.text, pointer events, etc).
 * These tests validate the mathematical CONTRACT of the wobble/pressure formulas
 * by re-implementing the pure functions from AimingSystem.js.
 *
 * Formulas verified:
 *   _getWobbleAmplitude(): base = 2 + (10 - precision) * 1.8 + techniquePenalty * 2
 *                          * focusMultiplier (0.20 if focus active, else 1.0)
 *   _updatePressureTremble(): amplitude = 8 * sangFroidReduction * focusMult
 *                              sangFroidReduction = 1 - (sf - 1) / 9 * 0.7
 *                              only active when both scores >= 10
 */
import { describe, it, expect } from 'vitest';

// ─── Pure formula helpers (mirrors AimingSystem.js internals) ─────────────────

/**
 * Mirrors _getWobbleAmplitude() + _getFocusMultiplier() from AimingSystem.js
 * @param {number} precision  1-10 (higher = less wobble)
 * @param {boolean} focusActive  Focus (Respire) ability active
 * @param {number} techniquePenalty  LOFT.precisionPenalty (e.g. 2.0 for plombee)
 */
function getWobbleAmplitude(precision, focusActive = false, techniquePenalty = 0) {
    const base = 2 + (10 - precision) * 1.8 + techniquePenalty * 2;
    return base * (focusActive ? 0.20 : 1.0);
}

/**
 * Mirrors _updatePressureTremble() from AimingSystem.js
 * @param {number} sangFroid  1-10 (higher = less pressure)
 * @param {number} scoresPlayer  current player score
 * @param {number} scoresOpponent  current opponent score
 * @param {boolean} focusActive  Focus active (reduces by 80%)
 */
function getPressureAmplitude(sangFroid, scoresPlayer, scoresOpponent, focusActive = false) {
    const threshold = 10;
    if (scoresPlayer < threshold || scoresOpponent < threshold) return 0;
    const baseAmplitude = 8;
    const sangFroidReduction = 1 - (sangFroid - 1) / 9 * 0.7;
    const focusMult = focusActive ? 0.20 : 1.0;
    return baseAmplitude * sangFroidReduction * focusMult;
}

// ─── D4.1 — Wobble amplitude proportional to (inverse) precision ─────────────

describe('AimingSystem — Wobble amplitude formula', () => {
    it('wobble amplitude increases as precision decreases (inverse relationship)', () => {
        const highPrec = getWobbleAmplitude(10); // precision 10 → 2px (minimum)
        const midPrec  = getWobbleAmplitude(5);  // precision 5  → 11px
        const lowPrec  = getWobbleAmplitude(1);  // precision 1  → 18.2px

        expect(highPrec).toBeLessThan(midPrec);
        expect(midPrec).toBeLessThan(lowPrec);
        // Precision 10 = exactly 2px base wobble
        expect(highPrec).toBeCloseTo(2.0, 1);
        // Precision 1 = 2 + 9 * 1.8 = 18.2px
        expect(lowPrec).toBeCloseTo(18.2, 0);
    });

    it('Focus active reduces wobble amplitude by 80% (multiplier 0.20)', () => {
        const normal  = getWobbleAmplitude(6, false);
        const focused = getWobbleAmplitude(6, true);

        expect(focused).toBeCloseTo(normal * 0.20, 2);
        expect(focused).toBeLessThan(normal);
    });

    it('Focus reduces wobble to near-zero even at low precision', () => {
        // precision 1 without focus → 18.2px; with focus → ~3.64px
        const focused = getWobbleAmplitude(1, true);
        expect(focused).toBeLessThan(5); // significantly reduced
        expect(focused).toBeGreaterThan(0); // not completely zero (still some wobble)
    });

    it('technique penalty (plombee precisionPenalty=2.0) increases wobble', () => {
        const noPenalty   = getWobbleAmplitude(6, false, 0);
        const withPenalty = getWobbleAmplitude(6, false, 2.0); // LOFT_PLOMBEE penalty

        expect(withPenalty).toBeGreaterThan(noPenalty);
        // Penalty formula: + 2.0 * 2 = +4px
        expect(withPenalty - noPenalty).toBeCloseTo(4.0, 1);
    });
});

// ─── D4.2 — Pressure tremble at score >= 10, sang_froid reduces it ───────────

describe('AimingSystem — Pressure tremble formula', () => {
    it('no pressure when either score is below 10', () => {
        expect(getPressureAmplitude(6, 9, 10)).toBe(0);
        expect(getPressureAmplitude(6, 10, 9)).toBe(0);
        expect(getPressureAmplitude(6, 0, 0)).toBe(0);
    });

    it('pressure activates when both scores reach 10 (match point tension)', () => {
        const amp = getPressureAmplitude(6, 10, 10);
        expect(amp).toBeGreaterThan(0);
    });

    it('sang_froid=10 reduces pressure amplitude (30% of base vs 100%)', () => {
        const sf1  = getPressureAmplitude(1, 10, 10);  // max tremble: 8 * 1.0 = 8px
        const sf10 = getPressureAmplitude(10, 10, 10); // reduced: 8 * 0.30 = 2.4px

        expect(sf10).toBeLessThan(sf1);
        // sf=1: sangFroidReduction = 1 - 0/9*0.7 = 1.0 → amp = 8
        expect(sf1).toBeCloseTo(8.0, 1);
        // sf=10: sangFroidReduction = 1 - 9/9*0.7 = 0.30 → amp = 2.4
        expect(sf10).toBeCloseTo(2.4, 1);
    });

    it('Focus reduces pressure amplitude by 80% (sang_froid stacks with focus)', () => {
        const normal  = getPressureAmplitude(6, 10, 10, false);
        const focused = getPressureAmplitude(6, 10, 10, true);

        expect(focused).toBeCloseTo(normal * 0.20, 2);
    });
});
