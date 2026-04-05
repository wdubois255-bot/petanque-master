/**
 * Capture physics visualization as video using Playwright.
 * Records each demo scene for 8 seconds, outputs WebM files.
 * These can then be converted to MP4 with FFmpeg.
 */

import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';
import { execSync } from 'child_process';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = path.resolve(__dirname, '..');
const VIZ_PATH = path.join(BASE, 'docs', 'making-of', 'video', 'physics-viz.html');
const OUTPUT_DIR = path.join(BASE, 'docs', 'making-of', 'video');

const DEMOS = ['trajectories', 'collisions', 'terrains', 'lofts'];
const RECORD_SECONDS = 8;

async function main() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  for (const demo of DEMOS) {
    console.log(`\nRecording demo: ${demo} (${RECORD_SECONDS}s)...`);

    // Create a new context with video recording for each demo
    const videoContext = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      recordVideo: {
        dir: OUTPUT_DIR,
        size: { width: 1920, height: 1080 }
      }
    });

    const page = await videoContext.newPage();
    await page.goto(`file:///${VIZ_PATH.replace(/\\/g, '/')}`);
    await page.waitForTimeout(500);

    // Click the demo button
    await page.evaluate((demoName) => {
      startDemo(demoName);
    }, demo);

    // Wait for recording duration
    await page.waitForTimeout(RECORD_SECONDS * 1000);

    // Also take a screenshot at the end (for thumbnail)
    await page.screenshot({
      path: path.join(OUTPUT_DIR, `physics_${demo}_screenshot.png`)
    });
    console.log(`  Screenshot saved: physics_${demo}_screenshot.png`);

    // Close to save video
    const videoPath = await page.video().path();
    await page.close();
    await videoContext.close();

    // Rename video file
    const finalPath = path.join(OUTPUT_DIR, `physics_${demo}.webm`);
    if (fs.existsSync(videoPath)) {
      fs.renameSync(videoPath, finalPath);
      console.log(`  Video saved: physics_${demo}.webm`);

      // Convert to MP4
      const mp4Path = path.join(OUTPUT_DIR, `physics_${demo}.mp4`);
      try {
        execSync(`ffmpeg -y -i "${finalPath}" -c:v libx264 -preset fast -crf 20 -pix_fmt yuv420p "${mp4Path}"`, { stdio: 'pipe' });
        console.log(`  Converted: physics_${demo}.mp4`);
        // Clean up webm
        fs.unlinkSync(finalPath);
      } catch (e) {
        console.log(`  FFmpeg conversion failed, keeping WebM`);
      }
    }
  }

  await browser.close();
  console.log('\nAll demos captured!');
  console.log(`Files in: ${OUTPUT_DIR}`);
}

main().catch(console.error);
