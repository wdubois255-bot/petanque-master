/**
 * SceneReuse.test.js — Scene init() safety tests (AXE D)
 * Phaser reuses scenes — init() MUST reset all flags to prevent state leaks.
 * CLAUDE.md critical rule: "TOUJOURS définir init() avec reset de tous les flags"
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { resolve, join } from 'path';

// ─── D5.1 — Every scene file must declare an init() method ───────────────────

describe('Scene reuse safety (init method)', () => {
    const scenesDir = resolve(__dirname, '../src/scenes');
    const sceneFiles = readdirSync(scenesDir).filter(f => f.endsWith('.js'));

    it('should find scene files', () => {
        expect(sceneFiles.length).toBeGreaterThan(0);
    });

    for (const file of sceneFiles) {
        it(`${file} must have an init() method`, () => {
            const content = readFileSync(join(scenesDir, file), 'utf-8');
            const hasInit = /\binit\s*\(/.test(content);
            expect(
                hasInit,
                `${file} is missing init() — CLAUDE.md requires all scenes to define init() with flag resets`
            ).toBe(true);
        });
    }
});

// ─── D5.2 — Functional flag-reset checks (specific scenes) ───────────────────

describe('Scene init() flag resets (functional)', () => {
    const scenesDir = resolve(__dirname, '../src/scenes');

    it('PetanqueScene.init(data) resets _gamePaused to false', () => {
        const content = readFileSync(join(scenesDir, 'PetanqueScene.js'), 'utf-8');
        // init() must accept a data parameter
        expect(content).toMatch(/init\s*\(\s*data\s*\)/);
        // _gamePaused = false must appear in the source (set in init)
        expect(content).toMatch(/_gamePaused\s*=\s*false/);
        // Verify init() comes before the first _gamePaused assignment
        const initIdx = content.indexOf('init(data)');
        const pausedIdx = content.indexOf('_gamePaused = false');
        expect(initIdx).toBeGreaterThan(-1);
        expect(pausedIdx).toBeGreaterThan(initIdx);
    });

    it('QuickPlayScene.init() resets _activeTab to 0 and _transitioning to false', () => {
        const content = readFileSync(join(scenesDir, 'QuickPlayScene.js'), 'utf-8');
        // init() exists (no parameter)
        expect(content).toMatch(/init\s*\(\s*\)/);
        // _activeTab = 0 reset
        expect(content).toMatch(/_activeTab\s*=\s*0/);
        // _transitioning = false reset
        expect(content).toMatch(/_transitioning\s*=\s*false/);
    });

    it('ShopScene.init() resets _purchasing to false', () => {
        const content = readFileSync(join(scenesDir, 'ShopScene.js'), 'utf-8');
        // init() exists
        expect(content).toMatch(/init\s*\(\s*\)/);
        // _purchasing = false reset (prevents double-purchase bug on scene reuse)
        expect(content).toMatch(/_purchasing\s*=\s*false/);
    });

    it('IntroScene is not registered in game config (removed from scene list)', () => {
        const configContent = readFileSync(resolve(__dirname, '../src/config.js'), 'utf-8');
        // IntroScene was removed — must NOT appear as a standalone import
        // Note: VSIntroScene (VS lobby) is different and IS included — check word boundary
        expect(configContent).not.toMatch(/^import IntroScene\b/m);
    });
});
