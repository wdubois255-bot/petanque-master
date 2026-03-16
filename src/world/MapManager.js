import { TILE_SIZE } from '../utils/Constants.js';
import { TILES } from './TilesetGenerator.js';

// Tileset constants
const TILESET_NAME = 'basechip_combined';
const TILESET_COLS = 8;

// ===== VILLAGE DE DEPART: 30x30 =====
function createVillageMap() {
    const W = 30, H = 30;
    const { ground, buildings, collisions, above } = emptyMap(W, H);

    // Paths (horizontal main road y=14-15, vertical road x=14-15)
    for (let x = 0; x < W; x++) {
        ground[14][x] = TILES.PATH;
        ground[15][x] = TILES.PATH;
    }
    for (let y = 0; y < H; y++) {
        ground[y][14] = TILES.PATH;
        ground[y][15] = TILES.PATH;
    }

    // Path to south exit
    for (let y = 26; y < H; y++) {
        ground[y][14] = TILES.PATH;
        ground[y][15] = TILES.PATH;
    }

    // Some grass variety
    const darkGrassSpots = [
        [4, 5], [7, 8], [18, 4], [22, 8], [3, 18], [8, 22],
        [20, 19], [25, 23], [10, 25], [16, 27]
    ];
    for (const [x, y] of darkGrassSpots) {
        ground[y][x] = TILES.GRASS_DARK;
    }

    // Flowers along paths
    const flowerSpots = [
        [12, 13, TILES.FLOWER], [17, 13, TILES.FLOWER_YELLOW],
        [12, 16, TILES.FLOWER_BLUE], [17, 16, TILES.FLOWER],
        [6, 13, TILES.FLOWER_WHITE], [8, 16, TILES.FLOWER_YELLOW],
        [20, 13, TILES.FLOWER], [22, 16, TILES.FLOWER_BLUE]
    ];
    for (const [x, y, tile] of flowerSpots) {
        buildings[y][x] = tile;
    }

    // Houses (sprite-based)
    const houses = [];
    placeHouse(buildings, collisions, above, 3, 3, 5, 4, houses, 'house_large_green');
    placeHouse(buildings, collisions, above, 20, 3, 5, 4, houses, 'house_large_blue');
    placeHouse(buildings, collisions, above, 3, 9, 4, 3, houses, 'house_small_brown');

    // Terrain de petanque (bas droite)
    for (let y = 18; y < 24; y++) {
        for (let x = 19; x < 27; x++) {
            ground[y][x] = TILES.PETANQUE_TERRAIN;
        }
    }
    // Fence around terrain
    for (let x = 18; x < 28; x++) {
        buildings[17][x] = TILES.FENCE_H; collisions[17][x] = 1;
        buildings[24][x] = TILES.FENCE_H; collisions[24][x] = 1;
    }
    for (let y = 17; y < 25; y++) {
        buildings[y][18] = TILES.FENCE; collisions[y][18] = 1;
        buildings[y][27] = TILES.FENCE; collisions[y][27] = 1;
    }

    // Trees
    const treePositions = [
        [0, 0], [1, 0], [2, 0], [5, 0], [9, 0], [10, 0],
        [16, 0], [17, 0], [25, 0], [26, 0], [27, 0], [28, 0], [29, 0],
        [0, 1], [0, 5], [0, 8], [0, 12], [0, 18], [0, 22], [0, 26],
        [29, 5], [29, 10], [29, 15], [29, 20], [29, 25],
        [10, 5], [11, 9], [25, 10], [9, 20], [5, 24],
    ];
    placeTrees(treePositions, buildings, collisions, above);

    // Water (small pond top-center)
    for (let y = 2; y < 4; y++) {
        for (let x = 12; x < 16; x++) {
            ground[y][x] = TILES.WATER;
            collisions[y][x] = 1;
        }
    }

    // Small rocks for decoration
    buildings[7][18] = TILES.ROCK_SMALL;
    buildings[20][8] = TILES.ROCK_SMALL;

    // World borders
    setBorders(collisions, W, H);
    // South exit opening
    collisions[H - 1][14] = 0;
    collisions[H - 1][15] = 0;

    return { ground, buildings, collisions, above, houses, width: W, height: H };
}

