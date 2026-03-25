import Phaser from 'phaser';
import {
    GAME_WIDTH, GAME_HEIGHT,
    TERRAIN_WIDTH, TERRAIN_HEIGHT,
    TERRAIN_COLORS, TERRAIN_FRICTION,
    COLORS, THROW_CIRCLE_RADIUS, THROW_CIRCLE_Y_OFFSET,
    CHAR_SPRITE_MAP, CHAR_THROW_MAP, CHAR_STATIC_SPRITES,
    BARK_PROBABILITY, PAUSE_KEY,
    MOMENTUM_INDICATOR_FIRE_COLOR, MOMENTUM_INDICATOR_TILT_COLOR,
    MOMENTUM_INDICATOR_THRESHOLD, MOMENTUM_INDICATOR_ALPHA, MOMENTUM_INDICATOR_RADIUS,
    PRESSURE_INDICATOR_COLOR, PRESSURE_WOBBLE_AMPLITUDE, PRESSURE_WOBBLE_SPEED,
    CHALLENGE_BANNER_DURATION, CHALLENGE_REWARD_GALETS, CHALLENGE_PROBABILITY,
    CROWD_INTENSITY_BY_ROUND, COMMENTATOR_COOLDOWN,
    FOCUS_CHARGES_PER_MATCH
} from '../utils/Constants.js';
import PetanqueEngine from '../petanque/PetanqueEngine.js';
import AimingSystem from '../petanque/AimingSystem.js';
import PetanqueAI from '../petanque/PetanqueAI.js';
import ScorePanel from '../ui/ScorePanel.js';
import TerrainRenderer from '../petanque/TerrainRenderer.js';
import { generateCharacterSprite, PALETTES } from '../world/SpriteGenerator.js';
import { setSoundScene, startTerrainAmbiance, stopTerrainAmbiance, startCrowdAmbiance, stopCrowdAmbiance, startMusic, stopMusic, stopRollingSound, setMusicVolume, setMasterVolume, setMusicTension, sfxCrowdApplause, sfxCrowdCheer, sfxCrowdGroan, sfxCrowdGasp, sfxCrowdBoo, sfxCrowdOoh, sfxUIClick, sfxUIHover, toggleMute, getAudioSettings } from '../utils/SoundManager.js';
import { loadSave, saveSave, addGalets } from '../utils/SaveManager.js';
import InGameTutorial from '../ui/InGameTutorial.js';
import Commentator from '../petanque/Commentator.js';
import PortalSDK from '../utils/PortalSDK.js';
import { fadeToScene } from '../utils/SceneTransition.js';
import I18n from '../utils/I18n.js';

export default class PetanqueScene extends Phaser.Scene {
    constructor() {
        super('PetanqueScene');
    }

    init(data) {
        this.terrainType = data.terrain || 'terre';
        this.difficulty = data.difficulty || 'easy';
        this.format = data.format || 'tete_a_tete';
        this.opponentName = data.opponentName || 'Adversaire';
        this.returnScene = data.returnScene || null;
        this.personality = data.personality || null;
        this.playerCharacter = data.playerCharacter || null;
        this.opponentCharacter = data.opponentCharacter || null;
        this.playerCharId = this.playerCharacter?.id || data.playerCharId || 'rookie';
        this.opponentId = this.opponentCharacter?.id || data.opponentId?.replace('char_', '')?.replace('quickplay_', '') || null;
        this.arcadeState = data.arcadeState || null;
        this.arcadeRound = data.arcadeRound || null;
        this.localMultiplayer = data.localMultiplayer || false;
        this.bouleType = data.bouleType || 'acier';
        this.cochonnetType = data.cochonnetType || 'classique';
        this.postMatchWin = data.postMatchWin || null;
        this.postMatchLose = data.postMatchLose || null;
        this.unlocksOnWin = data.unlocksOnWin || null;
        // Pause menu state (reset on each scene init — CLAUDE.md rule)
        this._gamePaused = false;
        this._pauseContainer = null;
        // Game over watchdog (reset on each scene init)
        this._gameOverWatchdogStart = 0;
        this._watchdogFired = false;
        // Phase 5 — Momentum indicator
        this._momentumGlow = null;
        this._momentumLabel = null;
        this._momentumShakeTween = null;
        this._lastMomentumValue = null;
        // Phase 5 — Pressure indicator
        this._pressureActive = false;
        this._pressureBadge = null;
        this._pressureText = null;
        // Phase 5 — Mene challenges
        this._currentChallenge = null;
        this._challengeCompleted = false;
        this._challengeBanner = null;
        this._challengePool = null;
        // Phase 5 — Match galets tracking
        this._matchGaletsEarned = 0;
        // Phase 5 — Golden zone
        this._goldenZone = null;
        this._goldenZoneActive = false;
        // Phase 5 — Match challenge
        this._matchChallenge = null;
        this._matchChallengePanel = null;
    }

