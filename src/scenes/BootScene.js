import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '../utils/Constants.js';

export default class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        const BASE = import.meta.env.BASE_URL;
        this.load.json('boules', `${BASE}data/boules.json`);
        this.load.json('npcs', `${BASE}data/npcs.json`);
        this.load.json('progression', `${BASE}data/progression.json`);

        // Loading text
        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Chargement...', {
            fontFamily: 'monospace',
            fontSize: '12px',
            color: '#F5E6D0',
            shadow: { offsetX: 1, offsetY: 1, color: '#1A1510', blur: 0, fill: true }
        }).setOrigin(0.5);
    }

    create() {
        this.scene.start('TitleScene');
    }
}
