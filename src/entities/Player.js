import Phaser from 'phaser';
import { TILE_SIZE, PLAYER_MOVE_DURATION } from '../utils/Constants.js';

export default class Player extends Phaser.GameObjects.Sprite {
    constructor(scene, tileX, tileY) {
        const px = tileX * TILE_SIZE + TILE_SIZE / 2;
        const py = tileY * TILE_SIZE + TILE_SIZE / 2 - 4; // Offset up to align feet with tile
        super(scene, px, py, 'player', 0);

        scene.add.existing(this);
        this.setDepth(10);
        this.setOrigin(0.5, 0.7);

        this.tileX = tileX;
        this.tileY = tileY;
        this.facing = 'down';
        this.isMoving = false;

        // Input
        this.cursors = scene.input.keyboard.createCursorKeys();
        this.wasd = {
            up: scene.input.keyboard.addKey('Z'),
            down: scene.input.keyboard.addKey('S'),
            left: scene.input.keyboard.addKey('Q'),
            right: scene.input.keyboard.addKey('D')
        };
        this.actionKey = scene.input.keyboard.addKey('SPACE');

        this._createAnimations();
    }

    _createAnimations() {
        const dirs = ['down', 'left', 'right', 'up'];
        for (let i = 0; i < 4; i++) {
            const dir = dirs[i];
            const baseFrame = i * 4;

            // Walk animation
            this.scene.anims.create({
                key: `walk_${dir}`,
                frames: [
                    { key: 'player', frame: baseFrame + 1 },
                    { key: 'player', frame: baseFrame },
                    { key: 'player', frame: baseFrame + 2 },
                    { key: 'player', frame: baseFrame }
                ],
                frameRate: 8,
                repeat: -1
            });

            // Idle
            this.scene.anims.create({
                key: `idle_${dir}`,
                frames: [{ key: 'player', frame: baseFrame }],
                frameRate: 1
            });
        }
    }

    update() {
        if (this.isMoving) return;

        let dx = 0;
        let dy = 0;

        if (this.cursors.left.isDown || this.wasd.left.isDown) {
            dx = -1;
            this.facing = 'left';
        } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
            dx = 1;
            this.facing = 'right';
        } else if (this.cursors.up.isDown || this.wasd.up.isDown) {
            dy = -1;
            this.facing = 'up';
        } else if (this.cursors.down.isDown || this.wasd.down.isDown) {
            dy = 1;
            this.facing = 'down';
        }

        if (dx === 0 && dy === 0) {
            this.play(`idle_${this.facing}`, true);
            return;
        }

        const newTileX = this.tileX + dx;
        const newTileY = this.tileY + dy;

        // Check collision via MapManager
        const mapManager = this.scene.mapManager;
        if (!mapManager || !mapManager.isWalkable(newTileX, newTileY)) {
            this.play(`idle_${this.facing}`, true);
            return;
        }

        // Check NPC collision
        const npcManager = this.scene.npcManager;
        if (npcManager && npcManager.isNpcAt(newTileX, newTileY)) {
            this.play(`idle_${this.facing}`, true);
            return;
        }

        this._moveTo(newTileX, newTileY);
    }

    _moveTo(newTileX, newTileY) {
        this.isMoving = true;
        this.tileX = newTileX;
        this.tileY = newTileY;

        const targetX = newTileX * TILE_SIZE + TILE_SIZE / 2;
        const targetY = newTileY * TILE_SIZE + TILE_SIZE / 2 - 4;

        this.play(`walk_${this.facing}`, true);

        this.scene.tweens.add({
            targets: this,
            x: targetX,
            y: targetY,
            duration: PLAYER_MOVE_DURATION,
            ease: 'Linear',
            onComplete: () => {
                this.isMoving = false;
                this.play(`idle_${this.facing}`, true);

                // Check exit
                if (this.scene.mapManager) {
                    const exit = this.scene.mapManager.isExit(this.tileX, this.tileY);
                    if (exit && this.scene.onMapExit) {
                        this.scene.onMapExit(exit);
                    }
                }
            }
        });
    }

    getFacingTile() {
        const offsets = {
            up: { x: 0, y: -1 },
            down: { x: 0, y: 1 },
            left: { x: -1, y: 0 },
            right: { x: 1, y: 0 }
        };
        const o = offsets[this.facing];
        return { x: this.tileX + o.x, y: this.tileY + o.y };
    }

    isActionPressed() {
        return Phaser.Input.Keyboard.JustDown(this.actionKey);
    }

    freeze() {
        this.isMoving = true; // Prevent input
    }

    unfreeze() {
        this.isMoving = false;
    }
}
