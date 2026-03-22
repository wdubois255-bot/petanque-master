import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, CHAR_SPRITE_MAP, CHAR_SCALE_QUICKPLAY, FONT_PIXEL, FONT_BODY, COLORS, CSS, SHADOW_TEXT, UI } from '../utils/Constants.js';
import { setSoundScene, sfxUIClick } from '../utils/SoundManager.js';
import { loadSave } from '../utils/SaveManager.js';
import UIFactory from '../ui/UIFactory.js';

const SHADOW = SHADOW_TEXT;

const CHAR_VALUES = [
    { display: 'Le Rookie', key: 'rookie_animated', sprite: 'rookie_animated', charId: 'rookie' },
    { display: 'La Choupe', key: 'la_choupe_animated', sprite: 'la_choupe_animated', charId: 'la_choupe' },
    { display: 'Ley', key: 'ley_animated', sprite: 'ley_animated', charId: 'ley' },
    { display: 'Foyot', key: 'foyot_animated', sprite: 'foyot_animated', charId: 'foyot' },
    { display: 'Suchaud', key: 'suchaud_animated', sprite: 'suchaud_animated', charId: 'suchaud' },
    { display: 'Fazzino', key: 'fazzino_animated', sprite: 'fazzino_animated', charId: 'fazzino' },
    { display: 'Rocher', key: 'rocher_animated', sprite: 'rocher_animated', charId: 'rocher' },
    { display: 'Robineau', key: 'robineau_animated', sprite: 'robineau_animated', charId: 'robineau' },
    { display: 'Mamie Josette', key: 'mamie_josette_animated', sprite: 'mamie_josette_animated', charId: 'mamie_josette' },
    { display: 'Sofia', key: 'sofia_animated', sprite: 'sofia_animated', charId: 'sofia' },
    { display: 'Papi Rene', key: 'papi_rene_animated', sprite: 'papi_rene_animated', charId: 'papi_rene' },
    { display: 'Rizzi', key: 'rizzi_animated', sprite: 'rizzi_animated', charId: 'rizzi' }
];

const OPTIONS = [
    { label: 'MODE', values: [{ display: 'VS IA', key: 'vs_ia' }, { display: 'Local 1v1', key: 'local' }] },
    { label: 'JOUEUR 1', values: CHAR_VALUES },
    { label: 'JOUEUR 2', values: CHAR_VALUES },
    { label: 'BOULES', values: [
        { display: 'Acier', key: 'acier' }, { display: 'Bronze', key: 'bronze' },
        { display: 'Chrome', key: 'chrome' }, { display: 'Noire', key: 'noire' },
        { display: 'Rouge', key: 'rouge' }, { display: 'Doree', key: 'doree' },
        { display: 'Rouillee', key: 'rouille' }, { display: 'Bleue', key: 'bleue' },
        { display: 'Cuivre', key: 'cuivre' }, { display: 'Titane', key: 'titane' }
    ]},
    { label: 'COCHONNET', values: [
        { display: 'Classique', key: 'classique' }, { display: 'Bleu', key: 'bleu' },
        { display: 'Vert', key: 'vert' }, { display: 'Rouge', key: 'rouge' },
        { display: 'Jungle', key: 'jungle' }, { display: 'Multicolor', key: 'multicolor' }
    ]},
    { label: 'TERRAIN', values: [
        { display: 'Terre battue', key: 'terre' }, { display: 'Herbe', key: 'herbe' },
        { display: 'Sable', key: 'sable' }, { display: 'Dalles', key: 'dalles' },
        { display: 'Colline', key: 'colline' }
    ]},
    { label: 'DIFFICULTE', values: [
        { display: 'Facile', key: 'easy' }, { display: 'Moyen', key: 'medium' },
        { display: 'Difficile', key: 'hard' }
    ]},
    { label: 'FORMAT', values: [
        { display: '3 Boules', key: 'tete_a_tete' }, { display: '2 Boules', key: 'deux_boules' },
        { display: '1 Boule', key: 'une_boule' }
    ]}
];

const ROW_MODE = 0, ROW_P1 = 1, ROW_P2 = 2, ROW_BOULES = 3, ROW_COCHONNET = 4;
const ROW_TERRAIN = 5, ROW_DIFF = 6, ROW_FORMAT = 7;

