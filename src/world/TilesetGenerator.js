import Phaser from 'phaser';
import { TILE_SIZE, COLORS } from '../utils/Constants.js';

// Tile types enum
export const TILES = {
    GRASS: 0,
    PATH: 1,
    WALL_TOP: 2,
    WALL_FRONT: 3,
    WATER: 4,
    HOUSE_ROOF: 5,
    HOUSE_FRONT: 6,
    DOOR: 7,
    TREE_TOP: 8,
    TREE_TRUNK: 9,
    FLOWER: 10,
    FENCE: 11,
    SAND: 12,
    PETANQUE_TERRAIN: 13,
};

// Palette provencale
const PAL = {
    GRASS_LIGHT: '#7BA65E',
    GRASS_DARK: '#6B8E4E',
    PATH: '#C4A574',
    PATH_DARK: '#B09060',
    WALL: '#D4C4A0',
    WALL_DARK: '#B0A080',
    WALL_TOP: '#C4854A',
    WATER: '#5B9EC4',
    WATER_DARK: '#4A8AB0',
    ROOF: '#C4654A',
    ROOF_DARK: '#A8503A',
    HOUSE: '#E8D5B7',
    HOUSE_DARK: '#D4C4A0',
    DOOR: '#6B4E3A',
    DOOR_DARK: '#503A28',
    TREE_GREEN: '#4A7A3A',
    TREE_DARK: '#3A6030',
    TRUNK: '#8B6B4A',
    TRUNK_DARK: '#6B5038',
    FLOWER_RED: '#C44B3F',
    FLOWER_YELLOW: '#E8C840',
    FENCE: '#B0A080',
    SAND: '#E8D5B7',
    TERRAIN: '#C4854A',
    OMBRE: '#3A2E28',
};

