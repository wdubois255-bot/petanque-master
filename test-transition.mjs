import { chromium } from 'playwright';

const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader']
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

const errors = [];
page.on('console', msg => {
    if (msg.type() === 'log') console.log(`  [game] ${msg.text()}`);
});
page.on('pageerror', err => errors.push(err.message));

async function getMapState() {
    return page.evaluate(() => {
        const ow = window.__PHASER_GAME__?.scene?.scenes?.find(s => s.scene.key === 'OverworldScene');
        return {
            active: ow?.scene?.isActive(),
            map: ow?.mapManager?.currentMapName,
            x: ow?.player?.tileX,
            y: ow?.player?.tileY
        };
    });
}

console.log('=== TRANSITION TEST ===\n');

// 1. Boot and inject state near village south exit
console.log('1. Opening game...');
await page.goto('http://localhost:8080', { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);

console.log('2. Injecting state at village south (14, 27)...');
await page.evaluate(() => {
    const game = window.__PHASER_GAME__;
    game.registry.set('gameState', {
        player: { name: 'Joueur', map: 'village_depart', x: 14, y: 27, facing: 'down' },
        bouleType: 'acier', badges: [], flags: { intro_done: true },
        partners: [], scoreTotal: 0, playtime: 0
    });
    game.registry.set('currentSlot', 0);
    game.scene.stop('TitleScene');
    game.scene.start('OverworldScene', { map: 'village_depart', spawnX: 14, spawnY: 27 });
});
await page.waitForTimeout(2000);

let state = await getMapState();
console.log(`   Start: ${JSON.stringify(state)}`);

// 3. Walk south to exit (y=29, x=14)
console.log('3. Walking south to exit...');
await page.keyboard.down('ArrowDown');
await page.waitForTimeout(3000);
await page.keyboard.up('ArrowDown');
await page.waitForTimeout(3000);

state = await getMapState();
console.log(`   After walk: ${JSON.stringify(state)}`);
await page.screenshot({ path: 'screenshots/tr_01_after_exit.png' });

const transitionOk = state.map === 'route_1';
console.log(`   Transition village → route_1: ${transitionOk ? 'OK' : 'FAIL'}`);

if (transitionOk) {
    // 4. Walk south through route_1
    console.log('4. Walking south through Route 1...');
    await page.keyboard.down('ArrowDown');
    await page.waitForTimeout(8000);
    await page.keyboard.up('ArrowDown');
    await page.waitForTimeout(3000);

    state = await getMapState();
    console.log(`   Position: ${JSON.stringify(state)}`);
    await page.screenshot({ path: 'screenshots/tr_02_route1.png' });

    // 5. Continue south to village_arene_1
    if (state.map === 'route_1') {
        console.log('5. Continuing to village_arene_1...');
        await page.keyboard.down('ArrowDown');
        await page.waitForTimeout(8000);
        await page.keyboard.up('ArrowDown');
        await page.waitForTimeout(3000);

        state = await getMapState();
        console.log(`   Position: ${JSON.stringify(state)}`);
        await page.screenshot({ path: 'screenshots/tr_03_arene.png' });

        if (state.map === 'village_arene_1') {
            console.log('   Village Arene 1 reached!');
        }
    }
}

// 6. Test return: inject at route_1 north exit
console.log('\n6. Testing return transition route_1 → village...');
await page.evaluate(() => {
    const game = window.__PHASER_GAME__;
    game.registry.set('gameState', {
        player: { name: 'Joueur', map: 'route_1', x: 9, y: 2, facing: 'up' },
        bouleType: 'acier', badges: [], flags: { intro_done: true },
        partners: [], scoreTotal: 0, playtime: 0
    });
    const ow = game.scene.scenes.find(s => s.scene.key === 'OverworldScene');
    if (ow?.scene?.isActive()) ow.scene.restart({ map: 'route_1', spawnX: 9, spawnY: 2 });
    else game.scene.start('OverworldScene', { map: 'route_1', spawnX: 9, spawnY: 2 });
});
await page.waitForTimeout(2000);

await page.keyboard.down('ArrowUp');
await page.waitForTimeout(2000);
await page.keyboard.up('ArrowUp');
await page.waitForTimeout(3000);

state = await getMapState();
console.log(`   After walk north: ${JSON.stringify(state)}`);
const returnOk = state.map === 'village_depart';
console.log(`   Return route_1 → village: ${returnOk ? 'OK' : 'FAIL'}`);

// Summary
console.log('\n--- ERRORS ---');
if (errors.length === 0) console.log('No errors!');
else errors.forEach(e => console.log(`  ERROR: ${e}`));

console.log('\n--- RESULT ---');
console.log(transitionOk && errors.length === 0 ? 'PASS' : 'FAIL');

await browser.close();
console.log('Done.');
