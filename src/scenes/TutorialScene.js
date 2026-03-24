import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../utils/Constants.js';
import { setSoundScene, sfxUIClick } from '../utils/SoundManager.js';
import { loadSave, saveSave } from '../utils/SaveManager.js';
import UIFactory from '../ui/UIFactory.js';
import { fadeToScene } from '../utils/SceneTransition.js';
import I18n from '../utils/I18n.js';

const SHADOW = { offsetX: 2, offsetY: 2, color: '#1A1510', blur: 0, fill: true };
const SHADOW_HEAVY = { offsetX: 3, offsetY: 3, color: '#1A1510', blur: 2, fill: true };

const PAGE_COUNT = 5;
const CONTENT_W = 600;
const CONTENT_H = 350;
const CONTENT_X = (GAME_WIDTH - CONTENT_W) / 2;
const CONTENT_Y = 50;
const FADE_MS = 200;

export default class TutorialScene extends Phaser.Scene {
    constructor() {
        super('TutorialScene');
    }

    init() {
        this._page = 0;
        this._inputEnabled = false;
        this._transitioning = false;
    }

    create() {

        setSoundScene(this);

        // Solid dark background
        this.add.graphics()
            .fillStyle(0x1A1510, 1)
            .fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Subtle border frame
        const frame = this.add.graphics();
        frame.lineStyle(1, COLORS.OCRE, 0.25);
        frame.strokeRoundedRect(20, 20, GAME_WIDTH - 40, GAME_HEIGHT - 40, 6);

        // Page indicator (top-right)
        this._pageIndicator = this.add.text(GAME_WIDTH - 40, 35, '', {
            fontFamily: 'monospace', fontSize: '14px', color: '#9E9E8E', shadow: SHADOW
        }).setOrigin(1, 0);

        // Container for page content (allows fade transitions)
        this._contentContainer = this.add.container(0, 0);

        // Navigation buttons (persistent, updated per page)
        this._navLeft = this.add.text(60, GAME_HEIGHT - 45, I18n.t('tutorial.previous'), {
            fontFamily: 'monospace', fontSize: '16px', color: '#D4A574', shadow: SHADOW
        }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });
        this._navLeft.on('pointerdown', () => this._goPrev());
        this._navLeft.on('pointerover', () => this._navLeft.setColor('#FFD700'));
        this._navLeft.on('pointerout', () => this._navLeft.setColor('#D4A574'));

