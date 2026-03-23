import { GAME_WIDTH, GAME_HEIGHT, COLORS, BALL_COLORS, FONT_PIXEL, SHADOW_TEXT, UI } from '../utils/Constants.js';
import UIFactory from './UIFactory.js';

const SHADOW = SHADOW_TEXT;

export default class ScorePanel {
    constructor(scene, engine) {
        this.scene = scene;
        this.engine = engine;
        this._showRanking = false;

        this.panelX = GAME_WIDTH - 156;
        this.panelY = 6;
        const pw = 148;
        const ph = 170;

        // Wood panel background
        this.bg = scene.add.graphics().setDepth(90);

        // Outer shadow
        this.bg.fillStyle(0x1A1510, 0.4);
        this.bg.fillRoundedRect(this.panelX + 2, this.panelY + 2, pw, ph, 8);

        // Wood base
        this.bg.fillStyle(0x6B4F2D, 0.95);
        this.bg.fillRoundedRect(this.panelX, this.panelY, pw, ph, 8);

        // Wood grain
        for (let y = this.panelY + 4; y < this.panelY + ph - 4; y += 3) {
            const alpha = 0.05 + Math.sin(y * 0.4) * 0.03;
            this.bg.fillStyle(0x3A2818, alpha);
            this.bg.fillRect(this.panelX + 4, y, pw - 8, 1);
        }

        // Top bevel
        this.bg.fillStyle(0xA08050, 0.2);
        this.bg.fillRoundedRect(this.panelX + 2, this.panelY + 2, pw - 4, 20, { tl: 6, tr: 6, bl: 0, br: 0 });

        // Border
        this.bg.lineStyle(2, 0x8B6B3D, 0.7);
        this.bg.strokeRoundedRect(this.panelX, this.panelY, pw, ph, 8);

        // Corner nails
        const nailColor = 0xA08050;
        const nails = [
            [this.panelX + 8, this.panelY + 8],
            [this.panelX + pw - 10, this.panelY + 8],
            [this.panelX + 8, this.panelY + ph - 10],
            [this.panelX + pw - 10, this.panelY + ph - 10]
        ];
        for (const [nx, ny] of nails) {
            this.bg.fillStyle(nailColor, 0.8);
            this.bg.fillCircle(nx, ny, 2.5);
            this.bg.fillStyle(0xFFFFFF, 0.3);
            this.bg.fillRect(nx - 1, ny - 1, 1, 1);
        }

        const cx = this.panelX + pw / 2;

        // Title
        this.titleText = scene.add.text(cx, this.panelY + 16, 'SCORE', {
            fontFamily: 'monospace', fontSize: '14px', color: '#FFD700', align: 'center', shadow: SHADOW
        }).setOrigin(0.5, 0).setDepth(91);

        // Separator
        this.bg.lineStyle(1, 0x8B6B3D, 0.5);
        this.bg.beginPath();
        this.bg.moveTo(this.panelX + 12, this.panelY + 34);
        this.bg.lineTo(this.panelX + pw - 12, this.panelY + 34);
        this.bg.strokePath();

        // Player section
        const playerName = scene.playerCharacter?.name
            ? scene.playerCharacter.name.toUpperCase().substring(0, 10)
            : 'VOUS';
        this.playerLabel = scene.add.text(cx - 24, this.panelY + 40, playerName, {
            fontFamily: 'monospace', fontSize: '12px', color: '#87CEEB', align: 'center', shadow: SHADOW
        }).setOrigin(0.5, 0).setDepth(91);

        this.playerScore = scene.add.text(cx - 24, this.panelY + 56, '0', {
            fontFamily: 'monospace', fontSize: '28px', color: '#F5E6D0', align: 'center', shadow: SHADOW
        }).setOrigin(0.5, 0).setDepth(91);

        this.playerProjected = scene.add.text(cx + 20, this.panelY + 62, '', {
            fontFamily: 'monospace', fontSize: '14px', color: '#6B8E4E', shadow: SHADOW
        }).setOrigin(0, 0).setDepth(91);

        // VS divider
        this.bg.lineStyle(1, 0x8B6B3D, 0.3);
        this.bg.beginPath();
        this.bg.moveTo(this.panelX + 12, this.panelY + 92);
        this.bg.lineTo(this.panelX + pw - 12, this.panelY + 92);
        this.bg.strokePath();

        // Opponent section
        const opponentName = scene.opponentCharacter?.name
            ? scene.opponentCharacter.name.toUpperCase().substring(0, 10)
            : 'ADV.';
        this.opponentLabel = scene.add.text(cx - 24, this.panelY + 98, opponentName, {
            fontFamily: 'monospace', fontSize: '12px', color: '#C44B3F', align: 'center', shadow: SHADOW
        }).setOrigin(0.5, 0).setDepth(91);

        this.opponentScore = scene.add.text(cx - 24, this.panelY + 114, '0', {
            fontFamily: 'monospace', fontSize: '28px', color: '#F5E6D0', align: 'center', shadow: SHADOW
        }).setOrigin(0.5, 0).setDepth(91);

        this.opponentProjected = scene.add.text(cx + 20, this.panelY + 120, '', {
            fontFamily: 'monospace', fontSize: '14px', color: '#C44B3F', shadow: SHADOW
        }).setOrigin(0, 0).setDepth(91);

        // Mene indicator (wood medallion style)
        const meneGfx = scene.add.graphics().setDepth(91);
        // Medallion background
        meneGfx.fillStyle(0x6B4F2D, 0.95);
        meneGfx.fillRoundedRect(4, 4, 84, 28, 6);
        meneGfx.lineStyle(1.5, 0x8B6B3D, 0.7);
        meneGfx.strokeRoundedRect(4, 4, 84, 28, 6);
        // Top bevel
        meneGfx.fillStyle(0xA08050, 0.15);
        meneGfx.fillRoundedRect(6, 6, 80, 10, { tl: 4, tr: 4, bl: 0, br: 0 });
        this._meneGfx = meneGfx;

        this.meneText = scene.add.text(46, 18, 'MENE 1', {
            fontFamily: 'monospace', fontSize: '14px', color: '#FFD700', shadow: SHADOW
        }).setOrigin(0.5).setDepth(92);

        // Balls remaining
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

        this._rankHint = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 6, '[TAB] Classement', {
            fontFamily: 'monospace', fontSize: '10px', color: '#9E9E8E', align: 'center'
        }).setOrigin(0.5, 1).setDepth(90).setAlpha(0.5);

