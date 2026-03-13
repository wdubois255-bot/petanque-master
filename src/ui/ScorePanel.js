import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../utils/Constants.js';

export default class ScorePanel {
    constructor(scene, engine) {
        this.scene = scene;
        this.engine = engine;

        this.panelX = GAME_WIDTH - 60;
        this.panelY = 4;

        // Background
        this.bg = scene.add.graphics().setDepth(90);
        this.bg.fillStyle(COLORS.OMBRE, 0.8);
        this.bg.fillRoundedRect(this.panelX, this.panelY, 56, 70, 3);

        const textStyle = {
            fontFamily: 'monospace',
            fontSize: '7px',
            color: '#F5E6D0',
            align: 'center'
        };

        // Title
        this.titleText = scene.add.text(
            this.panelX + 28, this.panelY + 6,
            'SCORE', { ...textStyle, fontSize: '6px' }
        ).setOrigin(0.5, 0).setDepth(91);

        // Player score
        this.playerLabel = scene.add.text(
            this.panelX + 28, this.panelY + 16,
            'VOUS', { ...textStyle, fontSize: '5px', color: '#A8B5C2' }
        ).setOrigin(0.5, 0).setDepth(91);

        this.playerScore = scene.add.text(
            this.panelX + 28, this.panelY + 23,
            '0', { ...textStyle, fontSize: '10px' }
        ).setOrigin(0.5, 0).setDepth(91);

        // Opponent score
        this.opponentLabel = scene.add.text(
            this.panelX + 28, this.panelY + 36,
            'ADV.', { ...textStyle, fontSize: '5px', color: '#C44B3F' }
        ).setOrigin(0.5, 0).setDepth(91);

        this.opponentScore = scene.add.text(
            this.panelX + 28, this.panelY + 43,
            '0', { ...textStyle, fontSize: '10px' }
        ).setOrigin(0.5, 0).setDepth(91);

        // Mene
        this.meneText = scene.add.text(
            this.panelX + 28, this.panelY + 58,
            'MENE 1', { ...textStyle, fontSize: '5px' }
        ).setOrigin(0.5, 0).setDepth(91);

        // Balls remaining indicators
        this.ballsText = scene.add.text(
            4, GAME_HEIGHT - 12,
            '',
            { fontFamily: 'monospace', fontSize: '6px', color: '#F5E6D0' }
        ).setDepth(91);
    }

    update() {
        const e = this.engine;
        this.playerScore.setText(String(e.scores.player));
        this.opponentScore.setText(String(e.scores.opponent));
        this.meneText.setText(`MENE ${e.mene}`);

        // Balls remaining
        const pBalls = '●'.repeat(e.remaining.player) + '○'.repeat(e.ballsPerPlayer - e.remaining.player);
        const oBalls = '●'.repeat(e.remaining.opponent) + '○'.repeat(e.ballsPerPlayer - e.remaining.opponent);
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
