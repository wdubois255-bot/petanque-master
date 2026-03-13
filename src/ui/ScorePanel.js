import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../utils/Constants.js';

const SHADOW = { offsetX: 1, offsetY: 1, color: '#1A1510', blur: 0, fill: true };

export default class ScorePanel {
    constructor(scene, engine) {
        this.scene = scene;
        this.engine = engine;

        this.panelX = GAME_WIDTH - 72;
        this.panelY = 4;

        // Background
        this.bg = scene.add.graphics().setDepth(90);
        this.bg.fillStyle(COLORS.OMBRE, 0.85);
        this.bg.fillRoundedRect(this.panelX, this.panelY, 68, 78, 4);
        this.bg.lineStyle(1, 0xD4A574, 0.5);
        this.bg.strokeRoundedRect(this.panelX, this.panelY, 68, 78, 4);

        const cx = this.panelX + 34;

        // Title
        this.titleText = scene.add.text(
            cx, this.panelY + 8,
            'SCORE', {
                fontFamily: 'monospace', fontSize: '9px',
                color: '#D4A574', align: 'center',
                shadow: SHADOW
            }
        ).setOrigin(0.5, 0).setDepth(91);

        // Separator
        this.bg.lineStyle(1, 0xD4A574, 0.3);
        this.bg.beginPath();
        this.bg.moveTo(this.panelX + 8, this.panelY + 20);
        this.bg.lineTo(this.panelX + 60, this.panelY + 20);
        this.bg.strokePath();

        // Player score
        this.playerLabel = scene.add.text(
            cx, this.panelY + 24,
            'VOUS', {
                fontFamily: 'monospace', fontSize: '8px',
                color: '#A8B5C2', align: 'center',
                shadow: SHADOW
            }
        ).setOrigin(0.5, 0).setDepth(91);

        this.playerScore = scene.add.text(
            cx, this.panelY + 34,
            '0', {
                fontFamily: 'monospace', fontSize: '14px',
                color: '#F5E6D0', align: 'center',
                shadow: SHADOW
            }
        ).setOrigin(0.5, 0).setDepth(91);

        // Opponent score
        this.opponentLabel = scene.add.text(
            cx, this.panelY + 48,
            'ADV.', {
                fontFamily: 'monospace', fontSize: '8px',
                color: '#C44B3F', align: 'center',
                shadow: SHADOW
            }
        ).setOrigin(0.5, 0).setDepth(91);

        this.opponentScore = scene.add.text(
            cx, this.panelY + 58,
            '0', {
                fontFamily: 'monospace', fontSize: '14px',
                color: '#F5E6D0', align: 'center',
                shadow: SHADOW
            }
        ).setOrigin(0.5, 0).setDepth(91);

        // Mene
        this.meneText = scene.add.text(
            4, 4,
            'MENE 1', {
                fontFamily: 'monospace', fontSize: '9px',
                color: '#D4A574',
                shadow: SHADOW,
                backgroundColor: '#3A2E28',
                padding: { x: 4, y: 2 }
            }
        ).setDepth(91);

        // Balls remaining indicators
        this.ballsText = scene.add.text(
            4, GAME_HEIGHT - 16,
            '',
            {
                fontFamily: 'monospace', fontSize: '9px',
                color: '#F5E6D0',
                shadow: SHADOW,
                backgroundColor: '#3A2E28',
                padding: { x: 4, y: 2 }
            }
        ).setDepth(91);
    }

    update() {
        const e = this.engine;
        this.playerScore.setText(String(e.scores.player));
        this.opponentScore.setText(String(e.scores.opponent));
        this.meneText.setText(`MENE ${e.mene}`);

        // Balls remaining
        const pBalls = '\u25cf'.repeat(e.remaining.player) + '\u25cb'.repeat(e.ballsPerPlayer - e.remaining.player);
        const oBalls = '\u25cf'.repeat(e.remaining.opponent) + '\u25cb'.repeat(e.ballsPerPlayer - e.remaining.opponent);
        this.ballsText.setText(`Vous: ${pBalls}  Adv: ${oBalls}`);
    }

    destroy() {
        this.bg.destroy();
        this.titleText.destroy();
        this.playerLabel.destroy();
        this.playerScore.destroy();
        this.opponentLabel.destroy();
        this.opponentScore.destroy();
        this.meneText.destroy();
        this.ballsText.destroy();
    }
}
