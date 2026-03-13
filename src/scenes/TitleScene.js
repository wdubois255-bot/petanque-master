import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '../utils/Constants.js';
import { hasSaveData, getAllSlots, loadGame, deleteGame, formatPlaytime } from '../utils/SaveManager.js';

const SHADOW = { offsetX: 1, offsetY: 1, color: '#1A1510', blur: 0, fill: true };

export default class TitleScene extends Phaser.Scene {
    constructor() {
        super('TitleScene');
    }

    create() {
        this._menuItems = [];
        this._selectedIndex = 0;
        this._mode = 'main'; // main | slots

        // Background gradient feel
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x5A3E28, 0x5A3E28, COLORS.OMBRE, COLORS.OMBRE, 1);
        bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Title with shadow
        this.add.text(GAME_WIDTH / 2, 38, 'PETANQUE\nMASTER', {
            fontFamily: 'monospace',
            fontSize: '24px',
            color: '#FFD700',
            align: 'center',
            lineSpacing: 4,
            shadow: { offsetX: 2, offsetY: 2, color: '#1A1510', blur: 0, fill: true }
        }).setOrigin(0.5);

        // Subtitle
        this.add.text(GAME_WIDTH / 2, 88, 'Devenez le meilleur bouliste du canton !', {
            fontFamily: 'monospace',
            fontSize: '8px',
            color: '#D4A574',
            align: 'center',
            shadow: SHADOW
        }).setOrigin(0.5);

        // Decorative boules (bigger)
        const g = this.add.graphics();
        // Silver boule
        g.fillStyle(0xA8B5C2, 1);
        g.fillCircle(125, 210, 8);
        g.fillStyle(0xFFFFFF, 0.3);
        g.fillCircle(122, 207, 3);
        // Red boule
        g.fillStyle(0xC44B3F, 1);
        g.fillCircle(148, 216, 8);
        g.fillStyle(0xFFFFFF, 0.3);
        g.fillCircle(145, 213, 3);
        // Cochonnet
        g.fillStyle(0xFFD700, 1);
        g.fillCircle(137, 224, 3);

