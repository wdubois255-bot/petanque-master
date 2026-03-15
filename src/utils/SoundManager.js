// Procedural SFX using Web Audio API (no external files needed)
// Generates retro-style sounds for petanque gameplay

let ctx = null;
let cigalesSource = null;

function getCtx() {
    if (!ctx) {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
}

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

export function sfxBouleBoule() {
    // Metallic clack: two short tones + 2nd harmonic + noise burst
    playTone(800, 0.08, 'square', 0.25);
    playTone(1200, 0.05, 'square', 0.15);
    playTone(1600, 0.04, 'sine', 0.08); // 2nd harmonic for richness
    playNoise(0.06, 0.2, 4000);
}

export function sfxBouleCochonnet() {
    // Higher pitch, lighter impact
    playTone(1400, 0.06, 'square', 0.2);
    playTone(2000, 0.04, 'sine', 0.1);
    playNoise(0.04, 0.12, 5000);
}

export function sfxLanding(terrainType = 'terre') {
    // Thud + terrain-specific noise + gravel crunch
    const freqMap = { terre: 200, herbe: 300, sable: 150, dalles: 600 };
    const noiseMap = { terre: 1500, herbe: 1000, sable: 800, dalles: 3000 };
    const freq = freqMap[terrainType] || 200;
    const nf = noiseMap[terrainType] || 1500;
    playTone(freq, 0.12, 'sine', 0.2);
    playNoise(0.1, 0.15, nf);
    // Gravel crunch (bandpass noise 800-2000Hz)
    playNoise(0.08, 0.1, 1400, 'bandpass');
}

export function sfxRoll() {
    // Low rumble
    playNoise(0.08, 0.04, 400);
}

export function sfxCarreau() {
    // Triumphant chime: ascending tones + reverb echo
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

        // Echo (delay 100ms, lower volume)
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
    // Swoosh: descending noise
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
    playTone(600, 0.05, 'square', 0.1);
}

export function sfxVictory() {
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
    playTone(880, 0.15, 'sine', 0.15);
    setTimeout(() => playTone(1100, 0.2, 'sine', 0.12), 100);
}

// --- AMBIANCE : cigales procedurales (boucle continue) ---
export function startCigales() {
    if (cigalesSource) return; // already playing
    const c = getCtx();
    const duration = 2;
    const sampleRate = c.sampleRate;
    const buffer = c.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
        const t = i / sampleRate;
        // High-freq chirp modulated at ~4Hz (cicada rhythm)
        const chirp = Math.sin(t * 4000 * Math.PI) * 0.5;
        const envelope = Math.sin(t * 8 * Math.PI); // 4Hz modulation
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
    if (cigalesSource) {
        cigalesSource.source.stop();
        cigalesSource = null;
    }
}