const LEFT_W = 490;
const PANEL_X = 670;
const PANEL_W = 280;
const PANEL_TOP = 65;

export default class QuickPlayScene extends Phaser.Scene {
    constructor() {
        super('QuickPlayScene');
    }

    init() {
        this._selections = null;
        this._selectedRow = 0;
        this._transitioning = false;
    }

    create() {
        this.cameras.main.setAlpha(1);
        this.cameras.main.resetFX();
        setSoundScene(this);
        UIFactory.fadeIn(this);

        this._selections = OPTIONS.map(() => 0);
        this._selectedRow = 0;
        this._totalRows = OPTIONS.length + 1;

        // Background — warm dark gradient with subtle pattern
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x2A1E15, 0x2A1E15, 0x4A3828, 0x4A3828, 1);
        bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Subtle wood grain pattern
        for (let y = 0; y < GAME_HEIGHT; y += 4) {
            const alpha = 0.02 + Math.sin(y * 0.15) * 0.01;
            bg.fillStyle(0x1A1008, alpha);
            bg.fillRect(0, y, GAME_WIDTH, 2);
        }

        // Left panel background (wood)
        UIFactory.createWoodPanel(this, 16, 50, LEFT_W - 32, GAME_HEIGHT - 100, {
            depth: 1, textureKey: 'ui_wood_dark'
        });

        // Right panel background (parchment)
        UIFactory.createParchmentPanel(this, PANEL_X - PANEL_W / 2 - 6, PANEL_TOP - 6, PANEL_W + 12, GAME_HEIGHT - PANEL_TOP - 50, {
            depth: 1
        });

        // Title
        UIFactory.addTitle(this, LEFT_W / 2, 28, 'PARTIE RAPIDE', { depth: 5 });

        // Decorative divider under title
        UIFactory.addDivider(this, LEFT_W / 2, 46, 200, { depth: 5 });

        // Options rows
        const startY = 72;
        const rowH = 44;
        this._optionTexts = [];
        this._valueTexts = [];
        this._arrowLeftTexts = [];
        this._arrowRightTexts = [];
        this._rowBgs = [];

        for (let i = 0; i < OPTIONS.length; i++) {
            const y = startY + i * rowH;
            const opt = OPTIONS[i];

            // Row background
            const rowBg = this.add.graphics().setDepth(2);
            this._rowBgs.push(rowBg);

            // Label
            const label = this.add.text(130, y, opt.label, {
                fontFamily: 'monospace', fontSize: '14px', color: '#D4A574', shadow: SHADOW
            }).setOrigin(1, 0.5).setDepth(3);
            this._optionTexts.push(label);

            // Arrows
            const arrowL = this.add.text(180, y, '\u25C0', {
                fontFamily: 'monospace', fontSize: '16px', color: '#FFD700', shadow: SHADOW
            }).setOrigin(0.5).setDepth(3).setInteractive({ useHandCursor: true });
            arrowL.on('pointerdown', () => {
                this._selectedRow = i;
                this._changeValue(-1);
            });
            this._arrowLeftTexts.push(arrowL);

            const val = this.add.text(300, y, opt.values[0].display, {
                fontFamily: 'monospace', fontSize: '16px', color: '#F5E6D0', align: 'center', shadow: SHADOW
            }).setOrigin(0.5).setDepth(3);
            this._valueTexts.push(val);

            const arrowR = this.add.text(420, y, '\u25B6', {
                fontFamily: 'monospace', fontSize: '16px', color: '#FFD700', shadow: SHADOW
            }).setOrigin(0.5).setDepth(3).setInteractive({ useHandCursor: true });
            arrowR.on('pointerdown', () => {
                this._selectedRow = i;
                this._changeValue(1);
            });
            this._arrowRightTexts.push(arrowR);
        }

        // JOUER button (centered, big wood button)
        const jouerY = startY + OPTIONS.length * rowH + 12;
        this._jouerBtn = UIFactory.createWoodButton(this, LEFT_W / 2, jouerY, 220, 42, 'JOUER !', {
            fontSize: '14px',
            depth: 5,
            selected: false,
            onDown: () => {
                if (this._selectedRow === OPTIONS.length) {
                    this._launchGame();
                } else {
                    this._selectedRow = OPTIONS.length;
                    sfxUIClick();
                    this._updateDisplay();
                    this._updateInfoPanel();
                }
            }
        });

