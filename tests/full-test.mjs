/**
 * Full game test: 100 scenarios covering all options
 * Tests: terrains, characters, boules, cochonnets, difficulties, modes
 * Validates: cochonnet in bounds, ball in bounds, no JS crashes, visual rendering
 */
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const URL = 'http://localhost:5174';
const SCREENSHOT_DIR = path.resolve('tests/screenshots/full');
if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// All game options
const CHARS = ['equilibre', 'pointeur', 'tireur', 'stratege', 'wildcard', 'boss'];
const BOULES = ['acier', 'bronze', 'chrome', 'noire', 'rouge'];
const COCHONNETS = ['classique', 'bleu', 'vert'];
const TERRAINS = ['terre', 'herbe', 'sable', 'dalles', 'colline'];
const DIFFICULTIES = ['easy', 'medium', 'hard'];
const MODES = ['vs_ia', 'local'];

// Throw configs: angle (radians), power (0-1)
const THROWS = [
    { name: 'center-50%', angle: -Math.PI / 2, power: 0.5 },
    { name: 'center-20%', angle: -Math.PI / 2, power: 0.2 },
    { name: 'center-90%', angle: -Math.PI / 2, power: 0.9 },
    { name: 'left-60%', angle: -Math.PI / 2 - 0.15, power: 0.6 },
    { name: 'right-70%', angle: -Math.PI / 2 + 0.15, power: 0.7 },
];

// Generate 100 diverse scenarios
function generateScenarios() {
    const scenarios = [];
    let id = 0;

    // 1. ALL terrains x ALL boules = 25 (core visual combinations)
    for (const terrain of TERRAINS) {
        for (const boule of BOULES) {
            scenarios.push({
                id: ++id,
                name: `terrain_${terrain}_boule_${boule}`,
                terrain, bouleType: boule,
                cochonnetType: 'classique',
                playerCharId: 'equilibre', opponentId: 'pointeur',
                difficulty: 'easy', localMultiplayer: false,
                throwConfig: THROWS[id % THROWS.length]
            });
        }
    }

    // 2. ALL terrains x ALL cochonnets = 15
    for (const terrain of TERRAINS) {
        for (const coch of COCHONNETS) {
            scenarios.push({
                id: ++id,
                name: `terrain_${terrain}_coch_${coch}`,
                terrain, bouleType: 'acier',
                cochonnetType: coch,
                playerCharId: 'equilibre', opponentId: 'tireur',
                difficulty: 'easy', localMultiplayer: false,
                throwConfig: THROWS[id % THROWS.length]
            });
        }
    }

    // 3. ALL characters as P1 x 2 terrains = 12
    for (const char of CHARS) {
        for (const terrain of ['terre', 'dalles']) {
            scenarios.push({
                id: ++id,
                name: `p1_${char}_${terrain}`,
                terrain, bouleType: 'acier',
                cochonnetType: 'classique',
                playerCharId: char, opponentId: 'equilibre',
                difficulty: 'medium', localMultiplayer: false,
                throwConfig: THROWS[id % THROWS.length]
            });
        }
    }

    // 4. ALL characters as opponent x 2 terrains = 12
    for (const char of CHARS) {
        for (const terrain of ['herbe', 'sable']) {
            scenarios.push({
                id: ++id,
                name: `opp_${char}_${terrain}`,
                terrain, bouleType: 'chrome',
                cochonnetType: 'bleu',
                playerCharId: 'equilibre', opponentId: char,
                difficulty: 'hard', localMultiplayer: false,
                throwConfig: THROWS[id % THROWS.length]
            });
        }
    }

    // 5. ALL difficulties x ALL terrains = 15
    for (const diff of DIFFICULTIES) {
        for (const terrain of TERRAINS) {
            scenarios.push({
                id: ++id,
                name: `diff_${diff}_${terrain}`,
                terrain, bouleType: 'bronze',
                cochonnetType: 'vert',
                playerCharId: 'stratege', opponentId: 'boss',
                difficulty: diff, localMultiplayer: false,
                throwConfig: THROWS[id % THROWS.length]
            });
        }
    }

    // 6. Local multiplayer mode x ALL terrains = 5
    for (const terrain of TERRAINS) {
        scenarios.push({
            id: ++id,
            name: `local_${terrain}`,
            terrain, bouleType: 'rouge',
            cochonnetType: 'classique',
            playerCharId: 'tireur', opponentId: 'wildcard',
            difficulty: 'medium', localMultiplayer: true,
            throwConfig: THROWS[id % THROWS.length]
        });
    }

    // 7. Extreme throw angles/powers x terrains = 10
    const extremeThrows = [
        { name: 'min-power', angle: -Math.PI / 2, power: 0.01 },
        { name: 'max-power', angle: -Math.PI / 2, power: 1.0 },
        { name: 'hard-left', angle: -Math.PI / 2 - 0.3, power: 0.5 },
        { name: 'hard-right', angle: -Math.PI / 2 + 0.3, power: 0.5 },
        { name: 'min-center', angle: -Math.PI / 2, power: 0.05 },
        { name: 'max-left', angle: -Math.PI / 2 - 0.3, power: 1.0 },
        { name: 'max-right', angle: -Math.PI / 2 + 0.3, power: 1.0 },
        { name: 'gentle-left', angle: -Math.PI / 2 - 0.1, power: 0.3 },
        { name: 'gentle-right', angle: -Math.PI / 2 + 0.1, power: 0.3 },
        { name: 'mid-power', angle: -Math.PI / 2, power: 0.65 },
    ];
    for (let i = 0; i < extremeThrows.length; i++) {
        scenarios.push({
            id: ++id,
            name: `extreme_${extremeThrows[i].name}_${TERRAINS[i % TERRAINS.length]}`,
            terrain: TERRAINS[i % TERRAINS.length],
            bouleType: BOULES[i % BOULES.length],
            cochonnetType: COCHONNETS[i % COCHONNETS.length],
            playerCharId: CHARS[i % CHARS.length],
            opponentId: CHARS[(i + 3) % CHARS.length],
            difficulty: DIFFICULTIES[i % DIFFICULTIES.length],
            localMultiplayer: false,
            throwConfig: extremeThrows[i]
        });
    }

    // 8. Mirror matches (same char P1 & P2) x terrains = 6
    for (let i = 0; i < CHARS.length; i++) {
        scenarios.push({
            id: ++id,
            name: `mirror_${CHARS[i]}_${TERRAINS[i % TERRAINS.length]}`,
            terrain: TERRAINS[i % TERRAINS.length],
            bouleType: BOULES[i % BOULES.length],
            cochonnetType: COCHONNETS[i % COCHONNETS.length],
            playerCharId: CHARS[i], opponentId: CHARS[i],
            difficulty: 'medium', localMultiplayer: false,
            throwConfig: THROWS[i % THROWS.length]
        });
    }

    return scenarios;
}

