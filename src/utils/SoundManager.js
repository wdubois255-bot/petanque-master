// Sound Manager - Uses real audio files (ElevenLabs) with procedural fallback
// Requires Phaser scene reference for file-based audio

import { loadSave, saveSave } from './SaveManager.js';

let ctx = null;
let cigalesSource = null;
let _scene = null;
let _musicPlaying = null;

// Global settings (persisted via SaveManager)
let _masterVolume = 1.0;
let _musicVolume = 1.0;
let _sfxVolume = 1.0;
let _muted = false;

// Load settings from SaveManager
try {
    const save = loadSave();
    if (save.audioSettings) {
        _masterVolume = save.audioSettings.masterVolume ?? 1.0;
        _musicVolume = save.audioSettings.musicVolume ?? 1.0;
        _sfxVolume = save.audioSettings.sfxVolume ?? 1.0;
        _muted = save.audioSettings.muted ?? false;
    }
} catch (e) { /* ignore */ }

function _saveAudioSettings() {
    try {
        const save = loadSave();
        save.audioSettings = {
            masterVolume: _masterVolume, musicVolume: _musicVolume,
            sfxVolume: _sfxVolume, muted: _muted
        };
        saveSave(save);
    } catch (e) { /* ignore */ }
}

function _effectiveVol(base, isSfx = true) {
    if (_muted) return 0;
    return base * _masterVolume * (isSfx ? _sfxVolume : _musicVolume);
}

/** Get/set audio settings */
export function getAudioSettings() {
    return { masterVolume: _masterVolume, musicVolume: _musicVolume, sfxVolume: _sfxVolume, muted: _muted };
}
export function setMasterVolume(v) { _masterVolume = Math.max(0, Math.min(1, v)); _saveAudioSettings(); _applyMusicVolume(); }
export function setMusicVolumeLevel(v) { _musicVolume = Math.max(0, Math.min(1, v)); _saveAudioSettings(); _applyMusicVolume(); }
export function setSfxVolume(v) { _sfxVolume = Math.max(0, Math.min(1, v)); _saveAudioSettings(); }
export function setMuted(m) { _muted = m; _saveAudioSettings(); _applyMusicVolume(); }
export function toggleMute() { _muted = !_muted; _saveAudioSettings(); _applyMusicVolume(); return _muted; }

function _applyMusicVolume() {
    if (_musicPlaying) {
        _musicPlaying.volume = _muted ? 0 : _musicVolume * _masterVolume * 0.25;
    }
}

/** Set the active Phaser scene (call once per scene create) */
export function setSoundScene(scene) {
    _scene = scene;
}

function getCtx() {
    if (!ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return null;
        try {
            ctx = new AudioCtx();
        } catch { return null; }
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
}

/** Play a Phaser audio key if loaded, return true if played */
function playFile(key, config = {}) {
    if (_muted) return _scene && _scene.cache.audio.exists(key);
    if (_scene && _scene.cache.audio.exists(key)) {
        const baseVol = config.volume ?? 0.5;
        _scene.sound.play(key, { ...config, volume: _effectiveVol(baseVol) });
        return true;
    }
    return false;
}

// === Procedural helpers (fallback) ===

function playTone(freq, duration, type = 'sine', volume = 0.3, decay = true) {
    const c = getCtx();
    if (!c) return;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, c.currentTime);
    gain.gain.setValueAtTime(volume, c.currentTime);
    if (decay) {
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
    }
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + duration);
}

