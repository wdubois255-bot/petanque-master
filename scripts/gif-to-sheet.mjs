#!/usr/bin/env node
/**
 * gif-to-sheet.mjs
 * Converts animated GIFs from PixelLab into 512x128 horizontal PNG spritesheets
 * Usage: node scripts/gif-to-sheet.mjs
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const BASE = 'public/assets/sprites/v2_new/';

const CONVERSIONS = [
    // Greetings (expressions/ → sprites/[name]_greeting.png)
    {
        input: BASE + 'expressions/flamboyant_charismatic_petanque_showman_legend_72_custom-small beckoning gesture with free hand, playful co_south.gif',
        output: 'public/assets/sprites/foyot_greeting.png',
        label: 'foyot_greeting'
    },
    {
        input: BASE + 'expressions/intense_methodical_petanque_player_of_the_century_custom-The methodical player gives a brief controlled nod_south.gif',
        output: 'public/assets/sprites/fazzino_greeting.png',
        label: 'fazzino_greeting'
    },
    {
        input: BASE + 'expressions/young_beginner_petanque_player_20_years_old_man_me_custom-The young rookie raises one hand in a friendly wav_south.gif',
        output: 'public/assets/sprites/rookie_greeting.png',
        label: 'rookie_greeting'
    },
    // Throw (throw_anims/ → throw_anims/sheets/throw_[name].png)
    {
        input: BASE + 'throw_anims/intense_methodical_petanque_player_of_the_century_custom-The athletic player stands with feet firmly plante_n.gif',
        output: BASE + 'throw_anims/sheets/throw_fazzino.png',
        label: 'throw_fazzino'
    },
    {
        input: BASE + 'expressions/dominant_powerful_petanque_world_champion_58_years_custom-The stocky petanque champion gives a slow dignifie_south.gif',
        output: 'public/assets/sprites/papi_rene_greeting.png',
        label: 'papi_rene_greeting'
    },
    {
        input: BASE + 'throw_anims/dominant_powerful_petanque_world_champion_58_years_custom-Seen from behind, back view. Pixel art petanque pl_north.gif',
        output: BASE + 'throw_anims/sheets/throw_papi_rene.png',
        label: 'throw_papi_rene'
    }
];

const FRAME_SIZE = 128;
const N_FRAMES = 4;

async function gifToSheet(inputPath, outputPath, label) {
    console.log(`\n🎬 ${label}`);

    if (!fs.existsSync(inputPath)) {
        console.error(`  ❌ Fichier introuvable: ${inputPath}`);
        return false;
    }

    // Get number of frames in the GIF
    const meta = await sharp(inputPath, { pages: -1 }).metadata();
    const totalFrames = meta.pages || 1;
    console.log(`  📦 ${totalFrames} frames détectées`);

    // Extract frames (use first 4, or duplicate last if less than 4)
    const frameBuffers = [];
    for (let i = 0; i < N_FRAMES; i++) {
        const frameIndex = Math.min(i, totalFrames - 1);
        const buf = await sharp(inputPath, { page: frameIndex })
            .resize(FRAME_SIZE, FRAME_SIZE, { kernel: 'nearest', fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .png()
            .toBuffer();
        frameBuffers.push(buf);
    }

    // Assemble horizontal strip 512x128
    const composites = frameBuffers.map((buf, i) => ({ input: buf, left: i * FRAME_SIZE, top: 0 }));

    await sharp({
        create: {
            width: N_FRAMES * FRAME_SIZE,
            height: FRAME_SIZE,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
    })
        .composite(composites)
        .png()
        .toFile(outputPath);

    console.log(`  ✅ Sauvegardé → ${outputPath}`);
    return true;
}

async function main() {
    console.log('='.repeat(55));
    console.log('🖼️  GIF → PNG SHEET CONVERTER — Petanque Master');
    console.log('='.repeat(55));

    let ok = 0;
    for (const conv of CONVERSIONS) {
        const success = await gifToSheet(conv.input, conv.output, conv.label);
        if (success) ok++;
    }

    console.log(`\n${'='.repeat(55)}`);
    console.log(`✅ ${ok}/${CONVERSIONS.length} conversions réussies`);
}

main().catch(err => {
    console.error('❌ Erreur:', err.message);
    process.exit(1);
});
