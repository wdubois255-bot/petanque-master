import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, FONT_PIXEL } from '../utils/Constants.js';
import { setSoundScene, startMusic, stopMusic, sfxUIClick } from '../utils/SoundManager.js';
import { fadeToScene } from '../utils/SceneTransition.js';
import I18n from '../utils/I18n.js';
import UIFactory from '../ui/UIFactory.js';

const SHADOW = { offsetX: 2, offsetY: 2, color: '#1A1510', blur: 0, fill: true };
const SCROLL_SPEED = 0.4; // px per frame

export default class CreditsScene extends Phaser.Scene {
    constructor() {
        super('CreditsScene');
    }

    init() {
        this._scrollY = 0;
        this._container = null;
        this._inputEnabled = false;
    }

    create() {
        setSoundScene(this);
        this.cameras.main.setAlpha(1);
        this.cameras.main.resetFX();
        startMusic('music_title', 0.25);
        UIFactory.fadeIn(this);

        // Background: warm dark gradient
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x1A1510, 0x1A1510, 0x2A2520, 0x2A2520, 1);
        bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Subtle texture dots
        for (let i = 0; i < 60; i++) {
            const gx = Phaser.Math.Between(0, GAME_WIDTH);
            const gy = Phaser.Math.Between(0, GAME_HEIGHT);
            bg.fillStyle(0xFFFFFF, Phaser.Math.FloatBetween(0.02, 0.05));
            bg.fillRect(gx, gy, 1, 1);
        }

        // Credits content as scrolling container
        this._container = this.add.container(0, GAME_HEIGHT + 20);

        const credits = this._buildCreditsText();
        let y = 0;

        for (const entry of credits) {
            if (entry.type === 'title') {
                const t = this.add.text(GAME_WIDTH / 2, y, entry.text, {
                    fontFamily: FONT_PIXEL, fontSize: '18px', color: '#FFD700',
                    align: 'center', shadow: SHADOW
                }).setOrigin(0.5);
                this._container.add(t);
                y += 40;
            } else if (entry.type === 'heading') {
                const t = this.add.text(GAME_WIDTH / 2, y, entry.text, {
                    fontFamily: 'monospace', fontSize: '14px', color: '#D4A574',
                    align: 'center', shadow: SHADOW
                }).setOrigin(0.5);
                this._container.add(t);
                y += 28;
            } else if (entry.type === 'line') {
                const t = this.add.text(GAME_WIDTH / 2, y, entry.text, {
                    fontFamily: 'monospace', fontSize: '11px', color: '#F5E6D0',
                    align: 'center', shadow: SHADOW, wordWrap: { width: 500 }
                }).setOrigin(0.5);
                this._container.add(t);
                y += 20;
            } else if (entry.type === 'spacer') {
                y += entry.height || 30;
            }
        }

        this._totalHeight = y;

        // Back button (always visible)
        const backBtn = this.add.text(20, GAME_HEIGHT - 24, I18n.t('ui.back'), {
            fontFamily: 'monospace', fontSize: '12px', color: '#D4A574', shadow: SHADOW
        }).setOrigin(0, 0.5).setDepth(10).setInteractive({ useHandCursor: true });
        backBtn.on('pointerover', () => backBtn.setColor('#FFD700'));
        backBtn.on('pointerout', () => backBtn.setColor('#D4A574'));
        backBtn.on('pointerdown', () => this._back());

        // Keyboard
        this.input.keyboard.on('keydown-ESC', () => this._back());
        this.input.keyboard.on('keydown-SPACE', () => this._back());

        this.time.delayedCall(300, () => { this._inputEnabled = true; });
        this.events.on('shutdown', () => {
            stopMusic();
            this.input.keyboard.removeAllListeners();
            this.tweens.killAll();
        });
    }

    update() {
        if (!this._container) return;
        this._container.y -= SCROLL_SPEED;

        // When all credits have scrolled past, loop back
        if (this._container.y < -(this._totalHeight + 40)) {
            this._back();
        }
    }

    _back() {
        if (!this._inputEnabled) return;
        this._inputEnabled = false;
        sfxUIClick();
        fadeToScene(this, 'TitleScene');
    }

    _buildCreditsText() {
        return [
            { type: 'title', text: 'PETANQUE MASTER' },
            { type: 'line', text: 'v1.0' },
            { type: 'spacer', height: 40 },

            { type: 'heading', text: '--- GAME DESIGN & CODE ---' },
            { type: 'line', text: 'Concept, Design, Programming' },
            { type: 'spacer', height: 30 },

            { type: 'heading', text: '--- TECHNOLOGY ---' },
            { type: 'line', text: 'Phaser 4.0.0 RC6 — Game Framework' },
            { type: 'line', text: 'Vite — Build System' },
            { type: 'line', text: 'PixelLab MCP — Sprite Generation' },
            { type: 'line', text: 'ElevenLabs MCP — Sound Effects' },
            { type: 'line', text: 'Claude Code — AI Assistant' },
            { type: 'spacer', height: 30 },

            { type: 'heading', text: '--- PIXEL ART ---' },
            { type: 'line', text: 'Character sprites — PixelLab + hand editing' },
            { type: 'line', text: 'UI elements — Procedural generation' },
            { type: 'line', text: 'Font — PressStart2P (OFL license)' },
            { type: 'spacer', height: 30 },

            { type: 'heading', text: '--- AUDIO ---' },
            { type: 'line', text: 'Sound Effects — ElevenLabs + Procedural synthesis' },
            { type: 'line', text: 'Music — Original compositions' },
            { type: 'spacer', height: 30 },

            { type: 'heading', text: '--- SPECIAL THANKS ---' },
            { type: 'line', text: 'Jules Lenoir & Ernest Pitiot' },
            { type: 'line', text: 'Inventeurs de la petanque' },
            { type: 'line', text: 'La Ciotat, 1907' },
            { type: 'spacer', height: 20 },
            { type: 'line', text: '"Pied tanque" — jouer les pieds ancres au sol' },
            { type: 'spacer', height: 30 },

            { type: 'heading', text: '--- LA PETANQUE ---' },
            { type: 'line', text: 'Regles FIPJP — Federation Internationale' },
            { type: 'line', text: 'de Petanque et Jeu Provencal' },
            { type: 'spacer', height: 40 },

            { type: 'title', text: 'MERCI DE JOUER !' },
            { type: 'spacer', height: 60 },
        ];
    }
}