function playNoise(duration, volume = 0.15, filterFreq = 2000, filterType = 'lowpass') {
    const c = getCtx();
    if (!c) return;
    const bufferSize = c.sampleRate * duration;
    const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    const source = c.createBufferSource();
    source.buffer = buffer;
    const filter = c.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.setValueAtTime(filterFreq, c.currentTime);
    const gain = c.createGain();
    gain.gain.setValueAtTime(volume, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(c.destination);
    source.start(c.currentTime);
}

// === Charging sound (drag-to-aim tension) ===
let _chargingOsc = null;
let _chargingGain = null;
let _chargingFilter = null;

export function startChargingSound() {
    if (_muted || _chargingOsc) return;
    const c = getCtx();
    if (!c) return;
    _chargingOsc = c.createOscillator();
    _chargingGain = c.createGain();
    _chargingFilter = c.createBiquadFilter();
    _chargingOsc.type = 'sine';
    _chargingOsc.frequency.setValueAtTime(120, c.currentTime);
    _chargingFilter.type = 'lowpass';
    _chargingFilter.frequency.setValueAtTime(300, c.currentTime);
    _chargingFilter.Q.setValueAtTime(2, c.currentTime);
    _chargingGain.gain.setValueAtTime(0, c.currentTime);
    _chargingOsc.connect(_chargingFilter);
    _chargingFilter.connect(_chargingGain);
    _chargingGain.connect(c.destination);
    _chargingOsc.start();
}

/** Update charging sound: power 0-1 maps to pitch/volume/filter */
export function updateChargingSound(power) {
    if (!_chargingOsc || !_chargingGain || !_chargingFilter) return;
    const c = getCtx();
    if (!c) return;
    const t = c.currentTime;
    const vol = Math.min(power * 0.12, 0.12) * _masterVolume * _sfxVolume;
    const freq = 120 + power * 280; // 120Hz → 400Hz
    const filterFreq = 300 + power * 1200; // 300Hz → 1500Hz
    _chargingOsc.frequency.setTargetAtTime(freq, t, 0.05);
    _chargingGain.gain.setTargetAtTime(vol, t, 0.05);
    _chargingFilter.frequency.setTargetAtTime(filterFreq, t, 0.05);
}

export function stopChargingSound() {
    if (_chargingOsc) {
        const c = getCtx();
        if (c && _chargingGain) {
            _chargingGain.gain.setTargetAtTime(0, c.currentTime, 0.02);
        }
        try { _chargingOsc.stop(c ? c.currentTime + 0.1 : 0); } catch (e) { /* already stopped */ }
        _chargingOsc = null;
        _chargingGain = null;
        _chargingFilter = null;
    }
}

// === SFX exports ===

export function sfxBouleBoule() {
    if (playFile('sfx_boule_clac', { rate: 0.9 + Math.random() * 0.2 })) return;
    playTone(800, 0.08, 'square', 0.25);
    playTone(1200, 0.05, 'square', 0.15);
    playTone(1600, 0.04, 'sine', 0.08);
    playNoise(0.06, 0.2, 4000);
}

export function sfxBouleCochonnet() {
    if (playFile('sfx_cochonnet_touche', { rate: 0.9 + Math.random() * 0.2 })) return;
    playTone(1400, 0.06, 'square', 0.2);
    playTone(2000, 0.04, 'sine', 0.1);
    playNoise(0.04, 0.12, 5000);
}

export function sfxLanding(terrainType = 'terre') {
    if (playFile('sfx_boule_atterrissage', { rate: 0.9 + Math.random() * 0.2 })) return;
    const freqMap = { terre: 200, herbe: 300, sable: 150, dalles: 600 };
    const noiseMap = { terre: 1500, herbe: 1000, sable: 800, dalles: 3000 };
    const freq = freqMap[terrainType] || 200;
    const nf = noiseMap[terrainType] || 1500;
    playTone(freq, 0.12, 'sine', 0.2);
    playNoise(0.1, 0.15, nf);
    playNoise(0.08, 0.1, 1400, 'bandpass');
}

export function sfxRoll() {
    if (playFile('sfx_boule_roulement', { volume: 0.25 })) return;
    playNoise(0.08, 0.04, 400);
}

export function sfxCarreau() {
    if (playFile('sfx_carreau', { volume: 0.7, rate: 0.9 + Math.random() * 0.2 })) return;
    let c;
    try {
        c = getCtx();
        if (!c) return;
    } catch { return; }
    const now = c.currentTime;
    // ±7% pitch randomization per call to avoid repetitive feeling
    const rnd = () => 1.0 + (Math.random() * 0.14 - 0.07);

    // Layer 1 — Attack/Impact: metallic "CLAC" (0-50ms)
    // Square wave + bandpass filter for authentic metal hit character
    const attackFreq = 900 * rnd();
    const oscAttack = c.createOscillator();
    const gainAttack = c.createGain();
    const attackFilter = c.createBiquadFilter();
    oscAttack.type = 'square';
    oscAttack.frequency.setValueAtTime(attackFreq, now);
    attackFilter.type = 'bandpass';
    attackFilter.frequency.setValueAtTime(1800, now);
    attackFilter.Q.setValueAtTime(3, now);
    gainAttack.gain.setValueAtTime(_effectiveVol(0.28), now);
    gainAttack.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    oscAttack.connect(attackFilter);
    attackFilter.connect(gainAttack);
    gainAttack.connect(c.destination);
    oscAttack.start(now);
    oscAttack.stop(now + 0.05);

    // Layer 2 — Body/Resonance: deep metallic ring with LFO modulation (5ms-500ms)
    // LFO creates subtle vibrato effect like real metal resonance
    const bodyFreq = 400 * rnd();
    const oscBody = c.createOscillator();
    const gainBody = c.createGain();
    const lfo = c.createOscillator();
    const lfoGain = c.createGain();
    oscBody.type = 'sine';
    oscBody.frequency.setValueAtTime(bodyFreq, now + 0.005);
    // Frequency sweep: slight downward pitch for natural ring decay
    oscBody.frequency.exponentialRampToValueAtTime(bodyFreq * 0.85, now + 0.5);
    gainBody.gain.setValueAtTime(_effectiveVol(0.10), now + 0.005);
    gainBody.gain.exponentialRampToValueAtTime(0.001, now + 0.505);
    // LFO: tremolo at ~12 Hz (metal vibration speed)
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(12, now);
    lfoGain.gain.setValueAtTime(0.015, now);
    lfo.connect(lfoGain);
    lfoGain.connect(gainBody.gain);
    oscBody.connect(gainBody);
    gainBody.connect(c.destination);
    oscBody.start(now + 0.005);
    oscBody.stop(now + 0.505);
    lfo.start(now + 0.005);
    lfo.stop(now + 0.505);

    // Layer 2b — Harmonic overtone: adds richness (second harmonic)
    const oscHarm = c.createOscillator();
    const gainHarm = c.createGain();
    oscHarm.type = 'sine';
    oscHarm.frequency.setValueAtTime(bodyFreq * 2.4, now + 0.003);
    oscHarm.frequency.exponentialRampToValueAtTime(bodyFreq * 2, now + 0.4);
    gainHarm.gain.setValueAtTime(_effectiveVol(0.03), now + 0.003);
    gainHarm.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    oscHarm.connect(gainHarm);
    gainHarm.connect(c.destination);
    oscHarm.start(now + 0.003);
    oscHarm.stop(now + 0.35);

    // Layer 3 — Tail/Echo: 3 delayed reflections with lowpass decay (spatial depth)
    const echoFreq = 300 * rnd();
    const echoes = [
        { delay: 0.06, vol: 0.045, filterFreq: 2500 },
        { delay: 0.12, vol: 0.025, filterFreq: 1800 },
        { delay: 0.20, vol: 0.012, filterFreq: 1200 }
    ];
    for (const echo of echoes) {
        const oscEcho = c.createOscillator();
        const gainEcho = c.createGain();
        const echoFilter = c.createBiquadFilter();
        oscEcho.type = 'sine';
        oscEcho.frequency.setValueAtTime(echoFreq, now + echo.delay);
        echoFilter.type = 'lowpass';
        echoFilter.frequency.setValueAtTime(echo.filterFreq, now + echo.delay);
        gainEcho.gain.setValueAtTime(_effectiveVol(echo.vol), now + echo.delay);
        gainEcho.gain.exponentialRampToValueAtTime(0.001, now + echo.delay + 0.12);
        oscEcho.connect(echoFilter);
        echoFilter.connect(gainEcho);
        gainEcho.connect(c.destination);
        oscEcho.start(now + echo.delay);
        oscEcho.stop(now + echo.delay + 0.12);
    }

    // Layer 4 — Brightness: shaped noise burst for "snap" (0-25ms)
    // Bandpass filtered for more metallic character
    const noiseDuration = 0.025;
    const bufferSize = Math.floor(c.sampleRate * noiseDuration);
    const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    const noiseSource = c.createBufferSource();
    noiseSource.buffer = buffer;
    const noiseFilter = c.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(3500, now);
    noiseFilter.Q.setValueAtTime(2, now);
    const gainNoise = c.createGain();
    gainNoise.gain.setValueAtTime(_effectiveVol(0.04), now);
    gainNoise.gain.exponentialRampToValueAtTime(0.001, now + noiseDuration);
    noiseSource.connect(noiseFilter);
    noiseFilter.connect(gainNoise);
    gainNoise.connect(c.destination);
    noiseSource.start(now);

    // Layer 5 — Sub-bass thump: ground impact sensation (0-80ms)
    // Low frequency gives physical "weight" to the hit
    const oscSub = c.createOscillator();
    const gainSub = c.createGain();
    oscSub.type = 'sine';
    oscSub.frequency.setValueAtTime(80, now);
    oscSub.frequency.exponentialRampToValueAtTime(40, now + 0.08);
    gainSub.gain.setValueAtTime(_effectiveVol(0.06), now);
    gainSub.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    oscSub.connect(gainSub);
    gainSub.connect(c.destination);
    oscSub.start(now);
    oscSub.stop(now + 0.08);
}

export function sfxThrow() {
    if (playFile('sfx_lancer_swoosh', { rate: 0.9 + Math.random() * 0.2 })) return;
    const c = getCtx();
    if (!c) return;
    const bufferSize = c.sampleRate * 0.2;
    const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const source = c.createBufferSource();
    source.buffer = buffer;
    const filter = c.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2000, c.currentTime);
    filter.frequency.exponentialRampToValueAtTime(500, c.currentTime + 0.2);
    const gain = c.createGain();
    gain.gain.setValueAtTime(0.15, c.currentTime);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(c.destination);
    source.start(c.currentTime);
}

export function sfxUIClick() {
    if (playFile('sfx_ui_click', { volume: 0.4 })) return;
    // Wood "toc" — short triangle wave with fast decay
    const c = getCtx();
    if (!c) return;
    const vol = _effectiveVol(0.15);
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'triangle';
    osc.frequency.value = 800;
    gain.gain.setValueAtTime(vol, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.03);
    osc.connect(gain).connect(c.destination);
    osc.start();
    osc.stop(c.currentTime + 0.04);
}

export function sfxUIHover() {
    if (playFile('sfx_ui_click', { volume: 0.3, rate: 1.3 })) return;
    // Same as click but softer and higher pitch
    const c = getCtx();
    if (!c) return;
    const vol = _effectiveVol(0.08);
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'triangle';
    osc.frequency.value = 1100;
    gain.gain.setValueAtTime(vol, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.02);
    osc.connect(gain).connect(c.destination);
    osc.start();
    osc.stop(c.currentTime + 0.025);
}

export function sfxUINavigate() {
    const c = getCtx();
    if (!c) return;
    const vol = _effectiveVol(0.08);
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(500, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(700, c.currentTime + 0.06);
    gain.gain.setValueAtTime(vol, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.06);
    osc.connect(gain).connect(c.destination);
    osc.start();
    osc.stop(c.currentTime + 0.07);
}

export function sfxPurchase() {
    const c = getCtx();
    if (!c) return;
    const vol = _effectiveVol(0.12);
    const now = c.currentTime;
    // Coin clink sound
    [1200, 1600, 2000].forEach((freq, i) => {
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(vol * (1 - i * 0.25), now + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.1);
        osc.connect(gain).connect(c.destination);
        osc.start(now + i * 0.06);
        osc.stop(now + i * 0.06 + 0.1);
    });
}

export function sfxLevelUp() {
    const c = getCtx();
    if (!c) return;
    const vol = _effectiveVol(0.12);
    const now = c.currentTime;
    // Short ascending fanfare
    [523, 659, 784, 1047].forEach((freq, i) => {
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = 'square';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(vol, now + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.25);
        osc.connect(gain).connect(c.destination);
        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.25);
    });
}

