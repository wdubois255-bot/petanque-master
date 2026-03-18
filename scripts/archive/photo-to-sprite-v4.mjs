#!/usr/bin/env node
/**
 * photo-to-sprite-v4.mjs
 * Pipeline AFFINÉ v4: Le compromis parfait "pixel art réaliste"
 *
 * Leçons des v1-v3:
 *   - Style Ley 600+ = bon pixel art MAIS photo 250 perd la ressemblance
 *   - Photo 500+ sans style = trop réaliste, plus du pixel art
 *   - Sweet spot = style 650 + photo 300-400 + description ULTRA détaillée
 *   - text_guidance_scale 12 pour forcer les détails de la description
 *
 * Usage: node scripts/photo-to-sprite-v4.mjs <photo> <nom> "<description détaillée>"
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
    console.log('Usage: node scripts/photo-to-sprite-v4.mjs <photo> <nom> "<description détaillée>"');
    console.log('');
    console.log('Exemple:');
    console.log('  node scripts/photo-to-sprite-v4.mjs "photo.png" "joueur_nice" "heavyset man in red NICE jersey, short brown hair, holding petanque ball, standing pose"');
    process.exit(1);
  }

  const outputDir = path.join('photo vrai joueur', `output_${name}_v4`);
  fs.mkdirSync(outputDir, { recursive: true });

  console.log('='.repeat(60));
  console.log('PHOTO TO SPRITE v4 - PIXEL ART RÉALISTE');
  console.log('='.repeat(60));

  // 1. Préparer la photo (contain = corps entier, padding transparent)
  console.log('\n--- Photo ---');
  const photo64Path = path.join(outputDir, 'photo_64.png');
  await sharp(photoPath)
    .resize(64, 64, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .modulate({ brightness: 1.1, saturation: 1.4 })  // Plus saturé pour pixel art
    .sharpen({ sigma: 2.0 })  // Plus net
    .png().toFile(photo64Path);
  const photoB64 = toBase64(photo64Path);
  console.log('  Photo 64x64 prête (saturée + nette)');

  // 2. Charger Ley comme style reference
  console.log('\n--- Style Ley ---');
  const leyPath = 'photo vrai joueur/ley.png';
  const ley64Path = path.join(outputDir, 'style_ley_64.png');
  await sharp(leyPath).resize(64, 64, { kernel: 'nearest' }).png().toFile(ley64Path);
  const leyB64 = toBase64(ley64Path);
  console.log('  Ley 64x64 prêt');

  // 3. Description: le TEXT est crucial pour les détails que la photo perd
  // On met "pixel art" + les traits physiques distinctifs
  const baseDesc = 'detailed pixel art character sprite, single black outline, realistic body proportions, warm palette, full body standing pose with visible legs and feet, ';
  const charDesc = customDesc || 'petanque player';
  const fullDesc = baseDesc + charDesc;
  console.log(`\n  Description: ${fullDesc}`);

  // 4. MATRICE: On teste le sweet spot qu'on a pas encore exploré
  // Style 650 fixe + photo 300/350/400 + 3 seeds = 9 variations
  console.log('\n--- Génération (12 variations) ---');

  const configs = [
    // === GROUPE A: Style 650 (fort) + photo croissante ===
    { init: 300, style: 650, tgs: 10, seed: 42,   label: 'A1_s650_p300' },
    { init: 350, style: 650, tgs: 10, seed: 42,   label: 'A2_s650_p350' },
    { init: 400, style: 650, tgs: 10, seed: 42,   label: 'A3_s650_p400' },

    // === GROUPE B: Style 550 (moyen) + photo croissante ===
    { init: 300, style: 550, tgs: 10, seed: 42,   label: 'B1_s550_p300' },
    { init: 350, style: 550, tgs: 10, seed: 42,   label: 'B2_s550_p350' },
    { init: 400, style: 550, tgs: 10, seed: 42,   label: 'B3_s550_p400' },

    // === GROUPE C: text_guidance_scale 12 (description plus forte) ===
    { init: 350, style: 650, tgs: 12, seed: 42,   label: 'C1_tgs12_s650_p350' },
    { init: 350, style: 550, tgs: 12, seed: 42,   label: 'C2_tgs12_s550_p350' },

    // === GROUPE D: Seeds différentes (variation) ===
    { init: 350, style: 650, tgs: 10, seed: 1042, label: 'D1_seed1042' },
    { init: 350, style: 650, tgs: 10, seed: 2042, label: 'D2_seed2042' },
    { init: 350, style: 650, tgs: 10, seed: 3042, label: 'D3_seed3042' },
    { init: 350, style: 650, tgs: 10, seed: 4042, label: 'D4_seed4042' },
  ];

  const results = [];
  for (const cfg of configs) {
    try {
      console.log(`  [${cfg.label}] init=${cfg.init}, style=${cfg.style}, tgs=${cfg.tgs}, seed=${cfg.seed}`);
      const b64 = await callApi('/v1/generate-image-bitforge', {
        description: fullDesc,
        image_size: { width: 64, height: 64 },
        no_background: true,
        init_image: { base64: photoB64, strength: cfg.init },
        style_image: { base64: leyB64, strength: cfg.style },
        text_guidance_scale: cfg.tgs,
        seed: cfg.seed
      });

      // Sauver en 32, 64, 128, 256
      const sizes = [32, 64, 128, 256];
      const buf = Buffer.from(b64, 'base64');
      for (const s of sizes) {
        const p = path.join(outputDir, `${cfg.label}_${s}x${s}.png`);
        await sharp(buf).resize(s, s, { kernel: 'nearest' }).png().toFile(p);
      }
      results.push(cfg);
      console.log(`    -> OK`);
    } catch (err) {
      console.error(`    -> ERREUR: ${err.message}`);
    }
  }

  // 5. Planches par groupe
  if (results.length > 0) {
    console.log('\n--- Planches ---');

    // Planche globale
    const allPaths = results.map(r => path.join(outputDir, `${r.label}_256x256.png`));
    const cols = 4;
    const rows = Math.ceil(allPaths.length / cols);
    const cell = 256;
    const gap = 4;

    const composites = allPaths.map((p, i) => ({
      input: p,
      left: (i % cols) * (cell + gap),
      top: Math.floor(i / cols) * (cell + gap)
    }));

    const planchePath = path.join(outputDir, `planche_${name}.png`);
    await sharp({
      create: {
        width: cols * (cell + gap) - gap,
        height: rows * (cell + gap) - gap,
        channels: 4,
        background: { r: 30, g: 30, b: 30, alpha: 255 }
      }
    }).composite(composites).png().toFile(planchePath);

    console.log(`  -> ${planchePath}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('TERMINÉ - v4 PIXEL ART RÉALISTE');
  console.log('='.repeat(60));
  console.log('\nGroupes:');
  console.log('  A = Style Ley 650 + photo 300/350/400 (le sweet spot)');
  console.log('  B = Style Ley 550 + photo 300/350/400 (plus libre)');
  console.log('  C = text_guidance_scale 12 (description + forte)');
  console.log('  D = Seeds variées (A2 avec différents randoms)');
  console.log('\nTotal:', results.length, 'sprites générés');
}

main().catch(err => { console.error('Erreur:', err.message); process.exit(1); });
