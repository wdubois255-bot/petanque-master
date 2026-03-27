import { loadSave, saveSave } from '../utils/SaveManager.js';
import {
    GAME_WIDTH, GAME_HEIGHT,
    TUTORIAL_PHASE_AIM, TUTORIAL_PHASE_LOFT, TUTORIAL_PHASE_SCORE,
    TUTORIAL_PHASE_TURN_RULE, TUTORIAL_PHASE_GOAL
} from '../utils/Constants.js';
import I18n from '../utils/I18n.js';

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

// Minimum delay between consecutive tutorial phases (ms)
const PHASE_GAP = 2500;

/**
 * In-game tutorial — guided phases with proper sequencing.
 * Phase 0 (GOAL)      : game objective (auto-dismiss 4s)
 * Phase 1 (AIM)       : first throw — drag to aim
 * Phase 1.5 (TURN)    : turn rule — furthest replays
 * Phase 2 (LOFT)      : trajectory modes (auto-dismiss 8s or OK button)
 * Phase 3 (SCORE)     : end of first mène — scoring explained (blocking)
 *
 * Timing guarantee: no two phases overlap; minimum PHASE_GAP between them.
 * Barks are suppressed while any tutorial phase is visible (scene._tutorialActive flag).
 */
export default class InGameTutorial {
    constructor(scene) {
        this.scene = scene;
        this.engine = scene.engine;
        this.completed = false;
        this._elements = [];
        this._tweens = [];
        this._goalActive = false;
        this._phase1Active = false;
        this._phase1_5Active = false;
        this._phase2Active = false;
        this._phase3Active = false;
        this._terrainHintActive = false;
        this._lastPhaseEndTime = 0;

        // Flag for PetanqueScene to suppress barks during tutorial
        scene._tutorialActive = true;

        // Safety: destroy on scene shutdown (register early, before any return)
        this._onShutdown = () => this.destroy();
        scene.events.once('shutdown', this._onShutdown);

        // Show terrain hint before any tutorial phase (one-shot per terrain)
        const terrainId = scene.terrainFullData?.id || null;
        this._maybeShowTerrainHint(terrainId);

        // Phase 0 (GOAL): show game objective
        // If terrain hint is active, GOAL will be shown after it ends
        if (!this._phaseDone(TUTORIAL_PHASE_GOAL) && !this._terrainHintActive) {
            this._showPhase0_Goal();
        }

        // If all phases already done, do nothing more
        if (this._phaseDone(TUTORIAL_PHASE_AIM) &&
            this._phaseDone(TUTORIAL_PHASE_LOFT) &&
            this._phaseDone(TUTORIAL_PHASE_SCORE) &&
            this._phaseDone(TUTORIAL_PHASE_TURN_RULE)) {
            this.completed = true;
            scene._tutorialActive = false;
            return;
        }

        // Hook engine callbacks (chain with existing)
        this._origOnStateChange = this.engine.onStateChange;
        this._origOnTurnChange = this.engine.onTurnChange;

        this.engine.onStateChange = (state) => {
            if (this._origOnStateChange) this._origOnStateChange(state);
            this._handleStateChange(state);
        };

        this.engine.onTurnChange = (team) => {
            if (this._origOnTurnChange) this._origOnTurnChange(team);
            if (team === 'opponent' &&
                !this._phaseDone(TUTORIAL_PHASE_TURN_RULE) &&
                !this._phase1_5Active) {
                // Delay turn rule: let the player process Phase 1 dismissal first
                this.scene.time.delayedCall(4000, () => {
                    if (this._phase1_5Active || this._phaseDone(TUTORIAL_PHASE_TURN_RULE)) return;
                    if (this._isAnyPhaseActive()) return;
                    this._showPhase1_5_TurnRule();
                });
            }
        };
    }

