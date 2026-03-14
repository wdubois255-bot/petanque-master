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

// Palette provencale enrichie
const PAL = {
    GRASS_LIGHT: '#7BA65E',
    GRASS_MID: '#6E9A52',
    GRASS_DARK: '#5E8A44',
    GRASS_ACCENT: '#8BB86A',
    PATH: '#C4A574',
    PATH_LIGHT: '#D4B584',
    PATH_DARK: '#A89060',
    WALL: '#D4C4A0',
    WALL_LIGHT: '#E4D4B0',
    WALL_DARK: '#B0A080',
    WALL_TOP: '#C4854A',
    WALL_TOP_DARK: '#A86E3A',
    WATER: '#5B9EC4',
    WATER_LIGHT: '#6BAED4',
    WATER_DARK: '#4A8AB0',
    WATER_DEEP: '#3A7AA0',
    ROOF: '#C46040',
    ROOF_LIGHT: '#D47050',
    ROOF_DARK: '#A04830',
    HOUSE: '#E8D5B7',
    HOUSE_LIGHT: '#F0E0C8',
    HOUSE_DARK: '#D4C4A0',
    DOOR: '#6B4E3A',
    DOOR_DARK: '#503A28',
    DOOR_FRAME: '#8B6B4A',
    TREE_GREEN: '#4A7A3A',
    TREE_LIGHT: '#5A8A4A',
    TREE_DARK: '#3A6030',
    TREE_HIGHLIGHT: '#6A9A5A',
    TRUNK: '#8B6B4A',
    TRUNK_LIGHT: '#9B7B5A',
    TRUNK_DARK: '#6B5038',
    FLOWER_RED: '#C44B3F',
    FLOWER_PINK: '#D46B6F',
    FLOWER_YELLOW: '#E8C840',
    FLOWER_WHITE: '#F0E8D0',
    FENCE: '#B0A080',
    FENCE_LIGHT: '#C4B494',
    FENCE_DARK: '#8B7A60',
    SAND: '#E8D5B7',
    SAND_LIGHT: '#F0E0C8',
    SAND_DARK: '#D4C0A0',
    TERRAIN: '#C4854A',
    TERRAIN_LIGHT: '#D4955A',
    TERRAIN_DARK: '#A87040',
    OMBRE: '#3A2E28',
};

// S = scale factor (2x from 16 to 32)
const S = 2;

// Helper: place a single scaled pixel (2x2 block)
function px(ctx, x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * S, y * S, S, S);
}

// Helper: fill a scaled rect
function rect(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * S, y * S, w * S, h * S);
}

