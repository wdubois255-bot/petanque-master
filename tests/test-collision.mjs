import { chromium } from 'playwright';

const browser = await chromium.launch({
    headless: false,
    args: ['--use-gl=angle', '--use-angle=swiftshader']
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

const errors = [];
page.on('pageerror', err => { console.log(`🔴 ${err.message}`); errors.push(err.message); });

function gs() {
    return page.evaluate(() => {
        const game = window.__PHASER_GAME__;
        if (!game) return null;
        for (const s of game.scene.scenes) {
            if (s.scene.key === 'PetanqueScene' && s.engine) {
                const e = s.engine;
                return {
                    state: e.state, currentTeam: e.currentTeam,
                    remaining: e.remaining, ballCount: e.balls.length,
                    balls: e.balls.map(b => ({
                        team: b.team, alive: b.isAlive, moving: b.isMoving,
                        x: Math.round(b.x), y: Math.round(b.y),
                        vx: Math.round(b.vx * 100) / 100, vy: Math.round(b.vy * 100) / 100
                    })),
                    cochonnet: e.cochonnet ? { x: Math.round(e.cochonnet.x), y: Math.round(e.cochonnet.y) } : null
                };
            }
        }
        return null;
    });
}

async function waitStopped(timeout = 15000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
        const state = await gs();
        if (state && !state.balls.some(b => b.moving) && state.state !== 'WAITING_STOP') return state;
        await page.waitForTimeout(300);
    }
    return gs();
}

console.log('=== TEST COLLISIONS POINTAGE ===\n');

console.log('1. Loading...');
await page.goto('http://localhost:8080', { waitUntil: 'networkidle' });
await page.waitForTimeout(4000);

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
        opponentName: 'Test', difficulty: 'easy', terrain: 'terre', format: 'tete_a_tete'
    });
});
await page.waitForTimeout(3000);

// Throw cochonnet
console.log('3. Cochonnet...');
await page.evaluate(() => {
    const game = window.__PHASER_GAME__;
    for (const s of game.scene.scenes) {
        if (s.scene.key === 'PetanqueScene' && s.engine) {
            s.engine.throwCochonnet(-Math.PI / 2, 0.5);
        }
    }
});
await page.waitForTimeout(3000);
let state = await gs();
console.log(`   Cochonnet at: (${state?.cochonnet?.x}, ${state?.cochonnet?.y})`);

// Ball 1: player throws DIRECTLY at cochonnet
console.log('\n4. Ball 1: DIRECT at cochonnet (demi-portee)...');
await page.evaluate(() => {
    const game = window.__PHASER_GAME__;
    for (const s of game.scene.scenes) {
        if (s.scene.key === 'PetanqueScene' && s.engine) {
            if (s.aimingSystem?._combinedBtns) s.aimingSystem._selectCombined(1);
            const e = s.engine;
            const cx = s.throwCircleX, cy = s.throwCircleY;
            const coch = e.cochonnet;
            const angle = Math.atan2(coch.y - cy, coch.x - cx);
            const dist = Math.sqrt((coch.x - cx) ** 2 + (coch.y - cy) ** 2);
            // Aim to overshoot slightly so ball rolls THROUGH cochonnet position
            const maxDist = 420 * 0.85;
            const power = Math.min((dist * 1.1) / maxDist, 0.9);
            console.log(`Throwing at angle=${angle.toFixed(2)}, power=${power.toFixed(2)}, dist=${dist.toFixed(0)}`);
            e.throwBall(angle, power, 'player', 'pointer', null);
        }
    }
});
await page.waitForTimeout(5000);
state = await gs();
console.log('   Balls after:');
state?.balls?.forEach((b, i) => console.log(`     [${i}] ${b.team}: (${b.x},${b.y}) v=(${b.vx},${b.vy})`));
console.log(`   Cochonnet: (${state?.cochonnet?.x}, ${state?.cochonnet?.y})`);
await page.screenshot({ path: 'screenshots/collision_1.png' });

// Wait for AI
console.log('   Waiting AI...');
await page.waitForTimeout(6000);
state = await gs();