// ===== ROUTE 1: 20x60 (long vertical road) =====
function createRoute1Map() {
    const W = 20, H = 60;
    const { ground, buildings, collisions, above } = emptyMap(W, H);

    // Central path (x=9-10)
    for (let y = 0; y < H; y++) {
        ground[y][9] = TILES.PATH;
        ground[y][10] = TILES.PATH;
    }

    // Side paths
    for (let x = 3; x < 9; x++) {
        ground[20][x] = TILES.PATH;
    }
    for (let x = 11; x < 17; x++) {
        ground[35][x] = TILES.PATH;
    }

    // Grass variety along the route
    for (let y = 0; y < H; y += 3) {
        for (let x = 0; x < W; x += 4) {
            if (ground[y][x] === TILES.GRASS && Math.abs(x - 9.5) > 2) {
                ground[y][x] = TILES.GRASS_DARK;
            }
        }
    }

    // Flowers
    const flowers = [
        [3, 5, TILES.FLOWER], [16, 8, TILES.FLOWER_YELLOW],
        [4, 18, TILES.FLOWER_BLUE], [15, 25, TILES.FLOWER],
        [6, 38, TILES.FLOWER_WHITE], [14, 48, TILES.FLOWER_YELLOW],
        [3, 52, TILES.FLOWER], [17, 55, TILES.FLOWER_BLUE]
    ];
    for (const [x, y, tile] of flowers) {
        buildings[y][x] = tile;
    }

    // Trees along the route
    const trees = [
        // Left border trees
        [0, 0], [1, 0], [0, 4], [0, 8], [1, 12], [0, 16],
        [0, 22], [1, 26], [0, 30], [0, 34], [1, 40], [0, 44],
        [0, 48], [1, 52], [0, 56],
        // Right border trees
        [19, 0], [18, 0], [19, 6], [19, 10], [18, 14],
        [19, 20], [19, 24], [18, 28], [19, 32], [19, 38],
        [18, 42], [19, 46], [19, 50], [18, 54], [19, 58],
        // Decorative inner trees
        [4, 10], [15, 12], [3, 28], [16, 33],
        [5, 42], [14, 44], [3, 55], [16, 57],
        // Dense section middle
        [6, 25], [7, 25], [13, 25], [14, 25],
    ];
    placeTrees(trees, buildings, collisions, above);

    // Small rest area with bench-like fences
    for (let x = 12; x < 16; x++) {
        buildings[20][x] = TILES.FENCE_H;
        collisions[20][x] = 1;
    }

    // Water crossing (small stream)
    for (let x = 0; x < W; x++) {
        if (x === 9 || x === 10) continue; // Bridge on path
        ground[40][x] = TILES.WATER;
        collisions[40][x] = 1;
        ground[41][x] = TILES.WATER;
        collisions[41][x] = 1;
    }
    // Bridge tiles on path
    ground[40][9] = TILES.PATH;
    ground[40][10] = TILES.PATH;
    ground[41][9] = TILES.PATH;
    ground[41][10] = TILES.PATH;

    // Rocks near stream
    buildings[39][4] = TILES.ROCK_LARGE;
    buildings[42][15] = TILES.ROCK_SMALL;

    // World borders
    setBorders(collisions, W, H);
    // North entrance (from village_depart)
    collisions[0][9] = 0;
    collisions[0][10] = 0;
    // South exit (to village_arene_1)
    collisions[H - 1][9] = 0;
    collisions[H - 1][10] = 0;

    return { ground, buildings, collisions, above, width: W, height: H };
}

