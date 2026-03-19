#!/usr/bin/env node
/**
 * rookie-v2-fullbody.mjs
 * Le sprite actuel est coupé aux cuisses.
 * On va:
 *   1. Nettoyer les artefacts dorés
 *   2. Décaler le perso vers le haut du canvas pour laisser de la place aux jambes
 *   3. Dessiner les jambes + pieds en code (jean + chaussures)
 *   4. Envoyer en Bitforge pour que l'IA complète proprement
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

async function saveImg(data, w, h, filePath, scale = 1) {
  let buf = sharp(data, { raw: { width: w, height: h, channels: 4 } });
  if (scale > 1) buf = buf.resize(w * scale, h * scale, { kernel: 'nearest' });
  await buf.png().toFile(filePath);
}

async function main() {
  console.log('='.repeat(60));
  console.log('ROOKIE V2 - Full body (tête aux pieds)');
  console.log('='.repeat(60));

  const src = await loadPixels(path.join(outputDir, 'rookie_base_128.png'));
  const W = 128, H = 128;

  // === 1. Nettoyer artefacts dorés ===
  console.log('\n[1] Nettoyage artefacts...');
  // Trouver le centre de masse du personnage
  let totalX = 0, totalY = 0, count = 0;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (getPixel(src, x, y)[3] > 128) { totalX += x; totalY += y; count++; }
    }
  }
  const comX = Math.round(totalX / count);
  const comY = Math.round(totalY / count);

  // Supprimer les pixels trop loin du centre de masse
  const cleaned = { data: Buffer.from(src.data), width: W, height: H, channels: 4 };
  let removed = 0;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const [r, g, b, a] = getPixel(cleaned, x, y);
      if (a < 50) continue;

      const dist = Math.sqrt((x - comX) ** 2 + (y - comY) ** 2);
      // Les artefacts dorés sont loin et jaunes
      const [h, s] = rgbToHsl(r, g, b);
      if ((h > 30 && h < 70 && s > 0.35) || dist > 60) {
        // Vérifier si c'est vraiment isolé
        let neighbors = 0;
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            if (!dx && !dy) continue;
            if (getPixel(cleaned, x + dx, y + dy)[3] > 128) neighbors++;
          }
        }
        if (neighbors < 8 || (h > 30 && h < 70 && s > 0.5)) {
          setPixel(cleaned, x, y, 0, 0, 0, 0);
          removed++;
        }
      }
    }
  }
  console.log(`  ${removed} artefacts supprimés`);

  // === 2. Réduire le sprite pour laisser place aux jambes ===
  // Actuellement le perso occupe tout le canvas 128x128, coupé aux cuisses
  // On va le réduire à ~70% et le placer en haut, laissant 30% en bas pour les jambes
  console.log('\n[2] Réduction + placement haut...');

  // D'abord sauver le nettoyé
  await saveImg(cleaned.data, W, H, path.join(outputDir, '_cleaned_128.png'));

  // Réduire à 90px de haut, positionner en y=5 dans un canvas 128x128
  // Ça laisse ~33px pour les jambes
  const reducedPath = path.join(outputDir, '_reduced.png');
  await sharp(cleaned.data, { raw: { width: W, height: H, channels: 4 } })
    .resize(100, 90, { kernel: 'nearest', fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png().toFile(reducedPath);

  // Créer nouveau canvas 128x128 et placer le perso en haut
  const canvas = Buffer.alloc(W * H * 4, 0);

  // Charger le réduit
  const reduced = await loadPixels(reducedPath);
  const offsetX = Math.floor((128 - reduced.width) / 2);
  const offsetY = 2;

  for (let y = 0; y < reduced.height; y++) {
    for (let x = 0; x < reduced.width; x++) {
      const [r, g, b, a] = getPixel(reduced, x, y);
      if (a > 50) {
        const dx = x + offsetX;
        const dy = y + offsetY;
        if (dx >= 0 && dx < 128 && dy >= 0 && dy < 128) {
          const i = (dy * 128 + dx) * 4;
          canvas[i] = r; canvas[i + 1] = g; canvas[i + 2] = b; canvas[i + 3] = a;
        }
      }
    }
  }

  // === 3. Dessiner les jambes en code ===
  console.log('\n[3] Dessin des jambes...');

  // Couleurs jean
  const jeanLight = [155, 170, 195];
  const jeanMid = [120, 135, 162];
  const jeanDark = [88, 100, 128];
  const jeanDeep = [60, 70, 95];
  const outline = [58, 46, 40];
  const shoeColor = [85, 65, 50];  // chaussures marron
  const shoeLight = [110, 85, 65];
  const shoeDark = [55, 42, 32];
  const soleColor = [45, 40, 38];

  // Trouver la base des cuisses (dernière ligne opaque)
  let legsStartY = 0;
  for (let y = 127; y >= 0; y--) {
    let opaqueInRow = 0;
    for (let x = 0; x < 128; x++) {
      const i = (y * 128 + x) * 4;
      if (canvas[i + 3] > 128) opaqueInRow++;
    }
    if (opaqueInRow > 15) {
      legsStartY = y;
      break;
    }
  }
  console.log(`  Base des cuisses: y=${legsStartY}`);

  // Trouver les bords gauche/droit à cette ligne
  let legLefts = [], legRights = [];
  for (let x = 0; x < 128; x++) {
    const i = (legsStartY * 128 + x) * 4;
    if (canvas[i + 3] > 128) {
      legLefts.push(x);
    }
  }

  const legLeft = Math.min(...legLefts);
  const legRight = Math.max(...legLefts);
  const legCenter = Math.round((legLeft + legRight) / 2);
  const legWidth = legRight - legLeft;

  console.log(`  Jambes: x=${legLeft}-${legRight}, centre=${legCenter}, largeur=${legWidth}`);

  // Dessiner 2 jambes qui descendent
  const legLength = Math.min(30, 127 - legsStartY - 6); // pieds = 4px
  const gapBetweenLegs = Math.max(2, Math.round(legWidth * 0.08));
  const singleLegW = Math.round((legWidth - gapBetweenLegs) / 2);

  function drawLeg(startX, width, startY, length) {
    for (let dy = 0; dy < length; dy++) {
      const y = startY + dy + 1;
      if (y >= 128) break;

      // Les jambes se rétrécissent légèrement vers le bas
      const taper = Math.round(dy / length * 2);
      const lx = startX + taper;
      const rx = startX + width - taper;

      for (let x = lx; x <= rx; x++) {
        const relX = (x - lx) / (rx - lx); // 0 à 1

        let c;
        if (x === lx || x === rx) {
          c = outline; // contour
        } else if (x === lx + 1) {
          c = jeanDark; // ombre gauche
        } else if (x === rx - 1) {
          c = jeanLight; // lumière droite
        } else if (relX < 0.4) {
          c = jeanMid;
        } else {
          c = jeanLight;
        }

        // Plus sombre en bas (ombre au genou)
        if (dy > length * 0.7) {
          c = c.map(v => Math.max(0, v - 15));
        }

        const i = (y * 128 + x) * 4;
        canvas[i] = c[0]; canvas[i + 1] = c[1]; canvas[i + 2] = c[2]; canvas[i + 3] = 255;
      }
    }

    // Dessiner la chaussure
    const shoeY = startY + length + 1;
    const shoeH = 4;
    const shoeExtraW = 2;

    for (let dy = 0; dy < shoeH; dy++) {
      const y = shoeY + dy;
      if (y >= 128) break;

      const taper = Math.round(length / length * 2);
      const lx = startX + taper - shoeExtraW;
      const rx = startX + width - taper + shoeExtraW;

      for (let x = lx; x <= rx; x++) {
        let c;
        if (dy === 0 || x === lx || x === rx || dy === shoeH - 1) {
          c = (dy === shoeH - 1) ? soleColor : outline;
        } else if (x < lx + 3) {
          c = shoeDark;
        } else if (x > rx - 3) {
          c = shoeLight;
        } else {
          c = shoeColor;
        }

        const i = (y * 128 + x) * 4;
        canvas[i] = c[0]; canvas[i + 1] = c[1]; canvas[i + 2] = c[2]; canvas[i + 3] = 255;
      }
    }
  }

  // Jambe gauche
  drawLeg(legLeft, singleLegW, legsStartY, legLength);
  // Jambe droite
  drawLeg(legCenter + Math.round(gapBetweenLegs / 2), singleLegW, legsStartY, legLength);

  // Sauver version avec jambes dessinées
  const withLegsPath = path.join(outputDir, 'rookie_withlegs_128.png');
  await saveImg(canvas, 128, 128, withLegsPath);
  await saveImg(canvas, 128, 128, path.join(outputDir, 'rookie_withlegs_256.png'), 2);
  console.log('  Jambes dessinées OK');

  // === 4. BITFORGE pour lisser/améliorer le résultat ===
  console.log('\n[4] Bitforge polish full body...');

  const withLegsB64 = fs.readFileSync(withLegsPath).toString('base64');

  const desc = 'pixel art character sprite, stocky strong man, white collared polo shirt, ' +
    'light blue denim jeans, brown leather shoes, brown hair, warm tanned skin, ' +
    'standing idle pose facing south, arms at sides, full body visible from head to feet, ' +
    'clean single pixel outline, detailed shading, petanque player, retro game sprite';

  const configs = [
    { label: 'fullbody_s750', strength: 750, tgs: 6, seed: 42 },
    { label: 'fullbody_s650', strength: 650, tgs: 7, seed: 42 },
    { label: 'fullbody_s550', strength: 550, tgs: 8, seed: 42 },
    { label: 'fullbody_s750_s2', strength: 750, tgs: 6, seed: 200 },
  ];

  const polishResults = [];

  for (const cfg of configs) {
    try {
      console.log(`  [${cfg.label}] s=${cfg.strength}`);
      const b64 = await callApi('/v1/generate-image-bitforge', {
        description: desc,
        image_size: { width: 128, height: 128 },
        no_background: true,
        init_image: { base64: withLegsB64, strength: cfg.strength },
        text_guidance_scale: cfg.tgs,
        seed: cfg.seed
      });

      const buf = Buffer.from(b64, 'base64');
      await sharp(buf).png().toFile(path.join(outputDir, `${cfg.label}_128.png`));
      await sharp(buf).resize(256, 256, { kernel: 'nearest' }).png()
        .toFile(path.join(outputDir, `${cfg.label}_256.png`));
      await sharp(buf).resize(64, 64, { kernel: 'nearest' }).png()
        .toFile(path.join(outputDir, `${cfg.label}_64.png`));
      polishResults.push(cfg.label);
      console.log(`    OK`);
    } catch (err) {
      console.error(`    ERREUR: ${err.message.substring(0, 100)}`);
    }
  }

  // === 5. Planche ===
  console.log('\n[5] Planche finale...');
  const cell = 256, gap = 6;
  const items = [
    path.join(outputDir, 'rookie_withlegs_256.png'),
    ...polishResults.map(r => path.join(outputDir, `${r}_256.png`))
  ].filter(p => fs.existsSync(p));

  const cols = Math.min(items.length, 3);
  const rows = Math.ceil(items.length / cols);
  await sharp({
    create: {
      width: cols * (cell + gap) - gap,
      height: rows * (cell + gap) - gap,
      channels: 4,
      background: { r: 40, g: 40, b: 40, alpha: 255 }
    }
  }).composite(items.map((p, i) => ({
    input: p,
    left: (i % cols) * (cell + gap),
    top: Math.floor(i / cols) * (cell + gap)
  }))).png().toFile(path.join(outputDir, 'planche_fullbody.png'));

  console.log('\n' + '='.repeat(60));
  console.log('FULL BODY TERMINÉ');
  console.log('='.repeat(60));
  console.log(`\nDossier: ${outputDir}/`);
}

main().catch(err => { console.error('Erreur:', err.message); process.exit(1); });
