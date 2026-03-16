/**
 * Prepare alternative tileset styles for comparison in Tiled.
 * Task 1: Upscale Ninja Adventure 16x16 -> 32x32
 * Task 2: Combine Schwarnhild tiles
 * Task 3: Upscale Ninja Adventure character sprites
 * Task 4: Create test Tiled map
 */
import sharp from 'sharp';
import { readdir, mkdir, writeFile } from 'fs/promises';
import path from 'path';

const ROOT = path.resolve('.');
const NINJA_BASE = path.join(ROOT, 'assets/free_packs/NinjaAdventure/Ninja Adventure - Asset Pack');
const TILESETS_OUT = path.join(ROOT, 'public/assets/tilesets');
const SPRITES_OUT = path.join(ROOT, 'public/assets/sprites');
const MAPS_OUT = path.join(ROOT, 'public/assets/maps');

await mkdir(TILESETS_OUT, { recursive: true });
await mkdir(SPRITES_OUT, { recursive: true });
await mkdir(MAPS_OUT, { recursive: true });

// ============ TASK 1: Upscale Ninja Adventure tilesets ============
console.log('=== Task 1: Upscale Ninja Adventure tilesets ===');

const tilesetFiles = [
  'TilesetField.png',
  'TilesetHouse.png',
  'TilesetNature.png',
  'TilesetFloor.png',
  'TilesetFloorB.png',
  'TilesetWater.png',
  'TilesetRelief.png',
];

const tilesetDir = path.join(NINJA_BASE, 'Backgrounds/Tilesets');

async function upscale2x(inputPath, outputPath) {
  const meta = await sharp(inputPath).metadata();
  await sharp(inputPath)
    .resize(meta.width * 2, meta.height * 2, { kernel: sharp.kernel.nearest })
    .toFile(outputPath);
  const outMeta = await sharp(outputPath).metadata();
  console.log(`  ${path.basename(outputPath)}: ${outMeta.width}x${outMeta.height}`);
  return { width: outMeta.width, height: outMeta.height, path: outputPath };
}

// Upscale each tileset
for (const file of tilesetFiles) {
  const input = path.join(tilesetDir, file);
  const outName = 'ninja_' + file.replace('Tileset', '').toLowerCase();
  const output = path.join(TILESETS_OUT, outName);
  await upscale2x(input, output);
}

// Create combined tileset: Field + House + Nature stacked vertically
// All need same width - pad narrower ones with transparency
console.log('\n  Creating ninja_combined.png (Field + House + Nature)...');
const combineFiles = ['TilesetField.png', 'TilesetHouse.png', 'TilesetNature.png'];
const combineBuffers = [];
const combineMetas = [];

for (const file of combineFiles) {
  const input = path.join(tilesetDir, file);
  const meta = await sharp(input).metadata();
  // Upscale 2x
  const buf = await sharp(input)
    .resize(meta.width * 2, meta.height * 2, { kernel: sharp.kernel.nearest })
    .png()
    .toBuffer();
  const upMeta = await sharp(buf).metadata();
  combineBuffers.push(buf);
  combineMetas.push({ width: upMeta.width, height: upMeta.height });
}

const maxWidth = Math.max(...combineMetas.map(m => m.width));
const totalHeight = combineMetas.reduce((s, m) => s + m.height, 0);

// Pad each to maxWidth and stack
const paddedBuffers = [];
let yOffset = 0;
const composites = [];

for (let i = 0; i < combineBuffers.length; i++) {
  composites.push({
    input: combineBuffers[i],
    left: 0,
    top: yOffset,
  });
  yOffset += combineMetas[i].height;
}

await sharp({
  create: {
    width: maxWidth,
    height: totalHeight,
    channels: 4,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  },
})
  .composite(composites)
  .png()
  .toFile(path.join(TILESETS_OUT, 'ninja_combined.png'));

console.log(`  ninja_combined.png: ${maxWidth}x${totalHeight}`);

