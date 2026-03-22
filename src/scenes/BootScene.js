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

        // V2 characters — individual direction PNGs (composed into spritesheets in create())
        const V2_CHARS = [
            'fazzino', 'foyot', 'mamie_josette', 'papi_rene',
            'rizzi', 'robineau', 'rocher', 'sofia', 'suchaud',
            'rookie',
            { name: 'la_choupe', folder: 'la_choupe_v2' },
            { name: 'ley', folder: 'ley_v2_zip' }
        ];
        const V2_DIRS = ['south', 'east', 'west', 'north'];
        for (const entry of V2_CHARS) {
            const charName = typeof entry === 'string' ? entry : entry.name;
            const folder = typeof entry === 'string' ? entry : entry.folder;
            for (const dir of V2_DIRS) {
                this.load.image(
                    `_v2_${charName}_${dir}`,
                    `${BASE}assets/sprites/v2_new/characters/${folder}/rotations/${dir}.png`
                );
            }
        }

        // V2 UI assets
        this.load.image('v2_logo', `${BASE}assets/sprites/v2_new/ui/logo.png`);
        this.load.image('v2_panel_simple', `${BASE}assets/sprites/v2_new/ui/panel_simple.png`);
        this.load.image('v2_panel_ornate', `${BASE}assets/sprites/v2_new/ui/panel_ornate.png`);
        this.load.image('v2_panel_bolted', `${BASE}assets/sprites/v2_new/ui/panel_bolted.png`);
        this.load.image('v2_panel_elegant', `${BASE}assets/sprites/v2_new/ui/panel_elegant.png`);
        this.load.image('v2_button', `${BASE}assets/sprites/v2_new/ui/button_empty.png`);
        this.load.image('v2_bar_power', `${BASE}assets/sprites/v2_new/ui/bar_power.png`);
        this.load.image('v2_bar_decorative', `${BASE}assets/sprites/v2_new/ui/bar_decorative.png`);
        this.load.spritesheet('v2_icon_galet', `${BASE}assets/sprites/v2_new/ui/icon_galet.png`, { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('v2_icon_star', `${BASE}assets/sprites/v2_new/ui/icon_star.png`, { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('v2_frame_portrait', `${BASE}assets/sprites/v2_new/ui/frame_portrait.png`, { frameWidth: 64, frameHeight: 64 });

        // V2 UI assets — additional (renamed from PixelLab raw filenames)
        this.load.image('v2_dialog_bg', `${BASE}assets/sprites/v2_new/ui/pixellab--pixelart-parchment-scroll-dia-1774131345495.png`);
        this.load.spritesheet('v2_trophy', `${BASE}assets/sprites/v2_new/ui/pixellab-pixel-art-golden-trophy-cup--p-1774128480289.png`, { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet('v2_padlock', `${BASE}assets/sprites/v2_new/ui/pixellab-pixel-art-padlock-icon--old-ru-1774127936948.png`, { frameWidth: 32, frameHeight: 32 });
        this.load.image('v2_button_pressed', `${BASE}assets/sprites/v2_new/ui/pixellab-pixel-art-wooden-button-presse-1774131193265.png`);
        this.load.spritesheet('v2_stat_icons', `${BASE}assets/sprites/v2_new/ui/pixellab-pixel-art-game-stat-icon-set---1774128154376.png`, {
            frameWidth: 64, frameHeight: 64
        });
        this.load.image('v2_terrain_terre', `${BASE}assets/sprites/v2_new/ui/pixellab-packed-brown-earth-petanque-te-1774130926511.png`);

        // Throw animation spritesheets (v2 — will be in v2_new/throw_anims/ when generated)
        // Currently empty — throw animations use squash/stretch fallback

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
        // Compose V2 character spritesheets from individual direction PNGs
        // Layout: 4x4 grid (128x128 each), rows = south/east/west/north, cols = walk frames (duplicated)
        const V2_CHARS_CREATE = [
            'fazzino', 'foyot', 'mamie_josette', 'papi_rene',
            'rizzi', 'robineau', 'rocher', 'sofia', 'suchaud',
            'rookie', 'la_choupe', 'ley'
        ];
        const V2_DIRS = ['south', 'east', 'west', 'north'];

        for (const charName of V2_CHARS_CREATE) {
            const key = `${charName}_animated`;
            const canvas = this.textures.createCanvas(key, 512, 512);
            const ctx = canvas.context;

            // Pixel art: no smoothing when scaling 124→128
            ctx.imageSmoothingEnabled = false;

            for (let row = 0; row < 4; row++) {
                const dirKey = `_v2_${charName}_${V2_DIRS[row]}`;
                if (this.textures.exists(dirKey)) {
                    const img = this.textures.get(dirKey).getSourceImage();
                    // Same image 4x across the row (no walk animation yet)
                    for (let col = 0; col < 4; col++) {
                        ctx.drawImage(img, 0, 0, img.width, img.height,
                            col * 128, row * 128, 128, 128);
                    }
                }
            }
            canvas.refresh();

            // Add spritesheet frame data (0-15)
            const texture = this.textures.get(key);
            for (let i = 0; i < 16; i++) {
                texture.add(i, 0, (i % 4) * 128, Math.floor(i / 4) * 128, 128, 128);
            }
            texture.setFilter(Phaser.Textures.FilterMode.LINEAR);

            // Cleanup temporary direction textures
            for (const dir of V2_DIRS) {
                const tempKey = `_v2_${charName}_${dir}`;
                if (this.textures.exists(tempKey)) {
                    this.textures.remove(tempKey);
                }
            }
        }

        // Generate procedural portraits for all characters
        generateAllPortraits(this);

        this.scene.start('TitleScene');
    }
}
