import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const URL = 'http://localhost:8080';
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function run() {
    mkdirSync('tests/screenshots', { recursive: true });
    console.log('=== TIR DEBUG TEST ===\n');
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 832, height: 480 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));

    await page.goto(URL, { waitUntil: 'networkidle' });
    await sleep(2000);
    await page.click('canvas');
    await sleep(500);

    // Start scene
    await page.evaluate(() => {
        window.__PHASER_GAME__.scene.start('PetanqueScene', {
            terrain: 'terre', difficulty: 'easy',
            format: 'tete_a_tete', opponentName: 'Tir Test'
        });
    });
    await sleep(2500);

    async function waitForStop(maxMs = 8000) {
        const start = Date.now();
        while (Date.now() - start < maxMs) {
            const moving = await page.evaluate(() => {
                const e = window.__PHASER_GAME__.scene.getScene('PetanqueScene').engine;
                return e.balls.some(b => b.isMoving) || (e.cochonnet && e.cochonnet.isMoving);
            });
            if (!moving) return;
            await sleep(200);
        }
    }

    const UP = -Math.PI / 2;

    // 1. Throw cochonnet straight up, medium power
    console.log('1. Cochonnet...');
    await page.evaluate(() => {
        const e = window.__PHASER_GAME__.scene.getScene('PetanqueScene').engine;
        e.throwCochonnet(-Math.PI / 2, 0.5);
    });
    await sleep(2500);
    await waitForStop();

    const cochoPos = await page.evaluate(() => {
        const e = window.__PHASER_GAME__.scene.getScene('PetanqueScene').engine;
        return { x: Math.round(e.cochonnet.x), y: Math.round(e.cochonnet.y) };
    });
    console.log('   Cochonnet at:', cochoPos);

    // 2. Place a player ball via demi-portee
    console.log('\n2. Player ball 1 (demi-portee)...');
    await page.evaluate(() => {
        const e = window.__PHASER_GAME__.scene.getScene('PetanqueScene').engine;
        const loft = { id: 'demi_portee', label: 'DEMI-PORTEE', landingFactor: 0.50, arcHeight: -40, flyDurationMult: 0.9, rollEfficiency: 0.6 };
        e.throwBall(-Math.PI / 2, 0.45, 'player', 'pointer', loft);
    });
    await sleep(4000);
    await waitForStop();

    // Wait for AI
    await sleep(3000);
    await waitForStop();

    // 3. Get exact positions of all balls
    const beforeTir = await page.evaluate(() => {
        const scene = window.__PHASER_GAME__.scene.getScene('PetanqueScene');
        const e = scene.engine;
        return {
            state: e.state,
            team: e.currentTeam,
            remainP: e.remaining.player,
            cochonnet: { x: Math.round(e.cochonnet.x), y: Math.round(e.cochonnet.y) },
            throwCircle: { x: Math.round(scene.throwCircleX), y: Math.round(scene.throwCircleY) },
            balls: e.balls.filter(b => b.isAlive).map(b => ({
                team: b.team, x: Math.round(b.x), y: Math.round(b.y), id: b.id
            }))
        };
    });
    console.log('\n3. State before TIR:');
    console.log('   State:', beforeTir.state, 'Team:', beforeTir.team, 'RemainP:', beforeTir.remainP);
    console.log('   Throw circle:', beforeTir.throwCircle);
    console.log('   Cochonnet:', beforeTir.cochonnet);
    console.log('   Balls:', JSON.stringify(beforeTir.balls, null, 2));

    // Find opponent ball to aim at
    const opBalls = beforeTir.balls.filter(b => b.team === 'opponent');
    if (opBalls.length === 0) {
        console.log('   NO OPPONENT BALL! Cannot test tir.');
        await browser.close();
        process.exit(1);
    }
    const target = opBalls[0];
    console.log('   TARGET:', target);

    // 4. Calculate exact angle from throw circle to target ball
    const circleX = beforeTir.throwCircle.x;
    const circleY = beforeTir.throwCircle.y;
    const angle = Math.atan2(target.y - circleY, target.x - circleX);
    const distToTarget = Math.sqrt((target.x - circleX) ** 2 + (target.y - circleY) ** 2);

    console.log('\n4. TIR calculation:');
    console.log('   Angle:', Math.round(angle * 180 / Math.PI) + '°');
    console.log('   Distance to target:', Math.round(distToTarget) + 'px');

    // 5. Calculate what computeThrowParams will produce
    const simResult = await page.evaluate(({ angle, distToTarget }) => {
        const scene = window.__PHASER_GAME__.scene.getScene('PetanqueScene');
        const e = scene.engine;
        const PE = e.constructor;

        // Test at various power levels
        const results = [];
        for (const power of [0.3, 0.5, 0.7, 0.9, 1.0]) {
            const loft = { id: 'tir', label: 'TIR', landingFactor: 0.85, arcHeight: -45, flyDurationMult: 0.4, rollEfficiency: 3.0 };
            const params = PE.computeThrowParams(
                angle, power, scene.throwCircleX, scene.throwCircleY,
                e.bounds, loft, e.frictionMult
            );
            const landDist = Math.sqrt(
                (params.targetX - scene.throwCircleX) ** 2 +
                (params.targetY - scene.throwCircleY) ** 2
            );
            const rollSpeed = Math.sqrt(params.rollVx ** 2 + params.rollVy ** 2);
            results.push({
                power: Math.round(power * 100) + '%',
                landX: Math.round(params.targetX),
                landY: Math.round(params.targetY),
                landDist: Math.round(landDist),
                rollSpeed: Math.round(rollSpeed * 100) / 100,
                rollVx: Math.round(params.rollVx * 100) / 100,
                rollVy: Math.round(params.rollVy * 100) / 100
            });
        }
        return results;
    }, { angle, distToTarget });

    console.log('\n5. computeThrowParams at various powers (target at ' + Math.round(distToTarget) + 'px):');
    console.log('   Power | Land dist | Roll speed | Landing point');
    for (const r of simResult) {
        const match = Math.abs(r.landDist - distToTarget) < 30 ? ' <-- CLOSE!' : '';
        console.log(`   ${r.power.padStart(4)} | ${String(r.landDist).padStart(7)}px | ${String(r.rollSpeed).padStart(8)}  | (${r.landX},${r.landY})${match}`);
    }

    // 6. Find best power to hit the target
    // The ball needs to land BEFORE the target, then roll INTO it
    // landDist + rollDistance should = distToTarget
    // Try to find power where landDist is slightly less than distToTarget
    let bestPower = 0.5;
    let bestDiff = Infinity;
    for (const r of simResult) {
        const p = parseInt(r.power) / 100;
        // landDist should be close to distToTarget (ball lands near target then rolls into it)
        const diff = Math.abs(r.landDist - distToTarget);
        if (diff < bestDiff) {
            bestDiff = diff;
            bestPower = p;
        }
    }
    console.log('\n6. Best power to reach target:', Math.round(bestPower * 100) + '% (land ' + Math.round(bestDiff) + 'px from target)');

    // 7. Actually fire the TIR
    console.log('\n7. FIRING TIR...');
    await page.screenshot({ path: 'tests/screenshots/tir_before.png' });

    await page.evaluate(({ angle, power }) => {
        const e = window.__PHASER_GAME__.scene.getScene('PetanqueScene').engine;
        const loft = { id: 'tir', label: 'TIR', landingFactor: 0.85, arcHeight: -45, flyDurationMult: 0.4, rollEfficiency: 3.0 };
        e.throwBall(angle, power, 'player', 'tirer', loft);
    }, { angle, power: bestPower });

    await sleep(4000);
    await waitForStop();
    await page.screenshot({ path: 'tests/screenshots/tir_after.png' });

    // 8. Check result
    const afterTir = await page.evaluate(({ targetId }) => {
        const e = window.__PHASER_GAME__.scene.getScene('PetanqueScene').engine;
        const targetBall = e.balls.find(b => b.id === targetId);
        return {
            balls: e.balls.filter(b => b.isAlive).map(b => ({
                team: b.team, x: Math.round(b.x), y: Math.round(b.y), id: b.id
            })),
            target: targetBall ? {
                x: Math.round(targetBall.x), y: Math.round(targetBall.y),
                alive: targetBall.isAlive,
                vx: Math.round(targetBall.vx * 100) / 100,
                vy: Math.round(targetBall.vy * 100) / 100
            } : null,
            lastThrown: e.lastThrownBall ? {
                x: Math.round(e.lastThrownBall.x), y: Math.round(e.lastThrownBall.y),
                alive: e.lastThrownBall.isAlive
            } : null
        };
    }, { targetId: target.id });

    console.log('\n8. RESULT:');
    const tgtAfter = afterTir.target;
    if (tgtAfter) {
        const dx = tgtAfter.x - target.x;
        const dy = tgtAfter.y - target.y;
        const disp = Math.sqrt(dx * dx + dy * dy);
        console.log('   Target BEFORE: (' + target.x + ',' + target.y + ')');
        console.log('   Target AFTER:  (' + tgtAfter.x + ',' + tgtAfter.y + ') alive:', tgtAfter.alive);
        console.log('   DISPLACEMENT:  ' + Math.round(disp) + 'px');
        if (!tgtAfter.alive) console.log('   >>> EJECTED from terrain!');
        else if (disp > 40) console.log('   >>> GOOD HIT!');
        else if (disp > 10) console.log('   >>> Weak hit');
        else console.log('   >>> MISSED (or no collision)');
    }
    console.log('   Thrown ball:', afterTir.lastThrown);
    console.log('   All balls:', JSON.stringify(afterTir.balls));

    console.log('\n--- ERRORS ---');
    const jsErrors = errors.filter(e => !e.includes('Framebuffer'));
    jsErrors.forEach(e => console.log('  ', e));
    if (jsErrors.length === 0) console.log('No errors.');

    await browser.close();
    process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
