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

// Outline color - warm dark, never pure black
const OL = '#2A1E15';

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
    const shirtDark = darken(p.shirt, 30);
    const shirtLight = lighten(p.shirt, 25);
    const skinDark = darken(p.skin, 25);
    const skinLight = lighten(p.skin, 15);
    const pantsDark = darken(p.pants, 25);
    const pantsLight = lighten(p.pants, 15);
    const hairDark = darken(p.hair, 25);
    const hairLight = lighten(p.hair, 20);
    const shoesDark = darken(p.shoes, 20);

    // ============================================
    // SHADOW (soft ellipse)
    // ============================================
    ctx.fillStyle = 'rgba(42,30,21,0.22)';
    ctx.fillRect(4, 22, 8, 2);
    ctx.fillRect(5, 21, 6, 1);
    px(ctx, 3, 22, 'rgba(42,30,21,0.10)');
    px(ctx, 12, 22, 'rgba(42,30,21,0.10)');

    // ============================================
    // SHOES (draw first, legs overlap)
    // ============================================
    if (legAnim === 0) {
        // Left shoe
        ctx.fillStyle = p.shoes;
        ctx.fillRect(5, 21, 3, 2);
        px(ctx, 5, 21, shoesDark); // toe shadow
        // Right shoe
        ctx.fillRect(8, 21, 3, 2);
        px(ctx, 8, 21, shoesDark);
        // Sole highlight
        px(ctx, 6, 22, lighten(p.shoes, 25));
        px(ctx, 9, 22, lighten(p.shoes, 25));
    } else if (legAnim < 0) {
        ctx.fillStyle = p.shoes;
        ctx.fillRect(4, 21, 3, 2);
        ctx.fillRect(9, 20, 3, 2);
        px(ctx, 4, 21, shoesDark);
    } else {
        ctx.fillStyle = p.shoes;
        ctx.fillRect(5, 20, 3, 2);
        ctx.fillRect(9, 21, 3, 2);
        px(ctx, 9, 21, shoesDark);
    }

    // ============================================
    // LEGS
    // ============================================
    ctx.fillStyle = p.pants;
    if (legAnim === 0) {
        ctx.fillRect(5, 17, 3, 4);
        ctx.fillRect(8, 17, 3, 4);
        // Inner seam shadow
        px(ctx, 7, 18, pantsDark);
        px(ctx, 8, 18, pantsDark);
        // Highlight
        px(ctx, 6, 17, pantsLight);
        px(ctx, 9, 17, pantsLight);
    } else if (legAnim < 0) {
        ctx.fillRect(4, 17, 3, 4);
        ctx.fillRect(9, 17, 3, 3);
        px(ctx, 4, 17, pantsDark);
        px(ctx, 5, 17, pantsLight);
    } else {
        ctx.fillRect(5, 17, 3, 3);
        ctx.fillRect(9, 17, 3, 4);
        px(ctx, 9, 17, pantsDark);
        px(ctx, 10, 17, pantsLight);
    }
    // Belt line
    ctx.fillStyle = darken(p.pants, 40);
    ctx.fillRect(5, 17, 6, 1);

    // ============================================
    // BODY / TORSO
    // ============================================
    ctx.fillStyle = p.shirt;
    ctx.fillRect(4, 10, 8, 7);

    // Shirt shading - 3-tone
    ctx.fillStyle = shirtDark;
    ctx.fillRect(4, 10, 1, 7);   // left edge dark
    ctx.fillRect(4, 16, 8, 1);   // bottom dark
    ctx.fillStyle = shirtLight;
    px(ctx, 9, 11, shirtLight);   // highlight
    px(ctx, 10, 11, shirtLight);
    px(ctx, 10, 12, shirtLight);

    // Collar detail (front view)
    if (dir === 'down') {
        // V-neck or collar
        px(ctx, 7, 10, p.skin);
        px(ctx, 8, 10, p.skin);
        px(ctx, 6, 10, shirtDark);
        px(ctx, 9, 10, shirtDark);
    }

    // Stripe detail if palette has stripes (marinière)
    if (p.stripes) {
        ctx.fillStyle = p.stripes;
        ctx.fillRect(5, 12, 6, 1);
        ctx.fillRect(5, 14, 6, 1);
    }

    // Gold chain if palette has it
    if (p.chain) {
        ctx.fillStyle = p.chain;
        if (dir === 'down') {
            px(ctx, 7, 11, p.chain);
            px(ctx, 8, 11, p.chain);
            px(ctx, 7, 12, p.chain);
        } else if (dir === 'left') {
            px(ctx, 6, 11, p.chain);
            px(ctx, 5, 12, p.chain);
        } else if (dir === 'right') {
            px(ctx, 9, 11, p.chain);
            px(ctx, 10, 12, p.chain);
        }
    }

    // ============================================
    // ARMS
    // ============================================
    const armLen = 5 + (armSwing !== 0 ? 1 : 0);

    if (dir === 'left') {
        // Only front arm visible
        ctx.fillStyle = p.shirt;
        ctx.fillRect(3, 11, 2, armLen);
        ctx.fillStyle = shirtDark;
        px(ctx, 3, 11, shirtDark);
        px(ctx, 3, 12, shirtDark);
        // Hand
        ctx.fillStyle = p.skin;
        ctx.fillRect(3, 11 + armLen - 1, 2, 1);
        px(ctx, 3, 11 + armLen - 1, skinDark);
    } else if (dir === 'right') {
        ctx.fillStyle = p.shirt;
        ctx.fillRect(11, 11, 2, armLen);
        ctx.fillStyle = shirtDark;
        px(ctx, 12, 11, shirtDark);
        px(ctx, 12, 12, shirtDark);
        ctx.fillStyle = p.skin;
        ctx.fillRect(11, 11 + armLen - 1, 2, 1);
        px(ctx, 12, 11 + armLen - 1, skinDark);
    } else {
        // Front/back: both arms
        const leftArmLen = 5 + (armSwing > 0 ? 1 : 0);
        const rightArmLen = 5 + (armSwing < 0 ? 1 : 0);
        // Left arm
        ctx.fillStyle = p.shirt;
        ctx.fillRect(2, 11, 2, leftArmLen);
        px(ctx, 2, 11, shirtDark);
        // Right arm
        ctx.fillRect(12, 11, 2, rightArmLen);
        px(ctx, 13, 11, shirtDark);
        // Hands
        ctx.fillStyle = p.skin;
        ctx.fillRect(2, 11 + leftArmLen - 1, 2, 1);
        ctx.fillRect(12, 11 + rightArmLen - 1, 2, 1);
        // Hand shading
        px(ctx, 2, 11 + leftArmLen - 1, skinDark);
        px(ctx, 13, 11 + rightArmLen - 1, skinDark);
    }

    // ============================================
    // HEAD
    // ============================================
    ctx.fillStyle = p.skin;
    ctx.fillRect(4, 2, 8, 8);

    // Face shading - 3-tone for depth
    ctx.fillStyle = skinDark;
    ctx.fillRect(4, 2, 1, 8);  // left shadow
    ctx.fillRect(4, 9, 8, 1);  // chin shadow
    if (dir === 'left') {
        ctx.fillRect(10, 3, 2, 5); // right side shadow when facing left
    } else if (dir === 'right') {
        ctx.fillRect(4, 3, 2, 5);
    }
    // Cheek highlight
    ctx.fillStyle = skinLight;
    if (dir === 'down') {
        px(ctx, 10, 6, skinLight);
    }

    // ============================================
    // HAIR (different styles per palette)
    // ============================================
    const hairStyle = p.hairStyle || 'default';

    ctx.fillStyle = p.hair;
    if (hairStyle === 'wild') {
        // Wild/tousled hair (Marcel/Foyot style)
        if (dir === 'down') {
            ctx.fillRect(3, 0, 10, 4);
            ctx.fillRect(2, 1, 2, 3);  // wild left
            ctx.fillRect(12, 1, 2, 3); // wild right
            ctx.fillRect(3, 0, 2, 6);
            ctx.fillRect(11, 0, 2, 6);
            px(ctx, 5, 0, hairLight);
            px(ctx, 9, 0, hairLight);
            px(ctx, 2, 2, hairLight);
            px(ctx, 13, 2, hairLight);
        } else if (dir === 'up') {
            ctx.fillRect(2, 0, 12, 7);
            px(ctx, 5, 1, hairLight);
            px(ctx, 8, 2, hairDark);
            px(ctx, 4, 4, hairLight);
            px(ctx, 10, 3, hairLight);
            px(ctx, 2, 3, hairLight);
            px(ctx, 13, 4, hairLight);
        } else if (dir === 'left') {
            ctx.fillRect(3, 0, 10, 4);
            ctx.fillRect(2, 1, 3, 6);
            px(ctx, 2, 0, p.hair);
            px(ctx, 3, 6, hairLight);
        } else {
            ctx.fillRect(3, 0, 10, 4);
            ctx.fillRect(11, 1, 3, 6);
            px(ctx, 13, 0, p.hair);
            px(ctx, 12, 6, hairLight);
        }
    } else if (hairStyle === 'spiky') {
        // Spiky blond hair (Bastien/Rocher style)
        if (dir === 'down') {
            ctx.fillRect(3, 1, 10, 3);
            ctx.fillRect(3, 1, 2, 4);
            ctx.fillRect(11, 1, 2, 4);
            // Spikes on top
            px(ctx, 4, 0, p.hair);
            px(ctx, 7, 0, p.hair);
            px(ctx, 10, 0, p.hair);
            px(ctx, 5, 0, hairLight);
            px(ctx, 9, 0, hairLight);
            px(ctx, 6, 1, hairLight);
        } else if (dir === 'up') {
            ctx.fillRect(3, 0, 10, 6);
            px(ctx, 4, 0, hairLight);
            px(ctx, 7, 0, hairLight);
            px(ctx, 10, 0, hairLight);
            px(ctx, 6, 2, hairDark);
        } else if (dir === 'left') {
            ctx.fillRect(3, 0, 10, 3);
            ctx.fillRect(3, 0, 3, 6);
            px(ctx, 5, 0, hairLight);
            px(ctx, 8, 0, p.hair);
        } else {
            ctx.fillRect(3, 0, 10, 3);
            ctx.fillRect(10, 0, 3, 6);
            px(ctx, 10, 0, hairLight);
            px(ctx, 7, 0, p.hair);
        }
    } else if (hairStyle === 'bald_top') {
        // Balding / thin (old men)
        if (dir === 'down') {
            ctx.fillRect(3, 2, 2, 5);
            ctx.fillRect(11, 2, 2, 5);
            ctx.fillRect(3, 1, 10, 1);
            px(ctx, 5, 1, hairLight);
        } else if (dir === 'up') {
            ctx.fillRect(3, 1, 10, 4);
            px(ctx, 6, 2, hairLight);
        } else if (dir === 'left') {
            ctx.fillRect(3, 1, 5, 2);
            ctx.fillRect(3, 1, 3, 6);
        } else {
            ctx.fillRect(8, 1, 5, 2);
            ctx.fillRect(10, 1, 3, 6);
        }
    } else {
        // Default neat hair
        if (dir === 'down') {
            ctx.fillRect(3, 1, 10, 3);
            ctx.fillRect(3, 1, 2, 5);
            ctx.fillRect(11, 1, 2, 5);
            px(ctx, 5, 1, hairDark);
            px(ctx, 9, 1, hairDark);
            px(ctx, 7, 1, hairLight);
        } else if (dir === 'up') {
            ctx.fillRect(3, 0, 10, 7);
            px(ctx, 5, 1, hairDark);
            px(ctx, 8, 2, hairDark);
            px(ctx, 6, 4, hairLight);
        } else if (dir === 'left') {
            ctx.fillRect(3, 1, 10, 3);
            ctx.fillRect(3, 1, 3, 7);
            px(ctx, 4, 1, hairDark);
            px(ctx, 3, 5, hairLight);
        } else {
            ctx.fillRect(3, 1, 10, 3);
            ctx.fillRect(10, 1, 3, 7);
            px(ctx, 11, 1, hairDark);
            px(ctx, 12, 5, hairLight);
        }
    }

    // ============================================
    // EYES (more expressive)
    // ============================================
    const eyeColor = p.eyes || '#3A2E28';

    if (dir === 'down') {
        // Larger, more expressive eyes with colored pupils
        // Left eye
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(5, 5, 3, 2);
        ctx.fillStyle = eyeColor;
        px(ctx, 6, 5, eyeColor);
        px(ctx, 6, 6, eyeColor);
        // Eye shine
        px(ctx, 5, 5, '#FFFFFF');

        // Right eye
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(9, 5, 3, 2);
        ctx.fillStyle = eyeColor;
        px(ctx, 10, 5, eyeColor);
        px(ctx, 10, 6, eyeColor);
        px(ctx, 9, 5, '#FFFFFF');

        // Eyebrows (adds expression!)
        ctx.fillStyle = darken(p.hair, 15);
        ctx.fillRect(5, 4, 3, 1);
        ctx.fillRect(9, 4, 3, 1);

        // Mouth
        ctx.fillStyle = darken(p.skin, 35);
        px(ctx, 7, 8, darken(p.skin, 35));
        px(ctx, 8, 8, darken(p.skin, 35));

        // Nose hint
        px(ctx, 8, 7, skinDark);

        // Special expressions
        if (p.expression === 'smirk') {
            px(ctx, 9, 8, darken(p.skin, 35)); // wider smirk
        } else if (p.expression === 'stern') {
            // Angled eyebrows
            px(ctx, 5, 4, darken(p.hair, 30));
            px(ctx, 11, 4, darken(p.hair, 30));
        }
    } else if (dir === 'left') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(4, 5, 3, 2);
        ctx.fillStyle = eyeColor;
        px(ctx, 4, 5, eyeColor);
        px(ctx, 4, 6, eyeColor);
        px(ctx, 5, 5, '#FFFFFF');
        // Eyebrow
        ctx.fillStyle = darken(p.hair, 15);
        ctx.fillRect(4, 4, 3, 1);
        // Nose
        px(ctx, 3, 6, skinDark);
        // Mouth
        px(ctx, 5, 8, darken(p.skin, 35));
    } else if (dir === 'right') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(9, 5, 3, 2);
        ctx.fillStyle = eyeColor;
        px(ctx, 11, 5, eyeColor);
        px(ctx, 11, 6, eyeColor);
        px(ctx, 10, 5, '#FFFFFF');
        // Eyebrow
        ctx.fillStyle = darken(p.hair, 15);
        ctx.fillRect(9, 4, 3, 1);
        // Nose
        px(ctx, 12, 6, skinDark);
        // Mouth
        px(ctx, 10, 8, darken(p.skin, 35));
    }
    // No eyes for 'up' direction (back of head)

    // ============================================
    // FACIAL HAIR (mustache, beard)
    // ============================================
    if (p.mustache) {
        ctx.fillStyle = p.mustache;
        if (dir === 'down') {
            ctx.fillRect(6, 7, 4, 1);
            px(ctx, 5, 7, p.mustache); // wider stache
            px(ctx, 10, 7, p.mustache);
        } else if (dir === 'left') {
            ctx.fillRect(4, 7, 3, 1);
        } else if (dir === 'right') {
            ctx.fillRect(9, 7, 3, 1);
        }
    }
    if (p.beard) {
        ctx.fillStyle = p.beard;
        if (dir === 'down') {
            ctx.fillRect(5, 8, 6, 2);
            px(ctx, 6, 9, darken(p.beard, 15));
        } else if (dir === 'left') {
            ctx.fillRect(4, 8, 3, 2);
        } else if (dir === 'right') {
            ctx.fillRect(9, 8, 3, 2);
        }
    }

    // ============================================
    // HAT / BERET / CASQUETTE
    // ============================================
    if (p.hat) {
        const hatDark = darken(p.hat, 30);
        const hatLight = lighten(p.hat, 20);

        if (p.hatStyle === 'beret') {
            // Round beret (Papet style)
            ctx.fillStyle = p.hat;
            if (dir === 'down') {
                ctx.fillRect(3, 0, 10, 3);
                px(ctx, 2, 1, p.hat);
                px(ctx, 13, 1, p.hat);
                px(ctx, 7, 0, hatLight);
                px(ctx, 8, 0, hatLight);
                ctx.fillStyle = hatDark;
                ctx.fillRect(3, 2, 10, 1);
            } else if (dir === 'up') {
                ctx.fillRect(3, 0, 10, 3);
                px(ctx, 2, 1, p.hat);
                ctx.fillStyle = hatDark;
                ctx.fillRect(3, 2, 10, 1);
            } else if (dir === 'left') {
                ctx.fillRect(2, 0, 10, 3);
                px(ctx, 1, 1, p.hat);
                ctx.fillStyle = hatDark;
                ctx.fillRect(2, 2, 10, 1);
            } else {
                ctx.fillRect(4, 0, 10, 3);
                px(ctx, 14, 1, p.hat);
                ctx.fillStyle = hatDark;
                ctx.fillRect(4, 2, 10, 1);
            }
        } else if (p.hatStyle === 'casquette') {
            // Flat cap / casquette (Marcel style)
            ctx.fillStyle = p.hat;
            if (dir === 'down') {
                ctx.fillRect(3, 0, 10, 2);
                ctx.fillRect(2, 2, 12, 1); // wide brim
                ctx.fillStyle = hatDark;
                ctx.fillRect(2, 2, 12, 1); // brim shadow
                px(ctx, 5, 0, hatLight);
            } else if (dir === 'up') {
                ctx.fillRect(3, 0, 10, 2);
                px(ctx, 7, 0, hatLight);
            } else if (dir === 'left') {
                ctx.fillRect(2, 0, 10, 2);
                ctx.fillRect(1, 2, 5, 1); // brim sticks out left
                ctx.fillStyle = hatDark;
                ctx.fillRect(1, 2, 5, 1);
            } else {
                ctx.fillRect(4, 0, 10, 2);
                ctx.fillRect(10, 2, 5, 1); // brim sticks out right
                ctx.fillStyle = hatDark;
                ctx.fillRect(10, 2, 5, 1);
            }
        } else if (p.hatStyle === 'bandana') {
            // Bandana/headband
            ctx.fillStyle = p.hat;
            ctx.fillRect(3, 1, 10, 2);
            ctx.fillStyle = hatDark;
            ctx.fillRect(3, 2, 10, 1);
        } else {
            // Default hat
            ctx.fillStyle = p.hat;
            ctx.fillRect(3, 0, 10, 2);
            ctx.fillStyle = hatDark;
            ctx.fillRect(3, 1, 10, 1);
            if (dir === 'down' || dir === 'left') {
                ctx.fillStyle = p.hat;
                ctx.fillRect(2, 2, 3, 1);
            }
            if (dir === 'down' || dir === 'right') {
                ctx.fillStyle = p.hat;
                ctx.fillRect(11, 2, 3, 1);
            }
        }
    }

    // ============================================
    // SUNGLASSES
    // ============================================
    if (p.sunglasses) {
        if (dir === 'down') {
            ctx.fillStyle = '#1A1A2E';
            ctx.fillRect(5, 5, 3, 2);
            ctx.fillRect(9, 5, 3, 2);
            // Frame bridge
            px(ctx, 8, 5, '#3A3A4A');
            // Lens shine
            px(ctx, 5, 5, '#4A4A6A');
            px(ctx, 9, 5, '#4A4A6A');
        } else if (dir === 'left') {
            ctx.fillStyle = '#1A1A2E';
            ctx.fillRect(4, 5, 3, 2);
            px(ctx, 4, 5, '#4A4A6A');
        } else if (dir === 'right') {
            ctx.fillStyle = '#1A1A2E';
            ctx.fillRect(9, 5, 3, 2);
            px(ctx, 11, 5, '#4A4A6A');
        }
    }

    // ============================================
    // BODY OUTLINE (warm, subtle, adds readability)
    // ============================================
    // Head outline
    const olAlpha = 'rgba(42,30,21,0.35)';
    if (dir === 'down') {
        // Top of head
        for (let x = 4; x < 12; x++) px(ctx, x, 1, olAlpha);
        if (!p.hat) px(ctx, 3, 2, olAlpha);
        if (!p.hat) px(ctx, 12, 2, olAlpha);
        // Sides
        px(ctx, 3, 3, olAlpha);
        px(ctx, 3, 4, olAlpha);
        px(ctx, 12, 3, olAlpha);
        px(ctx, 12, 4, olAlpha);
    }
    // Body sides
    px(ctx, 1, 12, olAlpha);
    px(ctx, 14, 12, olAlpha);
}

