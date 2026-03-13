import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

const errors = [];
page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
});
page.on('pageerror', err => errors.push(err.message));

console.log('1. Opening game...');
await page.goto('http://localhost:8080', { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
await page.screenshot({ path: 'screenshots/01_boot.png' });

// Click to start
console.log('2. Clicking to start...');
await page.click('canvas', { position: { x: 640, y: 360 } });
await page.waitForTimeout(1500);
await page.screenshot({ path: 'screenshots/02_terrain.png' });

// Helper: drag to throw (slingshot: drag DOWN to throw UP)
async function throwBall(name, startX, startY, dragX, dragY, waitMs = 3000) {
    console.log(`   Throwing: ${name}`);
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + dragX, startY + dragY, { steps: 8 });
    await page.waitForTimeout(50);
    await page.mouse.up();
    await page.waitForTimeout(waitMs);
}

// Throw cochonnet (drag down = throw up, medium power)
console.log('3. Throwing cochonnet...');
await throwBall('cochonnet', 640, 500, 0, 80);
await page.screenshot({ path: 'screenshots/03_cochonnet.png' });

// Throw first ball (player)
console.log('4. First ball (player)...');
await throwBall('player ball 1', 640, 500, 0, 75);
await page.screenshot({ path: 'screenshots/04_ball1.png' });

// Wait for AI
console.log('5. Waiting AI...');
await page.waitForTimeout(4000);
await page.screenshot({ path: 'screenshots/05_ai1.png' });

// Continue game: throw remaining balls with slight variations
for (let i = 2; i <= 3; i++) {
    console.log(`6.${i}. Ball ${i} (player)...`);
    await throwBall(`player ball ${i}`, 640, 500, (i - 2) * 15 - 10, 70 + i * 5);
    await page.screenshot({ path: `screenshots/06_ball${i}.png` });

    // Wait for AI
    console.log(`   Waiting AI...`);
    await page.waitForTimeout(4000);
    await page.screenshot({ path: `screenshots/06_ai${i}.png` });
}

// Wait for scoring
console.log('7. Waiting for score...');
await page.waitForTimeout(5000);
await page.screenshot({ path: 'screenshots/07_score.png' });

// New mene - throw cochonnet again if game continues
console.log('8. New mene...');
await page.waitForTimeout(2000);
await throwBall('cochonnet mene 2', 640, 500, 5, 85);
await page.screenshot({ path: 'screenshots/08_mene2.png' });

// Play a few more balls
for (let i = 1; i <= 3; i++) {
    await throwBall(`mene2 ball ${i}`, 640, 500, (i - 2) * 10, 65 + i * 8);
    await page.waitForTimeout(4000);
}
await page.screenshot({ path: 'screenshots/09_mene2_progress.png' });

// Wait for everything to resolve
await page.waitForTimeout(6000);
await page.screenshot({ path: 'screenshots/10_final.png' });

// Get game state from console
const gameState = await page.evaluate(() => {
    const scene = window.__PHASER_GAME__?.scene?.scenes?.[1];
    if (scene?.engine) {
        return {
            scores: scene.engine.scores,
            mene: scene.engine.mene,
            state: scene.engine.state,
            ballsAlive: scene.engine.balls.filter(b => b.isAlive).length
        };
    }
    return null;
});
console.log('\nGame state:', gameState);

console.log('\n--- ERRORS ---');
if (errors.length === 0) console.log('No errors!');
else errors.forEach(e => console.log(`  ${e}`));

await browser.close();
console.log('\nDone.');
