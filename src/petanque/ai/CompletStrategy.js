import AIStrategy from './AIStrategy.js';
import { LOFT_TIR, LOFT_DEMI_PORTEE, LOFT_PLOMBEE, HIT_PROB_SCALE } from '../../utils/Constants.js';

/**
 * Reyes: Le Complet — The smartest player on the boulodrome.
 *
 * Plays like a real champion: reads the game, counts balls, evaluates risk vs reward,
 * and always picks the move that maximizes expected points.
 *
 * Decision tree:
 * 1. If I have the point AND safe lead → conserve (point safe, waste opponent's balls)
 * 2. If opponent has the point → evaluate: shoot or point closer?
 * 3. If last ball → never waste it on a risky shot
 * 4. If opponent has no balls left → point calm, every ball counts as a point
 * 5. If desperate (losing big) → aggressive, take risks
 * 6. Loft: always optimal for distance (short/mid=demi, far=plombee)
 */
export default class CompletStrategy extends AIStrategy {
    chooseTarget(cochonnet, sit) {
        // === RULE 1: Opponent has no balls left → just point, every close ball = +1 point ===
        if (sit.playerRemaining === 0) {
            return this._pointSmart(cochonnet, sit);
        }

        // === RULE 2: I have the point ===
        if (sit.aiHasPoint) {
            return this._handleHasPoint(cochonnet, sit);
        }

        // === RULE 3: Opponent has the point → I need to take it back ===
        return this._handleLosingPoint(cochonnet, sit);
    }

    // --- When Reyes HAS the point ---
    _handleHasPoint(cochonnet, sit) {
        // How many points am I winning this mene?
        const myPoints = sit.aiProjectedPoints || 1;

        // If winning 3+ points and opponent still has balls → play safe, let them waste balls
        if (myPoints >= 3 && sit.playerRemaining > 0 && !sit.isLastBall) {
            // Point far from action — "waste" a ball but maintain lead
            // Place between cochonnet and the edge, away from opponent balls
            return this._pointDefensive(cochonnet, sit);
        }

        // If winning just 1 point and opponent has a close ball → consider shooting to protect
        if (myPoints <= 1 && sit.bestPlayerDist < 30 && !sit.isLastBall) {
            // Opponent is close — worth shooting to push them away
            const shootUtility = this._evaluateShootValue(sit);
            if (shootUtility > 0.5) {
                return this._makeShot(sit.bestPlayerBall.ball);
            }
        }

        // If it's match point for me (opponent at 11+), play ultra-safe
        if (sit.aiMatchPoint) {
            return this._pointSmart(cochonnet, sit);
        }

        // Default: point close to consolidate
        return this._pointSmart(cochonnet, sit);
    }

    // --- When Reyes is LOSING the point ---
    _handleLosingPoint(cochonnet, sit) {
        if (!sit.bestPlayerBall) {
            return this._pointSmart(cochonnet, sit);
        }

        const enemyDist = sit.bestPlayerDist;
        const myBestDist = sit.bestAiDist;

        // How badly am I losing? (projected points for opponent)
        const opponentPoints = sit.playerProjectedPoints || 1;

        // === Key decision: shoot or point? ===

        // NEVER shoot with last ball if I can point closer instead
        if (sit.isLastBall) {
            // Can I realistically point closer than the best opponent ball?
            const myPrecision = this.ai._charStats?.precision || 7;
            const expectedOffset = (11 - myPrecision) * 0.6 + 2; // ~2-7px
            if (expectedOffset < enemyDist * 0.8) {
                // I can probably point closer → point
                return this._pointSmart(cochonnet, sit);
            }
            // Enemy is too close, I must try to point anyway (never waste last ball on shot)
            return this._pointSmart(cochonnet, sit);
        }

        // Evaluate: is shooting worth it?
        const shootValue = this._evaluateShootValue(sit);
        const pointValue = this._evaluatePointValue(sit, enemyDist);

        if (shootValue > pointValue) {
            // SHOOT — pick the best target
            const target = this._pickBestShootTarget(sit);
            return this._makeShot(target);
        }

        // POINT — try to get closer
        return this._pointSmart(cochonnet, sit);
    }

