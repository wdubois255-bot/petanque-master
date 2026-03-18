import AIStrategy from './AIStrategy.js';
import { LOFT_TIR } from '../../utils/Constants.js';

/**
 * Ricardo: Le Stratege
 * Every ball is an investment. Cost-benefit analysis for every option.
 * Can target cochonnet for mene morte. Mixes pointing and shooting by utility score.
 */
export default class StrategeStrategy extends AIStrategy {
    chooseTarget(cochonnet, sit) {
        // Option 1: Target cochonnet (mene morte)
        if (this._shouldTargetCochonnet(sit)) {
            return {
                target: { x: cochonnet.x, y: cochonnet.y },
                shotMode: 'tirer',
                loftPreset: LOFT_TIR
            };
        }

        // Option 2: Shoot a player ball
        const shootUtility = this._computeShootUtility(sit);
        const pointUtility = this._computePointUtility(sit);

        if (shootUtility > pointUtility && sit.playerBalls.length > 0) {
            const target = this._chooseStrategicTarget(sit);
            if (target) return this._makeShot(target);
        }

        // Option 3: Point
        const loft = this._chooseLoft();
        return {
            target: { x: cochonnet.x + this._noise(4), y: cochonnet.y + this._noise(4) },
            shotMode: 'pointer',
            loftPreset: loft
        };
    }
}
