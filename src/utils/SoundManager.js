// Sound Manager - Uses real audio files (ElevenLabs) with procedural fallback
// Requires Phaser scene reference for file-based audio

let ctx = null;
let cigalesSource = null;
let _scene = null;
let _musicPlaying = null;

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
    if (_scene && _scene.cache.audio.exists(key)) {
        _scene.sound.play(key, { volume: 0.5, ...config });
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
    if (playFile('sfx_boule_clac')) return;
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
    if (playFile('sfx_boule_atterrissage')) return;
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
    const c = getCtx();
    const now = c.currentTime;
    [523, 659, 784, 1047].forEach((freq, i) => {
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        gain.gain.setValueAtTime(0.2, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.3);
        osc.connect(gain);
        gain.connect(c.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.3);
        const osc2 = c.createOscillator();
        const gain2 = c.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(freq, now + i * 0.08 + 0.1);
        gain2.gain.setValueAtTime(0.06, now + i * 0.08 + 0.1);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.4);
        osc2.connect(gain2);
        gain2.connect(c.destination);
        osc2.start(now + i * 0.08 + 0.1);
        osc2.stop(now + i * 0.08 + 0.4);
    });
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

// === MUSIC ===

export function startMusic(key = 'music_match', volume = 0.25) {
    stopMusic();
    if (_scene && _scene.cache.audio.exists(key)) {
        _musicPlaying = _scene.sound.add(key, { loop: true, volume });
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