// Helper: checkerboard dither between 2 colors (scaled)
function dither(ctx, x, y, w, h, c1, c2) {
    for (let dy = 0; dy < h; dy++) {
        for (let dx = 0; dx < w; dx++) {
            ctx.fillStyle = (dx + dy) % 2 === 0 ? c1 : c2;
            ctx.fillRect((x + dx) * S, (y + dy) * S, S, S);
        }
    }
}

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

    // GRASS - lush with variety
    drawTile(TILES.GRASS, (c) => {
        rect(c, 0, 0, 16, 16, PAL.GRASS_LIGHT);
        rect(c, 0, 4, 8, 4, PAL.GRASS_MID);
        rect(c, 8, 10, 8, 4, PAL.GRASS_MID);
        px(c, 2, 3, PAL.GRASS_DARK);
        px(c, 2, 2, PAL.GRASS_DARK);
        px(c, 10, 7, PAL.GRASS_DARK);
        px(c, 10, 6, PAL.GRASS_DARK);
        px(c, 6, 12, PAL.GRASS_DARK);
        px(c, 6, 11, PAL.GRASS_DARK);
        px(c, 13, 1, PAL.GRASS_DARK);
        px(c, 13, 0, PAL.GRASS_DARK);
        px(c, 4, 9, PAL.GRASS_ACCENT);
        px(c, 12, 4, PAL.GRASS_ACCENT);
        px(c, 8, 14, PAL.GRASS_ACCENT);
    });

    // PATH - worn dirt with pebbles
    drawTile(TILES.PATH, (c) => {
        rect(c, 0, 0, 16, 16, PAL.PATH);
        rect(c, 2, 2, 4, 3, PAL.PATH_LIGHT);
        rect(c, 10, 8, 4, 3, PAL.PATH_LIGHT);
        px(c, 3, 5, PAL.PATH_DARK);
        px(c, 4, 5, PAL.PATH_DARK);
        px(c, 10, 11, PAL.PATH_DARK);
        px(c, 11, 11, PAL.PATH_DARK);
        px(c, 7, 2, PAL.PATH_DARK);
        px(c, 14, 6, PAL.PATH_DARK);
        px(c, 1, 13, PAL.PATH_DARK);
        px(c, 5, 8, PAL.PATH_LIGHT);
        px(c, 12, 3, PAL.PATH_LIGHT);
    });

    // WALL_TOP - roof tiles with texture
    drawTile(TILES.WALL_TOP, (c) => {
        rect(c, 0, 0, 16, 16, PAL.WALL_TOP);
        rect(c, 0, 14, 16, 2, PAL.WALL_TOP_DARK);
        rect(c, 0, 7, 16, 1, PAL.WALL_TOP_DARK);
        px(c, 4, 3, PAL.WALL_TOP_DARK);
        px(c, 12, 3, PAL.WALL_TOP_DARK);
        px(c, 0, 10, PAL.WALL_TOP_DARK);
        px(c, 8, 10, PAL.WALL_TOP_DARK);
        rect(c, 1, 1, 6, 1, '#D4955A');
        rect(c, 9, 8, 6, 1, '#D4955A');
    });

    // WALL_FRONT - stone wall with mortar lines
    drawTile(TILES.WALL_FRONT, (c) => {
        rect(c, 0, 0, 16, 16, PAL.WALL);
        rect(c, 0, 0, 16, 1, PAL.WALL_DARK);
        rect(c, 0, 8, 16, 1, PAL.WALL_DARK);
        rect(c, 8, 0, 1, 8, PAL.WALL_DARK);
        rect(c, 0, 8, 1, 8, PAL.WALL_DARK);
        rect(c, 2, 2, 4, 1, PAL.WALL_LIGHT);
        rect(c, 10, 2, 4, 1, PAL.WALL_LIGHT);
        rect(c, 3, 10, 4, 1, PAL.WALL_LIGHT);
        rect(c, 10, 10, 4, 1, PAL.WALL_LIGHT);
    });

    // WATER - animated feel with waves
    drawTile(TILES.WATER, (c) => {
        rect(c, 0, 0, 16, 16, PAL.WATER);
        rect(c, 0, 8, 16, 8, PAL.WATER_DEEP);
        rect(c, 1, 3, 5, 1, PAL.WATER_LIGHT);
        rect(c, 3, 4, 3, 1, PAL.WATER_LIGHT);
        rect(c, 9, 9, 5, 1, PAL.WATER_LIGHT);
        rect(c, 11, 10, 3, 1, PAL.WATER_LIGHT);
        px(c, 6, 2, '#FFFFFF');
        px(c, 13, 7, '#FFFFFF');
        dither(c, 0, 7, 16, 2, PAL.WATER, PAL.WATER_DEEP);
    });

    // HOUSE_ROOF - terracotta tiles
    drawTile(TILES.HOUSE_ROOF, (c) => {
        rect(c, 0, 0, 16, 16, PAL.ROOF);
        rect(c, 0, 1, 16, 2, PAL.ROOF_LIGHT);
        rect(c, 0, 5, 16, 2, PAL.ROOF_LIGHT);
        rect(c, 0, 9, 16, 2, PAL.ROOF_LIGHT);
        rect(c, 0, 13, 16, 2, PAL.ROOF_LIGHT);
        for (let y = 0; y < 16; y += 4) {
            rect(c, 0, y, 16, 1, PAL.ROOF_DARK);
        }
        rect(c, 4, 0, 1, 4, PAL.ROOF_DARK);
        rect(c, 12, 0, 1, 4, PAL.ROOF_DARK);
        rect(c, 0, 4, 1, 4, PAL.ROOF_DARK);
        rect(c, 8, 4, 1, 4, PAL.ROOF_DARK);
        rect(c, 4, 8, 1, 4, PAL.ROOF_DARK);
        rect(c, 12, 8, 1, 4, PAL.ROOF_DARK);
        rect(c, 0, 12, 1, 4, PAL.ROOF_DARK);
        rect(c, 8, 12, 1, 4, PAL.ROOF_DARK);
    });

    // HOUSE_FRONT - facade with window
    drawTile(TILES.HOUSE_FRONT, (c) => {
        rect(c, 0, 0, 16, 16, PAL.HOUSE);
        rect(c, 0, 0, 16, 1, PAL.HOUSE_DARK);
        rect(c, 4, 3, 8, 7, PAL.DOOR_FRAME);
        rect(c, 5, 4, 6, 5, PAL.WATER);
        rect(c, 5, 6, 6, 1, PAL.DOOR_FRAME);
        rect(c, 8, 4, 1, 5, PAL.DOOR_FRAME);
        px(c, 6, 4, PAL.WATER_LIGHT);
        px(c, 6, 5, PAL.WATER_LIGHT);
        rect(c, 1, 12, 3, 1, PAL.HOUSE_LIGHT);
        rect(c, 12, 12, 3, 1, PAL.HOUSE_LIGHT);
    });

    // DOOR - wooden door with details
    drawTile(TILES.DOOR, (c) => {
        rect(c, 0, 0, 16, 16, PAL.HOUSE);
        rect(c, 2, 1, 12, 15, PAL.DOOR_FRAME);
        rect(c, 3, 2, 10, 14, PAL.DOOR);
        rect(c, 3, 2, 10, 1, PAL.DOOR_DARK);
        rect(c, 3, 9, 10, 1, PAL.DOOR_DARK);
        rect(c, 8, 2, 1, 14, PAL.DOOR_DARK);
        rect(c, 10, 8, 2, 2, PAL.FLOWER_YELLOW);
        px(c, 10, 8, '#FFE060');
        rect(c, 1, 15, 14, 1, PAL.WALL_DARK);
    });

    // TREE_TOP - rounded canopy with depth
    drawTile(TILES.TREE_TOP, (c) => {
        rect(c, 0, 0, 16, 16, PAL.GRASS_LIGHT);
        rect(c, 2, 4, 12, 10, PAL.TREE_GREEN);
        rect(c, 3, 2, 10, 12, PAL.TREE_GREEN);
        rect(c, 4, 1, 8, 14, PAL.TREE_GREEN);
        rect(c, 4, 6, 8, 6, PAL.TREE_DARK);
        rect(c, 5, 4, 6, 8, PAL.TREE_DARK);
        rect(c, 4, 2, 4, 2, PAL.TREE_HIGHLIGHT);
        rect(c, 3, 3, 3, 2, PAL.TREE_HIGHLIGHT);
        px(c, 5, 5, PAL.TREE_HIGHLIGHT);
        px(c, 7, 4, PAL.TREE_LIGHT);
        px(c, 10, 6, PAL.TREE_LIGHT);
        px(c, 6, 9, PAL.TREE_LIGHT);
    });

    // TREE_TRUNK - solid trunk with roots
    drawTile(TILES.TREE_TRUNK, (c) => {
        rect(c, 0, 0, 16, 16, PAL.GRASS_LIGHT);
        rect(c, 6, 0, 4, 12, PAL.TRUNK);
        rect(c, 6, 0, 1, 12, PAL.TRUNK_DARK);
        px(c, 8, 3, PAL.TRUNK_DARK);
        px(c, 7, 6, PAL.TRUNK_DARK);
        px(c, 9, 8, PAL.TRUNK_DARK);
        px(c, 8, 1, PAL.TRUNK_LIGHT);
        px(c, 9, 4, PAL.TRUNK_LIGHT);
        rect(c, 5, 11, 6, 2, PAL.TRUNK);
        rect(c, 4, 12, 2, 1, PAL.TRUNK);
        rect(c, 10, 12, 2, 1, PAL.TRUNK);
        rect(c, 3, 13, 10, 1, PAL.GRASS_DARK);
        px(c, 2, 14, PAL.GRASS_DARK);
        px(c, 13, 14, PAL.GRASS_DARK);
    });

    // FLOWER - colorful garden
    drawTile(TILES.FLOWER, (c) => {
        rect(c, 0, 0, 16, 16, PAL.GRASS_LIGHT);
        rect(c, 0, 8, 16, 8, PAL.GRASS_MID);
        // Stems
        px(c, 3, 5, PAL.GRASS_DARK);
        px(c, 3, 6, PAL.GRASS_DARK);
        px(c, 11, 9, PAL.GRASS_DARK);
        px(c, 11, 10, PAL.GRASS_DARK);
        px(c, 7, 7, PAL.GRASS_DARK);
        px(c, 7, 8, PAL.GRASS_DARK);
        px(c, 5, 12, PAL.GRASS_DARK);
        px(c, 5, 13, PAL.GRASS_DARK);
        // Red flowers
        px(c, 2, 3, PAL.FLOWER_RED); px(c, 3, 3, PAL.FLOWER_RED); px(c, 4, 3, PAL.FLOWER_RED);
        px(c, 3, 4, PAL.FLOWER_RED);
        px(c, 3, 3, PAL.FLOWER_YELLOW);
        // Yellow flower
        px(c, 6, 6, PAL.FLOWER_YELLOW); px(c, 7, 6, PAL.FLOWER_YELLOW); px(c, 8, 6, PAL.FLOWER_YELLOW);
        px(c, 7, 5, PAL.FLOWER_YELLOW);
        px(c, 7, 6, PAL.FLOWER_WHITE);
        // Pink flower
        px(c, 10, 8, PAL.FLOWER_PINK); px(c, 11, 8, PAL.FLOWER_PINK); px(c, 12, 8, PAL.FLOWER_PINK);
        px(c, 11, 7, PAL.FLOWER_PINK);
        px(c, 11, 8, PAL.FLOWER_YELLOW);
        // White flower
        px(c, 4, 11, PAL.FLOWER_WHITE); px(c, 5, 11, PAL.FLOWER_WHITE); px(c, 6, 11, PAL.FLOWER_WHITE);
        px(c, 5, 10, PAL.FLOWER_WHITE);
        px(c, 5, 11, PAL.FLOWER_YELLOW);
    });

    // FENCE - wooden fence with posts
    drawTile(TILES.FENCE, (c) => {
        rect(c, 0, 0, 16, 16, PAL.GRASS_LIGHT);
        rect(c, 1, 2, 3, 12, PAL.FENCE);
        rect(c, 12, 2, 3, 12, PAL.FENCE);
        rect(c, 1, 2, 3, 1, PAL.FENCE_LIGHT);
        rect(c, 12, 2, 3, 1, PAL.FENCE_LIGHT);
        rect(c, 1, 13, 3, 1, PAL.FENCE_DARK);
        rect(c, 12, 13, 3, 1, PAL.FENCE_DARK);
        rect(c, 0, 5, 16, 2, PAL.FENCE);
        rect(c, 0, 10, 16, 2, PAL.FENCE);
        rect(c, 0, 5, 16, 1, PAL.FENCE_LIGHT);
        rect(c, 0, 10, 16, 1, PAL.FENCE_LIGHT);
        rect(c, 0, 7, 16, 1, PAL.FENCE_DARK);
        rect(c, 0, 12, 16, 1, PAL.FENCE_DARK);
    });

    // SAND - beach/sandy area
    drawTile(TILES.SAND, (c) => {
        rect(c, 0, 0, 16, 16, PAL.SAND);
        rect(c, 2, 2, 5, 4, PAL.SAND_LIGHT);
        rect(c, 9, 9, 5, 4, PAL.SAND_LIGHT);
        px(c, 4, 3, PAL.SAND_DARK);
        px(c, 11, 9, PAL.SAND_DARK);
        px(c, 7, 6, PAL.SAND_DARK);
        px(c, 1, 13, PAL.SAND_DARK);
        px(c, 14, 2, PAL.SAND_DARK);
        px(c, 8, 12, PAL.PATH_DARK);
        px(c, 3, 8, PAL.PATH_DARK);
    });

    // PETANQUE_TERRAIN - packed dirt with lines
    drawTile(TILES.PETANQUE_TERRAIN, (c) => {
        rect(c, 0, 0, 16, 16, PAL.TERRAIN);
        rect(c, 3, 3, 5, 4, PAL.TERRAIN_LIGHT);
        rect(c, 8, 9, 5, 4, PAL.TERRAIN_LIGHT);
        rect(c, 0, 0, 16, 1, PAL.TERRAIN_DARK);
        rect(c, 0, 15, 16, 1, PAL.TERRAIN_DARK);
        rect(c, 0, 0, 1, 16, PAL.TERRAIN_DARK);
        rect(c, 15, 0, 1, 16, PAL.TERRAIN_DARK);
        px(c, 5, 7, PAL.TERRAIN_DARK);
        px(c, 10, 4, PAL.TERRAIN_DARK);
        px(c, 7, 12, PAL.TERRAIN_DARK);
        px(c, 4, 5, PAL.TERRAIN_LIGHT);
        px(c, 12, 10, PAL.TERRAIN_LIGHT);
    });

    // Add as texture
    scene.textures.addCanvas('village_tileset', canvas);

    return canvas;
}
