import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '../utils/Constants.js';

export default class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        const BASE = import.meta.env.BASE_URL;
        this.load.json('boules', `${BASE}data/boules.json`);
    }

    create() {
        // Unlock audio screen
        const text = this.add.text(
            GAME_WIDTH / 2, GAME_HEIGHT / 2,
            'PETANQUE MASTER\n\nCliquer pour jouer',
            {
                fontFamily: 'monospace',
                fontSize: '16px',
                color: '#F5E6D0',
                align: 'center'
            }
        ).setOrigin(0.5);

        this.input.once('pointerdown', () => {
            if (this.sound.locked) {
                this.sound.unlock();
            }
            this.scene.start('PetanqueScene', {
                terrain: 'terre',
                difficulty: 'easy',
                format: 'tete_a_tete'
            });
        });
    }
}
