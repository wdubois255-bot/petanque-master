import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, TILE_SIZE, CAMERA_LERP } from '../utils/Constants.js';
import { generateTileset } from '../world/TilesetGenerator.js';
import { generateCharacterSprite, PALETTES } from '../world/SpriteGenerator.js';
import MapManager from '../world/MapManager.js';
import NPCManager from '../world/NPCManager.js';
import Player from '../entities/Player.js';
import DialogBox from '../ui/DialogBox.js';

export default class OverworldScene extends Phaser.Scene {
    constructor() {
        super('OverworldScene');
    }

    init(data) {
        this.spawnMap = data.map || 'village_depart';
        this.spawnX = data.spawnX || 14;
        this.spawnY = data.spawnY || 20;
    }

    create() {
        // Generate placeholder assets
        generateTileset(this);
        generateCharacterSprite(this, 'player', PALETTES.player);
        generateCharacterSprite(this, 'npc_maitre', PALETTES.npc_vieux_maitre);
        generateCharacterSprite(this, 'npc_marcel', PALETTES.npc_marcel);
        generateCharacterSprite(this, 'npc_dresseur_1', PALETTES.npc_dresseur);
        generateCharacterSprite(this, 'npc_villager_1', PALETTES.npc_villager_1);
        generateCharacterSprite(this, 'npc_villager_2', PALETTES.npc_villager_2);

        // Load NPC data
        this.npcData = this.cache.json.get('npcs');

        // Map
        this.mapManager = new MapManager(this);
        this.mapManager.loadMap(this.spawnMap);

        // NPC Manager
        this.npcManager = new NPCManager(this);
        this.npcManager.loadNPCs(this.spawnMap, this.npcData);

        // Player
        this.player = new Player(this, this.spawnX, this.spawnY);

        // Camera
        const mapSize = this.mapManager.getMapPixelSize();
        this.cameras.main.startFollow(this.player, true, CAMERA_LERP, CAMERA_LERP);
        this.cameras.main.setBounds(0, 0, mapSize.w, mapSize.h);
        this.cameras.main.roundPixels = true;

        // Dialog box
        this.dialogBox = new DialogBox(this);

        // Game state
        this.gameState = this.registry.get('gameState') || {
            flags: {},
            badges: [],
            bouleType: 'acier'
        };
        this.registry.set('gameState', this.gameState);

        // Apply defeated flags to NPCs
        for (const npc of this.npcManager.npcs) {
            if (this.gameState.flags[`${npc.id}_defeated`]) {
                npc.markDefeated();
            }
        }

        // Map exit handler
        this.onMapExit = (exit) => {
            // For now, just show a message
            this.dialogBox.show('', ['Vous ne pouvez pas encore quitter le village.'], () => {
                this.player.unfreeze();
            });
            this.player.freeze();
        };
    }

    update(time, delta) {
        // Dialog takes priority
        if (this.dialogBox.isVisible) {
            this.dialogBox.update();
            return;
        }

        this.player.update();

        // Action key: interact with facing NPC
        if (this.player.isActionPressed() && !this.player.isMoving) {
            const facingTile = this.player.getFacingTile();
            const npc = this.npcManager.getNpcAt(facingTile.x, facingTile.y);
            if (npc) {
                this.startDialogue(npc);
            }
        }

        this.npcManager.update(time, delta, this.player);
    }

    startDialogue(npc) {
        this.player.freeze();
        const lines = npc.getDialogue();

        this.dialogBox.show(npc.npcName, lines, () => {
            if (npc.canBattle()) {
                this._startBattle(npc);
            } else {
                this.player.unfreeze();
            }
        });
    }

    _startBattle(npc) {
        this._currentOpponent = npc;

        // Flash + fade transition
        this.cameras.main.flash(200, 255, 255, 255);
        this.cameras.main.once('cameraflashcomplete', () => {
            this.cameras.main.fadeOut(300);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.sleep();
                this.scene.launch('PetanqueScene', {
                    terrain: npc.terrain,
                    difficulty: npc.difficulty,
                    format: npc.format,
                    opponentName: npc.npcName,
                    opponentId: npc.id,
                    returnScene: 'OverworldScene'
                });
            });
        });
    }

    returnFromBattle(result) {
        this.cameras.main.fadeIn(300);
        this.player.unfreeze();

        if (result.won && this._currentOpponent) {
            this._currentOpponent.markDefeated();
            this.gameState.flags[`${this._currentOpponent.id}_defeated`] = true;
            if (this._currentOpponent.badge) {
                this.gameState.badges.push(this._currentOpponent.badge);
            }
            this.registry.set('gameState', this.gameState);

            // Show victory dialogue
            this.scene.time.delayedCall(500, () => {
                const afterLines = this._currentOpponent.dialogueAfter;
                this.dialogBox.show(this._currentOpponent.npcName, afterLines, () => {
                    this.player.unfreeze();
                });
                this.player.freeze();
            });
        }
    }
}
