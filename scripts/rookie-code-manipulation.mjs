#!/usr/bin/env node
/**
 * rookie-code-manipulation.mjs
 * Test de manipulation pure code : prendre Ley et créer un "jeune" version
 * via palette swap, proportions, etc. - sans API externe
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function main() {
  const outputDir = 'comparison/rookie_code_manip';
  fs.mkdirSync(outputDir, { recursive: true });

  console.log('='.repeat(60));
  console.log('ROOKIE CODE MANIPULATION - Dérivés de Ley par code');
  console.log('='.repeat(60));

  const leyPath = 'AssetPetanqueMasterFinal/sprites/personnages/ley.png';
  const leyAnimPath = 'public/assets/sprites/ley_animated.png';

  // 1. Palette swap : changer les couleurs de Ley pour un look plus jeune
  console.log('\n[1] Palette swap - Ley avec couleurs Rookie');
  const leyBuf = await sharp(leyPath).raw().toBuffer({ resolveWithObject: true });
  const { data, info } = leyBuf;

  // Analyser la palette de Ley
  const palette = {};
  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const a = info.channels === 4 ? data[i + 3] : 255;
    if (a > 0) {
      const key = `${r},${g},${b}`;
      palette[key] = (palette[key] || 0) + 1;
    }
  }
  const sortedColors = Object.entries(palette).sort((a, b) => b[1] - a[1]);
  console.log('  Top 10 couleurs Ley:');
  sortedColors.slice(0, 10).forEach(([c, count]) => {
    console.log(`    rgb(${c}) x${count}`);
  });

  // Palette swap: bleu foncé de Ley -> bleu clair Rookie
  // Gris foncé pantalon -> beige short
  const swapBuf = Buffer.from(data);
  for (let i = 0; i < swapBuf.length; i += info.channels) {
    const r = swapBuf[i], g = swapBuf[i + 1], b = swapBuf[i + 2];
    const a = info.channels === 4 ? swapBuf[i + 3] : 255;
    if (a === 0) continue;

    // Bleus du polo (range large) -> bleu plus clair
    if (b > r && b > g && b > 80) {
      swapBuf[i] = Math.min(255, r + 40);       // R + 40
      swapBuf[i + 1] = Math.min(255, g + 30);   // G + 30
      swapBuf[i + 2] = Math.min(255, b + 20);   // B + 20
    }
    // Gris foncé pantalon -> beige
    else if (r < 100 && g < 100 && b < 100 && r > 30) {
      swapBuf[i] = Math.min(255, r + 100);      // -> beige
      swapBuf[i + 1] = Math.min(255, g + 80);
      swapBuf[i + 2] = Math.min(255, b + 40);
    }
  }

  const swapPath = path.join(outputDir, '1_palette_swap_256.png');
  await sharp(swapBuf, { raw: { width: info.width, height: info.height, channels: info.channels } })
    .resize(256, 256, { kernel: 'nearest' })
    .png().toFile(swapPath);
  console.log(`  -> ${swapPath}`);

  // 2. Brighten + saturate (look plus jeune/frais)
  console.log('\n[2] Brighten + Saturate Ley');
  const brightPath = path.join(outputDir, '2_bright_saturate_256.png');
  await sharp(leyPath)
    .modulate({ brightness: 1.15, saturation: 1.3 })
    .resize(256, 256, { kernel: 'nearest' })
    .png().toFile(brightPath);
  console.log(`  -> ${brightPath}`);

  // 3. Extraction d'un frame de ley_animated (face sud, idle)
  console.log('\n[3] Extraction frames Ley animated');
  const animMeta = await sharp(leyAnimPath).metadata();
  console.log(`  Spritesheet: ${animMeta.width}x${animMeta.height}`);
  const frameW = 128, frameH = 128;

  // Extraire les 4 premières frames (direction sud)
  for (let col = 0; col < 4; col++) {
    const framePath = path.join(outputDir, `3_ley_frame_row0_col${col}_256.png`);
    await sharp(leyAnimPath)
      .extract({ left: col * frameW, top: 0, width: frameW, height: frameH })
      .resize(256, 256, { kernel: 'nearest' })
      .png().toFile(framePath);
  }
  console.log(`  -> 4 frames extraits`);

  // 4. Palette swap sur frame animé
  console.log('\n[4] Palette swap sur frame animé');
  const frame0Buf = await sharp(leyAnimPath)
    .extract({ left: 0, top: 0, width: frameW, height: frameH })
    .raw().toBuffer({ resolveWithObject: true });

  const swapAnimBuf = Buffer.from(frame0Buf.data);
  const fi = frame0Buf.info;
  for (let i = 0; i < swapAnimBuf.length; i += fi.channels) {
    const r = swapAnimBuf[i], g = swapAnimBuf[i + 1], b = swapAnimBuf[i + 2];
    const a = fi.channels === 4 ? swapAnimBuf[i + 3] : 255;
    if (a === 0) continue;

    // Bleu polo -> bleu ciel plus clair
    if (b > r + 10 && b > g && b > 100) {
      swapAnimBuf[i] = Math.min(255, r + 50);
      swapAnimBuf[i + 1] = Math.min(255, g + 50);
      swapAnimBuf[i + 2] = Math.min(255, b + 20);
    }
    // Gris/sombre pantalon -> short beige
    else if (r < 110 && g < 110 && b < 110 && r > 40 && (r - b < 30)) {
      swapAnimBuf[i] = Math.min(255, r + 90);
      swapAnimBuf[i + 1] = Math.min(255, g + 70);
      swapAnimBuf[i + 2] = Math.min(255, b + 30);
    }
  }

  const swapAnimPath = path.join(outputDir, '4_palette_swap_anim_256.png');
  await sharp(swapAnimBuf, { raw: { width: fi.width, height: fi.height, channels: fi.channels } })
    .resize(256, 256, { kernel: 'nearest' })
    .png().toFile(swapAnimPath);
  console.log(`  -> ${swapAnimPath}`);

  // 5. Hue rotate (changement global de teinte)
  console.log('\n[5] Hue rotate variations');
  for (const hue of [30, 60, 120, 180]) {
    const huePath = path.join(outputDir, `5_hue${hue}_256.png`);
    await sharp(leyPath)
      .modulate({ hue })
      .resize(256, 256, { kernel: 'nearest' })
      .png().toFile(huePath);
    console.log(`  -> hue +${hue}: ${huePath}`);
  }

  // 6. Planche comparative
  console.log('\n[6] Planche comparative');
  const items = [
    path.join(outputDir, '1_palette_swap_256.png'),
    path.join(outputDir, '2_bright_saturate_256.png'),
    path.join(outputDir, '4_palette_swap_anim_256.png'),
    path.join(outputDir, '5_hue30_256.png'),
    path.join(outputDir, '5_hue60_256.png'),
    path.join(outputDir, '5_hue120_256.png'),
  ];

  const cell = 256, gap = 6, cols = 3;
  const rows = Math.ceil(items.length / cols);
  const composites = items.map((p, i) => ({
    input: p,
    left: (i % cols) * (cell + gap),
    top: Math.floor(i / cols) * (cell + gap)
  }));

  const planchePath = path.join(outputDir, 'planche_code_manip.png');
  await sharp({
    create: {
      width: cols * (cell + gap) - gap,
      height: rows * (cell + gap) - gap,
      channels: 4,
      background: { r: 40, g: 40, b: 40, alpha: 255 }
    }
  }).composite(composites).png().toFile(planchePath);
  console.log(`  -> ${planchePath}`);

  console.log('\n' + '='.repeat(60));
  console.log('TERMINÉ - Manipulations code');
  console.log('='.repeat(60));
}

main().catch(err => { console.error('Erreur:', err.message); process.exit(1); });
