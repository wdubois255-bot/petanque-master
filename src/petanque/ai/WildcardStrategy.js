import AIStrategy from './AIStrategy.js';
import { LOFT_TIR, LOFT_DEMI_PORTEE, LOFT_PLOMBEE } from '../../utils/Constants.js';

/**
 * Thierry: Le Wildcard
 * Unpredictable, takes crazy risks. Shoots from afar, attempts impossible shots.
 * May shoot even when he has the point (for style). Momentum player.
 */
export default class WildcardStrategy extends AIStrategy {
    chooseTarget(cochonnet, sit) {
        const mood = Math.random();

        // 20% chance: "coup de folie" -- shoots regardless of situation
        if (mood < 0.2 && sit.playerBalls.length > 0 && !sit.isLastBall) {
            const randomIdx = Math.floor(Math.random() * sit.playerBalls.length);
            return this._makeShot(sit.playerBalls[randomIdx]);
        }

        // 10% chance: target cochonnet for chaos
        if (mood < 0.3 && this.ai.personality.targetsCocho && !sit.isLastBall) {
            if (Math.random() < 0.2) {
                return {
                    target: { x: cochonnet.x, y: cochonnet.y },
                    shotMode: 'tirer',
                    loftPreset: LOFT_TIR
                };
            }
        }

        // Normal decision (but with higher shoot tendency)
        if (!sit.aiHasPoint && sit.playerBalls.length > 0) {
            const shootProb = sit.isDesperate ? 0.8 : 0.6;
            if (Math.random() < shootProb) {
                const target = sit.bestPlayerBall ? sit.bestPlayerBall.ball : null;
                if (target) return this._makeShot(target);
            }
        }

        // Pointing: varied lofts
        const loftChoice = Math.random();
        let loft;
        if (loftChoice < 0.3) loft = LOFT_PLOMBEE;
        else if (loftChoice < 0.6) loft = LOFT_DEMI_PORTEE;
        else loft = this._chooseLoft();

        return {
            target: { x: cochonnet.x + this._noise(8), y: cochonnet.y + this._noise(8) },
            shotMode: 'pointer',
            loftPreset: loft
        };
    }
}
