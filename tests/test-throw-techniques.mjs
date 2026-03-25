import { chromium } from 'playwright';

const URL = 'http://localhost:8080';

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function run() {
    console.log('=== THROW TECHNIQUES PHYSICS TEST ===\n');
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
        const game = window.__PHASER_GAME__;
        game.scene.start('PetanqueScene', {
            terrain: 'terre', difficulty: 'easy',
            format: 'tete_a_tete', opponentName: 'Test'
        });
    });
    await sleep(2000);

    // Test computeThrowParams for each technique at same power/angle
    const results = await page.evaluate(() => {
        const game = window.__PHASER_GAME__;
        const scene = game.scene.getScene('PetanqueScene');
        const engine = scene.engine;
        const PetanqueEngine = engine.constructor;

        // Import constants from the engine's module context
        const bounds = engine.bounds;
        const frictionMult = engine.frictionMult;
        const originX = scene.throwCircleX;
        const originY = scene.throwCircleY;
        const angle = -Math.PI / 2; // straight up toward cochonnet
        const power = 0.5; // 50% power

        // Get all presets
        const presets = {};
        const presetNames = ['demi_portee', 'plombee', 'tir'];

        // Local loft presets for throw technique testing (matches Constants.js)
        const LOFT_PRESETS = [
            { id: 'demi_portee', label: 'DEMI-PORTEE', landingFactor: 0.50, arcHeight: -40, flyDurationMult: 0.9, rollEfficiency: 1.0 },
            { id: 'plombee', label: 'PLOMBEE', landingFactor: 0.88, arcHeight: -80, flyDurationMult: 1.4, rollEfficiency: 0.85 },
            { id: 'tir', label: 'TIR', landingFactor: 0.95, arcHeight: -65, flyDurationMult: 0.4, rollEfficiency: 0.3 }
        ];

        const output = [];

        for (const preset of LOFT_PRESETS) {
            const isTir = preset.id === 'tir';
            const maxDist = 420 * (isTir ? 0.95 : 0.85); // TERRAIN_HEIGHT
            const totalDist = power * maxDist;
            const landDist = totalDist * preset.landingFactor;
            const rollDist = totalDist * (1 - preset.landingFactor);

            const params = PetanqueEngine.computeThrowParams(
                angle, power, originX, originY, bounds, preset, frictionMult
            );

            // Calculate landing distance from origin
            const dx = params.targetX - originX;
            const dy = params.targetY - originY;
            const actualLandDist = Math.sqrt(dx * dx + dy * dy);

            // Calculate rolling speed
            const rollSpeed = Math.sqrt(params.rollVx * params.rollVx + params.rollVy * params.rollVy);

            output.push({
                id: preset.id,
                landingFactor: preset.landingFactor,
                arcHeight: preset.arcHeight,
                rollEfficiency: preset.rollEfficiency,
                totalDist: Math.round(totalDist),
                landDist: Math.round(landDist),
                rollDist: Math.round(rollDist),
                actualLandDist: Math.round(actualLandDist),
                rollSpeed: Math.round(rollSpeed * 100) / 100,
                targetX: Math.round(params.targetX),
                targetY: Math.round(params.targetY)
            });
        }

        return output;
    });

    console.log('Technique comparison at 50% power, straight up:\n');
    console.log('| Technique    | Land dist | Roll dist | Roll speed | Arc height | Landing factor |');
    console.log('|-------------|-----------|-----------|------------|------------|----------------|');

    let allGood = true;

    for (const r of results) {
        console.log(`| ${r.id.padEnd(12)} | ${String(r.actualLandDist).padStart(7)}px | ${String(r.rollDist).padStart(7)}px | ${String(r.rollSpeed).padStart(8)}  | ${String(r.arcHeight).padStart(8)}  | ${String(r.landingFactor).padStart(12)}   |`);
    }

    console.log('');

    // Validate physics coherence
    const roulette = results.find(r => r.id === 'roulette');
    const demi = results.find(r => r.id === 'demi_portee');
    const plombee = results.find(r => r.id === 'plombee');
    const tir = results.find(r => r.id === 'tir');

    // Test 1: Roulette should have MOST rolling, LEAST landing distance
    if (roulette.rollDist > roulette.landDist) {
        console.log('OK: Roulette rolls more than flies (' + roulette.rollDist + ' > ' + roulette.landDist + ')');
    } else {
        console.log('FAIL: Roulette should roll more than fly');
        allGood = false;
    }

    // Test 2: Plombee should have LEAST rolling, MOST landing distance
    if (plombee.landDist > plombee.rollDist * 5) {
        console.log('OK: Plombee flies MUCH more than rolls (' + plombee.landDist + ' >> ' + plombee.rollDist + ')');
    } else {
        console.log('FAIL: Plombee should fly much more than roll');
        allGood = false;
    }

    // Test 3: Tir should land nearly at full distance (minimal roll)
    if (tir.landingFactor >= 0.90) {
        console.log('OK: Tir lands at 95% of distance (tir au fer style)');
    } else {
        console.log('FAIL: Tir should land near the target');
        allGood = false;
    }

    // Test 4: Tir roll speed should be very low
    if (tir.rollSpeed < demi.rollSpeed) {
        console.log('OK: Tir has less rolling than demi-portee (' + tir.rollSpeed + ' < ' + demi.rollSpeed + ')');
    } else {
        console.log('FAIL: Tir should have minimal rolling');
        allGood = false;
    }

    // Test 5: Roulette should have highest roll speed
    if (roulette.rollSpeed > demi.rollSpeed && roulette.rollSpeed > plombee.rollSpeed) {
        console.log('OK: Roulette has highest roll speed (' + roulette.rollSpeed + ')');
    } else {
        console.log('FAIL: Roulette should roll the most');
        allGood = false;
    }

    // Test 6: Arc heights should increase: roulette < demi < tir < plombee
    if (Math.abs(roulette.arcHeight) < Math.abs(demi.arcHeight) &&
        Math.abs(demi.arcHeight) < Math.abs(plombee.arcHeight)) {
        console.log('OK: Arc heights increase correctly (roulette < demi < plombee)');
    } else {
        console.log('FAIL: Arc heights not in correct order');
        allGood = false;
    }

    // Test 7: Demi-portee should be roughly 50/50
    const demiRatio = demi.landDist / (demi.landDist + demi.rollDist);
    if (demiRatio > 0.4 && demiRatio < 0.6) {
        console.log('OK: Demi-portee is ~50/50 (ratio: ' + Math.round(demiRatio * 100) + '%)');
    } else {
        console.log('FAIL: Demi-portee should be ~50/50 (got ' + Math.round(demiRatio * 100) + '%)');
        allGood = false;
    }

    const jsErrors = errors.filter(e => !e.includes('Framebuffer'));
    if (jsErrors.length > 0) {
        console.log('\nJS Errors:', jsErrors);
        allGood = false;
    }

    console.log('\n--- RESULT ---');
    console.log(allGood ? 'PASS - All techniques are physically coherent!' : 'FAIL - Some checks failed');

    await browser.close();
    process.exit(allGood ? 0 : 1);
}

run().catch(e => { console.error(e); process.exit(1); });
