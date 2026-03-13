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

console.log('=== TRANSITION TEST ===\n');

console.log('1. Opening game...');
await page.goto('http://localhost:8080', { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);

// Skip title + intro by injecting game state and starting OverworldScene directly
console.log('2. Setting up game state and starting near south exit...');
await page.evaluate(() => {
    const game = window.__PHASER_GAME__;
    const gs = {
        player: { name: 'Joueur', map: 'village_depart', x: 14, y: 27, facing: 'down' },
        bouleType: 'acier',
        badges: [],
        flags: { intro_done: true },
        partners: [],
        scoreTotal: 0,
        playtime: 0
    };
    game.registry.set('gameState', gs);
    game.registry.set('currentSlot', 0);
    // Bypass title/intro
    game.scene.stop('TitleScene');
    game.scene.start('OverworldScene', { map: 'village_depart', spawnX: 14, spawnY: 27 });
});
await page.waitForTimeout(2000);
await page.screenshot({ path: 'screenshots/tr_01_near_exit.png' });

// Click canvas to ensure focus and wait for scene to be fully ready
await page.click('canvas', { position: { x: 640, y: 360 } });
await page.waitForTimeout(1000);

// Debug: check player state
const playerState = await page.evaluate(() => {
    const game = window.__PHASER_GAME__;
    const ow = game?.scene?.scenes?.find(s => s.scene.key === 'OverworldScene');
    return {
        active: ow?.scene?.isActive(),
        transitioning: ow?._transitioning,
        playerMoving: ow?.player?.isMoving,
        playerTile: ow?.player ? { x: ow.player.tileX, y: ow.player.tileY } : null,
        dialogVisible: ow?.dialogBox?.isVisible
    };
});
console.log(`   Player state: ${JSON.stringify(playerState)}`);

// Debug collisions at y=28 and y=29
const collDebug = await page.evaluate(() => {
    const game = window.__PHASER_GAME__;
    const ow = game?.scene?.scenes?.find(s => s.scene.key === 'OverworldScene');
    const mm = ow?.mapManager;
    return {
        walkable28: mm?.isWalkable(14, 28),
        walkable29: mm?.isWalkable(14, 29),
        coll28: mm?.currentMap?.collisions?.[28]?.[14],
        coll29: mm?.currentMap?.collisions?.[29]?.[14],
        mapH: mm?.currentMap?.height,
        npcAt28: ow?.npcManager?.isNpcAt(14, 28),
        npcAt29: ow?.npcManager?.isNpcAt(14, 29)
    };
});
console.log(`   Collisions debug: ${JSON.stringify(collDebug)}`);

// Walk south by holding ArrowDown for enough time
console.log('3. Walking south to exit (holding ArrowDown)...');
await page.keyboard.down('ArrowDown');
await page.waitForTimeout(3000); // Hold for 3 seconds to walk several tiles
await page.keyboard.up('ArrowDown');
await page.waitForTimeout(500);

const posAfterWalk = await page.evaluate(() => {
    const game = window.__PHASER_GAME__;
    const ow = game?.scene?.scenes?.find(s => s.scene.key === 'OverworldScene');
    return {
        y: ow?.player?.tileY,
        transitioning: ow?._transitioning,
        map: ow?.mapManager?.currentMapName
    };
});
console.log(`   After walk: ${JSON.stringify(posAfterWalk)}`);
await page.waitForTimeout(3000); // Wait for map transition (fadeOut + restart)
await page.screenshot({ path: 'screenshots/tr_02_after_exit.png' });

// Check current map
const mapInfo1 = await page.evaluate(() => {
    const game = window.__PHASER_GAME__;
    const ow = game?.scene?.scenes?.find(s => s.scene.key === 'OverworldScene');
    return {
        active: ow?.scene?.isActive(),
        map: ow?.mapManager?.currentMapName,
        playerTile: ow?.player ? { x: ow.player.tileX, y: ow.player.tileY } : null
    };
});
console.log(`   Map after exit: ${JSON.stringify(mapInfo1)}`);

if (mapInfo1.map === 'route_1') {
    console.log('4. Route 1 loaded! Exploring...');

    // Walk south through route
    for (let i = 0; i < 20; i++) {
        await page.keyboard.press('ArrowDown');
        await page.waitForTimeout(250);
    }
    await page.screenshot({ path: 'screenshots/tr_03_route1_south.png' });

    // Check for NPC encounters
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/tr_04_route1_encounter.png' });

    // Advance any dialogue
    for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Space');
        await page.waitForTimeout(300);
    }
    await page.waitForTimeout(1000);

    // Continue south to village_arene_1
    console.log('5. Walking to Village Arene 1...');
    for (let i = 0; i < 40; i++) {
        await page.keyboard.press('ArrowDown');
        await page.waitForTimeout(200);
    }

    // Handle any dialogues/encounters
    for (let i = 0; i < 8; i++) {
        await page.keyboard.press('Space');
        await page.waitForTimeout(200);
    }
    for (let i = 0; i < 20; i++) {
        await page.keyboard.press('ArrowDown');
        await page.waitForTimeout(200);
    }

    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/tr_05_toward_arene.png' });

    const mapInfo2 = await page.evaluate(() => {
        const game = window.__PHASER_GAME__;
        const ow = game?.scene?.scenes?.find(s => s.scene.key === 'OverworldScene');
        return {
            map: ow?.mapManager?.currentMapName,
            playerTile: ow?.player ? { x: ow.player.tileX, y: ow.player.tileY } : null
        };
    });
    console.log(`   Current map: ${JSON.stringify(mapInfo2)}`);
}

// Final state
const finalState = await page.evaluate(() => {
    const game = window.__PHASER_GAME__;
    return game?.registry?.get('gameState');
});
console.log('\nFinal game state:', JSON.stringify(finalState, null, 2));

console.log('\n--- ERRORS ---');
if (errors.length === 0) console.log('No errors!');
else errors.forEach(e => console.log(`  ERROR: ${e}`));

await browser.close();
console.log('\nDone.');
