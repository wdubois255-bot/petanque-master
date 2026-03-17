import Phaser from 'phaser';
import {
    GAME_WIDTH, GAME_HEIGHT,
    TERRAIN_WIDTH, TERRAIN_HEIGHT,
    TERRAIN_COLORS, TERRAIN_FRICTION,
    COLORS, THROW_CIRCLE_RADIUS, THROW_CIRCLE_Y_OFFSET
} from '../utils/Constants.js';
import PetanqueEngine from '../petanque/PetanqueEngine.js';
import AimingSystem from '../petanque/AimingSystem.js';
import PetanqueAI from '../petanque/PetanqueAI.js';
import ScorePanel from '../ui/ScorePanel.js';
import { generateCharacterSprite, PALETTES } from '../world/SpriteGenerator.js';
import { startCigales, stopCigales } from '../utils/SoundManager.js';

export default class PetanqueScene extends Phaser.Scene {
    constructor() {
        super('PetanqueScene');
    }

    init(data) {
        this.terrainType = data.terrain || 'terre';
        this.difficulty = data.difficulty || 'easy';
        this.format = data.format || 'tete_a_tete';
        this.opponentName = data.opponentName || 'Adversaire';
        this.returnScene = data.returnScene || null;
        this.personality = data.personality || null;
        this.playerCharacter = data.playerCharacter || null;
        this.opponentCharacter = data.opponentCharacter || null;
        this.playerCharId = this.playerCharacter?.id || data.playerCharId || 'equilibre';
        this.opponentId = this.opponentCharacter?.id || data.opponentId?.replace('char_', '')?.replace('quickplay_', '') || null;
        this.arcadeState = data.arcadeState || null;
        this.arcadeRound = data.arcadeRound || null;
        this.localMultiplayer = data.localMultiplayer || false;
        this.bouleType = data.bouleType || 'acier';
        this.cochonnetType = data.cochonnetType || 'classique';
    }

    create() {
        const terrainColor = TERRAIN_COLORS[this.terrainType];
        this.frictionMult = TERRAIN_FRICTION[this.terrainType];

        this.terrainX = (GAME_WIDTH - TERRAIN_WIDTH) / 2;
        this.terrainY = (GAME_HEIGHT - TERRAIN_HEIGHT) / 2;

        this.drawTerrain(terrainColor);
        this._createBallTextures();
        this._ensureSprites();

        // Engine
        this.engine = new PetanqueEngine(this, {
            terrainType: this.terrainType,
            frictionMult: this.frictionMult,
            format: this.format,
            terrainBounds: {
                x: this.terrainX,
                y: this.terrainY,
                w: TERRAIN_WIDTH,
                h: TERRAIN_HEIGHT
            }
        });

        this._createPlayerSprites();

        // Aiming
        const playerStats = this.playerCharacter?.stats || null;
        this.aimingSystem = new AimingSystem(this, this.engine, playerStats);

        // AI
        if (this.localMultiplayer) {
            this.ai = null;
        } else {
            this.ai = new PetanqueAI(this, this.engine, this.difficulty, this.personality, this.opponentCharacter);
        }

        // Score panel
        this.scorePanel = new ScorePanel(this, this.engine);

        // VS label
        const shadow = { offsetX: 2, offsetY: 2, color: '#1A1510', blur: 0, fill: true };
        this.add.text(
            GAME_WIDTH / 2, this.terrainY - 12,
            `VS ${this.opponentName}`,
            { fontFamily: 'monospace', fontSize: '18px', color: '#C44B3F', align: 'center', shadow }
        ).setOrigin(0.5, 1).setDepth(5);

        // Impact traces layer
        this.impactLayer = this.add.renderTexture(
            this.terrainX, this.terrainY,
            TERRAIN_WIDTH, TERRAIN_HEIGHT
        ).setOrigin(0, 0).setDepth(3).setAlpha(0.5);

        startCigales();
        this.engine.startGame();

        this.events.on('shutdown', () => stopCigales());
        this.events.on('destroy', () => stopCigales());
    }

    // === SPRITE LOADING (real spritesheets or procedural fallback) ===

    _getCharSpriteKey(charId) {
        const mapping = {
            'equilibre': 'rene_animated',
            'pointeur': 'marcel_animated',
            'tireur': 'fanny_animated',
            'stratege': 'ricardo_animated',
            'wildcard': 'thierry_animated',
            'boss': 'marius_animated'
        };
        return mapping[charId] || 'rene_animated';
    }

    _getCharPalette(charId) {
        const mapping = {
            'equilibre': PALETTES.player,
            'pointeur': PALETTES.npc_marcel,
            'tireur': PALETTES.npc_fanny,
            'stratege': PALETTES.npc_ricardo,
            'wildcard': PALETTES.npc_rival,
            'boss': PALETTES.npc_marius
        };
        return mapping[charId] || PALETTES.player;
    }

