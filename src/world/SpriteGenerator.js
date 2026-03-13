import { TILE_SIZE } from '../utils/Constants.js';

const SPRITE_W = 16;
const SPRITE_H = 24;

// Generate a character spritesheet: 4 directions x 4 frames = 16 frames
// Layout: row 0 = down, row 1 = left, row 2 = right, row 3 = up
// Each row has 4 walk frames (frame 0 = idle)
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
    const walkOffset = frame % 2 === 1 ? 1 : 0;
    const isMoving = frame > 0;
    const legAnim = isMoving ? (frame % 2 === 0 ? 0 : (frame < 2 ? -1 : 1)) : 0;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(3, 21, 10, 3);

    // Body
    ctx.fillStyle = p.shirt;
    ctx.fillRect(4, 10, 8, 8);

    // Legs
    ctx.fillStyle = p.pants;
    if (legAnim === 0) {
        ctx.fillRect(5, 18, 3, 4);
        ctx.fillRect(9, 18, 3, 4);
    } else if (legAnim < 0) {
        ctx.fillRect(4, 18, 3, 4);
        ctx.fillRect(10, 18, 3, 3);
    } else {
        ctx.fillRect(5, 18, 3, 3);
        ctx.fillRect(9, 18, 3, 4);
    }

    // Shoes
    ctx.fillStyle = p.shoes;
    ctx.fillRect(5, 22, 3, 2);
    ctx.fillRect(9, 22, 3, 2);

    // Head
    ctx.fillStyle = p.skin;
    ctx.fillRect(4, 2, 8, 8);

    // Hair
    ctx.fillStyle = p.hair;
    if (dir === 'down') {
        ctx.fillRect(3, 1, 10, 3);
        ctx.fillRect(3, 1, 2, 5);
        ctx.fillRect(11, 1, 2, 5);
    } else if (dir === 'up') {
        ctx.fillRect(3, 1, 10, 6);
    } else if (dir === 'left') {
        ctx.fillRect(3, 1, 10, 3);
        ctx.fillRect(3, 1, 3, 6);
    } else {
        ctx.fillRect(3, 1, 10, 3);
        ctx.fillRect(10, 1, 3, 6);
    }

    // Eyes (only on front/side views)
    if (dir === 'down') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(5, 5, 2, 2);
        ctx.fillRect(9, 5, 2, 2);
        ctx.fillStyle = p.eyes || '#3A2E28';
        ctx.fillRect(6, 5, 1, 2);
        ctx.fillRect(10, 5, 1, 2);
    } else if (dir === 'left') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(4, 5, 2, 2);
        ctx.fillStyle = p.eyes || '#3A2E28';
        ctx.fillRect(4, 5, 1, 2);
    } else if (dir === 'right') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(10, 5, 2, 2);
        ctx.fillStyle = p.eyes || '#3A2E28';
        ctx.fillRect(11, 5, 1, 2);
    }

    // Hat (optional)
    if (p.hat) {
        ctx.fillStyle = p.hat;
        ctx.fillRect(3, 0, 10, 2);
        if (dir === 'down' || dir === 'left') {
            ctx.fillRect(2, 2, 3, 1);
        }
        if (dir === 'down' || dir === 'right') {
            ctx.fillRect(11, 2, 3, 1);
        }
    }

    // Arms
    ctx.fillStyle = p.shirt;
    if (dir === 'left') {
        ctx.fillRect(3, 11, 2, 6);
    } else if (dir === 'right') {
        ctx.fillRect(11, 11, 2, 6);
    } else {
        ctx.fillRect(2, 11, 2, 5 + walkOffset);
        ctx.fillRect(12, 11, 2, 5 + (isMoving ? 1 - walkOffset : 0));
    }

    // Skin on arms
    ctx.fillStyle = p.skin;
    if (dir === 'left') {
        ctx.fillRect(3, 15, 2, 2);
    } else if (dir === 'right') {
        ctx.fillRect(11, 15, 2, 2);
    } else {
        ctx.fillRect(2, 15, 2, 1);
        ctx.fillRect(12, 15, 2, 1);
    }
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
