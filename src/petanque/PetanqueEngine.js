import Ball from './Ball.js';
import Cochonnet from './Cochonnet.js';
import EngineRenderer from './EngineRenderer.js';
import {
    VICTORY_SCORE, BALL_COLORS,
    COCHONNET_MIN_DIST, COCHONNET_MAX_DIST,
    FRICTION_BASE,
    THROW_FLY_DURATION, THROW_SHAKE_INTENSITY, THROW_SHAKE_DURATION,
    TERRAIN_HEIGHT,
    LOFT_DEMI_PORTEE, LOFT_TIR,
    CARREAU_THRESHOLD,
    HITSTOP_BOULE_MS, HITSTOP_CARREAU_MS,
    SCORE_MENE_DELAY, GAME_OVER_REDIRECT_DELAY,
    DUST_COUNT_ROULETTE, DUST_COUNT_DEMI, DUST_COUNT_PLOMBEE, DUST_COUNT_TIR,
    MIN_IMPACT_SPEED,
    COCHONNET_ROLL_MIN, COCHONNET_ROLL_MAX, COCHONNET_SAFE_MARGIN, COCHONNET_CLAMP_MARGIN,
    BALL_CLAMP_MARGIN,
    MAX_THROW_SPEED,
    SLOWMO_DISTANCE, SLOWMO_SPEED_THRESHOLD, SLOWMO_FACTOR, SLOWMO_LERP_SPEED,
    SPEED_THRESHOLD,
    GALET_WIN_ARCADE, GALET_WIN_QUICKPLAY, GALET_CARREAU_BONUS,
    PALET_THRESHOLD,
    CASQUETTE_MAX_SPEED, BLESSER_MAX_SPEED
} from '../utils/Constants.js';
import {
    sfxBouleBoule, sfxBouleCochonnet, sfxLanding, sfxRoll,
    sfxCarreau, sfxThrow, sfxVictory, sfxDefeat, sfxScore,
    startRollingSound, updateRollingSound, stopRollingSound
} from '../utils/SoundManager.js';

const STATES = {
    COCHONNET_THROW: 'COCHONNET_THROW',
    FIRST_BALL: 'FIRST_BALL',
    SECOND_TEAM_FIRST: 'SECOND_TEAM_FIRST',
    PLAY_LOOP: 'PLAY_LOOP',
    WAITING_STOP: 'WAITING_STOP',
    SCORE_MENE: 'SCORE_MENE',
    MENE_DEAD: 'MENE_DEAD',
    GAME_OVER: 'GAME_OVER'
};

export default class PetanqueEngine {
    constructor(scene, config) {
        this.scene = scene;
        this.terrainType = config.terrainType;
        this.frictionMult = config.frictionMult;
        this.format = config.format;
        this.bounds = config.terrainBounds;
        this.terrainData = config.terrainData || null; // full terrain JSON (slope, zones, walls)

        this.state = null;
        this.balls = [];
        this.cochonnet = null;
        this.currentTeam = 'player';
        this.lastTeamPlayed = null;

        // Balls per player based on format
        this.ballsPerPlayer = this.format === 'une_boule' ? 1 : (this.format === 'deux_boules' ? 2 : (this.format === 'triplette' ? 2 : 3));

        // Victory score varies by format
        this.victoryScore = this.format === 'une_boule' ? 11 : (this.format === 'deux_boules' ? 7 : VICTORY_SCORE);

        this.scores = { player: 0, opponent: 0 };
        this.mene = 1;
        this.meneWinner = null;

        // Remaining balls to throw this mene
        this.remaining = { player: 0, opponent: 0 };

        // Callbacks
        this.onStateChange = null;
        this.onScore = null;
        this.onTurnChange = null;
        this.onAfterStop = null;

        // Aiming enabled flag
        this.aimingEnabled = false;

        // After-throw callback queue
        this._afterStopCallback = null;

        // Carreau tracking
        this.lastThrownBall = null;
        this._pendingCarreauChecks = [];
        this._hitstopUntil = 0;

        // Shot result tracking
        this._shotCollisions = []; // balls hit by lastThrownBall this throw
        this._lastImpactPoint = null; // {x, y} position of target ball at moment of collision

        // Point indicator
        this._lastBestBallId = null;
        this._bestPulse = { t: 0 };

        // Rolling SFX throttle
        this._rollSfxCooldown = 0;

        // Dramatic zoom state
        this._zoomActive = false;

        // Slow-motion state
        this._slowMoActive = false;
        this._timeScale = 1.0; // current time scale (lerps toward target)

        // Rolling sound state
        this._rollingSoundActive = false;

        // Renderer: handles ALL visual effects (SRP separation)
        this.renderer = new EngineRenderer(scene, this);

        // === MATCH STATS TRACKING ===
        this.matchStats = {
            carreaux: { player: 0, opponent: 0 },
            biberons: { player: 0, opponent: 0 },
            shots: { player: 0, opponent: 0 },      // tirs attempted
            points: { player: 0, opponent: 0 },      // pointages attempted
            bestBallDist: Infinity,                    // closest ball to cochonnet ever
            menesPlayed: 0,
            bestMeneScore: 0,                          // highest single-mene score for player
            meneScores: []                             // per-mene point history
        };
    }

    startGame() {
        this.scores = { player: 0, opponent: 0 };
        this.mene = 1;
        this.startMene();
    }

    startMene() {
        // Clear old balls
        this.balls.forEach(b => b.destroy());
        this.balls = [];
        if (this.cochonnet) {
            this.cochonnet.destroy();
            this.cochonnet = null;
        }

        this.remaining = {
            player: this.ballsPerPlayer,
            opponent: this.ballsPerPlayer
        };

        // FIPJP: l'equipe qui a GAGNE la mene precedente lance le cochonnet
        // (mene 1 = toujours player)
        this._cochonnetTeam = this.meneWinner || 'player';
        this.meneWinner = null;

        this.setState(STATES.COCHONNET_THROW);
    }

