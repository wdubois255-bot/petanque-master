import { describe, test, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const fr = JSON.parse(readFileSync(resolve(__dirname, '../public/data/lang/fr.json'), 'utf-8'));
const en = JSON.parse(readFileSync(resolve(__dirname, '../public/data/lang/en.json'), 'utf-8'));

describe('i18n Phase 5 — arcade keys', () => {
    test('FR has arcade block', () => {
        expect(fr.arcade).toBeDefined();
        expect(typeof fr.arcade).toBe('object');
    });

    test('EN has arcade block', () => {
        expect(en.arcade).toBeDefined();
        expect(typeof en.arcade).toBe('object');
    });

    test('all FR arcade keys have EN equivalents', () => {
        const frKeys = Object.keys(fr.arcade);
        const enKeys = Object.keys(en.arcade);
        for (const key of frKeys) {
            expect(enKeys).toContain(key);
        }
    });

    test('all EN arcade keys have FR equivalents', () => {
        const frKeys = Object.keys(fr.arcade);
        const enKeys = Object.keys(en.arcade);
        for (const key of enKeys) {
            expect(frKeys).toContain(key);
        }
    });

    test('key arcade values are non-empty strings', () => {
        const essentialKeys = [
            'title', 'subtitle', 'fight_btn', 'round', 'challenge_title',
            'momentum_fire', 'momentum_tilt', 'pressure_warning',
            'defeat_title', 'defeat_retry', 'shop_express_title'
        ];
        for (const key of essentialKeys) {
            expect(typeof fr.arcade[key]).toBe('string');
            expect(fr.arcade[key].length).toBeGreaterThan(0);
            expect(typeof en.arcade[key]).toBe('string');
            expect(en.arcade[key].length).toBeGreaterThan(0);
        }
    });
});
