/**
 * Playwright test: terrain visuals + cochonnet stays in bounds
 * Run: node tests/terrain-test.mjs
 */
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const URL = 'http://localhost:5174';
const SCREENSHOT_DIR = path.resolve('tests/screenshots');
const TERRAINS = ['terre', 'herbe', 'sable', 'dalles', 'colline'];

if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function run() {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({ viewport: { width: 832, height: 480 } });
    const page = await context.newPage();

    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    console.log('=== TERRAIN & COCHONNET TEST ===\n');

    const results = [];

    for (const terrain of TERRAINS) {
        console.log(`--- ${terrain.toUpperCase()} ---`);
        await page.goto(URL);
        await sleep(2500);

        // Start PetanqueScene directly via engine
        await page.evaluate((t) => {
            // Find game instance
            const canvases = document.querySelectorAll('canvas');
            let game = null;
            for (const c of canvases) {
                // Phaser stores game ref on the canvas parent
                if (c.parentElement && c.parentElement.children.length > 0) {
                    // Try global
                    game = window.game || window.__PHASER_GAME__;
                    if (!game) {
                        // Phaser 3 stores game instance - try to find via Phaser.GAMES
                        const Phaser = window.Phaser;
                        if (Phaser && Phaser.GAMES && Phaser.GAMES.length > 0) {
                            game = Phaser.GAMES[0];
                        }
                    }
                }
            }
            if (!game) return;
            window.__TEST_GAME__ = game;
            const sm = game.scene;
            sm.getScenes(true).forEach(s => sm.stop(s.scene.key));
            sm.start('PetanqueScene', {
                terrain: t,
                difficulty: 'easy',
                format: 'tete_a_tete',
                opponentName: 'Test Bot',
                returnScene: 'QuickPlayScene',
                playerCharId: 'equilibre',
                opponentId: 'pointeur',
                bouleType: 'acier',
                cochonnetType: 'classique'
            });
        }, terrain);

        await sleep(3000);

        // Screenshot terrain
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${terrain}_terrain.png`) });
        console.log(`  Screenshot: ${terrain}_terrain.png`);

        // Throw cochonnet programmatically via engine
        const throwResult = await page.evaluate(() => {
            const game = window.__TEST_GAME__ || window.Phaser?.GAMES?.[0];
            if (!game) return { error: 'no_game' };
            const scene = game.scene.getScene('PetanqueScene');
            if (!scene?.engine) return { error: 'no_engine' };
            const engine = scene.engine;
            if (engine.state !== 'COCHONNET_THROW') return { error: 'wrong_state', state: engine.state };

            // Throw cochonnet straight up with 50% power
            const angle = -Math.PI / 2; // straight up
            const power = 0.5;
            engine.throwCochonnet(angle, power);
            return { ok: true, state: engine.state };
        });
        console.log(`  Throw: ${JSON.stringify(throwResult)}`);

        // Wait for cochonnet to land and stop
        await sleep(4000);

        // Screenshot after cochonnet
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${terrain}_cochonnet.png`) });

        // Check cochonnet status
        const status = await page.evaluate((t) => {
            const game = window.__TEST_GAME__ || window.Phaser?.GAMES?.[0];
            if (!game) return { error: 'no_game' };
            const scene = game.scene.getScene('PetanqueScene');
            if (!scene?.engine) return { error: 'no_engine' };
            const c = scene.engine.cochonnet;
            const b = scene.engine.bounds;
            if (!c) return { error: 'no_cochonnet' };
            return {
                x: Math.round(c.x), y: Math.round(c.y),
                alive: c.isAlive, moving: c.isMoving,
                inBounds: c.x >= b.x && c.x <= b.x + b.w && c.y >= b.y && c.y <= b.y + b.h,
                state: scene.engine.state,
                terrain: t
            };
        }, terrain);

        const pass = status.alive && status.inBounds;
        console.log(`  Cochonnet: (${status.x},${status.y}) alive=${status.alive} inBounds=${status.inBounds} state=${status.state}`);
        console.log(`  ${pass ? 'PASS' : 'FAIL'}\n`);
        results.push({ terrain, ...status, pass });

        // Also throw a ball to test gameplay
        if (status.alive && (status.state === 'FIRST_BALL' || status.state === 'PLAY_LOOP')) {
            await page.evaluate(() => {
                const game = window.__TEST_GAME__ || window.Phaser?.GAMES?.[0];
                const scene = game?.scene?.getScene('PetanqueScene');
                if (!scene?.engine) return;
                const engine = scene.engine;
                // Throw ball toward cochonnet
                const angle = -Math.PI / 2;
                const power = 0.4;
                if (engine.state === 'FIRST_BALL' || engine.state === 'PLAY_LOOP') {
                    // Use AimingSystem-like approach: call throwBall
                    const loft = { id: 'demi_portee', label: 'DEMI-PORTEE', landingFactor: 0.50, arcHeight: -40, flyDurationMult: 0.9, rollEfficiency: 0.6 };
                    engine.throwBall('player', angle, power, loft);
                }
            });
            await sleep(4000);
            await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${terrain}_ball.png`) });
            console.log(`  Ball thrown! Screenshot: ${terrain}_ball.png`);

            // Check if ball stayed in bounds
            const ballStatus = await page.evaluate(() => {
                const game = window.__TEST_GAME__ || window.Phaser?.GAMES?.[0];
                const scene = game?.scene?.getScene('PetanqueScene');
                if (!scene?.engine) return {};
                const balls = scene.engine.balls;
                return {
                    total: balls.length,
                    alive: balls.filter(b => b.isAlive).length,
                    positions: balls.map(b => ({ x: Math.round(b.x), y: Math.round(b.y), alive: b.isAlive })),
                    state: scene.engine.state
                };
            });
            console.log(`  Balls: ${ballStatus.alive}/${ballStatus.total} alive, state=${ballStatus.state}\n`);
        }
    }

    // Summary
    console.log('=== SUMMARY ===');
    let allPass = true;
    for (const r of results) {
        const icon = r.pass ? 'PASS' : 'FAIL';
        console.log(`  ${icon}: ${r.terrain} - cochonnet (${r.x},${r.y}) alive=${r.alive}`);
        if (!r.pass) allPass = false;
    }

    if (errors.length > 0) {
        console.log('\n=== JS ERRORS (non-tilemap) ===');
        const filtered = errors.filter(e => !e.includes('tilemap') && !e.includes('DOCTYPE'));
        filtered.forEach(e => console.log(`  ${e}`));
    }

    console.log(`\nOverall: ${allPass ? 'ALL PASS' : 'SOME FAILURES'}`);
    console.log('Closing in 3s...');
    await sleep(3000);
    await browser.close();
    process.exit(allPass ? 0 : 1);
}

run().catch(err => { console.error('Test crashed:', err); process.exit(1); });
