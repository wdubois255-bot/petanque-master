import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, getCharSpriteKey, CHAR_STATIC_SPRITES, PIXELS_TO_METERS, ROOKIE_XP_ARCADE, ROOKIE_XP_QUICKPLAY, GALET_LOSS, ROOKIE_XP_LOSS, CHAR_SCALE_RESULT, CHAR_SCALE_RESULT_STATIC } from '../utils/Constants.js';
import { setSoundScene, sfxVictory, sfxDefeat } from '../utils/SoundManager.js';
import { addGalets, loadSave, saveSave, unlockCochonnet, unlockBoule, recordWin } from '../utils/SaveManager.js';
import UIFactory from '../ui/UIFactory.js';

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
    }

    create() {
        setSoundScene(this);
        this._returning = false;
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

        const panel = UIFactory.createPanel(this, panelX - panelW / 2, panelY, panelW, panelH, {
            fillAlpha: 0.85, strokeAlpha: 0.3, strokeWidth: 1
        });

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

        // === GALETS EARNED ===
        const galetsToGive = this.won ? this.galetsEarned : GALET_LOSS;
        if (galetsToGive > 0) {
            addGalets(galetsToGive);
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

        // === ACTION BUTTONS ===
        const btnY = 310;

        if (this.arcadeState) {
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
            // Quick Play / other modes
            const replayBtn = this.add.text(GAME_WIDTH / 2 - 100, btnY, '[ REJOUER ]', {
                fontFamily: 'monospace', fontSize: '18px', color: '#F5E6D0',
                backgroundColor: this.won ? '#44CC44' : '#C44B3F', padding: { x: 14, y: 8 }, shadow: SHADOW
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });

            replayBtn.on('pointerdown', () => this._returnToArcade());

            const menuBtn = this.add.text(GAME_WIDTH / 2 + 100, btnY, '[ MENU ]', {
                fontFamily: 'monospace', fontSize: '18px', color: '#F5E6D0',
                backgroundColor: '#3A2E28', padding: { x: 14, y: 8 }, shadow: SHADOW
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });

            menuBtn.on('pointerdown', () => this.scene.start('TitleScene'));

            this.input.keyboard.on('keydown-SPACE', () => this._returnToArcade());
        }

        this.input.keyboard.on('keydown-ESC', () => {
            if (this.arcadeState) {
                this._returnToArcade();
            } else {
                this.scene.start('TitleScene');
            }
        });

        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 16, 'Espace Continuer     Echap Menu', {
            fontFamily: 'monospace', fontSize: '12px', color: '#9E9E8E', shadow: SHADOW
        }).setOrigin(0.5);

        this.events.on('shutdown', this._shutdown, this);
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
        const starSize = 16;
        const spacing = 40;
        const startX = cx - spacing;

        for (let i = 0; i < 3; i++) {
            const sx = startX + i * spacing;
            const filled = i < count;
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
                this.scene.start('LevelUpScene', {
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
                        lastMatchResult: { won: true }
                    }
                });
            } else {
                this.scene.start('ArcadeScene', {
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
            this.scene.start('LevelUpScene', {
                pointsToDistribute: xpEarned,
                currentStats: save.rookie.stats,
                totalPoints: save.rookie.totalPoints,
                returnScene: this.returnScene || 'QuickPlayScene',
                returnData: {}
            });
        } else {
            this.scene.start(this.returnScene || 'TitleScene');
        }
    }

    _getSpriteKey(char) {
        return getCharSpriteKey(char);
    }
}
