import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const URL = 'http://localhost:8080';
const SHOTS_DIR = 'tests/screenshots/new-features';
let shotNum = 0;
const results = [];

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function shot(page, label) {
    shotNum++;
    const name = `${String(shotNum).padStart(2, '0')}_${label}.png`;
    await page.screenshot({ path: `${SHOTS_DIR}/${name}` });
    console.log(`  [screenshot] ${name}`);
    return `${SHOTS_DIR}/${name}`;
}

function pass(name) { results.push({ name, ok: true }); console.log(`  PASS: ${name}`); }
function fail(name, reason) { results.push({ name, ok: false, reason }); console.log(`  FAIL: ${name} — ${reason}`); }

async function run() {
    mkdirSync(SHOTS_DIR, { recursive: true });
    console.log('=== NEW FEATURES VISUAL TEST ===\n');

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 832, height: 480 } });
    const jsErrors = [];
    page.on('pageerror', e => jsErrors.push(e.message));

    // --- LOAD GAME ---
    console.log('Loading game...');
    await page.goto(URL, { waitUntil: 'networkidle', timeout: 15000 });
    await sleep(3000);
    await page.click('canvas');
    await sleep(500);

    // --- Helper functions ---
    async function getState() {
        return page.evaluate(() => {
            const scene = window.__PHASER_GAME__?.scene?.getScene('PetanqueScene');
            if (!scene || !scene.engine) return null;
            const e = scene.engine;
            return {
                state: e.state, team: e.currentTeam,
                remainP: e.remaining.player, remainO: e.remaining.opponent,
                balls: e.balls.filter(b => b.isAlive).length,
                cochonnetAlive: e.cochonnet?.isAlive,
                scores: { ...e.scores },
                mene: e.mene
            };
        });
    }

    async function startPetanqueScene(terrain, difficulty, playerChar, opponentChar) {
        await page.evaluate(({ terrain, difficulty, playerChar, opponentChar }) => {
            const game = window.__PHASER_GAME__;
            // Load characters data to pass proper character objects
            const chars = game.registry?.get('characters')?.roster;
            const player = chars?.find(c => c.id === playerChar) || null;
            const opponent = chars?.find(c => c.id === opponentChar) || null;
            game.scene.start('PetanqueScene', {
                terrain, difficulty, format: 'tete_a_tete',
                playerCharacter: player, opponentCharacter: opponent
            });
        }, { terrain, difficulty, playerChar, opponentChar });
        await sleep(3000);
    }

    async function throwViaEngine(angle, power, mode = null, retro = 0) {
        await page.evaluate(({ angle, power, mode, retro }) => {
            const scene = window.__PHASER_GAME__.scene.getScene('PetanqueScene');
            const e = scene.engine;
            const C = window.__CONSTANTS__ || {};
            if (e.state === 'COCHONNET_THROW') {
                e.throwCochonnet(angle, power);
            } else {
                // Import loft presets from the actual game
                const lofts = {
                    roulette: { id: 'roulette', label: 'ROULETTE', landingFactor: 0.15, arcHeight: -8, flyDurationMult: 0.5, rollEfficiency: 0.7, precisionPenalty: 0, retroAllowed: false },
                    demi_portee: { id: 'demi_portee', label: 'DEMI-PORTEE', landingFactor: 0.50, arcHeight: -40, flyDurationMult: 0.9, rollEfficiency: 0.6, precisionPenalty: 0, retroAllowed: true },
                    plombee: { id: 'plombee', label: 'PLOMBEE', landingFactor: 0.80, arcHeight: -80, flyDurationMult: 1.4, rollEfficiency: 0.50, precisionPenalty: 3.0, retroAllowed: true },
                    tir: { id: 'tir', label: 'TIR', landingFactor: 0.95, arcHeight: -65, flyDurationMult: 0.4, rollEfficiency: 14.0, precisionPenalty: 1.0, retroAllowed: true }
                };
                const loft = lofts[mode] || lofts.demi_portee;
                const shotMode = mode === 'tir' ? 'tirer' : 'pointer';
                e.throwBall(angle, power, 'player', shotMode, loft, retro);
            }
        }, { angle, power, mode, retro });
    }

    async function waitForStop(maxMs = 12000) {
        const start = Date.now();
        while (Date.now() - start < maxMs) {
            const s = await getState();
            if (!s) { await sleep(300); continue; }
            if (s.state !== 'WAITING_STOP') return s;
            await sleep(300);
        }
        return await getState();
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

    const UP = -Math.PI / 2;

    // ==========================================
    // TEST 1: UI Selection Panel
    // ==========================================
    console.log('\n--- TEST 1: UI Technique Selection Panel ---');
    await startPetanqueScene('terre', 'easy', 'equilibre', 'equilibre');

    // Throw cochonnet
    await throwViaEngine(UP, 0.5);
    await sleep(3000);

    // Check that the technique selection UI appears
    const hasUI = await page.evaluate(() => {
        const scene = window.__PHASER_GAME__.scene.getScene('PetanqueScene');
        return scene?.aimingSystem?._combinedBtns?.length > 0;
    });
    if (hasUI) pass('Technique selection UI visible');
    else fail('Technique selection UI visible', 'No UI buttons found');

    await shot(page, 'technique_ui_panel');

    // Select plombee (index 2)
    await page.evaluate(() => {
        const scene = window.__PHASER_GAME__.scene.getScene('PetanqueScene');
        scene.aimingSystem._selectCombined(2);
    });
    await sleep(500);

    // Check retro toggle exists
    const hasRetro = await page.evaluate(() => {
        const scene = window.__PHASER_GAME__.scene.getScene('PetanqueScene');
        return scene?.aimingSystem?._retroUI?.length > 0;
    });
    if (hasRetro) pass('Retro toggle visible after plombee selection');
    else fail('Retro toggle visible after plombee selection', 'No retro UI');

    await shot(page, 'after_plombee_select_retro_visible');

    // ==========================================
    // TEST 2: Wobble / Precision Marker
    // ==========================================
    console.log('\n--- TEST 2: Precision Wobble ---');

    // Check wobble amplitude for current character (Rene, precision 6)
    const wobbleData = await page.evaluate(() => {
        const scene = window.__PHASER_GAME__.scene.getScene('PetanqueScene');
        const aim = scene.aimingSystem;
        return {
            amplitude: aim._getWobbleAmplitude(),
            speed: aim._getWobbleSpeed(),
            precision: aim.charStats.precision
        };
    });
    console.log(`  Rene (precision ${wobbleData.precision}): wobble amp=${wobbleData.amplitude.toFixed(1)}px, speed=${wobbleData.speed.toFixed(2)}Hz`);
    if (wobbleData.amplitude > 5 && wobbleData.amplitude < 20) pass('Wobble amplitude reasonable for precision 6');
    else fail('Wobble amplitude reasonable', `Got ${wobbleData.amplitude}`);

    // ==========================================
    // TEST 3: Retro Effect on Ball Physics
    // ==========================================
    console.log('\n--- TEST 3: Retro Effect ---');

    // Start fresh scene
    await startPetanqueScene('terre', 'easy', 'equilibre', 'equilibre');
    await throwViaEngine(UP, 0.5); // cochonnet
    await sleep(3000);

    // Throw ball WITHOUT retro
    await throwViaEngine(UP, 0.45, 'plombee', 0);
    await sleep(4000);
    const ball1Pos = await page.evaluate(() => {
        const scene = window.__PHASER_GAME__.scene.getScene('PetanqueScene');
        const balls = scene.engine.balls.filter(b => b.isAlive && b.team === 'player');
        return balls.length > 0 ? { x: balls[0].x, y: balls[0].y } : null;
    });
    console.log(`  Plombee WITHOUT retro: ball at (${ball1Pos?.x?.toFixed(0)}, ${ball1Pos?.y?.toFixed(0)})`);
    await shot(page, 'plombee_no_retro');

    await waitForPlayerTurn();

    // Throw ball WITH retro (full intensity)
    await throwViaEngine(UP, 0.45, 'plombee', 0.8);
    await sleep(4000);
    const ball2Pos = await page.evaluate(() => {
        const scene = window.__PHASER_GAME__.scene.getScene('PetanqueScene');
        const balls = scene.engine.balls.filter(b => b.isAlive && b.team === 'player');
        return balls.length > 1 ? { x: balls[1].x, y: balls[1].y } : null;
    });
    console.log(`  Plombee WITH retro:    ball at (${ball2Pos?.x?.toFixed(0)}, ${ball2Pos?.y?.toFixed(0)})`);
    await shot(page, 'plombee_with_retro');

    if (ball1Pos && ball2Pos) {
        // Retro ball should stop closer to landing point (higher Y = closer to throw circle)
        // In plombee, balls go UP (negative Y direction), so retro should have HIGHER Y (stopped sooner)
        const diff = Math.abs(ball1Pos.y - ball2Pos.y);
        console.log(`  Y difference: ${diff.toFixed(0)}px`);
        if (diff > 3) pass('Retro ball stops at different position');
        else fail('Retro ball stops at different position', `Only ${diff.toFixed(0)}px difference`);
    }

    // ==========================================
    // TEST 4: Shot Detection (Biberon)
    // ==========================================
    console.log('\n--- TEST 4: Shot Detection ---');
    await startPetanqueScene('terre', 'easy', 'equilibre', 'equilibre');
    await throwViaEngine(UP, 0.5); // cochonnet
    await sleep(3000);

    // Get cochonnet position and throw precisely at it
    const cochPos = await page.evaluate(() => {
        const scene = window.__PHASER_GAME__.scene.getScene('PetanqueScene');
        return { x: scene.engine.cochonnet.x, y: scene.engine.cochonnet.y };
    });
    console.log(`  Cochonnet at (${cochPos.x.toFixed(0)}, ${cochPos.y.toFixed(0)})`);

    // Throw a ball right at the cochonnet for a biberon
    await throwViaEngine(UP, 0.5, 'demi_portee', 0);
    await sleep(4500);
    await shot(page, 'after_biberon_attempt');

    // ==========================================
    // TEST 5: AI Differentiation
    // ==========================================
    console.log('\n--- TEST 5: AI Level Differentiation ---');

    // Test Rene (weak) vs Marius (boss) — check their angleDev
    const aiComparison = await page.evaluate(() => {
        const game = window.__PHASER_GAME__;
        const chars = game.registry?.get('characters')?.roster;
        if (!chars) return null;
        const rene = chars.find(c => c.id === 'equilibre');
        const marius = chars.find(c => c.id === 'boss');
        const marcel = chars.find(c => c.id === 'pointeur');
        const fanny = chars.find(c => c.id === 'tireur');
        return {
            rene: rene?.ai,
            marius: marius?.ai,
            marcel: marcel?.ai,
            fanny: fanny?.ai
        };
    });

    if (aiComparison) {
        console.log(`  Rene:   angleDev=${aiComparison.rene?.angleDev}, powerDev=${aiComparison.rene?.powerDev}`);
        console.log(`  Marcel: angleDev=${aiComparison.marcel?.angleDev}, powerDev=${aiComparison.marcel?.powerDev}`);
        console.log(`  Fanny:  angleDev=${aiComparison.fanny?.angleDev}, powerDev=${aiComparison.fanny?.powerDev}`);
        console.log(`  Marius: angleDev=${aiComparison.marius?.angleDev}, powerDev=${aiComparison.marius?.powerDev}`);

        const reneWorse = aiComparison.rene.angleDev > aiComparison.marius.angleDev * 3;
        if (reneWorse) pass('Rene significantly worse than Marius');
        else fail('Rene significantly worse than Marius', `Ratio: ${(aiComparison.rene.angleDev / aiComparison.marius.angleDev).toFixed(1)}x`);

        const marcelBest = aiComparison.marcel.angleDev <= aiComparison.marius.angleDev;
        if (marcelBest) pass('Marcel (pointeur) has best raw precision');
        else fail('Marcel best raw precision', `Marcel=${aiComparison.marcel.angleDev} vs Marius=${aiComparison.marius.angleDev}`);
    } else {
        fail('AI comparison', 'Could not load character data');
    }

    // ==========================================
    // TEST 6: Plombee Precision Penalty
    // ==========================================
    console.log('\n--- TEST 6: Plombee Precision Penalty ---');
    await startPetanqueScene('terre', 'easy', 'equilibre', 'equilibre');
    await throwViaEngine(UP, 0.5);
    await sleep(3000);

    // Compare wobble amplitude for demi-portee vs plombee
    const wobbleDemiPortee = await page.evaluate(() => {
        const scene = window.__PHASER_GAME__.scene.getScene('PetanqueScene');
        const aim = scene.aimingSystem;
        // Simulate selecting demi-portee
        aim.shotMode = 'pointer';
        aim.loftPreset = { precisionPenalty: 0 };
        const demiAmp = aim._getWobbleAmplitude();
        // Simulate selecting plombee
        aim.loftPreset = { precisionPenalty: 3.0 };
        const plombeeAmp = aim._getWobbleAmplitude();
        return { demiAmp, plombeeAmp };
    });

    console.log(`  Demi-portee wobble: ${wobbleDemiPortee.demiAmp.toFixed(1)}px`);
    console.log(`  Plombee wobble:     ${wobbleDemiPortee.plombeeAmp.toFixed(1)}px`);
    const penalty = wobbleDemiPortee.plombeeAmp - wobbleDemiPortee.demiAmp;
    if (penalty >= 5) pass(`Plombee has +${penalty.toFixed(0)}px wobble penalty`);
    else fail('Plombee wobble penalty', `Only +${penalty.toFixed(0)}px`);

    // ==========================================
    // TEST 7: Full Visual Mene (screenshot sequence)
    // ==========================================
    console.log('\n--- TEST 7: Full Visual Mene ---');
    await startPetanqueScene('village', 'easy', 'pointeur', 'tireur');
    await shot(page, 'mene_start');

    // Cochonnet
    await throwViaEngine(UP, 0.55);
    await sleep(3000);
    await shot(page, 'mene_cochonnet');

    // Player ball 1 - roulette near cochonnet
    let s = await getState();
    if (s?.state !== 'COCHONNET_THROW') {
        await page.evaluate(() => {
            const scene = window.__PHASER_GAME__.scene.getScene('PetanqueScene');
            if (scene.aimingSystem._combinedBtns) scene.aimingSystem._selectCombined(0);
        });
        await sleep(300);
        await throwViaEngine(UP, 0.50, 'roulette');
        await sleep(3500);
        await shot(page, 'mene_ball1_roulette');
    }

    // Wait for AI turn
    s = await waitForPlayerTurn();
    await shot(page, 'mene_after_ai1');

    // Player ball 2 - demi-portee with retro
    if (s?.remainP > 0 && s?.team === 'player') {
        await throwViaEngine(UP + 0.08, 0.55, 'demi_portee', 0.5);
        await sleep(3500);
        await shot(page, 'mene_ball2_demiportee_retro');
        s = await waitForPlayerTurn();
        await shot(page, 'mene_after_ai2');
    }

    // Player ball 3 - plombee with full retro
    if (s?.remainP > 0 && s?.team === 'player') {
        await throwViaEngine(UP - 0.05, 0.5, 'plombee', 1.0);
        await sleep(4000);
        await shot(page, 'mene_ball3_plombee_retro');
        s = await waitForStop(20000);
        await shot(page, 'mene_end');
    }

    // ==========================================
    // SUMMARY
    // ==========================================
    console.log('\n\n=== RESULTS ===');
    const passed = results.filter(r => r.ok).length;
    const failed = results.filter(r => !r.ok).length;
    console.log(`${passed} passed, ${failed} failed out of ${results.length} tests\n`);
    for (const r of results) {
        console.log(`  ${r.ok ? 'PASS' : 'FAIL'}: ${r.name}${r.reason ? ' — ' + r.reason : ''}`);
    }

    if (jsErrors.length > 0) {
        console.log(`\n  JS ERRORS (${jsErrors.length}):`);
        for (const e of jsErrors) console.log(`    ${e.substring(0, 120)}`);
    } else {
        console.log('\n  No JS errors detected.');
    }

    console.log(`\n  Screenshots saved to: ${SHOTS_DIR}/`);
    await browser.close();
    process.exit(failed > 0 ? 1 : 0);
}

run().catch(e => { console.error('FATAL:', e); process.exit(1); });
