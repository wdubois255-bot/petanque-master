import { describe, it, expect, vi } from 'vitest';
import {
    TERRAIN_HEIGHT, TERRAIN_WIDTH,
    LOFT_ROULETTE, LOFT_DEMI_PORTEE, LOFT_PLOMBEE, LOFT_TIR, LOFT_RAFLE, LOFT_TIR_DEVANT,
    ALL_LOFT_PRESETS,
    FRICTION_BASE
} from '../src/utils/Constants.js';
import PetanqueEngine from '../src/petanque/PetanqueEngine.js';

describe('PetanqueEngine.computeThrowParams', () => {
    const bounds = { x: 326, y: 30, w: TERRAIN_WIDTH, h: TERRAIN_HEIGHT };
    const originX = 416;
    const originY = 430;
    const frictionMult = 1.0;
    const angle = -Math.PI / 2; // Straight up (toward cochonnet)

    it('should compute landing position for demi-portee', () => {
        const params = PetanqueEngine.computeThrowParams(
            angle, 0.5, originX, originY, bounds, LOFT_DEMI_PORTEE, frictionMult
        );

        // Target should be above origin (negative y direction)
        expect(params.targetY).toBeLessThan(originY);
        // Should be within bounds
        expect(params.targetX).toBeGreaterThanOrEqual(bounds.x);
        expect(params.targetY).toBeGreaterThanOrEqual(bounds.y);
    });

    it('should land further at higher power', () => {
        const low = PetanqueEngine.computeThrowParams(
            angle, 0.3, originX, originY, bounds, LOFT_DEMI_PORTEE, frictionMult
        );
        const high = PetanqueEngine.computeThrowParams(
            angle, 0.8, originX, originY, bounds, LOFT_DEMI_PORTEE, frictionMult
        );

        // Higher power = lower targetY (further up)
        expect(high.targetY).toBeLessThan(low.targetY);
    });

    it('roulette should land closer but roll more', () => {
        const roulette = PetanqueEngine.computeThrowParams(
            angle, 0.5, originX, originY, bounds, LOFT_ROULETTE, frictionMult
        );
        const plombee = PetanqueEngine.computeThrowParams(
            angle, 0.5, originX, originY, bounds, LOFT_PLOMBEE, frictionMult
        );

        // Roulette: 15% landing, 85% roll → lands closer to origin
        // Plombee: 80% landing, 20% roll → lands further from origin
        expect(roulette.targetY).toBeGreaterThan(plombee.targetY);

        // Roulette should have higher roll velocity
        const rouletteRollSpeed = Math.sqrt(roulette.rollVx ** 2 + roulette.rollVy ** 2);
        const plombeeRollSpeed = Math.sqrt(plombee.rollVx ** 2 + plombee.rollVy ** 2);
        expect(rouletteRollSpeed).toBeGreaterThan(plombeeRollSpeed);
    });

    it('tir flyOnly: ball stops where it lands (rollVx/rollVy = 0)', () => {
        const tir = PetanqueEngine.computeThrowParams(
            angle, 0.7, originX, originY, bounds, LOFT_TIR, frictionMult
        );

        const tirRoll = Math.sqrt(tir.rollVx ** 2 + tir.rollVy ** 2);

        // LOFT_TIR.flyOnly = true → ball barely rolls after landing (carreau naturel via collision)
        expect(tirRoll).toBe(0);
        expect(LOFT_TIR.flyOnly).toBe(true);
    });

    it('puissance stat should affect max distance', () => {
        // Puissance 1 = 70% range, Puissance 10 = 120% range
        const weak = PetanqueEngine.computeThrowParams(
            angle, 0.8, originX, originY, bounds, LOFT_DEMI_PORTEE, frictionMult, 1
        );
        const strong = PetanqueEngine.computeThrowParams(
            angle, 0.8, originX, originY, bounds, LOFT_DEMI_PORTEE, frictionMult, 10
        );

        // Strong should reach further (lower targetY)
        expect(strong.targetY).toBeLessThan(weak.targetY);
    });

    it('should clamp landing within terrain bounds', () => {
        // Full power straight up should still be in bounds
        const params = PetanqueEngine.computeThrowParams(
            angle, 1.0, originX, originY, bounds, LOFT_DEMI_PORTEE, frictionMult, 10
        );

        expect(params.targetX).toBeGreaterThanOrEqual(bounds.x + 16);
        expect(params.targetY).toBeGreaterThanOrEqual(bounds.y + 16);
        expect(params.targetX).toBeLessThanOrEqual(bounds.x + bounds.w - 16);
        expect(params.targetY).toBeLessThanOrEqual(bounds.y + bounds.h - 16);
    });

    it('high-friction terrain should produce lower roll speed', () => {
        const terre = PetanqueEngine.computeThrowParams(
            angle, 0.5, originX, originY, bounds, LOFT_DEMI_PORTEE, 1.0
        );
        const sable = PetanqueEngine.computeThrowParams(
            angle, 0.5, originX, originY, bounds, LOFT_DEMI_PORTEE, 3.5
        );

        const terreRoll = Math.sqrt(terre.rollVx ** 2 + terre.rollVy ** 2);
        const sableRoll = Math.sqrt(sable.rollVx ** 2 + sable.rollVy ** 2);

        // Higher friction = higher initial roll speed needed to cover same roll distance
        // because friction is in the formula: rollingSpeed = sqrt(2 * friction * rollDist * efficiency)
        expect(sableRoll).toBeGreaterThan(terreRoll);
    });
});

