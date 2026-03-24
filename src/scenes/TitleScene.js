import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, FONT_PIXEL } from '../utils/Constants.js';
import { hasSaveData, getAllSlots, loadGame, loadSave, formatPlaytime } from '../utils/SaveManager.js';
import { setSoundScene, startMusic, stopMusic, sfxUIClick, sfxUIHover, getAudioSettings, setMasterVolume, setMusicVolumeLevel, setSfxVolume, toggleMute } from '../utils/SoundManager.js';
import { UI, COLORS, CSS, SHADOW_TEXT, SHADOW_HEAVY } from '../utils/Constants.js';
import UIFactory from '../ui/UIFactory.js';
import I18n from '../utils/I18n.js';
import { fadeToScene } from '../utils/SceneTransition.js';

const SHADOW = SHADOW_TEXT;

export default class TitleScene extends Phaser.Scene {
    constructor() {
        super('TitleScene');
    }

    init() {
        this._menuButtons = [];
        this._selectedIndex = 0;
        this._mode = 'pressstart';
        this._inputEnabled = false;
        this._menuContainer = null;
        this._pressStartTween = null;
        this._transitioning = false;
    }

    create() {
        this.cameras.main.setAlpha(1);
        this.cameras.main.resetFX();

        setSoundScene(this);
        startMusic('music_title', 0.3);

        // Fade in
        UIFactory.fadeIn(this);

        this._createBackground();
        this._createAtmosphere();
        this._createTitle();
        this._createPressStart();
        this._createVersionTag();
        this._playIntroSequence();

        // Keyboard — reset key states to prevent stuck keys from previous scene
        this.input.keyboard.resetKeys();
        this.cursors = this.input.keyboard.createCursorKeys();
        this.enterKey = this.input.keyboard.addKey('ENTER');
        this.spaceKey = this.input.keyboard.addKey('SPACE');
        this.escKey = this.input.keyboard.addKey('ESC');

        this.events.on('shutdown', this._shutdown, this);
    }

    _shutdown() {
        stopMusic();
        this.input.keyboard.removeAllListeners();
        this._clearMenu();
        if (this._pressStartTween) { this._pressStartTween.stop(); this._pressStartTween = null; }
        this.tweens.killAll();
    }

    // ================================================================
    // BACKGROUND - Warm, simple provençal gradient with soft hills
    // ================================================================
    _createBackground() {
        const bg = this.add.graphics();

        // Main gradient: warm golden sky fading to deep ocre
        bg.fillGradientStyle(0x5A94C8, 0x5A94C8, 0xE8B868, 0xE8B868, 1);
        bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT * 0.7);

        // Lower warm section
        bg.fillGradientStyle(0xD4A060, 0xD4A060, 0x8B6030, 0x8B6030, 1);
        bg.fillRect(0, GAME_HEIGHT * 0.7, GAME_WIDTH, GAME_HEIGHT * 0.3);

        // Soft sun glow (centered upper area)
        const sunX = GAME_WIDTH * 0.5;
        const sunY = GAME_HEIGHT * 0.35;
        for (let r = 200; r > 0; r -= 4) {
            const alpha = 0.008 + (200 - r) * 0.0004;
            bg.fillStyle(0xFFE8A0, alpha);
            bg.fillCircle(sunX, sunY, r);
        }

        // Distant hills (very soft silhouettes)
        for (let layer = 0; layer < 3; layer++) {
            const colors = [0x7BA0B8, 0x8BAA78, 0x9B9060];
            const alphas = [0.25, 0.35, 0.5];
            const baseY = [340, 360, 385];
            const freqs = [0.003, 0.006, 0.008];
            const amps = [25, 20, 15];

            bg.fillStyle(colors[layer], alphas[layer]);
            for (let x = 0; x < GAME_WIDTH; x += 2) {
                const h = Math.sin(x * freqs[layer] + layer * 2) * amps[layer]
                        + Math.sin(x * freqs[layer] * 2.3 + layer) * amps[layer] * 0.5
                        + baseY[layer];
                bg.fillRect(x, h, 2, GAME_HEIGHT - h);
            }
        }

        // Subtle texture dots on lower area
        for (let i = 0; i < 100; i++) {
            const gx = Phaser.Math.Between(0, GAME_WIDTH);
            const gy = Phaser.Math.Between(GAME_HEIGHT * 0.75, GAME_HEIGHT);
            bg.fillStyle(0xFFFFFF, Phaser.Math.FloatBetween(0.02, 0.06));
            bg.fillRect(gx, gy, 1, 1);
        }

