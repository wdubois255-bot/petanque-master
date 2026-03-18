import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../utils/Constants.js';
import { setSoundScene, sfxUIClick } from '../utils/SoundManager.js';
import UIFactory from '../ui/UIFactory.js';

const SHADOW = UIFactory.SHADOW;

const CHAR_VALUES = [
    { display: 'Marcel', key: 'marcel_animated', sprite: 'marcel_animated', charId: 'pointeur' },
    { display: 'Ley', key: 'ley_animated', sprite: 'ley_animated', charId: 'brute' },
    { display: 'La Choupe', key: 'la_choupe_animated', sprite: 'la_choupe_animated', charId: 'la_choupe' },
    { display: 'Le Magicien', key: 'le_magicien_animated', sprite: 'le_magicien_animated', charId: 'magicien' }
];

const OPTIONS = [
    {
        label: 'MODE',
        values: [
            { display: 'VS IA', key: 'vs_ia' },
            { display: 'Local 1v1', key: 'local' }
        ]
    },
    {
        label: '\u{1F535} JOUEUR 1',
        values: CHAR_VALUES
    },
    {
        label: '\u{1F534} JOUEUR 2',
        values: CHAR_VALUES
    },
    {
        label: 'BOULES',
        values: [
            { display: 'Acier', key: 'acier' },
            { display: 'Bronze', key: 'bronze' },
            { display: 'Chrome', key: 'chrome' },
            { display: 'Noire', key: 'noire' },
            { display: 'Rouge', key: 'rouge' }
        ]
    },
    {
        label: 'COCHONNET',
        values: [
            { display: 'Classique', key: 'classique' },
            { display: 'Bleu', key: 'bleu' },
            { display: 'Vert', key: 'vert' }
        ]
    },
    {
        label: 'TERRAIN',
        values: [
            { display: 'Terre battue', key: 'terre' },
            { display: 'Herbe', key: 'herbe' },
            { display: 'Sable', key: 'sable' },
            { display: 'Dalles', key: 'dalles' },
            { display: 'Colline', key: 'colline' }
        ]
    },
    {
        label: 'DIFFICULTE',
        values: [
            { display: 'Facile', key: 'easy' },
            { display: 'Moyen', key: 'medium' },
            { display: 'Difficile', key: 'hard' }
        ]
    }
];

// Row indices
const ROW_MODE = 0;
const ROW_P1 = 1;
const ROW_P2 = 2;
const ROW_BOULES = 3;
const ROW_COCHONNET = 4;
const ROW_TERRAIN = 5;
const ROW_DIFF = 6;

// Layout constants
const LEFT_W = 500;       // Options column width
const PANEL_X = 670;      // Info panel center X
const PANEL_W = 280;      // Info panel width
const PANEL_TOP = 70;     // Info panel top Y

export default class QuickPlayScene extends Phaser.Scene {
    constructor() {
        super('QuickPlayScene');
    }

    create() {
        setSoundScene(this);
        this._selections = OPTIONS.map(() => 0);
        this._selectedRow = 0;
        this._totalRows = OPTIONS.length + 1;

        // Background
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x3A5A7A, 0x3A5A7A, 0x5A3A28, 0x5A3A28, 1);
        bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        bg.fillStyle(0x3A2E28, 0.5);
        bg.fillRect(0, GAME_HEIGHT - 40, GAME_WIDTH, 40);

        // Right panel background (permanent)
        const panelBg = this.add.graphics();
        panelBg.fillStyle(0x2A2018, 0.85);
        panelBg.fillRoundedRect(PANEL_X - PANEL_W / 2 - 6, PANEL_TOP - 6, PANEL_W + 12, GAME_HEIGHT - PANEL_TOP - 50, 10);
        panelBg.lineStyle(1, 0xD4A574, 0.25);
        panelBg.strokeRoundedRect(PANEL_X - PANEL_W / 2 - 6, PANEL_TOP - 6, PANEL_W + 12, GAME_HEIGHT - PANEL_TOP - 50, 10);

        // Title
        this.add.text(LEFT_W / 2, 32, 'PARTIE RAPIDE', {
            fontFamily: 'monospace', fontSize: '32px', color: '#FFD700',
            shadow: { offsetX: 3, offsetY: 3, color: '#1A1510', blur: 0, fill: true }
        }).setOrigin(0.5);

