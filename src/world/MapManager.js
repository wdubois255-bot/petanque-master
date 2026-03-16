import { TILE_SIZE } from '../utils/Constants.js';
import { TILES } from './TilesetGenerator.js';

// Tileset constants
const TILESET_NAME = 'basechip_combined';
const TILESET_COLS = 8;

// ===== HOUSE STYLES (from Pipoya TMX building layer analysis) =====
// Each style is a column in the basechip rows 70-73 (roof+wall) and 44-45 (base+door)
// Structure: roof_top(row70), roof_bot(row71), wall(row72), wall_windows(row73), base(row44), base_door(row45)
const HOUSE_STYLES = {
    wood:  { roof: 560, roofB: 568, wall: 576, winWall: 584, base: 352, baseM: 353, door: 359, baseR: 354 },
    tan:   { roof: 561, roofB: 569, wall: 577, winWall: 585, base: 352, baseM: 353, door: 359, baseR: 354 },
    blue:  { roof: 562, roofB: 570, wall: 578, winWall: 586, base: 352, baseM: 353, door: 359, baseR: 354 },
    red:   { roof: 563, roofB: 571, wall: 579, winWall: 587, base: 352, baseM: 353, door: 359, baseR: 354 },
    grey:  { roof: 564, roofB: 572, wall: 580, winWall: 588, base: 352, baseM: 353, door: 359, baseR: 354 },
    straw: { roof: 566, roofB: 574, wall: 582, winWall: 590, base: 352, baseM: 353, door: 359, baseR: 354 },
};

// ===== LARGE TREE DEFINITIONS =====
const LARGE_TREES = {
    green:  [TILES.TREE_GREEN_TL,  TILES.TREE_GREEN_TR,  TILES.TREE_GREEN_BL,  TILES.TREE_GREEN_BR],
    dark:   [TILES.TREE_DARK_TL,   TILES.TREE_DARK_TR,   TILES.TREE_DARK_BL,   TILES.TREE_DARK_BR],
    autumn: [TILES.TREE_AUTUMN_TL, TILES.TREE_AUTUMN_TR, TILES.TREE_AUTUMN_BL, TILES.TREE_AUTUMN_BR],
    dead:   [TILES.TREE_DEAD_TL,   TILES.TREE_DEAD_TR,   TILES.TREE_DEAD_BL,   TILES.TREE_DEAD_BR],
};

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

// Place a house using EXACT Pipoya TMX tile structure.
// 5 rows: roof_top, roof_bottom, wall, wall_with_windows, base_with_door
// w >= 3, style = 'wood'|'tan'|'blue'|'red'|'grey'|'straw'
function placeHouse(buildings, collisions, above, startX, startY, w, h, style) {
    const s = HOUSE_STYLES[style] || HOUSE_STYLES.wood;

    // Row 0: roof top (above layer, same tile repeated)
    for (let x = startX; x < startX + w; x++) {
        above[startY][x] = s.roof;
        collisions[startY][x] = 1;
    }

    // Row 1: roof bottom (above layer)
    for (let x = startX; x < startX + w; x++) {
        above[startY + 1][x] = s.roofB;
        collisions[startY + 1][x] = 1;
    }

    // Row 2: wall (buildings layer, same tile repeated)
    for (let x = startX; x < startX + w; x++) {
        buildings[startY + 2][x] = s.wall;
        collisions[startY + 2][x] = 1;
    }

    // Row 3: wall with windows (buildings layer)
    for (let x = startX; x < startX + w; x++) {
        buildings[startY + 3][x] = s.winWall;
        collisions[startY + 3][x] = 1;
    }

    // Row 4: base with door in center (buildings layer)
    const doorX = startX + Math.floor(w / 2);
    for (let x = startX; x < startX + w; x++) {
        buildings[startY + 4][x] = s.baseM;
        collisions[startY + 4][x] = 1;
    }
    buildings[startY + 4][startX] = s.base;
    buildings[startY + 4][startX + w - 1] = s.baseR;
    buildings[startY + 4][doorX] = s.door;
}

// Place a 2x2 well
function placeWell(buildings, collisions, x, y) {
    buildings[y][x] = TILES.WELL_TL;
    buildings[y][x + 1] = TILES.WELL_TR;
    buildings[y + 1][x] = TILES.WELL_BL;
    buildings[y + 1][x + 1] = TILES.WELL_BR;
    collisions[y][x] = 1;
    collisions[y][x + 1] = 1;
    collisions[y + 1][x] = 1;
    collisions[y + 1][x + 1] = 1;
}

// Place a horizontal bridge over water (2 rows tall, length tiles wide)
function placeBridge(ground, buildings, collisions, x, y, length) {
    for (let i = 0; i < length; i++) {
        const bx = x + i;
        // Top row of bridge
        if (i === 0) {
            buildings[y][bx] = TILES.BRIDGE_TL;
            buildings[y + 1][bx] = TILES.BRIDGE_BL;
        } else if (i === length - 1) {
            buildings[y][bx] = TILES.BRIDGE_TR;
            buildings[y + 1][bx] = TILES.BRIDGE_BR;
        } else {
            buildings[y][bx] = TILES.BRIDGE_TM;
            buildings[y + 1][bx] = TILES.BRIDGE_BM;
        }
        // Make bridge walkable (override water collision)
        collisions[y][bx] = 0;
        collisions[y + 1][bx] = 0;
    }
}

// Place a 2x2 large tree. Top in above layer, bottom in buildings layer.
function placeLargeTree(buildings, collisions, above, x, y, type) {
    const t = LARGE_TREES[type] || LARGE_TREES.green;
    // Top row (above layer - rendered above player)
    above[y][x] = t[0];       // TL
    above[y][x + 1] = t[1];   // TR
    collisions[y][x] = 1;
    collisions[y][x + 1] = 1;
    // Bottom row (buildings layer)
    buildings[y + 1][x] = t[2];     // BL
    buildings[y + 1][x + 1] = t[3]; // BR
    collisions[y + 1][x] = 1;
    collisions[y + 1][x + 1] = 1;
}

// Legacy 1x1 tree placement (tree_top above, tree_trunk in buildings)
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

