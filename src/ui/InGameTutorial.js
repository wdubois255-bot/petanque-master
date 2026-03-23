import { loadSave, saveSave } from '../utils/SaveManager.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../utils/Constants.js';

const DEPTH = 200;
const HINT_DEPTH = 195;
const TEXT_STYLE = {
    fontFamily: 'monospace',
    fontSize: '14px',
    color: '#F5E6D0',
    stroke: '#1A1510',
    strokeThickness: 3,
    align: 'center',
    wordWrap: { width: 420 }
};

const HINT_STYLE = {
    fontFamily: 'monospace',
    fontSize: '13px',
    color: '#F5E6D0',
    stroke: '#1A1510',
    strokeThickness: 2,
    align: 'center',
    wordWrap: { width: 360 }
};

/**
 * Enhanced in-game tutorial overlay for first Arcade match.
 * 7 contextual steps + post-tutorial terrain/mechanic tooltips.
 * Non-blocking, appears during natural game pauses.
 */
export default class InGameTutorial {
    constructor(scene) {
        this.scene = scene;
        this.engine = scene.engine;
        this.step = 0;
        this.completed = false;
        this._elements = [];
        this._tweens = [];
        this._playerHasThrown = false;
        this._firstMeneScored = false;
        this._playerBallCount = 0;
        this._shownHints = new Set();

        // Safety: destroy on scene shutdown
        this._onShutdown = () => this.destroy();
        scene.events.once('shutdown', this._onShutdown);

        // Hook into engine callbacks (chain with existing ones)
        this._origOnStateChange = this.engine.onStateChange;
        this._origOnTurnChange = this.engine.onTurnChange;
        this._origOnScore = this.engine.onScore;

        this.engine.onStateChange = (state) => {
            if (this._origOnStateChange) this._origOnStateChange(state);
            this._handleStateChange(state);
        };

        this.engine.onTurnChange = (team) => {
            if (this._origOnTurnChange) this._origOnTurnChange(team);
            this._handleTurnChange(team);
        };

        this.engine.onScore = (scores, winner, points) => {
            if (this._origOnScore) this._origOnScore(scores, winner, points);
            this._handleScore(scores, winner, points);
        };
    }

    _handleStateChange(state) {
        if (this.completed) return;

        // Step 0 → 1: Cochonnet throw
        if (state === 'COCHONNET_THROW' && this.step === 0 && this.engine.currentTeam === 'player') {
            this._showStep1_Cochonnet();
        }

        // Step 1 → 2: First ball
        if ((state === 'FIRST_BALL' || state === 'PLAY_LOOP') && this.step === 1 && this.engine.currentTeam === 'player') {
            this._showStep2_FirstBall();
        }

        // Step 2 → 3: Ball launched, waiting for stop
        if (state === 'WAITING_STOP' && this.step === 2 && this._playerHasThrown) {
            this._showStep3_PowerFeedback();
        }

        // Step 4: Second ball (power dosage)
        if ((state === 'PLAY_LOOP') && this.step === 4 && this.engine.currentTeam === 'player' && this._playerBallCount >= 1) {
            this._showStep5_LoftHint();
        }

        // Step 5 → 6: Score mene (scoring explanation)
        if (state === 'SCORE_MENE' && !this._firstMeneScored) {
            this._firstMeneScored = true;
            this._showStep6_Scoring();
        }
    }

    _handleTurnChange(team) {
        if (this.completed) return;

        // Step 0 → 1: cochonnet thrown, advance
        if (this.step === 0 && this.engine.state === 'FIRST_BALL') {
            this._clearElements();
            this.step = 1;
        }

        // Detect player's ball throw completion
        if (this.step === 1 && team === 'player' && (this.engine.state === 'FIRST_BALL' || this.engine.state === 'PLAY_LOOP')) {
            this._showStep2_FirstBall();
        }

        // Track player ball count for step 5
        if (team !== 'player' && this.engine.state !== 'COCHONNET_THROW') {
            this._playerBallCount++;
        }
    }

    _handleScore(_scores, _winner, _points) {
        if (this.completed) return;
        // Score triggers handled via state change
    }

