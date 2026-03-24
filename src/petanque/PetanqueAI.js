import {
    AI_EASY, AI_MEDIUM, AI_HARD,
    AI_POINTEUR, AI_TIREUR,
    AI_DELAY_MIN, AI_DELAY_MAX,
    TERRAIN_HEIGHT,
    AI_PERSONALITY_MODIFIERS,
    AI_MOMENTUM_SENSITIVITY,
    puissanceMultiplier,
    LOFT_RAFLE, LATERAL_SPIN_MIN_EFFET
} from '../utils/Constants.js';

import PointeurStrategy from './ai/PointeurStrategy.js';
import TireurStrategy from './ai/TireurStrategy.js';
import EquilibreStrategy from './ai/EquilibreStrategy.js';
import CompletStrategy from './ai/CompletStrategy.js';
import DefaultStrategy from './ai/DefaultStrategy.js';

const strategyMap = {
    'pointeur': PointeurStrategy,
    'tireur': TireurStrategy,
    'equilibre': EquilibreStrategy,
    'complet': CompletStrategy
};

export default class PetanqueAI {
    constructor(scene, engine, difficulty, personality = null, characterData = null) {
        this.scene = scene;
        this.engine = engine;
        this.difficulty = difficulty;
        this.characterData = characterData;

        // If character data provided (from characters.json), use its AI config
        if (characterData && characterData.ai) {
            this.precisionConfig = {
                angleDev: characterData.ai.angleDev,
                powerDev: characterData.ai.powerDev,
                canShoot: characterData.ai.shootProbability > 0,
                shootThreshold: 3
            };
            this.personality = {
                personality: characterData.archetype,
                shootProbability: characterData.ai.shootProbability,
                loftPref: characterData.ai.loftPref,
                targetsCocho: characterData.ai.targetsCocho
            };
            this._charStats = characterData.stats || { precision: 6, puissance: 6, effet: 6, sang_froid: 6 };
        } else {
            // Legacy: resolve from difficulty string
            this.precisionConfig = difficulty === 'hard' ? AI_HARD
                : difficulty === 'medium' ? AI_MEDIUM
                : AI_EASY;
            this.personality = this._resolvePersonality(personality, difficulty);
            this._charStats = { precision: 6, puissance: 6, effet: 6, sang_froid: 6 };
        }

        // Track consecutive actions for variety
        this._consecutivePoints = 0;
        this._consecutiveShots = 0;

        // Momentum system: persists across shots within a match
        // Range: -1.0 (tilt) to +1.0 (on fire)
        this._momentum = 0;
        // Per-archetype momentum sensitivity
        this._momentumSensitivity = this._getMomentumSensitivity();

        // Resolve strategy based on personality archetype
        const StrategyClass = strategyMap[this.personality?.personality] || DefaultStrategy;
        this._strategy = new StrategyClass(this);
    }

    _getMomentumSensitivity() {
        const p = this.personality?.personality || 'equilibre';
        return AI_MOMENTUM_SENSITIVITY[p] ?? AI_MOMENTUM_SENSITIVITY.equilibre;
    }

    // Called after each shot result to update momentum
    updateMomentum(wasGoodShot) {
        const sens = this._momentumSensitivity;
        if (wasGoodShot) {
            this._momentum = Math.min(1, this._momentum + 0.3 * (1 + sens));
        } else {
            this._momentum = Math.max(-1, this._momentum - 0.25 * (1 + sens));
        }
        // Natural decay toward 0
        this._momentum *= 0.85;
    }

    _resolvePersonality(personality, difficulty) {
        if (personality === 'pointeur') return AI_POINTEUR;
        if (personality === 'tireur') return AI_TIREUR;

        // Default: derive from difficulty
        if (difficulty === 'hard') return AI_POINTEUR;
        if (difficulty === 'medium') return AI_TIREUR;
        return AI_EASY;
    }

    takeTurn() {
        const delay = Phaser.Math.Between(AI_DELAY_MIN, AI_DELAY_MAX);

        this.scene.time.delayedCall(delay, () => {
            if (this.engine.state === 'COCHONNET_THROW') {
                this._throwCochonnet();
            } else {
                this._throwBall();
            }
        });
    }

    _throwCochonnet() {
        const p = this.personality;
        let angle, power;

        if (p.personality === 'pointeur') {
            angle = -Math.PI / 2 + this._noise(2) * Math.PI / 180;
            power = 0.45 + this._noise(0.08);
        } else if (p.personality === 'tireur') {
            angle = -Math.PI / 2 + this._noise(5) * Math.PI / 180;
            power = 0.7 + this._noise(0.12);
        } else if (p.personality === 'complet') {
            // Reyes places cochonnet at medium distance, very centered — optimal for his game
            angle = -Math.PI / 2 + this._noise(1.5) * Math.PI / 180;
            power = 0.55 + this._noise(0.06);
        } else if (p.personality === 'equilibre') {
            // Marcel: place le cochonnet avec calme et precision — 40 ans d'experience
            angle = -Math.PI / 2 + this._noise(2.5) * Math.PI / 180;
            power = 0.50 + this._noise(0.08);
        } else {
            angle = -Math.PI / 2 + this._noise(5) * Math.PI / 180;
            power = 0.5 + this._noise(0.15);
        }

        this.engine.throwCochonnet(angle, Phaser.Math.Clamp(power, 0.2, 0.9));
    }

