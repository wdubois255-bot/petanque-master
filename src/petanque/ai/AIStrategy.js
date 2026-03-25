import {
    LOFT_TIR, LOFT_DEMI_PORTEE, LOFT_PLOMBEE
} from '../../utils/Constants.js';

/**
 * Base class for all AI strategy archetypes.
 * Provides shared analysis and helper methods.
 * Each subclass implements chooseTarget(cochonnet, sit).
 */
export default class AIStrategy {
    constructor(ai) {
        this.ai = ai;
    }

    // Subclasses must override
    chooseTarget(cochonnet, sit) {
        throw new Error('AIStrategy.chooseTarget() must be overridden');
    }

    // ---- SHARED ANALYSIS ----

    _analyzeSituation() {
        const engine = this.ai.engine;
        const cochonnet = engine.cochonnet;
        const aiHasPoint = this._aiHasPoint();
        const playerBalls = engine.getTeamBallsAlive('player');
        const aiBalls = engine.getTeamBallsAlive('opponent');
        const aiRemaining = engine.remaining.opponent;
        const playerRemaining = engine.remaining.player;
        const scoreDiff = engine.scores.opponent - engine.scores.player;
        const bouleAdvantage = aiRemaining - playerRemaining;

        const projectedScore = engine.calculateProjectedScore
            ? engine.calculateProjectedScore()
            : null;
        const playerProjectedPoints = projectedScore && projectedScore.winner === 'player'
            ? projectedScore.points : 0;
        const aiProjectedPoints = projectedScore && projectedScore.winner === 'opponent'
            ? projectedScore.points : 0;

        const bestPlayerBall = this._closestPlayerBall();
        const bestPlayerDist = bestPlayerBall ? bestPlayerBall.dist : Infinity;

        let bestAiDist = Infinity;
        for (const b of aiBalls) {
            const d = b.distanceTo(cochonnet);
            if (d < bestAiDist) bestAiDist = d;
        }

        return {
            aiHasPoint,
            playerBalls,
            aiBalls,
            aiRemaining,
            playerRemaining,
            scoreDiff,
            bouleAdvantage,
            playerProjectedPoints,
            aiProjectedPoints,
            bestPlayerBall,
            bestPlayerDist,
            bestAiDist,
            isLastBall: aiRemaining <= 1,
            isDesperate: scoreDiff < -4,
            isCloseGame: Math.abs(scoreDiff) <= 2,
            isMatchPoint: engine.scores.player >= 11,
            aiMatchPoint: engine.scores.opponent >= 11
        };
    }

    // ---- SHARED HELPERS ----

    _makeShot(targetBall) {
        return {
            target: { x: targetBall.x, y: targetBall.y },
            shotMode: 'tirer',
            loftPreset: LOFT_TIR
        };
    }

    _aiHasPoint() {
        const engine = this.ai.engine;
        const aiDist = engine._getMinDistance('opponent');
        const playerDist = engine._getMinDistance('player');
        return aiDist < playerDist;
    }

    _closestPlayerBall() {
        const engine = this.ai.engine;
        const cochonnet = engine.cochonnet;
        const playerBalls = engine.getTeamBallsAlive('player');
        if (playerBalls.length === 0) return null;

        return playerBalls.reduce((closest, b) => {
            const d = b.distanceTo(cochonnet);
            return d < closest.dist ? { ball: b, dist: d } : closest;
        }, { ball: null, dist: Infinity });
    }

    _chooseLoft() {
        const terrain = this.ai.engine.terrainType;
        const p = this.ai.personality;

        if (p.loftPref === 'plombee') {
            return LOFT_PLOMBEE;
        }
        if (p.loftPref === 'demi_plombee') {
            return Math.random() < 0.5 ? LOFT_DEMI_PORTEE : LOFT_PLOMBEE;
        }
        if (p.loftPref === 'adaptatif') {
            if (terrain === 'sable' || terrain === 'herbe') return LOFT_PLOMBEE;
            return LOFT_DEMI_PORTEE;
        }
        return LOFT_DEMI_PORTEE;
    }

    _noise(magnitude) {
        return this.ai._noise(magnitude);
    }

    // Smart placement offset (used by Pointeur and Boss)
    _computePointeurOffset(cochonnet, sit) {
        // Offset scales with character precision: PRE 10 = 1-3px, PRE 5 = 4-8px
        // A "good pointer" at PRE 10 should land 6-7/10 within ~5px (≈20cm)
        const prec = this.ai._charStats?.precision || 6;
        const baseOffset = (11 - prec) * 0.6 + this._noise((11 - prec) * 0.4);

        if (sit.playerBalls.length === 0 || sit.aiHasPoint) {
            const angle = Math.random() * Math.PI * 2;
            return { x: Math.cos(angle) * baseOffset, y: Math.sin(angle) * baseOffset };
        }

        const threat = sit.bestPlayerBall.ball;
        const dx = threat.x - cochonnet.x;
        const dy = threat.y - cochonnet.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 1) return { x: baseOffset, y: 0 };

        // Place between threat and cochonnet (blocking position)
        const nx = dx / dist;
        const ny = dy / dist;
        return {
            x: nx * baseOffset * 0.4 + this._noise(baseOffset * 0.3),
            y: ny * baseOffset * 0.4 + this._noise(baseOffset * 0.3)
        };
    }

    // Should we target cochonnet for mene morte? (used by Stratege and Boss)
    _shouldTargetCochonnet(sit) {
        if (!this.ai.personality.targetsCocho) return false;
        if (sit.playerProjectedPoints >= 3 && sit.aiRemaining <= 2 && sit.bouleAdvantage <= 0) {
            return Math.random() < 0.4;
        }
        if (sit.isMatchPoint && sit.playerProjectedPoints >= 2 && !sit.aiHasPoint) {
            return Math.random() < 0.5;
        }
        return false;
    }

    // Choose most strategic target ball (used by Stratege and Boss)
    _chooseStrategicTarget(sit) {
        const playerBalls = sit.playerBalls;
        if (playerBalls.length === 0) return null;

        const cochonnet = this.ai.engine.cochonnet;
        let bestTarget = null;
        let bestScore = -Infinity;

        for (const ball of playerBalls) {
            const dist = ball.distanceTo(cochonnet);
            let score = 100 - dist;

            const cy = this.ai.scene.throwCircleY;
            if (ball.y < cy && ball.y > cochonnet.y) score += 15;

            for (const other of playerBalls) {
                if (other !== ball && ball.distanceTo(other) < 30) score += 8;
            }

            if (score > bestScore) {
                bestScore = score;
                bestTarget = ball;
            }
        }

        return bestTarget;
    }

    // Utility scores for shoot vs point (used by Stratege, adapted by Boss)
    _computeShootUtility(sit) {
        let utility = 0;
        if (!sit.aiHasPoint) utility += 40;
        if (sit.playerProjectedPoints >= 2) utility += 20;
        if (sit.isDesperate) utility += 15;
        if (sit.bestPlayerDist < 15) utility += 10;
        if (sit.bouleAdvantage >= 2) utility -= 20;
        if (this.ai._consecutivePoints >= 2) utility += 10;
        return utility + this._noise(10);
    }

    _computePointUtility(sit) {
        let utility = 30;
        if (sit.aiHasPoint) utility += 25;
        if (sit.aiProjectedPoints >= 2) utility += 15;
        if (sit.isLastBall) utility += 20;
        if (this.ai._consecutiveShots >= 2) utility += 15;
        return utility + this._noise(10);
    }
}
