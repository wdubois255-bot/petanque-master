/**
 * Fix east/west directions for chibi sprites:
 * - Keep south (face) and north (back) from PixelLab rotation
 * - For east/west: pick the best lateral sprite, mirror it for the other
 * - Re-animate all 4 directions
 * - Reassemble 128x128 spritesheets
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

// API key
let API_KEY = process.env.PIXELLAB_API_KEY;
if (!API_KEY) {
  try {
    const mcp = JSON.parse(fs.readFileSync('.mcp.json', 'utf8'));
    API_KEY = mcp.mcpServers.pixellab.headers.Authorization.replace('Bearer ', '');
  } catch {
    console.error('Set PIXELLAB_API_KEY env var or have .mcp.json');
    process.exit(1);
  }
}
const API_BASE = 'https://api.pixellab.ai/v1';

// Characters with their fix strategy
// bestLateral: which direction looks like a proper side view
// For most: east from PixelLab is actually decent as a lateral
const CHARACTERS = [
  {
    id: 'player',
    desc: 'chibi RPG character, young teenage boy, big head, brown messy hair, bright blue t-shirt, brown khaki shorts, white sneakers, cute round face, large brown eyes, small body, determined expression, pixel art, RPG Maker style, colorful, top-down game sprite',
    output: 'public/assets/sprites/player_animated.png',
    // For player: east looks almost front-facing, west looks like back
    // Best fix: regenerate east directly, then mirror for west
    needsRegenLateral: true
  },
  {
    id: 'bastien',
    desc: 'chibi RPG character, teenage boy, big head, spiky blond hair pointed up, red polo shirt, white pants, cocky smirk, sharp blue eyes, athletic build, small body, pixel art, RPG Maker style, colorful, top-down game sprite',
    output: 'public/assets/sprites/bastien_animated.png',
    needsRegenLateral: true
  },
  {
    id: 'marcel',
    desc: 'chibi RPG character, middle-aged stocky man, big head, thick black mustache, gold chain necklace, white tank top undershirt, brown vest, beige pants, tanned skin, warm smile, small body, pixel art, RPG Maker style, colorful, top-down game sprite',
    output: 'public/assets/sprites/marcel_animated.png',
    // Marcel east looks OK as a lateral view
    needsRegenLateral: false,
    bestLateral: 'east' // east is decent lateral, mirror for west
  },
  {
    id: 'papet',
    desc: 'chibi RPG character, elderly man, big head, white thin hair, beret hat dark blue, beige linen shirt, brown suspenders, brown pants, walking cane in right hand, gentle wrinkled face, kind eyes, small body, pixel art, RPG Maker style, colorful, top-down game sprite',
    output: 'public/assets/sprites/papet_animated.png',
    // Papet east looks OK
    needsRegenLateral: false,
    bestLateral: 'east'
  }
];

const targetIds = process.argv.slice(2);
const chars = targetIds.length > 0
  ? CHARACTERS.filter(c => targetIds.includes(c.id))
  : CHARACTERS;

async function apiCall(endpoint, body, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
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
        if (i < retries && res.status >= 500) {
          await new Promise(r => setTimeout(r, 2000));
          continue;
        }
        throw new Error(`PixelLab ${endpoint} (${res.status}): ${text}`);
      }
      return res.json();
    } catch (err) {
      if (i < retries && (err.code === 'ECONNRESET' || err.code === 'FETCH_ERROR')) {
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }
      throw err;
    }
  }
}

function b64toBuf(b64) { return Buffer.from(b64, 'base64'); }
function bufToB64(buf) { return buf.toString('base64'); }

async function fixCharacter(char) {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`  Fixing: ${char.id}`);
  console.log(`${'='.repeat(50)}\n`);

  const debugDir = `assets/sprites/generated/chibi/${char.id}`;

  // Load existing south and north (these are good)
  const southBuf = fs.readFileSync(`${debugDir}/south.png`);
  const northBuf = fs.readFileSync(`${debugDir}/north.png`);
  const southB64 = bufToB64(southBuf);
  const northB64 = bufToB64(northBuf);

  let eastB64, westB64;

  if (char.needsRegenLateral) {
    // Regenerate a proper east-facing sprite from scratch
    console.log('  1. Regenerating east (side view) from south reference...');
    const result = await apiCall('/rotate', {
      image_size: { width: 64, height: 64 },
      from_image: { type: 'base64', base64: southB64 },
      from_direction: 'south',
      to_direction: 'east',
      image_guidance_scale: 2.0 // Lower guidance = more creative rotation
    });
    eastB64 = result.image.base64;
    fs.writeFileSync(`${debugDir}/east_fixed.png`, b64toBuf(eastB64));
    console.log('     OK');

    // Mirror east to get west
    console.log('  2. Mirroring east -> west...');
    const eastBufFixed = b64toBuf(eastB64);
    const westBufFixed = await sharp(eastBufFixed).flop().png().toBuffer();
    westB64 = bufToB64(westBufFixed);
    fs.writeFileSync(`${debugDir}/west_fixed.png`, westBufFixed);
    console.log('     OK');
  } else {
    // Use existing best lateral + mirror
    const bestDir = char.bestLateral || 'east';
    const otherDir = bestDir === 'east' ? 'west' : 'east';
    console.log(`  1. Using existing ${bestDir} as lateral reference...`);
    const bestBuf = fs.readFileSync(`${debugDir}/${bestDir}.png`);

    // Mirror for the other direction
    console.log(`  2. Mirroring ${bestDir} -> ${otherDir}...`);
    const mirrorBuf = await sharp(bestBuf).flop().png().toBuffer();

    if (bestDir === 'east') {
      eastB64 = bufToB64(bestBuf);
      westB64 = bufToB64(mirrorBuf);
      fs.writeFileSync(`${debugDir}/west_fixed.png`, mirrorBuf);
    } else {
      westB64 = bufToB64(bestBuf);
      eastB64 = bufToB64(mirrorBuf);
      fs.writeFileSync(`${debugDir}/east_fixed.png`, mirrorBuf);
    }
    console.log('     OK');
  }

  // Now re-animate all 4 directions
  console.log('  3. Animating walk cycles...');
  const animOrder = ['south', 'west', 'east', 'north'];
  const dirSprites = { south: southB64, east: eastB64, west: westB64, north: northB64 };
  const allFrames = {};

  for (const dir of animOrder) {
    console.log(`     ${dir}...`);
    try {
      const result = await apiCall('/animate-with-text', {
        image_size: { width: 64, height: 64 },
        description: char.desc,
        action: 'walking',
        reference_image: { type: 'base64', base64: dirSprites[dir] },
        view: 'low top-down',
        direction: dir,
        n_frames: 4,
        text_guidance_scale: 8.0,
        image_guidance_scale: 1.5
      });
      allFrames[dir] = result.images.map(img => img.base64);
      console.log(`     OK (${allFrames[dir].length} frames)`);
    } catch (err) {
      console.error(`     FAIL: ${err.message}`);
      allFrames[dir] = [dirSprites[dir], dirSprites[dir], dirSprites[dir], dirSprites[dir]];
    }
  }

  // For west: if we mirrored east, also mirror the animation frames
  // This ensures walk cycle matches perfectly
  if (!char.needsRegenLateral || true) {
    // Always ensure west frames are mirror of east frames for consistency
    console.log('  3b. Ensuring west = mirror(east) for animation consistency...');
    const mirroredFrames = [];
    for (const frame of allFrames['east']) {
      const mirrored = await sharp(b64toBuf(frame)).flop().png().toBuffer();
      mirroredFrames.push(bufToB64(mirrored));
    }
    allFrames['west'] = mirroredFrames;
    console.log('     OK');
  }

  // Assemble 128x128 spritesheet
  console.log('  4. Assembling spritesheet...');
  const composites = [];
  for (let row = 0; row < 4; row++) {
    const dir = animOrder[row];
    const frames = allFrames[dir];
    for (let col = 0; col < 4; col++) {
      const idx = col < frames.length ? col : 0;
      const frameBuf = b64toBuf(frames[idx]);
      composites.push({
        input: await sharp(frameBuf).resize(32, 32, { kernel: sharp.kernel.nearest }).png().toBuffer(),
        left: col * 32,
        top: row * 32
      });
    }
  }

  fs.mkdirSync(path.dirname(path.resolve(char.output)), { recursive: true });
  await sharp({
    create: { width: 128, height: 128, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
  })
    .composite(composites)
    .png()
    .toFile(path.resolve(char.output));

  console.log(`     Saved: ${char.output}`);
}

async function main() {
  console.log('╔══════════════════════════════════════╗');
  console.log('║  FIX CHIBI DIRECTIONS (east/west)    ║');
  console.log('╚══════════════════════════════════════╝');
  console.log(`\nFixing ${chars.length} characters: ${chars.map(c => c.id).join(', ')}\n`);

  for (const char of chars) {
    try {
      await fixCharacter(char);
    } catch (err) {
      console.error(`FATAL for ${char.id}: ${err.message}`);
    }
  }
  console.log('\n=== ALL DONE ===');
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
