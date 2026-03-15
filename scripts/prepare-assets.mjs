// Prepare free asset pack sprites for integration into Petanque Master
// Converts Pipoya 96x128 (3cols x 4rows) spritesheets to 128x128 (4cols x 4rows)
// Usage: node scripts/prepare-assets.mjs

import fs from 'fs';
import path from 'path';

// We need sharp for image manipulation
let sharp;
try {
  sharp = (await import('sharp')).default;
} catch {
  console.log('Installing sharp...');
  const { execSync } = await import('child_process');
  execSync('npm install sharp', { stdio: 'inherit' });
  sharp = (await import('sharp')).default;
}

const BASE = path.resolve('assets/free_packs');
const OUT = path.resolve('public/assets/sprites');
const OUT_TILES = path.resolve('public/assets/tilesets');

fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(OUT_TILES, { recursive: true });

// ============================================================
// PIPOYA CHARACTER CONVERSION
// Pipoya format: 96x128 PNG (3 frames x 4 directions, each 32x32)
//   Row 0 = down, Row 1 = left, Row 2 = right, Row 3 = up
//   3 frames per row: [stance, left-leg, right-leg]
// Game format: 128x128 PNG (4 frames x 4 directions, each 32x32)
//   Same row order, but 4 frames: [stance, left-leg, right-leg, stance-copy]
// ============================================================

async function convertPipoyaCharacter(inputPath, outputName, description) {
  if (!fs.existsSync(inputPath)) {
    console.log(`  SKIP: ${inputPath} not found`);
    return false;
  }

  const input = sharp(inputPath);
  const meta = await input.metadata();

  // Pipoya sheets are 96x128 (3 cols x 4 rows of 32x32)
  if (meta.width !== 96 || meta.height !== 128) {
    console.log(`  WARN: ${outputName} unexpected size ${meta.width}x${meta.height}, copying as-is`);
    fs.copyFileSync(inputPath, path.join(OUT, `${outputName}.png`));
    return true;
  }

  // Extract all 12 frames (3 per row, 4 rows)
  const frames = [];
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 3; col++) {
      const frame = await sharp(inputPath)
        .extract({ left: col * 32, top: row * 32, width: 32, height: 32 })
        .toBuffer();
      frames.push(frame);
    }
  }

  // Build 128x128 output (4 cols x 4 rows)
  // For each row: [frame0, frame1, frame2, frame0-copy] (duplicate stance as 4th frame)
  const composites = [];
  for (let row = 0; row < 4; row++) {
    const baseIdx = row * 3;
    composites.push({ input: frames[baseIdx + 0], left: 0, top: row * 32 });     // stance
    composites.push({ input: frames[baseIdx + 1], left: 32, top: row * 32 });    // left leg
    composites.push({ input: frames[baseIdx + 0], left: 64, top: row * 32 });    // stance again
    composites.push({ input: frames[baseIdx + 2], left: 96, top: row * 32 });    // right leg
  }

  await sharp({
    create: { width: 128, height: 128, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
  })
    .composite(composites)
    .png()
    .toFile(path.join(OUT, `${outputName}.png`));

  console.log(`  OK: ${outputName}.png (${description})`);
  return true;
}

// ============================================================
// ASSET SELECTION - Coherent set for Petanque Master
// ============================================================

const PIPOYA_BASE = path.join(BASE, 'PIPOYA FREE RPG Character Sprites 32x32', 'PIPOYA FREE RPG Character Sprites 32x32');

const CHARACTER_SELECTION = [
  // PLAYER - using Pipoya Male 15 (brown hair, blue outfit - closest to our player)
  ['Male/Male 15-1.png', 'player_pipoya', 'Joueur (bleu royal)'],

  // MAIN NPCs - hand-picked for petanque village vibe
  ['Male/Male 12-1.png', 'npc_maitre', 'Papet/Vieux maitre (chauve, age)'],
  ['Male/Male 01-1.png', 'npc_marcel', 'Marcel (cheveux rouges, energique)'],
  ['Male/Male 16-1.png', 'npc_rival', 'Bastien rival (sombre, cool)'],

  // DRESSEURS (petanque trainers)
  ['Male/Male 03-1.png', 'npc_dresseur_1', 'Dresseur 1 (vert)'],
  ['Male/Male 09-1.png', 'npc_dresseur_2', 'Dresseur 2 (militaire)'],
  ['Male/Male 17-1.png', 'npc_dresseur_3', 'Dresseur 3 (chapeau)'],

  // VILLAGEOIS
  ['Male/Male 08-1.png', 'npc_villager_1', 'Villageois homme (vert sobre)'],
  ['Female/Female 03-1.png', 'npc_villager_2', 'Villageoise femme (robe rouge)'],
  ['Male/Male 11-1.png', 'npc_gate', 'Garde portail (vert)'],

  // EXTRAS for village life
  ['Male/Male 05-1.png', 'npc_villager_3', 'Villageois blond chapeau'],
  ['Male/Male 13-1.png', 'npc_enfant', 'Enfant curieux'],
  ['Female/Female 08-1.png', 'npc_fanny', 'Fanny (blonde, bleue)'],
  ['Female/Female 05-1.png', 'npc_mamie', 'Mamie du village'],
  ['Female/Female 12-1.png', 'npc_villager_4', 'Villageoise turquoise'],
  ['Male/Male 14-1.png', 'npc_villager_5', 'Villageois orange'],
  ['Male/Male 06-1.png', 'npc_villager_6', 'Villageoise verte chapeau'],

  // ANIMALS
  ['Animal/Cat 01-1.png', 'animal_chat', 'Chat du village'],
  ['Animal/Dog 01-1.png', 'animal_chien', 'Chien du village'],

  // SOLDIER for arena guard
  ['Soldier/Soldier 01-1.png', 'npc_guard', 'Garde arene (armure)'],
];

