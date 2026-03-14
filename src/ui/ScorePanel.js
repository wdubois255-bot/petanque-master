import { GAME_WIDTH, GAME_HEIGHT, COLORS, BALL_COLORS, PIXELS_TO_METERS } from '../utils/Constants.js';

const SHADOW = { offsetX: 2, offsetY: 2, color: '#1A1510', blur: 0, fill: true };

export default class ScorePanel {
    constructor(scene, engine) {
        this.scene = scene;
        this.engine = engine;

        this.panelX = GAME_WIDTH - 144;
        this.panelY = 8;

        // Background
        this.bg = scene.add.graphics().setDepth(90);
        this.bg.fillStyle(COLORS.OMBRE, 0.85);
        this.bg.fillRoundedRect(this.panelX, this.panelY, 136, 156, 8);
        this.bg.lineStyle(2, 0xD4A574, 0.5);
        this.bg.strokeRoundedRect(this.panelX, this.panelY, 136, 156, 8);

        const cx = this.panelX + 68;

        // Title
        this.titleText = scene.add.text(
            cx, this.panelY + 16,
            'SCORE', {
                fontFamily: 'monospace', fontSize: '18px',
                color: '#D4A574', align: 'center',
                shadow: SHADOW
            }
        ).setOrigin(0.5, 0).setDepth(91);

        // Separator
        this.bg.lineStyle(2, 0xD4A574, 0.3);
        this.bg.beginPath();
        this.bg.moveTo(this.panelX + 16, this.panelY + 40);
        this.bg.lineTo(this.panelX + 120, this.panelY + 40);
        this.bg.strokePath();

        // Player score
        this.playerLabel = scene.add.text(
            cx, this.panelY + 48,
            'VOUS', {
                fontFamily: 'monospace', fontSize: '16px',
                color: '#A8B5C2', align: 'center',
                shadow: SHADOW
            }
        ).setOrigin(0.5, 0).setDepth(91);

        this.playerScore = scene.add.text(
            cx - 16, this.panelY + 68,
            '0', {
                fontFamily: 'monospace', fontSize: '28px',
                color: '#F5E6D0', align: 'center',
                shadow: SHADOW
            }
        ).setOrigin(0.5, 0).setDepth(91);

        // Projected score for player
        this.playerProjected = scene.add.text(
            cx + 28, this.panelY + 72,
            '', {
                fontFamily: 'monospace', fontSize: '16px',
                color: '#44CC44',
                shadow: SHADOW
            }
        ).setOrigin(0, 0).setDepth(91);

        // Opponent score
        this.opponentLabel = scene.add.text(
            cx, this.panelY + 96,
            'ADV.', {
                fontFamily: 'monospace', fontSize: '16px',
                color: '#C44B3F', align: 'center',
                shadow: SHADOW
            }
        ).setOrigin(0.5, 0).setDepth(91);

        this.opponentScore = scene.add.text(
            cx - 16, this.panelY + 116,
            '0', {
                fontFamily: 'monospace', fontSize: '28px',
                color: '#F5E6D0', align: 'center',
                shadow: SHADOW
            }
        ).setOrigin(0.5, 0).setDepth(91);

        // Projected score for opponent
        this.opponentProjected = scene.add.text(
            cx + 28, this.panelY + 120,
            '', {
                fontFamily: 'monospace', fontSize: '16px',
                color: '#CC4444',
                shadow: SHADOW
            }
        ).setOrigin(0, 0).setDepth(91);

        // Mene
        this.meneText = scene.add.text(
            8, 8,
            'MENE 1', {
                fontFamily: 'monospace', fontSize: '18px',
                color: '#D4A574',
                shadow: SHADOW,
                backgroundColor: '#3A2E28',
                padding: { x: 8, y: 4 }
            }
        ).setDepth(91);

        // Balls remaining - Graphics based
        this.ballsGfx = scene.add.graphics().setDepth(92);
        this.ballsBg = scene.add.graphics().setDepth(91);

        // Distance lines graphics (shown when balls stopped)
        this._distGfx = scene.add.graphics().setDepth(9);
        this._distLabels = [];
        for (let i = 0; i < 6; i++) {
            const label = scene.add.text(0, 0, '', {
                fontFamily: 'monospace', fontSize: '14px',
                color: '#F5E6D0',
                shadow: SHADOW
            }).setOrigin(0.5).setDepth(12).setVisible(false);
            this._distLabels.push(label);
        }

        this._prevPlayerRemaining = -1;
        this._prevOpponentRemaining = -1;
    }

    update() {
        const e = this.engine;
        this.playerScore.setText(String(e.scores.player));
        this.opponentScore.setText(String(e.scores.opponent));
        this.meneText.setText(`MENE ${e.mene}`);

        // Projected score
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

        // Balls remaining (colored dots)
        this._drawBallDots(e);

        // Distance lines (only when all stopped)
        this._updateDistanceLines(e);
    }

