import { chromium } from 'playwright';

const browser = await chromium.launch({
    headless: false,
    args: ['--use-gl=angle', '--use-angle=swiftshader']
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

const errors = [];
const logs = [];
page.on('console', msg => { logs.push(msg.text()); if (msg.type() === 'error') errors.push(msg.text()); });
page.on('pageerror', err => errors.push(err.message));

async function screenshot(name) {
    await page.screenshot({ path: `screenshots/tech_${name}.png` });
    console.log(`  📸 ${name}`);
}

// Get petanque scene engine state
function gs() {
    return page.evaluate(() => {
        const game = window.__PHASER_GAME__;
        if (!game) return null;
        for (const s of game.scene.scenes) {
            if (s.scene.key === 'PetanqueScene' && s.engine) {
                const e = s.engine;
                return {
                    state: e.state, currentTeam: e.currentTeam,
                    aimingEnabled: e.aimingEnabled, remaining: e.remaining,
                    scores: e.scores, mene: e.mene, ballCount: e.balls.length,
                    balls: e.balls.map(b => ({
                        team: b.team, alive: b.isAlive, moving: b.isMoving,
                        x: Math.round(b.x), y: Math.round(b.y),
                        vx: Math.round(b.vx * 100) / 100, vy: Math.round(b.vy * 100) / 100
                    })),
                    cochonnet: e.cochonnet ? {
                        x: Math.round(e.cochonnet.x), y: Math.round(e.cochonnet.y),
                        alive: e.cochonnet.isAlive, moving: e.cochonnet.isMoving
                    } : null,
                    hasButtons: !!(s.aimingSystem?._combinedBtns?.length > 0),
                    shotMode: s.aimingSystem?.shotMode
                };
            }
        }
        return null;
    });
}

async function waitState(fn, timeout = 15000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
        const state = await gs();
        if (state && fn(state)) return state;
        await page.waitForTimeout(300);
    }
    return gs();
}

// Inject a throw directly via engine (bypasses UI for reliable testing)
async function injectThrow(team, angle, power, shotMode, loftPresetName) {
    return page.evaluate(({ team, angle, power, shotMode, loftPresetName }) => {
        const game = window.__PHASER_GAME__;
        for (const s of game.scene.scenes) {
            if (s.scene.key === 'PetanqueScene' && s.engine) {
                // Import loft preset
                let loft = null;
                if (loftPresetName === 'tir') {
                    loft = s.aimingSystem ? null : null; // Will use default tir
                }
                // Call throwBall
                s.engine.throwBall(angle, power, team, shotMode, loft);
                return true;
            }
        }
        return false;
    }, { team, angle, power, shotMode, loftPresetName });
}

// Throw cochonnet via UI drag
async function throwCochonnetViaUI() {
    const scale = await page.evaluate(() => {
        const c = document.querySelector('canvas');
        const r = c.getBoundingClientRect();
        return { sx: r.width / 832, sy: r.height / 480, ox: r.x, oy: r.y };
    });
    // Throw circle is at game (416, 430). Drag down to throw up (slingshot).
    const sx = scale.sx, sy = scale.sy, ox = scale.ox, oy = scale.oy;
    const startVpX = ox + 416 * sx;
    const startVpY = oy + 430 * sy;
    await page.mouse.move(startVpX, startVpY);
    await page.mouse.down();
    // Drag down by 80px game = throw up
    await page.mouse.move(startVpX, startVpY + 80 * sy, { steps: 10 });
    await page.waitForTimeout(30);
    await page.mouse.up();
}

// ========== START ==========
console.log('\n=== TEST COMPLET TECHNIQUES + CARREAU ===\n');

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
        opponentName: 'Marcel', difficulty: 'easy', terrain: 'terre', format: 'tete_a_tete'
    });
});

let state = await waitState(s => s.state === 'COCHONNET_THROW', 10000);
console.log(`   State: ${state?.state}`);
await screenshot('01_ready');

// 3. Throw cochonnet via UI
console.log('\n3. Throwing cochonnet via UI...');
await throwCochonnetViaUI();
await page.waitForTimeout(3000);
state = await gs();
console.log(`   State: ${state?.state}, Cochonnet: (${state?.cochonnet?.x},${state?.cochonnet?.y})`);