    // ================================================================
    // STEP 1: Cochonnet throw — "Le cochonnet est la cible"
    // ================================================================
    _showStep1_Cochonnet() {
        this._clearElements();
        this.step = 0;

        const cx = GAME_WIDTH / 2;

        // Animated hand/arrow showing drag-up gesture
        const arrow = this.scene.add.text(cx, 170, '\u25B2', {
            fontFamily: 'monospace', fontSize: '32px',
            color: '#87CEEB', stroke: '#1A1510', strokeThickness: 2
        }).setOrigin(0.5).setDepth(DEPTH);

        const arrowTween = this.scene.tweens.add({
            targets: arrow, y: 145,
            duration: 700, yoyo: true, repeat: -1,
            ease: 'Sine.easeInOut'
        });

        const hint = this.scene.add.text(cx, 205,
            'Glissez vers le haut pour lancer le cochonnet !\nC\'est la petite boule jaune — votre cible.',
            TEXT_STYLE
        ).setOrigin(0.5).setDepth(DEPTH);

        // Pulsing cochonnet area indicator
        const targetY = this.scene.terrainY + 60;
        const targetCircle = this.scene.add.circle(cx, targetY, 20, 0xFFD700, 0)
            .setStrokeStyle(2, 0xFFD700, 0.6).setDepth(DEPTH);

        const targetPulse = this.scene.tweens.add({
            targets: targetCircle,
            scaleX: 2, scaleY: 2, alpha: 0,
            duration: 1200, repeat: -1, ease: 'Sine.easeOut'
        });

        const targetLabel = this.scene.add.text(cx, targetY + 30, 'Zone cochonnet', {
            fontFamily: 'monospace', fontSize: '11px',
            color: '#FFD700', stroke: '#1A1510', strokeThickness: 2
        }).setOrigin(0.5).setDepth(DEPTH).setAlpha(0.7);

        this._elements.push(arrow, hint, targetCircle, targetLabel);
        this._tweens.push(arrowTween, targetPulse);
    }

    // ================================================================
    // STEP 2: First ball — "Placez votre boule pres du cochonnet"
    // ================================================================
    _showStep2_FirstBall() {
        if (this.step !== 1) return;
        this._clearElements();
        this.step = 2;
        this._playerHasThrown = false;

        const cx = GAME_WIDTH / 2;

        // Main instruction
        const hint = this.scene.add.text(cx, 35,
            'Placez votre boule le plus pres possible du cochonnet !',
            TEXT_STYLE
        ).setOrigin(0.5).setDepth(DEPTH);

        // Power dosage hint
        const powerHint = this.scene.add.text(cx, 60,
            'Plus vous glissez loin = plus de puissance',
            { ...HINT_STYLE, fontSize: '11px', color: '#87CEEB' }
        ).setOrigin(0.5).setDepth(DEPTH).setAlpha(0.8);

        this._elements.push(hint, powerHint);

        // Pulsing target around cochonnet
        if (this.engine.cochonnet && this.engine.cochonnet.isAlive) {
            const coch = this.engine.cochonnet;
            const circle = this.scene.add.circle(coch.x, coch.y, 24, 0x87CEEB, 0)
                .setStrokeStyle(2, 0x87CEEB, 0.8).setDepth(DEPTH);

            const pulseTween = this.scene.tweens.add({
                targets: circle,
                scaleX: 2, scaleY: 2, alpha: 0,
                duration: 1000, repeat: -1, ease: 'Sine.easeOut',
                onUpdate: () => {
                    if (this.engine.cochonnet && this.engine.cochonnet.isAlive) {
                        circle.setPosition(this.engine.cochonnet.x, this.engine.cochonnet.y);
                    }
                }
            });

            this._elements.push(circle);
            this._tweens.push(pulseTween);
        }

        // Power gauge visualization
        this._showPowerGauge();

        // Listen for player throw
        const checkThrow = this.scene.time.addEvent({
            delay: 200, loop: true,
            callback: () => {
                if (!this.scene || !this.engine) return;
                if (this.engine.state === 'WAITING_STOP' && this.engine.currentTeam === 'player') {
                    this._playerHasThrown = true;
                    checkThrow.destroy();
                }
                if (this.engine.state === 'SECOND_TEAM_FIRST' || this.engine.state === 'PLAY_LOOP') {
                    this._playerHasThrown = true;
                    checkThrow.destroy();
                    this._clearElements();
                    this._showStep3_PowerFeedback();
                }
            }
        });
        this._elements.push({ destroy: () => checkThrow.destroy() });
    }

