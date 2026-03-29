import { GAME_WIDTH, GAME_HEIGHT, TERRAIN_WIDTH, TERRAIN_HEIGHT, COLORS } from '../utils/Constants.js';

// ============================================================
// TerrainRenderer - Rendu visuel complet des terrains de petanque
// Textures procedurale riches, bordures uniques, decors, lignes de mort
// ============================================================

const BORDER_WIDTH = 16; // Match PixelLab tile size (16x16)

// Config visuelle par terrain ID
const TERRAIN_VISUALS = {
    village: {
        bgColor: '#C4B090',     // Mur provencal chaud
        groundColor: '#9B8D6A',
        surfaceBase: '#C4854A',
        surfaceGravel: ['#B07840', '#D49560', '#A87040', '#C4954A', '#B88850', '#9A6A30'],
        borderType: 'wood',
        borderColor: '#8B6B3A',
        deadLineColor: 'rgba(255,255,255,0.6)',
        deadLineStyle: 'chalk',
    },
    plage: {
        bgColor: '#7EC8E8',     // Ciel bleu littoral
        groundColor: '#D4C0A0',
        surfaceBase: '#E8D5B7',
        surfaceGravel: ['#D4C0A0', '#F0E0C8', '#C4B090', '#E8D0B0', '#DDD4B8', '#F5E8D0'],
        borderType: 'rope',
        borderColor: '#A08050',
        deadLineColor: 'rgba(180,150,100,0.7)',
        deadLineStyle: 'driftwood',
    },
    parc: {
        bgColor: '#A0C888',     // Vert jardin doux
        groundColor: '#5A7A3A',
        surfaceBase: '#6B8E4E',
        surfaceGravel: ['#5E8A44', '#7BA65E', '#4A7A3A', '#6B9E4E', '#5A9040', '#82B068'],
        borderType: 'hedge',
        borderColor: '#3A6A2A',
        deadLineColor: 'rgba(255,255,255,0.7)',
        deadLineStyle: 'painted',
    },
    colline: {
        bgColor: '#D4B080',     // Ocre colline doree
        groundColor: '#8B7D5A',
        surfaceBase: '#C4954A',
        surfaceGravel: ['#B08540', '#D4A560', '#A88040', '#C4A54A', '#9A7530', '#B89050'],
        borderType: 'stone',
        borderColor: '#A09878',
        deadLineColor: 'rgba(200,180,140,0.6)',
        deadLineStyle: 'stones',
    },
    docks: {
        bgColor: '#2A3A4A',     // Nuit portuaire sombre
        groundColor: '#3A3A30',
        surfaceBase: '#7A7A70',
        surfaceGravel: ['#8E8E7E', '#B0A090', '#808070', '#A09888', '#989080', '#6A6A60'],
        borderType: 'metal',
        borderColor: '#5A5A50',
        deadLineColor: 'rgba(255,200,0,0.7)',
        deadLineStyle: 'hazard',
    }
};

// Frame pools per decor type (curated best frames from PixelLab 4x4 grids)
const DECOR_FRAMES = {
    olive:    { key: 'grid_olive',    pool: [0, 1, 4, 5, 8], fallback: 'decor_olivier' },
    fontaine: { key: 'grid_fontaine', pool: [0, 4, 8, 12],   fallback: 'decor_fontaine' },
    banc_v1:  { key: 'grid_banc_v1', pool: [0, 1, 4, 8],     fallback: 'decor_banc' },
    banc_v2:  { key: 'grid_banc_v2', pool: [0, 1, 4, 5],     fallback: 'decor_banc' },
    // New PixelLab sprites (4x4 grids, 64x64 frames)
    tree:     { key: 'grid_tree',     pool: [0, 1, 4, 5, 8, 9], fallback: null },
    herbe:    { key: 'grid_herbe',    pool: [0, 1, 2, 4, 5, 8], fallback: null },
    stones:   { key: 'grid_stones',   pool: [1, 2, 5, 6, 9],    fallback: null },
    table:    { key: 'grid_table',    pool: [0, 1, 4, 5],       fallback: null },
    banc_td:  { key: 'grid_banc_td',  pool: [0, 1, 4, 5, 8, 9], fallback: null },
    sac:         { key: 'grid_sac',         pool: [0, 2, 4, 5, 15],   fallback: null },
    items_retro: { key: 'grid_items_retro', pool: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15], fallback: null },
    // Anciens "inutilisés" promus
    willow:       { key: 'decor_willow',    pool: [0],                        fallback: null },
    scoreboard:   { key: 'grid_scoreboard', pool: [0,1,2,4,5,8,9,12,13],     fallback: null },
    dusty_ground: { key: 'grid_dusty',      pool: [0,1,2,4,5,8,9,12,13,14],  fallback: null },
    // Nouveaux décors provençaux (images simples générées)
    pastis_decor: { key: 'grid_pastis',   pool: [0], fallback: null },
    parasol:      { key: 'grid_parasol',  pool: [0], fallback: null },
    lavande:      { key: 'grid_lavande',  pool: [0], fallback: null },
    glaciere:     { key: 'grid_glaciere', pool: [0], fallback: null },
    // Grids v2
    fontaine_pierre: { key: 'grid_fontaine_pierre', pool: [0, 4, 8, 12], fallback: 'decor_fontaine' },
    banc_v3:         { key: 'grid_banc_v3',          pool: [0, 1, 4, 5], fallback: 'decor_banc' },
};

