import { SHADOW_TEXT } from '../utils/Constants.js';

/**
 * EngineRenderer — handles ALL visual effects for PetanqueEngine.
 * PetanqueEngine only computes physics and rules; this class renders.
 *
 * Extracted to enforce Single Responsibility Principle:
 * - Engine = logic (testable headless)
 * - Renderer = visuals (Phaser-dependent)
 */
export default class EngineRenderer {
    constructor(scene, engine) {
        this.scene = scene;
        this.engine = engine;

        // Best ball indicator
        this._bestGfx = null;
        this._bestPulse = { t: 0 };
        this._lastBestBallId = null;

        // Message text
        this._msgText = null;

        // Aim hint
        this._aimHintShown = false;
    }

    // ================================================================
    // MESSAGE DISPLAY
    // ================================================================

    showMessage(text, persistent = false) {
        if (this._msgText) this._msgText.destroy();

        this._msgText = this.scene.add.text(
            this.scene.scale.width / 2, 24, text,
            {
                fontFamily: 'monospace', fontSize: '20px', color: '#F5E6D0',
                align: 'center', backgroundColor: '#3A2E28',
                padding: { x: 12, y: 6 }, shadow: SHADOW_TEXT
            }
        ).setOrigin(0.5, 0).setDepth(100);

        if (!persistent) {
            this.scene.time.delayedCall(2000, () => {
                if (this._msgText) this._msgText.destroy();
                this._msgText = null;
            });
        }
    }

    showAimHint() {
        if (this._aimHintShown) return;
        this._aimHintShown = true;

        const hint = this.scene.add.text(
            this.scene.scale.width / 2, this.scene.scale.height - 28,
            'Glissez et relachez pour viser',
            {
                fontFamily: 'monospace', fontSize: '18px', color: '#F5E6D0',
                align: 'center', backgroundColor: '#3A2E28',
                padding: { x: 12, y: 6 }, shadow: SHADOW_TEXT
            }
        ).setOrigin(0.5).setDepth(100);

        this.scene.time.delayedCall(5000, () => {
            this.scene.tweens.add({
                targets: hint, alpha: 0, duration: 600,
                onComplete: () => hint.destroy()
            });
        });
    }

    // ================================================================
    // PARTICLES
    // ================================================================