    // ================================================================
    // POWER GAUGE — visual guide during step 2
    // ================================================================
    _showPowerGauge() {
        const gaugeX = GAME_WIDTH - 55;
        const gaugeY = GAME_HEIGHT / 2 - 60;
        const gaugeH = 120;
        const gaugeW = 12;

        // Background bar
        const bg = this.scene.add.graphics().setDepth(DEPTH);
        bg.fillStyle(0x1A1510, 0.5);
        bg.fillRoundedRect(gaugeX - 2, gaugeY - 2, gaugeW + 4, gaugeH + 4, 4);

        // Gradient segments: green (doux) → yellow (moyen) → red (fort)
        const segments = [
            { y: 0, h: 0.33, color: 0x44CC44, label: 'Doux' },
            { y: 0.33, h: 0.34, color: 0xDDAA33, label: 'Moyen' },
            { y: 0.67, h: 0.33, color: 0xCC4444, label: 'Fort' }
        ];

        const labels = [];
        for (const seg of segments) {
            const segG = this.scene.add.graphics().setDepth(DEPTH);
            const sy = gaugeY + gaugeH * (1 - seg.y - seg.h);
            const sh = gaugeH * seg.h;
            segG.fillStyle(seg.color, 0.6);
            segG.fillRect(gaugeX, sy, gaugeW, sh);
            this._elements.push(segG);

            const label = this.scene.add.text(gaugeX - 8, sy + sh / 2, seg.label, {
                fontFamily: 'monospace', fontSize: '9px',
                color: '#F5E6D0', stroke: '#1A1510', strokeThickness: 2
            }).setOrigin(1, 0.5).setDepth(DEPTH).setAlpha(0.7);
            labels.push(label);
            this._elements.push(label);
        }

        this._elements.push(bg);

        // Fade out after 4s
        this.scene.time.delayedCall(4000, () => {
            for (const el of [bg, ...labels]) {
                if (el && el.active !== false) {
                    this.scene.tweens.add({
                        targets: el, alpha: 0, duration: 500
                    });
                }
            }
        });
    }

    // ================================================================
    // STEP 3: Power feedback — "Bien joue !"
    // ================================================================
    _showStep3_PowerFeedback() {
        if (this.step !== 2) return;
        this._clearElements();
        this.step = 3;

        const cx = GAME_WIDTH / 2;

        // Evaluate how close the ball landed
        let feedbackMsg = 'Bien joue !';
        if (this.engine.cochonnet && this.engine.cochonnet.isAlive) {
            const playerBalls = this.engine.balls.filter(b => b.isAlive && b.team === 'player');
            if (playerBalls.length > 0) {
                const closest = playerBalls.reduce((best, b) => {
                    const d = b.distanceTo(this.engine.cochonnet);
                    return d < best.d ? { d, b } : best;
                }, { d: Infinity, b: null });
                if (closest.d < 20) feedbackMsg = 'Excellent ! Tres pres du cochonnet !';
                else if (closest.d < 50) feedbackMsg = 'Pas mal ! Continuez comme ca.';
                else feedbackMsg = 'Un peu loin... dosez mieux la puissance !';
            }
        }

        const hint = this.scene.add.text(cx, 35, feedbackMsg, TEXT_STYLE)
            .setOrigin(0.5).setDepth(DEPTH).setAlpha(0);

        const fadeIn = this.scene.tweens.add({
            targets: hint, alpha: 1, duration: 300, ease: 'Sine.easeOut'
        });

        this._elements.push(hint);
        this._tweens.push(fadeIn);

        // Show opponent turn info
        const subHint = this.scene.add.text(cx, 58, "L'adversaire joue... observez sa strategie !", {
            ...HINT_STYLE, fontSize: '11px', color: '#9B7BB8'
        }).setOrigin(0.5).setDepth(DEPTH).setAlpha(0);

        this.scene.tweens.add({
            targets: subHint, alpha: 0.8, duration: 400, delay: 500
        });

        this._elements.push(subHint);

        // Auto-advance to step 4 after 2.5s
        const timer = this.scene.time.delayedCall(2500, () => {
            this._clearElements();
            this.step = 4;
            // Step 4 is passive — wait for next player turn (step 5)
        });
        this._elements.push({ destroy: () => timer.destroy() });
    }

