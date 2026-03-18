#!/usr/bin/env node
/**
 * Generate character spritesheets via PixelLab API
 * Usage: node scripts/generate_sprites.mjs [character_name]
 * If no name given, generates all missing characters.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT = path.resolve(__dirname, '..');
const SPRITES_DIR = path.join(PROJECT, 'public', 'assets', 'sprites');

// Load API key from .env
const envFile = fs.readFileSync(path.join(PROJECT, '.env'), 'utf8');
const API_KEY = envFile.match(/PIXELLAB_API_KEY=(.+)/)?.[1]?.trim();
if (!API_KEY) { console.error('Missing PIXELLAB_API_KEY in .env'); process.exit(1); }

const API_BASE = 'https://api.pixellab.ai/v1';
const HEADERS = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`
};

// Character definitions
const CHARACTERS = {
    marcel: {
        description: 'old provencal man petanque player, 50-60 years old, beige wide-brim country hat, red burgundy polo shirt, beige khaki pants, brown leather shoes, light blond hair, thick mustache, gold chain necklace, confident sturdy stance, warm southern France colors',
        filename: 'marcel_animated.png'
    },
    ricardo: {
        description: 'intellectual mediterranean man 35-40 years old, neat short dark hair, thin rectangular glasses, navy blue polo shirt, beige chino pants, brown loafers, olive skin, thoughtful focused expression, clean-cut calculating look, warm colors',
        filename: 'ricardo_animated.png'
    },
    marius: {
        description: 'elderly provencal man grand master petanque player 60 years old, same chibi proportions as other characters, silver gray wild hair, white trimmed beard and mustache, deep burgundy wine-red open collar shirt, dark navy pants, black leather shoes, gold chain necklace, stern confident expression, distinguished and classy, warm southern France colors, NOT a monster NOT bulky',
        filename: 'marius_animated.png'
    }
};

const VIEW = 'high top-down';
const SIZE = { width: 64, height: 64 };
const DIRECTIONS = ['south', 'east', 'west', 'north']; // row order for spritesheet

async function apiCall(endpoint, body, retries = 2) {
    for (let attempt = 0; attempt <= retries; attempt++) {
        const res = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers: HEADERS,
            body: JSON.stringify(body)
        });
        if (res.ok) return res.json();
        const err = await res.text();
        if (res.status >= 500 && attempt < retries) {
            console.log(`    Retry ${attempt + 1}/${retries} after ${res.status}...`);
            await new Promise(r => setTimeout(r, 3000 * (attempt + 1)));
            continue;
        }
        throw new Error(`API ${endpoint} failed (${res.status}): ${err}`);
    }
}

function base64ToPng(b64) {
    return Buffer.from(b64, 'base64');
}

async function generateBase(desc) {
    console.log('  [1/3] Generating base sprite (south)...');
    const data = await apiCall('/generate-image-pixflux', {
        description: desc,
        image_size: SIZE,
        no_background: true,
        view: VIEW,
        direction: 'south',
        outline: 'single color black outline',
        shading: 'medium shading',
        detail: 'medium detail',
        text_guidance_scale: 8.0
    });
    console.log(`    Cost: $${data.usage?.usd?.toFixed(4) || '?'}`);
    return data.image.base64;
}

async function rotateSprite(base64, fromDir, toDir) {
    console.log(`  Rotating ${fromDir} -> ${toDir}...`);
    const data = await apiCall('/rotate', {
        image_size: SIZE,
        from_image: { type: 'base64', base64: base64 },
        from_direction: fromDir,
        to_direction: toDir,
        image_guidance_scale: 3.0
    });
    console.log(`    Cost: $${data.usage?.usd?.toFixed(4) || '?'}`);
    return data.image.base64;
}

async function animateDirection(desc, refBase64, direction) {
    console.log(`  Animating walk ${direction}...`);
    const data = await apiCall('/animate-with-text', {
        description: desc,
        image_size: SIZE,
        action: 'walking',
        reference_image: { type: 'base64', base64: refBase64 },
        view: VIEW,
        direction: direction,
        n_frames: 4,
        text_guidance_scale: 8.0,
        image_guidance_scale: 1.5
    });
    console.log(`    Cost: $${data.usage?.usd?.toFixed(4) || '?'}`);
    // Response may have frames array or single image with grid
    if (data.images) {
        return data.images.map(img => img.base64);
    }
    if (data.image) {
        // Single image — might be a grid, return as-is
        return [data.image.base64];
    }
    throw new Error('Unexpected animate response format');
}

async function generateCharacter(name, config) {
    console.log(`\n=== Generating ${name.toUpperCase()} ===`);
    let totalCost = 0;

    // Step 1: Generate base south sprite
    const southBase64 = await generateBase(config.description);

    // Step 2: Rotate to other 3 directions
    console.log('  [2/3] Rotating to 3 other directions...');
    const directionSprites = { south: southBase64 };
    for (const dir of ['east', 'west', 'north']) {
        directionSprites[dir] = await rotateSprite(southBase64, 'south', dir);
    }

    // Step 3: Animate each direction (4 walk frames) — with fallback to static
    console.log('  [3/3] Generating walk animations...');
    const animFrames = {};
    let animFailed = false;
    for (const dir of DIRECTIONS) {
        try {
            animFrames[dir] = await animateDirection(config.description, directionSprites[dir], dir);
        } catch (err) {
            console.log(`    ⚠ Animation failed for ${dir}: ${err.message}`);
            console.log(`    Using static sprite as fallback.`);
            animFrames[dir] = [directionSprites[dir]]; // single static frame
            animFailed = true;
        }
    }

    // Step 4: Assemble spritesheet
    console.log('  Assembling spritesheet 128x128...');
    await assembleSpritesheet(name, config.filename, directionSprites, animFrames);

    console.log(`  ✓ ${name} complete! -> ${config.filename}`);
}

async function assembleSpritesheet(name, filename, dirSprites, animFrames) {
    // Save individual frames for debugging
    const tmpDir = path.join(PROJECT, 'scripts', 'tmp_sprites', name);
    fs.mkdirSync(tmpDir, { recursive: true });

    for (const [dir, b64] of Object.entries(dirSprites)) {
        fs.writeFileSync(path.join(tmpDir, `${dir}_base.png`), base64ToPng(b64));
    }

    for (const [dir, frames] of Object.entries(animFrames)) {
        frames.forEach((b64, i) => {
            fs.writeFileSync(path.join(tmpDir, `${dir}_frame${i}.png`), base64ToPng(b64));
        });
    }

    // Use canvas to assemble (Node canvas via sharp or jimp)
    // For now, use a simple approach: if animate returns single grid images,
    // we need to extract frames. If it returns 4 separate frames, compose them.

    // Try to use sharp for assembly
    let sharp;
    try {
        sharp = (await import('sharp')).default;
    } catch {
        console.log('  sharp not available, saving raw frames. Assemble manually.');
        console.log(`  Frames saved to: ${tmpDir}`);
        return;
    }

    // Check what we got from animation
    const southFrames = animFrames.south;

    if (southFrames.length === 1) {
        // Single image per direction — might be a grid of 4 frames
        // Each is 64x64 but might contain 4 frames in a strip (256x64 or 128x128)
        const meta = await sharp(base64ToPng(southFrames[0])).metadata();
        console.log(`  Animation image size: ${meta.width}x${meta.height}`);

        if (meta.width === 256 && meta.height === 64) {
            // 4 frames horizontal strip — extract each 64x64 frame, downscale to 32x32
            await assembleFromStrips(sharp, name, filename, animFrames);
            return;
        } else if (meta.width === 64 && meta.height === 64) {
            // Single frame per direction — use direction sprites as static spritesheet
            await assembleFromStatic(sharp, name, filename, dirSprites);
            return;
        }
    } else if (southFrames.length === 4) {
        // 4 separate frames per direction — ideal case
        await assembleFromSeparateFrames(sharp, name, filename, animFrames);
        return;
    }

    console.log(`  Unexpected frame format (${southFrames.length} frames). Saving raw.`);
}

async function assembleFromStrips(sharp, name, filename, animFrames) {
    // Each direction has a 256x64 strip (4 x 64x64 frames)
    // Extract each 64x64, downscale to 32x32, compose into 128x128
    const cells = [];

    for (const dir of DIRECTIONS) {
        const strip = base64ToPng(animFrames[dir][0]);
        for (let f = 0; f < 4; f++) {
            const frame = await sharp(strip)
                .extract({ left: f * 64, top: 0, width: 64, height: 64 })
                .resize(32, 32, { kernel: 'nearest' })
                .png()
                .toBuffer();
            cells.push(frame);
        }
    }

    await composeGrid(sharp, filename, cells, 4, 4, 32, 32);
}

async function assembleFromSeparateFrames(sharp, name, filename, animFrames) {
    const cells = [];
    for (const dir of DIRECTIONS) {
        for (let f = 0; f < 4; f++) {
            const frame = await sharp(base64ToPng(animFrames[dir][f]))
                .resize(32, 32, { kernel: 'nearest' })
                .png()
                .toBuffer();
            cells.push(frame);
        }
    }
    await composeGrid(sharp, filename, cells, 4, 4, 32, 32);
}

async function assembleFromStatic(sharp, name, filename, dirSprites) {
    // No animation available — create static spritesheet (same frame x4 per direction)
    const cells = [];
    for (const dir of DIRECTIONS) {
        const frame = await sharp(base64ToPng(dirSprites[dir]))
            .resize(32, 32, { kernel: 'nearest' })
            .png()
            .toBuffer();
        // Repeat same frame 4 times
        cells.push(frame, frame, frame, frame);
    }
    await composeGrid(sharp, filename, cells, 4, 4, 32, 32);
}

async function composeGrid(sharp, filename, cells, cols, rows, cellW, cellH) {
    const width = cols * cellW;
    const height = rows * cellH;

    // Create transparent base
    let composite = sharp({
        create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
    }).png();

    const overlays = [];
    for (let i = 0; i < cells.length; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        overlays.push({
            input: cells[i],
            left: col * cellW,
            top: row * cellH
        });
    }

    const output = path.join(SPRITES_DIR, filename);
    await composite.composite(overlays).toFile(output);
    console.log(`  ✓ Saved: ${output} (${width}x${height})`);
}

// Main
async function main() {
    const target = process.argv[2];
    const chars = target
        ? { [target]: CHARACTERS[target] }
        : Object.fromEntries(
            Object.entries(CHARACTERS).filter(([, c]) => !fs.existsSync(path.join(SPRITES_DIR, c.filename)))
        );

    if (Object.keys(chars).length === 0) {
        console.log('All character sprites exist. Use: node scripts/generate_sprites.mjs <name> to force regenerate.');
        return;
    }

    console.log(`Generating ${Object.keys(chars).length} character(s): ${Object.keys(chars).join(', ')}`);

    for (const [name, config] of Object.entries(chars)) {
        await generateCharacter(name, config);
    }

    console.log('\n=== All done! ===');
}

main().catch(err => { console.error('FATAL:', err); process.exit(1); });