// ===== VILLAGE ARENE 1: 30x30 =====
function createVillageArene1Map() {
    const W = 30, H = 30;
    const { ground, buildings, collisions, above } = emptyMap(W, H);

    // Central paths
    for (let x = 0; x < W; x++) {
        ground[14][x] = TILES.PATH;
        ground[15][x] = TILES.PATH;
    }
    for (let y = 0; y < H; y++) {
        ground[y][14] = TILES.PATH;
        ground[y][15] = TILES.PATH;
    }

    // Cobblestone plaza around arena entrance
    for (let y = 12; y < 17; y++) {
        for (let x = 12; x < 18; x++) {
            ground[y][x] = TILES.COBBLESTONE;
        }
    }

    // Flowers
    const flowers = [
        [12, 13, TILES.FLOWER], [17, 13, TILES.FLOWER_YELLOW],
        [12, 16, TILES.FLOWER_BLUE], [17, 16, TILES.FLOWER],
        [5, 13, TILES.FLOWER_WHITE], [8, 16, TILES.FLOWER_YELLOW],
        [20, 13, TILES.FLOWER], [24, 16, TILES.FLOWER_BLUE],
        [10, 7, TILES.FLOWER], [19, 7, TILES.FLOWER_YELLOW],
        [10, 22, TILES.FLOWER_WHITE], [19, 22, TILES.FLOWER]
    ];
    for (const [x, y, tile] of flowers) {
        buildings[y][x] = tile;
    }

    // === ARENE DE MARCEL (centre-haut) ===
    // Grand terrain de petanque (arene)
    for (let y = 3; y < 11; y++) {
        for (let x = 8; x < 22; x++) {
            ground[y][x] = TILES.PETANQUE_TERRAIN;
        }
    }
    // Fence around arene
    for (let x = 7; x < 23; x++) {
        buildings[2][x] = TILES.FENCE_H; collisions[2][x] = 1;
        buildings[11][x] = TILES.FENCE_H; collisions[11][x] = 1;
    }
    for (let y = 2; y < 12; y++) {
        buildings[y][7] = TILES.FENCE; collisions[y][7] = 1;
        buildings[y][22] = TILES.FENCE; collisions[y][22] = 1;
    }
    // Entrance to arene
    buildings[11][14] = -1; collisions[11][14] = 0;
    buildings[11][15] = -1; collisions[11][15] = 0;

    // Houses (sprite-based)
    const houses = [];
    placeHouse(buildings, collisions, above, 2, 3, 4, 3, houses, 'house_small_green');
    placeHouse(buildings, collisions, above, 24, 3, 4, 3, houses, 'house_small_blue');
    placeHouse(buildings, collisions, above, 2, 18, 5, 4, houses, 'house_large_brown');
    placeHouse(buildings, collisions, above, 23, 18, 5, 4, houses, 'house_large_green');

    // Trees
    const trees = [
        [0, 0], [1, 0], [2, 0], [3, 0], [26, 0], [27, 0], [28, 0], [29, 0],
        [0, 1], [0, 6], [0, 10], [0, 16], [0, 22], [0, 26],
        [29, 1], [29, 6], [29, 10], [29, 16], [29, 22], [29, 26],
        [5, 14], [24, 14], [10, 24], [19, 24],
        [3, 26], [26, 26],
    ];
    placeTrees(trees, buildings, collisions, above);

    // World borders
    setBorders(collisions, W, H);
    // North entrance (from route_1)
    collisions[0][14] = 0;
    collisions[0][15] = 0;
    // South exit (to route_2 - blocked by gate until badge_marcel)
    collisions[H - 1][14] = 0;
    collisions[H - 1][15] = 0;

    return { ground, buildings, collisions, above, houses, width: W, height: H };
}

