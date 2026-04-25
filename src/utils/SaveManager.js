import { SAVE_KEY, SAVE_VERSION } from './Constants.js';

// === Integrity check (anti-tampering casual) ===
// FNV-1a 32-bit + secret pepper. Pas de la crypto serieuse (clé visible côté client),
// juste de quoi décourager le DevTools casual cheating et détecter une corruption.
// Pour un vrai anti-cheat il faut un backend — voir docs/VISION_V2.md.
const SAVE_PEPPER = 'ptq-master-v2-galets-2026';
function _checksum(str) {
    let h = 0x811c9dc5;
    const s = str + SAVE_PEPPER;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
    }
    return h.toString(16);
}

function defaultSaveData() {
    return {
        version: SAVE_VERSION,
        rookie: {
            stats: { precision: 4, puissance: 4, effet: 3, sang_froid: 3 },
            totalPoints: 14,
            abilitiesUnlocked: []
        },
        galets: 50,
        purchases: [],
        unlockedCharacters: ["rookie"],
        unlockedTerrains: ["village", "parc", "colline"],
        unlockedBoules: ["acier"],
        unlockedCochonnets: ["classique"],
        badges: [],
        titles: [],
        arcadeProgress: 0,
        arcadePerfect: false,
        arcadeIntroSeen: false,
        milestonesUnlocked: [],
        selectedBoule: "acier",
        selectedCochonnet: "vert",
        tutorialSeen: false,
        tutorialInGameSeen: false,
        tutorialComplete: false,
        tutorialPhasesDone: [],
        audioSettings: {
            masterVolume: 1.0,
            musicVolume: 1.0,
            sfxVolume: 1.0,
            muted: false
        },
        playtime: 0,
        timestamp: Date.now(),
        stats: {
            totalMatches: 0,
            totalWins: 0,
            totalLosses: 0,
            totalCarreaux: 0,
            totalBiberons: 0,
            totalGaletsEarned: 0,
            bestMeneScore: 0,
            totalTimePlayed: 0,
            winsPerTerrain: {},
            winsPerCharacter: {}
        },
        lastDailyDate: null,
        dailyCompleted: false,
        lang: 'fr'
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

// Notification quand une sauvegarde a ete corrompue/falsifiee (UI peut afficher un toast)
let _onIntegrityFailure = null;
export function onIntegrityFailure(callback) { _onIntegrityFailure = callback; }

export function loadSave() {
    try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (!raw) return defaultSaveData();
        const wrapped = JSON.parse(raw);

        // Format wrapped { _data, _sig } → verifier integrite
        let data;
        if (wrapped && typeof wrapped === 'object' && '_data' in wrapped && '_sig' in wrapped) {
            const expectedSig = _checksum(JSON.stringify(wrapped._data));
            if (expectedSig !== wrapped._sig) {
                // Sauvegarde modifiee a la main → reset propre, joueur notifie
                if (_onIntegrityFailure) _onIntegrityFailure();
                return defaultSaveData();
            }
            data = wrapped._data;
        } else {
            // Ancien format (pre-checksum) — accepte une fois, sera resigne au prochain saveSave
            data = wrapped;
        }

        if (!data.version || data.version < 2) return migrateV1(data);
        // Migrate ecus → galets (rename from old saves)
        if (data.ecus !== undefined && data.galets === undefined) {
            data.galets = data.ecus;
            delete data.ecus;
        }
        // Migrate root totalWins/totalLosses/totalCarreaux → stats.* (cleanup v2)
        if (data.totalWins !== undefined || data.totalLosses !== undefined || data.totalCarreaux !== undefined) {
            if (!data.stats) data.stats = {};
            if (data.totalWins !== undefined) { data.stats.totalWins = Math.max(data.stats.totalWins || 0, data.totalWins); delete data.totalWins; }
            if (data.totalLosses !== undefined) { data.stats.totalLosses = Math.max(data.stats.totalLosses || 0, data.totalLosses); delete data.totalLosses; }
            if (data.totalCarreaux !== undefined) { data.stats.totalCarreaux = Math.max(data.stats.totalCarreaux || 0, data.totalCarreaux); delete data.totalCarreaux; }
        }
        return { ...defaultSaveData(), ...data };
    } catch {
        return defaultSaveData();
    }
}

// Callback for save failure notifications (set by UI layer)
let _onSaveFailure = null;
export function onSaveFailure(callback) { _onSaveFailure = callback; }

export function saveSave(data) {
    try {
        data.version = SAVE_VERSION;
        data.timestamp = Date.now();
        const json = JSON.stringify(data);
        const wrapped = { _data: data, _sig: _checksum(json) };
        localStorage.setItem(SAVE_KEY, JSON.stringify(wrapped));
        return true;
    } catch (e) {
        if (_onSaveFailure) _onSaveFailure(e);
        return false;
    }
}

export function resetSave() {
    localStorage.removeItem(SAVE_KEY);
}

// Convenience helpers
export function addGalets(amount) {
    const save = loadSave();
    save.galets = Math.max(0, save.galets + amount);
    saveSave(save);
    return save.galets;
}

export function spendGalets(amount) {
    const save = loadSave();
    if (save.galets < amount) return false;
    save.galets -= amount;
    saveSave(save);
    return true;
}

export function setSelectedBoule(bouleId) {
    const save = loadSave();
    save.selectedBoule = bouleId;
    saveSave(save);
}

export function setSelectedCochonnet(cochonnetId) {
    const save = loadSave();
    save.selectedCochonnet = cochonnetId;
    saveSave(save);
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
        { threshold: 24, id: 'determination' },
        { threshold: 32, id: 'naturel' }
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
    if (!save.stats) save.stats = {};
    save.stats.totalWins = (save.stats.totalWins || 0) + 1;
    saveSave(save);
    return save.stats.totalWins;
}

export function recordLoss() {
    const save = loadSave();
    if (!save.stats) save.stats = {};
    save.stats.totalLosses = (save.stats.totalLosses || 0) + 1;
    saveSave(save);
}

export function recordCarreau() {
    const save = loadSave();
    if (!save.stats) save.stats = {};
    save.stats.totalCarreaux = (save.stats.totalCarreaux || 0) + 1;
    saveSave(save);
    return save.stats.totalCarreaux;
}

export function setArcadeProgress(round) {
    const save = loadSave();
    if (round > save.arcadeProgress) save.arcadeProgress = round;
    saveSave(save);
}

export function setArcadeIntroSeen() {
    const save = loadSave();
    save.arcadeIntroSeen = true;
    saveSave(save);
}

export function isMilestoneUnlocked(milestoneId) {
    const save = loadSave();
    return (save.milestonesUnlocked || []).includes(milestoneId);
}

export function unlockMilestone(milestoneId) {
    const save = loadSave();
    if (!save.milestonesUnlocked) save.milestonesUnlocked = [];
    if (!save.milestonesUnlocked.includes(milestoneId)) {
        save.milestonesUnlocked.push(milestoneId);
        saveSave(save);
        return true; // newly unlocked
    }
    return false;
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

export function getGalets() {
    return loadSave().galets;
}

export function recordMatchStats({ won, terrainName, characterId, carreaux, biberons, galetsEarned, bestMeneScore }) {
    const save = loadSave();
    if (!save.stats) save.stats = {};
    save.stats.totalMatches = (save.stats.totalMatches || 0) + 1;
    if (won) {
        save.stats.totalWins = (save.stats.totalWins || 0) + 1;
        if (terrainName) {
            if (!save.stats.winsPerTerrain) save.stats.winsPerTerrain = {};
            save.stats.winsPerTerrain[terrainName] = (save.stats.winsPerTerrain[terrainName] || 0) + 1;
        }
        if (characterId) {
            if (!save.stats.winsPerCharacter) save.stats.winsPerCharacter = {};
            save.stats.winsPerCharacter[characterId] = (save.stats.winsPerCharacter[characterId] || 0) + 1;
        }
    }
    save.stats.totalCarreaux = (save.stats.totalCarreaux || 0) + (carreaux || 0);
    save.stats.totalBiberons = (save.stats.totalBiberons || 0) + (biberons || 0);
    save.stats.totalGaletsEarned = (save.stats.totalGaletsEarned || 0) + (galetsEarned || 0);
    if (bestMeneScore && bestMeneScore > (save.stats.bestMeneScore || 0)) {
        save.stats.bestMeneScore = bestMeneScore;
    }
    saveSave(save);
    return save.stats;
}

export function addPlaytime(seconds) {
    const save = loadSave();
    save.playtime = (save.playtime || 0) + seconds;
    saveSave(save);
}

export function getStats() {
    return loadSave().stats || {};
}

export function getDailyState() {
    const save = loadSave();
    const today = new Date().toDateString();
    return {
        isNewDay: save.lastDailyDate !== today,
        completed: save.lastDailyDate === today && save.dailyCompleted
    };
}

export function completeDailyChallenge() {
    const save = loadSave();
    save.lastDailyDate = new Date().toDateString();
    save.dailyCompleted = true;
    saveSave(save);
}

// Keep backward-compatible exports for old code that might use slots
export function hasSaveData() {
    return !!localStorage.getItem(SAVE_KEY);
}

// Test helper: bypass wrapping pour creer un save legacy (non signe)
export function _setRawSaveForTests(data) {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
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