    setState(state) {
        this.state = state;
        this.aimingEnabled = false;

        if (this.onStateChange) this.onStateChange(state);

        switch (state) {
            case STATES.COCHONNET_THROW:
                // L'equipe qui a gagne la mene precedente lance le cochonnet
                this.currentTeam = this._cochonnetTeam || 'player';
                if (this.currentTeam === 'player') {
                    this.aimingEnabled = true;
                    this._showMessage(`${this._teamName('player')} : lancez le cochonnet !`);
                    this._showAimHint();
                } else {
                    this._showMessage(`${this._teamName('opponent')} lance le cochonnet`);
                    this._triggerAI();
                }
                if (this.onTurnChange) this.onTurnChange(this.currentTeam);
                break;

            case STATES.FIRST_BALL:
                // Meme equipe que le cochonnet lance la premiere boule
                this.currentTeam = this._cochonnetTeam || 'player';
                if (this.currentTeam === 'player') {
                    this.aimingEnabled = true;
                    this._showMessage(`${this._teamName('player')} : premiere boule !`);
                } else {
                    this._showMessage(`${this._teamName('opponent')} : premiere boule`);
                    this._triggerAI();
                }
                if (this.onTurnChange) this.onTurnChange(this.currentTeam);
                break;

            case STATES.SECOND_TEAM_FIRST:
                // L'autre equipe joue sa premiere boule
                this.currentTeam = this._cochonnetTeam === 'player' ? 'opponent' : 'player';
                if (this.currentTeam === 'player') {
                    this.aimingEnabled = true;
                    this._showMessage(`${this._teamName('player')} : a vous !`);
                } else {
                    this._showMessage(`Tour de ${this._teamName('opponent')}`);
                    this._triggerAI();
                }
                if (this.onTurnChange) this.onTurnChange(this.currentTeam);
                break;

            case STATES.PLAY_LOOP:
                this._determineNextTeam();
                break;

            case STATES.WAITING_STOP:
                this.aimingEnabled = false;
                break;

            case STATES.SCORE_MENE:
                this._scoreMene();
                break;

            case STATES.MENE_DEAD:
                this._handleMeneDead();
                break;

            case STATES.GAME_OVER:
                this._handleGameOver();
                break;
        }
    }

    _determineNextTeam() {
        const playerBalls = this.remaining.player;
        const opponentBalls = this.remaining.opponent;

        if (playerBalls === 0 && opponentBalls === 0) {
            this.setState(STATES.SCORE_MENE);
            return;
        }

        if (playerBalls === 0) {
            this.currentTeam = 'opponent';
        } else if (opponentBalls === 0) {
            this.currentTeam = 'player';
        } else {
            // Team further from cochonnet plays
            const playerDist = this._getMinDistance('player');
            const opponentDist = this._getMinDistance('opponent');

            if (playerDist > opponentDist) {
                this.currentTeam = 'player';
            } else if (opponentDist > playerDist) {
                this.currentTeam = 'opponent';
            } else {
                // Equal distance: last team played goes again
                this.currentTeam = this.lastTeamPlayed || 'player';
            }
        }

        if (this.currentTeam === 'player') {
            this.aimingEnabled = true;
            this._showMessage(`${this._teamName('player')} : a vous !`);
        } else {
            this._showMessage(`Tour de ${this._teamName('opponent')}`);
            this._triggerAI();
        }

        if (this.onTurnChange) this.onTurnChange(this.currentTeam);
    }

    _teamName(team) {
        if (this.scene.localMultiplayer) {
            return team === 'player' ? 'Joueur 1' : 'Joueur 2';
        }
        return team === 'player' ? 'Vous' : 'L\'adversaire';
    }

    _getMinDistance(team) {
        if (!this.cochonnet || !this.cochonnet.isAlive) return Infinity;
        let minDist = Infinity;
        for (const ball of this.balls) {
            if (ball.team === team && ball.isAlive) {
                const d = ball.distanceTo(this.cochonnet);
                if (d < minDist) minDist = d;
            }
        }
        return minDist;
    }

    getTeamBallsAlive(team) {
        return this.balls.filter(b => b.team === team && b.isAlive);
    }

    throwCochonnet(angle, power) {
        const cx = this.scene.throwCircleX;
        const cy = this.scene.throwCircleY;

        // Cochonnet lands 6-10m ahead (mapped to COCHONNET_MIN/MAX_DIST)
        const dist = COCHONNET_MIN_DIST + power * (COCHONNET_MAX_DIST - COCHONNET_MIN_DIST);
        const targetX = cx + Math.cos(angle) * dist;
        const targetY = cy + Math.sin(angle) * dist;

        // Clamp within terrain (with generous margin to avoid rolling out)
        const margin = COCHONNET_CLAMP_MARGIN;
        const clampedX = Phaser.Math.Clamp(targetX, this.bounds.x + margin, this.bounds.x + this.bounds.w - margin);
        const clampedY = Phaser.Math.Clamp(targetY, this.bounds.y + margin, this.bounds.y + this.bounds.h - margin);

        // Resolve cochonnet texture from selection
        const cochonnetTexMap = {
            classique: 'ball_cochonnet', bleu: 'ball_cochonnet_bleu', vert: 'ball_cochonnet_vert',
            rouge: 'ball_cochonnet_rouge', jungle: 'ball_cochonnet_jungle',
            multicolor: 'ball_cochonnet_multicolor'
        };
        const cochonnetTex = cochonnetTexMap[this.scene.cochonnetType] || 'ball_cochonnet';
        this.cochonnet = new Cochonnet(this.scene, cx, cy, this.frictionMult, cochonnetTex, this.terrainData, this.bounds);

        // Cochonnet rolls 5-10% beyond landing point (like a real throw)
        // But only if there's enough room — check distance to border in throw direction
        const throwDirX = Math.cos(angle);
        const throwDirY = Math.sin(angle);
        const rollPct = COCHONNET_ROLL_MIN + Math.random() * (COCHONNET_ROLL_MAX - COCHONNET_ROLL_MIN);
        let targetRollDist = dist * rollPct;

        // Check remaining space in throw direction from landing point
        const safeMargin = COCHONNET_SAFE_MARGIN;
        let maxRollX = Infinity, maxRollY = Infinity;
        if (throwDirX < 0) maxRollX = (clampedX - this.bounds.x - safeMargin) / Math.abs(throwDirX);
        else if (throwDirX > 0) maxRollX = (this.bounds.x + this.bounds.w - safeMargin - clampedX) / throwDirX;
        if (throwDirY < 0) maxRollY = (clampedY - this.bounds.y - safeMargin) / Math.abs(throwDirY);
        else if (throwDirY > 0) maxRollY = (this.bounds.y + this.bounds.h - safeMargin - clampedY) / throwDirY;
        const maxRoll = Math.max(0, Math.min(maxRollX, maxRollY));
        targetRollDist = Math.min(targetRollDist, maxRoll);

        // Ball.update() per frame at 60fps: speed -= 0.15 * frictionMult
        // Stopping distance = v0^2 / (2 * 0.15 * frictionMult)
        // So v0 = sqrt(0.3 * frictionMult * targetRollDist)
        const perFrameFriction = 0.15 * this.frictionMult;
        const rollSpeed = targetRollDist > 0 ? Math.sqrt(2 * perFrameFriction * targetRollDist) : 0;
        const rollVx = throwDirX * rollSpeed;
        const rollVy = throwDirY * rollSpeed;

        // Animate fly, then wait for roll to stop before switching state
        this._animateThrow(this.cochonnet, clampedX, clampedY, rollVx, rollVy, () => {
            // Wait for cochonnet to stop rolling before allowing first ball
            const waitForStop = () => {
                if (this.cochonnet.isMoving) {
                    this.scene.time.delayedCall(50, waitForStop);
                } else {
                    this.setState(STATES.FIRST_BALL);
                }
            };
            waitForStop();
        }, LOFT_DEMI_PORTEE);
    }

