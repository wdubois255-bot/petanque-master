import { TILE_SIZE } from '../utils/Constants.js';
import { TILES } from './TilesetGenerator.js';

// Village de depart: 30x30 tiles
// Layout: maisons en haut, place centrale, terrain petanque, sortie en bas

const W = 30;
const H = 30;

function createVillageMap() {
    const ground = [];
    const buildings = [];
    const collisions = [];
    const above = [];

    for (let y = 0; y < H; y++) {
        const gRow = [];
        const bRow = [];
        const cRow = [];
        const aRow = [];
        for (let x = 0; x < W; x++) {
            gRow.push(TILES.GRASS);
            bRow.push(-1);
            cRow.push(0);
            aRow.push(-1);
        }
        ground.push(gRow);
        buildings.push(bRow);
        collisions.push(cRow);
        above.push(aRow);
    }

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

    // === HOUSE 1 (joueur) - top left ===
    placeHouse(buildings, collisions, above, 3, 3, 5, 4);

    // === HOUSE 2 - top right ===
    placeHouse(buildings, collisions, above, 20, 3, 5, 4);

    // === HOUSE 3 - left of road ===
    placeHouse(buildings, collisions, above, 3, 9, 4, 3);

    // === Terrain de petanque (bas droite) ===
    for (let y = 18; y < 24; y++) {
        for (let x = 19; x < 27; x++) {
            ground[y][x] = TILES.PETANQUE_TERRAIN;
        }
    }
    // Fence around terrain
    for (let x = 18; x < 28; x++) {
        buildings[17][x] = TILES.FENCE;
        collisions[17][x] = 1;
        buildings[24][x] = TILES.FENCE;
        collisions[24][x] = 1;
    }
    for (let y = 17; y < 25; y++) {
        buildings[y][18] = TILES.FENCE;
        collisions[y][18] = 1;
        buildings[y][27] = TILES.FENCE;
        collisions[y][27] = 1;
    }

    // === Trees (borders + decorative) ===
    const treePositions = [
        // Top border
        [0, 0], [1, 0], [2, 0], [5, 0], [9, 0], [10, 0],
        [16, 0], [17, 0], [25, 0], [26, 0], [27, 0], [28, 0], [29, 0],
        // Left border
        [0, 1], [0, 5], [0, 8], [0, 12], [0, 18], [0, 22], [0, 26],
        // Right border
        [29, 5], [29, 10], [29, 15], [29, 20], [29, 25],
        // Decorative
        [10, 5], [11, 9], [25, 10], [9, 20], [5, 24],
    ];
    for (const [x, y] of treePositions) {
        if (y > 0) {
            above[y - 1][x] = TILES.TREE_TOP;
        }
        buildings[y][x] = TILES.TREE_TRUNK;
        collisions[y][x] = 1;
        if (y > 0) collisions[y - 1][x] = 1;
    }

    // === Water (small pond top-center) ===
    for (let y = 2; y < 4; y++) {
        for (let x = 12; x < 16; x++) {
            ground[y][x] = TILES.WATER;
            collisions[y][x] = 1;
        }
    }

    // === World borders ===
    for (let x = 0; x < W; x++) {
        collisions[0][x] = 1;
        collisions[H - 1][x] = 1;
    }
    for (let y = 0; y < H; y++) {
        collisions[y][0] = 1;
        collisions[y][W - 1] = 1;
    }
    // South exit opening
    collisions[H - 1][14] = 0;
    collisions[H - 1][15] = 0;

    return { ground, buildings, collisions, above, width: W, height: H };
}

function placeHouse(buildings, collisions, above, startX, startY, w, h) {
    // Roof row (above player)
    for (let x = startX; x < startX + w; x++) {
        above[startY][x] = TILES.HOUSE_ROOF;
        collisions[startY][x] = 1;
    }
    // Front wall
    for (let y = startY + 1; y < startY + h; y++) {
        for (let x = startX; x < startX + w; x++) {
            buildings[y][x] = TILES.HOUSE_FRONT;
            collisions[y][x] = 1;
        }
    }
    // Door (center bottom)
    const doorX = startX + Math.floor(w / 2);
    const doorY = startY + h - 1;
    buildings[doorY][doorX] = TILES.DOOR;
    collisions[doorY][doorX] = 1;
}

export const MAPS = {
    village_depart: createVillageMap
};

export default class MapManager {
    constructor(scene) {
        this.scene = scene;
        this.currentMap = null;
        this.layers = {};
    }

    loadMap(mapName) {
        const mapData = MAPS[mapName]();
        this.currentMap = mapData;

        // Create tilemap from data
        const map = this.scene.make.tilemap({
            data: mapData.ground,
            tileWidth: TILE_SIZE,
            tileHeight: TILE_SIZE
        });

        const tileset = map.addTilesetImage('village_tileset', 'village_tileset', TILE_SIZE, TILE_SIZE);
        this.layers.ground = map.createLayer(0, tileset);

        // Buildings layer
        const buildingsMap = this.scene.make.tilemap({
            data: mapData.buildings,
            tileWidth: TILE_SIZE,
            tileHeight: TILE_SIZE
        });
        const bTileset = buildingsMap.addTilesetImage('village_tileset', 'village_tileset', TILE_SIZE, TILE_SIZE);
        this.layers.buildings = buildingsMap.createLayer(0, bTileset).setDepth(5);

        // Above player layer
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
        if (!this.currentMap) return null;
        if (tileY >= this.currentMap.height - 1 && (tileX === 14 || tileX === 15)) {
            return { map: 'route_1', spawnX: 14, spawnY: 1 };
        }
        return null;
    }
}
