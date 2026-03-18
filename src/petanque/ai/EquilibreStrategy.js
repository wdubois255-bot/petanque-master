import AIStrategy from './AIStrategy.js';
import { LOFT_TIR, LOFT_ROULETTE, LOFT_DEMI_PORTEE, LOFT_PLOMBEE } from '../../utils/Constants.js';

/**
 * Rene: L'Equilibre
 * The chill guy who plays for fun but has flashes of genius.
 * Adapts style to score, varies lofts, and has unpredictable "moments pastis".
 */
export default class EquilibreStrategy extends AIStrategy {
    chooseTarget(cochonnet, sit) {
        // "Moment pastis" -- 15% instinctive shot (brilliant or ridiculous)
        if (Math.random() < 0.15) {
            return this._momentPastis(cochonnet, sit);
        }

        const isRelaxed = sit.scoreDiff >= 2;
        const isStressed = sit.scoreDiff <= -3;

        // Shooting decision
        let shouldShoot = false;
        if (!sit.aiHasPoint && sit.playerBalls.length > 0) {
            const shootThreshold = isStressed ? 35 : 25;
            const shootProb = isRelaxed ? 0.40 : isStressed ? 0.45 : 0.30;
            if (sit.bestPlayerDist < shootThreshold) {
                shouldShoot = Math.random() < shootProb;
            }
        }

        if (sit.isDesperate && Math.random() < 0.4) shouldShoot = true;

        // 8% pure instinct flip
        if (Math.random() < 0.08) shouldShoot = !shouldShoot;

        if (shouldShoot && sit.bestPlayerBall) {
            return this._makeShot(sit.bestPlayerBall.ball);
        }

        // Pointing: vary lofts based on mood
        let loft;
        if (isRelaxed) {
            const roll = Math.random();
            if (roll < 0.3) loft = LOFT_ROULETTE;
            else if (roll < 0.6) loft = LOFT_DEMI_PORTEE;
            else loft = LOFT_PLOMBEE;
        } else {
            loft = this._chooseLoft();
        }

        const spread = isRelaxed ? 8 : 5;
        return {
            target: { x: cochonnet.x + this._noise(spread), y: cochonnet.y + this._noise(spread) },
            shotMode: 'pointer',
            loftPreset: loft
        };
    }

    _momentPastis(cochonnet, sit) {
        const roll = Math.random();

        if (roll < 0.35 && sit.playerBalls.length > 0) {
            const balls = sit.playerBalls;
            const target = balls[Math.floor(Math.random() * balls.length)];
            return this._makeShot(target);
        }

        if (roll < 0.60) {
            return {
                target: { x: cochonnet.x + this._noise(3), y: cochonnet.y + this._noise(3) },
                shotMode: 'pointer',
                loftPreset: LOFT_PLOMBEE
            };
        }

        if (roll < 0.80) {
            return {
                target: { x: cochonnet.x + this._noise(6), y: cochonnet.y + this._noise(6) },
                shotMode: 'pointer',
                loftPreset: LOFT_ROULETTE
            };
        }

        if (sit.playerBalls.length > 0 && !sit.isLastBall) {
            return {
                target: { x: cochonnet.x, y: cochonnet.y },
                shotMode: 'tirer',
                loftPreset: LOFT_TIR
            };
        }

        return {
            target: { x: cochonnet.x + this._noise(5), y: cochonnet.y + this._noise(5) },
            shotMode: 'pointer',
            loftPreset: this._chooseLoft()
        };
    }
}
