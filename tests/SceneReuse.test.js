import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { resolve, join } from 'path';

// Test that ALL scenes have an init() method (CLAUDE.md critical rule)
// Phaser reuses scenes — init() MUST reset all flags to prevent state leaks

describe('Scene reuse safety (init method)', () => {
    const scenesDir = resolve(__dirname, '../src/scenes');
    const sceneFiles = readdirSync(scenesDir).filter(f => f.endsWith('.js'));

    it('should find scene files', () => {
        expect(sceneFiles.length).toBeGreaterThan(0);
    });

    for (const file of sceneFiles) {
        it(`${file} must have an init() method`, () => {
            const content = readFileSync(join(scenesDir, file), 'utf-8');
            // Match init() or init(data) method definition in a class
            const hasInit = /\binit\s*\(/.test(content);
            expect(hasInit, `${file} is missing init() method — CLAUDE.md requires all scenes to define init() with flag resets`).toBe(true);
        });
    }
});

describe('Scene init() flag resets', () => {
    const scenesDir = resolve(__dirname, '../src/scenes');

    it('QuickPlayScene.init() should reset key flags', () => {
        const content = readFileSync(join(scenesDir, 'QuickPlayScene.js'), 'utf-8');
        // Extract init method content (between init() { and next method)
        const initMatch = content.match(/init\s*\([^)]*\)\s*\{([\s\S]*?)^\s{4}\}/m);
        expect(initMatch, 'Could not find init() method body').toBeTruthy();
        if (initMatch) {
            const initBody = initMatch[1];
            // Should reset some flags
            expect(initBody.length).toBeGreaterThan(10);
        }
    });

    it('PetanqueScene.init() should accept data parameter', () => {
        const content = readFileSync(join(scenesDir, 'PetanqueScene.js'), 'utf-8');
        const hasInitData = /init\s*\(\s*data\s*\)/.test(content);
        expect(hasInitData, 'PetanqueScene.init() must accept data parameter for match config').toBe(true);
    });

    it('TitleScene.init() should exist for menu reset', () => {
        const content = readFileSync(join(scenesDir, 'TitleScene.js'), 'utf-8');
        const hasInit = /init\s*\(/.test(content);
        expect(hasInit).toBe(true);
    });
});