// ===== ROUTE 2: 35x20 (horizontal road) =====
function createRoute2Map() {
    const W = 35, H = 20;
    const { ground, buildings, collisions, above } = emptyMap(W, H);

    // Horizontal path (y=9-10)
    for (let x = 0; x < W; x++) {
        ground[9][x] = TILES.PATH;
        ground[10][x] = TILES.PATH;
    }

    // Some sand patches
    for (let y = 6; y < 8; y++) {
        for (let x = 20; x < 26; x++) {
            ground[y][x] = TILES.SAND;
        }
    }

    // Grass variety
    for (let y = 0; y < H; y += 3) {
        for (let x = 2; x < W; x += 5) {
            if (ground[y][x] === TILES.GRASS) ground[y][x] = TILES.GRASS_DARK;
        }
    }

    // Flowers
    const flowers = [
        [5, 7, TILES.FLOWER], [12, 12, TILES.FLOWER_YELLOW],
        [25, 7, TILES.FLOWER_BLUE], [30, 12, TILES.FLOWER]
    ];
    for (const [x, y, tile] of flowers) {
        if (x < W && y < H) buildings[y][x] = tile;
    }

    // Trees
    const trees = [
        [0, 0], [5, 0], [10, 0], [15, 0], [20, 0], [25, 0], [30, 0], [34, 0],
        [0, 19], [5, 19], [10, 19], [15, 19], [20, 19], [25, 19], [30, 19], [34, 19],
        [3, 4], [8, 14], [18, 5], [28, 14],
    ];
    placeTrees(trees, buildings, collisions, above);

    // Water (small pond)
    for (let y = 13; y < 16; y++) {
        for (let x = 14; x < 18; x++) {
            ground[y][x] = TILES.WATER;
            collisions[y][x] = 1;
        }
    }

    // Borders
    setBorders(collisions, W, H);
    // West entrance (from village_arene_1) - path at y=9-10
    collisions[9][0] = 0;
    collisions[10][0] = 0;
    // East exit (to village_arene_2) - path at y=9-10
    collisions[9][W - 1] = 0;
    collisions[10][W - 1] = 0;

    return { ground, buildings, collisions, above, width: W, height: H };
}

// ===== VILLAGE ARENE 2: 25x25 =====
function createVillageArene2Map() {
    const W = 25, H = 25;
    const { ground, buildings, collisions, above } = emptyMap(W, H);

    // Main paths
    for (let x = 0; x < W; x++) {
        ground[12][x] = TILES.PATH;
        ground[13][x] = TILES.PATH;
    }
    for (let y = 0; y < H; y++) {
        ground[y][12] = TILES.PATH;
        ground[y][13] = TILES.PATH;
    }

    // Cobblestone central plaza
    for (let y = 10; y < 15; y++) {
        for (let x = 10; x < 16; x++) {
            ground[y][x] = TILES.COBBLESTONE;
        }
    }

    // Arena terrain (top area)
    for (let y = 2; y < 8; y++) {
        for (let x = 6; x < 20; x++) {
            ground[y][x] = TILES.PETANQUE_TERRAIN;
        }
    }
    for (let x = 5; x < 21; x++) {
        buildings[1][x] = TILES.FENCE_H; collisions[1][x] = 1;
        buildings[8][x] = TILES.FENCE_H; collisions[8][x] = 1;
    }
    for (let y = 1; y < 9; y++) {
        buildings[y][5] = TILES.FENCE; collisions[y][5] = 1;
        buildings[y][20] = TILES.FENCE; collisions[y][20] = 1;
    }
    buildings[8][12] = -1; collisions[8][12] = 0;
    buildings[8][13] = -1; collisions[8][13] = 0;

    // Houses (sprite-based)
    const houses = [];
    placeHouse(buildings, collisions, above, 2, 10, 4, 3, houses, 'house_small_blue');
    placeHouse(buildings, collisions, above, 19, 10, 4, 3, houses, 'house_small_green');
    placeHouse(buildings, collisions, above, 2, 17, 4, 3, houses, 'house_small_brown');
    placeHouse(buildings, collisions, above, 19, 17, 4, 3, houses, 'house_small_blue');

    // Trees
    const trees = [
        [0, 0], [1, 0], [23, 0], [24, 0],
        [0, 5], [0, 10], [0, 15], [0, 20], [0, 24],
        [24, 5], [24, 10], [24, 15], [24, 20], [24, 24],
        [8, 20], [16, 20],
    ];
    placeTrees(trees, buildings, collisions, above);

    // Flowers
    const flowers = [
        [10, 11, TILES.FLOWER], [15, 11, TILES.FLOWER_BLUE],
        [10, 14, TILES.FLOWER_YELLOW], [15, 14, TILES.FLOWER],
    ];
    for (const [x, y, tile] of flowers) {
        buildings[y][x] = tile;
    }

    // Borders
    setBorders(collisions, W, H);
    collisions[12][0] = 0;
    collisions[13][0] = 0;
    collisions[H - 1][12] = 0;
    collisions[H - 1][13] = 0;

    return { ground, buildings, collisions, above, houses, width: W, height: H };
}

