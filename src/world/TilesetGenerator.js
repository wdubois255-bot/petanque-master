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

// Helper: place a single pixel
function px(ctx, x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 1, 1);
}

// Helper: checkerboard dither between 2 colors
function dither(ctx, x, y, w, h, c1, c2) {
    for (let dy = 0; dy < h; dy++) {
        for (let dx = 0; dx < w; dx++) {
            ctx.fillStyle = (dx + dy) % 2 === 0 ? c1 : c2;
            ctx.fillRect(x + dx, y + dy, 1, 1);
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
        c.fillStyle = PAL.GRASS_LIGHT;
        c.fillRect(0, 0, 16, 16);
        // Subtle variation patches
        c.fillStyle = PAL.GRASS_MID;
        c.fillRect(0, 4, 8, 4);
        c.fillRect(8, 10, 8, 4);
        // Grass blades
        c.fillStyle = PAL.GRASS_DARK;
        px(c, 2, 3, PAL.GRASS_DARK);
        px(c, 2, 2, PAL.GRASS_DARK);
        px(c, 10, 7, PAL.GRASS_DARK);
        px(c, 10, 6, PAL.GRASS_DARK);
        px(c, 6, 12, PAL.GRASS_DARK);
        px(c, 6, 11, PAL.GRASS_DARK);
        px(c, 13, 1, PAL.GRASS_DARK);
        px(c, 13, 0, PAL.GRASS_DARK);
        // Highlights
        px(c, 4, 9, PAL.GRASS_ACCENT);
        px(c, 12, 4, PAL.GRASS_ACCENT);
        px(c, 8, 14, PAL.GRASS_ACCENT);
    });

    // PATH - worn dirt with pebbles
    drawTile(TILES.PATH, (c) => {
        c.fillStyle = PAL.PATH;
        c.fillRect(0, 0, 16, 16);
        // Light patches
        c.fillStyle = PAL.PATH_LIGHT;
        c.fillRect(2, 2, 4, 3);
        c.fillRect(10, 8, 4, 3);
        // Dark cracks/pebbles
        px(c, 3, 5, PAL.PATH_DARK);
        px(c, 4, 5, PAL.PATH_DARK);
        px(c, 10, 11, PAL.PATH_DARK);
        px(c, 11, 11, PAL.PATH_DARK);
        px(c, 7, 2, PAL.PATH_DARK);
        px(c, 14, 6, PAL.PATH_DARK);
        px(c, 1, 13, PAL.PATH_DARK);
        // Subtle pebble highlights
        px(c, 5, 8, PAL.PATH_LIGHT);
        px(c, 12, 3, PAL.PATH_LIGHT);
    });

    // WALL_TOP - roof tiles with texture
    drawTile(TILES.WALL_TOP, (c) => {
        c.fillStyle = PAL.WALL_TOP;
        c.fillRect(0, 0, 16, 16);
        // Tile pattern
        c.fillStyle = PAL.WALL_TOP_DARK;
        c.fillRect(0, 14, 16, 2);
        c.fillRect(0, 7, 16, 1);
        // Brick lines
        px(c, 4, 3, PAL.WALL_TOP_DARK);
        px(c, 12, 3, PAL.WALL_TOP_DARK);
        px(c, 0, 10, PAL.WALL_TOP_DARK);
        px(c, 8, 10, PAL.WALL_TOP_DARK);
        // Highlights
        c.fillStyle = '#D4955A';
        c.fillRect(1, 1, 6, 1);
        c.fillRect(9, 8, 6, 1);
    });

    // WALL_FRONT - stone wall with mortar lines
    drawTile(TILES.WALL_FRONT, (c) => {
        c.fillStyle = PAL.WALL;
        c.fillRect(0, 0, 16, 16);
        // Mortar lines (horizontal)
        c.fillStyle = PAL.WALL_DARK;
        c.fillRect(0, 0, 16, 1);
        c.fillRect(0, 8, 16, 1);
        // Mortar lines (vertical, offset)
        c.fillRect(8, 0, 1, 8);
        c.fillRect(0, 8, 1, 8);
        // Stone highlights
        c.fillStyle = PAL.WALL_LIGHT;
        c.fillRect(2, 2, 4, 1);
        c.fillRect(10, 2, 4, 1);
        c.fillRect(3, 10, 4, 1);
        c.fillRect(10, 10, 4, 1);
    });

    // WATER - animated feel with waves
    drawTile(TILES.WATER, (c) => {
        c.fillStyle = PAL.WATER;
        c.fillRect(0, 0, 16, 16);
        // Depth gradient
        c.fillStyle = PAL.WATER_DEEP;
        c.fillRect(0, 8, 16, 8);
        // Wave crests
        c.fillStyle = PAL.WATER_LIGHT;
        c.fillRect(1, 3, 5, 1);
        c.fillRect(3, 4, 3, 1);
        c.fillRect(9, 9, 5, 1);
        c.fillRect(11, 10, 3, 1);
        // Sparkle
        px(c, 6, 2, '#FFFFFF');
        px(c, 13, 7, '#FFFFFF');
        // Dither transition
        dither(c, 0, 7, 16, 2, PAL.WATER, PAL.WATER_DEEP);
    });

    // HOUSE_ROOF - terracotta tiles
    drawTile(TILES.HOUSE_ROOF, (c) => {
        c.fillStyle = PAL.ROOF;
        c.fillRect(0, 0, 16, 16);
        // Row highlights
        c.fillStyle = PAL.ROOF_LIGHT;
        c.fillRect(0, 1, 16, 2);
        c.fillRect(0, 5, 16, 2);
        c.fillRect(0, 9, 16, 2);
        c.fillRect(0, 13, 16, 2);
        // Tile separators
        c.fillStyle = PAL.ROOF_DARK;
        for (let y = 0; y < 16; y += 4) {
            c.fillRect(0, y, 16, 1);
        }
        // Vertical offsets for tile pattern
        c.fillRect(4, 0, 1, 4);
        c.fillRect(12, 0, 1, 4);
        c.fillRect(0, 4, 1, 4);
        c.fillRect(8, 4, 1, 4);
        c.fillRect(4, 8, 1, 4);
        c.fillRect(12, 8, 1, 4);
        c.fillRect(0, 12, 1, 4);
        c.fillRect(8, 12, 1, 4);
    });

    // HOUSE_FRONT - facade with window
    drawTile(TILES.HOUSE_FRONT, (c) => {
        c.fillStyle = PAL.HOUSE;
        c.fillRect(0, 0, 16, 16);
        // Top edge shadow
        c.fillStyle = PAL.HOUSE_DARK;
        c.fillRect(0, 0, 16, 1);
        // Window frame
        c.fillStyle = PAL.DOOR_FRAME;
        c.fillRect(4, 3, 8, 7);
        // Window glass
        c.fillStyle = PAL.WATER;
        c.fillRect(5, 4, 6, 5);
        // Window cross
        c.fillStyle = PAL.DOOR_FRAME;
        c.fillRect(5, 6, 6, 1);
        c.fillRect(8, 4, 1, 5);
        // Window reflection
        px(c, 6, 4, PAL.WATER_LIGHT);
        px(c, 6, 5, PAL.WATER_LIGHT);
        // Wall detail
        c.fillStyle = PAL.HOUSE_LIGHT;
        c.fillRect(1, 12, 3, 1);
        c.fillRect(12, 12, 3, 1);
    });

    // DOOR - wooden door with details
    drawTile(TILES.DOOR, (c) => {
        c.fillStyle = PAL.HOUSE;
        c.fillRect(0, 0, 16, 16);
        // Door frame
        c.fillStyle = PAL.DOOR_FRAME;
        c.fillRect(2, 1, 12, 15);
        // Door
        c.fillStyle = PAL.DOOR;
        c.fillRect(3, 2, 10, 14);
        // Door panels
        c.fillStyle = PAL.DOOR_DARK;
        c.fillRect(3, 2, 10, 1);
        c.fillRect(3, 9, 10, 1);
        c.fillRect(8, 2, 1, 14);
        // Handle
        c.fillStyle = PAL.FLOWER_YELLOW;
        c.fillRect(10, 8, 2, 2);
        // Handle highlight
        px(c, 10, 8, '#FFE060');
        // Step
        c.fillStyle = PAL.WALL_DARK;
        c.fillRect(1, 15, 14, 1);
    });

    // TREE_TOP - rounded canopy with depth
    drawTile(TILES.TREE_TOP, (c) => {
        c.fillStyle = PAL.GRASS_LIGHT;
        c.fillRect(0, 0, 16, 16);
        // Main canopy shape (rounded)
        c.fillStyle = PAL.TREE_GREEN;
        c.fillRect(2, 4, 12, 10);
        c.fillRect(3, 2, 10, 12);
        c.fillRect(4, 1, 8, 14);
        // Dark inner
        c.fillStyle = PAL.TREE_DARK;
        c.fillRect(4, 6, 8, 6);
        c.fillRect(5, 4, 6, 8);
        // Highlights (top-left light)
        c.fillStyle = PAL.TREE_HIGHLIGHT;
        c.fillRect(4, 2, 4, 2);
        c.fillRect(3, 3, 3, 2);
        px(c, 5, 5, PAL.TREE_HIGHLIGHT);
        // Light dapples
        px(c, 7, 4, PAL.TREE_LIGHT);
        px(c, 10, 6, PAL.TREE_LIGHT);
        px(c, 6, 9, PAL.TREE_LIGHT);
    });

    // TREE_TRUNK - solid trunk with roots
    drawTile(TILES.TREE_TRUNK, (c) => {
        c.fillStyle = PAL.GRASS_LIGHT;
        c.fillRect(0, 0, 16, 16);
        // Main trunk
        c.fillStyle = PAL.TRUNK;
        c.fillRect(6, 0, 4, 12);
        // Bark detail
        c.fillStyle = PAL.TRUNK_DARK;
        c.fillRect(6, 0, 1, 12);
        px(c, 8, 3, PAL.TRUNK_DARK);
        px(c, 7, 6, PAL.TRUNK_DARK);
        px(c, 9, 8, PAL.TRUNK_DARK);
        // Bark highlight
        c.fillStyle = PAL.TRUNK_LIGHT;
        px(c, 8, 1, PAL.TRUNK_LIGHT);
        px(c, 9, 4, PAL.TRUNK_LIGHT);
        // Roots
        c.fillStyle = PAL.TRUNK;
        c.fillRect(5, 11, 6, 2);
        c.fillRect(4, 12, 2, 1);
        c.fillRect(10, 12, 2, 1);
        // Ground detail
        c.fillStyle = PAL.GRASS_DARK;
        c.fillRect(3, 13, 10, 1);
        px(c, 2, 14, PAL.GRASS_DARK);
        px(c, 13, 14, PAL.GRASS_DARK);
    });

    // FLOWER - colorful garden
    drawTile(TILES.FLOWER, (c) => {
        c.fillStyle = PAL.GRASS_LIGHT;
        c.fillRect(0, 0, 16, 16);
        c.fillStyle = PAL.GRASS_MID;
        c.fillRect(0, 8, 16, 8);
        // Stems
        c.fillStyle = PAL.GRASS_DARK;
        px(c, 3, 5, PAL.GRASS_DARK);
        px(c, 3, 6, PAL.GRASS_DARK);
        px(c, 11, 9, PAL.GRASS_DARK);
        px(c, 11, 10, PAL.GRASS_DARK);
        px(c, 7, 7, PAL.GRASS_DARK);
        px(c, 7, 8, PAL.GRASS_DARK);
        px(c, 5, 12, PAL.GRASS_DARK);
        px(c, 5, 13, PAL.GRASS_DARK);
        // Red flowers (3 petals)
        px(c, 2, 3, PAL.FLOWER_RED); px(c, 3, 3, PAL.FLOWER_RED); px(c, 4, 3, PAL.FLOWER_RED);
        px(c, 3, 4, PAL.FLOWER_RED);
        px(c, 3, 3, PAL.FLOWER_YELLOW); // center
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
        c.fillStyle = PAL.GRASS_LIGHT;
        c.fillRect(0, 0, 16, 16);
        // Posts
        c.fillStyle = PAL.FENCE;
        c.fillRect(1, 2, 3, 12);
        c.fillRect(12, 2, 3, 12);
        // Post caps
        c.fillStyle = PAL.FENCE_LIGHT;
        c.fillRect(1, 2, 3, 1);
        c.fillRect(12, 2, 3, 1);
        // Post shadow
        c.fillStyle = PAL.FENCE_DARK;
        c.fillRect(1, 13, 3, 1);
        c.fillRect(12, 13, 3, 1);
        // Rails
        c.fillStyle = PAL.FENCE;
        c.fillRect(0, 5, 16, 2);
        c.fillRect(0, 10, 16, 2);
        // Rail highlight
        c.fillStyle = PAL.FENCE_LIGHT;
        c.fillRect(0, 5, 16, 1);
        c.fillRect(0, 10, 16, 1);
        // Rail shadow
        c.fillStyle = PAL.FENCE_DARK;
        c.fillRect(0, 7, 16, 1);
        c.fillRect(0, 12, 16, 1);
    });

    // SAND - beach/sandy area
    drawTile(TILES.SAND, (c) => {
        c.fillStyle = PAL.SAND;
        c.fillRect(0, 0, 16, 16);
        // Warm patches
        c.fillStyle = PAL.SAND_LIGHT;
        c.fillRect(2, 2, 5, 4);
        c.fillRect(9, 9, 5, 4);
        // Grain details
        px(c, 4, 3, PAL.SAND_DARK);
        px(c, 11, 9, PAL.SAND_DARK);
        px(c, 7, 6, PAL.SAND_DARK);
        px(c, 1, 13, PAL.SAND_DARK);
        px(c, 14, 2, PAL.SAND_DARK);
        // Shell/pebble accents
        px(c, 8, 12, PAL.PATH_DARK);
        px(c, 3, 8, PAL.PATH_DARK);
    });

    // PETANQUE_TERRAIN - packed dirt with lines
    drawTile(TILES.PETANQUE_TERRAIN, (c) => {
        c.fillStyle = PAL.TERRAIN;
        c.fillRect(0, 0, 16, 16);
        // Lighter patches
        c.fillStyle = PAL.TERRAIN_LIGHT;
        c.fillRect(3, 3, 5, 4);
        c.fillRect(8, 9, 5, 4);
        // Border
        c.fillStyle = PAL.TERRAIN_DARK;
        c.fillRect(0, 0, 16, 1);
        c.fillRect(0, 15, 16, 1);
        c.fillRect(0, 0, 1, 16);
        c.fillRect(15, 0, 1, 16);
        // Subtle marks on terrain
        px(c, 5, 7, PAL.TERRAIN_DARK);
        px(c, 10, 4, PAL.TERRAIN_DARK);
        px(c, 7, 12, PAL.TERRAIN_DARK);
        // Highlight
        px(c, 4, 5, PAL.TERRAIN_LIGHT);
        px(c, 12, 10, PAL.TERRAIN_LIGHT);
    });

    // Add as texture
    scene.textures.addCanvas('village_tileset', canvas);

    return canvas;
}
