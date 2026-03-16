// Tile types enum - indices into basechip_combined.png
// basechip is 8 columns wide (256px / 32px), so index = row * 8 + col

export const TILES = {
    // Row 0: basic terrain
    GRASS: 0,           // row 0, col 0 - plain green grass
    PATH: 1,            // row 0, col 1 - dirt path
    GRASS_LIGHT: 3,     // row 0, col 3 - lighter yellow-green grass
    GRASS_DARK: 4,      // row 0, col 4 - muted olive grass
    SAND: 5,            // row 0, col 5 - sand
    PETANQUE_TERRAIN: 6, // row 0, col 6 - cracked dry dirt
    STONE_FLOOR: 7,     // row 0, col 7 - grey stone floor

    // Row 5: small trees (round top-down view)
    TREE_TOP: 40,       // row 5, col 0 - light green round tree
    TREE_TRUNK: 41,     // row 5, col 1 - dark green round tree (bottom part)

    // Row 6: decorations
    GRASS_TUFT: 48,     // row 6, col 0 - grass tufts
    FLOWER_WHITE: 52,   // row 6, col 4 - white flowers
    FLOWER: 53,         // row 6, col 5 - pink/mixed flowers
    FLOWER_BLUE: 54,    // row 6, col 6 - blue flowers
    FLOWER_YELLOW: 55,  // row 6, col 7 - yellow flowers

    // Row 8: rocks and decorations
    ROCK_SMALL: 64,     // row 8, col 0 - small rocks
    ROCK_LARGE: 65,     // row 8, col 1 - large rocks

    // Row 22: wooden fence pieces
    FENCE: 180,         // row 22, col 4 - fence post with crossbar
    FENCE_H: 181,       // row 22, col 5 - horizontal fence section
    FENCE_FULL: 182,    // row 22, col 6 - full fence panel

    // Row 26-27: stone walls
    WALL_TOP: 214,      // row 26, col 6 - stone wall (top with lighter stones)
    WALL_FRONT: 218,    // row 27, col 2 - stone wall front (full)

    // Row 36: floor tiles
    BRICK_FLOOR: 288,   // row 36, col 0 - yellow brick
    STONE_GREY: 289,    // row 36, col 1 - grey stone brick
    COBBLESTONE: 290,   // row 36, col 2 - brown cobblestone
    STONE_SLAB: 291,    // row 36, col 3 - grey stone slabs

    // Row 49-50: house walls (white upper + red brick lower)
    HOUSE_UPPER: 392,   // row 49, col 0 - white wall with red brick bottom
    HOUSE_FRONT: 400,   // row 50, col 0 - red brick wall
    HOUSE_ARCH: 406,    // row 50, col 6 - arch/doorway top
    DOOR: 407,          // row 50, col 7 - brown paneled door

    // Row 48: doors and arches
    DOOR_WOOD: 391,     // row 48, col 7 - large wooden arched door

    // Row 72: rooftop tiles
    HOUSE_ROOF: 579,    // row 72, col 3 - red scallop roof
    ROOF_GREY: 580,     // row 72, col 4 - grey scallop/round roof
    ROOF_WOOD: 576,     // row 72, col 0 - wooden plank roof

    // Row 133 (appended): water tiles
    WATER: 1064,        // row 133, col 0 - water center (from water1.png)
};

// Compatibility stub - tileset is now loaded as PNG in BootScene
export function generateTileset(scene) {
    // No-op: basechip_combined.png is preloaded in BootScene
    return null;
}
