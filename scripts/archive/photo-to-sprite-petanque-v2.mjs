#!/usr/bin/env node
/**
 * photo-to-sprite-petanque-v2.mjs
 * STRATÉGIE INVERSÉE: laisser la PHOTO dominer (pose calme) + pixel art par le texte
 *
 * Le problème: Bitforge est entraîné sur des sprites de jeux → poses d'action
 * La solution: init_image strength TRÈS HAUT (550-600) = la photo impose sa pose calme
 *              text_guidance_scale BAS (6) = le texte guide le style sans forcer l'action
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
  // Photo occupe le haut (60%) pour garder plus de détail du visage/buste
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

// Prompts MINIMALISTES - pas de vocabulaire gaming
// Juste "pixel art" + description physique + "petanque"
const players = [
  {
    photo: '1.png', name: 'joueur1',
    descA: 'pixel art, petanque player, tall man with wavy dark brown hair and mustache, black sweater, blue jeans, holding boule, standing naturally',
    descB: 'pixel art petanque illustration, man with brown wavy hair mustache, all black pullover, dark blue jeans, relaxed stance'
  },
  {
    photo: '2.png', name: 'joueur2',
    descA: 'pixel art, petanque player, slim man, short dark hair, olive green sport jacket, dark pants, standing casually',
    descB: 'pixel art petanque illustration, young athletic man, green-yellow jacket, dark trousers, natural standing pose'
  },
  {
    photo: '3.png', name: 'joueur3',
    descA: 'pixel art, petanque player, stocky man, short dark hair, white polo with yellow red stripes, beige pants, standing with arms crossed',
    descB: 'pixel art petanque illustration, broad shouldered man, striped polo shirt white red yellow, khaki pants, confident stance'
  },
  {
    photo: '4.png', name: 'joueur4',
    descA: 'pixel art, petanque player, slim man, short dark hair, light pink polo shirt, beige khaki pants, standing straight',
    descB: 'pixel art petanque illustration, thin man, pink collared shirt, beige pants, calm upright posture'
  },
  {
    photo: '5.png', name: 'joueur5',
    descA: 'pixel art, petanque player, heavyset man with big belly, short dark hair, white polo with rainbow horizontal stripes, beige pants',
    descB: 'pixel art petanque illustration, large round man, rainbow striped polo shirt, khaki pants, jolly expression'
  },
  {
    photo: '6.png', name: 'joueur6',
    descA: 'pixel art, petanque player, person in black cap and dark navy hoodie, gray pants, walking calmly',
    descB: 'pixel art petanque illustration, figure with black baseball cap, navy sweatshirt, gray trousers, casual confident walk'
  }
];

async function main() {
  const outputDir = path.join('photo vrai joueur', 'output_petanque_v2');
  fs.mkdirSync(outputDir, { recursive: true });

  console.log('PÉTANQUE v2 - Photo DOMINE (init 550/600) + texte DOUX (tgs 6)');
  console.log('6 joueurs x 2 prompts = 12 sprites\n');

  // Charger le style Ley pour une variante
  const leyPath = 'photo vrai joueur/ley.png';
  const ley64 = path.join(outputDir, 'ley_64.png');
  await sharp(leyPath).resize(64, 64, { kernel: 'nearest' }).png().toFile(ley64);
  const leyB64 = toBase64(ley64);

  const allResults = [];

  for (const p of players) {
    const photoPath = path.join('photo vrai joueur', p.photo);
    const photoB64 = await preparePhoto(photoPath, outputDir, p.name);

    // Variante A: init 550, tgs 6, pas de style_image
    const labelA = `${p.name}_A`;
    try {
      console.log(`  [${labelA}] init=550, tgs=6, no style`);
      const b64 = await callApi('/v1/generate-image-bitforge', {
        description: p.descA,
        image_size: { width: 64, height: 64 },
        no_background: true,
        init_image: { base64: photoB64, strength: 550 },
        text_guidance_scale: 6,
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

    // Variante B: init 600, tgs 6, style Ley léger (300) pour le rendu pixel
    const labelB = `${p.name}_B`;
    try {
      console.log(`  [${labelB}] init=600, tgs=6, style Ley 300`);
      const b64 = await callApi('/v1/generate-image-bitforge', {
        description: p.descB,
        image_size: { width: 64, height: 64 },
        no_background: true,
        init_image: { base64: photoB64, strength: 600 },
        style_image: { base64: leyB64, strength: 300 },
        text_guidance_scale: 6,
        seed: 2042
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
  console.log('  Colonne A: init 550, sans style (photo domine)');
  console.log('  Colonne B: init 600, style Ley léger 300 (pixel art guidé)');
}

main().catch(err => { console.error('Erreur:', err.message); process.exit(1); });
