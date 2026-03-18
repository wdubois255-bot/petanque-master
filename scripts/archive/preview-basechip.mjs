#!/usr/bin/env node
/**
 * Extract specific tile rows from basechip_pipoya.png and create a labeled preview grid.
 * Usage: node scripts/preview-basechip.mjs
 */
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const BASECHIP = path.join(ROOT, 'public/assets/tilesets/basechip_pipoya.png');
const OUTPUT = path.join(ROOT, 'preview-basechip.png');

const TILE = 32;
const COLS = 8;

// Rows to extract (inclusive ranges)
const ROW_RANGES = [
    { label: 'Row 0-1: terrain basics', startRow: 0, endRow: 1 },
    { label: 'Row 6-8: decorations', startRow: 6, endRow: 8 },
    { label: 'Row 19-23: buildings/fences', startRow: 19, endRow: 23 },
    { label: 'Row 32-36: stone/walls', startRow: 32, endRow: 36 },
    { label: 'Row 40-44: possibly roofs', startRow: 40, endRow: 44 },
    { label: 'Row 48-52: doors/windows', startRow: 48, endRow: 52 },
    { label: 'Row 56-60: interiors', startRow: 56, endRow: 60 },
    { label: 'Row 64-68: extra 1', startRow: 64, endRow: 68 },
    { label: 'Row 72-76: extra 2', startRow: 72, endRow: 76 },
    { label: 'Row 80-84: extra 3', startRow: 80, endRow: 84 },
    { label: 'Row 88-92: extra 4', startRow: 88, endRow: 92 },
    { label: 'Row 96-100: extra 5', startRow: 96, endRow: 100 },
    { label: 'Row 104-108: extra 6', startRow: 104, endRow: 108 },
    { label: 'Row 112-116: extra 7', startRow: 112, endRow: 116 },
    { label: 'Row 120-124: extra 8', startRow: 120, endRow: 124 },
    { label: 'Row 125-132: extra 9 (last)', startRow: 125, endRow: 132 },
];

async function main() {
    const meta = await sharp(BASECHIP).metadata();
    console.log(`Basechip: ${meta.width}x${meta.height} (${meta.width / TILE} cols x ${meta.height / TILE} rows)`);

    const maxRow = Math.floor(meta.height / TILE) - 1;

    // Scale factor for the preview (2x for readability)
    const SCALE = 2;
    const LABEL_H = 24; // pixels for label text area

    // Calculate total height
    let totalRows = 0;
    const sections = [];
    for (const range of ROW_RANGES) {
        const sr = Math.min(range.startRow, maxRow);
        const er = Math.min(range.endRow, maxRow);
        const rowCount = er - sr + 1;
        totalRows += rowCount;
        sections.push({ ...range, startRow: sr, endRow: er, rowCount });
    }

    const outputWidth = COLS * TILE * SCALE;
    const outputHeight = sections.reduce((h, s) => h + LABEL_H + s.rowCount * TILE * SCALE, 0);

    // Build composite operations
    const composites = [];
    let currentY = 0;

    for (const section of sections) {
        // Add label as SVG text
        const labelSvg = Buffer.from(`<svg width="${outputWidth}" height="${LABEL_H}">
            <rect width="100%" height="100%" fill="#222"/>
            <text x="4" y="17" font-family="monospace" font-size="13" fill="#FFD700">${section.label} (idx ${section.startRow * COLS}-${(section.endRow + 1) * COLS - 1})</text>
        </svg>`);

        composites.push({
            input: labelSvg,
            top: currentY,
            left: 0,
        });
        currentY += LABEL_H;

        // Extract tile rows from source
        const extractTop = section.startRow * TILE;
        const extractHeight = section.rowCount * TILE;

        if (extractTop + extractHeight <= meta.height) {
            const tileStrip = await sharp(BASECHIP)
                .extract({ left: 0, top: extractTop, width: COLS * TILE, height: extractHeight })
                .resize(COLS * TILE * SCALE, extractHeight * SCALE, { kernel: 'nearest' })
                .png()
                .toBuffer();

            composites.push({
                input: tileStrip,
                top: currentY,
                left: 0,
            });
        }

        currentY += section.rowCount * TILE * SCALE;
    }

    // Create output image
    await sharp({
        create: {
            width: outputWidth,
            height: outputHeight,
            channels: 4,
            background: { r: 34, g: 34, b: 34, alpha: 255 },
        }
    })
        .composite(composites)
        .png()
        .toFile(OUTPUT);

    console.log(`Preview saved to: ${OUTPUT}`);
    console.log(`Total sections: ${sections.length}, output: ${outputWidth}x${outputHeight}`);

    // Also create individual row extracts for closer inspection
    for (const section of sections) {
        const extractTop = section.startRow * TILE;
        const extractHeight = section.rowCount * TILE;
        if (extractTop + extractHeight <= meta.height) {
            const outFile = path.join(ROOT, `preview-rows-${section.startRow}-${section.endRow}.png`);
            await sharp(BASECHIP)
                .extract({ left: 0, top: extractTop, width: COLS * TILE, height: extractHeight })
                .resize(COLS * TILE * 4, extractHeight * 4, { kernel: 'nearest' })
                .png()
                .toFile(outFile);
        }
    }
    console.log('Individual row previews also saved.');
}

main().catch(console.error);
