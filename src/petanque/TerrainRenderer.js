import { GAME_WIDTH, GAME_HEIGHT, TERRAIN_WIDTH, TERRAIN_HEIGHT, COLORS } from '../utils/Constants.js';

// ============================================================
// TerrainRenderer - Rendu visuel complet des terrains de petanque
// Textures procedurale riches, bordures uniques, decors, lignes de mort
// ============================================================

const BORDER_WIDTH = 10;

// Config visuelle par terrain ID
const TERRAIN_VISUALS = {
    village: {
        sky: ['#6BB8E0', '#A8D8EA', '#D4E8D0', '#C4B090'],
        groundColor: '#9B8D6A',
        surfaceBase: '#C4854A',
        surfaceGravel: ['#B07840', '#D49560', '#A87040', '#C4954A', '#B88850', '#9A6A30'],
        borderType: 'wood',
        borderColor: '#8B6B3A',
        deadLineColor: 'rgba(255,255,255,0.6)',
        deadLineStyle: 'chalk',
    },
    plage: {
        sky: ['#4A9ED5', '#7EC8E8', '#E8D890', '#F0C870'],
        groundColor: '#D4C0A0',
        surfaceBase: '#E8D5B7',
        surfaceGravel: ['#D4C0A0', '#F0E0C8', '#C4B090', '#E8D0B0', '#DDD4B8', '#F5E8D0'],
        borderType: 'rope',
        borderColor: '#A08050',
        deadLineColor: 'rgba(180,150,100,0.7)',
        deadLineStyle: 'driftwood',
    },
    parc: {
        sky: ['#78C0E8', '#A0D8F0', '#C0E8D0', '#B0D8A0'],
        groundColor: '#5A7A3A',
        surfaceBase: '#6B8E4E',
        surfaceGravel: ['#5E8A44', '#7BA65E', '#4A7A3A', '#6B9E4E', '#5A9040', '#82B068'],
        borderType: 'hedge',
        borderColor: '#3A6A2A',
        deadLineColor: 'rgba(255,255,255,0.7)',
        deadLineStyle: 'painted',
    },
    colline: {
        sky: ['#D4A060', '#E8C080', '#F0D8A0', '#C49050'],
        groundColor: '#8B7D5A',
        surfaceBase: '#C4954A',
        surfaceGravel: ['#B08540', '#D4A560', '#A88040', '#C4A54A', '#9A7530', '#B89050'],
        borderType: 'stone',
        borderColor: '#A09878',
        deadLineColor: 'rgba(200,180,140,0.6)',
        deadLineStyle: 'stones',
    },
    docks: {
        sky: ['#1A2A4A', '#2A3A5A', '#3A3A50', '#4A3A40'],
        groundColor: '#3A3A30',
        surfaceBase: '#7A7A70',
        surfaceGravel: ['#8E8E7E', '#B0A090', '#808070', '#A09888', '#989080', '#6A6A60'],
        borderType: 'metal',
        borderColor: '#5A5A50',
        deadLineColor: 'rgba(255,200,0,0.7)',
        deadLineStyle: 'hazard',
    }
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
        this._drawGround();
        this._drawBackgroundDecor();
        this._drawTerrainShadow();
        this._drawSurface();
        this._drawDeadLines();
        this._drawBorders();
        return this;
    }

    // ============================================================
    // SKY - Gradient unique par terrain
    // ============================================================
    _drawSky() {
        const key = `sky_${this.terrainId}`;
        if (this.scene.textures.exists(key)) this.scene.textures.remove(key);
        const tex = this.scene.textures.createCanvas(key, GAME_WIDTH, GAME_HEIGHT);
        const ctx = tex.getContext();

        const colors = this.vis.sky;
        const grad = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
        grad.addColorStop(0, colors[0]);
        grad.addColorStop(0.35, colors[1]);
        grad.addColorStop(0.6, colors[2]);
        grad.addColorStop(1, colors[3]);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Clouds (skip for docks - night scene)
        if (this.terrainId !== 'docks') {
            this._drawClouds(ctx);
        } else {
            this._drawStars(ctx);
        }

        tex.refresh();
        this.scene.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, key).setDepth(0);
    }

    _drawClouds(ctx) {
        const cloudSets = [
            { x: 120, y: 35, r: [35, 28, 22], alpha: 0.25 },
            { x: 550, y: 50, r: [40, 30, 25], alpha: 0.18 },
            { x: 350, y: 22, r: [20, 15], alpha: 0.15 },
        ];
        for (const cs of cloudSets) {
            ctx.fillStyle = `rgba(255,255,255,${cs.alpha})`;
            for (let i = 0; i < cs.r.length; i++) {
                ctx.beginPath();
                ctx.arc(cs.x + i * 30 - 15, cs.y + (i % 2) * 8, cs.r[i], 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    _drawStars(ctx) {
        ctx.fillStyle = 'rgba(255,255,200,0.4)';
        for (let i = 0; i < 40; i++) {
            const sx = this._rng() * GAME_WIDTH;
            const sy = this._rng() * GAME_HEIGHT * 0.5;
            const sr = 0.5 + this._rng() * 1.5;
            ctx.beginPath();
            ctx.arc(sx, sy, sr, 0, Math.PI * 2);
            ctx.fill();
        }
        // Moon for docks
        ctx.fillStyle = 'rgba(255,255,220,0.15)';
        ctx.beginPath(); ctx.arc(700, 40, 25, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,230,0.25)';
        ctx.beginPath(); ctx.arc(700, 40, 18, 0, Math.PI * 2); ctx.fill();
    }

    // ============================================================
    // GROUND - Sol hors terrain
    // ============================================================
    _drawGround() {
        const g = this.scene.add.graphics().setDepth(0);
        const gc = parseInt(this.vis.groundColor.replace('#', ''), 16);
        g.fillStyle(gc, 1);
        g.fillRect(0, GAME_HEIGHT * 0.50, GAME_WIDTH, GAME_HEIGHT * 0.50);

        // Subtle ground texture
        g.fillStyle(gc, 0.3);
        g.fillRect(0, GAME_HEIGHT * 0.53, GAME_WIDTH, GAME_HEIGHT * 0.04);
    }

    // ============================================================
    // BACKGROUND DECOR - Unique par terrain
    // ============================================================
    _drawBackgroundDecor() {
        const d = this.scene.add.graphics().setDepth(0.5);
        const tx = this.tx;
        const tw = TERRAIN_WIDTH;

        switch (this.terrainId) {
            case 'village': this._decorVillage(d, tx, tw); break;
            case 'plage':   this._decorPlage(d, tx, tw); break;
            case 'parc':    this._decorParc(d, tx, tw); break;
            case 'colline': this._decorColline(d, tx, tw); break;
            case 'docks':   this._decorDocks(d, tx, tw); break;
        }

        // Overlay pixel art sprite decors where available
        this._placeDecorSprites(tx, tw);
    }

    _placeDecorSprites(tx, tw) {
        const s = this.scene;
        const depth = 0.6;
        const has = (k) => s.textures.exists(k);

        switch (this.terrainId) {
            case 'village':
                // Bench (left side, near procedural bench position)
                if (has('decor_banc'))
                    s.add.image(tx - 46, 300, 'decor_banc').setDepth(depth).setScale(2);
                // Fountain (right side)
                if (has('decor_fontaine'))
                    s.add.image(tx + TERRAIN_WIDTH + 40, 215, 'decor_fontaine').setDepth(depth).setScale(2);
                break;

            case 'parc':
                // Pine tree (left side as tall tree)
                if (has('decor_pin'))
                    s.add.image(tx - 55, 160, 'decor_pin').setDepth(depth).setScale(2.5);
                // Bench (left side below tree)
                if (has('decor_banc'))
                    s.add.image(tx - 45, 290, 'decor_banc').setDepth(depth).setScale(1.8);
                break;

            case 'colline':
                // Olive trees replacing procedural ones
                if (has('decor_olivier')) {
                    s.add.image(tx - 55, 110, 'decor_olivier').setDepth(depth).setScale(2.5);
                    s.add.image(tx + TERRAIN_WIDTH + 65, 140, 'decor_olivier').setDepth(depth).setScale(2.2).setFlipX(true);
                    s.add.image(tx - 30, 260, 'decor_olivier').setDepth(depth).setScale(2);
                    s.add.image(tx + TERRAIN_WIDTH + 85, 290, 'decor_olivier').setDepth(depth).setScale(2).setFlipX(true);
                }
                break;

            case 'plage':
                // Pine tree as distant vegetation (left far)
                if (has('decor_pin'))
                    s.add.image(30, 85, 'decor_pin').setDepth(depth).setScale(1.5).setAlpha(0.5);
                break;

            case 'docks':
                // No nature decor for industrial setting
                break;
        }
    }

    _decorVillage(d, tx, tw) {
        const hy = GAME_HEIGHT * 0.48;

        // Provencal buildings
        d.fillStyle(0xD4A574, 0.7); d.fillRect(60, hy, 65, 35);
        d.fillStyle(0xC4854A, 0.6); d.fillRect(60, hy - 12, 65, 14); // roof
        d.fillStyle(0xD4A574, 0.6); d.fillRect(180, hy + 5, 50, 30);
        d.fillStyle(0xC4854A, 0.5); d.fillRect(180, hy - 5, 50, 12);

        // Church tower
        d.fillStyle(0xD4C4A0, 0.6); d.fillRect(680, hy - 25, 22, 55);
        d.fillStyle(0xC4854A, 0.5); d.fillRect(675, hy - 30, 32, 8);
        // Cross
        d.fillStyle(0x3A2E28, 0.5);
        d.fillRect(689, hy - 38, 4, 10);
        d.fillRect(685, hy - 35, 12, 3);

        // Platane left
        d.fillStyle(0x7B5B3A, 1); d.fillRect(tx - 85, 65, 18, 95);
        d.fillStyle(0x5A8A3A, 1); d.fillCircle(tx - 76, 48, 50);
        d.fillStyle(0x4A7A2A, 0.6); d.fillCircle(tx - 62, 60, 38);
        d.fillStyle(0x6B9E4E, 0.4); d.fillCircle(tx - 88, 42, 30);

        // Platane right
        d.fillStyle(0x7B5B3A, 1); d.fillRect(tx + tw + 60, 80, 16, 85);
        d.fillStyle(0x5A8A3A, 1); d.fillCircle(tx + tw + 68, 65, 44);
        d.fillStyle(0x4A7A2A, 0.6); d.fillCircle(tx + tw + 78, 78, 32);

        // Bench left
        d.fillStyle(0x8B6B4A, 1); d.fillRect(tx - 72, 300, 52, 5);
        d.fillStyle(0x7B5B3A, 1);
        d.fillRect(tx - 70, 305, 4, 12);
        d.fillRect(tx - 24, 305, 4, 12);
        d.fillStyle(0x9B7B5A, 0.8); d.fillRect(tx - 72, 295, 52, 3);

        // Fountain (right side)
        d.fillStyle(0xC0B8A0, 0.7);
        d.fillRect(tx + tw + 25, 200, 30, 35);
        d.fillStyle(0x7AB8D0, 0.4);
        d.fillRect(tx + tw + 28, 218, 24, 14);
        // Water spout
        d.fillStyle(0x8AC8E0, 0.5);
        d.fillCircle(tx + tw + 40, 208, 3);

        // Stone wall right
        d.fillStyle(0xD4C4A0, 1); d.fillRect(tx + tw + 18, 260, 30, 140);
        d.fillStyle(0xC0B090, 0.4);
        for (let my = 260; my < 400; my += 16) {
            d.fillRect(tx + tw + 18, my, 30, 1);
            if (my % 32 === 0) d.fillRect(tx + tw + 33, my, 1, 16);
        }

        // Flower pot
        d.fillStyle(0xA05A2A, 1); d.fillRect(tx + tw + 24, 402, 14, 12);
        d.fillStyle(0xCC4444, 0.8); d.fillCircle(tx + tw + 31, 399, 6);

        // Score tableau (left)
        d.fillStyle(0x2A4A2A, 1); d.fillRect(tx - 32, 180, 22, 32);
        d.fillStyle(0xFFFFFF, 0.6);
        d.fillRect(tx - 29, 185, 7, 9); d.fillRect(tx - 18, 185, 7, 9);
        d.fillStyle(0x6B5038, 1); d.fillRect(tx - 24, 212, 8, 22);
    }

    _decorPlage(d, tx, tw) {
        const hy = GAME_HEIGHT * 0.46;

        // Sea horizon
        d.fillStyle(0x3A8AC0, 0.5); d.fillRect(0, hy - 20, GAME_WIDTH, 30);
        d.fillStyle(0x4A9AD0, 0.3); d.fillRect(0, hy - 10, GAME_WIDTH, 15);
        // Waves
        d.fillStyle(0xFFFFFF, 0.15);
        for (let wx = 0; wx < GAME_WIDTH; wx += 40) {
            d.fillRect(wx + this._rng() * 20, hy + 5, 25, 2);
        }

        // Sailboat
        d.fillStyle(0xFFFFFF, 0.5);
        d.beginPath(); d.moveTo(200, hy - 15); d.lineTo(210, hy - 40);
        d.lineTo(220, hy - 15); d.closePath(); d.fillPath();
        d.fillStyle(0x8B4A2A, 0.5); d.fillRect(195, hy - 12, 30, 5);

        // Parasol left
        d.fillStyle(0xCC4444, 0.7);
        d.beginPath();
        d.arc(tx - 50, 200, 30, Math.PI, Math.PI * 2);
        d.fillPath();
        d.fillStyle(0xFFFFFF, 0.4);
        d.beginPath();
        d.arc(tx - 50, 200, 30, Math.PI + 0.5, Math.PI + 1.5);
        d.fillPath();
        d.fillStyle(0x8B6B4A, 1); d.fillRect(tx - 52, 200, 4, 60);

        // Parasol right
        d.fillStyle(0x4488CC, 0.6);
        d.beginPath();
        d.arc(tx + tw + 55, 220, 28, Math.PI, Math.PI * 2);
        d.fillPath();
        d.fillStyle(0x8B6B4A, 1); d.fillRect(tx + tw + 53, 220, 4, 55);

        // Palm frond (left corner)
        d.fillStyle(0x4A8A3A, 0.5);
        for (let a = 0; a < 5; a++) {
            const angle = -0.3 + a * 0.35;
            d.fillRect(0, 0, 3, 60);
            // Simplified frond
        }
        d.fillStyle(0x7B5B3A, 0.8); d.fillRect(-5, 0, 14, 80);
        d.fillStyle(0x4A8A3A, 0.7);
        d.fillCircle(2, 60, 35);
        d.fillStyle(0x3A7A2A, 0.5);
        d.fillCircle(10, 50, 28);
        d.fillCircle(-10, 65, 25);

        // Beach towel (right)
        d.fillStyle(0xE07040, 0.4); d.fillRect(tx + tw + 30, 300, 25, 40);
        d.fillStyle(0xFFFFFF, 0.2); d.fillRect(tx + tw + 30, 310, 25, 4);
        d.fillRect(tx + tw + 30, 320, 25, 4);

        // Sand castle (bottom left)
        d.fillStyle(0xD4B88A, 0.5);
        d.fillRect(tx - 60, 380, 20, 25);
        d.fillRect(tx - 45, 385, 15, 20);
        d.fillStyle(0xD4B88A, 0.5);
        d.fillCircle(tx - 50, 378, 10);
        d.fillCircle(tx - 38, 383, 7);
    }

    _decorParc(d, tx, tw) {
        const hy = GAME_HEIGHT * 0.48;

        // Distant tree line
        d.fillStyle(0x4A7A3A, 0.4);
        for (let i = 0; i < 12; i++) {
            const bx = i * 75 + 20;
            d.fillCircle(bx, hy - 5, 18 + this._rng() * 12);
        }

        // Wrought iron bench (left)
        d.fillStyle(0x2A2A2A, 0.8); d.fillRect(tx - 70, 290, 50, 4);
        d.fillRect(tx - 70, 280, 50, 3);
        d.fillStyle(0x3A3A3A, 0.7);
        d.fillRect(tx - 68, 294, 3, 14); d.fillRect(tx - 24, 294, 3, 14);
        // Armrests
        d.fillRect(tx - 72, 278, 3, 18); d.fillRect(tx - 20, 278, 3, 18);

        // Duck pond (right)
        d.fillStyle(0x5A9AC0, 0.4);
        d.fillCircle(tx + tw + 55, 300, 35);
        d.fillStyle(0x6AAAD0, 0.3);
        d.fillCircle(tx + tw + 50, 296, 28);
        // Duck
        d.fillStyle(0xFFFFFF, 0.6);
        d.fillCircle(tx + tw + 45, 292, 5);
        d.fillStyle(0xDDA030, 0.7);
        d.fillRect(tx + tw + 41, 291, 4, 2);

        // Flower beds (left bottom)
        d.fillStyle(0x6B4030, 0.5); d.fillRect(tx - 80, 350, 55, 12);
        const flowerColors = [0xCC4444, 0xFFAA44, 0xCC44CC, 0xFFFF44, 0xFF6688];
        for (let i = 0; i < 8; i++) {
            d.fillStyle(flowerColors[i % flowerColors.length], 0.7);
            d.fillCircle(tx - 75 + i * 7, 348, 3 + this._rng() * 2);
        }

        // Kiosque / bandstand (right far)
        d.fillStyle(0xC44B3F, 0.4);
        d.beginPath();
        d.arc(tx + tw + 70, 170, 25, Math.PI, Math.PI * 2);
        d.fillPath();
        d.fillStyle(0xD4C4A0, 0.5);
        d.fillRect(tx + tw + 48, 170, 4, 30);
        d.fillRect(tx + tw + 88, 170, 4, 30);
        d.fillRect(tx + tw + 46, 198, 50, 5);

        // Lamp post (left)
        d.fillStyle(0x3A3A3A, 0.7); d.fillRect(tx - 30, 130, 4, 70);
        d.fillStyle(0xFFDD66, 0.3); d.fillCircle(tx - 28, 128, 7);
        d.fillStyle(0x3A3A3A, 0.8);
        d.fillRect(tx - 36, 126, 20, 4);
    }

    _decorColline(d, tx, tw) {
        const hy = GAME_HEIGHT * 0.45;

        // Rolling hills silhouettes
        d.fillStyle(0x8A7A50, 0.5);
        d.beginPath();
        d.moveTo(0, hy + 30);
        for (let x = 0; x <= GAME_WIDTH; x += 10) {
            d.lineTo(x, hy + 10 + Math.sin(x * 0.008) * 20 + Math.sin(x * 0.02) * 8);
        }
        d.lineTo(GAME_WIDTH, GAME_HEIGHT); d.lineTo(0, GAME_HEIGHT); d.closePath(); d.fillPath();

        d.fillStyle(0x9A8A5A, 0.4);
        d.beginPath();
        d.moveTo(0, hy + 40);
        for (let x = 0; x <= GAME_WIDTH; x += 10) {
            d.lineTo(x, hy + 25 + Math.sin(x * 0.012 + 1) * 15);
        }
        d.lineTo(GAME_WIDTH, GAME_HEIGHT); d.lineTo(0, GAME_HEIGHT); d.closePath(); d.fillPath();

        // Olive trees (twisted trunks)
        const olivePositions = [
            { x: tx - 70, y: 100 }, { x: tx - 40, y: 250 },
            { x: tx + tw + 50, y: 130 }, { x: tx + tw + 80, y: 280 }
        ];
        for (const op of olivePositions) {
            // Trunk (twisted)
            d.fillStyle(0x6B5B3A, 0.9);
            d.fillRect(op.x - 3, op.y, 8, 55);
            d.fillRect(op.x - 6, op.y + 10, 5, 35);
            // Canopy (silver-green, sparse)
            d.fillStyle(0x8AAA6A, 0.7);
            d.fillCircle(op.x, op.y - 5, 24);
            d.fillStyle(0x7A9A5A, 0.5);
            d.fillCircle(op.x + 12, op.y, 18);
            d.fillCircle(op.x - 10, op.y + 5, 16);
            // Sparse leaves (olive trees are not dense)
            d.fillStyle(0x9ABA7A, 0.3);
            d.fillCircle(op.x + 5, op.y - 12, 12);
        }

        // Dry stone wall (muret) in background
        d.fillStyle(0xB0A888, 0.6);
        d.fillRect(400, hy + 15, 120, 14);
        d.fillStyle(0x9A9070, 0.4);
        for (let sx = 400; sx < 520; sx += 12) {
            d.fillRect(sx, hy + 15, 1, 14);
        }

        // Lavender field hint (bottom right)
        d.fillStyle(0x9B7BB8, 0.3);
        for (let i = 0; i < 15; i++) {
            const lx = tx + tw + 20 + i * 6;
            d.fillRect(lx, 370 + (i % 3) * 3, 3, 10);
        }
    }

    _decorDocks(d, tx, tw) {
        const hy = GAME_HEIGHT * 0.50;

        // Industrial ground
        d.fillStyle(0x4A4A40, 0.8); d.fillRect(0, hy, GAME_WIDTH, GAME_HEIGHT - hy);

        // Shipping containers (left stack)
        const containerColors = [0xCC4444, 0x4488CC, 0x44AA44, 0xCCAA22];
        let cy = 130;
        for (let i = 0; i < 3; i++) {
            d.fillStyle(containerColors[i], 0.6);
            d.fillRect(tx - 100, cy, 60, 28);
            d.fillStyle(0x1A1510, 0.25);
            d.fillRect(tx - 100, cy + 26, 60, 2);
            // Container ridges
            d.fillStyle(containerColors[i], 0.4);
            for (let rx = tx - 95; rx < tx - 45; rx += 8) {
                d.fillRect(rx, cy + 2, 1, 24);
            }
            cy += 32;
        }

        // Crane silhouette (right)
        d.fillStyle(0x2A2A28, 0.7);
        d.fillRect(tx + tw + 80, 0, 8, 250);
        d.fillRect(tx + tw + 50, 40, 70, 6);
        d.fillRect(tx + tw + 50, 40, 4, 20);
        // Crane cable
        d.lineStyle(1, 0x3A3A38, 0.5);
        d.lineBetween(tx + tw + 54, 60, tx + tw + 54, 120);

        // Harbor water (bottom)
        d.fillStyle(0x2A3A4A, 0.5);
        d.fillRect(0, GAME_HEIGHT - 40, GAME_WIDTH, 40);
        d.fillStyle(0x3A4A5A, 0.3);
        for (let wx = 0; wx < GAME_WIDTH; wx += 30) {
            d.fillRect(wx, GAME_HEIGHT - 35 + this._rng() * 10, 20, 2);
        }

        // Harbor lights
        const lightPositions = [tx - 40, tx + tw + 40, tx + tw / 2 - 80, tx + tw / 2 + 80];
        for (const lx of lightPositions) {
            d.fillStyle(0x3A3A38, 0.8); d.fillRect(lx - 2, 320, 4, 60);
            d.fillStyle(0xFFAA44, 0.5); d.fillCircle(lx, 318, 5);
            // Light glow
            d.fillStyle(0xFFAA44, 0.08); d.fillCircle(lx, 340, 25);
        }

        // Bollard (dock post)
        d.fillStyle(0x5A5A50, 0.8);
        d.fillRect(tx - 20, 350, 12, 20);
        d.fillStyle(0xFFAA44, 0.3);
        d.fillRect(tx - 22, 348, 16, 4);

        // Chain-link fence hint (right)
        d.fillStyle(0x5A5A58, 0.4);
        d.fillRect(tx + tw + 15, 260, 3, 100);
        d.fillRect(tx + tw + 15, 258, 12, 3);
    }

    // ============================================================
    // TERRAIN SHADOW
    // ============================================================
    _drawTerrainShadow() {
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
            // Tile the seamless texture across the terrain surface
            const ts = this.scene.add.tileSprite(
                this.tx + TERRAIN_WIDTH / 2,
                this.ty + TERRAIN_HEIGHT / 2,
                TERRAIN_WIDTH, TERRAIN_HEIGHT,
                texKey
            ).setDepth(2);

            // Tint colline warmer to differentiate from village (same terre texture)
            if (this.terrainId === 'colline') {
                ts.setTint(0xDDCC88);
            }

            // v2_terrain_terre overlay: adds gravel/debris detail on terre-based terrains
            if ((this.terrainId === 'village' || this.terrainId === 'colline') &&
                this.scene.textures.exists('v2_terrain_terre')) {
                this.scene.add.image(
                    this.tx + TERRAIN_WIDTH / 2,
                    this.ty + TERRAIN_HEIGHT / 2,
                    'v2_terrain_terre'
                ).setDisplaySize(TERRAIN_WIDTH, TERRAIN_HEIGHT).setDepth(2).setAlpha(0.25);
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
        edgeGrad.addColorStop(0, 'rgba(0,0,0,0)');
        edgeGrad.addColorStop(1, 'rgba(0,0,0,0.08)');
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
        const inset = 3; // pixels inside terrain edge

        switch (this.vis.deadLineStyle) {
            case 'chalk': this._deadLineChalk(g, tx, ty, tw, th, inset); break;
            case 'driftwood': this._deadLineDriftwood(g, tx, ty, tw, th, inset); break;
            case 'painted': this._deadLinePainted(g, tx, ty, tw, th, inset); break;
            case 'stones': this._deadLineStones(g, tx, ty, tw, th, inset); break;
            case 'hazard': this._deadLineHazard(g, tx, ty, tw, th, inset); break;
        }

        // "LIGNE DE MORT" labels at top and bottom (small)
        const labelStyle = {
            fontFamily: 'monospace', fontSize: '7px',
            color: this.terrainId === 'docks' ? '#FFD700' : '#FFFFFF',
            alpha: 0.4
        };
        this.scene.add.text(tx + tw / 2, ty + 8, 'LIGNE DE FOND', labelStyle)
            .setOrigin(0.5).setDepth(3.3).setAlpha(0.35);
        this.scene.add.text(tx + tw / 2, ty + th - 8, 'LIGNE DE FOND', labelStyle)
            .setOrigin(0.5).setDepth(3.3).setAlpha(0.35);
    }

    _deadLineChalk(g, tx, ty, tw, th, inset) {
        // White chalk lines - slightly irregular
        g.lineStyle(2, 0xFFFFFF, 0.5);
        // Top
        for (let x = tx + inset; x < tx + tw - inset; x += 4) {
            g.fillStyle(0xFFFFFF, 0.3 + Math.random() * 0.3);
            g.fillRect(x, ty + inset, 3, 2);
        }
        // Bottom
        for (let x = tx + inset; x < tx + tw - inset; x += 4) {
            g.fillStyle(0xFFFFFF, 0.3 + Math.random() * 0.3);
            g.fillRect(x, ty + th - inset - 2, 3, 2);
        }
        // Left
        for (let y = ty + inset; y < ty + th - inset; y += 4) {
            g.fillStyle(0xFFFFFF, 0.3 + Math.random() * 0.3);
            g.fillRect(tx + inset, y, 2, 3);
        }
        // Right
        for (let y = ty + inset; y < ty + th - inset; y += 4) {
            g.fillStyle(0xFFFFFF, 0.3 + Math.random() * 0.3);
            g.fillRect(tx + tw - inset - 2, y, 2, 3);
        }
    }

    _deadLineDriftwood(g, tx, ty, tw, th, inset) {
        // Driftwood sticks and shells marking the boundary
        const color = 0xB09870;
        // Top & Bottom
        for (let x = tx + inset; x < tx + tw - inset; x += 8 + Math.random() * 6) {
            g.fillStyle(color, 0.4 + Math.random() * 0.3);
            const w = 4 + Math.random() * 5;
            g.fillRect(x, ty + inset, w, 1.5);
            g.fillRect(x + 2, ty + th - inset - 1.5, w, 1.5);
        }
        // Left & Right
        for (let y = ty + inset; y < ty + th - inset; y += 8 + Math.random() * 6) {
            g.fillStyle(color, 0.4 + Math.random() * 0.3);
            const h = 4 + Math.random() * 5;
            g.fillRect(tx + inset, y, 1.5, h);
            g.fillRect(tx + tw - inset - 1.5, y, 1.5, h);
        }
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

    _deadLineStones(g, tx, ty, tw, th, inset) {
        // Stone cairn markers at intervals
        const stoneColor = 0xA09878;
        const spacing = 18;
        // Top & Bottom
        for (let x = tx + inset + 6; x < tx + tw - inset; x += spacing) {
            g.fillStyle(stoneColor, 0.5); g.fillCircle(x, ty + inset + 1, 2.5);
            g.fillStyle(stoneColor, 0.5); g.fillCircle(x, ty + th - inset - 1, 2.5);
        }
        // Left & Right
        for (let y = ty + inset + 6; y < ty + th - inset; y += spacing) {
            g.fillStyle(stoneColor, 0.5); g.fillCircle(tx + inset + 1, y, 2.5);
            g.fillStyle(stoneColor, 0.5); g.fillCircle(tx + tw - inset - 1, y, 2.5);
        }
    }

    _deadLineHazard(g, tx, ty, tw, th, inset) {
        // Yellow-black hazard chevrons
        const chevronW = 6;
        // Top
        for (let x = tx + inset; x < tx + tw - inset; x += chevronW * 2) {
            g.fillStyle(0xFFCC00, 0.6); g.fillRect(x, ty + inset, chevronW, 3);
            g.fillStyle(0x1A1A18, 0.6); g.fillRect(x + chevronW, ty + inset, chevronW, 3);
        }
        // Bottom
        for (let x = tx + inset; x < tx + tw - inset; x += chevronW * 2) {
            g.fillStyle(0xFFCC00, 0.6); g.fillRect(x, ty + th - inset - 3, chevronW, 3);
            g.fillStyle(0x1A1A18, 0.6); g.fillRect(x + chevronW, ty + th - inset - 3, chevronW, 3);
        }
        // Left
        for (let y = ty + inset; y < ty + th - inset; y += chevronW * 2) {
            g.fillStyle(0xFFCC00, 0.6); g.fillRect(tx + inset, y, 3, chevronW);
            g.fillStyle(0x1A1A18, 0.6); g.fillRect(tx + inset, y + chevronW, 3, chevronW);
        }
        // Right
        for (let y = ty + inset; y < ty + th - inset; y += chevronW * 2) {
            g.fillStyle(0xFFCC00, 0.6); g.fillRect(tx + tw - inset - 3, y, 3, chevronW);
            g.fillStyle(0x1A1A18, 0.6); g.fillRect(tx + tw - inset - 3, y + chevronW, 3, chevronW);
        }
    }

    // ============================================================
    // BORDERS - Uniques par terrain
    // ============================================================
    _drawBorders() {
        switch (this.vis.borderType) {
            case 'wood':  this._borderWood(); break;
            case 'rope':  this._borderRope(); break;
            case 'hedge': this._borderHedge(); break;
            case 'stone': this._borderStone(); break;
            case 'metal': this._borderMetal(); break;
        }
    }

    // --- WOOD (Village) - Rondins de bois uses avec grain visible ---
    _borderWood() {
        const tx = this.tx, ty = this.ty;
        const tw = TERRAIN_WIDTH, th = TERRAIN_HEIGHT;
        const bw = BORDER_WIDTH;
        const hasTex = this.scene.textures.exists('border_wood');

        if (hasTex) {
            // TileSprite borders using loaded wood texture
            const depth = 3.5;
            // Top
            this.scene.add.tileSprite(tx - bw + (tw + bw * 2) / 2, ty - bw + bw / 2,
                tw + bw * 2, bw, 'border_wood').setDepth(depth);
            // Bottom
            this.scene.add.tileSprite(tx - bw + (tw + bw * 2) / 2, ty + th + bw / 2,
                tw + bw * 2, bw, 'border_wood').setDepth(depth);
            // Left
            this.scene.add.tileSprite(tx - bw + bw / 2, ty + th / 2,
                bw, th, 'border_wood').setDepth(depth);
            // Right
            this.scene.add.tileSprite(tx + tw + bw / 2, ty + th / 2,
                bw, th, 'border_wood').setDepth(depth);
        }

        const g = this.scene.add.graphics().setDepth(3.6);
        const dark = 0x6B4B2A;
        const light = 0xA88B4A;

        if (!hasTex) {
            // Fallback: procedural base fill
            g.fillStyle(0x8B6B3A, 1);
            g.fillRect(tx - bw, ty - bw, tw + bw * 2, bw);
            g.fillRect(tx - bw, ty + th, tw + bw * 2, bw);
            g.fillRect(tx - bw, ty, bw, th);
            g.fillRect(tx + tw, ty, bw, th);
        }

        // Wood grain overlay (horizontal lines on H borders, vertical on V)
        g.fillStyle(dark, 0.2);
        for (let gy = 0; gy < bw; gy += 2) {
            g.fillRect(tx - bw, ty - bw + gy, tw + bw * 2, 0.8);
            g.fillRect(tx - bw, ty + th + gy, tw + bw * 2, 0.8);
        }
        for (let gx = 0; gx < bw; gx += 2) {
            g.fillRect(tx - bw + gx, ty, 0.8, th);
            g.fillRect(tx + tw + gx, ty, 0.8, th);
        }

        // Plank joints
        g.fillStyle(dark, 0.35);
        for (let jx = tx - bw; jx < tx + tw + bw; jx += 30 + this._rng() * 10) {
            g.fillRect(jx, ty - bw, 1.5, bw);
            g.fillRect(jx, ty + th, 1.5, bw);
        }
        for (let jy = ty; jy < ty + th; jy += 30 + this._rng() * 10) {
            g.fillRect(tx - bw, jy, bw, 1.5);
            g.fillRect(tx + tw, jy, bw, 1.5);
        }

        // Highlight
        g.fillStyle(light, 0.25);
        g.fillRect(tx - bw, ty - bw, tw + bw * 2, 1.5);
        g.fillRect(tx - bw, ty, 1.5, th);

        // Corner nails
        this._drawNails(g, tx, ty, tw, th, bw);
    }

    _drawNails(g, tx, ty, tw, th, bw) {
        const nailPositions = [
            [tx - bw / 2, ty - bw / 2],
            [tx + tw + bw / 2, ty - bw / 2],
            [tx - bw / 2, ty + th + bw / 2],
            [tx + tw + bw / 2, ty + th + bw / 2],
            // Mid-points
            [tx + tw / 2, ty - bw / 2],
            [tx + tw / 2, ty + th + bw / 2],
            [tx - bw / 2, ty + th / 2],
            [tx + tw + bw / 2, ty + th / 2],
        ];
        for (const [nx, ny] of nailPositions) {
            g.fillStyle(0x606058, 0.8); g.fillCircle(nx, ny, 2.5);
            g.fillStyle(0x909088, 0.5); g.fillCircle(nx - 0.5, ny - 0.5, 1);
        }
    }

    // --- ROPE (Plage) - Corde de chanvre sur piquets ---
    _borderRope() {
        const tx = this.tx, ty = this.ty;
        const tw = TERRAIN_WIDTH, th = TERRAIN_HEIGHT;
        const bw = BORDER_WIDTH;
        const g = this.scene.add.graphics().setDepth(3.5);

        const postSpacing = 35;
        const ropeColor = 0xC4A060;
        const ropeDark = 0x9A7A40;
        const postColor = 0x8B6B4A;

        // Draw rope (thick, slightly wavy)
        const drawRopeSegment = (x1, y1, x2, y2) => {
            const isHorizontal = Math.abs(y1 - y2) < 2;
            const len = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
            const steps = Math.ceil(len / 2);

            for (let i = 0; i < steps; i++) {
                const t = i / steps;
                const x = x1 + (x2 - x1) * t;
                const y = y1 + (y2 - y1) * t;
                const sag = Math.sin(t * Math.PI) * 2; // slight sag

                const rx = isHorizontal ? x : x + sag;
                const ry = isHorizontal ? y + sag : y;

                // Rope strand colors (alternating for twist effect)
                const c = (Math.floor(i / 3) % 2 === 0) ? ropeColor : ropeDark;
                g.fillStyle(c, 0.85);
                g.fillRect(rx - 1.5, ry - 1.5, 3, 3);
            }
        };

        // Top rope
        drawRopeSegment(tx - bw, ty - bw / 2, tx + tw + bw, ty - bw / 2);
        // Bottom rope
        drawRopeSegment(tx - bw, ty + th + bw / 2, tx + tw + bw, ty + th + bw / 2);
        // Left rope
        drawRopeSegment(tx - bw / 2, ty - bw, tx - bw / 2, ty + th + bw);
        // Right rope
        drawRopeSegment(tx + tw + bw / 2, ty - bw, tx + tw + bw / 2, ty + th + bw);

        // Posts
        for (let px = tx; px <= tx + tw; px += postSpacing) {
            this._drawPost(g, px, ty - bw / 2, postColor);
            this._drawPost(g, px, ty + th + bw / 2, postColor);
        }
        for (let py = ty; py <= ty + th; py += postSpacing) {
            this._drawPost(g, tx - bw / 2, py, postColor);
            this._drawPost(g, tx + tw + bw / 2, py, postColor);
        }

        // Corner posts (larger)
        const corners = [
            [tx - bw / 2, ty - bw / 2], [tx + tw + bw / 2, ty - bw / 2],
            [tx - bw / 2, ty + th + bw / 2], [tx + tw + bw / 2, ty + th + bw / 2]
        ];
        for (const [cx, cy] of corners) {
            g.fillStyle(postColor, 1); g.fillCircle(cx, cy, 5);
            g.fillStyle(0xA88B5A, 0.5); g.fillCircle(cx - 1, cy - 1, 2);
        }
    }

    _drawPost(g, x, y, color) {
        g.fillStyle(color, 0.9);
        g.fillCircle(x, y, 3.5);
        g.fillStyle(0xB09060, 0.4);
        g.fillCircle(x - 0.5, y - 0.5, 1.5);
    }

    // --- HEDGE (Parc) - Haie de buis taillee ---
    _borderHedge() {
        const tx = this.tx, ty = this.ty;
        const tw = TERRAIN_WIDTH, th = TERRAIN_HEIGHT;
        const bw = BORDER_WIDTH + 2; // slightly wider
        const g = this.scene.add.graphics().setDepth(3.5);

        const hedgeBase = 0x3A6A2A;
        const hedgeLight = 0x5A8A3A;
        const hedgeDark = 0x2A5A1A;

        // Base hedge shape
        g.fillStyle(hedgeBase, 1);
        g.fillRect(tx - bw, ty - bw, tw + bw * 2, bw);
        g.fillRect(tx - bw, ty + th, tw + bw * 2, bw);
        g.fillRect(tx - bw, ty, bw, th);
        g.fillRect(tx + tw, ty, bw, th);

        // Leafy texture (random circles for bush effect)
        const drawLeaves = (rx, ry, rw, rh) => {
            for (let i = 0; i < rw * rh / 12; i++) {
                const lx = rx + this._rng() * rw;
                const ly = ry + this._rng() * rh;
                const color = this._rng() > 0.5 ? hedgeLight : hedgeDark;
                g.fillStyle(color, 0.5 + this._rng() * 0.3);
                g.fillCircle(lx, ly, 1.5 + this._rng() * 2);
            }
        };

        drawLeaves(tx - bw, ty - bw, tw + bw * 2, bw);
        drawLeaves(tx - bw, ty + th, tw + bw * 2, bw);
        drawLeaves(tx - bw, ty, bw, th);
        drawLeaves(tx + tw, ty, bw, th);

        // Top highlight (light catching top of hedge)
        g.fillStyle(hedgeLight, 0.3);
        g.fillRect(tx - bw, ty - bw, tw + bw * 2, 2);
        g.fillRect(tx - bw, ty + th, tw + bw * 2, 2);

        // Trim line (darker base)
        g.fillStyle(hedgeDark, 0.4);
        g.fillRect(tx - bw, ty - 1, tw + bw * 2, 1);
        g.fillRect(tx - bw, ty + th, tw + bw * 2, 1);
        g.fillRect(tx - 1, ty, 1, th);
        g.fillRect(tx + tw, ty, 1, th);
    }

    // --- STONE (Colline) - Muret provencal en pierres seches ---
    _borderStone() {
        const tx = this.tx, ty = this.ty;
        const tw = TERRAIN_WIDTH, th = TERRAIN_HEIGHT;
        const bw = BORDER_WIDTH + 1;
        const hasTex = this.scene.textures.exists('border_stone');

        if (hasTex) {
            const depth = 3.5;
            // TileSprite borders using loaded stone texture
            this.scene.add.tileSprite(tx - bw + (tw + bw * 2) / 2, ty - bw + bw / 2,
                tw + bw * 2, bw, 'border_stone').setDepth(depth);
            this.scene.add.tileSprite(tx - bw + (tw + bw * 2) / 2, ty + th + bw / 2,
                tw + bw * 2, bw, 'border_stone').setDepth(depth);
            this.scene.add.tileSprite(tx - bw + bw / 2, ty + th / 2,
                bw, th, 'border_stone').setDepth(depth);
            this.scene.add.tileSprite(tx + tw + bw / 2, ty + th / 2,
                bw, th, 'border_stone').setDepth(depth);
        }

        const g = this.scene.add.graphics().setDepth(3.6);

        if (!hasTex) {
            // Fallback: procedural stacked stones
            const stoneColors = [0xB0A888, 0xC4B898, 0x9A9070, 0xA8A080, 0xD0C8A8];
            const drawStoneWall = (startX, startY, length, isHorizontal) => {
                let pos = 0;
                while (pos < length) {
                    const sw = isHorizontal ? (6 + this._rng() * 8) : bw - 1;
                    const sh = isHorizontal ? bw - 1 : (6 + this._rng() * 8);
                    const sx = isHorizontal ? startX + pos : startX;
                    const sy = isHorizontal ? startY : startY + pos;
                    const color = stoneColors[Math.floor(this._rng() * stoneColors.length)];
                    g.fillStyle(color, 0.9);
                    g.fillRoundedRect(sx, sy, sw, sh, 1);
                    g.fillStyle(0x3A2E28, 0.15);
                    g.fillRect(sx + sw - 1, sy + 1, 1, sh - 1);
                    g.fillRect(sx + 1, sy + sh - 1, sw - 1, 1);
                    g.fillStyle(0xFFFFFF, 0.08);
                    g.fillRect(sx, sy, sw, 1);
                    g.fillRect(sx, sy, 1, sh);
                    pos += isHorizontal ? sw + 1 : sh + 1;
                }
            };
            drawStoneWall(tx - bw, ty - bw, tw + bw * 2, true);
            drawStoneWall(tx - bw, ty + th, tw + bw * 2, true);
            drawStoneWall(tx - bw, ty, th, false);
            drawStoneWall(tx + tw, ty, th, false);
        }

        // Mortar lines overlay (subtle, works on both textured and procedural)
        g.fillStyle(0x8A8060, 0.2);
        g.fillRect(tx - bw, ty, tw + bw * 2, 0.5);
        g.fillRect(tx - bw, ty + th, tw + bw * 2, 0.5);
    }

    // --- METAL (Docks) - Rails metalliques avec rivets ---
    _borderMetal() {
        const tx = this.tx, ty = this.ty;
        const tw = TERRAIN_WIDTH, th = TERRAIN_HEIGHT;
        const bw = BORDER_WIDTH;
        const g = this.scene.add.graphics().setDepth(3.5);

        const metalBase = 0x5A5A50;
        const metalLight = 0x808078;
        const metalDark = 0x3A3A35;

        // Main rail shape
        g.fillStyle(metalBase, 1);
        g.fillRect(tx - bw, ty - bw, tw + bw * 2, bw);
        g.fillRect(tx - bw, ty + th, tw + bw * 2, bw);
        g.fillRect(tx - bw, ty, bw, th);
        g.fillRect(tx + tw, ty, bw, th);

        // Brushed metal effect (horizontal lines)
        for (let ly = 0; ly < bw; ly += 1.5) {
            g.fillStyle(ly % 3 === 0 ? metalLight : metalDark, 0.15);
            g.fillRect(tx - bw, ty - bw + ly, tw + bw * 2, 0.8);
            g.fillRect(tx - bw, ty + th + ly, tw + bw * 2, 0.8);
        }
        for (let lx = 0; lx < bw; lx += 1.5) {
            g.fillStyle(lx % 3 === 0 ? metalLight : metalDark, 0.15);
            g.fillRect(tx - bw + lx, ty, 0.8, th);
            g.fillRect(tx + tw + lx, ty, 0.8, th);
        }

        // Edge bevel (bright top, dark bottom)
        g.fillStyle(metalLight, 0.4);
        g.fillRect(tx - bw, ty - bw, tw + bw * 2, 1.5);
        g.fillStyle(metalDark, 0.5);
        g.fillRect(tx - bw, ty - 1, tw + bw * 2, 1.5);
        g.fillRect(tx - bw, ty + th + bw - 1, tw + bw * 2, 1.5);

        // Rivets
        const rivetSpacing = 20;
        for (let rx = tx - bw / 2; rx <= tx + tw + bw / 2; rx += rivetSpacing) {
            this._drawRivet(g, rx, ty - bw / 2);
            this._drawRivet(g, rx, ty + th + bw / 2);
        }
        for (let ry = ty; ry <= ty + th; ry += rivetSpacing) {
            this._drawRivet(g, tx - bw / 2, ry);
            this._drawRivet(g, tx + tw + bw / 2, ry);
        }

        // Weld marks (subtle)
        g.lineStyle(1, metalDark, 0.2);
        g.strokeRect(tx, ty, tw, th);
    }

    _drawRivet(g, x, y) {
        g.fillStyle(0x707068, 0.9); g.fillCircle(x, y, 2.5);
        g.fillStyle(0x909088, 0.4); g.fillCircle(x - 0.5, y - 0.5, 1.2);
        g.fillStyle(0x3A3A35, 0.3); g.fillCircle(x + 0.5, y + 0.5, 1);
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
