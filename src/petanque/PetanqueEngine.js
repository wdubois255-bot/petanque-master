import Ball from './Ball.js';
import Cochonnet from './Cochonnet.js';
import {
    VICTORY_SCORE, BALL_COLORS, BALL_RADIUS,
    COCHONNET_MIN_DIST, COCHONNET_MAX_DIST,
    THROW_CIRCLE_RADIUS, MAX_THROW_SPEED,
    LANDING_FACTOR_POINT, ROLLING_EFFICIENCY, FRICTION_BASE,
    THROW_FLY_DURATION, THROW_SHAKE_INTENSITY, THROW_SHAKE_DURATION,
    TERRAIN_WIDTH, TERRAIN_HEIGHT,
    LOFT_DEMI_PORTEE, LOFT_TIR,
    CARREAU_THRESHOLD, CARREAU_DISPLACED_MIN, PIXELS_TO_METERS
} from '../utils/Constants.js';
import {
    sfxBouleBoule, sfxBouleCochonnet, sfxLanding, sfxRoll,
    sfxCarreau, sfxThrow, sfxVictory, sfxDefeat, sfxScore
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

        this.state = null;
        this.balls = [];
        this.cochonnet = null;
        this.currentTeam = 'player';
        this.lastTeamPlayed = null;

        // Balls per player based on format
        this.ballsPerPlayer = this.format === 'triplette' ? 2 : 3;

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

        // Point indicator
        this._lastBestBallId = null;
        this._bestPulse = { t: 0 };

        // Rolling SFX throttle
        this._rollSfxCooldown = 0;

        // Dramatic zoom state
        this._zoomActive = false;
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
        this.meneWinner = null;

        this.setState(STATES.COCHONNET_THROW);
    }

    setState(state) {
        this.state = state;
        this.aimingEnabled = false;

        if (this.onStateChange) this.onStateChange(state);

        switch (state) {
            case STATES.COCHONNET_THROW:
                this.currentTeam = 'player';
                this.aimingEnabled = true;
                this._showMessage('Lancez le cochonnet !');
                this._showAimHint();
                if (this.onTurnChange) this.onTurnChange('player');
                break;

            case STATES.FIRST_BALL:
                this.currentTeam = 'player';
                this.aimingEnabled = true;
                this._showMessage('Lancez votre premiere boule !');
                if (this.onTurnChange) this.onTurnChange('player');
                break;

            case STATES.SECOND_TEAM_FIRST:
                this.currentTeam = 'opponent';
                this._showMessage('Tour de l\'adversaire');
                if (this.onTurnChange) this.onTurnChange('opponent');
                this._triggerAI();
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
            this._showMessage('A vous de jouer !');
        } else {
            this._showMessage('Tour de l\'adversaire');
            this._triggerAI();
        }

        if (this.onTurnChange) this.onTurnChange(this.currentTeam);
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

        // Clamp within terrain (with margin)
        const margin = 20;
        const clampedX = Phaser.Math.Clamp(targetX, this.bounds.x + margin, this.bounds.x + this.bounds.w - margin);
        const clampedY = Phaser.Math.Clamp(targetY, this.bounds.y + margin, this.bounds.y + this.bounds.h - margin);

        this.cochonnet = new Cochonnet(this.scene, cx, cy, this.frictionMult);

        // Animate fly
        this._animateThrow(this.cochonnet, clampedX, clampedY, 0, 0, () => {
            this.setState(STATES.FIRST_BALL);
        });
    }

    static computeThrowParams(angle, power, originX, originY, bounds, loftPreset, frictionMult) {
        const isTir = loftPreset.id === 'tir';
        const maxDist = TERRAIN_HEIGHT * (isTir ? 0.95 : 0.85);
        const totalDist = power * maxDist;
        const landDist = totalDist * loftPreset.landingFactor;
        const rollDist = totalDist * (1 - loftPreset.landingFactor);

        const rawTargetX = originX + Math.cos(angle) * landDist;
        const rawTargetY = originY + Math.sin(angle) * landDist;

        const margin = 16;
        const targetX = Phaser.Math.Clamp(rawTargetX, bounds.x + margin, bounds.x + bounds.w - margin);
        const targetY = Phaser.Math.Clamp(rawTargetY, bounds.y + margin, bounds.y + bounds.h - margin);

        const perFrameFriction = FRICTION_BASE * frictionMult;
        const rollingSpeed = Math.sqrt(2 * perFrameFriction * rollDist * loftPreset.rollEfficiency);
        const rollVx = Math.cos(angle) * rollingSpeed;
        const rollVy = Math.sin(angle) * rollingSpeed;

        return { targetX, targetY, rollVx, rollVy };
    }

    throwBall(angle, power, team, shotMode = 'pointer', loftPreset = null) {
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
            id: `${team}_${this.ballsPerPlayer - this.remaining[team]}`
        });
        this.balls.push(ball);
        this.remaining[team]--;
        this.lastTeamPlayed = team;
        this.lastThrownBall = ball;
        this.lastShotWasTir = shotMode === 'tirer';
        this._pendingCarreauChecks = [];

        // Resolve loft preset
        const isTir = shotMode === 'tirer';
        const loft = loftPreset || (isTir ? LOFT_TIR : LOFT_DEMI_PORTEE);

        const { targetX, targetY, rollVx, rollVy } =
            PetanqueEngine.computeThrowParams(angle, power, cx, cy, this.bounds, loft, this.frictionMult);

        // SFX throw swoosh
        sfxThrow();

        // Notify scene for character throw animation
        if (this.onThrow) this.onThrow(team);

        // Animate fly then physics
        this._animateThrow(ball, targetX, targetY, rollVx, rollVy, () => {
            this.setState(STATES.WAITING_STOP);
            this._afterStopCallback = () => {
                this._checkCarreau();
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
            const scale = ball.radius / 14;
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
                    flySprite.setScale((ball.radius / 14) * sizeBoost);

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
                            const minSpeed = 2.0; // Minimum impact speed
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
                this.scene.cameras.main.shake(shakeDuration, shakeIntensity / 1000);

                if (isTir) {
                    // Flash on tir impact
                    const flash = this.scene.add.graphics().setDepth(60);
                    flash.fillStyle(0xFFFFFF, 0.6);
                    flash.fillCircle(targetX, targetY, ball.radius + 4);
                    this.scene.tweens.add({
                        targets: flash, alpha: 0, duration: 200,
                        onComplete: () => flash.destroy()
                    });
                }

                // Dust proportional to technique (more for plombee, less for roulette)
                const dustCount = isRoulette ? 2 : isPlombee ? 10 : isTir ? 8 : 6;
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
        for (const ball of this.balls) {
            if (ball.isAlive && ball.checkOutOfBounds(this.bounds)) {
                ball.kill();
            }
        }
        if (this.cochonnet && this.cochonnet.isAlive && this.cochonnet.checkOutOfBounds(this.bounds)) {
            this.cochonnet.kill();
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

        const winnerName = winner === 'player' ? 'Vous gagnez' : 'L\'adversaire gagne';
        this._showMessage(`${winnerName} ${points} point${points > 1 ? 's' : ''} !`);

        sfxScore();
        if (this.onScore) this.onScore(this.scores, winner, points);

        this.scene.time.delayedCall(2500, () => {
            if (this.scores.player >= VICTORY_SCORE || this.scores.opponent >= VICTORY_SCORE) {
                this.setState(STATES.GAME_OVER);
            } else {
                this.mene++;
                this.startMene();
            }
        });
    }

    _handleMeneDead() {
        // Cochonnet sorti = mene morte
        const playerRemaining = this.remaining.player;
        const opponentRemaining = this.remaining.opponent;

        if (playerRemaining > 0 && opponentRemaining === 0) {
            this.scores.player += playerRemaining;
            this._showMessage(`Mene morte ! Vous gagnez ${playerRemaining} point(s) !`);
        } else if (opponentRemaining > 0 && playerRemaining === 0) {
            this.scores.opponent += opponentRemaining;
            this._showMessage(`Mene morte ! L'adversaire gagne ${opponentRemaining} point(s) !`);
        } else {
            this._showMessage('Mene morte ! 0 points.');
        }

        if (this.onScore) this.onScore(this.scores, null, 0);

        this.scene.time.delayedCall(2500, () => {
            if (this.scores.player >= VICTORY_SCORE || this.scores.opponent >= VICTORY_SCORE) {
                this.setState(STATES.GAME_OVER);
            } else {
                this.mene++;
                this.startMene();
            }
        });
    }

    _handleGameOver() {
        const winner = this.scores.player >= VICTORY_SCORE ? 'player' : 'opponent';
        const isVictory = winner === 'player';
        const shadow = { offsetX: 2, offsetY: 2, color: '#1A1510', blur: 0, fill: true };

        // SFX victory/defeat
        if (isVictory) sfxVictory(); else sfxDefeat();

        // Overlay sombre
        const overlay = this.scene.add.graphics().setDepth(90);
        overlay.fillStyle(0x3A2E28, 0.7);
        overlay.fillRect(0, 0, this.scene.scale.width, this.scene.scale.height);

        // Title
        const titleMsg = isVictory ? 'VICTOIRE !' : 'DEFAITE...';
        this.scene.add.text(
            this.scene.scale.width / 2, this.scene.scale.height / 2 - 80,
            titleMsg,
            {
                fontFamily: 'monospace', fontSize: '40px',
                color: isVictory ? '#FFD700' : '#C44B3F',
                align: 'center',
                shadow: { offsetX: 3, offsetY: 3, color: '#1A1510', blur: 0, fill: true }
            }
        ).setOrigin(0.5).setDepth(101);

        // Subtitle
        const subMsg = isVictory ? 'Vous etes le Petanque Master !' : 'L\'adversaire l\'emporte.';
        this.scene.add.text(
            this.scene.scale.width / 2, this.scene.scale.height / 2 - 40,
            subMsg,
            { fontFamily: 'monospace', fontSize: '20px', color: '#F5E6D0', align: 'center', shadow }
        ).setOrigin(0.5).setDepth(101);

        // Score final
        const scoreText = `${this.scores.player} - ${this.scores.opponent}`;
        this.scene.add.text(
            this.scene.scale.width / 2, this.scene.scale.height / 2 + 10,
            scoreText,
            { fontFamily: 'monospace', fontSize: '36px', color: '#F5E6D0', align: 'center', shadow }
        ).setOrigin(0.5).setDepth(101);

        // Bouton principal
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
                this.scene.scene.stop();
                this.scene.scene.wake(this.scene.returnScene);
                if (returnScene && returnScene.returnFromBattle) {
                    returnScene.returnFromBattle({ won: isVictory, opponentId: this.scene.opponentId });
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
                            }
                            const mx = (allBodies[i].x + allBodies[j].x) / 2;
                            const my = (allBodies[i].y + allBodies[j].y) / 2;
                            this._spawnCollisionSparks(mx, my);
                        }

                        if (collided && this.lastThrownBall && this._pendingCarreauChecks) {
                            if (allBodies[i] === this.lastThrownBall) {
                                this._pendingCarreauChecks.push({
                                    thrownBall: allBodies[i],
                                    targetOrigX: bx, targetOrigY: by
                                });
                            } else if (allBodies[j] === this.lastThrownBall) {
                                this._pendingCarreauChecks.push({
                                    thrownBall: allBodies[j],
                                    targetOrigX: ax, targetOrigY: ay
                                });
                            }
                        }
                    }
                }
            }
        }

        // Rolling SFX + trail particles (throttled)
        this._rollSfxCooldown -= delta || 16;
        for (const ball of allBodies) {
            if (ball.isAlive && ball.isMoving) {
                const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
                if (speed > 1 && this._rollSfxCooldown <= 0) {
                    sfxRoll();
                    this._rollSfxCooldown = 120;
                }
                if (speed > 1.5 && Math.random() < 0.3) {
                    this._spawnRollTrail(ball);
                }
            }
        }

        // Check bounds
        this._checkBoundsAll();

        // Update BEST indicator (now works in real-time!)
        this._updateBestIndicator();

        // If waiting for stop and everything stopped
        if (this.state === STATES.WAITING_STOP && !anyMoving) {
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
        // Hitstop
        this._hitstopUntil = Date.now() + 100;

        // SFX carreau
        sfxCarreau();

        // Screen shake
        this.scene.cameras.main.shake(250, 0.004);

        // Flash
        this.scene.cameras.main.flash(80, 255, 255, 255);

        // "CARREAU !" text
        const txt = this.scene.add.text(ball.x, ball.y - 30, 'CARREAU !', {
            fontFamily: 'monospace', fontSize: '24px', color: '#FFD700',
            shadow: { offsetX: 2, offsetY: 2, color: '#1A1510', blur: 0, fill: true }
        }).setOrigin(0.5).setDepth(65);

        this.scene.tweens.add({
            targets: txt,
            y: txt.y - 50, alpha: 0, scaleX: 1.5, scaleY: 1.5,
            duration: 1500, ease: 'Cubic.easeOut',
            onComplete: () => txt.destroy()
        });

        // Radial particles (gold sparks)
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const spark = this.scene.add.graphics().setDepth(64);
            spark.fillStyle(0xFFD700, 1);
            spark.fillCircle(0, 0, 4);
            spark.setPosition(ball.x, ball.y);
            this.scene.tweens.add({
                targets: spark,
                x: ball.x + Math.cos(angle) * 36,
                y: ball.y + Math.sin(angle) * 36,
                alpha: 0, duration: 500,
                onComplete: () => spark.destroy()
            });
        }
    }

    _updateBestIndicator() {
        if (!this._bestGfx) {
            this._bestGfx = this.scene.add.graphics().setDepth(10);
            // Pulse tween
            this.scene.tweens.add({
                targets: this._bestPulse,
                t: 1, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
            });
        }
        this._bestGfx.clear();

        if (!this.cochonnet || !this.cochonnet.isAlive) return;
        if (this.balls.filter(b => b.isAlive).length === 0) return;

        let bestBall = null;
        let bestDist = Infinity;
        for (const ball of this.balls) {
            if (!ball.isAlive) continue;
            const d = ball.distanceTo(this.cochonnet);
            if (d < bestDist) {
                bestDist = d;
                bestBall = ball;
            }
        }

        if (bestBall) {
            const color = bestBall.team === 'player' ? 0x44CC44 : 0xCC4444;
            const t = this._bestPulse.t;
            const alpha = 0.4 + t * 0.4;
            const radius = bestBall.radius + 3 + t * 2;

            this._bestGfx.lineStyle(1.5, color, alpha);
            this._bestGfx.strokeCircle(bestBall.x, bestBall.y, radius);

            // Detect point change and flash
            if (bestBall.id !== this._lastBestBallId) {
                if (this._lastBestBallId !== null) {
                    // Point changed! Flash ring animation
                    const flash = this.scene.add.graphics().setDepth(11);
                    const flashColor = color;
                    const fx = bestBall.x, fy = bestBall.y;
                    const anim = { s: 1 };
                    this.scene.tweens.add({
                        targets: anim, s: 2.5, duration: 350, ease: 'Cubic.easeOut',
                        onUpdate: () => {
                            flash.clear();
                            flash.lineStyle(2, flashColor, 0.8 * (1 - (anim.s - 1) / 1.5));
                            flash.strokeCircle(fx, fy, (bestBall.radius + 3) * anim.s);
                        },
                        onComplete: () => flash.destroy()
                    });
                }
                this._lastBestBallId = bestBall.id;
            }
        }
    }

    _triggerAI() {
        if (this.scene.ai) {
            this.scene.ai.takeTurn();
        }
    }

    _showAimHint() {
        if (this._aimHintShown) return;
        this._aimHintShown = true;

        const hint = this.scene.add.text(
            this.scene.scale.width / 2,
            this.scene.scale.height - 28,
            'Glissez et relachez pour viser',
            {
                fontFamily: 'monospace', fontSize: '18px',
                color: '#F5E6D0', align: 'center',
                backgroundColor: '#3A2E28', padding: { x: 12, y: 6 },
                shadow: { offsetX: 2, offsetY: 2, color: '#1A1510', blur: 0, fill: true }
            }
        ).setOrigin(0.5).setDepth(100);

        this.scene.time.delayedCall(5000, () => {
            this.scene.tweens.add({
                targets: hint, alpha: 0, duration: 600,
                onComplete: () => hint.destroy()
            });
        });
    }

    _showMessage(text, persistent = false) {
        if (this._msgText) this._msgText.destroy();

        this._msgText = this.scene.add.text(
            this.scene.scale.width / 2,
            24,
            text,
            {
                fontFamily: 'monospace',
                fontSize: '20px',
                color: '#F5E6D0',
                align: 'center',
                backgroundColor: '#3A2E28',
                padding: { x: 12, y: 6 },
                shadow: { offsetX: 2, offsetY: 2, color: '#1A1510', blur: 0, fill: true }
            }
        ).setOrigin(0.5, 0).setDepth(100);

        if (!persistent) {
            this.scene.time.delayedCall(2000, () => {
                if (this._msgText) this._msgText.destroy();
                this._msgText = null;
            });
        }
    }
    // --- DUST PARTICLES (landing) ---
    _spawnDust(x, y, count = 6) {
        const terrainColors = {
            terre: [0xC4854A, 0xA87040, 0xD4955A],
            herbe: [0x6B8E4E, 0x5E8A44, 0x7BA65E],
            sable: [0xE8D5B7, 0xD4C0A0, 0xF0E0C8],
            dalles: [0x9E9E8E, 0x808070, 0xB0A090]
        };
        const colors = terrainColors[this.terrainType] || terrainColors.terre;

        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
            const dist = 8 + Math.random() * 16;
            const color = colors[Math.floor(Math.random() * colors.length)];
            const size = 2 + Math.random() * 3;

            const p = this.scene.add.graphics().setDepth(8);
            p.fillStyle(color, 0.7);
            p.fillCircle(0, 0, size);
            p.setPosition(x, y);

            this.scene.tweens.add({
                targets: p,
                x: x + Math.cos(angle) * dist,
                y: y + Math.sin(angle) * dist - 8,
                alpha: 0,
                duration: 300 + Math.random() * 200,
                ease: 'Quad.easeOut',
                onComplete: () => p.destroy()
            });
        }
    }

    // --- COLLISION SPARKS ---
    _spawnCollisionSparks(x, y) {
        for (let i = 0; i < 5; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 6 + Math.random() * 12;
            const spark = this.scene.add.graphics().setDepth(55);
            spark.fillStyle(0xFFFFFF, 0.8);
            spark.fillCircle(0, 0, 1.5);
            spark.setPosition(x, y);

            this.scene.tweens.add({
                targets: spark,
                x: x + Math.cos(angle) * dist,
                y: y + Math.sin(angle) * dist,
                alpha: 0,
                duration: 200,
                onComplete: () => spark.destroy()
            });
        }
    }

    // --- ROLLING TRAIL PARTICLES ---
    _spawnRollTrail(ball) {
        const color = this.terrainType === 'sable' ? 0xE8D5B7
            : this.terrainType === 'herbe' ? 0x6B8E4E
            : this.terrainType === 'dalles' ? 0x9E9E8E
            : 0xC4854A;

        const p = this.scene.add.graphics().setDepth(3);
        p.fillStyle(color, 0.3);
        p.fillCircle(0, 0, 2);
        p.setPosition(ball.x, ball.y);

        this.scene.tweens.add({
            targets: p,
            alpha: 0,
            duration: 400,
            onComplete: () => p.destroy()
        });
    }

    // --- IMPACT TRACES on terrain ---
    _drawImpactTrace(x, y, radius) {
        if (!this.scene.impactLayer) return;
        const crater = this.scene.add.graphics();
        crater.fillStyle(0x000000, 0.15);
        crater.fillCircle(0, 0, radius + 2);
        this.scene.impactLayer.draw(crater, x - this.bounds.x, y - this.bounds.y);
        crater.destroy();
    }

    // --- BOULE STATS from boules.json ---
    _getBouleStats(team) {
        if (team === 'player') {
            const gameState = this.scene.registry?.get('gameState');
            const bouleType = gameState?.bouleType;
            const boulesData = this.scene.cache?.json?.get('boules');
            if (boulesData && bouleType) {
                const set = boulesData.sets?.find(s => s.id === bouleType);
                if (set) {
                    const colorNum = parseInt(set.color.replace('#', ''), 16);
                    return {
                        mass: set.stats.masse,
                        radius: set.stats.rayon,
                        color: colorNum,
                        frictionMult: set.bonus === 'friction_x0.9' ? 0.9 : 1
                    };
                }
            }
        }
        return {};
    }

}

export { STATES };