        // Controls hint
        UIFactory.addControlsHint(this,
            'FLECHES Naviguer   ESPACE Confirmer', { depth: 5 });

        // Back button
        UIFactory.addBackButton(this, 'TitleScene', { depth: 5 });

        // Info panel elements
        this._infoBarsGfx = this.add.graphics().setDepth(5);
        this._infoLabels = [];
        this._boulePreview = null;
        this._charPreview = null;

        // Input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.enterKey = this.input.keyboard.addKey('ENTER');
        this.spaceKey = this.input.keyboard.addKey('SPACE');

        this._updateDisplay();
        this._updateInfoPanel();

        this.events.on('shutdown', this._shutdown, this);
    }

    _shutdown() {
        this.input.keyboard.removeAllListeners();
        this._infoLabels.forEach(l => l.destroy());
        this._infoLabels = [];
        if (this._boulePreview) { this._boulePreview.destroy(); this._boulePreview = null; }
        if (this._charPreview) { this._charPreview.destroy(); this._charPreview = null; }
        this.tweens.killAll();
    }

    _changeValue(dir) {
        if (this._selectedRow >= OPTIONS.length) return;
        const opt = OPTIONS[this._selectedRow];
        this._selections[this._selectedRow] = (this._selections[this._selectedRow] + dir + opt.values.length) % opt.values.length;
        sfxUIClick();
        this._updateDisplay();
        this._updateInfoPanel();
    }

    _updateDisplay() {
        for (let i = 0; i < OPTIONS.length; i++) {
            const sel = this._selections[i];
            const opt = OPTIONS[i];
            this._valueTexts[i].setText(opt.values[sel].display);

            const isSelected = (this._selectedRow === i);
            this._optionTexts[i].setColor(isSelected ? '#FFD700' : '#D4A574');
            this._valueTexts[i].setColor(isSelected ? '#FFFFFF' : '#F5E6D0');
            this._arrowLeftTexts[i].setAlpha(isSelected ? 1 : 0.3);
            this._arrowRightTexts[i].setAlpha(isSelected ? 1 : 0.3);

            // Row background
            this._rowBgs[i].clear();
            if (isSelected) {
                const y = 72 + i * 44;
                this._rowBgs[i].fillStyle(0x8B6B3D, 0.25);
                this._rowBgs[i].fillRoundedRect(28, y - 16, LEFT_W - 56, 32, 4);
                this._rowBgs[i].lineStyle(1, 0xFFD700, 0.3);
                this._rowBgs[i].strokeRoundedRect(28, y - 16, LEFT_W - 56, 32, 4);
            }
        }

        // JOUER button selected state
        const jouerSelected = (this._selectedRow === OPTIONS.length);
        this._jouerBtn.setSelected(jouerSelected);
    }

    _updateInfoPanel() {
        this._infoBarsGfx.clear();
        this._infoLabels.forEach(l => l.destroy());
        this._infoLabels = [];
        if (this._boulePreview) { this._boulePreview.destroy(); this._boulePreview = null; }
        if (this._charPreview) { this._charPreview.destroy(); this._charPreview = null; }

        const boulesData = this.cache.json.get('boules');
        const terrainsData = this.cache.json.get('terrains');
        const charsData = this.cache.json.get('characters');
        const cx = PANEL_X;
        const top = PANEL_TOP;

        if (this._selectedRow === ROW_MODE) {
            this._drawModePanel(cx, top);
        } else if ((this._selectedRow === ROW_P1 || this._selectedRow === ROW_P2) && charsData) {
            this._drawCharPanel(cx, top, charsData, this._selectedRow === ROW_P1);
        } else if (this._selectedRow === ROW_BOULES && boulesData) {
            this._drawBoulePanel(cx, top, boulesData);
        } else if (this._selectedRow === ROW_COCHONNET && boulesData) {
            this._drawCochonnetPanel(cx, top, boulesData);
        } else if (this._selectedRow === ROW_TERRAIN && terrainsData) {
            this._drawTerrainPanel(cx, top, terrainsData);
        } else if (this._selectedRow === ROW_DIFF) {
            this._drawDifficultyPanel(cx, top);
        } else {
            this._drawSummaryPanel(cx, top, boulesData, charsData);
        }
    }

    _drawModePanel(cx, top) {
        const modeKey = OPTIONS[ROW_MODE].values[this._selections[ROW_MODE]].key;
        const isLocal = modeKey === 'local';
        this._addLabel(cx, top + 10, isLocal ? 'LOCAL 1v1' : 'VS INTELLIGENCE\nARTIFICIELLE', '16px', '#FFD700', 0.5);
        const desc = isLocal
            ? 'Deux joueurs sur le\nmeme ecran.'
            : 'Affrontez l\'IA.\nChoisissez difficulte\net personnage.';
        this._addLabel(cx, top + 50, desc, '14px', '#3A2E28', 0.5, PANEL_W - 30);

        const iconY = top + 120;
        this._infoBarsGfx.fillStyle(0x5B9BD5, 0.8);
        this._infoBarsGfx.fillCircle(cx - 40, iconY, 16);
        this._addLabel(cx - 40, iconY - 4, 'J1', '13px', '#FFFFFF', 0.5);
        this._addLabel(cx, iconY - 4, 'VS', '14px', '#8B6B3D', 0.5);
        this._infoBarsGfx.fillStyle(isLocal ? 0xC44B3F : 0x5A4A38, 0.8);
        this._infoBarsGfx.fillCircle(cx + 40, iconY, 16);
        this._addLabel(cx + 40, iconY - 4, isLocal ? 'J2' : 'IA', '13px', '#FFFFFF', 0.5);
    }

    _drawBoulePanel(cx, top, boulesData) {
        const bouleKey = OPTIONS[ROW_BOULES].values[this._selections[ROW_BOULES]].key;
        const boule = boulesData.sets.find(s => s.id === bouleKey);
        if (!boule) return;

        this._addLabel(cx, top + 10, boule.name, '16px', '#8B6B3D', 0.5);
        const sphereY = top + 60;
        const spriteKey = `ball_${bouleKey}`;
        if (this.textures.exists(spriteKey)) {
            this._boulePreview = this.add.image(cx, sphereY, spriteKey)
                .setScale(1.5).setOrigin(0.5).setDepth(5);
        } else {
            const color = parseInt(boule.color.replace('#', ''), 16);
            this._boulePreview = this.add.graphics().setDepth(5);
            this._boulePreview.fillStyle(color, 1);
            this._boulePreview.fillCircle(cx, sphereY, 22);
        }
        this._addLabel(cx, sphereY + 36, boule.description, '13px', '#3A2E28', 0.5, PANEL_W - 20);

        // Stats
        const barsY = sphereY + 76;
        const bonus = boule.bonus || '';
        let glisseVal = 5;
        if (bonus.startsWith('friction_x')) {
            const f = parseFloat(bonus.split('x')[1]) || 1;
            glisseVal = f < 1 ? Math.round(5 + (1 - f) * 30) : Math.round(5 - (f - 1) * 10);
        }
        if (bonus.startsWith('knockback_x')) glisseVal = 3;
        if (bonus.startsWith('retro_x')) glisseVal = 6;
        if (bonus.startsWith('restitution_x')) {
            const r = parseFloat(bonus.split('x')[1]) || 1;
            glisseVal = r > 1 ? 7 : 4;
        }
        this._drawBars(cx, barsY, [
            { label: 'Poids', value: boule.stats.masse, min: 550, max: 900, color: 0xC4854A },
            { label: 'Taille', value: boule.stats.rayon, min: 8, max: 12, color: 0x87CEEB },
            { label: 'Special', value: glisseVal, min: 1, max: 10, color: 0x9B7BB8 }
        ]);
        if (boule.lore) {
            this._addLabel(cx, barsY + 80, `"${boule.lore}"`, '14px', '#7A6A5A', 0.5, PANEL_W - 20);
        }
    }

    _drawCochonnetPanel(cx, top, boulesData) {
        const cochKey = OPTIONS[ROW_COCHONNET].values[this._selections[ROW_COCHONNET]].key;
        const cochonnets = boulesData.cochonnets || [];
        const coch = cochonnets.find(c => c.id === cochKey);
        if (!coch) return;
        this._addLabel(cx, top + 10, coch.name, '16px', '#8B6B3D', 0.5);
        const sphereY = top + 70;
        const texKey = coch.textureKey;
        if (texKey && this.textures.exists(texKey)) {
            this._boulePreview = this.add.image(cx, sphereY, texKey)
                .setScale(2).setOrigin(0.5).setDepth(5);
        } else {
            const color = parseInt(coch.color.replace('#', ''), 16);
            this._boulePreview = this.add.graphics().setDepth(5);
            this._boulePreview.fillStyle(color, 1);
            this._boulePreview.fillCircle(cx, sphereY, 18);
        }
        this._addLabel(cx, sphereY + 40, coch.description, '13px', '#3A2E28', 0.5, PANEL_W - 20);
    }

    _drawTerrainPanel(cx, top, terrainsData) {
        const terrainKey = OPTIONS[ROW_TERRAIN].values[this._selections[ROW_TERRAIN]].key;
        const terrain = terrainsData.stages.find(t => t.id === terrainKey) ||
                        terrainsData.stages.find(t => t.surface === terrainKey);
        if (!terrain) return;
        this._addLabel(cx, top + 10, terrain.name, '16px', '#8B6B3D', 0.5);

        const swatchY = top + 46;
        const bgColor = parseInt(terrain.colors.bg.replace('#', ''), 16);
        this._infoBarsGfx.fillStyle(bgColor, 1);
        this._infoBarsGfx.fillRoundedRect(cx - 50, swatchY, 100, 28, 4);
        this._infoBarsGfx.lineStyle(1, 0x8B6B3D, 0.4);
        this._infoBarsGfx.strokeRoundedRect(cx - 50, swatchY, 100, 28, 4);
        const gravel = terrain.colors.gravel;
        for (let i = 0; i < 15; i++) {
            const gx = cx - 45 + Math.random() * 90;
            const gy = swatchY + 4 + Math.random() * 20;
            const gc = parseInt(gravel[Math.floor(Math.random() * gravel.length)].replace('#', ''), 16);
            this._infoBarsGfx.fillStyle(gc, 0.6);
            this._infoBarsGfx.fillRect(gx, gy, 2, 2);
        }

        const shortDesc = terrain.description.length > 80
            ? terrain.description.substring(0, 77) + '...'
            : terrain.description;
        this._addLabel(cx, swatchY + 38, shortDesc, '14px', '#3A2E28', 0.5, PANEL_W - 20);

        const barsY = swatchY + 80;
        const frictionDesc = terrain.friction >= 2.5 ? 'Arret rapide' : terrain.friction >= 1.5 ? 'Reduit' : terrain.friction <= 0.5 ? 'Ca roule !' : 'Equilibre';
        const features = [terrain.slope ? 'Pente' : null, terrain.walls ? 'Rebonds' : null, terrain.zones.length > 0 ? 'Zones' : null].filter(Boolean);
        this._drawBars(cx, barsY, [
            { label: 'Adherence', value: Math.min(terrain.friction / 3.5 * 10, 10), min: 0, max: 10, color: 0xD4A574, desc: frictionDesc },
            { label: 'Complexite', value: features.length * 3 + 2, min: 0, max: 10, color: 0xC44B3F, desc: features.join(', ') || 'Plat' }
        ]);
    }

    _drawDifficultyPanel(cx, top) {
        const diffKey = OPTIONS[ROW_DIFF].values[this._selections[ROW_DIFF]].key;
        const diffInfo = {
            easy: { title: 'Facile', desc: 'L\'adversaire vise mal\net ne tire pas.', stars: 1 },
            medium: { title: 'Moyen', desc: 'Adversaire correct,\ntire quand il le faut.', stars: 2 },
            hard: { title: 'Difficile', desc: 'Adversaire precis\net strategique.', stars: 3 }
        };
        const d = diffInfo[diffKey] || diffInfo.easy;
        this._addLabel(cx, top + 10, d.title, '16px', '#8B6B3D', 0.5);
        const starStr = '\u2605'.repeat(d.stars) + '\u2606'.repeat(3 - d.stars);
        this._addLabel(cx, top + 46, starStr, '24px', '#FFD700', 0.5);
        this._addLabel(cx, top + 90, d.desc, '13px', '#3A2E28', 0.5, PANEL_W - 20);
    }

    _drawCharPanel(cx, top, charsData, isP1 = true) {
        const rowIdx = isP1 ? ROW_P1 : ROW_P2;
        const charOption = OPTIONS[rowIdx].values[this._selections[rowIdx]];
        let char = charsData.roster.find(c => c.id === charOption.charId);
        if (!char) return;

        if (char.isRookie || char.id === 'rookie') {
            const save = loadSave();
            if (save.rookie) char = { ...char, stats: { ...save.rookie.stats } };
        }

        const teamColor = isP1 ? '#5B9BD5' : '#C44B3F';
        const teamLabel = isP1 ? 'JOUEUR 1' : 'JOUEUR 2';
        this._addLabel(cx, top + 6, teamLabel, '12px', teamColor, 0.5);
        this._addLabel(cx, top + 24, char.name, '16px', '#8B6B3D', 0.5);
        this._addLabel(cx, top + 42, char.title, '11px', '#6A5A48', 0.5);

        const spriteY = top + 86;
        const spriteKey = charOption.sprite;
        if (this.textures.exists(spriteKey)) {
            this._charPreview = this.add.sprite(cx, spriteY, spriteKey, 0)
                .setScale(CHAR_SCALE_QUICKPLAY).setOrigin(0.5).setDepth(5);
        }

        this._addLabel(cx, spriteY + 38, `"${char.catchphrase}"`, '14px', '#7A6A5A', 0.5, PANEL_W - 20);

        const barsY = spriteY + 60;
        this._drawBars(cx, barsY, [
            { label: 'Precision', value: char.stats.precision, min: 0, max: 10, color: 0xD4A574 },
            { label: 'Puissance', value: char.stats.puissance, min: 0, max: 10, color: 0xC4854A },
            { label: 'Effet', value: char.stats.effet, min: 0, max: 10, color: 0x9B7BB8 },
            { label: 'Sang-froid', value: char.stats.sang_froid, min: 0, max: 10, color: 0x87CEEB }
        ]);
    }

    _drawSummaryPanel(cx, top, boulesData, charsData) {
        this._addLabel(cx, top + 10, 'RESUME', '16px', '#8B6B3D', 0.5);
        UIFactory.addDivider(this, cx, top + 28, 140, { depth: 5, color: 0x8B6B3D });

        const mode = OPTIONS[ROW_MODE].values[this._selections[ROW_MODE]];
        const p1 = OPTIONS[ROW_P1].values[this._selections[ROW_P1]];
        const p2 = OPTIONS[ROW_P2].values[this._selections[ROW_P2]];
        const bouleKey = OPTIONS[ROW_BOULES].values[this._selections[ROW_BOULES]].key;
        const boule = boulesData?.sets?.find(s => s.id === bouleKey);
        const terrain = OPTIONS[ROW_TERRAIN].values[this._selections[ROW_TERRAIN]];
        const diff = OPTIONS[ROW_DIFF].values[this._selections[ROW_DIFF]];

        const lines = [
            `Mode: ${mode.display}`,
            `J1: ${p1.display}`,
            `J2: ${p2.display}`,
            `Boules: ${boule?.name || bouleKey}`,
            `Terrain: ${terrain.display}`,
        ];
        if (mode.key === 'vs_ia') lines.push(`Diff: ${diff.display}`);

        let ly = top + 44;
        for (const line of lines) {
            this._addLabel(cx - PANEL_W / 2 + 14, ly, line, '13px', '#3A2E28', 0);
            ly += 20;
        }
    }

    // === HELPERS ===
    _addLabel(x, y, text, size, color, originX, wrapWidth) {
        const style = {
            fontFamily: 'monospace', fontSize: size, color, shadow: SHADOW
        };
        if (wrapWidth) {
            style.wordWrap = { width: wrapWidth };
            style.align = 'center';
            style.lineSpacing = 2;
        }
        const t = this.add.text(x, y, text, style)
            .setOrigin(originX, 0).setDepth(5);
        this._infoLabels.push(t);
        return t;
    }

    _drawBars(cx, startY, bars) {
        const totalW = PANEL_W - 24;
        const labelW = 76;
        const barH = 8;
        const rowH = 26;
        const barX = cx - totalW / 2 + labelW;
        const barW = totalW - labelW - 4;

        for (let i = 0; i < bars.length; i++) {
            const b = bars[i];
            const by = startY + i * rowH;

            this._addLabel(cx - totalW / 2, by, b.label, '14px', '#6A5A48', 0);

            // Bar
            this._infoBarsGfx.fillStyle(0x3A2E28, 0.4);
            this._infoBarsGfx.fillRoundedRect(barX, by + 2, barW, barH, 3);

            const ratio = Phaser.Math.Clamp((b.value - (b.min || 0)) / ((b.max || 10) - (b.min || 0)), 0, 1);
            if (ratio > 0) {
                this._infoBarsGfx.fillStyle(b.color, 0.85);
                this._infoBarsGfx.fillRoundedRect(barX, by + 2, barW * ratio, barH, 3);
                this._infoBarsGfx.fillStyle(0xFFFFFF, 0.15);
                this._infoBarsGfx.fillRoundedRect(barX, by + 2, barW * ratio, barH / 2, 3);
            }

            this._infoBarsGfx.lineStyle(1, 0x8B6B3D, 0.3);
            this._infoBarsGfx.strokeRoundedRect(barX, by + 2, barW, barH, 3);

            if (b.desc) {
                this._addLabel(barX, by + barH + 4, b.desc, '10px', '#7A6A5A', 0);
            }
        }
    }

    update() {
        const up = Phaser.Input.Keyboard.JustDown(this.cursors.up);
        const down = Phaser.Input.Keyboard.JustDown(this.cursors.down);
        const left = Phaser.Input.Keyboard.JustDown(this.cursors.left);
        const right = Phaser.Input.Keyboard.JustDown(this.cursors.right);
        const confirm = Phaser.Input.Keyboard.JustDown(this.enterKey) || Phaser.Input.Keyboard.JustDown(this.spaceKey);

        if (up) {
            this._selectedRow = Math.max(0, this._selectedRow - 1);
            sfxUIClick();
            this._updateDisplay();
            this._updateInfoPanel();
        }
        if (down) {
            this._selectedRow = Math.min(this._totalRows - 1, this._selectedRow + 1);
            sfxUIClick();
            this._updateDisplay();
            this._updateInfoPanel();
        }

        if (this._selectedRow < OPTIONS.length) {
            if (left) this._changeValue(-1);
            if (right) this._changeValue(1);
        }

        if (confirm && this._selectedRow === OPTIONS.length) {
            sfxUIClick();
            this._launchGame();
        }
    }

    _launchGame() {
        const mode = OPTIONS[ROW_MODE].values[this._selections[ROW_MODE]].key;
        const p1Option = OPTIONS[ROW_P1].values[this._selections[ROW_P1]];
        const p2Option = OPTIONS[ROW_P2].values[this._selections[ROW_P2]];
        const bouleType = OPTIONS[ROW_BOULES].values[this._selections[ROW_BOULES]].key;
        const cochonnetType = OPTIONS[ROW_COCHONNET].values[this._selections[ROW_COCHONNET]].key;
        const terrain = OPTIONS[ROW_TERRAIN].values[this._selections[ROW_TERRAIN]].key;
        const difficulty = OPTIONS[ROW_DIFF].values[this._selections[ROW_DIFF]].key;
        const isLocal = mode === 'local';

        const gs = this.registry.get('gameState') || {};
        this.registry.set('gameState', { ...gs, bouleType });

        const charsData = this.cache.json.get('characters');
        let p1Char = charsData?.roster?.find(c => c.id === p1Option.charId) || null;
        const p2Char = charsData?.roster?.find(c => c.id === p2Option.charId) || null;

        if (p1Char && (p1Char.isRookie || p1Char.id === 'rookie')) {
            const save = loadSave();
            if (save.rookie) {
                p1Char = { ...p1Char, stats: { ...save.rookie.stats } };
            }
        }

        UIFactory.transitionTo(this, 'PetanqueScene', {
            terrain,
            difficulty: isLocal ? 'medium' : difficulty,
            format: OPTIONS[ROW_FORMAT].values[this._selections[ROW_FORMAT]].key,
            opponentName: p2Option.display,
            opponentId: 'quickplay_' + p2Option.key,
            returnScene: 'QuickPlayScene',
            personality: p2Char?.ai?.personality || null,
            playerCharacter: p1Char,
            opponentCharacter: p2Char,
            localMultiplayer: isLocal,
            quickPlay: true,
            bouleType,
            cochonnetType
        });
    }

    returnFromBattle(_result) {
        this.scene.restart();
    }
}
