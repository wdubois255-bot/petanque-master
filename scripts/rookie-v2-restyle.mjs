#!/usr/bin/env node
/**
 * rookie-v2-restyle.mjs v4
 * Génère PLUSIEURS variantes du Rookie depuis le mirror de Ley
 * Cheveux de Ley = bruns (warm hue 10-30), Chemise = bleu (hue 200-240)
 *
 * Variantes:
 *  A-D : différentes couleurs d'yeux (noisette, vert, bleu-gris, brun)
 *  1-3 : différents contrastes (normal, doux, punchy)
 *  Chemise toujours blanche, cheveux gardés bruns (légèrement foncés)
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const outputDir = 'AssetPetanqueMasterFinal/sprites/personnages/rookie_v2';
fs.mkdirSync(outputDir, { recursive: true });

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
function isLeyBlue(r, g, b, a) {
  if (a < 128) return false;
  const [h, s] = rgbToHsl(r, g, b);
  return h > 195 && h < 245 && s > 0.1 && b > r;
}

// Remap une couleur source vers une couleur cible en gardant la luminosité relative
function remapColor(r, g, b, targetLight, targetMid, targetDark, targetDeep) {
  const [, , l] = rgbToHsl(r, g, b);
  if (l > 0.6) return targetLight;
  if (l > 0.42) return targetMid;
  if (l > 0.25) return targetDark;
  return targetDeep;
}

async function main() {
  console.log('='.repeat(60));
  console.log('ROOKIE V2 - Multi-variantes');
  console.log('='.repeat(60));

  // --- Mirror de Ley ---
  const leyAnimPath = 'public/assets/sprites/ley_animated.png';
  const frame0Path = path.join(outputDir, '_temp_frame0.png');
  await sharp(leyAnimPath)
    .extract({ left: 0, top: 0, width: 128, height: 128 })
    .png().toFile(frame0Path);

  const orig = await loadPixels(frame0Path);
  const mirror = cloneImg(orig);

  let totalX = 0, totalCount = 0;
  for (let y = 0; y < orig.height; y++) {
    for (let x = 0; x < orig.width; x++) {
      const [, , , a] = getPixel(orig, x, y);
      if (a > 128) { totalX += x; totalCount++; }
    }
  }
  const cx = Math.round(totalX / totalCount);

  let torsoRX = cx;
  for (let x = cx; x < orig.width; x++) {
    let cnt = 0;
    for (let y = 20; y < 110; y++) { if (getPixel(orig, x, y)[3] > 128) cnt++; }
    if (cnt > 40) torsoRX = x;
    else if (cnt < 10 && x > cx + 5) break;
  }

  let armMaxX = 0, armMinY = 999, armMaxY = 0;
  for (let y = 30; y < 90; y++) {
    for (let x = cx + 10; x < orig.width; x++) {
      if (getPixel(orig, x, y)[3] > 128) {
        armMaxX = Math.max(armMaxX, x);
        armMinY = Math.min(armMinY, y);
        armMaxY = Math.max(armMaxY, y);
      }
    }
  }

  for (let y = armMinY - 5; y <= armMaxY + 5; y++) {
    for (let x = torsoRX + 1; x <= armMaxX + 5; x++) {
      const mx = 2 * cx - x;
      const [r, g, b, a] = getPixel(orig, mx, y);
      if (a > 50) setPixel(mirror, x, y, r, g, b, a);
      else setPixel(mirror, x, y, 0, 0, 0, 0);
    }
  }

  // Sauver mirror
  await saveImg(mirror, path.join(outputDir, '_base_mirror_128.png'));
  await saveImg(mirror, path.join(outputDir, '_base_mirror_256.png'), 2);
  await saveImg(orig, path.join(outputDir, '_original_256.png'), 2);
  console.log('Mirror OK');

  // --- Détecter les yeux ---
  const W = mirror.width, H = mirror.height;
  const eyePixels = [];
  for (let y = 22; y <= 36; y++) {
    for (let x = cx - 18; x <= cx + 12; x++) {
      const [r, g, b, a] = getPixel(mirror, x, y);
      if (a < 128) continue;
      const [, , l] = rgbToHsl(r, g, b);
      if (l < 0.25) {
        let skinN = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy) continue;
            const [nr, ng, nb, na] = getPixel(mirror, x + dx, y + dy);
            if (na > 128 && isSkinColor(nr, ng, nb)) skinN++;
          }
        }
        if (skinN >= 3) eyePixels.push({ x, y });
      }
    }
  }
  console.log(`Yeux: ${eyePixels.length} pixels`);

  // --- Palettes de variantes ---
  const eyeColors = {
    noisette:  [135, 90, 45],     // brun noisette naturel
    vert:      [65, 120, 55],     // vert olive
    bleuGris:  [85, 115, 140],    // bleu-gris doux
    brun:      [75, 50, 30],      // brun foncé classique
  };

  const shirtPalettes = {
    blanc: {
      light: [248, 245, 240],
      mid:   [225, 220, 213],
      dark:  [195, 190, 183],
      deep:  [162, 157, 152],
    },
    creme: {
      light: [248, 242, 228],
      mid:   [230, 222, 205],
      dark:  [200, 192, 175],
      deep:  [168, 160, 145],
    },
    grisPerle: {
      light: [235, 235, 238],
      mid:   [210, 210, 215],
      dark:  [180, 180, 188],
      deep:  [150, 150, 158],
    },
  };

  const contrastModes = {
    normal:  { skin: 1.0, outline: 1.0 },
    doux:    { skin: 1.08, outline: 0.9 },   // peau plus claire, outline plus douce
    punchy:  { skin: 0.92, outline: 1.15 },  // plus contrasté
  };

  // Générer toutes les combinaisons intéressantes
  const variants = [
    { name: 'A1_blanc_noisette',      shirt: 'blanc',     eye: 'noisette',  contrast: 'normal' },
    { name: 'A2_blanc_vert',          shirt: 'blanc',     eye: 'vert',      contrast: 'normal' },
    { name: 'A3_blanc_bleuGris',      shirt: 'blanc',     eye: 'bleuGris',  contrast: 'normal' },
    { name: 'A4_blanc_brun',          shirt: 'blanc',     eye: 'brun',      contrast: 'normal' },
    { name: 'B1_creme_noisette',      shirt: 'creme',     eye: 'noisette',  contrast: 'normal' },
    { name: 'B2_creme_vert',          shirt: 'creme',     eye: 'vert',      contrast: 'doux' },
    { name: 'C1_gris_bleuGris',       shirt: 'grisPerle', eye: 'bleuGris',  contrast: 'normal' },
    { name: 'C2_gris_noisette',       shirt: 'grisPerle', eye: 'noisette',  contrast: 'punchy' },
    { name: 'D1_blanc_noisette_doux', shirt: 'blanc',     eye: 'noisette',  contrast: 'doux' },
    { name: 'D2_blanc_vert_punchy',   shirt: 'blanc',     eye: 'vert',      contrast: 'punchy' },
  ];

  const resultPreviews = [];

  for (const v of variants) {
    console.log(`\n[${v.name}]`);
    const styled = cloneImg(mirror);
    const sp = shirtPalettes[v.shirt];
    const eyeCol = eyeColors[v.eye];
    const cm = contrastModes[v.contrast];

    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const [r, g, b, a] = getPixel(mirror, x, y);
        if (a < 50) continue;
        const [h, s, l] = rgbToHsl(r, g, b);

        // Yeux
        if (eyePixels.some(e => e.x === x && e.y === y)) {
          setPixel(styled, x, y, eyeCol[0], eyeCol[1], eyeCol[2], a);
          continue;
        }

        // Outline: ajuster contraste
        if (l < 0.12) {
          if (cm.outline !== 1.0) {
            const nl = Math.max(0, Math.min(0.11, l * cm.outline));
            const v = Math.round(nl * 255);
            setPixel(styled, x, y, v, v, v, a);
          }
          continue;
        }

        // Peau: ajuster luminosité selon contraste
        if (isSkinColor(r, g, b)) {
          if (cm.skin !== 1.0) {
            setPixel(styled, x, y,
              Math.min(255, Math.round(r * cm.skin)),
              Math.min(255, Math.round(g * cm.skin)),
              Math.min(255, Math.round(b * cm.skin)), a);
          }
          continue;
        }

        // Chemise bleue -> palette choisie
        if (isLeyBlue(r, g, b, a)) {
          const c = remapColor(r, g, b, sp.light, sp.mid, sp.dark, sp.deep);
          setPixel(styled, x, y, c[0], c[1], c[2], a);
          continue;
        }

        // Cheveux bruns: on les garde mais on les fonce légèrement
        // Les cheveux sont les pixels warm (hue 5-35) non-peau dans la zone haute
        if (y < 50 && h > 5 && h < 40 && s > 0.05 && l > 0.12 && l < 0.55 && !isSkinColor(r, g, b)) {
          // Foncer de 15%
          setPixel(styled, x, y,
            Math.max(0, Math.round(r * 0.85)),
            Math.max(0, Math.round(g * 0.85)),
            Math.max(0, Math.round(b * 0.85)), a);
        }
      }
    }

    // Sauver
    const p256 = path.join(outputDir, `${v.name}_256.png`);
    await saveImg(styled, path.join(outputDir, `${v.name}_128.png`));
    await saveImg(styled, p256, 2);
    await sharp(styled.data, { raw: { width: W, height: H, channels: 4 } })
      .resize(64, 64, { kernel: 'nearest' }).png()
      .toFile(path.join(outputDir, `${v.name}_64.png`));
    resultPreviews.push(p256);
    console.log('  OK');
  }

  // --- Planche comparative ---
  console.log('\nPlanche comparative...');
  const cell = 256, gap = 6, cols = 4;
  // Ajouter original et mirror en début
  const allItems = [
    path.join(outputDir, '_original_256.png'),
    path.join(outputDir, '_base_mirror_256.png'),
    ...resultPreviews
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
  }).composite(composites).png().toFile(path.join(outputDir, 'planche_variantes.png'));

  try { fs.unlinkSync(frame0Path); } catch (e) {}

  console.log('\n' + '='.repeat(60));
  console.log(`TERMINÉ - ${variants.length} variantes`);
  console.log('='.repeat(60));
  console.log(`\nDossier: ${outputDir}/`);
  console.log('Ouvre planche_variantes.png pour comparer !');
  console.log('\nLégende planche:');
  console.log('  Ligne 1: Ley original | Mirror | Blanc+noisette | Blanc+vert');
  console.log('  Ligne 2: Blanc+bleuGris | Blanc+brun | Crème+noisette | Crème+vert doux');
  console.log('  Ligne 3: GrisPerle+bleuGris | GrisPerle+noisette punchy | Blanc+noisette doux | Blanc+vert punchy');
}

main().catch(err => { console.error('Erreur:', err.message); process.exit(1); });
