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
// 6m = 168px, 10m = 280px (terrain 420px = 15m)
export const COCHONNET_MIN_DIST = 168;
export const COCHONNET_MAX_DIST = 280;

// Petanque - physique
// Valeurs basees sur la physique reelle (acier sur acier COR ~0.60-0.65, bois sur acier ~0.50)
// Sources: NIST, Engineering Toolbox, Rolling Resistance Wikipedia
export const FRICTION_BASE = 0.15;
export const SPEED_THRESHOLD = 0.3;
export const RESTITUTION_BOULE = 0.62;     // Acier sur acier (reel: 0.60-0.65)
export const RESTITUTION_COCHONNET = 0.50; // Bois/synthétique sur acier
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

// Petanque - loft presets (research/25_cahier_des_charges_realisme.md)
// rollEfficiency = multiplicateur de distance reelle vs distance cible
// 1.0 = la boule roule exactement la distance prevue, <1 = tombe court, >1 = depasse
// - Roulette : 15% vol, 85% roulement, arc tres bas (~0.3-0.5m reel)
// - Demi-portee : 50/50, arc moyen (1.5-2m reel)
// - Plombee : 80% vol, 20% roulement (PAS une boule morte, roule ~20% de sa trajectoire)
// - Tir au fer : 95% vol, arc haut (2-3m), impact violent
export const LOFT_ROULETTE = {
    id: 'roulette', label: 'ROULETTE',
    landingFactor: 0.15, arcHeight: -8, flyDurationMult: 0.5, rollEfficiency: 1.1,
    precisionPenalty: 0, retroAllowed: false
};
export const LOFT_DEMI_PORTEE = {
    id: 'demi_portee', label: 'DEMI-PORTEE',
    landingFactor: 0.50, arcHeight: -40, flyDurationMult: 0.9, rollEfficiency: 1.0,
    precisionPenalty: 0, retroAllowed: true
};
export const LOFT_PLOMBEE = {
    id: 'plombee', label: 'PLOMBEE',
    landingFactor: 0.88, arcHeight: -80, flyDurationMult: 1.4, rollEfficiency: 0.85,
    precisionPenalty: 2.0, retroAllowed: true
};
// Tir au fer : la boule vole ~95% puis frappe a ~2.5x la vitesse du pointage
// Avec RESTITUTION_BOULE=0.62 (acier reel), le carreau se fait NATURELLEMENT :
// - Tireur perd ~81% de son energie au contact (retient 19%)
// - Cible recoit ~81% de l'energie → ejectee loin
// - Friction arrete le tireur en ~15cm = carreau naturel
// arcHeight = -65 (tir au fer a un arc 2-3m reel, plus haut que demi-portee)
export const LOFT_TIR = {
    id: 'tir', label: 'TIR',
    landingFactor: 0.95, arcHeight: -65, flyDurationMult: 0.4, rollEfficiency: 12.0,
    precisionPenalty: 1.0, retroAllowed: true, isTir: true
};
// Tir devant : atterrit 20-30cm avant la cible, rebondit dedans
// Moins precis que tir au fer mais plus tolerant sur la distance
export const LOFT_TIR_DEVANT = {
    id: 'tir_devant', label: 'TIR DEVANT',
    landingFactor: 0.85, arcHeight: -50, flyDurationMult: 0.45, rollEfficiency: 8.0,
    precisionPenalty: 0.7, retroAllowed: true, isTir: true
};

// Retro (backspin) physics — 2-phase model
// Phase 1: high friction (sliding), Phase 2: transition back to normal
export const RETRO_FRICTION_MULT = 2.5; // Simple retro: retroBoost = 1 + retro * 2.5 (max 3.5x)
export const RETRO_PHASE1_MULT = 5.0;
export const RETRO_PHASE1_FRAMES = 30;
export const RETRO_PHASE2_FRAMES = 18;
export const RETRO_TERRAIN_EFF = {
    terre: 1.0, herbe: 1.3, sable: 2.0, dalles: 0.6
};
export const RETRO_MIN_EFFET_STAT = 1;   // Minimum effet stat to use retro