export function generateTileset(scene) {
    const tileCount = 14;
    const canvas = document.createElement('canvas');
    canvas.width = TILE_SIZE;
    canvas.height = TILE_SIZE * tileCount;
    const ctx = canvas.getContext('2d');

    const drawTile = (index, drawFn) => {
        ctx.save();
        ctx.translate(0, index * TILE_SIZE);
        drawFn(ctx);
        ctx.restore();
    };

    // GRASS
    drawTile(TILES.GRASS, (c) => {
        c.fillStyle = PAL.GRASS_LIGHT;
        c.fillRect(0, 0, 16, 16);
        c.fillStyle = PAL.GRASS_DARK;
        // Random grass tufts
        for (let i = 0; i < 4; i++) {
            const gx = [2, 10, 6, 13][i];
            const gy = [3, 7, 12, 1][i];
            c.fillRect(gx, gy, 1, 2);
        }
    });

    // PATH
    drawTile(TILES.PATH, (c) => {
        c.fillStyle = PAL.PATH;
        c.fillRect(0, 0, 16, 16);
        c.fillStyle = PAL.PATH_DARK;
        c.fillRect(3, 5, 2, 1);
        c.fillRect(10, 11, 2, 1);
        c.fillRect(7, 2, 1, 1);
    });

    // WALL_TOP
    drawTile(TILES.WALL_TOP, (c) => {
        c.fillStyle = PAL.WALL_TOP;
        c.fillRect(0, 0, 16, 16);
        c.fillStyle = PAL.ROOF_DARK;
        c.fillRect(0, 14, 16, 2);
    });

    // WALL_FRONT
    drawTile(TILES.WALL_FRONT, (c) => {
        c.fillStyle = PAL.WALL;
        c.fillRect(0, 0, 16, 16);
        c.fillStyle = PAL.WALL_DARK;
        c.fillRect(0, 0, 16, 1);
        c.fillRect(8, 0, 1, 16);
    });

    // WATER
    drawTile(TILES.WATER, (c) => {
        c.fillStyle = PAL.WATER;
        c.fillRect(0, 0, 16, 16);
        c.fillStyle = PAL.WATER_DARK;
        c.fillRect(2, 4, 6, 1);
        c.fillRect(9, 10, 5, 1);
    });

    // HOUSE_ROOF
    drawTile(TILES.HOUSE_ROOF, (c) => {
        c.fillStyle = PAL.ROOF;
        c.fillRect(0, 0, 16, 16);
        c.fillStyle = PAL.ROOF_DARK;
        for (let y = 0; y < 16; y += 4) {
            c.fillRect(0, y, 16, 1);
        }
    });

    // HOUSE_FRONT
    drawTile(TILES.HOUSE_FRONT, (c) => {
        c.fillStyle = PAL.HOUSE;
        c.fillRect(0, 0, 16, 16);
        c.fillStyle = PAL.HOUSE_DARK;
        c.fillRect(0, 0, 16, 1);
        // Window
        c.fillStyle = PAL.WATER;
        c.fillRect(5, 4, 6, 5);
        c.fillStyle = PAL.OMBRE;
        c.fillRect(5, 4, 6, 1);
        c.fillRect(8, 4, 1, 5);
    });

    // DOOR
    drawTile(TILES.DOOR, (c) => {
        c.fillStyle = PAL.HOUSE;
        c.fillRect(0, 0, 16, 16);
        c.fillStyle = PAL.DOOR;
        c.fillRect(3, 2, 10, 14);
        c.fillStyle = PAL.DOOR_DARK;
        c.fillRect(3, 2, 10, 1);
        // Handle
        c.fillStyle = PAL.FLOWER_YELLOW;
        c.fillRect(10, 9, 2, 2);
    });

    // TREE_TOP
    drawTile(TILES.TREE_TOP, (c) => {
        c.fillStyle = PAL.GRASS_LIGHT;
        c.fillRect(0, 0, 16, 16);
        c.fillStyle = PAL.TREE_GREEN;
        c.fillRect(2, 2, 12, 12);
        c.fillStyle = PAL.TREE_DARK;
        c.fillRect(4, 4, 8, 8);
        c.fillRect(2, 6, 12, 4);
    });

    // TREE_TRUNK
    drawTile(TILES.TREE_TRUNK, (c) => {
        c.fillStyle = PAL.GRASS_LIGHT;
        c.fillRect(0, 0, 16, 16);
        c.fillStyle = PAL.TRUNK;
        c.fillRect(6, 0, 4, 12);
        c.fillStyle = PAL.TRUNK_DARK;
        c.fillRect(6, 0, 1, 12);
        // Grass at base
        c.fillStyle = PAL.GRASS_DARK;
        c.fillRect(4, 11, 8, 2);
    });

    // FLOWER
    drawTile(TILES.FLOWER, (c) => {
        c.fillStyle = PAL.GRASS_LIGHT;
        c.fillRect(0, 0, 16, 16);
        c.fillStyle = PAL.FLOWER_RED;
        c.fillRect(3, 4, 2, 2);
        c.fillRect(11, 8, 2, 2);
        c.fillStyle = PAL.FLOWER_YELLOW;
        c.fillRect(7, 6, 2, 2);
        c.fillRect(5, 11, 2, 2);
    });

    // FENCE
    drawTile(TILES.FENCE, (c) => {
        c.fillStyle = PAL.GRASS_LIGHT;
        c.fillRect(0, 0, 16, 16);
        c.fillStyle = PAL.FENCE;
        c.fillRect(0, 4, 16, 2);
        c.fillRect(0, 10, 16, 2);
        c.fillRect(2, 2, 2, 12);
        c.fillRect(12, 2, 2, 12);
    });

    // SAND
    drawTile(TILES.SAND, (c) => {
        c.fillStyle = PAL.SAND;
        c.fillRect(0, 0, 16, 16);
        c.fillStyle = PAL.PATH;
        c.fillRect(4, 3, 1, 1);
        c.fillRect(11, 9, 1, 1);
    });

    // PETANQUE_TERRAIN
    drawTile(TILES.PETANQUE_TERRAIN, (c) => {
        c.fillStyle = PAL.TERRAIN;
        c.fillRect(0, 0, 16, 16);
        c.fillStyle = PAL.PATH_DARK;
        c.fillRect(0, 0, 16, 1);
        c.fillRect(0, 15, 16, 1);
        c.fillRect(0, 0, 1, 16);
        c.fillRect(15, 0, 1, 16);
    });

    // Add as texture
    scene.textures.addCanvas('village_tileset', canvas);

    return canvas;
}
