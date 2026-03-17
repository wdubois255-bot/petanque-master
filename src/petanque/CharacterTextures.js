/**
 * Generate profile-view canvas textures for modular pétanque characters.
 * Each character has: body (profile, no throwing arm) + arm (separate sprite).
 * Style: chibi pixel art, ~64x64, matching the existing generated sprites.
 */

/**
 * Character visual definitions.
 * Each defines colors + pixel drawing instructions for profile view.
 */
const CHAR_VISUALS = {
    papet: {
        name: 'Papet',
        colors: {
            hat: '#4A5A8A',
            hatBand: '#3A4A6A',
            hair: '#9E8E7E',
            skin: '#E8C49A',
            skinShadow: '#D4A878',
            eyeColor: '#3A2E28',
            shirt: '#8B6BAA',
            shirtShadow: '#7A5A96',
            vest: '#6B5038',
            vestShadow: '#5A4028',
            pants: '#6B5038',
            pantsShadow: '#5A4028',
            shoes: '#4A3828',
        },
        // shoulder offset from body origin (0.5, 1) — where arm attaches
        shoulder: { x: 10, y: -36 },
        armLength: 20,
    },
    joueur: {
        name: 'Joueur',
        colors: {
            hair: '#8B6B4A',
            hairShadow: '#7A5A3A',
            skin: '#E8C49A',
            skinShadow: '#D4A878',
            eyeColor: '#3A2E28',
            shirt: '#4A8AC4',
            shirtShadow: '#3A6AA0',
            pants: '#8B7D5A',
            pantsShadow: '#7A6C4A',
            shoes: '#5A4A3A',
        },
        shoulder: { x: 10, y: -34 },
        armLength: 18,
    },
};

/**
 * Draw Papet body in profile view (facing right).
 * Béret, vest over purple shirt, brown pants.
 */
function drawPapetBody(ctx) {
    const c = CHAR_VISUALS.papet.colors;

    // === SHOES ===
    ctx.fillStyle = c.shoes;
    ctx.fillRect(24, 56, 12, 6);  // visible foot
    ctx.fillRect(22, 58, 14, 4);  // sole

    // === PANTS/LEGS ===
    ctx.fillStyle = c.pants;
    ctx.fillRect(24, 42, 10, 16);
    ctx.fillStyle = c.pantsShadow;
    ctx.fillRect(24, 42, 3, 16); // inner shadow

    // === BODY/SHIRT ===
    ctx.fillStyle = c.shirt;
    ctx.fillRect(20, 26, 16, 18);
    ctx.fillStyle = c.shirtShadow;
    ctx.fillRect(20, 26, 4, 18); // shadow side

    // === VEST (open, over shirt) ===
    ctx.fillStyle = c.vest;
    ctx.fillRect(18, 26, 4, 18); // left edge of vest
    ctx.fillRect(34, 26, 4, 18); // right edge
    ctx.fillStyle = c.vestShadow;
    ctx.fillRect(18, 26, 2, 18);

    // === LEFT ARM (non-throwing, hangs at side — back arm in profile) ===
    ctx.fillStyle = c.shirt;
    ctx.fillRect(18, 28, 5, 12);
    ctx.fillStyle = c.skin;
    ctx.fillRect(18, 38, 5, 5); // hand

    // === NECK ===
    ctx.fillStyle = c.skin;
    ctx.fillRect(26, 22, 8, 6);
    ctx.fillStyle = c.skinShadow;
    ctx.fillRect(26, 22, 3, 6);

    // === HEAD (profile, facing right) ===
    ctx.fillStyle = c.skin;
    ctx.fillRect(22, 6, 18, 18);
    ctx.fillStyle = c.skinShadow;
    ctx.fillRect(22, 6, 4, 18); // shadow on back of head

    // Nose (profile bump)
    ctx.fillStyle = c.skin;
    ctx.fillRect(38, 12, 4, 4);

    // Eye (single, profile)
    ctx.fillStyle = c.eyeColor;
    ctx.fillRect(34, 12, 3, 3);

    // Eyebrow
    ctx.fillStyle = c.hair;
    ctx.fillRect(33, 10, 5, 2);

    // Mouth
    ctx.fillStyle = c.eyeColor;
    ctx.fillRect(36, 18, 3, 2);

    // Mustache
    ctx.fillStyle = c.hair;
    ctx.fillRect(34, 16, 6, 2);

    // === HAIR (sides, visible under beret) ===
    ctx.fillStyle = c.hair;
    ctx.fillRect(22, 14, 4, 8); // back hair
    ctx.fillRect(22, 6, 4, 4);  // top back

    // === BERET ===
    ctx.fillStyle = c.hat;
    ctx.fillRect(20, 2, 22, 8);
    ctx.fillRect(18, 4, 26, 6);
    // Beret nub
    ctx.fillRect(30, 0, 4, 4);
    ctx.fillStyle = c.hatBand;
    ctx.fillRect(20, 8, 22, 2);
}

/**
 * Draw Joueur body in profile view (facing right).
 * Casual: brown hair, blue t-shirt, khaki pants.
 */