// ============ TASK 2: Combine Schwarnhild tilesets ============
console.log('\n=== Task 2: Combine Schwarnhild tilesets ===');

const schwarnhildFiles = [
  'environment_schwarnhild.png',
  'houses_schwarnhild.png',
  'nature_schwarnhild.png',
  'village_schwarnhild.png',
  'market_schwarnhild.png',
];

const schwBuffers = [];
const schwMetas = [];

for (const file of schwarnhildFiles) {
  const input = path.join(TILESETS_OUT, file);
  const meta = await sharp(input).metadata();
  const buf = await sharp(input).png().toBuffer();
  schwBuffers.push(buf);
  schwMetas.push({ width: meta.width, height: meta.height });
  console.log(`  ${file}: ${meta.width}x${meta.height}`);
}

const schwMaxWidth = Math.max(...schwMetas.map(m => m.width));
const schwTotalHeight = schwMetas.reduce((s, m) => s + m.height, 0);

const schwComposites = [];
let schwY = 0;
for (let i = 0; i < schwBuffers.length; i++) {
  schwComposites.push({
    input: schwBuffers[i],
    left: 0,
    top: schwY,
  });
  schwY += schwMetas[i].height;
}

await sharp({
  create: {
    width: schwMaxWidth,
    height: schwTotalHeight,
    channels: 4,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  },
})
  .composite(schwComposites)
  .png()
  .toFile(path.join(TILESETS_OUT, 'schwarnhild_combined.png'));

console.log(`  schwarnhild_combined.png: ${schwMaxWidth}x${schwTotalHeight}`);

// ============ TASK 3: Upscale Ninja Adventure characters ============
console.log('\n=== Task 3: Upscale Ninja Adventure character sprites ===');

const characters = ['Boy', 'Inspector', 'Knight', 'Villager', 'Sultan', 'Hunter'];
const charDir = path.join(NINJA_BASE, 'Actor/Characters');

for (const charName of characters) {
  const input = path.join(charDir, charName, 'SpriteSheet.png');
  const outName = `ninja_${charName.toLowerCase()}.png`;
  const output = path.join(SPRITES_OUT, outName);
  try {
    await upscale2x(input, output);
  } catch (e) {
    console.log(`  SKIP ${charName}: ${e.message}`);
  }
}

// ============ TASK 4: Create test Tiled map ============
console.log('\n=== Task 4: Create test Tiled map (test_ninja.tmj) ===');

// The ninja_combined.png has Field (160x480) on top, House (1056x736), Nature (768x672)
// Field starts at y=0, House at y=480, Nature at y=480+736=1216
// All tiles are 32x32 in the upscaled image
// combined width = 1056 (max of the three)

const combinedMeta = await sharp(path.join(TILESETS_OUT, 'ninja_combined.png')).metadata();
const tilesWide = Math.floor(combinedMeta.width / 32);
const tilesTall = Math.floor(combinedMeta.height / 32);
const tileCount = tilesWide * tilesTall;

// Field section: 5 cols x 15 rows = tiles 0..74
// House section starts at row 15: 33 cols x 23 rows
// Nature section starts at row 38: 24 cols x 21 rows

// Let's place some recognizable tiles on a 20x20 map
// Field tiles (grass) are in the first rows of the tileset
// We'll make a simple grass field with some houses

const MAP_W = 20;
const MAP_H = 20;

// Field section: first 5 columns, 15 rows -> GIDs 1 to (5*15)=75
// The first few tiles in Field are typically grass variants
// House section starts at tile index: 15 * tilesWide = 15 * 33 = 495, so GID 496+

// Let's identify specific tiles by looking at the tileset layout
// Field (5 wide): row 0 = grass variants (tiles 0-4)
// We'll use tile index 0 (GID 1) as basic grass

const fieldFirstTile = 1; // GID 1 = first tile
const houseStart = 15 * tilesWide + 1; // GID for first house tile

// Create ground layer - all grass (GID 1)
const groundData = new Array(MAP_W * MAP_H).fill(1);

