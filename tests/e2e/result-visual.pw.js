/**
 * Result Scene Visual Check
 * Takes screenshots of victory and defeat screens for visual review.
 */
import { test, expect } from '@playwright/test';

const BOOT_WAIT = 4000;

async function waitForGame(page) {
    await page.goto('/');
    await page.waitForSelector('canvas', { timeout: 15000 });
    await page.waitForTimeout(BOOT_WAIT);
}

async function key(page, k, wait = 300) {
    await page.keyboard.press(k);
    await page.waitForTimeout(wait);
}

async function navigateToQuickPlay(page) {
    await waitForGame(page);
    await key(page, 'Space', 800);    // Press start
    await key(page, 'ArrowDown', 200); // Quick Play
    await key(page, 'Space', 1500);    // Enter QuickPlay
}

test.describe('Result Scene Visual Review', () => {

    test('take screenshot of QuickPlay config screen', async ({ page }) => {
        await navigateToQuickPlay(page);
        await page.waitForTimeout(500);
        await expect(page.locator('canvas')).toHaveScreenshot('result-quickplay-config.png', {
            maxDiffPixelRatio: 0.12,
        });
    });

    test('take screenshot after launching a match (PetanqueScene)', async ({ page }) => {
        test.setTimeout(60000);
        await navigateToQuickPlay(page);
        await key(page, 'Space', 4000);  // Start match → VSIntro → PetanqueScene
        await page.waitForTimeout(2000);
        await expect(page.locator('canvas')).toHaveScreenshot('result-petanque-scene.png', {
            maxDiffPixelRatio: 0.12,
        });
    });

    test('force victory ResultScene via evaluate', async ({ page }) => {
        test.setTimeout(60000);
        await waitForGame(page);

        // Force-start ResultScene with victory data
        await page.evaluate(() => {
            const game = globalThis.__PHASER_GAME__;
            if (!game) return;
            const scene = game.scene.getScene('TitleScene') || game.scene.getScene('BootScene');
            if (!scene) return;
            const chars = scene.cache?.json?.get('characters');
            const roster = chars?.roster || [];
            const rookie = roster.find(c => c.id === 'rookie') || { id: 'rookie', name: 'Le Rookie' };
            const opp = roster.find(c => c.id === 'la_choupe') || { id: 'la_choupe', name: 'La Choupe' };

            game.scene.start('ResultScene', {
                won: true,
                scores: { player: 13, opponent: 7 },
                playerCharacter: rookie,
                opponentCharacter: opp,
                terrainName: 'Place du Village',
                returnScene: 'TitleScene',
                matchStats: { menes: 8, bestMene: 4, carreaux: 2, biberons: 1, bestBallDist: 12, shots: 4, points_attempted: 6 },
                galetsEarned: 15
            });
        });

        await page.waitForTimeout(4000); // Wait for all animations
        await expect(page.locator('canvas')).toHaveScreenshot('result-victory.png', {
            maxDiffPixelRatio: 0.15, // High tolerance due to confetti
        });
    });

    test('force defeat ResultScene via evaluate', async ({ page }) => {
        test.setTimeout(60000);
        await waitForGame(page);

        await page.evaluate(() => {
            const game = globalThis.__PHASER_GAME__;
            if (!game) return;
            const scene = game.scene.getScene('TitleScene') || game.scene.getScene('BootScene');
            if (!scene) return;
            const chars = scene.cache?.json?.get('characters');
            const roster = chars?.roster || [];
            const rookie = roster.find(c => c.id === 'rookie') || { id: 'rookie', name: 'Le Rookie' };
            const opp = roster.find(c => c.id === 'la_choupe') || { id: 'la_choupe', name: 'La Choupe' };

            game.scene.start('ResultScene', {
                won: false,
                scores: { player: 8, opponent: 13 },
                playerCharacter: rookie,
                opponentCharacter: opp,
                terrainName: 'Place du Village',
                returnScene: 'TitleScene',
                matchStats: { menes: 10, bestMene: 3, carreaux: 0, biberons: 0, bestBallDist: 45, shots: 2, points_attempted: 8 },
                galetsEarned: 0
            });
        });

        await page.waitForTimeout(3500);
        await expect(page.locator('canvas')).toHaveScreenshot('result-defeat.png', {
            maxDiffPixelRatio: 0.12,
        });
    });
});
