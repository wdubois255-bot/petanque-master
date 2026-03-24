import { describe, test, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const arcadeData = JSON.parse(
    readFileSync(resolve(__dirname, '../public/data/arcade.json'), 'utf-8')
);

describe('Arcade data Phase 5 enrichments', () => {
    test('JSON is valid (parsed without error)', () => {
        expect(arcadeData).toBeDefined();
        expect(arcadeData.matches).toBeDefined();
    });

    test('each match has time_of_day', () => {
        for (const match of arcadeData.matches) {
            expect(typeof match.time_of_day).toBe('string');
            expect(match.time_of_day.length).toBeGreaterThan(0);
        }
    });

    test('time_of_day values are valid', () => {
        const valid = ['matin', 'fin_matinee', 'midi', 'apres_midi', 'coucher_soleil'];
        for (const match of arcadeData.matches) {
            expect(valid).toContain(match.time_of_day);
        }
    });

    test('rounds 1 and 2 have post_narrative', () => {
        const r1 = arcadeData.matches.find(m => m.round === 1);
        const r2 = arcadeData.matches.find(m => m.round === 2);
        expect(Array.isArray(r1.post_narrative)).toBe(true);
        expect(r1.post_narrative.length).toBeGreaterThan(0);
        expect(Array.isArray(r1.post_narrative_en)).toBe(true);
        expect(r1.post_narrative_en.length).toBeGreaterThan(0);
        expect(Array.isArray(r2.post_narrative)).toBe(true);
        expect(r2.post_narrative.length).toBeGreaterThan(0);
        expect(Array.isArray(r2.post_narrative_en)).toBe(true);
        expect(r2.post_narrative_en.length).toBeGreaterThan(0);
    });

    test('match_challenges is array of 5 objects', () => {
        expect(Array.isArray(arcadeData.match_challenges)).toBe(true);
        expect(arcadeData.match_challenges).toHaveLength(5);
        for (const c of arcadeData.match_challenges) {
            expect(c.id).toBeDefined();
            expect(c.condition).toBeDefined();
            expect(typeof c.reward).toBe('number');
        }
    });

    test('mene_challenges is array of 4 objects', () => {
        expect(Array.isArray(arcadeData.mene_challenges)).toBe(true);
        expect(arcadeData.mene_challenges).toHaveLength(4);
        for (const c of arcadeData.mene_challenges) {
            expect(c.id).toBeDefined();
            expect(c.stat).toBeDefined();
            expect(typeof c.target).toBe('number');
            expect(typeof c.reward).toBe('number');
        }
    });

    test('all 6 milestones are preserved', () => {
        expect(arcadeData.milestones).toHaveLength(6);
        const ids = arcadeData.milestones.map(m => m.id);
        expect(ids).toContain('first_win');
        expect(ids).toContain('champion');
        expect(ids).toContain('perfect_run');
    });
});