// ===== ROUTE 3: 35x20 (horizontal road) =====
function createRoute3Map() {
    const W = 35, H = 20;
    const { ground, buildings, collisions, above } = emptyMap(W, H);

    // Horizontal path
    for (let x = 0; x < W; x++) {
        ground[9][x] = TILES.PATH;
        ground[10][x] = TILES.PATH;
    }

    // Sandy area
    for (let y = 3; y < 7; y++) {
        for (let x = 10; x < 18; x++) {
            ground[y][x] = TILES.SAND;
        }
    }

    // Grass variety
    for (let y = 1; y < H; y += 4) {
        for (let x = 1; x < W; x += 3) {
            if (ground[y][x] === TILES.GRASS) ground[y][x] = TILES.GRASS_DARK;
        }
    }

    // Trees
    const trees = [
        [0, 0], [4, 0], [8, 0], [20, 0], [26, 0], [34, 0],
        [0, 19], [6, 19], [14, 19], [22, 19], [28, 19], [34, 19],
        [2, 6], [32, 14], [15, 15],
    ];
    placeTrees(trees, buildings, collisions, above);

    // Water stream crossing
    for (let y = 0; y < H; y++) {
        if (y === 9 || y === 10) continue;
        ground[y][25] = TILES.WATER;
        collisions[y][25] = 1;
    }

    // Flowers
    buildings[7][5] = TILES.FLOWER;
    buildings[13][30] = TILES.FLOWER_YELLOW;

    // Borders
    setBorders(collisions, W, H);
    collisions[9][0] = 0;
    collisions[10][0] = 0;
    collisions[9][W - 1] = 0;
    collisions[10][W - 1] = 0;

    return { ground, buildings, collisions, above, width: W, height: H };
}

