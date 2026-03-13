import { TILE_SIZE } from '../utils/Constants.js';

const SPRITE_W = 16;
const SPRITE_H = 24;

// Helper: single pixel
function px(ctx, x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 1, 1);
}

// Helper: darken a hex color
function darken(hex, amount = 30) {
    const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - amount);
    const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - amount);
    const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - amount);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// Helper: lighten a hex color
function lighten(hex, amount = 30) {
    const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + amount);
    const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + amount);
    const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + amount);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// Generate a character spritesheet: 4 directions x 4 frames = 16 frames
// Layout: row 0 = down, row 1 = left, row 2 = right, row 3 = up
export function generateCharacterSprite(scene, key, palette) {
    const cols = 4;
    const rows = 4;
    const canvas = document.createElement('canvas');
    canvas.width = SPRITE_W * cols;
    canvas.height = SPRITE_H * rows;
    const ctx = canvas.getContext('2d');

    const directions = ['down', 'left', 'right', 'up'];

    for (let dir = 0; dir < 4; dir++) {
        for (let frame = 0; frame < 4; frame++) {
            ctx.save();
            ctx.translate(frame * SPRITE_W, dir * SPRITE_H);
            drawCharacter(ctx, directions[dir], frame, palette);
            ctx.restore();
        }
    }

    scene.textures.addSpriteSheet(key, canvas, {
        frameWidth: SPRITE_W,
        frameHeight: SPRITE_H
    });
}

