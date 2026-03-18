/**
 * Regenerate character spritesheets via PixelLab API
 * Usage: node scripts/regen-characters.mjs [character-name]
 * If no name given, regenerates marcel, thierry, ricardo
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SPRITES_DIR = path.join(ROOT, 'assets', 'sprites');
const PUBLIC_DIR = path.join(ROOT, 'public', 'assets', 'sprites');

const API_KEY = '8c105f99-2b2c-45d1-b537-28ce76936441';

// Character descriptions for PixelLab
const CHARACTERS = {
    marcel: {
        desc: 'pixel art character, old provencal man with brown cowboy hat, red polo shirt, tan khaki pants, gold chain necklace, white messy hair, chibi RPG style, warm provencal colors',
        file: 'marcel_animated'
    },
    thierry: {
        desc: 'pixel art character, young energetic man with wild curly black afro hair, bright yellow t-shirt, dark brown pants, dark skin, chibi RPG style, warm provencal colors',
        file: 'thierry_animated'
    },
    ricardo: {
        desc: 'pixel art character, elegant intellectual man with purple vest jacket, beige shirt underneath, dark pants, blue beret cap, medium build, chibi RPG style, warm provencal colors',
        file: 'ricardo_animated'
    }
};

const DIRECTIONS = ['south', 'west', 'east', 'north'];

function apiCall(endpoint, body) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(body);
        const req = https.request({
            hostname: 'api.pixellab.ai',
            port: 443,
            path: `/v1/${endpoint}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Length': Buffer.byteLength(data)
            },
            timeout: 60000
        }, (res) => {
            let body = '';
            res.on('data', d => body += d);
            res.on('end', () => {
                try {
                    const j = JSON.parse(body);
                    resolve(j);
                } catch(e) {
                    reject(new Error(`Parse error: ${body.substring(0, 200)}`));
                }
            });
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('TIMEOUT')); });
        req.write(data);
        req.end();
    });
}

function extractImage(response) {
    if (response.image?.base64) return Buffer.from(response.image.base64, 'base64');
    if (response.images) return response.images.map(img => Buffer.from(img.base64, 'base64'));
    throw new Error('No image in response: ' + JSON.stringify(response).substring(0, 200));
}

async function generateCharacter(name) {
    const char = CHARACTERS[name];
    if (!char) { console.error(`Unknown character: ${name}`); return; }

    console.log(`\n=== Generating ${name} ===`);
    const outDir = path.join(SPRITES_DIR, `${name}_raw`);
    fs.mkdirSync(outDir, { recursive: true });

    // Step 1: Generate south-facing base sprite
    console.log('  [1/3] Generating south-facing base...');
    const southResult = await apiCall('generate-image-pixflux', {
        description: char.desc + ', facing camera',
        image_size: { width: 64, height: 64 },
        no_background: true,
        view: 'low top-down',
        direction: 'south',
        outline: 'single color black outline',
        shading: 'medium shading',
        detail: 'medium detail',
        text_guidance_scale: 8.0
    });
    const southImg = extractImage(southResult);
    const southPath = path.join(outDir, 'south_base.png');
    fs.writeFileSync(southPath, southImg);
    console.log(`  ✓ South base: ${southImg.length} bytes`);
    const southB64 = southImg.toString('base64');

    // Step 2: Rotate to other directions
    console.log('  [2/3] Rotating to 3 other directions...');
    const directionImages = { south: southB64 };
    for (const dir of ['east', 'west', 'north']) {
        try {
            const rotResult = await apiCall('rotate', {
                image_size: { width: 64, height: 64 },
                from_image: { type: 'base64', base64: southB64 },
                from_direction: 'south',
                to_direction: dir,
                image_guidance_scale: 3.0
            });
            const img = extractImage(rotResult);
            fs.writeFileSync(path.join(outDir, `${dir}_base.png`), img);
            directionImages[dir] = img.toString('base64');
            console.log(`  ✓ ${dir}: ${img.length} bytes`);
        } catch(e) {
            console.error(`  ✗ ${dir} rotation failed: ${e.message}`);
            directionImages[dir] = southB64; // fallback
        }
    }

    // Step 3: Animate each direction (4 frames)
    console.log('  [3/3] Animating walk cycles (4 frames x 4 dirs)...');
    const allFrames = {}; // { south: [buf, buf, buf, buf], east: [...], ... }
    for (const dir of DIRECTIONS) {
        try {
            const animResult = await apiCall('animate-with-text', {
                description: char.desc + (dir === 'south' ? ', facing camera' : dir === 'north' ? ', facing away' : `, facing ${dir}`),
                image_size: { width: 64, height: 64 },
                action: 'walking',
                reference_image: { type: 'base64', base64: directionImages[dir] },
                view: 'low top-down',
                direction: dir,
                n_frames: 4,
                text_guidance_scale: 8.0,
                image_guidance_scale: 1.5
            });
            const frames = extractImage(animResult);
            if (Array.isArray(frames)) {
                allFrames[dir] = frames;
                frames.forEach((f, i) => fs.writeFileSync(path.join(outDir, `${dir}_frame${i}.png`), f));
                console.log(`  ✓ ${dir} animation: ${frames.length} frames`);
            } else {
                // Single image returned, use as all 4 frames
                allFrames[dir] = [frames, frames, frames, frames];
                console.log(`  ⚠ ${dir} animation: only 1 frame returned, duplicating`);
            }
        } catch(e) {
            console.error(`  ✗ ${dir} animation failed: ${e.message}`);
            // Fallback: use the base image for all frames
            const buf = Buffer.from(directionImages[dir], 'base64');
            allFrames[dir] = [buf, buf, buf, buf];
        }
    }

    // Step 4: Assemble spritesheet (128x128 = 4x4 frames of 32x32)
    console.log('  Assembling spritesheet...');
    try {
        // Use sharp if available, otherwise use canvas
        const sharp = (await import('sharp')).default;

        // Downscale each frame from 64x64 to 32x32
        const downscaled = {};
        for (const dir of DIRECTIONS) {
            downscaled[dir] = [];
            for (let i = 0; i < 4; i++) {
                const frame = allFrames[dir][i] || allFrames[dir][0];
                const small = await sharp(frame)
                    .resize(32, 32, { kernel: 'nearest' })
                    .toBuffer();
                downscaled[dir].push(small);
            }
        }

        // Compose into 128x128 spritesheet
        const composites = [];
        const dirOrder = ['south', 'west', 'east', 'north'];
        for (let row = 0; row < 4; row++) {
            const dir = dirOrder[row];
            for (let col = 0; col < 4; col++) {
                composites.push({
                    input: downscaled[dir][col],
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
        .toBuffer();

        // Save to public dir
        const outPath = path.join(PUBLIC_DIR, `${char.file}.png`);
        fs.writeFileSync(outPath, spritesheet);
        console.log(`  ✓ SPRITESHEET SAVED: ${outPath} (${spritesheet.length} bytes)`);
    } catch(e) {
        console.error(`  ✗ Assembly failed: ${e.message}`);
        console.log('  Tip: install sharp with "npm install sharp"');
        console.log('  Raw frames saved in:', outDir);
    }
}

// Main
const args = process.argv.slice(2);
const names = args.length > 0 ? args : ['marcel', 'thierry', 'ricardo'];

console.log('PixelLab Character Generator');
console.log('Characters:', names.join(', '));

(async () => {
    for (const name of names) {
        await generateCharacter(name);
    }
    console.log('\n=== Done! ===');
})();
