#!/usr/bin/env node
/**
 * Pixflux ONLY - poses RPG calmes, descriptions détaillées
 * Pas de photo (Pixflux ne supporte pas init_image), juste du texte
 * Shading: 'detailed shading', Detail: 'highly detailed'
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

const players = [
  {
    name: 'joueur1',
    desc: 'tall man with dark brown wavy hair and thick mustache, wearing all black long sleeve sweater, dark blue denim jeans, brown shoes, holding a silver petanque boule, petanque player from southern france'
  },
  {
    name: 'joueur2',
    desc: 'slim athletic young man with short dark hair, wearing olive green sport jacket over dark shirt, dark pants, white sneakers, petanque player standing ready'
  },
  {
    name: 'joueur3',
    desc: 'stocky broad shouldered man with short dark hair, wearing white polo shirt with yellow and red horizontal stripes across the chest, beige khaki pants, brown leather shoes, petanque player'
  },
  {
    name: 'joueur4',
    desc: 'slim man with short dark hair, wearing light pink polo shirt, beige khaki pants, brown shoes, calm elegant posture, petanque player'
  },
  {
    name: 'joueur5',
    desc: 'heavyset large man with big round belly, short dark hair, wearing oversized white polo shirt with bold rainbow colored horizontal stripes red orange yellow green blue, loose beige pants, petanque player'
  },
  {
    name: 'joueur6',
    desc: 'person wearing black baseball cap and dark navy blue hoodie sweatshirt, gray pants, dark shoes, cool confident stance, petanque player'
  }
];

async function main() {
  const outputDir = path.join('photo vrai joueur', 'output_pixflux');
  fs.mkdirSync(outputDir, { recursive: true });

  console.log('PIXFLUX - Poses RPG calmes, 6 joueurs x 2 seeds = 12 sprites\n');

  const allResults = [];

  for (const p of players) {
    for (const seed of [42, 2042]) {
      const label = `${p.name}_s${seed}`;
      try {
        console.log(`  [${label}] ...`);
        const b64 = await callApi('/v1/generate-image-pixflux', {
          description: p.desc,
          image_size: { width: 64, height: 64 },
          no_background: true,
          view: 'low top-down',
          direction: 'south',
          outline: 'single color black outline',
          shading: 'detailed shading',
          detail: 'highly detailed',
          text_guidance_scale: 8,
          seed
        });

        const buf = Buffer.from(b64, 'base64');
        await sharp(buf).png().toFile(path.join(outputDir, `${label}_64.png`));
        await sharp(buf).resize(256, 256, { kernel: 'nearest' }).png().toFile(path.join(outputDir, `${label}_256.png`));
        allResults.push({ label, p256: path.join(outputDir, `${label}_256.png`) });
        console.log(`    -> OK`);
      } catch (err) {
        console.error(`    -> ERREUR: ${err.message}`);
      }
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

    const planchePath = path.join(outputDir, 'planche_pixflux.png');
    await sharp({
      create: { width: cols * (cell + gap) - gap, height: rows * (cell + gap) - gap, channels: 4, background: { r: 30, g: 30, b: 30, alpha: 255 } }
    }).composite(composites).png().toFile(planchePath);
    console.log(`\nPlanche: ${planchePath}`);
  }

  console.log('\nTERMINÉ - Pixflux poses calmes RPG');
}

main().catch(err => { console.error('Erreur:', err.message); process.exit(1); });
