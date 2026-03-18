import { chromium } from 'playwright';

const PORT = 5200;
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1664, height: 960 } });

const errors = [];
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
page.on('pageerror', err => errors.push(err.message));

async function ss(name) {
    await page.screenshot({ path: `test-results/final_${name}.png` });
    console.log(`  📸 ${name}`);
}
async function wait(ms) { await page.waitForTimeout(ms); }

console.log('=== FINAL AUDIT ===\n');

// --- ARCADE FLOW ---
console.log('--- ARCADE MODE ---');
await page.goto(`http://localhost:${PORT}`, { waitUntil: 'domcontentloaded' });
await wait(5000);
await ss('01_title');

await page.keyboard.press('Space'); await wait(1500);
await ss('02_menu');

await page.keyboard.press('Space'); await wait(1500);
await ss('03_charselect');

// Verify only 4 playable + Marius (locked) visible
// Select Marcel (should be first now) and confirm
await page.keyboard.press('Space'); await wait(2000);
await ss('04_arcade_or_vs');

// Try to get through arcade screens
await page.keyboard.press('Space'); await wait(3000);
await ss('05_next_screen');
await page.keyboard.press('Space'); await wait(4000);
await ss('06_petanque_or_next');

// Try dismissing tutorial overlays
for (let i = 0; i < 5; i++) {
    await page.keyboard.press('Space'); await wait(1500);
}
await ss('07_in_game');

// Throw cochonnet
const canvas = await page.$('canvas');
const box = await canvas.boundingBox();
const cx = box.x + box.width / 2;
const cy = box.y + box.height * 0.85;

await page.mouse.move(cx, cy);
await page.mouse.down();
await page.mouse.move(cx, cy - 120, { steps: 15 });
await wait(100);
await page.mouse.up();
await wait(3000);
await ss('08_after_cochonnet');

// First ball
await wait(2000);
await page.mouse.move(cx, cy);
await page.mouse.down();
await page.mouse.move(cx + 10, cy - 90, { steps: 12 });
await wait(100);
await page.mouse.up();
await wait(4000);
await ss('09_after_first_ball');

// Wait AI
await wait(5000);
await ss('10_after_ai');

// Check sprite positions
await wait(2000);
await ss('11_sprite_positions');

// --- QUICKPLAY FLOW ---
console.log('\n--- QUICKPLAY MODE ---');
await page.goto(`http://localhost:${PORT}`, { waitUntil: 'domcontentloaded' });
await wait(5000);
await page.keyboard.press('Space'); await wait(1500);
await page.keyboard.press('ArrowDown'); await wait(300);
await page.keyboard.press('Space'); await wait(1500);
await ss('12_quickplay');

// Navigate to JOUER (last row)
// Options: MODE, J1, J2, BOULES, COCHONNET, TERRAIN, DIFFICULTE = 7 rows, JOUER = row 7
for (let i = 0; i < 8; i++) {
    await page.keyboard.press('ArrowDown'); await wait(150);
}
await wait(300);
await ss('13_quickplay_jouer');

// Launch
await page.keyboard.press('Space'); await wait(1000);
await ss('14_after_launch_1s');
await wait(3000);
await ss('15_after_launch_4s');
await wait(5000);
await ss('16_after_launch_9s');

// --- CHAR SELECT GRID CHECK ---
console.log('\n--- CHAR SELECT GRID ---');
await page.goto(`http://localhost:${PORT}`, { waitUntil: 'domcontentloaded' });
await wait(5000);
await page.keyboard.press('Space'); await wait(1500);
await page.keyboard.press('Space'); await wait(1500);

// Screenshot each character in the grid
for (let i = 0; i < 5; i++) {
    await ss(`17_char_${i}`);
    await page.keyboard.press('ArrowRight'); await wait(400);
}

console.log('\n=== ERRORS ===');
const realErrors = errors.filter(e => !e.includes('tilemapJSON'));
if (realErrors.length === 0) console.log('✅ No real errors');
else realErrors.forEach(e => console.log('❌ ' + e.substring(0, 200)));

await browser.close();
