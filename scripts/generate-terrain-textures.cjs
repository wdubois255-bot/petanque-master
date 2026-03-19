#!/usr/bin/env node
/**
 * Generate seamless 64x64 terrain textures for Petanque Master
 * Pixel art style: discrete palette, visible grains, high contrast
 * Output: assets/sprites/terrain_tex_{terre,herbe,sable,dalles}.png
 */

const sharp = require('sharp');
const path = require('path');

const SIZE = 64;

// === Simple seeded Perlin-like noise ===
function createNoise(seed) {
    const p = new Uint8Array(512);
    const perm = new Uint8Array(256);
    for (let i = 0; i < 256; i++) perm[i] = i;
    let s = seed;
    for (let i = 255; i > 0; i--) {
        s = (s * 16807 + 0) % 2147483647;
        const j = s % (i + 1);
        [perm[i], perm[j]] = [perm[j], perm[i]];
    }
    for (let i = 0; i < 512; i++) p[i] = perm[i & 255];

    function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
    function lerp(a, b, t) { return a + t * (b - a); }
    function grad(hash, x, y) {
        const h = hash & 3;
        return (h < 2 ? x : -x) + (h === 0 || h === 3 ? y : -y);
    }

    return function noise(x, y) {
        const X = Math.floor(x) & 255, Y = Math.floor(y) & 255;
        const xf = x - Math.floor(x), yf = y - Math.floor(y);
        const u = fade(xf), v = fade(yf);
        const aa = p[p[X] + Y], ab = p[p[X] + Y + 1];
        const ba = p[p[X + 1] + Y], bb = p[p[X + 1] + Y + 1];
        return lerp(
            lerp(grad(aa, xf, yf), grad(ba, xf - 1, yf), u),
            lerp(grad(ab, xf, yf - 1), grad(bb, xf - 1, yf - 1), u), v
        );
    };
}

