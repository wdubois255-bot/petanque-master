#!/usr/bin/env node
/**
 * rookie-v2-polish.mjs
 * Peaufinage du Rookie v2 :
 *   - Supprimer les artefacts dorés (haut-droite, bas-droite)
 *   - Nettoyer les bords / pixels isolés
 *   - Améliorer les jambes (contour, ombre, forme)
 *   - Renforcer l'outline marron chaud (#3A2E28)
 *   - Tester plusieurs niveaux de polish via Bitforge
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

async function main() {
  console.log('='.repeat(60));
  console.log('ROOKIE V2 - Polish final');
  console.log('='.repeat(60));

  const img = await loadPixels(path.join(outputDir, 'rookie_base_128.png'));
  const W = img.width, H = img.height;
  const polished = cloneImg(img);

  // === 1. SUPPRIMER ARTEFACTS DORÉS ===
  // Les artefacts sont des pixels jaunes/dorés isolés loin du corps
  console.log('\n[1] Suppression artefacts dorés...');
  let artifactsRemoved = 0;

  // Trouver la bounding box du personnage (pixels opaques connectés au corps)
  // D'abord trouver les limites grossières du corps principal
  let bodyMinX = W, bodyMaxX = 0, bodyMinY = H, bodyMaxY = 0;
  for (let y = 0; y < H; y++) {
    let rowOpaque = 0;
    for (let x = 0; x < W; x++) {
      if (getPixel(polished, x, y)[3] > 128) rowOpaque++;
    }
    if (rowOpaque > 10) { // lignes avec beaucoup de pixels = corps
      for (let x = 0; x < W; x++) {
        if (getPixel(polished, x, y)[3] > 128) {
          bodyMinX = Math.min(bodyMinX, x);
          bodyMaxX = Math.max(bodyMaxX, x);
          bodyMinY = Math.min(bodyMinY, y);
          bodyMaxY = Math.max(bodyMaxY, y);
        }
      }
    }
  }
  console.log(`  Corps: x=${bodyMinX}-${bodyMaxX}, y=${bodyMinY}-${bodyMaxY}`);

  // Supprimer tout pixel opaque trop loin du corps
  const margin = 3;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const [r, g, b, a] = getPixel(polished, x, y);
      if (a < 50) continue;

      // Si hors de la bounding box + marge, c'est un artefact
      if (x < bodyMinX - margin || x > bodyMaxX + margin ||
          y < bodyMinY - margin || y > bodyMaxY + margin) {
        setPixel(polished, x, y, 0, 0, 0, 0);
        artifactsRemoved++;
        continue;
      }

      // Aussi: pixels dorés/jaunes isolés (< 3 voisins opaques)
      const [h, s] = rgbToHsl(r, g, b);
      if (h > 30 && h < 65 && s > 0.4) {
        let neighbors = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy) continue;
            if (getPixel(polished, x + dx, y + dy)[3] > 128) neighbors++;
          }
        }
        if (neighbors < 3) {
          setPixel(polished, x, y, 0, 0, 0, 0);
          artifactsRemoved++;
        }
      }
    }
  }
  console.log(`  ${artifactsRemoved} pixels artefacts supprimés`);

  // === 2. SUPPRIMER PIXELS ISOLÉS (bruit) ===
  console.log('\n[2] Nettoyage pixels isolés...');
  let isolated = 0;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (getPixel(polished, x, y)[3] < 128) continue;
      let neighbors = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          if (getPixel(polished, x + dx, y + dy)[3] > 128) neighbors++;
        }
      }
      if (neighbors < 2) {
        setPixel(polished, x, y, 0, 0, 0, 0);
        isolated++;
      }
    }
  }
  console.log(`  ${isolated} pixels isolés supprimés`);

  // === 3. RENFORCER L'OUTLINE ===
  console.log('\n[3] Renforcement outline marron chaud...');
  const outlined = cloneImg(polished);
  const outlineColor = [58, 46, 40, 255]; // #3A2E28

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const [, , , a] = getPixel(polished, x, y);
      if (a > 128) continue; // pixel opaque, on ne touche pas

      // Pixel transparent: vérifier s'il a un voisin opaque (= bord du sprite)
      let hasOpaqueNeighbor = false;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          if (getPixel(polished, x + dx, y + dy)[3] > 128) {
            hasOpaqueNeighbor = true;
            break;
          }
        }
        if (hasOpaqueNeighbor) break;
      }

      // Si ce pixel transparent touche le sprite, on vérifie que le pixel sprite adjacent
      // est déjà sombre (outline existante) ou non
      if (hasOpaqueNeighbor) {
        // Vérifier si les pixels opaques adjacents sont déjà outline
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy) continue;
            const [r, g, b, a2] = getPixel(polished, x + dx, y + dy);
            if (a2 > 128) {
              const [, , l] = rgbToHsl(r, g, b);
              if (l > 0.2) {
                // Ce pixel n'est PAS une outline mais touche le bord
                // -> remplacer par outline
                setPixel(outlined, x + dx, y + dy, outlineColor[0], outlineColor[1], outlineColor[2], outlineColor[3]);
              }
            }
          }
        }
      }
    }
  }

  // === 4. Sauver version nettoyée ===
  console.log('\n[4] Sauvegarde version nettoyée...');
  await saveImg(outlined, path.join(outputDir, 'rookie_clean_128.png'));
  await saveImg(outlined, path.join(outputDir, 'rookie_clean_256.png'), 2);
  await saveImg(outlined, path.join(outputDir, 'rookie_clean_512.png'), 4);
  await sharp(outlined.data, { raw: { width: W, height: H, channels: 4 } })
    .resize(64, 64, { kernel: 'nearest' }).png()
    .toFile(path.join(outputDir, 'rookie_clean_64.png'));

  // === 5. BITFORGE POLISH ===
  // Envoyer la version clean en Bitforge pour améliorer les détails
  console.log('\n[5] Bitforge polish (3 variantes)...');

  const cleanB64 = fs.readFileSync(path.join(outputDir, 'rookie_clean_128.png')).toString('base64');

  const desc = 'pixel art character sprite, stocky strong man, white collared polo shirt, ' +
    'light blue denim jeans, brown hair, warm tanned skin, ' +
    'standing idle pose facing south, arms at sides, full body head to feet, ' +
    'single pixel black outline, detailed shading, petanque player, retro game sprite';

  const polishConfigs = [
    { label: 'polish_s800', strength: 800, tgs: 5, seed: 42 },   // très proche, juste lissé
    { label: 'polish_s750', strength: 750, tgs: 6, seed: 42 },   // un peu plus libre
    { label: 'polish_s800_s2', strength: 800, tgs: 5, seed: 100 }, // même close, seed diff
    { label: 'polish_s650', strength: 650, tgs: 7, seed: 42 },    // plus de liberté
  ];

  const polishResults = [];

  for (const cfg of polishConfigs) {
    try {
      console.log(`  [${cfg.label}] s=${cfg.strength}, tgs=${cfg.tgs}, seed=${cfg.seed}`);
      const b64 = await callApi('/v1/generate-image-bitforge', {
        description: desc,
        image_size: { width: 128, height: 128 },
        no_background: true,
        init_image: { base64: cleanB64, strength: cfg.strength },
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
      console.log(`    -> OK`);
    } catch (err) {
      console.error(`    -> ERREUR: ${err.message.substring(0, 100)}`);
    }
  }

  // === 6. PLANCHE FINALE ===
  console.log('\n[6] Planche finale...');
  const cell = 256, gap = 6;
  const items = [
    path.join(outputDir, 'rookie_clean_256.png'),
    ...polishResults.map(r => path.join(outputDir, `${r}_256.png`))
  ].filter(p => fs.existsSync(p));

  const cols = Math.min(items.length, 3);
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
  }).composite(composites).png().toFile(path.join(outputDir, 'planche_polish.png'));

  console.log('\n' + '='.repeat(60));
  console.log('POLISH TERMINÉ');
  console.log('='.repeat(60));
  console.log(`\nDossier: ${outputDir}/`);
  console.log('  rookie_clean_*  = nettoyé (artefacts, outline)');
  console.log('  polish_*        = versions Bitforge améliorées');
  console.log('  planche_polish.png = comparaison');
}

main().catch(err => { console.error('Erreur:', err.message); process.exit(1); });
