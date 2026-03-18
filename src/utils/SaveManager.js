const SAVE_KEY = 'petanque_master_save';
const SAVE_VERSION = 2;

function defaultSaveData() {
    return {
        version: SAVE_VERSION,
        rookie: {
            stats: { precision: 3, puissance: 3, effet: 2, sang_froid: 2 },
            totalPoints: 10,
            abilitiesUnlocked: []
        },
        ecus: 50,
        purchases: [],
        unlockedCharacters: ["rookie"],
        unlockedTerrains: ["village", "parc", "colline"],
        unlockedBoules: ["acier", "chrome", "chrome_retro"],
        unlockedCochonnets: ["classique"],
        badges: [],
        titles: [],
        totalWins: 0,
        totalLosses: 0,
        totalCarreaux: 0,
        arcadeProgress: 0,
        arcadePerfect: false,
        selectedBoule: "acier",
        selectedCochonnet: "classique",
        tutorialSeen: false,
        playtime: 0,
        timestamp: Date.now()
    };
}

function migrateV1(oldData) {
    const newData = defaultSaveData();
    // Preserve what we can from v1
    if (oldData.badges) newData.badges = oldData.badges;
    if (oldData.bouleType) newData.selectedBoule = oldData.bouleType;
    if (oldData.playtime) newData.playtime = oldData.playtime;
    return newData;
}

export function loadSave() {
    try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (!raw) return defaultSaveData();
        const data = JSON.parse(raw);
        if (!data.version || data.version < 2) return migrateV1(data);
        return { ...defaultSaveData(), ...data };
    } catch {
        return defaultSaveData();
    }
}

export function saveSave(data) {
    try {
        data.version = SAVE_VERSION;
        data.timestamp = Date.now();
        localStorage.setItem(SAVE_KEY, JSON.stringify(data));
        return true;
    } catch {
        return false;
    }
}

export function resetSave() {
    localStorage.removeItem(SAVE_KEY);
}

// Convenience helpers
export function addEcus(amount) {
    const save = loadSave();
    save.ecus += amount;
    saveSave(save);
    return save.ecus;
}

export function spendEcus(amount) {
    const save = loadSave();
    if (save.ecus < amount) return false;
    save.ecus -= amount;
    saveSave(save);
    return true;
}

export function unlockCharacter(charId) {
    const save = loadSave();
    if (!save.unlockedCharacters.includes(charId)) {
        save.unlockedCharacters.push(charId);
        saveSave(save);
    }
}

export function unlockTerrain(terrainId) {
    const save = loadSave();
    if (!save.unlockedTerrains.includes(terrainId)) {
        save.unlockedTerrains.push(terrainId);
        saveSave(save);
    }
}

export function unlockBoule(bouleId) {
    const save = loadSave();
    if (!save.unlockedBoules.includes(bouleId)) {
        save.unlockedBoules.push(bouleId);
        saveSave(save);
    }
}

export function unlockCochonnet(cochonnetId) {
    const save = loadSave();
    if (!save.unlockedCochonnets.includes(cochonnetId)) {
        save.unlockedCochonnets.push(cochonnetId);
        saveSave(save);
    }
}

export function addRookiePoints(points) {
    const save = loadSave();
    save.rookie.totalPoints += points;
    // Check ability unlocks
    for (const unlock of [
        { threshold: 18, id: 'instinct' },
        { threshold: 26, id: 'determination' },
        { threshold: 34, id: 'naturel' }
    ]) {
        if (save.rookie.totalPoints >= unlock.threshold && !save.rookie.abilitiesUnlocked.includes(unlock.id)) {
            save.rookie.abilitiesUnlocked.push(unlock.id);
        }
    }
    saveSave(save);
    return save.rookie;
}

export function setRookieStats(stats) {
    const save = loadSave();
    save.rookie.stats = { ...stats };
    saveSave(save);
}

export function recordWin() {
    const save = loadSave();
    save.totalWins++;
    saveSave(save);
    return save.totalWins;
}

export function recordLoss() {
    const save = loadSave();
    save.totalLosses++;
    saveSave(save);
}

export function recordCarreau() {
    const save = loadSave();
    save.totalCarreaux++;
    saveSave(save);
    return save.totalCarreaux;
}

export function setArcadeProgress(round) {
    const save = loadSave();
    if (round > save.arcadeProgress) save.arcadeProgress = round;
    saveSave(save);
}

export function isCharacterUnlocked(charId) {
    const save = loadSave();
    return save.unlockedCharacters.includes(charId);
}

export function isTerrainUnlocked(terrainId) {
    const save = loadSave();
    return save.unlockedTerrains.includes(terrainId);
}

export function getRookieStats() {
    const save = loadSave();
    return save.rookie;
}

export function getEcus() {
    return loadSave().ecus;
}

// Keep backward-compatible exports for old code that might use slots
export function hasSaveData() {
    return !!localStorage.getItem(SAVE_KEY);
}

export function formatPlaytime(ms) {
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    return h > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${m}min`;
}

// DEPRECATED: old slot-based API (kept for backward compatibility)
export function saveGame(slot, gameState) { return saveSave({ ...loadSave(), ...gameState }); }
export function loadGame(slot) { return loadSave(); }
export function deleteGame(slot) { resetSave(); }
export function getAllSlots() { return [loadSave(), null, null]; }
