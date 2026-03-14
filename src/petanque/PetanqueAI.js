import {
    AI_EASY, AI_MEDIUM, AI_HARD,
    AI_MARCEL, AI_FANNY, AI_RICARDO, AI_MARIUS,
    AI_DELAY_MIN, AI_DELAY_MAX,
    COCHONNET_MIN_DIST, COCHONNET_MAX_DIST,
    LOFT_PRESETS, LOFT_TIR, LOFT_ROULETTE, LOFT_DEMI_PORTEE, LOFT_PLOMBEE,
    TERRAIN_HEIGHT
} from '../utils/Constants.js';

export default class PetanqueAI {
    constructor(scene, engine, difficulty, personality = null) {
        this.scene = scene;
        this.engine = engine;
        this.difficulty = difficulty;

        // Resolve precision config from difficulty
        this.precisionConfig = difficulty === 'hard' ? AI_HARD
            : difficulty === 'medium' ? AI_MEDIUM
            : AI_EASY;

        // Resolve personality config (overrides decision-making, not precision)
        this.personality = this._resolvePersonality(personality, difficulty);
    }

    _resolvePersonality(personality, difficulty) {
        if (personality === 'pointeur') return AI_MARCEL;
        if (personality === 'tireur') return AI_FANNY;
        if (personality === 'stratege') return AI_RICARDO;
        if (personality === 'complet') return AI_MARIUS;

        // Default: derive from difficulty
        if (difficulty === 'hard') return AI_RICARDO;
        if (difficulty === 'medium') return AI_FANNY;
        return AI_EASY;
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
        const angle = -Math.PI / 2 + this._noise(5) * Math.PI / 180;
        const power = 0.5 + this._noise(0.15);
        this.engine.throwCochonnet(angle, Phaser.Math.Clamp(power, 0.2, 0.9));
    }

    _throwBall() {
        const cochonnet = this.engine.cochonnet;
        if (!cochonnet || !cochonnet.isAlive) return;

        const { target, shotMode, loftPreset } = this._chooseTarget();

        const cx = this.scene.throwCircleX;
        const cy = this.scene.throwCircleY;
        const dx = target.x - cx;
        const dy = target.y - cy;
        const idealAngle = Math.atan2(dy, dx);
        const idealDist = Math.sqrt(dx * dx + dy * dy);

        // Precision from difficulty config
        const angleNoise = this._noise(this.precisionConfig.angleDev) * Math.PI / 180;
        const powerNoise = this._noise(this.precisionConfig.powerDev);

        const angle = idealAngle + angleNoise;
        const isTir = shotMode === 'tirer';
        const maxDist = TERRAIN_HEIGHT * (isTir ? 0.95 : 0.85);
        const idealPower = idealDist / maxDist;
        const power = Phaser.Math.Clamp(idealPower + powerNoise, 0.1, 1.0);

        const arrowColor = isTir ? 0xFF6644 : 0xC44B3F;
        this._showAimingArrow(angle, power, arrowColor, () => {
            this.engine.throwBall(angle, power, 'opponent', shotMode, loftPreset);
        });
    }