// Place iron fence rectangle (with opening at specified side)
function placeIronFenceRect(buildings, collisions, x1, y1, x2, y2, openX1, openX2, openY) {
    // Top horizontal
    for (let x = x1; x <= x2; x++) {
        buildings[y1][x] = TILES.IRON_FENCE_H;
        collisions[y1][x] = 1;
    }
    // Bottom horizontal
    for (let x = x1; x <= x2; x++) {
        buildings[y2][x] = TILES.IRON_FENCE_H;
        collisions[y2][x] = 1;
    }
    // Left vertical
    for (let y = y1; y <= y2; y++) {
        buildings[y][x1] = TILES.IRON_FENCE_POST;
        collisions[y][x1] = 1;
    }
    // Right vertical
    for (let y = y1; y <= y2; y++) {
        buildings[y][x2] = TILES.IRON_FENCE_POST;
        collisions[y][x2] = 1;
    }
    // Corners
    buildings[y1][x1] = TILES.IRON_FENCE_CORNER;
    buildings[y1][x2] = TILES.IRON_FENCE_CORNER;
    buildings[y2][x1] = TILES.IRON_FENCE_CORNER;
    buildings[y2][x2] = TILES.IRON_FENCE_CORNER;

    // Opening
    if (openX1 !== undefined && openX2 !== undefined && openY !== undefined) {
        for (let x = openX1; x <= openX2; x++) {
            buildings[openY][x] = -1;
            collisions[openY][x] = 0;
        }
    }
}

// Scatter grass variety on a ground layer
function scatterGrassVariety(ground, W, H) {
    const variants = [TILES.GRASS_MEDIUM, TILES.GRASS_LIGHT, TILES.GRASS_DARK, TILES.GRASS_YELLOW];
    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            if (ground[y][x] === TILES.GRASS) {
                // ~25% chance of variation
                const hash = ((x * 7 + y * 13 + x * y) % 100);
                if (hash < 8) ground[y][x] = TILES.GRASS_MEDIUM;
                else if (hash < 14) ground[y][x] = TILES.GRASS_LIGHT;
                else if (hash < 18) ground[y][x] = TILES.GRASS_DARK;
                else if (hash < 22) ground[y][x] = TILES.GRASS_YELLOW;
            }
        }
    }
}

// Draw a winding path on the ground layer
function drawPath(ground, points, width, tile) {
    tile = tile || TILES.PATH;
    for (let i = 0; i < points.length - 1; i++) {
        const [x1, y1] = points[i];
        const [x2, y2] = points[i + 1];
        const dx = x2 - x1;
        const dy = y2 - y1;
        const steps = Math.max(Math.abs(dx), Math.abs(dy));
        for (let s = 0; s <= steps; s++) {
            const px = Math.round(x1 + (dx * s) / (steps || 1));
            const py = Math.round(y1 + (dy * s) / (steps || 1));
            for (let wy = 0; wy < width; wy++) {
                for (let wx = 0; wx < width; wx++) {
                    const tx = px + wx;
                    const ty = py + wy;
                    if (ty >= 0 && ty < ground.length && tx >= 0 && tx < ground[0].length) {
                        ground[ty][tx] = tile;
                    }
                }
            }
        }
    }
}

// Fill a rectangular area of ground
function fillRect(layer, x1, y1, x2, y2, tile) {
    for (let y = y1; y <= y2; y++) {
        for (let x = x1; x <= x2; x++) {
            if (y >= 0 && y < layer.length && x >= 0 && x < layer[0].length) {
                layer[y][x] = tile;
            }
        }
    }
}

// Place water body with edges
function placeWaterBody(ground, collisions, x1, y1, x2, y2) {
    for (let y = y1; y <= y2; y++) {
        for (let x = x1; x <= x2; x++) {
            if (y >= 0 && y < ground.length && x >= 0 && x < ground[0].length) {
                ground[y][x] = TILES.WATER;
                collisions[y][x] = 1;
            }
        }
    }
}

// Place a vertical river (full width of map, 2-3 tiles wide)
function placeVerticalRiver(ground, collisions, centerX, y1, y2, width) {
    width = width || 2;
    for (let y = y1; y <= y2; y++) {
        for (let w = 0; w < width; w++) {
            const x = centerX + w;
            if (y >= 0 && y < ground.length && x >= 0 && x < ground[0].length) {
                ground[y][x] = TILES.WATER;
                collisions[y][x] = 1;
            }
        }
    }
}

// Place a horizontal river
function placeHorizontalRiver(ground, collisions, x1, x2, centerY, width) {
    width = width || 2;
    for (let x = x1; x <= x2; x++) {
        for (let w = 0; w < width; w++) {
            const y = centerY + w;
            if (y >= 0 && y < ground.length && x >= 0 && x < ground[0].length) {
                ground[y][x] = TILES.WATER;
                collisions[y][x] = 1;
            }
        }
    }
}

// Place a clothesline (3 tiles wide)
function placeClothesline(buildings, x, y) {
    buildings[y][x] = TILES.CLOTHESLINE_L;
    buildings[y][x + 1] = TILES.CLOTHESLINE_M;
    buildings[y][x + 2] = TILES.CLOTHESLINE_R;
}