    spawnDust(x, y, count = 6, terrainType = 'terre') {
        const terrainColors = {
            terre: [0xC4854A, 0xA87040, 0xD4955A],
            herbe: [0x6B8E4E, 0x5E8A44, 0x7BA65E],
            sable: [0xE8D5B7, 0xD4C0A0, 0xF0E0C8],
            dalles: [0x9E9E8E, 0x808070, 0xB0A090]
        };
        const colors = terrainColors[terrainType] || terrainColors.terre;

        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
            const dist = 8 + Math.random() * 16;
            const color = colors[Math.floor(Math.random() * colors.length)];
            const size = 2 + Math.random() * 3;

            const p = this.scene.add.graphics().setDepth(8);
            p.fillStyle(color, 0.7);
            p.fillCircle(0, 0, size);
            p.setPosition(x, y);

            this.scene.tweens.add({
                targets: p,
                x: x + Math.cos(angle) * dist,
                y: y + Math.sin(angle) * dist - 8,
                alpha: 0,
                duration: 300 + Math.random() * 200,
                ease: 'Quad.easeOut',
                onComplete: () => p.destroy()
            });
        }
    }

    spawnCollisionSparks(x, y) {
        for (let i = 0; i < 5; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 6 + Math.random() * 12;
            const spark = this.scene.add.graphics().setDepth(55);
            spark.fillStyle(0xFFFFFF, 0.8);
            spark.fillCircle(0, 0, 1.5);
            spark.setPosition(x, y);

            this.scene.tweens.add({
                targets: spark,
                x: x + Math.cos(angle) * dist,
                y: y + Math.sin(angle) * dist,
                alpha: 0, duration: 200,
                onComplete: () => spark.destroy()
            });
        }
    }

    spawnRollTrail(ball, terrainType = 'terre') {
        const color = terrainType === 'sable' ? 0xE8D5B7
            : terrainType === 'herbe' ? 0x6B8E4E
            : terrainType === 'dalles' ? 0x9E9E8E
            : 0xC4854A;

        const p = this.scene.add.graphics().setDepth(3);
        p.fillStyle(color, 0.3);
        p.fillCircle(0, 0, 2);
        p.setPosition(ball.x, ball.y);

        this.scene.tweens.add({
            targets: p, alpha: 0, duration: 400,
            onComplete: () => p.destroy()
        });
    }

    // ================================================================
    // IMPACT EFFECTS
    // ================================================================

    drawImpactTrace(x, y, radius, bounds) {
        if (!this.scene.impactLayer) return;
        const crater = this.scene.add.graphics();
        crater.fillStyle(0x000000, 0.15);
        crater.fillCircle(0, 0, radius + 2);
        this.scene.impactLayer.draw(crater, x - bounds.x, y - bounds.y);
        crater.destroy();
    }

    flashTirImpact(x, y, radius) {
        const flash = this.scene.add.graphics().setDepth(60);
        flash.fillStyle(0xFFFFFF, 0.6);
        flash.fillCircle(x, y, radius + 4);
        this.scene.tweens.add({
            targets: flash, alpha: 0, duration: 200,
            onComplete: () => flash.destroy()
        });
    }

    // ================================================================
    // SHOT LABELS
    // ================================================================

    showShotLabel(ball, text, color, fontSize) {
        const txt = this.scene.add.text(ball.x, ball.y - 20, text, {
            fontFamily: 'monospace', fontSize: `${fontSize}px`, color,
            shadow: { offsetX: 1, offsetY: 1, color: '#1A1510', blur: 0, fill: true }
        }).setOrigin(0.5).setDepth(62).setAlpha(0.85);

        this.scene.tweens.add({
            targets: txt,
            y: txt.y - 25, alpha: 0,
            duration: 1200, ease: 'Cubic.easeOut',
            onComplete: () => txt.destroy()
        });
    }

    // ================================================================
    // CARREAU CELEBRATION
    // ================================================================

    celebrateCarreau(ball) {
        // "CARREAU !" text
        const txt = this.scene.add.text(ball.x, ball.y - 30, 'CARREAU !', {
            fontFamily: 'monospace', fontSize: '24px', color: '#FFD700',
            shadow: { offsetX: 2, offsetY: 2, color: '#1A1510', blur: 0, fill: true }
        }).setOrigin(0.5).setDepth(65);

        this.scene.tweens.add({
            targets: txt,
            y: txt.y - 50, alpha: 0, scaleX: 1.5, scaleY: 1.5,
            duration: 1500, ease: 'Cubic.easeOut',
            onComplete: () => txt.destroy()
        });

        // Radial gold sparks
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const spark = this.scene.add.graphics().setDepth(64);
            spark.fillStyle(0xFFD700, 1);
            spark.fillCircle(0, 0, 4);
            spark.setPosition(ball.x, ball.y);
            this.scene.tweens.add({
                targets: spark,
                x: ball.x + Math.cos(angle) * 36,
                y: ball.y + Math.sin(angle) * 36,
                alpha: 0, duration: 500,
                onComplete: () => spark.destroy()
            });
        }
    }

    // ================================================================
    // BEST BALL INDICATOR
    // ================================================================

    updateBestIndicator(balls, cochonnet) {
        if (!this._bestGfx) {
            this._bestGfx = this.scene.add.graphics().setDepth(10);
            this.scene.tweens.add({
                targets: this._bestPulse,
                t: 1, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
            });
        }
        this._bestGfx.clear();

        if (!cochonnet || !cochonnet.isAlive) return;
        if (balls.filter(b => b.isAlive).length === 0) return;

        let bestBall = null;
        let bestDist = Infinity;
        for (const ball of balls) {
            if (!ball.isAlive) continue;
            const d = ball.distanceTo(cochonnet);
            if (d < bestDist) { bestDist = d; bestBall = ball; }
        }

        if (bestBall) {
            const color = bestBall.team === 'player' ? 0x44CC44 : 0xCC4444;
            const t = this._bestPulse.t;
            const alpha = 0.4 + t * 0.4;
            const radius = bestBall.radius + 3 + t * 2;

            this._bestGfx.lineStyle(1.5, color, alpha);
            this._bestGfx.strokeCircle(bestBall.x, bestBall.y, radius);

            if (bestBall.id !== this._lastBestBallId) {
                if (this._lastBestBallId !== null) {
                    const flash = this.scene.add.graphics().setDepth(11);
                    const flashColor = color;
                    const fx = bestBall.x, fy = bestBall.y;
                    const anim = { s: 1 };
                    this.scene.tweens.add({
                        targets: anim, s: 2.5, duration: 350, ease: 'Cubic.easeOut',
                        onUpdate: () => {
                            flash.clear();
                            flash.lineStyle(2, flashColor, 0.8 * (1 - (anim.s - 1) / 1.5));
                            flash.strokeCircle(fx, fy, (bestBall.radius + 3) * anim.s);
                        },
                        onComplete: () => flash.destroy()
                    });
                }
                this._lastBestBallId = bestBall.id;
            }
        }
    }

    // ================================================================
    // GAME OVER (fallback overlay — only when no ResultScene redirect)
    // ================================================================

    showGameOverOverlay(isVictory, scores, isFanny) {
        const shadow = SHADOW_TEXT;
        const w = this.scene.scale.width;
        const h = this.scene.scale.height;

        if (isFanny) {
            const fannyTxt = this.scene.add.text(w / 2, h / 2 + 10, 'FANNY !', {
                fontFamily: 'monospace', fontSize: '18px', color: '#C44B3F', shadow
            }).setOrigin(0.5).setDepth(102).setAlpha(0);
            this.scene.tweens.add({
                targets: fannyTxt, alpha: 1, duration: 800, delay: 600, ease: 'Cubic.easeOut'
            });
        }

        const overlay = this.scene.add.graphics().setDepth(90);
        overlay.fillStyle(0x3A2E28, 0.7);
        overlay.fillRect(0, 0, w, h);

        const titleMsg = isVictory ? 'VICTOIRE !' : 'DEFAITE...';
        this.scene.add.text(w / 2, h / 2 - 80, titleMsg, {
            fontFamily: 'monospace', fontSize: '40px',
            color: isVictory ? '#FFD700' : '#C44B3F', align: 'center',
            shadow: { offsetX: 3, offsetY: 3, color: '#1A1510', blur: 0, fill: true }
        }).setOrigin(0.5).setDepth(101);

        const subMsg = isVictory ? 'Vous etes le Petanque Master !' : 'L\'adversaire l\'emporte.';
        this.scene.add.text(w / 2, h / 2 - 40, subMsg, {
            fontFamily: 'monospace', fontSize: '20px', color: '#F5E6D0', align: 'center', shadow
        }).setOrigin(0.5).setDepth(101);

        this.scene.add.text(w / 2, h / 2 + 10, `${scores.player} - ${scores.opponent}`, {
            fontFamily: 'monospace', fontSize: '36px', color: '#F5E6D0', align: 'center', shadow
        }).setOrigin(0.5).setDepth(101);

        return overlay;
    }

    destroy() {
        if (this._bestGfx) { this._bestGfx.destroy(); this._bestGfx = null; }
        if (this._msgText) { this._msgText.destroy(); this._msgText = null; }
    }
}
