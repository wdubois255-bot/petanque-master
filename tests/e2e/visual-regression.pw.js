/**
 * Petanque Master - Visual Regression Tests
 *
 * Captures screenshots of every scene and compares against baselines.
 * First run: creates golden files in /tests/e2e/snapshots/
 * Subsequent runs: fails if visual diff exceeds threshold.
 *
 * Update baselines: npx playwright test --update-snapshots
 */
import { test, expect } from '@playwright/test';

const BOOT_WAIT = 4000;
const SCENE_TRANSITION = 2000;

// ─── Helpers ───────────────────────────────────────────────

async function waitForGame(page) {
    await page.goto('/');
    await page.waitForSelector('canvas', { timeout: 15000 });
    await page.waitForTimeout(BOOT_WAIT);
}

async function key(page, k) {
    await page.keyboard.press(k);
}

async function screenshotCanvas(page) {
    return page.locator('canvas').screenshot();
}

// ═══════════════════════════════════════════════════════════
//  SCENE SCREENSHOTS
// ═══════════════════════════════════════════════════════════

test.describe('Visual Regression - Scenes', () => {

    test('01 - Title Screen (press start)', async ({ page }) => {
        await waitForGame(page);
        // Wait for intro animation to settle
        await page.waitForTimeout(1500);
        await expect(page.locator('canvas')).toHaveScreenshot('01-title-press-start.png', {
            maxDiffPixelRatio: 0.08,
        });
    });

    test('02 - Title Screen (main menu)', async ({ page }) => {
        await waitForGame(page);
        await page.waitForTimeout(1000);
        await key(page, 'Space'); // Pass press start
        await page.waitForTimeout(1000);
        await expect(page.locator('canvas')).toHaveScreenshot('02-title-main-menu.png', {
            maxDiffPixelRatio: 0.08,
        });
    });

    test('03 - Character Select (Arcade)', async ({ page }) => {
        await waitForGame(page);
        await key(page, 'Space'); // Press start
        await page.waitForTimeout(800);
        await key(page, 'Space'); // Arcade mode
        await page.waitForTimeout(SCENE_TRANSITION);
        await expect(page.locator('canvas')).toHaveScreenshot('03-char-select-arcade.png', {
            maxDiffPixelRatio: 0.08,
        });
    });

    test('04 - Character Select (cursor navigation)', async ({ page }) => {
        await waitForGame(page);
        await key(page, 'Space');
        await page.waitForTimeout(800);
        await key(page, 'Space'); // Arcade
        await page.waitForTimeout(SCENE_TRANSITION);
        // Move cursor through characters
        await key(page, 'ArrowRight');
        await page.waitForTimeout(400);
        await key(page, 'ArrowRight');
        await page.waitForTimeout(400);
        await expect(page.locator('canvas')).toHaveScreenshot('04-char-select-cursor-moved.png', {
            maxDiffPixelRatio: 0.08,
        });
    });

    test('05 - Quick Play Config', async ({ page }) => {
        await waitForGame(page);
        await key(page, 'Space'); // Press start
        await page.waitForTimeout(800);
        await key(page, 'ArrowDown'); // Quick Play
        await page.waitForTimeout(200);
        await key(page, 'Space');
        await page.waitForTimeout(SCENE_TRANSITION);
        await expect(page.locator('canvas')).toHaveScreenshot('05-quick-play-config.png', {
            maxDiffPixelRatio: 0.08,
        });
    });

    test('06 - VS Intro Screen', async ({ page }) => {
        test.setTimeout(45000);
        await waitForGame(page);
        await key(page, 'Space'); // Press start
        await page.waitForTimeout(800);
        await key(page, 'ArrowDown');
        await page.waitForTimeout(200);
        await key(page, 'Space'); // Quick Play
        await page.waitForTimeout(1000);
        await key(page, 'Space'); // Start match
        await page.waitForTimeout(SCENE_TRANSITION);
        await expect(page.locator('canvas')).toHaveScreenshot('06-vs-intro.png', {
            maxDiffPixelRatio: 0.08, // More tolerance — dynamic text
        });
    });

    test('07 - Petanque Scene (initial state)', async ({ page }) => {
        test.setTimeout(45000);
        await waitForGame(page);
        await key(page, 'Space');
        await page.waitForTimeout(800);
        await key(page, 'ArrowDown');
        await page.waitForTimeout(200);
        await key(page, 'Space'); // Quick Play
        await page.waitForTimeout(1000);
        await key(page, 'Space'); // Start match
        await page.waitForTimeout(4000); // Wait for VS intro + transition
        await expect(page.locator('canvas')).toHaveScreenshot('07-petanque-initial.png', {
            maxDiffPixelRatio: 0.08,
        });
    });
});

// ═══════════════════════════════════════════════════════════
//  CHARACTER PORTRAITS (ensure each char renders correctly)
// ═══════════════════════════════════════════════════════════

test.describe('Visual Regression - Character Portraits', () => {

    async function goToCharSelect(page) {
        await waitForGame(page);
        await key(page, 'Space'); // Press start
        await page.waitForTimeout(800);
        await key(page, 'Space'); // Arcade
        await page.waitForTimeout(SCENE_TRANSITION);
    }

    const characters = ['rookie', 'la_choupe', 'marcel', 'magicien', 'reyes', 'ley'];

    for (let i = 0; i < characters.length; i++) {
        test(`portrait - ${characters[i]}`, async ({ page }) => {
            await goToCharSelect(page);
            // Navigate to character position
            for (let j = 0; j < i; j++) {
                await key(page, 'ArrowRight');
                await page.waitForTimeout(300);
            }
            await page.waitForTimeout(500);
            await expect(page.locator('canvas')).toHaveScreenshot(`portrait-${characters[i]}.png`, {
                maxDiffPixelRatio: 0.08,
            });
        });
    }
});

// ═══════════════════════════════════════════════════════════
//  TERRAIN VISUALS (each terrain renders distinctly)
// ═══════════════════════════════════════════════════════════

test.describe('Visual Regression - Terrains', () => {

    const terrains = ['terre', 'herbe', 'sable', 'colline', 'docks'];

    async function goToQuickPlayTerrain(page, terrainIndex) {
        await waitForGame(page);
        await key(page, 'Space'); // Press start
        await page.waitForTimeout(800);
        await key(page, 'ArrowDown');
        await page.waitForTimeout(200);
        await key(page, 'Space'); // Quick Play
        await page.waitForTimeout(1000);
        // Navigate to terrain row
        for (let i = 0; i < 5; i++) {
            await key(page, 'ArrowDown');
            await page.waitForTimeout(100);
        }
        // Cycle to desired terrain
        for (let i = 0; i < terrainIndex; i++) {
            await key(page, 'ArrowRight');
            await page.waitForTimeout(200);
        }
        // Start match
        await key(page, 'Space');
        await page.waitForTimeout(5000); // VS intro + petanque load
    }

    for (let i = 0; i < terrains.length; i++) {
        test(`terrain - ${terrains[i]}`, async ({ page }) => {
            test.setTimeout(45000);
            await goToQuickPlayTerrain(page, i);
            await expect(page.locator('canvas')).toHaveScreenshot(`terrain-${terrains[i]}.png`, {
                maxDiffPixelRatio: 0.08,
            });
        });
    }
});
