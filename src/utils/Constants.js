// Resolution (doubled from 416x240 for 32x32 tiles)
export const GAME_WIDTH = 832;
export const GAME_HEIGHT = 480;
export const TILE_SIZE = 32;

// Mouvement joueur
export const PLAYER_MOVE_DURATION = 200;
export const PLAYER_ANIM_FPS = 8;

// Petanque - terrain (vertical: player bottom, cochonnet top)
// Display: narrow & tall, ratio ~15:4 FIPJP
export const TERRAIN_WIDTH = 180;
export const TERRAIN_HEIGHT = 420;
export const COCHONNET_MIN_DIST = 200;
export const COCHONNET_MAX_DIST = 340;

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
export const DEAD_ZONE_PX = 30;
export const THROW_FLY_DURATION = 300;
export const THROW_SHAKE_INTENSITY = 4;
export const THROW_SHAKE_DURATION = 150;

// Petanque - loft presets (pointer only, tirer uses LOFT_TIR)
export const LOFT_ROULETTE = {
    id: 'roulette', label: 'ROULETTE',
    landingFactor: 0.25, arcHeight: -8, flyDurationMult: 0.6, rollEfficiency: 1.4
};
export const LOFT_DEMI_PORTEE = {
    id: 'demi_portee', label: 'DEMI-PORTEE',
    landingFactor: 0.50, arcHeight: -36, flyDurationMult: 0.9, rollEfficiency: 0.9
};
export const LOFT_PLOMBEE = {
    id: 'plombee', label: 'PLOMBEE',
    landingFactor: 0.75, arcHeight: -70, flyDurationMult: 1.3, rollEfficiency: 0.5
};
export const LOFT_TIR = {
    id: 'tir', label: 'TIR',
    landingFactor: 0.30, arcHeight: -16, flyDurationMult: 0.7, rollEfficiency: 1.2
};
export const LOFT_PRESETS = [LOFT_ROULETTE, LOFT_DEMI_PORTEE, LOFT_PLOMBEE];

// Petanque - prediction trajectoire
export const PREDICTION_STEPS = 120;
export const PREDICTION_SAMPLE_RATE = 3;
export const PREDICTION_DOT_RADIUS = 2;

// Petanque - carreau
export const CARREAU_THRESHOLD = 16;
export const CARREAU_DISPLACED_MIN = 32;

// Petanque - lisibilite
export const PIXELS_TO_METERS = 15 / 420; // ~0.036 m/px (doubled terrain)

// Petanque - IA personnalites
export const AI_MARCEL = {
    angleDev: 5, powerDev: 0.08,
    personality: 'pointeur', shootProbability: 0.1,
    loftPref: 'roulette', targetsCocho: false
};
export const AI_FANNY = {
    angleDev: 5, powerDev: 0.08,
    personality: 'tireur', shootProbability: 0.85,
    loftPref: 'tir', targetsCocho: false
};
export const AI_RICARDO = {
    angleDev: 4, powerDev: 0.06,
    personality: 'stratege', shootProbability: 0.5,
    loftPref: 'adaptatif', targetsCocho: true
};
export const AI_MARIUS = {
    angleDev: 3, powerDev: 0.05,
    personality: 'complet', shootProbability: 0.5,
    loftPref: 'adaptatif', targetsCocho: true
};

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

// Ball sizes (pixels in game) - doubled
export const BALL_RADIUS = 10;
export const COCHONNET_RADIUS = 4;
export const BALL_MASS = 700;
export const COCHONNET_MASS = 30;

// Circle de lancer - doubled
export const THROW_CIRCLE_RADIUS = 16;
export const THROW_CIRCLE_Y_OFFSET = 20;
