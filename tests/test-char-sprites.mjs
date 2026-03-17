/**
 * Playwright test: validate character selection → match sprite display
 * Verifies that the selected character sprite appears correctly in PetanqueScene
 */
import { chromium } from 'playwright';

const URL = 'http://localhost:8080';
const TIMEOUT = 8000;

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function test() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage({ viewport: { width: 1024, height: 600 } });

    console.log('=== Test: Character Selection → Match Sprite ===\n');

    // Navigate
    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    await sleep(3000); // Wait for Phaser boot + assets

    // Access Phaser game
    const gameReady = await page.evaluate(() => !!window.__PHASER_GAME__?.scene?.scenes?.length);
    console.log(`Game ready: ${gameReady}`);
    if (!gameReady) { console.error('FAIL: Game not loaded'); await browser.close(); process.exit(1); }

    // === TEST 1: All 6 sprites loaded ===
    console.log('\n--- Test 1: All character sprites loaded ---');
    const spriteKeys = await page.evaluate(() => {
        const game = window.__PHASER_GAME__;
        const expected = ['rene_animated', 'marcel_animated', 'fanny_animated', 'ricardo_animated', 'thierry_animated', 'marius_animated'];
        return expected.map(key => ({
            key,
            exists: game.textures.exists(key),
            frames: game.textures.exists(key) ? game.textures.get(key).frameTotal : 0
        }));
    });

    let allLoaded = true;
    for (const s of spriteKeys) {
        const status = s.exists ? `✅ ${s.frames} frames` : '❌ MISSING';
        console.log(`  ${s.key}: ${status}`);
        if (!s.exists) allLoaded = false;
    }

    // === TEST 2: Navigate to Arcade mode → CharSelect ===
    console.log('\n--- Test 2: Navigate to Character Selection ---');

    // Press Space to select "Mode Arcade" (first menu item)
    await page.keyboard.press('Space');
    await sleep(1000);

    const currentScene = await page.evaluate(() => {
        const game = window.__PHASER_GAME__;
        return game.scene.scenes.filter(s => s.scene.isActive()).map(s => s.constructor.name);
    });
    console.log(`  Active scenes: ${currentScene.join(', ')}`);

    // === TEST 3: Select different characters and verify sprite mapping ===
    console.log('\n--- Test 3: Character sprite mapping ---');

    // In CharSelectScene, check that sprites display correctly
    const charMapping = await page.evaluate(() => {
        const game = window.__PHASER_GAME__;
        const charSelect = game.scene.getScene('CharSelectScene');
        if (!charSelect || !charSelect.scene.isActive()) return null;

        // Get all cells
        return charSelect._cells?.map(cell => ({
            name: cell.char?.name,
            id: cell.char?.id,
            isLocked: cell.isLocked,
            spriteKey: charSelect._getCharSpriteKey?.(cell.char),
            spriteExists: game.textures.exists(charSelect._getCharSpriteKey?.(cell.char) || '')
        }));
    });

    if (charMapping) {
        for (const c of charMapping) {
            const status = c.spriteExists ? '✅' : '❌';
            console.log(`  ${status} ${c.name} (${c.id}) → ${c.spriteKey} ${c.isLocked ? '[LOCKED]' : ''}`);
        }
    } else {
        console.log('  ⚠ CharSelectScene not active, trying to navigate...');
    }

    // === TEST 4: Select a character (navigate to third = Fanny) and start match ===
    console.log('\n--- Test 4: Select Fanny → verify in match ---');

    // Press right twice to select Fanny (index 2)
    await page.keyboard.press('ArrowRight');
    await sleep(200);
    await page.keyboard.press('ArrowRight');
    await sleep(200);

    // Verify selection before confirming
    const selectedChar = await page.evaluate(() => {
        const game = window.__PHASER_GAME__;
        const charSelect = game.scene.getScene('CharSelectScene');
        if (!charSelect) return null;
        const cells = charSelect._cells?.filter(c => !c.isLocked);
        const idx = charSelect._selectedIndex;
        return cells?.[idx]?.char?.id;
    });
    console.log(`  Selected character: ${selectedChar}`);

    // Confirm selection
    await page.keyboard.press('Space');
    await sleep(2000); // Wait for ArcadeScene → VSIntro → PetanqueScene transition

    // Press Space through any intermediate screens
    await page.keyboard.press('Space');
    await sleep(2000);
    await page.keyboard.press('Space');
    await sleep(2000);

    // === TEST 5: Verify sprites in PetanqueScene ===
    console.log('\n--- Test 5: Verify sprites in PetanqueScene ---');

    const matchSprites = await page.evaluate(() => {
        const game = window.__PHASER_GAME__;
        const petanque = game.scene.getScene('PetanqueScene');
        if (!petanque || !petanque.scene.isActive()) {
            return { active: false, scenes: game.scene.scenes.filter(s => s.scene.isActive()).map(s => s.constructor.name) };
        }

        return {
            active: true,
            playerCharId: petanque.playerCharId,
            opponentId: petanque.opponentId,
            playerSpriteKey: petanque.playerSprite?.texture?.key,
            opponentSpriteKey: petanque.opponentSprite?.texture?.key,
            playerSpriteExists: game.textures.exists('petanque_player'),
            opponentSpriteExists: game.textures.exists('petanque_opponent'),
            opponentName: petanque.opponentName
        };
    });

    if (matchSprites.active) {
        console.log(`  Player charId: ${matchSprites.playerCharId}`);
        console.log(`  Opponent charId: ${matchSprites.opponentId}`);
        console.log(`  Player sprite: ${matchSprites.playerSpriteKey} (${matchSprites.playerSpriteExists ? '✅' : '❌'})`);
        console.log(`  Opponent sprite: ${matchSprites.opponentSpriteKey} (${matchSprites.opponentSpriteExists ? '✅' : '❌'})`);
        console.log(`  Opponent name: ${matchSprites.opponentName}`);

        // Verify the selected character is actually the player
        if (selectedChar && matchSprites.playerCharId === selectedChar) {
            console.log(`  ✅ Player character matches selection!`);
        } else {
            console.log(`  ❌ MISMATCH: selected ${selectedChar} but got ${matchSprites.playerCharId}`);
        }
    } else {
        console.log(`  ⚠ PetanqueScene not active yet. Active: ${matchSprites.scenes?.join(', ')}`);
        // Try pressing space a few more times
        for (let i = 0; i < 3; i++) {
            await page.keyboard.press('Space');
            await sleep(1500);
        }

        const retry = await page.evaluate(() => {
            const game = window.__PHASER_GAME__;
            const petanque = game.scene.getScene('PetanqueScene');
            if (!petanque || !petanque.scene.isActive()) {
                return { active: false, scenes: game.scene.scenes.filter(s => s.scene.isActive()).map(s => s.constructor.name) };
            }
            return {
                active: true,
                playerCharId: petanque.playerCharId,
                opponentId: petanque.opponentId,
                playerSpriteKey: petanque.playerSprite?.texture?.key,
                opponentSpriteKey: petanque.opponentSprite?.texture?.key,
            };
        });

        if (retry.active) {
            console.log(`  [retry] Player: ${retry.playerCharId} (${retry.playerSpriteKey})`);
            console.log(`  [retry] Opponent: ${retry.opponentId} (${retry.opponentSpriteKey})`);
        } else {
            console.log(`  [retry] Still not in PetanqueScene. Active: ${retry.scenes?.join(', ')}`);
        }
    }

    // === TEST 6: Take screenshot for visual verification ===
    console.log('\n--- Test 6: Screenshots ---');
    await page.screenshot({ path: 'tests/screenshots/match_sprites.png', fullPage: false });
    console.log('  Saved: tests/screenshots/match_sprites.png');

    // Wait a bit then take another during gameplay
    await sleep(3000);
    await page.screenshot({ path: 'tests/screenshots/match_gameplay.png', fullPage: false });
    console.log('  Saved: tests/screenshots/match_gameplay.png');

    console.log('\n=== Tests complete ===');

    // Keep browser open for 5s for visual inspection
    await sleep(5000);
    await browser.close();
}

// Ensure screenshots directory
import fs from 'fs';
fs.mkdirSync('tests/screenshots', { recursive: true });

test().catch(err => { console.error('TEST ERROR:', err); process.exit(1); });
