import AIStrategy from './AIStrategy.js';
import { LOFT_TIR, LOFT_DEMI_PORTEE, LOFT_PLOMBEE } from '../../utils/Constants.js';

/**
 * Marcel: Le Vieux Renard (L'Equilibre)
 * 40 ans d'experience. Calme, calculateur, patient.
 * Pointe avec precision chirurgicale, tire uniquement quand c'est strategiquement optimal.
 * Ne fait JAMAIS de coups aleatoires — chaque boule est reflechie.
 * Adapte son loft au terrain (loftPref: adaptatif).
 */
export default class EquilibreStrategy extends AIStrategy {
    chooseTarget(cochonnet, sit) {
        const prec = this.ai._charStats?.precision || 8;
        const sangFroid = this.ai._charStats?.sang_froid || 8;

        // Marcel ne tire que quand c'est strategiquement justifie
        if (this._shouldShoot(sit, sangFroid)) {
            const target = this._chooseShootTarget(sit);
            if (target) return this._makeShot(target);
        }

        // Sinon, placement calculé — precision basee sur les stats
        return this._calculatedPoint(cochonnet, sit, prec);
    }

    _shouldShoot(sit, sangFroid) {
        // Marcel ne tire pas s'il a le point — patience
        if (sit.aiHasPoint) return false;
        // Pas de boules adverses a viser
        if (sit.playerBalls.length === 0) return false;
        // Pas de cible proche
        if (!sit.bestPlayerBall) return false;

        const shootProb = this.ai.personality?.shootProbability || 0.25;

        // Situation critique : adversaire a 3+ points projetés et Marcel n'a pas le point
        if (sit.playerProjectedPoints >= 3 && !sit.aiHasPoint) {
            return Math.random() < 0.70; // tir de necessity (70%)
        }

        // Match point adverse : Marcel se concentre, tire si menacé
        if (sit.isMatchPoint && !sit.aiHasPoint && sit.bestPlayerDist < 30) {
            return Math.random() < 0.60;
        }

        // Desespere : le renard sort les crocs
        if (sit.isDesperate) {
            return Math.random() < 0.50;
        }

        // Situation normale : tire si la boule adverse est bien placee
        // Plus la boule est proche du cochonnet, plus Marcel considere le tir
        if (sit.bestPlayerDist < 15) {
            return Math.random() < shootProb * 1.5; // boule tres proche → tir probable
        }
        if (sit.bestPlayerDist < 25) {
            return Math.random() < shootProb;
        }

        // Boule loin → pas la peine de tirer, mieux vaut pointer
        return false;
    }

    _chooseShootTarget(sit) {
        // Marcel choisit la cible la plus menacante (la plus proche du cochonnet)
        if (sit.bestPlayerBall) return sit.bestPlayerBall.ball;
        return null;
    }

    _calculatedPoint(cochonnet, sit, prec) {
        // Marcel adapte son loft au terrain (adaptatif)
        const loft = this._chooseLoft();

        // Placement chirurgical : offset basé sur la précision du personnage
        const offset = this._computePointeurOffset(cochonnet, sit);

        return {
            target: { x: cochonnet.x + offset.x, y: cochonnet.y + offset.y },
            shotMode: 'pointer',
            loftPreset: loft
        };
    }
}
