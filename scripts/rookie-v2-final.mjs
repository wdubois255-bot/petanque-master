#!/usr/bin/env node
/**
 * rookie-v2-final.mjs
 * 3 approches créatives pour le full body parfait
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const API_URL = 'https://api.pixellab.ai';
const outputDir = 'AssetPetanqueMasterFinal/sprites/personnages/rookie_v2';

try {
  const envContent = fs.readFileSync(path.resolve(process.cwd(), '.env'), 'utf-8');
  const match = envContent.match(/PIXELLAB_API_KEY=(.+)/);
  if (match) process.env.PIXELLAB_API_KEY = match[1].trim();
} catch (e) {}

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

async function loadPixels(filePath) {
  const { data, info } = await sharp(filePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data: Buffer.from(data), width: info.width, height: info.height, channels: 4 };
}
function getPixel(img, x, y) {
  if (x < 0 || x >= img.width || y < 0 || y >= img.height) return [0, 0, 0, 0];
  const i = (y * img.width + x) * 4;
  return [img.data[i], img.data[i + 1], img.data[i + 2], img.data[i + 3]];
}
function setPixel(img, x, y, r, g, b, a) {
  if (x < 0 || x >= img.width || y < 0 || y >= img.height) return;
  const i = (y * img.width + x) * 4;
  img.data[i] = r; img.data[i + 1] = g; img.data[i + 2] = b; img.data[i + 3] = a;
}
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [h * 360, s, l];
}

async function saveScale(inputBuf, w, h, basePath) {
  const raw = { raw: { width: w, height: h, channels: 4 } };
  await sharp(inputBuf, raw).png().toFile(`${basePath}_128.png`);
  await sharp(inputBuf, raw).resize(256, 256, { kernel: 'nearest' }).png().toFile(`${basePath}_256.png`);
  await sharp(inputBuf, raw).resize(64, 64, { kernel: 'nearest' }).png().toFile(`${basePath}_64.png`);
  await sharp(inputBuf, raw).resize(512, 512, { kernel: 'nearest' }).png().toFile(`${basePath}_512.png`);
}

async function main() {
  console.log('='.repeat(60));
  console.log('ROOKIE V2 FINAL - 3 approches créatives');
  console.log('='.repeat(60));

  // Le sprite favori (s550, celui avec le petit artefact doré)
  const favPath = path.join(outputDir, 'fullbody_s550_128.png');
  const fav = await loadPixels(favPath);

  // ============================================================
  // APPROCHE 1: ULTRA-CLEAN (chirurgical)
  // Nettoyer l'artefact doré pixel par pixel, puis Bitforge s900
  // ============================================================
  console.log('\n=== APPROCHE 1: ULTRA-CLEAN ===');

  const clean = { data: Buffer.from(fav.data), width: 128, height: 128, channels: 4 };

  // Supprimer tous les pixels dorés/jaunes (hue 25-70, sat > 0.3)
  let cleanCount = 0;
  for (let y = 0; y < 128; y++) {
    for (let x = 0; x < 128; x++) {
      const [r, g, b, a] = getPixel(clean, x, y);
      if (a < 50) continue;
      const [h, s, l] = rgbToHsl(r, g, b);

      if (h > 25 && h < 75 && s > 0.35) {
        // Vérifier si c'est la ceinture (zone y ~65-75, au centre)
        if (y > 58 && y < 78 && x > 35 && x < 85) continue; // garder la ceinture
        setPixel(clean, x, y, 0, 0, 0, 0);
        cleanCount++;
      }
    }
  }

  // Aussi supprimer les pixels orangés isolés
  for (let y = 0; y < 128; y++) {
    for (let x = 0; x < 128; x++) {
      const [r, g, b, a] = getPixel(clean, x, y);
      if (a < 50) continue;
      const [h, s] = rgbToHsl(r, g, b);

      if (h > 15 && h < 45 && s > 0.5) {
        let neighbors = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy) continue;
            const na = getPixel(clean, x + dx, y + dy)[3];
            if (na > 128) neighbors++;
          }
        }
        if (neighbors < 4) {
          setPixel(clean, x, y, 0, 0, 0, 0);
          cleanCount++;
        }
      }
    }
  }
  console.log(`  ${cleanCount} pixels artefacts nettoyés`);

  await saveScale(clean.data, 128, 128, path.join(outputDir, 'final_clean'));

  // Bitforge s900 = quasi identique, juste lissé
  const cleanB64 = fs.readFileSync(path.join(outputDir, 'final_clean_128.png')).toString('base64');
  const descBase = 'pixel art character sprite, stocky strong man, white collared polo shirt, ' +
    'light blue denim jeans, brown leather shoes, brown hair, warm tanned skin, ' +
    'standing idle pose facing south, arms at sides, full body from head to feet, ' +
    'clean single pixel dark outline, detailed shading, petanque player';

  for (const s of [900, 850]) {
    try {
      console.log(`  Bitforge s${s}...`);
      const b64 = await callApi('/v1/generate-image-bitforge', {
        description: descBase,
        image_size: { width: 128, height: 128 },
        no_background: true,
        init_image: { base64: cleanB64, strength: s },
        text_guidance_scale: 4,
        seed: 42
      });
      const buf = Buffer.from(b64, 'base64');
      const p = path.join(outputDir, `final_ultraclean_s${s}`);
      await sharp(buf).png().toFile(`${p}_128.png`);
      await sharp(buf).resize(256, 256, { kernel: 'nearest' }).png().toFile(`${p}_256.png`);
      await sharp(buf).resize(512, 512, { kernel: 'nearest' }).png().toFile(`${p}_512.png`);
      await sharp(buf).resize(64, 64, { kernel: 'nearest' }).png().toFile(`${p}_64.png`);
      console.log(`    OK`);
    } catch (err) {
      console.error(`    ERREUR: ${err.message.substring(0, 100)}`);
    }
  }

  // ============================================================
  // APPROCHE 2: FRANKENSTEIN
  // Générer un perso complet via Pixflux, greffer les jambes
  // ============================================================
  console.log('\n=== APPROCHE 2: FRANKENSTEIN ===');

  // Générer 3 full-body via Pixflux pour avoir de bonnes jambes
  const pixfluxDesc = 'pixel art game character, strong stocky adult man, white polo shirt, ' +
    'light blue jeans, brown shoes, brown hair, tanned skin, idle standing pose, ' +
    'full body visible head to feet, arms relaxed at sides';

  const donors = [];
  for (const seed of [42, 200, 500]) {
    try {
      console.log(`  Pixflux donor seed=${seed}...`);
      const b64 = await callApi('/v1/generate-image-pixflux', {
        description: pixfluxDesc,
        image_size: { width: 64, height: 64 },
        no_background: true,
        text_guidance_scale: 8,
        view: 'low top-down',
        direction: 'south',
        outline: 'single color black outline',
        shading: 'detailed shading',
        seed
      });
      const buf = Buffer.from(b64, 'base64');
      const donorPath = path.join(outputDir, `_donor_s${seed}_64.png`);
      await sharp(buf).png().toFile(donorPath);
      // Upscale to 128
      const donor128Path = path.join(outputDir, `_donor_s${seed}_128.png`);
      await sharp(buf).resize(128, 128, { kernel: 'nearest' }).png().toFile(donor128Path);
      donors.push({ seed, path64: donorPath, path128: donor128Path });
      console.log(`    OK`);
    } catch (err) {
      console.error(`    ERREUR: ${err.message.substring(0, 100)}`);
    }
  }

  // Pour chaque donor, greffer ses jambes sous le buste du favori
  for (const donor of donors) {
    console.log(`  Greffe donor seed=${donor.seed}...`);
    const donorImg = await loadPixels(donor.path128);

    // Trouver la ligne de coupure du favori (dernière ligne avec >15 pixels)
    let cutY = 0;
    for (let y = 127; y >= 0; y--) {
      let cnt = 0;
      for (let x = 0; x < 128; x++) {
        if (getPixel(clean, x, y)[3] > 128) cnt++;
      }
      if (cnt > 15) { cutY = y; break; }
    }

    // Trouver la ligne de coupure du donor (~milieu, où la taille/hanche commence)
    // On cherche la transition chemise->pantalon dans le donor
    let donorCutY = Math.round(donorImg.height * 0.5);

    // Composite: favori au-dessus, donor en-dessous
    const frank = Buffer.alloc(128 * 128 * 4, 0);

    // Copier le favori (nettoyé) tel quel
    for (let y = 0; y <= cutY; y++) {
      for (let x = 0; x < 128; x++) {
        const [r, g, b, a] = getPixel(clean, x, y);
        if (a > 50) {
          const i = (y * 128 + x) * 4;
          frank[i] = r; frank[i + 1] = g; frank[i + 2] = b; frank[i + 3] = a;
        }
      }
    }

    // Copier les jambes du donor à partir de cutY+1
    // On doit aligner le donor: ses jambes commencent à donorCutY
    const donorOffsetY = cutY + 1 - donorCutY;
    // Aligner en X aussi (centrer le donor)
    let donorCX = 0, donorCCount = 0;
    for (let x = 0; x < 128; x++) {
      for (let y = donorCutY; y < 128; y++) {
        if (getPixel(donorImg, x, y)[3] > 128) { donorCX += x; donorCCount++; }
      }
    }
    donorCX = donorCCount > 0 ? Math.round(donorCX / donorCCount) : 64;

    let favCX = 0, favCCount = 0;
    for (let x = 0; x < 128; x++) {
      if (getPixel(clean, x, cutY)[3] > 128) { favCX += x; favCCount++; }
    }
    favCX = favCCount > 0 ? Math.round(favCX / favCCount) : 64;
    const donorOffsetX = favCX - donorCX;

    for (let y = donorCutY; y < 128; y++) {
      const targetY = y + donorOffsetY;
      if (targetY <= cutY || targetY >= 128) continue;
      for (let x = 0; x < 128; x++) {
        const [r, g, b, a] = getPixel(donorImg, x, y);
        if (a > 50) {
          const tx = x + donorOffsetX;
          if (tx >= 0 && tx < 128) {
            const i = (targetY * 128 + tx) * 4;
            if (frank[i + 3] < 50) { // ne pas écraser le favori
              frank[i] = r; frank[i + 1] = g; frank[i + 2] = b; frank[i + 3] = a;
            }
          }
        }
      }
    }

    // Sauver le frankenstein brut
    const frankPath = path.join(outputDir, `frank_s${donor.seed}`);
    await saveScale(frank, 128, 128, frankPath);

    // Bitforge pour harmoniser la greffe
    const frankB64 = fs.readFileSync(`${frankPath}_128.png`).toString('base64');
    try {
      console.log(`  Bitforge harmonisation...`);
      const b64 = await callApi('/v1/generate-image-bitforge', {
        description: descBase,
        image_size: { width: 128, height: 128 },
        no_background: true,
        init_image: { base64: frankB64, strength: 750 },
        text_guidance_scale: 6,
        seed: 42
      });
      const buf = Buffer.from(b64, 'base64');
      const hp = path.join(outputDir, `frank_harmonized_s${donor.seed}`);
      await sharp(buf).png().toFile(`${hp}_128.png`);
      await sharp(buf).resize(256, 256, { kernel: 'nearest' }).png().toFile(`${hp}_256.png`);
      await sharp(buf).resize(512, 512, { kernel: 'nearest' }).png().toFile(`${hp}_512.png`);
      await sharp(buf).resize(64, 64, { kernel: 'nearest' }).png().toFile(`${hp}_64.png`);
      console.log(`    OK`);
    } catch (err) {
      console.error(`    ERREUR: ${err.message.substring(0, 100)}`);
    }
  }

  // ============================================================
  // APPROCHE 3: PIXFLUX 64x64 DIRECT + Bitforge upscale
  // Générer directement en 64x64 (taille jeu) full body, puis upscale
  // ============================================================
  console.log('\n=== APPROCHE 3: PIXFLUX DIRECT 64 + UPSCALE ===');

  // Le s550 favori en 64x64 comme style reference
  const fav64B64 = fs.readFileSync(path.join(outputDir, 'fullbody_s550_64.png')).toString('base64');

  // Générer via Pixflux avec des descriptions très précises
  const directDescs = [
    {
      label: 'direct_a',
      desc: 'pixel art game character, burly strong adult man with brown hair, ' +
        'wearing white polo shirt and light blue jeans and brown shoes, ' +
        'standing idle facing camera, arms at sides, full body head to toes visible, ' +
        'retro game sprite style, single black outline, detailed shading',
      seed: 42
    },
    {
      label: 'direct_b',
      desc: 'pixel art RPG character sprite, muscular stocky man, short brown hair, tanned skin, ' +
        'white collared shirt tucked into blue denim jeans, brown leather boots, ' +
        'neutral standing pose facing south, full body from top of head to bottom of feet, ' +
        'clean pixel art outline, warm color palette',
      seed: 42
    },
    {
      label: 'direct_c',
      desc: 'pixel art character, petanque player, strong man 40 years old, ' +
        'white polo shirt, blue jeans, brown shoes, brown hair, tanned face, ' +
        'relaxed idle standing pose, arms down at sides, whole body visible head to feet, ' +
        'game sprite, dark outline, detailed pixel shading',
      seed: 100
    },
  ];

  for (const cfg of directDescs) {
    try {
      console.log(`  [${cfg.label}] Pixflux 64x64...`);
      const b64 = await callApi('/v1/generate-image-pixflux', {
        description: cfg.desc,
        image_size: { width: 64, height: 64 },
        no_background: true,
        text_guidance_scale: 8,
        view: 'low top-down',
        direction: 'south',
        outline: 'single color black outline',
        shading: 'detailed shading',
        seed: cfg.seed
      });
      const buf64 = Buffer.from(b64, 'base64');
      await sharp(buf64).png().toFile(path.join(outputDir, `${cfg.label}_64.png`));
      await sharp(buf64).resize(256, 256, { kernel: 'nearest' }).png()
        .toFile(path.join(outputDir, `${cfg.label}_256.png`));

      // Upscale via Bitforge 64->128
      console.log(`    Bitforge upscale 128...`);
      const up128Path = path.join(outputDir, `_temp_up_${cfg.label}.png`);
      await sharp(buf64).resize(128, 128, { kernel: 'nearest' }).png().toFile(up128Path);
      const upB64 = fs.readFileSync(up128Path).toString('base64');

      const b64up = await callApi('/v1/generate-image-bitforge', {
        description: cfg.desc,
        image_size: { width: 128, height: 128 },
        no_background: true,
        init_image: { base64: upB64, strength: 800 },
        text_guidance_scale: 5,
        seed: cfg.seed
      });
      const buf128 = Buffer.from(b64up, 'base64');
      await sharp(buf128).png().toFile(path.join(outputDir, `${cfg.label}_upscaled_128.png`));
      await sharp(buf128).resize(256, 256, { kernel: 'nearest' }).png()
        .toFile(path.join(outputDir, `${cfg.label}_upscaled_256.png`));
      await sharp(buf128).resize(512, 512, { kernel: 'nearest' }).png()
        .toFile(path.join(outputDir, `${cfg.label}_upscaled_512.png`));

      try { fs.unlinkSync(up128Path); } catch (e) {}
      console.log(`    OK`);
    } catch (err) {
      console.error(`    ERREUR: ${err.message.substring(0, 100)}`);
    }
  }

  // === PLANCHE FINALE ===
  console.log('\nPlanche finale de toutes les approches...');
  const allResults = fs.readdirSync(outputDir)
    .filter(f => (f.startsWith('final_ultraclean') || f.startsWith('frank_harmonized') || f.includes('_upscaled_'))
      && f.endsWith('_256.png'))
    .sort()
    .map(f => path.join(outputDir, f));

  // Ajouter le clean de base
  allResults.unshift(path.join(outputDir, 'final_clean_256.png'));

  if (allResults.length > 0) {
    const cell = 256, gap = 6, cols = 4;
    const rows = Math.ceil(allResults.length / cols);
    await sharp({
      create: {
        width: cols * (cell + gap) - gap,
        height: rows * (cell + gap) - gap,
        channels: 4,
        background: { r: 40, g: 40, b: 40, alpha: 255 }
      }
    }).composite(allResults.map((p, i) => ({
      input: p,
      left: (i % cols) * (cell + gap),
      top: Math.floor(i / cols) * (cell + gap)
    }))).png().toFile(path.join(outputDir, 'PLANCHE_FINALE.png'));
  }

  // Nettoyage temp
  const temps = fs.readdirSync(outputDir).filter(f => f.startsWith('_'));
  for (const t of temps) {
    try { fs.unlinkSync(path.join(outputDir, t)); } catch (e) {}
  }

  console.log('\n' + '='.repeat(60));
  console.log('TOUTES LES APPROCHES TERMINÉES');
  console.log('='.repeat(60));
  console.log(`\nDossier: ${outputDir}/`);
  console.log('Ouvre PLANCHE_FINALE.png pour tout comparer !');
  console.log('\nLégende:');
  console.log('  final_clean = nettoyé sans artefact');
  console.log('  final_ultraclean_s850/900 = Bitforge lissé (approche 1)');
  console.log('  frank_harmonized_* = greffes Frankenstein (approche 2)');
  console.log('  direct_*_upscaled = Pixflux from scratch + upscale (approche 3)');
}

main().catch(err => { console.error('Erreur:', err.message); process.exit(1); });