if (!state?.cochonnet || state?.state === 'COCHONNET_THROW') {
    console.log('   Retrying with cochonnet inject...');
    // Inject cochonnet throw directly
    await page.evaluate(() => {
        const game = window.__PHASER_GAME__;
        for (const s of game.scene.scenes) {
            if (s.scene.key === 'PetanqueScene' && s.engine) {
                // Manually throw cochonnet upward with medium power
                s.engine.throwCochonnet(-Math.PI / 2, 0.5);
                break;
            }
        }
    });
    await page.waitForTimeout(3000);
    state = await gs();
    console.log(`   After inject: State=${state?.state}, Cochonnet=(${state?.cochonnet?.x},${state?.cochonnet?.y})`);
}
await screenshot('02_cochonnet');

// 4. Test all techniques by injecting throws
// Wait for FIRST_BALL state
state = await waitState(s => s.state === 'FIRST_BALL' || s.hasButtons, 8000);
console.log(`\n4. State: ${state?.state}, hasButtons: ${state?.hasButtons}`);

// ===== ROULETTE (player ball 1) =====
console.log('\n=== ROULETTE ===');
if (state?.hasButtons) {
    await page.evaluate(() => {
        const game = window.__PHASER_GAME__;
        for (const s of game.scene.scenes) {
            if (s.scene.key === 'PetanqueScene' && s.aimingSystem?._combinedBtns) {
                s.aimingSystem._selectCombined(0); // ROULETTE
                break;
            }
        }
    });
    await page.waitForTimeout(300);
}
// Throw toward cochonnet (angle upward, medium power)
await page.evaluate(() => {
    const game = window.__PHASER_GAME__;
    for (const s of game.scene.scenes) {
        if (s.scene.key === 'PetanqueScene' && s.engine) {
            const e = s.engine;
            const coch = e.cochonnet;
            const cx = s.throwCircleX, cy = s.throwCircleY;
            const angle = Math.atan2(coch.y - cy, coch.x - cx);
            e.throwBall(angle, 0.5, 'player', 'pointer', null);
            break;
        }
    }
});
await page.waitForTimeout(4000);
state = await gs();
const rouletteBall = state?.balls?.find(b => b.team === 'player');
console.log(`   Ball: (${rouletteBall?.x},${rouletteBall?.y}) Cochonnet: (${state?.cochonnet?.x},${state?.cochonnet?.y})`);
await screenshot('03_roulette');

// Wait for AI turn to complete
console.log('   Waiting for AI...');
state = await waitState(s => s.currentTeam === 'player' && (s.hasButtons || s.state === 'SCORE_MENE'), 15000);
console.log(`   After AI: state=${state?.state}, team=${state?.currentTeam}, balls=${state?.ballCount}`);
await screenshot('04_after_ai1');

// ===== DEMI-PORTEE (player ball 2) =====
console.log('\n=== DEMI-PORTEE ===');
if (state?.hasButtons && state?.remaining?.player > 0) {
    await page.evaluate(() => {
        const game = window.__PHASER_GAME__;
        for (const s of game.scene.scenes) {
            if (s.scene.key === 'PetanqueScene' && s.aimingSystem?._combinedBtns) {
                s.aimingSystem._selectCombined(1); // DEMI-PORTEE
            }
            if (s.scene.key === 'PetanqueScene' && s.engine) {
                const e = s.engine;
                const coch = e.cochonnet;
                const cx = s.throwCircleX, cy = s.throwCircleY;
                const angle = Math.atan2(coch.y - cy, coch.x - cx) + 0.05; // slight offset
                e.throwBall(angle, 0.55, 'player', 'pointer', null);
            }
        }
    });
    await page.waitForTimeout(4000);
    state = await gs();
    console.log(`   Balls: ${state?.balls?.filter(b => b.team === 'player').length}`);
    await screenshot('05_demi');

    // Wait AI
    state = await waitState(s => s.currentTeam === 'player' && (s.hasButtons || s.state === 'SCORE_MENE'), 15000);
    console.log(`   After AI: state=${state?.state}`);
    await screenshot('06_after_ai2');
}