    create() {
        // Notifier le portail que le gameplay commence (no-op en standalone)
        PortalSDK.gameplayStart();

        // Reset camera state (previous scene may have faded out)
        this.cameras.main.setAlpha(1);
        this.cameras.main.resetFX();

        // Load full terrain data - support both terrain IDs and surface types
        const terrainsJson = this.cache.json.get('terrains');
        let terrainData = terrainsJson?.stages?.find(s => s.id === this.terrainType);
        if (!terrainData) {
            const surfaceToTerrain = { terre: 'village', herbe: 'parc', sable: 'plage', dalles: 'docks' };
            const terrainId = surfaceToTerrain[this.terrainType] || 'village';
            terrainData = terrainsJson?.stages?.find(s => s.id === terrainId) || null;
        }
        this.terrainFullData = terrainData;
        // Use surface type for friction lookup
        const surfaceType = terrainData?.surface || this.terrainType;
        this.frictionMult = TERRAIN_FRICTION[surfaceType] || 1.0;

        this.terrainX = (GAME_WIDTH - TERRAIN_WIDTH) / 2;
        this.terrainY = (GAME_HEIGHT - TERRAIN_HEIGHT) / 2;

        // Render terrain with TerrainRenderer (textures, borders, decor, dead lines)
        this.terrainRenderer = new TerrainRenderer(
            this, surfaceType, this.terrainFullData, this.terrainX, this.terrainY
        );
        this.terrainRenderer.render();

        // Throw circle (draw on top of terrain)
        this.throwCircleX = GAME_WIDTH / 2;
        this.throwCircleY = this.terrainY + TERRAIN_HEIGHT - THROW_CIRCLE_Y_OFFSET;
        const circleG = this.add.graphics().setDepth(4);
        // Outer glow
        circleG.lineStyle(4, COLORS.OCRE, 0.2);
        circleG.strokeCircle(this.throwCircleX, this.throwCircleY, THROW_CIRCLE_RADIUS + 3);
        // Main circle
        circleG.lineStyle(2, COLORS.BLANC, 0.6);
        circleG.strokeCircle(this.throwCircleX, this.throwCircleY, THROW_CIRCLE_RADIUS);
        // Inner dot
        circleG.fillStyle(COLORS.BLANC, 0.3);
        circleG.fillCircle(this.throwCircleX, this.throwCircleY, 2);

        this._createBallTextures();
        this._ensureSprites();

        // Engine
        this.engine = new PetanqueEngine(this, {
            terrainType: surfaceType,
            frictionMult: this.frictionMult,
            format: this.format,
            terrainData: this.terrainFullData,
            terrainBounds: {
                x: this.terrainX,
                y: this.terrainY,
                w: TERRAIN_WIDTH,
                h: TERRAIN_HEIGHT
            }
        });

        // HORS JEU feedback when a ball goes out of bounds
        this.engine.onBallDead = (x, y) => {
            if (this.terrainRenderer) this.terrainRenderer.showHorsJeu(x, y);
        };

        this._createPlayerSprites();

        // Aiming
        const playerStats = this.playerCharacter?.stats || null;
        this.aimingSystem = new AimingSystem(this, this.engine, playerStats);

        // Focus (Respire) + Character Unique Ability
        const save = loadSave();
        const extraFocus = save.purchases.filter(p => p === 'focus_extra').length;
        this.aimingSystem.resetFocusCharges(FOCUS_CHARGES_PER_MATCH + extraFocus);
        const ability = this._getCharacterAbility(this.playerCharId);
        if (ability) {
            const extraCharge = save.purchases.filter(p => p === 'charge_extra').length;
            ability.charges += extraCharge;
            if (ability.secondary) ability.secondary.charges += extraCharge;
            this.aimingSystem.setCharacterAbility(ability);
        }

        // AI
        if (this.localMultiplayer) {
            this.ai = null;
        } else {
            this.ai = new PetanqueAI(this, this.engine, this.difficulty, this.personality, this.opponentCharacter);
        }

        // Score panel
        this.scorePanel = new ScorePanel(this, this.engine);

        // VS label (fade out after 5s)
        const shadow = { offsetX: 2, offsetY: 2, color: '#1A1510', blur: 0, fill: true };
        const vsLabel = this.add.text(
            GAME_WIDTH / 2, this.terrainY - 12,
            `VS ${this.opponentCharacter ? I18n.field(this.opponentCharacter, 'name') : this.opponentName}`,
            { fontFamily: 'monospace', fontSize: '16px', color: '#D4A574', align: 'center', shadow }
        ).setOrigin(0.5, 1).setDepth(5);
        this.time.delayedCall(5000, () => {
            this.tweens.add({
                targets: vsLabel, alpha: 0, duration: 1000, ease: 'Sine.easeIn',
                onComplete: () => { if (vsLabel.active) vsLabel.destroy(); }
            });
        });

        // Impact traces layer
        this.impactLayer = this.add.renderTexture(
            this.terrainX, this.terrainY,
            TERRAIN_WIDTH, TERRAIN_HEIGHT
        ).setOrigin(0, 0).setDepth(8).setAlpha(0.5);

        // Hook score events for barks + Determination passive
        this.engine.onScore = (scores, winner, points) => {
            this._triggerScoreBark(scores, winner, points);
            // Determination: after losing a mene, boost next throw precision
            if (winner === 'opponent' && ability?.hasDetermination) {
                this.aimingSystem._determinationActive = true;
            }
        };

        // Hook carreau for bark
        const existingCarreau = this.engine._celebrateCarreau.bind(this.engine);
        const self = this;
        const origCelebrateCarreau = this.engine._celebrateCarreau;
        this.engine._celebrateCarreau = function(ball) {
            origCelebrateCarreau.call(this, ball);
            const team = ball.team;
            const other = team === 'player' ? 'opponent' : 'player';
            self._showBark(team, 'carreau');
            // Crowd goes wild on carreau
            sfxCrowdCheer();
            self.time.delayedCall(1200, () => {
                if (Math.random() < 0.5) self._showBark(other, 'opponent_carreau');
            });
        };

        // === COMMENTATEUR (disabled — encombrait l'ecran) ===
        this._commentator = null;

        // Hook score for gameplay indicators (pressure, momentum, challenges)
        const _origOnScore = this.engine.onScore;
        this.engine.onScore = (scores, winner, points) => {
            if (_origOnScore) _origOnScore(scores, winner, points);

            // === Phase 5 B2 — Pressure indicator ===
            if (scores.player >= 10 && scores.opponent >= 10) {
                this._showPressureIndicator();
            }

            // === Phase 5 B1 — Momentum indicator ===
            this._updateMomentumIndicator();

            // === Phase 5 D1 — Mene challenge verification ===
            if (this._currentChallenge && !this._challengeCompleted) {
                const c = this._currentChallenge;
                const ms = this.engine.matchStats;
                let completed = false;
                if (c.stat === 'carreaux' && (ms.carreaux || 0) >= c.target) completed = true;
                if (c.stat === 'meneScore' && winner === 'player' && points >= c.target) completed = true;
                if (c.stat === 'biberons' && (ms.biberons || 0) >= c.target) completed = true;
                if (c.stat === 'onlyRoulette' && winner === 'player' && !ms._usedNonRoulette) completed = true;
                if (completed) {
                    this._challengeCompleted = true;
                    const reward = c.reward || CHALLENGE_REWARD_GALETS;
                    addGalets(reward);
                    this._matchGaletsEarned += reward;
                    this._showChallengeResult(true, reward);
                }
            }

            // === Phase 5 D2 — Max deficit tracking for match challenges ===
            if (!this.engine.matchStats._maxDeficit) this.engine.matchStats._maxDeficit = 0;
            const deficit = scores.opponent - scores.player;
            if (deficit > this.engine.matchStats._maxDeficit) this.engine.matchStats._maxDeficit = deficit;

            // === Phase 5 F3 — Golden zone check ===
            if (this._goldenZoneActive && this._goldenZone) {
                const gz = this._goldenZone;
                const playerBalls = this.engine.getTeamBallsAlive?.('player') || [];
                for (const ball of playerBalls) {
                    const dx = ball.x - gz.x;
                    const dy = ball.y - gz.y;
                    if (Math.sqrt(dx * dx + dy * dy) <= 18) {
                        const reward = 5;
                        addGalets(reward);
                        this._matchGaletsEarned += reward;
                        const bonusTxt = this.add.text(gz.x, gz.y - 20,
                            I18n.t('arcade.golden_zone_bonus', { galets: reward }), {
                                fontFamily: 'monospace', fontSize: '10px', color: '#FFD700',
                                shadow: { offsetX: 1, offsetY: 1, color: '#1A1510', blur: 0, fill: true }
                            }).setOrigin(0.5).setDepth(96);
                        this.tweens.add({ targets: bonusTxt, y: gz.y - 40, alpha: 0, duration: 1500,
                            onComplete: () => bonusTxt.destroy() });
                        break;
                    }
                }
                this._clearGoldenZone();
            }
        };

        setSoundScene(this);
        startTerrainAmbiance(this.terrainFullData?.id || 'village');
        // Phase 5 G1: Progressive crowd intensity per arcade round
        const crowdIntensity = this.arcadeRound
            ? (CROWD_INTENSITY_BY_ROUND[this.arcadeRound - 1] || 0.04)
            : 0.04;
        startCrowdAmbiance(crowdIntensity);
        // Music per terrain (falls back to music_match if terrain-specific doesn't exist)
        const terrainMusicMap = {
            terre: 'music_village', herbe: 'music_parc', sable: 'music_plage',
            dalles: 'music_docks', village: 'music_village', parc: 'music_parc',
            plage: 'music_plage', colline: 'music_colline', docks: 'music_docks'
        };
        const musicKey = terrainMusicMap[this.terrainFullData?.id] || terrainMusicMap[surfaceType] || 'music_match';
        startMusic(musicKey, 0.2);

        // === SLOW-MOTION vignette overlay + zoom-pulse ===
        this._vignetteGraphics = null;
        this._zoomPulseActive = false;
        this.events.on('slowmo-start', () => {
            if (this._vignetteGraphics) return;
            const g = this.add.graphics().setDepth(150).setAlpha(0);
            const w = GAME_WIDTH;
            const h = GAME_HEIGHT;
            // Vignette: concentric bands from edges to center with decreasing opacity
            const bands = 12;
            for (let i = 0; i < bands; i++) {
                const frac = i / bands;
                const nextFrac = (i + 1) / bands;
                const alpha = 0.45 * (1 - frac) * (1 - frac);
                g.fillStyle(0x1A1510, alpha);
                const ix = w * 0.5 * frac * 0.8;
                const iy = h * 0.5 * frac * 0.8;
                const nix = w * 0.5 * nextFrac * 0.8;
                const niy = h * 0.5 * nextFrac * 0.8;
                // Top band
                g.fillRect(ix, iy, w - ix * 2, niy - iy);
                // Bottom band
                g.fillRect(ix, h - niy, w - ix * 2, niy - iy);
                // Left band
                g.fillRect(ix, niy, nix - ix, h - niy * 2);
                // Right band
                g.fillRect(w - nix, niy, nix - ix, h - niy * 2);
            }
            this._vignetteGraphics = g;
            this.tweens.add({
                targets: g,
                alpha: 1,
                duration: 200,
                ease: 'Sine.easeIn'
            });

            // Zoom-pulse: brief 1.1x zoom centered on cochonnet (no camera pan)
            if (this.engine?.cochonnet && !this._zoomPulseActive) {
                this._zoomPulseActive = true;
                const cam = this.cameras.main;
                const cx = this.engine.cochonnet.x;
                const cy = this.engine.cochonnet.y;
                // Set scroll to center zoom on cochonnet area
                cam.centerOn(GAME_WIDTH / 2, GAME_HEIGHT / 2);
                this.tweens.add({
                    targets: cam,
                    zoom: 1.1,
                    duration: 200,
                    ease: 'Sine.easeOut'
                });
            }
        });

        this.events.on('slowmo-end', () => {
            if (!this._vignetteGraphics) return;
            const g = this._vignetteGraphics;
            this._vignetteGraphics = null;
            this.tweens.add({
                targets: g,
                alpha: 0,
                duration: 300,
                ease: 'Sine.easeOut',
                onComplete: () => g.destroy()
            });

            // Zoom back to 1.0
            if (this._zoomPulseActive) {
                this._zoomPulseActive = false;
                this.tweens.add({
                    targets: this.cameras.main,
                    zoom: 1.0,
                    duration: 300,
                    ease: 'Sine.easeOut'
                });
            }
        });

        // === DRAMATIC PAUSE: lower music volume temporarily ===
        this.events.on('dramatic-pause', () => {
            setMusicVolume(0.02); // drop to ~10% (from 0.2 base)
            this.time.delayedCall(1500, () => {
                setMusicVolume(0.2); // restore
            });
        });

        // Iris wipe opening (circle expands from center)
        this._playIrisOpen();

        this.engine.startGame();

        // === ARCADE BADGE "Match X/Y" (top-left, aligned with score panel) ===
        if (this.arcadeRound) {
            const arcadeData = this.cache.json.get('arcade');
            const totalMatches = arcadeData?.matches?.length ?? '?';
            const badgeText = `Match ${this.arcadeRound}/${totalMatches}`;
            const badgeW = badgeText.length * 7 + 16;
            const badgeH = 22;
            const badgeX = 6;
            const badgeY = 6;
            const badgeBg = this.add.graphics().setDepth(92).setAlpha(0);
            badgeBg.fillStyle(0x3A2E28, 0.85);
            badgeBg.fillRoundedRect(badgeX, badgeY, badgeW, badgeH, 4);
            badgeBg.lineStyle(1, 0xD4A574, 0.3);
            badgeBg.strokeRoundedRect(badgeX, badgeY, badgeW, badgeH, 4);
            const badgeLabel = this.add.text(badgeX + badgeW / 2, badgeY + badgeH / 2, badgeText, {
                fontFamily: 'monospace', fontSize: '11px', color: '#D4A574',
                shadow: { offsetX: 1, offsetY: 1, color: '#1A1510', blur: 0, fill: true }
            }).setOrigin(0.5).setDepth(92).setAlpha(0);
            // Fade in
            this.tweens.add({ targets: [badgeBg, badgeLabel], alpha: 1, duration: 400, delay: 500 });
        }

        // === Phase 5 — Mene challenges (arcade only) ===
        if (this.arcadeState) {
            const arcadeData = this.cache.json.get('arcade');
            this._challengePool = arcadeData?.mene_challenges || [];

            // Match challenge — persistent panel on the right side
            const matchChallenges = arcadeData?.match_challenges || [];
            if (matchChallenges.length > 0) {
                this._matchChallenge = matchChallenges[Math.floor(Math.random() * matchChallenges.length)];
                const cName = I18n.field(this._matchChallenge, 'name');
                const cDesc = I18n.field(this._matchChallenge, 'description');
                const cReward = this._matchChallenge.reward || CHALLENGE_REWARD_GALETS;
                this._matchChallengePanel = this._createChallengePanel(cName, cDesc, cReward);
            }
        }

        // In-game tutorial — 3 phases (VISER, LOFT, SCORE), persistées via tutorialPhasesDone
        const tutSave = loadSave();
        const phasesDone = tutSave.tutorialPhasesDone || [];
        if (phasesDone.length < 3) {
            this._inGameTutorial = new InGameTutorial(this);
        }

        // Contextual terrain tooltips (one-shot per terrain, for ALL players)
        {
            const terrainId = this.terrainFullData?.id || 'village';
            const terrainHints = {
                plage: { id: 'hint_plage', msg: I18n.t('terrain_hints.plage') },
                parc: { id: 'hint_parc', msg: I18n.t('terrain_hints.parc') },
                colline: { id: 'hint_colline', msg: I18n.t('terrain_hints.colline') },
                docks: { id: 'hint_docks', msg: I18n.t('terrain_hints.docks') }
            };
            const hint = terrainHints[terrainId];
            if (hint) {
                this.time.delayedCall(2000, () => {
                    InGameTutorial.showContextualHint(this, hint.id, hint.msg);
                });
            }
        }

        // Music tension crossfade when score >= 10
        this.events.on('match-tension', (tense) => setMusicTension(tense));

        // === Phase 5 — Commentator sequencer (avoid overlap with challenge banners) ===
        this._commentatorBusy = false;
        this._safeCommentatorSay = (category) => {
            if (this._commentatorBusy || !this._commentator) return;
            this._commentatorBusy = true;
            this._commentator.say(category);
            this.time.delayedCall(COMMENTATOR_COOLDOWN, () => { this._commentatorBusy = false; });
        };

        // === Phase 5 D1 — onMeneStart hook for mene challenges ===
        this.engine.onMeneStart = (meneNumber) => {
            if (!this.arcadeState || !this._challengePool?.length) return;
            if (meneNumber <= 1) return;
            if (Math.random() > CHALLENGE_PROBABILITY) return;
            const challenge = this._challengePool[Math.floor(Math.random() * this._challengePool.length)];
            this._currentChallenge = challenge;
            this._challengeCompleted = false;
            this._showChallengeBanner(I18n.field(challenge, 'text'));
        };

        // === Phase 5 E2 — Commentaire terrain (une seule fois, 2s) ===
        this.time.delayedCall(2000, () => {
            const surface = this.terrainFullData?.surface || this.terrainType;
            if (surface === 'sable') this._safeCommentatorSay('terrain_sable');
            else if (surface === 'dalles') this._safeCommentatorSay('terrain_dalles');
            else if (surface === 'herbe') this._safeCommentatorSay('terrain_herbe');
        });

        // === Phase 5 E2 — Commentaire adversaire (une seule fois, 6s) ===
        this.time.delayedCall(6000, () => {
            const arch = this.opponentCharacter?.archetype;
            if (arch === 'tireur') this._safeCommentatorSay('adversaire_tireur');
            else if (arch === 'pointeur') this._safeCommentatorSay('adversaire_pointeur');
        });

        // === Phase 5 E2 + F3 — Commentaires de mene + Golden zone (chainer avec onMeneStart) ===
        const _origMeneStart = this.engine.onMeneStart;
        this.engine.onMeneStart = (meneNumber) => {
            if (_origMeneStart) _origMeneStart(meneNumber);
            if (meneNumber === 2) this._safeCommentatorSay?.('mene_debut_2');
            if (meneNumber === 5) this._safeCommentatorSay?.('mene_debut_5');
            // Phase 5 F3: Golden zone (30% chance, mene 2+, arcade only)
            if (this.arcadeState && meneNumber >= 2 && Math.random() < 0.3) {
                this._spawnGoldenZone();
            }
        };

        // Pause button (top-left corner) + touche P
        this._createPauseButton();

        this.events.on('shutdown', this._shutdown, this);
    }

