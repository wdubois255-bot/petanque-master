import { describe, test, expect } from 'vitest';
import {
    MOMENTUM_INDICATOR_FIRE_COLOR, MOMENTUM_INDICATOR_TILT_COLOR,
    MOMENTUM_INDICATOR_THRESHOLD, MOMENTUM_INDICATOR_ALPHA, MOMENTUM_INDICATOR_RADIUS,
    PRESSURE_INDICATOR_COLOR, PRESSURE_WOBBLE_AMPLITUDE, PRESSURE_WOBBLE_SPEED,
    AI_TELL_DURATION, AI_TELL_POINTER_COLOR, AI_TELL_SHOOTER_COLOR, AI_TELL_ALPHA,
    MAP_NODE_RADIUS, MAP_NODE_SPACING_X, MAP_PATH_COLOR, MAP_PATH_DASH,
    MAP_NODE_PULSE_DURATION, MAP_STAR_SIZE, MAP_ZONE_TOP, MAP_ZONE_BOTTOM, MAP_PREVIEW_Y,
    CHALLENGE_BANNER_DURATION, CHALLENGE_REWARD_GALETS, CHALLENGE_PROBABILITY,
    GOLDEN_ZONE_RADIUS, GOLDEN_ZONE_COLOR, GOLDEN_ZONE_ALPHA, GOLDEN_ZONE_REWARD,
    SHOP_EXPRESS_ITEMS, SHOP_EXPRESS_DISCOUNT,
    CROWD_INTENSITY_BY_ROUND,
    SHOP_EXPRESS_MIN_GALETS,
    DEFEAT_CONSOLATION_GALETS, DEFEAT_RETRY_ENABLED,
    COMMENTATOR_COOLDOWN
} from '../src/utils/Constants.js';

describe('Phase 5 constants', () => {
    test('momentum constants are numbers', () => {
        expect(typeof MOMENTUM_INDICATOR_FIRE_COLOR).toBe('number');
        expect(typeof MOMENTUM_INDICATOR_TILT_COLOR).toBe('number');
        expect(MOMENTUM_INDICATOR_THRESHOLD).toBeGreaterThan(0);
        expect(typeof MOMENTUM_INDICATOR_ALPHA).toBe('number');
        expect(typeof MOMENTUM_INDICATOR_RADIUS).toBe('number');
    });

    test('pressure constants are numbers', () => {
        expect(typeof PRESSURE_INDICATOR_COLOR).toBe('number');
        expect(typeof PRESSURE_WOBBLE_AMPLITUDE).toBe('number');
        expect(typeof PRESSURE_WOBBLE_SPEED).toBe('number');
    });

    test('AI tell constants are numbers', () => {
        expect(typeof AI_TELL_DURATION).toBe('number');
        expect(typeof AI_TELL_POINTER_COLOR).toBe('number');
        expect(typeof AI_TELL_SHOOTER_COLOR).toBe('number');
        expect(typeof AI_TELL_ALPHA).toBe('number');
    });

    test('map constants are numbers', () => {
        expect(typeof MAP_NODE_RADIUS).toBe('number');
        expect(typeof MAP_NODE_SPACING_X).toBe('number');
        expect(typeof MAP_PATH_COLOR).toBe('number');
        expect(typeof MAP_PATH_DASH).toBe('number');
        expect(typeof MAP_NODE_PULSE_DURATION).toBe('number');
        expect(typeof MAP_STAR_SIZE).toBe('number');
        expect(typeof MAP_ZONE_TOP).toBe('number');
        expect(typeof MAP_ZONE_BOTTOM).toBe('number');
        expect(typeof MAP_PREVIEW_Y).toBe('number');
    });

    test('challenge constants are valid', () => {
        expect(CHALLENGE_REWARD_GALETS).toBeGreaterThan(0);
        expect(CHALLENGE_BANNER_DURATION).toBeGreaterThan(0);
        expect(CHALLENGE_PROBABILITY).toBeGreaterThan(0);
        expect(CHALLENGE_PROBABILITY).toBeLessThanOrEqual(1);
    });

    test('golden zone constants are valid', () => {
        expect(GOLDEN_ZONE_RADIUS).toBeGreaterThan(0);
        expect(typeof GOLDEN_ZONE_COLOR).toBe('number');
        expect(GOLDEN_ZONE_ALPHA).toBeGreaterThan(0);
        expect(GOLDEN_ZONE_REWARD).toBeGreaterThan(0);
    });

    test('shop express constants are valid', () => {
        expect(SHOP_EXPRESS_ITEMS).toBeGreaterThan(0);
        expect(SHOP_EXPRESS_DISCOUNT).toBeGreaterThan(0);
        expect(SHOP_EXPRESS_DISCOUNT).toBeLessThan(1);
    });

    test('crowd intensity has 5 entries', () => {
        expect(CROWD_INTENSITY_BY_ROUND).toHaveLength(5);
        for (const val of CROWD_INTENSITY_BY_ROUND) {
            expect(typeof val).toBe('number');
        }
    });

    test('shop express budget gate is positive', () => {
        expect(SHOP_EXPRESS_MIN_GALETS).toBeGreaterThan(0);
    });

    test('defeat consolation galets is positive', () => {
        expect(DEFEAT_CONSOLATION_GALETS).toBeGreaterThan(0);
    });

    test('defeat retry enabled is boolean', () => {
        expect(typeof DEFEAT_RETRY_ENABLED).toBe('boolean');
    });

    test('commentator cooldown is positive', () => {
        expect(COMMENTATOR_COOLDOWN).toBeGreaterThan(0);
    });
});