    _ensureSprites() {
        // Player sprite — always recreate to match selected character
        if (this.textures.exists('petanque_player')) {
            this.textures.remove('petanque_player');
        }
        const playerKey = this._getCharSpriteKey(this.playerCharId);
        if (this.textures.exists(playerKey)) {
            this.textures.addSpriteSheet('petanque_player',
                this.textures.get(playerKey).getSourceImage(),
                { frameWidth: 32, frameHeight: 32 }
            );
        } else {
            generateCharacterSprite(this, 'petanque_player', this._getCharPalette(this.playerCharId));
        }

        // Opponent sprite — always recreate for different opponents
        if (this.textures.exists('petanque_opponent')) {
            this.textures.remove('petanque_opponent');
        }
        const opponentId = this.opponentId || 'equilibre';
        const opponentKey = this._getCharSpriteKey(opponentId);
        if (this.textures.exists(opponentKey)) {
            this.textures.addSpriteSheet('petanque_opponent',
                this.textures.get(opponentKey).getSourceImage(),
                { frameWidth: 32, frameHeight: 32 }
            );
        } else {
            generateCharacterSprite(this, 'petanque_opponent', this._getCharPalette(opponentId));
        }
    }

    // === PLAYER SPRITES & ANIMATIONS ===

    _createPlayerSprites() {
        // Player: in throw circle
        const playerHomeX = this.throwCircleX;
        const playerHomeY = this.throwCircleY + 16;
        this.playerSprite = this.add.sprite(playerHomeX, playerHomeY, 'petanque_player', 12)
            .setOrigin(0.5, 1).setDepth(20).setScale(1);
        this._playerHomeX = playerHomeX;
        this._playerHomeY = playerHomeY;

        // Opponent: right edge of terrain, watching
        const opponentCochoX = this.terrainX + TERRAIN_WIDTH - 20;
        const opponentCochoY = this.terrainY + 120;
        this.opponentSprite = this.add.sprite(opponentCochoX, opponentCochoY, 'petanque_opponent', 0)
            .setOrigin(0.5, 1).setDepth(20).setScale(1);
        this._opponentCochoX = opponentCochoX;
        this._opponentCochoY = opponentCochoY;
        this._opponentCircleX = this.throwCircleX;
        this._opponentCircleY = this.throwCircleY + 16;

        // Turn arrows
        this.playerTurnArrow = this.add.text(playerHomeX, playerHomeY - 56, '\u25bc', {
            fontFamily: 'monospace', fontSize: '16px', color: '#A8B5C2'
        }).setOrigin(0.5).setDepth(21).setVisible(false);

        this.opponentTurnArrow = this.add.text(opponentCochoX, opponentCochoY - 40, '\u25bc', {
            fontFamily: 'monospace', fontSize: '16px', color: '#C44B3F'
        }).setOrigin(0.5).setDepth(21).setVisible(false);

        this._playerArrowTween = this.tweens.add({
            targets: this.playerTurnArrow,
            y: playerHomeY - 48, duration: 400, yoyo: true, repeat: -1, paused: true
        });
        this._opponentArrowTween = this.tweens.add({
            targets: this.opponentTurnArrow,
            y: opponentCochoY - 32, duration: 400, yoyo: true, repeat: -1, paused: true
        });

        // Hook engine events
        const existingTurnChange = this.engine.onTurnChange;
        this.engine.onTurnChange = (team) => {
            if (existingTurnChange) existingTurnChange(team);
            this._updateTurnIndicator(team);
            this._animateToCircle(team);
        };

        const existingOnThrow = this.engine.onThrow;
        this.engine.onThrow = (team) => {
            if (existingOnThrow) existingOnThrow(team);
            this._animateCharThrow(team);
        };

        const existingAfterStop = this.engine.onAfterStop;
        this.engine.onAfterStop = (lastTeam) => {
            if (existingAfterStop) existingAfterStop(lastTeam);
            this._animateReaction(lastTeam);
        };

        this._updateTurnIndicator('player');
    }

    _updateOpponentCochoPos() {
        if (this.engine.cochonnet && this.engine.cochonnet.isAlive) {
            this._opponentCochoX = this.terrainX + TERRAIN_WIDTH + 16;
            this._opponentCochoY = this.engine.cochonnet.y + 10;
        }
    }

