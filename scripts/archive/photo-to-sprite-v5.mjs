#!/usr/bin/env node
/**
 * photo-to-sprite-v5.mjs
 * Pipeline v5: Fix les problèmes de v4
 *
 * Fixes:
 *   - Photo ÉTENDUE vers le bas (ajout padding pour simuler corps entier)
 *   - Style Ley baissé à 500 (éviter leak cheveux/mini-perso)
 *   - Photo montée à 400 (garder ressemblance)
 *   - Description TRÈS précise (couleur cheveux, PAS de blond)
 *   - Seeds autour de 2042 (meilleur résultat v4)
 *   - Aussi test sans style_image du tout (description seule + photo)
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const API_URL = 'https://api.pixellab.ai';

try {
  const envContent = fs.readFileSync(path.resolve(process.cwd(), '.env'), 'utf-8');
  const match = envContent.match(/PIXELLAB_API_KEY=(.+)/);
  if (match) process.env.PIXELLAB_API_KEY = match[1].trim();
} catch (e) { /* ignore */ }

const getApiKey = () => {
  const key = process.env.PIXELLAB_API_KEY;
  if (!key) throw new Error('PIXELLAB_API_KEY non défini');
  return key;
};

function toBase64(filePath) {
  return fs.readFileSync(filePath).toString('base64');
}

async function callApi(endpoint, body) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getApiKey()}` },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`${endpoint} ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const img = data.image;
  return typeof img === 'string' ? img : (img?.base64 || img?.data);
}

