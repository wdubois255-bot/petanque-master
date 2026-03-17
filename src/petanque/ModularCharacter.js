import Phaser from 'phaser';

/**
 * Modular character for pétanque scene.
 * Composite sprite: body (profile view) + throwing arm (separate, rotates at shoulder) + ball in hand.
 * All animations use tweens for fluid, continuous rotation.
 */
export default class ModularCharacter {
    /**
     * @param {Phaser.Scene} scene
     * @param {number} x - Base position X
     * @param {number} y - Base position Y (feet)
     * @param {object} config
     * @param {string} config.bodyKey - Texture key for body (profile, no throwing arm)
     * @param {string} config.armKey - Texture key for arm sprite
     * @param {string} config.ballKey - Texture key for boule
     * @param {object} config.shoulder - { x, y } offset from body origin to shoulder pivot
     * @param {number} config.armLength - Pixel length of arm (for ball placement)
     * @param {number} [config.scale=2] - Display scale
     * @param {boolean} [config.flipX=false] - Mirror horizontally (for opponent facing left)
     */
    constructor(scene, x, y, config) {
        this.scene = scene;
        this.baseX = x;
        this.baseY = y;
        this.config = config;
        this.scale = config.scale || 2;
        this.flipX = config.flipX || false;
        this.armAngle = 0;
        this._destroyed = false;

        // Body sprite (profile view, no throwing arm)
        this.body = scene.add.image(x, y, config.bodyKey)
            .setOrigin(0.5, 1)
            .setScale(this.flipX ? -this.scale : this.scale, this.scale)
            .setDepth(20);

        // Shoulder position in world coords
        const sx = config.shoulder.x * this.scale * (this.flipX ? -1 : 1);
        const sy = config.shoulder.y * this.scale;
        this.shoulderX = x + sx;
        this.shoulderY = y + sy;

        // Arm sprite (pivot at shoulder = top of sprite)
        this.arm = scene.add.image(this.shoulderX, this.shoulderY, config.armKey)
            .setOrigin(0.5, 0)
            .setScale(this.flipX ? -this.scale : this.scale, this.scale)
            .setDepth(19);

        this.armLength = (config.armLength || 20) * this.scale;

        // Ball in hand
        this.ball = scene.add.image(0, 0, config.ballKey)
            .setScale(this.scale * 0.6)
            .setDepth(21);

        this.hasBall = true;
        this._updateBallPos();

        // Idle breathing tween
        this._startIdle();
    }

    // === POSITION ===

    setPosition(x, y) {
        const dx = x - this.baseX;
        const dy = y - this.baseY;
        this.baseX = x;
        this.baseY = y;
        this.body.setPosition(x, y);
        this.shoulderX += dx;
        this.shoulderY += dy;
        this.arm.setPosition(this.shoulderX, this.shoulderY);
        this._updateBallPos();
    }

    moveTo(x, y, duration = 500, onComplete) {
        // Animate walking to position
        const dx = x - this.baseX;
        const dy = y - this.baseY;

        this.scene.tweens.add({
            targets: this.body,
            x, y,
            duration,
            ease: 'Sine.easeInOut',
            onUpdate: () => {
                this.baseX = this.body.x;
                this.baseY = this.body.y;
                const sx = this.config.shoulder.x * this.scale * (this.flipX ? -1 : 1);
                const sy = this.config.shoulder.y * this.scale;
                this.shoulderX = this.baseX + sx;
                this.shoulderY = this.baseY + sy;
                this.arm.setPosition(this.shoulderX, this.shoulderY);
                this._updateBallPos();
            },
            onComplete: () => {
                if (onComplete) onComplete();
            }
        });

        // Walking bob
        this.scene.tweens.add({
            targets: [this.body, this.arm],
            y: `-=3`,
            duration: duration / 4,
            yoyo: true,
            repeat: 1,
            ease: 'Sine.easeInOut'
        });
    }

    _updateBallPos() {
        if (!this.hasBall || !this.ball.visible) return;
        const rad = Phaser.Math.DegToRad(this.armAngle);
        const dir = this.flipX ? -1 : 1;
        this.ball.x = this.shoulderX + Math.sin(rad) * this.armLength * dir;
        this.ball.y = this.shoulderY + Math.cos(rad) * this.armLength;
    }

    setArmAngle(angle) {
        this.armAngle = angle;
        this.arm.setAngle(this.flipX ? -angle : angle);
        this._updateBallPos();
    }

    // === ANIMATIONS ===

