import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../utils/Constants.js';
import { hasSaveData, getAllSlots, loadGame, formatPlaytime } from '../utils/SaveManager.js';
import { setSoundScene, startMusic, stopMusic, sfxUIClick } from '../utils/SoundManager.js';
import UIFactory from '../ui/UIFactory.js';

const SHADOW = UIFactory.SHADOW;
const SHADOW_HEAVY = UIFactory.SHADOW_HEAVY;

export default class TitleScene extends Phaser.Scene {
    constructor() {
        super('TitleScene');
    }

    create() {
        this._menuItems = [];
        this._selectedIndex = 0;
        this._mode = 'pressstart'; // pressstart | main | slots
        this._inputEnabled = false;
        this._menuContainer = null;

        setSoundScene(this);
        startMusic('music_title', 0.3);

        this._createBackground();
        this._createAtmosphere();
        this._createCharacters();
        this._createTitle();
        this._createPressStart();
        this._createControlsHint();
        this._createVersionTag();
        this._playIntroSequence();

        // Keyboard
        this.cursors = this.input.keyboard.createCursorKeys();
        this.enterKey = this.input.keyboard.addKey('ENTER');
        this.spaceKey = this.input.keyboard.addKey('SPACE');
        this.escKey = this.input.keyboard.addKey('ESC');

        // Cleanup on scene shutdown
        this.events.on('shutdown', this._shutdown, this);
    }

    _shutdown() {
        stopMusic();
        this.input.keyboard.removeKey('ENTER');
        this.input.keyboard.removeKey('SPACE');
        this.input.keyboard.removeKey('ESC');
        this._clearMenu();
        if (this._pressStartTween) this._pressStartTween.destroy();
        this.tweens.killAll();
    }