    // ================================================================
    // STEP 5: Loft hint — introduce shot types on 2nd throw
    // ================================================================
    _showStep5_LoftHint() {
        if (this.step !== 4) return;
        this._clearElements();
        this.step = 5;

        const cx = GAME_WIDTH / 2;

        const hint = this.scene.add.text(cx, 30,
            'Essayez les modes de lancer !',
            TEXT_STYLE
        ).setOrigin(0.5).setDepth(DEPTH);

        // Shot type cards
        const modes = [
            { key: '1', name: 'Roulette', desc: 'Roule au sol', color: '#44CC44' },
            { key: '2', name: 'Demi', desc: 'Mi-air mi-sol', color: '#87CEEB' },
            { key: '3', name: 'Plombee', desc: 'Arc haut', color: '#DDA0DD' },
            { key: 'T', name: 'Tir', desc: 'Frappe directe', color: '#CC4444' }
        ];

        const cardWidth = 90;
        const startX = cx - (modes.length * cardWidth) / 2 + cardWidth / 2;
        const cardY = 55;

        for (let i = 0; i < modes.length; i++) {
            const m = modes[i];
            const mx = startX + i * cardWidth;

            const bg = this.scene.add.graphics().setDepth(DEPTH);
            bg.fillStyle(0x3A2E28, 0.8);
            bg.fillRoundedRect(mx - 38, cardY - 12, 76, 38, 4);
            bg.lineStyle(1, parseInt(m.color.replace('#', ''), 16), 0.6);
            bg.strokeRoundedRect(mx - 38, cardY - 12, 76, 38, 4);

            const keyText = this.scene.add.text(mx - 28, cardY, `[${m.key}]`, {
                fontFamily: 'monospace', fontSize: '11px', color: m.color,
                stroke: '#1A1510', strokeThickness: 2
            }).setOrigin(0, 0.5).setDepth(DEPTH + 1);

            const nameText = this.scene.add.text(mx + 2, cardY - 4, m.name, {
                fontFamily: 'monospace', fontSize: '10px', color: '#F5E6D0',
                stroke: '#1A1510', strokeThickness: 1
            }).setOrigin(0, 0.5).setDepth(DEPTH + 1);

            const descText = this.scene.add.text(mx + 2, cardY + 8, m.desc, {
                fontFamily: 'monospace', fontSize: '9px', color: '#9E9E8E',
                stroke: '#1A1510', strokeThickness: 1
            }).setOrigin(0, 0.5).setDepth(DEPTH + 1);

            this._elements.push(bg, keyText, nameText, descText);
        }

        this._elements.push(hint);

        // Auto-dismiss after 5s
        const timer = this.scene.time.delayedCall(5000, () => {
            this._fadeOutElements();
        });
        this._elements.push({ destroy: () => timer.destroy() });
    }

    // ================================================================
    // STEP 6: Scoring — explain how points work
    // ================================================================
    _showStep6_Scoring() {
        this._clearElements();
        this.step = 6;

        const cx = GAME_WIDTH / 2;

        const hint = this.scene.add.text(cx, 30,
            'Fin de la mene ! Chaque boule plus proche\ndu cochonnet que la meilleure adverse = 1 point.',
            TEXT_STYLE
        ).setOrigin(0.5).setDepth(DEPTH).setAlpha(0);

        this.scene.tweens.add({
            targets: hint, alpha: 1, duration: 400, ease: 'Sine.easeOut'
        });

        const subHint = this.scene.add.text(cx, 70,
            'Premier a 13 points remporte le match !',
            { ...HINT_STYLE, color: '#FFD700' }
        ).setOrigin(0.5).setDepth(DEPTH).setAlpha(0);

        this.scene.tweens.add({
            targets: subHint, alpha: 1, duration: 400, delay: 300
        });

        this._elements.push(hint, subHint);

        // Draw distance lines to cochonnet for visual explanation
        this._drawScoringLines();

        // Auto-dismiss after 4s, then mark complete
        const timer = this.scene.time.delayedCall(4000, () => {
            this._fadeOutElements();
            this._markComplete();
        });
        this._elements.push({ destroy: () => timer.destroy() });
    }

    // ================================================================
    // SCORING LINES — visual distance indicators
    // ================================================================
    _drawScoringLines() {
        if (!this.engine.cochonnet || !this.engine.cochonnet.isAlive) return;

        const coch = this.engine.cochonnet;
        const aliveBalls = this.engine.balls.filter(b => b.isAlive);
        if (aliveBalls.length === 0) return;

        // Sort by distance to cochonnet
        const sorted = aliveBalls
            .map(b => ({ ball: b, dist: b.distanceTo(coch) }))
            .sort((a, b) => a.dist - b.dist);

        const g = this.scene.add.graphics().setDepth(DEPTH - 1);

        for (let i = 0; i < Math.min(sorted.length, 6); i++) {
            const { ball, dist } = sorted[i];
            const color = ball.team === 'player' ? 0x44CC44 : 0xCC4444;
            const alpha = 0.5 - i * 0.07;

            // Dashed line from ball to cochonnet
            g.lineStyle(1, color, alpha);
            const dx = coch.x - ball.x;
            const dy = coch.y - ball.y;
            const steps = Math.floor(dist / 6);
            for (let s = 0; s < steps; s += 2) {
                const t1 = s / steps;
                const t2 = Math.min((s + 1) / steps, 1);
                g.lineBetween(
                    ball.x + dx * t1, ball.y + dy * t1,
                    ball.x + dx * t2, ball.y + dy * t2
                );
            }
        }

        this._elements.push(g);
    }

