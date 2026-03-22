/**
 * PortraitGenerator - Generates pixel art bust portraits for characters
 * Used in CharSelectScene preview panel and VS screens
 * Each character gets a unique procedural portrait based on their palette and archetype
 */

const PORTRAIT_SIZE = 128;

// Character visual definitions
// Procedural portrait fallback visuals (used only when v2 spritesheet is missing)
const CHAR_VISUALS = {
    brute: {
        skinTone: 0xC8A078,
        hairColor: 0x3A3020,
        hairStyle: 'short',
        shirtColor: 0x4A6FA5,
        shirtStyle: 'polo',
        eyeColor: 0x4A3A2A,
        expression: 'smile',
        accessories: [],
    },
    la_choupe: {
        skinTone: 0xC8A078,
        hairColor: 0x4A3020,
        hairStyle: 'short',
        shirtColor: 0x8B4513,
        shirtStyle: 'tank',
        eyeColor: 0x4A3A2A,
        expression: 'fierce',
        accessories: [],
    }
};

function darken(color, factor = 0.7) {
    const r = Math.floor(((color >> 16) & 0xFF) * factor);
    const g = Math.floor(((color >> 8) & 0xFF) * factor);
    const b = Math.floor((color & 0xFF) * factor);
    return (r << 16) | (g << 8) | b;
}

function lighten(color, factor = 1.3) {
    const r = Math.min(255, Math.floor(((color >> 16) & 0xFF) * factor));
    const g = Math.min(255, Math.floor(((color >> 8) & 0xFF) * factor));
    const b = Math.min(255, Math.floor((color & 0xFF) * factor));
    return (r << 16) | (g << 8) | b;
}

function toCSS(color) {
    return '#' + color.toString(16).padStart(6, '0');
}

/**
 * Generate a portrait texture for a character archetype
 * @param {Phaser.Scene} scene
 * @param {string} textureKey - key to store the texture as
 * @param {string} archetype - character archetype id
 */