// ===== VILLAGE DE DEPART: 30x30 =====
function createVillageMap() {
    const W = 30, H = 30;
    const { ground, buildings, collisions, above } = emptyMap(W, H);

    // --- Base terrain: grass variety ---
    scatterGrassVariety(ground, W, H);

    // --- Winding sand paths ---
    // Main east-west path (winding slightly)
    drawPath(ground, [[0, 14], [6, 14], [10, 13], [16, 13], [20, 14], [29, 14]], 2);
    // Main north-south path
    drawPath(ground, [[14, 0], [14, 8], [13, 12], [14, 16], [14, 29]], 2);
    // Path to south exit
    drawPath(ground, [[14, 26], [14, 29]], 2);

    // --- Central town square with cobblestone ---
    fillRect(ground, 11, 12, 17, 16, TILES.COBBLESTONE);

    // --- River on the east side ---
    placeVerticalRiver(ground, collisions, 24, 0, 29, 3);
    // Bridge over the river at path height
    placeBridge(ground, buildings, collisions, 24, 13, 3);
    placeBridge(ground, buildings, collisions, 24, 14, 3);
    // Lily pads in river
    buildings[4][25] = TILES.LILY_PAD_GREEN;
    buildings[8][24] = TILES.LILY_PAD_BLUE;
    buildings[18][25] = TILES.LILY_PAD_GREEN;
    buildings[22][24] = TILES.LILY_PAD_BLUE;

    // --- Tile-based houses ---
    // House 1: red house, top-left area (5 wide)
    placeHouse(buildings, collisions, above, 2, 2, 5, 5, 'wood');
    // House 2: blue house, top-right area (before river)
    placeHouse(buildings, collisions, above, 18, 2, 5, 5, 'red');
    // House 3: wood house, left side
    placeHouse(buildings, collisions, above, 2, 8, 4, 5, 'blue');
    // House 4: white house, south-left
    placeHouse(buildings, collisions, above, 2, 17, 5, 5, 'tan');
    // House 5: red house, south area
    placeHouse(buildings, collisions, above, 8, 17, 4, 5, 'grey');

    // --- Clotheslines between houses ---
    placeClothesline(buildings, 7, 5);
    placeClothesline(buildings, 7, 20);

    // --- Well in the town square ---
    placeWell(buildings, collisions, 13, 14);

    // --- Terrain de petanque (bottom right, before river) ---
    fillRect(ground, 17, 20, 22, 25, TILES.PETANQUE_TERRAIN);
    // Iron fence around petanque terrain
    placeIronFenceRect(buildings, collisions, 16, 19, 23, 26, 19, 20, 26);

    // --- Large 2x2 trees (mixed types for variety) ---
    placeLargeTree(buildings, collisions, above, 0, 0, 'green');
    placeLargeTree(buildings, collisions, above, 8, 0, 'dark');
    placeLargeTree(buildings, collisions, above, 16, 0, 'green');
    placeLargeTree(buildings, collisions, above, 0, 14, 'dark');
    placeLargeTree(buildings, collisions, above, 0, 24, 'autumn');
    placeLargeTree(buildings, collisions, above, 8, 26, 'green');
    placeLargeTree(buildings, collisions, above, 28, 0, 'dark');
    placeLargeTree(buildings, collisions, above, 28, 8, 'green');
    placeLargeTree(buildings, collisions, above, 28, 18, 'autumn');
    placeLargeTree(buildings, collisions, above, 28, 26, 'green');

    // --- Small 1x1 trees for density ---
    const smallTrees = [
        [3, 0], [5, 1], [10, 1], [12, 1],
        [0, 7], [0, 12], [0, 17],
        [11, 8], [17, 8],
        [6, 27], [11, 27],
    ];
    placeTrees(smallTrees, buildings, collisions, above);

    // --- Flowers everywhere ---
    const flowerSpots = [
        [10, 12, TILES.FLOWER], [17, 12, TILES.FLOWER_YELLOW],
        [10, 17, TILES.FLOWER_BLUE], [17, 17, TILES.FLOWER],
        [5, 8, TILES.FLOWER_WHITE], [7, 16, TILES.FLOWER_YELLOW],
        [20, 10, TILES.FLOWER], [22, 10, TILES.FLOWER_BLUE],
        [4, 14, TILES.ROSE], [9, 14, TILES.FLOWER_CLUSTER],
        [12, 8, TILES.FLOWER_WHITE], [16, 8, TILES.FLOWER_YELLOW],
        [3, 24, TILES.FLOWER], [5, 26, TILES.FLOWER_BLUE],
    ];
    for (const [x, y, tile] of flowerSpots) {
        if (buildings[y][x] === -1) buildings[y][x] = tile;
    }

    // --- Benches in the square ---
    buildings[13][11] = TILES.BENCH;
    buildings[13][12] = TILES.BENCH_R;
    buildings[16][15] = TILES.BENCH;
    buildings[16][16] = TILES.BENCH_R;

    // --- Sign posts ---
    buildings[12][14] = TILES.SIGN_POST;
    collisions[12][14] = 1;
    buildings[17][11] = TILES.SIGN_DIRECTION;
    collisions[17][11] = 1;

    // --- Barrels near houses ---
    buildings[7][7] = TILES.BARREL;
    collisions[7][7] = 1;
    buildings[7][8] = TILES.BARREL;
    collisions[7][8] = 1;
    buildings[7][22] = TILES.BARREL;
    collisions[7][22] = 1;

    // --- Farm area (south-west corner) ---
    fillRect(ground, 2, 24, 6, 27, TILES.GRASS_YELLOW);
    buildings[24][3] = TILES.SCARECROW;
    collisions[24][3] = 1;
    buildings[25][2] = TILES.CORN;
    buildings[25][4] = TILES.PUMPKIN;
    buildings[26][2] = TILES.WHEAT;
    buildings[26][3] = TILES.CABBAGE;
    buildings[26][4] = TILES.CORN;
    buildings[25][5] = TILES.HAY_BALE;
    collisions[25][5] = 1;

    // --- Rocks and pebbles ---
    buildings[10][20] = TILES.ROCK_LARGE;
    collisions[10][20] = 1;
    buildings[22][10] = TILES.ROCK_SMALL;
    buildings[5][15] = TILES.PEBBLES;
    buildings[19][12] = TILES.PEBBLES;

    // --- Mushrooms ---
    buildings[9][10] = TILES.MUSHROOM_BROWN;
    buildings[26][10] = TILES.MUSHROOM_RED;

    // --- World borders ---
    setBorders(collisions, W, H);
    // South exit opening
    collisions[H - 1][14] = 0;
    collisions[H - 1][15] = 0;

    return { ground, buildings, collisions, above, width: W, height: H };
}

