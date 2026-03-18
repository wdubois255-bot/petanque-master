#!/usr/bin/env node
/**
 * photo-to-sprite-v3.mjs
 * Pipeline AFFINÉ v3: Photo réelle → Sprite pixel art style Ley
 *
 * Corrections v3 vs v2:
 *   - Photo ENTIÈRE avec jambes (pas de crop carré qui coupe le bas)
 *   - Style Ley (semi-réaliste, détaillé) au lieu de chibi
 *   - Ley comme style_image (meilleure ref que Marcel)
 *   - Photo paddée en transparent pour garder les proportions
 *
 * Usage: node scripts/photo-to-sprite-v3.mjs <photo> <nom> <description>
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

// === ÉTAPE 1: Préparer la photo AVEC JAMBES ===
async function preparePhoto(inputPath, outputDir) {
  console.log('\n--- ÉTAPE 1: Préparation de la photo (CORPS ENTIER) ---');

  const metadata = await sharp(inputPath).metadata();
  console.log(`  Photo originale: ${metadata.width}x${metadata.height}`);

  // IMPORTANT: On garde la photo ENTIÈRE (avec jambes!)
  // On resize pour que ça rentre dans 64x64 en gardant le ratio
  // Puis on padde avec du transparent pour remplir le carré 64x64

  // D'abord crop léger horizontal si très large (garder le sujet central)
  let processedPath = inputPath;

  // Resize la photo ENTIÈRE (corps + jambes) pour rentrer dans 64x64
  // Le sujet sera plus petit mais COMPLET
  const thumb64Path = path.join(outputDir, 'step1_thumb_64_fullbody.png');
  await sharp(inputPath)
    .resize(64, 64, {
      fit: 'contain',           // Garder le ratio, tout le corps visible
      background: { r: 0, g: 0, b: 0, alpha: 0 }  // Padding transparent
    })
    .modulate({ brightness: 1.05, saturation: 1.3 })
    .sharpen({ sigma: 1.5 })
    .png()
    .toFile(thumb64Path);

  // Aussi une version 256x256 pour preview
  const prepared256Path = path.join(outputDir, 'step1_prepared_256_fullbody.png');
  await sharp(inputPath)
    .resize(256, 256, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .modulate({ brightness: 1.05, saturation: 1.3 })
    .sharpen({ sigma: 1.5 })
    .png()
    .toFile(prepared256Path);

  console.log(`  -> Photo CORPS ENTIER 64x64 (avec padding transparent)`);
  return { thumbPath: thumb64Path, preparedPath: prepared256Path };
}

// === ÉTAPE 2: Charger le style Ley (la VRAIE référence) ===
async function loadStyleReference(outputDir) {
  console.log('\n--- ÉTAPE 2: Chargement style Ley ---');

  // Ley = la référence parfaite selon l'utilisateur
  const leyPaths = [
    'photo vrai joueur/ley.png',
    'AssetPetanqueMasterFinal/sprites/personnages/ley.png',
    'public/assets/sprites/ley_animated.png'
  ];

  for (const p of leyPaths) {
    if (fs.existsSync(p)) {
      const metadata = await sharp(p).metadata();
      const styleFrame = path.join(outputDir, 'style_ley_64.png');

      if (metadata.width > 64) {
        // Spritesheet ou grande image: extraire frame 1 (coin haut-gauche)
        const frameW = metadata.width <= 128 ? metadata.width : Math.floor(metadata.width / 4);
        const frameH = metadata.height <= 128 ? metadata.height : Math.floor(metadata.height / 4);
        await sharp(p)
          .extract({ left: 0, top: 0, width: frameW, height: frameH })
          .resize(64, 64, { kernel: 'nearest' })
          .png()
          .toFile(styleFrame);
      } else {
        await sharp(p)
          .resize(64, 64, { kernel: 'nearest' })
          .png()
          .toFile(styleFrame);
      }

      const base64 = imageToBase64(styleFrame);
      console.log(`  -> Style Ley chargé depuis ${p}`);
      return base64;
    }
  }

  // Fallback: Marcel
  const marcelPath = 'photo vrai joueur/reference_marcel_style.png';
  if (fs.existsSync(marcelPath)) {
    const styleFrame = path.join(outputDir, 'style_marcel_64.png');
    await sharp(marcelPath)
      .resize(64, 64, { kernel: 'nearest' })
      .png()
      .toFile(styleFrame);
    console.log('  -> Fallback: style Marcel');
    return imageToBase64(styleFrame);
  }

  console.log('  -> Aucun style trouvé');
  return null;
}

// === MÉTHODE A: Bitforge (photo comme init_image) ===
async function generateBitforge(photoBase64, description, styleBase64, opts = {}) {
  const { strength = 450, styleStrength = 350, seed = 42 } = opts;
  console.log(`  [Bitforge] init_strength=${strength}, style_strength=${styleStrength}, seed=${seed}`);

  const body = {
    description,
    image_size: { width: 64, height: 64 },
    no_background: true,
    init_image: {
      base64: photoBase64,
      strength
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

// === MÉTHODE B: Pixflux (texte pur, params RPG) ===
async function generatePixflux(description, opts = {}) {
  const { seed = 42 } = opts;
  console.log(`  [Pixflux] text-only, seed=${seed}`);

  return apiCall('/v1/generate-image-pixflux', {
    description,
    image_size: { width: 64, height: 64 },
    no_background: true,
    view: 'low top-down',
    direction: 'south',
    outline: 'single color black outline',
    shading: 'medium shading',
    detail: 'high detail',
    text_guidance_scale: 8.0,
    seed
  });
}

// === Sauvegarde ===
async function saveVariation(base64, outputDir, label) {
  const buffer = Buffer.from(base64, 'base64');

  const p64 = path.join(outputDir, `${label}_64x64.png`);
  // Aussi une version 256 pour la planche (plus facile à voir)
  const p256 = path.join(outputDir, `${label}_256x256.png`);

  await sharp(buffer).png().toFile(p64);
  await sharp(buffer).resize(256, 256, { kernel: 'nearest' }).png().toFile(p256);

  return { p64, p256 };
}

async function makePlanche(allPaths, outputDir, name) {
  const n = allPaths.length;
  const composites = allPaths.map((p, i) => ({
    input: p.p256,
    left: i * 264,
    top: 0
  }));

  const planPath = path.join(outputDir, `planche_${name}.png`);
  await sharp({
    create: {
      width: 264 * n - 8,
      height: 256,
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
Photo to Sprite Pipeline v3 (style Ley)
=========================================
Usage: node scripts/photo-to-sprite-v3.mjs <photo> <nom> <description>
`);
    process.exit(1);
  }

  const [photoPath, name, customDesc] = args;

  // Description style Ley (semi-réaliste, PAS chibi)
  const stylePrefix = 'pixel art character sprite, semi-realistic proportions, full body with legs visible, detailed shading, standing pose facing camera, ';
  const description = stylePrefix + (customDesc || 'petanque player, standing pose');

  const outputDir = path.join('photo vrai joueur', `output_${name}_v3`);
  fs.mkdirSync(outputDir, { recursive: true });

  console.log('='.repeat(60));
  console.log('PHOTO TO SPRITE v3 (style Ley, corps entier)');
  console.log('='.repeat(60));
  console.log(`  Photo: ${photoPath}`);
  console.log(`  Nom: ${name}`);
  console.log(`  Description: ${description}`);

  // Étape 1: Préparer photo AVEC JAMBES
  const { thumbPath } = await preparePhoto(photoPath, outputDir);
  const photoBase64 = imageToBase64(thumbPath);
  console.log(`  Photo base64: ${Math.round(photoBase64.length / 1024)}KB`);

  // Étape 2: Style Ley
  const styleBase64 = await loadStyleReference(outputDir);

  // Étape 3: Générations
  console.log('\n--- ÉTAPE 3: Génération des sprites ---');
  const results = [];

  // Bitforge: 3 variations avec différents niveaux de fidélité photo
  const configs = [
    { strength: 300, styleStrength: 400, seed: 42,   label: 'v1_creative' },
    { strength: 400, styleStrength: 350, seed: 1042, label: 'v2_balanced' },
    { strength: 500, styleStrength: 300, seed: 2042, label: 'v3_faithful' },
  ];

  for (const cfg of configs) {
    try {
      const b64 = await generateBitforge(photoBase64, description, styleBase64, cfg);
      const paths = await saveVariation(b64, outputDir, cfg.label);
      results.push({ ...cfg, paths });
      console.log(`  -> ${cfg.label} OK`);
    } catch (err) {
      console.error(`  -> ${cfg.label} ERREUR: ${err.message}`);
    }
  }

  // Pixflux désactivé (focus Bitforge uniquement)

  if (results.length === 0) {
    console.error('\nAucune variation. Vérifier clé API.');
    process.exit(1);
  }

  // Étape 4: Planche
  console.log('\n--- ÉTAPE 4: Planche comparative ---');
  const planPath = await makePlanche(results.map(r => r.paths), outputDir, name);

  console.log('\n' + '='.repeat(60));
  console.log('TERMINÉ');
  console.log('='.repeat(60));
  results.forEach((r, i) => console.log(`  ${i + 1}. ${r.label} -> ${r.paths.p256}`));
  console.log(`\nPlanche: ${planPath}`);
  console.log(`\nLégende:`);
  console.log(`  A1 = Photo influence légère (plus créatif style Ley)`);
  console.log(`  A2 = Photo influence moyenne`);
  console.log(`  A3 = Photo influence forte`);
  console.log(`  A4 = Photo influence très forte (plus fidèle)`);
  console.log(`  B1/B2 = Texte pur (sans photo du tout)`);
}

main().catch(err => {
  console.error('Erreur:', err.message);
  process.exit(1);
});
