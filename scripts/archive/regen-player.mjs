/**
 * Regenerate player sprite in chibi style matching Pipoya NPCs
 * Generates at 32x32 natively (no downscale) for pixel-perfect result
 */
import fs from 'fs';
import path from 'path';

let sharp;
try {
  sharp = (await import('sharp')).default;
} catch {
  const { execSync } = await import('child_process');
  execSync('npm install sharp', { stdio: 'inherit' });
  sharp = (await import('sharp')).default;
}

const MCP_CONFIG = JSON.parse(fs.readFileSync('.mcp.json', 'utf8'));
const API_KEY = MCP_CONFIG.mcpServers.pixellab.headers.Authorization.replace('Bearer ', '');
const API_BASE = 'https://api.pixellab.ai/v1';

const OUTPUT = 'public/assets/sprites/player_animated.png';
const SIZE = 32; // Native 32x32 - no downscale needed

// Chibi RPG style description matching Pipoya aesthetic
const DESCRIPTION = 'chibi RPG character, young boy, big head, brown messy hair, blue t-shirt, brown khaki pants, simple shoes, cute round face, large eyes, small body, pixel art, RPG Maker style, colorful';

async function apiCall(endpoint, body) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PixelLab ${endpoint} (${res.status}): ${text}`);
  }
  return res.json();
}

function b64toBuf(b64) { return Buffer.from(b64, 'base64'); }

async function main() {
  console.log('=== REGENERATE PLAYER (CHIBI STYLE) ===\n');

  // Step 1: Generate base south-facing sprite
  console.log('1. Generating chibi south sprite...');
  const genResult = await apiCall('/generate-image-pixflux', {
    description: DESCRIPTION,
    image_size: { width: SIZE, height: SIZE },
    no_background: true,
    view: 'low top-down',
    direction: 'south',
    outline: 'single color black outline',
    shading: 'medium shading',
    detail: 'medium detail',
    text_guidance_scale: 8.0
  });
  const southB64 = genResult.image.base64;
  console.log('  OK: south generated');

  // Save south for reference
  fs.mkdirSync('assets/sprites/generated/chibi', { recursive: true });
  fs.writeFileSync('assets/sprites/generated/chibi/player_south.png', b64toBuf(southB64));

  // Step 2: Rotate to 3 other directions
  console.log('\n2. Rotating to other directions...');
  const dirSprites = { south: southB64 };
  for (const dir of ['east', 'west', 'north']) {
    console.log(`  Rotating -> ${dir}...`);
    const result = await apiCall('/rotate', {
      image_size: { width: SIZE, height: SIZE },
      from_image: { type: 'base64', base64: southB64 },
      from_direction: 'south',
      to_direction: dir,
      image_guidance_scale: 3.0
    });
    dirSprites[dir] = result.image.base64;
    fs.writeFileSync(`assets/sprites/generated/chibi/player_${dir}.png`, b64toBuf(result.image.base64));
    console.log(`  OK: ${dir}`);
  }

  // Step 3: Upscale to 64x64 for animation (minimum required by PixelLab)
  console.log('\n3. Upscaling sprites to 64x64 for animation...');
  const dirSprites64 = {};
  for (const dir of ['south', 'east', 'west', 'north']) {
    const upscaled = await sharp(b64toBuf(dirSprites[dir]))
      .resize(64, 64, { kernel: sharp.kernel.nearest })
      .png().toBuffer();
    dirSprites64[dir] = upscaled.toString('base64');
  }

  // Step 4: Animate each direction at 64x64
  console.log('\n4. Animating walk cycles (64x64)...');
  const animOrder = ['south', 'west', 'east', 'north'];
  const allFrames = {};

  for (const dir of animOrder) {
    console.log(`  Animating ${dir}...`);
    const result = await apiCall('/animate-with-text', {
      image_size: { width: 64, height: 64 },
      description: DESCRIPTION,
      action: 'walking',
      reference_image: { type: 'base64', base64: dirSprites64[dir] },
      view: 'low top-down',
      direction: dir,
      n_frames: 4,
      text_guidance_scale: 8.0,
      image_guidance_scale: 1.5
    });
    // Downscale each frame back to 32x32
    const frames32 = [];
    for (const img of result.images) {
      const ds = await sharp(b64toBuf(img.base64))
        .resize(SIZE, SIZE, { kernel: sharp.kernel.nearest })
        .png().toBuffer();
      frames32.push(ds.toString('base64'));
    }
    allFrames[dir] = frames32;
    console.log(`  OK: ${dir} (${frames32.length} frames)`);
  }

  // Step 5: Assemble 128x128 spritesheet (4x4 grid of 32x32)
  console.log('\n4. Assembling spritesheet...');
  const composites = [];
  for (let row = 0; row < 4; row++) {
    const dir = animOrder[row];
    const frames = allFrames[dir];
    for (let col = 0; col < 4; col++) {
      const idx = col < frames.length ? col : 0;
      composites.push({
        input: b64toBuf(frames[idx]),
        left: col * SIZE,
        top: row * SIZE
      });
    }
  }

  await sharp({
    create: { width: SIZE * 4, height: SIZE * 4, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
  })
    .composite(composites)
    .png()
    .toFile(path.resolve(OUTPUT));

  console.log(`\nSaved: ${OUTPUT} (${SIZE * 4}x${SIZE * 4})`);
  console.log('=== DONE ===');
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
