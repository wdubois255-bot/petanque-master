import { chromium } from 'playwright';

const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader']
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

const errors = [];
page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
    if (msg.type() === 'log') console.log(`  [game] ${msg.text()}`);
});
page.on('pageerror', err => errors.push(err.message));

console.log('=== SPRINT 3 TEST ===\n');

// 1. BOOT → TITLE
console.log('1. Opening game → TitleScene...');
await page.goto('http://localhost:8080', { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
await page.screenshot({ path: 'screenshots/s3_01_title.png' });

// 2. TITLE → Select "Nouvelle Partie" (first option, press Space)
console.log('2. Selecting "Nouvelle Partie"...');
await page.keyboard.press('Space');
await page.waitForTimeout(2000); // Wait for fadeOut 300ms + IntroScene create + fadeIn 300ms
await page.screenshot({ path: 'screenshots/s3_02_new_game.png' });

// 3. Wait for IntroScene to be active
console.log('3. Waiting for IntroScene...');
for (let attempt = 0; attempt < 20; attempt++) {
    const active = await page.evaluate(() => {
        const game = window.__PHASER_GAME__;
        return game?.scene?.scenes?.find(s => s.scene.isActive())?.scene?.key;
    });
    if (active === 'IntroScene') {
        console.log(`   IntroScene active after ${(attempt + 1) * 500}ms`);
        break;
    }
    await page.waitForTimeout(500);
}
await page.waitForTimeout(500);
await page.screenshot({ path: 'screenshots/s3_03_intro_start.png' });

// Advance dialogue: each line needs 2 presses (skip typewriter + advance)
// Press Space aggressively: wait for typewriter to show some text, then skip+advance
console.log('   Advancing 14 dialogue lines...');
for (let i = 0; i < 14; i++) {
    // Wait for typewriter to start
    await page.waitForTimeout(200);
    // Skip typewriter
    await page.keyboard.press('Space');
    await page.waitForTimeout(150);
    // Advance to next line
    await page.keyboard.press('Space');
    await page.waitForTimeout(150);
}
await page.waitForTimeout(500);

// 4. Wait for choose phase (keep pressing if needed)
console.log('4. Reaching boule choice phase...');
for (let attempt = 0; attempt < 15; attempt++) {
    const phase = await page.evaluate(() => {
        const game = window.__PHASER_GAME__;
        const intro = game?.scene?.scenes?.find(s => s.scene.key === 'IntroScene');
        return intro?._phase || 'unknown';
    });
    if (phase === 'choose' || phase === 'confirm') {
        console.log(`   Phase: ${phase}`);
        break;
    }
    await page.keyboard.press('Space');
    await page.waitForTimeout(200);
    await page.keyboard.press('Space');
    await page.waitForTimeout(200);
}
await page.screenshot({ path: 'screenshots/s3_05_boule_choice.png' });

// Select Acier (already selected by default), press Space to confirm
console.log('5. Confirming boule choice...');
await page.keyboard.press('Space');
await page.waitForTimeout(600);
// Confirm the "Tu choisis..." dialogue
await page.keyboard.press('Space');
await page.waitForTimeout(500);
await page.screenshot({ path: 'screenshots/s3_06_confirm.png' });

// Wait for OverworldScene to be active
console.log('6. Waiting for OverworldScene...');
for (let attempt = 0; attempt < 20; attempt++) {
    const active = await page.evaluate(() => {
        const game = window.__PHASER_GAME__;
        return game?.scene?.scenes?.find(s => s.scene.isActive())?.scene?.key;
    });
    if (active === 'OverworldScene') {
        console.log(`   OverworldScene active after ${(attempt + 1) * 500}ms`);
        break;
    }
    await page.waitForTimeout(500);
}
await page.waitForTimeout(500);
await page.screenshot({ path: 'screenshots/s3_07_overworld.png' });

const activeScene2 = await page.evaluate(() => {
    const game = window.__PHASER_GAME__;
    return game?.scene?.scenes?.find(s => s.scene.isActive())?.scene?.key;
});
console.log(`   Active scene: ${activeScene2}`);

if (activeScene2 === 'OverworldScene') {
    console.log('   OverworldScene loaded!');

    // Move around village
    console.log('7. Moving player in village...');
    for (let i = 0; i < 3; i++) {
        await page.keyboard.press('ArrowDown');
        await page.waitForTimeout(250);
    }
    for (let i = 0; i < 3; i++) {
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(250);
    }
    await page.screenshot({ path: 'screenshots/s3_07_village_move.png' });

    // Walk toward south exit to test Route 1 transition
    console.log('8. Walking to south exit (Route 1)...');
    for (let i = 0; i < 10; i++) {
        await page.keyboard.press('ArrowDown');
        await page.waitForTimeout(250);
    }
    await page.screenshot({ path: 'screenshots/s3_08_toward_exit.png' });

    // Walk to exit tile (y=29)
    for (let i = 0; i < 5; i++) {
        await page.keyboard.press('ArrowLeft');
        await page.waitForTimeout(250);
    }
    for (let i = 0; i < 6; i++) {
        await page.keyboard.press('ArrowDown');
        await page.waitForTimeout(250);
    }
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/s3_09_route1_or_exit.png' });

    // Check if we transitioned
    const activeScene3 = await page.evaluate(() => {
        const game = window.__PHASER_GAME__;
        const scene = game?.scene?.scenes?.find(s => s.scene.isActive());
        const ow = scene?.scene?.key === 'OverworldScene' ? scene : null;
        return {
            activeKey: scene?.scene?.key,
            mapName: ow?.mapManager?.currentMapName || 'unknown'
        };
    });
    console.log(`9. After walking south: scene=${activeScene3.activeKey}, map=${activeScene3.mapName}`);

    if (activeScene3.mapName === 'route_1') {
        console.log('   Route 1 loaded! Testing movement...');
        for (let i = 0; i < 5; i++) {
            await page.keyboard.press('ArrowDown');
            await page.waitForTimeout(250);
        }
        await page.screenshot({ path: 'screenshots/s3_10_route1.png' });
    }
}

// Check game state
const gameState = await page.evaluate(() => {
    const game = window.__PHASER_GAME__;
    return game?.registry?.get('gameState') || null;
});
console.log('\n10. Game state:', JSON.stringify(gameState, null, 2));

// Check save data
const saveData = await page.evaluate(() => {
    return localStorage.getItem('petanque_master_slot_0');
});
console.log(`\n11. Save data exists: ${saveData !== null}`);
if (saveData) {
    const parsed = JSON.parse(saveData);
    console.log(`    Boule type: ${parsed.bouleType}, Badges: ${parsed.badges.length}, Flags: ${Object.keys(parsed.flags).length}`);
}

// Final scenes state
const finalState = await page.evaluate(() => {
    const game = window.__PHASER_GAME__;
    return game?.scene?.scenes?.map(s => ({
        key: s.scene.key,
        active: s.scene.isActive(),
        visible: s.scene.isVisible()
    }));
});
console.log('\n12. Final scenes:', JSON.stringify(finalState, null, 2));

console.log('\n--- ERRORS ---');
if (errors.length === 0) console.log('No errors!');
else errors.forEach(e => console.log(`  ERROR: ${e}`));

await browser.close();
console.log('\nDone.');