    _animateToCircle(team) {
        this._updateOpponentCochoPos();

        if (team === 'opponent') {
            this.tweens.add({
                targets: this.opponentSprite,
                scaleY: 1.0,
                x: this._opponentCircleX, y: this._opponentCircleY,
                duration: 500, ease: 'Sine.easeInOut',
                onUpdate: () => {
                    this.opponentSprite.setFrame(Math.floor(Date.now() / 150) % 4);
                },
                onComplete: () => this.opponentSprite.setFrame(12)
            });
            this.tweens.add({
                targets: this.opponentTurnArrow,
                x: this._opponentCircleX, y: this._opponentCircleY - 56,
                duration: 500
            });
            this.tweens.add({
                targets: this.playerSprite,
                x: this.terrainX - 16, y: this._opponentCochoY,
                duration: 400, ease: 'Sine.easeInOut',
                onComplete: () => this.playerSprite.setFrame(0)
            });
        } else {
            this.tweens.add({
                targets: this.playerSprite,
                x: this._playerHomeX, y: this._playerHomeY,
                duration: 400, ease: 'Sine.easeInOut',
                onComplete: () => this.playerSprite.setFrame(12)
            });
            this.tweens.add({
                targets: this.opponentSprite,
                x: this._opponentCochoX, y: this._opponentCochoY,
                scaleY: 1.0, duration: 500, ease: 'Sine.easeInOut',
                onUpdate: () => {
                    this.opponentSprite.setFrame(Math.floor(Date.now() / 150) % 4);
                },
                onComplete: () => this.opponentSprite.setFrame(0)
            });
            this.tweens.add({
                targets: this.opponentTurnArrow,
                x: this._opponentCochoX, y: this._opponentCochoY - 40,
                duration: 500
            });
        }
    }

    _animateCharThrow(team) {
        const sprite = team === 'player' ? this.playerSprite : this.opponentSprite;
        const baseY = sprite.y;
        const baseX = sprite.x;

        // Frames: 0-3=south, 4-7=west, 8-11=east, 12-15=north
        // Use north-facing (12-15) as "looking at terrain" during throw
        const profileFrames = team === 'player' ? [12, 13, 14, 15] : [0, 1, 2, 3];

        // Phase 1: Wind-up — turn to profile, crouch down
        sprite.setFrame(profileFrames[0]);
        this.tweens.chain({
            targets: sprite,
            tweens: [
                // Crouch: compress + shift weight
                {
                    scaleX: 0.85, scaleY: 1.15, y: baseY + 3,
                    duration: 250, ease: 'Sine.easeOut',
                    onStart: () => {
                        // Cycle through walk frames for weight shift
                        sprite.setFrame(profileFrames[1]);
                    }
                },
                // Arm back: lean back slightly
                {
                    scaleX: 0.9, scaleY: 1.1, x: baseX - (team === 'player' ? 3 : -3),
                    duration: 150, ease: 'Quad.easeIn',
                    onStart: () => sprite.setFrame(profileFrames[2])
                },
                // Phase 2: Release! — explosive extension + flash
                {
                    scaleX: 1.2, scaleY: 0.85, y: baseY - 10,
                    x: baseX + (team === 'player' ? 4 : -4),
                    duration: 100, ease: 'Quad.easeIn',
                    onStart: () => {
                        sprite.setFrame(profileFrames[3]);
                        sprite.setTint(0xFFFFFF);
                        this.time.delayedCall(60, () => sprite.clearTint());
                    }
                },
                // Phase 3: Follow-through — body extends forward
                {
                    scaleX: 1.1, scaleY: 0.95, y: baseY - 4,
                    duration: 120, ease: 'Sine.easeOut',
                    onStart: () => sprite.setFrame(profileFrames[0])
                },
                // Phase 4: Recovery — bounce back to idle
                {
                    scaleX: 1.0, scaleY: 1.0, y: baseY, x: baseX,
                    duration: 300, ease: 'Bounce.easeOut',
                    onComplete: () => {
                        sprite.setFrame(team === 'player' ? 12 : 0);
                    }
                }
            ]
        });
    }

    _animateReaction(lastTeam) {
        if (!this.engine.cochonnet || !this.engine.cochonnet.isAlive) return;
        const lastBall = this.engine.lastThrownBall;
        if (!lastBall || !lastBall.isAlive) return;
        const dist = lastBall.distanceTo(this.engine.cochonnet);

        const throwerSprite = lastTeam === 'player' ? this.playerSprite : this.opponentSprite;
        const watcherSprite = lastTeam === 'player' ? this.opponentSprite : this.playerSprite;
        // Frames: 0-3=south, 4-7=west, 8-11=east, 12-15=north
        const throwerSouthFrames = lastTeam === 'player' ? [12, 13, 14, 15] : [0, 1, 2, 3];

        if (dist < 30) {
            // Great shot — thrower celebrates with jump + fist pump
            this.tweens.chain({
                targets: throwerSprite,
                tweens: [
                    {
                        y: throwerSprite.y - 14, scaleX: 1.1, scaleY: 0.9,
                        duration: 200, ease: 'Quad.easeOut',
                        onStart: () => throwerSprite.setFrame(throwerSouthFrames[2])
                    },
                    {
                        y: throwerSprite.y, scaleX: 1.0, scaleY: 1.0,
                        duration: 250, ease: 'Bounce.easeOut',
                        onStart: () => throwerSprite.setFrame(throwerSouthFrames[0])
                    }
                ]
            });
            // Watcher shakes head in dismay
            this.tweens.chain({
                targets: watcherSprite,
                tweens: [
                    { angle: -6, duration: 100 },
                    { angle: 6, duration: 100 },
                    { angle: -4, duration: 80 },
                    { angle: 0, duration: 80 }
                ]
            });
        } else if (dist < 60) {
            // Decent shot — small nod
            this.tweens.add({
                targets: throwerSprite,
                y: throwerSprite.y - 4,
                duration: 150, ease: 'Sine.easeOut', yoyo: true
            });
        } else if (dist > 80) {
            // Bad shot — thrower frustrated head shake + slump
            this.tweens.chain({
                targets: throwerSprite,
                tweens: [
                    { scaleY: 0.95, duration: 100 },
                    { angle: -5, duration: 80 },
                    { angle: 5, duration: 80 },
                    { angle: 0, scaleY: 1.0, duration: 120 }
                ]
            });
            // Watcher smiles (subtle bounce)
            this.tweens.add({
                targets: watcherSprite,
                y: watcherSprite.y - 3,
                duration: 200, ease: 'Sine.easeOut', yoyo: true
            });
        }
    }

