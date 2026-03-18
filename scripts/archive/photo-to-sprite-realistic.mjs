#!/usr/bin/env node
/**
 * photo-to-sprite-realistic.mjs
 * Pipeline RÉALISTE: Photo → Sprite haute fidélité via PixelLab Bitforge
 *
 * Objectif: maximiser la ressemblance avec la photo réelle
 * - Pas de prefix "pixel art" qui bride le réalisme
 * - init_image strength très élevé (600-800)
 * - Pas de style_image (pas de Ley/Marcel qui déforment)
 * - Photo préparée en fill (pas contain) pour remplir le cadre
 * - text_guidance_scale élevé (10)
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const API_URL = 'https://api.pixellab.ai';

// Load API key
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

function imageToBase64(filePath) {
  return fs.readFileSync(filePath).toString('base64');
}

async function apiCall(endpoint, body) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getApiKey()}`
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`${endpoint} ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const img = data.image;
  return typeof img === 'string' ? img : (img?.base64 || img?.data);
}

// Prépare la photo de 3 façons différentes pour comparer
async function preparePhotos(inputPath, outputDir) {
  console.log('\n--- Préparation photo (3 méthodes) ---');
  const metadata = await sharp(inputPath).metadata();
  console.log(`  Original: ${metadata.width}x${metadata.height}`);

  const results = {};

  // Méthode 1: CONTAIN (corps entier, padding transparent)
  const containPath = path.join(outputDir, 'prep_contain_64.png');
  await sharp(inputPath)
    .resize(64, 64, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .modulate({ brightness: 1.05, saturation: 1.3 })
    .sharpen({ sigma: 1.5 })
    .png().toFile(containPath);
  results.contain = imageToBase64(containPath);

  // Méthode 2: FILL (étire pour remplir 64x64 - léger squash mais plein cadre)
  const fillPath = path.join(outputDir, 'prep_fill_64.png');
  await sharp(inputPath)
    .resize(64, 64, { fit: 'fill' })
    .modulate({ brightness: 1.05, saturation: 1.3 })
    .sharpen({ sigma: 1.5 })
    .png().toFile(fillPath);
  results.fill = imageToBase64(fillPath);

  // Méthode 3: COVER centré (crop les bords, sujet plus gros)
  const coverPath = path.join(outputDir, 'prep_cover_64.png');
  await sharp(inputPath)
    .resize(64, 64, { fit: 'cover', position: 'centre' })
    .modulate({ brightness: 1.05, saturation: 1.3 })
    .sharpen({ sigma: 1.5 })
    .png().toFile(coverPath);
  results.cover = imageToBase64(coverPath);

  console.log('  -> 3 variantes préparées (contain, fill, cover)');
  return results;
}

async function generateRealistic(photoBase64, description, opts = {}) {
  const { strength = 700, tgs = 10, seed = 42 } = opts;
  console.log(`  [Bitforge] strength=${strength}, tgs=${tgs}, seed=${seed}`);

  return apiCall('/v1/generate-image-bitforge', {
    description,
    image_size: { width: 64, height: 64 },
    no_background: true,
    init_image: { base64: photoBase64, strength },
    text_guidance_scale: tgs,
    seed
  });
}

async function saveSprite(base64, outputDir, label) {
  const buffer = Buffer.from(base64, 'base64');
  const p64 = path.join(outputDir, `${label}_64.png`);
  const p256 = path.join(outputDir, `${label}_256.png`);
  await sharp(buffer).png().toFile(p64);
  await sharp(buffer).resize(256, 256, { kernel: 'nearest' }).png().toFile(p256);
  return { p64, p256 };
}

async function makePlanche(paths256, outputDir, name) {
  const n = paths256.length;
  const composites = paths256.map((p, i) => ({ input: p, left: i * 264, top: 0 }));
  const planPath = path.join(outputDir, `planche_${name}.png`);
  await sharp({
    create: { width: 264 * n - 8, height: 256, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
  }).composite(composites).png().toFile(planPath);
  return planPath;
}

async function main() {
  const [photoPath, name, customDesc] = process.argv.slice(2);
  if (!photoPath || !name) {
    console.log('Usage: node scripts/photo-to-sprite-realistic.mjs <photo> <nom> <description>');
    process.exit(1);
  }

  // Description RÉALISTE - pas de "pixel art" qui bride
  const description = customDesc || 'detailed character sprite, full body standing pose';

  const outputDir = path.join('photo vrai joueur', `output_${name}_realistic`);
  fs.mkdirSync(outputDir, { recursive: true });

  console.log('='.repeat(60));
  console.log('PHOTO TO SPRITE - MODE RÉALISTE');
  console.log('='.repeat(60));
  console.log(`  Photo: ${photoPath}`);
  console.log(`  Nom: ${name}`);

  // Préparer 3 versions de la photo
  const photos = await preparePhotos(photoPath, outputDir);

  // Matrice de tests: 3 préparations x 3 strengths = 9 variations
  // Mais on fait les 3 meilleures combinaisons pour ne pas exploser le budget
  console.log('\n--- Génération réaliste (6 variations) ---');

  const configs = [
    // CONTAIN (corps entier avec padding) - strengths variés
    { photo: 'contain', strength: 600, tgs: 10, seed: 42, label: '01_contain_s600' },
    { photo: 'contain', strength: 750, tgs: 10, seed: 1042, label: '02_contain_s750' },

    // FILL (étiré, remplit le cadre) - bon compromis
    { photo: 'fill', strength: 600, tgs: 10, seed: 42, label: '03_fill_s600' },
    { photo: 'fill', strength: 750, tgs: 10, seed: 1042, label: '04_fill_s750' },

    // COVER (croppé mais sujet gros) - plus de détail visage/haut
    { photo: 'cover', strength: 600, tgs: 10, seed: 42, label: '05_cover_s600' },
    { photo: 'cover', strength: 750, tgs: 10, seed: 1042, label: '06_cover_s750' },
  ];

  const results = [];
  for (const cfg of configs) {
    try {
      const b64 = await generateRealistic(photos[cfg.photo], description, cfg);
      const paths = await saveSprite(b64, outputDir, cfg.label);
      results.push({ ...cfg, paths });
      console.log(`  -> ${cfg.label} OK`);
    } catch (err) {
      console.error(`  -> ${cfg.label} ERREUR: ${err.message}`);
    }
  }

  // Planche
  const planPath = await makePlanche(results.map(r => r.paths.p256), outputDir, name);

  console.log('\n' + '='.repeat(60));
  console.log('TERMINÉ - MODE RÉALISTE');
  console.log('='.repeat(60));
  results.forEach((r, i) => console.log(`  ${i + 1}. ${r.label} (${r.photo})`));
  console.log(`\nPlanche: ${planPath}`);
  console.log(`\nLégende:`);
  console.log(`  contain = corps entier avec padding transparent`);
  console.log(`  fill = photo étirée pour remplir 64x64`);
  console.log(`  cover = photo croppée, sujet gros`);
  console.log(`  s600 = strength 600, s750 = strength 750 (plus fidèle)`);
}

main().catch(err => { console.error('Erreur:', err.message); process.exit(1); });
