import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, TILE_SIZE, CAMERA_LERP } from '../utils/Constants.js';
import { generateCharacterSprite, PALETTES } from '../world/SpriteGenerator.js';
import MapManager from '../world/MapManager.js';
import NPCManager from '../world/NPCManager.js';
import Player from '../entities/Player.js';
import DialogBox from '../ui/DialogBox.js';
import { saveGame } from '../utils/SaveManager.js';

export default class OverworldScene extends Phaser.Scene {
    constructor() {
        super('OverworldScene');
        this._assetsGenerated = false;
    }

    init(data) {
        this.spawnMap = data.map || 'village_depart';
        this.spawnX = data.spawnX || 14;
        this.spawnY = data.spawnY || 20;
    }

    create() {
        // Map sprite keys for compatibility
        if (!this._assetsGenerated) {
            // Use preloaded PNG spritesheets - map old keys to new Pipoya keys
            // If PNG loaded successfully, create alias; otherwise fallback to canvas
            const pngMapping = [
                // player uses PixelLab animated sprite (preloaded in BootScene)
                ['npc_maitre', 'npc_maitre'],
                ['npc_marcel', 'npc_marcel'],
                ['npc_dresseur_1', 'npc_dresseur_1'],
                ['npc_dresseur_2', 'npc_dresseur_2'],
                ['npc_dresseur_3', 'npc_dresseur_3'],
                ['npc_villager_1', 'npc_villager_1'],
                ['npc_villager_2', 'npc_villager_2'],
                ['npc_rival', 'npc_rival'],
                ['npc_gate', 'npc_gate'],
            ];
            const paletteMap = {
                player: PALETTES.player,
                npc_maitre: PALETTES.npc_vieux_maitre,
                npc_marcel: PALETTES.npc_marcel,
                npc_dresseur_1: PALETTES.npc_dresseur,
                npc_dresseur_2: PALETTES.npc_dresseur_2,
                npc_dresseur_3: PALETTES.npc_dresseur_3,
                npc_villager_1: PALETTES.npc_villager_1,
                npc_villager_2: PALETTES.npc_villager_2,
                npc_rival: PALETTES.npc_rival,
                npc_gate: PALETTES.npc_gate,
            };

            for (const [gameKey, pngKey] of pngMapping) {
                if (this.textures.exists(pngKey) && gameKey !== pngKey) {
                    // PNG loaded - copy texture reference under game key
                    const srcTex = this.textures.get(pngKey);
                    if (!this.textures.exists(gameKey)) {
                        this.textures.addSpriteSheet(gameKey, srcTex.getSourceImage(), {
                            frameWidth: 32, frameHeight: 32
                        });
                    }
                } else if (!this.textures.exists(gameKey)) {
                    // Fallback: canvas generation
                    generateCharacterSprite(this, gameKey, paletteMap[gameKey]);
                }
            }

            this._assetsGenerated = true;
        }

        // Load NPC data
        this.npcData = this.cache.json.get('npcs');
        this.progressionData = this.cache.json.get('progression');

        // Game state from registry
        this.gameState = this.registry.get('gameState') || {
            player: { name: 'Joueur', map: this.spawnMap, x: this.spawnX, y: this.spawnY, facing: 'down' },
            bouleType: 'acier',
            badges: [],
            flags: {},
            partners: [],
            scoreTotal: 0,
            playtime: 0
        };
        this.registry.set('gameState', this.gameState);

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
        this.cameras.main.fadeIn(300);

        // Dialog box
        this.dialogBox = new DialogBox(this);

        // Apply defeated flags to NPCs
        for (const npc of this.npcManager.npcs) {
            if (this.gameState.flags[`${npc.id}_defeated`]) {
                npc.markDefeated();
            }
        }

        // Transition state
        this._transitioning = false;

        // DEBUG: touche P = lancer une partie directement
        this.input.keyboard.on('keydown-P', () => {
            if (this._transitioning || this.dialogBox.isVisible) return;
            this.scene.sleep();
            this.scene.launch('PetanqueScene', {
                terrain: 'terre',
                difficulty: 'easy',
                format: 'tete_a_tete',
                opponentName: 'Test',
                opponentId: 'debug_test',
                returnScene: 'OverworldScene'
            });
        });

        // Show control hints on first visit
        if (!this.gameState.flags._controls_shown) {
            this.gameState.flags._controls_shown = true;
            this._showControlHints();
        }

        // Playtime tracking
        this._playtimeStart = Date.now();

        // Auto-save timer (every 5 min)
        this._autoSaveTimer = this.time.addEvent({
            delay: 300000,
            callback: () => this._autoSave(),
            loop: true
        });
    }