// Palet detection
export const PALET_THRESHOLD = 50;
export const LOFT_PRESETS = [LOFT_ROULETTE, LOFT_DEMI_PORTEE, LOFT_PLOMBEE];

// Petanque - prediction trajectoire
export const PREDICTION_STEPS = 120;
export const PREDICTION_SAMPLE_RATE = 3;
export const PREDICTION_DOT_RADIUS = 2;

// Petanque - carreau (detecte naturellement grace au COR 0.62)
export const CARREAU_THRESHOLD = 28;
export const CARREAU_DISPLACED_MIN = 32;

// Petanque - shot result detection (tir labels)
export const CASQUETTE_MAX_SPEED = 0.5;   // Target barely moved
export const BLESSER_MAX_SPEED = 1.5;     // Target moved a little

// Petanque - lisibilite
export const PIXELS_TO_METERS = 15 / 420; // ~0.036 m/px (doubled terrain)

// Petanque - IA personnalites (fallback quand pas de characterData)
// Valeurs alignees avec characters.json
export const AI_POINTEUR = {
    angleDev: 2, powerDev: 0.03,
    personality: 'pointeur', shootProbability: 0.08,
    loftPref: 'roulette', targetsCocho: false
};
export const AI_TIREUR = {
    angleDev: 6, powerDev: 0.10,
    personality: 'tireur', shootProbability: 0.90,
    loftPref: 'tir', targetsCocho: false
};

// Petanque - timing & feedback
export const HITSTOP_BOULE_MS = 60;
export const HITSTOP_CARREAU_MS = 100;
export const MESSAGE_DURATION = 2000;
export const SCORE_MENE_DELAY = 1500;
export const GAME_OVER_REDIRECT_DELAY = 1000;
export const AIM_HINT_DURATION = 5000;
export const BARK_DURATION = 2000;
export const BARK_PROBABILITY = 0.4;
export const DUST_COUNT_ROULETTE = 2;
export const DUST_COUNT_DEMI = 6;
export const DUST_COUNT_PLOMBEE = 10;
export const DUST_COUNT_TIR = 8;
export const WALL_RESTITUTION = 0.35; // Bois/metal reel ~0.30-0.40
export const COLLISION_SPARK_COUNT = 5;
export const CARREAU_SPARK_COUNT = 8;
export const CARREAU_SPARK_RADIUS = 36;

// Petanque - throw animation
export const MIN_IMPACT_SPEED = 2.0;
export const COCHONNET_ROLL_MIN = 0.15;
export const COCHONNET_ROLL_MAX = 0.25;
export const COCHONNET_SAFE_MARGIN = 15;
export const COCHONNET_CLAMP_MARGIN = 35;
export const BALL_CLAMP_MARGIN = 16;

// Petanque - character sprite
export const CHAR_SPRITE_SCALE = 0.5;
export const THROW_ANIM_CROUCH_DURATION = 250;
export const THROW_ANIM_RELEASE_DURATION = 100;
export const THROW_ANIM_RECOVERY_DURATION = 300;

// Victoire
export const VICTORY_SCORE = 13;

// Slow-motion
export const SLOWMO_DISTANCE = 40;      // px from cochonnet
export const SLOWMO_SPEED_THRESHOLD = 2.0; // max speed to trigger
export const SLOWMO_FACTOR = 0.3;        // time scale during slowmo
export const SLOWMO_LERP_SPEED = 0.08;   // lerp speed for smooth transition

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
    OMBRE_DEEP: 0x1A1510,
    ACCENT: 0xC44B3F,
    OR: 0xFFD700,
    BLANC: 0xFFFFFF,
    GRIS: 0x9E9E8E,
    // UI theme colors (provençal-tinted stats)
    STAT_PUISSANCE: 0xC4854A,   // terracotta (was green)
    STAT_PRECISION: 0x87CEEB,   // ciel (was blue)
    STAT_EFFET: 0x9B7BB8,       // lavande (unchanged)
    STAT_ADAPTABILITE: 0x6B8E4E // olive (was red)
};

