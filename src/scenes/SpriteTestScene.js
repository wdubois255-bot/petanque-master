import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../utils/Constants.js';
import { fadeToScene } from '../utils/SceneTransition.js';

/**
 * Prototype: modular sprite animation for pétanque throwing.
 * Left side: continuous rotation (tween-based arm)
 * Right side: keyframe positions (4 preset arm angles)
 * Both cycle through: idle → wind-up → throw → celebrate
 */
export default class SpriteTestScene extends Phaser.Scene {
    constructor() {
        super('SpriteTestScene');
    }

    init() {
        // Reset all flags for scene reuse (CLAUDE.md rule)
        this._cycling = false;
        this.continuousChar = null;
        this.keyframeChar = null;
        this.phaseLabel = null;
    }

    create() {
        this.cameras.main.setBackgroundColor('#87CEEB');

        // Ground
        const ground = this.add.graphics();
        ground.fillStyle(0xC4854A, 1);
        ground.fillRect(0, GAME_HEIGHT * 0.65, GAME_WIDTH, GAME_HEIGHT * 0.35);
        ground.fillStyle(0x8B7D5A, 1);
        ground.fillRect(0, GAME_HEIGHT * 0.63, GAME_WIDTH, GAME_HEIGHT * 0.04);

        // Title
        const shadow = { offsetX: 2, offsetY: 2, color: '#1A1510', blur: 0, fill: true };
        this.add.text(GAME_WIDTH / 2, 30, 'PROTOTYPE: Animation Modulaire', {
            fontFamily: 'monospace', fontSize: '20px', color: '#F5E6D0', shadow
        }).setOrigin(0.5);

        // Labels
        this.add.text(GAME_WIDTH * 0.25, 60, 'ROTATION CONTINUE', {
            fontFamily: 'monospace', fontSize: '14px', color: '#FFD700', shadow
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH * 0.75, 60, 'POSITIONS-CLES', {
            fontFamily: 'monospace', fontSize: '14px', color: '#FFD700', shadow
        }).setOrigin(0.5);

        // Create character textures
        this._createBodyTexture('body_papet', {
            hat: '#4A5A8A', hair: '#8B7060', skin: '#E8C49A',
            shirt: '#8B6BAA', pants: '#6B5038', shoes: '#4A3828'
        });
        this._createArmTexture('arm_papet', '#8B6BAA', '#E8C49A');
        this._createBallTexture('boule_test');

        // === LEFT: Continuous rotation ===
        this._createModularCharacter(
            GAME_WIDTH * 0.25, GAME_HEIGHT * 0.6,
            'continuous', 'body_papet', 'arm_papet'
        );

        // === RIGHT: Keyframe positions ===
        this._createModularCharacter(
            GAME_WIDTH * 0.75, GAME_HEIGHT * 0.6,
            'keyframe', 'body_papet', 'arm_papet'
        );

        // Phase labels (update dynamically)
        this.phaseLabel = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 30, 'Phase: IDLE', {
            fontFamily: 'monospace', fontSize: '16px', color: '#F5E6D0', shadow
        }).setOrigin(0.5);

        // Controls
        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 12, 'ESPACE = lancer le cycle | R = recommencer', {
            fontFamily: 'monospace', fontSize: '11px', color: '#A8B5C2'
        }).setOrigin(0.5);

        // Separator line
        const sep = this.add.graphics();
        sep.lineStyle(2, 0xFFFFFF, 0.3);
        sep.lineBetween(GAME_WIDTH / 2, 80, GAME_WIDTH / 2, GAME_HEIGHT - 50);

        // Input
        this.input.keyboard.on('keydown-SPACE', () => this._startThrowCycle());
        this.input.keyboard.on('keydown-R', () => this.scene.restart());
        this.input.keyboard.on('keydown-ESCAPE', () => fadeToScene(this, 'TitleScene'));

        // Auto-start first cycle after 1s
        this.time.delayedCall(1000, () => this._startThrowCycle());

