import {
    AI_EASY, AI_MEDIUM, AI_HARD,
    AI_MARCEL, AI_FANNY, AI_RICARDO, AI_MARIUS,
    AI_DELAY_MIN, AI_DELAY_MAX,
    LOFT_TIR, LOFT_ROULETTE, LOFT_DEMI_PORTEE, LOFT_PLOMBEE,
    TERRAIN_HEIGHT
} from '../utils/Constants.js';

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
    }

    _getMomentumSensitivity() {
        const p = this.personality?.personality || 'equilibre';
        // How much momentum affects precision (higher = more volatile)
        switch (p) {
            case 'equilibre': return 0.10;  // Rene: stable, barely affected
            case 'pointeur':  return 0.05;  // Marcel: imperturbable
            case 'tireur':    return 0.20;  // Fanny: rage makes her worse OR better
            case 'stratege':  return 0.08;  // Ricardo: controlled but not immune
            case 'wildcard':  return 0.50;  // Thierry: EXTREME momentum swings
            case 'boss':      return 0.03;  // Marius: nearly unshakeable
            default:          return 0.10;
        }
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
        if (personality === 'pointeur') return AI_MARCEL;
        if (personality === 'tireur') return AI_FANNY;
        if (personality === 'stratege') return AI_RICARDO;
        if (personality === 'complet') return AI_MARIUS;

        // Default: derive from difficulty
        if (difficulty === 'hard') return AI_RICARDO;
        if (difficulty === 'medium') return AI_FANNY;
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
            // Pointeur: cochonnet bien centre, distance moyenne (bon pour roulette)
            angle = -Math.PI / 2 + this._noise(2) * Math.PI / 180;
            power = 0.45 + this._noise(0.08);
        } else if (p.personality === 'tireur') {
            // Tireur: cochonnet loin (plus de place pour les tirs)
            angle = -Math.PI / 2 + this._noise(5) * Math.PI / 180;
            power = 0.7 + this._noise(0.12);
        } else if (p.personality === 'stratege') {
            // Stratege: cochonnet excentre pour creer un angle difficile
            const side = Math.random() < 0.5 ? -1 : 1;
            angle = -Math.PI / 2 + side * (8 + this._noise(4)) * Math.PI / 180;
            power = 0.5 + this._noise(0.1);
        } else if (p.personality === 'wildcard') {
            // Wildcard: imprévisible — parfois tres court, parfois tres loin
            power = Math.random() < 0.3 ? 0.25 + this._noise(0.05) : 0.75 + this._noise(0.1);
            angle = -Math.PI / 2 + this._noise(8) * Math.PI / 180;
        } else {
            // Equilibre/boss/default: standard
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

        // Tireur gets bonus precision when shooting (c'est sa specialite)
        // But WORSE when forced to point (not her thing)
        if (this.personality.personality === 'tireur') {
            if (shotMode === 'tirer') { angleDev *= 0.55; powerDev *= 0.55; }
            else { angleDev *= 1.3; powerDev *= 1.3; }
        }

        // Pointeur gets bonus precision when pointing (c'est sa specialite)
        // But TERRIBLE when forced to shoot
        if (this.personality.personality === 'pointeur') {
            if (shotMode === 'pointer') { angleDev *= 0.6; powerDev *= 0.6; }
            else { angleDev *= 1.5; powerDev *= 1.5; }
        }

        // Boss: consistently good at everything, less noise overall
        if (this.personality.personality === 'boss') {
            angleDev *= 0.7;
            powerDev *= 0.7;
        }

        // Wildcard: extreme hot/cold streaks — now driven by momentum
        if (this.personality.personality === 'wildcard') {
            // Thierry's streaks are amplified by momentum
            if (this._momentum > 0.3) {
                // In the zone: momentum makes him a genius
                const zoneBoost = 0.3 + this._momentum * 0.4;
                angleDev *= zoneBoost;
                powerDev *= zoneBoost;
            } else if (this._momentum < -0.3) {
                // Tilted: momentum makes it catastrophic
                const tiltPenalty = 1.5 + Math.abs(this._momentum) * 1.5;
                angleDev *= tiltPenalty;
                powerDev *= tiltPenalty;
            } else {
                // Neutral: still somewhat volatile
                const streakFactor = Math.random();
                if (streakFactor < 0.20) { angleDev *= 0.4; powerDev *= 0.4; }
                else if (streakFactor > 0.85) { angleDev *= 1.8; powerDev *= 1.8; }
            }
        }

        // === MOMENTUM EFFECT (all personalities) ===
        // Positive momentum = more precise, negative = less precise
        const momentumMod = 1 - this._momentum * this._momentumSensitivity * 3;
        angleDev *= Math.max(0.3, momentumMod);
        powerDev *= Math.max(0.3, momentumMod);

        const angleNoise = this._noise(angleDev) * Math.PI / 180;
        const powerNoise = this._noise(powerDev);

        const angle = idealAngle + angleNoise;
        const isTir = shotMode === 'tirer';
        const puissanceMult = 0.7 + (this._charStats.puissance - 1) / 9 * 0.5;
        const maxDist = TERRAIN_HEIGHT * (isTir ? 0.95 : 0.85) * puissanceMult;
        const idealPower = idealDist / maxDist;
        const power = Phaser.Math.Clamp(idealPower + powerNoise, 0.1, 1.0);

        // Track action for variety
        if (isTir) { this._consecutiveShots++; this._consecutivePoints = 0; }
        else { this._consecutivePoints++; this._consecutiveShots = 0; }

        // AI retro decision: use retro on plombee/tir when effet stat is decent
        let retroIntensity = 0;
        if (loftPreset.retroAllowed && this._charStats.effet >= 4) {
            const effetStat = this._charStats.effet;
            const retroChance = (effetStat - 3) / 7; // effet 4 = 14%, effet 10 = 100%
            if (Math.random() < retroChance) {
                retroIntensity = 0.1 + (effetStat - 1) / 9 * 0.9;
            }
        }

        const arrowColor = isTir ? 0xFF6644 : 0xC44B3F;
        const retro = retroIntensity;
        this._showAimingArrow(angle, power, arrowColor, () => {
            this.engine.throwBall(angle, power, 'opponent', shotMode, loftPreset, retro);
        });
    }

    // ---- GAME SITUATION ANALYSIS ----

    _analyzeSituation() {
        const cochonnet = this.engine.cochonnet;
        const aiHasPoint = this._aiHasPoint();
        const playerBalls = this.engine.getTeamBallsAlive('player');
        const aiBalls = this.engine.getTeamBallsAlive('opponent');
        const aiRemaining = this.engine.remaining.opponent;
        const playerRemaining = this.engine.remaining.player;
        const scoreDiff = this.engine.scores.opponent - this.engine.scores.player;
        const bouleAdvantage = aiRemaining - playerRemaining;

        // How many points would player score right now?
        const projectedScore = this.engine.calculateProjectedScore
            ? this.engine.calculateProjectedScore()
            : null;
        const playerProjectedPoints = projectedScore && projectedScore.winner === 'player'
            ? projectedScore.points : 0;
        const aiProjectedPoints = projectedScore && projectedScore.winner === 'opponent'
            ? projectedScore.points : 0;

        // Distance of best player ball to cochonnet
        const bestPlayerBall = this._closestPlayerBall();
        const bestPlayerDist = bestPlayerBall ? bestPlayerBall.dist : Infinity;

        // Distance of best AI ball to cochonnet
        let bestAiDist = Infinity;
        for (const b of aiBalls) {
            const d = b.distanceTo(cochonnet);
            if (d < bestAiDist) bestAiDist = d;
        }

        return {
            aiHasPoint,
            playerBalls,
            aiBalls,
            aiRemaining,
            playerRemaining,
            scoreDiff,
            bouleAdvantage,
            playerProjectedPoints,
            aiProjectedPoints,
            bestPlayerBall,
            bestPlayerDist,
            bestAiDist,
            isLastBall: aiRemaining <= 1,
            isDesperate: scoreDiff < -4,
            isCloseGame: Math.abs(scoreDiff) <= 2,
            isMatchPoint: this.engine.scores.player >= 11, // player about to win
            aiMatchPoint: this.engine.scores.opponent >= 11  // AI about to win
        };
    }

    _chooseTarget() {
        const cochonnet = this.engine.cochonnet;
        const p = this.personality;
        const sit = this._analyzeSituation();

        // Dispatch to archetype-specific strategy
        switch (p.personality) {
            case 'pointeur': return this._strategyPointeur(cochonnet, sit);
            case 'tireur': return this._strategyTireur(cochonnet, sit);
            case 'stratege': return this._strategyStratege(cochonnet, sit);
            case 'wildcard': return this._strategyWildcard(cochonnet, sit);
            case 'boss': return this._strategyBoss(cochonnet, sit);
            case 'equilibre': return this._strategyEquilibre(cochonnet, sit);
            default: return this._strategyDefault(cochonnet, sit);
        }
    }

    // ---- MARCEL: LE POINTEUR ----
    // Philosophie: ne jamais tirer sauf en dernier recours absolu.
    // Place ses boules chirurgicalement. Vise un offset lateral (pas pile sur le cochonnet)
    // pour se placer "devant" et bloquer la route. Roulette obsessionnel.
    _strategyPointeur(cochonnet, sit) {
        // Ultra-rare desperation shot: only when losing 3+ points AND last ball
        if (!sit.aiHasPoint && sit.playerProjectedPoints >= 3 && sit.isLastBall) {
            if (Math.random() < 0.3 && sit.bestPlayerBall) {
                return this._makeShot(sit.bestPlayerBall.ball);
            }
        }

        // Smart placement: offset from cochonnet to block adversary approach
        const offset = this._computePointeurOffset(cochonnet, sit);
        const loft = this._chooseLoft();

        return {
            target: { x: cochonnet.x + offset.x, y: cochonnet.y + offset.y },
            shotMode: 'pointer',
            loftPreset: loft
        };
    }

    // Calculate an intelligent offset for pointing:
    // - If no enemy balls: aim tight to cochonnet
    // - If enemy balls exist: place between cochonnet and their best ball (block)
    _computePointeurOffset(cochonnet, sit) {
        const baseOffset = 3 + this._noise(4); // 3-7px offset (very close)

        if (sit.playerBalls.length === 0 || sit.aiHasPoint) {
            // No threat or already winning: aim tight
            const angle = Math.random() * Math.PI * 2;
            return { x: Math.cos(angle) * baseOffset, y: Math.sin(angle) * baseOffset };
        }

        // Place between cochonnet and the best player ball (block strategy)
        const threat = sit.bestPlayerBall.ball;
        const dx = threat.x - cochonnet.x;
        const dy = threat.y - cochonnet.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 1) return { x: baseOffset, y: 0 };

        // Aim slightly toward the threat (interpose)
        const nx = dx / dist;
        const ny = dy / dist;
        return {
            x: nx * baseOffset * 0.5 + this._noise(2),
            y: ny * baseOffset * 0.5 + this._noise(2)
        };
    }

    // ---- FANNY: LA TIREUSE ----
    // Philosophie: si elle n'a pas le point, elle tire. Toujours. Sauf conservation dernier boule.
    // Cible la boule adverse la plus dangereuse (la plus proche du cochonnet).
    // Quand elle a le point: pointe avec demi-portee (pas roulette, pas son style).
    _strategyTireur(cochonnet, sit) {
        const shouldShoot = this._tireurShouldShoot(sit);

        if (shouldShoot && sit.playerBalls.length > 0) {
            // Choose target: best (closest to cochonnet) player ball
            const target = this._chooseTirTarget(sit);
            if (target) return this._makeShot(target);
        }

        // Fall back to pointing (not her strength — very coarse aim)
        return {
            target: { x: cochonnet.x + this._noise(12), y: cochonnet.y + this._noise(12) },
            shotMode: 'pointer',
            loftPreset: LOFT_DEMI_PORTEE
        };
    }

    _tireurShouldShoot(sit) {
        // Conservation: last ball AND has the point → protect the lead
        if (sit.isLastBall && sit.aiHasPoint) return false;

        // No point → shoot (this is her identity)
        if (!sit.aiHasPoint) return true;

        // Has the point but player about to score big → preemptive shot
        if (sit.playerProjectedPoints >= 3) return true;

        // Has the point, comfortable → don't shoot
        return false;
    }

    _chooseTirTarget(sit) {
        // Best player ball = the one closest to cochonnet (most threatening)
        if (!sit.bestPlayerBall) return null;
        return sit.bestPlayerBall.ball;
    }

    // ---- RICARDO: LE STRATEGE ----
    // Philosophie: chaque boule est un investissement. Analyse cout/benefice de chaque option.
    // Peut cibler le cochonnet pour annuler une mene perdue (mene morte = reset).
    // Adapte sa technique au terrain. Mixe pointer et tirer selon un score d'utilite.
    _strategyStratege(cochonnet, sit) {
        // === Option 1: Target cochonnet (mene morte) ===
        // Quand la mene est perdue et qu'il vaut mieux recommencer
        if (this._shouldTargetCochonnet(sit)) {
            return {
                target: { x: cochonnet.x, y: cochonnet.y },
                shotMode: 'tirer',
                loftPreset: LOFT_TIR
            };
        }

        // === Option 2: Shoot a player ball ===
        const shootUtility = this._computeShootUtility(sit);
        const pointUtility = this._computePointUtility(sit);

        if (shootUtility > pointUtility && sit.playerBalls.length > 0) {
            // Choose the most strategic target (not always the closest)
            const target = this._chooseStrategicTarget(sit);
            if (target) return this._makeShot(target);
        }

        // === Option 3: Point ===
        const loft = this._chooseLoft();
        return {
            target: { x: cochonnet.x + this._noise(4), y: cochonnet.y + this._noise(4) },
            shotMode: 'pointer',
            loftPreset: loft
        };
    }

    _shouldTargetCochonnet(sit) {
        if (!this.personality.targetsCocho) return false;
        // Conditions for mene morte strategy:
        // 1. AI is losing badly this mene (3+ points projected for player)
        // 2. Not many AI balls left (can't recover by pointing)
        // 3. AI has boule disadvantage
        if (sit.playerProjectedPoints >= 3 && sit.aiRemaining <= 2 && sit.bouleAdvantage <= 0) {
            return Math.random() < 0.4;
        }
        // Also consider: match point for opponent, mene is unsalvageable
        if (sit.isMatchPoint && sit.playerProjectedPoints >= 2 && !sit.aiHasPoint) {
            return Math.random() < 0.5;
        }
        return false;
    }

    _computeShootUtility(sit) {
        let utility = 0;
        if (!sit.aiHasPoint) utility += 40;
        if (sit.playerProjectedPoints >= 2) utility += 20;
        if (sit.isDesperate) utility += 15;
        if (sit.bestPlayerDist < 15) utility += 10; // Very well-placed ball = worth shooting
        // Penalize shooting when we have boule advantage (save for later)
        if (sit.bouleAdvantage >= 2) utility -= 20;
        // Bonus if consecutive points (mix it up)
        if (this._consecutivePoints >= 2) utility += 10;
        return utility + this._noise(10);
    }

    _computePointUtility(sit) {
        let utility = 30; // Base preference
        if (sit.aiHasPoint) utility += 25;
        if (sit.aiProjectedPoints >= 2) utility += 15; // Already scoring well, keep building
        if (sit.isLastBall) utility += 20; // Conserve last ball
        // Bonus if consecutive shots (mix it up)
        if (this._consecutiveShots >= 2) utility += 15;
        return utility + this._noise(10);
    }

    _chooseStrategicTarget(sit) {
        const playerBalls = sit.playerBalls;
        if (playerBalls.length === 0) return null;

        // Score each player ball by threat level
        const cochonnet = this.engine.cochonnet;
        let bestTarget = null;
        let bestScore = -Infinity;

        for (const ball of playerBalls) {
            const dist = ball.distanceTo(cochonnet);
            let score = 100 - dist; // Closer to cochonnet = more threatening

            // Bonus for balls that are "blocking" (between throw circle and cochonnet)
            const cy = this.scene.throwCircleY;
            if (ball.y < cy && ball.y > cochonnet.y) score += 15;

            // Bonus for clustered balls (hitting one might displace others)
            for (const other of playerBalls) {
                if (other !== ball && ball.distanceTo(other) < 30) score += 8;
            }

            if (score > bestScore) {
                bestScore = score;
                bestTarget = ball;
            }
        }

        return bestTarget;
    }

    // ---- RENE: L'EQUILIBRE ----
    // Refonte: Rene est "le mec relax qui joue pour le fun mais qui a des coups de genie".
    // Il adapte son style au score, varie ses lofts, et a des "moments pastis" imprevisibles.
    _strategyEquilibre(cochonnet, sit) {
        // "Moment pastis" — 15% du temps, coup instinctif (brillant ou ridicule)
        if (Math.random() < 0.15) {
            return this._reneMomentPastis(cochonnet, sit);
        }

        // Score-adaptive: mene au score → prudent, en tete → detendu et prend des risques
        const isRelaxed = sit.scoreDiff >= 2;
        const isStressed = sit.scoreDiff <= -3;

        // Shooting decision: broader trigger than before (30px threshold, higher probability)
        let shouldShoot = false;
        if (!sit.aiHasPoint && sit.playerBalls.length > 0) {
            const shootThreshold = isStressed ? 35 : 25; // stressed = shoots more
            const shootProb = isRelaxed ? 0.40 : isStressed ? 0.45 : 0.30;
            if (sit.bestPlayerDist < shootThreshold) {
                shouldShoot = Math.random() < shootProb;
            }
        }

        // Desperation boost
        if (sit.isDesperate && Math.random() < 0.4) shouldShoot = true;

        // 8% pure instinct flip (keeps Rene unpredictable)
        if (Math.random() < 0.08) shouldShoot = !shouldShoot;

        if (shouldShoot && sit.bestPlayerBall) {
            return this._makeShot(sit.bestPlayerBall.ball);
        }

        // Pointing: vary lofts based on mood
        let loft;
        if (isRelaxed) {
            // Relaxed = try different things for fun
            const roll = Math.random();
            if (roll < 0.3) loft = LOFT_ROULETTE;
            else if (roll < 0.6) loft = LOFT_DEMI_PORTEE;
            else loft = LOFT_PLOMBEE;
        } else {
            // Serious = terrain-adapted
            loft = this._chooseLoft();
        }

        // Variable offset (not always piled on cochonnet)
        const spread = isRelaxed ? 8 : 5;
        return {
            target: { x: cochonnet.x + this._noise(spread), y: cochonnet.y + this._noise(spread) },
            shotMode: 'pointer',
            loftPreset: loft
        };
    }

    // Rene's special moments: instinctive, surprising, sometimes brilliant
    _reneMomentPastis(cochonnet, sit) {
        const roll = Math.random();

        if (roll < 0.35 && sit.playerBalls.length > 0) {
            // "Tiens, et si je tirais?" — impulsive shot, sometimes at a random ball
            const balls = sit.playerBalls;
            const target = balls[Math.floor(Math.random() * balls.length)];
            return this._makeShot(target);
        }

        if (roll < 0.60) {
            // Plombee audacieuse — gros arc, placement risque mais fun
            return {
                target: { x: cochonnet.x + this._noise(3), y: cochonnet.y + this._noise(3) },
                shotMode: 'pointer',
                loftPreset: LOFT_PLOMBEE
            };
        }

        if (roll < 0.80) {
            // Roulette longue distance — smooth operator
            return {
                target: { x: cochonnet.x + this._noise(6), y: cochonnet.y + this._noise(6) },
                shotMode: 'pointer',
                loftPreset: LOFT_ROULETTE
            };
        }

        // "Allez, la totale" — tir au cochonnet (chaos fun, very rare)
        if (sit.playerBalls.length > 0 && !sit.isLastBall) {
            return {
                target: { x: cochonnet.x, y: cochonnet.y },
                shotMode: 'tirer',
                loftPreset: LOFT_TIR
            };
        }

        // Fallback: standard point
        return {
            target: { x: cochonnet.x + this._noise(5), y: cochonnet.y + this._noise(5) },
            shotMode: 'pointer',
            loftPreset: this._chooseLoft()
        };
    }

    // ---- THIERRY: LE WILDCARD ----
    // Philosophie: imprévisible, prend des risques fous. Tire de loin, tente des coups impossibles.
    // Peut tirer même quand il a le point (pour le style). Peut pointer avec plombee.
    // Momentum player: quand il enchaine, il est incroyable. Quand il craque, c'est le chaos.
    _strategyWildcard(cochonnet, sit) {
        const mood = Math.random();

        // 20% chance: "coup de folie" — tire peu importe la situation
        if (mood < 0.2 && sit.playerBalls.length > 0 && !sit.isLastBall) {
            // Pick a random player ball (not always the smartest target)
            const randomIdx = Math.floor(Math.random() * sit.playerBalls.length);
            return this._makeShot(sit.playerBalls[randomIdx]);
        }

        // 10% chance: target cochonnet for chaos (if has the ability)
        if (mood < 0.3 && this.personality.targetsCocho && !sit.isLastBall) {
            if (Math.random() < 0.2) {
                return {
                    target: { x: cochonnet.x, y: cochonnet.y },
                    shotMode: 'tirer',
                    loftPreset: LOFT_TIR
                };
            }
        }

        // Normal decision (but with higher shoot tendency than equilibre)
        if (!sit.aiHasPoint && sit.playerBalls.length > 0) {
            const shootProb = sit.isDesperate ? 0.8 : 0.6;
            if (Math.random() < shootProb) {
                const target = sit.bestPlayerBall ? sit.bestPlayerBall.ball : null;
                if (target) return this._makeShot(target);
            }
        }

        // Pointing: uses varied lofts (sometimes plombee for fun)
        const loftChoice = Math.random();
        let loft;
        if (loftChoice < 0.3) loft = LOFT_PLOMBEE;
        else if (loftChoice < 0.6) loft = LOFT_DEMI_PORTEE;
        else loft = this._chooseLoft(); // Terrain-adapted

        // Aim with more variance (risky but sometimes brilliant)
        return {
            target: { x: cochonnet.x + this._noise(8), y: cochonnet.y + this._noise(8) },
            shotMode: 'pointer',
            loftPreset: loft
        };
    }

    // ---- MARIUS: LE BOSS ----
    // Philosophie: le meilleur joueur. Analyse parfaitement, choisit toujours l'option optimale.
    // Combine les forces de tous les archetypes. Adapte son style a la situation.
    // Tire quand c'est rentable, pointe quand c'est sur, cible cochonnet quand c'est malin.
    _strategyBoss(cochonnet, sit) {
        // === Mene morte si necessaire (comme le stratege, mais mieux calibre) ===
        if (this._shouldTargetCochonnet(sit)) {
            return {
                target: { x: cochonnet.x, y: cochonnet.y },
                shotMode: 'tirer',
                loftPreset: LOFT_TIR
            };
        }

        // === Cost-benefit analysis ===
        const shootScore = this._bossShootScore(sit);
        const pointScore = this._bossPointScore(sit);

        if (shootScore > pointScore && sit.playerBalls.length > 0) {
            // Shoot like a stratege (best target selection)
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
        if (sit.bestPlayerDist < 12) score += 15; // Well-placed, worth displacing
        if (sit.isDesperate) score += 20;
        if (sit.isMatchPoint) score += 15; // Extra urgency when player about to win
        if (sit.isLastBall) score -= 30; // Conserve last ball
        if (sit.bouleAdvantage >= 2) score -= 15;
        return score + this._noise(5); // Less noise = more consistent than stratege
    }

    _bossPointScore(sit) {
        let score = 35;
        if (sit.aiHasPoint) score += 30;
        if (sit.aiProjectedPoints >= 2) score += 20;
        if (sit.isLastBall) score += 25;
        if (sit.aiMatchPoint) score += 15; // Close to winning, play safe
        return score + this._noise(5);
    }

    // ---- DEFAULT (legacy difficulty-based) ----
    _strategyDefault(cochonnet, sit) {
        let shouldShoot = false;

        if (this.precisionConfig.canShoot && sit.playerBalls.length > 0) {
            const closest = sit.bestPlayerBall;
            if (closest && closest.dist < (this.precisionConfig.shootThreshold || 2) * 5) {
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

    // ---- HELPERS ----

    _makeShot(targetBall) {
        return {
            target: { x: targetBall.x, y: targetBall.y },
            shotMode: 'tirer',
            loftPreset: LOFT_TIR
        };
    }

    _aiHasPoint() {
        const aiDist = this.engine._getMinDistance('opponent');
        const playerDist = this.engine._getMinDistance('player');
        return aiDist < playerDist;
    }

    _closestPlayerBall() {
        const cochonnet = this.engine.cochonnet;
        const playerBalls = this.engine.getTeamBallsAlive('player');
        if (playerBalls.length === 0) return null;

        return playerBalls.reduce((closest, b) => {
            const d = b.distanceTo(cochonnet);
            return d < closest.dist ? { ball: b, dist: d } : closest;
        }, { ball: null, dist: Infinity });
    }

    _chooseLoft() {
        const terrain = this.engine.terrainType;
        const p = this.personality;

        if (p.loftPref === 'roulette') {
            if (terrain === 'sable') return LOFT_DEMI_PORTEE;
            return LOFT_ROULETTE;
        }
        if (p.loftPref === 'plombee') {
            return LOFT_PLOMBEE;
        }
        if (p.loftPref === 'adaptatif') {
            if (terrain === 'terre' || terrain === 'dalles') return LOFT_ROULETTE;
            if (terrain === 'herbe') return LOFT_DEMI_PORTEE;
            if (terrain === 'sable') return LOFT_PLOMBEE;
            return LOFT_DEMI_PORTEE;
        }
        return LOFT_DEMI_PORTEE;
    }

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