    update(time, delta) {
        if (this._transitioning) return;

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
                this._handleNPCInteraction(npc);
                return;
            }
        }

        // Check map exit after player moves
        if (!this.player.isMoving) {
            const exit = this.mapManager.isExit(this.player.tileX, this.player.tileY);
            if (exit) {
                this._handleMapExit(exit);
            }
        }

        this.npcManager.update(time, delta, this.player);
    }

    _handleNPCInteraction(npc) {
        // Gate NPC: check badge
        if (npc.type === 'gate') {
            const requiredBadge = npc.npcData?.requires_badge;
            if (requiredBadge && !this.gameState.badges.includes(requiredBadge)) {
                this.startDialogue(npc);
                return;
            }
            // Has the badge -> show pass dialogue
            npc.defeated = true;
            this.startDialogue(npc);
            return;
        }

        // Rival NPC: dialogue changes with progression
        if (npc.type === 'rival') {
            const lines = this.gameState.badges.length > 0 ? npc.dialogueAfter : npc.dialogueBefore;
            this.player.freeze();
            this.dialogBox.show(npc.npcName, lines, () => {
                this.player.unfreeze();
            });
            return;
        }

        // Mentor: after intro, show post-intro dialogue
        if (npc.type === 'mentor' && this.gameState.flags.intro_done) {
            this.player.freeze();
            const afterLines = npc.npcData?.dialogue_after_intro || npc.dialogueAfter;
            this.dialogBox.show(npc.npcName, afterLines, () => {
                this.player.unfreeze();
            });
            return;
        }

        this.startDialogue(npc);
    }

    _handleMapExit(exit) {
        if (!exit) {
            // Blocked exit
            this.player.freeze();
            this.dialogBox.show('', ['Vous ne pouvez pas encore aller par la.'], () => {
                this.player.unfreeze();
            });
            return;
        }

        // Check gate requirements
        if (this.progressionData && this.progressionData.gates) {
            const gate = this.progressionData.gates.find(g =>
                g.map === exit.map || g.map === this.mapManager.currentMapName
            );
            if (gate && gate.requires) {
                const missing = gate.requires.filter(b => !this.gameState.badges.includes(b));
                if (missing.length > 0) {
                    this.player.freeze();
                    this.dialogBox.show('', ['Il faut d\'abord battre le Maitre d\'Arene pour continuer !'], () => {
                        // Push player back one tile
                        this.player.unfreeze();
                    });
                    return;
                }
            }
        }

        this._transitionToMap(exit.map, exit.spawnX, exit.spawnY);
    }

    _transitionToMap(mapName, spawnX, spawnY) {
        this._transitioning = true;
        this.player.freeze();

        // Update playtime before save
        this._updatePlaytime();

        // Update game state
        this.gameState.player.map = mapName;
        this.gameState.player.x = spawnX;
        this.gameState.player.y = spawnY;
        this.registry.set('gameState', this.gameState);

        // Auto-save on map change
        this._autoSave();

        this.cameras.main.fadeOut(200);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.restart({ map: mapName, spawnX, spawnY });
        });
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
        this._updatePlaytime();

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

            this.gameState.scoreTotal = (this.gameState.scoreTotal || 0) + (result.playerScore || 0);
            this.registry.set('gameState', this.gameState);
            this._autoSave();

            // Show victory dialogue
            this.time.delayedCall(500, () => {
                const afterLines = this._currentOpponent.dialogueAfter;
                const isMaster = this._currentOpponent.type === 'arena_master';

                this.player.freeze();
                this.dialogBox.show(this._currentOpponent.npcName, afterLines, () => {
                    if (isMaster && this._currentOpponent.badge) {
                        this._showBadgeObtained(this._currentOpponent.badge);
                    } else {
                        this.player.unfreeze();
                    }
                });
            });
        }
    }

    _showBadgeObtained(badgeId) {
        const badge = this.progressionData?.badges?.find(b => b.id === badgeId);
        const badgeName = badge ? badge.name : badgeId;
        const shadow = { offsetX: 2, offsetY: 2, color: '#1A1510', blur: 0, fill: true };

        // Flash effect
        this.cameras.main.flash(300, 255, 215, 0);

        // Badge notification
        const overlay = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 440, 180, 0x3A2E28, 0.95)
            .setDepth(200).setStrokeStyle(3, 0xFFD700).setScrollFactor(0);

        const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 48, 'BADGE OBTENU !', {
            fontFamily: 'monospace', fontSize: '28px', color: '#FFD700', align: 'center',
            shadow: { offsetX: 3, offsetY: 3, color: '#1A1510', blur: 0, fill: true }
        }).setOrigin(0.5).setDepth(201).setScrollFactor(0);

        const name = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 8, badgeName, {
            fontFamily: 'monospace', fontSize: '22px', color: '#F5E6D0', align: 'center', shadow
        }).setOrigin(0.5).setDepth(201).setScrollFactor(0);

        const hint = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 48, 'Appuyez sur Espace', {
            fontFamily: 'monospace', fontSize: '16px', color: '#9E9E8E', align: 'center', shadow
        }).setOrigin(0.5).setDepth(201).setScrollFactor(0);

        this.tweens.add({ targets: hint, alpha: { from: 1, to: 0.3 }, duration: 500, yoyo: true, repeat: -1 });

        const cleanup = () => {
            overlay.destroy();
            title.destroy();
            name.destroy();
            hint.destroy();
            this.player.unfreeze();
        };

        this.input.once('pointerdown', cleanup);
        const spaceKey = this.input.keyboard.addKey('SPACE');
        const handler = () => {
            cleanup();
            spaceKey.off('down', handler);
        };
        spaceKey.on('down', handler);
    }

    _showControlHints() {
        const bg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 32, 520, 48, 0x3A2E28, 0.9)
            .setDepth(150).setScrollFactor(0);
        const text = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 32,
            '\u2191\u2190\u2193\u2192  Se deplacer     Espace  Parler', {
                fontFamily: 'monospace', fontSize: '18px', color: '#F5E6D0', align: 'center',
                shadow: { offsetX: 2, offsetY: 2, color: '#1A1510', blur: 0, fill: true }
            }).setOrigin(0.5).setDepth(151).setScrollFactor(0);

        this.time.delayedCall(4000, () => {
            this.tweens.add({
                targets: [bg, text], alpha: 0, duration: 800,
                onComplete: () => { bg.destroy(); text.destroy(); }
            });
        });
    }

    _autoSave() {
        const slot = this.registry.get('currentSlot');
        if (slot === undefined || slot === null) return;
        this.gameState.player.map = this.mapManager.currentMapName || this.spawnMap;
        this.gameState.player.x = this.player.tileX;
        this.gameState.player.y = this.player.tileY;
        this.gameState.player.facing = this.player.facing;
        saveGame(slot, this.gameState);
    }

    _updatePlaytime() {
        const now = Date.now();
        this.gameState.playtime = (this.gameState.playtime || 0) + (now - this._playtimeStart);
        this._playtimeStart = now;
    }
}
