import { GAME_WIDTH, GAME_HEIGHT, COLORS, BALL_COLORS, FONT_PIXEL, SHADOW_TEXT, UI, SCORE_PANEL_COMPACT_W, SCORE_PANEL_COMPACT_H } from '../utils/Constants.js';
import UIFactory from './UIFactory.js';
import I18n from '../utils/I18n.js';

const SHADOW = SHADOW_TEXT;

// Compact mode : 94×50px, top-right, shows score + mene only
// Expanded mode : full panel (148×170px) appears below compact on TAB hold
// Both panels share the same "bois" style

export default class ScorePanel {
    constructor(scene, engine) {
        this.scene = scene;
        this.engine = engine;
        this._showRanking = false;
        this._expanded = false;

        // === COMPACT PANEL (always visible) ===
        const cw = SCORE_PANEL_COMPACT_W;  // 94
        const ch = SCORE_PANEL_COMPACT_H;  // 50
        this.compactX = GAME_WIDTH - cw - 6;
        this.compactY = 6;

        this._compactBg = scene.add.graphics().setDepth(90);
        this._drawWoodPanel(this._compactBg, this.compactX, this.compactY, cw, ch, 6);
        UIFactory.addPanelShadow(this._compactBg);

        const ccx = this.compactX + cw / 2;

        // Score player (bleu, gauche) | Score opponent (rouge, droite)
        this._cPlayerScore = scene.add.text(ccx - 22, this.compactY + 10, '0', {
            fontFamily: 'monospace', fontSize: '20px', color: '#87CEEB',
            align: 'right', shadow: SHADOW
        }).setOrigin(1, 0).setDepth(91);

        this._cSep = scene.add.text(ccx, this.compactY + 10, '—', {
            fontFamily: 'monospace', fontSize: '14px', color: '#8B6B3D',
            align: 'center', shadow: SHADOW
        }).setOrigin(0.5, 0).setDepth(91);

        this._cOpponentScore = scene.add.text(ccx + 22, this.compactY + 10, '0', {
            fontFamily: 'monospace', fontSize: '20px', color: '#C44B3F',
            align: 'left', shadow: SHADOW
        }).setOrigin(0, 0).setDepth(91);

        // Mene (bas, centré, ocre)
        this._cMene = scene.add.text(ccx, this.compactY + 36, I18n.t('ingame.mene', { n: 1 }), {
            fontFamily: 'monospace', fontSize: '10px', color: '#D4A574',
            align: 'center', shadow: SHADOW
        }).setOrigin(0.5, 0).setDepth(91);

        // === EXPANDED PANEL (below compact, hidden by default) ===
        this.panelX = this.compactX;
        this.panelY = this.compactY + ch + 4;  // just below compact
        const pw = 148;
        const ph = 170;

        this.bg = scene.add.graphics().setDepth(90).setAlpha(0);
        this._drawFullPanel(this.bg, this.panelX, this.panelY, pw, ph);
        UIFactory.addPanelShadow(this.bg);

        const cx = this.panelX + pw / 2;

        this.titleText = scene.add.text(cx, this.panelY + 16, I18n.t('ingame.score'), {
            fontFamily: 'monospace', fontSize: '14px', color: '#FFD700', align: 'center', shadow: SHADOW
        }).setOrigin(0.5, 0).setDepth(91).setAlpha(0);

        const playerName = scene.playerCharacter
            ? I18n.field(scene.playerCharacter, 'name').toUpperCase().substring(0, 10)
            : I18n.t('ingame.you');
        this.playerLabel = scene.add.text(cx - 24, this.panelY + 40, playerName, {
            fontFamily: 'monospace', fontSize: '12px', color: '#87CEEB', align: 'center', shadow: SHADOW
        }).setOrigin(0.5, 0).setDepth(91).setAlpha(0);

        this.playerScore = scene.add.text(cx - 24, this.panelY + 56, '0', {
            fontFamily: 'monospace', fontSize: '28px', color: '#F5E6D0', align: 'center', shadow: SHADOW
        }).setOrigin(0.5, 0).setDepth(91).setAlpha(0);

        this.playerProjected = scene.add.text(cx + 20, this.panelY + 62, '', {
            fontFamily: 'monospace', fontSize: '14px', color: '#6B8E4E', shadow: SHADOW
        }).setOrigin(0, 0).setDepth(91).setAlpha(0).setVisible(false);

        const opponentName = scene.opponentCharacter
            ? I18n.field(scene.opponentCharacter, 'name').toUpperCase().substring(0, 10)
            : I18n.t('ingame.opponent');
        this.opponentLabel = scene.add.text(cx - 24, this.panelY + 98, opponentName, {
            fontFamily: 'monospace', fontSize: '12px', color: '#C44B3F', align: 'center', shadow: SHADOW
        }).setOrigin(0.5, 0).setDepth(91).setAlpha(0);

        this.opponentScore = scene.add.text(cx - 24, this.panelY + 114, '0', {
            fontFamily: 'monospace', fontSize: '28px', color: '#F5E6D0', align: 'center', shadow: SHADOW
        }).setOrigin(0.5, 0).setDepth(91).setAlpha(0);

        this.opponentProjected = scene.add.text(cx + 20, this.panelY + 120, '', {
            fontFamily: 'monospace', fontSize: '14px', color: '#C44B3F', shadow: SHADOW
        }).setOrigin(0, 0).setDepth(91).setAlpha(0).setVisible(false);

        // Mene medallion (expanded panel)
        const meneGfx = scene.add.graphics().setDepth(91).setAlpha(0);
        meneGfx.fillStyle(0x6B4F2D, 0.95);
        meneGfx.fillRoundedRect(4, 4, 84, 28, 6);
        meneGfx.lineStyle(1.5, 0x8B6B3D, 0.7);
        meneGfx.strokeRoundedRect(4, 4, 84, 28, 6);
        meneGfx.fillStyle(0xA08050, 0.15);
        meneGfx.fillRoundedRect(6, 6, 80, 10, { tl: 4, tr: 4, bl: 0, br: 0 });
        this._meneGfx = meneGfx;

        this.meneText = scene.add.text(46, 18, I18n.t('ingame.mene', { n: 1 }), {
            fontFamily: 'monospace', fontSize: '14px', color: '#FFD700', shadow: SHADOW
        }).setOrigin(0.5).setDepth(92).setAlpha(0);

        // Ball dots
        this.ballsGfx = scene.add.graphics().setDepth(92);
        this.ballsBg = scene.add.graphics().setDepth(91);

        // Ranking overlay
        this._rankGfx = scene.add.graphics().setDepth(50);
        this._rankLabels = [];
        for (let i = 0; i < 6; i++) {
            const label = scene.add.text(0, 0, '', {
                fontFamily: 'monospace', fontSize: '12px', color: '#F5E6D0',
                shadow: SHADOW, backgroundColor: '#3A2E28', padding: { x: 3, y: 2 }
            }).setOrigin(0.5).setDepth(51).setVisible(false);
            this._rankLabels.push(label);
        }

        this._rankHint = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 6, I18n.t('ingame.tab_hint'), {
            fontFamily: 'monospace', fontSize: '10px', color: '#9E9E8E', align: 'center'
        }).setOrigin(0.5, 1).setDepth(90).setAlpha(0.5);

