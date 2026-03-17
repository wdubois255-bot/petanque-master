import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, getCharSpriteKey } from '../utils/Constants.js';
import { setSoundScene, sfxVictory, sfxDefeat } from '../utils/SoundManager.js';

const SHADOW = { offsetX: 2, offsetY: 2, color: '#1A1510', blur: 0, fill: true };

/**
 * Result Screen - Shown after a match ends
 * Displays score, match stats, and character animations
 */
export default class ResultScene extends Phaser.Scene {
    constructor() {
        super('ResultScene');
    }

    init(data) {
        this.won = data.won || false;
        this.scores = data.scores || { player: 0, opponent: 0 };
        this.playerCharacter = data.playerCharacter || null;
        this.opponentCharacter = data.opponentCharacter || null;
        this.terrainName = data.terrainName || '';
        this.returnScene = data.returnScene || 'TitleScene';
        this.arcadeState = data.arcadeState || null;
        this.matchStats = data.matchStats || {};
    }

    create() {
        setSoundScene(this);
        // Play victory/defeat sound
        if (this.won) { sfxVictory(); } else { sfxDefeat(); }

        // Background
        const bg = this.add.graphics();
        if (this.won) {
            bg.fillGradientStyle(0x1A2A1A, 0x1A2A1A, 0x2A3A28, 0x2A3A28, 1);
        } else {
            bg.fillGradientStyle(0x2A1A1A, 0x2A1A1A, 0x3A2828, 0x3A2828, 1);
        }
        bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Result title
        const titleColor = this.won ? '#FFD700' : '#C44B3F';
        const titleText = this.won ? 'VICTOIRE !' : 'DEFAITE...';

        const title = this.add.text(GAME_WIDTH / 2, 50, titleText, {
            fontFamily: 'monospace', fontSize: '48px', color: titleColor,
            shadow: { offsetX: 4, offsetY: 4, color: '#1A1510', blur: 0, fill: true }
        }).setOrigin(0.5).setScale(0);

        // Slam in
        this.tweens.add({
            targets: title, scale: 1, duration: 400, ease: 'Back.easeOut',
            delay: 200,
            onComplete: () => {
                if (this.won) this.cameras.main.flash(100, 255, 215, 0);
            }
        });

        // Score
        const scoreText = `${this.scores.player} - ${this.scores.opponent}`;
        this.add.text(GAME_WIDTH / 2, 110, scoreText, {
            fontFamily: 'monospace', fontSize: '40px', color: '#F5E6D0',
            shadow: { offsetX: 3, offsetY: 3, color: '#1A1510', blur: 0, fill: true }
        }).setOrigin(0.5);

        // Character sprites
        const winner = this.won ? this.playerCharacter : this.opponentCharacter;

        if (winner) {
            const winKey = this._getSpriteKey(winner);
            if (this.textures.exists(winKey)) {
                const winSprite = this.add.sprite(GAME_WIDTH / 2, 210, winKey, 0)
                    .setScale(0.75).setOrigin(0.5);
                // Victory bounce
                this.tweens.add({
                    targets: winSprite, y: 200,
                    duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
                });
            }
            this.add.text(GAME_WIDTH / 2, 260, winner.name, {
                fontFamily: 'monospace', fontSize: '20px',
                color: this.won ? '#87CEEB' : '#C44B3F', shadow: SHADOW
            }).setOrigin(0.5);
        }

        // Match stats panel
        const statsY = 300;
        const panel = this.add.graphics();
        panel.fillStyle(0x3A2E28, 0.8);
        panel.fillRoundedRect(GAME_WIDTH / 2 - 200, statsY, 400, 80, 8);

        const statItems = [
            { label: 'Menes jouees', value: this.matchStats.menes || '?' },
            { label: 'Meilleur score mene', value: this.matchStats.bestMene || '?' },
        ];

        for (let i = 0; i < statItems.length; i++) {
            const sx = GAME_WIDTH / 2 - 180 + i * 200;
            this.add.text(sx, statsY + 20, statItems[i].label, {
                fontFamily: 'monospace', fontSize: '11px', color: '#D4A574', shadow: SHADOW
            });
            this.add.text(sx, statsY + 42, `${statItems[i].value}`, {
                fontFamily: 'monospace', fontSize: '22px', color: '#F5E6D0', shadow: SHADOW
            });
        }

        // Action buttons
        const btnY = 410;

        if (this.arcadeState) {
            // Arcade: continue or retry
            const continueLabel = this.won ? 'CONTINUER' : 'REESSAYER';
            const continueBtn = this.add.text(GAME_WIDTH / 2, btnY, `[ ${continueLabel} ]`, {
                fontFamily: 'monospace', fontSize: '22px', color: '#F5E6D0',
                backgroundColor: this.won ? '#44CC44' : '#C44B3F',
                padding: { x: 20, y: 10 }, shadow: SHADOW
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });

            continueBtn.on('pointerdown', () => this._returnToArcade());

            const menuBtn = this.add.text(GAME_WIDTH / 2, btnY + 50, '[ MENU ]', {
                fontFamily: 'monospace', fontSize: '16px', color: '#9E9E8E',
                backgroundColor: '#3A2E28', padding: { x: 14, y: 6 }, shadow: SHADOW
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });

            menuBtn.on('pointerdown', () => this.scene.start('TitleScene'));

            this.input.keyboard.on('keydown-SPACE', () => this._returnToArcade());
            this.input.keyboard.on('keydown-ENTER', () => this._returnToArcade());
        } else {
            // Non-arcade: replay or menu
            const replayBtn = this.add.text(GAME_WIDTH / 2 - 100, btnY, '[ REJOUER ]', {
                fontFamily: 'monospace', fontSize: '18px', color: '#F5E6D0',
                backgroundColor: '#C44B3F', padding: { x: 14, y: 8 }, shadow: SHADOW
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });

            replayBtn.on('pointerdown', () => this.scene.start(this.returnScene));

            const menuBtn = this.add.text(GAME_WIDTH / 2 + 100, btnY, '[ MENU ]', {
                fontFamily: 'monospace', fontSize: '18px', color: '#F5E6D0',
                backgroundColor: '#3A2E28', padding: { x: 14, y: 8 }, shadow: SHADOW
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });

            menuBtn.on('pointerdown', () => this.scene.start('TitleScene'));

            this.input.keyboard.on('keydown-SPACE', () => this.scene.start(this.returnScene));
        }

        this.input.keyboard.on('keydown-ESC', () => this.scene.start('TitleScene'));

        // Controls
        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 16, 'Espace Continuer     Echap Menu', {
            fontFamily: 'monospace', fontSize: '12px', color: '#9E9E8E', shadow: SHADOW
        }).setOrigin(0.5);
    }

    _returnToArcade() {
        if (this._returning) return;
        this._returning = true;

        this.cameras.main.fadeOut(300);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('ArcadeScene', {
                playerCharacter: this.arcadeState.playerCharacter,
                currentRound: this.arcadeState.currentRound,
                wins: this.arcadeState.wins,
                losses: this.arcadeState.losses,
                matchResults: this.arcadeState.matchResults,
                lastMatchResult: { won: this.won }
            });
        });
    }

    _getSpriteKey(char) {
        return getCharSpriteKey(char);
    }
}
