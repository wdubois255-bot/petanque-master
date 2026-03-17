import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '../utils/Constants.js';

const SHADOW = { offsetX: 2, offsetY: 2, color: '#1A1510', blur: 0, fill: true };

const OPTIONS = [
    {
        label: 'BOULES',
        values: [
            { display: 'Acier', key: 'acier' },
            { display: 'Bronze', key: 'bronze' },
            { display: 'Chrome', key: 'chrome' }
        ]
    },
    {
        label: 'TERRAIN',
        values: [
            { display: 'Terre battue', key: 'terre' },
            { display: 'Herbe', key: 'herbe' },
            { display: 'Sable', key: 'sable' },
            { display: 'Dalles', key: 'dalles' }
        ]
    },
    {
        label: 'DIFFICULTE',
        values: [
            { display: 'Facile', key: 'easy' },
            { display: 'Moyen', key: 'medium' },
            { display: 'Difficile', key: 'hard' }
        ]
    },
    {
        label: 'ADVERSAIRE',
        values: [
            { display: 'Marcel', key: 'npc_marcel', sprite: 'npc_marcel' },
            { display: 'Fanny', key: 'npc_dresseur_1', sprite: 'npc_dresseur_1' },
            { display: 'Ricardo', key: 'npc_dresseur_2', sprite: 'npc_dresseur_2' },
            { display: 'Marius', key: 'npc_maitre', sprite: 'npc_maitre' },
            { display: 'Thierry', key: 'npc_villager_1', sprite: 'npc_villager_1' },
            { display: 'Jean-Pierre', key: 'npc_villager_2', sprite: 'npc_villager_2' }
        ]
    },
    {
        label: 'FORMAT',
        values: [
            { display: 'Tete-a-tete (1v1)', key: 'tete_a_tete' },
            { display: 'Doublette (2v2) - bientot !', key: 'tete_a_tete' }
        ]
    }
];

export default class QuickPlayScene extends Phaser.Scene {
    constructor() {
        super('QuickPlayScene');
    }

