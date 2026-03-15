import { chromium } from 'playwright';

const URL = 'http://localhost:8080';
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function run() {
    console.log('=== TIR & CARREAU TEST ===\n');
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 832, height: 480 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));

    await page.goto(URL, { waitUntil: 'networkidle' });
    await sleep(2000);
    await page.click('canvas');
    await sleep(500);

    // Start petanque scene
    await page.evaluate(() => {
        window.__PHASER_GAME__.scene.start('PetanqueScene', {
            terrain: 'terre', difficulty: 'easy',
            format: 'tete_a_tete', opponentName: 'Test'
        });
    });
    await sleep(2500);

    const UP = -Math.PI / 2;

    // Helper: throw via engine
    async function throwViaEngine(angle, power, loftId) {
        return page.evaluate(({ angle, power, loftId }) => {
            const scene = window.__PHASER_GAME__.scene.getScene('PetanqueScene');
            const e = scene.engine;
            const presets = {
                roulette: { id: 'roulette', label: 'ROULETTE', landingFactor: 0.15, arcHeight: -6, flyDurationMult: 0.5, rollEfficiency: 0.7 },
                demi_portee: { id: 'demi_portee', label: 'DEMI-PORTEE', landingFactor: 0.50, arcHeight: -40, flyDurationMult: 0.9, rollEfficiency: 0.6 },
                plombee: { id: 'plombee', label: 'PLOMBEE', landingFactor: 0.90, arcHeight: -80, flyDurationMult: 1.4, rollEfficiency: 0.15 },
                tir: { id: 'tir', label: 'TIR', landingFactor: 0.60, arcHeight: -30, flyDurationMult: 0.4, rollEfficiency: 2.5 }
            };
            if (e.state === 'COCHONNET_THROW') {
                e.throwCochonnet(angle, power);
            } else {
                const loft = presets[loftId] || presets.demi_portee;
                e.throwBall(angle, power, 'player', loftId === 'tir' ? 'tirer' : 'pointer', loft);
            }
        }, { angle, power, loftId });
    }

    async function waitForStop(maxMs = 10000) {
        const start = Date.now();
        while (Date.now() - start < maxMs) {
            const moving = await page.evaluate(() => {
                const scene = window.__PHASER_GAME__.scene.getScene('PetanqueScene');
                const e = scene.engine;
                return e.balls.some(b => b.isMoving) || (e.cochonnet && e.cochonnet.isMoving);
            });
            if (!moving) return;
            await sleep(200);
        }
    }

    async function waitForPlayerTurn(maxMs = 15000) {
        const start = Date.now();
        while (Date.now() - start < maxMs) {
            const s = await page.evaluate(() => {
                const scene = window.__PHASER_GAME__.scene.getScene('PetanqueScene');
                const e = scene.engine;
                return { state: e.state, team: e.currentTeam, remainP: e.remaining.player };
            });
            if (s.team === 'player' && s.remainP > 0 && (s.state === 'PLAY_LOOP' || s.state === 'FIRST_BALL')) return s;
            if (s.state === 'SCORE_MENE' || s.state === 'GAME_OVER') return s;
            await sleep(300);
        }
        return null;
    }

    // === SETUP: place balls in known positions ===
    console.log('1. Throwing cochonnet...');
    await throwViaEngine(UP, 0.5);
    await sleep(2500);
    await waitForStop();

    const cochoPos = await page.evaluate(() => {
        const e = window.__PHASER_GAME__.scene.getScene('PetanqueScene').engine;
        return { x: Math.round(e.cochonnet.x), y: Math.round(e.cochonnet.y) };
    });
    console.log('   Cochonnet at:', cochoPos);

    // Player ball 1 - demi-portee near cochonnet
    console.log('\n2. Player ball 1 (demi-portee)...');
    await throwViaEngine(UP, 0.45, 'demi_portee');
    await sleep(3500);
    await waitForStop();

    // Wait for AI to throw
    let s = await waitForPlayerTurn();
    console.log('   After AI:', s?.state);

    // Get opponent ball position
    const opBallBefore = await page.evaluate(() => {
        const e = window.__PHASER_GAME__.scene.getScene('PetanqueScene').engine;
        const opBalls = e.getTeamBallsAlive('opponent');
        return opBalls.map(b => ({ x: Math.round(b.x), y: Math.round(b.y), id: b.id }));
    });
    console.log('\n3. Opponent balls BEFORE tir:', JSON.stringify(opBallBefore));

    if (opBallBefore.length === 0 || !s || s.remainP <= 0) {
        console.log('   Cannot test tir - no opponent ball or no remaining balls');
        await browser.close();
        process.exit(1);
    }

    // === TIR: aim directly at opponent's closest ball ===
    const target = opBallBefore[0];
    const tirAngle = await page.evaluate(({ tx, ty }) => {
        const scene = window.__PHASER_GAME__.scene.getScene('PetanqueScene');
        return Math.atan2(ty - scene.throwCircleY, tx - scene.throwCircleX);
    }, { tx: target.x, ty: target.y });

    console.log('\n4. FIRING TIR at opponent ball (' + target.x + ',' + target.y + ')...');
    console.log('   Angle:', Math.round(tirAngle * 180 / Math.PI) + '°, Power: 70%');

    await throwViaEngine(tirAngle, 0.7, 'tir');
    await sleep(4000);
    await waitForStop();

    // Check result
    const afterTir = await page.evaluate(({ targetId }) => {
        const e = window.__PHASER_GAME__.scene.getScene('PetanqueScene').engine;
        const allBalls = e.balls.filter(b => b.isAlive).map(b => ({
            team: b.team, x: Math.round(b.x), y: Math.round(b.y), id: b.id
        }));
        const targetBall = e.balls.find(b => b.id === targetId);
        const targetAfter = targetBall ? { x: Math.round(targetBall.x), y: Math.round(targetBall.y), alive: targetBall.isAlive } : null;
        return { allBalls, targetAfter };
    }, { targetId: target.id });

    console.log('\n5. AFTER TIR:');
    console.log('   All balls:', JSON.stringify(afterTir.allBalls));

    if (afterTir.targetAfter) {
        const dx = afterTir.targetAfter.x - target.x;
        const dy = afterTir.targetAfter.y - target.y;
        const displacement = Math.sqrt(dx * dx + dy * dy);
        console.log('   Target ball moved from (' + target.x + ',' + target.y + ') to (' + afterTir.targetAfter.x + ',' + afterTir.targetAfter.y + ')');
        console.log('   Displacement: ' + Math.round(displacement) + 'px');

        if (!afterTir.targetAfter.alive) {
            console.log('   Target ball EJECTED from terrain!');
            console.log('   OK: Tir successfully knocked ball out');
        } else if (displacement > 20) {
            console.log('   OK: Target ball significantly displaced (' + Math.round(displacement) + 'px)');
        } else if (displacement > 5) {
            console.log('   WARN: Target ball only slightly moved (' + Math.round(displacement) + 'px)');
        } else {
            console.log('   FAIL: Target ball barely moved (' + Math.round(displacement) + 'px)');
        }
    }

    // === TEST 2: Check that roulette produces long roll ===
    console.log('\n--- TECHNIQUE BEHAVIOR CHECK ---');

    // Restart for clean test
    await page.evaluate(() => {
        window.__PHASER_GAME__.scene.start('PetanqueScene', {
            terrain: 'terre', difficulty: 'easy',
            format: 'tete_a_tete', opponentName: 'Technique Test'
        });
    });
    await sleep(2500);

    // Cochonnet
    await throwViaEngine(UP, 0.5);
    await sleep(2500);

    // Test each technique at same power, measure where ball ends up
    const techniques = ['roulette', 'demi_portee', 'plombee'];
    const results = [];

    for (const tech of techniques) {
        await throwViaEngine(UP, 0.5, tech);
        await sleep(4000);
        await waitForStop();

        const ballPos = await page.evaluate(({ techName }) => {
            const e = window.__PHASER_GAME__.scene.getScene('PetanqueScene').engine;
            const playerBalls = e.balls.filter(b => b.team === 'player' && b.isAlive);
            const last = playerBalls[playerBalls.length - 1];
            if (!last) return { x: 0, y: 0, alive: false, note: 'no player ball (out of bounds?)' };
            return { x: Math.round(last.x), y: Math.round(last.y), alive: last.isAlive };
        }, { techName: tech });
        results.push({ tech, ...ballPos });
        console.log(`   ${tech}: landed at (${ballPos.x}, ${ballPos.y}) alive: ${ballPos.alive}`);

        s = await waitForPlayerTurn();
    }

    // Analyze: plombee should be closest to cochonnet, roulette may overshoot or undershoot
    const cochoY = cochoPos.y;
    for (const r of results) {
        const distFromCochonnet = Math.abs(r.y - cochoY);
        console.log(`   ${r.tech}: ${distFromCochonnet}px from cochonnet y`);
    }

    console.log('\n--- ERRORS ---');
    const jsErrors = errors.filter(e => !e.includes('Framebuffer'));
    jsErrors.forEach(e => console.log('  ', e));
    if (jsErrors.length === 0) console.log('No JS errors!');

    console.log('\nDone.');
    await browser.close();
    process.exit(jsErrors.length > 0 ? 1 : 0);
}

run().catch(e => { console.error(e); process.exit(1); });
