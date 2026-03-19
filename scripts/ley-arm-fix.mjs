#!/usr/bin/env node
/**
 * ley-arm-fix.mjs
 * Tente de modifier la pose du bras étendu de Ley par manipulation de pixels
 *
 * Approches:
 *  1. Mirror: copier le côté gauche (bras baissé) sur le côté droit
 *  2. Erase+Inpaint: effacer le bras tendu et remplir avec la couleur du fond/corps
 *  3. Crop+Shift: détecter le bras et le décaler vers le bas
 *  4. Hybrid: combiner mirror partiel + nettoyage
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

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

function copyPixel(src, sx, sy, dst, dx, dy) {
  const [r, g, b, a] = getPixel(src, sx, sy);
  setPixel(dst, dx, dy, r, g, b, a);
}

function cloneImg(img) {
  return { data: Buffer.from(img.data), width: img.width, height: img.height, channels: 4 };
}

async function saveImg(img, filePath, scale = 1) {
  let buf = sharp(img.data, { raw: { width: img.width, height: img.height, channels: 4 } });
  if (scale > 1) buf = buf.resize(img.width * scale, img.height * scale, { kernel: 'nearest' });
  await buf.png().toFile(filePath);
}

// Détecte si un pixel est "peau" (ton chaud)
function isSkin(r, g, b, a) {
  if (a < 128) return false;
  return r > 150 && g > 100 && b < g && (r - b) > 40;
}

// Détecte si un pixel est "chemise bleue"
function isShirt(r, g, b, a) {
  if (a < 128) return false;
  return b > r && b > 80 && (b - r) > 10;
}

// Détecte si un pixel est sombre (pantalon, outline)
function isDark(r, g, b, a) {
  if (a < 128) return false;
  return r < 80 && g < 80 && b < 80;
}

async function main() {
  const outputDir = 'comparison/ley_arm_fix';
  fs.mkdirSync(outputDir, { recursive: true });

  console.log('='.repeat(60));
  console.log('LEY ARM FIX - Manipulation pixels pour reposer le bras');
  console.log('='.repeat(60));

  // Travailler sur la version 128x128 (plus de détails)
  const leyAnimPath = 'public/assets/sprites/ley_animated.png';

  // Extraire frame 0 (sud, frame 1 de marche) en 128x128
  const frame0Path = path.join(outputDir, 'frame0_128.png');
  await sharp(leyAnimPath)
    .extract({ left: 0, top: 0, width: 128, height: 128 })
    .png().toFile(frame0Path);

  const orig = await loadPixels(frame0Path);
  console.log(`Frame 0: ${orig.width}x${orig.height}`);

  // Sauver original pour référence
  await saveImg(orig, path.join(outputDir, '0_original_256.png'), 2);

  // === ANALYSE: trouver les limites du bras étendu ===
  console.log('\n--- Analyse du bras étendu ---');

  // Le bras s'étend vers la droite. Cherchons la zone bras.
  // Scannons chaque ligne pour trouver le pixel opaque le plus à droite
  let armZone = { minX: 999, maxX: 0, minY: 999, maxY: 0 };
  const centerX = Math.floor(orig.width / 2);

  // Le bras tendu est à droite du centre, environ entre y=40 et y=80 sur 128px
  for (let y = 30; y < 90; y++) {
    for (let x = centerX + 10; x < orig.width; x++) {
      const [r, g, b, a] = getPixel(orig, x, y);
      if (a > 128 && (isSkin(r, g, b, a) || isShirt(r, g, b, a))) {
        if (x > armZone.maxX) armZone.maxX = x;
        if (x < armZone.minX) armZone.minX = x;
        if (y < armZone.minY) armZone.minY = y;
        if (y > armZone.maxY) armZone.maxY = y;
      }
    }
  }
  console.log(`  Zone bras détectée: x=${armZone.minX}-${armZone.maxX}, y=${armZone.minY}-${armZone.maxY}`);

  // Trouver aussi le bord droit du torse (sans le bras)
  // = la colonne la plus à droite qui a des pixels sur une grande hauteur continue
  let torsoRightX = centerX;
  for (let x = centerX; x < orig.width; x++) {
    let opaqueCount = 0;
    for (let y = 20; y < 110; y++) {
      const [, , , a] = getPixel(orig, x, y);
      if (a > 128) opaqueCount++;
    }
    if (opaqueCount > 40) torsoRightX = x;
    else if (opaqueCount < 10 && x > centerX + 5) break;
  }
  console.log(`  Bord droit torse estimé: x=${torsoRightX}`);

  // ============================================
  // APPROCHE 1: MIRROR HORIZONTAL PARTIEL
  // Copier le côté gauche (miroir) sur la zone du bras droit
  // ============================================
  console.log('\n[1] Mirror horizontal partiel');
  const mirror = cloneImg(orig);

  // Trouver le centre du personnage (axe de symétrie)
  let totalX = 0, totalCount = 0;
  for (let y = 0; y < orig.height; y++) {
    for (let x = 0; x < orig.width; x++) {
      const [, , , a] = getPixel(orig, x, y);
      if (a > 128) { totalX += x; totalCount++; }
    }
  }
  const charCenterX = Math.round(totalX / totalCount);
  console.log(`  Centre personnage: x=${charCenterX}`);

  // Mirror: pour chaque pixel à droite du centre+marge, copier le symétrique gauche
  // Seulement dans la zone du bras (y=35 à y=85)
  for (let y = armZone.minY - 5; y <= armZone.maxY + 5; y++) {
    for (let x = torsoRightX + 1; x <= armZone.maxX + 5; x++) {
      const mirrorX = 2 * charCenterX - x;
      const [r, g, b, a] = getPixel(orig, mirrorX, y);
      if (a > 50) {
        setPixel(mirror, x, y, r, g, b, a);
      } else {
        setPixel(mirror, x, y, 0, 0, 0, 0); // effacer si rien en miroir
      }
    }
  }
  await saveImg(mirror, path.join(outputDir, '1_mirror_256.png'), 2);
  await saveImg(mirror, path.join(outputDir, '1_mirror_128.png'), 1);
  console.log('  -> OK');

  // ============================================
  // APPROCHE 2: ERASE le bras + remplir outline
  // Effacer tout ce qui dépasse du torse à droite dans la zone bras
  // ============================================
  console.log('\n[2] Erase bras étendu');
  const erased = cloneImg(orig);

  // Zone d'effacement: à droite du torse, dans la zone verticale du bras
  const eraseFromX = torsoRightX + 2;
  for (let y = armZone.minY - 3; y <= armZone.maxY + 3; y++) {
    for (let x = eraseFromX; x < orig.width; x++) {
      setPixel(erased, x, y, 0, 0, 0, 0);
    }
  }

  // Ajouter une outline sombre sur le nouveau bord droit
  for (let y = armZone.minY - 3; y <= armZone.maxY + 3; y++) {
    // Trouver le pixel opaque le plus à droite sur cette ligne
    let lastOpaque = -1;
    for (let x = 0; x < orig.width; x++) {
      const [, , , a] = getPixel(erased, x, y);
      if (a > 128) lastOpaque = x;
    }
    if (lastOpaque > 0 && lastOpaque < orig.width - 1) {
      // Vérifier si le pixel suivant est transparent -> ajouter outline
      const [, , , aNext] = getPixel(erased, lastOpaque + 1, y);
      if (aNext < 50) {
        setPixel(erased, lastOpaque, y, 58, 46, 40, 255); // outline marron chaud #3A2E28
      }
    }
  }
  await saveImg(erased, path.join(outputDir, '2_erased_256.png'), 2);
  await saveImg(erased, path.join(outputDir, '2_erased_128.png'), 1);
  console.log('  -> OK');

  // ============================================
  // APPROCHE 3: ERASE + dessiner un bras le long du corps
  // On efface le bras tendu puis on "peint" un bras qui pend
  // ============================================
  console.log('\n[3] Erase + dessiner bras pendant');
  const repaint = cloneImg(erased); // partir de la version effacée

  // Trouver les couleurs de peau et chemise du personnage
  let skinColors = [];
  let shirtColors = [];
  for (let y = 30; y < 90; y++) {
    for (let x = 10; x < torsoRightX; x++) {
      const [r, g, b, a] = getPixel(orig, x, y);
      if (isSkin(r, g, b, a)) skinColors.push([r, g, b]);
      if (isShirt(r, g, b, a)) shirtColors.push([r, g, b]);
    }
  }

  // Couleurs moyennes
  const avgSkin = skinColors.length > 0
    ? skinColors.reduce((acc, c) => [acc[0] + c[0], acc[1] + c[1], acc[2] + c[2]], [0, 0, 0]).map(v => Math.round(v / skinColors.length))
    : [200, 170, 140];
  const avgShirt = shirtColors.length > 0
    ? shirtColors.reduce((acc, c) => [acc[0] + c[0], acc[1] + c[1], acc[2] + c[2]], [0, 0, 0]).map(v => Math.round(v / shirtColors.length))
    : [100, 120, 160];

  console.log(`  Peau moyenne: rgb(${avgSkin})`);
  console.log(`  Chemise moyenne: rgb(${avgShirt})`);

  // Dessiner un avant-bras qui pend le long du corps côté droit
  // Le bras part de l'épaule droite et descend verticalement
  const shoulderX = torsoRightX - 2;
  const shoulderY = armZone.minY + 5;
  const armLength = 25; // pixels de long
  const armWidth = 5;   // pixels de large

  // D'abord le bras (chemise courte = haut en chemise, bas en peau)
  for (let dy = 0; dy < armLength; dy++) {
    const y = shoulderY + dy;
    const isLowerArm = dy > armLength * 0.4; // 40% bas = avant-bras (peau)
    const color = isLowerArm ? avgSkin : avgShirt;
    const darkColor = color.map(c => Math.max(0, c - 30)); // ombre
    const lightColor = color.map(c => Math.min(255, c + 20)); // lumière

    for (let dx = 0; dx < armWidth; dx++) {
      const x = shoulderX + dx - 1;
      let c;
      if (dx === 0 || dx === armWidth - 1) {
        c = [58, 46, 40]; // outline
      } else if (dx === 1) {
        c = darkColor; // ombre côté gauche
      } else if (dx === armWidth - 2) {
        c = lightColor; // lumière côté droit
      } else {
        c = color;
      }
      setPixel(repaint, x, y, c[0], c[1], c[2], 255);
    }
  }

  // Main au bout du bras
  const handY = shoulderY + armLength;
  const handColor = avgSkin.map(c => Math.min(255, c + 10));
  for (let dy = 0; dy < 5; dy++) {
    for (let dx = 0; dx < armWidth + 1; dx++) {
      const x = shoulderX + dx - 1;
      const y = handY + dy;
      if (dy === 0 || dy === 4 || dx === 0 || dx === armWidth) {
        setPixel(repaint, x, y, 58, 46, 40, 255); // outline
      } else {
        setPixel(repaint, x, y, handColor[0], handColor[1], handColor[2], 255);
      }
    }
  }

  await saveImg(repaint, path.join(outputDir, '3_repaint_arm_256.png'), 2);
  await saveImg(repaint, path.join(outputDir, '3_repaint_arm_128.png'), 1);
  console.log('  -> OK');

  // ============================================
  // APPROCHE 4: FULL MIRROR (flip horizontal complet)
  // Si le côté gauche a une meilleure pose, on flip tout
  // ============================================
  console.log('\n[4] Full horizontal flip');
  const flipped = cloneImg(orig);
  for (let y = 0; y < orig.height; y++) {
    for (let x = 0; x < orig.width; x++) {
      const [r, g, b, a] = getPixel(orig, orig.width - 1 - x, y);
      setPixel(flipped, x, y, r, g, b, a);
    }
  }
  await saveImg(flipped, path.join(outputDir, '4_flipped_256.png'), 2);
  console.log('  -> OK');

  // ============================================
  // APPROCHE 5: COMBO - Flip + erase bras (le bras est maintenant à gauche)
  // ============================================
  console.log('\n[5] Flip + erase bras gauche');
  const flipErased = cloneImg(flipped);
  // Après flip, le bras tendu est maintenant à GAUCHE
  const eraseToX = orig.width - torsoRightX - 2;
  for (let y = armZone.minY - 3; y <= armZone.maxY + 3; y++) {
    for (let x = 0; x < eraseToX; x++) {
      setPixel(flipErased, x, y, 0, 0, 0, 0);
    }
  }
  // Outline sur le nouveau bord gauche
  for (let y = armZone.minY - 3; y <= armZone.maxY + 3; y++) {
    for (let x = 0; x < orig.width; x++) {
      const [, , , a] = getPixel(flipErased, x, y);
      if (a > 128) {
        if (x > 0) {
          const [, , , aPrev] = getPixel(flipErased, x - 1, y);
          if (aPrev < 50) setPixel(flipErased, x, y, 58, 46, 40, 255);
        }
        break;
      }
    }
  }
  await saveImg(flipErased, path.join(outputDir, '5_flip_erased_256.png'), 2);
  console.log('  -> OK');

  // ============================================
  // APPROCHE 6: VERSION 64x64 pour taille jeu
  // Downscale les meilleurs résultats
  // ============================================
  console.log('\n[6] Versions 64x64 pour le jeu');
  for (const name of ['1_mirror', '2_erased', '3_repaint_arm']) {
    const src = path.join(outputDir, `${name}_128.png`);
    if (fs.existsSync(src)) {
      await sharp(src).resize(64, 64, { kernel: 'nearest' }).png()
        .toFile(path.join(outputDir, `${name}_64.png`));
    }
  }
  console.log('  -> OK');

  // ============================================
  // PLANCHE FINALE
  // ============================================
  console.log('\n[7] Planche comparative');
  const items = [
    path.join(outputDir, '0_original_256.png'),
    path.join(outputDir, '1_mirror_256.png'),
    path.join(outputDir, '2_erased_256.png'),
    path.join(outputDir, '3_repaint_arm_256.png'),
    path.join(outputDir, '4_flipped_256.png'),
    path.join(outputDir, '5_flip_erased_256.png'),
  ].filter(p => fs.existsSync(p));

  const cell = 256, gap = 6, cols = 3;
  const rows = Math.ceil(items.length / cols);
  const composites = items.map((p, i) => ({
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
  }).composite(composites).png().toFile(path.join(outputDir, 'planche_arm_fix.png'));

  console.log('\n' + '='.repeat(60));
  console.log('TERMINÉ');
  console.log('='.repeat(60));
  console.log(`\nFichiers dans: ${outputDir}/`);
  console.log('Ouvre planche_arm_fix.png pour la comparaison !');
  console.log('\nLégende:');
  console.log('  Haut: Original | Mirror partiel | Bras effacé');
  console.log('  Bas:  Bras redessiné | Flip complet | Flip + erase');
}

main().catch(err => { console.error('Erreur:', err.message); process.exit(1); });
