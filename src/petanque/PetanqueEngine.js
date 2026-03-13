import Ball from './Ball.js';
import Cochonnet from './Cochonnet.js';
import {
    VICTORY_SCORE, BALL_COLORS, BALL_RADIUS,
    COCHONNET_MIN_DIST, COCHONNET_MAX_DIST,
    THROW_CIRCLE_RADIUS, MAX_THROW_SPEED,
    LANDING_FACTOR_POINT, ROLLING_EFFICIENCY, FRICTION_BASE,
    THROW_FLY_DURATION, THROW_SHAKE_INTENSITY, THROW_SHAKE_DURATION,
    TERRAIN_WIDTH, TERRAIN_HEIGHT
} from '../utils/Constants.js';

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

        // Aiming enabled flag
        this.aimingEnabled = false;

        // After-throw callback queue
        this._afterStopCallback = null;
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
                break;

            case STATES.FIRST_BALL:
                this.currentTeam = 'player';
                this.aimingEnabled = true;
                this._showMessage('Lancez votre premiere boule !');
                break;

            case STATES.SECOND_TEAM_FIRST:
                this.currentTeam = 'opponent';
                this._showMessage('Tour de l\'adversaire');
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
        const margin = 10;
        const clampedX = Phaser.Math.Clamp(targetX, this.bounds.x + margin, this.bounds.x + this.bounds.w - margin);
        const clampedY = Phaser.Math.Clamp(targetY, this.bounds.y + margin, this.bounds.y + this.bounds.h - margin);

        this.cochonnet = new Cochonnet(this.scene, cx, cy, this.frictionMult);

        // Animate fly
        this._animateThrow(this.cochonnet, clampedX, clampedY, 0, 0, () => {
            this.setState(STATES.FIRST_BALL);
        });
    }

    throwBall(angle, power, team, shotMode = 'pointer') {
        if (this.remaining[team] <= 0) return;

        const cx = this.scene.throwCircleX;
        const cy = this.scene.throwCircleY;
        const color = team === 'player' ? BALL_COLORS.player : BALL_COLORS.opponent;

        const ball = new Ball(this.scene, cx, cy, {
            color,
            team,
            frictionMult: this.frictionMult,
            id: `${team}_${this.ballsPerPlayer - this.remaining[team]}`
        });
        this.balls.push(ball);
        this.remaining[team]--;
        this.lastTeamPlayed = team;

        // Calculate landing point and rolling velocity
        // Power maps to total distance: 0 = short, 1 = max terrain length
        // Tir = more energy in flight (flatter arc), less rolling
        // Point = high arc, more rolling
        const isTir = shotMode === 'tirer';
        const landingFactor = isTir ? LANDING_FACTOR_TIR : LANDING_FACTOR_POINT;
        const maxDist = TERRAIN_HEIGHT * (isTir ? 0.95 : 0.85);
        const totalDist = power * maxDist;
        const landDist = totalDist * landingFactor;
        const rollDist = totalDist * (1 - landingFactor);

        const rawTargetX = cx + Math.cos(angle) * landDist;
        const rawTargetY = cy + Math.sin(angle) * landDist;

        // Clamp landing inside terrain
        const margin = 8;
        const targetX = Phaser.Math.Clamp(rawTargetX, this.bounds.x + margin, this.bounds.x + this.bounds.w - margin);
        const targetY = Phaser.Math.Clamp(rawTargetY, this.bounds.y + margin, this.bounds.y + this.bounds.h - margin);

        // Rolling velocity: derive speed from desired roll distance and friction
        // Tir: much higher rolling speed (carries through on impact)
        // Point: gentle rolling
        const perFrameFriction = FRICTION_BASE * this.frictionMult;
        const rollEfficiency = isTir ? 1.2 : ROLLING_EFFICIENCY;
        const rollingSpeed = Math.sqrt(2 * perFrameFriction * rollDist * rollEfficiency);
        const rollVx = Math.cos(angle) * rollingSpeed;
        const rollVy = Math.sin(angle) * rollingSpeed;

        // Animate fly then physics
        this._animateThrow(ball, targetX, targetY, rollVx, rollVy, () => {
            this.setState(STATES.WAITING_STOP);
            this._afterStopCallback = () => {
                this._checkBoundsAll();
                if (!this.cochonnet.isAlive) {
                    this.setState(STATES.MENE_DEAD);
                } else {
                    this.setState(STATES.PLAY_LOOP);
                }
            };
        }, isTir);
    }

    _animateThrow(ball, targetX, targetY, rollVx, rollVy, callback, isTir = false) {
        // Fly tween
        const startX = ball.x;
        const startY = ball.y;

        // Hide original during fly, use a tween circle
        const flyGfx = this.scene.add.graphics();
        const shadowGfx = this.scene.add.graphics();
        ball.gfx.setVisible(false);
        ball.shadow.setVisible(false);

        // Tir = fast flat trajectory, Point = high arc (plombee)
        const flyDuration = isTir ? THROW_FLY_DURATION * 0.7 : THROW_FLY_DURATION * 1.2;
        const arcHeight = isTir ? -8 : -30; // Tir: rasant, Point: cloche
        const ease = isTir ? 'Linear' : 'Quad.easeOut';

        const tween = { t: 0 };
        this.scene.tweens.add({
            targets: tween,
            t: 1,
            duration: flyDuration,
            ease,
            onUpdate: () => {
                const cx = Phaser.Math.Linear(startX, targetX, tween.t);
                const cy = Phaser.Math.Linear(startY, targetY, tween.t);
                // Arc: sin curve, height depends on tir/point
                const arc = arcHeight * Math.sin(tween.t * Math.PI);

                flyGfx.clear();
                flyGfx.fillStyle(ball.color, 1);
                flyGfx.fillCircle(cx, cy + arc, ball.radius);
                // Highlight
                flyGfx.fillStyle(0xFFFFFF, 0.3);
                flyGfx.fillCircle(cx - ball.radius * 0.3, cy + arc - ball.radius * 0.3, ball.radius * 0.3);

                // Shadow: for tir, shadow stays close (low flight); for point, shadow starts small
                shadowGfx.clear();
                const shadowScale = isTir ? (0.6 + tween.t * 0.4) : (0.2 + tween.t * 0.8);
                shadowGfx.fillStyle(0x000000, 0.15 * shadowScale);
                shadowGfx.fillCircle(cx, cy, ball.radius * shadowScale);
            },
            onComplete: () => {
                flyGfx.destroy();
                shadowGfx.destroy();

                ball.x = targetX;
                ball.y = targetY;
                ball.gfx.setVisible(true);
                ball.shadow.setVisible(true);
                ball.draw();

                // Screen shake: stronger for tir (impact!)
                const shakeIntensity = isTir ? THROW_SHAKE_INTENSITY * 2 : THROW_SHAKE_INTENSITY;
                const shakeDuration = isTir ? THROW_SHAKE_DURATION * 1.5 : THROW_SHAKE_DURATION;
                this.scene.cameras.main.shake(shakeDuration, shakeIntensity / 1000);

                // Impact flash for tir
                if (isTir) {
                    const flash = this.scene.add.graphics().setDepth(60);
                    flash.fillStyle(0xFFFFFF, 0.6);
                    flash.fillCircle(targetX, targetY, ball.radius + 4);
                    this.scene.tweens.add({
                        targets: flash, alpha: 0, duration: 200,
                        onComplete: () => flash.destroy()
                    });
                }

                // Apply rolling velocity
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
        const shadow = { offsetX: 1, offsetY: 1, color: '#1A1510', blur: 0, fill: true };

        // Overlay sombre
        const overlay = this.scene.add.graphics().setDepth(90);
        overlay.fillStyle(0x3A2E28, 0.7);
        overlay.fillRect(0, 0, this.scene.scale.width, this.scene.scale.height);

        // Title
        const titleMsg = isVictory ? 'VICTOIRE !' : 'DEFAITE...';
        this.scene.add.text(
            this.scene.scale.width / 2, this.scene.scale.height / 2 - 40,
            titleMsg,
            {
                fontFamily: 'monospace', fontSize: '20px',
                color: isVictory ? '#FFD700' : '#C44B3F',
                align: 'center',
                shadow: { offsetX: 2, offsetY: 2, color: '#1A1510', blur: 0, fill: true }
            }
        ).setOrigin(0.5).setDepth(101);

        // Subtitle
        const subMsg = isVictory ? 'Vous etes le Petanque Master !' : 'L\'adversaire l\'emporte.';
        this.scene.add.text(
            this.scene.scale.width / 2, this.scene.scale.height / 2 - 20,
            subMsg,
            { fontFamily: 'monospace', fontSize: '10px', color: '#F5E6D0', align: 'center', shadow }
        ).setOrigin(0.5).setDepth(101);

        // Score final
        const scoreText = `${this.scores.player} - ${this.scores.opponent}`;
        this.scene.add.text(
            this.scene.scale.width / 2, this.scene.scale.height / 2 + 5,
            scoreText,
            { fontFamily: 'monospace', fontSize: '18px', color: '#F5E6D0', align: 'center', shadow }
        ).setOrigin(0.5).setDepth(101);

        // Bouton principal
        const hasReturnScene = !!this.scene.returnScene;
        const btnLabel = hasReturnScene ? (isVictory ? '[ CONTINUER ]' : '[ RETOUR ]') : '[ REJOUER ]';

        const btn = this.scene.add.text(
            this.scene.scale.width / 2, this.scene.scale.height / 2 + 35,
            btnLabel,
            {
                fontFamily: 'monospace', fontSize: '12px',
                color: '#F5E6D0', backgroundColor: '#C44B3F',
                padding: { x: 10, y: 5 }, shadow
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

    update(delta) {
        // Update all balls physics
        let anyMoving = false;
        const allBodies = [...this.balls, this.cochonnet].filter(b => b && b.isAlive);

        for (const ball of allBodies) {
            ball.update(delta);
            if (ball.isMoving) anyMoving = true;
        }

        // Check collisions between all pairs
        for (let i = 0; i < allBodies.length; i++) {
            for (let j = i + 1; j < allBodies.length; j++) {
                if (allBodies[i].isAlive && allBodies[j].isAlive) {
                    Ball.resolveCollision(allBodies[i], allBodies[j]);
                }
            }
        }

        // Check bounds
        this._checkBoundsAll();

        // Update BEST indicator
        this._updateBestIndicator(anyMoving);

        // If waiting for stop and everything stopped
        if (this.state === STATES.WAITING_STOP && !anyMoving) {
            if (this._afterStopCallback) {
                const cb = this._afterStopCallback;
                this._afterStopCallback = null;
                cb();
            }
        }
    }

    _updateBestIndicator(anyMoving) {
        if (!this._bestGfx) {
            this._bestGfx = this.scene.add.graphics().setDepth(10);
        }
        this._bestGfx.clear();

        if (!this.cochonnet || !this.cochonnet.isAlive || anyMoving) return;
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
            this._bestGfx.lineStyle(1, color, 0.7);
            this._bestGfx.strokeCircle(bestBall.x, bestBall.y, bestBall.radius + 3);
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
            this.scene.scale.height - 14,
            'Glissez et relachez pour viser',
            {
                fontFamily: 'monospace', fontSize: '9px',
                color: '#F5E6D0', align: 'center',
                backgroundColor: '#3A2E28', padding: { x: 6, y: 3 },
                shadow: { offsetX: 1, offsetY: 1, color: '#1A1510', blur: 0, fill: true }
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
            12,
            text,
            {
                fontFamily: 'monospace',
                fontSize: '10px',
                color: '#F5E6D0',
                align: 'center',
                backgroundColor: '#3A2E28',
                padding: { x: 6, y: 3 },
                shadow: { offsetX: 1, offsetY: 1, color: '#1A1510', blur: 0, fill: true }
            }
        ).setOrigin(0.5, 0).setDepth(100);

        if (!persistent) {
            this.scene.time.delayedCall(2000, () => {
                if (this._msgText) this._msgText.destroy();
                this._msgText = null;
            });
        }
    }
}

export { STATES };