// CSS color strings (hex) for Phaser text styles
export const CSS = {
    OCRE: '#D4A574',
    TERRACOTTA: '#C4854A',
    LAVANDE: '#9B7BB8',
    OLIVE: '#6B8E4E',
    CIEL: '#87CEEB',
    CREME: '#F5E6D0',
    OMBRE: '#3A2E28',
    OMBRE_DEEP: '#1A1510',
    ACCENT: '#C44B3F',
    OR: '#FFD700',
    BLANC: '#FFFFFF',
    GRIS: '#9E9E8E'
};

export const SHADOW_TEXT = { offsetX: 2, offsetY: 2, color: '#1A1510', blur: 0, fill: true };
export const SHADOW_HEAVY = { offsetX: 3, offsetY: 3, color: '#1A1510', blur: 2, fill: true };

// UI typography hierarchy
export const UI = {
    TITLE_SIZE: '28px',
    MENU_SIZE: '20px',
    BODY_SIZE: '14px',
    HINT_SIZE: '12px',
    SMALL_SIZE: '10px',
    HINT_Y: GAME_HEIGHT - 16,
    HEADER_Y: 30,
    PILL_W: 280,
    PILL_H: 38,
    PILL_SPACING: 43,
    BACK_X: 60,
    BACK_Y: GAME_HEIGHT - 20,
    GALETS_X: GAME_WIDTH - 90,
    GALETS_Y: 28,
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

// Ball colors (used as fallback when sprites not loaded)
export const BALL_COLORS = {
    player: 0xCD7F32,      // bronze/or pour le joueur
    opponent: 0xDCDCDC,    // chrome pour l'adversaire
    cochonnet: 0xFFD700
};

// Ball sizes (pixels in game) - doubled
export const BALL_RADIUS = 10;
export const COCHONNET_RADIUS = 8;
export const BALL_MASS = 700;
export const COCHONNET_MASS = 16; // Cochonnet bois reel 10-18g (plus leger = plus dramatique)

// Circle de lancer - doubled
export const THROW_CIRCLE_RADIUS = 16;
export const THROW_CIRCLE_Y_OFFSET = 20;

// Character ID → spritesheet key mapping (centralized, used by all scenes)
export const CHAR_SPRITE_MAP = {
    'rookie': 'rookie_static',
    'ley': 'ley_animated',
    'magicien': 'le_magicien_animated',
    'la_choupe': 'la_choupe_animated',
    'marcel': 'marcel_animated',
    'reyes': 'reyes_animated'
};

// Characters that use a single static image (not a spritesheet)
export const CHAR_STATIC_SPRITES = ['rookie'];

export function getCharSpriteKey(char) {
    return CHAR_SPRITE_MAP[char?.id] || char?.sprite || 'ley_animated';
}

// Throw animation spritesheets (null = use squash/stretch fallback)
export const CHAR_THROW_MAP = {
    'ley': { key: 'ley_throw', frames: 5 },
    'magicien': { key: 'le_magicien_throw', frames: 4 },
    'la_choupe': { key: 'la_choupe_throw', frames: 4 },
    'marcel': { key: 'marcel_throw', frames: 4 },
    'reyes': { key: 'reyes_throw', frames: 5 }
};

export function getCharThrowKey(charId) {
    return CHAR_THROW_MAP[charId] || null;
}

// Galets (monnaie in-game)
export const GALET_WIN_ARCADE = 100;
export const GALET_WIN_QUICKPLAY = 40;
export const GALET_CARREAU_BONUS = 15;
export const GALET_ARCADE_COMPLETE = 150;
export const GALET_ARCADE_PERFECT = 300;
export const GALET_STARTING = 100;
export const GALET_LOSS = 15;
export const ROOKIE_XP_LOSS = 1;

// Rookie progression
export const ROOKIE_XP_ARCADE = 4;
export const ROOKIE_XP_QUICKPLAY = 2;
export const ROOKIE_MAX_POINTS = 40;
export const ROOKIE_MAX_STAT = 10;

// Crowd reactions
export const CROWD_GOOD_DISTANCE = 25;
export const CROWD_BAD_DISTANCE = 90;
export const CROWD_PROBABILITY = 0.6;
