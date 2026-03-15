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
        this.opponentId = data.opponentId || null;
        this.returnScene = data.returnScene || null;
        this.personality = data.personality || null;
    }

    create() {
        const terrainColor = TERRAIN_COLORS[this.terrainType];
        this.frictionMult = TERRAIN_FRICTION[this.terrainType];

        // Terrain offset (centered horizontally, vertically)
        this.terrainX = (GAME_WIDTH - TERRAIN_WIDTH) / 2;
        this.terrainY = (GAME_HEIGHT - TERRAIN_HEIGHT) / 2;

        this.drawTerrain(terrainColor);

        // Generate 3D ball textures (CanvasTexture with radial gradient)
        this._createBallTextures();

        // Generate character sprites for petanque scene
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

        // Add player characters on terrain
        this._createPlayerSprites();

        // Aiming
        this.aimingSystem = new AimingSystem(this, this.engine);

        // AI (with personality if provided)
        this.ai = new PetanqueAI(this, this.engine, this.difficulty, this.personality);

        // Score panel
        this.scorePanel = new ScorePanel(this, this.engine);

        // Opponent name label
        const shadow = { offsetX: 2, offsetY: 2, color: '#1A1510', blur: 0, fill: true };
        this.add.text(
            GAME_WIDTH / 2, this.terrainY - 12,
            `VS ${this.opponentName}`,
            {
                fontFamily: 'monospace', fontSize: '18px',
                color: '#C44B3F', align: 'center', shadow
            }
        ).setOrigin(0.5, 1).setDepth(5);

        // Impact traces layer (RenderTexture, persistent marks on terrain)
        this.impactLayer = this.add.renderTexture(
            this.terrainX, this.terrainY,
            TERRAIN_WIDTH, TERRAIN_HEIGHT
        ).setOrigin(0, 0).setDepth(3).setAlpha(0.5);

        // Start ambiance
        startCigales();

        // Start game
        this.engine.startGame();

        // Stop cigales when scene shuts down
        this.events.on('shutdown', () => stopCigales());
        this.events.on('destroy', () => stopCigales());
    }

    _ensureSprites() {
        if (!this.textures.exists('petanque_player')) {
            generateCharacterSprite(this, 'petanque_player', PALETTES.player);
        }
        // Destroy old opponent texture to support different opponents per fight
        if (this.textures.exists('petanque_opponent')) {
            this.textures.remove('petanque_opponent');
        }
        const opponentPalette = this._getOpponentPalette();
        generateCharacterSprite(this, 'petanque_opponent', opponentPalette);
    }

    _getOpponentPalette() {
        const id = this.opponentId || '';
        if (id.includes('marcel')) return PALETTES.npc_marcel;
        if (id.includes('rival') || id.includes('bastien')) return PALETTES.npc_rival;
        if (id.includes('fanny')) return PALETTES.npc_fanny;
        if (id.includes('ricardo')) return PALETTES.npc_ricardo;
        if (id.includes('marius')) return PALETTES.npc_marius;
        if (id.includes('maitre') || id.includes('papet')) return PALETTES.npc_vieux_maitre;
        if (id.includes('dresseur')) return PALETTES.npc_dresseur;
        return PALETTES.npc_dresseur;
    }

    _createPlayerSprites() {
        // Player: in the throw circle, facing up toward terrain
        const playerHomeX = this.throwCircleX;
        const playerHomeY = this.throwCircleY + 16;
        this.playerSprite = this.add.sprite(playerHomeX, playerHomeY, 'petanque_player', 12)
            .setOrigin(0.5, 1).setDepth(20).setScale(1);
        this._playerHomeX = playerHomeX;
        this._playerHomeY = playerHomeY;

        // Opponent: NEAR COCHONNET (crouching, watching), not in waiting area
        // Initial position = near center-top of terrain (cochonnet area)
        const opponentCochoX = this.terrainX + TERRAIN_WIDTH / 2 + 30;
        const opponentCochoY = this.terrainY + 120;
        const opponentCircleX = this.throwCircleX;
        const opponentCircleY = this.throwCircleY + 16;
        this.opponentSprite = this.add.sprite(opponentCochoX, opponentCochoY, 'petanque_opponent', 0)
            .setOrigin(0.5, 1).setDepth(20).setScale(1, 0.6); // crouching
        this._opponentCochoX = opponentCochoX;
        this._opponentCochoY = opponentCochoY;
        this._opponentCircleX = opponentCircleX;
        this._opponentCircleY = opponentCircleY;

        // Turn indicator arrows
        this.playerTurnArrow = this.add.text(playerHomeX, playerHomeY - 56, '\u25bc', {
            fontFamily: 'monospace', fontSize: '16px', color: '#A8B5C2'
        }).setOrigin(0.5).setDepth(21).setVisible(false);

        this.opponentTurnArrow = this.add.text(opponentCochoX, opponentCochoY - 40, '\u25bc', {
            fontFamily: 'monospace', fontSize: '16px', color: '#C44B3F'
        }).setOrigin(0.5).setDepth(21).setVisible(false);

        // Bounce animation for turn arrow
        this._playerArrowTween = this.tweens.add({
            targets: this.playerTurnArrow,
            y: playerHomeY - 48,
            duration: 400, yoyo: true, repeat: -1, paused: true
        });
        this._opponentArrowTween = this.tweens.add({
            targets: this.opponentTurnArrow,
            y: opponentCochoY - 32,
            duration: 400, yoyo: true, repeat: -1, paused: true
        });

        // Hook into throw events for animations
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

        // Hook into after-stop for reactions
        const existingAfterStop = this.engine.onAfterStop;
        this.engine.onAfterStop = (lastTeam) => {
            if (existingAfterStop) existingAfterStop(lastTeam);
            this._animateReaction(lastTeam);
        };

        this._updateTurnIndicator('player');
    }

    // Update opponent position near cochonnet (call after cochonnet lands)
    _updateOpponentCochoPos() {
        if (this.engine.cochonnet && this.engine.cochonnet.isAlive) {
            this._opponentCochoX = this.engine.cochonnet.x + 30;
            this._opponentCochoY = this.engine.cochonnet.y + 10;
        }
    }

    _animateToCircle(team) {
        this._updateOpponentCochoPos();

        if (team === 'opponent') {
            // Opponent stands up and walks to circle
            this.tweens.add({
                targets: this.opponentSprite,
                scaleY: 1.0, // stand up
                x: this._opponentCircleX,
                y: this._opponentCircleY,
                duration: 500,
                ease: 'Sine.easeInOut',
                onUpdate: () => {
                    const f = Math.floor(Date.now() / 150) % 4;
                    this.opponentSprite.setFrame(f);
                },
                onComplete: () => {
                    this.opponentSprite.setFrame(12);
                }
            });
            this.tweens.add({
                targets: this.opponentTurnArrow,
                x: this._opponentCircleX,
                y: this._opponentCircleY - 56,
                duration: 500
            });
            // Player steps aside near cochonnet
            this.tweens.add({
                targets: this.playerSprite,
                x: this._opponentCochoX - 60,
                y: this._opponentCochoY,
                duration: 400,
                ease: 'Sine.easeInOut',
                onComplete: () => {
                    this.playerSprite.setFrame(0);
                }
            });
        } else {
            // Player walks back to circle
            this.tweens.add({
                targets: this.playerSprite,
                x: this._playerHomeX,
                y: this._playerHomeY,
                duration: 400,
                ease: 'Sine.easeInOut',
                onComplete: () => {
                    this.playerSprite.setFrame(12);
                }
            });
            // Opponent goes back near cochonnet, crouches
            this.tweens.add({
                targets: this.opponentSprite,
                x: this._opponentCochoX,
                y: this._opponentCochoY,
                scaleY: 0.6, // crouch
                duration: 500,
                ease: 'Sine.easeInOut',
                onUpdate: () => {
                    const f = Math.floor(Date.now() / 150) % 4;
                    this.opponentSprite.setFrame(f);
                },
                onComplete: () => {
                    this.opponentSprite.setFrame(0);
                }
            });
            this.tweens.add({
                targets: this.opponentTurnArrow,
                x: this._opponentCochoX,
                y: this._opponentCochoY - 40,
                duration: 500
            });
        }
    }

    _animateCharThrow(team) {
        const sprite = team === 'player' ? this.playerSprite : this.opponentSprite;
        const baseY = sprite.y;

        sprite.setTint(0xFFFFFF);
        this.time.delayedCall(80, () => sprite.clearTint());

        this.tweens.chain({
            targets: sprite,
            tweens: [
                { scaleX: 0.9, scaleY: 1.1, y: baseY + 2, duration: 150, ease: 'Quad.easeOut' },
                { scaleX: 1.15, scaleY: 0.8, y: baseY - 8, duration: 100, ease: 'Quad.easeIn' },
                { scaleX: 1.0, scaleY: 1.0, y: baseY, duration: 250, ease: 'Bounce.easeOut' }
            ]
        });
    }

    _animateReaction(lastTeam) {
        if (!this.engine.cochonnet || !this.engine.cochonnet.isAlive) return;

        // Find the last thrown ball's distance to cochonnet
        const lastBall = this.engine.lastThrownBall;
        if (!lastBall || !lastBall.isAlive) return;
        const dist = lastBall.distanceTo(this.engine.cochonnet);

        const throwerSprite = lastTeam === 'player' ? this.playerSprite : this.opponentSprite;
        const watcherSprite = lastTeam === 'player' ? this.opponentSprite : this.playerSprite;

        if (dist < 30) {
            // Good shot! Thrower celebrates (small jump)
            this.tweens.add({
                targets: throwerSprite,
                y: throwerSprite.y - 8,
                duration: 200, ease: 'Bounce.easeOut', yoyo: true
            });
            // Watcher shakes head
            this.tweens.chain({
                targets: watcherSprite,
                tweens: [
                    { angle: -5, duration: 100 },
                    { angle: 5, duration: 100 },
                    { angle: 0, duration: 100 }
                ]
            });
        } else if (dist > 80) {
            // Bad shot — thrower shakes head
            this.tweens.chain({
                targets: throwerSprite,
                tweens: [
                    { angle: -5, duration: 100 },
                    { angle: 5, duration: 100 },
                    { angle: 0, duration: 100 }
                ]
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
            // Radial gradient for 3D sphere
            const grad = ctx.createRadialGradient(12, 10, 2, 16, 16, 14);
            grad.addColorStop(0, hi);
            grad.addColorStop(0.4, base);
            grad.addColorStop(1, shadow);
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(16, 16, 14, 0, Math.PI * 2);
            ctx.fill();
            // Specular highlight
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.beginPath();
            ctx.arc(11, 9, 3, 0, Math.PI * 2);
            ctx.fill();
            tex.refresh();
        }
    }

    drawTerrain(colors) {
        // === FOND DE SCENE : ciel Provence + sol exterieur ===
        const bg = this.add.graphics().setDepth(0);

        // Ciel gradient vertical #87CEEB → #B8D8EB
        const skyTex = this.textures.createCanvas('sky_gradient', GAME_WIDTH, GAME_HEIGHT);
        const skyCtx = skyTex.getContext();
        const skyGrad = skyCtx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
        skyGrad.addColorStop(0, '#87CEEB');
        skyGrad.addColorStop(1, '#B8D8EB');
        skyCtx.fillStyle = skyGrad;
        skyCtx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        skyTex.refresh();
        this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'sky_gradient').setDepth(0);

        // Sol exterieur (terre seche sous le terrain)
        bg.fillStyle(0x8B7D5A, 1);
        bg.fillRect(0, GAME_HEIGHT * 0.6, GAME_WIDTH, GAME_HEIGHT * 0.4);
        bg.setDepth(0);

        // === DECOR STATIQUE ===
        const decor = this.add.graphics().setDepth(1);
        const tx = this.terrainX;
        const tw = TERRAIN_WIDTH;

        // Platane gauche
        decor.fillStyle(0x8B6B4A, 1);
        decor.fillRect(tx - 80, 60, 20, 80);           // tronc
        decor.fillStyle(0x4A7A3A, 1);
        decor.fillCircle(tx - 70, 50, 50);              // canopee
        decor.fillStyle(0x3A6A2A, 0.5);
        decor.fillCircle(tx - 60, 60, 35);              // canopee ombre

        // Platane droite
        decor.fillStyle(0x8B6B4A, 1);
        decor.fillRect(tx + tw + 60, 80, 20, 80);
        decor.fillStyle(0x4A7A3A, 1);
        decor.fillCircle(tx + tw + 70, 70, 45);
        decor.fillStyle(0x3A6A2A, 0.5);
        decor.fillCircle(tx + tw + 80, 80, 30);

        // Banc
        decor.fillStyle(0x8B6B4A, 1);
        decor.fillRect(tx - 70, 300, 50, 6);            // assise
        decor.fillStyle(0x6B5038, 1);
        decor.fillRect(tx - 68, 306, 4, 10);            // pied gauche
        decor.fillRect(tx - 26, 306, 4, 10);            // pied droit
        decor.fillStyle(0x8B6B4A, 0.8);
        decor.fillRect(tx - 70, 294, 50, 4);            // dossier

        // Muret pierre
        decor.fillStyle(0xD4C4A0, 1);
        decor.fillRect(tx + tw + 20, 150, 30, 200);
        decor.fillStyle(0xC0B090, 0.5);
        for (let my = 150; my < 350; my += 20) {
            decor.fillRect(tx + tw + 20, my, 30, 1);    // joints
        }

        // Table cafe
        decor.fillStyle(0x8B6B4A, 1);
        decor.fillCircle(tx + tw + 45, 390, 12);        // plateau rond
        decor.fillStyle(0x6B5038, 1);
        decor.fillRect(tx + tw + 43, 402, 4, 14);       // pied

        // === TERRAIN TEXTURE GRAVIER (CanvasTexture) ===
        const terrainTexKey = `terrain_gravier_${this.terrainType}`;
        if (this.textures.exists(terrainTexKey)) this.textures.remove(terrainTexKey);
        const terrainTex = this.textures.createCanvas(terrainTexKey, TERRAIN_WIDTH, TERRAIN_HEIGHT);
        const tCtx = terrainTex.getContext();

        // Base couleur terrain
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

        // 200 petits cailloux aleatoires
        const gravel = gravelColors[this.terrainType] || gravelColors.terre;
        for (let i = 0; i < 200; i++) {
            const gx = Math.random() * TERRAIN_WIDTH;
            const gy = Math.random() * TERRAIN_HEIGHT;
            const size = 1 + Math.random() * 2;
            tCtx.fillStyle = gravel[Math.floor(Math.random() * gravel.length)];
            tCtx.fillRect(gx, gy, size, size);
        }
        terrainTex.refresh();

        // Ombre du terrain
        const terrainG = this.add.graphics().setDepth(1);
        terrainG.fillStyle(0x000000, 0.15);
        terrainG.fillRect(this.terrainX + 4, this.terrainY + 4, TERRAIN_WIDTH, TERRAIN_HEIGHT);

        // Image terrain
        this.add.image(this.terrainX + TERRAIN_WIDTH / 2, this.terrainY + TERRAIN_HEIGHT / 2, terrainTexKey).setDepth(2);

        // === BORDURES BOIS ===
        const bord = this.add.graphics().setDepth(3);
        const bw = 4; // epaisseur bordure
        // Bois principal
        bord.fillStyle(0x6B5038, 1);
        bord.fillRect(this.terrainX - bw, this.terrainY - bw, TERRAIN_WIDTH + bw * 2, bw);        // haut
        bord.fillRect(this.terrainX - bw, this.terrainY + TERRAIN_HEIGHT, TERRAIN_WIDTH + bw * 2, bw); // bas
        bord.fillRect(this.terrainX - bw, this.terrainY, bw, TERRAIN_HEIGHT);                      // gauche
        bord.fillRect(this.terrainX + TERRAIN_WIDTH, this.terrainY, bw, TERRAIN_HEIGHT);            // droite
        // Highlight interieur (1px)
        bord.fillStyle(0x9B7B5A, 0.6);
        bord.fillRect(this.terrainX, this.terrainY, TERRAIN_WIDTH, 1);
        bord.fillRect(this.terrainX, this.terrainY, 1, TERRAIN_HEIGHT);

        // === CERCLE DE LANCER ===
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

            // Update player sprite based on shot mode
            if (this.playerSprite && this.aimingSystem.shotMode) {
                if (this.aimingSystem.shotMode === 'pointer' && !this._playerCrouched) {
                    this._playerCrouched = true;
                    this._playerStanding = false;
                    this.tweens.add({
                        targets: this.playerSprite,
                        scaleY: 0.7, duration: 200
                    });
                } else if (this.aimingSystem.shotMode === 'tirer' && !this._playerStanding) {
                    this._playerStanding = true;
                    this._playerCrouched = false;
                    this.tweens.add({
                        targets: this.playerSprite,
                        scaleY: 1.0, duration: 200
                    });
                }
            }

            if (!this.engine.aimingEnabled && this._playerCrouched) {
                this._playerCrouched = false;
                this._playerStanding = false;
                this.tweens.add({
                    targets: this.playerSprite,
                    scaleY: 1.0, duration: 150
                });
            }
        }
        if (this.scorePanel) {
            this.scorePanel.update();
        }
    }
}