export function sfxVictory() {
    if (playFile('sfx_victoire', { volume: 0.6 })) return;
    const c = getCtx();
    if (!c) return;
    const now = c.currentTime;
    [392, 494, 587, 784, 784].forEach((freq, i) => {
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, now + i * 0.15);
        gain.gain.setValueAtTime(0.15, now + i * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.4);
        osc.connect(gain);
        gain.connect(c.destination);
        osc.start(now + i * 0.15);
        osc.stop(now + i * 0.15 + 0.4);
    });
}

export function sfxDefeat() {
    if (playFile('sfx_defaite', { volume: 0.6 })) return;
    const c = getCtx();
    if (!c) return;
    const now = c.currentTime;
    [400, 350, 300, 250].forEach((freq, i) => {
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.2);
        gain.gain.setValueAtTime(0.15, now + i * 0.2);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.2 + 0.5);
        osc.connect(gain);
        gain.connect(c.destination);
        osc.start(now + i * 0.2);
        osc.stop(now + i * 0.2 + 0.5);
    });
}

export function sfxScore() {
    if (playFile('sfx_point_marque', { volume: 0.5 })) return;
    playTone(880, 0.15, 'sine', 0.15);
    // Use Phaser timer if available, otherwise schedule via AudioContext
    if (_scene && _scene.time) {
        _scene.time.delayedCall(100, () => playTone(1100, 0.2, 'sine', 0.12));
    } else {
        const c = getCtx();
        if (c) {
            // Schedule second tone 100ms later via Web Audio timing
            const now = c.currentTime;
            const osc = c.createOscillator();
            const gain = c.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1100, now + 0.1);
            gain.gain.setValueAtTime(0.12, now + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
            osc.connect(gain);
            gain.connect(c.destination);
            osc.start(now + 0.1);
            osc.stop(now + 0.3);
        }
    }
}

export function sfxVSSlam() {
    // Heavy impact for VS screen slam (playTone already has null guard)
    playTone(100, 0.2, 'square', 0.3);
    playTone(60, 0.3, 'sawtooth', 0.2);
    playNoise(0.15, 0.25, 1200);
}

// === SHOT RESULT SFX (procedural, AXE B Phase 3) ===

