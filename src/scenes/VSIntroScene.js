import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../utils/Constants.js';

const SHADOW = { offsetX: 3, offsetY: 3, color: '#1A1510', blur: 0, fill: true };

/**
 * VS Intro Screen - "Player VS Opponent" split screen animation
 * Shown before each match in arcade/versus mode
 */
export default class VSIntroScene extends Phaser.Scene {
    constructor() {
        super('VSIntroScene');
    }

    init(data) {
        this.playerCharacter = data.playerCharacter;
        this.opponentCharacter = data.opponentCharacter;
        this.terrain = data.terrain || 'terre';
        this.terrainName = data.terrainName || 'Place du Village';
        this.roundNumber = data.roundNumber || null;
        this.introText = data.introText || '';
        this.matchData = data.matchData || {};
    }

    create() {
        const player = this.playerCharacter;
        const opponent = this.opponentCharacter;

        // Background: split diagonal
        const bg = this.add.graphics();

        // Left side (player) - blue tint
        bg.fillStyle(0x1A2A3A, 1);
        bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Right side (opponent) - red tint
        bg.fillStyle(0x3A1A1A, 1);
        bg.beginPath();
        bg.moveTo(GAME_WIDTH * 0.35, 0);
        bg.lineTo(GAME_WIDTH, 0);
        bg.lineTo(GAME_WIDTH, GAME_HEIGHT);
        bg.lineTo(GAME_WIDTH * 0.65, GAME_HEIGHT);
        bg.closePath();
        bg.fillPath();

        // Diagonal divider (gold)
        const divider = this.add.graphics();
        divider.lineStyle(4, 0xFFD700, 0.8);
        divider.beginPath();
        divider.moveTo(GAME_WIDTH * 0.35, 0);
        divider.lineTo(GAME_WIDTH * 0.65, GAME_HEIGHT);
        divider.strokePath();

        // Round number (if arcade)
        if (this.roundNumber) {
            this.add.text(GAME_WIDTH / 2, 20, `ROUND ${this.roundNumber}`, {
                fontFamily: 'monospace', fontSize: '18px', color: '#D4A574', shadow: SHADOW
            }).setOrigin(0.5).setAlpha(0);
        }

        // VS text (center, big)
        const vsText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'VS', {
            fontFamily: 'monospace', fontSize: '72px', color: '#FFD700',
            shadow: { offsetX: 4, offsetY: 4, color: '#1A1510', blur: 0, fill: true }
        }).setOrigin(0.5).setScale(0).setDepth(10);

        // Player side (left)
        const playerX = GAME_WIDTH * 0.22;
        const playerNameText = this.add.text(playerX, GAME_HEIGHT / 2 - 60, player.name.toUpperCase(), {
            fontFamily: 'monospace', fontSize: '28px', color: '#87CEEB', shadow: SHADOW
        }).setOrigin(0.5).setX(-200);

        const playerTitleText = this.add.text(playerX, GAME_HEIGHT / 2 - 30, player.title, {
            fontFamily: 'monospace', fontSize: '13px', color: '#A8B5C2', shadow: SHADOW
        }).setOrigin(0.5).setX(-200);

        // Player sprite
        const playerSpriteKey = this._getSpriteKey(player);
        let playerSprite = null;
        if (this.textures.exists(playerSpriteKey)) {
            playerSprite = this.add.sprite(playerX, GAME_HEIGHT / 2 + 40, playerSpriteKey, 0)
                .setScale(3).setOrigin(0.5).setX(-200);
        }

        // Opponent side (right)
        const opponentX = GAME_WIDTH * 0.78;
        const opponentNameText = this.add.text(opponentX, GAME_HEIGHT / 2 - 60, opponent.name.toUpperCase(), {
            fontFamily: 'monospace', fontSize: '28px', color: '#C44B3F', shadow: SHADOW
        }).setOrigin(0.5).setX(GAME_WIDTH + 200);

        const opponentTitleText = this.add.text(opponentX, GAME_HEIGHT / 2 - 30, opponent.title, {
            fontFamily: 'monospace', fontSize: '13px', color: '#D4A574', shadow: SHADOW
        }).setOrigin(0.5).setX(GAME_WIDTH + 200);

