import {
    AI_EASY, AI_MEDIUM, AI_HARD,
    AI_DELAY_MIN, AI_DELAY_MAX,
    COCHONNET_MIN_DIST, COCHONNET_MAX_DIST
} from '../utils/Constants.js';

export default class PetanqueAI {
    constructor(scene, engine, difficulty) {
        this.scene = scene;
        this.engine = engine;
        this.difficulty = difficulty;

        this.config = difficulty === 'hard' ? AI_HARD
            : difficulty === 'medium' ? AI_MEDIUM
            : AI_EASY;
    }

    takeTurn() {
        const delay = Phaser.Math.Between(AI_DELAY_MIN, AI_DELAY_MAX);

        this.scene.time.delayedCall(delay, () => {
            if (this.engine.state === 'COCHONNET_THROW') {
                this._throwCochonnet();
            } else {
                this._throwBall();
            }
        });
    }

    _throwCochonnet() {
        // AI throws cochonnet roughly toward center-top of terrain
        const angle = -Math.PI / 2 + this._noise(5) * Math.PI / 180;
        const power = 0.5 + this._noise(0.15);

        this.engine.throwCochonnet(angle, Phaser.Math.Clamp(power, 0.2, 0.9));
    }

    _throwBall() {
        const cochonnet = this.engine.cochonnet;
        if (!cochonnet || !cochonnet.isAlive) return;

        const target = this._chooseTarget();

        // Calculate angle to target from throw circle
        const cx = this.scene.throwCircleX;
        const cy = this.scene.throwCircleY;
        const dx = target.x - cx;
        const dy = target.y - cy;
        const idealAngle = Math.atan2(dy, dx);
        const idealDist = Math.sqrt(dx * dx + dy * dy);

        // Add noise
        const angleNoise = this._noise(this.config.angleDev) * Math.PI / 180;
        const powerNoise = this._noise(this.config.powerDev);

        const angle = idealAngle + angleNoise;
        // Power maps to fraction of max terrain distance (same as throwBall)
        const maxDist = 210 * 0.85; // TERRAIN_HEIGHT * 0.85
        const idealPower = idealDist / maxDist;
        const power = Phaser.Math.Clamp(idealPower + powerNoise, 0.1, 1.0);

        // Show brief aiming visualization
        this._showAimingArrow(angle, power, () => {
            this.engine.throwBall(angle, power, 'opponent');
        });
    }

    _chooseTarget() {
        const cochonnet = this.engine.cochonnet;

        // Can we shoot (tir)?
        if (this.config.canShoot) {
            const playerBalls = this.engine.getTeamBallsAlive('player');
            const closestPlayerBall = playerBalls.reduce((closest, b) => {
                const d = b.distanceTo(cochonnet);
                return d < closest.dist ? { ball: b, dist: d } : closest;
            }, { ball: null, dist: Infinity });

            if (closestPlayerBall.ball && closestPlayerBall.dist < this.config.shootThreshold * 5) {
                // Shoot at closest player ball
                return { x: closestPlayerBall.ball.x, y: closestPlayerBall.ball.y };
            }
        }

        // Default: point (aim near cochonnet)
        return { x: cochonnet.x, y: cochonnet.y };
    }

    _showAimingArrow(angle, power, callback) {
        const g = this.scene.add.graphics().setDepth(50);
        const originX = this.scene.throwCircleX;
        const originY = this.scene.throwCircleY;
        const arrowLen = power * 40;
        const endX = originX + Math.cos(angle) * arrowLen;
        const endY = originY + Math.sin(angle) * arrowLen;

        g.lineStyle(2, 0xC44B3F, 0.6);
        g.beginPath();
        g.moveTo(originX, originY);
        g.lineTo(endX, endY);
        g.strokePath();

        this.scene.time.delayedCall(400, () => {
            g.destroy();
            if (callback) callback();
        });
    }

    _noise(magnitude) {
        return (Math.random() - 0.5) * 2 * magnitude;
    }
}
