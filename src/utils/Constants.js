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
export const RESTITUTION_COCHONNET = 0.60; // Bois/synthétique sur acier
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
// - Demi-portee : 50/50, arc moyen (1.5-2m reel) — default low loft
// - Plombee : 80% vol, 20% roulement (PAS une boule morte, roule ~20% de sa trajectoire)
// - Tir au fer : 95% vol, arc haut (2-3m), impact violent
export const LOFT_DEMI_PORTEE = {
    id: 'demi_portee', label: 'DEMI-PORTEE',
    landingFactor: 0.50, arcHeight: -40, flyDurationMult: 0.9, rollEfficiency: 1.0,
    precisionPenalty: 0, retroAllowed: true
};
export const LOFT_PLOMBEE = {
    id: 'plombee', label: 'PLOMBEE',
    landingFactor: 0.72, arcHeight: -80, flyDurationMult: 1.4, rollEfficiency: 1.10,
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
    landingFactor: 0.95, arcHeight: -65, flyDurationMult: 0.4, rollEfficiency: 0.3, flyOnly: true,
    precisionPenalty: 1.0, retroAllowed: true, isTir: true
};

// Spin lateral (effet gauche/droite) — actif apres atterrissage uniquement
// Force = LATERAL_SPIN_FORCE * (effetStat / 10) * spinIntensity * terrainMult
// Avec effet 6 sur terre: deviation ~5px (visible). Effet 10 sur sable: ~20px (strategique).
export const LATERAL_SPIN_FORCE = 0.15;
export const LATERAL_SPIN_FRAMES = 35;
export const LATERAL_SPIN_MIN_SPEED = 0.5;  // Arrete le spin quand la boule est quasi immobile
export const LATERAL_SPIN_MIN_EFFET = 3;    // Stat Effet minimum pour activer le spin
export const LATERAL_SPIN_TERRAIN_MULT = {
    terre:  1.0,
    herbe:  1.3,
    sable:  1.8,
    dalles: 0.3
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

// Throw range: fraction of TERRAIN_HEIGHT atteignable a pleine puissance
// Pointer: 92% du terrain (was 85% hardcoded), Tir: 95%
export const THROW_RANGE_FACTOR = 0.92;
export const THROW_RANGE_FACTOR_TIR = 0.95;

// Terrain roll compensation: controle combien la friction terrain est compensee
// dans le calcul de vitesse de roule. 1.0 = totalement compensee (meme distance partout),
// 0.0 = pas compensee (friction affecte pleinement la distance).
// 0.6 → terre=100%, herbe=80%, sable=76%, dalles=115%
export const TERRAIN_ROLL_COMPENSATION = 0.6;

// Palet detection
export const PALET_THRESHOLD = 50;
export const LOFT_PRESETS = [LOFT_DEMI_PORTEE, LOFT_PLOMBEE];
// Tous les presets valides (pointer + tir) — pour validation et tests
export const ALL_LOFT_PRESETS = [LOFT_DEMI_PORTEE, LOFT_PLOMBEE, LOFT_TIR];

// Petanque - prediction trajectoire
export const PREDICTION_STEPS = 120;
export const PREDICTION_SAMPLE_RATE = 3;
export const PREDICTION_DOT_RADIUS = 2;

// Petanque - carreau (detecte naturellement grace au COR 0.62)
export const CARREAU_THRESHOLD = 28;
export const CARREAU_DISPLACED_MIN = 32;

// Petanque - shot result detection (tir labels)
export const CASQUETTE_MAX_SPEED = 0.5;   // DEPRECATED — kept for compat, use CASQUETTE_MAX_DISPLACEMENT
export const BLESSER_MAX_SPEED = 1.5;     // DEPRECATED — kept for compat, use BLESSEE_MAX_DISPLACEMENT
// Displacement-based detection (corrected — vitesse au repos est toujours ~0)
export const CASQUETTE_MAX_DISPLACEMENT = 8;   // px — cible a peine bougee (<8px ≈ 0.29m)
export const BLESSEE_MAX_DISPLACEMENT = 32;    // px — cible bougee mais pas assez (< 1 rayon de terrain)
export const RECUL_MIN_BACKWARD_PX = 5;        // px — seuil minimal de recul arriere (COR 0.62 → ~5-6px naturel)

// Petanque - lisibilite
export const PIXELS_TO_METERS = 15 / 420; // ~0.036 m/px (doubled terrain)

// Petanque - IA personnalites (fallback quand pas de characterData)
// Valeurs alignees avec characters.json
export const AI_POINTEUR = {
    angleDev: 2, powerDev: 0.03,
    personality: 'pointeur', shootProbability: 0.08,
    loftPref: 'demi_portee', targetsCocho: false
};
export const AI_TIREUR = {
    angleDev: 6, powerDev: 0.10,
    personality: 'tireur', shootProbability: 0.90,
    loftPref: 'tir', targetsCocho: false
};

// AI personality precision modifiers (multiplier on angleDev/powerDev)
// Each archetype has bonuses in their specialty and penalties outside it
export const AI_PERSONALITY_MODIFIERS = {
    tireur: {
        tirer: { angle: 0.55, power: 0.55 },      // Strong bonus when shooting
        pointer: { angle: 1.3, power: 1.3 }        // Penalty when pointing
    },
    pointeur: {
        pointer: { angle: 0.6, power: 0.6 },       // Strong bonus when pointing
        tirer: { angle: 1.5, power: 1.5 }           // Penalty when shooting
    },
    complet: {
        pointer: { angle: 0.75, power: 0.75 },     // Good at everything
        tirer: { angle: 0.75, power: 0.75 }         // No penalty
    },
    equilibre: {
        pointer: { angle: 0.65, power: 0.65 },     // Decent at pointing
        tirer: { angle: 0.85, power: 0.85 }         // Decent at shooting
    }
};

// AI momentum sensitivity per archetype (how much momentum affects precision)
export const AI_MOMENTUM_SENSITIVITY = {
    pointeur: 0.05,
    tireur: 0.20,
    equilibre: 0.10,
    complet: 0.03
};

// Petanque - timing & feedback
export const HITSTOP_BOULE_MS = 80;      // 60 → 80 (plus perceptible)
export const HITSTOP_CARREAU_MS = 150;    // 100 → 150 (moment dramatique)
export const MESSAGE_DURATION = 2000;
export const SCORE_MENE_DELAY = 1500;
export const GAME_OVER_REDIRECT_DELAY = 1000;
export const AIM_HINT_DURATION = 5000;
export const BARK_DURATION = 2000;
export const BARK_PROBABILITY = 0.55; // 40% → 55%
export const PAUSE_KEY = 'P'; // Pause menu (ESC pris par AimingSystem pour annuler)
export const DUST_COUNT_DEMI = 6;
export const DUST_COUNT_PLOMBEE = 10;
export const DUST_COUNT_TIR = 8;
export const WALL_RESTITUTION = 0.35; // Bois/metal reel ~0.30-0.40
// Pointage: attenuation de l'impulse de collision (une boule roulee doucement
// ne doit pas ejecter les autres comme un tir). 0.4 = 40% de l'impulse normale.
export const POINT_COLLISION_DAMPING = 0.5;
export const COLLISION_SPARK_COUNT = 5;
export const CARREAU_SPARK_COUNT = 8;
export const CARREAU_SPARK_RADIUS = 36;

// Petanque - throw animation
export const MIN_IMPACT_SPEED = 2.0;
// Tir au fer: vitesse d'impact a l'atterrissage (simule l'energie cinetique de la chute)
// Avec COR 0.62 et masses egales: cible recoit ~81% → ejectee a ~7.3 px/frame
export const TIR_IMPACT_SPEED = 9.0;
// Rayon de detection de contact au tir (px) — plus large car la boule tombe d'en haut
export const TIR_LANDING_CONTACT_RADIUS = 10;
export const COCHONNET_ROLL_MIN = 0.15;
export const COCHONNET_ROLL_MAX = 0.25;
export const COCHONNET_SAFE_MARGIN = 15;
export const COCHONNET_CLAMP_MARGIN = 35;
export const BALL_CLAMP_MARGIN = 16;

// Petanque - character sprite scales (v2 sprites: 128x128 frames)
export const CHAR_SPRITE_SCALE = 0.5;
export const CHAR_SCALE_GRID = 0.7;           // CharSelectScene grid cells
export const CHAR_SCALE_GRID_LOCKED = 0.55;   // CharSelectScene locked cells
export const CHAR_SCALE_PREVIEW = 1.0;         // CharSelectScene right panel preview
export const CHAR_SCALE_QUICKPLAY = 1.0;       // QuickPlayScene info panel
export const CHAR_SCALE_ARCADE = 1.0;          // ArcadeScene opponent preview
export const CHAR_SCALE_VS = 1.2;              // VSIntroScene split screen
export const CHAR_SCALE_PETANQUE = 0.65;       // PetanqueScene gameplay (unchanged — fits terrain)
export const CHAR_SCALE_RESULT = 1.0;          // ResultScene winner display
export const CHAR_SCALE_RESULT_STATIC = 0.85;  // ResultScene winner (static sprite)
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

// UI layout constants (source unique — scenes importent ces valeurs)
export const STAT_BAR_WIDTH = 200;
export const SHOP_CARD_WIDTH = 138;
export const DIFFICULTY_COLORS = {
    easy: '#6B8E4E',
    medium: '#D4A574',
    hard: '#C44B3F',
    expert: '#9B7BB8'
};

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

// Font families
export const FONT_PIXEL = "'PressStart2P', monospace";
export const FONT_BODY = 'monospace';

// UI typography hierarchy
export const UI = {
    TITLE_SIZE: '24px',
    MENU_SIZE: '14px',
    BODY_SIZE: '12px',
    HINT_SIZE: '10px',
    SMALL_SIZE: '8px',
    HINT_Y: GAME_HEIGHT - 16,
    HEADER_Y: 30,
    PILL_W: 280,
    PILL_H: 38,
    PILL_SPACING: 43,
    BACK_X: 60,
    BACK_Y: GAME_HEIGHT - 20,
    GALETS_X: GAME_WIDTH - 90,
    GALETS_Y: 28,
    // Depth layers (centralized)
    DEPTH_BG: 0,
    DEPTH_DECOR: 5,
    DEPTH_PANEL: 10,
    DEPTH_UI: 50,
    DEPTH_OVERLAY: 90,
    DEPTH_MODAL: 100,
    // Transition defaults
    TRANSITION_DURATION: 400,
    TRANSITION_EASE: 'Cubic.easeInOut',
};

// Terrain colors (for placeholder rendering)
export const TERRAIN_COLORS = {
    terre: { bg: 0xC4854A, line: 0xFFFFFF },
    herbe: { bg: 0x6B8E4E, line: 0xFFFFFF },
    sable: { bg: 0xE8D5B7, line: 0xFFFFFF },
    dalles: { bg: 0x7A7A70, line: 0xC0C0C0 }
};

// Terrain friction multipliers
export const TERRAIN_FRICTION = {
    terre: 1.0,
    herbe: 1.8,
    sable: 2.0,
    dalles: 0.7
};

// Ball colors (used as fallback when sprites not loaded)
export const BALL_COLORS = {
    player: 0xCD7F32,      // bronze/or pour le joueur
    opponent: 0xDCDCDC,    // chrome pour l'adversaire
    cochonnet: 0xFFD700
};

// Ball sprite rendering
export const BALL_TEXTURE_RADIUS = 28;         // radius in source texture (64x64)
export const BALL_SHADOW_OFFSET_X = 3;
export const BALL_SHADOW_OFFSET_Y = 4;
export const BALL_SHADOW_RATIO_W = 1.8;
export const BALL_SHADOW_RATIO_H = 0.8;
export const BALL_ROLL_FRAME_STEP = 15;        // px distance per animation frame
export const BALL_SHADOW_STRETCH_MAX = 1.4;
export const BALL_SHADOW_STRETCH_SPEED = 0.003;
export const BALL_SQUASH_RADIUS_BOOST = 2;

// Ball sizes (pixels in game) - physics radius
export const BALL_RADIUS = 10;
export const COCHONNET_RADIUS = 8;
// Visual scale for sprites (smaller look on terrain)
export const BALL_DISPLAY_SCALE = 1.0;  // Aligner visuel sur hitbox physique
export const COCHONNET_DISPLAY_SCALE = 0.82; // Légèrement plus petit que boule (cohérent)
export const BALL_MASS = 700;
export const COCHONNET_MASS = 16; // Cochonnet bois reel 10-18g (plus leger = plus dramatique)
export const COCHONNET_MAX_COLLISION_SPEED = 6.0; // Cochonnet se deplace moderement — reste dans la zone de jeu

// Screen shake (carreau)
export const CARREAU_SHAKE_DURATION = 250;
export const CARREAU_SHAKE_INTENSITY = 0.012;

// Phaser 4 filter colors
export const FILTER_GLOW_PLAYER = 0xFFD700;    // Or doré
export const FILTER_GLOW_OPPONENT = 0x87CEEB;   // Bleu ciel
export const FILTER_GLOW_STRENGTH = 4;
export const FILTER_GLOW_QUALITY = 4;

// Circle de lancer - doubled
export const THROW_CIRCLE_RADIUS = 16;
export const THROW_CIRCLE_Y_OFFSET = 20;

// Character ID → spritesheet key mapping (centralized, used by all scenes)
export const CHAR_SPRITE_MAP = {
    'rookie': 'rookie_animated',
    // V2 characters (composed spritesheets from PixelLab 8-direction PNGs)
    'la_choupe': 'la_choupe_animated',
    'ley': 'ley_animated',
    'fazzino': 'fazzino_animated',
    'foyot': 'foyot_animated',
    'mamie_josette': 'mamie_josette_animated',
    'papi_rene': 'papi_rene_animated',
    'rizzi': 'rizzi_animated',
    'robineau': 'robineau_animated',
    'rocher': 'rocher_animated',
    'sofia': 'sofia_animated',
    'suchaud': 'suchaud_animated'
};

// Note: le_magicien, marcel, reyes ont des sprites mais ne sont pas dans le roster jouable.
// Sprites conservés pour future Phase D (narrative overworld).

// Characters that use a single static image (not a spritesheet)
export const CHAR_STATIC_SPRITES = [];

export function getCharSpriteKey(char) {
    return CHAR_SPRITE_MAP[char?.id] || char?.sprite || 'ley_animated';
}

// Throw animation spritesheets (null = use squash/stretch fallback)
// Each entry: { key: texture key, frames: number of frames in the spritesheet }
export const CHAR_THROW_MAP = {
    'rookie': { key: 'throw_rookie', frames: 4 },
    'la_choupe': { key: 'throw_la_choupe', frames: 4 },
    'ley': { key: 'throw_ley', frames: 4 },
    'foyot': { key: 'throw_foyot', frames: 4 },
    'suchaud': { key: 'throw_suchaud', frames: 4 },
    'mamie_josette': { key: 'throw_mamie_josette', frames: 4 },
    'sofia': { key: 'throw_sofia', frames: 4 },
    'robineau': { key: 'throw_robineau', frames: 4 },
    'rocher': { key: 'throw_rocher', frames: 4 },
    'rizzi': { key: 'throw_rizzi', frames: 4 },
    'fazzino': { key: 'throw_fazzino', frames: 4 },
    'papi_rene': { key: 'throw_papi_rene', frames: 4 }
};

export function getCharThrowKey(charId) {
    return CHAR_THROW_MAP[charId] || null;
}

// Galets (monnaie in-game)
export const GALET_WIN_ARCADE = 40;
export const GALET_WIN_QUICKPLAY = 15;
export const GALET_CARREAU_BONUS = 10;
export const GALET_ARCADE_COMPLETE = 60;
export const GALET_ARCADE_PERFECT = 120;
export const GALET_STARTING = 30;
export const GALET_LOSS = 5;
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

// Save system
export const SAVE_KEY = 'petanque_master_save';
export const SAVE_VERSION = 2;

// Tutorial in-game phases
export const TUTORIAL_PHASE_AIM = 1;
export const TUTORIAL_PHASE_LOFT = 2;
export const TUTORIAL_PHASE_SCORE = 3;
export const TUTORIAL_PHASE_TURN_RULE = 4; // "l'équipe la plus loin rejoue"
export const TUTORIAL_PHASE_GOAL = 0; // "objectif du jeu" — affiché avant Phase 1

// Daily challenge
export const GALET_DAILY_REWARD = 40;

// Puissance stat multiplier — source unique, utilisée partout
// Pui 1 = 0.8x, Pui 5 ≈ 1.02x, Pui 10 = 1.3x
export const PUISSANCE_BASE = 0.8;
export const PUISSANCE_RANGE = 0.5;
export function puissanceMultiplier(puiStat) {
    return PUISSANCE_BASE + (puiStat - 1) / 9 * PUISSANCE_RANGE;
}

// Plombee unlock threshold (derived from save, no extra field needed)
export const PLOMBEE_UNLOCK_WINS = 1; // Unlocked after first victory

// Gameplay constants (extracted from inline values)
export const FOCUS_CHARGES_PER_MATCH = 5;
export const HIT_PROB_SCALE = 500;
export const POINTEUR_DESPERATION_CHANCE = 0.3;
export const DIALOG_BOX_HEIGHT = 110;

// AimingSystem UI positioning
export const AIMING_UI_BOTTOM_OFFSET = 52;
export const FOCUS_UI_STACK_OFFSET = 50; // 28 + 22 = espace au-dessus du mode UI

// ScorePanel compact mode
export const SCORE_PANEL_COMPACT_W = 94;
export const SCORE_PANEL_COMPACT_H = 50;

// Mobile detection & touch UX
export const IS_MOBILE = typeof navigator !== 'undefined' && /Mobi|Android/i.test(navigator.userAgent);
export const TOUCH_BUTTON_SIZE = 56;  // Zone tap minimale WCAG (px)
export const TOUCH_PADDING = 8;       // Padding invisible autour des boutons interactifs (px)
export const DUST_MAX_SIMULTANEOUS_DESKTOP = 5;  // Limite groupes dust simultanés (desktop)
export const DUST_MAX_SIMULTANEOUS_MOBILE = 4;   // Limite groupes dust simultanés (mobile)

// Feedback — URL Google Apps Script (voir scripts/feedback-sheets-setup.js pour le setup)
export const FEEDBACK_URL = 'https://script.google.com/macros/s/AKfycbzpHkCOgogf-WYigDUk54Mchps2s7wBZ47oGk-D-g9frWopU-SQIyV6z9V70VfY1y18/exec';

// === PHASE 5 — Arcade Vivante ===

// Momentum indicator (visible on AI sprite)
export const MOMENTUM_INDICATOR_FIRE_COLOR = 0xFF6644;   // halo rouge-orange
export const MOMENTUM_INDICATOR_TILT_COLOR = 0x6688CC;   // halo bleu froid
export const MOMENTUM_INDICATOR_THRESHOLD = 0.3;          // |momentum| > 0.3 = visible
export const MOMENTUM_INDICATOR_ALPHA = 0.4;
export const MOMENTUM_INDICATOR_RADIUS = 24;              // px autour du sprite

// Pressure indicator (10-10+)
export const PRESSURE_INDICATOR_COLOR = 0xC44B3F;        // accent rouge
export const PRESSURE_WOBBLE_AMPLITUDE = 3;               // px de tremblement icone
export const PRESSURE_WOBBLE_SPEED = 200;                 // ms par cycle

// AI Tell (flash bref avant tir IA)
export const AI_TELL_DURATION = 400;                      // ms de l'indicateur
export const AI_TELL_POINTER_COLOR = 0x87CEEB;           // ciel = va pointer
export const AI_TELL_SHOOTER_COLOR = 0xC44B3F;           // accent = va tirer
export const AI_TELL_ALPHA = 0.6;

// Map progression (ArcadeScene)
export const MAP_NODE_RADIUS = 14;                        // px rayon noeud
export const MAP_NODE_SPACING_X = 140;                    // px entre noeuds
export const MAP_PATH_COLOR = 0xD4A574;                   // ocre
export const MAP_PATH_DASH = 6;                           // px longueur tiret
export const MAP_NODE_PULSE_DURATION = 800;               // ms
export const MAP_STAR_SIZE = 12;                          // px taille etoile (lisible a 832x480)
export const MAP_ZONE_TOP = 60;                           // px debut map
export const MAP_ZONE_BOTTOM = 240;                       // px fin map
export const MAP_PREVIEW_Y = 270;                         // px debut panel preview

// Defi de mene
export const CHALLENGE_BANNER_DURATION = 2500;            // ms affichage
export const CHALLENGE_REWARD_GALETS = 5;                 // galets par defi reussi
export const CHALLENGE_PROBABILITY = 0.6;                 // 60% chance qu'un defi apparaisse

// Zone doree
export const GOLDEN_ZONE_RADIUS = 18;                    // px
export const GOLDEN_ZONE_COLOR = 0xFFD700;
export const GOLDEN_ZONE_ALPHA = 0.25;
export const GOLDEN_ZONE_REWARD = 5;                      // galets bonus

// Shop express
export const SHOP_EXPRESS_ITEMS = 2;                      // nb items proposes
export const SHOP_EXPRESS_DISCOUNT = 0.2;                 // 20% reduction

// Crowd intensity per arcade round (1-5)
export const CROWD_INTENSITY_BY_ROUND = [0.03, 0.04, 0.05, 0.07, 0.10];

// Shop express budget gate
export const SHOP_EXPRESS_MIN_GALETS = 40;                // ne pas afficher si budget < ce seuil

// Defeat safety valve
export const DEFEAT_CONSOLATION_GALETS = 5;               // galets de consolation apres defaite
export const DEFEAT_RETRY_ENABLED = true;                 // autoriser le retry du meme match

// Commentator sequencing
export const COMMENTATOR_COOLDOWN = 3000;                 // ms minimum entre deux messages textuels
