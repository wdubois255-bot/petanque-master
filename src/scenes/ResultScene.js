import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, getCharSpriteKey, CHAR_STATIC_SPRITES, PIXELS_TO_METERS, ROOKIE_XP_ARCADE, ROOKIE_XP_QUICKPLAY, GALET_LOSS, ROOKIE_XP_LOSS, CHAR_SCALE_RESULT, CHAR_SCALE_RESULT_STATIC } from '../utils/Constants.js';
import { setSoundScene, sfxVictory, sfxDefeat, sfxScore } from '../utils/SoundManager.js';
import { addGalets, loadSave, saveSave, unlockCochonnet, unlockBoule, recordWin, recordMatchStats, isMilestoneUnlocked, unlockMilestone } from '../utils/SaveManager.js';
import UIFactory from '../ui/UIFactory.js';
import { fadeToScene } from '../utils/SceneTransition.js';

const SHADOW = UIFactory.SHADOW;

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
        this.galetsEarned = data.galetsEarned || 0;
        this.postMatchDialogue = data.postMatchDialogue || null;
        this.unlocksOnWin = data.unlocksOnWin || null;
        // Reset flags — Phaser reuses scene instances!
        this._returning = false;
        this._postDialogDone = false;
    }

    create() {
        setSoundScene(this);
        this.cameras.main.setAlpha(1);
        this.cameras.main.resetFX();
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

        // Trophy icon next to victory title
        if (this.won && this.textures.exists('v2_trophy')) {
            const trophy = this.add.sprite(GAME_WIDTH / 2 - 140, 40, 'v2_trophy', 0)
                .setScale(1.0).setOrigin(0.5).setAlpha(0);
            this.tweens.add({ targets: trophy, alpha: 1, scale: 1.1, duration: 400, ease: 'Back.easeOut', delay: 400 });
            const trophy2 = this.add.sprite(GAME_WIDTH / 2 + 140, 40, 'v2_trophy', 0)
                .setScale(1.0).setOrigin(0.5).setAlpha(0).setFlipX(true);
            this.tweens.add({ targets: trophy2, alpha: 1, scale: 1.1, duration: 400, ease: 'Back.easeOut', delay: 400 });
        }

        const title = this.add.text(GAME_WIDTH / 2, 40, titleText, {
            fontFamily: 'monospace', fontSize: '42px', color: titleColor,
            shadow: { offsetX: 4, offsetY: 4, color: '#1A1510', blur: 0, fill: true }
        }).setOrigin(0.5).setScale(0);

        this.tweens.add({
            targets: title, scale: 1, duration: 400, ease: 'Back.easeOut', delay: 200,
            onComplete: () => {
                if (this.won) {
                    this.cameras.main.flash(100, 255, 215, 0);
                    this._spawnConfetti();
                }
            }
        });

        // Score
        this.add.text(GAME_WIDTH / 2, 90, `${this.scores.player} - ${this.scores.opponent}`, {
            fontFamily: 'monospace', fontSize: '36px', color: '#F5E6D0',
            shadow: { offsetX: 3, offsetY: 3, color: '#1A1510', blur: 0, fill: true }
        }).setOrigin(0.5);

        // === STAR RATING (only on victory) ===
        if (this.won) {
            const stars = this._calculateStars();
            this._drawStars(GAME_WIDTH / 2, 120, stars);
            this._saveStarRating(stars);
        }

        // Character sprite + name
        const winner = this.won ? this.playerCharacter : this.opponentCharacter;
        if (winner) {
            // Portrait frame behind character
            if (this.textures.exists('v2_frame_portrait')) {
                this.add.sprite(GAME_WIDTH / 2 - 200, 200, 'v2_frame_portrait', 0)
                    .setScale(2.0).setOrigin(0.5).setAlpha(0.7);
            }
            const winKey = this._getSpriteKey(winner);
            if (this.textures.exists(winKey)) {
                const isStatic = CHAR_STATIC_SPRITES.includes(winner.id);
                const winSprite = isStatic
                    ? this.add.image(GAME_WIDTH / 2 - 200, 200, winKey).setScale(CHAR_SCALE_RESULT_STATIC).setOrigin(0.5)
                    : this.add.sprite(GAME_WIDTH / 2 - 200, 200, winKey, 0).setScale(CHAR_SCALE_RESULT).setOrigin(0.5);
                this.tweens.add({
                    targets: winSprite, y: 193, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
                });
            }
            this.add.text(GAME_WIDTH / 2 - 200, 240, winner.name, {
                fontFamily: 'monospace', fontSize: '16px',
                color: this.won ? '#87CEEB' : '#C44B3F', shadow: SHADOW
            }).setOrigin(0.5);

            // Opponent bark
            const opponent = this.opponentCharacter;
            if (opponent?.barks) {
                const barkKey = this.won ? 'post_match_lose' : 'post_match_win';
                const barks = opponent.barks[barkKey];
                if (barks?.length) {
                    const bark = barks[Math.floor(Math.random() * barks.length)];
                    this.add.text(GAME_WIDTH / 2 - 200, 258, `"${bark}"`, {
                        fontFamily: 'monospace', fontSize: '9px', color: '#D4A574',
                        shadow: SHADOW, wordWrap: { width: 200 }, align: 'center',
                        fontStyle: 'italic'
                    }).setOrigin(0.5);
                }
            }
        }

        // === ENRICHED STATS PANEL ===
        const panelX = GAME_WIDTH / 2 + 40;
        const panelY = 148;
        const panelW = 340;
        const panelH = 130;

        if (this.textures.exists('v2_panel_elegant')) {
            this.add.nineslice(panelX, panelY + panelH / 2, 'v2_panel_elegant', 0, panelW, panelH, 16, 16, 16, 16)
                .setOrigin(0.5).setAlpha(0.9);
        } else {
            UIFactory.createPanel(this, panelX - panelW / 2, panelY, panelW, panelH, {
                fillAlpha: 0.85, strokeAlpha: 0.3, strokeWidth: 1
            });
        }

        const ms = this.matchStats;
        const bestDist = ms.bestBallDist && ms.bestBallDist < Infinity
            ? `${(ms.bestBallDist * (PIXELS_TO_METERS || 0.036) * 100).toFixed(0)}cm`
            : '-';
        const totalThrows = (ms.shots || 0) + (ms.points_attempted || 0);
        const tirRatio = totalThrows > 0 ? `${Math.round((ms.shots || 0) / totalThrows * 100)}%` : '-';

        const stats = [
            { label: 'Menes', value: ms.menes || '?', col: 0 },
            { label: 'Meilleur score', value: ms.bestMene || '0', col: 1 },
            { label: 'Carreaux', value: ms.carreaux || 0, col: 2 },
            { label: 'Biberons', value: ms.biberons || 0, col: 0 },
            { label: 'Meilleure boule', value: bestDist, col: 1 },
            { label: 'Taux de tir', value: tirRatio, col: 2 },
        ];

        for (let i = 0; i < stats.length; i++) {
            const row = i < 3 ? 0 : 1;
            const col = stats[i].col;
            const sx = panelX - panelW / 2 + 20 + col * 110;
            const sy = panelY + 15 + row * 55;

            this.add.text(sx, sy, stats[i].label, {
                fontFamily: 'monospace', fontSize: '9px', color: '#D4A574', shadow: SHADOW
            });
            this.add.text(sx, sy + 16, `${stats[i].value}`, {
                fontFamily: 'monospace', fontSize: '18px', color: '#F5E6D0', shadow: SHADOW
            });
        }

        // Fanny badge
        if (ms.fanny) {
            this.add.text(panelX, panelY + panelH + 8, 'FANNY !', {
                fontFamily: 'monospace', fontSize: '14px', color: '#C44B3F', shadow: SHADOW
            }).setOrigin(0.5);
        }

        // === PERSISTENT STATS ===
        recordMatchStats({
            won: this.won,
            terrainName: this.terrainName,
            characterId: this.playerCharacter?.id,
            carreaux: this.matchStats?.carreaux || 0,
            biberons: this.matchStats?.biberons || 0,
            galetsEarned: this.won ? this.galetsEarned : 0,
            bestMeneScore: this.matchStats?.bestMene || 0
        });

        // === GALETS EARNED ===
        const galetsToGive = this.won ? this.galetsEarned : GALET_LOSS;
        if (galetsToGive > 0) {
            addGalets(galetsToGive);
            // Galet icon
            if (this.textures.exists('v2_icon_galet')) {
                const galetIcon = this.add.sprite(GAME_WIDTH / 2 - 70, panelY + panelH + 28, 'v2_icon_galet', 0)
                    .setScale(0.8).setOrigin(0.5).setAlpha(0);
                this.tweens.add({ targets: galetIcon, alpha: 1, duration: 500, ease: 'Back.easeOut', delay: 800 });
            }
            const galetText = this.add.text(GAME_WIDTH / 2, panelY + panelH + 28, `+${galetsToGive} Galets`, {
                fontFamily: 'monospace', fontSize: '18px', color: '#FFD700',
                shadow: { offsetX: 2, offsetY: 2, color: '#1A1510', blur: 0, fill: true }
            }).setOrigin(0.5).setAlpha(0).setScale(0.5);

            this.tweens.add({
                targets: galetText, alpha: 1, scale: 1,
                duration: 500, ease: 'Back.easeOut', delay: 800
            });
        }

        // === ROOKIE XP ===
        const isRookie = this.playerCharacter?.isRookie || this.playerCharacter?.id === 'rookie';
        let xpEarned = 0;
        if (isRookie) {
            if (this.won) {
                if (this.arcadeState) {
                    // In Arcade: only give XP for NEW round progress (no farming)
                    const save = loadSave();
                    const currentRound = this.arcadeState.currentRound - 1; // round just completed
                    xpEarned = currentRound > save.arcadeProgress ? ROOKIE_XP_ARCADE : 0;
                } else {
                    xpEarned = ROOKIE_XP_QUICKPLAY;
                }
            } else {
                // Compensation: small XP even on defeat
                xpEarned = ROOKIE_XP_LOSS;
            }
            if (xpEarned > 0) {
                const xpText = this.add.text(GAME_WIDTH / 2, panelY + panelH + 50, `+${xpEarned} pts`, {
                    fontFamily: 'monospace', fontSize: '16px', color: '#FFD700',
                    shadow: { offsetX: 2, offsetY: 2, color: '#1A1510', blur: 0, fill: true }
                }).setOrigin(0.5).setAlpha(0);

                this.tweens.add({
                    targets: xpText, alpha: 1,
                    duration: 400, ease: 'Sine.easeOut', delay: 1200
                });
            }
        }

        // === PROCHAIN OBJECTIF (teaser unlock) ===
        this._showNextUnlockTeaser(isRookie);

        // === ACTION BUTTONS ===
        const btnY = 310;

        if (this.arcadeState) {
            const continueLabel = this.won ? 'CONTINUER' : 'REESSAYER';
            const continueBtn = this.add.text(GAME_WIDTH / 2, btnY, `[ ${continueLabel} ]`, {
                fontFamily: 'monospace', fontSize: '22px', color: '#F5E6D0',
                backgroundColor: this.won ? '#44CC44' : '#C44B3F',
                padding: { x: 20, y: 10 }, shadow: SHADOW
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });

            continueBtn.on('pointerdown', () => { if (this._postDialogDone) this._returnToArcade(); });

            const menuBtn = this.add.text(GAME_WIDTH / 2, btnY + 50, '[ MENU ]', {
                fontFamily: 'monospace', fontSize: '16px', color: '#9E9E8E',
                backgroundColor: '#3A2E28', padding: { x: 14, y: 6 }, shadow: SHADOW
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });

            menuBtn.on('pointerdown', () => fadeToScene(this, 'TitleScene'));
        } else {
            // Quick Play / other modes
            const replayBtn = this.add.text(GAME_WIDTH / 2 - 100, btnY, '[ REJOUER ]', {
                fontFamily: 'monospace', fontSize: '18px', color: '#F5E6D0',
                backgroundColor: this.won ? '#44CC44' : '#C44B3F', padding: { x: 14, y: 8 }, shadow: SHADOW
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });

            replayBtn.on('pointerdown', () => { if (this._postDialogDone) this._returnToArcade(); });

            const menuBtn = this.add.text(GAME_WIDTH / 2 + 100, btnY, '[ MENU ]', {
                fontFamily: 'monospace', fontSize: '18px', color: '#F5E6D0',
                backgroundColor: '#3A2E28', padding: { x: 14, y: 8 }, shadow: SHADOW
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });

            menuBtn.on('pointerdown', () => fadeToScene(this, 'TitleScene'));
        }

        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 16, 'Espace Continuer     Echap Menu', {
            fontFamily: 'monospace', fontSize: '12px', color: '#9E9E8E', shadow: SHADOW
        }).setOrigin(0.5);

        // Post-match dialogue → character unlock celebration → input handlers
        const afterEverything = () => {
            this._postDialogDone = true;
            this._addInputHandlers();
        };

        const afterDialogue = () => {
            if (this.unlocksOnWin) {
                this._showCharacterUnlock(this.unlocksOnWin, afterEverything);
            } else {
                afterEverything();
            }
        };

        if (this.postMatchDialogue && this.postMatchDialogue.length > 0) {
            this.time.delayedCall(1500, () => {
                this._showPostMatchDialogue(this.postMatchDialogue, afterDialogue);
            });
        } else {
            this.time.delayedCall(500, () => {
                afterDialogue();
            });
        }

        // Safety: if dialogue fails to complete, unblock input after 10s
        this.time.delayedCall(10000, () => {
            if (!this._postDialogDone) {
                this._postDialogDone = true;
                this._addInputHandlers();
            }
        });

        this.events.on('shutdown', this._shutdown, this);
    }

    // === POST-MATCH DIALOGUE ===
    _showPostMatchDialogue(dialogues, onDone) {
        let currentIndex = 0;
        let canAdvance = false;
        let typeTimer = null;
        const container = this.add.container(0, 0).setDepth(200);

        const boxH = 70;
        const boxY = GAME_HEIGHT - boxH - 10;

        // Parchment box
        const boxBg = this.add.graphics();
        boxBg.fillStyle(0x1A1510, 0.88);
        boxBg.fillRoundedRect(12, boxY, GAME_WIDTH - 24, boxH, 6);
        boxBg.lineStyle(1, 0x8B6B3D, 0.5);
        boxBg.strokeRoundedRect(12, boxY, GAME_WIDTH - 24, boxH, 6);
        container.add(boxBg);

        const nameTag = this.add.text(28, boxY - 14, '', {
            fontFamily: 'monospace', fontSize: '12px', color: '#FFD700',
            backgroundColor: '#1A1510', padding: { x: 6, y: 3 }, shadow: SHADOW
        }).setDepth(201);
        container.add(nameTag);

        const dialogText = this.add.text(28, boxY + 14, '', {
            fontFamily: 'monospace', fontSize: '13px', color: '#F5E6D0',
            shadow: SHADOW, wordWrap: { width: GAME_WIDTH - 56 }
        }).setDepth(201);
        container.add(dialogText);

        const arrow = this.add.text(GAME_WIDTH - 28, boxY + boxH - 18, '▼', {
            fontFamily: 'monospace', fontSize: '12px', color: '#8B6B3D'
        }).setAlpha(0).setDepth(201);
        container.add(arrow);

        // Animate in
        container.setAlpha(0);
        this.tweens.add({ targets: container, alpha: 1, duration: 300, ease: 'Quad.easeOut' });

        const showLine = (index) => {
            if (index >= dialogues.length) {
                this.tweens.add({
                    targets: container, alpha: 0, duration: 300, ease: 'Quad.easeIn',
                    onComplete: () => { container.destroy(true); onDone(); }
                });
                return;
            }

            const entry = dialogues[index];
            const isNarrator = (entry.speaker === 'narrator');
            const speakerName = this._getSpeakerDisplayName(entry.speaker);

            nameTag.setText(speakerName || '');
            nameTag.setVisible(!!speakerName);
            dialogText.setText('');
            arrow.setAlpha(0);
            this.tweens.killTweensOf(arrow);

            if (isNarrator) {
                dialogText.setStyle({ fontFamily: 'Georgia, serif', fontSize: '13px', color: '#C8A06A', fontStyle: 'italic' });
            } else {
                dialogText.setStyle({ fontFamily: 'monospace', fontSize: '13px', color: '#F5E6D0', fontStyle: 'normal' });
            }

            canAdvance = false;
            let charIdx = 0;
            const fullText = entry.text;
            if (typeTimer) { typeTimer.remove(); typeTimer = null; }

            typeTimer = this.time.addEvent({
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
        };

        const advance = () => {
            if (!canAdvance) {
                if (typeTimer) { typeTimer.remove(); typeTimer = null; }
                const entry = dialogues[currentIndex];
                dialogText.setText(entry?.text || '');
                canAdvance = true;
                arrow.setAlpha(1);
                return;
            }
            currentIndex++;
            showLine(currentIndex);
        };

        this._dialogAdvanceFn = advance;

        this._dialogSpaceKey = this.input.keyboard.on('keydown-SPACE', () => {
            if (!this._postDialogDone) advance();
        });
        this._dialogEnterKey = this.input.keyboard.on('keydown-ENTER', () => {
            if (!this._postDialogDone) advance();
        });
        this._dialogPointer = this.input.on('pointerdown', () => {
            if (!this._postDialogDone) advance();
        });

        showLine(0);
    }

    _getSpeakerDisplayName(speakerId) {
        if (speakerId === 'narrator') return null;
        if (speakerId === 'rookie') return this.playerCharacter?.name || 'Rookie';
        if (this.opponentCharacter?.id === speakerId) return this.opponentCharacter.name;
        return speakerId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    // === CHARACTER UNLOCK CELEBRATION (tâche 4.4) ===
    _showCharacterUnlock(charId, onDone) {
        const charactersData = this.cache.json.get('characters');
        const char = charactersData?.roster?.find(c => c.id === charId);
        if (!char) { onDone(); return; }

        sfxScore();

        const overlay = this.add.graphics().setDepth(300);
        overlay.fillStyle(0x0A0806, 0.85);
        overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        overlay.setAlpha(0);
        this.tweens.add({ targets: overlay, alpha: 1, duration: 300 });

        // Golden stars burst
        for (let i = 0; i < 20; i++) {
            const star = this.add.text(
                GAME_WIDTH / 2 + Phaser.Math.Between(-220, 220),
                GAME_HEIGHT / 2 + Phaser.Math.Between(-120, 120),
                '★', {
                    fontFamily: 'monospace', fontSize: `${Phaser.Math.Between(10, 22)}px`,
                    color: '#FFD700'
                }
            ).setAlpha(0).setDepth(301);
            this.tweens.add({
                targets: star, alpha: 0.7, scale: 1.3,
                duration: 400, delay: i * 40, yoyo: true, repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }

        // Panel
        const panelW = 460;
        const panelH = 160;
        const panelX = GAME_WIDTH / 2 - panelW / 2;
        const panelY = GAME_HEIGHT / 2 - panelH / 2;

        const panel = this.add.graphics().setDepth(302);
        panel.fillStyle(0x2A1F14, 0.98);
        panel.fillRoundedRect(panelX, panelY, panelW, panelH, 10);
        panel.lineStyle(2, 0xFFD700, 0.8);
        panel.strokeRoundedRect(panelX, panelY, panelW, panelH, 10);
        panel.setScale(0);
        this.tweens.add({ targets: panel, scale: 1, duration: 400, ease: 'Back.easeOut' });

        const unlockLabel = this.add.text(GAME_WIDTH / 2, panelY + 28, '★ NOUVEAU PERSONNAGE ★', {
            fontFamily: 'monospace', fontSize: '18px', color: '#FFD700',
            shadow: { offsetX: 2, offsetY: 2, color: '#1A1510', blur: 0, fill: true }
        }).setOrigin(0.5).setDepth(303).setScale(0);
        this.tweens.add({ targets: unlockLabel, scale: 1, duration: 400, ease: 'Back.easeOut', delay: 150 });

        const charName = this.add.text(GAME_WIDTH / 2, panelY + 60, char.name, {
            fontFamily: 'monospace', fontSize: '28px', color: '#F5E6D0',
            shadow: { offsetX: 3, offsetY: 3, color: '#1A1510', blur: 0, fill: true }
        }).setOrigin(0.5).setDepth(303).setAlpha(0);
        this.tweens.add({ targets: charName, alpha: 1, y: panelY + 58, duration: 400, ease: 'Quad.easeOut', delay: 300 });

        const charTitle = this.add.text(GAME_WIDTH / 2, panelY + 90, char.title || '', {
            fontFamily: 'monospace', fontSize: '13px', color: '#D4A574',
            shadow: SHADOW
        }).setOrigin(0.5).setDepth(303).setAlpha(0);
        this.tweens.add({ targets: charTitle, alpha: 1, duration: 300, delay: 500 });

        const joinText = this.add.text(GAME_WIDTH / 2, panelY + 118, 'a rejoint votre roster !', {
            fontFamily: 'monospace', fontSize: '13px', color: '#9B7BB8', shadow: SHADOW
        }).setOrigin(0.5).setDepth(303).setAlpha(0);
        this.tweens.add({ targets: joinText, alpha: 1, duration: 300, delay: 600 });

        const continueHint = this.add.text(GAME_WIDTH / 2, panelY + panelH + 16, '~ Appuyez sur Espace ~', {
            fontFamily: 'monospace', fontSize: '11px', color: '#8B7A5A', shadow: SHADOW
        }).setOrigin(0.5).setDepth(303).setAlpha(0);
        this.tweens.add({ targets: continueHint, alpha: 0.6, duration: 500, delay: 1000, yoyo: true, repeat: -1 });

        // Dismiss after 3s or on Space/Enter/click
        let dismissed = false;
        const dismiss = () => {
            if (dismissed) return;
            dismissed = true;
            this.tweens.add({
                targets: [overlay, panel, unlockLabel, charName, charTitle, joinText, continueHint],
                alpha: 0, duration: 300, ease: 'Quad.easeIn',
                onComplete: () => onDone()
            });
        };

        this.time.delayedCall(3000, dismiss);
        this.input.keyboard.once('keydown-SPACE', dismiss);
        this.input.keyboard.once('keydown-ENTER', dismiss);
        this.input.once('pointerdown', dismiss);
    }

    _addInputHandlers() {
        // Check milestones before enabling navigation
        this._checkMilestones();

        if (this.arcadeState) {
            this.input.keyboard.on('keydown-SPACE', () => this._returnToArcade());
            this.input.keyboard.on('keydown-ENTER', () => this._returnToArcade());
        } else {
            this.input.keyboard.on('keydown-SPACE', () => this._returnToArcade());
        }
        this.input.keyboard.on('keydown-ESC', () => {
            if (this.arcadeState) {
                this._returnToArcade();
            } else {
                fadeToScene(this, 'TitleScene');
            }
        });
    }

    // === MILESTONES (tâche 4.5) ===
    _checkMilestones() {
        const arcadeData = this.cache.json.get('arcade');
        if (!arcadeData?.milestones) return;

        const save = loadSave();
        const arcadeWins = save.stats?.totalWins || 0;
        const totalCarreaux = (save.stats?.totalCarreaux || 0) + (this.matchStats?.carreaux || 0);
        const arcadeComplete = (save.arcadeProgress || 0) >= 5;
        const arcadePerfect = save.arcadePerfect || false;
        const isFanny = !!(this.matchStats?.fanny);
        const matchCarreaux = this.matchStats?.carreaux || 0;

        const toasts = [];

        for (const milestone of arcadeData.milestones) {
            if (isMilestoneUnlocked(milestone.id)) continue;

            let condMet = false;
            switch (milestone.condition) {
                case 'arcadeWins >= 1':   condMet = arcadeWins >= 1; break;
                case 'carreaux >= 1':     condMet = matchCarreaux >= 1; break;
                case 'arcadeWins >= 3':   condMet = arcadeWins >= 3; break;
                case 'arcade_complete':   condMet = arcadeComplete; break;
                case 'arcade_perfect':    condMet = arcadePerfect; break;
                case 'match_fanny':       condMet = isFanny; break;
            }

            if (condMet) {
                const wasNew = unlockMilestone(milestone.id);
                if (wasNew) {
                    addGalets(milestone.reward);
                    toasts.push({ text: milestone.text, reward: milestone.reward });
                }
            }
        }

        if (toasts.length > 0) {
            this._showMilestoneToasts(toasts);
        }
    }

    _showMilestoneToasts(toasts) {
        toasts.forEach((toast, i) => {
            const toastText = this.add.text(GAME_WIDTH / 2, 20 + i * 36,
                `★ ${toast.text}  +${toast.reward} Galets`, {
                    fontFamily: 'monospace', fontSize: '13px', color: '#FFD700',
                    backgroundColor: '#2A1F14', padding: { x: 12, y: 6 },
                    shadow: { offsetX: 2, offsetY: 2, color: '#1A1510', blur: 0, fill: true }
                }
            ).setOrigin(0.5).setDepth(250).setAlpha(0).setY(60 + i * 40);

            this.tweens.add({
                targets: toastText,
                alpha: 1, y: 55 + i * 40,
                duration: 400, ease: 'Back.easeOut', delay: i * 300
            });

            this.tweens.add({
                targets: toastText,
                alpha: 0, y: 45 + i * 40,
                duration: 400, ease: 'Quad.easeIn',
                delay: 2500 + i * 300
            });
        });
    }

    _spawnConfetti() {
        const colors = [0xFFD700, 0xC2703E, 0x9B7BB8, 0x6B8E4E, 0x87CEEB];
        for (let i = 0; i < 40; i++) {
            const x = Phaser.Math.Between(40, GAME_WIDTH - 40);
            const startY = Phaser.Math.Between(-60, -200);
            const color = colors[Math.floor(Math.random() * colors.length)];
            const w = Phaser.Math.Between(4, 8);
            const h = Phaser.Math.Between(6, 12);

            const conf = this.add.graphics().setDepth(150);
            conf.fillStyle(color, 0.85);
            conf.fillRect(-w / 2, -h / 2, w, h);
            conf.setPosition(x, startY);

            this.tweens.add({
                targets: conf,
                y: GAME_HEIGHT + 50,
                x: x + Phaser.Math.Between(-100, 100),
                angle: Phaser.Math.Between(-540, 540),
                duration: Phaser.Math.Between(1800, 4000),
                ease: 'Sine.easeIn',
                delay: Phaser.Math.Between(0, 1200),
                onComplete: () => conf.destroy()
            });
        }
    }

    _shutdown() {
        this.input.keyboard.removeAllListeners();
        this.tweens.killAll();
    }

    // === STAR RATING ===
    _calculateStars() {
        const pScore = this.scores.player;
        const oScore = this.scores.opponent;
        const diff = pScore - oScore;
        const ms = this.matchStats;

        // 3 stars: dominant victory (13-0 to 13-5) OR any fanny
        if (ms.fanny || oScore <= 5) return 3;
        // 2 stars: comfortable win (13-6 to 13-9)
        if (oScore <= 9) return 2;
        // 1 star: close win (13-10 to 13-12)
        return 1;
    }

    _drawStars(cx, cy, count) {
        const useV2Star = this.textures.exists('v2_icon_star');
        const starSize = 16;
        const spacing = 40;
        const startX = cx - spacing;

        for (let i = 0; i < 3; i++) {
            const sx = startX + i * spacing;
            const filled = i < count;

            // Use v2_icon_star if available
            if (useV2Star) {
                const starImg = this.add.sprite(sx, cy, 'v2_icon_star', 0)
                    .setScale(0).setOrigin(0.5).setAlpha(filled ? 1 : 0.3);
                if (!filled) starImg.setTint(0x5A4A38);
                this.tweens.add({
                    targets: starImg, scale: filled ? 1.2 : 0.8, duration: 300,
                    ease: 'Back.easeOut', delay: 600 + i * 200
                });
                continue;
            }

            const color = filled ? '#FFD700' : '#5A4A38';
            const star = this.add.text(sx, cy, '\u2605', {
                fontFamily: 'monospace', fontSize: `${starSize}px`, color,
                shadow: filled ? { offsetX: 1, offsetY: 1, color: '#B8860B', blur: 0, fill: true } : SHADOW
            }).setOrigin(0.5).setScale(0);

            // Animate stars appearing one by one
            this.tweens.add({
                targets: star, scale: filled ? 1.2 : 0.8, duration: 300,
                ease: 'Back.easeOut', delay: 600 + i * 200,
                onComplete: () => {
                    if (filled) {
                        this.tweens.add({ targets: star, scale: 1, duration: 200 });
                    }
                }
            });
        }
    }

    _saveStarRating(stars) {
        if (!this.opponentCharacter) return;
        const save = loadSave();
        if (!save.starRatings) save.starRatings = {};
        const oppId = this.opponentCharacter.id;
        if (!save.starRatings[oppId] || stars > save.starRatings[oppId]) {
            save.starRatings[oppId] = stars;
        }
        saveSave(save);
        this._trackCumulativeStats();
    }

    _trackCumulativeStats() {
        const save = loadSave();
        if (!save.cumulativeStats) save.cumulativeStats = { carreaux: 0, victories: 0, biberons: 0, matches: 0 };
        if (!save.cosmeticUnlocks) save.cosmeticUnlocks = [];

        save.cumulativeStats.carreaux += this.matchStats.carreaux || 0;
        save.cumulativeStats.biberons += this.matchStats.biberons || 0;
        save.cumulativeStats.victories += this.won ? 1 : 0;
        save.cumulativeStats.matches += 1;

        const stats = save.cumulativeStats;
        const unlocked = save.cosmeticUnlocks;
        const newUnlocks = [];

        const bouleUnlocks = [
            { id: 'boule_bronze', cond: stats.matches >= 3, msg: 'Boules Bronze debloquees ! (3 matchs)' },
            { id: 'boule_chrome', cond: stats.victories >= 5, msg: 'Boules Chrome debloquees ! (5 victoires)' },
            { id: 'boule_noire', cond: stats.carreaux >= 10, msg: 'Boules Noires debloquees ! (10 carreaux)' },
            { id: 'boule_rouge', cond: stats.victories >= 10, msg: 'Boules Rouges debloquees ! (10 victoires)' },
            { id: 'boule_chrome_prestige', cond: stats.victories >= 10, msg: 'Boule Chrome Prestige ! (10 victoires)' },
        ];
        const cochUnlocks = [
            { id: 'cochonnet_bleu', cond: stats.victories >= 5, msg: 'Cochonnet Bleu debloque ! (5 victoires)' },
            { id: 'cochonnet_vert', cond: stats.carreaux >= 20, msg: 'Cochonnet Vert debloque ! (20 carreaux)' },
            { id: 'cochonnet_dore', cond: stats.victories >= 50, msg: 'Cochonnet Dore debloque ! (50 victoires)' },
        ];
        const titleUnlocks = [
            { id: 'title_artilleur', cond: stats.victories >= 20, msg: "Titre \"L'Artilleur\" debloque ! (20 victoires)" },
            { id: 'title_maitre', cond: stats.victories >= 50, msg: 'Titre "Maitre Bouliste" debloque ! (50 victoires)' },
            { id: 'badge_tireur', cond: (this.matchStats.carreaux || 0) >= 3, msg: 'Badge "Le Tireur" ! (3 carreaux en 1 match)' },
        ];
        for (const u of [...bouleUnlocks, ...cochUnlocks, ...titleUnlocks]) {
            if (u.cond && !unlocked.includes(u.id)) {
                unlocked.push(u.id);
                newUnlocks.push(u.msg);
                if (u.id.startsWith('boule_')) unlockBoule(u.id);
                if (u.id.startsWith('cochonnet_')) unlockCochonnet(u.id);
                if (u.id.startsWith('title_') || u.id.startsWith('badge_')) {
                    if (!save.badges.includes(u.id)) {
                        save.badges.push(u.id);
                    }
                }
            }
        }

        saveSave(save);

        if (newUnlocks.length > 0) {
            this._showUnlockNotification(newUnlocks);
        }
    }

    _showUnlockNotification(unlocks) {
        const text = unlocks.join('\n');
        const notif = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 60, text, {
            fontFamily: 'monospace', fontSize: '14px', color: '#FFD700',
            shadow: SHADOW, align: 'center', backgroundColor: '#3A2E28',
            padding: { x: 12, y: 8 }
        }).setOrigin(0.5).setDepth(200).setAlpha(0);

        this.tweens.add({
            targets: notif, alpha: 1, y: GAME_HEIGHT - 80,
            duration: 500, ease: 'Back.easeOut', delay: 1500
        });
    }

    _returnToArcade() {
        if (this._returning) return;
        this._returning = true;

        const isRookie = this.playerCharacter?.isRookie || this.playerCharacter?.id === 'rookie';
        let xpEarned = 0;
        if (isRookie) {
            if (this.won) {
                if (this.arcadeState) {
                    const save = loadSave();
                    const currentRound = this.arcadeState.currentRound - 1;
                    xpEarned = currentRound > save.arcadeProgress ? ROOKIE_XP_ARCADE : 0;
                } else {
                    xpEarned = ROOKIE_XP_QUICKPLAY;
                }
            } else {
                xpEarned = ROOKIE_XP_LOSS;
            }
        }

        // === ARCADE MODE: return to ArcadeScene (with optional LevelUp) ===
        if (this.arcadeState) {
            if (isRookie && xpEarned > 0) {
                const save = loadSave();
                fadeToScene(this, 'LevelUpScene', {
                    pointsToDistribute: xpEarned,
                    currentStats: save.rookie.stats,
                    totalPoints: save.rookie.totalPoints,
                    returnScene: 'ArcadeScene',
                    returnData: {
                        playerCharacter: this.arcadeState.playerCharacter,
                        currentRound: this.arcadeState.currentRound,
                        wins: this.arcadeState.wins,
                        losses: this.arcadeState.losses,
                        matchResults: this.arcadeState.matchResults,
                        lastMatchResult: { won: this.won }
                    }
                });
            } else {
                fadeToScene(this, 'ArcadeScene', {
                    playerCharacter: this.arcadeState.playerCharacter,
                    currentRound: this.arcadeState.currentRound,
                    wins: this.arcadeState.wins,
                    losses: this.arcadeState.losses,
                    matchResults: this.arcadeState.matchResults,
                    lastMatchResult: { won: this.won }
                });
            }
            return;
        }

        // === QUICK PLAY / OTHER: return to returnScene (with optional LevelUp) ===
        if (isRookie && xpEarned > 0) {
            const save = loadSave();
            fadeToScene(this, 'LevelUpScene', {
                pointsToDistribute: xpEarned,
                currentStats: save.rookie.stats,
                totalPoints: save.rookie.totalPoints,
                returnScene: this.returnScene || 'QuickPlayScene',
                returnData: {}
            });
        } else {
            fadeToScene(this, this.returnScene || 'TitleScene');
        }
    }

    _getSpriteKey(char) {
        return getCharSpriteKey(char);
    }

    // === PROCHAIN OBJECTIF : teaser galets + rookie ability ===
    _showNextUnlockTeaser(isRookie) {
        const save = loadSave();
        const teaserY = GAME_HEIGHT - 44;
        const cx = GAME_WIDTH / 2;
        const SHADOW_SM = { offsetX: 1, offsetY: 1, color: '#1A1510', blur: 0, fill: true };

        // --- Galets teaser ---
        const shopData = this.cache.json.get('shop');
        if (shopData) {
            const allItems = shopData.categories.flatMap(c => c.items).filter(i => i.price > 0);
            const purchases = save.purchases || [];
            const unpurchased = allItems.filter(i => !purchases.includes(i.id) && save.galets < i.price);
            unpurchased.sort((a, b) => a.price - b.price);
            const next = unpurchased[0];
            if (next) {
                const diff = next.price - save.galets;
                const galetTxt = this.add.text(cx, teaserY,
                    `Encore ${diff} Galets pour ${next.name} !`, {
                        fontFamily: 'monospace', fontSize: '11px',
                        color: '#D4A574', shadow: SHADOW_SM
                    }
                ).setOrigin(0.5).setAlpha(0);
                this.tweens.add({ targets: galetTxt, alpha: 1, duration: 400, delay: 1200 });
            }
        }

        // --- Rookie XP teaser ---
        if (isRookie) {
            const charsData = this.cache.json.get('characters');
            const rookieDef = charsData?.roster?.find(r => r.id === 'rookie');
            if (rookieDef?.abilities_unlock) {
                const totalPts = (save.rookie?.totalPoints || 0);
                const abilitiesUnlocked = save.rookie?.abilitiesUnlocked || [];
                const nextAbility = rookieDef.abilities_unlock.find(
                    u => !abilitiesUnlocked.includes(u.id) && u.threshold > totalPts
                );
                if (nextAbility) {
                    const diff = nextAbility.threshold - totalPts;
                    const xpTxt = this.add.text(cx, teaserY + 14,
                        `Encore ${diff} pts pour ${nextAbility.ability.name} !`, {
                            fontFamily: 'monospace', fontSize: '11px',
                            color: '#FFD700', shadow: SHADOW_SM
                        }
                    ).setOrigin(0.5).setAlpha(0);
                    this.tweens.add({ targets: xpTxt, alpha: 1, duration: 400, delay: 1200 });
                }
            }
        }
    }
}
