import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, TYPEWRITER_SPEED, FONT_PIXEL, SHADOW_TEXT, DIALOG_BOX_HEIGHT } from '../utils/Constants.js';

const BOX_HEIGHT = DIALOG_BOX_HEIGHT;
const BOX_MARGIN = 12;
const BOX_PADDING = 16;
const TEXT_COLOR = '#3A2E28';
const SHADOW = SHADOW_TEXT;

export default class DialogBox {
    constructor(scene) {
        this.scene = scene;
        this.isVisible = false;
        this.lines = [];
        this.currentLine = 0;
        this.isTyping = false;
        this.onComplete = null;

        this.container = scene.add.container(0, 0).setDepth(100).setVisible(false);

        const boxY = GAME_HEIGHT - BOX_HEIGHT - BOX_MARGIN;

        // Parchment background
        const bg = scene.add.graphics();

        // Shadow behind parchment
        bg.fillStyle(0x1A1510, 0.3);
        bg.fillRoundedRect(BOX_MARGIN + 3, boxY + 3, GAME_WIDTH - BOX_MARGIN * 2, BOX_HEIGHT, 6);

        // Parchment base
        bg.fillStyle(0xE8D5B0, 0.96);
        bg.fillRoundedRect(BOX_MARGIN, boxY, GAME_WIDTH - BOX_MARGIN * 2, BOX_HEIGHT, 6);

        // Paper texture (subtle noise)
        for (let y = boxY + 2; y < boxY + BOX_HEIGHT - 2; y += 3) {
            const alpha = 0.03 + Math.sin(y * 0.5) * 0.02;
            bg.fillStyle(0x8B6B3D, alpha);
            bg.fillRect(BOX_MARGIN + 4, y, GAME_WIDTH - BOX_MARGIN * 2 - 8, 1);
        }

        // Aged edges
        bg.fillStyle(0xC4A060, 0.15);
        bg.fillRoundedRect(BOX_MARGIN, boxY, GAME_WIDTH - BOX_MARGIN * 2, 3, { tl: 6, tr: 6, bl: 0, br: 0 });
        bg.fillRoundedRect(BOX_MARGIN, boxY + BOX_HEIGHT - 3, GAME_WIDTH - BOX_MARGIN * 2, 3, { tl: 0, tr: 0, bl: 6, br: 6 });

        // Border
        bg.lineStyle(2, 0x8B6B3D, 0.5);
        bg.strokeRoundedRect(BOX_MARGIN, boxY, GAME_WIDTH - BOX_MARGIN * 2, BOX_HEIGHT, 6);

        this.container.add(bg);

        // Name label (on top of parchment)
        this.nameText = scene.add.text(
            BOX_MARGIN + BOX_PADDING, boxY - 16,
            '',
            {
                fontFamily: 'monospace', fontSize: '18px', color: '#FFD700',
                backgroundColor: '#6B4F2D', padding: { x: 8, y: 4 },
                shadow: SHADOW
            }
        ).setDepth(101);
        this.container.add(this.nameText);

        // Dialog text (dark on parchment)
        this.dialogText = scene.add.text(
            BOX_MARGIN + BOX_PADDING, boxY + BOX_PADDING,
            '',
            {
                fontFamily: FONT_PIXEL,
                fontSize: '12px',
                color: TEXT_COLOR,
                wordWrap: { width: GAME_WIDTH - BOX_MARGIN * 2 - BOX_PADDING * 2 },
                lineSpacing: 6,
                shadow: { offsetX: 1, offsetY: 1, color: 'rgba(139,107,61,0.2)', blur: 0, fill: true }
            }
        ).setDepth(101);
        this.container.add(this.dialogText);

        // Arrow indicator
        this.arrow = scene.add.text(
            GAME_WIDTH - BOX_MARGIN - BOX_PADDING - 16,
            boxY + BOX_HEIGHT - BOX_PADDING - 16,
            '\u25BC',
            { fontFamily: 'monospace', fontSize: '18px', color: '#8B6B3D' }
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
        scene.input.on('pointerdown', this._onPointer, this);
    }

    show(lines, name, onComplete) {
        this.lines = Array.isArray(lines) ? lines : [lines];
        this.currentLine = 0;
        this.onComplete = onComplete;
        this.isVisible = true;
        this.container.setVisible(true);

        if (name) {
            this.nameText.setText(name).setVisible(true);
        } else {
            this.nameText.setVisible(false);
        }

        this._typeLine(this.lines[0]);
    }

    _typeLine(text) {
        this.isTyping = true;
        this.arrow.setVisible(false);
        this._arrowTween.pause();
        this.dialogText.setText('');
        this._fullText = text;
        this._charIndex = 0;

        if (this._typeTimer) this._typeTimer.remove();
        this._typeTimer = this.scene.time.addEvent({
            delay: TYPEWRITER_SPEED,
            repeat: text.length - 1,
            callback: () => {
                this._charIndex++;
                this.dialogText.setText(text.substring(0, this._charIndex));
                if (this._charIndex >= text.length) {
                    this.isTyping = false;
                    this.arrow.setVisible(true);
                    this._arrowTween.resume();
                }
            }
        });
    }

    _onPointer() {
        if (!this.isVisible) return;
        this._advance();
    }

    update() {
        if (!this.isVisible) return;
        if (Phaser.Input.Keyboard.JustDown(this._actionKey) || Phaser.Input.Keyboard.JustDown(this._enterKey)) {
            this._advance();
        }
    }

    _advance() {
        if (this.isTyping) {
            // Skip typing
            if (this._typeTimer) this._typeTimer.remove();
            this.dialogText.setText(this._fullText);
            this.isTyping = false;
            this.arrow.setVisible(true);
            this._arrowTween.resume();
            return;
        }

        this.currentLine++;
        if (this.currentLine < this.lines.length) {
            this._typeLine(this.lines[this.currentLine]);
        } else {
            this.hide();
            if (this.onComplete) this.onComplete();
        }
    }

    hide() {
        this.isVisible = false;
        this.container.setVisible(false);
        if (this._typeTimer) this._typeTimer.remove();
    }

    destroy() {
        this.hide();
        this.scene.input.off('pointerdown', this._onPointer, this);
        this.container.destroy();
    }
}