// ===== TIR (player ball 3) — aim at opponent ball =====
console.log('\n=== TIR ===');
if (state?.hasButtons && state?.remaining?.player > 0) {
    const opBall = state?.balls?.find(b => b.team === 'opponent' && b.alive);
    if (opBall) {
        console.log(`   🎯 Target opponent at (${opBall.x}, ${opBall.y})`);
        const beforePos = { x: opBall.x, y: opBall.y };

        await page.evaluate(({ tx, ty }) => {
            const game = window.__PHASER_GAME__;
            for (const s of game.scene.scenes) {
                if (s.scene.key === 'PetanqueScene') {
                    if (s.aimingSystem?._combinedBtns) {
                        s.aimingSystem._selectCombined(3); // TIRER
                    }
                    const e = s.engine;
                    const cx = s.throwCircleX, cy = s.throwCircleY;
                    const angle = Math.atan2(ty - cy, tx - cx);
                    // Calculate correct power to land ON target
                    const dist = Math.sqrt((tx - cx) ** 2 + (ty - cy) ** 2);
                    const maxDist = 420 * 0.95; // TERRAIN_HEIGHT * tir multiplier
                    const power = Math.min(dist / maxDist, 0.95);
                    console.log(`TIR: dist=${dist.toFixed(0)}, power=${power.toFixed(2)}`);
                    e.throwBall(angle, power, 'player', 'tirer', null);
                    break;
                }
            }
        }, { tx: opBall.x, ty: opBall.y });

        await page.waitForTimeout(6000);
        await screenshot('07_tir');
        state = await gs();

        console.log('   Balls after tir:');
        state?.balls?.forEach((b, i) => {
            console.log(`     [${i}] ${b.team}: alive=${b.alive} (${b.x},${b.y}) v=(${b.vx},${b.vy})`);
        });

        // Check displacement
        const opAfter = state?.balls?.filter(b => b.team === 'opponent' && b.alive);
        let displaced = false;
        for (const ob of opAfter || []) {
            const d = Math.sqrt((ob.x - beforePos.x) ** 2 + (ob.y - beforePos.y) ** 2);
            if (d > 10) {
                console.log(`   ✅ COLLISION! Opponent displaced by ${Math.round(d)}px`);
                displaced = true;
            }
        }
        if (!displaced) {
            // Check if the targeted ball was killed (out of bounds)
            const opAlive = state?.balls?.filter(b => b.team === 'opponent' && b.alive).length;
            const opTotal = state?.balls?.filter(b => b.team === 'opponent').length;
            if (opAlive < opTotal) {
                console.log(`   ✅ Opponent ball knocked out of bounds!`);
                displaced = true;
            }
        }
        if (!displaced) {
            console.log(`   ❌ Opponent ball NOT displaced - tir collision may be broken`);
        }

        // Check carreau
        const carreauFound = logs.some(l => l.toLowerCase().includes('carreau'));
        console.log(`   Carreau: ${carreauFound ? '🎉 YES!' : 'No (may need exact aim)'}`);
    } else {
        console.log('   No opponent ball to target');
    }
} else {
    console.log(`   Cannot tir: buttons=${state?.hasButtons}, remaining=${JSON.stringify(state?.remaining)}`);
}

// Final
console.log('\n=== FINAL STATE ===');
await page.waitForTimeout(3000);
await screenshot('08_final');
state = await gs();
console.log(`State: ${state?.state}`);
console.log(`Scores: ${JSON.stringify(state?.scores)}`);
console.log(`Remaining: ${JSON.stringify(state?.remaining)}`);
console.log(`Cochonnet: ${JSON.stringify(state?.cochonnet)}`);
console.log(`All balls:`);
state?.balls?.forEach((b, i) => console.log(`  [${i}] ${b.team}: alive=${b.alive} (${b.x},${b.y})`));

const realErrors = errors.filter(e => !e.includes('Framebuffer') && !e.includes('404'));
console.log(`\nErrors: ${realErrors.length === 0 ? 'None ✅' : realErrors.length}`);
realErrors.forEach(e => console.log(`  ❗ ${e}`));

await browser.close();
console.log('\n✅ Done.');