        // Cleanup on shutdown (prevents listener leaks on scene reuse)
        this.events.on('shutdown', () => {
            this.input.keyboard.removeAllListeners();
            this.tweens.killAll();
        });
    }

    _createBodyTexture(key, colors) {
        const size = 64;
        const tex = this.textures.createCanvas(key, size, size);
        const ctx = tex.getContext();

        // Shoes
        ctx.fillStyle = colors.shoes;
        ctx.fillRect(20, 56, 10, 6);
        ctx.fillRect(34, 56, 10, 6);

        // Legs/pants
        ctx.fillStyle = colors.pants;
        ctx.fillRect(22, 42, 8, 16);
        ctx.fillRect(34, 42, 8, 16);

        // Body/shirt (no right arm area — arm is separate)
        ctx.fillStyle = colors.shirt;
        ctx.fillRect(18, 28, 28, 16);

        // Left arm (static, hangs down)
        ctx.fillRect(14, 30, 6, 14);
        ctx.fillStyle = colors.skin;
        ctx.fillRect(14, 42, 6, 4); // left hand

        // Neck
        ctx.fillStyle = colors.skin;
        ctx.fillRect(28, 24, 8, 6);

        // Head
        ctx.fillStyle = colors.skin;
        ctx.fillRect(22, 8, 20, 18);

        // Eyes
        ctx.fillStyle = '#3A2E28';
        ctx.fillRect(26, 14, 3, 3);
        ctx.fillRect(35, 14, 3, 3);

        // Mouth
        ctx.fillRect(30, 20, 4, 2);

        // Hair
        ctx.fillStyle = colors.hair;
        ctx.fillRect(22, 6, 20, 6);
        ctx.fillRect(20, 8, 4, 8);

        // Hat/beret
        ctx.fillStyle = colors.hat;
        ctx.fillRect(20, 2, 24, 8);
        ctx.fillRect(18, 6, 28, 4);

        tex.refresh();
    }

    _createArmTexture(key, shirtColor, skinColor) {
        // Arm: drawn with pivot at top (shoulder)
        // Total arm length ~20px, shoulder at top
        const w = 12;
        const h = 24;
        const tex = this.textures.createCanvas(key, w, h);
        const ctx = tex.getContext();

        // Upper arm (shirt color)
        ctx.fillStyle = shirtColor;
        ctx.fillRect(2, 0, 8, 10);

        // Forearm (skin)
        ctx.fillStyle = skinColor;
        ctx.fillRect(2, 10, 8, 10);

        // Hand (slightly wider)
        ctx.fillRect(1, 18, 10, 5);

        tex.refresh();
    }

    _createBallTexture(key) {
        const tex = this.textures.createCanvas(key, 16, 16);
        const ctx = tex.getContext();
        const grad = ctx.createRadialGradient(6, 5, 1, 8, 8, 7);
        grad.addColorStop(0, '#E0E8F0');
        grad.addColorStop(0.4, '#A8B5C2');
        grad.addColorStop(1, '#606870');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(8, 8, 7, 0, Math.PI * 2);
        ctx.fill();
        // Highlight
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.beginPath();
        ctx.arc(5, 5, 2, 0, Math.PI * 2);
        ctx.fill();
        tex.refresh();
    }

    _createModularCharacter(x, y, mode, bodyKey, armKey) {
        const scale = 2;

        // Body sprite
        const body = this.add.image(x, y, bodyKey)
            .setOrigin(0.5, 1)
            .setScale(scale);

        // Right arm — pivot at shoulder position
        // Shoulder is at roughly (44, 30) in the 64x64 texture
        // Relative to body origin (0.5, 1): shoulder is at (12, -34) from center-bottom
        const shoulderOffsetX = 12 * scale;
        const shoulderOffsetY = -34 * scale;

        const arm = this.add.image(
            x + shoulderOffsetX,
            y + shoulderOffsetY,
            armKey
        ).setOrigin(0.5, 0) // pivot at top of arm (shoulder)
         .setScale(scale);

        // Ball attached to hand (end of arm)
        const ball = this.add.image(x, y, 'boule_test')
            .setScale(scale * 0.7)
            .setVisible(true);

        // Store references
        const charData = { body, arm, ball, x, y, shoulderOffsetX, shoulderOffsetY, mode, scale };

        if (mode === 'continuous') {
            this.continuousChar = charData;
        } else {
            this.keyframeChar = charData;
        }

        // Initial arm position (hanging down, 0 degrees)
        arm.setAngle(0);
        this._updateBallPosition(charData);
    }

    _updateBallPosition(charData) {
        const { arm, ball, scale } = charData;
        // Ball at the end of the arm (hand position)
        const armLength = 22 * scale;
        const angle = Phaser.Math.DegToRad(arm.angle);
        ball.x = arm.x + Math.sin(angle) * armLength;
        ball.y = arm.y + Math.cos(angle) * armLength;
    }

    _startThrowCycle() {
        if (this._cycling) return;
        this._cycling = true;

        // Run both animations in parallel
        this._runContinuousCycle(this.continuousChar);
        this._runKeyframeCycle(this.keyframeChar);
    }

    _runContinuousCycle(c) {
        const arm = c.arm;
        const ball = c.ball;

        // Phase 1: Wind-up (arm goes back smoothly)
        this.phaseLabel.setText('Phase: PREPARATION');
        this.tweens.add({
            targets: arm,
            angle: -120, // arm back behind
            duration: 800,
            ease: 'Sine.easeInOut',
            onUpdate: () => this._updateBallPosition(c),
            onComplete: () => {
                // Phase 2: Hold/gauge (oscillation)
                this.phaseLabel.setText('Phase: JAUGE PUISSANCE');
                const gauge = this.tweens.add({
                    targets: arm,
                    angle: -135,
                    duration: 300,
                    yoyo: true,
                    repeat: 3,
                    ease: 'Sine.easeInOut',
                    onUpdate: () => this._updateBallPosition(c),
                    onComplete: () => {
                        // Phase 3: Throw! (fast forward swing)
                        this.phaseLabel.setText('Phase: LANCER !');
                        this.tweens.add({
                            targets: arm,
                            angle: 45, // arm forward/down
                            duration: 150,
                            ease: 'Quad.easeIn',
                            onUpdate: () => this._updateBallPosition(c),
                            onComplete: () => {
                                // Release ball — fly forward
                                ball.setVisible(true);
                                this.tweens.add({
                                    targets: ball,
                                    x: ball.x,
                                    y: ball.y - 200,
                                    scale: 0.5,
                                    duration: 600,
                                    ease: 'Quad.easeOut'
                                });

                                // Phase 4: Follow-through + return
                                this.tweens.add({
                                    targets: arm,
                                    angle: 60,
                                    duration: 200,
                                    ease: 'Sine.easeOut',
                                    onComplete: () => {
                                        this.phaseLabel.setText('Phase: SUIVI');
                                        // Celebrate (body bounce)
                                        this.tweens.add({
                                            targets: c.body,
                                            y: c.y - 10,
                                            duration: 200,
                                            yoyo: true,
                                            ease: 'Bounce.easeOut'
                                        });

                                        // Return arm to idle
                                        this.time.delayedCall(800, () => {
                                            this.tweens.add({
                                                targets: arm,
                                                angle: 0,
                                                duration: 400,
                                                ease: 'Sine.easeInOut',
                                                onUpdate: () => this._updateBallPosition(c),
                                                onComplete: () => {
                                                    // Reset ball
                                                    ball.setScale(c.scale * 0.7);
                                                    this._updateBallPosition(c);
                                                    ball.setVisible(true);
                                                    this.phaseLabel.setText('Phase: IDLE');
                                                    this._cycling = false;
                                                }
                                            });
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    }

    _runKeyframeCycle(c) {
        const arm = c.arm;
        const ball = c.ball;

        // Keyframe positions (discrete, no smooth rotation)
        const POSES = {
            idle: 0,
            windUp1: -60,
            windUp2: -100,
            ready: -130,
            throw1: -40,
            throw2: 30,
            followThrough: 55,
        };

        const setKeyframe = (pose, duration, onDone) => {
            // Instant snap to angle (keyframe style — very short tween for pixel art feel)
            this.tweens.add({
                targets: arm,
                angle: POSES[pose],
                duration: duration || 80, // very short = snappy
                ease: 'Stepped',
                onUpdate: () => this._updateBallPosition(c),
                onComplete: onDone
            });
        };

        // Phase 1: Wind-up (3 keyframes)
        setKeyframe('windUp1', 200, () => {
            setKeyframe('windUp2', 200, () => {
                setKeyframe('ready', 200, () => {
                    // Phase 2: Hold (toggle between ready and windUp2)
                    let count = 0;
                    const gaugeEvent = this.time.addEvent({
                        delay: 250,
                        repeat: 5,
                        callback: () => {
                            count++;
                            const pose = count % 2 === 0 ? 'ready' : 'windUp2';
                            this.tweens.add({
                                targets: arm,
                                angle: POSES[pose],
                                duration: 60,
                                ease: 'Stepped',
                                onUpdate: () => this._updateBallPosition(c)
                            });
                        }
                    });

                    // After gauge
                    this.time.delayedCall(1600, () => {
                        // Phase 3: Throw (fast keyframes)
                        setKeyframe('throw1', 50, () => {
                            setKeyframe('throw2', 50, () => {
                                // Release ball
                                ball.setVisible(true);
                                this.tweens.add({
                                    targets: ball,
                                    x: ball.x,
                                    y: ball.y - 200,
                                    scale: 0.5,
                                    duration: 600,
                                    ease: 'Quad.easeOut'
                                });

                                setKeyframe('followThrough', 100, () => {
                                    // Celebrate
                                    this.tweens.add({
                                        targets: c.body,
                                        y: c.y - 10,
                                        duration: 200,
                                        yoyo: true,
                                        ease: 'Bounce.easeOut'
                                    });

                                    // Return to idle
                                    this.time.delayedCall(800, () => {
                                        setKeyframe('idle', 150, () => {
                                            ball.setScale(c.scale * 0.7);
                                            this._updateBallPosition(c);
                                            ball.setVisible(true);
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    }
}
