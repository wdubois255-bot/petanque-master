import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, FONT_PIXEL } from '../utils/Constants.js';
import { generateAllPortraits } from '../utils/PortraitGenerator.js';
import { onSaveFailure } from '../utils/SaveManager.js';
import UIFactory from '../ui/UIFactory.js';
import PortalSDK from '../utils/PortalSDK.js';
import I18n from '../utils/I18n.js';

export default class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    init() {
        // Reset all flags for scene reuse (CLAUDE.md rule)
        this._loadComplete = false;
    }

    preload() {
        const BASE = import.meta.env.BASE_URL;

        // === LOADING BAR ===
        const barW = 300, barH = 20;
        const barX = (GAME_WIDTH - barW) / 2;
        const barY = GAME_HEIGHT / 2 + 20;

        // Title
        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, I18n.t('boot.title'), {
            fontFamily: FONT_PIXEL, fontSize: '24px', color: '#FFD700',
            shadow: { offsetX: 2, offsetY: 2, color: '#1A1510', blur: 0, fill: true }
        }).setOrigin(0.5);

        // Loading text
        const loadText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 8, I18n.t('boot.loading'), {
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
        const _tips = I18n.ta('boot.tips');
        const tip = _tips.length > 0 ? _tips[Math.floor(Math.random() * _tips.length)] : '';
        this.add.text(GAME_WIDTH / 2, barY + 40, tip, {
            fontFamily: 'monospace', fontSize: '12px', color: '#D4A574',
            shadow: { offsetX: 1, offsetY: 1, color: '#1A1510', blur: 0, fill: true },
            wordWrap: { width: 500 }, align: 'center', lineSpacing: 4
        }).setOrigin(0.5);

        // Progress events
        this.load.on('progress', (value) => {
            barFill.clear();
            barFill.fillStyle(0xD4A574, 1);
            barFill.fillRoundedRect(barX, barY, barW * value, barH, 3);
            barFill.fillStyle(0xFFD700, 0.3);
            barFill.fillRoundedRect(barX, barY, barW * value, barH / 2, 3);
            loadText.setText(I18n.t('boot.loading_pct', { pct: Math.floor(value * 100) }));
        });

        this.load.on('complete', () => {
            loadText.setText(I18n.t('boot.ready'));
        });

        // === LOAD ASSETS ===
        this.load.json('boules', `${BASE}data/boules.json`);
        this.load.json('characters', `${BASE}data/characters.json`);
        this.load.json('terrains', `${BASE}data/terrains.json`);
        this.load.json('arcade', `${BASE}data/arcade.json`);
        this.load.json('npcs', `${BASE}data/npcs.json`);
        this.load.json('progression', `${BASE}data/progression.json`);
        this.load.json('shop', `${BASE}data/shop.json`);
        this.load.json('commentator', `${BASE}data/commentator.json`);

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
        this.load.image('v2_terrain_terre', `${BASE}assets/sprites/v2_new/terrains/pixellab-packed-brown-earth-petanque-te-1774130926511.png`);

        // Throw animation spritesheets (v2 — 4 frames 128x128 each, horizontal strip 512x128)
        const THROW_CHARS = [
            'rookie', 'la_choupe', 'ley', 'foyot', 'suchaud',
            'mamie_josette', 'sofia', 'robineau', 'rocher', 'rizzi',
            'fazzino', 'papi_rene'
        ];
        for (const charId of THROW_CHARS) {
            this.load.spritesheet(`throw_${charId}`, `${BASE}assets/sprites/v2_new/throw_anims/sheets/throw_${charId}.png`, {
                frameWidth: 128, frameHeight: 128
            });
        }

        // Tiled maps: disabled — Overworld uses procedural generation (MapManager.js)
        // .tmj files will be loaded here when V2 hand-crafted maps are ready

        // Boules v3 — 16 couleurs, pixel art avec 6-frame roll animation (384x64)
        const BOULES = [
            'acier', 'bronze', 'doree', 'cuivre',
            'noire', 'bleue', 'rouge', 'emeraude',
            'rouille', 'titane', 'lavande', 'ivoire',
            'obsidienne', 'corail', 'sable', 'chrome'
        ];
        for (const id of BOULES) {
            this.load.spritesheet(`ball_${id}`, `${BASE}assets/sprites/boules_v3/boule_${id}.png`, {
                frameWidth: 64, frameHeight: 64
            });
        }
        // Cochonnets (pixel art only — classique + variantes)
        this.load.image('ball_cochonnet', `${BASE}assets/sprites/cochonnet.png`);
        this.load.image('ball_cochonnet_bleu', `${BASE}assets/sprites/cochonnet_bleu.png`);
        this.load.image('ball_cochonnet_vert', `${BASE}assets/sprites/cochonnet_vert.png`);
        this.load.image('ball_cochonnet_rouge', `${BASE}assets/sprites/cochonnet_rouge.png`);
        this.load.image('ball_cochonnet_jungle', `${BASE}assets/sprites/cochonnet_jungle.png`);
        this.load.image('ball_cochonnet_multicolor', `${BASE}assets/sprites/cochonnet_multicolor.png`);

        // Shop ability icons
        this.load.image('icon_focus_extra', `${BASE}assets/sprites/icon_focus_extra.png`);
        this.load.image('icon_charge_extra', `${BASE}assets/sprites/icon_charge_extra.png`);

        // Terrain objects (sprites placés sur la surface, définis dans terrain_objects.json)
        this.load.json('terrain_objects', `${BASE}data/terrain_objects.json`);
        const toBase = `${BASE}assets/sprites/v2_new/terrains/`;
        this.load.image('to_pierres_07',    `${toBase}pierres/pierres_07.png`);
        this.load.image('to_pierres_13',    `${toBase}pierres/pierres_13.png`);
        this.load.image('to_touffe_new_01', `${toBase}herbe_touffes/new/touffe_new_01.png`);
        this.load.image('to_touffe_new_04', `${toBase}herbe_touffes/new/touffe_new_04.png`);
        // Rivets docks (12 variants sur 64 disponibles)
        for (const n of [3, 8, 13, 18, 23, 28, 33, 38, 43, 48, 53, 58]) {
            const p = String(n).padStart(2, '0');
            this.load.image(`to_rivet_${p}`, `${toBase}dalles/rivets/rivet_${p}.png`);
        }
        // Coquillages plage (16 variants)
        for (let i = 1; i <= 16; i++) {
            const p = String(i).padStart(2, '0');
            this.load.image(`to_coquillage_new_${p}`, `${toBase}sable_details/new/coquillage_new_${p}.png`);
        }

        // Terrain surface textures (seamless)
        this.load.image('terrain_tex_terre',  `${toBase}terre_battue/terre_13.png`);
        this.load.image('terrain_tex_herbe',  `${toBase}herbe/herbe_15_seamless.png`);
        this.load.image('terrain_tex_sable',  `${toBase}sable/sable_10_seamless.png`);
        this.load.image('terrain_tex_dalles', `${toBase}dalles/dalles_13.png`);

        // Border textures per terrain
        // Village — rondins bois clair
        this.load.image('border_wood_h', `${BASE}assets/sprites/border_wood_h.png`);
        this.load.image('border_wood_v', `${BASE}assets/sprites/border_wood_v.png`);
        this.load.image('border_wood_corner', `${BASE}assets/sprites/border_corner.png`);
        // Pre-baked rondin ends for village corners
        this.load.image('corner_tl_v', `${BASE}assets/sprites/borders/corner_tl_v.png`);
        this.load.image('corner_tl_h', `${BASE}assets/sprites/borders/corner_tl_h.png`);
        this.load.image('corner_tr_v', `${BASE}assets/sprites/borders/corner_tr_v.png`);
        this.load.image('corner_tr_h', `${BASE}assets/sprites/borders/corner_tr_h.png`);
        this.load.image('corner_bl_v', `${BASE}assets/sprites/borders/corner_bl_v.png`);
        this.load.image('corner_bl_h', `${BASE}assets/sprites/borders/corner_bl_h.png`);
        this.load.image('corner_br_v', `${BASE}assets/sprites/borders/corner_br_v.png`);
        this.load.image('corner_br_h', `${BASE}assets/sprites/borders/corner_br_h.png`);
        // Parc — planches sombres
        this.load.image('border_parc_h', `${BASE}assets/sprites/borders/parc/border_h.png`);
        this.load.image('border_parc_v', `${BASE}assets/sprites/borders/parc/border_v.png`);
        this.load.image('border_parc_corner_tl', `${BASE}assets/sprites/borders/parc/corner_tl.png`);
        this.load.image('border_parc_corner_tr', `${BASE}assets/sprites/borders/parc/corner_tr.png`);
        this.load.image('border_parc_corner_bl', `${BASE}assets/sprites/borders/parc/corner_bl.png`);
        this.load.image('border_parc_corner_br', `${BASE}assets/sprites/borders/parc/corner_br.png`);
        // Colline — pierres sèches
        this.load.image('border_colline_h', `${BASE}assets/sprites/borders/colline/border_h.png`);
        this.load.image('border_colline_v', `${BASE}assets/sprites/borders/colline/border_v.png`);
        this.load.image('border_colline_corner_tl', `${BASE}assets/sprites/borders/colline/corner_tl.png`);
        this.load.image('border_colline_corner_tr', `${BASE}assets/sprites/borders/colline/corner_tr.png`);
        this.load.image('border_colline_corner_bl', `${BASE}assets/sprites/borders/colline/corner_bl.png`);
        this.load.image('border_colline_corner_br', `${BASE}assets/sprites/borders/colline/corner_br.png`);
        // Docks — rails métalliques
        this.load.image('border_docks_h', `${BASE}assets/sprites/borders/docks/border_h.png`);
        this.load.image('border_docks_v', `${BASE}assets/sprites/borders/docks/border_v.png`);
        this.load.image('border_docks_corner_tl', `${BASE}assets/sprites/borders/docks/corner_tl.png`);
        this.load.image('border_docks_corner_tr', `${BASE}assets/sprites/borders/docks/corner_tr.png`);
        this.load.image('border_docks_corner_bl', `${BASE}assets/sprites/borders/docks/corner_bl.png`);
        this.load.image('border_docks_corner_br', `${BASE}assets/sprites/borders/docks/corner_br.png`);

        // Greeting animation spritesheets (4 frames of 128x128, horizontal strip 512x128)
        const GREETING_CHARS = [
            'la_choupe', 'ley', 'fazzino', 'rocher', 'suchaud',
            'rizzi', 'robineau', 'mamie_josette', 'sofia',
            'rookie', 'foyot', 'papi_rene'
        ];
        for (const charName of GREETING_CHARS) {
            this.load.spritesheet(`${charName}_greeting`, `${BASE}assets/sprites/${charName}_greeting.png`, {
                frameWidth: 128, frameHeight: 128
            });
        }

        // Decor sprites (provencal) — old single sprites as fallback
        this.load.image('decor_pin', `${BASE}assets/sprites/decor_pin.png`);
        this.load.image('decor_olivier', `${BASE}assets/sprites/decor_olivier.png`);
        this.load.image('decor_banc', `${BASE}assets/sprites/decor_banc.png`);
        this.load.image('decor_fontaine', `${BASE}assets/sprites/decor_fontaine.png`);

        // Decor sprite grids (PixelLab 4x4, 64x64 per frame — 16 variants each)
        this.load.spritesheet('grid_olive', `${BASE}assets/sprites/decor/grid_olive.png`, { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet('grid_fontaine', `${BASE}assets/sprites/decor/grid_fontaine.png`, { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet('grid_banc_v1', `${BASE}assets/sprites/decor/grid_banc_v1.png`, { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet('grid_banc_v2', `${BASE}assets/sprites/decor/grid_banc_v2.png`, { frameWidth: 64, frameHeight: 64 });

        // New decor sprite grids (PixelLab 4x4, 64x64 frames)
        const decorBase = `${BASE}assets/sprites/decor/`;
        this.load.spritesheet('grid_tree', `${decorBase}pixellab-pixel-art-top-down-tree--direc-1774279608365.png`, { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet('grid_herbe', `${decorBase}pixellab-pixel-art-grass-tuft--top-down-1774283489357.png`, { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet('grid_stones', `${decorBase}pixellab-pixel-art-small-scattered-ston-1774283903515.png`, { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet('grid_table', `${decorBase}pixellab-pixel-art-small-outdoor-table--1774282453490.png`, { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet('grid_banc_td', `${decorBase}pixellab-pixel-art-wooden-bench--top-do-1774281600119.png`, { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet('grid_sac', `${decorBase}pixellab-pixel-art-p-tanque-ball-bag--t-1774282033460.png`, { frameWidth: 64, frameHeight: 64 });
        // Nouveaux décors provençaux (générés session PLAN_PHASE2)
        this.load.spritesheet('grid_items_retro', `${BASE}assets/sprites/v2_new/ui/pixellab-Top-down-retro-8-bit-style-bro-1774223172989.png`, { frameWidth: 64, frameHeight: 64 });
        // Anciens "inutilisés" promus en décors actifs
        this.load.image('decor_willow',         `${decorBase}_unused/decor_tree_willow.png`);
        this.load.spritesheet('grid_scoreboard',`${decorBase}_unused/pixellab-pixel-art-small-p-tanque-score-1774283062999.png`, { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet('grid_dusty',     `${decorBase}_unused/pixellab-pixel-art-dusty-ground-tile-fo-1774281809868.png`, { frameWidth: 64, frameHeight: 64 });
        this.load.image('grid_pastis',   `${decorBase}grid_pastis.png`);
        this.load.image('grid_parasol',  `${decorBase}grid_parasol.png`);
        this.load.image('grid_lavande',  `${decorBase}grid_lavande.png`);
        this.load.image('grid_glaciere', `${decorBase}grid_glaciere.png`);
        // Banc et fontaine v2 (grids ui/)
        const uiBase = `${BASE}assets/sprites/v2_new/ui/`;
        this.load.spritesheet('grid_fontaine_pierre', `${uiBase}pixellab-pixel-art-stone-fountain--roun-1774270327746.png`, { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet('grid_banc_v3', `${uiBase}pixellab-pixel-art-wooden-park-bench--w-1774269873380.png`, { frameWidth: 64, frameHeight: 64 });

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

    async create() {
        // Initialiser le Portal SDK (no-op en standalone/itch.io)
        await PortalSDK.init();

        // Register save failure handler (shows warning on localStorage quota exceeded)
        onSaveFailure(() => {
            const activeScene = this.scene.manager.getScenes(true)[0];
            if (activeScene) {
                UIFactory.showFloatingText(activeScene, GAME_WIDTH / 2, 20,
                    I18n.t('boot.save_failed'), '#C44B3F',
                    { fontSize: '12px', duration: 3000, depth: 200 });
            }
        });

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

        // Create greeting animations (4-frame loop per character)
        const GREETING_CHARS_ANIM = [
            'la_choupe', 'ley', 'fazzino', 'rocher', 'suchaud',
            'rizzi', 'robineau', 'mamie_josette', 'sofia',
            'rookie', 'foyot', 'papi_rene'
        ];
        for (const charName of GREETING_CHARS_ANIM) {
            const greetKey = `${charName}_greeting`;
            if (this.textures.exists(greetKey)) {
                this.anims.create({
                    key: `${charName}_greet`,
                    frames: this.anims.generateFrameNumbers(greetKey, { start: 0, end: 3 }),
                    frameRate: 4,
                    repeat: -1
                });
            }
        }

        // Generate procedural UI textures (wood panels, buttons, parchment)
        UIFactory.generateUITextures(this);

        // Generate procedural portraits for all characters
        generateAllPortraits(this);

        // Signaler au SDK portail que le chargement est terminé (Poki)
        PortalSDK.loadingFinished();

        this.scene.start('TitleScene');
    }

    shutdown() {
        this.load.removeAllListeners('progress');
        this.load.removeAllListeners('complete');
        this.load.removeAllListeners('loaderror');
    }
}