// ===== VILLAGE ARENE 3: 25x25 =====
function createVillageArene3Map() {
    const W = 25, H = 25;
    const { ground, buildings, collisions, above } = emptyMap(W, H);

    // Main paths
    for (let x = 0; x < W; x++) {
        ground[12][x] = TILES.PATH;
        ground[13][x] = TILES.PATH;
    }
    for (let y = 0; y < H; y++) {
        ground[y][12] = TILES.PATH;
        ground[y][13] = TILES.PATH;
    }

    // Stone slab plaza
    for (let y = 10; y < 15; y++) {
        for (let x = 10; x < 16; x++) {
            ground[y][x] = TILES.STONE_SLAB;
        }
    }

    // Arena terrain
    for (let y = 2; y < 9; y++) {
        for (let x = 5; x < 21; x++) {
            ground[y][x] = TILES.PETANQUE_TERRAIN;
        }
    }
    for (let x = 4; x < 22; x++) {
        buildings[1][x] = TILES.FENCE_H; collisions[1][x] = 1;
        buildings[9][x] = TILES.FENCE_H; collisions[9][x] = 1;
    }
    for (let y = 1; y < 10; y++) {
        buildings[y][4] = TILES.FENCE; collisions[y][4] = 1;
        buildings[y][21] = TILES.FENCE; collisions[y][21] = 1;
    }
    buildings[9][12] = -1; collisions[9][12] = 0;
    buildings[9][13] = -1; collisions[9][13] = 0;

    // Houses (sprite-based)
    const houses = [];
    placeHouse(buildings, collisions, above, 1, 10, 4, 3, houses, 'house_small_green');
    placeHouse(buildings, collisions, above, 20, 10, 4, 3, houses, 'house_small_brown');
    placeHouse(buildings, collisions, above, 1, 17, 5, 4, houses, 'house_large_blue');
    placeHouse(buildings, collisions, above, 19, 17, 5, 4, houses, 'house_large_brown');

    // Trees
    const trees = [
        [0, 0], [1, 0], [2, 0], [22, 0], [23, 0], [24, 0],
        [0, 5], [0, 15], [0, 20], [0, 24],
        [24, 5], [24, 15], [24, 20], [24, 24],
        [7, 22], [17, 22],
    ];
    placeTrees(trees, buildings, collisions, above);

    // Borders
    setBorders(collisions, W, H);
    collisions[12][0] = 0;
    collisions[13][0] = 0;
    collisions[H - 1][12] = 0;
    collisions[H - 1][13] = 0;

    return { ground, buildings, collisions, above, houses, width: W, height: H };
}

// ===== ARENE FINALE: 30x25 =====
function createAreneFinaleMap() {
    const W = 30, H = 25;
    const { ground, buildings, collisions, above } = emptyMap(W, H);

    // Grand stone slab plaza
    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            ground[y][x] = TILES.COBBLESTONE;
        }
    }

    // Central petanque arena
    for (let y = 4; y < 18; y++) {
        for (let x = 5; x < 25; x++) {
            ground[y][x] = TILES.PETANQUE_TERRAIN;
        }
    }

    // Fence around grand arena
    for (let x = 4; x < 26; x++) {
        buildings[3][x] = TILES.FENCE_H; collisions[3][x] = 1;
        buildings[18][x] = TILES.FENCE_H; collisions[18][x] = 1;
    }
    for (let y = 3; y < 19; y++) {
        buildings[y][4] = TILES.FENCE; collisions[y][4] = 1;
        buildings[y][25] = TILES.FENCE; collisions[y][25] = 1;
    }
    // Entrance
    buildings[18][14] = -1; collisions[18][14] = 0;
    buildings[18][15] = -1; collisions[18][15] = 0;

    // Path to entrance
    for (let y = 19; y < H; y++) {
        ground[y][14] = TILES.PATH;
        ground[y][15] = TILES.PATH;
    }

    // Decorative trees in corners
    const trees = [
        [0, 0], [1, 0], [28, 0], [29, 0],
        [0, 24], [1, 24], [28, 24], [29, 24],
        [2, 20], [27, 20],
    ];
    placeTrees(trees, buildings, collisions, above);

    // Flowers along entrance
    buildings[20][12] = TILES.FLOWER;
    buildings[20][17] = TILES.FLOWER_YELLOW;
    buildings[22][12] = TILES.FLOWER_BLUE;
    buildings[22][17] = TILES.FLOWER;

    // Borders
    setBorders(collisions, W, H);
    collisions[H - 1][14] = 0;
    collisions[H - 1][15] = 0;

    return { ground, buildings, collisions, above, width: W, height: H };
}

// ===== UTILITY FUNCTIONS =====
function emptyMap(W, H) {
    const ground = [];
    const buildings = [];
    const collisions = [];
    const above = [];
    for (let y = 0; y < H; y++) {
        ground.push(Array(W).fill(TILES.GRASS));
        buildings.push(Array(W).fill(-1));
        collisions.push(Array(W).fill(0));
        above.push(Array(W).fill(-1));
    }
    return { ground, buildings, collisions, above };
}