    // ================================================================
    // SEQUENCING HELPERS
    // ================================================================
    _isAnyPhaseActive() {
        return this._goalActive || this._terrainHintActive ||
               this._phase1Active || this._phase1_5Active ||
               this._phase2Active || this._phase3Active;
    }

    _canStartNewPhase() {
        if (this._isAnyPhaseActive()) return false;
        return Date.now() - this._lastPhaseEndTime >= PHASE_GAP;
    }

    _onPhaseEnd() {
        this._lastPhaseEndTime = Date.now();
        // Update bark suppression flag
        if (this.scene) {
            this.scene._tutorialActive = this._isAnyPhaseActive();
        }
    }

    // ================================================================
    // PERSISTENCE HELPERS
    // ================================================================
    _phaseDone(phase) {
        const save = loadSave();
        return (save.tutorialPhasesDone || []).includes(phase);
    }

    _markPhaseDone(phase) {
        const save = loadSave();
        if (!save.tutorialPhasesDone) save.tutorialPhasesDone = [];
        if (!save.tutorialPhasesDone.includes(phase)) {
            save.tutorialPhasesDone.push(phase);
        }
        saveSave(save);
    }

    // ================================================================
    // STATE CHANGE HANDLER
    // ================================================================
    _handleStateChange(state) {
        if (this.completed) return;

        // Phase 1 trigger: player about to throw their first boule
        // Must wait for GOAL and terrain hint to be dismissed first
        if ((state === 'FIRST_BALL' || state === 'PLAY_LOOP') &&
            this.engine.currentTeam === 'player' &&
            !this._phaseDone(TUTORIAL_PHASE_AIM) &&
            !this._phase1Active &&
            !this._terrainHintActive &&
            !this._goalActive) {
            if (this._canStartNewPhase()) {
                this._showPhase1_Aim();
            }
        }

        // Phase 1 close: player launched the ball (dragged and released)
        if (state === 'WAITING_STOP' && this.engine.currentTeam === 'player') {
            if (this._phase1Active) {
                this._phase1Active = false;
                this._markPhaseDone(TUTORIAL_PHASE_AIM);
                this._fadeOutElements();
                this._onPhaseEnd();
            }
            // Phase 2 trigger: after Phase 1 is done (2nd+ player throw)
            // Delayed to avoid info overload; also waits for Phase 1.5 to end
            else if (this._phaseDone(TUTORIAL_PHASE_AIM) &&
                     !this._phaseDone(TUTORIAL_PHASE_LOFT) &&
                     !this._phase2Active) {
                this.scene.time.delayedCall(3500, () => {
                    if (this._phase2Active || this._phaseDone(TUTORIAL_PHASE_LOFT)) return;
                    if (this._isAnyPhaseActive()) return;
                    this._showPhase2_Loft();
                });
            }
        }

        // Phase 3 trigger: first mène scored
        if (state === 'SCORE_MENE' &&
            !this._phaseDone(TUTORIAL_PHASE_SCORE) &&
            !this._phase3Active) {
            // Clear any lingering phase before showing the modal
            if (this._isAnyPhaseActive()) {
                this._phase1_5Active = false;
                this._phase2Active = false;
                this._clearElements();
            }
            this._showPhase3_Score();
        }
    }