    static computeThrowParams(angle, power, originX, originY, bounds, loftPreset, frictionMult, puissanceStat = 6) {
        const isTir = loftPreset.id === 'tir';
        // Puissance stat affects max distance: 1 = 70% range, 6 = 100%, 10 = 120%
        const puissanceMult = 0.7 + (puissanceStat - 1) / 9 * 0.5;
        const maxDist = TERRAIN_HEIGHT * (isTir ? 0.95 : 0.85) * puissanceMult;
        const totalDist = power * maxDist;
        const landDist = totalDist * loftPreset.landingFactor;
        const rollDist = totalDist * (1 - loftPreset.landingFactor);

        const rawTargetX = originX + Math.cos(angle) * landDist;
        const rawTargetY = originY + Math.sin(angle) * landDist;

        const targetX = Phaser.Math.Clamp(rawTargetX, bounds.x + BALL_CLAMP_MARGIN, bounds.x + bounds.w - BALL_CLAMP_MARGIN);
        const targetY = Phaser.Math.Clamp(rawTargetY, bounds.y + BALL_CLAMP_MARGIN, bounds.y + bounds.h - BALL_CLAMP_MARGIN);

        const perFrameFriction = FRICTION_BASE * frictionMult;
        const rollingSpeed = Math.sqrt(2 * perFrameFriction * rollDist * loftPreset.rollEfficiency);
        const rollVx = Math.cos(angle) * rollingSpeed;
        const rollVy = Math.sin(angle) * rollingSpeed;

        return { targetX, targetY, rollVx, rollVy };
    }

    throwBall(angle, power, team, shotMode = 'pointer', loftPreset = null, retro = 0, throwMeta = {}) {
        if (this.remaining[team] <= 0) return;

        const cx = this.scene.throwCircleX;
        const cy = this.scene.throwCircleY;
        const color = team === 'player' ? BALL_COLORS.player : BALL_COLORS.opponent;

        // Use boule stats from game state if player
        const bouleStats = this._getBouleStats(team);
        const ball = new Ball(this.scene, cx, cy, {
            color: bouleStats.color || color,
            team,
            mass: bouleStats.mass,
            radius: bouleStats.radius,
            frictionMult: this.frictionMult * (bouleStats.frictionMult || 1),
            textureKey: bouleStats.textureKey || null,
            terrain: this.terrainData,
            bounds: this.bounds,
            id: `${team}_${this.ballsPerPlayer - this.remaining[team]}`
        });
        // Apply retro (backspin) if the loft allows it, amplified by boule retroBonus
        const baseRetro = (loftPreset || LOFT_DEMI_PORTEE).retroAllowed ? retro : 0;
        ball.retro = baseRetro * (bouleStats.retroBonus || 1);
        // Store boule bonuses + character puissance for collision resolution
        ball.restitutionMult = bouleStats.restitutionMult || 1;
        ball.knockbackMult = bouleStats.knockbackMult || 1;
        // Puissance stat affects how far target is pushed on collision
        const charPui = team === 'player'
            ? (this.scene.playerCharacter?.stats?.puissance || 6)
            : (this.scene.opponentCharacter?.stats?.puissance || 6);
        ball.puissanceStat = charPui;

        // === Unique ability effects ===
        // Le Mur (Reyes): double collision radius
        if (throwMeta.leMur) {
            ball.collisionRadiusMult = 2.0;
        }
        // Carreau Instinct (Ley): flag for stronger ejection
        if (throwMeta.carreauInstinct) {
            ball.carreauInstinct = true;
        }
        // Store throwMeta for later use
        ball.throwMeta = throwMeta;

        this.balls.push(ball);
        this.remaining[team]--;
        this.lastTeamPlayed = team;
        this.lastThrownBall = ball;
        this.lastShotWasTir = shotMode === 'tirer';
        this._pendingCarreauChecks = [];
        this._shotCollisions = [];
        this._lastImpactPoint = null;

        // Store throw direction for recul detection
        ball._throwDirX = Math.cos(angle);
        ball._throwDirY = Math.sin(angle);

        // Track shot/point stats
        if (this.matchStats) {
            if (shotMode === 'tirer') this.matchStats.shots[team]++;
            else this.matchStats.points[team]++;
        }

        // Resolve loft preset
        const isTir = shotMode === 'tirer';
        const loft = loftPreset || (isTir ? LOFT_TIR : LOFT_DEMI_PORTEE);

        // Get puissance stat from the team's character
        const puissance = team === 'player'
            ? (this.scene.playerCharacter?.stats?.puissance || 6)
            : (this.scene.opponentCharacter?.stats?.puissance || 6);
        const { targetX, targetY, rollVx, rollVy } =
            PetanqueEngine.computeThrowParams(angle, power, cx, cy, this.bounds, loft, this.frictionMult, puissance);

        // SFX throw swoosh
        sfxThrow();

        // Notify scene for character throw animation
        if (this.onThrow) this.onThrow(team);

        // Animate fly then physics
        this._animateThrow(ball, targetX, targetY, rollVx, rollVy, () => {
            this.setState(STATES.WAITING_STOP);
            this._afterStopCallback = () => {
                this._checkCarreau();
                this._detectShotResult();
                this._checkBoundsAll();
                if (!this.cochonnet.isAlive) {
                    this.setState(STATES.MENE_DEAD);
                } else {
                    this.setState(STATES.PLAY_LOOP);
                }
            };
        }, loft);
    }

