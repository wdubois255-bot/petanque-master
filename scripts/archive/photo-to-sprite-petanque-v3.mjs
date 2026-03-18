#!/usr/bin/env node
/**
 * photo-to-sprite-petanque-v3.mjs
 * DEUX APPROCHES:
 *   A = Pixflux (texte pur, pas de photo, pose RPG calme)
 *   B = Bitforge init 750 (photo ultra-dominante, juste pixelisée)
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

function toBase64(fp) { return fs.readFileSync(fp).toString('base64'); }

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

async function preparePhoto(photoPath, outputDir, label) {
  const scaledH = Math.round(64 * 0.6);
  const scaledBuf = await sharp(photoPath)
    .resize(64, scaledH, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .modulate({ brightness: 1.05, saturation: 1.2 })
    .sharpen({ sigma: 1.5 })
    .png().toBuffer();

  const outPath = path.join(outputDir, `${label}_photo.png`);
  await sharp({
    create: { width: 64, height: 64, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
  }).composite([{ input: scaledBuf, left: 0, top: 0 }]).png().toFile(outPath);
  return toBase64(outPath);
}

const players = [
  {
    photo: '1.png', name: 'joueur1',
    pixflux: 'tall man with dark brown wavy hair and thick mustache, wearing all black sweater and dark blue jeans, brown shoes, holding a silver petanque boule in one hand',
    bitforge: 'pixel art, man with wavy brown hair and mustache, black sweater, blue jeans'
  },
  {
    photo: '2.png', name: 'joueur2',
    pixflux: 'slim athletic young man with short dark hair, wearing olive green sport jacket over dark shirt, dark pants and white sneakers, petanque player',
    bitforge: 'pixel art, slim man, green jacket, dark pants'
  },
  {
    photo: '3.png', name: 'joueur3',
    pixflux: 'stocky broad shouldered man with short dark hair, wearing white polo shirt with yellow and red horizontal stripes across the chest, beige khaki pants, brown shoes',
    bitforge: 'pixel art, stocky man, white polo with red yellow stripes, beige pants'
  },
  {
    photo: '4.png', name: 'joueur4',
    pixflux: 'slim man with short dark hair, wearing light pink polo shirt tucked into beige khaki pants, brown leather shoes, calm composed posture',
    bitforge: 'pixel art, slim man, pink polo shirt, beige pants'
  },
  {
    photo: '5.png', name: 'joueur5',
    pixflux: 'heavyset large man with big round belly and short dark hair, wearing oversized white polo shirt with bold rainbow horizontal stripes in red orange yellow green blue, loose beige pants',
    bitforge: 'pixel art, big belly man, white polo rainbow stripes, beige pants'
  },
  {
    photo: '6.png', name: 'joueur6',
    pixflux: 'person wearing black baseball cap and dark navy blue hoodie sweatshirt, gray pants, dark shoes, cool confident stance',
    bitforge: 'pixel art, person in black cap, navy hoodie, gray pants'
  }
];

async function main() {
  const outputDir = path.join('photo vrai joueur', 'output_petanque_v3');
  fs.mkdirSync(outputDir, { recursive: true });

  console.log('PÉTANQUE v3 - Pixflux (RPG calme) vs Bitforge (photo ultra-forte)');
  console.log('6 joueurs x 2 méthodes = 12 sprites\n');

  const allResults = [];

  for (const p of players) {
    // === A: PIXFLUX (texte pur, pose RPG calme) ===
    const labelA = `${p.name}_pixflux`;
    try {
      console.log(`  [${labelA}] Pixflux (texte pur, pose sud)...`);
      const b64 = await callApi('/v1/generate-image-pixflux', {
        description: p.pixflux,
        image_size: { width: 64, height: 64 },
        no_background: true,
        view: 'low top-down',
        direction: 'south',
        outline: 'single color black outline',
        shading: 'high shading',
        detail: 'high detail',
        text_guidance_scale: 8,
        seed: 42
      });
      const buf = Buffer.from(b64, 'base64');
      await sharp(buf).png().toFile(path.join(outputDir, `${labelA}_64.png`));
      await sharp(buf).resize(256, 256, { kernel: 'nearest' }).png().toFile(path.join(outputDir, `${labelA}_256.png`));
      allResults.push({ label: labelA, p256: path.join(outputDir, `${labelA}_256.png`) });
      console.log(`    -> OK`);
    } catch (err) {
      console.error(`    -> ERREUR: ${err.message}`);
    }

    // === B: BITFORGE init 750 (photo ultra-dominante) ===
    const labelB = `${p.name}_bitforge750`;
    try {
      const photoPath = path.join('photo vrai joueur', p.photo);
      const photoB64 = await preparePhoto(photoPath, outputDir, p.name);

      console.log(`  [${labelB}] Bitforge init=750, tgs=4...`);
      const b64 = await callApi('/v1/generate-image-bitforge', {
        description: p.bitforge,
        image_size: { width: 64, height: 64 },
        no_background: true,
        init_image: { base64: photoB64, strength: 750 },
        text_guidance_scale: 4,
        seed: 42
      });
      const buf = Buffer.from(b64, 'base64');
      await sharp(buf).png().toFile(path.join(outputDir, `${labelB}_64.png`));
      await sharp(buf).resize(256, 256, { kernel: 'nearest' }).png().toFile(path.join(outputDir, `${labelB}_256.png`));
      allResults.push({ label: labelB, p256: path.join(outputDir, `${labelB}_256.png`) });
      console.log(`    -> OK`);
    } catch (err) {
      console.error(`    -> ERREUR: ${err.message}`);
    }
  }

  // Planche 2 colonnes x 6 lignes
  if (allResults.length > 0) {
    const cols = 2, cell = 256, gap = 4;
    const rows = Math.ceil(allResults.length / cols);
    const composites = allResults.map((r, i) => ({
      input: r.p256,
      left: (i % cols) * (cell + gap),
      top: Math.floor(i / cols) * (cell + gap)
    }));

    const planchePath = path.join(outputDir, 'planche_tous.png');
    await sharp({
      create: { width: cols * (cell + gap) - gap, height: rows * (cell + gap) - gap, channels: 4, background: { r: 30, g: 30, b: 30, alpha: 255 } }
    }).composite(composites).png().toFile(planchePath);
    console.log(`\nPlanche: ${planchePath}`);
  }

  console.log('\nTERMINÉ');
  console.log('  Colonne A (gauche): Pixflux = RPG calme, pas de photo');
  console.log('  Colonne B (droite): Bitforge init 750 = photo pixelisée');
}

main().catch(err => { console.error('Erreur:', err.message); process.exit(1); });