// ============================================================
// MAIN
// ============================================================

async function main() {
  console.log('=== PREPARING ASSETS FOR PETANQUE MASTER ===\n');

  // 1. Convert Pipoya characters
  console.log('--- CHARACTERS (Pipoya -> 128x128 spritesheets) ---');
  let ok = 0, fail = 0;

  for (const [file, outName, desc] of CHARACTER_SELECTION) {
    const inputPath = path.join(PIPOYA_BASE, file);
    if (await convertPipoyaCharacter(inputPath, outName, desc)) ok++;
    else fail++;
  }

  console.log(`\nCharacters: ${ok} converted, ${fail} failed`);

  // 2. Copy Pipoya BaseChip tileset
  console.log('\n--- TILESET ---');
  const baseChip = path.join(BASE, 'Pipoya RPG Tileset 32x32', 'Pipoya RPG Tileset 32x32', 'SampleMap', '[Base]BaseChip_pipo.png');
  if (fs.existsSync(baseChip)) {
    fs.copyFileSync(baseChip, path.join(OUT_TILES, 'basechip_pipoya.png'));
    console.log('  OK: basechip_pipoya.png (Pipoya BaseChip tileset)');
  }

  // Copy terrain tiles
  const tileFiles = [
    ['[A]_type1/[A]Grass1_pipo.png', 'grass1.png'],
    ['[A]_type1/[A]Dirt1_pipo.png', 'dirt1.png'],
    ['[A]_type1/[A]Flower_pipo.png', 'flower.png'],
    ['[A]_type1/not_animation/[A]Water1_pipo.png', 'water1.png'],
  ];
  for (const [src, dst] of tileFiles) {
    const srcPath = path.join(BASE, 'Pipoya RPG Tileset 32x32', 'Pipoya RPG Tileset 32x32', src);
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, path.join(OUT_TILES, dst));
      console.log(`  OK: ${dst}`);
    }
  }

  // 3. Copy Schwarnhild village assets
  console.log('\n--- SCHWARNHILD VILLAGE DECORS ---');
  const svBase = path.join(BASE, 'summer_village_v1.0', 'summer_village_v1.0');
  const svFiles = [
    ['assets/houses.png', 'houses_schwarnhild.png'],
    ['assets/market_assets.png', 'market_schwarnhild.png'],
    ['assets/nature_assets.png', 'nature_schwarnhild.png'],
    ['assets/village_assets.png', 'village_schwarnhild.png'],
    ['tiles/environment.png', 'environment_schwarnhild.png'],
    ['tiles/cobblestone_tiles_brown.png', 'cobblestone_brown.png'],
    ['tiles/cobblestone_tiles_grey.png', 'cobblestone_grey.png'],
    ['tiles/wooden_fence.png', 'fence_wood.png'],
    ['tiles/marble_fence.png', 'fence_marble.png'],
  ];
  for (const [src, dst] of svFiles) {
    const srcPath = path.join(svBase, src);
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, path.join(OUT_TILES, dst));
      console.log(`  OK: ${dst}`);
    }
  }

  // 4. Copy doors
  console.log('\n--- DOORS ---');
  const doorBase = path.join(BASE, 'Door_Animation');
  if (fs.existsSync(doorBase)) {
    for (const f of fs.readdirSync(doorBase)) {
      if (f.endsWith('.png')) {
        fs.copyFileSync(path.join(doorBase, f), path.join(OUT_TILES, f));
        console.log(`  OK: ${f}`);
      }
    }
  }

  console.log('\n=== DONE ===');
  console.log(`Output: ${OUT} (sprites) + ${OUT_TILES} (tilesets)`);
}

main().catch(console.error);
