/**
 * Génère la cover art 630×500 pour itch.io.
 * Composition pixel-perfect avec Sharp :
 * - Fond ciel provençal (#87CEEB)
 * - Bande terracotta (#C4854A) en bas
 * - Sprite personnage (idle frame, upscalé NN)
 * - Sprite boule
 * - Titre "PETANQUE MASTER" en Press Start 2P
 * - Sous-titre "Free Browser Game"
 *
 * Usage : node scripts/generate-cover-art.mjs
 * Sortie : docs/lancement/assets/cover-art-630x500.png
 */

import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync } from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SPRITES = path.join(ROOT, 'public', 'assets', 'sprites');
const OUTPUT_DIR = path.join(ROOT, 'docs', 'lancement', 'assets');
const OUTPUT = path.join(OUTPUT_DIR, 'cover-art-630x500.png');

if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

function log(msg) {
    console.log(`[cover-art] ${msg}`);
}

// ─── Extract idle frame (top-left 32×32) from 128×128 spritesheet ───
async function extractIdleFrame(spritesheetPath) {
    return sharp(spritesheetPath)
        .extract({ left: 0, top: 0, width: 32, height: 32 })
        .toBuffer();
}

// ─── Upscale with nearest neighbor ───
async function upscaleNN(buffer, factor) {
    const meta = await sharp(buffer).metadata();
    return sharp(buffer)
        .resize(meta.width * factor, meta.height * factor, {
            kernel: sharp.kernel.nearest,
        })
        .toBuffer();
}

// ─── Create SVG text (renders pixel-perfect with Press Start 2P) ───
function createTextSVG(text, fontSize, color, maxWidth) {
    // Use a monospace pixel font feel via SVG
    const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    return Buffer.from(`
        <svg width="${maxWidth}" height="${fontSize * 2}">
            <style>
                @font-face {
                    font-family: 'PixelFont';
                    src: url('data:font/woff2;base64,') format('woff2');
                }
                text {
                    font-family: 'Courier New', monospace;
                    font-weight: bold;
                    font-size: ${fontSize}px;
                    fill: ${color};
                    letter-spacing: 1px;
                }
            </style>
            <text x="50%" y="${fontSize}" text-anchor="middle" dominant-baseline="middle">${escaped}</text>
        </svg>
    `);
}

