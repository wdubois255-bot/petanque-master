import { describe, test, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const data = JSON.parse(
    readFileSync(resolve(__dirname, '../public/data/characters.json'), 'utf-8')
);
const characters = data.roster;

const ARCADE_IDS = ['rookie', 'la_choupe', 'mamie_josette', 'fazzino', 'suchaud', 'ley'];
const NEW_BARK_KEYS = [
    'pressure_tied', 'fanny_imminent_winning', 'fanny_imminent_losing',
    'comeback_self', 'opponent_comeback', 'dominant_lead'
];
const EXISTING_BARK_KEYS = ['good_shot', 'bad_shot', 'carreau', 'victory', 'defeat'];

describe('Character barks Phase 5', () => {
    for (const charId of ARCADE_IDS) {
        describe(`${charId}`, () => {
            const char = characters.find(c => c.id === charId);

            test('character exists', () => {
                expect(char).toBeDefined();
            });

            test('has all new FR barks', () => {
                for (const key of NEW_BARK_KEYS) {
                    expect(Array.isArray(char.barks[key])).toBe(true);
                    expect(char.barks[key].length).toBeGreaterThan(0);
                }
            });

            test('has all new EN barks', () => {
                for (const key of NEW_BARK_KEYS) {
                    expect(Array.isArray(char.barks_en[key])).toBe(true);
                    expect(char.barks_en[key].length).toBeGreaterThan(0);
                }
            });

            test('existing barks preserved', () => {
                for (const key of EXISTING_BARK_KEYS) {
                    expect(Array.isArray(char.barks[key])).toBe(true);
                    expect(char.barks[key].length).toBeGreaterThan(0);
                }
            });
        });
    }
});