// ===== ROUTE 1: 20x60 (long vertical road) =====
function createRoute1Map() {
    const W = 20, H = 60;
    const { ground, buildings, collisions, above } = emptyMap(W, H);

    // Base grass variety
    scatterGrassVariety(ground, W, H);

    // --- Winding central path ---
    drawPath(ground, [
        [9, 0], [9, 6], [8, 10], [9, 15], [10, 20], [9, 25],
        [8, 30], [9, 35], [10, 40], [9, 45], [9, 50], [9, 55], [9, 59]
    ], 2);

    // Side paths branching off
    drawPath(ground, [[9, 20], [4, 20], [3, 20]], 2);
    drawPath(ground, [[11, 35], [15, 35], [16, 35]], 2);

    // --- Dense forest sections with 2x2 trees ---
    // Northern dense forest (y=3-8)
    placeLargeTree(buildings, collisions, above, 0, 2, 'green');
    placeLargeTree(buildings, collisions, above, 2, 4, 'dark');
    placeLargeTree(buildings, collisions, above, 4, 2, 'green');
    placeLargeTree(buildings, collisions, above, 14, 2, 'dark');
    placeLargeTree(buildings, collisions, above, 16, 4, 'green');
    placeLargeTree(buildings, collisions, above, 18, 2, 'green');

    // Mid-section forest cluster (y=22-28)
    placeLargeTree(buildings, collisions, above, 0, 22, 'green');
    placeLargeTree(buildings, collisions, above, 2, 25, 'dark');
    placeLargeTree(buildings, collisions, above, 4, 23, 'autumn');
    placeLargeTree(buildings, collisions, above, 14, 23, 'green');
    placeLargeTree(buildings, collisions, above, 16, 25, 'dark');
    placeLargeTree(buildings, collisions, above, 18, 22, 'green');

    // Southern forest (y=48-55)
    placeLargeTree(buildings, collisions, above, 0, 48, 'dark');
    placeLargeTree(buildings, collisions, above, 2, 50, 'green');
    placeLargeTree(buildings, collisions, above, 4, 52, 'autumn');
    placeLargeTree(buildings, collisions, above, 14, 48, 'green');
    placeLargeTree(buildings, collisions, above, 16, 50, 'dark');
    placeLargeTree(buildings, collisions, above, 18, 52, 'green');

    // Scattered border trees (1x1)
    const smallTrees = [
        [0, 8], [0, 14], [0, 30], [0, 36], [0, 42], [0, 56],
        [19, 8], [19, 14], [19, 30], [19, 36], [19, 42], [19, 56],
        [5, 10], [14, 12], [3, 32], [16, 33],
        [5, 44], [14, 46], [3, 57], [16, 58],
    ];
    placeTrees(smallTrees, buildings, collisions, above);

    // --- Stream crossing (y=38-39) with proper bridge ---
    placeHorizontalRiver(ground, collisions, 0, W - 1, 38, 2);
    // Bridge on the path (at x=8-11, y=38-39)
    placeBridge(ground, buildings, collisions, 8, 38, 4);
    placeBridge(ground, buildings, collisions, 8, 39, 4);

    // Rocks near stream
    buildings[37][3] = TILES.ROCK_LARGE;
    collisions[37][3] = 1;
    buildings[37][4] = TILES.ROCK_SMALL;
    buildings[40][15] = TILES.ROCK_SMALL;
    buildings[40][16] = TILES.ROCK_LARGE;
    collisions[40][16] = 1;

    // --- Flower meadows ---
    const flowerMeadow1 = [
        [3, 8, TILES.FLOWER], [4, 8, TILES.FLOWER_YELLOW], [5, 7, TILES.FLOWER_BLUE],
        [3, 9, TILES.FLOWER_WHITE], [4, 9, TILES.FLOWER], [5, 9, TILES.FLOWER_CLUSTER],
    ];
    const flowerMeadow2 = [
        [14, 15, TILES.FLOWER], [15, 15, TILES.FLOWER_YELLOW], [16, 14, TILES.FLOWER_BLUE],
        [14, 16, TILES.ROSE], [15, 16, TILES.FLOWER_WHITE], [16, 16, TILES.FLOWER],
    ];
    const flowerMeadow3 = [
        [3, 44, TILES.FLOWER_BLUE], [4, 44, TILES.FLOWER], [5, 43, TILES.FLOWER_YELLOW],
        [3, 45, TILES.FLOWER_WHITE], [4, 45, TILES.ROSE],
    ];
    for (const spots of [flowerMeadow1, flowerMeadow2, flowerMeadow3]) {
        for (const [x, y, tile] of spots) {
            if (buildings[y][x] === -1) buildings[y][x] = tile;
        }
    }

    // --- Mushroom patches ---
    buildings[28][2] = TILES.MUSHROOM_BROWN;
    buildings[28][3] = TILES.MUSHROOM_RED;
    buildings[29][2] = TILES.MUSHROOM_GREY;

    // --- Rest area with benches and sign (y=18-21) ---
    fillRect(ground, 3, 18, 7, 21, TILES.COBBLESTONE);
    buildings[18][3] = TILES.BENCH;
    buildings[18][4] = TILES.BENCH_R;
    buildings[21][3] = TILES.BENCH;
    buildings[21][4] = TILES.BENCH_R;
    buildings[19][7] = TILES.SIGN_POST;
    collisions[19][7] = 1;
    buildings[20][6] = TILES.BARREL;
    collisions[20][6] = 1;

    // --- Pebble patches ---
    buildings[12][6] = TILES.PEBBLES;
    buildings[34][13] = TILES.PEBBLES;
    buildings[52][5] = TILES.PEBBLES;

    // --- World borders ---
    setBorders(collisions, W, H);
    // North entrance (from village_depart)
    collisions[0][9] = 0;
    collisions[0][10] = 0;
    // South exit (to village_arene_1)
    collisions[H - 1][9] = 0;
    collisions[H - 1][10] = 0;

    return { ground, buildings, collisions, above, width: W, height: H };
}