        this._navRight = this.add.text(GAME_WIDTH - 60, GAME_HEIGHT - 45, I18n.t('tutorial.next'), {
            fontFamily: 'monospace', fontSize: '16px', color: '#D4A574', shadow: SHADOW
        }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });
        this._navRight.on('pointerdown', () => this._goNext());
        this._navRight.on('pointerover', () => this._navRight.setColor('#FFD700'));
        this._navRight.on('pointerout', () => this._navRight.setColor('#D4A574'));

        // "J'AI COMPRIS" button (last page only)
        this._doneBtn = this.add.text(GAME_WIDTH - 60, GAME_HEIGHT - 45, I18n.t('tutorial.understood'), {
            fontFamily: 'monospace', fontSize: '18px', color: '#1A1510',
            backgroundColor: '#FFD700', padding: { x: 16, y: 8 },
            shadow: { offsetX: 1, offsetY: 1, color: '#B8960A', blur: 0, fill: true }
        }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true }).setVisible(false);
        this._doneBtn.on('pointerdown', () => this._finish());
        this._doneBtn.on('pointerover', () => this._doneBtn.setStyle({ backgroundColor: '#FFE44D' }));
        this._doneBtn.on('pointerout', () => this._doneBtn.setStyle({ backgroundColor: '#FFD700' }));

        // Controls hint
        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 16, I18n.t('tutorial.controls_hint'), {
            fontFamily: 'monospace', fontSize: '12px', color: '#9E9E8E', shadow: SHADOW
        }).setOrigin(0.5);

        // Back button (bottom-left, binds ESC)
        UIFactory.addBackButton(this, 'TitleScene');

        // Keyboard
        this.cursors = this.input.keyboard.createCursorKeys();
        this.enterKey = this.input.keyboard.addKey('ENTER');

        // Render first page
        this._renderPage(0);

        // Fade in
        this.cameras.main.fadeIn(300, 26, 21, 16);
        this.time.delayedCall(350, () => { this._inputEnabled = true; });

        this.events.on('shutdown', this._shutdown, this);
    }

    _shutdown() {
        this.input.keyboard.removeAllListeners();
        this.tweens.killAll();
    }

    // ================================================================
    // NAVIGATION
    // ================================================================

    _goPrev() {
        if (!this._inputEnabled || this._transitioning || this._page <= 0) return;
        sfxUIClick();
        this._transitionToPage(this._page - 1);
    }

    _goNext() {
        if (!this._inputEnabled || this._transitioning) return;
        if (this._page >= PAGE_COUNT - 1) {
            this._finish();
            return;
        }
        sfxUIClick();
        this._transitionToPage(this._page + 1);
    }

    _finish() {
        if (!this._inputEnabled || this._transitioning) return;
        sfxUIClick();
        const save = loadSave();
        save.tutorialSeen = true;
        saveSave(save);
        this._inputEnabled = false;
        this.cameras.main.fadeOut(400, 26, 21, 16);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            fadeToScene(this, 'TitleScene');
        });
    }

    _transitionToPage(newPage) {
        this._transitioning = true;
        this.tweens.add({
            targets: this._contentContainer,
            alpha: 0,
            duration: FADE_MS,
            onComplete: () => {
                this._renderPage(newPage);
                this.tweens.add({
                    targets: this._contentContainer,
                    alpha: 1,
                    duration: FADE_MS,
                    onComplete: () => { this._transitioning = false; }
                });
            }
        });
    }

    _renderPage(index) {
        this._page = index;

        // Clear old content
        this._contentContainer.removeAll(true);

        // Update page indicator
        this._pageIndicator.setText(`${index + 1}/${PAGE_COUNT}`);

        // Update nav visibility
        this._navLeft.setVisible(index > 0);
        this._navRight.setVisible(index < PAGE_COUNT - 1);
        this._doneBtn.setVisible(index === PAGE_COUNT - 1);

        // Draw page
        switch (index) {
            case 0: this._drawPageObjectif(); break;
            case 1: this._drawPageLancer(); break;
            case 2: this._drawPageTechniques(); break;
            case 3: this._drawPageScore(); break;
            case 4: this._drawPageAstuces(); break;
        }
    }

    // ================================================================
    // PAGE 1 - OBJECTIF
    // ================================================================
    _drawPageObjectif() {
        const cx = GAME_WIDTH / 2;

        const title = this.add.text(cx, CONTENT_Y + 20, I18n.t('tutorial.page1_title'), {
            fontFamily: 'monospace', fontSize: '24px', color: '#FFD700', shadow: SHADOW_HEAVY
        }).setOrigin(0.5);
        this._contentContainer.add(title);

        const desc = this.add.text(cx, CONTENT_Y + 65,
            'Placez vos boules le plus pres possible du cochonnet\n(la petite boule doree).', {
            fontFamily: 'monospace', fontSize: '16px', color: '#F5E6D0',
            align: 'center', shadow: SHADOW, lineSpacing: 4
        }).setOrigin(0.5);
        this._contentContainer.add(desc);

        // Illustration: cochonnet + 2 player boules (blue) + 1 opponent (red)
        const gfx = this.add.graphics();
        const diagX = cx;
        const diagY = CONTENT_Y + 200;

        // Cochonnet (gold, small)
        gfx.fillStyle(0xB8960A, 1);
        gfx.fillCircle(diagX, diagY, 7);
        gfx.fillStyle(0xFFD700, 1);
        gfx.fillCircle(diagX, diagY, 5);
        gfx.fillStyle(0xFFFFFF, 0.5);
        gfx.fillCircle(diagX - 1, diagY - 1, 2);

        // Label cochonnet
        const cochLabel = this.add.text(diagX, diagY - 18, 'Cochonnet', {
            fontFamily: 'monospace', fontSize: '11px', color: '#FFD700', shadow: SHADOW
        }).setOrigin(0.5);
        this._contentContainer.add(cochLabel);

        // Player boule (blue, close) - 35px away
        const p1x = diagX - 30, p1y = diagY + 25;
        this._drawIllustrationBoule(gfx, p1x, p1y, 0x5B8ED4, 10);

        // Player boule 2 (blue, medium) - 50px away
        const p2x = diagX + 20, p2y = diagY + 42;
        this._drawIllustrationBoule(gfx, p2x, p2y, 0x5B8ED4, 10);

        // Opponent boule (red, far) - 70px away
        const o1x = diagX + 55, o1y = diagY - 40;
        this._drawIllustrationBoule(gfx, o1x, o1y, 0xC44B3F, 10);

        // Distance lines (dashed effect)
        gfx.lineStyle(1, 0x5B8ED4, 0.5);
        gfx.beginPath();
        gfx.moveTo(diagX, diagY);
        gfx.lineTo(p1x, p1y);
        gfx.strokePath();

        gfx.lineStyle(1, 0xC44B3F, 0.5);
        gfx.beginPath();
        gfx.moveTo(diagX, diagY);
        gfx.lineTo(o1x, o1y);
        gfx.strokePath();

        // Distance labels
        const distClose = this.add.text((diagX + p1x) / 2 - 15, (diagY + p1y) / 2, 'Proche !', {
            fontFamily: 'monospace', fontSize: '10px', color: '#87CEEB', shadow: SHADOW
        }).setOrigin(0.5);
        this._contentContainer.add(distClose);

        const distFar = this.add.text((diagX + o1x) / 2 + 15, (diagY + o1y) / 2, 'Loin...', {
            fontFamily: 'monospace', fontSize: '10px', color: '#C44B3F', shadow: SHADOW
        }).setOrigin(0.5);
        this._contentContainer.add(distFar);

        // Legend
        const legendY = diagY + 85;
        gfx.fillStyle(0x5B8ED4, 1);
        gfx.fillCircle(cx - 80, legendY, 6);
        const leg1 = this.add.text(cx - 68, legendY, 'Vous', {
            fontFamily: 'monospace', fontSize: '12px', color: '#87CEEB', shadow: SHADOW
        }).setOrigin(0, 0.5);
        this._contentContainer.add(leg1);

        gfx.fillStyle(0xC44B3F, 1);
        gfx.fillCircle(cx + 30, legendY, 6);
        const leg2 = this.add.text(cx + 42, legendY, 'Adversaire', {
            fontFamily: 'monospace', fontSize: '12px', color: '#C44B3F', shadow: SHADOW
        }).setOrigin(0, 0.5);
        this._contentContainer.add(leg2);

        this._contentContainer.add(gfx);
    }

    // ================================================================
    // PAGE 2 - COMMENT LANCER
    // ================================================================
    _drawPageLancer() {
        const cx = GAME_WIDTH / 2;

        const title = this.add.text(cx, CONTENT_Y + 20, I18n.t('tutorial.page2_title'), {
            fontFamily: 'monospace', fontSize: '24px', color: '#FFD700', shadow: SHADOW_HEAVY
        }).setOrigin(0.5);
        this._contentContainer.add(title);

        const desc = this.add.text(cx, CONTENT_Y + 80,
            'Glissez depuis le cercle de lancer vers votre cible.\nPlus vous glissez loin, plus la boule ira loin.\nLa direction du glissement determine la trajectoire.', {
            fontFamily: 'monospace', fontSize: '14px', color: '#F5E6D0',
            align: 'center', shadow: SHADOW, lineSpacing: 6
        }).setOrigin(0.5);
        this._contentContainer.add(desc);

        // Illustration: drag arrow from bottom circle to target
        const gfx = this.add.graphics();
        const arrowStartX = cx;
        const arrowStartY = CONTENT_Y + 300;
        const arrowEndX = cx;
        const arrowEndY = CONTENT_Y + 170;

        // Throw circle (bottom)
        gfx.lineStyle(2, 0xFFD700, 0.7);
        gfx.strokeCircle(arrowStartX, arrowStartY, 18);
        gfx.fillStyle(0xFFD700, 0.15);
        gfx.fillCircle(arrowStartX, arrowStartY, 18);

        // "Glissez" label near circle
        const glissez = this.add.text(arrowStartX + 35, arrowStartY, 'Glissez ici', {
            fontFamily: 'monospace', fontSize: '11px', color: '#FFD700', shadow: SHADOW
        }).setOrigin(0, 0.5);
        this._contentContainer.add(glissez);

        // Arrow shaft
        gfx.lineStyle(3, 0xF5E6D0, 0.7);
        gfx.beginPath();
        gfx.moveTo(arrowStartX, arrowStartY - 22);
        gfx.lineTo(arrowEndX, arrowEndY + 12);
        gfx.strokePath();

        // Arrow head
        gfx.fillStyle(0xF5E6D0, 0.7);
        gfx.fillTriangle(
            arrowEndX, arrowEndY,
            arrowEndX - 8, arrowEndY + 16,
            arrowEndX + 8, arrowEndY + 16
        );

        // Target area (top)
        gfx.lineStyle(1, 0xFFD700, 0.4);
        gfx.strokeCircle(arrowEndX, arrowEndY - 10, 12);
        gfx.strokeCircle(arrowEndX, arrowEndY - 10, 6);
        gfx.fillStyle(0xFFD700, 1);
        gfx.fillCircle(arrowEndX, arrowEndY - 10, 2);

        // "Direction" label
        const dirLabel = this.add.text(arrowEndX + 30, arrowEndY - 10, 'Direction', {
            fontFamily: 'monospace', fontSize: '11px', color: '#F5E6D0', shadow: SHADOW
        }).setOrigin(0, 0.5);
        this._contentContainer.add(dirLabel);

        // Power indicator (side bar)
        const barX = cx - 120;
        const barY = arrowEndY + 10;
        const barH = arrowStartY - arrowEndY - 30;
        gfx.fillStyle(0x3A2E28, 0.8);
        gfx.fillRect(barX, barY, 14, barH);
        // Gradient fill
        const steps = 10;
        for (let i = 0; i < steps; i++) {
            const ratio = i / steps;
            const r = Math.floor(0x40 + ratio * (0xFF - 0x40));
            const g = Math.floor(0xD7 - ratio * 0x90);
            const b = Math.floor(0x00);
            const color = (r << 16) | (g << 8) | b;
            gfx.fillStyle(color, 0.8);
            gfx.fillRect(barX + 2, barY + barH - (i + 1) * (barH / steps), 10, barH / steps);
        }
        const powLabel = this.add.text(barX + 7, barY - 10, 'Force', {
            fontFamily: 'monospace', fontSize: '10px', color: '#D4A574', shadow: SHADOW
        }).setOrigin(0.5);
        this._contentContainer.add(powLabel);

        this._contentContainer.add(gfx);
    }

    // ================================================================
    // PAGE 3 - TECHNIQUES
    // ================================================================
    _drawPageTechniques() {
        const cx = GAME_WIDTH / 2;

        const title = this.add.text(cx, CONTENT_Y + 20, I18n.t('tutorial.page3_title'), {
            fontFamily: 'monospace', fontSize: '24px', color: '#FFD700', shadow: SHADOW_HEAVY
        }).setOrigin(0.5);
        this._contentContainer.add(title);

        const techniques = [
            { key: '1', name: 'ROULETTE', desc: 'La boule roule au sol. Tres precise.', color: '#87CEEB', arcH: 5 },
            { key: '2', name: 'DEMI-PORTEE', desc: 'Mi-vol, mi-roulement. Polyvalente.', color: '#D4A574', arcH: 30 },
            { key: '3', name: 'PLOMBEE', desc: 'La boule vole haut et s\'arrete court.', color: '#9B7BB8', arcH: 55 },
            { key: 'T', name: 'TIR', desc: 'Frappe directe sur une boule adverse.', color: '#C44B3F', arcH: 40 }
        ];

        const startY = CONTENT_Y + 70;
        const gfx = this.add.graphics();

        techniques.forEach((tech, i) => {
            const y = startY + i * 72;

            // Key badge
            gfx.fillStyle(Phaser.Display.Color.HexStringToColor(tech.color).color, 0.2);
            gfx.fillRoundedRect(cx - 260, y - 12, 28, 28, 4);
            gfx.lineStyle(1, Phaser.Display.Color.HexStringToColor(tech.color).color, 0.6);
            gfx.strokeRoundedRect(cx - 260, y - 12, 28, 28, 4);

            const keyText = this.add.text(cx - 246, y + 2, tech.key, {
                fontFamily: 'monospace', fontSize: '16px', color: tech.color, shadow: SHADOW
            }).setOrigin(0.5);
            this._contentContainer.add(keyText);

            // Technique name
            const nameText = this.add.text(cx - 220, y - 4, tech.name, {
                fontFamily: 'monospace', fontSize: '15px', color: tech.color, shadow: SHADOW
            }).setOrigin(0, 0);
            this._contentContainer.add(nameText);

            // Description
            const descText = this.add.text(cx - 220, y + 16, tech.desc, {
                fontFamily: 'monospace', fontSize: '12px', color: '#F5E6D0', shadow: SHADOW
            }).setOrigin(0, 0);
            this._contentContainer.add(descText);

            // Mini arc illustration (right side)
            const arcX = cx + 170;
            const arcY = y + 8;
            const arcW = 70;

            // Ground line
            gfx.lineStyle(1, 0x9E9E8E, 0.3);
            gfx.beginPath();
            gfx.moveTo(arcX - arcW / 2, arcY);
            gfx.lineTo(arcX + arcW / 2, arcY);
            gfx.strokePath();

            // Arc trajectory
            gfx.lineStyle(2, Phaser.Display.Color.HexStringToColor(tech.color).color, 0.6);
            gfx.beginPath();
            const points = [];
            for (let t = 0; t <= 1; t += 0.05) {
                const px = arcX - arcW / 2 + t * arcW;
                const py = arcY - Math.sin(t * Math.PI) * tech.arcH;
                points.push({ x: px, y: py });
            }
            gfx.moveTo(points[0].x, points[0].y);
            for (let p = 1; p < points.length; p++) {
                gfx.lineTo(points[p].x, points[p].y);
            }
            gfx.strokePath();

            // Ball at start
            gfx.fillStyle(Phaser.Display.Color.HexStringToColor(tech.color).color, 0.8);
            gfx.fillCircle(arcX - arcW / 2, arcY, 4);
        });

        this._contentContainer.add(gfx);
    }

    // ================================================================
    // PAGE 4 - SCORE
    // ================================================================
    _drawPageScore() {
        const cx = GAME_WIDTH / 2;

        const title = this.add.text(cx, CONTENT_Y + 20, I18n.t('tutorial.page4_title'), {
            fontFamily: 'monospace', fontSize: '24px', color: '#FFD700', shadow: SHADOW_HEAVY
        }).setOrigin(0.5);
        this._contentContainer.add(title);

        const desc = this.add.text(cx, CONTENT_Y + 85,
            'Apres chaque mene :\n' +
            '- Comptez vos boules plus proches du cochonnet\n' +
            '  que la meilleure boule adverse.\n' +
            '- Chaque boule proche = 1 point.\n' +
            '- Premier a 13 points gagne !', {
            fontFamily: 'monospace', fontSize: '14px', color: '#F5E6D0',
            align: 'left', shadow: SHADOW, lineSpacing: 6
        }).setOrigin(0.5);
        this._contentContainer.add(desc);

        // Scoring diagram
        const gfx = this.add.graphics();
        const diagX = cx;
        const diagY = CONTENT_Y + 240;

        // Cochonnet
        gfx.fillStyle(0xB8960A, 1);
        gfx.fillCircle(diagX, diagY, 6);
        gfx.fillStyle(0xFFD700, 1);
        gfx.fillCircle(diagX, diagY, 4);

        // Player boule 1 (very close)
        this._drawIllustrationBoule(gfx, diagX - 22, diagY + 15, 0x5B8ED4, 9);
        // Player boule 2 (close)
        this._drawIllustrationBoule(gfx, diagX + 18, diagY - 20, 0x5B8ED4, 9);
        // Opponent boule (far)
        this._drawIllustrationBoule(gfx, diagX + 65, diagY + 35, 0xC44B3F, 9);

        // Distance circles (concentric)
        gfx.lineStyle(1, 0x5B8ED4, 0.2);
        gfx.strokeCircle(diagX, diagY, 30);
        gfx.lineStyle(1, 0xC44B3F, 0.2);
        gfx.strokeCircle(diagX, diagY, 75);

        // Result text
        const resultBg = this.add.graphics();
        resultBg.fillStyle(0x3A2E28, 0.8);
        resultBg.fillRoundedRect(cx - 100, diagY + 65, 200, 36, 6);
        resultBg.lineStyle(1, 0xFFD700, 0.4);
        resultBg.strokeRoundedRect(cx - 100, diagY + 65, 200, 36, 6);
        this._contentContainer.add(resultBg);

        const result = this.add.text(cx, diagY + 83, '= 2 points pour VOUS !', {
            fontFamily: 'monospace', fontSize: '14px', color: '#FFD700', shadow: SHADOW
        }).setOrigin(0.5);
        this._contentContainer.add(result);

        this._contentContainer.add(gfx);
    }

    // ================================================================
    // PAGE 5 - ASTUCES
    // ================================================================
    _drawPageAstuces() {
        const cx = GAME_WIDTH / 2;

        const title = this.add.text(cx, CONTENT_Y + 20, I18n.t('tutorial.page5_title'), {
            fontFamily: 'monospace', fontSize: '24px', color: '#FFD700', shadow: SHADOW_HEAVY
        }).setOrigin(0.5);
        this._contentContainer.add(title);

        const tips = [
            { key: 'F', name: 'FOCUS', desc: 'Stabilise la visee (-80% tremblement).\nVous avez 5 charges par match.', color: '#87CEEB' },
            { key: 'R', name: 'RETRO', desc: 'Active le backspin pour freiner\nla boule apres l\'atterrissage.', color: '#D4A574' },
            { key: 'C', name: 'CAPACITE', desc: 'Pouvoir unique de votre personnage.\nA utiliser au bon moment !', color: '#9B7BB8' },
            { key: 'TAB', name: 'CLASSEMENT', desc: 'Voir le classement des boules\net les distances en temps reel.', color: '#6B8E4E' }
        ];

        const startY = CONTENT_Y + 70;
        const gfx = this.add.graphics();

        tips.forEach((tip, i) => {
            const y = startY + i * 78;

            // Key badge
            const badgeW = tip.key.length > 1 ? 44 : 28;
            gfx.fillStyle(Phaser.Display.Color.HexStringToColor(tip.color).color, 0.15);
            gfx.fillRoundedRect(cx - 260, y - 12, badgeW, 28, 4);
            gfx.lineStyle(1, Phaser.Display.Color.HexStringToColor(tip.color).color, 0.5);
            gfx.strokeRoundedRect(cx - 260, y - 12, badgeW, 28, 4);

            const keyText = this.add.text(cx - 260 + badgeW / 2, y + 2, tip.key, {
                fontFamily: 'monospace', fontSize: '13px', color: tip.color, shadow: SHADOW
            }).setOrigin(0.5);
            this._contentContainer.add(keyText);

            // Name
            const nameText = this.add.text(cx - 260 + badgeW + 12, y - 6, tip.name, {
                fontFamily: 'monospace', fontSize: '15px', color: tip.color, shadow: SHADOW
            }).setOrigin(0, 0);
            this._contentContainer.add(nameText);

            // Description
            const descText = this.add.text(cx - 260 + badgeW + 12, y + 14, tip.desc, {
                fontFamily: 'monospace', fontSize: '12px', color: '#F5E6D0',
                shadow: SHADOW, lineSpacing: 3
            }).setOrigin(0, 0);
            this._contentContainer.add(descText);
        });

        this._contentContainer.add(gfx);
    }

    // ================================================================
    // HELPERS
    // ================================================================

    _drawIllustrationBoule(gfx, x, y, color, r) {
        // Shadow
        gfx.fillStyle(0x3A2E28, 0.3);
        gfx.fillEllipse(x + 1, y + r - 2, r * 1.4, r * 0.5);
        // Body
        gfx.fillStyle(color, 1);
        gfx.fillCircle(x, y, r);
        // Highlight
        gfx.fillStyle(0xFFFFFF, 0.35);
        gfx.fillCircle(x - r * 0.25, y - r * 0.25, r * 0.35);
    }

    // ================================================================
    // UPDATE
    // ================================================================
    update() {
        if (!this._inputEnabled || this._transitioning) return;

        if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
            this._goPrev();
        }
        if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
            this._goNext();
        }
        if (Phaser.Input.Keyboard.JustDown(this.enterKey) && this._page === PAGE_COUNT - 1) {
            this._finish();
        }
    }
}