    _updateTurnIndicator(team) {
        if (team === 'player') {
            this.playerTurnArrow.setVisible(true);
            this._playerArrowTween.resume();
            this.opponentTurnArrow.setVisible(false);
            this._opponentArrowTween.pause();
        } else {
            this.opponentTurnArrow.setVisible(true);
            this._opponentArrowTween.resume();
            this.playerTurnArrow.setVisible(false);
            this._playerArrowTween.pause();
        }
    }

    // === BALL TEXTURES (rolling spritesheets — 6 frames, highlight rotates) ===

    _createBallTextures() {
        const ROLL_FRAMES = 6;
        const FRAME_SIZE = 32;
        const defs = [
            { key: 'ball_acier',     base: '#A8B5C2', hi: '#E0E8F0', shadow: '#606870' },
            { key: 'ball_bronze',    base: '#CD7F32', hi: '#E8A050', shadow: '#8B5A20' },
            { key: 'ball_chrome',    base: '#DCDCDC', hi: '#FFFFFF', shadow: '#909090' },
            { key: 'ball_noire',     base: '#4A4A5A', hi: '#7A7A8A', shadow: '#2A2A35' },
            { key: 'ball_rouge',     base: '#CC3333', hi: '#FF6060', shadow: '#882020' },
            { key: 'ball_opponent',  base: '#C44B3F', hi: '#E87060', shadow: '#8A2A20' },
            { key: 'ball_cochonnet', base: '#D4A574', hi: '#F0D0A0', shadow: '#8B6B4A' },
            { key: 'ball_cochonnet_bleu', base: '#3355CC', hi: '#6688FF', shadow: '#1A2A6A' },
            { key: 'ball_cochonnet_vert', base: '#33AA44', hi: '#66DD77', shadow: '#1A6620' }
        ];

        for (const { key, base, hi, shadow } of defs) {
            // Remove static PNG if loaded, replace with animated spritesheet
            if (this.textures.exists(key)) this.textures.remove(key);

            const canvas = document.createElement('canvas');
            canvas.width = FRAME_SIZE * ROLL_FRAMES;
            canvas.height = FRAME_SIZE;
            const ctx = canvas.getContext('2d');

            for (let f = 0; f < ROLL_FRAMES; f++) {
                const cx = f * FRAME_SIZE + 16;
                const cy = 16;
                const r = 14;

                // Highlight rotates around the ball center
                const angle = (f / ROLL_FRAMES) * Math.PI * 2;
                const hiX = cx + Math.cos(angle) * r * 0.35;
                const hiY = cy + Math.sin(angle) * r * 0.35;

                // Gradient follows highlight position
                const grad = ctx.createRadialGradient(hiX, hiY, 1, cx, cy, r);
                grad.addColorStop(0, hi);
                grad.addColorStop(0.4, base);
                grad.addColorStop(1, shadow);
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(cx, cy, r, 0, Math.PI * 2);
                ctx.fill();

                // Specular highlight dot (follows angle)
                const specX = cx + Math.cos(angle) * r * 0.45;
                const specY = cy + Math.sin(angle) * r * 0.45;
                ctx.fillStyle = 'rgba(255,255,255,0.7)';
                ctx.beginPath();
                ctx.arc(specX, specY, 2.5, 0, Math.PI * 2);
                ctx.fill();

                // Secondary subtle highlight (opposite side, dimmer)
                const sec = angle + Math.PI;
                ctx.fillStyle = 'rgba(255,255,255,0.15)';
                ctx.beginPath();
                ctx.arc(cx + Math.cos(sec) * r * 0.3, cy + Math.sin(sec) * r * 0.3, 1.5, 0, Math.PI * 2);
                ctx.fill();
            }

            this.textures.addSpriteSheet(key, canvas, {
                frameWidth: FRAME_SIZE,
                frameHeight: FRAME_SIZE
            });
        }
    }

    // === TERRAIN ===

