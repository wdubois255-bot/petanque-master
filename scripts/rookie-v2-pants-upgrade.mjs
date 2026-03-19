#!/usr/bin/env node
/**
 * rookie-v2-pants-upgrade.mjs
 * 1. Change le pantalon noir en plusieurs couleurs
 * 2. Utilise Bitforge pour améliorer la qualité (upscale+refine)
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
function cloneImg(img) {
  return { data: Buffer.from(img.data), width: img.width, height: img.height, channels: 4 };
}
async function saveImg(img, filePath, scale = 1) {
  let buf = sharp(img.data, { raw: { width: img.width, height: img.height, channels: 4 } });
  if (scale > 1) buf = buf.resize(img.width * scale, img.height * scale, { kernel: 'nearest' });
  await buf.png().toFile(filePath);
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

function isSkinColor(r, g, b) {
  return r > 140 && g > 85 && b < g + 20 && (r - b) > 25 && r > g;
}

async function main() {
  console.log('='.repeat(60));
  console.log('ROOKIE V2 - Pantalon + Upgrade qualité');
  console.log('='.repeat(60));

  const base = await loadPixels(path.join(outputDir, 'base_128.png'));
  const W = base.width, H = base.height;

  // --- Identifier les pixels du pantalon ---
  // Le pantalon est dans la moitié basse (y > 70), sombre (l < 0.35), pas outline (l > 0.08), pas peau
  console.log('\nDétection pantalon...');
  const pantsMask = new Uint8Array(W * H);
  let pantsCount = 0;

  for (let y = 65; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const [r, g, b, a] = getPixel(base, x, y);
      if (a < 128) continue;
      const [h, s, l] = rgbToHsl(r, g, b);
      if (l >= 0.08 && l < 0.42 && !isSkinColor(r, g, b) && s < 0.25) {
        pantsMask[y * W + x] = 1;
        pantsCount++;
      }
    }
  }

  // Inclure aussi les pixels sombres de la ceinture (y ~65-72)
  for (let y = 60; y < 72; y++) {
    for (let x = 0; x < W; x++) {
      const [r, g, b, a] = getPixel(base, x, y);
      if (a < 128) continue;
      const [h, s, l] = rgbToHsl(r, g, b);
      // Ceinture dorée: garder telle quelle (hue jaune/doré)
      if (h > 30 && h < 55 && s > 0.3) continue;
      if (l >= 0.08 && l < 0.38 && !isSkinColor(r, g, b) && s < 0.2) {
        pantsMask[y * W + x] = 1;
        pantsCount++;
      }
    }
  }
  console.log(`  ${pantsCount} pixels de pantalon détectés`);

  // --- Palettes de pantalon ---
  const pantsPalettes = {
    beige: {
      name: 'Beige chino',
      light: [215, 195, 165],
      mid:   [185, 165, 135],
      dark:  [150, 130, 105],
      deep:  [110, 95, 75],
    },
    jeanClair: {
      name: 'Jean clair',
      light: [155, 170, 195],
      mid:   [120, 135, 162],
      dark:  [88, 100, 128],
      deep:  [60, 70, 95],
    },
    kaki: {
      name: 'Kaki olive',
      light: [165, 170, 135],
      mid:   [130, 138, 105],
      dark:  [95, 102, 75],
      deep:  [65, 72, 50],
    },
    marineFonce: {
      name: 'Marine foncé',
      light: [85, 95, 120],
      mid:   [60, 68, 92],
      dark:  [42, 48, 68],
      deep:  [28, 32, 48],
    },
    grisChaud: {
      name: 'Gris chaud',
      light: [160, 152, 145],
      mid:   [125, 118, 112],
      dark:  [90, 85, 80],
      deep:  [58, 55, 52],
    },
  };

  const results = [];

  for (const [key, palette] of Object.entries(pantsPalettes)) {
    console.log(`\n[${key}] ${palette.name}`);
    const styled = cloneImg(base);

    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (!pantsMask[y * W + x]) continue;
        const [r, g, b, a] = getPixel(base, x, y);
        const [, , l] = rgbToHsl(r, g, b);

        let c;
        if (l > 0.32) c = palette.light;
        else if (l > 0.22) c = palette.mid;
        else if (l > 0.14) c = palette.dark;
        else c = palette.deep;

        setPixel(styled, x, y, c[0], c[1], c[2], a);
      }
    }

    await saveImg(styled, path.join(outputDir, `pants_${key}_128.png`));
    await saveImg(styled, path.join(outputDir, `pants_${key}_256.png`), 2);
    await sharp(styled.data, { raw: { width: W, height: H, channels: 4 } })
      .resize(64, 64, { kernel: 'nearest' }).png()
      .toFile(path.join(outputDir, `pants_${key}_64.png`));
    results.push(`pants_${key}_256.png`);
    console.log('  OK');
  }

  // --- Planche pantalons ---
  console.log('\nPlanche pantalons...');
  const cell = 256, gap = 6, cols = 3;
  const allItems = [
    path.join(outputDir, 'A1_blanc_noisette_256.png'), // original noir
    ...results.map(r => path.join(outputDir, r))
  ];
  const rows = Math.ceil(allItems.length / cols);
  const composites = allItems.map((p, i) => ({
    input: p,
    left: (i % cols) * (cell + gap),
    top: Math.floor(i / cols) * (cell + gap)
  }));

  await sharp({
    create: {
      width: cols * (cell + gap) - gap,
      height: rows * (cell + gap) - gap,
      channels: 4,
      background: { r: 40, g: 40, b: 40, alpha: 255 }
    }
  }).composite(composites).png().toFile(path.join(outputDir, 'planche_pantalons.png'));

  // --- UPGRADE QUALITÉ via Bitforge ---
  console.log('\n=== UPGRADE QUALITÉ BITFORGE ===');

  // On prend les 2 meilleurs pantalons + l'original et on les passe en Bitforge
  const toUpgrade = [
    { file: 'base_64.png', label: 'original_noir', desc: 'pixel art character, stocky man, white polo shirt, dark pants, brown hair, standing idle, warm skin, black outline, detailed shading' },
    { file: 'pants_beige_64.png', label: 'beige', desc: 'pixel art character, stocky man, white polo shirt, beige chino pants, brown hair, standing idle, warm skin, black outline, detailed shading' },
    { file: 'pants_jeanClair_64.png', label: 'jean', desc: 'pixel art character, stocky man, white polo shirt, light blue jeans, brown hair, standing idle, warm skin, black outline, detailed shading' },
    { file: 'pants_kaki_64.png', label: 'kaki', desc: 'pixel art character, stocky man, white polo shirt, olive khaki pants, brown hair, standing idle, warm skin, black outline, detailed shading' },
  ];

  for (const item of toUpgrade) {
    const inputPath = path.join(outputDir, item.file);
    if (!fs.existsSync(inputPath)) continue;

    console.log(`\n  Bitforge upgrade: ${item.label}`);

    // Upscale 64 -> 128 nearest neighbor
    const input128Path = path.join(outputDir, `_temp_up_${item.label}.png`);
    await sharp(inputPath).resize(128, 128, { kernel: 'nearest' }).png().toFile(input128Path);
    const inputB64 = fs.readFileSync(input128Path).toString('base64');

    for (const strength of [700, 500]) {
      try {
        const b64 = await callApi('/v1/generate-image-bitforge', {
          description: item.desc,
          image_size: { width: 128, height: 128 },
          no_background: true,
          init_image: { base64: inputB64, strength },
          text_guidance_scale: 6,
          seed: 42
        });

        const buf = Buffer.from(b64, 'base64');
        const outName = `upgrade_${item.label}_s${strength}`;
        await sharp(buf).png().toFile(path.join(outputDir, `${outName}_128.png`));
        await sharp(buf).resize(256, 256, { kernel: 'nearest' }).png()
          .toFile(path.join(outputDir, `${outName}_256.png`));
        await sharp(buf).resize(64, 64, { kernel: 'nearest' }).png()
          .toFile(path.join(outputDir, `${outName}_64.png`));
        console.log(`    s${strength} -> OK`);
      } catch (err) {
        console.error(`    s${strength} -> ERREUR: ${err.message.substring(0, 100)}`);
      }
    }

    try { fs.unlinkSync(input128Path); } catch (e) {}
  }

  // Planche upgrades
  console.log('\nPlanche upgrades...');
  const upgradeFiles = fs.readdirSync(outputDir)
    .filter(f => f.startsWith('upgrade_') && f.endsWith('_256.png'))
    .sort()
    .map(f => path.join(outputDir, f));

  if (upgradeFiles.length > 0) {
    const cols2 = 4;
    const rows2 = Math.ceil(upgradeFiles.length / cols2);
    const composites2 = upgradeFiles.map((p, i) => ({
      input: p,
      left: (i % cols2) * (cell + gap),
      top: Math.floor(i / cols2) * (cell + gap)
    }));
    await sharp({
      create: {
        width: cols2 * (cell + gap) - gap,
        height: rows2 * (cell + gap) - gap,
        channels: 4,
        background: { r: 40, g: 40, b: 40, alpha: 255 }
      }
    }).composite(composites2).png().toFile(path.join(outputDir, 'planche_upgrades.png'));
  }

  console.log('\n' + '='.repeat(60));
  console.log('TERMINÉ');
  console.log('='.repeat(60));
  console.log(`\nDossier: ${outputDir}/`);
  console.log('  planche_pantalons.png  - 5 couleurs de pantalon');
  console.log('  planche_upgrades.png   - versions Bitforge améliorées');
}

main().catch(err => { console.error('Erreur:', err.message); process.exit(1); });
