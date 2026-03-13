// Resolution
export const GAME_WIDTH = 416;
export const GAME_HEIGHT = 240;
export const TILE_SIZE = 16;

// Mouvement joueur
export const PLAYER_MOVE_DURATION = 200;
export const PLAYER_ANIM_FPS = 8;

// Petanque - terrain (vertical: player bottom, cochonnet top)
// Display: narrow & tall, ratio ~15:4 FIPJP
export const TERRAIN_WIDTH = 90;
export const TERRAIN_HEIGHT = 210;
export const COCHONNET_MIN_DIST = 100;
export const COCHONNET_MAX_DIST = 170;

// Petanque - physique
export const FRICTION_BASE = 0.15;
export const SPEED_THRESHOLD = 0.3;
export const RESTITUTION_BOULE = 0.85;
export const RESTITUTION_COCHONNET = 0.7;
export const MAX_THROW_SPEED = 12;
export const LANDING_FACTOR_POINT = 0.65;
export const LANDING_FACTOR_TIR = 0.3;
export const ROLLING_EFFICIENCY = 0.7;

// Petanque - IA
export const AI_DELAY_MIN = 1000;
export const AI_DELAY_MAX = 2000;
export const AI_EASY = { angleDev: 15, powerDev: 0.20, canShoot: false };
export const AI_MEDIUM = { angleDev: 8, powerDev: 0.10, canShoot: true, shootThreshold: 2 };
export const AI_HARD = { angleDev: 3, powerDev: 0.05, canShoot: true, shootThreshold: 4 };

// Petanque - lancer
export const DEAD_ZONE_PX = 15;
export const THROW_FLY_DURATION = 300;
export const THROW_SHAKE_INTENSITY = 2;
export const THROW_SHAKE_DURATION = 150;

// Victoire
export const VICTORY_SCORE = 13;

// Camera
export const CAMERA_LERP = 0.1;

// Dialogue
export const TYPEWRITER_SPEED = 30;

// Palette provencale
export const COLORS = {
    OCRE: 0xD4A574,
    TERRACOTTA: 0xC4854A,
    LAVANDE: 0x9B7BB8,
    OLIVE: 0x6B8E4E,
    CIEL: 0x87CEEB,
    CREME: 0xF5E6D0,
    OMBRE: 0x3A2E28,
    ACCENT: 0xC44B3F,
    BLANC: 0xFFFFFF,
    GRIS: 0x9E9E8E
};

// Terrain colors (for placeholder rendering)
export const TERRAIN_COLORS = {
    terre: { bg: 0xC4854A, line: 0xFFFFFF },
    herbe: { bg: 0x6B8E4E, line: 0xFFFFFF },
    sable: { bg: 0xE8D5B7, line: 0xFFFFFF },
    dalles: { bg: 0x9E9E8E, line: 0xFFFFFF }
};

// Terrain friction multipliers
export const TERRAIN_FRICTION = {
    terre: 1.0,
    herbe: 1.8,
    sable: 3.0,
    dalles: 0.7
};

// Ball colors (placeholder)
export const BALL_COLORS = {
    player: 0xA8B5C2,
    opponent: 0xC44B3F,
    cochonnet: 0xFFD700
};

// Ball sizes (pixels in game)
export const BALL_RADIUS = 5;
export const COCHONNET_RADIUS = 2;
export const BALL_MASS = 700;
export const COCHONNET_MASS = 30;

// Circle de lancer
export const THROW_CIRCLE_RADIUS = 8;
export const THROW_CIRCLE_Y_OFFSET = 10;
