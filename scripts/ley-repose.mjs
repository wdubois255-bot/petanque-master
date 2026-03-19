#!/usr/bin/env node
/**
 * ley-repose.mjs
 * Teste différentes poses de bras pour Ley via Bitforge
 * On utilise Ley comme init_image + descriptions de pose variées
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
  const outputDir = 'comparison/ley_repose';
  fs.mkdirSync(outputDir, { recursive: true });

  console.log('='.repeat(60));
  console.log('LEY REPOSE - Modifier la pose des bras');
  console.log('='.repeat(60));

  // Charger Ley 64x64
  const leyPath = 'AssetPetanqueMasterFinal/sprites/personnages/ley.png';
  const ley64Path = path.join(outputDir, 'ley_source_64.png');
  await sharp(leyPath)
    .resize(64, 64, { kernel: 'nearest', fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png().toFile(ley64Path);
  const leyB64 = fs.readFileSync(ley64Path).toString('base64');

  // Sauver original en 256 pour ref
  await sharp(leyPath)
    .resize(256, 256, { kernel: 'nearest', fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png().toFile(path.join(outputDir, '0_ley_original_256.png'));

  // Descriptions avec poses de bras différentes
  const poseConfigs = [
    {
      label: '1_idle_arms_down',
      desc: 'pixel art character, stocky middle aged man, blue polo shirt, dark grey pants, ' +
        'calm idle standing pose, both arms relaxed hanging down at sides, ' +
        'facing south, full body, black outline, detailed shading, warm skin',
      strength: 350,
      title: 'Bras le long du corps (s350)'
    },
    {
      label: '2_idle_arms_down_s500',
      desc: 'pixel art character, stocky middle aged man, blue polo shirt, dark grey pants, ' +
        'calm idle standing pose, both arms relaxed hanging down at sides, ' +
        'facing south, full body, black outline, detailed shading, warm skin',
      strength: 500,
      title: 'Bras le long du corps (s500)'
    },
    {
      label: '3_arms_crossed',
      desc: 'pixel art character, stocky middle aged man, blue polo shirt, dark grey pants, ' +
        'standing with arms crossed on chest, confident pose, ' +
        'facing south, full body, black outline, detailed shading, warm skin',
      strength: 350,
      title: 'Bras croisés (s350)'
    },
    {
      label: '4_hands_hips',
      desc: 'pixel art character, stocky middle aged man, blue polo shirt, dark grey pants, ' +
        'standing with hands on hips, confident pose, ' +
        'facing south, full body, black outline, detailed shading, warm skin',
      strength: 350,
      title: 'Mains sur les hanches (s350)'
    },
    {
      label: '5_holding_ball',
      desc: 'pixel art character, stocky middle aged man, blue polo shirt, dark grey pants, ' +
        'standing calm, holding a metallic petanque ball in right hand at waist level, left arm relaxed, ' +
        'facing south, full body, black outline, detailed shading, warm skin',
      strength: 350,
      title: 'Tenant une boule (s350)'
    },
    {
      label: '6_relaxed_slight',
      desc: 'pixel art character, stocky middle aged man, blue polo shirt, dark grey pants, ' +
        'relaxed standing pose, arms slightly bent at sides, natural casual posture, ' +
        'facing south, full body, black outline, detailed shading, warm skin',
      strength: 400,
      title: 'Détendu naturel (s400)'
    },
    // Aussi tester via Pixflux (texte seul, pas d init_image)
    {
      label: '7_pixflux_idle',
      desc: 'pixel art character, stocky strong middle aged man, blue polo shirt tucked in dark pants, ' +
        'brown short hair, warm tanned skin, calm idle standing pose, arms at sides, ' +
        'full body head to feet, petanque player',
      strength: 0, // flag pour pixflux
      title: 'Pixflux texte seul (idle)'
    },
    {
      label: '8_pixflux_confident',
      desc: 'pixel art character, strong burly man, blue collared shirt, grey trousers, ' +
        'brown hair, tanned skin, confident standing pose, hands on belt, ' +
        'full body, petanque champion',
      strength: 0,
      title: 'Pixflux texte seul (confident)'
    },
  ];

  const results = [];

  for (const cfg of poseConfigs) {
    try {
      console.log(`\n[${cfg.label}] ${cfg.title}`);

      let b64;
      if (cfg.strength === 0) {
        // Pixflux
        b64 = await callApi('/v1/generate-image-pixflux', {
          description: cfg.desc,
          image_size: { width: 64, height: 64 },
          no_background: true,
          text_guidance_scale: 8,
          view: 'low top-down',
          direction: 'south',
          outline: 'single color black outline',
          shading: 'detailed shading',
          seed: 42
        });
      } else {
        // Bitforge avec init_image = Ley
        b64 = await callApi('/v1/generate-image-bitforge', {
          description: cfg.desc,
          image_size: { width: 64, height: 64 },
          no_background: true,
          init_image: { base64: leyB64, strength: cfg.strength },
          text_guidance_scale: 10,
          seed: 42
        });
      }

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

  // Planche comparative
  if (results.length > 0) {
    const cell = 256, gap = 6, cols = 3;
    const allItems = [
      { path: path.join(outputDir, '0_ley_original_256.png') },
      ...results.map(r => ({ path: path.join(outputDir, `${r.label}_256.png`) }))
    ];
    const rows = Math.ceil(allItems.length / cols);

    const composites = allItems.map((item, i) => ({
      input: item.path,
      left: (i % cols) * (cell + gap),
      top: Math.floor(i / cols) * (cell + gap)
    }));

    const planchePath = path.join(outputDir, 'planche_repose.png');
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

  console.log(`\nTERMINÉ - ${results.length}/${poseConfigs.length} poses`);
  console.log('Fichiers dans:', outputDir);
}

main().catch(err => { console.error('Erreur:', err.message); process.exit(1); });
