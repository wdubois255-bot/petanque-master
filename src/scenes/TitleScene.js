import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../utils/Constants.js';
import { hasSaveData, getAllSlots, loadGame, formatPlaytime } from '../utils/SaveManager.js';

const SHADOW = { offsetX: 2, offsetY: 2, color: '#1A1510', blur: 0, fill: true };

export default class TitleScene extends Phaser.Scene {
    constructor() {
        super('TitleScene');
    }

    create() {
        this._menuItems = [];
        this._selectedIndex = 0;
        this._mode = 'main'; // main | slots

        // ============================================
        // BACKGROUND - Provencal sky + ground scene
        // ============================================
        const bg = this.add.graphics();

        // Sky gradient (top: bright blue -> warm horizon)
        bg.fillGradientStyle(0x5B9BD5, 0x5B9BD5, 0xE8C890, 0xE8C890, 1);
        bg.fillRect(0, 0, GAME_WIDTH, 300);

        // Warm horizon glow
        bg.fillGradientStyle(0xE8C890, 0xE8C890, 0xD4A574, 0xD4A574, 1);
        bg.fillRect(0, 280, GAME_WIDTH, 40);

        // Ground (terre battue)
        bg.fillGradientStyle(0xC4854A, 0xC4854A, 0xA87040, 0xA87040, 1);
        bg.fillRect(0, 310, GAME_WIDTH, 170);

        // Gravel texture on ground
        for (let i = 0; i < 120; i++) {
            const gx = Phaser.Math.Between(0, GAME_WIDTH);
            const gy = Phaser.Math.Between(315, 475);
            const shade = Phaser.Math.Between(0, 1) ? 0xB0905A : 0xD4A574;
            bg.fillStyle(shade, 0.4);
            bg.fillRect(gx, gy, 2, 2);
        }

        // Distant hills silhouette
        bg.fillStyle(0x8BAA6E, 0.6);
        for (let x = 0; x < GAME_WIDTH; x += 2) {
            const h = Math.sin(x * 0.008) * 25 + Math.sin(x * 0.003) * 15 + 270;
            bg.fillRect(x, h, 2, 310 - h);
        }

        // ============================================
        // DECORATIVE TREES (background, simplified)
        // ============================================
        const trees = this.add.graphics();
        const drawTree = (tx, ty, scale) => {
            // Trunk
            trees.fillStyle(0x8B6B4A, 1);
            trees.fillRect(tx - 3 * scale, ty - 10 * scale, 6 * scale, 14 * scale);
            // Canopy
            trees.fillStyle(0x5A8A4A, 1);
            trees.fillCircle(tx, ty - 16 * scale, 14 * scale);
            trees.fillStyle(0x4A7A3A, 1);
            trees.fillCircle(tx - 4 * scale, ty - 20 * scale, 10 * scale);
            trees.fillStyle(0x6A9A5A, 0.6);
            trees.fillCircle(tx + 5 * scale, ty - 22 * scale, 7 * scale);
        };
        drawTree(80, 296, 1.2);
        drawTree(180, 300, 0.8);
        drawTree(650, 294, 1.4);
        drawTree(760, 302, 0.9);
        drawTree(30, 304, 0.6);

        // ============================================
        // PETANQUE TERRAIN MARKINGS
        // ============================================
        const terrain = this.add.graphics();
        // Terrain rectangle (subtle lighter area)
        terrain.fillStyle(0xD4955A, 0.3);
        terrain.fillRect(280, 340, 270, 120);
        // Border lines
        terrain.lineStyle(1, 0xFFFFFF, 0.3);
        terrain.strokeRect(280, 340, 270, 120);

        // ============================================
        // DECORATIVE BOULES on terrain
        // ============================================
        const boules = this.add.graphics();
        // Silver boule 1
        boules.fillStyle(0x909EAA, 1); boules.fillCircle(380, 400, 8);
        boules.fillStyle(0xC8D4E0, 1); boules.fillCircle(380, 400, 7);
        boules.fillStyle(0xFFFFFF, 0.5); boules.fillCircle(377, 397, 3);
        // Silver boule 2
        boules.fillStyle(0x909EAA, 1); boules.fillCircle(410, 388, 8);
        boules.fillStyle(0xC8D4E0, 1); boules.fillCircle(410, 388, 7);
        boules.fillStyle(0xFFFFFF, 0.5); boules.fillCircle(407, 385, 3);
        // Red boule (opponent)
        boules.fillStyle(0x8B3030, 1); boules.fillCircle(460, 395, 8);
        boules.fillStyle(0xC44B3F, 1); boules.fillCircle(460, 395, 7);
        boules.fillStyle(0xFFFFFF, 0.4); boules.fillCircle(457, 392, 3);
        // Red boule 2
        boules.fillStyle(0x8B3030, 1); boules.fillCircle(435, 420, 8);
        boules.fillStyle(0xC44B3F, 1); boules.fillCircle(435, 420, 7);
        boules.fillStyle(0xFFFFFF, 0.4); boules.fillCircle(432, 417, 3);
        // Cochonnet (gold, small)
        boules.fillStyle(0xB8960A, 1); boules.fillCircle(430, 390, 4);
        boules.fillStyle(0xFFD700, 1); boules.fillCircle(430, 390, 3);
        boules.fillStyle(0xFFFFFF, 0.6); boules.fillCircle(429, 389, 1);

        // ============================================
        // CHARACTERS (Pipoya sprites on screen)
        // ============================================
        if (this.textures.exists('rene_animated')) {
            // Player standing near terrain
            const player = this.add.sprite(340, 416, 'rene_animated', 0).setScale(2);
            this.tweens.add({ targets: player, y: 414, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        }
        if (this.textures.exists('marius_animated')) {
            // Marius watching
            const marius = this.add.sprite(500, 418, 'marius_animated', 0).setScale(2);
            this.tweens.add({ targets: marius, y: 416, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 300 });
        }
        if (this.textures.exists('marcel_animated')) {
            // Marcel in background
            const marcel = this.add.sprite(560, 380, 'marcel_animated', 0).setScale(1.5).setAlpha(0.7);
            this.tweens.add({ targets: marcel, y: 378, duration: 2000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 600 });
        }

        // ============================================
        // TITLE
        // ============================================
        const titleText = this.add.text(GAME_WIDTH / 2, 80, 'PETANQUE\nMASTER', {
            fontFamily: 'monospace',
            fontSize: '52px',
            color: '#FFD700',
            align: 'center',
            lineSpacing: 4,
            shadow: { offsetX: 4, offsetY: 4, color: '#1A1510', blur: 0, fill: true }
        }).setOrigin(0.5);

        // Title breathing animation
        this.tweens.add({
            targets: titleText, scaleX: 1.02, scaleY: 1.02,
            duration: 2000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
        });

        // Subtitle
        this.add.text(GAME_WIDTH / 2, 172, 'Devenez le meilleur bouliste du canton !', {
            fontFamily: 'monospace',
            fontSize: '14px',
            color: '#F5E6D0',
            align: 'center',
            shadow: SHADOW
        }).setOrigin(0.5);

        // Version tag
        this.add.text(GAME_WIDTH - 10, GAME_HEIGHT - 10, 'v0.5', {
            fontFamily: 'monospace', fontSize: '10px', color: '#9E9E8E',
            shadow: SHADOW
        }).setOrigin(1, 1);

        // Controls hint
        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 16, '\u2191\u2193  Naviguer     Espace  Confirmer', {
            fontFamily: 'monospace',
            fontSize: '13px',
            color: '#D4A574',
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

        const items = ['Mode Arcade', 'Partie Rapide', 'Nouvelle Partie'];
        if (hasSaveData()) items.push('Continuer');

        const startY = 218;
        items.forEach((label, i) => {
            // Menu background pill
            const pillW = 260;
            const pillH = 36;
            const pillY = startY + i * 46;
            const pill = this.add.graphics();
            pill.fillStyle(0x3A2E28, 0.7);
            pill.fillRoundedRect(GAME_WIDTH / 2 - pillW / 2, pillY - pillH / 2, pillW, pillH, 6);
            this._menuItems.push(pill);

            const txt = this.add.text(GAME_WIDTH / 2, pillY, label, {
                fontFamily: 'monospace',
                fontSize: '22px',
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
        const startY = 210;
        const allItems = [];

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
            allItems.push({ label, color: s ? '#F5E6D0' : '#9E9E8E' });
        }
        allItems.push({ label: 'Retour', color: '#D4A574' });

        allItems.forEach((item, i) => {
            const pillW = 320;
            const pillH = 32;
            const pillY = startY + i * 40;
            const pill = this.add.graphics();
            pill.fillStyle(0x3A2E28, 0.7);
            pill.fillRoundedRect(GAME_WIDTH / 2 - pillW / 2, pillY - pillH / 2, pillW, pillH, 6);
            this._menuItems.push(pill);

            const txt = this.add.text(GAME_WIDTH / 2, pillY, item.label, {
                fontFamily: 'monospace',
                fontSize: '18px',
                color: item.color,
                align: 'center',
                shadow: SHADOW
            }).setOrigin(0.5);
            this._menuItems.push(txt);
        });

        this._updateCursor();
    }

    _clearMenu() {
        this._menuItems.forEach(t => t.destroy());
        this._menuItems = [];
        if (this._cursor) { this._cursor.destroy(); this._cursor = null; }
    }

    _updateCursor() {
        if (this._cursor) this._cursor.destroy();
        // Menu items alternate: [graphics, text, graphics, text, ...]
        // Find the text item at the selected index
        const textIndex = this._selectedIndex * 2 + 1;
        const item = this._menuItems[textIndex];
        if (!item || !item.style) return;
        this._cursor = this.add.text(
            item.x - item.width / 2 - 24, item.y,
            '\u25b6', {
                fontFamily: 'monospace',
                fontSize: item.style.fontSize,
                color: '#FFD700',
                shadow: SHADOW
            }
        ).setOrigin(0.5);
    }

    update() {
        const up = Phaser.Input.Keyboard.JustDown(this.cursors.up);
        const down = Phaser.Input.Keyboard.JustDown(this.cursors.down);
        const confirm = Phaser.Input.Keyboard.JustDown(this.enterKey) || Phaser.Input.Keyboard.JustDown(this.spaceKey);
        const back = Phaser.Input.Keyboard.JustDown(this.escKey);

        const itemCount = Math.floor(this._menuItems.length / 2);
        if (up) {
            this._selectedIndex = Math.max(0, this._selectedIndex - 1);
            this._updateCursor();
        }
        if (down) {
            this._selectedIndex = Math.min(itemCount - 1, this._selectedIndex + 1);
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
            // Mode Arcade
            this.scene.start('CharSelectScene', { mode: 'arcade' });
        } else if (this._selectedIndex === 1) {
            // Partie Rapide
            this.scene.start('QuickPlayScene');
        } else if (this._selectedIndex === 2) {
            // Nouvelle Partie (aventure)
            if (hasSaveData()) {
                this._showSlotMenu();
                this._newGame = true;
            } else {
                this._startNewGame(0);
            }
        } else if (this._selectedIndex === 3) {
            // Continuer
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
