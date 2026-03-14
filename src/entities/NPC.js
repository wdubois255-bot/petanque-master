import Phaser from 'phaser';
import { TILE_SIZE } from '../utils/Constants.js';

export default class NPC extends Phaser.GameObjects.Sprite {
    constructor(scene, data) {
        const px = data.tile_x * TILE_SIZE + TILE_SIZE / 2;
        const py = data.tile_y * TILE_SIZE + TILE_SIZE / 2;
        const spriteKey = data.sprite || 'npc_villager_1';
        super(scene, px, py, spriteKey, 0);

        scene.add.existing(this);
        this.setDepth(10);
        this.setOrigin(0.5, 0.5);

        this.id = data.id;
        this.npcName = data.name;
        this.type = data.type;
        this.tileX = data.tile_x;
        this.tileY = data.tile_y;
        this.facing = data.facing || 'down';
        this.viewDistance = data.view_distance || 0;
        this.difficulty = data.difficulty || 'easy';
        this.terrain = data.terrain || 'terre';
        this.format = data.format || 'tete_a_tete';
        this.badge = data.badge || null;

        this.dialogueBefore = data.dialogue_before || data.dialogue_default || ['...'];
        this.dialogueAfter = data.dialogue_after || data.dialogue_default || ['...'];
        this.defeated = false;

        // Keep raw data for special NPC types
        this.npcData = data;

        this._exclamation = null;
        this._idleTimer = 0;
        this._idleInterval = 3000 + Math.random() * 2000;

        this._setFacingFrame();
        this._createAnimations(spriteKey);
    }

    _createAnimations(key) {
        const dirs = ['down', 'left', 'right', 'up'];
        for (let i = 0; i < 4; i++) {
            const dir = dirs[i];
            const animKey = `${key}_idle_${dir}`;
            if (!this.scene.anims.exists(animKey)) {
                this.scene.anims.create({
                    key: animKey,
                    frames: [{ key, frame: i * 4 }],
                    frameRate: 1
                });
            }
        }
    }

    _setFacingFrame() {
        const dirIndex = { down: 0, left: 1, right: 2, up: 3 };
        this.setFrame((dirIndex[this.facing] || 0) * 4);
    }

    update(time, delta, player) {
        // Idle direction change
        this._idleTimer += delta;
        if (this._idleTimer > this._idleInterval) {
            this._idleTimer = 0;
            this._idleInterval = 3000 + Math.random() * 2000;
            const dirs = ['down', 'left', 'right', 'up'];
            this.facing = dirs[Math.floor(Math.random() * 4)];
            this._setFacingFrame();
        }

        // Line of sight detection for trainers
        if (this.viewDistance > 0 && !this.defeated && player && !player.isMoving) {
            if (this._checkLineOfSight(player)) {
                this._triggerEncounter(player);
            }
        }
    }

    _checkLineOfSight(player) {
        const offsets = {
            up: { dx: 0, dy: -1 },
            down: { dx: 0, dy: 1 },
            left: { dx: -1, dy: 0 },
            right: { dx: 1, dy: 0 }
        };
        const o = offsets[this.facing];
        if (!o) return false;

        for (let d = 1; d <= this.viewDistance; d++) {
            const checkX = this.tileX + o.dx * d;
            const checkY = this.tileY + o.dy * d;
            if (checkX === player.tileX && checkY === player.tileY) {
                return true;
            }
            // Blocked by collision
            if (this.scene.mapManager && !this.scene.mapManager.isWalkable(checkX, checkY)) {
                return false;
            }
        }
        return false;
    }

    _triggerEncounter(player) {
        if (this._triggered) return;
        this._triggered = true;
        player.freeze();

        // Show "!" exclamation
        this._exclamation = this.scene.add.text(
            this.x, this.y - 36, '!',
            { fontFamily: 'monospace', fontSize: '20px', color: '#C44B3F', fontStyle: 'bold' }
        ).setOrigin(0.5).setDepth(30);

        this.scene.time.delayedCall(600, () => {
            if (this._exclamation) this._exclamation.destroy();
            this._walkToPlayer(player);
        });
    }

    _walkToPlayer(player) {
        // Walk toward player
        const dx = player.tileX - this.tileX;
        const dy = player.tileY - this.tileY;
        const steps = Math.abs(dx) + Math.abs(dy) - 1;

        if (steps <= 0) {
            this._facePlayer(player);
            this.scene.startDialogue(this);
            return;
        }

        const stepDir = dx !== 0
            ? { x: Math.sign(dx), y: 0, face: dx > 0 ? 'right' : 'left' }
            : { x: 0, y: Math.sign(dy), face: dy > 0 ? 'down' : 'up' };

        let moved = 0;
        const moveNext = () => {
            if (moved >= steps) {
                this._facePlayer(player);
                this.scene.startDialogue(this);
                return;
            }
            this.tileX += stepDir.x;
            this.tileY += stepDir.y;
            this.facing = stepDir.face;
            this._setFacingFrame();

            this.scene.tweens.add({
                targets: this,
                x: this.tileX * TILE_SIZE + TILE_SIZE / 2,
                y: this.tileY * TILE_SIZE + TILE_SIZE / 2,
                duration: 150,
                onComplete: () => { moved++; moveNext(); }
            });
        };
        moveNext();
    }

    _facePlayer(player) {
        const dx = player.tileX - this.tileX;
        const dy = player.tileY - this.tileY;
        if (Math.abs(dx) > Math.abs(dy)) {
            this.facing = dx > 0 ? 'right' : 'left';
        } else {
            this.facing = dy > 0 ? 'down' : 'up';
        }
        this._setFacingFrame();
    }

    getDialogue() {
        return this.defeated ? this.dialogueAfter : this.dialogueBefore;
    }

    markDefeated() {
        this.defeated = true;
        this._triggered = false;
    }

    canBattle() {
        return (this.type === 'trainer' || this.type === 'arena_master') && !this.defeated;
    }
}
