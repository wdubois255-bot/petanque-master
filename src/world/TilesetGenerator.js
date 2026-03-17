// Tile types enum - indices into basechip_combined.png
// basechip is 8 columns wide (256px / 32px), so index = row * 8 + col
// Full tileset: 256x4320 = 8 cols x 135 rows

export const TILES = {
    // ============================================================
    // TERRAIN (ground layer)
    // ============================================================

    // Row 0: basic terrain fills
    GRASS:             0,   // row 0, col 0 - bright green grass
    GRASS_YELLOW:      1,   // row 0, col 1 - yellow-green grass
    GRASS_MEDIUM:      2,   // row 0, col 2 - medium green grass
    GRASS_LIGHT:       3,   // row 0, col 3 - pale yellow-green grass
    GRASS_DARK:        4,   // row 0, col 4 - dark olive grass
    SAND:              5,   // row 0, col 5 - tan sand
    PETANQUE_TERRAIN:  6,   // row 0, col 6 - cracked dry dirt (light brown)
    STONE_FLOOR:       7,   // row 0, col 7 - grey stone floor

    // Alias for backward compat (PATH was col 1 but that's yellow grass)
    PATH:              5,   // use sand as path (tan dirt road)

    // Row 36: paved floor tiles (indoor/outdoor plazas)
    BRICK_FLOOR:     288,   // row 36, col 0 - yellow brick
    STONE_GREY:      289,   // row 36, col 1 - grey stone brick
    COBBLESTONE:     290,   // row 36, col 2 - brown cobblestone
    STONE_SLAB:      291,   // row 36, col 3 - grey stone slabs
    TILE_BLACK:      292,   // row 36, col 4 - black tile
    TILE_RED:        293,   // row 36, col 5 - red tile
    TILE_ORANGE:     296,   // row 37, col 0 - orange/terracotta tile
    TILE_BLUE:       297,   // row 37, col 1 - blue cobblestone
    TILE_DIAMOND:    298,   // row 37, col 2 - orange diamond pattern
    WOOD_FLOOR:      299,   // row 37, col 3 - wood plank floor

    // ============================================================
    // TREES (2x2 large trees: top-left at row N, bottom-left at row N+1)
    // ============================================================

    // Row 1-2: large trees (each tree is 2 cols x 2 rows)
    TREE_GREEN_TL:     8,   // row 1, col 0 - green tree top-left
    TREE_GREEN_TR:     9,   // row 1, col 1 - green tree top-right
    TREE_GREEN_BL:    16,   // row 2, col 0 - green tree bottom-left
    TREE_GREEN_BR:    17,   // row 2, col 1 - green tree bottom-right

    TREE_DARK_TL:     10,   // row 1, col 2 - dark green tree top-left
    TREE_DARK_TR:     11,   // row 1, col 3 - dark green tree top-right
    TREE_DARK_BL:     18,   // row 2, col 2 - dark green tree bottom-left
    TREE_DARK_BR:     19,   // row 2, col 3 - dark green tree bottom-right

    TREE_AUTUMN_TL:   12,   // row 1, col 4 - orange/autumn tree top-left
    TREE_AUTUMN_TR:   13,   // row 1, col 5 - orange/autumn tree top-right
    TREE_AUTUMN_BL:   20,   // row 2, col 4 - orange/autumn tree bottom-left
    TREE_AUTUMN_BR:   21,   // row 2, col 5 - orange/autumn tree bottom-right

    TREE_DEAD_TL:     14,   // row 1, col 6 - dead/bare tree top-left
    TREE_DEAD_TR:     15,   // row 1, col 7 - dead/bare tree top-right
    TREE_DEAD_BL:     22,   // row 2, col 6 - dead/bare tree bottom-left
    TREE_DEAD_BR:     23,   // row 2, col 7 - dead/bare tree bottom-right

    // Row 3-4: medium trees (2 cols x 2 rows)
    TREE_MED_GREEN_TL: 24,  // row 3, col 0
    TREE_MED_GREEN_TR: 25,  // row 3, col 1
    TREE_MED_GREEN_BL: 32,  // row 4, col 0
    TREE_MED_GREEN_BR: 33,  // row 4, col 1

    TREE_MED_ORANGE_TL: 26, // row 3, col 2 - small orange bush top
    TREE_MED_ORANGE_TR: 27, // row 3, col 3
    TREE_MED_ORANGE_BL: 34, // row 4, col 2
    TREE_MED_ORANGE_BR: 35, // row 4, col 3

    TREE_MED_DEAD_TL:  28,  // row 3, col 4 - dead shrub top
    TREE_MED_DEAD_TR:  29,  // row 3, col 5
    TREE_MED_DEAD_BL:  36,  // row 4, col 4
    TREE_MED_DEAD_BR:  37,  // row 4, col 5

    LOG:               38,  // row 4, col 6 - fallen log
    TREE_STUMP_LARGE:  39,  // row 4, col 7 - large stump

    // Row 5: small round trees (1-tile, top-down view)
    TREE_TOP:          40,  // row 5, col 0 - light green small round tree
    TREE_TRUNK:        41,  // row 5, col 1 - dark green small round tree
    TREE_SMALL_ORANGE: 42,  // row 5, col 2 - orange small round tree
    TREE_SMALL_DEAD:   43,  // row 5, col 3 - dead small tree/stump
    TREE_FRUIT:        44,  // row 5, col 4 - purple fruit tree
    LILY_PAD_GREEN:    45,  // row 5, col 5 - green lily pad
    LILY_PAD_BLUE:     46,  // row 5, col 6 - blue/grey lily pad
    TREE_STUMP:        47,  // row 5, col 7 - small grey stump

    // ============================================================
    // NATURE DECORATIONS (buildings layer)
    // ============================================================

    // Row 6: ground decorations
    GRASS_TUFT:        48,  // row 6, col 0 - grass tufts
    PEBBLES:           49,  // row 6, col 1 - small pebbles/stones
    LEAF_PILE_GREEN:   50,  // row 6, col 2 - green leaf pile
    LEAF_PILE_BLUE:    51,  // row 6, col 3 - blue/grey leaf pile
    FLOWER_WHITE:      52,  // row 6, col 4 - white flowers
    FLOWER:            53,  // row 6, col 5 - pink/mixed flowers
    FLOWER_BLUE:       54,  // row 6, col 6 - blue flowers
    FLOWER_YELLOW:     55,  // row 6, col 7 - yellow flowers

    // Row 7: small items
    MUSHROOM_BROWN:    56,  // row 7, col 0 - brown mushroom
    ACORN:             57,  // row 7, col 1 - acorn/nut
    MUSHROOM_RED:      58,  // row 7, col 2 - red mushroom
    EGGS_BLUE:         59,  // row 7, col 3 - blue eggs/nest
    FLOWER_CLUSTER:    60,  // row 7, col 4 - yellow flower cluster
    MUSHROOM_GREY:     61,  // row 7, col 5 - grey mushrooms
    WOOD_STUMP:        62,  // row 7, col 6 - wood stump/post
    ROCK_TINY:         63,  // row 7, col 7 - tiny rock

    // Row 8: rocks and cemetery
    ROCK_LARGE:        64,  // row 8, col 0 - large brown boulder
    ROCK_SMALL:        65,  // row 8, col 1 - seashell/round rock
    GRAVESTONE:        66,  // row 8, col 2 - grey gravestone
    CROSS:             67,  // row 8, col 3 - stone cross
    COBWEB:            68,  // row 8, col 4 - cobweb
    DARK_PILLAR:       69,  // row 8, col 5 - dark wood pillar/post
    SPIDERWEB:         70,  // row 8, col 6 - full spiderweb

    // ============================================================
    // CLIFFS / LEDGES (rows 9-15)
    // ============================================================

    // Row 9: cliff top edges (grass-on-dirt ledge)
    CLIFF_TOP_L:       72,  // row 9, col 0 - cliff top-left corner
    CLIFF_TOP_M:       73,  // row 9, col 1 - cliff top-middle
    CLIFF_TOP_R:       74,  // row 9, col 2 - cliff top-right corner
    CLIFF_TOP_INNER:   75,  // row 9, col 3 - cliff top inner grass patch
    CLIFF_SIDE_L:      76,  // row 9, col 4 - cliff left side with grass top
    CLIFF_SIDE_R:      77,  // row 9, col 5 - cliff right side
    CLIFF_GRASS_EDGE:  78,  // row 9, col 6 - grass-cliff transition
    CLIFF_CORNER_R:    79,  // row 9, col 7 - cliff corner piece

    // Row 10: cliff middles
    CLIFF_MID_L:       80,  // row 10, col 0 - cliff middle-left (dirt face)
    CLIFF_MID_OPEN:    81,  // row 10, col 1 - cliff middle open (grass window)
    CLIFF_MID_R:       82,  // row 10, col 2 - cliff middle-right
    CLIFF_DIRT:        83,  // row 10, col 3 - pure cliff dirt face
    CLIFF_POST:        84,  // row 10, col 4 - cliff with post/pole
    CLIFF_VINE:        85,  // row 10, col 5 - cliff with vine
    CLIFF_MID_GRASS:   86,  // row 10, col 6 - cliff mid with grass top
    CLIFF_PIECE:       87,  // row 10, col 7 - cliff fragment

    // Row 11: cliff bottoms
    CLIFF_BOT_L:       88,  // row 11, col 0 - cliff bottom-left
    CLIFF_BOT_M:       89,  // row 11, col 1 - cliff bottom-middle
    CLIFF_BOT_R:       90,  // row 11, col 2 - cliff bottom-right
    CLIFF_BOT_DIRT:    91,  // row 11, col 3 - cliff bottom dirt
    CLIFF_POST_BOT:    92,  // row 11, col 4 - cliff bottom with post
    CLIFF_BOT_GRASS:   93,  // row 11, col 5 - cliff bottom grass transition
    CLIFF_BOT_EDGE:    94,  // row 11, col 6 - cliff bottom edge
    CLIFF_BOT_CORNER:  95,  // row 11, col 7 - cliff bottom corner

    // Row 12-13: more cliff/dirt transitions
    CLIFF_DIRT_FULL:   96,  // row 12, col 0 - full dirt tile
    CLIFF_DIRT_GRASS:  97,  // row 12, col 1 - dirt with grass edge
    CLIFF_DIRT_TOP:    98,  // row 12, col 2 - dirt top edge
    CLIFF_INNER_L:    104,  // row 13, col 0 - inner cliff left
    CLIFF_INNER_M:    105,  // row 13, col 1 - inner cliff middle
    CLIFF_INNER_R:    106,  // row 13, col 2 - inner cliff right

    // Row 14-15: dirt path/cliff edges
    DIRT_PATH_TL:     112,  // row 14, col 0 - dirt path top-left edge
    DIRT_PATH_T:      113,  // row 14, col 1 - dirt path top
    DIRT_PATH_TR:     114,  // row 14, col 2 - dirt path top-right
    LADDER_WOOD:      115,  // row 14, col 3 - wooden ladder
    CLIFF_ROCK_L:     116,  // row 14, col 4 - rocky cliff left
    CLIFF_ROCK_R:     117,  // row 14, col 5 - rocky cliff right
    DIRT_PATH_BL:     120,  // row 15, col 0 - dirt path bottom-left
    DIRT_PATH_B:      121,  // row 15, col 1 - dirt path bottom
    DIRT_PATH_BR:     122,  // row 15, col 2 - dirt path bottom-right

    // ============================================================
    // CAVE / CLIFF WALLS (rows 16-18)
    // ============================================================
    CAVE_WALL_TL:     128,  // row 16, col 0 - cave wall top-left
    CAVE_WALL_TM:     129,  // row 16, col 1 - cave wall top-mid
    CAVE_WALL_TR:     130,  // row 16, col 2 - cave wall top-right
    CAVE_WALL_ML:     136,  // row 17, col 0 - cave wall mid-left
    CAVE_WALL_MM:     137,  // row 17, col 1 - cave wall mid-mid
    CAVE_WALL_MR:     138,  // row 17, col 2 - cave wall mid-right
    CAVE_ENTRANCE:    144,  // row 18, col 0 - cave entrance/opening
    LADDER:           145,  // row 18, col 1 - wooden ladder (cave)
    LADDER_TOP:       146,  // row 18, col 2 - ladder top piece
    DEAD_TREE_GREEN:  147,  // row 18, col 3 - dead green tree/branch

    // ============================================================
    // FARM ELEMENTS (rows 19-20)
    // ============================================================
    SCARECROW:        153,  // row 19, col 1 - scarecrow
    VEGETABLE_CARROT: 148,  // row 18, col 4 - carrot/root vegetable
    VEGETABLE_BEAN:   149,  // row 18, col 5 - bean/pea plant
    VEGETABLE_TURNIP: 150,  // row 18, col 6 - turnip/beet
    VEGETABLE_LETTUCE:151,  // row 18, col 7 - cabbage/lettuce

    HAY_TL:           152,  // row 19, col 0 - hay field top-left
    HAY_TR:           155,  // row 19, col 3 - hay field top-right (butterfly?)
    CORN:             156,  // row 19, col 4 - corn stalk
    PUMPKIN:          157,  // row 19, col 5 - pumpkin
    CABBAGE:          158,  // row 19, col 6 - cabbage head
    HAY_BL:           160,  // row 20, col 0 - hay field bottom-left
    HAY_BR:           161,  // row 20, col 1 - hay field bottom-right
    HAY_BALE:         162,  // row 20, col 2 - round hay bale
    ROSE:             163,  // row 20, col 3 - red rose
    CORN_2:           164,  // row 20, col 4 - another corn stalk
    WHEAT:            165,  // row 20, col 5 - wheat/grain

    // ============================================================
    // WOODEN FENCES (rows 21-23)
    // ============================================================

    // Row 21: rustic wooden fence horizontal pieces
    FENCE_WOOD_L:     168,  // row 21, col 0 - wood fence left end
    FENCE_WOOD_M:     169,  // row 21, col 1 - wood fence middle
    FENCE_WOOD_R:     170,  // row 21, col 2 - wood fence right end
    FENCE_WOOD_POST:  171,  // row 21, col 3 - wood fence post
    FENCE_WOOD_H:     172,  // row 21, col 4 - wood fence horizontal bar
    FENCE_WOOD_T:     173,  // row 21, col 5 - wood fence T-junction
    FENCE_WOOD_CROSS: 174,  // row 21, col 6 - wood fence crossbar
    FENCE_WOOD_END:   175,  // row 21, col 7 - wood fence end post

    // Row 22: more wooden fence variants
    FENCE_H_L:        176,  // row 22, col 0 - horizontal fence left section
    FENCE_H_M:        177,  // row 22, col 1 - horizontal fence middle section
    FENCE_H_R:        178,  // row 22, col 2 - horizontal fence right section
    FENCE_POST:       179,  // row 22, col 3 - single fence post
    FENCE:            180,  // row 22, col 4 - fence post with crossbar (vertical)
    FENCE_H:          181,  // row 22, col 5 - horizontal fence section
    FENCE_FULL:       182,  // row 22, col 6 - full fence panel
    FENCE_GATE:       183,  // row 22, col 7 - fence gate/opening

    // Row 23: fence bottom pieces
    FENCE_BOT_L:      184,  // row 23, col 0 - fence bottom-left
    FENCE_BOT_M:      185,  // row 23, col 1 - fence bottom-middle
    FENCE_BOT_R:      186,  // row 23, col 2 - fence bottom-right
    FENCE_BOT_POST:   187,  // row 23, col 3 - fence bottom post

    // ============================================================
    // IRON FENCES (row 24)
    // ============================================================
    IRON_FENCE_POST:  192,  // row 24, col 0 - iron fence post (ornate)
    IRON_FENCE_H:     193,  // row 24, col 1 - iron fence horizontal
    IRON_FENCE_H2:    194,  // row 24, col 2 - iron fence horizontal variant
    IRON_FENCE_H3:    195,  // row 24, col 3 - iron fence horizontal with post
    IRON_FENCE_POST2: 196,  // row 24, col 4 - iron fence post variant
    IRON_FENCE_R:     197,  // row 24, col 5 - iron fence right section
    IRON_FENCE_CORNER:198,  // row 24, col 6 - iron fence corner
    IRON_FENCE_END:   199,  // row 24, col 7 - iron fence end piece

    // ============================================================
    // STONE WALLS & BUILDING BLOCKS (rows 25-26)
    // ============================================================

    // Row 25: stone block wall sections
    STONE_WALL_TL:    200,  // row 25, col 0 - stone wall top-left corner
    STONE_WALL_TM:    201,  // row 25, col 1 - stone wall top-middle
    STONE_WALL_TR:    202,  // row 25, col 2 - stone wall top-right corner
    STONE_WALL_ML:    203,  // row 25, col 3 - stone wall mid-left
    STONE_WALL_MID:   204,  // row 25, col 4 - stone wall middle
    STONE_WALL_MR:    205,  // row 25, col 5 - stone wall mid-right
    STONE_WALL_INNER: 206,  // row 25, col 6 - stone wall inner corner
    STONE_WALL_OUTER: 207,  // row 25, col 7 - stone wall outer corner

    // Row 26: stone wall bottom + windows + market stall
    STONE_WALL_BL:    208,  // row 26, col 0 - stone wall bottom-left
    STONE_WALL_BM:    209,  // row 26, col 1 - stone wall bottom-middle
    STONE_WALL_BR:    210,  // row 26, col 2 - stone wall bottom-right
    WINDOW_SMALL:     211,  // row 26, col 3 - small square window
    IRON_GATE:        212,  // row 26, col 4 - iron gate/door
    BARREL:           213,  // row 26, col 5 - wooden barrel
    WALL_TOP:         214,  // row 26, col 6 - stone wall top (market left?)
    MARKET_STALL:     215,  // row 26, col 7 - market stall (red awning)

    // ============================================================
    // OUTDOOR FURNITURE & SIGNS (row 27-28)
    // ============================================================

    // Row 27: benches, signs, bulletin board
    BENCH:            216,  // row 27, col 0 - wooden bench (left)
    BENCH_R:          217,  // row 27, col 1 - wooden bench (right)
    WALL_FRONT:       218,  // row 27, col 2 - iron door/gate dark
    MONEY_BAG:        219,  // row 27, col 3 - money sack
    SIGN_POST:        220,  // row 27, col 4 - wooden sign post
    SIGN_DIRECTION:   221,  // row 27, col 5 - directional sign post
    NOTICE_BOARD:     222,  // row 27, col 6 - notice/bulletin board
    NOTICE_BOARD_R:   223,  // row 27, col 7 - notice board right part

    // Row 28: small signs and crosses
    SIGN_SMALL:       224,  // row 28, col 0 - small wooden sign
    SIGN_SMALL_2:     225,  // row 28, col 1 - small sign variant
    SIGN_CROSS:       226,  // row 28, col 2 - cross-shaped sign
    SIGN_ARROW:       227,  // row 28, col 3 - arrow sign

    // ============================================================
    // BRIDGES (rows 29-30)
    // ============================================================

    // Row 29: stone bridge top
    BRIDGE_TL:        232,  // row 29, col 0 - bridge top-left
    BRIDGE_TM:        233,  // row 29, col 1 - bridge top-middle
    BRIDGE_TM2:       234,  // row 29, col 2 - bridge top-middle 2
    BRIDGE_TR:        235,  // row 29, col 3 - bridge top-right
    BRIDGE_RAIL_L:    236,  // row 29, col 4 - bridge railing left
    BRIDGE_RAIL_M:    237,  // row 29, col 5 - bridge railing middle
    BRIDGE_ROPE:      238,  // row 29, col 6 - rope/chain decoration
    BRIDGE_ROPE_END:  239,  // row 29, col 7 - rope/chain end

    // Row 30: stone bridge bottom (arch)
    BRIDGE_BL:        240,  // row 30, col 0 - bridge bottom-left (arch)
    BRIDGE_BM:        241,  // row 30, col 1 - bridge bottom-middle (arch)
    BRIDGE_BM2:       242,  // row 30, col 2 - bridge bottom-middle 2
    BRIDGE_BR:        243,  // row 30, col 3 - bridge bottom-right (arch)

    // Row 31: fountain / well / lantern
    WELL_TL:          244,  // row 30, col 4 - well/fountain top-left
    WELL_TR:          245,  // row 30, col 5 - well/fountain top-right
    FOUNTAIN_BASE:    248,  // row 31, col 0 - fountain stone base left
    FOUNTAIN_BASE_R:  249,  // row 31, col 1 - fountain stone base right
    CANDLES:          250,  // row 31, col 2 - candles/lantern
    FOUNTAIN_TOP:     251,  // row 31, col 3 - fountain top piece
    WELL_BL:          252,  // row 31, col 4 - well bottom-left
    WELL_BR:          253,  // row 31, col 5 - well bottom-right

    // ============================================================
    // BUILDING EXTERIOR - WALLS, ROOFS, DOORS (rows 32-35, 40-55)
    // ============================================================

    // Row 32: castle/stone building walls
    CASTLE_WALL_TL:   256,  // row 32, col 0 - castle wall top-left
    CASTLE_WALL_TM:   257,  // row 32, col 1 - castle wall top
    CASTLE_WALL_TR:   258,  // row 32, col 2 - castle wall top-right
    CASTLE_PILLAR_T:  259,  // row 32, col 3 - castle pillar top
    CASTLE_WALL_ML:   260,  // row 32, col 4 - castle wall mid-left
    CASTLE_WALL_MM:   261,  // row 32, col 5 - castle wall mid
    CASTLE_WALL_MR:   262,  // row 32, col 6 - castle wall mid-right

    // Row 33: ornamental railing / clothesline
    RAILING_L:        264,  // row 33, col 0 - wooden railing/balcony left
    RAILING_M:        265,  // row 33, col 1 - railing middle
    RAILING_R:        266,  // row 33, col 2 - railing right
    GOLD_POST:        267,  // row 33, col 3 - golden ornamental post
    CLOTHESLINE_L:    268,  // row 33, col 4 - clothesline post left
    CLOTHESLINE_M:    269,  // row 33, col 5 - clothesline with clothes
    CLOTHESLINE_R:    270,  // row 33, col 6 - clothesline post right

    // Row 34: wood plank walls / stairs
    WOOD_WALL_L:      272,  // row 34, col 0 - wood plank wall left
    WOOD_WALL_M:      273,  // row 34, col 1 - wood plank wall middle
    WOOD_WALL_R:      274,  // row 34, col 2 - wood plank wall right
    STAIRS_WOOD:      275,  // row 34, col 3 - wooden stairs
    WOOD_WALL_H:      276,  // row 34, col 4 - horizontal wood planks
    WOOD_WALL_H2:     277,  // row 34, col 5 - horizontal wood planks var

    // Row 35: building facades
    FACADE_WOOD_L:    280,  // row 35, col 0 - wood facade left
    FACADE_WOOD_M:    281,  // row 35, col 1 - wood facade middle
    FACADE_COLUMN:    282,  // row 35, col 2 - facade column/pillar
    FACADE_DOOR:      283,  // row 35, col 3 - facade with door frame
    FACADE_WOOD_R:    284,  // row 35, col 4 - wood facade right
    FACADE_WALL:      285,  // row 35, col 5 - facade wall panel
    FACADE_TRIM:      286,  // row 35, col 6 - facade trim/border
    FACADE_DOOR_R:    287,  // row 35, col 7 - door right side

    // Row 40-41: building exterior (wood/roof structures)
    ROOF_SLOPE_TL:    320,  // row 40, col 0 - green/yellow roof slope TL
    ROOF_SLOPE_TR:    321,  // row 40, col 1 - grey/tan roof slope TR
    ROOF_SLOPE_DARK:  322,  // row 40, col 2 - dark roof slope
    ROOF_PEAK_L:      323,  // row 40, col 3 - roof peak left
    ROOF_PEAK_R:      324,  // row 40, col 4 - red roof slope
    ROOF_DARK_PEAK:   325,  // row 40, col 5 - dark grey roof peak
    ROOF_CHIMNEY_TL:  326,  // row 40, col 6 - chimney top-left (triangle)
    ROOF_CHIMNEY_TR:  327,  // row 40, col 7 - chimney top-right

    // Row 41: building front (mid section)
    BUILDING_ML:      328,  // row 41, col 0 - building mid-left (wooden boards)
    BUILDING_MM:      329,  // row 41, col 1 - building mid-middle (grey)
    BUILDING_MR:      330,  // row 41, col 2 - building mid-right (grey siding)
    BUILDING_PEAK_L:  331,  // row 41, col 3 - building roof peak left
    BUILDING_PEAK_R:  332,  // row 41, col 4 - building roof peak right
    BUILDING_CHIMNEY: 333,  // row 41, col 5 - chimney/flue structure

    // Row 42: building lower section
    BUILDING_BL:      336,  // row 42, col 0 - building bottom-left
    BUILDING_BM:      337,  // row 42, col 1 - building bottom-mid
    BUILDING_BR:      338,  // row 42, col 2 - building bottom-right
    BUILDING_DOOR:    339,  // row 42, col 3 - building with door
    BUILDING_WALL_L:  340,  // row 42, col 4 - building wall left
    BUILDING_WALL_R:  341,  // row 42, col 5 - building wall right

    // Row 43: more building parts
    BUILDING_FRONT_L: 344,  // row 43, col 0 - building front left
    BUILDING_FRONT_M: 345,  // row 43, col 1 - building front middle (beige)
    BUILDING_FRONT_R: 346,  // row 43, col 2 - building front right
    BUILDING_PILLAR:  347,  // row 43, col 3 - building pillar/column
    BUILDING_SIDE:    348,  // row 43, col 4 - building side wall
    BUILDING_SIDE_R:  349,  // row 43, col 5 - building side wall right
    EXT_DOOR_FRAME:   350,  // row 43, col 6 - exterior door frame
    EXT_DOOR:         351,  // row 43, col 7 - exterior wooden door

    // ============================================================
    // HOUSE WALLS (rows 48-55) - brick & stone facades
    // ============================================================

    // Row 48: white wall tops / columns / doors
    WALL_WHITE_L:     384,  // row 48, col 0 - white wall top left
    WALL_WHITE_M:     385,  // row 48, col 1 - white wall top middle
    WALL_WHITE_R:     386,  // row 48, col 2 - white wall top right
    COLUMN_GREY_T:    387,  // row 48, col 3 - grey column top
    WALL_WHITE_ARCH:  388,  // row 48, col 4 - white wall with arch
    ARCH_WHITE:       389,  // row 48, col 5 - white arch doorway
    ARCH_DOOR:        390,  // row 48, col 6 - arched door frame
    DOOR_WOOD:        391,  // row 48, col 7 - large arched wooden door

    // Row 49: house upper walls (white + red brick band)
    HOUSE_UPPER:      392,  // row 49, col 0 - white wall with red brick at bottom (left)
    HOUSE_UPPER_M:    393,  // row 49, col 1 - white wall + brick middle
    HOUSE_UPPER_R:    394,  // row 49, col 2 - white wall + brick right
    COLUMN_GREY_M:    395,  // row 49, col 3 - grey column middle
    HOUSE_UPPER_W2:   396,  // row 49, col 4 - lighter variant
    HOUSE_UPPER_ARCH: 397,  // row 49, col 5 - upper wall arch
    HOUSE_UPPER_DOOR: 398,  // row 49, col 6 - upper wall with door frame
    DOOR_BROWN:       399,  // row 49, col 7 - brown wooden door

    // Row 50: house front (red brick)
    HOUSE_FRONT:      400,  // row 50, col 0 - red brick wall (left)
    HOUSE_FRONT_M:    401,  // row 50, col 1 - red brick wall middle
    HOUSE_FRONT_R:    402,  // row 50, col 2 - red brick wall right
    HOUSE_FRONT_TRIM: 403,  // row 50, col 3 - red brick with trim
    HOUSE_BRICK_PINK: 404,  // row 50, col 4 - pink/light brick
    HOUSE_BRICK_ALT:  405,  // row 50, col 5 - alternate brick pattern
    HOUSE_ARCH:       406,  // row 50, col 6 - arched doorway top
    DOOR:             407,  // row 50, col 7 - paneled brown door

    // Row 51: white brick / grey walls
    WALL_GREY_L:      408,  // row 51, col 0 - white/grey brick left
    WALL_GREY_M:      409,  // row 51, col 1 - white/grey brick middle
    WALL_GREY_R:      410,  // row 51, col 2 - white/grey brick right
    WALL_GREY_FLAT:   411,  // row 51, col 3 - flat grey/white wall
    WALL_TILE_WHITE:  412,  // row 51, col 4 - white tile wall
    WALL_TILE_GREY:   413,  // row 51, col 5 - grey tile wall
    DOOR_GREY:        414,  // row 51, col 6 - grey/metal door
    DOOR_DARK:        415,  // row 51, col 7 - dark brown door

    // Row 52: yellow/cream brick walls
    WALL_YELLOW_L:    416,  // row 52, col 0 - yellow brick left
    WALL_YELLOW_M:    417,  // row 52, col 1 - yellow brick middle
    WALL_YELLOW_R:    418,  // row 52, col 2 - yellow brick right

    // ============================================================
    // SHOP FRONTS / EXTERIOR STRUCTURES (rows 64-71)
    // ============================================================

    // Row 64-65: shop/storefront top
    SHOP_AWNING_TL:   512,  // row 64, col 0 - yellow awning top-left
    SHOP_AWNING_TM:   513,  // row 64, col 1 - yellow awning top-middle
    SHOP_AWNING_TR:   514,  // row 64, col 2 - yellow awning top-right
    SHOP_SIGN:        515,  // row 64, col 3 - shop sign panel
    SHOP_AWNING_2:    516,  // row 64, col 4 - awning variant
    SHOP_DOOR_FRAME:  518,  // row 64, col 6 - shop door frame
    SHOP_DOOR:        519,  // row 64, col 7 - shop door (wooden)

    // Row 65: shop front bottom
    SHOP_FRONT_L:     520,  // row 65, col 0 - shop front left (window display)
    SHOP_FRONT_M:     521,  // row 65, col 1 - shop front middle (glass)
    SHOP_FRONT_R:     522,  // row 65, col 2 - shop front right
    SHOP_COLUMN:      523,  // row 65, col 3 - shop column/pillar
    SHOP_FRONT_2:     524,  // row 65, col 4 - shop front variant
    SHOP_WINDOW:      525,  // row 65, col 5 - shop window
    SHOP_BRICK:       526,  // row 65, col 6 - shop brick section
    SHOP_DOOR_2:      527,  // row 65, col 7 - shop door variant

    // Row 66-67: iron railing / dark fences (tall)
    IRON_RAIL_TL:     528,  // row 66, col 0 - iron railing top-left
    IRON_RAIL_TM:     529,  // row 66, col 1 - iron railing top-middle
    IRON_RAIL_TR:     530,  // row 66, col 2 - iron railing top-right
    IRON_RAIL_GATE:   531,  // row 66, col 3 - iron railing gate
    IRON_RAIL_BL:     536,  // row 67, col 0 - iron railing bottom-left
    IRON_RAIL_BM:     537,  // row 67, col 1 - iron railing bottom-middle
    IRON_RAIL_BR:     538,  // row 67, col 2 - iron railing bottom-right
    IRON_RAIL_END:    539,  // row 67, col 3 - iron railing end

    // Row 68-69: exterior decoration tiles
    WOOD_DECK:        544,  // row 68, col 0 - wood deck/boardwalk
    BLUE_BRICK:       545,  // row 68, col 1 - blue brick path
    DARK_COBBLE:      546,  // row 68, col 2 - dark cobblestone
    GOLD_TILE:        547,  // row 68, col 3 - golden/coin tile
    GREY_METAL:       548,  // row 68, col 4 - grey metal plate
    GREY_DOOR_EXT:    549,  // row 68, col 5 - grey exterior door
    RED_BRICK_PATH:   552,  // row 69, col 0 - red brick path
    BLUE_PATH:        553,  // row 69, col 1 - blue path tiles
    DARK_STONE_PATH:  554,  // row 69, col 2 - dark stone path

    // ============================================================
    // ROOFTOPS (row 72)
    // ============================================================
    ROOF_WOOD:        576,  // row 72, col 0 - brown wooden plank roof
    ROOF_BLUE:        577,  // row 72, col 1 - blue shingle roof
    ROOF_RED:         578,  // row 72, col 2 - red scallop roof tiles
    HOUSE_ROOF:       579,  // row 72, col 3 - straw/thatched roof (golden)
    ROOF_GREY:        580,  // row 72, col 4 - grey slate tiles
    ROOF_DARK:        581,  // row 72, col 5 - dark grey roof

    // ============================================================
    // WINDOWS & WALL DECORATIONS (rows 73-75)
    // ============================================================

    // Row 73: windows
    WINDOW_BROWN:     584,  // row 73, col 0 - brown frame window
    WINDOW_GRID:      585,  // row 73, col 1 - multi-pane grid window
    WINDOW_DARK:      586,  // row 73, col 2 - dark frame window
    WINDOW_ORNATE:    587,  // row 73, col 3 - ornamental golden window/shrine
    WINDOW_BOOK:      588,  // row 73, col 4 - dark panel (bookshelf/shelf?)
    DOOR_RED_ARCH:    589,  // row 73, col 5 - red arched door

    // Row 74: round windows and decorations
    WINDOW_ROUND:     592,  // row 74, col 0 - round/porthole window
    WINDOW_CROSS:     593,  // row 74, col 1 - cross-pane window
    ALCOVE:           594,  // row 74, col 2 - arched wall alcove/niche
    STONE_TABLET:     595,  // row 74, col 3 - dark stone tablet/plaque
    STAINED_GLASS:    596,  // row 74, col 4 - colorful stained glass (arched)
    CROSS_WALL:       597,  // row 74, col 5 - wall-mounted cross

    // Row 75: wall-mounted art
    MAP_SCROLL:       600,  // row 75, col 0 - map/parchment
    PAINTING:         601,  // row 75, col 1 - landscape painting
    PORTRAIT:         602,  // row 75, col 2 - portrait painting
    STAINED_GLASS_LG: 604,  // row 75, col 4 - large stained glass window

    // ============================================================
    // CHESTS & SHOP SIGNS (row 80-82)
    // ============================================================
    CHEST:            640,  // row 80, col 0 - brown wooden chest
    CHEST_IRON:       641,  // row 80, col 1 - dark iron chest
    CHEST_GOLD:       642,  // row 80, col 2 - ornate red/gold chest
    DARK_FENCE_PANEL: 643,  // row 80, col 3 - dark fence panel (vertical)

    // Row 82: sign icons (useful for shop facades)
    SIGN_INN:         656,  // row 82, col 0 - "INN" sign
    SIGN_HEALTH:      657,  // row 82, col 1 - heart/health sign
    SIGN_WEAPON:      658,  // row 82, col 2 - sword sign
    SIGN_SHIELD:      659,  // row 82, col 3 - shield sign
    SIGN_POTION:      660,  // row 82, col 4 - potion sign
    SIGN_MAGIC:       661,  // row 82, col 5 - magic sign
    SIGN_SKULL:       662,  // row 82, col 6 - skull/danger sign

    // ============================================================
    // WATER (row 133, appended from water1.png)
    // ============================================================
    WATER:           1064,  // row 133, col 0 - water center
    WATER_TL:        1065,  // row 133, col 1 - water top-left edge
    WATER_TR:        1066,  // row 133, col 2 - water top-right edge
    WATER_BL:        1072,  // row 134, col 0 - water bottom-left edge
    WATER_BR:        1073,  // row 134, col 1 - water bottom-right edge
};

