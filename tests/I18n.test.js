import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: vi.fn(key => store[key] ?? null),
        setItem: vi.fn((key, value) => { store[key] = value; }),
        removeItem: vi.fn(key => { delete store[key]; }),
        clear: vi.fn(() => { store = {}; }),
        _reset: () => { store = {}; }
    };
})();
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });

// Mock fetch
globalThis.fetch = vi.fn();

// Mock import.meta.env
vi.stubGlobal('import', { meta: { env: { BASE_URL: '/' } } });

const { loadSave, saveSave } = await import('../src/utils/SaveManager.js');
const { default: I18n } = await import('../src/utils/I18n.js');

describe('I18n', () => {
    beforeEach(() => {
        localStorageMock._reset();
        I18n._strings = {};
        I18n._fallback = {};
        I18n._locale = 'fr';
    });

    describe('detect()', () => {
        it('returns fr from default save (no lang set)', () => {
            const locale = I18n.detect();
            expect(locale).toBe('fr');
        });

        it('returns saved lang from SaveManager', () => {
            const save = loadSave();
            save.lang = 'en';
            saveSave(save);
            expect(I18n.detect()).toBe('en');
        });

        it('falls back to navigator language when save has default fr', () => {
            // Default save has lang: 'fr', so detect returns 'fr'
            const locale = I18n.detect();
            expect(locale).toBe('fr');
        });
    });

    describe('setLocale()', () => {
        it('persists locale via SaveManager', () => {
            I18n.setLocale('en');
            expect(I18n.locale).toBe('en');
            const save = loadSave();
            expect(save.lang).toBe('en');
        });

        it('updates internal locale', () => {
            I18n.setLocale('en');
            expect(I18n._locale).toBe('en');
        });
    });

    describe('t()', () => {
        it('resolves dotted keys', () => {
            I18n._strings = { shop: { buy: 'ACHETER' } };
            expect(I18n.t('shop.buy')).toBe('ACHETER');
        });

        it('returns key as fallback for missing keys', () => {
            expect(I18n.t('nonexistent.key')).toBe('nonexistent.key');
        });

        it('interpolates params', () => {
            I18n._strings = { result: { galets: '+{amount} Galets' } };
            expect(I18n.t('result.galets', { amount: 50 })).toBe('+50 Galets');
        });

        it('falls back to _fallback strings', () => {
            I18n._strings = {};
            I18n._fallback = { shop: { buy: 'ACHETER' } };
            expect(I18n.t('shop.buy')).toBe('ACHETER');
        });
    });

    describe('ta()', () => {
        it('returns array for valid key', () => {
            I18n._strings = { boot: { tips: ['tip1', 'tip2'] } };
            expect(I18n.ta('boot.tips')).toEqual(['tip1', 'tip2']);
        });

        it('returns empty array for missing key', () => {
            expect(I18n.ta('nonexistent')).toEqual([]);
        });
    });

    describe('field() / fieldArray()', () => {
        it('returns base field for fr locale', () => {
            I18n._locale = 'fr';
            const obj = { name: 'Marcel', name_en: 'Marcel EN' };
            expect(I18n.field(obj, 'name')).toBe('Marcel');
        });

        it('returns localized field for en locale', () => {
            I18n._locale = 'en';
            const obj = { name: 'Marcel', name_en: 'Marcel EN' };
            expect(I18n.field(obj, 'name')).toBe('Marcel EN');
        });

        it('falls back to base field if localized missing', () => {
            I18n._locale = 'en';
            const obj = { name: 'Marcel' };
            expect(I18n.field(obj, 'name')).toBe('Marcel');
        });

        it('fieldArray returns localized array', () => {
            I18n._locale = 'en';
            const obj = { barks: ['fr1'], barks_en: ['en1', 'en2'] };
            expect(I18n.fieldArray(obj, 'barks')).toEqual(['en1', 'en2']);
        });
    });

    describe('no console.warn in source', () => {
        it('I18n.js does not contain console.warn', async () => {
            const { readFileSync } = await import('fs');
            const { resolve } = await import('path');
            const source = readFileSync(resolve(__dirname, '../src/utils/I18n.js'), 'utf-8');
            expect(source).not.toContain('console.warn');
        });
    });

    describe('no direct localStorage usage', () => {
        it('I18n.js does not use localStorage directly', async () => {
            const { readFileSync } = await import('fs');
            const { resolve } = await import('path');
            const source = readFileSync(resolve(__dirname, '../src/utils/I18n.js'), 'utf-8');
            expect(source).not.toContain('localStorage.getItem');
            expect(source).not.toContain('localStorage.setItem');
        });
    });
});
