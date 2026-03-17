#!/usr/bin/env node
/**
 * generate-throw-anims.mjs
 * Génère des frames d'animation de lancer de boule pour chaque personnage
 * via PixelLab animate-with-text API
 *
 * Usage: node scripts/generate-throw-anims.mjs
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// PixelLab API config
const API_URL = 'https://api.pixellab.ai';

// Load API key from .env
function loadApiKey() {
  if (process.env.PIXELLAB_API_KEY) return process.env.PIXELLAB_API_KEY;
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const match = envContent.match(/PIXELLAB_API_KEY=(.+)/);
    if (match) return match[1].trim();
  } catch (e) { /* ignore */ }
  throw new Error('PIXELLAB_API_KEY non défini. Ajouter dans .env');
}

const API_KEY = loadApiKey();

// Personnages à animer
const SPRITES_DIR = 'AssetPetanqueMasterFinal/sprites/personnages';
const OUTPUT_DIR = 'AssetPetanqueMasterFinal/sprites/throw_animations';

const CHARACTERS = [
  {
    name: 'marcel',
    file: 'marcel_south_v2.png',
    desc: 'stocky old man, red polo shirt, beige cap, gold chain necklace, khaki pants, throwing a petanque ball, side view'
  },
  {
    name: 'fizz',
    file: 'fizz.png',
    desc: 'muscular man, green military vest, brown pants, sunglasses, throwing a petanque ball with force, side view'
  },
  {
    name: 'ley',
    file: 'ley.png',
    desc: 'large man, blue button shirt, dark pants, glasses, throwing a petanque ball, casual stance, side view'
  },
  {
    name: 'le_magicien',
    file: 'le magicien.png',
    desc: 'man with red bandana, open vest, brown pants, throwing a petanque ball with style, magician pose, side view'
  },
  {
    name: 'la_choup',
    file: 'la choup.png',
    desc: 'muscular man, red tank top, dark hair, fierce expression, throwing a petanque ball powerfully, side view'
  },
  {
    name: 'le_coach',
    file: 'le coach.png',
    desc: 'young man, black hoodie, cap, sunglasses, streetwear style, throwing a petanque ball, cool pose, side view'
  }
];

// Phases d'animation de lancer
const THROW_PHASES = [
  { action: 'preparing to throw, holding ball at chest level, standing still', suffix: 'prepare' },
  { action: 'winding up to throw, arm pulled back, leaning back', suffix: 'windup' },
  { action: 'throwing a ball, arm extended forward, releasing ball, lunging forward', suffix: 'release' },
  { action: 'follow through after throwing, arm extended, leaning forward', suffix: 'followthrough' }
];