    // === Phase 5 F3 — Golden zone ===
    _spawnGoldenZone() {
        this._clearGoldenZone();
        const x = Phaser.Math.Between(this.terrainX + 30, this.terrainX + TERRAIN_WIDTH - 30);
        const y = Phaser.Math.Between(this.terrainY + 30, this.terrainY + TERRAIN_HEIGHT / 2);
        const gfx = this.add.graphics().setDepth(5);
        gfx.fillStyle(0xFFD700, 0.25);
        gfx.fillCircle(x, y, 18);
        gfx.lineStyle(1, 0xFFD700, 0.5);
        gfx.strokeCircle(x, y, 18);
        this.tweens.add({
            targets: gfx, alpha: 0.12,
            duration: 1000, yoyo: true, repeat: -1
        });
        this._goldenZone = { x, y, gfx };
        this._goldenZoneActive = true;
    }

    _clearGoldenZone() {
        if (this._goldenZone?.gfx) { this._goldenZone.gfx.destroy(); }
        this._goldenZone = null;
        this._goldenZoneActive = false;
    }

    // === Phase 5 B1 — Momentum indicator ===
    _updateMomentumIndicator() {
        if (!this.ai || !this.opponentSprite) return;
        const m = this.ai._momentum;
        const rounded = Math.round(m * 10);
        if (rounded === this._lastMomentumValue) return;
        this._lastMomentumValue = rounded;

        if (Math.abs(m) < MOMENTUM_INDICATOR_THRESHOLD) {
            if (this._momentumGlow) { this._momentumGlow.destroy(); this._momentumGlow = null; }
            if (this._momentumLabel) { this._momentumLabel.destroy(); this._momentumLabel = null; }
            if (this._momentumShakeTween) { this._momentumShakeTween.destroy(); this._momentumShakeTween = null; }
            return;
        }

        const isFire = m > 0;
        const color = isFire ? MOMENTUM_INDICATOR_FIRE_COLOR : MOMENTUM_INDICATOR_TILT_COLOR;
        const intensity = Math.min(1, (Math.abs(m) - MOMENTUM_INDICATOR_THRESHOLD) / (1 - MOMENTUM_INDICATOR_THRESHOLD));

        if (!this._momentumGlow) {
            this._momentumGlow = this.add.graphics().setDepth(45);
        }
        this._momentumGlow.clear();
        this._momentumGlow.fillStyle(color, MOMENTUM_INDICATOR_ALPHA * intensity);
        this._momentumGlow.fillCircle(
            this.opponentSprite.x, this.opponentSprite.y,
            MOMENTUM_INDICATOR_RADIUS + intensity * 8
        );

        const labelText = isFire
            ? I18n.t('arcade.momentum_fire')
            : I18n.t('arcade.momentum_tilt');
        if (!this._momentumLabel) {
            this._momentumLabel = this.add.text(0, 0, '', {
                fontFamily: 'monospace', fontSize: '8px',
                color: isFire ? '#FF6644' : '#6688CC',
                shadow: { offsetX: 1, offsetY: 1, color: '#1A1510', blur: 0, fill: true }
            }).setOrigin(0.5).setDepth(46);
        }
        this._momentumLabel.setText(labelText);
        this._momentumLabel.setColor(isFire ? '#FF6644' : '#6688CC');
        this._momentumLabel.setPosition(this.opponentSprite.x, this.opponentSprite.y - 28);

        if (isFire && intensity > 0.5 && !this._momentumShakeTween) {
            this._momentumShakeTween = this.tweens.add({
                targets: this.opponentSprite,
                x: this.opponentSprite.x + 1, duration: 80,
                yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
            });
        }
        if ((!isFire || intensity <= 0.5) && this._momentumShakeTween) {
            this._momentumShakeTween.destroy();
            this._momentumShakeTween = null;
        }
    }

    // === Phase 5 B2 — Pressure indicator (dramatic) ===
    _showPressureIndicator() {
        if (this._pressureActive) return;
        this._pressureActive = true;

        const cx = GAME_WIDTH / 2;
        const y = 18;

        // Dramatic vignette overlay (subtle darkening)
        this._pressureVignette = this.add.graphics().setDepth(3);
        this._pressureVignette.fillStyle(0x1A1510, 0);
        // Top vignette
        this._pressureVignette.fillGradientStyle(0x1A1510, 0x1A1510, 0x1A1510, 0x1A1510, 0.25, 0.25, 0, 0);
        this._pressureVignette.fillRect(0, 0, GAME_WIDTH, 80);
        // Bottom vignette
        this._pressureVignette.fillGradientStyle(0x1A1510, 0x1A1510, 0x1A1510, 0x1A1510, 0, 0, 0.25, 0.25);
        this._pressureVignette.fillRect(0, GAME_HEIGHT - 80, GAME_WIDTH, 80);
        this._pressureVignette.setAlpha(0);
        this.tweens.add({ targets: this._pressureVignette, alpha: 1, duration: 800 });

        // Badge
        this._pressureBadge = this.add.graphics().setDepth(92);
        this._pressureBadge.fillStyle(PRESSURE_INDICATOR_COLOR, 0.85);
        this._pressureBadge.fillRoundedRect(cx - 50, y - 8, 100, 18, 4);

        this._pressureText = this.add.text(cx, y + 1, I18n.t('arcade.pressure_warning'), {
            fontFamily: 'monospace', fontSize: '10px', color: '#FFD700',
            shadow: { offsetX: 1, offsetY: 1, color: '#1A1510', blur: 0, fill: true }
        }).setOrigin(0.5).setDepth(93);

        this.tweens.add({
            targets: [this._pressureBadge, this._pressureText],
            x: '+=' + PRESSURE_WOBBLE_AMPLITUDE,
            duration: PRESSURE_WOBBLE_SPEED,
            yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
        });

        // Dramatic flash + music tension
        this.cameras.main.flash(200, 196, 75, 63);
        setMusicTension(true);

        // One-shot commentator reaction
        if (this._commentator) {
            this._commentator.say('pression', true);
        }
    }

    // === Challenge panel (persistent, right side) ===
    _createChallengePanel(name, description, reward) {
        const px = GAME_WIDTH - 148;
        const py = 62;
        const pw = 142;
        const ph = 52;

        const container = this.add.container(px + pw / 2, py + ph / 2).setDepth(92).setAlpha(0);

        const bg = this.add.graphics();
        bg.fillStyle(0x3A2E28, 0.85);
        bg.fillRoundedRect(-pw / 2, -ph / 2, pw, ph, 4);
        bg.lineStyle(1, 0xFFD700, 0.4);
        bg.strokeRoundedRect(-pw / 2, -ph / 2, pw, ph, 4);
        container.add(bg);

        const header = this.add.text(0, -ph / 2 + 8, I18n.t('arcade.challenge_label') || 'DEFI', {
            fontFamily: 'monospace', fontSize: '9px', color: '#FFD700',
            shadow: { offsetX: 1, offsetY: 1, color: '#1A1510', blur: 0, fill: true }
        }).setOrigin(0.5);
        container.add(header);

        const desc = this.add.text(0, 2, description || name, {
            fontFamily: 'monospace', fontSize: '8px', color: '#F5E6D0',
            wordWrap: { width: pw - 12 }, align: 'center',
            lineSpacing: 1
        }).setOrigin(0.5);
        container.add(desc);

        const rewardTxt = this.add.text(0, ph / 2 - 8, `+${reward} Galets`, {
            fontFamily: 'monospace', fontSize: '8px', color: '#D4A574'
        }).setOrigin(0.5);
        container.add(rewardTxt);

        // Slide in from right
        container.x += pw;
        this.tweens.add({
            targets: container, x: px + pw / 2, alpha: 1,
            duration: 500, delay: 2000, ease: 'Back.easeOut'
        });

        return container;
    }

    // === Phase 5 D1 — Mene challenge banner (right side, below match challenge) ===
    _showChallengeBanner(text) {
        if (this._challengeBanner) { this._challengeBanner.destroy(); this._challengeBanner = null; }

        const bx = GAME_WIDTH - 148 + 71; // aligned with challenge panel
        const y = 124;

        const container = this.add.container(bx, y).setDepth(95).setAlpha(0);

        const bg = this.add.graphics();
        bg.fillStyle(0x3A2E28, 0.9);
        bg.fillRoundedRect(-71, -14, 142, 28, 4);
        bg.lineStyle(1, 0xFFD700, 0.5);
        bg.strokeRoundedRect(-71, -14, 142, 28, 4);
        container.add(bg);

        const label = this.add.text(0, 0, text, {
            fontFamily: 'monospace', fontSize: '9px', color: '#FFD700',
            wordWrap: { width: 130 }, align: 'center',
            shadow: { offsetX: 1, offsetY: 1, color: '#1A1510', blur: 0, fill: true }
        }).setOrigin(0.5);
        container.add(label);

        this._challengeBanner = container;

        this.tweens.add({
            targets: container, alpha: 1, duration: 300, ease: 'Sine.easeOut',
            onComplete: () => {
                this.time.delayedCall(CHALLENGE_BANNER_DURATION, () => {
                    if (container.active) {
                        this.tweens.add({
                            targets: container, alpha: 0, duration: 400,
                            onComplete: () => { if (container.active) container.destroy(); }
                        });
                    }
                });
            }
        });

        if (this._commentator) this._commentator.say('defi', true);
    }

    // === Phase 5 D1 — Challenge result display ===
    _showChallengeResult(success, galets) {
        const text = success
            ? I18n.t('arcade.challenge_complete', { galets })
            : I18n.t('arcade.challenge_failed');
        const color = success ? '#FFD700' : '#C44B3F';
        const resultTxt = this.add.text(GAME_WIDTH / 2, 75, text, {
            fontFamily: 'monospace', fontSize: '12px', color,
            shadow: { offsetX: 1, offsetY: 1, color: '#1A1510', blur: 0, fill: true }
        }).setOrigin(0.5).setDepth(96).setAlpha(0);
        this.tweens.add({
            targets: resultTxt, alpha: 1, duration: 300,
            onComplete: () => {
                this.time.delayedCall(2000, () => {
                    if (resultTxt.active) this.tweens.add({
                        targets: resultTxt, alpha: 0, duration: 400,
                        onComplete: () => { if (resultTxt.active) resultTxt.destroy(); }
                    });
                });
            }
        });
    }

