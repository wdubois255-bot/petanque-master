import { GAME_WIDTH, GAME_HEIGHT, COLORS, BALL_COLORS } from '../utils/Constants.js';

const SHADOW = { offsetX: 2, offsetY: 2, color: '#1A1510', blur: 0, fill: true };

export default class ScorePanel {
    constructor(scene, engine) {
        this.scene = scene;
        this.engine = engine;
        this._showRanking = false; // Toggle: show ball rankings on terrain

        this.panelX = GAME_WIDTH - 152;
        this.panelY = 8;
        const pw = 144;
        const ph = 164;

        // Background
        this.bg = scene.add.graphics().setDepth(90);
        this.bg.fillStyle(0xD4A574, 0.12);
        this.bg.fillRoundedRect(this.panelX - 2, this.panelY - 2, pw + 4, ph + 4, 10);
        this.bg.fillStyle(COLORS.OMBRE, 0.9);
        this.bg.fillRoundedRect(this.panelX, this.panelY, pw, ph, 8);
        this.bg.lineStyle(2, COLORS.OCRE, 0.6);
        this.bg.strokeRoundedRect(this.panelX, this.panelY, pw, ph, 8);

        const cx = this.panelX + pw / 2;

        // Title
        this.titleText = scene.add.text(cx, this.panelY + 14, 'SCORE', {
            fontFamily: 'monospace', fontSize: '16px', color: '#D4A574', align: 'center', shadow: SHADOW
        }).setOrigin(0.5, 0).setDepth(91);

        // Separator
        this.bg.lineStyle(1, COLORS.OCRE, 0.4);
        this.bg.beginPath();
        this.bg.moveTo(this.panelX + 12, this.panelY + 36);
        this.bg.lineTo(this.panelX + pw - 12, this.panelY + 36);
        this.bg.strokePath();

        // Player section
        this.playerLabel = scene.add.text(cx - 24, this.panelY + 44, 'VOUS', {
            fontFamily: 'monospace', fontSize: '12px', color: '#87CEEB', align: 'center', shadow: SHADOW
        }).setOrigin(0.5, 0).setDepth(91);

        this.playerScore = scene.add.text(cx - 24, this.panelY + 60, '0', {
            fontFamily: 'monospace', fontSize: '32px', color: '#F5E6D0', align: 'center', shadow: SHADOW
        }).setOrigin(0.5, 0).setDepth(91);

        this.playerProjected = scene.add.text(cx + 16, this.panelY + 66, '', {
            fontFamily: 'monospace', fontSize: '14px', color: '#6B8E4E', shadow: SHADOW
        }).setOrigin(0, 0).setDepth(91);

        // VS divider
        this.bg.lineStyle(1, COLORS.OCRE, 0.2);
        this.bg.beginPath();
        this.bg.moveTo(this.panelX + 12, this.panelY + 96);
        this.bg.lineTo(this.panelX + pw - 12, this.panelY + 96);
        this.bg.strokePath();

        // Opponent section
        this.opponentLabel = scene.add.text(cx - 24, this.panelY + 102, 'ADV.', {
            fontFamily: 'monospace', fontSize: '12px', color: '#C44B3F', align: 'center', shadow: SHADOW
        }).setOrigin(0.5, 0).setDepth(91);

        this.opponentScore = scene.add.text(cx - 24, this.panelY + 118, '0', {
            fontFamily: 'monospace', fontSize: '32px', color: '#F5E6D0', align: 'center', shadow: SHADOW
        }).setOrigin(0.5, 0).setDepth(91);

        this.opponentProjected = scene.add.text(cx + 16, this.panelY + 124, '', {
            fontFamily: 'monospace', fontSize: '14px', color: '#C44B3F', shadow: SHADOW
        }).setOrigin(0, 0).setDepth(91);

        // Mene
        this.meneText = scene.add.text(8, 8, 'MENE 1', {
            fontFamily: 'monospace', fontSize: '16px', color: '#D4A574', shadow: SHADOW,
            backgroundColor: '#3A2E28', padding: { x: 10, y: 5 }
        }).setDepth(91);

        // Balls remaining
        this.ballsGfx = scene.add.graphics().setDepth(92);
        this.ballsBg = scene.add.graphics().setDepth(91);

        // Ranking overlay (hidden by default, toggled with TAB)
        this._rankGfx = scene.add.graphics().setDepth(50);
        this._rankLabels = [];
        // Up to 6 labels (3 balls per player)
        for (let i = 0; i < 6; i++) {
            const label = scene.add.text(0, 0, '', {
                fontFamily: 'monospace', fontSize: '11px', color: '#F5E6D0',
                shadow: SHADOW, backgroundColor: '#3A2E28', padding: { x: 3, y: 1 }
            }).setOrigin(0.5).setDepth(51).setVisible(false);
            this._rankLabels.push(label);
        }

        // Ranking hint (small text)
        this._rankHint = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 6, '[TAB] Classement', {
            fontFamily: 'monospace', fontSize: '9px', color: '#9E9E8E', align: 'center'
        }).setOrigin(0.5, 1).setDepth(90).setAlpha(0.5);

        // Toggle ranking with TAB key
        this._tabKey = scene.input.keyboard.addKey('TAB');

