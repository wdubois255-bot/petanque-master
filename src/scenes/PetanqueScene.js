import Phaser from 'phaser';
import {
    GAME_WIDTH, GAME_HEIGHT,
    TERRAIN_WIDTH, TERRAIN_HEIGHT,
    TERRAIN_COLORS, TERRAIN_FRICTION,
    COLORS, THROW_CIRCLE_RADIUS, THROW_CIRCLE_Y_OFFSET,
    BALL_COLORS, BALL_RADIUS, COCHONNET_RADIUS
} from '../utils/Constants.js';
import PetanqueEngine from '../petanque/PetanqueEngine.js';
import AimingSystem from '../petanque/AimingSystem.js';
import PetanqueAI from '../petanque/PetanqueAI.js';
import ScorePanel from '../ui/ScorePanel.js';
import ModularCharacter from '../petanque/ModularCharacter.js';
import { createCharacterTextures, createHandBallTexture } from '../petanque/CharacterTextures.js';
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
        this.opponentId = data.opponentId || null;
        this.returnScene = data.returnScene || null;
        this.personality = data.personality || null;
        this.playerCharacter = data.playerCharacter || null;
        this.opponentCharacter = data.opponentCharacter || null;
        this.playerCharId = this.playerCharacter?.id || data.playerCharId || 'equilibre';
        this.arcadeState = data.arcadeState || null;
        this.arcadeRound = data.arcadeRound || null;
        this.localMultiplayer = data.localMultiplayer || false;
    }

    create() {
        const terrainColor = TERRAIN_COLORS[this.terrainType];
        this.frictionMult = TERRAIN_FRICTION[this.terrainType];

        this.terrainX = (GAME_WIDTH - TERRAIN_WIDTH) / 2;
        this.terrainY = (GAME_HEIGHT - TERRAIN_HEIGHT) / 2;

        this.drawTerrain(terrainColor);

        this._createBallTextures();

        // Generate modular character textures
        this._createCharacterTextures();

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

        // Create modular character sprites
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
            {
                fontFamily: 'monospace', fontSize: '18px',
                color: '#C44B3F', align: 'center', shadow
            }
        ).setOrigin(0.5, 1).setDepth(5);

        // Impact traces layer
        this.impactLayer = this.add.renderTexture(
            this.terrainX, this.terrainY,
            TERRAIN_WIDTH, TERRAIN_HEIGHT
        ).setOrigin(0, 0).setDepth(3).setAlpha(0.5);

        startCigales();
        this.engine.startGame();

        this.events.on('shutdown', () => {
            stopCigales();
            if (this.playerChar) this.playerChar.destroy();
            if (this.opponentChar) this.opponentChar.destroy();
        });
        this.events.on('destroy', () => stopCigales());
    }

    // === CHARACTER PROFILE MAPPING ===

    _getProfileId(charId) {
        // Map game character archetypes to profile texture IDs
        // For now only 'papet' and 'joueur' have profile views
        const mapping = {
            'equilibre': 'joueur',
            'pointeur': 'papet',
            'tireur': 'joueur',
            'stratege': 'papet',
            'wildcard': 'joueur',
            'boss': 'papet',
        };
        return mapping[charId] || 'joueur';
    }

    _createCharacterTextures() {
        // Create profile textures for both characters
        const playerProfileId = this._getProfileId(this.playerCharId);
        const opponentProfileId = this._getProfileId(this.opponentId || 'pointeur');

        createCharacterTextures(this, playerProfileId);
        createCharacterTextures(this, opponentProfileId);
        createHandBallTexture(this);

        this._playerProfileId = playerProfileId;
        this._opponentProfileId = opponentProfileId;
    }

    _createPlayerSprites() {
        const playerTex = createCharacterTextures(this, this._playerProfileId);
        const opponentTex = createCharacterTextures(this, this._opponentProfileId);
        const ballKey = 'modular_boule';

        // Player: in the throw circle, facing up (right in profile = up toward terrain)
        const playerHomeX = this.throwCircleX;
        const playerHomeY = this.throwCircleY + 24;
        this._playerHomeX = playerHomeX;
        this._playerHomeY = playerHomeY;

        this.playerChar = new ModularCharacter(this, playerHomeX, playerHomeY, {
            bodyKey: playerTex.bodyKey,
            armKey: playerTex.armKey,
            ballKey,
            shoulder: playerTex.shoulder,
            armLength: playerTex.armLength,
            scale: 2,
            flipX: false,
        });

        // Opponent: sideline (right edge of terrain), near where cochonnet will land
        const opponentCochoX = this.terrainX + TERRAIN_WIDTH + 24;
        const opponentCochoY = this.terrainY + 140;
        this._opponentCochoX = opponentCochoX;
        this._opponentCochoY = opponentCochoY;
        this._opponentCircleX = this.throwCircleX;
        this._opponentCircleY = this.throwCircleY + 24;

        this.opponentChar = new ModularCharacter(this, opponentCochoX, opponentCochoY, {
            bodyKey: opponentTex.bodyKey,
            armKey: opponentTex.armKey,
            ballKey,
            shoulder: opponentTex.shoulder,
            armLength: opponentTex.armLength,
            scale: 2,
            flipX: true,
        });
        // Opponent starts without ball visible
        this.opponentChar.ball.setVisible(false);
        this.opponentChar.hasBall = false;

        // Turn indicator arrows
        this.playerTurnArrow = this.add.text(playerHomeX, playerHomeY - 80, '\u25bc', {
            fontFamily: 'monospace', fontSize: '16px', color: '#A8B5C2'
        }).setOrigin(0.5).setDepth(21).setVisible(false);

        this.opponentTurnArrow = this.add.text(opponentCochoX, opponentCochoY - 80, '\u25bc', {
            fontFamily: 'monospace', fontSize: '16px', color: '#C44B3F'
        }).setOrigin(0.5).setDepth(21).setVisible(false);

        this._playerArrowTween = this.tweens.add({
            targets: this.playerTurnArrow,
            y: playerHomeY - 72,
            duration: 400, yoyo: true, repeat: -1, paused: true
        });
        this._opponentArrowTween = this.tweens.add({
            targets: this.opponentTurnArrow,
            y: opponentCochoY - 72,
            duration: 400, yoyo: true, repeat: -1, paused: true
        });

        // Hook into engine events
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
            this._opponentCochoX = this.terrainX + TERRAIN_WIDTH + 24;
            this._opponentCochoY = this.engine.cochonnet.y + 10;
        }
    }

    _animateToCircle(team) {
        this._updateOpponentCochoPos();

        if (team === 'opponent') {
            // Opponent walks to throw circle with ball
            this.opponentChar.prepareBall();
            this.opponentChar.moveTo(this._opponentCircleX, this._opponentCircleY, 500);

            // Move arrow
            this.tweens.add({
                targets: this.opponentTurnArrow,
                x: this._opponentCircleX,
                y: this._opponentCircleY - 80,
                duration: 500
            });

            // Player steps to sideline (left edge)
            this.playerChar.ball.setVisible(false);
            this.playerChar.hasBall = false;
            this.playerChar.moveTo(this.terrainX - 24, this._opponentCochoY, 400);
        } else {
            // Player walks back to throw circle with ball
            this.playerChar.prepareBall();
            this.playerChar.moveTo(this._playerHomeX, this._playerHomeY, 400);

            // Opponent goes back to sideline
            this.opponentChar.ball.setVisible(false);
            this.opponentChar.hasBall = false;
            this.opponentChar.moveTo(this._opponentCochoX, this._opponentCochoY, 500);

            this.tweens.add({
                targets: this.opponentTurnArrow,
                x: this._opponentCochoX,
                y: this._opponentCochoY - 80,
                duration: 500
            });
        }
    }

    _animateCharThrow(team) {
        const char = team === 'player' ? this.playerChar : this.opponentChar;
        const isAI = team === 'opponent' && !this.localMultiplayer;

        if (isAI) {
            char.playQuickThrow(0.7);
        } else {
            char.playThrow(0.7);
        }
    }

    _animateReaction(lastTeam) {
        if (!this.engine.cochonnet || !this.engine.cochonnet.isAlive) return;

        const lastBall = this.engine.lastThrownBall;
        if (!lastBall || !lastBall.isAlive) return;
        const dist = lastBall.distanceTo(this.engine.cochonnet);

        const throwerChar = lastTeam === 'player' ? this.playerChar : this.opponentChar;
        const watcherChar = lastTeam === 'player' ? this.opponentChar : this.playerChar;

        if (dist < 30) {
            throwerChar.playCelebrate();
            watcherChar.playDisappoint();
        } else if (dist > 80) {
            throwerChar.playDisappoint();
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

    _createBallTextures() {
        const defs = [
            { key: 'ball_acier',     base: '#A8B5C2', hi: '#E0E8F0', shadow: '#606870' },
            { key: 'ball_bronze',    base: '#CD7F32', hi: '#E8A050', shadow: '#8B5A20' },
            { key: 'ball_chrome',    base: '#DCDCDC', hi: '#FFFFFF', shadow: '#909090' },
            { key: 'ball_opponent',  base: '#C44B3F', hi: '#E87060', shadow: '#8A2A20' },
            { key: 'ball_cochonnet', base: '#D4A574', hi: '#F0D0A0', shadow: '#8B6B4A' }
        ];
        for (const { key, base, hi, shadow } of defs) {
            if (this.textures.exists(key)) continue;
            const tex = this.textures.createCanvas(key, 32, 32);
            const ctx = tex.getContext();
            const grad = ctx.createRadialGradient(12, 10, 2, 16, 16, 14);
            grad.addColorStop(0, hi);
            grad.addColorStop(0.4, base);
            grad.addColorStop(1, shadow);
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(16, 16, 14, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.beginPath();
            ctx.arc(11, 9, 3, 0, Math.PI * 2);
            ctx.fill();
            tex.refresh();
        }
    }

    drawTerrain(colors) {
        const bg = this.add.graphics().setDepth(0);

        if (this.textures.exists('sky_gradient')) this.textures.remove('sky_gradient');
        const skyTex = this.textures.createCanvas('sky_gradient', GAME_WIDTH, GAME_HEIGHT);
        const skyCtx = skyTex.getContext();
        const skyGrad = skyCtx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
        skyGrad.addColorStop(0, '#87CEEB');
        skyGrad.addColorStop(1, '#B8D8EB');
        skyCtx.fillStyle = skyGrad;
        skyCtx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        skyTex.refresh();
        this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'sky_gradient').setDepth(0);

        bg.fillStyle(0x8B7D5A, 1);
        bg.fillRect(0, GAME_HEIGHT * 0.6, GAME_WIDTH, GAME_HEIGHT * 0.4);
        bg.setDepth(0);

        const decor = this.add.graphics().setDepth(1);
        const tx = this.terrainX;
        const tw = TERRAIN_WIDTH;

        decor.fillStyle(0x8B6B4A, 1);
        decor.fillRect(tx - 80, 60, 20, 80);
        decor.fillStyle(0x4A7A3A, 1);
        decor.fillCircle(tx - 70, 50, 50);
        decor.fillStyle(0x3A6A2A, 0.5);
        decor.fillCircle(tx - 60, 60, 35);

        decor.fillStyle(0x8B6B4A, 1);
        decor.fillRect(tx + tw + 60, 80, 20, 80);
        decor.fillStyle(0x4A7A3A, 1);
        decor.fillCircle(tx + tw + 70, 70, 45);
        decor.fillStyle(0x3A6A2A, 0.5);
        decor.fillCircle(tx + tw + 80, 80, 30);

        decor.fillStyle(0x8B6B4A, 1);
        decor.fillRect(tx - 70, 300, 50, 6);
        decor.fillStyle(0x6B5038, 1);
        decor.fillRect(tx - 68, 306, 4, 10);
        decor.fillRect(tx - 26, 306, 4, 10);
        decor.fillStyle(0x8B6B4A, 0.8);
        decor.fillRect(tx - 70, 294, 50, 4);

        decor.fillStyle(0xD4C4A0, 1);
        decor.fillRect(tx + tw + 20, 150, 30, 200);
        decor.fillStyle(0xC0B090, 0.5);
        for (let my = 150; my < 350; my += 20) {
            decor.fillRect(tx + tw + 20, my, 30, 1);
        }

        decor.fillStyle(0x8B6B4A, 1);
        decor.fillCircle(tx + tw + 45, 390, 12);
        decor.fillStyle(0x6B5038, 1);
        decor.fillRect(tx + tw + 43, 402, 4, 14);

        const terrainTexKey = `terrain_gravier_${this.terrainType}`;
        if (this.textures.exists(terrainTexKey)) this.textures.remove(terrainTexKey);
        const terrainTex = this.textures.createCanvas(terrainTexKey, TERRAIN_WIDTH, TERRAIN_HEIGHT);
        const tCtx = terrainTex.getContext();

        const baseColors = {
            terre:  '#C4854A',
            herbe:  '#6B8E4E',
            sable:  '#E8D5B7',
            dalles: '#9E9E8E'
        };
        const gravelColors = {
            terre:  ['#B07840', '#D49560', '#A87040', '#C4954A'],
            herbe:  ['#5E8A44', '#7BA65E', '#4A7A3A', '#6B9E4E'],
            sable:  ['#D4C0A0', '#F0E0C8', '#C4B090', '#E8D0B0'],
            dalles: ['#8E8E7E', '#B0A090', '#808070', '#A09888']
        };
        tCtx.fillStyle = baseColors[this.terrainType] || baseColors.terre;
        tCtx.fillRect(0, 0, TERRAIN_WIDTH, TERRAIN_HEIGHT);

        const gravel = gravelColors[this.terrainType] || gravelColors.terre;
        for (let i = 0; i < 200; i++) {
            const gx = Math.random() * TERRAIN_WIDTH;
            const gy = Math.random() * TERRAIN_HEIGHT;
            const size = 1 + Math.random() * 2;
            tCtx.fillStyle = gravel[Math.floor(Math.random() * gravel.length)];
            tCtx.fillRect(gx, gy, size, size);
        }
        terrainTex.refresh();

        const terrainG = this.add.graphics().setDepth(1);
        terrainG.fillStyle(0x000000, 0.15);
        terrainG.fillRect(this.terrainX + 4, this.terrainY + 4, TERRAIN_WIDTH, TERRAIN_HEIGHT);

        this.add.image(this.terrainX + TERRAIN_WIDTH / 2, this.terrainY + TERRAIN_HEIGHT / 2, terrainTexKey).setDepth(2);

        const bord = this.add.graphics().setDepth(3);
        const bw = 4;
        bord.fillStyle(0x6B5038, 1);
        bord.fillRect(this.terrainX - bw, this.terrainY - bw, TERRAIN_WIDTH + bw * 2, bw);
        bord.fillRect(this.terrainX - bw, this.terrainY + TERRAIN_HEIGHT, TERRAIN_WIDTH + bw * 2, bw);
        bord.fillRect(this.terrainX - bw, this.terrainY, bw, TERRAIN_HEIGHT);
        bord.fillRect(this.terrainX + TERRAIN_WIDTH, this.terrainY, bw, TERRAIN_HEIGHT);
        bord.fillStyle(0x9B7B5A, 0.6);
        bord.fillRect(this.terrainX, this.terrainY, TERRAIN_WIDTH, 1);
        bord.fillRect(this.terrainX, this.terrainY, 1, TERRAIN_HEIGHT);

        this.throwCircleX = GAME_WIDTH / 2;
        this.throwCircleY = this.terrainY + TERRAIN_HEIGHT - THROW_CIRCLE_Y_OFFSET;
        const circleG = this.add.graphics().setDepth(4);
        circleG.lineStyle(2, COLORS.BLANC, 0.5);
        circleG.strokeCircle(this.throwCircleX, this.throwCircleY, THROW_CIRCLE_RADIUS);
    }

    update(time, delta) {
        if (this.engine) {
            this.engine.update(delta);
        }
        if (this.aimingSystem) {
            this.aimingSystem.update();
        }
        if (this.scorePanel) {
            this.scorePanel.update();
        }
    }
}
