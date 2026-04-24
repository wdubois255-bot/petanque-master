/**
 * Mobile Phase 6 — Smoke tests multi-device
 *
 * Tagué @mobile : ne tourne que sur les projects iPhone SE / iPhone 14 / Pixel 5
 * (voir playwright.config.js → grep/grepInvert).
 *
 * Valide pour chaque device :
 *  - Boot du jeu, canvas visible
 *  - Orientation portrait (height > width)
 *  - Navigation Title → Press Start → Play → PetanqueScene
 *  - Zéro erreur console critique
 *
 * Navigation : au clavier (Space) — simple et robuste. L'input tactile
 * précis est validé séparément en Phase 3/4, pas ici.
 */
import { test, expect } from '@playwright/test';

const BOOT_WAIT = 4000;
const SCENE_TRANSITION = 2500;

function filterCriticalErrors(errors) {
    return errors.filter(e =>
        !e.includes('Unexpected token') &&
        !e.includes('JSON') &&
        !e.includes('audio') &&
        !e.includes('404') &&
        !e.includes('decoding') &&
        !e.includes('NotSupportedError') &&
        !e.includes('DOCTYPE') &&
        !e.includes('is not valid JSON') &&
        !e.includes('Failed to fetch') &&
        !e.includes('net::ERR') &&
        !e.includes('setMask')
    );
}

async function waitForGame(page) {
    await page.goto('/');
    await page.waitForSelector('canvas', { timeout: 15000 });
    await page.waitForTimeout(BOOT_WAIT);
}

async function key(page, k, wait = 300) {
    await page.keyboard.press(k);
    await page.waitForTimeout(wait);
}

test.describe('@mobile smoke — Boot → Title → Match court', () => {

    test('@mobile canvas visible et en portrait', async ({ page }) => {
        await waitForGame(page);

        const canvas = page.locator('canvas');
        await expect(canvas).toBeVisible();

        const box = await canvas.boundingBox();
        expect(box).not.toBeNull();
        expect(box.width).toBeGreaterThan(100);
        expect(box.height).toBeGreaterThan(100);
        // Portrait : hauteur > largeur
        expect(box.height).toBeGreaterThan(box.width);
    });

    test('@mobile navigation Title → PetanqueScene sans erreur console', async ({ page }, testInfo) => {
        test.setTimeout(60000);

        const errors = [];
        page.on('pageerror', err => errors.push(err.message));
        page.on('console', msg => {
            if (msg.type() === 'error') errors.push(msg.text());
        });

        await waitForGame(page);

        // Press Start → Main menu
        await key(page, 'Space', 1000);
        // Index 0 = Play (rookie vs papi_rene, PetanqueScene direct)
        await key(page, 'Space', SCENE_TRANSITION + 1500);

        // Vérifier que PetanqueScene est active
        const sceneKey = await page.evaluate(() => {
            try {
                const game = globalThis.__PHASER_GAME__;
                if (!game) return 'no_game';
                const active = game.scene.getScenes(true)
                    .map(s => s.scene.key)
                    .filter(k => k !== 'UIScene');
                return active.join(',');
            } catch (e) {
                return 'error:' + e.message;
            }
        });
        expect(sceneKey, `Scene active après navigation sur ${testInfo.project.name}: ${sceneKey}`)
            .toContain('PetanqueScene');

        // Attendre 2s que le terrain s'affiche puis screenshot debug
        await page.waitForTimeout(2000);
        await page.screenshot({
            path: `test-results/mobile-smoke-petanque-${testInfo.project.name.replace(/\s+/g, '-')}.png`,
            fullPage: false
        });

        const critical = filterCriticalErrors(errors);
        expect(critical, `Errors on ${testInfo.project.name}:\n${critical.join('\n')}`)
            .toHaveLength(0);
    });
});