    // --- Evaluate expected value of shooting ---
    _evaluateShootValue(sit) {
        if (!sit.bestPlayerBall) return 0;

        const enemyDist = sit.bestPlayerDist;
        const opponentPoints = sit.playerProjectedPoints || 1;
        const myAngleDev = this.ai.precisionConfig.angleDev;

        // Probability of hitting: closer target + lower angleDev = higher chance
        // angleDev 3 at 50px → ~80% hit. angleDev 3 at 100px → ~50%
        const hitProb = Math.max(0.1, Math.min(0.95, 1 - (myAngleDev * enemyDist) / HIT_PROB_SCALE));

        // Value of a successful shot: removes opponent's best ball
        // Higher value when opponent is winning more projected points
        const successValue = opponentPoints * 0.8;

        // Cost of missing: wasted ball, opponent still has the point
        const failCost = 0.3 + (sit.isLastBall ? 2 : 0);

        return hitProb * successValue - (1 - hitProb) * failCost;
    }

    // --- Evaluate expected value of pointing ---
    _evaluatePointValue(sit, enemyDist) {
        const myPrecision = this.ai._charStats?.precision || 7;
        // Expected landing distance from cochonnet
        const expectedOffset = (11 - myPrecision) * 0.6 + 2;

        // Probability of getting closer than opponent
        const beatProb = enemyDist > expectedOffset * 1.5 ? 0.7 : 0.4;

        // Value: if I beat the opponent, I take the point (saves 1+ points)
        const opponentPoints = sit.playerProjectedPoints || 1;
        return beatProb * opponentPoints * 0.6;
    }

    // --- Pick the most valuable target to shoot ---
    _pickBestShootTarget(sit) {
        if (sit.playerBalls.length <= 1) {
            return sit.bestPlayerBall.ball;
        }

        // Score each opponent ball by how much damage removing it would do
        let bestTarget = sit.bestPlayerBall.ball;
        let bestScore = 0;

        for (const ball of sit.playerBalls) {
            const dist = ball.distanceTo(this.ai.engine.cochonnet);
            // Closer balls are more valuable to remove
            let value = 100 / (dist + 5);
            // Bonus: if this ball is the ONLY one giving points, removing it flips the mene
            if (dist < sit.bestAiDist) value *= 1.5;
            if (value > bestScore) {
                bestScore = value;
                bestTarget = ball;
            }
        }
        return bestTarget;
    }

    // --- Smart pointing: optimal loft for distance ---
    _pointSmart(cochonnet, sit) {
        const offset = this._computePointeurOffset(cochonnet, sit);
        const targetX = cochonnet.x + offset.x;
        const targetY = cochonnet.y + offset.y;

        // Calculate distance from throw circle to target
        const throwX = this.ai.scene.throwCircleX;
        const throwY = this.ai.scene.throwCircleY;
        const dist = Math.sqrt((targetX - throwX) ** 2 + (targetY - throwY) ** 2);

        // Optimal loft based on distance
        const loft = this._optimalLoft(dist);

        return { target: { x: targetX, y: targetY }, shotMode: 'pointer', loftPreset: loft };
    }

    // --- Defensive pointing: place ball safe but not near action ---
    _pointDefensive(cochonnet, sit) {
        // Place behind cochonnet (from opponent's perspective) to block future shots
        const offset = 5 + this._noise(3);
        // Opposite direction of the closest threat
        let angle = Math.random() * Math.PI * 2;
        if (sit.bestPlayerBall) {
            const threat = sit.bestPlayerBall.ball;
            const dx = threat.x - cochonnet.x;
            const dy = threat.y - cochonnet.y;
            // Place on opposite side of threat
            angle = Math.atan2(-dy, -dx) + this._noise(0.3);
        }

        const targetX = cochonnet.x + Math.cos(angle) * offset;
        const targetY = cochonnet.y + Math.sin(angle) * offset;

        const throwX = this.ai.scene.throwCircleX;
        const throwY = this.ai.scene.throwCircleY;
        const dist = Math.sqrt((targetX - throwX) ** 2 + (targetY - throwY) ** 2);

        return {
            target: { x: targetX, y: targetY },
            shotMode: 'pointer',
            loftPreset: this._optimalLoft(dist)
        };
    }

    // --- Choose optimal loft based on throw distance ---
    _optimalLoft(dist) {
        // Short/medium distance → demi-portee (balanced, default)
        if (dist < 220) return LOFT_DEMI_PORTEE;
        // Long distance (>220px) → plombee (high arc, stops faster)
        return LOFT_PLOMBEE;
    }
}
