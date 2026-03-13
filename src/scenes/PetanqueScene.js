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

        // AI
        this.ai = new PetanqueAI(this, this.engine, this.difficulty);

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
        // Pick opponent palette based on opponentId
        const opponentPalette = this._getOpponentPalette();
        if (!this.textures.exists('petanque_opponent')) {
            generateCharacterSprite(this, 'petanque_opponent', opponentPalette);
        }
    }

    _getOpponentPalette() {
        const id = this.opponentId || '';
        if (id.includes('marcel')) return PALETTES.npc_marcel;
        if (id.includes('rival') || id.includes('bastien')) return PALETTES.npc_rival;
        if (id.includes('maitre') || id.includes('papet')) return PALETTES.npc_vieux_maitre;
        if (id.includes('dresseur')) return PALETTES.npc_dresseur;
        return PALETTES.npc_dresseur;
    }

    _createPlayerSprites() {
        // Player sprite: near throw circle, facing up (row 3, frame 0 = index 12)
        const playerX = this.throwCircleX - 16;
        const playerY = this.throwCircleY + 2;
        this.playerSprite = this.add.sprite(playerX, playerY, 'petanque_player', 12)
            .setOrigin(0.5, 1).setDepth(20).setScale(1);

        // Opponent sprite: other side of terrain, facing down (row 0, frame 0 = index 0)
        const opponentX = this.throwCircleX + 16;
        const opponentY = this.terrainY + 20;
        this.opponentSprite = this.add.sprite(opponentX, opponentY, 'petanque_opponent', 0)
            .setOrigin(0.5, 1).setDepth(20).setScale(1);

        // Turn indicator arrows
        this.playerTurnArrow = this.add.text(playerX, playerY - 28, '\u25bc', {
            fontFamily: 'monospace', fontSize: '8px', color: '#A8B5C2'
        }).setOrigin(0.5).setDepth(21).setVisible(false);

        this.opponentTurnArrow = this.add.text(opponentX, opponentY - 28, '\u25bc', {
            fontFamily: 'monospace', fontSize: '8px', color: '#C44B3F'
        }).setOrigin(0.5).setDepth(21).setVisible(false);

        // Bounce animation for turn arrow
        this._playerArrowTween = this.tweens.add({
            targets: this.playerTurnArrow,
            y: playerY - 24,
            duration: 400, yoyo: true, repeat: -1, paused: true
        });
        this._opponentArrowTween = this.tweens.add({
            targets: this.opponentTurnArrow,
            y: opponentY - 24,
            duration: 400, yoyo: true, repeat: -1, paused: true
        });

        // Chain onTurnChange
        const existingTurnChange = this.engine.onTurnChange;
        this.engine.onTurnChange = (team) => {
            if (existingTurnChange) existingTurnChange(team);
            this._updateTurnIndicator(team);
        };

        // Start with player turn indicator
        this._updateTurnIndicator('player');
    }

    _updateTurnIndicator(team) {
        if (team === 'player') {
            this.playerTurnArrow.setVisible(true);
            this._playerArrowTween.resume();
            this.opponentTurnArrow.setVisible(false);
            this._opponentArrowTween.pause();
            // Player "ready" animation - slight bob
            this.tweens.add({
                targets: this.playerSprite,
                y: this.playerSprite.y - 2,
                duration: 200, yoyo: true
            });
        } else {
            this.opponentTurnArrow.setVisible(true);
            this._opponentArrowTween.resume();
            this.playerTurnArrow.setVisible(false);
            this._playerArrowTween.pause();
            // Opponent "ready" animation
            this.tweens.add({
                targets: this.opponentSprite,
                y: this.opponentSprite.y - 2,
                duration: 200, yoyo: true
            });
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
