import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: vi.fn(key => store[key] ?? null),
        setItem: vi.fn((key, value) => { store[key] = value; }),
        removeItem: vi.fn(key => { delete store[key]; }),
        clear: vi.fn(() => { store = {}; }),
        _store: store,
        _reset: () => { store = {}; }
    };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });

// Import after localStorage mock is in place
const { loadSave, saveSave, resetSave, addGalets, spendGalets,
    addRookiePoints, onSaveFailure, getGalets } = await import('../src/utils/SaveManager.js');

describe('SaveManager', () => {
    beforeEach(() => {
        localStorageMock._reset();
        localStorageMock.getItem.mockClear();
        localStorageMock.setItem.mockClear();
        localStorageMock.removeItem.mockClear();
    });

    describe('loadSave()', () => {
        it('returns default data when no save exists', () => {
            const save = loadSave();
            expect(save.version).toBe(2);
            expect(save.galets).toBe(100);
            expect(save.rookie.stats.precision).toBe(4);
            expect(save.unlockedCharacters).toContain('rookie');
        });

        it('handles corrupted JSON gracefully', () => {
            localStorageMock.getItem.mockReturnValueOnce('not valid json {{{');
            const save = loadSave();
            expect(save.version).toBe(2);
            expect(save.galets).toBe(100);
        });

        it('migrates ecus to galets', () => {
            const oldData = { version: 2, ecus: 500 };
            localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(oldData));
            const save = loadSave();
            expect(save.galets).toBe(500);
            expect(save.ecus).toBeUndefined();
        });

        it('migrates v1 data to v2', () => {
            const v1Data = { version: 1, badges: ['test_badge'], bouleType: 'bronze' };
            localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(v1Data));
            const save = loadSave();
            expect(save.version).toBe(2);
            expect(save.badges).toContain('test_badge');
            expect(save.selectedBoule).toBe('bronze');
        });

        it('fills missing fields from defaults', () => {
            const partialData = { version: 2, galets: 999 };
            localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(partialData));
            const save = loadSave();
            expect(save.galets).toBe(999);
            expect(save.rookie).toBeDefined();
            expect(save.unlockedCharacters).toBeDefined();
        });
    });

    describe('saveSave()', () => {
        it('returns true on success', () => {
            const result = saveSave({ galets: 200 });
            expect(result).toBe(true);
            expect(localStorageMock.setItem).toHaveBeenCalled();
        });

        it('returns false on quota exceeded', () => {
            localStorageMock.setItem.mockImplementationOnce(() => {
                throw new DOMException('QuotaExceededError');
            });
            const result = saveSave({ galets: 200 });
            expect(result).toBe(false);
        });

        it('calls onSaveFailure callback on error', () => {
            const failCallback = vi.fn();
            onSaveFailure(failCallback);

            localStorageMock.setItem.mockImplementationOnce(() => {
                throw new DOMException('QuotaExceededError');
            });
            saveSave({ galets: 200 });
            expect(failCallback).toHaveBeenCalledOnce();
        });

        it('sets version and timestamp', () => {
            const data = { galets: 200 };
            saveSave(data);
            expect(data.version).toBe(2);
            expect(data.timestamp).toBeDefined();
            expect(typeof data.timestamp).toBe('number');
        });
    });

    describe('Convenience helpers', () => {
        it('addGalets adds amount correctly', () => {
            // Save initial state
            saveSave({ galets: 100, version: 2, rookie: { stats: {}, totalPoints: 14, abilitiesUnlocked: [] } });
            const result = addGalets(50);
            expect(result).toBe(150);
        });

        it('spendGalets refuses if insufficient', () => {
            saveSave({ galets: 30, version: 2, rookie: { stats: {}, totalPoints: 14, abilitiesUnlocked: [] } });
            const result = spendGalets(50);
            expect(result).toBe(false);
        });

        it('spendGalets deducts if sufficient', () => {
            saveSave({ galets: 100, version: 2, rookie: { stats: {}, totalPoints: 14, abilitiesUnlocked: [] } });
            const result = spendGalets(40);
            expect(result).toBe(true);
        });

        it('addGalets with negative amount does not go below 0', () => {
            saveSave({ galets: 30, version: 2, rookie: { stats: {}, totalPoints: 14, abilitiesUnlocked: [] } });
            const result = addGalets(-50);
            expect(result).toBe(0);
        });

        it('addGalets with large negative clamps to 0', () => {
            saveSave({ galets: 5, version: 2, rookie: { stats: {}, totalPoints: 14, abilitiesUnlocked: [] } });
            const result = addGalets(-9999);
            expect(result).toBe(0);
            expect(getGalets()).toBe(0);
        });
    });

    describe('Persistent match stats', () => {
        it('recordMatchStats accumulates across 3 matches', async () => {
            const { recordMatchStats, getStats } = await import('../src/utils/SaveManager.js');
            saveSave({ galets: 100, version: 2, rookie: { stats: {}, totalPoints: 14, abilitiesUnlocked: [] }, stats: {} });

            recordMatchStats({ won: true, terrainName: 'village', characterId: 'rookie', carreaux: 2, biberons: 1, galetsEarned: 100, bestMeneScore: 3 });
            recordMatchStats({ won: false, terrainName: 'parc', characterId: 'rookie', carreaux: 0, biberons: 0, galetsEarned: 0, bestMeneScore: 1 });
            recordMatchStats({ won: true, terrainName: 'village', characterId: 'rookie', carreaux: 1, biberons: 0, galetsEarned: 40, bestMeneScore: 5 });

            const stats = getStats();
            expect(stats.totalMatches).toBe(3);
            expect(stats.totalWins).toBe(2);
            expect(stats.totalCarreaux).toBe(3);
            expect(stats.totalBiberons).toBe(1);
            expect(stats.totalGaletsEarned).toBe(140);
            expect(stats.bestMeneScore).toBe(5);
            expect(stats.winsPerTerrain.village).toBe(2);
            expect(stats.winsPerCharacter.rookie).toBe(2);
        });
    });

    describe('Daily challenge state', () => {
        it('getDailyState reports new day correctly', async () => {
            const { getDailyState } = await import('../src/utils/SaveManager.js');
            saveSave({ galets: 100, version: 2, rookie: { stats: {}, totalPoints: 14, abilitiesUnlocked: [] }, lastDailyDate: null, dailyCompleted: false });

            const state = getDailyState();
            expect(state.isNewDay).toBe(true);
            expect(state.completed).toBe(false);
        });

        it('getDailyState detects completed today', async () => {
            const { getDailyState } = await import('../src/utils/SaveManager.js');
            const today = new Date().toDateString();
            saveSave({ galets: 100, version: 2, rookie: { stats: {}, totalPoints: 14, abilitiesUnlocked: [] }, lastDailyDate: today, dailyCompleted: true });

            const state = getDailyState();
            expect(state.isNewDay).toBe(false);
            expect(state.completed).toBe(true);
        });

        it('daily challenge seed determinism: same day = same seed', () => {
            const dateStr = new Date().toDateString();
            let hash1 = 0, hash2 = 0;
            for (let i = 0; i < dateStr.length; i++) {
                hash1 = ((hash1 << 5) - hash1 + dateStr.charCodeAt(i)) | 0;
                hash2 = ((hash2 << 5) - hash2 + dateStr.charCodeAt(i)) | 0;
            }
            expect(hash1).toBe(hash2);
        });
    });

    describe('Rookie progression', () => {
        it('addRookiePoints unlocks abilities at thresholds', () => {
            saveSave({
                galets: 100, version: 2,
                rookie: { stats: { precision: 4, puissance: 4, effet: 3, sang_froid: 3 }, totalPoints: 14, abilitiesUnlocked: [] },
                unlockedCharacters: ['rookie'], unlockedTerrains: ['village'], unlockedBoules: ['acier'],
                unlockedCochonnets: ['classique'], purchases: [], badges: [], titles: [],
                totalWins: 0, totalLosses: 0, totalCarreaux: 0, arcadeProgress: 0
            });

            // Add 4 points to reach 18 → instinct should unlock
            const result = addRookiePoints(4);
            expect(result.totalPoints).toBe(18);
            expect(result.abilitiesUnlocked).toContain('instinct');
        });

        it('addRookiePoints unlocks determination at 24', () => {
            saveSave({
                galets: 100, version: 2,
                rookie: { stats: {}, totalPoints: 23, abilitiesUnlocked: ['instinct'] },
                unlockedCharacters: ['rookie'], unlockedTerrains: ['village'], unlockedBoules: ['acier'],
                unlockedCochonnets: ['classique'], purchases: [], badges: [], titles: [],
                totalWins: 0, totalLosses: 0, totalCarreaux: 0, arcadeProgress: 0
            });

            const result = addRookiePoints(1);
            expect(result.totalPoints).toBe(24);
            expect(result.abilitiesUnlocked).toContain('determination');
        });

        it('addRookiePoints unlocks naturel at 32', () => {
            saveSave({
                galets: 100, version: 2,
                rookie: { stats: {}, totalPoints: 31, abilitiesUnlocked: ['instinct', 'determination'] },
                unlockedCharacters: ['rookie'], unlockedTerrains: ['village'], unlockedBoules: ['acier'],
                unlockedCochonnets: ['classique'], purchases: [], badges: [], titles: [],
                totalWins: 0, totalLosses: 0, totalCarreaux: 0, arcadeProgress: 0
            });

            const result = addRookiePoints(1);
            expect(result.totalPoints).toBe(32);
            expect(result.abilitiesUnlocked).toContain('naturel');
        });
    });
});