// ===== VILLAGE ARENE 1: 30x30 (Marcel's village) =====
function createVillageArene1Map() {
    const W = 30, H = 30;
    const { ground, buildings, collisions, above } = emptyMap(W, H);

    // Base grass variety
    scatterGrassVariety(ground, W, H);

    // --- Cobblestone plaza in center ---
    fillRect(ground, 10, 12, 19, 17, TILES.COBBLESTONE);

    // --- Main paths ---
    // North-south through center
    drawPath(ground, [[14, 0], [14, 11]], 2);
    drawPath(ground, [[14, 18], [14, 29]], 2);
    // East-west through center
    drawPath(ground, [[0, 14], [9, 14]], 2);
    drawPath(ground, [[20, 14], [29, 14]], 2);

    // --- Petanque arena (center-top) ---
    fillRect(ground, 8, 3, 21, 10, TILES.PETANQUE_TERRAIN);
    placeIronFenceRect(buildings, collisions, 7, 2, 22, 11, 14, 15, 11);

    // --- Houses in different styles ---
    // Left side houses
    placeHouse(buildings, collisions, above, 2, 2, 4, 5, 'wood');
    placeHouse(buildings, collisions, above, 2, 17, 5, 5, 'tan');
    // Right side houses
    placeHouse(buildings, collisions, above, 24, 2, 4, 5, 'blue');
    placeHouse(buildings, collisions, above, 23, 17, 5, 5, 'grey');

    // --- Market stall area (south-east plaza) ---
    buildings[13][20] = TILES.MARKET_STALL;
    collisions[13][20] = 1;
    buildings[13][21] = TILES.MARKET_STALL;
    collisions[13][21] = 1;
    buildings[14][20] = TILES.BARREL;
    collisions[14][20] = 1;
    buildings[14][21] = TILES.BARREL;
    collisions[14][21] = 1;
    buildings[13][22] = TILES.SIGN_POST;
    collisions[13][22] = 1;

    // --- Well in the plaza ---
    placeWell(buildings, collisions, 13, 14);

    // --- Benches around plaza ---
    buildings[12][10] = TILES.BENCH;
    buildings[12][11] = TILES.BENCH_R;
    buildings[17][10] = TILES.BENCH;
    buildings[17][11] = TILES.BENCH_R;
    buildings[17][17] = TILES.BENCH;
    buildings[17][18] = TILES.BENCH_R;

    // --- Large 2x2 trees ---
    placeLargeTree(buildings, collisions, above, 0, 0, 'green');
    placeLargeTree(buildings, collisions, above, 4, 0, 'dark');
    placeLargeTree(buildings, collisions, above, 26, 0, 'green');
    placeLargeTree(buildings, collisions, above, 28, 0, 'dark');
    placeLargeTree(buildings, collisions, above, 0, 10, 'green');
    placeLargeTree(buildings, collisions, above, 0, 24, 'autumn');
    placeLargeTree(buildings, collisions, above, 28, 10, 'dark');
    placeLargeTree(buildings, collisions, above, 28, 24, 'green');

    // Small trees
    const smallTrees = [
        [0, 16], [0, 22], [29, 16], [29, 22],
        [8, 24], [21, 24], [10, 28], [19, 28],
    ];
    placeTrees(smallTrees, buildings, collisions, above);

    // --- Flowers ---
    const flowers = [
        [10, 12, TILES.FLOWER], [19, 12, TILES.FLOWER_YELLOW],
        [10, 17, TILES.FLOWER_BLUE], [19, 17, TILES.FLOWER],
        [5, 14, TILES.FLOWER_WHITE], [8, 16, TILES.FLOWER_YELLOW],
        [22, 16, TILES.FLOWER], [25, 14, TILES.FLOWER_BLUE],
        [12, 8, TILES.ROSE], [17, 8, TILES.FLOWER_CLUSTER],
        [3, 15, TILES.FLOWER], [26, 15, TILES.FLOWER_YELLOW],
    ];
    for (const [x, y, tile] of flowers) {
        if (buildings[y][x] === -1) buildings[y][x] = tile;
    }

    // --- Barrels near market ---
    buildings[15][22] = TILES.BARREL;
    collisions[15][22] = 1;

    // --- Sign post at entrance ---
    buildings[12][14] = TILES.SIGN_DIRECTION;
    collisions[12][14] = 1;

    // --- Clothesline between houses ---
    placeClothesline(buildings, 2, 15);

    // --- Pebbles and rocks ---
    buildings[20][10] = TILES.PEBBLES;
    buildings[24][20] = TILES.ROCK_SMALL;
    buildings[26][5] = TILES.ROCK_LARGE;
    collisions[26][5] = 1;

    // --- World borders ---
    setBorders(collisions, W, H);
    // North entrance (from route_1)
    collisions[0][14] = 0;
    collisions[0][15] = 0;
    // South exit (to route_2)
    collisions[H - 1][14] = 0;
    collisions[H - 1][15] = 0;

    return { ground, buildings, collisions, above, width: W, height: H };
}

