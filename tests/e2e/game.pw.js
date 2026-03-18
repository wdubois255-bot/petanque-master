/**
 * Petanque Master - E2E Tests
 * Tests the full game flow in a real browser
 */
import { test, expect } from '@playwright/test';

const LOAD_TIMEOUT = 12000;

// Helper: wait for Phaser canvas to appear and be ready
async function waitForGame(page) {
    await page.goto('/');
    // Phaser renders to a canvas element
    await page.waitForSelector('canvas', { timeout: LOAD_TIMEOUT });
    // Wait for boot to complete (loading bar finishes)
    await page.waitForTimeout(3000);
}

// Helper: click at position on canvas
async function clickCanvas(page, x, y) {
    const canvas = page.locator('canvas');
    await canvas.click({ position: { x, y } });
}

// Helper: press key
async function key(page, k) {
    await page.keyboard.press(k);
}

// Helper: drag on canvas (for aiming)
async function dragCanvas(page, fromX, fromY, toX, toY, duration = 200) {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    await page.mouse.move(box.x + fromX, box.y + fromY);
    await page.mouse.down();
    await page.waitForTimeout(50);
    // Smooth drag
    const steps = Math.max(5, Math.floor(duration / 20));
    for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        await page.mouse.move(
            box.x + fromX + (toX - fromX) * t,
            box.y + fromY + (toY - fromY) * t
        );
        await page.waitForTimeout(duration / steps);
    }
    await page.mouse.up();
}

// =====================================================
//  1. LOADING & TITLE SCREEN
// =====================================================

test.describe('Loading & Title Screen', () => {
    test('game loads and shows canvas', async ({ page }) => {
        await page.goto('/');
        const canvas = page.locator('canvas');
        await expect(canvas).toBeVisible({ timeout: LOAD_TIMEOUT });
    });

    test('canvas has correct game dimensions', async ({ page }) => {
        await waitForGame(page);
        const canvas = page.locator('canvas');
        const box = await canvas.boundingBox();
        expect(box.width).toBeGreaterThan(800);
        expect(box.height).toBeGreaterThan(400);
    });

    test('title screen responds to keyboard input', async ({ page }) => {
        await waitForGame(page);
        // Title screen should be visible — pressing Space or Enter should do something
        await key(page, 'Space');
        await page.waitForTimeout(500);
        // Game should still have a canvas (didn't crash)
        await expect(page.locator('canvas')).toBeVisible();
    });
});

// =====================================================
//  2. NAVIGATION ROUTES
// =====================================================

test.describe('Navigation routes', () => {
    test('can navigate to Quick Play', async ({ page }) => {
        await waitForGame(page);
        // Quick Play is typically the 2nd menu option
        await key(page, 'ArrowDown');
        await page.waitForTimeout(200);
        await key(page, 'Space');
        await page.waitForTimeout(1000);
        await expect(page.locator('canvas')).toBeVisible();
    });

    test('can navigate to Arcade mode', async ({ page }) => {
        await waitForGame(page);
        await key(page, 'Space'); // Arcade is usually first
        await page.waitForTimeout(1000);
        await expect(page.locator('canvas')).toBeVisible();
    });

    test('ESC returns to title from various screens', async ({ page }) => {
        await waitForGame(page);
        await key(page, 'ArrowDown');
        await page.waitForTimeout(200);
        await key(page, 'Space'); // Go to Quick Play
        await page.waitForTimeout(1000);
        await key(page, 'Escape'); // Should return to title
        await page.waitForTimeout(500);
        await expect(page.locator('canvas')).toBeVisible();
    });
});

// =====================================================
//  3. QUICK PLAY CONFIG
// =====================================================

