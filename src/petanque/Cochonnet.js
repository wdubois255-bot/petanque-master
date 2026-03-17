import Ball from './Ball.js';
import { COCHONNET_RADIUS, COCHONNET_MASS, BALL_COLORS } from '../utils/Constants.js';

export default class Cochonnet extends Ball {
    constructor(scene, x, y, frictionMult, textureKey) {
        super(scene, x, y, {
            radius: COCHONNET_RADIUS,
            mass: COCHONNET_MASS,
            color: BALL_COLORS.cochonnet,
            team: 'cochonnet',
            frictionMult,
            textureKey: textureKey || 'ball_cochonnet',
            id: 'cochonnet'
        });
    }
}
