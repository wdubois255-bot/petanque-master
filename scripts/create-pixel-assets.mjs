/**
 * Create improved pixel art assets for Petanque Master
 * Uses sharp to draw pixel-perfect sprites with proper shading
 *
 * Usage: node scripts/create-pixel-assets.mjs
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'public', 'assets', 'sprites');

// ============================================================
// PALETTE — Endesga 32 inspired + Provençal tints
// ============================================================
const PAL = {
    // Metals
    steel: ['#1a1a2e', '#2d2d44', '#4a4a5e', '#6e6e82', '#9898a8', '#c0c0cc', '#e8e8f0'],
    bronze: ['#2a1a0a', '#4a3018', '#7a5030', '#a87848', '#c89868', '#e0b888', '#f0d8b0'],
    chrome: ['#1a1a20', '#3a3a48', '#5a5a68', '#8888a0', '#aaaabc', '#d0d0e0', '#f0f0ff'],
    noir: ['#0a0a10', '#1a1a22', '#2a2a34', '#3e3e4a', '#585860', '#787880', '#a0a0a8'],
    rouge: ['#2a0a0a', '#5a1818', '#8a2828', '#b84040', '#d06060', '#e08888', '#f0b0b0'],
    // Cochonnet
    bois: ['#3a2a18', '#5a4020', '#8a6838', '#b89050', '#d0a868', '#e0c088', '#f0daa8'],
    bleu: ['#0a1a3a', '#183060', '#2848a0', '#4070c0', '#6090d8', '#88b0e0', '#b0d0f0'],
    vert: ['#0a2a1a', '#184028', '#286838', '#408850', '#60a868', '#88c088', '#b0d8b0'],
    // Terrain
    terre: ['#3a2e20', '#5a4830', '#8a6e48', '#b09060', '#c8a878', '#d8c090', '#e8d8b0'],
    herbe: ['#1a2a10', '#2a4018', '#3a5828', '#4a7038', '#6a8a4a', '#88a860', '#a8c880'],
    sable: ['#4a3a20', '#7a6840', '#a89060', '#c8b078', '#d8c890', '#e8d8a8', '#f0e8c0'],
    dalles: ['#3a3a38', '#585850', '#787870', '#989890', '#b0b0a8', '#c8c8c0', '#e0e0d8'],
};

// ============================================================
// HELPER: Create a raw RGBA buffer and draw pixel by pixel
// ============================================================
function createCanvas(w, h) {
    const buf = Buffer.alloc(w * h * 4, 0); // RGBA, fully transparent
    return {
        width: w, height: h, buf,
        setPixel(x, y, hex, alpha = 255) {
            if (x < 0 || x >= w || y < 0 || y >= h) return;
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            const i = (y * w + x) * 4;
            buf[i] = r; buf[i + 1] = g; buf[i + 2] = b; buf[i + 3] = alpha;
        },
        getPixel(x, y) {
            if (x < 0 || x >= w || y < 0 || y >= h) return [0, 0, 0, 0];
            const i = (y * w + x) * 4;
            return [buf[i], buf[i + 1], buf[i + 2], buf[i + 3]];
        },
        async save(filepath) {
            await sharp(buf, { raw: { width: w, height: h, channels: 4 } })
                .png().toFile(filepath);
        }
    };
}

// Distance from center, normalized 0-1
function dist(x, y, cx, cy, r) {
    return Math.sqrt((x - cx) ** 2 + (y - cy) ** 2) / r;
}

// ============================================================
// PHASE 1: BOULES — Spherical shading with 7-tone palette
// ============================================================
function drawBall(canvas, cx, cy, radius, palette, opts = {}) {
    const { lightX = -0.35, lightY = -0.40, dither = false } = opts;

    for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
            const dx = (x - cx) / radius;
            const dy = (y - cy) / radius;
            const d = Math.sqrt(dx * dx + dy * dy);

            if (d > 1.05) continue; // outside sphere

            if (d > 0.95) {
                // Outline (darkest)
                canvas.setPixel(x, y, palette[0]);
                continue;
            }

            // Spherical normal dot light direction
            const nz = Math.sqrt(Math.max(0, 1 - dx * dx - dy * dy));
            const light = Math.max(0, dx * lightX + dy * lightY + nz * 0.75);

            // Map light to palette index (0=darkest, 6=brightest)
            let idx = Math.floor(light * 6.5);
            idx = Math.max(0, Math.min(6, idx));

            // Dithering: checkerboard pattern at transitions
            if (dither && (x + y) % 2 === 0) {
                idx = Math.max(0, idx - 1);
            }

            canvas.setPixel(x, y, palette[idx]);
        }
    }

    // Specular highlight (bright spot)
    const hlx = Math.round(cx + radius * lightX * 0.5);
    const hly = Math.round(cy + radius * lightY * 0.5);
    canvas.setPixel(hlx, hly, palette[6]);
    canvas.setPixel(hlx + 1, hly, palette[6]);
    canvas.setPixel(hlx, hly + 1, palette[5]);
    canvas.setPixel(hlx + 1, hly + 1, palette[6]);
    // Secondary smaller highlight
    canvas.setPixel(hlx - 1, hly - 1, palette[5]);
}

async function generateBalls() {
    console.log('\n=== PHASE 1: BOULES ===');

    const balls = [
        { name: 'boule_acier', palette: PAL.steel, dither: true },
        { name: 'boule_bronze', palette: PAL.bronze, dither: true },
        { name: 'boule_chrome', palette: PAL.chrome, dither: true },
        { name: 'boule_noire', palette: PAL.noir, dither: false },
        { name: 'boule_rouge', palette: PAL.rouge, dither: false },
    ];

    for (const ball of balls) {
        const c = createCanvas(32, 32);
        drawBall(c, 15, 15, 13, ball.palette, {
            dither: ball.dither,
            lightX: -0.35,
            lightY: -0.40
        });
        const outPath = path.join(OUT, `${ball.name}.png`);
        await c.save(outPath);
        console.log(`  ✓ ${ball.name}.png`);
    }

    // Cochonnets (smaller, 16x16 centered in 32x32)
    const cochonnets = [
        { name: 'cochonnet', palette: PAL.bois },
        { name: 'cochonnet_bleu', palette: PAL.bleu },
        { name: 'cochonnet_vert', palette: PAL.vert },
    ];

    for (const coch of cochonnets) {
        const c = createCanvas(32, 32);
        drawBall(c, 15, 15, 9, coch.palette, { lightX: -0.3, lightY: -0.35 });
        const outPath = path.join(OUT, `${coch.name}.png`);
        await c.save(outPath);
        console.log(`  ✓ ${coch.name}.png`);
    }
}

// ============================================================
// PHASE 3: TERRAIN TEXTURES — Seamless tiling 64x64
// ============================================================
function seededRandom(seed) {
    let s = seed;
    return () => {
        s = (s * 1103515245 + 12345) & 0x7fffffff;
        return s / 0x7fffffff;
    };
}

async function generateTerrainTextures() {
    console.log('\n=== PHASE 3: TERRAIN TEXTURES ===');

    const terrains = [
        { name: 'terrain_tex_terre', palette: PAL.terre, noise: 800, grain: 0.08 },
        { name: 'terrain_tex_herbe', palette: PAL.herbe, noise: 600, grain: 0.06 },
        { name: 'terrain_tex_sable', palette: PAL.sable, noise: 1000, grain: 0.10 },
        { name: 'terrain_tex_dalles', palette: PAL.dalles, noise: 300, grain: 0.04 },
    ];

    for (const terrain of terrains) {
        const size = 64;
        const c = createCanvas(size, size);
        const rng = seededRandom(terrain.name.length * 1337);

        // Base fill with mid-tone
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const baseIdx = 3; // mid-tone
                const variation = Math.floor(rng() * 3) - 1; // -1, 0, or 1
                const idx = Math.max(1, Math.min(5, baseIdx + variation));
                c.setPixel(x, y, terrain.palette[idx]);
            }
        }

        // Add noise particles
        for (let i = 0; i < terrain.noise; i++) {
            const x = Math.floor(rng() * size);
            const y = Math.floor(rng() * size);
            const darkOrLight = rng() > 0.5 ? 1 : 5;
            const alpha = Math.floor(80 + rng() * 100);
            c.setPixel(x, y, terrain.palette[darkOrLight], alpha);
        }

        // Add subtle grain texture
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                if (rng() < terrain.grain) {
                    const idx = rng() > 0.5 ? 6 : 0;
                    c.setPixel(x, y, terrain.palette[idx], 40);
                }
            }
        }

        const outPath = path.join(OUT, `${terrain.name}.png`);
        await c.save(outPath);
        console.log(`  ✓ ${terrain.name}.png (${size}x${size} seamless)`);
    }
}

// ============================================================
// PHASE 4: BORDER TILES — 9-slice system
// ============================================================
async function generateBorderTiles() {
    console.log('\n=== PHASE 4: BORDER TILES ===');

    const tileSize = 16;
    // 9-slice: TL, T, TR, L, C, R, BL, B, BR
    // We generate a 48x48 image (3x3 grid of 16x16 tiles)

    const borders = [
        {
            name: 'border_wood',
            base: '#8B6B3A', dark: '#5A4020', light: '#B09060', grain: '#6A5030',
            highlight: '#C8A868'
        },
        {
            name: 'border_stone',
            base: '#888880', dark: '#585850', light: '#B0B0A8', grain: '#707068',
            highlight: '#C8C8C0'
        },
    ];

    for (const border of borders) {
        const c = createCanvas(48, 48);
        const rng = seededRandom(border.name.length * 42);

        // Fill all 9 tiles with base color
        for (let y = 0; y < 48; y++) {
            for (let x = 0; x < 48; x++) {
                c.setPixel(x, y, border.base);
            }
        }

        // Draw border structure: outer dark edge, inner light edge
        for (let i = 0; i < 48; i++) {
            // Top edge
            c.setPixel(i, 0, border.dark);
            c.setPixel(i, 1, border.light);
            // Bottom edge
            c.setPixel(i, 47, border.dark);
            c.setPixel(i, 46, border.light);
            // Left edge
            c.setPixel(0, i, border.dark);
            c.setPixel(1, i, border.light);
            // Right edge
            c.setPixel(47, i, border.dark);
            c.setPixel(46, i, border.light);
        }

        // Grain texture
        for (let y = 2; y < 46; y++) {
            for (let x = 2; x < 46; x++) {
                if (rng() < 0.15) c.setPixel(x, y, border.grain);
                if (rng() < 0.05) c.setPixel(x, y, border.highlight);
            }
        }

        // Corner reinforcements (darker 4x4 corners)
        for (let dy = 0; dy < 4; dy++) {
            for (let dx = 0; dx < 4; dx++) {
                c.setPixel(dx, dy, border.dark); // TL
                c.setPixel(47 - dx, dy, border.dark); // TR
                c.setPixel(dx, 47 - dy, border.dark); // BL
                c.setPixel(47 - dx, 47 - dy, border.dark); // BR
            }
        }

        const outPath = path.join(OUT, `${border.name}_9slice.png`);
        await c.save(outPath);
        console.log(`  ✓ ${border.name}_9slice.png (48x48, 3x3 tiles of 16x16)`);
    }
}

// ============================================================
// PHASE 5: DECOR SPRITES — Provençal elements
// ============================================================
async function generateDecors() {
    console.log('\n=== PHASE 5: DECORS ===');

    // --- Pin parasol (32x48) ---
    {
        const c = createCanvas(32, 48);
        const trunk = ['#3a2a18', '#5a4020', '#7a5830'];
        const leaves = ['#2a4018', '#3a5828', '#4a7038', '#6a8a4a'];

        // Trunk (thin, offset center)
        for (let y = 24; y < 48; y++) {
            const w = y > 40 ? 3 : 2;
            for (let dx = -w; dx <= w; dx++) {
                const x = 15 + dx;
                const shade = Math.abs(dx) >= w ? 0 : (dx < 0 ? 1 : 2);
                c.setPixel(x, y, trunk[shade]);
            }
        }

        // Canopy (umbrella shape)
        for (let y = 2; y < 26; y++) {
            const yRatio = (y - 2) / 24;
            const width = Math.floor(4 + yRatio * 12);
            for (let dx = -width; dx <= width; dx++) {
                const x = 15 + dx;
                if (x < 0 || x >= 32) continue;
                const d = Math.abs(dx) / width;
                const idx = d < 0.3 ? 3 : d < 0.6 ? 2 : d < 0.85 ? 1 : 0;
                c.setPixel(x, y, leaves[idx]);
            }
        }

        await c.save(path.join(OUT, 'decor_pin.png'));
        console.log('  ✓ decor_pin.png (32x48)');
    }

    // --- Olivier (32x40) ---
    {
        const c = createCanvas(32, 40);
        const trunk = ['#3a2a18', '#5a4020', '#7a5830'];
        const leaves = ['#4a5828', '#5a7038', '#6a8a4a', '#88a860'];

        // Gnarled trunk
        for (let y = 20; y < 40; y++) {
            const wobble = Math.sin(y * 0.5) * 1.5;
            const w = y > 34 ? 3 : 2;
            for (let dx = -w; dx <= w; dx++) {
                const x = Math.round(15 + dx + wobble);
                if (x >= 0 && x < 32) {
                    c.setPixel(x, y, trunk[Math.abs(dx) >= w ? 0 : 1]);
                }
            }
        }

        // Round canopy (olive tree = round, not umbrella)
        for (let y = 2; y < 24; y++) {
            for (let x = 4; x < 28; x++) {
                const d = dist(x, y, 16, 13, 12);
                if (d > 1) continue;
                const idx = d < 0.4 ? 3 : d < 0.65 ? 2 : d < 0.85 ? 1 : 0;
                c.setPixel(x, y, leaves[idx]);
            }
        }

        await c.save(path.join(OUT, 'decor_olivier.png'));
        console.log('  ✓ decor_olivier.png (32x40)');
    }

    // --- Banc en bois (48x24) ---
    {
        const c = createCanvas(48, 24);
        const wood = ['#3a2a18', '#5a4020', '#7a5830', '#9a7848'];

        // Seat planks (3 horizontal planks)
        for (let p = 0; p < 3; p++) {
            const py = 6 + p * 4;
            for (let x = 4; x < 44; x++) {
                for (let dy = 0; dy < 3; dy++) {
                    const shade = dy === 0 ? 3 : dy === 2 ? 1 : 2;
                    c.setPixel(x, py + dy, wood[shade]);
                }
            }
        }

        // Legs (4 vertical posts)
        const legXs = [6, 18, 30, 42];
        for (const lx of legXs) {
            for (let y = 16; y < 24; y++) {
                c.setPixel(lx, y, wood[1]);
                c.setPixel(lx + 1, y, wood[2]);
            }
        }

        await c.save(path.join(OUT, 'decor_banc.png'));
        console.log('  ✓ decor_banc.png (48x24)');
    }

    // --- Fontaine (32x40) ---
    {
        const c = createCanvas(32, 40);
        const stone = ['#585850', '#787870', '#989890', '#b0b0a8'];
        const water = ['#2848a0', '#4070c0', '#6090d8'];

        // Base (wide rectangle)
        for (let y = 28; y < 40; y++) {
            for (let x = 4; x < 28; x++) {
                const shade = y < 30 ? 3 : y > 37 ? 0 : (x < 6 || x > 25 ? 1 : 2);
                c.setPixel(x, y, stone[shade]);
            }
        }

        // Column (thin center)
        for (let y = 8; y < 28; y++) {
            for (let dx = -2; dx <= 2; dx++) {
                const x = 16 + dx;
                c.setPixel(x, y, stone[dx === 0 ? 3 : Math.abs(dx) >= 2 ? 1 : 2]);
            }
        }

        // Top basin
        for (let x = 8; x < 24; x++) {
            c.setPixel(x, 7, stone[3]);
            c.setPixel(x, 8, stone[2]);
        }

        // Water in basin
        for (let y = 30; y < 37; y++) {
            for (let x = 6; x < 26; x++) {
                const wIdx = (x + y) % 3;
                c.setPixel(x, y, water[wIdx], 180);
            }
        }

        await c.save(path.join(OUT, 'decor_fontaine.png'));
        console.log('  ✓ decor_fontaine.png (32x40)');
    }
}

// ============================================================
// MAIN
// ============================================================
(async () => {
    console.log('=== Pixel Art Asset Generator ===');
    console.log('Palette: Endesga 32 inspired + Provençal');
    console.log('Output:', OUT);

    await generateBalls();
    await generateTerrainTextures();
    await generateBorderTiles();
    await generateDecors();

    console.log('\n=== ALL DONE ===');
})();