    create() {
        // Selection state: index into each option's values
        this._selections = OPTIONS.map(() => 0);
        this._selectedRow = 0;
        // Total rows = OPTIONS.length + 1 (JOUER button)
        this._totalRows = OPTIONS.length + 1;

        this._uiElements = [];

        // ============================================
        // BACKGROUND - Dark overlay with provencal tones
        // ============================================
        const bg = this.add.graphics();

        // Sky gradient (darker than title)
        bg.fillGradientStyle(0x3A5A7A, 0x3A5A7A, 0x5A3A28, 0x5A3A28, 1);
        bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Subtle ground stripe
        bg.fillStyle(0x3A2E28, 0.5);
        bg.fillRect(0, GAME_HEIGHT - 60, GAME_WIDTH, 60);

        // ============================================
        // TITLE
        // ============================================
        this.add.text(GAME_WIDTH / 2, 36, 'PARTIE RAPIDE', {
            fontFamily: 'monospace',
            fontSize: '36px',
            color: '#FFD700',
            align: 'center',
            shadow: { offsetX: 3, offsetY: 3, color: '#1A1510', blur: 0, fill: true }
        }).setOrigin(0.5);

        // ============================================
        // OPTIONS
        // ============================================
        const startY = 100;
        const rowH = 54;
        const labelX = 160;
        const valueX = GAME_WIDTH / 2 + 60;

        this._optionTexts = [];
        this._valueTexts = [];
        this._arrowLeftTexts = [];
        this._arrowRightTexts = [];
        this._rowBgs = [];

        for (let i = 0; i < OPTIONS.length; i++) {
            const y = startY + i * rowH;
            const opt = OPTIONS[i];

            // Row background pill
            const pill = this.add.graphics();
            pill.fillStyle(0x3A2E28, 0.7);
            pill.fillRoundedRect(40, y - 16, GAME_WIDTH - 80, 38, 6);
            this._rowBgs.push(pill);

            // Label
            const label = this.add.text(labelX, y, opt.label, {
                fontFamily: 'monospace',
                fontSize: '18px',
                color: '#D4A574',
                shadow: SHADOW
            }).setOrigin(1, 0.5);
            this._optionTexts.push(label);

            // Left arrow
            const arrowL = this.add.text(valueX - 140, y, '<', {
                fontFamily: 'monospace',
                fontSize: '20px',
                color: '#FFD700',
                shadow: SHADOW
            }).setOrigin(0.5);
            this._arrowLeftTexts.push(arrowL);

            // Value
            const val = this.add.text(valueX, y, opt.values[0].display, {
                fontFamily: 'monospace',
                fontSize: '18px',
                color: '#F5E6D0',
                align: 'center',
                shadow: SHADOW
            }).setOrigin(0.5);
            this._valueTexts.push(val);

            // Right arrow
            const arrowR = this.add.text(valueX + 140, y, '>', {
                fontFamily: 'monospace',
                fontSize: '20px',
                color: '#FFD700',
                shadow: SHADOW
            }).setOrigin(0.5);
            this._arrowRightTexts.push(arrowR);
        }

        // ============================================
        // JOUER BUTTON
        // ============================================
        const jouerY = startY + OPTIONS.length * rowH + 16;
        this._jouerBg = this.add.graphics();
        this._jouerBg.fillStyle(0x3A2E28, 0.8);
        this._jouerBg.fillRoundedRect(GAME_WIDTH / 2 - 120, jouerY - 20, 240, 44, 8);

        this._jouerText = this.add.text(GAME_WIDTH / 2, jouerY, 'JOUER !', {
            fontFamily: 'monospace',
            fontSize: '26px',
            color: '#FFD700',
            align: 'center',
            shadow: { offsetX: 3, offsetY: 3, color: '#1A1510', blur: 0, fill: true }
        }).setOrigin(0.5);

        // ============================================
        // CONTROLS HINT
        // ============================================
        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 20, '\u2191\u2193 Naviguer   \u2190\u2192 Changer   Espace Confirmer   Echap Retour', {
            fontFamily: 'monospace',
            fontSize: '12px',
            color: '#9E9E8E',
            align: 'center',
            shadow: SHADOW
        }).setOrigin(0.5);

        // ============================================
        // CURSOR
        // ============================================
        this._cursor = this.add.text(0, 0, '\u25b6', {
            fontFamily: 'monospace',
            fontSize: '20px',
            color: '#FFD700',
            shadow: SHADOW
        }).setOrigin(0.5);

        // ============================================
        // OPPONENT PREVIEW SPRITE
        // ============================================
        this._previewSprite = null;
        this._updatePreviewSprite();

        // ============================================
        // INPUT
        // ============================================
        this.cursors = this.input.keyboard.createCursorKeys();
        this.enterKey = this.input.keyboard.addKey('ENTER');
        this.spaceKey = this.input.keyboard.addKey('SPACE');
        this.escKey = this.input.keyboard.addKey('ESC');

