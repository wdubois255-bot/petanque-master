import { loadSave, saveSave } from '../utils/SaveManager.js';

const DEPTH = 200;
const TEXT_STYLE = {
    fontFamily: 'monospace',
    fontSize: '14px',
    color: '#F5E6D0',
    stroke: '#1A1510',
    strokeThickness: 3,
    align: 'center',
    wordWrap: { width: 400 }
};

/**
 * Non-blocking in-game tutorial overlay for first Arcade match.
 * Shows contextual hints during Round 1 without pausing the game.
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

        if (state === 'COCHONNET_THROW' && this.step === 0 && this.engine.currentTeam === 'player') {
            this._showStep1();
        }

        if ((state === 'FIRST_BALL' || state === 'PLAY_LOOP') && this.step === 1 && this.engine.currentTeam === 'player') {
            this._showStep2();
        }

        if (state === 'WAITING_STOP' && this.step === 2 && this._playerHasThrown) {
            this._showStep3();
        }

        if (state === 'SCORE_MENE' && this.step === 3 && !this._firstMeneScored) {
            this._firstMeneScored = true;
            this._showStep4();
        }
    }

    _handleTurnChange(team) {
        if (this.completed) return;

        // Step 1: cochonnet throw detected when turn changes after COCHONNET_THROW
        if (this.step === 0 && this.engine.state === 'FIRST_BALL') {
            this._clearElements();
            this.step = 1;
        }

        // Detect player's first ball throw completion
        if (this.step === 1 && team === 'player' && (this.engine.state === 'FIRST_BALL' || this.engine.state === 'PLAY_LOOP')) {
            this._showStep2();
        }
    }

    _handleScore(_scores, _winner, _points) {
        if (this.completed) return;
        // Score event during first mene triggers step 4 via state change
    }

    // Step 1: Cochonnet throw hint
    _showStep1() {
        this._clearElements();
        this.step = 0;

        const cx = this.scene.cameras.main.centerX;

        // Arrow pointing down
        const arrow = this.scene.add.text(cx, 160, '\u25BC', {
            fontFamily: 'monospace',
            fontSize: '28px',
            color: '#87CEEB',
            stroke: '#1A1510',
            strokeThickness: 2
        }).setOrigin(0.5).setDepth(DEPTH);

        const arrowTween = this.scene.tweens.add({
            targets: arrow,
            y: 175,
            duration: 600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        const hint = this.scene.add.text(cx, 200, 'Glissez vers le haut pour lancer le cochonnet !', TEXT_STYLE)
            .setOrigin(0.5).setDepth(DEPTH);

        this._elements.push(arrow, hint);
        this._tweens.push(arrowTween);

        // Auto-dismiss is handled by state change to FIRST_BALL
    }

    // Step 2: First ball hint with pulsing target
    _showStep2() {
        if (this.step !== 1) return;
        this._clearElements();
        this.step = 2;
        this._playerHasThrown = false;

        const cx = this.scene.cameras.main.centerX;

        const hint = this.scene.add.text(cx, 40, 'Placez votre boule pres du cochonnet !', TEXT_STYLE)
            .setOrigin(0.5).setDepth(DEPTH);

        this._elements.push(hint);

        // Pulsing circle around cochonnet
        if (this.engine.cochonnet && this.engine.cochonnet.isAlive) {
            const coch = this.engine.cochonnet;
            const circle = this.scene.add.circle(coch.x, coch.y, 24, 0x87CEEB, 0)
                .setStrokeStyle(2, 0x87CEEB, 0.8)
                .setDepth(DEPTH);

            const pulseTween = this.scene.tweens.add({
                targets: circle,
                scaleX: 1.8,
                scaleY: 1.8,
                alpha: 0,
                duration: 1000,
                repeat: -1,
                ease: 'Sine.easeOut',
                onUpdate: () => {
                    if (this.engine.cochonnet && this.engine.cochonnet.isAlive) {
                        circle.setPosition(this.engine.cochonnet.x, this.engine.cochonnet.y);
                    }
                }
            });

            this._elements.push(circle);
            this._tweens.push(pulseTween);
        }

        // Listen for player throw to advance
        const origAiming = this.engine.aimingEnabled;
        const checkThrow = this.scene.time.addEvent({
            delay: 200,
            loop: true,
            callback: () => {
                if (this.engine.state === 'WAITING_STOP' && this.engine.currentTeam === 'player') {
                    this._playerHasThrown = true;
                    checkThrow.destroy();
                }
                if (this.engine.state === 'SECOND_TEAM_FIRST' || this.engine.state === 'PLAY_LOOP') {
                    this._playerHasThrown = true;
                    checkThrow.destroy();
                    this._clearElements();
                    this._showStep3();
                }
            }
        });
        this._elements.push({ destroy: () => checkThrow.destroy() });
    }

    // Step 3: Encouragement after first throw
    _showStep3() {
        if (this.step !== 2) return;
        this._clearElements();
        this.step = 3;

        const cx = this.scene.cameras.main.centerX;

        const hint = this.scene.add.text(cx, 40, "Bien joue ! L'adversaire joue...", TEXT_STYLE)
            .setOrigin(0.5).setDepth(DEPTH).setAlpha(0);

        const fadeIn = this.scene.tweens.add({
            targets: hint,
            alpha: 1,
            duration: 300,
            ease: 'Sine.easeOut'
        });

        this._elements.push(hint);
        this._tweens.push(fadeIn);

        // Auto-dismiss after 1.5s
        const timer = this.scene.time.delayedCall(1500, () => {
            if (hint.active) {
                this.scene.tweens.add({
                    targets: hint,
                    alpha: 0,
                    duration: 300,
                    onComplete: () => {
                        if (hint.active) hint.destroy();
                    }
                });
            }
        });
        this._elements.push({ destroy: () => timer.destroy() });
    }

    // Step 4: First mene scored
    _showStep4() {
        this._clearElements();

        const cx = this.scene.cameras.main.centerX;

        const hint = this.scene.add.text(cx, 40, 'Premier a 13 points ! Continuez...', TEXT_STYLE)
            .setOrigin(0.5).setDepth(DEPTH).setAlpha(0);

        const fadeIn = this.scene.tweens.add({
            targets: hint,
            alpha: 1,
            duration: 300,
            ease: 'Sine.easeOut'
        });

        this._elements.push(hint);
        this._tweens.push(fadeIn);

        // Auto-dismiss after 2s, then mark complete
        const timer = this.scene.time.delayedCall(2000, () => {
            if (hint.active) {
                this.scene.tweens.add({
                    targets: hint,
                    alpha: 0,
                    duration: 300,
                    onComplete: () => {
                        if (hint.active) hint.destroy();
                    }
                });
            }
            this._markComplete();
        });
        this._elements.push({ destroy: () => timer.destroy() });
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
