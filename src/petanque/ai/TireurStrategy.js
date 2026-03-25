import AIStrategy from './AIStrategy.js';
import { LOFT_DEMI_PORTEE } from '../../utils/Constants.js';

/**
 * Ley & La Choupe: Les Tireurs
 * If they don't have the point, they shoot. Always.
 * Targets the most dangerous player ball (closest to cochonnet).
 * When pointing: demi-portee (simple and effective).
 */
export default class TireurStrategy extends AIStrategy {
    chooseTarget(cochonnet, sit) {
        const shouldShoot = this._tireurShouldShoot(sit);

        if (shouldShoot && sit.playerBalls.length > 0) {
            const target = this._chooseTirTarget(sit);
            if (target) return this._makeShot(target);
        }

        // Fall back to pointing (not her strength)
        return {
            target: { x: cochonnet.x + this._noise(12), y: cochonnet.y + this._noise(12) },
            shotMode: 'pointer',
            loftPreset: LOFT_DEMI_PORTEE
        };
    }

    _tireurShouldShoot(sit) {
        if (sit.isLastBall && sit.aiHasPoint) return false;
        if (!sit.aiHasPoint) return true;
        if (sit.playerProjectedPoints >= 3) return true;
        return false;
    }

    _chooseTirTarget(sit) {
        if (!sit.bestPlayerBall) return null;
        return sit.bestPlayerBall.ball;
    }
}
