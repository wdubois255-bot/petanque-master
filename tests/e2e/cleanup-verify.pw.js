/**
 * Cleanup v2 — Verification visuelle complete
 * Capture chaque scene cle apres le cleanup.
 *
 * Navigation basee sur le navMap reel de TitleScene:
 *   0: JOUER (default)
 *   1: Mode Arcade  |  2: Partie Rapide   (left/right)
 *   3: Mon Perso    |  4: Boutique         (left/right)
 *   5: Parametres
 *
 * ArrowDown depuis 0 → 1, depuis 1 → 3, depuis 2 → 4, etc.
 */
import { test, expect } from '@playwright/test';
import path from 'path';

const SCREENSHOT_DIR = path.resolve('tests/e2e/cleanup-screenshots');

async function boot(page) {
    await page.goto('/');
    await page.waitForSelector('canvas', { timeout: 15000 });
    await page.waitForTimeout(4000); // Boot complete
}

async function toMenu(page) {
    await boot(page);
    await page.keyboard.press('Space'); // Press Start → Menu
    await page.waitForTimeout(600); // Menu stagger animation
}

async function snap(page, name) {
    await page.locator('canvas').screenshot({
        path: path.join(SCREENSHOT_DIR, `v2-${name}.png`)
    });
}

// ═══════════════════════════════════════════════════════════
// 1. TITLE SCENE
// ═══════════════════════════════════════════════════════════

test('TitleScene - press start + menu', async ({ page }) => {
    await boot(page);
    await page.waitForTimeout(1500);
    await snap(page, '01-title-pressstart');

    await page.keyboard.press('Space');
    await page.waitForTimeout(800);
    await snap(page, '02-title-menu');

    await expect(page.locator('canvas')).toBeVisible();
});

// ═══════════════════════════════════════════════════════════
// 2. QUICK PLAY SCENE (index 2: ArrowDown → ArrowRight → Space)
// ═══════════════════════════════════════════════════════════

test('QuickPlayScene - panel NineSlice + button tint', async ({ page }) => {
    await toMenu(page);
    // 0 → ArrowDown → 1 (Mode Arcade) → ArrowRight → 2 (Partie Rapide)
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(200);
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(200);
    await page.keyboard.press('Space');
    await page.waitForTimeout(1500);

    await snap(page, '03-quickplay');

    // Navigate to JOUER button (8 ArrowDown from top)
    for (let i = 0; i < 9; i++) {
        await page.keyboard.press('ArrowDown');
        await page.waitForTimeout(100);
    }
    await snap(page, '04-quickplay-jouer');

    await expect(page.locator('canvas')).toBeVisible();
});

// ═══════════════════════════════════════════════════════════
// 3. CHAR SELECT SCENE (Arcade: index 1: ArrowDown → Space)
// ═══════════════════════════════════════════════════════════

test('CharSelectScene - padlock sprite + NineSlice panel', async ({ page }) => {
    await toMenu(page);
    // 0 → ArrowDown → 1 (Mode Arcade)
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(200);
    await page.keyboard.press('Space');
    await page.waitForTimeout(2000);

    await snap(page, '05-charselect-arcade');
    await expect(page.locator('canvas')).toBeVisible();
});

// ═══════════════════════════════════════════════════════════
// 4. PLAYER SCENE (index 3: ArrowDown × 2 → Space)
// ═══════════════════════════════════════════════════════════

test('PlayerScene - rookie animated sprite', async ({ page }) => {
    await toMenu(page);
    // 0 → 1 → 3 (Mon Personnage)
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(200);
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(200);
    await page.keyboard.press('Space');
    await page.waitForTimeout(1500);

    await snap(page, '06-player');
    await expect(page.locator('canvas')).toBeVisible();
});

// ═══════════════════════════════════════════════════════════
// 5. SHOP SCENE (index 4: ArrowDown → ArrowRight → ArrowDown → Space)
// ═══════════════════════════════════════════════════════════

test('ShopScene - galet sprite icon', async ({ page }) => {
    await toMenu(page);
    // 0 → 1 → ArrowRight → 2 → ArrowDown → 4 (Boutique)
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(200);
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(200);
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(200);
    await page.keyboard.press('Space');
    await page.waitForTimeout(1500);

    await snap(page, '07-shop');
    await expect(page.locator('canvas')).toBeVisible();
});

// ═══════════════════════════════════════════════════════════
// 6. ARCADE FLOW (narrative + progress + VS intro + petanque)
// ═══════════════════════════════════════════════════════════

test('Arcade flow - narrative, progress, petanque', async ({ page }) => {
    await toMenu(page);
    // Arcade: 0 → 1 → Space
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(200);
    await page.keyboard.press('Space');
    await page.waitForTimeout(2000);

    // CharSelectScene (Rookie only) → Confirm
    await snap(page, '08-charselect-confirm');
    await page.keyboard.press('Space');
    await page.waitForTimeout(2500);

    // Arcade intro narrative (wait for text to appear)
    await page.waitForTimeout(3000);
    await snap(page, '09-arcade-narrative');

    // Skip narrative → progress screen
    await page.keyboard.press('Space');
    await page.waitForTimeout(2000);
    await snap(page, '10-arcade-progress');

    // COMBATTRE → VS Intro
    await page.keyboard.press('Space');
    await page.waitForTimeout(3000);
    await snap(page, '11-vs-intro');

    // Wait for PetanqueScene
    await page.waitForTimeout(3000);
    await snap(page, '12-petanque');

    await expect(page.locator('canvas')).toBeVisible();
});

// ═══════════════════════════════════════════════════════════
// 7. PARAMETRES MODAL (index 5: overlay warm brown)
// ═══════════════════════════════════════════════════════════

test('Parametres - modal overlay warm brown (not pure black)', async ({ page }) => {
    await toMenu(page);
    // 0 → 1 → 3 → 5 (Parametres)
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(200);
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(200);
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(200);
    await page.keyboard.press('Space');
    await page.waitForTimeout(800);

    await snap(page, '13-parametres-modal');
    await expect(page.locator('canvas')).toBeVisible();
});
