#!/usr/bin/env node
/**
 * upscale-sprite.mjs
 * Upscale un sprite 64x64 vers 128x128 via Bitforge
 * Usage: node scripts/upscale-sprite.mjs <input_64.png> <description> [strength] [seed]
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
  const [inputPath, description, strengthStr, seedStr] = process.argv.slice(2);
  if (!inputPath) {
    console.log('Usage: node scripts/upscale-sprite.mjs <input.png> "<description>" [strength=800] [seed=42]');
    process.exit(1);
  }

  const strength = parseInt(strengthStr) || 800;
  const seed = parseInt(seedStr) || 42;
  const desc = description || 'pixel art character, detailed shading, black outline';

  const dir = path.dirname(inputPath);
  const base = path.basename(inputPath, '.png');

  // Préparer l'image source en 128x128 (nearest neighbor pour garder les pixels nets)
  const input128Path = path.join(dir, `${base}_upscaled_input_128.png`);
  await sharp(inputPath)
    .resize(128, 128, { kernel: 'nearest' })
    .png().toFile(input128Path);

  const inputB64 = fs.readFileSync(input128Path).toString('base64');

  console.log(`Upscale: ${inputPath} -> 128x128`);
  console.log(`  Description: ${desc}`);
  console.log(`  Strength: ${strength}, Seed: ${seed}`);

  const b64 = await callApi('/v1/generate-image-bitforge', {
    description: desc,
    image_size: { width: 128, height: 128 },
    no_background: true,
    init_image: { base64: inputB64, strength },
    text_guidance_scale: 6,
    seed
  });

  const buf = Buffer.from(b64, 'base64');
  const outPath = path.join(dir, `${base}_128_s${strength}_seed${seed}.png`);
  const outPath256 = path.join(dir, `${base}_128_s${strength}_seed${seed}_x2.png`);
  await sharp(buf).png().toFile(outPath);
  await sharp(buf).resize(256, 256, { kernel: 'nearest' }).png().toFile(outPath256);

  console.log(`  -> ${outPath}`);
  console.log(`  -> ${outPath256} (x2 preview)`);
}

main().catch(err => { console.error('Erreur:', err.message); process.exit(1); });