    // ================================================================
    // BACKGROUND - Layered provençal landscape
    // ================================================================
    _createBackground() {
        const bg = this.add.graphics();

        // Sky gradient - deeper blue at top, warm golden at horizon
        bg.fillGradientStyle(0x4A8AC4, 0x4A8AC4, 0xF0D090, 0xF0D090, 1);
        bg.fillRect(0, 0, GAME_WIDTH, 310);

        // Sun glow (behind hills)
        const sunX = GAME_WIDTH * 0.72;
        const sunY = 240;
        for (let r = 120; r > 0; r -= 6) {
            const alpha = 0.02 + (120 - r) * 0.001;
            bg.fillStyle(0xFFE8A0, alpha);
            bg.fillCircle(sunX, sunY, r);
        }
        // Sun disc
        bg.fillStyle(0xFFF4D0, 0.9);
        bg.fillCircle(sunX, sunY, 28);
        bg.fillStyle(0xFFFFFF, 0.4);
        bg.fillCircle(sunX, sunY, 20);

        // Far mountains (bluish, distant)
        bg.fillStyle(0x7BA0C0, 0.4);
        for (let x = 0; x < GAME_WIDTH; x += 2) {
            const h = Math.sin(x * 0.004) * 30 + Math.sin(x * 0.009) * 18 + 230;
            bg.fillRect(x, h, 2, 310 - h);
        }

        // Near hills (olive green)
        bg.fillStyle(0x8BAA6E, 0.7);
        for (let x = 0; x < GAME_WIDTH; x += 2) {
            const h = Math.sin(x * 0.008) * 25 + Math.sin(x * 0.003 + 1) * 15 + 268;
            bg.fillRect(x, h, 2, 310 - h);
        }

        // Cypress trees on hills (silhouettes)
        const cypressPositions = [120, 210, 380, 520, 680, 770];
        cypressPositions.forEach(cx => {
            const cy = Math.sin(cx * 0.008) * 25 + Math.sin(cx * 0.003 + 1) * 15 + 268;
            bg.fillStyle(0x4A6E3A, 0.6);
            // Tall narrow tree shape
            bg.fillRect(cx - 2, cy - 30, 4, 30);
            bg.fillStyle(0x3A5E2A, 0.7);
            for (let i = 0; i < 28; i += 2) {
                const w = Math.max(1, 7 - Math.abs(i - 8) * 0.6);
                bg.fillRect(cx - w, cy - 30 + i, w * 2, 2);
            }
        });

        // Ground (terre battue)
        bg.fillGradientStyle(0xC4854A, 0xC4854A, 0xB07040, 0xB07040, 1);
        bg.fillRect(0, 310, GAME_WIDTH, 170);

        // Ground texture - scattered gravel
        for (let i = 0; i < 180; i++) {
            const gx = Phaser.Math.Between(0, GAME_WIDTH);
            const gy = Phaser.Math.Between(312, 478);
            const shade = Phaser.Math.RND.pick([0xB0905A, 0xD4A574, 0xA07848, 0xC89860]);
            bg.fillStyle(shade, Phaser.Math.FloatBetween(0.2, 0.5));
            const size = Phaser.Math.Between(1, 3);
            bg.fillRect(gx, gy, size, size);
        }

        // Petanque terrain markings (subtle)
        bg.fillStyle(0xD4955A, 0.25);
        bg.fillRoundedRect(240, 350, 350, 110, 4);
        bg.lineStyle(1, 0xFFFFFF, 0.2);
        bg.strokeRoundedRect(240, 350, 350, 110, 4);

        // Decorative boules on terrain
        this._drawBoule(bg, 340, 400, 0xC8D4E0, 8); // Silver
        this._drawBoule(bg, 375, 388, 0xC8D4E0, 8); // Silver
        this._drawBoule(bg, 440, 395, 0xC44B3F, 8); // Red
        this._drawBoule(bg, 465, 418, 0xC44B3F, 8); // Red
        // Cochonnet
        bg.fillStyle(0xB8960A, 1); bg.fillCircle(410, 393, 4);
        bg.fillStyle(0xFFD700, 1); bg.fillCircle(410, 393, 3);
        bg.fillStyle(0xFFFFFF, 0.5); bg.fillCircle(409, 392, 1);

        // Foreground trees (larger, more detail)
        this._drawProvencalTree(bg, 50, 310, 1.5);
        this._drawProvencalTree(bg, 160, 316, 0.9);
        this._drawProvencalTree(bg, 720, 308, 1.6);
        this._drawProvencalTree(bg, 800, 318, 0.8);

        // Clouds (static base - animated ones added separately)
        this._drawCloud(bg, 100, 60, 1.0, 0.3);
        this._drawCloud(bg, 350, 40, 0.7, 0.2);
        this._drawCloud(bg, 600, 80, 1.2, 0.25);
    }

    _drawBoule(g, x, y, color, r) {
        // Shadow
        g.fillStyle(0x3A2E28, 0.3);
        g.fillEllipse(x + 1, y + r - 2, r * 1.6, r * 0.6);
        // Body
        g.fillStyle(color, 1);
        g.fillCircle(x, y, r);
        // Highlight
        g.fillStyle(0xFFFFFF, 0.4);
        g.fillCircle(x - r * 0.25, y - r * 0.25, r * 0.4);
    }

    _drawProvencalTree(g, tx, ty, scale) {
        // Shadow on ground
        g.fillStyle(0x3A2E28, 0.15);
        g.fillEllipse(tx + 8 * scale, ty + 2, 18 * scale, 5 * scale);
        // Trunk
        g.fillStyle(0x7B5B3A, 1);
        g.fillRect(tx - 3 * scale, ty - 14 * scale, 6 * scale, 16 * scale);
        // Canopy layers
        g.fillStyle(0x5A8A4A, 1);
        g.fillCircle(tx, ty - 20 * scale, 16 * scale);
        g.fillStyle(0x4A7A3A, 1);
        g.fillCircle(tx - 5 * scale, ty - 24 * scale, 11 * scale);
        g.fillStyle(0x6A9A5A, 0.7);
        g.fillCircle(tx + 6 * scale, ty - 26 * scale, 8 * scale);
        // Highlight
        g.fillStyle(0x8ABA6A, 0.3);
        g.fillCircle(tx - 2 * scale, ty - 28 * scale, 5 * scale);
    }