    _animateThrow(ball, targetX, targetY, rollVx, rollVy, callback, loftPreset = LOFT_DEMI_PORTEE) {
        const startX = ball.x;
        const startY = ball.y;
        const isTir = loftPreset.id === 'tir';

        // Hide ball during flight
        if (ball.sprite) { ball.sprite.setVisible(false); ball.shadowSprite.setVisible(false); }
        if (ball.gfx) { ball.gfx.setVisible(false); ball.shadow.setVisible(false); }

        // Fly sprite: use 3D texture if available, else Graphics fallback
        let flySprite = null;
        let flyGfx = null;
        let flyShadow = null;
        if (ball.textureKey && this.scene.textures.exists(ball.textureKey)) {
            const scale = ball.radius / 28;
            flySprite = this.scene.add.image(startX, startY, ball.textureKey).setScale(scale).setDepth(50);
            flyShadow = this.scene.add.ellipse(startX, startY, ball.radius * 1.8, ball.radius * 0.8, 0x000000, 0.15).setDepth(49);
        } else {
            flyGfx = this.scene.add.graphics().setDepth(50);
            flyShadow = this.scene.add.graphics().setDepth(49);
        }

        const flyDuration = THROW_FLY_DURATION * loftPreset.flyDurationMult;
        const arcHeight = loftPreset.arcHeight;
        const isPlombee = loftPreset.id === 'plombee';
        const isRoulette = loftPreset.id === 'roulette';
        // Roulette = smooth constant speed, Plombee = slow rise then fast drop, Tir = fast linear
        const ease = isTir ? 'Linear' : isPlombee ? 'Sine.easeIn' : 'Quad.easeOut';

        const tween = { t: 0 };
        this.scene.tweens.add({
            targets: tween,
            t: 1,
            duration: flyDuration,
            ease,
            onUpdate: () => {
                const cx = Phaser.Math.Linear(startX, targetX, tween.t);
                const cy = Phaser.Math.Linear(startY, targetY, tween.t);
                const arc = arcHeight * Math.sin(tween.t * Math.PI);
                // Height ratio (0 at ground, 1 at peak) — for shadow scaling
                const heightRatio = Math.abs(Math.sin(tween.t * Math.PI));

                if (flySprite) {
                    flySprite.setPosition(cx, cy + arc);
                    // Scale ball slightly larger at peak to show height (parallax)
                    const sizeBoost = 1 + heightRatio * 0.15 * (Math.abs(arcHeight) / 80);
                    flySprite.setScale((ball.radius / 28) * sizeBoost);

                    // Shadow: smaller & more offset when ball is higher
                    const shadowShrink = 1 - heightRatio * 0.6;
                    const shadowOffset = heightRatio * Math.abs(arcHeight) * 0.08;
                    flyShadow.setPosition(cx + shadowOffset, cy + shadowOffset * 0.5);
                    flyShadow.setScale(shadowShrink);
                    flyShadow.setAlpha(0.12 * shadowShrink);
                } else {
                    flyGfx.clear();
                    flyGfx.fillStyle(ball.color, 1);
                    flyGfx.fillCircle(cx, cy + arc, ball.radius);
                    flyGfx.fillStyle(0xFFFFFF, 0.3);
                    flyGfx.fillCircle(cx - ball.radius * 0.3, cy + arc - ball.radius * 0.3, ball.radius * 0.3);

                    flyShadow.clear();
                    const shadowShrink = 1 - heightRatio * 0.6;
                    flyShadow.fillStyle(0x000000, 0.12 * shadowShrink);
                    flyShadow.fillCircle(cx, cy, ball.radius * shadowShrink);
                }
            },
            onComplete: () => {
                if (flySprite) { flySprite.destroy(); flyShadow.destroy(); }
                if (flyGfx) { flyGfx.destroy(); flyShadow.destroy(); }

                ball.x = targetX;
                ball.y = targetY;
                if (ball.sprite) { ball.sprite.setVisible(true); ball.shadowSprite.setVisible(true); }
                if (ball.gfx) { ball.gfx.setVisible(true); ball.shadow.setVisible(true); }
                ball.draw();

                // Check immediate collision at landing (ball may have landed ON another ball)
                const allBodies = [...this.balls, this.cochonnet].filter(b => b && b.isAlive && b !== ball);
                for (const other of allBodies) {
                    const cdx = ball.x - other.x;
                    const cdy = ball.y - other.y;
                    const cdist = Math.sqrt(cdx * cdx + cdy * cdy);
                    if (cdist < ball.radius + other.radius) {
                        // Ball landed on top of another — give it velocity if it has none
                        if (Math.abs(rollVx) < 0.1 && Math.abs(rollVy) < 0.1) {
                            // Plombée/demi-portée with low roll: use landing direction as impulse
                            const landAngle = Math.atan2(targetY - startY, targetX - startX);
                            const minSpeed = MIN_IMPACT_SPEED;
                            rollVx = Math.cos(landAngle) * minSpeed;
                            rollVy = Math.sin(landAngle) * minSpeed;
                        }
                    }
                }

                // Landing effects vary by technique
                const shakeIntensity = isTir ? THROW_SHAKE_INTENSITY * 2.5
                    : isPlombee ? THROW_SHAKE_INTENSITY * 1.5
                    : THROW_SHAKE_INTENSITY;
                const shakeDuration = isTir ? THROW_SHAKE_DURATION * 1.5 : THROW_SHAKE_DURATION;
                // Camera shake removed — fixed scene

                if (isTir) {
                    this.renderer.flashTirImpact(targetX, targetY, ball.radius);
                }

                // Dust proportional to technique (more for plombee, less for roulette)
                const dustCount = isRoulette ? DUST_COUNT_ROULETTE : isPlombee ? DUST_COUNT_PLOMBEE : isTir ? DUST_COUNT_TIR : DUST_COUNT_DEMI;
                sfxLanding(this.terrainType);
                this._spawnDust(targetX, targetY, dustCount);

                // Impact trace (bigger for plombee/tir)
                const traceRadius = isPlombee ? ball.radius + 4 : isTir ? ball.radius + 3 : ball.radius;
                this._drawImpactTrace(targetX, targetY, traceRadius);

                ball.launch(rollVx, rollVy);
                if (callback) callback();
            }
        });
    }

