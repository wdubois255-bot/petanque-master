import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, getCharSpriteKey, PIXELS_TO_METERS } from '../utils/Constants.js';
import { setSoundScene, sfxVictory, sfxDefeat } from '../utils/SoundManager.js';

const SHADOW = { offsetX: 2, offsetY: 2, color: '#1A1510', blur: 0, fill: true };

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
            onComplete: () => { if (this.won) this.cameras.main.flash(100, 255, 215, 0); }
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
                const winSprite = this.add.sprite(GAME_WIDTH / 2 - 200, 200, winKey, 0)
                    .setScale(0.625).setOrigin(0.5);
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

        const panel = this.add.graphics();
        panel.fillStyle(0x3A2E28, 0.85);
        panel.fillRoundedRect(panelX - panelW / 2, panelY, panelW, panelH, 8);
        panel.lineStyle(1, 0xD4A574, 0.3);
        panel.strokeRoundedRect(panelX - panelW / 2, panelY, panelW, panelH, 8);

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

        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 16, 'Espace Continuer     Echap Menu', {
            fontFamily: 'monospace', fontSize: '12px', color: '#9E9E8E', shadow: SHADOW
        }).setOrigin(0.5);
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
        try {
            const key = 'pm_star_ratings';
            const existing = JSON.parse(localStorage.getItem(key) || '{}');
            const oppId = this.opponentCharacter.id;
            if (!existing[oppId] || stars > existing[oppId]) {
                existing[oppId] = stars;
            }
            localStorage.setItem(key, JSON.stringify(existing));
        } catch { /* ignore */ }

        // Track cumulative stats for cosmetic unlocks
        this._trackCumulativeStats();
    }

    _trackCumulativeStats() {
        try {
            const key = 'pm_cumulative_stats';
            const stats = JSON.parse(localStorage.getItem(key) || '{"carreaux":0,"victories":0,"biberons":0,"matches":0}');
            stats.carreaux += this.matchStats.carreaux || 0;
            stats.biberons += this.matchStats.biberons || 0;
            stats.victories += this.won ? 1 : 0;
            stats.matches += 1;
            localStorage.setItem(key, JSON.stringify(stats));

            // Check for cosmetic unlocks
            const unlocked = JSON.parse(localStorage.getItem('pm_cosmetic_unlocks') || '[]');
            const newUnlocks = [];

            if (stats.carreaux >= 10 && !unlocked.includes('boule_doree')) {
                unlocked.push('boule_doree');
                newUnlocks.push('Boule Doree debloquee !');
            }
            if (stats.victories >= 20 && !unlocked.includes('boule_diamant')) {
                unlocked.push('boule_diamant');
                newUnlocks.push('Boule Diamant debloquee !');
            }
            if (stats.biberons >= 5 && !unlocked.includes('cochonnet_bleu')) {
                unlocked.push('cochonnet_bleu');
                newUnlocks.push('Cochonnet Bleu debloque !');
            }
            if (stats.carreaux >= 25 && !unlocked.includes('cochonnet_vert')) {
                unlocked.push('cochonnet_vert');
                newUnlocks.push('Cochonnet Vert debloque !');
            }

            if (newUnlocks.length > 0) {
                localStorage.setItem('pm_cosmetic_unlocks', JSON.stringify(unlocked));
                this._showUnlockNotification(newUnlocks);
            }
        } catch { /* ignore */ }
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