// Seeded random (for placing discrete elements)
function createRng(seed) {
    let s = seed;
    return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

function fbm(noise, x, y, octaves = 4, lac = 2, pers = 0.5) {
    let val = 0, amp = 1, freq = 1, max = 0;
    for (let i = 0; i < octaves; i++) {
        val += noise(x * freq, y * freq) * amp;
        max += amp; amp *= pers; freq *= lac;
    }
    return val / max;
}

function sNoise(fn, x, y, scale, oct = 4) {
    return fbm(fn, (x / SIZE) * scale, (y / SIZE) * scale, oct);
}

function n01(v) { return Math.max(0, Math.min(1, (v + 1) * 0.5)); }

function hexToRgb(hex) {
    const n = parseInt(hex.replace('#', ''), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Pick from a discrete palette based on value (pixel art style)
function palettePick(palette, value) {
    const idx = Math.min(palette.length - 1, Math.max(0, Math.floor(value * palette.length)));
    return [...palette[idx]];
}

function setPixel(pixels, x, y, color) {
    const idx = (y * SIZE + x) * 4;
    pixels[idx] = color[0];
    pixels[idx + 1] = color[1];
    pixels[idx + 2] = color[2];
    pixels[idx + 3] = 255;
}

// === TERRE (packed earth with gravel — provençal boulodrome) ===
function generateTerre() {
    const n1 = createNoise(42), n2 = createNoise(137), n3 = createNoise(256);
    const rng = createRng(789);
    const pixels = Buffer.alloc(SIZE * SIZE * 4);

    // Discrete earth palette (dark to light)
    const palette = [
        hexToRgb('#8B6530'),  // deep shadow
        hexToRgb('#9A7038'),  // dark earth
        hexToRgb('#A87D42'),  // medium earth
        hexToRgb('#B8904E'),  // base earth
        hexToRgb('#C49C58'),  // warm earth
        hexToRgb('#D0A862'),  // light earth
        hexToRgb('#D8B470'),  // highlight
    ];
    const pebbleDark = hexToRgb('#6E5028');
    const pebbleLight = hexToRgb('#DCC080');
    const pebbleMid = hexToRgb('#A08848');

    for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {
            const large = n01(sNoise(n1, x, y, 3, 3));
            const medium = n01(sNoise(n2, x, y, 7, 3));
            const fine = n01(sNoise(n3, x, y, 14, 2));

            // Combine for palette index with more contrast
            const value = large * 0.5 + medium * 0.3 + fine * 0.2;
            let color = palettePick(palette, value);

            // Scattered dark pebbles
            if (fine < 0.15) color = pebbleDark;
            // Scattered light pebbles
            else if (fine > 0.88) color = pebbleLight;
            // Mid-tone pebble specks
            else if (medium < 0.18 && fine > 0.4 && fine < 0.6) color = pebbleMid;

            setPixel(pixels, x, y, color);
        }
    }

    // Add a few distinct round pebbles (3-5px diameter)
    for (let i = 0; i < 12; i++) {
        const px = Math.floor(rng() * SIZE);
        const py = Math.floor(rng() * SIZE);
        const r = rng() < 0.5 ? 1 : 2;
        const pColor = rng() < 0.4 ? pebbleDark : rng() < 0.7 ? pebbleMid : pebbleLight;
        for (let dy = -r; dy <= r; dy++) {
            for (let dx = -r; dx <= r; dx++) {
                if (dx * dx + dy * dy <= r * r) {
                    const tx = (px + dx + SIZE) % SIZE;
                    const ty = (py + dy + SIZE) % SIZE;
                    setPixel(pixels, tx, ty, pColor);
                }
            }
        }
    }

    return pixels;
}

// === HERBE (maintained park grass) ===
function generateHerbe() {
    const n1 = createNoise(77), n2 = createNoise(199), n3 = createNoise(333);
    const rng = createRng(555);
    const pixels = Buffer.alloc(SIZE * SIZE * 4);

    const palette = [
        hexToRgb('#3D5E28'),  // deep shadow
        hexToRgb('#4A6E30'),  // dark grass
        hexToRgb('#567A3C'),  // medium-dark
        hexToRgb('#648A48'),  // medium grass
        hexToRgb('#729A54'),  // base grass
        hexToRgb('#80AA60'),  // light grass
        hexToRgb('#8EBA6C'),  // sunlit
    ];
    const dryTip = hexToRgb('#A0AA58');
    const clover = hexToRgb('#48803A');
    const wornPatch = hexToRgb('#7A7040');

    for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {
            // Mowing stripes: alternate rows are slightly different shade
            const stripePhase = Math.floor(y / 4) % 2;
            const stripeShift = stripePhase * 0.12;

            const large = n01(sNoise(n1, x, y, 4, 3));
            const medium = n01(sNoise(n2, x, y, 10, 3));
            const fine = n01(sNoise(n3, x, y, 18, 2));

            const value = large * 0.4 + medium * 0.35 + fine * 0.25 + stripeShift;
            let color = palettePick(palette, value);

            // Dry grass tips (scattered yellow-green pixels)
            if (fine > 0.85 && medium > 0.5) color = dryTip;
            // Darker clover patches
            else if (large > 0.7 && fine < 0.3) color = clover;

            // Worn patches (where people walk)
            const wear = n01(sNoise(n1, x + 100, y + 100, 2, 2));
            if (wear > 0.82) color = wornPatch;

            setPixel(pixels, x, y, color);
        }
    }

    // Tiny flowers (1px, sparse)
    const flowerColors = [hexToRgb('#E8E050'), hexToRgb('#E8A0A0'), hexToRgb('#E0E0E0')];
    for (let i = 0; i < 6; i++) {
        const fx = Math.floor(rng() * SIZE);
        const fy = Math.floor(rng() * SIZE);
        setPixel(pixels, fx, fy, flowerColors[i % 3]);
    }

    return pixels;
}

// === SABLE (beach sand) ===
function generateSable() {
    const n1 = createNoise(55), n2 = createNoise(888), n3 = createNoise(444);
    const rng = createRng(321);
    const pixels = Buffer.alloc(SIZE * SIZE * 4);

    const palette = [
        hexToRgb('#C8B090'),  // wet/shadow sand
        hexToRgb('#D4BC9C'),  // dark sand
        hexToRgb('#DCC8A8'),  // medium sand
        hexToRgb('#E4D4B4'),  // base sand
        hexToRgb('#EAD8BC'),  // light sand
        hexToRgb('#F0E0C4'),  // bright sand
        hexToRgb('#F5E8D0'),  // highlight
    ];
    const shellWhite = hexToRgb('#F8F0E0');
    const shellPink = hexToRgb('#E8D0C0');
    const wetDark = hexToRgb('#B0986C');

    for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {
            // Diagonal wind ripple pattern
            const ripple = Math.sin((x * 0.8 + y * 1.2) / SIZE * Math.PI * 10);
            const rippleStep = ripple > 0.3 ? 0.1 : ripple < -0.3 ? -0.1 : 0;

            const large = n01(sNoise(n1, x, y, 3, 3));
            const medium = n01(sNoise(n2, x, y, 8, 3));
            const fine = n01(sNoise(n3, x, y, 20, 2));

            const value = large * 0.35 + medium * 0.35 + fine * 0.3 + rippleStep;
            let color = palettePick(palette, value);

            // Bright grain sparkles
            if (fine > 0.9) color = shellWhite;
            // Dark wet spots
            if (large < 0.15 && medium < 0.4) color = wetDark;

            setPixel(pixels, x, y, color);
        }
    }

    // Small shells (1-2px)
    for (let i = 0; i < 5; i++) {
        const sx = Math.floor(rng() * SIZE);
        const sy = Math.floor(rng() * SIZE);
        setPixel(pixels, sx, sy, rng() < 0.5 ? shellWhite : shellPink);
        if (rng() < 0.5) setPixel(pixels, (sx + 1) % SIZE, sy, shellWhite);
    }

    return pixels;
}

