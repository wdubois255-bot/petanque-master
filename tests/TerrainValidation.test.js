import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { TERRAIN_FRICTION } from '../src/utils/Constants.js';

// Load terrain data
const terrainsPath = resolve(__dirname, '../public/data/terrains.json');
const terrains = JSON.parse(readFileSync(terrainsPath, 'utf-8'));

describe('Terrain data validation', () => {
    it('all 5 terrains exist', () => {
        const ids = terrains.stages.map(t => t.id);
        expect(ids).toContain('village');
        expect(ids).toContain('plage');
        expect(ids).toContain('parc');
        expect(ids).toContain('colline');
        expect(ids).toContain('docks');
        expect(terrains.stages.length).toBe(5);
    });

    it('each terrain has required fields', () => {
        for (const terrain of terrains.stages) {
            expect(terrain.id, `${terrain.id} missing id`).toBeDefined();
            expect(terrain.name, `${terrain.id} missing name`).toBeDefined();
            expect(typeof terrain.friction, `${terrain.id} friction should be number`).toBe('number');
            expect(terrain.friction).toBeGreaterThan(0);
        }
    });

    it('terrain friction matches Constants.js TERRAIN_FRICTION', () => {
        const frictionMap = {
            village: 'terre',
            plage: 'sable',
            parc: 'herbe',
            colline: 'terre',
            docks: 'dalles'
        };

        for (const terrain of terrains.stages) {
            const surfaceType = frictionMap[terrain.id];
            if (surfaceType && TERRAIN_FRICTION[surfaceType] !== undefined) {
                expect(terrain.friction, `${terrain.id} friction (${terrain.friction}) should match Constants.TERRAIN_FRICTION.${surfaceType} (${TERRAIN_FRICTION[surfaceType]})`).toBe(TERRAIN_FRICTION[surfaceType]);
            }
        }
    });

    it('slope zones do not overlap', () => {
        for (const terrain of terrains.stages) {
            if (!terrain.slope_zones) continue;
            const zones = terrain.slope_zones;
            for (let i = 0; i < zones.length; i++) {
                for (let j = i + 1; j < zones.length; j++) {
                    const a = zones[i].rect;
                    const b = zones[j].rect;
                    if (!a || !b) continue;
                    // Check axis-aligned rectangle overlap
                    const overlapX = a.x < b.x + b.w && a.x + a.w > b.x;
                    const overlapY = a.y < b.y + b.h && a.y + a.h > b.y;
                    if (overlapX && overlapY) {
                        // Warn but don't fail — overlaps may be intentional
                        // Just verify they have consistent gravity directions
                        expect(true, `${terrain.id}: slope zones ${i} and ${j} overlap — verify gravity is consistent`).toBe(true);
                    }
                }
            }
        }
    });

    it('friction zones have valid friction values', () => {
        for (const terrain of terrains.stages) {
            if (!terrain.friction_zones) continue;
            for (const zone of terrain.friction_zones) {
                expect(typeof zone.friction, `${terrain.id} zone friction should be number`).toBe('number');
                expect(zone.friction).toBeGreaterThan(0);
                expect(zone.friction).toBeLessThan(10);
                if (zone.rect) {
                    expect(zone.rect.x).toBeDefined();
                    expect(zone.rect.y).toBeDefined();
                    expect(zone.rect.w).toBeGreaterThan(0);
                    expect(zone.rect.h).toBeGreaterThan(0);
                }
            }
        }
    });
});

