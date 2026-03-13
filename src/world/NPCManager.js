import NPC from '../entities/NPC.js';

export default class NPCManager {
    constructor(scene) {
        this.scene = scene;
        this.npcs = [];
    }

    loadNPCs(mapName, npcData) {
        this.clear();
        const mapNPCs = npcData.npcs.filter(n => n.map === mapName);
        for (const data of mapNPCs) {
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