    _startIdle() {
        this._stopIdle();
        // Subtle breathing
        this._idleTween = this.scene.tweens.add({
            targets: this.body,
            scaleY: this.scale * 1.01,
            duration: 1200,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        // Arm slight sway
        this._idleArmTween = this.scene.tweens.add({
            targets: { angle: 0 },
            angle: 5,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
            onUpdate: (tween, target) => {
                if (!this._throwing) {
                    this.setArmAngle(target.angle);
                }
            }
        });
    }

    _stopIdle() {
        if (this._idleTween) { this._idleTween.stop(); this._idleTween = null; }
        if (this._idleArmTween) { this._idleArmTween.stop(); this._idleArmTween = null; }
    }

    /**
     * Full throw animation cycle:
     * 1. Wind-up (arm goes back)
     * 2. Power gauge hold (arm oscillates)
     * 3. Throw (arm swings forward, ball released)
     * 4. Follow-through
     * @param {number} power - 0 to 1, affects speed/intensity
     * @param {function} onRelease - Called when ball is released (with ball world position)
     * @param {function} onComplete - Called when full animation done
     */
    playThrow(power = 0.7, onRelease, onComplete) {
        this._stopIdle();
        this._throwing = true;
        this.hasBall = true;
        this.ball.setVisible(true);
        this.ball.setAlpha(1);
        this.ball.setScale(this.scale * 0.6);

        const gaugeHoldTime = 400 + power * 400; // longer hold for more power
        const throwSpeed = 100 + (1 - power) * 100; // faster throw at high power

        // Phase 1: Wind-up
        this.scene.tweens.add({
            targets: { angle: this.armAngle },
            angle: -120,
            duration: 500,
            ease: 'Sine.easeInOut',
            onUpdate: (tw, t) => this.setArmAngle(t.angle),
            onComplete: () => {
                // Phase 2: Power gauge oscillation
                let gaugeCount = 0;
                const maxGauge = Math.floor(gaugeHoldTime / 200);
                const gaugeObj = { angle: -120 };

                this._gaugeTween = this.scene.tweens.add({
                    targets: gaugeObj,
                    angle: -135,
                    duration: 200,
                    yoyo: true,
                    repeat: maxGauge,
                    ease: 'Sine.easeInOut',
                    onUpdate: () => this.setArmAngle(gaugeObj.angle),
                    onComplete: () => {
                        // Phase 3: THROW
                        const throwObj = { angle: gaugeObj.angle };
                        this.scene.tweens.add({
                            targets: throwObj,
                            angle: 50 + power * 20,
                            duration: throwSpeed,
                            ease: 'Quad.easeIn',
                            onUpdate: () => this.setArmAngle(throwObj.angle),
                            onComplete: () => {
                                // Release ball
                                const ballX = this.ball.x;
                                const ballY = this.ball.y;
                                this.hasBall = false;
                                this.ball.setVisible(false);
                                if (onRelease) onRelease(ballX, ballY);

                                // Phase 4: Follow-through
                                const followObj = { angle: throwObj.angle };
                                this.scene.tweens.add({
                                    targets: followObj,
                                    angle: 65,
                                    duration: 150,
                                    ease: 'Sine.easeOut',
                                    onUpdate: () => this.setArmAngle(followObj.angle),
                                    onComplete: () => {
                                        // Return arm to rest
                                        this.scene.time.delayedCall(400, () => {
                                            const returnObj = { angle: followObj.angle };
                                            this.scene.tweens.add({
                                                targets: returnObj,
                                                angle: 0,
                                                duration: 400,
                                                ease: 'Sine.easeInOut',
                                                onUpdate: () => this.setArmAngle(returnObj.angle),
                                                onComplete: () => {
                                                    this._throwing = false;
                                                    this._startIdle();
                                                    if (onComplete) onComplete();
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

    /** Quick throw without gauge (for AI) */
    playQuickThrow(power = 0.7, onRelease, onComplete) {
        this._stopIdle();
        this._throwing = true;
        this.hasBall = true;
        this.ball.setVisible(true);

        // Fast wind-up + throw
        this.scene.tweens.add({
            targets: { angle: this.armAngle },
            angle: -110,
            duration: 300,
            ease: 'Sine.easeInOut',
            onUpdate: (tw, t) => this.setArmAngle(t.angle),
            onComplete: () => {
                this.scene.tweens.add({
                    targets: { angle: -110 },
                    angle: 55,
                    duration: 120,
                    ease: 'Quad.easeIn',
                    onUpdate: (tw, t) => this.setArmAngle(t.angle),
                    onComplete: () => {
                        const ballX = this.ball.x;
                        const ballY = this.ball.y;
                        this.hasBall = false;
                        this.ball.setVisible(false);
                        if (onRelease) onRelease(ballX, ballY);

                        const followObj = { angle: 55 };
                        this.scene.tweens.add({
                            targets: followObj,
                            angle: 0,
                            duration: 500,
                            ease: 'Sine.easeInOut',
                            onUpdate: () => this.setArmAngle(followObj.angle),
                            onComplete: () => {
                                this._throwing = false;
                                this._startIdle();
                                if (onComplete) onComplete();
                            }
                        });
                    }
                });
            }
        });
    }

    /** Celebration: jump + fist pump */
    playCelebrate() {
        this._stopIdle();

        // Jump
        this.scene.tweens.add({
            targets: this.body,
            y: this.baseY - 16,
            duration: 250,
            yoyo: true,
            ease: 'Quad.easeOut',
            onUpdate: () => {
                const sx = this.config.shoulder.x * this.scale * (this.flipX ? -1 : 1);
                const sy = this.config.shoulder.y * this.scale;
                this.shoulderY = this.body.y + sy;
                this.arm.y = this.shoulderY;
                this._updateBallPos();
            },
            onComplete: () => {
                // Second smaller jump
                this.scene.tweens.add({
                    targets: this.body,
                    y: this.baseY - 8,
                    duration: 200,
                    yoyo: true,
                    ease: 'Quad.easeOut',
                    onUpdate: () => {
                        this.shoulderY = this.body.y + this.config.shoulder.y * this.scale;
                        this.arm.y = this.shoulderY;
                    },
                    onComplete: () => {
                        this.body.y = this.baseY;
                        this.shoulderY = this.baseY + this.config.shoulder.y * this.scale;
                        this.arm.y = this.shoulderY;
                        this._startIdle();
                    }
                });
            }
        });

        // Fist pump (arm up)
        const pumpObj = { angle: 0 };
        this.scene.tweens.add({
            targets: pumpObj,
            angle: -160,
            duration: 200,
            ease: 'Back.easeOut',
            onUpdate: () => this.setArmAngle(pumpObj.angle),
            onComplete: () => {
                // Pump motion
                this.scene.tweens.add({
                    targets: pumpObj,
                    angle: -130,
                    duration: 150,
                    yoyo: true,
                    repeat: 1,
                    ease: 'Sine.easeInOut',
                    onUpdate: () => this.setArmAngle(pumpObj.angle),
                    onComplete: () => {
                        this.scene.tweens.add({
                            targets: pumpObj,
                            angle: 0,
                            duration: 400,
                            ease: 'Sine.easeInOut',
                            onUpdate: () => this.setArmAngle(pumpObj.angle)
                        });
                    }
                });
            }
        });
    }

    /** Disappointment: slump shoulders + head drop */
    playDisappoint() {
        this._stopIdle();

        // Body slump (slight scale down + shift)
        this.scene.tweens.add({
            targets: this.body,
            scaleY: this.scale * 0.93,
            duration: 400,
            ease: 'Sine.easeOut',
            onComplete: () => {
                this.scene.time.delayedCall(600, () => {
                    this.scene.tweens.add({
                        targets: this.body,
                        scaleY: this.scale,
                        duration: 400,
                        ease: 'Sine.easeInOut',
                        onComplete: () => this._startIdle()
                    });
                });
            }
        });

        // Arm hangs limp
        const limpObj = { angle: this.armAngle };
        this.scene.tweens.add({
            targets: limpObj,
            angle: 15,
            duration: 400,
            ease: 'Sine.easeOut',
            onUpdate: () => this.setArmAngle(limpObj.angle),
            onComplete: () => {
                this.scene.time.delayedCall(600, () => {
                    this.scene.tweens.add({
                        targets: limpObj,
                        angle: 0,
                        duration: 400,
                        ease: 'Sine.easeInOut',
                        onUpdate: () => this.setArmAngle(limpObj.angle)
                    });
                });
            }
        });

        // Head shake
        this.scene.time.delayedCall(200, () => {
            this.scene.tweens.chain({
                targets: this.body,
                tweens: [
                    { angle: this.flipX ? 4 : -4, duration: 100 },
                    { angle: this.flipX ? -4 : 4, duration: 100 },
                    { angle: this.flipX ? 3 : -3, duration: 100 },
                    { angle: 0, duration: 100 }
                ]
            });
        });
    }

    /** Prepare a new ball (show ball in hand again) */
    prepareBall() {
        this.hasBall = true;
        this.ball.setVisible(true);
        this.ball.setAlpha(1);
        this.ball.setScale(this.scale * 0.6);
        this._updateBallPos();
    }

    /** Set visibility */
    setVisible(v) {
        this.body.setVisible(v);
        this.arm.setVisible(v);
        this.ball.setVisible(v && this.hasBall);
    }

    setDepth(d) {
        this.body.setDepth(d);
        this.arm.setDepth(d - 1);
        this.ball.setDepth(d + 1);
    }

    setAlpha(a) {
        this.body.setAlpha(a);
        this.arm.setAlpha(a);
        this.ball.setAlpha(a);
    }

    destroy() {
        this._destroyed = true;
        this._stopIdle();
        if (this._gaugeTween) this._gaugeTween.stop();
        this.body.destroy();
        this.arm.destroy();
        this.ball.destroy();
    }
}
