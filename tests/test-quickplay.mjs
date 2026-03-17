/**
 * Playwright test: Quick Play mode - boules, cochonnets, terrain, sprites
 * Tests via Partie Rapide (not Arcade)
 */
import { chromium } from 'playwright';
import fs from 'fs';

fs.mkdirSync('tests/screenshots', { recursive: true });

const URL = 'http://localhost:8080';
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function test() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage({ viewport: { width: 1024, height: 600 } });

    console.log('=== Test: Partie Rapide - Boules & Cochonnets ===\n');
    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    await sleep(3000);

    // === 1: Verify all assets loaded ===
    console.log('--- 1: Asset verification ---');
    const assets = await page.evaluate(() => {
        const game = window.__PHASER_GAME__;
        const keys = [
            'ball_acier', 'ball_bronze', 'ball_chrome', 'ball_noire', 'ball_rouge',
            'ball_cochonnet', 'ball_cochonnet_bleu', 'ball_cochonnet_vert',
            'terrain_caillou_1', 'terrain_caillou_2', 'terrain_racine',
            'terrain_herbe_touffe', 'terrain_fissure', 'terrain_planche_bord'
        ];
        return keys.map(k => ({ key: k, loaded: game.textures.exists(k) }));
    });
    for (const a of assets) {
        console.log(`  ${a.loaded ? '✅' : '❌'} ${a.key}`);
    }

    // === 2: Navigate to Partie Rapide (second menu item) ===
    console.log('\n--- 2: Navigate to Partie Rapide ---');
    await page.keyboard.press('ArrowDown'); // from Mode Arcade to Partie Rapide
    await sleep(200);
    await page.keyboard.press('Space');
    await sleep(1000);

    const scene = await page.evaluate(() => {
        const game = window.__PHASER_GAME__;
        return game.scene.scenes.filter(s => s.scene.isActive()).map(s => s.constructor.name);
    });
    console.log(`  Active: ${scene.join(', ')}`);

    // === 3: Check QuickPlay options (boules + cochonnet rows) ===
    console.log('\n--- 3: QuickPlay options ---');
    await page.screenshot({ path: 'tests/screenshots/quickplay_menu.png' });
    console.log('  Screenshot: quickplay_menu.png');

    // Navigate: select boule noire (row 3, press right 3 times = acier→bronze→chrome→noire)
    // First navigate to boules row
    await page.keyboard.press('ArrowDown'); // Mode → P1
    await sleep(100);
    await page.keyboard.press('ArrowDown'); // P1 → P2
    await sleep(100);
    await page.keyboard.press('ArrowDown'); // P2 → Boules
    await sleep(100);
    await page.keyboard.press('ArrowRight'); // Acier → Bronze
    await sleep(100);
    await page.keyboard.press('ArrowRight'); // Bronze → Chrome
    await sleep(100);
    await page.keyboard.press('ArrowRight'); // Chrome → Noire
    await sleep(200);

    // Navigate to cochonnet row
    await page.keyboard.press('ArrowDown'); // Boules → Cochonnet
    await sleep(100);
    await page.keyboard.press('ArrowRight'); // Classique → Bleu
    await sleep(200);

    await page.screenshot({ path: 'tests/screenshots/quickplay_boule_noire_cochonnet_bleu.png' });
    console.log('  Selected: Boule Noire + Cochonnet Bleu');

    // === 4: Navigate to JOUER and launch ===
    console.log('\n--- 4: Launch match ---');
    // Navigate down to terrain, then difficulty, then JOUER
    await page.keyboard.press('ArrowDown'); // Cochonnet → Terrain
    await sleep(100);
    await page.keyboard.press('ArrowDown'); // Terrain → Difficulty
    await sleep(100);
    await page.keyboard.press('ArrowDown'); // Difficulty → JOUER
    await sleep(100);
    await page.keyboard.press('Space'); // Confirm JOUER
    await sleep(3000);

    // === 5: Verify PetanqueScene ===
    console.log('\n--- 5: Verify PetanqueScene ---');
    const matchData = await page.evaluate(() => {
        const game = window.__PHASER_GAME__;
        const ps = game.scene.getScene('PetanqueScene');
        if (!ps || !ps.scene.isActive()) {
            return { active: false, scenes: game.scene.scenes.filter(s => s.scene.isActive()).map(s => s.constructor.name) };
        }
        return {
            active: true,
            playerCharId: ps.playerCharId,
            opponentId: ps.opponentId,
            bouleType: ps.bouleType,
            cochonnetType: ps.cochonnetType,
            terrainType: ps.terrainType
        };
    });

    if (matchData.active) {
        console.log(`  Player: ${matchData.playerCharId}`);
        console.log(`  Opponent: ${matchData.opponentId}`);
        console.log(`  Boule: ${matchData.bouleType}`);
        console.log(`  Cochonnet: ${matchData.cochonnetType}`);
        console.log(`  Terrain: ${matchData.terrainType}`);
    } else {
        console.log(`  ⚠ PetanqueScene not active. Active: ${matchData.scenes?.join(', ')}`);
    }

    await page.screenshot({ path: 'tests/screenshots/quickplay_match.png' });
    console.log('  Screenshot: quickplay_match.png');

    // Wait for gameplay
    await sleep(3000);
    await page.screenshot({ path: 'tests/screenshots/quickplay_gameplay.png' });

    console.log('\n=== Tests complete ===');
    await sleep(5000);
    await browser.close();
}

test().catch(err => { console.error('TEST ERROR:', err); process.exit(1); });
