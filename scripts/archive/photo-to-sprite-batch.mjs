#!/usr/bin/env node
/**
 * photo-to-sprite-batch.mjs
 * Génère 3 variations pixel art pour chaque photo de joueur
 * Meilleure recette trouvée: pas de style_image, init 400, photo top-aligned
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

async function generateSprite(photoB64, description, seed) {
  return callApi('/v1/generate-image-bitforge', {
    description,
    image_size: { width: 64, height: 64 },
    no_background: true,
    init_image: { base64: photoB64, strength: 400 },
    text_guidance_scale: 10,
    seed
  });
}

// === Les 6 joueurs avec descriptions précises ===
const players = [
  {
    photo: '1.png',
    name: 'joueur1_pullnoir',
    desc: 'pixel art character sprite, black outline, realistic proportions, warm palette, ' +
      'full body standing pose facing forward, feet on ground, ' +
      'tall man with dark brown wavy hair and mustache, wearing black sweater, dark blue jeans, holding petanque ball'
  },
  {
    photo: '2.png',
    name: 'joueur2_vesteverte',
    desc: 'pixel art character sprite, black outline, realistic proportions, warm palette, ' +
      'full body standing pose facing forward, feet on ground, ' +
      'slim man wearing yellow-green jacket over dark shirt, dark pants, short hair, petanque player'
  },
  {
    photo: '3.png',
    name: 'joueur3_poloraye',
    desc: 'pixel art character sprite, black outline, realistic proportions, warm palette, ' +
      'full body standing pose facing forward, feet on ground, ' +
      'stocky man with short dark hair, wearing white polo shirt with yellow and red horizontal stripes, beige pants, petanque player'
  },
  {
    photo: '4.png',
    name: 'joueur4_poloclaire',
    desc: 'pixel art character sprite, black outline, realistic proportions, warm palette, ' +
      'full body standing pose facing forward, feet on ground, ' +
      'slim man with short dark hair, wearing light pink polo shirt, beige khaki pants, standing straight, petanque player'
  },
  {
    photo: '5.png',
    name: 'joueur5_arcenciel',
    desc: 'pixel art character sprite, black outline, realistic proportions, warm palette, ' +
      'full body standing pose facing forward, feet on ground, ' +
      'heavyset stocky man with short dark hair, wearing white polo shirt with rainbow colored horizontal stripes red orange yellow green blue, beige pants, petanque player'
  },
  {
    photo: '6.png',
    name: 'joueur6_casquette',
    desc: 'pixel art character sprite, black outline, realistic proportions, warm palette, ' +
      'full body standing pose facing forward, feet on ground, ' +
      'person wearing black cap and dark navy sweatshirt, gray pants, walking confidently, petanque player'
  }
];

const SEEDS = [42, 2042, 4042];

async function processPlayer(player) {
  const photoPath = path.join('photo vrai joueur', player.photo);
  const outputDir = path.join('photo vrai joueur', `output_${player.name}`);
  fs.mkdirSync(outputDir, { recursive: true });

  console.log(`\n${'='.repeat(50)}`);
  console.log(`  ${player.name} (${player.photo})`);
  console.log(`${'='.repeat(50)}`);

  const photoB64 = await preparePhotoTop(photoPath, outputDir);

  const results = [];
  for (const seed of SEEDS) {
    try {
      console.log(`  [seed ${seed}] Generating...`);
      const b64 = await generateSprite(photoB64, player.desc, seed);
      const buf = Buffer.from(b64, 'base64');

      const p64 = path.join(outputDir, `${player.name}_seed${seed}_64.png`);
      const p256 = path.join(outputDir, `${player.name}_seed${seed}_256.png`);
      await sharp(buf).png().toFile(p64);
      await sharp(buf).resize(256, 256, { kernel: 'nearest' }).png().toFile(p256);

      results.push({ seed, p64, p256 });
      console.log(`    -> OK`);
    } catch (err) {
      console.error(`    -> ERREUR: ${err.message}`);
    }
  }

  // Mini-planche 3 en ligne
  if (results.length > 0) {
    const composites = results.map((r, i) => ({ input: r.p256, left: i * 260, top: 0 }));
    const planchePath = path.join(outputDir, `planche_${player.name}.png`);
    await sharp({
      create: { width: 260 * results.length - 4, height: 256, channels: 4, background: { r: 30, g: 30, b: 30, alpha: 255 } }
    }).composite(composites).png().toFile(planchePath);
    console.log(`  Planche: ${planchePath}`);
  }

  return results;
}

async function main() {
  console.log('BATCH PHOTO TO SPRITE - 6 joueurs x 3 seeds = 18 sprites');
  console.log('Recette: init 400, pas de style_image, photo top-aligned\n');

  for (const player of players) {
    await processPlayer(player);
  }

  console.log('\n' + '='.repeat(50));
  console.log('BATCH TERMINÉ - 6 joueurs traités');
  console.log('='.repeat(50));
}

main().catch(err => { console.error('Erreur:', err.message); process.exit(1); });
