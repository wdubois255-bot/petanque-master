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
        const shadow = { offsetX: 1, offsetY: 1, color: '#1A1510', blur: 0, fill: true };
        this.add.text(
            GAME_WIDTH / 2, this.terrainY - 6,
            `VS ${this.opponentName}`,
            {
                fontFamily: 'monospace', fontSize: '9px',
                color: '#C44B3F', align: 'center', shadow
            }
        ).setOrigin(0.5, 1).setDepth(5);

        // Start game
        this.engine.startGame();
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
        const playerHomeY = this.throwCircleY + 8;
        this.playerSprite = this.add.sprite(playerHomeX, playerHomeY, 'petanque_player', 12)
            .setOrigin(0.5, 1).setDepth(20).setScale(1);
        this._playerHomeX = playerHomeX;
        this._playerHomeY = playerHomeY;

        // Opponent: waiting area, top-right of terrain
        const opponentWaitX = this.terrainX + TERRAIN_WIDTH - 20;
        const opponentWaitY = this.terrainY + 25;
        const opponentCircleX = this.throwCircleX;
        const opponentCircleY = this.throwCircleY + 8;
        this.opponentSprite = this.add.sprite(opponentWaitX, opponentWaitY, 'petanque_opponent', 0)
            .setOrigin(0.5, 1).setDepth(20).setScale(1);
        this._opponentWaitX = opponentWaitX;
        this._opponentWaitY = opponentWaitY;
        this._opponentCircleX = opponentCircleX;
        this._opponentCircleY = opponentCircleY;

        // Turn indicator arrows
        this.playerTurnArrow = this.add.text(playerHomeX, playerHomeY - 28, '\u25bc', {
            fontFamily: 'monospace', fontSize: '8px', color: '#A8B5C2'
        }).setOrigin(0.5).setDepth(21).setVisible(false);

        this.opponentTurnArrow = this.add.text(opponentWaitX, opponentWaitY - 28, '\u25bc', {
            fontFamily: 'monospace', fontSize: '8px', color: '#C44B3F'
        }).setOrigin(0.5).setDepth(21).setVisible(false);

        // Bounce animation for turn arrow
        this._playerArrowTween = this.tweens.add({
            targets: this.playerTurnArrow,
            y: playerHomeY - 24,
            duration: 400, yoyo: true, repeat: -1, paused: true
        });
        this._opponentArrowTween = this.tweens.add({
            targets: this.opponentTurnArrow,
            y: opponentWaitY - 24,
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
            this._animateThrow(team);
        };

        this._updateTurnIndicator('player');
    }

    _animateToCircle(team) {
        if (team === 'ai') {
            // Opponent walks to circle
            // Walk animation: cycle through down frames
            this.opponentSprite.setFrame(1); // walking frame
            this.tweens.add({
                targets: this.opponentSprite,
                x: this._opponentCircleX,
                y: this._opponentCircleY,
                duration: 500,
                ease: 'Sine.easeInOut',
                onUpdate: () => {
                    // Cycle walk frames (row 0: 0,1,2,3)
                    const f = Math.floor(Date.now() / 150) % 4;
                    this.opponentSprite.setFrame(f);
                },
                onComplete: () => {
                    this.opponentSprite.setFrame(12); // face up (toward terrain)
                }
            });
            // Move arrow with sprite
            this.tweens.add({
                targets: this.opponentTurnArrow,
                x: this._opponentCircleX,
                duration: 500
            });
            // Player walks away to wait
            this.tweens.add({
                targets: this.playerSprite,
                x: this.terrainX + 20,
                y: this.terrainY + TERRAIN_HEIGHT - 15,
                duration: 400,
                ease: 'Sine.easeInOut',
                onComplete: () => {
                    this.playerSprite.setFrame(12); // face up, watching
                }
            });
        } else {
            // Player to circle
            this.tweens.add({
                targets: this.playerSprite,
                x: this._playerHomeX,
                y: this._playerHomeY,
                duration: 400,
                ease: 'Sine.easeInOut',
                onComplete: () => {
                    this.playerSprite.setFrame(12); // face up
                }
            });
            // Opponent walks back to wait area
            this.tweens.add({
                targets: this.opponentSprite,
                x: this._opponentWaitX,
                y: this._opponentWaitY,
                duration: 500,
                ease: 'Sine.easeInOut',
                onUpdate: () => {
                    const f = Math.floor(Date.now() / 150) % 4;
                    this.opponentSprite.setFrame(f);
                },
                onComplete: () => {
                    this.opponentSprite.setFrame(0); // face down, watching
                }
            });
            this.tweens.add({
                targets: this.opponentTurnArrow,
                x: this._opponentWaitX,
                duration: 500
            });
        }
    }

    _animateThrow(team) {
        const sprite = team === 'player' ? this.playerSprite : this.opponentSprite;
        const baseY = sprite.y;

        // Flash the sprite white briefly for emphasis
        sprite.setTint(0xFFFFFF);
        this.time.delayedCall(80, () => sprite.clearTint());

        // Throw animation: wind-up, release, recovery
        this.tweens.chain({
            targets: sprite,
            tweens: [
                // Wind up: lean back, compress
                { scaleX: 0.9, scaleY: 1.1, y: baseY + 1, duration: 150, ease: 'Quad.easeOut' },
                // Release: stretch forward, arm extends
                { scaleX: 1.15, scaleY: 0.8, y: baseY - 4, duration: 100, ease: 'Quad.easeIn' },
                // Recovery: bounce back to normal
                { scaleX: 1.0, scaleY: 1.0, y: baseY, duration: 250, ease: 'Bounce.easeOut' }
            ]
        });
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

    drawTerrain(colors) {
        const g = this.add.graphics();

        // Terrain shadow
        g.fillStyle(0x000000, 0.15);
        g.fillRect(this.terrainX + 2, this.terrainY + 2, TERRAIN_WIDTH, TERRAIN_HEIGHT);

        // Background
        g.fillStyle(colors.bg, 1);
        g.fillRect(this.terrainX, this.terrainY, TERRAIN_WIDTH, TERRAIN_HEIGHT);

        // Terrain texture (subtle noise)
        const texG = this.add.graphics().setDepth(1);
        for (let i = 0; i < 30; i++) {
            const nx = this.terrainX + Math.random() * TERRAIN_WIDTH;
            const ny = this.terrainY + Math.random() * TERRAIN_HEIGHT;
            texG.fillStyle(0x000000, 0.04);
            texG.fillRect(nx, ny, 1, 1);
        }
        for (let i = 0; i < 15; i++) {
            const nx = this.terrainX + Math.random() * TERRAIN_WIDTH;
            const ny = this.terrainY + Math.random() * TERRAIN_HEIGHT;
            texG.fillStyle(0xFFFFFF, 0.03);
            texG.fillRect(nx, ny, 1, 1);
        }

        // Border (double line for style)
        g.lineStyle(2, colors.line, 0.4);
        g.strokeRect(this.terrainX - 1, this.terrainY - 1, TERRAIN_WIDTH + 2, TERRAIN_HEIGHT + 2);
        g.lineStyle(1, colors.line, 0.2);
        g.strokeRect(this.terrainX - 3, this.terrainY - 3, TERRAIN_WIDTH + 6, TERRAIN_HEIGHT + 6);

        // Throw circle
        this.throwCircleX = GAME_WIDTH / 2;
        this.throwCircleY = this.terrainY + TERRAIN_HEIGHT - THROW_CIRCLE_Y_OFFSET;
        g.lineStyle(1, COLORS.BLANC, 0.5);
        g.strokeCircle(this.throwCircleX, this.throwCircleY, THROW_CIRCLE_RADIUS);
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
                    // Crouch: scale Y down, shift down
                    this.tweens.add({
                        targets: this.playerSprite,
                        scaleY: 0.7, duration: 200
                    });
                } else if (this.aimingSystem.shotMode === 'tirer' && !this._playerStanding) {
                    this._playerStanding = true;
                    this._playerCrouched = false;
                    // Stand tall
                    this.tweens.add({
                        targets: this.playerSprite,
                        scaleY: 1.0, duration: 200
                    });
                }
            }

            // Reset crouch state when not aiming
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
