import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1664, height: 960 } });

await page.goto('http://localhost:5199', { waitUntil: 'domcontentloaded' });

// Wait for game to load (BootScene -> TitleScene)
await page.waitForTimeout(4000);

// Take screenshot of TitleScene
await page.screenshot({ path: 'test-results/01_title.png' });
console.log('✓ TitleScene captured');

// Press Space to go to menu, then navigate to CharSelect (Mode Arcade)
await page.keyboard.press('Space');
await page.waitForTimeout(1000);
await page.keyboard.press('Space'); // Select "Mode Arcade"
await page.waitForTimeout(1000);

// Take screenshot of CharSelectScene
await page.screenshot({ path: 'test-results/02_charselect_rene.png' });
console.log('✓ CharSelectScene (René) captured');

// Navigate to Marcel (right arrow)
await page.keyboard.press('ArrowRight');
await page.waitForTimeout(500);
await page.screenshot({ path: 'test-results/03_charselect_marcel.png' });
console.log('✓ CharSelectScene (Marcel) captured');

// Navigate to Fanny
await page.keyboard.press('ArrowRight');
await page.waitForTimeout(500);
await page.screenshot({ path: 'test-results/04_charselect_fanny.png' });
console.log('✓ CharSelectScene (Fanny) captured');

// Navigate to next row (down) to see Thierry, then Ley, then Le Magicien
await page.keyboard.press('ArrowDown');
await page.waitForTimeout(500);
await page.screenshot({ path: 'test-results/05_charselect_thierry.png' });
console.log('✓ CharSelectScene (Thierry area) captured');

// Navigate right to Ley
await page.keyboard.press('ArrowRight');
await page.waitForTimeout(500);
await page.screenshot({ path: 'test-results/06_charselect_ley.png' });
console.log('✓ CharSelectScene (Ley) captured');

// Navigate right to Marius (locked)
await page.keyboard.press('ArrowRight');
await page.waitForTimeout(500);

// Navigate down to Le Magicien
await page.keyboard.press('ArrowDown');
await page.waitForTimeout(500);
await page.screenshot({ path: 'test-results/07_charselect_magicien.png' });
console.log('✓ CharSelectScene (Le Magicien) captured');

// Go back to Marcel to check his sprite
await page.keyboard.press('ArrowUp');
await page.waitForTimeout(200);
await page.keyboard.press('ArrowUp');
await page.waitForTimeout(200);
await page.keyboard.press('ArrowLeft');
await page.waitForTimeout(200);
await page.keyboard.press('ArrowLeft');
await page.waitForTimeout(500);
await page.screenshot({ path: 'test-results/08_charselect_marcel_final.png' });
console.log('✓ CharSelectScene (Marcel final check) captured');

// Now test QuickPlay to check new chars are there
await page.keyboard.press('Escape'); // Back to Title
await page.waitForTimeout(1000);
await page.keyboard.press('ArrowDown'); // "Partie Rapide"
await page.waitForTimeout(300);
await page.keyboard.press('Space');
await page.waitForTimeout(1000);
await page.screenshot({ path: 'test-results/09_quickplay.png' });
console.log('✓ QuickPlayScene captured');

// Navigate to Player 1 row and cycle to Ley
await page.keyboard.press('ArrowDown'); // J1
await page.waitForTimeout(200);
for (let i = 0; i < 6; i++) {
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(200);
}
await page.screenshot({ path: 'test-results/10_quickplay_ley.png' });
console.log('✓ QuickPlayScene (Ley) captured');

// One more right -> Le Magicien
await page.keyboard.press('ArrowRight');
await page.waitForTimeout(300);
await page.screenshot({ path: 'test-results/11_quickplay_magicien.png' });
console.log('✓ QuickPlayScene (Le Magicien) captured');

await browser.close();
console.log('\n✅ All screenshots saved in test-results/');