async function main() {
  const [photoPath, name, customDesc] = process.argv.slice(2);
  if (!photoPath || !name) {
    console.log('Usage: node scripts/photo-to-sprite-v5.mjs <photo> <nom> "<description>"');
    process.exit(1);
  }

  const outputDir = path.join('photo vrai joueur', `output_${name}_v5`);
  fs.mkdirSync(outputDir, { recursive: true });

  console.log('='.repeat(60));
  console.log('PHOTO TO SPRITE v5 - CORPS ENTIER + ANTI-LEAK');
  console.log('='.repeat(60));

  // 1. Préparer la photo - DEUX versions
  console.log('\n--- Photo ---');
  const metadata = await sharp(photoPath).metadata();
  console.log(`  Original: ${metadata.width}x${metadata.height}`);

  // Version A: contain classique (comme v4)
  const photoContainPath = path.join(outputDir, 'photo_contain_64.png');
  await sharp(photoPath)
    .resize(64, 64, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .modulate({ brightness: 1.1, saturation: 1.4 })
    .sharpen({ sigma: 2.0 })
    .png().toFile(photoContainPath);

  // Version B: photo placée en HAUT du cadre (1/3 supérieur)
  // Laisse 2/3 du bas vide = le modèle DOIT inventer les jambes
  const photoTopPath = path.join(outputDir, 'photo_top_64.png');
  const scaledHeight = Math.round(64 * 0.55); // Photo occupe 55% du haut
  const scaledBuf = await sharp(photoPath)
    .resize(64, scaledHeight, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .modulate({ brightness: 1.1, saturation: 1.4 })
    .sharpen({ sigma: 2.0 })
    .png().toBuffer();

  await sharp({
    create: { width: 64, height: 64, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
  })
  .composite([{ input: scaledBuf, left: 0, top: 0 }])
  .png().toFile(photoTopPath);

  const photoContainB64 = toBase64(photoContainPath);
  const photoTopB64 = toBase64(photoTopPath);
  console.log('  Photo contain 64x64 prête');
  console.log('  Photo top-aligned 64x64 prête (55% haut, jambes libres)');

  // 2. Style Ley
  console.log('\n--- Style Ley ---');
  const leyPath = 'photo vrai joueur/ley.png';
  const ley64Path = path.join(outputDir, 'style_ley_64.png');
  await sharp(leyPath).resize(64, 64, { kernel: 'nearest' }).png().toFile(ley64Path);
  const leyB64 = toBase64(ley64Path);
  console.log('  Ley 64x64 prêt');

  // 3. Description ultra-précise - on COMBAT le leak
  const charDesc = customDesc || 'petanque player';
  const fullDesc = 'detailed pixel art character sprite, single black outline, realistic proportions, warm earthy palette, full body standing pose showing legs and feet on ground, ' + charDesc;
  console.log(`\n  Description: ${fullDesc}`);

  // 4. MATRICE v5
  console.log('\n--- Génération v5 (12 variations) ---');

  const configs = [
    // === GROUPE A: Photo TOP (corps entier forcé) + style Ley 500 ===
    { photo: 'top', init: 350, style: 500, tgs: 10, seed: 2042, label: 'A1_top_s500_p350' },
    { photo: 'top', init: 400, style: 500, tgs: 10, seed: 2042, label: 'A2_top_s500_p400' },
    { photo: 'top', init: 350, style: 500, tgs: 10, seed: 2142, label: 'A3_top_s500_seed2142' },
    { photo: 'top', init: 350, style: 500, tgs: 10, seed: 2242, label: 'A4_top_s500_seed2242' },

    // === GROUPE B: Photo TOP + style Ley 400 (encore moins de leak) ===
    { photo: 'top', init: 400, style: 400, tgs: 10, seed: 2042, label: 'B1_top_s400_p400' },
    { photo: 'top', init: 450, style: 400, tgs: 10, seed: 2042, label: 'B2_top_s400_p450' },
    { photo: 'top', init: 400, style: 400, tgs: 10, seed: 2142, label: 'B3_top_s400_seed2142' },
    { photo: 'top', init: 400, style: 400, tgs: 10, seed: 2242, label: 'B4_top_s400_seed2242' },

    // === GROUPE C: SANS style_image (pixel art par description seule) ===
    { photo: 'top', init: 400, style: null, tgs: 10, seed: 2042, label: 'C1_top_nostyle_p400' },
    { photo: 'top', init: 500, style: null, tgs: 10, seed: 2042, label: 'C2_top_nostyle_p500' },
    { photo: 'top', init: 400, style: null, tgs: 10, seed: 2142, label: 'C3_top_nostyle_seed2142' },
    { photo: 'top', init: 400, style: null, tgs: 10, seed: 2242, label: 'C4_top_nostyle_seed2242' },
  ];

  const results = [];
  for (const cfg of configs) {
    try {
      const photoB64 = cfg.photo === 'top' ? photoTopB64 : photoContainB64;
      console.log(`  [${cfg.label}] init=${cfg.init}, style=${cfg.style || 'NONE'}, tgs=${cfg.tgs}, seed=${cfg.seed}`);

      const body = {
        description: fullDesc,
        image_size: { width: 64, height: 64 },
        no_background: true,
        init_image: { base64: photoB64, strength: cfg.init },
        text_guidance_scale: cfg.tgs,
        seed: cfg.seed
      };

      if (cfg.style !== null) {
        body.style_image = { base64: leyB64, strength: cfg.style };
      }

      const b64 = await callApi('/v1/generate-image-bitforge', body);

      const buf = Buffer.from(b64, 'base64');
      for (const s of [32, 64, 128, 256]) {
        await sharp(buf).resize(s, s, { kernel: 'nearest' }).png()
          .toFile(path.join(outputDir, `${cfg.label}_${s}x${s}.png`));
      }
      results.push(cfg);
      console.log(`    -> OK`);
    } catch (err) {
      console.error(`    -> ERREUR: ${err.message}`);
    }
  }

  // 5. Planche
  if (results.length > 0) {
    console.log('\n--- Planche ---');
    const cols = 4;
    const rows = Math.ceil(results.length / cols);
    const cell = 256, gap = 4;

    const composites = results.map((r, i) => ({
      input: path.join(outputDir, `${r.label}_256x256.png`),
      left: (i % cols) * (cell + gap),
      top: Math.floor(i / cols) * (cell + gap)
    }));

    const planchePath = path.join(outputDir, `planche_${name}.png`);
    await sharp({
      create: { width: cols * (cell + gap) - gap, height: rows * (cell + gap) - gap, channels: 4, background: { r: 30, g: 30, b: 30, alpha: 255 } }
    }).composite(composites).png().toFile(planchePath);
    console.log(`  -> ${planchePath}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('TERMINÉ - v5');
  console.log('='.repeat(60));
  console.log('\nGroupes:');
  console.log('  A = Photo top + Ley 500 (pixel art, moins de leak)');
  console.log('  B = Photo top + Ley 400 (encore moins de leak)');
  console.log('  C = Photo top + SANS style (pixel art par description seule)');
  console.log('\nTotal:', results.length, 'sprites');
}

main().catch(err => { console.error('Erreur:', err.message); process.exit(1); });
