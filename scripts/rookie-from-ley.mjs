#!/usr/bin/env node
/**
 * rookie-from-ley.mjs
 * Génère des variations "fils de Ley" pour remplacer le Rookie
 *
 * 6 approches testées:
 *   1. Bitforge init_image=ley strength 400 (jeune Ley)
 *   2. Bitforge init_image=ley strength 550 (plus proche de Ley)
 *   3. Bitforge init_image=ley strength 700 (très proche de Ley)
 *   4. Pixflux texte seul (style Ley décrit en mots)
 *   5. Pixflux texte seul variante 2 (description différente)
 *   6. Bitforge init_image=ley + style_image=ley strength 250 (style transfer léger)
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const API_URL = 'https://api.pixellab.ai';

// Charger .env
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
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`${endpoint} ${res.status}: ${txt}`);
  }
  const data = await res.json();
  const img = data.image;
  return typeof img === 'string' ? img : (img?.base64 || img?.data);
}

async function main() {
  const outputDir = 'comparison/rookie_from_ley';
  fs.mkdirSync(outputDir, { recursive: true });

  console.log('='.repeat(60));
  console.log('ROOKIE FROM LEY - 6 variantes');
  console.log('='.repeat(60));

  // Charger le sprite Ley 64x64 source
  const leySourcePath = 'AssetPetanqueMasterFinal/sprites/personnages/ley.png';

  // Ley source est probablement plus grand que 64, on le redimensionne
  const leyMeta = await sharp(leySourcePath).metadata();
  console.log(`\nLey source: ${leyMeta.width}x${leyMeta.height}`);

  // Préparer Ley en 64x64
  const ley64Path = path.join(outputDir, 'ley_source_64.png');
  await sharp(leySourcePath)
    .resize(64, 64, { kernel: 'nearest', fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png().toFile(ley64Path);

  const leyB64 = fs.readFileSync(ley64Path).toString('base64');
  console.log('Ley 64x64 prêt');

  // Description du "fils de Ley" = Rookie amélioré
  const youngLeyDesc = 'pixel art character sprite, young teenage boy, slim athletic build, ' +
    'light blue polo shirt, beige shorts, white sneakers, short brown hair, ' +
    'warm skin tone, calm idle standing pose facing south, arms relaxed at sides, ' +
    'full body head to toe, single black outline, detailed shading, petanque player';

  const youngLeyDesc2 = 'pixel art game character, teenager boy 16 years old, ' +
    'blue collared shirt, khaki shorts, brown hair neat, determined expression, ' +
    'standing idle pose facing camera, relaxed natural posture, full body visible, ' +
    'black outline, warm color palette, retro pixel art style';

  const configs = [
    // --- BITFORGE avec init_image = Ley ---
    {
      label: '1_bitforge_init400',
      title: 'Bitforge init=Ley s400 (libre)',
      endpoint: '/v1/generate-image-bitforge',
      body: {
        description: youngLeyDesc,
        image_size: { width: 64, height: 64 },
        no_background: true,
        init_image: { base64: leyB64, strength: 400 },
        text_guidance_scale: 10,
        seed: 42
      }
    },
    {
      label: '2_bitforge_init550',
      title: 'Bitforge init=Ley s550 (moyennement proche)',
      endpoint: '/v1/generate-image-bitforge',
      body: {
        description: youngLeyDesc,
        image_size: { width: 64, height: 64 },
        no_background: true,
        init_image: { base64: leyB64, strength: 550 },
        text_guidance_scale: 10,
        seed: 42
      }
    },
    {
      label: '3_bitforge_init700',
      title: 'Bitforge init=Ley s700 (très proche)',
      endpoint: '/v1/generate-image-bitforge',
      body: {
        description: youngLeyDesc,
        image_size: { width: 64, height: 64 },
        no_background: true,
        init_image: { base64: leyB64, strength: 700 },
        text_guidance_scale: 10,
        seed: 42
      }
    },
    // --- PIXFLUX texte seul ---
    {
      label: '4_pixflux_calm',
      title: 'Pixflux texte seul (calm desc)',
      endpoint: '/v1/generate-image-pixflux',
      body: {
        description: youngLeyDesc,
        image_size: { width: 64, height: 64 },
        no_background: true,
        text_guidance_scale: 8,
        view: 'low top-down',
        direction: 'south',
        outline: 'single color black outline',
        shading: 'detailed shading',
        seed: 42
      }
    },
    {
      label: '5_pixflux_variant',
      title: 'Pixflux texte seul (variante 2)',
      endpoint: '/v1/generate-image-pixflux',
      body: {
        description: youngLeyDesc2,
        image_size: { width: 64, height: 64 },
        no_background: true,
        text_guidance_scale: 8,
        view: 'low top-down',
        direction: 'south',
        outline: 'single color black outline',
        shading: 'detailed shading',
        seed: 1042
      }
    },
    // --- BITFORGE init + style ---
    {
      label: '6_bitforge_init400_style250',
      title: 'Bitforge init=Ley s400 + style=Ley s250',
      endpoint: '/v1/generate-image-bitforge',
      body: {
        description: youngLeyDesc,
        image_size: { width: 64, height: 64 },
        no_background: true,
        init_image: { base64: leyB64, strength: 400 },
        style_image: { base64: leyB64, strength: 250 },
        text_guidance_scale: 10,
        seed: 42
      }
    },
  ];

  const results = [];

  for (const cfg of configs) {
    try {
      console.log(`\n[${cfg.label}] ${cfg.title}`);
      const b64 = await callApi(cfg.endpoint, cfg.body);
      const buf = Buffer.from(b64, 'base64');

      // Sauvegarder en 64, 128 (nearest), 256 (preview)
      for (const s of [64, 128, 256]) {
        const outPath = path.join(outputDir, `${cfg.label}_${s}.png`);
        await sharp(buf).resize(s, s, { kernel: 'nearest' }).png().toFile(outPath);
      }
      results.push(cfg);
      console.log(`  -> OK`);
    } catch (err) {
      console.error(`  -> ERREUR: ${err.message.substring(0, 200)}`);
    }
  }

  // Aussi sauver Ley source en 256 pour comparaison
  await sharp(leySourcePath)
    .resize(256, 256, { kernel: 'nearest', fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png().toFile(path.join(outputDir, '0_ley_original_256.png'));

  // Aussi sauver Rookie actuel en 256 pour comparaison
  try {
    await sharp('public/assets/sprites/rookie_static.png')
      .resize(256, 256, { kernel: 'nearest', fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png().toFile(path.join(outputDir, '0_rookie_current_256.png'));
  } catch (e) { /* ignore */ }

  // Créer la planche comparative
  if (results.length > 0) {
    const cell = 256;
    const gap = 8;
    const cols = results.length + 1; // +1 pour Ley original

    const composites = [
      // Ley original en premier
      { input: path.join(outputDir, '0_ley_original_256.png'), left: 0, top: 0 },
      // Puis toutes les variantes
      ...results.map((r, i) => ({
        input: path.join(outputDir, `${r.label}_256.png`),
        left: (i + 1) * (cell + gap),
        top: 0
      }))
    ];

    const planchePath = path.join(outputDir, 'planche_comparison.png');
    await sharp({
      create: {
        width: cols * (cell + gap) - gap,
        height: cell,
        channels: 4,
        background: { r: 40, g: 40, b: 40, alpha: 255 }
      }
    }).composite(composites).png().toFile(planchePath);

    console.log(`\n  Planche: ${planchePath}`);
  }

  // Planche 2 lignes si > 4 résultats
  if (results.length > 3) {
    const cell = 256;
    const gap = 8;
    const cols = 4;
    const allItems = [
      { path: path.join(outputDir, '0_ley_original_256.png'), label: 'Ley original' },
      ...results.map(r => ({ path: path.join(outputDir, `${r.label}_256.png`), label: r.title }))
    ];
    const rows = Math.ceil(allItems.length / cols);

    const composites = allItems.map((item, i) => ({
      input: item.path,
      left: (i % cols) * (cell + gap),
      top: Math.floor(i / cols) * (cell + gap)
    }));

    const planche2Path = path.join(outputDir, 'planche_grid.png');
    await sharp({
      create: {
        width: cols * (cell + gap) - gap,
        height: rows * (cell + gap) - gap,
        channels: 4,
        background: { r: 40, g: 40, b: 40, alpha: 255 }
      }
    }).composite(composites).png().toFile(planche2Path);

    console.log(`  Planche grille: ${planche2Path}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log(`TERMINÉ - ${results.length}/6 variantes générées`);
  console.log('='.repeat(60));
  console.log('\nFichiers dans:', outputDir);
  console.log('Comparer les _256.png pour choisir le meilleur!');
}

main().catch(err => { console.error('Erreur fatale:', err.message); process.exit(1); });