    _throwBall() {
        const cochonnet = this.engine.cochonnet;
        if (!cochonnet || !cochonnet.isAlive) return;

        const { target, shotMode, loftPreset } = this._chooseTarget();

        const cx = this.scene.throwCircleX;
        const cy = this.scene.throwCircleY;
        const dx = target.x - cx;
        const dy = target.y - cy;
        const idealAngle = Math.atan2(dy, dx);
        const idealDist = Math.sqrt(dx * dx + dy * dy);

        // Precision from config, with pressure modifier
        let angleDev = this.precisionConfig.angleDev;
        let powerDev = this.precisionConfig.powerDev;

        // Pressure: when both scores >= 10, precision degrades based on sang-froid
        const scores = this.engine.scores;
        if (scores.player >= 10 && scores.opponent >= 10) {
            const pressureMult = 1 + (10 - this._charStats.sang_froid) / 9 * 0.8;
            angleDev *= pressureMult;
            powerDev *= pressureMult;
        }

        // Personality-based precision modifiers (centralized in Constants.js)
        const archetype = this.personality.personality;
        const mods = AI_PERSONALITY_MODIFIERS[archetype];
        if (mods) {
            const mode = shotMode === 'tirer' ? 'tirer' : 'pointer';
            const mod = mods[mode];
            if (mod) {
                angleDev *= mod.angle;
                powerDev *= mod.power;
            }
        }

        // === MOMENTUM EFFECT (all personalities) ===
        const momentumMod = 1 + this._momentum * this._momentumSensitivity * 3;
        angleDev *= Math.max(0.3, momentumMod);
        powerDev *= Math.max(0.3, momentumMod);

        const angleNoise = this._noise(angleDev) * Math.PI / 180;
        const powerNoise = this._noise(powerDev);

        const angle = idealAngle + angleNoise;
        const isTir = shotMode === 'tirer';
        const puissanceMult = puissanceMultiplier(this._charStats.puissance);
        const maxDist = TERRAIN_HEIGHT * (isTir ? 0.95 : 0.85) * puissanceMult;
        const idealPower = idealDist / maxDist;
        const power = Phaser.Math.Clamp(idealPower + powerNoise, 0.1, 1.0);

        // Track action for variety
        if (isTir) { this._consecutiveShots++; this._consecutivePoints = 0; }
        else { this._consecutivePoints++; this._consecutiveShots = 0; }

        // Rafle : utiliser sur terrain peu friction (dalles/terre), en mode tir
        // La rafle rase le sol — efficace quand la friction est faible
        let finalLoftPreset = loftPreset;
        if (isTir && this.engine.frictionMult < 1.5 && Math.random() < 0.35) {
            finalLoftPreset = LOFT_RAFLE;
        }

        // AI retro decision: use retro on plombee/tir when effet stat is decent
        let retroIntensity = 0;
        if (finalLoftPreset.retroAllowed && this._charStats.effet >= 4) {
            const effetStat = this._charStats.effet;
            const retroChance = (effetStat - 3) / 7;
            if (Math.random() < retroChance) {
                retroIntensity = 0.1 + (effetStat - 1) / 9 * 0.9;
            }
        }

        // Spin lateral : si effet >= 6, chance proportionnelle au stat
        let lateralSpin = 0;
        const effetStat = this._charStats.effet;
        if (effetStat >= LATERAL_SPIN_MIN_EFFET && effetStat >= 6) {
            const spinChance = (effetStat - 5) / 5; // effet 6 = 20%, effet 10 = 100%
            if (Math.random() < spinChance * 0.4) { // Max 40% de chance pour garder IA lisible
                lateralSpin = Math.random() < 0.5 ? -1 : 1;
            }
        }

        const arrowColor = isTir ? 0xFF6644 : 0xC44B3F;
        const retro = retroIntensity;
        this._showAimingArrow(angle, power, arrowColor, () => {
            this.engine.throwBall(angle, power, 'opponent', shotMode, finalLoftPreset, retro, {
                lateralSpin,
                effetStat,
            });
        });
    }

    // Delegate target choice to the active strategy
    _chooseTarget() {
        const cochonnet = this.engine.cochonnet;
        const sit = this._strategy._analyzeSituation();
        return this._strategy.chooseTarget(cochonnet, sit);
    }

    // ---- HELPERS (kept in PetanqueAI) ----

    _showAimingArrow(angle, power, color, callback) {
        const g = this.scene.add.graphics().setDepth(50);
        const originX = this.scene.throwCircleX;
        const originY = this.scene.throwCircleY;
        const arrowLen = power * 40;
        const endX = originX + Math.cos(angle) * arrowLen;
        const endY = originY + Math.sin(angle) * arrowLen;

        g.lineStyle(2, color, 0.6);
        g.beginPath();
        g.moveTo(originX, originY);
        g.lineTo(endX, endY);
        g.strokePath();

        this.scene.time.delayedCall(400, () => {
            g.destroy();
            if (callback) callback();
        });
    }

    _noise(magnitude) {
        return (Math.random() - 0.5) * 2 * magnitude;
    }
}
