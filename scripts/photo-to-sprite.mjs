#!/usr/bin/env node
/**
 * photo-to-sprite.mjs
 * Pipeline: Photo réelle → Sprite pixel art via PixelLab Bitforge
 *
 * Usage: node scripts/photo-to-sprite.mjs <photo> <nom-personnage> [description]
 *
 * Étapes:
 *   1. Crop + contraste + resize 256x256
 *   2. Envoi à PixelLab Bitforge comme init_image
 *   3. Génération de 3 variations
 *   4. Sauvegarde des résultats pour validation
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// PixelLab API config
const API_URL = 'https://api.pixellab.ai';
const API_KEY = process.env.PIXELLAB_API_KEY;

if (!API_KEY) {
  // Try loading from .env
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const match = envContent.match(/PIXELLAB_API_KEY=(.+)/);
    if (match) {
      process.env.PIXELLAB_API_KEY = match[1].trim();
    }
  } catch (e) {
    // ignore
  }
}

const getApiKey = () => process.env.PIXELLAB_API_KEY;

// === ÉTAPE 1: Préparer la photo ===
async function preparePhoto(inputPath, outputDir) {
  console.log('\n📸 ÉTAPE 1: Préparation de la photo...');

  const img = sharp(inputPath);
  const metadata = await img.metadata();
  console.log(`  Photo originale: ${metadata.width}×${metadata.height}`);

  // Crop centré sur le sujet (centre de l'image, ratio carré)
  const size = Math.min(metadata.width, metadata.height);
  const left = Math.floor((metadata.width - size) / 2);
  const top = 0; // Garder le haut (tête du joueur)

  const preparedPath = path.join(outputDir, 'step1_prepared.png');

  await sharp(inputPath)
    .extract({ left, top, width: size, height: size })
    .resize(256, 256, { fit: 'cover' })
    // Boost contraste + saturation pour mieux guider l'IA
    .modulate({ brightness: 1.05, saturation: 1.2 })
    .sharpen({ sigma: 1.5 })
    .png()
    .toFile(preparedPath);

  console.log(`  ✅ Photo préparée: 256×256, contraste boosté`);
  console.log(`  → ${preparedPath}`);

  // Version 64×64 pour init_image (lanczos = meilleur guidage IA que nearest)
  const thumbPath = path.join(outputDir, 'step1_thumb_64.png');
  await sharp(preparedPath)
    .resize(64, 64, { fit: 'cover', kernel: 'lanczos3' })
    .png()
    .toFile(thumbPath);

  console.log(`  ✅ Miniature 64×64: ${thumbPath}`);

  return { preparedPath, thumbPath };
}

// === ÉTAPE 2: Convertir en base64 ===
function imageToBase64(filePath) {
  const buffer = fs.readFileSync(filePath);
  return buffer.toString('base64');
}

// === ÉTAPE 3: Appel PixelLab Bitforge avec init_image ===
async function generateWithBitforge(base64Photo, description, styleImageBase64, variation = 0) {
  const key = getApiKey();
  if (!key) throw new Error('PIXELLAB_API_KEY non défini. Ajouter dans .env');

  console.log(`\n🎨 ÉTAPE 3: Génération Bitforge (variation ${variation + 1}/3)...`);

  const body = {
    description: description,
    image_size: { width: 64, height: 64 },
    no_background: true,
    init_image: {
      base64: base64Photo,
      strength: 450 + (variation * 50) // 450, 500, 550 - plus ou moins fidèle
    },
    text_guidance_scale: 8.0,
    seed: 42 + variation * 1000
  };

  // Ajouter style_image si on a un sprite existant comme référence
  if (styleImageBase64) {
    body.style_image = {
      base64: styleImageBase64,
      strength: 300 // Influence modérée du style existant
    };
  }

  const response = await fetch(`${API_URL}/v1/generate-image-bitforge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`PixelLab API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  console.log(`  ✅ Sprite généré (strength: ${body.init_image.strength})`);

  // L'API peut renvoyer { image: { base64: "..." } } ou { image: "base64string" }
  const img = data.image;
  const b64 = typeof img === 'string' ? img : (img.base64 || img.data || JSON.stringify(img));
  return b64;
}

// === ÉTAPE 4: Sauvegarder et assembler les résultats ===
async function saveResults(variations, outputDir, name) {
  console.log('\n💾 ÉTAPE 4: Sauvegarde des résultats...');

  const paths = [];

  for (let i = 0; i < variations.length; i++) {
    const buffer = Buffer.from(variations[i], 'base64');

    // Version 64×64 (originale)
    const path64 = path.join(outputDir, `step3_variation_${i + 1}_64x64.png`);
    await sharp(buffer).png().toFile(path64);

    // Version 32×32 (downscale nearest-neighbor pour le jeu)
    const path32 = path.join(outputDir, `step3_variation_${i + 1}_32x32.png`);
    await sharp(buffer)
      .resize(32, 32, { kernel: 'nearest' })
      .png()
      .toFile(path32);

    // Version 128×128 (upscale pour prévisualiser)
    const path128 = path.join(outputDir, `step3_variation_${i + 1}_128x128.png`);
    await sharp(buffer)
      .resize(128, 128, { kernel: 'nearest' })
      .png()
      .toFile(path128);

    paths.push({ path64, path32, path128 });
    console.log(`  ✅ Variation ${i + 1}: 32px, 64px, 128px sauvegardées`);
  }

  // Planche comparative (3 variations côte à côte en 128px)
  const planPath = path.join(outputDir, `planche_${name}_128x128.png`);
  const composites = [];
  for (let i = 0; i < variations.length; i++) {
    composites.push({
      input: paths[i].path128,
      left: i * 136, // 128 + 8px gap
      top: 0
    });
  }

  await sharp({
    create: {
      width: 136 * variations.length - 8,
      height: 128,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite(composites)
    .png()
    .toFile(planPath);

  console.log(`  ✅ Planche comparative: ${planPath}`);

  return { paths, planPath };
}

// === PIPELINE PRINCIPAL ===
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log(`
📸→🎮 Photo to Sprite Pipeline
================================
Usage: node scripts/photo-to-sprite.mjs <photo> <nom> [description]

Arguments:
  photo       Chemin vers la photo source
  nom         Nom du personnage (ex: "joueur_test")
  description Description pour PixelLab (optionnel)

Exemple:
  node scripts/photo-to-sprite.mjs "photo vrai joueur/photo_joueur.jpg" joueur_arc_en_ciel "middle-aged man, brown gray hair, short beard, white polo shirt with rainbow stripes, petanque player, throwing pose"
`);
    process.exit(1);
  }

  const [photoPath, name, customDesc] = args;

  // Description par défaut basée sur ce qu'on voit
  const description = customDesc ||
    'middle-aged man, brown gray hair, short beard, white polo shirt with colorful stripes, petanque player, friendly expression, provencal style';

  // Créer le dossier de sortie
  const outputDir = path.join('photo vrai joueur', `output_${name}`);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('='.repeat(50));
  console.log('📸→🎮 PHOTO TO SPRITE PIPELINE');
  console.log('='.repeat(50));
  console.log(`  Photo: ${photoPath}`);
  console.log(`  Personnage: ${name}`);
  console.log(`  Description: ${description}`);
  console.log(`  Output: ${outputDir}/`);

  // Étape 1: Préparer la photo
  const { preparedPath, thumbPath } = await preparePhoto(photoPath, outputDir);

  // Étape 2: Convertir en base64
  // IMPORTANT: PixelLab Bitforge exige que init_image soit exactement image_size (64x64)
  console.log('\n🔄 ÉTAPE 2: Conversion base64...');
  const photoBase64 = imageToBase64(thumbPath);
  console.log(`  ✅ Photo 64×64 encodée (${Math.round(photoBase64.length / 1024)}KB)`);

  // Charger un sprite existant comme style_image (optionnel)
  let styleBase64 = null;
  const stylePath = 'public/assets/sprites/rene_animated.png';
  if (fs.existsSync(stylePath)) {
    // Extraire la première frame (coin haut-gauche 32x32 ou 64x64)
    const styleFrame = path.join(outputDir, 'style_reference.png');
    await sharp(stylePath)
      .extract({ left: 0, top: 0, width: 128, height: 128 })
      .resize(64, 64, { kernel: 'nearest' })
      .png()
      .toFile(styleFrame);
    styleBase64 = imageToBase64(styleFrame);
    console.log(`  ✅ Style référence chargée (René)`);
  }

  // Étape 3: Générer 3 variations via Bitforge
  const variations = [];
  for (let i = 0; i < 3; i++) {
    try {
      const sprite = await generateWithBitforge(photoBase64, description, styleBase64, i);
      variations.push(sprite);
    } catch (err) {
      console.error(`  ❌ Variation ${i + 1} échouée: ${err.message}`);
    }
  }

  if (variations.length === 0) {
    console.error('\n❌ Aucune variation générée. Vérifier la clé API.');
    process.exit(1);
  }

  // Étape 4: Sauvegarder
  const { planPath } = await saveResults(variations, outputDir, name);

  // Résumé
  console.log('\n' + '='.repeat(50));
  console.log('✅ PIPELINE TERMINÉ !');
  console.log('='.repeat(50));
  console.log(`
Prochaines étapes:
  1. Ouvrir ${planPath} et choisir ta variation préférée
  2. Retoucher dans Aseprite/Pixelorama si nécessaire:
     - Snap les pixels à la grille
     - Appliquer la palette provençale (16 couleurs)
     - Vérifier le contour 1px en #3A2E28
  3. Quand tu es satisfait, lancer l'animation:
     node scripts/animate-from-image.mjs "${outputDir}/step3_variation_X_64x64.png" ${name}
  4. Le spritesheet final sera dans public/assets/sprites/${name}_animated.png
`);
}

main().catch(err => {
  console.error('❌ Erreur:', err.message);
  process.exit(1);
});
