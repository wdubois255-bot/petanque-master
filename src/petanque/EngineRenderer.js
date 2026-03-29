import { SHADOW_TEXT, BARK_DURATION, FILTER_GLOW_PLAYER, FILTER_GLOW_OPPONENT, FILTER_GLOW_STRENGTH, FILTER_GLOW_QUALITY, IS_MOBILE, DUST_MAX_SIMULTANEOUS_DESKTOP, DUST_MAX_SIMULTANEOUS_MOBILE } from '../utils/Constants.js';
import I18n from '../utils/I18n.js';

/**
 * EngineRenderer — handles ALL visual effects for PetanqueEngine.
 * PetanqueEngine only computes physics and rules; this class renders.
 *
 * Extracted to enforce Single Responsibility Principle:
 * - Engine = logic (testable headless)
 * - Renderer = visuals (Phaser-dependent)
 *
 * Phaser 4 filters: glow on best ball, flash glow on collisions.
 */
export default class EngineRenderer {
    constructor(scene, engine) {
        this.scene = scene;
        this.engine = engine;

        // Best ball indicator
        this._bestGfx = null;
        this._bestPulse = { t: 0 };
        this._lastBestBallId = null;
        this._bestGlowSprite = null; // Phaser 4 glow filter target

        // WebGL check for filters
        this._hasWebGL = !!(scene.renderer && scene.renderer.gl);

        // Message text
        this._msgText = null;

        // Aim hint
        this._aimHintShown = false;

        // Graphics pool — réutilise les objets Graphics au lieu de créer/détruire
        // Limite les allocations GC sur mobile (et desktop)
        this._pool = [];
        this._poolMax = 10;

        // Compteur de groupes dust simultanés (limité selon plateforme)
        this._activeDustGroups = 0;
        this._dustMaxGroups = IS_MOBILE ? DUST_MAX_SIMULTANEOUS_MOBILE : DUST_MAX_SIMULTANEOUS_DESKTOP;
    }

    // ================================================================
    // GRAPHICS POOL
    // ================================================================

    _getPooledGraphics() {
        if (this._pool.length > 0) {
            const g = this._pool.pop();
            g.setVisible(true);
            return g;
        }
        return this.scene.add.graphics();
    }

