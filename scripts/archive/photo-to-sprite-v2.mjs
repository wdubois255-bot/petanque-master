#!/usr/bin/env node
/**
 * photo-to-sprite-v2.mjs
 * Pipeline AFFINÉ: Photo réelle → Sprite pixel art via PixelLab
 *
 * Améliorations vs v1:
 *   - Marcel comme style_image (meilleure ref que René)
 *   - Descriptions pixel-art-first (contraintes AVANT sujet)
 *   - Range de strengths plus large (300-550)
 *   - Test Bitforge (photo→sprite) + Pixflux (texte→sprite) pour comparer
 *   - 5 variations au total (3 Bitforge + 2 Pixflux)
 *
 * Usage: node scripts/photo-to-sprite-v2.mjs <photo> <nom> <description>
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// PixelLab API config
const API_URL = 'https://api.pixellab.ai';

// Load API key from .env
try {
  const envPath = path.resolve(process.cwd(), '.env');
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const match = envContent.match(/PIXELLAB_API_KEY=(.+)/);
  if (match) process.env.PIXELLAB_API_KEY = match[1].trim();
} catch (e) { /* ignore */ }

const getApiKey = () => {
  const key = process.env.PIXELLAB_API_KEY;
  if (!key) throw new Error('PIXELLAB_API_KEY non défini. Ajouter dans .env');
  return key;
};

// === Utilitaires ===
function imageToBase64(filePath) {
  return fs.readFileSync(filePath).toString('base64');
}