    _checkBoundsAll() {
        // On wall terrains (Docks), balls bounce off walls instead of dying
        // Ball.update() handles the actual bounce — skip kill check
        if (this.terrainData?.walls) return;

        for (const ball of this.balls) {
            if (ball.isAlive && ball.checkOutOfBounds(this.bounds)) {
                const bx = ball.x, by = ball.y;
                ball.kill();
                if (this.onBallDead) this.onBallDead(bx, by);
            }
        }
        if (this.cochonnet && this.cochonnet.isAlive && this.cochonnet.checkOutOfBounds(this.bounds)) {
            const cx = this.cochonnet.x, cy = this.cochonnet.y;
            this.cochonnet.kill();
            if (this.onBallDead) this.onBallDead(cx, cy);
        }
    }

    _scoreMene() {
        if (!this.cochonnet || !this.cochonnet.isAlive) {
            this.setState(STATES.MENE_DEAD);
            return;
        }

        const playerDist = this._getMinDistance('player');
        const opponentDist = this._getMinDistance('opponent');

        let winner, loserDist;
        if (playerDist < opponentDist) {
            winner = 'player';
            loserDist = opponentDist;
        } else if (opponentDist < playerDist) {
            winner = 'opponent';
            loserDist = playerDist;
        } else {
            // Exact tie: no points, same team relaunches
            this._showMessage('Egalite ! Aucun point.');
            this.scene.time.delayedCall(2000, () => {
                this.mene++;
                this.startMene();
            });
            return;
        }

        // Count winning balls closer than best losing ball
        let points = 0;
        for (const ball of this.balls) {
            if (ball.team === winner && ball.isAlive) {
                if (ball.distanceTo(this.cochonnet) < loserDist) {
                    points++;
                }
            }
        }

        // If no losing balls alive, all winning balls count
        const losingBallsAlive = this.balls.filter(
            b => b.team !== winner && b.team !== 'cochonnet' && b.isAlive
        );
        if (losingBallsAlive.length === 0) {
            points = this.balls.filter(b => b.team === winner && b.isAlive).length;
        }

        this.scores[winner] += points;
        this.meneWinner = winner;

        // Track mene stats
        if (this.matchStats) {
            this.matchStats.menesPlayed++;
            this.matchStats.meneScores.push({ winner, points });
            if (winner === 'player' && points > this.matchStats.bestMeneScore) {
                this.matchStats.bestMeneScore = points;
            }
        }

        const winnerName = this._teamName(winner);
        this._showMessage(`${winnerName} ${winner === 'player' ? 'gagnez' : 'gagne'} ${points} point${points > 1 ? 's' : ''} !`);

        // Dramatic pause: 1.5s of suspense before showing score
        this.scene.events.emit('dramatic-pause');
        this.scene.time.delayedCall(1500, () => {
            sfxScore();
            if (this.onScore) this.onScore(this.scores, winner, points);

            this.scene.time.delayedCall(SCORE_MENE_DELAY, () => {
                if (this.scores.player >= this.victoryScore || this.scores.opponent >= this.victoryScore) {
                    this.setState(STATES.GAME_OVER);
                } else {
                    this.mene++;
                    this.startMene();
                }
            });
        });
    }

    _handleMeneDead() {
        // Cochonnet sorti = mene morte
        const playerRemaining = this.remaining.player;
        const opponentRemaining = this.remaining.opponent;

        if (playerRemaining > 0 && opponentRemaining === 0) {
            this.scores.player += playerRemaining;
            this.meneWinner = 'player';
            this._showMessage(`Mene morte ! Vous gagnez ${playerRemaining} point(s) !`);
        } else if (opponentRemaining > 0 && playerRemaining === 0) {
            this.scores.opponent += opponentRemaining;
            this.meneWinner = 'opponent';
            this._showMessage(`Mene morte ! L'adversaire gagne ${opponentRemaining} point(s) !`);
        } else {
            // Mene morte sans points : meme equipe relance
            this.meneWinner = this._cochonnetTeam;
            this._showMessage('Mene morte ! 0 points.');
        }

        if (this.onScore) this.onScore(this.scores, this.meneWinner, 0);

        this.scene.time.delayedCall(SCORE_MENE_DELAY, () => {
            if (this.scores.player >= this.victoryScore || this.scores.opponent >= this.victoryScore) {
                this.setState(STATES.GAME_OVER);
            } else {
                this.mene++;
                this.startMene();
            }
        });
    }