// Decor placement blueprints per terrain (x relative to terrainX, 'R+N' = right of terrain)
const TERRAIN_DECOR = {
    village: [
        // Layout conçu dans l'éditeur de terrain (v4 — 24/03/2026)
        { type: 'olive',       x: -67,    y: 85,  scale: 2.35, depth: 4.00, frame: 4 }, // devant bordure
        { type: 'olive',       x: -46,    y: 152, scale: 1.8,  depth: 4.00, frame: 4 }, // devant bordure
        { type: 'olive',       x: 'R+65', y: 170, scale: 2.0,  depth: 4.00, frame: 5 }, // devant bordure
        { type: 'olive',       x: 'R+50', y: 116, scale: 1.3,  depth: 1.50, frame: 5 }, // derriere terrain
        { type: 'olive',       x: -54,    y: 405, scale: 1.55, depth: 4.00, frame: 4 }, // devant bordure
        { type: 'banc_td',     x: 32,     y: -4,  scale: 1.1,  depth: 0.50, frame: 3 },
        { type: 'banc_td',     x: 137,    y: -3,  scale: 1.1,  depth: 0.50, frame: 3 },
        { type: 'herbe',       x: 75,     y: 6,   scale: 0.55, depth: 0.50, frame: 6 },
        { type: 'herbe',       x: 'R+26', y: 328, scale: 0.5,  depth: 1.00, frame: 7 },
        { type: 'fontaine',    x: -56,    y: 366, scale: 1.05, depth: 0.20, frame: 8 },
        { type: 'table',       x: 'R+36', y: 293, scale: 0.75, depth: 0.50, frame: 14 },
        { type: 'sac',         x: 'R+33', y: 317, scale: 0.45, depth: 0.50, frame: 15 },
        { type: 'items_retro', x: 'R+32', y: 265, scale: 0.5,  depth: 0.50, frame: 9 },
    ],
    parc: [
        // Layout conçu dans l'éditeur de terrain (v2 — 24/03/2026)
        { type: 'olive',   x: -56,    y: 72,  scale: 1.85, depth: 0.50, frame: 14 },
        { type: 'olive',   x: -57,    y: 134, scale: 1.85, depth: 0.50, frame: 14 },
        { type: 'olive',   x: -56,    y: 172, scale: 1.85, depth: 0.50, frame: 14 },
        { type: 'olive',   x: -58,    y: 234, scale: 2.0,  depth: 0.50, frame: 14 },
        { type: 'olive',   x: 'R+73', y: 221, scale: 1.85, depth: 0.50, frame: 10 },
        { type: 'olive',   x: 'R+72', y: 160, scale: 1.85, depth: 0.30, frame: 10 },
        { type: 'olive',   x: 'R+62', y: 102, scale: 2.0,  depth: 0.50, frame: 14 },
        { type: 'banc_td', x: 29,     y: 0,   scale: 0.9,  depth: 0.50, frame: 1 },
        { type: 'banc_td', x: 87,     y: 0,   scale: 0.9,  depth: 0.50, frame: 1 },
        { type: 'banc_td', x: 152,    y: 0,   scale: 0.9,  depth: 0.50, frame: 1 },
        { type: 'table',   x: -32,    y: 314, scale: 0.65, depth: 0.50, frame: 6 },
        { type: 'herbe',   x: 'R+27', y: 268, scale: 0.6,  depth: 0.35, frame: 4 },
        { type: 'herbe',   x: 'R+38', y: 278, scale: 0.6,  depth: 0.50, frame: 7 },
        { type: 'sac',     x: -32,    y: 296, scale: 0.45, depth: 0.50, frame: 5 },
    ],
    colline: [
        // Layout conçu dans l'éditeur de terrain (v2 — 24/03/2026)
        { type: 'olive',    x: -89,    y: 78,  scale: 2.6,  depth: 0.50, frame: 15 },
        { type: 'olive',    x: -86,    y: 150, scale: 2.45, depth: 0.50, frame: 15 },
        { type: 'olive',    x: -87,    y: 224, scale: 2.45, depth: 0.50, frame: 15 },
        { type: 'olive',    x: -89,    y: 315, scale: 2.55, depth: 0.50, frame: 15 },
        { type: 'olive',    x: 'R+78', y: 303, scale: 2.75, depth: 0.50, frame: 14 },
        { type: 'olive',    x: 'R+85', y: 117, scale: 2.9,  depth: 0.50, frame: 14 },
        { type: 'fontaine', x: 'R+67', y: 220, scale: 1.5,  depth: 0.00, frame: 1 },
        { type: 'banc_td',  x: 85,     y: -1,  scale: 0.95, depth: 0.50, frame: 2 },
    ],
    plage: [
        // Layout conçu dans l'éditeur de terrain (v2 — 24/03/2026)
        { type: 'willow',       x: -89,    y: 90,  scale: 2.85, depth: 0.50 },
        { type: 'willow',       x: 'R+77', y: 157, scale: 2.25, depth: 0.50 },
        { type: 'willow',       x: 'R+78', y: 236, scale: 2.25, depth: 0.50 },
        { type: 'willow',       x: 'R+79', y: 322, scale: 2.25, depth: 0.50 },
        { type: 'scoreboard',   x: -36,    y: 315, scale: 0.65, depth: 0.50, frame: 8 },
        { type: 'dusty_ground', x: -28,    y: 360, scale: 0.5,  depth: 0.50, frame: 14 },
        { type: 'dusty_ground', x: -58,    y: 362, scale: 0.5,  depth: 0.50, frame: 14 },
        { type: 'dusty_ground', x: -78,    y: 389, scale: 0.5,  depth: 0.50, frame: 14 },
        { type: 'dusty_ground', x: -111,   y: 388, scale: 0.5,  depth: 0.50, frame: 14 },
        { type: 'dusty_ground', x: -115,   y: 422, scale: 0.5,  depth: 0.50, frame: 14 },
        { type: 'dusty_ground', x: -155,   y: 421, scale: 0.5,  depth: 0.50, frame: 14 },
        { type: 'banc_td',      x: 'R+56', y: 95,  scale: 1.35, depth: 0.40, flipX: true, frame: 7 },
        { type: 'dusty_ground', x: -158,   y: 451, scale: 0.5,  depth: 0.50, frame: 14 },
        { type: 'dusty_ground', x: -193,   y: 451, scale: 0.5,  depth: 0.50, frame: 14 },
        { type: 'dusty_ground', x: -189,   y: 479, scale: 0.5,  depth: 0.50, frame: 14 },
        { type: 'dusty_ground', x: -225,   y: 481, scale: 0.5,  depth: 0.50, frame: 14 },
    ],
    docks: [
        // Layout conçu dans l'éditeur de terrain (v2 — 24/03/2026)
        { type: 'olive',   x: -59,    y: 36,  scale: 1.5,  depth: 0.25, frame: 8 },
        { type: 'olive',   x: -60,    y: 73,  scale: 1.5,  depth: 0.50, frame: 8 },
        { type: 'olive',   x: -61,    y: 124, scale: 1.5,  depth: 0.50, frame: 8 },
        { type: 'olive',   x: -61,    y: 179, scale: 1.5,  depth: 0.50, frame: 8 },
        { type: 'olive',   x: -63,    y: 234, scale: 1.5,  depth: 0.50, frame: 8 },
        { type: 'olive',   x: -62,    y: 279, scale: 1.5,  depth: 0.50, frame: 8 },
        { type: 'olive',   x: -63,    y: 345, scale: 1.5,  depth: 0.50, frame: 8 },
        { type: 'olive',   x: -64,    y: 392, scale: 1.5,  depth: 0.50, frame: 8 },
        { type: 'olive',   x: -62,    y: 439, scale: 1.5,  depth: 0.50, frame: 8 },
        { type: 'olive',   x: 'R+63', y: 122, scale: 2.3,  depth: 0.50, frame: 11 },
        { type: 'olive',   x: 'R+65', y: 175, scale: 2.3,  depth: 0.50, frame: 11 },
        { type: 'olive',   x: 'R+66', y: 234, scale: 2.3,  depth: 0.50, frame: 11 },
        { type: 'olive',   x: 'R+61', y: 333, scale: 1.5,  depth: 0.50, frame: 8 },
        { type: 'banc_v1', x: 'R+51', y: 288, scale: 0.8,  depth: 0.10, frame: 7 },
        { type: 'herbe',   x: 1,      y: -2,  scale: 0.75, depth: 0.50, frame: 3 },
        { type: 'herbe',   x: 36,     y: -3,  scale: 0.75, depth: 0.50, frame: 3 },
        { type: 'herbe',   x: 72,     y: -2,  scale: 0.75, depth: 0.50, frame: 3 },
        { type: 'herbe',   x: 107,    y: -4,  scale: 0.75, depth: 0.50, frame: 3 },
        { type: 'herbe',   x: 136,    y: -3,  scale: 0.75, depth: 0.50, frame: 3 },
        { type: 'herbe',   x: 168,    y: -3,  scale: 0.75, depth: 0.50, frame: 3 },
        { type: 'herbe',   x: 'R+34', y: 66,  scale: 0.75, depth: 0.35, frame: 3 },
        { type: 'herbe',   x: 'R+33', y: 24,  scale: 0.75, depth: 0.50, frame: 3 },
        { type: 'herbe',   x: 'R+34', y: 47,  scale: 0.75, depth: 0.20, frame: 3 },
        { type: 'herbe',   x: 'R+22', y: -1,  scale: 0.75, depth: 0.00, frame: 3 },
        { type: 'herbe',   x: 'R+46', y: 12,  scale: 0.75, depth: 0.20, frame: 3 },
        { type: 'herbe',   x: 'R+55', y: 30,  scale: 0.75, depth: 0.20, frame: 3 },
        { type: 'herbe',   x: 'R+57', y: 48,  scale: 0.75, depth: 0.20, frame: 3 },
        { type: 'herbe',   x: 'R+57', y: 74,  scale: 0.75, depth: 0.20, frame: 3 },
    ],
};