async function imageToBase64(filePath) {
  // Resize to 64x64 if needed
  const metadata = await sharp(filePath).metadata();
  let buffer;
  if (metadata.width !== 64 || metadata.height !== 64) {
    buffer = await sharp(filePath)
      .resize(64, 64, { kernel: 'nearest', fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
  } else {
    buffer = fs.readFileSync(filePath);
  }
  return buffer.toString('base64');
}

async function animateWithText(refBase64, description, action, direction = 'south', nFrames = 4) {
  const body = {
    description: `${description}, ${action}`,
    image_size: { width: 64, height: 64 },
    action: action,
    reference_image: { type: 'base64', base64: refBase64 },
    view: 'high top-down',
    direction: direction,
    n_frames: nFrames,
    no_background: true,
    text_guidance_scale: 8.0,
    image_guidance_scale: 1.5
  };

  const response = await fetch(`${API_URL}/v1/animate-with-text`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`PixelLab API error ${response.status}: ${errorText.substring(0, 200)}`);
  }

  const data = await response.json();
  // Response: { images: [{ base64: "..." }, ...] } or { image: { base64: "..." } }
  if (data.images) {
    return data.images.map(img => typeof img === 'string' ? img : img.base64);
  }
  if (data.image) {
    const b64 = typeof data.image === 'string' ? data.image : data.image.base64;
    return [b64];
  }
  throw new Error('Unexpected API response format');
}

async function generateThrowForCharacter(character) {
  const spritePath = path.join(SPRITES_DIR, character.file);
  if (!fs.existsSync(spritePath)) {
    console.error(`  ❌ Sprite non trouvé: ${spritePath}`);
    return null;
  }

  const charOutputDir = path.join(OUTPUT_DIR, character.name);
  if (!fs.existsSync(charOutputDir)) {
    fs.mkdirSync(charOutputDir, { recursive: true });
  }

  console.log(`\n🎯 ${character.name.toUpperCase()}`);
  console.log(`  Sprite: ${spritePath}`);

  // Encode reference sprite
  const refBase64 = await imageToBase64(spritePath);
  console.log(`  ✅ Reference encodée`);

  // Generate 4-frame throw animation
  console.log(`  🎬 Génération animation de lancer (4 frames)...`);
  try {
    const frames = await animateWithText(
      refBase64,
      character.desc,
      'throwing a petanque ball',
      'south',
      4
    );

    // Save individual frames
    const framePaths = [];
    for (let i = 0; i < frames.length; i++) {
      const buffer = Buffer.from(frames[i], 'base64');

      // 64x64
      const path64 = path.join(charOutputDir, `throw_frame${i}_64.png`);
      await sharp(buffer).png().toFile(path64);

      // 128x128 (preview)
      const path128 = path.join(charOutputDir, `throw_frame${i}_128.png`);
      await sharp(buffer).resize(128, 128, { kernel: 'nearest' }).png().toFile(path128);

      framePaths.push({ path64, path128 });
    }
    console.log(`  ✅ ${frames.length} frames sauvegardées`);

    // Assemble throw spritesheet (frames side by side, 128px for preview)
    const sheetWidth = frames.length * 136 - 8;
    const composites = framePaths.map((fp, i) => ({
      input: fp.path128,
      left: i * 136,
      top: 0
    }));

    const sheetPath = path.join(charOutputDir, `throw_sheet_${character.name}.png`);
    await sharp({
      create: {
        width: sheetWidth,
        height: 128,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    })
      .composite(composites)
      .png()
      .toFile(sheetPath);

    console.log(`  ✅ Spritesheet: ${sheetPath}`);

    // Also make a compact game-ready sheet (4 frames x 64px side by side)
    const gameFrameComposites = [];
    for (let i = 0; i < framePaths.length; i++) {
      gameFrameComposites.push({
        input: framePaths[i].path64,
        left: i * 64,
        top: 0
      });
    }

    const gameSheetPath = path.join(charOutputDir, `throw_game_${character.name}_64.png`);
    await sharp({
      create: {
        width: frames.length * 64,
        height: 64,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    })
      .composite(gameFrameComposites)
      .png()
      .toFile(gameSheetPath);

    console.log(`  ✅ Game sheet (64px): ${gameSheetPath}`);

    return { character: character.name, frames: frames.length, sheetPath };

  } catch (err) {
    console.error(`  ❌ Erreur: ${err.message}`);
    return null;
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('🎯 GÉNÉRATION ANIMATIONS DE LANCER - PETANQUE MASTER');
  console.log('='.repeat(60));
  console.log(`  Personnages: ${CHARACTERS.length}`);
  console.log(`  Output: ${OUTPUT_DIR}/`);

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const results = [];
  for (const char of CHARACTERS) {
    const result = await generateThrowForCharacter(char);
    if (result) results.push(result);
    // Small delay between API calls
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ TERMINÉ !');
  console.log('='.repeat(60));
  console.log(`  ${results.length}/${CHARACTERS.length} personnages animés`);
  results.forEach(r => {
    console.log(`  ✓ ${r.character}: ${r.frames} frames → ${r.sheetPath}`);
  });
}

main().catch(err => {
  console.error('❌ Erreur fatale:', err.message);
  process.exit(1);
});
