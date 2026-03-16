import NPC from '../entities/NPC.js';

export default class NPCManager {
    constructor(scene) {
        this.scene = scene;
        this.npcs = [];
    }

    loadNPCs(mapName, npcData) {
        this.clear();

        // If the MapManager loaded a Tiled map with embedded NPC data, use that
        const mapManager = this.scene.mapManager;
        if (mapManager && mapManager.isTiled && mapManager.tiledNpcData.length > 0) {
            this.loadFromTiledData(mapManager.tiledNpcData);
            return;
        }

        // Fallback: load from npcs.json
        const mapNPCs = npcData.npcs.filter(n => n.map === mapName);
        for (const data of mapNPCs) {
            const npc = new NPC(this.scene, data);
            this.npcs.push(npc);
        }
    }

    /**
     * Load NPCs from Tiled object layer data (already parsed by MapManager).
     * Each entry has: id, name, map, tile_x, tile_y, sprite, type, difficulty, etc.
     */
    loadFromTiledData(tiledNpcArray) {
        for (const data of tiledNpcArray) {
            const npc = new NPC(this.scene, data);
            this.npcs.push(npc);
        }
    }

    update(time, delta, player) {
        for (const npc of this.npcs) {
            npc.update(time, delta, player);
        }
    }

    getNpcAt(tileX, tileY) {
        return this.npcs.find(n => n.tileX === tileX && n.tileY === tileY);
    }

    isNpcAt(tileX, tileY) {
        return this.npcs.some(n => n.tileX === tileX && n.tileY === tileY);
    }

    getNpcById(id) {
        return this.npcs.find(n => n.id === id);
    }

    clear() {
        for (const npc of this.npcs) {
            npc.destroy();
        }
        this.npcs = [];
    }
}
