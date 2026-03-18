import { chromium } from 'playwright';

const PORT = 5200;
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1664, height: 960 } });

// Capture console errors
const errors = [];
page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
});
page.on('pageerror', err => errors.push(err.message));

async function screenshot(name) {
    await page.screenshot({ path: `test-results/gp_${name}.png` });
    console.log(`  📸 ${name}`);
}
async function wait(ms) { await page.waitForTimeout(ms); }

console.log('=== GAMEPLAY AUDIT ===\n');

// Load game
await page.goto(`http://localhost:${PORT}`, { waitUntil: 'domcontentloaded' });
await wait(5000);
await screenshot('01_title');

// Go to menu
await page.keyboard.press('Space');
await wait(1500);
await screenshot('02_menu');

// Select "Mode Arcade" (first option, already selected)
await page.keyboard.press('Space');
await wait(1500);
await screenshot('03_charselect');

// Select René (already selected, first char) - press Space to confirm
await page.keyboard.press('Space');
await wait(2000);
await screenshot('04_arcade_progress');

// Arcade should show progress screen, press Space to continue
await page.keyboard.press('Space');
await wait(3000);
await screenshot('05_vs_or_match');

// If VS screen, wait for auto-advance or skip
await page.keyboard.press('Space');
await wait(4000);
await screenshot('06_petanque_scene');

// Check for errors so far
if (errors.length > 0) {
    console.log('\n⚠️ ERRORS DETECTED:');
    errors.forEach(e => console.log('  ❌ ' + e));
}

// Now we should be in PetanqueScene
// Take a screenshot to verify sprite positions
await wait(2000);
await screenshot('07_sprite_positions');

// Try to throw cochonnet
const canvas = await page.$('canvas');
if (canvas) {
    const box = await canvas.boundingBox();
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height * 0.85;

    // Throw cochonnet
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx, cy - 120, { steps: 15 });
    await wait(100);
    await page.mouse.up();
    await wait(3000);
    await screenshot('08_after_cochonnet');

    // Wait for first ball phase
    await wait(2000);
    await screenshot('09_first_ball');

    // Throw first ball
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx + 10, cy - 90, { steps: 12 });
    await wait(100);
    await page.mouse.up();
    await wait(4000);
    await screenshot('10_after_first_ball');

    // Wait for opponent AI
    await wait(5000);
    await screenshot('11_after_opponent');

    // Throw second ball
    await wait(2000);
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx - 15, cy - 100, { steps: 12 });
    await wait(100);
    await page.mouse.up();
    await wait(4000);
    await screenshot('12_after_second_ball');

    // Wait for opponent
    await wait(5000);
    await screenshot('13_mid_game');

    // TAB ranking
    await page.keyboard.down('Tab');
    await wait(800);
    await screenshot('14_tab_ranking');
    await page.keyboard.up('Tab');

    // Third ball
    await wait(2000);
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx + 5, cy - 70, { steps: 10 });
    await wait(100);
    await page.mouse.up();
    await wait(5000);
    await screenshot('15_after_third_ball');

    // Wait for rest of mene
    await wait(6000);
    await screenshot('16_mene_end');
}

// Now also test QuickPlay flow to see if it works
console.log('\n--- QUICKPLAY TEST ---');
await page.goto(`http://localhost:${PORT}`, { waitUntil: 'domcontentloaded' });
await wait(5000);
await page.keyboard.press('Space');
await wait(1500);
// Navigate to Partie Rapide (2nd item)
await page.keyboard.press('ArrowDown');
await wait(300);
await page.keyboard.press('Space');
await wait(1500);
await screenshot('17_quickplay');

// Go directly to JOUER (navigate down past all options)
for (let i = 0; i < 7; i++) {
    await page.keyboard.press('ArrowDown');
    await wait(200);
}
await wait(500);
await screenshot('18_quickplay_jouer');

// Press Space on JOUER
await page.keyboard.press('Space');
await wait(1000);
await screenshot('19_after_jouer_1s');
await wait(3000);
await screenshot('20_after_jouer_4s');
await wait(3000);
await screenshot('21_after_jouer_7s');

// Final error report
console.log('\n=== ERROR REPORT ===');
if (errors.length === 0) {
    console.log('✅ No errors detected');
} else {
    console.log(`❌ ${errors.length} errors:`);
    errors.forEach(e => console.log('  - ' + e.substring(0, 200)));
}

await browser.close();