// ================================================================
// CHARACTER PALETTES - Inspired by real petanque legends
// ================================================================
export const PALETTES = {
    // JOUEUR - Young provençal hero
    // Casual but distinctive: blue polo, khaki pants
    player: {
        skin: '#E8B890',
        hair: '#6B4E3A',        // Brown hair, neat
        shirt: '#4A7AB0',       // Blue polo (classic sport)
        pants: '#B0A080',       // Khaki/beige pants
        shoes: '#5A4030',       // Brown leather
        eyes: '#3A5A80',        // Blue-grey eyes
        hairStyle: 'default'
    },

    // LE PAPET - Inspired by Henri Lacroix (GOAT pointeur)
    // Elegant older man, blue beret, wise face, from Le Var
    npc_vieux_maitre: {
        skin: '#D4A880',        // Tanned skin (provençal sun)
        hair: '#C8C8C8',        // Silver/grey hair
        shirt: '#5A4A70',       // Deep purple/mauve shirt (distinguished)
        pants: '#6B6050',       // Brown trousers
        shoes: '#4A3828',       // Dark leather
        eyes: '#3A2E28',
        hat: '#2A4A7A',         // Blue beret!
        hatStyle: 'beret',
        hairStyle: 'bald_top',  // Thin hair under beret
        mustache: '#A0A0A0'     // Grey mustache
    },

    // MARCEL - Inspired by Marco Foyot ("Le Platini", showman)
    // White tousled hair, GOLD CHAIN, charismatic, casquette
    npc_marcel: {
        skin: '#D4A880',
        hair: '#E0E0E0',        // White tousled hair!
        shirt: '#C44B3F',       // Red polo (flashy, showman)
        pants: '#5A4A38',       // Dark beige pants
        shoes: '#3A2E28',
        eyes: '#4A3020',
        hat: '#E8D5B7',         // Light casquette
        hatStyle: 'casquette',
        hairStyle: 'wild',      // Cheveux en bataille!
        chain: '#D4AA40',       // GOLD CHAIN! (signature Foyot)
        mustache: '#B0B0B0',    // Light grey stache
        expression: 'stern'
    },

    // BASTIEN "LE FENNEC" - Inspired by Dylan Rocher (young prodigy)
    // Blond, blue eyes, tanned, athletic, arrogant smirk
    npc_rival: {
        skin: '#E8C8A0',        // Bronzed/tanned
        hair: '#D4B060',        // BLOND hair! (Rocher is blond)
        shirt: '#2D2D44',       // Dark navy (competitive, serious)
        pants: '#1A1A2E',       // Very dark pants
        shoes: '#1A1510',       // Black shoes
        eyes: '#4A7AB0',        // BLUE EYES! (Rocher has blue eyes)
        hairStyle: 'spiky',     // Spiky young hairstyle
        sunglasses: false,      // On his head maybe
        expression: 'smirk'     // Arrogant smirk
    },

    // FANNY - Inspired by the legend + fine strategist
    // Strong woman, sunhat, fierce and ironic
    npc_fanny: {
        skin: '#E8C0A0',
        hair: '#8B4020',        // Auburn/red hair
        shirt: '#6B8E4E',       // Olive green (nature, herbe terrain)
        pants: '#4A6A3A',       // Dark green
        shoes: '#5A4030',
        eyes: '#4A8040',        // Green eyes
        hat: '#F0E8D0',         // Wide sunhat
        hatStyle: 'beret',      // Reuse beret shape for hat
        hairStyle: 'default'
    },

    // RICARDO - Inspired by Philippe Suchaud (international)
    // Sunglasses, cool style, beach/sand vibes
    npc_ricardo: {
        skin: '#C49870',        // Deeper tan
        hair: '#2A1A10',        // Very dark hair
        shirt: '#E8E0D0',       // White/cream linen shirt
        pants: '#C4A880',       // Sand-colored pants
        shoes: '#6B5040',
        eyes: '#3A2E28',
        sunglasses: true,       // SUNGLASSES! Cool factor
        hairStyle: 'default'
    },

    // VILLAGERS - Varied provençal folk
    npc_villager_1: {
        skin: '#E8C8A0',
        hair: '#C4854A',        // Auburn
        shirt: '#6B8E4E',       // Olive green
        pants: '#4A6A3A',
        shoes: '#503A28',
        eyes: '#3A2E28',
        hairStyle: 'default'
    },
    npc_villager_2: {
        skin: '#E8B890',
        hair: '#8B6B4A',
        shirt: '#9B7BB8',       // Lavender
        pants: '#6B5A80',
        shoes: '#3A2E28',
        eyes: '#3A2E28',
        hairStyle: 'default'
    },

    // DRESSEURS (route trainers) - each with unique look
    npc_dresseur: {
        skin: '#E8C8A0',
        hair: '#3A2E28',
        shirt: '#E8C840',       // Bright yellow (visible)
        pants: '#4A7AB0',       // Blue jeans
        shoes: '#3A2E28',
        eyes: '#3A2E28',
        hat: '#C44B3F',         // Red cap
        hatStyle: 'casquette',
        hairStyle: 'default'
    },
    npc_dresseur_2: {
        skin: '#E8C8A0',
        hair: '#C4854A',
        shirt: '#FFFFFF',       // White with blue stripes (marinière!)
        stripes: '#3A5A80',     // Blue stripes
        pants: '#6B5A80',
        shoes: '#3A2E28',
        eyes: '#3A2E28',
        hairStyle: 'default'
    },
    npc_dresseur_3: {
        skin: '#D4A880',
        hair: '#C0C0C0',        // Grey - older trainer
        shirt: '#6B8E4E',
        pants: '#4A6A3A',
        shoes: '#503A28',
        eyes: '#3A2E28',
        hat: '#8B6B4A',         // Brown hat
        hatStyle: 'beret',
        hairStyle: 'bald_top',
        mustache: '#909090'
    },

    // GATE GUARD
    npc_gate: {
        skin: '#D4A880',
        hair: '#4A3020',
        shirt: '#4A5A6A',       // Grey-blue uniform
        pants: '#3A4A5A',
        shoes: '#3A2E28',
        eyes: '#3A2E28',
        hat: '#3A4A5A',         // Matching cap
        hatStyle: 'casquette',
        hairStyle: 'default'
    },

    // GRAND MARIUS - Boss final (Quintais + Fazzino fusion)
    // Imposing, white beard, gold accents, legendary aura
    npc_marius: {
        skin: '#D4A880',
        hair: '#E8E8E8',        // Pure white hair
        shirt: '#1A1A3A',       // Dark navy (regal)
        pants: '#2A2A4A',       // Dark
        shoes: '#2A1A10',
        eyes: '#3A2E28',
        chain: '#D4AA40',       // Gold chain (like Foyot, but legend tier)
        beard: '#D0D0D0',       // White beard!
        mustache: '#D0D0D0',
        hairStyle: 'wild',
        expression: 'stern'
    }
};
