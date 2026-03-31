/**
 * Génère la cover art 630×500 pour itch.io.
 *
 * Base : screenshot 04-vsintro-personnages.png (1664×960, rendu WebGL réel).
 * Crop centré → 630×500 + overlay titre SVG.
 * Résultat : composition dramatique avec vrais personnages, vs le précédent
 * assemblage de sprites upscalés.
 *
 * Usage : node scripts/generate-cover-art.mjs
 * Prérequis : avoir lancé capture-itch-assets.mjs avant (04-vsintro doit exister)
 * Sortie : docs/lancement/assets/cover-art-630x500.png
 */

import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync } from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SCREENSHOTS = path.join(ROOT, 'docs', 'lancement', 'assets', 'screenshots');
const OUTPUT_DIR = path.join(ROOT, 'docs', 'lancement', 'assets');
const OUTPUT = path.join(OUTPUT_DIR, 'cover-art-630x500.png');
const VSINTRO = path.join(SCREENSHOTS, '04-vsintro-personnages.png');

if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

function log(msg) {
    console.log(`[cover-art] ${msg}`);
}

async function main() {
    if (!existsSync(VSINTRO)) {
        console.error('[cover-art] ERREUR : 04-vsintro-personnages.png introuvable.');
        console.error('  Lancer d\'abord : node scripts/capture-itch-assets.mjs');
        process.exit(1);
    }

    log('Génération de la cover art 630×500 depuis screenshot VSIntro...');

    const W = 630;
    const H = 500;

    // ─── Le screenshot est 1664×960 (2x deviceScaleFactor) ───
    // On crop centré pour obtenir l'aspect ratio 630/500 = 1.26:1
    // 960 × 1.26 = 1210px de large → on crop la largeur
    const CROP_W = Math.round(960 * (W / H));  // 1210
    const CROP_H = 960;
    const CROP_LEFT = Math.round((1664 - CROP_W) / 2);  // 227

    log(`1. Crop 04-vsintro (1664×960 → ${CROP_W}×${CROP_H} centré, left=${CROP_LEFT})...`);

    const cropped = await sharp(VSINTRO)
        .extract({ left: CROP_LEFT, top: 0, width: CROP_W, height: CROP_H })
        .resize(W, H, { kernel: sharp.kernel.nearest })
        .toBuffer();

    // ─── Gradient sombre en haut pour le titre ───
    log('2. Gradient sombre haut (lisibilité titre)...');
    const topGradient = Buffer.from(`
        <svg width="${W}" height="80">
            <defs>
                <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#000000" stop-opacity="0.7"/>
                    <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
                </linearGradient>
            </defs>
            <rect width="${W}" height="80" fill="url(#g)"/>
        </svg>
    `);

    // ─── Gradient sombre en bas pour le sous-titre ───
    const bottomGradient = Buffer.from(`
        <svg width="${W}" height="60">
            <defs>
                <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#000000" stop-opacity="0"/>
                    <stop offset="100%" stop-color="#000000" stop-opacity="0.65"/>
                </linearGradient>
            </defs>
            <rect width="${W}" height="60" fill="url(#g)"/>
        </svg>
    `);

    // ─── Titre "PETANQUE MASTER" ───
    log('3. Titre PETANQUE MASTER (or + halo)...');
    const titleSVG = Buffer.from(`
        <svg width="${W}" height="56">
            <text x="${W / 2}" y="42"
                text-anchor="middle"
                font-family="'Impact', 'Arial Black', sans-serif"
                font-weight="900"
                font-size="46"
                letter-spacing="4"
                fill="#D4A574"
                stroke="#1A1510"
                stroke-width="4"
                paint-order="stroke"
            >PETANQUE MASTER</text>
        </svg>
    `);

    // ─── Sous-titre ───
    log('4. Sous-titre...');
    const subtitleSVG = Buffer.from(`
        <svg width="${W}" height="32">
            <text x="${W / 2}" y="22"
                text-anchor="middle"
                font-family="'Impact', 'Arial Black', sans-serif"
                font-weight="700"
                font-size="16"
                letter-spacing="3"
                fill="#F5E6D0"
                stroke="#1A1510"
                stroke-width="2"
                paint-order="stroke"
            >FREE BROWSER GAME</text>
        </svg>
    `);

    // ─── Composition ───
    log('5. Composition finale...');
    const titleBuf = await sharp(titleSVG).png().toBuffer();
    const subtitleBuf = await sharp(subtitleSVG).png().toBuffer();
    const topGradBuf = await sharp(topGradient).png().toBuffer();
    const bottomGradBuf = await sharp(bottomGradient).png().toBuffer();

    await sharp(cropped)
        .composite([
            { input: topGradBuf,    top: 0,       left: 0 },
            { input: bottomGradBuf, top: H - 60,  left: 0 },
            { input: titleBuf,      top: 8,        left: 0 },
            { input: subtitleBuf,   top: H - 36,   left: 0 },
        ])
        .png()
        .toFile(OUTPUT);

    log(`Cover art générée : ${OUTPUT}`);

    // ─── Thumbnail 315×250 ───
    const thumbPath = path.join(OUTPUT_DIR, 'cover-art-thumb-315x250.png');
    await sharp(OUTPUT)
        .resize(315, 250, { kernel: sharp.kernel.nearest })
        .toFile(thumbPath);
    log(`Thumbnail : ${thumbPath}`);
    log('Terminé !');
}

main().catch((err) => {
    console.error('[cover-art] Erreur:', err.message);
    process.exit(1);
});
