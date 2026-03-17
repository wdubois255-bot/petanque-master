import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../utils/Constants.js';

export default class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        const BASE = import.meta.env.BASE_URL;
        this.load.json('boules', `${BASE}data/boules.json`);
        this.load.json('characters', `${BASE}data/characters.json`);
        this.load.json('terrains', `${BASE}data/terrains.json`);
        this.load.json('arcade', `${BASE}data/arcade.json`);
        this.load.json('npcs', `${BASE}data/npcs.json`);
        this.load.json('progression', `${BASE}data/progression.json`);

        // Tileset (Pipoya basechip + water tiles combined)
        this.load.image('basechip_combined', `${BASE}assets/tilesets/basechip_combined.png`);

        // Character spritesheets (PixelLab chibi, 128x128: 4 cols x 4 rows of 32x32)
        const charSprites = [
            'rene_animated', 'marcel_animated', 'fanny_animated',
            'ricardo_animated', 'thierry_animated', 'marius_animated'
        ];
        for (const key of charSprites) {
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
        this.load.image('ball_noire', `${BASE}assets/sprites/boule_noire.png`);
        this.load.image('ball_rouge', `${BASE}assets/sprites/boule_rouge.png`);
        this.load.image('ball_cochonnet', `${BASE}assets/sprites/cochonnet.png`);
        this.load.image('ball_cochonnet_bleu', `${BASE}assets/sprites/cochonnet_bleu.png`);
        this.load.image('ball_cochonnet_vert', `${BASE}assets/sprites/cochonnet_vert.png`);

        // Terrain decoration sprites (PixelLab)
        this.load.image('terrain_herbe_touffe', `${BASE}assets/sprites/terrain_herbe_touffe.png`);
        this.load.image('terrain_fissure', `${BASE}assets/sprites/terrain_fissure.png`);
        this.load.image('terrain_planche_bord', `${BASE}assets/sprites/terrain_planche_bord.png`);

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
