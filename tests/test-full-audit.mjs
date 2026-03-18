import { chromium } from 'playwright';

const PORT = 5200;
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1664, height: 960 } });

async function screenshot(name) {
    await page.screenshot({ path: `test-results/audit_${name}.png` });
    console.log(`  📸 ${name}`);
}

async function wait(ms) {
    await page.waitForTimeout(ms);
}

async function press(key, delay = 200) {
    await page.keyboard.press(key);
    await wait(delay);
}

console.log('=== AUDIT COMPLET PETANQUE MASTER ===\n');

// ==============================
// 1. BOOT & TITLE
// ==============================
console.log('--- 1. BOOT & TITLE ---');
await page.goto(`http://localhost:${PORT}`, { waitUntil: 'domcontentloaded' });
await wait(1500);
await screenshot('01_boot_loading');
await wait(3000);
await screenshot('02_title_screen');

// Test press start
await press('Space', 1000);
await screenshot('03_main_menu');

// ==============================
// 2. QUICK PLAY - Full flow with Le Magicien
// ==============================
console.log('\n--- 2. QUICK PLAY ---');
await press('ArrowDown'); // Partie Rapide
await press('Space', 1000);
await screenshot('04_quickplay_start');

// Select Player 1 = Le Magicien (7th char)
await press('ArrowDown'); // Row J1
for (let i = 0; i < 7; i++) await press('ArrowRight', 150);
await wait(300);
await screenshot('05_quickplay_magicien_p1');

// Select Player 2 = Ley (7th char)
await press('ArrowDown'); // Row J2
for (let i = 0; i < 6; i++) await press('ArrowRight', 150);
await wait(300);
await screenshot('06_quickplay_ley_p2');

// Set terrain to Terre
await press('ArrowDown'); // Boules
await press('ArrowDown'); // Cochonnet
await press('ArrowDown'); // Terrain - already Terre
await press('ArrowDown'); // Difficulte
await press('ArrowDown'); // JOUER button
await wait(300);
await screenshot('07_quickplay_ready');

// Launch game
await press('Space', 500);
await screenshot('08_vs_intro');

// Wait for VS screen auto-advance or skip
await wait(3000);
await screenshot('09_petanque_start');

// ==============================
// 3. PETANQUE SCENE - Gameplay audit
// ==============================
console.log('\n--- 3. PETANQUE SCENE ---');
await wait(2000);
await screenshot('10_petanque_cochonnet_phase');

// Check sprite positions - take multiple screenshots during gameplay
// Throw cochonnet by clicking and dragging
const canvas = await page.$('canvas');
const box = await canvas.boundingBox();
const centerX = box.x + box.width / 2;
const centerY = box.y + box.height * 0.85; // near throw circle

// Drag to throw cochonnet
await page.mouse.move(centerX, centerY);
await page.mouse.down();
await page.mouse.move(centerX, centerY - 100, { steps: 10 });
await wait(200);
await page.mouse.up();
await wait(2000);
await screenshot('11_after_cochonnet_throw');

// Now first ball - check sprite positions
await wait(1500);
await screenshot('12_first_ball_phase');

// Throw first ball
await page.mouse.move(centerX, centerY);
await page.mouse.down();
await page.mouse.move(centerX - 20, centerY - 80, { steps: 10 });
await wait(200);
await page.mouse.up();
await wait(3000);
await screenshot('13_after_first_ball');

// Wait for AI turn + throw
await wait(4000);
await screenshot('14_after_ai_turn');

// Continue for a few more turns
for (let turn = 0; turn < 3; turn++) {
    // Check if it's player turn (try to throw)
    await wait(2000);
    await screenshot(`15_turn_${turn}_before`);

    // Try a throw
    await page.mouse.move(centerX + (Math.random() - 0.5) * 30, centerY);
    await page.mouse.down();
    await page.mouse.move(centerX + (Math.random() - 0.5) * 40, centerY - 60 - Math.random() * 40, { steps: 8 });
    await wait(150);
    await page.mouse.up();
    await wait(4000);
    await screenshot(`16_turn_${turn}_after`);
}

// Check TAB ranking
await page.keyboard.down('Tab');
await wait(500);
await screenshot('17_tab_ranking');
await page.keyboard.up('Tab');

// Final state
await wait(2000);
await screenshot('18_game_state_final');

// ==============================
// 4. CHAR SELECT - Verify all 8 characters
// ==============================
console.log('\n--- 4. CHAR SELECT (Arcade) ---');
// Restart to title
await page.goto(`http://localhost:${PORT}`, { waitUntil: 'domcontentloaded' });
await wait(5000);
await press('Space', 1000); // to menu
await press('Space', 1000); // Mode Arcade -> CharSelect

// Screenshot each character
const charNames = ['rene', 'marcel', 'fanny', 'ricardo', 'thierry', 'marius_locked', 'ley', 'magicien'];
for (let i = 0; i < charNames.length; i++) {
    if (i > 0) await press('ArrowRight', 400);
    if (i === 3) { // After fanny, go down
        await press('ArrowDown', 400);
        // Reset: we're now at row 2
    }
    await screenshot(`19_char_${charNames[i]}`);
}

// ==============================
// 5. SUMMARY
// ==============================
console.log('\n=== AUDIT COMPLETE ===');
console.log('All screenshots saved in test-results/audit_*.png');

await browser.close();
