import { describe, it, expect } from 'vitest';
import Layout from '../src/utils/Layout.js';
import { GAME_WIDTH, GAME_HEIGHT, GAME_WIDTH_PORTRAIT, GAME_HEIGHT_PORTRAIT } from '../src/utils/Constants.js';

// En environnement vitest (jsdom), navigator.userAgent = "Mozilla/5.0 ... jsdom"
// → pas mobile. On teste donc le path desktop par défaut, et on valide l'API.

describe('Layout — API shape', () => {
    it('exposes mode, W, H, isMobile, isPortrait, isLandscape', () => {
        expect(Layout.mode).toMatch(/^(landscape|portrait)$/);
        expect(typeof Layout.W).toBe('number');
        expect(typeof Layout.H).toBe('number');
        expect(typeof Layout.isMobile).toBe('boolean');
        expect(typeof Layout.isPortrait).toBe('boolean');
        expect(typeof Layout.isLandscape).toBe('boolean');
    });

    it('isPortrait and isLandscape are mutually exclusive', () => {
        expect(Layout.isPortrait).not.toBe(Layout.isLandscape);
    });

    it('W and H match the constants for the resolved mode', () => {
        if (Layout.mode === 'landscape') {
            expect(Layout.W).toBe(GAME_WIDTH);
            expect(Layout.H).toBe(GAME_HEIGHT);
        } else {
            expect(Layout.W).toBe(GAME_WIDTH_PORTRAIT);
            expect(Layout.H).toBe(GAME_HEIGHT_PORTRAIT);
        }
    });
});

describe('Layout — desktop default (jsdom env)', () => {
    it('defaults to landscape in jsdom (no mobile UA, window >= 800)', () => {
        // Garde-fou : protège la non-régression desktop.
        // Si ce test casse, l'itch.io publié prend une mauvaise résolution au boot.
        expect(Layout.mode).toBe('landscape');
        expect(Layout.W).toBe(832);
        expect(Layout.H).toBe(480);
        expect(Layout.isMobile).toBe(false);
    });
});

describe('Layout — anchors', () => {
    it('anchor("scorePanel") returns {x, y}', () => {
        const p = Layout.anchor('scorePanel');
        expect(p).toHaveProperty('x');
        expect(p).toHaveProperty('y');
        expect(typeof p.x).toBe('number');
        expect(typeof p.y).toBe('number');
    });

    it('anchor throws on unknown name', () => {
        expect(() => Layout.anchor('does_not_exist')).toThrow(/unknown anchor/);
    });

    it('all standard anchors resolve without error', () => {
        const names = ['scorePanel', 'abilityHud', 'modeSelector', 'throwCircle'];
        for (const name of names) {
            const p = Layout.anchor(name);
            expect(p.x).toBeGreaterThanOrEqual(0);
            expect(p.y).toBeGreaterThanOrEqual(0);
            expect(p.x).toBeLessThanOrEqual(Layout.W);
            expect(p.y).toBeLessThanOrEqual(Layout.H);
        }
    });
});

describe('Layout — relative helpers', () => {
    it('relX and relY convert ratios to pixels', () => {
        expect(Layout.relX(0)).toBe(0);
        expect(Layout.relX(1)).toBe(Layout.W);
        expect(Layout.relY(0.5)).toBe(Math.round(Layout.H * 0.5));
    });
});

describe('Layout — safe area insets', () => {
    it('safe returns an object with top/right/bottom/left numbers', () => {
        const s = Layout.safe;
        expect(s).toHaveProperty('top');
        expect(s).toHaveProperty('right');
        expect(s).toHaveProperty('bottom');
        expect(s).toHaveProperty('left');
        expect(typeof s.top).toBe('number');
    });
});
