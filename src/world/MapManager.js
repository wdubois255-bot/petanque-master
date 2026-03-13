import { TILE_SIZE } from '../utils/Constants.js';
import { TILES } from './TilesetGenerator.js';

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

    // Flowers along paths
    const flowerSpots = [
        [12, 13], [17, 13], [12, 16], [17, 16],
        [6, 13], [8, 16], [20, 13], [22, 16]
    ];
    for (const [x, y] of flowerSpots) {
        ground[y][x] = TILES.FLOWER;
    }

    // House 1 (joueur) - top left
    placeHouse(buildings, collisions, above, 3, 3, 5, 4);
    // House 2 - top right
    placeHouse(buildings, collisions, above, 20, 3, 5, 4);
    // House 3 - left of road
    placeHouse(buildings, collisions, above, 3, 9, 4, 3);

    // Terrain de petanque (bas droite)
    for (let y = 18; y < 24; y++) {
        for (let x = 19; x < 27; x++) {
            ground[y][x] = TILES.PETANQUE_TERRAIN;
        }
    }
    // Fence around terrain
    for (let x = 18; x < 28; x++) {
        buildings[17][x] = TILES.FENCE; collisions[17][x] = 1;
        buildings[24][x] = TILES.FENCE; collisions[24][x] = 1;
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

    // World borders
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

    // Flowers
    const flowers = [
        [3, 5], [16, 8], [4, 18], [15, 25], [6, 38], [14, 48], [3, 52], [17, 55]
    ];
    for (const [x, y] of flowers) {
        ground[y][x] = TILES.FLOWER;
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
        buildings[20][x] = TILES.FENCE;
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

    // Flowers
    const flowers = [
        [12, 13], [17, 13], [12, 16], [17, 16],
        [5, 13], [8, 16], [20, 13], [24, 16],
        [10, 7], [19, 7], [10, 22], [19, 22]
    ];
    for (const [x, y] of flowers) {
        ground[y][x] = TILES.FLOWER;
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
        buildings[2][x] = TILES.FENCE; collisions[2][x] = 1;
        buildings[11][x] = TILES.FENCE; collisions[11][x] = 1;
    }
    for (let y = 2; y < 12; y++) {
        buildings[y][7] = TILES.FENCE; collisions[y][7] = 1;
        buildings[y][22] = TILES.FENCE; collisions[y][22] = 1;
    }
    // Entrance to arene
    buildings[11][14] = -1; collisions[11][14] = 0;
    buildings[11][15] = -1; collisions[11][15] = 0;

    // Houses
    placeHouse(buildings, collisions, above, 2, 3, 4, 3);
    placeHouse(buildings, collisions, above, 24, 3, 4, 3);
    placeHouse(buildings, collisions, above, 2, 18, 5, 4);
    placeHouse(buildings, collisions, above, 23, 18, 5, 4);

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

function placeHouse(buildings, collisions, above, startX, startY, w, h) {
    for (let x = startX; x < startX + w; x++) {
        above[startY][x] = TILES.HOUSE_ROOF;
        collisions[startY][x] = 1;
    }
    for (let y = startY + 1; y < startY + h; y++) {
        for (let x = startX; x < startX + w; x++) {
            buildings[y][x] = TILES.HOUSE_FRONT;
            collisions[y][x] = 1;
        }
    }
    const doorX = startX + Math.floor(w / 2);
    const doorY = startY + h - 1;
    buildings[doorY][doorX] = TILES.DOOR;
    collisions[doorY][doorX] = 1;
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
    village_arene_1: createVillageArene1Map
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
        { tileX: [14, 15], tileY: 29, target: null } // Blocked until badge_marcel
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
        const tileset = map.addTilesetImage('village_tileset', 'village_tileset', TILE_SIZE, TILE_SIZE);
        this.layers.ground = map.createLayer(0, tileset);

        const buildingsMap = this.scene.make.tilemap({
            data: mapData.buildings,
            tileWidth: TILE_SIZE,
            tileHeight: TILE_SIZE
        });
        const bTileset = buildingsMap.addTilesetImage('village_tileset', 'village_tileset', TILE_SIZE, TILE_SIZE);
        this.layers.buildings = buildingsMap.createLayer(0, bTileset).setDepth(5);

        const aboveMap = this.scene.make.tilemap({
            data: mapData.above,
            tileWidth: TILE_SIZE,
            tileHeight: TILE_SIZE
        });
        const aTileset = aboveMap.addTilesetImage('village_tileset', 'village_tileset', TILE_SIZE, TILE_SIZE);
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
            if (matchX && tileY === exit.tileY) {
                return exit.target;
            }
        }
        return null;
    }
}