    _drawCloud(g, x, y, scale, alpha) {
        g.fillStyle(0xFFFFFF, alpha);
        g.fillCircle(x, y, 20 * scale);
        g.fillCircle(x + 18 * scale, y - 4 * scale, 14 * scale);
        g.fillCircle(x - 16 * scale, y + 2 * scale, 12 * scale);
        g.fillCircle(x + 8 * scale, y - 8 * scale, 16 * scale);
    }

    // ================================================================
    // ATMOSPHERE - Floating particles, animated clouds, sun rays
    // ================================================================
    _createAtmosphere() {
        // Animated clouds layer
        this._clouds = [];
        const cloudConfigs = [
            { y: 50, speed: 8, scale: 0.6, alpha: 0.15 },
            { y: 90, speed: 12, scale: 0.9, alpha: 0.12 },
            { y: 30, speed: 6, scale: 1.1, alpha: 0.18 },
        ];
        cloudConfigs.forEach(cfg => {
            const cloud = this.add.graphics();
            this._drawCloud(cloud, 0, 0, cfg.scale, cfg.alpha);
            cloud.x = Phaser.Math.Between(-100, GAME_WIDTH + 100);
            cloud.y = cfg.y;
            cloud.setData('speed', cfg.speed);
            this._clouds.push(cloud);
        });

        // Sun rays (diagonal light beams)
        const rays = this.add.graphics();
        const rayX = GAME_WIDTH * 0.72;
        for (let i = 0; i < 6; i++) {
            const angle = -0.3 + i * 0.18;
            const length = 400;
            rays.fillStyle(0xFFE8A0, 0.03);
            rays.beginPath();
            rays.moveTo(rayX, 240);
            rays.lineTo(rayX + Math.cos(angle) * length, 240 + Math.sin(angle) * length);
            rays.lineTo(rayX + Math.cos(angle + 0.06) * length, 240 + Math.sin(angle + 0.06) * length);
            rays.closePath();
            rays.fillPath();
        }
        // Pulsing ray effect
        this.tweens.add({
            targets: rays, alpha: 0.4, duration: 3000,
            yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
        });

        // Floating dust/pollen particles
        this._particles = [];
        for (let i = 0; i < 30; i++) {
            const p = this.add.graphics();
            const size = Phaser.Math.FloatBetween(1, 2.5);
            const color = Phaser.Math.RND.pick([0xFFE8A0, 0xFFD700, 0xF5E6D0, 0xFFFFFF]);
            p.fillStyle(color, Phaser.Math.FloatBetween(0.2, 0.5));
            p.fillCircle(0, 0, size);
            p.x = Phaser.Math.Between(0, GAME_WIDTH);
            p.y = Phaser.Math.Between(0, GAME_HEIGHT);
            p.setData('speedX', Phaser.Math.FloatBetween(-0.3, 0.3));
            p.setData('speedY', Phaser.Math.FloatBetween(-0.5, -0.1));
            p.setData('drift', Phaser.Math.FloatBetween(0, Math.PI * 2));
            p.setAlpha(0); // Fade in during intro
            this._particles.push(p);
        }
    }

    // ================================================================
    // CHARACTERS - Larger, VS-style positioning
    // ================================================================
    _createCharacters() {
        this._charSprites = [];

        // Player side (left) - René
        if (this.textures.exists('rene_animated')) {
            const rene = this.add.sprite(190, 410, 'rene_animated', 0).setScale(0.75).setAlpha(0);
            // Subtle idle bob
            this.tweens.add({
                targets: rene, y: 407, duration: 1800,
                yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
            });
            this._charSprites.push(rene);
        }

        // Opponent side (right) - Marius
        if (this.textures.exists('marius_animated')) {
            const marius = this.add.sprite(640, 412, 'marius_animated', 0).setScale(0.75).setAlpha(0).setFlipX(true);
            this.tweens.add({
                targets: marius, y: 409, duration: 2000,
                yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 400
            });
            this._charSprites.push(marius);
        }

        // Background character - Marcel watching
        if (this.textures.exists('marcel_animated')) {
            const marcel = this.add.sprite(415, 370, 'marcel_animated', 0).setScale(0.5).setAlpha(0);
            this.tweens.add({
                targets: marcel, y: 368, duration: 2200,
                yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 600
            });
            this._charSprites.push(marcel);
        }
    }

