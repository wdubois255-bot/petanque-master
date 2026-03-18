import AIStrategy from './AIStrategy.js';

/**
 * Le Magicien: Le Pointeur (Le Chirurgien)
 * Never shoots except in absolute desperation.
 * Places balls surgically with smart offsets. Roulette obsessive.
 */
export default class PointeurStrategy extends AIStrategy {
    chooseTarget(cochonnet, sit) {
        // Ultra-rare desperation shot: only when losing 3+ points AND last ball
        if (!sit.aiHasPoint && sit.playerProjectedPoints >= 3 && sit.isLastBall) {
            if (Math.random() < 0.3 && sit.bestPlayerBall) {
                return this._makeShot(sit.bestPlayerBall.ball);
            }
        }

        const offset = this._computePointeurOffset(cochonnet, sit);
        const loft = this._chooseLoft();

        return {
            target: { x: cochonnet.x + offset.x, y: cochonnet.y + offset.y },
            shotMode: 'pointer',
            loftPreset: loft
        };
    }
}