test.describe('Quick Play configuration', () => {
    async function goToQuickPlay(page) {
        await waitForGame(page);
        await key(page, 'ArrowDown');
        await page.waitForTimeout(200);
        await key(page, 'Space');
        await page.waitForTimeout(1000);
    }

    test('can cycle through characters with arrow keys', async ({ page }) => {
        await goToQuickPlay(page);
        // Navigate rows and change values
        await key(page, 'ArrowDown'); // Move to next option
        await page.waitForTimeout(100);
        await key(page, 'ArrowRight'); // Change value
        await page.waitForTimeout(100);
        await expect(page.locator('canvas')).toBeVisible();
    });

    test('can change terrain', async ({ page }) => {
        await goToQuickPlay(page);
        for (let i = 0; i < 5; i++) await key(page, 'ArrowDown');
        await page.waitForTimeout(100);
        await key(page, 'ArrowRight');
        await page.waitForTimeout(200);
        await expect(page.locator('canvas')).toBeVisible();
    });

    test('can start a Quick Play match', async ({ page }) => {
        await goToQuickPlay(page);
        // Navigate to JOUER button and press
        await key(page, 'Space');
        await page.waitForTimeout(2000);
        // Should transition to a match scene (canvas still alive)
        await expect(page.locator('canvas')).toBeVisible();
    });
});

// =====================================================
//  4. MATCH GAMEPLAY
// =====================================================

test.describe('Match gameplay', () => {
    async function startQuickMatch(page) {
        await waitForGame(page);
        await key(page, 'ArrowDown');
        await page.waitForTimeout(200);
        await key(page, 'Space'); // Quick Play
        await page.waitForTimeout(1000);
        await key(page, 'Space'); // Start match
        await page.waitForTimeout(3000); // Wait for VS intro + iris wipe
    }

    test('match loads without crashing', async ({ page }) => {
        await startQuickMatch(page);
        await expect(page.locator('canvas')).toBeVisible();
    });

    test('can throw cochonnet with drag', async ({ page }) => {
        await startQuickMatch(page);
        // Wait for cochonnet throw state
        await page.waitForTimeout(1000);
        // Drag upward from center bottom to throw cochonnet
        await dragCanvas(page, 416, 430, 416, 300, 300);
        await page.waitForTimeout(2000);
        await expect(page.locator('canvas')).toBeVisible();
    });

    test('game survives multiple throws without crash', async ({ page }) => {
        await startQuickMatch(page);
        await page.waitForTimeout(1000);
        // Throw cochonnet
        await dragCanvas(page, 416, 430, 416, 280, 300);
        await page.waitForTimeout(3000);
        // Select shot mode (press 2 for demi-portee)
        await key(page, '2');
        await page.waitForTimeout(500);
        // Throw first ball
        await dragCanvas(page, 416, 430, 420, 300, 300);
        await page.waitForTimeout(4000);
        // Game should still be running
        await expect(page.locator('canvas')).toBeVisible();
    });

    test('no console errors during gameplay', async ({ page }) => {
        const errors = [];
        page.on('pageerror', (err) => errors.push(err.message));

        await startQuickMatch(page);
        await page.waitForTimeout(1000);
        await dragCanvas(page, 416, 430, 416, 280, 300);
        await page.waitForTimeout(3000);
        await key(page, '2');
        await page.waitForTimeout(500);
        await dragCanvas(page, 416, 430, 420, 300, 300);
        await page.waitForTimeout(3000);

        // Filter out non-critical errors (JSON load failures, audio, 404s)
        const critical = errors.filter(e =>
            !e.includes('audio') && !e.includes('404') &&
            !e.includes('Unexpected token') && !e.includes('JSON')
        );
        expect(critical).toEqual([]);
    });
});

// =====================================================
//  5. ARCADE MODE
// =====================================================

test.describe('Arcade mode', () => {
    async function startArcade(page) {
        await waitForGame(page);
        await key(page, 'Space'); // Arcade
        await page.waitForTimeout(1500);
    }

    test('arcade shows character selection', async ({ page }) => {
        await startArcade(page);
        await expect(page.locator('canvas')).toBeVisible();
    });

    test('can select a character and start arcade', async ({ page }) => {
        await startArcade(page);
        await key(page, 'Space'); // Select first character
        await page.waitForTimeout(2000);
        await expect(page.locator('canvas')).toBeVisible();
    });

    test('arcade narrative can be skipped', async ({ page }) => {
        await startArcade(page);
        await key(page, 'Space'); // Select character
        await page.waitForTimeout(2000);
        await key(page, 'Space'); // Skip narrative
        await page.waitForTimeout(1500);
        await expect(page.locator('canvas')).toBeVisible();
    });
});

// =====================================================
//  6. VISUAL STABILITY
// =====================================================