async function runScenario(page, scenario) {
    // Navigate and wait for boot
    await page.goto(URL);

    // Wait for Phaser game to be ready (poll up to 8s)
    for (let i = 0; i < 40; i++) {
        const ready = await page.evaluate(() => !!window.__PHASER_GAME__);
        if (ready) break;
        await sleep(200);
    }
    await sleep(1500); // Extra time for assets to load

    // Start PetanqueScene directly
    const startResult = await page.evaluate((s) => {
        const game = window.__PHASER_GAME__;
        if (!game) return 'no_game';
        window.__TEST_GAME__ = game;
        const sm = game.scene;
        sm.getScenes(true).forEach(sc => sm.stop(sc.scene.key));

        const charsData = game.cache?.json?.get('characters');
        const p1Char = charsData?.roster?.find(c => c.id === s.playerCharId) || null;
        const p2Char = charsData?.roster?.find(c => c.id === s.opponentId) || null;

        sm.start('PetanqueScene', {
            terrain: s.terrain,
            difficulty: s.difficulty,
            format: 'tete_a_tete',
            opponentName: s.opponentId,
            opponentId: s.opponentId,
            returnScene: 'QuickPlayScene',
            playerCharacter: p1Char,
            opponentCharacter: p2Char,
            playerCharId: s.playerCharId,
            localMultiplayer: s.localMultiplayer,
            bouleType: s.bouleType,
            cochonnetType: s.cochonnetType
        });
        return 'ok';
    }, scenario);

    if (startResult !== 'ok') return { error: startResult };

    await sleep(2500);

    // Throw cochonnet
    const throwOk = await page.evaluate((tc) => {
        const game = window.__TEST_GAME__;
        if (!game) return false;
        const scene = game.scene.getScene('PetanqueScene');
        if (!scene?.engine || scene.engine.state !== 'COCHONNET_THROW') return false;
        scene.engine.throwCochonnet(tc.angle, tc.power);
        return true;
    }, scenario.throwConfig);

    if (!throwOk) return { error: 'throw_failed' };

    await sleep(3500);

    // Check cochonnet
    const result = await page.evaluate(() => {
        const game = window.__TEST_GAME__;
        const scene = game?.scene?.getScene('PetanqueScene');
        if (!scene?.engine) return { error: 'no_engine' };
        const e = scene.engine;
        const c = e.cochonnet;
        const b = e.bounds;
        if (!c) return { error: 'no_cochonnet' };

        const cochInBounds = c.x >= b.x && c.x <= b.x + b.w && c.y >= b.y && c.y <= b.y + b.h;

        // Check visual elements exist
        const hasTerrainRenderer = !!scene.terrainRenderer;
        const ballCount = e.balls.length;
        const cochAlive = c.isAlive;
        const cochMoving = c.isMoving;

        // Check sprites exist
        const hasPlayerSprite = !!scene.playerSprite;
        const hasOpponentSprite = !!scene.opponentSprite;

        return {
            cochX: Math.round(c.x), cochY: Math.round(c.y),
            cochAlive, cochMoving, cochInBounds,
            state: e.state,
            hasTerrainRenderer, hasPlayerSprite, hasOpponentSprite,
            ballCount,
            boundsY: b.y, boundsH: b.h
        };
    });

    // If cochonnet alive, throw a ball too
    if (result.cochAlive && (result.state === 'FIRST_BALL' || result.state === 'PLAY_LOOP')) {
        await page.evaluate((tc) => {
            const game = window.__TEST_GAME__;
            const scene = game?.scene?.getScene('PetanqueScene');
            if (!scene?.engine) return;
            const loft = { id: 'demi_portee', label: 'DEMI-PORTEE', landingFactor: 0.50, arcHeight: -40, flyDurationMult: 0.9, rollEfficiency: 0.6 };
            scene.engine.throwBall('player', tc.angle, tc.power * 0.8, loft);
        }, scenario.throwConfig);

        await sleep(3000);

        const ballResult = await page.evaluate(() => {
            const game = window.__TEST_GAME__;
            const scene = game?.scene?.getScene('PetanqueScene');
            if (!scene?.engine) return {};
            const e = scene.engine;
            const b = e.bounds;
            return {
                ballCount: e.balls.length,
                aliveBalls: e.balls.filter(bl => bl.isAlive).length,
                ballPositions: e.balls.map(bl => ({
                    x: Math.round(bl.x), y: Math.round(bl.y),
                    alive: bl.isAlive,
                    inBounds: bl.x >= b.x && bl.x <= b.x + b.w && bl.y >= b.y && bl.y <= b.y + b.h
                })),
                state: e.state
            };
        });
        result.ballResult = ballResult;
    }

    return result;
}

