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

        // Player spritesheet (PixelLab classic downscaled to 32x32 with outline)
        this.load.spritesheet('player', `${BASE}assets/sprites/player_classic.png`, {
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

        // Tiled maps (.tmj) - try to load for each map, will silently fail if not found
        const mapNames = [
            'village_depart', 'route_1', 'village_arene_1', 'route_2',
            'village_arene_2', 'route_3', 'village_arene_3', 'arene_finale'
        ];
        for (const name of mapNames) {
            this.load.tilemapTiledJSON(`${name}_tiled`, `${BASE}assets/maps/${name}.tmj`);
        }
        // Don't fail the whole boot if .tmj files are missing
        this.load.on('loaderror', (file) => {
            if (file.key && file.key.endsWith('_tiled')) {
                console.log(`[BootScene] No Tiled map for ${file.key}, will use procedural`);
            }
        });

        // Boules sprites (custom pixel art)
        this.load.image('ball_acier', `${BASE}assets/sprites/boule_acier.png`);
        this.load.image('ball_bronze', `${BASE}assets/sprites/boule_bronze.png`);
        this.load.image('ball_chrome', `${BASE}assets/sprites/boule_chrome.png`);
        this.load.image('ball_cochonnet', `${BASE}assets/sprites/cochonnet.png`);
        this.load.image('ball_opponent', `${BASE}assets/sprites/boule_chrome.png`);

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