        this._prevPlayerRemaining = -1;
        this._prevOpponentRemaining = -1;
        this._prevPlayerScore = 0;
        this._prevOpponentScore = 0;
    }

    update() {
        const e = this.engine;

        // Score with pulse animation on change
        const newPlayerScore = e.scores.player;
        const newOpponentScore = e.scores.opponent;
        if (newPlayerScore !== this._prevPlayerScore) {
            this.playerScore.setText(String(newPlayerScore));
            this._pulseText(this.playerScore);
            this._prevPlayerScore = newPlayerScore;
        }
        if (newOpponentScore !== this._prevOpponentScore) {
            this.opponentScore.setText(String(newOpponentScore));
            this._pulseText(this.opponentScore);
            this._prevOpponentScore = newOpponentScore;
        }

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

        this._drawBallDots(e);

        // Toggle ranking display with TAB (hold or press)
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

    _drawBallDots(e) {
        this.ballsGfx.clear();
        this.ballsBg.clear();

        const baseX = 16;
        const baseY = GAME_HEIGHT - 22;
        const dotR = 7;
        const spacing = 20;

        const totalWidth = (e.ballsPerPlayer * spacing * 2) + 52;
        this.ballsBg.fillStyle(COLORS.OMBRE, 0.8);
        this.ballsBg.fillRoundedRect(baseX - 10, baseY - 18, totalWidth, 36, 8);
        this.ballsBg.lineStyle(1, COLORS.OCRE, 0.3);
        this.ballsBg.strokeRoundedRect(baseX - 10, baseY - 18, totalWidth, 36, 8);

        for (let i = 0; i < e.ballsPerPlayer; i++) {
            const remaining = i < e.remaining.player;
            const x = baseX + i * spacing;
            this.ballsGfx.fillStyle(0x000000, 0.15);
            this.ballsGfx.fillEllipse(x + 1, baseY + 3, dotR * 1.6, dotR * 0.8);
            this.ballsGfx.fillStyle(BALL_COLORS.player, remaining ? 1 : 0.2);
            this.ballsGfx.fillCircle(x, baseY, dotR);
            if (remaining) {
                this.ballsGfx.fillStyle(0xFFFFFF, 0.35);
                this.ballsGfx.fillCircle(x - 2, baseY - 2, 2.5);
            }
        }

        const sepX = baseX + e.ballsPerPlayer * spacing + 10;
        this.ballsGfx.fillStyle(COLORS.OCRE, 0.4);
        this.ballsGfx.fillRect(sepX, baseY - 8, 2, 16);

        const oBaseX = sepX + 14;
        for (let i = 0; i < e.ballsPerPlayer; i++) {
            const remaining = i < e.remaining.opponent;
            const x = oBaseX + i * spacing;
            this.ballsGfx.fillStyle(0x000000, 0.15);
            this.ballsGfx.fillEllipse(x + 1, baseY + 3, dotR * 1.6, dotR * 0.8);
            this.ballsGfx.fillStyle(BALL_COLORS.opponent, remaining ? 1 : 0.2);
            this.ballsGfx.fillCircle(x, baseY, dotR);
            if (remaining) {
                this.ballsGfx.fillStyle(0xFFFFFF, 0.35);
                this.ballsGfx.fillCircle(x - 2, baseY - 2, 2.5);
            }
        }

        this._prevPlayerRemaining = e.remaining.player;
        this._prevOpponentRemaining = e.remaining.opponent;
    }

    /**
     * Ranking overlay — only shown when TAB is held.
     * Ranks ALL alive balls by distance to cochonnet: 1st, 2nd, 3rd...
     * Uses team color and a small badge next to each ball.
     */
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

        // Draw ranking for ALL balls
        for (let i = 0; i < sorted.length && i < this._rankLabels.length; i++) {
            const { ball, dist } = sorted[i];
            const isPlayer = ball.team === 'player';
            const color = isPlayer ? 0x87CEEB : 0xC44B3F;
            const colorHex = isPlayer ? '#87CEEB' : '#C44B3F';

            // Rank badge next to ball
            const label = this._rankLabels[i];
            label.setPosition(ball.x + ball.radius + 8, ball.y - 6);
            label.setText(`${i + 1}`);
            label.setColor(colorHex);
            label.setAlpha(0.9);
            label.setVisible(true);

            // Dotted line from ball to cochonnet
            this._rankGfx.lineStyle(1, color, 0.2);
            this._rankGfx.beginPath();
            this._rankGfx.moveTo(ball.x, ball.y);
            this._rankGfx.lineTo(e.cochonnet.x, e.cochonnet.y);
            this._rankGfx.strokePath();

            // Small circle around cochonnet showing scoring zone
            if (i === 0) {
                this._rankGfx.lineStyle(1, color, 0.3);
                this._rankGfx.strokeCircle(e.cochonnet.x, e.cochonnet.y, dist);
            }
        }

        // Hide unused labels
        for (let i = sorted.length; i < this._rankLabels.length; i++) {
            this._rankLabels[i].setVisible(false);
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
        this._rankGfx.destroy();
        this._rankHint.destroy();
        for (const label of this._rankLabels) label.destroy();
    }
}