async function apiCall(endpoint, body) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getApiKey()}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`PixelLab ${endpoint} error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const img = data.image;
  return typeof img === 'string' ? img : (img?.base64 || img?.data);
}

// === ÉTAPE 1: Préparer la photo ===
async function preparePhoto(inputPath, outputDir) {
  console.log('\n--- ÉTAPE 1: Préparation de la photo ---');

  const metadata = await sharp(inputPath).metadata();
  console.log(`  Photo originale: ${metadata.width}x${metadata.height}`);

  // Crop carré centré (garder le haut pour la tête)
  const size = Math.min(metadata.width, metadata.height);
  const left = Math.floor((metadata.width - size) / 2);

  const preparedPath = path.join(outputDir, 'step1_prepared_256.png');
  await sharp(inputPath)
    .extract({ left, top: 0, width: size, height: size })
    .resize(256, 256, { fit: 'cover' })
    .modulate({ brightness: 1.05, saturation: 1.3 }) // Saturation plus forte pour pixel art
    .sharpen({ sigma: 2.0 }) // Plus net
    .png()
    .toFile(preparedPath);

  // Version 64x64 pour init_image Bitforge
  const thumbPath = path.join(outputDir, 'step1_thumb_64.png');
  await sharp(preparedPath)
    .resize(64, 64, { fit: 'cover', kernel: 'lanczos3' })
    .png()
    .toFile(thumbPath);

  console.log(`  -> Photo 256x256 et thumb 64x64 prêtes`);
  return { preparedPath, thumbPath };
}

// === ÉTAPE 2: Charger le style Marcel ===
async function loadStyleReference(outputDir) {
  console.log('\n--- ÉTAPE 2: Chargement style Marcel ---');

  // Chercher le sprite Marcel comme référence de style
  const marcelPaths = [
    'photo vrai joueur/reference_marcel_style.png',
    'public/assets/sprites/marcel_animated.png',
    'assets/sprites/marcel_animated.png'
  ];

  for (const p of marcelPaths) {
    if (fs.existsSync(p)) {
      const metadata = await sharp(p).metadata();

      let styleFrame;
      if (metadata.width > 64 || metadata.height > 64) {
        // Spritesheet: extraire la première frame
        const frameSize = Math.min(metadata.width, metadata.height);
        const extractSize = Math.min(frameSize, 128);
        styleFrame = path.join(outputDir, 'style_marcel_64.png');
        await sharp(p)
          .extract({ left: 0, top: 0, width: extractSize, height: extractSize })
          .resize(64, 64, { kernel: 'nearest' })
          .png()
          .toFile(styleFrame);
      } else {
        // Sprite unique: resize à 64x64
        styleFrame = path.join(outputDir, 'style_marcel_64.png');
        await sharp(p)
          .resize(64, 64, { kernel: 'nearest' })
          .png()
          .toFile(styleFrame);
      }

      const base64 = imageToBase64(styleFrame);
      console.log(`  -> Style Marcel chargé depuis ${p} (${Math.round(base64.length / 1024)}KB)`);
      return base64;
    }
  }

  console.log('  -> Aucun style Marcel trouvé, génération sans style_image');
  return null;
}

// === MÉTHODE A: Bitforge (photo comme init_image) ===
async function generateBitforge(photoBase64, description, styleBase64, opts = {}) {
  const { strength = 450, styleStrength = 300, seed = 42 } = opts;

  console.log(`\n  [Bitforge] strength=${strength}, style=${styleStrength}, seed=${seed}`);

  const body = {
    description,
    image_size: { width: 64, height: 64 },
    no_background: true,
    init_image: {
      base64: photoBase64,
      strength: strength
    },
    text_guidance_scale: 8.0,
    seed
  };

  if (styleBase64) {
    body.style_image = {
      base64: styleBase64,
      strength: styleStrength
    };
  }

  return apiCall('/v1/generate-image-bitforge', body);
}

// === MÉTHODE B: Pixflux (texte pur, style RPG top-down) ===
async function generatePixflux(description, styleBase64, opts = {}) {
  const { seed = 42 } = opts;

  console.log(`\n  [Pixflux] text-only, seed=${seed}`);

  const body = {
    description,
    image_size: { width: 64, height: 64 },
    no_background: true,
    view: 'low top-down',
    direction: 'south',
    outline: 'single color black outline',
    shading: 'medium shading',
    detail: 'medium detail',
    text_guidance_scale: 8.0,
    seed
  };

  // Pixflux ne supporte pas init_image mais supporte style_image via un autre param
  // Note: vérifier si style_image est supporté sur pixflux

  return apiCall('/v1/generate-image-pixflux', body);
}

// === Sauvegarde ===
async function saveVariation(base64, outputDir, label, index) {
  const buffer = Buffer.from(base64, 'base64');

  const p64 = path.join(outputDir, `${label}_${index}_64x64.png`);
  const p32 = path.join(outputDir, `${label}_${index}_32x32.png`);
  const p128 = path.join(outputDir, `${label}_${index}_128x128.png`);

  await sharp(buffer).png().toFile(p64);
  await sharp(buffer).resize(32, 32, { kernel: 'nearest' }).png().toFile(p32);
  await sharp(buffer).resize(128, 128, { kernel: 'nearest' }).png().toFile(p128);

  return { p64, p32, p128 };
}

async function makePlanche(allPaths, outputDir, name) {
  const n = allPaths.length;
  const composites = allPaths.map((p, i) => ({
    input: p.p128,
    left: i * 136,
    top: 0
  }));

  const planPath = path.join(outputDir, `planche_${name}.png`);
  await sharp({
    create: {
      width: 136 * n - 8,
      height: 128,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  }).composite(composites).png().toFile(planPath);

  return planPath;
}

// === PIPELINE ===
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log(`
Photo to Sprite Pipeline v2
============================
Usage: node scripts/photo-to-sprite-v2.mjs <photo> <nom> <description>

Exemple:
  node scripts/photo-to-sprite-v2.mjs "photo vrai joueur/photo.png" joueur_rouge "athletic petanque champion, dark hair, red polo shirt with team logo, gray pants, confident stance"
