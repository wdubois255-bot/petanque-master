import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, getCharSpriteKey, GALET_WIN_ARCADE, GALET_ARCADE_COMPLETE, GALET_ARCADE_PERFECT, CHAR_SCALE_ARCADE, MAP_NODE_RADIUS, MAP_PATH_COLOR, MAP_PATH_DASH, MAP_NODE_PULSE_DURATION, MAP_STAR_SIZE, MAP_PREVIEW_Y, DEFEAT_CONSOLATION_GALETS, DEFEAT_RETRY_ENABLED, SHOP_EXPRESS_MIN_GALETS } from '../utils/Constants.js';
import { loadSave, saveSave, unlockCharacter, unlockTerrain, setArcadeProgress, addGalets, recordWin, setArcadeIntroSeen, isMilestoneUnlocked, unlockMilestone } from '../utils/SaveManager.js';
import UIFactory from '../ui/UIFactory.js';
import { fadeToScene } from '../utils/SceneTransition.js';
import I18n from '../utils/I18n.js';

const SHADOW = { offsetX: 2, offsetY: 2, color: '#1A1510', blur: 0, fill: true };

/**
 * Arcade Mode - Le Terrain des Quatre (3 matches)
 * Hub between matches: shows progress, launches VS intros
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
        // Phase 5
        this._mapTooltip = null;
    }

    create() {
        // Reset state for fresh scene entry
        this._launched = false;
        this._endingShown = false;
        // Ensure camera is fully visible (previous scene may have faded out)
        this.cameras.main.setAlpha(1);
        this.cameras.main.resetFX();

        // Register shutdown FIRST (before any early returns)
        this.events.on('shutdown', this._shutdown, this);

        this.arcadeData = this.cache.json.get('arcade') || {};
        this.charactersData = this.cache.json.get('characters') || {};
        this.terrainsData = this.cache.json.get('terrains') || {};

        // Force Rookie in Arcade mode
        if (!this.playerCharacter) {
            const chars = this.cache.json.get('characters') || {};
            const rookie = chars.roster?.find(c => c.id === 'rookie');
            if (rookie) {
                const save = loadSave();
                if (save.rookie) {
                    rookie.stats = { ...save.rookie.stats };
                }
                rookie.isRookie = true;
                this.playerCharacter = rookie;
            } else {
                fadeToScene(this, 'CharSelectScene', { mode: 'arcade' });
                return;
            }
        }

        // Always refresh Rookie stats from save (may have been updated by LevelUpScene)
        if (this.playerCharacter?.isRookie || this.playerCharacter?.id === 'rookie') {
            const save = loadSave();
            if (save.rookie) {
                this.playerCharacter.stats = { ...save.rookie.stats };
            }
            this.playerCharacter.isRookie = true;
        }

        // Show intro narrative on very first Arcade session (never seen before)
        const save = loadSave();
        if (this.currentRound === 1 && !this.lastMatchResult && this.arcadeData.intro_narrative && !save.arcadeIntroSeen) {
            setArcadeIntroSeen();
            this._showNarrative(I18n.fieldArray(this.arcadeData, 'intro_narrative') || this.arcadeData.intro_narrative, () => {
                this._buildProgressScreen();
            });
            return;
        }

        // Process last match result (if returning from a match)
        if (this.lastMatchResult) {
            const completedRound = this.currentRound - 1;
            if (this.lastMatchResult.won) {
                this.wins++;
                this.matchResults.push({ round: completedRound, won: true });

                // Unlock rewards based on round won
                this._processRoundUnlocks(completedRound);

                // Save arcade progress, record win (Galets are added in ResultScene)
                setArcadeProgress(completedRound);
                recordWin();
            } else {
                this.losses++;
                this.matchResults.push({ round: completedRound, won: false });
                // In arcade: you can retry (no game over, you just replay the round)
                this.currentRound--; // Go back to the failed round
            }
        }

        // Phase 5 D3 — Defeat screen (before map)
        if (this.lastMatchResult && !this.lastMatchResult.won) {
            this._showDefeatScreen(this.lastMatchResult);
            return;
        }

        // Check if arcade data is valid
        if (!this.arcadeData.matches) {
            fadeToScene(this, 'TitleScene');
            return;
        }

        // Check if arcade is complete
        const totalMatches = this.arcadeData.matches.length;
        if (this.wins >= totalMatches) {
            this._showArcadeComplete();
            return;
        }

        // Phase 5 E1 — Post-narrative after rounds 1 and 2 (on win)
        if (this.lastMatchResult?.won) {
            const completedRound = this.currentRound - 1;
            const prevMatch = this.arcadeData.matches[completedRound - 1];
            if (prevMatch?.post_narrative) {
                const lines = I18n.fieldArray(prevMatch, 'post_narrative') || prevMatch.post_narrative;
                this._showNarrative(lines, () => {
                    this._buildProgressScreen();
                });
                return;
            }
        }

        // Show mid-narrative after winning round 3 (before round 4)
        if (this.lastMatchResult?.won && this.currentRound === 4 && this.arcadeData.mid_narrative_after_3) {
            this._showNarrative(I18n.fieldArray(this.arcadeData, 'mid_narrative_after_3') || this.arcadeData.mid_narrative_after_3, () => {
                this._buildProgressScreen();
            });
            return;
        }

        // Phase 5 F1 — Check milestones
        this._checkMilestones();

        this._buildProgressScreen();
    }

    _buildProgressScreen() {
        // Phase 5 F2 — Shop express after victory
        const save = loadSave();
        if (this.lastMatchResult?.won && this.currentRound <= 5
            && save.galets >= SHOP_EXPRESS_MIN_GALETS) {
            this._showShopExpress(() => {
                this._showProgressScreen();
            });
            return;
        }
        this._showProgressScreen();
    }

    // === NARRATIVE SCREENS (parchment + typewriter effect) ===
    _showNarrative(lines, onComplete) {
        const bg = this.add.graphics();
        bg.fillStyle(0x1A1510, 1);
        bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Parchment background — nearly full screen
        if (this.textures.exists('v2_dialog_bg')) {
            const parch = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'v2_dialog_bg')
                .setDisplaySize(GAME_WIDTH - 40, GAME_HEIGHT - 60).setAlpha(0);
            this.tweens.add({ targets: parch, alpha: 0.55, duration: 800, ease: 'Sine.easeOut' });
        }

        const lineObjects = [];
        const lineSpacing = 28;
        const startY = GAME_HEIGHT / 2 - (lines.length * lineSpacing) / 2;

        // Typewriter: reveal each line character by character
        let charIndex = 0;
        const typeSpeed = 30; // ms per character
        const lineDelay = 200; // pause between lines

        for (let i = 0; i < lines.length; i++) {
            const txt = this.add.text(GAME_WIDTH / 2, startY + i * lineSpacing, '', {
                fontFamily: 'Georgia, serif', fontSize: '15px', color: '#C8A06A',
                shadow: { offsetX: 1, offsetY: 1, color: '#3A2E18', blur: 1, fill: true },
                align: 'center'
            }).setOrigin(0.5).setAlpha(1);
            lineObjects.push(txt);
        }

        // Typewriter timer — reveal characters one by one across all lines
        let currentLine = 0;
        let currentChar = 0;
        const allChars = lines.map(l => l.length);

        const typeTimer = this.time.addEvent({
            delay: typeSpeed,
            repeat: -1,
            callback: () => {
                if (currentLine >= lines.length) {
                    typeTimer.remove();
                    return;
                }
                const line = lines[currentLine];
                if (currentChar <= line.length) {
                    lineObjects[currentLine].setText(line.substring(0, currentChar));
                    currentChar++;
                } else {
                    // Line complete, move to next
                    currentLine++;
                    currentChar = 0;
                    // Add small pause between lines
                    typeTimer.delay = lineDelay;
                    this.time.delayedCall(lineDelay, () => {
                        if (typeTimer.repeatCount > 0) typeTimer.delay = typeSpeed;
                    });
                }
            }
        });

        // Skip hint (appears after 2s)
        const skipHint = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 24, '~ Espace ~', {
            fontFamily: 'Georgia, serif', fontSize: '11px', color: '#8A7A5A',
            shadow: { offsetX: 1, offsetY: 1, color: '#1A1510', blur: 0, fill: true }
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({
            targets: skipHint, alpha: 0.7, duration: 600, delay: 2500,
            yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
        });

        let canSkip = false;
        this.time.delayedCall(1200, () => { canSkip = true; });

        let narrativeComplete = false;
        const cleanupNarrative = () => {
            if (narrativeComplete) return;
            narrativeComplete = true;
            // Remove listeners to prevent leaks into subsequent UI
            this.input.keyboard.off('keydown-SPACE', proceed);
            this.input.keyboard.off('keydown-ENTER', proceed);
            this.input.off('pointerdown', proceed);
            bg.destroy();
            lineObjects.forEach(t => t.destroy());
            skipHint.destroy();
            this.cameras.main.resetFX();
            this.cameras.main.setAlpha(1);
            if (onComplete) onComplete();
        };

        const proceed = () => {
            if (!canSkip) return;

            // If typewriter still running, finish it instantly
            if (currentLine < lines.length) {
                typeTimer.remove();
                for (let i = 0; i < lines.length; i++) {
                    lineObjects[i].setText(lines[i]);
                }
                currentLine = lines.length;
                canSkip = false;
                this.time.delayedCall(500, () => { canSkip = true; });
                return;
            }

            canSkip = false;
            this.cameras.main.fadeOut(400);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.cameras.main.fadeIn(300);
                cleanupNarrative();
            });
            // Safety: force transition if camerafadeoutcomplete never fires (Phaser 4 RC6)
            this.time.delayedCall(900, cleanupNarrative);
        };

        this.input.keyboard.on('keydown-SPACE', proceed);
        this.input.keyboard.on('keydown-ENTER', proceed);
        this.input.on('pointerdown', proceed);
    }

    _showProgressScreen() {
        const matches = this.arcadeData.matches;
        const nextMatch = matches[this.currentRound - 1];
        const save = loadSave();

        // === PROVENCAL LANDSCAPE BACKGROUND ===
        this._drawMapBackground();

        // === MAP OVERLAY UI ===
        // Title (top-left, on dark chip for readability)
        const titleChip = this.add.graphics().setDepth(5);
        titleChip.fillStyle(0x1A1510, 0.55);
        titleChip.fillRoundedRect(8, 8, 220, 48, 6);
        this.add.text(16, 16, I18n.t('arcade.title'), {
            fontFamily: 'monospace', fontSize: '14px', color: '#FFD700',
            shadow: { offsetX: 2, offsetY: 2, color: '#1A1510', blur: 0, fill: true }
        }).setDepth(6);
        this.add.text(16, 36, I18n.t('arcade.subtitle'), {
            fontFamily: 'monospace', fontSize: '10px', color: '#D4A574', shadow: SHADOW
        }).setDepth(6);

        // Stars + time (top-right chip)
        const totalStars = Object.values(save.starRatings || {}).reduce((s, v) => s + v, 0);
        const infoChip = this.add.graphics().setDepth(5);
        infoChip.fillStyle(0x1A1510, 0.55);
        infoChip.fillRoundedRect(GAME_WIDTH - 168, 8, 160, 48, 6);
        if (nextMatch?.time_of_day) {
            this.add.text(GAME_WIDTH - 16, 18, I18n.t('arcade.time_' + nextMatch.time_of_day), {
                fontFamily: 'monospace', fontSize: '10px', color: '#F5E6D0', shadow: SHADOW
            }).setOrigin(1, 0).setDepth(6);
        }
        this.add.text(GAME_WIDTH - 16, 36, I18n.t('arcade.stars_total', { n: totalStars }), {
            fontFamily: 'monospace', fontSize: '11px', color: '#FFD700', shadow: SHADOW
        }).setOrigin(1, 0).setDepth(6);

        // === DIRT PATH between nodes ===
        const NODE_POSITIONS = [
            { x: 130, y: 145 }, { x: 270, y: 115 }, { x: 416, y: 105 },
            { x: 560, y: 120 }, { x: 700, y: 150 }
        ];

        const pathG = this.add.graphics().setDepth(2);
        // Thick dirt path (wide brown stroke)
        for (let i = 0; i < NODE_POSITIONS.length - 1; i++) {
            const a = NODE_POSITIONS[i];
            const b = NODE_POSITIONS[i + 1];
            // Brown wide path
            pathG.lineStyle(8, 0x8B6B3A, 0.5);
            pathG.beginPath();
            pathG.moveTo(a.x, a.y);
            // Slight curve via midpoint offset
            const mx = (a.x + b.x) / 2;
            const my = (a.y + b.y) / 2 - 8;
            pathG.lineTo(mx, my);
            pathG.lineTo(b.x, b.y);
            pathG.strokePath();
            // Lighter center line
            pathG.lineStyle(3, 0xD4A574, 0.35);
            pathG.beginPath();
            pathG.moveTo(a.x, a.y);
            pathG.lineTo(mx, my);
            pathG.lineTo(b.x, b.y);
            pathG.strokePath();
        }

        // === CHARACTER PORTRAIT NODES ===
        for (let i = 0; i < matches.length; i++) {
            const pos = NODE_POSITIONS[i];
            const match = matches[i];
            const result = this.matchResults.find(r => r.round === i + 1);
            const isCurrent = (i + 1 === this.currentRound);
            const oppChar = this._getCharById(match.opponent);
            const spriteKey = oppChar ? this._getSpriteKey(oppChar) : null;

            // Node base (circle platform)
            const nodeG = this.add.graphics().setDepth(3);

            if (result && result.won) {
                // WON: portrait visible + green ring + checkmark
                nodeG.fillStyle(0x3A2E28, 0.7);
                nodeG.fillCircle(pos.x, pos.y, 22);
                nodeG.lineStyle(2, 0x44CC44, 1);
                nodeG.strokeCircle(pos.x, pos.y, 22);

                if (spriteKey && this.textures.exists(spriteKey)) {
                    const spr = this.add.sprite(pos.x, pos.y - 2, spriteKey, 0)
                        .setScale(0.45).setOrigin(0.5).setDepth(4).setTint(0x888888);
                }
                // Green checkmark overlay
                this.add.text(pos.x + 12, pos.y - 14, '\u2713', {
                    fontFamily: 'monospace', fontSize: '12px', color: '#44CC44',
                    shadow: { offsetX: 1, offsetY: 1, color: '#1A1510', blur: 0, fill: true }
                }).setOrigin(0.5).setDepth(5);

                // Stars under won node
                const stars = save.starRatings?.[match.opponent] || 0;
                for (let s = 0; s < 3; s++) {
                    this.add.text(pos.x - 12 + s * 12, pos.y + 28, '\u2605', {
                        fontFamily: 'monospace', fontSize: `${MAP_STAR_SIZE}px`,
                        color: s < stars ? '#FFD700' : '#5A4A38'
                    }).setOrigin(0.5).setDepth(4);
                }

            } else if (isCurrent) {
                // CURRENT: large portrait + gold pulsing ring
                nodeG.fillStyle(0x3A2E28, 0.8);
                nodeG.fillCircle(pos.x, pos.y, 24);
                nodeG.lineStyle(3, 0xFFD700, 1);
                nodeG.strokeCircle(pos.x, pos.y, 24);

                if (spriteKey && this.textures.exists(spriteKey)) {
                    const spr = this.add.sprite(pos.x, pos.y - 2, spriteKey, 0)
                        .setScale(0.5).setOrigin(0.5).setDepth(4);
                    this.tweens.add({
                        targets: spr, y: pos.y - 5, duration: 600,
                        yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
                    });
                }
                // Pulse ring
                this.tweens.add({
                    targets: nodeG, alpha: 0.5,
                    duration: MAP_NODE_PULSE_DURATION, yoyo: true, repeat: -1
                });
                // Opponent name
                this.add.text(pos.x, pos.y + 32, oppChar ? I18n.field(oppChar, 'name') : '???', {
                    fontFamily: 'monospace', fontSize: '9px', color: '#FFD700',
                    shadow: { offsetX: 1, offsetY: 1, color: '#1A1510', blur: 0, fill: true }
                }).setOrigin(0.5).setDepth(5);

            } else {
                // FUTURE: locked silhouette
                nodeG.fillStyle(0x3A2E28, 0.6);
                nodeG.fillCircle(pos.x, pos.y, 18);
                nodeG.lineStyle(1, 0x5A4A38, 0.6);
                nodeG.strokeCircle(pos.x, pos.y, 18);
                this.add.text(pos.x, pos.y, '?', {
                    fontFamily: 'monospace', fontSize: '16px', color: '#5A4A38'
                }).setOrigin(0.5).setDepth(4);
            }

            // Terrain name under each node
            const terrain = this._getTerrainById(match.terrain);
            this.add.text(pos.x, pos.y + (isCurrent ? 44 : (result?.won ? 42 : 26)), terrain ? I18n.field(terrain, 'name') : match.terrain, {
                fontFamily: 'monospace', fontSize: '8px', color: '#D4A574',
                shadow: { offsetX: 1, offsetY: 1, color: '#1A1510', blur: 0, fill: true }
            }).setOrigin(0.5).setDepth(4);
        }

        // === ROOKIE SPRITE on the map (at current node) ===
        const rookiePos = NODE_POSITIONS[this.currentRound - 1];
        const rookieKey = this.playerCharacter ? this._getSpriteKey(this.playerCharacter) : null;
        if (rookieKey && this.textures.exists(rookieKey)) {
            const prevRound = this.currentRound - 2;
            const startPos = prevRound >= 0 && this.lastMatchResult?.won
                ? NODE_POSITIONS[prevRound]
                : rookiePos;

            const rookieSpr = this.add.sprite(startPos.x - 30, startPos.y - 14, rookieKey, 0)
                .setScale(0.45).setOrigin(0.5).setDepth(6);

            // Walk animation from previous node (if just won)
            if (startPos !== rookiePos) {
                this.tweens.add({
                    targets: rookieSpr,
                    x: rookiePos.x - 30, y: rookiePos.y - 14,
                    duration: 800, ease: 'Quad.easeInOut',
                    onComplete: () => {
                        // Idle bounce after arriving
                        this.tweens.add({
                            targets: rookieSpr, y: rookiePos.y - 18,
                            duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
                        });
                    }
                });
            } else {
                this.tweens.add({
                    targets: rookieSpr, y: rookiePos.y - 18,
                    duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
                });
            }
        }

        // Decorations (organic elements)
        this._drawMapDecorations();

        // === PREVIEW PANEL (bottom half) ===
        const panelY = MAP_PREVIEW_Y;
        const nextOpponent = this._getCharById(nextMatch.opponent);
        const nextTerrain = this._getTerrainById(nextMatch.terrain);

        // Terrain-tinted panel background
        const terrainTints = { village: 0x3A2E28, parc: 0x2A3A28, colline: 0x3A3228, docks: 0x2A2A30, plage: 0x3A3428 };
        const panelTint = terrainTints[nextMatch.terrain] || 0x3A2E28;
        const panelBg = this.add.graphics().setDepth(5);
        panelBg.fillStyle(panelTint, 0.92);
        panelBg.fillRoundedRect(GAME_WIDTH / 2 - 300, panelY, 600, 185, 10);
        panelBg.lineStyle(2, 0xD4A574, 0.4);
        panelBg.strokeRoundedRect(GAME_WIDTH / 2 - 300, panelY, 600, 185, 10);

        if (nextOpponent) {
            // "PROCHAIN COMBAT" header
            this.add.text(GAME_WIDTH / 2, panelY + 14, I18n.t('arcade.next_fight'), {
                fontFamily: 'monospace', fontSize: '12px', color: '#FFD700', shadow: SHADOW
            }).setOrigin(0.5).setDepth(6);

            // Large opponent sprite (right side)
            const spriteKey = this._getSpriteKey(nextOpponent);
            if (spriteKey && this.textures.exists(spriteKey)) {
                const oppSpr = this.add.sprite(GAME_WIDTH / 2 + 190, panelY + 110, spriteKey, 0)
                    .setScale(1.3).setOrigin(0.5).setDepth(6);
                // Idle breathing
                this.tweens.add({
                    targets: oppSpr, scaleY: 1.33, scaleX: 1.27,
                    duration: 2000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
                });
                // Shadow under sprite
                this.add.ellipse(GAME_WIDTH / 2 + 190, panelY + 170, 50, 8, 0x1A1510, 0.3).setDepth(5);
            }

            // Info block (left side)
            const infoX = GAME_WIDTH / 2 - 270;
            this.add.text(infoX, panelY + 35, I18n.field(nextOpponent, 'name').toUpperCase(), {
                fontFamily: 'monospace', fontSize: '20px', color: '#F5E6D0', shadow: SHADOW
            }).setDepth(6);
            this.add.text(infoX, panelY + 60, I18n.field(nextOpponent, 'title'), {
                fontFamily: 'monospace', fontSize: '11px', color: '#D4A574', shadow: SHADOW
            }).setDepth(6);
            this.add.text(infoX, panelY + 78, `"${I18n.field(nextOpponent, 'catchphrase')}"`, {
                fontFamily: 'monospace', fontSize: '9px', color: '#9E9E8E', shadow: SHADOW,
                fontStyle: 'italic', wordWrap: { width: 280 }
            }).setDepth(6);

            // Terrain + difficulty
            if (nextTerrain) {
                this.add.text(infoX, panelY + 105, I18n.t('arcade.terrain_label', { name: I18n.field(nextTerrain, 'name') }), {
                    fontFamily: 'monospace', fontSize: '11px', color: '#D4A574', shadow: SHADOW
                }).setDepth(6);
            }
            this.add.text(infoX, panelY + 122, I18n.t('arcade.difficulty', { level: I18n.field(nextMatch, 'difficulty_label') }), {
                fontFamily: 'monospace', fontSize: '11px', color: '#D4A574', shadow: SHADOW
            }).setDepth(6);

            // Comparative stat bars (player vs opponent)
            const barX = infoX;
            const barY = panelY + 142;
            const statNames = ['precision', 'puissance', 'effet', 'sang_froid'];
            const statLabels = ['PRE', 'PUI', 'EFF', 'S-F'];
            const statColors = [0xD4A574, 0xC4854A, 0x9B7BB8, 0x87CEEB];
            const playerStats = this.playerCharacter?.stats || {};
            const barW = 70;
            const barG = this.add.graphics().setDepth(6);

            for (let i = 0; i < statNames.length; i++) {
                const sx = barX + i * 85;
                const pVal = playerStats[statNames[i]] || 5;
                const oVal = nextOpponent.stats[statNames[i]] || 5;
                // Label
                this.add.text(sx, barY, statLabels[i], {
                    fontFamily: 'monospace', fontSize: '8px', color: '#9E9E8E'
                }).setDepth(6);
                // Background
                barG.fillStyle(0x1A1510, 0.7);
                barG.fillRect(sx + 24, barY, barW, 5);
                barG.fillRect(sx + 24, barY + 8, barW, 5);
                // Player bar (blue)
                barG.fillStyle(0x87CEEB, 0.8);
                barG.fillRect(sx + 24, barY, (pVal / 10) * barW, 5);
                // Opponent bar (red)
                barG.fillStyle(0xC44B3F, 0.8);
                barG.fillRect(sx + 24, barY + 8, (oVal / 10) * barW, 5);
            }
        }

        // COMBATTRE button (centered below panel)
        const btnY = panelY + 190;
        const btnBg = this.add.graphics().setDepth(6);
        btnBg.fillStyle(0xC44B3F, 0.9);
        btnBg.fillRoundedRect(GAME_WIDTH / 2 - 100, btnY, 200, 44, 8);
        const btnText = this.add.text(GAME_WIDTH / 2, btnY + 22, I18n.t('arcade.fight_btn'), {
            fontFamily: 'monospace', fontSize: '22px', color: '#FFFFFF',
            shadow: { offsetX: 2, offsetY: 2, color: '#1A1510', blur: 0, fill: true }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(7);
        this.tweens.add({
            targets: [btnBg, btnText], scaleX: 1.03, scaleY: 1.03,
            duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
        });
        btnText.on('pointerdown', () => this._launchNextMatch());

        this.input.keyboard.on('keydown-SPACE', () => this._launchNextMatch());
        this.input.keyboard.on('keydown-ENTER', () => this._launchNextMatch());
        this.input.keyboard.on('keydown-ESC', () => fadeToScene(this, 'TitleScene'));

        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 14, I18n.t('arcade.controls'), {
            fontFamily: 'monospace', fontSize: '11px', color: '#9E9E8E', shadow: SHADOW
        }).setOrigin(0.5).setDepth(6);
    }

    // Provencal landscape background (same technique as TitleScene)
    _drawMapBackground() {
        const bg = this.add.graphics().setDepth(0);

        // Sky gradient: warm provencal blue → golden
        bg.fillGradientStyle(0x5A94C8, 0x5A94C8, 0xE8B868, 0xE8B868, 1);
        bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT * 0.55);

        // Ground: warm ocre → deep brown
        bg.fillGradientStyle(0xC4954A, 0xC4954A, 0x8B6030, 0x8B6030, 1);
        bg.fillRect(0, GAME_HEIGHT * 0.55, GAME_WIDTH, GAME_HEIGHT * 0.45);

        // Soft sun glow (upper area)
        const sunX = GAME_WIDTH * 0.75;
        const sunY = GAME_HEIGHT * 0.18;
        for (let r = 120; r > 0; r -= 4) {
            bg.fillStyle(0xFFE8A0, 0.006 + (120 - r) * 0.0003);
            bg.fillCircle(sunX, sunY, r);
        }

        // 3 layered distant hills (sine wave, like TitleScene)
        const hillLayers = [
            { color: 0x7BA0B8, alpha: 0.3, baseY: 200, freq: 0.004, amp: 18 },
            { color: 0x8BAA78, alpha: 0.4, baseY: 215, freq: 0.007, amp: 14 },
            { color: 0x9B9060, alpha: 0.55, baseY: 230, freq: 0.01, amp: 10 }
        ];
        for (const hill of hillLayers) {
            bg.fillStyle(hill.color, hill.alpha);
            for (let x = 0; x < GAME_WIDTH; x += 2) {
                const h = Math.sin(x * hill.freq + 1.5) * hill.amp
                        + Math.sin(x * hill.freq * 2.3 + 0.7) * hill.amp * 0.4
                        + hill.baseY;
                bg.fillRect(x, h, 2, GAME_HEIGHT - h);
            }
        }

        // Subtle texture dots on ground
        for (let i = 0; i < 80; i++) {
            const gx = Phaser.Math.Between(0, GAME_WIDTH);
            const gy = Phaser.Math.Between(GAME_HEIGHT * 0.5, GAME_HEIGHT);
            bg.fillStyle(0xFFFFFF, Phaser.Math.FloatBetween(0.02, 0.05));
            bg.fillRect(gx, gy, 1, 1);
        }

        // Dark bottom gradient for panel readability
        const panelFade = this.add.graphics().setDepth(1);
        panelFade.fillGradientStyle(0x1A1510, 0x1A1510, 0x1A1510, 0x1A1510, 0, 0, 0.85, 0.85);
        panelFade.fillRect(0, GAME_HEIGHT * 0.5, GAME_WIDTH, GAME_HEIGHT * 0.5);

        // Vignette (frame effect)
        const vig = this.add.graphics().setDepth(1);
        vig.fillGradientStyle(0x1A1510, 0x1A1510, 0x1A1510, 0x1A1510, 0.3, 0.3, 0, 0);
        vig.fillRect(0, 0, GAME_WIDTH, 50);
        vig.fillGradientStyle(0x1A1510, 0x1A1510, 0x1A1510, 0x1A1510, 0.2, 0, 0.2, 0);
        vig.fillRect(0, 0, 60, GAME_HEIGHT);
        vig.fillGradientStyle(0x1A1510, 0x1A1510, 0x1A1510, 0x1A1510, 0, 0.2, 0, 0.2);
        vig.fillRect(GAME_WIDTH - 60, 0, 60, GAME_HEIGHT);
    }

    _drawMapDecorations() {
        // Organic decorations using existing decor sprites where available
        const decorSprites = [
            { key: 'grid_olive', x: 60, y: 155, scale: 0.8, frame: 0 },
            { key: 'grid_olive', x: 340, y: 85, scale: 0.7, frame: 4 },
            { key: 'grid_olive', x: 500, y: 100, scale: 0.9, frame: 1 },
            { key: 'grid_olive', x: 770, y: 135, scale: 0.7, frame: 5 },
            { key: 'grid_lavande', x: 180, y: 175, scale: 0.5, frame: 0 },
            { key: 'grid_lavande', x: 640, y: 160, scale: 0.5, frame: 0 },
        ];

        for (const d of decorSprites) {
            if (this.textures.exists(d.key)) {
                const img = this.add.image(d.x, d.y, d.key, d.frame)
                    .setScale(d.scale).setDepth(2).setAlpha(0.7);
                // Gentle sway
                this.tweens.add({
                    targets: img, x: img.x + 1.5, angle: 0.3,
                    duration: 3000 + Math.random() * 2000,
                    yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
                    delay: Math.random() * 1500
                });
            }
        }

        // Fallback procedural decorations if sprites not loaded
        const deco = this.add.graphics().setDepth(2);
        // Small ground details (pebbles along path)
        for (let i = 0; i < 20; i++) {
            const px = Phaser.Math.Between(100, 730);
            const py = Phaser.Math.Between(130, 180);
            deco.fillStyle(0x8B6B3A, Phaser.Math.FloatBetween(0.15, 0.3));
            deco.fillCircle(px, py, Phaser.Math.Between(1, 3));
        }
    }

    _processRoundUnlocks(round) {
        switch (round) {
            case 1: unlockCharacter('la_choupe'); break;
            case 2: unlockCharacter('mamie_josette'); break;
            case 3: unlockCharacter('fazzino'); unlockTerrain('docks'); break;
            case 4: unlockCharacter('suchaud'); break;
            case 5: unlockCharacter('ley'); unlockTerrain('plage'); break;
        }
    }

    _launchNextMatch() {
        if (this._launched) return;
        this._launched = true;

        const match = this.arcadeData.matches[this.currentRound - 1];
        const opponent = this._getCharById(match.opponent);
        const terrain = this._getTerrainById(match.terrain);

        // Use player's equipped boule and cochonnet from save
        const save = loadSave();
        const bouleType = save.selectedBoule || 'acier';
        const cochonnetType = save.selectedCochonnet || 'classique';

        fadeToScene(this, 'VSIntroScene', {
            playerCharacter: this.playerCharacter,
            opponentCharacter: opponent,
            terrain: terrain ? terrain.surface : 'terre',
            terrainName: terrain ? I18n.field(terrain, 'name') : 'Place du Village',
            roundNumber: this.currentRound,
            introText: match.intro_text || '',
            preMatchDialogue: match.preMatchDialogue || null,
            matchData: {
                difficulty: match.difficulty || 'medium',
                format: 'tete_a_tete',
                bouleType,
                cochonnetType,
                returnScene: 'ArcadeScene',
                postMatchWin: match.postMatchWin || null,
                postMatchLose: match.postMatchLose || null,
                unlocksOnWin: match.opponent || null,
                arcadeState: {
                    playerCharacter: this.playerCharacter,
                    currentRound: this.currentRound + 1,
                    wins: this.wins,
                    losses: this.losses,
                    matchResults: this.matchResults
                }
            }
        });
    }

    _showArcadeComplete() {
        // Save final arcade progress
        setArcadeProgress(5);

        // Check for perfect run (all 5 won, no losses)
        const isPerfect = this.losses === 0;
        this._isPerfect = isPerfect;

        // Award completion bonus Galets
        const bonusGalets = isPerfect ? GALET_ARCADE_PERFECT : GALET_ARCADE_COMPLETE;
        addGalets(bonusGalets);
        this._completionGalets = bonusGalets;

        // Mark arcade perfect in save if applicable
        if (isPerfect) {
            const save = loadSave();
            save.arcadePerfect = true;
            saveSave(save);
        }

        // Show ending narrative first, then the completion screen
        if (this.arcadeData.ending_narrative && !this._endingShown) {
            this._endingShown = true;
            const playerName = this.playerCharacter ? I18n.field(this.playerCharacter, 'name') : 'Le Champion';
            const endingNarrative = I18n.fieldArray(this.arcadeData, 'ending_narrative') || this.arcadeData.ending_narrative;
            const lines = endingNarrative.map(
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

        this.add.text(GAME_WIDTH / 2, 240, `Champion : ${I18n.field(this.playerCharacter, 'name')}`, {
            fontFamily: 'monospace', fontSize: '18px', color: '#D4A574', shadow: SHADOW
        }).setOrigin(0.5);

        // Perfect run badge
        if (this._isPerfect) {
            this.add.text(GAME_WIDTH / 2, 270, 'PARCOURS PARFAIT !', {
                fontFamily: 'monospace', fontSize: '22px', color: '#FFD700', shadow: SHADOW
            }).setOrigin(0.5);
        }

        this.add.text(GAME_WIDTH / 2, 300, 'Le Terrain des Quatre est a toi !', {
            fontFamily: 'monospace', fontSize: '20px', color: '#C44B3F', shadow: SHADOW
        }).setOrigin(0.5);

        // Galets bonus display
        const bonusLabel = this._isPerfect ? 'Bonus parfait' : 'Bonus completion';
        this.add.text(GAME_WIDTH / 2, 335, `+${this._completionGalets} Galets (${bonusLabel})`, {
            fontFamily: 'monospace', fontSize: '16px', color: '#FFD700', shadow: SHADOW
        }).setOrigin(0.5);

        // Return button
        const btn = this.add.text(GAME_WIDTH / 2, 380, '[ MENU PRINCIPAL ]', {
            fontFamily: 'monospace', fontSize: '22px', color: '#F5E6D0',
            backgroundColor: '#C44B3F', padding: { x: 20, y: 10 }, shadow: SHADOW
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        btn.on('pointerdown', () => fadeToScene(this, 'TitleScene'));
        this.input.keyboard.on('keydown-SPACE', () => fadeToScene(this, 'TitleScene'));
        this.input.keyboard.on('keydown-ENTER', () => fadeToScene(this, 'TitleScene'));
    }

    _getCharById(id) {
        return this.charactersData?.roster?.find(c => c.id === id) || null;
    }

    _getTerrainById(id) {
        return this.terrainsData?.stages?.find(t => t.id === id) || null;
    }

    _getSpriteKey(char) {
        return getCharSpriteKey(char);
    }

    // === Phase 5 F2 — Shop express ===
    _showShopExpress(onComplete) {
        const shopData = this.cache.json.get('shop');
        if (!shopData?.categories) { onComplete(); return; }
        const save = loadSave();
        const purchases = save.purchases || [];

        // Collect all unpurchased items
        const allItems = [];
        for (const cat of shopData.categories) {
            for (const item of (cat.items || [])) {
                if (!purchases.includes(item.id)) {
                    allItems.push(item);
                }
            }
        }
        if (allItems.length === 0) { onComplete(); return; }

        // Pick 2 cheapest after discount
        const discount = 0.2;
        allItems.sort((a, b) => a.price - b.price);
        const offered = allItems.slice(0, 2);

        const shopElements = [];
        const cx = GAME_WIDTH / 2;

        const bg = this.add.graphics().setDepth(50);
        bg.fillStyle(0x1A1510, 0.85);
        bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        shopElements.push(bg);

        const title = this.add.text(cx, 80, I18n.t('arcade.shop_express_title'), {
            fontFamily: 'monospace', fontSize: '24px', color: '#FFD700', shadow: SHADOW
        }).setOrigin(0.5).setDepth(51);
        shopElements.push(title);

        const subtitle = this.add.text(cx, 110, I18n.t('arcade.shop_express_subtitle'), {
            fontFamily: 'monospace', fontSize: '12px', color: '#D4A574'
        }).setOrigin(0.5).setDepth(51);
        shopElements.push(subtitle);

        let currentSave = loadSave();
        const galetsLabel = this.add.text(cx, 135, `${currentSave.galets} Galets`, {
            fontFamily: 'monospace', fontSize: '14px', color: '#FFD700'
        }).setOrigin(0.5).setDepth(51);
        shopElements.push(galetsLabel);

        // Item cards
        const cardW = 200;
        const gap = 30;
        const startX = cx - (offered.length * cardW + (offered.length - 1) * gap) / 2;

        for (let i = 0; i < offered.length; i++) {
            const item = offered[i];
            const cardX = startX + i * (cardW + gap);
            const cardY = 170;
            const discountPrice = Math.floor(item.price * (1 - discount));
            const canBuy = currentSave.galets >= discountPrice;

            const cardBg = this.add.graphics().setDepth(51);
            cardBg.fillStyle(0x3A2E28, 0.9);
            cardBg.fillRoundedRect(cardX, cardY, cardW, 120, 8);
            cardBg.lineStyle(1, canBuy ? 0xFFD700 : 0x5A4A38, 0.6);
            cardBg.strokeRoundedRect(cardX, cardY, cardW, 120, 8);
            shopElements.push(cardBg);

            // Item icon (if available)
            if (item.icon && this.textures.exists(item.icon)) {
                const tex = this.textures.get(item.icon);
                const isSheet = tex.frameTotal > 2;
                const icon = isSheet
                    ? this.add.sprite(cardX + cardW / 2, cardY + 35, item.icon, 0).setScale(0.7)
                    : this.add.image(cardX + cardW / 2, cardY + 35, item.icon).setScale(1.2);
                icon.setOrigin(0.5).setDepth(52);
                shopElements.push(icon);
            }

            const nameText = this.add.text(cardX + cardW / 2, cardY + 60, I18n.field(item, 'name'), {
                fontFamily: 'monospace', fontSize: '11px', color: '#F5E6D0'
            }).setOrigin(0.5).setDepth(52);
            shopElements.push(nameText);

            const oldPrice = this.add.text(cardX + cardW / 2 - 20, cardY + 78, `${item.price}`, {
                fontFamily: 'monospace', fontSize: '11px', color: '#9E9E8E'
            }).setOrigin(0.5).setDepth(52);
            shopElements.push(oldPrice);

            const newPrice = this.add.text(cardX + cardW / 2 + 20, cardY + 78, `${discountPrice}`, {
                fontFamily: 'monospace', fontSize: '14px', color: '#FFD700'
            }).setOrigin(0.5).setDepth(52);
            shopElements.push(newPrice);

            if (canBuy) {
                const buyBtn = this.add.text(cardX + cardW / 2, cardY + 100, I18n.t('shop.buy'), {
                    fontFamily: 'monospace', fontSize: '12px', color: '#F5E6D0',
                    backgroundColor: '#6B8E4E', padding: { x: 8, y: 4 }
                }).setOrigin(0.5).setDepth(52).setInteractive({ useHandCursor: true });
                shopElements.push(buyBtn);

                buyBtn.on('pointerdown', () => {
                    const s = loadSave();
                    if (s.galets >= discountPrice) {
                        s.galets -= discountPrice;
                        s.purchases.push(item.id);
                        saveSave(s);
                        buyBtn.setText(I18n.t('shop.owned')).setColor('#44CC44').removeInteractive();
                        currentSave = s;
                        galetsLabel.setText(`${s.galets} Galets`);
                    }
                });
            }
        }

        // PASSER button
        const passBtn = this.add.text(cx, 340, I18n.t('arcade.continue'), {
            fontFamily: 'monospace', fontSize: '16px', color: '#9E9E8E',
            backgroundColor: '#3A2E28', padding: { x: 12, y: 6 }
        }).setOrigin(0.5).setDepth(52).setInteractive({ useHandCursor: true });
        shopElements.push(passBtn);

        let shopClosed = false;
        const cleanup = () => {
            if (shopClosed) return;
            shopClosed = true;
            // Remove listeners to prevent leaks into map UI
            this.input.keyboard.off('keydown-SPACE', cleanup);
            this.input.keyboard.off('keydown-ESC', cleanup);
            shopElements.forEach(el => { if (el?.active) el.destroy(); });
            onComplete();
        };
        passBtn.on('pointerdown', cleanup);
        this.input.keyboard.on('keydown-SPACE', cleanup);
        this.input.keyboard.on('keydown-ESC', cleanup);
    }

    // === Phase 5 D3 — Defeat screen ===
    _showDefeatScreen(result) {
        const cx = GAME_WIDTH / 2;

        const bg = this.add.graphics().setDepth(50);
        bg.fillStyle(0x1A1510, 0.9);
        bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        this.add.text(cx, 80, I18n.t('arcade.defeat_title'), {
            fontFamily: 'monospace', fontSize: '28px', color: '#C44B3F',
            shadow: { offsetX: 2, offsetY: 2, color: '#1A1510', blur: 0, fill: true }
        }).setOrigin(0.5).setDepth(51);

        const matchGalets = result.galetsEarned || 0;
        if (matchGalets > 0) {
            this.add.text(cx, 130, I18n.t('arcade.defeat_earned', { galets: matchGalets }), {
                fontFamily: 'monospace', fontSize: '14px', color: '#FFD700'
            }).setOrigin(0.5).setDepth(51);
        }

        if (DEFEAT_CONSOLATION_GALETS > 0) {
            addGalets(DEFEAT_CONSOLATION_GALETS);
            this.add.text(cx, 165, I18n.t('arcade.defeat_consolation', { galets: DEFEAT_CONSOLATION_GALETS }), {
                fontFamily: 'monospace', fontSize: '12px', color: '#D4A574'
            }).setOrigin(0.5).setDepth(51);
        }

        const oppMatch = this.arcadeData.matches[this.currentRound - 2];
        if (oppMatch) {
            const oppChar = this._getCharById(oppMatch.opponent);
            if (oppChar) {
                this.add.text(cx, 210, I18n.field(oppChar, 'name'), {
                    fontFamily: 'monospace', fontSize: '16px', color: '#F5E6D0'
                }).setOrigin(0.5).setDepth(51);
            }
        }

        let retryBtn = null;
        if (DEFEAT_RETRY_ENABLED) {
            retryBtn = this.add.text(cx, 280, I18n.t('arcade.defeat_retry'), {
                fontFamily: 'monospace', fontSize: '18px', color: '#F5E6D0',
                backgroundColor: '#C44B3F', padding: { x: 16, y: 8 }
            }).setOrigin(0.5).setDepth(52).setInteractive({ useHandCursor: true });

            retryBtn.on('pointerdown', () => {
                this.losses = Math.max(0, this.losses - 1);
                const lostIdx = this.matchResults.findIndex(r => !r.won && r.round === this.currentRound - 1);
                if (lostIdx >= 0) this.matchResults.splice(lostIdx, 1);
                this.children.list.filter(c => c.depth >= 50 && c.depth <= 52).forEach(c => c.destroy());
                this._buildProgressScreen();
            });
        }

        const continueBtn = this.add.text(cx, 340, I18n.t('arcade.defeat_continue'), {
            fontFamily: 'monospace', fontSize: '14px', color: '#9E9E8E',
            backgroundColor: '#3A2E28', padding: { x: 14, y: 6 }
        }).setOrigin(0.5).setDepth(52).setInteractive({ useHandCursor: true });

        continueBtn.on('pointerdown', () => {
            this.children.list.filter(c => c.depth >= 50 && c.depth <= 52).forEach(c => c.destroy());
            this._buildProgressScreen();
        });

        this.input.keyboard.on('keydown-SPACE', () => { if (retryBtn) retryBtn.emit('pointerdown'); });
        this.input.keyboard.on('keydown-ESC', () => continueBtn.emit('pointerdown'));
    }

    // === Phase 5 F1 — Milestones check ===
    _checkMilestones() {
        const save = loadSave();
        const milestones = this.arcadeData.milestones || [];
        for (const m of milestones) {
            if (isMilestoneUnlocked(m.id)) continue;
            let unlocked = false;
            if (m.condition === 'arcadeWins >= 1' && this.wins >= 1) unlocked = true;
            if (m.condition === 'arcadeWins >= 3' && this.wins >= 3) unlocked = true;
            if (m.condition === 'arcade_complete' && this.wins >= 5) unlocked = true;
            if (m.condition === 'arcade_perfect' && this.wins >= 5 && this.losses === 0) unlocked = true;
            if (m.condition === 'carreaux >= 1' && (save.cumulativeStats?.carreaux || 0) >= 1) unlocked = true;
            if (m.condition === 'match_fanny') {
                const lastResult = this.matchResults[this.matchResults.length - 1];
                if (lastResult?.won && lastResult?.opponentScore === 0) unlocked = true;
            }
            if (unlocked) {
                const isNew = unlockMilestone(m.id);
                if (isNew) {
                    addGalets(m.reward);
                    this._showMilestonePopup(m);
                }
            }
        }
    }

    _showMilestonePopup(milestone) {
        const cx = GAME_WIDTH / 2;
        const cy = GAME_HEIGHT / 2;
        const overlay = this.add.graphics().setDepth(100);
        overlay.fillStyle(0x1A1510, 0.6);
        overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        const panel = this.add.graphics().setDepth(101);
        panel.fillStyle(0x3A2E28, 0.95);
        panel.fillRoundedRect(cx - 180, cy - 50, 360, 100, 10);
        panel.lineStyle(2, 0xFFD700, 0.6);
        panel.strokeRoundedRect(cx - 180, cy - 50, 360, 100, 10);
        const title = this.add.text(cx, cy - 25, I18n.t('arcade.milestone_unlocked'), {
            fontFamily: 'monospace', fontSize: '14px', color: '#FFD700', shadow: SHADOW
        }).setOrigin(0.5).setDepth(102);
        const name = this.add.text(cx, cy + 5, I18n.field(milestone, 'text'), {
            fontFamily: 'monospace', fontSize: '18px', color: '#F5E6D0', shadow: SHADOW
        }).setOrigin(0.5).setDepth(102);
        const reward = this.add.text(cx, cy + 30, `+${milestone.reward} Galets`, {
            fontFamily: 'monospace', fontSize: '14px', color: '#FFD700'
        }).setOrigin(0.5).setDepth(102);

        this.time.delayedCall(3000, () => {
            this.tweens.add({
                targets: [overlay, panel, title, name, reward],
                alpha: 0, duration: 500,
                onComplete: () => {
                    overlay.destroy(); panel.destroy(); title.destroy();
                    name.destroy(); reward.destroy();
                }
            });
        });
    }

    _shutdown() {
        this.input.keyboard.removeAllListeners();
        if (this._mapTooltip) { this._mapTooltip.destroy(); this._mapTooltip = null; }
        this.tweens.killAll();
    }
}
