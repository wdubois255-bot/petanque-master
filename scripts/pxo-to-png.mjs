#!/usr/bin/env node
/**
 * pxo-to-png.mjs
 * Converts a Pixelorama .pxo file to individual PNG frames + a combined spritesheet
 * Usage: node scripts/pxo-to-png.mjs <input.pxo> <output_dir>
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const pxoPath = process.argv[2];
const outDir = process.argv[3] || 'output';

if (!pxoPath) {
  console.error('Usage: node scripts/pxo-to-png.mjs <input.pxo> <output_dir>');
  process.exit(1);
}

// Extract pxo (it's a zip)
const tmpDir = path.join(outDir, '_pxo_tmp');
fs.mkdirSync(tmpDir, { recursive: true });
fs.mkdirSync(outDir, { recursive: true });

execSync(`unzip -o "${pxoPath}" -d "${tmpDir}"`, { stdio: 'pipe' });

const data = JSON.parse(fs.readFileSync(path.join(tmpDir, 'data.json'), 'utf-8'));
const width = data.size_x;
const height = data.size_y;
const frameCount = data.frames.length;

console.log(`PXO: ${width}x${height}, ${frameCount} frames`);

// Try to use sharp for PNG conversion
let sharp;
try {
  sharp = (await import('sharp')).default;
} catch (e) {
  console.log('sharp not available, using raw canvas approach...');
}

if (sharp) {
  // Convert each frame's raw RGBA data to PNG
  for (let i = 1; i <= frameCount; i++) {
    const rawPath = path.join(tmpDir, 'image_data', 'frames', String(i), 'layer_1');
    if (!fs.existsSync(rawPath)) {
      console.log(`  Frame ${i}: no data, skipping`);
      continue;
    }

    const rawData = fs.readFileSync(rawPath);

    // Pixelorama stores raw RGBA pixels
    const expectedSize = width * height * 4;

    if (rawData.length === expectedSize) {
      // Direct RGBA raw data
      const png = await sharp(rawData, {
        raw: { width, height, channels: 4 }
      }).png().toBuffer();

      const outPath = path.join(outDir, `frame_${String(i).padStart(2, '0')}.png`);
      fs.writeFileSync(outPath, png);
      console.log(`  Frame ${i} -> ${outPath} (${png.length} bytes)`);
    } else {
      console.log(`  Frame ${i}: unexpected size ${rawData.length} (expected ${expectedSize}), skipping`);
    }
  }

  // Create spritesheet (4 columns x N rows)
  const cols = 4;
  const rows = Math.ceil(frameCount / cols);
  const sheetWidth = width * cols;
  const sheetHeight = height * rows;

  // Composite all frames into one spritesheet
  const composites = [];
  for (let i = 1; i <= frameCount; i++) {
    const framePath = path.join(outDir, `frame_${String(i).padStart(2, '0')}.png`);
    if (fs.existsSync(framePath)) {
      const col = (i - 1) % cols;
      const row = Math.floor((i - 1) / cols);
      composites.push({
        input: framePath,
        left: col * width,
        top: row * height
      });
    }
  }

  if (composites.length > 0) {
    const sheet = await sharp({
      create: {
        width: sheetWidth,
        height: sheetHeight,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    })
    .composite(composites)
    .png()
    .toBuffer();

    const sheetPath = path.join(outDir, 'spritesheet.png');
    fs.writeFileSync(sheetPath, sheet);
    console.log(`\nSpritesheet: ${sheetPath} (${sheetWidth}x${sheetHeight}, ${sheet.length} bytes)`);
  }
} else {
  console.error('Cannot convert without sharp. Run: npm install sharp');
  process.exit(1);
}

// Cleanup
fs.rmSync(tmpDir, { recursive: true, force: true });

console.log('\nDone!');
