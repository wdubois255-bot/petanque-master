import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, getCharSpriteKey, CHAR_STATIC_SPRITES, CHAR_SCALE_VS, DIFFICULTY_COLORS } from '../utils/Constants.js';
import { setSoundScene, sfxVSSlam } from '../utils/SoundManager.js';
import UIFactory from '../ui/UIFactory.js';
import { fadeToScene } from '../utils/SceneTransition.js';

const SHADOW = UIFactory.SHADOW_HEAVY;

/**
 * VS Intro Screen - "Player VS Opponent" split screen animation
 * Shown before each match in arcade/versus mode
 * If preMatchDialogue is provided, shows it before the VS animation.
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
        this.preMatchDialogue = data.preMatchDialogue || null;
        // Reset flags — Phaser reuses scene instances!
        this._started = false;
        this._canSkip = false;
        this._typewriterTimer = null;
        this._dialogIndex = 0;
        this._dialogAdvanceFn = null;
    }

    create() {
        // Reset camera state (previous scene may have faded out)
        this.cameras.main.setAlpha(1);
        this.cameras.main.resetFX();

        // Skip VS animation after 2nd view this session (but keep dialogue for new rounds)
        if (!this.registry.get('vsIntroCount')) this.registry.set('vsIntroCount', 0);
        this.registry.set('vsIntroCount', this.registry.get('vsIntroCount') + 1);
        const skipVS = this.registry.get('vsIntroCount') > 2;

        setSoundScene(this);

        // Show pre-match dialogue first, then VS animation (or skip directly)
        if (this.preMatchDialogue && this.preMatchDialogue.length > 0) {
            this._showPreMatchDialogue(() => {
                if (skipVS) {
                    this._startMatch();
                } else {
                    this._runVSAnimation();
                }
            });
        } else if (skipVS) {
            this._startMatch();
        } else {
            this._runVSAnimation();
        }

        this.events.on('shutdown', this._shutdown, this);
    }

    // === PRE-MATCH DIALOGUE SEQUENCE ===
    _showPreMatchDialogue(onDone) {
        // Dark background
        const overlay = this.add.graphics().setDepth(50);
        overlay.fillStyle(0x0A0806, 1);
        overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Subtle ambient light
        overlay.fillStyle(0xC4854A, 0.04);
        overlay.fillRect(0, GAME_HEIGHT * 0.6, GAME_WIDTH, GAME_HEIGHT * 0.4);

        // Skip hint
        const skipHint = this.add.text(GAME_WIDTH - 16, GAME_HEIGHT - 14, 'Espace / Clic', {
            fontFamily: 'monospace', fontSize: '10px', color: '#5A4A38', shadow: SHADOW
        }).setOrigin(1, 1).setDepth(60).setAlpha(0);
        this.tweens.add({ targets: skipHint, alpha: 0.6, duration: 500, delay: 1000 });

        const dialogueContainer = this.add.container(0, 0).setDepth(55);

        let currentIndex = 0;
        let canAdvance = false;

        const showLine = (index) => {
            if (index >= this.preMatchDialogue.length) {
                // All done — fade out overlay and proceed
                canAdvance = false;
                this.tweens.add({
                    targets: [overlay, skipHint],
                    alpha: 0, duration: 400, ease: 'Quad.easeOut',
                    onComplete: () => {
                        overlay.destroy();
                        skipHint.destroy();
                        dialogueContainer.destroy(true);
                        onDone();
                    }
                });
                return;
            }

            // Clear previous line
            dialogueContainer.removeAll(true);

            const entry = this.preMatchDialogue[index];
            const isNarrator = (entry.speaker === 'narrator');
            const speakerName = this._getSpeakerDisplayName(entry.speaker);

            const boxH = 72;
            const boxY = GAME_HEIGHT - boxH - 12;

            // Box bg
            const boxBg = this.add.graphics();
            boxBg.fillStyle(isNarrator ? 0x1A1510 : 0x2A1F14, 0.92);
            boxBg.fillRoundedRect(12, boxY, GAME_WIDTH - 24, boxH, 6);
            if (!isNarrator) {
                boxBg.lineStyle(1, 0x8B6B3D, 0.4);
                boxBg.strokeRoundedRect(12, boxY, GAME_WIDTH - 24, boxH, 6);
            }
            dialogueContainer.add(boxBg);

            // Speaker name tag
            if (speakerName) {
                const nameColor = this._getSpeakerColor(entry.speaker);
                const nameTag = this.add.text(28, boxY - 14, speakerName, {
                    fontFamily: 'monospace', fontSize: '12px', color: nameColor,
                    backgroundColor: '#1A1510', padding: { x: 6, y: 3 },
                    shadow: SHADOW
                });
                dialogueContainer.add(nameTag);
            }

            // Dialogue text (typewriter)
            const textStyle = isNarrator
                ? { fontFamily: 'Georgia, serif', fontSize: '13px', color: '#C8A06A', fontStyle: 'italic', shadow: SHADOW }
                : { fontFamily: 'monospace', fontSize: '13px', color: '#F5E6D0', shadow: SHADOW };

            const dialogText = this.add.text(28, boxY + 14, '', {
                ...textStyle, wordWrap: { width: GAME_WIDTH - 56 }
            });
            dialogueContainer.add(dialogText);

            // Arrow indicator
            const arrow = this.add.text(GAME_WIDTH - 28, boxY + boxH - 18, '▼', {
                fontFamily: 'monospace', fontSize: '12px', color: '#5A4A38'
            }).setAlpha(0);
            dialogueContainer.add(arrow);

            // Typewriter effect
            canAdvance = false;
            let charIdx = 0;
            const fullText = entry.text;
            if (this._typewriterTimer) { this._typewriterTimer.remove(); this._typewriterTimer = null; }

            this._typewriterTimer = this.time.addEvent({
                delay: 28,
                repeat: fullText.length - 1,
                callback: () => {
                    charIdx++;
                    dialogText.setText(fullText.substring(0, charIdx));
                    if (charIdx >= fullText.length) {
                        canAdvance = true;
                        arrow.setAlpha(1);
                        this.tweens.add({ targets: arrow, alpha: 0, duration: 400, yoyo: true, repeat: -1 });
                    }
                }
            });

            // Advance handler
            const advance = () => {
                if (!canAdvance) {
                    // Skip typewriter
                    if (this._typewriterTimer) { this._typewriterTimer.remove(); this._typewriterTimer = null; }
                    dialogText.setText(fullText);
                    canAdvance = true;
                    arrow.setAlpha(1);
                    return;
                }
                currentIndex++;
                showLine(currentIndex);
            };

            this._dialogAdvanceFn = advance;
        };

        // Input handlers
        this._skipSpace = () => { if (this._dialogAdvanceFn) this._dialogAdvanceFn(); };
        this.input.keyboard.on('keydown-SPACE', this._skipSpace);
        this.input.keyboard.on('keydown-ENTER', this._skipSpace);
        this.input.on('pointerdown', this._skipSpace);

        showLine(0);
    }

    _getSpeakerDisplayName(speakerId) {
        if (speakerId === 'narrator') return null;
        if (speakerId === 'rookie') return this.playerCharacter?.name || 'Rookie';
        if (this.opponentCharacter?.id === speakerId) return this.opponentCharacter.name;
        return speakerId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    _getSpeakerColor(speakerId) {
        if (speakerId === 'rookie') return '#87CEEB';
        return '#FFD700';
    }

    // === VS ANIMATION (existing logic, extracted from create) ===
    _runVSAnimation() {
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
                    .setScale(CHAR_SCALE_VS).setOrigin(0.5).setX(-200);
            } else {
                playerSprite = this.add.sprite(playerX, GAME_HEIGHT / 2 + 40, playerSpriteKey, 0)
                    .setScale(CHAR_SCALE_VS).setOrigin(0.5).setX(-200);
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
                    .setScale(CHAR_SCALE_VS).setOrigin(0.5).setFlipX(true).setX(GAME_WIDTH + 200);
            } else {
                opponentSprite = this.add.sprite(opponentX, GAME_HEIGHT / 2 + 40, opponentSpriteKey, 0)
                    .setScale(CHAR_SCALE_VS).setOrigin(0.5).setFlipX(true).setX(GAME_WIDTH + 200);
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

            this.tweens.add({
                targets: barkText,
                x: opponentX, duration: 500, ease: 'Back.easeOut', delay: 200
            });
        }

        // Opponent catchphrase (italic, gold, under title)
        let opponentCatchphraseText = null;
        if (opponent.catchphrase) {
            opponentCatchphraseText = this.add.text(opponentX, GAME_HEIGHT / 2 - 8,
                `"${opponent.catchphrase}"`, {
                    fontFamily: 'monospace', fontSize: '12px', color: '#D4A574',
                    shadow: SHADOW, fontStyle: 'italic',
                    wordWrap: { width: 200 }, align: 'center'
                }
            ).setOrigin(0.5).setX(GAME_WIDTH + 200).setAlpha(0);
        }

        // Terrain name at bottom
        const terrainText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 65, this.terrainName, {
            fontFamily: 'monospace', fontSize: '16px', color: '#D4A574', shadow: SHADOW
        }).setOrigin(0.5).setAlpha(0);

        // Difficulty label
        const diffMap = { easy: 'FACILE', medium: 'MOYEN', hard: 'DIFFICILE', expert: 'EXPERT' };
        const diff = this.matchData.difficulty || 'medium';
        const diffLabel = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 45, diffMap[diff] || diff.toUpperCase(), {
            fontFamily: 'monospace', fontSize: '12px', color: DIFFICULTY_COLORS[diff] || '#D4A574', shadow: SHADOW
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
        const allElements = [
            vsText, playerNameText, playerTitleText, opponentNameText, opponentTitleText,
            terrainText, diffLabel, divider
        ];
        if (playerSprite) allElements.push(playerSprite);
        if (opponentSprite) allElements.push(opponentSprite);
        if (hintText) allElements.push(hintText);
        if (opponentCatchphraseText) allElements.push(opponentCatchphraseText);

        // 1. Slide in player from left
        this.tweens.add({
            targets: [playerNameText, playerTitleText, ...(playerSprite ? [playerSprite] : [])],
            x: playerX, duration: 500, ease: 'Back.easeOut', delay: 100,
            onComplete: () => {
                const catchphrase = this.playerCharacter.catchphrase;
                if (catchphrase) {
                    const catchphraseText = this.add.text(playerX, GAME_HEIGHT / 2 - 8,
                        `"${catchphrase}"`, {
                            fontFamily: 'monospace', fontSize: '12px', color: '#D4A574',
                            shadow: SHADOW, fontStyle: 'italic',
                            wordWrap: { width: 180 }, align: 'center'
                        }
                    ).setOrigin(0.5).setDepth(5).setAlpha(0);
                    allElements.push(catchphraseText);
                    this.tweens.add({
                        targets: catchphraseText, alpha: 1, duration: 350, delay: 200
                    });
                }
            }
        });

        // 2. Slide in opponent from right
        this.tweens.add({
            targets: [opponentNameText, opponentTitleText, ...(opponentSprite ? [opponentSprite] : [])],
            x: opponentX, duration: 500, ease: 'Back.easeOut', delay: 200,
            onComplete: () => {
                if (opponentCatchphraseText) {
                    opponentCatchphraseText.setX(opponentX);
                    this.tweens.add({
                        targets: opponentCatchphraseText, alpha: 1, duration: 350, delay: 200
                    });
                }
            }
        });

        // 3. VS text slam with Bounce + shake
        this.tweens.add({
            targets: vsText,
            scale: 1, duration: 400, ease: 'Bounce.easeOut', delay: 700,
            onComplete: () => {
                sfxVSSlam();
                this.cameras.main.shake(150, 0.012);
                this.cameras.main.flash(80, 255, 255, 255);
                this.time.delayedCall(200, () => {
                    this.cameras.main.shake(100, 0.006);
                });
            }
        });

        // 4. "MATCH !" text slam
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
        this.tweens.add({ targets: diffLabel, alpha: 1, duration: 300, delay: 850 });

        // 6. Fade out everything
        this.time.delayedCall(1700, () => {
            this.tweens.add({
                targets: allElements,
                alpha: 0, duration: 250, ease: 'Quad.easeIn'
            });
        });

        // 7. Auto-proceed
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
    }

    _shutdown() {
        this.input.keyboard.removeAllListeners();
        this.input.removeAllListeners();
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

        fadeToScene(this, 'PetanqueScene', sceneData);
    }
}
