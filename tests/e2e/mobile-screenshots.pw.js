/**
 * Screenshots mobile — capture visuelle de toutes les scènes en portrait
 * Usage : npx playwright test tests/e2e/mobile-screenshots.pw.js --project="Pixel 5"
 */
import { test } from '@playwright/test';
import { mkdirSync, existsSync } from 'fs';
import { resolve } from 'path';

const OUT = resolve(process.cwd(), 'docs/mobile/screenshots');
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

const WAIT_BOOT = 4500;
const WAIT_SCENE = 2000;

async function shoot(page, name) {
    await page.waitForTimeout(WAIT_SCENE);
    await page.screenshot({ path: resolve(OUT, `${name}.png`), fullPage: false });
}

async function gotoTitle(page) {
    await page.goto('/');
    await page.waitForSelector('canvas', { timeout: 15000 });
    await page.waitForTimeout(WAIT_BOOT);
}

async function pressSpace(page) {
    await page.keyboard.press('Space');
    await page.waitForTimeout(800);
}

async function dragCanvas(page, fromR, toR) {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    const fx = box.x + box.width * fromR.x;
    const fy = box.y + box.height * fromR.y;
    const tx = box.x + box.width * toR.x;
    const ty = box.y + box.height * toR.y;
    await page.mouse.move(fx, fy);
    await page.mouse.down();
    for (let i = 1; i <= 10; i++) {
        const t = i / 10;
        await page.mouse.move(fx + (tx - fx) * t, fy + (ty - fy) * t);
    }
    await page.mouse.up();
}

test.describe('Mobile screenshots @mobile', () => {
    test('01 — TitleScene (avec bottom nav)', async ({ page }) => {
        await gotoTitle(page);
        await shoot(page, '01-title');
    });

    test('02 — TitleScene menu (après Press Start)', async ({ page }) => {
        await gotoTitle(page);
        await pressSpace(page);  // Press Start → menu expanded
        await shoot(page, '02-title-menu');
    });

    test('03 — CharSelectScene (via Quick Play)', async ({ page }) => {
        await gotoTitle(page);
        await pressSpace(page);  // menu expanded
        await page.keyboard.press('ArrowDown');  // navigate to Quick Play
        await page.waitForTimeout(200);
        await pressSpace(page);  // select Quick Play → CharSelect
        await page.waitForTimeout(1500);
        await shoot(page, '03-charselect');
    });

    test('04 — QuickPlayScene (après select perso)', async ({ page }) => {
        await gotoTitle(page);
        await pressSpace(page);
        await page.keyboard.press('ArrowDown');
        await page.waitForTimeout(200);
        await pressSpace(page);
        await page.waitForTimeout(1500);
        // Confirm perso Rookie (déjà selected par défaut)
        await pressSpace(page);
        await page.waitForTimeout(1500);
        await shoot(page, '04-quickplay');
    });

    test('05 — PetanqueScene (match en cours)', async ({ page }) => {
        await gotoTitle(page);
        await pressSpace(page);
        await page.keyboard.press('ArrowDown');
        await page.waitForTimeout(200);
        await pressSpace(page);
        await page.waitForTimeout(1500);
        await pressSpace(page);  // select Rookie
        await page.waitForTimeout(1500);
        // QuickPlayScene : Enter to launch avec defaults
        await page.keyboard.press('Enter');
        await page.waitForTimeout(3500);  // VSIntro + transition
        await shoot(page, '05-match');
    });

    test('06 — ShopScene (via bottom nav ou menu)', async ({ page }) => {
        await gotoTitle(page);
        await pressSpace(page);  // menu
        // Navigate to Shop button (3e probably)
        await page.keyboard.press('ArrowDown');
        await page.waitForTimeout(150);
        await page.keyboard.press('ArrowDown');
        await page.waitForTimeout(150);
        await page.keyboard.press('ArrowDown');
        await page.waitForTimeout(150);
        await pressSpace(page);
        await page.waitForTimeout(2000);
        await shoot(page, '06-shop');
    });

    test('07 — ArcadeScene (intro narrative)', async ({ page }) => {
        await gotoTitle(page);
        await pressSpace(page);
        // Arcade est généralement en premier du menu principal
        await pressSpace(page);
        await page.waitForTimeout(2500);
        await shoot(page, '07-arcade');
    });
});
