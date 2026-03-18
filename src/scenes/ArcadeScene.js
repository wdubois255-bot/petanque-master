import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, getCharSpriteKey } from '../utils/Constants.js';

const SHADOW = { offsetX: 2, offsetY: 2, color: '#1A1510', blur: 0, fill: true };

/**
 * Arcade Mode - Manages progression through 5 matches + boss
 * This scene acts as a hub between matches, showing progress and launching VS intros
 */
export default class ArcadeScene extends Phaser.Scene {
    constructor() {
        super('ArcadeScene');
    }

    init(data) {
        this.playerCharacter = data.playerCharacter || null;
        this.currentRound = data.currentRound || 1;
        this.wins = data.wins || 0;
        this.losses = data.losses || 0;
        this.matchResults = data.matchResults || [];
        // After returning from a match
        this.lastMatchResult = data.lastMatchResult || null;
    }

    create() {
        this.arcadeData = this.cache.json.get('arcade');
        this.charactersData = this.cache.json.get('characters');
        this.terrainsData = this.cache.json.get('terrains');

        // If no player character yet, go to char select
        if (!this.playerCharacter) {
            this.scene.start('CharSelectScene', { mode: 'arcade' });
            return;
        }

        // Show intro narrative on first entry (round 1, no results yet)
        if (this.currentRound === 1 && !this.lastMatchResult && this.arcadeData.intro_narrative) {
            this._showNarrative(this.arcadeData.intro_narrative, () => {
                this._buildProgressScreen();
            });
            return;
        }

        // Process last match result (if returning from a match)
        if (this.lastMatchResult) {
            if (this.lastMatchResult.won) {
                this.wins++;
                this.matchResults.push({ round: this.currentRound - 1, won: true });
            } else {
                this.losses++;
                this.matchResults.push({ round: this.currentRound - 1, won: false });
                // In arcade: you can retry (no game over, you just replay the round)
                this.currentRound--; // Go back to the failed round
            }
        }

        // Check if arcade is complete
        const totalMatches = this.arcadeData.matches.length;
        const bossDefeated = this.matchResults.some(r => r.round === totalMatches + 1 && r.won);

        if (bossDefeated) {
            this._showArcadeComplete();
            return;
        }

        // Check if all 5 matches done -> boss fight
        const allRegularWon = this.wins >= totalMatches && !bossDefeated;

        this._buildProgressScreen(allRegularWon);

        this.events.on('shutdown', this._shutdown, this);
    }

    _buildProgressScreen(allRegularWon) {
        // Show the arcade progress screen
        this._showProgressScreen(allRegularWon);
    }

    // === NARRATIVE SCREENS (intro/ending text crawl) ===
    _showNarrative(lines, onComplete) {
        const bg = this.add.graphics();
        bg.fillStyle(0x1A1510, 1);
        bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        const lineObjects = [];
        const startY = GAME_HEIGHT / 2 - (lines.length * 24) / 2;

        for (let i = 0; i < lines.length; i++) {
            const txt = this.add.text(GAME_WIDTH / 2, startY + i * 24, lines[i], {
                fontFamily: 'monospace', fontSize: '16px', color: '#D4A574',
                shadow: SHADOW, align: 'center'
            }).setOrigin(0.5).setAlpha(0);

            lineObjects.push(txt);

            this.tweens.add({
                targets: txt, alpha: 1, duration: 600,
                delay: 300 + i * 400, ease: 'Sine.easeIn'
            });
        }

        const skipHint = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 30, 'Espace pour continuer', {
            fontFamily: 'monospace', fontSize: '12px', color: '#9E9E8E', shadow: SHADOW
        }).setOrigin(0.5).setAlpha(0);

        const totalDelay = 300 + lines.length * 400 + 500;
        this.tweens.add({
            targets: skipHint, alpha: 1, duration: 400, delay: totalDelay
        });

        let canSkip = false;
        this.time.delayedCall(1000, () => { canSkip = true; });