export function generatePortrait(scene, textureKey, archetype) {
    const vis = CHAR_VISUALS[archetype] || CHAR_VISUALS.pointeur;
    const S = PORTRAIT_SIZE;
    const canvas = document.createElement('canvas');
    canvas.width = S;
    canvas.height = S;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    const px = (x, y, w, h, color) => {
        ctx.fillStyle = toCSS(color);
        ctx.fillRect(Math.floor(x), Math.floor(y), w, h);
    };

    // Background - warm gradient
    for (let y = 0; y < S; y++) {
        const t = y / S;
        const r = Math.floor(58 + t * 20);
        const g = Math.floor(46 + t * 10);
        const b = Math.floor(40 + t * 8);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(0, y, S, 1);
    }

    // Decorative border
    const borderColor = 0xD4A574;
    px(0, 0, S, 3, borderColor);
    px(0, S - 3, S, 3, borderColor);
    px(0, 0, 3, S, borderColor);
    px(S - 3, 0, 3, S, borderColor);
    // Inner border
    px(3, 3, S - 6, 2, darken(borderColor, 0.6));
    px(3, S - 5, S - 6, 2, darken(borderColor, 0.6));
    px(3, 3, 2, S - 6, darken(borderColor, 0.6));
    px(S - 5, 3, 2, S - 6, darken(borderColor, 0.6));

    // === BODY (shoulders + torso) ===
    const bodyTop = 78;
    const bodyW = 70;
    const bodyX = (S - bodyW) / 2;

    // Shoulders (wider)
    px(bodyX - 8, bodyTop, bodyW + 16, 50, vis.shirtColor);
    px(bodyX - 4, bodyTop - 4, bodyW + 8, 8, vis.shirtColor);
    // Shirt shadow
    px(bodyX - 8, bodyTop + 20, bodyW + 16, 30, darken(vis.shirtColor, 0.85));
    // Collar/neckline
    px(S / 2 - 10, bodyTop - 6, 20, 8, darken(vis.shirtColor, 0.7));

    // Shirt details based on style
    if (vis.shirtStyle === 'polo') {
        // Polo collar
        px(S / 2 - 12, bodyTop - 8, 24, 4, lighten(vis.shirtColor, 1.2));
        px(S / 2 - 2, bodyTop - 4, 4, 16, darken(vis.shirtColor, 0.8)); // button line
    } else if (vis.shirtStyle === 'chemise') {
        // Open collar
        px(S / 2 - 8, bodyTop - 6, 16, 20, lighten(vis.shirtColor, 1.1));
        px(S / 2 - 2, bodyTop - 4, 4, 30, darken(vis.shirtColor, 0.85));
    } else if (vis.shirtStyle === 'hawaii') {
        // Colorful pattern
        for (let i = 0; i < 6; i++) {
            const hx = bodyX + 8 + (i % 3) * 22;
            const hy = bodyTop + 8 + Math.floor(i / 3) * 18;
            px(hx, hy, 8, 8, lighten(vis.shirtColor, 1.3));
        }
    } else if (vis.shirtStyle === 'royal') {
        // Gold trim
        px(bodyX - 6, bodyTop, 4, 50, 0xFFD700);
        px(bodyX + bodyW + 2, bodyTop, 4, 50, 0xFFD700);
        px(S / 2 - 14, bodyTop - 8, 28, 4, 0xFFD700);
    } else if (vis.shirtStyle === 'tank') {
        // Tank top - expose shoulders
        px(bodyX - 8, bodyTop, 14, 50, vis.skinTone);
        px(bodyX + bodyW - 6, bodyTop, 14, 50, vis.skinTone);
    }

    // === NECK ===
    px(S / 2 - 10, bodyTop - 14, 20, 14, vis.skinTone);
    px(S / 2 - 8, bodyTop - 12, 16, 12, darken(vis.skinTone, 0.95));

    // === HEAD ===
    const headW = 44;
    const headH = 48;
    const headX = (S - headW) / 2;
    const headY = 18;

    // Head shape
    px(headX + 4, headY, headW - 8, headH, vis.skinTone);
    px(headX, headY + 6, headW, headH - 12, vis.skinTone);
    px(headX + 2, headY + 2, headW - 4, headH - 4, vis.skinTone);

    // Face shadow (right side)
    px(headX + headW - 8, headY + 8, 6, headH - 20, darken(vis.skinTone, 0.9));

    // === EYES ===
    const eyeY = headY + 20;
    const eyeSize = 6;
    // Left eye
    px(headX + 10, eyeY, eyeSize + 2, eyeSize, 0xFFFFFF);
    px(headX + 12, eyeY + 1, eyeSize - 2, eyeSize - 2, vis.eyeColor);
    px(headX + 13, eyeY + 2, 2, 2, 0x1A1510); // pupil
    // Right eye
    px(headX + headW - 18, eyeY, eyeSize + 2, eyeSize, 0xFFFFFF);
    px(headX + headW - 16, eyeY + 1, eyeSize - 2, eyeSize - 2, vis.eyeColor);
    px(headX + headW - 15, eyeY + 2, 2, 2, 0x1A1510); // pupil

    // Eyebrows
    const browColor = darken(vis.hairColor, 0.8);
    if (vis.expression === 'fierce') {
        // Angry eyebrows (angled down)
        px(headX + 9, eyeY - 4, 10, 3, browColor);
        px(headX + headW - 19, eyeY - 4, 10, 3, browColor);
        px(headX + 9, eyeY - 5, 4, 2, browColor);
        px(headX + headW - 13, eyeY - 5, 4, 2, browColor);
    } else if (vis.expression === 'imposing') {
        // Thick stern eyebrows
        px(headX + 8, eyeY - 5, 12, 4, browColor);
        px(headX + headW - 20, eyeY - 5, 12, 4, browColor);
    } else {
        // Normal eyebrows
        px(headX + 9, eyeY - 4, 10, 2, browColor);
        px(headX + headW - 19, eyeY - 4, 10, 2, browColor);
    }

    // === NOSE ===
    px(S / 2 - 3, eyeY + 10, 6, 8, darken(vis.skinTone, 0.92));
    px(S / 2 - 2, eyeY + 16, 4, 2, darken(vis.skinTone, 0.85));

    // === MOUTH ===
    const mouthY = eyeY + 22;
    if (vis.expression === 'smile' || vis.expression === 'excited') {
        px(S / 2 - 8, mouthY, 16, 3, darken(vis.skinTone, 0.75));
        px(S / 2 - 6, mouthY + 3, 12, 2, 0xC06050); // lips
        px(S / 2 - 4, mouthY + 2, 8, 2, 0xFFFFFF); // teeth hint
    } else if (vis.expression === 'fierce') {
        px(S / 2 - 7, mouthY, 14, 2, darken(vis.skinTone, 0.7));
        px(S / 2 - 5, mouthY + 2, 10, 2, 0xB05040);
    } else if (vis.expression === 'cool') {
        px(S / 2 - 6, mouthY + 1, 12, 2, darken(vis.skinTone, 0.75));
        // Slight smirk
        px(S / 2 + 4, mouthY, 4, 2, darken(vis.skinTone, 0.75));
    } else {
        // Stern/imposing
        px(S / 2 - 7, mouthY, 14, 3, darken(vis.skinTone, 0.78));
    }

    // === EARS ===
    px(headX - 4, eyeY - 2, 6, 14, vis.skinTone);
    px(headX + headW - 2, eyeY - 2, 6, 14, vis.skinTone);
    px(headX - 2, eyeY + 2, 3, 6, darken(vis.skinTone, 0.9));
    px(headX + headW, eyeY + 2, 3, 6, darken(vis.skinTone, 0.9));

    // === HAIR ===
    if (vis.hairStyle === 'short') {
        px(headX + 2, headY - 4, headW - 4, 14, vis.hairColor);
        px(headX - 2, headY, headW + 4, 8, vis.hairColor);
        px(headX + 6, headY - 6, headW - 12, 6, vis.hairColor);
        // Highlight
        px(headX + 10, headY - 4, 12, 4, lighten(vis.hairColor, 1.3));
    } else if (vis.hairStyle === 'bald_sides') {
        px(headX + 8, headY - 2, headW - 16, 8, vis.hairColor);
        px(headX - 2, headY + 4, 8, 16, vis.hairColor); // side
        px(headX + headW - 6, headY + 4, 8, 16, vis.hairColor); // side
    } else if (vis.hairStyle === 'long') {
        px(headX, headY - 6, headW, 16, vis.hairColor);
        px(headX - 6, headY, 10, 50, vis.hairColor); // left side
        px(headX + headW - 4, headY, 10, 50, vis.hairColor); // right side
        px(headX + 4, headY - 8, headW - 8, 6, lighten(vis.hairColor, 1.2));
    } else if (vis.hairStyle === 'slick') {
        px(headX + 2, headY - 4, headW - 4, 12, vis.hairColor);
        px(headX - 2, headY, headW + 4, 6, vis.hairColor);
        px(headX + 8, headY - 6, headW - 16, 4, lighten(vis.hairColor, 1.3));
    } else if (vis.hairStyle === 'spiky') {
        px(headX, headY - 4, headW, 12, vis.hairColor);
        // Spikes
        px(headX + 6, headY - 12, 6, 10, vis.hairColor);
        px(headX + 16, headY - 14, 6, 12, vis.hairColor);
        px(headX + 26, headY - 10, 6, 8, vis.hairColor);
        px(headX + 34, headY - 8, 6, 6, vis.hairColor);
        px(headX + 12, headY - 10, 4, 8, lighten(vis.hairColor, 1.4));
    } else if (vis.hairStyle === 'wild') {
        px(headX - 4, headY - 6, headW + 8, 16, vis.hairColor);
        px(headX - 6, headY, 10, 30, vis.hairColor);
        px(headX + headW - 4, headY, 10, 30, vis.hairColor);
        px(headX + 2, headY - 10, 10, 8, vis.hairColor);
        px(headX + headW - 12, headY - 10, 10, 8, vis.hairColor);
        px(headX + 8, headY - 8, 14, 4, lighten(vis.hairColor, 1.2));
    }

    // === ACCESSORIES ===
    if (vis.accessories.includes('casquette')) {
        px(headX - 6, headY - 2, headW + 12, 8, 0x3A5A8A);
        px(headX - 14, headY + 2, 18, 6, 0x3A5A8A); // visor
        px(headX - 6, headY - 2, headW + 12, 3, lighten(0x3A5A8A, 1.2));
    }
    if (vis.accessories.includes('chapeau')) {
        px(headX - 10, headY - 4, headW + 20, 6, 0x8B6B4A);
        px(headX + 4, headY - 14, headW - 8, 14, 0x8B6B4A);
        px(headX + 8, headY - 12, headW - 16, 4, lighten(0x8B6B4A, 1.3));
        // Band
        px(headX + 4, headY - 4, headW - 8, 3, 0xC44B3F);
    }
    if (vis.accessories.includes('lunettes')) {
        // Sunglasses
        px(headX + 8, eyeY - 2, 12, 10, 0x1A1510);
        px(headX + headW - 20, eyeY - 2, 12, 10, 0x1A1510);
        px(headX + 20, eyeY, headW - 40, 3, 0x1A1510); // bridge
        // Lens shine
        px(headX + 10, eyeY, 4, 3, 0x4A5A6A);
        px(headX + headW - 18, eyeY, 4, 3, 0x4A5A6A);
    }
    if (vis.accessories.includes('barbe')) {
        px(S / 2 - 14, mouthY + 4, 28, 16, vis.hairColor);
        px(S / 2 - 12, mouthY + 2, 24, 4, vis.hairColor);
        px(S / 2 - 10, mouthY + 18, 20, 6, vis.hairColor);
        px(S / 2 - 6, mouthY + 22, 12, 4, darken(vis.hairColor, 0.9));
        // Mustache
        px(S / 2 - 10, mouthY - 2, 20, 4, vis.hairColor);
    }
    if (vis.accessories.includes('chaine')) {
        // Gold chain
        for (let i = 0; i < 10; i++) {
            const cx = S / 2 - 16 + i * 3.5;
            const cy = bodyTop - 2 + Math.sin(i * 0.8) * 3;
            px(cx, cy, 3, 3, 0xFFD700);
            px(cx + 1, cy + 1, 1, 1, 0xFFF4D0);
        }
    }

    // === OUTLINE (warm dark, not pure black) ===
    // We add a subtle outline by checking transparency
    const outline = 0x3A2E28;
    const imageData = ctx.getImageData(0, 0, S, S);
    const outlineData = ctx.createImageData(S, S);
    const src = imageData.data;
    const dst = outlineData.data;

    // Copy source
    for (let i = 0; i < src.length; i++) dst[i] = src[i];

    // Only outline the character (skip background/border area)
    const or = (outline >> 16) & 0xFF;
    const og = (outline >> 8) & 0xFF;
    const ob = outline & 0xFF;

    for (let y = 6; y < S - 6; y++) {
        for (let x = 6; x < S - 6; x++) {
            const idx = (y * S + x) * 4;
            if (src[idx + 3] > 0) {
                // Check if any neighbor is background (dark gradient)
                const neighbors = [[-1, 0], [1, 0], [0, -1], [0, 1]];
                for (const [dx, dy] of neighbors) {
                    const nx = x + dx, ny = y + dy;
                    if (nx < 6 || nx >= S - 6 || ny < 6 || ny >= S - 6) continue;
                    const nidx = (ny * S + nx) * 4;
                    // If neighbor is much darker (background), add outline
                    const nBright = src[nidx] + src[nidx + 1] + src[nidx + 2];
                    const cBright = src[idx] + src[idx + 1] + src[idx + 2];
                    if (Math.abs(cBright - nBright) > 120) {
                        dst[idx] = or;
                        dst[idx + 1] = og;
                        dst[idx + 2] = ob;
                    }
                }
            }
        }
    }

    ctx.putImageData(outlineData, 0, 0);

    // Register texture in Phaser
    if (scene.textures.exists(textureKey)) {
        scene.textures.remove(textureKey);
    }
    scene.textures.addCanvas(textureKey, canvas);
}

/**
 * Generate all character portraits
 * @param {Phaser.Scene} scene
 */
export function generateAllPortraits(scene) {
    // V2 characters (including rookie): extract south-facing frame (0,0) from composed spritesheet as portrait
    const v2Chars = [
        'rookie', 'la_choupe', 'ley',
        'foyot', 'suchaud', 'fazzino', 'rocher', 'robineau',
        'mamie_josette', 'sofia', 'papi_rene', 'rizzi'
    ];
    for (const charId of v2Chars) {
        const spriteKey = `${charId}_animated`;
        const portraitKey = `portrait_${charId}`;
        if (scene.textures.exists(spriteKey) && !scene.textures.exists(portraitKey)) {
            const src = scene.textures.get(spriteKey).getSourceImage();
            const canvas = document.createElement('canvas');
            canvas.width = 128; canvas.height = 128;
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = false;
            // Extract first frame (south, 128x128 at position 0,0)
            ctx.drawImage(src, 0, 0, 128, 128, 0, 0, 128, 128);
            scene.textures.addCanvas(portraitKey, canvas);
        }
    }
}
