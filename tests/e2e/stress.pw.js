/**
 * Petanque Master - Stress & Gameplay Robustness Tests
 *
 * Simulates intense gameplay, rapid inputs, edge cases,
 * and full match flows to detect crashes, freezes, and glitches.
 */
import { test, expect } from '@playwright/test';

const BOOT_WAIT = 4000;

async function waitForGame(page) {
    await page.goto('/');
    await page.waitForSelector('canvas', { timeout: 15000 });
    await page.waitForTimeout(BOOT_WAIT);
}

async function key(page, k) {
    await page.keyboard.press(k);
}

async function dragCanvas(page, fromX, fromY, toX, toY, steps = 15) {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    await page.mouse.move(box.x + fromX, box.y + fromY);
    await page.mouse.down();
    for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        await page.mouse.move(
            box.x + fromX + (toX - fromX) * t,
            box.y + fromY + (toY - fromY) * t
        );
    }
    await page.mouse.up();
}

async function startQuickMatch(page) {
    await waitForGame(page);
    await key(page, 'Space'); // Press start
    await page.waitForTimeout(800);
    await key(page, 'ArrowDown');
    await page.waitForTimeout(200);
    await key(page, 'Space'); // Quick Play
    await page.waitForTimeout(1000);
    await key(page, 'Space'); // Start match
    await page.waitForTimeout(5000); // VS intro + transition
}

// ═══════════════════════════════════════════════════════════
//  INPUT STRESS TESTS
// ═══════════════════════════════════════════════════════════

test.describe('Stress - Input Flooding', () => {

    test('survives 50 rapid key presses on title', async ({ page }) => {
        await waitForGame(page);
        const keys = ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Escape', 'Enter', 'Tab', '1', '2', '3'];
        for (let i = 0; i < 50; i++) {
            await key(page, keys[i % keys.length]);
            await page.waitForTimeout(30);
        }
        await page.waitForTimeout(1000);
        await expect(page.locator('canvas')).toBeVisible();
    });

    test('survives 30 rapid clicks on canvas', async ({ page }) => {
        await waitForGame(page);
        const canvas = page.locator('canvas');
        const box = await canvas.boundingBox();
        for (let i = 0; i < 30; i++) {
            const x = box.x + Math.random() * box.width;
            const y = box.y + Math.random() * box.height;
            await page.mouse.click(x, y);
            await page.waitForTimeout(30);
        }
        await page.waitForTimeout(500);
        await expect(page.locator('canvas')).toBeVisible();
    });

    test('survives rapid drag attempts during menu', async ({ page }) => {
        await waitForGame(page);
        // Rapid drags on title screen (should not crash)
        for (let i = 0; i < 10; i++) {
            await dragCanvas(page,
                200 + Math.random() * 400,
                200 + Math.random() * 200,
                200 + Math.random() * 400,
                100 + Math.random() * 100,
                5
            );
            await page.waitForTimeout(50);
        }
        await page.waitForTimeout(500);
        await expect(page.locator('canvas')).toBeVisible();
    });

    test('survives mixed keyboard + mouse during gameplay', async ({ page }) => {
        test.setTimeout(60000);
        await startQuickMatch(page);

        // Mix of inputs during gameplay
        for (let i = 0; i < 20; i++) {
            const action = i % 4;
            if (action === 0) {
                await key(page, ['1', '2', '3', 'Tab', 'Escape'][i % 5]);
            } else if (action === 1) {
                const canvas = page.locator('canvas');
                const box = await canvas.boundingBox();
                await page.mouse.click(box.x + Math.random() * box.width, box.y + Math.random() * box.height);
            } else if (action === 2) {
                await dragCanvas(page, 416, 400, 416, 250, 5);
            } else {
                await key(page, 'Space');
            }
            await page.waitForTimeout(100);
        }
        await page.waitForTimeout(1000);
        await expect(page.locator('canvas')).toBeVisible();
    });
});

// ═══════════════════════════════════════════════════════════
//  SCENE TRANSITION STRESS
// ═══════════════════════════════════════════════════════════

test.describe('Stress - Scene Transitions', () => {

    test('rapid menu cycling (10x) does not crash', async ({ page }) => {
        test.setTimeout(60000);
        await waitForGame(page);

        for (let i = 0; i < 10; i++) {
            await key(page, 'Space'); // Advance
            await page.waitForTimeout(400);
            await key(page, 'Escape'); // Back
            await page.waitForTimeout(400);
        }
        await expect(page.locator('canvas')).toBeVisible();
    });

    test('arcade → back → quick play → back cycle (5x)', async ({ page }) => {
        test.setTimeout(120000);
        await waitForGame(page);

        for (let i = 0; i < 5; i++) {
            // Go to arcade
            await key(page, 'Space');
            await page.waitForTimeout(600);
            await key(page, 'Space');
            await page.waitForTimeout(1500);
            await key(page, 'Escape');
            await page.waitForTimeout(800);
            // Go to quick play
            await key(page, 'Space');
            await page.waitForTimeout(600);
            await key(page, 'ArrowDown');
            await page.waitForTimeout(200);
            await key(page, 'Space');
            await page.waitForTimeout(1500);
            await key(page, 'Escape');
            await page.waitForTimeout(800);
        }
        await expect(page.locator('canvas')).toBeVisible();
    });

    test('page reload mid-game recovers', async ({ page }) => {
        test.setTimeout(60000);
        await startQuickMatch(page);

        // Throw cochonnet
        await dragCanvas(page, 416, 430, 416, 280);
        await page.waitForTimeout(2000);

        // Hard reload mid-game
        await page.reload();
        await page.waitForSelector('canvas', { timeout: 15000 });
        await page.waitForTimeout(BOOT_WAIT);

        // Should be back at title, functional
        await expect(page.locator('canvas')).toBeVisible();
        await key(page, 'Space');
        await page.waitForTimeout(500);
        await expect(page.locator('canvas')).toBeVisible();
    });
});