    drawTerrain(_colors) {
        const bg = this.add.graphics().setDepth(0);

        // === SKY with gradient ===
        if (this.textures.exists('sky_gradient')) this.textures.remove('sky_gradient');
        const skyTex = this.textures.createCanvas('sky_gradient', GAME_WIDTH, GAME_HEIGHT);
        const skyCtx = skyTex.getContext();
        const skyGrad = skyCtx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
        skyGrad.addColorStop(0, '#6BB8E0');
        skyGrad.addColorStop(0.4, '#A8D8EA');
        skyGrad.addColorStop(0.7, '#D4E8D0');
        skyGrad.addColorStop(1, '#C4B090');
        skyCtx.fillStyle = skyGrad;
        skyCtx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Soft clouds
        skyCtx.fillStyle = 'rgba(255,255,255,0.25)';
        skyCtx.beginPath(); skyCtx.arc(150, 40, 35, 0, Math.PI * 2); skyCtx.fill();
        skyCtx.beginPath(); skyCtx.arc(180, 35, 28, 0, Math.PI * 2); skyCtx.fill();
        skyCtx.beginPath(); skyCtx.arc(120, 45, 22, 0, Math.PI * 2); skyCtx.fill();
        skyCtx.fillStyle = 'rgba(255,255,255,0.18)';
        skyCtx.beginPath(); skyCtx.arc(550, 55, 40, 0, Math.PI * 2); skyCtx.fill();
        skyCtx.beginPath(); skyCtx.arc(590, 48, 30, 0, Math.PI * 2); skyCtx.fill();
        skyCtx.beginPath(); skyCtx.arc(520, 58, 25, 0, Math.PI * 2); skyCtx.fill();
        skyCtx.fillStyle = 'rgba(255,255,255,0.15)';
        skyCtx.beginPath(); skyCtx.arc(380, 25, 20, 0, Math.PI * 2); skyCtx.fill();
        skyCtx.beginPath(); skyCtx.arc(400, 20, 15, 0, Math.PI * 2); skyCtx.fill();

        skyTex.refresh();
        this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'sky_gradient').setDepth(0);

        // === GROUND (below horizon) ===
        bg.fillStyle(0x9B8D6A, 1);
        bg.fillRect(0, GAME_HEIGHT * 0.55, GAME_WIDTH, GAME_HEIGHT * 0.45);
        // Ground path texture
        bg.fillStyle(0xA89870, 0.4);
        bg.fillRect(0, GAME_HEIGHT * 0.58, GAME_WIDTH, GAME_HEIGHT * 0.05);
        bg.setDepth(0);

        // === BACKGROUND BUILDINGS (horizon line) ===
        const horizon = this.add.graphics().setDepth(0.5);
        const hy = GAME_HEIGHT * 0.5;
        // Distant provençal rooftops
        horizon.fillStyle(0xD4A574, 0.6);
        horizon.fillRect(80, hy, 60, 30);
        horizon.fillStyle(0xC4854A, 0.5);
        horizon.fillRect(80, hy - 10, 60, 12); // terracotta roof
        horizon.fillStyle(0xD4A574, 0.5);
        horizon.fillRect(200, hy + 5, 45, 25);
        horizon.fillStyle(0xC4854A, 0.4);
        horizon.fillRect(200, hy - 3, 45, 10);
        // Church tower
        horizon.fillStyle(0xD4C4A0, 0.5);
        horizon.fillRect(680, hy - 20, 20, 50);
        horizon.fillStyle(0xC4854A, 0.4);
        horizon.fillRect(675, hy - 25, 30, 8);

        // === TREES ===
        const decor = this.add.graphics().setDepth(1);
        const tx = this.terrainX;
        const tw = TERRAIN_WIDTH;

        // Left platane (big)
        decor.fillStyle(0x7B5B3A, 1);
        decor.fillRect(tx - 80, 70, 18, 90);
        decor.fillStyle(0x5A8A3A, 1);
        decor.fillCircle(tx - 71, 55, 48);
        decor.fillStyle(0x4A7A2A, 0.6);
        decor.fillCircle(tx - 60, 65, 35);
        decor.fillStyle(0x6B9E4E, 0.4);
        decor.fillCircle(tx - 82, 48, 28);

        // Right platane
        decor.fillStyle(0x7B5B3A, 1);
        decor.fillRect(tx + tw + 62, 85, 16, 80);
        decor.fillStyle(0x5A8A3A, 1);
        decor.fillCircle(tx + tw + 70, 72, 42);
        decor.fillStyle(0x4A7A2A, 0.6);
        decor.fillCircle(tx + tw + 80, 82, 30);

        // === BENCH (left) ===
        decor.fillStyle(0x8B6B4A, 1);
        decor.fillRect(tx - 70, 300, 50, 5);
        decor.fillStyle(0x7B5B3A, 1);
        decor.fillRect(tx - 68, 305, 4, 12);
        decor.fillRect(tx - 26, 305, 4, 12);
        decor.fillStyle(0x9B7B5A, 0.8);
        decor.fillRect(tx - 70, 295, 50, 3);

