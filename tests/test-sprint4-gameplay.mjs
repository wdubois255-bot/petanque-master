import { chromium } from 'playwright';

const URL = 'http://localhost:8080';
const errors = [];

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function run() {
    console.log('=== SPRINT 4 GAMEPLAY TEST ===\n');
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 832, height: 480 } });

    page.on('pageerror', e => errors.push(e.message));
    page.on('console', msg => {
        if (msg.type() === 'error') errors.push(msg.text());
    });

    // 1. Load game and get to petanque scene
    console.log('1. Loading game...');
    await page.goto(URL, { waitUntil: 'networkidle' });
    await sleep(2000);
    await page.click('canvas');
    await sleep(500);

    // Start new game -> get to overworld
    console.log('2. Starting new game...');
    await page.click('canvas', { position: { x: 416, y: 300 } });
    await sleep(1000);

    // Skip intro dialogue
    for (let i = 0; i < 20; i++) {
        await page.click('canvas');
        await sleep(200);
    }
    await sleep(1000);

    // Walk to trigger a battle (go down to route 1, find NPC)
    // Instead, directly start petanque scene via console for faster testing
    console.log('3. Launching PetanqueScene directly...');
    await page.evaluate(() => {
        const game = window.__PHASER_GAME__;
        if (game) {
            game.scene.start('PetanqueScene', {
                terrain: 'terre',
                difficulty: 'easy',
                format: 'tete_a_tete',
                opponentName: 'Test Marcel'
            });
        }
    });
    await sleep(2000);

    // 4. Check no JS errors so far
    console.log('4. Checking for errors after scene load...');
    const jsErrors = errors.filter(e => !e.includes('Framebuffer'));
    if (jsErrors.length > 0) {
        console.log('   ERRORS:', jsErrors);
    } else {
        console.log('   No errors: OK');
    }

    // 5. Verify scene is loaded by checking for text elements
    const sceneText = await page.evaluate(() => {
        const game = window.__PHASER_GAME__;
        if (!game) return 'no game';
        const scene = game.scene.getScene('PetanqueScene');
        if (!scene) return 'no scene';
        return {
            engineState: scene.engine?.state,
            terrainType: scene.terrainType,
            hasAiming: !!scene.aimingSystem,
            hasScorePanel: !!scene.scorePanel,
            hasImpactLayer: !!scene.impactLayer,
            playerSpriteExists: !!scene.playerSprite,
            opponentSpriteExists: !!scene.opponentSprite
        };
    });
    console.log('5. Scene state:', JSON.stringify(sceneText));

    // 6. Throw cochonnet (drag from center to upper area)
    console.log('6. Throwing cochonnet...');
    await page.mouse.move(416, 430);
    await page.mouse.down();
    await page.mouse.move(416, 300, { steps: 10 });
    await page.mouse.up();
    await sleep(2000);

    // 7. Check that shot mode choice appears (4 buttons)
    const afterCochonnet = await page.evaluate(() => {
        const game = window.__PHASER_GAME__;
        const scene = game.scene.getScene('PetanqueScene');
        return {
            engineState: scene.engine?.state,
            aimingEnabled: scene.engine?.aimingEnabled,
            hasModeUI: scene.aimingSystem?._modeUI?.length > 0,
            modeUICount: scene.aimingSystem?._modeUI?.length || 0
        };
    });
    console.log('7. After cochonnet:', JSON.stringify(afterCochonnet));

    // 8. Select ROULETTE (click first button position)
    console.log('8. Selecting ROULETTE...');
    await page.evaluate(() => {
        const game = window.__PHASER_GAME__;
        const scene = game.scene.getScene('PetanqueScene');
        if (scene.aimingSystem._combinedBtns) {
            scene.aimingSystem._selectCombined(0); // ROULETTE
        }
    });
    await sleep(500);

    const afterSelect = await page.evaluate(() => {
        const game = window.__PHASER_GAME__;
        const scene = game.scene.getScene('PetanqueScene');
        return {
            shotMode: scene.aimingSystem?.shotMode,
            loftPreset: scene.aimingSystem?.loftPreset?.id,
            aimingEnabled: scene.engine?.aimingEnabled
        };
    });
    console.log('   Shot mode:', JSON.stringify(afterSelect));

    // 9. Throw ball 1 with roulette
    console.log('9. Throwing ball 1 (ROULETTE)...');
    await page.mouse.move(416, 430);
    await page.mouse.down();
    await page.mouse.move(416, 330, { steps: 10 });
    await page.mouse.up();
    await sleep(3000);

    // 10. Wait for AI turn + check opponent moves to circle
    console.log('10. Waiting for AI turn...');
    await sleep(3000);

    // 11. Check engine state after full turn cycle
    const midGame = await page.evaluate(() => {
        const game = window.__PHASER_GAME__;
        const scene = game.scene.getScene('PetanqueScene');
        return {
            engineState: scene.engine?.state,
            currentTeam: scene.engine?.currentTeam,
            ballsAlive: scene.engine?.balls?.filter(b => b.isAlive).length,
            remainingPlayer: scene.engine?.remaining?.player,
            remainingOpponent: scene.engine?.remaining?.opponent
        };
    });
    console.log('11. Mid-game state:', JSON.stringify(midGame));

    // 12. If it's player turn, try PLOMBEE
    if (midGame.currentTeam === 'player' && midGame.remainingPlayer > 0) {
        console.log('12. Selecting PLOMBEE for ball 2...');
        await page.evaluate(() => {
            const game = window.__PHASER_GAME__;
            const scene = game.scene.getScene('PetanqueScene');
            if (scene.aimingSystem._combinedBtns) {
                scene.aimingSystem._selectCombined(2); // PLOMBEE
            }
        });
        await sleep(500);

        const plombeeCheck = await page.evaluate(() => {
            const game = window.__PHASER_GAME__;
            const scene = game.scene.getScene('PetanqueScene');
            return {
                shotMode: scene.aimingSystem?.shotMode,
                loftPreset: scene.aimingSystem?.loftPreset?.id,
                arcHeight: scene.aimingSystem?.loftPreset?.arcHeight
            };
        });
        console.log('    Plombee config:', JSON.stringify(plombeeCheck));

        // Throw with plombee
        await page.mouse.move(416, 430);
        await page.mouse.down();
        await page.mouse.move(416, 340, { steps: 10 });
        await page.mouse.up();
        await sleep(3000);
    }

    // 13. Check for TIR availability
    await sleep(2000);
    const canTir = await page.evaluate(() => {
        const game = window.__PHASER_GAME__;
        const scene = game.scene.getScene('PetanqueScene');
        const hasBtns = scene.aimingSystem?._combinedBtns?.length === 4;
        return {
            hasFourButtons: hasBtns,
            currentTeam: scene.engine?.currentTeam,
            state: scene.engine?.state,
            remainingPlayer: scene.engine?.remaining?.player
        };
    });
    console.log('13. TIR availability:', JSON.stringify(canTir));

    // Final error check
    console.log('\n--- ERRORS ---');
    const finalErrors = errors.filter(e => !e.includes('Framebuffer'));
    if (finalErrors.length > 0) {
        finalErrors.forEach(e => console.log('  ', e));
    } else {
        console.log('No errors!');
    }

    console.log('\n--- RESULT ---');
    const pass = finalErrors.length === 0;
    console.log(pass ? 'PASS' : 'FAIL');

    await browser.close();
    console.log('Done.');
    process.exit(pass ? 0 : 1);
}

run().catch(e => {
    console.error(e);
    process.exit(1);
});