    // ================================================================
    // TITLE - Big, impactful, with outline effect
    // ================================================================
    _createTitle() {
        // Title outline (drawn behind for stroke effect)
        const outlineOffsets = [
            [-3, 0], [3, 0], [0, -3], [0, 3],
            [-2, -2], [2, -2], [-2, 2], [2, 2]
        ];

        this._titleOutlines = outlineOffsets.map(([ox, oy]) => {
            return this.add.text(GAME_WIDTH / 2 + ox, 90 + oy, 'PETANQUE\nMASTER', {
                fontFamily: 'monospace',
                fontSize: '56px',
                color: '#3A2E28',
                align: 'center',
                lineSpacing: 2,
            }).setOrigin(0.5).setAlpha(0);
        });

        // Main title text
        this._titleText = this.add.text(GAME_WIDTH / 2, 90, 'PETANQUE\nMASTER', {
            fontFamily: 'monospace',
            fontSize: '56px',
            color: '#FFD700',
            align: 'center',
            lineSpacing: 2,
            shadow: SHADOW_HEAVY
        }).setOrigin(0.5).setAlpha(0);

        // Secondary glow on title
        this._titleGlow = this.add.text(GAME_WIDTH / 2, 90, 'PETANQUE\nMASTER', {
            fontFamily: 'monospace',
            fontSize: '56px',
            color: '#FFF4D0',
            align: 'center',
            lineSpacing: 2,
        }).setOrigin(0.5).setAlpha(0);

        // Subtitle
        this._subtitle = this.add.text(GAME_WIDTH / 2, 175, 'Le meilleur bouliste du canton, c\'est vous !', {
            fontFamily: 'monospace',
            fontSize: '14px',
            color: '#F5E6D0',
            align: 'center',
            shadow: SHADOW
        }).setOrigin(0.5).setAlpha(0);

        // Decorative line under title
        this._titleLine = this.add.graphics();
        this._titleLine.setAlpha(0);
        const lineY = 192;
        this._titleLine.lineStyle(2, 0xFFD700, 0.6);
        this._titleLine.beginPath();
        this._titleLine.moveTo(GAME_WIDTH / 2 - 140, lineY);
        this._titleLine.lineTo(GAME_WIDTH / 2 - 10, lineY);
        this._titleLine.strokePath();
        this._titleLine.beginPath();
        this._titleLine.moveTo(GAME_WIDTH / 2 + 10, lineY);
        this._titleLine.lineTo(GAME_WIDTH / 2 + 140, lineY);
        this._titleLine.strokePath();
        // Diamond in center
        this._titleLine.fillStyle(0xFFD700, 0.8);
        this._titleLine.fillRect(GAME_WIDTH / 2 - 3, lineY - 3, 6, 6);
    }

    // ================================================================
    // PRESS START prompt
    // ================================================================
    _createPressStart() {
        this._pressStart = this.add.text(GAME_WIDTH / 2, 260, 'Appuyez sur ESPACE', {
            fontFamily: 'monospace',
            fontSize: '20px',
            color: '#FFD700',
            align: 'center',
            shadow: SHADOW
        }).setOrigin(0.5).setAlpha(0);

        // Blink animation
        this._pressStartTween = this.tweens.add({
            targets: this._pressStart,
            alpha: { from: 1, to: 0.2 },
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
            paused: true
        });
    }