        this._updateDisplay();
    }

    _updateDisplay() {
        // Update all value texts
        for (let i = 0; i < OPTIONS.length; i++) {
            const sel = this._selections[i];
            const opt = OPTIONS[i];
            this._valueTexts[i].setText(opt.values[sel].display);

            // Highlight selected row
            const isSelected = (this._selectedRow === i);
            this._optionTexts[i].setColor(isSelected ? '#FFD700' : '#D4A574');
            this._valueTexts[i].setColor(isSelected ? '#FFFFFF' : '#F5E6D0');
            this._arrowLeftTexts[i].setAlpha(isSelected ? 1 : 0.3);
            this._arrowRightTexts[i].setAlpha(isSelected ? 1 : 0.3);

            // Row bg highlight
            this._rowBgs[i].clear();
            this._rowBgs[i].fillStyle(isSelected ? 0x5A4A38 : 0x3A2E28, 0.7);
            const y = 100 + i * 54;
            this._rowBgs[i].fillRoundedRect(40, y - 16, GAME_WIDTH - 80, 38, 6);
        }

        // JOUER button highlight
        const jouerSelected = (this._selectedRow === OPTIONS.length);
        this._jouerBg.clear();
        this._jouerBg.fillStyle(jouerSelected ? 0x8B6B20 : 0x3A2E28, 0.8);
        const jouerY = 100 + OPTIONS.length * 54 + 16;
        this._jouerBg.fillRoundedRect(GAME_WIDTH / 2 - 120, jouerY - 20, 240, 44, 8);
        this._jouerText.setColor(jouerSelected ? '#FFFFFF' : '#FFD700');

        // Cursor position
        if (this._selectedRow < OPTIONS.length) {
            const y = 100 + this._selectedRow * 54;
            this._cursor.setPosition(52, y);
            this._cursor.setVisible(true);
        } else {
            this._cursor.setPosition(GAME_WIDTH / 2 - 80, jouerY);
            this._cursor.setVisible(true);
        }
    }

    _updatePreviewSprite() {
        if (this._previewSprite) {
            this._previewSprite.destroy();
            this._previewSprite = null;
        }

        const advIdx = 3; // ADVERSAIRE option index
        const sel = this._selections[advIdx];
        const spriteKey = OPTIONS[advIdx].values[sel].sprite;

        if (this.textures.exists(spriteKey)) {
            const previewX = GAME_WIDTH - 80;
            const previewY = 100 + advIdx * 54;
            this._previewSprite = this.add.sprite(previewX, previewY, spriteKey, 0)
                .setScale(2)
                .setOrigin(0.5);
        }
    }

    update() {
        const up = Phaser.Input.Keyboard.JustDown(this.cursors.up);
        const down = Phaser.Input.Keyboard.JustDown(this.cursors.down);
        const left = Phaser.Input.Keyboard.JustDown(this.cursors.left);
        const right = Phaser.Input.Keyboard.JustDown(this.cursors.right);
        const confirm = Phaser.Input.Keyboard.JustDown(this.enterKey) || Phaser.Input.Keyboard.JustDown(this.spaceKey);
        const back = Phaser.Input.Keyboard.JustDown(this.escKey);

        if (back) {
            this.scene.start('TitleScene');
            return;
        }

        if (up) {
            this._selectedRow = Math.max(0, this._selectedRow - 1);
            this._updateDisplay();
        }
        if (down) {
            this._selectedRow = Math.min(this._totalRows - 1, this._selectedRow + 1);
            this._updateDisplay();
        }

        // Left/Right cycle values for current option row
        if (this._selectedRow < OPTIONS.length) {
            const opt = OPTIONS[this._selectedRow];
            if (left) {
                this._selections[this._selectedRow] = (this._selections[this._selectedRow] - 1 + opt.values.length) % opt.values.length;
                this._updateDisplay();
                if (this._selectedRow === 3) this._updatePreviewSprite();
            }
            if (right) {
                this._selections[this._selectedRow] = (this._selections[this._selectedRow] + 1) % opt.values.length;
                this._updateDisplay();
                if (this._selectedRow === 3) this._updatePreviewSprite();
            }
        }

        // Confirm on JOUER
        if (confirm && this._selectedRow === OPTIONS.length) {
            this._launchGame();
        }
    }

    _launchGame() {
        const bouleType = OPTIONS[0].values[this._selections[0]].key;
        const terrain = OPTIONS[1].values[this._selections[1]].key;
        const difficulty = OPTIONS[2].values[this._selections[2]].key;
        const opponent = OPTIONS[3].values[this._selections[3]];
        const format = OPTIONS[4].values[this._selections[4]].key;

        // Store boule type in registry
        const gs = this.registry.get('gameState') || {};
        this.registry.set('gameState', {
            ...gs,
            bouleType
        });

        this.cameras.main.fadeOut(300);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('PetanqueScene', {
                terrain,
                difficulty,
                format,
                opponentName: opponent.display,
                opponentId: 'quickplay_' + opponent.key,
                returnScene: 'QuickPlayScene',
                quickPlay: true
            });
        });
    }

    /**
     * Called by PetanqueEngine when returning from a quick play match.
     */
    returnFromBattle(_result) {
        this.scene.restart();
    }
}