    _chooseTarget() {
        const cochonnet = this.engine.cochonnet;
        const p = this.personality;

        // Evaluate situation
        const aiHasPoint = this._aiHasPoint();
        const playerBalls = this.engine.getTeamBallsAlive('player');
        const aiBalls = this.engine.getTeamBallsAlive('opponent');
        const aiRemaining = this.engine.remaining.opponent;
        const playerRemaining = this.engine.remaining.player;

        // Score pressure: more aggressive when losing badly
        const scoreDiff = this.engine.scores.opponent - this.engine.scores.player;
        const isDesperateScore = scoreDiff < -4;

        // Boule advantage
        const bouleAdvantage = aiRemaining - playerRemaining;

        // Base shoot probability from personality
        let shootProb = p.shootProbability || 0;

        // Adjust for score pressure
        if (isDesperateScore) shootProb = Math.min(1, shootProb + 0.2);

        // Variance: 15% chance to do the opposite
        const variance = Math.random() < 0.15;

        // --- DECISION: Shoot the cochonnet? (stratege/complet only) ---
        if (p.targetsCocho && !aiHasPoint && bouleAdvantage <= -1 && playerBalls.length >= 2) {
            if (Math.random() < 0.3) {
                return {
                    target: { x: cochonnet.x, y: cochonnet.y },
                    shotMode: 'tirer',
                    loftPreset: LOFT_TIR
                };
            }
        }

        // --- DECISION: Shoot a player ball? ---
        let shouldShoot = false;
        if (playerBalls.length > 0) {
            if (p.personality === 'tireur') {
                // Tireur: shoots whenever doesn't have the point
                shouldShoot = !aiHasPoint;
                // Conservation: if last boule and has point, don't shoot
                if (aiRemaining <= 1 && aiHasPoint) shouldShoot = false;
            } else if (p.personality === 'pointeur') {
                // Pointeur: almost never shoots
                shouldShoot = false;
                // Desperation: 20% if losing 2+ scoring boules
                const proj = this.engine.calculateProjectedScore();
                if (proj && proj.winner === 'player' && proj.points >= 2) {
                    shouldShoot = Math.random() < 0.2;
                }
            } else if (p.personality === 'stratege' || p.personality === 'complet') {
                // Strategic decision based on situation
                if (!aiHasPoint && playerBalls.length > 0) {
                    shouldShoot = Math.random() < shootProb;
                }
                // If boule advantage is bad, prefer shooting
                if (bouleAdvantage < -1) shootProb += 0.2;
                shouldShoot = shouldShoot || (Math.random() < shootProb && !aiHasPoint);
            } else {
                // Default (difficulty-based legacy)
                if (this.precisionConfig.canShoot) {
                    const closest = this._closestPlayerBall();
                    if (closest && closest.dist < (this.precisionConfig.shootThreshold || 2) * 5) {
                        shouldShoot = true;
                    }
                }
            }

            // Apply variance (15% chance to flip)
            if (variance) shouldShoot = !shouldShoot;
        }

        if (shouldShoot && playerBalls.length > 0) {
            const targetBall = this._closestPlayerBall();
            if (targetBall) {
                return {
                    target: { x: targetBall.ball.x, y: targetBall.ball.y },
                    shotMode: 'tirer',
                    loftPreset: LOFT_TIR
                };
            }
        }

        // --- DECISION: Point (aim near cochonnet) ---
        const loft = this._chooseLoft();
        return {
            target: { x: cochonnet.x, y: cochonnet.y },
            shotMode: 'pointer',
            loftPreset: loft
        };
    }

    _aiHasPoint() {
        const aiDist = this.engine._getMinDistance('opponent');
        const playerDist = this.engine._getMinDistance('player');
        return aiDist < playerDist;
    }

    _closestPlayerBall() {
        const cochonnet = this.engine.cochonnet;
        const playerBalls = this.engine.getTeamBallsAlive('player');
        if (playerBalls.length === 0) return null;

        return playerBalls.reduce((closest, b) => {
            const d = b.distanceTo(cochonnet);
            return d < closest.dist ? { ball: b, dist: d } : closest;
        }, { ball: null, dist: Infinity });
    }

    _chooseLoft() {
        const terrain = this.engine.terrainType;
        const p = this.personality;

        if (p.loftPref === 'roulette') {
            // Pointeur prefers roulette (works best on terre/dalles)
            if (terrain === 'sable') return LOFT_DEMI_PORTEE; // sable = too much friction for roulette
            return LOFT_ROULETTE;
        }
        if (p.loftPref === 'plombee') {
            return LOFT_PLOMBEE;
        }
        if (p.loftPref === 'adaptatif') {
            // Adapt to terrain
            if (terrain === 'terre' || terrain === 'dalles') return LOFT_ROULETTE;
            if (terrain === 'herbe') return LOFT_DEMI_PORTEE;
            if (terrain === 'sable') return LOFT_PLOMBEE;
            return LOFT_DEMI_PORTEE;
        }
        return LOFT_DEMI_PORTEE;
    }

    _showAimingArrow(angle, power, color, callback) {
        const g = this.scene.add.graphics().setDepth(50);
        const originX = this.scene.throwCircleX;
        const originY = this.scene.throwCircleY;
        const arrowLen = power * 40;
        const endX = originX + Math.cos(angle) * arrowLen;
        const endY = originY + Math.sin(angle) * arrowLen;

        g.lineStyle(2, color, 0.6);
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