    // ================================================================
    // CONTROLS HINT + VERSION
    // ================================================================
    _createControlsHint() {
        this._controlsHint = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 16, '\u2191\u2193  Naviguer     Espace  Confirmer', {
            fontFamily: 'monospace',
            fontSize: '13px',
            color: '#D4A574',
            align: 'center',
            shadow: SHADOW
        }).setOrigin(0.5).setAlpha(0);
    }

    _createVersionTag() {
        this.add.text(GAME_WIDTH - 10, GAME_HEIGHT - 10, 'v0.5', {
            fontFamily: 'monospace', fontSize: '10px', color: '#9E9E8E',
            shadow: SHADOW
        }).setOrigin(1, 1).setAlpha(0.5);
    }

    // ================================================================
    // INTRO SEQUENCE - Cinematic entrance
    // ================================================================
    _playIntroSequence() {
        const t = this.tweens;
        const ease = 'Back.easeOut';

        // 1. Title drops in (0 -> 400ms)
        this._titleOutlines.forEach(outline => {
            t.add({ targets: outline, alpha: 0.8, y: outline.y, duration: 500, delay: 100, ease });
        });
        t.add({ targets: this._titleText, alpha: 1, duration: 500, delay: 100, ease });

        // Title glow pulse (starts after drop)
        this.time.delayedCall(600, () => {
            this.tweens.add({
                targets: this._titleGlow, alpha: 0.15, duration: 2000,
                yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
            });
            // Title breathing
            const titleTargets = [this._titleText, this._titleGlow, ...this._titleOutlines];
            this.tweens.add({
                targets: titleTargets,
                scaleX: 1.015, scaleY: 1.015,
                duration: 2500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
            });
        });

        // 2. Subtitle + decorative line (400ms)
        t.add({ targets: this._subtitle, alpha: 1, y: this._subtitle.y, duration: 400, delay: 500, ease: 'Power2' });
        t.add({ targets: this._titleLine, alpha: 1, duration: 400, delay: 500 });

        // 3. Characters slide in (600ms)
        this._charSprites.forEach((sprite, i) => {
            const fromX = i === 0 ? sprite.x - 80 : (i === 1 ? sprite.x + 80 : sprite.x);
            const targetX = sprite.x;
            sprite.x = fromX;
            t.add({
                targets: sprite, alpha: i === 2 ? 0.6 : 1, x: targetX,
                duration: 600, delay: 700 + i * 150, ease
            });
        });

        // 4. Particles fade in (800ms)
        this.time.delayedCall(800, () => {
            this._particles.forEach((p, i) => {
                t.add({ targets: p, alpha: Phaser.Math.FloatBetween(0.2, 0.6), duration: 600, delay: i * 30 });
            });
        });

        // 5. Press Start appears (1200ms)
        this.time.delayedCall(1200, () => {
            this._pressStart.setAlpha(1);
            this._pressStartTween.resume();
            this._inputEnabled = true;
        });
    }

    // ================================================================
    // MENU SYSTEM
    // ================================================================
    _showMainMenu() {
        this._clearMenu();
        this._mode = 'main';
        this._selectedIndex = 0;

        // Hide press start
        if (this._pressStart) {
            this._pressStartTween.pause();
            this._pressStart.setAlpha(0);
        }

        // Show controls hint
        this.tweens.add({ targets: this._controlsHint, alpha: 1, duration: 300 });

        const items = ['Mode Arcade', 'Partie Rapide', 'Nouvelle Partie'];
        if (hasSaveData()) items.push('Continuer');

        // Menu container
        this._menuContainer = this.add.container(0, 0);
        this._menuContainer.setAlpha(0);

        const startY = 230;
        const pillW = 280;
        const pillH = 38;

        items.forEach((label, i) => {
            const pillY = startY + i * 48;

            // Background pill
            const pill = this.add.graphics();
            pill.fillStyle(0x3A2E28, 0.75);
            pill.fillRoundedRect(GAME_WIDTH / 2 - pillW / 2, pillY - pillH / 2, pillW, pillH, 8);
            pill.lineStyle(1, 0xD4A574, 0.3);
            pill.strokeRoundedRect(GAME_WIDTH / 2 - pillW / 2, pillY - pillH / 2, pillW, pillH, 8);
            this._menuContainer.add(pill);
            this._menuItems.push(pill);

            // Text
            const txt = this.add.text(GAME_WIDTH / 2, pillY, label, {
                fontFamily: 'monospace',
                fontSize: '22px',
                color: '#F5E6D0',
                align: 'center',
                shadow: SHADOW
            }).setOrigin(0.5);
            this._menuContainer.add(txt);
            this._menuItems.push(txt);

            // Mouse interactivity
            txt.setInteractive({ useHandCursor: true });
            pill.setInteractive(
                new Phaser.Geom.Rectangle(GAME_WIDTH / 2 - pillW / 2, pillY - pillH / 2, pillW, pillH),
                Phaser.Geom.Rectangle.Contains
            );

            const hoverIn = () => {
                if (this._mode !== 'main') return;
                this._selectedIndex = i;
                this._updateSelection();
            };
            const clickHandler = () => {
                if (this._mode !== 'main' || !this._inputEnabled) return;
                this._selectedIndex = i;
                this._onMainSelect();
            };

            txt.on('pointerover', hoverIn);
            txt.on('pointerdown', clickHandler);
            pill.on('pointerover', hoverIn);
            pill.on('pointerdown', clickHandler);
        });

        // Animate menu items in with stagger
        this._menuContainer.setAlpha(1);
        const allMenuChildren = this._menuContainer.list;
        allMenuChildren.forEach(child => child.setAlpha(0));
        // Stagger: each pill+text pair fades in 80ms apart
        for (let i = 0; i < items.length; i++) {
            const pillIdx = i * 2;
            const txtIdx = i * 2 + 1;
            const delay = i * 80;
            if (this._menuItems[pillIdx]) {
                this._menuItems[pillIdx].setAlpha(0);
                this.tweens.add({
                    targets: this._menuItems[pillIdx], alpha: 1,
                    duration: 250, delay, ease: 'Power2'
                });
            }
            if (this._menuItems[txtIdx]) {
                this._menuItems[txtIdx].setAlpha(0).setY(this._menuItems[txtIdx].y + 10);
                this.tweens.add({
                    targets: this._menuItems[txtIdx], alpha: 1,
                    y: this._menuItems[txtIdx].y - 10,
                    duration: 250, delay, ease: 'Back.easeOut'
                });
            }
        }

        // Delay input slightly to let stagger finish
        this._inputEnabled = false;
        this.time.delayedCall(items.length * 80 + 250, () => {
            this._inputEnabled = true;
        });

        this._updateSelection();
    }

    _showSlotMenu() {
        this._clearMenu();
        this._mode = 'slots';
        this._selectedIndex = 0;

        this._menuContainer = this.add.container(0, 0);

        // Slots header
        const header = this.add.text(GAME_WIDTH / 2, 200, 'SAUVEGARDES', {
            fontFamily: 'monospace', fontSize: '20px', color: '#FFD700', shadow: SHADOW_HEAVY
        }).setOrigin(0.5);
        this._menuContainer.add(header);

        const slots = getAllSlots();
        const startY = 245;
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
        allItems.push({ label: '\u2190 Retour', color: '#D4A574' });

        const pillW = 340;
        const pillH = 34;

        allItems.forEach((item, i) => {
            const pillY = startY + i * 42;
            const pill = this.add.graphics();
            pill.fillStyle(0x3A2E28, 0.75);
            pill.fillRoundedRect(GAME_WIDTH / 2 - pillW / 2, pillY - pillH / 2, pillW, pillH, 6);
            pill.lineStyle(1, 0xD4A574, 0.3);
            pill.strokeRoundedRect(GAME_WIDTH / 2 - pillW / 2, pillY - pillH / 2, pillW, pillH, 6);
            this._menuContainer.add(pill);
            this._menuItems.push(pill);

            const txt = this.add.text(GAME_WIDTH / 2, pillY, item.label, {
                fontFamily: 'monospace',
                fontSize: '17px',
                color: item.color,
                align: 'center',
                shadow: SHADOW
            }).setOrigin(0.5);
            this._menuContainer.add(txt);
            this._menuItems.push(txt);

            // Mouse
            txt.setInteractive({ useHandCursor: true });
            pill.setInteractive(
                new Phaser.Geom.Rectangle(GAME_WIDTH / 2 - pillW / 2, pillY - pillH / 2, pillW, pillH),
                Phaser.Geom.Rectangle.Contains
            );
            const hoverIn = () => { this._selectedIndex = i; this._updateSelection(); };
            const clickHandler = () => {
                if (!this._inputEnabled) return;
                this._selectedIndex = i;
                this._onSlotSelect();
            };
            txt.on('pointerover', hoverIn);
            txt.on('pointerdown', clickHandler);
            pill.on('pointerover', hoverIn);
            pill.on('pointerdown', clickHandler);
        });

        this._updateSelection();
    }

    _clearMenu() {
        this._menuItems.forEach(t => t.destroy());
        this._menuItems = [];
        if (this._cursor) { this._cursor.destroy(); this._cursor = null; }
        if (this._selectionGlow) { this._selectionGlow.destroy(); this._selectionGlow = null; }
        if (this._menuContainer) { this._menuContainer.destroy(); this._menuContainer = null; }
    }

    _updateSelection() {
        // Remove old cursor/glow
        if (this._cursor) this._cursor.destroy();
        if (this._selectionGlow) this._selectionGlow.destroy();

        const itemCount = Math.floor(this._menuItems.length / 2);

        for (let i = 0; i < itemCount; i++) {
            const textIndex = i * 2 + 1;
            const pillIndex = i * 2;
            const txt = this._menuItems[textIndex];
            const pill = this._menuItems[pillIndex];

            if (!txt || !txt.style) continue;

            if (i === this._selectedIndex) {
                // Selected: gold text, brighter pill
                txt.setColor('#FFD700');
                txt.setScale(1.05);

                // Redraw pill with highlight
                if (pill && pill.clear) {
                    const pillW = this._mode === 'slots' ? 340 : 280;
                    const pillH = this._mode === 'slots' ? 34 : 38;
                    const spacing = this._mode === 'slots' ? 42 : 48;
                    const startY = this._mode === 'slots' ? 245 : 230;
                    const pillY = startY + i * spacing;
                    pill.clear();
                    pill.fillStyle(0x5A4030, 0.85);
                    pill.fillRoundedRect(GAME_WIDTH / 2 - pillW / 2, pillY - pillH / 2, pillW, pillH, 8);
                    pill.lineStyle(2, 0xFFD700, 0.6);
                    pill.strokeRoundedRect(GAME_WIDTH / 2 - pillW / 2, pillY - pillH / 2, pillW, pillH, 8);
                }

                // Arrow cursor
                this._cursor = this.add.text(
                    txt.x - txt.width * 0.55 - 26, txt.y,
                    '\u25b6', {
                        fontFamily: 'monospace',
                        fontSize: '20px',
                        color: '#FFD700',
                        shadow: SHADOW
                    }
                ).setOrigin(0.5);

                // Cursor bob animation
                this.tweens.add({
                    targets: this._cursor,
                    x: this._cursor.x + 4,
                    duration: 500, yoyo: true, repeat: -1,
                    ease: 'Sine.easeInOut'
                });

                if (this._menuContainer) this._menuContainer.add(this._cursor);

            } else {
                // Unselected: cream text, normal
                txt.setColor(this._mode === 'slots' && i === itemCount - 1 ? '#D4A574' : '#F5E6D0');
                txt.setScale(1.0);

                // Reset pill
                if (pill && pill.clear) {
                    const pillW = this._mode === 'slots' ? 340 : 280;
                    const pillH = this._mode === 'slots' ? 34 : 38;
                    const spacing = this._mode === 'slots' ? 42 : 48;
                    const startY = this._mode === 'slots' ? 245 : 230;
                    const pillY = startY + i * spacing;
                    pill.clear();
                    pill.fillStyle(0x3A2E28, 0.75);
                    pill.fillRoundedRect(GAME_WIDTH / 2 - pillW / 2, pillY - pillH / 2, pillW, pillH, 8);
                    pill.lineStyle(1, 0xD4A574, 0.3);
                    pill.strokeRoundedRect(GAME_WIDTH / 2 - pillW / 2, pillY - pillH / 2, pillW, pillH, 8);
                }
            }
        }
    }

    // ================================================================
    // UPDATE LOOP
    // ================================================================
    update(time, delta) {
        if (!this._inputEnabled) return;

        // Animate clouds
        if (this._clouds) {
            this._clouds.forEach(cloud => {
                cloud.x += cloud.getData('speed') * delta * 0.001;
                if (cloud.x > GAME_WIDTH + 150) cloud.x = -150;
            });
        }

        // Animate particles
        if (this._particles) {
            this._particles.forEach(p => {
                const drift = p.getData('drift') + delta * 0.001;
                p.setData('drift', drift);
                p.x += p.getData('speedX') + Math.sin(drift) * 0.3;
                p.y += p.getData('speedY');
                // Wrap around
                if (p.y < -10) { p.y = GAME_HEIGHT + 10; p.x = Phaser.Math.Between(0, GAME_WIDTH); }
                if (p.x < -10) p.x = GAME_WIDTH + 10;
                if (p.x > GAME_WIDTH + 10) p.x = -10;
            });
        }

        // Input handling
        const up = Phaser.Input.Keyboard.JustDown(this.cursors.up);
        const down = Phaser.Input.Keyboard.JustDown(this.cursors.down);
        const confirm = Phaser.Input.Keyboard.JustDown(this.enterKey) || Phaser.Input.Keyboard.JustDown(this.spaceKey);
        const back = Phaser.Input.Keyboard.JustDown(this.escKey);

        if (this._mode === 'pressstart') {
            if (confirm) {
                this._showMainMenu();
            }
            return;
        }

        const itemCount = Math.floor(this._menuItems.length / 2);
        if (up) {
            this._selectedIndex = (this._selectedIndex - 1 + itemCount) % itemCount;
            sfxUIClick();
            this._updateSelection();
        }
        if (down) {
            this._selectedIndex = (this._selectedIndex + 1) % itemCount;
            sfxUIClick();
            this._updateSelection();
        }

        if (back) {
            if (this._mode === 'slots') {
                this._showMainMenu();
            }
            return;
        }

        if (confirm) {
            sfxUIClick();
            if (this._mode === 'main') {
                this._onMainSelect();
            } else if (this._mode === 'slots') {
                this._onSlotSelect();
            }
        }
    }

    // ================================================================
    // MENU ACTIONS
    // ================================================================
    _onMainSelect() {
        if (this._selectedIndex === 0) {
            this._transitionTo(() => this.scene.start('CharSelectScene', { mode: 'arcade' }));
        } else if (this._selectedIndex === 1) {
            this._transitionTo(() => this.scene.start('QuickPlayScene'));
        } else if (this._selectedIndex === 2) {
            if (hasSaveData()) {
                this._showSlotMenu();
                this._newGame = true;
            } else {
                this._startNewGame(0);
            }
        } else if (this._selectedIndex === 3) {
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

    _transitionTo(callback) {
        this._inputEnabled = false;
        this.cameras.main.fadeOut(400, 26, 21, 16);
        this.cameras.main.once('camerafadeoutcomplete', callback);
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

        this._transitionTo(() => this.scene.start('IntroScene'));
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

        this._transitionTo(() => {
            this.scene.start('OverworldScene', {
                map: data.player.map,
                spawnX: data.player.x,
                spawnY: data.player.y
            });
        });
    }
}