// Ball 2: throw DIRECTLY at opponent's ball
console.log('\n5. Ball 2: DIRECT at opponent ball (roulette)...');
const opBall = state?.balls?.find(b => b.team === 'opponent' && b.alive);
if (opBall && state?.remaining?.player > 0) {
    const beforeX = opBall.x, beforeY = opBall.y;
    console.log(`   Target opponent at (${opBall.x}, ${opBall.y})`);

    await page.evaluate(({ tx, ty }) => {
        const game = window.__PHASER_GAME__;
        for (const s of game.scene.scenes) {
            if (s.scene.key === 'PetanqueScene' && s.engine) {
                if (s.aimingSystem?._combinedBtns) s.aimingSystem._selectCombined(0); // roulette
                const e = s.engine;
                const cx = s.throwCircleX, cy = s.throwCircleY;
                const angle = Math.atan2(ty - cy, tx - cx);
                const dist = Math.sqrt((tx - cx) ** 2 + (ty - cy) ** 2);
                // Overshoot to ensure ball reaches target with velocity
                const maxDist = 420 * 0.85;
                const power = Math.min((dist * 1.3) / maxDist, 0.95);
                console.log(`Roulette at opponent: angle=${angle.toFixed(2)}, power=${power.toFixed(2)}`);
                e.throwBall(angle, power, 'player', 'pointer', null);
            }
        }
    }, { tx: opBall.x, ty: opBall.y });

    await page.waitForTimeout(5000);
    state = await gs();
    console.log('   Balls after:');
    state?.balls?.forEach((b, i) => console.log(`     [${i}] ${b.team}: (${b.x},${b.y}) v=(${b.vx},${b.vy})`));

    // Check if opponent moved
    const opAfter = state?.balls?.find(b => b.team === 'opponent' && b.alive);
    if (opAfter) {
        const moved = Math.sqrt((opAfter.x - beforeX) ** 2 + (opAfter.y - beforeY) ** 2);
        console.log(moved > 3
            ? `   ✅ COLLISION! Opponent moved ${Math.round(moved)}px`
            : `   ❌ NO COLLISION: opponent stayed at same position (moved ${moved.toFixed(1)}px)`);
    }
    await page.screenshot({ path: 'screenshots/collision_2.png' });
} else {
    console.log('   No opponent ball or no remaining balls');
}

// Ball 3: TIR at opponent
console.log('\n6. Ball 3: TIR at opponent...');
await page.waitForTimeout(6000); // wait AI
state = await gs();
const opBall2 = state?.balls?.find(b => b.team === 'opponent' && b.alive);
if (opBall2 && state?.remaining?.player > 0) {
    const beforeX = opBall2.x, beforeY = opBall2.y;
    console.log(`   Target: (${opBall2.x}, ${opBall2.y})`);

    await page.evaluate(({ tx, ty }) => {
        const game = window.__PHASER_GAME__;
        for (const s of game.scene.scenes) {
            if (s.scene.key === 'PetanqueScene' && s.engine) {
                if (s.aimingSystem?._combinedBtns) s.aimingSystem._selectCombined(3); // tir
                const e = s.engine;
                const cx = s.throwCircleX, cy = s.throwCircleY;
                const angle = Math.atan2(ty - cy, tx - cx);
                const dist = Math.sqrt((tx - cx) ** 2 + (ty - cy) ** 2);
                const maxDist = 420 * 0.95;
                const power = Math.min(dist / maxDist, 0.95);
                e.throwBall(angle, power, 'player', 'tirer', null);
            }
        }
    }, { tx: opBall2.x, ty: opBall2.y });

    await page.waitForTimeout(6000);
    state = await gs();
    console.log('   Balls after tir:');
    state?.balls?.forEach((b, i) => console.log(`     [${i}] ${b.team}: (${b.x},${b.y}) alive=${b.alive}`));

    const opAfter = state?.balls?.filter(b => b.team === 'opponent' && b.alive);
    for (const ob of opAfter) {
        const d = Math.sqrt((ob.x - beforeX) ** 2 + (ob.y - beforeY) ** 2);
        if (d > 5) console.log(`   ✅ TIR COLLISION! Displaced ${Math.round(d)}px`);
    }
    await page.screenshot({ path: 'screenshots/collision_3.png' });
}

console.log('\n--- ERRORS ---');
if (errors.length === 0) console.log('No errors!');
else errors.forEach(e => console.log(`  ${e}`));

await browser.close();
console.log('\n✅ Done.');