        this._tabKey = scene.input.keyboard.addKey('TAB');

        this._prevPlayerRemaining = -1;
        this._prevOpponentRemaining = -1;
        this._prevPlayerScore = 0;
        this._prevOpponentScore = 0;
    }

    update() {
        const e = this.engine;

        const newPlayerScore = e.scores.player;
        const newOpponentScore = e.scores.opponent;
        if (newPlayerScore !== this._prevPlayerScore) {
            const diff = newPlayerScore - this._prevPlayerScore;
            this._animateScoreCount(this.playerScore, this._prevPlayerScore, newPlayerScore);
            this._pulseText(this.playerScore);
            if (diff > 0) this._showFloatingPoints(this.playerScore, diff, '#87CEEB');
            this._prevPlayerScore = newPlayerScore;
        }
        if (newOpponentScore !== this._prevOpponentScore) {
            const diff = newOpponentScore - this._prevOpponentScore;
            this._animateScoreCount(this.opponentScore, this._prevOpponentScore, newOpponentScore);
            this._pulseText(this.opponentScore);
            if (diff > 0) this._showFloatingPoints(this.opponentScore, diff, '#C44B3F');
            this._prevOpponentScore = newOpponentScore;
        }

        this.meneText.setText(`MENE ${e.mene}`);

        if (newPlayerScore >= 12 && !this._playerMatchPoint) {
            this._playerMatchPoint = true;
            this._blinkMatchPoint(this.playerScore);
        }
        if (newOpponentScore >= 12 && !this._opponentMatchPoint) {
            this._opponentMatchPoint = true;
            this._blinkMatchPoint(this.opponentScore);
        }

        const proj = e.calculateProjectedScore();
        if (proj && proj.winner && proj.points > 0) {
            if (proj.winner === 'player') {
                this.playerProjected.setText(`+${proj.points}`).setVisible(true);
                this.opponentProjected.setVisible(false);
            } else {
                this.opponentProjected.setText(`+${proj.points}`).setVisible(true);
                this.playerProjected.setVisible(false);
            }
        } else {
            this.playerProjected.setVisible(false);
            this.opponentProjected.setVisible(false);
        }

        this._drawBallDots(e);

        this._showRanking = this._tabKey.isDown;
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

        // Wood-style background for ball indicator
        this.ballsBg.fillStyle(0x6B4F2D, 0.9);
        this.ballsBg.fillRoundedRect(baseX - 10, baseY - 18, totalWidth, 36, 6);
        this.ballsBg.lineStyle(1, 0x8B6B3D, 0.5);
        this.ballsBg.strokeRoundedRect(baseX - 10, baseY - 18, totalWidth, 36, 6);
        // Top bevel
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
        // Cleanup TAB key listener to prevent accumulation on scene reuse
        if (this._tabKey) {
            this.scene.input.keyboard.removeKey('TAB');
            this._tabKey = null;
        }
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