// ===== ROUTE 2: 35x20 (horizontal road) =====
function createRoute2Map() {
    const W = 35, H = 20;
    const { ground, buildings, collisions, above } = emptyMap(W, H);

    // Base grass variety
    scatterGrassVariety(ground, W, H);

    // --- Winding horizontal path ---
    drawPath(ground, [
        [0, 9], [5, 9], [10, 8], [15, 9], [20, 10], [25, 9], [30, 9], [34, 9]
    ], 2);

    // --- Sandy beach area (south) ---
    fillRect(ground, 20, 14, 28, 17, TILES.SAND);
    // Small pond near sand
    placeWaterBody(ground, collisions, 22, 15, 26, 17);
    // Lily pads
    buildings[16][23] = TILES.LILY_PAD_GREEN;
    buildings[15][25] = TILES.LILY_PAD_BLUE;

    // --- Rock formations (north side) ---
    buildings[3][8] = TILES.ROCK_LARGE;
    collisions[3][8] = 1;
    buildings[3][9] = TILES.ROCK_SMALL;
    buildings[4][8] = TILES.ROCK_SMALL;
    buildings[4][9] = TILES.PEBBLES;

    buildings[5][24] = TILES.ROCK_LARGE;
    collisions[5][24] = 1;
    buildings[5][25] = TILES.ROCK_SMALL;
    buildings[4][25] = TILES.PEBBLES;

    // --- Dense trees on borders ---
    placeLargeTree(buildings, collisions, above, 0, 0, 'green');
    placeLargeTree(buildings, collisions, above, 4, 0, 'dark');
    placeLargeTree(buildings, collisions, above, 10, 0, 'green');
    placeLargeTree(buildings, collisions, above, 16, 0, 'autumn');
    placeLargeTree(buildings, collisions, above, 28, 0, 'green');
    placeLargeTree(buildings, collisions, above, 32, 0, 'dark');

    placeLargeTree(buildings, collisions, above, 0, 16, 'dark');
    placeLargeTree(buildings, collisions, above, 4, 18, 'green');
    placeLargeTree(buildings, collisions, above, 10, 16, 'green');
    placeLargeTree(buildings, collisions, above, 14, 18, 'autumn');
    placeLargeTree(buildings, collisions, above, 30, 16, 'dark');
    placeLargeTree(buildings, collisions, above, 33, 18, 'green');

    // Inner decorative trees
    const smallTrees = [
        [3, 5], [7, 4], [18, 4], [30, 5],
        [6, 14], [12, 13], [18, 14], [32, 13],
    ];
    placeTrees(smallTrees, buildings, collisions, above);

    // --- Flower meadow (north-west) ---
    const flowers = [
        [5, 6, TILES.FLOWER], [6, 6, TILES.FLOWER_YELLOW], [5, 7, TILES.FLOWER_BLUE],
        [13, 6, TILES.FLOWER_WHITE], [14, 5, TILES.FLOWER],
        [25, 12, TILES.ROSE], [26, 12, TILES.FLOWER_CLUSTER],
        [30, 7, TILES.FLOWER], [31, 8, TILES.FLOWER_YELLOW],
    ];
    for (const [x, y, tile] of flowers) {
        if (y < H && x < W && buildings[y][x] === -1) buildings[y][x] = tile;
    }

    // --- Rest area with bench ---
    fillRect(ground, 14, 12, 17, 14, TILES.COBBLESTONE);
    buildings[12][14] = TILES.BENCH;
    buildings[12][15] = TILES.BENCH_R;
    buildings[13][17] = TILES.SIGN_POST;
    collisions[13][17] = 1;

    // --- Mushroom patch ---
    buildings[13][3] = TILES.MUSHROOM_BROWN;
    buildings[14][3] = TILES.MUSHROOM_RED;
    buildings[13][4] = TILES.MUSHROOM_GREY;

    // --- Borders ---
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

    // Base grass variety
    scatterGrassVariety(ground, W, H);

    // --- Main paths ---
    drawPath(ground, [[0, 12], [10, 12], [12, 12]], 2);
    drawPath(ground, [[14, 12], [24, 12]], 2);
    drawPath(ground, [[12, 0], [12, 10]], 2);
    drawPath(ground, [[12, 15], [12, 24]], 2);

    // --- Cobblestone central plaza ---
    fillRect(ground, 9, 10, 16, 16, TILES.COBBLESTONE);

    // --- Petanque arena (top area) ---
    fillRect(ground, 6, 2, 19, 7, TILES.PETANQUE_TERRAIN);
    placeIronFenceRect(buildings, collisions, 5, 1, 20, 8, 12, 13, 8);

    // --- Houses in different styles ---
    placeHouse(buildings, collisions, above, 1, 9, 4, 5, 'blue');
    placeHouse(buildings, collisions, above, 20, 9, 4, 5, 'red');
    placeHouse(buildings, collisions, above, 1, 16, 5, 5, 'wood');
    placeHouse(buildings, collisions, above, 19, 16, 5, 5, 'straw');

    // --- Well/fountain in plaza ---
    placeWell(buildings, collisions, 12, 12);

    // --- Benches in plaza ---
    buildings[10][9] = TILES.BENCH;
    buildings[10][10] = TILES.BENCH_R;
    buildings[15][14] = TILES.BENCH;
    buildings[15][15] = TILES.BENCH_R;

    // --- Market area (south-east of plaza) ---
    buildings[16][17] = TILES.MARKET_STALL;
    collisions[16][17] = 1;
    buildings[16][18] = TILES.BARREL;
    collisions[16][18] = 1;
    buildings[15][17] = TILES.SIGN_POST;
    collisions[15][17] = 1;

    // --- Large trees ---
    placeLargeTree(buildings, collisions, above, 0, 0, 'green');
    placeLargeTree(buildings, collisions, above, 2, 0, 'dark');
    placeLargeTree(buildings, collisions, above, 22, 0, 'green');
    placeLargeTree(buildings, collisions, above, 0, 22, 'autumn');
    placeLargeTree(buildings, collisions, above, 23, 22, 'dark');

    // Small trees
    const smallTrees = [
        [0, 6], [0, 16], [24, 6], [24, 16],
        [7, 22], [17, 22],
    ];
    placeTrees(smallTrees, buildings, collisions, above);

    // --- Flowers ---
    const flowers = [
        [9, 10, TILES.FLOWER], [16, 10, TILES.FLOWER_BLUE],
        [9, 16, TILES.FLOWER_YELLOW], [16, 16, TILES.FLOWER],
        [5, 14, TILES.ROSE], [19, 14, TILES.FLOWER_CLUSTER],
        [10, 9, TILES.FLOWER_WHITE], [15, 9, TILES.FLOWER],
    ];
    for (const [x, y, tile] of flowers) {
        if (buildings[y][x] === -1) buildings[y][x] = tile;
    }

    // --- Clothesline ---
    placeClothesline(buildings, 6, 14);

    // --- Decorations ---
    buildings[9][8] = TILES.BARREL;
    collisions[9][8] = 1;
    buildings[16][7] = TILES.PEBBLES;
    buildings[21][12] = TILES.SIGN_DIRECTION;
    collisions[21][12] = 1;

    // --- Borders ---
    setBorders(collisions, W, H);
    collisions[12][0] = 0;
    collisions[13][0] = 0;
    collisions[H - 1][12] = 0;
    collisions[H - 1][13] = 0;

    return { ground, buildings, collisions, above, width: W, height: H };
}

