/**
 * Animate a static sprite into a full RPG spritesheet using PixelLab API
 * Input: 64x64 south-facing sprite
 * Output: 128x128 spritesheet (4 cols x 4 rows of 32x32)
 *         Row 0 = south, Row 1 = west, Row 2 = east, Row 3 = north
 *
 * Usage: node scripts/animate-sprite.mjs [input.png] [output.png] [description]
 */

import fs from 'fs';
import path from 'path';

let sharp;
try {
  sharp = (await import('sharp')).default;
} catch {
  console.log('Installing sharp...');
  const { execSync } = await import('child_process');
  execSync('npm install sharp', { stdio: 'inherit' });
  sharp = (await import('sharp')).default;
}

// PixelLab API config
const MCP_CONFIG = JSON.parse(fs.readFileSync('.mcp.json', 'utf8'));
const API_KEY = MCP_CONFIG.mcpServers.pixellab.headers.Authorization.replace('Bearer ', '');
const API_BASE = 'https://api.pixellab.ai/v1';

const INPUT = process.argv[2] || 'assets/sprites/generated/joueur_south_v2.png';
const OUTPUT = process.argv[3] || 'public/assets/sprites/player_animated.png';
const DESCRIPTION = process.argv[4] || 'young boy, brown hair, blue t-shirt, brown pants, casual';

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
    throw new Error(`PixelLab ${endpoint} failed (${res.status}): ${text}`);
  }
  return res.json();
}

function imgToBase64(buf) {
  return buf.toString('base64');
}

function base64ToBuffer(b64) {
  return Buffer.from(b64, 'base64');
}

async function main() {
  console.log('=== ANIMATE SPRITE ===\n');
  console.log(`Input: ${INPUT}`);
  console.log(`Output: ${OUTPUT}`);
  console.log(`Description: ${DESCRIPTION}\n`);

  // Read input sprite
  const inputBuf = fs.readFileSync(path.resolve(INPUT));
  const meta = await sharp(inputBuf).metadata();
  console.log(`Input size: ${meta.width}x${meta.height}`);

  // Ensure 64x64 for PixelLab
  let sprite64;
  if (meta.width !== 64 || meta.height !== 64) {
    console.log('Resizing to 64x64...');
    sprite64 = await sharp(inputBuf)
      .resize(64, 64, { kernel: sharp.kernel.nearest })
      .png()
      .toBuffer();
  } else {
    sprite64 = await sharp(inputBuf).png().toBuffer();
  }

  const southB64 = imgToBase64(sprite64);

  // Step 1: Rotate to 3 other directions
  console.log('\n--- ROTATING SPRITE ---');
  const directions = ['east', 'west', 'north'];
  const dirSprites = { south: southB64 };

  for (const dir of directions) {
    console.log(`  Rotating south -> ${dir}...`);
    try {
      const result = await apiCall('/rotate', {
        image_size: { width: 64, height: 64 },
        from_image: { type: 'base64', base64: southB64 },
        from_direction: 'south',
        to_direction: dir,
        image_guidance_scale: 3.0
      });
      dirSprites[dir] = result.image.base64;
      console.log(`  OK: ${dir}`);
    } catch (err) {
      console.error(`  FAIL ${dir}: ${err.message}`);
      // Fallback: flip for east/west, reuse south for north
      if (dir === 'west') {
        console.log('  Fallback: flipping south horizontally for west');
        const flipped = await sharp(sprite64).flop().png().toBuffer();
        dirSprites[dir] = imgToBase64(flipped);
      } else if (dir === 'east') {
        console.log('  Fallback: flipping south horizontally for east');
        const flipped = await sharp(sprite64).flop().png().toBuffer();
        dirSprites[dir] = imgToBase64(flipped);
      } else {
        console.log('  Fallback: reusing south for north');
        dirSprites[dir] = southB64;
      }
    }
  }

  // Step 2: Animate each direction (4 frames walking)
  console.log('\n--- ANIMATING WALK CYCLES ---');
  // Order: south, west, east, north (matches Pipoya/game format)
  const animOrder = ['south', 'west', 'east', 'north'];
  const allFrames = {}; // dir -> [4 base64 frames]

  for (const dir of animOrder) {
    console.log(`  Animating ${dir}...`);
    try {
      const result = await apiCall('/animate-with-text', {
        image_size: { width: 64, height: 64 },
        description: DESCRIPTION,
        action: 'walking',
        reference_image: { type: 'base64', base64: dirSprites[dir] },
        view: 'low top-down',
        direction: dir,
        n_frames: 4,
        text_guidance_scale: 8.0,
        image_guidance_scale: 1.5
      });
      allFrames[dir] = result.images.map(img => img.base64);
      console.log(`  OK: ${dir} (${allFrames[dir].length} frames)`);
    } catch (err) {
      console.error(`  FAIL animate ${dir}: ${err.message}`);
      // Fallback: use static sprite for all 4 frames
      console.log(`  Fallback: using static sprite for ${dir}`);
      allFrames[dir] = [dirSprites[dir], dirSprites[dir], dirSprites[dir], dirSprites[dir]];
    }
  }

  // Step 3: Assemble 128x128 spritesheet at 32x32 per frame
  console.log('\n--- ASSEMBLING SPRITESHEET ---');

  // First assemble at 64x64 per frame (256x256 total), then downscale
  const composites = [];

  for (let row = 0; row < 4; row++) {
    const dir = animOrder[row];
    const frames = allFrames[dir];

    for (let col = 0; col < 4; col++) {
      const frameIdx = col < frames.length ? col : 0;
      // Reorder frames: stance, left, stance, right (standard RPG walk cycle)
      let actualIdx;
      if (frames.length >= 4) {
        // PixelLab returns sequential frames: [frame0, frame1, frame2, frame3]
        // Game expects: [stance, left-step, stance, right-step]
        const mapping = [0, 1, 0, 2]; // or [0, 1, 2, 3] if PixelLab already gives walk cycle
        actualIdx = col; // Use as-is first, adjust if needed
      } else {
        actualIdx = frameIdx;
      }

      const frameBuf = base64ToBuffer(frames[actualIdx] || frames[0]);
      composites.push({
        input: await sharp(frameBuf).resize(32, 32, { kernel: sharp.kernel.nearest }).png().toBuffer(),
        left: col * 32,
        top: row * 32
      });
    }
  }

  const spritesheet = await sharp({
    create: { width: 128, height: 128, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
  })
    .composite(composites)
    .png()
    .toFile(path.resolve(OUTPUT));

  console.log(`\nSpritesheet saved: ${OUTPUT}`);
  console.log('128x128 (4 cols x 4 rows of 32x32)');
  console.log('Row 0=south, 1=west, 2=east, 3=north');

  // Also save individual direction sprites for reference
  const debugDir = path.resolve('assets/sprites/generated/directions');
  fs.mkdirSync(debugDir, { recursive: true });
  for (const dir of animOrder) {
    const buf = base64ToBuffer(dirSprites[dir]);
    fs.writeFileSync(path.join(debugDir, `joueur_${dir}.png`), buf);
    console.log(`  Debug: joueur_${dir}.png saved`);
  }

  console.log('\n=== DONE ===');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