    // ================================================================
    // PHASE 0: GOAL — objectif du jeu (non-bloquant, auto-dismiss 4s)
    // ================================================================
    _showPhase0_Goal() {
        if (this._goalActive) return;
        this._goalActive = true;
        if (this.scene) this.scene._tutorialActive = true;

        const cx = GAME_WIDTH / 2;
        const cy = GAME_HEIGHT / 2;
        const pw = 480;
        const ph = 80;

        // Full-screen dim
        const dim = this.scene.add.graphics().setDepth(DEPTH - 1).setAlpha(0);
        dim.fillStyle(0x1A1510, 0.5);
        dim.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Centered panel
        const panel = this.scene.add.graphics().setDepth(DEPTH - 1).setAlpha(0);
        panel.fillStyle(0x3A2E28, 0.92);
        panel.fillRoundedRect(cx - pw / 2, cy - ph / 2, pw, ph, 8);
        panel.lineStyle(2, 0xD4A574, 0.7);
        panel.strokeRoundedRect(cx - pw / 2, cy - ph / 2, pw, ph, 8);

        const icon = this.scene.add.text(cx, cy - 16, '\u25C9', {
            fontFamily: 'monospace', fontSize: '22px',
            color: '#FFD700', stroke: '#1A1510', strokeThickness: 2
        }).setOrigin(0.5).setDepth(DEPTH).setAlpha(0);

        const main = this.scene.add.text(cx, cy + 14,
            I18n.t('tutorial.goal'),
            { ...TEXT_STYLE, fontSize: '13px', wordWrap: { width: pw - 40 } }
        ).setOrigin(0.5).setDepth(DEPTH).setAlpha(0);

        this.scene.tweens.add({
            targets: [dim, panel, icon, main], alpha: 1, duration: 400, ease: 'Sine.easeOut'
        });

        this._elements.push(dim, panel, icon, main);

        // Auto-dismiss after 6s
        const timer = this.scene.time.delayedCall(6000, () => {
            this._dismissGoal();
        });
        this._elements.push({ destroy: () => timer.destroy() });
    }

    _dismissGoal() {
        if (!this._goalActive) return;
        this._goalActive = false;
        this._markPhaseDone(TUTORIAL_PHASE_GOAL);
        this._fadeOutElements();
        this._onPhaseEnd();
    }

