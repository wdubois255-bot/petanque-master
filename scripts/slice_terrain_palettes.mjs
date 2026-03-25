#!/usr/bin/env node
/**
 * Découpe les palettes de terrain PixelLab en tiles individuels.
 * Crée un dossier par type de terrain dans v2_new/terrains/
 */
import sharp from 'sharp';
import { mkdirSync, existsSync } from 'fs';
import { join, resolve } from 'path';

const BASE = resolve('public/assets/sprites/v2_new/terrains');

// Config: source file → folder name, grid cols x rows
const PALETTES = [
    {
        src: 'pixellab-packed-brown-earth-petanque-te-1774130926511.png',
        folder: 'terre_battue',
        prefix: 'terre',
        cols: 4, rows: 4,
        gap: 1,  // 259 = 4*64 + 3*1
    },
    {
        src: 'pixellab-Lush-green-grass-ground-textur-1774442412033.png',
        folder: 'herbe',
        prefix: 'herbe',
        cols: 4, rows: 4,
        gap: 1,
    },
    {
        src: 'pixellab-Fine-beach-sand-ground-texture-1774442752115.png',
        folder: 'sable',
        prefix: 'sable',
        cols: 4, rows: 4,
        gap: 1,
    },
    {
        src: 'pixellab-Weathered-concrete-slab-floor--1774442947669.png',
        folder: 'dalles',
        prefix: 'dalles',
        cols: 4, rows: 4,
        gap: 1,  // 259 = 4*64 + 3*1 (same as other PixelLab outputs)
    },
    {
        src: 'pixellab-pixel-art-small-gravel-impact--1774281732882.png',
        folder: 'gravier_impact',
        prefix: 'impact',
        cols: 4, rows: 4,
        gap: 0,  // 256 = 4*64
    },
    {
        src: 'pixellab-pixel-art-small-scattered-ston-1774283903515.png',
        folder: 'pierres',
        prefix: 'pierres',
        cols: 4, rows: 4,
        gap: 0,
    },
];

async function slicePalette(config) {
    const srcPath = join(BASE, config.src);
    if (!existsSync(srcPath)) {
        console.error(`  ✗ Source not found: ${config.src}`);
        return 0;
    }

    const outDir = join(BASE, config.folder);
    mkdirSync(outDir, { recursive: true });

    const img = sharp(srcPath);
    const meta = await img.metadata();
    const { width, height } = meta;

    // Calculate tile size from image dimensions and grid
    const tileW = Math.floor((width - (config.cols - 1) * config.gap) / config.cols);
    const tileH = Math.floor((height - (config.rows - 1) * config.gap) / config.rows);

    console.log(`  ${config.folder}: ${width}x${height} → ${config.cols}x${config.rows} grid, tile ${tileW}x${tileH}, gap ${config.gap}px`);

    let count = 0;
    for (let row = 0; row < config.rows; row++) {
        for (let col = 0; col < config.cols; col++) {
            const x = col * (tileW + config.gap);
            const y = row * (tileH + config.gap);
            const idx = String(row * config.cols + col + 1).padStart(2, '0');
            const outFile = join(outDir, `${config.prefix}_${idx}.png`);

            // Clamp to image bounds
            const extractW = Math.min(tileW, width - x);
            const extractH = Math.min(tileH, height - y);

            if (extractW <= 0 || extractH <= 0) continue;

            await sharp(srcPath)
                .extract({ left: x, top: y, width: extractW, height: extractH })
                .toFile(outFile);
            count++;
        }
    }

    console.log(`  → ${count} tiles saved to ${config.folder}/`);
    return count;
}

async function main() {
    console.log('=== Découpe des palettes de terrain ===\n');

    let total = 0;
    for (const palette of PALETTES) {
        total += await slicePalette(palette);
    }

    console.log(`\n=== Total: ${total} tiles découpés ===`);
}

main().catch(console.error);