        // === STONE WALL (right) ===
        decor.fillStyle(0xD4C4A0, 1);
        decor.fillRect(tx + tw + 20, 150, 28, 200);
        decor.fillStyle(0xC0B090, 0.4);
        for (let my = 150; my < 350; my += 16) {
            decor.fillRect(tx + tw + 20, my, 28, 1);
            if (my % 32 === 0) {
                decor.fillRect(tx + tw + 34, my, 1, 16);
            }
        }

        // === SMALL DETAILS ===
        // Flower pot near wall
        decor.fillStyle(0xA05A2A, 1);
        decor.fillRect(tx + tw + 25, 355, 14, 12);
        decor.fillStyle(0xCC4444, 0.8);
        decor.fillCircle(tx + tw + 32, 352, 6);
        decor.fillStyle(0xDD6666, 0.5);
        decor.fillCircle(tx + tw + 28, 349, 4);

        // Pétanque scoring board (left side)
        decor.fillStyle(0x2A4A2A, 1);
        decor.fillRect(tx - 30, 180, 20, 30);
        decor.fillStyle(0xFFFFFF, 0.7);
        decor.fillRect(tx - 27, 185, 6, 8);
        decor.fillRect(tx - 18, 185, 6, 8);
        decor.fillStyle(0x6B5038, 1);
        decor.fillRect(tx - 24, 210, 8, 20);

        // === TERRAIN SURFACE (rich canvas texture) ===
        const terrainTexKey = `terrain_gravier_${this.terrainType}`;
        if (this.textures.exists(terrainTexKey)) this.textures.remove(terrainTexKey);
        const terrainTex = this.textures.createCanvas(terrainTexKey, TERRAIN_WIDTH, TERRAIN_HEIGHT);
        const tCtx = terrainTex.getContext();

        const baseColors = {
            terre:  '#C4854A', herbe: '#6B8E4E', sable: '#E8D5B7', dalles: '#9E9E8E'
        };
        const gravelColors = {
            terre:  ['#B07840', '#D49560', '#A87040', '#C4954A', '#B88850'],
            herbe:  ['#5E8A44', '#7BA65E', '#4A7A3A', '#6B9E4E', '#5A9040'],
            sable:  ['#D4C0A0', '#F0E0C8', '#C4B090', '#E8D0B0', '#DDD4B8'],
            dalles: ['#8E8E7E', '#B0A090', '#808070', '#A09888', '#989080']
        };

        // Base fill with subtle vertical gradient (lighter at top = distance)
        const baseCol = baseColors[this.terrainType] || baseColors.terre;
        const terrGrad = tCtx.createLinearGradient(0, 0, 0, TERRAIN_HEIGHT);
        terrGrad.addColorStop(0, baseCol);
        terrGrad.addColorStop(0.5, baseCol);
        terrGrad.addColorStop(1, this._darkenHex(baseCol, 20));
        tCtx.fillStyle = terrGrad;
        tCtx.fillRect(0, 0, TERRAIN_WIDTH, TERRAIN_HEIGHT);

        // Fine gravel texture (lots of tiny particles)
        const gravel = gravelColors[this.terrainType] || gravelColors.terre;
        for (let i = 0; i < 500; i++) {
            tCtx.fillStyle = gravel[Math.floor(Math.random() * gravel.length)];
            const size = 1 + Math.random() * 1.5;
            tCtx.fillRect(Math.random() * TERRAIN_WIDTH, Math.random() * TERRAIN_HEIGHT, size, size);
        }

        // Larger pebbles/cailloux (scattered, subtle)
        for (let i = 0; i < 15; i++) {
            const px = 20 + Math.random() * (TERRAIN_WIDTH - 40);
            const py = 20 + Math.random() * (TERRAIN_HEIGHT - 40);
            const pr = 2 + Math.random() * 3;
            tCtx.fillStyle = gravel[Math.floor(Math.random() * gravel.length)];
            tCtx.globalAlpha = 0.5 + Math.random() * 0.3;
            tCtx.beginPath();
            tCtx.ellipse(px, py, pr, pr * 0.7, Math.random() * Math.PI, 0, Math.PI * 2);
            tCtx.fill();
            // Pebble highlight
            tCtx.fillStyle = 'rgba(255,255,255,0.2)';
            tCtx.beginPath();
            tCtx.arc(px - 1, py - 1, pr * 0.4, 0, Math.PI * 2);
            tCtx.fill();
        }
        tCtx.globalAlpha = 1;

