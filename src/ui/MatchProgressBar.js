import Layout from '../utils/Layout.js';
import I18n from '../utils/I18n.js';

/**
 * MatchProgressBar — portrait-only visual showing mène count + score target.
 *
 * Inspired by Golf Clash "round x/3" indicator, adapted to pétanque:
 *   [●●●○○○○○○○○○○]  MÈNE 4  •  13 pts pour gagner
 *
 * 13 pastilles (score max), filled by max(player, opponent) current score —
 * shows how close the match is to finishing.
 *
 * Hidden entirely in landscape (desktop). Call update() each frame.
 */
export default class MatchProgressBar {
    /**
     * @param {Phaser.Scene} scene
     * @param {object} engine - PetanqueEngine
     * @param {object} [opts]
     * @param {number} [opts.y] - Y center position (default: 68 in portrait)
     * @param {number} [opts.width] - total width (default 280)
     * @param {number} [opts.targetScore] - winning score (default 13)
     */
    constructor(scene, engine, opts = {}) {
        this.scene = scene;
        this.engine = engine;
        this.targetScore = opts.targetScore || 13;
        this._visible = Layout.isPortrait;

        if (!this._visible) return; // no-op in landscape — keeps desktop layout intact

        const width = opts.width || 280;
        const y = opts.y || 68;
        const cx = Layout.W / 2;

        this.x = cx;
        this.y = y;
        this.width = width;

        // Backdrop (subtle wood pill)
        this._bg = scene.add.graphics().setDepth(89);
        this._drawBackdrop(cx - width / 2, y - 16, width, 32);

        // Dots graphics (redrawn each frame it changes)
        this._dotsGfx = scene.add.graphics().setDepth(91);

        // Label text
        this._label = scene.add.text(cx, y + 14, '', {
            fontFamily: 'monospace', fontSize: '10px', color: '#D4A574',
            shadow: { offsetX: 1, offsetY: 1, color: '#1A1510', blur: 0, fill: true }
        }).setOrigin(0.5, 0).setDepth(91);

        this._prevMax = -1;
        this._prevMene = -1;
        this.update();
    }

    _drawBackdrop(x, y, w, h) {
        const g = this._bg;
        g.clear();
        // Soft shadow
        g.fillStyle(0x1A1510, 0.25);
        g.fillRoundedRect(x + 1, y + 2, w, h, 10);
        // Wood base
        g.fillStyle(0x3A2E28, 0.75);
        g.fillRoundedRect(x, y, w, h, 10);
        // Gold border (subtle)
        g.lineStyle(1, 0xD4A574, 0.35);
        g.strokeRoundedRect(x, y, w, h, 10);
    }

    _drawDots(maxScore) {
        const g = this._dotsGfx;
        g.clear();

        const target = this.targetScore;
        const dotR = 4;
        const spacing = Math.min(18, (this.width - 24) / target);
        const totalW = spacing * (target - 1);
        const startX = this.x - totalW / 2;
        const dy = this.y - 6;

        for (let i = 0; i < target; i++) {
            const dx = startX + i * spacing;
            const filled = i < maxScore;
            // Milestone highlight (6, 10, 13) — subtle color shift
            const isMilestone = (i === 5 || i === 9 || i === 12);

            // Shadow
            g.fillStyle(0x1A1510, 0.3);
            g.fillCircle(dx + 0.5, dy + 1, dotR);

            if (filled) {
                // Filled dot: gold, glow brighter for last (match point)
                const color = (i === target - 1) ? 0xFFD700 : (isMilestone ? 0xFFEFA0 : 0xD4A574);
                g.fillStyle(color, 1);
                g.fillCircle(dx, dy, dotR);
                // Highlight
                g.fillStyle(0xFFFFFF, 0.4);
                g.fillCircle(dx - 1, dy - 1, 1.2);
            } else {
                // Empty dot
                g.fillStyle(isMilestone ? 0x6B4F2D : 0x3A2E28, 0.9);
                g.fillCircle(dx, dy, dotR);
                g.lineStyle(1, isMilestone ? 0xD4A574 : 0x6B4F2D, 0.6);
                g.strokeCircle(dx, dy, dotR);
            }
        }
    }

    update() {
        if (!this._visible) return;
        const e = this.engine;
        if (!e) return;

        const maxScore = Math.max(e.scores.player || 0, e.scores.opponent || 0);
        const mene = e.mene || 1;

        if (maxScore !== this._prevMax) {
            this._drawDots(maxScore);
            this._prevMax = maxScore;
        }

        if (mene !== this._prevMene) {
            // Provencal-flavored label
            const meneStr = I18n.t('ingame.mene', { n: mene });
            this._label.setText(`${meneStr}  •  ${this.targetScore} pts pour gagner`);
            this._prevMene = mene;
        }
    }

    destroy() {
        if (!this._visible) return;
        if (this._bg) this._bg.destroy();
        if (this._dotsGfx) this._dotsGfx.destroy();
        if (this._label) this._label.destroy();
    }
}