    _drawBallDots(e) {
        this.ballsGfx.clear();
        this.ballsBg.clear();

        const baseX = 16;
        const baseY = GAME_HEIGHT - 20;
        const dotR = 6;
        const spacing = 18;

        // Background
        const totalWidth = (e.ballsPerPlayer * spacing * 2) + 48;
        this.ballsBg.fillStyle(COLORS.OMBRE, 0.7);
        this.ballsBg.fillRoundedRect(baseX - 8, baseY - 16, totalWidth, 32, 6);

        // Player balls
        for (let i = 0; i < e.ballsPerPlayer; i++) {
            const remaining = i < e.remaining.player;
            this.ballsGfx.fillStyle(BALL_COLORS.player, remaining ? 1 : 0.25);
            this.ballsGfx.fillCircle(baseX + i * spacing, baseY, dotR);
            if (remaining) {
                this.ballsGfx.fillStyle(0xFFFFFF, 0.3);
                this.ballsGfx.fillCircle(baseX + i * spacing - 2, baseY - 2, 2);
            }
        }

        // Opponent balls
        const oBaseX = baseX + e.ballsPerPlayer * spacing + 24;
        for (let i = 0; i < e.ballsPerPlayer; i++) {
            const remaining = i < e.remaining.opponent;
            this.ballsGfx.fillStyle(BALL_COLORS.opponent, remaining ? 1 : 0.25);
            this.ballsGfx.fillCircle(oBaseX + i * spacing, baseY, dotR);
            if (remaining) {
                this.ballsGfx.fillStyle(0xFFFFFF, 0.3);
                this.ballsGfx.fillCircle(oBaseX + i * spacing - 2, baseY - 2, 2);
            }
        }

        // Flash animation on ball thrown
        if (e.remaining.player !== this._prevPlayerRemaining && this._prevPlayerRemaining >= 0) {
            this.ballsGfx.fillStyle(0xFFFFFF, 0.5);
            this.ballsGfx.fillCircle(baseX + e.remaining.player * spacing, baseY, dotR + 4);
        }
        if (e.remaining.opponent !== this._prevOpponentRemaining && this._prevOpponentRemaining >= 0) {
            this.ballsGfx.fillStyle(0xFFFFFF, 0.5);
            this.ballsGfx.fillCircle(oBaseX + e.remaining.opponent * spacing, baseY, dotR + 4);
        }
        this._prevPlayerRemaining = e.remaining.player;
        this._prevOpponentRemaining = e.remaining.opponent;
    }

    _updateDistanceLines(e) {
        this._distGfx.clear();

        // Only show when all balls stopped
        const anyMoving = e.balls.some(b => b.isAlive && b.isMoving) ||
            (e.cochonnet && e.cochonnet.isAlive && e.cochonnet.isMoving);
        if (anyMoving || !e.cochonnet || !e.cochonnet.isAlive) {
            for (const label of this._distLabels) label.setVisible(false);
            return;
        }

        let labelIdx = 0;
        for (const ball of e.balls) {
            if (!ball.isAlive || labelIdx >= this._distLabels.length) continue;
            const dist = ball.distanceTo(e.cochonnet);
            const color = ball.team === 'player' ? 0xA8B5C2 : 0xC44B3F;

            // Dashed line
            this._distGfx.lineStyle(1, color, 0.25);
            this._distGfx.beginPath();
            this._distGfx.moveTo(ball.x, ball.y);
            this._distGfx.lineTo(e.cochonnet.x, e.cochonnet.y);
            this._distGfx.strokePath();

            // Distance label at midpoint
            const mx = (ball.x + e.cochonnet.x) / 2;
            const my = (ball.y + e.cochonnet.y) / 2;
            const meters = (dist * PIXELS_TO_METERS).toFixed(1);
            const label = this._distLabels[labelIdx++];
            label.setPosition(mx, my - 8);
            label.setText(`${meters}m`);
            label.setColor(ball.team === 'player' ? '#A8B5C2' : '#C44B3F');
            label.setVisible(true);
        }
        // Hide unused labels
        for (let i = labelIdx; i < this._distLabels.length; i++) {
            this._distLabels[i].setVisible(false);
        }
    }

    destroy() {
        this.bg.destroy();
        this.titleText.destroy();
        this.playerLabel.destroy();
        this.playerScore.destroy();
        this.playerProjected.destroy();
        this.opponentLabel.destroy();
        this.opponentScore.destroy();
        this.opponentProjected.destroy();
        this.meneText.destroy();
        this.ballsGfx.destroy();
        this.ballsBg.destroy();
        this._distGfx.destroy();
        for (const label of this._distLabels) label.destroy();
    }
}