function drawCharacter(ctx, dir, frame, p) {
    const isMoving = frame > 0;
    const legAnim = isMoving ? (frame % 2 === 0 ? 0 : (frame < 2 ? -1 : 1)) : 0;
    const armSwing = isMoving ? (frame % 2 === 0 ? 0 : (frame < 2 ? 1 : -1)) : 0;

    // Precompute colors
    const shirtDark = darken(p.shirt, 25);
    const shirtLight = lighten(p.shirt, 20);
    const skinDark = darken(p.skin, 20);
    const pantsDark = darken(p.pants, 20);
    const hairDark = darken(p.hair, 20);

    // Shadow (ellipse-ish)
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(4, 22, 8, 2);
    ctx.fillRect(5, 21, 6, 1);

    // === LEGS ===
    ctx.fillStyle = p.pants;
    const pantsDk = pantsDark;
    if (legAnim === 0) {
        ctx.fillRect(5, 18, 3, 4);
        ctx.fillRect(8, 18, 3, 4);
        // Shading
        px(ctx, 5, 18, pantsDk);
        px(ctx, 8, 18, pantsDk);
    } else if (legAnim < 0) {
        ctx.fillRect(4, 18, 3, 4);
        ctx.fillRect(9, 18, 3, 3);
        px(ctx, 4, 18, pantsDk);
    } else {
        ctx.fillRect(5, 18, 3, 3);
        ctx.fillRect(9, 18, 3, 4);
        px(ctx, 9, 18, pantsDk);
    }

    // === SHOES ===
    ctx.fillStyle = p.shoes;
    if (legAnim === 0) {
        ctx.fillRect(5, 22, 3, 2);
        ctx.fillRect(8, 22, 3, 2);
    } else if (legAnim < 0) {
        ctx.fillRect(4, 22, 3, 2);
        ctx.fillRect(9, 21, 3, 2);
    } else {
        ctx.fillRect(5, 21, 3, 2);
        ctx.fillRect(9, 22, 3, 2);
    }
    // Shoe highlight
    px(ctx, 5, 22, lighten(p.shoes, 30));
    px(ctx, 8, 22, lighten(p.shoes, 30));

    // === BODY ===
    ctx.fillStyle = p.shirt;
    ctx.fillRect(4, 10, 8, 8);
    // Shirt shading (left side darker)
    ctx.fillStyle = shirtDark;
    ctx.fillRect(4, 10, 1, 8);
    ctx.fillRect(4, 17, 8, 1);
    // Shirt highlight (top-right)
    px(ctx, 10, 11, shirtLight);
    px(ctx, 9, 11, shirtLight);
    // Collar
    if (dir === 'down') {
        px(ctx, 6, 10, shirtDark);
        px(ctx, 9, 10, shirtDark);
        ctx.fillStyle = p.skin;
        px(ctx, 7, 10, p.skin);
        px(ctx, 8, 10, p.skin);
    }

    // === ARMS ===
    const armLen = 5 + (armSwing !== 0 ? 1 : 0);
    if (dir === 'left') {
        ctx.fillStyle = p.shirt;
        ctx.fillRect(3, 11, 2, armLen);
        ctx.fillStyle = shirtDark;
        px(ctx, 3, 11, shirtDark);
        // Hand
        ctx.fillStyle = p.skin;
        ctx.fillRect(3, 11 + armLen - 1, 2, 1);
    } else if (dir === 'right') {
        ctx.fillStyle = p.shirt;
        ctx.fillRect(11, 11, 2, armLen);
        ctx.fillStyle = shirtDark;
        px(ctx, 12, 11, shirtDark);
        ctx.fillStyle = p.skin;
        ctx.fillRect(11, 11 + armLen - 1, 2, 1);
    } else {
        // Front/back: both arms
        const leftArmLen = 5 + (armSwing > 0 ? 1 : 0);
        const rightArmLen = 5 + (armSwing < 0 ? 1 : 0);
        ctx.fillStyle = p.shirt;
        ctx.fillRect(2, 11, 2, leftArmLen);
        ctx.fillRect(12, 11, 2, rightArmLen);
        // Shading
        px(ctx, 2, 11, shirtDark);
        px(ctx, 13, 11, shirtDark);
        // Hands
        ctx.fillStyle = p.skin;
        ctx.fillRect(2, 11 + leftArmLen - 1, 2, 1);
        ctx.fillRect(12, 11 + rightArmLen - 1, 2, 1);
    }

    // === HEAD ===
    ctx.fillStyle = p.skin;
    ctx.fillRect(4, 2, 8, 8);
    // Face shading
    ctx.fillStyle = skinDark;
    ctx.fillRect(4, 2, 1, 8);
    ctx.fillRect(4, 9, 8, 1);

    // === HAIR ===
    ctx.fillStyle = p.hair;
    if (dir === 'down') {
        ctx.fillRect(3, 1, 10, 3);
        ctx.fillRect(3, 1, 2, 5);
        ctx.fillRect(11, 1, 2, 5);
        // Hair detail
        px(ctx, 5, 1, hairDark);
        px(ctx, 9, 1, hairDark);
    } else if (dir === 'up') {
        ctx.fillRect(3, 0, 10, 7);
        // Hair texture
        px(ctx, 5, 1, hairDark);
        px(ctx, 8, 2, hairDark);
        px(ctx, 6, 4, hairDark);
    } else if (dir === 'left') {
        ctx.fillRect(3, 1, 10, 3);
        ctx.fillRect(3, 1, 3, 7);
        px(ctx, 3, 7, p.hair);
        px(ctx, 4, 1, hairDark);
    } else {
        ctx.fillRect(3, 1, 10, 3);
        ctx.fillRect(10, 1, 3, 7);
        px(ctx, 12, 7, p.hair);
        px(ctx, 11, 1, hairDark);
    }

    // === EYES ===
    if (dir === 'down') {
        // White of eyes
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(5, 5, 2, 2);
        ctx.fillRect(9, 5, 2, 2);
        // Pupils
        ctx.fillStyle = p.eyes || '#3A2E28';
        ctx.fillRect(6, 5, 1, 2);
        ctx.fillRect(10, 5, 1, 2);
        // Eye shine
        px(ctx, 5, 5, '#FFFFFF');
        px(ctx, 9, 5, '#FFFFFF');
        // Mouth
        px(ctx, 7, 8, skinDark);
        px(ctx, 8, 8, skinDark);
    } else if (dir === 'left') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(4, 5, 2, 2);
        ctx.fillStyle = p.eyes || '#3A2E28';
        ctx.fillRect(4, 5, 1, 2);
        px(ctx, 5, 5, '#FFFFFF');
        // Mouth
        px(ctx, 5, 8, skinDark);
    } else if (dir === 'right') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(10, 5, 2, 2);
        ctx.fillStyle = p.eyes || '#3A2E28';
        ctx.fillRect(11, 5, 1, 2);
        px(ctx, 10, 5, '#FFFFFF');
        px(ctx, 10, 8, skinDark);
    }

    // === HAT ===
    if (p.hat) {
        const hatDark = darken(p.hat, 25);
        ctx.fillStyle = p.hat;
        ctx.fillRect(3, 0, 10, 2);
        ctx.fillStyle = hatDark;
        ctx.fillRect(3, 1, 10, 1);
        // Brim
        if (dir === 'down' || dir === 'left') {
            ctx.fillStyle = p.hat;
            ctx.fillRect(2, 2, 3, 1);
        }
        if (dir === 'down' || dir === 'right') {
            ctx.fillStyle = p.hat;
            ctx.fillRect(11, 2, 3, 1);
        }
        // Hat band
        ctx.fillStyle = hatDark;
        ctx.fillRect(3, 0, 10, 1);
    }

    // === OUTLINE (subtle) ===
    // Only on key edges for pixel art readability at small size
    ctx.fillStyle = 'rgba(30,20,15,0.25)';
    // Head outline
    px(ctx, 3, 2, 'rgba(30,20,15,0.2)');
    px(ctx, 12, 2, 'rgba(30,20,15,0.2)');
}

