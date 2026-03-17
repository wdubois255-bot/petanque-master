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
import TerrainRenderer from '../petanque/TerrainRenderer.js';
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
        // Load full terrain data - support both terrain IDs and surface types
        const terrainsJson = this.cache.json.get('terrains');
        let terrainData = terrainsJson?.stages?.find(s => s.id === this.terrainType);
        if (!terrainData) {
            const surfaceToTerrain = { terre: 'village', herbe: 'parc', sable: 'plage', dalles: 'docks' };
            const terrainId = surfaceToTerrain[this.terrainType] || 'village';
            terrainData = terrainsJson?.stages?.find(s => s.id === terrainId) || null;
        }
        this.terrainFullData = terrainData;
        // Use surface type for friction lookup
        const surfaceType = terrainData?.surface || this.terrainType;
        this.frictionMult = TERRAIN_FRICTION[surfaceType] || 1.0;

        this.terrainX = (GAME_WIDTH - TERRAIN_WIDTH) / 2;
        this.terrainY = (GAME_HEIGHT - TERRAIN_HEIGHT) / 2;

        // Render terrain with TerrainRenderer (textures, borders, decor, dead lines)
        this.terrainRenderer = new TerrainRenderer(
            this, surfaceType, this.terrainFullData, this.terrainX, this.terrainY
        );
        this.terrainRenderer.render();

        // Throw circle (draw on top of terrain)
        this.throwCircleX = GAME_WIDTH / 2;
        this.throwCircleY = this.terrainY + TERRAIN_HEIGHT - THROW_CIRCLE_Y_OFFSET;
        const circleG = this.add.graphics().setDepth(4);
        // Outer glow
        circleG.lineStyle(4, COLORS.OCRE, 0.2);
        circleG.strokeCircle(this.throwCircleX, this.throwCircleY, THROW_CIRCLE_RADIUS + 3);
        // Main circle
        circleG.lineStyle(2, COLORS.BLANC, 0.6);
        circleG.strokeCircle(this.throwCircleX, this.throwCircleY, THROW_CIRCLE_RADIUS);
        // Inner dot
        circleG.fillStyle(COLORS.BLANC, 0.3);
        circleG.fillCircle(this.throwCircleX, this.throwCircleY, 2);

        this._createBallTextures();
        this._ensureSprites();

        // Engine
        this.engine = new PetanqueEngine(this, {
            terrainType: surfaceType,
            frictionMult: this.frictionMult,
            format: this.format,
            terrainData: this.terrainFullData,
            terrainBounds: {
                x: this.terrainX,
                y: this.terrainY,
                w: TERRAIN_WIDTH,
                h: TERRAIN_HEIGHT
            }
        });

        // HORS JEU feedback when a ball goes out of bounds
        this.engine.onBallDead = (x, y) => {
            if (this.terrainRenderer) this.terrainRenderer.showHorsJeu(x, y);
        };

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
        // Character sprite scale: 2x for better visibility on the petanque terrain
        const CHAR_SCALE = 2;

        // Player: in throw circle
        const playerHomeX = this.throwCircleX;
        const playerHomeY = this.throwCircleY + 20;
        this.playerSprite = this.add.sprite(playerHomeX, playerHomeY, 'petanque_player', 12)
            .setOrigin(0.5, 1).setDepth(20).setScale(CHAR_SCALE);
        this._playerHomeX = playerHomeX;
        this._playerHomeY = playerHomeY;
        this._charScale = CHAR_SCALE;

        // Opponent: right edge of terrain, watching
        const opponentCochoX = this.terrainX + TERRAIN_WIDTH - 24;
        const opponentCochoY = this.terrainY + 120;
        this.opponentSprite = this.add.sprite(opponentCochoX, opponentCochoY, 'petanque_opponent', 0)
            .setOrigin(0.5, 1).setDepth(20).setScale(CHAR_SCALE);
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
                scaleY: this._charScale || 1,
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
                scaleY: this._charScale || 1, duration: 500, ease: 'Sine.easeInOut',
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
        const s = this._charScale || 1; // base scale

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
                    scaleX: s * 0.85, scaleY: s * 1.15, y: baseY + 4,
                    duration: 250, ease: 'Sine.easeOut',
                    onStart: () => sprite.setFrame(profileFrames[1])
                },
                // Arm back: lean back slightly
                {
                    scaleX: s * 0.9, scaleY: s * 1.1, x: baseX - (team === 'player' ? 4 : -4),
                    duration: 150, ease: 'Quad.easeIn',
                    onStart: () => sprite.setFrame(profileFrames[2])
                },
                // Phase 2: Release! — explosive extension + flash
                {
                    scaleX: s * 1.2, scaleY: s * 0.85, y: baseY - 12,
                    x: baseX + (team === 'player' ? 5 : -5),
                    duration: 100, ease: 'Quad.easeIn',
                    onStart: () => {
                        sprite.setFrame(profileFrames[3]);
                        sprite.setTint(0xFFFFFF);
                        this.time.delayedCall(60, () => sprite.clearTint());
                    }
                },
                // Phase 3: Follow-through — body extends forward
                {
                    scaleX: s * 1.1, scaleY: s * 0.95, y: baseY - 5,
                    duration: 120, ease: 'Sine.easeOut',
                    onStart: () => sprite.setFrame(profileFrames[0])
                },
                // Phase 4: Recovery — bounce back to idle
                {
                    scaleX: s, scaleY: s, y: baseY, x: baseX,
                    duration: 300, ease: 'Bounce.easeOut',
                    onComplete: () => sprite.setFrame(team === 'player' ? 12 : 0)
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
                        y: throwerSprite.y - 14, scaleX: (this._charScale || 1) * 1.1, scaleY: (this._charScale || 1) * 0.9,
                        duration: 200, ease: 'Quad.easeOut',
                        onStart: () => throwerSprite.setFrame(throwerSouthFrames[2])
                    },
                    {
                        y: throwerSprite.y, scaleX: 1.0, scaleY: this._charScale || 1,
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
                    { scaleY: (this._charScale || 1) * 0.95, duration: 100 },
                    { angle: -5, duration: 80 },
                    { angle: 5, duration: 80 },
                    { angle: 0, scaleY: this._charScale || 1, duration: 120 }
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

    // === BALL TEXTURES (rolling spritesheets from real PNG sprites) ===

    _createBallTextures() {
        const ROLL_FRAMES = 8;
        const FRAME_SIZE = 32;

        // All ball texture keys that should become rolling spritesheets
        const ballKeys = [
            'ball_acier', 'ball_bronze', 'ball_chrome', 'ball_noire', 'ball_rouge',
            'ball_opponent', 'ball_cochonnet', 'ball_cochonnet_bleu', 'ball_cochonnet_vert'
        ];

        for (const key of ballKeys) {
            if (!this.textures.exists(key)) continue;

            // Get the original PNG image source
            const srcImage = this.textures.get(key).getSourceImage();

            // Create a spritesheet canvas: N frames of the same ball rotated
            const canvas = document.createElement('canvas');
            canvas.width = FRAME_SIZE * ROLL_FRAMES;
            canvas.height = FRAME_SIZE;
            const ctx = canvas.getContext('2d');

            // Disable smoothing for pixel art
            ctx.imageSmoothingEnabled = false;

            for (let f = 0; f < ROLL_FRAMES; f++) {
                const cx = f * FRAME_SIZE + FRAME_SIZE / 2;
                const cy = FRAME_SIZE / 2;
                const angle = (f / ROLL_FRAMES) * Math.PI * 2;

                ctx.save();
                ctx.translate(cx, cy);
                ctx.rotate(angle);
                ctx.drawImage(srcImage, -FRAME_SIZE / 2, -FRAME_SIZE / 2, FRAME_SIZE, FRAME_SIZE);
                ctx.restore();
            }

            // Replace the static texture with the rolling spritesheet
            this.textures.remove(key);
            this.textures.addSpriteSheet(key, canvas, {
                frameWidth: FRAME_SIZE,
                frameHeight: FRAME_SIZE
            });
        }
    }

    // drawTerrain, _placeTerrainDecor, _drawTerrainBorders, _darkenHex
    // replaced by TerrainRenderer.js

    update(time, delta) {
        if (this.engine) this.engine.update(delta);
        if (this.aimingSystem) this.aimingSystem.update();
        if (this.scorePanel) this.scorePanel.update();

    }
}
