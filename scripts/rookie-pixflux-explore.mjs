#!/usr/bin/env node
/**
 * rookie-pixflux-explore.mjs
 * Explore davantage de seeds pour le Rookie via Pixflux
 * Le #5 (Pixflux variant) était le meilleur - on en génère 10 de plus
 * + test avec direction "north" pour avoir face caméra
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
  const outputDir = 'comparison/rookie_pixflux_explore';
  fs.mkdirSync(outputDir, { recursive: true });

  console.log('='.repeat(60));
  console.log('ROOKIE PIXFLUX EXPLORATION - 12 variantes');
  console.log('='.repeat(60));

  // Description qui a donné le meilleur résultat (#5)
  const bestDesc = 'pixel art game character, teenager boy 16 years old, ' +
    'blue collared shirt, khaki shorts, brown hair neat, determined expression, ' +
    'standing idle pose facing camera, relaxed natural posture, full body visible, ' +
    'black outline, warm color palette, retro pixel art style';

  // Version "fils de Ley" plus explicite
  const sonOfLeyDesc = 'pixel art game character sprite, young athletic teenager, ' +
    'light blue polo shirt tucked in, beige cargo shorts, white sneakers, ' +
    'short messy brown hair, warm tanned skin, confident smile, ' +
    'standing idle pose, arms at sides, full body head to feet, ' +
    'single pixel black outline, detailed shading, petanque player apprentice';

  // Version "Rookie héritier"
  const heirDesc = 'pixel art character sprite, 16 year old boy, slim build, ' +
    'blue-grey polo shirt, tan shorts, athletic shoes, ' +
    'light brown tousled hair, youthful face, bright eyes, ' +
    'calm standing pose facing forward, both feet on ground, full body, ' +
    'clean black outline, warm southern france color palette, pixel art game sprite';

  const seeds = [42, 100, 200, 333, 500, 777, 1042, 1500, 2000, 2500, 3000, 4000];

  const configs = [
    // Meilleure desc (#5) avec direction south (= face, low top-down)
    ...seeds.slice(0, 4).map(s => ({
      label: `best_south_s${s}`,
      title: `Best desc, south, seed ${s}`,
      body: {
        description: bestDesc,
        image_size: { width: 64, height: 64 },
        no_background: true,
        text_guidance_scale: 8,
        view: 'low top-down',
        direction: 'south',
        outline: 'single color black outline',
        shading: 'detailed shading',
        seed: s
      }
    })),
    // "Fils de Ley" description
    ...seeds.slice(0, 4).map(s => ({
      label: `sonofley_south_s${s}`,
      title: `Son of Ley desc, south, seed ${s}`,
      body: {
        description: sonOfLeyDesc,
        image_size: { width: 64, height: 64 },
        no_background: true,
        text_guidance_scale: 8,
        view: 'low top-down',
        direction: 'south',
        outline: 'single color black outline',
        shading: 'detailed shading',
        seed: s
      }
    })),
    // "Héritier" description
    ...seeds.slice(0, 4).map(s => ({
      label: `heir_south_s${s}`,
      title: `Heir desc, south, seed ${s}`,
      body: {
        description: heirDesc,
        image_size: { width: 64, height: 64 },
        no_background: true,
        text_guidance_scale: 8,
        view: 'low top-down',
        direction: 'south',
        outline: 'single color black outline',
        shading: 'detailed shading',
        seed: s
      }
    })),
  ];

  const results = [];

  for (const cfg of configs) {
    try {
      console.log(`[${cfg.label}] ${cfg.title}`);
      const b64 = await callApi('/v1/generate-image-pixflux', cfg.body);
      const buf = Buffer.from(b64, 'base64');

      for (const s of [64, 256]) {
        await sharp(buf).resize(s, s, { kernel: 'nearest' }).png()
          .toFile(path.join(outputDir, `${cfg.label}_${s}.png`));
      }
      results.push(cfg);
      console.log(`  -> OK`);
    } catch (err) {
      console.error(`  -> ERREUR: ${err.message.substring(0, 150)}`);
    }
  }

  // Planche grille 4 colonnes x 3 lignes
  if (results.length > 0) {
    const cell = 256;
    const gap = 6;
    const cols = 4;
    const rows = Math.ceil(results.length / cols);

    const composites = results.map((r, i) => ({
      input: path.join(outputDir, `${r.label}_256.png`),
      left: (i % cols) * (cell + gap),
      top: Math.floor(i / cols) * (cell + gap)
    }));

    const planchePath = path.join(outputDir, 'planche_exploration.png');
    await sharp({
      create: {
        width: cols * (cell + gap) - gap,
        height: rows * (cell + gap) - gap,
        channels: 4,
        background: { r: 40, g: 40, b: 40, alpha: 255 }
      }
    }).composite(composites).png().toFile(planchePath);

    console.log(`\nPlanche: ${planchePath}`);
  }

  console.log(`\nTERMINÉ - ${results.length}/${configs.length} variantes`);
}

main().catch(err => { console.error('Erreur:', err.message); process.exit(1); });