export default class TerrainRenderer {
    constructor(scene, terrainType, terrainData, terrainX, terrainY) {
        this.scene = scene;
        this.type = terrainType;         // surface type (terre, herbe, sable, dalles)
        this.data = terrainData;         // full terrain JSON data
        this.tx = terrainX;
        this.ty = terrainY;
        this.terrainId = terrainData?.id || this._surfaceToId(terrainType);
        this.vis = TERRAIN_VISUALS[this.terrainId] || TERRAIN_VISUALS.village;

        // Seeded RNG for consistent terrain per match
        this._seed = (this.terrainId.charCodeAt(0) * 137 + Date.now() % 10000) | 0;
        this._rngIdx = 0;
    }

    _surfaceToId(surface) {
        return { terre: 'village', herbe: 'parc', sable: 'plage', dalles: 'docks' }[surface] || 'village';
    }

    _rng() {
        const x = Math.sin(this._seed + this._rngIdx++ * 9301 + 49297) * 233280;
        return x - Math.floor(x);
    }

    render() {
        this._drawSky();
        this._drawBackgroundDecor();
        this._drawTerrainShadow();
        this._drawSurface();
        this._drawTerrainObjects();
        this._drawDeadLines();
        this._drawBorders();
        return this;
    }

    // ============================================================
    // SKY - Fond uni par terrain (pas de paysage)
    // ============================================================
    _drawSky() {
        const key = `sky_${this.terrainId}`;
        if (this.scene.textures.exists(key)) this.scene.textures.remove(key);
        const tex = this.scene.textures.createCanvas(key, GAME_WIDTH, GAME_HEIGHT);
        const ctx = tex.getContext();

        ctx.fillStyle = this.vis.bgColor;
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        tex.refresh();
        this.scene.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, key).setDepth(0);
    }

    // GROUND supprime — fond uni unique (bgColor couvre tout)

    // ============================================================
    // BACKGROUND DECOR - Sprites PixelLab uniquement (pas de paysage procedural)
    // ============================================================
    _drawBackgroundDecor() {
        const tx = this.tx;
        const tw = TERRAIN_WIDTH;

        // Sprites PixelLab curates autour du terrain
        this._placeDecorSprites(tx, tw);
    }

    _placeDecorSprites(tx, tw) {
        const s = this.scene;
        const placements = TERRAIN_DECOR[this.terrainId] || [];

        for (const p of placements) {
            const decor = DECOR_FRAMES[p.type];
            if (!decor) continue;

            // Resolve X position
            let px;
            if (typeof p.x === 'string' && p.x.startsWith('R+')) {
                px = tx + tw + parseInt(p.x.slice(2));
            } else {
                px = tx + p.x;
            }

            const hasGrid = s.textures.exists(decor.key);
            const hasFallback = decor.fallback && s.textures.exists(decor.fallback);

            const scale = p.scale || 1;
            const depth = p.depth != null ? p.depth : 0.6;

            // Shadow under large sprites (scale > 1.5) — warm brown, not pure black
            if (scale > 1.5) {
                s.add.ellipse(px, p.y + 64 * scale * 0.4, 64 * scale * 0.6, 8, 0x3A2E28, 0.15)
                    .setDepth(depth - 0.01);
            }

            let img = null;
            if (hasGrid) {
                const frameIdx = p.frame !== undefined ? p.frame : decor.pool[Math.floor(this._rng() * decor.pool.length)];
                img = s.add.image(px, p.y, decor.key, frameIdx);
                img.setDepth(depth);
                img.setScale(scale);
                if (p.flipX) img.setFlipX(true);
                if (p.alpha !== undefined) img.setAlpha(p.alpha);
                // Distance tint for far elements
                if (p.alpha && p.alpha < 0.5) img.setTint(0xCCCCCC);
            } else if (hasFallback) {
                img = s.add.image(px, p.y, decor.fallback);
                img.setDepth(depth);
                img.setScale(scale);
                if (p.flipX) img.setFlipX(true);
                if (p.alpha !== undefined) img.setAlpha(p.alpha);
            }

            // Subtle idle sway for organic decor (trees, plants)
            if (img && ['olive', 'tree', 'willow', 'lavande', 'herbe'].includes(p.type)) {
                const swayAmount = p.type === 'herbe' ? 1 : 2;
                const swayDuration = 3000 + Math.floor(this._rng() * 2000);
                s.tweens.add({
                    targets: img,
                    x: img.x + swayAmount,
                    angle: swayAmount * 0.3,
                    duration: swayDuration,
                    yoyo: true, repeat: -1,
                    ease: 'Sine.easeInOut',
                    delay: Math.floor(this._rng() * 2000)
                });
            }
        }
    }

    // ============================================================
    // TERRAIN OBJECTS - Sprites éditeur (pierres, touffes, rivets…)
    // Données : public/data/terrain_objects.json
    // Clé texture : 'to_' + filename sans extension
    // ============================================================
    _drawTerrainObjects() {
        const data = this.scene.cache.json.get('terrain_objects');
        if (!data) return;
        const objs = data[this.terrainId];
        if (!objs || !objs.length) return;

        for (const o of objs) {
            const key = 'to_' + o.src.split('/').pop().replace('.png', '');
            if (!this.scene.textures.exists(key)) continue;

            const img = this.scene.add.image(
                this.tx + o.x,
                this.ty + o.y,
                key
            );
            img.setScale(o.size / 32);
            img.setAngle(o.rotation);
            img.setAlpha(o.alpha);
            if (o.flipX) img.setFlipX(true);
            img.setDepth(2.5);
        }
    }

    // Decors proceduraux supprimes — fond uni + sprites PixelLab uniquement

    // ============================================================
    // TERRAIN SHADOW
    // ============================================================
    _drawTerrainShadow() {
        // Try Phaser 4 shadow filter on a rectangle (cleaner than manual shadow)
        const hasWebGL = !!(this.scene.renderer && this.scene.renderer.gl);
        if (hasWebGL) {
            try {
                const shadowRect = this.scene.add.rectangle(
                    this.tx + TERRAIN_WIDTH / 2,
                    this.ty + TERRAIN_HEIGHT / 2,
                    TERRAIN_WIDTH, TERRAIN_HEIGHT,
                    0x3A2E28, 0.4
                ).setDepth(1);
                if (typeof shadowRect.enableFilters === 'function') {
                    shadowRect.enableFilters();
                    // Shadow: x, y, decay, power, color, samples, intensity
                    shadowRect.filters.external.addShadow(3, 4, 0.12, 1, 0x1A1510, 4, 0.7);
                    return; // Phaser 4 shadow used, skip fallback
                }
            } catch (_) {
                // Filter not supported, fall through to manual shadow
            }
        }

        // Fallback: manual shadow rectangles
        const g = this.scene.add.graphics().setDepth(1);
        g.fillStyle(0x1A1510, 0.25);
        g.fillRect(this.tx + 5, this.ty + 5, TERRAIN_WIDTH, TERRAIN_HEIGHT);
        g.fillStyle(0x1A1510, 0.10);
        g.fillRect(this.tx + 3, this.ty + 3, TERRAIN_WIDTH + 2, TERRAIN_HEIGHT + 2);
    }

    // ============================================================
    // SURFACE TEXTURE - Rendu procedural riche
    // ============================================================
    _drawSurface() {
        // Texture mapping: terrainId -> loaded texture key
        const TEX_MAP = {
            village: 'terrain_tex_terre',
            plage: 'terrain_tex_sable',
            parc: 'terrain_tex_herbe',
            colline: 'terrain_tex_terre',
            docks: 'terrain_tex_dalles'
        };
        const texKey = TEX_MAP[this.terrainId];
        const hasTexture = texKey && this.scene.textures.exists(texKey);

        if (hasTexture) {
            // Canvas-based tiling avoids tileSprite seam artifacts in pixel art mode
            const tiledKey = `terrain_tiled_${this.terrainId}`;
            if (this.scene.textures.exists(tiledKey)) this.scene.textures.remove(tiledKey);
            const tiledTex = this.scene.textures.createCanvas(tiledKey, TERRAIN_WIDTH, TERRAIN_HEIGHT);
            const tiledCtx = tiledTex.getContext();

            // Disable smoothing to prevent visible seams between tiled tiles
            tiledCtx.imageSmoothingEnabled = false;

            const srcImage = this.scene.textures.get(texKey).getSourceImage();
            const tw = srcImage.width;
            const th = srcImage.height;

            // Two-pass tiling: base layer + half-offset layer to hide seams
            // Pass 1: normal grid
            for (let tly = 0; tly < TERRAIN_HEIGHT; tly += th) {
                for (let tlx = 0; tlx < TERRAIN_WIDTH; tlx += tw) {
                    tiledCtx.drawImage(srcImage, tlx, tly);
                }
            }
            // Pass 2: half-offset tiles at reduced opacity — breaks visible seam lines
            tiledCtx.globalAlpha = 0.35;
            const halfW = Math.floor(tw / 2);
            const halfH = Math.floor(th / 2);
            for (let tly = -halfH; tly < TERRAIN_HEIGHT; tly += th) {
                for (let tlx = -halfW; tlx < TERRAIN_WIDTH; tlx += tw) {
                    tiledCtx.drawImage(srcImage, tlx, tly);
                }
            }
            tiledCtx.globalAlpha = 1;

            // Tint colline warmer to differentiate from village (same terre texture)
            if (this.terrainId === 'colline') {
                tiledCtx.globalCompositeOperation = 'multiply';
                tiledCtx.fillStyle = '#DDCC88';
                tiledCtx.fillRect(0, 0, TERRAIN_WIDTH, TERRAIN_HEIGHT);
                tiledCtx.globalCompositeOperation = 'source-over';
            }

            tiledTex.refresh();
            this.scene.add.image(this.tx + TERRAIN_WIDTH / 2, this.ty + TERRAIN_HEIGHT / 2, tiledKey).setDepth(2);

            // Overlay docks with blue-gray to neutralize warm reddish tones from dalles texture
            if (this.terrainId === 'docks') {
                this.scene.add.rectangle(
                    this.tx + TERRAIN_WIDTH / 2,
                    this.ty + TERRAIN_HEIGHT / 2,
                    TERRAIN_WIDTH, TERRAIN_HEIGHT,
                    0x506482, 0.45
                ).setDepth(2.05);
            }

            // Transparent canvas overlay for zones, slope, vignette
            const overlayKey = `terrain_overlay_${this.terrainId}`;
            if (this.scene.textures.exists(overlayKey)) this.scene.textures.remove(overlayKey);
            const tex = this.scene.textures.createCanvas(overlayKey, TERRAIN_WIDTH, TERRAIN_HEIGHT);
            const ctx = tex.getContext();
            this._drawFrictionZones(ctx);
            this._drawSlopeIndicator(ctx);
            this._drawVignette(ctx);
            tex.refresh();
            this.scene.add.image(this.tx + TERRAIN_WIDTH / 2, this.ty + TERRAIN_HEIGHT / 2, overlayKey).setDepth(2.1);
        } else {
            // Fallback: fully procedural surface
            const key = `terrain_surface_${this.terrainId}`;
            if (this.scene.textures.exists(key)) this.scene.textures.remove(key);
            const tex = this.scene.textures.createCanvas(key, TERRAIN_WIDTH, TERRAIN_HEIGHT);
            const ctx = tex.getContext();

            switch (this.terrainId) {
                case 'village': this._surfaceTerre(ctx); break;
                case 'plage':   this._surfaceSable(ctx); break;
                case 'parc':    this._surfaceHerbe(ctx); break;
                case 'colline': this._surfaceColline(ctx); break;
                case 'docks':   this._surfaceDalles(ctx); break;
                default:        this._surfaceTerre(ctx); break;
            }

            this._drawFrictionZones(ctx);
            this._drawSlopeIndicator(ctx);
            this._drawVignette(ctx);

            tex.refresh();
            this.scene.add.image(this.tx + TERRAIN_WIDTH / 2, this.ty + TERRAIN_HEIGHT / 2, key).setDepth(2);
        }
    }

    // --- TERRE (Village) ---
    _surfaceTerre(ctx) {
        // Base gradient (lighter at top = distance perspective)
        const grad = ctx.createLinearGradient(0, 0, 0, TERRAIN_HEIGHT);
        grad.addColorStop(0, '#D4A060');
        grad.addColorStop(0.4, '#C4854A');
        grad.addColorStop(1, '#A87040');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, TERRAIN_WIDTH, TERRAIN_HEIGHT);

        // Perlin-like noise for earth texture
        this._addNoise(ctx, TERRAIN_WIDTH, TERRAIN_HEIGHT, this.vis.surfaceGravel, 800, 1, 2.5);

        // Fine gravel particles
        this._addNoise(ctx, TERRAIN_WIDTH, TERRAIN_HEIGHT, this.vis.surfaceGravel, 400, 0.8, 1.5);

        // Larger pebbles
        this._drawPebbles(ctx, 20, '#B07840', '#D49560');

        // Drag marks from previous games
        this._drawDragMarks(ctx, 6);

        // Old circle marks (previous throw circles)
        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(TERRAIN_WIDTH / 2, TERRAIN_HEIGHT - 40, 16, 0, Math.PI * 2);
        ctx.stroke();
    }

    // --- SABLE (Plage) ---
    _surfaceSable(ctx) {
        // Sand base - warm golden
        const grad = ctx.createLinearGradient(0, 0, 0, TERRAIN_HEIGHT);
        grad.addColorStop(0, '#F0E0C8');
        grad.addColorStop(0.5, '#E8D5B7');
        grad.addColorStop(1, '#D4C0A0');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, TERRAIN_WIDTH, TERRAIN_HEIGHT);

        // Sand grain texture (very fine, lots of particles)
        this._addNoise(ctx, TERRAIN_WIDTH, TERRAIN_HEIGHT,
            ['#E8D0B0', '#F5E8D0', '#D4C0A0', '#DDD4B8', '#C4B090'], 1200, 0.5, 1);

        // Ripple patterns (wind marks)
        ctx.strokeStyle = 'rgba(160,130,90,0.12)';
        ctx.lineWidth = 1;
        for (let ry = 30; ry < TERRAIN_HEIGHT; ry += 25 + this._rng() * 15) {
            ctx.beginPath();
            for (let rx = 0; rx < TERRAIN_WIDTH; rx += 3) {
                const wave = Math.sin(rx * 0.08 + ry * 0.02) * 3;
                if (rx === 0) ctx.moveTo(rx, ry + wave);
                else ctx.lineTo(rx, ry + wave);
            }
            ctx.stroke();
        }

        // Shells
        const shellColors = ['#E8D8C8', '#D4C4B0', '#F0E8E0', '#C4A888'];
        for (let i = 0; i < 8; i++) {
            const sx = 15 + this._rng() * (TERRAIN_WIDTH - 30);
            const sy = 15 + this._rng() * (TERRAIN_HEIGHT - 30);
            ctx.fillStyle = shellColors[i % shellColors.length];
            ctx.globalAlpha = 0.4 + this._rng() * 0.3;
            ctx.beginPath();
            ctx.ellipse(sx, sy, 2 + this._rng() * 2, 1.5 + this._rng(), this._rng() * Math.PI, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Footprint hints (very subtle)
        ctx.fillStyle = 'rgba(180,150,110,0.08)';
        for (let i = 0; i < 3; i++) {
            const fx = 40 + this._rng() * (TERRAIN_WIDTH - 80);
            const fy = 60 + this._rng() * (TERRAIN_HEIGHT - 120);
            ctx.beginPath();
            ctx.ellipse(fx, fy, 4, 6, this._rng() * 0.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // --- HERBE (Parc) ---
    _surfaceHerbe(ctx) {
        // Grass base - lush green
        const grad = ctx.createLinearGradient(0, 0, 0, TERRAIN_HEIGHT);
        grad.addColorStop(0, '#7BA65E');
        grad.addColorStop(0.5, '#6B8E4E');
        grad.addColorStop(1, '#5A7A3A');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, TERRAIN_WIDTH, TERRAIN_HEIGHT);

        // Grass texture (tiny blades)
        for (let i = 0; i < 600; i++) {
            const gx = this._rng() * TERRAIN_WIDTH;
            const gy = this._rng() * TERRAIN_HEIGHT;
            const shade = this._rng() > 0.5 ? '#5E8A44' : '#82B068';
            ctx.strokeStyle = shade;
            ctx.globalAlpha = 0.3 + this._rng() * 0.3;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(gx, gy);
            ctx.lineTo(gx + (this._rng() - 0.5) * 3, gy - 2 - this._rng() * 3);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;

        // Darker patches (worn areas)
        for (let i = 0; i < 4; i++) {
            const px = 30 + this._rng() * (TERRAIN_WIDTH - 60);
            const py = 30 + this._rng() * (TERRAIN_HEIGHT - 60);
            ctx.fillStyle = 'rgba(70,100,50,0.15)';
            ctx.beginPath();
            ctx.ellipse(px, py, 12 + this._rng() * 10, 8 + this._rng() * 6, this._rng() * Math.PI, 0, Math.PI * 2);
            ctx.fill();
        }

        // Clover patches
        ctx.fillStyle = 'rgba(90,140,60,0.2)';
        for (let i = 0; i < 6; i++) {
            const cx = 20 + this._rng() * (TERRAIN_WIDTH - 40);
            const cy = 20 + this._rng() * (TERRAIN_HEIGHT - 40);
            for (let l = 0; l < 3; l++) {
                const a = l * Math.PI * 2 / 3;
                ctx.beginPath();
                ctx.arc(cx + Math.cos(a) * 2, cy + Math.sin(a) * 2, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Mowing lines (subtle stripes)
        ctx.fillStyle = 'rgba(100,150,60,0.06)';
        for (let mx = 0; mx < TERRAIN_WIDTH; mx += 12) {
            if (Math.floor(mx / 12) % 2 === 0) {
                ctx.fillRect(mx, 0, 6, TERRAIN_HEIGHT);
            }
        }
    }

    // --- COLLINE (Terre seche + pente) ---
    _surfaceColline(ctx) {
        // Dry earth - warmer, more parched than village
        const grad = ctx.createLinearGradient(0, 0, 0, TERRAIN_HEIGHT);
        grad.addColorStop(0, '#D4A560');
        grad.addColorStop(0.3, '#C49550');
        grad.addColorStop(1, '#A07A38');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, TERRAIN_WIDTH, TERRAIN_HEIGHT);

        // Dry earth noise
        this._addNoise(ctx, TERRAIN_WIDTH, TERRAIN_HEIGHT,
            ['#B08540', '#C4A558', '#9A7530', '#B89050', '#A88040'], 600, 0.7, 2);

        // Cracks in dry earth
        ctx.strokeStyle = 'rgba(100,70,30,0.15)';
        ctx.lineWidth = 0.8;
        for (let i = 0; i < 10; i++) {
            const cx = 20 + this._rng() * (TERRAIN_WIDTH - 40);
            const cy = 20 + this._rng() * (TERRAIN_HEIGHT - 40);
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            let px = cx, py = cy;
            for (let s = 0; s < 3 + this._rng() * 4; s++) {
                px += (this._rng() - 0.5) * 15;
                py += this._rng() * 10;
                ctx.lineTo(px, py);
            }
            ctx.stroke();
        }

        // Olive leaves scattered
        ctx.fillStyle = 'rgba(120,150,80,0.2)';
        for (let i = 0; i < 12; i++) {
            const lx = this._rng() * TERRAIN_WIDTH;
            const ly = this._rng() * TERRAIN_HEIGHT;
            ctx.save();
            ctx.translate(lx, ly);
            ctx.rotate(this._rng() * Math.PI * 2);
            ctx.beginPath();
            ctx.ellipse(0, 0, 3.5, 1, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Subtle ambient variation (slope zones handle directional shading)
        ctx.fillStyle = 'rgba(0,0,0,0.03)';
        ctx.fillRect(0, 0, TERRAIN_WIDTH, TERRAIN_HEIGHT);

        this._drawPebbles(ctx, 12, '#A08040', '#C4A858');
    }

    // --- DALLES (Docks) ---
    _surfaceDalles(ctx) {
        // Concrete base
        ctx.fillStyle = '#7A7A70';
        ctx.fillRect(0, 0, TERRAIN_WIDTH, TERRAIN_HEIGHT);

        // Concrete noise texture
        this._addNoise(ctx, TERRAIN_WIDTH, TERRAIN_HEIGHT,
            ['#8A8A80', '#707068', '#909088', '#686860', '#7A7A72'], 500, 0.4, 1.5);

        // Slab grid (expansion joints)
        ctx.strokeStyle = 'rgba(50,50,45,0.3)';
        ctx.lineWidth = 1.5;
        const slabW = 45;
        const slabH = 60;
        for (let sx = slabW; sx < TERRAIN_WIDTH; sx += slabW) {
            ctx.beginPath();
            ctx.moveTo(sx, 0);
            ctx.lineTo(sx, TERRAIN_HEIGHT);
            ctx.stroke();
        }
        for (let sy = slabH; sy < TERRAIN_HEIGHT; sy += slabH) {
            ctx.beginPath();
            ctx.moveTo(0, sy);
            ctx.lineTo(TERRAIN_WIDTH, sy);
            ctx.stroke();
        }

        // Joint fill (darker line next to slab edge)
        ctx.strokeStyle = 'rgba(80,80,70,0.15)';
        ctx.lineWidth = 0.5;
        for (let sx = slabW; sx < TERRAIN_WIDTH; sx += slabW) {
            ctx.beginPath(); ctx.moveTo(sx + 1, 0); ctx.lineTo(sx + 1, TERRAIN_HEIGHT); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(sx - 1, 0); ctx.lineTo(sx - 1, TERRAIN_HEIGHT); ctx.stroke();
        }

        // Cracks in concrete
        ctx.strokeStyle = 'rgba(40,40,35,0.2)';
        ctx.lineWidth = 0.7;
        for (let i = 0; i < 5; i++) {
            const cx = 20 + this._rng() * (TERRAIN_WIDTH - 40);
            const cy = 20 + this._rng() * (TERRAIN_HEIGHT - 40);
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            let px = cx, py = cy;
            for (let s = 0; s < 4; s++) {
                px += (this._rng() - 0.5) * 20;
                py += (this._rng() - 0.5) * 15;
                ctx.lineTo(px, py);
            }
            ctx.stroke();
        }

        // Oil stains
        for (let i = 0; i < 3; i++) {
            const ox = 20 + this._rng() * (TERRAIN_WIDTH - 40);
            const oy = 30 + this._rng() * (TERRAIN_HEIGHT - 60);
            ctx.fillStyle = 'rgba(40,35,30,0.08)';
            ctx.beginPath();
            ctx.ellipse(ox, oy, 8 + this._rng() * 10, 5 + this._rng() * 6, this._rng() * Math.PI, 0, Math.PI * 2);
            ctx.fill();
        }

        // Puddle reflections (small, subtle)
        ctx.fillStyle = 'rgba(100,110,130,0.08)';
        for (let i = 0; i < 2; i++) {
            const px = 15 + this._rng() * (TERRAIN_WIDTH - 30);
            const py = 15 + this._rng() * (TERRAIN_HEIGHT - 30);
            ctx.beginPath();
            ctx.ellipse(px, py, 6 + this._rng() * 8, 3 + this._rng() * 4, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // ============================================================
    // SURFACE HELPERS
    // ============================================================
    _addNoise(ctx, w, h, colors, count, maxAlpha, maxSize) {
        for (let i = 0; i < count; i++) {
            ctx.fillStyle = colors[Math.floor(this._rng() * colors.length)];
            ctx.globalAlpha = (0.2 + this._rng() * (maxAlpha - 0.2));
            const size = 0.5 + this._rng() * maxSize;
            ctx.fillRect(this._rng() * w, this._rng() * h, size, size);
        }
        ctx.globalAlpha = 1;
    }

    _drawPebbles(ctx, count, darkColor, lightColor) {
        for (let i = 0; i < count; i++) {
            const px = 15 + this._rng() * (TERRAIN_WIDTH - 30);
            const py = 15 + this._rng() * (TERRAIN_HEIGHT - 30);
            const pr = 1.5 + this._rng() * 3;
            ctx.fillStyle = this._rng() > 0.5 ? darkColor : lightColor;
            ctx.globalAlpha = 0.4 + this._rng() * 0.3;
            ctx.beginPath();
            ctx.ellipse(px, py, pr, pr * 0.7, this._rng() * Math.PI, 0, Math.PI * 2);
            ctx.fill();
            // Highlight
            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            ctx.beginPath();
            ctx.arc(px - 0.5, py - 0.5, pr * 0.35, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    _drawDragMarks(ctx, count) {
        ctx.strokeStyle = 'rgba(0,0,0,0.05)';
        ctx.lineWidth = 1;
        for (let i = 0; i < count; i++) {
            const sx = 25 + this._rng() * (TERRAIN_WIDTH - 50);
            const sy = 30 + this._rng() * (TERRAIN_HEIGHT - 60);
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(sx + (this._rng() - 0.5) * 25, sy + 8 + this._rng() * 18);
            ctx.stroke();
        }
    }

    _drawFrictionZones(ctx) {
        if (!this.data?.zones?.length) return;
        for (const zone of this.data.zones) {
            const zx = zone.rect.x * TERRAIN_WIDTH;
            const zy = zone.rect.y * TERRAIN_HEIGHT;
            const zw = zone.rect.w * TERRAIN_WIDTH;
            const zh = zone.rect.h * TERRAIN_HEIGHT;

            // Zone base color
            ctx.fillStyle = zone.color || '#B8A888';
            ctx.globalAlpha = 0.55;
            ctx.fillRect(zx, zy, zw, zh);

            // Zone gravel
            ctx.globalAlpha = 0.4;
            for (let i = 0; i < 80; i++) {
                ctx.fillStyle = this._rng() > 0.5 ? '#C4B498' : '#A89878';
                const s = 0.5 + this._rng() * 2;
                ctx.fillRect(zx + this._rng() * zw, zy + this._rng() * zh, s, s);
            }

            // Zone edge markers (subtle dashed line)
            ctx.globalAlpha = 0.2;
            ctx.strokeStyle = '#8A7A5A';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 4]);
            ctx.strokeRect(zx, zy, zw, zh);
            ctx.setLineDash([]);
            ctx.globalAlpha = 1;
        }
    }

    _drawSlopeIndicator(ctx) {
        // Slope zones: subtle gradient + small arrows per zone
        if (this.data?.slope_zones?.length) {
            for (const sz of this.data.slope_zones) {
                const zx = sz.rect.x * TERRAIN_WIDTH;
                const zy = sz.rect.y * TERRAIN_HEIGHT;
                const zw = sz.rect.w * TERRAIN_WIDTH;
                const zh = sz.rect.h * TERRAIN_HEIGHT;

                // Subtle tinted gradient showing the slope direction
                ctx.save();
                const intensity = Math.min(sz.gravity_component * 1.2, 0.12);
                let grad;
                if (sz.direction === 'down') {
                    grad = ctx.createLinearGradient(zx, zy, zx, zy + zh);
                    grad.addColorStop(0, `rgba(255,255,220,${intensity})`);
                    grad.addColorStop(1, `rgba(60,40,20,${intensity})`);
                } else if (sz.direction === 'up') {
                    grad = ctx.createLinearGradient(zx, zy + zh, zx, zy);
                    grad.addColorStop(0, `rgba(255,255,220,${intensity})`);
                    grad.addColorStop(1, `rgba(60,40,20,${intensity})`);
                } else if (sz.direction === 'right') {
                    grad = ctx.createLinearGradient(zx, zy, zx + zw, zy);
                    grad.addColorStop(0, `rgba(255,255,220,${intensity})`);
                    grad.addColorStop(1, `rgba(60,40,20,${intensity})`);
                } else {
                    grad = ctx.createLinearGradient(zx + zw, zy, zx, zy);
                    grad.addColorStop(0, `rgba(255,255,220,${intensity})`);
                    grad.addColorStop(1, `rgba(60,40,20,${intensity})`);
                }
                ctx.fillStyle = grad;
                ctx.fillRect(zx, zy, zw, zh);

                // Small chevron arrows showing slope direction
                ctx.globalAlpha = 0.10;
                ctx.fillStyle = '#3A2E28';
                const arrowDx = sz.direction === 'right' ? 1 : sz.direction === 'left' ? -1 : 0;
                const arrowDy = sz.direction === 'down' ? 1 : sz.direction === 'up' ? -1 : 0;
                const cols = Math.max(2, Math.floor(zw / 40));
                const rows = Math.max(2, Math.floor(zh / 50));
                for (let c = 0; c < cols; c++) {
                    for (let r = 0; r < rows; r++) {
                        const ax = zx + (c + 0.5) * zw / cols;
                        const ay = zy + (r + 0.5) * zh / rows;
                        ctx.beginPath();
                        ctx.moveTo(ax + arrowDx * 5, ay + arrowDy * 5);
                        ctx.lineTo(ax - arrowDx * 3 - arrowDy * 4, ay - arrowDy * 3 + arrowDx * 4);
                        ctx.lineTo(ax - arrowDx * 3 + arrowDy * 4, ay - arrowDy * 3 - arrowDx * 4);
                        ctx.closePath();
                        ctx.fill();
                    }
                }
                ctx.restore();
            }
            return;
        }

        // Legacy: global slope (fallback)
        if (!this.data?.slope) return;
        ctx.save();
        ctx.globalAlpha = 0.12;
        ctx.fillStyle = '#3A2E28';
        for (let i = 0; i < 5; i++) {
            const ax = 25 + i * (TERRAIN_WIDTH - 50) / 4;
            for (let j = 0; j < 4; j++) {
                const ay = 60 + j * 100;
                ctx.beginPath();
                ctx.moveTo(ax, ay);
                ctx.lineTo(ax - 5, ay - 10);
                ctx.lineTo(ax + 5, ay - 10);
                ctx.closePath();
                ctx.fill();
            }
        }
        ctx.restore();
    }

    _drawVignette(ctx) {
        const edgeGrad = ctx.createRadialGradient(
            TERRAIN_WIDTH / 2, TERRAIN_HEIGHT / 2, TERRAIN_HEIGHT * 0.35,
            TERRAIN_WIDTH / 2, TERRAIN_HEIGHT / 2, TERRAIN_HEIGHT * 0.6
        );
        edgeGrad.addColorStop(0, 'rgba(58,46,40,0)');
        edgeGrad.addColorStop(1, 'rgba(58,46,40,0.08)');
        ctx.fillStyle = edgeGrad;
        ctx.fillRect(0, 0, TERRAIN_WIDTH, TERRAIN_HEIGHT);
    }

    // ============================================================
    // DEAD LINES - Lignes de mort aux bords du terrain
    // ============================================================
    _drawDeadLines() {
        const g = this.scene.add.graphics().setDepth(3.2);
        const tx = this.tx;
        const ty = this.ty;
        const tw = TERRAIN_WIDTH;
        const th = TERRAIN_HEIGHT;
        const inset = 3;

        switch (this.vis.deadLineStyle) {
            case 'chalk':     this._deadLineFicelle(g, tx, ty, tw, th, inset, 0xFFFFFF, 0.45); break;
            case 'driftwood': this._deadLineFicelle(g, tx, ty, tw, th, inset, 0xE8D8C0, 0.5); break;
            case 'painted':   this._deadLinePainted(g, tx, ty, tw, th, inset); break;
            case 'stones':    this._deadLineFicelle(g, tx, ty, tw, th, inset, 0xD4C8B0, 0.4); break;
            case 'hazard':    this._deadLineHazard(g, tx, ty, tw, th, inset); break;
        }
    }

    // Ficelle de petanque — fine string stretched between stakes, like real competition
    _deadLineFicelle(g, tx, ty, tw, th, inset, color, alpha) {
        // Main string: 1px line with very slight wobble every ~20px
        const drawString = (x1, y1, x2, y2) => {
            const isH = Math.abs(y1 - y2) < 2;
            const len = isH ? Math.abs(x2 - x1) : Math.abs(y2 - y1);

            for (let i = 0; i < len; i++) {
                // Slight sag: 1px wobble every ~24px
                const wobble = (Math.sin(i * 0.26) > 0.9) ? 1 : 0;
                const px = isH ? x1 + i : x1 + wobble;
                const py = isH ? y1 + wobble : y1 + i;
                g.fillStyle(color, alpha);
                g.fillRect(px, py, 1, 1);
            }
        };

        // Small stakes at corners and midpoints
        const drawStake = (x, y) => {
            g.fillStyle(0x8B6B4A, 0.6);
            g.fillRect(x - 1, y - 1, 2, 2);
        };

        // Top ficelle
        drawString(tx + inset, ty + inset, tx + tw - inset, ty + inset);
        // Bottom ficelle
        drawString(tx + inset, ty + th - inset, tx + tw - inset, ty + th - inset);
        // Left ficelle
        drawString(tx + inset, ty + inset, tx + inset, ty + th - inset);
        // Right ficelle
        drawString(tx + tw - inset, ty + inset, tx + tw - inset, ty + th - inset);

        // Stakes at corners
        const corners = [
            [tx + inset, ty + inset], [tx + tw - inset, ty + inset],
            [tx + inset, ty + th - inset], [tx + tw - inset, ty + th - inset]
        ];
        for (const [sx, sy] of corners) drawStake(sx, sy);
    }

    _deadLinePainted(g, tx, ty, tw, th, inset) {
        // Clean white painted lines (like sports field)
        g.lineStyle(2.5, 0xFFFFFF, 0.65);
        g.strokeRect(tx + inset, ty + inset, tw - inset * 2, th - inset * 2);
        // Corner marks
        const cm = 8;
        g.lineStyle(3, 0xFFFFFF, 0.7);
        // Top-left
        g.lineBetween(tx + inset, ty + inset, tx + inset + cm, ty + inset);
        g.lineBetween(tx + inset, ty + inset, tx + inset, ty + inset + cm);
        // Top-right
        g.lineBetween(tx + tw - inset, ty + inset, tx + tw - inset - cm, ty + inset);
        g.lineBetween(tx + tw - inset, ty + inset, tx + tw - inset, ty + inset + cm);
        // Bottom-left
        g.lineBetween(tx + inset, ty + th - inset, tx + inset + cm, ty + th - inset);
        g.lineBetween(tx + inset, ty + th - inset, tx + inset, ty + th - inset - cm);
        // Bottom-right
        g.lineBetween(tx + tw - inset, ty + th - inset, tx + tw - inset - cm, ty + th - inset);
        g.lineBetween(tx + tw - inset, ty + th - inset, tx + tw - inset, ty + th - inset - cm);
    }

    _deadLineHazard(g, tx, ty, tw, th, inset) {
        // Yellow-black hazard chevrons
        const chevronW = 6;
        // Top
        for (let x = tx + inset; x < tx + tw - inset; x += chevronW * 2) {
            g.fillStyle(0xFFCC00, 0.6); g.fillRect(x, ty + inset, chevronW, 3);
            g.fillStyle(0x1A1510, 0.6); g.fillRect(x + chevronW, ty + inset, chevronW, 3);
        }
        // Bottom
        for (let x = tx + inset; x < tx + tw - inset; x += chevronW * 2) {
            g.fillStyle(0xFFCC00, 0.6); g.fillRect(x, ty + th - inset - 3, chevronW, 3);
            g.fillStyle(0x1A1510, 0.6); g.fillRect(x + chevronW, ty + th - inset - 3, chevronW, 3);
        }
        // Left
        for (let y = ty + inset; y < ty + th - inset; y += chevronW * 2) {
            g.fillStyle(0xFFCC00, 0.6); g.fillRect(tx + inset, y, 3, chevronW);
            g.fillStyle(0x1A1510, 0.6); g.fillRect(tx + inset, y + chevronW, 3, chevronW);
        }
        // Right
        for (let y = ty + inset; y < ty + th - inset; y += chevronW * 2) {
            g.fillStyle(0xFFCC00, 0.6); g.fillRect(tx + tw - inset - 3, y, 3, chevronW);
            g.fillStyle(0x1A1510, 0.6); g.fillRect(tx + tw - inset - 3, y + chevronW, 3, chevronW);
        }
    }

    // ============================================================
    // BORDERS - Tiles PixelLab bois avec teinte par terrain
    // ============================================================

    // Border texture keys per terrain
    static BORDER_ASSETS = {
        village: { h: 'border_wood_h', v: 'border_wood_v', corners: 'rondin_ends' },
        plage:   { h: 'border_wood_h', v: 'border_wood_v', corners: 'rondin_ends', tint: 0xE8D0B0 },
        parc:    { h: 'border_parc_h', v: 'border_parc_v', corners: 'simple' },
        colline: { h: 'border_colline_h', v: 'border_colline_v', corners: 'simple' },
        docks:   { h: 'border_docks_h', v: 'border_docks_v', corners: 'simple' },
    };

    _drawBorders() {
        const tx = this.tx, ty = this.ty;
        const tw = TERRAIN_WIDTH, th = TERRAIN_HEIGHT;
        const bw = BORDER_WIDTH;
        const half = bw / 2;
        const depth = 3.5;
        const assets = TerrainRenderer.BORDER_ASSETS[this.terrainId] || TerrainRenderer.BORDER_ASSETS.village;
        const hasH = this.scene.textures.exists(assets.h);
        const hasV = this.scene.textures.exists(assets.v);

        if (!hasH || !hasV) { this._borderWoodFallback(); return; }

        const all = [];

        // 4 edges — H covers full width including corners, V fits between H borders
        const fullW = tw + bw * 2;
        all.push(this.scene.add.tileSprite(tx - bw + fullW / 2, ty - half, fullW, bw, assets.h).setDepth(depth));
        all.push(this.scene.add.tileSprite(tx - bw + fullW / 2, ty + th + half, fullW, bw, assets.h).setDepth(depth).setFlipY(true));
        all.push(this.scene.add.tileSprite(tx - half, ty + th / 2, bw, th, assets.v).setDepth(depth));
        all.push(this.scene.add.tileSprite(tx + tw + half, ty + th / 2, bw, th, assets.v).setDepth(depth).setFlipX(true));

        // Corners
        const cd = depth + 0.1;
        if (assets.corners === 'rondin_ends') {
            // Village/Plage: pre-baked rondin end sprites (8 pieces)
            const ends = [
                ['corner_tl_v', tx - half,            ty + half],
                ['corner_tl_h', tx - bw + half,       ty - half],
                ['corner_tr_v', tx + tw + half,        ty + half],
                ['corner_tr_h', tx + tw + bw - half,   ty - half],
                ['corner_bl_v', tx - half,             ty + th - half],
                ['corner_bl_h', tx - bw + half,        ty + th + half],
                ['corner_br_v', tx + tw + half,         ty + th - half],
                ['corner_br_h', tx + tw + bw - half,    ty + th + half],
            ];
            for (const [key, cx, cy] of ends) {
                if (this.scene.textures.exists(key)) {
                    all.push(this.scene.add.sprite(cx, cy, key).setDepth(cd));
                }
            }
        } else {
            // Parc/Colline/Docks: 4 corner sprites (pre-flipped)
            const prefix = 'border_' + this.terrainId + '_corner_';
            const cornerDefs = [
                [prefix + 'tl', tx - half, ty - half],
                [prefix + 'tr', tx + tw + half, ty - half],
                [prefix + 'bl', tx - half, ty + th + half],
                [prefix + 'br', tx + tw + half, ty + th + half],
            ];
            for (const [key, cx, cy] of cornerDefs) {
                if (this.scene.textures.exists(key)) {
                    all.push(this.scene.add.sprite(cx, cy, key).setDepth(cd));
                }
            }
        }

        // Apply optional tint
        if (assets.tint) {
            for (const item of all) item.setTint(assets.tint);
        }
    }

    // Procedural fallback when PixelLab textures are not loaded
    _borderWoodFallback() {
        const tx = this.tx, ty = this.ty;
        const tw = TERRAIN_WIDTH, th = TERRAIN_HEIGHT;
        const bw = BORDER_WIDTH;
        const g = this.scene.add.graphics().setDepth(3.5);
        const dark = 0x6B4B2A;
        const light = 0xA88B4A;

        g.fillStyle(0x8B6B3A, 1);
        g.fillRect(tx - bw, ty - bw, tw + bw * 2, bw);
        g.fillRect(tx - bw, ty + th, tw + bw * 2, bw);
        g.fillRect(tx - bw, ty, bw, th);
        g.fillRect(tx + tw, ty, bw, th);

        g.fillStyle(dark, 0.2);
        for (let gy = 0; gy < bw; gy += 2) {
            g.fillRect(tx - bw, ty - bw + gy, tw + bw * 2, 0.8);
            g.fillRect(tx - bw, ty + th + gy, tw + bw * 2, 0.8);
        }
        for (let gx = 0; gx < bw; gx += 2) {
            g.fillRect(tx - bw + gx, ty, 0.8, th);
            g.fillRect(tx + tw + gx, ty, 0.8, th);
        }

        g.fillStyle(light, 0.25);
        g.fillRect(tx - bw, ty - bw, tw + bw * 2, 1.5);
        g.fillRect(tx - bw, ty, 1.5, th);
    }

    // ============================================================
    // HORS JEU! - Feedback visuel quand une boule sort
    // ============================================================
    showHorsJeu(x, y) {
        // Clamp position to screen
        const px = Phaser.Math.Clamp(x, 60, GAME_WIDTH - 60);
        const py = Phaser.Math.Clamp(y, 30, GAME_HEIGHT - 30);

        // Red flash at exit point
        const flash = this.scene.add.graphics().setDepth(50);
        flash.fillStyle(0xCC3333, 0.4);
        flash.fillCircle(px, py, 20);
        this.scene.tweens.add({
            targets: flash, alpha: 0, duration: 600, ease: 'Sine.easeOut',
            onComplete: () => flash.destroy()
        });

        // "HORS JEU !" text
        const text = this.scene.add.text(px, py - 20, 'HORS JEU !', {
            fontFamily: 'monospace', fontSize: '16px', color: '#FF4444',
            stroke: '#1A1510', strokeThickness: 3,
            shadow: { offsetX: 2, offsetY: 2, color: '#1A1510', blur: 2, fill: true }
        }).setOrigin(0.5).setDepth(50);

        // X mark
        const xMark = this.scene.add.text(px, py, 'X', {
            fontFamily: 'monospace', fontSize: '22px', color: '#FF4444',
            stroke: '#1A1510', strokeThickness: 2
        }).setOrigin(0.5).setDepth(49).setAlpha(0.7);

        // Animate
        this.scene.tweens.add({
            targets: text,
            y: py - 45, alpha: 0,
            duration: 1200, ease: 'Sine.easeOut',
            onComplete: () => text.destroy()
        });
        this.scene.tweens.add({
            targets: xMark,
            alpha: 0, scaleX: 1.5, scaleY: 1.5,
            duration: 800, ease: 'Sine.easeOut',
            onComplete: () => xMark.destroy()
        });

        // Camera shake removed — fixed scene
    }
}
