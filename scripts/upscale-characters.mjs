#!/usr/bin/env node
/**
 * Upscale character spritesheets using Scale2x (AdvMAME2x) pixel art algorithm.
 * Then apply Scale2x again (→ Scale4x) and Lanczos3 downscale to 2x for maximum quality.
 *
 * Pipeline: 64x64 frames → Scale4x (256x256) → Lanczos3 ↓2x (128x128) → ultra smooth pixel art
 *
 * Input:  256x256 spritesheet (4×4 grid of 64×64 frames)
 * Output: 512x512 spritesheet (4×4 grid of 128×128 frames)
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const SPRITES_DIR = path.resolve('public/assets/sprites');
const SRC_FRAME = 64;
const GRID = 4; // 4×4 grid

const CHARACTERS = [
    'rene_animated',
    'marcel_animated',
    'fanny_animated',
    'ricardo_animated',
    'thierry_animated',
    'marius_animated'
];

// ─── Pixel helpers ───

function getPixel(data, w, h, x, y) {
    if (x < 0 || x >= w || y < 0 || y >= h) return [0, 0, 0, 0];
    const i = (y * w + x) * 4;
    return [data[i], data[i + 1], data[i + 2], data[i + 3]];
}

function setPixel(data, w, x, y, rgba) {
    const i = (y * w + x) * 4;
    data[i] = rgba[0]; data[i + 1] = rgba[1]; data[i + 2] = rgba[2]; data[i + 3] = rgba[3];
}

// Perceptual color distance (YUV-weighted + alpha)
function colorsEqual(a, b, threshold = 48) {
    // Both transparent → equal
    if (a[3] < 20 && b[3] < 20) return true;
    // One transparent → different
    if (a[3] < 20 || b[3] < 20) return false;

    const dr = a[0] - b[0], dg = a[1] - b[1], db = a[2] - b[2];
    // Weighted luminance distance
    const dist = Math.abs(dr * 0.299 + dg * 0.587 + db * 0.114)
        + Math.abs(dr * -0.169 + dg * -0.331 + db * 0.500) * 0.5
        + Math.abs(dr * 0.500 + dg * -0.419 + db * -0.081) * 0.5;
    return dist < threshold;
}

// ─── Scale2x (AdvMAME2x) ───
// Reference: https://www.scale2x.it/algorithm
//
//   Input:       Output:
//     B           E0 E1
//   A P C         E2 E3
//     D
//
//   if B != D and A != C:
//     E0 = A==B ? A : P
//     E1 = B==C ? C : P
//     E2 = A==D ? A : P
//     E3 = D==C ? C : P
//   else:
//     E0 = E1 = E2 = E3 = P

function scale2x(srcData, srcW, srcH) {
    const dstW = srcW * 2;
    const dstH = srcH * 2;
    const dst = new Uint8Array(dstW * dstH * 4);

    for (let y = 0; y < srcH; y++) {
        for (let x = 0; x < srcW; x++) {
            const P = getPixel(srcData, srcW, srcH, x, y);
            const A = getPixel(srcData, srcW, srcH, x - 1, y);     // left
            const B = getPixel(srcData, srcW, srcH, x, y - 1);     // top
            const C = getPixel(srcData, srcW, srcH, x + 1, y);     // right
            const D = getPixel(srcData, srcW, srcH, x, y + 1);     // bottom

            const dx = x * 2, dy = y * 2;

            if (!colorsEqual(B, D) && !colorsEqual(A, C)) {
                setPixel(dst, dstW, dx,     dy,     colorsEqual(A, B) ? A : P);
                setPixel(dst, dstW, dx + 1, dy,     colorsEqual(B, C) ? C : P);
                setPixel(dst, dstW, dx,     dy + 1, colorsEqual(A, D) ? A : P);
                setPixel(dst, dstW, dx + 1, dy + 1, colorsEqual(D, C) ? C : P);
            } else {
                setPixel(dst, dstW, dx,     dy,     P);
                setPixel(dst, dstW, dx + 1, dy,     P);
                setPixel(dst, dstW, dx,     dy + 1, P);
                setPixel(dst, dstW, dx + 1, dy + 1, P);
            }
        }
    }

    return { data: dst, width: dstW, height: dstH };
}

// ─── Extract a single frame from a spritesheet grid ───

function extractFrame(data, sheetW, col, row, frameSize) {
    const frame = new Uint8Array(frameSize * frameSize * 4);
    const ox = col * frameSize;
    const oy = row * frameSize;
    for (let y = 0; y < frameSize; y++) {
        const srcOff = ((oy + y) * sheetW + ox) * 4;
        const dstOff = y * frameSize * 4;
        frame.set(data.subarray(srcOff, srcOff + frameSize * 4), dstOff);
    }
    return frame;
}

// ─── Place a frame into a spritesheet grid ───

function placeFrame(sheet, sheetW, col, row, frameData, frameSize) {
    const ox = col * frameSize;
    const oy = row * frameSize;
    for (let y = 0; y < frameSize; y++) {
        const srcOff = y * frameSize * 4;
        const dstOff = ((oy + y) * sheetW + ox) * 4;
        sheet.set(frameData.subarray(srcOff, srcOff + frameSize * 4), dstOff);
    }
}

// ─── Dark outline pass ───
// Adds a 1-2px warm dark outline (#3A2E28) around opaque pixels in each frame

function addOutline(data, w, h) {
    const out = new Uint8Array(data);
    const OUTLINE = [58, 46, 40, 200]; // #3A2E28 ~78% alpha

    // Pass 1: 1px outline on fully transparent pixels adjacent to opaque
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const px = getPixel(data, w, h, x, y);
            if (px[3] > 30) continue; // skip opaque pixels

            let hasOpaque = false;
            for (const [ox, oy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
                const n = getPixel(data, w, h, x + ox, y + oy);
                if (n[3] > 128) { hasOpaque = true; break; }
            }
            if (hasOpaque) {
                setPixel(out, w, x, y, OUTLINE);
            }
        }
    }

    // Pass 2: softer diagonal outline for smoother edges
    const out2 = new Uint8Array(out);
    const OUTLINE_SOFT = [58, 46, 40, 100]; // lighter for diagonals
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const px = getPixel(out, w, h, x, y);
            if (px[3] > 10) continue;

            let hasDiagOpaque = false;
            for (const [ox, oy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
                const n = getPixel(out, w, h, x + ox, y + oy);
                if (n[3] > 128) { hasDiagOpaque = true; break; }
            }
            if (hasDiagOpaque) {
                setPixel(out2, w, x, y, OUTLINE_SOFT);
            }
        }
    }

    return out2;
}

// ─── Process one character ───

async function processCharacter(name) {
    const srcPath = path.join(SPRITES_DIR, `${name}.png`);
    const backupPath = path.join(SPRITES_DIR, `${name}_64.png`);
    const outPath = srcPath; // overwrite original

    if (!fs.existsSync(srcPath)) {
        console.log(`  [SKIP] ${name}.png not found`);
        return;
    }

    // Read source spritesheet
    const { data: rawData, info } = await sharp(srcPath)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

    const srcW = info.width;
    const srcH = info.height;
    const srcData = new Uint8Array(rawData);

    // Detect frame size and grid
    const frameSize = srcW / GRID;
    console.log(`  Source: ${srcW}×${srcH}, frame: ${frameSize}×${frameSize}`);

    if (frameSize !== SRC_FRAME) {
        console.log(`  [SKIP] Expected ${SRC_FRAME}px frames, got ${frameSize}px`);
        return;
    }

    // Backup original
    if (!fs.existsSync(backupPath)) {
        fs.copyFileSync(srcPath, backupPath);
        console.log(`  Backup → ${name}_64.png`);
    }

    // Process each frame: Scale2x twice (4x) then Lanczos down to 2x
    const dstFrame = frameSize * 2; // 128
    const dstSheetW = dstFrame * GRID; // 512
    const dstSheetH = dstFrame * GRID; // 512
    const dstSheet = new Uint8Array(dstSheetW * dstSheetH * 4);

    for (let row = 0; row < GRID; row++) {
        for (let col = 0; col < GRID; col++) {
            // Extract 64×64 frame
            const frame64 = extractFrame(srcData, srcW, col, row, frameSize);

            // Scale2x pass 1: 64→128
            const pass1 = scale2x(frame64, frameSize, frameSize);

            // Scale2x pass 2: 128→256
            const pass2 = scale2x(pass1.data, pass1.width, pass1.height);

            // Lanczos3 downscale: 256→128 (ultra smooth)
            const downscaled = await sharp(Buffer.from(pass2.data), {
                raw: { width: pass2.width, height: pass2.height, channels: 4 }
            })
                .resize(dstFrame, dstFrame, { kernel: sharp.kernel.lanczos3 })
                .ensureAlpha()
                .raw()
                .toBuffer();

            // Add dark outline around character silhouette
            const outlined = addOutline(new Uint8Array(downscaled), dstFrame, dstFrame);

            // Place into output sheet
            placeFrame(dstSheet, dstSheetW, col, row, outlined, dstFrame);
        }
    }

    // Write output
    await sharp(Buffer.from(dstSheet), {
        raw: { width: dstSheetW, height: dstSheetH, channels: 4 }
    })
        .png({ compressionLevel: 9 })
        .toFile(outPath);

    const outSize = fs.statSync(outPath).size;
    console.log(`  ✓ ${name}.png → ${dstSheetW}×${dstSheetH} (${Math.round(outSize / 1024)}KB)`);
}

// ─── Main ───

async function main() {
    console.log('\n=== Upscale Character Spritesheets (Scale4x + Lanczos3) ===\n');

    for (const name of CHARACTERS) {
        console.log(`Processing ${name}...`);
        try {
            await processCharacter(name);
        } catch (err) {
            console.error(`  [ERROR] ${name}: ${err.message}`);
        }
    }

    console.log('\n=== Done! Update BootScene.js to use frameWidth: 128 ===\n');
}

main().catch(console.error);