        // Soft vignette effect (darker corners)
        const vignette = this.add.graphics().setDepth(1);
        // Top edge
        vignette.fillGradientStyle(0x1A1510, 0x1A1510, 0x1A1510, 0x1A1510, 0.3, 0.3, 0, 0);
        vignette.fillRect(0, 0, GAME_WIDTH, 60);
        // Bottom edge
        vignette.fillGradientStyle(0x1A1510, 0x1A1510, 0x1A1510, 0x1A1510, 0, 0, 0.4, 0.4);
        vignette.fillRect(0, GAME_HEIGHT - 60, GAME_WIDTH, 60);
        // Left edge
        vignette.fillGradientStyle(0x1A1510, 0x1A1510, 0x1A1510, 0x1A1510, 0.2, 0, 0.2, 0);
        vignette.fillRect(0, 0, 80, GAME_HEIGHT);
        // Right edge
        vignette.fillGradientStyle(0x1A1510, 0x1A1510, 0x1A1510, 0x1A1510, 0, 0.2, 0, 0.2);
        vignette.fillRect(GAME_WIDTH - 80, 0, 80, GAME_HEIGHT);
    }

    _drawCloud(g, x, y, scale, alpha) {
        g.fillStyle(0xFFFFFF, alpha);
        g.fillCircle(x, y, 20 * scale);
        g.fillCircle(x + 18 * scale, y - 4 * scale, 14 * scale);
        g.fillCircle(x - 16 * scale, y + 2 * scale, 12 * scale);
        g.fillCircle(x + 8 * scale, y - 8 * scale, 16 * scale);
    }

    // ================================================================
    // ATMOSPHERE - Soft light rays and golden particles
    // ================================================================
    _createAtmosphere() {
        this._clouds = [];

        // Soft diagonal light rays from center
        const rays = this.add.graphics().setDepth(2);
        const rayX = GAME_WIDTH * 0.5;
        const rayY = GAME_HEIGHT * 0.3;
        for (let i = 0; i < 8; i++) {
            const angle = -0.6 + i * 0.2;
            const length = 500;
            rays.fillStyle(0xFFE8A0, 0.015);
            rays.beginPath();
            rays.moveTo(rayX, rayY);
            rays.lineTo(rayX + Math.cos(angle) * length, rayY + Math.sin(angle) * length);
            rays.lineTo(rayX + Math.cos(angle + 0.04) * length, rayY + Math.sin(angle + 0.04) * length);
            rays.closePath();
            rays.fillPath();
        }
        this.tweens.add({
            targets: rays, alpha: 0.5, duration: 4000,
            yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
        });

        // Golden dust particles (more visible, warm)
        this._particles = UIFactory.createDustParticles(this, 40, { depth: 3 });
        this._particles.forEach(p => p.setAlpha(0));
    }

    // ================================================================
    // TITLE
    // ================================================================
    _createTitle() {
        if (this.textures.exists('v2_logo')) {
            this._titleOutlines = [];
            this._titleText = this.add.image(GAME_WIDTH / 2, 90, 'v2_logo')
                .setOrigin(0.5).setAlpha(0).setDepth(5);
            this._titleGlow = this.add.image(GAME_WIDTH / 2, 90, 'v2_logo')
                .setOrigin(0.5).setAlpha(0).setDepth(4).setTint(0xFFF4D0);

            // Triple-click → DevTestScene
            this._logoClickCount = 0;
            this._logoClickTimer = null;
            this._titleText.setInteractive({ useHandCursor: false });
            this._titleText.on('pointerdown', () => {
                this._logoClickCount++;
                if (this._logoClickTimer) { this._logoClickTimer.remove(); this._logoClickTimer = null; }
                this._logoClickTimer = this.time.delayedCall(600, () => { this._logoClickCount = 0; this._logoClickTimer = null; });
                if (this._logoClickCount >= 3) {
                    this._logoClickCount = 0;
                    this.scene.start('DevTestScene');
                }
            });
        } else {
            // Fallback: pixel font title
            const outlineOffsets = [
                [-2, 0], [2, 0], [0, -2], [0, 2],
                [-1, -1], [1, -1], [-1, 1], [1, 1]
            ];
            this._titleOutlines = outlineOffsets.map(([ox, oy]) => {
                return this.add.text(GAME_WIDTH / 2 + ox, 80 + oy, 'PETANQUE\nMASTER', {
                    fontFamily: FONT_PIXEL,
                    fontSize: '32px',
                    color: '#3A2E28',
                    align: 'center',
                    lineSpacing: 8,
                }).setOrigin(0.5).setAlpha(0);
            });

            this._titleText = this.add.text(GAME_WIDTH / 2, 80, 'PETANQUE\nMASTER', {
                fontFamily: FONT_PIXEL,
                fontSize: '32px',
                color: '#FFD700',
                align: 'center',
                lineSpacing: 8,
                shadow: SHADOW_HEAVY
            }).setOrigin(0.5).setAlpha(0);

            this._titleGlow = this.add.text(GAME_WIDTH / 2, 80, 'PETANQUE\nMASTER', {
                fontFamily: FONT_PIXEL,
                fontSize: '32px',
                color: '#FFF4D0',
                align: 'center',
                lineSpacing: 8,
            }).setOrigin(0.5).setAlpha(0);
        }

        // Subtitle
        this._subtitle = this.add.text(GAME_WIDTH / 2, 172, I18n.t('title.subtitle'), {
            fontFamily: 'monospace',
            fontSize: '14px',
            color: '#F5E6D0',
            align: 'center',
            shadow: SHADOW
        }).setOrigin(0.5).setAlpha(0);

        // Decorative divider under subtitle
        this._titleLine = this.add.graphics().setAlpha(0);
        const lineY = 192;
        this._titleLine.lineStyle(2, 0xFFD700, 0.6);
        this._titleLine.beginPath();
        this._titleLine.moveTo(GAME_WIDTH / 2 - 140, lineY);
        this._titleLine.lineTo(GAME_WIDTH / 2 - 6, lineY);
        this._titleLine.strokePath();
        this._titleLine.beginPath();
        this._titleLine.moveTo(GAME_WIDTH / 2 + 6, lineY);
        this._titleLine.lineTo(GAME_WIDTH / 2 + 140, lineY);
        this._titleLine.strokePath();
        this._titleLine.fillStyle(0xFFD700, 0.8);
        this._titleLine.fillRect(GAME_WIDTH / 2 - 3, lineY - 3, 6, 6);
    }

    // ================================================================
    // PRESS START
    // ================================================================
    _createPressStart() {
        this._pressStart = this.add.text(GAME_WIDTH / 2, 280, I18n.t('title.press_start'), {
            fontFamily: FONT_PIXEL,
            fontSize: '16px',
            color: '#FFD700',
            align: 'center',
            shadow: SHADOW
        }).setOrigin(0.5).setAlpha(0).setDepth(5);

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

    _createVersionTag() {
        this.add.text(GAME_WIDTH - 10, GAME_HEIGHT - 10, 'v0.5', {
            fontFamily: 'monospace', fontSize: '14px', color: '#9E9E8E',
            shadow: SHADOW
        }).setOrigin(1, 1).setAlpha(0.5);

        // Lang toggle FR/EN (bottom-right, above version)
        const langLabel = I18n.locale === 'fr' ? '[FR|en]' : '[fr|EN]';
        this._langBtn = this.add.text(GAME_WIDTH - 10, GAME_HEIGHT - 26, langLabel, {
            fontFamily: 'monospace', fontSize: '11px', color: '#D4A574',
            shadow: SHADOW
        }).setOrigin(1, 1).setAlpha(0.7).setDepth(10)
          .setInteractive({ useHandCursor: true });

        this._langBtn.on('pointerover', () => this._langBtn.setAlpha(1));
        this._langBtn.on('pointerout',  () => this._langBtn.setAlpha(0.7));
        this._langBtn.on('pointerdown', async () => {
            const newLocale = I18n.locale === 'fr' ? 'en' : 'fr';
            await I18n.load(newLocale);
            I18n.setLocale(newLocale);
            this.scene.restart();
        });
    }

    // ================================================================
    // INTRO SEQUENCE
    // ================================================================
    _playIntroSequence() {
        const t = this.tweens;
        const ease = 'Back.easeOut';

        // 1. Title drops in
        this._titleOutlines.forEach(outline => {
            t.add({ targets: outline, alpha: 0.8, y: outline.y, duration: 500, delay: 100, ease });
        });
        t.add({ targets: this._titleText, alpha: 1, duration: 500, delay: 100, ease });

        this.time.delayedCall(600, () => {
            this.tweens.add({
                targets: this._titleGlow, alpha: 0.15, duration: 2000,
                yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
            });
            const titleTargets = [this._titleText, this._titleGlow, ...this._titleOutlines];
            this.tweens.add({
                targets: titleTargets,
                scaleX: 1.015, scaleY: 1.015,
                duration: 2500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
            });
        });

        // 2. Subtitle + line
        t.add({ targets: this._subtitle, alpha: 1, duration: 400, delay: 500, ease: 'Power2' });
        t.add({ targets: this._titleLine, alpha: 1, duration: 400, delay: 500 });

        // 3. Particles fade in
        this.time.delayedCall(700, () => {
            this._particles.forEach((p, i) => {
                t.add({ targets: p, alpha: Phaser.Math.FloatBetween(0.2, 0.6), duration: 600, delay: i * 30 });
            });
        });

        // 4. Press Start appears
        this.time.delayedCall(1100, () => {
            this._pressStart.setAlpha(1);
            this._pressStartTween.resume();
            this._inputEnabled = true;
        });
    }

    // ================================================================
    // MENU SYSTEM (wood buttons)
    // ================================================================
    _showMainMenu() {
        // Premier lancement (FTUE) : rediriger vers Arcade
        const save = loadSave();
        if (save.arcadeProgress === 0 && (!save.tutorialPhasesDone || save.tutorialPhasesDone.length === 0)) {
            this.time.delayedCall(500, () => {
                fadeToScene(this, 'ArcadeScene');
            });
            return;
        }

        this._clearMenu();
        this._mode = 'main';
        this._selectedIndex = 0;

        // Hide press start
        if (this._pressStart) {
            this._pressStartTween.pause();
            this._pressStart.setAlpha(0);
        }

        // Galets display
        if (!this._galetsDisplay) {
            this._galetsDisplay = UIFactory.createGaletsDisplay(this, UI.GALETS_X, UI.GALETS_Y, { depth: 50 });
        } else {
            this._galetsDisplay.refresh();
        }

        this._menuContainer = this.add.container(0, 0).setDepth(5);

        // Menu layout: hero button + 2x2 grid + settings
        const cx = GAME_WIDTH / 2;
        const menuDefs = [
            { label: I18n.t('title.menu.play'),       x: cx,       y: 230, w: 260, h: 46, hero: true },
            { label: I18n.t('title.menu.arcade'),     x: cx - 105, y: 286, w: 196, h: 36 },
            { label: I18n.t('title.menu.quickplay'),  x: cx + 105, y: 286, w: 196, h: 36 },
            { label: I18n.t('title.menu.character'),  x: cx - 105, y: 330, w: 196, h: 36 },
            { label: I18n.t('title.menu.shop'),       x: cx + 105, y: 330, w: 196, h: 36 },
            { label: I18n.t('title.menu.settings'),   x: cx,       y: 378, w: 180, h: 30 }
        ];

        this._menuButtons = [];
        this._menuPositions = menuDefs;

        menuDefs.forEach((def, i) => {
            const btn = UIFactory.createWoodButton(this, def.x, def.y, def.w, def.h, def.label, {
                fontSize: def.hero ? '16px' : '10px',
                depth: 6,
                selected: i === 0,
                onDown: () => {
                    if (this._mode !== 'main' || !this._inputEnabled) return;
                    this._selectedIndex = i;
                    this._onMainSelect();
                }
            });

            // Hover → select this index + hover SFX
            btn.hitZone.on('pointerover', () => {
                if (this._mode !== 'main') return;
                this._selectedIndex = i;
                this._updateSelection();
                sfxUIHover();
            });

            // Draw menu icon inside button container
            this._drawMenuIcon(btn.container, i, def);

            // Start invisible for stagger animation
            btn.container.setAlpha(0).setScale(0.8);
            this._menuContainer.add(btn.container);
            this._menuButtons.push(btn);
        });

        // Stagger animation for buttons
        this._menuButtons.forEach((btn, i) => {
            this.tweens.add({
                targets: btn.container,
                alpha: 1, scaleX: 1, scaleY: 1,
                duration: 300,
                delay: i * 70,
                ease: 'Back.easeOut'
            });
        });

        // Controls hint
        this._controlsHint = UIFactory.addControlsHint(this,
            I18n.t('title.controls'), { depth: 5 });
        this._controlsHint.setAlpha(0);
        this.tweens.add({ targets: this._controlsHint, alpha: 1, duration: 400, delay: 500 });

        // Enable input after animation
        this._inputEnabled = false;
        this.time.delayedCall(menuDefs.length * 70 + 300, () => {
            this._inputEnabled = true;
        });

        this._updateSelection();
    }

    _showSlotMenu() {
        this._clearMenu();
        this._mode = 'slots';
        this._selectedIndex = 0;

        this._menuContainer = this.add.container(0, 0).setDepth(5);

        // Header
        const header = UIFactory.addTitle(this, GAME_WIDTH / 2, 200, I18n.t('title.saves'), { depth: 6 });
        this._menuContainer.add(header);

        const slots = getAllSlots();
        const allItems = [];
        for (let i = 0; i < 3; i++) {
            const s = slots[i];
            let label;
            if (s) {
                const badges = s.badges.length;
                const time = formatPlaytime(s.playtime);
                label = I18n.t('title.slot', { n: i + 1, badges, time });
            } else {
                label = I18n.t('title.slot_empty', { n: i + 1 });
            }
            allItems.push(label);
        }
        allItems.push(I18n.t('title.back'));

        this._menuButtons = [];
        allItems.forEach((label, i) => {
            const btn = UIFactory.createWoodButton(this, GAME_WIDTH / 2, 250 + i * 46, 340, 36, label, {
                fontSize: '10px',
                depth: 6,
                selected: i === 0,
                onDown: () => {
                    if (!this._inputEnabled) return;
                    this._selectedIndex = i;
                    this._onSlotSelect();
                }
            });
            btn.hitZone.on('pointerover', () => { this._selectedIndex = i; this._updateSelection(); });
            btn.container.setAlpha(0);
            this.tweens.add({ targets: btn.container, alpha: 1, duration: 200, delay: i * 60, ease: 'Power2' });
            this._menuContainer.add(btn.container);
            this._menuButtons.push(btn);
        });

        this._updateSelection();
    }

    _clearMenu() {
        this._menuButtons.forEach(btn => {
            if (btn.container) btn.container.destroy();
        });
        this._menuButtons = [];
        if (this._menuContainer) { this._menuContainer.destroy(); this._menuContainer = null; }
        if (this._controlsHint) { this._controlsHint.destroy(); this._controlsHint = null; }
    }

    _updateSelection() {
        this._menuButtons.forEach((btn, i) => {
            btn.setSelected(i === this._selectedIndex);
        });
    }

    // ================================================================
    // UPDATE LOOP
    // ================================================================
    update(time, delta) {
        if (!this._inputEnabled) return;

        // Animate particles
        UIFactory.updateParticles(this._particles, delta);

        // Input
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

        const left = Phaser.Input.Keyboard.JustDown(this.cursors.left);
        const right = Phaser.Input.Keyboard.JustDown(this.cursors.right);

        // Settings mode
        if (this._mode === 'settings') {
            const settingsCount = this._settingsItemKeys?.length || 0;
            if (settingsCount === 0) return;
            if (up) {
                this._selectedIndex = (this._selectedIndex - 1 + settingsCount) % settingsCount;
                sfxUIClick();
                this._updateSettingsSelection();
            }
            if (down) {
                this._selectedIndex = (this._selectedIndex + 1) % settingsCount;
                sfxUIClick();
                this._updateSettingsSelection();
            }
            if (left) this._onSettingsLeftRight(-1);
            if (right) this._onSettingsLeftRight(1);
            if (confirm) { sfxUIClick(); this._onSettingsConfirm(); }
            if (back) { this._selectedIndex = this._settingsItemKeys.indexOf('back'); sfxUIClick(); this._onSettingsConfirm(); }
            return;
        }

        const itemCount = this._menuButtons.length;

        if (this._mode === 'main') {
            // Grid-aware nav: 0=Jouer, 1=Arcade(L), 2=Rapide(R), 3=Perso(L), 4=Boutique(R), 5=Parametres
            const navMap = {
                up:    { 0: 5, 1: 0, 2: 0, 3: 1, 4: 2, 5: 3 },
                down:  { 0: 1, 1: 3, 2: 4, 3: 5, 4: 5, 5: 0 },
                left:  { 2: 1, 4: 3 },
                right: { 1: 2, 3: 4 }
            };
            if (up && navMap.up[this._selectedIndex] !== undefined) {
                this._selectedIndex = navMap.up[this._selectedIndex];
                sfxUIClick(); this._updateSelection();
            } else if (down && navMap.down[this._selectedIndex] !== undefined) {
                this._selectedIndex = navMap.down[this._selectedIndex];
                sfxUIClick(); this._updateSelection();
            } else if (left && navMap.left[this._selectedIndex] !== undefined) {
                this._selectedIndex = navMap.left[this._selectedIndex];
                sfxUIClick(); this._updateSelection();
            } else if (right && navMap.right[this._selectedIndex] !== undefined) {
                this._selectedIndex = navMap.right[this._selectedIndex];
                sfxUIClick(); this._updateSelection();
            }
        } else {
            // Slots: simple vertical
            if (up) {
                this._selectedIndex = (this._selectedIndex - 1 + itemCount) % itemCount;
                sfxUIClick(); this._updateSelection();
            }
            if (down) {
                this._selectedIndex = (this._selectedIndex + 1) % itemCount;
                sfxUIClick(); this._updateSelection();
            }
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
            this._transitionTo(() => {
                const chars = this.cache.json.get('characters');
                const rookie = chars.roster.find(c => c.id === 'rookie');
                const papiRene = chars.roster.find(c => c.id === 'papi_rene');
                const save = loadSave();
                if (rookie && save.rookie) rookie.stats = { ...save.rookie.stats };
                if (rookie) rookie.isRookie = true;
                this.scene.start('PetanqueScene', {
                    terrain: 'village', difficulty: 'easy',
                    playerCharacter: rookie, opponentCharacter: papiRene,
                    playerCharId: 'rookie', opponentId: 'papi_rene',
                    opponentName: papiRene?.name || 'Papi René',
                    bouleType: save.selectedBoule || 'acier',
                    cochonnetType: save.selectedCochonnet || 'classique',
                    format: 'tete_a_tete',
                    returnScene: 'TitleScene'
                });
            });
        } else if (this._selectedIndex === 1) {
            this._transitionTo(() => this.scene.start('CharSelectScene', { mode: 'arcade' }));
        } else if (this._selectedIndex === 2) {
            this._transitionTo(() => this.scene.start('QuickPlayScene'));
        } else if (this._selectedIndex === 3) {
            this._transitionTo(() => this.scene.start('PlayerScene'));
        } else if (this._selectedIndex === 4) {
            this._transitionTo(() => this.scene.start('ShopScene'));
        } else if (this._selectedIndex === 5) {
            this._showSettingsMenu();
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

    // ================================================================
    // SETTINGS MENU
    // ================================================================
    _showSettingsMenu() {
        this._mode = 'settings';
        this._selectedIndex = 0;
        this._settingsValues = getAudioSettings();

        this._settingsModal = UIFactory.createModalOverlay(this, 420, 300, () => {
            this._settingsModal = null;
            this._mode = 'main';
            this._inputEnabled = true;
        }, { title: I18n.t('title.menu.settings') });

        this._rebuildSettingsItems();
    }

    _rebuildSettingsItems() {
        if (this._settingsItems) this._settingsItems.forEach(o => o.destroy());
        this._settingsItems = [];
        if (this._settingsCursor) { this._settingsCursor.destroy(); this._settingsCursor = null; }

        if (!this._settingsModal) return;
        const { panelY: py, depth } = this._settingsModal;

        const settings = this._settingsValues;
        const items = [
            { label: `${I18n.t('title.settings.sound')} : ${settings.muted ? 'OFF' : 'ON'}`, key: 'mute' },
            { label: `${I18n.t('title.settings.music')} : ${Math.round(settings.musicVolume * 100)}%`, key: 'music' },
            { label: `${I18n.t('title.settings.sfx')} : ${Math.round(settings.sfxVolume * 100)}%`, key: 'sfx' },
            { label: I18n.t('title.settings.tutorial'), key: 'tuto' },
            { label: I18n.t('title.settings.close'), key: 'back' }
        ];

        const startY = py + 60;
        const rowH = 40;

        items.forEach((item, i) => {
            const iy = startY + i * rowH;
            const txt = this.add.text(GAME_WIDTH / 2, iy, item.label, {
                fontFamily: 'monospace', fontSize: '16px', color: '#F5E6D0', align: 'center', shadow: SHADOW
            }).setOrigin(0.5).setDepth(depth);
            this._settingsItems.push(txt);

            if (item.key === 'music' || item.key === 'sfx') {
                const hint = this.add.text(GAME_WIDTH / 2 + 140, iy, '< >', {
                    fontFamily: 'monospace', fontSize: '14px', color: '#9E9E8E', shadow: SHADOW
                }).setOrigin(1, 0.5).setDepth(depth);
                this._settingsItems.push(hint);
            }

            txt.setInteractive({ useHandCursor: true });
            txt.on('pointerover', () => { this._selectedIndex = i; this._updateSettingsSelection(); });
            txt.on('pointerdown', () => { this._selectedIndex = i; this._onSettingsConfirm(); });
        });

        this._settingsItemKeys = items.map(it => it.key);
        this._updateSettingsSelection();
    }

    _updateSettingsSelection() {
        if (!this._settingsItems) return;
        if (this._settingsCursor) this._settingsCursor.destroy();

        const textItems = this._settingsItems.filter(t => t.input);
        const depth = this._settingsModal?.depth || 102;

        for (let i = 0; i < textItems.length; i++) {
            const txt = textItems[i];
            if (i === this._selectedIndex) {
                txt.setColor('#FFD700').setScale(1.05);
                this._settingsCursor = this.add.text(
                    txt.x - txt.width * 0.55 - 20, txt.y, '\u25b6',
                    { fontFamily: 'monospace', fontSize: '16px', color: '#FFD700', shadow: SHADOW }
                ).setOrigin(0.5).setDepth(depth);
                this.tweens.add({
                    targets: this._settingsCursor, x: this._settingsCursor.x + 4,
                    duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
                });
            } else {
                const isLast = i === textItems.length - 1;
                txt.setColor(isLast ? '#D4A574' : '#F5E6D0').setScale(1.0);
            }
        }
    }

    _onSettingsConfirm() {
        const key = this._settingsItemKeys[this._selectedIndex];
        if (key === 'back') {
            if (this._settingsModal) {
                this._settingsModal.close();
                if (this._settingsItems) this._settingsItems.forEach(o => o.destroy());
                this._settingsItems = null;
                if (this._settingsCursor) { this._settingsCursor.destroy(); this._settingsCursor = null; }
            }
            return;
        }
        if (key === 'mute') {
            toggleMute();
            this._settingsValues = getAudioSettings();
            this._rebuildSettingsItems();
        }
        if (key === 'tuto') {
            if (this._settingsModal) {
                this._settingsModal.close();
                if (this._settingsItems) this._settingsItems.forEach(o => o.destroy());
                this._settingsItems = null;
            }
            this.scene.start('TutorialScene');
        }
    }

    _onSettingsLeftRight(dir) {
        const key = this._settingsItemKeys?.[this._selectedIndex];
        if (!key) return;
        const step = 0.1 * dir;

        if (key === 'music') {
            const newVal = Math.max(0, Math.min(1, this._settingsValues.musicVolume + step));
            setMusicVolumeLevel(newVal);
        } else if (key === 'sfx') {
            const newVal = Math.max(0, Math.min(1, this._settingsValues.sfxVolume + step));
            setSfxVolume(newVal);
            sfxUIClick();
        } else if (key === 'mute') {
            toggleMute();
        } else {
            return;
        }
        this._settingsValues = getAudioSettings();
        this._rebuildSettingsItems();
    }

    // ================================================================
    // MENU ICONS — pixel art procedural icons for each button
    // ================================================================
    _drawMenuIcon(container, index, def) {
        const g = this.add.graphics();
        const iconX = -def.w / 2 + (def.hero ? 24 : 18);
        const iconY = 0;
        const s = def.hero ? 1.4 : 1; // scale for hero button

        // Shift button text slightly right to make room for icon
        const textNode = container.list.find(c => c.type === 'Text');
        if (textNode && index < 5) {
            textNode.setX(textNode.x + (def.hero ? 10 : 8));
        }

        switch (index) {
            case 0: // JOUER — boule de petanque
                this._iconBoule(g, iconX, iconY, s);
                break;
            case 1: // MODE ARCADE — trophee
                this._iconTrophy(g, iconX, iconY, s);
                break;
            case 2: // PARTIE RAPIDE — eclair
                this._iconBolt(g, iconX, iconY, s);
                break;
            case 3: // MON PERSO — personnage
                this._iconPerso(g, iconX, iconY, s);
                break;
            case 4: // BOUTIQUE — sac/galets
                this._iconShop(g, iconX, iconY, s);
                break;
            case 5: // PARAMETRES — engrenage
                this._iconGear(g, iconX, iconY, s);
                break;
        }

        container.add(g);
    }

    _iconBoule(g, x, y, s) {
        // Metallic boule (silver sphere)
        g.fillStyle(0xB0B0B0, 1);
        g.fillCircle(x, y, 7 * s);
        g.fillStyle(0xD8D8D8, 0.8);
        g.fillCircle(x - 2 * s, y - 2 * s, 4 * s);
        g.fillStyle(0xFFFFFF, 0.5);
        g.fillCircle(x - 3 * s, y - 3 * s, 2 * s);
        // Cochonnet next to it
        g.fillStyle(0xFFD700, 1);
        g.fillCircle(x + 9 * s, y + 3 * s, 3 * s);
        g.fillStyle(0xFFE866, 0.6);
        g.fillCircle(x + 8 * s, y + 2 * s, 1.5 * s);
    }

    _iconTrophy(g, x, y, s) {
        // Cup body
        g.fillStyle(0xFFD700, 1);
        g.fillRect(x - 5 * s, y - 6 * s, 10 * s, 9 * s);
        // Cup rim
        g.fillStyle(0xFFE866, 0.8);
        g.fillRect(x - 6 * s, y - 7 * s, 12 * s, 2 * s);
        // Cup handles
        g.fillStyle(0xFFD700, 0.9);
        g.fillRect(x - 8 * s, y - 5 * s, 3 * s, 5 * s);
        g.fillRect(x + 5 * s, y - 5 * s, 3 * s, 5 * s);
        // Stem
        g.fillStyle(0xD4A574, 1);
        g.fillRect(x - 2 * s, y + 3 * s, 4 * s, 3 * s);
        // Base
        g.fillStyle(0xC4854A, 1);
        g.fillRect(x - 5 * s, y + 5 * s, 10 * s, 2 * s);
        // Star on cup
        g.fillStyle(0xFFFFFF, 0.6);
        g.fillRect(x - 1 * s, y - 4 * s, 2 * s, 2 * s);
    }

    _iconBolt(g, x, y, s) {
        // Lightning bolt
        g.fillStyle(0xFFD700, 1);
        g.beginPath();
        g.moveTo(x + 2 * s, y - 8 * s);
        g.lineTo(x - 4 * s, y + 1 * s);
        g.lineTo(x - 1 * s, y + 1 * s);
        g.lineTo(x - 3 * s, y + 8 * s);
        g.lineTo(x + 4 * s, y - 1 * s);
        g.lineTo(x + 1 * s, y - 1 * s);
        g.closePath();
        g.fillPath();
        // Highlight
        g.fillStyle(0xFFE866, 0.5);
        g.fillRect(x, y - 5 * s, 2 * s, 3 * s);
    }

    _iconPerso(g, x, y, s) {
        // Head
        g.fillStyle(0xF0C8A0, 1);
        g.fillCircle(x, y - 4 * s, 4 * s);
        // Hair
        g.fillStyle(0x8B6B3A, 1);
        g.fillRect(x - 4 * s, y - 8 * s, 8 * s, 3 * s);
        // Body
        g.fillStyle(0x4A8AD0, 1);
        g.fillRect(x - 4 * s, y, 8 * s, 7 * s);
        // Arms
        g.fillStyle(0x4A8AD0, 0.8);
        g.fillRect(x - 6 * s, y + 1 * s, 2 * s, 5 * s);
        g.fillRect(x + 4 * s, y + 1 * s, 2 * s, 5 * s);
        // Eyes
        g.fillStyle(0x3A2E28, 1);
        g.fillRect(x - 2 * s, y - 5 * s, 1.5 * s, 1.5 * s);
        g.fillRect(x + 1 * s, y - 5 * s, 1.5 * s, 1.5 * s);
    }

    _iconShop(g, x, y, s) {
        // Galet (coin)
        g.fillStyle(0xD4A574, 1);
        g.fillCircle(x - 3 * s, y - 2 * s, 5 * s);
        g.fillStyle(0xC4854A, 0.8);
        g.fillCircle(x - 3 * s, y - 2 * s, 3.5 * s);
        g.fillStyle(0xE8C890, 0.6);
        g.fillCircle(x - 4 * s, y - 3 * s, 2 * s);
        // "G" on coin
        g.fillStyle(0x8B6B3A, 0.7);
        g.fillRect(x - 4.5 * s, y - 3 * s, 3 * s, 1 * s);
        // Second coin (stacked)
        g.fillStyle(0xD4A574, 0.7);
        g.fillCircle(x + 4 * s, y + 2 * s, 5 * s);
        g.fillStyle(0xC4854A, 0.6);
        g.fillCircle(x + 4 * s, y + 2 * s, 3.5 * s);
    }

    _iconGear(g, x, y, s) {
        // Gear wheel
        const teeth = 6;
        g.fillStyle(0x9E9E8E, 1);
        g.fillCircle(x, y, 5 * s);
        // Teeth
        for (let i = 0; i < teeth; i++) {
            const angle = (i / teeth) * Math.PI * 2;
            const tx = x + Math.cos(angle) * 6.5 * s;
            const ty = y + Math.sin(angle) * 6.5 * s;
            g.fillRect(tx - 1.5 * s, ty - 1.5 * s, 3 * s, 3 * s);
        }
        // Center hole
        g.fillStyle(0x6B5B3A, 1);
        g.fillCircle(x, y, 2.5 * s);
        // Highlight
        g.fillStyle(0xBBBBBB, 0.4);
        g.fillCircle(x - 1.5 * s, y - 1.5 * s, 2 * s);
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
        this._transitionTo(() => this.scene.start('CharSelectScene'));
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
