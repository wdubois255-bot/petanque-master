import AIStrategy from './AIStrategy.js';

/**
 * Default (legacy difficulty-based) strategy.
 * Used when no archetype matches.
 */
export default class DefaultStrategy extends AIStrategy {
    chooseTarget(cochonnet, sit) {
        let shouldShoot = false;

        if (this.ai.precisionConfig.canShoot && sit.playerBalls.length > 0) {
            const closest = sit.bestPlayerBall;
            if (closest && closest.dist < (this.ai.precisionConfig.shootThreshold || 2) * 5) {
                shouldShoot = true;
            }
        }

        if (Math.random() < 0.15) shouldShoot = !shouldShoot;

        if (shouldShoot && sit.bestPlayerBall) {
            return this._makeShot(sit.bestPlayerBall.ball);
        }

        const loft = this._chooseLoft();
        return {
            target: { x: cochonnet.x, y: cochonnet.y },
            shotMode: 'pointer',
            loftPreset: loft
        };
    }
}
