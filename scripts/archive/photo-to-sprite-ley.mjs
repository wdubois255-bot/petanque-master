#!/usr/bin/env node
/**
 * photo-to-sprite-ley.mjs
 * Pipeline STYLE LEY: Photo → Pixel art réaliste (le compromis parfait)
 *
 * Stratégie: Ley comme style_image TRÈS FORT + photo comme init_image MODÉRÉ
 * = pixel art propre avec ressemblance à la photo
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
    console.log('Usage: node scripts/photo-to-sprite-ley.mjs <photo> <nom> <description>');
    process.exit(1);
  }

  const outputDir = path.join('photo vrai joueur', `output_${name}_ley`);
  fs.mkdirSync(outputDir, { recursive: true });

  console.log('='.repeat(60));
  console.log('PHOTO TO SPRITE - STYLE LEY (pixel art réaliste)');
  console.log('='.repeat(60));

  // 1. Préparer la photo (contain = corps entier)
  console.log('\n--- Photo ---');
  const photoContain = path.join(outputDir, 'photo_64.png');
  await sharp(photoPath)
    .resize(64, 64, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .modulate({ brightness: 1.05, saturation: 1.3 })
    .sharpen({ sigma: 1.5 })
    .png().toFile(photoContain);
  const photoB64 = toBase64(photoContain);
  console.log(`  Photo 64x64 prête`);

  // 2. Charger Ley comme style reference
  console.log('\n--- Style Ley ---');
  const leyPath = 'photo vrai joueur/ley.png';
  const leyStylePath = path.join(outputDir, 'style_ley_64.png');
  await sharp(leyPath).resize(64, 64, { kernel: 'nearest' }).png().toFile(leyStylePath);
  const leyB64 = toBase64(leyStylePath);
  console.log(`  Ley 64x64 prêt`);

  // 3. Description style Ley: pixel art + proportions réalistes
  const desc = 'detailed pixel art character sprite, single color black outline, realistic body proportions, full body standing pose with legs and feet visible, warm shading, ' +
    (customDesc || 'petanque player');

  console.log(`  Description: ${desc}`);

  // 4. Matrice de tests: init_strength x style_strength
  console.log('\n--- Génération (9 variations) ---');

  const configs = [
    // Style Ley FORT (600) + photo faible à moyenne
    { init: 250, style: 600, seed: 42,   label: '01_ley600_photo250' },
    { init: 350, style: 600, seed: 1042, label: '02_ley600_photo350' },
    { init: 450, style: 600, seed: 2042, label: '03_ley600_photo450' },

    // Style Ley MOYEN (450) + photo faible à moyenne
    { init: 250, style: 450, seed: 42,   label: '04_ley450_photo250' },
    { init: 350, style: 450, seed: 1042, label: '05_ley450_photo350' },
    { init: 450, style: 450, seed: 2042, label: '06_ley450_photo450' },

    // Style Ley TRÈS FORT (750) + photo faible à moyenne
    { init: 250, style: 750, seed: 42,   label: '07_ley750_photo250' },
    { init: 350, style: 750, seed: 1042, label: '08_ley750_photo350' },
    { init: 450, style: 750, seed: 2042, label: '09_ley750_photo450' },
  ];

  const results = [];
  for (const cfg of configs) {
    try {
      console.log(`  [${cfg.label}] init=${cfg.init}, style=${cfg.style}`);
      const b64 = await callApi('/v1/generate-image-bitforge', {
        description: desc,
        image_size: { width: 64, height: 64 },
        no_background: true,
        init_image: { base64: photoB64, strength: cfg.init },
        style_image: { base64: leyB64, strength: cfg.style },
        text_guidance_scale: 10,
        seed: cfg.seed
      });

      const p64 = path.join(outputDir, `${cfg.label}_64.png`);
      const p256 = path.join(outputDir, `${cfg.label}_256.png`);
      await sharp(Buffer.from(b64, 'base64')).png().toFile(p64);
      await sharp(Buffer.from(b64, 'base64')).resize(256, 256, { kernel: 'nearest' }).png().toFile(p256);
      results.push({ ...cfg, p64, p256 });
      console.log(`    -> OK`);
    } catch (err) {
      console.error(`    -> ERREUR: ${err.message}`);
    }
  }

  // 5. Planche 3x3
  if (results.length > 0) {
    console.log('\n--- Planche ---');
    const cols = 3;
    const rows = Math.ceil(results.length / cols);
    const cellSize = 200;
    const gap = 8;

    const composites = results.map((r, i) => ({
      input: r.p256,
      left: (i % cols) * (cellSize + gap),
      top: Math.floor(i / cols) * (cellSize + gap)
    }));

    const planPath = path.join(outputDir, `planche_${name}.png`);
    await sharp({
      create: {
        width: cols * (cellSize + gap) - gap,
        height: rows * (cellSize + gap) - gap,
        channels: 4,
        background: { r: 40, g: 40, b: 40, alpha: 255 }
      }
    })
    .composite(composites.map(c => ({
      ...c,
      // Resize to cellSize
    })))
    .png().toFile(planPath);

    // Planche simple en ligne
    const planLinePath = path.join(outputDir, `planche_ligne_${name}.png`);
    const lineComposites = results.map((r, i) => ({
      input: r.p256,
      left: i * 264,
      top: 0
    }));
    await sharp({
      create: {
        width: 264 * results.length - 8,
        height: 256,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    }).composite(lineComposites).png().toFile(planLinePath);

    console.log(`  -> ${planLinePath}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('TERMINÉ');
  console.log('='.repeat(60));
  console.log('\nRésultats:');
  console.log('  Ligne 1 (style Ley 600): le plus Ley + photo guide');
  console.log('  Ligne 2 (style Ley 450): plus libre, photo guide');
  console.log('  Ligne 3 (style Ley 750): le PLUS Ley, pixel art max');
  console.log('  Colonnes: photo faible → moyenne → forte');
  results.forEach((r, i) => console.log(`  ${i + 1}. ${r.label}`));
}

main().catch(err => { console.error('Erreur:', err.message); process.exit(1); });