// ===== ROUTE 3: 35x20 (horizontal road) =====
function createRoute3Map() {
    const W = 35, H = 20;
    const { ground, buildings, collisions, above } = emptyMap(W, H);

    // Base grass variety
    scatterGrassVariety(ground, W, H);

    // --- Winding horizontal path ---
    drawPath(ground, [
        [0, 9], [4, 10], [10, 9], [16, 8], [22, 9], [28, 10], [34, 9]
    ], 2);

    // --- Vertical stream with bridge ---
    placeVerticalRiver(ground, collisions, 24, 0, 19, 2);
    // Bridge at path crossing
    placeBridge(ground, buildings, collisions, 24, 8, 2);
    placeBridge(ground, buildings, collisions, 24, 9, 2);
    placeBridge(ground, buildings, collisions, 24, 10, 2);

    // --- Sandy area (south-west) ---
    fillRect(ground, 8, 13, 15, 17, TILES.SAND);
    // Sandy path branching south
    drawPath(ground, [[10, 10], [10, 13]], 2, TILES.SAND);

    // --- Dense forest (both sides) ---
    placeLargeTree(buildings, collisions, above, 0, 0, 'dark');
    placeLargeTree(buildings, collisions, above, 4, 0, 'green');
    placeLargeTree(buildings, collisions, above, 8, 0, 'dark');
    placeLargeTree(buildings, collisions, above, 18, 0, 'green');
    placeLargeTree(buildings, collisions, above, 28, 0, 'autumn');
    placeLargeTree(buildings, collisions, above, 33, 0, 'green');

    placeLargeTree(buildings, collisions, above, 0, 16, 'green');
    placeLargeTree(buildings, collisions, above, 4, 18, 'dark');
    placeLargeTree(buildings, collisions, above, 18, 16, 'autumn');
    placeLargeTree(buildings, collisions, above, 28, 18, 'green');
    placeLargeTree(buildings, collisions, above, 33, 16, 'dark');

    // Small trees
    const smallTrees = [
        [2, 6], [14, 4], [22, 4], [32, 6],
        [2, 14], [16, 14], [30, 14],
    ];
    placeTrees(smallTrees, buildings, collisions, above);

    // --- Rock formation near stream ---
    buildings[6][22] = TILES.ROCK_LARGE;
    collisions[6][22] = 1;
    buildings[6][23] = TILES.ROCK_SMALL;
    buildings[12][26] = TILES.ROCK_LARGE;
    collisions[12][26] = 1;
    buildings[12][27] = TILES.ROCK_SMALL;

    // --- Flower patches ---
    const flowers = [
        [5, 7, TILES.FLOWER], [6, 7, TILES.FLOWER_YELLOW],
        [13, 12, TILES.FLOWER_BLUE], [14, 12, TILES.FLOWER_WHITE],
        [30, 7, TILES.ROSE], [31, 7, TILES.FLOWER_CLUSTER],
        [10, 5, TILES.FLOWER], [20, 13, TILES.FLOWER_YELLOW],
    ];
    for (const [x, y, tile] of flowers) {
        if (y < H && x < W && buildings[y][x] === -1) buildings[y][x] = tile;
    }

    // --- Mushroom patch in sand area ---
    buildings[14][9] = TILES.MUSHROOM_BROWN;
    buildings[14][10] = TILES.MUSHROOM_RED;
    buildings[15][9] = TILES.MUSHROOM_GREY;

    // --- Rest bench ---
    fillRect(ground, 14, 4, 16, 6, TILES.COBBLESTONE);
    buildings[4][14] = TILES.BENCH;
    buildings[4][15] = TILES.BENCH_R;
    buildings[6][16] = TILES.SIGN_DIRECTION;
    collisions[6][16] = 1;

    // --- Pebbles ---
    buildings[8][3] = TILES.PEBBLES;
    buildings[15][30] = TILES.PEBBLES;

    // --- Borders ---
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

    // Base grass variety
    scatterGrassVariety(ground, W, H);

    // --- Main paths ---
    drawPath(ground, [[0, 12], [10, 12]], 2);
    drawPath(ground, [[14, 12], [24, 12]], 2);
    drawPath(ground, [[12, 0], [12, 10]], 2);
    drawPath(ground, [[12, 15], [12, 24]], 2);

    // --- Stone slab grand plaza ---
    fillRect(ground, 8, 10, 17, 16, TILES.STONE_SLAB);

    // --- Petanque arena (top, larger and grander) ---
    fillRect(ground, 5, 2, 20, 8, TILES.PETANQUE_TERRAIN);
    placeIronFenceRect(buildings, collisions, 4, 1, 21, 9, 12, 13, 9);

    // Decorative iron railings along arena path
    for (let x = 10; x <= 15; x++) {
        buildings[10][x] = TILES.IRON_RAIL_BM;
    }

    // --- Houses (grander, varied styles) ---
    placeHouse(buildings, collisions, above, 1, 9, 5, 5, 'red');
    placeHouse(buildings, collisions, above, 19, 9, 5, 5, 'blue');
    placeHouse(buildings, collisions, above, 1, 16, 5, 5, 'wood');
    placeHouse(buildings, collisions, above, 19, 16, 5, 5, 'straw');

    // --- Fountain/well in plaza center ---
    placeWell(buildings, collisions, 12, 12);

    // --- Benches around plaza ---
    buildings[11][8] = TILES.BENCH;
    buildings[11][9] = TILES.BENCH_R;
    buildings[11][16] = TILES.BENCH;
    buildings[11][17] = TILES.BENCH_R;
    buildings[15][8] = TILES.BENCH;
    buildings[15][9] = TILES.BENCH_R;
    buildings[15][16] = TILES.BENCH;
    buildings[15][17] = TILES.BENCH_R;

    // --- Market stalls ---
    buildings[16][8] = TILES.MARKET_STALL;
    collisions[16][8] = 1;
    buildings[16][9] = TILES.MARKET_STALL;
    collisions[16][9] = 1;
    buildings[16][10] = TILES.BARREL;
    collisions[16][10] = 1;

    // --- Notice board ---
    buildings[10][8] = TILES.NOTICE_BOARD;
    collisions[10][8] = 1;
    buildings[10][9] = TILES.NOTICE_BOARD_R;
    collisions[10][9] = 1;

    // --- Decorative sign ---
    buildings[22][12] = TILES.SIGN_DIRECTION;
    collisions[22][12] = 1;

    // --- Large trees in symmetrical arrangement ---
    placeLargeTree(buildings, collisions, above, 0, 0, 'green');
    placeLargeTree(buildings, collisions, above, 2, 0, 'dark');
    placeLargeTree(buildings, collisions, above, 22, 0, 'green');
    placeLargeTree(buildings, collisions, above, 0, 22, 'dark');
    placeLargeTree(buildings, collisions, above, 23, 22, 'green');

    // Small trees for density
    const smallTrees = [
        [0, 6], [0, 16], [24, 6], [24, 16],
        [7, 22], [17, 22], [7, 0], [17, 0],
    ];
    placeTrees(smallTrees, buildings, collisions, above);

    // --- Flowers ---
    const flowers = [
        [8, 10, TILES.FLOWER], [17, 10, TILES.FLOWER_YELLOW],
        [8, 16, TILES.FLOWER_BLUE], [17, 16, TILES.FLOWER],
        [6, 14, TILES.ROSE], [18, 14, TILES.FLOWER_CLUSTER],
        [10, 22, TILES.FLOWER_WHITE], [14, 22, TILES.FLOWER],
    ];
    for (const [x, y, tile] of flowers) {
        if (buildings[y][x] === -1) buildings[y][x] = tile;
    }

    // --- Clotheslines ---
    placeClothesline(buildings, 6, 14);
    placeClothesline(buildings, 15, 20);

    // --- Barrels ---
    buildings[14][7] = TILES.BARREL;
    collisions[14][7] = 1;
    buildings[14][18] = TILES.BARREL;
    collisions[14][18] = 1;

    // --- Pebbles ---
    buildings[20][10] = TILES.PEBBLES;
    buildings[20][15] = TILES.PEBBLES;

    // --- Borders ---
    setBorders(collisions, W, H);
    collisions[12][0] = 0;
    collisions[13][0] = 0;
    collisions[H - 1][12] = 0;
    collisions[H - 1][13] = 0;

    return { ground, buildings, collisions, above, width: W, height: H };
}