    // ================================================================
    // CONTEXTUAL TOOLTIPS — post-tutorial, terrain-specific hints
    // ================================================================
    showTerrainTooltip(terrainId) {
        if (this.completed) return; // Only show during tutorial flow
        // Post-tutorial tooltips are handled separately
    }

    /**
     * Show a contextual tooltip. Call from PetanqueScene for terrain hints.
     * Each hint shows only once per save file.
     */
    static showContextualHint(scene, hintId, message) {
        const save = loadSave();
        if (!save.hintsShown) save.hintsShown = {};
        if (save.hintsShown[hintId]) return;

        // Mark as shown
        save.hintsShown[hintId] = true;
        saveSave(save);

        const cx = GAME_WIDTH / 2;
        const y = GAME_HEIGHT - 65;

        // Background panel
        const bg = scene.add.graphics().setDepth(HINT_DEPTH);
        bg.fillStyle(0x3A2E28, 0.85);
        bg.fillRoundedRect(cx - 200, y - 20, 400, 44, 6);
        bg.lineStyle(1, 0xD4A574, 0.5);
        bg.strokeRoundedRect(cx - 200, y - 20, 400, 44, 6);

        // Lightbulb icon
        const icon = scene.add.text(cx - 185, y, '\u2728', {
            fontSize: '16px'
        }).setOrigin(0, 0.5).setDepth(HINT_DEPTH + 1);

        // Message
        const text = scene.add.text(cx - 165, y, message, {
            fontFamily: 'monospace', fontSize: '12px',
            color: '#F5E6D0', stroke: '#1A1510', strokeThickness: 2,
            wordWrap: { width: 340 }
        }).setOrigin(0, 0.5).setDepth(HINT_DEPTH + 1);

        // Fade in
        const elements = [bg, icon, text];
        for (const el of elements) el.setAlpha(0);
        scene.tweens.add({
            targets: elements, alpha: 1, duration: 400, ease: 'Sine.easeOut'
        });

        // Auto-dismiss after 5s
        scene.time.delayedCall(5000, () => {
            scene.tweens.add({
                targets: elements, alpha: 0, duration: 500,
                onComplete: () => elements.forEach(el => { if (el.active) el.destroy(); })
            });
        });
    }

    // ================================================================
    // UTILITIES
    // ================================================================

    _fadeOutElements() {
        for (const el of this._elements) {
            if (el && typeof el.setAlpha === 'function' && el.active !== false) {
                this.scene.tweens.add({
                    targets: el, alpha: 0, duration: 400,
                    onComplete: () => { if (el.active) el.destroy(); }
                });
            } else if (el && typeof el.destroy === 'function') {
                try { el.destroy(); } catch (_) { /* already destroyed */ }
            }
        }
        for (const tween of this._tweens) {
            if (tween && tween.isPlaying) tween.stop();
        }
        this._elements = [];
        this._tweens = [];
    }

    _markComplete() {
        this.completed = true;
        const save = loadSave();
        save.tutorialInGameSeen = true;
        saveSave(save);
    }

    _clearElements() {
        for (const tween of this._tweens) {
            if (tween && tween.isPlaying) tween.stop();
        }
        this._tweens = [];

        for (const el of this._elements) {
            if (el && typeof el.destroy === 'function') {
                try { el.destroy(); } catch (_) { /* already destroyed */ }
            }
        }
        this._elements = [];
    }

    destroy() {
        if (this.scene && this._onShutdown) {
            this.scene.events.off('shutdown', this._onShutdown);
        }

        this._clearElements();

        // Restore original callbacks
        if (this.engine) {
            this.engine.onStateChange = this._origOnStateChange;
            this.engine.onTurnChange = this._origOnTurnChange;
            this.engine.onScore = this._origOnScore;
        }

        this.scene = null;
        this.engine = null;
    }
}