    // ================================================================
    // PHASE 1: VISER — animation de doigt press-drag-release
    // ================================================================
    _showPhase1_Aim() {
        if (this._phase1Active) return;
        if (this._goalActive) this._dismissGoal();
        this._phase1Active = true;
        if (this.scene) this.scene._tutorialActive = true;
        this._clearElements();

        const s = this.scene;
        const cx = GAME_WIDTH / 2;
        const cy = GAME_HEIGHT / 2;
        const dragDist = 90; // px the finger travels down
        const startY = cy - 20;
        const endY = startY + dragDist;

        // Semi-transparent full-screen dim
        const dim = s.add.graphics().setDepth(DEPTH - 1).setAlpha(0);
        dim.fillStyle(0x1A1510, 0.45);
        dim.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // --- Finger graphic (container) ---
        const fingerCt = s.add.container(cx, startY).setDepth(DEPTH + 1).setAlpha(0);

        const finger = s.add.graphics();
        // Finger body (points down)
        finger.fillStyle(0xF5E6D0, 0.95);
        finger.fillRoundedRect(-7, -32, 14, 36, 5);
        finger.lineStyle(1.5, 0x8B7B6A, 0.8);
        finger.strokeRoundedRect(-7, -32, 14, 36, 5);
        // Nail highlight
        finger.fillStyle(0xFFEEDD, 0.7);
        finger.fillRoundedRect(-4, -30, 8, 7, 2);
        fingerCt.add(finger);

        // Touch ripple (expands on press)
        const ripple = s.add.circle(cx, startY, 6, 0xFFD700, 0).setDepth(DEPTH);

        // Drag trail line (redrawn during drag)
        const trail = s.add.graphics().setDepth(DEPTH);

        // Direction arrow (appears on release — shows ball going UP)
        const throwArrow = s.add.graphics().setDepth(DEPTH).setAlpha(0);

        // --- Text (bottom of screen) ---
        const main = s.add.text(cx, GAME_HEIGHT - 52,
            I18n.t('tutorial.aim'),
            { ...TEXT_STYLE, fontSize: '13px' }
        ).setOrigin(0.5).setDepth(DEPTH).setAlpha(0);

        const sub = s.add.text(cx, GAME_HEIGHT - 32,
            I18n.t('tutorial.aim_sub'),
            { ...HINT_STYLE, fontSize: '11px', color: '#87CEEB' }
        ).setOrigin(0.5).setDepth(DEPTH).setAlpha(0);

        // Fade in everything
        s.tweens.add({
            targets: [dim, fingerCt, main, sub], alpha: 1, duration: 400, ease: 'Sine.easeOut'
        });

        this._elements.push(dim, fingerCt, ripple, trail, throwArrow, main, sub);

        // --- Looping animation sequence ---
        const runCycle = () => {
            if (!this._phase1Active || !s.scene.isActive()) return;

            // Reset state
            fingerCt.setPosition(cx, startY).setAlpha(1).setScale(1);
            ripple.setPosition(cx, startY).setAlpha(0).setScale(1);
            trail.clear();
            throwArrow.clear().setAlpha(0);

            // Step 1: Press (ripple + finger scale)
            s.tweens.add({
                targets: ripple, alpha: 0.5, scaleX: 2.5, scaleY: 2.5,
                duration: 350, ease: 'Sine.easeOut',
                onComplete: () => {
                    s.tweens.add({
                        targets: ripple, alpha: 0, duration: 300
                    });
                }
            });
            s.tweens.add({
                targets: fingerCt, scaleX: 0.92, scaleY: 0.92,
                duration: 200, ease: 'Sine.easeOut',
                onComplete: () => {
                    // Step 2: Drag down (finger moves, trail draws)
                    s.tweens.add({
                        targets: fingerCt, y: endY, scaleX: 1, scaleY: 1,
                        duration: 1200, ease: 'Sine.easeInOut',
                        onUpdate: () => {
                            // Draw dashed trail from start to current finger position
                            trail.clear();
                            trail.lineStyle(2, 0xFFD700, 0.4);
                            const curY = fingerCt.y;
                            for (let py = startY; py < curY; py += 8) {
                                trail.fillStyle(0xFFD700, 0.35);
                                trail.fillCircle(cx, py, 1.5);
                            }
                            // Power indicator dot at finger
                            trail.fillStyle(0xFFD700, 0.6);
                            trail.fillCircle(cx, curY, 4);
                        },
                        onComplete: () => {
                            // Step 3: Pause at bottom
                            s.time.delayedCall(400, () => {
                                if (!this._phase1Active) return;

                                // Step 4: Release — finger lifts, arrow shoots UP
                                s.tweens.add({
                                    targets: fingerCt, y: endY - 20, alpha: 0, scaleX: 1.1, scaleY: 1.1,
                                    duration: 250, ease: 'Sine.easeOut'
                                });
                                trail.clear();

                                // Throw direction arrow (goes UP from touch origin)
                                throwArrow.clear();
                                throwArrow.lineStyle(3, 0xFFD700, 0.8);
                                throwArrow.lineBetween(cx, startY, cx, startY - 50);
                                // Arrowhead
                                throwArrow.fillStyle(0xFFD700, 0.8);
                                throwArrow.fillTriangle(
                                    cx, startY - 58,
                                    cx - 6, startY - 46,
                                    cx + 6, startY - 46
                                );
                                throwArrow.setAlpha(0);
                                s.tweens.add({
                                    targets: throwArrow, alpha: 1, duration: 200,
                                    onComplete: () => {
                                        s.tweens.add({
                                            targets: throwArrow, alpha: 0, y: '-=15',
                                            duration: 600, ease: 'Sine.easeIn',
                                            onComplete: () => {
                                                throwArrow.y = 0; // reset position offset
                                                // Step 5: Pause then restart
                                                s.time.delayedCall(800, runCycle);
                                            }
                                        });
                                    }
                                });
                            });
                        }
                    });
                }
            });
        };

        // Start first cycle after a short delay
        s.time.delayedCall(500, runCycle);
    }

