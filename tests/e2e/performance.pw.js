/**
 * Petanque Master - Performance & Memory Tests
 *
 * Monitors FPS, JS heap, DOM node count, and detects memory leaks.
 * Uses Chrome DevTools Protocol (CDP) for real metrics.
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

// ═══════════════════════════════════════════════════════════
//  CDP METRICS HELPERS
// ═══════════════════════════════════════════════════════════

async function getCDPMetrics(page) {
    const client = await page.context().newCDPSession(page);
    await client.send('Performance.enable');
    const { metrics } = await client.send('Performance.getMetrics');
    const result = {};
    for (const m of metrics) {
        result[m.name] = m.value;
    }
    return result;
}

async function getHeapUsage(page) {
    const client = await page.context().newCDPSession(page);
    await client.send('HeapProfiler.collectGarbage');
    await page.waitForTimeout(200);
    const metrics = await getCDPMetrics(page);
    return {
        usedMB: metrics.JSHeapUsedSize / (1024 * 1024),
        totalMB: metrics.JSHeapTotalSize / (1024 * 1024),
        nodes: metrics.Nodes,
    };
}

async function measureFPS(page, durationMs = 5000) {
    return page.evaluate((duration) => {
        return new Promise(resolve => {
            const samples = [];
            let lastTime = performance.now();
            let elapsed = 0;

            function frame(now) {
                const delta = now - lastTime;
                lastTime = now;
                elapsed += delta;
                if (delta > 0) samples.push(1000 / delta);
                if (elapsed < duration) {
                    requestAnimationFrame(frame);
                } else {
                    const sorted = samples.slice().sort((a, b) => a - b);
                    resolve({
                        avg: samples.reduce((a, b) => a + b, 0) / samples.length,
                        min: sorted[0],
                        max: sorted[sorted.length - 1],
                        p5: sorted[Math.floor(sorted.length * 0.05)],
                        p95: sorted[Math.floor(sorted.length * 0.95)],
                        samples: samples.length,
                    });
                }
            }
            requestAnimationFrame(frame);
        });
    }, durationMs);
}

// ═══════════════════════════════════════════════════════════
//  FPS TESTS
// ═══════════════════════════════════════════════════════════

test.describe('Performance - FPS', () => {

    // Note: SwiftShader (software GPU used in CI) runs at ~25-50 FPS.
    // Real hardware targets 60 FPS. Thresholds are set for SwiftShader.
    // To test real FPS, run with --headed (no swiftshader).

    test('title screen maintains 20+ FPS average', async ({ page }) => {
        await waitForGame(page);
        const fps = await measureFPS(page, 3000);
        console.log(`Title FPS: avg=${fps.avg.toFixed(1)} min=${fps.min.toFixed(1)} p5=${fps.p5.toFixed(1)}`);
        expect(fps.avg).toBeGreaterThan(20);
        expect(fps.p5).toBeGreaterThan(10); // 5th percentile > 10
    });

    test('character select maintains 20+ FPS', async ({ page }) => {
        await waitForGame(page);
        await key(page, 'Space');
        await page.waitForTimeout(800);
        await key(page, 'Space');
        await page.waitForTimeout(2000);
        const fps = await measureFPS(page, 3000);
        console.log(`CharSelect FPS: avg=${fps.avg.toFixed(1)} min=${fps.min.toFixed(1)} p5=${fps.p5.toFixed(1)}`);
        expect(fps.avg).toBeGreaterThan(20);
    });

    test('gameplay maintains 20+ FPS during idle', async ({ page }) => {
        test.setTimeout(45000);
        await waitForGame(page);
        await key(page, 'Space');
        await page.waitForTimeout(800);
        await key(page, 'ArrowDown');
        await page.waitForTimeout(200);
        await key(page, 'Space'); // Quick Play
        await page.waitForTimeout(1000);
        await key(page, 'Space'); // Start
        await page.waitForTimeout(5000);
        const fps = await measureFPS(page, 5000);
        console.log(`Gameplay FPS: avg=${fps.avg.toFixed(1)} min=${fps.min.toFixed(1)} p5=${fps.p5.toFixed(1)}`);
        expect(fps.avg).toBeGreaterThan(20);
    });

    test('FPS recovers after throw animation', async ({ page }) => {
        test.setTimeout(60000);
        await waitForGame(page);
        await key(page, 'Space');
        await page.waitForTimeout(800);
        await key(page, 'ArrowDown');
        await page.waitForTimeout(200);
        await key(page, 'Space');
        await page.waitForTimeout(1000);
        await key(page, 'Space');
        await page.waitForTimeout(5000);

        // Throw cochonnet
        await dragCanvas(page, 416, 430, 416, 280);
        await page.waitForTimeout(3000);

        // Measure FPS after throw settles
        const fps = await measureFPS(page, 3000);
        console.log(`Post-throw FPS: avg=${fps.avg.toFixed(1)} min=${fps.min.toFixed(1)}`);
        expect(fps.avg).toBeGreaterThan(20);
    });
});

// ═══════════════════════════════════════════════════════════
//  MEMORY TESTS
// ═══════════════════════════════════════════════════════════

test.describe('Performance - Memory', () => {

    test('initial heap < 80MB', async ({ page }) => {
        await waitForGame(page);
        const heap = await getHeapUsage(page);
        console.log(`Initial heap: ${heap.usedMB.toFixed(1)}MB / ${heap.totalMB.toFixed(1)}MB, nodes: ${heap.nodes}`);
        expect(heap.usedMB).toBeLessThan(80);
    });

    test('heap after scene transitions < 120MB', async ({ page }) => {
        await waitForGame(page);
        // Navigate through multiple scenes
        await key(page, 'Space'); // Menu
        await page.waitForTimeout(800);
        await key(page, 'Space'); // Arcade
        await page.waitForTimeout(2000);
        await key(page, 'Escape'); // Back
        await page.waitForTimeout(800);
        await key(page, 'ArrowDown');
        await page.waitForTimeout(200);
        await key(page, 'Space'); // Quick Play
        await page.waitForTimeout(1500);
        await key(page, 'Escape'); // Back
        await page.waitForTimeout(800);

        const heap = await getHeapUsage(page);
        console.log(`After transitions: ${heap.usedMB.toFixed(1)}MB, nodes: ${heap.nodes}`);
        expect(heap.usedMB).toBeLessThan(120);
    });

    test('no significant memory leak on repeated scene transitions', async ({ page }) => {
        test.setTimeout(60000);
        await waitForGame(page);

        // Baseline
        const baseline = await getHeapUsage(page);

        // Cycle through scenes 5 times
        for (let i = 0; i < 5; i++) {
            await key(page, 'Space'); // Menu / advance
            await page.waitForTimeout(600);
            await key(page, 'Space'); // Arcade / char select
            await page.waitForTimeout(1500);
            await key(page, 'Escape'); // Back to title
            await page.waitForTimeout(800);
        }

        const after = await getHeapUsage(page);
        const growth = after.usedMB - baseline.usedMB;
        console.log(`Memory growth after 5 cycles: ${growth.toFixed(1)}MB (${baseline.usedMB.toFixed(1)} → ${after.usedMB.toFixed(1)})`);

        // Allow max 20MB growth for 5 cycles (4MB/cycle budget)
        expect(growth).toBeLessThan(20);
    });

    test('DOM node count stays reasonable', async ({ page }) => {
        test.setTimeout(45000);
        await waitForGame(page);

        const initial = await getHeapUsage(page);

        // Navigate to gameplay
        await key(page, 'Space');
        await page.waitForTimeout(800);
        await key(page, 'ArrowDown');
        await page.waitForTimeout(200);
        await key(page, 'Space');
        await page.waitForTimeout(1000);
        await key(page, 'Space');
        await page.waitForTimeout(5000);

        const gameplay = await getHeapUsage(page);
        console.log(`DOM nodes: initial=${initial.nodes}, gameplay=${gameplay.nodes}`);

        // Phaser should not create excessive DOM nodes
        expect(gameplay.nodes).toBeLessThan(500);
    });
});

// ═══════════════════════════════════════════════════════════
//  ASSET LOADING PERFORMANCE
// ═══════════════════════════════════════════════════════════

test.describe('Performance - Asset Loading', () => {

    test('game boots within 8 seconds', async ({ page }) => {
        const start = Date.now();
        await page.goto('/');
        await page.waitForSelector('canvas', { timeout: 15000 });

        // Wait for title screen to be interactive
        await page.waitForTimeout(500);
        const loadTime = Date.now() - start;
        console.log(`Boot time: ${loadTime}ms`);
        expect(loadTime).toBeLessThan(8000);
    });

    test('no failed asset requests (404s)', async ({ page }) => {
        const failedRequests = [];
        page.on('response', response => {
            if (response.status() >= 400 && response.url().match(/\.(png|jpg|json|mp3|ogg|wav)$/i)) {
                failedRequests.push({ url: response.url(), status: response.status() });
            }
        });

        await waitForGame(page);
        // Navigate to trigger more asset loads
        await key(page, 'Space');
        await page.waitForTimeout(800);
        await key(page, 'Space');
        await page.waitForTimeout(2000);

        if (failedRequests.length > 0) {
            console.log('Failed asset requests:', failedRequests);
        }
        expect(failedRequests).toHaveLength(0);
    });

    test('total page weight < 15MB', async ({ page }) => {
        let totalBytes = 0;
        page.on('response', async response => {
            try {
                const body = await response.body();
                totalBytes += body.length;
            } catch { /* streaming/redirect */ }
        });

        await waitForGame(page);
        await page.waitForTimeout(2000);

        const totalMB = totalBytes / (1024 * 1024);
        console.log(`Total page weight: ${totalMB.toFixed(2)}MB`);
        expect(totalMB).toBeLessThan(15);
    });
});
