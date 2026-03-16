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

        // Tileset (Pipoya basechip + water tiles combined)
        this.load.image('basechip_combined', `${BASE}assets/tilesets/basechip_combined.png`);

        // Player spritesheet (PixelLab chibi animated, 128x128: 4 cols x 4 rows of 32x32)
        this.load.spritesheet('player', `${BASE}assets/sprites/player_animated.png`, {
            frameWidth: 32, frameHeight: 32
        });

        // Story characters (PixelLab chibi animated, same format)
        const storySprites = ['bastien_animated', 'marcel_animated', 'papet_animated'];
        for (const key of storySprites) {
            this.load.spritesheet(key, `${BASE}assets/sprites/${key}.png`, {
                frameWidth: 32, frameHeight: 32
            });
        }

        // Generic NPC spritesheets (Pipoya 128x128: 4 cols x 4 rows of 32x32)
        const spriteKeys = [
            'player_pipoya', 'npc_maitre', 'npc_marcel', 'npc_rival',
            'npc_dresseur_1', 'npc_dresseur_2', 'npc_dresseur_3',
            'npc_villager_1', 'npc_villager_2', 'npc_gate',
            'npc_villager_3', 'npc_enfant', 'npc_fanny', 'npc_mamie',
            'npc_villager_4', 'npc_villager_5', 'npc_villager_6',
            'animal_chat', 'animal_chien', 'npc_guard'
        ];
        for (const key of spriteKeys) {
            this.load.spritesheet(key, `${BASE}assets/sprites/${key}.png`, {
                frameWidth: 32, frameHeight: 32
            });
        }

        // Loading text
        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Chargement...', {
            fontFamily: 'monospace',
            fontSize: '24px',
            color: '#F5E6D0',
            shadow: { offsetX: 2, offsetY: 2, color: '#1A1510', blur: 0, fill: true }
        }).setOrigin(0.5);
    }

    create() {
        this.scene.start('TitleScene');
    }
}