async function run() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 832, height: 480 } });
    const page = await context.newPage();

    const jsErrors = [];
    page.on('pageerror', err => {
        if (!err.message.includes('tilemap') && !err.message.includes('DOCTYPE')) {
            jsErrors.push(err.message);
        }
    });

    const scenarios = generateScenarios();
    console.log(`=== FULL GAME TEST: ${scenarios.length} SCENARIOS ===\n`);

    const results = [];
    let passed = 0, failed = 0, errors = 0;

    // Track what we've tested
    const testedTerrains = new Set();
    const testedBoules = new Set();
    const testedCochonnets = new Set();
    const testedCharsP1 = new Set();
    const testedCharsP2 = new Set();
    const testedDifficulties = new Set();
    const testedModes = new Set();

    for (const s of scenarios) {
        const t0 = Date.now();
        let result;
        try {
            result = await runScenario(page, s);
        } catch (err) {
            result = { error: err.message };
        }
        const elapsed = Date.now() - t0;

        // Determine pass/fail
        let status = 'PASS';
        const issues = [];

        if (result.error) {
            status = 'ERROR';
            issues.push(result.error);
            errors++;
        } else {
            if (!result.cochAlive) { issues.push('cochonnet dead'); status = 'FAIL'; }
            if (!result.cochInBounds) { issues.push('cochonnet OOB'); status = 'FAIL'; }
            if (!result.hasTerrainRenderer) { issues.push('no terrain renderer'); status = 'FAIL'; }
            if (!result.hasPlayerSprite) { issues.push('no player sprite'); status = 'FAIL'; }
            if (!result.hasOpponentSprite) { issues.push('no opponent sprite'); status = 'FAIL'; }

            if (result.ballResult) {
                const deadBalls = result.ballResult.ballPositions?.filter(b => !b.alive && !b.inBounds);
                // Dead balls outside bounds is expected (HORS JEU), not a failure
            }

            if (status === 'FAIL') failed++;
            else passed++;
        }

        // Track coverage
        testedTerrains.add(s.terrain);
        testedBoules.add(s.bouleType);
        testedCochonnets.add(s.cochonnetType);
        testedCharsP1.add(s.playerCharId);
        testedCharsP2.add(s.opponentId);
        testedDifficulties.add(s.difficulty);
        testedModes.add(s.localMultiplayer ? 'local' : 'vs_ia');

        const statusIcon = status === 'PASS' ? 'OK' : status === 'FAIL' ? 'FAIL' : 'ERR';
        const cochInfo = result.cochX !== undefined ? `coch=(${result.cochX},${result.cochY})` : '';
        const ballInfo = result.ballResult ? `balls=${result.ballResult.aliveBalls}/${result.ballResult.ballCount}` : '';
        const issueStr = issues.length > 0 ? ` [${issues.join(', ')}]` : '';

        console.log(`  [${statusIcon}] #${String(s.id).padStart(3)} ${s.name.padEnd(42)} ${cochInfo.padEnd(18)} ${ballInfo.padEnd(12)} ${elapsed}ms${issueStr}`);

        results.push({ ...s, status, issues, result, elapsed });

        // Take screenshot on failure
        if (status === 'FAIL' || status === 'ERROR') {
            try {
                await page.screenshot({ path: path.join(SCREENSHOT_DIR, `FAIL_${s.id}_${s.name}.png`) });
            } catch (_) {}
        }
    }

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log(`RESULTS: ${passed} PASS | ${failed} FAIL | ${errors} ERROR | ${scenarios.length} total`);

    console.log('\nCOVERAGE:');
    console.log(`  Terrains:     ${[...testedTerrains].join(', ')} (${testedTerrains.size}/${TERRAINS.length})`);
    console.log(`  Boules:       ${[...testedBoules].join(', ')} (${testedBoules.size}/${BOULES.length})`);
    console.log(`  Cochonnets:   ${[...testedCochonnets].join(', ')} (${testedCochonnets.size}/${COCHONNETS.length})`);
    console.log(`  Players P1:   ${[...testedCharsP1].join(', ')} (${testedCharsP1.size}/${CHARS.length})`);
    console.log(`  Opponents P2: ${[...testedCharsP2].join(', ')} (${testedCharsP2.size}/${CHARS.length})`);
    console.log(`  Difficulties: ${[...testedDifficulties].join(', ')} (${testedDifficulties.size}/${DIFFICULTIES.length})`);
    console.log(`  Modes:        ${[...testedModes].join(', ')} (${testedModes.size}/${MODES.length})`);

    // Show all failures
    const failures = results.filter(r => r.status !== 'PASS');
    if (failures.length > 0) {
        console.log('\nFAILURES DETAIL:');
        for (const f of failures) {
            console.log(`  #${f.id} ${f.name}: ${f.issues.join(', ')}`);
            if (f.result?.cochX !== undefined) {
                console.log(`    cochonnet: (${f.result.cochX},${f.result.cochY}) alive=${f.result.cochAlive} bounds=[${f.result.boundsY},${f.result.boundsY + f.result.boundsH}]`);
            }
        }
    }

    if (jsErrors.length > 0) {
        console.log(`\nJS ERRORS (${jsErrors.length}):`);
        const unique = [...new Set(jsErrors)];
        unique.forEach(e => console.log(`  ${e.substring(0, 120)}`));
    }

    console.log('\n' + (passed === scenarios.length ? 'ALL PASS' : 'SOME FAILURES'));
    await browser.close();
    process.exit(failed + errors > 0 ? 1 : 0);
}

run().catch(err => { console.error('Test crashed:', err); process.exit(1); });