        // Terrain wear marks (subtle drag lines from previous games)
        tCtx.strokeStyle = 'rgba(0,0,0,0.06)';
        tCtx.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
            const sx = 30 + Math.random() * (TERRAIN_WIDTH - 60);
            const sy = 40 + Math.random() * (TERRAIN_HEIGHT - 80);
            tCtx.beginPath();
            tCtx.moveTo(sx, sy);
            tCtx.lineTo(sx + (Math.random() - 0.5) * 30, sy + 10 + Math.random() * 20);
            tCtx.stroke();
        }

        // Edge darkening (vignette effect for depth)
        const edgeGrad = tCtx.createRadialGradient(
            TERRAIN_WIDTH / 2, TERRAIN_HEIGHT / 2, TERRAIN_HEIGHT * 0.35,
            TERRAIN_WIDTH / 2, TERRAIN_HEIGHT / 2, TERRAIN_HEIGHT * 0.55
        );
        edgeGrad.addColorStop(0, 'rgba(0,0,0,0)');
        edgeGrad.addColorStop(1, 'rgba(0,0,0,0.08)');
        tCtx.fillStyle = edgeGrad;
        tCtx.fillRect(0, 0, TERRAIN_WIDTH, TERRAIN_HEIGHT);

        terrainTex.refresh();

        // Drop shadow under terrain
        const terrainG = this.add.graphics().setDepth(1);
        terrainG.fillStyle(0x000000, 0.18);
        terrainG.fillRect(this.terrainX + 5, this.terrainY + 5, TERRAIN_WIDTH, TERRAIN_HEIGHT);
        terrainG.fillStyle(0x000000, 0.08);
        terrainG.fillRect(this.terrainX + 3, this.terrainY + 3, TERRAIN_WIDTH + 2, TERRAIN_HEIGHT + 2);

        this.add.image(this.terrainX + TERRAIN_WIDTH / 2, this.terrainY + TERRAIN_HEIGHT / 2, terrainTexKey).setDepth(2);

        // === TERRAIN DECORATION SPRITES (PixelLab generated) ===
        this._placeTerrainDecor();

        // === WOODEN BORDERS (tiled plank sprite) ===
        this._drawTerrainBorders();

        // === THROW CIRCLE ===
        this.throwCircleX = GAME_WIDTH / 2;
        this.throwCircleY = this.terrainY + TERRAIN_HEIGHT - THROW_CIRCLE_Y_OFFSET;
        const circleG = this.add.graphics().setDepth(4);
        circleG.lineStyle(3, 0xFFFFFF, 0.15);
        circleG.strokeCircle(this.throwCircleX, this.throwCircleY, THROW_CIRCLE_RADIUS + 2);
        circleG.lineStyle(2, COLORS.BLANC, 0.5);
        circleG.strokeCircle(this.throwCircleX, this.throwCircleY, THROW_CIRCLE_RADIUS);
    }

    _placeTerrainDecor() {
        const tx = this.terrainX;
        const ty = this.terrainY;
        const margin = 12;

        // Seeded random for consistent terrain per match (but varied between matches)
        const seed = (this.terrainType.charCodeAt(0) * 137 + Date.now() % 1000) | 0;
        const rng = (i) => {
            const x = Math.sin(seed + i * 9301 + 49297) * 233280;
            return x - Math.floor(x);
        };

        // Scatter small pebbles/cailloux on terrain
        const decorItems = [
            { key: 'terrain_caillou_1', count: 3, scale: 0.4, alpha: 0.6 },
            { key: 'terrain_caillou_2', count: 4, scale: 0.35, alpha: 0.55 },
        ];

        // Add terrain-specific decor
        if (this.terrainType === 'terre' || this.terrainType === 'herbe') {
            decorItems.push({ key: 'terrain_herbe_touffe', count: 2, scale: 0.45, alpha: 0.5 });
        }
        if (this.terrainType === 'terre') {
            decorItems.push({ key: 'terrain_fissure', count: 1, scale: 0.5, alpha: 0.35 });
            decorItems.push({ key: 'terrain_racine', count: 1, scale: 0.4, alpha: 0.45 });
        }

        let rngIdx = 0;
        for (const item of decorItems) {
            if (!this.textures.exists(item.key)) continue;
            for (let i = 0; i < item.count; i++) {
                const px = tx + margin + rng(rngIdx++) * (TERRAIN_WIDTH - margin * 2);
                const py = ty + margin + rng(rngIdx++) * (TERRAIN_HEIGHT - margin * 2);
                const angle = rng(rngIdx++) * 360;
                this.add.image(px, py, item.key)
                    .setScale(item.scale)
                    .setAlpha(item.alpha)
                    .setAngle(angle)
                    .setDepth(2.5);
            }
        }

        // Scatter some outside the terrain too (around edges for realism)
        const outsideItems = ['terrain_caillou_1', 'terrain_caillou_2', 'terrain_herbe_touffe'];
        for (let i = 0; i < 6; i++) {
            const key = outsideItems[i % outsideItems.length];
            if (!this.textures.exists(key)) continue;
            // Random position near terrain edges but outside
            const side = Math.floor(rng(rngIdx++) * 4);
            let ox, oy;
            if (side === 0) { ox = tx - 15 - rng(rngIdx++) * 40; oy = ty + rng(rngIdx++) * TERRAIN_HEIGHT; }
            else if (side === 1) { ox = tx + TERRAIN_WIDTH + 15 + rng(rngIdx++) * 40; oy = ty + rng(rngIdx++) * TERRAIN_HEIGHT; }
            else if (side === 2) { ox = tx + rng(rngIdx++) * TERRAIN_WIDTH; oy = ty - 15 - rng(rngIdx++) * 30; }
            else { ox = tx + rng(rngIdx++) * TERRAIN_WIDTH; oy = ty + TERRAIN_HEIGHT + 15 + rng(rngIdx++) * 30; }
            this.add.image(ox, oy, key)
                .setScale(0.35 + rng(rngIdx++) * 0.2)
                .setAlpha(0.4 + rng(rngIdx++) * 0.2)
                .setAngle(rng(rngIdx++) * 360)
                .setDepth(1.5);
        }
    }

    _drawTerrainBorders() {
        const tx = this.terrainX;
        const ty = this.terrainY;
        const bw = 8; // border width

        if (this.textures.exists('terrain_planche_bord')) {
            // Tile the plank sprite along all 4 borders
            const plankH = 8; // display height of horizontal planks
            const plankW = 64; // original sprite width

            // Top border (horizontal planks)
            for (let px = tx - bw; px < tx + TERRAIN_WIDTH + bw; px += plankW * 0.12) {
                this.add.image(px, ty - bw / 2, 'terrain_planche_bord')
                    .setScale(0.12, plankH / 64)
                    .setOrigin(0, 0.5)
                    .setDepth(3);
            }
            // Bottom border
            for (let px = tx - bw; px < tx + TERRAIN_WIDTH + bw; px += plankW * 0.12) {
                this.add.image(px, ty + TERRAIN_HEIGHT + bw / 2, 'terrain_planche_bord')
                    .setScale(0.12, plankH / 64)
                    .setOrigin(0, 0.5)
                    .setDepth(3);
            }
            // Left border (rotated planks)
            for (let py = ty; py < ty + TERRAIN_HEIGHT; py += plankW * 0.12) {
                this.add.image(tx - bw / 2, py, 'terrain_planche_bord')
                    .setScale(0.12, plankH / 64)
                    .setAngle(90)
                    .setOrigin(0, 0.5)
                    .setDepth(3);
            }
            // Right border
            for (let py = ty; py < ty + TERRAIN_HEIGHT; py += plankW * 0.12) {
                this.add.image(tx + TERRAIN_WIDTH + bw / 2, py, 'terrain_planche_bord')
                    .setScale(0.12, plankH / 64)
                    .setAngle(90)
                    .setOrigin(0, 0.5)
                    .setDepth(3);
            }
        }

        // Graphics overlay for border structure (shadow + highlight)
        const bord = this.add.graphics().setDepth(3.5);
        // Outer shadow
        bord.fillStyle(0x3A2E28, 0.4);
        bord.fillRect(tx - bw - 1, ty - bw - 1, TERRAIN_WIDTH + bw * 2 + 2, bw + 1);
        bord.fillRect(tx - bw - 1, ty + TERRAIN_HEIGHT, TERRAIN_WIDTH + bw * 2 + 2, bw + 1);
        bord.fillRect(tx - bw - 1, ty, bw + 1, TERRAIN_HEIGHT);
        bord.fillRect(tx + TERRAIN_WIDTH, ty, bw + 1, TERRAIN_HEIGHT);

        // Inner edge highlight (catch light on inner border edge)
        bord.lineStyle(1, 0xD4A574, 0.3);
        bord.strokeRect(tx, ty, TERRAIN_WIDTH, TERRAIN_HEIGHT);

        // Corner pegs (metal)
        bord.fillStyle(0x808080, 0.7);
        bord.fillCircle(tx, ty, 3);
        bord.fillCircle(tx + TERRAIN_WIDTH, ty, 3);
        bord.fillCircle(tx, ty + TERRAIN_HEIGHT, 3);
        bord.fillCircle(tx + TERRAIN_WIDTH, ty + TERRAIN_HEIGHT, 3);
        // Peg highlights
        bord.fillStyle(0xC0C0C0, 0.5);
        bord.fillCircle(tx - 1, ty - 1, 1);
        bord.fillCircle(tx + TERRAIN_WIDTH - 1, ty - 1, 1);
        bord.fillCircle(tx - 1, ty + TERRAIN_HEIGHT - 1, 1);
        bord.fillCircle(tx + TERRAIN_WIDTH - 1, ty + TERRAIN_HEIGHT - 1, 1);
    }

    _darkenHex(hex, amount = 30) {
        const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - amount);
        const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - amount);
        const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - amount);
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    update(time, delta) {
        if (this.engine) this.engine.update(delta);
        if (this.aimingSystem) this.aimingSystem.update();
        if (this.scorePanel) this.scorePanel.update();
    }
}
