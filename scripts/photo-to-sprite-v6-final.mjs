#!/usr/bin/env node
/**
 * photo-to-sprite-v6-final.mjs
 * Pipeline FINAL: Pose calme idle, pas de style_image, description précise
 *
 * Leçons v4-v5:
 *   - SANS style_image = meilleur (pas de leak Ley)
 *   - Photo top-aligned = corps entier
 *   - init 400 = sweet spot
 *   - Manque: pose CALME (idle, face caméra, bras le long du corps)
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
    console.log('Usage: node scripts/photo-to-sprite-v6-final.mjs <photo> <nom> "<description>"');
    process.exit(1);
  }

  const outputDir = path.join('photo vrai joueur', `output_${name}_v6`);
  fs.mkdirSync(outputDir, { recursive: true });

  console.log('='.repeat(60));
  console.log('PHOTO TO SPRITE v6 - POSE IDLE FINALE');
  console.log('='.repeat(60));

  // 1. Photo top-aligned (55% haut, jambes libres)
  console.log('\n--- Photo ---');
  const scaledHeight = Math.round(64 * 0.55);
  const scaledBuf = await sharp(photoPath)
    .resize(64, scaledHeight, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .modulate({ brightness: 1.1, saturation: 1.4 })
    .sharpen({ sigma: 2.0 })
    .png().toBuffer();

  const photo64Path = path.join(outputDir, 'photo_top_64.png');
  await sharp({
    create: { width: 64, height: 64, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
  }).composite([{ input: scaledBuf, left: 0, top: 0 }]).png().toFile(photo64Path);
  const photoB64 = toBase64(photo64Path);
  console.log('  Photo top-aligned 64x64 prête');

  // 2. Description: INSISTER sur pose calme idle
  const charDesc = customDesc || 'petanque player';

  // Deux variantes de description pour tester
  const descCalm = 'pixel art character sprite, black outline, realistic proportions, warm palette, ' +
    'idle standing pose facing forward, relaxed arms at sides, feet on ground, full body visible head to toe, ' +
    charDesc;

  const descNeutral = 'pixel art game character sprite, single black outline, realistic body, warm colors, ' +
    'neutral standing pose facing camera, both feet planted on ground, full body from head to feet, ' +
    charDesc;

  console.log(`\n  Desc A (calm): ${descCalm.substring(0, 80)}...`);
  console.log(`  Desc B (neutral): ${descNeutral.substring(0, 80)}...`);

  // 3. Génération: 2 descriptions x 4 seeds + 2 variations init strength
  console.log('\n--- Génération (10 variations) ---');

  const seeds = [42, 1042, 2042, 3042, 4042];
  const configs = [
    // Description "calm" + init 400
    ...seeds.map(s => ({ desc: descCalm, init: 400, seed: s, label: `calm_p400_s${s}` })),
    // Description "neutral" + init 400
    ...seeds.map(s => ({ desc: descNeutral, init: 400, seed: s, label: `neutral_p400_s${s}` })),
  ];

  const results = [];
  for (const cfg of configs) {
    try {
      console.log(`  [${cfg.label}] init=${cfg.init}, seed=${cfg.seed}`);
      const b64 = await callApi('/v1/generate-image-bitforge', {
        description: cfg.desc,
        image_size: { width: 64, height: 64 },
        no_background: true,
        init_image: { base64: photoB64, strength: cfg.init },
        text_guidance_scale: 10,
        seed: cfg.seed
      });

      const buf = Buffer.from(b64, 'base64');
      for (const s of [32, 64, 256]) {
        await sharp(buf).resize(s, s, { kernel: 'nearest' }).png()
          .toFile(path.join(outputDir, `${cfg.label}_${s}.png`));
      }
      results.push(cfg);
      console.log(`    -> OK`);
    } catch (err) {
      console.error(`    -> ERREUR: ${err.message}`);
    }
  }

  // 4. Planche 5x2
  if (results.length > 0) {
    const cols = 5, cell = 256, gap = 4;
    const rows = Math.ceil(results.length / cols);
    const composites = results.map((r, i) => ({
      input: path.join(outputDir, `${r.label}_256.png`),
      left: (i % cols) * (cell + gap),
      top: Math.floor(i / cols) * (cell + gap)
    }));

    const planchePath = path.join(outputDir, `planche_${name}.png`);
    await sharp({
      create: { width: cols * (cell + gap) - gap, height: rows * (cell + gap) - gap, channels: 4, background: { r: 30, g: 30, b: 30, alpha: 255 } }
    }).composite(composites).png().toFile(planchePath);
    console.log(`\n  Planche: ${planchePath}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('TERMINÉ - v6 FINAL');
  console.log('='.repeat(60));
  console.log('  Ligne 1: description "calm idle" (5 seeds)');
  console.log('  Ligne 2: description "neutral standing" (5 seeds)');
  console.log('  Total:', results.length, 'sprites');
}

main().catch(err => { console.error('Erreur:', err.message); process.exit(1); });