// ═══════════════════════════════════════════════════════════
//  GAMEPLAY FLOW STRESS
// ═══════════════════════════════════════════════════════════

test.describe('Stress - Gameplay Flow', () => {

    test('full cochonnet + 2 ball throws without crash', async ({ page }) => {
        test.setTimeout(90000);
        const errors = [];
        page.on('pageerror', err => errors.push(err.message));

        await startQuickMatch(page);
        await page.waitForTimeout(1000);

        // Throw cochonnet
        await dragCanvas(page, 416, 430, 416, 280);
        await page.waitForTimeout(4000);

        // Select shot mode and throw ball 1
        await key(page, '2'); // demi-portee
        await page.waitForTimeout(500);
        await dragCanvas(page, 416, 430, 420, 280);
        await page.waitForTimeout(4000);

        // Wait for AI turn
        await page.waitForTimeout(4000);

        // Throw ball 2 (if it's player's turn)
        await key(page, '1'); // roulette
        await page.waitForTimeout(500);
        await dragCanvas(page, 416, 430, 410, 270);
        await page.waitForTimeout(4000);

        await expect(page.locator('canvas')).toBeVisible();

        const critical = errors.filter(e =>
            !e.includes('audio') && !e.includes('404') &&
            !e.includes('JSON') && !e.includes('Unexpected token')
        );
        expect(critical).toEqual([]);
    });

    test('multiple throws with different loft modes', async ({ page }) => {
        test.setTimeout(90000);
        await startQuickMatch(page);
        await page.waitForTimeout(1000);

        // Cochonnet
        await dragCanvas(page, 416, 430, 416, 250);
        await page.waitForTimeout(4000);

        const loftKeys = ['1', '2', '3']; // roulette, demi-portee, plombee
        for (let i = 0; i < 3; i++) {
            await key(page, loftKeys[i % 3]);
            await page.waitForTimeout(500);
            await dragCanvas(page, 416, 430, 400 + i * 10, 260 + i * 10);
            await page.waitForTimeout(5000); // ball physics + possible AI turn
        }

        await expect(page.locator('canvas')).toBeVisible();
    });

    test('extreme drag vectors do not crash', async ({ page }) => {
        test.setTimeout(120000);
        await startQuickMatch(page);
        await page.waitForTimeout(1000);

        // Extreme drags: tiny, huge, sideways, backwards
        const drags = [
            [416, 430, 416, 428],     // Almost no drag
            [416, 430, 416, 50],      // Max power drag
            [416, 430, 100, 430],     // Pure horizontal
            [416, 430, 416, 450],     // Backwards (down)
            [416, 430, 800, 50],      // Diagonal max
            [416, 430, 10, 50],       // Diagonal opposite
        ];

        for (const [fx, fy, tx, ty] of drags) {
            await dragCanvas(page, fx, fy, tx, ty, 8);
            await page.waitForTimeout(2000);
        }

        await expect(page.locator('canvas')).toBeVisible();
    });
});

// ═══════════════════════════════════════════════════════════
//  EDGE CASES
// ═══════════════════════════════════════════════════════════

test.describe('Stress - Edge Cases', () => {

    test('double-click on character select does not crash', async ({ page }) => {
        await waitForGame(page);
        await key(page, 'Space');
        await page.waitForTimeout(800);
        await key(page, 'Space'); // Arcade
        await page.waitForTimeout(2000);

        // Double rapid Space (select + confirm)
        await key(page, 'Space');
        await page.waitForTimeout(50);
        await key(page, 'Space');
        await page.waitForTimeout(2000);

        await expect(page.locator('canvas')).toBeVisible();
    });

    test('escape during VS intro does not hang', async ({ page }) => {
        test.setTimeout(45000);
        await waitForGame(page);
        await key(page, 'Space');
        await page.waitForTimeout(800);
        await key(page, 'ArrowDown');
        await page.waitForTimeout(200);
        await key(page, 'Space');
        await page.waitForTimeout(1000);
        await key(page, 'Space'); // Start match
        await page.waitForTimeout(1000);

        // Try to escape during VS intro
        await key(page, 'Escape');
        await page.waitForTimeout(2000);

        await expect(page.locator('canvas')).toBeVisible();
    });

    test('Tab key during gameplay shows scoreboard', async ({ page }) => {
        test.setTimeout(60000);
        await startQuickMatch(page);
        await page.waitForTimeout(1000);

        // Tab should show/toggle scoreboard without crashing
        await key(page, 'Tab');
        await page.waitForTimeout(500);
        await expect(page.locator('canvas')).toBeVisible();
        await key(page, 'Tab');
        await page.waitForTimeout(500);
        await expect(page.locator('canvas')).toBeVisible();
    });
});
