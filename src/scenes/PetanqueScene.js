import Phaser from 'phaser';
import {
    GAME_WIDTH, GAME_HEIGHT,
    TERRAIN_WIDTH, TERRAIN_HEIGHT,
    TERRAIN_COLORS, TERRAIN_FRICTION,
    COLORS, THROW_CIRCLE_RADIUS, THROW_CIRCLE_Y_OFFSET,
    CHAR_SPRITE_MAP, CHAR_THROW_MAP
} from '../utils/Constants.js';
import PetanqueEngine from '../petanque/PetanqueEngine.js';
import AimingSystem from '../petanque/AimingSystem.js';
import PetanqueAI from '../petanque/PetanqueAI.js';
import ScorePanel from '../ui/ScorePanel.js';
import TerrainRenderer from '../petanque/TerrainRenderer.js';
import { generateCharacterSprite, PALETTES } from '../world/SpriteGenerator.js';
import { setSoundScene, startCigales, stopCigales, startMusic, stopMusic } from '../utils/SoundManager.js';

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
        this.playerCharId = this.playerCharacter?.id || data.playerCharId || 'ley';
        this.opponentId = this.opponentCharacter?.id || data.opponentId?.replace('char_', '')?.replace('quickplay_', '') || null;
        this.arcadeState = data.arcadeState || null;
        this.arcadeRound = data.arcadeRound || null;
        this.localMultiplayer = data.localMultiplayer || false;
        this.bouleType = data.bouleType || 'acier';
        this.cochonnetType = data.cochonnetType || 'classique';
    }

    create() {
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
        this.aimingSystem.resetFocusCharges(5);
        const ability = this._getCharacterAbility(this.playerCharId);
        if (ability) this.aimingSystem.setCharacterAbility(ability);

        // AI
        if (this.localMultiplayer) {
            this.ai = null;
        } else {
            this.ai = new PetanqueAI(this, this.engine, this.difficulty, this.personality, this.opponentCharacter);
        }

        // Score panel
        this.scorePanel = new ScorePanel(this, this.engine);

        // VS label
        const shadow = { offsetX: 2, offsetY: 2, color: '#1A1510', blur: 0, fill: true };
        this.add.text(
            GAME_WIDTH / 2, this.terrainY - 12,
            `VS ${this.opponentName}`,
            { fontFamily: 'monospace', fontSize: '16px', color: '#D4A574', align: 'center', shadow }
        ).setOrigin(0.5, 1).setDepth(5);

        // Impact traces layer
        this.impactLayer = this.add.renderTexture(
            this.terrainX, this.terrainY,
            TERRAIN_WIDTH, TERRAIN_HEIGHT
        ).setOrigin(0, 0).setDepth(8).setAlpha(0.5);

        // Hook score events for barks
        this.engine.onScore = (scores, winner, points) => {
            this._triggerScoreBark(scores, winner, points);
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
            self.time.delayedCall(1200, () => {
                if (Math.random() < 0.5) self._showBark(other, 'opponent_carreau');
            });
        };

        setSoundScene(this);
        startCigales();
        // Music per terrain (falls back to music_match if terrain-specific doesn't exist)
        const terrainMusicMap = {
            terre: 'music_village', herbe: 'music_parc', sable: 'music_plage',
            dalles: 'music_docks', village: 'music_village', parc: 'music_parc',
            plage: 'music_plage', colline: 'music_colline', docks: 'music_docks'
        };
        const musicKey = terrainMusicMap[this.terrainFullData?.id] || terrainMusicMap[surfaceType] || 'music_match';
        startMusic(musicKey, 0.2);

        // Iris wipe opening (circle expands from center)
        this._playIrisOpen();

        this.engine.startGame();

        // First-time tutorial overlay
        this._checkTutorial();

        this.events.on('shutdown', this._shutdown, this);
    }

    _shutdown() {
        stopCigales();
        stopMusic();
        // Kill barks mid-animation
        if (this._barkBubble) { this._barkBubble.destroy(); this._barkBubble = null; }
        if (this._barkText) { this._barkText.destroy(); this._barkText = null; }
        if (this.aimingSystem) this.aimingSystem.destroy();
        if (this.scorePanel) this.scorePanel.destroy();
        if (this.engine?.renderer) this.engine.renderer.destroy();
        this.tweens.killAll();
    }

    _checkTutorial() {
        try {
            if (localStorage.getItem('pm_tutorial_done')) return;
        } catch { return; }

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
            try { localStorage.setItem('pm_tutorial_done', '1'); } catch {}
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
            'magicien': {
                id: 'lecture_terrain',
                name: 'Lecture du Terrain',
                charges: 2,
                description: 'Affiche la trajectoire complete pendant 3s'
                // Effect: shows full predicted trajectory line
            },
            'la_choupe': {
                id: 'coup_de_canon',
                name: 'Coup de Canon',
                charges: 2,
                description: 'Puissance +30%, precision -20%'
                // Effect: modifies power and wobble for this throw
            },
            'marcel': {
                id: 'vieux_renard',
                name: 'Vieux Renard',
                charges: 3,
                description: 'Annule le tremblement de pression'
                // Effect: zeroes pressure tremble
            },
            'reyes': {
                id: 'le_mur',
                name: 'Le Mur',
                charges: 2,
                description: 'Boule 2x plus large pour bloquer'
                // Effect: doubles collision radius of thrown ball
            }
        };
        return ABILITIES[charId] || null;
    }

    // === SPRITE LOADING (real spritesheets or procedural fallback) ===

    _getCharSpriteKey(charId) {
        return CHAR_SPRITE_MAP[charId] || 'marcel_animated';
    }

    _getCharPalette(charId) {
        const mapping = {
            'ley': PALETTES.player,
            'magicien': PALETTES.player,
            'la_choupe': PALETTES.player,
            'marcel': PALETTES.npc_marcel,
            'reyes': PALETTES.player
        };
        return mapping[charId] || PALETTES.player;
    }

    _ensureSprites() {
        // Player sprite — always recreate to match selected character
        if (this.textures.exists('petanque_player')) {
            this.textures.remove('petanque_player');
        }
        const playerKey = this._getCharSpriteKey(this.playerCharId);
        if (this.textures.exists(playerKey)) {
            this.textures.addSpriteSheet('petanque_player',
                this.textures.get(playerKey).getSourceImage(),
                { frameWidth: 128, frameHeight: 128 }
            );
            this.textures.get('petanque_player').setFilter(Phaser.Textures.FilterMode.LINEAR);
        } else {
            generateCharacterSprite(this, 'petanque_player', this._getCharPalette(this.playerCharId));
        }

        // Opponent sprite — always recreate for different opponents
        if (this.textures.exists('petanque_opponent')) {
            this.textures.remove('petanque_opponent');
        }
        const opponentId = this.opponentId || 'marcel';
        const opponentKey = this._getCharSpriteKey(opponentId);
        if (this.textures.exists(opponentKey)) {
            this.textures.addSpriteSheet('petanque_opponent',
                this.textures.get(opponentKey).getSourceImage(),
                { frameWidth: 128, frameHeight: 128 }
            );
            this.textures.get('petanque_opponent').setFilter(Phaser.Textures.FilterMode.LINEAR);
        } else {
            generateCharacterSprite(this, 'petanque_opponent', this._getCharPalette(opponentId));
        }
    }

    // === PLAYER SPRITES & ANIMATIONS ===

    _createPlayerSprites() {
        // Character sprite scale: 0.4x (sprites are 128x128, displayed at ~51px — avoids overlap)
        const CHAR_SCALE = 0.4;
        this._charScale = CHAR_SCALE;

        // Throw circle position (where the active thrower stands)
        const circleX = this.throwCircleX;
        const circleY = this.throwCircleY + 20;

        // Watcher positions (where the non-active player stands, well separated)
        // Player watches from the LEFT of the terrain (further out to avoid overlap)
        this._playerWatchX = this.terrainX - 55;
        this._playerWatchY = this.terrainY + TERRAIN_HEIGHT * 0.35;
        // Opponent watches from the RIGHT of the terrain
        this._opponentWatchX = this.terrainX + TERRAIN_WIDTH + 55;
        this._opponentWatchY = this.terrainY + 100;

        // Shared circle position (both players use the same throw circle)
        this._circleX = circleX;
        this._circleY = circleY;

        // Player starts at the circle (first to throw)
        this.playerSprite = this.add.sprite(circleX, circleY, 'petanque_player', 12)
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
    }

    _animateToCircle(team) {
        this._updateWatchPositions();
        const s = this._charScale || 1;

        const thrower = team === 'player' ? this.playerSprite : this.opponentSprite;
        const watcher = team === 'player' ? this.opponentSprite : this.playerSprite;
        const watchX = team === 'player' ? this._opponentWatchX : this._playerWatchX;
        const watchY = team === 'player' ? this._opponentWatchY : this._playerWatchY;

        // CRITICAL: kill ALL tweens + cancel any pending delayedCall
        this.tweens.getTweensOf(this.playerSprite).forEach(t => t.stop());
        this.tweens.getTweensOf(this.opponentSprite).forEach(t => t.stop());
        if (this._transitionTimer) { this._transitionTimer.destroy(); this._transitionTimer = null; }

        // Reset both sprites to clean state
        this.playerSprite.scaleX = s;
        this.playerSprite.scaleY = s;
        this.playerSprite.angle = 0;
        this.opponentSprite.scaleX = s;
        this.opponentSprite.scaleY = s;
        this.opponentSprite.angle = 0;

        // IMMEDIATE: teleport watcher to sideline (no animation = no overlap possible)
        watcher.x = watchX;
        watcher.y = watchY;
        watcher.setFrame(0); // face south

        // Thrower walks to circle (smooth animation)
        this.tweens.add({
            targets: thrower,
            x: this._circleX, y: this._circleY,
            duration: 400, ease: 'Sine.easeInOut',
            onUpdate: () => {
                const t = Date.now();
                const phase = Math.sin(t / 80 * Math.PI);
                thrower.setFrame(Math.floor(t / 150) % 4);
                thrower.scaleY = s * (1 + phase * 0.04);
                thrower.scaleX = s * (1 - phase * 0.015);
            },
            onComplete: () => {
                thrower.setFrame(12); // face north
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
        const idleFrame = team === 'player' ? 12 : 0;

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
            // Hide main sprite, show throw sprite at same position
            sprite.setVisible(false);
            const throwSprite = this.add.sprite(baseX, baseY, throwInfo.key, 0)
                .setOrigin(0.5, 1).setDepth(20).setScale(s);
            const nFrames = throwInfo.frames;

            // Timing per frame: idle, wind-up, release, follow-through, (recovery)
            const frameDurations = nFrames === 5
                ? [180, 150, 80, 120, 250]   // 5 frames: idle, wind-up, arm-back, release, follow
                : [200, 160, 90, 280];         // 4 frames: idle, wind-up, release, follow

            let currentFrame = 0;
            const advanceFrame = () => {
                if (currentFrame >= nFrames) {
                    // Animation done — destroy throw sprite, show main sprite at idle
                    throwSprite.destroy();
                    sprite.setVisible(true);
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
                    // Release: explosive stretch + white flash
                    this.tweens.add({
                        targets: throwSprite,
                        scaleX: s * 1.15, scaleY: s * 0.88, y: baseY - 10,
                        duration: frameDurations[currentFrame], ease: 'Quad.easeOut',
                        onStart: () => {
                            throwSprite.setTint(0xFFFFFF);
                            this.time.delayedCall(40, () => throwSprite.clearTint());
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
        } else {
            // === FALLBACK: squash/stretch only (no throw spritesheet) ===
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

        const barks = charData.barks[barkType];
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
        if (Math.random() > 0.5) return;
        const loser = winner === 'player' ? 'opponent' : 'player';

        if (scores.player >= 11 || scores.opponent >= 11) {
            this._showBark(winner === 'player' ? 'player' : 'opponent', 'match_point');
        } else if (scores[winner] - scores[loser] >= 6) {
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

        const throwerSprite = lastTeam === 'player' ? this.playerSprite : this.opponentSprite;
        const watcherSprite = lastTeam === 'player' ? this.opponentSprite : this.playerSprite;
        const s = this._charScale || 1;
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
                        onStart: () => throwerSprite.setFrame(throwerSouthFrames[2])
                    },
                    {
                        y: throwerSprite.y, scaleX: this._charScale || 1, scaleY: this._charScale || 1,
                        duration: 250, ease: 'Bounce.easeOut',
                        onStart: () => throwerSprite.setFrame(throwerSouthFrames[0])
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
            'ball_acier', 'ball_bronze', 'ball_chrome', 'ball_noire', 'ball_rouge',
            'ball_doree', 'ball_rouille', 'ball_bleue', 'ball_cuivre', 'ball_titane',
            'ball_opponent',
            'ball_cochonnet', 'ball_cochonnet_bleu', 'ball_cochonnet_vert',
            'ball_cochonnet_rouge', 'ball_cochonnet_dore', 'ball_cochonnet_noir',
            'ball_cochonnet_rose', 'ball_cochonnet_orange'
        ];

        for (const key of ballKeys) {
            if (!this.textures.exists(key)) continue;

            // Get the original PNG image source
            const srcImage = this.textures.get(key).getSourceImage();

            // Create a spritesheet canvas: N frames of the same ball rotated
            const canvas = document.createElement('canvas');
            canvas.width = FRAME_SIZE * ROLL_FRAMES;
            canvas.height = FRAME_SIZE;
            const ctx = canvas.getContext('2d');

            // Disable smoothing for pixel art
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

            // Replace the static texture with the rolling spritesheet
            this.textures.remove(key);
            this.textures.addSpriteSheet(key, canvas, {
                frameWidth: FRAME_SIZE,
                frameHeight: FRAME_SIZE
            });
        }
    }

    // drawTerrain, _placeTerrainDecor, _drawTerrainBorders, _darkenHex
    // replaced by TerrainRenderer.js

    _playIrisOpen() {
        const cx = GAME_WIDTH / 2;
        const cy = GAME_HEIGHT / 2;
        const maxRadius = Math.sqrt(cx * cx + cy * cy) + 20;

        const overlay = this.add.graphics().setDepth(200);
        const shape = this.make.graphics({ add: false });
        shape.fillStyle(0xffffff);
        shape.fillCircle(cx, cy, 1);
        const mask = shape.createGeometryMask();
        mask.invertAlpha = true;

        overlay.fillStyle(0x1A1510, 1);
        overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        overlay.setMask(mask);

        const anim = { r: 0 };
        this.tweens.add({
            targets: anim,
            r: maxRadius,
            duration: 600,
            ease: 'Quad.easeOut',
            onUpdate: () => {
                shape.clear();
                shape.fillStyle(0xffffff);
                shape.fillCircle(cx, cy, anim.r);
            },
            onComplete: () => {
                overlay.clearMask(true);
                overlay.destroy();
            }
        });
    }

    update(time, delta) {
        if (this.engine) this.engine.update(delta);
        if (this.aimingSystem) this.aimingSystem.update();
        if (this.scorePanel) this.scorePanel.update();

    }
}
