/**
 * Animate a single sprite image into a full 4-direction walk spritesheet
 * Usage: node scripts/animate-from-image.mjs <input-image> <output-name> [size]
 *
 * Example: node scripts/animate-from-image.mjs assets/my_char.png marcel_v3 64
 *
 * This takes a single south-facing sprite and generates:
 * - 4 directional rotations
 * - 4 walk frames per direction
 * - Assembled spritesheet (4x4 grid, downscaled to 32x32 per cell)
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public', 'assets', 'sprites');

const API_KEY = '8c105f99-2b2c-45d1-b537-28ce76936441';
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
                try { resolve(JSON.parse(body)); }
                catch(e) { reject(new Error(`Parse error: ${body.substring(0, 200)}`)); }
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
    throw new Error('No image in response: ' + JSON.stringify(response).substring(0, 300));
}

async function main() {
    const [inputPath, outputName, sizeStr] = process.argv.slice(2);
    if (!inputPath || !outputName) {
        console.error('Usage: node animate-from-image.mjs <input-image> <output-name> [size]');
        console.error('Example: node animate-from-image.mjs assets/marcel.png marcel_animated 64');
        process.exit(1);
    }

    const size = parseInt(sizeStr) || 64;
    const fullInput = path.resolve(ROOT, inputPath);

    if (!fs.existsSync(fullInput)) {
        console.error(`File not found: ${fullInput}`);
        process.exit(1);
    }

    const sourceB64 = fs.readFileSync(fullInput).toString('base64');
    console.log(`\n=== Animating ${inputPath} → ${outputName} (${size}x${size}) ===`);

    const rawDir = path.join(ROOT, 'assets', 'sprites', `${outputName}_raw`);
    fs.mkdirSync(rawDir, { recursive: true });

    // Step 1: Rotate to all 4 directions
    console.log('  [1/3] Rotating to 4 directions...');
    const directionImages = { south: sourceB64 };
    fs.writeFileSync(path.join(rawDir, 'south_base.png'), Buffer.from(sourceB64, 'base64'));

    for (const dir of ['east', 'west', 'north']) {
        try {
            const result = await apiCall('rotate', {
                image_size: { width: size, height: size },
                from_image: { type: 'base64', base64: sourceB64 },
                from_direction: 'south',
                to_direction: dir,
                image_guidance_scale: 3.0
            });
            const img = extractImage(result);
            fs.writeFileSync(path.join(rawDir, `${dir}_base.png`), img);
            directionImages[dir] = img.toString('base64');
            console.log(`  ✓ ${dir}`);
        } catch(e) {
            console.error(`  ✗ ${dir}: ${e.message}`);
            directionImages[dir] = sourceB64;
        }
    }

    // Step 2: Animate each direction
    console.log('  [2/3] Animating walk cycles...');
    const allFrames = {};

    // animate-with-text is fixed at 64x64
    const animSize = 64;

    for (const dir of DIRECTIONS) {
        try {
            // If source is not 64x64, we need to resize for animate-with-text
            let refB64 = directionImages[dir];
            if (size !== animSize) {
                const sharp = (await import('sharp')).default;
                const resized = await sharp(Buffer.from(refB64, 'base64'))
                    .resize(animSize, animSize, { kernel: 'nearest' })
                    .png()
                    .toBuffer();
                refB64 = resized.toString('base64');
            }

            const result = await apiCall('animate-with-text', {
                description: 'pixel art character walking, chibi RPG style, warm provencal colors' +
                    (dir === 'south' ? ', facing camera' : dir === 'north' ? ', facing away' : `, facing ${dir}`),
                image_size: { width: animSize, height: animSize },
                action: 'walking',
                reference_image: { type: 'base64', base64: refB64 },
                view: 'low top-down',
                direction: dir,
                n_frames: 4,
                text_guidance_scale: 8.0,
                image_guidance_scale: 2.0
            });
            const frames = extractImage(result);
            if (Array.isArray(frames)) {
                allFrames[dir] = frames;
                frames.forEach((f, i) => fs.writeFileSync(path.join(rawDir, `${dir}_frame${i}.png`), f));
                console.log(`  ✓ ${dir}: ${frames.length} frames`);
            } else {
                allFrames[dir] = [frames, frames, frames, frames];
                console.log(`  ⚠ ${dir}: 1 frame, duplicating`);
            }
        } catch(e) {
            console.error(`  ✗ ${dir}: ${e.message}`);
            const buf = Buffer.from(directionImages[dir], 'base64');
            allFrames[dir] = [buf, buf, buf, buf];
        }
    }

    // Step 3: Assemble spritesheet
    console.log('  [3/3] Assembling spritesheet...');
    try {
        const sharp = (await import('sharp')).default;

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

        const composites = [];
        const dirOrder = ['south', 'west', 'east', 'north'];
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                composites.push({
                    input: downscaled[dirOrder[row]][col],
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

        const outPath = path.join(PUBLIC_DIR, `${outputName}.png`);
        fs.writeFileSync(outPath, spritesheet);
        console.log(`\n  ✓ SPRITESHEET: ${outPath} (${spritesheet.length} bytes)`);

        // Also save a 64x64 version (non-downscaled) for comparison
        const composites64 = [];
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                const frame = allFrames[dirOrder[row]][col] || allFrames[dirOrder[row]][0];
                // Ensure all frames are 64x64
                const resized = await sharp(frame).resize(64, 64, { kernel: 'nearest' }).png().toBuffer();
                composites64.push({ input: resized, left: col * 64, top: row * 64 });
            }
        }
        const sheet64 = await sharp({
            create: { width: 256, height: 256, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
        }).composite(composites64).png().toBuffer();
        const outPath64 = path.join(rawDir, `${outputName}_sheet_64.png`);
        fs.writeFileSync(outPath64, sheet64);
        console.log(`  ✓ SHEET 64x64: ${outPath64}`);

    } catch(e) {
        console.error(`  ✗ Assembly failed: ${e.message}`);
        console.log('  Raw frames saved in:', rawDir);
    }

    console.log('\n=== Done! ===');
}

main();