// Predefined character palettes
export const PALETTES = {
    player: {
        skin: '#E8B890',
        hair: '#6B4E3A',
        shirt: '#4A7AB0',
        pants: '#3A5A80',
        shoes: '#3A2E28',
        eyes: '#3A2E28'
    },
    npc_vieux_maitre: {
        skin: '#D4A880',
        hair: '#C0C0C0',
        shirt: '#8B7060',
        pants: '#6B5040',
        shoes: '#3A2E28',
        eyes: '#3A2E28',
        hat: '#C4854A'
    },
    npc_marcel: {
        skin: '#D4A880',
        hair: '#4A3020',
        shirt: '#C44B3F',
        pants: '#503A28',
        shoes: '#3A2E28',
        eyes: '#3A2E28',
        hat: '#E8D5B7'
    },
    npc_villager_1: {
        skin: '#E8C8A0',
        hair: '#C4854A',
        shirt: '#6B8E4E',
        pants: '#4A6A3A',
        shoes: '#503A28',
        eyes: '#3A2E28'
    },
    npc_villager_2: {
        skin: '#E8B890',
        hair: '#8B6B4A',
        shirt: '#9B7BB8',
        pants: '#6B5A80',
        shoes: '#3A2E28',
        eyes: '#3A2E28'
    },
    npc_dresseur: {
        skin: '#E8C8A0',
        hair: '#3A2E28',
        shirt: '#E8C840',
        pants: '#4A7AB0',
        shoes: '#3A2E28',
        eyes: '#3A2E28',
        hat: '#C44B3F'
    },
    npc_rival: {
        skin: '#E8B890',
        hair: '#1A1A2E',
        shirt: '#2D2D44',
        pants: '#1A1A2E',
        shoes: '#0A0A15',
        eyes: '#3A2E28',
        hat: '#C44B3F'
    },
    npc_dresseur_2: {
        skin: '#E8C8A0',
        hair: '#C4854A',
        shirt: '#9B7BB8',
        pants: '#6B5A80',
        shoes: '#3A2E28',
        eyes: '#3A2E28'
    },
    npc_dresseur_3: {
        skin: '#D4A880',
        hair: '#C0C0C0',
        shirt: '#6B8E4E',
        pants: '#4A6A3A',
        shoes: '#503A28',
        eyes: '#3A2E28',
        hat: '#8B6B4A'
    },
    npc_gate: {
        skin: '#D4A880',
        hair: '#4A3020',
        shirt: '#4A5A6A',
        pants: '#3A4A5A',
        shoes: '#3A2E28',
        eyes: '#3A2E28'
    }
};