    // ================================================================
    // PHASE 1.5: TURN RULE — l'equipe la plus loin rejoue (non-bloquant)
    // ================================================================
    _showPhase1_5_TurnRule() {
        if (this._phase1_5Active) return;
        this._phase1_5Active = true;
        if (this.scene) this.scene._tutorialActive = true;
        this._clearElements();

        const cx = GAME_WIDTH / 2;

        const bg = this.scene.add.graphics().setDepth(DEPTH - 1).setAlpha(0);
        bg.fillStyle(0x1A1510, 0.5);
        bg.fillRect(0, 0, GAME_WIDTH, 76);

        const main = this.scene.add.text(cx, 34,
            I18n.t('tutorial.turn_rule'),
            TEXT_STYLE
        ).setOrigin(0.5).setDepth(DEPTH).setAlpha(0);

        const sub = this.scene.add.text(cx, 58,
            I18n.t('tutorial.turn_rule_sub'),
            { ...HINT_STYLE, fontSize: '11px', color: '#FFD700' }
        ).setOrigin(0.5).setDepth(DEPTH).setAlpha(0);

        this.scene.tweens.add({
            targets: [bg, main, sub], alpha: 1, duration: 350, ease: 'Sine.easeOut'
        });

        this._elements.push(bg, main, sub);

        const timer = this.scene.time.delayedCall(6000, () => {
            this._markPhaseDone(TUTORIAL_PHASE_TURN_RULE);
            this._phase1_5Active = false;
            this._fadeOutElements();
            this._onPhaseEnd();
        });
        this._elements.push({ destroy: () => timer.destroy() });
    }

