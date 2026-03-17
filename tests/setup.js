// Mock Phaser globals for unit testing (no DOM/Canvas needed)
import { vi } from 'vitest';

// Minimal Phaser mock
globalThis.Phaser = {
    Math: {
        Between: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
        Clamp: (val, min, max) => Math.min(Math.max(val, min), max),
        Linear: (a, b, t) => a + (b - a) * t
    },
    Input: {
        Keyboard: {
            JustDown: () => false
        }
    }
};

// Mock SoundManager (all exports are no-ops)
vi.mock('../src/utils/SoundManager.js', () => ({
    sfxBouleBoule: vi.fn(),
    sfxBouleCochonnet: vi.fn(),
    sfxLanding: vi.fn(),
    sfxRoll: vi.fn(),
    sfxCarreau: vi.fn(),
    sfxThrow: vi.fn(),
    sfxVictory: vi.fn(),
    sfxDefeat: vi.fn(),
    sfxScore: vi.fn(),
    sfxUIClick: vi.fn()
}));