// ============================================================
// Grouped categories for map generation convenience
// ============================================================
export const TILE_CATEGORIES = {
    terrain: [
        TILES.GRASS, TILES.GRASS_YELLOW, TILES.GRASS_MEDIUM,
        TILES.GRASS_LIGHT, TILES.GRASS_DARK, TILES.SAND,
        TILES.PETANQUE_TERRAIN, TILES.STONE_FLOOR,
        TILES.BRICK_FLOOR, TILES.STONE_GREY, TILES.COBBLESTONE,
        TILES.STONE_SLAB, TILES.TILE_RED, TILES.TILE_BLUE,
        TILES.WOOD_FLOOR,
    ],
    trees_large: [
        // Green 2x2
        [TILES.TREE_GREEN_TL, TILES.TREE_GREEN_TR, TILES.TREE_GREEN_BL, TILES.TREE_GREEN_BR],
        // Dark green 2x2
        [TILES.TREE_DARK_TL, TILES.TREE_DARK_TR, TILES.TREE_DARK_BL, TILES.TREE_DARK_BR],
        // Autumn 2x2
        [TILES.TREE_AUTUMN_TL, TILES.TREE_AUTUMN_TR, TILES.TREE_AUTUMN_BL, TILES.TREE_AUTUMN_BR],
        // Dead 2x2
        [TILES.TREE_DEAD_TL, TILES.TREE_DEAD_TR, TILES.TREE_DEAD_BL, TILES.TREE_DEAD_BR],
    ],
    trees_small: [
        TILES.TREE_TOP, TILES.TREE_TRUNK, TILES.TREE_SMALL_ORANGE,
        TILES.TREE_SMALL_DEAD, TILES.TREE_FRUIT,
    ],
    flowers: [
        TILES.FLOWER, TILES.FLOWER_WHITE, TILES.FLOWER_BLUE,
        TILES.FLOWER_YELLOW, TILES.ROSE, TILES.FLOWER_CLUSTER,
    ],
    decorations: [
        TILES.GRASS_TUFT, TILES.PEBBLES, TILES.MUSHROOM_BROWN,
        TILES.MUSHROOM_RED, TILES.ACORN, TILES.LOG,
        TILES.ROCK_SMALL, TILES.ROCK_LARGE,
        TILES.LEAF_PILE_GREEN, TILES.LEAF_PILE_BLUE,
    ],
    fences_wood: [
        TILES.FENCE, TILES.FENCE_H, TILES.FENCE_FULL,
        TILES.FENCE_POST, TILES.FENCE_GATE,
        TILES.FENCE_WOOD_L, TILES.FENCE_WOOD_M, TILES.FENCE_WOOD_R,
    ],
    fences_iron: [
        TILES.IRON_FENCE_POST, TILES.IRON_FENCE_H,
        TILES.IRON_FENCE_H2, TILES.IRON_FENCE_H3,
    ],
    walls_stone: [
        TILES.STONE_WALL_TL, TILES.STONE_WALL_TM, TILES.STONE_WALL_TR,
        TILES.STONE_WALL_ML, TILES.STONE_WALL_MID, TILES.STONE_WALL_MR,
        TILES.STONE_WALL_BL, TILES.STONE_WALL_BM, TILES.STONE_WALL_BR,
    ],
    house_walls: [
        TILES.HOUSE_UPPER, TILES.HOUSE_FRONT, TILES.HOUSE_ARCH, TILES.DOOR,
        TILES.DOOR_WOOD, TILES.DOOR_BROWN,
        TILES.WALL_WHITE_L, TILES.WALL_WHITE_M, TILES.WALL_WHITE_R,
        TILES.WALL_GREY_L, TILES.WALL_GREY_M, TILES.WALL_GREY_R,
        TILES.WALL_YELLOW_L, TILES.WALL_YELLOW_M, TILES.WALL_YELLOW_R,
    ],
    roofs: [
        TILES.ROOF_WOOD, TILES.ROOF_BLUE, TILES.ROOF_RED,
        TILES.HOUSE_ROOF, TILES.ROOF_GREY, TILES.ROOF_DARK,
    ],
    windows: [
        TILES.WINDOW_SMALL, TILES.WINDOW_BROWN, TILES.WINDOW_GRID,
        TILES.WINDOW_DARK, TILES.WINDOW_ROUND, TILES.WINDOW_CROSS,
    ],
    doors: [
        TILES.DOOR, TILES.DOOR_WOOD, TILES.DOOR_BROWN,
        TILES.DOOR_GREY, TILES.DOOR_DARK, TILES.DOOR_RED_ARCH,
        TILES.ARCH_DOOR, TILES.ARCH_WHITE,
    ],
    bridges: [
        TILES.BRIDGE_TL, TILES.BRIDGE_TM, TILES.BRIDGE_TM2, TILES.BRIDGE_TR,
        TILES.BRIDGE_BL, TILES.BRIDGE_BM, TILES.BRIDGE_BM2, TILES.BRIDGE_BR,
    ],
    signs: [
        TILES.SIGN_POST, TILES.SIGN_DIRECTION, TILES.SIGN_SMALL,
        TILES.NOTICE_BOARD, TILES.SIGN_INN,
    ],
    farm: [
        TILES.SCARECROW, TILES.CORN, TILES.PUMPKIN, TILES.CABBAGE,
        TILES.WHEAT, TILES.HAY_BALE, TILES.VEGETABLE_CARROT,
        TILES.VEGETABLE_BEAN, TILES.VEGETABLE_TURNIP, TILES.VEGETABLE_LETTUCE,
    ],
    water: [
        TILES.WATER, TILES.LILY_PAD_GREEN, TILES.LILY_PAD_BLUE,
    ],
    furniture_outdoor: [
        TILES.BENCH, TILES.BENCH_R, TILES.BARREL,
        TILES.MARKET_STALL, TILES.CHEST, TILES.WELL_TL, TILES.WELL_TR,
        TILES.WELL_BL, TILES.WELL_BR, TILES.CLOTHESLINE_L,
        TILES.CLOTHESLINE_M, TILES.CLOTHESLINE_R,
    ],
    cemetery: [
        TILES.GRAVESTONE, TILES.CROSS,
    ],
    shop: [
        TILES.SHOP_AWNING_TL, TILES.SHOP_AWNING_TM, TILES.SHOP_AWNING_TR,
        TILES.SHOP_FRONT_L, TILES.SHOP_FRONT_M, TILES.SHOP_FRONT_R,
        TILES.SHOP_DOOR, TILES.SHOP_SIGN,
    ],
    cliffs: [
        TILES.CLIFF_TOP_L, TILES.CLIFF_TOP_M, TILES.CLIFF_TOP_R,
        TILES.CLIFF_MID_L, TILES.CLIFF_DIRT, TILES.CLIFF_MID_R,
        TILES.CLIFF_BOT_L, TILES.CLIFF_BOT_M, TILES.CLIFF_BOT_R,
    ],
};

// Compatibility stub - tileset is now loaded as PNG in BootScene
export function generateTileset(_scene) {
    // No-op: basechip_combined.png is preloaded in BootScene
    return null;
}
