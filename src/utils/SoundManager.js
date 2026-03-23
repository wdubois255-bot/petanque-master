// Sound Manager - Uses real audio files (ElevenLabs) with procedural fallback
// Requires Phaser scene reference for file-based audio

let ctx = null;
let cigalesSource = null;
let _scene = null;
let _musicPlaying = null;

// Global settings (persisted in localStorage)
let _masterVolume = 1.0;
let _musicVolume = 1.0;
let _sfxVolume = 1.0;
let _muted = false;

// Load settings from localStorage
try {
    const saved = JSON.parse(localStorage.getItem('petanque_audio_settings'));
    if (saved) {
        _masterVolume = saved.masterVolume ?? 1.0;
        _musicVolume = saved.musicVolume ?? 1.0;
        _sfxVolume = saved.sfxVolume ?? 1.0;
        _muted = saved.muted ?? false;
    }
} catch (e) { /* ignore */ }

function _saveAudioSettings() {
    try {
        localStorage.setItem('petanque_audio_settings', JSON.stringify({
            masterVolume: _masterVolume, musicVolume: _musicVolume,
            sfxVolume: _sfxVolume, muted: _muted
        }));
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
        ctx = new (window.AudioContext || window.webkitAudioContext)();
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

// === SFX exports ===

export function sfxBouleBoule() {
    if (playFile('sfx_boule_clac', { rate: 0.9 + Math.random() * 0.2 })) return;
    playTone(800, 0.08, 'square', 0.25);
    playTone(1200, 0.05, 'square', 0.15);
    playTone(1600, 0.04, 'sine', 0.08);
    playNoise(0.06, 0.2, 4000);
}

export function sfxBouleCochonnet() {
    if (playFile('sfx_cochonnet_touche')) return;
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
    if (playFile('sfx_carreau', { volume: 0.7 })) return;
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
    if (playFile('sfx_lancer_swoosh')) return;
    const c = getCtx();
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
    playTone(600, 0.05, 'square', 0.1);
}

export function sfxVictory() {
    if (playFile('sfx_victoire', { volume: 0.6 })) return;
    const c = getCtx();
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
    setTimeout(() => playTone(1100, 0.2, 'sine', 0.12), 100);
}

export function sfxVSSlam() {
    // Heavy impact for VS screen slam
    playTone(100, 0.2, 'square', 0.3);
    playTone(60, 0.3, 'sawtooth', 0.2);
    playNoise(0.15, 0.25, 1200);
}

// === CONTINUOUS ROLLING SOUND (Web Audio pink noise) ===

let _rollingSource = null;
let _rollingGain = null;
let _rollingFilter = null;

/** Start a continuous rolling noise loop (pink noise filtered) */
export function startRollingSound() {
    if (_rollingSource) return;
    const c = getCtx();
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

// === PER-TERRAIN AMBIANCE ===

let _ambianceSounds = [];

export function startTerrainAmbiance(terrainId) {
    stopTerrainAmbiance();

    const ambianceMap = {
        village: [
            { key: 'sfx_cigales_ambiance', volume: 0.15, fallback: 'cigales' },
            { key: 'sfx_brise_vent', volume: 0.08, fallback: null }
        ],
        plage: [
            { key: 'sfx_vagues', volume: 0.20, fallback: 'waves' },
            { key: 'sfx_brise_vent', volume: 0.10, fallback: null }
        ],
        parc: [
            { key: 'sfx_oiseaux', volume: 0.10, fallback: 'birds' },
            { key: 'sfx_brise_vent', volume: 0.05, fallback: null }
        ],
        colline: [
            { key: 'sfx_brise_vent', volume: 0.15, fallback: null },
            { key: 'sfx_cigales_ambiance', volume: 0.10, fallback: 'cigales' }
        ],
        docks: [
            { key: 'sfx_brise_vent', volume: 0.10, fallback: null }
        ]
    };

    const sounds = ambianceMap[terrainId] || ambianceMap.village;

    for (const cfg of sounds) {
        if (_scene && _scene.cache.audio.exists(cfg.key)) {
            const snd = _scene.sound.add(cfg.key, { loop: true, volume: cfg.volume });
            snd.play();
            _ambianceSounds.push(snd);
        } else if (cfg.fallback === 'cigales') {
            // Use procedural cigales
            startCigales();
        }
        // Other fallbacks: skip silently (no waves/birds procedural needed)
    }
}

export function stopTerrainAmbiance() {
    for (const snd of _ambianceSounds) {
        snd.stop();
        snd.destroy();
    }
    _ambianceSounds = [];
    stopCigales(); // also stop procedural cigales if running
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