// House sprite types for visual placement
const HOUSE_SPRITES = [
    'house_small_green', 'house_small_blue', 'house_small_brown',
    'house_large_green', 'house_large_blue', 'house_large_brown'
];

function placeHouse(buildings, collisions, above, startX, startY, w, h, houseList, spriteKey) {
    // Only set collisions (no ugly tile visuals anymore)
    for (let y = startY; y < startY + h; y++) {
        for (let x = startX; x < startX + w; x++) {
            collisions[y][x] = 1;
        }
    }
    // Leave door tile walkable? No - house is a sprite, player can't enter
    // Record house position for sprite placement
    if (houseList) {
        houseList.push({
            spriteKey: spriteKey || HOUSE_SPRITES[houseList.length % 3],
            tileX: startX,
            tileY: startY,
            tileW: w,
            tileH: h
        });
    }
}

function placeTrees(positions, buildings, collisions, above) {
    for (const [x, y] of positions) {
        if (y > 0) {
            above[y - 1][x] = TILES.TREE_TOP;
            collisions[y - 1][x] = 1;
        }
        buildings[y][x] = TILES.TREE_TRUNK;
        collisions[y][x] = 1;
    }
}

function setBorders(collisions, W, H) {
    for (let x = 0; x < W; x++) {
        collisions[0][x] = 1;
        collisions[H - 1][x] = 1;
    }
    for (let y = 0; y < H; y++) {
        collisions[y][0] = 1;
        collisions[y][W - 1] = 1;
    }
}

// ===== MAP REGISTRY =====
export const MAPS = {
    village_depart: createVillageMap,
    route_1: createRoute1Map,
    village_arene_1: createVillageArene1Map,
    route_2: createRoute2Map,
    village_arene_2: createVillageArene2Map,
    route_3: createRoute3Map,
    village_arene_3: createVillageArene3Map,
    arene_finale: createAreneFinaleMap,
};

// ===== MAP EXITS =====
const MAP_EXITS = {
    village_depart: [
        { tileX: [14, 15], tileY: 29, target: { map: 'route_1', spawnX: 9, spawnY: 1 } }
    ],
    route_1: [
        { tileX: [9, 10], tileY: 0, target: { map: 'village_depart', spawnX: 14, spawnY: 28 } },
        { tileX: [9, 10], tileY: 59, target: { map: 'village_arene_1', spawnX: 14, spawnY: 1 } }
    ],
    village_arene_1: [
        { tileX: [14, 15], tileY: 0, target: { map: 'route_1', spawnX: 9, spawnY: 58 } },
        { tileX: [14, 15], tileY: 29, target: { map: 'route_2', spawnX: 1, spawnY: 9 } }
    ],
    route_2: [
        // West entrance (from village_arene_1) - left edge, path at y=9-10
        { tileX: 0, tileY: [9, 10], target: { map: 'village_arene_1', spawnX: 14, spawnY: 28 } },
        // East exit (to village_arene_2) - right edge
        { tileX: 34, tileY: [9, 10], target: { map: 'village_arene_2', spawnX: 1, spawnY: 12 } }
    ],
    village_arene_2: [
        // West entrance (from route_2)
        { tileX: 0, tileY: [12, 13], target: { map: 'route_2', spawnX: 33, spawnY: 9 } },
        // South exit (to route_3)
        { tileX: [12, 13], tileY: 24, target: { map: 'route_3', spawnX: 1, spawnY: 9 } }
    ],
    route_3: [
        // West entrance (from village_arene_2)
        { tileX: 0, tileY: [9, 10], target: { map: 'village_arene_2', spawnX: 12, spawnY: 23 } },
        // East exit (to village_arene_3)
        { tileX: 34, tileY: [9, 10], target: { map: 'village_arene_3', spawnX: 1, spawnY: 12 } }
    ],
    village_arene_3: [
        // West entrance (from route_3)
        { tileX: 0, tileY: [12, 13], target: { map: 'route_3', spawnX: 33, spawnY: 9 } },
        // South exit (to arene_finale)
        { tileX: [12, 13], tileY: 24, target: { map: 'arene_finale', spawnX: 14, spawnY: 23 } }
    ],
    arene_finale: [
        { tileX: [14, 15], tileY: 24, target: { map: 'village_arene_3', spawnX: 12, spawnY: 23 } }
    ]
};

