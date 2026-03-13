import { chromium } from 'playwright';

const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader']
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

const errors = [];
page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
    // Log all console messages for debugging
    if (msg.type() === 'log') console.log(`  [game] ${msg.text()}`);
});
page.on('pageerror', err => errors.push(err.message));

console.log('1. Opening game...');
await page.goto('http://localhost:8080', { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
await page.screenshot({ path: 'screenshots/ow_01_boot.png' });

// Click to start
console.log('2. Clicking to start...');
await page.click('canvas', { position: { x: 640, y: 360 } });
await page.waitForTimeout(2000);
await page.screenshot({ path: 'screenshots/ow_02_overworld.png' });

// Move player around with keyboard
console.log('3. Moving player...');

// Walk up a few tiles
for (let i = 0; i < 5; i++) {
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(250);
}
await page.screenshot({ path: 'screenshots/ow_03_moved_up.png' });

// Walk right
for (let i = 0; i < 4; i++) {
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(250);
}
await page.screenshot({ path: 'screenshots/ow_04_moved_right.png' });

// Walk down toward NPC area
for (let i = 0; i < 8; i++) {
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(250);
}
await page.screenshot({ path: 'screenshots/ow_05_near_npcs.png' });

// Walk left toward Vieux Maitre (around tile 14,10)
for (let i = 0; i < 6; i++) {
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(250);
}
// Walk up to be near him
for (let i = 0; i < 7; i++) {
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(250);
}
await page.screenshot({ path: 'screenshots/ow_06_near_maitre.png' });

// Try interacting (Space key)
console.log('4. Interacting with NPC...');
await page.keyboard.press('ArrowUp'); // Face up toward maitre
await page.waitForTimeout(300);
await page.keyboard.press('Space');
await page.waitForTimeout(1000);
await page.screenshot({ path: 'screenshots/ow_07_dialogue.png' });

// Advance dialogue
for (let i = 0; i < 5; i++) {
    await page.keyboard.press('Space');
    await page.waitForTimeout(800);
}
await page.screenshot({ path: 'screenshots/ow_08_after_dialogue.png' });

// Walk toward trainer (Thierry at 20, 20)
console.log('5. Walking toward trainer...');
for (let i = 0; i < 8; i++) {
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(250);
}
for (let i = 0; i < 8; i++) {
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(250);
}
await page.waitForTimeout(2000); // Wait for potential encounter
await page.screenshot({ path: 'screenshots/ow_09_trainer_area.png' });

// Check for any battle scene
await page.waitForTimeout(3000);
await page.screenshot({ path: 'screenshots/ow_10_battle_or_dialogue.png' });

// Advance any dialogues
for (let i = 0; i < 5; i++) {
    await page.keyboard.press('Space');
    await page.waitForTimeout(500);
}
await page.waitForTimeout(2000);
await page.screenshot({ path: 'screenshots/ow_11_final.png' });

// Check game state
const state = await page.evaluate(() => {
    const game = window.__PHASER_GAME__;
    if (!game) return { error: 'no game' };
    const scenes = game.scene.scenes.map(s => ({
        key: s.scene.key,
        active: s.scene.isActive(),
        visible: s.scene.isVisible()
    }));
    return { scenes };
});
console.log('\nGame scenes:', JSON.stringify(state, null, 2));

console.log('\n--- ERRORS ---');
if (errors.length === 0) console.log('No errors!');
else errors.forEach(e => console.log(`  ERROR: ${e}`));

await browser.close();
console.log('\nDone.');