    _handleGameOver() {
        const winner = this.scores.player >= this.victoryScore ? 'player' : 'opponent';
        const isVictory = winner === 'player';
        const loser = isVictory ? 'opponent' : 'player';
        const isFanny = this.scores[loser] === 0;

        // SFX victory/defeat
        if (isVictory) sfxVictory(); else sfxDefeat();

        // If arcade/versus mode: redirect to ResultScene
        if (this.scene.arcadeState || this.scene.playerCharacter) {
            // Calculate Galets earned
            const playerCarreaux = this.matchStats?.carreaux?.player || 0;
            let galetsEarned = 0;
            if (isVictory) {
                galetsEarned = this.scene.arcadeState ? GALET_WIN_ARCADE : GALET_WIN_QUICKPLAY;
                galetsEarned += playerCarreaux * GALET_CARREAU_BONUS;
            }

            const resultData = {
                won: isVictory,
                scores: { ...this.scores },
                playerCharacter: this.scene.playerCharacter,
                opponentCharacter: this.scene.opponentCharacter,
                terrainName: this.terrainType,
                returnScene: this.scene.returnScene || 'TitleScene',
                arcadeState: this.scene.arcadeState,
                galetsEarned,
                matchStats: {
                    menes: this.matchStats?.menesPlayed || this.mene,
                    fanny: isFanny,
                    bestMene: this.matchStats?.bestMeneScore || 0,
                    carreaux: playerCarreaux,
                    biberons: this.matchStats?.biberons?.player || 0,
                    shots: this.matchStats?.shots?.player || 0,
                    points_attempted: this.matchStats?.points?.player || 0,
                    bestBallDist: this.matchStats?.bestBallDist || Infinity,
                    opponentCarreaux: this.matchStats?.carreaux?.opponent || 0
                }
            };

            let redirected = false;
            const doRedirect = () => {
                if (redirected) return;
                redirected = true;
                this.scene.cameras.main.setZoom(1.0);
                this.scene.scene.start('ResultScene', resultData);
            };

            this.scene.time.delayedCall(GAME_OVER_REDIRECT_DELAY, doRedirect);

            // Allow skip with Space/Enter
            this.scene.input.keyboard.once('keydown-SPACE', doRedirect);
            this.scene.input.keyboard.once('keydown-ENTER', doRedirect);
            this.scene.input.once('pointerdown', doRedirect);
            return;
        }

        // Fallback overlay (no ResultScene redirect)
        this.renderer.showGameOverOverlay(isVictory, this.scores, isFanny);

        const shadow = { offsetX: 2, offsetY: 2, color: '#1A1510', blur: 0, fill: true };
        const hasReturnScene = !!this.scene.returnScene;
        const btnLabel = hasReturnScene ? (isVictory ? '[ CONTINUER ]' : '[ RETOUR ]') : '[ REJOUER ]';

        const btn = this.scene.add.text(
            this.scene.scale.width / 2, this.scene.scale.height / 2 + 70,
            btnLabel,
            {
                fontFamily: 'monospace', fontSize: '24px',
                color: '#F5E6D0', backgroundColor: '#C44B3F',
                padding: { x: 20, y: 10 }, shadow
            }
        ).setOrigin(0.5).setDepth(101).setInteractive({ useHandCursor: true });

        btn.on('pointerover', () => btn.setStyle({ backgroundColor: '#D4654A' }));
        btn.on('pointerout', () => btn.setStyle({ backgroundColor: '#C44B3F' }));
        btn.on('pointerdown', () => {
            if (hasReturnScene) {
                const returnScene = this.scene.scene.get(this.scene.returnScene);
                const isSleeping = returnScene && returnScene.scene
                    && returnScene.scene.settings
                    && returnScene.scene.settings.status === Phaser.Scenes.SLEEPING;

                if (isSleeping) {
                    this.scene.scene.stop();
                    this.scene.scene.wake(this.scene.returnScene);
                    if (returnScene.returnFromBattle) {
                        returnScene.returnFromBattle({ won: isVictory, opponentId: this.scene.opponentId });
                    }
                } else {
                    this.scene.scene.start(this.scene.returnScene);
                }
            } else {
                this.scene.scene.restart({
                    terrain: this.terrainType,
                    difficulty: this.scene.difficulty,
                    format: this.format
                });
            }
        });
    }

    calculateProjectedScore() {
        if (!this.cochonnet || !this.cochonnet.isAlive) return null;
        const aliveBalls = this.balls.filter(b => b.isAlive);
        if (aliveBalls.length === 0) return null;

        const playerDist = this._getMinDistance('player');
        const opponentDist = this._getMinDistance('opponent');

        if (playerDist === Infinity && opponentDist === Infinity) return null;
        if (playerDist === opponentDist) return { winner: null, points: 0 };

        let winner, loserDist;
        if (playerDist < opponentDist) {
            winner = 'player';
            loserDist = opponentDist;
        } else {
            winner = 'opponent';
            loserDist = playerDist;
        }

        const losingBallsAlive = this.balls.filter(b => b.team !== winner && b.team !== 'cochonnet' && b.isAlive);
        let points = 0;
        for (const ball of this.balls) {
            if (ball.team === winner && ball.isAlive) {
                if (losingBallsAlive.length === 0 || ball.distanceTo(this.cochonnet) < loserDist) {
                    points++;
                }
            }
        }

        return { winner, points };
    }

    update(delta) {
        // Hitstop: freeze physics during celebration
        if (this._hitstopUntil > 0 && Date.now() < this._hitstopUntil) return;
        this._hitstopUntil = 0;

        const allBodies = [...this.balls, this.cochonnet].filter(b => b && b.isAlive);

        // === SLOW-MOTION: check if any moving ball is near the cochonnet ===
        let shouldSlowMo = false;
        if (this.cochonnet && this.cochonnet.isAlive) {
            for (const ball of this.balls) {
                if (!ball.isAlive || !ball.isMoving) continue;
                const spd = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
                if (spd <= SPEED_THRESHOLD) continue; // not truly moving
                const dx = ball.x - this.cochonnet.x;
                const dy = ball.y - this.cochonnet.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < SLOWMO_DISTANCE && spd < SLOWMO_SPEED_THRESHOLD) {
                    shouldSlowMo = true;
                    break;
                }
            }
        }

        // Smooth lerp of timeScale
        const targetScale = shouldSlowMo ? SLOWMO_FACTOR : 1.0;
        this._timeScale += (targetScale - this._timeScale) * SLOWMO_LERP_SPEED;
        // Snap when close enough
        if (Math.abs(this._timeScale - targetScale) < 0.01) this._timeScale = targetScale;

        // Emit slow-mo events
        if (shouldSlowMo && !this._slowMoActive) {
            this._slowMoActive = true;
            this.scene.events.emit('slowmo-start');
        } else if (!shouldSlowMo && this._slowMoActive && this._timeScale > 0.95) {
            this._slowMoActive = false;
            this.scene.events.emit('slowmo-end');
        }

        // Apply time scale to delta
        delta *= this._timeScale;

        // Sub-stepping: fast balls need multiple small steps to avoid tunneling
        // A ball moving at speed 10+ can skip over a target between frames
        let maxSpeed = 0;
        for (const b of allBodies) {
            if (b.isMoving) {
                const spd = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
                if (spd > maxSpeed) maxSpeed = spd;
            }
        }
        // substeps = how many mini-steps we need so no ball moves more than 4px per step
        const subSteps = maxSpeed > 4 ? Math.min(Math.ceil(maxSpeed / 4), 8) : 1;
        const subDelta = delta / subSteps;

        let anyMoving = false;

