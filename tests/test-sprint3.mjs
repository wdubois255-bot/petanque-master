import { chromium } from 'playwright';

const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader']
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

const errors = [];
page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
});
page.on('pageerror', err => errors.push(err.message));

// Reliable key press for Phaser's JustDown detection
async function press(key, delay = 150) {
    await page.keyboard.down(key);
    await page.waitForTimeout(50);
    await page.keyboard.up(key);
    await page.waitForTimeout(delay);
}

async function waitForScene(name, maxWait = 15000) {
    const start = Date.now();
    while (Date.now() - start < maxWait) {
        const scene = await page.evaluate(() =>
            window.__PHASER_GAME__?.scene?.scenes?.find(s => s.scene.isActive())?.scene?.key
        );
        if (scene === name) return true;
        await page.waitForTimeout(300);
    }
    return false;
}

console.log('=== SPRINT 3 TEST ===\n');

// 1. BOOT → TITLE
console.log('1. Boot → TitleScene...');
await page.goto('http://localhost:8080', { waitUntil: 'networkidle' });
const titleOk = await waitForScene('TitleScene');
console.log(`   TitleScene: ${titleOk ? 'OK' : 'FAIL'}`);
await page.waitForTimeout(500);
await page.screenshot({ path: 'screenshots/s3_01_title.png' });

// 2. TITLE → INTRO
console.log('2. Nouvelle Partie → IntroScene...');
await press('Space', 200);
const introOk = await waitForScene('IntroScene');
console.log(`   IntroScene: ${introOk ? 'OK' : 'FAIL'}`);
await page.waitForTimeout(500);
await page.screenshot({ path: 'screenshots/s3_02_intro.png' });

// 3. Advance 14 dialogue lines
console.log('3. Advancing Papet dialogue...');
for (let i = 0; i < 16; i++) {
    await press('Space', 250);
    const phase = await page.evaluate(() =>
        window.__PHASER_GAME__?.scene?.scenes?.find(s => s.scene.key === 'IntroScene')?._phase
    );
    if (phase === 'choose') {
        console.log(`   Choose phase reached at press ${i + 1}`);
        break;
    }
}
await page.screenshot({ path: 'screenshots/s3_03_choose.png' });

// 4. Confirm boule choice (Acier by default)
console.log('4. Confirming Acier boules...');
await press('Space', 400); // choose → confirm
const confirmPhase = await page.evaluate(() =>
    window.__PHASER_GAME__?.scene?.scenes?.find(s => s.scene.key === 'IntroScene')?._phase
);
console.log(`   Phase: ${confirmPhase}`);
await press('Space', 500); // confirm → start OverworldScene
await page.screenshot({ path: 'screenshots/s3_04_confirm.png' });

// 5. Wait for OverworldScene
console.log('5. Waiting for OverworldScene...');
const owOk = await waitForScene('OverworldScene');
console.log(`   OverworldScene: ${owOk ? 'OK' : 'FAIL'}`);
await page.waitForTimeout(1000);
await page.screenshot({ path: 'screenshots/s3_05_village.png' });

if (owOk) {
    // Check game state
    const gs = await page.evaluate(() => window.__PHASER_GAME__?.registry?.get('gameState'));
    console.log(`   BouleType: ${gs?.bouleType}`);
    console.log(`   Flags: ${JSON.stringify(gs?.flags)}`);

    // 6. Walk south to Route 1 (from spawn at x=14, y=20)
    console.log('6. Walking south to Route 1...');
    await page.keyboard.down('ArrowDown');
    await page.waitForTimeout(5000);
    await page.keyboard.up('ArrowDown');
    await page.waitForTimeout(3000);

    const mapState = await page.evaluate(() => {
        const ow = window.__PHASER_GAME__?.scene?.scenes?.find(s => s.scene.key === 'OverworldScene');
        return { map: ow?.mapManager?.currentMapName, x: ow?.player?.tileX, y: ow?.player?.tileY };
    });
    console.log(`   Map: ${mapState.map} (${mapState.x}, ${mapState.y})`);
    await page.screenshot({ path: 'screenshots/s3_06_route1.png' });

    if (mapState.map === 'route_1') {
        console.log('   Route 1 loaded!');
    }
}

// Check save data
const saveData = await page.evaluate(() => localStorage.getItem('petanque_master_slot_0'));
console.log(`\n7. Save data exists: ${saveData !== null}`);
if (saveData) {
    const parsed = JSON.parse(saveData);
    console.log(`   Boule: ${parsed.bouleType}, Badges: ${parsed.badges.length}, Flags: ${Object.keys(parsed.flags).join(', ')}`);
}

console.log('\n--- ERRORS ---');
if (errors.length === 0) console.log('No errors!');
else errors.forEach(e => console.log(`  ERROR: ${e}`));

console.log('\n--- RESULT ---');
const allOk = errors.length === 0 && saveData !== null;
console.log(allOk ? 'PASS' : 'FAIL');

await browser.close();
console.log('Done.');
