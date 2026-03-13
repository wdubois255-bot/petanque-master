const SAVE_KEY_PREFIX = 'petanque_master_slot_';
const SAVE_VERSION = 1;
const MAX_SLOTS = 3;

function defaultSaveData() {
    return {
        version: SAVE_VERSION,
        player: { name: 'Joueur', map: 'village_depart', x: 14, y: 20, facing: 'down' },
        bouleType: 'acier',
        badges: [],
        flags: {},
        partners: [],
        scoreTotal: 0,
        playtime: 0,
        timestamp: Date.now()
    };
}

export function saveGame(slot, gameState) {
    if (slot < 0 || slot >= MAX_SLOTS) return false;
    const data = {
        version: SAVE_VERSION,
        player: gameState.player || defaultSaveData().player,
        bouleType: gameState.bouleType || 'acier',
        badges: gameState.badges || [],
        flags: gameState.flags || {},
        partners: gameState.partners || [],
        scoreTotal: gameState.scoreTotal || 0,
        playtime: gameState.playtime || 0,
        timestamp: Date.now()
    };
    try {
        localStorage.setItem(SAVE_KEY_PREFIX + slot, JSON.stringify(data));
        return true;
    } catch (e) {
        return false;
    }
}

export function loadGame(slot) {
    if (slot < 0 || slot >= MAX_SLOTS) return null;
    try {
        const raw = localStorage.getItem(SAVE_KEY_PREFIX + slot);
        if (!raw) return null;
        const data = JSON.parse(raw);
        if (data.version !== SAVE_VERSION) return null;
        return data;
    } catch (e) {
        return null;
    }
}

export function deleteGame(slot) {
    if (slot < 0 || slot >= MAX_SLOTS) return;
    localStorage.removeItem(SAVE_KEY_PREFIX + slot);
}

export function getAllSlots() {
    const slots = [];
    for (let i = 0; i < MAX_SLOTS; i++) {
        slots.push(loadGame(i));
    }
    return slots;
}

export function hasSaveData() {
    for (let i = 0; i < MAX_SLOTS; i++) {
        if (localStorage.getItem(SAVE_KEY_PREFIX + i)) return true;
    }
    return false;
}

export function formatPlaytime(ms) {
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    return h > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${m}min`;
}
