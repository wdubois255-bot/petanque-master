import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, TYPEWRITER_SPEED } from '../utils/Constants.js';

const BOX_HEIGHT = 116;
const BOX_MARGIN = 8;
const BOX_PADDING = 16;
const TEXT_COLOR = '#F5E6D0';
const BG_COLOR = 0x3A2E28;
const BORDER_COLOR = 0xF5E6D0;
const TEXT_SHADOW = '#1A1510';

export default class DialogBox {
    constructor(scene) {
        this.scene = scene;
        this.isVisible = false;
        this.lines = [];
        this.currentLine = 0;
        this.isTyping = false;
        this.onComplete = null;

        // Graphics
        this.container = scene.add.container(0, 0).setDepth(100).setVisible(false);

        const boxY = GAME_HEIGHT - BOX_HEIGHT - BOX_MARGIN;

        // Background
        const bg = scene.add.graphics();
        bg.fillStyle(BG_COLOR, 0.92);
        bg.fillRect(BOX_MARGIN, boxY, GAME_WIDTH - BOX_MARGIN * 2, BOX_HEIGHT);
        bg.lineStyle(2, BORDER_COLOR, 0.7);
        bg.strokeRect(BOX_MARGIN, boxY, GAME_WIDTH - BOX_MARGIN * 2, BOX_HEIGHT);
        this.container.add(bg);

        // Name label
        this.nameText = scene.add.text(
            BOX_MARGIN + BOX_PADDING, boxY - 20,
            '',
            {
                fontFamily: 'monospace', fontSize: '20px', color: '#FFD700',
                backgroundColor: '#3A2E28', padding: { x: 8, y: 4 },
                shadow: { offsetX: 2, offsetY: 2, color: TEXT_SHADOW, blur: 0, fill: true }
            }
        ).setDepth(101);
        this.container.add(this.nameText);

        // Dialog text
        this.dialogText = scene.add.text(
            BOX_MARGIN + BOX_PADDING, boxY + BOX_PADDING,
            '',
            {
                fontFamily: 'monospace',
                fontSize: '20px',
                color: TEXT_COLOR,
                wordWrap: { width: GAME_WIDTH - BOX_MARGIN * 2 - BOX_PADDING * 2 },
                lineSpacing: 6,
                shadow: { offsetX: 2, offsetY: 2, color: TEXT_SHADOW, blur: 0, fill: true }
            }
        ).setDepth(101);
        this.container.add(this.dialogText);

        // Arrow indicator (blinking)
        this.arrow = scene.add.text(
            GAME_WIDTH - BOX_MARGIN - BOX_PADDING - 16,
            boxY + BOX_HEIGHT - BOX_PADDING - 20,
            '\u25bc',
            { fontFamily: 'monospace', fontSize: '20px', color: '#D4A574' }
        ).setDepth(101).setVisible(false);
        this.container.add(this.arrow);

        this._arrowTween = scene.tweens.add({
            targets: this.arrow,
            alpha: { from: 1, to: 0 },
            duration: 400,
            yoyo: true,
            repeat: -1,
            paused: true
        });

        // Input
        this._actionKey = scene.input.keyboard.addKey('SPACE');
        this._enterKey = scene.input.keyboard.addKey('ENTER');
        scene.input.on('pointerdown', () => this._advance());
    }

    show(name, lines, onComplete) {
        this.lines = lines;
        this.currentLine = 0;
        this.onComplete = onComplete;
        this.isVisible = true;
        this.container.setVisible(true);
        this.nameText.setText(name || '');
        this._typeLine();
    }

    _typeLine() {
        if (this.currentLine >= this.lines.length) {
            this.hide();
            return;
        }

        const fullText = this.lines[this.currentLine];
        this.dialogText.setText('');
        this.arrow.setVisible(false);
        this._arrowTween.pause();
        this.isTyping = true;

        let charIndex = 0;
        this._typeTimer = this.scene.time.addEvent({
            delay: TYPEWRITER_SPEED,
            callback: () => {
                charIndex++;
                this.dialogText.setText(fullText.substring(0, charIndex));
                if (charIndex >= fullText.length) {
                    this.isTyping = false;
                    this._typeTimer.remove();
                    this.arrow.setVisible(true);
                    this._arrowTween.resume();
                }
            },
            repeat: fullText.length - 1
        });
    }

    _advance() {
        if (!this.isVisible) return;

        if (this.isTyping) {
            // Skip to full text
            if (this._typeTimer) this._typeTimer.remove();
            this.dialogText.setText(this.lines[this.currentLine]);
            this.isTyping = false;
            this.arrow.setVisible(true);
            this._arrowTween.resume();
            return;
        }

        this.currentLine++;
        if (this.currentLine >= this.lines.length) {
            this.hide();
        } else {
            this._typeLine();
        }
    }

    hide() {
        this.isVisible = false;
        this.container.setVisible(false);
        this.arrow.setVisible(false);
        this._arrowTween.pause();
        if (this.onComplete) {
            const cb = this.onComplete;
            this.onComplete = null;
            cb();
        }
    }

    update() {
        if (!this.isVisible) return;
        if (Phaser.Input.Keyboard.JustDown(this._actionKey) ||
            Phaser.Input.Keyboard.JustDown(this._enterKey)) {
            this._advance();
        }
    }
}