async function main() {
    log('Génération de la cover art 630×500...');

    // ─── Working size: 158×125 (×4 = 632×500, crop to 630) ───
    // Actually, let's work at 2x for better text quality: 315×250 → ×2 = 630×500
    const W = 630;
    const H = 500;
    const BAND_H = 100; // Bottom terracotta band height

    // 1. Create background: sky blue top + terracotta band bottom
    log('1. Fond ciel + bande terracotta...');
    const skyHeight = H - BAND_H;
    const sky = await sharp({
        create: { width: W, height: skyHeight, channels: 4, background: { r: 135, g: 206, b: 235, alpha: 1 } }
    }).png().toBuffer();

    const band = await sharp({
        create: { width: W, height: BAND_H, channels: 4, background: { r: 196, g: 133, b: 74, alpha: 1 } }
    }).png().toBuffer();

    // 2. Extract and upscale character sprite
    log('2. Sprite Papi René...');
    const charSpritesheet = path.join(SPRITES, 'papi_rene_animated.png');
    let charBuffer;
    if (existsSync(charSpritesheet)) {
        charBuffer = await extractIdleFrame(charSpritesheet);
        charBuffer = await upscaleNN(charBuffer, 6); // 32×32 → 192×192
    } else {
        // Fallback to rookie
        const rookiePath = path.join(SPRITES, 'rookie_animated.png');
        charBuffer = await extractIdleFrame(rookiePath);
        charBuffer = await upscaleNN(charBuffer, 6);
    }
    const charMeta = await sharp(charBuffer).metadata();

    // 3. Extract and upscale a second character
    log('3. Sprite Mamie Josette...');
    const char2Spritesheet = path.join(SPRITES, 'mamie_josette_animated.png');
    let char2Buffer;
    if (existsSync(char2Spritesheet)) {
        char2Buffer = await extractIdleFrame(char2Spritesheet);
        char2Buffer = await upscaleNN(char2Buffer, 5); // 32×32 → 160×160
    }

    // 4. Boule sprite
    log('4. Sprite boule...');
    const boulePath = path.join(SPRITES, 'boule_acier.png');
    let bouleBuffer = null;
    if (existsSync(boulePath)) {
        bouleBuffer = await sharp(boulePath)
            .resize(48, 48, { kernel: sharp.kernel.nearest })
            .toBuffer();
    }

    // 5. Cochonnet sprite
    log('5. Sprite cochonnet...');
    const cochPath = path.join(SPRITES, 'cochonnet.png');
    let cochBuffer = null;
    if (existsSync(cochPath)) {
        cochBuffer = await sharp(cochPath)
            .resize(28, 28, { kernel: sharp.kernel.nearest })
            .toBuffer();
    }

    // 6. Title text
    log('6. Titre PETANQUE MASTER...');
    const titleSVG = Buffer.from(`
        <svg width="${W}" height="60">
            <text x="50%" y="40" text-anchor="middle"
                font-family="'Courier New', 'Consolas', monospace"
                font-weight="900" font-size="36" fill="#D4A574"
                letter-spacing="3" stroke="#3A2E28" stroke-width="2"
                paint-order="stroke">PETANQUE MASTER</text>
        </svg>
    `);
    const titleBuffer = await sharp(titleSVG).png().toBuffer();

    // 7. Subtitle text
    log('7. Sous-titre...');
    const subtitleSVG = Buffer.from(`
        <svg width="${W}" height="36">
            <text x="50%" y="24" text-anchor="middle"
                font-family="'Courier New', 'Consolas', monospace"
                font-weight="700" font-size="16" fill="#F5E6D0"
                letter-spacing="2">FREE BROWSER GAME</text>
        </svg>
    `);
    const subtitleBuffer = await sharp(subtitleSVG).png().toBuffer();

    // 8. "VS" badge
    log('8. Badge VS...');
    const vsSVG = Buffer.from(`
        <svg width="60" height="60">
            <circle cx="30" cy="30" r="28" fill="#C44B3F" stroke="#3A2E28" stroke-width="3"/>
            <text x="30" y="36" text-anchor="middle"
                font-family="'Courier New', monospace"
                font-weight="900" font-size="24" fill="#FFD700">VS</text>
        </svg>
    `);
    const vsBuffer = await sharp(vsSVG).png().toBuffer();

    // 9. Thin accent line between sky and band
    const accentLine = await sharp({
        create: { width: W, height: 4, channels: 4, background: { r: 212, g: 165, b: 116, alpha: 1 } }
    }).png().toBuffer();

    // ─── COMPOSE ───
    log('9. Composition finale...');

    const composites = [
        // Terracotta band at bottom
        { input: band, top: skyHeight, left: 0 },
        // Accent line
        { input: accentLine, top: skyHeight - 2, left: 0 },
        // Title at top
        { input: titleBuffer, top: 30, left: 0 },
        // Subtitle on terracotta band
        { input: subtitleBuffer, top: skyHeight + 30, left: 0 },
    ];

    // Character 1 (Papi René) — left side
    if (charBuffer) {
        composites.push({
            input: charBuffer,
            top: skyHeight - charMeta.height - 10,
            left: 60,
        });
    }

    // Character 2 (Mamie Josette) — right side
    if (char2Buffer) {
        const c2Meta = await sharp(char2Buffer).metadata();
        composites.push({
            input: char2Buffer,
            top: skyHeight - c2Meta.height - 10,
            left: W - c2Meta.width - 60,
        });
    }

    // VS badge between characters
    composites.push({
        input: vsBuffer,
        top: skyHeight - 140,
        left: Math.round(W / 2) - 30,
    });

    // Boule in flight (arc position, upper right area)
    if (bouleBuffer) {
        composites.push({
            input: bouleBuffer,
            top: 100,
            left: W - 180,
        });
    }

    // Cochonnet near center bottom of sky area
    if (cochBuffer) {
        composites.push({
            input: cochBuffer,
            top: skyHeight - 50,
            left: Math.round(W / 2) - 14,
        });
    }

    // Final compose on sky background
    await sharp(sky)
        .extend({ bottom: BAND_H, background: { r: 196, g: 133, b: 74, alpha: 1 } })
        .composite(composites)
        .png()
        .toFile(OUTPUT);

    log(`Cover art générée : ${OUTPUT}`);

    // ─── Generate thumbnail preview (315×250) ───
    const thumbPath = path.join(OUTPUT_DIR, 'cover-art-thumb-315x250.png');
    await sharp(OUTPUT)
        .resize(315, 250, { kernel: sharp.kernel.nearest })
        .toFile(thumbPath);
    log(`Thumbnail preview : ${thumbPath}`);

    log('Terminé !');
}

main().catch((err) => {
    console.error('[cover-art] Erreur:', err.message);
    process.exit(1);
});
