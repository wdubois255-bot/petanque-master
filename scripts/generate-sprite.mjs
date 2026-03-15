// Script de génération de sprite via PixelLab API
// Usage: node scripts/generate-sprite.mjs <name> <description> [direction]

import fs from 'fs';
import { config } from 'dotenv';
config();

const API_KEY = process.env.PIXELLAB_API_KEY;
if (!API_KEY) {
    console.error('PIXELLAB_API_KEY not found in .env file');
    process.exit(1);
}
const API_URL = 'https://api.pixellab.ai/v1/generate-image-pixflux';

const name = process.argv[2] || 'test';
const description = process.argv[3] || 'pixel art character, young man, white shirt';
const direction = process.argv[4] || 'south';

console.log(`Generating sprite: ${name} (${direction})...`);
console.log(`Description: ${description}`);

const body = {
  description,
  image_size: { width: parseInt(process.argv[5]) || 32, height: parseInt(process.argv[6]) || 32 },
  no_background: true,
  view: 'low top-down',
  direction,
  outline: 'single color black outline',
  shading: 'medium shading',
  detail: 'medium detail',
  text_guidance_scale: 8.0
};

try {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(300000)
  });

  console.log(`HTTP ${response.status}`);

  if (!response.ok) {
    const text = await response.text();
    console.error('Error:', text);
    process.exit(1);
  }

  const data = await response.json();
  console.log(`Cost: $${data.usage.usd}`);

  // Decode base64 image
  let base64 = data.image.base64;
  if (base64.startsWith('data:')) {
    base64 = base64.split(',')[1];
  }

  const outDir = 'assets/sprites/generated';
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const outPath = `${outDir}/${name}.png`;
  fs.writeFileSync(outPath, Buffer.from(base64, 'base64'));
  console.log(`Saved: ${outPath} (${fs.statSync(outPath).size} bytes)`);
} catch (err) {
  console.error('Failed:', err.message);
  process.exit(1);
}
