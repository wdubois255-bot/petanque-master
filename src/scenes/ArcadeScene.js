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
                fadeToScene(this, 'TitleScene');
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

        // Restore arcade progress from save on fresh entry (no match just played)
        const save = loadSave();
        if (this.currentRound === 1 && !this.lastMatchResult) {
            const savedProgress = save.arcadeProgress || 0;
            if (savedProgress > 0) {
                this.currentRound = savedProgress + 1;
                this.wins = savedProgress;
                this.matchResults = Array.from({ length: savedProgress }, (_, i) => ({ round: i + 1, won: true }));
            }
        }

        // Show intro narrative on very first Arcade session (never seen before)
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

        // Check if arcade is complete (either by wins count or saved progress)
        const totalMatches = this.arcadeData.matches.length;
        if (this.wins >= totalMatches || this.currentRound > totalMatches || (save.arcadeProgress || 0) >= totalMatches) {
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
                .setDisplaySize(GAME_WIDTH - 20, GAME_HEIGHT - 30).setAlpha(0);
            this.tweens.add({ targets: parch, alpha: 0.65, duration: 800, ease: 'Sine.easeOut' });
        }

        const lineObjects = [];
        const lineSpacing = 28;
        const startY = GAME_HEIGHT / 2 - (lines.length * lineSpacing) / 2 + 12;

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

        // Round indicator (centered top)
        this.add.text(GAME_WIDTH / 2, 14, I18n.t('arcade.round', { n: this.currentRound, total: matches.length }), {
            fontFamily: 'monospace', fontSize: '11px', color: '#F5E6D0', shadow: SHADOW
        }).setOrigin(0.5, 0).setDepth(6);

        // === DIRT PATH between nodes ===
        const NODE_POSITIONS = [
            { x: 130, y: 145 }, { x: 270, y: 115 }, { x: 416, y: 105 },
            { x: 560, y: 120 }, { x: 700, y: 150 }
        ];

        const pathG = this.add.graphics().setDepth(2);
        for (let i = 0; i < NODE_POSITIONS.length - 1; i++) {
            const a = NODE_POSITIONS[i];
            const b = NODE_POSITIONS[i + 1];
            const segWon = this.matchResults.some(r => r.round === i + 1 && r.won);
            // Shadow under path
            pathG.lineStyle(10, 0x3A2E28, 0.15);
            pathG.beginPath(); pathG.moveTo(a.x, a.y + 3); pathG.lineTo(b.x, b.y + 3); pathG.strokePath();
            // Main dirt path
            pathG.lineStyle(6, segWon ? 0xA08050 : 0x6B5530, 0.55);
            pathG.beginPath(); pathG.moveTo(a.x, a.y); pathG.lineTo(b.x, b.y); pathG.strokePath();
            // Center highlight
            pathG.lineStyle(2, segWon ? 0xD4A574 : 0x8B6B3A, 0.3);
            pathG.beginPath(); pathG.moveTo(a.x, a.y); pathG.lineTo(b.x, b.y); pathG.strokePath();
        }

        // === CHARACTER PORTRAIT NODES ===
        for (let i = 0; i < matches.length; i++) {
            const pos = NODE_POSITIONS[i];
            const match = matches[i];
            const result = this.matchResults.find(r => r.round === i + 1);
            const isCurrent = (i + 1 === this.currentRound);
            const oppChar = this._getCharById(match.opponent);
            const spriteKey = oppChar ? this._getSpriteKey(oppChar) : null;

            const nodeG = this.add.graphics().setDepth(3);
            const R = isCurrent ? 24 : 20; // node radius

            // Wood platform under every node (shadow + base + rim)
            nodeG.fillStyle(0x3A2E28, 0.4);
            nodeG.fillEllipse(pos.x, pos.y + R + 4, R * 2.2, 8); // drop shadow
            nodeG.fillStyle(0x5A4030, 0.85);
            nodeG.fillCircle(pos.x, pos.y, R);
            nodeG.lineStyle(2, 0x8B6B3A, 0.7);
            nodeG.strokeCircle(pos.x, pos.y, R);

            if (result && result.won) {
                // WON: green outer ring + desaturated portrait + checkmark
                nodeG.lineStyle(3, 0x44CC44, 0.9);
                nodeG.strokeCircle(pos.x, pos.y, R + 2);

                if (spriteKey && this.textures.exists(spriteKey)) {
                    this.add.sprite(pos.x, pos.y - 2, spriteKey, 0)
                        .setScale(0.4).setOrigin(0.5).setDepth(4).setTint(0x999999);
                }
                this.add.text(pos.x + 14, pos.y - 14, '\u2713', {
                    fontFamily: 'monospace', fontSize: '14px', color: '#44CC44',
                    shadow: { offsetX: 1, offsetY: 1, color: '#1A1510', blur: 0, fill: true }
                }).setOrigin(0.5).setDepth(5);

                // Stars
                const stars = save.starRatings?.[match.opponent] || 0;
                for (let s = 0; s < 3; s++) {
                    this.add.text(pos.x - 12 + s * 12, pos.y + R + 12, '\u2605', {
                        fontFamily: 'monospace', fontSize: `${MAP_STAR_SIZE}px`,
                        color: s < stars ? '#FFD700' : '#5A4A38'
                    }).setOrigin(0.5).setDepth(4);
                }

            } else if (isCurrent) {
                // CURRENT: gold outer glow ring + full-color portrait + pulse
                nodeG.lineStyle(3, 0xFFD700, 1);
                nodeG.strokeCircle(pos.x, pos.y, R + 2);
                // Outer glow ring (second, wider)
                const glowRing = this.add.graphics().setDepth(3);
                glowRing.lineStyle(2, 0xFFD700, 0.3);
                glowRing.strokeCircle(pos.x, pos.y, R + 6);
                this.tweens.add({
                    targets: glowRing, alpha: 0.1,
                    duration: MAP_NODE_PULSE_DURATION, yoyo: true, repeat: -1
                });

                if (spriteKey && this.textures.exists(spriteKey)) {
                    const spr = this.add.sprite(pos.x, pos.y - 2, spriteKey, 0)
                        .setScale(0.45).setOrigin(0.5).setDepth(4);
                    this.tweens.add({
                        targets: spr, y: pos.y - 5, duration: 700,
                        yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
                    });
                }
                // Name in gold chip
                const nameChip = this.add.graphics().setDepth(4);
                const name = oppChar ? I18n.field(oppChar, 'name') : '???';
                nameChip.fillStyle(0x1A1510, 0.6);
                nameChip.fillRoundedRect(pos.x - 40, pos.y + R + 6, 80, 16, 4);
                this.add.text(pos.x, pos.y + R + 14, name, {
                    fontFamily: 'monospace', fontSize: '9px', color: '#FFD700',
                    shadow: { offsetX: 1, offsetY: 1, color: '#1A1510', blur: 0, fill: true }
                }).setOrigin(0.5).setDepth(5);

            } else {
                // FUTURE: mysterious fog node — no spoiler, builds anticipation
                // Fog circle fill (layered for depth)
                nodeG.fillStyle(0x3A2E28, 0.7);
                nodeG.fillCircle(pos.x, pos.y, R);
                nodeG.fillStyle(0x5A4A38, 0.3);
                nodeG.fillCircle(pos.x, pos.y, R - 4);
                nodeG.lineStyle(1, 0x8B6B3A, 0.25);
                nodeG.strokeCircle(pos.x, pos.y, R + 1);

                // Stylized "?" — mystery, not locked
                const q = this.add.text(pos.x, pos.y - 1, '?', {
                    fontFamily: 'monospace', fontSize: '20px', color: '#D4A574',
                    shadow: { offsetX: 1, offsetY: 1, color: '#1A1510', blur: 0, fill: true }
                }).setOrigin(0.5).setDepth(5).setAlpha(0.7);
                // Subtle breathing effect
                this.tweens.add({
                    targets: q, alpha: 0.4,
                    duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
                });
            }

            // Terrain name under each node (on dark chip for readability)
            const terrain = this._getTerrainById(match.terrain);
            const tName = terrain ? I18n.field(terrain, 'name') : match.terrain;
            const tY = pos.y + R + (isCurrent ? 24 : (result?.won ? 26 : 14));
            this.add.text(pos.x, tY, tName, {
                fontFamily: 'monospace', fontSize: '9px', color: '#D4A574',
                shadow: { offsetX: 1, offsetY: 1, color: '#1A1510', blur: 0, fill: true }
            }).setOrigin(0.5).setDepth(4);
        }

        // === ROOKIE SPRITE on the map (at current node) ===
        const rookieIdx = Math.min(this.currentRound - 1, NODE_POSITIONS.length - 1);
        const rookiePos = NODE_POSITIONS[rookieIdx];
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

        // === PREVIEW PANEL (bottom section — full width, generous height) ===
        const panelY = 250;
        const panelH = GAME_HEIGHT - panelY; // fills to bottom
        const nextOpponent = this._getCharById(nextMatch.opponent);
        const nextTerrain = this._getTerrainById(nextMatch.terrain);

        // Full-width dark panel with top border
        const panelBg = this.add.graphics().setDepth(5);
        const terrainTints = { village: 0x3A2E28, parc: 0x2A3A28, colline: 0x3A3228, docks: 0x2A2A30, plage: 0x3A3428 };
        const panelTint = terrainTints[nextMatch.terrain] || 0x3A2E28;
        panelBg.fillStyle(panelTint, 0.95);
        panelBg.fillRoundedRect(16, panelY, GAME_WIDTH - 32, panelH - 8, 10);
        panelBg.lineStyle(2, 0xD4A574, 0.35);
        panelBg.strokeRoundedRect(16, panelY, GAME_WIDTH - 32, panelH - 8, 10);
        // Inner highlight line at top
        panelBg.lineStyle(1, 0xFFD700, 0.15);
        panelBg.beginPath();
        panelBg.moveTo(30, panelY + 1);
        panelBg.lineTo(GAME_WIDTH - 30, panelY + 1);
        panelBg.strokePath();

        if (nextOpponent) {
            // Layout: [Sprite | Info + Stats | Button]
            const spriteX = 110;
            const infoX = 210;
            const btnX = GAME_WIDTH - 140;

            // "PROCHAIN COMBAT" header (left-aligned)
            this.add.text(infoX, panelY + 12, I18n.t('arcade.next_fight'), {
                fontFamily: 'monospace', fontSize: '10px', color: '#FFD700', shadow: SHADOW
            }).setDepth(6);

            // Opponent sprite (left)
            const spriteKey = this._getSpriteKey(nextOpponent);
            if (spriteKey && this.textures.exists(spriteKey)) {
                // Shadow
                this.add.ellipse(spriteX, panelY + panelH - 30, 60, 10, 0x1A1510, 0.3).setDepth(5);
                const oppSpr = this.add.sprite(spriteX, panelY + panelH / 2 + 10, spriteKey, 0)
                    .setScale(1.5).setOrigin(0.5).setDepth(6);
                this.tweens.add({
                    targets: oppSpr, scaleY: 1.53, scaleX: 1.47,
                    duration: 2500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
                });
            }

            // Name + title + catchphrase
            this.add.text(infoX, panelY + 30, I18n.field(nextOpponent, 'name').toUpperCase(), {
                fontFamily: 'monospace', fontSize: '22px', color: '#F5E6D0', shadow: SHADOW
            }).setDepth(6);
            this.add.text(infoX, panelY + 58, I18n.field(nextOpponent, 'title'), {
                fontFamily: 'monospace', fontSize: '11px', color: '#D4A574', shadow: SHADOW
            }).setDepth(6);
            this.add.text(infoX, panelY + 78, `"${I18n.field(nextOpponent, 'catchphrase')}"`, {
                fontFamily: 'monospace', fontSize: '10px', color: '#9E9E8E', shadow: SHADOW,
                fontStyle: 'italic', wordWrap: { width: 350 }
            }).setDepth(6);

            // Terrain + difficulty (inline)
            const metaY = panelY + 102;
            if (nextTerrain) {
                this.add.text(infoX, metaY, I18n.t('arcade.terrain_label', { name: I18n.field(nextTerrain, 'name') }), {
                    fontFamily: 'monospace', fontSize: '11px', color: '#D4A574', shadow: SHADOW
                }).setDepth(6);
            }
            this.add.text(infoX + 220, metaY, I18n.t('arcade.difficulty', { level: I18n.field(nextMatch, 'difficulty_label') }), {
                fontFamily: 'monospace', fontSize: '11px', color: '#D4A574', shadow: SHADOW
            }).setDepth(6);

            // Comparative stat bars (2 rows of 2 for clarity)
            const statNames = ['precision', 'puissance', 'effet', 'sang_froid'];
            const statLabels = ['PREC', 'PUIS', 'EFFT', 'S-FR'];
            const playerStats = this.playerCharacter?.stats || {};
            const barW = 80;
            const barG = this.add.graphics().setDepth(6);
            const barStartX = infoX;
            const barStartY = panelY + 125;

            // Legend
            this.add.text(barStartX + 36, barStartY - 2, I18n.t('ingame.you'), {
                fontFamily: 'monospace', fontSize: '7px', color: '#87CEEB'
            }).setDepth(6);
            this.add.text(barStartX + 64, barStartY - 2, I18n.t('ingame.opponent'), {
                fontFamily: 'monospace', fontSize: '7px', color: '#C44B3F'
            }).setDepth(6);

            for (let i = 0; i < statNames.length; i++) {
                const col = i % 2;
                const row = Math.floor(i / 2);
                const sx = barStartX + col * 180;
                const sy = barStartY + 10 + row * 24;
                const pVal = playerStats[statNames[i]] || 5;
                const oVal = nextOpponent.stats[statNames[i]] || 5;

                this.add.text(sx, sy, statLabels[i], {
                    fontFamily: 'monospace', fontSize: '9px', color: '#9E9E8E'
                }).setDepth(6);
                barG.fillStyle(0x1A1510, 0.7);
                barG.fillRoundedRect(sx + 32, sy, barW, 5, 2);
                barG.fillRoundedRect(sx + 32, sy + 8, barW, 5, 2);
                barG.fillStyle(0x87CEEB, 0.85);
                barG.fillRoundedRect(sx + 32, sy, Math.max(2, (pVal / 10) * barW), 5, 2);
                barG.fillStyle(0xC44B3F, 0.85);
                barG.fillRoundedRect(sx + 32, sy + 8, Math.max(2, (oVal / 10) * barW), 5, 2);
            }

            // COMBATTRE button (integrated right side of panel)
            const btnW = 180;
            const btnH = 50;
            const btnYPos = panelY + panelH / 2 - btnH / 2 + 10;
            const btnBg = this.add.graphics().setDepth(6);
            btnBg.fillStyle(0xC44B3F, 1);
            btnBg.fillRoundedRect(btnX - btnW / 2, btnYPos, btnW, btnH, 8);
            btnBg.lineStyle(2, 0xE86050, 0.5);
            btnBg.strokeRoundedRect(btnX - btnW / 2, btnYPos, btnW, btnH, 8);
            // Highlight top edge
            btnBg.lineStyle(1, 0xFFFFFF, 0.15);
            btnBg.beginPath();
            btnBg.moveTo(btnX - btnW / 2 + 10, btnYPos + 1);
            btnBg.lineTo(btnX + btnW / 2 - 10, btnYPos + 1);
            btnBg.strokePath();

            const btnText = this.add.text(btnX, btnYPos + btnH / 2, I18n.t('arcade.fight_btn'), {
                fontFamily: 'monospace', fontSize: '20px', color: '#FFFFFF',
                shadow: { offsetX: 2, offsetY: 2, color: '#1A1510', blur: 0, fill: true }
            }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(7);

            btnText.on('pointerover', () => { btnText.setScale(1.03); });
            btnText.on('pointerout', () => { btnText.setScale(1); });
            btnText.on('pointerdown', () => this._launchNextMatch());

            // Controls hint (inside panel, bottom)
            this.add.text(btnX, btnYPos + btnH + 14, I18n.t('arcade.controls'), {
                fontFamily: 'monospace', fontSize: '9px', color: '#8A7A5A', shadow: SHADOW
            }).setOrigin(0.5).setDepth(6);
        }

        // === BOTTOM BUTTONS: QUITTER + RECOMMENCER ===
        const bottomY = GAME_HEIGHT - 20;

        const quitBtn = this.add.text(50, bottomY, I18n.t('arcade.quit'), {
            fontFamily: 'monospace', fontSize: '11px', color: '#9E9E8E',
            backgroundColor: '#3A2E28', padding: { x: 8, y: 4 }, shadow: SHADOW
        }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true }).setDepth(8);
        quitBtn.on('pointerover', () => quitBtn.setColor('#F5E6D0'));
        quitBtn.on('pointerout', () => quitBtn.setColor('#9E9E8E'));
        quitBtn.on('pointerdown', () => fadeToScene(this, 'TitleScene'));

        const restartBtn = this.add.text(140, bottomY, I18n.t('arcade.restart'), {
            fontFamily: 'monospace', fontSize: '11px', color: '#9E9E8E',
            backgroundColor: '#3A2E28', padding: { x: 8, y: 4 }, shadow: SHADOW
        }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true }).setDepth(8);
        restartBtn.on('pointerover', () => restartBtn.setColor('#F5E6D0'));
        restartBtn.on('pointerout', () => restartBtn.setColor('#9E9E8E'));
        restartBtn.on('pointerdown', () => {
            const s = loadSave();
            s.arcadeProgress = 0;
            s.arcadePerfect = false;
            saveSave(s);
            fadeToScene(this, 'ArcadeScene', { playerCharacter: this.playerCharacter });
        });

        this.input.keyboard.on('keydown-SPACE', () => this._launchNextMatch());
        this.input.keyboard.on('keydown-ENTER', () => this._launchNextMatch());
        this.input.keyboard.on('keydown-ESC', () => fadeToScene(this, 'TitleScene'));
    }

    // Provencal landscape background (TitleScene technique + enhancements)
    _drawMapBackground() {
        const bg = this.add.graphics().setDepth(0);

        // Sky gradient: warm provencal blue → golden
        bg.fillGradientStyle(0x5A94C8, 0x5A94C8, 0xE8B868, 0xE8B868, 1);
        bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT * 0.55);

        // Ground: warm ocre → deep brown
        bg.fillGradientStyle(0xC4954A, 0xC4954A, 0x8B6030, 0x8B6030, 1);
        bg.fillRect(0, GAME_HEIGHT * 0.55, GAME_WIDTH, GAME_HEIGHT * 0.45);

        // Soft sun glow (upper-right)
        const sunX = GAME_WIDTH * 0.78;
        const sunY = GAME_HEIGHT * 0.12;
        for (let r = 150; r > 0; r -= 3) {
            bg.fillStyle(0xFFE8A0, 0.005 + (150 - r) * 0.00025);
            bg.fillCircle(sunX, sunY, r);
        }

        // Diagonal light rays from sun (animated)
        const rays = this.add.graphics().setDepth(1);
        for (let i = 0; i < 6; i++) {
            const angle = -0.8 + i * 0.28;
            const length = 400;
            rays.fillStyle(0xFFE8A0, 0.012);
            rays.beginPath();
            rays.moveTo(sunX, sunY);
            rays.lineTo(sunX + Math.cos(angle) * length, sunY + Math.sin(angle) * length);
            rays.lineTo(sunX + Math.cos(angle + 0.05) * length, sunY + Math.sin(angle + 0.05) * length);
            rays.closePath();
            rays.fillPath();
        }
        this.tweens.add({
            targets: rays, alpha: 0.4, duration: 3000,
            yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
        });

        // 3 layered distant hills
        const hillLayers = [
            { color: 0x7BA0B8, alpha: 0.25, baseY: 195, freq: 0.003, amp: 20 },
            { color: 0x8BAA78, alpha: 0.35, baseY: 212, freq: 0.006, amp: 16 },
            { color: 0x9B9060, alpha: 0.5, baseY: 228, freq: 0.009, amp: 12 }
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

        // Subtle texture grain on ground
        for (let i = 0; i < 100; i++) {
            const gx = Phaser.Math.Between(0, GAME_WIDTH);
            const gy = Phaser.Math.Between(GAME_HEIGHT * 0.45, GAME_HEIGHT);
            bg.fillStyle(0xFFFFFF, Phaser.Math.FloatBetween(0.01, 0.04));
            bg.fillRect(gx, gy, 1, 1);
        }

        // Golden dust particles (floating, like TitleScene)
        this._dustParticles = UIFactory.createDustParticles(this, 25, { depth: 2 });

        // Dark bottom gradient for panel readability
        const panelFade = this.add.graphics().setDepth(1);
        panelFade.fillGradientStyle(0x1A1510, 0x1A1510, 0x1A1510, 0x1A1510, 0, 0, 0.88, 0.88);
        panelFade.fillRect(0, GAME_HEIGHT * 0.48, GAME_WIDTH, GAME_HEIGHT * 0.52);

        // Vignette (frame effect)
        const vig = this.add.graphics().setDepth(1);
        vig.fillGradientStyle(0x1A1510, 0x1A1510, 0x1A1510, 0x1A1510, 0.35, 0.35, 0, 0);
        vig.fillRect(0, 0, GAME_WIDTH, 50);
        vig.fillGradientStyle(0x1A1510, 0x1A1510, 0x1A1510, 0x1A1510, 0.25, 0, 0.25, 0);
        vig.fillRect(0, 0, 70, GAME_HEIGHT);
        vig.fillGradientStyle(0x1A1510, 0x1A1510, 0x1A1510, 0x1A1510, 0, 0.25, 0, 0.25);
        vig.fillRect(GAME_WIDTH - 70, 0, 70, GAME_HEIGHT);
    }

    _drawMapDecorations() {
        // Olive trees placed to NOT overlap nodes (between them, behind them)
        const decorSprites = [
            { key: 'grid_olive', x: 55, y: 170, scale: 0.65, frame: 0 },
            { key: 'grid_olive', x: 195, y: 90, scale: 0.55, frame: 4 },
            { key: 'grid_olive', x: 480, y: 80, scale: 0.6, frame: 1 },
            { key: 'grid_olive', x: 635, y: 105, scale: 0.5, frame: 5 },
            { key: 'grid_olive', x: 790, y: 155, scale: 0.6, frame: 8 },
        ];

        for (const d of decorSprites) {
            if (this.textures.exists(d.key)) {
                const img = this.add.image(d.x, d.y, d.key, d.frame)
                    .setScale(d.scale).setDepth(2).setAlpha(0.55);
                // Gentle sway
                this.tweens.add({
                    targets: img, x: img.x + 1, angle: 0.2,
                    duration: 3500 + Math.random() * 2000,
                    yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
                    delay: Math.random() * 2000
                });
            }
        }

        // Ground pebbles along path for texture
        const deco = this.add.graphics().setDepth(2);
        for (let i = 0; i < 30; i++) {
            const px = Phaser.Math.Between(100, 740);
            const py = Phaser.Math.Between(120, 185);
            deco.fillStyle(Phaser.Math.Between(0, 1) ? 0x8B6B3A : 0x6B5530,
                Phaser.Math.FloatBetween(0.1, 0.25));
            deco.fillCircle(px, py, Phaser.Math.Between(1, 2));
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
        this.add.text(GAME_WIDTH / 2, 100, I18n.t('arcade.complete'), {
            fontFamily: 'monospace', fontSize: '48px', color: '#FFD700',
            align: 'center', lineSpacing: 4,
            shadow: { offsetX: 4, offsetY: 4, color: '#1A1510', blur: 0, fill: true }
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2, 200, I18n.t('arcade.wins_label', { wins: this.wins, total: this.wins + this.losses }), {
            fontFamily: 'monospace', fontSize: '20px', color: '#F5E6D0', shadow: SHADOW
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2, 240, `Champion : ${I18n.field(this.playerCharacter, 'name')}`, {
            fontFamily: 'monospace', fontSize: '18px', color: '#D4A574', shadow: SHADOW
        }).setOrigin(0.5);

        // Perfect run badge
        if (this._isPerfect) {
            this.add.text(GAME_WIDTH / 2, 270, I18n.t('arcade.perfect'), {
                fontFamily: 'monospace', fontSize: '22px', color: '#FFD700', shadow: SHADOW
            }).setOrigin(0.5);
        }

        this.add.text(GAME_WIDTH / 2, 300, I18n.t('arcade.champion'), {
            fontFamily: 'monospace', fontSize: '20px', color: '#C44B3F', shadow: SHADOW
        }).setOrigin(0.5);

        // Galets bonus display
        const bonusLabel = this._isPerfect ? I18n.t('arcade.bonus_perfect') : I18n.t('arcade.bonus_complete');
        this.add.text(GAME_WIDTH / 2, 335, `+${this._completionGalets} Galets (${bonusLabel})`, {
            fontFamily: 'monospace', fontSize: '16px', color: '#FFD700', shadow: SHADOW
        }).setOrigin(0.5);

        // Buttons — replay + menu
        const replayBtn = this.add.text(GAME_WIDTH / 2, 380, `[ ${I18n.t('arcade.replay')} ]`, {
            fontFamily: 'monospace', fontSize: '20px', color: '#F5E6D0',
            backgroundColor: '#6B8E4E', padding: { x: 16, y: 8 }, shadow: SHADOW
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        const menuBtn = this.add.text(GAME_WIDTH / 2, 430, `[ ${I18n.t('arcade.menu')} ]`, {
            fontFamily: 'monospace', fontSize: '16px', color: '#F5E6D0',
            backgroundColor: '#C44B3F', padding: { x: 16, y: 6 }, shadow: SHADOW
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        replayBtn.on('pointerdown', () => {
            // Reset arcade progress so it starts fresh
            const s = loadSave();
            s.arcadeProgress = 0;
            s.arcadePerfect = false;
            saveSave(s);
            fadeToScene(this, 'ArcadeScene', { playerCharacter: this.playerCharacter });
        });
        menuBtn.on('pointerdown', () => fadeToScene(this, 'TitleScene'));
        this.input.keyboard.on('keydown-SPACE', () => replayBtn.emit('pointerdown'));
        this.input.keyboard.on('keydown-ESC', () => fadeToScene(this, 'TitleScene'));
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

    update(time, delta) {
        // Animate golden dust particles
        if (this._dustParticles) {
            UIFactory.updateParticles(this._dustParticles, delta);
        }
    }

    _shutdown() {
        this._dustParticles = null;
        this.input.keyboard.removeAllListeners();
        if (this._mapTooltip) { this._mapTooltip.destroy(); this._mapTooltip = null; }
        this.tweens.killAll();
    }
}