        // Controls hint
        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 16, '\u2191\u2193  Naviguer     Espace  Confirmer', {
            fontFamily: 'monospace',
            fontSize: '8px',
            color: '#9E9E8E',
            align: 'center',
            shadow: SHADOW
        }).setOrigin(0.5);

        this._showMainMenu();

        // Keyboard
        this.cursors = this.input.keyboard.createCursorKeys();
        this.enterKey = this.input.keyboard.addKey('ENTER');
        this.spaceKey = this.input.keyboard.addKey('SPACE');
        this.escKey = this.input.keyboard.addKey('ESC');
    }

    _showMainMenu() {
        this._clearMenu();
        this._mode = 'main';
        this._selectedIndex = 0;

        const items = ['Nouvelle Partie'];
        if (hasSaveData()) items.push('Continuer');

        const startY = 120;
        items.forEach((label, i) => {
            const txt = this.add.text(GAME_WIDTH / 2, startY + i * 24, label, {
                fontFamily: 'monospace',
                fontSize: '12px',
                color: '#F5E6D0',
                align: 'center',
                shadow: SHADOW
            }).setOrigin(0.5);
            this._menuItems.push(txt);
        });

        this._updateCursor();
    }

    _showSlotMenu() {
        this._clearMenu();
        this._mode = 'slots';
        this._selectedIndex = 0;

        const slots = getAllSlots();
        const startY = 110;

        for (let i = 0; i < 3; i++) {
            const s = slots[i];
            let label;
            if (s) {
                const badges = s.badges.length;
                const time = formatPlaytime(s.playtime);
                label = `Slot ${i + 1}: ${badges} badges - ${time}`;
            } else {
                label = `Slot ${i + 1}: ---`;
            }
            const txt = this.add.text(GAME_WIDTH / 2, startY + i * 22, label, {
                fontFamily: 'monospace',
                fontSize: '10px',
                color: s ? '#F5E6D0' : '#9E9E8E',
                align: 'center',
                shadow: SHADOW
            }).setOrigin(0.5);
            this._menuItems.push(txt);
        }

        const back = this.add.text(GAME_WIDTH / 2, startY + 74, 'Retour', {
            fontFamily: 'monospace',
            fontSize: '10px',
            color: '#D4A574',
            align: 'center',
            shadow: SHADOW
        }).setOrigin(0.5);
        this._menuItems.push(back);

        this._updateCursor();
    }

    _clearMenu() {
        this._menuItems.forEach(t => t.destroy());
        this._menuItems = [];
        if (this._cursor) { this._cursor.destroy(); this._cursor = null; }
    }

    _updateCursor() {
        if (this._cursor) this._cursor.destroy();
        const item = this._menuItems[this._selectedIndex];
        if (!item) return;
        this._cursor = this.add.text(
            item.x - item.width / 2 - 14, item.y,
            '\u25b6', {
                fontFamily: 'monospace',
                fontSize: item.style.fontSize,
                color: '#C44B3F',
                shadow: SHADOW
            }
        ).setOrigin(0.5);
    }

    update() {
        const up = Phaser.Input.Keyboard.JustDown(this.cursors.up);
        const down = Phaser.Input.Keyboard.JustDown(this.cursors.down);
        const confirm = Phaser.Input.Keyboard.JustDown(this.enterKey) || Phaser.Input.Keyboard.JustDown(this.spaceKey);
        const back = Phaser.Input.Keyboard.JustDown(this.escKey);

        if (up) {
            this._selectedIndex = Math.max(0, this._selectedIndex - 1);
            this._updateCursor();
        }
        if (down) {
            this._selectedIndex = Math.min(this._menuItems.length - 1, this._selectedIndex + 1);
            this._updateCursor();
        }

        if (back && this._mode === 'slots') {
            this._showMainMenu();
            return;
        }

        if (confirm) {
            if (this._mode === 'main') {
                this._onMainSelect();
            } else if (this._mode === 'slots') {
                this._onSlotSelect();
            }
        }
    }

    _onMainSelect() {
        if (this._selectedIndex === 0) {
            if (hasSaveData()) {
                this._showSlotMenu();
                this._newGame = true;
            } else {
                this._startNewGame(0);
            }
        } else if (this._selectedIndex === 1) {
            this._showSlotMenu();
            this._newGame = false;
        }
    }

    _onSlotSelect() {
        if (this._selectedIndex === 3) {
            this._showMainMenu();
            return;
        }

        const slot = this._selectedIndex;
        if (this._newGame) {
            this._startNewGame(slot);
        } else {
            const data = loadGame(slot);
            if (data) {
                this._continueGame(slot, data);
            }
        }
    }

    _startNewGame(slot) {
        if (this.sound.locked) this.sound.unlock();

        this.registry.set('currentSlot', slot);
        this.registry.set('gameState', {
            player: { name: 'Joueur', map: 'village_depart', x: 14, y: 20, facing: 'down' },
            bouleType: null,
            badges: [],
            flags: {},
            partners: [],
            scoreTotal: 0,
            playtime: 0
        });

        this.cameras.main.fadeOut(300);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('IntroScene');
        });
    }

    _continueGame(slot, data) {
        if (this.sound.locked) this.sound.unlock();

        this.registry.set('currentSlot', slot);
        this.registry.set('gameState', {
            player: data.player,
            bouleType: data.bouleType,
            badges: data.badges,
            flags: data.flags,
            partners: data.partners || [],
            scoreTotal: data.scoreTotal || 0,
            playtime: data.playtime || 0
        });

        this.cameras.main.fadeOut(300);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('OverworldScene', {
                map: data.player.map,
                spawnX: data.player.x,
                spawnY: data.player.y
            });
        });
    }
}
