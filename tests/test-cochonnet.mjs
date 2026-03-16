import { chromium } from 'playwright';

const browser = await chromium.launch({
    headless: false,
    args: ['--use-gl=angle', '--use-angle=swiftshader']
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

const allLogs = [];
const errors = [];
page.on('console', msg => {
    allLogs.push(`[${msg.type()}] ${msg.text()}`);
    if (msg.type() === 'error') errors.push(msg.text());
});
page.on('pageerror', err => {
    console.log(`🔴 PAGE ERROR: ${err.message}`);
    errors.push(`PAGEERROR: ${err.message}`);
});

async function getScale() {
    return page.evaluate(() => {
        const c = document.querySelector('canvas');
        const r = c.getBoundingClientRect();
        return { sx: r.width / 832, sy: r.height / 480, ox: r.x, oy: r.y };
    });
}

async function throwAtGame(gx, gy, dx, dy) {
    const { sx, sy, ox, oy } = await getScale();
    const vpX = ox + gx * sx, vpY = oy + gy * sy;
    await page.mouse.move(vpX, vpY);
    await page.mouse.down();
    await page.mouse.move(vpX + dx * sx, vpY + dy * sy, { steps: 10 });
    await page.waitForTimeout(30);
    await page.mouse.up();
}

function gs() {
    return page.evaluate(() => {
        const game = window.__PHASER_GAME__;
        if (!game) return null;
        for (const s of game.scene.scenes) {
            if (s.scene.key === 'PetanqueScene' && s.engine) {
                return {
                    state: s.engine.state,
                    cochonnet: s.engine.cochonnet ? { x: Math.round(s.engine.cochonnet.x), y: Math.round(s.engine.cochonnet.y) } : null,
                    aimingEnabled: s.engine.aimingEnabled,
                    currentTeam: s.engine.currentTeam
                };
            }
        }
        const active = game.scene.scenes.filter(s => s.scene.isActive()).map(s => s.scene.key);
        return { activeScenes: active };
    });
}

console.log('1. Loading...');
await page.goto('http://localhost:8080', { waitUntil: 'networkidle' });
await page.waitForTimeout(4000);

// Navigate through the real flow: TitleScene → click → OverworldScene → walk to NPC
// OR directly start PetanqueScene
console.log('2. Starting PetanqueScene...');
await page.evaluate(() => {
    const game = window.__PHASER_GAME__;
    game.registry.set('currentSlot', 'test');
    game.registry.set('gameState', {
        player: { name: 'Joueur', map: 'test', x: 14, y: 20, facing: 'down' },
        bouleType: null, badges: [], flags: {}, partners: [], scoreTotal: 0, playtime: 0
    });
    game.scene.scenes.filter(s => s.scene.isActive()).forEach(s => game.scene.stop(s.scene.key));
    game.scene.start('PetanqueScene', {
        opponentName: 'Marcel', difficulty: 'easy', terrain: 'terre', format: 'tete_a_tete'
    });
});
await page.waitForTimeout(3000);
let state = await gs();
console.log(`   ${JSON.stringify(state)}`);

// Test 1: Throw cochonnet SHORT (20% power)
console.log('\n3. Cochonnet SHORT...');
await throwAtGame(416, 400, 0, 30); // Small drag = short throw
await page.waitForTimeout(3000);
state = await gs();
console.log(`   ${JSON.stringify(state)}`);
await page.screenshot({ path: 'screenshots/coch_short.png' });

if (state?.state !== 'FIRST_BALL') {
    console.log('   ❌ Short cochonnet failed! Trying again with more power...');
    await throwAtGame(416, 400, 0, 50);
    await page.waitForTimeout(3000);
    state = await gs();
    console.log(`   Retry: ${JSON.stringify(state)}`);
}

// Check if we went back to a menu (bug)
if (state?.activeScenes) {
    console.log(`   ❌ BUG: Scene changed to ${JSON.stringify(state.activeScenes)}`);
}

// Test 2: Play a full mene to see if cochonnet works through the whole flow
if (state?.state === 'FIRST_BALL') {
    console.log('\n4. First ball (roulette)...');
    // Select roulette
    await page.evaluate(() => {
        const game = window.__PHASER_GAME__;
        for (const s of game.scene.scenes) {
            if (s.scene.key === 'PetanqueScene' && s.aimingSystem?._combinedBtns) {
                s.aimingSystem._selectCombined(0);
            }
        }
    });
    await page.waitForTimeout(300);
    await throwAtGame(416, 400, 0, 60);
    await page.waitForTimeout(4000);
    state = await gs();
    console.log(`   ${JSON.stringify(state)}`);
    await page.screenshot({ path: 'screenshots/coch_ball1.png' });
}

console.log('\n--- ERRORS ---');
if (errors.length === 0) console.log('No errors!');
else errors.forEach(e => console.log(`  🔴 ${e}`));

// Show recent console logs
console.log('\n--- RECENT LOGS ---');
allLogs.slice(-10).forEach(l => console.log(`  ${l}`));

await browser.close();
console.log('\nDone.');