/** Palet — impact metallique + grattement court (~250ms) */
export function sfxPalet() {
    if (playFile('sfx_palet', { volume: 0.6 })) return;
    let c;
    try { c = getCtx(); if (!c) return; } catch { return; }
    const now = c.currentTime;

    // Layer 1 — Impact metallique
    const osc1 = c.createOscillator();
    const gain1 = c.createGain();
    const filter1 = c.createBiquadFilter();
    osc1.type = 'square';
    osc1.frequency.setValueAtTime(750, now);
    osc1.frequency.exponentialRampToValueAtTime(300, now + 0.06);
    filter1.type = 'bandpass';
    filter1.frequency.setValueAtTime(1500, now);
    filter1.Q.setValueAtTime(2, now);
    gain1.gain.setValueAtTime(_effectiveVol(0.20), now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc1.connect(filter1); filter1.connect(gain1); gain1.connect(c.destination);
    osc1.start(now); osc1.stop(now + 0.08);

    // Layer 2 — Grattement (white noise scrape)
    const bufSize = Math.floor(c.sampleRate * 0.2);
    const buf = c.createBuffer(1, bufSize, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = c.createBufferSource();
    noise.buffer = buf;
    const noiseFilter = c.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(3500, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(1200, now + 0.2);
    noiseFilter.Q.setValueAtTime(1.5, now);
    const gainNoise = c.createGain();
    gainNoise.gain.setValueAtTime(_effectiveVol(0.08), now);
    gainNoise.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    noise.connect(noiseFilter); noiseFilter.connect(gainNoise); gainNoise.connect(c.destination);
    noise.start(now);

    // Layer 3 — Thud sourd (sub)
    const osc3 = c.createOscillator();
    const gain3 = c.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(120, now);
    osc3.frequency.exponentialRampToValueAtTime(60, now + 0.1);
    gain3.gain.setValueAtTime(_effectiveVol(0.06), now);
    gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc3.connect(gain3); gain3.connect(c.destination);
    osc3.start(now); osc3.stop(now + 0.1);
}

/** Casquette — petit "tic" sec et decevant (~50ms) */
export function sfxCasquette() {
    if (playFile('sfx_casquette', { volume: 0.5 })) return;
    let c;
    try { c = getCtx(); if (!c) return; } catch { return; }
    const now = c.currentTime;

    // Layer 1 — Tap leger triangle
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1100, now);
    gain.gain.setValueAtTime(_effectiveVol(0.10), now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    osc.connect(gain); gain.connect(c.destination);
    osc.start(now); osc.stop(now + 0.04);

    // Layer 2 — Click HF (snap)
    const bufSize = Math.floor(c.sampleRate * 0.015);
    const buf = c.createBuffer(1, bufSize, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = c.createBufferSource();
    noise.buffer = buf;
    const hpf = c.createBiquadFilter();
    hpf.type = 'highpass';
    hpf.frequency.setValueAtTime(3000, now);
    const gainN = c.createGain();
    gainN.gain.setValueAtTime(_effectiveVol(0.04), now);
    gainN.gain.exponentialRampToValueAtTime(0.001, now + 0.015);
    noise.connect(hpf); hpf.connect(gainN); gainN.connect(c.destination);
    noise.start(now);
}

/** Ciseau — double impact metallique rapide "TAC-TAC" (~500ms) */
export function sfxCiseau() {
    if (playFile('sfx_ciseau', { volume: 0.7 })) return;
    let c;
    try { c = getCtx(); if (!c) return; } catch { return; }
    const now = c.currentTime;

    // Layer 1a — Premier impact
    const osc1a = c.createOscillator();
    const gain1a = c.createGain();
    const filter1a = c.createBiquadFilter();
    osc1a.type = 'square';
    osc1a.frequency.setValueAtTime(850, now);
    osc1a.frequency.exponentialRampToValueAtTime(400, now + 0.05);
    filter1a.type = 'bandpass';
    filter1a.frequency.setValueAtTime(1800, now);
    filter1a.Q.setValueAtTime(2.5, now);
    gain1a.gain.setValueAtTime(_effectiveVol(0.22), now);
    gain1a.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc1a.connect(filter1a); filter1a.connect(gain1a); gain1a.connect(c.destination);
    osc1a.start(now); osc1a.stop(now + 0.1);

    // Layer 1b — Deuxieme impact (+80ms, pitch legerement plus haut)
    const osc1b = c.createOscillator();
    const gain1b = c.createGain();
    const filter1b = c.createBiquadFilter();
    osc1b.type = 'square';
    osc1b.frequency.setValueAtTime(950, now + 0.08);
    osc1b.frequency.exponentialRampToValueAtTime(450, now + 0.13);
    filter1b.type = 'bandpass';
    filter1b.frequency.setValueAtTime(2000, now + 0.08);
    filter1b.Q.setValueAtTime(2.5, now + 0.08);
    gain1b.gain.setValueAtTime(_effectiveVol(0.18), now + 0.08);
    gain1b.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc1b.connect(filter1b); filter1b.connect(gain1b); gain1b.connect(c.destination);
    osc1b.start(now + 0.08); osc1b.stop(now + 0.18);

    // Layer 2 — Resonance metallique combinee (+30ms)
    const osc2 = c.createOscillator();
    const gain2 = c.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(500, now + 0.03);
    osc2.frequency.exponentialRampToValueAtTime(350, now + 0.43);
    gain2.gain.setValueAtTime(_effectiveVol(0.06), now + 0.03);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.43);
    osc2.connect(gain2); gain2.connect(c.destination);
    osc2.start(now + 0.03); osc2.stop(now + 0.43);

    // Layer 3 — Noise burst eclat
    const bufSize = Math.floor(c.sampleRate * 0.03);
    const buf = c.createBuffer(1, bufSize, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = c.createBufferSource();
    noise.buffer = buf;
    const noiseFilter = c.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(3000, now);
    noiseFilter.Q.setValueAtTime(2, now);
    const gainN = c.createGain();
    gainN.gain.setValueAtTime(_effectiveVol(0.05), now);
    gainN.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
    noise.connect(noiseFilter); noiseFilter.connect(gainN); gainN.connect(c.destination);
    noise.start(now);
}

/** Biberon — "toc" bois (cochonnet) + foule surprise (~750ms) */
export function sfxBiberon() {
    if (playFile('sfx_biberon', { volume: 0.55 })) return;
    let c;
    try { c = getCtx(); if (!c) return; } catch { return; }
    const now = c.currentTime;

    // Layer 1 — Wood hit (cochonnet)
    const osc1 = c.createOscillator();
    const gain1 = c.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(600, now);
    osc1.frequency.exponentialRampToValueAtTime(400, now + 0.06);
    gain1.gain.setValueAtTime(_effectiveVol(0.12), now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc1.connect(gain1); gain1.connect(c.destination);
    osc1.start(now); osc1.stop(now + 0.08);

    // Layer 2 — Resonance bois
    const osc2 = c.createOscillator();
    const gain2 = c.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(900, now + 0.005);
    gain2.gain.setValueAtTime(_effectiveVol(0.04), now + 0.005);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.055);
    osc2.connect(gain2); gain2.connect(c.destination);
    osc2.start(now + 0.005); osc2.stop(now + 0.055);

    // Layer 3 — Crowd "ooh" surprise (+200ms)
    const osc3 = c.createOscillator();
    const gain3 = c.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(250, now + 0.2);
    osc3.frequency.linearRampToValueAtTime(350, now + 0.35);
    osc3.frequency.linearRampToValueAtTime(250, now + 0.65);
    gain3.gain.setValueAtTime(0, now + 0.2);
    gain3.gain.linearRampToValueAtTime(_effectiveVol(0.05), now + 0.3);
    gain3.gain.linearRampToValueAtTime(_effectiveVol(0.03), now + 0.5);
    gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
    osc3.connect(gain3); gain3.connect(c.destination);
    osc3.start(now + 0.2); osc3.stop(now + 0.7);

    const osc4 = c.createOscillator();
    const gain4 = c.createGain();
    osc4.type = 'sine';
    osc4.frequency.setValueAtTime(200, now + 0.22);
    osc4.frequency.linearRampToValueAtTime(300, now + 0.37);
    osc4.frequency.linearRampToValueAtTime(200, now + 0.67);
    gain4.gain.setValueAtTime(0, now + 0.22);
    gain4.gain.linearRampToValueAtTime(_effectiveVol(0.03), now + 0.32);
    gain4.gain.exponentialRampToValueAtTime(0.001, now + 0.72);
    osc4.connect(gain4); gain4.connect(c.destination);
    osc4.start(now + 0.22); osc4.stop(now + 0.72);
}

/** Contre — impact sourd + foule qui grimace (~800ms) */
export function sfxContre() {
    if (playFile('sfx_contre', { volume: 0.6 })) return;
    let c;
    try { c = getCtx(); if (!c) return; } catch { return; }
    const now = c.currentTime;

    // Layer 1 — Thud sourd decevant
    const osc1 = c.createOscillator();
    const gain1 = c.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(200, now);
    osc1.frequency.exponentialRampToValueAtTime(80, now + 0.15);
    gain1.gain.setValueAtTime(_effectiveVol(0.15), now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc1.connect(gain1); gain1.connect(c.destination);
    osc1.start(now); osc1.stop(now + 0.15);

    // Layer 2 — Buzz desagreable (sawtooth grave)
    const osc2 = c.createOscillator();
    const gain2 = c.createGain();
    const filter2 = c.createBiquadFilter();
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(120, now);
    filter2.type = 'lowpass';
    filter2.frequency.setValueAtTime(300, now);
    gain2.gain.setValueAtTime(_effectiveVol(0.04), now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc2.connect(filter2); filter2.connect(gain2); gain2.connect(c.destination);
    osc2.start(now); osc2.stop(now + 0.1);

    // Layer 3 — Crowd groan (+150ms)
    const osc3 = c.createOscillator();
    const gain3 = c.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(300, now + 0.15);
    osc3.frequency.linearRampToValueAtTime(150, now + 0.75);
    gain3.gain.setValueAtTime(0, now + 0.15);
    gain3.gain.linearRampToValueAtTime(_effectiveVol(0.05), now + 0.25);
    gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
    osc3.connect(gain3); gain3.connect(c.destination);
    osc3.start(now + 0.15); osc3.stop(now + 0.85);

    const osc4 = c.createOscillator();
    const gain4 = c.createGain();
    osc4.type = 'triangle';
    osc4.frequency.setValueAtTime(250, now + 0.2);
    osc4.frequency.linearRampToValueAtTime(120, now + 0.8);
    gain4.gain.setValueAtTime(0, now + 0.2);
    gain4.gain.linearRampToValueAtTime(_effectiveVol(0.03), now + 0.3);
    gain4.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    osc4.connect(gain4); gain4.connect(c.destination);
    osc4.start(now + 0.2); osc4.stop(now + 0.8);
}

/** Trou — impact mat dans la terre + silence pesant (~100ms actif) */
export function sfxTrou() {
    if (playFile('sfx_trou', { volume: 0.5 })) return;
    let c;
    try { c = getCtx(); if (!c) return; } catch { return; }
    const now = c.currentTime;

    // Layer 1 — Ground impact (terre)
    const bufSize = Math.floor(c.sampleRate * 0.1);
    const buf = c.createBuffer(1, bufSize, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = c.createBufferSource();
    noise.buffer = buf;
    const lpf = c.createBiquadFilter();
    lpf.type = 'lowpass';
    lpf.frequency.setValueAtTime(800, now);
    const gainN = c.createGain();
    gainN.gain.setValueAtTime(_effectiveVol(0.10), now);
    gainN.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    noise.connect(lpf); lpf.connect(gainN); gainN.connect(c.destination);
    noise.start(now);

    // Layer 2 — Thud very low
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(100, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.08);
    gain.gain.setValueAtTime(_effectiveVol(0.08), now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(gain); gain.connect(c.destination);
    osc.start(now); osc.stop(now + 0.08);
    // Le silence qui suit EST le son du trou
}

// === CONTINUOUS ROLLING SOUND (Web Audio pink noise) ===

let _rollingSource = null;
let _rollingGain = null;
let _rollingFilter = null;

/** Start a continuous rolling noise loop (pink noise filtered) */
export function startRollingSound() {
    if (_rollingSource) return;
    const c = getCtx();
    if (!c) return;
    // Create 2-second pink noise buffer
    const duration = 2;
    const bufferSize = c.sampleRate * duration;
    const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
    const data = buffer.getChannelData(0);
    // Pink noise approximation
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.05;
        b6 = white * 0.115926;
    }

    _rollingSource = c.createBufferSource();
    _rollingSource.buffer = buffer;
    _rollingSource.loop = true;

    _rollingFilter = c.createBiquadFilter();
    _rollingFilter.type = 'lowpass';
    _rollingFilter.frequency.value = 800;

    _rollingGain = c.createGain();
    _rollingGain.gain.value = 0; // start silent

    _rollingSource.connect(_rollingFilter);
    _rollingFilter.connect(_rollingGain);
    _rollingGain.connect(c.destination);
    _rollingSource.start();
}

/** Update volume and pitch based on ball speed (0-1 normalized) */
export function updateRollingSound(normalizedSpeed) {
    if (!_rollingGain || !_rollingFilter || !_rollingSource) return;
    const c = getCtx();
    // Volume: proportional to speed, max 0.15
    const targetVol = Math.min(normalizedSpeed * 0.2, 0.15);
    _rollingGain.gain.setTargetAtTime(targetVol, c.currentTime, 0.05);
    // Filter frequency: higher = faster rolling (800 to 3000 Hz)
    const targetFreq = 800 + normalizedSpeed * 2200;
    _rollingFilter.frequency.setTargetAtTime(targetFreq, c.currentTime, 0.05);
    // Playback rate: slight pitch increase with speed (1.0 to 1.5)
    _rollingSource.playbackRate.setTargetAtTime(1.0 + normalizedSpeed * 0.5, c.currentTime, 0.05);
}

/** Stop rolling sound */
export function stopRollingSound() {
    if (_rollingSource) {
        try { _rollingSource.stop(); } catch (e) { /* ignore */ }
        _rollingSource = null;
    }
    _rollingGain = null;
    _rollingFilter = null;
}

/** Set music volume (0-1). Used for dramatic pause. */
export function setMusicVolume(vol) {
    if (_musicPlaying) {
        _musicPlaying.volume = vol;
    }
}

// === CROWD REACTIONS (procedural, no files needed) ===

export function sfxCrowdApplause() {
    // Try file first
    if (playFile('sfx_crowd_applause', { volume: 0.35 })) return;
    // Procedural: multiple claps over 2s
    const c = getCtx();
    const now = c.currentTime;
    for (let i = 0; i < 15; i++) {
        const delay = Math.random() * 1.5;
        const duration = 0.03 + Math.random() * 0.02;
        const bufferSize = Math.floor(c.sampleRate * duration);
        const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
        const data = buffer.getChannelData(0);
        for (let j = 0; j < bufferSize; j++) {
            data[j] = (Math.random() * 2 - 1) * (1 - j / bufferSize);
        }
        const source = c.createBufferSource();
        source.buffer = buffer;
        const filter = c.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1500 + Math.random() * 1000;
        filter.Q.value = 2;
        const gain = c.createGain();
        gain.gain.setValueAtTime(0.04 + Math.random() * 0.03, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + duration + 0.1);
        source.connect(filter);
        filter.connect(gain);
        gain.connect(c.destination);
        source.start(now + delay);
    }
}

export function sfxCrowdCheer() {
    // Try file first
    if (playFile('sfx_crowd_cheer', { volume: 0.4 })) return;
    // Procedural: excited "ouais" approximation
    const c = getCtx();
    const now = c.currentTime;
    // Multiple tones rising in pitch (crowd excitement)
    const freqs = [200, 250, 300, 350, 400];
    freqs.forEach((freq, i) => {
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.linearRampToValueAtTime(freq * 1.5, now + 0.3);
        gain.gain.setValueAtTime(0.02, now);
        gain.gain.linearRampToValueAtTime(0.05, now + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        osc.connect(gain);
        gain.connect(c.destination);
        osc.start(now + i * 0.02);
        osc.stop(now + 0.6);
    });
    // Add noise burst
    playNoise(0.3, 0.06, 2000, 'bandpass');
}

export function sfxCrowdGroan() {
    // Try file first
    if (playFile('sfx_crowd_groan', { volume: 0.3 })) return;
    // Procedural: disappointed "ohhh" descending
    const c = getCtx();
    const now = c.currentTime;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.linearRampToValueAtTime(150, now + 0.6);
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.linearRampToValueAtTime(0.03, now + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(now);
    osc.stop(now + 0.8);
    // Second voice
    const osc2 = c.createOscillator();
    const gain2 = c.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(250, now + 0.05);
    osc2.frequency.linearRampToValueAtTime(120, now + 0.65);
    gain2.gain.setValueAtTime(0.04, now + 0.05);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
    osc2.connect(gain2);
    gain2.connect(c.destination);
    osc2.start(now + 0.05);
    osc2.stop(now + 0.7);
}

/** sfxCrowdGasp — Aspiration breve de surprise (~200ms). Sur casquette. */
export function sfxCrowdGasp() {
    let c;
    try { c = getCtx(); if (!c) return; } catch { return; }
    const now = c.currentTime;
    // Layer 1 — Intake (aspiration HF)
    const bufSize = Math.floor(c.sampleRate * 0.15);
    const buf = c.createBuffer(1, bufSize, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) d[i] = Math.random() * 2 - 1;
    const noise = c.createBufferSource();
    noise.buffer = buf;
    const hpf = c.createBiquadFilter();
    hpf.type = 'highpass'; hpf.frequency.value = 1000;
    const gn1 = c.createGain();
    gn1.gain.setValueAtTime(_effectiveVol(0.04), now);
    gn1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    noise.connect(hpf); hpf.connect(gn1); gn1.connect(c.destination);
    noise.start(now);
    // Layer 2 — Murmure surprise montant
    const osc1 = c.createOscillator();
    const gn2 = c.createGain();
    osc1.frequency.setValueAtTime(350, now);
    osc1.frequency.linearRampToValueAtTime(400, now + 0.18);
    gn2.gain.setValueAtTime(0, now);
    gn2.gain.linearRampToValueAtTime(_effectiveVol(0.03), now + 0.05);
    gn2.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc1.connect(gn2); gn2.connect(c.destination);
    osc1.start(now); osc1.stop(now + 0.2);
    // Layer 3 — Seconde voix decalee
    const osc2 = c.createOscillator();
    const gn3 = c.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(280, now + 0.02);
    osc2.frequency.linearRampToValueAtTime(320, now + 0.18);
    gn3.gain.setValueAtTime(0, now + 0.02);
    gn3.gain.linearRampToValueAtTime(_effectiveVol(0.02), now + 0.07);
    gn3.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc2.connect(gn3); gn3.connect(c.destination);
    osc2.start(now + 0.02); osc2.stop(now + 0.2);
}

/** sfxCrowdBoo — Desapprobation collective (~800ms). Sur contre ou erreur grave. */
export function sfxCrowdBoo() {
    let c;
    try { c = getCtx(); if (!c) return; } catch { return; }
    const now = c.currentTime;
    // Layer 1 — Grondement grave
    const osc1 = c.createOscillator();
    const gn1 = c.createGain();
    osc1.frequency.value = 150;
    gn1.gain.setValueAtTime(0, now);
    gn1.gain.linearRampToValueAtTime(_effectiveVol(0.05), now + 0.1);
    gn1.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    osc1.connect(gn1); gn1.connect(c.destination);
    osc1.start(now); osc1.stop(now + 0.82);
    // Layer 2 — Voix descendante sawtooth
    const osc2 = c.createOscillator();
    const flt2 = c.createBiquadFilter();
    const gn2 = c.createGain();
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(200, now);
    osc2.frequency.linearRampToValueAtTime(100, now + 0.6);
    flt2.type = 'lowpass'; flt2.frequency.value = 400;
    gn2.gain.setValueAtTime(0, now);
    gn2.gain.linearRampToValueAtTime(_effectiveVol(0.03), now + 0.1);
    gn2.gain.exponentialRampToValueAtTime(0.001, now + 0.72);
    osc2.connect(flt2); flt2.connect(gn2); gn2.connect(c.destination);
    osc2.start(now); osc2.stop(now + 0.75);
    // Layer 3 — Noise murmure brun
    const bufSize = Math.floor(c.sampleRate * 0.6);
    const buf = c.createBuffer(1, bufSize, c.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < bufSize; i++) { const w = Math.random() * 2 - 1; d[i] = (last + 0.02 * w) / 1.02; last = d[i]; d[i] *= 3.5; }
    const ns = c.createBufferSource(); ns.buffer = buf;
    const lpf = c.createBiquadFilter(); lpf.type = 'lowpass'; lpf.frequency.value = 300;
    const gn3 = c.createGain();
    gn3.gain.setValueAtTime(0, now + 0.05);
    gn3.gain.linearRampToValueAtTime(_effectiveVol(0.02), now + 0.15);
    gn3.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
    ns.connect(lpf); lpf.connect(gn3); gn3.connect(c.destination);
    ns.start(now + 0.05);
    // Layer 4 — "Non!" ponctuel
    const osc4 = c.createOscillator();
    const gn4 = c.createGain();
    osc4.frequency.setValueAtTime(300, now + 0.1);
    osc4.frequency.linearRampToValueAtTime(180, now + 0.3);
    gn4.gain.setValueAtTime(0, now + 0.1);
    gn4.gain.linearRampToValueAtTime(_effectiveVol(0.03), now + 0.15);
    gn4.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
    osc4.connect(gn4); gn4.connect(c.destination);
    osc4.start(now + 0.1); osc4.stop(now + 0.35);
}

/** sfxCrowdOoh — Surprise collective melodique (~550ms). Sur biberon/point serre. */
export function sfxCrowdOoh() {
    let c;
    try { c = getCtx(); if (!c) return; } catch { return; }
    const now = c.currentTime;
    // Layer 1 — "Ooh" montant-descendant
    const osc1 = c.createOscillator();
    const gn1 = c.createGain();
    osc1.frequency.setValueAtTime(200, now);
    osc1.frequency.linearRampToValueAtTime(350, now + 0.2);
    osc1.frequency.linearRampToValueAtTime(250, now + 0.5);
    gn1.gain.setValueAtTime(0, now);
    gn1.gain.linearRampToValueAtTime(_effectiveVol(0.04), now + 0.1);
    gn1.gain.linearRampToValueAtTime(_effectiveVol(0.06), now + 0.2);
    gn1.gain.exponentialRampToValueAtTime(0.001, now + 0.52);
    osc1.connect(gn1); gn1.connect(c.destination);
    osc1.start(now); osc1.stop(now + 0.55);
    // Layer 2 — Seconde voix (+30ms)
    const osc2 = c.createOscillator();
    const gn2 = c.createGain();
    osc2.frequency.setValueAtTime(250, now + 0.03);
    osc2.frequency.linearRampToValueAtTime(400, now + 0.23);
    osc2.frequency.linearRampToValueAtTime(300, now + 0.53);
    gn2.gain.setValueAtTime(0, now + 0.03);
    gn2.gain.linearRampToValueAtTime(_effectiveVol(0.025), now + 0.13);
    gn2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc2.connect(gn2); gn2.connect(c.destination);
    osc2.start(now + 0.03); osc2.stop(now + 0.58);
    // Layer 3 — Troisieme voix basse (+60ms)
    const osc3 = c.createOscillator();
    const gn3 = c.createGain();
    osc3.type = 'triangle';
    osc3.frequency.setValueAtTime(150, now + 0.06);
    osc3.frequency.linearRampToValueAtTime(250, now + 0.26);
    osc3.frequency.linearRampToValueAtTime(180, now + 0.56);
    gn3.gain.setValueAtTime(0, now + 0.06);
    gn3.gain.linearRampToValueAtTime(_effectiveVol(0.02), now + 0.16);
    gn3.gain.exponentialRampToValueAtTime(0.001, now + 0.58);
    osc3.connect(gn3); gn3.connect(c.destination);
    osc3.start(now + 0.06); osc3.stop(now + 0.6);
    // Layer 4 — Souffle collectif
    const bufSize = Math.floor(c.sampleRate * 0.4);
    const buf = c.createBuffer(1, bufSize, c.sampleRate);
    const dd = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) dd[i] = Math.random() * 2 - 1;
    const ns = c.createBufferSource(); ns.buffer = buf;
    const bpf = c.createBiquadFilter(); bpf.type = 'bandpass'; bpf.frequency.value = 800; bpf.Q.value = 0.5;
    const gn4 = c.createGain();
    gn4.gain.setValueAtTime(0, now + 0.05);
    gn4.gain.linearRampToValueAtTime(_effectiveVol(0.02), now + 0.12);
    gn4.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    ns.connect(bpf); bpf.connect(gn4); gn4.connect(c.destination);
    ns.start(now + 0.05);
}

// === COMMENTATEUR (triggered by game events) ===

const COMMENTATOR_LINES = {
    good_point: ['sfx_comm_joli', 'sfx_comm_magnifique'],
    very_close: ['sfx_comm_ohlala'],
    carreau: ['sfx_comm_carreau'],
    mene_win: ['sfx_comm_magnifique'],
    oob: ['sfx_comm_aie'],
    great_shot: ['sfx_comm_quel_tir'],
    tight: ['sfx_comm_serre'],
    fanny: ['sfx_comm_fanny'],
    encourage: ['sfx_comm_allez'],
    surprise: ['sfx_comm_ouh']
};

export function sfxCommentator(eventType) {
    if (_muted) return;
    const keys = COMMENTATOR_LINES[eventType];
    if (!keys || keys.length === 0) return;
    const key = keys[Math.floor(Math.random() * keys.length)];
    if (playFile(key, { volume: 0.6 })) return;
    // No procedural fallback for commentary — requires real audio files
}

// === AMBIANCE ===

export function startCigales() {
    if (cigalesSource) return;
    // Try Phaser audio (real cigales loop)
    if (_scene && _scene.cache.audio.exists('sfx_cigales_ambiance')) {
        const cigales = _scene.sound.add('sfx_cigales_ambiance', { loop: true, volume: 0.3 });
        cigales.play();
        cigalesSource = { phaserSound: cigales };
        // Also start breeze if available
        if (_scene.cache.audio.exists('sfx_brise_vent')) {
            const brise = _scene.sound.add('sfx_brise_vent', { loop: true, volume: 0.15 });
            brise.play();
            cigalesSource.brise = brise;
        }
        return;
    }
    // Fallback: procedural cigales
    const c = getCtx();
    if (!c) return;
    const duration = 2;
    const sampleRate = c.sampleRate;
    const buffer = c.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
        const t = i / sampleRate;
        const chirp = Math.sin(t * 4000 * Math.PI) * 0.5;
        const envelope = Math.sin(t * 8 * Math.PI);
        data[i] = chirp * Math.max(0, envelope) * 0.03;
    }
    const source = c.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const gain = c.createGain();
    gain.gain.value = 0.15;
    source.connect(gain);
    gain.connect(c.destination);
    source.start();
    cigalesSource = { source, gain };
}

export function stopCigales() {
    if (!cigalesSource) return;
    if (cigalesSource.phaserSound) {
        cigalesSource.phaserSound.stop();
        if (cigalesSource.brise) cigalesSource.brise.stop();
    } else if (cigalesSource.source) {
        cigalesSource.source.stop();
    }
    cigalesSource = null;
}

// === CROWD AMBIANCE ===

let _crowdAmbianceGain = null;
let _crowdAmbianceNodes = [];
let _crowdAmbianceSched = [];

export function startCrowdAmbiance(intensity = 0.04) {
    stopCrowdAmbiance();
    const c = getCtx();
    if (!c) return { stop() {} };

    // Master gain — very low so crowd is subliminal
    const gainNode = c.createGain();
    gainNode.gain.setValueAtTime(_effectiveVol(intensity), c.currentTime);
    gainNode.connect(c.destination);
    _crowdAmbianceGain = gainNode;

    // Pink noise source looped → bandpass 200–800 Hz (crowd murmur freq band)
    const buf = _makePinkNoiseBufferCrowd(c, 4);
    const src = c.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const bpf = c.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.value = 450;
    bpf.Q.value = 0.6;
    src.connect(bpf);
    bpf.connect(gainNode);
    src.start();
    _crowdAmbianceNodes.push(src);

    // Random swells every 4–8 s: gain 0.04 → 0.08 → 0.04 over 1.5 s
    const _sched = () => {
        if (!_crowdAmbianceGain) return;
        const cc = getCtx();
        if (!cc) return;
        const now = cc.currentTime;
        const base = _effectiveVol(0.04);
        const peak = _effectiveVol(0.08);
        _crowdAmbianceGain.gain.cancelScheduledValues(now);
        _crowdAmbianceGain.gain.setValueAtTime(base, now);
        _crowdAmbianceGain.gain.linearRampToValueAtTime(peak, now + 0.75);
        _crowdAmbianceGain.gain.linearRampToValueAtTime(base, now + 1.5);
        const id = setTimeout(_sched, 4000 + Math.random() * 4000);
        _crowdAmbianceSched.push(id);
    };
    const initId = setTimeout(_sched, 4000 + Math.random() * 4000);
    _crowdAmbianceSched.push(initId);

    return { stop() { stopCrowdAmbiance(); } };
}

export function stopCrowdAmbiance() {
    for (const id of _crowdAmbianceSched) clearTimeout(id);
    _crowdAmbianceSched = [];

    if (_crowdAmbianceGain) {
        const c = getCtx();
        if (c) {
            _crowdAmbianceGain.gain.setTargetAtTime(0, c.currentTime, 0.15);
        }
        const gn = _crowdAmbianceGain;
        _crowdAmbianceGain = null;
        setTimeout(() => {
            for (const node of _crowdAmbianceNodes) {
                try { node.stop(); } catch (_) {}
            }
            _crowdAmbianceNodes = [];
            try { gn.disconnect(); } catch (_) {}
        }, 600);
    } else {
        for (const node of _crowdAmbianceNodes) {
            try { node.stop(); } catch (_) {}
        }
        _crowdAmbianceNodes = [];
    }
}

// Internal: pink noise tuned for crowd (slightly different than terrain version)
function _makePinkNoiseBufferCrowd(c, duration) {
    const bufSize = Math.floor(c.sampleRate * duration);
    const buf = c.createBuffer(1, bufSize, c.sampleRate);
    const d = buf.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufSize; i++) {
        const w = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + w * 0.0555179;
        b1 = 0.99332 * b1 + w * 0.0750759;
        b2 = 0.96900 * b2 + w * 0.1538520;
        b3 = 0.86650 * b3 + w * 0.3104856;
        b4 = 0.55000 * b4 + w * 0.5329522;
        b5 = -0.7616 * b5 - w * 0.0168980;
        d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.05;
        b6 = w * 0.115926;
    }
    return buf;
}

// === PER-TERRAIN AMBIANCE ===

let _ambianceSounds = [];
let _ambianceProcNodes = []; // Web Audio sources/oscillators to stop
let _ambianceProcSchedulers = []; // setTimeout IDs for random events
let _ambianceMasterGain = null;

// --- Procedural ambiance helpers ---

function _makePinkNoiseBuffer(c, duration) {
    const bufSize = Math.floor(c.sampleRate * duration);
    const buf = c.createBuffer(1, bufSize, c.sampleRate);
    const d = buf.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufSize; i++) {
        const w = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + w * 0.0555179;
        b1 = 0.99332 * b1 + w * 0.0750759;
        b2 = 0.96900 * b2 + w * 0.1538520;
        b3 = 0.86650 * b3 + w * 0.3104856;
        b4 = 0.55000 * b4 + w * 0.5329522;
        b5 = -0.7616 * b5 - w * 0.0168980;
        d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.05;
        b6 = w * 0.115926;
    }
    return buf;
}

function _makeBrownNoiseBuffer(c, duration) {
    const bufSize = Math.floor(c.sampleRate * duration);
    const buf = c.createBuffer(1, bufSize, c.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < bufSize; i++) {
        const w = Math.random() * 2 - 1;
        d[i] = (last + 0.02 * w) / 1.02;
        last = d[i];
        d[i] *= 3.5;
    }
    return buf;
}

function _makeWhiteNoiseBuffer(c, duration) {
    const bufSize = Math.floor(c.sampleRate * duration);
    const buf = c.createBuffer(1, bufSize, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) d[i] = Math.random() * 2 - 1;
    return buf;
}

function _loopNoise(c, buffer, filterType, filterFreq, filterQ, gainVal, dest) {
    const src = c.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    const flt = c.createBiquadFilter();
    flt.type = filterType;
    flt.frequency.value = filterFreq;
    if (filterQ !== null) flt.Q.value = filterQ;
    const gn = c.createGain();
    gn.gain.value = _effectiveVol(gainVal);
    src.connect(flt); flt.connect(gn); gn.connect(dest);
    src.start();
    _ambianceProcNodes.push(src);
    return { src, gn };
}

function _addLFO(c, targetGainNode, rate, depth) {
    const lfo = c.createOscillator();
    const lfoGn = c.createGain();
    lfo.frequency.value = rate;
    lfoGn.gain.value = _effectiveVol(depth);
    lfo.connect(lfoGn);
    lfoGn.connect(targetGainNode.gain);
    lfo.start();
    _ambianceProcNodes.push(lfo);
}

function _scheduleRandom(fn, minMs, maxMs) {
    const run = () => {
        if (!_ambianceMasterGain) return;
        fn();
        const delay = minMs + Math.random() * (maxMs - minMs);
        const id = setTimeout(run, delay);
        _ambianceProcSchedulers.push(id);
    };
    const delay = minMs + Math.random() * (maxMs - minMs);
    const id = setTimeout(run, delay);
    _ambianceProcSchedulers.push(id);
}

function _startAmbianceVillage(c, dest) {
    // Cigales : bandpass white noise + LFO pulsation 4 Hz
    const { gn: cgn } = _loopNoise(c, _makeWhiteNoiseBuffer(c, 2), 'bandpass', 4500, 8, 0.04, dest);
    _addLFO(c, cgn, 4, 0.04);
    // Vent : pink noise lowpass 200 Hz + slow LFO
    const { gn: vgn } = _loopNoise(c, _makePinkNoiseBuffer(c, 3), 'lowpass', 200, null, 0.03, dest);
    _addLFO(c, vgn, 0.1, 0.02);
}

function _startAmbiancePlage(c, dest) {
    // Vagues : brown noise lowpass 400 Hz + LFO 0.15 Hz (ressac)
    const { gn: wgn } = _loopNoise(c, _makeBrownNoiseBuffer(c, 8), 'lowpass', 400, null, 0.05, dest);
    _addLFO(c, wgn, 0.15, 0.03);
    // Mouettes : chirps sine aleatoires toutes les 15-25s
    const _seagull = () => {
        const cc = getCtx(); if (!cc || !_ambianceMasterGain) return;
        const now = cc.currentTime;
        const chirps = 2 + Math.floor(Math.random() * 2);
        for (let k = 0; k < chirps; k++) {
            const t = now + k * 0.18;
            const osc = cc.createOscillator();
            const gn = cc.createGain();
            osc.frequency.setValueAtTime(1200, t);
            osc.frequency.linearRampToValueAtTime(1800, t + 0.1);
            osc.frequency.linearRampToValueAtTime(1200, t + 0.2);
            gn.gain.setValueAtTime(0, t);
            gn.gain.linearRampToValueAtTime(_effectiveVol(0.025), t + 0.05);
            gn.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
            osc.connect(gn); gn.connect(dest);
            osc.start(t); osc.stop(t + 0.22);
        }
    };
    _scheduleRandom(_seagull, 15000, 25000);
}

function _startAmbianceParc(c, dest) {
    // Oiseaux : chirps melodiques aleatoires toutes les 2-5s
    const _bird = () => {
        const cc = getCtx(); if (!cc || !_ambianceMasterGain) return;
        const now = cc.currentTime;
        const notes = 2 + (Math.random() < 0.5 ? 1 : 0);
        const baseFreq = 1800 + Math.random() * 1400;
        const delays = [0, 0.1, 0.18];
        const freqs = [baseFreq, baseFreq + (Math.random() * 400 - 200), baseFreq * 1.5];
        const vols = [0.025, 0.018, 0.012];
        const durs = [0.08, 0.06, 0.04];
        for (let k = 0; k < notes; k++) {
            const t = now + delays[k];
            const osc = cc.createOscillator();
            const gn = cc.createGain();
            osc.frequency.value = freqs[k];
            gn.gain.setValueAtTime(0, t);
            gn.gain.linearRampToValueAtTime(_effectiveVol(vols[k]), t + 0.005);
            gn.gain.exponentialRampToValueAtTime(0.001, t + durs[k]);
            osc.connect(gn); gn.connect(dest);
            osc.start(t); osc.stop(t + durs[k] + 0.01);
        }
    };
    _scheduleRandom(_bird, 2000, 5000);
    // Enfants lointains : white noise lowpass 800 Hz, periodes 5-10s / silence 20-40s
    const { gn: kgn } = _loopNoise(c, _makeWhiteNoiseBuffer(c, 3), 'lowpass', 800, null, 0.012, dest);
    _addLFO(c, kgn, 0.3, 0.008);
}

function _startAmbianceColline(c, dest) {
    // Vent : pink noise bandpass 300 Hz large + double LFO
    const { gn: wgn } = _loopNoise(c, _makePinkNoiseBuffer(c, 4), 'bandpass', 300, 0.7, 0.05, dest);
    _addLFO(c, wgn, 0.08, 0.025);
    _addLFO(c, wgn, 0.23, 0.008);
    // Cloches de chevre : group of 1-3 tintements toutes les 30-60s
    const _bell = () => {
        const cc = getCtx(); if (!cc || !_ambianceMasterGain) return;
        const now = cc.currentTime;
        const count = 1 + Math.floor(Math.random() * 3);
        for (let k = 0; k < count; k++) {
            const t = now + k * 0.22;
            // Fondamentale 800 Hz
            const osc1 = cc.createOscillator();
            const gn1 = cc.createGain();
            const hpf = cc.createBiquadFilter();
            hpf.type = 'highpass'; hpf.frequency.value = 600;
            osc1.frequency.value = 800;
            gn1.gain.setValueAtTime(0, t);
            gn1.gain.linearRampToValueAtTime(_effectiveVol(0.022), t + 0.002);
            gn1.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
            osc1.connect(hpf); hpf.connect(gn1); gn1.connect(dest);
            osc1.start(t); osc1.stop(t + 0.32);
            // Harmonique 1600 Hz
            const osc2 = cc.createOscillator();
            const gn2 = cc.createGain();
            osc2.frequency.value = 1600;
            gn2.gain.setValueAtTime(0, t);
            gn2.gain.linearRampToValueAtTime(_effectiveVol(0.01), t + 0.002);
            gn2.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
            osc2.connect(gn2); gn2.connect(dest);
            osc2.start(t); osc2.stop(t + 0.2);
        }
    };
    _scheduleRandom(_bell, 30000, 60000);
}

function _startAmbianceDocks(c, dest) {
    // Eau (clapotis) : brown noise lowpass 250 Hz + LFO 0.2 Hz
    const { gn: agn } = _loopNoise(c, _makeBrownNoiseBuffer(c, 5), 'lowpass', 250, null, 0.04, dest);
    _addLFO(c, agn, 0.2, 0.015);
    // Grincements metal : sawtooth bandpass 200 Hz toutes les 20-40s
    const _creak = () => {
        const cc = getCtx(); if (!cc || !_ambianceMasterGain) return;
        const now = cc.currentTime;
        const osc = cc.createOscillator();
        const lfo = cc.createOscillator();
        const lfoGn = cc.createGain();
        const flt = cc.createBiquadFilter();
        const gn = cc.createGain();
        osc.type = 'sawtooth';
        osc.frequency.value = 80 + Math.random() * 70;
        lfo.frequency.value = 2 + Math.random() * 2;
        lfoGn.gain.value = 20;
        lfo.connect(lfoGn); lfoGn.connect(osc.frequency);
        flt.type = 'bandpass'; flt.frequency.value = 200; flt.Q.value = 3;
        gn.gain.setValueAtTime(0, now);
        gn.gain.linearRampToValueAtTime(_effectiveVol(0.018), now + 0.05);
        gn.gain.setValueAtTime(_effectiveVol(0.018), now + 0.25);
        gn.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
        osc.connect(flt); flt.connect(gn); gn.connect(dest);
        osc.start(now); lfo.start(now);
        osc.stop(now + 0.6); lfo.stop(now + 0.6);
    };
    _scheduleRandom(_creak, 20000, 40000);
}

function _startProceduralAmbiance(terrainId) {
    const c = getCtx();
    if (!c) return;
    _ambianceMasterGain = c.createGain();
    _ambianceMasterGain.gain.setValueAtTime(0, c.currentTime);
    _ambianceMasterGain.gain.linearRampToValueAtTime(1, c.currentTime + 2); // 2s fade-in
    _ambianceMasterGain.connect(c.destination);

    switch (terrainId) {
        case 'plage': _startAmbiancePlage(c, _ambianceMasterGain); break;
        case 'parc': _startAmbianceParc(c, _ambianceMasterGain); break;
        case 'colline': _startAmbianceColline(c, _ambianceMasterGain); break;
        case 'docks': _startAmbianceDocks(c, _ambianceMasterGain); break;
        default: _startAmbianceVillage(c, _ambianceMasterGain); break;
    }
}

export function startTerrainAmbiance(terrainId) {
    stopTerrainAmbiance();

    const ambianceMap = {
        village: [
            { key: 'sfx_cigales_ambiance', volume: 0.15 },
            { key: 'sfx_brise_vent', volume: 0.08 }
        ],
        plage: [
            { key: 'sfx_vagues', volume: 0.20 },
            { key: 'sfx_brise_vent', volume: 0.10 }
        ],
        parc: [
            { key: 'sfx_oiseaux', volume: 0.10 },
            { key: 'sfx_brise_vent', volume: 0.05 }
        ],
        colline: [
            { key: 'sfx_brise_vent', volume: 0.15 },
            { key: 'sfx_cigales_ambiance', volume: 0.10 }
        ],
        docks: [
            { key: 'sfx_brise_vent', volume: 0.10 }
        ]
    };

    const sounds = ambianceMap[terrainId] || ambianceMap.village;
    let filesFound = 0;
    for (const cfg of sounds) {
        if (_scene && _scene.cache.audio.exists(cfg.key)) {
            const snd = _scene.sound.add(cfg.key, { loop: true, volume: cfg.volume });
            snd.play();
            _ambianceSounds.push(snd);
            filesFound++;
        }
    }

    // Procedural fallback : si aucun fichier audio trouve, utiliser Web Audio API
    if (filesFound === 0) {
        _startProceduralAmbiance(terrainId);
    }
}

export function stopTerrainAmbiance() {
    // Arreter les sons Phaser
    for (const snd of _ambianceSounds) {
        try { snd.stop(); snd.destroy(); } catch (_) {}
    }
    _ambianceSounds = [];

    // Annuler les timers aleatoires
    for (const id of _ambianceProcSchedulers) clearTimeout(id);
    _ambianceProcSchedulers = [];

    // Fade out 500ms puis arreter les nodes Web Audio
    if (_ambianceMasterGain) {
        const c = getCtx();
        if (c) {
            _ambianceMasterGain.gain.setTargetAtTime(0, c.currentTime, 0.15);
        }
        const mg = _ambianceMasterGain;
        _ambianceMasterGain = null;
        setTimeout(() => {
            for (const node of _ambianceProcNodes) {
                try { node.stop(); } catch (_) {}
            }
            _ambianceProcNodes = [];
            try { mg.disconnect(); } catch (_) {}
        }, 600);
    } else {
        for (const node of _ambianceProcNodes) {
            try { node.stop(); } catch (_) {}
        }
        _ambianceProcNodes = [];
    }

    stopCigales();
}

// === MUSIC ===

export function startMusic(key = 'music_match', volume = 0.25) {
    stopMusic();
    if (_scene && _scene.cache.audio.exists(key)) {
        const vol = _muted ? 0 : volume * _masterVolume * _musicVolume;
        _musicPlaying = _scene.sound.add(key, { loop: true, volume: vol });
        _musicPlaying.play();
    }
}

export function stopMusic() {
    if (_musicPlaying) {
        _musicPlaying.stop();
        _musicPlaying.destroy();
        _musicPlaying = null;
    }
}

/** Increase music tension (tempo up, slight pitch shift) for intense match moments */
export function setMusicTension(tense) {
    if (_musicPlaying) {
        _musicPlaying.rate = tense ? 1.12 : 1.0;
    }
}