export default class MapManager {
    constructor(scene) {
        this.scene = scene;
        this.currentMap = null;
        this.currentMapName = null;
        this.layers = {};
    }

    loadMap(mapName) {
        // Destroy previous layers
        if (this.layers.ground) this.layers.ground.destroy();
        if (this.layers.buildings) this.layers.buildings.destroy();
        if (this.layers.above) this.layers.above.destroy();
        // Destroy previous house sprites
        if (this.houseSprites) {
            for (const s of this.houseSprites) s.destroy();
        }
        this.houseSprites = [];

        const mapData = MAPS[mapName]();
        this.currentMap = mapData;
        this.currentMapName = mapName;

        const map = this.scene.make.tilemap({
            data: mapData.ground,
            tileWidth: TILE_SIZE,
            tileHeight: TILE_SIZE
        });
        const tileset = map.addTilesetImage(TILESET_NAME, TILESET_NAME, TILE_SIZE, TILE_SIZE);
        this.layers.ground = map.createLayer(0, tileset);

        const buildingsMap = this.scene.make.tilemap({
            data: mapData.buildings,
            tileWidth: TILE_SIZE,
            tileHeight: TILE_SIZE
        });
        const bTileset = buildingsMap.addTilesetImage(TILESET_NAME, TILESET_NAME, TILE_SIZE, TILE_SIZE);
        this.layers.buildings = buildingsMap.createLayer(0, bTileset).setDepth(5);

        const aboveMap = this.scene.make.tilemap({
            data: mapData.above,
            tileWidth: TILE_SIZE,
            tileHeight: TILE_SIZE
        });
        const aTileset = aboveMap.addTilesetImage(TILESET_NAME, TILESET_NAME, TILE_SIZE, TILE_SIZE);
        this.layers.above = aboveMap.createLayer(0, aTileset).setDepth(20);

        // Place house sprites
        if (mapData.houses) {
            for (const h of mapData.houses) {
                if (!this.scene.textures.exists(h.spriteKey)) continue;
                // Position: bottom-center of the collision footprint
                const footprintCenterX = (h.tileX + h.tileW / 2) * TILE_SIZE;
                const footprintBottomY = (h.tileY + h.tileH) * TILE_SIZE;
                const sprite = this.scene.add.image(footprintCenterX, footprintBottomY, h.spriteKey);
                sprite.setOrigin(0.5, 1); // anchor at bottom-center
                sprite.setDepth(8); // between buildings (5) and above (20)
                this.houseSprites.push(sprite);
            }
        }

        return mapData;
    }

    isWalkable(tileX, tileY) {
        if (!this.currentMap) return false;
        if (tileX < 0 || tileX >= this.currentMap.width) return false;
        if (tileY < 0 || tileY >= this.currentMap.height) return false;
        return this.currentMap.collisions[tileY][tileX] === 0;
    }

    getMapPixelSize() {
        if (!this.currentMap) return { w: 0, h: 0 };
        return {
            w: this.currentMap.width * TILE_SIZE,
            h: this.currentMap.height * TILE_SIZE
        };
    }

    isExit(tileX, tileY) {
        if (!this.currentMapName) return null;
        const exits = MAP_EXITS[this.currentMapName];
        if (!exits) return null;

        for (const exit of exits) {
            const matchX = Array.isArray(exit.tileX)
                ? exit.tileX.includes(tileX)
                : exit.tileX === tileX;
            const matchY = Array.isArray(exit.tileY)
                ? exit.tileY.includes(tileY)
                : exit.tileY === tileY;
            if (matchX && matchY) {
                return exit.target;
            }
        }
        return null;
    }
}