        // Options (left column)
        const startY = 86;
        const rowH = 50;
        this._optionTexts = [];
        this._valueTexts = [];
        this._arrowLeftTexts = [];
        this._arrowRightTexts = [];
        this._rowBgs = [];

        for (let i = 0; i < OPTIONS.length; i++) {
            const y = startY + i * rowH;
            const opt = OPTIONS[i];

            const pill = this.add.graphics();
            pill.fillStyle(0x3A2E28, 0.7);
            pill.fillRoundedRect(36, y - 14, LEFT_W - 56, 34, 6);
            this._rowBgs.push(pill);

            const label = this.add.text(142, y, opt.label, {
                fontFamily: 'monospace', fontSize: '15px', color: '#D4A574', shadow: SHADOW
            }).setOrigin(1, 0.5);
            this._optionTexts.push(label);

            const arrowL = this.add.text(200, y, '<', {
                fontFamily: 'monospace', fontSize: '18px', color: '#FFD700', shadow: SHADOW
            }).setOrigin(0.5);
            this._arrowLeftTexts.push(arrowL);

            const val = this.add.text(320, y, opt.values[0].display, {
                fontFamily: 'monospace', fontSize: '16px', color: '#F5E6D0', align: 'center', shadow: SHADOW
            }).setOrigin(0.5);
            this._valueTexts.push(val);

            const arrowR = this.add.text(440, y, '>', {
                fontFamily: 'monospace', fontSize: '18px', color: '#FFD700', shadow: SHADOW
            }).setOrigin(0.5);
            this._arrowRightTexts.push(arrowR);
        }

        // JOUER button
        const jouerY = startY + OPTIONS.length * rowH + 10;
        this._jouerBg = this.add.graphics();
        this._jouerBg.fillStyle(0x3A2E28, 0.8);
        this._jouerBg.fillRoundedRect(LEFT_W / 2 - 100, jouerY - 18, 200, 40, 8);

        this._jouerText = this.add.text(LEFT_W / 2, jouerY, 'JOUER !', {
            fontFamily: 'monospace', fontSize: '24px', color: '#FFD700',
            shadow: { offsetX: 3, offsetY: 3, color: '#1A1510', blur: 0, fill: true }
        }).setOrigin(0.5);

