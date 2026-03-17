/**
 * Generate the full cast of chibi RPG characters via PixelLab API
 * Each character: generate south -> rotate 3 dirs -> animate 4 frames each -> 128x128 spritesheet
 * Output: public/assets/sprites/{name}_animated.png
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

// Read API key from environment or .mcp.json
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

// ===== CHARACTER DEFINITIONS =====
const CHARACTERS = [
  {
    id: 'rene',
    name: 'René (L\'Équilibré)',
    description: 'chibi RPG character, young teenage boy, big head, brown messy hair, bright blue t-shirt, brown khaki shorts, white sneakers, cute round face, large brown eyes, small body, determined expression, pixel art, RPG Maker style, colorful, top-down game sprite',
    output: 'public/assets/sprites/rene_animated.png'
  },
  {
    id: 'marcel',
    name: 'Marcel (Le Chirurgien)',
    description: 'chibi RPG character, middle-aged stocky man, big head, thick black mustache, gold chain necklace, white tank top undershirt, brown vest, beige pants, tanned skin, warm smile, small body, pixel art, RPG Maker style, colorful, top-down game sprite',
    output: 'public/assets/sprites/marcel_animated.png'
  },
  {
    id: 'fanny',
    name: 'Fanny (La Canonnière)',
    description: 'chibi RPG character, strong athletic woman, big head, auburn red hair in a ponytail, green tank top, beige cargo pants, brown boots, confident fierce expression, tanned skin, hands on hips pose, small body, pixel art, RPG Maker style, colorful, top-down game sprite',
    output: 'public/assets/sprites/fanny_animated.png'
  },
  {
    id: 'ricardo',
    name: 'Ricardo (Le Calculateur)',
    description: 'chibi RPG character, elegant slim man, big head, slicked back dark hair, stylish sunglasses, white linen shirt unbuttoned, beige chinos, leather sandals, tanned olive skin, cool mysterious smile, small body, pixel art, RPG Maker style, colorful, top-down game sprite',
    output: 'public/assets/sprites/ricardo_animated.png'
  },
  {
    id: 'thierry',
    name: 'Thierry (Le Flambeur)',
    description: 'chibi RPG character, flamboyant middle-aged man, big head, wild curly brown hair, hawaiian shirt bright orange and yellow flowers, white shorts, flip flops, big grin, gold bracelet, sunburned skin, energetic pose, small body, pixel art, RPG Maker style, colorful, top-down game sprite',
    output: 'public/assets/sprites/thierry_animated.png'
  },
  {
    id: 'marius',
    name: 'Le Grand Marius (Boss)',
    description: 'chibi RPG character, imposing elderly man, big head, thick white beard, wild white hair, dark navy suit jacket, gold chain necklace, dark pants, polished shoes, piercing intense eyes, commanding aura, regal posture, small body, pixel art, RPG Maker style, colorful, top-down game sprite',
    output: 'public/assets/sprites/marius_animated.png'
  }
];

// Only generate specific characters if args provided
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
          console.log(`    Retry ${i + 1}/${retries} (${res.status})...`);
          await new Promise(r => setTimeout(r, 2000));
          continue;
        }
        throw new Error(`PixelLab ${endpoint} (${res.status}): ${text}`);
      }
      return res.json();
    } catch (err) {
      if (i < retries && err.code === 'ECONNRESET') {
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }
      throw err;
    }
  }
}

function b64toBuf(b64) { return Buffer.from(b64, 'base64'); }
function bufToB64(buf) { return buf.toString('base64'); }

async function generateCharacter(char) {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`  ${char.name} (${char.id})`);
  console.log(`${'='.repeat(50)}\n`);

  const debugDir = `assets/sprites/generated/chibi/${char.id}`;
  fs.mkdirSync(debugDir, { recursive: true });

  // Step 1: Generate south-facing sprite at 64x64
  console.log('  1. Generating south sprite (64x64)...');
  const genResult = await apiCall('/generate-image-pixflux', {
    description: char.description,
    image_size: { width: 64, height: 64 },
    no_background: true,
    view: 'low top-down',
    direction: 'south',
    outline: 'single color black outline',
    shading: 'medium shading',
    detail: 'medium detail',
    text_guidance_scale: 8.0
  });
  const southB64 = genResult.image.base64;
  fs.writeFileSync(`${debugDir}/south.png`, b64toBuf(southB64));
  console.log('     OK');

  // Step 2: Rotate to 3 other directions
  console.log('  2. Rotating to other directions...');
  const dirSprites = { south: southB64 };
  for (const dir of ['east', 'west', 'north']) {
    console.log(`     -> ${dir}...`);
    try {
      const result = await apiCall('/rotate', {
        image_size: { width: 64, height: 64 },
        from_image: { type: 'base64', base64: southB64 },
        from_direction: 'south',
        to_direction: dir,
        image_guidance_scale: 3.0
      });
      dirSprites[dir] = result.image.base64;
      fs.writeFileSync(`${debugDir}/${dir}.png`, b64toBuf(result.image.base64));
      console.log(`     OK`);
    } catch (err) {
      console.error(`     FAIL: ${err.message}`);
      if (dir === 'east' || dir === 'west') {
        const flipped = await sharp(b64toBuf(southB64)).flop().png().toBuffer();
        dirSprites[dir] = bufToB64(flipped);
        console.log(`     Fallback: mirror`);
      } else {
        dirSprites[dir] = southB64;
        console.log(`     Fallback: reuse south`);
      }
    }
  }

  // Step 3: Animate each direction (4 frames walking)
  console.log('  3. Animating walk cycles...');
  const animOrder = ['south', 'west', 'east', 'north'];
  const allFrames = {};

  for (const dir of animOrder) {
    console.log(`     ${dir}...`);
    try {
      const result = await apiCall('/animate-with-text', {
        image_size: { width: 64, height: 64 },
        description: char.description,
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
      console.log(`     Fallback: static`);
    }
  }

  // Step 4: Assemble 128x128 spritesheet (4x4 grid of 32x32)
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
  return char.output;
}

// ===== MAIN =====
async function main() {
  console.log('╔══════════════════════════════════════╗');
  console.log('║  CHIBI CAST GENERATOR - PixelLab     ║');
  console.log('╚══════════════════════════════════════╝');
  console.log(`\nGenerating ${chars.length} characters: ${chars.map(c => c.id).join(', ')}\n`);

  const results = [];
  for (const char of chars) {
    try {
      const out = await generateCharacter(char);
      results.push({ id: char.id, status: 'OK', output: out });
    } catch (err) {
      console.error(`\nFATAL ERROR for ${char.id}: ${err.message}`);
      results.push({ id: char.id, status: 'FAIL', error: err.message });
    }
  }

  console.log('\n\n=== SUMMARY ===');
  for (const r of results) {
    console.log(`  ${r.status === 'OK' ? '✓' : '✗'} ${r.id}: ${r.status}${r.output ? ` -> ${r.output}` : ''}`);
  }
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