    _shutdown() {
        // Notifier le portail que le gameplay s'arrête (no-op en standalone)
        PortalSDK.gameplayStop();

        try {
            if (this._pauseContainer) { this._pauseContainer.destroy(true); this._pauseContainer = null; }
            this._gamePaused = false;
            if (this.input?.keyboard) this.input.keyboard.removeAllListeners();
            if (this.input) this.input.removeAllListeners();
            stopTerrainAmbiance();
            stopCrowdAmbiance();
            stopMusic();
            stopRollingSound();
            if (this._commentator) { this._commentator.destroy(); this._commentator = null; }
            if (this._vignetteGraphics) { this._vignetteGraphics.destroy(); this._vignetteGraphics = null; }
            if (this.cameras?.main) this.cameras.main.setZoom(1.0); // Reset zoom-pulse
            if (this._barkBubble) { this._barkBubble.destroy(); this._barkBubble = null; }
            if (this._barkText) { this._barkText.destroy(); this._barkText = null; }
            if (this._activeThrowSprite) { this._activeThrowSprite.destroy(); this._activeThrowSprite = null; }
            if (this._inGameTutorial) { this._inGameTutorial.destroy(); this._inGameTutorial = null; }
            if (this.aimingSystem) this.aimingSystem.destroy();
            if (this.scorePanel) this.scorePanel.destroy();
            if (this.engine?.renderer) this.engine.renderer.destroy();
            // Phase 5 cleanup
            if (this._momentumGlow) { this._momentumGlow.destroy(); this._momentumGlow = null; }
            if (this._momentumLabel) { this._momentumLabel.destroy(); this._momentumLabel = null; }
            if (this._momentumShakeTween) { this._momentumShakeTween.destroy(); this._momentumShakeTween = null; }
            if (this._pressureBadge) { this._pressureBadge.destroy(); this._pressureBadge = null; }
            if (this._pressureText) { this._pressureText.destroy(); this._pressureText = null; }
            if (this._challengeBanner) { this._challengeBanner.destroy(); this._challengeBanner = null; }
            if (this._matchChallengePanel) { this._matchChallengePanel.destroy(true); this._matchChallengePanel = null; }
            if (this._playerHalo) { this._playerHalo.destroy(); this._playerHalo = null; }
            if (this._opponentHalo) { this._opponentHalo.destroy(); this._opponentHalo = null; }
            this._clearGoldenZone();
            if (this.tweens) this.tweens.killAll();
        } catch (e) {
            // Shutdown must never crash — Phaser 4 RC6 may destroy subsystems before this runs
        }
    }

    _checkTutorial() {
        const save = loadSave();
        if (save.tutorialSeen) return;

        this._showTutorialStep(0);
    }

    _showTutorialStep(step) {
        const steps = [
            {
                text: 'BIENVENUE !\n\nVous devez lancer le cochonnet\n(la petite boule jaune).\n\nGlissez et relachez pour viser.',
                y: GAME_HEIGHT / 2
            },
            {
                text: 'OBJECTIF :\nPlacez vos boules le plus pres\npossible du cochonnet.\n\nL\'equipe la plus loin rejoue.',
                y: GAME_HEIGHT / 2
            },
            {
                text: 'TECHNIQUES :\n\nRouler = Roulette (basse)\nDemi-hauteur = Demi-portee\nHaut = Plombee (arretez court)\n\nAppuyez sur R pour changer.',
                y: GAME_HEIGHT / 2
            },
            {
                text: 'SCORE :\nChaque boule plus proche\ndu cochonnet que la meilleure\nadverse rapporte 1 point.\n\nPremier a 13 gagne !',
                y: GAME_HEIGHT / 2
            }
        ];

        if (step >= steps.length) {
            const tutSave = loadSave();
            tutSave.tutorialSeen = true;
            saveSave(tutSave);
            return;
        }

        const s = steps[step];
        const overlay = this.add.graphics().setDepth(200);
        overlay.fillStyle(0x1A1510, 0.75);
        overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        const txt = this.add.text(GAME_WIDTH / 2, s.y, s.text, {
            fontFamily: 'monospace', fontSize: '14px', color: '#F5E6D0',
            align: 'center', lineSpacing: 4,
            shadow: { offsetX: 2, offsetY: 2, color: '#1A1510', blur: 0, fill: true }
        }).setOrigin(0.5).setDepth(201);

        const hint = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 40, `(${step + 1}/${steps.length}) Cliquez pour continuer`, {
            fontFamily: 'monospace', fontSize: '11px', color: '#9E9E8E',
            shadow: { offsetX: 1, offsetY: 1, color: '#1A1510', blur: 0, fill: true }
        }).setOrigin(0.5).setDepth(201);

        const dismiss = () => {
            overlay.destroy();
            txt.destroy();
            hint.destroy();
            this._showTutorialStep(step + 1);
        };