        for (let step = 0; step < subSteps; step++) {
            // Update all balls physics
            for (const ball of allBodies) {
                ball.update(subDelta);
                if (ball.isMoving) anyMoving = true;
            }

            // Check collisions between all pairs
            for (let i = 0; i < allBodies.length; i++) {
                for (let j = i + 1; j < allBodies.length; j++) {
                    if (allBodies[i].isAlive && allBodies[j].isAlive) {
                        const ax = allBodies[i].x, ay = allBodies[i].y;
                        const bx = allBodies[j].x, by = allBodies[j].y;

                        const collided = Ball.resolveCollision(allBodies[i], allBodies[j]);

                        if (collided) {
                            const isVsCochonnet = allBodies[i].team === 'cochonnet' || allBodies[j].team === 'cochonnet';
                            if (isVsCochonnet) {
                                sfxBouleCochonnet();
                            } else {
                                sfxBouleBoule();
                                // Hit stop: brief freeze on boule-boule collision
                                this._hitstopUntil = Math.max(this._hitstopUntil, Date.now() + HITSTOP_BOULE_MS);
                            }
                            const mx = (allBodies[i].x + allBodies[j].x) / 2;
                            const my = (allBodies[i].y + allBodies[j].y) / 2;
                            this._spawnCollisionSparks(mx, my);
                            // Screen shake on boule-boule impact
                            this.scene.cameras.main.shake(60, 0.003);
                            // Dust at collision point
                            if (this._spawnDust) this._spawnDust(mx, my, 3);
                        }

                        if (collided && this.lastThrownBall) {
                            // Track carreau candidates + impact point + recoil detection
                            if (allBodies[i] === this.lastThrownBall) {
                                if (this._pendingCarreauChecks) {
                                    this._pendingCarreauChecks.push({
                                        thrownBall: allBodies[i],
                                        targetOrigX: bx, targetOrigY: by
                                    });
                                }
                                // Store impact point (target's pre-collision position)
                                if (!this._lastImpactPoint) {
                                    this._lastImpactPoint = { x: bx, y: by };
                                }
                                // Detect recoil: dot product of thrower velocity vs throw direction
                                const tb = this.lastThrownBall;
                                if (tb._throwDirX !== undefined) {
                                    const dot = tb.vx * tb._throwDirX + tb.vy * tb._throwDirY;
                                    if (dot < 0) tb._isRecoiling = true;
                                }
                            } else if (allBodies[j] === this.lastThrownBall) {
                                if (this._pendingCarreauChecks) {
                                    this._pendingCarreauChecks.push({
                                        thrownBall: allBodies[j],
                                        targetOrigX: ax, targetOrigY: ay
                                    });
                                }
                                if (!this._lastImpactPoint) {
                                    this._lastImpactPoint = { x: ax, y: ay };
                                }
                                const tb = this.lastThrownBall;
                                if (tb._throwDirX !== undefined) {
                                    const dot = tb.vx * tb._throwDirX + tb.vy * tb._throwDirY;
                                    if (dot < 0) tb._isRecoiling = true;
                                }
                            }
                            // Track all collisions for shot result detection
                            if (allBodies[i] === this.lastThrownBall && !this._shotCollisions.includes(allBodies[j])) {
                                this._shotCollisions.push(allBodies[j]);
                                // Store impact point (target's position at moment of collision) for palet detection
                                if (!this._lastImpactPoint) {
                                    this._lastImpactPoint = { x: allBodies[j].x, y: allBodies[j].y };
                                }
                            } else if (allBodies[j] === this.lastThrownBall && !this._shotCollisions.includes(allBodies[i])) {
                                this._shotCollisions.push(allBodies[i]);
                                if (!this._lastImpactPoint) {
                                    this._lastImpactPoint = { x: allBodies[i].x, y: allBodies[i].y };
                                }
                            }
                        }
                    }
                }
            }
        }

        // Rolling SFX + trail particles (throttled)
        this._rollSfxCooldown -= delta || 16;
        let rollingMaxSpeed = 0;
        for (const ball of allBodies) {
            if (ball.isAlive && ball.isMoving) {
                const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
                if (speed > rollingMaxSpeed) rollingMaxSpeed = speed;
                if (speed > 1 && this._rollSfxCooldown <= 0) {
                    sfxRoll();
                    this._rollSfxCooldown = 120;
                }
                if (speed > 1.5 && Math.random() < 0.3) {
                    this._spawnRollTrail(ball);
                }
            }
        }

        // Continuous rolling sound (Web Audio pink noise)
        if (rollingMaxSpeed > SPEED_THRESHOLD) {
            if (!this._rollingSoundActive) {
                startRollingSound();
                this._rollingSoundActive = true;
            }
            updateRollingSound(rollingMaxSpeed / MAX_THROW_SPEED);
        } else if (this._rollingSoundActive) {
            stopRollingSound();
            this._rollingSoundActive = false;
        }

        // Check bounds
        this._checkBoundsAll();

        // Update BEST indicator (now works in real-time!)
        this._updateBestIndicator();