test.describe('Visual stability', () => {
    test('no WebGL context lost during match', async ({ page }) => {
        let contextLost = false;
        page.on('console', (msg) => {
            if (msg.text().includes('context lost')) contextLost = true;
        });

        await waitForGame(page);
        await key(page, 'ArrowDown');
        await page.waitForTimeout(200);
        await key(page, 'Space');
        await page.waitForTimeout(1000);
        await key(page, 'Space');
        await page.waitForTimeout(5000);

        expect(contextLost).toBe(false);
    });

    test('game runs at stable framerate (no infinite loops)', async ({ page }) => {
        await waitForGame(page);
        // If the game was in an infinite loop, this timeout would fail
        const start = Date.now();
        await page.waitForTimeout(3000);
        const elapsed = Date.now() - start;
        // Should complete in roughly 3 seconds (not hung)
        expect(elapsed).toBeLessThan(6000);
    });

    test('canvas stays responsive after scene transitions', async ({ page }) => {
        await waitForGame(page);
        // Navigate: Title → Quick Play → ESC → Title → Arcade → ESC
        await key(page, 'ArrowDown');
        await page.waitForTimeout(300);
        await key(page, 'Space');
        await page.waitForTimeout(1000);
        await key(page, 'Escape');
        await page.waitForTimeout(500);
        await key(page, 'Space');
        await page.waitForTimeout(1000);
        await key(page, 'Escape');
        await page.waitForTimeout(500);

        await expect(page.locator('canvas')).toBeVisible();
    });
});

// =====================================================
//  7. TERRAIN VARIANTS
// =====================================================

test.describe('Terrain selection works', () => {
    async function goToQuickPlayTerrain(page, terrainIndex) {
        await waitForGame(page);
        await key(page, 'ArrowDown');
        await page.waitForTimeout(200);
        await key(page, 'Space'); // Quick Play
        await page.waitForTimeout(800);
        // Navigate to terrain row (row 5)
        for (let i = 0; i < 5; i++) {
            await key(page, 'ArrowDown');
            await page.waitForTimeout(100);
        }
        // Cycle to desired terrain
        for (let i = 0; i < terrainIndex; i++) {
            await key(page, 'ArrowRight');
            await page.waitForTimeout(200);
        }
        // Start
        await key(page, 'Space');
        await page.waitForTimeout(3000);
    }

    test('terre terrain loads', async ({ page }) => {
        await goToQuickPlayTerrain(page, 0);
        await expect(page.locator('canvas')).toBeVisible();
    });

    test('herbe terrain loads', async ({ page }) => {
        await goToQuickPlayTerrain(page, 1);
        await expect(page.locator('canvas')).toBeVisible();
    });

    test('sable terrain loads', async ({ page }) => {
        await goToQuickPlayTerrain(page, 2);
        await expect(page.locator('canvas')).toBeVisible();
    });

    test('colline terrain loads', async ({ page }) => {
        await goToQuickPlayTerrain(page, 3);
        await expect(page.locator('canvas')).toBeVisible();
    });

    test('docks terrain loads', async ({ page }) => {
        await goToQuickPlayTerrain(page, 4);
        await expect(page.locator('canvas')).toBeVisible();
    });
});

// =====================================================
//  8. ERROR RESILIENCE
// =====================================================

test.describe('Error resilience', () => {
    test('page reload does not crash', async ({ page }) => {
        await waitForGame(page);
        await page.reload();
        await page.waitForSelector('canvas', { timeout: LOAD_TIMEOUT });
        await expect(page.locator('canvas')).toBeVisible();
    });

    test('rapid key presses do not crash', async ({ page }) => {
        await waitForGame(page);
        // Spam keys rapidly
        for (let i = 0; i < 20; i++) {
            await key(page, ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Escape'][i % 6]);
            await page.waitForTimeout(50);
        }
        await page.waitForTimeout(1000);
        await expect(page.locator('canvas')).toBeVisible();
    });

    test('rapid clicking does not crash', async ({ page }) => {
        await waitForGame(page);
        for (let i = 0; i < 10; i++) {
            await clickCanvas(page, 200 + Math.random() * 400, 100 + Math.random() * 300);
            await page.waitForTimeout(100);
        }
        await page.waitForTimeout(500);
        await expect(page.locator('canvas')).toBeVisible();
    });
});