// Create detail layer - place some house tiles
const detailData = new Array(MAP_W * MAP_H).fill(0);

// Place a 4x3 house block in the center area (rows 5-7, cols 8-11)
// House tiles start at row 15 in the combined tileset
// A typical house in NinjaAdventure uses tiles from TilesetHouse
// The house GIDs start after the Field section
const houseRowStart = 15; // row where House tileset begins in combined
for (let row = 0; row < 3; row++) {
  for (let col = 0; col < 4; col++) {
    const tileIdx = (houseRowStart + row) * tilesWide + col;
    const gid = tileIdx + 1;
    const mapIdx = (5 + row) * MAP_W + (8 + col);
    detailData[mapIdx] = gid;
  }
}

// Place another house block
for (let row = 0; row < 3; row++) {
  for (let col = 0; col < 4; col++) {
    const tileIdx = (houseRowStart + row) * tilesWide + (col + 4);
    const gid = tileIdx + 1;
    const mapIdx = (10 + row) * MAP_W + (3 + col);
    detailData[mapIdx] = gid;
  }
}

// Place some nature tiles (trees) from the Nature section
const natureRowStart = 15 + 23; // House is 23 rows (736/32)
for (let row = 0; row < 2; row++) {
  for (let col = 0; col < 2; col++) {
    const tileIdx = (natureRowStart + row) * tilesWide + col;
    const gid = tileIdx + 1;
    // Place trees around edges
    detailData[(2 + row) * MAP_W + (2 + col)] = gid;
    detailData[(2 + row) * MAP_W + (16 + col)] = gid;
    detailData[(15 + row) * MAP_W + (2 + col)] = gid;
    detailData[(15 + row) * MAP_W + (16 + col)] = gid;
  }
}

// Vary the ground a bit - use different grass tiles
for (let y = 0; y < MAP_H; y++) {
  for (let x = 0; x < MAP_W; x++) {
    // Use tiles from first 2 rows of Field (indices 0-9)
    const variant = ((x * 3 + y * 7) % 5); // pseudo-random
    groundData[y * MAP_W + x] = variant + 1; // GID 1-5
  }
}

const tiledMap = {
  compressionlevel: -1,
  height: MAP_H,
  infinite: false,
  layers: [
    {
      data: groundData,
      height: MAP_H,
      id: 1,
      name: 'ground',
      opacity: 1,
      type: 'tilelayer',
      visible: true,
      width: MAP_W,
      x: 0,
      y: 0,
    },
    {
      data: detailData,
      height: MAP_H,
      id: 2,
      name: 'details',
      opacity: 1,
      type: 'tilelayer',
      visible: true,
      width: MAP_W,
      x: 0,
      y: 0,
    },
    {
      draworder: 'topdown',
      id: 3,
      name: 'objects',
      objects: [],
      opacity: 1,
      type: 'objectgroup',
      visible: true,
      x: 0,
      y: 0,
    },
  ],
  nextlayerid: 4,
  nextobjectid: 1,
  orientation: 'orthogonal',
  renderorder: 'right-down',
  tiledversion: '1.11.0',
  tileheight: 32,
  tilesets: [
    {
      columns: tilesWide,
      firstgid: 1,
      image: '../tilesets/ninja_combined.png',
      imageheight: combinedMeta.height,
      imagewidth: combinedMeta.width,
      margin: 0,
      name: 'ninja_combined',
      spacing: 0,
      tilecount: tileCount,
      tileheight: 32,
      tilewidth: 32,
    },
  ],
  tilewidth: 32,
  type: 'map',
  version: '1.10',
  width: MAP_W,
};

await writeFile(
  path.join(MAPS_OUT, 'test_ninja.tmj'),
  JSON.stringify(tiledMap, null, 2)
);

console.log(`  test_ninja.tmj: ${MAP_W}x${MAP_H} map with ninja_combined tileset`);
console.log(`  Tileset: ${tilesWide} cols, ${tilesTall} rows, ${tileCount} tiles`);

console.log('\n=== All done! ===');