        this._tabKey = scene.input.keyboard.addKey('TAB');

        // All expanded panel objects for tween toggling
        this._expandedObjects = [
            this.bg, this.titleText, this.playerLabel, this.playerScore,
            this.opponentLabel, this.opponentScore, this._meneGfx, this.meneText
        ];

        this._prevPlayerRemaining = -1;
        this._prevOpponentRemaining = -1;
        this._prevPlayerScore = 0;
        this._prevOpponentScore = 0;
    }

    // ================================================================
    // WOOD PANEL DRAWING HELPERS
    // ================================================================

    _drawWoodPanel(gfx, x, y, w, h, radius) {
        // Shadow
        gfx.fillStyle(0x1A1510, 0.4);
        gfx.fillRoundedRect(x + 2, y + 2, w, h, radius);
        // Base
        gfx.fillStyle(0x6B4F2D, 0.95);
        gfx.fillRoundedRect(x, y, w, h, radius);
        // Grain
        for (let gy = y + 4; gy < y + h - 4; gy += 3) {
            const alpha = 0.05 + Math.sin(gy * 0.4) * 0.03;
            gfx.fillStyle(0x3A2818, alpha);
            gfx.fillRect(x + 4, gy, w - 8, 1);
        }
        // Bevel
        gfx.fillStyle(0xA08050, 0.2);
        gfx.fillRoundedRect(x + 2, y + 2, w - 4, Math.min(20, h - 4), { tl: radius - 2, tr: radius - 2, bl: 0, br: 0 });
        // Border
        gfx.lineStyle(2, 0x8B6B3D, 0.7);
        gfx.strokeRoundedRect(x, y, w, h, radius);
        // Nails
        const nailColor = 0xA08050;
        for (const [nx, ny] of [[x + 8, y + 8], [x + w - 10, y + 8], [x + 8, y + h - 10], [x + w - 10, y + h - 10]]) {
            gfx.fillStyle(nailColor, 0.8);
            gfx.fillCircle(nx, ny, 2.5);
            gfx.fillStyle(0xFFFFFF, 0.3);
            gfx.fillRect(nx - 1, ny - 1, 1, 1);
        }
    }

    _drawFullPanel(gfx, x, y, w, h) {
        this._drawWoodPanel(gfx, x, y, w, h, 8);
        // Separators
        gfx.lineStyle(1, 0x8B6B3D, 0.5);
        gfx.beginPath();
        gfx.moveTo(x + 12, y + 34);
        gfx.lineTo(x + w - 12, y + 34);
        gfx.strokePath();

        gfx.lineStyle(1, 0x8B6B3D, 0.3);
        gfx.beginPath();
        gfx.moveTo(x + 12, y + 92);
        gfx.lineTo(x + w - 12, y + 92);
        gfx.strokePath();
    }

    // ================================================================
    // EXPAND / COLLAPSE
    // ================================================================

    _setExpanded(show) {
        if (this._expanded === show) return;
        this._expanded = show;

        this.scene.tweens.killTweensOf(this._expandedObjects);

        this.scene.tweens.add({
            targets: this._expandedObjects,
            alpha: show ? 1 : 0,
            duration: 200,
            ease: 'Quad.easeOut'
        });

        // Projected scores follow visibility
        if (!show) {
            this.playerProjected.setVisible(false);
            this.opponentProjected.setVisible(false);
        }
    }

    // ================================================================
    // UPDATE
    // ================================================================

    update() {
        const e = this.engine;

        // --- Compact scores ---
        const newPlayerScore = e.scores.player;
        const newOpponentScore = e.scores.opponent;

        if (newPlayerScore !== this._prevPlayerScore) {
            this._cPlayerScore.setText(String(newPlayerScore));
            this._animateScoreCount(this.playerScore, this._prevPlayerScore, newPlayerScore);
            this._pulseText(this._cPlayerScore);
            if (newPlayerScore > this._prevPlayerScore) this._showFloatingPoints(this._cPlayerScore, newPlayerScore - this._prevPlayerScore, '#87CEEB');
            this._prevPlayerScore = newPlayerScore;
        }
        if (newOpponentScore !== this._prevOpponentScore) {
            this._cOpponentScore.setText(String(newOpponentScore));
            this._animateScoreCount(this.opponentScore, this._prevOpponentScore, newOpponentScore);
            this._pulseText(this._cOpponentScore);
            if (newOpponentScore > this._prevOpponentScore) this._showFloatingPoints(this._cOpponentScore, newOpponentScore - this._prevOpponentScore, '#C44B3F');
            this._prevOpponentScore = newOpponentScore;
        }

        const meneStr = I18n.t('ingame.mene', { n: e.mene });
        this._cMene.setText(meneStr);
        this.meneText.setText(meneStr);

        if (newPlayerScore >= 12 && !this._playerMatchPoint) {
            this._playerMatchPoint = true;
            this._blinkMatchPoint(this._cPlayerScore);
            this._blinkMatchPoint(this.playerScore);
        }
        if (newOpponentScore >= 12 && !this._opponentMatchPoint) {
            this._opponentMatchPoint = true;
            this._blinkMatchPoint(this._cOpponentScore);
            this._blinkMatchPoint(this.opponentScore);
        }

        // --- Expanded panel projected scores ---
        if (this._expanded) {
            const proj = e.calculateProjectedScore();
            if (proj && proj.winner && proj.points > 0) {
                if (proj.winner === 'player') {
                    this.playerProjected.setText(`+${proj.points}`).setVisible(true).setAlpha(1);
                    this.opponentProjected.setVisible(false);
                } else {
                    this.opponentProjected.setText(`+${proj.points}`).setVisible(true).setAlpha(1);
                    this.playerProjected.setVisible(false);
                }
            } else {
                this.playerProjected.setVisible(false);
                this.opponentProjected.setVisible(false);
            }
        }

        this._drawBallDots(e);

        // TAB : expand/collapse
        const tabDown = this._tabKey.isDown;
        this._setExpanded(tabDown);
        this._showRanking = tabDown;
        this._updateRanking(e);
    }

    _pulseText(textObj) {
        this.scene.tweens.add({
            targets: textObj,
            scaleX: 1.3, scaleY: 1.3,
            duration: 150, ease: 'Quad.easeOut',
            yoyo: true,
            onStart: () => textObj.setShadow(0, 0, '#FFD700', 8, true, true),
            onComplete: () => textObj.setShadow(2, 2, '#1A1510', 0, true, false)
        });
    }

    _animateScoreCount(textObj, from, to) {
        const counter = { val: from };
        this.scene.tweens.add({
            targets: counter,
            val: to,
            duration: Math.abs(to - from) * 200,
            ease: 'Stepped',
            onUpdate: () => {
                textObj.setText(String(Math.round(counter.val)));
            }
        });
    }

    _blinkMatchPoint(scoreTextObj) {
        this.scene.tweens.add({
            targets: scoreTextObj,
            duration: 400, repeat: 3, yoyo: true,
            onYoyo: () => scoreTextObj.setColor('#C44B3F'),
            onRepeat: () => scoreTextObj.setColor('#F5E6D0'),
            onComplete: () => scoreTextObj.setColor('#F5E6D0')
        });
        UIFactory.showFloatingText(this.scene, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40,
            'MATCH POINT !', '#FFD700', { fontSize: '16px', rise: 30, duration: 2000, depth: 95 });
    }

    _showFloatingPoints(scoreTextObj, points, color) {
        UIFactory.showFloatingText(this.scene, scoreTextObj.x + 40, scoreTextObj.y + 10, `+${points}`, color, { depth: 95 });
    }

    _drawBallDots(e) {
        this.ballsGfx.clear();
        this.ballsBg.clear();

        const baseX = 16;
        const baseY = GAME_HEIGHT - 22;
        const dotR = 7;
        const spacing = 20;

        const totalWidth = (e.ballsPerPlayer * spacing * 2) + 52;

        this.ballsBg.fillStyle(0x6B4F2D, 0.9);
        this.ballsBg.fillRoundedRect(baseX - 10, baseY - 18, totalWidth, 36, 6);
        this.ballsBg.lineStyle(1, 0x8B6B3D, 0.5);
        this.ballsBg.strokeRoundedRect(baseX - 10, baseY - 18, totalWidth, 36, 6);
        this.ballsBg.fillStyle(0xA08050, 0.1);
        this.ballsBg.fillRoundedRect(baseX - 8, baseY - 16, totalWidth - 4, 10, { tl: 4, tr: 4, bl: 0, br: 0 });

        for (let i = 0; i < e.ballsPerPlayer; i++) {
            const remaining = i < e.remaining.player;
            const x = baseX + i * spacing;
            this.ballsGfx.fillStyle(0x3A2E28, 0.15);
            this.ballsGfx.fillEllipse(x + 1, baseY + 3, dotR * 1.6, dotR * 0.8);
            this.ballsGfx.fillStyle(BALL_COLORS.player, remaining ? 1 : 0.2);
            this.ballsGfx.fillCircle(x, baseY, dotR);
            if (remaining) {
                this.ballsGfx.fillStyle(0xFFFFFF, 0.35);
                this.ballsGfx.fillCircle(x - 2, baseY - 2, 2.5);
            }
        }

        const sepX = baseX + e.ballsPerPlayer * spacing + 10;
        this.ballsGfx.fillStyle(0x8B6B3D, 0.5);
        this.ballsGfx.fillRect(sepX, baseY - 8, 2, 16);

        const oBaseX = sepX + 14;
        for (let i = 0; i < e.ballsPerPlayer; i++) {
            const remaining = i < e.remaining.opponent;
            const x = oBaseX + i * spacing;
            this.ballsGfx.fillStyle(0x3A2E28, 0.15);
            this.ballsGfx.fillEllipse(x + 1, baseY + 3, dotR * 1.6, dotR * 0.8);
            this.ballsGfx.fillStyle(BALL_COLORS.opponent, remaining ? 1 : 0.2);
            this.ballsGfx.fillCircle(x, baseY, dotR);
            if (remaining) {
                this.ballsGfx.fillStyle(0xFFFFFF, 0.35);
                this.ballsGfx.fillCircle(x - 2, baseY - 2, 2.5);
            }
        }
    }

    _updateRanking(e) {
        this._rankGfx.clear();

        if (!this._showRanking) {
            for (const label of this._rankLabels) label.setVisible(false);
            return;
        }

        const anyMoving = e.balls.some(b => b.isAlive && b.isMoving) ||
            (e.cochonnet && e.cochonnet.isAlive && e.cochonnet.isMoving);
        if (anyMoving || !e.cochonnet || !e.cochonnet.isAlive) {
            for (const label of this._rankLabels) label.setVisible(false);
            return;
        }

        const alive = e.balls.filter(b => b.isAlive);
        if (alive.length === 0) {
            for (const label of this._rankLabels) label.setVisible(false);
            return;
        }

        const sorted = alive
            .map(b => ({ ball: b, dist: b.distanceTo(e.cochonnet) }))
            .sort((a, b) => a.dist - b.dist);

        for (let i = 0; i < sorted.length && i < this._rankLabels.length; i++) {
            const { ball, dist } = sorted[i];
            const isPlayer = ball.team === 'player';
            const color = isPlayer ? 0x87CEEB : 0xC44B3F;
            const colorHex = isPlayer ? '#87CEEB' : '#C44B3F';

            const label = this._rankLabels[i];
            label.setPosition(ball.x + ball.radius + 8, ball.y - 6);
            label.setText(`${i + 1}`);
            label.setColor(colorHex);
            label.setAlpha(0.9);
            label.setVisible(true);

            this._rankGfx.lineStyle(1, color, 0.2);
            this._rankGfx.beginPath();
            this._rankGfx.moveTo(ball.x, ball.y);
            this._rankGfx.lineTo(e.cochonnet.x, e.cochonnet.y);
            this._rankGfx.strokePath();

            if (i === 0) {
                this._rankGfx.lineStyle(1, color, 0.3);
                this._rankGfx.strokeCircle(e.cochonnet.x, e.cochonnet.y, dist);
            }
        }

        for (let i = sorted.length; i < this._rankLabels.length; i++) {
            this._rankLabels[i].setVisible(false);
        }
    }

    destroy() {
        if (this._tabKey) {
            this.scene.input.keyboard.removeKey('TAB');
            this._tabKey = null;
        }
        // Compact
        this._compactBg.destroy();
        this._cPlayerScore.destroy();
        this._cSep.destroy();
        this._cOpponentScore.destroy();
        this._cMene.destroy();
        // Expanded
        this.bg.destroy();
        this.titleText.destroy();
        this.playerLabel.destroy();
        this.playerScore.destroy();
        this.playerProjected.destroy();
        this.opponentLabel.destroy();
        this.opponentScore.destroy();
        this.opponentProjected.destroy();
        this._meneGfx.destroy();
        this.meneText.destroy();
        this.ballsGfx.destroy();
        this.ballsBg.destroy();
        this._rankGfx.destroy();
        this._rankHint.destroy();
        for (const label of this._rankLabels) label.destroy();
    }
}
