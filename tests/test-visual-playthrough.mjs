import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const URL = 'http://localhost:8080';
const SHOTS_DIR = 'tests/screenshots';
let shotNum = 0;

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function shot(page, label) {
    shotNum++;
    const name = `${String(shotNum).padStart(2, '0')}_${label}.png`;
    await page.screenshot({ path: `${SHOTS_DIR}/${name}` });
    console.log(`  [screenshot] ${name}`);
}

async function run() {
    mkdirSync(SHOTS_DIR, { recursive: true });
    console.log('=== VISUAL PLAYTHROUGH TEST ===\n');

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 832, height: 480 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));

    await page.goto(URL, { waitUntil: 'networkidle' });
    await sleep(2000);
    await page.click('canvas');
    await sleep(500);

    // Launch PetanqueScene directly
    await page.evaluate(() => {
        window.__PHASER_GAME__.scene.start('PetanqueScene', {
            terrain: 'terre', difficulty: 'easy',
            format: 'tete_a_tete', opponentName: 'Maitre Marcel'
        });
    });
    await sleep(2500);

    async function getState() {
        return page.evaluate(() => {
            const scene = window.__PHASER_GAME__.scene.getScene('PetanqueScene');
            if (!scene || !scene.engine) return null;
            const e = scene.engine;
            return {
                state: e.state, team: e.currentTeam,
                remainP: e.remaining.player, remainO: e.remaining.opponent,
                balls: e.balls.filter(b => b.isAlive).length,
                cochonnetAlive: e.cochonnet?.isAlive,
                cochonnetX: Math.round(e.cochonnet?.x || 0),
                cochonnetY: Math.round(e.cochonnet?.y || 0),
                playerX: Math.round(scene.playerSprite?.x),
                playerY: Math.round(scene.playerSprite?.y),
                opponentX: Math.round(scene.opponentSprite?.x),
                opponentY: Math.round(scene.opponentSprite?.y),
                opponentScaleY: Math.round((scene.opponentSprite?.scaleY || 0) * 100) / 100
            };
        });
    }

    async function selectMode(index) {
        await page.evaluate((idx) => {
            const scene = window.__PHASER_GAME__.scene.getScene('PetanqueScene');
            if (scene.aimingSystem._combinedBtns) {
                scene.aimingSystem._selectCombined(idx);
            }
        }, index);
        await sleep(400);
    }

    // SLINGSHOT: drag DOWN to throw UP (toward cochonnet)
    // startY ~440 (throw circle), endY should be > startY but < 480 (viewport limit)
    // Alternatively, use engine directly for reliable throws
    async function throwViaEngine(angle, power, mode = null) {
        await page.evaluate(({ angle, power, mode }) => {
            const scene = window.__PHASER_GAME__.scene.getScene('PetanqueScene');
            const e = scene.engine;
            if (e.state === 'COCHONNET_THROW') {
                e.throwCochonnet(angle, power);
            } else {
                const loft = mode === 'tir'
                    ? { id: 'tir', label: 'TIR', landingFactor: 0.60, arcHeight: -30, flyDurationMult: 0.4, rollEfficiency: 2.5 }
                    : mode === 'plombee'
                    ? { id: 'plombee', label: 'PLOMBEE', landingFactor: 0.90, arcHeight: -80, flyDurationMult: 1.4, rollEfficiency: 0.15 }
                    : mode === 'roulette'
                    ? { id: 'roulette', label: 'ROULETTE', landingFactor: 0.15, arcHeight: -6, flyDurationMult: 0.5, rollEfficiency: 0.7 }
                    : { id: 'demi_portee', label: 'DEMI-PORTEE', landingFactor: 0.50, arcHeight: -40, flyDurationMult: 0.9, rollEfficiency: 0.6 };
                e.throwBall(angle, power, 'player', mode === 'tir' ? 'tirer' : 'pointer', loft);
            }
        }, { angle, power, mode });
    }

    async function waitForPlayerTurn(maxMs = 15000) {
        const start = Date.now();
        while (Date.now() - start < maxMs) {
            const s = await getState();
            if (!s) { await sleep(300); continue; }
            if (s.team === 'player' && (s.state === 'PLAY_LOOP' || s.state === 'FIRST_BALL') && s.remainP > 0) return s;
            if (s.state === 'SCORE_MENE' || s.state === 'GAME_OVER' || s.state === 'COCHONNET_THROW') return s;
            await sleep(300);
        }
        return await getState();
    }

    const UP = -Math.PI / 2; // angle toward top of screen (toward cochonnet)

    // ===== PHASE 1: COCHONNET =====
    console.log('1. Throwing cochonnet...');
    let s = await getState();
    console.log('   Start: player(' + s.playerX + ',' + s.playerY + ') opponent(' + s.opponentX + ',' + s.opponentY + ')');
    await shot(page, 'start');

    await throwViaEngine(UP, 0.5); // 50% power straight up
    await sleep(2500);
    s = await getState();
    console.log('   Cochonnet at: (' + s.cochonnetX + ',' + s.cochonnetY + ') alive:', s.cochonnetAlive);
    console.log('   Opponent at: (' + s.opponentX + ',' + s.opponentY + ') scaleY:', s.opponentScaleY);
    await shot(page, 'after_cochonnet');

    // ===== PHASE 2: BALL 1 - ROULETTE =====
    console.log('\n2. Ball 1 - ROULETTE (should roll far)...');
    await sleep(500);
    await throwViaEngine(UP, 0.4, 'roulette');
    await sleep(3500);
    s = await getState();
    console.log('   Balls alive:', s?.balls, '| State:', s?.state);
    await shot(page, 'after_roulette');

    s = await waitForPlayerTurn();
    console.log('   Turn: state=' + s?.state + ' team=' + s?.team + ' balls=' + s?.balls + ' remainP=' + s?.remainP);
    console.log('   Player(' + s?.playerX + ',' + s?.playerY + ') Opponent(' + s?.opponentX + ',' + s?.opponentY + ') oScaleY=' + s?.opponentScaleY);
    await shot(page, 'after_ai_turn1');

    // ===== PHASE 3: BALL 2 - DEMI-PORTEE =====
    if (s?.remainP > 0 && s?.team === 'player') {
        console.log('\n3. Ball 2 - DEMI-PORTEE...');
        await throwViaEngine(UP + 0.1, 0.5, 'demi_portee'); // slight angle offset
        await sleep(3500);
        s = await waitForPlayerTurn();
        console.log('   After: balls=' + s?.balls + ' state=' + s?.state);
        await shot(page, 'after_demi_portee');
    }

    // ===== PHASE 4: BALL 3 - PLOMBEE =====
    if (s?.remainP > 0 && s?.team === 'player') {
        console.log('\n4. Ball 3 - PLOMBEE (should land and stop near cochonnet)...');
        await throwViaEngine(UP - 0.05, 0.6, 'plombee');
        await sleep(4000);
        await shot(page, 'after_plombee');
        s = await waitForPlayerTurn(20000);
        console.log('   After: balls=' + s?.balls + ' state=' + s?.state);
        await shot(page, 'end_mene');
    }

    // ===== PHASE 5: TIR + CARREAU TEST =====
    console.log('\n5. Testing TIR + CARREAU...');
    await page.evaluate(() => {
        window.__PHASER_GAME__.scene.start('PetanqueScene', {
            terrain: 'terre', difficulty: 'easy',
            format: 'tete_a_tete', opponentName: 'Test Tir'
        });
    });
    await sleep(2500);

    // Throw cochonnet
    await throwViaEngine(UP, 0.5);
    await sleep(2500);

    // Ball 1 - place near cochonnet
    await throwViaEngine(UP, 0.5, 'demi_portee');
    await sleep(3500);

    s = await waitForPlayerTurn();

    if (s?.remainP > 0 && s?.team === 'player') {
        // Find opponent ball position and aim tir at it
        const opBall = await page.evaluate(() => {
            const scene = window.__PHASER_GAME__.scene.getScene('PetanqueScene');
            const balls = scene.engine.getTeamBallsAlive('opponent');
            if (balls.length === 0) return null;
            return { x: balls[0].x, y: balls[0].y };
        });

        if (opBall) {
            // Calculate angle from throw circle to opponent ball
            const tirAngle = await page.evaluate(({ tx, ty }) => {
                const scene = window.__PHASER_GAME__.scene.getScene('PetanqueScene');
                const ox = scene.throwCircleX;
                const oy = scene.throwCircleY;
                return Math.atan2(ty - oy, tx - ox);
            }, { tx: opBall.x, ty: opBall.y });

            console.log('   TIR aimed at opponent ball (' + Math.round(opBall.x) + ',' + Math.round(opBall.y) + ')');
            await throwViaEngine(tirAngle, 0.7, 'tir');
            await sleep(3500);
            await shot(page, 'after_tir');

            const afterTir = await page.evaluate(() => {
                const scene = window.__PHASER_GAME__.scene.getScene('PetanqueScene');
                return {
                    ballPositions: scene.engine.balls.filter(b => b.isAlive).map(b => ({
                        team: b.team, x: Math.round(b.x), y: Math.round(b.y)
                    })),
                    carreauPossible: typeof scene.engine._celebrateCarreau === 'function'
                };
            });
            console.log('   After TIR balls:', JSON.stringify(afterTir.ballPositions));
            console.log('   Carreau system: ' + (afterTir.carreauPossible ? 'OK' : 'MISSING'));
        } else {
            console.log('   No opponent ball to aim at');
        }
    }

    // ===== SUMMARY =====
    console.log('\n--- ERRORS ---');
    const jsErrors = errors.filter(e => !e.includes('Framebuffer'));
    if (jsErrors.length > 0) {
        jsErrors.forEach(e => console.log('  ', e));
    } else {
        console.log('No JS errors!');
    }

    console.log(`\nScreenshots saved to ${SHOTS_DIR}/ (${shotNum} total)`);

    await browser.close();
    process.exit(jsErrors.length > 0 ? 1 : 0);
}

run().catch(e => { console.error(e); process.exit(1); });