function drawJoueurBody(ctx) {
    const c = CHAR_VISUALS.joueur.colors;

    // === SHOES ===
    ctx.fillStyle = c.shoes;
    ctx.fillRect(24, 56, 12, 6);
    ctx.fillRect(22, 58, 14, 4);

    // === PANTS ===
    ctx.fillStyle = c.pants;
    ctx.fillRect(24, 42, 10, 16);
    ctx.fillStyle = c.pantsShadow;
    ctx.fillRect(24, 42, 3, 16);

    // === T-SHIRT ===
    ctx.fillStyle = c.shirt;
    ctx.fillRect(20, 26, 16, 18);
    ctx.fillStyle = c.shirtShadow;
    ctx.fillRect(20, 26, 4, 18);

    // === LEFT ARM (back arm, non-throwing) ===
    ctx.fillStyle = c.shirt;
    ctx.fillRect(18, 28, 5, 10);
    ctx.fillStyle = c.skin;
    ctx.fillRect(18, 36, 5, 5);

    // === NECK ===
    ctx.fillStyle = c.skin;
    ctx.fillRect(26, 22, 8, 6);

    // === HEAD (profile) ===
    ctx.fillStyle = c.skin;
    ctx.fillRect(22, 6, 18, 18);
    ctx.fillStyle = c.skinShadow;
    ctx.fillRect(22, 6, 4, 18);

    // Nose
    ctx.fillStyle = c.skin;
    ctx.fillRect(38, 12, 4, 4);

    // Eye
    ctx.fillStyle = c.eyeColor;
    ctx.fillRect(34, 12, 3, 3);

    // Eyebrow
    ctx.fillStyle = c.hairShadow;
    ctx.fillRect(33, 10, 5, 2);

    // Mouth (slight smile)
    ctx.fillStyle = c.eyeColor;
    ctx.fillRect(36, 18, 3, 1);
    ctx.fillRect(37, 19, 2, 1);

    // === HAIR ===
    ctx.fillStyle = c.hair;
    ctx.fillRect(22, 2, 18, 8);
    ctx.fillRect(20, 4, 4, 10);   // back hair
    ctx.fillRect(36, 2, 6, 6);    // front hair tuft
    ctx.fillStyle = c.hairShadow;
    ctx.fillRect(22, 6, 18, 2);   // hair shadow line
}

/**
 * Draw throwing arm (profile view, shoulder at top).
 * Generic arm shape, colored per character.
 */
function drawArm(ctx, shirtColor, skinColor, shirtShadow) {
    // Upper arm (shirt sleeve)
    ctx.fillStyle = shirtColor;
    ctx.fillRect(2, 0, 8, 10);
    ctx.fillStyle = shirtShadow || shirtColor;
    ctx.fillRect(2, 0, 3, 10);

    // Forearm (skin)
    ctx.fillStyle = skinColor;
    ctx.fillRect(3, 10, 7, 10);

    // Hand (wider, holding position)
    ctx.fillRect(2, 18, 9, 5);
    // Fingers
    ctx.fillRect(1, 20, 2, 3);
}

/**
 * Create all canvas textures for a character.
 * @param {Phaser.Scene} scene
 * @param {string} charId - 'papet' or 'joueur'
 */
export function createCharacterTextures(scene, charId) {
    const def = CHAR_VISUALS[charId];
    if (!def) return null;

    const size = 64;
    const bodyKey = `profile_body_${charId}`;
    const armKey = `profile_arm_${charId}`;

    // Body texture
    if (!scene.textures.exists(bodyKey)) {
        const bodyTex = scene.textures.createCanvas(bodyKey, size, size);
        const bodyCtx = bodyTex.getContext();
        bodyCtx.clearRect(0, 0, size, size);

        if (charId === 'papet') drawPapetBody(bodyCtx);
        else if (charId === 'joueur') drawJoueurBody(bodyCtx);

        bodyTex.refresh();
    }

    // Arm texture
    if (!scene.textures.exists(armKey)) {
        const armTex = scene.textures.createCanvas(armKey, 12, 24);
        const armCtx = armTex.getContext();
        armCtx.clearRect(0, 0, 12, 24);

        const colors = def.colors;
        drawArm(armCtx, colors.shirt, colors.skin, colors.shirtShadow);
        armTex.refresh();
    }

    return {
        bodyKey,
        armKey,
        shoulder: def.shoulder,
        armLength: def.armLength,
    };
}

/**
 * Create a simple 3D boule texture for the modular character's hand.
 */
export function createHandBallTexture(scene, key = 'modular_boule') {
    if (scene.textures.exists(key)) return key;
    const tex = scene.textures.createCanvas(key, 14, 14);
    const ctx = tex.getContext();
    const grad = ctx.createRadialGradient(5, 4, 1, 7, 7, 6);
    grad.addColorStop(0, '#E0E8F0');
    grad.addColorStop(0.4, '#A8B5C2');
    grad.addColorStop(1, '#606870');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(7, 7, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.arc(5, 5, 2, 0, Math.PI * 2);
    ctx.fill();
    tex.refresh();
    return key;
}

export { CHAR_VISUALS };
