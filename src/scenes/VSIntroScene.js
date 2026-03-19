import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, getCharSpriteKey, CHAR_STATIC_SPRITES } from '../utils/Constants.js';
import { setSoundScene, sfxVSSlam } from '../utils/SoundManager.js';
import UIFactory from '../ui/UIFactory.js';

const SHADOW = UIFactory.SHADOW_HEAVY;

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
        // Reset flags — Phaser reuses scene instances!
        this._started = false;
        this._canSkip = false;
        this._typewriterTimer = null;
    }

    create() {
        // Reset camera state (previous scene may have faded out)
        this.cameras.main.setAlpha(1);
        this.cameras.main.resetFX();

        // Skip after first view in this session (faster flow)
        if (window.__vsIntroSeen) {
            this._startMatch();
            return;
        }
        window.__vsIntroSeen = true;

        setSoundScene(this);
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
        const playerIsStatic = CHAR_STATIC_SPRITES.includes(player.id);
        let playerSprite = null;
        if (this.textures.exists(playerSpriteKey)) {
            if (playerIsStatic) {
                playerSprite = this.add.image(playerX, GAME_HEIGHT / 2 + 30, playerSpriteKey)
                    .setScale(0.65).setOrigin(0.5).setX(-200);
            } else {
                playerSprite = this.add.sprite(playerX, GAME_HEIGHT / 2 + 40, playerSpriteKey, 0)
                    .setScale(0.75).setOrigin(0.5).setX(-200);
            }
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
        const opponentIsStatic = CHAR_STATIC_SPRITES.includes(opponent.id);
        let opponentSprite = null;
        if (this.textures.exists(opponentSpriteKey)) {
            if (opponentIsStatic) {
                opponentSprite = this.add.image(opponentX, GAME_HEIGHT / 2 + 30, opponentSpriteKey)
                    .setScale(0.65).setOrigin(0.5).setFlipX(true).setX(GAME_WIDTH + 200);
            } else {
                opponentSprite = this.add.sprite(opponentX, GAME_HEIGHT / 2 + 40, opponentSpriteKey, 0)
                    .setScale(0.75).setOrigin(0.5).setFlipX(true).setX(GAME_WIDTH + 200);
            }
        }

        // Opponent pre-match bark (from character data)
        const opponentBark = opponent.barks?.pre_match;
        if (opponentBark) {
            const bark = opponentBark[Math.floor(Math.random() * opponentBark.length)];
            const barkText = this.add.text(opponentX, GAME_HEIGHT / 2 + 90, `"${bark}"`, {
                fontFamily: 'monospace', fontSize: '11px', color: '#F5E6D0',
                shadow: SHADOW, wordWrap: { width: 200 }, align: 'center',
                fontStyle: 'italic'
            }).setOrigin(0.5).setX(GAME_WIDTH + 200).setAlpha(0.9);

            // Slide in with opponent
            this.tweens.add({
                targets: barkText,
                x: opponentX, duration: 500, ease: 'Back.easeOut', delay: 200
            });
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

        // === ANIMATION SEQUENCE (Tekken 7 style timing) ===
        // Collect all animatable objects for final fade-out
        const allElements = [
            vsText, playerNameText, playerTitleText, opponentNameText, opponentTitleText,
            terrainText, divider
        ];
        if (playerSprite) allElements.push(playerSprite);
        if (opponentSprite) allElements.push(opponentSprite);
        if (hintText) allElements.push(hintText);

        // 1. Slide in player from left (100ms delay)
        this.tweens.add({
            targets: [playerNameText, playerTitleText, ...(playerSprite ? [playerSprite] : [])],
            x: playerX, duration: 500, ease: 'Back.easeOut', delay: 100,
            onComplete: () => {
                // Player catchphrase typewriter (starts at ~600ms)
                const catchphrase = this.playerCharacter.catchphrase;
                if (catchphrase) {
                    const catchphraseText = this.add.text(playerX, GAME_HEIGHT / 2 + 10, '', {
                        fontFamily: 'monospace', fontSize: '11px', color: '#F5E6D0',
                        shadow: SHADOW, fontStyle: 'italic',
                        wordWrap: { width: 180 }, align: 'center'
                    }).setOrigin(0.5).setDepth(5);
                    allElements.push(catchphraseText);

                    let charIndex = 0;
                    this._typewriterTimer = this.time.addEvent({
                        delay: 30,
                        repeat: catchphrase.length - 1,
                        callback: () => {
                            charIndex++;
                            catchphraseText.setText(`"${catchphrase.substring(0, charIndex)}"`);
                        }
                    });
                }
            }
        });

        // 2. Slide in opponent from right (200ms delay)
        this.tweens.add({
            targets: [opponentNameText, opponentTitleText, ...(opponentSprite ? [opponentSprite] : [])],
            x: opponentX, duration: 500, ease: 'Back.easeOut', delay: 200
        });

        // 3. VS text slam with Bounce + stronger shake (700ms delay)
        this.tweens.add({
            targets: vsText,
            scale: 1, duration: 400, ease: 'Bounce.easeOut', delay: 700,
            onComplete: () => {
                sfxVSSlam();
                this.cameras.main.shake(150, 0.012);
                this.cameras.main.flash(80, 255, 255, 255);
                // Second smaller shake after 200ms
                this.time.delayedCall(200, () => {
                    this.cameras.main.shake(100, 0.006);
                });
            }
        });

        // 4. "MATCH !" text slam (1200ms delay)
        const matchText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50, 'MATCH !', {
            fontFamily: 'monospace', fontSize: '36px', color: '#F5E6D0',
            shadow: { offsetX: 3, offsetY: 3, color: '#1A1510', blur: 0, fill: true }
        }).setOrigin(0.5).setScale(0).setDepth(10);
        allElements.push(matchText);

        this.tweens.add({
            targets: matchText,
            scale: 1, duration: 400, ease: 'Elastic.easeOut', delay: 1200,
            onComplete: () => {
                this.cameras.main.flash(60, 255, 255, 255);
            }
        });

        // 5. Round number and terrain fade in
        if (this.roundNumber) {
            const roundText = this.children.list.find(c =>
                c.type === 'Text' && c.text === `ROUND ${this.roundNumber}`
            );
            if (roundText) {
                allElements.push(roundText);
                this.tweens.add({ targets: roundText, alpha: 1, duration: 300, delay: 700 });
            }
        }
        this.tweens.add({ targets: terrainText, alpha: 1, duration: 300, delay: 800 });
        if (hintText) {
            this.tweens.add({ targets: hintText, alpha: 1, duration: 300, delay: 900 });
        }

        // 6. Fade out everything before iris wipe (1700ms)
        this.time.delayedCall(1700, () => {
            this.tweens.add({
                targets: allElements,
                alpha: 0, duration: 250, ease: 'Quad.easeIn'
            });
        });

        // 7. Auto-proceed with iris wipe (2000ms)
        this._canSkip = false;
        this.time.delayedCall(600, () => { this._canSkip = true; });

        this.time.delayedCall(2500, () => {
            this._startMatch();
        });

        // Skip on input
        this._skipSpace = () => { if (this._canSkip) this._startMatch(); };
        this._skipEnter = () => { if (this._canSkip) this._startMatch(); };
        this.input.keyboard.on('keydown-SPACE', this._skipSpace);
        this.input.keyboard.on('keydown-ENTER', this._skipEnter);

        this.events.on('shutdown', this._shutdown, this);
    }

    _shutdown() {
        this.input.keyboard.removeAllListeners();
        if (this._typewriterTimer) { this._typewriterTimer.destroy(); this._typewriterTimer = null; }
        this.tweens.killAll();
    }

    _getSpriteKey(char) {
        return getCharSpriteKey(char);
    }

    _startMatch() {
        if (this._started) return;
        this._started = true;

        const sceneData = {
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
        };

        // Direct transition — no async callbacks that can be killed by shutdown
        this.scene.start('PetanqueScene', sceneData);
    }
}