    _returnToPool(g) {
        if (!g || !g.active) return;
        g.clear();
        g.setVisible(false);
        if (this._pool.length < this._poolMax) {
            this._pool.push(g);
        } else {
            g.destroy();
        }
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
            I18n.t('tutorial.aim'),
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
        // Limiter les groupes simultanés pour maintenir 60 FPS (5 desktop, 4 mobile)
        if (this._activeDustGroups >= this._dustMaxGroups) return;
        this._activeDustGroups++;

        const terrainColors = {
            terre: [0xC4854A, 0xA87040, 0xD4955A],
            herbe: [0x6B8E4E, 0x5E8A44, 0x7BA65E],
            sable: [0xE8D5B7, 0xD4C0A0, 0xF0E0C8],
            dalles: [0x9E9E8E, 0x808070, 0xB0A090]
        };
        const colors = terrainColors[terrainType] || terrainColors.terre;

        let remaining = count;

        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
            const dist = 8 + Math.random() * 16;
            const color = colors[Math.floor(Math.random() * colors.length)];
            const size = 2 + Math.random() * 3;

            const p = this._getPooledGraphics().setDepth(8);
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
                onComplete: () => {
                    this._returnToPool(p);
                    remaining--;
                    if (remaining <= 0) this._activeDustGroups--;
                }
            });
        }
    }

    spawnCollisionSparks(x, y, count = 5) {
        // Phaser 4 glow flash on impact point
        if (this._hasWebGL) {
            this._flashGlowAt(x, y);
        }

        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 6 + Math.random() * 12;
            const spark = this._getPooledGraphics().setDepth(55);
            spark.fillStyle(0xFFFFFF, 0.8);
            spark.fillCircle(0, 0, 1.5);
            spark.setPosition(x, y);

            this.scene.tweens.add({
                targets: spark,
                x: x + Math.cos(angle) * dist,
                y: y + Math.sin(angle) * dist,
                alpha: 0, duration: 200,
                onComplete: () => this._returnToPool(spark)
            });
        }
    }

    /**
     * Phaser 4 glow flash effect at impact point.
     * Creates a small white circle with glow filter that fades out.
     */
    _flashGlowAt(x, y) {
        try {
            const flash = this.scene.add.circle(x, y, 6, 0xFFFFFF, 0.9).setDepth(56);
            if (typeof flash.enableFilters === 'function') {
                flash.enableFilters();
                flash.filters.internal.addGlow(0xFFFFFF, 6, 0, 1, false, 4, 4);
            }
            this.scene.tweens.add({
                targets: flash,
                alpha: 0, scaleX: 2, scaleY: 2,
                duration: 250, ease: 'Cubic.easeOut',
                onComplete: () => flash.destroy()
            });
        } catch (_) {
            // Filter not supported, sparks alone are fine
        }
    }

    spawnRollTrail(ball, terrainType = 'terre') {
        const color = terrainType === 'sable' ? 0xE8D5B7
            : terrainType === 'herbe' ? 0x6B8E4E
            : terrainType === 'dalles' ? 0x9E9E8E
            : 0xC4854A;

        const p = this._getPooledGraphics().setDepth(3);
        p.fillStyle(color, 0.3);
        p.fillCircle(0, 0, 2);
        p.setPosition(ball.x, ball.y);

        this.scene.tweens.add({
            targets: p, alpha: 0, duration: 400,
            onComplete: () => this._returnToPool(p)
        });
    }

    // ================================================================
    // IMPACT EFFECTS
    // ================================================================

    drawImpactTrace(x, y, radius, bounds) {
        if (!this.scene.impactLayer) return;
        const crater = this.scene.add.graphics();
        crater.fillStyle(0x3A2E28, 0.18);
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

        // Phaser 4: additional glow flash
        if (this._hasWebGL) {
            this._flashGlowAt(x, y);
        }
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
        // === SCREEN SHAKE (3px, 150ms) ===
        this.scene.cameras.main.shake(150, 0.004);

        // === GOLDEN FLASH at impact ===
        this.scene.cameras.main.flash(100, 255, 215, 0, true);

        // "CARREAU !" text with Phaser 4 glow filter
        const txt = this.scene.add.text(ball.x, ball.y - 30, 'CARREAU !', {
            fontFamily: 'monospace', fontSize: '24px', color: '#FFD700',
            shadow: { offsetX: 2, offsetY: 2, color: '#1A1510', blur: 0, fill: true }
        }).setOrigin(0.5).setDepth(65);

        // Phaser 4 glow on text
        if (this._hasWebGL) {
            try {
                if (typeof txt.enableFilters === 'function') {
                    txt.enableFilters();
                    txt.filters.internal.addGlow(0xFFD700, 4, 0, 1, false, 4, 4);
                }
            } catch (_) { /* filter not supported */ }
        }

        this.scene.tweens.add({
            targets: txt,
            y: txt.y - 50, alpha: 0, scaleX: 1.5, scaleY: 1.5,
            duration: 1500, ease: 'Cubic.easeOut',
            onComplete: () => txt.destroy()
        });

        // Glow ring expanding from ball (Phaser 4)
        if (this._hasWebGL) {
            try {
                const ring = this.scene.add.circle(ball.x, ball.y, ball.radius + 2, 0xFFD700, 0.6)
                    .setDepth(63);
                if (typeof ring.enableFilters === 'function') {
                    ring.enableFilters();
                    ring.filters.internal.addGlow(0xFFD700, 8, 0, 1, false, 4, 6);
                }
                this.scene.tweens.add({
                    targets: ring,
                    scaleX: 4, scaleY: 4, alpha: 0,
                    duration: 800, ease: 'Cubic.easeOut',
                    onComplete: () => ring.destroy()
                });
            } catch (_) { /* filter not supported */ }
        }

        // Radial gold sparks (12 instead of 8 for more spectacle)
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const spark = this.scene.add.graphics().setDepth(64);
            spark.fillStyle(0xFFD700, 1);
            spark.fillCircle(0, 0, 4);
            spark.setPosition(ball.x, ball.y);
            this.scene.tweens.add({
                targets: spark,
                x: ball.x + Math.cos(angle) * 48,
                y: ball.y + Math.sin(angle) * 48,
                alpha: 0, duration: 600,
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
            const color = 0xCC4444; // Always red for closest ball
            const t = this._bestPulse.t;
            const alpha = 0.4 + t * 0.4;
            const radius = bestBall.radius + 3 + t * 2;

            this._bestGfx.lineStyle(1.5, color, alpha);
            this._bestGfx.strokeCircle(bestBall.x, bestBall.y, radius);

            if (bestBall.id !== this._lastBestBallId) {
                // Clear glow on previous best ball
                if (this._bestGlowSprite && typeof this._bestGlowSprite.clearFilters === 'function') {
                    try { this._bestGlowSprite.clearFilters(); } catch (_) {}
                    this._bestGlowSprite = null;
                }
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
    // BARK (AI speech bubble)
    // ================================================================

    showBark(text, isGood) {
        const x = this.scene.scale.width - 80;
        // y=100 : sous le score compact (h=50, y=6 → bas=56), 44px de marge
        const y = 100;
        const color = isGood ? '#6B8E4E' : '#C44B3F';
        const bgColor = isGood ? 0x6B8E4E : 0xC44B3F;

        const bubble = this.scene.add.text(x, y, text, {
            fontFamily: 'monospace', fontSize: '11px', color: '#F5E6D0',
            padding: { x: 8, y: 4 },
            wordWrap: { width: 140 }
        }).setOrigin(0.5).setDepth(100).setAlpha(0);

        // Fond semi-transparent derrière le bark pour meilleure lisibilité
        const bw = bubble.width + 12;
        const bh = bubble.height + 4;
        const bg = this.scene.add.graphics().setDepth(99).setAlpha(0);
        bg.fillStyle(0x3A2E28, 0.7);
        bg.fillRoundedRect(x - bw / 2, y - bh / 2, bw, bh, 4);
        bg.fillStyle(bgColor, 0.85);
        bg.fillRoundedRect(x - bw / 2 + 1, y - bh / 2 + 1, bw - 2, bh - 2, 3);

        this.scene.tweens.add({
            targets: [bubble, bg], alpha: 1, duration: 200,
            onComplete: () => {
                this.scene.time.delayedCall(BARK_DURATION, () => {
                    this.scene.tweens.add({
                        targets: [bubble, bg], alpha: 0, duration: 300,
                        onComplete: () => { bubble.destroy(); bg.destroy(); }
                    });
                });
            }
        });
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
        // Kill pulse tween to prevent orphaned infinite loop
        if (this._bestPulse && this.scene?.tweens) {
            this.scene.tweens.getTweensOf(this._bestPulse).forEach(t => t.stop());
        }
        if (this._bestGlowSprite && typeof this._bestGlowSprite.clearFilters === 'function') {
            try { this._bestGlowSprite.clearFilters(); } catch (_) {}
            this._bestGlowSprite = null;
        }
        if (this._bestGfx) { this._bestGfx.destroy(); this._bestGfx = null; }
        if (this._msgText) { this._msgText.destroy(); this._msgText = null; }

        // Vider le pool de Graphics
        for (const g of this._pool) {
            if (g && g.active) g.destroy();
        }
        this._pool = [];
        this._activeDustGroups = 0;
    }
}