        const proceed = () => {
            if (!canSkip) return;
            canSkip = false;
            this.cameras.main.fadeOut(400);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                bg.destroy();
                lineObjects.forEach(t => t.destroy());
                skipHint.destroy();
                this.cameras.main.fadeIn(300);
                if (onComplete) onComplete();
            });
        };

        this.input.keyboard.on('keydown-SPACE', proceed);
        this.input.keyboard.on('keydown-ENTER', proceed);
        this.input.on('pointerdown', proceed);
    }

    _showProgressScreen(bossUnlocked) {
        // Background
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x1A1510, 0x1A1510, 0x3A2E28, 0x3A2E28, 1);
        bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Title
        this.add.text(GAME_WIDTH / 2, 30, 'MODE ARCADE', {
            fontFamily: 'monospace', fontSize: '32px', color: '#FFD700',
            shadow: { offsetX: 3, offsetY: 3, color: '#1A1510', blur: 0, fill: true }
        }).setOrigin(0.5);

        // Player character info
        this.add.text(80, 70, `${this.playerCharacter.name} - ${this.playerCharacter.title}`, {
            fontFamily: 'monospace', fontSize: '14px', color: '#D4A574', shadow: SHADOW
        }).setOrigin(0, 0.5);

        // Progress track (horizontal bar with nodes)
        const trackY = 140;
        const startX = 80;
        const endX = GAME_WIDTH - 80;
        const matches = this.arcadeData.matches;

        // Track line
        const track = this.add.graphics();
        track.lineStyle(3, 0x5A4A38, 0.8);
        track.beginPath();
        track.moveTo(startX, trackY);
        track.lineTo(endX, trackY);
        track.strokePath();

        // Match nodes
        for (let i = 0; i < matches.length; i++) {
            const x = startX + (i / (matches.length)) * (endX - startX);
            const match = matches[i];
            const result = this.matchResults.find(r => r.round === i + 1);
            const isCurrent = (i + 1 === this.currentRound) && !bossUnlocked;

            // Node circle
            const nodeG = this.add.graphics();
            if (result && result.won) {
                // Won: green
                nodeG.fillStyle(0x44CC44, 1);
                nodeG.fillCircle(x, trackY, 14);
                nodeG.fillStyle(0xFFFFFF, 0.3);
                nodeG.fillCircle(x - 3, trackY - 3, 5);
                this.add.text(x, trackY, '\u2713', {
                    fontFamily: 'monospace', fontSize: '16px', color: '#FFFFFF'
                }).setOrigin(0.5);
            } else if (isCurrent) {
                // Current: gold pulsing
                nodeG.fillStyle(0xFFD700, 1);
                nodeG.fillCircle(x, trackY, 14);
                this.tweens.add({
                    targets: nodeG, alpha: 0.5,
                    duration: 500, yoyo: true, repeat: -1
                });
            } else {
                // Future: dark
                nodeG.fillStyle(0x5A4A38, 0.8);
                nodeG.fillCircle(x, trackY, 12);
            }

            // Round number
            this.add.text(x, trackY + 26, `${i + 1}`, {
                fontFamily: 'monospace', fontSize: '11px', color: '#9E9E8E', shadow: SHADOW
            }).setOrigin(0.5);

            // Opponent name below
            const oppChar = this._getCharById(match.opponent);
            this.add.text(x, trackY + 42, oppChar ? oppChar.name : '???', {
                fontFamily: 'monospace', fontSize: '10px', color: '#D4A574', shadow: SHADOW
            }).setOrigin(0.5);
        }

        // Boss node at the end
        const bossX = endX;
        const bossG = this.add.graphics();
        if (bossUnlocked) {
            bossG.fillStyle(0xC44B3F, 1);
            bossG.fillCircle(bossX, trackY, 16);
            this.add.text(bossX, trackY, '\u2605', {
                fontFamily: 'monospace', fontSize: '18px', color: '#FFD700'
            }).setOrigin(0.5);
            this.tweens.add({
                targets: bossG, alpha: 0.6,
                duration: 400, yoyo: true, repeat: -1
            });
        } else {
            bossG.fillStyle(0x3A2E28, 0.8);
            bossG.fillCircle(bossX, trackY, 16);
            this.add.text(bossX, trackY, '?', {
                fontFamily: 'monospace', fontSize: '20px', color: '#5A4A38'
            }).setOrigin(0.5);
        }
        this.add.text(bossX, trackY + 26, 'BOSS', {
            fontFamily: 'monospace', fontSize: '11px', color: bossUnlocked ? '#C44B3F' : '#5A4A38', shadow: SHADOW
        }).setOrigin(0.5);

        // Next match info panel
        const panelY = 200;
        const nextMatch = bossUnlocked ? this.arcadeData.boss : this.arcadeData.matches[this.currentRound - 1];
        const nextOpponent = this._getCharById(nextMatch.opponent);
        const nextTerrain = this._getTerrainById(bossUnlocked ? nextMatch.terrain : nextMatch.terrain);

        if (nextOpponent) {
            // Panel bg
            const panel = this.add.graphics();
            panel.fillStyle(0x3A2E28, 0.85);
            panel.fillRoundedRect(GAME_WIDTH / 2 - 280, panelY, 560, 180, 10);
            panel.lineStyle(2, 0xD4A574, 0.4);
            panel.strokeRoundedRect(GAME_WIDTH / 2 - 280, panelY, 560, 180, 10);

            // "PROCHAIN COMBAT" header
            this.add.text(GAME_WIDTH / 2, panelY + 18, bossUnlocked ? 'COMBAT FINAL' : 'PROCHAIN COMBAT', {
                fontFamily: 'monospace', fontSize: '18px',
                color: bossUnlocked ? '#C44B3F' : '#FFD700', shadow: SHADOW
            }).setOrigin(0.5);

            // Opponent info
            const spriteKey = this._getSpriteKey(nextOpponent);
            if (this.textures.exists(spriteKey)) {
                this.add.sprite(GAME_WIDTH / 2 - 200, panelY + 100, spriteKey, 0).setScale(0.625).setOrigin(0.5);
            }

            this.add.text(GAME_WIDTH / 2 - 100, panelY + 55, nextOpponent.name.toUpperCase(), {
                fontFamily: 'monospace', fontSize: '22px', color: '#F5E6D0', shadow: SHADOW
            }).setOrigin(0, 0.5);

            this.add.text(GAME_WIDTH / 2 - 100, panelY + 80, nextOpponent.title, {
                fontFamily: 'monospace', fontSize: '12px', color: '#D4A574', shadow: SHADOW
            }).setOrigin(0, 0.5);

            this.add.text(GAME_WIDTH / 2 - 100, panelY + 105, `"${nextOpponent.catchphrase}"`, {
                fontFamily: 'monospace', fontSize: '10px', color: '#9E9E8E', shadow: SHADOW,
                wordWrap: { width: 300 }
            }).setOrigin(0, 0.5);

            // Terrain + difficulty
            if (nextTerrain) {
                this.add.text(GAME_WIDTH / 2 - 100, panelY + 135, `Terrain : ${nextTerrain.name}`, {
                    fontFamily: 'monospace', fontSize: '12px', color: '#D4A574', shadow: SHADOW
                });
            }
            this.add.text(GAME_WIDTH / 2 - 100, panelY + 155, `Difficulte : ${nextMatch.difficulty_label}`, {
                fontFamily: 'monospace', fontSize: '12px', color: '#D4A574', shadow: SHADOW
            });

            // Stats preview (small bars)
            const statsX = GAME_WIDTH / 2 + 140;
            const statsY = panelY + 50;
            const statNames = ['precision', 'puissance', 'effet', 'sang_froid'];
            const statLabels = ['PRE', 'PUI', 'EFF', 'S-F'];
            const statColors = [0xD4A574, 0xC4854A, 0x9B7BB8, 0x87CEEB]; // ocre, terracotta, lavande, ciel

            for (let i = 0; i < statNames.length; i++) {
                const sy = statsY + i * 22;
                this.add.text(statsX, sy, statLabels[i], {
                    fontFamily: 'monospace', fontSize: '10px', color: '#9E9E8E', shadow: SHADOW
                });
                const barG = this.add.graphics();
                barG.fillStyle(0x1A1510, 0.8);
                barG.fillRect(statsX + 30, sy - 3, 80, 10);
                barG.fillStyle(statColors[i], 0.8);
                barG.fillRect(statsX + 30, sy - 3, (nextOpponent.stats[statNames[i]] / 10) * 80, 10);
            }
        }

        // COMBATTRE button
        const btnY = panelY + 200;
        const btnBg = this.add.graphics();
        btnBg.fillStyle(0xC44B3F, 0.9);
        btnBg.fillRoundedRect(GAME_WIDTH / 2 - 100, btnY, 200, 44, 8);

        const btnText = this.add.text(GAME_WIDTH / 2, btnY + 22, 'COMBATTRE !', {
            fontFamily: 'monospace', fontSize: '22px', color: '#FFFFFF',
            shadow: { offsetX: 2, offsetY: 2, color: '#1A1510', blur: 0, fill: true }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        // Pulse button
        this.tweens.add({
            targets: [btnBg, btnText], scaleX: 1.03, scaleY: 1.03,
            duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
        });

        btnText.on('pointerdown', () => this._launchNextMatch(bossUnlocked));

        // Keyboard
        this.input.keyboard.on('keydown-SPACE', () => this._launchNextMatch(bossUnlocked));
        this.input.keyboard.on('keydown-ENTER', () => this._launchNextMatch(bossUnlocked));
        this.input.keyboard.on('keydown-ESC', () => this.scene.start('TitleScene'));

        // Controls hint
        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 16, 'Espace Combattre     Echap Menu', {
            fontFamily: 'monospace', fontSize: '12px', color: '#9E9E8E', shadow: SHADOW
        }).setOrigin(0.5);
    }

    _launchNextMatch(isBoss) {
        if (this._launched) return;
        this._launched = true;

        const match = isBoss ? this.arcadeData.boss : this.arcadeData.matches[this.currentRound - 1];
        const opponent = this._getCharById(match.opponent);
        const terrain = this._getTerrainById(match.terrain);

        this.cameras.main.fadeOut(300);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('VSIntroScene', {
                playerCharacter: this.playerCharacter,
                opponentCharacter: opponent,
                terrain: terrain ? terrain.surface : 'terre',
                terrainName: terrain ? terrain.name : 'Place du Village',
                roundNumber: isBoss ? 'BOSS' : this.currentRound,
                introText: match.intro_text || '',
                matchData: {
                    difficulty: 'medium',
                    format: 'tete_a_tete',
                    returnScene: 'ArcadeScene',
                    arcadeState: {
                        playerCharacter: this.playerCharacter,
                        currentRound: isBoss ? this.currentRound : this.currentRound + 1,
                        wins: this.wins,
                        losses: this.losses,
                        matchResults: this.matchResults,
                        isBoss
                    }
                }
            });
        });
    }

    _showArcadeComplete() {
        // Show ending narrative first, then the completion screen
        if (this.arcadeData.ending_narrative && !this._endingShown) {
            this._endingShown = true;
            const playerName = this.playerCharacter?.name || 'Le Champion';
            const lines = this.arcadeData.ending_narrative.map(
                l => l.replace('[Personnage]', playerName)
            );
            this._showNarrative(lines, () => this._showArcadeCompleteScreen());
            return;
        }
        this._showArcadeCompleteScreen();
    }

    _showArcadeCompleteScreen() {
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x1A1510, 0x1A1510, 0x3A2E28, 0x3A2E28, 1);
        bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Confetti effect
        for (let i = 0; i < 30; i++) {
            const x = Phaser.Math.Between(50, GAME_WIDTH - 50);
            const y = Phaser.Math.Between(-50, -200);
            const colors = [0xFFD700, 0xC44B3F, 0x44CC44, 0x5B9BD5, 0x9B7BB8];
            const c = colors[Math.floor(Math.random() * colors.length)];
            const conf = this.add.graphics();
            conf.fillStyle(c, 0.9);
            conf.fillRect(0, 0, 6, 8);
            conf.setPosition(x, y);
            this.tweens.add({
                targets: conf,
                y: GAME_HEIGHT + 50,
                x: x + Phaser.Math.Between(-80, 80),
                angle: Phaser.Math.Between(-360, 360),
                duration: Phaser.Math.Between(2000, 4000),
                ease: 'Sine.easeIn',
                delay: Phaser.Math.Between(0, 1500)
            });
        }

        // Victory text
        this.add.text(GAME_WIDTH / 2, 100, 'ARCADE\nTERMINEE !', {
            fontFamily: 'monospace', fontSize: '48px', color: '#FFD700',
            align: 'center', lineSpacing: 4,
            shadow: { offsetX: 4, offsetY: 4, color: '#1A1510', blur: 0, fill: true }
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2, 200, `Victoires : ${this.wins} / ${this.wins + this.losses}`, {
            fontFamily: 'monospace', fontSize: '20px', color: '#F5E6D0', shadow: SHADOW
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2, 240, `Champion : ${this.playerCharacter.name}`, {
            fontFamily: 'monospace', fontSize: '18px', color: '#D4A574', shadow: SHADOW
        }).setOrigin(0.5);

        // Unlock boss character
        this.add.text(GAME_WIDTH / 2, 300, 'Le Grand Marius est debloque !', {
            fontFamily: 'monospace', fontSize: '20px', color: '#C44B3F', shadow: SHADOW
        }).setOrigin(0.5);

        // Save unlock
        try {
            const unlocked = JSON.parse(localStorage.getItem('pm_unlocked_chars') || '[]');
            if (!unlocked.includes('boss')) {
                unlocked.push('boss');
                localStorage.setItem('pm_unlocked_chars', JSON.stringify(unlocked));
            }
        } catch { /* ignore */ }

        // Return button
        const btn = this.add.text(GAME_WIDTH / 2, 380, '[ MENU PRINCIPAL ]', {
            fontFamily: 'monospace', fontSize: '22px', color: '#F5E6D0',
            backgroundColor: '#C44B3F', padding: { x: 20, y: 10 }, shadow: SHADOW
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        btn.on('pointerdown', () => this.scene.start('TitleScene'));
        this.input.keyboard.on('keydown-SPACE', () => this.scene.start('TitleScene'));
        this.input.keyboard.on('keydown-ENTER', () => this.scene.start('TitleScene'));
    }

    _getCharById(id) {
        return this.charactersData.roster.find(c => c.id === id) || null;
    }

    _getTerrainById(id) {
        return this.terrainsData.stages.find(t => t.id === id) || null;
    }

    _getSpriteKey(char) {
        return getCharSpriteKey(char);
    }

    _shutdown() {
        this.input.keyboard.removeAllListeners();
        this.tweens.killAll();
    }
}
