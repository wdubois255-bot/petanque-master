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

        // Character spritesheets (Scale4x+Lanczos upscaled, 512x512: 4 cols x 4 rows of 128x128)
        const charSprites = [
            'rene_animated', 'marcel_animated', 'fanny_animated',
            'ricardo_animated', 'thierry_animated', 'marius_animated'
        ];
        for (const key of charSprites) {
            this.load.spritesheet(key, `${BASE}assets/sprites/${key}.png`, {
                frameWidth: 128, frameHeight: 128
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

        // Terrain surface textures (seamless 64x64)
        this.load.image('terrain_tex_terre', `${BASE}assets/sprites/terrain_tex_terre.png`);
        this.load.image('terrain_tex_herbe', `${BASE}assets/sprites/terrain_tex_herbe.png`);
        this.load.image('terrain_tex_sable', `${BASE}assets/sprites/terrain_tex_sable.png`);
        this.load.image('terrain_tex_dalles', `${BASE}assets/sprites/terrain_tex_dalles.png`);

        // Border 9-slice textures (48x48)
        this.load.image('border_wood', `${BASE}assets/sprites/border_wood_9slice.png`);
        this.load.image('border_stone', `${BASE}assets/sprites/border_stone_9slice.png`);

        // Decor sprites (provencal)
        this.load.image('decor_pin', `${BASE}assets/sprites/decor_pin.png`);
        this.load.image('decor_olivier', `${BASE}assets/sprites/decor_olivier.png`);
        this.load.image('decor_banc', `${BASE}assets/sprites/decor_banc.png`);
        this.load.image('decor_fontaine', `${BASE}assets/sprites/decor_fontaine.png`);

        // Audio - SFX (ElevenLabs generated)
        const sfxFiles = [
            'boule_clac', 'boule_roulement', 'boule_atterrissage',
            'cochonnet_touche', 'cigales_ambiance', 'lancer_swoosh',
            'victoire', 'defaite', 'carreau', 'point_marque',
            'ui_click', 'brise_vent'
        ];
        for (const sfx of sfxFiles) {
            this.load.audio(`sfx_${sfx}`, `${BASE}assets/audio/sfx/${sfx}.mp3`);
        }
        // Audio - Music
        this.load.audio('music_match', `${BASE}assets/audio/music/match_theme.mp3`);
        this.load.audio('music_title', `${BASE}assets/audio/music/title_theme.mp3`);

        // Loading text
        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Chargement...', {
            fontFamily: 'monospace',
            fontSize: '24px',
            color: '#F5E6D0',
            shadow: { offsetX: 2, offsetY: 2, color: '#1A1510', blur: 0, fill: true }
        }).setOrigin(0.5);
    }

    create() {
        // Enable LINEAR filtering on HD character spritesheets (128px displayed at 0.5x)
        // This overrides the global pixelArt: true for these textures only,
        // allowing smooth downsampling instead of nearest-neighbor
        const charSprites = [
            'rene_animated', 'marcel_animated', 'fanny_animated',
            'ricardo_animated', 'thierry_animated', 'marius_animated'
        ];
        for (const key of charSprites) {
            if (this.textures.exists(key)) {
                this.textures.get(key).setFilter(Phaser.Textures.FilterMode.LINEAR);
            }
        }

        this.scene.start('TitleScene');
    }
}