        this.input.once('pointerdown', dismiss);
        this.input.keyboard.once('keydown-SPACE', dismiss);
    }

    // === CHARACTER UNIQUE ABILITIES ===

    _getCharacterAbility(charId) {
        const ABILITIES = {
            'ley': {
                id: 'carreau_instinct',
                name: 'Carreau Instinct',
                charges: 1,
                description: 'Tir: ejection 50% plus puissante'
                // Effect: applied in PetanqueEngine when a ball-ball collision happens
            },
            'la_choupe': {
                id: 'coup_de_canon',
                name: 'Coup de Canon',
                charges: 2,
                description: 'Puissance +30%, precision -20%'
                // Effect: modifies power and wobble for this throw
            },
            'foyot': {
                id: 'lecture_terrain',
                name: 'Lecture du Terrain',
                charges: 2,
                description: 'Affiche la trajectoire complete pendant 3s'
            },
            'mamie_josette': {
                id: 'vieux_renard',
                name: 'Vieux Renard',
                charges: 3,
                description: 'Annule le tremblement de pression'
            },
            'rocher': {
                id: 'le_mur',
                name: 'Le Mur',
                charges: 2,
                description: 'Boule 2x plus large pour bloquer'
            }
        };

        if (charId === 'rookie') {
            const save = loadSave();
            const unlocked = save.rookie?.abilitiesUnlocked || [];
            const hasInstinct = unlocked.includes('instinct');
            const hasNaturel = unlocked.includes('naturel');
            const hasDetermination = unlocked.includes('determination');

            // Determination is passive — handled separately via _determinationActive flag
            // Return the highest-priority active ability
            if (hasInstinct && hasNaturel) {
                // Both unlocked: return instinct as primary, naturel as secondary
                return {
                    id: 'instinct',
                    name: "L'Instinct",
                    charges: 1,
                    description: 'Ralentit le temps pendant 2s',
                    secondary: {
                        id: 'naturel',
                        name: 'Le Naturel',
                        charges: 1,
                        description: 'Supprime le wobble pour ce lancer'
                    },
                    hasDetermination
                };
            } else if (hasInstinct) {
                return { id: 'instinct', name: "L'Instinct", charges: 1, description: 'Ralentit le temps pendant 2s', hasDetermination };
            } else if (hasNaturel) {
                return { id: 'naturel', name: 'Le Naturel', charges: 1, description: 'Supprime le wobble pour ce lancer', hasDetermination };
            } else if (hasDetermination) {
                // Only determination (passive) — no active ability button, but flag it
                return { id: 'determination_only', name: 'Determination', charges: 0, description: 'Passif: precision accrue apres mene perdue', hasDetermination: true };
            }
            return null;
        }

        return ABILITIES[charId] || null;
    }

    // === SPRITE LOADING (real spritesheets or procedural fallback) ===

    _getCharSpriteKey(charId) {
        return CHAR_SPRITE_MAP[charId] || 'ley_animated';
    }

    _getCharPalette(charId) {
        // All v2 characters use the same player palette for procedural fallback
        return PALETTES.player;
    }

    _ensureSprites() {
        // Player sprite — always recreate to match selected character
        if (this.textures.exists('petanque_player')) {
            this.textures.remove('petanque_player');
        }
        const playerKey = this._getCharSpriteKey(this.playerCharId);
        const playerIsStatic = CHAR_STATIC_SPRITES.includes(this.playerCharId);
        if (this.textures.exists(playerKey)) {
            const src = this.textures.get(playerKey).getSourceImage();
            if (playerIsStatic) {
                // Static image: create a 1-frame spritesheet from the image
                this.textures.addSpriteSheet('petanque_player', src,
                    { frameWidth: src.width, frameHeight: src.height }
                );
            } else {
                // Canvas textures (V2 characters): copy to new canvas + add frames manually
                // (Phaser 4 addSpriteSheet doesn't reliably handle canvas sources on scene re-entry)
                const w = src.width || 512, h = src.height || 512;
                const canvas = this.textures.createCanvas('petanque_player', w, h);
                canvas.context.imageSmoothingEnabled = false;
                canvas.context.drawImage(src, 0, 0);
                canvas.refresh();
                const tex = this.textures.get('petanque_player');
                for (let i = 0; i < 16; i++) {
                    tex.add(i, 0, (i % 4) * 128, Math.floor(i / 4) * 128, 128, 128);
                }
            }
            this.textures.get('petanque_player').setFilter(Phaser.Textures.FilterMode.LINEAR);
        } else {
            generateCharacterSprite(this, 'petanque_player', this._getCharPalette(this.playerCharId));
        }

        // Opponent sprite — always recreate for different opponents
        if (this.textures.exists('petanque_opponent')) {
            this.textures.remove('petanque_opponent');
        }
        const opponentId = this.opponentId || 'ley';
        const opponentKey = this._getCharSpriteKey(opponentId);
        const opponentIsStatic = CHAR_STATIC_SPRITES.includes(opponentId);
        if (this.textures.exists(opponentKey)) {
            const src = this.textures.get(opponentKey).getSourceImage();
            if (opponentIsStatic) {
                this.textures.addSpriteSheet('petanque_opponent', src,
                    { frameWidth: src.width, frameHeight: src.height }
                );
            } else {
                const w = src.width || 512, h = src.height || 512;
                const canvas = this.textures.createCanvas('petanque_opponent', w, h);
                canvas.context.imageSmoothingEnabled = false;
                canvas.context.drawImage(src, 0, 0);
                canvas.refresh();
                const tex = this.textures.get('petanque_opponent');
                for (let i = 0; i < 16; i++) {
                    tex.add(i, 0, (i % 4) * 128, Math.floor(i / 4) * 128, 128, 128);
                }
            }
            this.textures.get('petanque_opponent').setFilter(Phaser.Textures.FilterMode.LINEAR);
        } else {
            generateCharacterSprite(this, 'petanque_opponent', this._getCharPalette(opponentId));
        }
    }

    // === PLAYER SPRITES & ANIMATIONS ===

    _createPlayerSprites() {
        // Track which characters are static (single-frame sprites)
        this._playerIsStatic = CHAR_STATIC_SPRITES.includes(this.playerCharId);
        const oppId = this.opponentId?.replace('char_', '')?.replace('quickplay_', '') || '';
        this._opponentIsStatic = CHAR_STATIC_SPRITES.includes(oppId);

        // Character sprite scale: 0.4x (sprites are 128x128, displayed at ~51px — avoids overlap)
        const CHAR_SCALE = 0.65;
        this._charScale = CHAR_SCALE;

        // Throw circle position (where the active thrower stands)
        const circleX = this.throwCircleX;
        const circleY = this.throwCircleY + 20;

        // Watcher positions (where the non-active player stands)
        // Keep close to terrain border; visibility ensured by high depth + halo
        this._playerWatchX = this.terrainX - 30;
        this._playerWatchY = this.terrainY + TERRAIN_HEIGHT * 0.35;
        this._opponentWatchX = this.terrainX + TERRAIN_WIDTH + 30;
        this._opponentWatchY = this.terrainY + 100;

        // Halo behind watchers — ensures visibility against tree foliage
        this._playerHalo = this.add.ellipse(this._playerWatchX, this._playerWatchY, 48, 24, 0xF5E6D0, 0.25)
            .setDepth(19);
        this._opponentHalo = this.add.ellipse(this._opponentWatchX, this._opponentWatchY, 48, 24, 0xF5E6D0, 0.25)
            .setDepth(19);

        // Shared circle position (both players use the same throw circle)
        this._circleX = circleX;
        this._circleY = circleY;

        // Player starts at the circle (first to throw)
        const playerFrame = CHAR_STATIC_SPRITES.includes(this.playerCharId) ? 0 : 12;
        this.playerSprite = this.add.sprite(circleX, circleY, 'petanque_player', playerFrame)
            .setOrigin(0.5, 1).setDepth(20).setScale(CHAR_SCALE);

        // Opponent starts watching from the right
        this.opponentSprite = this.add.sprite(this._opponentWatchX, this._opponentWatchY, 'petanque_opponent', 0)
            .setOrigin(0.5, 1).setDepth(20).setScale(CHAR_SCALE);

        // Turn arrows (follow the active thrower at the circle)
        this.playerTurnArrow = this.add.text(circleX, circleY - 72, '\u25bc', {
            fontFamily: 'monospace', fontSize: '16px', color: '#87CEEB'
        }).setOrigin(0.5).setDepth(21).setVisible(false);

        this.opponentTurnArrow = this.add.text(circleX, circleY - 72, '\u25bc', {
            fontFamily: 'monospace', fontSize: '16px', color: '#C44B3F'
        }).setOrigin(0.5).setDepth(21).setVisible(false);

        this._playerArrowTween = this.tweens.add({
            targets: this.playerTurnArrow,
            y: circleY - 64, duration: 400, yoyo: true, repeat: -1, paused: true
        });
        this._opponentArrowTween = this.tweens.add({
            targets: this.opponentTurnArrow,
            y: circleY - 64, duration: 400, yoyo: true, repeat: -1, paused: true
        });

        // Hook engine events
        const existingTurnChange = this.engine.onTurnChange;
        this.engine.onTurnChange = (team) => {
            if (existingTurnChange) existingTurnChange(team);
            this._updateTurnIndicator(team);
            this._animateToCircle(team);
            // Commentateur : premier lancer (toutes les boules encore en main)
            const rem = this.engine.remaining;
            const bpp = this.engine.ballsPerPlayer;
            if (rem.player === bpp && rem.opponent === bpp) {
                this.time.delayedCall(300, () => this._commentator?.say('premier_lancer'));
            }
        };

        const existingOnThrow = this.engine.onThrow;
        this.engine.onThrow = (team) => {
            if (existingOnThrow) existingOnThrow(team);
            this._animateCharThrow(team);
        };

        const existingAfterStop = this.engine.onAfterStop;
        this.engine.onAfterStop = (lastTeam) => {
            if (existingAfterStop) existingAfterStop(lastTeam);
            this._animateReaction(lastTeam);
            // Commentateur : derniere boule de la mene
            const rem = this.engine.remaining;
            if (rem.player + rem.opponent === 1) {
                this.time.delayedCall(400, () => this._commentator?.say('derniere_boule'));
            }
            // Commentateur : bon point (joueur tres pres du cochonnet)
            if (lastTeam === 'player' && this.engine.lastThrownBall?.isAlive && this.engine.cochonnet?.isAlive) {
                const dist = this.engine.lastThrownBall.distanceTo(this.engine.cochonnet);
                if (dist < 20) this.time.delayedCall(600, () => this._commentator?.say('bon_point'));
                else if (dist < 6) this.time.delayedCall(600, () => this._commentator?.say('tres_pres'));
            }
            // Update AI momentum based on shot quality
            if (lastTeam === 'opponent' && this.ai && this.ai.updateMomentum) {
                const ball = this.engine.lastThrownBall;
                if (ball && ball.isAlive && this.engine.cochonnet?.isAlive) {
                    const dist = ball.distanceTo(this.engine.cochonnet);
                    this.ai.updateMomentum(dist < 40);
                }
            }
        };

        this._updateTurnIndicator('player');
    }

    _updateWatchPositions() {
        // Opponent watcher follows cochonnet Y if alive
        if (this.engine.cochonnet && this.engine.cochonnet.isAlive) {
            this._opponentWatchY = Math.max(this.terrainY + 60,
                Math.min(this.engine.cochonnet.y + 10, this.terrainY + TERRAIN_HEIGHT - 40));
            this._playerWatchY = this._opponentWatchY;
        }
        // Move halos to match watcher positions
        if (this._playerHalo) {
            this._playerHalo.setPosition(this._playerWatchX, this._playerWatchY + 16);
        }
        if (this._opponentHalo) {
            this._opponentHalo.setPosition(this._opponentWatchX, this._opponentWatchY + 16);
        }
    }

    _animateToCircle(team) {
        this._updateWatchPositions();
        const s = this._charScale || 1;

        const thrower = team === 'player' ? this.playerSprite : this.opponentSprite;
        const watcher = team === 'player' ? this.opponentSprite : this.playerSprite;
        const watchX = team === 'player' ? this._opponentWatchX : this._playerWatchX;
        const watchY = team === 'player' ? this._opponentWatchY : this._playerWatchY;

        // CRITICAL: kill ALL tweens + destroy any lingering throw sprites
        this.tweens.getTweensOf(this.playerSprite).forEach(t => t.stop());
        this.tweens.getTweensOf(this.opponentSprite).forEach(t => t.stop());
        if (this._activeThrowSprite) {
            this.tweens.getTweensOf(this._activeThrowSprite).forEach(t => t.stop());
            this._activeThrowSprite.destroy();
            this._activeThrowSprite = null;
        }

        // Reset both sprites to clean, visible state (defensive: alpha + depth)
        this.playerSprite.setVisible(true).setAlpha(1).setDepth(20);
        this.playerSprite.scaleX = s;
        this.playerSprite.scaleY = s;
        this.playerSprite.angle = 0;
        this.opponentSprite.setVisible(true).setAlpha(1).setDepth(20);
        this.opponentSprite.scaleX = s;
        this.opponentSprite.scaleY = s;
        this.opponentSprite.angle = 0;

        // IMMEDIATE: teleport watcher to sideline (no animation = no overlap possible)
        const watcherIsStatic = team === 'player' ? this._opponentIsStatic : this._playerIsStatic;
        const throwerIsStatic = team === 'player' ? this._playerIsStatic : this._opponentIsStatic;
        watcher.x = watchX;
        watcher.y = watchY;
        if (!watcherIsStatic) watcher.setFrame(0); // face south

        // Thrower walks to circle (smooth animation)
        this.tweens.add({
            targets: thrower,
            x: this._circleX, y: this._circleY,
            duration: 400, ease: 'Sine.easeInOut',
            onUpdate: () => {
                if (throwerIsStatic) return;
                const t = Date.now();
                const phase = Math.sin(t / 80 * Math.PI);
                thrower.setFrame(Math.floor(t / 150) % 4);
                thrower.scaleY = s * (1 + phase * 0.04);
                thrower.scaleX = s * (1 - phase * 0.015);
            },
            onComplete: () => {
                if (!throwerIsStatic) thrower.setFrame(12); // face north
                thrower.scaleX = s;
                thrower.scaleY = s;
            }
        });

        // Arrow follows the thrower
        const arrow = team === 'player' ? this.playerTurnArrow : this.opponentTurnArrow;
        this.tweens.getTweensOf(arrow).forEach(t => t.stop());
        this.tweens.add({
            targets: arrow,
            x: this._circleX, y: this._circleY - 72,
            duration: 400
        });
    }

    _animateCharThrow(team) {
        const sprite = team === 'player' ? this.playerSprite : this.opponentSprite;
        const baseY = sprite.y;
        const baseX = sprite.x;
        const s = this._charScale || 1;
        const isStatic = team === 'player' ? this._playerIsStatic : this._opponentIsStatic;
        const idleFrame = isStatic ? 0 : (team === 'player' ? 12 : 0);

        // Kill any existing animations
        this.tweens.getTweensOf(sprite).forEach(t => t.stop());
        sprite.scaleX = s;
        sprite.scaleY = s;
        sprite.angle = 0;

        // Get throw spritesheet for this character
        const charId = team === 'player' ? this.playerCharId : this.opponentId;
        const throwInfo = CHAR_THROW_MAP[charId] || null;
        const hasThrowSprite = throwInfo && this.textures.exists(throwInfo.key);

        if (hasThrowSprite) {
            // === REAL THROW FRAMES ===
            // Destroy previous throw sprite if still alive
            if (this._activeThrowSprite) {
                this.tweens.getTweensOf(this._activeThrowSprite).forEach(t => t.stop());
                this._activeThrowSprite.destroy();
            }
            // Hide main sprite, show throw sprite at same position
            sprite.setVisible(false);
            const throwSprite = this.add.sprite(baseX, baseY, throwInfo.key, 0)
                .setOrigin(0.5, 1).setDepth(20).setScale(s);
            this._activeThrowSprite = throwSprite;
            const nFrames = throwInfo.frames;

            // Hide the last thrown ball during wind-up frames (reveal at release frame)
            // This creates the illusion the character is holding the ball
            const lastBall = this.engine.lastThrownBall;
            const lastBallSprite = lastBall?._sprite;
            if (lastBallSprite) lastBallSprite.setAlpha(0);

            // Timing per frame: idle, wind-up, release, follow-through
            const frameDurations = nFrames === 5
                ? [250, 200, 100, 150, 280]   // 5 frames: idle, wind-up, arm-back, release, follow
                : [280, 220, 120, 300];         // 4 frames: longer wind-up for anticipation

            let currentFrame = 0;
            const advanceFrame = () => {
                if (currentFrame >= nFrames) {
                    // Animation done — destroy throw sprite, show main sprite at idle
                    throwSprite.destroy();
                    if (this._activeThrowSprite === throwSprite) this._activeThrowSprite = null;
                    sprite.setVisible(true).setAlpha(1).setDepth(20);
                    sprite.setFrame(idleFrame);
                    sprite.scaleX = s;
                    sprite.scaleY = s;
                    sprite.x = baseX;
                    sprite.y = baseY;
                    return;
                }

                throwSprite.setFrame(currentFrame);

                // Squash/stretch + movement per phase
                const isRelease = (nFrames === 5 && currentFrame === 3) || (nFrames === 4 && currentFrame === 2);
                const isRecovery = currentFrame === nFrames - 1;

                if (isRelease) {
                    // Release: explosive stretch + white flash + reveal ball
                    this.tweens.add({
                        targets: throwSprite,
                        scaleX: s * 1.15, scaleY: s * 0.88, y: baseY - 10,
                        duration: frameDurations[currentFrame], ease: 'Quad.easeOut',
                        onStart: () => {
                            throwSprite.setTint(0xFFFFFF);
                            this.time.delayedCall(40, () => throwSprite.clearTint());
                            // Reveal the ball at release moment
                            if (lastBallSprite) {
                                this.tweens.add({
                                    targets: lastBallSprite, alpha: 1,
                                    duration: 80, ease: 'Quad.easeOut'
                                });
                            }
                        },
                        onComplete: () => { currentFrame++; advanceFrame(); }
                    });
                } else if (isRecovery) {
                    // Recovery: bounce back to idle position
                    this.tweens.add({
                        targets: throwSprite,
                        scaleX: s, scaleY: s, y: baseY, x: baseX,
                        duration: frameDurations[currentFrame], ease: 'Bounce.easeOut',
                        onComplete: () => { currentFrame++; advanceFrame(); }
                    });
                } else if (currentFrame === 0) {
                    // Idle: slight crouch
                    this.tweens.add({
                        targets: throwSprite,
                        scaleX: s * 0.95, scaleY: s * 1.05, y: baseY + 3,
                        duration: frameDurations[currentFrame], ease: 'Sine.easeOut',
                        onComplete: () => { currentFrame++; advanceFrame(); }
                    });
                } else {
                    // Wind-up / mid-throw: lean
                    this.tweens.add({
                        targets: throwSprite,
                        scaleX: s * 0.9, scaleY: s * 1.08,
                        x: baseX - (team === 'player' ? 3 : -3),
                        duration: frameDurations[currentFrame], ease: 'Sine.easeInOut',
                        onComplete: () => { currentFrame++; advanceFrame(); }
                    });
                }
            };

            advanceFrame();
        } else if (isStatic) {
            // === STATIC SPRITE: squash/stretch only, no frame changes ===
            this.tweens.chain({
                targets: sprite,
                tweens: [
                    { scaleX: s * 0.85, scaleY: s * 1.15, y: baseY + 4,
                      duration: 220, ease: 'Sine.easeOut' },
                    { scaleX: s * 0.9, scaleY: s * 1.1,
                      x: baseX - (team === 'player' ? 4 : -4),
                      duration: 130, ease: 'Quad.easeIn' },
                    { scaleX: s * 1.2, scaleY: s * 0.85, y: baseY - 14,
                      x: baseX + (team === 'player' ? 6 : -6),
                      duration: 80, ease: 'Quad.easeIn',
                      onStart: () => {
                          sprite.setTint(0xFFFFFF);
                          this.time.delayedCall(50, () => sprite.clearTint());
                      } },
                    { scaleX: s, scaleY: s, y: baseY, x: baseX,
                      duration: 280, ease: 'Bounce.easeOut' }
                ],
                onStop: () => {
                    sprite.scaleX = s; sprite.scaleY = s;
                    sprite.x = baseX; sprite.y = baseY; sprite.angle = 0;
                }
            });
        } else {
            // === FALLBACK: squash/stretch + frame animation (animated spritesheets) ===
            const profileFrames = team === 'player' ? [12, 13, 14, 15] : [0, 1, 2, 3];
            sprite.setFrame(profileFrames[0]);
            this.tweens.chain({
                targets: sprite,
                tweens: [
                    { scaleX: s * 0.85, scaleY: s * 1.15, y: baseY + 4,
                      duration: 220, ease: 'Sine.easeOut',
                      onStart: () => sprite.setFrame(profileFrames[1]) },
                    { scaleX: s * 0.9, scaleY: s * 1.1,
                      x: baseX - (team === 'player' ? 4 : -4),
                      duration: 130, ease: 'Quad.easeIn',
                      onStart: () => sprite.setFrame(profileFrames[2]) },
                    { scaleX: s * 1.2, scaleY: s * 0.85, y: baseY - 14,
                      x: baseX + (team === 'player' ? 6 : -6),
                      duration: 80, ease: 'Quad.easeIn',
                      onStart: () => {
                          sprite.setFrame(profileFrames[3]);
                          sprite.setTint(0xFFFFFF);
                          this.time.delayedCall(50, () => sprite.clearTint());
                      } },
                    { scaleX: s, scaleY: s, y: baseY, x: baseX,
                      duration: 280, ease: 'Bounce.easeOut',
                      onComplete: () => sprite.setFrame(idleFrame) }
                ],
                onStop: () => {
                    sprite.setFrame(idleFrame);
                    sprite.scaleX = s; sprite.scaleY = s;
                    sprite.x = baseX; sprite.y = baseY; sprite.angle = 0;
                }
            });
        }
    }

    // === BARKS SYSTEM (contextual character dialogue bubbles) ===

    _showBark(team, barkType) {
        const charData = team === 'player' ? this.playerCharacter : this.opponentCharacter;
        if (!charData?.barks?.[barkType]) return;

        const localizedBarks = I18n.fieldArray(charData, 'barks');
        const barks = localizedBarks?.[barkType] || charData.barks[barkType];
        if (!barks || barks.length === 0) return;
        const text = barks[Math.floor(Math.random() * barks.length)];

        const sprite = team === 'player' ? this.playerSprite : this.opponentSprite;
        if (!sprite) return;

        // Remove previous bark bubble if exists
        if (this._barkBubble) { this._barkBubble.destroy(); this._barkBubble = null; }
        if (this._barkText) { this._barkText.destroy(); this._barkText = null; }

        const bx = sprite.x;
        const by = sprite.y - 80;

        // Bubble background
        const bubble = this.add.graphics().setDepth(100);
        const padding = 8;
        const style = { fontFamily: 'monospace', fontSize: '10px', color: '#1A1510', wordWrap: { width: 140 } };
        const measure = this.add.text(0, 0, text, style).setVisible(false);
        const tw = Math.min(measure.width + padding * 2, 156);
        const th = measure.height + padding * 2;
        measure.destroy();

        bubble.fillStyle(0xF5E6D0, 0.95);
        bubble.fillRoundedRect(bx - tw / 2, by - th / 2, tw, th, 6);
        bubble.lineStyle(1.5, 0x3A2E28, 0.6);
        bubble.strokeRoundedRect(bx - tw / 2, by - th / 2, tw, th, 6);
        // Tail triangle
        bubble.fillStyle(0xF5E6D0, 0.95);
        bubble.fillTriangle(bx - 5, by + th / 2, bx + 5, by + th / 2, bx, by + th / 2 + 8);

        const barkText = this.add.text(bx, by, text, {
            ...style, align: 'center'
        }).setOrigin(0.5).setDepth(101);

        this._barkBubble = bubble;
        this._barkText = barkText;

        // Fade out after 2s
        this.time.delayedCall(2000, () => {
            if (this._barkBubble === bubble) {
                this.tweens.add({
                    targets: [bubble, barkText], alpha: 0, duration: 400,
                    onComplete: () => { bubble.destroy(); barkText.destroy(); }
                });
                this._barkBubble = null;
                this._barkText = null;
            }
        });
    }

    _triggerBark(lastTeam) {
        if (!this.engine.cochonnet || !this.engine.cochonnet.isAlive) return;
        const lastBall = this.engine.lastThrownBall;
        if (!lastBall || !lastBall.isAlive) return;
        const dist = lastBall.distanceTo(this.engine.cochonnet);

        // Decide bark based on shot quality (only ~40% of the time to avoid spam)
        if (Math.random() > 0.4) return;

        const thrower = lastTeam;
        const watcher = lastTeam === 'player' ? 'opponent' : 'player';

        if (dist < 25) {
            this._showBark(thrower, 'good_shot');
        } else if (dist > 90) {
            this._showBark(thrower, 'bad_shot');
            // Watcher may also react
            if (Math.random() < 0.3) {
                this.time.delayedCall(800, () => this._showBark(watcher, 'opponent_bad'));
            }
        } else if (dist < 50) {
            if (Math.random() < 0.2) this._showBark(thrower, 'good_shot');
        }
    }

    _triggerScoreBark(scores, winner, points) {
        if (Math.random() > 0.6) return;
        const loser = winner === 'player' ? 'opponent' : 'player';
        const diff = Math.abs(scores[winner] - scores[loser]);
        const maxScore = Math.max(scores.player, scores.opponent);
        const minScore = Math.min(scores.player, scores.opponent);

        // Pression (10-10+)
        if (scores.player >= 10 && scores.opponent >= 10) {
            this._showBark(winner, 'pressure_tied');
            return;
        }
        // Fanny imminente (12-0)
        if (maxScore >= 12 && minScore === 0) {
            const leadTeam = scores.player > scores.opponent ? 'player' : 'opponent';
            this._showBark(leadTeam, 'fanny_imminent_winning');
            this.time.delayedCall(1200, () => {
                this._showBark(leadTeam === 'player' ? 'opponent' : 'player', 'fanny_imminent_losing');
            });
            return;
        }
        // Domination (8-0+)
        if (diff >= 8 && minScore <= 2) {
            const leadTeam = scores.player > scores.opponent ? 'player' : 'opponent';
            this._showBark(leadTeam, 'dominant_lead');
            return;
        }
        // Comeback (5+ pts remontes)
        if (winner === 'player' && scores.player > scores.opponent && diff >= 5) {
            this._showBark('player', 'comeback_self');
            return;
        }
        if (winner === 'opponent' && scores.opponent > scores.player && diff >= 5) {
            this._showBark('opponent', 'comeback_self');
            this.time.delayedCall(1000, () => this._showBark('player', 'opponent_comeback'));
            return;
        }
        // Fallback existants
        if (scores.player >= 11 || scores.opponent >= 11) {
            this._showBark(winner === 'player' ? 'player' : 'opponent', 'match_point');
        } else if (diff >= 6) {
            this._showBark(winner, 'taking_lead');
        } else if (scores[loser] - scores[winner] >= 6) {
            this._showBark(loser, 'losing_badly');
        }
    }

    _animateReaction(lastTeam) {
        // Trigger contextual bark
        this._triggerBark(lastTeam);

        if (!this.engine.cochonnet || !this.engine.cochonnet.isAlive) return;
        const lastBall = this.engine.lastThrownBall;
        if (!lastBall || !lastBall.isAlive) return;
        const dist = lastBall.distanceTo(this.engine.cochonnet);

        // Crowd audio reactions (Phase 5 G1: progressive probability in arcade)
        const crowdProb = this.arcadeRound
            ? Math.min(0.9, 0.5 + this.arcadeRound * 0.08)
            : 0.6;
        if (Math.random() < crowdProb) {
            if (dist < 25) {
                // Great shot: applause
                this.time.delayedCall(500, () => sfxCrowdApplause());
            } else if (dist > 90) {
                // Terrible shot: groan
                this.time.delayedCall(300, () => sfxCrowdGroan());
            }
        }

        const throwerSprite = lastTeam === 'player' ? this.playerSprite : this.opponentSprite;
        const watcherSprite = lastTeam === 'player' ? this.opponentSprite : this.playerSprite;
        const s = this._charScale || 1;
        const throwerStatic = lastTeam === 'player' ? this._playerIsStatic : this._opponentIsStatic;
        const throwerSouthFrames = lastTeam === 'player' ? [12, 13, 14, 15] : [0, 1, 2, 3];

        // Don't start reaction if a transition is about to happen
        // (prevents visual glitch where reaction plays then immediately transitions)
        if (this.engine.remaining.player === 0 && this.engine.remaining.opponent === 0) return;

        if (dist < 30) {
            // Great shot — thrower celebrates with jump + fist pump
            this.tweens.chain({
                targets: throwerSprite,
                tweens: [
                    {
                        y: throwerSprite.y - 14, scaleX: (this._charScale || 1) * 1.1, scaleY: (this._charScale || 1) * 0.9,
                        duration: 200, ease: 'Quad.easeOut',
                        onStart: () => { if (!throwerStatic) throwerSprite.setFrame(throwerSouthFrames[2]); }
                    },
                    {
                        y: throwerSprite.y, scaleX: this._charScale || 1, scaleY: this._charScale || 1,
                        duration: 250, ease: 'Bounce.easeOut',
                        onStart: () => { if (!throwerStatic) throwerSprite.setFrame(throwerSouthFrames[0]); }
                    }
                ]
            });
            // Watcher shakes head in dismay
            this.tweens.chain({
                targets: watcherSprite,
                tweens: [
                    { angle: -6, duration: 100 },
                    { angle: 6, duration: 100 },
                    { angle: -4, duration: 80 },
                    { angle: 0, duration: 80 }
                ]
            });
        } else if (dist < 60) {
            // Decent shot — small nod
            this.tweens.add({
                targets: throwerSprite,
                y: throwerSprite.y - 4,
                duration: 150, ease: 'Sine.easeOut', yoyo: true
            });
        } else if (dist > 80) {
            // Bad shot — thrower frustrated head shake + slump
            this.tweens.chain({
                targets: throwerSprite,
                tweens: [
                    { scaleY: (this._charScale || 1) * 0.95, duration: 100 },
                    { angle: -5, duration: 80 },
                    { angle: 5, duration: 80 },
                    { angle: 0, scaleY: this._charScale || 1, duration: 120 }
                ]
            });
            // Watcher smiles (subtle bounce)
            this.tweens.add({
                targets: watcherSprite,
                y: watcherSprite.y - 3,
                duration: 200, ease: 'Sine.easeOut', yoyo: true
            });
        }
    }

    _updateTurnIndicator(team) {
        if (team === 'player') {
            this.playerTurnArrow.setVisible(true);
            this._playerArrowTween.resume();
            this.opponentTurnArrow.setVisible(false);
            this._opponentArrowTween.pause();
        } else {
            this.opponentTurnArrow.setVisible(true);
            this._opponentArrowTween.resume();
            this.playerTurnArrow.setVisible(false);
            this._playerArrowTween.pause();
        }
    }

    // === BALL TEXTURES (rolling spritesheets from real PNG sprites) ===

    _createBallTextures() {
        const ROLL_FRAMES = 8;
        const FRAME_SIZE = 64;

        // All ball texture keys that should become rolling spritesheets
        const ballKeys = [
            'ball_acier', 'ball_bronze', 'ball_doree', 'ball_cuivre',
            'ball_noire', 'ball_bleue', 'ball_rouge', 'ball_emeraude',
            'ball_rouille', 'ball_titane', 'ball_lavande', 'ball_ivoire',
            'ball_obsidienne', 'ball_corail', 'ball_sable', 'ball_chrome',
            'ball_opponent',
            'ball_cochonnet', 'ball_cochonnet_bleu', 'ball_cochonnet_vert',
            'ball_cochonnet_rouge', 'ball_cochonnet_jungle', 'ball_cochonnet_multicolor'
        ];

        for (const key of ballKeys) {
            if (!this.textures.exists(key)) continue;

            // Skip if already converted to rolling spritesheet (scene reuse)
            const existingTex = this.textures.get(key);
            if (existingTex.frameTotal > 2) continue;

            try {
                const srcImage = existingTex.getSourceImage();
                if (!srcImage || !srcImage.width) continue; // safety: skip broken textures

                const canvas = document.createElement('canvas');
                canvas.width = FRAME_SIZE * ROLL_FRAMES;
                canvas.height = FRAME_SIZE;
                const ctx = canvas.getContext('2d');
                ctx.imageSmoothingEnabled = false;

                for (let f = 0; f < ROLL_FRAMES; f++) {
                    const cx = f * FRAME_SIZE + FRAME_SIZE / 2;
                    const cy = FRAME_SIZE / 2;
                    const angle = (f / ROLL_FRAMES) * Math.PI * 2;

                    ctx.save();
                    ctx.translate(cx, cy);
                    ctx.rotate(angle);
                    ctx.drawImage(srcImage, -FRAME_SIZE / 2, -FRAME_SIZE / 2, FRAME_SIZE, FRAME_SIZE);
                    ctx.restore();
                }

                this.textures.remove(key);
                this.textures.addSpriteSheet(key, canvas, {
                    frameWidth: FRAME_SIZE,
                    frameHeight: FRAME_SIZE
                });
            } catch (_) {
                // Texture conversion failed — ball will use static image or graphics fallback
            }
        }
    }

    // drawTerrain, _placeTerrainDecor, _drawTerrainBorders, _darkenHex
    // replaced by TerrainRenderer.js

    _createPauseButton() {
        // Bouton ⏸ — coin haut-gauche (le ScorePanel occupe le haut-droit)
        const btnX = 26, btnY = 18;
        const btnW = 28, btnH = 24;

        const gfx = this.add.graphics().setDepth(100);
        const drawNormal = () => {
            gfx.clear();
            gfx.fillStyle(0x1A1510, 0.72);
            gfx.fillRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 5);
            gfx.lineStyle(1, 0xD4A574, 0.6);
            gfx.strokeRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 5);
            gfx.fillStyle(0xD4A574, 0.85);
            gfx.fillRect(btnX - 5, btnY - 5, 3, 10);
            gfx.fillRect(btnX + 2, btnY - 5, 3, 10);
        };
        const drawHover = () => {
            gfx.clear();
            gfx.fillStyle(0x3A2818, 0.95);
            gfx.fillRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 5);
            gfx.lineStyle(1, 0xFFD700, 0.9);
            gfx.strokeRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 5);
            gfx.fillStyle(0xFFD700, 1);
            gfx.fillRect(btnX - 5, btnY - 5, 3, 10);
            gfx.fillRect(btnX + 2, btnY - 5, 3, 10);
        };
        drawNormal();

        const zone = this.add.zone(btnX, btnY, btnW + 8, btnH + 8)
            .setInteractive({ useHandCursor: true })
            .setDepth(100);
        zone.on('pointerover', () => { drawHover(); sfxUIHover(); });
        zone.on('pointerout', () => drawNormal());
        zone.on('pointerup', () => { sfxUIClick(); this._openPauseMenu(); });

        this.input.keyboard.on(`keydown-${PAUSE_KEY}`, () => {
            sfxUIClick();
            if (this._gamePaused) this._closePauseMenu();
            else this._openPauseMenu();
        });
    }

    _openPauseMenu() {
        if (this._gamePaused) return;
        this._gamePaused = true;
        if (this.aimingSystem) this.aimingSystem.cancel();

        const CX = GAME_WIDTH / 2;
        const CY = GAME_HEIGHT / 2;
        const pw = 400, ph = 320;
        const px = CX - pw / 2, py = CY - ph / 2;

        const container = this.add.container(0, 0).setDepth(250);
        this._pauseContainer = container;

        // === Overlay sombre plein écran ===
        const overlay = this.add.graphics();
        overlay.fillStyle(0x1A1510, 0.7);
        overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        container.add(overlay);

        // === Panel principal ===
        const panelGfx = this.add.graphics();
        panelGfx.fillStyle(0x3A2E28, 0.98);
        panelGfx.fillRoundedRect(px, py, pw, ph, 12);
        panelGfx.fillStyle(0x5A3E28, 0.5);
        panelGfx.fillRoundedRect(px, py, pw, 46, { tl: 12, tr: 12, bl: 0, br: 0 });
        panelGfx.lineStyle(2, 0xD4A574, 0.85);
        panelGfx.strokeRoundedRect(px, py, pw, ph, 12);
        container.add(panelGfx);

        // === Titre PAUSE ===
        container.add(this.add.text(CX, py + 24, 'PAUSE', {
            fontFamily: 'monospace', fontSize: '20px', color: '#FFD700',
            shadow: { offsetX: 2, offsetY: 2, color: '#1A1510', blur: 0, fill: true }
        }).setOrigin(0.5));

        // Séparateur haut
        const sep = this.add.graphics();
        sep.lineStyle(1, 0xD4A574, 0.3);
        sep.lineBetween(px + 16, py + 48, px + pw - 16, py + 48);
        container.add(sep);

        // === Rappel des contrôles (colonne gauche) ===
        const controls = [
            'Clic/Drag : Viser et lancer',
            '1-3 : Mode de lancer',
            'T : Tir au fer',
            'F : Focus (slow-mo)',
            'R : Retro | E : Spin',
            'TAB : Classement boules',
        ];
        const ctrlX = px + 16;
        container.add(this.add.text(ctrlX, py + 56, 'CONTROLES', {
            fontFamily: 'monospace', fontSize: '9px', color: '#D4A574'
        }));
        controls.forEach((line, i) => {
            container.add(this.add.text(ctrlX, py + 68 + i * 13, line, {
                fontFamily: 'monospace', fontSize: '9px', color: '#A09080'
            }));
        });

        // Séparateur vertical
        const sepV = this.add.graphics();
        sepV.lineStyle(1, 0xD4A574, 0.2);
        sepV.lineBetween(CX + 4, py + 54, CX + 4, py + ph - 8);
        container.add(sepV);

        // === Colonne droite : volume + boutons ===
        const rx = CX + 16;
        const btnW = pw / 2 - 28, btnH = 30;

        const makeBtn = (label, y, color, hoverColor, borderColor, callback) => {
            const bgCol = Phaser.Display.Color.HexStringToColor(color).color;
            const bgHov = Phaser.Display.Color.HexStringToColor(hoverColor).color;
            const borCol = Phaser.Display.Color.HexStringToColor(borderColor).color;
            const btnGfx = this.add.graphics();
            const drawN = () => {
                btnGfx.clear();
                btnGfx.fillStyle(bgCol, 0.85);
                btnGfx.fillRoundedRect(rx, y - btnH / 2, btnW, btnH, 6);
                btnGfx.lineStyle(1, borCol, 0.7);
                btnGfx.strokeRoundedRect(rx, y - btnH / 2, btnW, btnH, 6);
            };
            const drawH = () => {
                btnGfx.clear();
                btnGfx.fillStyle(bgHov, 1);
                btnGfx.fillRoundedRect(rx, y - btnH / 2, btnW, btnH, 6);
                btnGfx.lineStyle(1, borCol, 1);
                btnGfx.strokeRoundedRect(rx, y - btnH / 2, btnW, btnH, 6);
            };
            drawN();
            const lbl = this.add.text(rx + btnW / 2, y, label, {
                fontFamily: 'monospace', fontSize: '12px', color: '#F5E6D0'
            }).setOrigin(0.5);
            const zone = this.add.zone(rx + btnW / 2, y, btnW, btnH)
                .setInteractive({ useHandCursor: true });
            zone.on('pointerover', () => { drawH(); lbl.setColor('#FFD700'); sfxUIHover(); });
            zone.on('pointerout', () => { drawN(); lbl.setColor('#F5E6D0'); });
            zone.on('pointerup', () => { sfxUIClick(); callback(lbl); });
            container.add([btnGfx, lbl, zone]);
            return lbl;
        };

        // Volume row
        container.add(this.add.text(rx, py + 58, 'VOLUME', {
            fontFamily: 'monospace', fontSize: '9px', color: '#D4A574'
        }));
        const audioSettings = getAudioSettings();
        const muteLbl = this.add.text(rx, py + 78,
            audioSettings.muted ? '[ SON : OFF ]' : '[ SON : ON  ]', {
            fontFamily: 'monospace', fontSize: '10px', color: '#F5E6D0'
        });
        const volBar = this.add.text(rx, py + 92,
            `Vol: ${'█'.repeat(Math.round(audioSettings.masterVolume * 10))}${'░'.repeat(10 - Math.round(audioSettings.masterVolume * 10))}`, {
            fontFamily: 'monospace', fontSize: '9px', color: '#87CEEB'
        });
        container.add([muteLbl, volBar]);

        // Mute button
        makeBtn('Muet ON/OFF', py + 118, '#3A3020', '#5A4A30', '#C4954A', () => {
            toggleMute();
            const s = getAudioSettings();
            muteLbl.setText(s.muted ? '[ SON : OFF ]' : '[ SON : ON  ]');
        });
        // Vol- button
        makeBtn('Volume -', py + 156, '#2A2020', '#4A3030', '#8A6050', () => {
            const s = getAudioSettings();
            const nv = Math.max(0, s.masterVolume - 0.1);
            setMasterVolume(nv);
            volBar.setText(`Vol: ${'█'.repeat(Math.round(nv * 10))}${'░'.repeat(10 - Math.round(nv * 10))}`);
        });
        // Vol+ button
        makeBtn('Volume +', py + 192, '#2A2020', '#4A3030', '#8A6050', () => {
            const s = getAudioSettings();
            const nv = Math.min(1, s.masterVolume + 0.1);
            setMasterVolume(nv);
            volBar.setText(`Vol: ${'█'.repeat(Math.round(nv * 10))}${'░'.repeat(10 - Math.round(nv * 10))}`);
        });

        // Séparateur avant boutons principaux
        const sep2 = this.add.graphics();
        sep2.lineStyle(1, 0xD4A574, 0.2);
        sep2.lineBetween(px + 16, py + ph - 74, px + pw - 16, py + ph - 74);
        container.add(sep2);

        // === Reprendre (vert) ===
        const rpW = pw - 32;
        const rpX = px + 16;
        const rpY = py + ph - 52;
        const rpGfx = this.add.graphics();
        const drawRpN = () => {
            rpGfx.clear();
            rpGfx.fillStyle(0x2A5A2A, 0.9);
            rpGfx.fillRoundedRect(rpX, rpY - 14, rpW, 28, 6);
            rpGfx.lineStyle(1, 0x44CC44, 0.7);
            rpGfx.strokeRoundedRect(rpX, rpY - 14, rpW, 28, 6);
        };
        const drawRpH = () => {
            rpGfx.clear();
            rpGfx.fillStyle(0x3A7A3A, 1);
            rpGfx.fillRoundedRect(rpX, rpY - 14, rpW, 28, 6);
            rpGfx.lineStyle(1, 0x44CC44, 1);
            rpGfx.strokeRoundedRect(rpX, rpY - 14, rpW, 28, 6);
        };
        drawRpN();
        const rpLbl = this.add.text(CX, rpY, '▶  Reprendre', {
            fontFamily: 'monospace', fontSize: '13px', color: '#44FF44'
        }).setOrigin(0.5);
        const rpZone = this.add.zone(CX, rpY, rpW, 28).setInteractive({ useHandCursor: true });
        rpZone.on('pointerover', () => { drawRpH(); sfxUIHover(); });
        rpZone.on('pointerout', drawRpN);
        rpZone.on('pointerup', () => { sfxUIClick(); this._closePauseMenu(); });
        container.add([rpGfx, rpLbl, rpZone]);

        // === Abandonner (rouge) ===
        const abY = py + ph - 18;
        const abGfx = this.add.graphics();
        const drawAbN = () => {
            abGfx.clear();
            abGfx.fillStyle(0x5A1A1A, 0.85);
            abGfx.fillRoundedRect(rpX, abY - 12, rpW, 24, 5);
            abGfx.lineStyle(1, 0xCC4444, 0.6);
            abGfx.strokeRoundedRect(rpX, abY - 12, rpW, 24, 5);
        };
        const drawAbH = () => {
            abGfx.clear();
            abGfx.fillStyle(0x7A2A2A, 1);
            abGfx.fillRoundedRect(rpX, abY - 12, rpW, 24, 5);
            abGfx.lineStyle(1, 0xCC4444, 1);
            abGfx.strokeRoundedRect(rpX, abY - 12, rpW, 24, 5);
        };
        drawAbN();
        const abLbl = this.add.text(CX, abY, '✕  Abandonner', {
            fontFamily: 'monospace', fontSize: '11px', color: '#CC4444'
        }).setOrigin(0.5);
        const abZone = this.add.zone(CX, abY, rpW, 24).setInteractive({ useHandCursor: true });
        abZone.on('pointerover', () => { drawAbH(); sfxUIHover(); });
        abZone.on('pointerout', drawAbN);
        abZone.on('pointerup', () => {
            sfxUIClick();
            this._showAbandonConfirm(container);
        });
        container.add([abGfx, abLbl, abZone]);
    }

    _showAbandonConfirm(pauseContainer) {
        // Overlay de confirmation par-dessus le menu pause
        const CX = GAME_WIDTH / 2;
        const CY = GAME_HEIGHT / 2;
        const cw = 280, ch = 100;
        const cx = CX - cw / 2, cy = CY - ch / 2;

        const confGfx = this.add.graphics().setDepth(260);
        confGfx.fillStyle(0x1A1510, 0.92);
        confGfx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        confGfx.fillStyle(0x3A2E28, 1);
        confGfx.fillRoundedRect(cx, cy, cw, ch, 10);
        confGfx.lineStyle(2, 0xCC4444, 0.8);
        confGfx.strokeRoundedRect(cx, cy, cw, ch, 10);

        const qTxt = this.add.text(CX, cy + 28, 'Vraiment abandonner ?', {
            fontFamily: 'monospace', fontSize: '13px', color: '#F5E6D0'
        }).setOrigin(0.5).setDepth(261);

        const bw = 100, bh = 28;
        // Non
        const noGfx = this.add.graphics().setDepth(260);
        noGfx.fillStyle(0x2A5A2A, 0.9);
        noGfx.fillRoundedRect(CX - bw - 8, cy + 56, bw, bh, 5);
        const noTxt = this.add.text(CX - bw / 2 - 8, cy + 70, 'Non', {
            fontFamily: 'monospace', fontSize: '12px', color: '#44FF44'
        }).setOrigin(0.5).setDepth(261).setInteractive({ useHandCursor: true });
        noTxt.on('pointerover', () => sfxUIHover());
        noTxt.on('pointerup', () => {
            sfxUIClick();
            confGfx.destroy(); qTxt.destroy(); noGfx.destroy(); noTxt.destroy();
            oui.destroy(); ouiGfx.destroy();
        });

        // Oui
        const ouiGfx = this.add.graphics().setDepth(260);
        ouiGfx.fillStyle(0x5A1A1A, 0.9);
        ouiGfx.fillRoundedRect(CX + 8, cy + 56, bw, bh, 5);
        const oui = this.add.text(CX + bw / 2 + 8, cy + 70, 'Oui', {
            fontFamily: 'monospace', fontSize: '12px', color: '#CC4444'
        }).setOrigin(0.5).setDepth(261).setInteractive({ useHandCursor: true });
        oui.on('pointerover', () => sfxUIHover());
        oui.on('pointerup', () => {
            sfxUIClick();
            // Cleanup propre avant de quitter
            stopTerrainAmbiance();
            stopCrowdAmbiance();
            stopMusic();
            stopRollingSound();
            this._closePauseMenu();
            fadeToScene(this, this.returnScene || 'TitleScene');
        });
    }

    _closePauseMenu() {
        if (!this._gamePaused) return;
        this._gamePaused = false;
        if (this._pauseContainer) {
            this._pauseContainer.destroy(true);
            this._pauseContainer = null;
        }
    }

    _playIrisOpen() {
        const cx = GAME_WIDTH / 2;
        const cy = GAME_HEIGHT / 2;
        const maxRadius = Math.sqrt(cx * cx + cy * cy) + 20;

        // Iris-open effect: shrinking dark overlay circle (no mask — Phaser 4 WebGL compatible)
        const overlay = this.add.graphics().setDepth(200);

        const anim = { r: 0 };
        const drawFrame = () => {
            overlay.clear();
            // Draw dark overlay with a circular hole
            overlay.fillStyle(0x1A1510, 1);
            // Top
            overlay.fillRect(0, 0, GAME_WIDTH, Math.max(0, cy - anim.r));
            // Bottom
            overlay.fillRect(0, Math.min(GAME_HEIGHT, cy + anim.r), GAME_WIDTH, GAME_HEIGHT);
            // Left
            overlay.fillRect(0, Math.max(0, cy - anim.r), Math.max(0, cx - anim.r), anim.r * 2);
            // Right
            overlay.fillRect(Math.min(GAME_WIDTH, cx + anim.r), Math.max(0, cy - anim.r), GAME_WIDTH, anim.r * 2);
        };
        drawFrame();

        this.tweens.add({
            targets: anim,
            r: maxRadius,
            duration: 600,
            ease: 'Quad.easeOut',
            onUpdate: drawFrame,
            onComplete: () => {
                overlay.destroy();
            }
        });
    }

    update(time, delta) {
        if (this._gamePaused) return;
        if (this.engine) this.engine.update(delta);
        if (this.aimingSystem) this.aimingSystem.update();
        if (this.scorePanel) this.scorePanel.update();

        // === SAFETY WATCHDOG: force transition if stuck in GAME_OVER ===
        // If engine is in GAME_OVER state but we're still in PetanqueScene after 8s,
        // the delayedCall redirect likely failed — force transition to ResultScene
        if (this.engine && this.engine.state === 'GAME_OVER') {
            if (!this._gameOverWatchdogStart) {
                this._gameOverWatchdogStart = time;
            } else if (time - this._gameOverWatchdogStart > 8000 && !this._watchdogFired) {
                this._watchdogFired = true;
                const resultData = {
                    won: (this.engine.scores?.player || 0) >= (this.engine.victoryScore || 13),
                    scores: { ...(this.engine.scores || { player: 0, opponent: 0 }) },
                    playerCharacter: this.playerCharacter,
                    opponentCharacter: this.opponentCharacter,
                    terrainName: this.engine.terrainType || this.terrainType,
                    returnScene: this.returnScene || 'TitleScene',
                    arcadeState: this.arcadeState,
                    galetsEarned: this._matchGaletsEarned || 0,
                    postMatchDialogue: null,
                    unlocksOnWin: null,
                    matchChallenge: this._matchChallenge || null,
                    matchStats: {
                        menes: this.engine.mene || 1,
                        fanny: false,
                        bestMene: 0, carreaux: 0, biberons: 0,
                        shots: 0, points_attempted: 0,
                        bestBallDist: Infinity, opponentCarreaux: 0
                    }
                };
                try {
                    this.scene.start('ResultScene', resultData);
                } catch (e) {
                    try { this.scene.start('TitleScene'); } catch (_) { /* give up */ }
                }
            }
        } else {
            this._gameOverWatchdogStart = 0;
            this._watchdogFired = false;
        }
    }
}