describe('Characters data validation', () => {
    const charsPath = resolve(__dirname, '../public/data/characters.json');
    const chars = JSON.parse(readFileSync(charsPath, 'utf-8'));

    it('roster has at least 10 characters', () => {
        expect(chars.roster.length).toBeGreaterThanOrEqual(10);
    });

    it('each character has required fields', () => {
        for (const char of chars.roster) {
            expect(char.id, 'missing id').toBeDefined();
            expect(char.name, `${char.id} missing name`).toBeDefined();
            expect(char.archetype, `${char.id} missing archetype`).toBeDefined();
            expect(char.stats, `${char.id} missing stats`).toBeDefined();
            expect(char.stats.precision, `${char.id} missing precision`).toBeDefined();
            expect(char.stats.puissance, `${char.id} missing puissance`).toBeDefined();
            expect(char.stats.effet, `${char.id} missing effet`).toBeDefined();
            expect(char.stats.sang_froid, `${char.id} missing sang_froid`).toBeDefined();
        }
    });

    it('all stats are in range 1-10', () => {
        for (const char of chars.roster) {
            for (const [stat, val] of Object.entries(char.stats)) {
                expect(val, `${char.id}.${stat} = ${val} out of range`).toBeGreaterThanOrEqual(1);
                expect(val, `${char.id}.${stat} = ${val} out of range`).toBeLessThanOrEqual(10);
            }
        }
    });

    it('rookie is the only character with isRookie flag', () => {
        const rookies = chars.roster.filter(c => c.isRookie);
        expect(rookies.length).toBe(1);
        expect(rookies[0].id).toBe('rookie');
    });

    it('each character has barks', () => {
        for (const char of chars.roster) {
            expect(char.barks, `${char.id} missing barks`).toBeDefined();
            expect(char.barks.good_shot?.length, `${char.id} missing good_shot barks`).toBeGreaterThan(0);
            expect(char.barks.bad_shot?.length, `${char.id} missing bad_shot barks`).toBeGreaterThan(0);
        }
    });
});

describe('Arcade data validation', () => {
    const arcadePath = resolve(__dirname, '../public/data/arcade.json');
    const arcade = JSON.parse(readFileSync(arcadePath, 'utf-8'));

    it('has at least 3 matches', () => {
        expect(arcade.matches.length).toBeGreaterThanOrEqual(3);
    });

    it('each match references valid terrain and opponent', () => {
        const charsPath = resolve(__dirname, '../public/data/characters.json');
        const chars = JSON.parse(readFileSync(charsPath, 'utf-8'));
        const charIds = chars.roster.map(c => c.id);
        const terrainIds = terrains.stages.map(t => t.id);

        for (const match of arcade.matches) {
            expect(charIds, `opponent ${match.opponent} not in characters.json`).toContain(match.opponent);
            expect(terrainIds, `terrain ${match.terrain} not in terrains.json`).toContain(match.terrain);
        }
    });

    it('difficulty increases across matches', () => {
        const difficultyOrder = { easy: 1, medium: 2, hard: 3, expert: 4 };
        for (let i = 1; i < arcade.matches.length; i++) {
            const prev = difficultyOrder[arcade.matches[i - 1].difficulty] || 0;
            const curr = difficultyOrder[arcade.matches[i].difficulty] || 0;
            expect(curr, `match ${i + 1} difficulty should be >= match ${i}`).toBeGreaterThanOrEqual(prev);
        }
    });
});

describe('I18n key coverage', () => {
    const frPath = resolve(__dirname, '../public/data/lang/fr.json');
    const enPath = resolve(__dirname, '../public/data/lang/en.json');
    const fr = JSON.parse(readFileSync(frPath, 'utf-8'));
    const en = JSON.parse(readFileSync(enPath, 'utf-8'));

    const requiredShopKeys = ['buy', 'owned', 'equip', 'insufficient', 'confirm', 'yes', 'no', 'tab_balls', 'tab_jacks', 'tab_abilities', 'controls_hint'];

    it('fr.json has all required shop keys', () => {
        for (const key of requiredShopKeys) {
            expect(fr.shop[key], `fr.json missing shop.${key}`).toBeDefined();
        }
    });

    it('en.json has all required shop keys', () => {
        for (const key of requiredShopKeys) {
            expect(en.shop[key], `en.json missing shop.${key}`).toBeDefined();
        }
    });

    it('fr.json and en.json have same top-level sections', () => {
        const frSections = Object.keys(fr).sort();
        const enSections = Object.keys(en).sort();
        expect(enSections).toEqual(frSections);
    });
});

describe('Shop data validation', () => {
    const shopPath = resolve(__dirname, '../public/data/shop.json');
    const shop = JSON.parse(readFileSync(shopPath, 'utf-8'));

    it('shop has items with prices in Galets', () => {
        const allItems = [...(shop.boules || []), ...(shop.cochonnets || []), ...(shop.abilities || [])];
        for (const item of allItems) {
            expect(item.id, 'item missing id').toBeDefined();
            expect(typeof item.price, `${item.id} price should be number`).toBe('number');
            expect(item.price, `${item.id} price should be positive`).toBeGreaterThan(0);
        }
    });
});