        // Opponent sprite
        const opponentSpriteKey = this._getSpriteKey(opponent);
        let opponentSprite = null;
        if (this.textures.exists(opponentSpriteKey)) {
            opponentSprite = this.add.sprite(opponentX, GAME_HEIGHT / 2 + 40, opponentSpriteKey, 0)
                .setScale(3).setOrigin(0.5).setFlipX(true).setX(GAME_WIDTH + 200);
        }

        // Terrain name at bottom
        const terrainText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 60, this.terrainName, {
            fontFamily: 'monospace', fontSize: '16px', color: '#D4A574', shadow: SHADOW
        }).setOrigin(0.5).setAlpha(0);

        // Intro text (arcade hint)
        let hintText = null;
        if (this.introText) {
            hintText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 35, this.introText, {
                fontFamily: 'monospace', fontSize: '12px', color: '#9E9E8E', shadow: SHADOW,
                wordWrap: { width: 600 }, align: 'center'
            }).setOrigin(0.5).setAlpha(0);
        }

        // === ANIMATION SEQUENCE ===

        // 1. Slide in player from left
        this.tweens.add({
            targets: [playerNameText, playerTitleText, ...(playerSprite ? [playerSprite] : [])],
            x: playerX, duration: 500, ease: 'Back.easeOut', delay: 100
        });

        // 2. Slide in opponent from right
        this.tweens.add({
            targets: [opponentNameText, opponentTitleText, ...(opponentSprite ? [opponentSprite] : [])],
            x: opponentX, duration: 500, ease: 'Back.easeOut', delay: 200
        });

        // 3. VS text slam in
        this.tweens.add({
            targets: vsText,
            scale: 1, duration: 300, ease: 'Back.easeOut', delay: 500,
            onComplete: () => {
                this.cameras.main.shake(150, 0.005);
            }
        });

        // 4. Round number and terrain fade in
        if (this.roundNumber) {
            const roundText = this.children.list.find(c =>
                c.type === 'Text' && c.text === `ROUND ${this.roundNumber}`
            );
            if (roundText) {
                this.tweens.add({ targets: roundText, alpha: 1, duration: 300, delay: 700 });
            }
        }
        this.tweens.add({ targets: terrainText, alpha: 1, duration: 300, delay: 800 });
        if (hintText) {
            this.tweens.add({ targets: hintText, alpha: 1, duration: 300, delay: 900 });
        }

        // 5. Auto-proceed after 2.5s (or on space/enter)
        this._canSkip = false;
        this.time.delayedCall(800, () => { this._canSkip = true; });

        this.time.delayedCall(2500, () => {
            this._startMatch();
        });

        // Skip on input
        this.input.keyboard.on('keydown-SPACE', () => {
            if (this._canSkip) this._startMatch();
        });
        this.input.keyboard.on('keydown-ENTER', () => {
            if (this._canSkip) this._startMatch();
        });
    }

    _getSpriteKey(char) {
        const mapping = {
            'equilibre': 'rene_animated',
            'pointeur': 'marcel_animated',
            'tireur': 'fanny_animated',
            'stratege': 'ricardo_animated',
            'wildcard': 'thierry_animated',
            'boss': 'marius_animated'
        };
        return mapping[char.id] || char.sprite;
    }

    _startMatch() {
        if (this._started) return;
        this._started = true;

        this.cameras.main.fadeOut(300);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('PetanqueScene', {
                terrain: this.terrain,
                difficulty: this.matchData.difficulty || 'medium',
                format: this.matchData.format || 'tete_a_tete',
                opponentName: this.opponentCharacter.name,
                opponentId: 'char_' + this.opponentCharacter.id,
                returnScene: this.matchData.returnScene || 'ArcadeScene',
                personality: this.opponentCharacter.ai?.personality || null,
                playerCharacter: this.playerCharacter,
                opponentCharacter: this.opponentCharacter,
                arcadeRound: this.roundNumber,
                ...this.matchData
            });
        });
    }
}
