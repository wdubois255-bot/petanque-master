import AIStrategy from './AIStrategy.js';
import { LOFT_TIR } from '../../utils/Constants.js';

/**
 * Marius: Le Boss
 * The best player. Perfectly analyses, always picks the optimal option.
 * Combines the strengths of all archetypes. Adapts style to situation.
 */
export default class BossStrategy extends AIStrategy {
    chooseTarget(cochonnet, sit) {
        // Mene morte if needed (like stratege, but better calibrated)
        if (this._shouldTargetCochonnet(sit)) {
            return {
                target: { x: cochonnet.x, y: cochonnet.y },
                shotMode: 'tirer',
                loftPreset: LOFT_TIR
            };
        }

        // Cost-benefit analysis
        const shootScore = this._bossShootScore(sit);
        const pointScore = this._bossPointScore(sit);

        if (shootScore > pointScore && sit.playerBalls.length > 0) {
            const target = this._chooseStrategicTarget(sit);
            if (target) return this._makeShot(target);
        }

        // Point like a pointeur (smart offset, tight placement)
        const offset = this._computePointeurOffset(cochonnet, sit);
        const loft = this._chooseLoft();
        return {
            target: { x: cochonnet.x + offset.x, y: cochonnet.y + offset.y },
            shotMode: 'pointer',
            loftPreset: loft
        };
    }

    _bossShootScore(sit) {
        let score = 0;
        if (!sit.aiHasPoint) score += 50;
        if (sit.playerProjectedPoints >= 2) score += 25;
        if (sit.playerProjectedPoints >= 4) score += 25;
        if (sit.bestPlayerDist < 12) score += 15;
        if (sit.isDesperate) score += 20;
        if (sit.isMatchPoint) score += 15;
        if (sit.isLastBall) score -= 30;
        if (sit.bouleAdvantage >= 2) score -= 15;
        return score + this._noise(5);
    }

    _bossPointScore(sit) {
        let score = 35;
        if (sit.aiHasPoint) score += 30;
        if (sit.aiProjectedPoints >= 2) score += 20;
        if (sit.isLastBall) score += 25;
        if (sit.aiMatchPoint) score += 15;
        return score + this._noise(5);
    }
}
