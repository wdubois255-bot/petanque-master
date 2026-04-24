/**
 * Mobile Phase 6 — Visual regression portrait
 *
 * Tagué @mobile : ne tourne que sur les projects iPhone SE / iPhone 14 / Pixel 5.
 *
 * 3 snapshots par device :
 *   - Title (menu principal visible)
 *   - CharSelect (écran sélection joueur) — TODO: accessible via QuickPlay
 *   - PetanqueScene avant lancer (visée prête)
 *
 * Nomme les baselines avec le projectName pour éviter les collisions entre
 * devices (snapshotPathTemplate partagé avec desktop).
 *
 * PREMIER RUN : les baselines n'existent pas → les tests échouent en générant
 * les PNG. Utiliser `npm run test:e2e:mobile:update` pour les créer.
 */
import { test, expect } from '@playwright/test';

const BOOT_WAIT = 4000;
const SCENE_TRANSITION = 2500;

async function waitForGame(page) {
    await page.goto('/');
    await page.waitForSelector('canvas', { timeout: 15000 });
    await page.waitForTimeout(BOOT_WAIT);
}

async function key(page, k, wait = 300) {
    await page.keyboard.press(k);
    await page.waitForTimeout(wait);
}

function slug(projectName) {
    return projectName.replace(/\s+/g, '-');
}

test.describe('@mobile @visual — snapshots portrait', () => {

    test('@mobile @visual Title portrait', async ({ page }, testInfo) => {
        test.setTimeout(45000);
        await waitForGame(page);
        // Press Start pour aller sur le menu (reste sur TitleScene)
        await key(page, 'Space', 1500);

        await expect(page.locator('canvas'))
            .toHaveScreenshot(`${slug(testInfo.project.name)}-title.png`, {
                maxDiffPixelRatio: 0.10,
            });
    });

    test('@mobile @visual QuickPlay portrait', async ({ page }, testInfo) => {
        test.setTimeout(45000);
        await waitForGame(page);
        // Press Start → menu principal
        await key(page, 'Space', 1000);
        // Descendre vers QuickPlay (index 2)
        await key(page, 'ArrowDown', 300);
        await key(page, 'ArrowDown', 300);
        // Valider → QuickPlayScene
        await key(page, 'Space', SCENE_TRANSITION);

        await expect(page.locator('canvas'))
            .toHaveScreenshot(`${slug(testInfo.project.name)}-quickplay.png`, {
                maxDiffPixelRatio: 0.10,
            });
    });

    test('@mobile @visual PetanqueScene avant lancer', async ({ page }, testInfo) => {
        test.setTimeout(60000);
        await waitForGame(page);
        // Press Start → Main menu
        await key(page, 'Space', 1000);
        // Index 0 = Play (lance PetanqueScene rookie vs papi_rene)
        await key(page, 'Space', SCENE_TRANSITION + 2500);

        // Attendre stabilisation du terrain
        await page.waitForTimeout(1500);

        await expect(page.locator('canvas'))
            .toHaveScreenshot(`${slug(testInfo.project.name)}-petanque.png`, {
                maxDiffPixelRatio: 0.12, // Tolérance plus large — terrain a dust/particles
            });
    });
});