// === DALLES (concrete dock slabs) ===
function generateDalles() {
    const n1 = createNoise(111), n2 = createNoise(222), n3 = createNoise(999);
    const pixels = Buffer.alloc(SIZE * SIZE * 4);

    const palette = [
        hexToRgb('#626258'),  // dark concrete
        hexToRgb('#6E6E64'),  // shadow
        hexToRgb('#7A7A70'),  // medium
        hexToRgb('#86867C'),  // base concrete
        hexToRgb('#929288'),  // light
        hexToRgb('#9A9A90'),  // highlight
    ];
    const jointDark = hexToRgb('#4A4A42');
    const jointLight = hexToRgb('#585850');
    const stain = hexToRgb('#6A6A58');
    const speckLight = hexToRgb('#A0A096');

    const SLAB = 32;
    const JOINT = 1; // 1px joint = crisp pixel art

    for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {
            // Joint lines (1px wide, perfectly crisp)
            const onJointX = (x % SLAB) === 0;
            const onJointY = (y % SLAB) === 0;

            if (onJointX || onJointY) {
                // Corner intersection is darkest
                const color = (onJointX && onJointY) ? jointDark : jointLight;
                setPixel(pixels, x, y, color);
                continue;
            }

            // Edge highlight (1px inside joint = slightly lighter, simulates bevel)
            const nearJointX = (x % SLAB) === 1 || (x % SLAB) === SLAB - 1;
            const nearJointY = (y % SLAB) === 1 || (y % SLAB) === SLAB - 1;

            const large = n01(sNoise(n1, x, y, 4, 3));
            const medium = n01(sNoise(n2, x, y, 10, 3));
            const fine = n01(sNoise(n3, x, y, 18, 2));

            let value = large * 0.4 + medium * 0.35 + fine * 0.25;
            // Bevel: slightly darker near edges
            if (nearJointX || nearJointY) value -= 0.08;

            let color = palettePick(palette, value);

            // Aggregate speckle (brighter dots in concrete)
            if (fine > 0.88) color = speckLight;
            // Dark aggregate
            if (fine < 0.1 && medium > 0.5) color = palette[0];

            // Oil stains (rare, large)
            const stainVal = n01(sNoise(n1, x + 200, y + 200, 2, 2));
            if (stainVal > 0.85) color = stain;

            setPixel(pixels, x, y, color);
        }
    }

    return pixels;
}

// === Generate all textures ===
async function main() {
    const outputDir = path.resolve(__dirname, '..', 'assets', 'sprites');

    const textures = [
        { name: 'terrain_tex_terre', generate: generateTerre },
        { name: 'terrain_tex_herbe', generate: generateHerbe },
        { name: 'terrain_tex_sable', generate: generateSable },
        { name: 'terrain_tex_dalles', generate: generateDalles },
    ];

    for (const tex of textures) {
        const pixels = tex.generate();
        const outputPath = path.join(outputDir, `${tex.name}.png`);

        await sharp(pixels, {
            raw: { width: SIZE, height: SIZE, channels: 4 }
        })
        .png({ compressionLevel: 9 })
        .toFile(outputPath);

        console.log(`  OK: ${outputPath}`);
    }

    console.log('\nAll 4 terrain textures generated (64x64 seamless pixel art)');
}

main().catch(err => { console.error('Error:', err); process.exit(1); });