        // Controls hint
        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 16, '\u2191\u2193 Naviguer   \u2190\u2192 Changer   Espace Confirmer   Echap Retour', {
            fontFamily: 'monospace', fontSize: '11px', color: '#9E9E8E', shadow: SHADOW
        }).setOrigin(0.5);

        // Cursor
        this._cursor = this.add.text(0, 0, '\u25b6', {
            fontFamily: 'monospace', fontSize: '16px', color: '#FFD700', shadow: SHADOW
        }).setOrigin(0.5);

        // Info panel dynamic elements (right column)
        this._infoBarsGfx = this.add.graphics().setDepth(5);
        this._infoLabels = [];
        this._boulePreview = null;
        this._charPreview = null;

        // Input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.enterKey = this.input.keyboard.addKey('ENTER');
        this.spaceKey = this.input.keyboard.addKey('SPACE');
        this.escKey = this.input.keyboard.addKey('ESC');

        this._updateDisplay();
        this._updateInfoPanel();

        this.events.on('shutdown', this._shutdown, this);
    }

    _shutdown() {
        this.input.keyboard.removeKey('ENTER');
        this.input.keyboard.removeKey('SPACE');
        this.input.keyboard.removeKey('ESC');
        this._infoLabels.forEach(l => l.destroy());
        this._infoLabels = [];
        if (this._boulePreview) { this._boulePreview.destroy(); this._boulePreview = null; }
        if (this._charPreview) { this._charPreview.destroy(); this._charPreview = null; }
        this.tweens.killAll();
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

            this._rowBgs[i].clear();
            this._rowBgs[i].fillStyle(isSelected ? 0x5A4A38 : 0x3A2E28, 0.7);
            const y = 86 + i * 50;
            this._rowBgs[i].fillRoundedRect(36, y - 14, LEFT_W - 56, 34, 6);
        }

        const jouerSelected = (this._selectedRow === OPTIONS.length);
        this._jouerBg.clear();
        this._jouerBg.fillStyle(jouerSelected ? 0x8B6B20 : 0x3A2E28, 0.8);
        const jouerY = 86 + OPTIONS.length * 50 + 10;
        this._jouerBg.fillRoundedRect(LEFT_W / 2 - 100, jouerY - 18, 200, 40, 8);
        this._jouerText.setColor(jouerSelected ? '#FFFFFF' : '#FFD700');

        if (this._selectedRow < OPTIONS.length) {
            this._cursor.setPosition(42, 86 + this._selectedRow * 50);
            this._cursor.setVisible(true);
        } else {
            this._cursor.setPosition(LEFT_W / 2 - 68, jouerY);
            this._cursor.setVisible(true);
        }
    }

    _updateInfoPanel() {
        // Clear
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
            const isP1 = this._selectedRow === ROW_P1;
            this._drawCharPanel(cx, top, charsData, isP1);
        } else if (this._selectedRow === ROW_BOULES && boulesData) {
            this._drawBoulePanel(cx, top, boulesData);
        } else if (this._selectedRow === ROW_COCHONNET && boulesData) {
            this._drawCochonnetPanel(cx, top, boulesData);
        } else if (this._selectedRow === ROW_TERRAIN && terrainsData) {
            this._drawTerrainPanel(cx, top, terrainsData, boulesData);
        } else if (this._selectedRow === ROW_DIFF) {
            this._drawDifficultyPanel(cx, top);
        } else {
            this._drawSummaryPanel(cx, top, boulesData, charsData, terrainsData);
        }
    }

    // === MODE PANEL ===
    _drawModePanel(cx, top) {
        const modeKey = OPTIONS[ROW_MODE].values[this._selections[ROW_MODE]].key;
        const isLocal = modeKey === 'local';

        this._addLabel(cx, top + 6, isLocal ? 'LOCAL 1v1' : 'VS INTELLIGENCE ARTIFICIELLE', '14px', '#FFD700', 0.5);

        const desc = isLocal
            ? 'Deux joueurs sur le meme ecran.\nChacun son tour, chacun son perso !'
            : 'Affrontez l\'IA.\nChoisissez sa difficulte et son personnage.';
        this._addLabel(cx, top + 40, desc, '10px', '#F5E6D0', 0.5, PANEL_W - 20);

        // Visual icon
        const iconY = top + 110;
        this._infoBarsGfx.fillStyle(0x5B9BD5, 0.8);
        this._infoBarsGfx.fillCircle(cx - 40, iconY, 16);
        this._addLabel(cx - 40, iconY - 6, 'J1', '10px', '#FFFFFF', 0.5);

        this._addLabel(cx, iconY - 6, 'VS', '14px', '#FFD700', 0.5);

        this._infoBarsGfx.fillStyle(isLocal ? 0xC44B3F : 0x5A4A38, 0.8);
        this._infoBarsGfx.fillCircle(cx + 40, iconY, 16);
        this._addLabel(cx + 40, iconY - 6, isLocal ? 'J2' : 'IA', '10px', '#FFFFFF', 0.5);
    }

    // === BOULES PANEL ===
    _drawBoulePanel(cx, top, boulesData) {
        const bouleKey = OPTIONS[ROW_BOULES].values[this._selections[ROW_BOULES]].key;
        const boule = boulesData.sets.find(s => s.id === bouleKey);
        if (!boule) return;

        // Title
        this._addLabel(cx, top + 6, boule.name, '15px', '#FFD700', 0.5);

        // Boule visual (real sprite)
        const sphereY = top + 60;
        const spriteKey = `ball_${bouleKey}`;
        if (this.textures.exists(spriteKey)) {
            this._boulePreview = this.add.image(cx, sphereY, spriteKey)
                .setScale(1.5).setOrigin(0.5).setDepth(5);
        } else {
            // Fallback: colored circle
            const color = parseInt(boule.color.replace('#', ''), 16);
            this._boulePreview = this.add.graphics().setDepth(5);
            this._boulePreview.fillStyle(color, 1);
            this._boulePreview.fillCircle(cx, sphereY, 22);
        }

        // Description
        this._addLabel(cx, sphereY + 36, boule.description, '10px', '#F5E6D0', 0.5, PANEL_W - 20);

        // Stats bars
        const barsY = sphereY + 76;
        const bars = [
            { label: 'Poids', value: boule.stats.masse, min: 600, max: 850, color: 0xC4854A,
              desc: boule.stats.masse >= 750 ? 'Lourde, deplace plus' : boule.stats.masse <= 650 ? 'Legere, roule plus loin' : 'Equilibree' },
            { label: 'Taille', value: boule.stats.rayon, min: 8, max: 12, color: 0x87CEEB,
              desc: boule.stats.rayon >= 11 ? 'Grande, facile a toucher' : boule.stats.rayon <= 9 ? 'Petite, discrette' : 'Standard' },
            { label: 'Glisse', value: boule.bonus === 'friction_x0.9' ? 8 : boule.bonus === 'knockback_x1.2' ? 3 : 5, min: 1, max: 10, color: 0xD4A574,
              desc: boule.bonus === 'friction_x0.9' ? 'Roule longtemps' : boule.bonus === 'knockback_x1.2' ? 'Impact fort' : 'Normal' }
        ];
        this._drawBars(cx, barsY, bars);

        // Lore
        if (boule.lore) {
            this._addLabel(cx, barsY + bars.length * 28 + 12, `"${boule.lore}"`, '9px', '#7A6A5A', 0.5, PANEL_W - 20);
        }
    }

    // === COCHONNET PANEL ===
    _drawCochonnetPanel(cx, top, boulesData) {
        const cochKey = OPTIONS[ROW_COCHONNET].values[this._selections[ROW_COCHONNET]].key;
        const cochonnets = boulesData.cochonnets || [];
        const coch = cochonnets.find(c => c.id === cochKey);
        if (!coch) return;

        // Title
        this._addLabel(cx, top + 6, coch.name, '15px', '#FFD700', 0.5);

        // Cochonnet visual (real sprite, scaled up for visibility)
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

        // Description
        this._addLabel(cx, sphereY + 40, coch.description, '11px', '#F5E6D0', 0.5, PANEL_W - 20);

        // Tip
        this._addLabel(cx, sphereY + 90, 'Le cochonnet est la cible.\nToutes les boules visent a\ns\'en approcher le plus possible.', '9px', '#9E9E8E', 0.5, PANEL_W - 20);
    }

    // === TERRAIN PANEL ===
    _drawTerrainPanel(cx, top, terrainsData, _boulesData) {
        const terrainKey = OPTIONS[ROW_TERRAIN].values[this._selections[ROW_TERRAIN]].key;
        // Match by id first, fallback to surface type
        const terrain = terrainsData.stages.find(t => t.id === terrainKey) ||
                        terrainsData.stages.find(t => t.surface === terrainKey);
        if (!terrain) return;

        // Title
        this._addLabel(cx, top + 6, terrain.name, '15px', '#FFD700', 0.5);

        // Terrain color swatch
        const swatchY = top + 46;
        const bgColor = parseInt(terrain.colors.bg.replace('#', ''), 16);
        this._infoBarsGfx.fillStyle(bgColor, 1);
        this._infoBarsGfx.fillRoundedRect(cx - 50, swatchY, 100, 28, 4);
        this._infoBarsGfx.lineStyle(1, 0xF5E6D0, 0.3);
        this._infoBarsGfx.strokeRoundedRect(cx - 50, swatchY, 100, 28, 4);
        // Gravel dots
        const gravel = terrain.colors.gravel;
        for (let i = 0; i < 15; i++) {
            const gx = cx - 45 + Math.random() * 90;
            const gy = swatchY + 4 + Math.random() * 20;
            const gc = parseInt(gravel[Math.floor(Math.random() * gravel.length)].replace('#', ''), 16);
            this._infoBarsGfx.fillStyle(gc, 0.6);
            this._infoBarsGfx.fillRect(gx, gy, 2, 2);
        }

        // Short description (2 lines max)
        const shortDesc = terrain.description.length > 80
            ? terrain.description.substring(0, 77) + '...'
            : terrain.description;
        this._addLabel(cx, swatchY + 38, shortDesc, '9px', '#F5E6D0', 0.5, PANEL_W - 20);

        // Stats bars
        const barsY = swatchY + 80;
        const frictionDesc = terrain.friction >= 2.5 ? 'Boules s\'arretent vite'
            : terrain.friction >= 1.5 ? 'Roulement reduit'
            : terrain.friction <= 0.5 ? 'Ca roule loin !'
            : 'Bon equilibre';

        const features = [terrain.slope ? 'Pente' : null, terrain.walls ? 'Rebonds' : null, terrain.zones.length > 0 ? 'Zones mixtes' : null].filter(Boolean);
        const complexityVal = features.length * 3 + 2;
        const complexityDesc = features.length > 0 ? features.join(', ') : 'Terrain plat';

        const bars = [
            { label: 'Adherence', value: Math.min(terrain.friction / 3.5 * 10, 10), min: 0, max: 10, color: 0xD4A574, desc: frictionDesc },
            { label: 'Complexite', value: complexityVal, min: 0, max: 10, color: 0xC44B3F, desc: complexityDesc }
        ];
        this._drawBars(cx, barsY, bars);
    }

    // === DIFFICULTY PANEL ===
    _drawDifficultyPanel(cx, top) {
        const diffKey = OPTIONS[ROW_DIFF].values[this._selections[ROW_DIFF]].key;
        const diffInfo = {
            easy: { title: 'Facile', desc: 'L\'adversaire vise mal et ne tire pas. Parfait pour apprendre.', stars: 1 },
            medium: { title: 'Moyen', desc: 'Adversaire correct, tire quand il le faut.', stars: 2 },
            hard: { title: 'Difficile', desc: 'Adversaire precis et strategique. Bon courage !', stars: 3 }
        };
        const d = diffInfo[diffKey] || diffInfo.easy;

        this._addLabel(cx, top + 6, d.title, '15px', '#FFD700', 0.5);

        // Stars visual
        const starsY = top + 46;
        const starStr = '\u2605'.repeat(d.stars) + '\u2606'.repeat(3 - d.stars);
        this._addLabel(cx, starsY, starStr, '28px', '#FFD700', 0.5);

        this._addLabel(cx, starsY + 40, d.desc, '10px', '#F5E6D0', 0.5, PANEL_W - 20);
    }

    // === CHARACTER PANEL ===
    _drawCharPanel(cx, top, charsData, isP1 = true) {
        const rowIdx = isP1 ? ROW_P1 : ROW_P2;
        const charOption = OPTIONS[rowIdx].values[this._selections[rowIdx]];
        const char = charsData.roster.find(c => c.id === charOption.charId);
        if (!char) return;

        const teamColor = isP1 ? '#5B9BD5' : '#C44B3F';
        const teamLabel = isP1 ? 'JOUEUR 1' : 'JOUEUR 2';

        // Team badge
        this._addLabel(cx, top + 4, teamLabel, '10px', teamColor, 0.5);

        // Name + title
        this._addLabel(cx, top + 20, char.name, '16px', '#FFD700', 0.5);
        this._addLabel(cx, top + 40, char.title, '11px', '#D4A574', 0.5);

        // Sprite preview
        const spriteY = top + 86;
        const spriteKey = charOption.sprite;
        if (this.textures.exists(spriteKey)) {
            this._charPreview = this.add.sprite(cx, spriteY, spriteKey, 0)
                .setScale(0.625).setOrigin(0.5).setDepth(5);
        }

        // Catchphrase
        this._addLabel(cx, spriteY + 36, `"${char.catchphrase}"`, '9px', '#9E9E8E', 0.5, PANEL_W - 20);

        // Stats bars
        const barsY = spriteY + 58;
        const bars = [
            { label: 'Precision', value: char.stats.precision, min: 0, max: 10, color: 0xD4A574,
              desc: char.stats.precision >= 8 ? 'Chirurgical' : char.stats.precision <= 4 ? 'Approximatif' : 'Correct' },
            { label: 'Puissance', value: char.stats.puissance, min: 0, max: 10, color: 0xC4854A,
              desc: char.stats.puissance >= 8 ? 'Devastateur' : char.stats.puissance <= 4 ? 'Frappe douce' : 'Normal' },
            { label: 'Effet', value: char.stats.effet, min: 0, max: 10, color: 0x9B7BB8,
              desc: char.stats.effet >= 8 ? 'Maitre courbes' : char.stats.effet <= 4 ? 'Tirs droits' : 'Quelques courbes' },
            { label: 'Sang-froid', value: char.stats.sang_froid, min: 0, max: 10, color: 0x87CEEB,
              desc: char.stats.sang_froid >= 8 ? 'Imperturbable' : char.stats.sang_froid <= 4 ? 'Craque vite' : 'Tient le coup' }
        ];
        this._drawBars(cx, barsY, bars);
    }

    // === SUMMARY PANEL (jouer) ===
    _drawSummaryPanel(cx, top, boulesData, _charsData, _terrainsData) {
        this._addLabel(cx, top + 6, 'RESUME', '14px', '#FFD700', 0.5);

        const mode = OPTIONS[ROW_MODE].values[this._selections[ROW_MODE]];
        const p1 = OPTIONS[ROW_P1].values[this._selections[ROW_P1]];
        const p2 = OPTIONS[ROW_P2].values[this._selections[ROW_P2]];
        const bouleKey = OPTIONS[ROW_BOULES].values[this._selections[ROW_BOULES]].key;
        const boule = boulesData?.sets?.find(s => s.id === bouleKey);
        const terrain = OPTIONS[ROW_TERRAIN].values[this._selections[ROW_TERRAIN]];
        const diff = OPTIONS[ROW_DIFF].values[this._selections[ROW_DIFF]];

        const lines = [
            `Mode : ${mode.display}`,
            `Joueur 1 : ${p1.display}`,
            `Joueur 2 : ${p2.display}`,
            `Boules : ${boule?.name || bouleKey}`,
            `Terrain : ${terrain.display}`,
        ];
        if (mode.key === 'vs_ia') lines.push(`Difficulte : ${diff.display}`);

        let ly = top + 36;
        for (const line of lines) {
            this._addLabel(cx - PANEL_W / 2 + 14, ly, line, '11px', '#F5E6D0', 0);
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

            // Label
            this._addLabel(cx - totalW / 2, by, b.label, '10px', '#D4A574', 0);

            // Bar bg
            this._infoBarsGfx.fillStyle(0x1A1510, 0.7);
            this._infoBarsGfx.fillRoundedRect(barX, by + 1, barW, barH, 3);

            // Bar fill
            const ratio = Phaser.Math.Clamp((b.value - (b.min || 0)) / ((b.max || 10) - (b.min || 0)), 0, 1);
            if (ratio > 0) {
                this._infoBarsGfx.fillStyle(b.color, 0.85);
                this._infoBarsGfx.fillRoundedRect(barX, by + 1, barW * ratio, barH, 3);
            }

            // Short description to the right of the label, below the bar
            if (b.desc) {
                this._addLabel(barX, by + barH + 3, b.desc, '8px', '#7A6A5A', 0);
            }
        }
    }

    update() {
        const up = Phaser.Input.Keyboard.JustDown(this.cursors.up);
        const down = Phaser.Input.Keyboard.JustDown(this.cursors.down);
        const left = Phaser.Input.Keyboard.JustDown(this.cursors.left);
        const right = Phaser.Input.Keyboard.JustDown(this.cursors.right);
        const confirm = Phaser.Input.Keyboard.JustDown(this.enterKey) || Phaser.Input.Keyboard.JustDown(this.spaceKey);
        const back = Phaser.Input.Keyboard.JustDown(this.escKey);

        if (back) { this.scene.start('TitleScene'); return; }

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
            const opt = OPTIONS[this._selectedRow];
            if (left) {
                this._selections[this._selectedRow] = (this._selections[this._selectedRow] - 1 + opt.values.length) % opt.values.length;
                sfxUIClick();
                this._updateDisplay();
                this._updateInfoPanel();
            }
            if (right) {
                this._selections[this._selectedRow] = (this._selections[this._selectedRow] + 1) % opt.values.length;
                sfxUIClick();
                this._updateDisplay();
                this._updateInfoPanel();
            }
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
        const p1Char = charsData?.roster?.find(c => c.id === p1Option.charId) || null;
        const p2Char = charsData?.roster?.find(c => c.id === p2Option.charId) || null;

        this.cameras.main.fadeOut(300);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('PetanqueScene', {
                terrain,
                difficulty: isLocal ? 'medium' : difficulty,
                format: 'tete_a_tete',
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
        });
    }

    returnFromBattle(_result) {
        this.scene.restart();
    }
}