`);
    process.exit(1);
  }

  const [photoPath, name, customDesc] = args;

  // Description pixel-art-first (contraintes de style AVANT le sujet)
  const pixelPrefix = 'pixel art, top-down RPG character sprite, chibi proportions, provencal petanque game, warm colors, ';
  const description = pixelPrefix + (customDesc || 'petanque player, standing pose, friendly');

  const outputDir = path.join('photo vrai joueur', `output_${name}`);
  fs.mkdirSync(outputDir, { recursive: true });

  console.log('='.repeat(60));
  console.log('PHOTO TO SPRITE PIPELINE v2');
  console.log('='.repeat(60));
  console.log(`  Photo: ${photoPath}`);
  console.log(`  Nom: ${name}`);
  console.log(`  Description: ${description}`);
  console.log(`  Output: ${outputDir}/`);

  // Étape 1: Préparer la photo
  const { thumbPath } = await preparePhoto(photoPath, outputDir);
  const photoBase64 = imageToBase64(thumbPath);

  // Étape 2: Charger style Marcel
  const styleBase64 = await loadStyleReference(outputDir);

  // Étape 3: Générer les variations
  console.log('\n--- ÉTAPE 3: Génération des sprites ---');

  const results = [];

  // --- MÉTHODE A: Bitforge avec photo (3 variations, strengths différents) ---
  const bitforgeConfigs = [
    { strength: 300, styleStrength: 400, seed: 42, label: 'A1_bitforge_low' },
    { strength: 450, styleStrength: 300, seed: 1042, label: 'A2_bitforge_mid' },
    { strength: 550, styleStrength: 200, seed: 2042, label: 'A3_bitforge_high' },
  ];

  for (const cfg of bitforgeConfigs) {
    try {
      const b64 = await generateBitforge(photoBase64, description, styleBase64, cfg);
      const paths = await saveVariation(b64, outputDir, cfg.label, 1);
      results.push({ method: 'bitforge', ...cfg, paths });
      console.log(`  -> ${cfg.label} OK`);
    } catch (err) {
      console.error(`  -> ${cfg.label} ERREUR: ${err.message}`);
    }
  }

  // --- MÉTHODE B: Pixflux texte pur (2 variations, seeds différents) ---
  const pixfluxConfigs = [
    { seed: 42, label: 'B1_pixflux' },
    { seed: 7777, label: 'B2_pixflux' },
  ];

  for (const cfg of pixfluxConfigs) {
    try {
      const b64 = await generatePixflux(description, styleBase64, cfg);
      const paths = await saveVariation(b64, outputDir, cfg.label, 1);
      results.push({ method: 'pixflux', ...cfg, paths });
      console.log(`  -> ${cfg.label} OK`);
    } catch (err) {
      console.error(`  -> ${cfg.label} ERREUR: ${err.message}`);
    }
  }

  if (results.length === 0) {
    console.error('\nAucune variation générée. Vérifier la clé API.');
    process.exit(1);
  }

  // Étape 4: Planche comparative
  console.log('\n--- ÉTAPE 4: Planche comparative ---');
  const allPaths = results.map(r => r.paths);
  const planPath = await makePlanche(allPaths, outputDir, name);

  console.log('\n' + '='.repeat(60));
  console.log('PIPELINE TERMINÉ');
  console.log('='.repeat(60));
  console.log(`\nRésultats (${results.length} variations):`);
  results.forEach((r, i) => {
    console.log(`  ${i + 1}. ${r.label} (${r.method}) -> ${r.paths.p128}`);
  });
  console.log(`\nPlanche: ${planPath}`);
  console.log(`\nLégende:`);
  console.log(`  A1 = Bitforge strength 300 (plus créatif, moins fidèle photo)`);
  console.log(`  A2 = Bitforge strength 450 (équilibré)`);
  console.log(`  A3 = Bitforge strength 550 (plus fidèle photo)`);
  console.log(`  B1/B2 = Pixflux (texte pur, pas de photo, style RPG)`);
}

main().catch(err => {
  console.error('Erreur:', err.message);
  process.exit(1);
});