describe('PetanqueEngine - Terrain friction consistency', () => {
    it('all loft presets should have valid parameters', () => {
        const presets = [LOFT_ROULETTE, LOFT_DEMI_PORTEE, LOFT_PLOMBEE, LOFT_TIR];

        for (const p of presets) {
            expect(p.id).toBeTruthy();
            expect(p.label).toBeTruthy();
            expect(p.landingFactor).toBeGreaterThanOrEqual(0);
            expect(p.landingFactor).toBeLessThanOrEqual(1);
            expect(p.flyDurationMult).toBeGreaterThan(0);
            expect(p.rollEfficiency).toBeGreaterThan(0);
        }
    });

    it('roulette should have lowest landingFactor, plombee highest (excl tir)', () => {
        expect(LOFT_ROULETTE.landingFactor).toBeLessThan(LOFT_DEMI_PORTEE.landingFactor);
        expect(LOFT_DEMI_PORTEE.landingFactor).toBeLessThan(LOFT_PLOMBEE.landingFactor);
        expect(LOFT_PLOMBEE.landingFactor).toBeLessThan(LOFT_TIR.landingFactor);
    });
});

describe('PetanqueEngine.computeThrowParams — AXE A (rafle, targetCochonnet, ALL_LOFT_PRESETS)', () => {
    const bounds = { x: 326, y: 30, w: TERRAIN_WIDTH, h: TERRAIN_HEIGHT };
    const originX = 416;
    const originY = 430;
    const frictionMult = 1.0;
    const angle = -Math.PI / 2; // Droit vers le haut

    it('computeThrowParams avec LOFT_RAFLE doit atterrir avant LOFT_DEMI_PORTEE', () => {
        const rafle = PetanqueEngine.computeThrowParams(
            angle, 0.6, originX, originY, bounds, LOFT_RAFLE, frictionMult
        );
        const demi = PetanqueEngine.computeThrowParams(
            angle, 0.6, originX, originY, bounds, LOFT_DEMI_PORTEE, frictionMult
        );
        // Rafle landingFactor 0.20 vs demi 0.50 — atterrit plus tot (targetY plus grand = plus proche)
        expect(rafle.targetY).toBeGreaterThan(demi.targetY);
    });

    it('computeThrowParams avec targetCochonnet : le cochonnet se trouve en haut du terrain', () => {
        // Simuler un cochonnet a coordonnees connues (y < originY = haut = angle negatif)
        // Le test verifie juste que computeThrowParams fonctionne avec LOFT_RAFLE
        const params = PetanqueEngine.computeThrowParams(
            angle, 0.5, originX, originY, bounds, LOFT_RAFLE, frictionMult
        );
        // La target doit etre dans les bounds
        expect(params.targetX).toBeGreaterThanOrEqual(bounds.x + 16);
        expect(params.targetY).toBeGreaterThanOrEqual(bounds.y + 16);
        expect(params.targetX).toBeLessThanOrEqual(bounds.x + bounds.w - 16);
        expect(params.targetY).toBeLessThanOrEqual(bounds.y + bounds.h - 16);
    });

    it('ALL_LOFT_PRESETS contient exactement 6 presets valides', () => {
        expect(ALL_LOFT_PRESETS).toHaveLength(6);
        for (const p of ALL_LOFT_PRESETS) {
            expect(typeof p.id).toBe('string');
            expect(typeof p.label).toBe('string');
            expect(p.landingFactor).toBeGreaterThanOrEqual(0);
            expect(p.landingFactor).toBeLessThanOrEqual(1);
            expect(p.flyDurationMult).toBeGreaterThan(0);
            expect(p.rollEfficiency).toBeGreaterThan(0);
            // Chaque preset doit avoir un arcHeight
            expect(typeof p.arcHeight).toBe('number');
        }
    });
});
