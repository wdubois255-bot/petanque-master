// Download free asset packs from itch.io using Playwright
// Usage: node scripts/download-free-assets.mjs

import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const DOWNLOAD_DIR = path.resolve('assets/free_packs');
if (!fs.existsSync(DOWNLOAD_DIR)) fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });

const PACKS = [
  { name: 'pipoya_tileset_32x32', url: 'https://pipoya.itch.io/pipoya-rpg-tileset-32x32', desc: 'Pipoya FREE RPG Tileset 32x32' },
  { name: 'pipoya_characters_32x32', url: 'https://pipoya.itch.io/pipoya-free-rpg-character-sprites-32x32', desc: 'Pipoya Characters 32x32' },
  { name: 'schwarnhild_summer_village', url: 'https://schwarnhild.itch.io/summer-village', desc: 'Schwarnhild Summer Village' },
  { name: 'mixel_topdown_rpg', url: 'https://mixelslime.itch.io/free-top-down-rpg-32x32-tile-set', desc: 'Mixel Free Top-Down RPG' },
  { name: 'chierit_lively_npcs', url: 'https://chierit.itch.io/lively-npcs', desc: 'Chierit Lively NPCs' },
  { name: 'cainos_topdown_basic', url: 'https://cainos.itch.io/pixel-art-top-down-basic', desc: 'Cainos Top Down Basic' },
  { name: 'ninja_adventure', url: 'https://pixel-boy.itch.io/ninja-adventure-asset-pack', desc: 'Ninja Adventure (mega pack)' },
];

async function downloadPack(page, pack) {
  console.log(`\n--- ${pack.desc} ---`);

  try {
    await page.goto(pack.url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Step 1: Click the main download/buy button on the game page
    // itch.io uses different button classes
    const buyBtn = page.locator('.buy_btn, .download_btn, [class*="buy"], [class*="download"]').first();

    if (await buyBtn.count() === 0) {
      console.log('  No download button found');
      return false;
    }

    await buyBtn.click();
    await page.waitForTimeout(3000);

    // Step 2: For "name your price" (free) - click "No thanks, just take me to the downloads"
    const noThanksLink = page.locator('text=/No thanks/i, text=/take me to the downloads/i, a.direct_download_btn').first();
    if (await noThanksLink.count() > 0) {
      await noThanksLink.click();
      await page.waitForTimeout(3000);
    }

    // Step 3: Now we should be on the download page - find actual file download buttons
    // itch.io download page has buttons with class "button download_btn" containing upload info
    const fileButtons = page.locator('.upload .button.download_btn, .uploads .upload a');
    const count = await fileButtons.count();

    if (count === 0) {
      // Maybe we're still on a popup - check for iframe
      const iframe = page.frameLocator('iframe').first();
      const iframeBtn = iframe.locator('.upload .button, a[href*="download"]');
      if (await iframeBtn.count() > 0) {
        const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
        await iframeBtn.first().click();
        const download = await downloadPromise;
        const filePath = path.join(DOWNLOAD_DIR, `${pack.name}${path.extname(download.suggestedFilename()) || '.zip'}`);
        await download.saveAs(filePath);
        console.log(`  SAVED: ${pack.name} (${(fs.statSync(filePath).size / 1024).toFixed(0)} KB)`);
        return true;
      }
      console.log(`  No file buttons found (count=0)`);
      return false;
    }

    console.log(`  Found ${count} download(s)`);

    // Download first file (usually the main ZIP)
    const downloadPromise = page.waitForEvent('download', { timeout: 60000 });
    await fileButtons.first().click();

    const download = await downloadPromise;
    const suggestedName = download.suggestedFilename();
    const filePath = path.join(DOWNLOAD_DIR, suggestedName);
    await download.saveAs(filePath);
    const size = fs.statSync(filePath).size;
    console.log(`  SAVED: ${suggestedName} (${(size / 1024).toFixed(0)} KB)`);

    return true;
  } catch (err) {
    console.log(`  FAILED: ${err.message.slice(0, 100)}`);
    return false;
  }
}

async function main() {
  console.log(`Target: ${DOWNLOAD_DIR}`);

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ acceptDownloads: true });
  const page = await context.newPage();

  let ok = 0, fail = 0;

  for (const pack of PACKS) {
    if (await downloadPack(page, pack)) ok++;
    else fail++;
  }

  console.log(`\n=== Results: ${ok} downloaded, ${fail} failed ===`);
  await browser.close();
}

main().catch(console.error);