        // If waiting for stop and everything stopped
        if (this.state === STATES.WAITING_STOP && !anyMoving) {
            // Stop rolling sound when all balls stop
            if (this._rollingSoundActive) {
                stopRollingSound();
                this._rollingSoundActive = false;
            }

            // Trigger reaction animations
            if (this.onAfterStop) this.onAfterStop(this.lastTeamPlayed);

            if (this._afterStopCallback) {
                const cb = this._afterStopCallback;
                this._afterStopCallback = null;
                cb();
            }
        }
    }

    _checkCarreau() {
        if (!this._pendingCarreauChecks || !this.lastThrownBall) return;
        // Le carreau n'existe qu'au tir (pas au pointage)
        if (!this.lastShotWasTir) { this._pendingCarreauChecks = []; return; }

        for (const check of this._pendingCarreauChecks) {
            if (!check.thrownBall.isAlive) continue;
            const dx = check.thrownBall.x - check.targetOrigX;
            const dy = check.thrownBall.y - check.targetOrigY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist <= CARREAU_THRESHOLD) {
                this._celebrateCarreau(check.thrownBall);
                break;
            }
        }
        this._pendingCarreauChecks = [];
    }

    _celebrateCarreau(ball) {
        // Track carreau stat
        if (this.matchStats && ball.team) {
            this.matchStats.carreaux[ball.team]++;
        }

        // Hitstop
        this._hitstopUntil = Date.now() + HITSTOP_CARREAU_MS;

        // SFX + visuals + stronger shake for carreau
        sfxCarreau();
        this.scene.cameras.main.shake(120, 0.006);
        this.renderer.celebrateCarreau(ball);
    }

    // --- SHOT RESULT DETECTION (discreet feedback) ---
    // Priority: Contre > Trou > Ciseau > Carreau (separate) > Casquette > Blessee > Palet > Recul
    _detectShotResult() {
        if (!this.lastThrownBall || !this.lastThrownBall.isAlive) return;
        if (!this.cochonnet || !this.cochonnet.isAlive) return;

        const ball = this.lastThrownBall;
        const isTir = this.lastShotWasTir;
        const hitBalls = this._shotCollisions || [];

        // Track best ball distance
        if (!isTir && this.matchStats && ball.team === 'player') {
            const d = ball.distanceTo(this.cochonnet);
            if (d < this.matchStats.bestBallDist) {
                this.matchStats.bestBallDist = d;
            }
        }

        // === POINTAGE : Biberon ===
        if (!isTir) {
            const distToCoch = ball.distanceTo(this.cochonnet);
            if (distToCoch <= ball.radius + this.cochonnet.radius + 2) {
                if (this.matchStats && ball.team) this.matchStats.biberons[ball.team]++;
                this._showShotLabel(ball, 'BIBERON !', '#FFD700', 14);
            }
            this._shotCollisions = [];
            return;
        }

        // === TIR : analyse complete ===

        // Trou : tir rate, aucune collision
        if (hitBalls.length === 0) {
            this._showShotLabel(ball, '...', '#888888', 11);
            this._shotCollisions = [];
            return;
        }

        // Contre : touche une boule alliee
        const hitAllied = hitBalls.filter(b => b.team === ball.team && b.team !== 'cochonnet');
        if (hitAllied.length > 0) {
            this._showShotLabel(ball, 'Contre !', '#C44B3F', 13);
            this._shotCollisions = [];
            return;
        }

        const hitEnemy = hitBalls.filter(b => b.team !== ball.team && b.team !== 'cochonnet');

        // Ciseau : touche 2+ boules adverses
        if (hitEnemy.length >= 2) {
            this._showShotLabel(ball, 'CISEAU !!', '#FFD700', 16);
            this.scene.cameras.main.shake(120, 0.005);
            this._shotCollisions = [];
            return;
        }

        // Analyse du tir contre une seule cible
        if (hitEnemy.length === 1) {
            const target = hitEnemy[0];
            const targetSpeed = Math.sqrt(target.vx ** 2 + target.vy ** 2);
            const throwerSpeed = Math.sqrt(ball.vx ** 2 + ball.vy ** 2);

            // Casquette : cible a a peine bouge
            if (targetSpeed < CASQUETTE_MAX_SPEED) {
                this._showShotLabel(ball, 'Casquette...', '#888888', 12);
                this._shotCollisions = [];
                return;
            }

            // Blessee : cible a un peu bouge mais pas assez
            if (targetSpeed < BLESSER_MAX_SPEED) {
                this._showShotLabel(ball, 'Blessee...', '#AA8866', 12);
                this._shotCollisions = [];
                return;
            }

            // Carreau est deja detecte separement dans _checkCarreau/_celebrateCarreau

            // Palet CORRIGE : boule tiree reste pres du POINT D'IMPACT (pas du cochonnet)
            const impactPoint = this._lastImpactPoint;
            if (impactPoint) {
                const dxImpact = ball.x - impactPoint.x;
                const dyImpact = ball.y - impactPoint.y;
                const distFromImpact = Math.sqrt(dxImpact * dxImpact + dyImpact * dyImpact);

                if (distFromImpact > CARREAU_THRESHOLD && distFromImpact < PALET_THRESHOLD) {
                    this._showShotLabel(ball, 'Palet !', '#C0C0C0', 13);
                    this._shotCollisions = [];
                    return;
                }
            }

            // Recul CORRIGE : detection basee sur la direction, PAS d'amplification de vitesse
            // Le recul existe naturellement grace au COR 0.62 — on le detecte et le nomme, c'est tout
            if (throwerSpeed > 0.3) {
                const dx = target.x - ball.x;
                const dy = target.y - ball.y;
                const dot = ball.vx * dx + ball.vy * dy;
                if (dot < 0) {
                    // Thrower moving backward = recul naturel
                    // Mark ball as recoiling for backspin interaction
                    ball._isRecoiling = true;
                    this._showShotLabel(ball, 'Recul', '#D4A574', 12);
                    this._shotCollisions = [];
                    return;
                }
            }
        }

        this._shotCollisions = [];
    }

    _showShotLabel(ball, text, color, fontSize) {
        this.renderer.showShotLabel(ball, text, color, fontSize);
    }

    _updateBestIndicator() {
        this.renderer.updateBestIndicator(this.balls, this.cochonnet);
    }

    _triggerAI() {
        if (this.scene.localMultiplayer) {
            // Local multiplayer: enable aiming for the opponent player too
            this.aimingEnabled = true;
            return;
        }
        if (this.scene.ai) {
            this.scene.ai.takeTurn();
        }
    }

    _showAimHint() {
        this.renderer.showAimHint();
    }

    _showMessage(text, persistent = false) {
        this.renderer.showMessage(text, persistent);
    }
    // --- VISUAL EFFECTS (delegated to EngineRenderer) ---
    _spawnDust(x, y, count = 6) {
        this.renderer.spawnDust(x, y, count, this.terrainType);
    }

    _spawnCollisionSparks(x, y) {
        this.renderer.spawnCollisionSparks(x, y);
    }

    _spawnRollTrail(ball) {
        this.renderer.spawnRollTrail(ball, this.terrainType);
    }

    _drawImpactTrace(x, y, radius) {
        this.renderer.drawImpactTrace(x, y, radius, this.bounds);
    }

    // --- BOULE STATS from boules.json ---
    _getBouleStats(team) {
        const bouleType = team === 'player'
            ? (this.scene.bouleType || this.scene.registry?.get('gameState')?.bouleType)
            : null;
        const boulesData = this.scene.cache?.json?.get('boules');
        if (boulesData && bouleType) {
            const set = boulesData.sets?.find(s => s.id === bouleType);
            if (set) {
                const colorNum = parseInt(set.color.replace('#', ''), 16);
                const bonus = set.bonus || '';
                // Parse bonus string into multipliers
                let frictionMult = 1, retroBonus = 1, restitutionMult = 1, knockbackMult = 1;
                if (bonus.startsWith('friction_x')) frictionMult = parseFloat(bonus.split('x')[1]) || 1;
                if (bonus.startsWith('retro_x')) retroBonus = parseFloat(bonus.split('x')[1]) || 1;
                if (bonus.startsWith('restitution_x')) restitutionMult = parseFloat(bonus.split('x')[1]) || 1;
                if (bonus.startsWith('knockback_x')) knockbackMult = parseFloat(bonus.split('x')[1]) || 1;
                return {
                    mass: set.stats.masse,
                    radius: set.stats.rayon,
                    color: colorNum,
                    textureKey: set.textureKey || null,
                    frictionMult,
                    retroBonus,
                    restitutionMult,
                    knockbackMult
                };
            }
        }
        return {};
    }

}

export { STATES };
