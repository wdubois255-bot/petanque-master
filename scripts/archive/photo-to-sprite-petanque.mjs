#!/usr/bin/env node
/**
 * photo-to-sprite-petanque.mjs
 * Prompt "pétanque" et non "gaming" - poses calmes, ambiance boulodrome
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

async function preparePhoto(photoPath, outputDir) {
  const scaledH = Math.round(64 * 0.55);
  const scaledBuf = await sharp(photoPath)
    .resize(64, scaledH, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .modulate({ brightness: 1.1, saturation: 1.3 })
    .sharpen({ sigma: 1.5 })
    .png().toBuffer();

  const outPath = path.join(outputDir, 'photo_64.png');
  await sharp({
    create: { width: 64, height: 64, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
  }).composite([{ input: scaledBuf, left: 0, top: 0 }]).png().toFile(outPath);
  return toBase64(outPath);
}

// Prefix commun: PAS de "character sprite", PAS de "game", juste "pixel art portrait"
const PREFIX_A = 'pixel art illustration of a petanque player, small detailed figure, black outline, realistic proportions, natural relaxed standing pose, full body from head to feet, southern france boulodrome atmosphere, ';
const PREFIX_B = 'pixel art drawing of a man playing petanque, full body standing relaxed, black outline, warm natural colors, realistic proportions, casual pose holding a boule, ';

const players = [
  {
    photo: '1.png', name: 'joueur1',
    descA: PREFIX_A + 'tall man with dark brown wavy hair and thick mustache, wearing all black long sleeve sweater, dark blue jeans, brown shoes, holding a silver petanque boule',
    descB: PREFIX_B + 'tall slim man, wavy dark brown hair, mustache, black pullover sweater, blue denim jeans, inspecting his boule before throwing'
  },
  {
    photo: '2.png', name: 'joueur2',
    descA: PREFIX_A + 'slim athletic man with short dark hair, wearing olive green sport jacket over dark shirt, dark pants, white shoes, confident posture',
    descB: PREFIX_B + 'lean young man, short hair, yellow-green windbreaker jacket, dark trousers, standing at the boulodrome ready to play'
  },
  {
    photo: '3.png', name: 'joueur3',
    descA: PREFIX_A + 'stocky broad man with short dark hair, wearing white polo shirt with yellow and red horizontal stripes across chest, beige khaki pants, brown leather shoes',
    descB: PREFIX_B + 'heavyset man, short dark hair, white collared polo with colorful stripes red and yellow, beige pants, standing with arms crossed confidently'
  },
  {
    photo: '4.png', name: 'joueur4',
    descA: PREFIX_A + 'slim man with short dark hair, wearing light pink polo shirt tucked in, beige khaki pants, brown shoes, standing straight with hands at sides',
    descB: PREFIX_B + 'thin man, neat short hair, pastel pink polo shirt, khaki trousers, calm composed stance, elegant posture'
  },
  {
    photo: '5.png', name: 'joueur5',
    descA: PREFIX_A + 'heavyset big belly man with short dark hair, wearing oversized white polo shirt with bold horizontal rainbow stripes in red orange yellow green blue across torso, loose beige pants',
    descB: PREFIX_B + 'large stocky man with round belly, short dark hair, colorful rainbow striped white polo shirt, beige trousers, jovial friendly expression'
  },
  {
    photo: '6.png', name: 'joueur6',
    descA: PREFIX_A + 'person wearing black baseball cap, dark navy blue hoodie sweatshirt, gray pants, dark shoes, cool confident walk',
    descB: PREFIX_B + 'figure in black cap and dark navy hoodie, gray trousers, hands relaxed, walking casually at the boulodrome'
  }
];

async function main() {
  const outputDir = path.join('photo vrai joueur', 'output_petanque_batch');
  fs.mkdirSync(outputDir, { recursive: true });

  console.log('BATCH PÉTANQUE - 6 joueurs x 2 prompts = 12 sprites');
  console.log('Style: pétanque réaliste, PAS retro gaming\n');

  const allResults = [];

  for (const p of players) {
    const photoPath = path.join('photo vrai joueur', p.photo);
    const photoB64 = await preparePhoto(photoPath, outputDir);

    for (const [variant, desc] of [['A', p.descA], ['B', p.descB]]) {
      const label = `${p.name}_${variant}`;
      try {
        console.log(`  [${label}] ...`);
        const b64 = await callApi('/v1/generate-image-bitforge', {
          description: desc,
          image_size: { width: 64, height: 64 },
          no_background: true,
          init_image: { base64: photoB64, strength: 400 },
          text_guidance_scale: 8,
          seed: variant === 'A' ? 42 : 2042
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

  // Planche globale 2 colonnes x 6 lignes
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

  console.log('\nTERMINÉ - 12 sprites pétanque');
}

main().catch(err => { console.error('Erreur:', err.message); process.exit(1); });
