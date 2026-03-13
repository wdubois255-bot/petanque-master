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

export default class PetanqueScene extends Phaser.Scene {
    constructor() {
        super('PetanqueScene');
    }

    init(data) {
        this.terrainType = data.terrain || 'terre';
        this.difficulty = data.difficulty || 'easy';
        this.format = data.format || 'tete_a_tete';
    }

    create() {
        const terrainColor = TERRAIN_COLORS[this.terrainType];
        this.frictionMult = TERRAIN_FRICTION[this.terrainType];

        // Terrain offset (centered horizontally, vertically)
        this.terrainX = (GAME_WIDTH - TERRAIN_WIDTH) / 2;
        this.terrainY = (GAME_HEIGHT - TERRAIN_HEIGHT) / 2;

        this.drawTerrain(terrainColor);

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

        // Aiming
        this.aimingSystem = new AimingSystem(this, this.engine);

        // AI
        this.ai = new PetanqueAI(this, this.engine, this.difficulty);

        // Score panel
        this.scorePanel = new ScorePanel(this, this.engine);

        // Start game
        this.engine.startGame();
    }

    drawTerrain(colors) {
        const g = this.add.graphics();

        // Background
        g.fillStyle(colors.bg, 1);
        g.fillRect(this.terrainX, this.terrainY, TERRAIN_WIDTH, TERRAIN_HEIGHT);

        // Border
        g.lineStyle(1, colors.line, 0.6);
        g.strokeRect(this.terrainX, this.terrainY, TERRAIN_WIDTH, TERRAIN_HEIGHT);

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
        }
        if (this.scorePanel) {
            this.scorePanel.update();
        }
    }
}
