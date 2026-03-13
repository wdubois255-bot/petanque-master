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
    }

    create() {
        // Title text
        this.add.text(
            GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30,
            'PETANQUE MASTER',
            {
                fontFamily: 'monospace',
                fontSize: '20px',
                color: '#F5E6D0',
                align: 'center'
            }
        ).setOrigin(0.5);

        // Subtitle
        this.add.text(
            GAME_WIDTH / 2, GAME_HEIGHT / 2 + 5,
            'Devenez le meilleur bouliste du canton !',
            {
                fontFamily: 'monospace',
                fontSize: '7px',
                color: '#D4A574',
                align: 'center'
            }
        ).setOrigin(0.5);

        // Click to start
        const startText = this.add.text(
            GAME_WIDTH / 2, GAME_HEIGHT / 2 + 35,
            'Cliquer pour jouer',
            {
                fontFamily: 'monospace',
                fontSize: '8px',
                color: '#F5E6D0',
                align: 'center'
            }
        ).setOrigin(0.5);

        // Blink effect
        this.tweens.add({
            targets: startText,
            alpha: { from: 1, to: 0.3 },
            duration: 600,
            yoyo: true,
            repeat: -1
        });

        this.input.once('pointerdown', () => {
            if (this.sound.locked) {
                this.sound.unlock();
            }
            this.scene.start('OverworldScene', {
                map: 'village_depart',
                spawnX: 14,
                spawnY: 20
            });
        });
    }
}
