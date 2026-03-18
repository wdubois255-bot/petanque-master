/**
 * Generate a 512x512 spritesheet for La Choupe from a single 64x64 source sprite.
 * 4 columns x 4 rows, each cell 128x128 (upscaled 2x nearest-neighbor).
 *
 * Row 0 (south walk): base sprite with subtle Y offsets (0, +2, 0, -2)
 * Row 1 (west walk):  horizontally flipped, same Y offsets
 * Row 2 (east walk):  base sprite (no flip), same Y offsets
 * Row 3 (north walk): base sprite (no flip), same Y offsets
 */
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const SRC = path.join(ROOT, 'AssetPetanqueMasterFinal', 'sprites', 'personnages', 'la choup.png');
const DST = path.join(ROOT, 'public', 'assets', 'sprites', 'la_choupe_animated.png');

const CELL = 128;
const COLS = 4;
const ROWS = 4;
const SHEET_W = CELL * COLS;  // 512
const SHEET_H = CELL * ROWS;  // 512

// Subtle walk offsets (Y pixel shift per frame)
const WALK_OFFSETS = [0, 2, 0, -2];

async function main() {
    // 1. Read source 64x64 and upscale to 128x128 nearest-neighbor
    const base128 = await sharp(SRC)
        .resize(CELL, CELL, { kernel: sharp.kernel.nearest })
        .png()
        .toBuffer();

    // 2. Create flipped version (horizontal)
    const flipped128 = await sharp(base128)
        .flop()
        .png()
        .toBuffer();

    // 3. Build composite list
    const composites = [];

    for (let row = 0; row < ROWS; row++) {
        const isFlipped = (row === 1); // row 1 = west = flipped
        const srcBuf = isFlipped ? flipped128 : base128;

        for (let col = 0; col < COLS; col++) {
            const offsetY = WALK_OFFSETS[col];
            const x = col * CELL;
            const y = row * CELL + offsetY;

            composites.push({
                input: srcBuf,
                left: x,
                top: y,
            });
        }
    }

    // 4. Create 512x512 transparent canvas and composite all frames
    await sharp({
        create: {
            width: SHEET_W,
            height: SHEET_H,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0 },
        }
    })
        .composite(composites)
        .png()
        .toFile(DST);

    // 5. Verify output dimensions
    const meta = await sharp(DST).metadata();
    console.log(`Created ${DST}`);
    console.log(`Dimensions: ${meta.width}x${meta.height} (expected ${SHEET_W}x${SHEET_H})`);
    if (meta.width !== SHEET_W || meta.height !== SHEET_H) {
        console.error('ERROR: Unexpected dimensions!');
        process.exit(1);
    }
    console.log('Done!');
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