    // ================================================================
    // PHASE 2: LOFT — mini overlay trajectoires (non-bloquant)
    // ================================================================
    _showPhase2_Loft() {
        if (this._phase2Active || this._phaseDone(TUTORIAL_PHASE_LOFT)) return;
        this._phase2Active = true;
        if (this.scene) this.scene._tutorialActive = true;

        const cx = GAME_WIDTH / 2;
        const y = GAME_HEIGHT - 65;

        // Mini panel en bas
        const bg = this.scene.add.graphics().setDepth(DEPTH).setAlpha(0);
        bg.fillStyle(0x3A2E28, 0.92);
        bg.fillRoundedRect(cx - 235, y - 20, 470, 52, 6);
        bg.lineStyle(1, 0xD4A574, 0.55);
        bg.strokeRoundedRect(cx - 235, y - 20, 470, 52, 6);

        const title = this.scene.add.text(cx, y - 4,
            I18n.t('tutorial.loft_title'), {
                fontFamily: 'monospace', fontSize: '11px',
                color: '#FFD700', stroke: '#1A1510', strokeThickness: 2
            }
        ).setOrigin(0.5).setDepth(DEPTH + 1).setAlpha(0);

        const modes = [
            { key: '1', name: I18n.t('tutorial.modes.demi'),     color: '#6B8E4E' },
            { key: '2', name: I18n.t('tutorial.modes.plombee'),  color: '#9B7BB8' },
            { key: '3', name: I18n.t('tutorial.modes.tir'),      color: '#C44B3F' }
        ];

        const modeEls = [];
        modes.forEach((m, i) => {
            const ox = cx - 160 + i * 84;
            const keyT = this.scene.add.text(ox - 14, y + 16, `[${m.key}]`, {
                fontFamily: 'monospace', fontSize: '10px', color: m.color,
                stroke: '#1A1510', strokeThickness: 2
            }).setOrigin(0.5).setDepth(DEPTH + 1).setAlpha(0);
            const nameT = this.scene.add.text(ox + 12, y + 16, m.name, {
                fontFamily: 'monospace', fontSize: '10px', color: '#F5E6D0',
                stroke: '#1A1510', strokeThickness: 1
            }).setOrigin(0, 0.5).setDepth(DEPTH + 1).setAlpha(0);
            modeEls.push(keyT, nameT);
        });

        // Fade in
        this.scene.tweens.add({
            targets: [bg, title, ...modeEls], alpha: 1, duration: 300
        });

        this._elements.push(bg, title, ...modeEls);

        // Bouton OK (60x24) — dismiss immediat
        const btnW = 60, btnH = 24;
        const btnX = cx + 200, btnY = y + 16;
        const btnBg = this.scene.add.graphics().setDepth(DEPTH + 1).setAlpha(0);
        btnBg.fillStyle(0xC4854A, 1);
        btnBg.fillRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 4);
        btnBg.lineStyle(1, 0xFFD700, 0.5);
        btnBg.strokeRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 4);

        const btnText = this.scene.add.text(btnX, btnY, 'OK', {
            fontFamily: 'monospace', fontSize: '11px',
            color: '#F5E6D0', stroke: '#1A1510', strokeThickness: 2
        }).setOrigin(0.5).setDepth(DEPTH + 2).setAlpha(0)
          .setInteractive({ useHandCursor: true });

        btnText.on('pointerover', () => {
            btnBg.clear();
            btnBg.fillStyle(0xD4954A, 1);
            btnBg.fillRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 4);
        });
        btnText.on('pointerout', () => {
            btnBg.clear();
            btnBg.fillStyle(0xC4854A, 1);
            btnBg.fillRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 4);
        });
        btnText.on('pointerdown', () => {
            timer.remove();
            this._markPhaseDone(TUTORIAL_PHASE_LOFT);
            this._phase2Active = false;
            this._fadeOutElements();
            this._onPhaseEnd();
        });

        this.scene.tweens.add({
            targets: [btnBg, btnText], alpha: 1, duration: 300, delay: 200
        });
        this._elements.push(btnBg, btnText);

        // Auto-dismiss after 12s
        const timer = this.scene.time.delayedCall(12000, () => {
            this._markPhaseDone(TUTORIAL_PHASE_LOFT);
            this._phase2Active = false;
            this._fadeOutElements();
            this._onPhaseEnd();
        });
        this._elements.push({ destroy: () => timer.destroy() });
    }

    // ================================================================
    // PHASE 3: SCORE — overlay scoring + bouton "Compris !" (bloquant)
    // ================================================================
    _showPhase3_Score() {
        if (this._phase3Active) return;
        this._phase3Active = true;
        if (this.scene) this.scene._tutorialActive = true;
        this._clearElements();

        const cx = GAME_WIDTH / 2;
        const panelW = 480;
        const panelH = 140;
        const panelX = cx - panelW / 2;
        const panelY = GAME_HEIGHT / 2 - panelH / 2;

        // Background dim
        const dim = this.scene.add.graphics().setDepth(DEPTH - 1).setAlpha(0);
        dim.fillStyle(0x1A1510, 0.6);
        dim.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Panel
        const panel = this.scene.add.graphics().setDepth(DEPTH).setAlpha(0);
        panel.fillStyle(0x3A2E28, 0.97);
        panel.fillRoundedRect(panelX, panelY, panelW, panelH, 8);
        panel.lineStyle(2, 0xD4A574, 0.85);
        panel.strokeRoundedRect(panelX, panelY, panelW, panelH, 8);

        // Titre "Fin de mene !"
        const titleTxt = this.scene.add.text(cx, panelY + 22, I18n.t('tutorial.score_title'), {
            fontFamily: 'monospace', fontSize: '13px',
            color: '#FFD700', stroke: '#1A1510', strokeThickness: 2
        }).setOrigin(0.5).setDepth(DEPTH + 1).setAlpha(0);

        const main = this.scene.add.text(cx, panelY + 52,
            I18n.t('tutorial.score_main'),
            TEXT_STYLE
        ).setOrigin(0.5).setDepth(DEPTH + 1).setAlpha(0);

        const sub = this.scene.add.text(cx, panelY + 95,
            I18n.t('tutorial.score_sub'),
            { ...HINT_STYLE, color: '#87CEEB' }
        ).setOrigin(0.5).setDepth(DEPTH + 1).setAlpha(0);

        // Bouton "Compris !"
        const btnY = panelY + 122;
        const btnW = 120;
        const btnBg = this.scene.add.graphics().setDepth(DEPTH + 1).setAlpha(0);
        btnBg.fillStyle(0xC4854A, 1);
        btnBg.fillRoundedRect(cx - btnW / 2, btnY - 13, btnW, 28, 4);
        btnBg.lineStyle(1, 0xFFD700, 0.5);
        btnBg.strokeRoundedRect(cx - btnW / 2, btnY - 13, btnW, 28, 4);

        const btnText = this.scene.add.text(cx, btnY, I18n.t('tutorial.understood'), {
            fontFamily: 'monospace', fontSize: '12px',
            color: '#F5E6D0', stroke: '#1A1510', strokeThickness: 2
        }).setOrigin(0.5).setDepth(DEPTH + 2).setAlpha(0)
          .setInteractive({ useHandCursor: true });

        // Hover effect
        btnText.on('pointerover', () => {
            btnBg.clear();
            btnBg.fillStyle(0xD4954A, 1);
            btnBg.fillRoundedRect(cx - btnW / 2, btnY - 13, btnW, 28, 4);
        });
        btnText.on('pointerout', () => {
            btnBg.clear();
            btnBg.fillStyle(0xC4854A, 1);
            btnBg.fillRoundedRect(cx - btnW / 2, btnY - 13, btnW, 28, 4);
        });

        // Click → fermer et marquer fait
        btnText.on('pointerdown', () => {
            this._markPhaseDone(TUTORIAL_PHASE_SCORE);
            this._phase3Active = false;
            this._markComplete();
            this._fadeOutElements();
            this._onPhaseEnd();
        });

        // Fade in
        this.scene.tweens.add({
            targets: [dim, panel], alpha: 1, duration: 400, ease: 'Sine.easeOut'
        });
        this.scene.tweens.add({
            targets: [titleTxt, main, sub, btnBg, btnText],
            alpha: 1, duration: 400, delay: 200, ease: 'Sine.easeOut'
        });

        this._elements.push(dim, panel, titleTxt, main, sub, btnBg, btnText);
    }

    // ================================================================
    // TERRAIN HINT — one-shot, avant Phase 0
    // ================================================================
    _maybeShowTerrainHint(terrainId) {
        if (!terrainId) return;
        const hintKey = `terrain_hints.${terrainId}`;
        const msg = I18n.t(hintKey);
        if (!msg || msg === hintKey) return;

        const save = loadSave();
        if (!save.terrainHintsSeen) save.terrainHintsSeen = [];
        if (save.terrainHintsSeen.includes(terrainId)) return;

        save.terrainHintsSeen.push(terrainId);
        saveSave(save);

        this._terrainHintActive = true;
        this._showTerrainHintOverlay(msg);
    }

    _showTerrainHintOverlay(message) {
        const cx = GAME_WIDTH / 2;

        const bg = this.scene.add.graphics().setDepth(DEPTH - 1).setAlpha(0);
        bg.fillStyle(0x1A1510, 0.5);
        bg.fillRect(0, 0, GAME_WIDTH, 80);

        const main = this.scene.add.text(cx, 40, message, {
            ...TEXT_STYLE,
            fontSize: '13px',
            wordWrap: { width: 560 }
        }).setOrigin(0.5).setDepth(DEPTH).setAlpha(0);

        this.scene.tweens.add({
            targets: [bg, main], alpha: 1, duration: 350, ease: 'Sine.easeOut'
        });

        this._elements.push(bg, main);

        const timer = this.scene.time.delayedCall(6000, () => {
            this._terrainHintActive = false;
            this._fadeOutElements();
            this._onPhaseEnd();
            // Chain: show GOAL after terrain hint if not already done
            if (!this._phaseDone(TUTORIAL_PHASE_GOAL)) {
                this.scene.time.delayedCall(PHASE_GAP, () => this._showPhase0_Goal());
            }
        });
        this._elements.push({ destroy: () => timer.destroy() });
    }

    // ================================================================
    // CONTEXTUAL HINT (static) — appele depuis PetanqueScene
    // ================================================================
    static showContextualHint(scene, hintId, message) {
        const save = loadSave();
        if (!save.hintsShown) save.hintsShown = {};
        if (save.hintsShown[hintId]) return;

        // Don't show contextual hints while tutorial is active
        if (scene._tutorialActive) return;

        save.hintsShown[hintId] = true;
        saveSave(save);

        const cx = GAME_WIDTH / 2;
        const y = GAME_HEIGHT - 65;

        const bg = scene.add.graphics().setDepth(HINT_DEPTH);
        bg.fillStyle(0x3A2E28, 0.85);
        bg.fillRoundedRect(cx - 200, y - 20, 400, 44, 6);
        bg.lineStyle(1, 0xD4A574, 0.5);
        bg.strokeRoundedRect(cx - 200, y - 20, 400, 44, 6);

        const icon = scene.add.text(cx - 185, y, '\u2728', { fontSize: '16px' })
            .setOrigin(0, 0.5).setDepth(HINT_DEPTH + 1);

        const text = scene.add.text(cx - 165, y, message, {
            fontFamily: 'monospace', fontSize: '12px',
            color: '#F5E6D0', stroke: '#1A1510', strokeThickness: 2,
            wordWrap: { width: 340 }
        }).setOrigin(0, 0.5).setDepth(HINT_DEPTH + 1);

        const els = [bg, icon, text];
        for (const el of els) el.setAlpha(0);
        scene.tweens.add({ targets: els, alpha: 1, duration: 400, ease: 'Sine.easeOut' });

        scene.time.delayedCall(5000, () => {
            scene.tweens.add({
                targets: els, alpha: 0, duration: 500,
                onComplete: () => els.forEach(el => { if (el.active) el.destroy(); })
            });
        });
    }

    // ================================================================
    // UTILITIES
    // ================================================================
    _markComplete() {
        this.completed = true;
        if (this.scene) this.scene._tutorialActive = false;
        const save = loadSave();
        // Only mark as fully seen when ALL 3 phases are done
        const phases = save.tutorialPhasesDone || [];
        if (phases.includes(TUTORIAL_PHASE_AIM) &&
            phases.includes(TUTORIAL_PHASE_LOFT) &&
            phases.includes(TUTORIAL_PHASE_SCORE)) {
            save.tutorialInGameSeen = true;
            save.tutorialComplete = true;
        }
        saveSave(save);
    }

    _fadeOutElements() {
        for (const el of this._elements) {
            if (el && typeof el.setAlpha === 'function' && el.active !== false) {
                this.scene.tweens.add({
                    targets: el, alpha: 0, duration: 400,
                    onComplete: () => { if (el.active) el.destroy(); }
                });
            } else if (el && typeof el.destroy === 'function') {
                try { el.destroy(); } catch (_) { }
            }
        }
        for (const tween of this._tweens) {
            if (tween && tween.isPlaying) tween.stop();
        }
        this._elements = [];
        this._tweens = [];
    }

    _clearElements() {
        for (const tween of this._tweens) {
            if (tween && tween.isPlaying) tween.stop();
        }
        this._tweens = [];
        for (const el of this._elements) {
            if (el && typeof el.destroy === 'function') {
                try { el.destroy(); } catch (_) { }
            }
        }
        this._elements = [];
    }

    destroy() {
        if (this.scene && this._onShutdown) {
            this.scene.events.off('shutdown', this._onShutdown);
        }
        if (this.scene) this.scene._tutorialActive = false;
        this._clearElements();

        if (this.engine) {
            this.engine.onStateChange = this._origOnStateChange;
            this.engine.onTurnChange = this._origOnTurnChange;
        }

        this.scene = null;
        this.engine = null;
    }
}