// ===== ARENE FINALE: 30x25 (Grand finale arena) =====
function createAreneFinaleMap() {
    const W = 30, H = 25;
    const { ground, buildings, collisions, above } = emptyMap(W, H);

    // --- Entirely cobblestone ground ---
    fillRect(ground, 0, 0, W - 1, H - 1, TILES.COBBLESTONE);

    // --- Stone slab border trim ---
    fillRect(ground, 0, 0, W - 1, 0, TILES.STONE_SLAB);
    fillRect(ground, 0, H - 1, W - 1, H - 1, TILES.STONE_SLAB);
    for (let y = 0; y < H; y++) {
        ground[y][0] = TILES.STONE_SLAB;
        ground[y][W - 1] = TILES.STONE_SLAB;
    }

    // --- Grand petanque arena (center) ---
    fillRect(ground, 5, 4, 24, 17, TILES.PETANQUE_TERRAIN);
    placeIronFenceRect(buildings, collisions, 4, 3, 25, 18, 14, 15, 18);

    // --- Decorative iron railings around perimeter ---
    // Top railing
    for (let x = 2; x <= 27; x++) {
        if (buildings[1][x] === -1) {
            buildings[1][x] = TILES.IRON_RAIL_BM;
            collisions[1][x] = 1;
        }
    }
    // Bottom railing (before entrance path)
    for (let x = 2; x <= 12; x++) {
        buildings[22][x] = TILES.IRON_RAIL_BM;
        collisions[22][x] = 1;
    }
    for (let x = 17; x <= 27; x++) {
        buildings[22][x] = TILES.IRON_RAIL_BM;
        collisions[22][x] = 1;
    }

    // --- Path to entrance ---
    fillRect(ground, 13, 19, 16, H - 1, TILES.STONE_SLAB);

    // --- Symmetrical large trees ---
    placeLargeTree(buildings, collisions, above, 0, 0, 'green');
    placeLargeTree(buildings, collisions, above, 28, 0, 'green');
    placeLargeTree(buildings, collisions, above, 0, 22, 'dark');
    placeLargeTree(buildings, collisions, above, 28, 22, 'dark');
    // Inner decorative trees
    placeLargeTree(buildings, collisions, above, 1, 8, 'green');
    placeLargeTree(buildings, collisions, above, 1, 14, 'dark');
    placeLargeTree(buildings, collisions, above, 27, 8, 'green');
    placeLargeTree(buildings, collisions, above, 27, 14, 'dark');

    // --- Benches for spectators ---
    // Left side spectator benches
    buildings[6][2] = TILES.BENCH;
    buildings[6][3] = TILES.BENCH_R;
    buildings[10][2] = TILES.BENCH;
    buildings[10][3] = TILES.BENCH_R;
    buildings[14][2] = TILES.BENCH;
    buildings[14][3] = TILES.BENCH_R;
    // Right side spectator benches
    buildings[6][26] = TILES.BENCH;
    buildings[6][27] = TILES.BENCH_R;
    buildings[10][26] = TILES.BENCH;
    buildings[10][27] = TILES.BENCH_R;
    buildings[14][26] = TILES.BENCH;
    buildings[14][27] = TILES.BENCH_R;

    // --- Entrance area decorations ---
    buildings[20][12] = TILES.FLOWER;
    buildings[20][17] = TILES.FLOWER_YELLOW;
    buildings[22][12] = TILES.FLOWER_BLUE;
    buildings[22][17] = TILES.FLOWER;

    // --- Barrels at corners ---
    buildings[2][2] = TILES.BARREL;
    collisions[2][2] = 1;
    buildings[2][27] = TILES.BARREL;
    collisions[2][27] = 1;

    // --- Gold posts at entrance ---
    buildings[19][13] = TILES.GOLD_POST;
    collisions[19][13] = 1;
    buildings[19][16] = TILES.GOLD_POST;
    collisions[19][16] = 1;

    // --- Sign at entrance ---
    buildings[21][14] = TILES.SIGN_POST;
    collisions[21][14] = 1;

    // --- Pebble decorations ---
    buildings[20][8] = TILES.PEBBLES;
    buildings[20][21] = TILES.PEBBLES;

    // --- Borders ---
    setBorders(collisions, W, H);
    collisions[H - 1][14] = 0;
    collisions[H - 1][15] = 0;

    return { ground, buildings, collisions, above, width: W, height: H };
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
