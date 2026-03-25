import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, getCharSpriteKey, CHAR_STATIC_SPRITES, PIXELS_TO_METERS, ROOKIE_XP_ARCADE, ROOKIE_XP_QUICKPLAY, GALET_LOSS, ROOKIE_XP_LOSS, CHAR_SCALE_RESULT, CHAR_SCALE_RESULT_STATIC, PLOMBEE_UNLOCK_WINS } from '../utils/Constants.js';
import { setSoundScene, sfxVictory, sfxDefeat, sfxScore } from '../utils/SoundManager.js';
import { addGalets, loadSave, saveSave, unlockCochonnet, unlockBoule, recordWin, recordMatchStats, isMilestoneUnlocked, unlockMilestone } from '../utils/SaveManager.js';
import UIFactory from '../ui/UIFactory.js';
import { fadeToScene } from '../utils/SceneTransition.js';
import I18n from '../utils/I18n.js';

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
        this.matchChallenge = data.matchChallenge || null;
        // Reset flags — Phaser reuses scene instances!
        this._returning = false;
        this._postDialogDone = false;
    }

    create() {
        setSoundScene(this);
        this.cameras.main.setAlpha(1);
        this.cameras.main.resetFX();
        if (this.won) { sfxVictory(); } else { sfxDefeat(); }

        const HEAVY_SHADOW = { offsetX: 3, offsetY: 3, color: '#1A1510', blur: 0, fill: true };

        // ════════════════════════════════════════════════════════
        //  BACKGROUND — warm gradient + subtle atmosphere
        // ════════════════════════════════════════════════════════
        const bg = this.add.graphics();
        if (this.won) {
            // Dark olive → warm brown-gold (victory warmth)
            bg.fillGradientStyle(0x1A2818, 0x1A2818, 0x2A2A1A, 0x2A2A1A, 1);
        } else {
            // Dark red-brown → muted brown (somber but warm)
            bg.fillGradientStyle(0x2A1816, 0x2A1816, 0x2A2220, 0x2A2220, 1);
        }
        bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Subtle radial vignette (darker edges)
        const vignette = this.add.graphics().setDepth(0);
        vignette.fillStyle(0x1A1510, 0.3);
        vignette.fillRect(0, 0, 40, GAME_HEIGHT);
        vignette.fillRect(GAME_WIDTH - 40, 0, 40, GAME_HEIGHT);
        vignette.fillStyle(0x1A1510, 0.15);
        vignette.fillRect(40, 0, 30, GAME_HEIGHT);
        vignette.fillRect(GAME_WIDTH - 70, 0, 30, GAME_HEIGHT);

        // Horizontal separator line (subtle gold)
        const sepLine = this.add.graphics().setDepth(1);
        sepLine.lineStyle(1, this.won ? 0xD4A574 : 0x6B4A3A, 0.3);
        sepLine.beginPath(); sepLine.moveTo(60, 140); sepLine.lineTo(GAME_WIDTH - 60, 140); sepLine.strokePath();

        // ════════════════════════════════════════════════════════
        //  TOP ZONE — Title + Score + Stars (0-140px)
        // ════════════════════════════════════════════════════════
        const titleColor = this.won ? '#FFD700' : '#C44B3F';
        const titleText = this.won
            ? I18n.t('result.victory') || 'VICTOIRE !'
            : I18n.t('result.defeat') || 'DEFAITE...';

        const title = this.add.text(GAME_WIDTH / 2, 36, titleText, {
            fontFamily: 'monospace', fontSize: '36px', color: titleColor,
            shadow: { offsetX: 4, offsetY: 4, color: '#1A1510', blur: 0, fill: true }
        }).setOrigin(0.5).setScale(0).setDepth(10);

        this.tweens.add({
            targets: title, scale: 1, duration: 400, ease: 'Back.easeOut', delay: 200,
            onComplete: () => {
                if (this.won) {
                    this.cameras.main.flash(80, 255, 215, 0);
                    this._spawnConfetti();
                }
            }
        });

        // Score — big, clean
        const scoreColor = this.won ? '#F5E6D0' : '#D4A574';
        const scoreText = this.add.text(GAME_WIDTH / 2, 82,
            `${this.scores.player}  —  ${this.scores.opponent}`, {
                fontFamily: 'monospace', fontSize: '28px', color: scoreColor,
                shadow: HEAVY_SHADOW
            }).setOrigin(0.5).setAlpha(0).setDepth(10);
        this.tweens.add({ targets: scoreText, alpha: 1, duration: 300, delay: 400 });

        // Stars (victory only)
        if (this.won) {
            const stars = this._calculateStars();
            this._drawStars(GAME_WIDTH / 2, 116, stars);
            this._saveStarRating(stars);
        }

        // Defeat advice (instead of stars)
        if (!this.won) {
            const advice = this._getDefeatAdvice();
            if (advice) {
                const adviceText = this.add.text(GAME_WIDTH / 2, 116, advice, {
                    fontFamily: 'monospace', fontSize: '10px', color: '#D4A574',
                    shadow: SHADOW, wordWrap: { width: 500 }, align: 'center',
                    fontStyle: 'italic'
                }).setOrigin(0.5).setAlpha(0).setDepth(10);
                this.tweens.add({ targets: adviceText, alpha: 0.8, duration: 400, delay: 800 });
            }
        }

        // ════════════════════════════════════════════════════════
        //  MIDDLE ZONE — Character (left) + Stats (right) (140-380px)
        // ════════════════════════════════════════════════════════
        const winner = this.won ? this.playerCharacter : this.opponentCharacter;
        const charX = 160; // Left zone center
        const charY = 265;

        if (winner) {
            // Ground shadow under character
            const groundShadow = this.add.graphics().setDepth(3);
            groundShadow.fillStyle(0x1A1510, 0.35);
            groundShadow.fillEllipse(charX, charY + 60, 90, 14);

            // Large character sprite (no frame — let it breathe)
            const winKey = this._getSpriteKey(winner);
            if (this.textures.exists(winKey)) {
                const isStatic = CHAR_STATIC_SPRITES.includes(winner.id);
                const spriteScale = isStatic ? 2.2 : 2.5;
                const winSprite = isStatic
                    ? this.add.image(charX, charY, winKey).setScale(spriteScale).setOrigin(0.5).setDepth(4)
                    : this.add.sprite(charX, charY, winKey, 0).setScale(spriteScale).setOrigin(0.5).setDepth(4);
                // Gentle float
                this.tweens.add({
                    targets: winSprite, y: charY - 6, duration: 1200,
                    yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
                });
            }

            // Character name
            const nameColor = this.won ? '#87CEEB' : '#C44B3F';
            this.add.text(charX, charY + 72, I18n.field(winner, 'name'), {
                fontFamily: 'monospace', fontSize: '14px', color: nameColor, shadow: HEAVY_SHADOW
            }).setOrigin(0.5).setDepth(5);

            // Opponent bark (speech bubble feel)
            const opponent = this.opponentCharacter;
            if (opponent?.barks) {
                const barkKey = this.won ? 'post_match_lose' : 'post_match_win';
                const localizedBarks = I18n.fieldArray(opponent, 'barks');
                const barks = localizedBarks?.[barkKey] || opponent.barks[barkKey];
                if (barks?.length) {
                    const bark = barks[Math.floor(Math.random() * barks.length)];
                    const barkBg = this.add.graphics().setDepth(5);
                    barkBg.fillStyle(0x1A1510, 0.5);
                    barkBg.fillRoundedRect(charX - 110, charY + 88, 220, 30, 6);
                    this.add.text(charX, charY + 103, `"${bark}"`, {
                        fontFamily: 'monospace', fontSize: '8px', color: '#D4A574',
                        shadow: SHADOW, wordWrap: { width: 200 }, align: 'center',
                        fontStyle: 'italic'
                    }).setOrigin(0.5).setDepth(6);
                }
            }
        }

        // === STATS + REWARDS PANEL (right side) ===
        const panelX = 530;
        const panelY = 155;
        const panelW = 280;
        const panelH = 195;
        const statsContainer = this.add.container(0, 0).setAlpha(0).setDepth(5);

        // Panel background
        const panelGfx = this.add.graphics();
        panelGfx.fillStyle(0x1A1510, 0.75);
        panelGfx.fillRoundedRect(panelX - panelW / 2, panelY, panelW, panelH, 8);
        panelGfx.lineStyle(1, this.won ? 0xD4A574 : 0x6B4A3A, 0.4);
        panelGfx.strokeRoundedRect(panelX - panelW / 2, panelY, panelW, panelH, 8);
        panelGfx.lineStyle(1, 0xF5E6D0, 0.06);
        panelGfx.beginPath();
        panelGfx.moveTo(panelX - panelW / 2 + 12, panelY + 1);
        panelGfx.lineTo(panelX + panelW / 2 - 12, panelY + 1);
        panelGfx.strokePath();
        statsContainer.add(panelGfx);

        // Compute stats
        const ms = this.matchStats;
        const bestDist = ms.bestBallDist && ms.bestBallDist < Infinity
            ? `${(ms.bestBallDist * (PIXELS_TO_METERS || 0.036) * 100).toFixed(0)}cm`
            : '-';
        const totalThrows = (ms.shots || 0) + (ms.points_attempted || 0);

        // Playstyle label (more meaningful than raw %)
        let playstyle = I18n.t('result.stats.style_balanced') || 'Equilibre';
        if (totalThrows > 0) {
            const tirPct = (ms.shots || 0) / totalThrows;
            if (tirPct >= 0.6) playstyle = I18n.t('result.stats.style_tireur') || 'Tireur';
            else if (tirPct <= 0.2) playstyle = I18n.t('result.stats.style_pointeur') || 'Pointeur';
        }

        // 4 key stats (2x2 grid) — focused on what matters
        const stats = [
            { label: I18n.t('result.stats.menes'), value: ms.menes || '?', color: '#F5E6D0' },
            { label: I18n.t('result.stats.best_ball'), value: bestDist, color: '#87CEEB' },
            { label: I18n.t('result.stats.carreaux'), value: ms.carreaux || 0, color: (ms.carreaux || 0) > 0 ? '#FFD700' : '#F5E6D0' },
            { label: I18n.t('result.stats.playstyle') || 'Style', value: playstyle, color: '#9B7BB8' },
        ];

        for (let i = 0; i < stats.length; i++) {
            const col = i % 2;
            const row = Math.floor(i / 2);
            const sx = panelX - panelW / 2 + 24 + col * (panelW / 2);
            const sy = panelY + 12 + row * 44;

            statsContainer.add(this.add.text(sx, sy, stats[i].label, {
                fontFamily: 'monospace', fontSize: '8px', color: '#9E9E8E', shadow: SHADOW
            }));
            const isTextValue = typeof stats[i].value === 'string' && stats[i].value.length > 4;
            statsContainer.add(this.add.text(sx, sy + 14, `${stats[i].value}`, {
                fontFamily: 'monospace', fontSize: isTextValue ? '14px' : '20px',
                color: stats[i].color, shadow: HEAVY_SHADOW
            }));
        }

        // Fanny badge
        if (ms.fanny) {
            statsContainer.add(this.add.text(panelX, panelY + 104,
                I18n.t('result.fanny'), {
                    fontFamily: 'monospace', fontSize: '12px', color: '#C44B3F',
                    shadow: HEAVY_SHADOW
                }).setOrigin(0.5));
        }

        // ── Rewards section (inside panel, bottom zone) ──
        const rewardBaseY = panelY + 110;
        const rewardSep = this.add.graphics();
        rewardSep.lineStyle(1, 0xD4A574, 0.15);
        rewardSep.beginPath();
        rewardSep.moveTo(panelX - panelW / 2 + 16, rewardBaseY);
        rewardSep.lineTo(panelX + panelW / 2 - 16, rewardBaseY);
        rewardSep.strokePath();
        statsContainer.add(rewardSep);

        const rewardLineY = rewardBaseY + 14;
        const galetsToGive = this.won ? this.galetsEarned : GALET_LOSS;

        // Rookie XP (compute early for layout)
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

        // Galets + XP on same line to save space
        if (galetsToGive > 0 || xpEarned > 0) {
            const parts = [];
            if (galetsToGive > 0) { addGalets(galetsToGive); parts.push(`+${galetsToGive} Galets`); }
            if (xpEarned > 0) parts.push(`+${xpEarned} XP`);
            const rewardStr = parts.join('   ');
            statsContainer.add(this.add.text(panelX, rewardLineY, rewardStr, {
                fontFamily: 'monospace', fontSize: '14px', color: '#FFD700', shadow: HEAVY_SHADOW
            }).setOrigin(0.5));
        }

        // Match challenge (below rewards, compact)
        if (this.matchChallenge && this.won) {
            const c = this.matchChallenge;
            const msc = this.matchStats;
            let completed = false;
            if (c.condition === 'carreaux >= 1' && (msc.carreaux || 0) >= 1) completed = true;
            if (c.condition === 'shots === 0 && won' && (msc.shots || 0) === 0) completed = true;
            if (c.condition === 'won && opponentScore <= 5' && this.scores.opponent <= 5) completed = true;
            if (c.condition === 'won && maxDeficit >= 5' && (msc._maxDeficit || 0) >= 5) completed = true;
            if (c.condition === 'won && opponentScore === 0' && this.scores.opponent === 0) completed = true;
            if (completed) {
                addGalets(c.reward);
                statsContainer.add(this.add.text(panelX, rewardLineY + 20,
                    I18n.t('arcade.challenge_complete', { galets: c.reward }), {
                        fontFamily: 'monospace', fontSize: '10px', color: '#FFD700', shadow: SHADOW
                    }).setOrigin(0.5));
            }
        }

        // Stats panel slides in
        this.tweens.add({
            targets: statsContainer, alpha: 1, duration: 400, delay: 1200,
            onStart: () => sfxScore()
        });

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

        // ════════════════════════════════════════════════════════
        //  BOTTOM ZONE — Buttons (380-480px)
        // ════════════════════════════════════════════════════════
        const btnY = GAME_HEIGHT - 80;
        const btnContainer = this.add.container(0, 0).setAlpha(0).setDepth(10);

        // Main action button (styled rectangle, not text backgroundColor)
        const mainLabel = this.arcadeState
            ? (this.won ? I18n.t('result.continue') : I18n.t('arcade.retry'))
            : I18n.t('result.replay');
        const mainBtnColor = this.won ? 0x6B8E4E : 0xC44B3F; // olive (victory) or terracotta (defeat)
        const mainBtnW = 200;
        const mainBtnH = 44;
        const mainBtnX = GAME_WIDTH / 2;

        const mainBg = this.add.graphics();
        mainBg.fillStyle(mainBtnColor, 0.9);
        mainBg.fillRoundedRect(mainBtnX - mainBtnW / 2, btnY - mainBtnH / 2, mainBtnW, mainBtnH, 6);
        mainBg.lineStyle(1, 0xF5E6D0, 0.2);
        mainBg.strokeRoundedRect(mainBtnX - mainBtnW / 2, btnY - mainBtnH / 2, mainBtnW, mainBtnH, 6);
        // Top highlight
        mainBg.lineStyle(1, 0xFFFFFF, 0.12);
        mainBg.beginPath();
        mainBg.moveTo(mainBtnX - mainBtnW / 2 + 8, btnY - mainBtnH / 2 + 1);
        mainBg.lineTo(mainBtnX + mainBtnW / 2 - 8, btnY - mainBtnH / 2 + 1);
        mainBg.strokePath();
        btnContainer.add(mainBg);

        const mainBtnText = this.add.text(mainBtnX, btnY, mainLabel.toUpperCase(), {
            fontFamily: 'monospace', fontSize: '18px', color: '#F5E6D0', shadow: HEAVY_SHADOW
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        mainBtnText.on('pointerdown', () => { if (this._postDialogDone) this._returnToArcade(); });
        btnContainer.add(mainBtnText);

        // Subtle pulse on main button
        this.tweens.add({
            targets: [mainBg, mainBtnText], scaleX: 1.02, scaleY: 1.02,
            duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
        });

        // Secondary "Menu" button — top-right corner, away from main action
        const menuBtn = this.add.text(GAME_WIDTH - 16, 16, I18n.t('result.menu'), {
            fontFamily: 'monospace', fontSize: '10px', color: '#5A4A38', shadow: SHADOW
        }).setOrigin(1, 0).setDepth(10).setInteractive({ useHandCursor: true });
        menuBtn.on('pointerover', () => menuBtn.setColor('#D4A574'));
        menuBtn.on('pointerout', () => menuBtn.setColor('#5A4A38'));
        menuBtn.on('pointerdown', () => fadeToScene(this, 'TitleScene'));
        btnContainer.add(menuBtn);

        // Buttons appear last
        this.tweens.add({ targets: btnContainer, alpha: 1, duration: 400, delay: 2600 });

        // Controls hint (very subtle, bottom edge)
        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 10, I18n.t('result.controls'), {
            fontFamily: 'monospace', fontSize: '9px', color: '#5A4A38', shadow: SHADOW
        }).setOrigin(0.5).setDepth(1);

        // ════════════════════════════════════════════════════════
        //  POST-MATCH FLOW — Dialogue → Unlock → Input
        // ════════════════════════════════════════════════════════
        const afterEverything = () => {
            this._postDialogDone = true;
            this._addInputHandlers();
        };

        const afterDialogue = () => {
            // Check if plombée was just unlocked (first win)
            const save = loadSave();
            const justUnlockedPlombee = this.won
                && (save.stats?.totalWins || 0) === PLOMBEE_UNLOCK_WINS;

            const afterUnlocks = () => {
                if (this.unlocksOnWin) {
                    this._showCharacterUnlock(this.unlocksOnWin, afterEverything);
                } else {
                    afterEverything();
                }
            };

            if (justUnlockedPlombee) {
                this._showTechniqueUnlock('PLOMBEE', 'Lancer en cloche — la boule roule moins !', 0x9B7BB8, afterUnlocks);
            } else {
                afterUnlocks();
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

        // Safety: unblock input after 10s if dialogue fails
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

        let dialogDone = false;
        const showLine = (index) => {
            if (index >= dialogues.length) {
                if (dialogDone) return;
                dialogDone = true;
                // Remove listeners to prevent double onDone calls
                this.input.keyboard.off('keydown-SPACE');
                this.input.keyboard.off('keydown-ENTER');
                this.input.off('pointerdown');
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
        if (speakerId === 'rookie') return (this.playerCharacter ? I18n.field(this.playerCharacter, 'name') : null) || 'Rookie';
        if (this.opponentCharacter?.id === speakerId) return I18n.field(this.opponentCharacter, 'name');
        return speakerId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    // === CHARACTER UNLOCK CELEBRATION (tâche 4.4) ===
    _showCharacterUnlock(charId, onDone) {
        const charactersData = this.cache.json.get('characters');
        const char = charactersData?.roster?.find(c => c.id === charId);
        if (!char) { onDone(); return; }

        sfxScore();

        const overlay = this.add.graphics().setDepth(300);
        overlay.fillStyle(0x1A1510, 0.85);
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

        const charName = this.add.text(GAME_WIDTH / 2, panelY + 60, I18n.field(char, 'name'), {
            fontFamily: 'monospace', fontSize: '28px', color: '#F5E6D0',
            shadow: { offsetX: 3, offsetY: 3, color: '#1A1510', blur: 0, fill: true }
        }).setOrigin(0.5).setDepth(303).setAlpha(0);
        this.tweens.add({ targets: charName, alpha: 1, y: panelY + 58, duration: 400, ease: 'Quad.easeOut', delay: 300 });

        const charTitle = this.add.text(GAME_WIDTH / 2, panelY + 90, I18n.field(char, 'title') || '', {
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

    _showTechniqueUnlock(name, description, color, onDone) {
        sfxScore();
        const colorHex = '#' + color.toString(16).padStart(6, '0');

        const overlay = this.add.graphics().setDepth(300);
        overlay.fillStyle(0x1A1510, 0.85);
        overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        overlay.setAlpha(0);
        this.tweens.add({ targets: overlay, alpha: 1, duration: 300 });

        const panelW = 380, panelH = 120;
        const panelX = GAME_WIDTH / 2 - panelW / 2;
        const panelY = GAME_HEIGHT / 2 - panelH / 2;

        const panel = this.add.graphics().setDepth(302);
        panel.fillStyle(0x2A1F14, 0.98);
        panel.fillRoundedRect(panelX, panelY, panelW, panelH, 10);
        panel.lineStyle(2, color, 0.8);
        panel.strokeRoundedRect(panelX, panelY, panelW, panelH, 10);
        panel.setScale(0);
        this.tweens.add({ targets: panel, scale: 1, duration: 400, ease: 'Back.easeOut' });

        const title = this.add.text(GAME_WIDTH / 2, panelY + 28, '★ NOUVELLE TECHNIQUE ★', {
            fontFamily: 'monospace', fontSize: '16px', color: colorHex,
            shadow: { offsetX: 2, offsetY: 2, color: '#1A1510', blur: 0, fill: true }
        }).setOrigin(0.5).setDepth(303).setScale(0);
        this.tweens.add({ targets: title, scale: 1, duration: 400, ease: 'Back.easeOut', delay: 150 });

        const nameText = this.add.text(GAME_WIDTH / 2, panelY + 58, name, {
            fontFamily: 'monospace', fontSize: '26px', color: '#F5E6D0',
            shadow: { offsetX: 3, offsetY: 3, color: '#1A1510', blur: 0, fill: true }
        }).setOrigin(0.5).setDepth(303).setAlpha(0);
        this.tweens.add({ targets: nameText, alpha: 1, duration: 400, delay: 300 });

        const descText = this.add.text(GAME_WIDTH / 2, panelY + 88, description, {
            fontFamily: 'monospace', fontSize: '12px', color: '#D4A574', shadow: SHADOW
        }).setOrigin(0.5).setDepth(303).setAlpha(0);
        this.tweens.add({ targets: descText, alpha: 1, duration: 300, delay: 500 });

        const hint = this.add.text(GAME_WIDTH / 2, panelY + panelH + 16, '~ Appuyez sur Espace ~', {
            fontFamily: 'monospace', fontSize: '11px', color: '#8B7A5A', shadow: SHADOW
        }).setOrigin(0.5).setDepth(303).setAlpha(0);
        this.tweens.add({ targets: hint, alpha: 0.6, duration: 500, delay: 1000, yoyo: true, repeat: -1 });

        let dismissed = false;
        const dismiss = () => {
            if (dismissed) return;
            dismissed = true;
            this.tweens.add({
                targets: [overlay, panel, title, nameText, descText, hint],
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
            const y = 18 + i * 34;
            const toastText = this.add.text(GAME_WIDTH / 2, y + 10,
                `★ ${toast.text}  +${toast.reward} Galets`, {
                    fontFamily: 'monospace', fontSize: '13px', color: '#FFD700',
                    backgroundColor: '#2A1F14', padding: { x: 12, y: 6 },
                    shadow: { offsetX: 2, offsetY: 2, color: '#1A1510', blur: 0, fill: true }
                }
            ).setOrigin(0.5).setDepth(250).setAlpha(0);

            this.tweens.add({
                targets: toastText,
                alpha: 1, y: y,
                duration: 400, ease: 'Back.easeOut', delay: i * 300
            });

            this.tweens.add({
                targets: toastText,
                alpha: 0, y: y - 10,
                duration: 400, ease: 'Quad.easeIn',
                delay: 3000 + i * 300
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

    _getDefeatAdvice() {
        const ms = this.matchStats;
        const bestDist = ms.bestBallDist || Infinity;
        const shots = ms.shots || 0;
        const carreaux = ms.carreaux || 0;
        const pScore = this.scores.player || 0;
        const oScore = this.scores.opponent || 0;
        // Priority-ordered: return most relevant advice
        if (bestDist > 80) return I18n.t('result.advice.too_long');
        if (shots === 0) return I18n.t('result.advice.no_tir');
        if (pScore >= 10 && oScore >= 10) return I18n.t('result.advice.pressure_loss');
        if (carreaux === 0 && shots > 0) return I18n.t('result.advice.no_carreau');
        if (bestDist > 40) return I18n.t('result.advice.low_precision');
        return I18n.t('result.advice.general');
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
            { id: 'boule_noire', cond: stats.carreaux >= 10, msg: 'Boules Noires debloquees ! (10 carreaux)' },
            { id: 'boule_rouge', cond: stats.victories >= 10, msg: 'Boules Rouges debloquees ! (10 victoires)' },
            { id: 'boule_doree', cond: stats.victories >= 50, msg: 'Boules Dorees debloquees ! (50 victoires)' },
        ];
        const cochUnlocks = [
            { id: 'cochonnet_bleu', cond: stats.victories >= 5, msg: 'Cochonnet Bleu debloque ! (5 victoires)' },
            { id: 'cochonnet_vert', cond: stats.carreaux >= 20, msg: 'Cochonnet Vert debloque ! (20 carreaux)' },
            { id: 'cochonnet_jungle', cond: stats.victories >= 50, msg: 'Cochonnet Jungle debloque ! (50 victoires)' },
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
                if (u.id.startsWith('boule_')) unlockBoule(u.id.replace(/^boule_/, ''));
                if (u.id.startsWith('cochonnet_')) unlockCochonnet(u.id.replace(/^cochonnet_/, ''));
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
        const teaserY = GAME_HEIGHT - 36; // Just above controls hint
        const cx = 160; // Left side, under character
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
