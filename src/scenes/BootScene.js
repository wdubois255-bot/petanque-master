import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../utils/Constants.js';
import { generateAllPortraits } from '../utils/PortraitGenerator.js';

const TIPS = [
    'Maintenez TAB pour voir le classement des boules.',
    'La plombee arrete la boule net. Ideal pres du cochonnet !',
    'Chaque personnage a des stats uniques.',
    'Le tir deplace les boules adverses, mais demande de la precision.',
    'Sous pression (10-10+), la visee tremble !',
    'La roulette roule plus loin mais est plus previsible.',
    'Le Tournoi des Quatre : 3 matchs, 4 legendes du boulodrome.',
    'Un carreau, c\'est quand votre boule prend exactement la place de l\'autre.',
];

export default class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        const BASE = import.meta.env.BASE_URL;

        // === LOADING BAR ===
        const barW = 300, barH = 20;
        const barX = (GAME_WIDTH - barW) / 2;
        const barY = GAME_HEIGHT / 2 + 20;

        // Title
        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, 'PETANQUE MASTER', {
            fontFamily: 'monospace', fontSize: '28px', color: '#FFD700',
            shadow: { offsetX: 2, offsetY: 2, color: '#1A1510', blur: 0, fill: true }
        }).setOrigin(0.5);

        // Loading text
        const loadText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 8, 'Chargement...', {
            fontFamily: 'monospace', fontSize: '14px', color: '#F5E6D0',
            shadow: { offsetX: 1, offsetY: 1, color: '#1A1510', blur: 0, fill: true }
        }).setOrigin(0.5);

        // Bar background
        const barBg = this.add.graphics();
        barBg.fillStyle(0x1A1510, 0.8);
        barBg.fillRoundedRect(barX - 2, barY - 2, barW + 4, barH + 4, 4);
        barBg.lineStyle(1, 0xD4A574, 0.5);
        barBg.strokeRoundedRect(barX - 2, barY - 2, barW + 4, barH + 4, 4);

        // Bar fill
        const barFill = this.add.graphics();

        // Tip text
        const tip = TIPS[Math.floor(Math.random() * TIPS.length)];
        this.add.text(GAME_WIDTH / 2, barY + 40, tip, {
            fontFamily: 'monospace', fontSize: '11px', color: '#D4A574',
            shadow: { offsetX: 1, offsetY: 1, color: '#1A1510', blur: 0, fill: true },
            wordWrap: { width: 400 }, align: 'center'
        }).setOrigin(0.5);

        // Progress events
        this.load.on('progress', (value) => {
            barFill.clear();
            barFill.fillStyle(0xD4A574, 1);
            barFill.fillRoundedRect(barX, barY, barW * value, barH, 3);
            barFill.fillStyle(0xFFD700, 0.3);
            barFill.fillRoundedRect(barX, barY, barW * value, barH / 2, 3);
            loadText.setText(`Chargement... ${Math.floor(value * 100)}%`);
        });

        this.load.on('complete', () => {
            loadText.setText('Pret !');
        });

        // === LOAD ASSETS ===
        this.load.json('boules', `${BASE}data/boules.json`);
        this.load.json('characters', `${BASE}data/characters.json`);
        this.load.json('terrains', `${BASE}data/terrains.json`);
        this.load.json('arcade', `${BASE}data/arcade.json`);
        this.load.json('npcs', `${BASE}data/npcs.json`);
        this.load.json('progression', `${BASE}data/progression.json`);
        this.load.json('shop', `${BASE}data/shop.json`);

        // Tileset (Pipoya basechip + water tiles combined)
        this.load.image('basechip_combined', `${BASE}assets/tilesets/basechip_combined.png`);

        // Rookie static sprite
        this.load.image('rookie_static', `${BASE}assets/sprites/rookie_final.png`);

        // Character spritesheets (Scale4x+Lanczos upscaled, 512x512: 4 cols x 4 rows of 128x128)
        const charSprites = [
            'ley_animated', 'le_magicien_animated',
            'la_choupe_animated', 'marcel_animated',
            'reyes_animated'
        ];
        for (const key of charSprites) {
            this.load.spritesheet(key, `${BASE}assets/sprites/${key}.png`, {
                frameWidth: 128, frameHeight: 128
            });
        }

        // Throw animation spritesheets (frame-by-frame lancer)
        const throwSprites = [
            { key: 'ley_throw', frames: 5 },
            { key: 'le_magicien_throw', frames: 4 },
            { key: 'la_choupe_throw', frames: 4 },
            { key: 'marcel_throw', frames: 4 },
            { key: 'reyes_throw', frames: 5 }
        ];
        for (const ts of throwSprites) {
            this.load.spritesheet(ts.key, `${BASE}assets/sprites/${ts.key}.png`, {
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
            // Silently ignore missing Tiled maps — procedural generation will be used
        });

        // Boules sprites — standard (3D style)
        this.load.image('ball_acier', `${BASE}assets/sprites/boule_acier.png`);
        this.load.image('ball_bronze', `${BASE}assets/sprites/boule_bronze.png`);
        this.load.image('ball_chrome', `${BASE}assets/sprites/boule_chrome.png`);
        this.load.image('ball_noire', `${BASE}assets/sprites/boule_noire.png`);
        this.load.image('ball_rouge', `${BASE}assets/sprites/boule_rouge.png`);
        this.load.image('ball_doree', `${BASE}assets/sprites/boule_doree.png`);
        this.load.image('ball_rouille', `${BASE}assets/sprites/boule_rouille.png`);
        this.load.image('ball_bleue', `${BASE}assets/sprites/boule_bleue.png`);
        this.load.image('ball_cuivre', `${BASE}assets/sprites/boule_cuivre.png`);
        this.load.image('ball_titane', `${BASE}assets/sprites/boule_titane.png`);
        // (Retro boules removed — same visuals as standard boules)
        // Cochonnets (pixel art only — classique + variantes)
        this.load.image('ball_cochonnet', `${BASE}assets/sprites/cochonnet.png`);
        this.load.image('ball_cochonnet_bleu', `${BASE}assets/sprites/cochonnet_bleu.png`);
        this.load.image('ball_cochonnet_vert', `${BASE}assets/sprites/cochonnet_vert.png`);
        this.load.image('ball_cochonnet_rouge', `${BASE}assets/sprites/cochonnet_rouge.png`);
        this.load.image('ball_cochonnet_jungle', `${BASE}assets/sprites/cochonnet_jungle.png`);
        this.load.image('ball_cochonnet_multicolor', `${BASE}assets/sprites/cochonnet_multicolor.png`);

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
    }

    create() {
        // Enable LINEAR filtering on HD character spritesheets (128px displayed at 0.5x)
        const charSprites2 = [
            'ley_animated', 'le_magicien_animated',
            'la_choupe_animated', 'marcel_animated',
            'reyes_animated'
        ];
        for (const key of charSprites2) {
            if (this.textures.exists(key)) {
                this.textures.get(key).setFilter(Phaser.Textures.FilterMode.LINEAR);
            }
        }

        // Generate procedural portraits for all characters
        generateAllPortraits(this);

        this.scene.start('TitleScene');
    }
}
