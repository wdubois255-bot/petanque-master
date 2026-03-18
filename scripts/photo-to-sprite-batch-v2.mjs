#!/usr/bin/env node
/**
 * photo-to-sprite-batch-v2.mjs
 * Passe corrective: descriptions ajustées, nouvelles seeds, init strength varié
 *
 * Corrections:
 *   - Joueur 2: photo trop floue → monter init à 350 (moins de photo, plus de texte)
 *   - Joueur 4: poses trop dynamiques → insister "standing still, arms relaxed"
 *   - Joueur 5: arc-en-ciel perdu → description plus explicite des bandes
 *   - Aussi re-tenter 1 et 3 avec des seeds plus variées
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

async function preparePhotoTop(photoPath, outputDir) {
  const scaledHeight = Math.round(64 * 0.55);
  const scaledBuf = await sharp(photoPath)
    .resize(64, scaledHeight, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .modulate({ brightness: 1.1, saturation: 1.4 })
    .sharpen({ sigma: 2.0 })
    .png().toBuffer();

  const outPath = path.join(outputDir, 'photo_top_64.png');
  await sharp({
    create: { width: 64, height: 64, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
  }).composite([{ input: scaledBuf, left: 0, top: 0 }]).png().toFile(outPath);
  return toBase64(outPath);
}

// Joueurs à corriger avec descriptions affinées
const players = [
  {
    photo: '1.png',
    name: 'joueur1_v2',
    initStrength: 400,
    seeds: [100, 500, 1000, 1500, 2500],
    desc: 'pixel art character sprite, black outline, realistic proportions, warm earthy palette, ' +
      'standing still facing forward, relaxed pose, arms at sides, full body head to feet, ' +
      'tall man with dark brown wavy hair and thick mustache, all black sweater, dark blue denim jeans, brown shoes, holding silver petanque ball'
  },
  {
    photo: '2.png',
    name: 'joueur2_v2',
    initStrength: 300, // Moins de photo (trop floue)
    seeds: [100, 500, 1000, 1500, 2500],
    desc: 'pixel art character sprite, black outline, realistic proportions, warm palette, ' +
      'standing still facing forward, relaxed pose, full body head to feet, ' +
      'slim athletic man, short dark hair, wearing olive green sport jacket with yellow accents, dark pants, white sneakers, petanque player'
  },
  {
    photo: '3.png',
    name: 'joueur3_v2',
    initStrength: 400,
    seeds: [100, 500, 1000, 1500, 2500],
    desc: 'pixel art character sprite, black outline, realistic proportions, warm palette, ' +
      'standing still facing forward, relaxed pose, arms at sides, full body head to feet, ' +
      'stocky muscular man, short dark hair, wearing white polo shirt with horizontal colored stripes yellow and red across chest, beige khaki pants, brown shoes'
  },
  {
    photo: '4.png',
    name: 'joueur4_v2',
    initStrength: 350,
    seeds: [100, 500, 1000, 1500, 2500],
    desc: 'pixel art character sprite, black outline, realistic proportions, warm palette, ' +
      'standing completely still facing forward, both arms hanging at sides, stiff upright posture, full body head to feet, ' +
      'slim man, short dark hair, wearing light pink collared polo shirt, beige khaki pants, brown leather shoes, calm expression'
  },
  {
    photo: '5.png',
    name: 'joueur5_v2',
    initStrength: 350,
    seeds: [100, 500, 1000, 1500, 2500],
    desc: 'pixel art character sprite, black outline, realistic proportions, warm bright palette, ' +
      'standing still facing forward, relaxed pose, full body head to feet, ' +
      'heavyset big belly man, short dark hair, wearing oversized white polo shirt with bold rainbow horizontal stripes across the torso in red orange yellow green blue, loose beige pants, white sneakers'
  },
  {
    photo: '6.png',
    name: 'joueur6_v2',
    initStrength: 400,
    seeds: [100, 500, 1000, 1500, 2500],
    desc: 'pixel art character sprite, black outline, realistic proportions, warm palette, ' +
      'standing still facing forward, relaxed pose, full body head to feet, ' +
      'person wearing dark black baseball cap, navy blue hoodie sweatshirt, gray pants, dark shoes, hands in pockets, cool confident look'
  }
];

async function processPlayer(player) {
  const photoPath = path.join('photo vrai joueur', player.photo);
  const outputDir = path.join('photo vrai joueur', `output_${player.name}`);
  fs.mkdirSync(outputDir, { recursive: true });

  console.log(`\n${'='.repeat(50)}`);
  console.log(`  ${player.name} (${player.photo}) | init=${player.initStrength}`);
  console.log(`${'='.repeat(50)}`);

  const photoB64 = await preparePhotoTop(photoPath, outputDir);

  const results = [];
  for (const seed of player.seeds) {
    try {
      console.log(`  [seed ${seed}] ...`);
      const b64 = await callApi('/v1/generate-image-bitforge', {
        description: player.desc,
        image_size: { width: 64, height: 64 },
        no_background: true,
        init_image: { base64: photoB64, strength: player.initStrength },
        text_guidance_scale: 10,
        seed
      });

      const buf = Buffer.from(b64, 'base64');
      const p64 = path.join(outputDir, `seed${seed}_64.png`);
      const p256 = path.join(outputDir, `seed${seed}_256.png`);
      await sharp(buf).png().toFile(p64);
      await sharp(buf).resize(256, 256, { kernel: 'nearest' }).png().toFile(p256);
      results.push({ seed, p256 });
      console.log(`    -> OK`);
    } catch (err) {
      console.error(`    -> ERREUR: ${err.message}`);
    }
  }

  // Planche
  if (results.length > 0) {
    const composites = results.map((r, i) => ({ input: r.p256, left: i * 260, top: 0 }));
    const planchePath = path.join(outputDir, `planche_${player.name}.png`);
    await sharp({
      create: { width: 260 * results.length - 4, height: 256, channels: 4, background: { r: 30, g: 30, b: 30, alpha: 255 } }
    }).composite(composites).png().toFile(planchePath);
    console.log(`  Planche: ${planchePath}`);
  }
}

async function main() {
  console.log('BATCH v2 CORRECTIVE - 6 joueurs x 5 seeds = 30 sprites');
  console.log('Fix: descriptions affinées, seeds variées, init ajusté\n');

  for (const player of players) {
    await processPlayer(player);
  }

  console.log('\n' + '='.repeat(50));
  console.log('BATCH v2 TERMINÉ');
  console.log('='.repeat(50));
}

main().catch(err => { console.error('Erreur:', err.message); process.exit(1); });
